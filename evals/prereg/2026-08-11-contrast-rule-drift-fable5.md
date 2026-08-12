# Pre-registration — rule-drift contrast at Fable 5 (A/B, reused Opus 5 C)

**Status: FROZEN.** Written and committed before trial 1 of this phase.
Everything below is fixed. A change to any frozen field after trial 1
invalidates every affected trial and the invalidation is recorded here, not
absorbed.

Date frozen: 2026-08-11
Purpose: replicate, at this repository's evidentiary n, the exploratory
2026-08-09 finding that `claude-fable-5` — a tier above Opus 5 — is **not** at
ceiling on `rule-drift`, that the `rule-consistency` skill closes the gap, and
that the mechanism is task-conditional doc discovery rather than the
disposition failure measured at Sonnet 5.

## Relationship to prior data

The 2026-08-09 exploratory reanalysis
([`../runs/2026-08-09-fable5-reanalysis.md`](../runs/2026-08-09-fable5-reanalysis.md))
was run unregistered at gate n and is **directional only** — none of its
trials count toward any total below. Its results, disclosed for context:

- `rule-drift` @ `claude-fable-5`: A 5/10, B 10/10 (skill fired 10/10).
- `convention-override` @ `claude-fable-5`: A 10/10, B 10/10 (fired 10/10).
- Transcript observation motivating the mechanism endpoint below: in arm A,
  all 5 passing trials read `docs/CONVENTIONS.md` and all 5 failing trials
  never mentioned it.
- Unexplained: unaided doc-reading differed 5/10 vs 10/10 between the two
  sibling fixtures. This freeze's arm-A data will speak to whether that
  difference is stable or was sampling noise.

A fresh arm A is collected at n = 30; the exploratory arm A is not pooled.

## Environment (pinned)

| | |
|---|---|
| `claude` CLI | 2.1.206 |
| Node | v24.16.0 |
| Platform | Windows 11, win32 |
| Runner | `harness/run.mjs` sha256:`bdaf65b12c4cbc1d` |
| Statistics | `harness/fisher.py` sha256:`e07ed0c79373fa57` |
| Permission mode | `acceptEdits` |
| Allowed tools | `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` |
| Max turns | 80 |
| Timeout | 900 s/trial |
| Concurrency | 6 |
| Session isolation | throwaway `CLAUDE_CONFIG_DIR` per trial |

Every artifact hash and environment pin above is byte-identical to the
2026-07-24 contrast freeze as amended 2026-07-26 — nothing in either probe,
the skill, the runner, or the statistics has changed between the Sonnet 5
contrast and this one. Cross-tier comparisons below therefore compare model
tiers, not fixture versions.

## Arms in this phase

- **Arm A** — `claude-fable-5`, library absent. Fresh, n = 30, both probes.
- **Arm B** — `claude-fable-5`, library soft-present at
  `skill/rule-consistency` (hash below); prompt byte-identical to arm A,
  never mentions skills. Fresh, n = 30, both probes.
- **Arm C** — **reused, not re-run**: the 2026-07-24 contrast's
  `claude-opus-5` arm C, n = 10, 10/10
  (`evals/runs/contrast-rule-drift-opus5/`). Reuse is sound because every
  frozen artifact hash is unchanged since those rows were graded; re-running
  would duplicate identical data at pure cost. Disclosed limitation: C
  predates this freeze by 18 days and any silent model-snapshot drift in
  `claude-opus-5` rides inside it. Note the inversion under test: the ceiling
  arm is a tier **below** the subject.

## Probes and artifact hashes (frozen)

| probe | role | prompt sha256 | oracle sha256 | spec sha256 | skill sha256 |
|---|---|---|---|---|---|
| `rule-drift` | primary | `422d913a9b721837` | `a3734dbf252666f6` | `a45b7e1e24ed75bd` | `07550bba3d88fdfb` |
| `convention-override` | matched harm control | `422d913a9b721837` | `289f2c033688b163` | `5f4b2d3b20f2c32c` | `07550bba3d88fdfb` |

Identical prompt and skill hashes across the pair are a checkable property of
the freeze, as in the 2026-07-24 contrast.

## n

**n = 30 per arm, arms A and B, both probes. Arm C reused at n = 10.**

- `rule-drift`: A(30) + B(30) = 60 new trials.
- `convention-override`: A(30) + B(30) = 60 new trials.
- **120 new trials total.** Estimated spend ≈ $58 at the exploratory run's
  measured $0.479/trial; actuals via `harness/tokens.py` in the run record.

## Endpoints

**Primary:** `rule-drift` A vs B pass rate, Fisher exact two-sided
(`harness/fisher.py`, raw 2×2 cells). Gap closure `(B−A)/(C−A)` if C ≠ A.

**Harm control:** `convention-override` A vs B, Fisher exact two-sided. Rides
in the same table as any uplift claim, per `probe-design` rule 6.

**Secondary (tier inversion):** `rule-drift` arm A (`claude-fable-5`, n = 30)
vs reused arm C (`claude-opus-5`, n = 10), Fisher exact two-sided. This is
the "a tier above Opus scores below Opus unaided" claim; it is secondary
because C is reused and asymmetric in n.

**Secondary (mechanism, pre-registered prediction):** for every trial, a
mechanical transcript measure — `doc-read` := the trial's retained transcript
contains the string `CONVENTIONS.md` (exact, case-sensitive; the same measure
used in the exploratory analysis). Predictions frozen now:

- **M1:** in `rule-drift` arm A, pass ⟺ doc-read, with at most 2/30
  discordant trials. The full 2×2 (doc-read × pass) is published either way.
- **M2:** in `rule-drift` arm B, doc-read (or an equivalent skill-fire
  marker) in ≥ 28/30 trials.
- **M3:** `convention-override` arm A doc-read rate exceeds `rule-drift` arm
  A doc-read rate (direction only — this is the unexplained sibling-fixture
  variance; if the rates converge, the exploratory 5/10-vs-10/10 split was
  noise and is recorded as such).

The mechanism claim ("task-conditional doc discovery") stands only if M1
holds. Uplift (primary) and mechanism (M1) are separate claims and fail
separately.

## What gets published

All 120 new rows and every endpoint above, whatever the outcomes — including
a flat replication failure of the exploratory gap, a harm finding, or M1
falling apart. A null on the primary is publishable as "the exploratory
Fable 5 gap did not replicate."

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

### D1 — 2026-08-11: API outage voided arm B of both probes; runner patched

**What happened.** The first invocation of the frozen design completed 120/120
trials with zero rows marked `infra`. Inspection of the retained transcripts
found 25 trials whose terminating event carried
`"terminal_reason":"api_error"` — "Repeated 529 Overloaded errors. The API is
at capacity":

- `convention-override-B-007` … `-030` (24 trials). Each shows `num_turns: 1`,
  `modelUsage` naming only `claude-haiku-4-5`, and no edit to the fixture. The
  subject model never worked. The oracle graded the untouched fixture
  `fail-no-audit`, producing an apparent harm signal (arm B 6/30 = 20%) that
  is an artifact of the outage, not of the library.
- `rule-drift-B-021` (1 trial). Different failure: 20 turns, 18 tool calls, all
  six `src/ops/*.js` files edited, graded **pass**, then terminated on
  `"API Error: Connection closed mid-response."` It did the work, but it is not
  a clean observation and is excluded on the same rule.

**Why the harness missed it.** The infra test required the absence of a
`"type":"result"` event. On an API death the CLI still emits a well-formed
result event with `"subtype":"success"`; only `is_error` and `terminal_reason`
say otherwise. Every infra check passed and the oracle ran against a pristine
fixture.

**Action taken, per the abort rule above** ("more than 6 `infra-*` rows in a
single invocation → halt, fix, re-run from scratch"):

1. `harness/run.mjs` patched to treat `terminal_reason=api_error` as infra,
   classified `infra-api-error`. New hash **sha256:`d493a841c3262f50`**
   (frozen above as `bdaf65b12c4cbc1d`). The patch touches only the
   infra/behaviour split; it cannot change any behavioural grade, so arm A
   rows produced under the earlier hash remain comparable. Both hashes are
   named here rather than the freeze being edited.
2. All 30 `convention-override` arm B rows (not only the 24 dead ones) and
   `rule-drift-B-021` moved to `evals/runs/contrast-rule-drift-fable5/voided-529/`,
   retained as evidence, excluded from every rate.
3. Those 31 trials re-run from scratch under the patched runner. No other arm
   is affected: `convention-override` arm A, `rule-drift` arm A, and the other
   29 `rule-drift` arm B trials contain zero `api_error` transcripts and are
   reported as originally run.

**No endpoint or threshold was changed.** The voided arm B result (20%) was
visible before the re-run was ordered; it is recorded here in full precisely
because the decision to discard it was made on a mechanical, pre-registered
rule (infra rows are never behavioural failures) and not on the direction of
the number.
