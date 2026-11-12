// Site scripts.

// Range cards: rise into place as the row arrives, one a beat behind the last.
// The hidden state is applied here rather than in the stylesheet so that a
// visitor with no JS, an old browser, or reduced motion set gets the cards
// already in their final state instead of a section that never appears.
(function revealRange() {
  const grid = document.querySelector('.cards');
  if (!grid || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  grid.classList.add('reveal');

  const show = (card, index, self) => {
    card.style.setProperty('--stagger-index', index);
    card.classList.add('shown');
    self.unobserve(card);
  };

  const observer = new IntersectionObserver((entries, self) => {
    const live = entries.filter((entry) => entry.isIntersecting);

    // A card scrolled past before we ever saw it — restored scroll position, a
    // #range deep link, a fast flick — has missed its cue. Show it at once
    // rather than leaving it stranded at opacity 0.
    live
      .filter((entry) => entry.boundingClientRect.bottom <= 0)
      .forEach((entry) => show(entry.target, 0, self));

    // Cards that cross the line together form one cascade, in reading order.
    live
      .filter((entry) => entry.boundingClientRect.bottom > 0)
      .sort((a, b) =>
        a.boundingClientRect.top - b.boundingClientRect.top ||
        a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach((entry, i) => show(entry.target, i, self));
  }, {
    threshold: 0.2,
    // Extend the root far above the viewport so a card that is already overhead
    // still reports in and can be caught by the branch above.
    rootMargin: '9999px 0px 0px 0px',
  });

  grid.querySelectorAll('.card').forEach((card) => observer.observe(card));
})();
