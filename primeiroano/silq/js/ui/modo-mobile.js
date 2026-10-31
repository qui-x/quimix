/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE — Barra de modos mobile + modal de 1ª ativação
   ARQUIVO: modo-mobile.js
   ───────────────────────────────────────────────────────────────
   Adiciona ao namespace SILQ: buildModeTabsMobile, modeSummaryHTML,
   syncMobileModeUI, showModeInfoModal, hideModeInfoModal,
   bindModeInfoModal.

   Diferente da família de 2º ano e do SIMA: aqui não existe um
   "bottom sheet de controles do modo" — a sidebar direita (tabela
   periódica, moléculas, análise) é independente de qual tipo de
   ligação está ativo, então a única superfície pra mostrar a
   informação de "1ª ativação" é o MODAL — sem um resumo companheiro
   recolhido em lugar nenhum (não haveria onde colocá-lo).

   Depende de: core/namespace.js (SILQ já deve existir), o HTML da
               #sidebar-left já montado (os 3 cards de tipo de
               ligação são estáticos).
   Usado por: init/inicializacao-final.js (chama syncMobileModeUI/
              showModeInfoModal dentro de setMode()).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── barra de tipos de ligação MOBILE — lê a ordem e os dados direto
   dos 3 cards já existentes em #sidebar-left. Clicar delega pro
   MESMO botão .bond-mode-btn de dentro do card (dispara o click
   real, sem duplicar a lógica de setMode/clearMode). ── */
SILQ.buildModeTabsMobile = function () {
  const bar = document.getElementById('mode-tabs-mobile');
  if (!bar) return;
  document.querySelectorAll('#sidebar-left [data-mode-card]').forEach(header => {
    const panel = header.closest('.panel');
    const activateBtn = panel ? panel.querySelector('.bond-mode-btn') : null;
    if (!activateBtn) return;
    const id = activateBtn.dataset.bondType;
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

/* ── resumo do tipo de ligação, pro modal: reaproveita o parágrafo
   .bond-type-desc e a grade .bond-info-grid que já existem no card
   da sidebar esquerda (clonados, não recriados). ── */
SILQ.modeSummaryHTML = function (id) {
  const panel = document.querySelector(`#sidebar-left [data-bond-type="${id}"]`)?.closest('.panel');
  if (!panel) return '';
  let html = '';
  const desc = panel.querySelector('.bond-type-desc');
  if (desc) html += `<p class="mode-define">${desc.innerHTML}</p>`;
  const grid = panel.querySelector('.bond-info-grid');
  if (grid) html += grid.outerHTML;
  return html;
};

/* ── sincroniza a barra de tipos de ligação com o modo ativo —
   chamada por setMode()/clearMode() em inicializacao-final.js. ── */
SILQ.syncMobileModeUI = function (id) {
  document.querySelectorAll('.mode-tab').forEach(tab => {
    tab.setAttribute('aria-selected', tab.dataset.modeTab === id ? 'true' : 'false');
  });
  const activeTab = id && document.querySelector(`.mode-tab[data-mode-tab="${id}"]`);
  if (activeTab && typeof activeTab.scrollIntoView === 'function') {
    activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: SILQ.prefersReducedMotion ? 'auto' : 'smooth' });
  }
  if (!id) return;
  SILQ._modosVistos = SILQ._modosVistos || new Set();
  const primeiraVez = !SILQ._modosVistos.has(id);
  SILQ._modosVistos.add(id);
  if (primeiraVez && window.innerWidth <= 900) SILQ.showModeInfoModal(id);
};

/* ── MODAL de informações do tipo de ligação (1ª ativação, mobile) ── */
SILQ.showModeInfoModal = function (id) {
  const overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  const panel = document.querySelector(`#sidebar-left [data-bond-type="${id}"]`)?.closest('.panel');
  const header = panel ? panel.querySelector('.panel-header') : null;
  const label = header ? header.querySelector('.panel-label') : null;
  const icon = header ? header.querySelector('.panel-icon') : null;
  const iconEl = document.getElementById('modeInfoIcon');
  const title = document.getElementById('modeInfoTitle');
  const body = document.getElementById('modeInfoBody');
  const closeBtn = document.getElementById('modeInfoClose');
  if (iconEl) iconEl.innerHTML = icon ? icon.innerHTML : '';
  if (title) title.textContent = label ? label.textContent : id;
  if (body) body.innerHTML = SILQ.modeSummaryHTML(id);
  overlay.classList.add('aberto');
  overlay.setAttribute('aria-hidden', 'false');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 220);
};
SILQ.hideModeInfoModal = function () {
  const overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
};
SILQ.bindModeInfoModal = function () {
  const overlay = document.getElementById('modeInfoOverlay');
  const closeBtn = document.getElementById('modeInfoClose');
  if (!overlay || !closeBtn) return;
  closeBtn.addEventListener('click', () => SILQ.hideModeInfoModal());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) SILQ.hideModeInfoModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('aberto')) SILQ.hideModeInfoModal();
  });
};

// Auto-inicialização: independente da ordem de carga em relação a
// inicializacao-final.js (só precisa do DOM pronto, não de nenhum
// outro módulo SILQ.*).
document.addEventListener('DOMContentLoaded', () => {
  SILQ.buildModeTabsMobile();
  SILQ.bindModeInfoModal();
});
