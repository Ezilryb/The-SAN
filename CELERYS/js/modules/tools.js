/* ============================================
   tools.js — Module Outils OSINT
   ============================================ */

export const TOOLS_DATA = [
  {
    id: 'shodan',
    name: 'Shodan',
    category: 'Réseau',
    desc: 'Moteur de recherche pour les appareils connectés à Internet. Scanne les ports, services et bannières.',
    tags: ['scan', 'réseau', 'IoT', 'ports'],
    badge: 'paid',
    icon: 'network',
    url: 'https://shodan.io',
  },
  {
    id: 'maltego',
    name: 'Maltego',
    category: 'Graphe',
    desc: 'Outil de visualisation et de collecte de renseignements via des graphes de relations.',
    tags: ['graphe', 'relations', 'investigation'],
    badge: 'paid',
    icon: 'graph',
    url: 'https://maltego.com',
  },
  {
    id: 'theHarvester',
    name: 'theHarvester',
    category: 'Email',
    desc: 'Collecte d\'e-mails, noms de domaine, IPs et URLs depuis des sources publiques.',
    tags: ['email', 'dns', 'sous-domaine'],
    badge: 'free',
    icon: 'mail',
    url: 'https://github.com/laramies/theHarvester',
  },
  {
    id: 'spiderfoot',
    name: 'SpiderFoot',
    category: 'Automatisation',
    desc: 'Outil d\'automatisation OSINT avec plus de 200 modules d\'investigation.',
    tags: ['automatisation', 'footprint', 'OPSEC'],
    badge: 'free',
    icon: 'spider',
    url: 'https://spiderfoot.net',
  },
  {
    id: 'recon-ng',
    name: 'Recon-ng',
    category: 'Framework',
    desc: 'Framework de reconnaissance modulaire inspiré de Metasploit.',
    tags: ['framework', 'reconnaissance', 'modules'],
    badge: 'free',
    icon: 'terminal',
    url: 'https://github.com/lanmaster53/recon-ng',
  },
  {
    id: 'intelx',
    name: 'Intelligence X',
    category: 'Archives',
    desc: 'Moteur de recherche et archive web pour les données historiques et les leaks.',
    tags: ['archive', 'leak', 'dark web', 'paste'],
    badge: 'paid',
    icon: 'archive',
    url: 'https://intelx.io',
  },
  {
    id: 'creepy',
    name: 'Creepy',
    category: 'Géolocalisation',
    desc: 'Collecte les métadonnées de géolocalisation depuis les réseaux sociaux.',
    tags: ['géo', 'réseaux sociaux', 'photo'],
    badge: 'free',
    icon: 'map',
    url: '#',
  },
  {
    id: 'osintframework',
    name: 'OSINT Framework',
    category: 'Ressources',
    desc: 'Collection organisée de ressources et d\'outils OSINT par catégorie.',
    tags: ['ressources', 'index', 'collection'],
    badge: 'free',
    icon: 'list',
    url: 'https://osintframework.com',
    isNew: true,
  },
  {
    id: 'hunter',
    name: 'Hunter.io',
    category: 'Email',
    desc: 'Trouve et vérifie les adresses e-mail professionnelles liées à un domaine.',
    tags: ['email', 'domaine', 'vérification'],
    badge: 'paid',
    icon: 'mail',
    url: 'https://hunter.io',
  },
];

export const CATEGORIES = [
  'Tous',
  'Réseau',
  'Email',
  'Géolocalisation',
  'Graphe',
  'Framework',
  'Automatisation',
  'Archives',
  'Ressources',
];

// ── Icônes SVG par type ──
const ICONS = {
  network: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918"/></svg>`,
  graph: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>`,
  spider: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.354a15.055 15.055 0 0 1-4.5 0M3 16.5v-4.5m0 4.5h18m-18 0 1.5-4.5m16.5 4.5-1.5-4.5M4.5 7.5a7.5 7.5 0 0 1 15 0"/></svg>`,
  terminal: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>`,
  archive: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/></svg>`,
  map: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>`,
  list: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>`,
};

// ── Rendu d'une carte outil ──
const renderToolCard = (tool) => {
  const badge = tool.isNew
    ? `<span class="tool-card__badge badge--new">Nouveau</span>`
    : tool.badge === 'paid'
      ? `<span class="tool-card__badge badge--paid">Payant</span>`
      : `<span class="tool-card__badge badge--free">Gratuit</span>`;

  const icon = ICONS[tool.icon] || ICONS.terminal;
  const iconClass = tool.badge === 'paid' ? 'tool-card__icon--accent' : '';
  const delay = '';

  return `
    <article class="tool-card reveal" role="listitem">
      <div class="tool-card__header">
        <div class="tool-card__icon ${iconClass}" aria-hidden="true">${icon}</div>
        ${badge}
      </div>
      <h3 class="tool-card__name">${tool.name}</h3>
      <p class="tool-card__desc">${tool.desc}</p>
      <div class="tool-card__tags" aria-label="Tags : ${tool.tags.join(', ')}">
        ${tool.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <a href="${tool.url}" target="_blank" rel="noopener noreferrer"
         class="btn btn--outline" style="margin-top:var(--sp-4);font-size:var(--fs-xs)"
         aria-label="Ouvrir ${tool.name} dans un nouvel onglet">
        Accéder →
      </a>
    </article>
  `;
};

// ── Initialisation de la grille ──
export function initTools() {
  const grid    = document.querySelector('.tools-grid');
  const filters = document.querySelectorAll('.filter-btn');

  if (!grid) return;

  let currentCategory = 'Tous';
  let currentQuery    = '';

  const render = () => {
    const filtered = TOOLS_DATA.filter(tool => {
      const matchCat   = currentCategory === 'Tous' || tool.category === currentCategory;
      const matchQuery = !currentQuery ||
        tool.name.toLowerCase().includes(currentQuery) ||
        tool.desc.toLowerCase().includes(currentQuery) ||
        tool.tags.some(t => t.toLowerCase().includes(currentQuery));
      return matchCat && matchQuery;
    });

    if (!filtered.length) {
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:var(--sp-16);color:var(--clr-text-muted)">
          <p style="font-family:var(--font-mono)">// Aucun résultat pour "${currentQuery}"</p>
        </div>`;
      return;
    }

    grid.setAttribute('role', 'list');
    grid.innerHTML = filtered.map(renderToolCard).join('');

    // Réactiver les animations scroll
    document.dispatchEvent(new CustomEvent('reveal:refresh'));
  };

  // ── Filtres par catégorie ──
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.category;
      render();
    });
  });

  // ── Écoute de la recherche ──
  document.addEventListener('search:query', (e) => {
    currentQuery = e.detail.query.toLowerCase();
    currentCategory = 'Tous';
    filters.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-category="Tous"]')?.classList.add('active');
    render();
  });

  document.addEventListener('filter:tool', (e) => {
    currentQuery = '';
    const tool = TOOLS_DATA.find(t => t.id === e.detail.toolId);
    if (tool) {
      currentCategory = tool.category;
      filters.forEach(b => b.classList.remove('active'));
      document.querySelector(`[data-category="${tool.category}"]`)?.classList.add('active');
    }
    render();
  });

  render(); // rendu initial
}
