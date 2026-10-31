/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Eventos
   ARQUIVO: app-eventos.js
   ───────────────────────────────────────────────────────────────
   Liga os sliders de temperatura/pressão/partículas, os botões
   aquecer/resfriar, a busca de substâncias e o restante dos
   controles aos métodos correspondentes de App/Simulation.
   Adiciona a App.prototype: _bindEvents.
   Depende de: praticamente todos os outros arquivos de app/,
               simulation/ e phase-diagram/.
═══════════════════════════════════════════════════════════════ */

'use strict';

App.prototype._bindEvents = function() {
    window.addEventListener('resize',()=>this._resize());
    document.getElementById('sub-search').addEventListener('input',e=>this._buildList(e.target.value));

    const tempSl=document.getElementById('temp-slider');
    const pressSl=document.getElementById('press-slider');
    const nSl=document.getElementById('n-slider');

    const applyControls=()=>{
      const T=+tempSl.value, P=this._sliderToPressure(+pressSl.value), N=+nSl.value;
      const decimals = (+tempSl.step < 1) ? 1 : 0;
      document.getElementById('temp-val').textContent=`${T.toFixed(decimals)} °C`;
      document.getElementById('press-val').textContent=`${P<0.01?P.toExponential(1):P.toFixed(2)} atm`;
      document.getElementById('n-val').textContent=N;
      if (this.sim.entry) { this.sim.setControls(T,P,N); this._updateMeasures(); }
    };
    tempSl.addEventListener('input',applyControls);
    pressSl.addEventListener('input',applyControls);
    nSl.addEventListener('input',applyControls);
    applyControls();

    // Incremento de aquecer/resfriar: 8% do range calibrado da substância
    // (fixo em 25°C apenas quando nenhuma substância foi selecionada ainda)
    const heatStep=()=>{
      const range=+tempSl.max-+tempSl.min;
      return this.sim.entry ? Math.max(+tempSl.step, Math.round(range*0.08)) : 25;
    };
    document.getElementById('btn-heat').addEventListener('click',()=>{ tempSl.value=Math.min(+tempSl.max,+tempSl.value+heatStep()); applyControls(); });
    document.getElementById('btn-cool').addEventListener('click',()=>{ tempSl.value=Math.max(+tempSl.min,+tempSl.value-heatStep()); applyControls(); });
  };

