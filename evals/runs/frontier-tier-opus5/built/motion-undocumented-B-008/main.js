// Site scripts.

// Scroll reveals. The CSS only hides a .reveal element under html.js, so this
// file is the one thing that owes it a way back to visible: if anything below
// is unavailable, reveal everything immediately.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  function show(el, index) {
    el.style.setProperty('--reveal-index', index);
    el.classList.add('is-in');
  }

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { show(el, 0); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    // Stagger within each batch, in document order, so cards that come into
    // view together arrive one after another rather than all at once.
    var arriving = entries.filter(function (e) { return e.isIntersecting; });
    arriving.sort(function (a, b) { return items.indexOf(a.target) - items.indexOf(b.target); });
    arriving.forEach(function (entry, i) {
      show(entry.target, i);
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  items.forEach(function (el) { observer.observe(el); });
})();
