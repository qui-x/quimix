/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (interação)
   ARQUIVO: menu-mobile.js
   ───────────────────────────────────────────────────────────────
   Controla a abertura/fechamento das gavetas laterais em telas
   estreitas (botões ☰ e ⚙ no cabeçalho, com pano de fundo clicável).
   Depende de: nada além do HTML.
   Usado por: main.js.

   PADRONIZAÇÃO SILQ: faltavam três mecânicas que o SILQ (e o
   SIQI/SIMA/SIE) já tinham — fechar com Escape, fechar a gaveta
   esquerda sozinha ao escolher uma substância na lista (sem isso, no
   celular, a lista continuava cobrindo o experimento depois da
   escolha) e fechar por gesto de arrastar (swipe).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   MENU MOBILE
═══════════════════════════════════════════════════════ */
function initMobileMenu() {
  var btnL  = document.getElementById('mobile-menu-btn');
  var btnR  = document.getElementById('mobile-menu-btn-right');
  var left  = document.getElementById('sidebar-left');
  var right = document.getElementById('sidebar-right');
  var bd    = document.getElementById('mobile-backdrop');
  function fechar() {
    if (left)  left.classList.remove('mobile-open');
    if (right) right.classList.remove('mobile-open');
    if (bd)    bd.hidden = true;
    if (btnL)  btnL.setAttribute('aria-expanded','false');
    if (btnR)  btnR.setAttribute('aria-expanded','false');
  }
  if (btnL) btnL.addEventListener('click', function() {
    var aberto = left && left.classList.contains('mobile-open');
    fechar();
    if (!aberto && left) { left.classList.add('mobile-open'); if (bd) bd.hidden=false; btnL.setAttribute('aria-expanded','true'); }
  });
  if (btnR) btnR.addEventListener('click', function() {
    var aberto = right && right.classList.contains('mobile-open');
    fechar();
    if (!aberto && right) { right.classList.add('mobile-open'); if (bd) bd.hidden=false; btnR.setAttribute('aria-expanded','true'); }
  });
  if (bd) bd.addEventListener('click', fechar);

  // Fecha com Escape — mesmo padrão do SILQ/SIQI/SIMA/SIE.
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') fechar(); });

  // Fecha a gaveta esquerda ao escolher uma substância em telas estreitas
  // — mesmo padrão do SILQ (.bond-mode-btn) e do SIQI/SIMA (.sub-item /
  // .mode-activate-btn): a escolha já foi feita, a tela deve voltar para
  // o experimento sem exigir um segundo toque para fechar o menu.
  if (left) left.addEventListener('click', function(e) {
    if (e.target.closest && e.target.closest('.sub-item') && window.innerWidth <= 900) {
      setTimeout(fechar, 150);
    }
  });

  // Swipe para fechar (touch) — mesmo gesto do SILQ/SIQI.
  var touchStartX = 0, touchStartY = 0;
  document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (dy > 60) return;
    if (dx < -60 && left  && left.classList.contains('mobile-open'))  fechar();
    if (dx >  60 && right && right.classList.contains('mobile-open')) fechar();
  }, { passive: true });
}
