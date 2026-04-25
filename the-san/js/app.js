/**
 * app.js — The SAN
 * Bootstrap principal : initialisation du cache, abonnements Store,
 * enregistrement des routes, montage du routeur.
 */

(async () => {

  // ─── 1. Initialisation du cache IndexedDB ─────────────────────────────────
  await Cache.init();

  // ─── 2. Abonnements Store → UI réactive ──────────────────────────────────

  // Badge mode données (Live / Yahoo / Mock)
  Store.on('dataMode', (mode) => {
    const badge = document.getElementById('data-mode-badge');
    const label = document.getElementById('badge-label-text');
    const warning = document.getElementById('mock-warning');

    const modes = {
      alphavantage: { text: 'Live',  cls: 'badge--live' },
      yahoo:        { text: 'Yahoo', cls: 'badge--yahoo' },
      mock:         { text: 'Mock',  cls: 'badge--mock' },
    };
    const m = modes[mode] ?? modes.mock;

    badge.className = `data-mode-badge ${m.cls}`;
    label.textContent = m.text;
    warning.hidden = mode !== 'mock';
  });

  // Loading overlay
  Store.on('isLoading', (loading) => {
    document.getElementById('loading-overlay').hidden = !loading;
    document.getElementById('loading-bar').classList.toggle('loading-bar--active', loading);
  });

  Store.on('loadingMessage', (msg) => {
    document.getElementById('loading-message').textContent = msg || 'Chargement…';
  });

  // Erreur globale (toast)
  Store.on('error', (err) => {
    if (!err) return _hideToast();
    _showToast(err, 'error');
  });

  // ─── 3. Enregistrement des routes ────────────────────────────────────────

  Router.register('#/correlation', CorrelationView.render, 'Corrélations');
  Router.register('#/sentiment',   SentimentView.render,   'Sentiment Flow');
  Router.register('#/macro',       MacroView.render,        'Macro Dashboard');
  Router.register('#/settings',    SettingsView.render,     'Réglages');

  // Route 404 → redirige vers corrélation
  Router.register('*', () => {
    Router.replace('#/correlation');
    return '<p>Redirection…</p>';
  });

  // ─── 4. Montage du routeur ────────────────────────────────────────────────
  Router.mount('#app-outlet');

  // ─── 5. Initialisation du mode données ───────────────────────────────────
  const apiKey = Store.getApiKey();
  Store.set({ dataMode: apiKey ? 'alphavantage' : 'mock' });

  console.info('[The SAN] Prêt. Mode:', Store.get('dataMode'));

})();

// ─── Toast notifications ────────────────────────────────────────────────────

let _toastTimeout = null;

function _showToast(message, type = 'info') {
  let toast = document.getElementById('san-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'san-toast';
    toast.setAttribute('role', 'alert');
    document.body.appendChild(toast);
  }

  toast.className = `toast toast--${type} toast--visible`;
  toast.textContent = message;

  clearTimeout(_toastTimeout);
  _toastTimeout = setTimeout(() => {
    toast.classList.remove('toast--visible');
    Store.clearError();
  }, 5000);
}

function _hideToast() {
  const toast = document.getElementById('san-toast');
  if (toast) toast.classList.remove('toast--visible');
}
