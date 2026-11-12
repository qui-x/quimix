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

  // Uma posição 3D por amostra. A câmera reprojeta o mesmo conjunto ao girar.
  function orbitalSamples(form, l, count, extent) {
    const points = [];
    // Separação radial/angular da mesma densidade usada nos cortes.
    // O jacobiano r² entra na distribuição de raios amostrados.
    const cumulative = [];
    let mass = 0;
    for (let i=0; i<128; i++) {
      const r = (i+.5)/128;
      mass += r**(2*l+2) * Math.exp(-4*r*r) * (1-r*r)**2;
      cumulative.push(mass);
    }
    while (points.length < count) {
      const z = 2*Math.random()-1, angle = 2*Math.PI*Math.random();
      const ring = Math.sqrt(1-z*z);
      const x = ring*Math.cos(angle), y = ring*Math.sin(angle);
      if (Math.random() >= form[1](x,y,z)**2) continue;
      const target = Math.random()*mass;
      const bin = cumulative.findIndex(value => value >= target);
      const radius = extent*(bin+Math.random())/128;
      points.push({x:x*radius, y:y*radius, z:z*radius, l});
    }
    return points;
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
  function orbitalSurface(form) {
    const pieces = [];
    let peak = 0;
    for (let i=0; i<1400; i++) {
      const z = (2*i+1)/1400-1, angle = i*Math.PI*(3-Math.sqrt(5));
      const ring = Math.sqrt(1-z*z), x = ring*Math.cos(angle), y = ring*Math.sin(angle);
      const radius = Math.abs(form[1](x,y,z));
      peak = Math.max(peak,radius);
      pieces.push({x:x*radius,y:y*radius,z:z*radius,radius});
    }
    return pieces.filter(p => p.radius > peak*.06).map(p => ({
      x:p.x/peak,y:p.y/peak,z:p.z/peak,radius:p.radius/peak
    }));
  }

  AtomicSim.prototype._drawOrbitalForm = function(brush, size, sub, form) {
    const cor = quantumColors[sub.l], rgb = this._hexToRgbStr(cor);
    const rgba = (_,alpha) => `rgba(${rgb},${alpha})`;
    const scale = size*.42;
    if (!sub.l) {
      desenharNuvemOrbital(brush,{x:size/2,y:size/2,A:scale,B:scale,ang:0,cor,alfa:1},true,rgba);
      return;
    }
    if (!this.qClouds.has(form)) this.qClouds.set(form,orbitalSurface(form));
    const patches = this.qClouds.get(form).map(p => {
      const pt = this.qCamera.project(p.x,p.y,p.z,size/2,size/2,scale);
      const width = scale*(.034+.073*p.radius)*pt.persp;
      return {x:pt.sx,y:pt.sy,A:width,B:width,ang:0,depth:pt.depth,cor,alfa:.42};
    });
    patches.sort((a,b) => b.depth-a.depth);
    for (const patch of patches) desenharNuvemOrbital(brush,patch,true,rgba);
  };

  AtomicSim.prototype._totalPoints = function() {
    if (this.qClouds.has('total')) return this.qClouds.get('total');
    const points = [];
    const maxN = Math.max(...this.qSubshells.map(sub => sub.n));
    for (const sub of this.qSubshells) {
      const forms = quantumForms[sub.l];
      for (let e=0; e<sub.count; e++) {
        points.push(...orbitalSamples(forms[e % forms.length], sub.l, Math.ceil(4500/this.Z), sub.n/maxN));
      }
    }
    this.qClouds.set('total', points);
    return points;
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
      const size = Math.max(1, Math.round(Math.min(W,H)*.9));
      const layer = this.qLayer ??= document.createElement('canvas');
      layer.width = layer.height = size;
      const brush = layer.getContext('2d');
      if (section || focus) {
        const sub = section?.sub || focus;
        const forms = quantumForms[sub.l];
        this._drawOrbitalForm(brush,size,sub,section?.form || forms[(sub.count-1)%forms.length]);
      } else {
        const dot = Math.max(1, size*.003);
        brush.globalAlpha = .72;
        for (const p of this._totalPoints()) {
          const pt = camera.project(p.x,p.y,p.z,size/2,size/2,size*.48);
          brush.fillStyle = quantumColors[p.l];
          brush.fillRect(pt.sx,pt.sy,dot*pt.persp,dot*pt.persp);
        }
      }
      this.qCompositeKey = key;
    }
    const side = Math.min(W,H)*.9;
    ctx.drawImage(this.qLayer,cx-side/2,cy-side/2,side,side);
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
