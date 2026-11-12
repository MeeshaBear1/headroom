// Site scripts.

// Range cards: reveal on scroll, one after another.
// This is the base layer — an IntersectionObserver toggling .is-in against the
// CSS transitions in style.css. It runs everywhere, and the .js-reveal class is
// only set once we know we can reveal again, so no-JS leaves the cards visible.
(function revealCards() {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('js-reveal');

  var observer = new IntersectionObserver(function (entries, obs) {
    var step = 0;
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      // Stagger within whatever arrives together, so a card scrolled to on its
      // own never sits waiting out a delay it did not earn.
      entry.target.style.transitionDelay = step * 110 + 'ms';
      entry.target.classList.add('is-in');
      obs.unobserve(entry.target);
      step++;
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
