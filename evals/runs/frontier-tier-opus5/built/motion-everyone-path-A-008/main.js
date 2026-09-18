// Site scripts.

// Range cards reveal as they scroll into view, one after another. This is the
// base layer from docs/CONVENTIONS.md: a class toggle driving a CSS transition,
// sufficient on its own. Cards that enter together are staggered by document
// order, so the run always reads top-to-bottom.
const cards = [...document.querySelectorAll('.card')];
const STAGGER = 90; // ms between cards revealed in the same batch

const reveal = (el, order = 0) => {
  el.style.transitionDelay = order * STAGGER + 'ms';
  el.classList.add('is-in');
};

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => cards.indexOf(a.target) - cards.indexOf(b.target))
      .forEach((e, i) => { reveal(e.target, i); io.unobserve(e.target); });
  }, { threshold: 0.25, rootMargin: '0px 0px -8%' });
  cards.forEach((el) => io.observe(el));
} else {
  cards.forEach((el) => reveal(el));
}
