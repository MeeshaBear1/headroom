// Site scripts.

// Reveal the range cards as they scroll into view, staggered when several
// arrive together. The hidden state is CSS-gated on this class, so cards
// stay visible without JS.
document.documentElement.classList.add('js');

const cards = document.querySelectorAll('#range .card');

if ('IntersectionObserver' in window && cards.length) {
  const observer = new IntersectionObserver((entries) => {
    // Stagger only within the batch entering together, so a card scrolled
    // to on its own reveals immediately.
    let step = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.style.setProperty('--reveal-delay', `${step * 110}ms`);
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
      step += 1;
    }
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  cards.forEach((card) => observer.observe(card));
} else {
  cards.forEach((card) => card.classList.add('is-revealed'));
}
