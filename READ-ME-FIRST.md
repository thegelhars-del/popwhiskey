# Pop Whiskey Society — the new multi-page site

This `site/` folder is the **new version** of popwhiskey.org. It does the same
things the old single page did, but split into separate tabs/pages, with the
**Inner Sanctum** (galleries, documents, directory) locked behind a real
password. The Membership photos & bios are **public**, like before. Your old
`index.html` in the folder above is **untouched** — nothing here is live until
you push it (see "Going live" below).

---

## What's in here

| File / folder | What it is |
|---|---|
| `index.html` | Home (the crest, the welcome, the bylaws) |
| `march.html` | The Whiskey March + the chapter map |
| `shame.html` | Wall of Shame |
| `aspirancy.html` | Aspirancy + Member Spotlight + Commodore's Corner |
| `events.html` | **Events — your main weekly edit** |
| `oracle.html` | The Oracle of the Cask (slot machine) |
| `cellar.html` | Whiskey recommendations |
| `join.html` | Request an Audience form |
| `membership.html` | **The Membership** — photos & bios (PUBLIC) |
| `members/index.html` | **The Inner Sanctum** — galleries, docs, directory (LOCKED) |
| `style.css` | **All** the styling, in one place |
| `app.js` | **All** the behavior + the nav bar + the footer |
| `images/` | Every member photo, pulled out of the old page so the HTML is editable again |
| `functions/members/_middleware.js` | The real password lock for the members pages |

---

## How to edit things (the part that matters week to week)

- **The nav bar / footer links** live in ONE place now: open `app.js` and look at
  the `NAV_ITEMS` list near the top. Change a label or add a tab there and it
  updates on every page automatically. You never edit the nav in ten files.
- **Events** (your weekly update): open `events.html` and edit the event cards.
- **A whiskey in the Oracle / Cellar, or a pledge in Aspirancy**: those are tidy
  lists in `app.js` — search for `oracleWhiskeys`, `probationaryRoster`, etc.
- **Colors, fonts, spacing**: all in `style.css`.
- **A member photo**: drop a new file in `images/` and point the `<img src=...>`
  at it. No more giant base64 blobs.

---

## The Inner Sanctum lock (this is the important new bit)

Only the **Inner Sanctum** (`/members/`) is locked — the Membership photos & bios
are public. The old "Inner Sanctum" password only *hid* things with JavaScript —
anyone could view the page source and see it anyway. The new lock
(`functions/members/_middleware.js`) runs on Cloudflare's servers and refuses to
send the Inner Sanctum page at all unless the visitor has entered the password.
The public genuinely cannot see it.

**You must set the password once, in the Cloudflare dashboard:**

1. Go to **Cloudflare → Workers & Pages → your popwhiskey project**.
2. **Settings → Variables and Secrets → Add**.
3. Type: **Secret**. Name: `MEMBERS_PASSWORD`. Value: whatever passphrase you want.
4. Save and redeploy (or it applies on the next deploy).

To change the password later, just edit that secret. No code change.

---

## The Kavanagh Watch (the new voting + dispatches section)

`watch.html` is the new "The Watch" tab — a **UFC/boxing-style fight poster**:
**Kavanagh vs. Kavanagh**, July 11. The "bout" is a *devotion contest* — which
brother is more likely to shuck his real-life obligations and actually make the
long haul up from **Columbus, Ohio** to **Wausau** for the Great Northern Open
(it is NOT about winning the golf — each man's opponent is his own calendar /
the long road). Two opposite
corners (Thomas in red, John in gold), a "Tale of the Tape," a member betting
line ("The Line"), and a "Press Row" for predictions and trash talk. Members
weigh in two ways, both of which move the odds meter: the quick pick buttons on
"The Line," **and** the "My money's on" corner picker in the Press Row form (so
filing a take also casts your wager and tags your dispatch with a colored badge).
One wager per device, however it's cast.

- **To edit the fighters** (names, nicknames, corners, records, date, venue):
  open `watch.html`. It's all plain HTML near the top — look for the `EDIT`
  comments. The two nicknames ("The Elder Statesman" / "The Young Pretender")
  are placeholders — swap in real ones.
- **The pick options** are a short, clearly-commented `WATCH` list in the
  `<script>` at the bottom. The keys (`thomas`/`john`/`both`/`neither`) must match
  the `CHOICES` list in `functions/api/vote.js`.
- **It's a public page right now.** To move the whole Watch behind the members
  password instead, just tell Claude Code — it's a one-line move into `members/`.

### Make the votes & dispatches actually save (one-time setup)

The voting and comments save to a **Cloudflare KV store**. Until you create it,
the page still works in preview but shows the wire as "dark" and only remembers
your own wager on your own device. To turn on real saving:

1. **Cloudflare → Workers & Pages → KV** → **Create a namespace**, name it
   anything (e.g. `pwsow`).
2. Go to your **popwhiskey Pages project → Settings → Functions → KV namespace
   bindings → Add binding**.
3. Variable name: **`PWSOW_KV`** (exactly). Namespace: the one you just made. Save.
4. Redeploy. Votes and dispatches now persist for everyone, on every device.

(The code is in `functions/api/state.js`, `vote.js`, `comment.js`. Comments are
escaped on display, so no one can inject anything by typing HTML into a dispatch.)

---

## Going live (when you've reviewed and you're happy)

The new site lives in this `site/` subfolder so it didn't disturb your live site
while we built it. To publish, you have two clean options — Claude Code can do
either for you on request:

- **Option A (simplest):** move everything in `site/` up to the repo root
  (replacing the old `index.html`), keep `functions/` at the root, commit, push.
  Your Cloudflare Pages settings stay as they are.
- **Option B:** leave the files in `site/` and change your Cloudflare Pages
  **build output directory** to `site`. Then push.

Either way: **nothing changes on popwhiskey.org until you push to GitHub.**

To preview locally before going live, run a tiny web server from this folder, e.g.
`python -m http.server 8000` and open `http://localhost:8000/`.
(Opening the files directly with `file://` will look broken — the shared
`/style.css` and `/app.js` paths need a real server. Cloudflare serves them fine.)
