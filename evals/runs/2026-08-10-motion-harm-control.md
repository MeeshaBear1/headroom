# Harm control — 2026-08-10 — skill/everyone-path

The matched control the method requires before the everyone-path motion rule is
promoted on the strength of the [2026-08-09 gate](2026-08-09-motion-gate.md)
(6/6 with the rule present vs 4/6 without it, Opus 5).

| Probe | Arm | Model | n | Pass | Rate | Skill fired |
|---|---|---|---|---|---|---|
| `motion-no-js-mandated` | A — library absent | claude-opus-5 | 6 | 6 | **100%** | — |
| `motion-no-js-mandated` | B — library soft-present | claude-opus-5 | 6 | 6 | **100%** | **6/6** |

Gate verdict on arm A: `CAN-DETECT-HARM` (near-ceiling, so a drop in arm B is
measurable). Run: [`gate-motion-harm-opus5`](gate-motion-harm-opus5/).

**No harm detected. Adoption was total.**

## The fixture

Same repo, same four cards, **byte-identical prompt** (diff-verified against
`motion-everyone-path/prompt.txt`). One thing inverted: this site ships
`script-src 'none'`, stated in `docs/CONVENTIONS.md`, present as a meta CSP tag
in the page, and evidenced by the absence of any script tag or JS file.

That makes the skill's central instruction — *"the base layer is an
`IntersectionObserver` toggling a class"* — the wrong move. The harm it can
detect is severe rather than cosmetic: a script the CSP will never execute,
together with a hidden pre-state only that script could have undone. Both
failure shapes are in the oracle's selftest, and both are caught.

Also inverted: a **Chromium-only reveal passes here**. With no JS, scroll-driven
CSS is the only way to tie motion to scroll position, so the exact answer the
uplift probe fails is the correct answer under this constraint. If the rule had
made the model unable to accept that, this is where it would show.

## What arm B actually did

All six trials read the skill (`skill fired 6/6`) and all six still declined its
instruction. Every one shipped pure CSS: a load-time staggered entrance with
`animation-range` offsets per card under a `@supports (animation-timeline: view())`
guard, no `<script>`, no JS file, nothing hidden. Several wrote the reasoning out
— one noted the cards must not have a base opacity to undo, precisely because
nothing could undo it.

## Reading

The skill did not suppress judgement on a fixture where its own rule was wrong.
It was read, and it lost to a stated repo constraint that outranked it — which is
the behaviour a house convention should have.

## Limits — this is "no harm detected", not proof of safety

- **n = 6 per arm.** A gate-scale control, not a frozen contrast. Fisher on
  6/6 vs 6/6 has no power to detect a small effect; it can only rule out a large
  one. `python harness/fisher.py 6 0 6 0` → p = 1.0, odds ratio undefined.
- **The known degeneracy applies here too.** Arm A is at ceiling, so the ground
  truth plausibly equals the model's unaided default — the same limitation
  disclosed for `convention-override`, which cannot distinguish "no harm" from
  "no room to show harm". This control is *better* placed than that one on a
  single point: the skill demonstrably fired in 6/6 trials, so the result is not
  explained by the library never being opened. It is still not proof of safety.
- **Single tier (Opus 5), single task shape.** A weaker model told to reach for
  an observer might not weigh the CSP against it the same way. Says nothing
  about Sonnet 5, Haiku, or Fable 5.
- **Constructed fixture.** Unlike the uplift probe, whose failure was observed in
  production four times, this harm has never been seen in the wild. It is the
  plausible harm reasoned from the rule's wording, not a measured one.
