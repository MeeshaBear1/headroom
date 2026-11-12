// Site scripts.

// Range cards reveal on scroll. Browsers with scroll-driven animations do it in
// CSS; this is the path for the ones that don't — Firefox, mainly.
(() => {
  if (CSS.supports('animation-timeline: view()')) return;
  if (!window.IntersectionObserver) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-revealed');
      obs.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -12% 0px' });

  for (const card of document.querySelectorAll('#range .card')) {
    // Anything already on screen stays as it is — nothing hides then reappears.
    if (card.getBoundingClientRect().top < innerHeight) continue;
    card.classList.add('is-pending');
    observer.observe(card);
  }
})();
