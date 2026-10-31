/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (independente do namespace SILQ)
   ARQUIVO: menu-mobile.js
   ───────────────────────────────────────────────────────────────
   As duas gavetas laterais em telas estreitas (☰ ligações/controles,
   🧪 tabela/moléculas/análise), com pano de fundo compartilhado.
   Mesmo padrão usado no SIEM/SIMA. Bloco independente, sem nenhuma
   referência a SILQ.*.
   Depende de: nada além do HTML.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const btnL = document.getElementById('mobile-menu-btn');
  const btnR = document.getElementById('mobile-menu-btn-right');
  const sideL = document.getElementById('sidebar-left');
  const sideR = document.getElementById('sidebar-right');
  const backdrop = document.getElementById('mobile-backdrop');
  if (!backdrop || (!sideL && !sideR)) return;

  function fechar(){
    if (sideL) sideL.classList.remove('mobile-open');
    if (sideR) sideR.classList.remove('mobile-open');
    backdrop.hidden = true;
    if (btnL) btnL.setAttribute('aria-expanded','false');
    if (btnR) btnR.setAttribute('aria-expanded','false');
  }
  function abrirEsq(){
    fechar();
    if (sideL) sideL.classList.add('mobile-open');
    backdrop.hidden = false;
    if (btnL) btnL.setAttribute('aria-expanded','true');
  }
  function abrirDir(){
    fechar();
    if (sideR) sideR.classList.add('mobile-open');
    backdrop.hidden = false;
    if (btnR) btnR.setAttribute('aria-expanded','true');
  }

  if (btnL) btnL.addEventListener('click', () => {
    sideL && sideL.classList.contains('mobile-open') ? fechar() : abrirEsq();
  });
  if (btnR) btnR.addEventListener('click', () => {
    sideR && sideR.classList.contains('mobile-open') ? fechar() : abrirDir();
  });
  backdrop.addEventListener('click', fechar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });

  // Fecha a gaveta esquerda ao ativar um modo de ligacao em telas estreitas.
  // .bond-order-btn e .wedge-btn sairam desta lista: esses controles foram
  // realocados para o painel CONTROLES, na gaveta da DIREITA.
  if (sideL) sideL.addEventListener('click', (e) => {
    if (e.target.closest('.bond-mode-btn') && window.innerWidth <= 900) {
      setTimeout(fechar, 150);
    }
  });
  // Fecha a gaveta direita ao escolher um atomo/preset em telas estreitas.
  // Os controles de ordem/cunha NAO fecham a gaveta: quem ajusta ordem ou
  // cunha costuma ajustar varios seguidos, fechar a cada clique atrapalha.
  if (sideR) sideR.addEventListener('click', (e) => {
    if (e.target.closest('.mol-preset-card, .mol-cat-btn, .pt-cell') && window.innerWidth <= 900) {
      setTimeout(fechar, 150);
    }
  });

  // Swipe para fechar (touch)
  let touchStartX = 0, touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (dy > 60) return;
    if (dx < -60 && sideL && sideL.classList.contains('mobile-open')) fechar();
    if (dx >  60 && sideR && sideR.classList.contains('mobile-open')) fechar();
  }, { passive: true });

  window._closeSidebars = fechar;
});

