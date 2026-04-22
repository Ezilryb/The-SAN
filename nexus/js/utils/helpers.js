/**
 * js/utils/helpers.js
 * ─────────────────────────────────────────────────────────────────
 * Fonctions utilitaires partagées (risque, badges, formatage).
 * Importées dans app.js et exposées comme méthodes Alpine.
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Retourne la couleur hex correspondant au score de risque.
 * @param {number} r  Score de risque (0–100)
 * @returns {string}  Couleur CSS
 */
export function riskColor(r) {
  if (r == null) return '#6b7e93';
  if (r >= 75)   return '#ff3b57'; // critique
  if (r >= 50)   return '#ffb300'; // élevé
  return '#00c896';                 // faible
}

/**
 * Retourne le libellé textuel du niveau de risque.
 * @param {number} r  Score de risque (0–100)
 * @returns {string}
 */
export function riskLabel(r) {
  if (r == null) return 'INCONNU';
  if (r >= 90)   return 'EXTRÊME';
  if (r >= 75)   return 'CRITIQUE';
  if (r >= 50)   return 'ÉLEVÉ';
  if (r >= 30)   return 'FAIBLE';
  return 'MINIMAL';
}

/**
 * Formate une date ISO en chaîne lisible.
 * @param {string} isoStr  Date ISO 8601
 * @returns {string}
 */
export function formatDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d)) return isoStr;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Tronque un texte à n caractères.
 * @param {string} str
 * @param {number} n
 * @returns {string}
 */
export function truncate(str, n = 20) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}
