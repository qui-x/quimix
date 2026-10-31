/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE (funções internas)
   ARQUIVO: anuncios.js
   ───────────────────────────────────────────────────────────────
   announce() — avisa leitores de tela via live regions (aria-live)
   sempre que algo importante acontece (átomo adicionado, ligação
   formada, modo alternado). Também setToggleState() e
   updateBondOrderARIA(), que mantêm os atributos aria-pressed dos
   botões de alternância sincronizados com o estado real.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/namespace.js.
   Usado por: praticamente todos os módulos que reagem a ações do
              usuário.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     A11Y — FUNÇÕES DE ACESSIBILIDADE
     =================================================================== */

  /* Anuncia mensagens para leitores de tela via live regions */
  SILQ.a11yAnnouncer = document.getElementById('a11y-announcer');

  SILQ.a11yAnnouncerAssertive = document.getElementById('a11y-announcer-assertive');

  SILQ.announce = function announce(msg, priority = 'polite') {
    const el = priority === 'assertive' ? SILQ.a11yAnnouncerAssertive : SILQ.a11yAnnouncer;
    if (!el) return;
    // Reset do conteúdo para garantir que a mesma mensagem seja relida
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = msg; });
  };

  /* Verifica preferência de movimento reduzido */
  SILQ.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Atualiza aria-pressed nos botões de toggle */
  SILQ.setToggleState = function setToggleState(btn, pressed) {
    if (!btn) return;
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  };

  /* Atualiza aria-pressed nos botões de ordem de ligação */
  SILQ.updateBondOrderARIA = function updateBondOrderARIA(activeOrder) {
    document.querySelectorAll('.bond-order-btn').forEach(btn => {
      const val = btn.dataset.order;
      const isActive = (activeOrder === null && val === 'auto') ||
                       (activeOrder !== null && val === String(activeOrder));
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };
});


