---
name: uplift-eval-core
description: The spine of an uplift measurement — A/B/C arm definitions, the three honest verdicts (UPLIFT / NO EFFECT / INCONCLUSIVE), the routing-vs-uplift instrument split, the pre-registration freeze ritual, and the publish-the-negative rule. Use when asked "does this skill/prompt/library actually help", before spending on any eval, or when writing up a finished measurement. Not for choosing what to probe — use probe-design. Not for whether the tier has room to improve — use headroom-calibration. Not for grading rules — use oracle-contract.
---

# Uplift eval — core

A skill library is a claim about behaviour. Either you measured it or you are
guessing. This skill is the frame everything else hangs off.

## The one rule

**A claim enters the record only with evidence a third party can re-derive
without trusting you.** Absence of evidence is UNVERIFIABLE, never a pass.

## Three arms

| Arm | Model | Library | Answers |
|---|---|---|---|
| **A** | subject | absent | What does the model do unaided? |
| **B** | subject | present on disk, prompt never mentions it | What does the model do with the library available? |
| **C** | stronger "ceiling" model | absent | What is the gap worth? |

Arm B is **soft-present**: the library sits in the trial's working copy, the
prompt is byte-identical to arm A's, and nothing instructs the model to consult
it. This is deliberate. A mandated library measures the library's *content*
while assuming its *adoption*; soft-present measures both at once, which is what
a user actually experiences. If B never opens the library, that is a finding, not
a broken trial — see the failure-routing table below.

Arm C prices the gap. **Gap closure = (B − A) / (C − A).** When C ≈ A the
denominator is noise: report the probe, exclude it from any closure aggregate,
and say why. Never quote a closure figure computed on a near-zero denominator.

## Two instruments, never conflated

| | Routing eval | Uplift eval |
|---|---|---|
| Question | Does the right skill get selected? | Does behaviour change? |
| Cost | cheap | expensive |
| Run it | on every description edit | on every library revision |
| Evidence for | discoverability | **effect** |

Routing success is not uplift evidence. A skill that fires reliably and changes
nothing is a routing success and an uplift failure. Report them separately or you
are laundering one into the other.

## Three verdicts, all publishable

- **UPLIFT** — B beats A at the pre-registered bar. Scope the claim to the tier,
  the probes, and the fixtures you actually ran.
- **NO EFFECT** — adequately powered, B ≈ A. This is a result. Publish it.
- **INCONCLUSIVE** — underpowered, or the design could not discriminate.
  Say which, and say what n would settle it.

**Publish the negative.** A pre-registered null on a well-powered probe is a
more credible artifact than a positive with no pre-registration, and a library
that only ever reports wins is indistinguishable from one that never measures.

## When B ≈ A, route the failure

| Observation | Diagnosis | Fix |
|---|---|---|
| Skill never opened in any B trial | trigger / discoverability problem | rewrite the description, then re-run the **routing** eval — not the uplift eval |
| Opened, behaviour unchanged | content problem | the skill says nothing the model wasn't already doing |
| B *worse* than A | overhead or derail | the skill costs more than it returns; check the matched harm control |
| A already at ceiling | wrong tier | headroom-calibration — the probe is void for this tier |

Fixing the wrong one of these burns a run. Read the transcripts before you
rewrite anything.

## Pre-registration freeze

Nothing is measured until this is committed. After the freeze commit, the run log
is append-only; a mid-run change to any frozen field invalidates every affected
trial, and the invalidation is recorded rather than quietly absorbed.

```markdown
# Pre-registration — <library> uplift, <subject model>
Frozen at commit: <sha>          Date: <date>
Harness: <cli name+version>, <runner sha>

## Arms
A: <model>, library absent
B: <model>, library at <path/sha>, soft-present
C: <ceiling model>, library absent

## Probes
<id> | <what it measures> | oracle <file> | n=<per arm>

## Prompts
Verbatim, byte-identical across arms: <files+sha256>

## Metrics
Primary:   <one metric, one probe>
Secondary: <directional only>
Harm control: <matched probe id>

## Bars
Significance: Fisher exact two-sided, alpha=<x>
Claimable at: p < <x> on the primary
Directional at: <range>
Abort if: <infra floor, e.g. 6 invalid rows>

## Exclusions
Declared in advance: <what will be dropped and why>
```

## Recording a run

The run record carries, at minimum: the freeze commit, CLI and runner versions,
every arm's model id, per-trial rows with classifications, the infra rows that
were excluded and why, the statistics with the exact command that produced them,
and the verdict in the vocabulary above. If a number in the write-up cannot be
traced to a row in that record, it does not go in the write-up.

**Pin the CLI version.** A coding-agent CLI ships its own built-in skills that
compete for invocation, and that set changes between releases. A run whose CLI
version is unrecorded cannot be compared to any later run.

## STOP conditions

- **Trials ran with no pre-registered bar** → the measurement is void. You will
  find a threshold the data clears. Re-register and re-run.
- **No fresh subject-model sessions** → if the trials ran inside the session
  doing the analysis, label the result *self-run, not cold-context*. It is not
  evidence of subject-model uplift and never satisfies an uplift claim.
- **The oracle was adjusted after seeing arm B** → those trials are gone. An
  oracle is frozen by oracle-contract's pristine-state gate before trial 1.

## Siblings

- **headroom-calibration** — is there room to improve at this tier at all?
- **probe-design** — what to probe and how to make it fair.
- **oracle-contract** — how trials are graded.
- **trial-harness-ops** — sealing, isolation, infra rows, resume.
- **uplift-statistics** — significance, power, and how many trials.
