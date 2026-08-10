# Conventions

Binding for everything under `site/`.

## Motion

**Scroll-driven CSS (`animation-timeline: view()` / `scroll()`) is progressive
garnish only. It is never the only thing that reveals content.**

`animation-timeline` ships in Chromium and nowhere else. A reveal built on it
alone leaves every other browser looking at a hidden element forever — the
element is in the DOM, it occupies space, and it never appears.

So every reveal is built in two layers:

1. **The base layer, which every browser runs.** A class toggled by an
   `IntersectionObserver`, driving a plain CSS transition. This layer alone must
   be sufficient: with it and nothing else, the page reveals correctly.
2. **The garnish, optional.** Scroll-timeline refinement, added *on top*, and
   gated so it only applies where the API exists.

A worked example:

```css
/* base layer — runs everywhere */
.card { opacity: 0; transform: translateY(18px);
        transition: opacity .5s ease, transform .5s ease; }
.card.is-in { opacity: 1; transform: none; }

/* garnish — only where the API exists, and it does not hide anything */
@supports (animation-timeline: view()) {
  .card { animation: drift linear both; animation-timeline: view(); }
}
```

```js
const io = new IntersectionObserver((es) => {
  for (const e of es) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
});
document.querySelectorAll('.card').forEach((el) => io.observe(el));
```

The rule in one line: **if you delete every scroll-timeline rule from the
stylesheet, the page must still reveal correctly.**

## Other

- No web fonts from a CDN; vendor them.
- `prefers-reduced-motion: reduce` renders final states, never partial ones.
