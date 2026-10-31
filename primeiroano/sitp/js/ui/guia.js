/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: guia.js
   ───────────────────────────────────────────────────────────────
   Abre/fecha o guia de leitura do card (explica cada campo de um
   elemento) e os atalhos de teclado Esc para fechar o guia e a tela
   cheia.
   Depende de: nada além do HTML.
═══════════════════════════════════════════════════════════════ */

'use strict';

function abrirGuia(){
  const ov = document.getElementById('guiaOverlay');
  ov.classList.add('aberto');
  ov.setAttribute('aria-hidden','false');
  document.getElementById('btnGuiaClose').focus();
  anunciar('Guia de leitura do card aberto.');
}

function fecharGuia(){
  const ov = document.getElementById('guiaOverlay');
  ov.classList.remove('aberto');
  ov.setAttribute('aria-hidden','true');
  anunciar('Guia fechado.');
}

document.getElementById('btnGuiaClose').addEventListener('click', fecharGuia);

document.getElementById('guiaOverlay').addEventListener('click', e => {
  if(e.target === document.getElementById('guiaOverlay')) fecharGuia();
});

document.addEventListener('keydown', e => {
  if(e.key==='Escape' && document.getElementById('guiaOverlay').classList.contains('aberto')) fecharGuia();
});

document.getElementById('guiaOverlay').addEventListener('keydown', e => {
  if(e.key!=='Tab') return;
  const foc = [...document.getElementById('guiaOverlay')
    .querySelectorAll('button,[tabindex="0"],[href]')].filter(el=>!el.disabled);
  if(!foc.length) return;
  const first=foc[0], last=foc[foc.length-1];
  if(e.shiftKey){ if(document.activeElement===first){e.preventDefault();last.focus();} }
  else          { if(document.activeElement===last) {e.preventDefault();first.focus();} }
});

document.addEventListener('keydown', e => {
  if(e.key==='Escape' && document.getElementById('fullscreen-overlay')?.classList.contains('aberto')) fecharFullscreen();
});

document.getElementById('fullscreen-overlay')?.addEventListener('click', e => {
  if(e.target === document.getElementById('fullscreen-overlay')) fecharFullscreen();
});

