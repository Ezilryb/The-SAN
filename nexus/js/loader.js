/**
 * js/loader.js
 * ─────────────────────────────────────────────────────────────────
 * Point d'entrée ES Module.
 * 1. Importe app.js  → enregistre window.palantirApp
 * 2. Fetche les vues HTML depuis /views/
 * 3. Les injecte dans #main-views
 * 4. Charge Alpine.js APRÈS l'injection (pour un init correct)
 * ─────────────────────────────────────────────────────────────────
 */

import './app.js'; // Enregistre window.palantirApp en side-effect

/* ── Déclaration des vues (ordre d'insertion) ─────────────────── */
const VIEWS = [
  { id: 'view-dashboard', src: './views/dashboard.html' },
  { id: 'view-explorer',  src: './views/explorer.html'  },
  { id: 'view-nexus',     src: './views/nexus.html'     },
  { id: 'view-map',       src: './views/map.html'       },
];

/* ── Fetch parallèle + injection DOM ─────────────────────────── */
async function loadViews() {
  const main = document.getElementById('main-views');
  if (!main) throw new Error('[loader] #main-views introuvable.');

  const htmlResults = await Promise.all(
    VIEWS.map(v =>
      fetch(v.src)
        .then(r => {
          if (!r.ok) throw new Error(`[loader] Impossible de charger ${v.src} (${r.status})`);
          return r.text();
        })
    )
  );

  htmlResults.forEach((html, i) => {
    const wrapper = document.createElement('div');
    wrapper.id    = VIEWS[i].id;
    /* La div hérite de la hauteur complète pour les vues flex */
    wrapper.style.cssText = 'height:100%; display:contents;';
    wrapper.innerHTML = html;
    main.appendChild(wrapper);
  });
}

/* ── Injection dynamique d'Alpine.js ─────────────────────────── */
function loadAlpine() {
  return new Promise((resolve, reject) => {
    const s  = document.createElement('script');
    s.defer  = true;
    s.src    = 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js';
    s.onload = resolve;
    s.onerror= () => reject(new Error('[loader] Échec du chargement Alpine.js'));
    document.head.appendChild(s);
  });
}

/* ── Séquence de démarrage ────────────────────────────────────── */
(async () => {
  try {
    await loadViews();
    await loadAlpine();
  } catch (err) {
    console.error(err);
    /* Afficher un message d'erreur minimal si le boot échoue */
    const main = document.getElementById('main-views');
    if (main) {
      main.innerHTML = `
        <div style="color:#ff3b57;font-family:'IBM Plex Mono',monospace;font-size:10px;
                    padding:2rem;text-align:center;">
          ERREUR DE CHARGEMENT<br>
          <span style="color:#6b7e93;">${err.message}</span><br>
          <span style="color:#3d556e;">Vérifiez la console et assurez-vous d'utiliser Live Server.</span>
        </div>`;
    }
  } finally {
    /* Masquer l'écran de démarrage dans tous les cas */
    const boot = document.getElementById('boot-screen');
    if (boot) boot.remove();
  }
})();
