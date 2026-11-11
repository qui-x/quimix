/* Nuvem total com ocupações de fillSubshells e vistas qualitativas de
   orbitais representativos. Dependência angular: harmônicos esféricos reais
   (https://openmopac.net/Manual/real_spherical_harmonics.html). */
'use strict';

  const quantumColors = ['#3585ce','#21906b','#b57a22','#9959b9'];

  const quantumSampleLimit = 120;
  function nodalQuantumView(l, plane) {
    return (plane === 'yz' && l > 0) || (plane === 'xy' && l === 3);
  }

  // Mesmo perfil suave para a imagem e a amostragem. A extensão radial é didática.
  function quantumDensity(l, plane, u, v, depth) {
    let x = u, y = v, z = depth;
    if (plane === 'yz') { x = 0; y = u; z = v; }
    if (plane === 'diagonal') { x = u / Math.SQRT2; y = x; z = v; }
    const r2 = x*x + y*y + z*z;
    if (r2 >= 1) return 0;
    // Polinômios cartesianos dos orbitais representativos × envelope radial.
    const amplitude = l === 0 ? 1 : l === 1 ? x : l === 2 ? x*y : x*y*z;
    return amplitude*amplitude * Math.exp(-4*r2) * (1-r2)**2;
  }

  AtomicSim.prototype._buildQuantum = function() {
    this.qSubshells = fillSubshells(this.Z);
  };

  function quantumCloudImage(section) {
    const size = 144;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const pixels = ctx.createImageData(size,size);
    const density = new Float32Array(size*size);
    const slices = section.plane === 'projection' ? 24 : 1;
    let peak = 0;
    for (let y=0; y<size; y++) for (let x=0; x<size; x++) {
      const index = y*size+x;
      for (let k=0; k<slices; k++) {
        const z = (2*k+1)/slices-1;
        density[index] += quantumDensity(section.l, section.plane, (2*x+1)/size-1, 1-(2*y+1)/size, z);
      }
      peak = Math.max(peak,density[index]);
    }
    const rgb = parseInt(quantumColors[section.l].slice(1),16);
    for (let i=0; i<density.length; i++) {
      pixels.data[4*i] = rgb >> 16;
      pixels.data[4*i+1] = (rgb >> 8) & 255;
      pixels.data[4*i+2] = rgb & 255;
      pixels.data[4*i+3] = peak ? 235 * Math.sqrt(density[i]/peak) : 0;
    }
    ctx.putImageData(pixels,0,0);
    return canvas;
  }

  AtomicSim.prototype.sampleQuantumSection = function() {
    const s = this.qSection;
    if (!s || nodalQuantumView(s.l,s.plane)) return;
    const end = Math.min(s.points.length+24, quantumSampleLimit);
    // Limites superiores de r^(2l) exp(-4r²) e dos produtos angulares.
    const maxDensity = [1, 1/(4*Math.E), 1/(16*Math.E**2), 1/(64*Math.E**3)][s.l];
    while (s.points.length < end) {
      const u = 2*Math.random()-1, v = 2*Math.random()-1;
      const z = s.plane === 'projection' ? 2*Math.random()-1 : 0;
      if (Math.random()*maxDensity < quantumDensity(s.l,s.plane,u,v,z)) s.points.push([u,v]);
    }
  };

  // ── QUÂNTICO ───────────────────────────────────────────────────
  AtomicSim.prototype._drawQuantum = function(ctx,W,H) {
    const cx=W/2, cy=H/2;

    if (this.qSection) {
      const radius = Math.min(W, H) * 0.38;
      const section = this.qSection;
      if (!section.image) section.image = quantumCloudImage(section);
      ctx.drawImage(section.image,cx-radius,cy-radius,2*radius,2*radius);
      ctx.fillStyle = quantumColors[section.l];
      for (const [u,v] of section.points) {
        ctx.beginPath(); ctx.arc(cx+radius*u,cy-radius*v,1.6,0,Math.PI*2); ctx.fill();
      }
      ctx.fillText('+', cx-3, cy+3);
      const view = this.qSection.plane === 'projection' ? 'Projeção em xy' : 'Corte ' + this.qSection.plane;
      this._legend(ctx,H,`${this.qSection.label} · ${view} · raio esquemático`);
      return;
    }
    const radius = Math.min(W,H)*0.38;
    const maxN = Math.max(...this.qSubshells.map(sub => sub.n));
    // Sobreposição difusa das subcamadas, da mais extensa à mais interna.
    for (let n=maxN; n>=1; n--) for (const sub of this.qSubshells) {
      if (sub.n !== n) continue;
      const extent = radius*n/maxN;
      const rgb = this._hexToRgbStr(quantumColors[sub.l]);
      const opacity = 0.35 + 0.6*sub.count/(2*(2*sub.l+1));
      const g = ctx.createRadialGradient(cx,cy,0,cx,cy,extent);
      g.addColorStop(0,`rgba(${rgb},${opacity})`);
      g.addColorStop(0.55,`rgba(${rgb},${opacity*0.5})`);
      g.addColorStop(1,`rgba(${rgb},0)`);
      ctx.fillStyle=g; ctx.fillRect(cx-extent,cy-extent,2*extent,2*extent);
    }

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
