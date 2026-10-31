/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/mecanica.js
   ───────────────────────────────────────────────────────────────
   A classe Mech: os modos, os parâmetros, a química e o que vai para o canvas. É o coração do simulador.

   Extraído de scriptbioquimica.js na refatoração para a estrutura de
   pastas do SIMA. A divisão é literal: o escopo continua global e
   as tags <script> continuam compartilhando-o, então nenhuma
   referência mudou de nome. O que mudou é onde cada coisa mora.

   Ordem de carga (definida em index.html): a11y → core → data →
   ui → simulation → init. Quebrar essa ordem quebra o simulador.
═══════════════════════════════════════════════════════════════ */

'use strict';

class Mech {
  constructor(D) {
    this.D = D;
    this.modo = 'biomoleculas';
    this.t = 0;

    // modo 1 — biomoléculas
    this.bio = D.BIOMOLECULAS[0];
    // modo 2 — ligação peptídica
    this.aa1 = D.AMINOACIDOS[0];
    this.aa2 = D.AMINOACIDOS[1];
    // modo 3 — atividade enzimática
    this.enz = D.ENZIMAS[0];
    this.ph = 7;
    this.temp = 37;
    this.desnaturada = false;
  }

  build() {
    fillOptGrid('bio-grid', this.D.BIOMOLECULAS.map(b => ({
      value: b.id, nome: b.nome, dot: b.dot, extra: b.elementos,
      aria: `${b.nome}, monômero ${b.monomero}, unido por ${b.ligacao}`,
    })), this.bio.id);

    const itensAA = this.D.AMINOACIDOS.map(a => ({
      value: a.id, nome: a.nome, dot: a.dot, extra: `pI ${fmt(a.pI, 2)}`,
      aria: `${a.nome}, sigla ${a.sigla}, grupo R ${a.r}, ponto isoelétrico ${fmt(a.pI, 2)}`,
    }));
    fillOptGrid('aa1-grid', itensAA, this.aa1.id);
    fillOptGrid('aa2-grid', itensAA, this.aa2.id);

    fillOptGrid('enz-grid', this.D.ENZIMAS.map(e => ({
      value: e.id, nome: e.nome, dot: e.dot, extra: `pH ${fmt(e.phOtimo, 1)}`,
      aria: `${e.nome}, atua no ${e.local}, pH ótimo ${fmt(e.phOtimo, 1)}, substrato ${e.substrato}`,
    })), this.enz.id);
  }

  setMode(id) {
    this.modo = id; this.t = 0;
    if (id === 'enzimas') this.desnaturada = this.temp > this.enz.tDesnatura;
  }

  setParam(k, v) {
    switch (k) {
      case 'bio': {
        this.bio = this.D.BIOMOLECULAS.find(b => b.id === v) || this.bio;
        return { say: `${this.bio.nome}: monômero ${this.bio.monomero}, unido por ${this.bio.ligacao}. Função: ${this.bio.funcao}.` };
      }
      case 'aa1': {
        this.aa1 = this.D.AMINOACIDOS.find(a => a.id === v) || this.aa1;
        return { say: `Primeiro aminoácido: ${this.aa1.nome}, ponto isoelétrico ${fmt(this.aa1.pI, 2)}. Dipeptídeo: ${this._nomeDipeptideo()}.` };
      }
      case 'aa2': {
        this.aa2 = this.D.AMINOACIDOS.find(a => a.id === v) || this.aa2;
        return { say: `Segundo aminoácido: ${this.aa2.nome}, ponto isoelétrico ${fmt(this.aa2.pI, 2)}. Dipeptídeo: ${this._nomeDipeptideo()}.` };
      }
      case 'enzima': {
        this.enz = this.D.ENZIMAS.find(e => e.id === v) || this.enz;
        this.desnaturada = this.temp > this.enz.tDesnatura;
        return { say: `${this.enz.nome}, do ${this.enz.local}: pH ótimo ${fmt(this.enz.phOtimo, 1)}, substrato ${this.enz.substrato}.` };
      }
      case 'enzph': {
        this.ph = clamp(v, 0, 14);
        return { say: `pH ${fmt(this.ph, 1)}: atividade de ${fmt(this._atividade() * 100, 0)} por cento.` };
      }
      case 'enzt': {
        this.temp = clamp(v, 0, 90);
        if (this.temp > this.enz.tDesnatura && !this.desnaturada) {
          this.desnaturada = true;
          return { warn: `Acima de ${this.enz.tDesnatura} graus a enzima desnatura: a perda de atividade é irreversível. Use "Repor enzima" para começar de novo.` };
        }
        return { say: `Temperatura ${fmt(this.temp, 0)} graus: atividade de ${fmt(this._atividade() * 100, 0)} por cento.` };
      }
    }
    return {};
  }

  action(name) {
    if (name === 'bio-next') {
      const L = this.D.BIOMOLECULAS;
      this.bio = L[(L.indexOf(this.bio) + 1) % L.length];
      this._marcarOpt('bio-grid', this.bio.id);
      playTone(700, .07, .05);
      announce(`${this.bio.nome}: unidos por ${this.bio.ligacao}. Exemplo: ${this.bio.exemplo}.`);
    }
    if (name === 'pep-inverter') {
      const a = this.aa1; this.aa1 = this.aa2; this.aa2 = a;
      this._marcarOpt('aa1-grid', this.aa1.id);
      this._marcarOpt('aa2-grid', this.aa2.id);
      playTone(660, .07, .05);
      announce(`Ordem invertida. Agora o dipeptídeo é ${this._nomeDipeptideo()} — trocar a ordem gera um peptídeo diferente.`);
    }
    if (name === 'enz-status') {
      playTone(640, .08, .05);
      const at = this._atividade();
      announce(`${this.enz.nome} em pH ${fmt(this.ph, 1)} e ${fmt(this.temp, 0)} graus: atividade de ${fmt(at * 100, 0)} por cento.${this.desnaturada ? ' A enzima está desnaturada.' : ''}`);
    }
    if (name === 'enz-reset') {
      this.desnaturada = false;
      this.ph = this.enz.phOtimo; this.temp = this.enz.tOtima;
      if (this.app) { this.app.syncSlider('enz-ph', this.ph); this.app.syncSlider('enz-t', this.temp); }
      playTone(560, .07, .05);
      announce(`Enzima reposta nas condições ótimas: pH ${fmt(this.ph, 1)} e ${fmt(this.temp, 0)} graus.`);
    }
  }

  _marcarOpt(gridId, value) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll('.opt-btn').forEach(b => {
      const on = b.dataset.value === String(value);
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
  }

  /* ══════════ modelos ══════════ */

  /** Nome do dipeptídeo: o resíduo que doa a carbonila vira "-il". */
  _nomeDipeptideo() {
    const raiz = this.aa1.nome.toLowerCase()
      .replace('ácido aspártico', 'aspartil')
      .replace('ácido glutâmico', 'glutamil')
      .replace(/ina$/, 'il');
    return `${raiz}-${this.aa2.nome.toLowerCase()}`;
  }

  /** Atividade relativa (0 a 1): sino no pH × sino na temperatura,
   *  com queda extra e irreversível após desnaturar. */
  _fatorPh() {
    const d = this.ph - this.enz.phOtimo;
    return Math.exp(-(d * d) / (2 * 1.2 * 1.2));
  }
  _fatorT() {
    if (this.desnaturada) return 0.02;
    const d = this.temp - this.enz.tOtima;
    let f = Math.exp(-(d * d) / (2 * 9 * 9));
    if (this.temp > this.enz.tDesnatura) f *= Math.exp(-(this.temp - this.enz.tDesnatura) / 3);
    return f;
  }
  _atividade() { return clamp(this._fatorPh() * this._fatorT(), 0, 1); }

  update(dt) { this.t += dt; }

  draw(ctx, W, H) {
    // a pílula do modo ativo (no topo, ao centro) cobria o título de cada cena: a cena começa abaixo dela
    const topo = 40;
    ctx.save(); ctx.translate(0, topo); H -= topo;
    if (this.modo === 'biomoleculas') this._drawBio(ctx, W, H);
    else if (this.modo === 'peptidica') this._drawPeptidica(ctx, W, H);
    else this._drawEnzima(ctx, W, H);
    ctx.restore();
  }

  /* ══════════ MODO 1 — biomoléculas ══════════ */
  _drawBio(ctx, W, H) {
    const b = this.bio;
    kLabel(ctx, b.nome, W / 2, 40, { size: 16, bold: true, align: 'center', color: kTinta(b.dot) });
    kLabel(ctx, `elementos: ${b.elementos}`, W / 2, 60, { size: 11, align: 'center' });

    /* CENA BAIXA E LARGA (celular deitado): empilhados, a cadeia, a ligação e as três linhas de baixo não
       cabiam na altura e se sobrepunham. Aqui a cadeia fica à esquerda e o texto à direita, lado a lado. */
    const lado = H < 260 && W >= 600, xC = lado ? W * .29 : W / 2;   // < 260: a ligação encostava na linha do polímero
    // três monômeros se ligando em cadeia, com a água que sai
    const cy = lado ? (64 + H) / 2 + 4 : H / 2 - 6;
    const r = Math.min(30, W * .05);
    const passo = lado ? Math.min(W * .14, 120) : Math.min(W * .24, 150);
    const x0 = xC - passo;
    for (let i = 0; i < 3; i++) {
      const x = x0 + passo * i;
      ctx.save();
      ctx.fillStyle = b.dot; ctx.globalAlpha = .85;
      ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      kLabel(ctx, 'monômero', x, cy + 4, { size: 9, bold: true, align: 'center', baseline: 'middle', color: getContrastColor(b.dot.startsWith('#') ? b.dot : '#38bdf8') });
      if (i < 2) {
        const xm = x + passo / 2;
        kBond(ctx, x + r, cy, x + passo - r, cy, 1, { color: cssVar('--accent-main', '#facc15'), width: 3 });
        kChip(ctx, 'H₂O', xm, cy - r - 22, { size: 10, fg: cssVar('--accent-alt', '#38bdf8') });
        kArrow(ctx, xm, cy - r - 12, xm, cy - r - 4, { color: cssVar('--accent-alt', '#38bdf8'), head: 5, width: 1.2 });
      }
    }
    if (lado) {   // o bloco de texto à direita, centrado na altura da cadeia e no espaço que sobra depois do último monômero
      const xT = (xC + passo + r + 16 + W) / 2;
      kLabel(ctx, b.ligacao, xT, cy - 30, { size: 13, bold: true, align: 'center', color: cssVar('--accent-main', '#facc15') });
      kLabel(ctx, `polímero: ${b.polimero}`, xT, cy - 8, { size: 11, align: 'center', uma: true });
      kLabel(ctx, `função: ${b.funcao}`, xT, cy + 12, { size: 11, align: 'center', uma: true, color: cssVar('--text-secondary', '#7a9ab8') });
      kChip(ctx, b.exemplo, xT, cy + 38, { size: 11, fg: kTinta(b.dot), border: b.dot });
      return;
    }
    kLabel(ctx, b.ligacao, W / 2, cy + r + 26,
      { size: 13, bold: true, align: 'center', color: cssVar('--accent-main', '#facc15') });
    // duas linhas empilhadas: numa tela estreita, cada uma encolhe (e no limite se comprime) sem quebrar sobre a outra
    kLabel(ctx, `polímero: ${b.polimero}`, W / 2, H - 62, { size: 11, align: 'center', uma: true });
    kLabel(ctx, `função: ${b.funcao}`, W / 2, H - 42, { size: 11, align: 'center', uma: true, color: cssVar('--text-secondary', '#7a9ab8') });
    kChip(ctx, b.exemplo, W / 2, H - 18, { size: 11, fg: kTinta(b.dot), border: b.dot });
  }

  /* ══════════ MODO 2 — ligação peptídica ══════════ */
  _drawPeptidica(ctx, W, H) {
    kLabel(ctx, 'Ligação peptídica (amida)', W / 2, 34,
      { size: 15, bold: true, align: 'center', color: cssVar('--text-primary', '#ddeaf8') });

    /* CENA BAIXA (celular deitado): na conta proporcional, o "+" entre os aminoácidos encostava no "− H₂O"
       do produto, e o nome dos aminoácidos subia até o título. Os dois blocos ganham posições fixas. */
    const baixa = H < 265;
    const cy = baixa ? 88 : H * .40;
    const desenhaAA = (aa, cx, destaqueCarboxila, destaqueAmino) => {
      const dx = Math.min(44, W * .06);
      const nos = [
        { x: cx - dx * 1.6, y: cy, el: 'H₂N', cor: destaqueAmino ? cssVar('--accent-main', '#facc15') : cssVar('--accent-ok', '#4ade80') },
        { x: cx, y: cy, el: 'CH', cor: cssVar('--scene-b', '#94a3b8') },
        { x: cx + dx * 1.6, y: cy, el: 'COOH', cor: destaqueCarboxila ? cssVar('--accent-main', '#facc15') : cssVar('--accent-warn', '#f87171') },
      ];
      kBond(ctx, nos[0].x, nos[0].y, nos[1].x, nos[1].y, 1, { color: cssVar('--scene-a', '#facc15'), width: 2.2 });
      kBond(ctx, nos[1].x, nos[1].y, nos[2].x, nos[2].y, 1, { color: cssVar('--scene-a', '#facc15'), width: 2.2 });
      kBond(ctx, nos[1].x, nos[1].y, nos[1].x, nos[1].y + 34, 1, { color: cssVar('--scene-a', '#facc15'), width: 2.2 });
      nos.forEach(n => kAtom(ctx, n.x, n.y, 12 + n.el.length * 2.2, n.el, { color: n.cor, size: 9 }));
      kChip(ctx, `R = ${aa.r}`, nos[1].x, nos[1].y + 48, { size: 9, fg: kTinta(aa.dot), border: kTinta(aa.dot) });
      kLabel(ctx, `${aa.nome} (${aa.sigla})`, cx, cy - 34, { size: 11, bold: true, align: 'center', color: kTinta(aa.dot) });
      kLabel(ctx, `pI = ${fmt(aa.pI, 2)}`, cx, cy - 18, { size: 10, mono: true, align: 'center', color: cssVar('--accent-amber', '#fbbf24') });
    };

    desenhaAA(this.aa1, W * .26, true, false);
    desenhaAA(this.aa2, W * .74, false, true);

    kLabel(ctx, '+', W / 2, cy + 4, { size: 20, bold: true, align: 'center', baseline: 'middle', color: cssVar('--text-muted', '#3d566e') });

    // produto
    const yProd = baixa ? cy + 66 : H - 96;
    kArrow(ctx, W / 2 - 30, yProd - (baixa ? 30 : 26), W / 2 + 30, yProd - (baixa ? 30 : 26),
      { color: cssVar('--accent-main', '#facc15'), width: 2, head: 9 });
    kChip(ctx, '− H₂O', W / 2, yProd - (baixa ? 46 : 44), { size: 10, fg: cssVar('--accent-alt', '#38bdf8') });
    kLabel(ctx, `${this.aa1.sigla}–${this.aa2.sigla}: ${this._nomeDipeptideo()}`, W / 2, yProd + (baixa ? 0 : 2),
      { size: 15, bold: true, align: 'center', color: cssVar('--accent-main', '#facc15') });
    kLabel(ctx, 'H₂N–CHR–CO–NH–CHR′–COOH', W / 2, yProd + (baixa ? 19 : 26),
      { size: 13, mono: true, align: 'center', color: cssVar('--text-primary', '#ddeaf8') });
    kLabel(ctx, 'a carbonila do primeiro se liga ao nitrogênio do segundo — invertendo a ordem, o peptídeo é outro', W / 2, baixa ? Math.max(yProd + 36, H - 10) : H - 16,
      { size: 10, align: 'center', color: cssVar('--text-muted', '#3d566e') });
  }

  /* ══════════ MODO 3 — atividade enzimática ══════════ */
  _drawEnzima(ctx, W, H) {
    const e = this.enz;
    // numa cena baixa (celular deitado) o gráfico encolhe para a barra de temperatura e a legenda dela caberem embaixo
    const x = 62, y = 60, w = W - 96, h = H < 240 ? Math.max(50, H - 146) : Math.max(90, H - 200);

    kLabel(ctx, `${e.nome} — ${e.local}`, W / 2, 32,
      { size: 15, bold: true, align: 'center', color: kTinta(e.dot) });

    const eixos = kAxes(ctx, {
      x, y, w, h, xmin: 0, xmax: 14, ymin: 0, ymax: 105,
      xticks: [0, 2, 4, 6, 8, 10, 12, 14].map(v => ({ v, l: v })),
      yticks: [0, 25, 50, 75, 100].map(v => ({ v, l: v })),
      xlabel: 'pH', ylabel: h < 80 ? 'atividade (%)' : 'atividade relativa (%)',   // num gráfico baixo, o rótulo deitado não caberia no eixo
    });

    // curva de atividade contra pH, na temperatura atual
    const pts = [];
    const fT = this._fatorT();
    for (let p = 0; p <= 14; p += .2) {
      const d = p - e.phOtimo;
      pts.push({ x: p, y: Math.exp(-(d * d) / (2 * 1.2 * 1.2)) * fT * 100 });
    }
    kLine(ctx, pts, eixos.px, eixos.py, { color: e.dot, width: 2.6 });

    // ponto atual
    const at = this._atividade() * 100;
    ctx.save();
    ctx.fillStyle = cssVar('--accent-amber', '#fbbf24');
    ctx.beginPath(); ctx.arc(eixos.px(this.ph), eixos.py(at), 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    kChip(ctx, `${fmt(at, 0)} %`, eixos.px(this.ph), eixos.py(at) - 20,
      { size: 11, bold: true, fg: cssVar('--accent-amber', '#fbbf24') });

    // barra de temperatura
    const bw = Math.min(W * .7, 420), bx = W / 2 - bw / 2, by = y + h + 44, bh = 16;
    ctx.save();
    ctx.fillStyle = cssVar('--bg-panel2', '#101c2b');
    kRound(ctx, bx, by, bw, bh, 8); ctx.fill();
    const fracT = clamp(this.temp / 90, 0, 1);
    ctx.fillStyle = kMix('#38bdf8', '#f87171', fracT);
    kRound(ctx, bx, by, bw * fracT, bh, 8); ctx.fill();
    ctx.strokeStyle = cssVar('--border', '#1c2e44'); ctx.lineWidth = 1;
    kRound(ctx, bx, by, bw, bh, 8); ctx.stroke();
    // marca da temperatura de desnaturação
    const xd = bx + (e.tDesnatura / 90) * bw;
    ctx.strokeStyle = cssVar('--accent-warn', '#f87171'); ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xd, by - 5); ctx.lineTo(xd, by + bh + 5); ctx.stroke();
    ctx.restore();
    kLabel(ctx, `temperatura: ${fmt(this.temp, 0)} °C (ótima ${e.tOtima} °C · desnatura acima de ${e.tDesnatura} °C)`,
      W / 2, by + bh + 20, { size: 11, align: 'center', color: cssVar('--text-secondary', '#7a9ab8') });

    if (this.desnaturada) {
      kChip(ctx, 'ENZIMA DESNATURADA — perda irreversível', W / 2, by - 26,
        { size: 11, bold: true, fg: cssVar('--accent-warn', '#f87171'), border: cssVar('--accent-warn', '#f87171') });
    }
  }

  /* ══════════ resultados ══════════ */
  getResults() {
    if (this.modo === 'biomoleculas') {
      const b = this.bio;
      return [
        { l: 'Classe', v: b.nome },
        { l: 'Monômero', v: b.monomero },
        { l: 'Polímero', v: b.polimero },
        { l: 'Ligação', v: b.ligacao, cls: 'val-ok' },
        { l: 'Elementos', v: b.elementos },
        { l: 'Fórmula típica', v: b.formulaGeral },
        { l: 'Função', v: b.funcao },
        { l: 'Exemplo', v: b.exemplo },
      ];
    }
    if (this.modo === 'peptidica') {
      return [
        { l: 'Aminoácido 1', v: `${this.aa1.nome} (${this.aa1.sigla})` },
        { l: 'pI do primeiro', v: fmt(this.aa1.pI, 2) },
        { l: 'Grupo R do primeiro', v: this.aa1.r },
        { l: 'Aminoácido 2', v: `${this.aa2.nome} (${this.aa2.sigla})` },
        { l: 'pI do segundo', v: fmt(this.aa2.pI, 2) },
        { l: 'Grupo R do segundo', v: this.aa2.r },
        { l: 'Dipeptídeo', v: this._nomeDipeptideo(), cls: 'val-ok' },
        { l: 'Subproduto', v: '1 H₂O (condensação)', cls: 'val-alt' },
      ];
    }
    const e = this.enz, at = this._atividade() * 100;
    return [
      { l: 'Enzima', v: e.nome },
      { l: 'Local de ação', v: e.local },
      { l: 'Substrato', v: e.substrato },
      { l: 'pH atual', v: fmt(this.ph, 1) },
      { l: 'pH ótimo', v: fmt(e.phOtimo, 1) },
      { l: 'Temperatura atual', v: `${fmt(this.temp, 0)} °C` },
      { l: 'Atividade relativa', v: `${fmt(at, 0)} %`, cls: at > 60 ? 'val-ok' : at > 20 ? '' : 'val-warn' },
      { l: 'Estado', v: this.desnaturada ? 'desnaturada (irreversível)' : 'ativa', cls: this.desnaturada ? 'val-warn' : 'val-ok' },
    ];
  }

  getOverlay() {
    if (this.modo === 'biomoleculas') return `${this.bio.nome} · ${this.bio.ligacao}`;
    if (this.modo === 'peptidica') return this._nomeDipeptideo();
    return `${this.enz.nome} · ${fmt(this._atividade() * 100, 0)} % de atividade`;
  }
}

// ══════════════════════════════════════════════════════════════════
// APP — casco genérico da família de simuladores.
// Acordeões, Alt+1–N, Enter/Espaço no canvas, gaveta mobile,
// resultados ao vivo. A mecânica específica vive na classe Mech.
// ══════════════════════════════════════════════════════════════════
/** Preenche uma .opt-grid com botões a partir de itens dos dados. */
