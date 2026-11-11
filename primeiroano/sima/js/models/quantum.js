/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODELOS FÍSICOS — Quântico / Schrödinger (1926)
   ARQUIVO: quantum.js
   ───────────────────────────────────────────────────────────────
   Nuvem eletrônica de probabilidade com a FORMA real de cada
   subcamada (s=esfera, p=dois lóbulos, d=quatro lóbulos em cruz,
   f=multilobular), montada a partir do preenchimento real de
   subcamadas do elemento selecionado (regra de Madelung). É o
   único modelo válido para qualquer um dos 118 elementos.
   Adiciona a AtomicSim.prototype: _buildQuantum, _updateQuantum,
   _drawQuantum.
   Depende de: models/atomic-sim-core.js, core/fisica.js
               (fillSubshells).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
  // QUÂNTICO — formas REAIS por subcamada (s=esfera, p=dumbbell,
  // d=clover), respeitando a configuração eletrônica real do elemento
  // ════════════════════════════════════════════════════════════════
  /**
   * Nuvem eletrônica de probabilidade — algoritmo PORTADO diretamente
   * do SITP (Simulador Interativo da Tabela Periódica), função
   * `_nuvemDrawOnCanvas` do scriptsitp.js. Mesma lógica de amostragem
   * por tipo de orbital, mesma paleta de cores (--orb-s/p/d/f do
   * tema padrão do SITP), mesmo raio de camada escalado por tipo
   * (SHELL_SCALE), e mesma densidade de pontos proporcional ao número
   * de elétrons em cada subcamada (em vez de um número fixo igual
   * para todas, como a implementação anterior do SIMA usava).
   */
  AtomicSim.prototype._buildQuantum = function() {
    const W=this.canvas.width||800, H=this.canvas.height||600;
    const cx=W/2, cy=H/2;
    const Z=this.Z;
    this.qSubshells = fillSubshells(Z);
    this.qCloud=[];

    // Paleta por TIPO de orbital (s/p/d/f) — réplica exata das CSS
    // vars --orb-s/p/d/f do tema padrão do SITP, em vez da cor por
    // camada (n) usada antes no SIMA.
    const ORB_COLOR = { s:'#5aabff', p:'#7df5b8', d:'#f5a623', f:'#c084e0' };
    // SHELL_SCALE: mesmo fator de redução de raio por tipo de orbital
    // usado no SITP — cada subcamada "mais angular" ocupa uma fração
    // menor do raio característico da camada n.
    const SHELL_SCALE = { s:1.0, p:0.78, d:0.6, f:0.45 };

    const MAX_R = Math.min(W,H)*0.46;
    const totalE = this.qSubshells.reduce((a,s)=>a+s.count,0) || 1;
    // N_DOTS: mesma fórmula do SITP — escala com Z, com piso e teto.
    const N_DOTS = Math.min(12000, Math.max(2000, Z*60));

    for (let si=0; si<this.qSubshells.length; si++) {
      const sub = this.qSubshells[si];
      const { n, l, count } = sub;
      const tipo = ['s','p','d','f'][l] || 's';
      const color = ORB_COLOR[tipo];
      const scale = SHELL_SCALE[tipo] || 1.0;
      const baseR = MAX_R * (n/7) * scale;
      // Densidade de pontos PROPORCIONAL ao número de elétrons da
      // subcamada (frac = count/totalE) — subcamadas mais ocupadas
      // recebem mais pontos, exatamente como no SITP.
      const frac = count/totalE;
      const nDots = Math.round(N_DOTS * frac / 8); // /8: ajuste de escala para o canvas do SIMA (menor que o do SITP)
      const spread = baseR * (0.35 + 0.15*(tipo==='s'?0:tipo==='p'?1:tipo==='d'?2:3));

      for (let i=0; i<nDots; i++) {
        let x, y, alpha;

        if (tipo === 's') {
          // ── s: ESFERA — simetria radial completa via amostragem
          // u^(1/3) (distribuição volumétrica uniforme numa esfera),
          // com alpha decaindo conforme a distância radial aumenta.
          const u = Math.random();
          const r = baseR * Math.pow(u, 1/3) + (Math.random()-0.5)*spread*0.6;
          const theta = Math.random()*Math.PI*2;
          x = cx + r*Math.cos(theta);
          y = cy + r*Math.sin(theta);
          alpha = 0.55 - (r/(baseR+spread))*0.4;
          // Nós radiais REAIS: um orbital ns tem (n−1) superfícies
          // esféricas onde ψ=0 (2s tem 1, 3s tem 2...). Na seção 2D
          // da nuvem aparecem como anéis vazios — posição estilizada
          // em frações iguais do raio característico da subcamada.
          const nNodes = n - 1;
          let isNode = false;
          for (let k = 1; k <= nNodes; k++) {
            const rNode = baseR * (k / (nNodes + 1));
            if (Math.abs(Math.abs(r) - rNode) < baseR * 0.05) { isNode = true; break; }
          }
          if (isNode) continue;

        } else if (tipo === 'p') {
          // ── p: DUMBBELL — dois lóbulos opostos, lado escolhido
          // aleatoriamente a CADA ponto (não fixo por subcamada).
          const lobe = Math.random()<0.5 ? 1 : -1;
          const r = baseR * (0.5 + Math.random()*0.9);
          const ang = (Math.random()-0.5)*Math.PI*0.7;
          x = cx + lobe*r*Math.cos(ang);
          y = cy + r*Math.sin(ang)*0.5;
          alpha = 0.5 * (1 - Math.abs(ang)/(Math.PI*0.7)*0.5);

        } else if (tipo === 'd') {
          // ── d: CLOVER — quatro lóbulos em cruz (dx²-y² simplificado).
          const lobe = Math.floor(Math.random()*4);
          const ang0 = lobe*Math.PI/2 + Math.PI/4;
          const r = baseR * (0.3 + Math.random()*0.85);
          const jitter = (Math.random()-0.5)*spread*0.9;
          x = cx + (r+jitter)*Math.cos(ang0 + (Math.random()-0.5)*0.6);
          y = cy + (r+jitter)*Math.sin(ang0 + (Math.random()-0.5)*0.6);
          alpha = 0.4 + Math.random()*0.2;

        } else {
          // ── f: MULTILOBULAR — 8 lóbulos, projeção estilizada do
          // orbital fxyz (8 lóbulos apontando aos vértices de um cubo).
          // Nota: 7 é o número de ORBITAIS f (valores de m), não de
          // lóbulos de um orbital individual — o nº de lóbulos varia
          // conforme o orbital (de 2 lóbulos + toros no fz³ a 8 no fxyz).
          const lobe = Math.floor(Math.random()*8);
          const ang0 = lobe*(Math.PI/4);
          const r = baseR * (0.25 + Math.random()*0.75);
          const jitter = (Math.random()-0.5)*spread*1.1;
          x = cx + (r+jitter)*Math.cos(ang0 + (Math.random()-0.5)*0.4);
          y = cy + (r+jitter)*Math.sin(ang0 + (Math.random()-0.5)*0.4);
          alpha = 0.3 + Math.random()*0.25;
        }

        alpha = Math.max(0.05, Math.min(0.82, alpha));
        this.qCloud.push({ x, y, color, alpha, size: 1.2 });
      }
    }
  };

  // Seção central em coordenadas normalizadas. Apenas a dependência angular
  // de |Y|² é representada; o raio é esquemático, sem escala de distância.
  AtomicSim.prototype.sampleQuantumSection = function() {
    const section = this.qSection;
    for (let i = 0; i < 800 && section.points.length < 4000; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const u = Math.cos(angle), v = Math.sin(angle);
      let x = u, y = v, z = 0;
      if (section.plane === 'yz') { x = 0; y = u; z = v; }
      if (section.plane === 'diagonal') { x = u / Math.SQRT2; y = x; z = v; }
      const angular = [1, x, 2*x*y, Math.sqrt(27)*x*y*z][section.l];
      if (Math.random() >= angular * angular) continue;
      const r = Math.sqrt(Math.random()) * (1 - 0.45 * Math.random());
      section.points.push([r*u, r*v]);
    }
  };

  AtomicSim.prototype._updateQuantum = function() {
    this.qFrame++;
    if (!this.qSection && this.qFrame % 30 === 0) this._buildQuantum();
  };

  // ── QUÂNTICO ───────────────────────────────────────────────────
  AtomicSim.prototype._drawQuantum = function(ctx,W,H) {
    const cx=W/2, cy=H/2;

    if (this.qSection) {
      const radius = Math.min(W, H) * 0.38;
      ctx.fillStyle = ['#3585ce','#21906b','#b57a22','#9959b9'][this.qSection.l];
      for (const [u,v] of this.qSection.points) {
        ctx.fillRect(cx + radius*u, cy - radius*v, 2, 2);
      }
      this._legend(ctx,H,'Corte central · densidade angular qualitativa · raio esquemático');
      return;
    }
    for (const p of this.qCloud) {
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle = `rgba(${this._hexToRgbStr(p.color)},${p.alpha.toFixed(2)})`;
      ctx.fill();
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

    // Legenda de subcamadas ocupadas (rótulo lateral).
    // presa à borda direita da parte livre (_hud), e não à do canvas
    this._hud(ctx, (x0, w) => {
      let labelY = 36;
      ctx.font='10px Consolas';
      for (const sub of this.qSubshells) {
        const shapeWord = sub.l===0?'esfera':sub.l===1?'dumbbell':sub.l===2?'clover':'multilobular';
        ctx.fillStyle = 'rgba(167,139,250,.9)';
        ctx.fillText(`${sub.label} (${shapeWord}) — ${sub.count}e⁻`, x0+w-190, labelY);
        labelY += 13;
      }
    });

    this._legend(ctx,H,'s=esfera · p=dumbbell (2 lóbulos) · d=clover (4 lóbulos) · f=multilobular (8 lóbulos) · nuvem qualitativa');
  };

