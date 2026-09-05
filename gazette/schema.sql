-- ═══════════════════════════════════════════════════════════════════════
--  THE GAZETTE ENGINE — D1 schema
--  ---------------------------------------------------------------------
--  Everything the Commodore's Desk reasons about lives here. The Desk never
--  stores a task list: it derives one from these tables every time it loads,
--  which is why the Aspirancy page can never go stale again.
--
--  Apply:  npx wrangler d1 execute pwsow-gazette --remote --file=gazette/schema.sql
-- ═══════════════════════════════════════════════════════════════════════

-- ── The roster ────────────────────────────────────────────────────────
-- Members, aspirants, and everyone in between. `standing_since` is what the
-- Desk watches: 90 days in one tier and it starts asking questions.
CREATE TABLE IF NOT EXISTS members (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  slug           TEXT    NOT NULL UNIQUE,
  status         TEXT    NOT NULL,          -- Prospect | Probationary | Secret Probationary |
                                            -- Double Secret Probationary | Associate Member |
                                            -- Member | Officer
  role           TEXT,                      -- 'Commodore', 'Vice Commodore', cohort tag, etc.
  region         TEXT,
  sponsor        TEXT,
  recognized_date TEXT,                     -- free text; the Society is not precise about this
  standing_since TEXT,                      -- ISO date the current status began
  photo          TEXT,                      -- /images/... or an R2 key
  notes          TEXT,
  on_public_site INTEGER NOT NULL DEFAULT 1,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- Every status change is news. `announced_at` is null until it has been
-- published, which is how the Desk knows there is a dispatch owing.
CREATE TABLE IF NOT EXISTS roster_changes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id    INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT    NOT NULL,
  note         TEXT,
  changed_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  announced_at TEXT,
  article_id   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_changes_unannounced ON roster_changes(announced_at);

-- ── Brain dumps ───────────────────────────────────────────────────────
-- Typed in the app, or emailed to the dispatch address. Stored raw, always.
CREATE TABLE IF NOT EXISTS dumps (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  source       TEXT    NOT NULL DEFAULT 'typed',   -- typed | email | submission
  from_addr    TEXT,
  subject      TEXT,
  body         TEXT    NOT NULL,
  received_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  processed_at TEXT,                                -- null = still sitting in the inbox
  article_id   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_dumps_unprocessed ON dumps(processed_at);

-- ── Events ────────────────────────────────────────────────────────────
-- `confirmed` 0 means the logistics are still to be settled — the Desk blocks
-- publication of anything that depends on them, and the site prints them as
-- unconfirmed rather than guessing.
CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  slug          TEXT    NOT NULL UNIQUE,
  event_date    TEXT,                        -- ISO, or null if genuinely unknown
  event_time    TEXT,
  venue         TEXT,
  confirmed     INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  covered_at    TEXT,                        -- set once post-event coverage is written
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Articles ──────────────────────────────────────────────────────────
-- Drafted, revised, approved and published one at a time. Nothing reaches the
-- site without `approved_at`, and only the Commodore may set it.
CREATE TABLE IF NOT EXISTS articles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  slug         TEXT    NOT NULL UNIQUE,
  kind         TEXT    NOT NULL DEFAULT 'dispatch',  -- dispatch | notice | oracle
  persona      TEXT,                                  -- persona file key
  byline       TEXT,
  kicker       TEXT,
  title        TEXT    NOT NULL,
  standfirst   TEXT,
  body_html    TEXT,
  status       TEXT    NOT NULL DEFAULT 'draft',      -- draft | approved | published
  event_id     INTEGER REFERENCES events(id),
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  approved_at  TEXT,
  approved_by  TEXT,
  published_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

-- Every generation and every revision, kept. The Commodore can always see what
-- he asked for and what came back.
CREATE TABLE IF NOT EXISTS article_revisions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id   INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  instruction  TEXT,                                  -- what he asked for, in plain language
  body_html    TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  created_by   TEXT
);

-- Which dumps fed which article.
CREATE TABLE IF NOT EXISTS article_dumps (
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  dump_id    INTEGER NOT NULL REFERENCES dumps(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, dump_id)
);

-- ── Member submissions ────────────────────────────────────────────────
-- From the public form. Nothing here is ever auto-published.
CREATE TABLE IF NOT EXISTS submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  kind        TEXT    NOT NULL,             -- shame | photo | rsvp
  name        TEXT,
  email       TEXT,
  body        TEXT,
  event_id    INTEGER REFERENCES events(id),
  photo_key   TEXT,                         -- R2 object key
  status      TEXT    NOT NULL DEFAULT 'pending',  -- pending | accepted | declined
  reviewed_at TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_submissions_pending ON submissions(status);

-- ── Settings ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
