// Site scripts.

// Reveal the range cards as they scroll into view, staggered left to right.
// Cards start visible; the hiding class is only added once JS is running,
// so the section still reads without scripts or IntersectionObserver.
(function () {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  cards.forEach(function (card, i) {
    card.classList.add('card--pending');
    card.style.transitionDelay = (i * 90) + 'ms';
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('card--revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
