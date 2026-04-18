/* ============================================
   main.js — Point d'entrée principal
   ============================================ */

import { initNav }    from './modules/nav.js';
import { initSearch } from './modules/search.js';
import { initTools }  from './modules/tools.js';
import { initReveal } from './modules/reveal.js';

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSearch();
  initTools();
  initReveal();

  // ── Terminal animation ──
  initTerminal();

  // ── Counter animation ──
  initCounters();
});

// ── Simulation terminal ──
function initTerminal() {
  const lines = [
    { type: 'cmd',    text: 'osint --target example.com --modules all' },
    { type: 'output', text: '[+] Démarrage de la reconnaissance...' },
    { type: 'output', text: '[+] Emails trouvés : 12' },
    { type: 'output', text: '[+] Sous-domaines : 47' },
    { type: 'output', text: '[+] Technologies détectées : React, Nginx' },
    { type: 'output', text: '[✓] Rapport généré : rapport_20240118.json' },
  ];

  const body = document.querySelector('.terminal__body');
  if (!body) return;

  body.innerHTML = '';
  let idx = 0;

  const typeNext = () => {
    if (idx >= lines.length) {
      const cursorLine = document.createElement('div');
      cursorLine.className = 'terminal__line';
      cursorLine.innerHTML = `
        <span class="terminal__prompt">❯</span>
        <span class="terminal__cursor"></span>
      `;
      body.appendChild(cursorLine);
      return;
    }

    const line = lines[idx];
    const el   = document.createElement('div');
    el.className = 'terminal__line';

    if (line.type === 'cmd') {
      el.innerHTML = `
        <span class="terminal__prompt">❯</span>
        <span class="terminal__cmd">${line.text}</span>
      `;
    } else {
      el.innerHTML = `<span class="terminal__output">${line.text}</span>`;
    }

    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    idx++;

    const delay = line.type === 'cmd' ? 600 : 350;
    setTimeout(typeNext, delay);
  };

  // Démarrer quand le terminal est visible
  const terminalEl = document.querySelector('.terminal');
  if (!terminalEl) return;

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(typeNext, 400);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(terminalEl);
  } else {
    setTimeout(typeNext, 1000);
  }
}

// ── Compteurs animés ──
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 1500;
    const start    = performance.now();

    const update = (now) => {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(eased * target) + (el.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => obs.observe(el));
  } else {
    counters.forEach(animateCounter);
  }
}
