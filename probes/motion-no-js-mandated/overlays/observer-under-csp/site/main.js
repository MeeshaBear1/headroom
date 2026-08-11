const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
document.querySelectorAll(".card").forEach((el) => io.observe(el));
