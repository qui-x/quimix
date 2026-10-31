/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODELOS FÍSICOS — Rutherford (1911)
   ARQUIVO: rutherford.js
   ───────────────────────────────────────────────────────────────
   Duas vistas no mesmo canvas: (1) PADRÃO — estrutura interna do
   núcleo (prótons+nêutrons) cercada pela eletrosfera; (2) EASTER
   EGG — o experimento histórico de espalhamento de Geiger e
   Marsden (1909), disparo manual de partículas alfa contra uma
   folha de ouro, com tan(θ/2) = kZe²/(2Eb).
   Adiciona a AtomicSim.prototype: _buildRutherford,
   _buildNucleusStructure, _updateNucleusStructure, fireAlpha,
   _rutherfordAngle, _updateRutherfordScatter, _updateRutherford,
   _drawRutherford, _drawNucleusStructure, _drawScatterExperiment.
   Depende de: models/atomic-sim-core.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
  // RUTHERFORD — duas vistas no mesmo canvas principal:
  //
  //  • PADRÃO: estrutura interna do átomo — núcleo central denso
  //    (prótons + nêutrons) cercado pela eletrosfera.
  //  • EASTER EGG (logo do cabeçalho): espalhamento de Geiger &
  //    Marsden (1909) — somente partículas alfa, com disparo manual,
  //    contra o núcleo do elemento selecionado na tabela.
  //    Física: tan(θ/2) = kZe²/(2Eb), com fator K calibrado de
  //    forma didática (ver _rutherfordAngle).
  // ════════════════════════════════════════════════════════════════

  AtomicSim.prototype._buildRutherford = function() {
    const W=this.canvas.width||800, H=this.canvas.height||600;

    // ── Estrutura interna do núcleo (visão PADRÃO do modelo) ──
    // Prótons e nêutrons agrupados no centro + eletrosfera externa.
    // Número de prótons = Z do elemento selecionado; número de nêutrons
    // aproximado por (massa atômica arredondada − Z), com mínimo de 0.
    this._buildNucleusStructure();

    // ── Layout do espalhamento histórico (Geiger & Marsden, 1909) ──
    // Mantido pronto para o easter egg, mas não é mais a vista padrão.
    this.ruthSourceX  = W*0.08;
    this.ruthFoilX    = W*0.42;
    this.ruthNucleusX = W*0.5;
    this.ruthNucleusY = H*0.52;
    this.ruthScreenR  = Math.min(W,H)*0.42;

    if (!this.ruthAlphas)      this.ruthAlphas = [];
    if (!this.ruthScint)       this.ruthScint = [];
    if (this.ruthFired      === undefined) this.ruthFired = 0;
    if (this.ruthDeflected  === undefined) this.ruthDeflected = 0;

    if (!this.ruthFoilNuclei) {
      this.ruthFoilNuclei=[];
      const rows=5;
      for (let i=0;i<rows;i++) {
        this.ruthFoilNuclei.push({
          x:this.ruthFoilX + (Math.random()-.5)*6,
          y:H*(0.15+i*0.18) + (Math.random()-.5)*10,
        });
      }
    }
  };

  /**
   * Monta a estrutura interna do núcleo para a vista PADRÃO do modelo
   * de Rutherford: prótons (Z, número atômico) e nêutrons (massa
   * atômica arredondada − Z) agrupados no centro, com a eletrosfera
   * representada por anéis externos onde os elétrons se movem — a
   * mesma física de coesão de curto alcance usada no easter egg
   * (analogia à força nuclear forte), aqui reaproveitada para a vista
   * principal do modelo em vez de ficar restrita a um extra escondido.
   */
  AtomicSim.prototype._buildNucleusStructure = function() {
    const W=this.canvas.width||800, H=this.canvas.height||600;
    const cx=W/2, cy=H/2;
    const Z = this.Z;
    const massNum = Math.round(parseFloat(String(this.elData[3]).replace(/[\[\]]/g,'')) || Z*2);
    const numNeutrons = Math.max(0, massNum - Z);
    const numProtons = Z;
    const total = numProtons + numNeutrons;

    const nucleusR = this.nucleusRadius ? this.nucleusRadius(16) : 16 * Math.cbrt(Math.max(1,massNum));

    // Limita a quantidade renderizada para manter legibilidade visual
    // em elementos pesados — amostra proporcional da composição real.
    const showProtons  = Math.min(numProtons,  40);
    const showNeutrons = Math.min(numNeutrons, 40);
    const showTotal    = showProtons + showNeutrons;

    // Cria array tipado e EMBARALHA (Fisher-Yates) para misturar
    // prótons e nêutrons uniformemente — sem embaralhamento, o build
    // anterior colocava todos os prótons num hemisfério e todos os
    // nêutrons no outro, criando dois clusters separados em vez de
    // um núcleo homogêneo como a física real descreve.
    const types = [
      ...Array(showProtons).fill('proton'),
      ...Array(showNeutrons).fill('neutron'),
    ];
    for (let i = types.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [types[i], types[j]] = [types[j], types[i]];
    }

    const particles = [];
    for (let i=0; i<showTotal; i++) {
      // Distribui em espiral uniforme (sequência de Fibonacci) dentro
      // do núcleo — evita clusters angulares e preenche o volume todo.
      const frac = i / Math.max(1, showTotal-1);
      const a = i * 2.39996; // ângulo dourado (2π/φ²)
      const r = nucleusR * (0.15 + Math.sqrt(frac) * 0.72);
      particles.push({
        type: types[i],
        x: cx + Math.cos(a)*r,
        y: cy + Math.sin(a)*r,
        vx: (Math.random()-.5)*0.18,
        vy: (Math.random()-.5)*0.18,
      });
    }

    this.nucleusParticles = particles;
    this.nucleusCenter = {cx, cy};
    this.nucleusR = nucleusR;
    this.nucleusRealCounts = { protons: numProtons, neutrons: numNeutrons, total };

    // Eletrosfera — velocidade orbital alinhada com o modelo de Bohr
    // (BOHR_OMEGA_K / √n) para manter consistência visual entre modelos
    // e evitar que os elétrons girem rápido demais.
    const shells = this.electrons;
    const maxShellR = Math.min(W,H)*0.46;
    this.nucleusShells = shells.map((count,i)=>({
      count,
      radius: maxShellR * (0.35 + (i/(Math.max(1,shells.length-1)))*0.65),
      electrons: Array.from({length:count}, (_,k)=>({
        angle: (k/count)*Math.PI*2,
        speed: BOHR_OMEGA_K / Math.sqrt(i+1), // mesma fórmula do Bohr
      })),
    }));
  };

  AtomicSim.prototype._updateNucleusStructure = function() {
    if (!this.nucleusParticles) return;
    const { cx, cy } = this.nucleusCenter;
    const k = 0.012; // coesão fraca de curto alcance (análoga à força nuclear forte)
    for (const p of this.nucleusParticles) {
      const dx=p.x-cx, dy=p.y-cy, d=Math.hypot(dx,dy)||0.1;
      const Fc = -k*d;
      let fx = Fc*(dx/d), fy = Fc*(dy/d);
      for (const q of this.nucleusParticles) {
        if (q===p) continue;
        const ddx=p.x-q.x, ddy=p.y-q.y, rij=Math.hypot(ddx,ddy)||0.1;
        const Frep = 1.2/(rij*rij+2);
        fx += Frep*(ddx/rij); fy += Frep*(ddy/rij);
      }
      p.vx=(p.vx+fx)*0.92; p.vy=(p.vy+fy)*0.92;
      p.x+=p.vx; p.y+=p.vy;
    }
    for (const shell of this.nucleusShells||[]) {
      for (const e of shell.electrons) e.angle += e.speed;
    }
  };

  /** Lançamento de partícula alfa — usado exclusivamente pelo easter
   * egg (experimento de espalhamento de Geiger & Marsden, 1909). */
  // ── Espalhamento — apenas alfa, alvo = núcleo de hidrogênio ──

  AtomicSim.prototype.fireAlpha = function(impactParam) {
    const H=this.canvas.height;
    const E_MeV = 5.0;
    const b = impactParam !== undefined
      ? impactParam
      : (Math.random()-0.5) * 2 * (Math.random()<0.08 ? H*0.05 : H*0.4);

    this.ruthAlphas.push({
      x: this.ruthSourceX, y: this.ruthNucleusY + b,
      b, vx: 4.2, vy: 0, E_MeV,
      scattered: false, angle: 0, trail: [], hit: false, bornAt: this.t,
    });
    this.ruthFired++;
  };

  /**
   * tan(θ/2) = k·Z·e² / (2·E·b). O alvo agora reflete o elemento
   * selecionado na tabela periódica (Z real), em vez de hidrogênio
   * fixo — coerente com o núcleo visual também crescer conforme a
   * massa do elemento (ver nucleusRadius). Elementos mais pesados
   * produzem deflexões maiores, fiel à física (tan(θ/2) ∝ Z).
   *
   * AJUSTE: a proporcionalidade literal (K ∝ Z) faz elementos pesados
   * (Au, Z=79; U, Z=92) saturarem em ricochete quase total (>150°)
   * mesmo para parâmetros de impacto moderados — perde-se a faixa
   * didática de "a maioria passa reto, poucos desviam muito" que é
   * o ponto central do experimento. Por isso usamos K ∝ Z^(1/3): a
   * tendência física correta é preservada (Z maior → desvio maior),
   * só que numa progressão suave que mantém a faixa observável e
   * gradual em toda a tabela periódica, do hidrogênio ao oganessônio.
   */
  AtomicSim.prototype._rutherfordAngle = function(b, E_MeV) {
    const Z = this.Z; // número atômico do elemento selecionado
    const K_BASE = 7;
    const K = K_BASE * Math.cbrt(Z);
    const bAbs = Math.max(Math.abs(b), 0.5);
    const tanHalf = K / (E_MeV * bAbs);
    const theta = 2 * Math.atan(tanHalf);
    return Math.sign(b || 1) * theta;
  };

  /**
   * Atualiza a física do espalhamento. O disparo de partículas é
   * SEMPRE manual (via fireAlpha(), chamado pelos botões da sidebar) —
   * não há mais lógica de disparo automático/contínuo aqui.
   */
  AtomicSim.prototype._updateRutherfordScatter = function() {
    const W=this.canvas.width, H=this.canvas.height;

    for (const a of this.ruthAlphas) {
      if (!a.scattered) {
        a.x += a.vx;
        a.y = this.ruthNucleusY + a.b;
        a.trail.push({x:a.x, y:a.y});
        // Antes da deflexão, mantém só os últimos 35 pontos da aproximação
        // (o trecho reto inicial é longo — 80 frames até o núcleo — mas só
        // precisamos ver o feixe chegando, não toda a viagem desde a fonte).
        if (a.trail.length > 35) a.trail.shift();

        if (a.x >= this.ruthNucleusX - 4) {
          a.angle = this._rutherfordAngle(a.b, a.E_MeV);
          const speed = Math.hypot(a.vx, a.vy);
          a.vx = speed * Math.cos(a.angle);
          a.vy = speed * Math.sin(a.angle);
          a.scattered = true;
          if (Math.abs(a.angle) > 5*Math.PI/180) this.ruthDeflected++;
          // Marca o índice do trail em que ocorreu a deflexão — usado no
          // desenho para destacar visualmente o ponto de inflexão da curva.
          a.deflectionIdx = a.trail.length - 1;
        }
      } else {
        a.x += a.vx; a.y += a.vy;
        a.trail.push({x:a.x, y:a.y});
        // Pós-deflexão: buffer maior, e nunca descarta pontos anteriores
        // ao índice de deflexão — assim a curva de entrada (reta) e a
        // curva de saída (desviada) ficam visíveis juntas, no mesmo feixe.
        const minKeep = (a.deflectionIdx ?? 0) + 60;
        if (a.trail.length > Math.max(70, minKeep) ) {
          // Remove apenas pontos MUITO antigos, nunca cruzando o ponto de deflexão
          const excess = a.trail.length - Math.max(70, minKeep);
          if (excess > 0 && a.deflectionIdx > 0) {
            a.trail.splice(0, Math.min(excess, a.deflectionIdx - 2));
            a.deflectionIdx = Math.max(0, a.deflectionIdx - Math.min(excess, a.deflectionIdx - 2));
          }
        }

        const dx=a.x-this.ruthNucleusX, dy=a.y-this.ruthNucleusY;
        const dist=Math.hypot(dx,dy);
        if (!a.hit && dist >= this.ruthScreenR) {
          a.hit = true;
          const screenAngle = Math.atan2(dy,dx);
          this.ruthScint.push({ angle: screenAngle, t: this.t, theta: Math.abs(a.angle)*180/Math.PI });
          if (this.ruthScint.length > 260) this.ruthScint.shift();
          playTone(180+Math.min(Math.abs(a.angle)*180/Math.PI,90)*4, 0.04, 0.025);
        }
      }
    }

    // BUGFIX CRÍTICO: o filtro de remoção usava a distância até o núcleo
    // ANTES de verificar se a partícula já havia sido defletida. Como a
    // fonte nasce a ~336px do núcleo e o raio da tela de cintilação é só
    // ~210px (×1.15 ≈ 241px), toda partícula recém-criada já nascia FORA
    // do raio permitido e era removida no frame seguinte ao nascimento —
    // antes mesmo de avançar visualmente. Por isso o feixe nunca chegava
    // a ser visto entrando ou sendo defletido. Agora a remoção por
    // distância só vale após a deflexão (quando a partícula de fato
    // pode varrer até a tela); antes disso, só removemos por posição X
    // fora dos limites do canvas.
    this.ruthAlphas = this.ruthAlphas.filter(a=>{
      if (!a.scattered) return a.x > -50 && a.x < W+50; // ainda aproximando-se: nunca remove por raio
      const dx=a.x-this.ruthNucleusX, dy=a.y-this.ruthNucleusY;
      return Math.hypot(dx,dy) < this.ruthScreenR*1.15 && a.x > -50 && a.x < W+50;
    });
    // Os contadores (partículas disparadas/deflexões) são lidos
    // diretamente de this.ruthFired/this.ruthDeflected pela camada de
    // UI (AtomicApp), via cache de DOM — este método de física não
    // manipula elementos do DOM diretamente.
  };

  /**
   * Atualização do modelo de Rutherford. Dois estados possíveis,
   * ambos processados dentro do ciclo update() principal (sem loop
   * isolado): vista padrão (estrutura do núcleo) ou modo Easter Egg
   * (espalhamento de Geiger & Marsden, 1909 — disparo manual, nunca
   * automático). O estado é controlado por this.ruthEggMode, alternado
   * pela sidebar via AtomicApp._toggleEggMode().
   */
  AtomicSim.prototype._updateRutherford = function() {
    if (this.ruthEggMode) this._updateRutherfordScatter();
    else this._updateNucleusStructure();
  };

  // ── RUTHERFORD ─────────────────────────────────────────────────
  /**
   * Despacha entre as duas vistas do modelo de Rutherford: padrão
   * (estrutura do núcleo) e Easter Egg (espalhamento). Mesmo padrão
   * de update(): a renderização inteira passa pelo draw() principal
   * do canvas, sem canvas/loop isolado.
   */
  AtomicSim.prototype._drawRutherford = function(ctx,W,H) {
    if (this.ruthEggMode) { this._drawScatterExperiment(ctx,W,H); return; }
    this._drawNucleusStructure(ctx,W,H);
  };

  /**
   * Vista PADRÃO do modelo de Rutherford: estrutura interna do átomo —
   * núcleo central denso (prótons + nêutrons) e a eletrosfera externa,
   * onde os elétrons se movem. Esta é a contribuição central de
   * Rutherford (núcleo, 1911; próton, 1917-19) somada ao que ele
   * teorizou (nêutron, 1920, confirmado por Chadwick em 1932).
   */
  AtomicSim.prototype._drawNucleusStructure = function(ctx,W,H) {
    if (!this.nucleusParticles) { this._buildNucleusStructure(); }
    const { cx, cy } = this.nucleusCenter;
    const R = this.nucleusR;

    // Eletrosfera — camadas externas tracejadas com elétrons em órbita
    for (const shell of this.nucleusShells||[]) {
      ctx.beginPath(); ctx.arc(cx,cy,shell.radius,0,Math.PI*2);
      ctx.strokeStyle='rgba(96,165,250,.12)'; ctx.setLineDash([2,6]); ctx.lineWidth=1; ctx.stroke();
      ctx.setLineDash([]);
      for (const e of shell.electrons) {
        const ex=cx+Math.cos(e.angle)*shell.radius, ey=cy+Math.sin(e.angle)*shell.radius;
        ctx.beginPath(); ctx.arc(ex,ey,3.5,0,Math.PI*2);
        ctx.fillStyle='#93c5fd'; ctx.shadowColor='#60a5fa'; ctx.shadowBlur=8; ctx.fill(); ctx.shadowBlur=0;
      }
    }
    ctx.fillStyle='rgba(96,165,250,.5)'; ctx.font='10px Consolas';
    const outerR = this.nucleusShells?.length ? this.nucleusShells[this.nucleusShells.length-1].radius : R*4;
    ctx.fillText('Eletrosfera (elétrons em órbita)', cx-outerR*0.55, cy-outerR-8);

    // Halo do núcleo (zona de força nuclear de curto alcance)
    const haloG = ctx.createRadialGradient(cx,cy,0,cx,cy,R*1.6);
    haloG.addColorStop(0,'rgba(245,158,11,.14)'); haloG.addColorStop(1,'rgba(245,158,11,0)');
    ctx.beginPath(); ctx.arc(cx,cy,R*1.6,0,Math.PI*2); ctx.fillStyle=haloG; ctx.fill();

    // Prótons (p⁺) e nêutrons (n) — cores distintas, labels sempre
    // visíveis com tamanho adaptativo ao raio da partícula.
    // O tamanho da partícula escala inversamente com o total de
    // partículas para evitar sobreposição em elementos pesados.
    const totalPart = this.nucleusParticles.length;
    for (const p of this.nucleusParticles) {
      const isProton = p.type==='proton';
      const col = isProton ? '#fde68a' : '#94a3b8';
      // Tamanho decresce suavemente com mais partículas — mínimo 6px
      // para que o label fique sempre legível, máximo 10px.
      const size = Math.max(6, Math.min(10, R*0.22 - totalPart*0.04));
      ctx.beginPath(); ctx.arc(p.x,p.y,size,0,Math.PI*2);
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=7; ctx.fill(); ctx.shadowBlur=0;
      // Labels: visíveis sempre que a partícula for grande o suficiente
      // para o texto não ficar ilegível (>=6px de raio).
      if (size >= 6) {
        const fontSize = Math.max(6, Math.floor(size*0.85));
        ctx.fillStyle='rgba(0,0,0,.8)';
        ctx.font=`bold ${fontSize}px Consolas`;
        ctx.textAlign='center';
        ctx.fillText(isProton?'p⁺':'n', p.x, p.y+fontSize*0.38);
        ctx.textAlign='left';
      }
    }

    const counts = this.nucleusRealCounts || {protons:this.Z, neutrons:0};
    // presa à parte livre (_hud), uma linha ACIMA da legenda — antes as duas caíam no mesmo lugar e se sobrepunham
    this._hud(ctx, x0 => { ctx.fillStyle='rgba(122,154,181,.6)'; ctx.font='10px Consolas';
      ctx.fillText(`${this.sym} (Z=${this.Z}): ${counts.protons} próton(s) + ${counts.neutrons} nêutron(s) no núcleo`, x0+14, H-28); });

    this._legend(ctx,H,'Núcleo (Rutherford 1911/1917-19) + nêutron (teorizado por Rutherford, confirmado por Chadwick em 1932)');
  };

  /**
   * Reconstrução visual do experimento de espalhamento de Geiger e
   * Marsden (1909) — agora usada EXCLUSIVAMENTE pelo easter egg
   * (acionado pelo logo do cabeçalho), não mais a vista padrão deste
   * modelo. A vista padrão (_drawRutherford) mostra a estrutura
   * interna do núcleo, que é o que esse experimento revelou.
   */
  AtomicSim.prototype._drawScatterExperiment = function(ctx,W,H) {
    const cx=this.ruthNucleusX, cy=this.ruthNucleusY, R=this.ruthScreenR;

    // Tela de cintilação ZnS
    ctx.beginPath();
    ctx.arc(cx,cy,R,-Math.PI*0.92,Math.PI*0.92);
    ctx.strokeStyle='rgba(167,139,250,.22)'; ctx.lineWidth=3; ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx,cy,R+2,-Math.PI*0.92,Math.PI*0.92);
    ctx.strokeStyle='rgba(167,139,250,.08)'; ctx.setLineDash([1,3]); ctx.lineWidth=8;
    ctx.stroke(); ctx.setLineDash([]);

    ctx.font='9px Consolas'; ctx.fillStyle='rgba(122,154,181,.45)';
    for (let deg=0; deg<=150; deg+=30) {
      const rad=deg*Math.PI/180;
      const lx=cx+Math.cos(rad)*(R+14), ly1=cy-Math.sin(rad)*(R+14);
      const ly2=cy+Math.sin(rad)*(R+14);
      ctx.fillText(deg+'°', lx-8, ly1+3);
      if (deg>0) ctx.fillText(deg+'°', lx-8, ly2+3);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(rad)*R, cy-Math.sin(rad)*R);
      ctx.strokeStyle='rgba(122,154,181,.05)'; ctx.lineWidth=1; ctx.stroke();
      if (deg>0) { ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx+Math.cos(rad)*R, cy+Math.sin(rad)*R); ctx.strokeStyle='rgba(122,154,181,.05)'; ctx.stroke(); }
    }

    for (const s of this.ruthScint) {
      const age=this.t-s.t;
      const alpha=Math.max(0, 0.65 - age*0.004);
      if (alpha<=0) continue;
      const sx=cx+Math.cos(s.angle)*R, sy=cy+Math.sin(s.angle)*R;
      ctx.beginPath(); ctx.arc(sx,sy,2.2,0,Math.PI*2);
      ctx.fillStyle=`rgba(167,243,208,${alpha})`;
      ctx.shadowColor='rgba(167,243,208,0.8)'; ctx.shadowBlur=age<5?8:0;
      ctx.fill(); ctx.shadowBlur=0;
    }
    this.ruthScint = this.ruthScint.filter(s=>this.t-s.t < 160);

    const foilTop=cy-H*0.4, foilBot=cy+H*0.4;
    const foilGrad=ctx.createLinearGradient(this.ruthFoilX-3,0,this.ruthFoilX+3,0);
    foilGrad.addColorStop(0,'rgba(96,165,250,0.05)'); foilGrad.addColorStop(0.5,'rgba(96,165,250,0.35)'); foilGrad.addColorStop(1,'rgba(96,165,250,0.05)');
    ctx.fillStyle=foilGrad; ctx.fillRect(this.ruthFoilX-3, foilTop, 6, foilBot-foilTop);
    ctx.fillStyle='rgba(96,165,250,.55)'; ctx.font='10px Consolas';
    ctx.save(); ctx.translate(this.ruthFoilX+14, cy); ctx.rotate(Math.PI/2);
    ctx.fillText(`Alvo: ${this.elData[2]} (${this.sym}) · A=${this.massNumber}`, -90, 0); ctx.restore();

    for (const n of this.ruthFoilNuclei||[]) {
      ctx.beginPath(); ctx.arc(n.x, n.y, 2.5, 0, Math.PI*2); ctx.fillStyle='rgba(96,165,250,.5)'; ctx.fill();
    }

    const colX=this.ruthSourceX + (this.ruthFoilX-this.ruthSourceX)*0.55;
    ctx.fillStyle='rgba(71,85,105,.55)';
    ctx.fillRect(colX-5, cy-H*0.38, 10, H*0.38-12);
    ctx.fillRect(colX-5, cy+12, 10, H*0.38-12);
    ctx.fillStyle='rgba(148,163,184,.5)'; ctx.font='9px Consolas';
    ctx.fillText('Colimador de Pb', colX-32, cy-H*0.38-6);

    const srcPulse=1+0.08*Math.sin(this.t*0.05);
    const sg=ctx.createRadialGradient(this.ruthSourceX,cy,0,this.ruthSourceX,cy,14*srcPulse);
    sg.addColorStop(0,'rgba(134,239,172,.6)'); sg.addColorStop(1,'rgba(134,239,172,0)');
    ctx.beginPath(); ctx.arc(this.ruthSourceX,cy,14*srcPulse,0,Math.PI*2); ctx.fillStyle=sg; ctx.fill();
    ctx.beginPath(); ctx.arc(this.ruthSourceX,cy,6,0,Math.PI*2);
    ctx.fillStyle='#86efac'; ctx.shadowColor='#86efac'; ctx.shadowBlur=10; ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='rgba(134,239,172,.65)'; ctx.font='9px Consolas';
    ctx.fillText('Fonte α (Po-210)', this.ruthSourceX-28, cy+24);

    // ── Núcleo do alvo — tamanho escalado pela lei física real
    // R = R₀·A^(1/3) (A = número de massa), em vez de um raio fixo.
    // Hidrogênio (A≈1) é o caso-base (10px); elementos mais pesados
    // crescem com a raiz cúbica de sua massa atômica.
    const nucR = this.nucleusRadius(10);
    const ng=ctx.createRadialGradient(cx-2,cy-2,0,cx,cy,nucR);
    ng.addColorStop(0,'#fef9c3'); ng.addColorStop(.5,'#f59e0b'); ng.addColorStop(1,'#92400e');
    ctx.beginPath(); ctx.arc(cx,cy,nucR,0,Math.PI*2);
    ctx.fillStyle=ng; ctx.shadowColor='#f59e0b'; ctx.shadowBlur=18+nucR*0.6; ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.7)'; ctx.font=`${Math.max(8, Math.min(13, nucR*0.4))}px Consolas`;
    ctx.fillText(`${this.sym} Z=${this.Z}`, cx-nucR*0.7, cy-nucR-6);

    // ── Partículas alfa como FEIXES DE LUZ ──────────────────────────
    // Na visão macroscópica, cada alfa é renderizada como um traço de
    // luz contínuo (não um ponto isolado): núcleo brilhante na cabeça
    // do feixe + cauda translúcida com glow, cuja cor e intensidade
    // mudam conforme a deflexão (amarelo = reto, magenta/rosa = desviado).
    for (const a of this.ruthAlphas) {
      const deflectDeg = Math.abs(a.angle)*180/Math.PI;
      const isDeflected = deflectDeg>5;
      const beamColor = isDeflected ? '251,113,133' : '253,224,71'; // rosa : amarelo
      const headColor = isDeflected ? '#fb7185' : '#fde047';

      if (a.trail.length>1) {
        // Cauda do feixe desenhada como múltiplos segmentos com alpha
        // crescente em direção à cabeça — efeito de "risca de luz"
        const n = a.trail.length;
        for (let k=1;k<n;k++) {
          const t0 = a.trail[k-1], t1 = a.trail[k];
          const frac = k/n; // 0 (cauda) → 1 (cabeça)
          const alpha = 0.05 + frac*frac*0.55;
          const width = 1.5 + frac*3.5;
          ctx.beginPath();
          ctx.moveTo(t0.x,t0.y); ctx.lineTo(t1.x,t1.y);
          ctx.strokeStyle = `rgba(${beamColor},${alpha.toFixed(2)})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        // Glow externo ao longo de toda a cauda (camada extra de brilho)
        ctx.beginPath();
        ctx.moveTo(a.trail[0].x, a.trail[0].y);
        for (let k=1;k<n;k++) ctx.lineTo(a.trail[k].x, a.trail[k].y);
        ctx.strokeStyle = `rgba(${beamColor},0.15)`;
        ctx.lineWidth = isDeflected ? 9 : 6;
        ctx.shadowColor = `rgba(${beamColor},0.9)`;
        ctx.shadowBlur = isDeflected ? 16 : 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (a.hit) continue;
      // Cabeça do feixe — núcleo brilhante e bem maior que antes
      ctx.beginPath(); ctx.arc(a.x,a.y,6,0,Math.PI*2);
      ctx.fillStyle = headColor;
      ctx.shadowColor = headColor;
      ctx.shadowBlur = isDeflected ? 22+deflectDeg/8 : 16;
      ctx.fill(); ctx.shadowBlur=0;
      // Núcleo interno bem definido (alto contraste)
      ctx.beginPath(); ctx.arc(a.x,a.y,2.5,0,Math.PI*2);
      ctx.fillStyle = '#fff'; ctx.fill();
    }

    ctx.fillStyle='rgba(122,154,181,.55)'; ctx.font='10px Consolas';
    this._hud(ctx, x0 => ctx.fillText(`α lançadas: ${this.ruthFired}  ·  deflexões >5°: ${this.ruthDeflected}  ·  E=5 MeV`, x0+14, 22));

    this._legend(ctx,H,'tan(θ/2) = kZe²/(2Eb) · feixe rosa = desvio · clique no canvas para lançar');
  };

