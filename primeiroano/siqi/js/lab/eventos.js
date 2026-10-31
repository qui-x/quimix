/* ═══════════════════════════════════════════════════════════════
   CAMADA: LABORATÓRIO
   ARQUIVO: eventos.js
   ───────────────────────────────────────────────────────────────
   Liga os botões "Verificar reação" e "Reiniciar" da sidebar aos
   métodos correspondentes do builder.
   Depende de: lab/builder-verificacao.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   14. BOOTSTRAP
════════════════════════════════════════════════════════════════ */
window.reiniciar = reiniciar;

window.siqi_sim = {
  reiniciar: reiniciar,
  explorar: function(){ addMsg('sistema','Use a busca ou as abas na **barra lateral esquerda** para explorar compostos!'); }
};

