/* ============================================
   search.js — Module Recherche
   ============================================ */

import { TOOLS_DATA } from './tools.js';

export function initSearch() {
  const input       = document.querySelector('.search-bar__input');
  const btn         = document.querySelector('.search-bar__btn');
  const suggestions = document.querySelector('.search-bar__suggestions');

  if (!input) return;

  let debounceTimer = null;

  // ── Suggestions dynamiques ──
  const renderSuggestions = (query) => {
    if (!suggestions) return;

    if (!query || query.length < 2) {
      suggestions.classList.remove('active');
      suggestions.innerHTML = '';
      return;
    }

    const q = query.toLowerCase();
    const matches = TOOLS_DATA.filter(tool =>
      tool.name.toLowerCase().includes(q) ||
      tool.tags.some(t => t.toLowerCase().includes(q)) ||
      tool.category.toLowerCase().includes(q)
    ).slice(0, 6);

    if (!matches.length) {
      suggestions.classList.remove('active');
      return;
    }

    suggestions.innerHTML = matches.map(tool => `
      <div class="search-suggestion" role="option" tabindex="0"
           data-tool="${tool.id}" aria-label="${tool.name}">
        <span class="search-suggestion__tag">${tool.category}</span>
        <span class="search-suggestion__label">${highlightMatch(tool.name, q)}</span>
      </div>
    `).join('');

    suggestions.classList.add('active');

    // Clic sur suggestion
    suggestions.querySelectorAll('.search-suggestion').forEach(el => {
      el.addEventListener('click', () => {
        const toolId = el.dataset.tool;
        navigateToTool(toolId);
      });

      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') navigateToTool(el.dataset.tool);
      });
    });
  };

  // ── Mise en évidence du texte ──
  const highlightMatch = (text, query) => {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background:var(--clr-primary-dim);color:var(--clr-primary)">$1</mark>');
  };

  // ── Navigation vers un outil ──
  const navigateToTool = (toolId) => {
    const toolsSection = document.querySelector('#tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth' });
      // Filtrer les outils
      const event = new CustomEvent('filter:tool', { detail: { toolId } });
      document.dispatchEvent(event);
    }
    suggestions.classList.remove('active');
    input.value = '';
  };

  // ── Lancer la recherche ──
  const doSearch = () => {
    const q = input.value.trim();
    if (!q) return;
    const event = new CustomEvent('search:query', { detail: { query: q } });
    document.dispatchEvent(event);

    const toolsSection = document.querySelector('#tools');
    if (toolsSection) toolsSection.scrollIntoView({ behavior: 'smooth' });
    suggestions.classList.remove('active');
  };

  // ── Événements ──
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderSuggestions(input.value.trim()), 180);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') {
      suggestions?.classList.remove('active');
      input.blur();
    }
  });

  btn?.addEventListener('click', doSearch);

  // Fermer suggestions si clic extérieur
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar')) {
      suggestions?.classList.remove('active');
    }
  });
}
