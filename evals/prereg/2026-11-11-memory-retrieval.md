# Freeze: does a fresh session open the memory note written for the job?

Committed before trial 1. Two arms of five jobs, one control per arm, twelve
sessions in all. Direction only: no contrast is licensed by this freeze under
any outcome.

| | |
|---|---|
| Question | When a job returns in a fresh session, does the session open the memory note written for it |
| Memory under test | `~/.claude/projects/C--Users-nileh/memory/`, the store the CLI loads for any session whose cwd is `C:\Users\nileh` |
| Arms | `IN`: the note's line is in `MEMORY.md`, which is loaded into every session. `MOVED`: the line was moved to a `memory-index-moved-<date>.md` file, which is not loaded |
| n | 5 jobs per arm, 1 control per arm, 1 session per job |
| Harness | `harness/retrieval.mjs`, sha256 `d0ede5f3630fe257`, selftest 13 cases |
| Jobs file | `evals/runs/memory-retrieval-2026-11-11/jobs.json`, committed with this freeze |
| CLI | `claude.exe` 2.1.319, the VS Code extension's binary, at the path in the jobs file |
| Model | the operator's default, unpinned. Recorded per trial from the `init` event and from `modelUsage` in the `result` event |
| Budget | twelve sessions on the operator's claude.ai login, one re-run allowed for a trial that died on infrastructure |

## Why

Unify's Continual-ARC paper reports that the notes an agent kept failed first at
retrieval: the harness kept a rule for every task and showed six entries per
instance, chosen before the task was known, so the rule reached the agent on 40
of 154 returns (section 4, Appendix E.2 of the preprint). This repository has
measured whether a skill is opened ([the Haiku 4.5 description swap](../runs/2026-09-17-desc-swap-haiku45.md),
0 of 40) and has never measured the same thing for the operator's own memory.

The store has the paper's shape. `MEMORY.md` is an index with one line per
note. Lines that no longer fit are moved, verbatim, into dated files that no
session loads, and a single index line names those files. A note in arm `MOVED`
is two reads from the session: the moved index, then the note.

## Selection rule, written before it was applied

An entry is a line that begins `- [title](file.md)` whose first link is a bare
file name in the memory directory, excluding `MEMORY.md` and any
`memory-index-*` file. An entry qualifies when its file exists, its frontmatter
says `type: project`, and its body matches `/\bowed\b|\bowes\b/i`.

Arm `IN`: the qualifying entries of `MEMORY.md`, sorted by the frontmatter
`modified` stamp, newest first, file mtime where the stamp is missing. The first
five.

Arm `MOVED`: the `memory-index-moved-<date>.md` files, newest date first, each
read top to bottom. The first five qualifying entries whose file is not also an
entry of `MEMORY.md`.

`node harness/retrieval.mjs select` applies the rule and
`node harness/retrieval.mjs check --jobs <jobs.json>` fails if a frozen target
is not one the rule picks. "Still owed" is read from the note's own text. No
owed item was checked against git, GitHub or a live site.

Applied at 21:00 PST on 2026-11-11, `MEMORY.md` sha256 `79d77d99e13e408f`. The
index is live: its hash changed twice in the thirty minutes before the freeze,
and the order of arm `IN` changed with it while the five files did not. The
hash is read again after the last trial.

## The jobs

One template for every prompt, so that no prompt is tuned to its note:

> {job}: where did we leave this, and what is still owed? Read only for now, change nothing.

`{job}` names the property and the work in eight words or fewer. The harness
refuses a prompt that names a `.md` file, contains the note's slug with or
without its date, or repeats four consecutive words of the note's index line.
The index line is read from the memory directory at run time and is not stored
in this repository.

| id | target note | `{job}` |
|---|---|---|
| IN-1 | `note-in-1.md` | [job IN-1, name withheld] |
| IN-2 | `note-in-2.md` | [job IN-2, name withheld] |
| IN-3 | `note-in-3.md` | [job IN-3, name withheld] |
| IN-4 | `note-in-4.md` | [job IN-4, name withheld] |
| IN-5 | `note-in-5.md` | [job IN-5, name withheld] |
| MOVED-1 | `note-moved-1.md` | [job MOVED-1, name withheld] |
| MOVED-2 | `note-moved-2.md` | [job MOVED-2, name withheld] |
| MOVED-3 | `note-moved-3.md` | [job MOVED-3, name withheld] |
| MOVED-4 | `note-moved-4.md` | [job MOVED-4, name withheld] |
| MOVED-5 | `note-moved-5.md` | [job MOVED-5, name withheld] |

The job names and the note file names are withheld from this public copy, and each is
replaced by its row id. The freeze as it was written is commit `c525fcd` in the private
checkout; nothing else in this file differs from it.
| IN-C | none: control | Quillmere, the letterpress shop site |
| MOVED-C | none: control | Tamarack Post, the timber pricing dashboard |

All five `MOVED` entries come from `memory-index-moved-2026-11-09.md`.

The two control jobs do not exist. Neither name occurs in any file of the
memory directory or in any repository directory name, checked with the Grep
tool and with a raw `grep -rlai`, both zero. A control is graded against all
five targets of its arm and passes if it opens any of them.

## One trial

One session per job, run one at a time, in the order IN-1, MOVED-1, IN-2,
MOVED-2 and so on, with the two controls last.

```
claude.exe -p --output-format stream-json --verbose --max-turns 8
  --tools Read,Grep,Glob --strict-mcp-config --no-session-persistence
```

The cwd is `C:\Users\nileh`. Every other harness in this repository stages
trials outside the home tree, because the CLI loads memory by walking up from
the cwd ([Defect 6](../runs/2026-09-26-seal-regate-rule-drift-sonnet5.md)). Here
that load is the thing under test. The parent session's `CLAUDE*` and
`ANTHROPIC_*` variables are removed from the child's environment, so the child
runs on the operator's claude.ai login with the operator's settings, hooks,
plugins and default model. `--no-session-persistence` keeps the twelve sessions
out of the operator's session list, where the limit-resume watcher could
otherwise fork one of them later with every tool restored.

Eight turns is the ceiling. A session that has not opened the note within eight
turns is graded as it stands.

## The seal, and how it was checked

A trial must be unable to write, edit, run a shell command or start an agent.
That is enforced by `--tools` and `--strict-mcp-config` and checked on every
trial from the transcript: a session whose `init` event lists any tool other
than `Read`, `Grep` and `Glob`, or any MCP server, is classed `infra-unsealed`
and is not graded. The same holds for an `init` whose `apiKeySource` is not
`none`, which would mean the session billed an API key and not the plan.

Two throwaway probes ran before this freeze. Each was asked to quote the first
bullet of its memory index without a tool, list its tools, create a file, run
`echo probe` and start a subagent.

| probe | CLI | `init` tools | MCP servers | `apiKeySource` | model that answered | index quoted | tool calls | file created |
|---|---|---|---|---|---|---|---|---|
| 1 | `claude` on PATH, 2.1.263 | Glob, Grep, Read | none | none | `claude-sonnet-5-5`, after two fallbacks | yes | 0 | no |
| 2 | extension binary, 2.1.319 | Glob, Grep, Read | none | none | `claude-fable-5-2` | yes | 0 | no |

Probe 1 is why there are two. The `claude` on this machine's PATH is 2.1.263.
The API refuses it for `claude-fable-5-2` (2.1.290 or newer) and for
`claude-opus-5-5` (2.1.280 or newer), and the CLI fell back twice without
stopping, so a session whose `init` event says `claude-fable-5-2` was answered
by `claude-sonnet-5-5`. The operator's own sessions run on the extension's
2.1.319 binary, so the frozen run uses that binary, and the harness now classes
any trial with a `model_fallback` event as `infra-model-fallback`. Neither probe
left a session file. Each left one directory holding a hook's saved output
under `~/.claude/projects/C--Users-nileh/<session id>/`.

## The oracle

Pass: the transcript contains a `Read` whose `file_path` is the target note, or
a `Grep` with `output_mode: "content"` whose `path` is the target note, and that
call has a result that is not an error. Positive evidence only. A transcript
that names the note, lists it with a Grep over the directory, or answers the
question from the index line is a fail, class `fail-not-opened`.

Recorded beside the verdict and never counted toward it: which moved-index
files the session opened, how many other memory files it opened, and whether
the target's file name appears anywhere in the transcript. No model is in the
grading path. `node harness/retrieval.mjs --selftest` grades one canned passing
transcript and one canned failing transcript, the second of which names the
note, lists it and has a Read of it refused.

Transcripts hold the operator's private memory and are written to
`C:\headroom-trials\retrieval-2026-11-11\`, outside this repository. A committed
row carries the class of each path a session touched (`target`, `MEMORY.md`, a
moved-index file name, `other-memory`, `memory-dir`, `claude-config`, `repo`,
`other`) and no path.

## Predictions, frozen

| # | Prediction |
|---|---|
| P1 | Arm `IN` opens its target at least as often as arm `MOVED` |
| P2 | Arm `IN` passes at least 3 of 5 |
| P3 | Arm `MOVED` passes at most 2 of 5 |
| P4 | Every `MOVED` pass opens a moved-index file, or greps the memory directory, before it opens the note |
| P5 | Both controls fail |

## What five per arm can and cannot say

It can say which way the two arms lean and what the first three tool calls of a
miss look like. It cannot give a rate. An exact 95% interval on 3 of 5 runs from
15% to 95%. Fisher's exact test, two-sided, clears 0.05 between two arms of five
only at 5 against 0, 5 against 1 or 4 against 0. Any other split is reported as
a direction and no p-value is quoted for it.

A control that passes means the oracle fires on a session that was asked about
nothing in the store, and both arm scores are then reported as unreadable.

## Spend and abort

`python ~/.claude/hooks/limit-watch.py status` is read before trial 1 and after
every third trial. A 5-hour reading of 90% or more stops the run where it
stands and the record reports what ran. Before the freeze the tool printed no
5-hour figure from this session: `5h --`, with the 7-day window at 10% and the
Fable window at 17%.

A row classed `infra-*` is not graded. It may be re-run once; the first row is
kept as `<id>.infra-1.json`. A graded row is never re-run.

## Known limits, stated before the data

- One model, one day, one operator's store, one phrasing of the request.
- IN-1's note records the analysis that ordered this run, and its index line
  mentions a retrieval trial. The rule picked it and it stays in.
- The property named in MOVED-1 has three newer lines in `MEMORY.md`, and the
  one in MOVED-4 has one. A session can answer those from a newer note without
  the target. That is scored as a fail, and the count of other memory files
  opened is in the row.
- The operator's hooks run in every trial. A Stop hook that sends a reply back
  costs a turn.
- The prompt asks what is owed, and an `IN` index line often lists it. A session
  that answers from the line alone has not opened the note, and that is the
  behaviour being counted.

## Deviations

Recorded here as they occur, dated, never by editing the text above.

All entries are dated 2026-11-11, PST.

1. After trial IN-1, the harness changed. IN-1's row said `turns: 29` under a
   ceiling of eight, which read as a broken ceiling. It was not: the CLI's
   `num_turns` counts tool calls plus one on a session that ends normally, and
   IN-1 made 28 calls across 7 model responses. The harness gained a
   `responses` field (distinct assistant message ids), a `regrade` command that
   rebuilds every row from its transcript, and two report columns. The pass
   rule and the classes were not touched. `regrade` was run over all twelve
   transcripts after the last trial and no row changed class. The harness
   sha256 is now `8273029cd3d1cf36`; the freeze names `d0ede5f3630fe257`.
2. "Eight turns is the ceiling" meant less than it reads. `--max-turns 8` caps
   model responses, and one response can carry several tool calls, so the
   twelve sessions made between 10 and 31 calls each. Three stopped at the
   ceiling with `error_max_turns`: IN-4, MOVED-4 and IN-C. Each is graded as it
   stands, as the freeze says. IN-4 and MOVED-4 had opened their notes in
   responses 1 and 2.
3. The 5-hour abort rule had no figure to test. `limit-watch.py status` printed
   `5h --` at all five readings. The 7-day and Fable windows read 10% and 17%
   before trial 1, the same after trial 3, 12% and 22% after trials 6 and 9,
   and 15% and 26% after trial 12. Other sessions were running on the same
   login, so the rise is not the trials' alone.
4. The index moved under the run. `MEMORY.md` hashed `dbbb9f7fdab2a5c0` after
   the last trial against `79d77d99e13e408f` at the freeze. Another session
   added a qualifying note at 21:22, and `check` now fails on IN-5 because the
   rule would pick that newer note in its place. The five frozen targets were
   the rule's picks at the freeze and each was still a line of `MEMORY.md` when
   its trial ran, by the fact that all five sessions opened the note on their
   first call.
5. The re-run allowed for an infrastructure death was not used. No row is
   classed `infra-*`.
6. Rows use one path class the freeze does not list: `cwd`, for a Glob or Grep
   given no path.
7. Every trial wrote one line to stderr, `[claude-code:unrecognized_model]`
   naming `claude-fable-5-2`. No `model_fallback` event followed in any
   transcript and `modelUsage` names that model alone in all twelve.
