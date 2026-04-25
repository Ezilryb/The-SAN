/**
 * stats.worker.js — The SAN
 * Calculs Pearson hors thread principal.
 * Évite le blocage du UI sur des matrices > 12 actifs ou des fenêtres longues.
 *
 * Usage depuis le thread principal :
 *   const worker = new Worker('./js/workers/stats.worker.js');
 *   worker.postMessage({ type: 'COMPUTE_MATRIX', payload: { series, windowDays } });
 *   worker.onmessage = ({ data }) => { ... };
 */

'use strict';

// ─── Constantes de validation ────────────────────────────────────────────────

const MIN_STD_DEV = 0.001;          // Variance minimale acceptable
const MAX_ZERO_RETURN_RATIO = 0.20; // Max 20% de rendements nuls
const MIN_OBSERVATION_RATIO = 0.60; // Min 60% des jours ouvrés attendus

// ─── Message handler ─────────────────────────────────────────────────────────

self.onmessage = function (e) {
  const { type, payload, requestId } = e.data;

  try {
    switch (type) {
      case 'COMPUTE_MATRIX':
        _handleComputeMatrix(payload, requestId);
        break;
      case 'COMPUTE_PAIR':
        _handleComputePair(payload, requestId);
        break;
      default:
        _reply(requestId, 'ERROR', { message: `Type de message inconnu: ${type}` });
    }
  } catch (err) {
    _reply(requestId, 'ERROR', { message: err.message, stack: err.stack });
  }
};

// ─── Handlers ────────────────────────────────────────────────────────────────

/**
 * Calcule la matrice de corrélation complète.
 * @param {{ series: Object.<string, number[]>, windowDays: number }} payload
 * @param {string} requestId
 */
function _handleComputeMatrix({ series, windowDays }, requestId) {
  const symbols = Object.keys(series);
  const n = symbols.length;
  const matrix = {};
  const quality = {};

  let completed = 0;
  const total = (n * (n - 1)) / 2;

  for (let i = 0; i < n; i++) {
    const symA = symbols[i];
    matrix[symA] = {};
    quality[symA] = {};

    for (let j = 0; j < n; j++) {
      const symB = symbols[j];

      if (i === j) {
        matrix[symA][symB] = 1.0;
        quality[symA][symB] = { status: 'perfect', detail: 'Autocorrélation' };
        continue;
      }

      // Matrice symétrique : réutilise la valeur déjà calculée
      if (j < i && matrix[symB]?.[symA] !== undefined) {
        matrix[symA][symB] = matrix[symB][symA];
        quality[symA][symB] = quality[symB][symA];
        continue;
      }

      const result = _computePearson(
        series[symA],
        series[symB],
        windowDays
      );

      matrix[symA][symB] = result.r;
      quality[symA][symB] = result.quality;

      completed++;

      // Progression tous les 10 calculs
      if (completed % 10 === 0) {
        _reply(requestId, 'PROGRESS', {
          completed,
          total,
          pct: Math.round((completed / total) * 100),
        });
      }
    }
  }

  _reply(requestId, 'MATRIX_DONE', { matrix, quality, symbols, windowDays });
}

/**
 * Calcule la corrélation d'une seule paire.
 */
function _handleComputePair({ seriesA, seriesB, symbolA, symbolB, windowDays }, requestId) {
  const result = _computePearson(seriesA, seriesB, windowDays);
  _reply(requestId, 'PAIR_DONE', { symbolA, symbolB, ...result });
}

// ─── Algorithme Pearson avec validation qualité ───────────────────────────────

/**
 * Calcule le coefficient de Pearson sur les rendements logarithmiques.
 * Inclut les validations de qualité de données.
 *
 * @param {number[]} pricesA - Séries de prix bruts (ordre chronologique)
 * @param {number[]} pricesB
 * @param {number}   windowDays - Fenêtre en jours ouvrés
 * @returns {{ r: number|null, quality: QualityResult }}
 *
 * @typedef {{ status: 'ok'|'warn'|'unreliable'|'insufficient', detail: string, observations: number }} QualityResult
 */
function _computePearson(pricesA, pricesB, windowDays) {
  // 1. Conversion en rendements log (plus stable que les rendements simples)
  const retA = _logReturns(pricesA);
  const retB = _logReturns(pricesB);

  // 2. Alignement des séries (seulement les indices communs non-NaN)
  const { aligned: pairsX, aligned: pairsY, n } = _alignSeries(retA, retB);
  const { x, y } = _alignSeries(retA, retB);

  // 3. Validation : observations minimales
  const expectedObs = windowDays - 1; // n-1 rendements pour n prix
  const observationRatio = n / expectedObs;

  if (n < 5) {
    return {
      r: null,
      quality: {
        status: 'insufficient',
        detail: `Données insuffisantes: ${n} observations`,
        observations: n,
      }
    };
  }

  // 4. Calcul des statistiques descriptives
  const meanX = _mean(x);
  const meanY = _mean(y);
  const stdX  = _std(x, meanX);
  const stdY  = _std(y, meanY);

  // 5. Validation : variance minimale
  if (stdX < MIN_STD_DEV || stdY < MIN_STD_DEV) {
    return {
      r: null,
      quality: {
        status: 'unreliable',
        detail: 'Variance insuffisante — actif illiquide ou prix fixes',
        observations: n,
      }
    };
  }

  // 6. Validation : rendements nuls consécutifs (trous de liquidité)
  const zeroRatioX = x.filter(v => v === 0).length / n;
  const zeroRatioY = y.filter(v => v === 0).length / n;

  // 7. Calcul Pearson
  let cov = 0;
  for (let i = 0; i < n; i++) {
    cov += (x[i] - meanX) * (y[i] - meanY);
  }
  cov /= (n - 1);
  const r = Math.max(-1, Math.min(1, cov / (stdX * stdY)));

  // 8. Assemblage du rapport qualité
  const warnings = [];
  if (observationRatio < MIN_OBSERVATION_RATIO) {
    warnings.push(`${n}/${expectedObs} jours ouvrés`);
  }
  if (zeroRatioX > MAX_ZERO_RETURN_RATIO || zeroRatioY > MAX_ZERO_RETURN_RATIO) {
    warnings.push(`Rendements nuls: ${Math.round(Math.max(zeroRatioX, zeroRatioY) * 100)}%`);
  }

  const status = warnings.length > 0 ? 'warn' : 'ok';
  const detail = warnings.length > 0
    ? `Données partielles — ${warnings.join(', ')}`
    : `${n} observations — qualité satisfaisante`;

  return {
    r,
    quality: { status, detail, observations: n },
  };
}

// ─── Utilitaires statistiques ────────────────────────────────────────────────

/**
 * Calcule les rendements logarithmiques d'une série de prix.
 * Retourne NaN là où le calcul est impossible.
 * @param {number[]} prices
 * @returns {number[]}
 */
function _logReturns(prices) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    const p0 = prices[i - 1];
    const p1 = prices[i];
    if (p0 > 0 && p1 > 0) {
      returns.push(Math.log(p1 / p0));
    } else {
      returns.push(NaN);
    }
  }
  return returns;
}

/**
 * Aligne deux séries en ne gardant que les indices où les deux sont valides.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {{ x: number[], y: number[], n: number }}
 */
function _alignSeries(a, b) {
  const len = Math.min(a.length, b.length);
  const x = [], y = [];
  for (let i = 0; i < len; i++) {
    if (!isNaN(a[i]) && !isNaN(b[i]) && isFinite(a[i]) && isFinite(b[i])) {
      x.push(a[i]);
      y.push(b[i]);
    }
  }
  return { x, y, n: x.length };
}

function _mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function _std(arr, mean) {
  const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _reply(requestId, type, payload) {
  self.postMessage({ requestId, type, payload });
}
