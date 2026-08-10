# Gate run — 2026-08-09 — the everyone-path motion rule

Two probes, one rule, one variable: **is the convention written down or not.**

| Probe | Rule present in repo? | Model | n | Unaided pass | Verdict |
|---|---|---|---|---|---|
| `motion-everyone-path` | yes — `docs/CONVENTIONS.md`, bold pointer in README | claude-opus-5 | 6 | **6/6 (100%)** | `VOID-FOR-TIER` |
| `motion-undocumented` | no — motion section removed, pointer removed | claude-opus-5 | 6 | **4/6 (67%)** | `HAS-HEADROOM` |

Runs: [`gate-motion-opus5`](gate-motion-opus5/), [`gate-motion-undoc-opus5`](gate-motion-undoc-opus5/).

## Why the pair exists

The first probe alone is uninterpretable. `VOID-FOR-TIER` at 6/6 could mean
either "Opus 5 already builds a fallback reveal unaided" or "Opus 5 complied
with a rule it was handed in bold on the first screen." Those have opposite
consequences for whether the rule should be written at all.

The second probe removes the rule and changes nothing else. The difference
between the two columns is the value of writing it down.

## The rule

Scroll-driven CSS (`animation-timeline: view()`) is progressive garnish, never
the only reveal path. `animation-timeline` ships in Chromium and nowhere else, so
a reveal built on it alone means every other browser sees no reveal at all — and
where a hidden pre-state sits outside the `@supports` guard, sees the content
never appear.

## Oracle

Behavioural, two real engines, no source-text matching and no LLM in the pass/fail
path. The built page is loaded in Chromium (has the API) and Firefox (does not).
A pass requires a reveal that **conceals then completes in both**. Four selftest
cases, including both pristine-state gates: fails on the untouched fixture (no
reveal), passes on the two-layer implementation, and fails on each of the two
distinct failure mechanisms with distinct labels.

One oracle bug was found and fixed during authoring, and it is worth recording
because it is a fact about the platform: **a scroll-timeline animation with no
explicit `animation-duration` degrades to duration-0 with `fill: both` in a
non-supporting engine, so it lands on its end state and the content is visible.**
Nothing is stranded; there is simply no reveal. A hidden-content check cannot see
that failure, which is why the oracle requires concealment to be *observed* in the
negative engine rather than merely absent.

## What the failures actually did

Both failing trials in the undocumented arm wrote the production defect exactly:
`site/main.js` left untouched at 17 bytes, the entire reveal built on
`animation-timeline: view()` inside a `@supports` guard. One carried a comment
asserting that "no-support browsers land on the final state, never a partial one"
— which is the belief that makes the defect ship. Both also referenced custom
properties they never defined, so their reveal did not work in Chromium either.

The four passing trials each built an `IntersectionObserver` toggling a class
against a CSS transition — the base layer — without being told to.

## Reading

**The rule earns its place, and its value is in existing and being findable, not
in its argumentation.** With the convention present, the model complies without
persuasion; with it absent, a third of trials reach for the Chromium-only
pattern. This matches the field evidence that prompted the probe: four of five
site repos in one fleet shipped scroll-timeline-only reveals, and none of those
repos had the rule written anywhere.

It also bounds what more doctrine can buy. The gap closed at 100% the moment the
rule was present in one short paragraph with a worked example. Additional prose
arguing for the rule has nothing left to move.

## Limits

- **n = 6 per arm. This is a gate, not a frozen contrast.** The 67% figure is a
  pilot number and must not be quoted as a baseline; a contrast would freeze
  arms at n = 30 and run Fisher's exact against a matched harm control.
- No harm control was run. Before this rule is promoted anywhere on the strength
  of a measured effect, a matched control is required — a fixture where the
  everyone-path instinct is the wrong move, to check the rule does not suppress
  judgement generally.
- Single tier (Opus 5) and single task shape. Says nothing about other tiers.
- The probe measures one convention in one file in a small fixture. Real repos
  are larger and their conventions are easier to miss; findability in a big tree
  is not measured here.
