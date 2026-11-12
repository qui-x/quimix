/* Nuvem total com ocupações de fillSubshells e vistas qualitativas de
   orbitais representativos. Dependência angular: harmônicos esféricos reais
   (https://openmopac.net/Manual/real_spherical_harmonics.html). */
'use strict';

  const quantumColors = ['#3585ce','#21906b','#b57a22','#9959b9'];

  const quantumSampleLimit = 120;
  // Polinômios sólidos reais (conjunto axial para f). Fatores constantes
  // não alteram a forma, pois cada imagem é normalizada pelo próprio máximo.
  const quantumForms = [
    [['s', () => 1, []]],
    [['pₓ', x => x, ['yz']], ['pᵧ', (x,y) => y, ['xz']], ['p𝓏', (x,y,z) => z, ['xy']]],
    [['dₓᵧ', (x,y) => x*y, ['xz','yz']], ['dₓ𝓏', (x,y,z) => x*z, ['xy','yz']],
     ['dᵧ𝓏', (x,y,z) => y*z, ['xy','xz']], ['d(x²−y²)', (x,y) => x*x-y*y, ['diagonal']],
     ['d(z²)', (x,y,z) => (2*z*z-x*x-y*y)/2, []]],
    [['fₓᵧ𝓏', (x,y,z) => x*y*z, ['xy','xz','yz']],
     ['f(z³)', (x,y,z) => z*(2*z*z-3*x*x-3*y*y)/3, ['xy']],
     ['f(xz²)', (x,y,z) => x*(4*z*z-x*x-y*y)/4, ['yz']],
     ['f(yz²)', (x,y,z) => y*(4*z*z-x*x-y*y)/4, ['xz']],
     ['f[z(x²−y²)]', (x,y,z) => z*(x*x-y*y), ['xy','diagonal']],
     ['f[x(x²−3y²)]', (x,y) => x*(x*x-3*y*y)/3, ['yz']],
     ['f[y(3x²−y²)]', (x,y) => y*(3*x*x-y*y)/3, ['xz']]]
  ];

  // Mesmo perfil suave para a imagem e a amostragem. A extensão radial é didática.
  function quantumDensity(form, plane, u, v, depth) {
    let x = u, y = v, z = depth;
    if (plane === 'yz') { x = 0; y = u; z = v; }
    if (plane === 'xz') { x = u; y = 0; z = v; }
    if (plane === 'diagonal') { x = u / Math.SQRT2; y = x; z = v; }
    const r2 = x*x + y*y + z*z;
    if (r2 >= 1) return 0;
    // Polinômios cartesianos dos orbitais representativos × envelope radial.
    const amplitude = form[1](x,y,z);
    return amplitude*amplitude * Math.exp(-4*r2) * (1-r2)**2;
  }

  AtomicSim.prototype._buildQuantum = function() {
    this.qSubshells = fillSubshells(this.Z);
    if (this.qElement !== this.Z) this.qFocus = this.qSubshells.at(-1);
    this.qElement = this.Z;
    this.qCamera ??= new OrbitCamera();
    this.qClouds = new Map();
    this.qCompositeKey = null;
  };

  // Superfície angular esquemática: o raio acompanha |Y| e chega a zero nos nós.
  // Os mesmos pequenos volumes difusos do SIQC compõem lóbulos e anéis.
  function orbitalSurface(form, samples = 1400) {
    const pieces = [];
    let peak = 0;
    for (let i=0; i<samples; i++) {
      const z = (2*i+1)/samples-1, angle = i*Math.PI*(3-Math.sqrt(5));
      const ring = Math.sqrt(1-z*z), x = ring*Math.cos(angle), y = ring*Math.sin(angle);
      const radius = Math.abs(form[1](x,y,z));
      peak = Math.max(peak,radius);
      pieces.push({x:x*radius,y:y*radius,z:z*radius,radius});
    }
    return pieces.filter(p => p.radius > peak*.06).map(p => ({
      x:p.x/peak,y:p.y/peak,z:p.z/peak,radius:p.radius/peak
    }));
  }

  AtomicSim.prototype._drawOrbitalCloud = function(brush, W, H, section, focus) {
    const total = !section && !focus;
    const subs = total ? this.qSubshells : [section?.sub || focus];
    const maxN = Math.max(...subs.map(sub => sub.n));
    const scale = Math.min(W,H)*.9*.42;
    const patches = [];
    for (const sub of subs) {
      const forms = quantumForms[sub.l];
      const occupied = total ? forms.slice(0, sub.count) :
        [section?.form || forms[(sub.count-1) % forms.length]];
      const extent = sub.n/maxN;
      for (const [i,form] of occupied.entries()) {
        const weight = total ? (1 + Number(i+forms.length < sub.count))/2 : 1;
        const cor = quantumColors[sub.l];
        if (!sub.l) {
          const pt = this.qCamera.project(0,0,0,W/2,H/2,scale);
          const width = scale*extent*this.qCamera.zoom*pt.persp;
          patches.push({x:pt.sx,y:pt.sy,A:width,B:width,ang:0,depth:pt.depth,cor,alfa:weight});
          continue;
        }
        const samples = total && this.Z > 10 ? 180 : 1400;
        const key = form[0] + samples;
        if (!this.qClouds.has(key)) this.qClouds.set(key,orbitalSurface(form,samples));
        for (const p of this.qClouds.get(key)) {
          const pt = this.qCamera.project(p.x*extent,p.y*extent,p.z*extent,W/2,H/2,scale);
          const width = scale*extent*(.034+.073*p.radius)*Math.sqrt(1400/samples)*pt.persp*this.qCamera.zoom;
          patches.push({x:pt.sx,y:pt.sy,A:width,B:width,ang:0,depth:pt.depth,cor,alfa:.42*weight/(total ? Math.sqrt(occupied.length) : 1)});
        }
      }
    }
    const rgba = (color,alpha) => `rgba(${this._hexToRgbStr(color)},${alpha})`;
    patches.sort((a,b) => b.depth-a.depth);
    for (const patch of patches) desenharNuvemOrbital(brush,patch,true,rgba);
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
        density[index] += quantumDensity(section.form, section.plane, (2*x+1)/size-1, 1-(2*y+1)/size, z);
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
    if (!s || s.form[2].includes(s.plane)) return;
    const end = Math.min(s.points.length+24, quantumSampleLimit);
    // Limites superiores de r^(2l) exp(-4r²) e dos produtos angulares.
    const maxDensity = [1, 1/(4*Math.E), 1/(4*Math.E**2), 27/(64*Math.E**3)][s.l];
    while (s.points.length < end) {
      const u = 2*Math.random()-1, v = 2*Math.random()-1;
      const z = s.plane === 'projection' ? 2*Math.random()-1 : 0;
      if (Math.random()*maxDensity < quantumDensity(s.form,s.plane,u,v,z)) s.points.push([u,v]);
    }
  };

  // ── QUÂNTICO ───────────────────────────────────────────────────
  AtomicSim.prototype._drawQuantum = function(ctx,W,H) {
    const cx=W/2, cy=H/2;

    if (this.qSection && this.qSection.plane !== 'orbital') {
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
    const camera = this.qCamera;
    const section = this.qSection;
    const focus = this.qFocus;
    const key = [section?.label,focus?.label,W,H,camera.yaw,camera.pitch,camera.zoom].join(',');
    if (key !== this.qCompositeKey) {
      const layer = this.qLayer ??= document.createElement('canvas');
      layer.width = Math.ceil(W);
      layer.height = Math.ceil(H);
      const brush = layer.getContext('2d');
      this._drawOrbitalCloud(brush,W,H,section,focus);
      this.qCompositeKey = key;
    }
    ctx.drawImage(this.qLayer,0,0);
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

    this._legend(ctx,H,section ? section.label + " · vista orbital 3D · raio esquemático" : focus ? `Orbital ${focus.n}${quantumForms[focus.l][(focus.count-1) % quantumForms[focus.l].length][0]} · subnível ${focus.label} com ${focus.count} e⁻ · raio esquemático` : 'Nuvem total · orbitais sobrepostos · raio esquemático');
  };
