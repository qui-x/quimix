/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Loop principal
   ARQUIVO: app-loop.js
   ───────────────────────────────────────────────────────────────
   _loop() roda a cada requestAnimationFrame: atualiza e desenha a
   simulação, redesenha o diagrama de fases quando há substância
   selecionada, e atualiza as medidas ao vivo a cada 10 frames.
   Adiciona a App.prototype: _loop.
   Depende de: app/app-core.js, simulation/ e phase-diagram/
               (usa sim.update()/sim.draw() e phaseDiagram.draw()).
═══════════════════════════════════════════════════════════════ */

'use strict';

App.prototype._loop = function() {
    this.sim.update(); this.sim.draw();
    if (this.sim.entry) {
      this.phaseDiagram.draw();
      if (this.sim.frame%10===0) this._updateMeasures();
    }
    requestAnimationFrame(()=>this._loop());
  };

