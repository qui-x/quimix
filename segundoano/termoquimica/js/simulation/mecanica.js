// ══════════════════════════════════════════════════════════════════
// FÍSICA/RENDERIZAÇÃO — classe ThermoSim (um canvas, cinco modos)
// ══════════════════════════════════════════════════════════════════
SITQ.ThermoSim = class ThermoSim {
  constructor(canvas, onEvent) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onEvent = onEvent || (() => {});
    this.mode = 'calor';
    this.time = 0;
    this.dpr = 1;
    this.W = 0;
    this.H = 0;

    // ── estado: calorímetro ──
    this.calor = {
      sub: SUBSTANCIAS[0],
      massa: 200,
      Ti: 20,
      Tf: 80,
      Tcur: 20,
      phase: 1,
      running: false,
      fired: false,
      // multifase: preenchidos só quando a substância tem dados de mudança
      // de fase (água, etanol) — ver _syncCalorFaixa() e construirSegmentosFase().
      fasesDados: null,
      segs: [],
      totalQ: 0,
      Qcur: 0,
      parts: Array.from({
        length: 26
      }, () => ({
        x: Math.random(),
        y: Math.random(),
        f: Math.random() * 6.28
      }))
    };
    // ── estado: curva de aquecimento ──
    this.curva = {
      sub: CURVA_SUBSTANCIAS[0],
      massa: 100,
      Ti: CURVA_SUBSTANCIAS[0].faixaPadrao[0],
      Tf: CURVA_SUBSTANCIAS[0].faixaPadrao[1],
      segs: [],
      totalQ: 0,
      Qcur: 0,
      running: false,
      done: false
    };
    this.buildCurva();
    // ── estado: perfil endo/exo ──
    this.perfil = {
      r: REACOES_PERFIL[0],
      cat: false,
      playing: false,
      t: 0,
      done: false,
      burst: []
    };
    // ── estado: Lei de Hess ──
    this.hess = {
      ex: HESS[0],
      soma: 0,
      solved: false,
      flash: 0
    };
    // ── estado: espontaneidade (ΔG = ΔH − T·ΔS) ──
    // T em KELVIN — o modo inteiro trabalha em kelvin de proposito, porque
    // ΔG = ΔH − T·ΔS so vale em escala absoluta e usar Celsius aqui e o erro
    // mais comum do topico.
    this.gibbs = {
      r: REACOES_GIBBS[0],
      T: 298.15
    };
    // ── estado: energia de ligação 3D ──
    this.lig = {
      r: REACOES_LIGACAO[0],
      inverted: false,
      auto: true,
      labels: true,
      rx: -0.32,
      ry: 0.55
    };
    this._bindPointer();
  }

  // ── Curva: monta os trechos sólido→líquido→vapor entre Ti e Tf ──
  buildCurva() {
    const r = SITQ.construirSegmentosFase(this.curva.sub, this.curva.massa, this.curva.Ti, this.curva.Tf);
    this.curva.segs = r.segs;
    this.curva.totalQ = r.totalQ;
    this.curva.fasesTxt = r.fasesTxt;
  }

  // ── redimensionamento com devicePixelRatio (mesmo contrato do SICQ) ──
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.W = Math.max(80, r.width);
    this.H = Math.max(80, r.height);
    this.Wc = this.W;                       // a largura do CANVAS (W pode encolher: ver areaLivre)
    this.x0 = 0;
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this._lastDPR = this.dpr;
    // ── escala do canvas (ver bloco ESCALA DO CANVAS, no topo) ──
    // O SITQ nao usa kLabel/kChip: escreve com ctx.font em strings cruas
    // ('11px Consolas, monospace'). patchCtxFont resolve os dois casos de
    // uma vez, porque intercepta a propriedade e nao a funcao de desenho.
    SITQ.patchCtxFont(this.ctx);
    SITQ.CANVAS_FS = SITQ.canvasFS(this.W);
    this.lay = SITQ.layoutMode(this.W);
  }

  /* ── A ÁREA LIVRE (sidebar-rail.js · Oclusao) ───────────────────
     Um card flutuante cobre uma faixa do canvas sem mudar o tamanho dele. A
     cena inteira — desenho E física (o estouro de partículas do perfil é
     calculado no update) — passa a viver na parte que se vê: W vira a largura
     livre, x0 o deslocamento, e o layout é refeito para a largura nova. Wc
     guarda a do canvas, que é a que o loop compara para detectar resize. */
  areaLivre() {
    const a = window.Oclusao ? window.Oclusao.area(this.canvas) : null;
    const Wc = this.Wc || this.W, w = a ? Math.min(Wc, a.w) : Wc;
    if (Math.abs(w - this.W) > 0.25) { this.W = w; this.lay = SITQ.layoutMode(w); }
    this.x0 = a ? a.x : 0;
  }

  // ── ATUALIZAÇÃO FÍSICA ──────────────────────────────────────────
  update(dt) {
    this.time += dt;
    if (this.mode === 'calor' && this.calor.running) {
      if (this.calor.segs.length) {
        // multifase (água/etanol atravessando fusão/ebulição): anima Qcur
        // linearmente, como na Curva — um simples lerp de T "pularia" os
        // patamares de calor latente num instante, o que seria errado.
        const dur = SITQ.isReduced() ? 0.01 : 6;
        this.calor.Qcur = Math.min(this.calor.totalQ, this.calor.Qcur + this.calor.totalQ * dt / dur);
        this.calor.Tcur = SITQ.pontoNosSegmentos(this.calor.segs, this.calor.fasesDados.fases, this.calor.Qcur).T;
        if (this.calor.Qcur >= this.calor.totalQ) {
          this.calor.running = false;
          this.onEvent('calor-done');
        }
      } else {
        const dur = SITQ.isReduced() ? 0.01 : 2.6;
        this.calor.phase = Math.min(1, this.calor.phase + dt / dur);
        const e = SITQ.easeIO(this.calor.phase);
        this.calor.Tcur = SITQ.lerp(this.calor.Ti, this.calor.Tf, e);
        if (this.calor.phase >= 1) {
          this.calor.running = false;
          this.onEvent('calor-done');
        }
      }
    }
    if (this.mode === 'curva' && this.curva.running) {
      const dur = SITQ.isReduced() ? 0.01 : 6;
      this.curva.Qcur = Math.min(this.curva.totalQ, this.curva.Qcur + this.curva.totalQ * dt / dur);
      if (this.curva.Qcur >= this.curva.totalQ) {
        this.curva.running = false;
        this.curva.done = true;
        this.onEvent('curva-done');
      }
    }
    if (this.mode === 'perfil') {
      if (this.perfil.playing) {
        const dur = SITQ.isReduced() ? 0.01 : 3.2;
        this.perfil.t = Math.min(1, this.perfil.t + dt / dur);
        if (this.perfil.t >= 1) {
          this.perfil.playing = false;
          this.perfil.done = true;
          this._spawnBurst();
          this.onEvent('perfil-done');
        }
      }
      this.perfil.burst.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.g * dt;
        p.life -= dt;
      });
      this.perfil.burst = this.perfil.burst.filter(p => p.life > 0);
    }
    if (this.mode === 'hess' && this.hess.flash > 0) this.hess.flash -= dt;
    if (this.mode === 'ligacao' && this.lig.auto && !this.lig.dragging && !SITQ.isReduced()) {
      this.lig.ry += dt * 0.5;
    }
  }
  _spawnBurst() {
    const exo = this.perfil.r.dH < 0;
    const g = this._perfilGeom();
    const px = g.xb,
      py = g.yOf(this.perfil.r.dH);
    for (let i = 0; i < 26; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = exo ? 60 + Math.random() * 120 : 40 + Math.random() * 60;
      this.perfil.burst.push(exo ? {
        x: px,
        y: py,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 40,
        g: 60,
        life: .9 + Math.random() * .5,
        exo
      } : {
        x: px + Math.cos(a) * 90,
        y: py + Math.sin(a) * 90,
        vx: -Math.cos(a) * v,
        vy: -Math.sin(a) * v,
        g: 0,
        life: .9 + Math.random() * .4,
        exo
      });
    }
  }

  // ── DESENHO ─────────────────────────────────────────────────────
  draw() {
    const {
      ctx,
      W,
      H
    } = this;
    ctx.clearRect(0, 0, this.Wc || W, H);
    if (W < 40 || H < 40) return;
    ctx.save(); ctx.translate(this.x0 || 0, 0);       // a cena começa onde a área livre começa
    try { this._desenharModo(); } finally { ctx.restore(); }
  }
  _desenharModo() {
    switch (this.mode) {
      case 'calor':
        this.drawCalor();
        break;
      case 'curva':
        this.drawCurva();
        break;
      case 'perfil':
        this.drawPerfil();
        break;
      case 'hess':
        this.drawHess();
        break;
      case 'ligacao':
        this.drawLigacao();
        break;
      case 'gibbs':
        this.drawGibbs();
        break;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     ESPONTANEIDADE — ΔG = ΔH − T·ΔS
     ══════════════════════════════════════════════════════════════ */

  /** Todas as contas do modo, num só lugar.
   *  A conversão de unidade é o ponto de atenção: ΔH vem em kJ/mol e ΔS em
   *  J/(mol·K), então T·ΔS precisa ser dividido por 1000 para somar com ΔH.
   *  Fazer isso errado é o erro campeão do tópico, e por isso o painel de
   *  resultados mostra o termo T·ΔS já convertido, em kJ/mol. */
  gibbsCalc(Topt) {
    const g = this.gibbs,
      r = g.r;
    const T = Topt == null ? g.T : Topt;
    const tds = T * r.dS / 1000; // kJ/mol
    const dG = r.dH - tds;
    // Temperatura de inversão só EXISTE se ΔH e ΔS tiverem o mesmo sinal:
    // caso contrário a reta ΔG(T) nunca cruza o zero.
    const temInversao = r.dH > 0 === r.dS > 0 && Math.abs(r.dS) > 1e-9;
    const Tinv = temInversao ? r.dH / r.dS * 1000 : null;
    // Os quatro quadrantes de sinal, que são o mapa mental do tópico
    let caso, regra;
    if (r.dH < 0 && r.dS > 0) {
      caso = 'ΔH < 0 e ΔS > 0';
      regra = 'espontânea a QUALQUER temperatura';
    } else if (r.dH > 0 && r.dS < 0) {
      caso = 'ΔH > 0 e ΔS < 0';
      regra = 'NUNCA espontânea (o inverso é que é)';
    } else if (r.dH > 0 && r.dS > 0) {
      caso = 'ΔH > 0 e ΔS > 0';
      regra = 'espontânea só em ALTA temperatura';
    } else {
      caso = 'ΔH < 0 e ΔS < 0';
      regra = 'espontânea só em BAIXA temperatura';
    }
    return {
      T,
      tds,
      dG,
      Tinv,
      temInversao,
      caso,
      regra,
      espontanea: dG < 0,
      // constante de equilíbrio associada: ΔG° = −R·T·ln K
      K: Math.exp(-dG * 1000 / (8.314 * Math.max(1, T)))
    };
  }
  drawGibbs() {
    const {
      ctx,
      W,
      H
    } = this;
    const g = this.gibbs,
      r = g.r,
      c = this.gibbsCalc();
    const est = W < 620;

    // ── cabeçalho ──
    ctx.fillStyle = SITQ.cssVar('--text-primary');
    ctx.font = `700 ${est ? 13 : 16}px Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.eq, W / 2, est ? 20 : 28, W - 20);
    ctx.fillStyle = SITQ.cssVar('--text-secondary');
    ctx.font = `${est ? 9 : 11}px Consolas, monospace`;
    ctx.fillText(`ΔH = ${SITQ.fmt(r.dH, 1)} kJ/mol   ·   ΔS = ${SITQ.fmt(r.dS, 1)} J/(mol·K)`, W / 2, est ? 36 : 50, W - 20);

    // ── gráfico ΔG × T: uma RETA de coeficiente angular −ΔS ──
    // Esse é o coração do modo. Ver ΔG como reta, e não como número solto,
    // é o que transforma "temperatura de inversão" em algo óbvio: é o ponto
    // onde a reta corta o eixo zero.
    const gx = est ? 46 : 74;
    const gy = est ? 54 : 72;
    const gw = Math.max(160, W - gx - (est ? 22 : 46));
    const gh = Math.max(120, est ? H * .48 : H * .60);
    const Tmin = 0,
      Tmax = 1500;
    // escala vertical simétrica em torno do zero, para o cruzamento ficar
    // sempre visível qualquer que seja a reação
    const g0 = r.dH,
      g1 = r.dH - Tmax * r.dS / 1000;
    const amp = Math.max(Math.abs(g0), Math.abs(g1), 10) * 1.12;
    const px = t => gx + (t - Tmin) / (Tmax - Tmin) * gw;
    const py = v => gy + gh / 2 - v / amp * (gh / 2);

    // eixos
    ctx.strokeStyle = SITQ.cssVar('--border', '#1c2e44');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();
    // zona espontânea (ΔG < 0) sombreada — a leitura visual do modo
    ctx.save();
    ctx.fillStyle = SITQ.cssVar('--accent-ok', '#4ade80');
    ctx.globalAlpha = .10;
    ctx.fillRect(gx, py(0), gw, gy + gh - py(0));
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = SITQ.cssVar('--text-secondary');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx, py(0));
    ctx.lineTo(gx + gw, py(0));
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = SITQ.cssVar('--accent-ok');
    ctx.textAlign = 'left';
    ctx.font = `${est ? 8 : 10}px Consolas, monospace`;
    ctx.fillText('ΔG < 0 · espontânea', gx + 6, py(0) + (est ? 12 : 15));
    ctx.fillStyle = SITQ.cssVar('--accent-exo');
    ctx.fillText('ΔG > 0 · não espontânea', gx + 6, py(0) - (est ? 10 : 13));

    // ticks de T
    ctx.fillStyle = SITQ.cssVar('--text-muted');
    ctx.textAlign = 'center';
    ctx.font = `${est ? 8 : 9}px Consolas, monospace`;
    [0, 300, 600, 900, 1200, 1500].forEach(t => {
      ctx.fillText(String(t), px(t), gy + gh + (est ? 10 : 13));
      ctx.strokeStyle = SITQ.cssVar('--border');
      ctx.beginPath();
      ctx.moveTo(px(t), gy + gh);
      ctx.lineTo(px(t), gy + gh + 4);
      ctx.stroke();
    });
    ctx.fillText('Temperatura (K)', gx + gw / 2, gy + gh + (est ? 24 : 30));
    ctx.save();
    ctx.translate(gx - (est ? 32 : 52), gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ΔG (kJ/mol)', 0, 0);
    ctx.restore();
    // ticks de ΔG
    ctx.textAlign = 'right';
    [-amp, -amp / 2, 0, amp / 2, amp].forEach(v => {
      ctx.fillText(SITQ.fmt(v, 0), gx - 5, py(v));
    });

    // a reta
    ctx.save();
    ctx.strokeStyle = r.cor;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(px(Tmin), py(g0));
    ctx.lineTo(px(Tmax), py(g1));
    ctx.stroke();
    ctx.restore();

    // temperatura de inversão
    if (c.temInversao && c.Tinv > Tmin && c.Tinv < Tmax) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = SITQ.cssVar('--accent-amber', '#fbbf24');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px(c.Tinv), gy);
      ctx.lineTo(px(c.Tinv), gy + gh);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = SITQ.cssVar('--accent-amber');
      ctx.font = `700 ${est ? 9 : 11}px Consolas, monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`T inversão ${SITQ.fmt(c.Tinv, 0)} K`, SITQ.clamp(px(c.Tinv), gx + 50, gx + gw - 50), gy - 6);
    }

    // ponto atual
    ctx.save();
    ctx.fillStyle = c.espontanea ? SITQ.cssVar('--accent-ok', '#4ade80') : SITQ.cssVar('--accent-exo', '#f87171');
    ctx.beginPath();
    ctx.arc(px(c.T), py(c.dG), est ? 5 : 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = c.espontanea ? SITQ.cssVar('--accent-ok') : SITQ.cssVar('--accent-exo');
    ctx.font = `700 ${est ? 10 : 12}px Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`${SITQ.fmt(c.T, 0)} K · ΔG = ${SITQ.fmt(c.dG, 1)} kJ`, SITQ.clamp(px(c.T), gx + 70, gx + gw - 70), py(c.dG) - (est ? 14 : 18));

    // ── balanço dos dois termos, em barras ──
    let by = gy + gh + (est ? 40 : 50);
    if (by + 60 < H) {
      const bw = Math.max(120, gw * .8);
      const bx0 = gx + (gw - bw) / 2;
      const maior = Math.max(Math.abs(r.dH), Math.abs(c.tds), 1);
      const barra = (rot, val, cor, y) => {
        const meio = bx0 + bw / 2;
        const w = Math.abs(val) / maior * (bw / 2 - 4);
        ctx.save();
        ctx.fillStyle = cor;
        ctx.globalAlpha = .8;
        if (val >= 0) ctx.fillRect(meio, y, w, est ? 12 : 15);else ctx.fillRect(meio - w, y, w, est ? 12 : 15);
        ctx.restore();
        ctx.fillStyle = SITQ.cssVar('--text-secondary');
        ctx.textAlign = 'right';
        ctx.font = `${est ? 9 : 10}px Consolas, monospace`;
        ctx.fillText(rot, bx0 - 6, y + (est ? 6 : 8));
        ctx.fillStyle = SITQ.cssVar('--text-primary');
        ctx.textAlign = 'left';
        ctx.fillText(`${SITQ.fmt(val, 1)} kJ`, bx0 + bw + 6, y + (est ? 6 : 8));
      };
      // linha do zero das barras
      ctx.save();
      ctx.strokeStyle = SITQ.cssVar('--border');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx0 + bw / 2, by - 4);
      ctx.lineTo(bx0 + bw / 2, by + (est ? 46 : 56));
      ctx.stroke();
      ctx.restore();
      barra('ΔH', r.dH, SITQ.cssVar('--accent-exo', '#f87171'), by);
      barra('−T·ΔS', -c.tds, SITQ.cssVar('--accent-cyan', '#22d3ee'), by + (est ? 16 : 20));
      barra('= ΔG', c.dG, c.espontanea ? SITQ.cssVar('--accent-ok', '#4ade80') : SITQ.cssVar('--accent-amber', '#fbbf24'), by + (est ? 32 : 40));
      ctx.textAlign = 'center';
      ctx.fillStyle = SITQ.cssVar('--text-muted');
      ctx.font = `${est ? 8 : 9}px Consolas, monospace`;
      by += est ? 52 : 64;
      if (by < H - 6) ctx.fillText(c.caso + ' → ' + c.regra, W / 2, by, W - 16);
    }
  }

  /* ═══════════ MODO 1 — CALORÍMETRO ═══════════ */
  drawCalor() {
    const {
      ctx,
      W,
      H,
      time
    } = this;
    const st = this.calor;
    const T = st.Tcur;
    const heating = st.Tf > st.Ti,
      active = st.running;
    const multifase = st.segs.length > 0;
    // fase atual: tanto faz se veio de uma transição ANIMADA em curso
    // (segs.length>0, fracSeg real) quanto de um estado PARADO de
    // água/etanol fora de qualquer patamar (fracSeg não se aplica) —
    // nos dois casos, o desenho tem que refletir a fase REAL da T atual,
    // não ficar preso na textura "padrão" (líquida) da substância.
    let faseAtual = null,
      fracSegAtual = 0;
    if (multifase) {
      const pos = SITQ.pontoNosSegmentos(st.segs, st.fasesDados.fases, st.Qcur);
      faseAtual = pos.seg.fase;
      fracSegAtual = pos.fracSeg;
    } else if (st.fasesDados) {
      faseAtual = this._faseEstaticaDeT(st.fasesDados, T);
    }
    const bw = SITQ.clamp(W * .30, 130, 240); // largura do béquer
    const bh = SITQ.clamp(H * .46, 150, 300);
    const bx = W * .40 - bw / 2,
      by = H * .56 - bh / 2;

    // nível de preenchimento ∝ volume real (massa/densidade) — não a massa pura
    const frac = SITQ.fracVolume(st.massa, st.sub);
    const lvl = by + bh * (1 - frac);
    let vaporFora = 0;
    ctx.save();
    this._clipRecipiente(bx, by, bw, bh);
    if (faseAtual !== null) {
      const r = this._desenharFaseAtual(bx, by, bw, bh, lvl, st.sub.cor, faseAtual, fracSegAtual, time);
      vaporFora = r.vapor;
    } else {
      this._drawAmostra(st.sub.textura, bx, by, bw, bh, lvl, st.sub.cor, time);
    }

    // partículas: agitação térmica ∝ T (modelo cinético-molecular).
    // Redes sólidas cristalinas (metal/gelo/vidro, ou a fase atual "gelo"
    // numa transição) vibram em posições fixas de grade; líquidos e o
    // granular (areia) usam disposição livre — mais fiel ao que cada
    // estado físico realmente faz. Sem partículas quando virou vapor puro
    // (nada "dentro" do béquer pra vibrar).
    if (faseAtual !== 'vaporS') {
      const cristalino = faseAtual !== null ? faseAtual === 'gelo' || faseAtual === 'fusao' : st.sub.textura === 'metal' || st.sub.textura === 'gelo' || st.sub.textura === 'vidro';
      // amplitude de vibração ∝ T dentro da ESCALA REAL desta substância
      // (não mais fixa em -20..120 — água/etanol alcançam bem mais que isso)
      const [ampMin, ampMax] = st.fasesDados ? st.fasesDados.faixaPadrao : [PHYS.T_MIN, PHYS.T_MAX];
      const amp = SITQ.isReduced() ? 0 : SITQ.lerp(0.5, 3.4, SITQ.clamp((T - ampMin) / (ampMax - ampMin), 0, 1));
      const ampP = cristalino ? Math.min(amp, 1.5) : amp; // rede sólida vibra menos que um líquido agitado
      const cols = 6,
        rows = Math.ceil(st.parts.length / cols);
      ctx.fillStyle = SITQ.getContrastColor(st.sub.cor) === '#ffffff' ? 'rgba(255,255,255,.8)' : 'rgba(17,24,39,.75)';
      st.parts.forEach((p, i) => {
        const gx = cristalino ? (i % cols + .5) / cols : p.x;
        const gy = cristalino ? (Math.floor(i / cols) + .5) / rows : p.y;
        const px = bx + bw * (.14 + gx * .72) + Math.sin(time * (3 + ampP) + p.f) * ampP;
        const py = lvl + 14 + Math.max(0, by + bh - lvl - 14) * gy + Math.cos(time * (3 + ampP) + p.f * 2 + i) * ampP;
        if (py < lvl - 2) return; // partícula "acima" do nível preenchido: não desenha
        ctx.beginPath();
        ctx.arc(px, py, 2.4, 0, 6.29);
        ctx.fill();
      });
    }
    ctx.restore();

    // vapor sobe por FORA do recipiente (não pode ficar clipado pelo béquer)
    if (vaporFora > 0) this._texturaVapor(bx + bw / 2, by - 4, vaporFora, time);

    // vidro do béquer
    this._contornoRecipiente(bx, by, bw, bh);

    // rótulo da amostra
    ctx.fillStyle = SITQ.cssVar('--text-secondary');
    ctx.font = '11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${st.sub.nome} · ${SITQ.fmt(st.massa, 0)} g`, bx + bw / 2, by + bh + 26);
    if (faseAtual !== null) {
      ctx.fillStyle = SITQ.cssVar('--accent-amber');
      ctx.font = '700 10px Consolas, monospace';
      const NOMES = {
        gelo: 'Sólido',
        fusao: 'Sólido + líquido',
        agua: 'Líquido',
        vapor: 'Líquido + vapor',
        vaporS: 'Vapor'
      };
      ctx.fillText(NOMES[faseAtual] || '', bx + bw / 2, by + bh + 40);
    }

    // fonte de calor / gelo
    if (active) {
      if (heating) this._flame(bx + bw / 2, by + bh + 4, 1 + Math.abs(st.Tf - st.Ti) / 140);else this._iceCubes(bx + bw / 2, by + bh + 12);
      this._heatArrows(bx, by, bw, bh, heating);
    }

    // termômetro — escala própria (mais ampla) pra água/etanol, com
    // marcos de P.F./P.E. em vez da banda de fase única (que não faz
    // mais sentido quando a faixa toda é alcançável).
    if (st.fasesDados) {
      const marcos = [{
        t: st.fasesDados.Tfusao,
        label: 'P.F.'
      }, {
        t: st.fasesDados.Tebulicao,
        label: 'P.E.'
      }];
      this._thermometer(W * .78, H * .16, H * .62, T, null, marcos, st.fasesDados.faixaPadrao);
    } else {
      this._thermometer(W * .78, H * .16, H * .62, T, st.sub.faixa, null, null);
    }

    // leitura de Q após a troca
    if (st.fired && !st.running && st.Tf !== st.Ti) {
      let Q;
      if (multifase) {
        Q = st.totalQ;
      } else if (st.fasesDados) {
        // parado numa fase só (sem cruzar patamar): usa o c DA FASE
        // atual, não sempre o do líquido (que é o que sub.c representa)
        const cEf = faseAtual === 'gelo' ? st.fasesDados.cSolido : faseAtual === 'vaporS' ? st.fasesDados.cVapor : st.fasesDados.cLiquido;
        Q = st.massa * cEf * (st.Tf - st.Ti);
      } else {
        Q = st.massa * st.sub.c * (st.Tf - st.Ti);
      }
      const abs = Q > 0;
      ctx.fillStyle = abs ? SITQ.cssVar('--accent-endo') : SITQ.cssVar('--accent-exo');
      ctx.font = '700 15px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Q = ${SITQ.fmt(Q / 1000, 2)} kJ ${abs ? '(absorvido)' : '(liberado)'}`, W * .40, by - 26);
    }
  }

  /** Recorte com o contorno arredondado do fundo do recipiente (béquer). */
  _clipRecipiente(bx, by, bw, bh) {
    const {
      ctx
    } = this;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx, by + bh - 12);
    ctx.quadraticCurveTo(bx, by + bh, bx + 12, by + bh);
    ctx.lineTo(bx + bw - 12, by + bh);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw, by + bh - 12);
    ctx.lineTo(bx + bw, by);
    ctx.clip();
  }

  /** Contorno de vidro do recipiente (traço) — mesmo desenho usado no Calorímetro e na mini-cena da Curva. */
  _contornoRecipiente(bx, by, bw, bh) {
    const {
      ctx
    } = this;
    ctx.strokeStyle = SITQ.cssVar('--glass', 'rgba(148,163,184,.38)');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by - 6);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx, by + bh - 12);
    ctx.quadraticCurveTo(bx, by + bh, bx + 12, by + bh);
    ctx.lineTo(bx + bw - 12, by + bh);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw, by + bh - 12);
    ctx.lineTo(bx + bw, by);
    ctx.lineTo(bx + bw + 8, by - 6);
    ctx.stroke();
  }

  /** Despacha para o desenho da textura certa; 'vapor' é usado só pela mini-cena da Curva. */
  _drawAmostra(textura, bx, by, bw, bh, lvl, cor, time) {
    if (lvl >= by + bh) return; // fração ~0: nada visível (evita desenhar "negativo")
    switch (textura) {
      case 'gelo':
        this._texturaGelo(bx, by, bw, bh, lvl, cor);
        break;
      case 'metal':
        this._texturaMetal(bx, by, bw, bh, lvl, cor);
        break;
      case 'vidro':
        this._texturaVidro(bx, by, bw, bh, lvl, cor);
        break;
      case 'granular':
        this._texturaGranular(bx, by, bw, bh, lvl, cor);
        break;
      default:
        this._texturaLiquido(bx, by, bw, bh, lvl, cor, time);
    }
  }

  /** Líquido: superfície ondulada + brilho — água, etanol, óleo. */
  _texturaLiquido(bx, by, bw, bh, lvl, cor, time) {
    const {
      ctx
    } = this;
    const onda = x => lvl + Math.sin(time * 2 + x * .08) * (SITQ.isReduced() ? 0 : 2.4);
    ctx.fillStyle = cor + 'B8';
    ctx.beginPath();
    ctx.moveTo(bx, onda(0));
    for (let x = 0; x <= bw; x += 8) ctx.lineTo(bx + x, onda(x));
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.4)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(bx, onda(0));
    for (let x = 0; x <= bw; x += 8) ctx.lineTo(bx + x, onda(x));
    ctx.stroke();
  }

  /** Gelo: blocos translúcidos irregulares empilhados (não uma superfície lisa). */
  _texturaGelo(bx, by, bw, bh, lvl, cor) {
    const {
      ctx
    } = this;
    const fillH = by + bh - lvl;
    if (fillH <= 1) return;
    const cols = Math.max(2, Math.round(bw / 26));
    const rows = Math.max(1, Math.round(fillH / 20));
    const cw = bw / cols,
      ch = fillH / rows;
    let seed = 811;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const jx = (rnd() - .5) * 4,
          jy = (rnd() - .5) * 3;
        const x = bx + c * cw + 2 + jx,
          y = lvl + r * ch + 2 + jy;
        const w = Math.max(2, cw - 4),
          h = Math.max(2, ch - 4);
        ctx.fillStyle = cor + 'D0';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.65)';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + h * .35);
        ctx.lineTo(x + w * .5, y + 2);
        ctx.stroke();
      }
    }
  }

  /** Metal: bloco sólido opaco com faixa de brilho metálico (gradiente linear). */
  _texturaMetal(bx, by, bw, bh, lvl, cor) {
    const {
      ctx
    } = this;
    const h = by + bh - lvl;
    if (h <= 1) return;
    const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    g.addColorStop(0, SITQ.shadeColor(cor, -45));
    g.addColorStop(.32, SITQ.shadeColor(cor, 55));
    g.addColorStop(.5, cor);
    g.addColorStop(.72, SITQ.shadeColor(cor, -20));
    g.addColorStop(1, SITQ.shadeColor(cor, -50));
    ctx.fillStyle = g;
    ctx.fillRect(bx, lvl, bw, h);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.fillRect(bx, lvl, bw, 2);
  }

  /** Vidro: bloco translúcido com reflexo diagonal, deixa entrever o fundo. */
  _texturaVidro(bx, by, bw, bh, lvl, cor) {
    const {
      ctx
    } = this;
    const h = by + bh - lvl;
    if (h <= 1) return;
    ctx.fillStyle = cor + '55';
    ctx.fillRect(bx, lvl, bw, h);
    ctx.strokeStyle = cor + 'AA';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, lvl, bw, h);
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.beginPath();
    ctx.moveTo(bx + bw * .16, lvl);
    ctx.lineTo(bx + bw * .3, lvl);
    ctx.lineTo(bx + bw * .12, by + bh);
    ctx.lineTo(bx, by + bh);
    ctx.closePath();
    ctx.fill();
  }

  /** Granular: monte com topo irregular e textura de grãos — areia. */
  _texturaGranular(bx, by, bw, bh, lvl, cor) {
    const {
      ctx
    } = this;
    const h = by + bh - lvl;
    if (h <= 1) return;
    ctx.fillStyle = cor + 'E8';
    ctx.beginPath();
    ctx.moveTo(bx, by + bh);
    ctx.lineTo(bx, lvl + 6);
    for (let x = 0; x <= bw; x += 8) {
      const yy = lvl + Math.sin(x * .3) * 3 + Math.sin(x * .7 + 1) * 2;
      ctx.lineTo(bx + x, yy);
    }
    ctx.lineTo(bx + bw, by + bh);
    ctx.closePath();
    ctx.fill();
    let seed = 271;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    ctx.fillStyle = SITQ.shadeColor(cor, -45) + 'AA';
    const n = Math.floor(bw * h / 34);
    for (let i = 0; i < n; i++) {
      const x = bx + rnd() * bw,
        yy = lvl + 6 + rnd() * h;
      ctx.beginPath();
      ctx.arc(x, yy, 1.1, 0, 6.29);
      ctx.fill();
    }
  }

  /** Vapor: ondinhas translúcidas subindo e dissipando — só a mini-cena da Curva usa isto. */
  _texturaVapor(cx, topY, intensidade, time) {
    const {
      ctx
    } = this;
    for (let i = 0; i < 6; i++) {
      const off = (time * 46 + i * 33) % 150;
      const alpha = Math.max(0, 1 - off / 150) * .55 * intensidade;
      const x = cx + Math.sin(time * 1.3 + i) * 12 + (i - 2.5) * 14;
      const y = topY - off;
      ctx.strokeStyle = `rgba(226,236,246,${alpha})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.quadraticCurveTo(x, y - 9, x + 6, y);
      ctx.stroke();
    }
  }
  _flame(cx, topY, k) {
    const {
      ctx,
      time
    } = this;
    const w = SITQ.isReduced() ? 0 : Math.sin(time * 9) * 3;
    const h = 30 * k;
    ctx.save();
    ctx.translate(cx, topY + 34);
    const g = ctx.createLinearGradient(0, 0, 0, -h);
    g.addColorStop(0, SITQ.cssVar('--flame-a'));
    g.addColorStop(1, SITQ.cssVar('--flame-b'));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.quadraticCurveTo(-14 + w, -h * .5, 0 + w * .6, -h);
    ctx.quadraticCurveTo(14 + w, -h * .5, 12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = SITQ.cssVar('--bg-void');
    ctx.beginPath();
    ctx.ellipse(0, -2, 6, 9, 0, 0, 6.29);
    ctx.fill();
    ctx.restore();
  }
  _iceCubes(cx, y) {
    const {
      ctx
    } = this;
    ctx.fillStyle = SITQ.cssVar('--ice') + 'CC';
    ctx.strokeStyle = SITQ.cssVar('--ice');
    [[-26, 0], [0, 4], [26, 0]].forEach(([dx, dy]) => {
      ctx.fillRect(cx + dx - 9, y + dy, 18, 18);
      ctx.strokeRect(cx + dx - 9, y + dy, 18, 18);
    });
  }
  _heatArrows(bx, by, bw, bh, entering) {
    // setas de fluxo de calor: entram (aquecer, Q>0) ou saem (resfriar, Q<0)
    const {
      ctx,
      time
    } = this;
    const col = entering ? SITQ.cssVar('--flame-a') : SITQ.cssVar('--accent-endo');
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 2.2;
    const off = SITQ.isReduced() ? 0 : time * 34 % 22;
    for (let i = 0; i < 3; i++) {
      const y = by + bh * (.3 + i * .22);
      const dir = entering ? 1 : -1;
      const x0 = entering ? bx - 46 + off : bx - 24 - off;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + 20, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x0 + (dir > 0 ? 20 : 0), y);
      ctx.lineTo(x0 + (dir > 0 ? 13 : 7), y - 4);
      ctx.lineTo(x0 + (dir > 0 ? 13 : 7), y + 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * faixa: banda única destacada (substâncias de 1 fase só, ex. gelo).
   * marcos: array de {t, label} — linhas de referência p/ substâncias
   * com dados de mudança de fase (P.F./P.E. de água e etanol), já que
   * pra elas não existe mais "uma faixa válida", e sim pontos de
   * transição dentro de uma escala bem mais ampla.
   * escala: [Tmin,Tmax] do PRÓPRIO termômetro — o normal é −20..120
   * (PHYS.T_MIN/T_MAX), mas água/etanol alcançam valores bem fora
   * disso (etanol chega a −114 °C), então a régua precisa se adaptar
   * ou a coluna de líquido é desenhada fora do tubo.
   */
  _thermometer(x, top, len, T, faixa, marcos, escala) {
    const {
      ctx
    } = this;
    const [Tmin, Tmax] = escala || [PHYS.T_MIN, PHYS.T_MAX];
    const yOf = t => top + len * (1 - (SITQ.clamp(t, Tmin, Tmax) - Tmin) / (Tmax - Tmin));
    // tubo
    ctx.strokeStyle = SITQ.cssVar('--glass');
    ctx.lineWidth = 2;
    ctx.fillStyle = SITQ.cssVar('--bg-panel2');
    const tw = 14;
    ctx.beginPath();
    ctx.roundRect(x - tw / 2, top - 8, tw, len + 16, 7);
    ctx.fill();
    ctx.stroke();
    // faixa de fase válida (se a substância tiver uma): banda destacada
    // no tubo mostrando onde ela é REALMENTE a fase escolhida a 1 atm.
    if (faixa) {
      const yHi = yOf(SITQ.clamp(faixa[1], Tmin, Tmax)),
        yLo = yOf(SITQ.clamp(faixa[0], Tmin, Tmax));
      const bandCol = SITQ.cssVar('--accent-ok');
      ctx.fillStyle = bandCol + '26';
      ctx.fillRect(x - tw / 2, yHi, tw, yLo - yHi);
      ctx.strokeStyle = bandCol + '90';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - tw / 2 - 4, yHi);
      ctx.lineTo(x + tw / 2 + 4, yHi);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - tw / 2 - 4, yLo);
      ctx.lineTo(x + tw / 2 + 4, yLo);
      ctx.stroke();
    }
    // marcos de transição de fase (P.F./P.E.) — só quando a substância
    // tem dados de mudança de fase (água, etanol)
    if (marcos) {
      marcos.forEach(m => {
        const y = yOf(m.t);
        ctx.strokeStyle = SITQ.cssVar('--accent-amber');
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x - tw / 2 - 5, y);
        ctx.lineTo(x + tw / 2 + 5, y);
        ctx.stroke();
        ctx.fillStyle = SITQ.cssVar('--accent-amber');
        ctx.font = '700 8px Consolas, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.label, x + tw / 2 + 9, y - 8);
      });
    }
    // escala
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const passo = Math.max(10, Math.round((Tmax - Tmin) / 8 / 10) * 10);
    for (let t = Math.ceil(Tmin / passo) * passo; t <= Tmax; t += passo) {
      const y = yOf(t);
      ctx.strokeStyle = SITQ.cssVar('--text-muted');
      ctx.beginPath();
      ctx.moveTo(x + tw / 2, y);
      ctx.lineTo(x + tw / 2 + 6, y);
      ctx.stroke();
      ctx.fillStyle = SITQ.cssVar('--text-muted');
      ctx.fillText(`${SITQ.fmt(t, 0)}°`, x + tw / 2 + 9, y);
    }
    // coluna de líquido: cor fria→quente
    const k = SITQ.clamp((T - Tmin) / (Tmax - Tmin), 0, 1);
    const col = k < .5 ? SITQ.cssVar('--accent-endo') : SITQ.cssVar('--flame-a');
    ctx.fillStyle = col;
    const yT = yOf(T);
    ctx.beginPath();
    ctx.roundRect(x - 3.5, yT, 7, Math.max(0, yOf(Tmin) - yT) + 6, 3.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, yOf(Tmin) + 14, 11, 0, 6.29);
    ctx.fill();
    ctx.strokeStyle = SITQ.cssVar('--glass');
    ctx.beginPath();
    ctx.arc(x, yOf(Tmin) + 14, 11, 0, 6.29);
    ctx.stroke();
    // leitura
    ctx.fillStyle = SITQ.cssVar('--accent-amber');
    ctx.font = '700 13px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${SITQ.fmt(T, 1)} °C`, x, top - 22);
  }

  /* ═══════════ MODO 2 — CURVA DE AQUECIMENTO ═══════════ */
  drawCurva() {
    const {
      ctx,
      W,
      H
    } = this;
    const st = this.curva;
    const padL = 58,
      padR = 30,
      padT = 34,
      padB = 64;
    const gx = padL,
      gy = padT,
      gw = W - padL - padR,
      gh = H - padT - padB;
    const Tlo = Math.min(-30, st.Ti - 5),
      Thi = Math.max(130, st.Tf + 5);
    const xOf = q => gx + gw * (st.totalQ ? q / st.totalQ : 0);
    const yOf = t => gy + gh * (1 - (t - Tlo) / (Thi - Tlo));

    // eixos
    ctx.strokeStyle = SITQ.cssVar('--text-muted');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy + gh);
    ctx.lineTo(gx + gw, gy + gh);
    ctx.stroke();
    ctx.fillStyle = SITQ.cssVar('--text-secondary');
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Calor fornecido Q (kJ) →', gx + gw / 2, gy + gh + 30);
    ctx.save();
    ctx.translate(gx - 40, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Temperatura (°C) →', 0, 0);
    ctx.restore();

    // linhas-guia de 0 °C e 100 °C
    ctx.setLineDash([4, 5]);
    ctx.strokeStyle = SITQ.cssVar('--border');
    [0, 100].forEach(t => {
      ctx.beginPath();
      ctx.moveTo(gx, yOf(t));
      ctx.lineTo(gx + gw, yOf(t));
      ctx.stroke();
      ctx.fillStyle = SITQ.cssVar('--text-muted');
      ctx.textAlign = 'right';
      ctx.fillText(`${t} °C`, gx - 6, yOf(t) + 3);
    });
    ctx.setLineDash([]);
    ctx.textAlign = 'right';
    ctx.fillText(`${SITQ.fmt(st.Ti, 0)} °C`, gx - 6, yOf(st.Ti) + 3);
    ctx.fillText(`${SITQ.fmt(st.Tf, 0)} °C`, gx - 6, yOf(st.Tf) + 3);

    // segmentos coloridos por fase
    const segCol = {
      gelo: SITQ.cssVar('--ice'),
      fusao: SITQ.cssVar('--accent-endo'),
      agua: SITQ.cssVar('--accent-cyan'),
      vapor: SITQ.cssVar('--accent-endo'),
      vaporS: SITQ.cssVar('--flame-a')
    };
    let q0 = 0;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    st.segs.forEach(s => {
      ctx.strokeStyle = segCol[s.fase] || SITQ.cssVar('--accent-main');
      ctx.beginPath();
      ctx.moveTo(xOf(q0), yOf(s.T0));
      ctx.lineTo(xOf(q0 + s.Q), yOf(s.T1));
      ctx.stroke();
      q0 += s.Q;
    });

    // marcador animado
    const pos = this._curvaPoint(st.Qcur);
    ctx.fillStyle = SITQ.cssVar('--accent-main');
    ctx.beginPath();
    ctx.arc(xOf(st.Qcur), yOf(pos.T), 7, 0, 6.29);
    ctx.fill();
    ctx.strokeStyle = SITQ.cssVar('--bg-void');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(xOf(st.Qcur), yOf(pos.T), 7, 0, 6.29);
    ctx.stroke();

    // etiqueta do estado atual
    ctx.fillStyle = SITQ.cssVar('--accent-amber');
    ctx.font = '700 12px Consolas, monospace';
    ctx.textAlign = 'center';
    const lx = SITQ.clamp(xOf(st.Qcur), gx + 70, gx + gw - 70);
    ctx.fillText(pos.rotulo, lx, yOf(pos.T) - 16);
    ctx.fillStyle = SITQ.cssVar('--text-secondary');
    ctx.font = '10px Consolas, monospace';
    ctx.fillText(`Q = ${SITQ.fmt(st.Qcur / 1000, 1)} kJ · T = ${SITQ.fmt(pos.T, 1)} °C`, lx, yOf(pos.T) - 32);

    // barra inferior: energia por etapa
    let bq = 0;
    const by = gy + gh + 40,
      bh2 = 8;
    st.segs.forEach(s => {
      const x0 = xOf(bq),
        x1 = xOf(bq + s.Q);
      ctx.fillStyle = (segCol[s.fase] || SITQ.cssVar('--accent-main')) + 'CC';
      ctx.fillRect(x0, by, Math.max(1, x1 - x0), bh2);
      if (x1 - x0 > 64) {
        ctx.fillStyle = SITQ.cssVar('--text-muted');
        ctx.font = '9px Consolas, monospace';
        ctx.fillText(`${SITQ.fmt(s.Q / 1000, 0)} kJ`, (x0 + x1) / 2, by + bh2 + 10);
      }
      bq += s.Q;
    });
  }

  /**
   * Desenha o CONTEÚDO do recipiente (dentro do clip) para uma FASE dada
   * (e, se for 'fusao'/'vapor', o progresso fracSeg 0–1 dentro do
   * patamar) — incluindo a COEXISTÊNCIA de fases nos patamares (fusão e
   * vaporização não são trocas instantâneas: parte já virou a fase
   * seguinte, parte ainda não). Serve tanto para uma transição ANIMADA
   * em curso quanto para o estado PARADO de água/etanol fora de uma
   * transição (fracSeg irrelevante nesse caso — fase já é só
   * 'gelo'/'agua'/'vaporS', nunca 'fusao'/'vapor').
   * Retorna {vapor} — intensidade (0–1) de vapor a desenhar por FORA do
   * clip (chame _texturaVapor após o ctx.restore() do clip do chamador).
   */
  _desenharFaseAtual(bx, by, bw, bh, lvl, cor, fase, fracSeg, time) {
    const CORLIQ = cor,
      CORSOL = SITQ.shadeColor(cor, 70);
    if (fase === 'vaporS') {
      return {
        vapor: 1
      }; // virou gás por completo: nada "dentro"
    }
    if (fase === 'fusao') {
      // COEXISTÊNCIA no P.F.: começa quase só sólido, termina quase só
      // líquido — nunca uma troca instantânea, como é a fusão de verdade.
      this._drawAmostra('liquido', bx, by, bw, bh, lvl, CORLIQ, time);
      this._texturaGeloParcial(bx, by, bw, bh, lvl, CORSOL, 1 - fracSeg);
      return {
        vapor: 0
      };
    }
    if (fase === 'vapor') {
      // COEXISTÊNCIA no P.E.: o líquido vai sumindo aos poucos enquanto o
      // vapor sobe cada vez mais forte — não é uma troca instantânea.
      const lvlFerv = lvl + (by + bh - lvl) * (fracSeg * .55);
      this._drawAmostra('liquido', bx, by, bw, bh, lvlFerv, CORLIQ, time);
      return {
        vapor: .3 + .65 * fracSeg
      };
    }
    const textura = fase === 'gelo' ? 'gelo' : 'liquido';
    this._drawAmostra(textura, bx, by, bw, bh, lvl, fase === 'gelo' ? CORSOL : CORLIQ, time);
    return {
      vapor: 0
    };
  }

  /** Fase de uma substância com dados de mudança de fase a uma dada T,
   *  quando NÃO há transição animada em curso (fora dos patamares —
   *  aqui não existe "coexistência", só uma fase de cada vez). */
  _faseEstaticaDeT(fasesDados, T) {
    if (T < fasesDados.Tfusao) return 'gelo';
    if (T > fasesDados.Tebulicao) return 'vaporS';
    return 'agua';
  }

  /** Como _texturaGelo, mas desenha só uma FRAÇÃO dos blocos (0–1) — usada
   *  durante a fusão, para o sólido ir "sumindo" aos poucos sobre o líquido,
   *  em vez de trocar de textura de um instante para o outro. */
  _texturaGeloParcial(bx, by, bw, bh, lvl, cor, proporcao) {
    const {
      ctx
    } = this;
    const fillH = by + bh - lvl;
    if (fillH <= 1 || proporcao <= .02) return;
    const cols = Math.max(2, Math.round(bw / 26));
    const rows = Math.max(1, Math.round(fillH / 20));
    const total = cols * rows;
    const manter = Math.round(total * SITQ.clamp(proporcao, 0, 1));
    let seed = 811;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const cw = bw / cols,
      ch = fillH / rows;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++, idx++) {
        const jx = (rnd() - .5) * 4,
          jy = (rnd() - .5) * 3;
        if (idx >= manter) continue; // este bloco já "derreteu"
        const x = bx + c * cw + 2 + jx,
          y = lvl + r * ch + 2 + jy;
        const w = Math.max(2, cw - 4),
          h = Math.max(2, ch - 4);
        ctx.fillStyle = cor + 'D0';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  /** Posição (T, fase) na curva para um calor acumulado q. fracSeg = progresso 0→1 dentro do trecho/patamar atual. */
  _curvaPoint(q) {
    return SITQ.pontoNosSegmentos(this.curva.segs, this.curva.fasesTxt, q);
  }

  /* ═══════════ MODO 3 — DIAGRAMA ENDO × EXO ═══════════ */
  _perfilGeom() {
    const {
      W,
      H
    } = this;
    const r = this.perfil.r;
    const padL = 64,
      padR = 96,
      padT = 44,
      padB = 56;
    const xa = padL + 26,
      xb = W - padR - 26,
      xm = (xa + xb) / 2;
    const hi = Math.max(r.Ea, r.dH, 0),
      lo = Math.min(0, r.dH);
    const span = hi - lo || 1;
    const yOf = h => padT + (H - padT - padB) * (1 - (h - lo) / span);
    return {
      xa,
      xb,
      xm,
      yOf,
      padL,
      padT,
      padB
    };
  }
  drawPerfil() {
    const {
      ctx,
      W,
      H
    } = this;
    const st = this.perfil,
      r = st.r;
    const g = this._perfilGeom();
    const y0 = g.yOf(0),
      yP = g.yOf(r.dH),
      yEa = g.yOf(r.Ea);
    const exo = r.dH < 0;
    const cEXO = SITQ.cssVar('--accent-exo'),
      cENDO = SITQ.cssVar('--accent-endo');

    // eixos
    ctx.strokeStyle = SITQ.cssVar('--text-muted');
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(g.padL - 20, g.padT - 14);
    ctx.lineTo(g.padL - 20, H - g.padB + 8);
    ctx.lineTo(W - 30, H - g.padB + 8);
    ctx.stroke();
    ctx.fillStyle = SITQ.cssVar('--text-secondary');
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Caminho da reação →', (g.padL + W - 30) / 2, H - g.padB + 30);
    ctx.save();
    ctx.translate(g.padL - 44, H / 2 - 10);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Entalpia H →', 0, 0);
    ctx.restore();

    // patamares Hr / Hp
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = SITQ.cssVar('--border-active');
    ctx.beginPath();
    ctx.moveTo(g.padL - 10, y0);
    ctx.lineTo(g.xm, y0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(g.xm, yP);
    ctx.lineTo(W - 34, yP);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = SITQ.cssVar('--text-primary');
    ctx.font = '700 11px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Reagentes (Hr)', g.padL - 10, y0 - 8);
    ctx.textAlign = 'right';
    ctx.fillText('Produtos (Hp)', W - 34, yP - 8);

    // curva com catalisador (tracejada) — mesma altura de chegada!
    const eaCat = exo ? r.Ea * CATALISADOR_FATOR : r.dH + (r.Ea - r.dH) * CATALISADOR_FATOR;
    if (st.cat) {
      ctx.setLineDash([6, 5]);
      this._perfilCurve(g, g.yOf(eaCat), SITQ.cssVar('--accent-ok'), 2);
      ctx.setLineDash([]);
      ctx.fillStyle = SITQ.cssVar('--accent-ok');
      ctx.font = '10px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Ea(cat) = ${SITQ.fmt(eaCat, 0)} kJ`, g.xm, g.yOf(eaCat) + 16);
    }

    // curva principal
    this._perfilCurve(g, yEa, exo ? cEXO : cENDO, 3.2);

    // complexo ativado
    ctx.fillStyle = SITQ.cssVar('--accent-main');
    ctx.beginPath();
    ctx.arc(g.xm, yEa, 4, 0, 6.29);
    ctx.fill();
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Complexo ativado', g.xm, yEa - 12);

    // seta de Ea (dos reagentes ao pico)
    this._vArrow(g.xa + 34, y0, yEa, SITQ.cssVar('--accent-main'), `Ea = ${SITQ.fmt(r.Ea, 0)} kJ`, 'left');
    // seta de ΔH (Hr → Hp), à direita
    this._vArrow(W - 62, y0, yP, exo ? cEXO : cENDO, `ΔH = ${SITQ.fmt(r.dH, 1)} kJ`, 'right');

    // bola da reação percorrendo a curva
    if (st.playing || st.t > 0) {
      const p = this._perfilPoint(g, yEa, SITQ.easeIO(st.t));
      const grad = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, 8);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(1, SITQ.cssVar('--accent-amber'));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, 6.29);
      ctx.fill();
    }
    // explosão exo / sucção endo ao final
    st.burst.forEach(p => {
      ctx.globalAlpha = SITQ.clamp(p.life, 0, 1);
      ctx.fillStyle = p.exo ? cEXO : cENDO;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, 6.29);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // legenda da equação
    ctx.fillStyle = SITQ.cssVar('--text-secondary');
    ctx.font = '11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(r.eq, W / 2, g.padT - 24 + 14);
    ctx.fillStyle = exo ? cEXO : cENDO;
    ctx.font = '700 11px Consolas, monospace';
    ctx.fillText(exo ? 'EXOTÉRMICA · libera calor' : 'ENDOTÉRMICA · absorve calor', W / 2, H - 16);
  }
  _perfilCurve(g, yPeak, color, w) {
    const {
      ctx
    } = this;
    const y0 = g.yOf(0),
      yP = g.yOf(this.perfil.r.dH);
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(g.xa, y0);
    ctx.bezierCurveTo(g.xa + (g.xm - g.xa) * .55, y0, g.xm - (g.xm - g.xa) * .5, yPeak, g.xm, yPeak);
    ctx.bezierCurveTo(g.xm + (g.xb - g.xm) * .5, yPeak, g.xb - (g.xb - g.xm) * .55, yP, g.xb, yP);
    ctx.stroke();
  }
  _perfilPoint(g, yPeak, s) {
    const y0 = g.yOf(0),
      yP = g.yOf(this.perfil.r.dH);
    const bez = (p0, p1, p2, p3, t) => {
      const u = 1 - t;
      return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
    };
    if (s <= .5) {
      const t = s * 2;
      return {
        x: bez(g.xa, g.xa + (g.xm - g.xa) * .55, g.xm - (g.xm - g.xa) * .5, g.xm, t),
        y: bez(y0, y0, yPeak, yPeak, t)
      };
    }
    const t = (s - .5) * 2;
    return {
      x: bez(g.xm, g.xm + (g.xb - g.xm) * .5, g.xb - (g.xb - g.xm) * .55, g.xb, t),
      y: bez(yPeak, yPeak, yP, yP, t)
    };
  }
  _vArrow(x, y1, y2, color, label, side) {
    const {
      ctx
    } = this;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
    const dir = y2 < y1 ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x, y2);
    ctx.lineTo(x - 4, y2 - 7 * dir);
    ctx.lineTo(x + 4, y2 - 7 * dir);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 5, y1);
    ctx.lineTo(x + 5, y1);
    ctx.stroke();
    ctx.font = '700 10px Consolas, monospace';
    ctx.textAlign = side === 'left' ? 'left' : 'right';
    ctx.fillText(label, side === 'left' ? x + 8 : x - 8, (y1 + y2) / 2);
  }

  /* ═══════════ MODO 4 — LEI DE HESS (níveis de entalpia) ═══════ */
  drawHess() {
    const {
      ctx,
      W,
      H
    } = this;
    const ex = this.hess.ex;
    const padT = 52,
      padB = 78,
      padX = 40;
    const Hs = ex.niveis.map(n => n.H);
    const hi = Math.max(...Hs),
      lo = Math.min(...Hs);
    const span = hi - lo || 1;
    const yOf = h => padT + (H - padT - padB) * (1 - (h - lo) / span);
    const laneW = (W - padX * 2) / ex.niveis.length;
    const xOf = i => padX + laneW * i + laneW / 2;
    const half = SITQ.clamp(laneW * .34, 44, 92);

    // níveis
    ex.niveis.forEach((n, i) => {
      const y = yOf(n.H),
        x = xOf(i);
      ctx.strokeStyle = SITQ.cssVar('--text-primary');
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - half, y);
      ctx.lineTo(x + half, y);
      ctx.stroke();
      ctx.fillStyle = SITQ.cssVar('--text-secondary');
      ctx.font = '11px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, x, y - 22);
      ctx.fillStyle = SITQ.cssVar('--accent-amber');
      ctx.font = '700 10px Consolas, monospace';
      ctx.fillText(`H = ${SITQ.fmt(n.H, 1)} kJ`, x, y - 9);
    });

    // setas do caminho (função de estado): 0→2 e depois 2→1 (ou 1→2)
    const cAr = SITQ.cssVar('--text-secondary');
    this._hessArrow(xOf(0) + half * .5, yOf(ex.niveis[0].H), xOf(2) - half * .5, yOf(ex.niveis[2].H), cAr, `${SITQ.fmt(ex.niveis[2].H - ex.niveis[0].H, 1)} kJ`);
    this._hessArrow(xOf(2) - half * .2, yOf(ex.niveis[2].H), xOf(1) + half * .4, yOf(ex.niveis[1].H), cAr, `${SITQ.fmt(ex.niveis[1].H - ex.niveis[2].H, 1)} kJ`);

    // seta-alvo 0→1 (tracejada até resolver; verde depois)
    const solved = this.hess.solved;
    const alvoCol = solved ? SITQ.cssVar('--accent-ok') : this.hess.flash > 0 ? SITQ.cssVar('--accent-exo') : SITQ.cssVar('--accent-main');
    ctx.setLineDash(solved ? [] : [6, 5]);
    this._hessArrow(xOf(0) - half * .2, yOf(ex.niveis[0].H), xOf(1) - half * .4, yOf(ex.niveis[1].H), alvoCol, solved ? `ΔH alvo = ${SITQ.fmt(ex.resposta, 1)} kJ` : 'ΔH alvo = ?', true);
    ctx.setLineDash([]);

    // Σ atual do estudante
    ctx.fillStyle = SITQ.cssVar('--text-secondary');
    ctx.font = '11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('H é função de estado: o caminho não importa — só o início e o fim.', W / 2, H - 44);
    ctx.fillStyle = solved ? SITQ.cssVar('--accent-ok') : SITQ.cssVar('--accent-amber');
    if (solved) {
      SITQ.kIconText(ctx, SITQ.kIconCheck, `Σ das suas etapas = ${SITQ.fmt(this.hess.soma, 1)} kJ`, W / 2, H - 22, {
        size: 13, bold: true, mono: true, color: ctx.fillStyle, align: 'center'
      });
    } else {
      ctx.font = '700 13px Consolas, monospace';
      ctx.fillText(`Σ das suas etapas = ${SITQ.fmt(this.hess.soma, 1)} kJ`, W / 2, H - 22);
    }
  }
  _hessArrow(x1, y1, x2, y2, color, label, big) {
    const {
      ctx
    } = this;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = big ? 2.6 : 1.8;
    const mx = (x1 + x2) / 2,
      my = (y1 + y2) / 2 - 26;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(mx, my, x2, y2);
    ctx.stroke();
    const ang = Math.atan2(y2 - my, x2 - mx);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(ang - .4), y2 - 9 * Math.sin(ang - .4));
    ctx.lineTo(x2 - 9 * Math.cos(ang + .4), y2 - 9 * Math.sin(ang + .4));
    ctx.closePath();
    ctx.fill();
    ctx.font = `${big ? '700 ' : ''}10px Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(label, mx, my - 6);
  }

  /* ═══════════ MODO 5 — ENERGIA DE LIGAÇÃO (projeção 3D) ═══════ */
  drawLigacao() {
    const {
      ctx,
      W,
      H
    } = this;
    const st = this.lig,
      r = st.r;
    const dH = this._ligDH();
    const exo = dH < 0;
    const midX = W / 2;
    const ppa = SITQ.clamp(Math.min(W, H) / 10.5, 16, 46);

    // títulos das metades (trocam de papel quando a reação é invertida)
    ctx.font = '700 11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = SITQ.cssVar('--text-secondary');
    ctx.fillText(st.inverted ? 'Produtos' : 'Reagentes', W * .25, 26);
    ctx.fillText(st.inverted ? 'Reagentes' : 'Produtos', W * .75, 26);
    this._ligGroup(r.reagentes, W * .25, H * .46, W * .44, H * .6, ppa);
    this._ligGroup(r.produtos, W * .75, H * .46, W * .44, H * .6, ppa);

    // seta central (inverte o sentido junto com a reação)
    const aw = SITQ.clamp(W * .07, 34, 64);
    ctx.strokeStyle = SITQ.cssVar('--accent-main');
    ctx.fillStyle = SITQ.cssVar('--accent-main');
    ctx.lineWidth = 3;
    const ay = H * .46;
    const x1 = st.inverted ? midX + aw / 2 : midX - aw / 2;
    const x2 = st.inverted ? midX - aw / 2 : midX + aw / 2;
    const dir = st.inverted ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x1, ay);
    ctx.lineTo(x2, ay);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2 + 6 * dir, ay);
    ctx.lineTo(x2 - 6 * dir, ay - 6);
    ctx.lineTo(x2 - 6 * dir, ay + 6);
    ctx.closePath();
    ctx.fill();

    // setas onduladas de calor: saindo (exo) ou entrando (endo)
    this._heatWaves(midX, ay + 40, exo);

    // barras comparando Σ E(rompidas) × Σ E(formadas) — o "porquê" visual do ΔH
    this._ligBars(H - 60);

    // resultado
    ctx.fillStyle = exo ? SITQ.cssVar('--accent-exo') : SITQ.cssVar('--accent-endo');
    ctx.font = '700 15px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`ΔH ≈ ${SITQ.fmt(dH, 0)} kJ · ${exo ? 'EXOTÉRMICA' : 'ENDOTÉRMICA'}`, midX, H - 20);
  }

  /** Soma de energia das ligações rompidas/formadas, já considerando inversão. */
  _ligSums() {
    const st = this.lig,
      r = st.r;
    const romp = st.inverted ? r.formadas : r.rompidas;
    const form = st.inverted ? r.rompidas : r.formadas;
    const soma = l => l.reduce((s, [b, n]) => s + n * ENERGIA_LIGACAO[b], 0);
    return {
      romp: soma(romp),
      form: soma(form)
    };
  }

  /** Duas barrinhas horizontais comparando ΣE(rompidas) e ΣE(formadas) —
   *  a maior das duas "decide" se a reação é exo ou endotérmica. */
  _ligBars(y) {
    const {
      ctx,
      W
    } = this;
    const {
      romp,
      form
    } = this._ligSums();
    const maxV = Math.max(romp, form) || 1;
    const barW = SITQ.clamp(W * .3, 90, 190);
    const barH = 8,
      passo = 16;
    const x0 = W / 2 - barW / 2;
    const linhas = [{
      label: 'Romper (+)',
      val: romp,
      col: SITQ.cssVar('--accent-endo')
    }, {
      label: 'Formar (−)',
      val: form,
      col: SITQ.cssVar('--accent-exo')
    }];
    ctx.textBaseline = 'middle';
    linhas.forEach((ln, i) => {
      const yy = y + i * passo;
      ctx.fillStyle = SITQ.cssVar('--bg-void');
      ctx.strokeStyle = SITQ.cssVar('--border');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x0, yy, barW, barH, 4);
      ctx.fill();
      ctx.stroke();
      const w = barW * SITQ.clamp(ln.val / maxV, 0, 1);
      ctx.fillStyle = ln.col;
      ctx.beginPath();
      ctx.roundRect(x0, yy, Math.max(4, w), barH, 4);
      ctx.fill();
      ctx.fillStyle = SITQ.cssVar('--text-secondary');
      ctx.font = '9px Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(ln.label, x0 - 8, yy + barH / 2);
      ctx.fillStyle = SITQ.cssVar('--text-primary');
      ctx.font = '700 9px Consolas, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${SITQ.fmt(ln.val, 0)} kJ`, x0 + barW + 8, yy + barH / 2);
    });
  }
  _ligDH() {
    const r = this.lig.r;
    const soma = lista => lista.reduce((s, [b, n]) => s + n * ENERGIA_LIGACAO[b], 0);
    const dh = soma(r.rompidas) - soma(r.formadas);
    return this.lig.inverted ? -dh : dh;
  }
  _ligGroup(especies, cx, cy, boxW, boxH, ppa) {
    const {
      ctx
    } = this;
    const st = this.lig;
    // expande contagens em instâncias individuais
    const inst = [];
    especies.forEach(e => {
      for (let i = 0; i < e.n; i++) inst.push(e.mol);
    });
    const cols = Math.ceil(Math.sqrt(inst.length));
    const rows = Math.ceil(inst.length / cols);
    const dx = boxW / cols,
      dy = boxH / rows;
    inst.forEach((molId, i) => {
      const c = i % cols,
        rw = Math.floor(i / cols);
      const x = cx - boxW / 2 + dx * (c + .5);
      const y = cy - boxH / 2 + dy * (rw + .5);
      const spin = st.ry + i * 0.9; // defasagem para cada cópia
      SITQ.drawMolecule(ctx, MOLECULAS_3D[molId], x, y, Math.min(ppa, dx / 3.4, dy / 3.4), st.rx, spin, st.labels);
    });
    // legenda química do grupo
    ctx.fillStyle = SITQ.cssVar('--text-muted');
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    const rotulo = especies.map(e => `${e.n > 1 ? e.n + ' ' : ''}${MOLECULAS_3D[e.mol].formula}`).join(' + ');
    ctx.fillText(rotulo, cx, cy + boxH / 2 + 18);
  }
  _heatWaves(cx, y, exo) {
    const {
      ctx,
      time
    } = this;
    const col = exo ? SITQ.cssVar('--accent-exo') : SITQ.cssVar('--accent-endo');
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 2;
    const t = SITQ.isReduced() ? 0 : time * 2.2;
    for (let k = -1; k <= 1; k++) {
      const x0 = cx + k * 22;
      ctx.beginPath();
      for (let i = 0; i <= 26; i += 2) {
        const yy = exo ? y + i : y + 26 - i; // exo desce (sai), endo sobe (entra)
        const xx = x0 + Math.sin(i * .5 + t + k) * 4;
        i === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      const tipY = exo ? y + 30 : y - 4;
      const d = exo ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(x0, tipY + 4 * d);
      ctx.lineTo(x0 - 4, tipY - 3 * d);
      ctx.lineTo(x0 + 4, tipY - 3 * d);
      ctx.closePath();
      ctx.fill();
    }
  }

  // ── ponteiro: arrastar gira as moléculas 3D ─────────────────────
  _bindPointer() {
    const cv = this.canvas;
    let lastX = 0,
      lastY = 0;
    cv.addEventListener('pointerdown', e => {
      if (this.mode !== 'ligacao') return;
      this.lig.dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      try {
        cv.setPointerCapture(e.pointerId);
      } catch (err) {}
    });
    cv.addEventListener('pointermove', e => {
      if (!this.lig.dragging) return;
      this.lig.ry += (e.clientX - lastX) * 0.008;
      this.lig.rx = SITQ.clamp(this.lig.rx + (e.clientY - lastY) * 0.008, -1.25, 1.25);
      lastX = e.clientX;
      lastY = e.clientY;
    });
    const end = () => {
      this.lig.dragging = false;
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  }
};