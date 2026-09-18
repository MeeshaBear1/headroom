// Site scripts.

// Range cards: reveal each card as it scrolls into view. This is the base
// layer every browser runs — the scroll-timeline rules in style.css are a
// refinement on top of it, not a replacement for it.
(function () {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  function reveal(card) { card.classList.add('is-in'); }

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(cards, reveal);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      reveal(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  Array.prototype.forEach.call(cards, function (card) { observer.observe(card); });
})();
