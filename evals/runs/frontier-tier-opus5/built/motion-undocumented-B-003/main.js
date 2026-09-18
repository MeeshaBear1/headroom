// Site scripts.

// Reveal the range cards as they scroll into view, staggered in document order
// so a group entering together arrives one after another rather than at once.
(function revealCards() {
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  if (!cards.length) return;

  var show = function (card, delay) {
    card.style.transitionDelay = delay + "ms";
    card.classList.add("is-in");
  };

  if (!("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    cards.forEach(function (card) { show(card, 0); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries
      .filter(function (entry) { return entry.isIntersecting; })
      .sort(function (a, b) { return cards.indexOf(a.target) - cards.indexOf(b.target); })
      .forEach(function (entry, i) {
        show(entry.target, i * 110);
        observer.unobserve(entry.target);
      });
  }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

  cards.forEach(function (card) { observer.observe(card); });
})();
