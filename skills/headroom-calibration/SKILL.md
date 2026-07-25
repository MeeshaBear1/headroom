---
name: headroom-calibration
description: The cheap arm-A-only screen that decides whether a probe can show uplift at a given model tier before you pay for arms B and C — void-for-tier and floor-suspect verdicts, gap-closure validity, and how to scope a claim to the tier it was measured at. Use before any uplift run, when re-running old probes against a newer or stronger model, or when a result came back null and you suspect a ceiling. Not for arm definitions or verdict vocabulary — use uplift-eval-core. Not for building the probe — use probe-design.
---

# Headroom calibration

An uplift eval can only detect what the unaided model gets wrong. If the subject
model already passes a probe with no library, the probe has no headroom at that
tier and the contrast is arithmetic on a ceiling. You will get a null, and the
null will tell you nothing about the library.

**Run the gate first. It is one arm, small n, and it is the cheapest thing in the
whole programme.**

## The gate

Arm A only, subject model, n = 5–8. Then:

| Unaided pass rate | Verdict | Action |
|---|---|---|
| ≥ 90% | **VOID-FOR-TIER** | Stop. Do not buy arms B and C. Record the void and publish it. |
| 5% – 90% | **HAS-HEADROOM** | Proceed to the full pre-registered run. |
| ≤ 5% | **FLOOR-SUSPECT** | Confirm the task is achievable at all before reading any B result as uplift. |

The thresholds are pre-registered, not chosen after looking. Put the exact
numbers in the freeze commit.

### Why the floor matters as much as the ceiling

A near-zero arm A can mean the model needs help — or that the task is impossible,
the fixture is broken, or the oracle is wrong. Those are indistinguishable from
the A rate alone. Resolve it by running the probe's pristine fixed state through
the oracle (oracle-contract's gate) and, if still unclear, one arm-A trial with
the answer handed over in the prompt. If that fails too, the probe is broken, not
the model.

## VOID-FOR-TIER is a publishable result

"This library's provenance probes are void at frontier tier: the unaided model
passed 10/10 on every fixture the skill exists to fix" is a real, useful finding.
It tells the community exactly what the library is for and what it is not for.
Record it with the same rigour as an uplift:

```markdown
### <probe id> — VOID-FOR-TIER (<model>)
Arm A unaided: <pass>/<n>. Gate threshold: >=90%.
Arms B and C not run. Reason: no headroom to measure at this tier.
Implication: this probe's claim is scoped to tiers where A < 90%.
```

## The trap this exists to stop

The standard mistake: a library is validated on a cheap model, shows a large real
effect, and is then presented as a general improvement. A new frontier model
ships, someone re-runs the same probes, gets a flat null, and concludes the
library is worthless. Both readings are wrong. The honest statement is that the
intervention was measured at one tier and its scope is that tier until measured
at another.

**Cheap-model uplift does not generalise upward, and a frontier null does not
retract a cheap-tier result.** They are separate measurements of separate
populations. Never let one stand in for the other.

## Where frontier headroom actually lives

At frontier tier the gaps are rarely "the model doesn't know how". Probes that
survive the gate against a strong model tend to target one of:

- **Repo-local truth that conflicts with the general prior** — a convention,
  signature, unit, or pinned version where the conventional answer is wrong here
  and the correct answer is documented one file away. The model *can* find it; the
  question is whether it looks before writing.
- **Discipline under pressure** — reporting a blocked verification honestly when
  the prompt demands a green light, disclosing a limitation that costs the user
  something, refusing an easy overclaim. The model is capable of the right
  behaviour and defaults to the wrong one.
- **House-specific facts** — anything not derivable from general knowledge:
  private invariants, internal formats, local policy.

Probes that ask a strong model to reason well, recall public facts, or write
competent ordinary code will be void at frontier tier. That is not a flaw in the
probe; it is the probe measuring nothing.

## Gap closure and when it is undefined

**Gap closure = (B − A) / (C − A)**, where C is a stronger ceiling model unaided.
It answers "how much of the distance to a better model did the library buy?"

Report it only when C − A is large enough to divide by. When C ≈ A, the probe is
telling you the *model tier* is not the binding constraint — the failure is
behavioural, not capability. Report the probe, exclude it from the closure
aggregate, and state that C ≈ A rather than printing a ratio.

## Scoping the claim

Every uplift claim carries its tier, its probes, and its fixtures:

> On <probe set>, with <library> soft-present, <model> went from <A> to <B>
> (p = <x>, n = <n>/arm). Measured at <model> tier only; <other tiers> not run.
> Matched harm control <probe>: <result>.

Strip any of those qualifiers and the sentence becomes an overclaim.

## Siblings

- **uplift-eval-core** — arms, verdicts, pre-registration.
- **probe-design** — building a probe with real headroom.
- **oracle-contract** — proving the oracle can discriminate at all.
- **uplift-statistics** — how many trials the gate and the run each need.
