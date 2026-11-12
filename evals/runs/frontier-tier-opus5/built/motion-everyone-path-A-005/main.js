// Site scripts.

// Reveal the range cards as the visitor reaches them, one after another.
// Base layer per docs/CONVENTIONS.md: IntersectionObserver + CSS transition.
(function () {
  const cards = document.querySelectorAll('.card');
  const revealAll = () => cards.forEach((el) => el.classList.add('is-in'));

  // No observer, or motion turned down: final state, immediately.
  if (!('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealAll();
    return;
  }

  const STEP_MS = 90;
  const io = new IntersectionObserver((entries) => {
    // Cards that cross the line together stagger against each other, so a
    // side-by-side pair still arrives one after the other.
    entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      .forEach((e, i) => {
        e.target.style.transitionDelay = `${i * STEP_MS}ms`;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
  }, { threshold: 0.2 });

  cards.forEach((el) => io.observe(el));
})();
