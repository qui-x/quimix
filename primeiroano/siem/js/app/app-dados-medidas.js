/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Dados e medidas
   ARQUIVO: app-dados-medidas.js
   ───────────────────────────────────────────────────────────────
   Preenche a ficha da substância (dados físicos a 1 atm + geometria
   VSEPR), a legenda de cores CPK dos átomos presentes na molécula, e
   as leituras "ao vivo" recalculadas para a pressão atual (estado,
   ponto de fusão/ebulição na pressão em uso, agitação relativa).
   Adiciona a App.prototype: _populateDataPanel, _populateAtomLegend,
   _updateMeasures.
   Depende de: app/app-core.js, core/termodinamica.js,
               data/paleta-cpk.js (CPK).
═══════════════════════════════════════════════════════════════ */

'use strict';

App.prototype._populateDataPanel = function(entry) {
    const set=(id,v)=>{ const el=document.getElementById(id); if(!el)return; el.textContent=v??'—'; el.className=v?'':'na'; };
    set('d-formula', entry.formula);
    set('d-geometry', entry.geometry);
    set('d-angle', entry.angle!=null ? `${entry.angle}°` : 'N/A (1 átomo)');
    set('d-lonepairs', String(entry.lonePairs));
    set('d-polarity', entry.polarity);
    set('d-fusion', `${entry.Tf.toFixed(1)} °C`);
    set('d-boiling', `${entry.Tb.toFixed(1)} °C`);
    set('d-triple', `${entry.Tt.toFixed(1)}°C, ${entry.Pt<0.01?entry.Pt.toExponential(1):entry.Pt.toFixed(3)} atm`);
    set('d-critical', `${entry.Tc.toFixed(0)}°C, ${entry.Pc.toFixed(1)} atm`);
    set('d-densSolid', `${entry.densSolid} kg/m³`);
    set('d-densLiquid', `${entry.densLiquid} kg/m³`);
    set('d-anomaly', entry.anomalyDensity ? 'Sólido flutua no líquido!' : entry.sublimateOnly ? 'Sublima a 1 atm' : 'Comportamento normal');
    set('d-descricao', entry.descricao || '—');
  };

  /** Monta legenda de cores CPK por elemento presente na molécula. */
  App.prototype._populateAtomLegend = function(entry) {
    const box=document.getElementById('atom-legend');
    box.innerHTML='';
    const seen=new Set();
    const elNames={H:'Hidrogênio',C:'Carbono',N:'Nitrogênio',O:'Oxigênio',Na:'Sódio',Cl:'Cloro',Hg:'Mercúrio',Fe:'Ferro',He:'Hélio',S:'Enxofre'};
    for (const at of entry.atoms) {
      if (seen.has(at.el)) continue;
      seen.add(at.el);
      const row=document.createElement('div'); row.className='atom-legend-row';
      const col = CPK[at.el] || '#999';
      row.innerHTML = `<span class="atom-legend-dot" style="background:${col};color:${col}"></span><span>${at.el} — ${elNames[at.el]||at.el}</span>`;
      box.appendChild(row);
    }
  };

  App.prototype._updateMeasures = function() {
    const sim=this.sim; if (!sim.entry) return;
    const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
    const labels={solid:'Sólido',liquid:'Líquido',gas:'Gás'};
    set('m-state', labels[sim.state]||'—');
    set('m-fusionNow', `${sim.stateInfo.Tf_eff.toFixed(1)} °C`);
    set('m-boilingNow', sim.stateInfo.canHaveLiquid ? `${sim.stateInfo.Tb_eff.toFixed(1)} °C` : 'não existe (sublima)');
    const Tk=sim.T_C+273.15, agit=Tk/300;
    set('m-agitation', agit<0.5?'baixa':agit<1.5?'média':agit<3?'alta':'muito alta');
    const elemDescricao = document.getElementById('m-descricao');
    const pill=document.getElementById('state-pill');
    if (pill) {
      /* escreve so no span interno para preservar o rotulo .sr-only */
      const txt=document.getElementById('state-pill-text');
      const rotulo=labels[sim.state];
      if (txt) txt.textContent = rotulo || 'sem substância';
      pill.className = 'state-pill ' + (rotulo ? sim.state : 'state-pill--vazio');
    }

    const warnBox=document.getElementById('warning-box');
    if (!sim.stateInfo.canHaveLiquid) {
      warnBox.style.display='block';
      warnBox.textContent=`A esta pressão (${sim.P_atm.toFixed(3)} atm), abaixo do ponto triplo (${sim.entry.Pt.toFixed(3)} atm) — a fase líquida não existe. A substância passa direto de sólido para gás (sublimação/deposição).`;
    } else if (sim.stateInfo.supercritical) {
      warnBox.style.display='block';
      warnBox.textContent='Acima do ponto crítico — fluido supercrítico: não há distinção entre líquido e gás.';
    } else {
      warnBox.style.display='none';
    }
  };

