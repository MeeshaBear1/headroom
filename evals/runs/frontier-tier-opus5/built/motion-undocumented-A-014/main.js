// Site scripts.

// Range cards: each one rises as it reaches the viewport, and cards that arrive
// together are dealt out a beat apart rather than all at once. Styles live in
// style.css under [data-reveal]; this only arms them and marks the order.
(function revealRange() {
  var grid = document.querySelector('.cards');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!grid || !('IntersectionObserver' in window) || calm.matches) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
  if (!cards.length) return;

  grid.dataset.reveal = '';

  var watch = new IntersectionObserver(function (entries, self) {
    entries
      .filter(function (e) { return e.isIntersecting })
      // Reading order, not DOM order: top row first, then left to right.
      .sort(function (a, b) {
        var p = a.boundingClientRect, q = b.boundingClientRect;
        return p.top - q.top || p.left - q.left;
      })
      .forEach(function (e, i) {
        // Cap the beat so a longer range never crawls in.
        e.target.style.setProperty('--stagger-index', Math.min(i, 5));
        e.target.classList.add('is-read');
        self.unobserve(e.target);
      });
  }, { rootMargin: '0px 0px -12% 0px' });

  cards.forEach(function (card) { watch.observe(card) });
})();
