// Site scripts.

// Range cards, revealed one after another on the way down. Base layer only —
// an IntersectionObserver toggling a class over a plain CSS transition — so
// every browser runs it and there is no scroll-timeline to fall back from.
const cards = [...document.querySelectorAll('#range .card')];

const reveal = (el, step) => {
  el.style.setProperty('--stagger-index', step);
  el.classList.add('is-in');
};

if (!('IntersectionObserver' in window)) {
  cards.forEach((el) => reveal(el, 0));
} else {
  const io = new IntersectionObserver((entries) => {
    // Stagger by position within the batch that arrives together, in document
    // order: two cards share a row on wide screens and a fast scroll can bring
    // in all four at once, so batch position is what keeps it sequential.
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => cards.indexOf(a.target) - cards.indexOf(b.target))
      .forEach((e, step) => { reveal(e.target, step); io.unobserve(e.target); });
  }, { rootMargin: '0px 0px -12% 0px' });

  cards.forEach((el) => io.observe(el));
}
