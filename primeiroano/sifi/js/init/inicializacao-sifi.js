/* ═══════════════════════════════════════════════════════════════
   CAMADA: INICIALIZAÇÃO — Disparo final
   ARQUIVO: inicializacao-sifi.js
   ORIGEM:  mesmo papel que js/init/inicializacao-final.js tem no
            SILQ: é o "main.js" do projeto — o último arquivo a
            carregar, que liga tudo o que os outros módulos só
            definiram.
   ───────────────────────────────────────────────────────────────
   1. Constrói o menu de moléculas (Módulo 1) e a lista de líquidos
      (Módulo 2).
   2. Deixa os painéis "Interações" e "Termostato", e as dicas da
      canvas/béquer, no estado inicial (nenhum módulo ativo).
   3. Liga os botões "Limpar canvas"/"Esvaziar béquer" (os
      listeners já foram registrados em js/ui/sandbox.js e
      js/ui/beaker.js; aqui só garantimos o texto inicial correto).
   4. Liga o accordion das sidebars (abrir/fechar painel).
   Depende de: praticamente tudo — é o ponto de entrada de fato.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  SIFI.aplicarIcones();

  // Módulo 1
  SIFI.buildMenuMoleculas();
  SIFI.initBibliotecaControles();
  SIFI.showForcaVazia();
  SIFI.updateSandboxHint();

  // Módulo 2
  SIFI.buildTermostatoLista();
  SIFI.initTermostatoListaControles();
  SIFI.initTermostatoSliderControles();
  SIFI.atualizarContadoresEstado();
  SIFI.atualizarStatusTexto();
  SIFI.desenharGraficoTemperatura();

  // Módulo 3 — a prateleira já pode ser montada (não depende de
  // nenhum tubo existir); os tubos em si só nascem quando o módulo é
  // ativado (SIFI.resetLaboratorio, chamado por ativacao-modulos.js).
  SIFI.buildPrateleira();

  /* ===================================================================
     ACCORDION SIMPLES — abrir/fechar cada painel das sidebars.
     Versão enxuta do initAccordion do SILQ (sem persistência em
     localStorage por enquanto: com só 2 painéis no total, não há
     necessidade ainda — pode ser adicionada depois se o SIFI
     crescer e precisar lembrar o que o usuário deixou aberto).
     =================================================================== */
  document.querySelectorAll('.panel-header').forEach(btn => {
    const bodyId = btn.getAttribute('aria-controls');
    const body = document.getElementById(bodyId);
    if (!body) return;

    btn.addEventListener('click', () => {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
      body.classList.toggle('collapsed', isOpen);
    });

    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
    });
  });
});
