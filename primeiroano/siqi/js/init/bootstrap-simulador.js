/* ═══════════════════════════════════════════════════════════════
   CAMADA: PONTO DE ENTRADA PARCIAL
   ARQUIVO: bootstrap-simulador.js
   ───────────────────────────────────────────────────────────────
   initSimulador() — inicializações comuns aos módulos (painéis,
   modal de expansão, menu mobile, canvas de partículas). Chamada
   pelo bootstrap final (js/redox/eventos-finais.js).
   Depende de: ui/*.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   13. SIMULADOR DIDÁTICO — chat socrático
════════════════════════════════════════════════════════════════ */
function initSimulador(){
  document.addEventListener('click', function(e){
    var t = e.target;
    if(t && t.id==='btn-reiniciar') reiniciar();
  });

  /* btn-reiniciar: acessível via window.reiniciar() */

  mostrarBoasVindas();
}

