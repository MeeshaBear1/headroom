// Site scripts.

// Reveal the range cards as they scroll into view, staggered so that cards
// arriving together come in one after another rather than as a block.
(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('#range .card'));
  if (!cards.length) return;

  function show(card) { card.classList.add('is-in'); }

  if (!('IntersectionObserver' in window)) {
    cards.forEach(show);
    return;
  }

  var observer = new IntersectionObserver(function (entries, obs) {
    var arriving = entries.filter(function (entry) { return entry.isIntersecting; });
    // Entry order isn't guaranteed, so cascade in document order.
    arriving.sort(function (a, b) { return cards.indexOf(a.target) - cards.indexOf(b.target); });
    arriving.forEach(function (entry, i) {
      entry.target.style.setProperty('--reveal-delay', i * 110 + 'ms');
      show(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  cards.forEach(function (card) { observer.observe(card); });
})();
