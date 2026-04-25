/**
 * THE SAN — Statistical Engine
 * Pure JS statistical calculations for correlation analysis
 */

const Stats = (() => {

  /**
   * Pearson Correlation Coefficient
   * r = Σ[(xi - x̄)(yi - ȳ)] / [√Σ(xi-x̄)² × √Σ(yi-ȳ)²]
   */
  function pearson(x, y) {
    if (!x || !y || x.length !== y.length || x.length < 2) return null;

    const n = x.length;
    const meanX = mean(x);
    const meanY = mean(y);

    let num = 0, denomX = 0, denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denom = Math.sqrt(denomX * denomY);
    if (denom === 0) return 0;

    return Math.max(-1, Math.min(1, num / denom));
  }

  /**
   * Arithmetic mean
   */
  function mean(arr) {
    return arr.reduce((s, v) => s + v, 0) / arr.length;
  }

  /**
   * Standard deviation
   */
  function stdDev(arr) {
    const m = mean(arr);
    const variance = arr.reduce((s, v) => s + Math.pow(v - m, 2), 0) / arr.length;
    return Math.sqrt(variance);
  }

  /**
   * Convert price series to daily returns (percentage)
   */
  function toReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i - 1] !== 0) {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
    }
    return returns;
  }

  /**
   * t-statistic approximation for p-value
   * t = r * sqrt(n-2) / sqrt(1 - r²)
   */
  function tStatistic(r, n) {
    if (n <= 2 || Math.abs(r) >= 1) return null;
    return r * Math.sqrt(n - 2) / Math.sqrt(1 - r * r);
  }

  /**
   * Rough p-value estimate (two-tailed, approximation)
   * Uses normal distribution approximation for large n
   */
  function pValue(r, n) {
    const t = tStatistic(r, n);
    if (t === null) return null;
    // Normal approximation (valid for n > 30)
    const z = Math.abs(t);
    return 2 * (1 - normalCDF(z));
  }

  /**
   * Normal CDF approximation (Abramowitz & Stegun)
   */
  function normalCDF(z) {
    const t = 1 / (1 + 0.2316419 * z);
    const poly = t * (0.319381530
      + t * (-0.356563782
      + t * (1.781477937
      + t * (-1.821255978
      + t * 1.330274429))));
    return 1 - (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z) * poly;
  }

  /**
   * Significance label
   */
  function significanceLabel(p) {
    if (p === null) return '—';
    if (p < 0.001) return '***';
    if (p < 0.01) return '**';
    if (p < 0.05) return '*';
    return 'ns';
  }

  /**
   * Correlation strength label
   */
  function strengthLabel(r) {
    if (r === null) return 'N/A';
    const abs = Math.abs(r);
    if (abs >= 0.9) return 'Very Strong';
    if (abs >= 0.7) return 'Strong';
    if (abs >= 0.5) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Negligible';
  }

  /**
   * Color for correlation value (-1 to 1)
   * Returns CSS color string
   */
  function correlationColor(r) {
    if (r === null) return 'rgba(255,255,255,0.05)';
    // -1 → red, 0 → neutral, +1 → cyan
    if (r > 0) {
      const intensity = Math.pow(r, 0.7);
      return `rgba(0, 212, 255, ${0.15 + intensity * 0.75})`;
    } else {
      const intensity = Math.pow(Math.abs(r), 0.7);
      return `rgba(255, 107, 53, ${0.15 + intensity * 0.75})`;
    }
  }

  /**
   * Text color based on correlation value
   */
  function correlationTextColor(r) {
    if (r === null) return 'rgba(255,255,255,0.3)';
    const abs = Math.abs(r);
    if (abs > 0.5) return '#ffffff';
    return 'rgba(255,255,255,0.85)';
  }

  /**
   * Align two time series by date, return paired arrays
   */
  function alignSeries(series1, series2) {
    const dates1 = new Set(Object.keys(series1));
    const dates2 = new Set(Object.keys(series2));
    const common = [...dates1].filter(d => dates2.has(d)).sort();

    if (common.length < 5) return null;

    const x = common.map(d => series1[d]);
    const y = common.map(d => series2[d]);

    return { x, y, dates: common, n: common.length };
  }

  /**
   * Full correlation analysis between two price series
   */
  function analyze(series1, series2, label1, label2) {
    const aligned = alignSeries(series1, series2);
    if (!aligned) return { error: 'Insufficient overlapping data', r: null };

    const { x, y, dates, n } = aligned;

    // Use returns for correlation (more meaningful for finance)
    const ret1 = toReturns(x);
    const ret2 = toReturns(y);

    const r = pearson(ret1, ret2);
    const p = pValue(r, ret1.length);

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
      strength: strengthLabel(r),
      significance: significanceLabel(p),
      color: correlationColor(r),
      textColor: correlationTextColor(r),
      stdDevX: stdDev(ret1),
      stdDevY: stdDev(ret2),
      meanRetX: mean(ret1),
      meanRetY: mean(ret2),
    };
  }

  return {
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
