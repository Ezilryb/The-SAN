/**
 * views/settings.js — The SAN
 * Gestion de la clé API, préférences utilisateur, diagnostic cache.
 */

const SettingsView = (() => {

  async function render() {
    const el = document.createElement('div');
    el.className = 'view view--settings';

    el.innerHTML = `
      <div class="view-header">
        <h1 class="view-title">Réglages</h1>
        <p class="view-subtitle">Configuration de The Sentiment Analytics Network</p>
      </div>

      <div class="settings-grid">

        <!-- Section : Clé API -->
        <section class="settings-card" id="api-key-section">
          <h2 class="settings-card-title">
            <span class="settings-icon">⬡</span>
            Source de données
          </h2>

          <p class="settings-desc">
            The SAN utilise une chaîne de fallback à 3 niveaux :
            <strong>Alpha Vantage</strong> (données réelles) →
            <strong>Yahoo Finance</strong> (sans clé) →
            <strong>Mock</strong> (simulé).
          </p>

          <div class="field-group">
            <label for="api-key-input" class="field-label">
              Clé Alpha Vantage
              <a href="https://www.alphavantage.co/support/#api-key" target="_blank" rel="noopener" class="field-link">
                Obtenir gratuitement →
              </a>
            </label>
            <div class="field-row">
              <input
                type="password"
                id="api-key-input"
                class="field-input"
                placeholder="Votre clé API (ex: ABCD1234EFGH)"
                autocomplete="off"
                spellcheck="false"
              />
              <button id="api-key-toggle" class="btn-icon" aria-label="Afficher/masquer la clé" title="Afficher">👁</button>
              <button id="api-key-save" class="btn btn--primary">Enregistrer</button>
            </div>
            <p class="field-hint" id="api-key-status"></p>
          </div>

          <div class="quota-info">
            <div class="quota-pill">
              <span class="quota-label">Tier gratuit</span>
              <span class="quota-val">25 req/jour · 5 req/min</span>
            </div>
            <p class="quota-note">
              Délai de 13s entre requêtes géré automatiquement.
              Avec 8 actifs sélectionnés : ~1m44s de chargement, 32% du quota journalier.
            </p>
          </div>
        </section>

        <!-- Section : Fenêtre de calcul -->
        <section class="settings-card" id="window-section">
          <h2 class="settings-card-title">
            <span class="settings-icon">◎</span>
            Fenêtre d'analyse
          </h2>

          <div class="window-options">
            ${[7, 14, 21, 30, 60, 90].map(d => `
              <button
                class="window-option"
                data-days="${d}"
                aria-label="${d} jours"
              >${d}j</button>
            `).join('')}
          </div>
          <p class="field-hint" id="window-hint"></p>
        </section>

        <!-- Section : Cache & Diagnostic -->
        <section class="settings-card" id="cache-section">
          <h2 class="settings-card-title">
            <span class="settings-icon">◈</span>
            Cache & Diagnostic
          </h2>

          <div class="cache-stats" id="cache-stats">
            <div class="cache-stat">
              <span class="cache-stat-label">Entrées L1 (mémoire)</span>
              <span class="cache-stat-val" id="cache-l1">—</span>
            </div>
            <div class="cache-stat">
              <span class="cache-stat-label">Entrées L2 (IndexedDB)</span>
              <span class="cache-stat-val" id="cache-l2">—</span>
            </div>
          </div>

          <div class="settings-actions">
            <button id="btn-refresh-cache-stats" class="btn btn--ghost">Actualiser</button>
            <button id="btn-clear-cache" class="btn btn--danger">Vider le cache</button>
          </div>
        </section>

        <!-- Section : À propos -->
        <section class="settings-card settings-card--about">
          <h2 class="settings-card-title">
            <span class="settings-icon">◇</span>
            À propos de The SAN
          </h2>
          <p>
            <strong>The Sentiment Analytics Network</strong> est un outil d'analyse
            de corrélations pour les actifs de transition énergétique (lithium, uranium,
            cuivre, hydrogène) et les références macro.
          </p>
          <p>
            Algorithme : coefficient de Pearson sur rendements logarithmiques,
            avec validation de qualité de données (variance, liquidité, couverture).
          </p>
          <div class="about-pills">
            <span class="about-pill">Architecture SPA</span>
            <span class="about-pill">Web Worker</span>
            <span class="about-pill">IndexedDB cache</span>
            <span class="about-pill">3-tier data fallback</span>
          </div>
        </section>

      </div>
    `;

    // ── Hydratation des valeurs courantes ──
    _hydrate(el);

    // ── Binding des événements ──
    _bindApiKey(el);
    _bindWindow(el);
    _bindCache(el);

    return el;
  }

  // ─── Hydratation ─────────────────────────────────────────────────────────

  function _hydrate(el) {
    // Clé API (masquée)
    const apiKey = Store.getApiKey();
    const input = el.querySelector('#api-key-input');
    if (apiKey) {
      input.value = apiKey;
      el.querySelector('#api-key-status').textContent = '✓ Clé enregistrée (session en cours)';
      el.querySelector('#api-key-status').className = 'field-hint field-hint--success';
    }

    // Fenêtre active
    const windowDays = Store.get('windowDays') ?? 21;
    el.querySelectorAll('.window-option').forEach(btn => {
      btn.classList.toggle('window-option--active', parseInt(btn.dataset.days) === windowDays);
    });
    _updateWindowHint(el, windowDays);

    // Stats cache
    _refreshCacheStats(el);
  }

  // ─── Clé API ─────────────────────────────────────────────────────────────

  function _bindApiKey(el) {
    const input  = el.querySelector('#api-key-input');
    const status = el.querySelector('#api-key-status');
    const toggle = el.querySelector('#api-key-toggle');
    const save   = el.querySelector('#api-key-save');

    toggle.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    save.addEventListener('click', () => {
      const key = input.value.trim();
      if (!key) {
        Store.clearApiKey();
        Store.set({ dataMode: 'mock' });
        status.textContent = 'Clé supprimée. Mode mock activé.';
        status.className = 'field-hint field-hint--warn';
        return;
      }

      if (key.length < 10) {
        status.textContent = '⚠ Clé invalide (trop courte).';
        status.className = 'field-hint field-hint--error';
        return;
      }

      Store.setApiKey(key);
      Store.set({ dataMode: 'alphavantage' });
      status.textContent = '✓ Clé enregistrée (session uniquement, jamais persistée sur disque).';
      status.className = 'field-hint field-hint--success';
    });
  }

  // ─── Fenêtre de calcul ────────────────────────────────────────────────────

  function _bindWindow(el) {
    el.querySelectorAll('.window-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const days = parseInt(btn.dataset.days);
        Store.set({ windowDays: days, correlationMatrix: null });

        el.querySelectorAll('.window-option').forEach(b =>
          b.classList.remove('window-option--active')
        );
        btn.classList.add('window-option--active');
        _updateWindowHint(el, days);
      });
    });
  }

  function _updateWindowHint(el, days) {
    const hint = el.querySelector('#window-hint');
    const expectedObs = days - 1;
    hint.textContent = `${expectedObs} rendements calculés · Corrélation valide si ≥ ${Math.ceil(expectedObs * 0.6)} observations (60%).`;
  }

  // ─── Cache ────────────────────────────────────────────────────────────────

  function _bindCache(el) {
    el.querySelector('#btn-refresh-cache-stats').addEventListener('click', () => _refreshCacheStats(el));

    el.querySelector('#btn-clear-cache').addEventListener('click', async () => {
      if (!confirm('Vider le cache supprime toutes les séries téléchargées. Continuer ?')) return;
      await Cache.clear();
      _refreshCacheStats(el);
      _showToast('Cache vidé.', 'info');
    });
  }

  async function _refreshCacheStats(el) {
    try {
      const info = await Cache.inspect();
      el.querySelector('#cache-l1').textContent = info.l1Count;
      el.querySelector('#cache-l2').textContent = info.l2Count;
    } catch (e) {
      el.querySelector('#cache-l1').textContent = 'N/A';
      el.querySelector('#cache-l2').textContent = 'N/A';
    }
  }

  return { render };
})();
