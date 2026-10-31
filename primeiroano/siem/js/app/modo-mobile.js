/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Barra de modos mobile + modal de 1ª ativação
   ARQUIVO: modo-mobile.js
   ───────────────────────────────────────────────────────────────
   Adiciona a App.prototype: _buildModeTabsMobile, _modeSummaryHTML,
   _syncMobileModeUI, _showModeInfoModal, _hideModeInfoModal,
   _bindModeInfoModal.

   Como no SILQ/SIQI/SIE/SIFI: não existe um "bottom sheet de
   controles do módulo" — a sidebar direita (Substância/Diagrama/
   Controles/Dados & Medidas) é a mesma pra qualquer módulo (só
   destrava com `inert`, ver app-modulos.js), então a única
   superfície pra informação de "1ª ativação" é o MODAL, sem resumo
   companheiro.

   Depende de: app/app-core.js (classe App já deve existir), o HTML
               da #sidebar-left já montado (os 3 cards de módulo são
               estáticos).
   Usado por: app/app-modulos.js (chama _syncMobileModeUI dentro de
              _alternarModulo()).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── barra de módulos MOBILE — lê a ordem e os dados direto dos 3
   cards já existentes em #sidebar-left. Clicar delega pro MESMO
   botão .mode-activate-btn de dentro do card. ── */
App.prototype._buildModeTabsMobile = function () {
  const bar = document.getElementById('mode-tabs-mobile');
  if (!bar) return;
  document.querySelectorAll('#sidebar-left .panel--mode[data-modulo]').forEach(panel => {
    const header = panel.querySelector('.panel-header');
    const activateBtn = panel.querySelector('.mode-activate-btn[data-modulo-ativar]');
    if (!header || !activateBtn) return;
    const id = activateBtn.dataset.moduloAtivar;
    const icon = header.querySelector('.panel-icon');
    const label = header.querySelector('.panel-label');
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'mode-tab';
    tab.dataset.modeTab = id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.innerHTML = `<span aria-hidden="true">${icon ? icon.innerHTML : ''}</span><span>${label ? label.textContent : id}</span>`;
    tab.title = label ? label.textContent : id;
    tab.addEventListener('click', () => activateBtn.click());
    bar.appendChild(tab);
  });
};

/* ── resumo do módulo, pro modal: reaproveita .mode-define e
   .fact-grid que já existem no card da sidebar esquerda. ── */
App.prototype._modeSummaryHTML = function (id) {
  const panel = document.querySelector(`#sidebar-left .panel--mode[data-modulo="${id}"]`);
  if (!panel) return '';
  let html = '';
  const def = panel.querySelector('.mode-define');
  if (def) html += `<p class="mode-define">${def.innerHTML}</p>`;
  const grid = panel.querySelector('.fact-grid');
  if (grid) html += grid.outerHTML;
  return html;
};

/* ── sincroniza a barra de módulos com o módulo ativo — chamada de
   dentro de _alternarModulo() em app-modulos.js. ── */
App.prototype._syncMobileModeUI = function (id) {
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.setAttribute('aria-selected', tab.dataset.modeTab === id ? 'true' : 'false');
  });
  const activeTab = id && document.querySelector(`.mode-tab[data-mode-tab="${id}"]`);
  if (activeTab && typeof activeTab.scrollIntoView === 'function') {
    const reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduzido ? 'auto' : 'smooth' });
  }
  if (!id) return;
  this._modosVistos = this._modosVistos || new Set();
  const primeiraVez = !this._modosVistos.has(id);
  this._modosVistos.add(id);
  if (primeiraVez && window.innerWidth <= 900) this._showModeInfoModal(id);
};

/* ── MODAL de informações do módulo (1ª ativação, mobile) ── */
App.prototype._showModeInfoModal = function (id) {
  const overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  const panel = document.querySelector(`#sidebar-left .panel--mode[data-modulo="${id}"]`);
  const header = panel ? panel.querySelector('.panel-header') : null;
  const label = header ? header.querySelector('.panel-label') : null;
  const icon = header ? header.querySelector('.panel-icon') : null;
  const iconEl = document.getElementById('modeInfoIcon');
  const title = document.getElementById('modeInfoTitle');
  const body = document.getElementById('modeInfoBody');
  const closeBtn = document.getElementById('modeInfoClose');
  if (iconEl) iconEl.innerHTML = icon ? icon.innerHTML : '';
  if (title) title.textContent = label ? label.textContent : id;
  if (body) body.innerHTML = this._modeSummaryHTML(id);
  overlay.classList.add('aberto');
  overlay.setAttribute('aria-hidden', 'false');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 220);
};
App.prototype._hideModeInfoModal = function () {
  const overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
};
App.prototype._bindModeInfoModal = function () {
  const overlay = document.getElementById('modeInfoOverlay');
  const closeBtn = document.getElementById('modeInfoClose');
  if (!overlay || !closeBtn) return;
  closeBtn.addEventListener('click', () => this._hideModeInfoModal());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) this._hideModeInfoModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('aberto')) this._hideModeInfoModal();
  });
};
