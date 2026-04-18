// =============================================================================
// FILE: assets/js/components/tools.js
// DESC: Section Outils — filtres par catégorie, animation des cards
// =============================================================================

'use strict';

const Tools = (() => {

  // --- Données des outils ---
  // Chaque outil ajouté ici apparaîtra automatiquement dans la grille.
  const TOOLS_DATA = [
    {
      id:          'person-search',
      name:        'Recherche de Personnes & Profils',
      description: 'Username search sur 300+ plateformes (Sherlock-style), agrégation de moteurs person search, génération de patterns email et vérification multi-sources. Vérification API directe pour GitHub et Keybase. Export .txt / .json.',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:28px;height:28px;color:var(--color-accent-cyan)"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.35-4.35" stroke-linecap="round"/><circle cx="11" cy="8" r="2.5" fill="currentColor" opacity=".3"/><path d="M6 15.5c0-2.485 2.015-4.5 5-4.5s5 2.015 5 4.5" stroke-linecap="round"/></svg>`,
      category:    'identity',
      status:      'active',
      tags:        ['username', 'person search', 'email', 'profils', 'Sherlock'],
      url:         'tools/person-search.html',
      badge:       '300+ plateformes',
    },
    // Prochains outils à décommenter au fur et à mesure :
    // {
    //   id: 'reverse-image',
    //   name: 'Recherche inversée d\'image',
    //   description: 'Identifiez une personne ou un lieu depuis une photo.',
    //   icon: '🖼',
    //   category: 'media',
    //   status: 'soon',
    //   tags: ['image', 'photo', 'reverse', 'facial recognition'],
    //   url: 'tools/reverse-image.html',
    // },
    // {
    //   id: 'geo-osint',
    //   name: 'Géolocalisation OSINT',
    //   description: 'Analyse des métadonnées EXIF et géolocalisation d\'images.',
    //   icon: '🗺',
    //   category: 'geo',
    //   status: 'soon',
    //   tags: ['géo', 'EXIF', 'carte', 'localisation'],
    //   url: 'tools/geo-osint.html',
    // },
    // {
    //   id: 'domain-osint',
    //   name: 'Analyse de Domaine',
    //   description: 'WHOIS, DNS, sous-domaines, certificats SSL et technologies détectées.',
    //   icon: '🌐',
    //   category: 'network',
    //   status: 'soon',
    //   tags: ['WHOIS', 'DNS', 'domaine', 'réseau'],
    //   url: 'tools/domain-osint.html',
    // },
  ];

  // --- Catégories disponibles ---
  const CATEGORIES = [
    { id: 'all',      label: 'Tous' },
    { id: 'identity', label: 'Identité' },
    { id: 'network',  label: 'Réseau' },
    { id: 'media',    label: 'Médias' },
    { id: 'geo',      label: 'Géolocalisation' },
    { id: 'data',     label: 'Données' },
  ];

  let currentFilter = 'all';

  // --- Rendu de la grille ---
  function renderTools(filter = 'all') {
    const grid = document.querySelector('.tools-grid');
    const count = document.querySelector('.tools-count');
    if (!grid) return;

    const filtered = filter === 'all'
      ? TOOLS_DATA
      : TOOLS_DATA.filter(t => t.category === filter);

    // Mettre à jour le compteur
    if (count) {
      count.querySelector('span').textContent = filtered.length;
    }

    // Vider la grille
    grid.innerHTML = '';

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="tools-empty reveal">
          <p>// Aucun outil dans cette catégorie pour le moment.</p>
          <p>// Revenez bientôt — de nouveaux outils sont en développement.</p>
        </div>`;
      return;
    }

    filtered.forEach((tool, i) => {
      const card = createToolCard(tool);
      card.style.animationDelay = `${i * 60}ms`;
      grid.appendChild(card);
    });

    // Déclencher les animations reveal
    requestAnimationFrame(() => {
      grid.querySelectorAll('.reveal').forEach(el => {
        el.classList.add('is-visible');
      });
    });
  }

  // --- Créer un élément card ---
  function createToolCard(tool) {
    const isSoon = tool.status === 'soon';
    const el = document.createElement(isSoon ? 'div' : 'a');

    if (!isSoon) {
      el.href = tool.url;
    }

    el.className = `tool-card reveal${isSoon ? ' tool-card--soon' : ''}`;
    el.setAttribute('aria-label', `Outil : ${tool.name}`);

    const statusLabel = {
      active: 'Actif',
      beta:   'Bêta',
      soon:   'Bientôt',
    }[tool.status] || '';

    el.innerHTML = `
      <div class="tool-card-header">
        <div class="tool-icon" aria-hidden="true">${tool.icon}</div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:var(--space-2);">
          ${!isSoon ? `<span class="tool-status tool-status--${tool.status}">${statusLabel}</span>` : ''}
          ${tool.badge ? `<span class="tool-badge">${tool.badge}</span>` : ''}
        </div>
      </div>
      <div>
        <h3 class="tool-name">${tool.name}</h3>
        <p class="tool-description">${tool.description}</p>
      </div>
      <div class="tool-tags" aria-label="Catégories">
        ${tool.tags.map(t => `<span class="tool-tag">${t}</span>`).join('')}
      </div>
      ${!isSoon ? `
        <svg class="tool-arrow" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>` : ''}
    `;

    return el;
  }

  // --- Rendu des filtres ---
  function renderFilters() {
    const container = document.querySelector('.tools-filters');
    if (!container) return;

    container.innerHTML = '';

    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `filter-btn${cat.id === 'all' ? ' active' : ''}`;
      btn.textContent = cat.label;
      btn.setAttribute('data-filter', cat.id);
      btn.setAttribute('aria-pressed', cat.id === 'all' ? 'true' : 'false');
      btn.addEventListener('click', () => handleFilter(cat.id));
      container.appendChild(btn);
    });
  }

  // --- Gérer le filtre actif ---
  function handleFilter(filterId) {
    if (filterId === currentFilter) return;
    currentFilter = filterId;

    document.querySelectorAll('.filter-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-filter') === filterId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    renderTools(filterId);
  }

  // --- Afficher le nombre d'outils dans l'en-tête de section ---
  function updateCount() {
    // Compte uniquement les outils actifs / beta (pas 'soon')
    const activeCount = TOOLS_DATA.filter(t => t.status !== 'soon').length;
    const heroEl = document.querySelector('[data-count]');
    if (heroEl) heroEl.setAttribute('data-count', activeCount);
    const sectionEl = document.querySelector('.section-count span');
    if (sectionEl) sectionEl.textContent = TOOLS_DATA.length;
  }

  // --- Init ---
  function init() {
    renderFilters();
    renderTools();
    updateCount();
    injectBadgeStyles();
  }

  // --- Injecter les styles pour le badge outil ---
  function injectBadgeStyles() {
    if (document.getElementById('tools-badge-styles')) return;
    const style = document.createElement('style');
    style.id = 'tools-badge-styles';
    style.textContent = `
      .tool-badge {
        font-family: var(--font-mono);
        font-size: 0.6rem;
        color: var(--color-accent-amber);
        background: rgba(255, 179, 0, 0.08);
        border: 1px solid rgba(255, 179, 0, 0.2);
        border-radius: var(--radius-full);
        padding: 2px var(--space-2);
        letter-spacing: 0.08em;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);
  }

  // --- API publique pour ajouter un outil depuis d'autres modules ---
  function addTool(toolConfig) {
    TOOLS_DATA.push(toolConfig);
    renderTools(currentFilter);
    updateCount();
  }

  return { init, addTool };

})();

export default Tools;
