---
name: everyone-path
description: The two-layer motion rule for this repo's static sites — scroll-driven CSS is garnish, never the only reveal path. Use when adding, reviewing, or debugging scroll reveals, entrance animations, or anything using animation-timeline, view() or scroll() in site/.
---

# The everyone path

`animation-timeline` ships in Chromium and nowhere else. A reveal built on it
alone leaves every other browser looking at content that is in the DOM, occupies
space, and never appears. `@supports`-gating it prevents *breakage*, not
*disappearance* — the hidden pre-state is the problem, not the animation.

Build every reveal in two layers.

**1 — the base layer, which every browser runs.** An `IntersectionObserver`
toggling a class, driving a plain CSS transition. This layer alone must be
sufficient.

```css
.card { opacity: 0; transform: translateY(18px);
        transition: opacity .5s ease, transform .5s ease; }
.card.is-in { opacity: 1; transform: none; }
```

**2 — the garnish, optional.** Scroll-timeline refinement on top, `@supports`
gated, hiding nothing.

## The test

Delete every scroll-timeline rule from the stylesheet. The page must still
reveal correctly. If it does not, the base layer is missing.

## Also

- No JS at all, and `prefers-reduced-motion: reduce`, both land on the final
  visible state — never a partial one.
- A keyframe with only a `from` block resolves its end state to the underlying
  value. Pair one with a base `opacity: 0` and the element animates to invisible.
