/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO (núcleo da classe AtomicApp)
   ARQUIVO: atomic-app-core.js
   ───────────────────────────────────────────────────────────────
   Declara a classe AtomicApp — o controlador da interface. O
   construtor cria o AtomicSim, monta a tabela periódica, liga os
   eventos e inicia o loop principal. _resize() recalcula o tamanho
   do canvas quando a janela muda.
   Assim como AtomicSim, os demais métodos (tabela periódica,
   dados do elemento, sincronização dos painéis, eventos, Easter
   Eggs, loop) vivem em arquivos próprios dentro de app/ e são
   adicionados via AtomicApp.prototype.metodo = function(){...}
   (mesma técnica explicada em models/atomic-sim-core.js).
   Depende de: models/ (toda a simulação já deve estar pronta —
               new AtomicSim(canvas) é chamado aqui dentro).
   Usado por: app/tabela-periodica.js e demais arquivos de app/
              (todos ADICIONAM métodos a esta classe), main.js
              (que instancia `new AtomicApp()`).
   ⚠ Este arquivo deve ser o PRIMEIRO de app/ a carregar.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════════
// APP CONTROLLER
// ══════════════════════════════════════════════════════════════════
class AtomicApp {
  constructor() {
    window.SIMA_APP = this;
    this.canvas   = document.getElementById('sim-canvas');
    this.sim      = new AtomicSim(this.canvas);
    this.fpsF     = 0;
    this.fpsLast  = performance.now();
    this.fpsEl    = document.getElementById('fps-counter');
    this._ptFocusGrid = [];
    this._categoryFilter = null;
    // Modos já vistos nesta sessão (modal de 1ª ativação) + controle da
    // "largada com antecipação" do gatilho — ver eventos.js/loop.js.
    this._modosVistos = new Set();
    this._modeStartsAt = 0;
    this._modeStartTimer = null;

    this._resize();
    this._buildPeriodicTable();
    this._bindEvents();
    this._buildModeTabsMobile();
    this._bindModeInfoModal();
    this._updateElementUI();
    this._updateOverlay();
    this._syncModelPanels();
    announce('SIMA carregado. Nenhum modelo ativo — escolha um modelo à esquerda e ative-o para começar. Elemento: Hidrogênio.');
    requestAnimationFrame(()=>this._loop());
  }

  _resize() {
    const wrap=this.canvas.parentElement;
    this.canvas.width=wrap.clientWidth;
    this.canvas.height=wrap.clientHeight;
    this.sim.rebuild();
  }
}

