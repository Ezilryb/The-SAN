/**
 * router.js — The SAN
 * Routeur hash-based minimaliste, sans dépendance externe.
 * Compatible Cursor Live Server & GitHub Pages.
 */

const Router = (() => {
  /** @type {Map<string, {component: Function, title: string}>} */
  const routes = new Map();

  /** @type {string|null} */
  let currentRoute = null;

  /** @type {HTMLElement|null} */
  let outlet = null;

  /** @type {Function|null} */
  let beforeEach = null;

  // ─── Registration ────────────────────────────────────────────────────────

  /**
   * Enregistre une route.
   * @param {string} hash          - ex: '#/correlation'
   * @param {Function} component   - fonction qui retourne un HTMLElement ou du HTML string
   * @param {string} [title]       - titre de la page (document.title)
   */
  function register(hash, component, title = 'The SAN') {
    routes.set(hash, { component, title });
  }

  /**
   * Hook exécuté avant chaque navigation.
   * Si le callback retourne false, la navigation est annulée.
   * @param {Function} fn - (from: string, to: string) => boolean|void
   */
  function beforeEachHook(fn) {
    beforeEach = fn;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  /**
   * Navigue vers un hash programmatiquement.
   * @param {string} hash
   */
  function push(hash) {
    window.location.hash = hash;
  }

  /**
   * Remplace l'entrée courante dans l'historique.
   * @param {string} hash
   */
  function replace(hash) {
    const url = window.location.href.split('#')[0] + hash;
    window.history.replaceState(null, '', url);
    _resolve(hash);
  }

  // ─── Resolution ──────────────────────────────────────────────────────────

  /**
   * Résout la route active et monte le composant dans l'outlet.
   * @param {string} hash
   */
  async function _resolve(hash) {
    const normalised = hash || '#/correlation';

    if (beforeEach) {
      const proceed = await beforeEach(currentRoute, normalised);
      if (proceed === false) return;
    }

    const route = routes.get(normalised) ?? routes.get('*');

    if (!route) {
      console.warn(`[Router] Aucune route trouvée pour "${normalised}"`);
      return;
    }

    // Mise à jour du titre
    document.title = `${route.title} — The Sentiment Analytics Network`;

    // Mise à jour des liens de navigation actifs
    document.querySelectorAll('[data-route]').forEach(el => {
      el.classList.toggle('active', el.dataset.route === normalised);
    });

    // Rendu du composant dans l'outlet
    if (!outlet) {
      console.error('[Router] Outlet introuvable. Appelez Router.mount("#id") d\'abord.');
      return;
    }

    outlet.classList.add('route-exit');
    await _wait(120); // durée CSS de la transition de sortie

    const result = await route.component();
    if (typeof result === 'string') {
      outlet.innerHTML = result;
    } else if (result instanceof HTMLElement) {
      outlet.innerHTML = '';
      outlet.appendChild(result);
    }

    currentRoute = normalised;
    outlet.classList.remove('route-exit');
    outlet.classList.add('route-enter');

    // Nettoyage de la classe après animation
    outlet.addEventListener('animationend', () => {
      outlet.classList.remove('route-enter');
    }, { once: true });
  }

  // ─── Init ────────────────────────────────────────────────────────────────

  /**
   * Monte le routeur sur un élément DOM et démarre l'écoute des changements de hash.
   * @param {string} outletSelector - ex: '#app-outlet'
   */
  function mount(outletSelector) {
    outlet = document.querySelector(outletSelector);
    if (!outlet) throw new Error(`[Router] Outlet "${outletSelector}" introuvable dans le DOM.`);

    window.addEventListener('hashchange', () => {
      _resolve(window.location.hash);
    });

    // Résolution initiale au chargement
    const initial = window.location.hash || '#/correlation';
    _resolve(initial);
  }

  // ─── Utils ───────────────────────────────────────────────────────────────

  function _wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /** Retourne la route courante. */
  function current() {
    return currentRoute;
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  return { register, mount, push, replace, beforeEachHook, current };
})();
