/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Loop principal
   ARQUIVO: loop.js
   ───────────────────────────────────────────────────────────────
   _loop() roda a cada requestAnimationFrame: atualiza e desenha a
   simulação (sim.update()/sim.draw()), mede o FPS e, quando o
   Easter Egg de Rutherford está ativo, atualiza os contadores de
   partículas disparadas/defletidas.
   Adiciona a AtomicApp.prototype: _loop.
   Depende de: app/atomic-app-core.js, models/atomic-sim-loop.js
               (usa sim.update()/sim.draw()).
═══════════════════════════════════════════════════════════════ */

'use strict';

AtomicApp.prototype._loop = function() {
    // "Largada com antecipação": _modeStartsAt (marcado em eventos.js) segura
    // o UPDATE por 2s — o desenho continua rodando (mostra o quadro
    // congelado), só a física não avança até o tempo passar.
    if (performance.now() >= this._modeStartsAt) this.sim.update();
    this.sim.draw();
    this.fpsF++;
    const now=performance.now();
    if (now-this.fpsLast>=1000) {
      this.fpsEl.textContent=this.fpsF+' fps';
      this.fpsF=0; this.fpsLast=now;
    }
    // Contadores do Easter Egg — só atualizados enquanto o modo está
    // ativo, dentro do MESMO ciclo principal (sem loop/canvas isolado).
    if (this.sim.model==='rutherford' && this.sim.ruthEggMode) {
      const fEl=document.getElementById('egg-fired'), dEl=document.getElementById('egg-deflected');
      if (fEl) fEl.textContent = this.sim.ruthFired;
      if (dEl) dEl.textContent = this.sim.ruthDeflected;
    }
    requestAnimationFrame(()=>this._loop());
  };

