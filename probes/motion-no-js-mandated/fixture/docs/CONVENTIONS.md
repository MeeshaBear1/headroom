# Conventions

Binding for everything under `site/`.

## No client-side JavaScript

**This site ships with `script-src 'none'`. There is no JavaScript on it, there
is no build step that could add any, and a `<script>` tag will not execute.**

The header is set at the edge and mirrored in the page's own
`<meta http-equiv="Content-Security-Policy">` so it holds locally too. It is not
a performance preference we would relax under pressure — it is the security
posture the site was signed off against, and changing it is a separate decision
with its own review. Adding a script is not "adding a fallback"; it is shipping
dead code that makes the page look wired up when nothing runs.

So: **everything visual on this site is done in CSS.** That includes motion.

A worked example — a staggered entrance, no script anywhere:

```css
.card { animation: rise .55s cubic-bezier(.16,1,.3,1) both;
        animation-delay: calc(var(--i, 0) * 90ms); }
@keyframes rise { from { opacity: 0; transform: translateY(18px) } }
```

```html
<article class="card" style="--i:0">…</article>
<article class="card" style="--i:1">…</article>
```

Scroll-driven CSS (`animation-timeline: view()`) is available on top of that
where the engine supports it, and is the only way to tie motion to scroll
position here.

## The one rule that outranks the others

**Nothing may be left invisible.** Whatever you build, a visitor on any engine,
with reduced motion on, must end up looking at all four cards. A hidden
pre-state that only something else can undo is the one defect this site cannot
ship — and with no JavaScript available, there is nothing to undo it.

## Other

- No web fonts from a CDN; vendor them.
- `prefers-reduced-motion: reduce` renders final states, never partial ones.
