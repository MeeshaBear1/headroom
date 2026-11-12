// Site scripts.

// Reveal the range cards as they scroll into view, staggered so a group that
// arrives together lands one after another.
(function () {
  var cards = Array.prototype.slice.call(
    document.querySelectorAll('#range .card')
  );
  if (!cards.length) return;

  var reveal = function (card) { card.classList.add('is-in'); };

  if (!('IntersectionObserver' in window)) {
    cards.forEach(reveal);
    return;
  }

  var STEP = 90; // ms between cards in the same batch

  var observer = new IntersectionObserver(function (entries) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return cards.indexOf(a.target) - cards.indexOf(b.target); })
      .forEach(function (entry, i) {
        entry.target.style.transitionDelay = (i * STEP) + 'ms';
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  cards.forEach(function (card) { observer.observe(card); });
})();
