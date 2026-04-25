/**
 * cache.js — The SAN
 * Cache unifié : mémoire (L1) + IndexedDB (L2).
 * Résout la perte de données entre sessions et réduit la consommation du quota API.
 */

const Cache = (() => {
  const DB_NAME = 'san_cache';
  const DB_VERSION = 1;
  const STORE_NAME = 'timeseries';

  /** Cache mémoire L1 : Map<key, {value, expiresAt}> */
  const _mem = new Map();

  /** @type {IDBDatabase|null} */
  let _db = null;

  // ─── Init IndexedDB ───────────────────────────────────────────────────────

  /**
   * Ouvre la base IndexedDB. À appeler au démarrage de l'app.
   * @returns {Promise<void>}
   */
  async function init() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('[Cache] IndexedDB non disponible. Utilisation du cache mémoire uniquement.');
        return resolve();
      }

      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };

      req.onsuccess = (e) => {
        _db = e.target.result;
        _evictExpired(); // Nettoyage des entrées périmées au démarrage
        resolve();
      };

      req.onerror = (e) => {
        console.error('[Cache] Échec ouverture IndexedDB:', e.target.error);
        resolve(); // Dégradé gracieux : continue sans IndexedDB
      };
    });
  }

  // ─── Lecture ─────────────────────────────────────────────────────────────

  /**
   * Récupère une valeur en cache (L1 → L2).
   * @param {string} key
   * @returns {Promise<*|null>} - null si absent ou expiré
   */
  async function get(key) {
    // L1 : mémoire
    const memEntry = _mem.get(key);
    if (memEntry) {
      if (Date.now() < memEntry.expiresAt) return memEntry.value;
      _mem.delete(key);
    }

    // L2 : IndexedDB
    if (!_db) return null;
    const entry = await _idbGet(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      await _idbDelete(key);
      return null;
    }

    // Promotion en L1
    _mem.set(key, { value: entry.value, expiresAt: entry.expiresAt });
    return entry.value;
  }

  // ─── Écriture ────────────────────────────────────────────────────────────

  /**
   * Stocke une valeur en cache (L1 + L2).
   * @param {string} key
   * @param {*} value
   * @param {number} ttlMs - durée de vie en millisecondes (défaut: 1h)
   */
  async function set(key, value, ttlMs = 3_600_000) {
    const expiresAt = Date.now() + ttlMs;

    // L1
    _mem.set(key, { value, expiresAt });

    // L2
    if (_db) {
      await _idbPut({ key, value, expiresAt });
    }
  }

  /**
   * Invalide une entrée spécifique.
   * @param {string} key
   */
  async function invalidate(key) {
    _mem.delete(key);
    if (_db) await _idbDelete(key);
  }

  /**
   * Génère une clé de cache normalisée pour une série temporelle.
   * @param {string} symbol
   * @param {string} source - 'alphavantage' | 'yahoo'
   * @returns {string}
   */
  function keyFor(symbol, source = 'alphavantage') {
    return `ts:${source}:${symbol.toUpperCase()}`;
  }

  /**
   * Vide tout le cache (utile pour le debug).
   */
  async function clear() {
    _mem.clear();
    if (!_db) return;
    return new Promise((resolve, reject) => {
      const tx = _db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  }

  /**
   * Retourne les méta-informations d'un cache (pour diagnostic).
   * @returns {Promise<{count: number, size: string, keys: string[]}>}
   */
  async function inspect() {
    const memKeys = [..._mem.keys()];
    let idbKeys = [];
    if (_db) {
      idbKeys = await _idbGetAllKeys();
    }
    return {
      l1Count: memKeys.length,
      l2Count: idbKeys.length,
      memKeys,
      idbKeys,
    };
  }

  // ─── IndexedDB helpers ────────────────────────────────────────────────────

  function _idbGet(key) {
    return new Promise((resolve, reject) => {
      try {
        const tx = _db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }

  function _idbPut(entry) {
    return new Promise((resolve, reject) => {
      try {
        const tx = _db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(entry);
        tx.oncomplete = resolve;
        tx.onerror = resolve; // Silencieux : L1 suffit
      } catch (e) { resolve(); }
    });
  }

  function _idbDelete(key) {
    return new Promise((resolve) => {
      try {
        const tx = _db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      } catch (e) { resolve(); }
    });
  }

  function _idbGetAllKeys() {
    return new Promise((resolve) => {
      try {
        const tx = _db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAllKeys();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => resolve([]);
      } catch (e) { resolve([]); }
    });
  }

  /**
   * Supprime les entrées expirées de IndexedDB (appelé à l'init).
   */
  async function _evictExpired() {
    if (!_db) return;
    return new Promise((resolve) => {
      try {
        const tx = _db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('expiresAt');
        const range = IDBKeyRange.upperBound(Date.now());
        const req = index.openCursor(range);
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
        tx.oncomplete = resolve;
        tx.onerror = resolve;
      } catch (e) { resolve(); }
    });
  }

  // ─── Public API ──────────────────────────────────────────────────────────
  return { init, get, set, invalidate, keyFor, clear, inspect };
})();
