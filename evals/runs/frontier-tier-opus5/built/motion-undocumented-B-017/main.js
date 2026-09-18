// Site scripts.

// Reveal the Range cards as they scroll into view, staggered in DOM order so
// they arrive one after another rather than as a block.
(function revealCards() {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    cards.forEach(function (card) { card.classList.add('is-in'); });
    return;
  }

  var STEP = 110; // ms between neighbours in the same batch

  var observer = new IntersectionObserver(function (entries, obs) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) {
        var order = a.target.compareDocumentPosition(b.target);
        return order & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      })
      .forEach(function (entry, i) {
        entry.target.style.transitionDelay = i * STEP + 'ms';
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
