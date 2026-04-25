/**
 * store.js — The SAN
 * State manager observable centralisé avec bus d'événements.
 * Résout la race condition multi-onglets et l'état dispersé.
 */

const Store = (() => {

  // ─── État initial ────────────────────────────────────────────────────────

  const _defaultState = {
    // Clé API (sessionStorage uniquement, jamais persistée sur disque)
    apiKey: null,

    // Sélections actives
    selectedAssets: [],
    windowDays: 21,

    // Résultats de calcul
    correlationMatrix: null,
    lastComputedAt: null,

    // UI
    isLoading: false,
    loadingMessage: '',
    error: null,

    // Mode données
    dataMode: 'mock', // 'live' | 'yahoo' | 'mock'
  };

  /** @type {Object} */
  let _state = { ..._defaultState };

  // ─── Abonnés ─────────────────────────────────────────────────────────────

  /**
   * Bus d'événements : Map<eventName, Set<callback>>
   * @type {Map<string, Set<Function>>}
   */
  const _listeners = new Map();

  /**
   * S'abonner à un événement d'état.
   * @param {string} event   - nom de la clé d'état ou '*' pour tous les changements
   * @param {Function} cb    - callback(newValue, oldValue, fullState)
   * @returns {Function}     - fonction de désabonnement
   */
  function on(event, cb) {
    if (!_listeners.has(event)) _listeners.set(event, new Set());
    _listeners.get(event).add(cb);
    return () => off(event, cb);
  }

  /**
   * Se désabonner.
   */
  function off(event, cb) {
    _listeners.get(event)?.delete(cb);
  }

  /**
   * S'abonner une seule fois.
   */
  function once(event, cb) {
    const unsub = on(event, (...args) => {
      cb(...args);
      unsub();
    });
    return unsub;
  }

  // ─── Mutation ────────────────────────────────────────────────────────────

  /**
   * Met à jour une ou plusieurs clés de l'état.
   * Émet les événements correspondants.
   * @param {Partial<typeof _defaultState>} patch
   */
  function set(patch) {
    const changes = {};

    for (const [key, newVal] of Object.entries(patch)) {
      const oldVal = _state[key];

      // Évite les re-renders inutiles sur valeurs primitives identiques
      if (newVal === oldVal) continue;

      _state[key] = newVal;
      changes[key] = { newVal, oldVal };
    }

    if (Object.keys(changes).length === 0) return;

    // Persist les préférences non-sensibles dans localStorage
    _persist();

    // Émet les événements
    for (const [key, { newVal, oldVal }] of Object.entries(changes)) {
      _emit(key, newVal, oldVal);
    }
    _emit('*', _state, null);
  }

  /**
   * Lit une valeur de l'état.
   * @param {string} key
   * @returns {*}
   */
  function get(key) {
    return _state[key];
  }

  /**
   * Retourne un snapshot immutable de l'état complet.
   * @returns {Object}
   */
  function snapshot() {
    return { ..._state };
  }

  /**
   * Remet l'état aux valeurs par défaut.
   */
  function reset() {
    const old = _state;
    _state = { ..._defaultState };
    _emit('*', _state, old);
    localStorage.removeItem('san_state');
  }

  // ─── Persistence ─────────────────────────────────────────────────────────

  /** Clés autorisées dans localStorage (jamais de clé API). */
  const _persistableKeys = ['selectedAssets', 'windowDays', 'dataMode'];

  function _persist() {
    try {
      const slice = {};
      for (const k of _persistableKeys) slice[k] = _state[k];
      localStorage.setItem('san_state', JSON.stringify(slice));
    } catch (e) {
      // Silencieux en navigation privée
    }
  }

  function _hydrate() {
    try {
      const saved = localStorage.getItem('san_state');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      // Validation des clés pour éviter l'injection de données inattendues
      for (const k of _persistableKeys) {
        if (k in parsed) _state[k] = parsed[k];
      }
    } catch (e) {
      localStorage.removeItem('san_state');
    }
  }

  // ─── Clé API (sessionStorage) ────────────────────────────────────────────

  /**
   * Persiste la clé API dans sessionStorage uniquement.
   * Effacée à la fermeture de l'onglet.
   * @param {string} key
   */
  function setApiKey(key) {
    try {
      sessionStorage.setItem('san_apikey', key);
    } catch (e) { /* navigation privée */ }
    set({ apiKey: key });
  }

  function getApiKey() {
    if (_state.apiKey) return _state.apiKey;
    try {
      const k = sessionStorage.getItem('san_apikey');
      if (k) { _state.apiKey = k; return k; }
    } catch (e) { /* */ }
    return null;
  }

  function clearApiKey() {
    try { sessionStorage.removeItem('san_apikey'); } catch (e) { /* */ }
    set({ apiKey: null });
  }

  // ─── Helpers UI ──────────────────────────────────────────────────────────

  function setLoading(isLoading, message = '') {
    set({ isLoading, loadingMessage: message });
  }

  function setError(error) {
    set({ error, isLoading: false });
  }

  function clearError() {
    set({ error: null });
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  function _emit(event, newVal, oldVal) {
    _listeners.get(event)?.forEach(cb => {
      try { cb(newVal, oldVal, _state); }
      catch (e) { console.error(`[Store] Erreur dans le listener "${event}":`, e); }
    });
  }

  // ─── Init ────────────────────────────────────────────────────────────────

  // Synchronisation entre onglets via StorageEvent
  window.addEventListener('storage', (e) => {
    if (e.key === 'san_state' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        // Merge silencieux sans re-persist pour éviter la boucle infinie
        for (const k of _persistableKeys) {
          if (k in parsed && parsed[k] !== _state[k]) {
            const old = _state[k];
            _state[k] = parsed[k];
            _emit(k, parsed[k], old);
          }
        }
        _emit('*', _state, null);
      } catch (e) { /* */ }
    }
  });

  // Hydratation initiale
  _hydrate();

  // ─── Public API ──────────────────────────────────────────────────────────
  return {
    on, off, once,
    set, get, snapshot, reset,
    setApiKey, getApiKey, clearApiKey,
    setLoading, setError, clearError,
  };
})();
