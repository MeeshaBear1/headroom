// Site scripts.

// Range cards reveal as they scroll into view. This is the base layer that
// every browser runs; the scroll-timeline rules in style.css only refine it.
(function revealCards() {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  var show = function (card) { card.classList.add('is-in') };

  if (!('IntersectionObserver' in window)) {
    cards.forEach(show);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      show(entry.target);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  cards.forEach(function (card) { observer.observe(card) });
})();
