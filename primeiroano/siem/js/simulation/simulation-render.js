/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO — desenho 2D
   ARQUIVO: simulation-render.js
   ───────────────────────────────────────────────────────────────
   Tudo o que a simulação 2D desenha no canvas principal: o estado
   ocioso (sem substância selecionada), o recipiente/caixa, as
   ligações entre átomos de uma mesma molécula, a coesão visual no
   estado líquido e as moléculas em si (posição, rotação, cores CPK).
   Adiciona a Simulation.prototype: draw, _drawIdle, _drawContainer,
   _drawBonds, _drawCohesion, _drawMolecules.
   Depende de: simulation/simulation-core.js, core/cor.js (rgba),
               data/paleta-cpk.js (CPK), a11y/acessibilidade.js
               (window.SIEM_THEME).
═══════════════════════════════════════════════════════════════ */

'use strict';

Simulation.prototype.draw = function() {
    /* px CSS, nao px fisico: o contexto ja esta escalado por DPR. Com
       canvas.width aqui, o clearRect cobria a area certa por acidente em
       DPR 1 e sobrava/faltava area em qualquer outro valor. */
    const ctx=this.ctx, [W,H]=this._dims(), dpr=this.canvas.width/W;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,W,H);
    /* A ÁREA LIVRE (ver _vistaLivre, abaixo): com um card flutuante aberto, o
       recipiente inteiro é desenhado em escala na parte que se vê */
    const v=this._vista=this._vistaLivre(W,H);
    ctx.setTransform(dpr*v.s,0,0,dpr*v.s,dpr*v.tx,dpr*v.ty);
    if (!this.entry) this._drawIdle(ctx,W,H);
    else {
      this._drawContainer(ctx);
      if (this.state==='solid')  this._drawBonds(ctx);
      if (this.state==='liquid') this._drawCohesion(ctx);
      this._drawMolecules(ctx);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
  };

  /* A ÁREA LIVRE — o card flutuante do trilho (sidebar-rail.js · Oclusao)
     cobre uma faixa do canvas sem mudar o tamanho dele. As partículas vivem
     em px absolutos dentro da caixa (this.box, calculada no init): mudar a
     caixa reiniciaria a simulação ou espremeria as partículas contra a nova
     parede. Então o RECIPIENTE inteiro (a caixa + uma margem) é desenhado em
     escala, centrado na parte livre; a física não muda. Sem card: identidade.
     Não há clique no canvas 2D, então nada a inverter. */
  Simulation.prototype._vistaLivre = function(W,H) {
    const O=window.Oclusao;
    if (!O || !this.canvas.offsetParent) return { s:1, tx:0, ty:0 };
    const a=O.area(this.canvas);
    if (!(a.esq+a.dir>0.5)) return { s:1, tx:0, ty:0 };
    const b=this.box||{ x:W*0.08, y:H*0.08, w:W*0.84, h:H*0.84 }, m=24;
    const bx=b.x-m, bw=b.w+2*m, s=Math.min(1, a.w/bw);
    return { s, tx:a.x+a.w/2-(bx+bw/2)*s, ty:H*(1-s)/2 };
  };

  Simulation.prototype._drawIdle = function(ctx,W,H) {
    /* Fonte itálica pra bater com o padrão de hint usado no resto do
       projeto (.canvas-hint do SIMA, .sim-hint do SIME etc.) — antes
       usava Consolas reto, destoando visualmente dos outros. */
    ctx.font=`italic ${Math.max(11,W*0.013)}px system-ui, sans-serif`;
    ctx.fillStyle=rgba(window.SIEM_THEME.tx2,0.4); ctx.textAlign='center';
    ctx.fillText('← Selecione uma substância para começar',W/2,H/2);
    ctx.textAlign='left';
  };

  Simulation.prototype._drawContainer = function(ctx) {
    const { x,y,w,h } = this.box;
    const T = window.SIEM_THEME;
    const fills={solid:rgba(T.solid,0.03),liquid:rgba(T.liquid,0.04),gas:rgba(T.gas,0.02)};
    ctx.fillStyle=fills[this.state]||rgba(T.cyan,0.02);
    ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=T.bdr2; ctx.lineWidth=1.5; ctx.strokeRect(x,y,w,h);
  };

  Simulation.prototype._drawBonds = function(ctx) {
    const ps=this.particles;
    const col=hexRGB(this.entry.color);
    const cellEst=this.box.w/Math.max(1,Math.sqrt(this.N));
    const maxD2=(cellEst*1.5)**2;
    ctx.strokeStyle=`rgba(${col.r},${col.g},${col.b},0.3)`; ctx.lineWidth=1;
    for (let i=0;i<ps.length-1;i++) for (let j=i+1;j<ps.length;j++) {
      const dx=ps[j].bx-ps[i].bx, dy=ps[j].by-ps[i].by;
      const d2=dx*dx+dy*dy;
      if (d2<maxD2 && d2>1) { ctx.beginPath(); ctx.moveTo(ps[i].x,ps[i].y); ctx.lineTo(ps[j].x,ps[j].y); ctx.stroke(); }
    }
  };

  Simulation.prototype._drawCohesion = function(ctx) {
    const ps=this.particles;
    const col=hexRGB(this.entry.color);
    const maxD2=30**2;
    ctx.strokeStyle=`rgba(${col.r},${col.g},${col.b},0.16)`; ctx.lineWidth=1;
    for (let i=0;i<ps.length-1;i++) for (let j=i+1;j<ps.length;j++) {
      const dx=ps[j].x-ps[i].x, dy=ps[j].y-ps[i].y;
      const d2=dx*dx+dy*dy;
      if (d2<maxD2) { ctx.beginPath(); ctx.moveTo(ps[i].x,ps[i].y); ctx.lineTo(ps[j].x,ps[j].y); ctx.stroke(); }
    }
  };

  /** Desenha cada partícula como molécula real, com átomos posicionados
   *  segundo o ângulo VSEPR e cores CPK por elemento. */
  Simulation.prototype._drawMolecules = function(ctx) {
    const entry=this.entry;
    const atoms=entry.atoms;
    const isMonoatomic = atoms.length===1;

    // Escala visual = mesmo raio usado na física de colisão, para que o
    // que se vê corresponda exatamente ao volume que ocupa espaço real
    const pr = this._particleRadius();
    const scale = pr;
    const opacity = this.state==='gas' ? 0.6 : (this.state==='solid' ? 0.95 : 0.92);

    for (const p of this.particles) {
      if (isMonoatomic) {
        const el=atoms[0].el;
        const col = CPK[el] || entry.color;
        ctx.fillStyle = rgba(col, opacity);
        ctx.beginPath(); ctx.arc(p.x,p.y, scale*0.85, 0, Math.PI*2); ctx.fill();
        continue;
      }
      const cosA=Math.cos(p.angle), sinA=Math.sin(p.angle);
      // Desenha ligações primeiro (atrás dos átomos)
      ctx.strokeStyle = rgba(window.SIEM_THEME.tx2, this.state==='gas' ? opacity*0.5 : opacity*0.7);
      ctx.lineWidth = this.state==='gas' ? 1 : 1.6;
      const central = atoms[0];
      const cx = p.x + central.dx*scale*cosA - central.dy*scale*sinA;
      const cy = p.y + central.dx*scale*sinA + central.dy*scale*cosA;
      for (let k=1;k<atoms.length;k++) {
        const at=atoms[k];
        const ax = p.x + at.dx*scale*cosA - at.dy*scale*sinA;
        const ay = p.y + at.dx*scale*sinA + at.dy*scale*cosA;
        ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(ax,ay); ctx.stroke();
      }
      // Desenha átomos (central por último para ficar por cima das ligações)
      for (let k=1;k<atoms.length;k++) {
        const at=atoms[k];
        const ax = p.x + at.dx*scale*cosA - at.dy*scale*sinA;
        const ay = p.y + at.dx*scale*sinA + at.dy*scale*cosA;
        const col = CPK[at.el] || '#999';
        ctx.fillStyle = rgba(col, opacity);
        const r = (at.el==='H') ? scale*0.32 : scale*0.42;
        ctx.beginPath(); ctx.arc(ax,ay,r,0,Math.PI*2); ctx.fill();
      }
      const colC = CPK[central.el] || entry.color;
      ctx.fillStyle = rgba(colC, opacity);
      ctx.beginPath(); ctx.arc(cx,cy, scale*0.46, 0, Math.PI*2); ctx.fill();
    }
  };

