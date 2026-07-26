# Pre-registration — rule-drift contrast (A/B/C)

**Status: FROZEN.** Written and committed before trial 1 of this phase.
Everything below is fixed. A change to any frozen field after trial 1
invalidates every affected trial and the invalidation is recorded here, not
absorbed.

Date frozen: 2026-07-24
Purpose: test whether the `rule-consistency` skill lifts `claude-sonnet-5`'s
compliance with a documented, non-inferrable convention (`rule-drift`,
HAS-HEADROOM at unaided pilot), and whether that same skill causes harm on a
matched fixture where the convention is inverted (`convention-override`,
CAN-DETECT-HARM at unaided pilot).

## Relationship to prior pilot data

Neither probe existed at the time of the 2026-07-24 headroom gate
([`../runs/2026-07-24-gate.md`](../runs/2026-07-24-gate.md)); both were
designed afterward, in direct response to that gate voiding all three
original probes. Before this freeze, both were piloted arm-A-only,
unregistered, at small n — exactly what `oracle-contract` permits for oracle
design on pilot data with no arm-B trial in existence:

- `rule-drift` @ `claude-sonnet-5`: 10 trials, 1 pass (10%) → HAS-HEADROOM.
  `evals/runs/pilot-rule-drift-sonnet5/`
- `rule-drift` @ `claude-opus-5`: 6 trials, 6 pass (100%) → VOID-FOR-TIER,
  which is exactly what makes it usable as the arm C ceiling below.
  `evals/runs/pilot-rule-drift-opus5/`
- `convention-override` @ `claude-sonnet-5`: 6 trials, 4 pass (67%) on first
  grading, 6 pass (100%) after one oracle correction → CAN-DETECT-HARM.
  `evals/runs/pilot-convention-override-sonnet5/`

**One oracle correction was made on this pilot data**, before any arm-B
trial for either probe existed. Both oracles' action-string comparison was
loosened from exact match to a normalized (case/separator-insensitive)
match: two `convention-override` pilot trials wrote the correct operation in
a different format (`"ban_account"` for the documented `"banAccount"`),
which is not the fact the ordering rule is asserting, and it was diluting
the harm control's ceiling below the 90% a harm control needs to be usable.
The same normalization was applied to `rule-drift`'s oracle for symmetry
between the matched pair; it does not change `rule-drift`'s pilot count (the
one affected trial there was already failing on ordering independently).
Both oracles' selftests were re-run clean after the change; both pilot runs
were regraded with `harness/run.mjs regrade` at zero re-spend.

None of this pilot data is counted in the frozen trial totals below; it
predates this freeze and is disclosed here for context and reproducibility.

## Environment (pinned)

| | |
|---|---|
| `claude` CLI | 2.1.206 |
| Node | v24.16.0 |
| Platform | Windows 11, win32 |
| Runner | `harness/run.mjs` sha256:`776c7da505ef22a9` |
| Statistics | `harness/fisher.py` sha256:`e07ed0c79373fa57` (unchanged since the 2026-07-24 gate) |
| Permission mode | `acceptEdits` |
| Allowed tools | `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` |
| Max turns | 80 |
| Timeout | 900 s/trial |
| Concurrency | 6 |
| Session isolation | throwaway `CLAUDE_CONFIG_DIR` per trial; scrubbed secrets; verified by leak probe (EVIDENCE.md claim 5) |

## Arms in this phase

- **Arm A** — subject model, library absent.
- **Arm B** — subject model, library soft-present at `skill/rule-consistency`
  (frozen hash below); prompt byte-identical to arm A, never mentions skills.
- **Arm C** — ceiling model, library absent. `rule-drift` only; a harm
  control is compared to its own arm A, not to a ceiling.

Subject model: `claude-sonnet-5` — the only tier the gate found headroom at.
Ceiling model: `claude-opus-5`, per the 2026-07-24 gate prereg's arm C
convention for a `claude-sonnet-5` subject.

## Probes and artifact hashes (frozen)

| probe | role | prompt sha256 | oracle sha256 | spec sha256 | skill sha256 |
|---|---|---|---|---|---|
| `rule-drift` | primary | `422d913a9b721837` | `0c01ce3021fec912` | `a45b7e1e24ed75bd` | `07550bba3d88fdfb` |
| `convention-override` | matched harm control | `422d913a9b721837` | `cad27668dff84d70` | `5f4b2d3b20f2c32c` | `07550bba3d88fdfb` |

The two probes share an identical prompt hash and skill hash by design — same
task, same library text, only the fixture's documented convention (and its
oracle's ordering check) differs. That the hashes are equal is a checkable
property of the freeze, not a copy-paste error.

## Primary probe

`rule-drift`, selected by the 2026-07-24 gate prereg's own primary-probe
selection rule: the only non-harm-control probe that cleared VOID-FOR-TIER at
`claude-sonnet-5` tier (pilot: 1/10, HAS-HEADROOM). `convention-override`
runs alongside it at the same n per that rule's clause 4, regardless of its
own gate verdict.

## n

**n = 30 per arm, for arms A and B, both probes. n = 10 for arm C**
(`rule-drift` only).

- `rule-drift`: A(30) + B(30) + C(10) = 70 trials.
- `convention-override`: A(30) + B(30) = 60 trials.
- **130 trials total.**

n = 30/arm matches this repo's own evidentiary bar for a real claim (the
prior cheap-model finding in EVIDENCE.md, n = 30/arm) rather than the gate's
screening n = 10 — see `uplift-statistics` on why n = 10 is directional only.
Arm C at n = 10 mirrors the original gate prereg's asymmetric sizing: the
ceiling needs confirming, not precision.

## What gets published

All 130 rows and both probes' verdicts, whatever they are — including a flat
null on `rule-drift`, or a harm finding on `convention-override`, or both.
Fisher exact two-sided for A vs B on each probe; gap closure
`(B-A)/(C-A)` for `rule-drift` if C ≠ A. The `convention-override` cost rides
in the same table as any `rule-drift` uplift claim, per `probe-design` rule 6
— an uplift claim without its harm-control number next to it is not
publishable from this repository.

## Abort rules

- More than 6 `infra-*` rows in a single invocation → halt, fix, re-run from
  scratch. Infra rows are never counted as behavioural failures.
- The runner writes a `STOP` file the driver checks each iteration.
- Any trial that does not reach the statistics is named in the run record
  with its reason. No silent caps.

## Exclusions declared in advance

- `infra-*` rows: excluded from all rates, counted and reported separately.
- Nothing else.

## Deviations from this pre-registration

*(append-only)*

- 2026-07-24, **after all 130 trials completed**: `harness/run.mjs` amended
  from sha256:`776c7da505ef22a9` to sha256:`bdaf65b12c4cbc1d`. Fixed a
  variable-shadowing bug in `report()`'s console output (a probe id printed
  as a function's source text). The change is confined to that one
  post-hoc, read-only reporting function — it touches no code on the trial
  execution, grading, or `regrade` path, and ran after every trial in this
  phase had already been spawned, graded, and written to `rows/`. Recorded
  because the freeze binds the whole file and an unrecorded hash change is
  indistinguishable from a mid-run edit, even one this clearly inert.
- 2026-07-26, **after an external review**, both oracles amended:
  `probes/rule-drift/oracle.mjs` from sha256:`0c01ce3021fec912` to
  sha256:`a3734dbf252666f6`; `probes/convention-override/oracle.mjs` from
  sha256:`cad27668dff84d70` to sha256:`289f2c033688b163`. The review noted
  that `docs/CONVENTIONS.md` forbids editing `src/db.js` and `src/audit.js`,
  but nothing checked this — a trial that removed `db.js`'s throw sentinel
  could make a wrong-order implementation read as correct. Added a guard
  (`tamperedFiles`) that hashes both files in the trial's working copy
  against the shipped fixture and fails the trial if either changed, mirroring
  `probes/disclosure`'s existing `SUITE_FILES` check. **All 130 already-graded
  trials in this run were regraded against the updated oracles
  (`harness/run.mjs regrade`) and every classification is unchanged** — no
  trial in this run modified either file, so the guard is confirmed inert on
  this data, not merely assumed so. Recorded for the same reason as the entry
  above: the freeze binds the file, and this changes its hash.
