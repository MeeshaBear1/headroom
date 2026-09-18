// Site scripts.

// Scroll reveal for the range cards. Cards that enter the viewport in the
// same observer batch are staggered so they land one after another.
(() => {
  const cards = document.querySelectorAll('#range .card');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    cards.forEach((card) => card.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    let batchIndex = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.style.setProperty('--reveal-delay', `${batchIndex++ * 120}ms`);
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

  cards.forEach((card) => observer.observe(card));
})();
