/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Menu mobile
   ARQUIVO: app-mobile.js
   ───────────────────────────────────────────────────────────────
   Controla as gavetas laterais em telas estreitas (☰ substância,
   ⚙ controles/dados), com pano de fundo compartilhado.
   Adiciona a App.prototype: _initMobileMenu.
   Depende de: app/app-core.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/**
   * Menu mobile — em telas ≤900px os painéis laterais saem do fluxo
   * normal e ficam fixos fora da tela (ver CSS), só aparecendo quando
   * a classe .mobile-open é adicionada. Sem este método, os botões
   * ☰/⚙ no cabeçalho não tinham NENHUM efeito e os dois painéis
   * laterais ficavam permanentemente inacessíveis em qualquer celular
   * ou tablet — toda a configuração de substância, dados, temperatura,
   * pressão e medidas ficava fora de alcance.
   */
  App.prototype._initMobileMenu = function() {
    const sidebar   = document.getElementById('sidebar-left');
    const rightPanel= document.getElementById('sidebar-right');
    const backdrop  = document.getElementById('mobile-backdrop');
    const btnLeft   = document.getElementById('mobile-menu-btn');
    const btnRight  = document.getElementById('mobile-menu-btn-right');
    if (!sidebar || !rightPanel || !backdrop || !btnLeft || !btnRight) return;

    const closeAll = () => {
      sidebar.classList.remove('mobile-open');
      rightPanel.classList.remove('mobile-open');
      backdrop.hidden = true;
      btnLeft.setAttribute('aria-expanded','false');
      btnRight.setAttribute('aria-expanded','false');
    };
    const togglePanel = (panel, btn) => {
      const wasOpen = panel.classList.contains('mobile-open');
      closeAll();
      if (!wasOpen) {
        panel.classList.add('mobile-open');
        backdrop.hidden = false;
        btn.setAttribute('aria-expanded','true');
      }
    };

    btnLeft.addEventListener('click', () => togglePanel(sidebar, btnLeft));
    btnRight.addEventListener('click', () => togglePanel(rightPanel, btnRight));
    backdrop.addEventListener('click', closeAll);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
    // Evita ficar com um painel "preso" aberto se o usuário girar o
    // celular ou redimensionar a janela de volta pro modo desktop
    window.addEventListener('resize', () => { if (window.innerWidth > 900) closeAll(); });
  };

