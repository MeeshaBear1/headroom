// Site scripts.

// Reveal the range cards as the visitor scrolls down to them. The stagger
// lives in the stylesheet (transition-delay per card); this only decides when
// a card has been reached.
(function revealCards() {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { io.observe(card); });
})();
