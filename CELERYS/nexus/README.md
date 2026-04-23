# NEXUS — Intelligence Platform
> Palantir Clone MVP · Architecture Modulaire · GitHub Pages

```
╔══════════════════════════════════════════════════════╗
║  Stack     : HTML5 · Tailwind CSS CDN · Alpine.js    ║
║              Chart.js · Vis.js Network · Leaflet.js  ║
║  Test local: Cursor + Live Server → localhost:5500   ║
║  Deploy    : GitHub Pages (branch main / /)          ║
╚══════════════════════════════════════════════════════╝
```

---

## Architecture des fichiers

```
/ (racine du dépôt GitHub)
│
├── index.html                    ← Shell de l'app (structure permanente)
├── .nojekyll                     ← Désactive Jekyll sur GitHub Pages
├── README.md
│
├── assets/
│   └── css/
│       └── main.css              ← Styles custom (glow, animations, badges, Leaflet/Vis dark)
│
├── views/                        ← Vues HTML (injectées dynamiquement par loader.js)
│   ├── dashboard.html            ← Vue 1 : Tableau de commandement
│   ├── explorer.html             ← Vue 2 : Object Explorer
│   ├── nexus.html                ← Vue 3 : Graph Link Analysis (Vis.js)
│   └── map.html                  ← Vue 4 : Analyse Géospatiale (Leaflet)
│
└── js/
    ├── loader.js                 ← Point d'entrée ES Module : fetch views → injecte → boot Alpine
    ├── app.js                    ← Composant Alpine.js principal (window.palantirApp)
    │
    ├── data/
    │   └── mock.js               ← Base de données simulée (entités, liens, alertes, séries)
    │
    ├── modules/
    │   ├── charts.js             ← Chart.js : ingestion 24h, donut entités, menaces 7j
    │   ├── nexus.js              ← Vis.js Network : nœuds, arêtes, physique, événements
    │   └── map.js                ← Leaflet.js : carte dark, marqueurs par type, popups
    │
    └── utils/
        └── helpers.js            ← riskColor(), riskLabel(), formatDate(), truncate()
```

---

## Séquence de chargement

```
1. index.html parsé
   ├── Tailwind CDN config (inline script)
   ├── Tailwind CDN script
   ├── Leaflet CSS
   ├── Google Fonts
   └── assets/css/main.css

2. Scripts CDN (bas de body, scripts réguliers)
   ├── chart.js  → global Chart
   ├── vis-network → global vis
   └── leaflet.js  → global L

3. js/loader.js (ES Module, exécution différée)
   ├── import app.js          → window.palantirApp
   ├── fetch(views/*.html)    → injection dans #main-views
   └── inject Alpine CDN      → Alpine.start() automatique

4. Alpine.js s'initialise sur #app[x-data="palantirApp()"]
   ├── init() → initCharts(MOCK)
   └── $watch currentView → initNexus() / initMap() à la demande
```

---

## Comment modifier les données

Éditer uniquement **`js/data/mock.js`**.

```js
// Ajouter une entité
MOCK.entities.push({
  id: 'P005', type: 'PERSON', name: 'Nouveau Suspect',
  subtitle: 'Trader · Genève', risk: 65, status: 'SURVEILLÉ',
  lat: 46.2044, lng: 6.1432,
  props: { Nationalité: 'FR', Âge: '47 ans', Source: 'FININT' },
});

// Ajouter un lien
MOCK.links.push({ from: 'P005', to: 'O001', type: 'LIÉ À', strength: .6 });
```

---

## Ajouter une vue

1. Créer `views/ma-vue.html` (avec `x-show="currentView === 'ma-vue'"`)
2. Ajouter l'entrée dans `js/loader.js` → tableau `VIEWS`
3. Ajouter l'entrée dans `js/app.js` → tableau `navItems`

---

## Déploiement GitHub Pages

```bash
git init
git add .
git commit -m "feat: NEXUS Intelligence Platform — architecture modulaire"
git remote add origin https://github.com/VOTRE_USERNAME/nexus-platform.git
git push -u origin main
```

Puis : **Settings → Pages → Source → Deploy from branch → main / (root)**

URL finale : `https://VOTRE_USERNAME.github.io/nexus-platform/`

---

## Test local (Cursor + Live Server)

> ⚠️ Les ES Modules et `fetch()` ne fonctionnent **pas** avec `file://`.
> Live Server est obligatoire (il sert sur `http://localhost:5500`).

1. Ouvrir le dossier dans **Cursor**
2. Installer l'extension **Live Server** (Ritwick Dey)
3. Clic droit sur `index.html` → **Open with Live Server**
4. Naviguer vers `http://localhost:5500`

---

## Cibles PageSpeed Insights

| Métrique         | Cible | Optimisations appliquées                                |
|------------------|-------|---------------------------------------------------------|
| Performance      | > 93  | Preconnect DNS, polices `display=swap`, CDN scripts bas de page |
| Accessibilité    | > 93  | ARIA labels/roles, `aria-live`, contraste WCAG AA       |
| Bonnes pratiques | > 93  | HTTPS CDN, `meta viewport`, `charset UTF-8`, no console errors |
| SEO              | > 93  | `<meta description>`, `canonical`, `robots`, OG tags    |
