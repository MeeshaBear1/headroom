// Base reveal layer: runs in every browser, needs no scroll-timeline support.
const cards = [...document.querySelectorAll('.card')];
cards.forEach((el, i) => el.style.setProperty('--i', String(i)));
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { threshold: 0.1 });
  cards.forEach((el) => io.observe(el));
} else {
  cards.forEach((el) => el.classList.add('is-in'));
}
