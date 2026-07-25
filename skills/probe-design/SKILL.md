---
name: probe-design
description: How to build a probe that measures something — gap selection, the fairness contract, discriminator design, the adversarial pressure variant, and the matched harm control that prices the intervention's cost. Use when writing a new eval fixture or task, when a probe keeps producing ties, or when reviewing whether a probe is measuring the library or measuring the model's general competence. Not for grading logic or the pristine-state gate — use oracle-contract. Not for arm structure — use uplift-eval-core.
---

# Probe design

A probe is a task plus a fixture plus a ground truth. Most probes measure nothing.
These are the rules that separate the two.

## 1. Target a gap, not reasoning

A probe a strong model answers unaided from general knowledge measures the model,
not the library. Aim at knowledge the model cannot have (repo-local conventions,
private invariants, house formats, pinned versions) or at a default behaviour that
is wrong (claiming unverified success, overclaiming, deleting a guard).

Ask before building: *what does the library know that the model cannot?* If the
answer is "nothing, it just reminds it to be careful", expect a small effect at
best and design the pressure variant carefully — that is where the effect will be.

## 2. The fairness contract

Every fact the oracle checks must be discoverable in the fixture without the
prompt naming it. Write the contract down in the probe spec:

- The rule is stated **verbatim** somewhere a competent developer would look.
- Something on the first screen (README, module header) points there.
- The prompt names **neither** the document nor the rule.
- A worked example in the fixture covers the exact case the oracle grades.

If a rule is only inferrable, the probe measures guessing. If the prompt points at
the document, the probe measures reading comprehension. The gap between those two
is the whole measurement.

**Unfair probes produce large, meaningless effects.** They are the easiest way to
manufacture a result and the easiest thing for a reviewer to catch.

## 3. Design a discriminator, not a difficulty

The strongest fixtures contain two cases whose correct answers differ *only* if the
rule was followed. Same inputs by every conventional reading, different required
outputs under the documented rule. Then a passing result cannot be luck, and the
specific wrong answer names the specific wrong assumption.

Weak: "did it produce roughly the right number".
Strong: "these two orders have the same subtotal and must have different tax; only
the documented per-line rule yields both."

Name the conventional-prior failure as its own outcome class so the results table
shows *how* it failed, not just that it did.

## 4. Byte-identical prompts across arms

One prompt file, shared by A, B and C, hashed in the pre-registration. The prompt
never mentions skills, libraries, documentation, or being careful. Any difference
between arms other than the library's presence and the model id is a confound.

## 5. At least one adversarial pressure variant

Include a probe whose prompt actively demands the wrong-but-easy behaviour:
release pressure, a deadline, "just confirm it's fine", an authority asserting the
false premise. Discipline that only holds when nothing is pushing on it is not
discipline, and unaided models fail these where they pass the calm version.

## 6. At least one matched harm control

For every probe where the library is expected to help, build the probe where its
bias is **wrong** — same fixture, byte-identical prompt, ground truth inverted.

- A skill that teaches "disclose blocked verification" gets a probe where
  verification succeeds and the correct answer is to say so plainly.
- A skill that teaches "don't delete guards" gets a probe where the fence is
  genuinely dead and the correct answer is to remove it.

The harm control is not optional and it is not a footnote. A library that lifts
one behaviour by suppressing judgement everywhere else is a net loss, and the only
way to see that is to measure it. **The cost rides with the headline claim, in the
same table.**

## 7. Ground truth is a fact, not an opinion

The correct answer must be checkable by a script: an exact value, an exact symbol,
a file hash, a runnable hidden test. If deciding pass/fail needs a judgement call,
the probe is not finished — see oracle-contract.

## Probe spec

Ship this next to the fixture; it is what a reviewer reads first.

```json
{
  "id": "<slug>",
  "gap": "knowledge | discipline | house-fact",
  "harmControl": false,
  "pressure": false,
  "matchedTo": "<probe id, for harm controls>",
  "skillUnderTest": "<path to the exact library text used in arm B>",
  "groundTruth": "<the correct behaviour, stated as a fact>",
  "failureMeasured": "<the specific wrong default this probe catches>",
  "fairness": "<where the rule is stated, what points to it, what the prompt does not say>"
}
```

## Smells

| Smell | What it means |
|---|---|
| A and B tie at 100% | ceiling — headroom-calibration |
| A and B tie at 0% | task impossible or oracle wrong |
| Effect only on the pressure variant | the library buys resistance, not knowledge — say so |
| The prompt mentions the doc | measuring reading, not looking |
| Ground truth needs a judge | not a probe yet |
| No harm control | not publishable |

## Siblings

- **oracle-contract** — grading, the pristine-state gate, selftests.
- **headroom-calibration** — whether this probe has room at your tier.
- **uplift-eval-core** — arms, pre-registration, verdicts.
