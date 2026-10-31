// ══════════════════════════════════════════════════════════════════
// MECÂNICA — Soluções (SISOL)
// Preparo: C = m/V e M = C/MM com limite de solubilidade a 25 °C
// (excesso → corpo de fundo). Diluição: C₁V₁ = C₂V₂ (massa de soluto
// conservada). Mistura (mesmo soluto): C_f = (C₁V₁+C₂V₂)/(V₁+V₂).
// Curvas: interpolação linear nas tabelas reais (dados no arquivo de
// dados) — abaixo da curva insaturada, sobre a curva saturada, acima
// corpo de fundo.
// As Propriedades Coligativas (pressão de vapor, Raoult, ebulioscopia/
// crioscopia, osmose, Henry) que viviam aqui como uma segunda mecânica
// ("MechB") viraram o simulador SIPC — ver segundoano/coligativas/.
// ══════════════════════════════════════════════════════════════════
SISOL.Mech = class Mech {
  constructor(D) {
    this.D = D;
    this.mode = 'preparo';
    this.mix = {
      item: D.MISTURAS[0],
      resposta: null,
      acertos: 0,
      tentativas: 0,
      feedback: null,
      particulas: [],
      lente: false
    };
    this.prep = {
      sol: D.SOLUTOS[0],
      massa: 30,
      vol: 250,
      temp: 25,
      p: 0,
      dissolving: false,
      done: false,
      erro: 0,
      part: []
    };
    this.dil = {
      op: 'diluir',
      c1: 1.2,
      v1: 200,
      vagua: 200,
      c2: .4,
      v2: 200,
      q: 0,
      running: false,
      done: false,
      droplets: [],
      ripples: [],
      droplets2: [],
      ripples2: []
    };
    this.cur = {
      sal: D.SOLUBILIDADE[0],
      T: 20,
      m: 60,
      resposta: null,
      acertos: 0,
      tentativas: 0,
      feedback: null,
      zoom: false
    };
    this.fase = 0;
  }
  build() {
    SISOL.fillOptGrid('mix-grid', this.D.MISTURAS.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.dot || s.cor
    })), this.mix.item.id);
    SISOL.fillOptGrid('preparo-grid', this.D.SOLUTOS.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.dot,
      extra: `${SISOL.fmt(s.M, 2)} g/mol`,
      aria: `${s.nome}, massa molar ${SISOL.fmt(s.M, 2)} gramas por mol`
    })), this.prep.sol.id);
    SISOL.fillOptGrid('curvas-grid', this.D.SOLUBILIDADE.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.cor,
      extra: s.g[10] > s.g[0] + 2 ? '↑ com T' : s.g[10] < s.g[0] - 2 ? '↓ com T' : '≈ estável'
    })), this.cur.sal.id);
    this._syncPrepMassaMax();
    this._initMixParticulas();
  }

  /** (Re)popula as partículas visuais da mistura selecionada, com posições
   *  iniciais espalhadas — a física de sedimentação/Browniano acontece no
   *  update(). */
  _initMixParticulas() {
    const item = this.mix.item;
    const n = item.tipo === 'solucao' ? 0 : item.tipo === 'coloide' ? 26 : 16;
    this.mix.particulas = Array.from({
      length: n
    }, (_, i) => ({
      x: Math.sin(i * 12.9) * .5 + .5,
      y: (Math.cos(i * 7.3) * .5 + .5) * .7,
      assentada: false
    }));
  }

  /** Solubilidade do soluto do PREPARO na temperatura atual (interpolada
   *  na mesma curva de 11 pontos usada no modo Curvas). */
  _solTPrep() {
    const c = this.prep.sol.curva;
    return SISOL.kInterp(c.map((y, i) => [i * 10, y]), this.prep.temp);
  }

  /** O limite de solubilidade depende do soluto, do volume E AGORA TAMBÉM
   *  da temperatura ao mesmo tempo (limite = sol(T) · vol / 100) — por
   *  isso o teto do slider de massa é recalculado sempre que qualquer um
   *  dos três mudar, e não fica travado num valor fixo. */
  _syncPrepMassaMax() {
    const P = this.prep;
    const limite = this._solTPrep() * P.vol / 100;
    const novoMax = Math.max(60, Math.ceil(limite * 1.8 / 10) * 10);
    const inp = document.getElementById('prep-massa');
    if (inp && Number(inp.max) !== novoMax) {
      inp.max = novoMax;
      if (P.massa > novoMax) {
        P.massa = novoMax;
        this.app.syncSlider('prep-massa', novoMax);
      }
    }
  }
  setMode(id) {
    this.mode = id;
  }
  setParam(k, v) {
    const P = this.prep,
      L = this.dil,
      C = this.cur,
      X = this.mix;
    switch (k) {
      case 'mixItem':
        {
          X.item = this.D.MISTURAS.find(s => s.id === v);
          X.resposta = null;
          X.feedback = null;
          this._initMixParticulas();
          return {
            say: `Observando: ${X.item.nome}. Repare no feixe de luz e se as partículas sedimentam.`
          };
        }
      case 'soluto':
        {
          P.sol = this.D.SOLUTOS.find(s => s.id === v);
          P.p = 0;
          P.done = false;
          P.part.length = 0;
          this._syncPrepMassaMax();
          return {
            say: `${P.sol.nome} selecionado. Solubilidade a ${SISOL.fmt(P.temp, 0)} graus: ${SISOL.fmt(this._solTPrep(), 1)} gramas por 100 gramas de água.`
          };
        }
      case 'massa':
        P.massa = v;
        P.done = false;
        return;
      case 'vol':
        P.vol = v;
        P.done = false;
        this._syncPrepMassaMax();
        return;
      case 'temp':
        {
          P.temp = v;
          P.done = false;
          this._syncPrepMassaMax();
          return {
            say: `Temperatura ajustada para ${SISOL.fmt(v, 0)} graus. Nova solubilidade: ${SISOL.fmt(this._solTPrep(), 1)} gramas por 100 gramas de água.`
          };
        }
      case 'op':
        {
          L.op = v;
          L.q = 0;
          L.done = false;
          document.getElementById('row-dil-agua').hidden = v !== 'diluir';
          document.getElementById('row-dil-c2').hidden = v !== 'misturar';
          return {
            say: v === 'diluir' ? 'Operação: diluir com água pela torneira.' : 'Operação: misturar duas soluções de KMnO₄ pelas torneiras.'
          };
        }
      case 'c1':
        L.c1 = v;
        L.q = 0;
        return;
      case 'v1':
        L.v1 = v;
        L.q = 0;
        return;
      case 'vagua':
        L.vagua = v;
        L.q = 0;
        return;
      case 'c2':
        L.c2 = v;
        L.q = 0;
        return;
      case 'v2':
        L.v2 = v;
        L.q = 0;
        return;
      case 'sal':
        {
          C.sal = this.D.SOLUBILIDADE.find(s => s.id === v);
          C.resposta = null;
          C.feedback = null;
          const maxSal = Math.max(...C.sal.g);
          const novoMax = maxSal > 230 ? Math.ceil(maxSal * 1.15 / 50) * 50 : 250;
          const inpMassa = document.getElementById('cur-massa');
          if (inpMassa && Number(inpMassa.max) !== novoMax) {
            inpMassa.max = novoMax;
            if (C.m > novoMax) {
              C.m = novoMax;
              this.app.syncSlider('cur-massa', novoMax);
            }
          }
          return {
            say: `${C.sal.nome} selecionado. Solubilidade a ${SISOL.fmt(C.T, 0)} graus: ${SISOL.fmt(this._solT(), 1)} gramas por 100 gramas de água. Compare com a massa escolhida.`
          };
        }
      case 't':
        C.T = v;
        C.resposta = null;
        return;
      case 'mcur':
        C.m = v;
        C.resposta = null;
        return;
    }
  }
  action(name) {
    const P = this.prep,
      L = this.dil,
      C = this.cur,
      X = this.mix;
    if (name === 'dica-mix') {
      SISOL.announce('Dica: se o feixe de luz não aparece, é solução. Se aparece mas nada sedimenta, é colóide. Se sedimenta com o tempo, é suspensão.');
    } else if (name === 'toggle-lente') {
      X.lente = !X.lente;
      SISOL.announce(X.lente ? 'Lente de observação ligada.' : 'Lente de observação desligada.');
    } else if (name === 'resp-solucao' || name === 'resp-coloide' || name === 'resp-suspensao') {
      const mapa = {
        'resp-solucao': 'solucao',
        'resp-coloide': 'coloide',
        'resp-suspensao': 'suspensao'
      };
      const nomes = {
        solucao: 'solução verdadeira',
        coloide: 'colóide',
        suspensao: 'suspensão'
      };
      const escolha = mapa[name],
        certo = escolha === X.item.tipo;
      X.tentativas++;
      if (certo) X.acertos++;
      X.resposta = escolha;
      X.feedback = {
        ok: certo,
        t: this.fase
      };
      SISOL.playTone(certo ? 880 : 300, .12, .07);
      SISOL.announce(certo ? `Certo! ${X.item.nome} é ${nomes[X.item.tipo]} — ${X.item.contexto}` : `Não foi dessa vez — ${X.item.nome} é, na verdade, ${nomes[X.item.tipo]}. ${X.item.contexto}`, 'assertive');
    } else if (name === 'dissolver') {
      P.p = 0;
      P.done = false;
      P.dissolving = true;
      // margem de erro experimental (±3%), como aconteceria com vidraria e
      // balança reais — sorteada de novo a cada tentativa de dissolução
      P.erro = (Math.random() * 2 - 1) * 0.03;
      if (SISOL.isReduced()) P.p = 1;
      SISOL.playTone(700, .08, .06);
      SISOL.announce(`Dissolvendo ${SISOL.fmt(P.massa, 0)} gramas de ${P.sol.nome} em ${SISOL.fmt(P.vol, 0)} mililitros de água a ${SISOL.fmt(P.temp, 0)} graus.`);
    } else if (name === 'prep-reset') {
      P.massa = 30;
      P.vol = 250;
      P.temp = 25;
      P.p = 0;
      P.done = false;
      P.dissolving = false;
      P.erro = 0;
      P.part.length = 0;
      this.app.syncSlider('prep-massa', 30);
      this.app.syncSlider('prep-vol', 250);
      this.app.syncSlider('prep-temp', 25);
      this._syncPrepMassaMax();
      SISOL.playTone(440, .07, .05);
      SISOL.announce('Preparo reiniciado: 30 gramas em 250 mililitros, 25 graus — resultados zerados.');
    } else if (name === 'aplicar') {
      L.q = 0;
      L.done = false;
      L.running = true;
      if (SISOL.isReduced()) L.q = 1;
      SISOL.playTone(700, .08, .06);
      SISOL.announce(L.op === 'diluir' ? 'Torneiras abertas: solução e água escoando para o béquer maior.' : 'Torneiras abertas: as duas soluções escoando para o béquer maior.');
    } else if (name === 'dil-reset') {
      Object.assign(L, {
        c1: 1.2,
        v1: 200,
        vagua: 200,
        c2: .4,
        v2: 200,
        q: 0,
        running: false,
        done: false
      });
      L.droplets.length = 0;
      L.ripples.length = 0;
      L.droplets2.length = 0;
      L.ripples2.length = 0;
      ['dil-c1', 'dil-v1', 'dil-vagua', 'dil-c2', 'dil-v2'].forEach((id, i) => this.app.syncSlider(id, [1.2, 200, 200, .4, 200][i]));
      SISOL.playTone(440, .07, .05);
      SISOL.announce('Diluição reiniciada.');
    } else if (name === 'dica') {
      SISOL.announce('Dica: compare a linha pontilhada (massa escolhida) com a altura da curva na temperatura marcada — está acima, sobre, ou abaixo dela?');
    } else if (name === 'toggle-zoom-curvas') {
      C.zoom = !C.zoom;
      SISOL.announce(C.zoom ? 'Lente de perto ligada.' : 'Lente de perto desligada.');
    } else if (name === 'resp-insat' || name === 'resp-sat' || name === 'resp-corpo') {
      const mapa = {
        'resp-insat': 'insat',
        'resp-sat': 'sat',
        'resp-corpo': 'corpo'
      };
      const nomes = {
        insat: 'insaturada',
        sat: 'saturada',
        corpo: 'com corpo de fundo'
      };
      const escolha = mapa[name],
        r = this._classe(),
        certo = escolha === r.tipo;
      C.tentativas++;
      if (certo) C.acertos++;
      C.resposta = escolha;
      C.feedback = {
        ok: certo,
        t: this.fase
      };
      SISOL.playTone(certo ? 880 : 300, .12, .07);
      SISOL.announce(certo ? `Certo! A solução está ${r.nome}. ${r.det}` : `Não foi dessa vez — na verdade está ${nomes[r.tipo]}. ${r.det}`, 'assertive');
    }
  }

  /* ── contas ── */
  _prepCalc() {
    const P = this.prep,
      e = SISOL.easeIO(SISOL.clamp(P.p, 0, 1));
    const limite = this._solTPrep() * P.vol / 100; // g dissolvíveis nesse volume E temperatura
    const dissMax = Math.min(P.massa, limite);
    const diss = dissMax * e;
    const corpo = P.massa - diss;
    const VL = P.vol / 1000;
    const err = 1 + (P.erro || 0);
    const C = diss / VL,
      M = C / P.sol.M;

    // ── UNIDADES QUE FALTAVAM ──
    // O simulador tinha C (g/L), M (mol/L), W (mol/kg) e fração molar, mas nao
    // titulo, porcentagem em massa nem ppm — conversoes cobradas em prova, e
    // que sao apenas contas sobre dados que ja estavam todos aqui.
    //
    // A massa de SOLUCAO e a soma do soluto dissolvido com a do solvente. A
    // agua e aproximada por 1,00 g/mL (densidade a 25 °C = 0,997), aproximacao
    // padrao em exercicio de ensino medio; o desvio e de 0,3 %.
    const mSolvente = P.vol * 1.0; // g de agua
    const mSolucao = mSolvente + diss; // g de solucao
    const titulo = mSolucao > 0 ? diss / mSolucao : 0; // adimensional
    const ppm = titulo * 1e6; // mg de soluto por kg de solucao
    // densidade da solucao: sobe com o soluto dissolvido, porque a massa cresce
    // e o volume, nesta aproximacao, nao
    const dSolucao = P.vol > 0 ? mSolucao / P.vol : 1; // g/mL
    // molalidade: mol de soluto por QUILO de solvente (nao de solucao)
    const molalidade = mSolvente > 0 ? diss / P.sol.M / (mSolvente / 1000) : 0;
    return {
      limite,
      dissMax,
      diss,
      corpo,
      Cnom: P.massa / VL,
      C,
      Cexp: C * err,
      M,
      Mexp: M * err,
      satFrac: limite > 0 ? diss / limite : 0,
      mSolvente,
      mSolucao,
      titulo,
      pct: titulo * 100,
      ppm,
      dSolucao,
      molalidade,
      nMol: diss / P.sol.M
    };
  }
  _dilCalc() {
    const L = this.dil,
      e = SISOL.easeIO(SISOL.clamp(L.q, 0, 1));
    if (L.op === 'diluir') {
      const V2 = L.v1 + L.vagua,
        C2 = L.c1 * L.v1 / V2;
      return {
        e,
        V2,
        C2,
        Cnow: L.c1 * L.v1 / (L.v1 + L.vagua * e),
        Vnow: L.v1 + L.vagua * e,
        fator: V2 / L.v1
      };
    }
    const Vf = L.v1 + L.v2,
      Cf = (L.c1 * L.v1 + L.c2 * L.v2) / Vf;
    return {
      e,
      Vf,
      Cf,
      m1: L.c1 * L.v1 / 1000,
      m2: L.c2 * L.v2 / 1000
    };
  }
  _solT() {
    const g = this.cur.sal.g;
    return SISOL.kInterp(g.map((y, i) => [i * 10, y]), this.cur.T);
  }
  _classe() {
    const s = this._solT(),
      m = this.cur.m,
      d = m - s;
    if (d > 0.5) return {
      tipo: 'corpo',
      nome: 'saturada com corpo de fundo',
      det: `Excesso não dissolvido: ${SISOL.fmt(d, 1)} g.`
    };
    if (d >= -0.5) return {
      tipo: 'sat',
      nome: 'saturada',
      det: 'A massa coincide com o coeficiente de solubilidade.'
    };
    return {
      tipo: 'insat',
      nome: 'insaturada',
      det: `Ainda cabem ${SISOL.fmt(-d, 1)} g até saturar.`
    };
  }
  update(dt) {
    const P = this.prep,
      L = this.dil;
    this.fase += dt;
    // sedimentação real das partículas de uma SUSPENSÃO (colóides e soluções
    // não sedimentam — colóide só balança com o movimento Browniano, feito
    // direto no desenho; solução não tem partículas visíveis)
    if (this.mix.item.tipo === 'suspensao') {
      this.mix.particulas.forEach(p => {
        if (!p.assentada) {
          p.y += dt * 0.12;
          if (p.y >= 0.92) {
            p.y = 0.92;
            p.assentada = true;
          }
        }
      });
    }
    if (P.dissolving) {
      P.p = Math.min(1, P.p + dt / 1.6);
      if (P.p >= 1 && !P.done) {
        P.done = true;
        P.dissolving = false;
        const c = this._prepCalc();
        SISOL.playTone(c.corpo > 0.2 ? 420 : 880, .12, .06);
        SISOL.announce(c.corpo > 0.2 ? `Saturou! Dissolveram ${SISOL.fmt(c.diss, 1)} g; ${SISOL.fmt(c.corpo, 1)} g ficaram como corpo de fundo. Concentração real: ${SISOL.fmt(c.C, 1)} g/L.` : `Tudo dissolvido. C = ${SISOL.fmt(c.C, 1)} g/L; molaridade = ${SISOL.fmt(c.M, 3)} mol/L.`, 'assertive');
      }
    }
    if (L.running) {
      L.q = Math.min(1, L.q + dt / 1.8);
      if (L.q >= 1 && !L.done) {
        L.done = true;
        L.running = false;
        const d = this._dilCalc();
        SISOL.playTone(880, .12, .06);
        SISOL.announce(L.op === 'diluir' ? `Diluição concluída: C₂ = ${SISOL.fmt(d.C2, 2)} g/L em ${SISOL.fmt(d.V2, 0)} mL (diluiu ${SISOL.fmt(d.fator, 1)} vez).` : `Mistura concluída: C final = ${SISOL.fmt(d.Cf, 2)} g/L em ${SISOL.fmt(d.Vf, 0)} mL.`, 'assertive');
      }
    }
    if (this.mode === 'preparo' && P.box) {
      const c = this._prepCalc();
      SISOL.kParticles(P.part, Math.round(SISOL.clamp(c.diss * 1.1, 0, 64)), P.box, 26, dt);
    }
    // gotas caindo + ondulações nas DUAS torneiras enquanto o líquido escoa
    // para o béquer maior — vale tanto para diluir (soluto + água) quanto
    // para misturar (solução A + solução B)
    if (this.mode === 'diluicao' && L.running && !SISOL.isReduced()) {
      if (L.dropX != null) SISOL.kDrops(L.droplets, dt, {
        x: L.dropX,
        y: L.dropY0,
        targetY: L.dropTarget,
        rate: 14
      });
      if (L.drop2X != null) SISOL.kDrops(L.droplets2, dt, {
        x: L.drop2X,
        y: L.drop2Y0,
        targetY: L.drop2Target,
        rate: 14
      });
      if (Math.random() < 7 * dt) L.ripples.push({
        r: 2,
        a: .55
      });
      if (Math.random() < 7 * dt) L.ripples2.push({
        r: 2,
        a: .55
      });
    }
    L.ripples.forEach(r => {
      r.r += 46 * dt;
      r.a -= dt * 0.75;
    });
    L.ripples = L.ripples.filter(r => r.a > 0.02);
    L.ripples2.forEach(r => {
      r.r += 46 * dt;
      r.a -= dt * 0.75;
    });
    L.ripples2 = L.ripples2.filter(r => r.a > 0.02);
  }

  /* ── desenho ── */
  draw(ctx, W, H, app) {
    if (this.mode === 'classificacao') this._drawMix(ctx, W, H);else if (this.mode === 'preparo') this._dPreparo(ctx, W, H, app);else if (this.mode === 'diluicao') this._dDil(ctx, W, H, app);else this._dCurvas(ctx, W, H);
  }

  /** Béquer + feixe de luz atravessando (efeito Tyndall) + partículas —
   *  a chave visual para diferenciar solução (feixe invisível, sem
   *  partículas), colóide (feixe visível, partículas suspensas com
   *  tremor Browniano) e suspensão (partículas sedimentando com o tempo). */
  _drawMix(ctx, W, H) {
    const X = this.mix,
      item = X.item;
    const estreito = W < 620;
    // margem reservada pro feixe+lanterna à ESQUERDA do béquer — cresce e
    // encolhe com o canvas, nunca fixa, pra nunca sair da área visível
    const margemFeixe = SISOL.clamp(W * .13, 34, 66);
    // sem a lente (padrão), o béquer fica mais centralizado e maior; com a
    // lente ligada, ele volta pra esquerda pra abrir espaço pra ela
    const bw = SISOL.clamp(W * (X.lente ? .24 : .3), estreito ? 120 : 170, X.lente ? 280 : 340);
    const bh = estreito ? Math.min(H * .38, 240) : Math.min(H * .7, 420);
    const cxPadrao = X.lente ? estreito ? W * .34 : W * .24 : W * .38;
    const cx = Math.max(cxPadrao, margemFeixe + bw / 2 + 20);
    const top = estreito ? H * .07 : H * .12;
    const box = SISOL.kBeaker(ctx, cx, top, bw, bh, .82, item.cor, {
      alpha: item.tipo === 'suspensao' ? .5 : .28,
      rotulo: item.nome
    });

    // feixe de luz entrando pela lateral esquerda do béquer
    const ly = top + bh * .42;
    const temFeixeVisivel = item.tipo !== 'solucao';
    ctx.save();
    ctx.strokeStyle = SISOL.cssVar('--accent-amber', '#fbbf24');
    ctx.lineWidth = temFeixeVisivel ? item.tipo === 'suspensao' ? 5 : 3 : 1;
    ctx.globalAlpha = item.tipo === 'solucao' ? .06 : item.tipo === 'suspensao' ? .35 : .8;
    ctx.beginPath();
    ctx.moveTo(cx - bw / 2 - margemFeixe, ly);
    ctx.lineTo(cx + bw / 2 - 6, ly);
    ctx.stroke();
    ctx.restore();
    // lanterna
    ctx.save();
    ctx.fillStyle = SISOL.cssVar('--text-muted');
    ctx.fillRect(cx - bw / 2 - margemFeixe - 20, ly - 10, 22, 20);
    ctx.restore();
    SISOL.kLabel(ctx, temFeixeVisivel ? 'feixe visível (Tyndall)' : 'feixe invisível', cx - bw / 2 - margemFeixe, ly - 16, {
      size: 9,
      align: 'left',
      color: SISOL.cssVar('--text-secondary')
    });

    // partículas: paradas+Brownianas (colóide) ou sedimentando (suspensão)
    ctx.save();
    X.particulas.forEach((p, i) => {
      const jitterX = item.tipo === 'coloide' && !SISOL.isReduced() ? Math.sin(this.fase * 1.6 + i * 3.1) * 3 : 0;
      const px = cx - bw / 2 + 10 + p.x * (bw - 20) + jitterX;
      const py = top + bh * .12 + p.y * (bh * .8);
      ctx.fillStyle = item.dot || item.cor;
      ctx.globalAlpha = .85;
      ctx.beginPath();
      ctx.arc(px, py, item.tipo === 'suspensao' ? 3.2 : 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    if (item.tipo === 'suspensao' && X.particulas.some(p => p.assentada)) {
      SISOL.kLabel(ctx, 'sedimentando no fundo', cx, top + bh + 22, {
        size: 10,
        color: SISOL.cssVar('--text-secondary')
      });
    }

    // confirmação visual simples: um X/✓ grande junto ao béquer — sem placar,
    // só a confirmação de acerto do ponto (tipo) escolhido
    if (X.resposta) {
      const certo = X.resposta === item.tipo;
      const nomes = {
        solucao: 'solução verdadeira',
        coloide: 'colóide',
        suspensao: 'suspensão'
      };
      ctx.save();
      const corVeredito = certo ? SISOL.cssVar('--accent-ok', '#4ade80') : SISOL.cssVar('--accent-exo', '#f87171');
      (certo ? SISOL.kIconCheck : SISOL.kIconX)(ctx, cx, Math.max(26, top - 26), 30, corVeredito);
      ctx.restore();
      if (!certo) SISOL.kLabel(ctx, `era ${nomes[item.tipo]}`, cx, Math.max(26, top - 26) + 20, {
        size: 10,
        color: SISOL.cssVar('--accent-exo')
      });
    }
    if (X.feedback && this.fase - X.feedback.t < 1.2 && !SISOL.isReduced()) {
      const alpha = 1 - (this.fase - X.feedback.t) / 1.2;
      ctx.save();
      ctx.globalAlpha = alpha * .5;
      ctx.lineWidth = 4;
      ctx.strokeStyle = X.feedback.ok ? SISOL.cssVar('--accent-ok') : SISOL.cssVar('--accent-exo');
      ctx.beginPath();
      ctx.arc(cx, top + bh / 2, bw / 2 + 10 + (1 - alpha) * 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── lente de observação: alternativa OPCIONAL (botão "Ver de perto" na
    // barra lateral) — ao LADO em telas largas, EMBAIXO em telas estreitas ──
    if (!X.lente) return;
    const lx = estreito ? W * .5 : W * .68;
    const lyC = estreito ? top + bh + Math.min(H * .2, 100) + 30 : H * .46;
    const lr = estreito ? SISOL.clamp(Math.min(W * .34, (H - lyC) * .8), 46, 100) : Math.min(W * .26, H * .38, 260);
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, lyC, lr, 0, Math.PI * 2);
    ctx.fillStyle = SISOL.cssVar('--bg-panel2', '#101c2b');
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = SISOL.cssVar('--border');
    ctx.stroke();
    ctx.clip();
    if (item.tipo === 'solucao') {
      // nada visível: só o fundo liso, feixe invisível
      ctx.globalAlpha = .05;
      ctx.strokeStyle = SISOL.cssVar('--accent-amber');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx - lr, lyC);
      ctx.lineTo(lx + lr, lyC);
      ctx.stroke();
    } else if (item.tipo === 'coloide') {
      // feixe brilhante espalhado, com pontinhos de luz ao redor do trajeto
      ctx.globalAlpha = .9;
      ctx.strokeStyle = SISOL.cssVar('--accent-amber');
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(lx - lr, lyC);
      ctx.lineTo(lx + lr, lyC);
      ctx.stroke();
      ctx.fillStyle = SISOL.cssVar('--accent-amber');
      for (let i = 0; i < 22; i++) {
        const t = (i / 22 + (SISOL.isReduced() ? 0 : this.fase * .05)) % 1;
        const px = lx - lr + t * lr * 2,
          py = lyC + Math.sin(this.fase * 2 + i) * 5;
        ctx.globalAlpha = .5;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // suspensão: praticamente opaca, feixe curto e absorvido logo na entrada
      ctx.globalAlpha = .85;
      ctx.fillStyle = item.dot || item.cor;
      ctx.beginPath();
      ctx.arc(lx, lyC, lr, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = .8;
      ctx.strokeStyle = SISOL.cssVar('--accent-amber');
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(lx - lr, lyC);
      ctx.lineTo(lx - lr * .35, lyC);
      ctx.stroke();
    }
    ctx.restore();
    SISOL.kLabel(ctx, 'de perto', lx, lyC - lr - 12, {
      size: 10,
      color: SISOL.cssVar('--text-secondary')
    });
  }
  _corSolucao(sol, satFrac) {
    if (sol.cor) return {
      cor: sol.cor,
      alpha: .10 + .70 * SISOL.clamp(satFrac, 0, 1)
    };
    return {
      cor: SISOL.cssVar('--accent-endo', '#38bdf8'),
      alpha: .13
    };
  }
  _dPreparo(ctx, W, H, app) {
    const P = this.prep,
      c = this._prepCalc();
    const bw = SISOL.clamp(W * .34, 150, 250),
      bh = H * .56,
      top = H * .16,
      cx = W * .36;
    const tint = this._corSolucao(P.sol, c.satFrac);
    const box = SISOL.kBeaker(ctx, cx, top, bw, bh, P.vol / 1000, tint.cor, {
      alpha: tint.alpha,
      rotulo: `${SISOL.fmt(P.vol, 0)} mL de água`
    });
    P.box = {
      x: box.x + 6,
      y: box.y + 6,
      w: box.w - 12,
      h: Math.max(10, box.h - 12)
    };
    SISOL.kDrawParticles(ctx, P.part, 2.3, P.sol.dot, .85);
    if (c.corpo > 0.15 && box.h > 4) {
      // corpo de fundo como pilha granular (não mais uma única blob lisa)
      const nGraos = SISOL.clamp(Math.round(6 + c.corpo * 0.5), 6, 42);
      const baseY = top + bh - 4,
        spanX = bw * 0.36;
      const pilha = SISOL.clamp(c.corpo / 35, 0.15, 1);
      ctx.save();
      ctx.fillStyle = P.sol.dot;
      for (let i = 0; i < nGraos; i++) {
        const seed = i * 12.9898;
        const rx = Math.sin(seed) * 0.94;
        const rr = 2 + (Math.cos(seed * 1.7) * .5 + .5) * 3;
        const gx = cx + rx * spanX;
        const gy = baseY - Math.abs(Math.sin(seed * 2.3)) * (6 + pilha * 12) * (1 - Math.abs(rx) * .4);
        ctx.globalAlpha = .8 + .18 * Math.sin(seed);
        ctx.beginPath();
        ctx.ellipse(gx, gy, rr, rr * .78, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      SISOL.kChip(ctx, `corpo de fundo · ${SISOL.fmt(c.corpo, 1)} g`, cx, top + bh + 30, {
        fg: SISOL.cssVar('--accent-exo'),
        size: 10
      });
    }
    // pó caindo + redemoinho de agitação durante a dissolução
    if (P.dissolving && !SISOL.isReduced()) {
      ctx.save();
      ctx.fillStyle = P.sol.dot;
      for (let i = 0; i < 8; i++) {
        const yy = top - 14 + (app.time * 90 + i * 23) % (box.y - top + 18);
        ctx.globalAlpha = .8;
        ctx.fillRect(cx - 16 + i % 5 * 8, yy, 2.6, 2.6);
      }
      ctx.restore();
      ctx.save();
      ctx.translate(cx, box.surfaceY + 14);
      ctx.rotate(app.time * 2.4);
      ctx.strokeStyle = SISOL.cssVar('--accent-endo');
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = .5;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0.3, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();
    }

    // painel-medidor: massa × limite de solubilidade — agora com as DUAS
    // zonas da barra rotuladas diretamente (dissolvido / corpo de fundo),
    // pra a equivalência "passou do limite → vira corpo de fundo" ficar
    // óbvia olhando só a barra, sem precisar ler o texto de baixo.
    const gx = W * .58,
      gw = SISOL.clamp(W * .36, 200, 320),
      gy = H * .3,
      barH = 24;
    const maxG = Math.max(150, c.limite * 1.15);
    const wOK = SISOL.clamp(Math.min(P.massa, c.limite) / maxG, 0, 1) * gw;
    const wExcesso = P.massa > c.limite ? SISOL.clamp((P.massa - c.limite) / maxG, 0, 1) * gw : 0;
    SISOL.kLabel(ctx, `Saturação a ${SISOL.fmt(P.temp, 0)} °C`, gx + gw / 2, gy - 32, {
      size: 13,
      bold: true,
      color: SISOL.cssVar('--text-primary')
    });
    ctx.save();
    ctx.fillStyle = SISOL.cssVar('--bg-panel2', '#101c2b');
    SISOL.kRound(ctx, gx, gy, gw, barH, 10);
    ctx.fill();
    ctx.fillStyle = SISOL.cssVar('--accent-ok');
    SISOL.kRound(ctx, gx, gy, Math.max(wOK, 2), barH, wExcesso > 0 ? 0 : 10);
    ctx.fill();
    if (wExcesso > 0) {
      ctx.fillStyle = SISOL.cssVar('--accent-exo');
      SISOL.kRound(ctx, gx + wOK, gy, wExcesso, barH, 10);
      ctx.fill();
    }
    // linha tracejada exatamente no limite de solubilidade
    const xl = gx + SISOL.clamp(c.limite / maxG, 0, 1) * gw;
    ctx.strokeStyle = SISOL.cssVar('--accent-amber');
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xl, gy - 9);
    ctx.lineTo(xl, gy + barH + 9);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    SISOL.kLabel(ctx, `limite: ${SISOL.fmt(c.limite, 1)} g`, xl, gy - 15, {
      size: 10,
      color: SISOL.cssVar('--accent-amber'),
      mono: true,
      bold: true
    });

    // rótulos de zona, cada um centrado embaixo do próprio pedaço da barra
    if (wOK > 34) SISOL.kLabel(ctx, `dissolvido · ${SISOL.fmt(Math.min(P.massa, c.limite), 1)} g`, gx + wOK / 2, gy + barH + 16, {
      size: 10,
      color: SISOL.cssVar('--accent-ok'),
      bold: true
    });
    if (wExcesso > 34) SISOL.kLabel(ctx, `corpo de fundo · ${SISOL.fmt(P.massa - c.limite, 1)} g`, gx + wOK + wExcesso / 2, gy + barH + 16, {
      size: 10,
      color: SISOL.cssVar('--accent-exo'),
      bold: true
    });else if (wExcesso > 0) SISOL.kLabel(ctx, `+ corpo de fundo: ${SISOL.fmt(P.massa - c.limite, 1)} g`, gx + gw + 6, gy + barH / 2, {
      size: 10,
      align: 'left',
      color: SISOL.cssVar('--accent-exo'),
      bold: true
    });
    let yy = gy + barH + 40;
    SISOL.kChip(ctx, `C real = ${SISOL.fmt(c.C, 1)} g/L`, gx + gw / 2, yy, {
      fg: SISOL.cssVar('--accent-amber'),
      bold: true,
      size: 12
    });
    yy += 28;
    SISOL.kChip(ctx, `M = ${SISOL.fmt(c.M, 3)} mol/L`, gx + gw / 2, yy, {
      fg: SISOL.cssVar('--text-primary'),
      size: 11
    });
    yy += 30;
    SISOL.kLabel(ctx, c.corpo > .2 ? 'solução SATURADA + corpo de fundo' : c.satFrac > .98 ? 'solução SATURADA' : 'solução insaturada', gx + gw / 2, yy, {
      size: 11,
      color: c.corpo > .2 ? SISOL.cssVar('--accent-exo') : SISOL.cssVar('--accent-ok'),
      bold: true
    });
  }
  _dDil(ctx, W, H, app) {
    const L = this.dil,
      d = this._dilCalc(),
      roxo = this.D.DIL.corMax,
      cRef = this.D.DIL.cRef;
    const bwSrc = SISOL.clamp(W * .16, 86, 130),
      bhSrc = H * .19,
      topSrc = H * .08;
    const bwDest = SISOL.clamp(W * .42, 220, 340),
      bhDest = H * .44,
      topDest = H * .42,
      cxDest = W * .5;
    const lx = cxDest - bwDest * .3,
      rx = cxDest + bwDest * .3;

    // béquer de destino MAIOR — para onde as duas torneiras escoam
    const nivelDest = L.op === 'diluir' ? d.Vnow / 1000 : (L.v1 + L.v2) * d.e / 1000;
    const cAtual = L.op === 'diluir' ? d.Cnow : d.e > 0 ? d.Cf : 0;
    const rotuloDest = L.op === 'diluir' ? `${SISOL.fmt(d.Vnow, 0)} mL` : `${SISOL.fmt((L.v1 + L.v2) * d.e, 0)} mL`;
    const destino = SISOL.kBeaker(ctx, cxDest, topDest, bwDest, bhDest, nivelDest, roxo, {
      alpha: .08 + .72 * SISOL.clamp(cAtual / cRef, 0, 1),
      rotulo: rotuloDest
    });

    // os béqueres de ORIGEM esvaziam de verdade conforme a animação avança
    // (e: 0 → cheios, 1 → vazios) — antes o reservatório de água era só um
    // contorno estático que nunca mudava, então "verter" não parecia nada
    const nivelOrigem = .74 * (1 - d.e);
    if (L.op === 'diluir') {
      // torneira esquerda: solução concentrada C₁V₁, esvaziando
      SISOL.kBeaker(ctx, lx, topSrc, bwSrc, bhSrc, nivelOrigem, roxo, {
        alpha: .1 + .7 * SISOL.clamp(L.c1 / cRef, 0, 1),
        rotulo: `${SISOL.fmt(L.c1, 2)} g/L · ${SISOL.fmt(L.v1 * (1 - d.e), 0)} mL restantes`
      });
      // torneira direita: reservatório de água, também esvaziando
      SISOL.kBeaker(ctx, rx, topSrc, bwSrc, bhSrc, nivelOrigem, SISOL.cssVar('--accent-endo', '#38bdf8'), {
        alpha: .32,
        rotulo: `Água · ${SISOL.fmt(L.vagua * (1 - d.e), 0)} mL restantes`
      });
      L.dropX = lx;
      L.dropY0 = topSrc + bhSrc + 6;
      L.dropTarget = destino.surfaceY;
      L.drop2X = rx;
      L.drop2Y0 = topSrc + bhSrc + 6;
      L.drop2Target = destino.surfaceY;
      SISOL.kTap(ctx, lx, topSrc + bhSrc + 4, L.running, roxo);
      SISOL.kTap(ctx, rx, topSrc + bhSrc + 4, L.running, SISOL.cssVar('--accent-endo'));
    } else {
      SISOL.kBeaker(ctx, lx, topSrc, bwSrc, bhSrc, nivelOrigem, roxo, {
        alpha: .1 + .7 * SISOL.clamp(L.c1 / cRef, 0, 1),
        rotulo: `A: ${SISOL.fmt(L.c1, 2)} g/L · ${SISOL.fmt(L.v1 * (1 - d.e), 0)} mL restantes`
      });
      SISOL.kBeaker(ctx, rx, topSrc, bwSrc, bhSrc, nivelOrigem, roxo, {
        alpha: .1 + .7 * SISOL.clamp(L.c2 / cRef, 0, 1),
        rotulo: `B: ${SISOL.fmt(L.c2, 2)} g/L · ${SISOL.fmt(L.v2 * (1 - d.e), 0)} mL restantes`
      });
      L.dropX = lx;
      L.dropY0 = topSrc + bhSrc + 6;
      L.dropTarget = destino.surfaceY;
      L.drop2X = rx;
      L.drop2Y0 = topSrc + bhSrc + 6;
      L.drop2Target = destino.surfaceY;
      SISOL.kTap(ctx, lx, topSrc + bhSrc + 4, L.running, roxo);
      SISOL.kTap(ctx, rx, topSrc + bhSrc + 4, L.running, roxo);
    }
    if (L.running && !SISOL.isReduced()) {
      // cor das gotas de cada torneira: na diluição, a 1ª é solução (roxo) e
      // a 2ª é água (azul); na mistura, AS DUAS são solução (roxo) — antes a
      // 1ª saía sempre azul por engano, mesmo representando KMnO₄
      const cor1 = roxo,
        cor2 = L.op === 'diluir' ? SISOL.cssVar('--accent-endo') : roxo;
      SISOL.kDrawDrops(ctx, L.droplets, cor1);
      SISOL.kDrawDrops(ctx, L.droplets2, cor2);
      [[L.dropX, L.ripples, cor1], [L.drop2X, L.ripples2, cor2]].forEach(([x, arr, cor]) => {
        ctx.save();
        ctx.strokeStyle = cor;
        ctx.lineWidth = 1.4;
        arr.forEach(r => {
          ctx.globalAlpha = r.a;
          ctx.beginPath();
          ctx.ellipse(x, destino.surfaceY, r.r, r.r * .32, 0, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.restore();
      });
    }

    // identificação rápida de cada fonte, sem precisar ler o rótulo inteiro
    if (L.op === 'misturar') {
      SISOL.kChip(ctx, 'A', lx, topSrc - 14, {
        fg: roxo,
        bold: true,
        size: 11,
        border: roxo
      });
      SISOL.kChip(ctx, 'B', rx, topSrc - 14, {
        fg: roxo,
        bold: true,
        size: 11,
        border: roxo
      });
    }
    SISOL.kLabel(ctx, L.op === 'diluir' ? 'C₁V₁ = C₂V₂ — massa de soluto se conserva' : 'Cf = (C₁V₁ + C₂V₂)/(V₁+V₂)', cxDest, topDest + bhDest + 40, {
      size: 11,
      color: SISOL.cssVar('--text-secondary')
    });
  }
  _dCurvas(ctx, W, H) {
    const C = this.cur;
    const maxSel = Math.max(...C.sal.g);
    const ymax = maxSel > 230 ? Math.ceil(maxSel * 1.12 / 100) * 100 : 260;
    const passo = ymax > 500 ? 200 : ymax > 260 ? 100 : 50;
    const yticks = [];
    for (let v = 0; v <= ymax; v += passo) yticks.push(v);
    const m = SISOL.kAxes(ctx, {
      x: 58,
      y: 24,
      w: W - 104,
      h: H - 88,
      xmin: 0,
      xmax: 100,
      ymin: 0,
      ymax,
      xticks: [0, 20, 40, 60, 80, 100],
      yticks,
      xlab: 'Temperatura (°C)',
      ylab: 'Solubilidade (g/100 g H₂O)'
    });

    // zonas de fundo relativas ao sal SELECIONADO: abaixo da curva = insaturada,
    // acima = corpo de fundo — torna o significado físico do gráfico visível
    // de cara, não só uma linha abstrata.
    const curvaSel = C.sal.g.map((y, i) => [i * 10, y]);
    ctx.save();
    ctx.beginPath();
    curvaSel.forEach((p, i) => i ? ctx.lineTo(m.px(p[0]), m.py(p[1])) : ctx.moveTo(m.px(p[0]), m.py(p[1])));
    ctx.lineTo(m.px(100), m.py(0));
    ctx.lineTo(m.px(0), m.py(0));
    ctx.closePath();
    ctx.fillStyle = SISOL.cssVar('--accent-ok');
    ctx.globalAlpha = .08;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    curvaSel.forEach((p, i) => i ? ctx.lineTo(m.px(p[0]), m.py(p[1])) : ctx.moveTo(m.px(p[0]), m.py(p[1])));
    ctx.lineTo(m.px(100), m.py(ymax));
    ctx.lineTo(m.px(0), m.py(ymax));
    ctx.closePath();
    ctx.fillStyle = SISOL.cssVar('--accent-exo');
    ctx.globalAlpha = .07;
    ctx.fill();
    ctx.restore();
    SISOL.kLabel(ctx, 'insaturada', m.px(6), m.py(0) - 12, {
      size: 9,
      align: 'left',
      color: SISOL.cssVar('--accent-ok')
    });
    SISOL.kLabel(ctx, 'corpo de fundo', m.px(6), m.py(ymax) + 14, {
      size: 9,
      align: 'left',
      color: SISOL.cssVar('--accent-exo')
    });
    const rotulosCurva = this.D.SOLUBILIDADE.map(s => {
      const sel = s.id === C.sal.id;
      SISOL.kLine(ctx, s.g.map((y, i) => [i * 10, y]), m.px, m.py, {
        color: s.cor,
        w: sel ? 3.2 : 1.6,
        alpha: sel ? 1 : .3
      });
      return {
        s,
        sel,
        x: m.px(100) + 6,
        y: m.py(Math.min(s.g[10], ymax))
      };
    });
    // anti-colisão: com muitos sais, vários acabam com solubilidade parecida
    // a 100 °C — sem isso, os rótulos empilhavam ilegíveis uns sobre os outros
    rotulosCurva.sort((a, b) => a.y - b.y);
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < rotulosCurva.length; i++) {
        for (let j = 0; j < rotulosCurva.length; j++) {
          if (i === j) continue;
          const dy = rotulosCurva[i].y - rotulosCurva[j].y;
          if (Math.abs(dy) < 13 && dy >= 0) rotulosCurva[i].y = rotulosCurva[j].y + 13;
        }
      }
    }
    rotulosCurva.forEach(r => SISOL.kLabel(ctx, r.s.nome, r.x, r.y, {
      size: 10,
      color: r.s.cor,
      align: 'left',
      bold: r.sel,
      mono: true
    }));
    const sT = this._solT();
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = SISOL.cssVar('--text-muted');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(m.px(C.T), m.py(0));
    ctx.lineTo(m.px(C.T), m.py(Math.max(C.m, sT)));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = C.sal.cor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(m.px(C.T), m.py(sT), 5.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    // marcador da massa atual — cor NEUTRA (não entrega a classificação!) até
    // o estudante responder ao quiz; pulsa suavemente para chamar atenção
    const pulso = SISOL.isReduced() ? 0 : Math.sin(this.fase * 3) * 1.6;
    const corMarcador = C.resposta ? C.feedback && C.feedback.ok ? SISOL.cssVar('--accent-ok') : SISOL.cssVar('--accent-exo') : SISOL.cssVar('--text-primary');
    ctx.save();
    ctx.fillStyle = corMarcador;
    ctx.beginPath();
    ctx.arc(m.px(C.T), m.py(C.m), 6 + pulso, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // confirmação visual simples: ✓/✗ grande junto ao marcador, sem placar
    if (C.resposta) {
      const real = this._classe(),
        certo = C.resposta === real.tipo;
      const nomes = {
        insat: 'insaturada',
        sat: 'saturada',
        corpo: 'corpo de fundo'
      };
      ctx.save();
      ctx.fillStyle = certo ? SISOL.cssVar('--accent-ok', '#4ade80') : SISOL.cssVar('--accent-exo', '#f87171');
      (certo ? SISOL.kIconCheck : SISOL.kIconX)(ctx, m.px(C.T), m.py(C.m) - 24, 26, ctx.fillStyle);
      ctx.restore();
      if (!certo) SISOL.kLabel(ctx, `era ${nomes[real.tipo]}`, m.px(C.T), m.py(C.m) - 42, {
        size: 10,
        color: SISOL.cssVar('--accent-exo')
      });
    }
    // flash de feedback: anel que aparece e esmaece por ~1,2 s após responder
    if (C.feedback && this.fase - C.feedback.t < 1.2 && !SISOL.isReduced()) {
      const alpha = 1 - (this.fase - C.feedback.t) / 1.2;
      ctx.save();
      ctx.globalAlpha = alpha * .6;
      ctx.lineWidth = 3;
      ctx.strokeStyle = C.feedback.ok ? SISOL.cssVar('--accent-ok') : SISOL.cssVar('--accent-exo');
      ctx.beginPath();
      ctx.arc(m.px(C.T), m.py(C.m), 14 + (1 - alpha) * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    SISOL.kLabel(ctx, `curva: ${SISOL.fmt(sT, 1)} g/100 g a ${SISOL.fmt(C.T, 0)} °C`, m.px(C.T), m.py(0) + 26, {
      size: 10,
      color: C.sal.cor,
      mono: true
    });

    // ── lente "de perto": alternativa OPCIONAL que amplia a vizinhança do
    // ponto (T, massa) contra a curva — útil quando os dois estão bem perto
    // e é difícil ver a olho nu se passou ou não da linha ──
    if (!C.zoom) return;
    const estreito = W < 620;
    const lx = estreito ? W * .5 : W * .78;
    const lyC = estreito ? H - Math.min(H * .22, 120) : H * .28;
    const lr = estreito ? SISOL.clamp(Math.min(W * .3, 90), 50, 100) : Math.min(W * .16, H * .22, 130);
    const janela = Math.max(6, ymax * .12); // faixa de massa mostrada na lente, centrada no ponto
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, lyC, lr, 0, Math.PI * 2);
    ctx.fillStyle = SISOL.cssVar('--bg-panel2', '#101c2b');
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = SISOL.cssVar('--border');
    ctx.stroke();
    ctx.clip();
    // reconstrói um mini-eixo Y só com a faixa próxima ao ponto, mesmo eixo X
    const zMin = Math.max(0, C.m - janela),
      zMax = C.m + janela;
    const zPy = v => lyC + lr - (v - zMin) / (zMax - zMin) * (lr * 2);
    const zPx = t => lx - lr + (t - Math.max(0, C.T - 15)) / 30 * (lr * 2);
    SISOL.kLine(ctx, curvaSel.map(p => p), zPx, zPy, {
      color: C.sal.cor,
      w: 3
    });
    ctx.save();
    ctx.fillStyle = corMarcador;
    ctx.beginPath();
    ctx.arc(zPx(C.T), zPy(C.m), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    SISOL.kLabel(ctx, 'de perto', lx, lyC - lr - 12, {
      size: 10,
      color: SISOL.cssVar('--text-secondary')
    });
  }
  getResults() {
    if (this.mode === 'classificacao') {
      const X = this.mix;
      const rows = [{
        l: 'Mistura em observação',
        v: X.item.nome
      }];
      if (X.resposta) {
        const nomes = {
          solucao: 'solução verdadeira',
          coloide: 'colóide',
          suspensao: 'suspensão'
        };
        const certo = X.resposta === X.item.tipo;
        rows.push({
          l: 'Sua resposta',
          v: `${nomes[X.resposta]}${certo ? ' <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>' : ' <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg> (era ' + nomes[X.item.tipo] + ')'}`,
          cls: certo ? 'val-ok' : 'val-exo'
        });
        rows.push({
          l: 'Por quê',
          v: X.item.contexto
        });
      }
      return rows;
    }
    if (this.mode === 'preparo') {
      const P = this.prep;
      if (!P.done && !P.dissolving) {
        return [{
          l: 'Soluto',
          v: P.sol.nome.split(' (')[0]
        }, {
          l: 'Massa pesada',
          v: `${SISOL.fmt(P.massa, 0)} g`
        }, {
          l: 'Volume de água',
          v: `${SISOL.fmt(P.vol, 0)} mL`
        }, {
          l: 'Temperatura',
          v: `${SISOL.fmt(P.temp, 0)} °C`
        }, {
          l: 'Estado',
          v: 'aguardando o experimento — pressione "Dissolver"'
        }];
      }
      const c = this._prepCalc(),
        cl = c.corpo > .2 ? 'val-exo' : 'val-ok';
      return [{
        l: 'Soluto',
        v: P.sol.nome.split(' (')[0]
      }, {
        l: 'Massa molar',
        v: `${SISOL.fmt(P.sol.M, 2)} g/mol`
      }, {
        l: 'Soluto dissolvido',
        v: `${SISOL.fmt(c.diss, 2)} g  =  ${SISOL.fmt(c.nMol, 4)} mol`
      }, {
        l: 'Massa de solvente',
        v: `${SISOL.fmt(c.mSolvente, 0)} g de água`
      }, {
        l: 'Massa de solução',
        v: `${SISOL.fmt(c.mSolucao, 1)} g`
      }, /* ── as unidades de concentração, todas a partir dos MESMOS dados ── */
      {
        l: '— Concentração —',
        v: ''
      }, {
        l: 'C teórica (cálculo exato)',
        v: `${SISOL.fmt(c.C, 1)} g/L`
      }, {
        l: 'C real (medida)',
        v: `${SISOL.fmt(c.Cexp, 1)} g/L`,
        cls: 'val-ok'
      }, {
        l: 'Molaridade M = n/V',
        v: `${SISOL.fmt(c.Mexp, 3)} mol/L`
      }, {
        l: 'Molalidade W = n/kg solv.',
        v: `${SISOL.fmt(c.molalidade, 4)} mol/kg`
      }, {
        l: 'Título τ = m_soluto/m_sol.',
        v: SISOL.fmt(c.titulo, 5)
      }, {
        l: 'Porcentagem em massa',
        v: `${SISOL.fmt(c.pct, 3)} % (m/m)`,
        cls: 'val-ok'
      }, {
        l: 'ppm',
        v: `${SISOL.fmt(c.ppm, 0)} ppm`
      }, {
        l: 'Densidade da solução',
        v: `${SISOL.fmt(c.dSolucao, 4)} g/mL`
      }, {
        l: 'Relação C = 1000·d·τ',
        v: `${SISOL.fmt(1000 * c.dSolucao * c.titulo, 1)} g/L (confere com C)`
      }, {
        l: '— Saturação —',
        v: ''
      }, {
        l: 'Incerteza experimental',
        v: `± ${SISOL.fmt(Math.abs(P.erro * 100), 1)} %`
      }, {
        l: `Limite a ${SISOL.fmt(P.temp, 0)} °C`,
        v: `${SISOL.fmt(c.limite, 1)} g`
      }, {
        l: 'Corpo de fundo',
        v: `${SISOL.fmt(Math.max(0, c.corpo), 1)} g`,
        cls: cl
      }];
    }
    if (this.mode === 'diluicao') {
      const L = this.dil,
        d = this._dilCalc();
      if (L.op === 'diluir') return [{
        l: 'Massa de KMnO₄',
        v: `${SISOL.fmt(L.c1 * L.v1 / 1000, 2)} g`
      }, {
        l: 'C₁ · V₁',
        v: `${SISOL.fmt(L.c1, 2)} g/L · ${SISOL.fmt(L.v1, 0)} mL`
      }, {
        l: 'V₂ = V₁ + água',
        v: `${SISOL.fmt(d.V2, 0)} mL`
      }, {
        l: 'C₂ = C₁V₁/V₂',
        v: `${SISOL.fmt(d.C2, 2)} g/L`,
        cls: 'val-ok'
      }, {
        l: 'Fator de diluição',
        v: `${SISOL.fmt(d.fator, 1)}×`
      }];
      return [{
        l: 'Soluto em A',
        v: `${SISOL.fmt(d.m1, 2)} g`
      }, {
        l: 'Soluto em B',
        v: `${SISOL.fmt(d.m2, 2)} g`
      }, {
        l: 'V final',
        v: `${SISOL.fmt(d.Vf, 0)} mL`
      }, {
        l: 'C_f',
        v: `${SISOL.fmt(d.Cf, 2)} g/L`,
        cls: 'val-ok'
      }];
    }
    const C = this.cur,
      sT = this._solT();
    const rows = [{
      l: 'Sal',
      v: C.sal.nome
    }, {
      l: `Solubilidade a ${SISOL.fmt(C.T, 0)} °C`,
      v: `${SISOL.fmt(sT, 1)} g/100 g`
    }, {
      l: 'Massa adicionada',
      v: `${SISOL.fmt(C.m, 0)} g/100 g`
    }];
    if (C.resposta) {
      const nomes = {
        insat: 'insaturada',
        sat: 'saturada',
        corpo: 'corpo de fundo'
      };
      const real = this._classe(),
        certo = C.resposta === real.tipo;
      rows.push({
        l: 'Sua resposta',
        v: `${nomes[C.resposta]}${certo ? ' <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>' : ' <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg> (era ' + nomes[real.tipo] + ')'}`,
        cls: certo ? 'val-ok' : 'val-exo'
      });
    }
    return rows;
  }
  getOverlay() {
    if (this.mode === 'classificacao') return this.mix.item.nome;
    if (this.mode === 'preparo') {
      const P = this.prep;
      if (!P.done && !P.dissolving) return `${P.sol.nome.split(' (')[0]} · aguardando`;
      const c = this._prepCalc();
      return `${P.sol.nome.split(' (')[0]} · ${SISOL.fmt(c.Cexp, 1)} g/L`;
    }
    if (this.mode === 'diluicao') return `KMnO₄ · ${this.dil.op === 'diluir' ? 'diluição' : 'mistura'}`;
    return `${this.cur.sal.nome} · ${SISOL.fmt(this.cur.T, 0)} °C`;
  }
};
