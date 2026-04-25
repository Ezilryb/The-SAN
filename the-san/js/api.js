/**
 * THE SAN — Data Layer
 * Alpha Vantage API integration + mock data fallback
 *
 * v2.1 → v2.2 — Migration cache Map → SanCache (IndexedDB)
 *   • Les séries temporelles persistent entre sessions (plus de requêtes redondantes)
 *   • Fallback L1 mémoire conservé pour les accès intra-session ultra-rapides
 *   • Dépendance : cache.js doit être chargé AVANT api.js
 */

const API = (() => {

  const BASE_URL = 'https://www.alphavantage.co/query';
  let _apiKey = localStorage.getItem('san_api_key') || '';

  // ── Cache L1 : mémoire (intra-session, accès synchrone) ───────────────
  // Cache L2 : SanCache (IndexedDB, persistant inter-sessions) → voir fetchAlphaVantage
  const memCache = new Map();
  const MEM_TTL  = 15 * 60 * 1000; // 15 min en mémoire

  // ─── Asset Registry ───────────────────────────────────────────────────

  const ASSETS = {
    // Commodities / ETFs
    LIT:  { label: 'Lithium',     symbol: 'LIT',  type: 'commodity', icon: '⚡' },
    CPER: { label: 'Copper',      symbol: 'CPER', type: 'commodity', icon: '🔶' },
    GLD:  { label: 'Gold',        symbol: 'GLD',  type: 'commodity', icon: '🥇' },
    SLV:  { label: 'Silver',      symbol: 'SLV',  type: 'commodity', icon: '⬜' },
    URA:  { label: 'Uranium',     symbol: 'URA',  type: 'commodity', icon: '☢️'  },
    USO:  { label: 'Oil (WTI)',   symbol: 'USO',  type: 'commodity', icon: '🛢️' },
    CORN: { label: 'Corn',        symbol: 'CORN', type: 'commodity', icon: '🌽' },
    WEAT: { label: 'Wheat',       symbol: 'WEAT', type: 'commodity', icon: '🌾' },

    // EV / Battery
    TSLA: { label: 'Tesla',       symbol: 'TSLA', type: 'ev',        icon: '🔋' },
    RIVN: { label: 'Rivian',      symbol: 'RIVN', type: 'ev',        icon: '🚙' },
    NIO:  { label: 'NIO',         symbol: 'NIO',  type: 'ev',        icon: '🚗' },
    LCID: { label: 'Lucid',       symbol: 'LCID', type: 'ev',        icon: '💎' },
    QS:   { label: 'QuantumScp',  symbol: 'QS',   type: 'ev',        icon: '🔬' },
    GM:   { label: 'GM',          symbol: 'GM',   type: 'ev',        icon: '🏭' },

    // Semis / Tech
    NVDA: { label: 'NVIDIA',      symbol: 'NVDA', type: 'tech',      icon: '🖥️' },
    TSM:  { label: 'TSMC',        symbol: 'TSM',  type: 'tech',      icon: '🔧' },
    SOXX: { label: 'Semis ETF',   symbol: 'SOXX', type: 'tech',      icon: '💻' },
    QQQ:  { label: 'Nasdaq ETF',  symbol: 'QQQ',  type: 'tech',      icon: '📊' },
    AMAT: { label: 'Appl. Mat.',  symbol: 'AMAT', type: 'tech',      icon: '⚙️' },

    // Energy
    ENPH: { label: 'Enphase',     symbol: 'ENPH', type: 'energy',    icon: '☀️' },
    FSLR: { label: 'First Solar', symbol: 'FSLR', type: 'energy',    icon: '🌞' },
    XLE:  { label: 'Energy ETF',  symbol: 'XLE',  type: 'energy',    icon: '⛽' },
    NEE:  { label: 'NextEra',     symbol: 'NEE',  type: 'energy',    icon: '💨' },
  };

  const ASSET_GROUPS = {
    commodity: 'Matières Premières',
    ev:        'EV & Batteries',
    tech:      'Semis & Tech',
    energy:    'Énergie',
  };

  function setApiKey(key) {
    _apiKey = key.trim();
    localStorage.setItem('san_api_key', _apiKey);
  }

  function getApiKey() { return _apiKey; }
  function hasApiKey() { return _apiKey.length > 0; }

  // ─── Cache helpers L1 (mémoire) ───────────────────────────────────────

  function memGet(key) {
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > MEM_TTL) { memCache.delete(key); return null; }
    return entry.data;
  }

  function memSet(key, data) {
    memCache.set(key, { data, ts: Date.now() });
  }

  // ─── Alpha Vantage fetch — utilise SanCache (L2) ──────────────────────

  async function fetchAlphaVantage(symbol) {
    const cKey = `av_series_${symbol}`;

    // L1 : mémoire (synchrone, < 1ms)
    const inMem = memGet(cKey);
    if (inMem) return inMem;

    // L2 : IndexedDB (persistant, survit aux rechargements de page)
    const inIDB = await SanCache.get(cKey);
    if (inIDB) {
      memSet(cKey, inIDB); // promote en L1
      return inIDB;
    }

    if (!hasApiKey()) throw new Error('NO_API_KEY');

    const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${_apiKey}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const json = await resp.json();

    if (json['Note'] || json['Information']) throw new Error('API_RATE_LIMIT');
    if (json['Error Message'])               throw new Error(`API_ERROR: ${json['Error Message']}`);

    const timeSeries = json['Time Series (Daily)'];
    if (!timeSeries) throw new Error('NO_DATA');

    const dates = Object.keys(timeSeries).sort().slice(-35);
    const series = {};
    for (const date of dates) {
      series[date] = parseFloat(timeSeries[date]['5. adjusted close']);
    }

    // Persist L1 + L2
    memSet(cKey, series);
    await SanCache.set(cKey, series, SanCache.TTL_LIVE); // 1h dans IndexedDB

    return series;
  }

  // ─── Mock data — cache L1 uniquement (reproductible, pas besoin d'IDB) ──

  function generateMockSeries(symbol, targetCorrelation = null, anchorSeries = null) {
    const cKey = `mock_${symbol}`;
    const inMem = memGet(cKey);
    if (inMem) return inMem;

    const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    let rng = mulberry32(seed);
    const asset = ASSETS[symbol];
    const basePrices = {
      commodity: 30 + rng() * 70,
      ev:        5  + rng() * 300,
      tech:      20 + rng() * 800,
      energy:    20 + rng() * 200,
    };
    let price = basePrices[asset?.type || 'tech'] || 100;

    const today = new Date();
    const series = {};

    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const dateStr = d.toISOString().split('T')[0];
      const drift   = 0.0002;
      const vol     = 0.018 + rng() * 0.012;
      price = price * (1 + drift + boxMuller(rng) * vol);
      price = Math.max(0.5, price);
      series[dateStr] = price;
    }

    memSet(cKey, series); // L1 seulement — les mocks sont déterministes, IDB inutile
    return series;
  }

  // ─── Seedable PRNG (Mulberry32) ───────────────────────────────────────

  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // ─── Box-Muller normal distribution ──────────────────────────────────

  function boxMuller(rng) {
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  // ─── fetchSeries — mock synchrone, live via cache bicouche ───────────

  async function fetchSeries(symbol, useMock = false) {
    if (useMock || !hasApiKey()) {
      return generateMockSeries(symbol);
    }
    try {
      return await fetchAlphaVantage(symbol);
    } catch (err) {
      console.warn(`[API] Fallback mock pour ${symbol}:`, err.message);
      return generateMockSeries(symbol);
    }
  }

  // ─── fetchMultiple — rate-limit intelligent + log cache hit ratio ──────

  async function fetchMultiple(symbols, useMock = false, onProgress = null) {
    const results   = {};
    const delay     = ms => new Promise(r => setTimeout(r, ms));
    let   cacheHits = 0;

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      try {
        // Vérifie L2 avant d'appliquer le délai réseau
        const cachedInIDB = !useMock && await SanCache.get(`av_series_${sym}`);
        if (cachedInIDB) cacheHits++;

        results[sym] = await fetchSeries(sym, useMock);
      } catch (e) {
        results[sym] = null;
        console.error(`[API] Échec fetch ${sym}:`, e);
      }

      if (onProgress) onProgress(i + 1, symbols.length, sym);

      // Délai réseau uniquement si appel réel (pas depuis cache)
      const needsDelay = !useMock && hasApiKey() && i < symbols.length - 1;
      const isCached   = !useMock && !!memGet(`av_series_${sym}`);
      if (needsDelay && !isCached) {
        await delay(13000); // 13s entre appels → max 4.6/min (limite free tier)
      }
    }

    if (cacheHits > 0) {
      console.info(`[API] Cache IDB : ${cacheHits}/${symbols.length} séries servies depuis IndexedDB.`);
    }

    return results;
  }

  return {
    ASSETS,
    ASSET_GROUPS,
    setApiKey,
    getApiKey,
    hasApiKey,
    fetchSeries,
    fetchMultiple,
    generateMockSeries,
  };
})();
