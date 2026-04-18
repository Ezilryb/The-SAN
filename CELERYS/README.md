# 🔍 OSINT Hub — Plateforme Modulaire

Plateforme d'outils OSINT moderne, modulaire et optimisée pour les performances.

## 📁 Structure du projet

```
osint-hub/
├── index.html                  # Page principale
├── pages/
│   ├── guide.html              # Guide débutant
│   ├── apropos.html            # À propos
│   ├── mentions-legales.html   # Mentions légales
│   └── confidentialite.html    # Politique de confidentialité
├── css/
│   ├── variables.css           # ⚙️ Design tokens (couleurs, fonts, spacing…)
│   ├── reset.css               # 🧹 Reset CSS moderne
│   ├── main.css                # 🏗️ Layout, nav, hero, footer
│   └── components.css          # 🧩 Composants réutilisables
├── js/
│   ├── main.js                 # 🚀 Point d'entrée (import de tous les modules)
│   └── modules/
│       ├── nav.js              # Navigation + menu mobile
│       ├── search.js           # Barre de recherche + suggestions
│       ├── tools.js            # Données et grille des outils
│       └── reveal.js           # Animations scroll (IntersectionObserver)
└── assets/
    └── icons/                  # Icônes SVG custom si nécessaire
```

## 🛠️ Développement local (Live Server)

1. Ouvrir le dossier dans **Cursor**
2. Installer l'extension **Live Server** (si pas déjà fait)
3. Clic droit sur `index.html` → **Open with Live Server**
4. Le site s'ouvre sur `http://127.0.0.1:5500`

> ⚠️ Les modules ES (`type="module"`) nécessitent un serveur HTTP.
> Ne pas ouvrir `index.html` directement dans le navigateur (protocole `file://`).

## 🚀 Déploiement sur GitHub Pages

```bash
# 1. Initialiser le repo
git init
git add .
git commit -m "feat: initial commit — OSINT Hub v1.0"

# 2. Créer le repo sur GitHub, puis :
git remote add origin https://github.com/VOTRE-PSEUDO/osint-hub.git
git branch -M main
git push -u origin main

# 3. Activer GitHub Pages
# GitHub → Settings → Pages → Source : Deploy from branch → main → / (root)
```

## ➕ Ajouter un outil

Ouvrir `js/modules/tools.js` et ajouter un objet dans le tableau `TOOLS_DATA` :

```js
{
  id: 'mon-outil',          // identifiant unique
  name: 'Mon Outil',        // nom affiché
  category: 'Email',        // catégorie (doit exister dans CATEGORIES)
  desc: 'Description…',    // description courte
  tags: ['tag1', 'tag2'],   // mots-clés
  badge: 'free',            // 'free' | 'paid'
  icon: 'terminal',         // 'network' | 'graph' | 'mail' | 'terminal' | 'map' | 'archive' | 'list'
  url: 'https://…',         // lien vers l'outil
  isNew: true,              // optionnel — affiche le badge "Nouveau"
}
```

## 🎨 Modifier les couleurs

Tout se passe dans `css/variables.css` :

```css
--clr-primary: #00F5B4;   /* Couleur principale (vert cyan) */
--clr-accent:  #F5A623;   /* Couleur d'accent (orange) */
--clr-bg:      #07090D;   /* Fond principal */
```

## 📊 Score PageSpeed cible

| Métrique        | Cible  |
|-----------------|--------|
| Performance     | ≥ 93   |
| Accessibilité   | ≥ 95   |
| Bonnes pratiques| ≥ 95   |
| SEO             | ≥ 95   |

**Optimisations incluses :**
- Chargement des polices non-bloquant (`media="print"` trick)
- `preconnect` pour les domaines tiers
- Pas de JavaScript bloquant (`type="module"` = `defer` automatique)
- Images avec `alt` text
- Structure sémantique HTML5
- ARIA labels complets
- `prefers-reduced-motion` respecté
- Contraste couleurs WCAG AA
- Skip link accessible

## 📄 Licence

Usage personnel et éducatif. Utiliser ces outils dans un cadre légal et éthique uniquement.
