// Site scripts.

// Reveal the range cards as they scroll into view. Cards are only hidden once
// the .js class lands, so the page stays readable without JavaScript.
document.documentElement.classList.add('js');

const cards = document.querySelectorAll('#range .card');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if ('IntersectionObserver' in window && !reduceMotion.matches) {
  const observer = new IntersectionObserver((entries) => {
    // Stagger cards that enter the viewport in the same batch so the grid
    // reveals one after another instead of all at once.
    const entering = entries.filter((e) => e.isIntersecting);
    entering.forEach((entry, i) => {
      observer.unobserve(entry.target);
      setTimeout(() => entry.target.classList.add('is-visible'), i * 140);
    });
  }, { threshold: 0.2 });
  cards.forEach((card) => observer.observe(card));
} else {
  cards.forEach((card) => card.classList.add('is-visible'));
}
