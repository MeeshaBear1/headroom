// Site scripts.

// Range cards: reveal each card as it scrolls into view, one after another.
// Cards that arrive together are staggered by their position on the page, so a
// row of two comes in left then right rather than as a pair.
(function () {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length) return;

  function reveal(card, step) {
    card.style.setProperty('--reveal-step', step);
    card.classList.add('is-in');
  }

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(cards, function (card) { reveal(card, 0); });
    return;
  }

  var observer = new IntersectionObserver(function (entries, obs) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      // Ties (same row) keep DOM order, which is left to right.
      .sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      })
      .forEach(function (entry, i) {
        reveal(entry.target, i);
        obs.unobserve(entry.target);
      });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  Array.prototype.forEach.call(cards, function (card) { observer.observe(card); });
})();
