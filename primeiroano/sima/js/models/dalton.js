/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODELOS FÍSICOS — Dalton (1803)
   ARQUIVO: dalton.js
   ───────────────────────────────────────────────────────────────
   "Bola de bilhar": esferas rígidas e indivisíveis do elemento
   selecionado, com colisão puramente elástica (conservação de
   momento e energia cinética) — sem núcleo, sem elétrons.
   Adiciona a AtomicSim.prototype: _atomRadius, _buildDalton,
   _addDaltonAtom, resetDalton, _updateDalton, _drawDalton.
   Depende de: models/atomic-sim-core.js (classe já declarada),
               core/cor.js (catColor).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
  // DALTON — esferas duras do elemento selecionado
  // Raio visual ∝ Z^(1/3): ESCALA DIDÁTICA, apenas para diferenciar
  // elementos leves de pesados no canvas. Não é o raio atômico real
  // (que cai ao longo de cada período — não cresce com Z); a lei
  // r ∝ A^(1/3) vale para o RAIO NUCLEAR (ver nucleusRadius).
  // Colisão puramente elástica, sem ligação — Dalton postulava
  // esferas indivisíveis que apenas colidem e se separam.
  // ════════════════════════════════════════════════════════════════
  AtomicSim.prototype._atomRadius = function(Z) { return 10 + Math.cbrt(Z) * 3.2; };

  AtomicSim.prototype._buildDalton = function() {
    const W=this.canvas.width||800, H=this.canvas.height||600;
    if (this.daltonParticles.length === 0) {
      for (let i=0;i<14;i++) this._addDaltonAtom(this.elData, W, H);
    }
  };

  /** Adiciona um átomo do elemento dado em posição aleatória do canvas. */
  AtomicSim.prototype._addDaltonAtom = function(elData, W, H) {
    W = W || this.canvas.width; H = H || this.canvas.height;
    const Z = elData[0];
    const r = this._atomRadius(Z);
    this.daltonParticles.push({
      x: r + Math.random()*(W-2*r), y: r + Math.random()*(H-2*r),
      vx:(Math.random()-.5)*0.9, vy:(Math.random()-.5)*0.9,
      r, color: catColor(elData[4]),
    });
  };

  /** Remove todos os átomos e reinicia com o elemento atual. */
  AtomicSim.prototype.resetDalton = function() {
    this.daltonParticles = [];
    this._buildDalton();
  };

  AtomicSim.prototype._updateDalton = function() {
    const W=this.canvas.width, H=this.canvas.height;
    for (const p of this.daltonParticles) {
      p.x+=p.vx; p.y+=p.vy;
      if (p.x<p.r||p.x>W-p.r) p.vx*=-1;
      if (p.y<p.r||p.y>H-p.r) p.vy*=-1;
    }
    // Colisão elástica pura (conservação de momento e energia cinética)
    for (let i=0;i<this.daltonParticles.length-1;i++) {
      for (let j=i+1;j<this.daltonParticles.length;j++) {
        const a=this.daltonParticles[i], b=this.daltonParticles[j];
        const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy);
        if (d<a.r+b.r && d>0) {
          const nx=dx/d, ny=dy/d, ov=(a.r+b.r-d)*.5;
          a.x-=nx*ov; a.y-=ny*ov; b.x+=nx*ov; b.y+=ny*ov;
          const dvn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
          if (dvn<0) { a.vx+=dvn*nx; a.vy+=dvn*ny; b.vx-=dvn*nx; b.vy-=dvn*ny; }
        }
      }
    }
  };

  // ── DALTON ─────────────────────────────────────────────────────
  AtomicSim.prototype._drawDalton = function(ctx,W,H) {
    for (const p of this.daltonParticles) {
      ctx.shadowColor=p.color+'55'; ctx.shadowBlur=7;
      const g=ctx.createRadialGradient(p.x-p.r*.32,p.y-p.r*.32,0,p.x,p.y,p.r);
      g.addColorStop(0,p.color+'ff'); g.addColorStop(.65,p.color+'cc'); g.addColorStop(1,p.color+'44');
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill(); ctx.shadowBlur=0;
      const s=ctx.createRadialGradient(p.x-p.r*.4,p.y-p.r*.42,0,p.x-p.r*.15,p.y-p.r*.18,p.r*.55);
      s.addColorStop(0,'rgba(255,255,255,.4)'); s.addColorStop(1,'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=s; ctx.fill();
    }
    this._legend(ctx,H,'Esferas rígidas, indivisíveis e indestrutíveis · colisão elástica perfeita');
  };

