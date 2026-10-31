/* ═══════════════════════════════════════════════════════════════
   CAMADA: LABORATÓRIO
   ARQUIVO: toast.js
   ───────────────────────────────────────────────────────────────
   Notificação temporária (toast) de feedback no Lab, e a mensagem de
   boas-vindas mostrada ao iniciar uma reação.
   Depende de: core/dom-utils.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* initProgresso removida — painel de progresso removido */

/* atualizarProgresso removida */

/* atualizarMedidas removida — painel removido */

/* ── Toast de feedback visual (sem chat) ──────────────────── */
var _toastTimer = null;

function showToast(tipo, texto){
  var el = document.getElementById('lab-toast');
  if(!el) return;
  // tipo: 'ok' | 'err' | 'hint' | 'info'
  el.className = 'lab-toast lab-toast-' + tipo;
  el.innerHTML = renderMD(texto);
  el.hidden = false;
  if(_toastTimer) clearTimeout(_toastTimer);
  var dur = tipo==='ok' ? 3500 : tipo==='hint' ? 5000 : 4000;
  _toastTimer = setTimeout(function(){ el.hidden=true; }, dur);
  srAnnounce(el.textContent, tipo==='err'?'assertive':'polite');
}

/* alias para compatibilidade com chamadas legadas */
function addMsg(tipo, texto){ showToast(tipo==='acerto'?'ok':tipo==='dica'?'hint':tipo==='tutor'?'info':'err', texto); }

/* ── Estado inicial — laboratório vazio ────────────────────── */
function mostrarBoasVindas(){
  STATE.expAtual = null;
  STATE.aguardandoResposta = false;

  /* Ocultar header do experimento */
  var expHdr = document.getElementById('exp-header');
  if(expHdr) expHdr.hidden = true;

  /* Tela inicial limpa — só instrução de seleção */
  var rxnWrap = document.getElementById('rxn-wrapper');
  if(rxnWrap){
    rxnWrap.hidden = false;
    rxnWrap.innerHTML =
      '<div class="rxl-welcome">' +
        '<div class="rxl-welcome-icon"><svg class="icon" aria-hidden="true"><use href="#ic-flask"/></svg></div>' +
        '<div class="rxl-welcome-titulo">Laboratório de Química Inorgânica</div>' +
        '<div class="rxl-welcome-sub">' +
          'Selecione um composto na biblioteca ao lado para explorar suas reações' +
        '</div>' +
      '</div>';
  }

  /* Resetar balanço */
  var balEq = document.getElementById('bal-equacao');
  var balGr = document.getElementById('bal-grid');
  if(balEq) balEq.textContent = '—';
  if(balGr) balGr.innerHTML = '<span class="bal-hint">Selecione um composto para iniciar</span>';
}

