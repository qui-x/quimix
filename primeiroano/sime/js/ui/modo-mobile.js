/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE — Barra de modos mobile + modal de 1ª ativação
   ARQUIVO: modo-mobile.js
   ───────────────────────────────────────────────────────────────
   Funções globais (mesmo estilo de painel-modulos.js: sem objeto de
   namespace único): buildModeTabsMobile, modeSummaryHTML,
   syncMobileModeUI, showModeInfoModal, hideModeInfoModal,
   bindModeInfoModal.

   Como no SIEM (mesmo par de simuladores, mesma decisão): não existe
   um "bottom sheet de controles do módulo" — a sidebar direita
   (Substância/Controles/Estado & Medidas) é a mesma pra qualquer
   módulo, só destrava com `inert`, então a única superfície pra
   informação de "1ª ativação" é o MODAL, sem resumo companheiro.

   Depende de: o HTML da #sidebar-left já montado (os 3 cards de
               módulo são estáticos).
   Usado por: js/ui/painel-modulos.js (chama syncMobileModeUI dentro
              de alternarModulo()).
═══════════════════════════════════════════════════════════════ */

'use strict';

var _modosVistosSime = new Set();

/* ── barra de módulos MOBILE — lê a ordem e os dados direto dos 3
   cards já existentes em #sidebar-left. Clicar delega pro MESMO
   botão .mode-activate-btn de dentro do card. ── */
function buildModeTabsMobile() {
  var bar = document.getElementById('mode-tabs-mobile');
  if (!bar) return;
  document.querySelectorAll('#sidebar-left .panel--mode[data-modulo]').forEach(function (panel) {
    var header = panel.querySelector('.panel-header');
    var activateBtn = panel.querySelector('.mode-activate-btn[data-modulo-ativar]');
    if (!header || !activateBtn) return;
    var id = activateBtn.dataset.moduloAtivar;
    var icon = header.querySelector('.panel-icon');
    var label = header.querySelector('.panel-label');
    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'mode-tab';
    tab.dataset.modeTab = id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.innerHTML = '<span aria-hidden="true">' + (icon ? icon.innerHTML : '') + '</span><span>' + (label ? label.textContent : id) + '</span>';
    tab.title = label ? label.textContent : id;
    tab.addEventListener('click', function () { activateBtn.click(); });
    bar.appendChild(tab);
  });
}

/* ── resumo do módulo, pro modal: reaproveita .mode-define e
   .fact-grid que já existem no card da sidebar esquerda. ── */
function modeSummaryHTML(id) {
  var panel = document.querySelector('#sidebar-left .panel--mode[data-modulo="' + id + '"]');
  if (!panel) return '';
  var html = '';
  var def = panel.querySelector('.mode-define');
  if (def) html += '<p class="mode-define">' + def.innerHTML + '</p>';
  var grid = panel.querySelector('.fact-grid');
  if (grid) html += grid.outerHTML;
  return html;
}

/* ── sincroniza a barra de módulos com o módulo ativo — chamada de
   dentro de alternarModulo() em painel-modulos.js. ── */
function syncMobileModeUI(id) {
  document.querySelectorAll('.mode-tab').forEach(function (tab) {
    tab.setAttribute('aria-selected', tab.dataset.modeTab === id ? 'true' : 'false');
  });
  var activeTab = id && document.querySelector('.mode-tab[data-mode-tab="' + id + '"]');
  if (activeTab && typeof activeTab.scrollIntoView === 'function') {
    var reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduzido ? 'auto' : 'smooth' });
  }
  if (!id) return;
  var primeiraVez = !_modosVistosSime.has(id);
  _modosVistosSime.add(id);
  if (primeiraVez && window.innerWidth <= 900) showModeInfoModal(id);
}

/* ── MODAL de informações do módulo (1ª ativação, mobile) ── */
function showModeInfoModal(id) {
  var overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  var panel = document.querySelector('#sidebar-left .panel--mode[data-modulo="' + id + '"]');
  var header = panel ? panel.querySelector('.panel-header') : null;
  var label = header ? header.querySelector('.panel-label') : null;
  var icon = header ? header.querySelector('.panel-icon') : null;
  var iconEl = document.getElementById('modeInfoIcon');
  var title = document.getElementById('modeInfoTitle');
  var body = document.getElementById('modeInfoBody');
  var closeBtn = document.getElementById('modeInfoClose');
  if (iconEl) iconEl.innerHTML = icon ? icon.innerHTML : '';
  if (title) title.textContent = label ? label.textContent : id;
  if (body) body.innerHTML = modeSummaryHTML(id);
  overlay.classList.add('aberto');
  overlay.setAttribute('aria-hidden', 'false');
  if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 220);
}
function hideModeInfoModal() {
  var overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
}
function bindModeInfoModal() {
  var overlay = document.getElementById('modeInfoOverlay');
  var closeBtn = document.getElementById('modeInfoClose');
  if (!overlay || !closeBtn) return;
  closeBtn.addEventListener('click', function () { hideModeInfoModal(); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) hideModeInfoModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('aberto')) hideModeInfoModal();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  buildModeTabsMobile();
  bindModeInfoModal();
});
