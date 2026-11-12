// Site scripts.

// Range cards: the reveal is CSS scroll-driven animation (style.css) wherever
// `animation-timeline` exists. This is the fallback for engines that lack it —
// Firefox today — and it does nothing anywhere else, so there is only ever one
// animation driving a card.
const rangeCards = document.querySelector('.cards');

if (
  rangeCards &&
  matchMedia('(prefers-reduced-motion: no-preference)').matches &&
  !CSS.supports('animation-timeline', 'view()') &&
  'IntersectionObserver' in window
) {
  rangeCards.classList.add('is-armed');
  new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-tripped');
      observer.disconnect();
    }
  }, { rootMargin: '0px 0px -15% 0px' }).observe(rangeCards);
}
