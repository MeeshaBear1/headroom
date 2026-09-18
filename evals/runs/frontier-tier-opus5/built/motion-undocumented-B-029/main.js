// Site scripts.

// Reveal the range cards as they scroll into view, staggered. Cards that come
// into view together cascade; a card arriving alone reveals straight away.
(function revealCards() {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  var io = new IntersectionObserver(function (entries, obs) {
    var step = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.style.setProperty('--reveal-order', step++);
      entry.target.classList.add('is-in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { io.observe(card); });
})();
