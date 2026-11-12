# Doctrine comparison — does a fleet skill understate a gate the fleet enforces?

**No trials. No API spend.** A documentary comparison of the fleet's own skills
against the pass conditions of the instruments that enforce them, run after the
[frontier-tier census](2026-09-18-gate-frontier-tier-census.md) observed 19
trials reading `slipway:motion`'s `SKILL.md` off the operator's disk, and 8 of 9
doctrine-readers failing.

It was opened to confirm a hypothesis. It falsified it.

## The hypothesis

That a house document stating a **weaker** rule than the standard actually
enforced will steer a frontier model to the weaker answer — and that a 60-skill
global library plus ~121 repo libraries is a large unmeasured surface for it.

## Case 1 — motion. Coherent, and the probe is the outlier

| Source | What it requires |
|---|---|
| `slipway:motion` `SKILL.md` §1 | Base state fully legible — *"never `opacity: 0` here"* — with the animation layered on top inside a `prefers-reduced-motion: no-preference` / `@supports (animation-timeline: view())` double guard |
| `slipway:motion` §"Reduced motion is a first-class treatment" | *"Nothing depends on animation to become visible."* The stuck-`opacity: 0` card is named as the canonical defect |
| `rm-parity.mjs`, the enforcing instrument | Loads the page with and without `prefers-reduced-motion: reduce`, compares in-viewport text at effective opacity above 0.9, exit 1 on mismatch |
| `AESTHETIC.md` A6 | Reduced-motion and no-JS paths *"render final state instantly and completely"* |
| **`everyone-path`**, the arm-B skill | An `IntersectionObserver` base layer **so the reveal itself happens in every engine** |

The first four agree. In an engine without `animation-timeline` the `@supports`
block does not apply, the element stays at its legible base state, and the reveal
does not play: content visible, instrument satisfied, doctrine followed.

`everyone-path` alone asks for the reveal to *happen* everywhere. Grepped across
every `SKILL.md` in the `slipway` plugin, **nothing in the fleet states that
rule**. The three hits are GSAP's batch API described as *"a good alternative to
IntersectionObserver"*, an effect-glossary row, and an `immerse` implementation
note. None is a requirement. `census.mjs` counts `IntersectionObserver`
registrations as an expression-richness metric and flags a drop between builds,
which measures how much a page does rather than what it must fall back to.

### What that does to the census reading

Those eight trials read house doctrine, implemented it correctly, and were graded
against a rule the house does not hold and no instrument enforces. The census
record already states that the oracle "grades the stricter rule" (M2) and that
the headroom measured is headroom against `everyone-path`. This comparison
supplies the other half: the stricter rule is not merely different from
`slipway:motion`, it is **absent from the fleet entirely**.

The hypothesis is not supported by its own leading case. Recorded as falsified.

## What survives, and it is not nothing

1. **Probe validity.** Before reading a probe's failures as a capability gap,
   check whether the failing trials were following documented house doctrine the
   oracle does not encode. An unsealed fixture makes that possible; an oracle
   stricter than the house makes it likely. The defect is in the probe, not in
   the model and not in the doctrine.
2. **Skill scope on the Opus 5 claim.** The
   [contrast](2026-09-18-contrast-motion-undocumented-opus5.md) is sound evidence
   about the method — a real gap at 8/30, adoption at 30/30, a harm control at
   p = 1.0. It is **not** a validated improvement to the fleet, and `everyone-path`
   is not a library to install. That claim is tier-scoped already; it is
   skill-scoped too.

## Coverage, stated plainly

One instrument pair compared, of seven instruments and roughly sixty skills. The
motion case was chosen because it is the only one carrying measured trial
evidence, not because it is representative. `gangway` against `AESTHETIC.md` A3
and the experience floor, `beam` against M1's touch-target numbers, `articles`
against the legal surface, `dashcheck` against the `dashboard-uix` D-gates, and
ShipSafe against the security posture are **not compared here**, and no claim is
made about any of them.

## Re-verification

```
sed -n '36,58p'   /c/Users/nileh/github/slipway-marketplace/plugins/slipway/skills/motion/SKILL.md
sed -n '108,120p' /c/Users/nileh/github/slipway-marketplace/plugins/slipway/skills/motion/SKILL.md
sed -n '8,17p'    /c/Users/nileh/github/slipway-marketplace/plugins/slipway/skills/buildcore/scripts/rm-parity.mjs
grep -rn "IntersectionObserver" /c/Users/nileh/github/slipway-marketplace/plugins/slipway/skills --include=SKILL.md
```

The last command is the load-bearing one. Run it before citing this record.
