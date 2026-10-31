/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE — Barra de modos mobile + modal de 1ª ativação
   ARQUIVO: modo-mobile.js
   ───────────────────────────────────────────────────────────────
   Funções globais (este projeto não usa um objeto de namespace
   único, ao contrário do SILQ/SIEQ): buildModeTabsMobile,
   modeSummaryHTML, syncMobileModeUI, showModeInfoModal,
   hideModeInfoModal, bindModeInfoModal.

   Não há "bottom sheet de controles do módulo" aqui — a sidebar
   direita (propriedades/laboratório) é a mesma pra qualquer módulo,
   então a única superfície pra informação de "1ª ativação" é o
   MODAL, sem resumo companheiro.

   Depende de: o HTML da #sidebar-left já montado (os cards de
               módulo — Construtor, Nomenclatura — são estáticos).
   Usado por: js/modulos/alternar.js (chama syncMobileModeUI dentro
              de trocarModulo()/desativarModulo()).
═══════════════════════════════════════════════════════════════ */

'use strict';

var _modosVistosSiqi = new Set();

/* ── barra de módulos MOBILE — lê a ordem e os dados direto dos
   cards já existentes em #sidebar-left. Clicar delega pro MESMO
   botão .mode-activate-btn de dentro do card. ── */
function buildModeTabsMobile() {
  var bar = document.getElementById('mode-tabs-mobile');
  if (!bar) return;
  document.querySelectorAll('#sidebar-left [data-mode-card]').forEach(function (panel) {
    var header = panel.querySelector('.panel-header');
    var activateBtn = panel.querySelector('.mode-activate-btn[data-module]');
    if (!header || !activateBtn) return;
    var icon = header.querySelector('.panel-icon');
    var label = header.querySelector('.panel-label');
    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'mode-tab';
    tab.dataset.modeTab = activateBtn.dataset.module;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.innerHTML = '<span aria-hidden="true">' + (icon ? icon.innerHTML : '') + '</span><span>' + (label ? label.textContent : activateBtn.dataset.module) + '</span>';
    tab.title = label ? label.textContent : activateBtn.dataset.module;
    tab.addEventListener('click', function () { activateBtn.click(); });
    bar.appendChild(tab);
  });
}

/* ── resumo do módulo, pro modal: reaproveita o parágrafo
   .mode-define e a grade .fact-grid que já existem no card da
   sidebar esquerda (clonados, não recriados). ── */
function modeSummaryHTML(id) {
  var btn = document.querySelector('#sidebar-left .mode-activate-btn[data-module="' + id + '"]');
  var panel = btn ? btn.closest('.panel') : null;
  if (!panel) return '';
  var html = '';
  var def = panel.querySelector('.mode-define');
  if (def) html += '<p class="mode-define">' + def.innerHTML + '</p>';
  var grid = panel.querySelector('.fact-grid');
  if (grid) html += grid.outerHTML;
  return html;
}

/* ── sincroniza a barra de módulos com o módulo ativo — chamada por
   trocarModulo()/desativarModulo() em modulos/alternar.js. ── */
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
  var primeiraVez = !_modosVistosSiqi.has(id);
  _modosVistosSiqi.add(id);
  if (primeiraVez && window.innerWidth <= 900) showModeInfoModal(id);
}

/* ── MODAL de informações do módulo (1ª ativação, mobile) ── */
function showModeInfoModal(id) {
  var overlay = document.getElementById('modeInfoOverlay');
  if (!overlay) return;
  var btn = document.querySelector('#sidebar-left .mode-activate-btn[data-module="' + id + '"]');
  var panel = btn ? btn.closest('.panel') : null;
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
