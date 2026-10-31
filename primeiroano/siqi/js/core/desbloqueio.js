/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: desbloqueio.js
   ───────────────────────────────────────────────────────────────
   Controla quais compostos já foram "desbloqueados" no módulo
   Nomenclatura (o aluno acertou o desafio socrático) — mantido só em
   memória, reinicia ao recarregar a página de propósito (cada visita
   é um novo desafio).
   Depende de: nada.
   Usado por: js/nomenclatura/desafio.js, js/nomenclatura/biblioteca.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   3. ESTADO GLOBAL
════════════════════════════════════════════════════════════════ */
/* ── Desbloqueados mantidos apenas em memória (reset ao recarregar) ── */
var STORAGE_KEY = 'siqi_desbloqueados_v1';

function carregarDesbloqueados(){
  /* Sempre começa do zero ao recarregar a página */
  return [];
}

function salvarDesbloqueados(arr){
  /* Não persiste — estado vive apenas em memória durante a sessão */
}

function desbloquearComposto(formulaId){
  if(STATE.desbloqueados.indexOf(formulaId)<0){
    STATE.desbloqueados.push(formulaId);
    salvarDesbloqueados(STATE.desbloqueados);
    renderSubList(normTxt((document.getElementById('mol-search')||{value:''}).value));
  }
}

function estaDesbloqueado(formulaId){
  return STATE.desbloqueados.indexOf(formulaId)>=0;
}

