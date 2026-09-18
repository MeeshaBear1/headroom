// Site scripts.

// Reveal the range cards as they scroll into view. The stagger between them
// lives in CSS (--reveal-i); this just flips the class once per card.
(function revealCards() {
  var cards = document.querySelectorAll(".card");
  if (!cards.length) return;

  if (!document.documentElement.classList.contains("js-reveal")) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

  cards.forEach(function (card) { observer.observe(card); });
})();
