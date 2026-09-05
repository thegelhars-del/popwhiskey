/* ═══════════════════════════════════════════════════════════════════════
 *  DRAFTING — the correspondents, via the Anthropic API
 *  ---------------------------------------------------------------------
 *  The prompt is assembled in a fixed order so it caches well:
 *
 *    system[0]  personas/_canon.md      the ground truth, shared by all
 *    system[1]  personas/<writer>.md    the voice            <- cache breakpoint
 *    messages   the Society's data + the Commodore's instruction (volatile)
 *
 *  Canon and voice are identical across every request for a given writer, so
 *  they sit in front of the breakpoint and are read from cache thereafter.
 *  Nothing that changes per-request appears before it.
 *
 *  Facts are passed in from D1 and are the ONLY source of dates, times,
 *  places, scores and names. The prompt says so, twice, and the missing-data
 *  convention is spelled out rather than left to judgement.
 * ═══════════════════════════════════════════════════════════════════════ */

import Anthropic from '@anthropic-ai/sdk';

/* The guides are bundled INTO the Worker at build time rather than fetched
   over HTTP. That keeps personas/ out of the public asset upload — the canon
   file gives away how the Council trick works, and it is not for readers.
   Editing a guide and pushing still changes the writing: the push rebuilds
   the Worker, so the workflow is unchanged. */
import CANON from '../personas/_canon.md';
import SIR_REGINALD from '../personas/sir-reginald.md';
import WALL_OF_SHAME from '../personas/wall-of-shame-correspondent.md';
import AUXILIARY from '../personas/ladies-auxiliary-editor.md';
import GOLF from '../personas/junior-golf-reporter.md';

const MODEL = 'claude-opus-5';

const GUIDES = {
  'sir-reginald': SIR_REGINALD,
  'wall-of-shame-correspondent': WALL_OF_SHAME,
  'ladies-auxiliary-editor': AUXILIARY,
  'junior-golf-reporter': GOLF
};

function loadGuide(name) {
  const guide = GUIDES[name];
  if (!guide) throw new Error(`No such correspondent: ${name}`);
  return guide;
}

const OUTPUT_CONTRACT = `
Return ONE JSON object and nothing else — no preamble, no code fence, no commentary.

{
  "kicker":     "a short label above the headline, e.g. 'A Standing Matter'",
  "title":      "the headline",
  "standfirst": "one or two sentences that sell the piece on the front page",
  "body_html":  "the article body as HTML: <p> paragraphs and <h2> section headings only. No <html>, <head>, <body>, no inline styles, no classes.",
  "particulars": [ { "label": "The Day", "value": "Saturday, 18 October 2026" } ],
  "notes_for_the_commodore": "anything you could not write because the data did not supply it"
}

Rules for body_html:
- <p> and <h2> only. Use <em> for emphasis. Entities are fine.
- Two to five <h2> sections for a full article; none at all for a short notice.
- Do not write the byline, the dateline, or the headline into the body — they are rendered separately.

Rules for particulars:
- Include only what the supplied data actually states.
- Where a particular is genuinely unsettled, give the value exactly: "To be confirmed".
- Never invent a venue, a time, a score, or a name to fill a row.
`.trim();

/**
 * Draft or revise an article.
 *
 * @param env            Worker env (needs ANTHROPIC_API_KEY and ASSETS)
 * @param personaKey     persona file name, e.g. 'junior-golf-reporter'
 * @param brief          what the piece is about, in the Commodore's words
 * @param facts          structured Society data — the ONLY source of specifics
 * @param previousHtml   the current draft, when revising
 * @param instruction    plain-language change request, when revising
 */
export async function draftArticle(env, { personaKey, brief, facts, previousHtml, instruction }) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set on this Worker. Run: wrangler secret put ANTHROPIC_API_KEY');
  }

  const canon = CANON;
  const voice = loadGuide(personaKey);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  // Stable prefix: canon, then voice, then the output contract. The cache
  // breakpoint goes on the last of these — everything after it is volatile.
  const system = [
    { type: 'text', text: canon },
    { type: 'text', text: voice },
    { type: 'text', text: OUTPUT_CONTRACT, cache_control: { type: 'ephemeral' } }
  ];

  const factSheet =
    'THE SOCIETY\'S DATA — the only permitted source of dates, times, places,\n' +
    'scores, names and figures. If something is not in here, it is not known,\n' +
    'and you write "To be confirmed" rather than guessing it.\n\n' +
    JSON.stringify(facts, null, 2);

  const messages = [];

  if (previousHtml && instruction) {
    messages.push({
      role: 'user',
      content:
        factSheet +
        '\n\n---\n\nHere is the current draft:\n\n' + previousHtml +
        '\n\n---\n\nThe Commodore asks for this change:\n\n' + instruction +
        '\n\nRewrite the piece with that change made. Keep everything he did not ' +
        'ask you to change. Return the full JSON object as specified.'
    });
  } else {
    messages.push({
      role: 'user',
      content:
        factSheet +
        '\n\n---\n\nWrite the piece. The Commodore\'s brief:\n\n' + brief +
        '\n\nReturn the JSON object as specified.'
    });
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    system,
    messages
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('The model declined to write this piece.');
  }

  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')
    .trim();

  return {
    article: parseArticle(text),
    usage: response.usage
  };
}

/* The contract asks for bare JSON, but a stray fence or a line of preamble
   should not lose the Commodore his article. Recover what we can. */
function parseArticle(text) {
  let raw = text;

  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) raw = fenced[1];

  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first !== -1 && last > first) raw = raw.slice(first, last + 1);

  let obj;
  try {
    obj = JSON.parse(raw);
  } catch (e) {
    throw new Error('The correspondent filed something unparseable. Ask again, or edit by hand.');
  }

  if (!obj.title || !obj.body_html) {
    throw new Error('The draft came back missing a title or a body.');
  }

  return {
    kicker: String(obj.kicker || '').slice(0, 120),
    title: String(obj.title).slice(0, 200),
    standfirst: String(obj.standfirst || '').slice(0, 1000),
    body_html: sanitiseBody(String(obj.body_html)),
    particulars: Array.isArray(obj.particulars) ? obj.particulars.slice(0, 12) : [],
    notes: String(obj.notes_for_the_commodore || '').slice(0, 2000)
  };
}

/* The body is written into the public site, so it is narrowed to the tags the
   dispatch template actually styles. Anything else is dropped rather than
   trusted — including any script or style the model may have wrapped around it. */
function sanitiseBody(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(?:html|head|body|iframe|object|embed|form|input|link|meta)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\sstyle\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/\sclass\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    .trim();
}
