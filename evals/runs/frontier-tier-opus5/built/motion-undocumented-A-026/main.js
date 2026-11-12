// Site scripts.

// Reveal the range cards as they scroll into view, staggered by the
// transition-delay rules in style.css.
(function revealCards() {
  var cards = document.querySelector('.cards');
  if (!cards || !('IntersectionObserver' in window)) return;

  cards.setAttribute('data-reveal', '');

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.25, rootMargin: '0px 0px -8%' });

  cards.querySelectorAll('.card').forEach(function (card) {
    observer.observe(card);
  });
})();
