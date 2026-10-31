/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (independente das classes AtomicSim/AtomicApp)
   ARQUIVO: menu-mobile.js
   ───────────────────────────────────────────────────────────────
   Controla as duas gavetas laterais em telas estreitas (☰ modelos,
   🎛 controles), com pano de fundo compartilhado e fechamento pelo
   Escape ou ao escolher um modelo.
   Depende de: nada além do HTML.
   Usado por: main.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════════
// MOBILE OFF-CANVAS — o SIMA era o unico dos 20 simuladores sem os
// botoes de sidebar em tela estreita. Mesma funcao dos outros 19:
// dois botoes no header, backdrop compartilhado, Escape fecha, abrir
// uma fecha a outra, e escolher um modelo fecha a gaveta sozinha.
// Sai cedo se o markup nao existir, entao e seguro em qualquer pagina.
// ══════════════════════════════════════════════════════════════════
function initMobileSidebar() {
  const backdrop = document.getElementById('mobile-backdrop');
  if (!backdrop) return;

  const gavetas = [
    { btn: document.getElementById('mobile-info-btn'), el: document.getElementById('sidebar-left') },
    { btn: document.getElementById('mobile-menu-btn'), el: document.getElementById('sidebar-right') },
  ].filter(g => g.btn && g.el);
  if (!gavetas.length) return;

  function fecharTodas() {
    gavetas.forEach(g => {
      g.el.classList.remove('mobile-open');
      g.btn.setAttribute('aria-expanded', 'false');
    });
    backdrop.hidden = true;
  }
  function abrir(g) {
    fecharTodas();
    g.el.classList.add('mobile-open');
    g.btn.setAttribute('aria-expanded', 'true');
    backdrop.hidden = false;
  }

  gavetas.forEach(g => {
    g.btn.addEventListener('click', () => {
      g.el.classList.contains('mobile-open') ? fecharTodas() : abrir(g);
    });
    g.el.addEventListener('click', (e) => {
      if (e.target.closest('.mode-activate-btn, .model-btn') && window.innerWidth <= 900) {
        setTimeout(fecharTodas, 150);
      }
    });
  });
  backdrop.addEventListener('click', fecharTodas);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharTodas(); });

  window._closeSidebar = fecharTodas;
  // Abertura PROGRAMÁTICA de uma gaveta específica — usada pela barra de
  // modelos mobile (mode-tabs-mobile) para fechar/abrir o bottom sheet
  // de controles sem duplicar a mecânica de abrir/fechar já existente
  // aqui (mesma técnica dos outros 19 simuladores).
  window._openSidebar = function (elId) {
    const g = gavetas.find(x => x.el.id === elId);
    if (g) abrir(g);
  };
}

