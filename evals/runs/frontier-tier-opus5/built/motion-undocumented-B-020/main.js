// Site scripts.

// Reveal the range cards as they scroll into view, staggered so that cards
// arriving in the same batch land one after another rather than together.
(function () {
  var cards = document.querySelectorAll('.card');
  if (!cards.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP = reduced ? 0 : 110; // ms between neighbouring cards

  function show(card, delay) {
    card.style.transitionDelay = delay + 'ms';
    card.classList.add('is-in');
  }

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(cards, function (card) { show(card, 0); });
    return;
  }

  var observer = new IntersectionObserver(function (entries, obs) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      })
      .forEach(function (entry, i) {
        show(entry.target, i * STEP);
        obs.unobserve(entry.target);
      });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  Array.prototype.forEach.call(cards, function (card) { observer.observe(card); });
})();
