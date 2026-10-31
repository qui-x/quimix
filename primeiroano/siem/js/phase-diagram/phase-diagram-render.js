/* ═══════════════════════════════════════════════════════════════
   CAMADA: DIAGRAMA DE FASES — desenho
   ARQUIVO: phase-diagram-render.js
   ───────────────────────────────────────────────────────────────
   draw() desenha o diagrama P×T completo: eixos, curvas de
   fusão/ebulição/sublimação, regiões sólido/líquido/vapor, ponto
   triplo, ponto crítico e o ponto atual (T,P) da simulação.
   _drawPhaseRegions() pinta o preenchimento de fundo de cada região
   de fase.
   Adiciona a PhaseDiagram.prototype: draw, _drawPhaseRegions.
   Depende de: phase-diagram/phase-diagram-core.js,
               core/termodinamica.js, a11y/acessibilidade.js
               (window.SIEM_THEME).
═══════════════════════════════════════════════════════════════ */

'use strict';

PhaseDiagram.prototype.draw = function(targetCanvas) {
    const sim=this.sim, entry=sim.entry;
    const cv=targetCanvas||this.canvas, dpr=window.devicePixelRatio||1;
    const rect=cv.getBoundingClientRect();
    const targetW=Math.max(1,Math.round(rect.width*dpr)), targetH=Math.max(1,Math.round(rect.height*dpr));
    // Sempre garante que o canvas físico bate com o tamanho exibido em CSS
    // multiplicado pelo DPR, e SEMPRE reaplica a escala depois de
    // redimensionar — setar cv.width/height reseta o contexto 2D por
    // completo, então pular o scale() aqui é a causa raiz da distorção
    // tanto na visualização minimizada (resize de janela) quanto na
    // expandida (modal com dimensões diferentes do canvas original).
    if (cv.width!==targetW || cv.height!==targetH) {
      cv.width=targetW; cv.height=targetH;
    }
    const ctx=cv.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0); // substitui scale() acumulativo por um valor absoluto
    const W=rect.width, H=rect.height;
    ctx.clearRect(0,0,W,H);
    const T = window.SIEM_THEME;
    ctx.fillStyle=rgba(T.bg1,0.9); ctx.fillRect(0,0,W,H);
    if (!entry) {
      ctx.fillStyle=rgba(T.tx2,0.5); ctx.font='9px Consolas'; ctx.textAlign='center';
      ctx.fillText('selecione uma substância',W/2,H/2); return;
    }
    const padL=34,padB=18,padT=8,padR=8;
    const plotW=W-padL-padR, plotH=H-padT-padB;
    const { Tmin, Tmax, Pmin, Pmax } = this._computeWindow(entry, sim);
    const logPmin=Math.log10(Pmin), logPmax=Math.log10(Pmax);
    const { warp, wMin, wMax } = this._tempScale(entry, Tmin, Tmax);
    function X(T){ return padL + (warp(T)-wMin)/(wMax-wMin)*plotW; }
    function Y(P){const lp=Math.log10(Math.max(P,Pmin));return padT+plotH-(lp-logPmin)/(logPmax-logPmin)*plotH;}

    ctx.strokeStyle=rgba(T.bdr,0.6); ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(padL,padT); ctx.lineTo(padL,padT+plotH); ctx.lineTo(padL+plotW,padT+plotH); ctx.stroke();

    // Sombreamento de fundo por região de fase, calculado a partir das
    // mesmas curvas reais (fusão/ebulição/sublimação) — reforça
    // visualmente qual fase corresponde a cada combinação T×P na janela
    this._drawPhaseRegions(ctx, entry, X, Y, padL, padT, plotW, plotH, Tmin, Tmax, Pmin, Pmax);

    // Curva de fusão (sólido↔líquido): desenhada por TODA a faixa de
    // pressão visível na janela, do ponto triplo até Pmax — antes essa
    // curva parava em Pmin*0.9, deixando-a colada/cortada na borda
    // esquerda sempre que a janela se estendia bem abaixo do ponto
    // triplo (causa raiz do corte visto no diagrama).
    ctx.strokeStyle=rgba(T.solid,0.9); ctx.lineWidth=1.3; ctx.beginPath();
    let firstM=true;
    const PtClamped = Math.max(entry.Pt, Pmin);
    for (let P=PtClamped; P<=Pmax*1.02; P*=1.06) {
      const Tf=meltingPointAtPressure(entry,P); const px=X(Tf), py=Y(P);
      if (firstM){ctx.moveTo(px,py);firstM=false;} else ctx.lineTo(px,py);
    }
    ctx.stroke();

    // Curva de ebulição (líquido↔gás): do ponto triplo até o ponto
    // crítico. A extrapolação por Clausius-Clapeyron (válida apenas
    // próxima da pressão de referência) pode divergir do Tc real em
    // pressões muito distantes de 1 atm — por isso a curva é forçada a
    // terminar EXATAMENTE no ponto crítico real (Tc,Pc), e não onde a
    // fórmula extrapolada calcularia, evitando o "ponto crítico
    // flutuando isolado" visto quando a curva nunca alcançava esse
    // marcador.
    ctx.strokeStyle=rgba(T.gas,0.9); ctx.lineWidth=1.3; ctx.beginPath();
    let first=true;
    const nSteps=40;
    for (let i=0;i<=nSteps;i++) {
      // Interpola em escala log de pressão entre PtClamped e Pc — gera
      // pontos intermediários parecidos com a versão anterior, mas
      // SEMPRE inclui o ponto final exato (Tc,Pc) como última amostra.
      const logP = Math.log10(PtClamped) + (Math.log10(entry.Pc)-Math.log10(PtClamped))*(i/nSteps);
      const P = i===nSteps ? entry.Pc : Math.pow(10,logP);
      const Tb = i===nSteps ? entry.Tc : boilingPointAtPressure(entry,P);
      const px=X(Tb), py=Y(P);
      if (first){ctx.moveTo(px,py);first=false;} else ctx.lineTo(px,py);
    }
    ctx.stroke();

    // Curva de sublimação (sólido↔gás): de Pmin até o ponto triplo
    ctx.strokeStyle=rgba(T.violet,0.7); ctx.lineWidth=1; ctx.setLineDash([3,2]); ctx.beginPath();
    first=true;
    for (let P=Pmin; P<=entry.Pt; P*=1.2) {
      const Tsub=boilingPointAtPressure(entry,P); const px=X(Tsub), py=Y(P);
      if (first){ctx.moveTo(px,py);first=false;} else ctx.lineTo(px,py);
    }
    ctx.stroke(); ctx.setLineDash([]);

    // Ponto triplo e crítico: a janela agora SEMPRE os inclui (são
    // usados diretamente no cálculo de _computeWindow), então não há
    // mais necessidade de checagem condicional — sempre visíveis.
    const ttx=X(entry.Tt), tty=Y(entry.Pt);
    ctx.fillStyle=T.tx1; ctx.beginPath(); ctx.arc(ttx,tty,3,0,7); ctx.fill();
    ctx.font='8px Consolas'; ctx.fillStyle=rgba(T.tx1,0.75); ctx.textAlign='left';
    ctx.fillText('triplo', ttx+5, tty-4);

    const tcx=X(entry.Tc), tcy=Y(entry.Pc);
    ctx.fillStyle=T.red; ctx.beginPath(); ctx.arc(tcx,tcy,3,0,7); ctx.fill();
    ctx.fillStyle=rgba(T.red,0.85);
    ctx.fillText('crítico', tcx+5, tcy-4);

    // Marcadores de fusão/ebulição normais (a 1 atm) — pontos de
    // referência clássicos do currículo, sempre visíveis também
    const fx=X(entry.Tf), fy=Y(1.0);
    ctx.fillStyle=rgba(T.solid,0.9); ctx.beginPath(); ctx.arc(fx,fy,2.2,0,7); ctx.fill();
    const bx=X(entry.Tb), by=Y(1.0);
    ctx.fillStyle=rgba(T.gas,0.9); ctx.beginPath(); ctx.arc(bx,by,2.2,0,7); ctx.fill();

    // Marcador do AMBIENTE SIMULADO atual — sempre visível, pois a
    // janela é calculada para garantir isso. Pulsa sutilmente para
    // destacar que é o ponto controlado pelo usuário, não um dado fixo.
    const curX=X(sim.T_C), curY=Y(sim.P_atm);
    const pulse = 4 + Math.sin(sim.frame*0.06)*0.8;
    ctx.strokeStyle=T.tx1; ctx.lineWidth=1.6;
    ctx.beginPath(); ctx.moveTo(curX-7,curY); ctx.lineTo(curX+7,curY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(curX,curY-7); ctx.lineTo(curX,curY+7); ctx.stroke();
    ctx.beginPath(); ctx.arc(curX,curY,pulse,0,7); ctx.stroke();

    ctx.font='8px Consolas'; ctx.fillStyle=rgba(T.tx2,0.7); ctx.textAlign='left';
    ctx.fillText('T (°C) →', padL+plotW-40, padT+plotH+14);
    ctx.save(); ctx.translate(8,padT+plotH/2); ctx.rotate(-Math.PI/2);
    ctx.textAlign='center'; ctx.fillText('P (atm, log) →',0,0); ctx.restore();
    ctx.fillStyle=rgba(T.tx1,0.85); ctx.font='8px Consolas'; ctx.textAlign='left';
    ctx.fillText(`Ambiente: ${sim.T_C.toFixed(0)}°C, ${sim.P_atm<0.01?sim.P_atm.toExponential(1):sim.P_atm.toFixed(2)} atm`, padL+4, padT+plotH-4);
  };

  /** Sombreia o fundo do gráfico por região de fase (sólido/líquido/gás),
   *  amostrando o estado real (determineState) em uma grade T×P dentro
   *  da janela atual — assim a cor de fundo reflete exatamente as
   *  mesmas regras físicas usadas na simulação central.
   *  Usa a função X(T) recebida (que pode ser não-linear, ver
   *  _tempScale) para posicionar cada célula — essencial para o fundo
   *  ficar sincronizado com as curvas de fusão/ebulição, que usam essa
   *  mesma escala. Usar uma largura de célula uniforme aqui faria o
   *  sombreamento "descolar" visualmente das curvas reais. */
  PhaseDiagram.prototype._drawPhaseRegions = function(ctx, entry, X, Y, padL, padT, plotW, plotH, Tmin, Tmax, Pmin, Pmax) {
    const cols=36, rows=24;
    const T = window.SIEM_THEME;
    const colors = {
      solid:  rgba(T.solid,0.07),
      liquid: rgba(T.liquid,0.08),
      gas:    rgba(T.gas,0.05),
    };
    const cellH=plotH/rows;
    const logPmin=Math.log10(Pmin), logPmax=Math.log10(Pmax);
    // Pré-calcula os limites X reais (warpados) de cada coluna —
    // podem ter larguras diferentes entre si, refletindo a compressão
    // não-linear da escala de temperatura
    const colEdges = [];
    for (let c=0;c<=cols;c++) colEdges.push(X(Tmin + c/cols*(Tmax-Tmin)));

    for (let r=0;r<rows;r++) {
      const lp = logPmax - (r+0.5)/rows*(logPmax-logPmin);
      const P = Math.pow(10, lp);
      for (let c=0;c<cols;c++) {
        const T = Tmin + (c+0.5)/cols*(Tmax-Tmin);
        const info = determineState(entry, T, P);
        ctx.fillStyle = colors[info.state] || 'transparent';
        const x0=colEdges[c], x1=colEdges[c+1];
        ctx.fillRect(x0, padT+r*cellH, Math.max(1,x1-x0+0.5), cellH+0.5);
      }
    }
  };

