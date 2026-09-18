// Site scripts.

// Marks that scripting is available, which is what arms the hidden start state
// of the range cards in style.css. If this file never runs, they stay visible.
document.documentElement.classList.add('js');

const cards = document.querySelectorAll('.cards .card');

if (!('IntersectionObserver' in window)) {
  cards.forEach(card => card.classList.add('is-in'));
} else {
  const seen = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { threshold: .2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach(card => seen.observe(card));
}
