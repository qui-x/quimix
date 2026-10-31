/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (utilitário)
   ARQUIVO: cor-css-utils.js
   ───────────────────────────────────────────────────────────────
   Resolve uma variável CSS (ex: --accent-main) para o valor de cor
   real computado pelo navegador, e converte esse valor (formato
   rgb()) para hexadecimal.
   Depende de: nada (lê estilos computados em runtime).
═══════════════════════════════════════════════════════════════ */

'use strict';

function resolverCorCSS(cssVar){
  const val = getComputedStyle(document.documentElement)
                .getPropertyValue(cssVar.replace('var(','').replace(')','').trim())
                .trim();
  return val || '#888';
}

function rgbToHex(str){
  if(!str) return '#888888';
  if(str.startsWith('#')) return str;
  const m = str.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if(m) return '#'+[m[1],m[2],m[3]].map(v=>parseInt(v).toString(16).padStart(2,'0')).join('');
  return '#888888';
}

