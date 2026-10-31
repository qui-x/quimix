/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: cores-estado.js
   ───────────────────────────────────────────────────────────────
   Cor do estado físico (sólido/líquido/gasoso) e cor de categoria
   química, conforme o tema ativo (claro/escuro).
   Depende de: dadossitp.js (ESTADO_HEX_DARK/LIGHT, CAT_COLOR_*).
═══════════════════════════════════════════════════════════════ */

'use strict';

// Escolhe a paleta de estado fisico conforme o tema. Le ESTADO_HEX_DARK /
// ESTADO_HEX_LIGHT de dadossitp.js.
function getEstadoHex(est){
  const isLight = document.documentElement.getAttribute('data-theme')==='light';
  return (isLight ? ESTADO_HEX_LIGHT : ESTADO_HEX_DARK)[est] || '#888';
}

// Escolhe a paleta de categoria conforme daltonismo/tema. Le
// CAT_COLOR_HEX_DALT / _LIGHT / _DARK de dadossitp.js.
function getCatColorHex(cat){
  // Duas fontes possíveis pro mesmo dado: data-colorblind é o nome que
  // o a11y.js (compartilhado pelas 25 páginas do projeto) usa; esta
  // página tinha o próprio receptor legado (preferencias.js, de antes
  // do a11y.js existir) que usa data-daltonico. Sem checar os dois, a
  // paleta segura pra daltonismo nunca era escolhida quando quem
  // aplicava o estado era o a11y.js — o valor calhava sempre vazio.
  let dalt = document.documentElement.getAttribute('data-colorblind')
    || document.documentElement.getAttribute('data-daltonico');
  // Mesma normalização de preferencias.js: não existe paleta segura
  // própria pra acromatopsia aqui — usa a de deuteranopia no lugar.
  if(dalt === 'acromatopsia') dalt = 'deuteranopia';
  if(dalt && CAT_COLOR_HEX_DALT[dalt]){
    return CAT_COLOR_HEX_DALT[dalt][cat] || '#888';
  }
  const isLight = document.documentElement.getAttribute('data-theme')==='light';
  return (isLight ? CAT_COLOR_HEX_LIGHT : CAT_COLOR_HEX_DARK)[cat] || '#888';
}

