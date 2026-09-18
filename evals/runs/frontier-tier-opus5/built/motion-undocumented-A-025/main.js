// Site scripts.

// Reveal the range cards as they scroll into view, staggered so they arrive one
// after another rather than as a block.
(function revealCards() {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.cards .card'));
  if (!cards.length) return;

  var reveal = function (card) { card.classList.add('is-revealed'); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // No observer, or motion is unwelcome: the cards are already in their final
  // state per the stylesheet, so there is nothing to animate.
  if (reduced || !('IntersectionObserver' in window)) {
    cards.forEach(reveal);
    return;
  }

  var STAGGER = 110; // ms between cards arriving together

  var observer = new IntersectionObserver(function (entries) {
    // Stagger within each batch, in document order, so a card that comes into
    // view on its own reveals immediately instead of inheriting a stale delay.
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return cards.indexOf(a.target) - cards.indexOf(b.target); })
      .forEach(function (entry, i) {
        entry.target.style.setProperty('--reveal-delay', i * STAGGER + 'ms');
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
