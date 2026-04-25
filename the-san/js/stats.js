/**
 * THE SAN — Statistical Engine
 * Pure JS statistical calculations for correlation analysis
 *
 * v2.2 — Ajout de la validation qualité des données :
 *   • validateSeries() : 3 contrôles (variance, doublons, ratio observations)
 *   • analyze()        : intègre le rapport de qualité dans le résultat
 *   • QUALITY_FLAGS    : constantes exportées pour le rendu dans app.js
 */

const Stats = (() => {

  // ─── Seuils de qualité ────────────────────────────────────────────────────

  const QUALITY = {
    MIN_STD_DEV:        0.001,  // Volatilité minimale des rendements (< = série suspecte)
    MAX_ZERO_RETURN_PCT: 0.20,  // Max 20% de rendements exactement nuls tolérés
    MIN_COVERAGE_PCT:    0.60,  // Min 60% des jours ouvrés attendus dans la fenêtre
  };

  // Flags retournés par validateSeries — exportés pour le rendu
  const QUALITY_FLAGS = {
    OK:              'ok',
    LOW_VARIANCE:    'low_variance',   // Actif peu liquide ou série plate
    MANY_GAPS:       'many_gaps',      // Trop de rendements nuls consécutifs
    LOW_COVERAGE:    'low_coverage',   // Moins de 60% des jours attendus présents
  };

  // ─── Validation qualité d'une série ──────────────────────────────────────

  /**
   * Valide la qualité d'une série de prix avant calcul de corrélation.
   *
   * @param {number[]} prices      — Tableau de prix (non-returns)
   * @param {number}   windowDays  — Fenêtre attendue en jours calendaires
   * @returns {{ flag: string, detail: string, score: number }}
   *   flag   : QUALITY_FLAGS.*
   *   detail : Message lisible pour le tooltip
   *   score  : 0.0 (mauvais) → 1.0 (parfait)
   */
  function validateSeries(prices, windowDays = 21) {
    if (!prices || prices.length < 2) {
      return {
        flag:   QUALITY_FLAGS.LOW_COVERAGE,
        detail: 'Données insuffisantes',
        score:  0,
      };
    }

    const returns = toReturns(prices);
    const n       = returns.length;

    // ── 1. Ratio de couverture ────────────────────────────────────────────
    // Jours ouvrés attendus ≈ windowDays × (5/7)
    const expectedTradingDays = Math.round(windowDays * (5 / 7));
    const coverageRatio       = n / expectedTradingDays;

    if (coverageRatio < QUALITY.MIN_COVERAGE_PCT) {
      return {
        flag:   QUALITY_FLAGS.LOW_COVERAGE,
        detail: `Couverture insuffisante : ${n}/${expectedTradingDays} jours ouvrés (${Math.round(coverageRatio * 100)}%)`,
        score:  coverageRatio,
      };
    }

    // ── 2. Test de variance minimale ──────────────────────────────────────
    const sd = stdDev(returns);

    if (sd < QUALITY.MIN_STD_DEV) {
      return {
        flag:   QUALITY_FLAGS.LOW_VARIANCE,
        detail: `Volatilité anormalement faible : σ = ${(sd * 100).toFixed(4)}% (série suspecte ou halte de cotation)`,
        score:  sd / QUALITY.MIN_STD_DEV,
      };
    }

    // ── 3. Détection de rendements nuls consécutifs (trous de liquidité) ─
    const zeroCount    = returns.filter(r => r === 0).length;
    const zeroRatio    = zeroCount / n;

    if (zeroRatio > QUALITY.MAX_ZERO_RETURN_PCT) {
      return {
        flag:   QUALITY_FLAGS.MANY_GAPS,
        detail: `Liquidité faible : ${zeroCount}/${n} rendements nuls (${Math.round(zeroRatio * 100)}%)`,
        score:  1 - zeroRatio,
      };
    }

    // ── Tout OK ───────────────────────────────────────────────────────────
    // Score composite : pondère couverture (50%), volatilité (30%), liquidité (20%)
    const volatilityScore = Math.min(1, sd / 0.02); // normalisé sur 2% de vol
    const liquidityScore  = 1 - zeroRatio;
    const compositeScore  = coverageRatio * 0.5 + volatilityScore * 0.3 + liquidityScore * 0.2;

    return {
      flag:   QUALITY_FLAGS.OK,
      detail: `Qualité correcte — ${n} observations, σ = ${(sd * 100).toFixed(2)}%`,
      score:  Math.min(1, compositeScore),
    };
  }

  /**
   * Valide une paire de séries et retourne le rapport de qualité combiné.
   * La qualité de la paire = min(qualité X, qualité Y).
   */
  function validatePair(pricesX, pricesY, windowDays) {
    const qx = validateSeries(pricesX, windowDays);
    const qy = validateSeries(pricesY, windowDays);

    // La paire hérite du flag le plus problématique
    const worst = qx.score <= qy.score ? qx : qy;

    return {
      flagX:        qx.flag,
      flagY:        qy.flag,
      flag:         worst.flag,
      detailX:      qx.detail,
      detailY:      qy.detail,
      score:        Math.min(qx.score, qy.score),
      isReliable:   worst.flag === QUALITY_FLAGS.OK,
    };
  }

  // ─── Pearson Correlation Coefficient ─────────────────────────────────────
  // r = Σ[(xi - x̄)(yi - ȳ)] / [√Σ(xi-x̄)² × √Σ(yi-ȳ)²]

  function pearson(x, y) {
    if (!x || !y || x.length !== y.length || x.length < 2) return null;

    const n = x.length;
    const meanX = mean(x);
    const meanY = mean(y);

    let num = 0, denomX = 0, denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num    += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    if (denom === 0) return 0;

    return Math.max(-1, Math.min(1, num / denom));
  }

  function mean(arr) {
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  function stdDev(arr) {
    const m = mean(arr);
    const variance = arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  function toReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] !== 0) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
    }
    return returns;
  }

  // ─── Tests de significativité ─────────────────────────────────────────────

  function tStatistic(r, n) {
    if (n <= 2 || Math.abs(r) >= 1) return null;
    return r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);
  }

  function pValue(r, n) {
    const t = tStatistic(r, n);
    if (t === null) return null;
    const z = Math.abs(t);
    return 2 * (1 - normalCDF(z));
  }

  function normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * z);
    const poly = t * (0.319381530
      + t * (-0.356563782
      + t * (1.781477937
      + t * (-1.821255978
      + t * 1.330274429))));
    return 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z) * poly;
  }

  // ─── Labels ───────────────────────────────────────────────────────────────

  function significanceLabel(p) {
    if (p === null) return '—';
    if (p < 0.001) return '***';
    if (p < 0.01)  return '**';
    if (p < 0.05)  return '*';
    return 'ns';
  }

  function strengthLabel(r) {
    if (r === null) return 'N/A';
    const abs = Math.abs(r);
    if (abs >= 0.9) return 'Very Strong';
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Negligible';
  }

  // ─── Couleurs ─────────────────────────────────────────────────────────────

  function correlationColor(r, qualityFlag = QUALITY_FLAGS.OK) {
    if (r === null) return 'rgba(255,255,255,0.05)';

    // Atténuer les couleurs pour les données suspectes
    const alpha = qualityFlag === QUALITY_FLAGS.OK ? 1 : 0.45;

    if (r > 0) {
      const intensity = Math.pow(r, 0.7);
      return `rgba(0, 212, 255, ${(0.15 + intensity * 0.75) * alpha})`;
    } else {
      const intensity = Math.pow(Math.abs(r), 0.7);
      return `rgba(255, 107, 53, ${(0.15 + intensity * 0.75) * alpha})`;
    }
  }

  function correlationTextColor(r) {
    if (r === null) return 'rgba(255,255,255,0.3)';
    const abs = Math.abs(r);
    if (abs > 0.5) return '#ffffff';
    return 'rgba(255,255,255,0.85)';
  }

  // ─── Alignement ───────────────────────────────────────────────────────────

  function alignSeries(series1, series2) {
    const dates1 = new Set(Object.keys(series1));
    const dates2 = new Set(Object.keys(series2));
    const common = [...dates1].filter(d => dates2.has(d)).sort();

    if (common.length < 5) return null;

    const x = common.map(d => series1[d]);
    const y = common.map(d => series2[d]);

    return { x, y, dates: common, n: common.length };
  }

  // ─── Analyse complète ─────────────────────────────────────────────────────

  /**
   * Analyse de corrélation complète entre deux séries de prix.
   * Intègre désormais le rapport de qualité dans le résultat.
   *
   * @param {Object} series1  — { date: price }
   * @param {Object} series2  — { date: price }
   * @param {string} label1
   * @param {string} label2
   * @param {number} windowDays — pour le calcul du ratio de couverture
   */
  function analyze(series1, series2, label1, label2, windowDays = 21) {
    const aligned = alignSeries(series1, series2);
    if (!aligned) return { error: 'Insufficient overlapping data', r: null };

    const { x, y, dates, n } = aligned;

    const ret1 = toReturns(x);
    const ret2 = toReturns(y);

    const r   = pearson(ret1, ret2);
    const p   = pValue(r, ret1.length);

    // ── Validation qualité ────────────────────────────────────────────────
    const quality = validatePair(x, y, windowDays);

    return {
      r,
      p,
      n: ret1.length,
      dates,
      rawX: x,
      rawY: y,
      retX: ret1,
      retY: ret2,
      label1,
      label2,
      strength:     strengthLabel(r),
      significance: significanceLabel(p),
      color:        correlationColor(r, quality.flag),
      textColor:    correlationTextColor(r),
      stdDevX:      stdDev(ret1),
      stdDevY:      stdDev(ret2),
      meanRetX:     mean(ret1),
      meanRetY:     mean(ret2),

      // Rapport qualité — nouveau
      quality,
    };
  }

  return {
    QUALITY,
    QUALITY_FLAGS,
    validateSeries,
    validatePair,
    pearson,
    mean,
    stdDev,
    toReturns,
    tStatistic,
    pValue,
    significanceLabel,
    strengthLabel,
    correlationColor,
    correlationTextColor,
    alignSeries,
    analyze,
  };
})();
