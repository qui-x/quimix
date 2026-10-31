/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: dropzone-delete.js
   ───────────────────────────────────────────────────────────────
   Compatibilidade de arraste pelo teclado (drop zone do canvas) e o
   modo de remoção de átomo (botão "Remover" + clique no átomo).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, js/atoms/atomos.js (removeAtom).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     10. DROP ZONE (compatibilidade arraste do teclado)
     =================================================================== */
  SILQ.canvas.addEventListener('dragover', e=>{ e.preventDefault(); SILQ.canvas.classList.add('drop-active'); });

  SILQ.canvas.addEventListener('dragleave', ()=>SILQ.canvas.classList.remove('drop-active'));

  SILQ.canvas.addEventListener('drop', e=>{
    e.preventDefault(); SILQ.canvas.classList.remove('drop-active');
    const sym=e.dataTransfer.getData('text/plain'); if (!ELEMENTS[sym]) return;
    const rect=SILQ.canvas.getBoundingClientRect();
    SILQ.addAtom(sym, Math.max(30,Math.min(rect.width-30,e.clientX-rect.left)), Math.max(30,Math.min(rect.height-30,e.clientY-rect.top)));
  });

  /* ===================================================================
     11. CRIAÇÃO E REMOÇÃO DE ÁTOMOS
     =================================================================== */
  SILQ.deleteMode = false;

  SILQ.toggleDeleteMode = function toggleDeleteMode() {
    SILQ.deleteMode = !SILQ.deleteMode;
    const btn = document.getElementById('btn-delete-mode');
    if (!btn) return;
    if (SILQ.deleteMode) {
      btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> Clique no \u00e1tomo para remover';
      btn.classList.replace('btn-outline-danger','btn-danger');
      SILQ.canvas.classList.add('delete-mode');
      SILQ.setToggleState(btn, true);
      SILQ.announce('Modo de remo\u00e7\u00e3o ativado. Clique em um \u00e1tomo para remov\u00ea-lo.', 'assertive');
    } else {
      btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-trash"/></svg> Remover \u00c1tomo';
      btn.classList.replace('btn-danger','btn-outline-danger');
      SILQ.canvas.classList.remove('delete-mode');
      SILQ.setToggleState(btn, false);
      SILQ.announce('Modo de remo\u00e7\u00e3o desativado.');
    }
  };

  document.getElementById('btn-delete-mode')?.addEventListener('click', SILQ.toggleDeleteMode);
});


