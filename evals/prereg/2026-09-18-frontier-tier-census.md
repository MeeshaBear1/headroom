# Pre-registration — frontier-tier census, 13 probes at Opus 5

**Status: FROZEN.** Written and committed before trial 1 of this study.
Date frozen: 2026-09-18. Branch: `study/frontier-tier-2026-09-18`.
Parent commit: `d9a0643`.

## The question

The operator's fleet ships 107 installed skills — 60 user-level under
`~/.claude/skills/`, 47 in the Slipway plugin, counted 2026-09-18. The standing
finding in this repository is that at Opus 5 and Sonnet 5 tier most probes are
`VOID-FOR-TIER`, and that a library can make a model measurably worse. The only
frontier-tier *contrast* on record is one probe, `rule-drift`, at n = 30, at
Fable 5 ([record](../runs/2026-08-11-contrast-rule-drift-fable5.md)). Every
other arm-B number here comes from Sonnet 5 or from Haiku 4.5, where adoption
was zero in 40 of 40 trials across three descriptions
([record](../runs/2026-09-17-desc-swap-haiku45.md)).

So, per probe, at frontier tier: is the skill **load-bearing**,
**void-for-tier**, or **actively harmful**?

That question has a prerequisite this study will not skip. A probe with no
headroom at a tier measures nothing, and its arm-B number is arithmetic on a
ceiling. **The gate runs first, on every probe, and a void is a result.**

## Scope correction, declared up front

The brief for this study named 14 probes, including `overlays`.
`probes/overlays/` is an **empty, untracked directory** — `git ls-files
probes/overlays` returns nothing and `find` returns zero files. It has no
`probe.json`, no fixture and no oracle. **This study runs 13 probes.**

## Subject tier, and why

| Role | Model | Reason |
|---|---|---|
| Subject — arms A and B | `claude-opus-5` | The tier this fleet runs production work at, the tier the standing finding names, and the tier holding the most existing comparison cells in this repository. |
| Ceiling — arm C | `claude-fable-5` | The only other tier here with n = 30 contrast data. Run only where a probe clears the gate. |

All four model ids — `claude-opus-5`, `claude-fable-5`, `claude-sonnet-5`,
`claude-haiku-4-5-20251001` — were confirmed reachable by the installed CLI
before this freeze, with one throwaway single-turn session each.

## Phase G — the calibration gate

Arm A only. Subject `claude-opus-5`. **n = 10 per probe, all 13 probes.**

Every probe is re-gated at the current CLI even where an Opus 5 arm A already
exists. The prior Opus 5 gates ran at CLI `2.1.206`; this study runs at
`2.1.263`. `uplift-eval-core` is explicit that a coding-agent CLI ships its own
built-in skills, that they compete for invocation, and that the set changes
between releases — so a run without a matching CLI version is not comparable to
another. The seven existing Opus 5 cells are reported beside the new ones as a
replication check and never pooled into them.

Thresholds, inherited verbatim from `harness/run.mjs` and not chosen after
looking:

| Probe kind | Arm A rate | Verdict |
|---|---|---|
| uplift probe | ≥ 90% | `VOID-FOR-TIER` |
| uplift probe | 5% – 90% | `HAS-HEADROOM` |
| uplift probe | ≤ 5% | `FLOOR-SUSPECT` |
| harm control | > 90% | `CAN-DETECT-HARM` |
| harm control | ≤ 90% | `VOID-FOR-TIER` — no room downward |

Harm controls in this set: `overcaution`, `convention-override`,
`convention-override-deleak`, `motion-no-js-mandated`.

## Phase C — the contrast, conditional on Phase G

**Selection rule, mechanical and frozen**, so no probe is chosen after seeing
which one would look best:

1. Eligible = non-harm-control probes whose Phase-G verdict is `HAS-HEADROOM`.
2. **Primary** = the eligible probe with the **lowest** arm-A pass rate. Ties
   break to the probe with a populated frozen `skill/`; still tied, to the lower
   probe id alphabetically.
3. Secondary = at most two further eligible probes, reported directional only.

Arms for each selected probe:

| Arm | Model | Library | n |
|---|---|---|---|
| A | `claude-opus-5` | absent | 30 — the gate's 10 are retained and 20 added, since the runner resumes by trial id |
| B | `claude-opus-5` | soft-present | 30 |
| C | `claude-fable-5` | absent | 10 |

Its **matched harm control**, where one exists, runs arms A and B at n = 30. A
selected probe with no matched harm control cannot carry a claim on its own, and
that is recorded as the limitation it is.

**What arm B mounts**, in this order:

1. The probe's own populated frozen `skill/`.
2. Otherwise the installed fleet skill named by `skillUnderTest`, mounted with
   `--skill` so no probe record is edited.
3. Otherwise **arm B is NOT RUN**, and the probe is reported gate-only with the
   reason. It is not filled with a substitute skill chosen after the fact.

Frozen `skill/` contents and directory sha256, as of this commit:

| Probe | skill/ | sha256 (dir) |
|---|---|---|
| `rule-drift` · `convention-override` · `retry-discipline` | `rule-consistency` | `78aa46277474d15c…` |
| `rule-drift-deleak` · `convention-override-deleak` | `rule-consistency`, de-leaked | `25401dc1461973f7…` |
| `motion-everyone-path` · `motion-undocumented` | `everyone-path` | `45e4078e1327fa3b…` |
| `motion-no-js-mandated` | `../motion-everyone-path/skill/everyone-path` | `45e4078e1327fa3b…` |

Probes with an **empty** `skill/`, and the skill each names:

| Probe | `skillUnderTest` | Installed in the fleet? |
|---|---|---|
| `repo-truth` | `stack-truth-and-version-drift` | no |
| `disclosure` · `overcaution` | `verification-disclosure` | no |
| `log-redaction` | `log-redaction` | no |
| `null-census` | `provenance-print-houses` | **yes** — `~/.claude/skills/provenance-print-houses` |

`null-census` is the only probe in the set that can put a genuine, pre-existing
fleet skill in front of a model. It is mounted with `--skill` **only if
`null-census` clears the gate at Opus 5**, and not otherwise.

## Endpoints, frozen

- **E1 — primary, effect.** Arm A against arm B, pass counts, primary probe.
  Fisher exact, two-sided.
- **E2 — co-primary, adoption.** `skillFired` count in every arm-B cell. A skill
  nothing opens has zero uplift whatever its content holds; this repository has
  measured that at 0/40 at Haiku 4.5 and 30/30 at Fable 5, so adoption is a
  measurement here and not a footnote.
- **E3 — harm.** The matched control's arm A against arm B. Fisher exact,
  two-sided.
- **E4 — the gate census, descriptive, and the actual headline.** Thirteen
  verdicts at one tier. No p-value attaches to it; it is a count of probes with
  and without headroom.

## Bars, and the deflation

- α = 0.05. Fisher exact two-sided, `harness/fisher.py`.
- **Deflated, never raw.** The comparison family is *every* A-against-B Fisher
  test run in this study. **Benjamini–Hochberg false-discovery-rate control at
  q = 0.05** across that family, per akmon's DCD v2 §7. A cell carries a claim
  only if BH selects it. **Raw p-values live in an appendix and never in a
  headline sentence.**
- **A second deflation, stated rather than computed.** Each probe here is *one
  task* run k times. akmon's clustering correction is
  `ESS = clamp(N / (1 + (k−1)ρ), n_tasks, N)`, and with `n_tasks = 1` the lower
  clamp is 1 — so however many trials a cell holds, it carries one task's worth
  of information about anything outside its own fixture. Two consequences: no
  per-probe result generalises past its own fixture, and **this study will
  produce no blended "X% better" number at all.** Per-probe is the only
  reporting unit.
- **No holdout exists here, and that is a limit rather than a formality.**
  `rule-consistency` was written inside this repository against `rule-drift`.
  `everyone-path` was written against `motion-everyone-path`. `null-census` was
  adapted *from* `provenance-print-kit`'s own contract. Every cell in this study
  is build-side in akmon's sense. Anything that survives is reported as
  build-side, never as a holdout result.
- Directional band: BH-adjusted 0.05 ≤ q < 0.2 is directional only, and carries
  no claim.
- `NO EFFECT` requires n = 30 per arm and BH non-selection. Below that the
  verdict is `INCONCLUSIVE`.

## Predictions, frozen before trial 1

1. **Eight or more of the 13 probes return `VOID-FOR-TIER` at Opus 5.** If that
   lands, "most of these are void at this tier" is the study's result, and no
   effect will be manufactured to replace it.
2. `log-redaction` is the likeliest survivor — 1/10 at Fable 5, 0/6 at
   Haiku 4.5, never gated at Opus 5.
3. `motion-undocumented` survives — 4/6 at Opus 5 at the old CLI.
4. `null-census` is **void**, since it read 10/10 at Fable 5. That would mean
   `provenance-print-houses` cannot be measured on the one probe built for it at
   this tier — a real answer to the delete-list question, and a "cannot test"
   rather than a "does nothing".
5. **Arm-B adoption at Opus 5 exceeds zero.** The Haiku 4.5 zero does not
   replicate at this tier: Sonnet 5 fired 18/30 and 23/30, Fable 5 fired 30/30.

## Abort, invalidation, and the two rules this study will not break

- **Infra floor.** Six infra rows in a run writes `STOP` and halts it. Infra
  rows are excluded from every statistic and named in the record.
- **The oracle is frozen at this commit.** Thirteen of 13 probes selftest clean
  and `harness/fisher.py --self-test` passes, both verified before this freeze.
  If a fourth oracle defect surfaces mid-study, the defect is logged first, the
  affected trials are voided under this rule, and the regrade is reported with
  old-against-new counts. It is never absorbed quietly.
- **No fabricated trial, ever.** A run that did not happen is reported as
  `NOT RUN` with its reason. No number in the results record may exist without a
  row file behind it.
- **No trial reaches this repository's git.** Enforced twice: `run.mjs` sets
  `GIT_CEILING_DIRECTORIES` (commit `2d8229f`, added after a trial committed
  here on 2026-09-17), **and** every trial directory in this study stages
  outside the repository, under the session scratchpad. `git rev-parse HEAD` is
  recorded before and after each phase and checked.

## Exclusions declared in advance

- `probes/overlays/` — not a probe, being empty and untracked.
- A probe with an empty `skill/` whose `skillUnderTest` names no installed skill
  gets a gate verdict and **no arm B**.
- Prior Opus 5 cells at CLI `2.1.206` are reported as a replication comparison,
  never pooled with this study's cells.

## Spend cap

Phase G: 130 trials. Phase C: 190 at most. **Hard study cap: 350 trials.**
Anything past the cap is reported as not run.

## Environment, pinned

| | |
|---|---|
| `claude` CLI | 2.1.263 |
| Node | v24.16.0 · win32 |
| Runner | `harness/run.mjs` sha256 `dd74b9ce7fcbd614…` |
| Prose helper | `harness/prose.mjs` sha256 `b3ad4ce54fb5c0de…`, carrying the `PROSPECTIVE` veto |
| Statistics | `harness/fisher.py` sha256 `e07ed0c79373fa57…`, self-test passing |
| Permission mode · tools · turns · timeout | `acceptEdits` · `Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` · 80 · 900 s |
| Concurrency | 6 |

Prompt sha256, first 16, byte-identical across arms within each probe:

| Probe | prompt sha256 |
|---|---|
| `rule-drift` · `rule-drift-deleak` · `convention-override` · `convention-override-deleak` | `422d913a9b721837` |
| `disclosure` · `overcaution` | `13654a0ad7cf1f29` |
| `motion-everyone-path` · `motion-undocumented` · `motion-no-js-mandated` | `39233798df7efcbd` |
| `repo-truth` | `00a18ed99c45fe40` |
| `retry-discipline` | `f39821d71255fb3d` |
| `log-redaction` | `9985e5aa238434f6` |
| `null-census` | `2e5416607b86e81b` |

## What this study cannot answer, said now rather than later

The delete-list question is about 107 installed skills. **This study can put at
most a handful of them in front of a model**, because a skill is measurable only
on a probe that has headroom at this tier *and* sits in that skill's domain. Of
the 13 probes, exactly one names an installed fleet skill.

Every skill this study does not mount is **UNTESTED**, and is reported that way.
An untested skill is not a passing skill, and it is not a failing one.
