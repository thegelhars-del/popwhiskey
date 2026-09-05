/* ═══════════════════════════════════════════════════════════════════════
 *  PUBLISHING — approved article to the live site
 *  ---------------------------------------------------------------------
 *  Publishing writes two things to the GitHub repo and lets the existing
 *  deploy do the rest:
 *
 *    dispatches/<slug>.html      the article page
 *    content/dispatches.json     the front page and the archive
 *
 *  The push triggers Cloudflare's webhook and the site rebuilds. Nothing is
 *  written anywhere until the Commodore has approved it — enforced in api.js,
 *  which refuses to call this for an article that is not 'approved'.
 * ═══════════════════════════════════════════════════════════════════════ */

const OWNER = 'thegelhars-del';
const REPO = 'popwhiskey';
const BRANCH = 'main';
const API = 'https://api.github.com';

const esc = s => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* base64 that survives non-ASCII — the house voice is full of em dashes. */
function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function fromBase64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function gh(env, path, init = {}) {
  if (!env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not set on this Worker. Run: wrangler secret put GITHUB_TOKEN');
  }
  const res = await fetch(API + path, {
    ...init,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'pwsow-gazette-engine',
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  });
  if (res.status === 404 && init.method !== 'PUT') return null;
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

async function getFile(env, path) {
  const data = await gh(env, `/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`);
  if (!data) return null;
  return { sha: data.sha, text: fromBase64(data.content) };
}

async function putFile(env, path, text, message, sha) {
  return gh(env, `/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message, branch: BRANCH, content: toBase64(text), ...(sha ? { sha } : {})
    })
  });
}

/* ── The page ──────────────────────────────────────────────────────── */
function renderPage(a, particulars) {
  const rows = (particulars || []).map(p => {
    const tbc = /^to be confirmed$/i.test(String(p.value || '').trim());
    return `            <dt>${esc(p.label)}</dt>\n            <dd>${tbc ? '<span class="tbc">To be confirmed</span>' : esc(p.value)}</dd>\n`;
  }).join('');

  const rail = rows ? `
      <aside class="dispatch-rail">
        <div class="dispatch-particulars">
          <div class="particulars-head">The Particulars</div>
          <dl>
${rows}          </dl>
          <p class="particulars-note">Unconfirmed particulars are printed as unconfirmed. The Society does not guess at a time, a place, or a verdict, and never has.</p>
        </div>
      </aside>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(a.title)} &middot; Pop Whiskey Society of Wisconsin</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cinzel:wght@400;500;600;700&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500;1,600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<div id="page-frame" aria-hidden="true">
  <div class="frame-edge frame-top"></div>
  <div class="frame-edge frame-bottom"></div>
  <div class="frame-edge frame-left"></div>
  <div class="frame-edge frame-right"></div>
</div>

<!-- nav + footer are injected by /app.js so they live in ONE place -->
<section id="dispatch">
  <div class="container">

    <a class="dispatch-back" href="/">&larr; Return to the front hall</a>

    <header class="dispatch-head">
      <p class="dispatch-kicker">By Order of the Committee &middot; Duly Entered into the Great Ledger</p>
      <h1 class="dispatch-title">${esc(a.title)}</h1>
      <p class="dispatch-deck">${esc(a.standfirst)}</p>
      <div class="dispatch-rule"><svg viewBox="0 0 200 20" width="200" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="10" x2="80" y2="10" stroke="#9a6f1e" stroke-width="0.5"/>
        <path d="M85 10 L90 4 L95 10 L100 4 L105 10 L110 4 L115 10" stroke="#9a6f1e" stroke-width="0.8" fill="none"/>
        <line x1="120" y1="10" x2="200" y2="10" stroke="#9a6f1e" stroke-width="0.5"/>
        <circle cx="100" cy="10" r="2" fill="#9a6f1e" opacity="0.6"/>
      </svg></div>
      <p class="dispatch-meta">
        <span class="dispatch-byline">Filed by ${esc(a.byline || 'the Society')}</span>
      </p>
    </header>

    <div class="dispatch-layout">
      <article class="dispatch-body">
${a.body_html}
      </article>${rail}
    </div>

    <div class="dispatch-foot">
      <a href="/dispatches/" class="btn-outline">All Dispatches</a>
      <a href="/" class="btn-primary">The Front Hall</a>
    </div>

  </div>
</section>

<script src="/app.js"></script>
</body>
</html>
`;
}

/* ── The front page and archive ────────────────────────────────────── */
function updateContent(json, a, href) {
  const data = JSON.parse(json);
  const today = new Date().toISOString().slice(0, 10);
  const display = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // The outgoing lead becomes a short dispatch, so the front page keeps depth.
  if (data.lead && data.lead.id !== a.slug) {
    data.dispatches = data.dispatches || [];
    data.dispatches.unshift({
      id: 'd-' + today + '-' + data.lead.id,
      kind: 'dispatch',
      byline: data.lead.byline,
      title: data.lead.title,
      body: data.lead.standfirst,
      href: data.lead.href,
      linkText: 'Read the dispatch',
      date: data.lead.date
    });
    data.dispatches = data.dispatches.slice(0, 3);   // quiet by default
  }

  data.lead = {
    id: a.slug,
    kicker: a.kicker || 'A Dispatch',
    title: a.title,
    byline: (a.byline || 'The Society') + (a.persona ? ' · ' + ROLE[a.persona] : ''),
    standfirst: a.standfirst,
    href, date: today
  };

  data.archive = data.archive || [];
  data.archive.unshift({
    id: a.slug, kicker: a.kicker || 'A Dispatch', title: a.title,
    byline: a.byline || 'The Society', standfirst: a.standfirst,
    href, date: today, dateDisplay: display
  });

  data.wire = data.wire || [];
  data.wire.unshift({ text: a.standfirst.split(/(?<=\.)\s/)[0], href });
  data.wire = data.wire.slice(0, 14);

  data.updated = today;
  return JSON.stringify(data, null, 2) + '\n';
}

const ROLE = {
  'sir-reginald': 'Chief Critic',
  'wall-of-shame-correspondent': 'Wall of Shame',
  'ladies-auxiliary-editor': 'Auxiliary Editor',
  'junior-golf-reporter': 'Junior Golf Reporter'
};

export async function publishArticle(env, db, a) {
  const slug = a.slug.replace(/[^a-z0-9-]/gi, '');
  const href = `/dispatches/${slug}`;
  const path = `dispatches/${slug}.html`;

  // Particulars come from the article's event, so the page reflects the
  // Society's data at the moment of publication rather than at drafting.
  let particulars = [];
  if (a.event_id) {
    const e = await db.prepare('SELECT * FROM events WHERE id = ?').bind(a.event_id).first();
    if (e) {
      particulars = [
        { label: 'The Day', value: e.event_date || 'To be confirmed' },
        { label: 'The Grounds', value: e.venue || 'To be confirmed' },
        { label: 'The Hour', value: e.event_time || 'To be confirmed' }
      ];
    }
  }

  const page = renderPage(a, particulars);
  const existing = await getFile(env, path);
  await putFile(env, path, page,
    `Publish “${a.title}” — filed by ${a.byline || 'the Society'}`, existing?.sha);

  const contentFile = await getFile(env, 'content/dispatches.json');
  if (!contentFile) throw new Error('content/dispatches.json is missing from the repo.');
  const updated = updateContent(contentFile.text, { ...a, slug }, href);
  await putFile(env, 'content/dispatches.json', updated,
    `Lead with “${a.title}”`, contentFile.sha);

  return { href, path, note: 'Committed to GitHub. Cloudflare rebuilds in about a minute.' };
}
