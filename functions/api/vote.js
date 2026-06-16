/* ============================================================================
 *  POST /api/vote  { "choice": "both" | "one" | "neither" }
 *  Increments the wager tally and returns the new totals.
 * ========================================================================== */
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

const CHOICES = ['thomas', 'john', 'both', 'neither'];

export async function onRequestPost({ request, env }) {
  const kv = env.PWSOW_KV;
  if (!kv) return json({ error: 'The intelligence store is not yet configured.' }, 503);

  let choice;
  try { choice = (await request.json()).choice; } catch (e) { return json({ error: 'bad request' }, 400); }
  if (!CHOICES.includes(choice)) return json({ error: 'unrecognised choice' }, 400);

  const raw = await kv.get('kavanagh:votes');
  const votes = raw ? JSON.parse(raw) : { thomas: 0, john: 0, both: 0, neither: 0 };
  votes[choice] = (votes[choice] || 0) + 1;
  await kv.put('kavanagh:votes', JSON.stringify(votes));

  return json({ votes });
}
