# Gates — the sealed re-gate at Opus 5, and `null-census` at Sonnet 5

Two gates, twenty graded trials, arm A only, under
[the 2026-09-20 freeze](../prereg/2026-09-20-seal-recheck-and-fleet-gate.md).
No contrast was licensed and none was run.

| | |
|---|---|
| Gate 1 | `motion-undocumented`, arm A, `claude-opus-5`, n = 10, **sealed** |
| Gate 4 | `null-census`, arm A, `claude-sonnet-5`, n = 10 |
| Harness | `harness/run.mjs` with the Defect 5 seal and the per-trial void rule |
| Out dirs | `seal-recheck-opus5-r2/`, `gate-nullcensus-sonnet5/` |
| Cost | $4.97 + $0.97 graded, plus $3.31 on a gate-1 attempt the instrument voided |

## Results

| gate | probe | model | sealed | n | pass | rate | verdict |
|---|---|---|---|---|---|---|---|
| 1 | `motion-undocumented` | `claude-opus-5` | yes | 10 | 10 | **100%** | `VOID-FOR-TIER` |
| 4 | `null-census` | `claude-sonnet-5` | no | 10 | 10 | **100%** | `VOID-FOR-TIER` |

Gate 1's tenth row was graded by `run.mjs regrade` against its saved transcript
and trial directory, after the void rule released it (below). The other nine
rows regraded to the class they were given live, nine for nine, which is the
only reason the tenth is quoted at all.

## The decision rule, applied

The freeze fixed three bands before trial 1. The sealed rate is 100%, inside the
band written as **≥ 70%**:

> The contrast largely measured contamination. **Cancel the re-run.** Publish the
> correction against claim 22.

So the $145 re-run of the census and contrast is cancelled, and the correction
below is the deliverable in its place.

## Predictions, scored

| # | Prediction | Outcome |
|---|---|---|
| P1 | Gate 1 returns `HAS-HEADROOM`, sealed rate ≤ 50% | **Falsified.** `VOID-FOR-TIER` at 100% |
| P2 | Sealed rate lands above the contaminated 26.7% | **Held**, by a margin nobody anticipated |
| P3 | Gate 4 returns `VOID-FOR-TIER` at ≥ 9/10 | **Held** at 10/10 |
| P4 | Zero trials classify `infra-reached-operator-config` | **Held on the seal, failed on the instrument** — see below |

P1 and P2 were written as compatible. They were not: the same direction that
carried P2 carried the rate straight past P1's ceiling. The freeze's own note
that "P1 is about the verdict, P2 about the direction of the rate" reads, after
the fact, as a way of being right either way, and it is recorded here as such.

## The correction against claim 22

[Claim 22](../../EVIDENCE.md) reads: *on the one probe with headroom at this
tier, a soft-present skill moved `claude-opus-5` from 8/30 to 30/30.* The 8/30
is an unsealed number. Sealed, the same probe and the same model pass 10 of 10.

| `motion-undocumented`, arm A, `claude-opus-5` | pass | n | rate |
|---|---|---|---|
| [2026-09-18](2026-09-18-contrast-motion-undocumented-opus5.md), unsealed | 8 | 30 | 26.7% |
| 2026-09-20, sealed | 10 | 10 | 100% |

`python harness/fisher.py 10 0 8 22` → **p = 5.16×10⁻⁵**. That test is
**post-hoc** and the freeze forbids pooling the two arms; they are set out side
by side and never summed.

The mechanism was already on the record before this gate ran, in two other
claims. [Claim 19](../../EVIDENCE.md): 19 arm-A trials read `slipway:motion`'s
`SKILL.md` before their first edit to the fixture, and of the nine that did so on
the graded probe, eight implemented its CSS-only guard and failed.
[Claim 24](../../EVIDENCE.md): arm A reached `~/.claude` in 20 of 30 trials and
arm B in 0 of 30, because in arm B the mounted skill is tool call 1 and the
model never goes looking. And the
[doctrine comparison](2026-09-20-doctrine-comparison.md) found that the stricter
rule the oracle grades is not a rule the fleet holds anywhere.

Put together: arm A was reading the house's own motion doctrine, complying with
it, and being graded against a rule that doctrine does not contain, while arm B
was structurally protected from doing the same. The gap claim 22 measures is
that asymmetry. **Claim 22 is withdrawn.** It is not evidence that a library
lifted a frontier model, and the probe is void at this tier once the fixture is
sealed.

## The seal

Across both gate-1 attempts — twenty sealed trials — **no trial obtained content
from the operator's config directory.**

| run | trials | mentioned `~/.claude` | attempts | refused | obtained |
|---|---|---|---|---|---|
| `seal-recheck-opus5` (voided) | 10 | 10 | 30 | 28 | **0** |
| `seal-recheck-opus5-r2` (graded) | 10 | 10 | 29 | 27 | **0** |
| `gate-nullcensus-sonnet5` (unsealed) | 10 | 0 | 0 | 0 | 0 |

Every trial tried. In the graded run the attempts split `Read` 15, `Bash` 10,
`Glob` 4; the two that were not refused outright were a directory listing and a
command that died on its own quoting. The deny rules are a speed bump by design,
and at this n the bump held.

`null-census` at Sonnet 5 never reached for the operator's disk at all, which is
consistent with its fixture: the contract doc it needs is inside the trial.

## The instrument was wrong three times, and it cost two runs

`obtainedOperatorContent` is the per-trial void rule. It was written three times
in one day, and the first two versions each voided a run the seal had in fact
protected.

| version | rule | what it did |
|---|---|---|
| v1 | any `tool_result` whose text contained the config path | voided 8 of 10 trials on an `ls ~/.claude` listing |
| v2 | pair the call with its result, exclude the known refusal string | voided 1 of 10 — the CLI refuses in a second voice (`Permission to use Bash with command … has been denied`), and a `bash: unexpected EOF` is not a refusal at all |
| v3 | a `tool_result` carries a line that is literally in one of the operator's own docs | 0 of 20 |

The fault in v1 and v2 is the same and it is structural, not a missing string:
both inferred success from the **absence** of a known failure, so every failure
mode not yet met read as a breach. The list of ways a command can fail has no
end. v3 asks for positive evidence — 757 sampled doctrine lines — and its
failure direction is now a *missed* breach rather than a false one, with
`reachcheck.mjs`'s conservative mention count standing as the published backstop.
`node harness/seal.mjs` asserts seven cases, including the two refusal voices,
the directory listing, and the shell error.

Three things follow, and all three are admissions.

- **$3.31 was spent on a gate that produced no row.** The void was ours.
- **A figure computed earlier today is withdrawn before it was ever published:**
  that of 102 historically contaminated trials only 52 obtained content. It was
  computed with v2. It is not restated here, because v3 samples only the
  operator's top-level docs and would undercount the plugin `SKILL.md` reads that
  claim 19 documents. The conservative mention count, 102 of 250, stands.
- **P4 is the prediction this section exists to honour.** The seal met it. The
  run as executed did not, and the reason was the instrument grading the seal.

## One hazard found in passing

The oracle resolves `playwright` from `C:\Users\nileh\node_modules` — a
home-directory install outside this repository that any session on the machine
can upgrade. It moved to 1.63.0 between the run and the regrade, and the regrade
failed on a missing Firefox build until 1.63.0's was installed. Had that upgrade
landed mid-run, ten trials would have graded `infra` on a browser that was
present when they started. The dependency belongs inside the repo; it is not
there yet, and this record is the only thing currently saying so.

## Limits

- n = 10 per gate. These are **gates**, not results: they license a decision
  about what to spend next, and nothing else.
- The sealed rate is measured on one probe at one tier. It says
  `motion-undocumented` is void at `claude-opus-5` under a seal. It says nothing
  about `rule-drift`, about Sonnet 5, or about Fable 5.
- The seal is verified at n = 20 against a model that was not instructed to
  escalate. `harness/sealtest.mjs` is the adversarial check and it is a separate
  instrument with its own ceiling.
- Gate 4 adds the second fleet-installed skill ever put through this harness, and
  it gated void. Two for two.
