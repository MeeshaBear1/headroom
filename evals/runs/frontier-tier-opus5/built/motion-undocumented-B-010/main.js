// Site scripts.

// Reveal the range cards on scroll. The hidden pre-state lives behind .js
// (set inline in <head> before first paint), so no-JS visitors get the cards
// outright rather than a page of invisible content.
(function () {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  function revealAll() {
    for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-in');
  }

  // No observer, or motion turned down: land on the final state immediately.
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealAll();
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  for (var i = 0; i < cards.length; i++) observer.observe(cards[i]);
})();
