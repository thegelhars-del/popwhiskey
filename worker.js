/* ============================================================================
 *  Pop Whiskey Society — Cloudflare Worker (serves the whole site)
 *  ---------------------------------------------------------------------------
 *  This Worker runs in front of the static files. It does three jobs:
 *    1. Locks the Inner Sanctum  (/members/*)  behind the society password
 *       (read from the MEMBERS_PASSWORD secret — set in the dashboard).
 *    2. Runs the Kavanagh Watch API  (/api/state, /api/vote, /api/comment),
 *       saving to the PWSOW_KV namespace.
 *    3. Serves every other request as a normal static file (env.ASSETS).
 *
 *  Config lives in wrangler.jsonc (bindings ASSETS + PWSOW_KV, etc.).
 * ========================================================================== */

const COOKIE = 'pwsow_members';
const MAX_AGE = 60 * 60 * 24 * 30;            // stay signed in 30 days
const SIDES = ['thomas', 'john', 'both', 'neither'];

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

const html = (body, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

// Turn the password into an opaque token so the raw password never sits in a cookie.
async function tokenFor(password) {
  const data = new TextEncoder().encode('pwsow::' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function readCookie(header, name) {
  return (header || '').split(/;\s*/).find(c => c.startsWith(name + '='))?.split('=')[1] || '';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Kavanagh Watch API ───────────────────────────────────────────
    if (path === '/api/state') return apiState(env);
    if (path === '/api/vote' && request.method === 'POST') return apiVote(request, env);
    if (path === '/api/comment' && request.method === 'POST') return apiComment(request, env);

    // ── Inner Sanctum gate ───────────────────────────────────────────
    if (path === '/members' || path.startsWith('/members/')) {
      const denied = await guardMembers(request, env);
      if (denied) return denied;           // login page / redirect; null = let through
    }

    // ── Everything else: the static site ─────────────────────────────
    return env.ASSETS.fetch(request);
  }
};

/* ── Members gate ─────────────────────────────────────────────────────── */
async function guardMembers(request, env) {
  const password = env.MEMBERS_PASSWORD;
  // Fail safe: with no password configured, stay LOCKED (never open).
  if (!password) return html(loginPage('The members area is not configured yet.'), 503);

  const expected = await tokenFor(password);
  if (readCookie(request.headers.get('Cookie'), COOKIE) === expected) return null; // allowed

  if (request.method === 'POST') {
    const form = await request.formData();
    if ((form.get('password') || '').toString() === password) {
      return new Response(null, {
        status: 303,
        headers: {
          'Location': request.url,
          'Set-Cookie': `${COOKIE}=${expected}; Path=/members; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`
        }
      });
    }
    return html(loginPage('The Society does not recognize that passphrase.'), 401);
  }
  return html(loginPage(''), 401);
}

/* ── Kavanagh Watch API (KV-backed) ───────────────────────────────────── */
async function apiState(env) {
  const kv = env.PWSOW_KV;
  if (!kv) return json({ votes: { thomas: 0, john: 0, both: 0, neither: 0 }, comments: [], configured: false });

  const votesRaw = await kv.get('kavanagh:votes');
  const votes = votesRaw ? JSON.parse(votesRaw) : { thomas: 0, john: 0, both: 0, neither: 0 };

  const list = await kv.list({ prefix: 'kavanagh:comment:' });
  const values = await Promise.all(list.keys.map(k => kv.get(k.name)));
  const comments = values
    .filter(Boolean)
    .map(v => { try { return JSON.parse(v); } catch (e) { return null; } })
    .filter(Boolean)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 200);

  return json({ votes, comments, configured: true });
}

async function apiVote(request, env) {
  const kv = env.PWSOW_KV;
  if (!kv) return json({ error: 'The intelligence store is not yet configured.' }, 503);
  let choice;
  try { choice = (await request.json()).choice; } catch (e) { return json({ error: 'bad request' }, 400); }
  if (!SIDES.includes(choice)) return json({ error: 'unrecognised choice' }, 400);

  const raw = await kv.get('kavanagh:votes');
  const votes = raw ? JSON.parse(raw) : { thomas: 0, john: 0, both: 0, neither: 0 };
  votes[choice] = (votes[choice] || 0) + 1;
  await kv.put('kavanagh:votes', JSON.stringify(votes));
  return json({ votes });
}

async function apiComment(request, env) {
  const kv = env.PWSOW_KV;
  if (!kv) return json({ error: 'The intelligence store is not yet configured.' }, 503);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad request' }, 400); }

  const name = (body.name || 'A Member').toString().trim().slice(0, 40) || 'A Member';
  const text = (body.text || '').toString().trim().slice(0, 500);
  if (!text) return json({ error: 'empty dispatch' }, 400);

  const sideRaw = (body.side || '').toString();
  const side = SIDES.includes(sideRaw) ? sideRaw : '';

  const ts = Date.now();
  const id = ts + '-' + Math.random().toString(36).slice(2, 8);
  const comment = side ? { name, text, ts, side } : { name, text, ts };

  await kv.put('kavanagh:comment:' + id, JSON.stringify(comment), { expirationTtl: 60 * 60 * 24 * 90 });
  return json({ comment });
}

/* ── Inner Sanctum login page ─────────────────────────────────────────── */
function loginPage(error) {
  const msg = error ? `<p class="err">${error}</p>` : '';
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Members Only · Pop Whiskey Society of Wisconsin</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital@0;1&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:radial-gradient(circle at 50% 0%,#2a1400 0%,#1a0d00 60%,#0d0600 100%);
    color:#fdf5ea;font-family:'Cormorant Garamond',serif;padding:1.5rem}
  .box{max-width:440px;width:100%;text-align:center;border:1px solid rgba(212,165,48,0.35);
    background:rgba(20,10,0,0.6);padding:3rem 2.5rem;border-radius:4px;
    box-shadow:0 0 0 1px rgba(212,165,48,0.15) inset,0 20px 60px rgba(0,0,0,0.5)}
  .crest{font-size:2.2rem;color:#d4a530;margin-bottom:0.5rem}
  h1{font-family:'Cinzel Decorative',serif;font-size:1.5rem;color:#d4a530;margin-bottom:0.4rem;letter-spacing:0.04em}
  .sub{font-style:italic;color:rgba(255,245,234,0.7);margin-bottom:1.8rem}
  input{width:100%;padding:0.85rem 1rem;background:rgba(0,0,0,0.4);border:1px solid rgba(212,165,48,0.4);
    color:#fdf5ea;font-family:'Cinzel',serif;font-size:0.95rem;border-radius:3px;margin-bottom:1rem;text-align:center}
  input:focus{outline:none;border-color:#d4a530}
  button{width:100%;padding:0.85rem;background:#d4a530;color:#1e0e00;border:none;border-radius:3px;
    font-family:'Cinzel',serif;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;font-size:0.8rem;cursor:pointer}
  button:hover{background:#e6bc4f}
  .err{color:#e88;margin-bottom:1rem;font-style:italic}
  .back{display:inline-block;margin-top:1.4rem;color:rgba(212,165,48,0.7);text-decoration:none;font-size:0.85rem;letter-spacing:0.05em}
  .back:hover{color:#d4a530}
</style></head>
<body>
  <form class="box" method="POST">
    <div class="crest">&#10022;</div>
    <h1>Members Only</h1>
    <p class="sub">This wing of the Society is restricted to members in good standing.</p>
    ${msg}
    <input type="password" name="password" placeholder="Enter the society passphrase" autocomplete="current-password" autofocus required>
    <button type="submit">Enter the Inner Sanctum</button>
    <a class="back" href="/">&larr; Return to the public hall</a>
  </form>
</body></html>`;
}
