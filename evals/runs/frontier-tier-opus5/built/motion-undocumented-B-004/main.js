// Site scripts.

// Reveal the range cards as they scroll into view, staggered in document order.
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.cards .card'));
  if (!cards.length) return;

  var show = function (card) { card.classList.add('is-in') };

  if (!('IntersectionObserver' in window)) {
    cards.forEach(show);
    return;
  }

  var observer = new IntersectionObserver(function (entries, obs) {
    var arriving = new Set();
    entries.forEach(function (entry) {
      if (entry.isIntersecting) arriving.add(entry.target);
    });
    if (!arriving.size) return;

    // Walk the full list so a batch of cards entering together still fires in
    // document order, one after another, rather than all at once.
    var step = 0;
    cards.forEach(function (card) {
      if (!arriving.has(card)) return;
      card.style.setProperty('--reveal-delay', step++ * 90 + 'ms');
      show(card);
      obs.unobserve(card);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { observer.observe(card) });
})();
