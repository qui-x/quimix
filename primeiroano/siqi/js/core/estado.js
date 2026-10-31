/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: estado.js
   ───────────────────────────────────────────────────────────────
   STATE — o objeto de estado global do módulo Nomenclatura/Lab
   (composto atual, filtro ativo, termo de busca).
   Depende de: nada. Usado por: praticamente todo o módulo 1.
═══════════════════════════════════════════════════════════════ */

'use strict';

var STATE = {
  compostoAtual: null,
  desbloqueados: carregarDesbloqueados(),
  expAtual: null,
  hintIdx: 0,
  dicasUsadas: 0,
  expConcluidos: [],
  aguardandoResposta: false,
  catAtiva: 'todos',
  modoView: 'none',
};

