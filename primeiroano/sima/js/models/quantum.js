/* Nuvem total com ocupações de fillSubshells e vistas qualitativas de
   orbitais representativos. Dependência angular: harmônicos esféricos reais
   (https://openmopac.net/Manual/real_spherical_harmonics.html). */
'use strict';

  const quantumColors = ['#3585ce','#21906b','#b57a22','#9959b9'];

  // Vista de conjunto com média angular. O número de amostras por
  // subcamada acompanha sua ocupação; os raios são esquemáticos.
  AtomicSim.prototype._buildQuantum = function() {
    this.qSubshells = fillSubshells(this.Z);
    this.qCloud = [];
    const outer = Math.max(...this.qSubshells.map(sub => sub.n));
    const budget = Math.min(3200, Math.max(650, this.Z * 32));
    for (const sub of this.qSubshells) {
      const count = Math.round(budget * sub.count / this.Z);
      for (let i = 0; i < count; i++) {
        const z = 2 * Math.random() - 1;
        const angle = 2 * Math.PI * Math.random();
        const r = sub.n / outer * Math.cbrt(Math.random()) * (1 - 0.55*Math.random());
        const projected = r * Math.sqrt(1-z*z);
        this.qCloud.push({ x: projected*Math.cos(angle), y: projected*Math.sin(angle), l: sub.l });
      }
    }
  };

  AtomicSim.prototype.sampleQuantumSection = function() {
    const section = this.qSection;
    for (let i = 0; i < 800 && section.points.length < 4000; i++) {
      const angle = Math.random() * 2 * Math.PI;
      let u = Math.cos(angle), v = Math.sin(angle);
      let x = u, y = v, z = 0;
      if (section.plane === 'projection') {
        z = 2 * Math.random() - 1;
        const projected = Math.sqrt(1-z*z);
        u *= projected;
        v *= projected;
        x = u;
        y = v;
      } else if (section.plane === 'yz') { x = 0; y = u; z = v; }
      else if (section.plane === 'diagonal') { x = u / Math.SQRT2; y = x; z = v; }
      const angular = [1, x, 2*x*y, Math.sqrt(27)*x*y*z][section.l];
      if (Math.random() >= angular * angular) continue;
      const r = Math.pow(Math.random(), section.plane === 'projection' ? 1/3 : 1/2) * (1 - 0.55*Math.random());
      section.points.push([r*u, r*v]);
    }
  };

  // ── QUÂNTICO ───────────────────────────────────────────────────
  AtomicSim.prototype._drawQuantum = function(ctx,W,H) {
    const cx=W/2, cy=H/2;

    if (this.qSection) {
      const radius = Math.min(W, H) * 0.38;
      ctx.fillStyle = quantumColors[this.qSection.l];
      for (const [u,v] of this.qSection.points) {
        ctx.fillRect(cx + radius*u, cy - radius*v, 2, 2);
      }
      ctx.fillText('+', cx-3, cy+3);
      const view = this.qSection.plane === 'projection' ? 'Projeção em xy' : 'Corte ' + this.qSection.plane;
      this._legend(ctx,H,`${this.qSection.label} · ${view} · raio esquemático`);
      return;
    }
    const radius = Math.min(W,H)*0.38;
    ctx.globalAlpha = 0.62;
    for (const p of this.qCloud) {
      ctx.fillStyle = quantumColors[p.l];
      ctx.fillRect(cx + radius*p.x, cy - radius*p.y, 2, 2);
    }
    ctx.globalAlpha = 1;

    // Núcleo — gradiente com a cor REAL do átomo (elData[8], igual ao
    // atomCor do SITP), em vez de um amarelo fixo para todos os elementos.
    const atomColor = this.elData[8] || '#f59e0b';
    const ng=ctx.createRadialGradient(cx-1,cy-1,1,cx,cy,14);
    ng.addColorStop(0, `rgba(${this._hexToRgbStr(atomColor)},0.95)`);
    ng.addColorStop(0.5,`rgba(${this._hexToRgbStr(atomColor)},0.5)`);
    ng.addColorStop(1,  `rgba(${this._hexToRgbStr(atomColor)},0)`);
    ctx.beginPath(); ctx.arc(cx,cy,14,0,Math.PI*2);
    ctx.fillStyle=ng; ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.9)'; ctx.font=`bold ${this.sym.length>1?8:10}px Consolas`;
    ctx.fillText(this.sym,cx-this.sym.length*3,cy+3);

    this._legend(ctx,H,'Nuvem total · média angular · raio esquemático');
  };
