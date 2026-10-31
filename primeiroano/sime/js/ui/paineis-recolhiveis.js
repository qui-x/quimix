/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (interação)
   ARQUIVO: paineis-recolhiveis.js
   ───────────────────────────────────────────────────────────────
   Liga o clique no cabeçalho de cada painel lateral (.panel-header)
   ao atributo data-open, que o CSS usa para expandir/recolher o
   conteúdo do painel.
   Depende de: nada além do HTML.
   Usado por: main.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   PAINÉIS RECOLHÍVEIS
═══════════════════════════════════════════════════════ */
function initPanels() {
  document.querySelectorAll('.panel-header').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var panel = btn.closest('.panel');
      var open  = panel.getAttribute('data-open') === 'true';
      panel.setAttribute('data-open', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });
}
