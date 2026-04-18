/* ============================================
   reveal.js — Module Animations Scroll
   ============================================ */

export function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const observeAll = () => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      observer.observe(el);
    });
  };

  observeAll();

  // Ré-observer après un rendu dynamique
  document.addEventListener('reveal:refresh', () => {
    requestAnimationFrame(observeAll);
  });
}
