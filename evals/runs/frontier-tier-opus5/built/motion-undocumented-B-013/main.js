// Site scripts.

// Reveal the Range cards as they scroll into view. If IntersectionObserver is
// missing, drop .reveal-ready so the cards fall back to plainly visible rather
// than staying stuck in their hidden pre-state.
(function revealCards() {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    document.documentElement.classList.remove('reveal-ready');
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
