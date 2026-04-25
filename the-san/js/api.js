/**
 * THE SAN — Data Layer
 * Alpha Vantage API integration + mock data fallback
 */

const API = (() => {

  const BASE_URL = 'https://www.alphavantage.co/query';
  let _apiKey = localStorage.getItem('san_api_key') || '';

  // Cache to minimize API calls (Alpha Vantage: 25/day free)
  const cache = new Map();
  const CACHE_TTL = 60 * 60 * 1000; // 1 hour

  // ─── Asset Registry ───────────────────────────────────────────────────────

  const ASSETS = {
    // Commodities / ETFs
    LIT:  { label: 'Lithium',    symbol: 'LIT',  type: 'commodity', icon: '⚡' },
    CPER: { label: 'Copper',     symbol: 'CPER', type: 'commodity', icon: '🔶' },
    GLD:  { label: 'Gold',       symbol: 'GLD',  type: 'commodity', icon: '🥇' },
    SLV:  { label: 'Silver',     symbol: 'SLV',  type: 'commodity', icon: '⬜' },
    URA:  { label: 'Uranium',    symbol: 'URA',  type: 'commodity', icon: '☢️'  },
    USO:  { label: 'Oil (WTI)',  symbol: 'USO',  type: 'commodity', icon: '🛢️' },
    CORN: { label: 'Corn',       symbol: 'CORN', type: 'commodity', icon: '🌽' },
    WEAT: { label: 'Wheat',      symbol: 'WEAT', type: 'commodity', icon: '🌾' },

    // EV / Battery
    TSLA: { label: 'Tesla',      symbol: 'TSLA', type: 'ev',        icon: '🔋' },
    RIVN: { label: 'Rivian',     symbol: 'RIVN', type: 'ev',        icon: '🚙' },
    NIO:  { label: 'NIO',        symbol: 'NIO',  type: 'ev',        icon: '🚗' },
    LCID: { label: 'Lucid',      symbol: 'LCID', type: 'ev',        icon: '💎' },
    QS:   { label: 'QuantumScp', symbol: 'QS',   type: 'ev',        icon: '🔬' },
    GM:   { label: 'GM',         symbol: 'GM',   type: 'ev',        icon: '🏭' },

    // Semis / Tech
    NVDA: { label: 'NVIDIA',     symbol: 'NVDA', type: 'tech',      icon: '🖥️' },
    TSM:  { label: 'TSMC',       symbol: 'TSM',  type: 'tech',      icon: '🔧' },
    SOXX: { label: 'Semis ETF',  symbol: 'SOXX', type: 'tech',      icon: '💻' },
    QQQ:  { label: 'Nasdaq ETF', symbol: 'QQQ',  type: 'tech',      icon: '📊' },
    AMAT: { label: 'Appl. Mat.', symbol: 'AMAT', type: 'tech',      icon: '⚙️' },

    // Energy
    ENPH: { label: 'Enphase',    symbol: 'ENPH', type: 'energy',    icon: '☀️' },
    FSLR: { label: 'First Solar', symbol: 'FSLR', type: 'energy',   icon: '🌞' },
    XLE:  { label: 'Energy ETF', symbol: 'XLE',  type: 'energy',    icon: '⛽' },
    NEE:  { label: 'NextEra',    symbol: 'NEE',  type: 'energy',     icon: '💨' },
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

  // ─── Cache helpers ─────────────────────────────────────────────────────────

  function cacheGet(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
    return entry.data;
  }

  function cacheSet(key, data) {
    cache.set(key, { data, ts: Date.now() });
  }

  // ─── Alpha Vantage fetch ──────────────────────────────────────────────────

  async function fetchAlphaVantage(symbol) {
    const cKey = `av_${symbol}`;
    const cached = cacheGet(cKey);
    if (cached) return cached;

    if (!hasApiKey()) throw new Error('NO_API_KEY');

    const url = `${BASE_URL}?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&outputsize=compact&apikey=${_apiKey}`;

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

    const json = await resp.json();

    // Rate limit or error detection
    if (json['Note'] || json['Information']) {
      throw new Error('API_RATE_LIMIT');
    }
    if (json['Error Message']) {
      throw new Error(`API_ERROR: ${json['Error Message']}`);
    }

    const timeSeries = json['Time Series (Daily)'];
    if (!timeSeries) throw new Error('NO_DATA');

    // Extract last 35 trading days of close prices
    const dates = Object.keys(timeSeries).sort().slice(-35);
    const series = {};
    for (const date of dates) {
      series[date] = parseFloat(timeSeries[date]['5. adjusted close']);
    }

    cacheSet(cKey, series);
    return series;
  }

  // ─── Mock data generator ─────────────────────────────────────────────────

  /**
   * Generates realistic mock price series for demo mode
   * Uses seeded random for reproducible results per symbol
   */
  function generateMockSeries(symbol, targetCorrelation = null, anchorSeries = null) {
    const seed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    let rng = mulberry32(seed);

    // Base price varies by asset type
    const asset = ASSETS[symbol];
    const basePrices = {
      commodity: 30 + rng() * 70,
      ev: 5 + rng() * 300,
      tech: 20 + rng() * 800,
      energy: 20 + rng() * 200,
    };
    let price = basePrices[asset?.type || 'tech'] || 100;

    // 35 trading days back from today
    const today = new Date();
    const series = {};

    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      const dateStr = d.toISOString().split('T')[0];

      // Random walk with slight drift
      const drift = 0.0002;
      const vol = 0.018 + rng() * 0.012;
      const noise = boxMuller(rng) * vol;

      // If anchor series provided, add some correlation
      let corr = 0;
      if (anchorSeries && targetCorrelation !== null && series[dateStr]) {
        // simplified: not used in mock generation for simplicity
      }

      price = price * (1 + drift + noise + corr);
      price = Math.max(0.5, price);
      series[dateStr] = price;
    }

    return series;
  }

  // Seedable PRNG (Mulberry32)
  function mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Box-Muller normal distribution
  function boxMuller(rng) {
    const u1 = Math.max(1e-10, rng());
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  // ─── Public fetch (with mock fallback) ───────────────────────────────────

  async function fetchSeries(symbol, useMock = false) {
    if (useMock || !hasApiKey()) {
      return generateMockSeries(symbol);
    }

    try {
      return await fetchAlphaVantage(symbol);
    } catch (err) {
      console.warn(`[API] Falling back to mock for ${symbol}:`, err.message);
      return generateMockSeries(symbol);
    }
  }

  /**
   * Fetch multiple symbols (respects rate limits)
   */
  async function fetchMultiple(symbols, useMock = false, onProgress = null) {
    const results = {};
    const delay = ms => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      try {
        results[sym] = await fetchSeries(sym, useMock);
      } catch (e) {
        results[sym] = null;
        console.error(`[API] Failed to fetch ${sym}:`, e);
      }

      if (onProgress) onProgress(i + 1, symbols.length, sym);

      // Rate limit: 5 calls/minute on free tier
      if (!useMock && hasApiKey() && i < symbols.length - 1) {
        await delay(13000); // 13s between calls → max 4.6/min
      }
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
