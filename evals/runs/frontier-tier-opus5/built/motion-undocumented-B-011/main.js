// Site scripts.

// Range cards: fade up as they scroll into view, staggered so they arrive one
// after another. This observer is the only reveal path — no scroll-timeline
// garnish on top — so every browser gets the same behaviour.
(function revealCards() {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length) return;

  if (!('IntersectionObserver' in window)) {
    for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-in');
    return;
  }

  var stagger = 90; // ms between cards arriving in the same batch

  var io = new IntersectionObserver(function (entries, obs) {
    entries
      .filter(function (e) { return e.isIntersecting })
      .forEach(function (e, i) {
        e.target.style.transitionDelay = i * stagger + 'ms';
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
  }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { io.observe(card) });
})();
