// Site scripts.

// Reveal .reveal elements as they scroll into view, staggered so a group that
// arrives together comes in one after another instead of all at once.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  function showAll() {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window)) {
    showAll();
    return;
  }

  var STAGGER = 110;
  var observer = new IntersectionObserver(function (entries) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return items.indexOf(a.target) - items.indexOf(b.target); })
      .forEach(function (entry, i) {
        entry.target.style.transitionDelay = (i * STAGGER) + 'ms';
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  items.forEach(function (el) { observer.observe(el); });
})();
