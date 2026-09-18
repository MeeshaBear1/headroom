// Site scripts.

// Range cards fade up as they scroll into view, staggered so they arrive one
// after another rather than as a block.
(function revealCards() {
  var cards = document.querySelector('.cards');
  if (!cards || !('IntersectionObserver' in window)) return;

  var items = Array.prototype.slice.call(cards.querySelectorAll('.card'));
  if (!items.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var STEP = 90; // ms between neighbours in the same batch

  function finalise() {
    // Reduced motion gets the finished layout, never a half-played one.
    cards.classList.remove('reveal-ready');
    items.forEach(function (card) {
      card.classList.remove('is-revealed');
      card.style.transitionDelay = '';
    });
  }

  if (reduced.matches) return;
  cards.classList.add('reveal-ready');

  var observer = new IntersectionObserver(function (entries) {
    // Cards crossing in together are delayed by their order in the batch, so a
    // whole row still reads as a sequence.
    var arriving = entries.filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return items.indexOf(a.target) - items.indexOf(b.target); });

    arriving.forEach(function (entry, i) {
      entry.target.style.transitionDelay = (i * STEP) + 'ms';
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8%' });

  items.forEach(function (card) { observer.observe(card); });

  var onPreferenceChange = function () {
    if (!reduced.matches) return;
    observer.disconnect();
    finalise();
  };
  if (reduced.addEventListener) reduced.addEventListener('change', onPreferenceChange);
  else if (reduced.addListener) reduced.addListener(onPreferenceChange);
})();
