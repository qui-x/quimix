/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (referências de DOM)
   ARQUIVO: dom-refs.js
   ───────────────────────────────────────────────────────────────
   Todas as referências a elementos do HTML buscadas uma única vez
   (canvas, painéis, botões, tabela periódica, tooltip...) — o
   restante do código lê SILQ.canvas, SILQ.btnReset etc. em vez de
   repetir document.getElementById.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/namespace.js.
   Usado por: praticamente todos os módulos.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     4. DOM REFS
     =================================================================== */
  SILQ.canvas        = document.getElementById('canvas');

  SILQ.canvasHint    = document.getElementById('canvas-hint');

  SILQ.svgEl         = document.getElementById('bond-svg');

  SILQ.infoText      = document.getElementById('info-text');

  SILQ.energyCaption = document.getElementById('energy-caption');

  SILQ.viewer3dEl    = document.getElementById('viewer3d');

  SILQ.canvasWrapper = document.getElementById('canvas-wrapper');

  SILQ.btnReset      = document.getElementById('btn-reset');

  SILQ.btn3D         = document.getElementById('btn-toggle-3d');

  SILQ.searchInput   = document.getElementById('element-search');

  SILQ.tooltip       = document.getElementById('el-tooltip');

  SILQ.ptGrid        = document.getElementById('periodic-table');

  SILQ.fblockGrid    = document.getElementById('fblock-table');

  SILQ.ptLegend      = document.getElementById('pt-legend');

  SILQ.molPanel      = document.getElementById('mol-panel');

  SILQ.molFormula    = document.getElementById('mol-formula');

  SILQ.molStats      = document.getElementById('mol-stats');

  SILQ.btnPhysics    = document.getElementById('btn-physics');

  SILQ.btnSnap       = document.getElementById('btn-snap');
});


