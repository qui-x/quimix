/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO (uma das 5 vistas do elemento)
   ARQUIVO: lewis.js
   ───────────────────────────────────────────────────────────────
   Desenha a estrutura de Lewis: símbolo do elemento cercado pelos
   elétrons de valência representados como pontos.
   Depende de: core/config-eletronica.js, render/cores-atomo.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function renderLewis(Z, el, sub, atomCor, atomGlow, escala){
  escala = escala || 1;
  if(!sub) return '<p class="raio-sem-dados">Diagrama de Lewis não disponível.</p>';
  const elV = sub.elCount;
  const dist    = distribuirEletrons(Z);
  const camadas = porCamada(dist);
  const nCam    = Object.keys(camadas).length;
  const subsCam = camadas[nCam]||[];
  const eValTotal = subsCam.reduce((a,{e})=>a+e,0);
  const maxLewis = (Z<=2) ? 2 : 8;
  const eL = Math.min(eValTotal, maxLewis);
  const COR_DIM    = resolverCorCSS('--text-dim');
  const COR_ACCENT = resolverCorCSS('--accent');
  const COR_TEXT   = resolverCorCSS('--text-main');
  const COR_BG     = resolverCorCSS('--bg-card');
  const COR_NUCLEO = resolverCorCSS('--bg-deep');
  const SZ   = Math.round(220 * escala);
  const CX   = SZ/2, CY = SZ/2;
  const BOX  = Math.round(36 * escala);
  const DIST = Math.round(54 * escala);
  const R_PT = 5.5 * escala;
  const GAP  = 14 * escala;
  const fSz  = Math.round(10 * escala);
  // Espaço extra reservado à direita pro rótulo da anotação ("N e⁻ de
  // valência" / "Parcialmente preenchido" etc.) — sem isso o texto
  // ultrapassava a largura do próprio SVG e ficava cortado (o <svg>
  // recorta tudo fora do viewBox, do mesmo jeito em qualquer tamanho
  // de tela — só ficava mais visível no bottom sheet mobile, mais
  // estreito). "Parcialmente preenchido" é o rótulo mais longo
  // possível (ver config-eletronica.js), por isso a margem é generosa.
  const ANNO_W = Math.round(130 * escala);
  const VB_W = SZ + ANNO_W;
  const FACES = [
    {dx:0,   dy:-DIST, ax: 0,  ay:-1, label:''},
    {dx:DIST, dy:0,    ax: 1,  ay: 0, label:''},
    {dx:0,   dy:DIST,  ax: 0,  ay: 1, label:''},
    {dx:-DIST,dy:0,    ax:-1,  ay: 0, label:''},
  ];
  const slots = [
    {fi:0,slot:0},{fi:1,slot:0},{fi:2,slot:0},{fi:3,slot:0},
    {fi:0,slot:1},{fi:1,slot:1},{fi:2,slot:1},{fi:3,slot:1},
  ].slice(0, eL);
  const ocup = [0,0,0,0];
  slots.forEach(({fi})=> ocup[fi]++);
  let parts = [];
  const defs = `<defs>
    <marker id="lmA-${Z}" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="${COR_ACCENT}"/>
    </marker>
  </defs>`;
  parts.push(`<rect width="${VB_W}" height="${SZ}" fill="transparent"/>`);
  FACES.forEach(({dx,dy,ax,ay}, fi)=>{
    const n = ocup[fi];
    if(n===0) return;
    const fx = CX+dx, fy = CY+dy;
    if(n===1){
      parts.push(
        `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${(R_PT+3).toFixed(1)}" fill="${atomGlow}" opacity="0.3"/>`,
        `<circle cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" r="${R_PT}" fill="${atomCor}" stroke="${COR_NUCLEO}" stroke-width="1.2"/>`
      );
    } else {
      const px = ay!==0 ? GAP/2 : 0;
      const py = ax!==0 ? GAP/2 : 0;
      [-1,1].forEach(s=>{
        const ex = fx + s*px;
        const ey = fy + s*py;
        parts.push(
          `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(R_PT+2.5).toFixed(1)}" fill="${atomGlow}" opacity="0.28"/>`,
          `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${R_PT}" fill="${atomCor}" stroke="${COR_NUCLEO}" stroke-width="1.2"/>`
        );
      });
      parts.push(`<line x1="${(fx-px).toFixed(1)}" y1="${(fy-py).toFixed(1)}"
        x2="${(fx+px).toFixed(1)}" y2="${(fy+py).toFixed(1)}"
        stroke="${atomCor}" stroke-width="1" opacity="0.5"/>`);
    }
  });
  const symLen = (el.simbolo||'').length;
  const symFS  = Math.round((symLen > 2 ? 18 : 26) * escala);
  parts.push(
    `<rect x="${(CX-BOX).toFixed(1)}" y="${(CY-BOX).toFixed(1)}"
           width="${(BOX*2).toFixed(0)}" height="${(BOX*2).toFixed(0)}"
           rx="6" fill="${COR_NUCLEO}" stroke="${atomCor}" stroke-width="2"/>`,
    `<text x="${CX.toFixed(1)}" y="${(CY+2).toFixed(1)}"
           text-anchor="middle" dominant-baseline="middle"
           font-family="Rajdhani,sans-serif" font-weight="700"
           font-size="${symFS}" fill="${atomCor}">${el.simbolo||''}</text>`
  );
  const annoY = CY - DIST - R_PT - 22*escala;
  const annoX = CX + 38*escala;
  const annoTX = CX + 42*escala;
  parts.push(
    `<line x1="${(CX+4*escala).toFixed(1)}" y1="${(CY-DIST-R_PT-3*escala).toFixed(1)}"
           x2="${annoX.toFixed(1)}" y2="${(annoY+12*escala).toFixed(1)}"
           stroke="${COR_DIM}" stroke-width="1" stroke-dasharray="3,2"
           marker-end="url(#lmA-${Z})"/>`,
    `<text x="${annoTX.toFixed(1)}" y="${annoY.toFixed(1)}"
           font-family="Rajdhani,sans-serif" font-size="${fSz}"
           fill="${COR_ACCENT}" font-weight="700">${eValTotal} e⁻ de valência</text>`,
    `<text x="${annoTX.toFixed(1)}" y="${(annoY+12*escala).toFixed(1)}"
           font-family="Rajdhani,sans-serif" font-size="${fSz}"
           fill="${COR_DIM}">${sub.statusLabel}</text>`
  );
  const maxW = Math.round(290 * escala);
  const svgLewis = `<svg viewBox="0 0 ${VB_W} ${SZ}"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-labelledby="lewis-d-${Z}"
    style="max-width:${maxW}px;">
    <desc id="lewis-d-${Z}">Diagrama de Lewis de ${el.nome||el.simbolo||''}. Estrutura de Lewis mostrando o símbolo ${el.simbolo||''} ao centro, rodeado por ${eValTotal} ${eValTotal===1?'elétron de valência':'elétrons de valência'} representados como pontos. Estado de preenchimento: ${sub.statusLabel}.</desc>
    ${defs}
    ${parts.join('\n    ')}
  </svg>`;
  const pares  = Math.floor(eL/2);
  const solt   = eL - pares*2;
  const legendaRows = [
    ['Elétrons de valência', `${eValTotal}`, atomCor],
    ['Pares de elétrons',    `${pares}`,     atomCor],
    ['Elétrons solitários',  `${solt}`,      COR_DIM],
    ['Estado',               sub.statusLabel, COR_ACCENT],
  ].map(([lbl,val,cor])=>
    `<div class="lewis-legenda-row">
      <div class="lewis-legenda-dot" style="background:${cor}"></div>
      <span class="lewis-legenda-lbl">${lbl}</span>
      <span class="lewis-legenda-val" style="color:${cor}">${val}</span>
    </div>`
  ).join('');
  const nota = eValTotal > 8
    ? `<p style="font-size:calc(0.72rem * var(--font-scale));color:${COR_DIM};font-style:italic;margin-top:4px">
        Nota: O diagrama de Lewis convencional representa até 8 e⁻ (octeto).
        Este elemento possui ${eValTotal} e⁻ na camada de valência —
        o excedente ocorre em elementos do bloco ${sub.bloco} com expansão de octeto.
       </p>` : '';
  return `<div class="lewis-wrap">
    <div class="lewis-header">
      <span class="lewis-titulo">Diagrama de Lewis — Elétrons de Valência</span>
    </div>
    <div class="lewis-svg-wrap">${svgLewis}</div>
    <div class="lewis-legenda">
      <span class="lewis-legenda-titulo">Legenda</span>
      ${legendaRows}
    </div>
    ${nota}
  </div>`;
}

