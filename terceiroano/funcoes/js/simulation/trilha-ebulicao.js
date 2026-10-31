/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/trilha-ebulicao.js
   ───────────────────────────────────────────────────────────────
   MÓDULO 3 — PONTO DE EBULIÇÃO (SIFO).

   O aluno ORDENA os compostos de um conjunto por ebulição crescente,
   montando uma TRILHA de posições:
     · toque: toca na peça (seleciona) e na posição (põe; troca com a
       que estava); tocar numa peça da trilha a pega de volta;
     · arrasto com ÍMÃ: soltar perto de uma posição encaixa; longe, volta.
   CONFERIR diz só "existe erro na trilha" — nunca qual posição
   (especificação). Sem pistas, pontuação ou contagem de tentativas.
   Trilha certa: o TERMÔMETRO — cada composto sobe até a temperatura
   real; a ficha do painel Dados ganha a ebulição, a força
   intermolecular e a explicação do conjunto.

   A área central é só da interação: nada de faixa de texto. A ficha
   de dados crus (massa molar, função, O–H/N–H) mora no painel Dados.
═══════════════════════════════════════════════════════════════ */

'use strict';

function ebRgba(hex, a) {
  var h = String(hex).replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
  var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}
var EB_FUNCAO = { hidrocarboneto: 'hidrocarboneto', alcool: 'álcool', eter: 'éter', aldeido: 'aldeído', cetona: 'cetona', acido: 'ácido carboxílico', amina: 'amina' };

class TrilhaEbulicao {
  constructor(D) {
    this.D = D; this.ativo = false; this.t = 0;
    this.reiniciar(true);
    this._ligarPonteiro();
  }

  /* a troca de módulo LIMPA o que sai */
  reiniciar(inicio) {
    this.carregar(Q3.EBULICAO[0].id, !inicio);
  }

  carregar(id, sincronizar) {
    var c = Q3.EBULICAO.filter(function (x) { return x.id === id; })[0] || Q3.EBULICAO[0], self = this;
    this.conj = c;
    this.pecas = c.compostos.map(function (k) {
      var g = Q3.deSmiles(k.smiles), r = Q3.Funcoes.detectar(g);
      var f = r.grupos.filter(function (x) { return x.id !== 'hidrocarboneto'; }).map(function (x) { return x.id; })[0] || 'hidrocarboneto';
      return { nome: k.nome, teb: k.teb, forca: k.forca, fonte: k.fonte, g: g, pos: self._horizontal(Q3.Geometria.layout(g)),
               formula: g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); }),
               massa: Q3.massaMolar(g), funcao: EB_FUNCAO[f] || f, ohnh: Q3.temOHouNH(g) };
    });
    // as peças começam embaralhadas (Fisher–Yates), fora da trilha
    this.ordemPool = this.pecas.map(function (_, i) { return i; });
    for (var k = this.ordemPool.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)), t = this.ordemPool[k]; this.ordemPool[k] = this.ordemPool[j]; this.ordemPool[j] = t; }
    this.trilha = this.pecas.map(function () { return null; });
    this.sel = null; this.estado = 'aberto'; this.anim = 0; this.arrasto = null; this.cursor = 0;
    if (sincronizar !== false) this._sincronizarPainel();
  }

  ativar() { this.ativo = true; var cv = document.getElementById('sim-canvas'); if (cv) cv.style.touchAction = 'none'; this._sincronizarPainel(); }
  desativar() { this.ativo = false; this.arrasto = null; }
  atualizar(dt) { this.t += dt; if (this.estado === 'certo' && this.anim < 1) this.anim = Math.min(1, this.anim + dt / 1.6); }

  _horizontal(pos) {
    var ids = Object.keys(pos), n = ids.length || 1, mx = 0, my = 0;
    ids.forEach(function (id) { mx += pos[id].x / n; my += pos[id].y / n; });
    var sxx = 0, syy = 0, sxy = 0;
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), s = Math.sin(-th), out = {};
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; out[id] = { x: dx * c - dy * s, y: dx * s + dy * c }; });
    return out;
  }

  /* ══ A TRILHA ══════════════════════════════════════════════════ */

  _naTrilha(i) { return this.trilha.indexOf(i); }
  livres() { var self = this; return this.ordemPool.filter(function (i) { return self._naTrilha(i) < 0; }); }

  /* põe a peça i na posição p (troca com a que estava lá; se i vinha de outra posição, a troca é entre as duas) */
  por(i, p) {
    if (this.estado === 'certo' || i === null || p < 0 || p >= this.trilha.length) return false;
    var de = this._naTrilha(i), ocupante = this.trilha[p];
    if (de >= 0) this.trilha[de] = ocupante === i ? i : ocupante;           // arrasto entre posições: troca
    else if (ocupante !== null && ocupante !== i && this.origem != null && this.trilha[this.origem] === null)
      this.trilha[this.origem] = ocupante;                                   // pega na trilha e põe noutra: o ocupante vai para o lugar vago (troca)
    this.trilha[p] = i;
    this.sel = null; this.origem = null;
    if (this.estado === 'erro' || this.estado === 'incompleta') this.estado = 'aberto';
    playTone(560 + p * 40, .04, .03);
    announce(this.pecas[i].nome + ' na posição ' + (p + 1) + '.');
    this._sincronizarPainel();
    return true;
  }
  tirar(p) {
    if (this.estado === 'certo' || this.trilha[p] === null) return false;
    var i = this.trilha[p]; this.trilha[p] = null; this.sel = i; this.origem = p;   // de onde saiu: permite a troca
    if (this.estado === 'erro' || this.estado === 'incompleta') this.estado = 'aberto';
    this._sincronizarPainel();
    return true;
  }

  conferir() {
    if (this.estado === 'certo') return false;
    if (this.trilha.some(function (x) { return x === null; })) { this.estado = 'incompleta'; announce('Complete a trilha antes de conferir.'); this._sincronizarPainel(); return true; }
    var self = this, certa = true;
    for (var p = 1; p < this.trilha.length; p++) if (this.pecas[this.trilha[p]].teb < this.pecas[this.trilha[p - 1]].teb) certa = false;
    this.estado = certa ? 'certo' : 'erro';
    this.anim = 0;
    playTone(660, .08, .04);
    announce(certa ? 'Trilha certa. ' + this.trilha.map(function (i) { return self.pecas[i].nome + ', ' + self._fmt(self.pecas[i].teb); }).join('; ') + '.' : 'Existe erro na trilha.');
    this._sincronizarPainel();
    return true;
  }
  _fmt(v) { return (Math.round(v * 10) / 10).toString().replace('.', ',') + ' °C'; }

  /* ══ ENTRADA: toque e arrasto com ímã ══════════════════════════ */

  _ligarPonteiro() {
    var cv = document.getElementById('sim-canvas'), self = this;
    if (!cv) return;
    var ponto = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left - (cv.cenaX || 0), y: e.clientY - r.top }; }   // na cena (a área livre do card flutuante);
    cv.addEventListener('pointerdown', function (e) {
      if (!self.ativo || self.estado === 'certo') return;
      var p = ponto(e), alvo = self._peca(p.x, p.y);
      if (alvo === null) return;
      self.arrasto = { i: alvo, x0: p.x, y0: p.y, x: p.x, y: p.y, moveu: false };
    });
    cv.addEventListener('pointermove', function (e) {
      if (!self.ativo || !self.arrasto) return;
      var p = ponto(e), a = self.arrasto; a.x = p.x; a.y = p.y;
      if (Math.hypot(p.x - a.x0, p.y - a.y0) > 6) a.moveu = true;
    });
    window.addEventListener('pointerup', function () {
      if (!self.ativo || !self.arrasto) return;
      var a = self.arrasto; self.arrasto = null;
      if (!a.moveu) return;           // foi um toque: o app entrega em tocar()
      self._arrastoConsumido = true;  // o toque que vem junto com o fim do arrasto é ignorado
      var p = self._posicaoPerto(a.x, a.y, 80);
      if (p >= 0) self.por(a.i, p);
      else { var de = self._naTrilha(a.i); if (de >= 0 && a.y > self._geo.poolY - 20) { self.trilha[de] = null; self._sincronizarPainel(); } }
    });
  }

  tocar(x, y) {
    if (this._arrastoConsumido) { this._arrastoConsumido = false; return true; }
    if (this.estado === 'certo') return false;
    var p = this._posicaoEm(x, y), i = this._peca(x, y);
    if (p >= 0 && this.sel !== null) return this.por(this.sel, p);
    if (p >= 0 && this.trilha[p] !== null) return this.tirar(p);
    if (i !== null) { this.sel = this.sel === i ? null : i; this.origem = null; if (this.sel !== null) announce(this.pecas[i].nome + ' selecionado: toque numa posição da trilha.'); this._sincronizarPainel(); return true; }
    return false;
  }

  navegar(dx) {
    var n = this.trilha.length; if (!dx) return false;
    this.cursor = (this.cursor + (dx > 0 ? 1 : n - 1)) % n;
    announce('Posição ' + (this.cursor + 1) + (this.trilha[this.cursor] !== null ? ': ' + this.pecas[this.trilha[this.cursor]].nome : ': vazia') + '.');
    return true;
  }
  /* Enter: com uma peça selecionada, põe na posição do cursor; senão, seleciona a próxima peça livre */
  acaoTeclado() {
    if (this.sel !== null) return this.por(this.sel, this.cursor);
    var l = this.livres(); if (!l.length) return this.conferir();
    this.sel = l[0]; announce(this.pecas[this.sel].nome + ' selecionado.'); this._sincronizarPainel(); return true;
  }

  acao(nome) {
    if (nome === 'eb-conferir') return this.conferir();
    if (nome === 'eb-recomecar') { this.carregar(this.conj.id); announce('Trilha recomeçada.'); return true; }
    if (nome === 'eb-acao') return this.acaoTeclado();
    return false;
  }
  param(k, v) { if (k === 'eb-conjunto') { this.carregar(v); announce(this.conj.nome + '.'); } return {}; }

  /* ══ GEOMETRIA ════════════════════════════════════════════════ */

  _layout(W, H) {
    var n = this.trilha.length, gap = 10, larg = Math.min(150, (W - 56 - gap * (n - 1)) / n), alto = 118;
    var trilhaY = 104, meio = 70;
    /* CENA BAIXA (celular deitado): a trilha e as peças dividem a altura que há — com as medidas
       de sempre, a fileira das peças ficava abaixo da borda da tela e não havia o que arrastar */
    if (H < 430) {
      var mtBaixa = H < 300;   // muito baixa (celular pequeno deitado): o vão entre as fileiras e a margem de baixo encolhem
      trilhaY = 70; meio = mtBaixa ? 12 : 26;
      alto = Math.max(64, Math.min(118, Math.floor((H - trilhaY - meio - (mtBaixa ? 6 : 10)) / 2)));
    }
    var x0 = (W - (n * larg + (n - 1) * gap)) / 2, poolY = trilhaY + alto + meio;
    this._geo = { n: n, larg: larg, alto: alto, gap: gap, x0: x0, trilhaY: trilhaY, poolY: poolY, W: W, H: H };
    return this._geo;
  }
  _slotRect(p) { var G = this._geo; return { x: G.x0 + p * (G.larg + G.gap), y: G.trilhaY, w: G.larg, h: G.alto }; }
  _poolRect(k, total) { var G = this._geo, x0 = (G.W - (total * G.larg + (total - 1) * G.gap)) / 2; return { x: x0 + k * (G.larg + G.gap), y: G.poolY, w: G.larg, h: G.alto }; }
  _posicaoEm(x, y) { if (!this._geo) return -1; for (var p = 0; p < this.trilha.length; p++) { var r = this._slotRect(p); if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return p; } return -1; }
  _posicaoPerto(x, y, raio) {
    var melhor = -1, dmin = raio;
    for (var p = 0; p < this.trilha.length; p++) { var r = this._slotRect(p), d = Math.hypot(x - (r.x + r.w / 2), y - (r.y + r.h / 2)); if (d < dmin) { dmin = d; melhor = p; } }
    return melhor;
  }
  _peca(x, y) {
    if (!this._geo) return null;
    var p = this._posicaoEm(x, y); if (p >= 0 && this.trilha[p] !== null) return this.trilha[p];
    var l = this.livres();
    for (var k = 0; k < l.length; k++) { var r = this._poolRect(k, l.length); if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return l[k]; }
    return null;
  }

  /* ══ DESENHO ══════════════════════════════════════════════════ */

  desenhar(ctx, W, H) {
    var P = Q3.Desenho.paleta(), G = this._layout(W, H), self = this;
    if (this.estado === 'certo') { this._termometro(ctx, W, H, P); return; }
    // a seta da trilha (discreta)
    ctx.save(); ctx.fillStyle = P.suave; ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('ebulição crescente  →', W / 2, G.trilhaY - 12); ctx.restore();
    for (var p = 0; p < G.n; p++) {
      var r = this._slotRect(p), i = this.trilha[p];
      ctx.save();
      ctx.strokeStyle = this.estado === 'erro' ? (P.claro ? '#8a4b00' : '#ffb454') : ebRgba(P.suave, 0.55); ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x, r.y, r.w, r.h, 10); else ctx.rect(r.x, r.y, r.w, r.h); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = P.suave; ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(String(p + 1), r.x + 7, r.y + 15);
      if (p === this.cursor) { ctx.strokeStyle = P.acento; ctx.lineWidth = 2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12); else ctx.rect(r.x - 3, r.y - 3, r.w + 6, r.h + 6); ctx.stroke(); }
      ctx.restore();
      if (i !== null && !(this.arrasto && this.arrasto.moveu && this.arrasto.i === i)) this._cartao(ctx, i, r, P);
    }
    var l = this.livres();
    l.forEach(function (i, k) { if (self.arrasto && self.arrasto.moveu && self.arrasto.i === i) return; self._cartao(ctx, i, self._poolRect(k, l.length), P); });
    if (this.arrasto && this.arrasto.moveu) {
      var a = this.arrasto, alvo = this._posicaoPerto(a.x, a.y, 80);
      if (alvo >= 0) { var ra = this._slotRect(alvo); ctx.save(); ctx.strokeStyle = P.acento; ctx.lineWidth = 3; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(ra.x, ra.y, ra.w, ra.h, 10); else ctx.rect(ra.x, ra.y, ra.w, ra.h); ctx.stroke(); ctx.restore(); }
      this._cartao(ctx, a.i, { x: a.x - G.larg / 2, y: a.y - G.alto / 2, w: G.larg, h: G.alto }, P, true);
    }
  }

  _cartao(ctx, i, r, P, flutuando) {
    var k = this.pecas[i], sel = this.sel === i;
    ctx.save();
    if (flutuando) { ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4; }
    ctx.fillStyle = ebRgba(P.painel, 0.97); ctx.strokeStyle = sel ? P.acento : ebRgba(P.suave, 0.5); ctx.lineWidth = sel ? 3 : 1.2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 9); else ctx.rect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.stroke();
    this._miniatura(ctx, k, r.x + 10, r.y + 12, r.w - 20, r.h - 50, P);
    // o nome: numa peça estreita (celular), encolhe e quebra em duas linhas (que sobem) antes de ganhar "…"
    ctx.fillStyle = P.texto; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    Q3.Desenho.textoQueCabe(ctx, k.nome, r.x + r.w / 2, r.y + r.h - 24, r.w - 12, { peso: '600', tam: 11, min: 8.5, linhas: 2, subir: true });
    ctx.fillStyle = P.suave; ctx.font = '500 10.5px system-ui, sans-serif'; ctx.fillText(k.formula, r.x + r.w / 2, r.y + r.h - 11);
    ctx.restore();
  }

  _miniatura(ctx, k, x, y, w, h, P) {
    var ids = Object.keys(k.pos), g = k.g;
    var xs = ids.map(function (id) { return k.pos[id].x; }), ys = ids.map(function (id) { return k.pos[id].y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var s = Math.min(26, (w - 14) / Math.max(1, maxX - minX), (h - 10) / Math.max(1, maxY - minY));
    var cx = x + w / 2 - (minX + maxX) / 2 * s, cy = y + h / 2 - (minY + maxY) / 2 * s;
    var T = function (id) { return { x: cx + k.pos[id].x * s, y: cy + k.pos[id].y * s }; };
    ctx.save(); ctx.strokeStyle = ebRgba(P.texto, 0.85); ctx.lineWidth = 1.6;
    g.ligacoes.forEach(function (l) { var a = T(l.a), b = T(l.b); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (l.ordem > 1) { var dx = b.y - a.y, dy = a.x - b.x, L = Math.hypot(dx, dy) || 1; ctx.beginPath(); ctx.moveTo(a.x + dx / L * 3, a.y + dy / L * 3); ctx.lineTo(b.x + dx / L * 3, b.y + dy / L * 3); ctx.stroke(); } });
    if (g.pesados().length === 1) { var p0 = T(ids[0]); ctx.fillStyle = P.texto; ctx.font = '700 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CH₄', p0.x, p0.y); }
    ctx.font = '700 10.5px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    g.pesados().forEach(function (id) { var el = g.atomos[id].el; if (el === 'C') return; var p = T(id); ctx.fillStyle = P.painel; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = P.elementos[el] || P.texto; ctx.fillText(el, p.x, p.y); });
    ctx.restore();
  }

  /* o TERMÔMETRO: cada composto sobe até a temperatura real (a ordem da trilha fica na horizontal) */
  /* o TERMÔMETRO: cada composto sobe até a temperatura real (a ordem da trilha fica na horizontal).
     O cartão fica PENDURADO ABAIXO do ponto, e a linha guia chega ao centro do topo dele: nenhuma
     linha cruza cartão algum — a de um composto mais quente passa sempre acima dos cartões dos
     anteriores, que pendem de pontos mais baixos. */
  _termometro(ctx, W, H, P) {
    var self = this, vals = this.pecas.map(function (k) { return k.teb; });
    var min = Math.floor(Math.min.apply(null, vals) / 20) * 20 - 20, max = Math.ceil(Math.max.apply(null, vals) / 20) * 20 + 20;
    var baixa = H < 430;   // celular deitado: cartões mais baixos e a escala começando mais acima, para sobrar termômetro
    var alturaCartao = baixa ? 76 : 96, topo = baixa ? 70 : 96, base = H - (baixa ? 20 : 44) - alturaCartao - 14, eixoX = 70;
    var Y = function (v) { return base - (v - min) / (max - min) * (base - topo); };
    var e = 1 - Math.pow(1 - this.anim, 3);   // subida suave
    ctx.save();
    ctx.strokeStyle = ebRgba(P.suave, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(eixoX, topo); ctx.lineTo(eixoX, base); ctx.stroke();
    ctx.fillStyle = P.suave; ctx.font = '500 11px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    var passo = (max - min) > 200 ? 40 : 20;
    while ((max - min) / passo * 15 > base - topo && passo < 400) passo *= 2;   // numa escala curta, menos marcas: os rótulos não se encavalam
    for (var v = min; v <= max; v += passo) { var yv = Y(v); ctx.beginPath(); ctx.moveTo(eixoX - 5, yv); ctx.lineTo(eixoX, yv); ctx.stroke(); ctx.fillText(v + ' °C', eixoX - 9, yv); }
    ctx.fillStyle = P.claro ? '#c0392b' : '#ff7a6b'; ctx.beginPath(); ctx.arc(eixoX, base + 14, 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    var n = this.trilha.length, larg = Math.min(140, (W - eixoX - 60 - 10 * (n - 1)) / n), x0 = eixoX + 40;
    // 1º as linhas e os pontos; depois os cartões (cada um abaixo do seu ponto); por fim os valores
    var itens = this.trilha.map(function (i, p) {
      var k = self.pecas[i], x = x0 + p * (larg + 10), cx = x + larg / 2, y = base + (Y(k.teb) - base) * e;
      return { i: i, k: k, x: x, cx: cx, y: y };
    });
    itens.forEach(function (it) {
      ctx.save();
      ctx.strokeStyle = ebRgba(P.acento, 0.55); ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(eixoX, it.y); ctx.lineTo(it.cx, it.y); ctx.lineTo(it.cx, it.y + 12); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = P.acento; ctx.beginPath(); ctx.arc(it.cx, it.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    itens.forEach(function (it) { self._cartao(ctx, it.i, { x: it.x, y: it.y + 12, w: larg, h: alturaCartao }, P); });
    itens.forEach(function (it) {
      var txt = self._fmt(it.k.teb * e + (1 - e) * min);
      ctx.save(); ctx.font = '700 12.5px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w = ctx.measureText(txt).width + 10;
      ctx.fillStyle = ebRgba(P.fundo, 0.92); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(it.cx - w / 2, it.y - 24, w, 17, 6); else ctx.rect(it.cx - w / 2, it.y - 24, w, 17); ctx.fill();
      ctx.fillStyle = P.texto; ctx.fillText(txt, it.cx, it.y - 15.5);
      ctx.restore();
    });
  }

  /* ══ PAINEL ════════════════════════════════════════════════════ */

  /* a lista de conjuntos do painel, montada dos DADOS, com os títulos de grupo
     (um conjunto novo em ebulicao.js aparece sem mexer no HTML) */
  _montarConjuntos() {
    var box = document.querySelector('[data-group="eb-conjunto"]');
    if (!box || box.dataset.montado) return;
    box.dataset.montado = '1'; box.innerHTML = '';
    (Q3.EBULICAO_GRUPOS || []).forEach(function (gr) {
      var h = document.createElement('span'); h.className = 'eb-grupo'; h.textContent = gr; box.appendChild(h);
      Q3.EBULICAO.filter(function (c) { return c.grupo === gr; }).forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'seg-btn'; b.dataset.value = c.id; b.textContent = c.nome; b.setAttribute('aria-pressed', 'false');
        box.appendChild(b);
      });
    });
  }

  _sincronizarPainel() {
    this._montarConjuntos();
    var self = this, certo = this.estado === 'certo';
    document.querySelectorAll('[data-group="eb-conjunto"] .seg-btn').forEach(function (b) { var on = b.dataset.value === self.conj.id; b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    var st = document.getElementById('eb-status');
    if (st) st.textContent = this.estado === 'incompleta' ? 'Complete a trilha.' : this.estado === 'erro' ? 'Existe erro na trilha.' : certo ? 'Trilha certa.' : '';
    /* a ficha de dados crus. ATENÇÃO: antes do acerto, na ordem EMBARALHADA das
       peças — os dados vêm em ordem crescente de ebulição, e listar nessa ordem
       entregaria a resposta. Depois do acerto, na ordem da trilha. */
    var lista = document.getElementById('eb-tabela');
    if (lista) {
      var ordem = certo ? this.trilha : this.ordemPool;
      lista.innerHTML = ordem.map(function (i) { var k = self.pecas[i];
        return '<li><strong>' + k.nome + '</strong> <span class="eb-formula">' + k.formula + '</span>' +
          '<span class="eb-linha">' + k.massa.toFixed(1).replace('.', ',') + ' g/mol · ' + k.funcao + ' · ' + (k.ohnh ? 'tem O–H ou N–H' : 'sem O–H nem N–H') + '</span>' +
          (certo ? '<span class="eb-linha eb-revelado">' + self._fmt(k.teb) + ' · ' + k.forca + '</span>' : '') + '</li>'; }).join('');
    }
    var ex = document.getElementById('eb-explicacao'); if (ex) ex.textContent = '';   // a explicação do conjunto fica nos dados (ebulicao.js), fora do painel
    var fo = document.getElementById('eb-fonte');
    if (fo) { var fontes = {}; this.pecas.forEach(function (k) { fontes[k.fonte] = 1; }); fo.textContent = certo ? '1 atm · ' + Object.keys(fontes).join('; ') : ''; }
    var bC = document.querySelector('[data-action="eb-conferir"]'); if (bC) bC.disabled = certo;
  }

  resultados() {
    return [{ l: 'Conjunto', v: this.conj.nome }, { l: 'Variável isolada', v: this.conj.variavel },
            { l: 'Trilha', v: this.estado === 'certo' ? 'certa' : this.trilha.filter(function (x) { return x !== null; }).length + ' de ' + this.trilha.length + ' posições' }];
  }
  overlay() { return 'Ebulição · ' + this.conj.nome; }
}
