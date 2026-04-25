/**
 * THE SAN — Correlation Map Engine
 * Main application logic for the interactive heatmap
 *
 * v2.3 — Migration des calculs Pearson vers un Web Worker :
 *   • buildMatrixAsync()  : envoie les données au worker, reçoit la matrice
 *   • workerInstance()    : singleton du worker avec re-création sur erreur
 *   • compute()           : affiche la progression paire par paire (MATRIX_PROGRESS)
 *   • Fallback gracieux   : si les Workers ne sont pas disponibles (file://),
 *     on retombe sur buildMatrixSync() sans bloquer l'UI
 */

const App = (() => {

  // ─── State ────────────────────────────────────────────────────────────────

  let state = {
    mode: 'demo',
    selectedAssets: [],
    seriesData: {},
    correlationMatrix: {},
    isLoading: false,
    activeCell: null,
    sortBy: 'default',
    window: 21,
    lastUpdated: null,
  };

  const DEFAULT_ASSETS = ['LIT', 'TSLA', 'NVDA', 'GLD', 'URA', 'ENPH', 'CPER', 'QQQ'];

  // ─── Web Worker — singleton avec fallback ─────────────────────────────────

  let _worker     = null;
  let _workerFail = false;  // true si Workers indisponibles (file://, old browser…)

  /**
   * Retourne l'instance du worker (la crée si besoin).
   * En cas d'erreur de création, bascule sur le mode synchrone.
   */
  function workerInstance() {
    if (_workerFail) return null;
    if (_worker)     return _worker;

    try {
      _worker = new Worker('./js/workers/stats.worker.js');

      // Erreur non-récupérable (script introuvable, CSP, …)
      _worker.onerror = (err) => {
        console.warn('[Worker] Erreur critique — fallback synchrone activé :', err.message);
        _worker      = null;
        _workerFail  = true;
      };
    } catch (e) {
      console.warn('[Worker] Impossible de créer le worker — fallback synchrone :', e.message);
      _workerFail = true;
      return null;
    }

    return _worker;
  }

  /**
   * Construit la matrice via le Web Worker.
   * Retourne une Promise résolue avec la matrice ou rejetée en cas d'erreur.
   *
   * @param {string[]} assets
   * @param {Object}   seriesData
   * @returns {Promise<Object>}
   */
  function buildMatrixAsync(assets, seriesData) {
    return new Promise((resolve, reject) => {
      const worker = workerInstance();

      // ── Fallback synchrone si pas de worker ─────────────────────────────
      if (!worker) {
        try {
          resolve(buildMatrixSync(assets, seriesData));
        } catch (e) {
          reject(e);
        }
        return;
      }

      // ── Labels à passer au worker (pas d'accès à API.ASSETS dans le worker) ──
      const assetLabels = {};
      for (const sym of assets) {
        assetLabels[sym] = API.ASSETS[sym]?.label || sym;
      }

      // ── Handler de messages du worker ────────────────────────────────────
      function onMessage(e) {
        const { type, payload } = e.data;

        if (type === 'MATRIX_PROGRESS') {
          // Mise à jour de la barre de progression pendant le calcul
          const pct = Math.round((payload.done / payload.total) * 100);
          updateLoadingProgress(payload.done, payload.total, `Calcul des corrélations… ${pct}%`);
          return;
        }

        // Résultat final ou erreur → on retire le listener dans tous les cas
        worker.removeEventListener('message', onMessage);

        if (type === 'MATRIX_DONE') {
          resolve(payload.matrix);
        } else if (type === 'MATRIX_ERROR') {
          reject(new Error(payload.error));
        }
      }

      worker.addEventListener('message', onMessage);

      // ── Envoi de la tâche au worker ──────────────────────────────────────
      worker.postMessage({
        type: 'BUILD_MATRIX',
        payload: {
          assets,
          seriesData,
          windowDays: state.window,
          assetLabels,
        },
      });
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    buildAssetSelector();
    setupEventListeners();
    injectQualityStyles();
    loadState();
    renderModeToggle();

    if (state.selectedAssets.length === 0) {
      state.selectedAssets = [...DEFAULT_ASSETS];
    }
    syncAssetCheckboxes();
    compute();
  }

  function loadState() {
    try {
      const saved = localStorage.getItem('san_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        state.selectedAssets = parsed.selectedAssets || DEFAULT_ASSETS;
        state.mode  = parsed.mode   || 'demo';
        state.window  = parsed.window  || 21;
        state.sortBy  = parsed.sortBy  || 'default';
      }
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    try {
      localStorage.setItem('san_state', JSON.stringify({
        selectedAssets: state.selectedAssets,
        mode: state.mode,
        window: state.window,
        sortBy: state.sortBy,
      }));
    } catch (e) { /* ignore */ }
  }

  // ─── Styles qualité injectés dynamiquement ────────────────────────────────

  function injectQualityStyles() {
    if (document.getElementById('san-quality-styles')) return;

    const style = document.createElement('style');
    style.id = 'san-quality-styles';
    style.textContent = `
      .data-cell.quality-low-variance {
        background-image: repeating-linear-gradient(
          45deg,
          rgba(255,180,0,0.08) 0px,
          rgba(255,180,0,0.08) 2px,
          transparent 2px,
          transparent 8px
        ) !important;
        border-color: rgba(255,180,0,0.25) !important;
      }
      .data-cell.quality-many-gaps {
        background-image: radial-gradient(
          circle,
          rgba(255,107,53,0.18) 1px,
          transparent 1px
        ) !important;
        background-size: 6px 6px !important;
        border-color: rgba(255,107,53,0.22) !important;
      }
      .data-cell.quality-low-coverage {
        background-image:
          linear-gradient(rgba(120,120,180,0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(120,120,180,0.12) 1px, transparent 1px) !important;
        background-size: 6px 6px !important;
        border-color: rgba(120,120,180,0.28) !important;
      }
      .quality-badge {
        display: inline-flex; align-items: center; gap: 5px;
        padding: 3px 9px; border-radius: 10px;
        font-size: 9px; font-weight: 700; letter-spacing: .07em;
        text-transform: uppercase; font-family: var(--fd);
      }
      .quality-badge.ok   { background: var(--posd); color: var(--pos); border: 1px solid rgba(29,219,126,.2); }
      .quality-badge.warn { background: rgba(255,180,0,.09); color: #FFB400; border: 1px solid rgba(255,180,0,.22); }
      .quality-badge.bad  { background: var(--negd); color: var(--neg); border: 1px solid rgba(255,61,88,.22); }
      .data-cell[data-quality]:not([data-quality="ok"])::after {
        content: '⚠'; position: absolute; top: 2px; right: 3px;
        font-size: 7px; opacity: 0.55; pointer-events: none;
      }
      .data-cell { position: relative; }
      .quality-score-track {
        flex: 1; height: 4px; background: var(--bg2);
        border-radius: 2px; overflow: hidden; border: 1px solid var(--b0);
      }
      .quality-score-fill { height: 100%; border-radius: 2px; transition: width .9s var(--ease); }
      .quality-panel {
        background: var(--bg2); border: 1px solid var(--b0);
        border-radius: var(--r1); padding: 10px 12px;
        display: flex; flex-direction: column; gap: 8px;
      }
      .quality-panel-title {
        font-size: 8px; font-weight: 700; letter-spacing: .1em;
        text-transform: uppercase; color: var(--t2);
      }
      .quality-row { display: flex; align-items: center; gap: 8px; font-size: 9px; }
      .quality-sym-label { font-family: var(--fd); font-weight: 700; color: var(--t1); width: 40px; flex-shrink: 0; }
      .quality-detail-text { color: var(--t2); font-size: 9px; line-height: 1.5; flex: 1; }

      /* Indicateur worker dans la barre de statut */
      .worker-badge {
        display: inline-flex; align-items: center; gap: 5px;
        font-size: 8px; color: var(--t2); letter-spacing: .04em;
      }
      .worker-dot {
        width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
      }
      .worker-dot.active   { background: var(--pos); box-shadow: 0 0 6px var(--pos); }
      .worker-dot.fallback { background: #FFB400; }
      .worker-dot.error    { background: var(--neg); }
    `;
    document.head.appendChild(style);
  }

  // ─── Asset Selector ───────────────────────────────────────────────────────

  function buildAssetSelector() {
    const container = document.getElementById('asset-selector');
    if (!container) return;

    const groups = API.ASSET_GROUPS;
    const assets = API.ASSETS;

    let html = '';
    for (const [groupKey, groupLabel] of Object.entries(groups)) {
      const groupAssets = Object.values(assets).filter(a => a.type === groupKey);
      html += `<div class="asset-group">
        <div class="asset-group-label">${groupLabel}</div>
        <div class="asset-chips">`;

      for (const asset of groupAssets) {
        html += `<label class="asset-chip" data-symbol="${asset.symbol}">
          <input type="checkbox" value="${asset.symbol}" class="asset-checkbox" />
          <span class="chip-icon">${asset.icon}</span>
          <span class="chip-symbol">${asset.symbol}</span>
          <span class="chip-label">${asset.label}</span>
        </label>`;
      }

      html += `</div></div>`;
    }

    container.innerHTML = html;
  }

  function syncAssetCheckboxes() {
    document.querySelectorAll('.asset-checkbox').forEach(cb => {
      cb.checked = state.selectedAssets.includes(cb.value);
      cb.closest('.asset-chip').classList.toggle('selected', cb.checked);
    });
    updateSelectedCount();
  }

  function updateSelectedCount() {
    const el = document.getElementById('selected-count');
    if (el) el.textContent = state.selectedAssets.length;
  }

  // ─── Event Listeners ──────────────────────────────────────────────────────

  function setupEventListeners() {
    document.addEventListener('change', e => {
      if (!e.target.classList.contains('asset-checkbox')) return;
      const sym = e.target.value;
      if (e.target.checked) {
        if (!state.selectedAssets.includes(sym)) state.selectedAssets.push(sym);
      } else {
        state.selectedAssets = state.selectedAssets.filter(s => s !== sym);
      }
      e.target.closest('.asset-chip').classList.toggle('selected', e.target.checked);
      updateSelectedCount();
      debouncedCompute();
    });

    document.getElementById('mode-demo')?.addEventListener('click', () => setMode('demo'));
    document.getElementById('mode-live')?.addEventListener('click', () => setMode('live'));

    document.getElementById('api-key-input')?.addEventListener('input', e => {
      API.setApiKey(e.target.value);
    });
    document.getElementById('api-key-save')?.addEventListener('click', () => {
      const input = document.getElementById('api-key-input');
      if (input) {
        API.setApiKey(input.value);
        showToast('Clé API sauvegardée ✓');
        if (state.mode === 'live') compute();
      }
    });

    document.getElementById('btn-refresh')?.addEventListener('click', () => compute(true));

    document.querySelectorAll('.window-pill').forEach(pill => {
      if (parseInt(pill.dataset.days) === state.window) {
        document.querySelectorAll('.window-pill').forEach(p => {
          p.classList.toggle('active', p === pill);
          p.setAttribute('aria-pressed', p === pill ? 'true' : 'false');
        });
      }
      pill.addEventListener('click', () => {
        document.querySelectorAll('.window-pill').forEach(p => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-pressed', 'true');
        state.window = parseInt(pill.dataset.days);
        compute();
      });
    });

    document.getElementById('sort-select')?.addEventListener('change', e => {
      state.sortBy = e.target.value;
      renderHeatmap();
      renderStats();
    });

    document.getElementById('detail-close')?.addEventListener('click', closeDetailPanel);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDetailPanel();
      if (e.key === 'r' && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT') {
        compute(true);
      }
    });
  }

  function setMode(mode) {
    state.mode = mode;
    renderModeToggle();
    compute();
  }

  function renderModeToggle() {
    document.getElementById('mode-demo')?.classList.toggle('active', state.mode === 'demo');
    document.getElementById('mode-live')?.classList.toggle('active', state.mode === 'live');

    const apiPanel = document.getElementById('api-key-panel');
    if (apiPanel) apiPanel.style.display = state.mode === 'live' ? 'flex' : 'none';

    const modeLabel = document.getElementById('mode-label');
    if (modeLabel) {
      modeLabel.textContent = state.mode === 'demo'
        ? 'Mode Démo (données simulées)'
        : 'Mode Live (Alpha Vantage)';
    }

    const input = document.getElementById('api-key-input');
    if (input && API.getApiKey()) input.value = API.getApiKey();

    const badge = document.getElementById('info-mode-badge');
    if (badge) {
      if (state.mode === 'live') {
        badge.className = 'info-badge live';
        badge.innerHTML = `<span style="width:4px;height:4px;border-radius:50%;background:rgba(255,140,70,.9);flex-shrink:0;" aria-hidden="true"></span> Mode Live`;
      } else {
        badge.className = 'info-badge demo';
        badge.innerHTML = `<span class="status-dot" style="width:4px;height:4px;" aria-hidden="true"></span> Mode Démo`;
      }
    }
  }

  // ─── Compute ──────────────────────────────────────────────────────────────

  let debounceTimer = null;
  function debouncedCompute() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => compute(), 800);
  }

  async function compute(forceRefresh = false) {
    const assets = state.selectedAssets;

    if (assets.length < 2) {
      renderEmptyState('Sélectionnez au moins 2 actifs pour calculer les corrélations.');
      return;
    }
    if (assets.length > 12) {
      showToast('Maximum 12 actifs simultanément');
      return;
    }

    state.isLoading = true;
    renderLoading();
    saveState();

    try {
      const useMock = state.mode === 'demo';

      // 1. Récupération des séries temporelles (réseau / mock)
      state.seriesData = await API.fetchMultiple(
        assets,
        useMock,
        (done, total, sym) => updateLoadingProgress(done, total, `Données : ${sym} (${done}/${total})`)
      );

      // 2. Construction de la matrice via Web Worker ──────────────────────
      updateLoadingProgress(0, 1, 'Démarrage du calcul des corrélations…');
      state.correlationMatrix = await buildMatrixAsync(assets, state.seriesData);

      state.lastUpdated = new Date();

      renderHeatmap();
      renderStats();
      renderWorkerStatus();
    } catch (err) {
      renderError(err.message);
    } finally {
      state.isLoading = false;
    }
  }

  // ─── buildMatrixSync (fallback si Worker indisponible) ────────────────────

  /**
   * Version synchrone conservée comme fallback.
   * Identique à la logique du worker mais s'exécute sur le thread principal.
   */
  function buildMatrixSync(assets, seriesData) {
    const matrix = {};

    for (const sym of assets) {
      matrix[sym] = {};
      matrix[sym][sym] = { r: 1, p: 0, n: state.window, isSelf: true };
    }

    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const sym1 = assets[i];
        const sym2 = assets[j];
        const series1 = seriesData[sym1];
        const series2 = seriesData[sym2];

        if (!series1 || !series2) {
          const err = { r: null, error: 'No data' };
          matrix[sym1][sym2] = err;
          matrix[sym2][sym1] = err;
          continue;
        }

        const result = Stats.analyze(
          series1, series2,
          API.ASSETS[sym1]?.label || sym1,
          API.ASSETS[sym2]?.label || sym2,
          state.window,
        );

        matrix[sym1][sym2] = result;
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
        };
      }
    }

    return matrix;
  }

  // ─── Indicateur de statut du worker ──────────────────────────────────────

  /**
   * Affiche un badge discret dans la navbar indiquant si le worker est actif.
   */
  function renderWorkerStatus() {
    // Retire un badge précédent éventuel
    document.getElementById('worker-status-badge')?.remove();

    const navActions = document.querySelector('.nav-actions');
    if (!navActions) return;

    const badge = document.createElement('div');
    badge.id = 'worker-status-badge';
    badge.className = 'worker-badge';

    if (_workerFail) {
      badge.innerHTML = `<span class="worker-dot fallback"></span>JS sync`;
      badge.title = 'Web Worker indisponible — calcul synchrone (normal sur file://)';
    } else {
      badge.innerHTML = `<span class="worker-dot active"></span>Worker actif`;
      badge.title = 'Calculs Pearson déportés sur un Web Worker (thread séparé)';
    }

    navActions.prepend(badge);
  }

  // ─── Tri ──────────────────────────────────────────────────────────────────

  function getSortedAssets() {
    const assets = [...state.selectedAssets];
    const matrix = state.correlationMatrix;

    switch (state.sortBy) {
      case 'alpha':
        return assets.sort((a, b) => a.localeCompare(b));

      case 'avg-corr': {
        const avg = sym => {
          const row = matrix[sym];
          if (!row) return 0;
          const vals = Object.entries(row)
            .filter(([k, v]) => k !== sym && v.r != null)
            .map(([, v]) => Math.abs(v.r));
          return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
        };
        return assets.sort((a, b) => avg(b) - avg(a));
      }

      default:
        return assets;
    }
  }

  // ─── Render Heatmap ───────────────────────────────────────────────────────

  function qualityCellAttrs(corr) {
    if (!corr || corr.isSelf || !corr.quality) return { cls: '', dataQuality: 'ok' };

    const flag = corr.quality.flag;
    const FLAG = Stats.QUALITY_FLAGS;

    switch (flag) {
      case FLAG.LOW_VARIANCE:  return { cls: 'quality-low-variance',  dataQuality: flag };
      case FLAG.MANY_GAPS:     return { cls: 'quality-many-gaps',     dataQuality: flag };
      case FLAG.LOW_COVERAGE:  return { cls: 'quality-low-coverage',  dataQuality: flag };
      default:                  return { cls: '',                       dataQuality: 'ok' };
    }
  }

  function renderHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;

    const assets = getSortedAssets();
    const matrix = state.correlationMatrix;
    const n = assets.length;

    let html = `<div class="heatmap-grid" style="--cols:${n}">`;

    html += `<div class="heatmap-cell corner-cell">
      <span class="corner-label">Asset →<br>↓ vs</span>
    </div>`;

    for (const sym of assets) {
      const asset = API.ASSETS[sym];
      html += `<div class="heatmap-cell header-cell header-col" data-symbol="${sym}">
        <span class="header-icon">${asset?.icon || '📈'}</span>
        <span class="header-sym">${sym}</span>
      </div>`;
    }

    for (const sym1 of assets) {
      const asset = API.ASSETS[sym1];
      html += `<div class="heatmap-cell header-cell header-row" data-symbol="${sym1}">
        <span class="header-icon">${asset?.icon || '📈'}</span>
        <span class="header-sym">${sym1}</span>
        <span class="header-label">${asset?.label || sym1}</span>
      </div>`;

      for (const sym2 of assets) {
        const corr = matrix[sym1]?.[sym2];
        const isSelf = sym1 === sym2;
        const r = corr?.r ?? null;
        const rFmt = r !== null ? r.toFixed(3) : '—';
        const bg = isSelf ? 'rgba(255,255,255,0.08)' : Stats.correlationColor(r, corr?.quality?.flag);
        const fg = Stats.correlationTextColor(r);
        const sig = corr?.significance || '';

        const { cls: qualityCls, dataQuality } = qualityCellAttrs(corr);

        const qualityTooltip = corr?.quality && !isSelf
          ? ` | ${corr.quality.detail}`
          : '';

        html += `<div class="heatmap-cell data-cell${isSelf ? ' self-cell' : ''} ${qualityCls}"
          style="background:${bg};color:${fg}"
          data-sym1="${sym1}" data-sym2="${sym2}"
          data-quality="${dataQuality}"
          title="${sym1} / ${sym2} : r = ${rFmt}${qualityTooltip}">
          <span class="cell-r">${isSelf ? '1.000' : rFmt}</span>
          ${!isSelf && sig ? `<span class="cell-sig">${sig}</span>` : ''}
        </div>`;
      }
    }

    html += '</div>';

    html += `<div class="heatmap-legend">
      <div class="legend-gradient"></div>
      <div class="legend-labels">
        <span>−1.0 Corrélation négative</span>
        <span>0</span>
        <span>+1.0 Corrélation positive</span>
      </div>
      <div class="legend-sig">
        Significativité : <b>***</b> p&lt;0.001 · <b>**</b> p&lt;0.01 · <b>*</b> p&lt;0.05 · <b>ns</b> non-signif.
      </div>
      <div class="legend-sig" style="margin-top:6px;display:flex;gap:16px;flex-wrap:wrap;">
        <span>Qualité données :</span>
        <span style="display:inline-flex;align-items:center;gap:5px;">
          <span style="display:inline-block;width:14px;height:10px;background:repeating-linear-gradient(45deg,rgba(255,180,0,.18) 0px,rgba(255,180,0,.18) 2px,transparent 2px,transparent 8px);border:1px solid rgba(255,180,0,.3);border-radius:1px;"></span>
          Variance faible
        </span>
        <span style="display:inline-flex;align-items:center;gap:5px;">
          <span style="display:inline-block;width:14px;height:10px;background:radial-gradient(circle,rgba(255,107,53,.25) 1px,transparent 1px) 0 0/6px 6px;border:1px solid rgba(255,107,53,.22);border-radius:1px;"></span>
          Liquidité faible
        </span>
        <span style="display:inline-flex;align-items:center;gap:5px;">
          <span style="display:inline-block;width:14px;height:10px;background:linear-gradient(rgba(120,120,180,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(120,120,180,.18) 1px,transparent 1px);background-size:6px 6px;border:1px solid rgba(120,120,180,.28);border-radius:1px;"></span>
          Couverture insuffisante
        </span>
      </div>
    </div>`;

    container.innerHTML = html;

    const cells = container.querySelectorAll('.data-cell');
    cells.forEach((cell, i) => {
      cell.style.setProperty('--cell-delay', `${i * 12}ms`);
    });
    requestAnimationFrame(() => {
      container.querySelector('.heatmap-grid')?.classList.add('animate-in');
    });

    container.querySelectorAll('.data-cell:not(.self-cell)').forEach(cell => {
      cell.addEventListener('click', () => {
        showDetailPanel(cell.dataset.sym1, cell.dataset.sym2);
      });
      cell.addEventListener('mouseenter', () => highlightCross(cell));
      cell.addEventListener('mouseleave', clearHighlight);
    });

    updateTimestamp();
  }

  function highlightCross(cell) {
    const { sym1, sym2 } = cell.dataset;
    document.querySelectorAll('.header-cell').forEach(h => {
      h.classList.toggle('highlighted',
        h.dataset.symbol === sym1 || h.dataset.symbol === sym2);
    });
    cell.classList.add('active');
  }

  function clearHighlight() {
    document.querySelectorAll('.header-cell').forEach(h => h.classList.remove('highlighted'));
    document.querySelectorAll('.data-cell').forEach(c => c.classList.remove('active'));
  }

  // ─── Detail Panel ─────────────────────────────────────────────────────────

  function renderQualityBlock(corr, sym1, sym2) {
    if (!corr.quality) return '';

    const q = corr.quality;
    const FLAG = Stats.QUALITY_FLAGS;

    const scoreColor = q.score > 0.75 ? 'var(--pos)'
                     : q.score > 0.40 ? '#FFB400'
                     : 'var(--neg)';

    const badgeClass = q.flag === FLAG.OK ? 'ok'
                     : q.score > 0.40    ? 'warn'
                     : 'bad';

    const flagLabels = {
      [FLAG.OK]:            '✓ Données fiables',
      [FLAG.LOW_VARIANCE]:  '⚠ Variance faible',
      [FLAG.MANY_GAPS]:     '⚠ Liquidité faible',
      [FLAG.LOW_COVERAGE]:  '⚠ Couverture partielle',
    };

    return `
      <div class="quality-panel">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span class="quality-panel-title">Qualité des données</span>
          <span class="quality-badge ${badgeClass}">${flagLabels[q.flag] || q.flag}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:8px;color:var(--t2);width:48px;flex-shrink:0;">Score</span>
          <div class="quality-score-track">
            <div class="quality-score-fill"
              style="width:${Math.round(q.score * 100)}%;background:${scoreColor};"></div>
          </div>
          <span style="font-family:var(--fd);font-size:11px;font-weight:700;color:${scoreColor};min-width:32px;text-align:right;">${Math.round(q.score * 100)}%</span>
        </div>
        <div class="quality-row">
          <span class="quality-sym-label">${sym1}</span>
          <span class="quality-detail-text">${q.detailX || '—'}</span>
        </div>
        <div class="quality-row">
          <span class="quality-sym-label">${sym2}</span>
          <span class="quality-detail-text">${q.detailY || '—'}</span>
        </div>
        ${q.flag !== FLAG.OK ? `
          <div style="font-size:9px;color:rgba(255,180,0,.85);line-height:1.55;padding:6px 8px;background:rgba(255,180,0,.06);border-radius:var(--r1);border-left:2px solid rgba(255,180,0,.3);">
            Ce coefficient est calculé mais doit être interprété avec prudence. Les données présentent des anomalies qui peuvent biaiser r.
          </div>
        ` : ''}
      </div>`;
  }

  function showDetailPanel(sym1, sym2) {
    const panel = document.getElementById('detail-panel');
    if (!panel) return;

    const corr = state.correlationMatrix[sym1]?.[sym2];
    if (!corr) return;

    const asset1 = API.ASSETS[sym1];
    const asset2 = API.ASSETS[sym2];
    const r = corr.r;
    const rDisplay = r !== null ? r.toFixed(4) : 'N/A';
    const pDisplay = corr.p !== null ? corr.p.toFixed(4) : 'N/A';

    let interpretation = '';
    if (r !== null) {
      const direction = r > 0 ? 'positive' : 'négative';
      const strength = corr.strength?.toLowerCase() || 'faible';
      const pSig = corr.p !== null && corr.p < 0.05;
      interpretation = `La corrélation entre <strong>${asset1?.label || sym1}</strong> et <strong>${asset2?.label || sym2}</strong>
        est <strong>${direction} (${strength})</strong> sur ${corr.n || state.window} jours.
        ${pSig
          ? 'Résultat <strong>statistiquement significatif</strong> (p &lt; 0.05).'
          : 'Résultat <strong>non significatif</strong> (p ≥ 0.05).'}`;
      if (Math.abs(r) > 0.7) {
        interpretation += ` Forte corrélation ${direction} : les actifs tendent à évoluer ${r > 0 ? 'dans le même sens' : 'en sens opposé'}.`;
      } else if (Math.abs(r) < 0.3) {
        interpretation += ` Faible corrélation : évolution <strong>indépendante</strong> — potentiellement utile pour la diversification.`;
      }
    }

    panel.innerHTML = `
      <div class="detail-header">
        <div class="detail-pair">
          <span class="detail-asset">${asset1?.icon || '📈'} ${sym1}</span>
          <span class="detail-vs">↔</span>
          <span class="detail-asset">${asset2?.icon || '📈'} ${sym2}</span>
        </div>
        <button class="detail-close-btn" id="detail-close" aria-label="Fermer">✕</button>
      </div>

      <div class="detail-r-display">
        <div class="r-value" style="color:${r > 0 ? 'var(--cyan)' : r < 0 ? 'var(--amber)' : 'white'}">
          ${rDisplay}
        </div>
        <div class="r-label">Coefficient de Pearson (r)</div>
        <div class="r-strength">${corr.strength || '—'} · ${corr.significance || '—'}</div>
      </div>

      <div class="detail-stats-grid">
        <div class="detail-stat">
          <span class="stat-label">p-value</span>
          <span class="stat-value">${pDisplay}</span>
        </div>
        <div class="detail-stat">
          <span class="stat-label">Observations</span>
          <span class="stat-value">${corr.n || '—'}</span>
        </div>
        <div class="detail-stat">
          <span class="stat-label">Vol. ${sym1}</span>
          <span class="stat-value">${corr.stdDevX ? (corr.stdDevX * 100).toFixed(2) + '%' : '—'}</span>
        </div>
        <div class="detail-stat">
          <span class="stat-label">Vol. ${sym2}</span>
          <span class="stat-value">${corr.stdDevY ? (corr.stdDevY * 100).toFixed(2) + '%' : '—'}</span>
        </div>
        <div class="detail-stat">
          <span class="stat-label">Rend. moy. ${sym1}</span>
          <span class="stat-value ${corr.meanRetX >= 0 ? 'positive' : 'negative'}">
            ${corr.meanRetX != null ? (corr.meanRetX * 100).toFixed(3) + '%' : '—'}
          </span>
        </div>
        <div class="detail-stat">
          <span class="stat-label">Rend. moy. ${sym2}</span>
          <span class="stat-value ${corr.meanRetY >= 0 ? 'positive' : 'negative'}">
            ${corr.meanRetY != null ? (corr.meanRetY * 100).toFixed(3) + '%' : '—'}
          </span>
        </div>
      </div>

      <div class="detail-interpretation">${interpretation}</div>

      ${renderQualityBlock(corr, sym1, sym2)}

      <div class="detail-minibar">
        <div class="minibar-track">
          <div class="minibar-fill" style="
            left:${r >= 0 ? '50%' : `${50 + r * 50}%`};
            width:${Math.abs(r ?? 0) * 50}%;
            background:${r > 0 ? 'var(--cyan)' : 'var(--amber)'};
          "></div>
          <div class="minibar-zero"></div>
        </div>
        <div class="minibar-labels">
          <span>−1</span><span>0</span><span>+1</span>
        </div>
      </div>
    `;

    panel.classList.add('open');
    document.getElementById('detail-close')?.addEventListener('click', closeDetailPanel);
  }

  function closeDetailPanel() {
    document.getElementById('detail-panel')?.classList.remove('open');
  }

  // ─── Stats Summary ────────────────────────────────────────────────────────

  function renderStats() {
    const assets = state.selectedAssets;
    const matrix = state.correlationMatrix;

    let maxR = -Infinity, minR = Infinity;
    let maxPair = null, minPair = null;
    let pairs = 0, sigPairs = 0, sumR = 0;
    let suspectPairs = 0;

    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const corr = matrix[assets[i]]?.[assets[j]];
        if (!corr || corr.r == null) continue;
        pairs++;
        sumR += corr.r;
        if (corr.p != null && corr.p < 0.05) sigPairs++;
        if (corr.quality && !corr.quality.isReliable) suspectPairs++;
        if (corr.r > maxR) { maxR = corr.r; maxPair = [assets[i], assets[j]]; }
        if (corr.r < minR) { minR = corr.r; minPair = [assets[i], assets[j]]; }
      }
    }

    const avgR = pairs > 0 ? (sumR / pairs).toFixed(3) : '—';

    const el = document.getElementById('stats-summary');
    if (!el) return;

    el.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-value">${pairs}</div>
        <div class="stat-card-label">Paires analysées</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value">${sigPairs}</div>
        <div class="stat-card-label">Significatives (p&lt;0.05)</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value ${parseFloat(avgR) >= 0 ? 'positive' : 'negative'}">${avgR}</div>
        <div class="stat-card-label">r moyen (paires)</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value positive">${maxPair ? maxR.toFixed(3) : '—'}</div>
        <div class="stat-card-label">Max r ${maxPair ? `(${maxPair[0]}/${maxPair[1]})` : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-value negative">${minPair ? minR.toFixed(3) : '—'}</div>
        <div class="stat-card-label">Min r ${minPair ? `(${minPair[0]}/${minPair[1]})` : ''}</div>
      </div>
      <div class="stat-card" title="${suspectPairs} paire(s) avec données de qualité dégradée">
        <div class="stat-card-value ${suspectPairs > 0 ? 'negative' : 'positive'}">${suspectPairs}</div>
        <div class="stat-card-label">Données suspectes ⚠</div>
      </div>
    `;
  }

  // ─── Loading / Error / Empty states ───────────────────────────────────────

  function renderLoading() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    container.innerHTML = `
      <div class="state-container">
        <div class="loading-spinner"></div>
        <div class="state-text">Chargement des données…</div>
        <div class="loading-progress" id="loading-progress">Initialisation…</div>
      </div>`;
  }

  function updateLoadingProgress(done, total, label) {
    const el = document.getElementById('loading-progress');
    if (el) el.textContent = label || `${done}/${total}`;
  }

  function renderError(msg) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    container.innerHTML = `
      <div class="state-container">
        <div class="state-icon">⚠️</div>
        <div class="state-text">Erreur de chargement</div>
        <div class="state-sub">${msg}</div>
        <button onclick="App.compute()" class="btn-retry">Réessayer</button>
      </div>`;
  }

  function renderEmptyState(msg) {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    container.innerHTML = `
      <div class="state-container">
        <div class="state-icon">📊</div>
        <div class="state-text">${msg}</div>
      </div>`;
  }

  function updateTimestamp() {
    const el = document.getElementById('last-updated');
    if (el && state.lastUpdated) {
      el.textContent = `Mis à jour : ${state.lastUpdated.toLocaleTimeString('fr-FR')}`;
    }
  }

  // ─── Toast ────────────────────────────────────────────────────────────────

  function showToast(msg, duration = 3000) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  return { init, compute, setMode, showToast };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
