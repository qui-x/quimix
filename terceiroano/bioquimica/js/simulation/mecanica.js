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

  /* A CENA FICA SÓ COM O DESENHO (regra do projeto). O que ela escrevia — o título, os elementos, o polímero, a
     função e o exemplo; o nome e o pI dos aminoácidos, o nome do dipeptídeo, a fórmula geral e a nota; o nome da
     enzima e a legenda da temperatura — está em Resultados. Ficam os desenhos e os rótulos que fazem parte deles:
     os símbolos (O, P, H₂N, COOH…), as siglas dos resíduos (Gly) e das bases (A, C, G), a H₂O que sai e, no
     gráfico, os eixos e a leitura do ponto.
     O TAMANHO é proporcional à área livre (abaixo da pílula do modo, ui/moldura-cena.js), com piso e teto: antes
     os raios e os passos tinham teto fixo (30 px), e no computador o desenho ficava pequeno no meio da tela. */
  draw(ctx, W, H) {
    const L = Q3.Moldura ? Q3.Moldura.livre(W, H, false) : { x: 16, y: 52, w: W - 32, h: H - 66 };
    if (window.innerWidth > 1100) L.h -= 18;   // no computador, a dica de teclado mora no pé do canvas
    if (this.modo === 'biomoleculas') this._drawBio(ctx, L);
    else if (this.modo === 'peptidica') this._drawPeptidica(ctx, L);
    else this._drawEnzima(ctx, L);
  }

  /* ══════════ MODO 1 — biomoléculas ══════════
     A CONDENSAÇÃO de cada classe, no esquema dos livros, com uma H₂O saindo de cada ligação que se forma:
       carboidratos — três monossacarídeos (anéis de seis, um deles o O do anel) unidos pelo O da ligação
                      glicosídica;
       proteínas    — três aminoácidos (Gly, Ala, Ser) unidos por ligações peptídicas;
       ácidos nucleicos — três nucleotídeos (fosfato P, pentose e base) unidos pela ligação fosfodiéster, da
                      pentose de um ao fosfato do seguinte;
       lipídios     — não é polímero: um glicerol e três ácidos graxos, unidos por três ligações éster (o
                      triglicerídeo). Antes, os lipídios apareciam como uma corrente de três monômeros. */
  _drawBio(ctx, L) {
    const b = this.bio, u = clamp(Math.min(L.w / 10.5, L.h / 5.4), 13, 72), cx = L.x + L.w / 2, cy = L.y + L.h / 2 + u * 0.25;
    const tinta = b.dot, liga = cssVar('--accent-main', '#facc15'), agua = cssVar('--accent-alt', '#38bdf8'), larg = Math.max(2.2, u * 0.09);
    const chip = Math.round(clamp(u * 0.36, 9.5, 14)), letra = Math.round(clamp(u * 0.42, 10, 22));
    const sai = (x, y) => {   // a água que sai da ligação: o chip e a seta para cima
      kArrow(ctx, x, y - u * 0.42, x, y - u * 0.92, { color: agua, head: Math.max(4, u * 0.14), width: Math.max(1.2, u * 0.05) });
      kChip(ctx, 'H₂O', x, y - u * 1.28, { size: chip, fg: agua });
    };
    const atomo = (x, y, r, sim, cor) => { kAtom(ctx, x, y, r, sim, { color: cor, size: letra }); };
    if (b.id === 'lipidio') { this._drawTriglicerideo(ctx, L, u, cx, cy, { tinta, liga, agua, larg, chip, letra, atomo }); return; }
    if (b.id === 'carboidrato') {
      const R = u, D = 3.8 * u, x0 = cx - D;
      for (let i = 0; i < 3; i++) {
        const x = x0 + D * i, v = k => ({ x: x + R * Math.cos(k * Math.PI / 3), y: cy + R * Math.sin(k * Math.PI / 3) });
        ctx.save(); ctx.beginPath(); for (let k = 0; k < 6; k++) { const q = v(k); k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); } ctx.closePath();
        ctx.fillStyle = tinta; ctx.globalAlpha = 0.18; ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = tinta; ctx.lineWidth = larg; ctx.stroke(); ctx.restore();
        const o = v(5); atomo(o.x, o.y, Math.max(8, u * 0.3), 'O', cssVar('--accent-warn', '#f87171'));   // o O do anel
        if (i < 2) {
          const a = v(0), bq = { x: x + D - R, y: cy }, xo = (a.x + bq.x) / 2;
          kBond(ctx, a.x, a.y, xo, cy, 1, { color: liga, width: larg * 1.3 }); kBond(ctx, xo, cy, bq.x, bq.y, 1, { color: liga, width: larg * 1.3 });
          atomo(xo, cy, Math.max(8, u * 0.3), 'O', liga);                                                     // o O da ligação glicosídica
          sai(xo, cy - u * 0.2);
        }
      }
      return;
    }
    if (b.id === 'proteina') {
      const r = 0.9 * u, D = 3.6 * u, x0 = cx - D, res = ['Gly', 'Ala', 'Ser'];
      for (let i = 0; i < 2; i++) kBond(ctx, x0 + D * i + r, cy, x0 + D * (i + 1) - r, cy, 1, { color: liga, width: larg * 1.4 });
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = 0.9; atomo(x0 + D * i, cy, r, res[i], tinta); ctx.restore(); }
      for (let i = 0; i < 2; i++) sai(x0 + D * i + D / 2, cy);
      return;
    }
    // ácidos nucleicos: P — pentose — P — pentose — P — pentose, e as bases penduradas nas pentoses
    const pP = 1.25 * u, pL = 1.6 * u, passo = pP + pL, total = 3 * passo - pL, x0 = cx - total / 2, bases = ['A', 'C', 'G'];
    const rP = Math.max(8, u * 0.4), rS = u * 0.6, amber = cssVar('--accent-amber', '#fbbf24');
    for (let i = 0; i < 3; i++) {
      const xP = x0 + passo * i, xS = xP + pP;
      kBond(ctx, xP + rP, cy, xS - rS, cy, 1, { color: cssVar('--scene-b', '#94a3b8'), width: larg });
      if (i < 2) { kBond(ctx, xS + rS * 0.9, cy, xS + pL - rP, cy, 1, { color: liga, width: larg * 1.4 }); }   // a fosfodiéster
      kBond(ctx, xS, cy + rS * 0.8, xS, cy + u * 1.05, 1, { color: cssVar('--scene-b', '#94a3b8'), width: larg });
      // a pentose: um pentágono com a ponta para cima
      ctx.save(); ctx.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 2 * Math.PI / 5, X = xS + rS * Math.cos(a), Y = cy + rS * Math.sin(a); k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); } ctx.closePath();
      ctx.fillStyle = tinta; ctx.globalAlpha = 0.85; ctx.fill(); ctx.restore();
      atomo(xP, cy, rP, 'P', amber);
      // a base: um retângulo com a letra
      const bw = u * 0.95, bh = u * 0.95, by = cy + u * 1.05;
      ctx.save(); ctx.fillStyle = cssVar('--bg-panel2', '#101c2b'); ctx.strokeStyle = tinta; ctx.lineWidth = larg; kRound(ctx, xS - bw / 2, by, bw, bh, Math.max(3, u * 0.12)); ctx.fill(); ctx.stroke(); ctx.restore();
      kLabel(ctx, bases[i], xS, by + bh / 2 + 0.5, { size: letra, bold: true, align: 'center', baseline: 'middle', color: kTinta(tinta) });
      if (i < 2) sai(xS + rS * 0.9 + (pL - rP - rS * 0.9) / 2, cy);
    }
  }
  /* o triglicerídeo: o glicerol (três carbonos, de cima para baixo) e, em cada um, uma ligação éster (o O, em
     destaque) com um ácido graxo — a carbonila (C=O) e a cadeia em zigue-zague. Uma H₂O sai de cada éster. */
  _drawTriglicerideo(ctx, L, u, cx, cy, o) {
    const dy = 1.55 * u, gx = cx - 3.6 * u, rC = Math.max(7, u * 0.3), cinza = cssVar('--scene-b', '#94a3b8');
    kBond(ctx, gx, cy - dy, gx, cy + dy, 1, { color: o.tinta, width: o.larg * 1.6 });   // o glicerol: C–C–C
    for (let k = -1; k <= 1; k++) {
      const y = cy + k * dy, xO = gx + 1.15 * u, xC = xO + 1.05 * u;
      kBond(ctx, gx + rC, y, xO, y, 1, { color: o.liga, width: o.larg * 1.4 });
      kBond(ctx, xO, y, xC, y, 1, { color: o.liga, width: o.larg * 1.4 });
      kBond(ctx, xC, y, xC + 0.32 * u, y - 0.55 * u, 2, { color: cinza, width: o.larg * 0.8, gap: Math.max(2, u * 0.07) });   // C=O
      o.atomo(xC + 0.42 * u, y - 0.72 * u, Math.max(6, u * 0.22), 'O', cssVar('--accent-warn', '#f87171'));
      // a cadeia do ácido graxo: zigue-zague
      ctx.save(); ctx.strokeStyle = o.tinta; ctx.lineWidth = o.larg; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xC, y);
      for (let j = 1; j <= 8; j++) ctx.lineTo(xC + j * 0.62 * u, y + (j % 2 ? 0.28 : 0) * u);
      ctx.stroke(); ctx.restore();
      o.atomo(gx, y, rC, 'C', o.tinta);
      o.atomo(xO, y, Math.max(7, u * 0.28), 'O', o.liga);                     // o O do éster
      // a água sai à esquerda do glicerol
      kArrow(ctx, gx - rC - 2, y, gx - 0.95 * u, y, { color: o.agua, head: Math.max(4, u * 0.14), width: Math.max(1.2, u * 0.05) });
      kChip(ctx, 'H₂O', gx - 1.55 * u, y, { size: o.chip, fg: o.agua });
    }
  }

  /* ══════════ MODO 2 — ligação peptídica ══════════
     Em cima, os dois aminoácidos (H₂N–CH–COOH, com o grupo R embaixo do CH); a carboxila do primeiro e a amina do
     segundo, com um contorno tracejado, são os grupos que reagem. A seta desce com a H₂O que sai. Embaixo, o dipeptídeo:
     H₂N–CH–CO–NH–CH–COOH, com a ligação peptídica (CO–NH) em destaque. Antes, o produto era só texto. */
  _drawPeptidica(ctx, L) {
    const s = clamp(Math.min(L.w / 6.3, (L.h - 12) / 3.9), 24, 100), destaque = cssVar('--accent-main', '#facc15');
    const verde = cssVar('--accent-ok', '#4ade80'), verm = cssVar('--accent-warn', '#f87171'), cinza = cssVar('--scene-b', '#94a3b8'), traco = cssVar('--scene-a', '#22d3c6');
    const letra = Math.max(9, Math.round(s * 0.2)), chipR = Math.round(clamp(s * 0.17, 9, 13)), larg = Math.max(2, s * 0.045);
    const alto = 3.9 * s, y1 = L.y + Math.max(0, (L.h - 12 - alto) / 2) + 0.45 * s, y2 = y1 + 2.4 * s;
    const raio = el => s * (0.24 + el.length * 0.035);
    const no = (x, y, el, cor) => kAtom(ctx, x, y, raio(el), el, { color: cor, size: letra });
    const grupoR = (x, y, aa) => { kBond(ctx, x, y + raio('CH'), x, y + 0.72 * s, 1, { color: traco, width: larg }); kChip(ctx, 'R = ' + aa.r, x, y + 0.95 * s, { size: chipR, fg: kTinta(aa.dot), border: kTinta(aa.dot) }); };
    // o grupo que reage ganha um contorno tracejado (a cor dele continua a do grupo: verde, a amina; vermelho, a carboxila)
    const reage = (x, el) => { ctx.save(); ctx.strokeStyle = destaque; ctx.lineWidth = Math.max(1.6, s * 0.035); ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(x, y1, raio(el) + s * 0.1, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); };
    const aminoacido = (aa, cx, carboxila, amina) => {
      kBond(ctx, cx - s, y1, cx, y1, 1, { color: traco, width: larg }); kBond(ctx, cx, y1, cx + s, y1, 1, { color: traco, width: larg });
      grupoR(cx, y1, aa);
      no(cx - s, y1, 'H₂N', verde); no(cx, y1, 'CH', cinza); no(cx + s, y1, 'COOH', verm);
      if (amina) reage(cx - s, 'H₂N'); if (carboxila) reage(cx + s, 'COOH');
    };
    aminoacido(this.aa1, L.x + L.w * 0.25, true, false);
    aminoacido(this.aa2, L.x + L.w * 0.75, false, true);
    kLabel(ctx, '+', L.x + L.w / 2, y1 + 1, { size: Math.max(16, Math.round(s * 0.36)), bold: true, align: 'center', baseline: 'middle', color: cssVar('--text-muted', '#3d566e') });
    // a seta e a água que sai
    const xm = L.x + L.w / 2;
    kArrow(ctx, xm, y1 + 0.55 * s, xm, y2 - 0.6 * s, { color: destaque, width: Math.max(2, s * 0.04), head: Math.max(8, s * 0.16) });
    kChip(ctx, '− H₂O', xm + 0.95 * s, (y1 + y2) / 2 + 0.1 * s, { size: chipR, fg: cssVar('--accent-alt', '#38bdf8') });
    // o dipeptídeo
    const x0 = xm - 2.5 * s, el = ['H₂N', 'CH', 'CO', 'NH', 'CH', 'COOH'], cor = [verde, cinza, verm, verde, cinza, verm];
    for (let i = 0; i < 5; i++) kBond(ctx, x0 + s * i, y2, x0 + s * (i + 1), y2, 1, i === 2 ? { color: destaque, width: larg * 2.2 } : { color: traco, width: larg });
    grupoR(x0 + s, y2, this.aa1); grupoR(x0 + 4 * s, y2, this.aa2);
    el.forEach((e, i) => no(x0 + s * i, y2, e, cor[i]));
  }

  /* ══════════ MODO 3 — atividade enzimática ══════════
     O gráfico da atividade contra o pH (na temperatura atual), com a leitura do ponto, e embaixo a escala da
     temperatura: a faixa até o valor atual, a marca da ótima (triângulo) e a da desnaturação (tracejada).
     Desnaturada, a curva fica tracejada e apagada. */
  _drawEnzima(ctx, L) {
    const e = this.enz, at = this._atividade() * 100, baixa = L.h < 300;
    const escH = baixa ? 44 : 58, gx = L.x + 46, gy = L.y + 6, gw = Math.max(80, L.w - 56), gh = Math.max(56, L.h - 6 - 34 - escH);
    const eixos = kAxes(ctx, {
      x: gx, y: gy, w: gw, h: gh, xmin: 0, xmax: 14, ymin: 0, ymax: 105,
      xticks: [0, 2, 4, 6, 8, 10, 12, 14].map(v => ({ v, l: v })),
      yticks: (gh < 90 ? [0, 50, 100] : [0, 25, 50, 75, 100]).map(v => ({ v, l: v })),
      xlabel: 'pH', ylabel: gh < 110 ? 'atividade (%)' : 'atividade relativa (%)',
    });
    // a curva de atividade contra o pH, na temperatura atual
    const pts = [], fT = this._fatorT();
    for (let p = 0; p <= 14; p += .2) { const d = p - e.phOtimo; pts.push({ x: p, y: Math.exp(-(d * d) / (2 * 1.2 * 1.2)) * fT * 100 }); }
    kLine(ctx, pts, eixos.px, eixos.py, this.desnaturada ? { color: cssVar('--text-muted', '#3d566e'), width: 2, dash: [6, 5] } : { color: e.dot, width: 2.6 });
    // o ponto atual e a leitura dele
    ctx.save(); ctx.fillStyle = cssVar('--accent-amber', '#fbbf24'); ctx.beginPath(); ctx.arc(eixos.px(this.ph), eixos.py(at), 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    kChip(ctx, `${fmt(at, 0)} %`, eixos.px(this.ph), eixos.py(at) - 20, { size: 11, bold: true, fg: cssVar('--accent-amber', '#fbbf24') });
    // a escala da temperatura (0 a 90 °C)
    const bw = Math.min(gw, 460), bx = gx + (gw - bw) / 2, by = gy + gh + 34 + (baixa ? 8 : 14), bh = baixa ? 10 : 14, tx = t => bx + (t / 90) * bw;
    ctx.save();
    ctx.fillStyle = cssVar('--bg-panel2', '#101c2b'); kRound(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
    const fracT = clamp(this.temp / 90, 0, 1);
    ctx.fillStyle = kMix('#38bdf8', '#f87171', fracT); kRound(ctx, bx, by, Math.max(bh, bw * fracT), bh, bh / 2); ctx.fill();
    ctx.strokeStyle = cssVar('--border', '#1c2e44'); ctx.lineWidth = 1; kRound(ctx, bx, by, bw, bh, bh / 2); ctx.stroke();
    ctx.strokeStyle = cssVar('--accent-warn', '#f87171'); ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(tx(e.tDesnatura), by - 5); ctx.lineTo(tx(e.tDesnatura), by + bh + 5); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = cssVar('--accent-ok', '#4ade80'); ctx.beginPath(); ctx.moveTo(tx(e.tOtima), by - 2); ctx.lineTo(tx(e.tOtima) - 5, by - 9); ctx.lineTo(tx(e.tOtima) + 5, by - 9); ctx.closePath(); ctx.fill();   // a ótima
    ctx.restore();
    [0, 30, 60, 90].forEach(t => kLabel(ctx, String(t), tx(t), by + bh + 13, { size: 10, align: 'center', mono: true, color: cssVar('--text-muted', '#3d566e') }));
    kLabel(ctx, '°C', bx + bw + 8, by + bh / 2 + 4, { size: 11, color: cssVar('--text-secondary', '#7a9ab8') });
  }

  /* ══════════ resultados ══════════ */
  getResults() {
    if (this.modo === 'biomoleculas') {
      const b = this.bio;
      // o que o esquema da cena mostra, em palavras (a cena não tem legenda)
      const cena = {
        carboidrato: 'três monossacarídeos (os anéis, com o O de cada um) unidos pelo O da ligação glicosídica; cada ligação libera uma H₂O',
        proteina: 'três aminoácidos (Gly, Ala e Ser) unidos por ligações peptídicas; cada ligação libera uma H₂O',
        nucleico: 'três nucleotídeos (fosfato P, pentose e base A, C, G) unidos pela ligação fosfodiéster, da pentose de um ao fosfato do seguinte; cada uma libera uma H₂O',
        lipidio: 'um glicerol (C–C–C) e três ácidos graxos unidos por três ligações éster (o O em destaque), formando um triglicerídeo; cada éster libera uma H₂O',
      }[b.id];
      return [
        { l: 'Classe', v: b.nome },
        { l: 'Monômero', v: b.monomero, cls: 'val-texto' },
        { l: 'Polímero', v: b.polimero, cls: 'val-texto' },
        { l: 'Ligação', v: b.ligacao, cls: 'val-ok' },
        { l: 'Elementos', v: b.elementos },
        { l: 'Fórmula típica', v: b.formulaGeral, cls: 'val-texto' },
        { l: 'Função', v: b.funcao, cls: 'val-texto' },
        { l: 'Exemplo', v: b.exemplo, cls: 'val-texto' },
        { l: 'Na cena', v: cena, cls: 'val-texto' },
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
        { l: 'Dipeptídeo', v: `${this.aa1.sigla}–${this.aa2.sigla}: ${this._nomeDipeptideo()}`, cls: 'val-ok' },
        { l: 'Ligação formada', v: 'peptídica (amida): a carbonila (C=O) do primeiro com o N do segundo', cls: 'val-texto' },
        { l: 'Fórmula geral', v: 'H₂N–CHR–CO–NH–CHR′–COOH' },
        { l: 'Subproduto', v: '1 H₂O (condensação)', cls: 'val-alt' },
        { l: 'A ordem importa', v: `invertendo, o peptídeo é outro: ${this.aa2.sigla}–${this.aa1.sigla}`, cls: 'val-texto' },
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
      { l: 'Temperatura ótima', v: `${e.tOtima} °C (o triângulo na escala)` },
      { l: 'Desnatura acima de', v: `${e.tDesnatura} °C (a marca tracejada)` },
      { l: 'Atividade relativa', v: `${fmt(at, 0)} %`, cls: at > 60 ? 'val-ok' : at > 20 ? '' : 'val-warn' },
      { l: 'Estado', v: this.desnaturada ? 'desnaturada: perda irreversível (use Repor enzima)' : 'ativa', cls: this.desnaturada ? 'val-warn val-texto' : 'val-ok' },
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
