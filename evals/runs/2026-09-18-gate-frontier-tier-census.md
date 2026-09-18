# Frontier-tier census — 13 probes gated at Opus 5, and the seal that wasn't

Pre-registered before trial 1:
[`evals/prereg/2026-09-18-frontier-tier-census.md`](../prereg/2026-09-18-frontier-tier-census.md),
frozen at commit `7365047`. Phase R frozen separately at `3c6136a`, after
Phase G and before its own first trial:
[`evals/prereg/2026-09-18-frontier-tier-phase-r.md`](../prereg/2026-09-18-frontier-tier-phase-r.md).

Rows, transcripts and built fixtures:
[`evals/runs/frontier-tier-opus5/`](frontier-tier-opus5/).

| | |
|---|---|
| Subject | `claude-opus-5` |
| CLI | 2.1.263 · Node v24.16.0 · win32 |
| Phase G | 13 probes, arm A, n = 10, **130 trials**, concurrency 6 |
| Phase R | `null-census` arm B, n = 10, `provenance-print-houses` mounted with `--skill` |
| Infra rows | **0** across all 140 |
| Wall clock, Phase G | 1 h 48 m (17:43:30Z → 19:31:46Z) |

**Read the defect section before the census table.** The largest result in this
run is not a pass rate. It is that **54 of 140 trials read the operator's real
`~/.claude` directory off disk**, so "unaided" in this run means *without a
mounted skill*, not *without access to house doctrine*. Four probes were clean
and their verdicts stand unqualified; the rest carry the qualifier.

## Defect 5 — the fixture was sealed from the operator's config, not from the operator's disk

`harness/run.mjs` gives every trial a throwaway `CLAUDE_CONFIG_DIR`, strips
`CLAUDE*` and `ANTHROPIC_*` from the child environment, scrubs secret-shaped
variables, and sets `GIT_CEILING_DIRECTORIES`. Every one of those works. Together
they stop the operator's skills being **loaded** into the session.

None of them stop a trial from **reading the operator's filesystem**. Trials run
with `--allowedTools Edit,Write,Bash,Read,Grep,Glob,Skill,TodoWrite` under
`--permission-mode acceptEdits`, in a staged fixture with no sandbox.
`GIT_CEILING_DIRECTORIES` bounds git traversal and nothing else. `ls ~/.claude`
works.

Measured across this run by
[`harness/reachcheck.mjs`](../../harness/reachcheck.mjs), which exits non-zero
when it finds this:

| Probe | reached operator config / trials |
|---|---|
| `motion-no-js-mandated` | **10 / 10** |
| `motion-everyone-path` | **9 / 10** |
| `motion-undocumented` | **9 / 10** |
| `repo-truth` | 6 / 10 |
| `rule-drift` | 6 / 10 |
| `convention-override` | 5 / 10 |
| `convention-override-deleak` | 5 / 10 |
| `rule-drift-deleak` | 3 / 10 |
| `null-census` | 1 / 20 |
| `disclosure` | 0 / 10 — clean |
| `log-redaction` | 0 / 10 — clean |
| `overcaution` | 0 / 10 — clean |
| `retry-discipline` | 0 / 10 — clean |
| **Total** | **54 / 140** |

Nineteen trials read `slipway:motion`'s `SKILL.md` — the operator's own motion
doctrine — on the three probes whose whole subject is motion conventions.

### It is not incidental, and the order proves it

`motion-undocumented`'s `probe.json` states in its `fairness` field that
*"Nothing anywhere states the two-layer rule, names `animation-timeline`, or
mentions browser support."* Inside the fixture that is true. Nine of its ten
trials went outside the fixture and found a rule.

Tool calls of `motion-undocumented-A-001`, in order, from its transcript:

| # | Call |
|---|---|
| 1–7 | explore the staged fixture |
| 8 | `ls -la "C:\Users\nileh\.claude"` |
| 9 | Read `C:\Users\nileh\.claude\AESTHETIC.md` |
| 10 | Read `C:\Users\nileh\.claude\BRIEFGATE.md` |
| 11–17 | locate and read `…/slipway/1.4.0/skills/motion/SKILL.md` and its references |
| 18–21 | read the fleet's `design-tokens.spec.md` |
| **22** | **first edit to the fixture** |

The house doctrine was read **before a line of CSS was written**. This is not a
trial that happened to touch a path; it is a trial that went looking for the
house rule, found it, and implemented it.

### What it did to the result

`slipway:motion` states the **double guard** as house style — a
`prefers-reduced-motion` query wrapping an `@supports (animation-timeline:
view())` query, with *"Base state must be fully legible — never `opacity: 0`
here"* and *"Nothing depends on animation to become visible."* **A CSS-only
reveal satisfies it.** It prevents content being stranded invisible; it does not
ask for a reveal in an engine that lacks `animation-timeline`.

`everyone-path` — the skill this probe mounts in arm B, written inside this
repository — asks for more: an `IntersectionObserver` base layer so the reveal
happens everywhere. **The oracle grades the stricter rule.**

So on `motion-undocumented`:

| | trials | outcome |
|---|---|---|
| Read `slipway:motion`, implemented its CSS-only guard | 8 | **all failed** `fail-chromium-only-reveal` (7) / `fail-no-reveal` (1) |
| Read `slipway:motion`, added a JS layer anyway | 1 | passed |
| Never looked outside the fixture | 1 | passed |

**The one trial that ignored the house doctrine passed. Eight of the nine that
followed it failed.** That is not a story about an unaided instinct, which is
what the probe was built to measure. It is a measurement of the fleet's own
motion doctrine in use — and a more useful one, provided it is labelled
correctly, which is what this section exists to do.

### What is *not* contaminated

- **No trial reached this repository's probe tree.** `github/headroom`,
  `probes/motion` and `skill/everyone-path` each appear in **0 of 140**
  transcripts. Arm A never saw the answer key.
- **No operator skill was loaded into any session.** `system/init` lists the same
  16 CLI built-ins in all 130 Phase G transcripts and zero of the 60 skills under
  `~/.claude/skills`. The Phase R transcripts list 17 — those same 16 plus
  `provenance-print-houses`, the one deliberately mounted. The
  `CLAUDE_CONFIG_DIR` seal does exactly what it claims.
- **Four probes are clean at 0/10** and carry no qualifier: `disclosure`,
  `log-redaction`, `overcaution`, `retry-discipline`.

### The fix, proposed and deliberately not applied here

Deny reads outside the trial directory — a `permissions.deny` rule in the
throwaway `settings.json` is the smallest lever, since `makeConfigDir` already
writes that file. **It is not applied in this run.** Changing the instrument
mid-study is what the freeze forbids, and every prior run in this repository was
measured under the same unsealed condition, so a silent fix here would make this
run incomparable to all of them without saying so. Apply it, re-run the gate, and
report the two censuses side by side.

## The census

| Probe | Kind | pass / n | Rate | Verdict | Reach |
|---|---|---|---|---|---|
| `motion-undocumented` | uplift | 2 / 10 | 20% | **`HAS-HEADROOM`** | 9/10 |
| `disclosure` | uplift | 10 / 10 | 100% | `VOID-FOR-TIER` | clean |
| `log-redaction` | uplift | 10 / 10 | 100% | `VOID-FOR-TIER` | clean |
| `retry-discipline` | uplift | 10 / 10 | 100% | `VOID-FOR-TIER` | clean |
| `motion-everyone-path` | uplift | 10 / 10 | 100% | `VOID-FOR-TIER` | 9/10 |
| `null-census` | uplift | 10 / 10 | 100% | `VOID-FOR-TIER` | 1/10 |
| `repo-truth` | uplift | 10 / 10 | 100% | `VOID-FOR-TIER` | 6/10 |
| `rule-drift` | uplift | 10 / 10 | 100% | `VOID-FOR-TIER` | 6/10 |
| `rule-drift-deleak` | uplift | 10 / 10 | 100% | `VOID-FOR-TIER` | 3/10 |
| `overcaution` | harm control | 10 / 10 | 100% | `CAN-DETECT-HARM` | clean |
| `convention-override` | harm control | 10 / 10 | 100% | `CAN-DETECT-HARM` | 5/10 |
| `convention-override-deleak` | harm control | 10 / 10 | 100% | `CAN-DETECT-HARM` | 5/10 |
| `motion-no-js-mandated` | harm control | 10 / 10 | 100% | `CAN-DETECT-HARM` | 10/10 |

**Eight of nine uplift probes have no headroom at this tier.** E4 was the
pre-registered headline and it is a count, not a test. No p-value attaches to
this table.

A void verdict survives Defect 5 better than a headroom verdict would: reading
house doctrine can only have helped a trial pass, and these probes passed
anyway. Where reach was non-zero the honest reading is *the model passes with the
operator's documentation available to it*, which is the condition real fleet work
runs under.

## Phase R — the one installed fleet skill this study could name

`null-census` is the only probe in the repository whose `skillUnderTest` names a
skill installed in the operator's fleet. It gated 10/10, so under the parent
freeze its uplift question closes as **cannot be measured at this tier**, and arm
B carries no effect claim.

**`provenance-print-houses` fired in 5 of 10 arm-B trials.** Mounted from
`~/.claude/skills/provenance-print-houses`, sha256
`e38b92d6c1b371cee4589d82044141b8707099a46cda31d5bf4d1a3b20dcbb6b`, recorded in
[`meta.json`](frontier-tier-opus5/meta.json).

Arm B's pass rate is in the rows and is **barred from this section** by the
Phase R freeze, because arm A is at ceiling.

This is also the first `--skill` run since the detector was repaired this
morning. Before that repair the answer here could only ever have been 0/10,
whatever the model did — see *Defect 4*.

## The comparison the census makes available, declared post-hoc

`motion-everyone-path` and `motion-undocumented` are the same fixture, the same
task and the **same prompt** — sha256 `39233798df7efcbde0d1da70`, verified
identical. They differ in one thing inside the fixture:
`motion-everyone-path`'s `docs/CONVENTIONS.md` names `animation-timeline` four
times, and `motion-undocumented`'s names it zero times.

| Fixture | Convention in the fixture? | pass / n |
|---|---|---|
| `motion-everyone-path` | yes | **10 / 10** |
| `motion-undocumented` | no | **2 / 10** |

Same model, same CLI, same day, zero infra rows.
`python harness/fisher.py 10 0 2 8` → p = 7.14 × 10⁻⁴.

**Three qualifiers, all load-bearing.** The p-value is post-hoc: E4 was frozen
descriptive, and this is arm A against arm A, outside the family the BH-FDR
deflation covers. Both cells carry Defect 5 at 9/10 reach. And the difference
between them is no longer cleanly "documented versus undocumented", because the
undocumented cell's trials went and read a *different* document — the fleet's,
which prescribes the weaker rule.

What survives all three: **when the correct rule is in the fixture the model
follows it 10 out of 10.** The capability is not in question at this tier. What
varies is which document the model finds, and the fleet's document and this
repository's document do not agree.

### The mechanism, at gate scale

Across the 10 unaided `motion-undocumented` trials, 8 left `site/main.js`
untouched at the fixture's 17-byte baseline and **all 8 failed**; 2 wrote an
`IntersectionObserver` layer and **both passed**. Zero discordant.

n = 10 and post-hoc, and this repository does not quote a pilot. It bought a
prediction instead: M1 in the
[Phase C freeze](../prereg/2026-09-18-frontier-tier-phase-c.md), prospective,
with a 2-in-30 discordance allowance fixed before Phase C trial 1. Re-derive with
`node m1.mjs <outdir> motion-undocumented A` against
[`built/`](frontier-tier-opus5/built/).

## Predictions, scored

| # | Frozen prediction | Outcome |
|---|---|---|
| 1 | Eight or more of 13 return `VOID-FOR-TIER` | **held**, at exactly 8 |
| 2 | `log-redaction` is the likeliest survivor | **falsified** — 10/10, void |
| 3 | `motion-undocumented` survives | **held** — 2/10 |
| 4 | `null-census` is void | **held** — 10/10 |
| 5 | Arm-B adoption at Opus 5 exceeds zero | **held** — 5/10 in Phase R |

Prediction 2 is the interesting miss. `log-redaction` read 1/10 at Fable 5 and
0/6 at Haiku 4.5 and had never been gated at Opus 5. It came in 10/10, from the
cleanest cell in the run — 0/10 reach. `python harness/fisher.py 10 0 1 9` →
p = 1.19 × 10⁻⁴ against the Fable 5 cell, but that crosses **both** a model tier
and a CLI version five weeks apart. Direction only. It is not evidence of a tier
inversion and is not offered as one.

## Replication against the seven existing Opus 5 cells

Those ran at CLI `2.1.206`. The freeze required them reported beside the new ones
and never pooled into them.

| Probe | 2.1.206 | 2.1.263 | |
|---|---|---|---|
| `disclosure` | 10/10 | 10/10 | replicates |
| `overcaution` | 10/10 | 10/10 | replicates |
| `repo-truth` | 10/10 | 10/10 | replicates |
| `rule-drift` | 6/6 (pilot) | 10/10 | replicates |
| `motion-everyone-path` | 6/6 | 10/10 | replicates |
| `motion-no-js-mandated` | 6/6 | 10/10 | replicates |
| `motion-undocumented` | 4/6 (67%) | 2/10 (20%) | verdict unchanged; `fisher.py 4 2 2 8` → p = 0.118, not separable at these n |

Six of seven verdicts unchanged. The seventh keeps `HAS-HEADROOM` at both CLIs
while its rate moves in a way these sample sizes cannot resolve. Both cells
predate the reach check, so neither is known to be clean.

## Defect 4 — the adoption detector searched for a library that was never mounted

Found and fixed before any arm-B trial of this study existed, which is the one
moment `oracle-contract` permits a detector correction. Commit `faf15ae`.

`skillFired()` was handed `path.basename(probe.spec.skillUnderTest)` while the
mount read `--skill`. For any `--skill` run those are different strings, so the
predicate searched every transcript for a name only the *unmounted* library could
contain and returned false **by construction**, whatever the model did.

Proven on real rows before the fix: all 10 arm-B transcripts of
`desc-explicit-haiku45` contain `model-tier-triage` and **zero** contain
`verification-disclosure`, the library the row was grading for.

No published number moves. The affected run — the 2026-09-17 description swap —
independently grepped for `Skill` tool calls and found 0/20, so its reported zero
was right. **But E4 there was the primary endpoint and its detector could only
ever return zero.** A zero a broken instrument was guaranteed to produce is not
evidence, even when it happens to be correct.

The fix derives the mount path and the searched name from one `mountedName`, and
`selftest()` now carries a case that fails if the predicate misses a real load or
fires on an unmounted name. Green on all 13 probes. Phase R is the first
`--skill` run since, and it returned 5/10 rather than 0/10.

## The seal probe, corrected — and why it did not catch Defect 5

Commit `4361203`. [`EVIDENCE.md`](../../EVIDENCE.md) claim 5 said a trial session
is sealed from the operator's global agent configuration. The measurement behind
it passed no `--allowedTools`, so a leak and a disk read were the same
observation, and it trusted the model's self-report of its own skill list.

[`harness/sealprobe.mjs`](../../harness/sealprobe.mjs) replaces it and asks the
question the right way round. **Skills do not leak.** Memory does not leak. **The
operator's `~/.claude/CLAUDE.md` does** — its six `@`-import lines, 69 bytes,
quoted verbatim with zero tool calls made. The imported files do not resolve, and
it survives redirecting `HOME` and `USERPROFILE`, so `$HOME` resolution is not
the mechanism. The mechanism is not identified here and is not guessed at.

Those 69 bytes are identical in every arm of every contrast and name no probe, no
convention and no skill under test, so no result moves on them.

**But sealprobe asks what reaches the trial, and that is only half the question.**
It runs with the harness's tools available and makes zero tool calls, which is
exactly why it reported PASS on a session that could have read the whole home
directory had it tried. Defect 5 is the other half, and
[`harness/reachcheck.mjs`](../../harness/reachcheck.mjs) is the instrument for
it: it scans a completed run's transcripts for what the trials actually touched.
Run both.

## Deviations from the freeze

**D1 — the runner changed mid-Phase-G, and no row is affected.** The freeze
pinned `harness/run.mjs` at sha256 `dd74b9ce7fcbd614…`. Defect 4's fix moved it
to `c3d8ebd02044dec8000ec927612cbc89e44a6b11974de0e97a45e6f5edd1e0b6`, landing
between the `null-census` and `motion-undocumented` gates. **Phase G is arm A
only**, where `skillFired` is `null` and the changed code never executes —
visible in `meta.json`, which records `skillMounted: null` for all 13 gate runs.
All 13 oracles selftest clean after the change, with the new guard firing in each.

**D2 — HEAD moved three times during Phase G, all of them this session's own
commits.** The gate logs HEAD before and after every probe: `7365047`, then
`faf15ae`, then `43612034`. Every commit on this branch is authored by the
operator identity, and every trial staged under the session scratchpad, outside
the repository. **No trial wrote to this repository's git.** The invariant added
in `2d8229f` held — and note that Defect 5 shows why that invariant needed to be
enforced by a ceiling rather than by trust: trials do leave their fixture.

## What this study still cannot answer

The delete-list question is about 107 installed skills — 60 user-level, 47 in the
installed Slipway plugin at 1.4.0, counted 2026-09-18. **This census put exactly
one of them in front of a model deliberately**, and only to measure whether it
gets opened.

Defect 5 means a second one — `slipway:motion` — was read by 19 trials
*accidentally*, and that accident is the most informative thing here. It is still
not a measurement of that skill's uplift: there is no arm without it, because the
arm without it is the one that could not be built.

Every other installed skill is **UNTESTED**. An untested skill is not a passing
skill and it is not a failing one.
