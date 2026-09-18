// Site scripts.

// Reveal the range cards as they scroll into view. Each card gets .is-in once,
// driving the transition in style.css; the stagger lives there as a delay.
(function () {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length) return;

  function reveal(card) { card.classList.add('is-in'); }

  if (!('IntersectionObserver' in window)) {
    cards.forEach(reveal);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
