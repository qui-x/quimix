/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE (funções internas)
   ARQUIVO: anuncios.js
   ORIGEM:  REAPROVEITADO do SILQ (js/a11y/anuncios.js), só trocando
            SILQ.* por SIFI.* — a lógica é idêntica.
   ───────────────────────────────────────────────────────────────
   SIFI.announce(msg) — avisa leitores de tela via live regions
   (aria-live) sempre que algo importante acontece: molécula
   adicionada, módulo ativado/desativado, força detectada, caixa
   de areia limpa.
   Depende de: js/core/namespace.js. Precisa dos elementos
   #a11y-announcer / #a11y-announcer-assertive no HTML.
   Usado por: js/ui/sandbox.js, js/init/ativacao-modulos.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  SIFI.a11yAnnouncer = document.getElementById('a11y-announcer');
  SIFI.a11yAnnouncerAssertive = document.getElementById('a11y-announcer-assertive');

  SIFI.announce = function announce(msg, priority = 'polite') {
    const el = priority === 'assertive' ? SIFI.a11yAnnouncerAssertive : SIFI.a11yAnnouncer;
    if (!el) return;
    // Reseta o conteúdo primeiro para garantir que a MESMA mensagem
    // seja relida de novo se acontecer duas vezes seguidas.
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = msg; });
  };

  SIFI.setToggleState = function setToggleState(btn, pressed) {
    if (!btn) return;
    btn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  };
});
