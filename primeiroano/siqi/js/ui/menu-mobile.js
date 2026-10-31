/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: menu-mobile.js
   ───────────────────────────────────────────────────────────────
   As duas gavetas laterais em telas estreitas (☰ módulos, ⚙
   propriedades/laboratório), com pano de fundo compartilhado.
   Depende de: nada além do HTML.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   7. MOBILE OFF-CANVAS — mesmo padrão SIEM
════════════════════════════════════════════════════════════════ */
function initMobile(){
  var btnL=$('mobile-menu-btn'), btnR=$('mobile-menu-btn-right');
  var sideL=$('sidebar-left'), sideR=$('sidebar-right');
  var bkdp=$('mobile-backdrop');

  function fechar(){
    if(sideL) sideL.classList.remove('mobile-open');
    if(sideR) sideR.classList.remove('mobile-open');
    if(bkdp) bkdp.hidden=true;
    if(btnL) btnL.setAttribute('aria-expanded','false');
    if(btnR) btnR.setAttribute('aria-expanded','false');
  }

  function abrirEsq(){
    fechar();
    if(sideL) sideL.classList.add('mobile-open');
    if(bkdp) bkdp.hidden=false;
    if(btnL) btnL.setAttribute('aria-expanded','true');
  }
  function abrirDir(){
    fechar();
    if(sideR) sideR.classList.add('mobile-open');
    if(bkdp) bkdp.hidden=false;
    if(btnR) btnR.setAttribute('aria-expanded','true');
  }

  if(btnL) btnL.addEventListener('click',function(){
    sideL&&sideL.classList.contains('mobile-open') ? fechar() : abrirEsq();
  });
  if(btnR) btnR.addEventListener('click',function(){
    sideR&&sideR.classList.contains('mobile-open') ? fechar() : abrirDir();
  });
  if(bkdp) bkdp.addEventListener('click', fechar);

  /* Fechar ao pressionar Escape */
  document.addEventListener('keydown', function(e){
    if(e.key==='Escape') fechar();
  });

  /* Fechar sidebar esquerda ao selecionar composto em mobile */
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('.sub-item')){
      var isMobile = window.innerWidth <= 900;
      if(isMobile) setTimeout(fechar, 150);
    }
  });

  /* Swipe para fechar sidebars (touch) */
  var touchStartX=0, touchStartY=0;
  document.addEventListener('touchstart', function(e){
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if(dy > 60) return; /* swipe vertical, ignorar */
    /* Swipe left fecha sidebar esquerda */
    if(dx < -60 && sideL && sideL.classList.contains('mobile-open')) fechar();
    /* Swipe right fecha sidebar direita */
    if(dx > 60 && sideR && sideR.classList.contains('mobile-open'))  fechar();
  }, {passive:true});

  /* Expõe fechar globalmente */
  window._closeSidebars = fechar;
}

