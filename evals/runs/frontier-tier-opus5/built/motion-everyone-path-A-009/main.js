// Site scripts.

// Range cards: reveal on scroll. This is the base layer — the CSS transition it
// drives is the whole reveal; the scroll-timeline block in style.css is garnish.
(function () {
  const cards = document.querySelectorAll('.card');
  if (!cards.length) return;

  // No IntersectionObserver (or no support at all): show everything, now.
  if (!('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    // Entries arrive in observer order, not document order. Sort so a batch
    // that lands together still cascades top to bottom.
    const arriving = entries
      .filter((entry) => entry.isIntersecting)
      .map((entry) => entry.target)
      .sort((a, b) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

    arriving.forEach((card, i) => {
      card.style.setProperty('--reveal-delay', `calc(${i} * var(--reveal-stagger))`);
      card.classList.add('is-in');
      io.unobserve(card);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach((card) => io.observe(card));
})();
