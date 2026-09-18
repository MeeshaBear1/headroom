// Site scripts.
document.documentElement.classList.add('js');

const cards = document.querySelectorAll('#range .card');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    // Stagger only the cards entering together in this batch, so a card
    // scrolled to on its own reveals with no added wait.
    let order = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.style.transitionDelay = `${order++ * 110}ms`;
      entry.target.classList.add('is-revealed');
      io.unobserve(entry.target);
    }
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
  cards.forEach((card) => io.observe(card));
} else {
  cards.forEach((card) => card.classList.add('is-revealed'));
}
