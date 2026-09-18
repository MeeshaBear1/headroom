// Site scripts.

// Reveal the range cards as they scroll into view, staggered by the
// per-card transition-delay in style.css.
(function revealCards() {
  const cards = document.querySelectorAll('.cards .card');
  if (!cards.length) return;

  const show = (el) => el.classList.add('is-in');

  if (!('IntersectionObserver' in window)) {
    cards.forEach(show);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      show(e.target);
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });

  cards.forEach((el) => io.observe(el));
})();
