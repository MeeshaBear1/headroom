# Pre-registration: stream study 1, returning jobs on one fork family

**Status: DRAFT, not frozen.** No trial has been run and nothing has been spent.
Written 2026-11-11 on branch `build/stream-mode-2026-11-11`. It freezes when the
items under [What must exist before the freeze](#what-must-exist-before-the-freeze)
are done, the operator has set the dollar cap, and this file is committed with
the schedule hash filled in. Every figure marked *estimate* was not measured.

## The question

When the same kind of job on one fork family comes back after a gap, does the
fleet's installed skill library and memory, carried from visit to visit, do it
for less than the same setup rebuilt before every visit?

Every result in this repository so far measures one exposure. This is the first
study of what a setup keeps. The protocol is Continual-ARC's (Unify, 2026,
section 2 and appendix B), moved from puzzles to work; the places where it did
not move cleanly are listed under [Departures from the paper](#departures-from-the-paper).

## The family and its oracle

One fork family of storefronts: the 12 repositories listed in
the family kit's `forks.json`, which share six money files and one checkout
contract. The oracle is the kit's own check, a script with an exit code:

    node bin/kit.mjs check <studio-or-path> --tree     # exit 0 clean, 1 findings, 2 cannot run

It was chosen over the two other candidates because it takes any directory,
compares six files byte for byte against the kit, runs six behavioural vectors
and returns an exit code, and neither of the others does all four. A second family kit's hardening
check describes itself as grep-level evidence, and its predicate vectors cover
one job. The sea-trial oracles are patterns over an agent's last message, and
their trials are not a fork family.

The oracle was run before it was named, on 2026-11-11, kit `54af509fae0a`,
Node v24.16.0, from the kit's own checkout:

| Command | Result |
|---|---|
| `node bin/kit.mjs vectors --impl vectors/adapters/kit.mjs` | 6 pass, 0 fail, 0 skip, `CONFORMS`, exit 0 |
| `node --test test/*.test.mjs` | 35 pass, 0 fail |
| `node bin/kit.mjs check <one studio> --tree` | exit 1: five money files differ, two vectors fail, the prefix is unregistered |
| the same check on a staged copy of the kit's files outside the fleet | exit 0, six files identical |
| the same copy with one line appended to `server/webhook.ts` | exit 1, `webhook.ts DIFFERS 1 hunks` |

Three limits of the oracle were found in the same sitting, and each is a build
item below. The fixture has to be a git repository, because the check runs
`git grep`. The studio is read from the directory name or the origin remote.
Four of the six vectors report `SKIP` when the tree has no built
`server/dist/webhook.mjs`, and one studio returned exit 2 for want of the
`stripe` package, so a task's check must count a `SKIP` on a vector it depends
on as a failure.

## Tasks

A task is a recurring job with a seeded generator and the kit check as its
oracle, written to the interface in [`harness/stream.mjs`](../../harness/stream.mjs).
A generator stages a studio tree from the kit's files, seeds one class of
finding, and varies the studio, its registered prefix, the file the fault sits
in and the surrounding values, while the house rule the fix has to honour stays
the same. None of the twelve tasks in the table is built. The two generators that exist
(`probes/rule-drift`, `probes/repo-truth`) prove the interface and are not part
of this study.

| Role | Task | The finding the kit reports |
|---|---|---|
| stream | `money-drift` | a money file `DIFFERS` from the kit |
| stream | `shop-json` | `server/shop.json` missing or invalid (`kit validate`) |
| stream | `prefix` | the order prefix is not the registered one |
| stream | `quote-reads-body` | an error body is discarded where the rule wants it read |
| stream | `webhook-wrong-app` | an event for another shop is accepted |
| stream | `webhook-unpaid` | an unpaid session is fulfilled |
| stream | `webhook-wrong-amount` | a mismatched amount is not refused with `200 {"refused":"amount"}` |
| stream | `labref` | a lab reference breaks the `LABREF` rule |
| held-out | `collision` | two studios claim one prefix |
| held-out | `webhook-bad-signature` | an unsigned event is accepted |
| held-out | `missing-money-file` | a money file is absent |
| held-out, changed rule | `prefix-moved` | the fixture's own `shop.json` registers a prefix that differs from the one every stream visit taught |

Each generator has to clear `node harness/stream.mjs gate --task <dir> --seeds 8`:
the check fails the untouched fixture, fails every named wrong answer, passes
the reference fix, and two runs of one seed are the same bytes. A task that
cannot clear it is dropped and recorded here, never tuned. The study runs with
no fewer than 6 stream tasks and 3 held-out tasks, and `prefix-moved` must be
one of them; below that it does not run.

## Schedule

`harness/schedule.mjs`, written from the paper's description and not from its
code. The paper's ARC-AGI-1 parameters are kept unchanged; the supply is lower
because a visit here is a paid session.

| Parameter | Value |
|---|---|
| seed | 20261111 |
| active set `nc` | 4 |
| mean spell | 3 rounds |
| median rest | 30 rounds, sigma 1 |
| mean arrival gap | 4 rounds |
| visits per task (`supply`) | 6 |
| seen-test instances per task | 2 |
| pilot instances per task | 2 |

With 8 stream tasks that is 48 rounds, 16 seen-test instances, 4 held-out
instances and 16 pilot instances. At this size the rest is usually cut short by
the rule that wakes the soonest sleeper when nothing else is ready: the
generator's output at this seed has 30 of 40 revisits arriving after a gap, with
a median gap of 6 rounds, a 90th percentile of 16 and a longest gap of 32, and
the last task is first met at round 20. Those figures were read from the
generator on 2026-11-11 with placeholder task names; the order of draws does not
depend on the names.

    schedule sha256: [[FILLED AT FREEZE, from the built task folders]]

## The learner, the tier and the arms

The learner is `claude -p` in a sealed trial, exactly as `harness/run.mjs` calls
it: the same tools, the same turn limit, the same deny rules, staged under
`C:\headroom-trials\`. The model is `claude-sonnet-5`. It is the tier with a
sealed cost record in this repository
([re-gate](../runs/2026-09-26-seal-regate-rule-drift-sonnet5.md)), and the plan
below costs about two and a half times as much at Opus 5 by the ratio of the
mean session costs on disk.

The setup under test is a snapshot, taken once and hashed into `meta.json`: the
operator's `~/.claude/skills/` folder and the memory folder
`~/.claude/projects/C--Users-nileh/memory/`, mounted where a session in the
trial directory looks for project memory. The top-level doctrine files are not
in it, because the seal voids any visit that reads a line of them and cannot
tell a copy from the original.

| Arm | State | Visits |
|---|---|---|
| `reset` | the snapshot, rebuilt before every visit | stream 48, seen 32, held-out 20 |
| `reset-b` | the same, a second run | stream 48, seen 32, held-out 20 |
| `carried` | the snapshot at visit one, then whatever each visit left; frozen at the end of the stream for the tests | stream 48, seen 32, held-out 20 |

The seen test runs 2 plays of each instance and the held-out test 5 plays. No
visit carries a task alias. `reset-b` exists because a token count is noisier
than the paper's charge: L and S between `reset-b` and `reset` are the band two
identical arms produce by sampling alone.

## The charge

The unit is additive usage tokens, the sum `harness/tokens.py` already takes
from a session's result line: input, output, cache writes and cache reads. A
visit the oracle fails is charged the full cap. So is a solved visit that ran
past the cap, and it counts as unsolved.

The cap is fixed from a pilot before the stream. The pilot is 16 `reset`
visits, two fresh instances of each stream task at seeds no later phase uses.
The cap is twice the largest token total among the pilot's solved visits,
rounded up to the next 100,000. If fewer than 8 of the 16 solve, the study
stops there: the jobs are too hard at this tier for cost to be the measure. The
cap is written into this file before the first stream visit and does not move.

    cap: [[FILLED AFTER THE PILOT]] tokens     (estimate: 1,000,000 to 1,500,000)

Tool calls were the alternative. A library's cost arrives before any tool is
called, as context on every turn, and a count of calls cannot see it; a call
that reads forty thousand tokens and a call that lists a folder count the same.
Dollars were the other alternative, and they depend on how the cache splits
between writes and reads, which depends on the time between visits, which
differs between a serial arm and a concurrent one. The additive count does not.
Turns, tool calls and dollars are recorded for every visit and scored nowhere.

## Metrics

Computed by `python harness/stream_metrics.py <run> --cap <cap> --seed 20261111`.

- U, the mean charge as a share of the cap, and P, the share solved under the
  cap, per arm and phase, and U by exposure number.
- L = (U0 − U) / (U0 − U*) on the stream, where U0 is `reset`, U is `carried`,
  and U* is the perfect-memory bound: `reset`'s charge on a task's first
  exposure and zero on every return.
- S = (U0 − U) / U0 on the seen test and on the held-out test.
- 95% intervals from 2,000 paired resamples of tasks, seeded.

Instances are paired across arms. An instance voided in either arm is dropped
from both, and a task whose first exposure is voided leaves L.

## What each result would mean

| Reading | Rule |
|---|---|
| learning | the interval of L excludes 0 from above, and L sits above the upper end of the `reset-b` band |
| no learning | the interval of L includes 0, or L sits inside the `reset-b` band. This is the expected result if the state log shows no visit changed a memory file |
| harm | the interval of L lies below 0 and below the band; or the interval of S on the held-out test lies below 0; or P on the held-out test is lower in `carried` than in `reset` at Fisher exact p < 0.05, 20 visits an arm |

The changed-rule job is reported by itself, 5 visits an arm, as counts. With 20
held-out visits an arm the harm control can see a collapse and cannot see a
small harm; a clean reading is "no harm detected".

`state-carried.jsonl` records which files each visit changed. It is the
mechanism record: an L above the band with no memory file ever changed is not
attributed to memory.

## Stopping rules

- The pilot rule above.
- The infra floor: 6 voided visits after retry writes `STOP`, as in `run.mjs`.
- More than 5% of paired instances voided: the study is reported as void.
- Spend is read from `stream_metrics.py` after each phase. A phase starts only
  if the spend so far plus its visits at the mean cost so far is inside the cap.
- The carried arm refuses to continue from a state no visit produced.

## Cost

| Phase | Visits |
|---|---|
| canary: the mounted memory is read, and a memory write survives to the next visit | 2 |
| pilot | 16 |
| `reset`, `reset-b`, `carried` at 100 each | 300 |
| retry allowance, 5% of 318 | 16 |
| **total** | **334** |

| Case | Cost per visit | Source | 334 visits |
|---|---|---|---|
| low | $0.233 | mean of 120 Sonnet 5 sessions, `python harness/tokens.py evals/runs/contrast-rule-drift-sonnet5`, computed 2026-11-11 from transcripts on the operator's disk; the committed [token record](../runs/2026-07-27-token-accounting.md) gives $0.22 to $0.31 | $77.82 |
| planning, *estimate* | $0.45 | $0.233 × 1.5 for the library and memory in context × 1.3 for a larger fixture and a script to run; both factors are guesses | $150.30 |
| high | $0.724 | mean of the 47 costed rows in `~/.claude/tools/sea-trial/ledger.jsonl`, sessions under the operator's full setup, model not recorded | $241.82 |

What a visit costs on a kit fixture with the library mounted has not been
measured; the pilot is the first measurement and its mean replaces the planning
figure. The carried arm is serial: 100 visits at roughly a minute each is about
two hours, an *estimate* from the 50 to 84 seconds in the token record.

    dollar cap: [[SET BY THE OPERATOR BEFORE THE FREEZE]]

## What must exist before the freeze

1. The twelve task generators, each through the gate. The gate's same-bytes
   comparison has to leave `.git/` out, since the fixture is a repository.
2. An offline build of `server/dist/webhook.mjs` inside the fixture, or the four
   webhook tasks are dropped and the minimum counts above decide whether the
   study runs.
3. The canary. The folder name a session reads project memory from was inferred
   from names under `~/.claude/projects` and has not been seen working, and
   whether a headless session writes memory at all is unknown. If a write does
   not survive, the carried arm has nothing to carry and the study is void
   before the stream.
4. The model id resolves.
5. The schedule hash, the kit hash and the snapshot hash written into this file.

## Departures from the paper

- No task alias by default. Theirs shows one on every visit; here, recognising
  that a job has returned is part of what is measured. `--alias` restores it.
- The verdict is not shown to the learner. A session ends and is graded after.
- The charge is tokens under a pilot-fixed cap. Theirs is attempts plus
  demonstrations revealed.
- State can be written during a visit. "Only between visits" is held as serial
  visits and a hash of the state at every boundary.
- The frozen test is a restored copy of the state at the end of the stream.
- The reset arm restores a starting setup. Theirs is an empty learner.
- Held-out tasks are other jobs of the same family. The paper draws its
  held-out tasks from a separate evaluation set.
- A second reset run supplies a null band, which the paper does not need.
- A timeout is an infra row here and is retried, then dropped from both arms.
  In the paper running out of budget is a failure.
- The mounted skills name paths under `~/.claude` that the seal refuses, so a
  skill that tells a session to run a tool there cannot be followed.
- The paper's parameter table gives the arrival gap as 2 where its text says
  about four. The generator's default is 4. At 4 its 25-task stream at seed 0
  has met 12 tasks by round 50 and 20 by round 100, where the paper reports 14
  and 25 (`node harness/streamtest.mjs`, check 2).
