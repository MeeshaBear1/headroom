// Site scripts.

// Opt in to the card reveal only once JS is running. Without this class the
// stylesheet leaves the cards in their final, visible state.
document.documentElement.classList.add('js');

(function revealCards() {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  var show = function (card) { card.classList.add('is-in'); };

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(cards, show);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      show(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  Array.prototype.forEach.call(cards, function (card) { observer.observe(card); });
})();
