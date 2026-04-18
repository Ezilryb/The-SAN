// =============================================================================
// FILE: assets/js/main.js
// DESC: Point d'entrée JS — importe et initialise tous les modules
// =============================================================================

'use strict';

import Header from './components/header.js';
import Tools  from './components/tools.js';

// =============================================================================
// Intersection Observer — animations "reveal" au scroll
// =============================================================================
function initRevealAnimations() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Animer une seule fois
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px',
  });

  revealEls.forEach(el => observer.observe(el));
}

// =============================================================================
// Terminal animé (hero)
// =============================================================================
function initTerminalAnimation() {
  const lines = document.querySelectorAll('.terminal-line[data-delay]');
  lines.forEach(line => {
    const delay = parseInt(line.getAttribute('data-delay'), 10) || 0;
    line.style.opacity = '0';
    setTimeout(() => {
      line.style.transition = 'opacity 300ms ease';
      line.style.opacity = '1';
    }, delay);
  });
}

// =============================================================================
// Compteur animé (stats hero)
// =============================================================================
function initStatCounters() {
  const stats = document.querySelectorAll('[data-count]');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-count'), 10);
      const duration = 1200;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + (el.getAttribute('data-suffix') || '');
        if (progress < 1) requestAnimationFrame(update);
      }

      requestAnimationFrame(update);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  stats.forEach(el => observer.observe(el));
}

// =============================================================================
// Démarrage de l'application
// =============================================================================
function init() {
  // Modules principaux
  Header.init();
  Tools.init();

  // Utilitaires
  initRevealAnimations();
  initTerminalAnimation();
  initStatCounters();
}

// DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
