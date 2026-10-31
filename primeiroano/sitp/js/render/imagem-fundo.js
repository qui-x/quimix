/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDER
   ARQUIVO: imagem-fundo.js
   ───────────────────────────────────────────────────────────────
   Aplica a foto real do elemento (ver js/data/imagem-elemento.js)
   como plano de fundo do cabeçalho do modal, com uma camada escura
   por cima (mesma técnica de color-mix já usada no resto do
   projeto — funciona em qualquer tema, sem precisar de uma cor em
   RGB separada) pra manter o texto legível, e o crédito da foto
   visível num canto — a maioria das licenças CC BY/BY-SA exige
   atribuição, não é só cortesia.
   Depende de: js/data/imagem-elemento.js.
   Usado por: js/modal/abrir-fechar.js (chamado dentro de abrirModal()).
═══════════════════════════════════════════════════════════════ */

'use strict';

function aplicarFotoElemento(Z) {
  const header = document.querySelector('.modal-header');
  const creditoEl = document.getElementById('modalFotoCredito');
  if (!header) return;
  const info = IMAGEM_ELEMENTO[Z];
  if (!info) {
    header.style.setProperty('--foto-elemento', 'none');
    if (creditoEl) creditoEl.hidden = true;
    return;
  }
  header.style.setProperty('--foto-elemento', `url('${info.url}')`);
  if (creditoEl) {
    creditoEl.textContent = `Foto: ${info.credito}`;
    creditoEl.hidden = false;
  }
}
