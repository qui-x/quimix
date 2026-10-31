/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (independente do resto do SIFI)
   ARQUIVO: sidebar-resizer.js
   ───────────────────────────────────────────────────────────────
   Alça de arraste nas bordas das sidebars, com largura salva em
   localStorage — mesmo padrão do SILQ/SIEM/SIME/SIE/SIQI.

   LACUNA FECHADA: a folha de estilos já trazia toda a aparência
   pronta (.sidebar-resizer, .sidebar-resizer--left/--right, o estado
   .dragging e o `display:none` no modo gaveta em @media max-width:
   900px — ver comentário logo acima de `:root{ --sl:...; --sr:...; }`
   em sifi-styles.css), mas nenhum arquivo JS criava a alça nem
   escutava o arraste: o SIFI era, junto com o SIQI, o único da
   família sem redimensionar de sidebar. Este arquivo fecha essa
   lacuna, sem alterar nada do CSS que já existia.
   Depende de: nada além do HTML/CSS.
   Usado por: carregado diretamente pela página (ver indexsifi.html).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var targets = [
    { id: 'sidebar-left',  side: 'left',  cssVar: '--sl', min: 240, max: 480 },
    { id: 'sidebar-right', side: 'right', cssVar: '--sr', min: 280, max: 560 }
  ];
  var root = document.documentElement;
  var rafPending = false;

  function fireResize() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      window.dispatchEvent(new Event('resize'));
    });
  }

  targets.forEach(function (cfg) {
    var el = document.getElementById(cfg.id);
    if (!el) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

    var storeKey = 'sifi-w-' + cfg.cssVar.replace(/^--/, '');
    try {
      var saved = parseInt(localStorage.getItem(storeKey), 10);
      if (saved && saved >= cfg.min && saved <= cfg.max) {
        root.style.setProperty(cfg.cssVar, saved + 'px');
      }
    } catch (e) { /* localStorage indisponível — segue sem persistência */ }

    var handle = document.createElement('div');
    handle.className = 'sidebar-resizer sidebar-resizer--' + cfg.side;
    handle.setAttribute('aria-hidden', 'true');
    el.appendChild(handle);

    var dragging = false, startX = 0, startW = 0;

    handle.addEventListener('pointerdown', function (e) {
      if (getComputedStyle(el).position === 'fixed') return;
      dragging = true;
      startX = e.clientX;
      startW = el.getBoundingClientRect().width;
      handle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });

    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var delta = e.clientX - startX;
      var w = cfg.side === 'left' ? startW + delta : startW - delta;
      w = Math.max(cfg.min, Math.min(cfg.max, Math.round(w)));
      root.style.setProperty(cfg.cssVar, w + 'px');
      fireResize();
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem(storeKey, Math.round(el.getBoundingClientRect().width));
      } catch (e) { /* sem persistência */ }
      fireResize();
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  });
});
