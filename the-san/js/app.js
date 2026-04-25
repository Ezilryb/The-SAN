/**
 * THE SAN — Correlation Map Engine
 * Main application logic for the interactive heatmap
 */

const App = (() => {

  // ─── State ────────────────────────────────────────────────────────────────

  let state = {
    mode: 'demo',        // 'demo' | 'live'
    selectedAssets: [],
    seriesData: {},
    correlationMatrix: {},
    isLoading: false,
    activeCell: null,
    sortBy: 'default',
    window: 30,          // days
    lastUpdated: null,
  };

  // Default asset selection
  const DEFAULT_ASSETS = ['LIT', 'TSLA', 'NVDA', 'GLD', 'URA', 'ENPH', 'CPER', 'QQQ'];

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    buildAssetSelector();
    setupEventListeners();
    loadState();
    renderModeToggle();

    // Start with demo mode
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
        state.mode = parsed.mode || 'demo';
      }
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    try {
      localStorage.setItem('san_state', JSON.stringify({
        selectedAssets: state.selectedAssets,
        mode: state.mode,
      }));
    } catch (e) { /* ignore */ }
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
    // Asset checkbox toggles
    document.addEventListener('change', e => {
      if (!e.target.classList.contains('asset-checkbox')) return;
      const sym = e.target.value;
      if (e.target.checked) {
        if (!state.selectedAssets.includes(sym)) {
          state.selectedAssets.push(sym);
        }
      } else {
        state.selectedAssets = state.selectedAssets.filter(s => s !== sym);
      }
      e.target.closest('.asset-chip').classList.toggle('selected', e.target.checked);
      updateSelectedCount();
      debouncedCompute();
    });

    // Mode toggle
    document.getElementById('mode-demo')?.addEventListener('click', () => setMode('demo'));
    document.getElementById('mode-live')?.addEventListener('click', () => setMode('live'));

    // API key input
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

    // Refresh button
    document.getElementById('btn-refresh')?.addEventListener('click', () => {
      compute(true);
    });

    // Window size select
    document.getElementById('window-select')?.addEventListener('change', e => {
      state.window = parseInt(e.target.value);
      compute();
    });

    // Sort
    document.getElementById('sort-select')?.addEventListener('change', e => {
      state.sortBy = e.target.value;
      renderHeatmap();
    });

    // Close detail panel
    document.getElementById('detail-close')?.addEventListener('click', () => {
      closeDetailPanel();
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeDetailPanel();
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
    if (apiPanel) {
      apiPanel.style.display = state.mode === 'live' ? 'flex' : 'none';
    }

    const modeLabel = document.getElementById('mode-label');
    if (modeLabel) {
      modeLabel.textContent = state.mode === 'demo' ? 'Mode Démo (données simulées)' : 'Mode Live (Alpha Vantage)';
    }

    // Pre-fill API key if saved
    const input = document.getElementById('api-key-input');
    if (input && API.getApiKey()) input.value = API.getApiKey();
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
      // Fetch all series
      const useMock = state.mode === 'demo';
      let loaded = 0;

      state.seriesData = await API.fetchMultiple(
        assets,
        useMock,
        (done, total, sym) => {
          loaded = done;
          updateLoadingProgress(done, total, sym);
        }
      );

      // Build correlation matrix
      state.correlationMatrix = buildMatrix(assets, state.seriesData);
      state.lastUpdated = new Date();

      renderHeatmap();
      renderStats();
    } catch (err) {
      renderError(err.message);
    } finally {
      state.isLoading = false;
    }
  }

  function buildMatrix(assets, seriesData) {
    const matrix = {};

    for (const sym1 of assets) {
      matrix[sym1] = {};
      for (const sym2 of assets) {
        if (sym1 === sym2) {
          matrix[sym1][sym2] = { r: 1, p: 0, n: 30, isSelf: true };
          continue;
        }

        const series1 = seriesData[sym1];
        const series2 = seriesData[sym2];

        if (!series1 || !series2) {
          matrix[sym1][sym2] = { r: null, error: 'No data' };
          continue;
        }

        const result = Stats.analyze(series1, series2,
          API.ASSETS[sym1]?.label || sym1,
          API.ASSETS[sym2]?.label || sym2
        );
        matrix[sym1][sym2] = result;
      }
    }

    return matrix;
  }

  // ─── Render Heatmap ───────────────────────────────────────────────────────

  function renderHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;

    const assets = state.selectedAssets;
    const matrix = state.correlationMatrix;

    // Build the grid
    let html = `<div class="heatmap-grid" style="--cols: ${assets.length + 1}">`;

    // Corner cell
    html += `<div class="heatmap-cell corner-cell">
      <span class="corner-label">Asset →<br>↓ vs</span>
    </div>`;

    // Column headers
    for (const sym of assets) {
      const asset = API.ASSETS[sym];
      html += `<div class="heatmap-cell header-cell header-col" data-symbol="${sym}">
        <span class="header-icon">${asset?.icon || '📈'}</span>
        <span class="header-sym">${sym}</span>
      </div>`;
    }

    // Rows
    for (const sym1 of assets) {
      // Row header
      const asset = API.ASSETS[sym1];
      html += `<div class="heatmap-cell header-cell header-row" data-symbol="${sym1}">
        <span class="header-icon">${asset?.icon || '📈'}</span>
        <span class="header-sym">${sym1}</span>
        <span class="header-label">${asset?.label || sym1}</span>
      </div>`;

      // Correlation cells
      for (const sym2 of assets) {
        const corr = matrix[sym1]?.[sym2];
        const isSelf = sym1 === sym2;
        const r = corr?.r;
        const rFormatted = r !== null ? r.toFixed(3) : '—';
        const bgColor = isSelf ? 'rgba(255,255,255,0.08)' : Stats.correlationColor(r);
        const textColor = Stats.correlationTextColor(r);
        const sig = corr?.significance || '';

        html += `<div class="heatmap-cell data-cell ${isSelf ? 'self-cell' : ''}"
          style="background: ${bgColor}; color: ${textColor}"
          data-sym1="${sym1}" data-sym2="${sym2}"
          title="${sym1} vs ${sym2}: r = ${rFormatted}">
          <span class="cell-r">${isSelf ? '1.000' : rFormatted}</span>
          ${!isSelf && sig ? `<span class="cell-sig">${sig}</span>` : ''}
        </div>`;
      }
    }

    html += '</div>';

    // Legend
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
    </div>`;

    container.innerHTML = html;

    // Add click handlers for detail view
    container.querySelectorAll('.data-cell:not(.self-cell)').forEach(cell => {
      cell.addEventListener('click', () => {
        const { sym1, sym2 } = cell.dataset;
        showDetailPanel(sym1, sym2);
      });
      cell.addEventListener('mouseenter', () => highlightCross(cell));
      cell.addEventListener('mouseleave', () => clearHighlight());
    });

    // Animate in
    requestAnimationFrame(() => {
      container.querySelectorAll('.data-cell').forEach((cell, i) => {
        cell.style.opacity = '0';
        cell.style.transform = 'scale(0.8)';
        setTimeout(() => {
          cell.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          cell.style.opacity = '1';
          cell.style.transform = 'scale(1)';
        }, i * 15);
      });
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

    // Interpretation text
    let interpretation = '';
    if (r !== null) {
      const direction = r > 0 ? 'positive' : 'négative';
      const strength = corr.strength?.toLowerCase() || 'faible';
      const pSig = corr.p !== null && corr.p < 0.05;
      interpretation = `La corrélation entre <strong>${asset1?.label || sym1}</strong> et <strong>${asset2?.label || sym2}</strong> est <strong>${direction} (${strength})</strong> sur les ${corr.n || 30} derniers jours de trading. ${pSig ? 'Ce résultat est <strong>statistiquement significatif</strong> (p < 0.05).' : 'Ce résultat n\'est <strong>pas statistiquement significatif</strong> (p ≥ 0.05).'}`;

      if (Math.abs(r) > 0.7) {
        interpretation += ` Une corrélation ${direction} forte suggère que ces deux actifs tendent à évoluer ${r > 0 ? 'dans le même sens' : 'en sens opposé'}.`;
      } else if (Math.abs(r) < 0.3) {
        interpretation += ` La faible corrélation suggère que ces actifs évoluent de manière <strong>indépendante</strong> — potentiellement utile pour la diversification.`;
      }
    }

    panel.innerHTML = `
      <div class="detail-header">
        <div class="detail-pair">
          <span class="detail-asset">${asset1?.icon || '📈'} ${sym1}</span>
          <span class="detail-vs">↔</span>
          <span class="detail-asset">${asset2?.icon || '📈'} ${sym2}</span>
        </div>
        <button class="detail-close-btn" id="detail-close">✕</button>
      </div>

      <div class="detail-r-display">
        <div class="r-value" style="color: ${r > 0 ? 'var(--cyan)' : r < 0 ? 'var(--amber)' : 'white'}">
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
          <span class="stat-value ${corr.meanRetX >= 0 ? 'positive' : 'negative'}">${corr.meanRetX ? (corr.meanRetX * 100).toFixed(3) + '%' : '—'}</span>
        </div>
        <div class="detail-stat">
          <span class="stat-label">Rend. moy. ${sym2}</span>
          <span class="stat-value ${corr.meanRetY >= 0 ? 'positive' : 'negative'}">${corr.meanRetY ? (corr.meanRetY * 100).toFixed(3) + '%' : '—'}</span>
        </div>
      </div>

      <div class="detail-interpretation">${interpretation}</div>

      <div class="detail-minibar">
        <div class="minibar-track">
          <div class="minibar-fill" style="
            left: ${r >= 0 ? '50%' : `${50 + r * 50}%`};
            width: ${Math.abs(r) * 50}%;
            background: ${r > 0 ? 'var(--cyan)' : 'var(--amber)'};
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
    let pairs = 0, sigPairs = 0;
    let sumR = 0;

    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const corr = matrix[assets[i]]?.[assets[j]];
        if (!corr || corr.r === null) continue;
        pairs++;
        sumR += corr.r;
        if (corr.p !== null && corr.p < 0.05) sigPairs++;
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
      <div class="stat-card">
        <div class="stat-card-value">${state.window}j</div>
        <div class="stat-card-label">Fenêtre temporelle</div>
      </div>
    `;
  }

  // ─── Loading / Error / Empty states ──────────────────────────────────────

  function renderLoading() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    container.innerHTML = `
      <div class="state-container">
        <div class="loading-spinner"></div>
        <div class="state-text">Chargement des données...</div>
        <div class="loading-progress" id="loading-progress">Initialisation...</div>
      </div>`;
  }

  function updateLoadingProgress(done, total, sym) {
    const el = document.getElementById('loading-progress');
    if (el) el.textContent = `${sym} (${done}/${total})`;
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
