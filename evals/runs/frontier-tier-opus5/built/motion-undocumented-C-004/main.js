// Site scripts.

document.documentElement.classList.add('js');

const cards = document.querySelectorAll('.card');

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.filter(e => e.isIntersecting).forEach((e, i) => {
      const card = e.target;
      card.style.transitionDelay = `${i * 120}ms`;
      card.classList.add('is-revealed');
      card.addEventListener('transitionend', () => {
        card.style.transitionDelay = '';
      }, { once: true });
      obs.unobserve(card);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  cards.forEach(card => io.observe(card));
} else {
  cards.forEach(card => card.classList.add('is-revealed'));
}
