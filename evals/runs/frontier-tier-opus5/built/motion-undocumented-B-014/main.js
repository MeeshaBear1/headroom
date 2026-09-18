// Site scripts.

// Stagger the range cards in as they scroll into view. The hidden start state
// lives behind .reveal-ready, so anything that skips this path (no JS, no
// IntersectionObserver, reduced motion) just gets the cards as they are.
(function revealCards() {
  var cards = document.querySelectorAll('#range .card');
  if (!cards.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.documentElement.classList.add('reveal-ready');

  var STEP = 120; // ms between cards in the same batch

  var observer = new IntersectionObserver(function (entries) {
    var arriving = entries.filter(function (e) { return e.isIntersecting });
    // Document order, so a batch always cascades top-to-bottom.
    arriving.sort(function (a, b) {
      return a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    arriving.forEach(function (entry, i) {
      entry.target.style.setProperty('--reveal-delay', (i * STEP) + 'ms');
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(function (card) { observer.observe(card) });
})();
