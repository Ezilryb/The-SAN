/**
 * js/modules/map.js
 * ─────────────────────────────────────────────────────────────────
 * Module de carte géospatiale (Leaflet.js).
 * Dépend du global `L` (CDN + CSS chargés dans index.html).
 * ─────────────────────────────────────────────────────────────────
 */

/* Couleurs par type d'entité (cohérent avec nexus.js + main.css) */
const TYPE_COLORS = {
  PERSON:   '#a78bfa',
  ORG:      '#00e5ff',
  LOCATION: '#00c896',
  EVENT:    '#ffb300',
};

/**
 * Initialise la carte Leaflet dans #leaflet-map.
 * @param {object} app  Instance Alpine
 * @returns {L.Map}     Instance de la carte
 */
export function initMap(app) {
  if (typeof L === 'undefined') {
    console.warn('[map.js] Leaflet non disponible.');
    return null;
  }

  const container = document.getElementById('leaflet-map');
  if (!container) return null;

  const map = L.map('leaflet-map', {
    center: [30, 10],
    zoom:   3,
    zoomControl: true,
    attributionControl: true,
  });

  /* Tuiles CartoDB Dark — pas de clé API requise */
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/" target="_blank" rel="noopener">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);

  app._mapLoading = false;
  renderMarkers(app, map);
  return map;
}

/**
 * (Re)dessine tous les marqueurs en fonction des couches actives.
 * @param {object}  app  Instance Alpine
 * @param {L.Map}   map  Instance Leaflet (optionnel si app._mapInst existe)
 */
export function renderMarkers(app, map) {
  const m = map || app._mapInst;
  if (!m) return;

  /* Supprimer les anciens marqueurs */
  if (app._mapMarkers?.length) {
    app._mapMarkers.forEach(mk => mk.remove());
    app._mapMarkers = [];
  }

  const entities = app.entities.filter(e => e.lat !== null);

  entities.forEach(e => {
    /* Vérifier si la couche de ce type est active */
    const layer = app.mapLayers.find(l => l.id === e.type);
    if (!layer?.on) return;

    const color = TYPE_COLORS[e.type] || '#6b7e93';
    const icon  = _buildIcon(color);

    const marker = L.marker([e.lat, e.lng], { icon, title: e.name })
      .addTo(m)
      .bindPopup(_buildPopup(e, color), { maxWidth: 260 });

    marker.on('click', () => app.selectEntity(e));
    app._mapMarkers.push(marker);
  });
}

/* ── Privés ────────────────────────────────────────────────────── */

function _buildIcon(color) {
  return L.divIcon({
    html: `<div style="
      width:10px; height:10px; border-radius:50%;
      background:${color}; border:1.5px solid ${color}80;
      box-shadow:0 0 7px ${color}80;
    "></div>`,
    iconSize:   [10, 10],
    iconAnchor: [5, 5],
    className:  '',
  });
}

function _buildPopup(e, color) {
  return `
    <div style="min-width:160px; font-family:'IBM Plex Mono',monospace;">
      <div style="color:#6b7e93; font-size:8px; margin-bottom:3px; letter-spacing:.1em;">
        ${e.type} · ${e.id}
      </div>
      <div style="font-weight:600; font-size:12px; margin-bottom:2px; color:#e4ecf4;">
        ${e.name}
      </div>
      <div style="color:#6b7e93; font-size:9px;">
        ${e.subtitle}
      </div>
      <div style="margin-top:6px; color:${color}; font-size:10px; font-weight:600;">
        RISQUE: ${e.risk}/100 · ${e.status}
      </div>
    </div>`;
}
