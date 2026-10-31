/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (independente do namespace SIFI)
   ARQUIVO: menu-mobile.js
   ORIGEM:  REAPROVEITADO do SILQ (js/ui/menu-mobile.js) SEM NENHUMA
            ALTERAÇÃO. Isto só foi possível porque o arquivo original
            já era desacoplado — nunca lê nem escreve em SILQ.*, só
            mexe em elementos de HTML por id/classe. Como o SIFI usa
            os MESMOS ids (sidebar-left, sidebar-right, mobile-backdrop,
            mobile-menu-btn, mobile-menu-btn-right), o arquivo funciona
            aqui sem trocar uma linha.
   ───────────────────────────────────────────────────────────────
   As duas gavetas laterais em telas estreitas (menu de moléculas,
   força detectada), com um pano de fundo escurecido (backdrop)
   compartilhado entre as duas. Fecha ao: clicar no backdrop, apertar
   Esc, arrastar o dedo (swipe) para o lado, ou escolher uma molécula/
   ver o resultado em telas ≤900px.
   Depende de: nada além do HTML (ids: mobile-menu-btn,
              mobile-menu-btn-right, sidebar-left, sidebar-right,
              mobile-backdrop).
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

  // Fecha a gaveta esquerda ao escolher uma molécula em telas estreitas
  // (equivalente, no SIFI, ao "escolher um modo de ligação" do SILQ).
  if (sideL) sideL.addEventListener('click', (e) => {
    if (e.target.closest('.mol-preset-card') && window.innerWidth <= 900) {
      setTimeout(fechar, 150);
    }
  });
  // A gaveta direita (Força Detectada) fica aberta — o usuário costuma
  // querer ver o resultado enquanto ainda está arrastando na caixa de
  // areia, então não fechamos sozinha aqui.

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
