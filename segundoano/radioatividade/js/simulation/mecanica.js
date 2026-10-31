// ══════════════════════════════════════════════════════════════════
// MECÂNICA — SIRAD · Radioatividade
// Emissões: trajetórias de α, β e γ contra barreiras (papel, alumínio,
// chumbo) ou entre placas eletrizadas. Meia-vida: N = N₀·(1/2)^(t/t½)
// numa grade de 100 átomos com ordem de decaimento pré-sorteada.
// Cadeia: nêutrons móveis fissionam U-235 e liberam 3 nêutrons,
// filtrados pelas barras de controle (k = 3·(1 − controle)).
// ══════════════════════════════════════════════════════════════════
SIRAD.Mech = class Mech {
  constructor(D) {
    this.D = D;
    this.mode = 'emissoes';
    this.em = {
      cenario: 'barreiras',
      fase: 1.2,
      pulso: 0
    };
    this.mv = {
      iso: D.ISOTOPOS[0],
      m0: 100,
      t: 0,
      ordem: this._shuffle100()
    };
    this.cd = {
      nucleos: [],
      neutrons: [],
      ctrl: 50,
      fissoes: 0,
      emitidos: 0,
      flashes: [],
      iniciado: false
    };
    // ── modo 4: equacoes nucleares (Soddy) ──
    // Z e A comecam DESLOCADOS do valor certo de proposito: o exercicio e
    // chegar la, nao conferir uma resposta ja posta.
    this.sod = {
      idx: 0,
      z: 88,
      a: 230
    };
    // ── modo 5: datacao radioativa ──
    this.dat = {
      metodo: D.METODOS_DATACAO[0],
      frac: 50
    };
    // ── modo 6: serie radioativa do U-238 ──
    this.ser = {
      passo: 0,
      auto: false,
      tAuto: 0
    };
    this._cdInit();
  }
  _shuffle100() {
    const a = Array.from({
      length: 100
    }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  _cdInit() {
    const C = this.cd;
    C.nucleos = [];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) {
      C.nucleos.push({
        gx: c,
        gy: r,
        vivo: true
      });
    }
    C.neutrons = [];
    C.fissoes = 0;
    C.emitidos = 0;
    C.flashes = [];
    C.iniciado = false;
  }
  build() {
    SIRAD.fillOptGrid('meia-grid', this.D.ISOTOPOS.map(i => ({
      value: i.id,
      nome: `${i.nome} ${i.simb}`,
      dot: i.cor,
      extra: `t½ ${i.meia}`,
      aria: `${i.nome}, meia-vida de ${i.meia}. Uso: ${i.uso}`
    })), this.mv.iso.id);
    // ── modo 4: lista de decaimentos a completar ──
    SIRAD.fillOptGrid('soddy-grid', this.D.DESAFIOS_SODDY.map((d, i) => {
      const p = this.D.PARTICULAS.find(q => q.id === d.part);
      return {
        value: String(i),
        nome: `${d.pai.s}-${d.pai.A}`,
        dot: p.cor,
        extra: p.rot.split(' ')[0],
        aria: `${d.pai.s} ${d.pai.A} emitindo ${p.rot}. ${d.ctx}`
      };
    }), '0');
    // ── modo 5: metodos de datacao ──
    SIRAD.fillOptGrid('dat-grid', this.D.METODOS_DATACAO.map(m => ({
      value: m.id,
      nome: m.nome,
      dot: m.cor,
      extra: this._fmtAnos(m.t12a),
      aria: `${m.nome}, par ${m.par}, meia-vida de ${this._fmtAnos(m.t12a)}. Serve para datar ${m.alvo}.`
    })), this.dat.metodo.id);
    this._sodSyncSliders();
    this._serNota();
  }

  /** Ajusta a faixa dos sliders de Z e A à ordem de grandeza do desafio atual.
   *  Sem isto, procurar Z = 7 (carbono-14 → nitrogênio) num slider que vai até
   *  95 seria um exercício de paciência, não de química. */
  _sodSyncSliders() {
    const d = this._sodDesafio();
    const zEl = document.getElementById('sod-z');
    const aEl = document.getElementById('sod-a');
    if (zEl) {
      zEl.min = Math.max(1, d.pai.Z - 6);
      zEl.max = d.pai.Z + 4;
      zEl.value = this.sod.z;
    }
    if (aEl) {
      aEl.min = Math.max(1, d.pai.A - 10);
      aEl.max = d.pai.A + 4;
      aEl.value = this.sod.a;
    }
    if (this.app) {
      this.app.syncSlider('sod-z', this.sod.z);
      this.app.syncSlider('sod-a', this.sod.a);
    }
  }

  /** Escreve a nota da etapa atual da série no painel lateral. */
  _serNota() {
    const el = document.getElementById('ser-nota');
    if (!el) return;
    const r = this._serCalc();
    el.textContent = r.atual.nota || `${r.atual.s}-${r.atual.A} · meia-vida de ${r.atual.meia}` + (r.part ? `, emite ${r.part.rot}.` : '.');
  }
  setMode(id) {
    this.mode = id;
  }
  setParam(k, v) {
    const E = this.em,
      M = this.mv,
      C = this.cd;
    switch (k) {
      case 'cenario':
        {
          E.cenario = v;
          E.fase = 0;
          return {
            say: v === 'barreiras' ? 'Cenário: barreiras de papel, alumínio e chumbo.' : 'Cenário: campo elétrico entre placas positiva e negativa.'
          };
        }
      case 'isotopo':
        {
          M.iso = this.D.ISOTOPOS.find(i => i.id === v) || M.iso;
          return {
            say: `${M.iso.nome} selecionado. Meia-vida: ${M.iso.meia}. ${M.iso.uso}.`
          }; // t½ numérica em iso.t12s alimenta λ e a atividade
        }
      case 'mvM0':
        M.m0 = v;
        return;
      case 'mvT':
        M.t = v;
        return;
      case 'cadCtrl':
        C.ctrl = v;
        return;

      /* ── modo 4: equacoes nucleares ── */
      case 'sodDesafio':
        {
          const i = SIRAD.clamp(parseInt(v, 10) || 0, 0, this.D.DESAFIOS_SODDY.length - 1);
          this.sod.idx = i;
          const d = this._sodDesafio(),
            p = this._sodParticula();
          // recoloca o palpite longe da resposta, para o exercicio continuar sendo exercicio
          this.sod.z = SIRAD.clamp(d.filho.Z + (p.dz >= 0 ? 3 : -3), 1, 95);
          this.sod.a = SIRAD.clamp(d.filho.A + 4, 1, 245);
          this._sodSyncSliders();
          return {
            say: `${d.pai.s} ${d.pai.A} emitindo ${p.rot}. ${d.ctx} Ajuste Z e A do produto até as duas somas fecharem.`
          };
        }
      case 'sodZ':
        this.sod.z = Math.round(v);
        return;
      case 'sodA':
        this.sod.a = Math.round(v);
        return;

      /* ── modo 5: datacao ── */
      case 'datMetodo':
        {
          this.dat.metodo = this.D.METODOS_DATACAO.find(m => m.id === v) || this.dat.metodo;
          const m = this.dat.metodo;
          return {
            say: `${m.nome}, par ${m.par}. Meia-vida de ${this._fmtAnos(m.t12a)}. Serve para datar ${m.alvo}. ${m.nota}`
          };
        }
      case 'datFrac':
        this.dat.frac = v;
        return;

      /* ── modo 6: serie radioativa ── */
      case 'serPasso':
        {
          this.ser.passo = Math.round(v);
          this.ser.auto = false;
          this._serNota();
          const r = this._serCalc();
          return {
            say: `Etapa ${r.i}: ${r.atual.s} ${r.atual.A}, meia-vida de ${r.atual.meia}.` + (r.part ? ` Emite ${r.part.rot}.` : ' Núcleo estável — fim da série.')
          };
        }
    }
  }
  action(name, el) {
    const E = this.em,
      M = this.mv,
      C = this.cd;
    if (name === 'emitir') {
      E.fase = 0;
      E.pulso++;
      if (SIRAD.isReduced()) E.fase = 1.2;
      SIRAD.playTone(700, .08, .06);
      SIRAD.announce(E.cenario === 'barreiras' ? 'Pulso emitido: alfa para no papel, beta no alumínio e gama atravessa até o chumbo.' : 'Pulso emitido: alfa desvia para a placa negativa, beta para a positiva e gama segue reto.');
    } else if (name === 'mv-sortear') {
      M.ordem = this._shuffle100();
      SIRAD.playTone(660, .08, .05);
      const r = this._mvCalc();
      SIRAD.announce(`Novo sorteio da amostra. Restam ${SIRAD.fmt(r.frac * 100, 1)} por cento dos núcleos após ${SIRAD.fmt(M.t, 1)} meias-vidas, ou seja, ${r.tRealTxt}. Atividade de ${r.atvBq.toExponential(2)} becquerels.`);
    } else if (name === 'mv-reset') {
      M.t = 0;
      M.m0 = 100;
      this.app.syncSlider('mv-t', 0);
      this.app.syncSlider('mv-m0', 100);
      SIRAD.playTone(440, .07, .05);
      SIRAD.announce('Amostra restaurada: 100 gramas, tempo zero.');
    } else if (name === 'disparar') {
      C.iniciado = true;
      C.neutrons.push({
        x: 0,
        y: .5 + (Math.random() - .5) * .3,
        vx: .34,
        vy: (Math.random() - .5) * .12
      });
      SIRAD.playTone(700, .08, .06);
      SIRAD.announce('Nêutron disparado contra o combustível de urânio-235.');
    } else if (name === 'cad-reset') {
      this._cdInit();
      SIRAD.playTone(440, .07, .05);
      SIRAD.announce('Combustível novo: todos os núcleos de urânio restaurados.');

      /* ══════════ modo 4 — equacoes nucleares ══════════ */
    } else if (name === 'sod-conferir') {
      const c = this._sodCalc();
      if (c.ok) {
        SIRAD.playTone(660, .09, .07);
        setTimeout(() => SIRAD.playTone(880, .12, .07), 110);
        return SIRAD.announce(`Correto! ${c.d.pai.s} ${c.d.pai.A} emitindo ${c.p.rot} produz ${c.d.filho.s} ${c.d.filho.A}. As duas somas fecham: massa ${c.d.pai.A} igual a ${c.somaA}, e número atômico ${c.d.pai.Z} igual a ${c.somaZ}. ${c.d.ctx}`, 'assertive');
      }
      SIRAD.playTone(300, .12, .06);
      // Diz QUAL conservacao falhou — e a informacao que permite corrigir.
      const partes = [];
      if (!c.okA) partes.push(`a soma das MASSAS não fecha: à esquerda ${c.d.pai.A}, à direita ${c.somaA}`);
      if (!c.okZ) partes.push(`a soma dos números ATÔMICOS não fecha: à esquerda ${c.d.pai.Z}, à direita ${c.somaZ}`);
      return SIRAD.announce(`Ainda não. ${partes.join('; e ')}. Lembre: a emissão ${c.p.rot} leva embora ${c.p.da} de massa e ${c.p.dz} de carga, então ${c.p.efeito}.`, 'assertive');
    } else if (name === 'sod-resolver') {
      const c = this._sodCalc();
      this.sod.z = c.zCerto;
      this.sod.a = c.aCerto;
      this._sodSyncSliders();
      SIRAD.playTone(520, .1, .06);
      return SIRAD.announce(`Solução: o produto é ${c.d.filho.s} ${c.d.filho.A}, com Z igual a ${c.d.filho.Z}. Veio de ${c.p.efeito}. ${c.d.ctx}`, 'assertive');
    } else if (name === 'sod-proximo') {
      const n = (this.sod.idx + 1) % this.D.DESAFIOS_SODDY.length;
      const r = this.setParam('sodDesafio', String(n));
      SIRAD.playTone(700, .07, .05);
      return SIRAD.announce(r && r.say ? r.say : 'Próximo decaimento.');

      /* ══════════ modo 5 — datacao ══════════ */
    } else if (name === 'dat-status') {
      const r = this._datCalc();
      const aviso = r.dentro ? `Está dentro da faixa confiável do método. ${r.m.nota}` : r.tarde ? 'ATENÇÃO: essa idade está ACIMA da faixa confiável — praticamente não resta isótopo para medir. Use um método de meia-vida mais longa.' : 'ATENÇÃO: essa idade está ABAIXO da faixa confiável — sobrou isótopo demais, e a diferença seria menor que o erro do equipamento.';
      SIRAD.playTone(700, .08, .06);
      return SIRAD.announce(`${r.m.nome}. Restam ${SIRAD.fmt(r.frac * 100, 1)} por cento do isótopo, o que corresponde a ${SIRAD.fmt(r.nMeias, 3)} meias-vidas. Idade estimada: ${r.txt}. ${aviso}`, 'assertive');
    } else if (name === 'dat-set') {
      const v = el && parseFloat(el.dataset.frac);
      if (!isFinite(v)) return;
      this.dat.frac = v;
      this.app.syncSlider('dat-frac', v);
      const r = this._datCalc();
      SIRAD.playTone(760, .07, .05);
      return SIRAD.announce(`Fração restante posta em ${SIRAD.fmt(v, 2)} por cento, ou seja ${SIRAD.fmt(r.nMeias, 0)} meias-vidas. Idade: ${r.txt}.`);

      /* ══════════ modo 6 — serie radioativa ══════════ */
    } else if (name === 'ser-avancar' || name === 'ser-voltar') {
      const d = name === 'ser-avancar' ? 1 : -1;
      const antes = this._serCalc();
      this.ser.passo = SIRAD.clamp(this.ser.passo + d, 0, this.D.SERIE_U238.length - 1);
      this.ser.auto = false;
      this.app.syncSlider('ser-passo', this.ser.passo);
      this._serNota();
      const r = this._serCalc();
      if (r.i === antes.i) {
        SIRAD.playTone(300, .1, .05);
        return SIRAD.announce(d > 0 ? 'A série já terminou: o chumbo-206 é estável e não decai mais.' : 'Já estamos no urânio-238, o início da série.');
      }
      SIRAD.playTone(d > 0 ? 620 : 480, .07, .05);
      const via = d > 0 && antes.part ? ` Foi por emissão ${antes.part.rot}: ${antes.part.efeito}.` : '';
      return SIRAD.announce(`Etapa ${r.i}: ${r.atual.s} ${r.atual.A}.${via} Meia-vida de ${r.atual.meia}. Já saíram ${r.na} alfa e ${r.nb} beta. ${r.atual.nota || ''}`, 'assertive');
    } else if (name === 'ser-auto') {
      this.ser.auto = !this.ser.auto;
      this.ser.tAuto = 0;
      if (this.ser.auto && this._serCalc().fim) {
        this.ser.passo = 0;
        this.app.syncSlider('ser-passo', 0);
      }
      SIRAD.playTone(this.ser.auto ? 760 : 420, .08, .05);
      return SIRAD.announce(this.ser.auto ? 'Percorrendo a série sozinho, uma etapa por segundo. Acompanhe o ziguezague no gráfico.' : 'Percurso automático pausado.');
    } else if (name === 'ser-reset') {
      this.ser.passo = 0;
      this.ser.auto = false;
      this.app.syncSlider('ser-passo', 0);
      this._serNota();
      SIRAD.playTone(440, .07, .05);
      return SIRAD.announce('De volta ao urânio-238, o início da série.');
    }
  }

  /* ── contas ── */

  /* Escreve uma quantidade de tempo em segundos na unidade que faz sentido
     para a grandeza — de segundos a bilhoes de anos. Sem isto, a datacao do
     U-238 apareceria como 1,4e17 s, que nao diz nada a ninguem. */
  _fmtTempo(seg) {
    const S = this.D.SEG;
    if (!isFinite(seg) || seg <= 0) return '0 s';
    if (seg < 60) return `${SIRAD.fmt(seg, 1)} s`;
    if (seg < S.h) return `${SIRAD.fmt(seg / 60, 1)} min`;
    if (seg < S.d) return `${SIRAD.fmt(seg / S.h, 2)} h`;
    if (seg < S.a) return `${SIRAD.fmt(seg / S.d, 1)} dias`;
    const anos = seg / S.a;
    if (anos < 1e3) return `${SIRAD.fmt(anos, 2)} anos`;
    if (anos < 1e6) return `${SIRAD.fmt(anos, 0)} anos`;
    if (anos < 1e9) return `${SIRAD.fmt(anos / 1e6, 2)} milhões de anos`;
    return `${SIRAD.fmt(anos / 1e9, 2)} bilhões de anos`;
  }

  /* CORRECAO CENTRAL DO SIRAD.
     Antes: `_mvCalc()` devolvia apenas a fracao restante, e o tempo era
     contado em multiplos de t½ — grandeza ADIMENSIONAL. Todos os isotopos
     se comportavam igual: o Tc-99m (6 h) e o U-238 (4,47 bilhoes de anos)
     produziam exatamente os mesmos numeros na tela.
      Agora o slider continua marcando o tempo em meias-vidas (que e o
     controle pedagogicamente natural, e mantem a curva sempre no mesmo
     enquadramento), mas TODAS as grandezas fisicas saem dele:
       t_real = n · t½                      (tempo de relogio)
       λ      = ln2 / t½                    (constante de desintegracao, s⁻¹)
       N      = (m / A) · N_A                (numero de nucleos)
       Atv    = λ · N                        (atividade, em Bq; /3,7e10 → Ci)
     Assim trocar de isotopo muda de fato a fisica, e nao so a cor. */
  _mvCalc() {
    const M = this.mv,
      iso = M.iso,
      D = this.D;
    const frac = Math.pow(.5, M.t);
    const resto = M.m0 * frac;
    const t12s = iso.t12s || 1;
    const lambda = Math.LN2 / t12s; // s⁻¹
    const tReal = M.t * t12s; // segundos decorridos
    // numero de nucleos ainda ativos: massa restante / massa molar × N_A
    const N = iso.A ? resto / iso.A * D.NA : 0;
    const atvBq = lambda * N; // desintegracoes por segundo

    return {
      frac,
      resto,
      vivos: Math.round(100 * frac),
      lambda,
      tReal,
      N,
      atvBq,
      atvCi: atvBq / D.BQ_CI,
      tRealTxt: this._fmtTempo(tReal),
      t12Txt: this._fmtTempo(t12s)
    };
  }
  _cdK() {
    return this.D.FISSAO.neutronsPorFissao * (1 - this.cd.ctrl / 100);
  }
  _cdRegime() {
    const k = this._cdK();
    if (k < .92) return {
      rot: 'subcrítica',
      cor: '--accent-endo',
      det: 'a reação se apaga'
    };
    if (k <= 1.12) return {
      rot: 'crítica',
      cor: '--accent-ok',
      det: 'reator estável'
    };
    return {
      rot: 'supercrítica',
      cor: '--accent-exo',
      det: 'crescimento explosivo'
    };
  }
  update(dt) {
    const E = this.em,
      C = this.cd;
    if (E.fase < 1.2) E.fase = Math.min(1.2, E.fase + dt * .55);
    // serie radioativa em percurso automatico: uma etapa por segundo
    if (this.mode === 'serie' && this.ser.auto) {
      this.ser.tAuto += dt;
      if (this.ser.tAuto >= 1) {
        this.ser.tAuto = 0;
        const ultimo = this.D.SERIE_U238.length - 1;
        if (this.ser.passo >= ultimo) {
          this.ser.auto = false;
          SIRAD.announce('Série concluída: chegamos ao chumbo-206, que é estável. Foram 8 emissões alfa e 6 beta.', 'assertive');
        } else {
          this.ser.passo++;
          if (this.app) this.app.syncSlider('ser-passo', this.ser.passo);
          this._serNota();
          SIRAD.playTone(560 + this.ser.passo * 18, .05, .04);
        }
      }
    }
    // fissão em cadeia (coordenadas normalizadas 0..1)
    if (C.neutrons.length) {
      const vivos = C.nucleos.filter(n => n.vivo);
      for (let i = C.neutrons.length - 1; i >= 0; i--) {
        const n = C.neutrons[i];
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.y < .04 || n.y > .96) n.vy *= -1;
        if (n.x < -.05 || n.x > 1.05) {
          C.neutrons.splice(i, 1);
          continue;
        }
        for (const u of vivos) {
          if (!u.vivo) continue;
          const ux = .14 + u.gx * .09,
            uy = .12 + u.gy * .15;
          if (Math.hypot(n.x - ux, n.y - uy) < .035) {
            u.vivo = false;
            C.fissoes++;
            C.flashes.push({
              x: ux,
              y: uy,
              ttl: .5
            });
            C.neutrons.splice(i, 1);
            for (let e = 0; e < this.D.FISSAO.neutronsPorFissao; e++) {
              C.emitidos++;
              if (Math.random() * 100 >= C.ctrl && C.neutrons.length < 90) {
                const a = Math.random() * Math.PI * 2;
                C.neutrons.push({
                  x: ux,
                  y: uy,
                  vx: Math.cos(a) * .3,
                  vy: Math.sin(a) * .3
                });
              }
            }
            SIRAD.playTone(520 + Math.random() * 240, .05, .03);
            break;
          }
        }
      }
      if (C.iniciado && !C.neutrons.length && C.fissoes) {
        C.iniciado = false;
        SIRAD.announce(`Reação encerrada: ${C.fissoes} fissões. Regime ${this._cdRegime().rot}.`, 'assertive');
      }
    }
    C.flashes.forEach(f => f.ttl -= dt);
    C.flashes = C.flashes.filter(f => f.ttl > 0);
  }

  /* ── desenho ── */
  draw(ctx, W, H, app) {
    if (this.mode === 'emissoes') this._dEmis(ctx, W, H, app);else if (this.mode === 'meiavida') this._dMeia(ctx, W, H);else if (this.mode === 'soddy') this._dSoddy(ctx, W, H);else if (this.mode === 'datacao') this._dDatacao(ctx, W, H);else if (this.mode === 'serie') this._dSerie(ctx, W, H);else this._dCadeia(ctx, W, H);
  }
  _fonte(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = SIRAD.cssVar('--bg-hover');
    ctx.strokeStyle = SIRAD.cssVar('--border-glow');
    ctx.lineWidth = 2;
    SIRAD.kRound(ctx, x - 22, y - 30, 44, 60, 8);
    ctx.fill();
    ctx.stroke();
    // trifólio
    ctx.fillStyle = SIRAD.cssVar('--accent-main');
    for (let i = 0; i < 3; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / 3 - .5,
        a1 = a0 + 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, 13, a0, a1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    SIRAD.kLabel(ctx, 'fonte', x, y + 42, {
      size: 10,
      color: SIRAD.cssVar('--text-secondary')
    });
  }
  _dEmis(ctx, W, H, app) {
    const E = this.em,
      D = this.D.EMISSOES;
    const x0 = W * .13,
      y0 = H * .5;
    this._fonte(ctx, x0, y0);
    const prog = SIRAD.clamp(E.fase, 0, 1);
    if (E.cenario === 'barreiras') {
      const bx = [W * .38, W * .6, W * .82];
      const nomes = ['papel', 'alumínio', 'chumbo'];
      const esp = [3, 7, 16];
      bx.forEach((x, i) => {
        ctx.save();
        ctx.fillStyle = SIRAD.cssVar('--glass');
        ctx.fillRect(x - esp[i] / 2, H * .16, esp[i], H * .68);
        ctx.restore();
        SIRAD.kLabel(ctx, nomes[i], x, H * .1, {
          size: 11,
          color: SIRAD.cssVar('--text-secondary'),
          bold: true
        });
      });
      const ys = [y0 - H * .18, y0, y0 + H * .18];
      const fim = [bx[0], bx[1], W * .94]; // onde cada emissão para
      D.forEach((e, i) => {
        const xEnd = x0 + 26 + (fim[i] - x0 - 26) * prog;
        ctx.save();
        ctx.strokeStyle = e.cor;
        ctx.lineWidth = i === 0 ? 4 : i === 1 ? 2.4 : 2;
        if (i === 2) ctx.setLineDash([7, 5]);
        ctx.globalAlpha = .9;
        ctx.beginPath();
        ctx.moveTo(x0 + 26, ys[i]);
        if (i === 2) {
          // gama ondulada
          for (let x = x0 + 26; x <= xEnd; x += 6) ctx.lineTo(x, ys[i] + Math.sin(x * .12 + app.time * 6) * 4);
        } else ctx.lineTo(xEnd, ys[i]);
        ctx.stroke();
        ctx.setLineDash([]);
        // partícula na frente
        ctx.fillStyle = e.cor;
        ctx.beginPath();
        ctx.arc(Math.min(xEnd, fim[i]), ys[i] + (i === 2 ? Math.sin(xEnd * .12 + app.time * 6) * 4 : 0), i === 0 ? 5 : 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        SIRAD.kLabel(ctx, `${e.nome} ${e.simb}`, x0 + 52, ys[i] - 14, {
          size: 11,
          color: e.cor,
          bold: true,
          align: 'left'
        });
        if (prog >= (fim[i] - x0) / (W * .94 - x0) || prog >= .99) {
          if (i < 2) SIRAD.kChip(ctx, 'barrada', fim[i] + 4, ys[i] + 18, {
            fg: e.cor,
            size: 10
          });else SIRAD.kChip(ctx, 'atenuada, atravessa', W * .86, ys[i] + 20, {
            fg: e.cor,
            size: 10
          });
        }
      });
    } else {
      // campo elétrico: placa + em cima, − embaixo
      ctx.save();
      ctx.fillStyle = SIRAD.cssVar('--accent-exo');
      ctx.fillRect(W * .32, H * .12, W * .5, 6);
      ctx.fillStyle = SIRAD.cssVar('--accent-endo');
      ctx.fillRect(W * .32, H * .86, W * .5, 6);
      ctx.restore();
      SIRAD.kLabel(ctx, 'placa positiva (+)', W * .57, H * .08, {
        size: 11,
        color: SIRAD.cssVar('--accent-exo'),
        bold: true
      });
      SIRAD.kLabel(ctx, 'placa negativa (−)', W * .57, H * .93, {
        size: 11,
        color: SIRAD.cssVar('--accent-endo'),
        bold: true
      });
      const curvas = [{
        e: D[0],
        k: .22
      },
      // alfa: desvio pequeno p/ baixo (placa −)
      {
        e: D[2],
        k: 0
      },
      // gama: reto
      {
        e: D[1],
        k: -.62
      } // beta: desvio grande p/ cima (placa +)
      ];
      curvas.forEach(c => {
        ctx.save();
        ctx.strokeStyle = c.e.cor;
        ctx.lineWidth = c.e.id === 'alfa' ? 4 : 2.4;
        if (c.e.id === 'gama') ctx.setLineDash([7, 5]);
        ctx.beginPath();
        const steps = 40;
        for (let s = 0; s <= steps * prog; s++) {
          const t = s / steps,
            x = x0 + 26 + t * (W * .68);
          const y = y0 + c.k * t * t * H * .5;
          s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        const t = prog,
          fx = x0 + 26 + t * (W * .68),
          fy = y0 + c.k * t * t * H * .5;
        ctx.fillStyle = c.e.cor;
        ctx.beginPath();
        ctx.arc(fx, fy, c.e.id === 'alfa' ? 5 : 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        SIRAD.kLabel(ctx, c.e.nome, fx + 8, fy - 10, {
          size: 11,
          color: c.e.cor,
          bold: true,
          align: 'left'
        });
      });
      // ANTES: este rotulo saia pelas duas bordas em canvas de 380 px
      // (texto longo, fonte fixa, centrado em W*.55). Agora quebra em duas
      // linhas quando a tela e estreita.
      if (SIRAD.isEstreito(W)) {
        SIRAD.kLabel(ctx, 'β é ~7.000× mais leve que α:', W / 2, H * .76, {
          size: 10,
          color: SIRAD.cssVar('--text-secondary'),
          maxW: W - 24
        });
        SIRAD.kLabel(ctx, 'mesmo com carga −1, desvia muito mais', W / 2, H * .82, {
          size: 10,
          color: SIRAD.cssVar('--text-secondary'),
          maxW: W - 24
        });
      } else {
        SIRAD.kLabel(ctx, 'β é ~7.000× mais leve que α: mesmo com carga −1, desvia muito mais', W * .55, H * .78, {
          size: 10,
          color: SIRAD.cssVar('--text-secondary'),
          maxW: W * .86
        });
      }
    }
  }
  _dMeia(ctx, W, H) {
    const M = this.mv,
      r = this._mvCalc();
    // grade 10×10 de átomos à esquerda
    // ANTES: `Math.min(W * .38, H * .7) / 10` — em celular cada nucleo ficava
    // com ~4 px de raio, indistinguivel. Em tela estreita a grade agora usa
    // a largura quase toda e a curva desce para baixo dela.
    const est = SIRAD.isEstreito(W);
    const gx0 = est ? W * .10 : W * .07;
    const gy0 = est ? H * .07 : H * .14;
    const cell = est ? Math.min(W * .80, H * .40) / 10 : Math.min(W * .40, H * .70) / 10;
    const decaidos = new Set(M.ordem.slice(0, 100 - r.vivos));
    for (let i = 0; i < 100; i++) {
      const x = gx0 + i % 10 * cell + cell / 2,
        y = gy0 + Math.floor(i / 10) * cell + cell / 2;
      const morto = decaidos.has(i);
      ctx.save();
      ctx.fillStyle = morto ? SIRAD.cssVar('--text-muted') : M.iso.cor;
      ctx.globalAlpha = morto ? .38 : .95;
      ctx.beginPath();
      ctx.arc(x, y, cell * .3, 0, Math.PI * 2);
      ctx.fill();
      if (morto) {
        ctx.strokeStyle = SIRAD.cssVar('--text-muted');
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = .8;
        ctx.beginPath();
        ctx.moveTo(x - cell * .18, y - cell * .18);
        ctx.lineTo(x + cell * .18, y + cell * .18);
        ctx.moveTo(x + cell * .18, y - cell * .18);
        ctx.lineTo(x - cell * .18, y + cell * .18);
        ctx.stroke();
      }
      ctx.restore();
    }
    SIRAD.kLabel(ctx, `${r.vivos} de 100 núcleos ativos`, gx0 + cell * 5, gy0 + cell * 10 + 16, {
      size: 11,
      color: M.iso.cor,
      bold: true
    });
    // curva exponencial à direita
    const m = SIRAD.kAxes(ctx, {
      x: est ? W * .16 : W * .56,
      y: est ? gy0 + cell * 10 + 42 : H * .12,
      w: est ? W * .76 : W * .38,
      h: est ? Math.max(90, H * .88 - (gy0 + cell * 10 + 42)) : H * .62,
      xmin: 0,
      xmax: 6,
      ymin: 0,
      ymax: 100,
      xticks: [0, 1, 2, 3, 4, 5, 6],
      yticks: [0, 25, 50, 75, 100],
      xlab: 'tempo (meias-vidas)',
      ylab: '% restante'
    });
    const pts = [];
    for (let t = 0; t <= 6.001; t += .1) pts.push([t, Math.pow(.5, t) * 100]);
    SIRAD.kLine(ctx, pts, m.px, m.py, {
      color: M.iso.cor,
      w: 2.6
    });
    [1, 2, 3].forEach(n => SIRAD.kLabel(ctx, `${SIRAD.fmt(100 / Math.pow(2, n), 1)}%`, m.px(n) + 4, m.py(100 / Math.pow(2, n)) - 9, {
      size: 9,
      color: SIRAD.cssVar('--text-muted'),
      mono: true,
      align: 'left'
    }));
    ctx.save();
    ctx.fillStyle = SIRAD.cssVar('--accent-amber');
    ctx.beginPath();
    ctx.arc(m.px(M.t), m.py(r.frac * 100), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    SIRAD.kChip(ctx, `${SIRAD.fmt(r.frac * 100, 1)} % · ${SIRAD.fmt(r.resto, 1)} g`, m.px(M.t), m.py(r.frac * 100) - 20, {
      fg: SIRAD.cssVar('--accent-amber'),
      bold: true,
      size: 11,
      border: SIRAD.cssVar('--accent-amber')
    });
    // ANTES: `t = 1,0 t½` — numero sem unidade, igual para todo isotopo.
    // Agora mostra o tempo de RELOGIO correspondente e a atividade medida.
    SIRAD.kLabel(ctx, `${M.iso.nome} · t½ = ${M.iso.meia} · decorrido: ${r.tRealTxt}`, W / 2, H * .93, {
      size: 11,
      color: SIRAD.cssVar('--text-secondary')
    });
    SIRAD.kLabel(ctx, `atividade ≈ ${r.atvBq.toExponential(2)} Bq  ·  λ = ${r.lambda.toExponential(2)} s⁻¹`, W / 2, H * .985, {
      size: 10,
      color: SIRAD.cssVar('--text-muted'),
      mono: true
    });
  }
  _dCadeia(ctx, W, H) {
    const C = this.cd,
      reg = this._cdRegime();
    // caixa do combustível
    ctx.save();
    ctx.strokeStyle = SIRAD.cssVar('--glass');
    ctx.lineWidth = 2.4;
    ctx.strokeRect(W * .05, H * .05, W * .9, H * .82);
    ctx.restore();
    // barras de controle (opacidade ∝ controle)
    ctx.save();
    ctx.globalAlpha = .1 + .55 * C.ctrl / 100;
    ctx.fillStyle = SIRAD.cssVar('--text-muted');
    for (let i = 1; i <= 4; i++) ctx.fillRect(W * (.05 + i * .18) - 4, H * .05, 8, H * .82 * (C.ctrl / 100));
    ctx.restore();
    // núcleos
    C.nucleos.forEach(u => {
      const x = W * (.05 + .9 * (.14 + u.gx * .09)),
        y = H * (.05 + .82 * (.12 + u.gy * .15));
      ctx.save();
      if (u.vivo) {
        ctx.fillStyle = SIRAD.cssVar('--accent-main');
        ctx.globalAlpha = .92;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.globalAlpha = .5;
      } else {
        ctx.fillStyle = SIRAD.cssVar('--text-muted');
        ctx.globalAlpha = .5;
        ctx.beginPath();
        ctx.arc(x - 5, y + 3, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 5, y - 3, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
    // flashes de fissão
    C.flashes.forEach(f => {
      ctx.save();
      ctx.strokeStyle = SIRAD.cssVar('--accent-amber');
      ctx.globalAlpha = f.ttl * 1.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(W * (.05 + .9 * f.x), H * (.05 + .82 * f.y), (1 - f.ttl) * 26 + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    // nêutrons
    ctx.save();
    ctx.fillStyle = '#ffffff';
    C.neutrons.forEach(n => {
      ctx.beginPath();
      ctx.arc(W * (.05 + .9 * n.x), H * (.05 + .82 * n.y), 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    SIRAD.kChip(ctx, `k ≈ ${SIRAD.fmt(this._cdK(), 1)} · reação ${reg.rot}`, W / 2, H * .93, {
      fg: SIRAD.cssVar(reg.cor),
      bold: true,
      size: 12,
      border: SIRAD.cssVar(reg.cor)
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     MODO 4 — EQUAÇÕES NUCLEARES (Leis de Soddy)
     ══════════════════════════════════════════════════════════════════
     As duas leis existiam no simulador apenas como frase de texto no campo
     `efeito` das emissoes. Aqui elas viram exercicio: o aluno ajusta Z e A do
     produto e o simulador confere as DUAS conservacoes SEPARADAMENTE, dizendo
     qual falhou — porque "errou" nao ajuda ninguem, e "a massa fecha mas o
     numero atomico nao" ajuda muito.
  ══════════════════════════════════════════════════════════════════ */

  _sodDesafio() {
    return this.D.DESAFIOS_SODDY[this.sod.idx];
  }
  _sodParticula() {
    return this.D.PARTICULAS.find(p => p.id === this._sodDesafio().part);
  }

  /** Confere as duas conservações e devolve o diagnóstico separado. */
  _sodCalc() {
    const d = this._sodDesafio(),
      p = this._sodParticula(),
      S = this.sod;
    // ΣA e ΣZ do lado DIREITO com o palpite atual (produto + partícula emitida)
    const somaA = S.a + p.da;
    const somaZ = S.z + p.dz;
    const okA = somaA === d.pai.A;
    const okZ = somaZ === d.pai.Z;
    return {
      d,
      p,
      okA,
      okZ,
      ok: okA && okZ,
      somaA,
      somaZ,
      zCerto: d.pai.Z - p.dz,
      aCerto: d.pai.A - p.da,
      // símbolo do elemento: só revelado quando Z está certo — o simbolo é
      // consequência do Z, não uma informação separada a ser decorada
      simb: S.z === d.filho.Z ? d.filho.s : '?'
    };
  }

  /* ══════════════════════════════════════════════════════════════════
     MODO 5 — DATAÇÃO RADIOATIVA
     ══════════════════════════════════════════════════════════════════
     Só possível porque a meia-vida deixou de ser string e virou número
     (ver dadosradioatividade.js). t = t½ · log₂(N₀/N).
  ══════════════════════════════════════════════════════════════════ */

  _datCalc() {
    const S = this.dat,
      m = S.metodo;
    const frac = SIRAD.clamp(S.frac / 100, 1e-6, 0.999999);
    // t = t½ · log₂(1/frac) — a forma que o aluno usa na prova
    const nMeias = Math.log2(1 / frac);
    const idade = m.t12a * nMeias;
    const [fmin, fmax] = m.faixa;
    return {
      m,
      frac,
      nMeias,
      idade,
      dentro: idade >= fmin && idade <= fmax,
      cedo: idade < fmin,
      // sobrou isótopo demais: a diferença é menor que o erro
      tarde: idade > fmax,
      // sobrou de menos: sinal indistinguível do ruído
      txt: this._fmtAnos(idade),
      lambda: Math.LN2 / m.t12a // por ano, aqui — é a unidade natural da datação
    };
  }

  /** Escreve uma quantidade de anos na escala legível. Separado de _fmtTempo
   *  (que recebe segundos) porque a datação trabalha em anos do começo ao fim. */
  _fmtAnos(a) {
    if (!isFinite(a) || a <= 0) return '0 anos';
    if (a < 1e3) return `${SIRAD.fmt(a, 0)} anos`;
    if (a < 1e6) return `${SIRAD.fmt(a / 1e3, 2)} mil anos`;
    if (a < 1e9) return `${SIRAD.fmt(a / 1e6, 2)} milhões de anos`;
    return `${SIRAD.fmt(a / 1e9, 2)} bilhões de anos`;
  }

  /* ══════════════════════════════════════════════════════════════════
     MODO 6 — SÉRIE RADIOATIVA DO URÂNIO-238
     ══════════════════════════════════════════════════════════════════ */

  _serCalc() {
    const S = this.ser,
      L = this.D.SERIE_U238;
    const i = SIRAD.clamp(Math.round(S.passo), 0, L.length - 1);
    const atual = L[i];
    // balanço acumulado até aqui: quantos α e quantos β já saíram
    let na = 0,
      nb = 0;
    for (let k = 0; k < i; k++) {
      if (L[k].emite === 'alfa') na++;else if (L[k].emite === 'beta') nb++;
    }
    return {
      i,
      atual,
      L,
      na,
      nb,
      total: L.length,
      dA: L[0].A - atual.A,
      dZ: L[0].Z - atual.Z,
      fim: i === L.length - 1,
      part: atual.emite ? this.D.PARTICULAS.find(p => p.id === atual.emite) : null
    };
  }

  /* ══════════════════════════════════════════════════════════════════
     DESENHO DOS TRÊS MODOS NOVOS
     ══════════════════════════════════════════════════════════════════ */

  _dSoddy(ctx, W, H) {
    const c = this._sodCalc(),
      d = c.d,
      p = c.p,
      est = SIRAD.isEstreito(W);
    const cy = est ? H * .30 : H * .34;

    // ── a equação, em tamanho grande ──
    // Notação de núclideo: A em cima, Z embaixo, à esquerda do símbolo.
    const escala = SIRAD.clamp(W / 900, .8, 1.6);
    const fs = (est ? 22 : 30) * escala;
    const nuclideo = (x, A, Z, simb, cor, destaque) => {
      ctx.save();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = cor;
      ctx.font = `700 ${fs * .46}px Consolas, monospace`;
      ctx.fillText(String(A), x - fs * .06, cy - fs * .30);
      ctx.fillText(String(Z), x - fs * .06, cy + fs * .30);
      ctx.textAlign = 'left';
      ctx.font = `700 ${fs}px Consolas, monospace`;
      ctx.fillText(simb, x, cy);
      if (destaque) {
        const w = ctx.measureText(simb).width;
        ctx.strokeStyle = cor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = .5;
        SIRAD.kRound(ctx, x - fs * .55, cy - fs * .62, w + fs * .68, fs * 1.24, 6);
        ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.font = `700 ${fs}px Consolas, monospace`;
      const larg = ctx.measureText(simb).width + fs * .55;
      ctx.restore();
      return x + larg;
    };
    const larguraTotal = est ? W * .92 : W * .7;
    let x = (W - larguraTotal) / 2 + fs * .5;
    x = nuclideo(x, d.pai.A, d.pai.Z, d.pai.s, SIRAD.cssVar('--text-primary', '#e6f0fa'), false);
    ctx.save();
    ctx.fillStyle = SIRAD.cssVar('--text-secondary');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `${fs * .8}px Consolas, monospace`;
    ctx.fillText('→', x, cy);
    x += fs * .95;
    ctx.restore();

    // o produto é o que o aluno está montando
    const corProd = c.ok ? SIRAD.cssVar('--accent-ok', '#4ade80') : c.okA || c.okZ ? SIRAD.cssVar('--accent-amber', '#fbbf24') : SIRAD.cssVar('--accent-exo', '#f87171');
    x = nuclideo(x, this.sod.a, this.sod.z, c.simb, corProd, true);
    ctx.save();
    ctx.fillStyle = SIRAD.cssVar('--text-secondary');
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = `${fs * .7}px Consolas, monospace`;
    ctx.fillText('+', x, cy);
    x += fs * .8;
    ctx.restore();
    nuclideo(x, p.da, -p.dz, p.id === 'alfa' ? 'α' : p.id === 'gama' ? 'γ' : 'e', p.cor, false);

    // ── as duas conservações, conferidas SEPARADAMENTE ──
    // É este detalhe que faz o modo ensinar: dizer só "errado" não corrige nada.
    let ty = cy + (est ? 62 : 84);
    const linha = (rot, esq, dir, ok) => {
      const cor = ok ? SIRAD.cssVar('--accent-ok', '#4ade80') : SIRAD.cssVar('--accent-exo', '#f87171');
      SIRAD.kLabel(ctx, rot, W / 2 - (est ? 100 : 150), ty, {
        size: est ? 11 : 13,
        align: 'left',
        bold: true,
        color: SIRAD.cssVar('--text-secondary')
      });
      SIRAD.kLabel(ctx, `${esq}  ${ok ? '=' : '≠'}  ${dir}`, W / 2 + (est ? 100 : 150), ty, {
        size: est ? 11 : 13,
        align: 'right',
        bold: true,
        mono: true,
        color: cor
      });
      (ok ? SIRAD.kIconCheck : SIRAD.kIconX)(ctx, W / 2 + (est ? 100 : 150) + 14, ty, est ? 13 : 15, cor);
      ty += est ? 22 : 28;
    };
    linha('Σ números de MASSA (A)', d.pai.A, c.somaA, c.okA);
    linha('Σ números ATÔMICOS (Z)', d.pai.Z, c.somaZ, c.okZ);

    // veredito e a pista útil
    ty += est ? 4 : 8;
    if (c.ok) {
      SIRAD.kChipIcon(ctx, SIRAD.kIconCheck, 'As duas conservações fecham — equação correta', W / 2, ty, {
        fg: SIRAD.cssVar('--accent-ok'),
        size: est ? 11 : 12,
        bold: true,
        border: SIRAD.cssVar('--accent-ok')
      });
    } else {
      const falta = !c.okA && !c.okZ ? 'as duas somas' : !c.okA ? 'a soma das MASSAS' : 'a soma dos números ATÔMICOS';
      SIRAD.kChip(ctx, `Ainda não fecha ${falta}`, W / 2, ty, {
        fg: SIRAD.cssVar('--accent-amber'),
        size: est ? 10 : 12,
        bold: true,
        border: SIRAD.cssVar('--accent-amber')
      });
    }
    ty += est ? 26 : 32;
    SIRAD.kLabel(ctx, `Emissão ${p.rot} → ${p.efeito}`, W / 2, ty, {
      size: est ? 10 : 12,
      bold: true,
      color: p.cor,
      maxW: W - 24
    });
    ty += est ? 18 : 22;
    SIRAD.kLabel(ctx, p.nota, W / 2, ty, {
      size: est ? 9 : 11,
      color: SIRAD.cssVar('--text-muted'),
      maxW: W - 24
    });
    ty += est ? 18 : 22;
    if (ty < H - 10) SIRAD.kLabel(ctx, d.ctx, W / 2, ty, {
      size: est ? 9 : 11,
      color: SIRAD.cssVar('--text-secondary'),
      maxW: W - 24
    });
  }
  _dDatacao(ctx, W, H) {
    const r = this._datCalc(),
      m = r.m,
      est = SIRAD.isEstreito(W);
    SIRAD.kLabel(ctx, `${m.nome}   ·   ${m.par}   ·   t½ = ${this._fmtAnos(m.t12a)}`, W / 2, est ? 20 : 28, {
      size: est ? 11 : 14,
      bold: true,
      color: m.cor,
      maxW: W - 16
    });

    // ── curva de decaimento com o ponto da amostra ──
    const gx = est ? 46 : 78;
    const gy = est ? 44 : 58;
    const gw = Math.max(160, W - gx - (est ? 24 : 44));
    const gh = Math.max(110, est ? H * .40 : H * .48);
    const A = SIRAD.kAxes(ctx, {
      x: gx,
      y: gy,
      w: gw,
      h: gh,
      xmin: 0,
      xmax: 8,
      ymin: 0,
      ymax: 100,
      xticks: [0, 1, 2, 3, 4, 5, 6, 7, 8],
      yticks: [0, 12.5, 25, 50, 100],
      fmty: v => SIRAD.fmt(v, 1),
      xlab: 'tempo (meias-vidas)',
      ylab: '% restante'
    });
    const pts = [];
    for (let t = 0; t <= 8.001; t += .08) pts.push([t, Math.pow(.5, t) * 100]);
    SIRAD.kLine(ctx, pts, A.px, A.py, {
      color: m.cor,
      w: 2.6
    });

    // linhas-guia das frações notáveis: é por elas que o aluno raciocina
    [[1, 50], [2, 25], [3, 12.5]].forEach(([n, pc]) => {
      ctx.save();
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = SIRAD.cssVar('--text-muted');
      ctx.globalAlpha = .55;
      ctx.beginPath();
      ctx.moveTo(A.px(0), A.py(pc));
      ctx.lineTo(A.px(n), A.py(pc));
      ctx.lineTo(A.px(n), A.py(0));
      ctx.stroke();
      ctx.restore();
      SIRAD.kLabel(ctx, `${pc} %`, A.px(0) - 6, A.py(pc), {
        size: 8,
        align: 'right',
        mono: true,
        color: SIRAD.cssVar('--text-muted')
      });
    });

    // ponto da amostra
    const cor = r.dentro ? SIRAD.cssVar('--accent-ok', '#4ade80') : SIRAD.cssVar('--accent-amber', '#fbbf24');
    if (r.nMeias <= 8) {
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = cor;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(A.px(r.nMeias), A.py(0));
      ctx.lineTo(A.px(r.nMeias), A.py(r.frac * 100));
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.fillStyle = cor;
      ctx.beginPath();
      ctx.arc(A.px(r.nMeias), A.py(r.frac * 100), est ? 5 : 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
      SIRAD.kChip(ctx, `${SIRAD.fmt(r.frac * 100, 1)} %`, SIRAD.clamp(A.px(r.nMeias), gx + 40, gx + gw - 40), A.py(r.frac * 100) - 20, {
        fg: cor,
        size: 10,
        bold: true
      });
    }

    // ── a idade, em destaque, e a conta que a produziu ──
    let ty = gy + gh + (est ? 34 : 46);
    SIRAD.kChip(ctx, `idade ≈ ${r.txt}`, W / 2, ty, {
      fg: cor,
      size: est ? 13 : 16,
      bold: true,
      border: cor
    });
    ty += est ? 24 : 30;
    SIRAD.kLabel(ctx, `t = t½ · log₂(N₀/N) = ${SIRAD.fmt(m.t12a, 0)} × log₂(100/${SIRAD.fmt(r.frac * 100, 1)}) = ${SIRAD.fmt(m.t12a, 0)} × ${SIRAD.fmt(r.nMeias, 3)}`, W / 2, ty, {
      size: est ? 9 : 11,
      mono: true,
      color: SIRAD.cssVar('--text-secondary'),
      maxW: W - 16
    });

    // ── barra da faixa confiável do método ──
    ty += est ? 22 : 28;
    if (ty + 40 < H) {
      const bx = est ? 30 : W * .12,
        bw = W - 2 * bx;
      // escala log de 100 anos a 50 bilhões de anos
      const lmin = 2,
        lmax = Math.log10(5e10);
      const px = a => bx + SIRAD.clamp((Math.log10(Math.max(1, a)) - lmin) / (lmax - lmin), 0, 1) * bw;
      ctx.save();
      ctx.fillStyle = SIRAD.cssVar('--bg-hover');
      SIRAD.kRound(ctx, bx, ty, bw, 14, 4);
      ctx.fill();
      ctx.fillStyle = SIRAD.cssVar('--accent-ok', '#4ade80');
      ctx.globalAlpha = .42;
      SIRAD.kRound(ctx, px(m.faixa[0]), ty, Math.max(3, px(m.faixa[1]) - px(m.faixa[0])), 14, 4);
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = r.dentro ? '#fff' : SIRAD.cssVar('--accent-exo', '#f87171');
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(px(r.idade), ty - 5);
      ctx.lineTo(px(r.idade), ty + 19);
      ctx.stroke();
      ctx.restore();
      SIRAD.kLabel(ctx, 'faixa confiável do método', bx + bw / 2, ty - 10, {
        size: 9,
        color: SIRAD.cssVar('--accent-ok'),
        maxW: bw
      });
      ty += 30;
      const aviso = r.dentro ? m.nota : r.tarde ? `Fora da faixa: com essa idade praticamente não resta ${m.nome.split('-')[0]}-${m.nome.split('-')[1]} para medir. Use um método de meia-vida mais longa.` : 'Fora da faixa: sobrou isótopo demais, e a diferença medida seria menor que o erro do equipamento.';
      if (ty < H - 8) SIRAD.kLabel(ctx, aviso, W / 2, ty, {
        size: est ? 9 : 10,
        color: r.dentro ? SIRAD.cssVar('--text-muted') : SIRAD.cssVar('--accent-amber'),
        maxW: W - 20
      });
    }
  }
  _dSerie(ctx, W, H) {
    const r = this._serCalc(),
      est = SIRAD.isEstreito(W);
    const L = r.L;
    SIRAD.kLabel(ctx, '²³⁸U  →  (8 α + 6 β⁻)  →  ²⁰⁶Pb', W / 2, est ? 18 : 26, {
      size: est ? 12 : 16,
      bold: true,
      color: SIRAD.cssVar('--text-primary')
    });

    // ── gráfico N × Z: onde o ziguezague aparece ──
    // Este é o motivo de o módulo existir: em N×Z, cada α é um passo diagonal
    // longo para baixo/esquerda e cada β⁻ um passo curto para cima/direita.
    const gx = est ? 44 : 76;
    const gy = est ? 40 : 54;
    const gw = Math.max(150, est ? W - gx - 24 : W * .52);
    const gh = Math.max(120, est ? H * .44 : H * .68);
    const Zs = L.map(x => x.Z),
      Ns = L.map(x => x.A - x.Z);
    const zmin = Math.min(...Zs) - 1,
      zmax = Math.max(...Zs) + 1;
    const nmin = Math.min(...Ns) - 2,
      nmax = Math.max(...Ns) + 2;
    const A2 = SIRAD.kAxes(ctx, {
      x: gx,
      y: gy,
      w: gw,
      h: gh,
      xmin: zmin,
      xmax: zmax,
      ymin: nmin,
      ymax: nmax,
      xticks: [82, 84, 86, 88, 90, 92],
      yticks: [124, 130, 136, 142, 146],
      fmtx: v => SIRAD.fmt(v, 0),
      fmty: v => SIRAD.fmt(v, 0),
      xlab: 'prótons (Z)',
      ylab: 'nêutrons (N)'
    });

    // trilha completa, apagada; o percorrido, aceso
    const ponto = i => [A2.px(L[i].Z), A2.py(L[i].A - L[i].Z)];
    ctx.save();
    ctx.strokeStyle = SIRAD.cssVar('--text-muted');
    ctx.globalAlpha = .3;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    L.forEach((_, i) => {
      const [x, y] = ponto(i);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < r.i; i++) {
      const p = this.D.PARTICULAS.find(q => q.id === L[i].emite);
      const [x0, y0] = ponto(i),
        [x1, y1] = ponto(i + 1);
      SIRAD.kArrow(ctx, x0, y0, x1, y1, {
        color: p ? p.cor : SIRAD.cssVar('--text-muted'),
        w: 2.4,
        head: 7
      });
    }
    L.forEach((n, i) => {
      const [x, y] = ponto(i);
      const passado = i <= r.i;
      ctx.save();
      ctx.globalAlpha = passado ? 1 : .34;
      ctx.fillStyle = i === L.length - 1 ? SIRAD.cssVar('--accent-ok', '#4ade80') : i === r.i ? SIRAD.cssVar('--accent-amber', '#fbbf24') : SIRAD.cssVar('--text-secondary');
      ctx.beginPath();
      ctx.arc(x, y, i === r.i ? est ? 6 : 7.5 : est ? 3.4 : 4.2, 0, Math.PI * 2);
      ctx.fill();
      if (i === r.i) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      ctx.restore();
    });
    // rótulo do núcleo atual junto ao ponto
    const [cxp, cyp] = ponto(r.i);
    SIRAD.kChip(ctx, `${r.atual.s}-${r.atual.A}`, SIRAD.clamp(cxp, gx + 30, gx + gw - 30), cyp - 18, {
      fg: SIRAD.cssVar('--accent-amber'),
      size: est ? 9 : 11,
      bold: true
    });

    // legenda dos passos
    const la = this.D.PARTICULAS.find(p => p.id === 'alfa');
    const lb = this.D.PARTICULAS.find(p => p.id === 'beta');
    SIRAD.kLabel(ctx, '↙ α: −2 p, −2 n', gx + 6, gy + 12, {
      size: 9,
      align: 'left',
      color: la.cor
    });
    SIRAD.kLabel(ctx, '↗ β⁻: n vira p', gx + 6, gy + 26, {
      size: 9,
      align: 'left',
      color: lb.cor
    });

    // ── ficha da etapa atual ──
    const tx = est ? 28 : gx + gw + W * .04;
    const tw = est ? W - 56 : Math.max(120, W - tx - 24);
    let ty = est ? gy + gh + 40 : gy + 16;
    SIRAD.kLabel(ctx, `Etapa ${r.i} de ${r.total - 1}`, tx, ty, {
      size: 10,
      align: 'left',
      bold: true,
      color: SIRAD.cssVar('--text-muted'),
      maxW: tw
    });
    ty += 20;
    SIRAD.kLabel(ctx, `${r.atual.s}-${r.atual.A}`, tx, ty, {
      size: est ? 16 : 20,
      align: 'left',
      bold: true,
      color: r.fim ? SIRAD.cssVar('--accent-ok') : SIRAD.cssVar('--text-primary'),
      maxW: tw
    });
    ty += est ? 22 : 26;
    const linhas = [['Z (prótons)', String(r.atual.Z)], ['N (nêutrons)', String(r.atual.A - r.atual.Z)], ['Meia-vida', r.atual.meia], ['Emite', r.part ? r.part.rot : '— estável —'], ['Já saíram', `${r.na} α  +  ${r.nb} β⁻`], ['A perdido', `${r.dA}  (= 4 × ${r.na})`], ['Z perdido', `${r.dZ}  (= 2×${r.na} − ${r.nb})`]];
    const dy = Math.max(14, Math.min(21, (H - ty - 40) / linhas.length));
    linhas.forEach(l => {
      if (ty > H - 30) return;
      SIRAD.kLabel(ctx, l[0], tx, ty, {
        size: 10,
        align: 'left',
        color: SIRAD.cssVar('--text-secondary'),
        maxW: tw * .52
      });
      SIRAD.kLabel(ctx, l[1], tx + tw, ty, {
        size: 10,
        align: 'right',
        mono: true,
        bold: true,
        color: SIRAD.cssVar('--text-primary'),
        maxW: tw * .46
      });
      ty += dy;
    });
    if (r.atual.nota && ty < H - 14) {
      ty += 4;
      SIRAD.kLabel(ctx, r.atual.nota, tx, ty, {
        size: 9,
        align: 'left',
        color: r.fim ? SIRAD.cssVar('--accent-ok') : SIRAD.cssVar('--accent-amber'),
        maxW: tw
      });
    }
  }
  getResults() {
    if (this.mode === 'emissoes') {
      const rows = [];
      this.D.EMISSOES.forEach(e => {
        rows.push({
          l: `${e.nome} — natureza`,
          v: e.natureza
        });
        rows.push({
          l: `${e.nome} — barrada por`,
          v: e.barrada,
          cls: e.id === 'gama' ? 'val-exo' : ''
        });
      });
      return rows;
    }
    if (this.mode === 'meiavida') {
      const M = this.mv,
        r = this._mvCalc();
      return [{
        l: 'Isótopo',
        v: `${M.iso.nome} ${M.iso.simb}`
      }, {
        l: 'Meia-vida t½',
        v: M.iso.meia
      }, {
        l: 'Constante λ = ln2/t½',
        v: `${r.lambda.toExponential(3)} s⁻¹`
      }, {
        l: 'Tempo decorrido',
        v: `${SIRAD.fmt(M.t, 1)} t½  =  ${r.tRealTxt}`,
        cls: 'val-ok'
      }, {
        l: 'Fração restante',
        v: `${SIRAD.fmt(r.frac * 100, 1)} %`,
        cls: 'val-ok'
      }, {
        l: 'Massa inicial',
        v: `${SIRAD.fmt(M.m0, 0)} g`
      }, {
        l: 'Massa restante',
        v: `${SIRAD.fmt(r.resto, 1)} g`,
        cls: 'val-ok'
      }, {
        l: 'Já decaiu',
        v: `${SIRAD.fmt(M.m0 - r.resto, 1)} g`,
        cls: 'val-exo'
      }, {
        l: 'Núcleos ativos N',
        v: `${r.N.toExponential(3)}`
      }, {
        l: 'Atividade A = λ·N',
        v: `${r.atvBq.toExponential(3)} Bq`,
        cls: 'val-exo'
      }, {
        l: 'Atividade em curie',
        v: `${r.atvCi.toExponential(3)} Ci`
      }, {
        l: 'Aplicação',
        v: M.iso.uso
      }];
    }
    if (this.mode === 'soddy') {
      const c = this._sodCalc(),
        d = c.d,
        p = c.p;
      return [{
        l: 'Decaimento',
        v: `${d.pai.s}-${d.pai.A}  →  ?  +  ${p.rot}`
      }, {
        l: 'Partícula emitida',
        v: p.rot
      }, {
        l: 'O que ela leva',
        v: `${p.da} de massa · ${p.dz > 0 ? '+' : ''}${p.dz} de carga nuclear`
      }, {
        l: 'Efeito no núcleo',
        v: p.efeito,
        cls: 'val-ok'
      }, {
        l: '— Lado esquerdo —',
        v: ''
      }, {
        l: 'A do núcleo-pai',
        v: String(d.pai.A)
      }, {
        l: 'Z do núcleo-pai',
        v: String(d.pai.Z)
      }, {
        l: '— Seu palpite —',
        v: ''
      }, {
        l: 'A do produto',
        v: String(this.sod.a)
      }, {
        l: 'Z do produto',
        v: String(this.sod.z)
      }, {
        l: 'Elemento',
        v: c.simb === '?' ? 'ajuste o Z para descobrir' : c.simb,
        cls: c.simb === '?' ? '' : 'val-ok'
      }, {
        l: '— Conservação —',
        v: ''
      }, {
        l: 'ΣA à direita',
        v: `${this.sod.a} + ${p.da} = ${c.somaA}`,
        cls: c.okA ? 'val-ok' : 'val-exo'
      }, {
        l: 'Massa fecha?',
        v: c.okA ? `sim (= ${d.pai.A})` : `NÃO (deveria dar ${d.pai.A})`,
        cls: c.okA ? 'val-ok' : 'val-exo'
      }, {
        l: 'ΣZ à direita',
        v: `${this.sod.z} + (${p.dz}) = ${c.somaZ}`,
        cls: c.okZ ? 'val-ok' : 'val-exo'
      }, {
        l: 'Nº atômico fecha?',
        v: c.okZ ? `sim (= ${d.pai.Z})` : `NÃO (deveria dar ${d.pai.Z})`,
        cls: c.okZ ? 'val-ok' : 'val-exo'
      }, {
        l: 'Situação',
        v: c.ok ? 'EQUAÇÃO CORRETA <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>' : 'ainda montando…',
        cls: c.ok ? 'val-ok' : ''
      }, {
        l: 'Contexto',
        v: d.ctx
      }];
    }
    if (this.mode === 'datacao') {
      const r = this._datCalc(),
        m = r.m;
      return [{
        l: 'Método',
        v: m.nome
      }, {
        l: 'Par usado',
        v: m.par
      }, {
        l: 'Meia-vida',
        v: this._fmtAnos(m.t12a)
      }, {
        l: 'Constante λ = ln2/t½',
        v: `${r.lambda.toExponential(3)} ano⁻¹`
      }, {
        l: 'Isótopo restante N/N₀',
        v: `${SIRAD.fmt(r.frac * 100, 2)} %`
      }, {
        l: 'Já decaiu',
        v: `${SIRAD.fmt((1 - r.frac) * 100, 2)} %`,
        cls: 'val-exo'
      }, {
        l: 'Nº de meias-vidas',
        v: SIRAD.fmt(r.nMeias, 4),
        cls: 'val-endo'
      }, {
        l: 'Conta',
        v: `t = ${SIRAD.fmt(m.t12a, 0)} × log₂(1/${SIRAD.fmt(r.frac, 4)})`
      }, {
        l: 'IDADE ESTIMADA',
        v: r.txt,
        cls: 'val-ok'
      }, {
        l: 'Idade em anos',
        v: `${r.idade.toExponential(4)} anos`
      }, {
        l: 'Faixa útil do método',
        v: `${this._fmtAnos(m.faixa[0])} a ${this._fmtAnos(m.faixa[1])}`
      }, {
        l: 'Dentro da faixa?',
        v: r.dentro ? 'sim — resultado confiável' : r.tarde ? 'NÃO — velho demais para este método' : 'NÃO — jovem demais para este método',
        cls: r.dentro ? 'val-ok' : 'val-exo'
      }, {
        l: 'Serve para datar',
        v: m.alvo
      }, {
        l: 'Observação',
        v: m.nota
      }];
    }
    if (this.mode === 'serie') {
      const r = this._serCalc(),
        L = r.L,
        prim = L[0],
        ult = L[L.length - 1];
      return [{
        l: 'Série',
        v: `${prim.s}-${prim.A}  →  ${ult.s}-${ult.A}`
      }, {
        l: 'Etapa atual',
        v: `${r.i} de ${r.total - 1}`
      }, {
        l: 'Núcleo',
        v: `${r.atual.s}-${r.atual.A}`,
        cls: r.fim ? 'val-ok' : 'val-endo'
      }, {
        l: 'Z (prótons)',
        v: String(r.atual.Z)
      }, {
        l: 'N (nêutrons)',
        v: String(r.atual.A - r.atual.Z)
      }, {
        l: 'Meia-vida',
        v: r.atual.meia
      }, {
        l: 'Emite',
        v: r.part ? `${r.part.rot} → ${r.part.efeito}` : '— estável, fim da série —',
        cls: r.part ? '' : 'val-ok'
      }, {
        l: '— Acumulado —',
        v: ''
      }, {
        l: 'Emissões α até aqui',
        v: String(r.na)
      }, {
        l: 'Emissões β⁻ até aqui',
        v: String(r.nb)
      }, {
        l: 'Massa perdida',
        v: `${r.dA}  =  4 × ${r.na}`
      }, {
        l: 'Z perdido',
        v: `${r.dZ}  =  2×${r.na} − ${r.nb}`
      }, {
        l: '— Balanço final —',
        v: ''
      }, {
        l: 'Total da série',
        v: '8 α  +  6 β⁻'
      }, {
        l: 'Por que 8 α?',
        v: 'ΔA = 238 − 206 = 32, e 32 ÷ 4 = 8'
      }, {
        l: 'Por que 6 β⁻?',
        v: '8 α tirariam 16 de Z, mas Z caiu só 10 (92→82); os 6 β⁻ devolveram a diferença'
      }, {
        l: 'Quem dita o ritmo',
        v: 'a etapa mais LENTA: o próprio ²³⁸U, 4,47 bilhões de anos'
      }, {
        l: 'Nota da etapa',
        v: r.atual.nota || '—'
      }];
    }
    const C = this.cd,
      reg = this._cdRegime();
    return [{
      l: 'Combustível',
      v: this.D.FISSAO.alvo
    }, {
      l: 'Barras de controle',
      v: `${SIRAD.fmt(C.ctrl, 0)} % de absorção`
    }, {
      l: 'k (nêutrons úteis/fissão)',
      v: SIRAD.fmt(this._cdK(), 1),
      cls: 'val-ok'
    }, {
      l: 'Regime',
      v: `${reg.rot} — ${reg.det}`,
      cls: reg.rot === 'supercrítica' ? 'val-exo' : reg.rot === 'crítica' ? 'val-ok' : 'val-endo'
    }, {
      l: 'Fissões ocorridas',
      v: String(C.fissoes)
    }, {
      l: 'Nêutrons em voo',
      v: String(C.neutrons.length)
    }, {
      l: 'Núcleos restantes',
      v: `${C.nucleos.filter(n => n.vivo).length} de 54`
    }];
  }
  getOverlay() {
    if (this.mode === 'emissoes') return this.em.cenario === 'barreiras' ? 'α β γ · barreiras' : 'α β γ · campo elétrico';
    if (this.mode === 'meiavida') {
      const r = this._mvCalc();
      return `${this.mv.iso.simb} · ${SIRAD.fmt(r.frac * 100, 0)} % · ${r.tRealTxt}`;
    }
    if (this.mode === 'soddy') {
      const c = this._sodCalc();
      return `${c.d.pai.s}-${c.d.pai.A} + ${c.p.rot.split(' ')[0]} · ${c.ok ? 'correto ✓' : 'montando'}`;
    }
    if (this.mode === 'datacao') {
      const r = this._datCalc();
      return `${r.m.nome} · ${r.txt}`;
    }
    if (this.mode === 'serie') {
      const r = this._serCalc();
      return `${r.atual.s}-${r.atual.A} · etapa ${r.i}/${r.total - 1}`;
    }
    return `fissão · ${this._cdRegime().rot}`;
  }
  onArrow(dx, dy) {
    if (this.mode === 'meiavida') {
      if (!dx) return false;
      this.mv.t = SIRAD.clamp(this.mv.t + dx * .1, 0, 6);
      this.app.syncSlider('mv-t', this.mv.t);
      return true;
    }
    // Soddy: horizontal ajusta Z, vertical ajusta A — mesma disposicao da
    // notacao de nuclideo, em que Z fica embaixo e A em cima.
    if (this.mode === 'soddy') {
      if (dx) {
        this.sod.z = SIRAD.clamp(this.sod.z + dx, 1, 95);
      }
      if (dy) {
        this.sod.a = SIRAD.clamp(this.sod.a - dy, 1, 245);
      }
      this._sodSyncSliders();
      return !!(dx || dy);
    }
    if (this.mode === 'datacao') {
      if (!dx) return false;
      this.dat.frac = SIRAD.clamp(this.dat.frac + dx * 2, 0.2, 99);
      this.app.syncSlider('dat-frac', this.dat.frac);
      return true;
    }
    if (this.mode === 'serie') {
      if (!dx) return false;
      this.ser.passo = SIRAD.clamp(this.ser.passo + dx, 0, this.D.SERIE_U238.length - 1);
      this.ser.auto = false;
      this.app.syncSlider('ser-passo', this.ser.passo);
      this._serNota();
      return true;
    }
    return false;
  }
};