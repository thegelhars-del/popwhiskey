/* ═══════════════════════════════════════════════════════════════════════
 *  CLOUDFLARE ACCESS — identity for the Gazette Engine
 *  ---------------------------------------------------------------------
 *  Access sits in front of /admin and hands the Worker a signed JWT. We do
 *  NOT simply trust that header: a header can be set by anyone who reaches
 *  the Worker by another route. Every request is verified properly —
 *  RS256 signature against the team's published public keys, then issuer,
 *  audience, and expiry.
 *
 *  It fails CLOSED. If ACCESS_TEAM_DOMAIN or ACCESS_AUD are not configured,
 *  or the token is missing, malformed, expired, or signed by the wrong key,
 *  nobody gets in. There is no window in which /admin is open.
 *
 *  Required configuration (wrangler secret put / vars):
 *    ACCESS_TEAM_DOMAIN   e.g. yourteam.cloudflareaccess.com
 *    ACCESS_AUD           the Application Audience tag from the Access app
 *    COMMODORE_EMAILS     comma-separated; these get the Commodore role.
 *                         Anyone else Access lets through is an Editor.
 * ═══════════════════════════════════════════════════════════════════════ */

const JWT_HEADER = 'Cf-Access-Jwt-Assertion';
const JWT_COOKIE = 'CF_Authorization';

// JWKS changes rarely. Cache per isolate, with a ceiling so key rotation is
// picked up without a redeploy.
let jwksCache = { domain: null, keys: null, fetchedAt: 0 };
const JWKS_TTL_MS = 60 * 60 * 1000;

const b64urlToBytes = (s) => {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const b64urlToText = (s) => new TextDecoder().decode(b64urlToBytes(s));

function readCookie(header, name) {
  return (header || '').split(/;\s*/)
    .find(c => c.startsWith(name + '='))?.slice(name.length + 1) || '';
}

async function getKeys(teamDomain) {
  const fresh = jwksCache.keys
    && jwksCache.domain === teamDomain
    && (Date.now() - jwksCache.fetchedAt) < JWKS_TTL_MS;
  if (fresh) return jwksCache.keys;

  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('Could not fetch Access certs: ' + res.status);
  const body = await res.json();
  const keys = body.keys || [];
  jwksCache = { domain: teamDomain, keys, fetchedAt: Date.now() };
  return keys;
}

/**
 * Verifies the Access JWT on a request.
 * Returns { ok: true, email, role, sub } or { ok: false, status, reason }.
 */
export async function identify(request, env) {
  const teamDomain = (env.ACCESS_TEAM_DOMAIN || '').trim();
  const aud = (env.ACCESS_AUD || '').trim();

  // Fail closed: unconfigured means locked, never open.
  if (!teamDomain || !aud) {
    return {
      ok: false,
      status: 503,
      reason: 'Cloudflare Access is not configured for this Worker. ' +
              'Set ACCESS_TEAM_DOMAIN and ACCESS_AUD before the admin app can be used.'
    };
  }

  const token = request.headers.get(JWT_HEADER)
    || readCookie(request.headers.get('Cookie'), JWT_COOKIE);
  if (!token) {
    return { ok: false, status: 401, reason: 'No Access token present.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { ok: false, status: 401, reason: 'Malformed Access token.' };
  }

  let header, payload;
  try {
    header = JSON.parse(b64urlToText(parts[0]));
    payload = JSON.parse(b64urlToText(parts[1]));
  } catch (e) {
    return { ok: false, status: 401, reason: 'Unreadable Access token.' };
  }

  if (header.alg !== 'RS256') {
    return { ok: false, status: 401, reason: 'Unexpected token algorithm.' };
  }

  // ── signature ───────────────────────────────────────────────────────
  let keys;
  try { keys = await getKeys(teamDomain); }
  catch (e) { return { ok: false, status: 503, reason: e.message }; }

  const jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) {
    return { ok: false, status: 401, reason: 'Token signed by an unrecognised key.' };
  }

  let verified = false;
  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      b64urlToBytes(parts[2]),
      new TextEncoder().encode(parts[0] + '.' + parts[1])
    );
  } catch (e) {
    return { ok: false, status: 401, reason: 'Token signature could not be checked.' };
  }
  if (!verified) {
    return { ok: false, status: 401, reason: 'Token signature is invalid.' };
  }

  // ── claims ──────────────────────────────────────────────────────────
  const now = Math.floor(Date.now() / 1000);
  const skew = 60;

  if (payload.iss !== `https://${teamDomain}`) {
    return { ok: false, status: 401, reason: 'Token issued by another team.' };
  }
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(aud)) {
    return { ok: false, status: 401, reason: 'Token issued for another application.' };
  }
  if (typeof payload.exp === 'number' && payload.exp + skew < now) {
    return { ok: false, status: 401, reason: 'Token has expired.' };
  }
  if (typeof payload.nbf === 'number' && payload.nbf - skew > now) {
    return { ok: false, status: 401, reason: 'Token is not yet valid.' };
  }

  const email = (payload.email || '').toLowerCase();
  if (!email) {
    return { ok: false, status: 401, reason: 'Token carries no email.' };
  }

  // ── role ────────────────────────────────────────────────────────────
  // Only the Commodore may approve or publish. Everyone else Access admits
  // is an Editor: they may read the inbox, edit drafts, and work the roster.
  const commodores = (env.COMMODORE_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const role = commodores.includes(email) ? 'commodore' : 'editor';

  return { ok: true, email, role, sub: payload.sub || '' };
}

/** Convenience guard: throws a Response when the caller may not proceed. */
export function requireCommodore(who) {
  if (who.role !== 'commodore') {
    return new Response(
      JSON.stringify({ error: 'Only the Commodore may do that.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}
