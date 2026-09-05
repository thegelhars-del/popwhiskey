/* ═══════════════════════════════════════════════════════════════════════
 *  THE GAZETTE ENGINE — admin API
 *  ---------------------------------------------------------------------
 *  Every route here sits behind Cloudflare Access (see auth.js). The
 *  Commodore may do anything; an Editor may do everything except approve
 *  and publish.
 * ═══════════════════════════════════════════════════════════════════════ */

import { requireCommodore } from './auth.js';
import { draftArticle } from './draft.js';
import { publishArticle } from './publish.js';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

const slugify = s => String(s).toLowerCase()
  .replace(/&[a-z]+;/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const daysBetween = (a, b) => Math.floor((b - a) / 86400000);

/* ═══ THE COMMODORE'S DESK ═══════════════════════════════════════════════
   Derived on every load. Nothing here is stored; there is no task list to
   keep up to date, which is precisely why it cannot fall out of date.
   ═══════════════════════════════════════════════════════════════════════ */
async function desk(env) {
  const db = env.GAZETTE_DB;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const staleDays = 90;

  const [events, dumps, roster, subs, changes, articles] = await Promise.all([
    db.prepare('SELECT * FROM events ORDER BY event_date IS NULL, event_date').all(),
    db.prepare('SELECT * FROM dumps WHERE processed_at IS NULL ORDER BY received_at').all(),
    db.prepare("SELECT * FROM members WHERE status != 'Member' AND standing_since IS NOT NULL").all(),
    db.prepare("SELECT * FROM submissions WHERE status = 'pending' ORDER BY created_at").all(),
    db.prepare(`SELECT rc.*, m.name FROM roster_changes rc
                JOIN members m ON m.id = rc.member_id
                WHERE rc.announced_at IS NULL ORDER BY rc.changed_at`).all(),
    db.prepare("SELECT * FROM articles WHERE status != 'published' ORDER BY updated_at DESC").all()
  ]);

  const tasks = [];
  const add = t => tasks.push(t);

  // 1. Unconfirmed logistics on an event that has not happened yet. These
  //    block publication of anything that depends on them.
  for (const e of events.results) {
    if (!e.event_date || e.event_date < today) continue;
    if (e.confirmed) continue;
    const missing = [];
    if (!e.venue) missing.push('venue');
    if (!e.event_time) missing.push('tee time');
    add({
      urgency: 1,
      kind: 'blocking',
      title: `${e.name} — logistics unconfirmed`,
      detail: missing.length
        ? `Still to settle: ${missing.join(' and ')}. Anything written about this event will print "To be confirmed" until you fill them in.`
        : 'Marked unconfirmed. Confirm it so coverage can go out.',
      screen: 'events',
      ref: e.id,
      meta: `${daysBetween(now, new Date(e.event_date))} days away`
    });
  }

  // 2. An event has passed and nobody has written it up. Ask for the notes
  //    while the day is still fresh.
  for (const e of events.results) {
    if (!e.event_date || e.event_date >= today || e.covered_at) continue;
    const since = daysBetween(new Date(e.event_date), now);
    if (since > 365) continue;                    // ancient history, let it lie
    add({
      urgency: 2,
      kind: 'followup',
      title: `${e.name} has been and gone`,
      detail: 'No coverage filed. Dump your notes and Mr. Prescott will write it up.',
      screen: 'inbox',
      ref: e.id,
      meta: `${since} days ago`
    });
  }

  // 3. Anyone sitting in the same tier too long. This is the Aspirancy
  //    problem, and it is now the Desk's problem rather than the Commodore's
  //    memory.
  for (const m of roster.results) {
    const days = daysBetween(new Date(m.standing_since), now);
    if (days < staleDays) continue;
    add({
      urgency: 3,
      kind: 'stale',
      title: `${m.name} — ${days} days at ${m.status}`,
      detail: 'Promote him, or acknowledge him and reset the clock. Either is fine; leaving him is not.',
      screen: 'roster',
      ref: m.id,
      meta: `${(days / 365).toFixed(1)} years`
    });
  }

  // 4. Dumps nobody has turned into anything.
  for (const d of dumps.results) {
    const age = daysBetween(new Date(d.received_at.replace(' ', 'T') + 'Z'), now);
    add({
      urgency: age > 7 ? 3 : 5,
      kind: 'dump',
      title: d.subject || (d.body || '').slice(0, 60) + '…',
      detail: `Sitting for ${age} day${age === 1 ? '' : 's'}. Turn it into a draft, or mark it done.`,
      screen: 'inbox',
      ref: d.id,
      meta: d.source === 'email' ? `emailed in${d.from_addr ? ' — ' + d.from_addr : ''}` : d.source
    });
  }

  // 5. Member submissions awaiting review, with RSVP counts rolled up.
  const rsvpByEvent = {};
  let shame = 0, photos = 0;
  for (const s of subs.results) {
    if (s.kind === 'rsvp') rsvpByEvent[s.event_id] = (rsvpByEvent[s.event_id] || 0) + 1;
    else if (s.kind === 'shame') shame++;
    else if (s.kind === 'photo') photos++;
  }
  if (shame) add({ urgency: 4, kind: 'submission', title: `${shame} Wall of Shame nomination${shame === 1 ? '' : 's'} awaiting you`, detail: 'Nothing a member sends is published without your say-so.', screen: 'submissions', ref: 'shame' });
  if (photos) add({ urgency: 4, kind: 'submission', title: `${photos} photo${photos === 1 ? '' : 's'} awaiting review`, detail: 'Approve them and they become available to attach to articles.', screen: 'submissions', ref: 'photo' });
  for (const [eventId, n] of Object.entries(rsvpByEvent)) {
    const ev = events.results.find(e => String(e.id) === String(eventId));
    add({ urgency: 5, kind: 'submission', title: `${n} RSVP${n === 1 ? '' : 's'} — ${ev ? ev.name : 'an event'}`, detail: 'Running count from the members\' form.', screen: 'submissions', ref: 'rsvp' });
  }

  // 6. Status changes made on the Roster screen but never announced.
  for (const c of changes.results) {
    add({
      urgency: 3,
      kind: 'unannounced',
      title: `${c.name}: ${c.from_status || 'new'} → ${c.to_status}`,
      detail: 'Changed on the roster but never announced. Every status change is news.',
      screen: 'drafts',
      ref: c.id
    });
  }

  // 7. Drafts waiting on a decision.
  for (const a of articles.results) {
    add({
      urgency: a.status === 'approved' ? 2 : 4,
      kind: a.status === 'approved' ? 'ready' : 'draft',
      title: a.status === 'approved' ? `“${a.title}” is approved and not yet published` : `“${a.title}” is still a draft`,
      detail: a.status === 'approved' ? 'Publish it when you are ready.' : 'Read it, ask for changes, or approve it.',
      screen: 'drafts',
      ref: a.id,
      meta: a.byline || ''
    });
  }

  tasks.sort((a, b) => a.urgency - b.urgency);

  // The next issue: the first day of next month, and what it is missing.
  const nextIssue = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const approved = articles.results.filter(a => a.status === 'approved');
  const checklist = [
    { item: 'A lead article', done: approved.length > 0 },
    { item: 'A Ladies\' Auxiliary column', done: approved.some(a => /ashby|auxiliary/i.test(a.byline + a.title)) },
    { item: 'Wall of Shame movement', done: approved.some(a => /vance|shame/i.test(a.byline + a.title)) },
    { item: 'Roster movements announced', done: changes.results.length === 0 },
    { item: 'Events carry real dates', done: !events.results.some(e => e.event_date >= today && !e.confirmed) }
  ];

  return json({
    tasks,
    counts: {
      blocking: tasks.filter(t => t.kind === 'blocking').length,
      dumps: dumps.results.length,
      stale: tasks.filter(t => t.kind === 'stale').length,
      submissions: subs.results.length,
      drafts: articles.results.length
    },
    issue: { dueIn: daysBetween(now, nextIssue), due: nextIssue.toISOString().slice(0, 10), checklist }
  });
}

/* ═══ ROUTER ════════════════════════════════════════════════════════════ */
export async function handleAdminApi(request, env, who, path) {
  const db = env.GAZETTE_DB;
  if (!db) return json({ error: 'The Gazette database is not bound to this Worker.' }, 503);

  const seg = path.replace(/^\/api\/admin\/?/, '').split('/').filter(Boolean);
  const [head, id, action] = seg;
  const method = request.method;
  const body = ['POST', 'PATCH', 'PUT'].includes(method)
    ? await request.json().catch(() => ({})) : {};

  // ── who am I ──────────────────────────────────────────────────────
  if (head === 'me') return json({ email: who.email, role: who.role });

  // ── the desk ──────────────────────────────────────────────────────
  if (head === 'desk') return desk(env);

  // ── inbox ─────────────────────────────────────────────────────────
  if (head === 'dumps') {
    if (method === 'GET') {
      const rows = await db.prepare(
        'SELECT * FROM dumps ORDER BY processed_at IS NOT NULL, received_at DESC LIMIT 200'
      ).all();
      return json(rows.results);
    }
    if (method === 'POST' && !id) {
      const text = String(body.body || '').trim();
      if (!text) return json({ error: 'Nothing to file.' }, 400);
      const r = await db.prepare(
        'INSERT INTO dumps (source, subject, body, from_addr) VALUES (?, ?, ?, ?)'
      ).bind('typed', String(body.subject || '').slice(0, 200) || null, text, who.email).run();
      return json({ id: r.meta.last_row_id });
    }
    if (method === 'POST' && id && action === 'processed') {
      await db.prepare("UPDATE dumps SET processed_at = datetime('now') WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }
    if (method === 'POST' && id && action === 'reopen') {
      await db.prepare('UPDATE dumps SET processed_at = NULL WHERE id = ?').bind(id).run();
      return json({ ok: true });
    }
  }

  // ── roster ────────────────────────────────────────────────────────
  if (head === 'roster') {
    if (method === 'GET') {
      const rows = await db.prepare(`
        SELECT *, CAST(julianday('now') - julianday(standing_since) AS INT) AS days_in_status
        FROM members ORDER BY
          CASE status WHEN 'Member' THEN 3 WHEN 'Associate Member' THEN 2 ELSE 1 END,
          days_in_status DESC, name`).all();
      return json(rows.results);
    }
    if (method === 'PATCH' && id) {
      const cur = await db.prepare('SELECT * FROM members WHERE id = ?').bind(id).first();
      if (!cur) return json({ error: 'No such member.' }, 404);

      const next = String(body.status || cur.status);
      const fields = {
        status: next,
        region: body.region ?? cur.region,
        sponsor: body.sponsor ?? cur.sponsor,
        notes: body.notes ?? cur.notes,
        standing_since: next !== cur.status ? new Date().toISOString().slice(0, 10) : cur.standing_since
      };
      await db.prepare(`UPDATE members SET status=?, region=?, sponsor=?, notes=?,
                        standing_since=?, updated_at=datetime('now') WHERE id=?`)
        .bind(fields.status, fields.region, fields.sponsor, fields.notes, fields.standing_since, id).run();

      // A status change is news. Queue it; the Desk will chase it.
      if (next !== cur.status) {
        await db.prepare(
          'INSERT INTO roster_changes (member_id, from_status, to_status, note) VALUES (?, ?, ?, ?)'
        ).bind(id, cur.status, next, String(body.note || '').slice(0, 500) || null).run();
      }
      return json({ ok: true, statusChanged: next !== cur.status });
    }
  }

  // ── events ────────────────────────────────────────────────────────
  if (head === 'events') {
    if (method === 'GET') {
      const rows = await db.prepare('SELECT * FROM events ORDER BY event_date IS NULL, event_date').all();
      return json(rows.results);
    }
    if (method === 'PATCH' && id) {
      const cur = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first();
      if (!cur) return json({ error: 'No such event.' }, 404);
      await db.prepare(`UPDATE events SET event_date=?, event_time=?, venue=?, confirmed=?,
                        notes=?, updated_at=datetime('now') WHERE id=?`)
        .bind(body.event_date ?? cur.event_date, body.event_time ?? cur.event_time,
              body.venue ?? cur.venue, body.confirmed === undefined ? cur.confirmed : (body.confirmed ? 1 : 0),
              body.notes ?? cur.notes, id).run();
      return json({ ok: true });
    }
  }

  // ── submissions ───────────────────────────────────────────────────
  if (head === 'submissions') {
    if (method === 'GET') {
      const rows = await db.prepare('SELECT * FROM submissions ORDER BY status, created_at DESC LIMIT 300').all();
      return json(rows.results);
    }
    if (method === 'PATCH' && id) {
      const status = ['pending', 'accepted', 'declined'].includes(body.status) ? body.status : 'pending';
      await db.prepare("UPDATE submissions SET status=?, reviewed_at=datetime('now') WHERE id=?")
        .bind(status, id).run();
      return json({ ok: true });
    }
  }

  // ── articles ──────────────────────────────────────────────────────
  if (head === 'articles') {
    if (method === 'GET' && !id) {
      const rows = await db.prepare('SELECT * FROM articles ORDER BY updated_at DESC LIMIT 100').all();
      return json(rows.results);
    }
    if (method === 'GET' && id) {
      const a = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
      if (!a) return json({ error: 'No such article.' }, 404);
      const revs = await db.prepare(
        'SELECT id, instruction, created_at, created_by FROM article_revisions WHERE article_id=? ORDER BY id DESC'
      ).bind(id).all();
      return json({ ...a, revisions: revs.results });
    }

    // Draft a new one.
    if (method === 'POST' && !id) {
      const facts = await gatherFacts(env, body);
      let drafted;
      try {
        drafted = await draftArticle(env, {
          personaKey: body.persona || 'junior-golf-reporter',
          brief: String(body.brief || '').slice(0, 4000),
          facts
        });
      } catch (e) {
        return json({ error: e.message }, 502);
      }
      const a = drafted.article;
      const slug = slugify(body.slug || a.title) + '-' + Date.now().toString(36).slice(-4);
      const r = await db.prepare(`INSERT INTO articles
        (slug, kind, persona, byline, kicker, title, standfirst, body_html, status, event_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)`)
        .bind(slug, body.kind || 'dispatch', body.persona || 'junior-golf-reporter',
              BYLINES[body.persona] || null, a.kicker, a.title, a.standfirst, a.body_html,
              body.event_id || null).run();

      const articleId = r.meta.last_row_id;
      await db.prepare('INSERT INTO article_revisions (article_id, instruction, body_html, created_by) VALUES (?, ?, ?, ?)')
        .bind(articleId, '(first draft)', a.body_html, who.email).run();

      for (const dumpId of (body.dump_ids || [])) {
        await db.prepare('INSERT OR IGNORE INTO article_dumps (article_id, dump_id) VALUES (?, ?)').bind(articleId, dumpId).run();
        await db.prepare("UPDATE dumps SET processed_at = datetime('now'), article_id = ? WHERE id = ?").bind(articleId, dumpId).run();
      }
      return json({ id: articleId, notes: a.notes, particulars: a.particulars, usage: drafted.usage });
    }

    // Revise — plain-language instructions, regenerated in voice.
    if (method === 'POST' && id && action === 'revise') {
      const a = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
      if (!a) return json({ error: 'No such article.' }, 404);
      if (a.status === 'published') return json({ error: 'That one is already published.' }, 400);

      const instruction = String(body.instruction || '').trim();
      if (!instruction) return json({ error: 'Say what you would like changed.' }, 400);

      const facts = await gatherFacts(env, { event_id: a.event_id });
      let drafted;
      try {
        drafted = await draftArticle(env, {
          personaKey: a.persona || 'junior-golf-reporter',
          facts, previousHtml: a.body_html, instruction
        });
      } catch (e) {
        return json({ error: e.message }, 502);
      }
      const n = drafted.article;
      await db.prepare(`UPDATE articles SET kicker=?, title=?, standfirst=?, body_html=?,
                        status='draft', approved_at=NULL, approved_by=NULL, updated_at=datetime('now')
                        WHERE id=?`)
        .bind(n.kicker, n.title, n.standfirst, n.body_html, id).run();
      await db.prepare('INSERT INTO article_revisions (article_id, instruction, body_html, created_by) VALUES (?, ?, ?, ?)')
        .bind(id, instruction, n.body_html, who.email).run();
      return json({ ok: true, notes: n.notes });
    }

    // Direct edit — the fallback when it is quicker to fix it yourself.
    if (method === 'PATCH' && id) {
      const a = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
      if (!a) return json({ error: 'No such article.' }, 404);
      await db.prepare(`UPDATE articles SET kicker=?, title=?, standfirst=?, body_html=?,
                        status = CASE WHEN status='approved' THEN 'draft' ELSE status END,
                        approved_at=NULL, updated_at=datetime('now') WHERE id=?`)
        .bind(body.kicker ?? a.kicker, body.title ?? a.title,
              body.standfirst ?? a.standfirst, body.body_html ?? a.body_html, id).run();
      return json({ ok: true });
    }

    // Approve — the Commodore alone.
    if (method === 'POST' && id && action === 'approve') {
      const denied = requireCommodore(who); if (denied) return denied;
      await db.prepare("UPDATE articles SET status='approved', approved_at=datetime('now'), approved_by=? WHERE id=?")
        .bind(who.email, id).run();
      return json({ ok: true });
    }
    if (method === 'POST' && id && action === 'unapprove') {
      const denied = requireCommodore(who); if (denied) return denied;
      await db.prepare("UPDATE articles SET status='draft', approved_at=NULL, approved_by=NULL WHERE id=?").bind(id).run();
      return json({ ok: true });
    }

    // Publish — the Commodore alone, and only what he has approved.
    if (method === 'POST' && id && action === 'publish') {
      const denied = requireCommodore(who); if (denied) return denied;
      const a = await db.prepare('SELECT * FROM articles WHERE id = ?').bind(id).first();
      if (!a) return json({ error: 'No such article.' }, 404);
      if (a.status !== 'approved') return json({ error: 'Approve it first. Nothing publishes unapproved.' }, 400);
      try {
        const result = await publishArticle(env, db, a);
        await db.prepare("UPDATE articles SET status='published', published_at=datetime('now') WHERE id=?").bind(id).run();
        await db.prepare("UPDATE roster_changes SET announced_at=datetime('now'), article_id=? WHERE announced_at IS NULL").bind(id).run();
        return json({ ok: true, ...result });
      } catch (e) {
        return json({ error: e.message }, 502);
      }
    }
  }

  // ── export ────────────────────────────────────────────────────────
  if (head === 'export' && method === 'GET') {
    const tables = ['members', 'roster_changes', 'dumps', 'events', 'articles', 'article_revisions', 'submissions', 'settings'];
    const dump = { exported_at: new Date().toISOString(), by: who.email };
    for (const t of tables) {
      dump[t] = (await db.prepare(`SELECT * FROM ${t}`).all()).results;
    }
    return new Response(JSON.stringify(dump, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gazette-${new Date().toISOString().slice(0, 10)}.json"`
      }
    });
  }

  return json({ error: 'No such endpoint.' }, 404);
}

const BYLINES = {
  'sir-reginald': 'Sir Reginald Hiccupsworth III',
  'wall-of-shame-correspondent': 'Mr. Edmund Vance',
  'ladies-auxiliary-editor': 'Mrs. Eleanor Ashby',
  'junior-golf-reporter': 'Mr. Barnaby Prescott'
};

/* Assembles the ONLY facts a correspondent is allowed to use. */
async function gatherFacts(env, body) {
  const db = env.GAZETTE_DB;
  const facts = { today: new Date().toISOString().slice(0, 10) };

  if (body.event_id) {
    const e = await db.prepare('SELECT * FROM events WHERE id = ?').bind(body.event_id).first();
    if (e) {
      facts.event = {
        name: e.name,
        date: e.event_date || null,
        time: e.event_time || null,
        venue: e.venue || null,
        logistics_confirmed: !!e.confirmed,
        notes: e.notes || null
      };
      if (!e.confirmed) {
        facts.event.WARNING = 'Logistics are NOT confirmed. Any unset field above must be printed as "To be confirmed".';
      }
    }
  }

  if (body.member_ids?.length) {
    const rows = await db.prepare(
      `SELECT name, status, region, sponsor, recognized_date, standing_since, notes
       FROM members WHERE id IN (${body.member_ids.map(() => '?').join(',')})`
    ).bind(...body.member_ids).all();
    facts.members = rows.results;
  }

  if (body.dump_ids?.length) {
    const rows = await db.prepare(
      `SELECT subject, body, received_at FROM dumps WHERE id IN (${body.dump_ids.map(() => '?').join(',')})`
    ).bind(...body.dump_ids).all();
    facts.the_commodores_notes = rows.results;
  }

  const changes = await db.prepare(
    `SELECT m.name, rc.from_status, rc.to_status, rc.changed_at, rc.note
     FROM roster_changes rc JOIN members m ON m.id = rc.member_id
     WHERE rc.announced_at IS NULL ORDER BY rc.changed_at DESC LIMIT 20`
  ).all();
  if (changes.results.length) facts.unannounced_roster_changes = changes.results;

  return facts;
}
