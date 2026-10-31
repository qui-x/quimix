/* ================================================================
   NÚCLEO COMPARTILHADO — offcanvas-mobile.js
   ================================================================
   Extraído do bloco "MOBILE OFF-CANVAS", IDÊNTICO nos seis
   simuladores da família.

   Em telas estreitas as duas sidebars (esquerda = menus/informação,
   direita = controles) viram gavetas: deslizam por cima do conteúdo
   em vez de dividir a largura da tela. Depende de três elementos já
   existentes no HTML de cada simulador: #mobile-backdrop,
   #mobile-info-btn + #sidebar-left, #mobile-menu-btn + #sidebar-right.
   Se algum não existir, a função simplesmente não faz nada (seguro
   para simuladores com layout diferente).

   ORDEM DE CARGA: depois de kit-desenho.js.
   ================================================================ */
'use strict';

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
    // Fecha a gaveta ao escolher um modo/opção em telas estreitas
    g.el.addEventListener('click', (e) => {
      if (e.target.closest('.mode-activate-btn, .opt-btn') && window.innerWidth <= 1100) {
        setTimeout(fecharTodas, 150);
      }
    });
  });
  backdrop.addEventListener('click', fecharTodas);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharTodas(); });

  window._closeSidebar = fecharTodas;
  // Abertura PROGRAMÁTICA de uma gaveta específica pelo id do elemento —
  // usada pela barra de modos mobile (mode-tabs-mobile, dentro de app.js)
  // para abrir o bottom sheet de controles ao tocar um modo, sem precisar
  // duplicar a mecânica de abrir/fechar que já existe aqui.
  window._openSidebar = function (elId) {
    const g = gavetas.find(x => x.el.id === elId);
    if (g) abrir(g);
  };
}
window.addEventListener('DOMContentLoaded', initMobileSidebar);

// ══════════════════════════════════════════════════════════════════
