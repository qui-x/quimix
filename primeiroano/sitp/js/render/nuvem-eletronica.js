/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO (uma das 5 vistas do elemento)
   ARQUIVO: nuvem-eletronica.js
   ───────────────────────────────────────────────────────────────
   A vista de nuvem de probabilidade eletrônica: inicializa o canvas,
   monta a legenda de orbitais e troca o orbital exibido. O desenho
   pixel-a-pixel de cada orbital em si vive em
   render/nuvem-canvas-draw.js (arquivo próprio por ser grande e
   reutilizado também pela tela cheia).
   Depende de: core/config-eletronica.js,
               render/nuvem-canvas-draw.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function renderNuvem(Z, el, sub, atomCor, atomGlow){
  const dist    = distribuirEletrons(Z);
  const camadas = porCamada(dist);
  const nCam    = Object.keys(camadas).length;
  const orbitaisInfo = [];
  for(let n=1; n<=nCam; n++){
    const subs = camadas[n]||[];
    subs.forEach(({sub:s, e})=>{
      const tipo = s[s.length-1];
      const varMap = {s:'--orb-s', p:'--orb-p', d:'--orb-d', f:'--orb-f'};
      const cor = rgbToHex(resolverCorCSS(varMap[tipo]||'--orb-s'));
      orbitaisInfo.push({sub:s, e, tipo, n:parseInt(s[0]), cor});
    });
  }
  const orbitaisJSON = JSON.stringify(orbitaisInfo);
  const resumoOrbitais = orbitaisInfo.map(o=>`${o.sub} com ${o.e} ${o.e===1?'elétron':'elétrons'}`).join(', ');
  return `<div class="nuvem-wrap">
    <div class="nuvem-header">
      <span class="nuvem-titulo" id="nuvem-titulo-${Z}">Nuvem Eletrônica de Probabilidade</span>
      <div class="nuvem-controles" role="group" aria-label="Controles da nuvem">
        <label class="nuvem-label" for="nuvem-orb-${Z}">Orbital:</label>
        <select class="nuvem-select" id="nuvem-orb-${Z}" aria-label="Selecionar orbital a exibir" onchange="nuvemMudarOrbital(${Z})">
          <option value="all">Todos</option>
          ${orbitaisInfo.map(o=>`<option value="${o.sub}">${o.sub} (${o.e} e⁻)</option>`).join('')}
        </select>
      </div>
    </div>
    <canvas id="nuvem-canvas-${Z}" class="nuvem-canvas"
            role="img"
            aria-label="Representação artística da nuvem eletrônica de probabilidade do ${el.nome}. Distribuição por orbitais: ${resumoOrbitais}. A densidade de pontos indica a probabilidade de encontrar elétrons em cada região."
            data-z="${Z}" data-orbitais='${orbitaisJSON}'
            data-cor="${atomCor}" data-glow="${atomGlow}"></canvas>
    <p class="sr-only">Descrição textual: a nuvem eletrônica do ${el.nome} é formada pelos orbitais ${resumoOrbitais}. Cada cor na legenda abaixo corresponde a um tipo de orbital.</p>
    <div class="nuvem-legenda" id="nuvem-legenda-${Z}"></div>
  </div>`;
}

function nuvemIniciarCanvas(Z, forceOrbital){
  const canvas = document.getElementById('nuvem-canvas-'+Z);
  if(!canvas) return;
  const sel    = document.getElementById('nuvem-orb-'+Z);
  const orbital= forceOrbital || (sel ? sel.value : 'all');
  _nuvemDrawOnCanvas(canvas, orbital);
  nuvemLegenda(canvas.closest('.nuvem-wrap'), canvas, orbital);
}

function nuvemLegenda(container, canvas, orbital){
  const leg = container ? container.querySelector('.nuvem-legenda') : null;
  if(!leg || !canvas) return;
  const orbs  = JSON.parse(canvas.dataset.orbitais||'[]');
  const shown = (orbital && orbital !== 'all') ? orbs.filter(o=>o.sub===orbital) : orbs;
  leg.innerHTML = shown.map(o=>`<div class="nuvem-leg-row"><span class="nuvem-leg-dot" style="background:${o.cor}"></span><span class="nuvem-leg-sub">${o.sub}</span><span class="nuvem-leg-e">${o.e} e⁻</span></div>`).join('');
}

function nuvemMudarOrbital(Z){
  const canvas = document.getElementById('nuvem-canvas-'+Z);
  const sel    = document.getElementById('nuvem-orb-'+Z);
  if(!canvas) return;
  const orbital = sel ? sel.value : 'all';
  _nuvemDrawOnCanvas(canvas, orbital);
  nuvemLegenda(canvas.closest('.nuvem-wrap'), canvas, orbital);
}

