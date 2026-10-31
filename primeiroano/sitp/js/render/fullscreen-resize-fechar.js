/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO
   ARQUIVO: fullscreen-resize-fechar.js
   ───────────────────────────────────────────────────────────────
   Recalcula e redesenha a vista em tela cheia quando a janela muda
   de tamanho ou orientação (com debounce), e fecha a tela cheia.
   Depende de: render/fullscreen.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* As escalas são calculadas UMA vez, na abertura, a partir de
   window.innerWidth/innerHeight. Girar o celular ou redimensionar a
   janela deixava o desenho na escala antiga — pequeno demais ou
   estourando. _fsZ e _fsVista já eram guardados, mas ninguém os usava:
   agora servem para reabrir a mesma vista com as medidas novas.
   O debounce evita recalcular a cada pixel durante o arraste. */
let _fsResizeTimer = null;

function _fsRecalcular(){
  if(_fsZ === null || !_fsVista) return;           // fullscreen fechado
  abrirFullscreen(_fsVista, _fsZ, true);           // true = sem anúncio/foco
}

window.addEventListener('resize', ()=>{
  if(_fsZ === null) return;
  clearTimeout(_fsResizeTimer);
  _fsResizeTimer = setTimeout(_fsRecalcular, 180);
});

window.addEventListener('orientationchange', ()=>{
  if(_fsZ === null) return;
  clearTimeout(_fsResizeTimer);
  // a rotação só reporta as medidas novas depois do reflow
  _fsResizeTimer = setTimeout(_fsRecalcular, 320);
});

function fecharFullscreen(){
  const ov = document.getElementById('fullscreen-overlay');
  if(!ov) return;
  ov.classList.remove('aberto');
  ov.setAttribute('aria-hidden','true');
  _fsZ = null; _fsVista = null;
  anunciar('Tela cheia fechada.');
}

