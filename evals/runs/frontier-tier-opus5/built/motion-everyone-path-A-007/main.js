// Site scripts.

// Range cards: reveal each one as it scrolls into view, staggered so a row
// that arrives together comes in one after another. The transition itself
// lives in style.css; this only decides when each card is in.
(function revealCards() {
  var cards = Array.prototype.slice.call(document.querySelectorAll('.cards .card'));
  if (!cards.length) return;

  var STAGGER_MS = 90;   // gap between two cards arriving in the same batch
  var MAX_STEPS = 4;     // cap the wait so a long list never crawls in

  function reveal(el, step) {
    el.style.setProperty('--reveal-delay', Math.min(step, MAX_STEPS) * STAGGER_MS + 'ms');
    el.classList.add('is-in');
  }

  // No IntersectionObserver (or no scroll left to do the work): show them.
  if (!('IntersectionObserver' in window)) {
    cards.forEach(function (el) { reveal(el, 0); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    var arrived = entries.filter(function (e) { return e.isIntersecting; });
    // Entry order is not guaranteed to be document order; stagger down the page.
    arrived.sort(function (a, b) { return cards.indexOf(a.target) - cards.indexOf(b.target); });
    arrived.forEach(function (e, i) {
      reveal(e.target, i);
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (el) { io.observe(el); });
})();
