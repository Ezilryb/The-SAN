/* ============================================
   tools.js — Module Outils OSINT (Custom)
   ============================================ */

export const TOOLS_DATA = [

  // ═══════════════════════════════════
  // EMAIL & DOMAINES
  // ═══════════════════════════════════
  {
    id: 'email-analyzer',
    name: 'Analyseur d\'en-têtes Email',
    category: 'Email',
    desc: 'Analysez les en-têtes bruts d\'un email pour tracer son origine, détecter le spoofing et identifier chaque relais SMTP.',
    tags: ['email', 'headers', 'smtp', 'spoofing', 'trace'],
    badge: 'free',
    icon: 'mail',
    url: 'tools/email-analyzer.html',
    isOwn: true,
  },
  {
    id: 'domain-intel',
    name: 'Domain Intelligence',
    category: 'Email',
    desc: 'Collecte complète sur un domaine : WHOIS, enregistrements DNS, serveurs MX, SPF, DKIM et DMARC.',
    tags: ['domaine', 'dns', 'mx', 'spf', 'dkim'],
    badge: 'free',
    icon: 'network',
    url: 'tools/domain-intel.html',
    isOwn: true,
  },
  {
    id: 'email-extractor',
    name: 'Extracteur d\'Emails',
    category: 'Email',
    desc: 'Extrayez toutes les adresses email depuis n\'importe quel texte brut, code source HTML ou JSON collé.',
    tags: ['email', 'extraction', 'regex', 'parsing'],
    badge: 'free',
    icon: 'mail',
    url: 'tools/email-extractor.html',
    isOwn: true,
  },
  {
    id: 'email-permutator',
    name: 'Permutateur d\'Emails',
    category: 'Email',
    desc: 'Génère toutes les combinaisons possibles d\'email à partir d\'un prénom, nom et domaine d\'entreprise.',
    tags: ['email', 'permutation', 'brute', 'corporate'],
    badge: 'free',
    icon: 'mail',
    url: 'tools/email-permutator.html',
    isOwn: true,
  },
  {
    id: 'mx-checker',
    name: 'Vérificateur MX / SPF / DKIM',
    category: 'Email',
    desc: 'Vérifiez la configuration email d\'un domaine : serveurs MX, politique SPF, sélecteurs DKIM et DMARC.',
    tags: ['mx', 'spf', 'dkim', 'dmarc', 'dns'],
    badge: 'free',
    icon: 'terminal',
    url: 'tools/mx-checker.html',
    isOwn: true,
    isNew: true,
  },
  {
    id: 'breach-checker',
    name: 'Vérificateur de Breach',
    category: 'Email',
    desc: 'Vérifiez si une adresse email a été compromise dans des fuites de données publiques connues.',
    tags: ['breach', 'leak', 'haveibeenpwned', 'sécurité'],
    badge: 'free',
    icon: 'archive',
    url: 'tools/breach-checker.html',
    isOwn: true,
  },

  // ═══════════════════════════════════
  // RÉSEAU & IP
  // ═══════════════════════════════════
  {
    id: 'ip-lookup',
    name: 'IP Lookup & Géolocalisation',
    category: 'Réseau',
    desc: 'Géolocalisez n\'importe quelle adresse IP, obtenez l\'ASN, l\'opérateur, le fuseau horaire et les informations RDAP.',
    tags: ['ip', 'géolocalisation', 'asn', 'isp', 'whois'],
    badge: 'free',
    icon: 'network',
    url: 'tools/ip-lookup.html',
    isOwn: true,
  },
  {
    id: 'port-scanner',
    name: 'Port Scanner Visuel',
    category: 'Réseau',
    desc: 'Simulez un scan de ports communs sur une IP ou un domaine et visualisez les services exposés.',
    tags: ['ports', 'scan', 'services', 'nmap', 'réseau'],
    badge: 'free',
    icon: 'terminal',
    url: 'tools/port-scanner.html',
    isOwn: true,
  },
  {
    id: 'asn-lookup',
    name: 'ASN / BGP Lookup',
    category: 'Réseau',
    desc: 'Recherchez les informations d\'un Autonomous System Number : opérateur, plages IP, pays, pairs BGP.',
    tags: ['asn', 'bgp', 'routing', 'opérateur', 'peering'],
    badge: 'free',
    icon: 'graph',
    url: 'tools/asn-lookup.html',
    isOwn: true,
  },
  {
    id: 'reverse-dns',
    name: 'Reverse DNS Lookup',
    category: 'Réseau',
    desc: 'Résolution inverse DNS : obtenez le hostname associé à une IP et les enregistrements PTR.',
    tags: ['dns', 'reverse', 'ptr', 'hostname'],
    badge: 'free',
    icon: 'network',
    url: 'tools/reverse-dns.html',
    isOwn: true,
  },
  {
    id: 'cidr-calculator',
    name: 'Calculateur CIDR / Subnet',
    category: 'Réseau',
    desc: 'Calculez les plages d\'adresses IP d\'un bloc CIDR : broadcast, masque réseau, nombre d\'hôtes disponibles.',
    tags: ['cidr', 'subnet', 'ipv4', 'ipv6', 'calcul'],
    badge: 'free',
    icon: 'terminal',
    url: 'tools/cidr-calculator.html',
    isOwn: true,
    isNew: true,
  },
  {
    id: 'ssl-analyzer',
    name: 'Analyseur SSL / TLS',
    category: 'Réseau',
    desc: 'Inspectez le certificat SSL/TLS d\'un domaine : émetteur, validité, chaîne, algorithmes et vulnérabilités.',
    tags: ['ssl', 'tls', 'certificat', 'https', 'sécurité'],
    badge: 'free',
    icon: 'archive',
    url: 'tools/ssl-analyzer.html',
    isOwn: true,
  },

  // ═══════════════════════════════════
  // GÉOLOCALISATION & MÉTADONNÉES
  // ═══════════════════════════════════
  {
    id: 'image-metadata',
    name: 'Extracteur EXIF / Métadonnées',
    category: 'Géolocalisation',
    desc: 'Extrayez toutes les métadonnées EXIF d\'une image : GPS, appareil photo, date de prise, logiciel utilisé.',
    tags: ['exif', 'métadonnées', 'gps', 'image', 'photo'],
    badge: 'free',
    icon: 'map',
    url: 'tools/image-metadata.html',
    isOwn: true,
  },
  {
    id: 'gps-converter',
    name: 'Convertisseur Coordonnées GPS',
    category: 'Géolocalisation',
    desc: 'Convertissez des coordonnées GPS entre DMS, DD et DDM. Visualisez la position sur une carte.',
    tags: ['gps', 'coordonnées', 'dms', 'dd', 'cartographie'],
    badge: 'free',
    icon: 'map',
    url: 'tools/gps-converter.html',
    isOwn: true,
  },
  {
    id: 'ip-geolocation-map',
    name: 'Carte Géolocalisation IP',
    category: 'Géolocalisation',
    desc: 'Visualisez sur une carte interactive la position géographique d\'une ou plusieurs adresses IP.',
    tags: ['ip', 'carte', 'géolocalisation', 'visualisation'],
    badge: 'free',
    icon: 'map',
    url: 'tools/ip-map.html',
    isOwn: true,
  },
  {
    id: 'exif-stripper',
    name: 'Suppresseur EXIF (OPSEC)',
    category: 'Géolocalisation',
    desc: 'Supprimez toutes les métadonnées EXIF d\'une image pour protéger votre vie privée avant publication.',
    tags: ['exif', 'opsec', 'anonymat', 'nettoyage'],
    badge: 'free',
    icon: 'archive',
    url: 'tools/exif-stripper.html',
    isOwn: true,
    isNew: true,
  },

  // ═══════════════════════════════════
  // RÉSEAUX SOCIAUX
  // ═══════════════════════════════════
  {
    id: 'username-checker',
    name: 'Username Checker',
    category: 'Réseaux Sociaux',
    desc: 'Vérifiez la disponibilité d\'un username sur 50+ plateformes : GitHub, Reddit, Twitter, Instagram et plus.',
    tags: ['username', 'profil', 'sherlock', 'social', 'osint'],
    badge: 'free',
    icon: 'list',
    url: 'tools/username-checker.html',
    isOwn: true,
  },
  {
    id: 'social-profile-analyzer',
    name: 'Analyseur de Profil (IA)',
    category: 'Réseaux Sociaux',
    desc: 'Analysez un profil public avec l\'IA : détectez les patterns comportementaux, les centres d\'intérêt et les anomalies.',
    tags: ['ia', 'profil', 'analyse', 'comportement', 'claude'],
    badge: 'free',
    icon: 'graph',
    url: 'tools/social-analyzer.html',
    isOwn: true,
    isNew: true,
  },
  {
    id: 'linkedin-dorker',
    name: 'LinkedIn OSINT Queries',
    category: 'Réseaux Sociaux',
    desc: 'Générez des requêtes Google optimisées pour trouver des profils LinkedIn sans être connecté.',
    tags: ['linkedin', 'dorks', 'profil', 'employés', 'corporate'],
    badge: 'free',
    icon: 'terminal',
    url: 'tools/linkedin-dorker.html',
    isOwn: true,
  },
  {
    id: 'social-timeline',
    name: 'Reconstructeur de Timeline',
    category: 'Réseaux Sociaux',
    desc: 'Reconstituez la timeline d\'une personne à partir de données publiques collectées et organisez les événements.',
    tags: ['timeline', 'chronologie', 'profil', 'investigation'],
    badge: 'free',
    icon: 'list',
    url: 'tools/social-timeline.html',
    isOwn: true,
  },

  // ═══════════════════════════════════
  // ARCHIVES & WHOIS
  // ═══════════════════════════════════
  {
    id: 'whois-lookup',
    name: 'WHOIS Lookup Avancé',
    category: 'Archives',
    desc: 'Interrogez les bases WHOIS mondiales pour un domaine ou une IP, avec parsing structuré et historique.',
    tags: ['whois', 'domaine', 'registrar', 'propriétaire'],
    badge: 'free',
    icon: 'archive',
    url: 'tools/whois-lookup.html',
    isOwn: true,
  },
  {
    id: 'dns-history',
    name: 'Historique DNS',
    category: 'Archives',
    desc: 'Consultez l\'historique des enregistrements DNS d\'un domaine pour détecter des changements d\'hébergement.',
    tags: ['dns', 'historique', 'archive', 'changement'],
    badge: 'free',
    icon: 'archive',
    url: 'tools/dns-history.html',
    isOwn: true,
  },
  {
    id: 'wayback-searcher',
    name: 'Wayback Machine Searcher',
    category: 'Archives',
    desc: 'Recherchez et explorez les snapshots archivés d\'un site web sur la Wayback Machine avec filtres avancés.',
    tags: ['wayback', 'archive', 'snapshots', 'internet archive'],
    badge: 'free',
    icon: 'archive',
    url: 'tools/wayback-searcher.html',
    isOwn: true,
  },
  {
    id: 'cert-transparency',
    name: 'Certificate Transparency',
    category: 'Archives',
    desc: 'Recherchez tous les certificats SSL émis pour un domaine via les logs de Certificate Transparency (crt.sh).',
    tags: ['ssl', 'certificat', 'sous-domaines', 'ct-logs'],
    badge: 'free',
    icon: 'network',
    url: 'tools/cert-transparency.html',
    isOwn: true,
    isNew: true,
  },
  {
    id: 'rdap-lookup',
    name: 'RDAP Lookup',
    category: 'Archives',
    desc: 'Interrogez le protocole RDAP (successeur moderne du WHOIS) pour obtenir des données structurées en JSON.',
    tags: ['rdap', 'whois', 'json', 'iana', 'registre'],
    badge: 'free',
    icon: 'terminal',
    url: 'tools/rdap-lookup.html',
    isOwn: true,
  },

  // ═══════════════════════════════════
  // DORKS & RECHERCHES
  // ═══════════════════════════════════
  {
    id: 'google-dorker',
    name: 'Générateur Google Dorks',
    category: 'Dorks',
    desc: 'Construisez des requêtes Google Dorks avancées avec opérateurs site:, filetype:, inurl:, intitle: et bien plus.',
    tags: ['google', 'dorks', 'hacking', 'recherche', 'operateurs'],
    badge: 'free',
    icon: 'terminal',
    url: 'tools/google-dorker.html',
    isOwn: true,
  },
  {
    id: 'shodan-dorker',
    name: 'Générateur Shodan Dorks',
    category: 'Dorks',
    desc: 'Créez des requêtes Shodan optimisées pour cibler des équipements, services et bannières spécifiques.',
    tags: ['shodan', 'dorks', 'iot', 'services', 'réseau'],
    badge: 'free',
    icon: 'terminal',
    url: 'tools/shodan-dorker.html',
    isOwn: true,
  },
  {
    id: 'github-dorker',
    name: 'Générateur GitHub Dorks',
    category: 'Dorks',
    desc: 'Générez des requêtes GitHub pour trouver des secrets, clés API, mots de passe et fichiers sensibles exposés.',
    tags: ['github', 'dorks', 'secrets', 'api-keys', 'code'],
    badge: 'free',
    icon: 'terminal',
    url: 'tools/github-dorker.html',
    isOwn: true,
    isNew: true,
  },
  {
    id: 'ai-dorker',
    name: 'Dork Generator IA',
    category: 'Dorks',
    desc: 'Décrivez votre cible en langage naturel et l\'IA génère automatiquement des dorks optimisés pour Google, Shodan et GitHub.',
    tags: ['ia', 'dorks', 'automatique', 'claude', 'nlp'],
    badge: 'free',
    icon: 'graph',
    url: 'tools/ai-dorker.html',
    isOwn: true,
    isNew: true,
  },
  {
    id: 'dork-library',
    name: 'Librairie de Dorks',
    category: 'Dorks',
    desc: 'Base de données de 500+ dorks organisés par catégorie : admin panels, caméras, documents sensibles, IoT.',
    tags: ['librairie', 'dorks', 'catalogue', 'collection'],
    badge: 'free',
    icon: 'list',
    url: 'tools/dork-library.html',
    isOwn: true,
  },
];

export const CATEGORIES = [
  'Tous',
  'Email',
  'Réseau',
  'Géolocalisation',
  'Réseaux Sociaux',
  'Archives',
  'Dorks',
];

// ── Icônes SVG par type ──
const ICONS = {
  network: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918"/></svg>`,
  graph: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>`,
  terminal: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z"/></svg>`,
  archive: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/></svg>`,
  map: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>`,
  list: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>`,
};

// ── Rendu d'une carte outil ──
const renderToolCard = (tool) => {
  const badge = tool.isNew
    ? `<span class="tool-card__badge badge--new">Nouveau</span>`
    : `<span class="tool-card__badge badge--free">Gratuit</span>`;

  const icon = ICONS[tool.icon] || ICONS.terminal;

  // Tous les outils internes : pas de target="_blank"
  const linkTarget = tool.isOwn
    ? `href="${tool.url}"`
    : `href="${tool.url}" target="_blank" rel="noopener noreferrer"`;

  return `
    <article class="tool-card reveal" role="listitem" data-id="${tool.id}">
      <div class="tool-card__header">
        <div class="tool-card__icon" aria-hidden="true">${icon}</div>
        ${badge}
      </div>
      <h3 class="tool-card__name">${tool.name}</h3>
      <p class="tool-card__desc">${tool.desc}</p>
      <div class="tool-card__tags" aria-label="Tags : ${tool.tags.join(', ')}">
        ${tool.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <a ${linkTarget}
         class="btn btn--outline" style="margin-top:var(--sp-4);font-size:var(--fs-xs)"
         aria-label="Ouvrir ${tool.name}">
        Lancer l'outil →
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
    document.dispatchEvent(new CustomEvent('reveal:refresh'));
  };

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','true');
      currentCategory = btn.dataset.category;
      render();
    });
  });

  document.addEventListener('search:query', (e) => {
    currentQuery = e.detail.query.toLowerCase();
    currentCategory = 'Tous';
    filters.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
    document.querySelector('[data-category="Tous"]')?.classList.add('active');
    render();
  });

  document.addEventListener('filter:tool', (e) => {
    currentQuery = '';
    const tool = TOOLS_DATA.find(t => t.id === e.detail.toolId);
    if (tool) {
      currentCategory = tool.category;
      filters.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed','false'); });
      document.querySelector(`[data-category="${tool.category}"]`)?.classList.add('active');
    }
    render();
  });

  render();
}
