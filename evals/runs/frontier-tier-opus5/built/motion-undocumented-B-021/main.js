// Site scripts.

// Reveal the range cards as they scroll into view, staggered in document order.
(function revealCards() {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.cards .card'));
  if (!cards.length) return;

  var show = function (card) { card.classList.add('is-in'); };

  // No observer support: leave the cards in their final, visible state.
  if (!('IntersectionObserver' in window)) {
    cards.forEach(show);
    return;
  }

  document.documentElement.classList.add('js');

  var STEP = 90; // ms between cards revealed in the same batch
  var observer = new IntersectionObserver(function (entries) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return cards.indexOf(a.target) - cards.indexOf(b.target); })
      .forEach(function (entry, i) {
        entry.target.style.setProperty('--reveal-delay', i * STEP + 'ms');
        show(entry.target);
        observer.unobserve(entry.target);
      });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  cards.forEach(function (card) { observer.observe(card); });
})();
