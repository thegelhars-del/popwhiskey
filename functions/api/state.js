/* ============================================================================
 *  GET /api/state  —  returns the current wager tallies + recent dispatches
 *  Backed by a Cloudflare KV namespace bound as  PWSOW_KV  (see READ-ME-FIRST).
 * ========================================================================== */
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

export async function onRequestGet({ env }) {
  const kv = env.PWSOW_KV;
  if (!kv) return json({ votes: { thomas: 0, john: 0, both: 0, neither: 0 }, comments: [], configured: false });

  const votesRaw = await kv.get('kavanagh:votes');
  const votes = votesRaw ? JSON.parse(votesRaw) : { thomas: 0, john: 0, both: 0, neither: 0 };

  // Each dispatch is its own key (kavanagh:comment:<ts>-<rand>) so concurrent
  // writers never clobber one another. We list, fetch, sort newest-first.
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
