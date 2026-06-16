/* ============================================================================
 *  MEMBERS GATE  —  Cloudflare Pages Function
 *  ---------------------------------------------------------------------------
 *  This runs ON CLOUDFLARE'S SERVERS before any file under /members/ is sent.
 *  If the visitor has not entered the society password, they get the login
 *  page and the real members pages/photos are NEVER delivered to the browser.
 *  (This is the real lock — unlike the old in-page password, which only hid
 *  things after the browser had already downloaded them.)
 *
 *  SET THE PASSWORD IN THE CLOUDFLARE DASHBOARD (do NOT hard-code it here):
 *    Workers & Pages  ->  your Pages project  ->  Settings  ->
 *    Variables and Secrets  ->  add a SECRET named  MEMBERS_PASSWORD
 *  Change the password any time by editing that secret. No code change needed.
 * ========================================================================== */

const COOKIE = 'pwsow_members';
const MAX_AGE = 60 * 60 * 24 * 30; // stay signed in for 30 days

// Turn the password into an opaque token so the raw password never sits in a cookie.
async function tokenFor(password) {
  const data = new TextEncoder().encode('pwsow::' + password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function readCookie(header, name) {
  return (header || '').split(/;\s*/).find(c => c.startsWith(name + '='))?.split('=')[1] || '';
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const password = env.MEMBERS_PASSWORD;

  // Fail safe: if no password is configured yet, keep the area locked rather than open.
  if (!password) {
    return new Response(loginPage('The members area is not configured yet. Please set MEMBERS_PASSWORD.'), {
      status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const expected = await tokenFor(password);

  // Already signed in -> let the request through to the real page.
  if (readCookie(request.headers.get('Cookie'), COOKIE) === expected) {
    return next();
  }

  // Handle a login attempt.
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
    return new Response(loginPage('The Society does not recognize that passphrase.'), {
      status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // Not signed in -> show the gate.
  return new Response(loginPage(''), {
    status: 401, headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

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
