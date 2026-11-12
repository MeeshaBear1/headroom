// Site scripts.

// Reveal the range cards as they scroll into view, staggered so they arrive one
// after another rather than as a block.
(function revealCards() {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length) return;

  // No observer support, or the visitor asked for reduced motion: leave the
  // cards in their final state and do nothing.
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('reveal-ready');

  var STAGGER = 110; // ms between cards that cross the line together

  var observer = new IntersectionObserver(function (entries) {
    // Entries arrive in no guaranteed order, so sort by document order to keep
    // the stagger running top to bottom.
    var arriving = entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return a.target.revealIndex - b.target.revealIndex; });

    arriving.forEach(function (entry, step) {
      entry.target.style.transitionDelay = step * STAGGER + 'ms';
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card, i) {
    card.revealIndex = i;
    observer.observe(card);
  });
})();
