/* ============================================================================
 *  POST /api/comment  { "name": "...", "text": "..." }
 *  Stores one dispatch and returns it. Text is stored raw and escaped on
 *  render (see watch.html) so it can never inject markup into the page.
 * ========================================================================== */
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

export async function onRequestPost({ request, env }) {
  const kv = env.PWSOW_KV;
  if (!kv) return json({ error: 'The intelligence store is not yet configured.' }, 503);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'bad request' }, 400); }

  const name = (body.name || 'A Member').toString().trim().slice(0, 40) || 'A Member';
  const text = (body.text || '').toString().trim().slice(0, 500);
  if (!text) return json({ error: 'empty dispatch' }, 400);

  // optional: which corner this dispatch is backing (shown as a badge)
  const SIDES = ['thomas', 'john', 'both', 'neither'];
  const sideRaw = (body.side || '').toString();
  const side = SIDES.includes(sideRaw) ? sideRaw : '';

  const ts = Date.now();
  const id = ts + '-' + Math.random().toString(36).slice(2, 8);
  const comment = side ? { name, text, ts, side } : { name, text, ts };

  // 90-day retention keeps the wire from growing without bound.
  await kv.put('kavanagh:comment:' + id, JSON.stringify(comment), { expirationTtl: 60 * 60 * 24 * 90 });

  return json({ comment });
}
