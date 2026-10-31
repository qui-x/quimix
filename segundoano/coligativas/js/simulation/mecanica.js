// ══════════════════════════════════════════════════════════════════
// MECÂNICA — Propriedades Coligativas (SIPC)
// Modos: pressão de vapor · misturas de líquidos voláteis (Raoult) ·
// ebulioscopia/crioscopia · osmose · Lei de Henry.
// Extraído do simulador combinado original (SISOL) em duas partes —
// esta é a segunda ("MechB" antes, agora a mecânica única do SIPC).
// A fachada que antes despachava entre duas mecânicas não é mais
// necessária: só existe UMA aqui, então a classe abaixo já atende
// diretamente a interface que o App espera (build/setMode/setParam/
// action/update/draw/getResults/getOverlay).
// ══════════════════════════════════════════════════════════════════
/** Equação de Antoine: log₁₀(P_mmHg) = A − B/(C+T[°C]) → P em mmHg. */
SIPC.antoinePv = function antoinePv(coef, T) {
  const Tc = SIPC.clamp(T, coef.tmin, coef.tmax);
  return Math.pow(10, coef.A - coef.B / (coef.C + Tc));
};
/** Temperatura de ebulição (°C) para uma dada pressão externa, invertendo
 *  Antoine analiticamente: T = B/(A − log₁₀ P) − C. */
SIPC.antoineTe = function antoineTe(coef, P) {
  const Pc = Math.max(1, P);
  const T = coef.B / (coef.A - Math.log10(Pc)) - coef.C;
  return SIPC.clamp(T, coef.tmin - 10, coef.tmax + 10);
};
/** Gera pontos [T,P] para desenho da curva de um líquido, via Antoine
 *  (amostragem contínua) ou tabela CRC, conforme o que estiver disponível. */
SIPC.liquidCurve = function liquidCurve(l, xmax) {
  if (l.antoine) {
    const pts = [];
    const tEnd = Math.min(xmax, l.antoine.tmax);
    const tStart = Math.max(0, l.antoine.tmin);
    for (let t = tStart; t < tEnd; t += 5) pts.push([t, SIPC.antoinePv(l.antoine, t)]);
    pts.push([tEnd, SIPC.antoinePv(l.antoine, tEnd)]);
    return pts;
  }
  return l.pv;
};
/** Y exato do topo do mercúrio para um valor — mesma matemática do
 *  kThermo — usado para desenhar setas de deslocamento na altura certa. */
SIPC.thermoValueY = function thermoValueY(topY, h, tmin, tmax, t) {
  const bulbR = 8,
    tubeTop = topY,
    tubeBot = topY + h - bulbR * 2;
  const frac = Math.max(0, Math.min(1, (t - tmin) / (tmax - tmin)));
  return tubeBot - frac * (tubeBot - tubeTop - 4);
};

SIPC.Mech = class Mech {
  constructor(D) {
    this.D = D;
    this.modo = 'pvap';
    // modo 1
    this.liquido = D.LIQUIDOS[0];
    this.tpv = 25;
    this.patm = 760;
    this.bolhas = [];
    // modo 2 — ebulioscopia/crioscopia: solvente + soluto
    this.solvente = D.SOLVENTES_COLIG[0];
    this.soluto = D.SOLUTOS_COL[0];
    this.w = 1;
    // modo 3 — osmose (dinâmica real: volumes e mols de cada lado)
    this.mesq = 0.2;
    this.mdir = 0.8;
    this.tosm = 25;
    this.osm = {
      V0: 0.5,
      Vesq: 0.5,
      Vdir: 0.5,
      nesq: 0,
      ndir: 0,
      running: false,
      papl: 0,
      modoRO: false
    };
    this.fase = 0;
    // modo 5 — misturas de líquidos voláteis: Lei de Raoult, ideal vs real
    this.raoult = {
      aId: 'etanol',
      bId: 'agua',
      desvio: 'positivo',
      xA: 0.5,
      T: 60,
      vista: 'grafico',
      // 'grafico' | 'balao' | 'desafio'
      // Visão Balão: composição construída fisicamente por gotas (mL),
      // convertida pra mol via densidade/massa molar de cada líquido
      volA: 50,
      volB: 50,
      // Desafio da Destilação
      desafioId: 'etanol-agua',
      desafioXA: 0.12,
      ciclos: 0,
      travado: false,
      historico: [0.12]
    };
    // modo 4 — Lei de Henry: C = kH(T)·P
    this.henry = {
      gas: D.GASES_HENRY[0],
      T: 4,
      P: 3,
      aberto: false,
      C: 0,
      liberando: false,
      bolhas: []
    };
    this.henry.C = this._henryEq(this.henry.gas, this.henry.T, this.henry.P);
  }
  build(app) {
    SIPC.fillOptGrid('pvap-grid', this.D.LIQUIDOS.map(l => ({
      value: l.id,
      nome: l.nome,
      dot: l.cor,
      extra: `Te ${SIPC.fmt(l.te, 1)} °C`,
      aria: `${l.nome}, ebulição a ${SIPC.fmt(l.te, 1)} graus Celsius ao nível do mar`
    })), this.liquido.id);
    SIPC.fillOptGrid('solvente-grid', this.D.SOLVENTES_COLIG.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.cor,
      extra: `Kc ${SIPC.fmt(s.Kc, 2)}`,
      aria: `${s.nome}, constante crioscópica ${SIPC.fmt(s.Kc, 2)}, ebulioscópica ${SIPC.fmt(s.Ke, 2)} graus vezes quilo por mol`
    })), this.solvente.id);
    SIPC.fillOptGrid('colig-grid', this.D.SOLUTOS_COL.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.dot,
      extra: `i = ${s.i}`,
      aria: `${s.nome}, ${s.tipo}, fator de van 't Hoff igual a ${s.i}`
    })), this.soluto.id);
    this._buildHenryGrid();
    this._syncHenryUI();
    this._buildRaoultGrids();
    SIPC.fillOptGrid('raoult-desafio-grid', this.D.DESAFIOS_DESTILACAO.map(d => ({
      value: d.id,
      nome: d.nome,
      extra: d.desvio === 'ideal' ? 'sem azeótropo' : 'com azeótropo real'
    })), this.raoult.desafioId);
    this._syncRaoultVistaUI();
  }
  /** Só os líquidos com Antoine (não o éter, que só tem tabela) entram no
   *  modo de mistura binária — o cálculo precisa da função contínua P°(T). */
  _liquidosAntoine() {
    return this.D.LIQUIDOS.filter(l => l.antoine);
  }
  _buildRaoultGrids() {
    const lst = this._liquidosAntoine();
    SIPC.fillOptGrid('raoult-a-grid', lst.map(l => ({
      value: l.id,
      nome: l.nome,
      dot: l.cor
    })), this.raoult.aId);
    SIPC.fillOptGrid('raoult-b-grid', lst.map(l => ({
      value: l.id,
      nome: l.nome,
      dot: l.cor
    })), this.raoult.bId);
  }
  _buildHenryGrid() {
    SIPC.fillOptGrid('henry-grid', this.D.GASES_HENRY.map(g => ({
      value: g.id,
      nome: g.nome,
      dot: g.cor,
      extra: `kH ${SIPC.fmt(g.kH25 * 1000, 2)}×10⁻³`,
      aria: `${g.nome}, constante de Henry ${SIPC.fmt(g.kH25, 5)} mol por litro por atmosfera a 25 graus`
    })), this.henry.gas.id);
  }
  /** Com a garrafa aberta a pressão é sempre 1 atm — oculta e desabilita o
   *  slider de pressão para não sugerir um controle sem efeito. */
  _syncHenryUI() {
    const row = document.getElementById('row-henry-p');
    if (row) row.hidden = this.henry.aberto;
    const inp = document.getElementById('henry-p');
    if (inp) inp.disabled = this.henry.aberto;
  }
  setMode(id) {
    this.modo = id;
  }
  setParam(k, v) {
    switch (k) {
      case 'liquido':
        {
          this.liquido = this.D.LIQUIDOS.find(l => l.id === v) || this.liquido;
          this.bolhas.length = 0;
          // cada líquido só tem dados reais numa faixa de temperatura (Antoine
          // ou tabela); sem essa checagem o slider podia continuar mostrando
          // uma T fora da faixa enquanto o cálculo usava, por baixo dos panos,
          // um valor diferente (clampeado) — número exibido ≠ número usado.
          const L = this.liquido;
          const faixa = L.antoine ? [L.antoine.tmin, L.antoine.tmax] : [L.pv[0][0], L.pv[L.pv.length - 1][0]];
          const tOk = SIPC.clamp(this.tpv, Math.max(0, faixa[0]), Math.min(110, faixa[1]));
          let aviso = '';
          if (Math.abs(tOk - this.tpv) > 0.5) {
            this.tpv = tOk;
            this.app.syncSlider('pv-t', tOk);
            aviso = ` Temperatura ajustada para ${SIPC.fmt(tOk, 0)} °C — fora disso não há dados reais para este líquido.`;
          }
          return {
            say: `${L.nome} selecionado. Ebulição normal a ${SIPC.fmt(L.te, 1)} graus.${aviso}`
          };
        }
      case 'tpv':
        this.tpv = v;
        break;
      case 'patm':
        this.patm = v;
        break;
      case 'solutocol':
        {
          this.soluto = this.D.SOLUTOS_COL.find(s => s.id === v) || this.soluto;
          return {
            say: `${this.soluto.nome}, ${this.soluto.tipo}. Fator i igual a ${this.soluto.i}.`
          };
        }
      case 'solvente':
        {
          this.solvente = this.D.SOLVENTES_COLIG.find(s => s.id === v) || this.solvente;
          return {
            say: `${this.solvente.nome} selecionado — Ke = ${SIPC.fmt(this.solvente.Ke, 2)}, Kc = ${SIPC.fmt(this.solvente.Kc, 2)} graus vezes quilo por mol. Ferve puro a ${SIPC.fmt(this.solvente.Te, 1)} graus e congela a ${SIPC.fmt(this.solvente.Tc, 1)} graus.`
          };
        }
      case 'w':
        this.w = v;
        break;
      case 'mesq':
        {
          const estava = this.osm.running;
          this.mesq = v;
          this._osmReset();
          return estava ? {
            say: 'Concentração alterada — o fluxo osmótico foi reiniciado do zero.'
          } : {};
        }
      case 'mdir':
        {
          const estava = this.osm.running;
          this.mdir = v;
          this._osmReset();
          return estava ? {
            say: 'Concentração alterada — o fluxo osmótico foi reiniciado do zero.'
          } : {};
        }
      case 'tosm':
        this.tosm = v;
        break;
      case 'modoOsm':
        {
          const reversa = v === 'reversa';
          this.osm.modoRO = reversa;
          this._osmReset();
          if (reversa) {
            // pressão inicial já acima do Δπ natural, pra reversão ficar
            // visível assim que o estudante iniciar o fluxo
            const o = this._osm();
            const pInicial = Math.max(5, Math.ceil((o.piMax + 3) / 5) * 5);
            this.osm.papl = pInicial;
            this.app.syncSlider('osm-papl', pInicial);
          } else {
            this.osm.papl = 0;
            this.app.syncSlider('osm-papl', 0);
          }
          document.getElementById('row-osm-papl').hidden = !reversa;
          const hint = document.getElementById('osm-hint');
          if (hint) hint.innerHTML = reversa ? 'Aumente a pressão aplicada: acima de Δπ, o fluxo se <strong>inverte</strong> e água pura sai do lado concentrado — o princípio da dessalinização.' : 'A água atravessa sozinha para o lado mais concentrado, até as concentrações se igualarem.';
          return {
            say: reversa ? 'Osmose reversa: uma pressão mecânica é aplicada no lado concentrado, empurrando água pura para fora dele — o princípio da dessalinização.' : 'Osmose direta: a água flui sozinha, sem pressão aplicada, do lado menos concentrado para o mais concentrado.'
          };
        }
      case 'papl':
        {
          this.osm.papl = v;
          const o = this._osm();
          return {
            say: v > o.piMax ? `Pressão aplicada acima da pressão osmótica: fluxo revertido — água pura sendo extraída do lado mais concentrado, como numa dessalinização.` : `Pressão aplicada: ${SIPC.fmt(v, 1)} atm.`
          };
        }
      case 'gasHenry':
        {
          const g = this.D.GASES_HENRY.find(x => x.id === v) || this.henry.gas;
          this.henry.gas = g;
          if (!this.henry.aberto) this.henry.C = this._henryEq(g, this.henry.T, this.henry.P);
          return {
            say: this.henry.aberto ? `${g.nome} selecionado — ${g.ctx}. Com a garrafa aberta, a concentração vai se ajustar aos poucos ao novo gás, não muda de uma vez.` : `${g.nome} selecionado — ${g.ctx}.`
          };
        }
      case 'henryT':
        {
          this.henry.T = v;
          if (!this.henry.aberto) this.henry.C = this._henryEq(this.henry.gas, v, this.henry.P);
          return;
        }
      case 'henryP':
        {
          this.henry.P = v;
          if (!this.henry.aberto) this.henry.C = this._henryEq(this.henry.gas, this.henry.T, v);
          return;
        }
      case 'liquidoA':
        {
          const Ra = this.raoult;
          if (v === Ra.bId) Ra.bId = Ra.aId; // não faz sentido misturar um líquido com ele mesmo — troca
          Ra.aId = v;
          this._syncRaoultT();
          this._buildRaoultGrids();
          return {
            say: `Líquido A: ${this._liquidosAntoine().find(l => l.id === v).nome}.`
          };
        }
      case 'liquidoB':
        {
          const Ra = this.raoult;
          if (v === Ra.aId) Ra.aId = Ra.bId;
          Ra.bId = v;
          this._syncRaoultT();
          this._buildRaoultGrids();
          return {
            say: `Líquido B: ${this._liquidosAntoine().find(l => l.id === v).nome}.`
          };
        }
      case 'desvio':
        {
          this.raoult.desvio = v;
          const nomes = {
            ideal: 'ideal — segue a Lei de Raoult à risca',
            positivo: 'desvio positivo — pressão real ACIMA da reta ideal, pode formar azeótropo de ebulição mínima',
            negativo: 'desvio negativo — pressão real ABAIXO da reta ideal, pode formar azeótropo de ebulição máxima'
          };
          return {
            say: nomes[v] || ''
          };
        }
      case 'xA':
        this.raoult.xA = v;
        return;
      case 'raoultT':
        this.raoult.T = v;
        return;
      case 'vistaRaoult':
        {
          this.raoult.vista = v;
          this._syncRaoultVistaUI();
          const nomes = {
            grafico: 'gráfico de pressão de vapor',
            balao: 'visão balão — evaporação partícula a partícula',
            desafio: 'desafio da destilação'
          };
          return {
            say: `Vista: ${nomes[v] || v}.`
          };
        }
      case 'desafioSelect':
        {
          const Ra = this.raoult;
          const desafio = this.D.DESAFIOS_DESTILACAO.find(x => x.id === v) || this.D.DESAFIOS_DESTILACAO[0];
          Ra.desafioId = desafio.id;
          Ra.desafioXA = desafio.xA0;
          Ra.ciclos = 0;
          Ra.travado = false;
          Ra.historico = [desafio.xA0];
          return {
            say: `${desafio.nome}. ${desafio.contexto}`
          };
        }
    }
    return {};
  }
  action(name) {
    if (name === 'pv-status') {
      const s = this._pv();
      return SIPC.announce(s.fervendo ? `${this.liquido.nome} fervendo: pressão de vapor ${SIPC.fmt(s.pv, 1)} milímetros de mercúrio iguala ou supera a externa de ${SIPC.fmt(this.patm, 0)}.` : `${this.liquido.nome} líquido a ${SIPC.fmt(this.tpv, 0)} graus. Pressão de vapor ${SIPC.fmt(s.pv, 1)} contra ${SIPC.fmt(this.patm, 0)} milímetros de mercúrio externos. Fervura prevista para ${SIPC.fmt(s.te, 1)} graus.`);
    }
    if (name === 'colig-status') {
      const c = this._colig();
      return SIPC.announce(`Solução ${SIPC.fmt(this.w, 2)} molal de ${this.soluto.nome} em ${this.solvente.nome}: ferve a ${SIPC.fmt(c.te, 2)} graus e congela a ${SIPC.fmt(c.tc, 2)} graus. Massa molar real ${SIPC.fmt(c.Mreal, 1)}, aparente (se ignorar i) ${SIPC.fmt(c.Map, 1)} g/mol.`);
    }
    if (name === 'raoult-exemplo-real') {
      const Ra = this.raoult;
      Ra.aId = 'etanol';
      Ra.bId = 'agua';
      Ra.desvio = 'positivo';
      Ra.T = 78;
      this._buildRaoultGrids();
      this.app.syncSlider('raoult-t', 78);
      const segs = document.querySelectorAll('[data-group="desvio"] .seg-btn');
      segs.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.value === 'positivo')));
      SIPC.announce('Etanol + água é um caso real bem documentado: forma um azeótropo perto de 89,5% em fração molar de etanol (95,6% em massa), fervendo a 78,2 graus — mova a fração molar de A até achar o pico da curva e compare com esse valor.', 'assertive');
    }
    if (name === 'raoult-status') {
      const r = this._raoult();
      const desvioTxt = r.Am === 0 ? 'comportamento ideal, segue a Lei de Raoult' : r.Am > 0 ? 'desvio positivo' : 'desvio negativo';
      const azeoTxt = r.azeo ? ` Azeótropo próximo de x igual a ${SIPC.fmt(r.azeo.x, 2)}, com pressão ${SIPC.fmt(r.azeo.p, 0)} milímetros de mercúrio.` : '';
      return SIPC.announce(`${r.A.nome} e ${r.B.nome} a ${SIPC.fmt(this.raoult.T, 0)} graus: ${desvioTxt}. Pressão ideal ${SIPC.fmt(r.Pideal, 0)}, pressão real ${SIPC.fmt(r.Preal, 0)} milímetros de mercúrio.${azeoTxt}`, 'assertive');
    }
    if (name === 'raoult-add-a' || name === 'raoult-add-b') {
      const Ra = this.raoult;
      if (name === 'raoult-add-a') Ra.volA = SIPC.clamp(Ra.volA + 10, 0, 500);else Ra.volB = SIPC.clamp(Ra.volB + 10, 0, 500);
      const mol = this._raoultMoles();
      SIPC.announce(`${name === 'raoult-add-a' ? mol.A.nome : mol.B.nome}: +10 mL. Fração molar de ${mol.A.nome} agora ${SIPC.fmt(mol.xA, 2)}.`);
    }
    if (name === 'raoult-reset-balao') {
      this.raoult.volA = 50;
      this.raoult.volB = 50;
      SIPC.announce('Balão reiniciado: 50 mL de cada líquido.');
    }
    if (name === 'raoult-desafio-destilar') {
      const Ra = this.raoult;
      const desafio = this.D.DESAFIOS_DESTILACAO.find(d => d.id === Ra.desafioId);
      const A = this.D.LIQUIDOS.find(l => l.id === desafio.aId),
        B = this.D.LIQUIDOS.find(l => l.id === desafio.bId);
      const Am = desafio.desvio === 'positivo' ? 1.1 : desafio.desvio === 'negativo' ? -1.1 : 0;
      const antigo = Ra.desafioXA;
      const yA = this._raoultY(antigo, desafio.T, Am, A, B);
      Ra.desafioXA = yA;
      Ra.ciclos++;
      Ra.historico.push(yA);
      const mudou = Math.abs(yA - antigo);
      Ra.travado = mudou < 0.008 && Am !== 0;
      SIPC.playTone(Ra.travado ? 260 : 760, .12, .07);
      if (Ra.travado) {
        SIPC.announce(`Travado! Depois de ${Ra.ciclos} ciclos, a composição parou de mudar em ${SIPC.fmt(yA * 100, 1)}% de ${A.nome} — o vapor tem a MESMA composição do líquido. Esse é o azeótropo: destilação simples não passa daqui.`, 'assertive');
      } else {
        SIPC.announce(`Ciclo ${Ra.ciclos}: pureza de ${A.nome} subiu de ${SIPC.fmt(antigo * 100, 1)}% para ${SIPC.fmt(yA * 100, 1)}%.`);
      }
    }
    if (name === 'raoult-desafio-reset') {
      const Ra = this.raoult;
      const desafio = this.D.DESAFIOS_DESTILACAO.find(d => d.id === Ra.desafioId);
      Ra.desafioXA = desafio.xA0;
      Ra.ciclos = 0;
      Ra.travado = false;
      Ra.historico = [desafio.xA0];
      SIPC.announce(`Desafio reiniciado: ${SIPC.fmt(desafio.xA0 * 100, 0)}% de ${this.D.LIQUIDOS.find(l => l.id === desafio.aId).nome}.`);
    }
    if (name === 'osmose-run') {
      const O = this.osm;
      O.Vesq = O.V0;
      O.Vdir = O.V0;
      O.nesq = this.mesq * O.V0;
      O.ndir = this.mdir * O.V0;
      O.running = true;
      SIPC.announce('Fluxo osmótico iniciado. A água atravessa a membrana para o lado mais concentrado, até as concentrações se igualarem.');
    }
    if (name === 'osmose-reset') {
      this._osmReset();
      if (this.osm.modoRO) {
        const o = this._osm();
        const pInicial = Math.max(5, Math.ceil((o.piMax + 3) / 5) * 5);
        this.osm.papl = pInicial;
        this.app.syncSlider('osm-papl', pInicial);
        SIPC.announce('Tubo reiniciado com os níveis iguais, pressão aplicada de volta ao padrão de demonstração.');
      } else {
        this.osm.papl = 0;
        this.app.syncSlider('osm-papl', 0);
        SIPC.announce('Tubo reiniciado com os níveis iguais e sem pressão aplicada.');
      }
    }
    if (name === 'henry-abrir') {
      const H = this.henry;
      H.aberto = !H.aberto;
      this._syncHenryUI();
      if (!H.aberto) {
        H.C = this._henryEq(H.gas, H.T, H.P);
        H.liberando = false;
        SIPC.announce(`Garrafa fechada e repressurizada: ${SIPC.fmt(H.P, 1)} atmosferas, concentração de equilíbrio ${SIPC.fmt(H.C, 4)} mol por litro.`);
      } else {
        const alvo = this._henryEq(H.gas, H.T, 1);
        SIPC.announce(H.C > alvo ? `Garrafa aberta! A pressão cai para 1 atmosfera e o excesso de ${H.gas.nome} escapa em bolhas até ${SIPC.fmt(alvo, 4)} mol por litro.` : `Garrafa aberta a 1 atmosfera — a concentração já está em equilíbrio, sem bolhas.`);
      }
    }
    if (name === 'henry-reset') {
      const H = this.henry;
      H.gas = this.D.GASES_HENRY[0];
      H.T = 4;
      H.P = 3;
      H.aberto = false;
      H.bolhas.length = 0;
      H.liberando = false;
      H.C = this._henryEq(H.gas, H.T, H.P);
      this.app.syncSlider('henry-t', 4);
      this.app.syncSlider('henry-p', 3);
      this._buildHenryGrid();
      this._syncHenryUI();
      SIPC.announce('Garrafa reiniciada: CO₂ a 4 graus e 3 atmosferas, fechada.');
    }
  }

  /** Reinicia a dinâmica de osmose (nível igual, sem fluxo em curso). */
  _osmReset() {
    const O = this.osm;
    O.Vesq = O.V0;
    O.Vdir = O.V0;
    O.running = false;
  }

  /* ── física ── */
  _pv() {
    const L = this.liquido;
    if (L.antoine) {
      const pv = SIPC.antoinePv(L.antoine, this.tpv);
      const te = SIPC.antoineTe(L.antoine, this.patm);
      return {
        pv,
        te,
        fervendo: pv >= this.patm - 0.5
      };
    }
    const pv = SIPC.kInterp(L.pv, SIPC.clamp(this.tpv, L.pv[0][0], L.pv[L.pv.length - 1][0]));
    // temperatura de ebulição pela pressão externa (inversa da tabela)
    let te = L.pv[L.pv.length - 1][0];
    for (let i = 1; i < L.pv.length; i++) {
      const [t0, p0] = L.pv[i - 1],
        [t1, p1] = L.pv[i];
      if (this.patm >= p0 && this.patm <= p1) {
        te = t0 + (this.patm - p0) / (p1 - p0) * (t1 - t0);
        break;
      }
    }
    return {
      pv,
      te,
      fervendo: pv >= this.patm - 0.5
    };
  }
  _colig() {
    const S = this.solvente,
      i = this.soluto.i,
      W = this.w;
    const dte = S.Ke * W * i,
      dtc = S.Kc * W * i;
    // tonoscopia: fração molar do solvente (Raoult), no ponto de ebulição do solvente puro
    const xs = S.molKg / (S.molKg + W * i);
    // massa molar "aparente" — o que alguém calcularia SE esquecesse de
    // multiplicar pelo fator i (erro clássico de laboratório): como
    // ΔT = K·W·i, ignorar i faz a pessoa inferir W_aparente = i·W_real,
    // logo M_aparente = M_real / i (sai i vezes MENOR que a real).
    const Mreal = this.soluto.M,
      Map = Mreal / i;
    return {
      dte,
      dtc,
      te: S.Te + dte,
      tc: S.Tc - dtc,
      p: 760 * xs,
      dp: 760 * (1 - xs),
      part: W * i,
      Mreal,
      Map
    };
  }
  _osm() {
    const O = this.osm,
      T = this.tosm + 273.15,
      R = this.D.R;
    const Me = O.running ? O.nesq / O.Vesq : this.mesq;
    const Md = O.running ? O.ndir / O.Vdir : this.mdir;
    const pe = Me * R * T,
      pd = Md * R * T;
    const d = Md - Me;
    const dpi = Math.abs(pd - pe);
    const papl = O.papl || 0;
    // pressão aplicada sempre no lado direito, opondo-se ao fluxo natural —
    // é exatamente o princípio da osmose reversa usada em dessalinização:
    // quando papl supera a pressão osmótica natural (dpi), o fluxo de água
    // se INVERTE (água pura é extraída do lado mais concentrado).
    const dEfetivo = d - papl / (R * T);
    const reversed = papl > 0 && Math.abs(d) > 1e-6 && Math.sign(dEfetivo) !== Math.sign(d || 1);
    const rel = Math.abs(dEfetivo) < 0.005 ? 'iso' : dEfetivo > 0 ? 'dir' : 'esq';
    const desnivel = SIPC.clamp((O.Vdir - O.Vesq) / (2 * O.V0), -1, 1);
    return {
      pe,
      pd,
      dpi,
      piMax: dpi,
      d,
      dEfetivo,
      reversed,
      papl,
      Me,
      Md,
      desnivel,
      rel
    };
  }
  _henryKH(gas, T) {
    return gas.kH25 * Math.exp(-gas.decaiK * (T - 25));
  }
  _henryEq(gas, T, P) {
    return this._henryKH(gas, T) * P;
  }

  /** Garante que a temperatura escolhida tem dados de Antoine válidos para
   *  os DOIS líquidos ao mesmo tempo (interseção das duas faixas) — mesmo
   *  cuidado já aplicado no modo de pressão de vapor. */
  _syncRaoultT() {
    const Ra = this.raoult,
      A = this.D.LIQUIDOS.find(l => l.id === Ra.aId),
      B = this.D.LIQUIDOS.find(l => l.id === Ra.bId);
    const tmin = Math.max(A.antoine.tmin, B.antoine.tmin),
      tmax = Math.min(A.antoine.tmax, B.antoine.tmax);
    const tOk = SIPC.clamp(Ra.T, tmin, tmax);
    if (Math.abs(tOk - Ra.T) > 0.5) {
      Ra.T = tOk;
      if (this.app) this.app.syncSlider('raoult-t', tOk);
    }
  }

  /** Mostra só os controles relevantes pra vista atual (gráfico/balão/
   *  desafio) — no desafio, os líquidos/desvio/temperatura ficam ocultos
   *  de propósito, pra o estudante DESCOBRIR o comportamento observando
   *  o gráfico, em vez de já saber a resposta de antemão. */
  _syncRaoultVistaUI() {
    const v = this.raoult.vista;
    const show = (id, cond) => {
      const el = document.getElementById(id);
      if (el) el.hidden = !cond;
    };
    show('row-raoult-exemplo', v === 'grafico');
    show('row-raoult-liquidos', v !== 'desafio');
    show('row-raoult-desvio', v !== 'desafio');
    show('row-raoult-temp', v !== 'desafio');
    show('row-raoult-grafico', v === 'grafico');
    show('row-raoult-balao', v === 'balao');
    show('row-raoult-desafio', v === 'desafio');
  }

  /** Converte as gotas (mL) de A e B da Visão Balão em mol, via
   *  densidade/massa molar de cada líquido — mesma lógica de C=m/V·MM
   *  já usada no modo Preparo, agora aplicada aos dois lados da mistura. */
  _raoultMoles() {
    const Ra = this.raoult;
    const A = this.D.LIQUIDOS.find(l => l.id === Ra.aId),
      B = this.D.LIQUIDOS.find(l => l.id === Ra.bId);
    const molA = Ra.volA * A.rho / A.M,
      molB = Ra.volB * B.rho / B.M;
    const total = molA + molB;
    return {
      molA,
      molB,
      xA: total > 0 ? molA / total : .5,
      A,
      B
    };
  }

  /** Lei de Raoult (ideal) vs modelo de Margules de 1 parâmetro (real) —
   *  simplificado para ILUSTRAR a forma do desvio (positivo/negativo) e o
   *  aparecimento de um azeótropo; não reproduz valores exatos de sistemas
   *  reais específicos, que dependem de dados experimentais de cada par. */
  _raoultP(xA, T, Am, A, B) {
    const PA0 = SIPC.antoinePv(A.antoine, T),
      PB0 = SIPC.antoinePv(B.antoine, T);
    const xB = 1 - xA;
    const gA = Math.exp(Am * xB * xB),
      gB = Math.exp(Am * xA * xA);
    const Preal = xA * gA * PA0 + xB * gB * PB0;
    // YA = composição do VAPOR em equilíbrio com o líquido — é isso que sai
    // primeiro na destilação (Lei de Dalton + Raoult: pA = YA·P_total = xA·γA·P°A)
    const YA = Preal > 0 ? xA * gA * PA0 / Preal : xA;
    return {
      PA0,
      PB0,
      Pideal: xA * PA0 + xB * PB0,
      Preal,
      gA,
      gB,
      YA
    };
  }
  /** Composição do vapor (fração molar de A) em equilíbrio com o líquido —
   *  usada tanto na Visão Balão (cor do vapor) quanto no Desafio da
   *  Destilação (pra onde a composição "salta" a cada ciclo). */
  _raoultY(xA, T, Am, A, B) {
    return this._raoultP(xA, T, Am, A, B).YA;
  }
  _raoult() {
    const Ra = this.raoult;
    const A = this.D.LIQUIDOS.find(l => l.id === Ra.aId),
      B = this.D.LIQUIDOS.find(l => l.id === Ra.bId);
    const Am = Ra.desvio === 'positivo' ? 1.1 : Ra.desvio === 'negativo' ? -1.1 : 0;
    const atual = this._raoultP(Ra.xA, Ra.T, Am, A, B);
    // varredura pra achar o azeótropo (extremo de Preal no interior do intervalo)
    let azeo = null;
    if (Am !== 0) {
      let best = null;
      for (let x = 0.02; x <= 0.98; x += 0.01) {
        const p = this._raoultP(x, Ra.T, Am, A, B).Preal;
        if (!best || (Am > 0 ? p > best.p : p < best.p)) best = {
          x,
          p
        };
      }
      // só conta como azeótropo se for de fato um extremo interno (não a borda)
      if (best && best.x > 0.03 && best.x < 0.97) azeo = best;
    }
    // referência real documentada: etanol+água forma um azeótropo bem
    // estudado a ≈89,5% em fração molar de etanol (95,6% em massa), a
    // 78,2 °C — usada aqui só como conferência de que o modelo simplificado
    // captura a ORDEM DE GRANDEZA certa, não como dado exato de outros pares
    let realRef = null;
    const parEtanolAgua = Ra.aId === 'etanol' && Ra.bId === 'agua' || Ra.aId === 'agua' && Ra.bId === 'etanol';
    if (parEtanolAgua && Am > 0) {
      const xEtanolReal = Ra.aId === 'etanol' ? 0.895 : 1 - 0.895;
      realRef = {
        xA: xEtanolReal,
        fonte: 'documentado: ≈95,6% em massa de etanol, ferve a 78,2 °C'
      };
    }
    return {
      A,
      B,
      Am,
      xA: Ra.xA,
      xB: 1 - Ra.xA,
      ...atual,
      azeo,
      realRef
    };
  }

  /* ── animação ── */
  update(dt, app) {
    this.fase += dt;
    if (this.modo === 'pvap') {
      const s = this._pv();
      const box = {
        x: -60,
        y: -110,
        w: 120,
        h: 110
      };
      const taxa = s.fervendo ? 45 : s.pv / this.patm * 8;
      SIPC.kBubbles(this.bolhas, dt, box, taxa, {
        vy: s.fervendo ? 70 : 30
      });
    } else if (this.modo === 'osmose' && this.osm.running) {
      const O = this.osm;
      const Me = O.nesq / O.Vesq,
        Md = O.ndir / O.Vdir;
      const T = this.tosm + 273.15,
        R = this.D.R;
      const kPerm = 0.18;
      // a pressão aplicada (osmose reversa) se opõe ao fluxo natural —
      // convertida para a mesma unidade de concentração via π=MRT
      const dEfetivo = Md - Me - (O.papl || 0) / (R * T);
      const fluxo = kPerm * dEfetivo;
      const Vmin = O.V0 * 0.12,
        Vmax = 2 * O.V0 - Vmin;
      O.Vesq = SIPC.clamp(O.Vesq - fluxo * dt, Vmin, Vmax);
      O.Vdir = SIPC.clamp(2 * O.V0 - O.Vesq, Vmin, Vmax);
    } else if (this.modo === 'henry') {
      const H = this.henry;
      const alvo = H.aberto ? this._henryEq(H.gas, H.T, 1) : this._henryEq(H.gas, H.T, H.P);
      const tau = 2.2;
      const antesC = H.C;
      H.C += (alvo - H.C) * (1 - Math.exp(-dt / Math.max(0.05, tau)));
      const taxaLiberacao = Math.max(0, (antesC - H.C) / Math.max(dt, 1e-6));
      H.liberando = H.aberto && taxaLiberacao > 1e-5;
      const box = {
        x: -46,
        y: -6,
        w: 92,
        h: 6
      };
      const taxaBolhas = H.aberto ? SIPC.clamp(taxaLiberacao * 5200, 0, 55) : 0;
      SIPC.kBubbles(H.bolhas, dt, box, taxaBolhas, {
        vy: 46,
        topo: -150
      });
    }
  }

  /* ── desenho ── */
  draw(ctx, W, H, app) {
    if (this.modo === 'pvap') this._drawPv(ctx, W, H);else if (this.modo === 'colig') this._drawColig(ctx, W, H);else if (this.modo === 'henry') this._drawHenry(ctx, W, H, app);else if (this.modo === 'raoult') this._drawRaoult(ctx, W, H);else this._drawOsm(ctx, W, H);
  }
  _drawPv(ctx, W, H) {
    const s = this._pv(),
      L = this.liquido;
    // gráfico ocupando toda a área do canvas — mesma proporção do modo
    // "Curvas de Solubilidade"; o béquer+termômetro foi para a barra lateral.
    const gw = W - 104,
      gh = H - 88;
    const A = SIPC.kAxes(ctx, {
      x: 58,
      y: 24,
      w: gw,
      h: gh,
      xmin: 0,
      xmax: 110,
      ymin: 0,
      ymax: 820,
      xticks: [0, 20, 40, 60, 80, 100],
      yticks: [0, 200, 400, 600, 760],
      xlab: 'Temperatura (°C)',
      ylab: 'Pressão de vapor (mmHg)'
    });

    // recorta as curvas à área do gráfico — sem isso, líquidos mais voláteis
    // (cuja pressão de vapor dispara bem acima de 820 mmHg antes dos 110 °C)
    // desenhavam a linha para FORA da área do eixo Y, por cima dos rótulos.
    const gx0 = 58,
      gy0 = 24;
    ctx.save();
    ctx.beginPath();
    ctx.rect(gx0, gy0, gw, gh);
    ctx.clip();
    this.D.LIQUIDOS.forEach((l, i) => {
      const on = l.id === L.id;
      const curva = SIPC.liquidCurve(l, 110);
      ctx.globalAlpha = on ? 1 : .3;
      SIPC.kLine(ctx, curva, A.px, A.py, {
        color: l.cor,
        w: on ? 2.6 : 1.4
      });
      ctx.globalAlpha = 1;
    });
    ctx.restore();

    // rótulos: posição "natural" no último ponto AINDA dentro da faixa
    // visível do eixo Y (≤800 mmHg) — depois resolve colisões de verdade
    // (ordena por x e empurra pra cima qualquer par que fique perto demais),
    // em vez de um escalonamento fixo que não escala com o número de líquidos
    const rotulos = this.D.LIQUIDOS.map(l => {
      const on = l.id === L.id;
      const curva = SIPC.liquidCurve(l, 110);
      let labelPt = curva[0];
      for (let k = 0; k < curva.length; k++) if (curva[k][1] <= 800) labelPt = curva[k];
      return {
        l,
        on,
        x: A.px(labelPt[0]) - 4,
        y: A.py(Math.min(labelPt[1], 800)) - 12
      };
    });
    rotulos.sort((a, b) => a.x - b.x);
    // relaxamento em várias passadas: resolve aglomerados de 3+ rótulos
    // próximos, não só pares — o anterior só comparava com um vizinho
    // por vez e podia deixar um terceiro rótulo colidindo.
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < rotulos.length; i++) {
        for (let j = 0; j < rotulos.length; j++) {
          if (i === j) continue;
          const dx = Math.abs(rotulos[i].x - rotulos[j].x),
            dy = rotulos[i].y - rotulos[j].y;
          if (dx < 60 && Math.abs(dy) < 20 && dy >= 0) rotulos[i].y = rotulos[j].y - 22;
        }
      }
    }
    rotulos.forEach(r => SIPC.kLabel(ctx, r.l.nome, r.x, r.y, {
      size: 10,
      color: r.l.cor,
      align: 'right',
      bold: r.on
    }));

    // linha da pressão externa
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = SIPC.cssVar('--accent-amber', '#fbbf24');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(A.px(0), A.py(this.patm));
    ctx.lineTo(A.px(110), A.py(this.patm));
    ctx.stroke();
    ctx.restore();
    SIPC.kChip(ctx, `P externa ${SIPC.fmt(this.patm, 0)} mmHg`, A.px(110) - 66, A.py(this.patm) - 12, {
      fg: SIPC.cssVar('--accent-amber'),
      size: 10
    });

    // ponto atual + ebulição prevista
    ctx.fillStyle = L.cor;
    ctx.beginPath();
    ctx.arc(A.px(this.tpv), A.py(s.pv), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = SIPC.cssVar('--accent-ok', '#4ade80');
    ctx.beginPath();
    ctx.moveTo(A.px(s.te), A.py(this.patm));
    ctx.lineTo(A.px(s.te), A.py(0));
    ctx.stroke();
    ctx.restore();
    SIPC.kChip(ctx, `Te ${SIPC.fmt(s.te, 1)} °C`, A.px(s.te), A.py(0) + 24, {
      fg: SIPC.cssVar('--accent-ok'),
      size: 11,
      bold: true
    });
  }

  /** Béquer + termômetro do líquido selecionado — desenhado num CANVAS
   *  separado, na barra lateral (não mais na área central), para deixar
   *  o gráfico de pressão de vapor ocupar o canvas inteiro. */
  _drawPvMini(ctx, w, h) {
    const s = this._pv(),
      L = this.liquido;
    ctx.clearRect(0, 0, w, h);
    const cx = w * .36,
      by = h - 18;
    ctx.save();
    ctx.translate(cx, by);
    const bw = Math.min(w * .5, 96),
      bh = Math.min(h * .56, 110);
    const box = SIPC.kBeaker(ctx, 0, -bh, bw, bh, .72, L.cor, {
      alpha: .55,
      rotulo: L.nome
    });
    SIPC.kDrawBubbles(ctx, this.bolhas, 'rgba(255,255,255,.7)');
    if (s.fervendo) SIPC.kFlame(ctx, 0, 6, .8, this.fase);
    const proximidade = SIPC.clamp(s.pv / this.patm, 0, 1);
    if (!SIPC.isReduced()) {
      if (s.fervendo) {
        SIPC.kSteam(ctx, -14, box.surfaceY - 2, this.fase, SIPC.cssVar('--text-secondary'));
        SIPC.kSteam(ctx, 14, box.surfaceY - 2, this.fase + 1.1, SIPC.cssVar('--text-secondary'));
      } else if (proximidade > 0.4) {
        ctx.save();
        ctx.globalAlpha = (proximidade - 0.4) / 0.6;
        SIPC.kSteam(ctx, 0, box.surfaceY - 2, this.fase, SIPC.cssVar('--text-secondary'));
        ctx.restore();
      }
    }
    ctx.restore();
    SIPC.kThermo(ctx, cx + bw * .72 + 22, by - bh + 6, bh + 6, this.tpv, 0, 110, {
      color: L.cor
    });
    SIPC.kChip(ctx, s.fervendo ? 'FERVENDO' : 'líquido', cx, by + 16, {
      fg: s.fervendo ? SIPC.cssVar('--accent-exo', '#f87171') : SIPC.cssVar('--text-secondary'),
      bold: true,
      size: 11
    });
  }
  _drawColig(ctx, W, H) {
    const c = this._colig(),
      S = this.solvente;
    const cx = W / 2;
    // três termômetros: solvente puro, ebulição da solução, congelamento —
    // faixa dinâmica porque cada solvente tem Te/Tc bem diferentes (água:
    // 0–100 °C · cânfora: 176–204 °C). Posições e altura em FRAÇÃO do
    // canvas (não mais pixels fixos), para aproveitar telas largas/altas.
    const y0 = H * .16,
      hh = SIPC.clamp(H * .52, 170, 380);
    const tmin = Math.min(-12, S.Tc - 20),
      tmax = Math.max(112, S.Te + 20);
    SIPC.kLabel(ctx, `${S.nome} pura × solução`, cx, H * .05, {
      size: 13,
      bold: true,
      color: SIPC.cssVar('--text-primary')
    });
    const passo = SIPC.clamp(W * .13, 90, 190);
    const cols = [{
      x: cx - passo * 1.5,
      t: S.Te,
      tmin,
      tmax,
      rot: `${S.nome} pura ferve`,
      cor: SIPC.cssVar('--accent-exo', '#f87171')
    }, {
      x: cx - passo * .4,
      t: c.te,
      tmin,
      tmax,
      rot: 'solução ferve',
      cor: SIPC.cssVar('--accent-exo', '#f87171')
    }, {
      x: cx + passo * .7,
      t: S.Tc,
      tmin,
      tmax,
      rot: `${S.nome} pura congela`,
      cor: SIPC.cssVar('--accent-cyan', '#22d3ee')
    }, {
      x: cx + passo * 1.8,
      t: c.tc,
      tmin,
      tmax,
      rot: 'solução congela',
      cor: SIPC.cssVar('--accent-cyan', '#22d3ee')
    }];
    cols.forEach(col => {
      if (col.x < 30 || col.x > W - 30) return;
      SIPC.kThermo(ctx, col.x, y0, hh, col.t, col.tmin, col.tmax, {
        color: col.cor,
        casas: 2,
        escala: false
      });
      SIPC.kLabel(ctx, col.rot, col.x, y0 + hh + 22, {
        size: 10,
        color: SIPC.cssVar('--text-secondary'),
        maxW: 100
      });
      // pistas visuais do estado físico: vapor sobre quem ferve, floco sobre quem congela
      if (col.rot.includes('ferve')) SIPC.kSteam(ctx, col.x, y0 - 6, SIPC.isReduced() ? 0 : this.fase, col.cor);else SIPC.kSnowflake(ctx, col.x, y0 - 10, 7, col.cor);
    });

    // setas de deslocamento ligando PURO → SOLUÇÃO, na altura exata do
    // mercúrio de cada um — o "antes/depois" fica visível de cara, não só
    // como números em separado nos dois termômetros
    if (cols[0].x >= 30 && cols[1].x <= W - 30) {
      const y1 = SIPC.thermoValueY(y0, hh, cols[0].tmin, cols[0].tmax, cols[0].t);
      const y2 = SIPC.thermoValueY(y0, hh, cols[1].tmin, cols[1].tmax, cols[1].t);
      SIPC.kArrow(ctx, cols[0].x + 13, y1, cols[1].x - 13, y2, {
        color: SIPC.cssVar('--accent-exo', '#f87171'),
        w: 2.2
      });
    }
    if (cols[2].x >= 30 && cols[3].x <= W - 30) {
      const y3 = SIPC.thermoValueY(y0, hh, cols[2].tmin, cols[2].tmax, cols[2].t);
      const y4 = SIPC.thermoValueY(y0, hh, cols[3].tmin, cols[3].tmax, cols[3].t);
      SIPC.kArrow(ctx, cols[2].x + 13, y3, cols[3].x - 13, y4, {
        color: SIPC.cssVar('--accent-cyan', '#22d3ee'),
        w: 2.2
      });
    }

    // divisor entre o grupo de ebulição e o de congelamento, com rótulos de grupo
    const midX = (cols[1].x + cols[2].x) / 2;
    if (midX > 30 && midX < W - 30) {
      ctx.save();
      ctx.strokeStyle = SIPC.cssVar('--border');
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(midX, y0 - 22);
      ctx.lineTo(midX, y0 + hh + 34);
      ctx.stroke();
      ctx.restore();
    }
    SIPC.kLabel(ctx, 'PONTO DE EBULIÇÃO', (cols[0].x + cols[1].x) / 2, y0 - 26, {
      size: 9,
      bold: true,
      color: SIPC.cssVar('--text-muted')
    });
    SIPC.kLabel(ctx, 'PONTO DE CONGELAMENTO', (cols[2].x + cols[3].x) / 2, y0 - 26, {
      size: 9,
      bold: true,
      color: SIPC.cssVar('--text-muted')
    });

    // faixa de deslocamento
    const yb = y0 + hh + 46;
    SIPC.kChip(ctx, `ΔTe = +${SIPC.fmt(c.dte, 2)} °C`, cols[0].x + passo * .55, yb, {
      fg: SIPC.cssVar('--accent-exo', '#f87171'),
      bold: true
    });
    SIPC.kChip(ctx, `ΔTc = −${SIPC.fmt(c.dtc, 2)} °C`, cols[2].x + passo * .55, yb, {
      fg: SIPC.cssVar('--accent-cyan', '#22d3ee'),
      bold: true
    });

    // partículas do soluto no líquido — béquer maior, também proporcional
    const px = SIPC.clamp(W * .1, 70, 140);
    if (px > 20 && cols[0].x - px > 50) {
      const bw = SIPC.clamp(W * .1, 70, 110),
        bh = SIPC.clamp(H * .3, 100, 180);
      const n = Math.round(SIPC.clamp(c.part * 8, 0, 60));
      ctx.save();
      ctx.translate(px, y0 + hh * .55);
      SIPC.kBeaker(ctx, 0, -bh * .9, bw, bh, .7, SIPC.cssVar('--accent-primary', '#60a5fa'), {
        alpha: .3,
        rotulo: 'solução'
      });
      for (let i = 0; i < n; i++) {
        const a = i * 2.399 + this.fase * .25;
        const rr = bw * .1 + i % 7 * (bw * .055);
        ctx.fillStyle = this.soluto.dot;
        ctx.globalAlpha = .85;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr, -bh * .42 + Math.sin(a * 1.3) * (bh * .24), 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      SIPC.kChip(ctx, `${SIPC.fmt(c.part, 2)} mol/kg de partículas`, px, y0 + hh * .55 + 26, {
        size: 10
      });
      SIPC.kChip(ctx, `M real ${SIPC.fmt(c.Mreal, 1)} × M aparente ${SIPC.fmt(c.Map, 1)} g/mol`, px, y0 + hh * .55 + 46, {
        size: 9,
        fg: this.soluto.i > 1 ? SIPC.cssVar('--accent-amber') : SIPC.cssVar('--text-secondary')
      });
    }
  }
  _drawOsm(ctx, W, H) {
    const o = this._osm();
    // tubo bem maior — usa a maior parte do canvas disponível, em vez de
    // ficar pequeno no meio de uma área vazia
    const cx = W / 2;
    const tw = SIPC.clamp(W * .1, 76, 150),
      gap = SIPC.clamp(W * .04, 32, 70),
      hcol = Math.min(H - 150, 380);
    const topY = Math.max(56, H * .1);
    const dn = o.desnivel * SIPC.clamp(hcol * .14, 22, 40);

    // tubo em U
    ctx.save();
    ctx.strokeStyle = SIPC.cssVar('--glass', 'rgba(148,163,184,.38)');
    ctx.lineWidth = 2.6;
    const lx = cx - gap / 2 - tw,
      rx = cx + gap / 2;
    const bot = topY + hcol;
    ctx.beginPath();
    ctx.moveTo(lx, topY);
    ctx.lineTo(lx, bot - 10);
    ctx.quadraticCurveTo(lx, bot, lx + 12, bot);
    ctx.lineTo(rx + tw - 12, bot);
    ctx.quadraticCurveTo(rx + tw, bot, rx + tw, bot - 10);
    ctx.lineTo(rx + tw, topY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx + tw, topY);
    ctx.lineTo(lx + tw, bot - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rx, topY);
    ctx.lineTo(rx, bot - 30);
    ctx.stroke();
    ctx.restore();

    // líquidos
    const nivelBase = topY + hcol * .26;
    const yE = nivelBase + dn,
      yD = nivelBase - dn;
    const azul = SIPC.cssVar('--accent-primary', '#60a5fa');
    ctx.save();
    ctx.globalAlpha = .5;
    ctx.fillStyle = SIPC.kMix(azul, '#ffffff', SIPC.clamp(1 - o.Me, 0, 1) * .35);
    ctx.fillRect(lx + 2, yE, tw - 4, bot - yE - 2);
    ctx.fillStyle = SIPC.kMix(azul, '#ffffff', SIPC.clamp(1 - o.Md, 0, 1) * .35);
    ctx.fillRect(rx + 2, yD, tw - 4, bot - yD - 2);
    ctx.globalAlpha = .5;
    ctx.fillRect(lx + 2, bot - 26, rx + tw - lx - 4, 24);
    ctx.restore();

    // membrana no fundo, no centro — com "poros" para reforçar que é semipermeável
    ctx.save();
    ctx.strokeStyle = SIPC.cssVar('--accent-amber', '#fbbf24');
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, bot - 30);
    ctx.lineTo(cx, bot - 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    for (let yy = bot - 4; yy >= bot - 28; yy -= 6) {
      ctx.beginPath();
      ctx.moveTo(cx - 3, yy);
      ctx.lineTo(cx + 3, yy);
      ctx.stroke();
    }
    ctx.restore();

    // partículas de soluto presas de cada lado
    const desenhaSoluto = (x0, m, y) => {
      const n = Math.round(m * 26);
      ctx.fillStyle = SIPC.cssVar('--accent-secondary', '#a78bfa');
      for (let i = 0; i < n; i++) {
        const a = i * 2.399 + this.fase * .3;
        ctx.beginPath();
        ctx.arc(x0 + tw / 2 + Math.cos(a) * (tw / 2 - 12), y + 24 + i * 17 % Math.max(10, bot - y - 40), 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };
    desenhaSoluto(lx, o.Me, yE);
    desenhaSoluto(rx, o.Md, yD);

    // pistão de pressão aplicada (osmose reversa) — empurra o lado direito
    if (o.papl > 0) {
      const pistonY = topY + 4 + SIPC.clamp(o.papl / 40, 0, 1) * 12;
      ctx.save();
      ctx.fillStyle = SIPC.cssVar('--text-muted');
      ctx.fillRect(rx + 4, pistonY, tw - 8, 7);
      ctx.strokeStyle = SIPC.cssVar('--accent-exo', '#f87171');
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const px = rx + tw * .22 + i * tw * .28;
        ctx.beginPath();
        ctx.moveTo(px, pistonY - 15);
        ctx.lineTo(px, pistonY - 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px - 4, pistonY - 7);
        ctx.lineTo(px, pistonY - 2);
        ctx.lineTo(px + 4, pistonY - 7);
        ctx.stroke();
      }
      ctx.restore();
      SIPC.kChip(ctx, `${SIPC.fmt(o.papl, 1)} atm aplicada`, rx + tw / 2, pistonY + 20, {
        size: 10,
        fg: SIPC.cssVar('--accent-exo')
      });
    }
    if (o.reversed) {
      SIPC.kLabel(ctx, 'OSMOSE REVERSA — água pura sendo extraída do lado concentrado', cx, topY - 32, {
        size: 11,
        bold: true,
        color: SIPC.cssVar('--accent-exo', '#f87171')
      });
    }

    // fluxo de água atravessando a membrana — pontinhos em movimento contínuo,
    // não uma seta estática, para deixar claro que é um processo em curso
    if (o.rel !== 'iso') {
      const dir = o.rel === 'dir' ? 1 : -1;
      const yFlow = bot - 16;
      const pts = dir === 1 ? [[cx - 26, yFlow], [cx + 26, yFlow]] : [[cx + 26, yFlow], [cx - 26, yFlow]];
      SIPC.kFlowDots(ctx, pts, SIPC.isReduced() ? 0 : this.fase * .5, 3, o.reversed ? SIPC.cssVar('--accent-exo', '#f87171') : SIPC.cssVar('--accent-ok', '#4ade80'), {
        r: 2.4
      });
    }

    // só UM rótulo por região — o estado geral (isotônico/hipertônico) já
    // aparece no rótulo do canvas (overlay HTML), então aqui ficam só os
    // dados específicos de cada coluna e da membrana, sem repetir a mesma
    // informação duas vezes
    SIPC.kChip(ctx, `${SIPC.fmt(o.Me, 2)} mol/L · π ${SIPC.fmt(o.pe, 2)} atm`, lx + tw / 2, topY - 18, {
      size: 11
    });
    SIPC.kChip(ctx, `${SIPC.fmt(o.Md, 2)} mol/L · π ${SIPC.fmt(o.pd, 2)} atm`, rx + tw / 2, topY - 18, {
      size: 11
    });
    SIPC.kLabel(ctx, 'membrana semipermeável', cx, bot + 20, {
      size: 10,
      color: SIPC.cssVar('--accent-amber')
    });
  }
  _drawHenry(ctx, W, H, app) {
    const K = this.henry,
      g = K.gas;
    // garrafa e gráfico bem maiores — usam proporções do canvas, não mais
    // um tamanho fixo pequeno perdido numa área grande e vazia
    const cx = SIPC.clamp(W * .24, 100, 190),
      topY = H * .14,
      bw = SIPC.clamp(W * .2, 110, 190),
      bh = Math.min(H * .62, 320);
    const Patual = K.aberto ? 1 : K.P;
    ctx.save();
    ctx.translate(cx, 0);
    const box = SIPC.kBeaker(ctx, 0, topY, bw, bh, .68, g.cor, {
      alpha: .18 + .55 * SIPC.clamp(K.C / (g.kH25 * 10), 0, 1),
      rotulo: g.nome
    });
    // gás dissolvido: pontinhos numerosos e praticamente parados (só um leve
    // tremor browniano), com densidade proporcional a C — bem diferente das
    // bolhas grandes que sobem e escapam quando a garrafa está aberta.
    const nMicro = SIPC.clamp(Math.round(K.C / g.kH25 * 14), 3, 46);
    const fz = SIPC.isReduced() ? 0 : this.fase;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < nMicro; i++) {
      const seed = i * 7.319;
      const jx = Math.sin(fz * 1.3 + seed) * 2,
        jy = Math.cos(fz * 1.1 + seed * 1.7) * 2;
      const mx = Math.sin(seed) * (bw * .32) + jx;
      const my = box.y + 6 + (Math.cos(seed * 2.1) * .5 + .5) * (box.h - 12) + jy;
      ctx.globalAlpha = .3 + .25 * Math.sin(seed * 3);
      ctx.beginPath();
      ctx.arc(mx, my, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    SIPC.kDrawBubbles(ctx, K.bolhas, 'rgba(255,255,255,.75)');
    ctx.save();
    ctx.globalAlpha = SIPC.clamp(Patual / 6, .08, .5);
    ctx.fillStyle = g.cor;
    ctx.beginPath();
    ctx.ellipse(0, topY - 2, bw * .42, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = SIPC.cssVar('--glass');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, topY - 18);
    ctx.lineTo(-14, topY - 30);
    ctx.lineTo(14, topY - 30);
    ctx.lineTo(14, topY - 18);
    ctx.stroke();
    if (!K.aberto) {
      ctx.fillStyle = SIPC.cssVar('--accent-amber');
      ctx.fillRect(-16, topY - 34, 32, 8);
    }
    ctx.restore();
    ctx.restore();
    SIPC.kChip(ctx, K.aberto ? 'ABERTA · 1 atm' : `FECHADA · ${SIPC.fmt(K.P, 1)} atm`, cx, topY + bh + 26, {
      fg: K.aberto ? SIPC.cssVar('--accent-ok') : SIPC.cssVar('--accent-amber'),
      bold: true,
      size: 11
    });
    if (K.liberando) SIPC.kChip(ctx, 'liberando gás…', cx, topY + bh + 46, {
      fg: SIPC.cssVar('--accent-exo'),
      size: 10
    });
    const gx = W * .48,
      gy = H * .1,
      gw = Math.min(W * .46, 440),
      gh = Math.min(H - 130, 340);
    const kH = this._henryKH(g, K.T),
      pmax = 12;
    const A = SIPC.kAxes(ctx, {
      x: gx,
      y: gy,
      w: gw,
      h: gh,
      xmin: 0,
      xmax: pmax,
      ymin: 0,
      ymax: kH * pmax * 1.18,
      xticks: [0, 2, 4, 6, 8, 10, 12],
      yticks: [0, kH * 4, kH * 8, kH * 12].map(v => Number(v.toFixed(6))),
      xlab: 'Pressão (atm)',
      ylab: 'C dissolvida (mol/L)',
      fmty: v => SIPC.fmt(v * 1000, 1)
    });
    const pts = [];
    for (let p = 0; p <= pmax; p += .25) pts.push([p, kH * p]);
    SIPC.kLine(ctx, pts, A.px, A.py, {
      color: g.cor,
      w: 2.6
    });
    // só o marcador do ponto atual — o valor exato de C já está no painel de
    // resultados e no rótulo do topo do canvas, então não repetimos aqui
    ctx.save();
    ctx.fillStyle = g.cor;
    ctx.beginPath();
    ctx.arc(A.px(Patual), A.py(K.C), 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    SIPC.kLabel(ctx, `escala do eixo Y ×10⁻³ mol/L · kH a ${SIPC.fmt(K.T, 0)} °C = ${SIPC.fmt(kH * 1000, 2)}×10⁻³`, gx + gw / 2, gy + gh + 30, {
      size: 10,
      color: SIPC.cssVar('--text-secondary')
    });
  }
  _drawRaoult(ctx, W, H) {
    if (this.raoult.vista === 'balao') return this._drawRaoultBalao(ctx, W, H);
    if (this.raoult.vista === 'desafio') return this._drawRaoultDesafio(ctx, W, H);
    const r = this._raoult();
    const pmax = Math.max(r.PA0, r.PB0) * 1.35;
    const gw = W - 104,
      gh = H - 118;

    // legenda explicativa em linguagem simples — muda conforme o tipo de
    // desvio, pra deixar claro ANTES de olhar o gráfico o que está em jogo
    const explicacao = r.Am === 0 ? `${r.A.nome} e ${r.B.nome} interagem entre si igual a como interagem consigo mesmas — mistura ideal, segue Raoult à risca.` : r.Am > 0 ? `${r.A.nome} e ${r.B.nome} se atraem MENOS entre si do que consigo mesmas — "preferem" escapar, então a pressão real fica ACIMA do previsto.` : `${r.A.nome} e ${r.B.nome} se atraem MAIS entre si do que consigo mesmas — "preferem" ficar líquidas, então a pressão real fica ABAIXO do previsto.`;
    SIPC.kLabel(ctx, explicacao, W / 2, 16, {
      size: 11,
      bold: true,
      color: SIPC.cssVar('--text-primary'),
      maxW: gw + 60
    });
    const m = SIPC.kAxes(ctx, {
      x: 58,
      y: 46,
      w: gw,
      h: gh,
      xmin: 0,
      xmax: 1,
      ymin: 0,
      ymax: pmax,
      xticks: [0, .25, .5, .75, 1],
      yticks: [0, pmax * .25, pmax * .5, pmax * .75, pmax],
      xlab: `fração molar de ${r.A.nome} (x)`,
      ylab: 'Pressão de vapor (mmHg)'
    });

    // reta ideal (Lei de Raoult) — sempre uma linha reta entre P°B (x=0) e P°A (x=1)
    ctx.save();
    ctx.setLineDash([5, 4]);
    SIPC.kLine(ctx, [[0, r.PB0], [1, r.PA0]], m.px, m.py, {
      color: SIPC.cssVar('--text-muted'),
      w: 1.8
    });
    ctx.setLineDash([]);
    ctx.restore();
    SIPC.kLabel(ctx, 'previsão ideal (Raoult)', m.px(.5), m.py((r.PA0 + r.PB0) / 2) - 10, {
      size: 10,
      color: SIPC.cssVar('--text-muted')
    });

    // curva real (ideal, positiva ou negativa) — recortada à área do gráfico
    // por segurança, mesmo cuidado do modo de pressão de vapor
    const curvaReal = [];
    for (let x = 0; x <= 1.0001; x += 0.02) curvaReal.push([Math.min(x, 1), this._raoultP(Math.min(x, 1), this.raoult.T, r.Am, r.A, r.B).Preal]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(58, 46, gw, gh);
    ctx.clip();
    SIPC.kLine(ctx, curvaReal, m.px, m.py, {
      color: SIPC.cssVar('--accent-primary', '#60a5fa'),
      w: 2.8
    });
    ctx.restore();
    SIPC.kLabel(ctx, 'realidade medida', m.px(.5), m.py(this._raoultP(.5, this.raoult.T, r.Am, r.A, r.B).Preal) + (r.Am >= 0 ? 16 : -14), {
      size: 10,
      color: SIPC.cssVar('--accent-primary'),
      bold: true
    });

    // pontos dos líquidos puros
    SIPC.kLabel(ctx, `${r.B.nome} pura`, m.px(0) + 4, m.py(r.PB0) - 10, {
      size: 10,
      align: 'left',
      color: r.B.cor,
      bold: true
    });
    SIPC.kLabel(ctx, `${r.A.nome} pura`, m.px(1) - 4, m.py(r.PA0) - 10, {
      size: 10,
      align: 'right',
      color: r.A.cor,
      bold: true
    });

    // azeótropo, se existir — caixa de explicação, não só um chip pequeno
    if (r.azeo) {
      ctx.save();
      ctx.fillStyle = SIPC.cssVar('--accent-amber', '#fbbf24');
      ctx.beginPath();
      ctx.arc(m.px(r.azeo.x), m.py(r.azeo.p), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      const ladoDir = r.azeo.x > .6;
      const bx = m.px(r.azeo.x) + (ladoDir ? -8 : 8);
      const by = m.py(r.azeo.p) + (r.Am > 0 ? -46 : 34);
      SIPC.kChip(ctx, `azeótropo em x≈${SIPC.fmt(r.azeo.x, 2)}`, bx, by, {
        fg: SIPC.cssVar('--accent-amber'),
        bold: true,
        size: 11,
        border: SIPC.cssVar('--accent-amber'),
        align: ladoDir ? 'right' : 'left'
      });
      SIPC.kLabel(ctx, 'aqui destilar não separa mais os líquidos', bx, by + 16, {
        size: 9,
        color: SIPC.cssVar('--accent-amber'),
        align: ladoDir ? 'right' : 'left'
      });
    }
    // referência real documentada (etanol+água): uma linha fina mostrando
    // onde o azeótropo REAL fica, pra comparar com o previsto pelo modelo
    if (r.realRef) {
      ctx.save();
      ctx.setLineDash([2, 3]);
      ctx.strokeStyle = SIPC.cssVar('--accent-ok', '#4ade80');
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(m.px(r.realRef.xA), m.py(0));
      ctx.lineTo(m.px(r.realRef.xA), m.py(pmax * .18));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      SIPC.kLabel(ctx, `valor real: x≈${SIPC.fmt(r.realRef.xA, 2)}`, m.px(r.realRef.xA), m.py(pmax * .18) + 14, {
        size: 9,
        color: SIPC.cssVar('--accent-ok'),
        bold: true
      });
    }

    // composição atual — guia pontilhada + marcador
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = SIPC.cssVar('--text-muted');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(m.px(r.xA), m.py(0));
    ctx.lineTo(m.px(r.xA), m.py(r.Preal));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = SIPC.cssVar('--accent-ok', '#4ade80');
    ctx.beginPath();
    ctx.arc(m.px(r.xA), m.py(r.Preal), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = SIPC.cssVar('--text-secondary');
    ctx.beginPath();
    ctx.arc(m.px(r.xA), m.py(r.Pideal), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    const desvioTxt = r.Am === 0 ? 'ideal — segue Raoult' : r.Am > 0 ? 'desvio positivo' : 'desvio negativo';
    SIPC.kLabel(ctx, `x=${SIPC.fmt(r.xA, 2)} · P real ${SIPC.fmt(r.Preal, 0)} mmHg · P ideal ${SIPC.fmt(r.Pideal, 0)} mmHg · ${desvioTxt}`, m.px(.5), m.py(0) + 30, {
      size: 11,
      color: SIPC.cssVar('--text-secondary')
    });
  }

  /** MECÂNICA 1 — Visão Balão: em vez de olhar só pro gráfico, o estudante
   *  monta a mistura pingando mL de cada líquido (convertidos em mol via
   *  densidade/massa molar) num balão FECHADO, e vê partículas líquidas e
   *  de vapor — a cor do vapor reflete Yₐ, a composição real do vapor em
   *  equilíbrio (o que sairia primeiro numa destilação). */
  _drawRaoultBalao(ctx, W, H) {
    const Ra = this.raoult;
    const mol = this._raoultMoles();
    const Am = Ra.desvio === 'positivo' ? 1.1 : Ra.desvio === 'negativo' ? -1.1 : 0;
    const r = this._raoultP(mol.xA, Ra.T, Am, mol.A, mol.B);
    const cx = SIPC.clamp(W * .3, 140, 230),
      topY = H * .16,
      bw = SIPC.clamp(W * .26, 150, 230),
      bh = Math.min(H * .58, 300);
    SIPC.kLabel(ctx, `Balão fechado: ${mol.A.nome} + ${mol.B.nome} a ${SIPC.fmt(Ra.T, 0)} °C`, W / 2, 18, {
      size: 12,
      bold: true,
      color: SIPC.cssVar('--text-primary')
    });
    ctx.save();
    ctx.translate(cx, 0);
    const corLiquido = SIPC.kMix(mol.A.cor, mol.B.cor, mol.xA);
    const box = SIPC.kBeaker(ctx, 0, topY, bw, bh, .48, corLiquido, {
      alpha: .4,
      rotulo: `x_A = ${SIPC.fmt(mol.xA, 2)}`
    });

    // partículas líquidas: nº proporcional aos mols de cada componente
    const nLiq = 46,
      nLiqA = Math.round(nLiq * mol.xA);
    ctx.save();
    for (let i = 0; i < nLiq; i++) {
      const seed = i * 12.9898;
      const px = Math.sin(seed) * (bw * .38);
      const py = box.y + box.h * .25 + (Math.cos(seed * 2.1) * .5 + .5) * (box.h * .68);
      ctx.fillStyle = i < nLiqA ? mol.A.cor : mol.B.cor;
      ctx.globalAlpha = .8;
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // vapor no espaço selado acima do líquido — quantidade ∝ pressão total,
    // MISTURA de cores ∝ Yₐ (não é a mesma proporção do líquido!)
    const fz = SIPC.isReduced() ? 0 : this.fase;
    const nVapor = SIPC.clamp(Math.round(r.Preal / 10), 4, 60);
    const nVaporA = Math.round(nVapor * r.YA);
    ctx.save();
    for (let i = 0; i < nVapor; i++) {
      const seed = i * 7.319 + 100;
      const jx = Math.sin(fz * 1.2 + seed) * 4,
        jy = Math.cos(fz * 1.4 + seed * 1.6) * 4;
      const px = Math.sin(seed) * (bw * .42) + jx;
      const py = topY + 10 + (Math.cos(seed * 2.3) * .5 + .5) * (box.y - topY - 8) + jy;
      ctx.fillStyle = i < nVaporA ? mol.A.cor : mol.B.cor;
      ctx.globalAlpha = .55;
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // selo do balão (fechado — nada escapa, só redistribui entre líquido e vapor)
    ctx.save();
    ctx.strokeStyle = SIPC.cssVar('--glass');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, topY - 4);
    ctx.lineTo(-14, topY - 20);
    ctx.lineTo(14, topY - 20);
    ctx.lineTo(14, topY - 4);
    ctx.stroke();
    ctx.fillStyle = SIPC.cssVar('--accent-amber');
    ctx.fillRect(-16, topY - 24, 32, 8);
    ctx.restore();
    ctx.restore();

    // legendas de cor + composição do vapor vs líquido, lado a lado
    const gx = W * .62,
      gy = H * .18;
    SIPC.kChip(ctx, `${mol.A.nome}`, gx, gy, {
      fg: mol.A.cor,
      bold: true,
      size: 12,
      border: mol.A.cor
    });
    SIPC.kChip(ctx, `${mol.B.nome}`, gx + 130, gy, {
      fg: mol.B.cor,
      bold: true,
      size: 12,
      border: mol.B.cor
    });
    SIPC.kLabel(ctx, `líquido: x_A = ${SIPC.fmt(mol.xA, 2)}  ·  vapor: Y_A = ${SIPC.fmt(r.YA, 2)}`, gx + 60, gy + 32, {
      size: 12,
      bold: true,
      color: SIPC.cssVar('--text-primary')
    });
    const destaque = r.YA > mol.xA + 0.03 ? `${mol.A.nome} é mais volátil — o vapor fica mais rico nele que o líquido.` : r.YA < mol.xA - 0.03 ? `${mol.B.nome} é mais volátil aqui — o vapor fica mais pobre em ${mol.A.nome} que o líquido.` : 'Vapor e líquido têm composição parecida nesse ponto.';
    SIPC.kLabel(ctx, destaque, gx + 60, gy + 54, {
      size: 10,
      color: SIPC.cssVar('--text-secondary'),
      maxW: 240
    });
    SIPC.kLabel(ctx, `P total = ${SIPC.fmt(r.Preal, 0)} mmHg`, gx + 60, gy + 78, {
      size: 11,
      color: SIPC.cssVar('--text-secondary')
    });
  }

  /** MECÂNICA 2 — Desafio da Destilação: a cada clique em "Destilar", a
   *  composição do líquido SALTA para a composição do vapor em equilíbrio
   *  (Yₐ) — simulando um estágio de destilação simples. Repetir isso
   *  aproxima de x=1 (pureza) SE não houver azeótropo no caminho; se
   *  houver (par real: etanol+água), a composição trava exatamente nele. */
  _drawRaoultDesafio(ctx, W, H) {
    const Ra = this.raoult;
    const desafio = this.D.DESAFIOS_DESTILACAO.find(d => d.id === Ra.desafioId);
    const A = this.D.LIQUIDOS.find(l => l.id === desafio.aId),
      B = this.D.LIQUIDOS.find(l => l.id === desafio.bId);
    const Am = desafio.desvio === 'positivo' ? 1.1 : desafio.desvio === 'negativo' ? -1.1 : 0;
    const pmax = Math.max(SIPC.antoinePv(A.antoine, desafio.T), SIPC.antoinePv(B.antoine, desafio.T)) * 1.35;
    const gw = W - 104,
      gh = H - 150;
    SIPC.kLabel(ctx, desafio.nome, W / 2, 16, {
      size: 13,
      bold: true,
      color: SIPC.cssVar('--text-primary')
    });
    SIPC.kLabel(ctx, desafio.contexto, W / 2, 34, {
      size: 10,
      color: SIPC.cssVar('--text-secondary'),
      maxW: gw
    });
    const m = SIPC.kAxes(ctx, {
      x: 58,
      y: 54,
      w: gw,
      h: gh,
      xmin: 0,
      xmax: 1,
      ymin: 0,
      ymax: pmax,
      xticks: [0, .25, .5, .75, 1],
      yticks: [0, pmax * .25, pmax * .5, pmax * .75, pmax],
      xlab: `fração molar de ${A.nome} (x)`,
      ylab: 'Pressão de vapor (mmHg)'
    });
    SIPC.kLine(ctx, [[0, SIPC.antoinePv(B.antoine, desafio.T)], [1, SIPC.antoinePv(A.antoine, desafio.T)]], m.px, m.py, {
      color: SIPC.cssVar('--text-muted'),
      w: 1.6
    });
    const curvaReal = [];
    for (let x = 0; x <= 1.0001; x += 0.02) curvaReal.push([Math.min(x, 1), this._raoultP(Math.min(x, 1), desafio.T, Am, A, B).Preal]);
    ctx.save();
    ctx.beginPath();
    ctx.rect(58, 54, gw, gh);
    ctx.clip();
    SIPC.kLine(ctx, curvaReal, m.px, m.py, {
      color: SIPC.cssVar('--accent-primary', '#60a5fa'),
      w: 2.4
    });
    ctx.restore();

    // trilha do histórico de composições já visitadas (staircase da destilação)
    ctx.save();
    ctx.strokeStyle = SIPC.cssVar('--text-muted');
    ctx.globalAlpha = .5;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([2, 2]);
    Ra.historico.forEach((x, i) => {
      if (i === 0) return;
      const pAnt = this._raoultP(Ra.historico[i - 1], desafio.T, Am, A, B).Preal;
      const pAtu = this._raoultP(x, desafio.T, Am, A, B).Preal;
      ctx.beginPath();
      ctx.moveTo(m.px(Ra.historico[i - 1]), m.py(pAnt));
      ctx.lineTo(m.px(x), m.py(pAtu));
      ctx.stroke();
    });
    ctx.setLineDash([]);
    ctx.restore();
    Ra.historico.forEach((x, i) => {
      const p = this._raoultP(x, desafio.T, Am, A, B).Preal;
      ctx.save();
      ctx.fillStyle = SIPC.cssVar('--text-muted');
      ctx.globalAlpha = .35 + .5 * (i / Math.max(1, Ra.historico.length - 1));
      ctx.beginPath();
      ctx.arc(m.px(x), m.py(p), 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // ponto atual — grande, com pulso se travado
    const pAtual = this._raoultP(Ra.desafioXA, desafio.T, Am, A, B).Preal;
    const pulso = Ra.travado && !SIPC.isReduced() ? Math.sin(this.fase * 4) * 2 : 0;
    ctx.save();
    ctx.fillStyle = Ra.travado ? SIPC.cssVar('--accent-exo', '#f87171') : SIPC.cssVar('--accent-ok', '#4ade80');
    ctx.beginPath();
    ctx.arc(m.px(Ra.desafioXA), m.py(pAtual), 7 + pulso, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // azeótropo de referência (mesma varredura do modo gráfico)
    if (Am !== 0) {
      let best = null;
      for (let x = 0.02; x <= 0.98; x += 0.01) {
        const p = this._raoultP(x, desafio.T, Am, A, B).Preal;
        if (!best || (Am > 0 ? p > best.p : p < best.p)) best = {
          x,
          p
        };
      }
      if (best.x > 0.03 && best.x < 0.97) {
        ctx.save();
        ctx.strokeStyle = SIPC.cssVar('--accent-amber');
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(m.px(best.x), m.py(0));
        ctx.lineTo(m.px(best.x), m.py(pmax));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // status: progresso normal ou travado no azeótropo
    const statusY = H - 46;
    if (Ra.travado) {
      SIPC.kIconLock(ctx, W / 2, statusY - 16, 15, SIPC.cssVar('--accent-exo', '#f87171'));
      SIPC.kLabel(ctx, `TRAVADO NO AZEÓTROPO após ${Ra.ciclos} ciclos — o vapor tem a MESMA composição do líquido: destilação simples não passa daqui.`, W / 2, statusY, {
        size: 12,
        bold: true,
        color: SIPC.cssVar('--accent-exo', '#f87171'),
        maxW: gw
      });
    } else {
      SIPC.kLabel(ctx, `Ciclo ${Ra.ciclos} · pureza de ${A.nome}: ${SIPC.fmt(Ra.desafioXA * 100, 1)}%`, W / 2, statusY, {
        size: 12,
        bold: true,
        color: SIPC.cssVar('--accent-ok', '#4ade80')
      });
    }
  }

  /* ── resultados ── */
  getResults() {
    if (this.modo === 'pvap') {
      const s = this._pv();
      return [{
        l: 'Líquido',
        v: this.liquido.nome
      }, {
        l: 'Temperatura',
        v: SIPC.fmt(this.tpv, 0) + ' °C'
      }, {
        l: 'Pressão de vapor',
        v: SIPC.fmt(s.pv, 1) + ' mmHg'
      }, {
        l: 'Pressão externa',
        v: SIPC.fmt(this.patm, 0) + ' mmHg'
      }, {
        l: 'Ferve a',
        v: SIPC.fmt(s.te, 1) + ' °C'
      }, {
        l: 'Estado',
        v: s.fervendo ? 'em ebulição' : 'líquido',
        cls: s.fervendo ? 'val-exo' : ''
      }];
    }
    if (this.modo === 'colig') {
      const c = this._colig(),
        S = this.solvente;
      return [{
        l: 'Solvente',
        v: S.nome
      }, {
        l: 'Soluto',
        v: this.soluto.nome
      }, {
        l: 'Fator i',
        v: String(this.soluto.i)
      }, {
        l: 'Molalidade W',
        v: SIPC.fmt(this.w, 2) + ' mol/kg'
      }, {
        l: 'Partículas W·i',
        v: SIPC.fmt(c.part, 2) + ' mol/kg'
      }, {
        l: 'ΔTe',
        v: '+' + SIPC.fmt(c.dte, 2) + ' °C'
      }, {
        l: 'Ferve a',
        v: SIPC.fmt(c.te, 2) + ' °C',
        cls: 'val-exo'
      }, {
        l: 'ΔTc',
        v: '−' + SIPC.fmt(c.dtc, 2) + ' °C'
      }, {
        l: 'Congela a',
        v: SIPC.fmt(c.tc, 2) + ' °C',
        cls: 'val-endo'
      }, {
        l: `P_vapor (${SIPC.fmt(S.Te, 0)} °C)`,
        v: SIPC.fmt(c.p, 1) + ' mmHg'
      }, {
        l: 'Massa molar REAL',
        v: SIPC.fmt(c.Mreal, 1) + ' g/mol'
      }, {
        l: 'Massa molar aparente (se ignorar i)',
        v: SIPC.fmt(c.Map, 1) + ' g/mol',
        cls: this.soluto.i > 1 ? 'val-exo' : ''
      }];
    }
    if (this.modo === 'osmose') {
      const o = this._osm();
      return [{
        l: 'Modo',
        v: this.osm.modoRO ? 'osmose reversa' : 'osmose direta'
      }, {
        l: 'M esquerda' + (this.osm.running ? ' (ao vivo)' : ''),
        v: SIPC.fmt(o.Me, 2) + ' mol/L'
      }, {
        l: 'M direita' + (this.osm.running ? ' (ao vivo)' : ''),
        v: SIPC.fmt(o.Md, 2) + ' mol/L'
      }, {
        l: 'Temperatura',
        v: SIPC.fmt(this.tosm, 0) + ' °C'
      }, {
        l: 'π esquerda',
        v: SIPC.fmt(o.pe, 2) + ' atm'
      }, {
        l: 'π direita',
        v: SIPC.fmt(o.pd, 2) + ' atm'
      }, {
        l: 'Δπ (pressão osmótica)',
        v: SIPC.fmt(o.dpi, 2) + ' atm'
      }, ...(this.osm.modoRO ? [{
        l: 'Pressão aplicada',
        v: SIPC.fmt(o.papl, 1) + ' atm',
        cls: o.reversed ? 'val-exo' : ''
      }] : []), {
        l: 'Fluxo de água',
        v: o.rel === 'iso' ? this.osm.running ? 'equilíbrio atingido' : 'equilíbrio' : (o.rel === 'dir' ? 'esquerda → direita' : 'direita → esquerda') + (o.reversed ? ' (revertido)' : ''),
        cls: o.reversed ? 'val-exo' : 'val-ok'
      }];
    }
    if (this.modo === 'raoult') {
      const Ra = this.raoult;
      if (Ra.vista === 'balao') {
        const mol = this._raoultMoles();
        const Am = Ra.desvio === 'positivo' ? 1.1 : Ra.desvio === 'negativo' ? -1.1 : 0;
        const r = this._raoultP(mol.xA, Ra.T, Am, mol.A, mol.B);
        return [{
          l: 'Vista',
          v: 'Balão (evaporação partícula a partícula)'
        }, {
          l: `${mol.A.nome} adicionado`,
          v: `${SIPC.fmt(Ra.volA, 0)} mL · ${SIPC.fmt(mol.molA, 3)} mol`
        }, {
          l: `${mol.B.nome} adicionado`,
          v: `${SIPC.fmt(Ra.volB, 0)} mL · ${SIPC.fmt(mol.molB, 3)} mol`
        }, {
          l: 'Fração molar do líquido (x_A)',
          v: SIPC.fmt(mol.xA, 3)
        }, {
          l: 'Fração molar do vapor (Y_A)',
          v: SIPC.fmt(r.YA, 3),
          cls: 'val-ok'
        }, {
          l: 'Pressão total',
          v: SIPC.fmt(r.Preal, 0) + ' mmHg'
        }];
      }
      if (Ra.vista === 'desafio') {
        const desafio = this.D.DESAFIOS_DESTILACAO.find(d => d.id === Ra.desafioId);
        return [{
          l: 'Desafio',
          v: desafio.nome
        }, {
          l: 'Ciclos de destilação',
          v: String(Ra.ciclos)
        }, {
          l: `Pureza atual de ${this.D.LIQUIDOS.find(l => l.id === desafio.aId).nome}`,
          v: SIPC.fmt(Ra.desafioXA * 100, 1) + ' %',
          cls: Ra.travado ? 'val-exo' : 'val-ok'
        }, {
          l: 'Estado',
          v: Ra.travado ? 'travado no azeótropo' : 'destilando',
          cls: Ra.travado ? 'val-exo' : ''
        }];
      }
      const r = this._raoult();
      const rows = [{
        l: 'Vista',
        v: 'Gráfico'
      }, {
        l: 'Líquido A',
        v: r.A.nome
      }, {
        l: 'Líquido B',
        v: r.B.nome
      }, {
        l: 'Temperatura',
        v: SIPC.fmt(this.raoult.T, 0) + ' °C'
      }, {
        l: 'Fração molar de A (x)',
        v: SIPC.fmt(r.xA, 2)
      }, {
        l: 'P° de A pura / B pura',
        v: `${SIPC.fmt(r.PA0, 0)} / ${SIPC.fmt(r.PB0, 0)} mmHg`
      }, {
        l: 'P ideal (Raoult)',
        v: SIPC.fmt(r.Pideal, 0) + ' mmHg'
      }, {
        l: 'P real (com desvio)',
        v: SIPC.fmt(r.Preal, 0) + ' mmHg',
        cls: r.Am === 0 ? '' : r.Am > 0 ? 'val-ok' : 'val-exo'
      }, {
        l: 'Tipo de desvio',
        v: r.Am === 0 ? 'ideal (γ=1)' : r.Am > 0 ? 'positivo' : 'negativo'
      }];
      if (r.azeo) rows.push({
        l: 'Azeótropo (x, P)',
        v: `${SIPC.fmt(r.azeo.x, 2)} · ${SIPC.fmt(r.azeo.p, 0)} mmHg`
      });
      if (r.realRef) rows.push({
        l: 'Valor real documentado',
        v: `x≈${SIPC.fmt(r.realRef.xA, 2)} (${r.realRef.fonte})`,
        cls: 'val-ok'
      });
      return rows;
    }
    const K = this.henry,
      kH = this._henryKH(K.gas, K.T);
    const alvo = K.aberto ? this._henryEq(K.gas, K.T, 1) : this._henryEq(K.gas, K.T, K.P);
    return [{
      l: 'Gás',
      v: K.gas.nome
    }, {
      l: 'Temperatura',
      v: SIPC.fmt(K.T, 0) + ' °C'
    }, {
      l: K.aberto ? 'Pressão (atmosférica)' : 'Pressão (garrafa fechada)',
      v: SIPC.fmt(K.aberto ? 1 : K.P, K.aberto ? 0 : 1) + ' atm'
    }, {
      l: 'kH nessa temperatura',
      v: SIPC.fmt(kH * 1000, 3) + '×10⁻³ mol/L/atm'
    }, {
      l: 'C dissolvida (ao vivo)',
      v: SIPC.fmt(K.C * 1000, 3) + '×10⁻³ mol/L',
      cls: 'val-ok'
    }, {
      l: 'C de equilíbrio',
      v: SIPC.fmt(alvo * 1000, 3) + '×10⁻³ mol/L'
    }, {
      l: 'Estado',
      v: K.liberando ? 'liberando gás em bolhas' : K.aberto ? 'aberta, em equilíbrio' : 'fechada, em equilíbrio',
      cls: K.liberando ? 'val-exo' : ''
    }];
  }
  getOverlay() {
    if (this.modo === 'pvap') return `${this.liquido.nome} · ${SIPC.fmt(this.tpv, 0)} °C`;
    if (this.modo === 'colig') return `${this.soluto.nome} em ${this.solvente.nome} · ${SIPC.fmt(this.w, 2)} molal`;
    if (this.modo === 'henry') return `${this.henry.gas.nome} · ${SIPC.fmt(this.henry.C * 1000, 2)}×10⁻³ mol/L`;
    if (this.modo === 'raoult') {
      const Ra = this.raoult;
      if (Ra.vista === 'balao') {
        const mol = this._raoultMoles();
        return `${mol.A.nome}+${mol.B.nome} · x=${SIPC.fmt(mol.xA, 2)}`;
      }
      if (Ra.vista === 'desafio') {
        const desafio = this.D.DESAFIOS_DESTILACAO.find(d => d.id === Ra.desafioId);
        return Ra.travado ? `Travado no azeótropo · ciclo ${Ra.ciclos}` : `${desafio.nome.replace(/^Desafio \d: /, '')} · ciclo ${Ra.ciclos}`;
      }
      const r = this._raoult();
      return r.azeo ? `${r.A.nome}+${r.B.nome} · azeótropo x≈${SIPC.fmt(r.azeo.x, 2)}` : `${r.A.nome}+${r.B.nome} · x=${SIPC.fmt(r.xA, 2)}`;
    }
    const o = this._osm();
    return o.reversed ? `Osmose REVERSA · ${SIPC.fmt(o.papl, 1)} atm aplicada` : o.rel === 'iso' ? 'Soluções isotônicas' : 'Osmose · Δπ ' + SIPC.fmt(o.dpi, 2) + ' atm';
  }
};
