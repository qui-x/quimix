/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Bottom sheet mobile + modal de 1ª ativação
   ARQUIVO: modo-mobile.js
   ───────────────────────────────────────────────────────────────
   Adiciona a AtomicApp.prototype: _buildModeTabsMobile,
   _modeSummaryHTML, _syncMobileModeUI, _showModeInfoModal,
   _hideModeInfoModal, _bindModeInfoModal.

   Mesmo papel do bloco equivalente dos simuladores de 2º ano
   (app/init/app.js: _buildModeTabsMobile etc.) — replicado aqui à
   mão porque o SIMA não usa SIM_DATA.MODES (a lista de modelos é o
   próprio DOM: cada <section class="panel" data-mode-card="…">
   dentro da #sidebar-left já É o "modo").

   Depende de: app/atomic-app-core.js (classe AtomicApp já deve
               existir), o HTML da #sidebar-left já montado (os 5
               cards de modelo são estáticos, não gerados por JS).
   Usado por: app/eventos.js (chama _syncMobileModeUI/_showModeInfoModal
              na ativação) e app/modelos-ui.js (clearModel chama
              _syncMobileModeUI(null)).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── barra de modelos MOBILE — lê a ordem e os dados direto dos cards
   já existentes em #sidebar-left (nenhuma lista nova pra manter em
   sincronia). Clicar delega pro MESMO botão .mode-activate-btn de
   dentro do card (dispara o click real, sem duplicar lógica). ── */
AtomicApp.prototype._buildModeTabsMobile = function () {
  const bar = document.getElementById('mode-tabs-mobile');
  if (!bar) return;
  document.querySelectorAll('#sidebar-left [data-mode-card]').forEach(panel => {
    const id = panel.dataset.modeCard;
    const header = panel.querySelector('.panel-header');
    const activateBtn = panel.querySelector('.mode-activate-btn');
    if (!header || !activateBtn) return;
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
    // Delega pro botão "Ativar" real do card — mesmo toggle, sem
    // duplicar a lógica de ativação que já vive em eventos.js.
    tab.addEventListener('click', () => activateBtn.click());
    bar.appendChild(tab);
  });
};

/* ── resumo do modelo, para dentro do bottom sheet mobile: o mesmo
   texto de MODEL_INFO + os fact-cells que já existem no card da
   sidebar esquerda (clonados, não recriados — evita duplicar dado). */
AtomicApp.prototype._modeSummaryHTML = function (id) {
  const panel = document.querySelector(`#sidebar-left [data-mode-card="${id}"]`);
  if (!panel) return '';
  let html = '';
  const def = panel.querySelector('.mode-define');
  if (def) html += `<p class="mode-define">${def.innerHTML}</p>`;
  const grid = panel.querySelector('.fact-grid');
  if (grid) html += `<div class="fact-grid">${grid.innerHTML}</div>`;
  return html;
};

/* ── sincroniza a barra de modelos e o resumo do bottom sheet com o
   modelo ativo — chamada por eventos.js (ao ativar) e clearModel()
   (ao desativar), nunca sozinha. ── */
AtomicApp.prototype._syncMobileModeUI = function (id) {
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.setAttribute('aria-selected', tab.dataset.modeTab === id ? 'true' : 'false');
  });
  const activeTab = id && document.querySelector(`.mode-tab[data-mode-tab="${id}"]`);
  if (activeTab && typeof activeTab.scrollIntoView === 'function') {
    const reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduzido ? 'auto' : 'smooth' });
  }
  const box = document.getElementById('mode-summary-mobile');
  const toggle = document.getElementById('mode-summary-toggle');
  const body = document.getElementById('mode-summary-body');
  if (!box || !toggle || !body) return;
  if (!id) { box.hidden = true; return; }
  box.hidden = false;
  body.innerHTML = this._modeSummaryHTML(id);
  this._modosVistos = this._modosVistos || new Set();
  const primeiraVez = !this._modosVistos.has(id);
  this._modosVistos.add(id);
  toggle.setAttribute('aria-expanded', 'false');
  body.classList.remove('open');
  if (primeiraVez && window.innerWidth <= 900) this._showModeInfoModal(id);
  if (!toggle._wired) {
    toggle._wired = true;
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      body.classList.toggle('open', !open);
    });
  }
};

/* ── MODAL de informações do modelo (1ª ativação, mobile) ── */
AtomicApp.prototype._showModeInfoModal = function (id) {
  const overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  const panel = document.querySelector(`#sidebar-left [data-mode-card="${id}"]`);
  const label = panel ? panel.querySelector('.panel-label') : null;
  const icon = panel ? panel.querySelector('.panel-icon') : null;
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
AtomicApp.prototype._hideModeInfoModal = function () {
  const overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
};
/* Fechamento: botão ✕, toque no fundo escurecido ou Esc — mesmo
   contrato do modal de elemento do SITP. Ligado uma única vez. ── */
AtomicApp.prototype._bindModeInfoModal = function () {
  const overlay = document.getElementById('modeInfoOverlay');
  const closeBtn = document.getElementById('modeInfoClose');
  if (!overlay || !closeBtn) return;
  closeBtn.addEventListener('click', () => this._hideModeInfoModal());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) this._hideModeInfoModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('aberto')) this._hideModeInfoModal();
  });
};
