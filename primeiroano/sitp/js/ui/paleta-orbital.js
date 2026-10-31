/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: paleta-orbital.js
   ───────────────────────────────────────────────────────────────
   Lê e armazena em cache as cores atuais dos orbitais (s/p/d/f),
   recalculadas quando o tema muda.
   Depende de: core/cor-css-utils.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* =====================================================================
   PALETA DAS CORES DE BLOCO (s/p/d/f)
   ---------------------------------------------------------------------
   corAtomo() faz getComputedStyle() a cada chamada; com 118 cards isso
   custaria 118 recálculos de estilo. Daí o cache: as 4 cores de bloco
   são resolvidas uma vez por passada de repintura.
   Quem repinta é atualizarVisualPropriedade(), chamada na troca de modo
   e por redesenharCores() quando muda tema, daltonismo ou contraste.
   ===================================================================== */
let _paletaOrb = null;

function paletaOrbital(recalcular){
  if(recalcular || !_paletaOrb){
    _paletaOrb = { S:corAtomo('S'), P:corAtomo('P'), D:corAtomo('D'), F:corAtomo('F') };
  }
  return _paletaOrb;
}

