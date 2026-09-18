// Site scripts.

// Range cards reveal as they scroll into view, one after another.
// Base layer only (docs/CONVENTIONS.md): IntersectionObserver toggling .is-in,
// driving the plain CSS transition in style.css. No scroll-timeline rules
// exist, so there is nothing to delete and nothing that reveals only in
// Chromium. The stagger is applied per intersecting batch rather than baked
// into each card, so four cards entering together cascade while a single card
// scrolled to on its own appears without waiting its turn.
(() => {
  const cards = [...document.querySelectorAll('.cards .card')];
  if (!cards.length) return;

  const show = (el) => el.classList.add('is-in');

  if (!('IntersectionObserver' in window)) { cards.forEach(show); return; }

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const step = still ? 0 : readMs('--reveal-step', 90);
  const order = new Map(cards.map((el, i) => [el, i]));

  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => order.get(a.target) - order.get(b.target))
      .forEach(({ target }, i) => {
        if (step && i) {
          target.style.transitionDelay = `${i * step}ms`;
          // Don't leave the delay behind for whatever transitions next.
          target.addEventListener('transitionend', () => {
            target.style.transitionDelay = '';
          }, { once: true });
        }
        show(target);
        io.unobserve(target);
      });
  }, { threshold: .12, rootMargin: '0px 0px -10% 0px' });

  cards.forEach((el) => io.observe(el));

  function readMs(token, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return fallback;
    return raw.endsWith('ms') ? n : n * 1000;
  }
})();
