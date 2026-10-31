/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE — Barra de modos mobile + modal de 1ª ativação
   ARQUIVO: modo-mobile.js
   ───────────────────────────────────────────────────────────────
   Adiciona ao namespace SIFI: buildModeTabsMobile, modeSummaryHTML,
   syncMobileModeUI, showModeInfoModal, hideModeInfoModal,
   bindModeInfoModal.

   Mesmo critério do SILQ (de onde o SIFI foi adaptado): não existe
   um "bottom sheet de controles do módulo" — a sidebar direita
   (biblioteca de compostos / força detectada) é a mesma pra
   qualquer módulo, então a única superfície pra informação de "1ª
   ativação" é o MODAL, sem resumo companheiro.

   Depende de: js/ui/icones.js (os ícones de cada módulo já devem
               estar preenchidos em .panel-icon quando este arquivo
               roda — ver ordem de carga no HTML), o HTML da
               #sidebar-left já montado.
   Usado por: js/init/ativacao-modulos.js (chama syncMobileModeUI
              dentro de setActiveModule()/clearActiveModule()).
═══════════════════════════════════════════════════════════════ */

'use strict';

SIFI._modosVistos = SIFI._modosVistos || new Set();

/* ── barra de módulos MOBILE — lê a ordem e os dados direto dos 3
   cards já existentes em #sidebar-left. Clicar delega pro MESMO
   botão .bond-mode-btn de dentro do card. ── */
SIFI.buildModeTabsMobile = function () {
  const bar = document.getElementById('mode-tabs-mobile');
  if (!bar) return;
  document.querySelectorAll('#sidebar-left [data-mode-card]').forEach(header => {
    const panel = header.closest('.panel');
    const activateBtn = panel ? panel.querySelector('.bond-mode-btn[data-module]') : null;
    if (!activateBtn) return;
    const id = activateBtn.dataset.module;
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
   .fact-grid (ou o parágrafo/lista equivalente) que já existem no
   card da sidebar esquerda. ── */
SIFI.modeSummaryHTML = function (id) {
  const btn = document.querySelector(`#sidebar-left .bond-mode-btn[data-module="${id}"]`);
  const panel = btn ? btn.closest('.panel') : null;
  if (!panel) return '';
  let html = '';
  const def = panel.querySelector('.mode-define, .bond-type-desc');
  if (def) html += `<p class="mode-define">${def.innerHTML}</p>`;
  const grid = panel.querySelector('.fact-grid, .bond-info-grid');
  if (grid) html += grid.outerHTML;
  return html;
};

/* ── sincroniza a barra de módulos com o módulo ativo — chamada de
   dentro do listener de clique em ativacao-modulos.js. ── */
SIFI.syncMobileModeUI = function (num) {
  const id = num == null ? null : String(num);
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.setAttribute('aria-selected', tab.dataset.modeTab === id ? 'true' : 'false');
  });
  const activeTab = id && document.querySelector(`.mode-tab[data-mode-tab="${id}"]`);
  if (activeTab && typeof activeTab.scrollIntoView === 'function') {
    const reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduzido ? 'auto' : 'smooth' });
  }
  if (!id) return;
  const primeiraVez = !SIFI._modosVistos.has(id);
  SIFI._modosVistos.add(id);
  if (primeiraVez && window.innerWidth <= 900) SIFI.showModeInfoModal(id);
};

/* ── MODAL de informações do módulo (1ª ativação, mobile) ── */
SIFI.showModeInfoModal = function (id) {
  const overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  const btn = document.querySelector(`#sidebar-left .bond-mode-btn[data-module="${id}"]`);
  const panel = btn ? btn.closest('.panel') : null;
  const header = panel ? panel.querySelector('.panel-header') : null;
  const label = header ? header.querySelector('.panel-label') : null;
  const icon = header ? header.querySelector('.panel-icon') : null;
  const iconEl = document.getElementById('modeInfoIcon');
  const title = document.getElementById('modeInfoTitle');
  const body = document.getElementById('modeInfoBody');
  const closeBtn = document.getElementById('modeInfoClose');
  if (iconEl) iconEl.innerHTML = icon ? icon.innerHTML : '';
  if (title) title.textContent = label ? label.textContent : id;
  if (body) body.innerHTML = SIFI.modeSummaryHTML(id);
  overlay.classList.add('aberto');
  overlay.setAttribute('aria-hidden', 'false');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 220);
};
SIFI.hideModeInfoModal = function () {
  const overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
};
SIFI.bindModeInfoModal = function () {
  const overlay = document.getElementById('modeInfoOverlay');
  const closeBtn = document.getElementById('modeInfoClose');
  if (!overlay || !closeBtn) return;
  closeBtn.addEventListener('click', () => SIFI.hideModeInfoModal());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) SIFI.hideModeInfoModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('aberto')) SIFI.hideModeInfoModal();
  });
};

document.addEventListener('DOMContentLoaded', () => {
  SIFI.buildModeTabsMobile();
  SIFI.bindModeInfoModal();
});
