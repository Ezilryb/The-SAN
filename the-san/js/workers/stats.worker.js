/**
 * THE SAN — Stats Web Worker
 * Déporte les calculs de corrélation hors du thread principal.
 *
 * Protocole messages (postMessage) :
 *   → { type: 'BUILD_MATRIX', payload: { assets, seriesData, windowDays, assetLabels } }
 *   ← { type: 'MATRIX_PROGRESS', payload: { done, total } }   (intermédiaire)
 *   ← { type: 'MATRIX_DONE',     payload: { matrix } }        (final)
 *   ← { type: 'MATRIX_ERROR',    payload: { error } }         (erreur)
 */

// stats.js expose Stats en global via une IIFE — importScripts l'injecte dans self
importScripts('../stats.js');

// ─── Réception des commandes ──────────────────────────────────────────────────

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === 'BUILD_MATRIX') {
    try {
      buildMatrix(payload);
    } catch (err) {
      self.postMessage({ type: 'MATRIX_ERROR', payload: { error: err.message } });
    }
  }
};

// ─── Construction de la matrice ───────────────────────────────────────────────

function buildMatrix({ assets, seriesData, windowDays, assetLabels }) {
  const n      = assets.length;
  const total  = (n * (n - 1)) / 2;  // paires effectives (symétrie)
  let   done   = 0;
  const matrix = {};

  // Diagonale : autocorrélation = 1
  for (const sym of assets) {
    matrix[sym] = {};
    matrix[sym][sym] = { r: 1, p: 0, n: windowDays, isSelf: true };
  }

  // Triangulaire supérieure + symétrie
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sym1    = assets[i];
      const sym2    = assets[j];
      const series1 = seriesData[sym1];
      const series2 = seriesData[sym2];

      if (!series1 || !series2) {
        const err = { r: null, error: 'No data' };
        matrix[sym1][sym2] = err;
        matrix[sym2][sym1] = err;
      } else {
        const result = Stats.analyze(
          series1,
          series2,
          assetLabels[sym1] || sym1,
          assetLabels[sym2] || sym2,
          windowDays,
        );

        matrix[sym1][sym2] = result;

        // Côté miroir : on échange X ↔ Y
        matrix[sym2][sym1] = {
          ...result,
          label1:   result.label2,
          label2:   result.label1,
          rawX:     result.rawY,
          rawY:     result.rawX,
          retX:     result.retY,
          retY:     result.retX,
          stdDevX:  result.stdDevY,
          stdDevY:  result.stdDevX,
          meanRetX: result.meanRetY,
          meanRetY: result.meanRetX,
          // quality : identique (paire symétrique)
        };
      }

      done++;

      // Progrès toutes les 3 paires ou à la fin (évite de flood le thread principal)
      if (done % 3 === 0 || done === total) {
        self.postMessage({ type: 'MATRIX_PROGRESS', payload: { done, total } });
      }
    }
  }

  self.postMessage({ type: 'MATRIX_DONE', payload: { matrix } });
}
