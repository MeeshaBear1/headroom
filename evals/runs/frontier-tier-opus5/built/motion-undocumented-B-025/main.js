// Site scripts.

// Reveal the Range cards as they scroll into view, one after another. The
// hidden pre-state (.reveal-ready on <html>) is only applied when we can
// actually reveal it again, so no-JS and reduced-motion both get the cards
// plain and visible.
(function revealCards() {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('reveal-ready');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
