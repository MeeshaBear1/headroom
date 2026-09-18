// Site scripts.

// Range cards reveal as they come into view, one after another. This is the base
// layer from docs/CONVENTIONS.md and the only layer: an IntersectionObserver
// toggling .is-in against a plain CSS transition. Cards that arrive together get
// their stagger from --reveal-delay, assigned in document order.
const cards = document.querySelectorAll('.card');
const STAGGER = 110; // ms between neighbours in the same batch

if (!('IntersectionObserver' in window)) {
  cards.forEach((el) => el.classList.add('is-in'));
} else {
  const inDocumentOrder = (a, b) =>
    a.target.compareDocumentPosition(b.target) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

  const io = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).sort(inDocumentOrder).forEach((e, i) => {
      e.target.style.setProperty('--reveal-delay', `${i * STAGGER}ms`);
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  cards.forEach((el) => io.observe(el));
}
