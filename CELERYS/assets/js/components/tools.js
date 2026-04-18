// =============================================================================
// FILE: assets/js/components/tools.js
// DESC: Section Outils — filtres par catégorie, animation des cards
// =============================================================================

'use strict';

const Tools = (() => {

  // --- Données des outils (sera peuplé au fur et à mesure du développement) ---
  // Chaque outil ajouté ici apparaîtra automatiquement dans la grille.
  const TOOLS_DATA = [
    // Exemple (décommenter quand un outil est prêt) :
    // {
    //   id: 'username-search',
    //   name: 'Username Search',
    //   description: 'Recherchez un pseudonyme sur des centaines de plateformes simultanément.',
    //   icon: '🔍',
    //   category: 'identity',
    //   status: 'active',        // 'active' | 'beta' | 'soon'
    //   tags: ['identité', 'réseaux sociaux', 'pseudonyme'],
    //   url: 'tools/username-search.html',
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
        ${!isSoon ? `<span class="tool-status tool-status--${tool.status}">${statusLabel}</span>` : ''}
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
    const el = document.querySelector('.section-count span');
    if (el) el.textContent = TOOLS_DATA.length;
  }

  // --- Init ---
  function init() {
    renderFilters();
    renderTools();
    updateCount();
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
