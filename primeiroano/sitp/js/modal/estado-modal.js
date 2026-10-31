/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODAL (estado)
   ARQUIVO: estado-modal.js
   ───────────────────────────────────────────────────────────────
   O estado do modal de elemento: quais séries (lantanídeos/
   actinídeos) estão expandidas, elemento/célula em foco, filtros
   ativos, e a referência ao overlay do modal.
   Depende de: nada.
   Usado por: praticamente todo o resto do projeto.
═══════════════════════════════════════════════════════════════ */

'use strict';

let estadoSeries={lantanideos:false,actinideos:false};

let elementoAtivo=null,divAtiva=null;

let filtroCategoria=null,filtroEstado=null,filtroLamber=null;

const botoesToggle={},posicaoMap={};

const modalOverlay=document.getElementById('modalOverlay');

