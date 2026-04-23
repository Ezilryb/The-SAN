/**
 * js/modules/charts.js
 * ─────────────────────────────────────────────────────────────────
 * Initialisation des graphiques Chart.js du tableau de bord.
 * Dépend du global `Chart` (CDN chargé dans index.html).
 * Appelé depuis app.js → init() → $nextTick.
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Configure les défauts globaux Chart.js et initialise
 * les trois graphiques du tableau de bord.
 * @param {object} MOCK  Données simulées (mock.js)
 */
export function initCharts(MOCK) {
  if (typeof Chart === 'undefined') {
    console.warn('[charts.js] Chart.js non disponible.');
    return;
  }

  /* ── Défauts globaux ─────────────────────────────────────────── */
  Chart.defaults.color       = '#6b7e93';
  Chart.defaults.borderColor = '#1a2535';
  Chart.defaults.font.family = '"IBM Plex Mono", monospace';
  Chart.defaults.font.size   = 9;

  const tooltipDefaults = {
    backgroundColor: '#0c1117',
    borderColor:     '#1a2535',
    borderWidth:     1,
    titleFont: { family: '"IBM Plex Mono"', size: 9 },
    bodyFont:  { family: '"IBM Plex Mono"', size: 9 },
    padding:   8,
  };

  /* ── 1. Ingestion 24h (ligne double axes) ───────────────────── */
  _initIngestion(MOCK, tooltipDefaults);

  /* ── 2. Répartition entités (donut) ─────────────────────────── */
  _initEntityDonut(MOCK, tooltipDefaults);

  /* ── 3. Menaces 7 jours (barres empilées) ───────────────────── */
  _initThreatsBar(MOCK, tooltipDefaults);
}

/* ── Privés ────────────────────────────────────────────────────── */

function _initIngestion(MOCK, tooltip) {
  const el = document.getElementById('chart-ingestion');
  if (!el || el._chartInstance) return;
  const instance = new Chart(el, {
    type: 'line',
    data: {
      labels: MOCK.ingestion.labels,
      datasets: [
        {
          label: 'Flux', data: MOCK.ingestion.flux,
          borderColor: '#00e5ff', backgroundColor: 'rgba(0,229,255,.07)',
          borderWidth: 1.5, fill: true, tension: .4,
          pointRadius: 0, pointHoverRadius: 3,
        },
        {
          label: 'Alertes', data: MOCK.ingestion.alerts,
          borderColor: '#ffb300', backgroundColor: 'rgba(255,179,0,.07)',
          borderWidth: 1.5, fill: true, tension: .4,
          pointRadius: 0, pointHoverRadius: 3,
          yAxisID: 'y2',
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip },
      scales: {
        x:  { grid: { color: '#1a2535', lineWidth: .5 }, ticks: { maxRotation: 0, maxTicksLimit: 6 } },
        y:  { grid: { color: '#1a2535', lineWidth: .5 } },
        y2: { position: 'right', grid: { display: false }, ticks: { color: '#ffb300' } },
      },
    },
  });
  el._chartInstance = instance;
}

function _initEntityDonut(MOCK, tooltip) {
  const el = document.getElementById('chart-entities');
  if (!el || el._chartInstance) return;
  const types  = ['PERSON', 'ORG', 'LOCATION', 'EVENT', 'TRANSACTION'];
  const counts = types.map(t => MOCK.entities.filter(e => e.type === t).length);
  const instance = new Chart(el, {
    type: 'doughnut',
    data: {
      labels: ['Personnes', 'Orgs', 'Lieux', 'Événements', 'Transactions'],
      datasets: [{
        data: counts,
        backgroundColor: [
          'rgba(167,139,250,.75)', 'rgba(0,229,255,.75)',
          'rgba(0,200,150,.75)',   'rgba(255,179,0,.75)',  'rgba(255,59,87,.75)',
        ],
        borderColor: '#0c1117', borderWidth: 2, hoverOffset: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 8, padding: 8, font: { size: 9 } } },
        tooltip,
      },
    },
  });
  el._chartInstance = instance;
}

function _initThreatsBar(MOCK, tooltip) {
  const el = document.getElementById('chart-threats');
  if (!el || el._chartInstance) return;
  const instance = new Chart(el, {
    type: 'bar',
    data: {
      labels: MOCK.threats.labels,
      datasets: [
        { label: 'Critique', data: MOCK.threats.critical, backgroundColor: 'rgba(255,59,87,.80)',  borderWidth: 0, borderRadius: 2 },
        { label: 'Élevé',    data: MOCK.threats.high,     backgroundColor: 'rgba(255,179,0,.80)', borderWidth: 0, borderRadius: 2 },
        { label: 'Moyen',    data: MOCK.threats.medium,   backgroundColor: 'rgba(0,229,255,.30)',  borderWidth: 0, borderRadius: 2 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { boxWidth: 8, padding: 8, font: { size: 9 } } }, tooltip },
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, grid: { color: '#1a2535', lineWidth: .5 } },
      },
    },
  });
  el._chartInstance = instance;
}
