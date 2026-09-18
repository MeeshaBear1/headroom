// Site scripts.

// Reveal the range cards as they scroll into view, staggered one after another.
// This is the base layer: it runs everywhere, with or without support for
// scroll-driven CSS animations.
(function () {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  var show = function (card, i) {
    card.style.setProperty('--reveal-i', i);
    card.classList.add('is-in');
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    cards.forEach(function (card) { show(card, 0); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    // Stagger within each batch, so cards arriving together come in one after
    // another and a card reached later never waits on the ones before it.
    var arriving = entries.filter(function (e) { return e.isIntersecting; });
    arriving.forEach(function (entry, i) {
      show(entry.target, i);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
