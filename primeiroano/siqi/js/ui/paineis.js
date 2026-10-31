/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: paineis.js
   ───────────────────────────────────────────────────────────────
   Abrir/fechar os painéis recolhíveis da interface (mesmo padrão dos
   outros simuladores da família, usando data-open no próprio painel
   em vez de aria-expanded do cabeçalho).
   Depende de: nada além do HTML.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   5. PAINÉIS RECOLHÍVEIS — mesmo padrão SIEM (transitionend + scroll-ready)
════════════════════════════════════════════════════════════════ */
function initPaineis(){
  document.querySelectorAll('.panel-header').forEach(function(btn){
    btn.addEventListener('click', function(){
      var panel=btn.closest('.panel');
      var bd=panel.querySelector('.panel-body');
      var aberto=panel.dataset.open==='true';
      panel.dataset.open=aberto?'false':'true';
      btn.setAttribute('aria-expanded',String(!aberto));
      if(bd){
        bd.classList.remove('scroll-ready');
        if(!aberto){
          bd.addEventListener('transitionend',function h(){
            bd.classList.add('scroll-ready');
            bd.removeEventListener('transitionend',h);
          });
        }
      }
    });
  });
}

