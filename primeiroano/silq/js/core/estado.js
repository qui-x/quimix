/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (estado mutável em tempo de execução)
   ARQUIVO: estado.js
   ───────────────────────────────────────────────────────────────
   Os átomos e ligações do canvas (canvasAtoms, bonds), o "mar de
   elétrons" da ligação metálica, contadores, flags de modo (3D
   ativo, física pausada, geometria travada, filtro de ligação ativo)
   e as constantes físicas da simulação (escala, damping, rigidez de
   mola, repulsão).

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
     1. BASE DE DADOS — 118 ELEMENTOS
     =================================================================== */
  /* ELEMENTS: movido para dadossilq.js (carregado antes deste arquivo) */

  /* ===================================================================
     2. LAYOUT DA TABELA PERIÓDICA
     =================================================================== */
  /* PT_GRID: movido para dadossilq.js (carregado antes deste arquivo) */
  /* FBLOCK: movido para dadossilq.js (carregado antes deste arquivo) */
  /* CATEGORY_INFO: movido para dadossilq.js (carregado antes deste arquivo) */

  /* ===================================================================
     3. ESTADO GLOBAL
     =================================================================== */
  SILQ.canvasAtoms        = [];

  SILQ.bonds              = [];

  SILQ.seaElectrons       = [];

  SILQ.interactionArcs    = [];

  SILQ.idCounter          = 0;

  SILQ.is3DActive         = false;

  SILQ.activeCategoryFilter = null;

  SILQ.physicsEnabled     = true;

  SILQ.simLoop            = null;

  /* frozenGeometry: quando true, o physicsTick NÃO move átomos nem chama
     checkAllBonds. Ativado ao montar um preset; desativado quando o
     usuário arrasta um átomo ou clica em "Ativar Física" manualmente.  */
  SILQ.frozenGeometry     = false;

  /* activeBondFilter: quando definido ('covalent'|'ionic'|'metallic'),
     força determineBondType a retornar apenas aquele tipo de ligação,
     isolando as interações do canvas por módulo.                      */
  SILQ.activeBondFilter   = null;

  /* wedgeDirection: direção da cunha para a PRÓXIMA ligação criada manualmente.
     'auto'  → o view3dsilq.js decide pela geometria 3D (padrão)
     'front' → força dzRel > THRESH (cunha sólida, vem para frente)
     'back'  → força dzRel < -THRESH (cunha tracejada, vai para trás)
     'plane' → força dzRel = 0 (linha plana, no plano)              */
  SILQ.wedgeDirection = 'auto';

  SILQ.SCALE     = 0.7;

  SILQ.PHYS_DT   = 16;

  SILQ.DAMPING   = 0.78;

  SILQ.SNAP_K    = 0.18;

  SILQ.REP_K     = 120;
});


