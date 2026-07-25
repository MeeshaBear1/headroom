---
name: oracle-contract
description: The contract every trial grader must satisfy — deterministic classification, the pristine-state gate (must FAIL at base, PASS at the historical fix), counterfactual selftest cases, an outcome taxonomy that names failure modes, and why a model's opinion is never an oracle. Use when writing or reviewing the code that grades trials, when a probe's results look implausible, or when tempted to score results by reading them. Not for designing the task or fixture — use probe-design. Not for significance testing — use uplift-statistics.
---

# The oracle contract

An oracle turns a trial into one of a fixed set of outcomes, by executing code.
If a human or a model has to decide, it is not an oracle.

## Hard rules

1. **A script grades every trial.** An exact value, an exact symbol, a file hash,
   or a runnable hidden test. Never a model's opinion, never a similarity score,
   never "looks right".
2. **The oracle is frozen before trial 1**, at the pre-registration commit.
   Adjusting an oracle after seeing arm B data discards those trials.
3. **Judged metrics are never primary.** If you want a quality score, use a blind
   judge with a rubric fixed before grading, never revealing the arm, and report it
   as secondary. It cannot carry a claim on its own.
4. **The oracle never reads the arm.** It sees a working directory and a
   transcript. If it can tell which arm produced them, it can be biased by them.

## The pristine-state gate

Before any trial runs, the oracle must:

- **FAIL** on the untouched fixture (the base state, before the work).
- **PASS** on the fixture with the known-correct fix applied.

An oracle that cannot fail at base is not detecting the behaviour — it is
detecting something that was already true. An oracle that cannot pass at the
pristine fix cannot be satisfied by any correct answer, so every trial it grades
is a false negative.

**A probe that fails this gate is dropped, not adjusted until it passes.** Tuning
an oracle to make a probe survive is how a broken probe reaches a run. Record the
drop and the reason; dropped probes go in the write-up.

## Counterfactual selftest cases

Ship the failing implementations, not just the correct one. Each named
counterfactual pins one wrong behaviour and proves the oracle distinguishes it:

```js
export const selftestCases = [
  { name: "base",          overlay: null,           expect: "fail" },  // gate: nothing done
  { name: "fixed",         overlay: "fixed",        expect: "pass" },  // gate: the historical fix
  { name: "prior-default", overlay: "subtotal-tax", expect: "fail" },  // the conventional wrong answer
  { name: "sloppy",        overlay: "float-money",  expect: "fail" },  // a plausible near-miss
];
```

Run the selftest in CI. It is offline, costs nothing, and it is the only evidence
that a number from the oracle means anything.

## Name the failure modes

`pass` / `fail` throws away the most useful half of the data. Return a class:

| Class | Meaning |
|---|---|
| `pass` | ground truth met |
| `fail-<prior>` | the specific conventional-prior mistake (e.g. `fail-subtotal-tax`) |
| `fail-nofile`, `fail-noexport`, `fail-throws` | did not produce a callable result |
| `fail-<mechanism>` | a distinct named wrong behaviour (`fail-fabricated`, `fail-suite-altered`) |
| `infra-*` | the harness broke, not the model — see trial-harness-ops |

Classes make the results table diagnostic: "12 of 20 failures were
`fail-subtotal-tax`" localises the gap. "12 failed" does not.

Classification is **ordered and total** — the first matching rule wins, every
trial gets exactly one class, and the order is part of the frozen oracle.

## Grading transcripts

Sometimes the behaviour under test *is* what the model said. Then:

- Grade the assistant's prose, not the tool log — extract text blocks and the
  final result, and grade that.
- Prefer a **required mention** over a forbidden phrasing. "The report must name
  the test that is red" is hard to satisfy dishonestly; "must not say the words
  *all tests pass*" is a vocabulary filter, and a paraphrase slips through.
- Anchor on facts the model cannot restate away: a file hash proving the red test
  was silenced beats any amount of prose analysis.
- Write the regexes against real transcripts from a pilot, then freeze them, then
  never touch them again during the run.

## Never grade what you did not seal

If the oracle checks that a file was not modified, hash the shipped original at
grade time from the probe source — not from a copy inside the trial directory the
model could have rewritten. Snapshot the trial's state (a diff or an archive)
*before* the oracle mutates anything, so a disputed row can be re-graded later.

## Siblings

- **probe-design** — the fixture and ground truth the oracle checks.
- **trial-harness-ops** — infra rows, snapshots, isolation.
- **uplift-statistics** — turning classes into a verdict.
