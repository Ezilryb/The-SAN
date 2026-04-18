# Célérys OSINT

> Plateforme d'outils d'investigation open source (OSINT)

---

## Architecture des fichiers

```
celerys-osint/
│
├── index.html                          ← Page d'accueil principale
│
├── assets/
│   ├── css/
│   │   ├── main.css                    ← Point d'entrée CSS (importe tout)
│   │   ├── utils/
│   │   │   ├── variables.css           ← Design tokens (couleurs, fonts, espacements)
│   │   │   ├── reset.css               ← Reset CSS moderne + accessibilité
│   │   │   └── animations.css          ← Keyframes et classes d'animation
│   │   └── components/
│   │       ├── header.css              ← Header sticky + navigation mobile
│   │       ├── hero.css                ← Section héro + terminal visuel
│   │       ├── tools.css               ← Grille d'outils + cards + filtres
│   │       └── footer.css              ← Footer colonnes + bas de page
│   │
│   ├── js/
│   │   ├── main.js                     ← Point d'entrée JS (orchestre les modules)
│   │   └── components/
│   │       ├── header.js               ← Scroll, burger menu, lien actif
│   │       └── tools.js                ← Données outils, filtres, rendu grille
│   │
│   └── img/
│       └── favicon.svg                 ← Favicon SVG (icône réticule)
│
├── tools/                              ← (à créer) Pages des outils individuels
│   └── [nom-outil].html
│
└── README.md
```

---

## Ajouter un nouvel outil

Dans `assets/js/components/tools.js`, ajouter un objet au tableau `TOOLS_DATA` :

```js
{
  id:          'nom-unique',            // identifiant unique
  name:        'Nom de l\'outil',       // nom affiché
  description: 'Description courte.',   // 1-2 phrases
  icon:        '🔍',                    // emoji ou SVG inline
  category:    'identity',              // voir CATEGORIES dans tools.js
  status:      'active',               // 'active' | 'beta' | 'soon'
  tags:        ['tag1', 'tag2'],        // mots-clés affichés sur la card
  url:         'tools/nom-outil.html',  // page de l'outil
}
```

---

## Développement local (Live Server)

1. Ouvrir le dossier `celerys-osint/` dans **Cursor**
2. Clic droit sur `index.html` → **Open with Live Server**
3. Le site se recharge automatiquement à chaque sauvegarde

> ⚠️ Les modules ES (`type="module"`) nécessitent un serveur HTTP.
> Live Server le fournit automatiquement. Ne pas ouvrir `index.html` directement dans le navigateur.

---

## Déploiement GitHub Pages

1. Pousser le dossier sur un dépôt GitHub
2. Settings → Pages → Source : `main` branch, dossier `/ (root)`
3. Le site sera disponible à `https://[username].github.io/[repo]/`

---

## Checklist PageSpeed (score > 93)

- [x] Fonts chargées en `preload` avec `onload` non bloquant
- [x] JS chargé avec `type="module"` (différé par défaut)
- [x] Favicon en SVG (aucune requête PNG lourde)
- [x] CSS modulaire importé en cascade (un seul fichier en prod)
- [x] Animations respectant `prefers-reduced-motion`
- [x] Tous les éléments interactifs accessibles au clavier (`:focus-visible`)
- [x] ARIA labels sur tous les éléments importants
- [x] `skip-to-content` pour lecteurs d'écran
- [x] Balises meta SEO complètes + Open Graph + Twitter Card
- [x] `<link rel="canonical">` défini
- [x] Images en SVG (aucune image bitmap sur la page d'accueil)
- [x] `loading="lazy"` à ajouter sur les images futures
- [ ] Générer `og-image.png` (1200×630) pour les réseaux sociaux
- [ ] Minifier CSS/JS avant mise en production

---

## Palette de couleurs

| Variable                  | Valeur      | Usage                    |
|---------------------------|-------------|--------------------------|
| `--color-bg-primary`      | `#080B10`   | Fond principal           |
| `--color-bg-secondary`    | `#0D1117`   | Fond sections alternées  |
| `--color-accent-cyan`     | `#00E5FF`   | Couleur d'accentuation   |
| `--color-accent-amber`    | `#FFB300`   | Avertissements / bêta    |
| `--color-accent-green`    | `#00FF88`   | Statuts actifs / succès  |
| `--color-text-primary`    | `#E8EAF0`   | Texte principal          |
| `--color-text-secondary`  | `#8892A4`   | Texte secondaire         |

---

## Typographie

| Variable       | Valeur                              |
|----------------|-------------------------------------|
| `--font-mono`  | Space Mono (titres, code, labels)   |
| `--font-body`  | DM Sans (corps de texte)            |
