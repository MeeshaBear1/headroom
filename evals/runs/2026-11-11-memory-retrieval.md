# Check: does a fresh session open the memory note written for the job?

Twelve sessions, one per job, under
[the 2026-11-11 freeze](../prereg/2026-11-11-memory-retrieval.md). Two arms of
five and one control per arm. Direction only: the freeze licensed no contrast
and none is drawn.

| | |
|---|---|
| Question | When a job returns in a fresh session, does the session open the memory note written for it |
| Arms | `IN`: the note's line is in the loaded index. `MOVED`: the line sits in a dated file no session loads |
| Model | `claude-fable-5-2` in all twelve, from the `init` event and from `modelUsage`; no `model_fallback` event |
| CLI | `claude.exe` 2.1.319, read-only tools (`Read`, `Grep`, `Glob`), no MCP server, `apiKeySource: none` |
| Harness | `harness/retrieval.mjs`, selftest 13 cases; changed once after the freeze (Deviation 1 there) |
| Rows | `memory-retrieval-2026-11-11/rows/`, one JSON per session, path classes only |
| Transcripts | `C:\headroom-trials\retrieval-2026-11-11\`, not committed: they hold the operator's private memory |
| Infra rows | none. The one allowed re-run was not used |

## Result

| arm | opened the target note | controls |
|---|---|---|
| `IN` | **5 of 5** | `IN-C` opened none of the five: `fail-not-opened` |
| `MOVED` | **5 of 5** | `MOVED-C` opened none of the five: `fail-not-opened` |

Per session, from the committed rows:

| id | class | note opened at | moved index opened | responses | tool calls | tokens | first three calls |
|---|---|---|---|---|---|---|---|
| IN-1 | pass | call 1 | none | 7 | 28 | 387,556 | Read:target, Grep:memory-dir, Glob:repo |
| IN-2 | pass | call 1 | none | 6 | 10 | 315,134 | Read:target, Read:other-memory, Glob:memory-dir |
| IN-3 | pass | call 1 | none | 6 | 17 | 317,705 | Read:target, Read:other-memory, Read:other-memory |
| IN-4 | pass | call 1 | none | 8 | 31 | 532,372 | Read:target, Glob:cwd, Glob:repo |
| IN-5 | pass | call 1 | none | 5 | 13 | 306,497 | Read:target, Glob:repo, Glob:repo |
| MOVED-1 | pass | call 4 | 2026-11-09, after the note | 5 | 11 | 317,965 | Grep:memory-dir, Glob:memory-dir, Grep:claude-config |
| MOVED-2 | pass | call 6 | none | 4 | 12 | 237,551 | Grep:memory-dir, Glob:memory-dir, Grep:claude-config |
| MOVED-3 | pass | call 5 | 2026-11-09, after the note | 5 | 22 | 278,914 | Grep:memory-dir, Grep:memory-dir, Glob:cwd |
| MOVED-4 | pass | call 4 | 2026-11-09 and 2026-11-07, after the note | 8 | 26 | 513,508 | Grep:memory-dir, Glob:memory-dir, Glob:other |
| MOVED-5 | pass | call 4 | 2026-11-09, after the note | 8 | 26 | 579,787 | Grep:memory-dir, Glob:repo, Glob:claude-config |
| IN-C | fail-not-opened | never | none | 8 | 31 | 445,364 | Grep:memory-dir, Glob:other, Grep:claude-config |
| MOVED-C | fail-not-opened | never | none | 6 | 17 | 306,055 | Grep:memory-dir, Glob:other, Glob:other |

Tokens are the four usage fields of the `result` event added together: input,
output, cache creation and cache read. The "note opened at" column is not in
the rows; it was read from the transcripts with a throwaway script and checked
by hand on IN-3, MOVED-2 and MOVED-C.

| arm | mean responses | mean tool calls | mean CLI `num_turns` | mean tokens | of which cache read |
|---|---|---|---|---|---|
| `IN` | 6.4 | 19.8 | 16.6 | 371,853 | 298,458 |
| `MOVED` | 6.0 | 19.4 | 17.2 | 385,545 | 309,115 |

`num_turns` is not a count of model turns on this CLI. It reads tool calls plus
one on a session that ends normally and 9 on one stopped by `--max-turns 8`, so
the responses column is the one to read. The CLI priced the twelve sessions at
$8.54 at list rates in `total_cost_usd`; `apiKeySource` was `none` in every
`init` event, so the draw was on the plan and not on a key.

## Predictions, scored

| # | Prediction | Outcome |
|---|---|---|
| P1 | `IN` opens its target at least as often as `MOVED` | **Held**, as a tie. 5 against 5 |
| P2 | `IN` passes at least 3 of 5 | **Held.** 5 of 5 |
| P3 | `MOVED` passes at most 2 of 5 | **Failed.** 5 of 5 |
| P4 | Every `MOVED` pass opens a moved-index file, or greps the memory directory, before the note | **Held**, on the second branch only. All five grepped the directory on call 1. None opened a moved-index file before the note |
| P5 | Both controls fail | **Held** |

P3 is the prediction that was wrong, and the reason is in P4. The freeze
described a `MOVED` note as two reads away: the moved index, then the note. No
session took that road. Each one searched the memory directory for the job's
name on its first call, saw the note's file name in the result of call 1 or 2,
and read the note in its second response. Four of the five opened a moved-index
file later, after the note was already in hand. The moved index was not the
route to any of the five notes.

## How each arm reached its note

Every `IN` session read its note on call 1 of response 1, with no search before
it. The path was already in context from the loaded index. Every `MOVED`
session, and both controls, opened with a Grep over the memory directory. The
split is 5 of 5 and 7 of 7 and it is the clearest thing in the twelve rows.

So the index line bought three to five tool calls and one model response, and
did not buy the note: the note was opened either way. At five per arm the token
means do not lean (371,853 against 385,545).

The controls show what a miss looks like. Both searched the memory directory
for the made-up name, found nothing, and went on to search repositories and
config. `MOVED-C` read one unrelated memory note. `IN-C` met one of its arm's
five file names in a config search on call 28 and did not open it. Neither
opened an arm target, so the oracle can fail.

## What five per arm supports, and what it does not

It supports this much: on `claude-fable-5-2`, on 2026-11-11, with one phrasing,
a session asked about a named job opened that job's note in ten of ten tries,
and a line being moved out of the loaded index did not stop it in five of five.

It does not support a rate. The exact 95% interval on 5 of 5 runs from 48% to
100%. It does not show the arms are equal: 5 against 5 is the absence of a
measured difference at a size that could only have seen 5 against 0 or 5
against 1.

Four things narrow it further.

- The prompt has to name the job, and the note's file name and body carry the
  same name. The harness barred the slug and the index line from the prompt;
  it could not bar the property's name. A directory search on that name is
  what found every `MOVED` note. A job asked about by a description that
  shares no word with its note was not tried.
- All five `MOVED` lines came from one moved-index file two days old. The
  older moved files and `memory-index-overflow.md` were not sampled.
- The template asks what is owed. That invites a lookup. A request that only
  says "pick this back up" was not tried.
- Opening is not using. The oracle counts a Read of the note. Whether the
  answer repeated the note's owed items correctly was not graded, and the
  Continual-ARC preprint's second failure was the content of the note, not its
  retrieval.

The preprint's figure, a rule shown on 40 of 154 returns, came from an agent
handed six entries chosen before the task was known. These sessions could
search the store. The two numbers are not the same measurement and are not
compared here.

One model tier ran. Nothing in this record says what a workhorse-tier model
does with the same store.

## Found on the way

The `claude` on this machine's PATH is 2.1.263. The first probe ran on it,
its `init` event said `claude-fable-5-2`, and the answer came from
`claude-sonnet-5-5` after two silent fallbacks, because the API refuses that
CLI version for the two newer models. The frozen run used the VS Code
extension's 2.1.319 binary, and the harness voids any trial that carries a
`model_fallback` event. Any headless job on this machine that calls `claude`
from PATH is exposed to the same substitution. Whether the limit-resume
watcher does was not checked.

Each session left one directory under
`~/.claude/projects/C--Users-nileh/<session id>/` holding a hook's saved
output, fourteen in all with the two probes. They hold no session file and
were left in place.

The store was written to during the run by other sessions (Deviation 4). The
five `IN` targets were the rule's picks at the freeze and are not its picks
now.

## Not verified

- The 5-hour limit window. The status tool printed no figure for it at any of
  the five readings, so the 90% stop rule was never tested.
- That an owed item in any of the ten notes is still owed. It was read from
  the note's text.
- That `--max-turns` counts model responses. It is inferred from seven
  responses ending `success` and three sessions of eight ending
  `error_max_turns`.

## Re-verify

```
node harness/retrieval.mjs --selftest
node harness/retrieval.mjs report  --jobs evals/runs/memory-retrieval-2026-11-11/jobs.json
node harness/retrieval.mjs regrade --jobs evals/runs/memory-retrieval-2026-11-11/jobs.json
```

`report` reads the committed rows. `regrade` rebuilds them and needs the
transcripts, which exist only on the machine that ran the trials.
