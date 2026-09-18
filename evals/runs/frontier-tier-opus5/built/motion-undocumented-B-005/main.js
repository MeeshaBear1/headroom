// Site scripts.

// Reveal the range cards as they scroll into view. The stagger lives in the
// stylesheet (transition-delay per card); this just decides when to start.
(function revealCards() {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  var show = function (card) { card.classList.add('is-in'); };

  // No IntersectionObserver: show everything rather than leave it hidden.
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(cards, show);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      show(entry.target);
      observer.unobserve(entry.target); // reveal once, don't re-hide on scroll up
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  Array.prototype.forEach.call(cards, function (card) { observer.observe(card); });
})();
