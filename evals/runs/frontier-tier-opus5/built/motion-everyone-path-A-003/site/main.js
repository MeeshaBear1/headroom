// Site scripts.

// Range cards reveal as they scroll into view, one after another.
const cards = document.querySelectorAll('.card');
const showAll = () => cards.forEach((el) => el.classList.add('is-in'));

if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
  showAll();
} else {
  const io = new IntersectionObserver((entries) => {
    // Stagger by position within this batch, not by position in the section:
    // a card that scrolls in on its own leads, rather than waiting out the
    // delay of siblings that appeared long ago.
    entries.filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((e, i) => {
        e.target.style.setProperty('--stagger-index', i);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  cards.forEach((el) => io.observe(el));
}
