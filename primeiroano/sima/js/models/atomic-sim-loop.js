/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODELOS FÍSICOS — orquestração da simulação
   ARQUIVO: atomic-sim-loop.js
   ───────────────────────────────────────────────────────────────
   update() e draw() são os despachantes chamados a cada frame:
   olham this.model e chamam o método de update/draw do modelo
   ativo (Dalton, Thomson, Rutherford, Bohr ou Quantum — cada um
   definido nos outros arquivos de models/). Também traz duas
   funções pequenas usadas por vários modelos ao desenhar
   (_hexToRgbStr, _legend).
   ⚠ Este arquivo deve carregar DEPOIS de todos os outros arquivos
   de models/, já que update()/draw() só fazem sentido quando os
   métodos de update/draw de cada modelo já foram adicionados — mas
   por serem apenas ATRIBUIÇÕES ao protótipo (não chamadas), a
   ordem exata só importa antes da simulação realmente começar a
   rodar, o que só acontece no primeiro requestAnimationFrame.
   Adiciona a AtomicSim.prototype: update, draw, _hexToRgbStr,
   _legend.
   Depende de: models/atomic-sim-core.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
  // LOOP PRINCIPAL
  // ════════════════════════════════════════════════════════════════
  AtomicSim.prototype.update = function() {
    this.t++;
    switch(this.model) {
      case 'dalton':     this._updateDalton();     break;
      case 'thomson':    this._updateThomson();     break;
      case 'rutherford': this._updateRutherford();  break;
      case 'bohr':       this._updateBohr();        break;
      // A nuvem quântica muda ao selecionar ou amostrar, não por frame.
    }
  };

  AtomicSim.prototype.draw = function() {
    const ctx=this.ctx, W=this.canvas.width, H=this.canvas.height;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,W,H);
    // a cena na parte que se vê (ver _vistaLivre, abaixo)
    const v=this._vista=this._vistaLivre(W,H);
    ctx.setTransform(v.s,0,0,v.s,v.tx,v.ty);
    switch(this.model) {
      case 'dalton':     this._drawDalton(ctx,W,H);     break;
      case 'thomson':    this._drawThomson(ctx,W,H);    break;
      case 'rutherford': this._drawRutherford(ctx,W,H); break;
      case 'bohr':       this._drawBohr(ctx,W,H);       break;
      case 'quantum':    this._drawQuantum(ctx,W,H);    break;
    }
    ctx.setTransform(1,0,0,1,0,0);
  };

  /* A ÁREA LIVRE — o card flutuante do trilho (sidebar-rail.js · Oclusao)
     cobre uma faixa do canvas SEM mudar o tamanho dele: aqui, mudar o canvas
     chama rebuild() e recomeça o modelo (Thomson, Bohr, Rutherford). Os
     modelos guardam posições em px absolutos, então a cena é desenhada por
     uma VISTA (escala + deslocamento), sem tocar na física:
       · os átomos CENTRADOS (Thomson, Rutherford, Bohr, Quântico) só
         DESLIZAM para o centro da parte livre — e só encolhem se o átomo,
         com os rótulos das camadas, não couber nela;
       · o que usa o canvas INTEIRO (as partículas de Dalton, o experimento
         de espalhamento) é desenhado inteiro, em escala, na parte livre.
     Os textos de canto (legenda, contagens, subcamadas) não passam pela
     vista: ficam presos às bordas da parte livre (_hud). O clique desfaz a
     vista (app/eventos.js). Sem card: a identidade.
       tela = mundo × s + (tx, ty)      mundo = (tela − (tx, ty)) / s */
  AtomicSim.prototype._vistaLivre = function(W,H) {
    const id = { s:1, tx:0, ty:0, ax:0, aw:W };
    const O = window.Oclusao; if (!O) return id;
    const a = O.area(this.canvas); if (!(a.esq + a.dir > 0.5)) return id;
    const m = Math.min(W,H), cx = W/2;
    let esq = 0, dir = W, R;                       // a extensão do conteúdo, em x do mundo
    switch (this.model) {
      case 'thomson':    R = (this._thomsonR || m*.32) + 34; esq = cx-R; dir = cx+R; break;
      case 'rutherford': if (!this.ruthEggMode) { R = m*.46 + 24; esq = cx-R; dir = cx+R; } break;
      case 'bohr':       R = m*.46; esq = cx-R-24; dir = cx+R+84; break;   // os rótulos das camadas, à direita
      case 'quantum':    R = m*.46 + 22; esq = cx-R; dir = cx+R; break;
    }
    const s = Math.min(1, a.w / Math.max(1, dir-esq));
    return { s, tx: a.x + a.w/2 - ((esq+dir)/2)*s, ty: H*(1-s)/2, ax: a.x, aw: a.w };
  };

  /* desenha em coordenadas de TELA, preso à parte livre (x0 = a borda
     esquerda dela, w = a largura) — para os textos de canto */
  AtomicSim.prototype._hud = function(ctx, fn) {
    const v = this._vista || { ax:0, aw:this.canvas.width };
    ctx.save(); ctx.setTransform(1,0,0,1,0,0); fn(v.ax, v.aw); ctx.restore();
  };

  /** Converte #rrggbb em "r,g,b" para montar rgba() dinamicamente —
   * mesmo utilitário hexToRgb usado internamente pelo SITP. */
  AtomicSim.prototype._hexToRgbStr = function(hex) {
    const h = (hex||'#f59e0b').replace('#','');
    if (h.length<6) return '245,158,11';
    const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
    return `${r},${g},${b}`;
  };

  AtomicSim.prototype._legend = function(ctx,H,text){
    this._hud(ctx, x0 => { ctx.fillStyle='rgba(122,154,181,.42)'; ctx.font='11px Consolas'; ctx.fillText(text,x0+14,H-12); });
  };

