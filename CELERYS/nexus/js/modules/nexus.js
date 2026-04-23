/**
 * js/modules/nexus.js
 * ─────────────────────────────────────────────────────────────────
 * Module d'analyse de graphe (Vis.js Network).
 * Dépend du global `vis` (CDN chargé dans index.html).
 * ─────────────────────────────────────────────────────────────────
 */

/* Mapping type d'entité → style de nœud Vis.js */
const NODE_STYLES = {
  PERSON:      { color: '#a78bfa', shape: 'dot',      size: 14 },
  ORG:         { color: '#00e5ff', shape: 'square',   size: 16 },
  LOCATION:    { color: '#00c896', shape: 'diamond',  size: 12 },
  EVENT:       { color: '#ffb300', shape: 'star',     size: 13 },
  TRANSACTION: { color: '#ff3b57', shape: 'triangle', size: 12 },
};

/**
 * Initialise le réseau Vis.js dans le conteneur #nexus-graph.
 * Attache les événements et modifie l'état Alpine via `app`.
 *
 * @param {object} app  Instance Alpine (accès à .entities, .links,
 *                      .selectEntity(), .hoveredNode, etc.)
 * @returns {{ net: vis.Network, nodes: vis.DataSet }}
 */
export function initNexus(app) {
  if (typeof vis === 'undefined') {
    console.warn('[nexus.js] Vis.js non disponible.');
    return null;
  }

  const container = document.getElementById('nexus-graph');
  if (!container) return null;

  /* ── Nœuds ─────────────────────────────────────────────────── */
  const nodes = new vis.DataSet(
    app.entities.map(e => _buildNode(e))
  );

  /* ── Arêtes ─────────────────────────────────────────────────── */
  const edges = new vis.DataSet(
    app.links.map((l, i) => _buildEdge(l, i))
  );

  /* ── Options réseau ─────────────────────────────────────────── */
  const options = {
    physics: {
      barnesHut: {
        gravitationalConstant: -9000,
        centralGravity: .25,
        springLength: 150,
        springConstant: .04,
        damping: .09,
      },
      stabilization: { iterations: 220, fit: true },
    },
    interaction: {
      hover: true,
      tooltipDelay: 80,
      zoomView: true,
      dragView: true,
    },
    layout: { improvedLayout: true },
  };

  const net = new vis.Network(container, { nodes, edges }, options);

  /* ── Événements ─────────────────────────────────────────────── */
  net.on('stabilizationIterationsDone', () => {
    app.nexusLoading = false;
    net.fit({ animation: { duration: 400, easingFunction: 'easeInOutQuad' } });
  });

  net.on('hoverNode', params => {
    const n = nodes.get(params.node);
    if (n?._entity) app.hoveredNode = n._entity;
  });

  net.on('blurNode', () => {
    app.hoveredNode = null;
  });

  net.on('click', params => {
    if (params.nodes.length > 0) {
      const n = nodes.get(params.nodes[0]);
      if (n?._entity) app.selectEntity(n._entity);
    }
  });

  return { net, nodes };
}

/**
 * Ajuste le zoom pour afficher tous les nœuds.
 * @param {vis.Network} net
 */
export function fitNexus(net) {
  if (!net) return;
  net.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
}

/**
 * Restabilise la physique et recentre le graphe.
 * @param {vis.Network} net
 */
export function resetNexus(net) {
  if (!net) return;
  net.stabilize();
  net.fit({ animation: true });
}

/**
 * Met en évidence un nœud spécifique et centre la vue sur lui.
 * @param {vis.Network} net
 * @param {string}      nodeId
 */
export function focusNode(net, nodeId) {
  if (!net || !nodeId) return;
  net.focus(nodeId, { scale: 1.4, animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
  net.selectNodes([nodeId]);
}

/* ── Privés ────────────────────────────────────────────────────── */

function _buildNode(e) {
  const cfg = NODE_STYLES[e.type] || { color: '#6b7e93', shape: 'dot', size: 12 };
  const label = e.name.length > 15 ? e.name.slice(0, 15) + '…' : e.name;
  return {
    id:    e.id,
    label,
    title: `${e.type}: ${e.name}\nRisque: ${e.risk}/100\n${e.subtitle}`,
    color: {
      background: cfg.color + '1a',
      border:     cfg.color,
      highlight:  { background: cfg.color + '33', border: cfg.color },
      hover:      { background: cfg.color + '26', border: cfg.color },
    },
    font:        { color: '#d1d9e6', size: 9, face: '"IBM Plex Mono",monospace' },
    shape:       cfg.shape,
    size:        cfg.size + Math.round(e.risk / 22),
    borderWidth: 1.5,
    borderWidthSelected: 2.5,
    shadow:      { enabled: true, color: cfg.color + '50', size: 8, x: 0, y: 0 },
    _entity:     e,
  };
}

function _buildEdge(l, i) {
  return {
    id:    i,
    from:  l.from,
    to:    l.to,
    label: l.type,
    font:  { color: '#3d556e', size: 7, face: '"IBM Plex Mono",monospace', align: 'middle' },
    color: { color: '#1e3548', highlight: 'rgba(0,229,255,.5)', hover: 'rgba(0,229,255,.3)' },
    width:  Math.max(1, l.strength * 2.2),
    dashes: l.strength < 0.55,
    arrows: { to: { enabled: true, scaleFactor: .4 } },
    smooth: { type: 'curvedCW', roundness: .12 },
  };
}
