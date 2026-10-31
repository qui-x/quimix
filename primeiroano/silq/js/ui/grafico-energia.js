/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: grafico-energia.js
   ───────────────────────────────────────────────────────────────
   Gráfico de energia potencial (D3.js) da ligação selecionada em
   modo de edição — mostra o poço de potencial de Lennard-Jones
   simplificado e a posição atual nele. Se a CDN do D3 não estiver
   disponível, o gráfico fica desativado sem quebrar o resto do app
   (checagem d3Available).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, js/bonds/ordem-edicao.js
               (bond selecionado).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     22. GRÁFICO DE ENERGIA (D3)
     ---------------------------------------------------------------------
     d3 vem de um CDN externo (d3js.org). Numa conexão instável, modo
     avião, bloqueio de rede corporativo ou o CDN simplesmente fora do
     ar, o script pode não carregar. Sem essa proteção, a referência a
     `d3` lançava ReferenceError e travava o RESTO da inicialização do
     simulador (tabela periódica, moléculas prontas, tudo) — um recurso
     secundário (o gráfico) derrubava o app inteiro. Agora, se o d3 não
     estiver disponível, só o gráfico fica desativado.
     =================================================================== */
  SILQ.d3Available = typeof d3 !== 'undefined';

  SILQ.esvg = undefined;

 SILQ.xSc = undefined;

 SILQ.ySc = undefined;

  SILQ.cW=240;

 SILQ.cH=150;

 SILQ.mg={top:14,right:12,bottom:26,left:32};

  if (SILQ.d3Available) {
    SILQ.esvg=d3.select('#energy-chart');
    SILQ.esvg.attr('viewBox',`0 0 ${SILQ.cW} ${SILQ.cH}`);
    SILQ.xSc=d3.scaleLinear().range([SILQ.mg.left,SILQ.cW-SILQ.mg.right]);
    SILQ.ySc=d3.scaleLinear().range([SILQ.cH-SILQ.mg.bottom,SILQ.mg.top]);
  } else {
    console.warn('[SILQ] d3.js não carregou (CDN indisponível) — o gráfico de energia ficará desativado, mas o restante do simulador continua funcionando normalmente.');
  }

  SILQ.potE = function potE(r,r0,d){ if(r<=.01) return d*8; const x=r0/r; return d*(Math.pow(x,12)-2*Math.pow(x,6)); };

  SILQ.clearChart = function clearChart() {
    if (!SILQ.d3Available) { if (SILQ.energyCaption) SILQ.energyCaption.textContent='Gráfico de energia indisponível (recurso externo não carregado).'; return; }
    SILQ.esvg.selectAll('*').remove();
    SILQ.esvg.append('text').attr('class','energy-empty').attr('x',SILQ.cW/2).attr('y',SILQ.cH/2).attr('text-anchor','middle').text('Sem interação detectada');
    SILQ.energyCaption.textContent='Adicione dois átomos para gerar a curva.';
  };

  SILQ.getFocusBond = function getFocusBond() {
    let best=null,bd=Infinity;
    SILQ.bonds.filter(b=>b.type!=='metallic').forEach(bond=>{
      const a=SILQ.canvasAtoms.find(at=>at.id===bond.a), b=SILQ.canvasAtoms.find(at=>at.id===bond.b);
      if(!a||!b) return; const d=SILQ.dist(a,b); if(d<bd){bd=d;best={bond,a,b,dist:d};}
    });
    return best;
  };

  SILQ.updateEnergyChart = function updateEnergyChart() {
    if (!SILQ.d3Available) return;
    const focus=SILQ.getFocusBond(); if(!focus){SILQ.clearChart();return;}
    const {a,b,dist:d,bond}=focus;
    const r0=SILQ.getBondLength(a.element,b.element),depth=1,rMax=r0*2.6;
    SILQ.xSc.domain([r0*.55,rMax]); SILQ.ySc.domain([-depth*1.15,depth*2]);
    SILQ.esvg.selectAll('*').remove();
    SILQ.esvg.append('g').attr('class','axis').attr('transform',`translate(0,${SILQ.cH-SILQ.mg.bottom})`).call(d3.axisBottom(SILQ.xSc).ticks(4).tickFormat(v=>v.toFixed(0)));
    SILQ.esvg.append('g').attr('class','axis').attr('transform',`translate(${SILQ.mg.left},0)`).call(d3.axisLeft(SILQ.ySc).ticks(4).tickFormat(v=>v.toFixed(1)));
    SILQ.esvg.append('text').attr('class','axis-label').attr('x',SILQ.cW/2).attr('y',SILQ.cH-4).text('Distância (pm-eq.)');
    SILQ.esvg.append('text').attr('class','axis-label').attr('transform',`translate(8,${SILQ.cH/2}) rotate(-90)`).text('E potencial (u.a.)');
    const pts=d3.range(r0*.55,rMax,(rMax-r0*.55)/80).map(r=>({r,e:SILQ.potE(r,r0,depth)}));
    SILQ.esvg.append('path').datum(pts).attr('class','energy-curve').attr('d',d3.line().x(p=>SILQ.xSc(p.r)).y(p=>SILQ.ySc(Math.max(p.e,-depth*1.15))));
    SILQ.esvg.append('line').attr('class','min-marker').attr('x1',SILQ.xSc(r0)).attr('x2',SILQ.xSc(r0)).attr('y1',SILQ.ySc(-depth)).attr('y2',SILQ.cH-SILQ.mg.bottom);
    SILQ.esvg.append('text').attr('class','min-label').attr('x',SILQ.xSc(r0)+3).attr('y',SILQ.ySc(-depth)-4).text('E mín.');
    const cE=SILQ.potE(d,r0,depth);
    SILQ.esvg.append('circle').attr('class','energy-marker').attr('r',4)
      .attr('cx',SILQ.xSc(Math.min(Math.max(d,r0*.55),rMax))).attr('cy',SILQ.ySc(Math.max(cE,-depth*1.15)));
    SILQ.energyCaption.innerHTML=Math.abs(d-r0)<=r0*.15
      ? `<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> ${a.element}–${b.element} na energia mínima — ligação estável.`
      : `d=${d.toFixed(0)} / r₀=${r0.toFixed(0)} px (${bond.type})`;
  };
});


