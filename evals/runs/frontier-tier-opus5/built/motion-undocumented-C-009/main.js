// Site scripts.

// Reveal the range cards as they scroll into view, staggered within each
// batch that arrives together. Reduced motion or no IntersectionObserver:
// final state immediately (docs/CONVENTIONS.md).
(function () {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    cards.forEach(function (card) { card.classList.add('is-revealed'); });
    return;
  }

  document.documentElement.classList.add('js-reveal');

  var STAGGER_MS = 130;
  var observer = new IntersectionObserver(function (entries) {
    var i = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var card = entry.target;
      card.style.transitionDelay = (i * STAGGER_MS) + 'ms';
      card.classList.add('is-revealed');
      card.addEventListener('transitionend', function () {
        card.style.transitionDelay = '';
      }, { once: true });
      observer.unobserve(card);
      i++;
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
