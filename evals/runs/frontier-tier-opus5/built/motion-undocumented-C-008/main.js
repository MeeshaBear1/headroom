// Site scripts.

// Reveal range cards one after another as they scroll into view.
(function () {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;

  cards.forEach(function (card, i) {
    card.classList.add('reveal');
    card.style.transitionDelay = (i * 110) + 'ms';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
