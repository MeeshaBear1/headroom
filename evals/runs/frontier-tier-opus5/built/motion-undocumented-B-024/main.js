// Site scripts.

// Reveal the range cards as they scroll into view, staggered. Cards that cross
// the threshold together are offset from each other; a card arriving on its own
// reveals immediately.
(function () {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  var reveal = function (card, delay) {
    card.style.setProperty('--reveal-delay', delay + 'ms');
    card.classList.add('is-in');
  };

  if (!('IntersectionObserver' in window)) {
    cards.forEach(function (card) { reveal(card, 0); });
    return;
  }

  var STAGGER = 110;
  var observer = new IntersectionObserver(function (entries) {
    var arrived = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      reveal(entry.target, arrived++ * STAGGER);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
