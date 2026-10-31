/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO (uma das 5 vistas do elemento)
   ARQUIVO: bohr.js
   ───────────────────────────────────────────────────────────────
   Desenha o diagrama de Bohr (modelo planetário): núcleo central e
   elétrons em camadas circulares, coloridos por subnível.
   Depende de: core/config-eletronica.js, render/cores-atomo.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function renderBohr(Z, el, sub, atomCor, atomGlow, escala){
  escala = escala || 1;
  const dist     = distribuirEletrons(Z);
  const camadas  = porCamada(dist);
  const nCamadas = Object.keys(camadas).length;
  if(!nCamadas) return '';
  const elPorCamada = [];
  for(let n=1; n<=nCamadas; n++){
    const subs  = camadas[n]||[];
    const total = subs.reduce((a,{e})=>a+e,0);
    elPorCamada.push({n, total, nome:'KLMNOPQ'[n-1]||'?'});
  }
  const nVal    = nCamadas;
  const elVal   = elPorCamada[nCamadas-1].total;
  const nomeVal = elPorCamada[nCamadas-1].nome;
  const COR_BORDA  = resolverCorCSS('--border');
  const COR_DIM    = resolverCorCSS('--text-dim');
  const COR_ACCENT = resolverCorCSS('--accent');
  const COR_NUCLEO = resolverCorCSS('--bg-deep');
  const COR_TEXT   = resolverCorCSS('--text-main');
  function buildSVG(camPara, modo){
    const nC     = camPara.length;
    const R_NUC  = Math.round(32 * escala);
    /* PAD = faixa livre reservada nas QUATRO bordas, DENTRO do próprio
       quadrado. É nela que entram os rótulos.

       POR QUE MUDOU: existia MARG, uma sobra de 100px só à DIREITA
       (SVG_W = DIM + MARG). O viewBox ficava retangular (~1,5:1) e o
       núcleo, desenhado em DIM/2, caía à ESQUERDA do centro da caixa —
       era isso que produzia o átomo encostado num lado e a área vazia do
       outro na captura de tela cheia.

       Com PAD igual nos quatro lados o núcleo fica no centro geométrico e
       o viewBox fica QUADRADO: a mesma proporção 1:1 do Lewis (530x530) e
       da Nuvem (canvas aspect-ratio 1/1). Uma única regra de CSS passa a
       servir para as três vistas. */
    const AVAIL  = Math.round(320 * escala);
    const GAP    = Math.min(Math.round(38*escala), (AVAIL - R_NUC - 8) / nC);
    const R_EL   = Math.max(4.5*escala, Math.min(7*escala, GAP * 0.19));
    const R_OUT  = R_NUC + nC * GAP + R_EL + 6;
    /* FATOR compensa uma distorção que já existia: o corpo do texto era fixo
       (10px) enquanto o viewBox CRESCIA com o número de camadas — 282 no modo
       Valência, 510 no "Todas as camadas" do cobre, 738 no urânio. Como o
       desenho é exibido sempre na mesma caixa, quanto mais camadas, MENOR o
       texto na tela: os rótulos e as letras K/L/M/N do modo "Todas as
       camadas" chegavam a ~6px reais, ilegíveis. Escalar o texto junto com o
       viewBox mantém o tamanho aparente constante nos dois modos.
       O teto de 1,6 evita o outro extremo: PAD grande demais afastaria as
       órbitas das bordas e o desenho ficaria pequeno dentro do quadrado. */
    const FATOR  = Math.min(1.6, R_OUT / (R_NUC + GAP + R_EL + 6));
    const PAD    = Math.round(58 * escala * FATOR);
    const DIM    = (R_OUT + PAD) * 2;
    const SVG_W  = DIM;
    const SVG_H  = DIM;
    const CX = DIM/2, CY = DIM/2;
    /* fSz = rótulos das bordas e letras das camadas: acompanham o viewBox.
       fSzSm = número atômico, que fica DENTRO do núcleo. O núcleo tem raio
       fixo (R_NUC) em qualquer elemento, então esse texto não pode crescer,
       ou transbordaria o círculo. Mesma razão vale para symFS, o símbolo. */
    const fSz = Math.round(10 * escala * FATOR);
    const fSzSm = Math.round(8 * escala);
    const defs = `<defs>
      <marker id="mD-${Z}-${modo}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
        <path d="M0,0 L7,3.5 L0,7 Z" fill="${COR_DIM}"/>
      </marker>
    </defs>`;
    let p = [];
    camPara.forEach(({n:cn, total:nEl, nome:cnome}, idx)=>{
      const r   = R_NUC + (idx+1)*GAP;
      const isV = modo==='val' ? true : (cn===nVal);
      p.push(`<circle cx="${CX.toFixed(1)}" cy="${CY.toFixed(1)}" r="${r.toFixed(1)}"
        fill="none" stroke="${isV?atomCor:COR_BORDA}" stroke-width="${isV?2.2:1}"
        opacity="${isV?1:0.4}"/>`);
      if(modo==='all'){
        p.push(`<text x="${(CX-r-6).toFixed(1)}" y="${(CY+4).toFixed(1)}"
          text-anchor="end" font-family="Share Tech Mono,monospace"
          font-size="${fSz}" fill="${isV?atomCor:COR_DIM}" opacity="${isV?1:0.65}">${cnome}</text>`);
      }
    });
    camPara.forEach(({n:cn, total:nEl}, idx)=>{
      const r   = R_NUC + (idx+1)*GAP;
      const isV = modo==='val' ? true : (cn===nVal);
      for(let j=0; j<nEl; j++){
        const ang = (2*Math.PI*j/nEl) - Math.PI/2;
        const ex  = CX + r*Math.cos(ang);
        const ey  = CY + r*Math.sin(ang);
        if(isV) p.push(`<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}"
          r="${(R_EL+3).toFixed(1)}" fill="${atomGlow}" opacity="0.28"/>`);
        p.push(`<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}"
          r="${R_EL.toFixed(1)}" fill="${isV?atomCor:COR_DIM}"
          stroke="${isV?COR_NUCLEO:'none'}" stroke-width="${isV?1.2:0}"
          opacity="${isV?1:0.6}"/>`);
      }
    });
    const symLen = (el.simbolo||'').length;
    const symFS  = Math.round((symLen > 2 ? 16 : 20) * escala);
    p.push(
      `<circle cx="${CX.toFixed(1)}" cy="${CY.toFixed(1)}" r="${R_NUC}"
        fill="${COR_NUCLEO}" stroke="${atomCor}" stroke-width="${(2.5*escala).toFixed(1)}"/>`,
      `<text x="${CX.toFixed(1)}" y="${(CY+1).toFixed(1)}"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Rajdhani,sans-serif" font-weight="700"
        font-size="${symFS}" fill="${atomCor}">${el.simbolo||''}</text>`,
      `<text x="${CX.toFixed(1)}" y="${(CY+R_NUC-8*escala).toFixed(1)}"
        text-anchor="middle" font-family="Share Tech Mono,monospace"
        font-size="${fSzSm}" fill="${COR_DIM}" opacity="0.8">${Z}</text>`
    );
    /* RÓTULOS — agora ancorados nas faixas PAD de cima e de baixo, com
       text-anchor="end" na borda direita interna. Antes eles saíam a
       partir da órbita para FORA do quadrado, e era essa fuga que exigia
       a sobra MARG à direita.

       As caixas <rect> de fundo saíram: o Lewis anota com texto solto e
       linha-guia tracejada, sem retângulo. Manter as caixas só no Bohr era
       a diferença mais visível entre as duas vistas em tela cheia. */
    const rVa   = R_NUC + camPara.length * GAP;
    const AX    = DIM - 10*escala;      // borda direita interna: fim do texto
    const LINHA = fSz*1.3;              // entrelinha
    /* onde a linha-guia para. Sai da LARGURA ESTIMADA do texto (o rótulo mais
       longo, "Camada de valência", tem 18 caracteres, e em Rajdhani cada um
       ocupa cerca de meio corpo de fonte), mais uma folga. Se fosse um número
       fixo em px, o texto cresceria com fSz e a linha entraria por baixo
       dele nos elementos com muitas camadas. */
    const FIM_L = AX - fSz*11;
    /* superior direito: o elétron de valência */
    const tY = PAD*0.42;
    p.push(
      `<line x1="${CX.toFixed(1)}" y1="${(CY-rVa-R_EL-2).toFixed(1)}"
             x2="${FIM_L.toFixed(1)}" y2="${(tY+LINHA*0.6).toFixed(1)}"
             stroke="${COR_DIM}" stroke-width="1" stroke-dasharray="3,2"
             marker-end="url(#mD-${Z}-${modo})"/>`,
      `<text x="${AX.toFixed(1)}" y="${tY.toFixed(1)}" text-anchor="end"
             font-family="Rajdhani,sans-serif" font-size="${fSz}"
             fill="${COR_DIM}">Elétron de valência</text>`,
      `<text x="${AX.toFixed(1)}" y="${(tY+LINHA).toFixed(1)}" text-anchor="end"
             font-family="Rajdhani,sans-serif" font-size="${fSz}"
             fill="${COR_DIM}">${elVal} no nível ${nomeVal}</text>`
    );
    /* inferior direito: a camada de valência
       SETA REMOVIDA (pedido): a linha apontando pro anel não agregava
       — o próprio anel já é visualmente diferenciado (cor de destaque,
       mais grosso) como a camada de valência, então uma seta genérica
       até um ponto qualquer do círculo (em vez de um elétron
       específico, como faz a seta de cima) só adicionava uma linha
       sem apontar pra nada preciso. O texto sozinho já entrega a
       informação (nome da camada + quantidade de elétrons). */
    const bY = DIM - PAD*0.42;
    p.push(
      `<text x="${AX.toFixed(1)}" y="${(bY-LINHA).toFixed(1)}" text-anchor="end"
             font-family="Rajdhani,sans-serif" font-size="${fSz}" font-weight="700"
             fill="${COR_ACCENT}">Camada de valência</text>`,
      `<text x="${AX.toFixed(1)}" y="${bY.toFixed(1)}" text-anchor="end"
             font-family="Rajdhani,sans-serif" font-size="${fSz}" font-weight="700"
             fill="${COR_ACCENT}">(${nomeVal}) — ${elVal} e⁻</text>`
    );
    return `<svg viewBox="0 0 ${SVG_W.toFixed(0)} ${SVG_H.toFixed(0)}"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="bohr-d-${Z}-${modo}"
      >
      <desc id="bohr-d-${Z}-${modo}">Diagrama de Bohr de ${el.nome||el.simbolo||''}. Modelo de Bohr mostrando ${nCamadas} ${nCamadas===1?'camada eletrônica':'camadas eletrônicas'} ao redor do núcleo. A camada de valência ${nomeVal} contém ${elVal} ${elVal===1?'elétron':'elétrons'}.</desc>
      ${defs}
      ${p.join('\n      ')}
    </svg>`;
  }
  const svgVal = buildSVG([elPorCamada[nCamadas-1]], 'val');
  const svgAll = buildSVG(elPorCamada, 'all');
  const maxCap = [2,8,18,32,50,72,98];
  const fsCam  = Math.max(0.78, Math.min(1.4, escala));
  const linhas = elPorCamada.map(({n,total,nome})=>{
    const cap = maxCap[n-1]||2*n*n;
    const pct = Math.round(total/cap*100);
    const isV = n===nVal;
    return `<div class="bohr-camada-row" style="font-size:calc(${fsCam} * 0.78rem * var(--font-scale))">
      <span class="bohr-camada-nome" style="${isV?'color:'+atomCor:''}">${nome}</span>
      <span class="bohr-camada-el">${total}/${cap} e⁻</span>
      <div class="bohr-camada-bar-track">
        <div class="bohr-camada-bar-fill" style="width:${pct}%;background:${isV?atomCor:COR_DIM};opacity:${isV?1:0.5}"></div>
      </div>
      ${isV?`<span class="bohr-camada-val-tag">← valência</span>`:''}
    </div>`;
  }).join('');
  return `<div class="bohr-wrap">
    <div class="bohr-header">
      <span class="bohr-titulo">Diagrama de Bohr</span>
      <div class="raio-view-toggle" role="group" aria-label="Modo do diagrama Bohr">
        <button class="raio-vbtn ativo" id="bohr-btn-val-${Z}" aria-pressed="true"
                onclick="bohrModo('val','${Z}')">Valência</button>
        <button class="raio-vbtn" id="bohr-btn-all-${Z}" aria-pressed="false"
                onclick="bohrModo('all','${Z}')">Todas as camadas</button>
      </div>
    </div>
    <div class="bohr-svg-wrap">
      <div id="bohr-svg-val-${Z}">${svgVal}</div>
      <div id="bohr-svg-all-${Z}" style="display:none">${svgAll}</div>
    </div>
    <div class="bohr-camada-info">
      <span class="bohr-camada-titulo">Elétrons por camada</span>
      ${linhas}
    </div>
  </div>`;
}

