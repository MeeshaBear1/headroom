// Site scripts.

// Range cards: reveal each one as it scrolls into view. This is the base layer of
// docs/CONVENTIONS.md § Motion — the stylesheet's scroll-timeline rules only refine
// what happens here, they never carry the reveal on their own.
(function revealRange() {
  var cards = document.querySelectorAll('.card');
  if (!cards.length) return;

  function reveal(el) { el.classList.add('is-in'); }

  // No observer (or no support): show everything now rather than hide it forever.
  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(cards, reveal);
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      reveal(entries[i].target);
      io.unobserve(entries[i].target); // reveal once; never un-reveal on scroll up
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  Array.prototype.forEach.call(cards, function (el) { io.observe(el); });
})();
