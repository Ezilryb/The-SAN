/**
 * THE SAN — Persistent Cache
 * IndexedDB avec TTL + fallback Map en mémoire si IDB indisponible.
 *
 * API publique (window.SanCache) :
 *   await SanCache.get(key)              → data | null
 *   await SanCache.set(key, data, ttl?)  → boolean
 *   await SanCache.del(key)              → boolean
 *   await SanCache.clear()               → boolean
 *   await SanCache.info()                → { entries, expired, sizeKB }
 *   SanCache.isIDB                       → true si IndexedDB actif
 */

const SanCache = (() => {

  const DB_NAME    = 'san_v1';
  const DB_VERSION = 1;
  const STORE      = 'series';
  const TTL_LIVE   = 60 * 60 * 1000;      // 1h  — données Alpha Vantage
  const TTL_SHORT  = 10 * 60 * 1000;      // 10m — réservé usage futur

  // ─── Fallback mémoire (private browsing, navigateurs anciens) ────────────
  const _mem  = new Map();
  let   _db   = null;
  let   _idb  = true;   // optimiste — basculé sur false si IDB échoue

  // ─── Ouverture / initialisation ──────────────────────────────────────────

  function openDB() {
    if (_db)     return Promise.resolve(_db);
    if (!_idb)   return Promise.resolve(null);

    return new Promise(resolve => {
      let req;
      try {
        req = indexedDB.open(DB_NAME, DB_VERSION);
      } catch {
        _idb = false;
        return resolve(null);
      }

      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
      };

      req.onsuccess = e => {
        _db = e.target.result;

        // Erreur post-ouverture (ex. quota disque dépassé) → fallback
        _db.onerror = () => { _idb = false; _db = null; };

        resolve(_db);
      };

      req.onerror = () => {
        console.warn('[SanCache] IndexedDB indisponible — fallback mémoire activé.');
        _idb = false;
        resolve(null);
      };

      req.onblocked = () => {
        console.warn('[SanCache] IndexedDB bloqué (autre onglet ?) — fallback mémoire.');
        _idb = false;
        resolve(null);
      };
    });
  }

  // ─── Helpers internes ────────────────────────────────────────────────────

  function _memGet(key) {
    const e = _mem.get(key);
    if (!e) return null;
    if (Date.now() - e.ts > e.ttl) { _mem.delete(key); return null; }
    return e.data;
  }

  function _memSet(key, data, ttl) {
    _mem.set(key, { data, ts: Date.now(), ttl });
  }

  // ─── API publique ─────────────────────────────────────────────────────────

  async function get(key) {
    // 1. Toujours vérifier le cache mémoire en premier (plus rapide)
    const mem = _memGet(key);
    if (mem !== null) return mem;

    // 2. Tenter IndexedDB
    const db = await openDB();
    if (!db) return null;

    return new Promise(resolve => {
      try {
        const tx  = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);

        req.onsuccess = () => {
          const entry = req.result;
          if (!entry) return resolve(null);

          if (Date.now() - entry.ts > entry.ttl) {
            // Expiré — nettoyage asynchrone sans bloquer
            del(key).catch(() => {});
            return resolve(null);
          }

          // Promote en mémoire pour les accès suivants
          _memSet(key, entry.data, entry.ttl - (Date.now() - entry.ts));
          resolve(entry.data);
        };

        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function set(key, data, ttl = TTL_LIVE) {
    // Toujours mettre en mémoire (accès synchrone ensuite)
    _memSet(key, data, ttl);

    const db = await openDB();
    if (!db) return false;

    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({ key, data, ts: Date.now(), ttl });
        tx.oncomplete = () => resolve(true);
        tx.onerror    = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async function del(key) {
    _mem.delete(key);

    const db = await openDB();
    if (!db) return false;

    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror    = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  async function clear() {
    _mem.clear();

    const db = await openDB();
    if (!db) return false;

    return new Promise(resolve => {
      try {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = () => resolve(true);
        tx.onerror    = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Statistiques du cache (pour le panneau UI).
   * @returns {{ entries, expired, sizeKB, isIDB }}
   */
  async function info() {
    const db = await openDB();
    if (!db) {
      return { entries: _mem.size, expired: 0, sizeKB: '—', isIDB: false };
    }

    return new Promise(resolve => {
      try {
        const tx      = db.transaction(STORE, 'readonly');
        const store   = tx.objectStore(STORE);
        const countReq = store.count();
        const allReq   = store.getAll();
        let entries = 0, expired = 0, rawBytes = 0;

        allReq.onsuccess = () => {
          const now = Date.now();
          for (const e of allReq.result) {
            entries++;
            if (now - e.ts > e.ttl) expired++;
            try { rawBytes += JSON.stringify(e.data).length * 2; } catch { /* ignore */ }
          }
          resolve({
            entries,
            expired,
            sizeKB: (rawBytes / 1024).toFixed(1),
            isIDB:  true,
          });
        };

        allReq.onerror = () => resolve({ entries: 0, expired: 0, sizeKB: '—', isIDB: true });
      } catch {
        resolve({ entries: 0, expired: 0, sizeKB: '—', isIDB: false });
      }
    });
  }

  /**
   * Purge des entrées expirées (appelé automatiquement à l'init).
   */
  async function purgeExpired() {
    const db = await openDB();
    if (!db) return;

    const now = Date.now();
    await new Promise(resolve => {
      try {
        const tx  = db.transaction(STORE, 'readwrite');
        const req = tx.objectStore(STORE).openCursor();

        req.onsuccess = e => {
          const cursor = e.target.result;
          if (!cursor) return;
          if (now - cursor.value.ts > cursor.value.ttl) cursor.delete();
          cursor.continue();
        };

        tx.oncomplete = resolve;
        tx.onerror    = resolve;
      } catch {
        resolve();
      }
    });
  }

  // Init silencieux : ouvre la BDD et purge les entrées expirées
  openDB().then(db => { if (db) purgeExpired(); }).catch(() => {});

  return {
    get,
    set,
    del,
    clear,
    info,
    purgeExpired,
    get isIDB() { return _idb; },
    TTL_LIVE,
    TTL_SHORT,
  };
})();
