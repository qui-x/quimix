/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (utilitário)
   ARQUIVO: cor.js
   ───────────────────────────────────────────────────────────────
   Conversão de cor hexadecimal (#rrggbb) para rgba() com opacidade
   — usado o tempo todo pelas rotinas de desenho no canvas.
   Depende de: nada.
   Usado por: js/simulation/*, js/phase-diagram/*, js/view3d/view3d.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ====================================================================
   4. COR
==================================================================== */
function hexRGB(hex){ const h=hex.replace('#',''); return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}; }

function rgba(hex,a){ const {r,g,b}=hexRGB(hex); return `rgba(${r},${g},${b},${a})`; }

