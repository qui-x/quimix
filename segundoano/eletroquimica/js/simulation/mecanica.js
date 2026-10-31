// ══════════════════════════════════════════════════════════════════
// MECÂNICA A — Pilhas e potenciais (origem: SIPIL)
// Modos: montar pilha · espontaneidade · tabela de potenciais
// ══════════════════════════════════════════════════════════════════
SIEL.MechA = class MechA {
  constructor(D) {
    this.D = D;
    this.M = D.METAIS.filter(m => !m.ref);
    this.modo = 'montar';
    this.esq = null;
    this.dir = null;
    this.fita = null;
    this.solucao = null;
    this.destaque = null;
    this.mergulhado = 0; // 0…1 progresso da deposição
    this.imerso = false;
    this.fase = 0;
    this.massaAn = 1;
    this.massaCat = 1;
    this.concEsq = 0;
    this.concDir = 0; // expoente do slider (10^x mol/L) — modo "montar" (Nernst)
  }
  _get(id) {
    return this.D.METAIS.find(m => m.id === id);
  }
  _mdc(a, b) {
    return b < 1e-9 ? a : this._mdc(b, a % b);
  }
  _mmc(a, b) {
    return a * b / this._mdc(a, b);
  }
  /** Concentração em mol/L, sempre em decimal — nunca em potência de 10,
      pra não repetir a confusão do "-1" sem contexto nos controles. */
  _fmtConc(c) {
    return SIEL.fmt(c, c < 0.01 ? 4 : c < 0.1 ? 3 : c < 1 ? 2 : 1);
  }
  build(app) {
    const encher = (selId, sel) => {
      const el = document.getElementById(selId);
      if (!el) return;
      el.innerHTML = '';
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = 'Selecione um metal…';
      if (!sel) ph.selected = true;
      el.appendChild(ph);
      this.M.forEach(m => {
        const o = document.createElement('option');
        o.value = m.id;
        o.textContent = `${m.simb} · ${m.nome} (${SIEL.fmt(m.e0, 2)} V)`;
        if (sel && m.id === sel.id) o.selected = true;
        el.appendChild(o);
      });
    };
    encher('sel-esq', this.esq);
    encher('sel-dir', this.dir);
    encher('sel-fita', this.fita);
    encher('sel-sol', this.solucao);
    SIEL.fillOptGrid('tab-grid', this.D.METAIS.map(m => ({
      value: m.id,
      nome: `${m.simb} / ${m.ion}`,
      dot: m.cor,
      extra: SIEL.fmt(m.e0, 2) + ' V',
      aria: `${m.nome}, potencial padrão de redução ${SIEL.fmt(m.e0, 2)} volts`
    })), this.destaque ? this.destaque.id : null);
  }
  setMode(id) {
    this.modo = id;
  }
  setParam(k, v) {
    if (k === 'esq' || k === 'dir') {
      this[k] = this._get(v) || null;
      if (!this.esq || !this.dir) return {};
      if (this.esq.id === this.dir.id) {
        return {
          warn: 'Os dois eletrodos são do mesmo metal: não há diferença de potencial e a pilha não funciona.'
        };
      }
      const p = this._pilha();
      return {
        say: `${p.anodo.nome} é o ânodo e ${p.catodo.nome} é o cátodo. Diferença de potencial de ${SIEL.fmt(p.de, 2)} volts.`
      };
    }
    if (k === 'concEsq' || k === 'concDir') {
      this[k] = v;
      const p = this._pilha();
      if (!p.valida) return {};
      const foraDoPadrao = Math.abs(p.deN - p.de) > 0.005;
      return {
        say: foraDoPadrao ? `Fora da condição padrão: pela equação de Nernst, ΔE agora é ${SIEL.fmt(p.deN, 2)} volts, contra ${SIEL.fmt(p.de, 2)} volts em condição padrão.` : `Em condição padrão (1 mol/L): ΔE = ${SIEL.fmt(p.deN, 2)} volts.`
      };
    }
    if (k === 'fita' || k === 'solucao') {
      this[k] = this._get(v) || null;
      this.mergulhado = 0;
      this.imerso = false;
      if (!this.fita || !this.solucao) return {};
      if (this.fita.id === this.solucao.id) {
        return {
          warn: 'Fita e solução são do mesmo metal: não há deslocamento, porque não existe metal menos reativo pra comparar.'
        };
      }
      const e = this._espont();
      return {
        say: e.reage ? `Fita de ${this.fita.nome} em solução de ${this.solucao.ion}: a reação é espontânea, delta E igual a ${SIEL.fmt(e.de, 2)} volts.` : `Fita de ${this.fita.nome} em solução de ${this.solucao.ion}: não há reação, delta E igual a ${SIEL.fmt(e.de, 2)} volts.`
      };
    }
    if (k === 'destaque') {
      this.destaque = this.D.METAIS.find(m => m.id === v) || this.destaque;
      return {
        say: `${this.destaque.nome}: potencial padrão de ${SIEL.fmt(this.destaque.e0, 2)} volts.`
      };
    }
    return {};
  }
  action(name) {
    if (name === 'pilha-status') {
      const p = this._pilha();
      if (!p.valida) return SIEL.announce('Selecione dois metais diferentes para montar a pilha.');
      const nernst = Math.abs(p.deN - p.de) > 0.005 ? ` Nas concentrações atuais, a equação de Nernst corrige para ΔE igual a ${SIEL.fmt(p.deN, 2)} volts.` : '';
      return SIEL.announce(`Pilha de ${p.anodo.nome} e ${p.catodo.nome}. No ânodo, polo negativo, ${p.anodo.simb} sólido se oxida a ${p.anodo.ion}, liberando elétrons. No cátodo, polo positivo, ${p.catodo.ion} recebe elétrons e deposita ${p.catodo.simb} sólido. Diferença de potencial padrão de ${SIEL.fmt(p.de, 2)} volts.${nernst} A energia livre vale ${SIEL.fmt(p.dG0, 0)} quilojoules por mol, negativa — é o mesmo critério de espontaneidade da termoquímica: delta E positivo equivale a delta G negativo.`);
    }
    if (name === 'mergulhar') {
      if (!this.fita || !this.solucao) return SIEL.announce('Escolha a fita e a solução antes de mergulhar.');
      this.imerso = true;
      const e = this._espont();
      const c = n => n > 1 ? n + ' ' : '';
      SIEL.announce(e.reage ? `Fita mergulhada. A reação acontece: ${c(e.coefFita)}${this.fita.simb} se oxida a ${c(e.coefFita)}${this.fita.ion}, e ${c(e.coefSol)}${this.solucao.simb} se deposita sobre a fita.` : 'Fita mergulhada. Nada acontece: o metal da fita é menos reativo que o íon da solução.');
    }
    if (name === 'esp-reset') {
      this.imerso = false;
      this.mergulhado = 0;
      SIEL.announce('Fita retirada da solução.');
    }
    if (name === 'tab-status') {
      const m = this.destaque;
      if (!m) return SIEL.announce('Escolha um metal na lista ou use as setas ↑ ↓ para começar.');
      const forca = m.e0 < 0 ? 'bom agente redutor: oxida-se com facilidade' : 'seu íon é bom agente oxidante: reduz-se com facilidade';
      SIEL.announce(`${m.nome}, par ${m.ion} barra ${m.simb}, potencial padrão de redução ${SIEL.fmt(m.e0, 2)} volts. É um ${forca}.`);
    }
  }
  onArrow(dx, dy) {
    if (this.modo !== 'tabela' || !dy) return false;
    if (!this.destaque) {
      // nada escolhido ainda: a primeira seta apenas ativa a régua,
      // começando pelas pontas (Au no topo, Li na base) conforme a
      // direção da tecla.
      this.destaque = this.D.METAIS[dy < 0 ? this.D.METAIS.length - 1 : 0];
      SIEL.fillOptGrid('tab-grid', this.D.METAIS.map(m => ({
        value: m.id,
        nome: `${m.simb} / ${m.ion}`,
        dot: m.cor,
        extra: SIEL.fmt(m.e0, 2) + ' V',
        aria: `${m.nome}, potencial padrão de redução ${SIEL.fmt(m.e0, 2)} volts`
      })), this.destaque.id);
      SIEL.announce(`${this.destaque.nome}, ${SIEL.fmt(this.destaque.e0, 2)} volts.`);
      return true;
    }
    const i = this.D.METAIS.indexOf(this.destaque);
    // D.METAIS está em ordem CRESCENTE de E° (Li primeiro, Au por último),
    // mas na régua visual é o oposto (Au no topo, Li na base — ver
    // _drawTab). Por isso a tecla ↓ precisa DIMINUIR o índice (rumo ao
    // Li, base da tela) e ↑ precisa AUMENTAR (rumo ao Au, topo da tela);
    // sem esse sinal invertido, as setas moviam o destaque na direção
    // contrária à que aparecia na tela.
    const j = SIEL.clamp(i - dy, 0, this.D.METAIS.length - 1);
    if (j === i) return false;
    this.destaque = this.D.METAIS[j];
    SIEL.fillOptGrid('tab-grid', this.D.METAIS.map(m => ({
      value: m.id,
      nome: `${m.simb} / ${m.ion}`,
      dot: m.cor,
      extra: SIEL.fmt(m.e0, 2) + ' V',
      aria: `${m.nome}, potencial padrão de redução ${SIEL.fmt(m.e0, 2)} volts`
    })), this.destaque.id);
    SIEL.announce(`${this.destaque.nome}, ${SIEL.fmt(this.destaque.e0, 2)} volts.`);
    return true;
  }

  /* ── modelos ── */
  _pilha() {
    if (!this.esq || !this.dir) return {
      valida: false,
      de: 0,
      deN: 0,
      anodo: null,
      catodo: null
    };
    const a = this.esq,
      b = this.dir;
    if (a.id === b.id) return {
      valida: false,
      de: 0,
      deN: 0,
      anodo: a,
      catodo: b
    };
    const catodo = a.e0 > b.e0 ? a : b;
    const anodo = a.e0 > b.e0 ? b : a;
    const de = catodo.e0 - anodo.e0;
    const anodoEsq = anodo === a;

    // equação de Nernst: ΔE = ΔE° − (0,0592/n)·log Q, a 25 °C
    // n = mmc dos elétrons trocados; a reação é balanceada multiplicando
    // cada semirreação pelo fator que faz os elétrons coincidirem em n.
    const concAnodo = Math.pow(10, anodoEsq ? this.concEsq : this.concDir);
    const concCatodo = Math.pow(10, anodoEsq ? this.concDir : this.concEsq);
    const n = this._mmc(anodo.n, catodo.n);
    const coefAnodo = n / anodo.n; // expoente do produto [ânodoⁿ⁺] em Q
    const coefCatodo = n / catodo.n; // expoente do reagente [cátodoᵐ⁺] em Q
    const Q = Math.pow(concAnodo, coefAnodo) / Math.pow(concCatodo, coefCatodo);
    const deN = de - 0.0592 / n * Math.log10(Q);

    // ── A PONTE COM A TERMOQUÍMICA: ΔG = −n·F·ΔE ──
    // Todos os ingredientes já estavam calculados aqui (n, ΔE) e a constante
    // de Faraday já estava nos dados; faltava só fazer a conta. É o resultado
    // que amarra o simulador de eletroquímica ao de termoquímica: ΔE > 0
    // significa ΔG < 0, ou seja, exatamente o mesmo critério de espontaneidade
    // que o módulo Espontaneidade do SITQ usa. E, de ΔG° = −R·T·ln K, sai
    // também a constante de equilíbrio da reação da pilha.
    const F = this.D.F; // 96500 C/mol de elétrons
    const dG0 = -n * F * de / 1000; // kJ/mol (÷1000: J → kJ)
    const dG = -n * F * deN / 1000; // idem, nas concentrações atuais
    const R = 8.314,
      T = 298.15;
    const K = Math.exp(n * F * de / (R * T));
    return {
      valida: true,
      anodo,
      catodo,
      de,
      deN,
      anodoEsq,
      n,
      coefAnodo,
      coefCatodo,
      Q,
      concAnodo,
      concCatodo,
      dG0,
      dG,
      K,
      F
    };
  }
  _espont() {
    if (!this.fita || !this.solucao) return {
      de: 0,
      reage: false,
      n: 1,
      coefFita: 1,
      coefSol: 1
    };
    const de = this.solucao.e0 - this.fita.e0;
    const reage = de > 0.001 && this.fita.id !== this.solucao.id;
    // balanceamento por mmc dos elétrons — sem isso, pares com números de
    // oxidação diferentes (ex.: Zn (n=2) deslocando Ag⁺ (n=1)) apareciam
    // com equação global na proporção errada (1:1 em vez de 1:2).
    const n = this._mmc(this.fita.n, this.solucao.n);
    const coefFita = n / this.fita.n; // Zn e Zn²⁺ nessa proporção
    const coefSol = n / this.solucao.n; // Ag⁺ e Ag nessa proporção
    return {
      de,
      reage,
      n,
      coefFita,
      coefSol
    };
  }
  update(dt, app) {
    this.fase += dt;
    if (this.modo === 'espontaneidade' && this.imerso) {
      const e = this._espont();
      if (e.reage) {
        // velocidade proporcional ao ΔE°: uma reação bem espontânea
        // (ex.: Mg em AgNO₃, ΔE° grande) muda de cor visivelmente mais
        // rápido que uma mal espontânea (ex.: Cu em AgNO₃, ΔE° pequeno)
        // — antes a taxa era fixa, sem refletir a reatividade de cada par.
        const taxa = SIEL.clamp(0.08 + e.de * 0.18, 0.08, 0.55);
        this.mergulhado = Math.min(1, this.mergulhado + dt * taxa);
      }
    }
    if (this.modo === 'montar') {
      const p = this._pilha();
      if (p.valida) {
        this.massaAn = SIEL.clamp(this.massaAn - dt * 0.02 * p.deN, 0.25, 1);
        this.massaCat = SIEL.clamp(this.massaCat + dt * 0.02 * p.deN, 1, 1.7);
      }
    }
  }
  draw(ctx, W, H, app) {
    if (this.modo === 'montar') this._drawPilha(ctx, W, H);else if (this.modo === 'espontaneidade') this._drawEsp(ctx, W, H);else this._drawTab(ctx, W, H);
  }
  _drawPilha(ctx, W, H) {
    const p = this._pilha();
    // escala derivada do canvas real: a composição foi desenhada
    // originalmente pra caber num quadro de ~420×280px; em canvases
    // maiores (a maioria das telas), ela ficava pequena no meio de uma
    // área vazia enorme. Agora cresce proporcionalmente ao espaço
    // disponível, respeitando largura E altura, até um teto razoável.
    const scale = SIEL.clamp(Math.min(W / 420, H / 280), 1, 2.8);
    const cx = W / 2,
      cy = H / 2 + 20 * scale;
    const bw = 118 * scale,
      bh = 130 * scale,
      gap = Math.min(W * .22, 130 * scale);
    const xl = cx - gap - bw / 2,
      xr = cx + gap - bw / 2;
    const top = cy - bh / 2;
    if (!p.valida) {
      SIEL.kLabel(ctx, 'Escolha dois metais diferentes', cx, cy, {
        size: 14,
        bold: true,
        color: SIEL.cssVar('--accent-amber', '#fbbf24')
      });
      return;
    }
    const esqM = this.esq,
      dirM = this.dir;
    const esqEhAnodo = esqM === p.anodo;

    // béqueres — a concentração real (Nernst) aparece no rótulo, em decimal.
    // A opacidade também acompanha o progresso da reação (mesmo ritmo,
    // ditado por ΔE, que já move as placas dos eletrodos): o ânodo vai
    // ficando mais concentrado (íons se acumulando), o cátodo mais claro
    // (íons sendo consumidos) — antes as duas soluções ficavam com
    // opacidade fixa, sem refletir a reatividade do par escolhido.
    const progAnodo = SIEL.clamp((1 - this.massaAn) / 0.75, 0, 1);
    const progCatodo = SIEL.clamp((this.massaCat - 1) / 0.7, 0, 1);
    const alphaAnodo = 0.4 + progAnodo * 0.35;
    const alphaCatodo = 0.4 - progCatodo * 0.3;
    const cor = m => m.sol || SIEL.cssVar('--accent-cyan', '#22d3ee');
    ctx.save();
    ctx.translate(xl + bw / 2, 0);
    SIEL.kBeaker(ctx, 0, top, bw, bh, .68, cor(esqM), {
      alpha: esqEhAnodo ? alphaAnodo : alphaCatodo,
      rotulo: `${esqM.ion} ${this._fmtConc(Math.pow(10, this.concEsq))} mol/L`
    });
    ctx.restore();
    ctx.save();
    ctx.translate(xr + bw / 2, 0);
    SIEL.kBeaker(ctx, 0, top, bw, bh, .68, cor(dirM), {
      alpha: esqEhAnodo ? alphaCatodo : alphaAnodo,
      rotulo: `${dirM.ion} ${this._fmtConc(Math.pow(10, this.concDir))} mol/L`
    });
    ctx.restore();

    // eletrodos (largura acompanha a massa)
    const fs = SIEL.clamp(scale, 1, 1.35); // fontes crescem mais devagar que o resto, pra não ficar exagerado
    const placa = (x, m, anodo) => {
      const larg = 15 * scale * (anodo ? this.massaAn : this.massaCat);
      ctx.save();
      ctx.fillStyle = m.cor;
      SIEL.kRound(ctx, x - larg / 2, top - 26 * scale, larg, bh - 8 * scale, 2);
      ctx.fill();
      ctx.strokeStyle = SIEL.cssVar('--border', '#1c2e44');
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      SIEL.kLabel(ctx, m.simb, x, top + bh - 24 * scale, {
        size: 13 * fs,
        bold: true,
        color: '#0b1220'
      });
      SIEL.kChip(ctx, anodo ? 'ÂNODO −' : 'CÁTODO +', x, top + bh + 30 * scale, {
        fg: anodo ? SIEL.cssVar('--accent-cyan', '#22d3ee') : SIEL.cssVar('--accent-main', '#facc15'),
        size: 10 * fs,
        bold: true
      });
    };
    placa(xl + bw / 2, esqM, esqEhAnodo);
    placa(xr + bw / 2, dirM, !esqEhAnodo);

    // fio externo + lâmpada
    const yFio = top - 62 * scale;
    const fio = [[xl + bw / 2, top - 26 * scale], [xl + bw / 2, yFio], [xr + bw / 2, yFio], [xr + bw / 2, top - 26 * scale]];
    ctx.save();
    ctx.strokeStyle = SIEL.cssVar('--text-secondary', '#94a3b8');
    ctx.lineWidth = 2;
    ctx.beginPath();
    fio.forEach((p2, i) => i ? ctx.lineTo(p2[0], p2[1]) : ctx.moveTo(p2[0], p2[1]));
    ctx.stroke();
    ctx.restore();

    // elétrons do ânodo para o cátodo
    const rota = esqEhAnodo ? fio : fio.slice().reverse();
    SIEL.kFlowDots(ctx, rota, this.fase * 0.25 * Math.max(.3, p.deN) % 1, 9, SIEL.cssVar('--accent-cyan', '#22d3ee'), {
      rotulo: true
    });

    // lâmpada — brilho segue o ΔE real (Nernst), não só o padrão
    const brilho = SIEL.clamp(p.deN / 2.5, .1, 1);
    const raioLamp = 26 * scale;
    ctx.save();
    const g = ctx.createRadialGradient(cx, yFio, 2, cx, yFio, raioLamp);
    g.addColorStop(0, `rgba(250,204,21,${brilho})`);
    g.addColorStop(1, 'rgba(250,204,21,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, yFio, raioLamp, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SIEL.cssVar('--accent-main', '#facc15');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, yFio, 11 * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const foraDoPadrao = Math.abs(p.deN - p.de) > 0.005;
    SIEL.kChip(ctx, `ΔE = ${SIEL.fmt(p.deN, 2)} V`, cx, yFio - 34 * scale, {
      fg: SIEL.cssVar('--accent-main'),
      size: 12 * fs,
      bold: true
    });
    if (foraDoPadrao) {
      SIEL.kLabel(ctx, `ΔE° padrão = ${SIEL.fmt(p.de, 2)} V`, cx, yFio - 50 * scale, {
        size: 9 * fs,
        color: SIEL.cssVar('--text-secondary'),
        mono: true
      });
    }

    // ponte salina — tubo em U invertido arqueando por cima dos eletrodos,
    // como nos diagramas de livro-texto (ex.: LibreTexts 6.6, OpenStax
    // 17.2): "an inverted U-tube containing a gel... the salt bridge must
    // be present to close the circuit". A versão anterior desenhava só
    // uma linha fina cujo arco (fixo em 34px, sem acompanhar a escala)
    // ficava quase dentro do líquido em telas maiores — nunca chegava a
    // passar por cima dos eletrodos, que é o ponto central da imagem
    // padrão. Agora ela sobe claramente acima do topo dos eletrodos.
    const pEsq = {
      x: xl + bw - 18 * scale,
      y: top + 12 * scale
    };
    const pDir = {
      x: xr + 18 * scale,
      y: top + 12 * scale
    };
    const topoEletrodo = top - 26 * scale;
    const picoPonte = topoEletrodo - 22 * scale;
    ctx.save();
    ctx.lineCap = 'round';
    // parede do tubo (vidro)
    ctx.strokeStyle = SIEL.cssVar('--border', '#334155');
    ctx.lineWidth = 13 * scale;
    ctx.beginPath();
    ctx.moveTo(pEsq.x, pEsq.y);
    ctx.quadraticCurveTo(cx, picoPonte, pDir.x, pDir.y);
    ctx.stroke();
    // gel do eletrólito inerte, visível dentro do tubo
    ctx.strokeStyle = SIEL.cssVar('--accent-secondary', '#a78bfa');
    ctx.lineWidth = 8 * scale;
    ctx.globalAlpha = .8;
    ctx.beginPath();
    ctx.moveTo(pEsq.x, pEsq.y);
    ctx.quadraticCurveTo(cx, picoPonte, pDir.x, pDir.y);
    ctx.stroke();
    ctx.restore();
    // tampas porosas nas pontas, mergulhadas em cada solução
    ctx.save();
    ctx.fillStyle = SIEL.cssVar('--border', '#334155');
    ctx.beginPath();
    ctx.arc(pEsq.x, pEsq.y, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pDir.x, pDir.y, 6.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    SIEL.kLabel(ctx, 'ponte salina (KCl)', cx, picoPonte - 8 * scale, {
      size: 10 * fs,
      color: SIEL.cssVar('--accent-secondary')
    });
    // (a notação da pilha saiu do canvas — já está na linha "Notação" do
    // painel de Resultados, junto das concentrações de cada íon)
  }
  _drawEsp(ctx, W, H) {
    const cx = W / 2,
      cy = H / 2;
    // mesma lógica de escala do Montar: cresce com o canvas real em vez
    // de ficar num tamanho quase fixo, pequeno demais em telas grandes.
    const scale = SIEL.clamp(Math.min(W / 300, H / 450), 1, 2.4);
    const fs = SIEL.clamp(scale, 1, 1.35);
    const bw = 150 * scale,
      bh = 170 * scale,
      top = cy - bh / 2 + 10 * scale;
    if (!this.fita || !this.solucao) {
      SIEL.kLabel(ctx, 'Escolha a fita e a solução para começar', cx, cy, {
        size: 14,
        bold: true,
        color: SIEL.cssVar('--accent-amber', '#fbbf24')
      });
      return;
    }
    const e = this._espont();

    // solução: cor esmaece à medida que o íon é consumido
    const base = this.solucao.sol || '#7dd3fc';
    const corSol = e.reage ? SIEL.kMix(base, '#dbeafe', this.mergulhado * .8) : base;
    ctx.save();
    ctx.translate(cx, 0);
    SIEL.kBeaker(ctx, 0, top, bw, bh, .7, corSol, {
      alpha: .55,
      rotulo: `solução de ${this.solucao.ion}`
    });
    ctx.restore();

    // fita metálica
    const faixa = 130 * scale;
    const fy = this.imerso ? top - 20 * scale : top - 70 * scale;
    ctx.save();
    ctx.fillStyle = this.fita.cor;
    SIEL.kRound(ctx, cx - 11 * scale, fy, 22 * scale, faixa, 3);
    ctx.fill();
    // depósito do outro metal sobre a fita
    if (e.reage && this.mergulhado > 0.02) {
      ctx.globalAlpha = SIEL.clamp(this.mergulhado, 0, 1);
      ctx.fillStyle = this.solucao.cor;
      const dh = 100 * scale * this.mergulhado;
      SIEL.kRound(ctx, cx - 12 * scale, fy + faixa - dh, 24 * scale, dh, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = SIEL.cssVar('--border', '#1c2e44');
    ctx.lineWidth = 1;
    SIEL.kRound(ctx, cx - 11 * scale, fy, 22 * scale, faixa, 3);
    ctx.stroke();
    ctx.restore();
    SIEL.kLabel(ctx, this.fita.simb, cx, fy - 12 * scale, {
      size: 13 * fs,
      bold: true,
      color: this.fita.cor
    });

    // veredito
    const cor = e.reage ? SIEL.cssVar('--accent-ok', '#4ade80') : SIEL.cssVar('--accent-exo', '#f87171');
    SIEL.kChip(ctx, e.reage ? 'REAÇÃO ESPONTÂNEA' : 'NÃO HÁ REAÇÃO', cx, 30, {
      fg: cor,
      size: 12,
      bold: true
    });
    SIEL.kLabel(ctx, `ΔE° = E°(${this.solucao.ion}) − E°(${this.fita.ion}) = ${SIEL.fmt(this.solucao.e0, 2)} − (${SIEL.fmt(this.fita.e0, 2)}) = ${SIEL.fmt(e.de, 2)} V`, cx, H - 40, {
      size: 11,
      mono: true,
      color: SIEL.cssVar('--text-secondary')
    });
    // (a equação global balanceada saiu daqui — já está na linha
    // "Equação global" do painel de Resultados quando a reação ocorre)
    if (!e.reage) {
      SIEL.kLabel(ctx, `${this.fita.simb} é menos reativo que ${this.solucao.simb}: não desloca`, cx, H - 20, {
        size: 11,
        color: cor
      });
    }
  }

  /** Posições Y da régua de potenciais sem sobreposição de rótulo.
      Preserva a ORDEM (sempre por E° crescente) e usa o espaço livre
      proporcionalmente à diferença real de potencial — mas nunca deixa
      dois rótulos mais próximos que minGap, mesmo quando os E° são
      quase idênticos (ex.: K −2,93 V e Cs −2,92 V, a 0,01 V um do outro,
      que antes caíam a menos de 1px de distância e ficavam ilegíveis). */
  _layoutRuler(metaisOrdenados, top, alt, minGap = 17) {
    const n = metaisOrdenados.length;
    if (n <= 1) return metaisOrdenados.map(() => top + alt / 2);
    const valores = metaisOrdenados.map(m => m.e0);
    // valor absoluto: a lista pode vir crescente ou decrescente (aqui é
    // decrescente, Au→Li), e a distribuição só deve olhar pra MAGNITUDE
    // da diferença entre vizinhos, nunca pro sinal.
    const totalRange = Math.abs(valores[n - 1] - valores[0]) || 1;
    const minTotal = (n - 1) * minGap;
    // tela baixa demais pro mínimo legível: distribui igualmente em vez
    // de garantir minGap — é o melhor possível no espaço que existe.
    const gapBase = minTotal <= alt ? minGap : alt / (n - 1);
    const slack = Math.max(0, alt - minTotal);
    const ys = [top];
    for (let i = 1; i < n; i++) {
      const valueGap = Math.abs(valores[i] - valores[i - 1]);
      ys.push(ys[i - 1] + gapBase + slack * (valueGap / totalRange));
    }
    return ys;
  }
  _drawTab(ctx, W, H) {
    // ordena defensivamente por E° — a régua nunca deve depender de
    // METAIS já vir ordenado no arquivo de dados.
    const M = [...this.D.METAIS].sort((a, b) => b.e0 - a.e0);
    const x = W / 2;
    const top = 50,
      bottomPad = 46;
    // usa a altura real do canvas (sem teto fixo de 300px, que
    // desperdiçava espaço disponível em telas maiores) com um piso
    // mínimo pra não colapsar em janelas muito baixas.
    const alt = Math.max(220, H - top - bottomPad);
    const ys = this._layoutRuler(M, top, alt);

    // régua
    ctx.save();
    ctx.strokeStyle = SIEL.cssVar('--border', '#1c2e44');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + alt);
    ctx.stroke();
    ctx.restore();

    // offsets horizontais escaláveis — em vez de fixos, evitam que
    // setas e legendas saiam da área visível em canvases estreitos.
    const setaX = Math.min(150, W * 0.28);
    const chipX = Math.min(96, W * 0.18);
    M.forEach((m, i) => {
      const y = ys[i];
      const on = !!this.destaque && m.id === this.destaque.id;
      ctx.save();
      ctx.strokeStyle = on ? SIEL.cssVar('--accent-main', '#facc15') : SIEL.cssVar('--text-muted', '#64748b');
      ctx.lineWidth = on ? 2.4 : 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 14, y);
      ctx.lineTo(x + 14, y);
      ctx.stroke();
      ctx.fillStyle = m.cor;
      ctx.beginPath();
      ctx.arc(x, y, on ? 6.5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      SIEL.kLabel(ctx, `${m.simb} / ${m.ion}`, x - 24, y, {
        size: on ? 12 : 11,
        align: 'right',
        bold: on,
        color: on ? SIEL.cssVar('--accent-main') : SIEL.cssVar('--text-secondary')
      });
      SIEL.kLabel(ctx, SIEL.fmt(m.e0, 2) + ' V', x + 24, y, {
        size: on ? 12 : 11,
        align: 'left',
        bold: on,
        mono: true,
        color: on ? SIEL.cssVar('--accent-main') : SIEL.cssVar('--text-secondary')
      });
      if (m.ref) SIEL.kChip(ctx, 'referência', x + chipX, y, {
        fg: SIEL.cssVar('--accent-secondary', '#a78bfa'),
        size: 9
      });
    });
    SIEL.kArrow(ctx, x - setaX, top + alt, x - setaX, top, {
      color: SIEL.cssVar('--accent-cyan', '#22d3ee'),
      w: 2
    });
    SIEL.kLabel(ctx, 'poder oxidante do íon →', x - setaX, top - 16, {
      size: 10,
      color: SIEL.cssVar('--accent-cyan')
    });
    SIEL.kArrow(ctx, x + setaX, top, x + setaX, top + alt, {
      color: SIEL.cssVar('--accent-exo', '#f87171'),
      w: 2
    });
    SIEL.kLabel(ctx, 'poder redutor do metal →', x + setaX, top + alt + 18, {
      size: 10,
      color: SIEL.cssVar('--accent-exo')
    });
    SIEL.kLabel(ctx, 'Potenciais padrão de redução (25 °C, 1 mol/L)', W / 2, 22, {
      size: 12,
      bold: true,
      color: SIEL.cssVar('--text-primary')
    });
  }
  getResults() {
    if (this.modo === 'montar') {
      const p = this._pilha();
      if (!p.valida) {
        const msg = !this.esq || !this.dir ? 'escolha dois metais para montar a pilha' : 'metais iguais';
        return [{
          l: 'Situação',
          v: msg,
          cls: 'val-amber'
        }];
      }
      return [{
        l: 'Ânodo (oxidação)',
        v: `${p.anodo.simb} · ${SIEL.fmt(p.anodo.e0, 2)} V`
      }, {
        l: 'Cátodo (redução)',
        v: `${p.catodo.simb} · ${SIEL.fmt(p.catodo.e0, 2)} V`
      }, {
        l: 'Semirreação anódica',
        v: `${p.anodo.simb} → ${p.anodo.ion} + ${p.anodo.n} e⁻`
      }, {
        l: 'Semirreação catódica',
        v: `${p.catodo.ion} + ${p.catodo.n} e⁻ → ${p.catodo.simb}`
      }, {
        l: `[${p.anodo.ion}]`,
        v: this._fmtConc(p.concAnodo) + ' mol/L'
      }, {
        l: `[${p.catodo.ion}]`,
        v: this._fmtConc(p.concCatodo) + ' mol/L'
      }, {
        l: 'Elétrons trocados (n)',
        v: String(p.n)
      }, {
        l: 'Quociente Q',
        v: SIEL.fmt(p.Q, 4)
      }, {
        l: 'ΔE° (padrão, 1 mol/L)',
        v: SIEL.fmt(p.de, 2) + ' V'
      }, {
        l: 'ΔE (Nernst, agora)',
        v: SIEL.fmt(p.deN, 2) + ' V',
        cls: p.deN > 0 ? 'val-ok' : 'val-exo'
      }, {
        l: 'Espontânea agora?',
        v: p.deN > 0 ? 'sim' : 'não',
        cls: p.deN > 0 ? 'val-ok' : 'val-exo'
      }, /* ── ponte com a termoquímica ── */
      {
        l: '— Energia livre —',
        v: ''
      }, {
        l: 'F (Faraday)',
        v: `${p.F} C/mol e⁻`
      }, {
        l: 'ΔG° = −n·F·ΔE°',
        v: `${SIEL.fmt(p.dG0, 1)} kJ/mol`,
        cls: p.dG0 < 0 ? 'val-ok' : 'val-exo'
      }, {
        l: 'ΔG (nas conc. atuais)',
        v: `${SIEL.fmt(p.dG, 1)} kJ/mol`,
        cls: p.dG < 0 ? 'val-ok' : 'val-exo'
      }, {
        l: 'Critério equivalente',
        v: 'ΔE > 0  ⟺  ΔG < 0  ⟺  espontânea'
      }, {
        l: 'K (de ΔG° = −RT·lnK)',
        v: p.K > 1e15 ? '> 10¹⁵' : p.K.toExponential(2)
      }, {
        l: 'Notação',
        v: `${p.anodo.simb}|${p.anodo.ion}‖${p.catodo.ion}|${p.catodo.simb}`
      }];
    }
    if (this.modo === 'espontaneidade') {
      if (!this.fita || !this.solucao) {
        return [{
          l: 'Situação',
          v: 'escolha a fita e a solução',
          cls: 'val-amber'
        }];
      }
      const e = this._espont();
      const c = n => n > 1 ? n + ' ' : '';
      const linhas = [{
        l: 'Fita',
        v: `${this.fita.simb} · ${SIEL.fmt(this.fita.e0, 2)} V`
      }, {
        l: 'Íon da solução',
        v: `${this.solucao.ion} · ${SIEL.fmt(this.solucao.e0, 2)} V`
      }, {
        l: 'ΔE°',
        v: SIEL.fmt(e.de, 2) + ' V',
        cls: e.reage ? 'val-ok' : 'val-exo'
      }, {
        l: 'Reage?',
        v: e.reage ? 'sim, espontânea' : 'não',
        cls: e.reage ? 'val-ok' : 'val-exo'
      }];
      if (e.reage) {
        linhas.push({
          l: 'Agente redutor',
          v: `${this.fita.simb} (oxida, perde e⁻)`
        }, {
          l: 'Agente oxidante',
          v: `${this.solucao.ion} (reduz, ganha e⁻)`
        }, {
          l: 'Semirreação de oxidação',
          v: `${this.fita.simb} → ${this.fita.ion} + ${this.fita.n} e⁻`
        }, {
          l: 'Semirreação de redução',
          v: `${this.solucao.ion} + ${this.solucao.n} e⁻ → ${this.solucao.simb}`
        }, {
          l: 'Equação global',
          v: `${c(e.coefFita)}${this.fita.simb} + ${c(e.coefSol)}${this.solucao.ion} → ${c(e.coefFita)}${this.fita.ion} + ${c(e.coefSol)}${this.solucao.simb}`
        });
      }
      linhas.push({
        l: 'Deposição',
        v: SIEL.fmt(this.mergulhado * 100, 0) + ' %'
      }, {
        l: 'Fita imersa',
        v: this.imerso ? 'sim' : 'não'
      });
      return linhas;
    }
    const m = this.destaque;
    if (!m) return [{
      l: 'Situação',
      v: 'escolha um metal na lista ou use as setas ↑ ↓',
      cls: 'val-amber'
    }];
    return [{
      l: 'Metal',
      v: m.nome
    }, {
      l: 'Par redox',
      v: `${m.ion} / ${m.simb}`
    }, {
      l: 'Elétrons (n)',
      v: String(m.n)
    }, {
      l: 'E° de redução',
      v: SIEL.fmt(m.e0, 2) + ' V',
      cls: 'val-ok'
    }, {
      l: 'E° de oxidação',
      v: SIEL.fmt(-m.e0, 2) + ' V'
    }, {
      l: 'Caráter',
      v: m.e0 < 0 ? 'bom redutor' : 'íon bom oxidante'
    }, {
      l: 'Posição na régua',
      v: `${[...this.D.METAIS].sort((a, b) => b.e0 - a.e0).findIndex(x => x.id === m.id) + 1}ª de ${this.D.METAIS.length} (topo = mais oxidante)`
    }];
  }
  getOverlay() {
    if (this.modo === 'montar') {
      const p = this._pilha();
      return p.valida ? `${p.anodo.simb} ‖ ${p.catodo.simb} · ΔE ${SIEL.fmt(p.deN, 2)} V` : 'Escolha dois metais';
    }
    if (this.modo === 'espontaneidade') {
      if (!this.fita || !this.solucao) return 'Escolha a fita e a solução';
      const e = this._espont();
      return `${this.fita.simb} em ${this.solucao.ion} · ${e.reage ? 'reage' : 'não reage'}`;
    }
    if (!this.destaque) return 'Escolha um metal';
    return `${this.destaque.simb} · ${SIEL.fmt(this.destaque.e0, 2)} V`;
  }
};
// ══════════════════════════════════════════════════════════════════
// MECÂNICA B — Eletrólise e Faraday (origem: SIELE)
// Modos: ígnea (sal fundido) · aquosa (filas de descarga) · Faraday
// ══════════════════════════════════════════════════════════════════
SIEL.MechB = class MechB {
  constructor(D) {
    this.D = D;
    this.modo = 'ignea';
    // modo 1
    this.sal = null;
    this.iign = 2;
    this.ligada = true;
    this.ions = [];
    this.bolhasAn = [];
    this.bolhasCat = [];
    // modo 2
    this.eletrolito = null;
    this.iaq = 2;
    this.ligadaAq = true;
    this.bAn = [];
    this.bCat = [];
    // modo 3
    this.metal = null;
    this.ifar = 2;
    this.tfar = 1800;
    this.prog = 0;
    this.depositando = false;
    this.fase = 0;
    this._semear();
  }
  build(app) {
    SIEL.fillOptGrid('ignea-grid', this.D.IGNEA.map(s => ({
      value: s.id,
      nome: s.nome,
      dot: s.corAn,
      extra: `${s.cation} / ${s.anion}`,
      aria: `${s.nome}, cátion ${s.cation}, ânion ${s.anion}, funde a ${s.tfusao} graus`
    })), this.sal ? this.sal.id : null);
    SIEL.fillOptGrid('aquosa-grid', this.D.AQUOSA.map(e => ({
      value: e.id,
      nome: e.nome,
      dot: e.corSol,
      extra: `${e.cat} + ${e.an}`,
      aria: `${e.nome} produz ${e.cat} no cátodo e ${e.an} no ânodo`
    })), this.eletrolito ? this.eletrolito.id : null);
    SIEL.fillOptGrid('far-grid', this.D.GALVANO.map(m => ({
      value: m.id,
      nome: m.nome,
      dot: m.cor,
      extra: `${SIEL.fmt(m.M, 2)} · n=${m.n}`,
      aria: `${m.nome}, massa molar ${SIEL.fmt(m.M, 2)} gramas por mol, ${m.n} elétrons por íon`
    })), this.metal ? this.metal.id : null);
  }
  setMode(id) {
    this.modo = id;
  }
  setParam(k, v) {
    switch (k) {
      case 'sal':
        this.sal = this.D.IGNEA.find(s => s.id === v) || this.sal;
        this._semear();
        return {
          say: `${this.sal.nome}. No cátodo forma-se ${this.sal.cat}; no ânodo, ${this.sal.an}.`
        };
      case 'iign':
        this.iign = v;
        break;
      case 'eletrolito':
        this.eletrolito = this.D.AQUOSA.find(e => e.id === v) || this.eletrolito;
        this.bAn = [];
        this.bCat = [];
        return {
          say: `${this.eletrolito.nome}: no cátodo ${this.eletrolito.cat}, no ânodo ${this.eletrolito.an}. ${this.eletrolito.resta}.`
        };
      case 'iaq':
        this.iaq = v;
        break;
      case 'metal':
        this.metal = this.D.GALVANO.find(m => m.id === v) || this.metal;
        this.prog = 0;
        return {
          say: `${this.metal.nome}: massa molar ${SIEL.fmt(this.metal.M, 2)} e ${this.metal.n} elétrons por íon.`
        };
      case 'ifar':
        this.ifar = v;
        this.prog = 0;
        break;
      case 'tfar':
        this.tfar = v;
        this.prog = 0;
        break;
    }
    return {};
  }
  action(name) {
    if (name === 'toggle-fonte') {
      if (!this.sal) return SIEL.announce('Escolha um sal fundido antes de ligar a fonte.');
      this.ligada = !this.ligada;
      SIEL.announce(this.ligada ? `Fonte ligada. Cátions ${this.sal.cation} migram ao cátodo e ânions ${this.sal.anion} ao ânodo.` : 'Fonte desligada: os íons param de migrar.');
    }
    if (name === 'toggle-fonte-aq') {
      if (!this.eletrolito) return SIEL.announce('Escolha um eletrólito antes de ligar a fonte.');
      this.ligadaAq = !this.ligadaAq;
      SIEL.announce(this.ligadaAq ? `Fonte ligada. Cátodo produz ${this.eletrolito.cat} e ânodo produz ${this.eletrolito.an}.` : 'Fonte desligada.');
    }
    if (name === 'depositar') {
      if (!this.metal) return SIEL.announce('Escolha um metal antes de depositar.');
      this.depositando = true;
      this.prog = 0;
      const r = this._faraday();
      SIEL.announce(`Deposição iniciada. Ao fim de ${SIEL.fmt(this.tfar, 0)} segundos serão depositados ${SIEL.fmt(r.m, 4)} gramas de ${this.metal.nome}.`);
    }
    if (name === 'far-reset') {
      this.depositando = false;
      this.prog = 0;
      SIEL.announce('Cuba reiniciada.');
    }
  }
  _semear() {
    this.ions = [];
    for (let i = 0; i < 26; i++) {
      this.ions.push({
        x: (Math.random() - .5) * 210,
        y: (Math.random() - .5) * 90,
        cat: i % 2 === 0,
        ph: Math.random()
      });
    }
  }
  _faraday() {
    if (!this.metal) return {
      Q: 0,
      mole: 0,
      m: 0,
      molE: 0
    };
    const M = this.metal,
      Q = this.ifar * this.tfar;
    const mole = Q / (M.n * this.D.F);
    return {
      Q,
      mole,
      m: mole * M.M,
      molE: Q / this.D.F
    };
  }

  /** Fator de escala da cuba (ígnea/aquosa), usado tanto no update()
      (posição dos íons, caixa das bolhas) quanto no _drawCuba (tamanho
      dos elementos) — precisa ser a MESMA conta nos dois lugares, ou os
      íons se movem numa área diferente da que é desenhada. */
  _cubaScale(W, H) {
    return SIEL.clamp(Math.min(W / 380, H / 340), 1, 2);
  }
  update(dt, app) {
    this.fase += dt;
    const scale = app ? this._cubaScale(app.areaW || app.W, app.H) : 1;   // a MESMA largura do desenho (a área livre)
    if (this.modo === 'ignea' && this.ligada && this.sal) {
      // teto do clamp ampliado na mesma proporção do máximo do slider
      // (0,5–10 A -> 0,5–20 A), pra corrente alta continuar acelerando
      // visivelmente os íons em vez de saturar na metade da faixa nova.
      const v = SIEL.isReduced() ? 0 : 26 * scale * SIEL.clamp(this.iign / 4, .3, 4.4);
      const limite = 105 * scale;
      this.ions.forEach(io => {
        io.x += (io.cat ? -1 : 1) * v * dt;
        if (io.x < -limite) io.x = limite;
        if (io.x > limite) io.x = -limite;
      });
      const boxA = {
        x: 78 * scale,
        y: -46 * scale,
        w: 22 * scale,
        h: 84 * scale
      };
      if (this.sal.gasAn) SIEL.kBubbles(this.bolhasAn, dt, boxA, 12 * this.iign, {});
    }
    if (this.modo === 'aquosa' && this.ligadaAq && this.eletrolito) {
      const E = this.eletrolito;
      const boxA = {
        x: 74 * scale,
        y: -46 * scale,
        w: 22 * scale,
        h: 84 * scale
      };
      const boxC = {
        x: -96 * scale,
        y: -46 * scale,
        w: 22 * scale,
        h: 84 * scale
      };
      if (E.gasAn) SIEL.kBubbles(this.bAn, dt, boxA, 12 * this.iaq, {});
      if (E.gasCat) SIEL.kBubbles(this.bCat, dt, boxC, 12 * this.iaq, {});
    }
    if (this.modo === 'faraday' && this.depositando) {
      // velocidade da animação escalada pela corrente: antes era uma
      // taxa fixa (dt*.35) que terminava sempre no mesmo tempo visual,
      // não importava se eram 0,5 A ou 10 A — mesmo a massa calculada
      // variando 20x entre os dois. Agora corrente maior deposita
      // visivelmente mais rápido, refletindo a física de fato.
      const taxa = this.metal ? SIEL.clamp(0.12 + this.ifar * 0.045, 0.12, 0.6) : 0.35;
      this.prog = Math.min(1, this.prog + dt * taxa);
      if (this.prog >= 1) this.depositando = false;
    }
  }
  draw(ctx, W, H, app) {
    if (this.modo === 'ignea') this._drawCuba(ctx, W, H, false);else if (this.modo === 'aquosa') this._drawCuba(ctx, W, H, true);else this._drawFar(ctx, W, H);
  }
  _drawCuba(ctx, W, H, aquosa) {
    const E = aquosa ? this.eletrolito : this.sal;
    if (!E) {
      SIEL.kLabel(ctx, aquosa ? 'Escolha um eletrólito para começar' : 'Escolha um sal fundido para começar', W / 2, H / 2, {
        size: 14,
        bold: true,
        color: SIEL.cssVar('--accent-amber', '#fbbf24')
      });
      return;
    }
    const on = aquosa ? this.ligadaAq : this.ligada;
    const corr = aquosa ? this.iaq : this.iign;
    // mesma escala usada no update() pros íons — precisa bater, ou o
    // enxame de íons se move numa área diferente do que está desenhado.
    const scale = this._cubaScale(W, H);
    const fs = SIEL.clamp(scale, 1, 1.35);
    const cx = W / 2,
      cy = H / 2 + 26 * scale;
    const bw = 250 * scale,
      bh = 130 * scale;

    // cuba
    const corLiq = aquosa ? E.corSol : '#f59e0b';
    ctx.save();
    ctx.translate(cx, 0);
    SIEL.kBeaker(ctx, 0, cy - bh / 2, bw, bh, .82, corLiq, {
      alpha: aquosa ? .45 : .6,
      rotulo: aquosa ? E.nome + ' — solução' : E.nome
    });
    ctx.restore();
    if (!aquosa) SIEL.kFlame(ctx, cx, cy + bh / 2 + 30 * scale, 18 * scale, this.fase);

    // eletrodos
    const ey = cy - bh / 2 - 26 * scale,
      eh = bh - 6 * scale;
    const ex1 = cx - 86 * scale,
      ex2 = cx + 86 * scale;
    const placa = (x, pos, rot) => {
      ctx.save();
      ctx.fillStyle = SIEL.cssVar('--text-secondary', '#94a3b8');
      SIEL.kRound(ctx, x - 8 * scale, ey, 16 * scale, eh, 2);
      ctx.fill();
      ctx.restore();
      SIEL.kChip(ctx, rot, x, cy + bh / 2 + 20 * scale, {
        fg: pos ? SIEL.cssVar('--accent-exo', '#f87171') : SIEL.cssVar('--accent-cyan', '#22d3ee'),
        size: 10 * fs,
        bold: true
      });
    };
    placa(ex1, false, 'CÁTODO (−)');
    placa(ex2, true, 'ÂNODO (+)');

    // fonte externa e fio
    const yTop = ey - 56 * scale;
    const fio = [[ex1, ey], [ex1, yTop], [cx - 26 * scale, yTop], [cx + 26 * scale, yTop], [ex2, yTop], [ex2, ey]];
    ctx.save();
    ctx.strokeStyle = SIEL.cssVar('--text-secondary');
    ctx.lineWidth = 2;
    ctx.beginPath();
    fio.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke();
    // símbolo da fonte
    ctx.strokeStyle = on ? SIEL.cssVar('--accent-main', '#f87171') : SIEL.cssVar('--text-muted', '#64748b');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 8 * scale, yTop - 12 * scale);
    ctx.lineTo(cx - 8 * scale, yTop + 12 * scale);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx + 8 * scale, yTop - 7 * scale);
    ctx.lineTo(cx + 8 * scale, yTop + 7 * scale);
    ctx.stroke();
    ctx.restore();
    SIEL.kChip(ctx, on ? `fonte ligada · ${SIEL.fmt(corr, 1)} A` : 'fonte desligada', cx, yTop - 28 * scale, {
      fg: on ? SIEL.cssVar('--accent-main') : SIEL.cssVar('--text-muted'),
      size: 11 * fs,
      bold: true
    });

    // elétrons no fio externo: da fonte para o cátodo
    if (on) {
      SIEL.kFlowDots(ctx, [[cx - 26 * scale, yTop], [ex1, yTop], [ex1, ey]], this.fase * .3 % 1, 4, SIEL.cssVar('--accent-cyan', '#22d3ee'), {
        rotulo: true
      });
      SIEL.kFlowDots(ctx, [[ex2, ey], [ex2, yTop], [cx + 26 * scale, yTop]], this.fase * .3 % 1, 4, SIEL.cssVar('--accent-cyan', '#22d3ee'), {});
    }
    if (!aquosa) {
      // íons migrando
      ctx.save();
      ctx.translate(cx, cy);
      this.ions.forEach(io => {
        ctx.fillStyle = io.cat ? this.sal.corCat : this.sal.corAn;
        ctx.beginPath();
        ctx.arc(io.x, io.y, 4.4 * scale, 0, Math.PI * 2);
        ctx.fill();
        SIEL.kLabel(ctx, io.cat ? '+' : '−', io.x, io.y, {
          size: 8 * fs,
          color: '#0b1220',
          bold: true
        });
      });
      ctx.restore();
      // bolhas de gás no ânodo
      ctx.save();
      ctx.translate(cx, cy);
      SIEL.kDrawBubbles(ctx, this.bolhasAn, 'rgba(255,255,255,.7)');
      ctx.restore();
      // metal líquido acumulando no cátodo
      ctx.save();
      ctx.fillStyle = this.sal.corCat;
      ctx.globalAlpha = .8;
      SIEL.kRound(ctx, ex1 - 14 * scale, cy + bh / 2 - 16 * scale, 28 * scale, 12 * scale, 3);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(cx, cy);
      SIEL.kDrawBubbles(ctx, this.bAn, 'rgba(255,255,255,.75)');
      SIEL.kDrawBubbles(ctx, this.bCat, 'rgba(255,255,255,.75)');
      ctx.restore();
      if (!E.gasCat) {
        ctx.save();
        ctx.fillStyle = E.corCat;
        SIEL.kRound(ctx, ex1 - 10 * scale, ey + 12 * scale, 20 * scale, eh - 18 * scale, 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // (semirreações completas e fusão/observação saíram do canvas —
    // já aparecem por extenso e mais legíveis no painel de Resultados;
    // manter os dois lugares só duplicava texto sem ganhar clareza)
  }
  _drawFar(ctx, W, H) {
    if (!this.metal) {
      SIEL.kLabel(ctx, 'Escolha um metal para começar', W / 2, H / 2, {
        size: 14,
        bold: true,
        color: SIEL.cssVar('--accent-amber', '#fbbf24')
      });
      return;
    }
    const r = this._faraday();
    const cx = W / 2,
      cy = H / 2 + 20;
    // mesma lógica de escala dos outros modos: cresce com o canvas real
    // até um teto, em vez de ficar pequeno em telas grandes (antes era
    // só um Math.min, que nunca deixava crescer de verdade).
    const scale = SIEL.clamp(Math.min(W / 380, H / 320), 1, 2.2);
    const fs = SIEL.clamp(scale, 1, 1.35);
    const bw = 230 * scale,
      bh = 140 * scale;
    ctx.save();
    ctx.translate(cx, 0);
    SIEL.kBeaker(ctx, 0, cy - bh / 2, bw, bh, .8, '#7dd3fc', {
      alpha: .35,
      rotulo: `banho de ${this.metal.nome}`
    });
    ctx.restore();

    // peça a ser revestida (cátodo) com camada crescendo
    const px = cx - bw * 0.287,
      ey = cy - bh / 2 - bh * 0.157,
      eh = bh - 4 * scale;
    const pw = bw * 0.139;
    ctx.save();
    ctx.fillStyle = SIEL.cssVar('--text-secondary', '#94a3b8');
    SIEL.kRound(ctx, px - pw / 2, ey, pw, eh, 3);
    ctx.fill();
    // alvo da camada em escala √massa, com teto proporcional à própria
    // peça (não mais um valor fixo em pixels): antes, em massas grandes
    // (ex.: correntes/tempos altos), a camada crescia até ~42px, quase
    // do tamanho do béquer inteiro, e engolia o desenho — inclusive
    // colidindo com os rótulos de baixo. Agora o teto acompanha o
    // tamanho do béquer, então nunca deixa de caber.
    const camAlvo = SIEL.clamp(3 * scale + Math.sqrt(r.m) * 2 * scale, 3 * scale, bw * 0.07);
    const cam = camAlvo * this.prog;
    if (cam > .5) {
      ctx.fillStyle = this.metal.cor;
      SIEL.kRound(ctx, px - pw / 2 - cam, ey - cam / 2, pw + cam * 2, eh + cam, 3);
      ctx.fill();
    }
    ctx.restore();
    SIEL.kChip(ctx, 'peça — CÁTODO (−)', px, cy + bh / 2 + 20 * scale, {
      fg: SIEL.cssVar('--accent-cyan', '#22d3ee'),
      size: 10 * fs,
      bold: true
    });

    // ânodo do metal puro
    const ax = cx + bw * 0.33;
    ctx.save();
    ctx.fillStyle = this.metal.cor;
    SIEL.kRound(ctx, ax - bw * 0.039, ey, bw * 0.078, eh * (1 - this.prog * .18), 3);
    ctx.fill();
    ctx.restore();
    SIEL.kChip(ctx, `${this.metal.nome} — ÂNODO (+)`, ax, cy + bh / 2 + 20 * scale, {
      fg: SIEL.cssVar('--accent-exo', '#f87171'),
      size: 10 * fs,
      bold: true
    });

    // circuito
    const yTop = ey - bh * 0.36;
    ctx.save();
    ctx.strokeStyle = SIEL.cssVar('--text-secondary');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, ey);
    ctx.lineTo(px, yTop);
    ctx.lineTo(ax, yTop);
    ctx.lineTo(ax, ey);
    ctx.stroke();
    ctx.restore();
    if (this.depositando) {
      SIEL.kFlowDots(ctx, [[ax, ey], [ax, yTop], [px, yTop], [px, ey]], this.fase * .35 % 1, 7, SIEL.cssVar('--accent-cyan', '#22d3ee'), {
        rotulo: true
      });
    }
    SIEL.kChip(ctx, `${SIEL.fmt(this.ifar, 1)} A durante ${SIEL.fmt(this.tfar, 0)} s`, cx, yTop - 24 * scale, {
      fg: SIEL.cssVar('--accent-main', '#f87171'),
      size: 11 * fs,
      bold: true
    });

    // (o rótulo "X depositado: Y g" que ficava aqui, perto do topo, saiu:
    // é a mesma informação do selo overlay-label — mesmo texto, mesma
    // posição — então as duas colidiam visualmente. O selo já resolve.)

    // barra de progresso
    if (this.prog > 0) {
      const barW = Math.min(W - 80, 300);
      ctx.save();
      ctx.fillStyle = SIEL.cssVar('--border', '#1c2e44');
      SIEL.kRound(ctx, cx - barW / 2, H - 26, barW, 8, 4);
      ctx.fill();
      ctx.fillStyle = this.metal.cor;
      SIEL.kRound(ctx, cx - barW / 2, H - 26, Math.max(4, barW * this.prog), 8, 4);
      ctx.fill();
      ctx.restore();
    }
  }
  getResults() {
    if (this.modo === 'ignea') {
      if (!this.sal) return [{
        l: 'Situação',
        v: 'escolha um sal fundido',
        cls: 'val-amber'
      }];
      const s = this.sal;
      return [{
        l: 'Sal fundido',
        v: s.nome
      }, {
        l: 'Fusão',
        v: s.tfusao + ' °C'
      }, {
        l: 'Cátodo (−)',
        v: s.semiCat,
        cls: 'val-endo'
      }, {
        l: 'Ânodo (+)',
        v: s.semiAn,
        cls: 'val-exo'
      }, {
        l: 'Produto catódico',
        v: s.cat
      }, {
        l: 'Produto anódico',
        v: s.an
      }, {
        l: 'Corrente',
        v: SIEL.fmt(this.iign, 1) + ' A'
      }, {
        l: 'Fonte',
        v: this.ligada ? 'ligada' : 'desligada',
        cls: this.ligada ? 'val-ok' : ''
      }];
    }
    if (this.modo === 'aquosa') {
      if (!this.eletrolito) return [{
        l: 'Situação',
        v: 'escolha um eletrólito',
        cls: 'val-amber'
      }];
      const E = this.eletrolito;
      // "Produtos" saiu (repetia Cátodo+Ânodo) e as duas filas completas
      // de descarga saíram (texto de referência genérico, despejado
      // inteiro em toda seleção — poluía o painel). A "Observação" já
      // traz o porquê específico deste eletrólito; a fila geral continua
      // acessível no card "Sobre o modo", à esquerda.
      return [{
        l: 'Eletrólito',
        v: E.nome
      }, {
        l: 'Cátodo (−)',
        v: E.semiCat,
        cls: 'val-endo'
      }, {
        l: 'Ânodo (+)',
        v: E.semiAn,
        cls: 'val-exo'
      }, {
        l: 'Observação',
        v: E.resta
      }, {
        l: 'Fonte',
        v: this.ligadaAq ? 'ligada' : 'desligada',
        cls: this.ligadaAq ? 'val-ok' : ''
      }];
    }
    if (!this.metal) return [{
      l: 'Situação',
      v: 'escolha um metal',
      cls: 'val-amber'
    }];
    const r = this._faraday(),
      M = this.metal;
    return [{
      l: 'Metal',
      v: M.nome
    }, {
      l: 'Massa molar',
      v: SIEL.fmt(M.M, 2) + ' g/mol'
    }, {
      l: 'Elétrons (n)',
      v: String(M.n)
    }, {
      l: 'Corrente',
      v: SIEL.fmt(this.ifar, 1) + ' A'
    }, {
      l: 'Tempo',
      v: SIEL.fmt(this.tfar, 0) + ' s (' + SIEL.fmt(this.tfar / 60, 1) + ' min)'
    }, {
      l: 'Carga Q = i·t',
      v: SIEL.fmt(r.Q, 0) + ' C'
    }, {
      l: 'mol de elétrons',
      v: SIEL.fmt(r.molE, 5) + ' mol'
    }, {
      l: 'mol de metal',
      v: SIEL.fmt(r.mole, 5) + ' mol'
    }, {
      l: 'Massa depositada',
      v: SIEL.fmt(r.m, 4) + ' g',
      cls: 'val-ok'
    }];
  }
  getOverlay() {
    if (this.modo === 'ignea') return this.sal ? `${this.sal.nome} · ${this.ligada ? SIEL.fmt(this.iign, 1) + ' A' : 'desligada'}` : 'Escolha um sal fundido';
    if (this.modo === 'aquosa') return this.eletrolito ? `${this.eletrolito.nome} · ${this.eletrolito.cat} + ${this.eletrolito.an}` : 'Escolha um eletrólito';
    return this.metal ? `${this.metal.nome} · ${SIEL.fmt(this._faraday().m, 4)} g` : 'Escolha um metal';
  }
};
// ══════════════════════════════════════════════════════════════════
// MECH — FACHADA que une as duas mecânicas deste simulador.
// D.MECH_B (no arquivo de dados) lista os ids de modo atendidos pela
// segunda mecânica; todos os demais vão para a primeira. O App
// conversa apenas com esta classe, exatamente como num simulador de
// mecânica única — cada mecânica interna permanece intocada.
// ══════════════════════════════════════════════════════════════════
SIEL.Mech = class Mech {
  constructor(D) {
    this.D = D;
    this.a = new SIEL.MechA(D);
    this.b = new SIEL.MechB(D);
    this._bSet = new Set(D.MECH_B || []);
    this.cur = this.a;
  }
  set app(v) {
    this._app = v;
    this.a.app = v;
    this.b.app = v;
  }
  get app() {
    return this._app;
  }
  build(app) {
    if (typeof this.a.build === 'function') this.a.build(app);
    if (typeof this.b.build === 'function') this.b.build(app);
  }
  setMode(id) {
    this.cur = this._bSet.has(id) ? this.b : this.a;
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