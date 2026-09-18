// Site scripts.

// Reveal the range cards as they scroll into view. Any browser without
// IntersectionObserver gets the final state immediately.
(function () {
  var cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  function revealAll() {
    for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-in');
  }

  if (!('IntersectionObserver' in window)) { revealAll(); return; }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

  for (var i = 0; i < cards.length; i++) observer.observe(cards[i]);
})();
