/**
 * js/app.js
 * ─────────────────────────────────────────────────────────────────
 * Composant principal Alpine.js (palantirApp).
 * Importe les modules de données, de visualisation et les helpers.
 * Enregistre `window.palantirApp` pour l'attribut x-data HTML.
 * ─────────────────────────────────────────────────────────────────
 */

import { MOCK }                       from './data/mock.js';
import { riskColor, riskLabel }       from './utils/helpers.js';
import { initCharts }                 from './modules/charts.js';
import { initNexus, fitNexus, resetNexus, focusNode } from './modules/nexus.js';
import { initMap, renderMarkers }     from './modules/map.js';

/* ────────────────────────────────────────────────────────────────
   Composant Alpine — exposé globalement pour x-data="palantirApp()"
   ──────────────────────────────────────────────────────────────── */
window.palantirApp = function () {
  return {

    /* ── État de navigation ───────────────────────────────────── */
    currentView:    'dashboard',
    sidebarOpen:    true,

    /* ── Recherche & filtres ──────────────────────────────────── */
    searchQuery:    '',
    entityFilter:   'ALL',
    listView:       false,

    /* ── Sélection & survol ───────────────────────────────────── */
    selectedEntity: null,
    hoveredNode:    null,

    /* ── Indicateurs de chargement ────────────────────────────── */
    nexusLoading:   false,
    mapLoading:     false,

    /* ── Horloge UTC ──────────────────────────────────────────── */
    currentTime:    '',

    /* ── Données (issues de mock.js) ─────────────────────────── */
    entities:       MOCK.entities,
    links:          MOCK.links,
    alerts:         MOCK.alerts,

    /* ── Instances librairies (privées) ──────────────────────── */
    _nexusNet:      null,
    _nexusNodes:    null,
    _nexusInited:   false,
    _mapInst:       null,
    _mapMarkers:    [],
    _mapInited:     false,

    /* ── Configuration de navigation ─────────────────────────── */
    navItems: [
      {
        id: 'dashboard', label: 'Tableau de Bord',
        badge: '2', badgeClass: 'bg-red-900/40 text-red-400 border border-red-700/40',
        icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                 <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                 <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
               </svg>`,
      },
      {
        id: 'explorer', label: 'Object Explorer', badge: null, badgeClass: '',
        icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                 <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
               </svg>`,
      },
      {
        id: 'nexus', label: 'NEXUS · Graphe', badge: null, badgeClass: '',
        icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                 <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                 <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                 <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
               </svg>`,
      },
      {
        id: 'map', label: 'Géospatial', badge: null, badgeClass: '',
        icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                 <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                 <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
               </svg>`,
      },
    ],

    /* ── Filtres types d'entité ───────────────────────────────── */
    typeFilters: [
      { id: 'ALL',         label: 'TOUS',           graphColor: '#6b7e93',
        activeClass: 'border-gray-500 text-gray-300 bg-gray-700/20' },
      { id: 'PERSON',      label: 'PERSONNES',       graphColor: '#a78bfa',
        activeClass: 'border-purple-400/40 text-purple-400 bg-purple-900/20' },
      { id: 'ORG',         label: 'ORGANISATIONS',   graphColor: '#00e5ff',
        activeClass: 'border-cyan-400/40 text-cyan-300 bg-cyan-900/15' },
      { id: 'LOCATION',    label: 'LIEUX',           graphColor: '#00c896',
        activeClass: 'border-emerald-400/40 text-emerald-400 bg-emerald-900/15' },
      { id: 'EVENT',       label: 'ÉVÉNEMENTS',      graphColor: '#ffb300',
        activeClass: 'border-amber-400/40 text-amber-400 bg-amber-900/15' },
      { id: 'TRANSACTION', label: 'TRANSACTIONS',    graphColor: '#ff3b57',
        activeClass: 'border-red-400/40 text-red-400 bg-red-900/15' },
    ],

    /* ── Couches de la carte ──────────────────────────────────── */
    mapLayers: [
      { id: 'PERSON',   label: 'Personnes',   on: true },
      { id: 'ORG',      label: 'Orgs',        on: true },
      { id: 'LOCATION', label: 'Lieux',       on: true },
      { id: 'EVENT',    label: 'Événements',  on: true },
    ],

    /* ── KPIs tableau de bord ─────────────────────────────────── */
    kpis: [
      {
        id: 'alerts', label: 'Alertes Actives', value: 23, change: '+4',
        chgClass: 'text-red-400', valClass: 'text-red-400',
        barPct: 76, barClass: 'bg-red-500', glow: 'glow-threat',
        bgIcon: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ff3b57" stroke-width="1">
                   <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                   <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                 </svg>`,
      },
      {
        id: 'streams', label: 'Flux de Données', value: '847', change: '+12',
        chgClass: 'text-emerald-400', valClass: 'text-gray-100',
        barPct: 64, barClass: 'bg-emerald-500', glow: '',
        bgIcon: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00c896" stroke-width="1">
                   <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                 </svg>`,
      },
      {
        id: 'entities', label: 'Entités Suivies', value: '4 291', change: '+7',
        chgClass: 'text-cyan-400', valClass: 'text-gray-100',
        barPct: 85, barClass: 'bg-cyan-400', glow: '',
        bgIcon: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" stroke-width="1">
                   <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                   <circle cx="9" cy="7" r="4"/>
                   <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                 </svg>`,
      },
      {
        id: 'threats', label: 'Menaces Critiques', value: 7, change: '+2',
        chgClass: 'text-amber-400', valClass: 'text-amber-400',
        barPct: 35, barClass: 'bg-amber-400', glow: '',
        bgIcon: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ffb300" stroke-width="1">
                   <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                 </svg>`,
      },
    ],

    /* ════════════════════════════════════════════════════════════
       PROPRIÉTÉS CALCULÉES
       ════════════════════════════════════════════════════════════ */

    get filteredEntities() {
      const q = this.searchQuery.toLowerCase().trim();
      return this.entities.filter(e => {
        const matchQ = !q
          || e.name.toLowerCase().includes(q)
          || e.subtitle.toLowerCase().includes(q)
          || e.id.toLowerCase().includes(q);
        const matchF = this.entityFilter === 'ALL' || e.type === this.entityFilter;
        return matchQ && matchF;
      });
    },

    get geoEntities() {
      return this.entities.filter(e => e.lat !== null);
    },

    get criticalCount() {
      return this.alerts.filter(a => a.severity === 'critical').length;
    },

    /* ════════════════════════════════════════════════════════════
       INITIALISATION
       ════════════════════════════════════════════════════════════ */

    init() {
      this.updateTime();
      setInterval(() => this.updateTime(), 1000);

      /* Charts dès que le DOM est prêt */
      this.$nextTick(() => initCharts(MOCK));

      /* Initialiser Nexus / Map à la première navigation */
      this.$watch('currentView', view => {
        if (view === 'nexus' && !this._nexusInited) {
          this.nexusLoading = true;
          this.$nextTick(() => setTimeout(() => this._bootNexus(), 80));
        }
        if (view === 'map' && !this._mapInited) {
          this.mapLoading = true;
          this.$nextTick(() => setTimeout(() => this._bootMap(), 80));
        }
      });
    },

    updateTime() {
      const n   = new Date();
      const pad = v => String(v).padStart(2, '0');
      this.currentTime =
        `${n.getUTCFullYear()}-${pad(n.getUTCMonth() + 1)}-${pad(n.getUTCDate())} ` +
        `${pad(n.getUTCHours())}:${pad(n.getUTCMinutes())}:${pad(n.getUTCSeconds())} UTC`;
    },

    /* ── Démarrage modules ────────────────────────────────────── */

    _bootNexus() {
      const result = initNexus(this);
      if (result) {
        this._nexusNet    = result.net;
        this._nexusNodes  = result.nodes;
        this._nexusInited = true;
      } else {
        this.nexusLoading = false;
      }
    },

    _bootMap() {
      this._mapInst   = initMap(this);
      this._mapInited = true;
      this.mapLoading = false;
    },

    /* ════════════════════════════════════════════════════════════
       ACTIONS — NEXUS
       ════════════════════════════════════════════════════════════ */

    fitNexus()   { fitNexus(this._nexusNet); },
    resetNexus() { resetNexus(this._nexusNet); },

    viewInNexus() {
      this.currentView = 'nexus';
      if (this._nexusNet && this.selectedEntity) {
        const id = this.selectedEntity.id;
        setTimeout(() => focusNode(this._nexusNet, id), 350);
      }
    },

    /* ════════════════════════════════════════════════════════════
       ACTIONS — CARTE
       ════════════════════════════════════════════════════════════ */

    viewOnMap() {
      this.currentView = 'map';
      if (this._mapInst && this.selectedEntity?.lat) {
        const { lat, lng } = this.selectedEntity;
        setTimeout(() => {
          this._mapInst.setView([lat, lng], 8, { animate: true });
        }, 350);
      }
    },

    toggleLayer(id) {
      this.mapLayers = this.mapLayers.map(l => l.id === id ? { ...l, on: !l.on } : l);
      renderMarkers(this, this._mapInst);
    },

    /* ════════════════════════════════════════════════════════════
       SÉLECTION D'ENTITÉ
       ════════════════════════════════════════════════════════════ */

    selectEntity(entity)  { this.selectedEntity = entity; },

    selectEntityById(id) {
      const e = this.entities.find(e => e.id === id);
      if (e) this.selectEntity(e);
    },

    /* ════════════════════════════════════════════════════════════
       NAVIGATION
       ════════════════════════════════════════════════════════════ */

    setView(id) { this.currentView = id; },

    onSearch() {
      if (this.currentView !== 'explorer') this.currentView = 'explorer';
    },

    /* ════════════════════════════════════════════════════════════
       HELPERS (exposés aux templates HTML via méthodes Alpine)
       ════════════════════════════════════════════════════════════ */

    riskColor(r)  { return riskColor(r); },
    riskLabel(r)  { return riskLabel(r); },

    getCount(filterId) {
      if (filterId === 'ALL') return this.entities.length;
      return this.entities.filter(e => e.type === filterId).length;
    },

    entityProps() {
      if (!this.selectedEntity?.props) return [];
      return Object.entries(this.selectedEntity.props)
        .map(([key, value]) => ({ key, value }));
    },

    relatedEntities() {
      if (!this.selectedEntity) return [];
      const id  = this.selectedEntity.id;
      const res = [];
      this.links.forEach(l => {
        if (l.from === id) {
          const t = this.entities.find(e => e.id === l.to);
          if (t) res.push({ ...t, linkType: l.type });
        }
        if (l.to === id) {
          const s = this.entities.find(e => e.id === l.from);
          if (s) res.push({ ...s, linkType: '← ' + l.type });
        }
      });
      return res.slice(0, 8);
    },

  }; /* fin return */
};
