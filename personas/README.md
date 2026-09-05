# The Newsroom

These are the writers. Everything the Society publishes carries one of their
names.

**You can edit any file in this folder in a plain text editor and the writing
changes.** No code, no deploy step beyond the usual push. If Sir Reginald is
being too soft, open `sir-reginald.md`, sharpen it, save. The next thing he
writes will be sharper.

## The files

| File | What it does |
|---|---|
| `_canon.md` | **Shared by everyone.** Society facts, the Council of Elders doctrine, and the hard editorial rules. Loaded into every draft, before the writer's own guide. |
| `sir-reginald.md` | Sir Reginald Hiccupsworth III — Chief Critic. Whiskey verdicts and every Pairing Oracle ruling. Deadpan. |
| `wall-of-shame-correspondent.md` | The Wall of Shame Correspondent — charges, trials, verdicts. Perpetually scandalised. |
| `ladies-auxiliary-editor.md` | The Ladies' Auxiliary Editor — society pages. Immaculate, and quietly lethal. |
| `junior-golf-reporter.md` | The Junior Golf Reporter — all golf and outings. Drunk, delighted, and factually flawless. |

## How it works

When the Gazette Engine drafts an article it builds the prompt in this order:

1. `_canon.md` — the ground truth
2. the chosen writer's file — the voice
3. the actual Society data for the piece — dates, names, scores, your notes

The writer files never contain facts about events. Facts come from your data,
every time. That separation is what stops anything being invented.

## Which writer gets what

- **Whiskey, bottles, releases, pairings, official verdicts** → Sir Reginald
- **Charges, demerits, infractions, anything for the Wall** → the Correspondent
- **Auxiliary business, hosting, comportment, society pages** → the Auxiliary
  Editor
- **Golf, outings, croquet, curling, any competition** → the Junior Golf Reporter

Roster movements — promotions, inductions, recognitions — are **notices**, not
articles. They carry no byline. They are issued by the Society itself, which is
to say by the Council, which is to say by nobody you can name.

## The one rule that outranks the others

Read the Council of Elders section in `_canon.md` before you change anything. The
mystery runs through every piece, it never resolves, and no member of the Council
is ever named. If an edit you are making would identify who sits on it, the edit
is wrong.
