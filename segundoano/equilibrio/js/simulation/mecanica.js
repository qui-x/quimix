// ══════════════════════════════════════════════════════════════════
// MECÂNICA A — Equilíbrio Químico (origem: SIEQ)
// Modos: atingir equilíbrio · Le Chatelier · quociente Q contra K
// ══════════════════════════════════════════════════════════════════
SIEQ.MechA = class MechA {
  constructor(D) {
    this.D = D;
    this.modo = 'atingir';
    // modo 1
    this.h2i = 1;
    this.i2i = 1;
    this.hii = 0;
    this.h2 = 1;
    this.i2 = 1;
    this.hi = 0;
    this.hist = [];
    this.trel = 0;
    // modo 2
    this.T = 25;
    this.V = 1;
    this.nN2O4 = 0.05;
    this.nNO2 = 0.02;
    this.strip = [];
    this.perturb = '—';
    // modo 2 — estado das perturbacoes que nao deslocam o equilibrio
    this.nAr = 0; // mols de argonio (gas inerte) no frasco
    this.cat = false; // catalisador presente?
    this.relax = 0; // 1 enquanto o deslocamento esta sendo animado
    this.alvo = null; // concentracoes-alvo calculadas por _equilibrar()
    // modo 3
    this.qh2 = 0.5;
    this.qi2 = 0.5;
    this.qhi = 1;
    this.fase = 0;
    this._equilibrar(true); // carga inicial: salto, nao ha o que animar
  }
  setMode(id) {
    this.modo = id;
  }
  setParam(k, v) {
    switch (k) {
      case 'h2i':
        this.h2i = v;
        this._reset();
        break;
      case 'i2i':
        this.i2i = v;
        this._reset();
        break;
      case 'hii':
        this.hii = v;
        this._reset();
        break;
      case 'qh2':
        this.qh2 = v;
        break;
      case 'qi2':
        this.qi2 = v;
        break;
      case 'qhi':
        this.qhi = v;
        break;
    }
    return {};
  }
  action(name) {
    if (name === 'eq-reset') {
      this._reset();
      return SIEQ.announce('Reação reiniciada no tempo zero.');
    }
    if (name === 'qk-status') {
      const q = this._Q();
      const K = this.D.HI.kc;
      const s = q < K * 0.98 ? 'Q menor que Kc: a reação caminha para a direita, formando mais iodeto de hidrogênio.' : q > K * 1.02 ? 'Q maior que Kc: a reação caminha para a esquerda, regenerando hidrogênio e iodo.' : 'Q praticamente igual a Kc: o sistema já está em equilíbrio.';
      return SIEQ.announce(`Quociente Q igual a ${SIEQ.fmt(q, 2)} contra Kc igual a ${K}. ${s}`);
    }
    if (name === 'lch-reset') {
      this.T = 25;
      this.V = 1;
      this.nN2O4 = 0.05;
      this.nNO2 = 0.02;
      this.strip = [];
      this.perturb = '—';
      this.nAr = 0;
      this.cat = false;
      this.relax = 0;
      this._equilibrar(true); // salto: nao houve perturbacao para observar
      return SIEQ.announce('Frasco reiniciado a 25 graus e volume normal, sem gás inerte e sem catalisador.');
    }
    const P = {
      'add-n2o4': () => {
        this.nN2O4 += 0.03;
        this.perturb = 'adição de N₂O₄';
      },
      'add-no2': () => {
        this.nNO2 += 0.03;
        this.perturb = 'adição de NO₂';
      },
      'aquecer': () => {
        this.T = Math.min(120, this.T + 10);
        this.perturb = 'aquecimento';
      },
      'resfriar': () => {
        this.T = Math.max(-20, this.T - 10);
        this.perturb = 'resfriamento';
      },
      'comprimir': () => {
        this.V = Math.max(0.25, this.V / 2);
        this.perturb = 'redução de volume';
      },
      'expandir': () => {
        this.V = Math.min(4, this.V * 2);
        this.perturb = 'aumento de volume';
      },
      /* AS DUAS PERTURBACOES QUE FALTAVAM — e sao justamente as que separam
         quem entendeu de quem decorou. Antes o aluno nao tinha como errar
         essas e aprender, porque nao existiam como opcao. */
      'inerte': () => {
        this.nAr = (this.nAr || 0) + 0.05;
        this.perturb = 'adição de gás inerte (argônio) a volume constante';
      },
      'catal': () => {
        this.cat = !this.cat;
        this.perturb = this.cat ? 'entrada do catalisador' : 'retirada do catalisador';
      }
    };
    if (P[name]) {
      const antes = this._concNO2();
      P[name]();
      // Gas inerte a V constante e catalisador NAO alteram Q nem K: o
      // reequilibrio devolve exatamente o mesmo estado, e o deslocamento
      // calculado sai zero. Nao ha excecao no codigo — a propria conta se
      // encarrega de nao deslocar, o que e o argumento pedagogico.
      const dir = this._equilibrar();
      const depois = this._concNO2();
      let sentido = dir > 0 ? 'para a direita, formando mais NO₂ castanho' : dir < 0 ? 'para a esquerda, formando mais N₂O₄ incolor' : 'permanece exatamente onde estava';
      let extra = '';
      if (name === 'inerte') {
        extra = ' O argônio não participa da reação: a volume constante ele aumenta a pressão TOTAL do frasco, mas não muda as pressões parciais nem as concentrações de N₂O₄ e NO₂. Como Q não muda, nada se desloca — é a pegadinha clássica.';
      } else if (name === 'catal') {
        extra = this.cat ? ' O catalisador acelera IGUALMENTE as reações direta e inversa: o equilíbrio é alcançado mais rápido, no mesmo ponto. Ele não altera Kc nem o rendimento.' : ' Catalisador retirado. O ponto de equilíbrio é o mesmo — só a pressa muda.';
      }
      SIEQ.announce(`Perturbação: ${this.perturb}. O equilíbrio se desloca ${sentido}. Concentração de NO₂ vai de ${SIEQ.fmt(antes, 4)} para ${SIEQ.fmt(depois, 4)} mol por litro.${extra}`);
    }
  }

  /* ── modelo HI ── */
  _reset() {
    this.h2 = this.h2i;
    this.i2 = this.i2i;
    this.hi = this.hii;
    this.hist = [];
    this.trel = 0;
  }
  _Q() {
    return this.qhi * this.qhi / Math.max(1e-6, this.qh2 * this.qi2);
  }

  /* ── modelo N₂O₄ ⇌ 2 NO₂ ── */
  _K(T) {
    const D = this.D.NO2;
    return D.kc25 * Math.exp(-D.dh / D.r * (1 / (T + 273.15) - 1 / 298.15));
  }
  _concN2O4() {
    return this.nN2O4 / this.V;
  }
  _concNO2() {
    return this.nNO2 / this.V;
  }

  /** Alvo do equilíbrio por bisseção no avanço x (mol/L de N₂O₄ consumido).
   *
   *  MUDANCA DE COMPORTAMENTO. Antes esta funcao ESCREVIA direto em nN2O4 e
   *  nNO2: o sistema SALTAVA para o novo equilibrio no mesmo quadro. O aluno
   *  via o antes e o depois, nunca o durante — e o "durante" e exatamente o que
   *  o principio de Le Chatelier descreve. Agora ela calcula o alvo e guarda em
   *  this.alvo; quem caminha ate lá e o update(), integrando a cinetica com o
   *  MESMO motor de velocidades que o modo "Atingindo o Equilibrio" ja usava
   *  (v = kf·[N2O4] − kr·[NO2]², com kr = kf/K).
   *
   *  Devolve o SENTIDO do deslocamento (+1 direita, −1 esquerda, 0 nenhum),
   *  que continua sendo o que os anuncios usam. */
  _equilibrar(aplicar) {
    const K = this._K(this.T);
    const a = this._concN2O4(),
      b = this._concNO2();
    const f = x => {
      const na = a - x,
        nb = b + 2 * x;
      if (na <= 1e-12 || nb < 0) return NaN;
      return nb * nb / na - K;
    };
    let lo = -b / 2 + 1e-9,
      hi = a - 1e-9;
    if (hi <= lo) return 0;
    let flo = f(lo);
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2,
        fm = f(mid);
      if (isNaN(fm)) {
        hi = mid;
        continue;
      }
      if (flo < 0 === fm < 0) {
        lo = mid;
        flo = fm;
      } else hi = mid;
    }
    const x = (lo + hi) / 2;
    // alvo (concentracoes de equilibrio) e o registro no strip-chart
    this.alvo = {
      n2o4: a - x,
      no2: b + 2 * x
    };
    this.strip.push({
      n2o4: a - x,
      no2: b + 2 * x,
      T: this.T
    });
    if (this.strip.length > 120) this.strip.shift();
    // `aplicar` = salto instantaneo. Usado so no reset e na carga inicial,
    // onde animar nao faz sentido (nao houve perturbacao para observar).
    if (aplicar) {
      this.nN2O4 = this.alvo.n2o4 * this.V;
      this.nNO2 = this.alvo.no2 * this.V;
      this.relax = 0;
    } else {
      this.relax = 1; // ha caminho a percorrer: o update() anima
    }
    return Math.sign(x);
  }

  /** Um passo da relaxacao rumo ao equilibrio, pela cinetica real.
   *  Integrado em sub-passos pequenos porque a reacao e rapida perto do
   *  equilibrio e um passo grande passaria do ponto (e oscilaria). */
  _lchStep(dt) {
    if (!this.relax) return;
    const K = this._K(this.T);
    const kf = 1.6,
      kr = kf / Math.max(1e-12, K);
    const passos = 10,
      h = Math.min(dt, .05) / passos;
    for (let i = 0; i < passos; i++) {
      const a = this.nN2O4 / this.V,
        b = this.nNO2 / this.V;
      // N2O4 ⇌ 2 NO2 : consome 1 de N2O4 e produz 2 de NO2
      const v = kf * a - kr * b * b;
      const dn = v * h * this.V;
      this.nN2O4 = Math.max(0, this.nN2O4 - dn);
      this.nNO2 = Math.max(0, this.nNO2 + 2 * dn);
    }
    // chegou perto o suficiente do alvo? entao para de animar
    if (this.alvo) {
      const ea = Math.abs(this.nN2O4 / this.V - this.alvo.n2o4);
      const eb = Math.abs(this.nNO2 / this.V - this.alvo.no2);
      const esc = Math.max(1e-4, this.alvo.n2o4 + this.alvo.no2);
      if ((ea + eb) / esc < 3e-3) {
        this.nN2O4 = this.alvo.n2o4 * this.V;
        this.nNO2 = this.alvo.no2 * this.V;
        this.relax = 0;
      }
    }
  }
  update(dt, app) {
    this.fase += dt;
    if (this.modo === 'lechatelier') {
      this._lchStep(dt);
      return;
    }
    if (this.modo !== 'atingir') return;
    const K = this.D.HI.kc,
      kf = 0.6,
      kr = kf / K;
    // integra em passos pequenos para estabilidade
    const passos = 8,
      h = Math.min(dt, .05) / passos;
    for (let i = 0; i < passos; i++) {
      const v = kf * this.h2 * this.i2 - kr * this.hi * this.hi;
      this.h2 = Math.max(0, this.h2 - v * h);
      this.i2 = Math.max(0, this.i2 - v * h);
      this.hi = Math.max(0, this.hi + 2 * v * h);
    }
    this.trel += dt;
    this.hist.push([this.trel, this.h2, this.i2, this.hi]);
    if (this.hist.length > 900) this.hist.shift();
  }
  draw(ctx, W, H, app) {
    if (this.modo === 'atingir') this._drawAtg(ctx, W, H);else if (this.modo === 'lechatelier') this._drawLch(ctx, W, H);else this._drawQk(ctx, W, H);
  }
  _drawAtg(ctx, W, H) {
    const tmax = Math.max(10, Math.ceil(this.trel / 10) * 10);
    const cmax = Math.max(1, this.h2i, this.i2i, this.hii, this.hi) * 1.15;
    // ANTES: `Math.min(W - 130, 470)` e `Math.min(H - 100, 280)` — o grafico
    // PARAVA de crescer em 470x280 px. Num canvas de 1000x700 sobravam ~400 px
    // de area vazia. Agora ocupa o espaco disponivel, com piso para nao sumir
    // em tela estreita; a margem esquerda tambem encolhe nesse caso, porque o
    // rotulo do eixo Y ocupa menos quando a fonte diminui.
    const est = SIEQ.isEstreito(W);
    const mx = est ? 52 : 72;
    const gw = Math.max(180, W - mx - (est ? 24 : 58));
    const gh = Math.max(140, H - (est ? 84 : 100));
    const A = SIEQ.kAxes(ctx, {
      x: mx,
      y: 40,
      w: gw,
      h: gh,
      xmin: 0,
      xmax: tmax,
      ymin: 0,
      ymax: cmax,
      xticks: [0, tmax / 4, tmax / 2, tmax * 3 / 4, tmax],
      yticks: [0, cmax / 3, cmax * 2 / 3, cmax],
      fmtx: v => SIEQ.fmt(v, 0),
      fmty: v => SIEQ.fmt(v, 2),
      xlab: 'Tempo (u.a.)',
      ylab: 'Concentração (mol/L)'
    });
    const series = [{
      idx: 1,
      cor: SIEQ.cssVar('--accent-cyan', '#22d3ee'),
      rot: '[H₂]'
    }, {
      idx: 2,
      cor: SIEQ.cssVar('--accent-secondary', '#a78bfa'),
      rot: '[I₂]'
    }, {
      idx: 3,
      cor: SIEQ.cssVar('--accent-main', '#a78bfa'),
      rot: '[HI]'
    }];
    series.forEach(s => {
      const pts = this.hist.map(h => [h[0], h[s.idx]]);
      if (pts.length > 1) SIEQ.kLine(ctx, pts, A.px, A.py, {
        color: s.cor,
        w: 2.4
      });
      const last = pts[pts.length - 1];
      if (last) SIEQ.kChip(ctx, `${s.rot} ${SIEQ.fmt(last[1], 3)}`, A.px(last[0]) - 46, A.py(last[1]), {
        fg: s.cor,
        size: 10,
        bold: true
      });
    });
    const Q = this.hi * this.hi / Math.max(1e-6, this.h2 * this.i2);
    const perto = Math.abs(Q - this.D.HI.kc) / this.D.HI.kc < .03;
    SIEQ.kChip(ctx, `Q = ${SIEQ.fmt(Q, 1)}  ·  Kc = ${this.D.HI.kc}`, W / 2, 22, {
      fg: perto ? SIEQ.cssVar('--accent-ok', '#4ade80') : SIEQ.cssVar('--accent-amber', '#fbbf24'),
      size: 12,
      bold: true
    });
    if (perto) SIEQ.kChip(ctx, 'EQUILÍBRIO ATINGIDO', W / 2, H - 20, {
      fg: SIEQ.cssVar('--accent-ok'),
      size: 11,
      bold: true
    });
  }
  _drawLch(ctx, W, H) {
    const no2 = this._concNO2(),
      n2o4 = this._concN2O4();
    const K = this._K(this.T);
    // ANTES: `Math.min(W * .3, 200)` para o centro e `clamp(..., 44, 130)`
    // para a largura do frasco — ambos travados. Em tela ESTREITA o frasco
    // ficava lado a lado com o strip-chart e os dois se apertavam; agora o
    // frasco vai para o topo e o grafico para baixo (empilhamento vertical).
    const est = SIEQ.isEstreito(W);
    const esc = SIEQ.clamp(W / 900, .78, 1.6); // escala geral do desenho
    const cx = est ? W / 2 : Math.max(150, W * .28);
    const fh = Math.round(170 * esc);
    const cy = est ? 40 + fh / 2 : H / 2 - 10;

    // frasco: largura acompanha o volume (e agora tambem a escala do canvas)
    const fw = SIEQ.clamp(70 * Math.sqrt(this.V) * esc, 44, 260);
    const tint = SIEQ.clamp(no2 / 0.12, 0, 1);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = SIEQ.kMix('#f8fafc', '#a1541c', tint);
    ctx.globalAlpha = .18 + tint * .72;
    SIEQ.kRound(ctx, -fw / 2, -fh / 2, fw, fh, 10);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = SIEQ.cssVar('--glass', 'rgba(148,163,184,.38)');
    ctx.lineWidth = 2.4;
    SIEQ.kRound(ctx, -fw / 2, -fh / 2, fw, fh, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, -fh / 2);
    ctx.lineTo(-9, -fh / 2 - 22);
    ctx.lineTo(9, -fh / 2 - 22);
    ctx.lineTo(9, -fh / 2);
    ctx.stroke();

    // moléculas
    const nA = Math.round(SIEQ.clamp(n2o4 * 240, 0, 30)),
      nB = Math.round(SIEQ.clamp(no2 * 240, 0, 40));
    for (let i = 0; i < nA; i++) {
      const a = i * 2.399 + this.fase * .2;
      const x = Math.cos(a) * (fw / 2 - 14),
        y = Math.sin(a * 1.7) * (fh / 2 - 16);
      ctx.fillStyle = SIEQ.cssVar('--text-secondary', '#94a3b8');
      ctx.beginPath();
      ctx.arc(x - 3, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 3, y, 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < nB; i++) {
      const a = i * 1.618 + this.fase * .35;
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (fw / 2 - 12), Math.cos(a * 2.1) * (fh / 2 - 14), 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    SIEQ.kChip(ctx, `${SIEQ.fmt(this.T, 0)} °C  ·  V = ${SIEQ.fmt(this.V, 2)} L`, cx, cy + fh / 2 + 26, {
      size: 11,
      bold: true
    });
    SIEQ.kLabel(ctx, this.D.NO2.eq, cx, cy - fh / 2 - 40, {
      size: 12,
      bold: true,
      color: SIEQ.cssVar('--text-primary')
    });
    if (this.T > 25) SIEQ.kFlame(ctx, cx, cy + fh / 2 + 52, 16, this.fase);

    // strip-chart histórico — ao lado do frasco em tela normal/larga,
    // ABAIXO dele em tela estreita (antes ficava sempre ao lado e era
    // esmagado a menos de 150 px, quando simplesmente desaparecia).
    const gx = est ? 52 : cx + Math.max(fw / 2 + 24, 110);
    const gy = est ? cy + fh / 2 + 78 : 46;
    const gw = Math.max(150, W - gx - (est ? 24 : 40));
    const gh = est ? Math.max(110, H - gy - 46) : Math.max(150, H - 110);
    if (gw > 150 && gh > 90) {
      const cmax = Math.max(0.02, ...this.strip.map(s => Math.max(s.n2o4, s.no2))) * 1.2;
      const A = SIEQ.kAxes(ctx, {
        x: gx,
        y: gy,
        w: gw,
        h: gh,
        xmin: 0,
        xmax: Math.max(20, this.strip.length),
        ymin: 0,
        ymax: cmax,
        xticks: [],
        yticks: [0, cmax / 2, cmax],
        fmty: v => v.toExponential(1),
        xlab: 'perturbações →',
        ylab: 'mol/L'
      });
      const s1 = this.strip.map((s, i) => [i, s.n2o4]);
      const s2 = this.strip.map((s, i) => [i, s.no2]);
      if (s1.length > 1) {
        SIEQ.kLine(ctx, s1, A.px, A.py, {
          color: SIEQ.cssVar('--text-secondary'),
          w: 2.2
        });
        SIEQ.kLine(ctx, s2, A.px, A.py, {
          color: '#c2410c',
          w: 2.2
        });
      }
      SIEQ.kChip(ctx, '[N₂O₄]', gx + 42, gy - 12, {
        fg: SIEQ.cssVar('--text-secondary'),
        size: 10
      });
      SIEQ.kChip(ctx, '[NO₂]', gx + 110, gy - 12, {
        fg: '#c2410c',
        size: 10
      });
      SIEQ.kChip(ctx, `K(T) = ${K.toExponential(2)}`, gx + gw / 2, gy + gh + 34, {
        fg: SIEQ.cssVar('--accent-main'),
        size: 10,
        bold: true
      });
    }
  }
  _drawQk(ctx, W, H) {
    const q = this._Q(),
      K = this.D.HI.kc;
    const cx = W / 2,
      cy = H / 2;
    const lq = Math.log10(Math.max(1e-4, q)),
      lk = Math.log10(K);
    // ANTES: `Math.min(W - 120, 460)` — a regua logaritmica travava em 460 px.
    // Ela e o elemento central deste modo: quanto mais larga, mais facil ler a
    // distancia entre Q e Kc. Agora usa a largura toda, com margem menor em
    // tela estreita.
    const bw = Math.max(200, W - (SIEQ.isEstreito(W) ? 48 : 120));
    const x0 = cx - bw / 2,
      y = cy + 10;

    // régua log
    ctx.save();
    ctx.strokeStyle = SIEQ.cssVar('--border', '#1c2e44');
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + bw, y);
    ctx.stroke();
    ctx.restore();
    const pos = v => x0 + SIEQ.clamp((v + 4) / 8, 0, 1) * bw;
    [-4, -2, 0, 2, 4].forEach(t => {
      SIEQ.kLabel(ctx, `10${t < 0 ? '⁻' : ''}${Math.abs(t)}`, pos(t), y + 24, {
        size: 10,
        color: SIEQ.cssVar('--text-muted'),
        mono: true
      });
      ctx.strokeStyle = SIEQ.cssVar('--text-muted');
      ctx.beginPath();
      ctx.moveTo(pos(t), y + 7);
      ctx.lineTo(pos(t), y + 12);
      ctx.stroke();
    });

    // marcador de K
    ctx.save();
    ctx.strokeStyle = SIEQ.cssVar('--accent-ok', '#4ade80');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pos(lk), y - 26);
    ctx.lineTo(pos(lk), y + 12);
    ctx.stroke();
    ctx.restore();
    SIEQ.kChip(ctx, `Kc = ${K}`, pos(lk), y - 40, {
      fg: SIEQ.cssVar('--accent-ok'),
      size: 11,
      bold: true
    });

    // marcador de Q
    const cQ = Math.abs(lq - lk) < .02 ? SIEQ.cssVar('--accent-ok', '#4ade80') : SIEQ.cssVar('--accent-amber', '#fbbf24');
    ctx.save();
    ctx.fillStyle = cQ;
    ctx.beginPath();
    ctx.moveTo(pos(lq), y - 8);
    ctx.lineTo(pos(lq) - 8, y - 22);
    ctx.lineTo(pos(lq) + 8, y - 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    SIEQ.kChip(ctx, `Q = ${SIEQ.fmt(q, 2)}`, pos(lq), y + 52, {
      fg: cQ,
      size: 11,
      bold: true
    });

    // seta do sentido
    const dif = lk - lq;
    if (Math.abs(dif) > .02) {
      const dir = Math.sign(dif);
      SIEQ.kArrow(ctx, cx - dir * 60, cy - 86, cx + dir * 60, cy - 86, {
        color: cQ,
        w: 2.6,
        head: 10
      });
      SIEQ.kLabel(ctx, dir > 0 ? 'reação caminha para a DIREITA (forma HI)' : 'reação caminha para a ESQUERDA (forma H₂ e I₂)', cx, cy - 110, {
        size: 12,
        bold: true,
        color: cQ
      });
    } else {
      SIEQ.kLabel(ctx, 'sistema em EQUILÍBRIO', cx, cy - 96, {
        size: 13,
        bold: true,
        color: SIEQ.cssVar('--accent-ok')
      });
    }
    SIEQ.kLabel(ctx, this.D.HI.eq, cx, 30, {
      size: 13,
      bold: true,
      color: SIEQ.cssVar('--text-primary')
    });
    SIEQ.kLabel(ctx, `Q = [HI]² / ([H₂]·[I₂]) = ${SIEQ.fmt(this.qhi, 2)}² / (${SIEQ.fmt(this.qh2, 2)} × ${SIEQ.fmt(this.qi2, 2)})`, cx, H - 24, {
      size: 11,
      color: SIEQ.cssVar('--text-secondary'),
      mono: true
    });
  }
  getResults() {
    if (this.modo === 'atingir') {
      const Q = this.hi * this.hi / Math.max(1e-6, this.h2 * this.i2);
      return [{
        l: '[H₂]',
        v: SIEQ.fmt(this.h2, 3) + ' mol/L'
      }, {
        l: '[I₂]',
        v: SIEQ.fmt(this.i2, 3) + ' mol/L'
      }, {
        l: '[HI]',
        v: SIEQ.fmt(this.hi, 3) + ' mol/L'
      }, {
        l: 'Quociente Q',
        v: SIEQ.fmt(Q, 2)
      }, {
        l: 'Kc (448 °C)',
        v: String(this.D.HI.kc),
        cls: 'val-ok'
      }, {
        l: 'Estado',
        v: Math.abs(Q - this.D.HI.kc) / this.D.HI.kc < .03 ? 'em equilíbrio' : 'caminhando',
        cls: 'val-ok'
      }];
    }
    if (this.modo === 'lechatelier') {
      return [{
        l: 'Temperatura',
        v: SIEQ.fmt(this.T, 0) + ' °C'
      }, {
        l: 'Volume',
        v: SIEQ.fmt(this.V, 2) + ' L'
      }, {
        l: '[N₂O₄]',
        v: this._concN2O4().toExponential(3) + ' mol/L'
      }, {
        l: '[NO₂]',
        v: this._concNO2().toExponential(3) + ' mol/L',
        cls: 'val-exo'
      }, {
        l: 'Q = [NO₂]²/[N₂O₄]',
        v: (this._concNO2() ** 2 / Math.max(1e-12, this._concN2O4())).toExponential(3)
      }, {
        l: 'Kc na T atual',
        v: this._K(this.T).toExponential(3)
      }, {
        l: 'ΔH',
        v: '+' + this.D.NO2.dh + ' kJ/mol',
        cls: 'val-endo'
      }, {
        l: 'Gás inerte (Ar)',
        v: this.nAr > 0 ? `${SIEQ.fmt(this.nAr, 3)} mol — não desloca` : 'nenhum'
      }, {
        l: 'Catalisador',
        v: this.cat ? 'presente — não desloca, só acelera' : 'ausente'
      }, {
        l: 'Estado',
        v: this.relax ? 'deslocando…' : 'em equilíbrio',
        cls: this.relax ? 'val-endo' : 'val-ok'
      }, {
        l: 'Última perturbação',
        v: this.perturb
      }];
    }
    const q = this._Q(),
      K = this.D.HI.kc;
    return [{
      l: '[H₂]',
      v: SIEQ.fmt(this.qh2, 2) + ' mol/L'
    }, {
      l: '[I₂]',
      v: SIEQ.fmt(this.qi2, 2) + ' mol/L'
    }, {
      l: '[HI]',
      v: SIEQ.fmt(this.qhi, 2) + ' mol/L'
    }, {
      l: 'Quociente Q',
      v: SIEQ.fmt(q, 3)
    }, {
      l: 'Kc',
      v: String(K),
      cls: 'val-ok'
    }, {
      l: 'Q / Kc',
      v: SIEQ.fmt(q / K, 3)
    }, {
      l: 'Sentido',
      cls: 'val-ok',
      v: q < K * .98 ? '→ forma HI' : q > K * 1.02 ? '← forma H₂ e I₂' : 'equilíbrio'
    }];
  }
  getOverlay() {
    if (this.modo === 'atingir') return `H₂ + I₂ ⇌ 2 HI · t = ${SIEQ.fmt(this.trel, 1)}`;
    if (this.modo === 'lechatelier') return `${SIEQ.fmt(this.T, 0)} °C · V ${SIEQ.fmt(this.V, 2)} L · ${this.perturb}`;
    return `Q = ${SIEQ.fmt(this._Q(), 2)} · Kc = ${this.D.HI.kc}`;
  }
};
// ══════════════════════════════════════════════════════════════════
// MECÂNICA B — pH e Equilíbrio Iônico (origem: SIPH)
// Modos: escala de pH · cálculo com Ka/Kb · titulação
// ══════════════════════════════════════════════════════════════════
SIEQ.MechB = class MechB {
  constructor(D) {
    this.D = D;
    this.modo = 'escala';
    this.ph = 7;
    this.substancia = null;
    // modo 2
    this.eletrolito = D.ELETROLITOS[0];
    this.conc = -1;
    // modo 3
    this.indicador = D.INDICADORES[0];
    this.vb = 0;
    this.auto = false;
    this.gotas = [];
    this.fase = 0;
  }
  build(app) {
    SIEQ.fillOptGrid('esc-grid', this.D.SUBSTANCIAS.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.cor,
      extra: SIEQ.fmt(s.ph, 1),
      aria: `${s.nome}, pH ${SIEQ.fmt(s.ph, 1)}`
    })), null);
    SIEQ.fillOptGrid('calc-grid', this.D.ELETROLITOS.map(e => ({
      value: e.id,
      nome: e.nome,
      dot: e.dot,
      extra: e.forte ? 'forte' : 'fraco',
      aria: `${e.nome}, ${e.desc}`
    })), this.eletrolito.id);
    SIEQ.fillOptGrid('tit-grid', this.D.INDICADORES.map(i => ({
      value: i.id,
      nome: i.nome,
      dot: i.c2,
      extra: `${SIEQ.fmt(i.a, 1)}–${SIEQ.fmt(i.b, 1)}`,
      aria: `${i.nome}, vira de ${i.r1} para ${i.r2} entre pH ${SIEQ.fmt(i.a, 1)} e ${SIEQ.fmt(i.b, 1)}`
    })), this.indicador.id);
  }
  setMode(id) {
    this.modo = id;
    this.auto = false;
  }
  setParam(k, v) {
    switch (k) {
      case 'ph':
        this.ph = v;
        this.substancia = null;
        break;
      case 'substancia':
        {
          const s = this.D.SUBSTANCIAS.find(x => x.id === v);
          if (s) {
            this.substancia = s;
            this.ph = s.ph;
            this.app.syncSlider('esc-ph', s.ph);
            return {
              say: `${s.nome}: pH ${SIEQ.fmt(s.ph, 1)}, meio ${this._classe(s.ph)}.`
            };
          }
          break;
        }
      case 'eletrolito':
        {
          this.eletrolito = this.D.ELETROLITOS.find(e => e.id === v) || this.eletrolito;
          return {
            say: `${this.eletrolito.nome}: ${this.eletrolito.desc}.`
          };
        }
      case 'conc':
        this.conc = v;
        break;
      case 'indicador':
        {
          this.indicador = this.D.INDICADORES.find(i => i.id === v) || this.indicador;
          const i = this.indicador;
          return {
            say: `${i.nome}: vira de ${i.r1} para ${i.r2} entre pH ${SIEQ.fmt(i.a, 1)} e ${SIEQ.fmt(i.b, 1)}.`
          };
        }
      case 'vb':
        this.vb = v;
        this.auto = false;
        break;
    }
    return {};
  }
  action(name) {
    if (name === 'esc-status') {
      const h = Math.pow(10, -this.ph),
        oh = this.D.KW / h;
      return SIEQ.announce(`pH ${SIEQ.fmt(this.ph, 1)}, meio ${this._classe(this.ph)}. Concentração de hidrônio ${h.toExponential(2)} e de hidróxido ${oh.toExponential(2)} mol por litro. pOH igual a ${SIEQ.fmt(14 - this.ph, 1)}.`);
    }
    if (name === 'calc-status') {
      const r = this._calc();
      return SIEQ.announce(`${this.eletrolito.nome} a ${r.C.toExponential(2)} mol por litro: pH igual a ${SIEQ.fmt(r.ph, 2)}, pOH ${SIEQ.fmt(14 - r.ph, 2)}, grau de ionização ${SIEQ.fmt(r.alpha * 100, 2)} por cento.`);
    }
    if (name === 'gotejar') {
      this.vb = Math.min(50, this.vb + 0.5);
      this.app.syncSlider('tit-v', this.vb);
      this.gotas.push({
        t: 0
      });
      const p = this._phTit(this.vb);
      SIEQ.announce(`${SIEQ.fmt(this.vb, 1)} mililitros de base adicionados. pH ${SIEQ.fmt(p, 2)}.`);
    }
    if (name === 'tit-auto') {
      this.auto = !this.auto;
      SIEQ.announce(this.auto ? 'Titulação automática iniciada.' : 'Titulação pausada.');
    }
    if (name === 'tit-reset') {
      this.vb = 0;
      this.auto = false;
      this.gotas = [];
      this.app.syncSlider('tit-v', 0);
      SIEQ.announce('Titulação reiniciada com zero mililitro de base.');
    }
  }
  _classe(p) {
    return p < 6.9 ? 'ácido' : p > 7.1 ? 'básico' : 'neutro';
  }

  /* ── cálculo de pH de ácido/base ── */
  _calc() {
    const C = Math.pow(10, this.conc),
      E = this.eletrolito;
    let h, alpha;
    if (E.forte) {
      alpha = 1;
      h = E.tipo === 'acido' ? C : this.D.KW / C;
    } else {
      const K = E.k;
      const x = (-K + Math.sqrt(K * K + 4 * K * C)) / 2; // [H⁺] ou [OH⁻]
      alpha = x / C;
      h = E.tipo === 'acido' ? x : this.D.KW / x;
    }
    return {
      C,
      h,
      alpha,
      ph: -Math.log10(h)
    };
  }

  /* ── curva de titulação ácido forte × base forte ── */
  _phTit(vb) {
    const {
      va,
      ca,
      cb
    } = this.D.TIT;
    const na = ca * va,
      nb = cb * vb,
      vt = va + vb;
    const d = na - nb;
    if (Math.abs(d) < 1e-9) return 7;
    if (d > 0) return -Math.log10(d / vt);
    return 14 + Math.log10(-d / vt);
  }
  _corInd(ph) {
    const i = this.indicador;
    const t = SIEQ.clamp((ph - i.a) / (i.b - i.a), 0, 1);
    return SIEQ.kMix(i.c1, i.c2, t);
  }
  update(dt, app) {
    this.fase += dt;
    if (this.modo === 'titulacao') {
      if (this.auto && this.vb < 50) {
        const perto = Math.abs(this.vb - 25) < 1.5;
        this.vb = Math.min(50, this.vb + dt * (perto ? 0.6 : 3.5));
        this.app.syncSlider('tit-v', Math.round(this.vb * 10) / 10);
        if (Math.random() < dt * 8) this.gotas.push({
          t: 0
        });
        if (this.vb >= 50) this.auto = false;
      }
      for (let i = this.gotas.length - 1; i >= 0; i--) {
        this.gotas[i].t += dt;
        if (this.gotas[i].t > .55) this.gotas.splice(i, 1);
      }
    }
  }
  onArrow(dx) {
    if (this.modo !== 'escala' || !dx) return false;
    this.ph = SIEQ.clamp(Math.round((this.ph + dx * 0.1) * 10) / 10, 0, 14);
    this.substancia = null;
    this.app.syncSlider('esc-ph', this.ph);
    return true;
  }
  draw(ctx, W, H, app) {
    if (this.modo === 'escala') this._drawEsc(ctx, W, H);else if (this.modo === 'calculo') this._drawCalc(ctx, W, H);else this._drawTit(ctx, W, H);
  }
  _corPh(ph) {
    const S = this.D.SUBSTANCIAS;
    let a = S[0],
      b = S[S.length - 1];
    for (let i = 1; i < S.length; i++) {
      if (ph <= S[i].ph) {
        a = S[i - 1];
        b = S[i];
        break;
      }
      if (ph > S[S.length - 1].ph) {
        a = b = S[S.length - 1];
      }
    }
    const t = b.ph === a.ph ? 0 : SIEQ.clamp((ph - a.ph) / (b.ph - a.ph), 0, 1);
    return SIEQ.kMix(a.cor, b.cor, t);
  }
  _drawEsc(ctx, W, H) {
    // ANTES: `Math.min(W - 90, 480)` — a faixa de pH, que E o objeto central
    // deste modo, travava em 480 px. Agora ocupa a largura util; a altura da
    // barra tambem acompanha, para nao virar um fio num monitor grande.
    const est = SIEQ.isEstreito(W);
    const bw = Math.max(220, W - (est ? 56 : 90));
    const x0 = (W - bw) / 2,
      y = est ? 58 : 70;
    const bh = Math.round(SIEQ.clamp(34 * (W / 900), 30, 56));

    // faixa gradiente 0–14
    const g = ctx.createLinearGradient(x0, 0, x0 + bw, 0);
    for (let i = 0; i <= 14; i++) g.addColorStop(i / 14, this._corPh(i));
    ctx.save();
    SIEQ.kRound(ctx, x0, y, bw, bh, 6);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = SIEQ.cssVar('--border', '#1c2e44');
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i <= 14; i += 2) {
      const x = x0 + i / 14 * bw;
      SIEQ.kLabel(ctx, String(i), x, y + bh + 14, {
        size: 10,
        color: SIEQ.cssVar('--text-muted'),
        mono: true
      });
    }
    SIEQ.kLabel(ctx, 'ÁCIDO', x0 + bw * .16, y - 16, {
      size: 11,
      bold: true,
      color: SIEQ.cssVar('--accent-exo', '#f87171')
    });
    SIEQ.kLabel(ctx, 'NEUTRO', x0 + bw * .5, y - 16, {
      size: 11,
      bold: true,
      color: SIEQ.cssVar('--accent-ok', '#4ade80')
    });
    SIEQ.kLabel(ctx, 'BÁSICO', x0 + bw * .84, y - 16, {
      size: 11,
      bold: true,
      color: SIEQ.cssVar('--accent-cyan', '#22d3ee')
    });

    // marcador
    const mx = x0 + this.ph / 14 * bw;
    ctx.save();
    ctx.fillStyle = SIEQ.cssVar('--text-primary', '#e6f0fa');
    ctx.beginPath();
    ctx.moveTo(mx, y - 4);
    ctx.lineTo(mx - 7, y - 16);
    ctx.lineTo(mx + 7, y - 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mx, y);
    ctx.lineTo(mx, y + bh);
    ctx.stroke();
    ctx.restore();
    SIEQ.kChip(ctx, `pH ${SIEQ.fmt(this.ph, 1)}${this.substancia ? ' · ' + this.substancia.nome : ''}`, SIEQ.clamp(mx, x0 + 60, x0 + bw - 60), y + bh + 38, {
      fg: this._corPh(this.ph),
      size: 12,
      bold: true
    });

    // barras logarítmicas de H₃O⁺ e OH⁻
    const h = Math.pow(10, -this.ph),
      oh = this.D.KW / h;
    const by = y + bh + 76,
      bwid = bw,
      bhh = 22;
    const desenha = (rot, val, cor, yy) => {
      const f = SIEQ.clamp((14 + Math.log10(val)) / 14, 0, 1);
      ctx.save();
      ctx.fillStyle = SIEQ.cssVar('--border', '#1c2e44');
      SIEQ.kRound(ctx, x0, yy, bwid, bhh, 5);
      ctx.fill();
      ctx.fillStyle = cor;
      SIEQ.kRound(ctx, x0, yy, Math.max(4, bwid * f), bhh, 5);
      ctx.fill();
      ctx.restore();
      SIEQ.kLabel(ctx, rot, x0 - 8, yy + bhh / 2, {
        size: 11,
        align: 'right',
        color: cor,
        bold: true
      });
      SIEQ.kLabel(ctx, val.toExponential(2) + ' mol/L', x0 + bwid - 8, yy + bhh / 2, {
        size: 10,
        align: 'right',
        color: '#fff',
        mono: true
      });
    };
    if (by + 60 < H) {
      desenha('[H₃O⁺]', h, SIEQ.cssVar('--accent-exo', '#f87171'), by);
      desenha('[OH⁻]', oh, SIEQ.cssVar('--accent-cyan', '#22d3ee'), by + bhh + 14);
      SIEQ.kLabel(ctx, `pOH = ${SIEQ.fmt(14 - this.ph, 1)}   ·   pH + pOH = 14`, W / 2, by + bhh * 2 + 44, {
        size: 11,
        color: SIEQ.cssVar('--text-secondary'),
        mono: true
      });
    }
  }
  _drawCalc(ctx, W, H) {
    const r = this._calc(),
      E = this.eletrolito;
    const cx = W / 2;
    // ANTES: bequer em `cx - 150` e painel numerico em `cx + 60`, largura fixa
    // de 190 px. Abaixo de ~620 px os dois se sobrepunham. Agora, em tela
    // estreita, bequer no topo e painel embaixo (empilhado).
    const est = SIEQ.isEstreito(W);
    const pw = est ? Math.max(150, W - 72) : 190; // largura do painel numerico

    // béquer com cor do pH
    const bx = est ? cx : cx - Math.max(120, W * .2);
    ctx.save();
    const bcy = est ? 190 : H / 2 + 60; // base do bequer
    ctx.translate(bx, bcy);
    SIEQ.kBeaker(ctx, 0, -140, 118, 140, .74, this._corPh(r.ph), {
      alpha: .55,
      rotulo: E.nome
    });
    // partículas: ionizadas × não ionizadas
    const total = 24,
      ion = Math.round(SIEQ.clamp(r.alpha, 0, 1) * total);
    for (let i = 0; i < total; i++) {
      const a = i * 2.399 + this.fase * .22;
      const x = Math.cos(a) * 42,
        y = -60 + Math.sin(a * 1.4) * 32;
      const ionizada = i < ion;
      ctx.fillStyle = ionizada ? SIEQ.cssVar('--accent-main', '#f472b6') : SIEQ.cssVar('--text-muted', '#64748b');
      if (ionizada) {
        ctx.beginPath();
        ctx.arc(x - 4, y, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 4, y + 3, 3.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    SIEQ.kChip(ctx, `α = ${SIEQ.fmt(r.alpha * 100, 2)} % ionizado`, bx, bcy + 32, {
      fg: SIEQ.cssVar('--accent-main'),
      size: 11,
      bold: true
    });

    // painel numérico
    const px = est ? 36 : cx + 60;
    const linhas = [['Concentração C', r.C.toExponential(2) + ' mol/L'], [E.tipo === 'acido' ? '[H₃O⁺]' : '[OH⁻]', (E.tipo === 'acido' ? r.h : this.D.KW / r.h).toExponential(2) + ' mol/L'], ['pH', SIEQ.fmt(r.ph, 2)], ['pOH', SIEQ.fmt(14 - r.ph, 2)], ['Grau α', SIEQ.fmt(r.alpha * 100, 2) + ' %'], [E.forte ? 'Ionização' : E.tipo === 'acido' ? 'Ka' : 'Kb', E.forte ? 'total' : E.k.toExponential(1)]];
    const py0 = est ? bcy + 62 : H / 2 - 84;
    const dy = est ? Math.max(22, Math.min(30, (H - py0 - 24) / linhas.length)) : 30;
    linhas.forEach((l, i) => {
      const y = py0 + i * dy;
      SIEQ.kLabel(ctx, l[0], px, y, {
        size: 11,
        align: 'left',
        color: SIEQ.cssVar('--text-secondary')
      });
      SIEQ.kLabel(ctx, l[1], px + pw, y, {
        size: 12,
        align: 'right',
        bold: true,
        mono: true,
        color: SIEQ.cssVar('--text-primary')
      });
      ctx.save();
      ctx.strokeStyle = SIEQ.cssVar('--border', '#1c2e44');
      ctx.beginPath();
      ctx.moveTo(px, y + dy * .43);
      ctx.lineTo(px + pw, y + dy * .43);
      ctx.stroke();
      ctx.restore();
    });
    SIEQ.kLabel(ctx, E.desc, cx, 28, {
      size: 12,
      bold: true,
      color: SIEQ.cssVar('--text-primary')
    });
  }
  _drawTit(ctx, W, H) {
    const ph = this._phTit(this.vb);
    const corInd = this._corInd(ph);

    // ── bureta e erlenmeyer ──
    // ANTES: `Math.min(W * .24, 150)` travava a coluna da vidraria em 150 px e,
    // como a curva comecava em `bx + 130`, num canvas estreito ela ficava com
    // menos de 160 px e simplesmente NAO era desenhada — o aluno perdia o
    // grafico, que e a razao de ser do modo. Em tela estreita a vidraria agora
    // fica reduzida e a curva vai para baixo dela.
    const est = SIEQ.isEstreito(W);
    const bx = est ? W * .22 : Math.max(120, W * .2);
    const btop = 34,
      bh = est ? 96 : 130;
    ctx.save();
    ctx.strokeStyle = SIEQ.cssVar('--glass', 'rgba(148,163,184,.38)');
    ctx.lineWidth = 2.2;
    SIEQ.kRound(ctx, bx - 11, btop, 22, bh, 3);
    ctx.stroke();
    const frac = 1 - this.vb / 50;
    ctx.fillStyle = SIEQ.cssVar('--accent-cyan', '#22d3ee');
    ctx.globalAlpha = .5;
    ctx.fillRect(bx - 8, btop + (1 - frac) * (bh - 6) + 3, 16, frac * (bh - 6));
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(bx - 3, btop + bh);
    ctx.lineTo(bx - 3, btop + bh + 20);
    ctx.lineTo(bx + 3, btop + bh + 20);
    ctx.lineTo(bx + 3, btop + bh);
    ctx.stroke();
    ctx.restore();
    SIEQ.kLabel(ctx, 'NaOH 0,100 M', bx, btop - 14, {
      size: 10,
      color: SIEQ.cssVar('--text-secondary')
    });

    // gotas caindo
    const eTop = btop + bh + 74;
    this.gotas.forEach(g => {
      const t = g.t / .55;
      ctx.fillStyle = SIEQ.cssVar('--accent-cyan', '#22d3ee');
      ctx.beginPath();
      ctx.arc(bx, btop + bh + 22 + t * (eTop - btop - bh - 20), 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // erlenmeyer
    ctx.save();
    ctx.translate(bx, eTop);
    const eh = 108,
      ew = 96;
    ctx.strokeStyle = SIEQ.cssVar('--glass');
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(-11, 18);
    ctx.lineTo(-ew / 2, eh - 8);
    ctx.quadraticCurveTo(-ew / 2, eh, -ew / 2 + 10, eh);
    ctx.lineTo(ew / 2 - 10, eh);
    ctx.quadraticCurveTo(ew / 2, eh, ew / 2, eh - 8);
    ctx.lineTo(11, 18);
    ctx.lineTo(11, 0);
    ctx.stroke();
    // líquido com cor do indicador
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-ew / 2 + 6, eh - 4);
    ctx.lineTo(-24, 44);
    ctx.lineTo(24, 44);
    ctx.lineTo(ew / 2 - 6, eh - 4);
    ctx.closePath();
    ctx.fillStyle = corInd;
    ctx.globalAlpha = .78;
    ctx.fill();
    ctx.restore();
    ctx.restore();
    SIEQ.kLabel(ctx, `25,0 mL HCl + ${SIEQ.fmt(this.vb, 1)} mL`, bx, eTop + 128, {
      size: 10,
      color: SIEQ.cssVar('--text-secondary')
    });

    // ── curva de titulação ──
    const gx = est ? 52 : bx + Math.max(130, W * .06);
    const gy = est ? eTop + 168 : 44;
    const gw = Math.max(160, W - gx - (est ? 24 : 40));
    const gh = est ? Math.max(110, H - gy - 44) : Math.max(160, H - 110);
    if (gw > 160 && gh > 90) {
      const A = SIEQ.kAxes(ctx, {
        x: gx,
        y: gy,
        w: gw,
        h: gh,
        xmin: 0,
        xmax: 50,
        ymin: 0,
        ymax: 14,
        xticks: [0, 10, 20, 25, 30, 40, 50],
        yticks: [0, 2, 4, 7, 10, 12, 14],
        xlab: 'Volume de NaOH (mL)',
        ylab: 'pH'
      });

      // faixa de viragem do indicador
      const I = this.indicador;
      ctx.save();
      ctx.fillStyle = I.c2;
      ctx.globalAlpha = .16;
      ctx.fillRect(A.px(0), A.py(I.b), gw, A.py(I.a) - A.py(I.b));
      ctx.restore();
      SIEQ.kLabel(ctx, `viragem ${I.nome}`, A.px(2), A.py((I.a + I.b) / 2), {
        size: 9,
        align: 'left',
        color: I.c2
      });

      // curva completa e trecho percorrido
      const total = [],
        feito = [];
      for (let v = 0; v <= 50; v += .1) {
        const p = [v, this._phTit(v)];
        total.push(p);
        if (v <= this.vb) feito.push(p);
      }
      SIEQ.kLine(ctx, total, A.px, A.py, {
        color: SIEQ.cssVar('--text-muted'),
        w: 1.2,
        dash: [4, 4],
        alpha: .5
      });
      if (feito.length > 1) SIEQ.kLine(ctx, feito, A.px, A.py, {
        color: SIEQ.cssVar('--accent-main', '#f472b6'),
        w: 2.6
      });

      // ponto de equivalência
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = SIEQ.cssVar('--accent-ok', '#4ade80');
      ctx.beginPath();
      ctx.moveTo(A.px(25), A.py(0));
      ctx.lineTo(A.px(25), A.py(14));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(A.px(0), A.py(7));
      ctx.lineTo(A.px(50), A.py(7));
      ctx.stroke();
      ctx.restore();
      SIEQ.kChip(ctx, 'equivalência · 25 mL · pH 7', A.px(25) + 6, A.py(7) - 22, {
        fg: SIEQ.cssVar('--accent-ok'),
        size: 10,
        bold: true
      });

      // ponto atual
      ctx.fillStyle = SIEQ.cssVar('--accent-main', '#f472b6');
      ctx.beginPath();
      ctx.arc(A.px(this.vb), A.py(ph), 5.5, 0, Math.PI * 2);
      ctx.fill();
      SIEQ.kChip(ctx, `pH ${SIEQ.fmt(ph, 2)}`, A.px(this.vb), A.py(ph) - 20, {
        fg: SIEQ.cssVar('--accent-main'),
        size: 10,
        bold: true
      });
    }
  }
  getResults() {
    if (this.modo === 'escala') {
      const h = Math.pow(10, -this.ph),
        oh = this.D.KW / h;
      return [{
        l: 'Substância',
        v: this.substancia ? this.substancia.nome : 'personalizada'
      }, {
        l: 'pH',
        v: SIEQ.fmt(this.ph, 1),
        cls: 'val-ok'
      }, {
        l: 'pOH',
        v: SIEQ.fmt(14 - this.ph, 1)
      }, {
        l: '[H₃O⁺]',
        v: h.toExponential(2) + ' mol/L',
        cls: 'val-exo'
      }, {
        l: '[OH⁻]',
        v: oh.toExponential(2) + ' mol/L',
        cls: 'val-endo'
      }, {
        l: 'Caráter',
        v: this._classe(this.ph)
      }, {
        l: 'Kw',
        v: '1,0·10⁻¹⁴'
      }];
    }
    if (this.modo === 'calculo') {
      const r = this._calc(),
        E = this.eletrolito;
      return [{
        l: 'Eletrólito',
        v: E.nome
      }, {
        l: 'Tipo',
        v: (E.forte ? 'forte' : 'fraco') + ' · ' + E.tipo
      }, {
        l: 'Concentração',
        v: r.C.toExponential(2) + ' mol/L'
      }, {
        l: E.forte ? 'Constante' : E.tipo === 'acido' ? 'Ka' : 'Kb',
        v: E.forte ? '—' : E.k.toExponential(1)
      }, {
        l: '[H₃O⁺]',
        v: r.h.toExponential(2) + ' mol/L'
      }, {
        l: 'pH',
        v: SIEQ.fmt(r.ph, 2),
        cls: 'val-ok'
      }, {
        l: 'pOH',
        v: SIEQ.fmt(14 - r.ph, 2)
      }, {
        l: 'Grau de ionização',
        v: SIEQ.fmt(r.alpha * 100, 2) + ' %'
      }];
    }
    const ph = this._phTit(this.vb),
      I = this.indicador;
    const virou = ph >= I.b,
      meio = ph > I.a && ph < I.b;
    const {
      va,
      ca,
      cb
    } = this.D.TIT;
    return [{
      l: 'Volume de NaOH',
      v: SIEQ.fmt(this.vb, 1) + ' mL'
    }, {
      l: 'mol de HCl',
      v: SIEQ.fmt(ca * va, 3) + ' mmol'
    }, {
      l: 'mol de NaOH',
      v: SIEQ.fmt(cb * this.vb, 3) + ' mmol'
    }, {
      l: 'pH atual',
      v: SIEQ.fmt(ph, 2),
      cls: 'val-ok'
    }, {
      l: 'Volume total',
      v: SIEQ.fmt(va + this.vb, 1) + ' mL'
    }, {
      l: 'Indicador',
      v: virou ? I.r2 : meio ? 'virando' : I.r1
    }, {
      l: 'Situação',
      v: this.vb < 24.95 ? 'excesso de ácido' : this.vb > 25.05 ? 'excesso de base' : 'ponto de equivalência',
      cls: Math.abs(this.vb - 25) < .06 ? 'val-ok' : ''
    }];
  }
  getOverlay() {
    if (this.modo === 'escala') return `pH ${SIEQ.fmt(this.ph, 1)} · meio ${this._classe(this.ph)}`;
    if (this.modo === 'calculo') return `${this.eletrolito.nome} · pH ${SIEQ.fmt(this._calc().ph, 2)}`;
    return `${SIEQ.fmt(this.vb, 1)} mL · pH ${SIEQ.fmt(this._phTit(this.vb), 2)}`;
  }
};
SIEQ.SUP = {
  2: '²',
  3: '³',
  4: '⁴'
};
SIEQ.MechC = class MechC {
  constructor(D) {
    this.D = D;
    this.modo = 'kps';
    this.fase = 0;

    // ── modo Kps ──
    this.sal = D.SAIS_KPS[0];
    this.kCat = -5;
    this.kAni = -5; // expoentes: [íon] = 10^expoente
    this.precFlash = 0; // brilho do precipitado ao surgir
    this.precAntes = false;

    // ── modo Tampão ──
    this.par = D.TAMPOES[0];
    this.tHA = 0.1;
    this.tA = 0.1;
    this.tVol = 1;
    this.addH = 0; // mol líquido de H⁺ forte adicionado
    // (negativo = OH⁻ adicionado)
    this.histT = []; // histórico [nº de adições, pH tampão, pH água]

    // ── modo Hidrólise ──
    this.hSal = D.SAIS_HIDROLISE[0];
    this.hC = -1;
  }
  build() {
    const D = this.D;
    SIEQ.fillOptGrid('kps-grid', D.SAIS_KPS.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.cor,
      extra: s.kps.toExponential(1),
      aria: `${s.nome}, produto de solubilidade ${s.kps.toExponential(1)}. ${s.desc}`
    })), this.sal.id);
    SIEQ.fillOptGrid('tamp-grid', D.TAMPOES.map(t => ({
      value: t.id,
      nome: t.nome,
      dot: t.cor,
      extra: 'pKa ' + SIEQ.fmt(-Math.log10(t.ka), 2),
      aria: `${t.nome}, pKa ${SIEQ.fmt(-Math.log10(t.ka), 2)}. ${t.uso}`
    })), this.par.id);
    SIEQ.fillOptGrid('hid-grid', D.SAIS_HIDROLISE.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.cor,
      extra: this._hidRotulo(s),
      aria: `${s.nome}, de ${s.origem}. ${s.desc}`
    })), this.hSal.id);
  }

  /** Etiqueta curta do caso de hidrólise, para o cartão do sal. */
  _hidRotulo(s) {
    if (s.catForte && s.aniForte) return 'neutro';
    if (s.catForte && !s.aniForte) return 'básico';
    if (!s.catForte && s.aniForte) return 'ácido';
    return 'fraco+fraco';
  }
  setMode(id) {
    this.modo = id;
    if (id === 'tampao') {
      this.addH = 0;
      this.histT = [];
    }
  }
  setParam(k, v) {
    const D = this.D;
    switch (k) {
      case 'kpsSal':
        {
          this.sal = D.SAIS_KPS.find(s => s.id === v) || this.sal;
          this.precAntes = false;
          return {
            say: `${this.sal.nome}: Kps de ${this.sal.kps.toExponential(2)}. ${this.sal.desc}.`
          };
        }
      case 'kpsCat':
        this.kCat = v;
        return;
      case 'kpsAni':
        this.kAni = v;
        return;
      case 'tampPar':
        {
          this.par = D.TAMPOES.find(t => t.id === v) || this.par;
          this.addH = 0;
          this.histT = [];
          return {
            say: `${this.par.nome}, pKa ${SIEQ.fmt(-Math.log10(this.par.ka), 2)}. ${this.par.uso}.`
          };
        }
      case 'tampHA':
        this.tHA = v;
        this.addH = 0;
        this.histT = [];
        return;
      case 'tampA':
        this.tA = v;
        this.addH = 0;
        this.histT = [];
        return;
      case 'tampVol':
        this.tVol = v;
        this.addH = 0;
        this.histT = [];
        return;
      case 'hidSal':
        {
          this.hSal = D.SAIS_HIDROLISE.find(s => s.id === v) || this.hSal;
          return {
            say: `${this.hSal.nome}, vindo de ${this.hSal.origem}. ${this.hSal.desc}.`
          };
        }
      case 'hidC':
        this.hC = v;
        return;
    }
    return {};
  }
  action(name) {
    if (name === 'kps-status') {
      const r = this._kps();
      const veredito = r.Q > r.kps * 1.02 ? `Q maior que Kps: precipita. Depois de precipitar, sobram ${r.catEq.toExponential(2)} molar de cátion e ${r.aniEq.toExponential(2)} molar de ânion, e o produto volta a valer exatamente o Kps.` : r.Q < r.kps * 0.98 ? 'Q menor que Kps: solução insaturada, nada precipita. Ainda cabe mais sal dissolvido.' : 'Q praticamente igual a Kps: solução exatamente saturada, no limite da precipitação.';
      return SIEQ.announce(`${this.sal.nome}. Produto iônico Q igual a ${r.Q.toExponential(2)}, contra Kps de ${r.kps.toExponential(2)}. ${veredito} Solubilidade molar do sal em água pura: ${r.s.toExponential(2)} molar.`, 'assertive');
    }
    if (name === 'kps-saturar') {
      // coloca os dois íons na concentração da solução saturada em água pura
      const r = this._kps();
      const eCat = Math.log10(Math.max(1e-9, r.s * this.sal.ec[0]));
      const eAni = Math.log10(Math.max(1e-9, r.s * this.sal.ec[1]));
      this.kCat = SIEQ.clamp(eCat, -8, 0);
      this.kAni = SIEQ.clamp(eAni, -8, 0);
      this.app.syncSlider('kps-cat', this.kCat);
      this.app.syncSlider('kps-ani', this.kAni);
      return SIEQ.announce(`Concentrações postas na saturação exata do ${this.sal.nome}: Q agora vale o próprio Kps. Qualquer acréscimo daqui para frente já precipita.`);
    }
    if (name === 'kps-comum') {
      // EFEITO DO ÍON COMUM: só o ânion sobe 10×; o Kps NÃO muda
      this.kAni = SIEQ.clamp(this.kAni + 1, -8, 0);
      this.app.syncSlider('kps-ani', this.kAni);
      const r = this._kps();
      return SIEQ.announce(`Íon comum adicionado: a concentração do ânion subiu dez vezes. O Kps continua o mesmo — ele só depende da temperatura. O que mudou foi Q, que agora vale ${r.Q.toExponential(2)}. ${r.precipita ? 'Resultado: mais sal precipitou, e a solubilidade do sal caiu. É por isso que um sal é menos solúvel numa solução que já contém um de seus íons.' : 'Ainda insaturada — repita para ver a precipitação começar.'}`, 'assertive');
    }
    if (name === 'tamp-acido' || name === 'tamp-base' || name === 'tamp-acido10') {
      const dn = name === 'tamp-base' ? -0.001 : name === 'tamp-acido10' ? 0.010 : 0.001;
      this.addH += dn;
      const r = this._tampao();
      this.histT.push({
        n: this.histT.length + 1,
        pt: r.ph,
        pa: r.phAgua
      });
      if (this.histT.length > 60) this.histT.shift();
      SIEQ.playTone(dn > 0 ? 420 : 700, .08, .05);
      const nome = dn > 0 ? `${SIEQ.fmt(Math.abs(dn) * 1000, 0)} milimol de ácido forte` : '1 milimol de base forte';
      return SIEQ.announce(`${nome} adicionado. No tampão o pH foi para ${SIEQ.fmt(r.ph, 2)}, variação de ${SIEQ.fmt(Math.abs(r.ph - r.ph0), 2)}. Na mesma quantidade de água pura o pH iria para ${SIEQ.fmt(r.phAgua, 2)}. ${r.esgotado ? 'ATENÇÃO: o tampão esgotou — um dos componentes acabou e agora o pH desaba como na água.' : ''}`, 'assertive');
    }
    if (name === 'tamp-reset') {
      this.addH = 0;
      this.histT = [];
      return SIEQ.announce('Tampão reiniciado sem adições.');
    }
    if (name === 'hid-status') {
      const r = this._hidrolise();
      return SIEQ.announce(`${this.hSal.nome}, de ${this.hSal.origem}. Caso: ${r.caso}. pH igual a ${SIEQ.fmt(r.ph, 2)}, ou seja, solução ${r.classe}. ${r.explica}`, 'assertive');
    }
  }

  /* ══════════════ CONTAS — Kps ══════════════ */

  /** Solubilidade molar em água pura, a partir do Kps e da estequiometria.
   *  Para AₐB_b: Kps = (a·s)^a·(b·s)^b = a^a·b^b·s^(a+b)
   *  logo  s = (Kps / (a^a·b^b))^(1/(a+b)).
   *  Sem essa conta, AgCl e CaF₂ pareceriam obedecer à mesma fórmula. */
  _sDe(kps, ec) {
    const [a, b] = ec;
    const fator = Math.pow(a, a) * Math.pow(b, b);
    return Math.pow(kps / fator, 1 / (a + b));
  }
  _kps() {
    const S = this.sal,
      [a, b] = S.ec,
      kps = S.kps;
    const cat0 = Math.pow(10, this.kCat),
      ani0 = Math.pow(10, this.kAni);
    const Q = Math.pow(cat0, a) * Math.pow(ani0, b);
    const precipita = Q > kps * 1.0000001;

    // Se precipita, encontra por BISSEÇÃO quanto sal (x mol/L de formula) sai
    // da solução até o produto voltar exatamente ao Kps. Não há fórmula fechada
    // para o caso geral, e a bisseção resolve qualquer estequiometria.
    let catEq = cat0,
      aniEq = ani0,
      xPrec = 0;
    if (precipita) {
      const f = x => Math.pow(Math.max(0, cat0 - a * x), a) * Math.pow(Math.max(0, ani0 - b * x), b) - kps;
      let lo = 0,
        hi = Math.min(cat0 / a, ani0 / b);
      for (let i = 0; i < 80; i++) {
        const mid = (lo + hi) / 2;
        if (f(mid) > 0) lo = mid;else hi = mid;
      }
      xPrec = (lo + hi) / 2;
      catEq = Math.max(0, cat0 - a * xPrec);
      aniEq = Math.max(0, ani0 - b * xPrec);
    }
    return {
      kps,
      Q,
      precipita,
      cat0,
      ani0,
      catEq,
      aniEq,
      xPrec,
      s: this._sDe(kps, S.ec),
      // razão Q/Kps em escala log: é o que a régua do canvas desenha
      lq: Math.log10(Math.max(1e-45, Q)),
      lk: Math.log10(kps),
      expr: `[${S.cat}]${a > 1 ? SIEQ.SUP[a] : ''} · [${S.ani}]${b > 1 ? SIEQ.SUP[b] : ''}`,
      sExpr: a === 1 && b === 1 ? 's = √Kps' : `s = ${a + b === 3 ? '∛' : a + b === 4 ? '⁴√' : ''}(Kps/${Math.pow(a, a) * Math.pow(b, b)})`
    };
  }

  /* ══════════════ CONTAS — Tampão ══════════════ */

  /** [H⁺] de uma mistura de ácido fraco (HA0) com sua base conjugada (A0).
   *  Resolve o 2º grau  [H⁺]² + (A0 + Ka)[H⁺] − Ka·HA0 = 0, que é exato para
   *  o equilíbrio HA ⇌ H⁺ + A⁻ com a base já presente. Reduz-se a
   *  Henderson-Hasselbalch quando HA0 e A0 são muito maiores que [H⁺] — mas
   *  continua valendo quando não são, que é justamente o caso do tampão
   *  esgotado. */
  _hMistura(ka, HA0, A0) {
    if (HA0 <= 0) return null; // sem ácido: quem manda é a base
    const bq = A0 + ka;
    return (-bq + Math.sqrt(bq * bq + 4 * ka * HA0)) / 2;
  }
  _tampao() {
    const P = this.par,
      Kw = this.D.KW,
      V = this.tVol,
      ka = P.ka;
    const pKa = -Math.log10(ka);

    // mols iniciais e mols depois da adição de ácido/base forte.
    // Ácido forte convertendo A⁻ em HA (e base forte fazendo o contrário) é
    // reação COMPLETA — por isso é subtração direta de mols, não equilíbrio.
    const nHA0 = this.tHA * V,
      nA0 = this.tA * V;
    const n = this.addH;
    const nHA = nHA0 + n,
      nA = nA0 - n;
    const ph0 = this._phDe(this._hMistura(ka, nHA0 / V, nA0 / V), Kw);
    let ph,
      esgotado = false;
    if (nA <= 1e-12) {
      // acabou a base conjugada: o excesso de ácido forte manda na solução
      esgotado = true;
      const excesso = -nA / V;
      const h = excesso > 0 ? excesso : this._hMistura(ka, nHA / V, 0);
      ph = this._phDe(h, Kw);
    } else if (nHA <= 1e-12) {
      // acabou o ácido: excesso de base forte
      esgotado = true;
      const excesso = -nHA / V;
      ph = excesso > 0 ? 14 + Math.log10(excesso) : this._phDe(this._hMistura(ka, 1e-12, nA / V), Kw);
    } else {
      ph = this._phDe(this._hMistura(ka, nHA / V, nA / V), Kw);
    }

    // MESMA adição em ÁGUA PURA — a comparação que dá sentido ao tampão
    let phAgua = 7;
    if (Math.abs(n) > 1e-15) {
      const c = Math.abs(n) / V;
      phAgua = n > 0 ? -Math.log10(c) : 14 + Math.log10(c);
    }

    // capacidade que ainda resta antes de esgotar, dos dois lados
    return {
      ph,
      ph0,
      phAgua,
      esgotado,
      pKa,
      nHA: Math.max(0, nHA),
      nA: Math.max(0, nA),
      nHA0,
      nA0,
      V,
      razao: nHA > 0 ? Math.max(0, nA) / nHA : Infinity,
      dentroFaixa: Math.abs(ph - pKa) <= 1,
      capAcido: Math.max(0, nA0 - Math.max(0, n)) * 1000,
      // mmol de H⁺ ainda absorvíveis
      capBase: Math.max(0, nHA0 + Math.min(0, n)) * 1000,
      // mmol de OH⁻ ainda absorvíveis
      addMmol: n * 1000,
      // variação por milimol adicionado: a medida objetiva do poder tamponante
      poder: Math.abs(n) > 1e-15 ? Math.abs(ph - ph0) / Math.abs(n * 1000) : 0,
      poderAgua: Math.abs(n) > 1e-15 ? Math.abs(phAgua - 7) / Math.abs(n * 1000) : 0
    };
  }
  _phDe(h, Kw) {
    if (h == null || !(h > 0)) return 7;
    // corrige com a autoionização da água em concentrações muito baixas
    const hc = (h + Math.sqrt(h * h + 4 * Kw)) / 2;
    return SIEQ.clamp(-Math.log10(hc), 0, 14);
  }

  /* ══════════════ CONTAS — Hidrólise salina ══════════════ */

  _hidrolise() {
    const S = this.hSal,
      Kw = this.D.KW,
      C = Math.pow(10, this.hC);
    let ph = 7,
      caso,
      classe,
      explica,
      kh = null,
      ion = '—',
      x = 0;
    if (S.catForte && S.aniForte) {
      caso = 'base forte + ácido forte';
      ph = 7;
      classe = 'neutra';
      explica = 'Nenhum dos dois íons reage com a água: o cátion vem de uma base forte e o ânion de um ácido forte, então os dois são péssimos como ácido ou base. A concentração não altera nada aqui — o pH fica em 7 qualquer que seja ela.';
    } else if (S.catForte && !S.aniForte) {
      // ânion hidroliza: A⁻ + H₂O ⇌ HA + OH⁻ , Kb = Kw/Ka
      caso = 'base forte + ácido fraco';
      kh = Kw / S.ka;
      x = (-kh + Math.sqrt(kh * kh + 4 * kh * C)) / 2; // [OH⁻]
      ph = SIEQ.clamp(14 + Math.log10(Math.max(1e-14, x)), 0, 14);
      classe = 'básica';
      ion = S.ani;
      explica = `O ânion ${S.ani} é base conjugada de um ácido fraco, então rouba H⁺ da água e libera OH⁻. A constante de hidrólise é Kh = Kw/Ka = ${kh.toExponential(2)}: quanto mais fraco o ácido de origem, maior esse valor e mais básica a solução.`;
    } else if (!S.catForte && S.aniForte) {
      // cátion hidroliza: BH⁺ ⇌ B + H⁺ , Ka = Kw/Kb
      caso = 'base fraca + ácido forte';
      kh = Kw / S.kb;
      x = (-kh + Math.sqrt(kh * kh + 4 * kh * C)) / 2; // [H⁺]
      ph = SIEQ.clamp(-Math.log10(Math.max(1e-14, x)), 0, 14);
      classe = 'ácida';
      ion = S.cat;
      explica = `O cátion ${S.cat} é ácido conjugado de uma base fraca, então cede H⁺ para a água. Kh = Kw/Kb = ${kh.toExponential(2)}.`;
    } else {
      // os dois hidrolizam: [H⁺] = √(Kw·Ka/Kb) — independe da concentração
      caso = 'base fraca + ácido fraco';
      const h = Math.sqrt(Kw * S.ka / S.kb);
      x = h;
      ph = SIEQ.clamp(-Math.log10(h), 0, 14);
      classe = ph < 6.9 ? 'ácida' : ph > 7.1 ? 'básica' : 'praticamente neutra';
      ion = `${S.cat} e ${S.ani}`;
      explica = `Os dois íons hidrolizam e o resultado é decidido pela comparação entre Ka do ácido (${S.ka.toExponential(1)}) e Kb da base (${S.kb.toExponential(1)}): vence o maior. Aqui [H⁺] = √(Kw·Ka/Kb), expressão que — repare — NÃO depende da concentração do sal.`;
    }
    return {
      ph,
      caso,
      classe,
      explica,
      kh,
      ion,
      C,
      x,
      pOH: 14 - ph,
      h: Math.pow(10, -ph),
      oh: Kw / Math.pow(10, -ph),
      grau: C > 0 && x > 0 ? Math.min(1, x / C) : 0 // grau de hidrólise
    };
  }

  /* ══════════════ DESENHO ══════════════ */

  _corPh(p) {
    const paleta = ['#dc2626', '#ea580c', '#f59e0b', '#facc15', '#a3e635', '#4ade80', '#34d399', '#22d3ee', '#3b82f6', '#6366f1', '#8b5cf6'];
    const t = SIEQ.clamp(p / 14, 0, 1) * (paleta.length - 1);
    const i = Math.floor(t);
    return SIEQ.kMix(paleta[i], paleta[Math.min(paleta.length - 1, i + 1)], t - i);
  }
  update(dt) {
    this.fase += dt;
    if (this.modo === 'kps') {
      const r = this._kps();
      // pulso visual no instante em que a solução PASSA a precipitar
      if (r.precipita && !this.precAntes) {
        this.precFlash = 1;
        SIEQ.playTone(330, .12, .06);
      }
      this.precAntes = r.precipita;
      this.precFlash = Math.max(0, this.precFlash - dt * 1.4);
    }
  }
  draw(ctx, W, H, app) {
    if (this.modo === 'kps') this._dKps(ctx, W, H);else if (this.modo === 'tampao') this._dTampao(ctx, W, H);else this._dHidrolise(ctx, W, H);
  }
  _dKps(ctx, W, H) {
    const r = this._kps(),
      S = this.sal,
      est = SIEQ.isEstreito(W);
    SIEQ.kLabel(ctx, `${S.nome}(s) ⇌ ${S.ec[0] > 1 ? S.ec[0] + ' ' : ''}${S.cat} + ${S.ec[1] > 1 ? S.ec[1] + ' ' : ''}${S.ani}`, W / 2, est ? 22 : 30, {
      size: est ? 12 : 15,
      bold: true,
      color: SIEQ.cssVar('--text-primary'),
      maxW: W - 20
    });
    SIEQ.kLabel(ctx, `Kps = ${r.expr} = ${r.kps.toExponential(2)}   (o sólido não entra)`, W / 2, est ? 40 : 52, {
      size: est ? 9 : 11,
      mono: true,
      color: SIEQ.cssVar('--text-secondary'),
      maxW: W - 20
    });

    // ── béquer com precipitado ──
    const bw = est ? SIEQ.propW(W, .42, 90, 160) : SIEQ.propW(W, .22, 110, 240);
    const bh = est ? Math.min(H * .34, 170) : Math.min(H * .5, 300);
    const bx = est ? W * .27 : W * .18;
    const by = est ? 66 + bh : H * .30 + bh;
    ctx.save();
    ctx.translate(bx, by);
    SIEQ.kBeaker(ctx, 0, -bh, bw, bh, .8, SIEQ.cssVar('--accent-cyan', '#22d3ee'), {
      alpha: .3,
      rotulo: ''
    });
    // camada de precipitado no fundo, proporcional ao quanto precipitou
    if (r.precipita) {
      const fr = SIEQ.clamp(r.xPrec / Math.max(1e-12, Math.max(r.cat0 / S.ec[0], r.ani0 / S.ec[1])), .06, 1);
      const ph2 = Math.max(4, fr * bh * .3);
      ctx.save();
      ctx.fillStyle = S.cor;
      ctx.globalAlpha = .55 + this.precFlash * .45;
      SIEQ.kRound(ctx, -bw / 2 + 4, -ph2 - 3, bw - 8, ph2, 3);
      ctx.fill();
      ctx.restore();
      // grãos caindo, para o precipitado parecer estar se formando
      // respeita quem pediu menos animacao no sistema
      const semMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!semMovimento) {
        ctx.save();
        ctx.fillStyle = S.cor;
        ctx.globalAlpha = .7;
        for (let i = 0; i < 9; i++) {
          const t = (this.fase * .5 + i / 9) % 1;
          const x = -bw / 2 + 10 + i * 37 % Math.max(1, bw - 20);
          ctx.beginPath();
          ctx.arc(x, -bh + t * (bh - ph2 - 6), 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    ctx.restore();
    SIEQ.kChip(ctx, r.precipita ? 'PRECIPITA' : Math.abs(r.Q - r.kps) / r.kps < .02 ? 'saturada' : 'insaturada', bx, by + 20, {
      fg: r.precipita ? SIEQ.cssVar('--accent-exo') : Math.abs(r.Q - r.kps) / r.kps < .02 ? SIEQ.cssVar('--accent-amber') : SIEQ.cssVar('--accent-ok'),
      size: 11,
      bold: true
    });

    // ── régua log de Q contra Kps ──
    const gx = est ? 40 : bx + bw / 2 + W * .06;
    const gy = est ? by + 52 : H * .28;
    const gw = Math.max(160, W - gx - (est ? 30 : 40));
    const lo = Math.min(r.lk, r.lq) - 2,
      hi = Math.max(r.lk, r.lq) + 2;
    const pos = v => gx + SIEQ.clamp((v - lo) / Math.max(.5, hi - lo), 0, 1) * gw;
    ctx.save();
    ctx.strokeStyle = SIEQ.cssVar('--border', '#1c2e44');
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw, gy);
    ctx.stroke();
    ctx.restore();
    // zona de precipitação (à direita do Kps) sombreada
    ctx.save();
    ctx.fillStyle = SIEQ.cssVar('--accent-exo', '#f87171');
    ctx.globalAlpha = .13;
    ctx.fillRect(pos(r.lk), gy - 16, gx + gw - pos(r.lk), 32);
    ctx.restore();
    SIEQ.kLabel(ctx, 'insaturada', (gx + pos(r.lk)) / 2, gy - 26, {
      size: 9,
      color: SIEQ.cssVar('--accent-ok')
    });
    SIEQ.kLabel(ctx, 'precipita', (pos(r.lk) + gx + gw) / 2, gy - 26, {
      size: 9,
      color: SIEQ.cssVar('--accent-exo')
    });
    ctx.save();
    ctx.strokeStyle = SIEQ.cssVar('--accent-ok', '#4ade80');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pos(r.lk), gy - 14);
    ctx.lineTo(pos(r.lk), gy + 14);
    ctx.stroke();
    ctx.restore();
    SIEQ.kChip(ctx, `Kps = ${r.kps.toExponential(1)}`, SIEQ.clamp(pos(r.lk), gx + 50, gx + gw - 50), gy + 32, {
      fg: SIEQ.cssVar('--accent-ok'),
      size: 10,
      bold: true
    });
    const cQ = r.precipita ? SIEQ.cssVar('--accent-exo', '#f87171') : SIEQ.cssVar('--accent-amber', '#fbbf24');
    ctx.save();
    ctx.fillStyle = cQ;
    ctx.beginPath();
    ctx.moveTo(pos(r.lq), gy - 8);
    ctx.lineTo(pos(r.lq) - 8, gy - 22);
    ctx.lineTo(pos(r.lq) + 8, gy - 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    SIEQ.kChip(ctx, `Q = ${r.Q.toExponential(1)}`, SIEQ.clamp(pos(r.lq), gx + 46, gx + gw - 46), gy - 40, {
      fg: cQ,
      size: 11,
      bold: true
    });

    // ── tabela numérica ──
    let ty = gy + 62;
    const linhas = [[`[${S.cat}] inicial`, r.cat0.toExponential(2) + ' mol/L'], [`[${S.ani}] inicial`, r.ani0.toExponential(2) + ' mol/L'], ['Q (produto iônico)', r.Q.toExponential(3)], ['Kps (25 °C)', r.kps.toExponential(3)], ['Solubilidade s em água pura', r.s.toExponential(3) + ' mol/L'], [r.sExpr, S.ec[0] === 1 && S.ec[1] === 1 ? 'estequiometria 1:1' : `coeficientes ${S.ec[0]}:${S.ec[1]}`]];
    if (r.precipita) {
      linhas.push([`[${S.cat}] após precipitar`, r.catEq.toExponential(2) + ' mol/L']);
      linhas.push([`[${S.ani}] após precipitar`, r.aniEq.toExponential(2) + ' mol/L']);
    }
    const tw = Math.min(gw, W - gx - 24);
    const dy = Math.max(14, Math.min(22, (H - ty - 14) / linhas.length));
    linhas.forEach(l => {
      if (ty > H - 8) return;
      SIEQ.kLabel(ctx, l[0], gx, ty, {
        size: 10,
        align: 'left',
        color: SIEQ.cssVar('--text-secondary'),
        maxW: tw * .58
      });
      SIEQ.kLabel(ctx, l[1], gx + tw, ty, {
        size: 10,
        align: 'right',
        mono: true,
        bold: true,
        color: SIEQ.cssVar('--text-primary'),
        maxW: tw * .4
      });
      ty += dy;
    });
  }
  _dTampao(ctx, W, H) {
    const r = this._tampao(),
      P = this.par,
      est = SIEQ.isEstreito(W);
    SIEQ.kLabel(ctx, `${P.ha} ⇌ H⁺ + ${P.a}    ·    pKa = ${SIEQ.fmt(r.pKa, 2)}`, W / 2, est ? 20 : 28, {
      size: est ? 12 : 15,
      bold: true,
      color: SIEQ.cssVar('--text-primary'),
      maxW: W - 20
    });
    SIEQ.kLabel(ctx, `pH = pKa + log([${P.a}]/[${P.ha}]) = ${SIEQ.fmt(r.pKa, 2)} + log(${SIEQ.fmt(r.nA, 4)}/${SIEQ.fmt(r.nHA, 4)})`, W / 2, est ? 36 : 48, {
      size: est ? 9 : 11,
      mono: true,
      color: SIEQ.cssVar('--text-secondary'),
      maxW: W - 16
    });

    // ── dois béqueres: tampão × água pura, MESMA adição ──
    const bw = est ? Math.min(W * .32, 110) : SIEQ.propW(W, .17, 90, 190);
    const bh = est ? Math.min(H * .26, 130) : Math.min(H * .40, 240);
    const yBase = est ? 56 + bh : H * .26 + bh;
    const x1 = est ? W * .27 : W * .21;
    const x2 = est ? W * .73 : W * .43;
    const par = [{
      x: x1,
      ph: r.ph,
      rot: 'TAMPÃO',
      sub: `${P.ha} / ${P.a}`
    }, {
      x: x2,
      ph: r.phAgua,
      rot: 'ÁGUA PURA',
      sub: 'sem tampão'
    }];
    par.forEach(b => {
      ctx.save();
      ctx.translate(b.x, yBase);
      SIEQ.kBeaker(ctx, 0, -bh, bw, bh, .78, this._corPh(b.ph), {
        alpha: .62,
        rotulo: ''
      });
      ctx.restore();
      SIEQ.kLabel(ctx, b.rot, b.x, yBase - bh - 16, {
        size: 10,
        bold: true,
        color: SIEQ.cssVar('--text-secondary'),
        maxW: bw * 1.6
      });
      SIEQ.kLabel(ctx, b.sub, b.x, yBase - bh - 4, {
        size: 9,
        color: SIEQ.cssVar('--text-muted'),
        maxW: bw * 1.7
      });
      SIEQ.kChip(ctx, `pH ${SIEQ.fmt(b.ph, 2)}`, b.x, yBase + 18, {
        fg: this._corPh(b.ph),
        size: est ? 11 : 13,
        bold: true,
        border: this._corPh(b.ph)
      });
    });
    // a variação de cada um desde o início — o número que prova o efeito
    SIEQ.kLabel(ctx, `Δ = ${SIEQ.fmt(Math.abs(r.ph - r.ph0), 2)}`, x1, yBase + 38, {
      size: 10,
      bold: true,
      mono: true,
      color: SIEQ.cssVar('--accent-ok')
    });
    SIEQ.kLabel(ctx, `Δ = ${SIEQ.fmt(Math.abs(r.phAgua - 7), 2)}`, x2, yBase + 38, {
      size: 10,
      bold: true,
      mono: true,
      color: SIEQ.cssVar('--accent-exo')
    });
    if (r.esgotado) {
      SIEQ.kChipIcon(ctx, SIEQ.kIconWarning, 'TAMPÃO ESGOTADO — um dos componentes acabou', W / 2, yBase + 60, {
        fg: SIEQ.cssVar('--accent-exo'),
        size: 11,
        bold: true,
        border: SIEQ.cssVar('--accent-exo')
      });
    }

    // ── gráfico: pH × adições, as duas curvas sobrepostas ──
    const gx = est ? 44 : Math.max(x2 + bw / 2 + 30, W * .56);
    const gy = est ? yBase + 82 : H * .18;
    const gw = Math.max(140, W - gx - (est ? 26 : 34));
    const gh = est ? Math.max(90, H - gy - 40) : Math.min(H * .56, 300);
    if (gw > 130 && gh > 80) {
      const nmax = Math.max(8, this.histT.length);
      const A = SIEQ.kAxes(ctx, {
        x: gx,
        y: gy,
        w: gw,
        h: gh,
        xmin: 0,
        xmax: nmax,
        ymin: 0,
        ymax: 14,
        xticks: [],
        yticks: [0, 2, 4, 7, 10, 12, 14],
        xlab: 'adições de ácido/base forte',
        ylab: 'pH'
      });
      // faixa útil de tamponamento: pKa ± 1
      ctx.save();
      ctx.fillStyle = SIEQ.cssVar('--accent-ok', '#4ade80');
      ctx.globalAlpha = .12;
      ctx.fillRect(A.px(0), A.py(Math.min(14, r.pKa + 1)), gw, A.py(Math.max(0, r.pKa - 1)) - A.py(Math.min(14, r.pKa + 1)));
      ctx.restore();
      SIEQ.kLabel(ctx, 'faixa útil: pKa ± 1', A.px(0) + 6, A.py(r.pKa), {
        size: 9,
        align: 'left',
        color: SIEQ.cssVar('--accent-ok')
      });
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = SIEQ.cssVar('--accent-ok');
      ctx.beginPath();
      ctx.moveTo(A.px(0), A.py(r.pKa));
      ctx.lineTo(A.px(nmax), A.py(r.pKa));
      ctx.stroke();
      ctx.restore();
      if (this.histT.length > 1) {
        SIEQ.kLine(ctx, this.histT.map(h => [h.n, h.pt]), A.px, A.py, {
          color: SIEQ.cssVar('--accent-ok', '#4ade80'),
          w: 2.6
        });
        SIEQ.kLine(ctx, this.histT.map(h => [h.n, h.pa]), A.px, A.py, {
          color: SIEQ.cssVar('--accent-exo', '#f87171'),
          w: 2.2,
          dash: [5, 4]
        });
      }
      SIEQ.kChip(ctx, 'tampão', A.px(nmax * .18), gy + 14, {
        fg: SIEQ.cssVar('--accent-ok'),
        size: 9
      });
      SIEQ.kChip(ctx, 'água pura', A.px(nmax * .62), gy + 14, {
        fg: SIEQ.cssVar('--accent-exo'),
        size: 9
      });
      if (this.histT.length < 2) {
        SIEQ.kLabel(ctx, 'Adicione ácido ou base para traçar as duas curvas.', gx + gw / 2, gy + gh / 2, {
          size: 11,
          color: SIEQ.cssVar('--text-muted'),
          maxW: gw - 16
        });
      }
    }
  }
  _dHidrolise(ctx, W, H) {
    const r = this._hidrolise(),
      S = this.hSal,
      est = SIEQ.isEstreito(W);
    SIEQ.kLabel(ctx, `${S.nome} em água`, W / 2, est ? 20 : 28, {
      size: est ? 13 : 16,
      bold: true,
      color: SIEQ.cssVar('--text-primary')
    });
    SIEQ.kLabel(ctx, S.origem, W / 2, est ? 36 : 48, {
      size: est ? 9 : 11,
      color: SIEQ.cssVar('--text-secondary'),
      maxW: W - 20
    });

    // ── béquer colorido pelo pH ──
    const bw = est ? Math.min(W * .40, 130) : SIEQ.propW(W, .19, 100, 210);
    const bh = est ? Math.min(H * .28, 140) : Math.min(H * .42, 250);
    const bx = est ? W / 2 : W * .22;
    const yBase = est ? 56 + bh : H * .28 + bh;
    ctx.save();
    ctx.translate(bx, yBase);
    SIEQ.kBeaker(ctx, 0, -bh, bw, bh, .78, this._corPh(r.ph), {
      alpha: .62,
      rotulo: ''
    });
    // íons hidrolizando: os que reagem piscam, os espectadores ficam apagados
    const total = 20,
      nAtivos = Math.round(SIEQ.clamp(r.grau * 60, 0, 1) * total);
    for (let i = 0; i < total; i++) {
      const a = i * 2.399 + this.fase * .3;
      const x = Math.cos(a) * (bw * .3),
        y = -bh * .5 + Math.sin(a * 1.4) * (bh * .25);
      const ativo = i < Math.max(1, nAtivos);
      ctx.fillStyle = ativo ? SIEQ.cssVar('--accent-main', '#f472b6') : SIEQ.cssVar('--text-muted', '#64748b');
      ctx.globalAlpha = ativo ? .95 : .4;
      ctx.beginPath();
      ctx.arc(x, y, ativo ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    SIEQ.kChip(ctx, `pH ${SIEQ.fmt(r.ph, 2)} · ${r.classe}`, bx, yBase + 20, {
      fg: this._corPh(r.ph),
      size: est ? 11 : 13,
      bold: true,
      border: this._corPh(r.ph)
    });

    // ── mini-escala de pH com o ponto marcado ──
    const sx = est ? 30 : bx + bw / 2 + W * .05;
    const sw = Math.max(150, est ? W - 60 : W - sx - 40);
    const sy = est ? yBase + 52 : H * .22;
    const g = ctx.createLinearGradient(sx, 0, sx + sw, 0);
    for (let i = 0; i <= 14; i++) g.addColorStop(i / 14, this._corPh(i));
    ctx.save();
    SIEQ.kRound(ctx, sx, sy, sw, 22, 5);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = SIEQ.cssVar('--border');
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    [0, 7, 14].forEach(v => SIEQ.kLabel(ctx, String(v), sx + v / 14 * sw, sy + 32, {
      size: 9,
      mono: true,
      color: SIEQ.cssVar('--text-muted')
    }));
    const mx = sx + r.ph / 14 * sw;
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(mx, sy - 5);
    ctx.lineTo(mx, sy + 27);
    ctx.stroke();
    ctx.restore();
    // referência do neutro, para o desvio ser visível
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = SIEQ.cssVar('--text-muted');
    ctx.beginPath();
    ctx.moveTo(sx + sw / 2, sy - 10);
    ctx.lineTo(sx + sw / 2, sy + 30);
    ctx.stroke();
    ctx.restore();

    // ── equação da hidrólise e números ──
    let ty = sy + 54;
    const eq = S.catForte && S.aniForte ? 'nenhum íon reage com a água' : S.catForte && !S.aniForte ? `${S.ani} + H₂O  ⇌  ${S.ani.replace('⁻', '')}H + OH⁻` : !S.catForte && S.aniForte ? `${S.cat} + H₂O  ⇌  ${S.cat.replace('⁺', '')} + H₃O⁺` : `${S.cat} e ${S.ani} hidrolizam ao mesmo tempo`;
    SIEQ.kLabel(ctx, eq, sx, ty, {
      size: est ? 10 : 12,
      align: 'left',
      bold: true,
      color: SIEQ.cssVar('--accent-main'),
      maxW: sw
    });
    ty += 22;
    const linhas = [['Caso', r.caso], ['Íon que hidroliza', r.ion], ['Concentração do sal', r.C.toExponential(2) + ' mol/L'], ['Kh = Kw/K', r.kh == null ? 'não se aplica' : r.kh.toExponential(3)], ['[H₃O⁺]', r.h.toExponential(2) + ' mol/L'], ['[OH⁻]', r.oh.toExponential(2) + ' mol/L'], ['pH · pOH', `${SIEQ.fmt(r.ph, 2)} · ${SIEQ.fmt(r.pOH, 2)}`], ['Grau de hidrólise', r.kh == null ? '—' : SIEQ.fmt(r.grau * 100, 3) + ' %']];
    const dy = Math.max(14, Math.min(22, (H - ty - 12) / linhas.length));
    linhas.forEach(l => {
      if (ty > H - 8) return;
      SIEQ.kLabel(ctx, l[0], sx, ty, {
        size: 10,
        align: 'left',
        color: SIEQ.cssVar('--text-secondary'),
        maxW: sw * .52
      });
      SIEQ.kLabel(ctx, l[1], sx + sw, ty, {
        size: 10,
        align: 'right',
        mono: true,
        bold: true,
        color: SIEQ.cssVar('--text-primary'),
        maxW: sw * .46
      });
      ty += dy;
    });
  }

  /* ══════════════ RESULTADOS ══════════════ */

  getResults() {
    if (this.modo === 'kps') {
      const r = this._kps(),
        S = this.sal;
      const rows = [{
        l: 'Sal',
        v: S.nome
      }, {
        l: 'Dissociação',
        v: `${S.nome}(s) ⇌ ${S.ec[0] > 1 ? S.ec[0] + ' ' : ''}${S.cat} + ${S.ec[1] > 1 ? S.ec[1] + ' ' : ''}${S.ani}`
      }, {
        l: 'Expressão de Kps',
        v: r.expr
      }, {
        l: 'Kps (25 °C)',
        v: r.kps.toExponential(3),
        cls: 'val-ok'
      }, {
        l: `[${S.cat}]`,
        v: r.cat0.toExponential(3) + ' mol/L'
      }, {
        l: `[${S.ani}]`,
        v: r.ani0.toExponential(3) + ' mol/L'
      }, {
        l: 'Q (produto iônico)',
        v: r.Q.toExponential(3),
        cls: r.precipita ? 'val-exo' : 'val-endo'
      }, {
        l: 'Veredito',
        v: r.precipita ? 'Q > Kps: PRECIPITA' : Math.abs(r.Q - r.kps) / r.kps < .02 ? 'Q = Kps: saturada' : 'Q < Kps: insaturada',
        cls: r.precipita ? 'val-exo' : 'val-ok'
      }, {
        l: 'Solubilidade molar s',
        v: r.s.toExponential(3) + ' mol/L'
      }, {
        l: 'Como s sai do Kps',
        v: r.sExpr
      }];
      if (r.precipita) {
        rows.push({
          l: 'Precipitou',
          v: r.xPrec.toExponential(3) + ' mol/L de sal',
          cls: 'val-exo'
        });
        rows.push({
          l: `[${S.cat}] no equilíbrio`,
          v: r.catEq.toExponential(3) + ' mol/L'
        });
        rows.push({
          l: `[${S.ani}] no equilíbrio`,
          v: r.aniEq.toExponential(3) + ' mol/L'
        });
        rows.push({
          l: 'Q após precipitar',
          v: 'volta a valer o Kps',
          cls: 'val-ok'
        });
      }
      rows.push({
        l: 'Aplicação',
        v: S.desc
      });
      return rows;
    }
    if (this.modo === 'tampao') {
      const r = this._tampao(),
        P = this.par;
      return [{
        l: 'Par tampão',
        v: `${P.ha} / ${P.a}`
      }, {
        l: 'Ka',
        v: P.ka.toExponential(2)
      }, {
        l: 'pKa',
        v: SIEQ.fmt(r.pKa, 2),
        cls: 'val-ok'
      }, {
        l: 'Volume',
        v: SIEQ.fmt(r.V, 1) + ' L'
      }, {
        l: `n(${P.ha}) atual`,
        v: SIEQ.fmt(r.nHA * 1000, 2) + ' mmol'
      }, {
        l: `n(${P.a}) atual`,
        v: SIEQ.fmt(r.nA * 1000, 2) + ' mmol'
      }, {
        l: 'Razão [A⁻]/[HA]',
        v: isFinite(r.razao) ? SIEQ.fmt(r.razao, 3) : '∞'
      }, {
        l: 'pH do tampão',
        v: SIEQ.fmt(r.ph, 3),
        cls: 'val-ok'
      }, {
        l: 'pH inicial (sem adição)',
        v: SIEQ.fmt(r.ph0, 3)
      }, {
        l: 'Variação no tampão',
        v: SIEQ.fmt(Math.abs(r.ph - r.ph0), 3) + ' unidade(s)',
        cls: 'val-ok'
      }, {
        l: 'pH da água pura',
        v: SIEQ.fmt(r.phAgua, 3),
        cls: 'val-exo'
      }, {
        l: 'Variação na água',
        v: SIEQ.fmt(Math.abs(r.phAgua - 7), 3) + ' unidade(s)',
        cls: 'val-exo'
      }, {
        l: 'Total adicionado',
        v: `${SIEQ.fmt(r.addMmol, 2)} mmol de ${r.addMmol >= 0 ? 'H⁺' : 'OH⁻'}`
      }, {
        l: 'Ainda absorve de H⁺',
        v: SIEQ.fmt(r.capAcido, 2) + ' mmol'
      }, {
        l: 'Ainda absorve de OH⁻',
        v: SIEQ.fmt(r.capBase, 2) + ' mmol'
      }, {
        l: 'Dentro da faixa útil?',
        v: r.dentroFaixa ? 'sim (pKa ± 1)' : 'não — fora de pKa ± 1',
        cls: r.dentroFaixa ? 'val-ok' : 'val-exo'
      }, {
        l: 'Estado',
        v: r.esgotado ? 'ESGOTADO' : 'tamponando',
        cls: r.esgotado ? 'val-exo' : 'val-ok'
      }, {
        l: 'Onde isso aparece',
        v: P.uso
      }];
    }
    const r = this._hidrolise(),
      S = this.hSal;
    return [{
      l: 'Sal',
      v: S.nome
    }, {
      l: 'Origem',
      v: S.origem
    }, {
      l: 'Caso de hidrólise',
      v: r.caso,
      cls: 'val-ok'
    }, {
      l: 'Íon que hidroliza',
      v: r.ion
    }, {
      l: 'Concentração',
      v: r.C.toExponential(3) + ' mol/L'
    }, {
      l: 'Kw (25 °C)',
      v: '1,0·10⁻¹⁴'
    }, {
      l: 'Kh = Kw/K',
      v: r.kh == null ? 'não se aplica (nenhum íon hidroliza)' : r.kh.toExponential(3)
    }, {
      l: '[H₃O⁺]',
      v: r.h.toExponential(3) + ' mol/L',
      cls: 'val-exo'
    }, {
      l: '[OH⁻]',
      v: r.oh.toExponential(3) + ' mol/L',
      cls: 'val-endo'
    }, {
      l: 'pH',
      v: SIEQ.fmt(r.ph, 3),
      cls: 'val-ok'
    }, {
      l: 'pOH',
      v: SIEQ.fmt(r.pOH, 3)
    }, {
      l: 'Caráter',
      v: r.classe,
      cls: 'val-ok'
    }, {
      l: 'Grau de hidrólise',
      v: r.kh == null ? '—' : SIEQ.fmt(r.grau * 100, 4) + ' %'
    }, {
      l: 'Por quê',
      v: r.explica
    }];
  }
  getOverlay() {
    if (this.modo === 'kps') {
      const r = this._kps();
      return `${this.sal.nome} · ${r.precipita ? 'precipita' : 'insaturada'}`;
    }
    if (this.modo === 'tampao') {
      const r = this._tampao();
      return `tampão pH ${SIEQ.fmt(r.ph, 2)} · água pH ${SIEQ.fmt(r.phAgua, 2)}`;
    }
    const r = this._hidrolise();
    return `${this.hSal.nome} · pH ${SIEQ.fmt(r.ph, 2)} (${r.classe})`;
  }
  onArrow(dx) {
    if (!dx) return false;
    if (this.modo === 'kps') {
      this.kAni = SIEQ.clamp(this.kAni + dx * .1, -8, 0);
      this.app.syncSlider('kps-ani', this.kAni);
      return true;
    }
    if (this.modo === 'hidrolise') {
      this.hC = SIEQ.clamp(this.hC + dx * .05, -3, 0);
      this.app.syncSlider('hid-c', this.hC);
      return true;
    }
    return false;
  }
};
// D.MECH_B (no arquivo de dados) lista os ids de modo atendidos pela
// segunda mecânica; todos os demais vão para a primeira. O App
// conversa apenas com esta classe, exatamente como num simulador de
// mecânica única — cada mecânica interna permanece intocada.
// ══════════════════════════════════════════════════════════════════
SIEQ.Mech = class Mech {
  constructor(D) {
    this.D = D;
    this.a = new SIEQ.MechA(D);
    this.b = new SIEQ.MechB(D);
    this.c = new SIEQ.MechC(D); // Kps, tampao e hidrolise
    this._bSet = new Set(D.MECH_B || []);
    this._cSet = new Set(D.MECH_C || []);
    this.cur = this.a;
  }
  set app(v) {
    this._app = v;
    this.a.app = v;
    this.b.app = v;
    this.c.app = v;
  }
  get app() {
    return this._app;
  }
  build(app) {
    if (typeof this.a.build === 'function') this.a.build(app);
    if (typeof this.b.build === 'function') this.b.build(app);
    if (typeof this.c.build === 'function') this.c.build(app);
  }
  setMode(id) {
    this.cur = this._cSet.has(id) ? this.c : this._bSet.has(id) ? this.b : this.a;
    this.cur.setMode(id);
  }
  setParam(k, v) {
    return this.cur.setParam(k, v);
  }
  action(n, el) {
    return this.cur.action(n, el);
  }
  update(dt, app) {
    this.cur.update(dt, app);
  }
  draw(ctx, W, H, app) {
    this.cur.draw(ctx, W, H, app);
  }
  getResults() {
    return this.cur.getResults();
  }
  getOverlay() {
    return this.cur.getOverlay ? this.cur.getOverlay() : '';
  }
  onArrow(dx, dy) {
    return this.cur.onArrow ? this.cur.onArrow(dx, dy) : false;
  }
  onDrag(dx, dy) {
    if (this.cur.onDrag) this.cur.onDrag(dx, dy);
  }
};