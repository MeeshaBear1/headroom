// Site scripts.

// Range cards: reveal each card as it scrolls into view. This is the base
// layer every browser runs — the hidden pre-state in style.css is gated on
// the .js class set here, so a page with no (or broken) JS stays visible.
document.documentElement.classList.add('js');

const cards = document.querySelectorAll('#range .card');

if (!('IntersectionObserver' in window)) {
  cards.forEach((card) => card.classList.add('is-in'));
} else {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });

  cards.forEach((card) => observer.observe(card));
}
