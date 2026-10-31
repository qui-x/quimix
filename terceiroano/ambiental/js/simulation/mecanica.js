/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/mecanica.js
   ───────────────────────────────────────────────────────────────
   A classe Mech: os modos, os parâmetros, a química e o que vai para o canvas. É o coração do simulador.

   Extraído de scriptambiental.js na refatoração para a estrutura de
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
    this.modo = 'estufa';
    this.t = 0;

    // modo 1 — efeito estufa
    this.gas = D.GASES_ESTUFA[0];
    this.raios = [];
    // modo 2 — chuva ácida
    this.emissao = 0;          // índice relativo 0 a 100
    this.gotas = [];
    // modo 3 — camada de ozônio
    this.cfc = 0;              // índice relativo 0 a 100
    this.uv = [];
  }

  build() {
    fillOptGrid('gee-grid', this.D.GASES_ESTUFA.map(g => ({
      value: g.id, nome: g.nome, dot: g.dot, extra: `GWP ${fmt(g.gwp, 0)}`,
      aria: `${g.nome}, ${g.formula}, concentração ${g.conc}, potencial de aquecimento global ${fmt(g.gwp, 0)}`,
    })), this.gas.id);
  }

  setMode(id) {
    this.modo = id; this.t = 0;
    this.raios = []; this.gotas = []; this.uv = [];
  }

  setParam(k, v) {
    switch (k) {
      case 'gee': {
        this.gas = this.D.GASES_ESTUFA.find(g => g.id === v) || this.gas;
        return { say: `${this.gas.nome}: concentração ${this.gas.conc}, GWP-100 de ${fmt(this.gas.gwp, 0)}. Principais fontes: ${this.gas.fontes}.` };
      }
      case 'emis': {
        this.emissao = clamp(v, 0, 100);
        const ph = this._ph();
        return { say: `Índice de emissão ${fmt(this.emissao, 0)}. pH da chuva: ${fmt(ph, 2)} — ${this._classePh(ph)}.` };
      }
      case 'cfc': {
        this.cfc = clamp(v, 0, 100);
        const du = this._du();
        return { say: `Índice de CFC ${fmt(this.cfc, 0)}. Coluna de ozônio: ${fmt(du, 0)} Unidades Dobson — ${this._classeDu(du)}.` };
      }
    }
    return {};
  }

  action(name) {
    if (name === 'gee-next') {
      const L = this.D.GASES_ESTUFA;
      this.gas = L[(L.indexOf(this.gas) + 1) % L.length];
      this._marcarOpt('gee-grid', this.gas.id);
      playTone(700, .07, .05);
      announce(`${this.gas.nome}, ${this.gas.formula}. GWP-100 de ${fmt(this.gas.gwp, 0)}. ${this.gas.nota}.`);
    }
    if (name === 'chuva-status') {
      const ph = this._ph();
      playTone(620, .08, .05);
      announce(`pH da chuva: ${fmt(ph, 2)}, ${this._classePh(ph)}. A chuva limpa fica em ${fmt(this.D.CHUVA.phLimpa, 1)} por causa do CO₂ dissolvido.`);
    }
    if (name === 'chuva-reset') {
      this.emissao = 0;
      if (this.app) this.app.syncSlider('chuva-emis', 0);
      playTone(520, .07, .05);
      announce('Emissões zeradas: a chuva volta ao pH natural de 5,6.');
    }
    if (name === 'oz-status') {
      const du = this._du();
      playTone(640, .08, .05);
      announce(`Coluna de ozônio: ${fmt(du, 0)} Unidades Dobson, ${this._classeDu(du)}. Referência: ${this.D.OZONIO.duNormal} DU é típico e abaixo de ${this.D.OZONIO.duBuraco} DU chama-se buraco.`);
    }
    if (name === 'oz-reset') {
      this.cfc = 0;
      if (this.app) this.app.syncSlider('oz-cfc', 0);
      playTone(520, .07, .05);
      announce('Índice de CFC zerado: a camada volta à espessura típica de 300 Unidades Dobson.');
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

  /* ══════════ modelos numéricos (didáticos, documentados) ══════════ */

  /** pH da chuva: acidez do CO₂ somada à de um ácido forte vindo de
   *  SO₂/NOₓ. O índice de emissão vai de 0 a 100 e é convertido numa
   *  concentração de H⁺ de 0 a 1×10⁻⁴ mol/L. */
  _ph() {
    const hCO2 = Math.pow(10, -this.D.CHUVA.phLimpa);
    const hFortes = (this.emissao / 100) * 1e-4;
    return -Math.log10(hCO2 + hFortes);
  }
  _classePh(ph) {
    if (ph >= this.D.CHUVA.phLimpa - .05) return 'chuva limpa';
    if (ph >= this.D.CHUVA.phLimiteAcida) return 'levemente acidificada';
    if (ph >= 4) return 'chuva ácida';
    return 'chuva ácida severa';
  }

  /** Coluna de ozônio em Unidades Dobson: cai linearmente com o índice
   *  de CFC (modelo didático de tendência, não de previsão). */
  _du() { return this.D.OZONIO.duNormal - (this.cfc / 100) * 180; }
  _classeDu(du) {
    if (du >= 280) return 'camada normal';
    if (du >= this.D.OZONIO.duBuraco) return 'camada adelgaçada';
    return 'buraco na camada de ozônio';
  }

  /** Fração de radiação infravermelha retida — cresce com log do GWP,
   *  para os quatro gases caberem na mesma escala visual. */
  _retencao() {
    return clamp(.25 + Math.log10(this.gas.gwp + 1) / Math.log10(11000) * .6, 0, .95);
  }

  update(dt) {
    this.t += dt;
    if (isReduced()) return;

    if (this.modo === 'estufa') {
      if (Math.random() < dt * 6) this.raios.push({ x: Math.random(), y: 0, v: .35 + Math.random() * .3, up: false, presa: false });
      this.raios.forEach(r => {
        r.y += (r.up ? -1 : 1) * r.v * dt;
        if (!r.up && r.y >= 1) { r.up = true; r.y = 1; r.presa = Math.random() < this._retencao(); }
        if (r.up && r.presa && r.y <= .34) { r.up = false; r.y = .34; r.presa = false; }
      });
      this.raios = this.raios.filter(r => r.y > -.05 && r.y < 1.05);
      if (this.raios.length > 90) this.raios.splice(0, this.raios.length - 90);
    }

    if (this.modo === 'chuva') {
      if (Math.random() < dt * 30) this.gotas.push({ x: Math.random(), y: 0, v: .6 + Math.random() * .5 });
      this.gotas.forEach(g => { g.y += g.v * dt; });
      this.gotas = this.gotas.filter(g => g.y < 1);
      if (this.gotas.length > 160) this.gotas.splice(0, this.gotas.length - 160);
    }

    if (this.modo === 'ozonio') {
      if (Math.random() < dt * 8) this.uv.push({ x: Math.random(), y: 0, v: .5, passou: Math.random() > (this._du() / this.D.OZONIO.duNormal) * .9 });
      this.uv.forEach(u => { u.y += u.v * dt; });
      this.uv = this.uv.filter(u => u.y < 1 && (u.passou || u.y < .42));
      if (this.uv.length > 80) this.uv.splice(0, this.uv.length - 80);
    }
  }

  /* AS FAIXAS DO MUNDO (o solo, a camada de gases) vão de borda a borda do
     canvas. A cena é desenhada só na área livre de um card flutuante (o shell
     translada o ctx e passa a largura livre); estas faixas são fundo, e não
     podem parar na borda do card. */
  _bx0() { return -((this.app && this.app.areaX) || 0); }
  _bw(W) { return (this.app && this.app.W) || W; }

  draw(ctx, W, H) {
    // a pílula do modo ativo (no topo, ao centro) cobria o título de cada cena: a cena começa abaixo dela
    const topo = 40;
    ctx.save(); ctx.translate(0, topo); H -= topo;
    if (this.modo === 'estufa') this._drawEstufa(ctx, W, H);
    else if (this.modo === 'chuva') this._drawChuva(ctx, W, H);
    else this._drawOzonio(ctx, W, H);
    ctx.restore();
  }

  /* ══════════ MODO 1 — efeito estufa ══════════ */
  _drawEstufa(ctx, W, H) {
    const g = this.gas;
    const solo = H - 74;
    const camadaY = H * .30, esp = 6 + this._retencao() * 26;

    // solo
    ctx.save();
    ctx.fillStyle = cssVar('--accent-main', '#4ade80');
    ctx.globalAlpha = .22;
    ctx.fillRect(this._bx0(), solo, this._bw(W), H - solo);   // o solo vai de borda a borda (também sob um card flutuante)
    ctx.restore();
    kLabel(ctx, 'superfície da Terra', 14, solo + 18, { size: 10, color: cssVar('--text-muted', '#3d566e') });

    // camada de gases de efeito estufa
    ctx.save();
    ctx.fillStyle = g.dot;
    ctx.globalAlpha = .30;
    ctx.fillRect(this._bx0(), camadaY, this._bw(W), esp);     // a camada também
    ctx.restore();
    kLabel(ctx, `camada de ${g.formula}`, W - 14, camadaY - 8,
      { size: 11, align: 'right', color: kTinta(g.dot) });

    // raios: descendo (solar) e subindo (infravermelho)
    this.raios.forEach(r => {
      const x = 20 + r.x * (W - 40);
      const y = 40 + r.y * (solo - 40);
      ctx.save();
      ctx.strokeStyle = r.up ? cssVar('--accent-warn', '#f87171') : cssVar('--accent-amber', '#fbbf24');
      ctx.globalAlpha = .8; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + (r.up ? 10 : -10)); ctx.stroke();
      ctx.restore();
    });

    kLabel(ctx, g.nome + ' — ' + g.formula, W / 2, 30,
      { size: 15, bold: true, align: 'center', color: cssVar('--text-primary', '#ddeaf8') });

    // barra de GWP em escala logarítmica
    const bw = Math.min(W * .55, 340), bx = W / 2 - bw / 2, by = solo + 22;   // a barra e as duas legendas cabem na faixa do solo
    ctx.save();
    ctx.fillStyle = cssVar('--bg-panel2', '#101c2b');
    kRound(ctx, bx, by, bw, 14, 7); ctx.fill();
    ctx.fillStyle = g.dot;
    const frac = Math.log10(g.gwp + 1) / Math.log10(11000);
    kRound(ctx, bx, by, bw * clamp(frac, .02, 1), 14, 7); ctx.fill();
    ctx.restore();
    kLabel(ctx, `GWP-100 = ${fmt(g.gwp, 0)} · concentração ${g.conc}`, W / 2, by + 28,
      { size: 11, align: 'center', color: cssVar('--accent-amber', '#fbbf24') });
    kLabel(ctx, 'escala do GWP é logarítmica (IPCC AR6)', W / 2, by + 43,
      { size: 9, align: 'center', color: cssVar('--text-muted', '#3d566e') });
  }

  /* ══════════ MODO 2 — chuva ácida ══════════ */
  _drawChuva(ctx, W, H) {
    const ph = this._ph();
    const baixa = H < 240;   // cena muito baixa (celular pequeno deitado): a escala desce e só as reações em curso aparecem
    const solo = baixa ? H - 88 : H - 110;

    // gotas de chuva
    this.gotas.forEach(g => {
      const x = 12 + g.x * (W - 24), y = 46 + g.y * (solo - 46);
      ctx.save();
      ctx.strokeStyle = kMix('#38bdf8', '#f87171', clamp((5.6 - ph) / 2, 0, 1));
      ctx.globalAlpha = .75; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 7); ctx.stroke();
      ctx.restore();
    });

    kLabel(ctx, `pH da chuva: ${fmt(ph, 2)}`, W / 2, 32,
      { size: 17, bold: true, align: 'center', color: cssVar('--text-primary', '#ddeaf8') });
    kLabel(ctx, this._classePh(ph), W / 2, 52, { size: 12, align: 'center', color: cssVar('--accent-main', '#4ade80') });

    // escala de pH de 0 a 14
    const bw = Math.min(W * .8, 520), bx = W / 2 - bw / 2, by = solo + 14, bh = 18;
    for (let i = 0; i < bw; i++) {
      const t = i / bw;
      ctx.fillStyle = kMix('#f87171', '#38bdf8', t);
      ctx.fillRect(bx + i, by, 1, bh);
    }
    ctx.save();
    ctx.strokeStyle = cssVar('--border', '#1c2e44'); ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();
    [0, 5, 7, 9, 14].forEach(v => {
      const x = bx + (v / 14) * bw;
      kLabel(ctx, String(v), x, by + bh + 14, { size: 10, mono: true, align: 'center', color: cssVar('--text-muted', '#3d566e') });
    });

    // marcadores: chuva limpa e pH atual
    const marcar = (valor, cor, texto, dy) => {
      const x = bx + (valor / 14) * bw;
      ctx.save();
      ctx.strokeStyle = cor; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, by - 4); ctx.lineTo(x, by + bh + 4); ctx.stroke();
      ctx.restore();
      kChip(ctx, texto, x, by + dy, { size: 10, fg: cor, border: cor });
    };
    marcar(this.D.CHUVA.phLimpa, cssVar('--text-secondary', '#7a9ab8'), 'chuva limpa 5,6', -22);
    marcar(ph, cssVar('--accent-warn', '#f87171'), `atual ${fmt(ph, 2)}`, bh + 34);

    /* reações de formação dos ácidos, entre o título e a escala de pH. Numa cena baixa (celular deitado) a
       coluna de cinco descia sobre a escala e o selo "chuva limpa": o passo encolhe até caber e, se a
       largura deixa, as reações vão em duas colunas */
    const todas = this.D.CHUVA.reacoes.map((r, i) => ({ eq: r.eq, ativo: i === 0 ? this.emissao < 5 : this.emissao >= 5 }));
    const reacoes = baixa ? todas.filter(r => r.ativo) : todas, y0 = baixa ? 72 : 76, teto = by - 36;   // teto: acima do selo "chuva limpa"
    ctx.save(); ctx.font = "12px 'Consolas','Monaco',monospace";
    const largEq = Math.max(...reacoes.map(r => ctx.measureText(r.eq).width));
    ctx.restore();
    const passoEm = c => { const n = Math.ceil(reacoes.length / c); return n <= 1 ? 22 : (teto - y0) / (n - 1); };
    let cols = 1;
    if (passoEm(1) < 22 && W >= 2 * largEq + 40) cols = 2;
    const passo = Math.max(14, Math.min(22, passoEm(cols))), porCol = Math.ceil(reacoes.length / cols);
    reacoes.forEach((r, i) => {
      const c = Math.floor(i / porCol), x = cols === 1 ? W / 2 : W / 2 + (c === 0 ? -1 : 1) * (largEq / 2 + 12);
      kLabel(ctx, r.eq, x, y0 + (i % porCol) * passo,
        { size: 12, mono: true, align: 'center', color: r.ativo ? cssVar('--accent-main', '#4ade80') : cssVar('--text-muted', '#3d566e') });
    });
  }

  /* ══════════ MODO 3 — camada de ozônio ══════════ */
  _drawOzonio(ctx, W, H) {
    const du = this._du();
    const solo = H - 96;
    const camadaY = H * .34;
    const esp = 8 + (du / this.D.OZONIO.duNormal) * 34;

    // solo
    ctx.save();
    ctx.fillStyle = cssVar('--accent-main', '#4ade80');
    ctx.globalAlpha = .2;
    ctx.fillRect(this._bx0(), solo, this._bw(W), H - solo);   // o solo vai de borda a borda (também sob um card flutuante)
    ctx.restore();

    // faixa de ozônio
    ctx.save();
    ctx.fillStyle = cssVar('--accent-alt', '#38bdf8');
    ctx.globalAlpha = .34;
    ctx.fillRect(this._bx0(), camadaY, this._bw(W), esp);     // a camada também
    ctx.restore();
    kLabel(ctx, 'camada de ozônio (estratosfera)', W - 14, Math.max(camadaY - 8, 64),   // numa cena baixa, não sobe até a linha da referência
      { size: 11, align: 'right', color: cssVar('--accent-alt', '#38bdf8') });

    // raios UV
    this.uv.forEach(u => {
      const x = 16 + u.x * (W - 32), y = 40 + u.y * (solo - 40);
      ctx.save();
      ctx.strokeStyle = u.passou ? cssVar('--accent-warn', '#f87171') : cssVar('--accent-amber', '#fbbf24');
      ctx.globalAlpha = .85; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 11); ctx.stroke();
      ctx.restore();
    });

    kLabel(ctx, `${fmt(du, 0)} DU — ${this._classeDu(du)}`, W / 2, 30,
      { size: 16, bold: true, align: 'center', color: du < this.D.OZONIO.duBuraco ? cssVar('--accent-warn', '#f87171') : cssVar('--text-primary', '#ddeaf8') });
    kLabel(ctx, `referência: ${this.D.OZONIO.duNormal} DU típico · abaixo de ${this.D.OZONIO.duBuraco} DU = buraco (NASA)`, W / 2, 50,
      { size: 10, align: 'center', color: cssVar('--text-muted', '#3d566e') });

    // ciclo do cloro (as duas etapas catalíticas)
    const cicl = this.D.OZONIO.reacoes.slice(4);
    cicl.forEach((r, i) => {
      kLabel(ctx, r.eq, W / 2, solo + 30 + i * 20,
        { size: 12, mono: true, align: 'center', color: this.cfc > 2 ? cssVar('--accent-warn', '#f87171') : cssVar('--text-muted', '#3d566e') });
    });
    kLabel(ctx, this.D.OZONIO.nota, W / 2, H - 14,
      { size: 10, align: 'center', color: cssVar('--text-secondary', '#7a9ab8') });
  }

  /* ══════════ resultados ══════════ */
  getResults() {
    if (this.modo === 'estufa') {
      const g = this.gas;
      return [
        { l: 'Gás', v: `${g.nome} (${g.formula})` },
        { l: 'Concentração atual', v: g.conc },
        { l: 'GWP-100', v: fmt(g.gwp, 0), cls: 'val-warn' },
        { l: 'Tempo de vida', v: g.vida },
        { l: 'Fontes principais', v: g.fontes },
        { l: 'Radiação retida (modelo)', v: `${fmt(this._retencao() * 100, 0)} %`, cls: 'val-alt' },
        { l: 'Fonte do GWP', v: 'IPCC AR6' },
        { l: 'Fonte da concentração', v: 'NOAA GML' },
      ];
    }
    if (this.modo === 'chuva') {
      const ph = this._ph();
      return [
        { l: 'Índice de emissão', v: fmt(this.emissao, 0) },
        { l: 'pH da chuva', v: fmt(ph, 2), cls: ph < this.D.CHUVA.phLimiteAcida ? 'val-warn' : 'val-ok' },
        { l: 'Classificação', v: this._classePh(ph) },
        { l: 'pH da chuva limpa', v: fmt(this.D.CHUVA.phLimpa, 1) },
        { l: 'Limite de chuva ácida', v: `pH ${fmt(this.D.CHUVA.phLimiteAcida, 1)}` },
        { l: 'Ácido do SO₂', v: 'H₂SO₄ (forte)' },
        { l: 'Ácido do NO₂', v: 'HNO₃ (forte)' },
        { l: 'Efeito principal', v: this.D.CHUVA.efeitos[0] },
      ];
    }
    const du = this._du();
    return [
      { l: 'Índice de CFC', v: fmt(this.cfc, 0) },
      { l: 'Coluna de ozônio', v: `${fmt(du, 0)} DU`, cls: du < this.D.OZONIO.duBuraco ? 'val-warn' : 'val-ok' },
      { l: 'Classificação', v: this._classeDu(du) },
      { l: 'Coluna típica', v: `${this.D.OZONIO.duNormal} DU` },
      { l: 'Limite de buraco', v: `${this.D.OZONIO.duBuraco} DU` },
      { l: 'Espécie destruidora', v: 'Cl• (cloro atômico)' },
      { l: 'Papel do cloro', v: 'catalisador — é regenerado' },
      { l: 'Tratado', v: this.D.OZONIO.tratado },
    ];
  }

  getOverlay() {
    if (this.modo === 'estufa') return `${this.gas.formula} · GWP ${fmt(this.gas.gwp, 0)}`;
    if (this.modo === 'chuva') return `pH ${fmt(this._ph(), 2)} · ${this._classePh(this._ph())}`;
    return `${fmt(this._du(), 0)} DU · ${this._classeDu(this._du())}`;
  }
}

// ══════════════════════════════════════════════════════════════════
// APP — casco genérico da família de simuladores.
// Acordeões, Alt+1–N, Enter/Espaço no canvas, gaveta mobile,
// resultados ao vivo. A mecânica específica vive na classe Mech.
// ══════════════════════════════════════════════════════════════════
/** Preenche uma .opt-grid com botões a partir de itens dos dados. */
