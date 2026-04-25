/**
 * api.js — The SAN
 * Chaîne de résilience à 3 niveaux :
 *   1. Alpha Vantage (données réelles, quota 25/jour)
 *   2. Yahoo Finance (pas de clé, 2 ans d'historique, CORS via proxy Cloudflare)
 *   3. Mock   (données simulées — fallback garanti)
 *
 * Le cache (Cache module) est consulté avant tout appel réseau.
 */

const API = (() => {

  // ─── Configuration ────────────────────────────────────────────────────────

  const AV_BASE    = 'https://www.alphavantage.co/query';
  const AV_DELAY   = 13_000; // 13s entre appels (limite 5/min → 12s + marge)

  /**
   * Proxy Cloudflare Worker gratuit pour contourner les CORS Yahoo Finance.
   * En production, remplacer par votre propre worker.
   * En local (Cursor Live Server), les CORS Yahoo peuvent bloquer — le proxy lève ce blocage.
   * Si non disponible, la chaîne tombe directement sur le mock.
   */
  const YAHOO_PROXY = 'https://san-proxy.your-domain.workers.dev/yahoo';

  // Délai entre requêtes AV (évite le 429)
  let _lastAvCall = 0;

  // ─── Univers d'actifs ─────────────────────────────────────────────────────

  const ASSETS = {
    // Lithium & batteries
    LIT:  { name: 'Global X Lithium & Battery Tech ETF', category: 'lithium' },
    LTHM: { name: 'Lithium Americas Corp.', category: 'lithium' },
    ALB:  { name: 'Albemarle Corporation', category: 'lithium' },
    SQM:  { name: 'Sociedad Química y Minera', category: 'lithium' },

    // Uranium
    URA:  { name: 'Global X Uranium ETF', category: 'uranium' },
    CCJ:  { name: 'Cameco Corporation', category: 'uranium' },
    NLR:  { name: 'VanEck Uranium+Nuclear ETF', category: 'uranium' },

    // Cuivre
    CPER: { name: 'United States Copper Index Fund', category: 'copper' },
    FCX:  { name: 'Freeport-McMoRan', category: 'copper' },
    COPX: { name: 'Global X Copper Miners ETF', category: 'copper' },

    // Hydrogène
    HYDR: { name: 'Global X Hydrogen ETF', category: 'hydrogen' },
    FCEL: { name: 'FuelCell Energy', category: 'hydrogen' },

    // Macro références
    GLD:  { name: 'SPDR Gold Shares', category: 'macro' },
    TLT:  { name: 'iShares 20+ Year Treasury Bond ETF', category: 'macro' },
    SPY:  { name: 'SPDR S&P 500 ETF', category: 'macro' },
    DXY:  { name: 'Invesco DB US Dollar Index Bullish Fund', category: 'macro' },

    // Clean energy
    ICLN: { name: 'iShares Global Clean Energy ETF', category: 'energy' },
    TAN:  { name: 'Invesco Solar ETF', category: 'energy' },
    TSLA: { name: 'Tesla, Inc.', category: 'energy' },
  };

  // ─── Point d'entrée principal ─────────────────────────────────────────────

  /**
   * Récupère les prix ajustés journaliers pour un symbole.
   * Consulte le cache d'abord, puis déclenche la chaîne de fallback.
   *
   * @param {string} symbol
   * @param {number} windowDays - nombre de jours requis
   * @returns {Promise<{ prices: number[], dates: string[], source: string, fromCache: boolean }>}
   */
  async function fetchPrices(symbol, windowDays = 30) {
    const cacheKeyAV    = Cache.keyFor(symbol, 'alphavantage');
    const cacheKeyYahoo = Cache.keyFor(symbol, 'yahoo');

    // L1/L2 cache check (AV en priorité)
    const cachedAV = await Cache.get(cacheKeyAV);
    if (cachedAV && cachedAV.prices.length >= windowDays) {
      return { ...cachedAV, fromCache: true, source: 'alphavantage' };
    }

    const cachedYahoo = await Cache.get(cacheKeyYahoo);
    if (cachedYahoo && cachedYahoo.prices.length >= windowDays) {
      return { ...cachedYahoo, fromCache: true, source: 'yahoo' };
    }

    // Chaîne de fallback
    const apiKey = Store.getApiKey();

    if (apiKey) {
      try {
        const result = await _fetchAlphaVantage(symbol, apiKey, windowDays);
        await Cache.set(cacheKeyAV, { prices: result.prices, dates: result.dates });
        return { ...result, fromCache: false, source: 'alphavantage' };
      } catch (err) {
        console.warn(`[API] Alpha Vantage échec (${symbol}):`, err.message);
      }
    }

    // Fallback Yahoo Finance
    try {
      const result = await _fetchYahoo(symbol, windowDays);
      await Cache.set(cacheKeyYahoo, { prices: result.prices, dates: result.dates });
      Store.set({ dataMode: 'yahoo' });
      return { ...result, fromCache: false, source: 'yahoo' };
    } catch (err) {
      console.warn(`[API] Yahoo Finance échec (${symbol}):`, err.message);
    }

    // Fallback Mock (garanti)
    console.info(`[API] Utilisation des données mock pour ${symbol}`);
    Store.set({ dataMode: 'mock' });
    return _generateMock(symbol, windowDays);
  }

  /**
   * Récupère les prix pour plusieurs symboles en séquence (respect du rate limit AV).
   * Émet des événements de progression via Store.
   *
   * @param {string[]} symbols
   * @param {number} windowDays
   * @returns {Promise<Object.<string, { prices: number[], dates: string[], source: string }>>}
   */
  async function fetchMultiple(symbols, windowDays = 30) {
    const results = {};
    const total = symbols.length;

    for (let i = 0; i < total; i++) {
      const sym = symbols[i];
      Store.setLoading(true, `Chargement ${sym} (${i + 1}/${total})…`);

      try {
        results[sym] = await fetchPrices(sym, windowDays);
      } catch (err) {
        console.error(`[API] Échec définitif pour ${sym}:`, err);
        results[sym] = _generateMock(sym, windowDays);
      }
    }

    Store.setLoading(false);
    return results;
  }

  // ─── Niveau 1 : Alpha Vantage ─────────────────────────────────────────────

  async function _fetchAlphaVantage(symbol, apiKey, windowDays) {
    await _throttleAV();

    const url = new URL(AV_BASE);
    url.searchParams.set('function', 'TIME_SERIES_DAILY_ADJUSTED');
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('outputsize', windowDays > 100 ? 'full' : 'compact');
    url.searchParams.set('apikey', apiKey);

    const resp = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const data = await resp.json();

    if (data['Note']) throw new Error('Rate limit Alpha Vantage atteint');
    if (data['Information']) throw new Error('Quota journalier Alpha Vantage épuisé');
    if (!data['Time Series (Daily)']) throw new Error('Réponse Alpha Vantage invalide');

    const ts = data['Time Series (Daily)'];
    const dates = Object.keys(ts).sort().slice(-windowDays - 5);
    const prices = dates.map(d => parseFloat(ts[d]['5. adjusted close']));

    return { prices, dates };
  }

  async function _throttleAV() {
    const elapsed = Date.now() - _lastAvCall;
    if (_lastAvCall > 0 && elapsed < AV_DELAY) {
      await _wait(AV_DELAY - elapsed);
    }
    _lastAvCall = Date.now();
  }

  // ─── Niveau 2 : Yahoo Finance (via proxy CORS) ────────────────────────────

  async function _fetchYahoo(symbol, windowDays) {
    // Calcul de la plage de dates (UNIX timestamps)
    const now   = Math.floor(Date.now() / 1000);
    const start = now - (windowDays + 10) * 86_400; // +10 pour les jours fériés

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&period1=${start}&period2=${now}`;
    const proxyUrl = `${YAHOO_PROXY}?url=${encodeURIComponent(yahooUrl)}`;

    // Essai direct d'abord (peut fonctionner en local selon la config CORS)
    let resp;
    try {
      resp = await fetch(yahooUrl, {
        signal: AbortSignal.timeout(8_000),
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
    } catch {
      // CORS bloqué → essai via proxy
      resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(8_000) });
    }

    if (!resp.ok) throw new Error(`Yahoo HTTP ${resp.status}`);

    const json = await resp.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('Réponse Yahoo invalide');

    const timestamps = result.timestamp ?? [];
    const closes     = result.indicators?.adjclose?.[0]?.adjclose ?? [];

    if (timestamps.length < 5) throw new Error('Données Yahoo insuffisantes');

    const dates  = timestamps.map(ts => new Date(ts * 1000).toISOString().slice(0, 10));
    const prices = closes.map(v => v ?? NaN).filter((_, i) => !isNaN(closes[i]));

    return { prices, dates };
  }

  // ─── Niveau 3 : Mock ──────────────────────────────────────────────────────

  /**
   * Génère une série de prix simulés avec une marche aléatoire réaliste.
   * Les corrélations inter-actifs ne sont PAS simulées (chaque série est indépendante).
   * L'UI doit afficher un bandeau d'avertissement quand dataMode === 'mock'.
   */
  function _generateMock(symbol, windowDays) {
    // Paramètres spécifiques par ticker pour un rendu réaliste
    const profiles = {
      TSLA: { start: 180, vol: 0.035 },
      SPY:  { start: 480, vol: 0.010 },
      GLD:  { start: 185, vol: 0.008 },
      TLT:  { start: 92,  vol: 0.012 },
      LIT:  { start: 18,  vol: 0.025 },
      URA:  { start: 28,  vol: 0.030 },
      CPER: { start: 22,  vol: 0.020 },
    };

    const { start = 50, vol = 0.022 } = profiles[symbol] ?? {};
    const prices = [start];
    const dates  = [];
    const base   = new Date();

    for (let i = windowDays; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));

      if (i < windowDays) {
        const ret  = (Math.random() - 0.48) * vol * 2;
        const next = Math.max(0.01, prices[prices.length - 1] * (1 + ret));
        prices.push(next);
      }
    }

    return { prices, dates, source: 'mock', fromCache: false };
  }

  // ─── Utils ────────────────────────────────────────────────────────────────

  function _wait(ms) { return new Promise(r => setTimeout(r, ms)); }

  /** Retourne la liste complète des actifs disponibles. */
  function getAssets() { return { ...ASSETS }; }

  /** Retourne les métadonnées d'un actif. */
  function getAssetInfo(symbol) { return ASSETS[symbol] ?? null; }

  // ─── Public API ──────────────────────────────────────────────────────────
  return { fetchPrices, fetchMultiple, getAssets, getAssetInfo };
})();
