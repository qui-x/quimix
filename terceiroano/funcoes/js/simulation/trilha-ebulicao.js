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

   A CENA SÓ COM O DESENHO: as peças mostram a estrutura, nada mais.
   O nome, a fórmula e os dados da peça tocada vão para Resultados (e
   o nome também para a pílula do modo); a direção da trilha é uma
   faixa de cor, do frio ao quente, em vez de uma frase. Ficam na cena
   os números das posições e a escala do termômetro (é o desenho).
   Todas as peças de um conjunto usam a MESMA escala: o tamanho na tela
   compara o tamanho das moléculas (na série homóloga, é a variável).

   NA ÁREA MAIS ALTA QUE LARGA (celular em pé, computador com os dois
   cards abertos): cinco peças lado a lado ficavam com 40 a 50 px de
   largura, e as estruturas, com 6 a 11 px por ligação. Ali a bandeja e
   a trilha viram duas colunas, a posição 1 embaixo (frio) e a última em
   cima (quente), e o termômetro fica em pé: cada composto pendurado na
   sua temperatura, ao lado da escala.
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
    this.sel = null; this.foco = null; this.estado = 'aberto'; this.anim = 0; this.arrasto = null; this.cursor = 0; this._vistos = [];
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
    this.sel = null; this.origem = null; this.foco = i;               // a ficha em Resultados: a peça que acabou de ir
    if (this.estado === 'erro' || this.estado === 'incompleta') this.estado = 'aberto';
    playTone(560 + p * 40, .04, .03);
    announce(this.pecas[i].nome + ' na posição ' + (p + 1) + '.');
    this._sincronizarPainel();
    return true;
  }
  tirar(p) {
    if (this.estado === 'certo' || this.trilha[p] === null) return false;
    var i = this.trilha[p]; this.trilha[p] = null; this.sel = i; this.foco = i; this.origem = p;   // de onde saiu: permite a troca
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
    if (certa) { this.foco = null; this.sel = null; }               // no termômetro, nenhum cartão em destaque até o aluno tocar num
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
      if (self.foco !== alvo) { self.foco = alvo; self._sincronizarPainel(); }   // a ficha da peça pega, já no começo do arrasto
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
      /* o clique que o mouse dispara junto com o fim do arrasto é ignorado. Só ELE: no toque, o arrasto não gera clique,
         e uma marca sem prazo engolia o próximo toque de verdade do aluno (tocar num cartão do termômetro, escolher
         a peça seguinte). Daí o prazo curto. */
      self._arrastoFim = performance.now();
      var p = self._posicaoPerto(a.x, a.y, 80);
      if (p >= 0) self.por(a.i, p);
      else { var de = self._naTrilha(a.i); if (de >= 0 && self._naBandeja(a.x, a.y)) { self.trilha[de] = null; self._sincronizarPainel(); } }
    });
  }

  tocar(x, y) {
    if (this._arrastoFim && performance.now() - this._arrastoFim < 350) { this._arrastoFim = 0; return true; }
    if (this.estado === 'certo') {                                   // no termômetro: tocar num cartão traz a ficha dele
      var v = this._vistoEm(x, y); if (v === null) return false;
      this.foco = v; announce(this.pecas[v].nome + ', ' + this._fmt(this.pecas[v].teb) + '.'); this._sincronizarPainel(); return true;
    }
    var p = this._posicaoEm(x, y), i = this._peca(x, y);
    if (p >= 0 && this.sel !== null) return this.por(this.sel, p);
    if (p >= 0 && this.trilha[p] !== null) return this.tirar(p);
    if (i !== null) { this.sel = this.sel === i ? null : i; this.foco = i; this.origem = null; if (this.sel !== null) announce(this.pecas[i].nome + ' selecionado: toque numa posição da trilha.'); this._sincronizarPainel(); return true; }
    return false;
  }

  /* as setas do teclado andam pela trilha: na horizontal; na trilha em pé (posição 1 embaixo), para cima e para baixo também */
  navegar(dx, dy) {
    var n = this.trilha.length; if (!dx && this._geo && this._geo.retrato && dy) dx = -dy;
    if (!dx) return false;
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

  /* DEITADA (a de sempre: computador, projetor, celular deitado): a trilha numa fileira, a bandeja embaixo.
     EM PÉ (a área livre mais alta que larga): a bandeja e a trilha em duas colunas, uma linha por composto;
     a posição 1 embaixo e a última em cima, como num termômetro; a faixa do frio ao quente ao lado da trilha. */
  /* em pé: a área livre mais alta que larga, ou estreita demais para a fileira (cartões com menos de 72 px de
     largura, como numa tela dividida) quando há altura para linhas de pelo menos 40 px */
  _emPe(W, L, n) {
    if (!L) return false;
    var largLinha = Math.min(150, (W - 56 - 10 * (n - 1)) / n), altLinha = (L.h - 8 * (n - 1)) / n;
    return L.h > L.w || (largLinha < 72 && altLinha >= 40);
  }
  _layout(W, H) {
    var n = this.trilha.length, L = Q3.Moldura ? Q3.Moldura.livre(W, H, false) : null;
    if (this._emPe(W, L, n)) {
      var vaoCol = 12, barra = 8, vaoBarra = 8, gap = 8;
      var colW = Math.floor((L.w - vaoCol - barra - vaoBarra) / 2), rowH = Math.max(40, Math.min(118, Math.floor((L.h - gap * (n - 1)) / n)));
      var total = n * rowH + (n - 1) * gap, yT = L.y + Math.max(0, Math.floor((L.h - total) / 2));
      this._geo = { retrato: true, n: n, larg: colW, alto: rowH, gap: gap, L: L, yT: yT, xPool: L.x, xTrilha: L.x + colW + vaoCol, xBarra: L.x + 2 * colW + vaoCol + vaoBarra, barra: barra, W: W, H: H };
      return this._geo;
    }
    var gap2 = 10, larg = Math.min(150, (W - 56 - gap2 * (n - 1)) / n), alto = 118;
    var trilhaY = 104, meio = 70;
    /* CENA BAIXA (celular deitado): a trilha e as peças dividem a altura que há — com as medidas
       de sempre, a fileira das peças ficava abaixo da borda da tela e não havia o que arrastar */
    if (H < 430) {
      var mtBaixa = H < 300;   // muito baixa (celular pequeno deitado): o vão entre as fileiras e a margem de baixo encolhem
      trilhaY = 70; meio = mtBaixa ? 12 : 26;
      alto = Math.max(64, Math.min(118, Math.floor((H - trilhaY - meio - (mtBaixa ? 6 : 10)) / 2)));
    }
    var x0 = (W - (n * larg + (n - 1) * gap2)) / 2, poolY = trilhaY + alto + meio;
    this._geo = { n: n, larg: larg, alto: alto, gap: gap2, x0: x0, trilhaY: trilhaY, poolY: poolY, W: W, H: H };
    return this._geo;
  }
  _slotRect(p) {
    var G = this._geo;
    if (G.retrato) return { x: G.xTrilha, y: G.yT + (G.n - 1 - p) * (G.alto + G.gap), w: G.larg, h: G.alto };   // a posição 1 embaixo
    return { x: G.x0 + p * (G.larg + G.gap), y: G.trilhaY, w: G.larg, h: G.alto };
  }
  /* o lugar de uma peça livre na bandeja: deitada, as livres centradas numa fileira; em pé, cada peça no seu lugar
     da coluna (a ordem embaralhada), sem pular quando outra sai */
  _poolRectDe(i) {
    var G = this._geo;
    if (G.retrato) { var k0 = this.ordemPool.indexOf(i); return { x: G.xPool, y: G.yT + k0 * (G.alto + G.gap), w: G.larg, h: G.alto }; }
    var l = this.livres(), k = l.indexOf(i), total = l.length, x0 = (G.W - (total * G.larg + (total - 1) * G.gap)) / 2;
    return { x: x0 + k * (G.larg + G.gap), y: G.poolY, w: G.larg, h: G.alto };
  }
  /* soltar ali devolve à bandeja a peça que estava na trilha */
  _naBandeja(x, y) { var G = this._geo; if (!G) return false; return G.retrato ? x < G.xTrilha - 4 : y > G.poolY - 20; }
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
    for (var k = 0; k < l.length; k++) { var r = this._poolRectDe(l[k]); if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return l[k]; }
    return null;
  }
  /* o cartão desenhado neste ponto (no termômetro, para a ficha) */
  _vistoEm(x, y) { var v = (this._vistos || []).filter(function (c) { return x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h; }); return v.length ? v[v.length - 1].i : null; }

  /* A ESCALA DO CONJUNTO: a maior que cabe em todas as peças numa caixa w × h (com a folga dos rótulos dos
     heteroátomos), até 34 px por ligação (era 26 quando o nome e a fórmula dividiam o cartão com a estrutura).
     Todas as miniaturas usam a mesma: o tamanho na tela compara as moléculas. */
  _escalaConjunto(w, h) {
    var chave = Math.round(w) + 'x' + Math.round(h) + '|' + this.conj.id;
    if (this._esc && this._esc.chave === chave) return this._esc.s;
    var s = 34;
    this.pecas.forEach(function (k) {
      var ids = Object.keys(k.pos); if (ids.length < 2) return;
      var xs = ids.map(function (id) { return k.pos[id].x; }), ys = ids.map(function (id) { return k.pos[id].y; });
      var dx = Math.max.apply(null, xs) - Math.min.apply(null, xs), dy = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      s = Math.min(s, (w - 18) / Math.max(0.5, dx), (h - 18) / Math.max(0.5, dy));
    });
    s = Math.max(4, s);
    this._esc = { chave: chave, s: s };
    return s;
  }

  /* ══ DESENHO ══════════════════════════════════════════════════ */

  desenhar(ctx, W, H) {
    var P = Q3.Desenho.paleta(), G = this._layout(W, H), self = this;
    this._vistos = [];
    if (this.estado === 'certo') { if (G.retrato) this._termometroEmPe(ctx, W, H, P); else this._termometro(ctx, W, H, P); return; }
    this._faixaQuente(ctx, P);                                       // a direção da trilha: do frio ao quente
    for (var p = 0; p < G.n; p++) {
      var r = this._slotRect(p), i = this.trilha[p];
      ctx.save();
      ctx.strokeStyle = this.estado === 'erro' ? (P.claro ? '#8a4b00' : '#ffb454') : ebRgba(P.suave, 0.55); ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x, r.y, r.w, r.h, 10); else ctx.rect(r.x, r.y, r.w, r.h); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = P.suave; ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(p + 1), r.x + 7, r.y + 15);
      if (p === this.cursor) { ctx.strokeStyle = P.acento; ctx.lineWidth = 2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12); else ctx.rect(r.x - 3, r.y - 3, r.w + 6, r.h + 6); ctx.stroke(); }
      ctx.restore();
      if (i !== null && !(this.arrasto && this.arrasto.moveu && this.arrasto.i === i)) this._cartao(ctx, i, r, P);
    }
    this.livres().forEach(function (i) { if (self.arrasto && self.arrasto.moveu && self.arrasto.i === i) return; self._cartao(ctx, i, self._poolRectDe(i), P); });
    if (this.arrasto && this.arrasto.moveu) {
      var a = this.arrasto, alvo = this._posicaoPerto(a.x, a.y, 80);
      if (alvo >= 0) { var ra = this._slotRect(alvo); ctx.save(); ctx.strokeStyle = P.acento; ctx.lineWidth = 3; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(ra.x, ra.y, ra.w, ra.h, 10); else ctx.rect(ra.x, ra.y, ra.w, ra.h); ctx.stroke(); ctx.restore(); }
      this._cartao(ctx, a.i, { x: a.x - G.larg / 2, y: a.y - G.alto / 2, w: G.larg, h: G.alto }, P, true);
    }
  }

  /* A FAIXA DO FRIO AO QUENTE: a direção da trilha sem palavras — azul na posição 1 (a menor temperatura de
     ebulição), vermelha na última, com a ponta de seta no lado quente. Deitada, acima da trilha; em pé, ao lado. */
  _faixaQuente(ctx, P) {
    var G = this._geo, r1 = this._slotRect(0), rn = this._slotRect(G.n - 1), frio = P.claro ? '#2f6fd6' : '#6aa7ff', quente = P.claro ? '#c0392b' : '#ff7a6b';
    var x0, y0, x1, y1, esp = 5;
    if (G.retrato) { x0 = x1 = G.xBarra + G.barra / 2; y0 = r1.y + r1.h - 4; y1 = rn.y + 10; }
    else { y0 = y1 = G.trilhaY - 14; x0 = r1.x + 4; x1 = rn.x + rn.w - 12; }
    var gr = ctx.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, ebRgba(frio, 0.85)); gr.addColorStop(1, ebRgba(quente, 0.9));
    ctx.save(); ctx.strokeStyle = gr; ctx.lineWidth = esp; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    var ang = Math.atan2(y1 - y0, x1 - x0), t = 9;                 // a ponta de seta, no lado quente
    ctx.fillStyle = ebRgba(quente, 0.9); ctx.beginPath();
    ctx.moveTo(x1 + Math.cos(ang) * t, y1 + Math.sin(ang) * t);
    ctx.lineTo(x1 + Math.cos(ang + 2.4) * t, y1 + Math.sin(ang + 2.4) * t);
    ctx.lineTo(x1 + Math.cos(ang - 2.4) * t, y1 + Math.sin(ang - 2.4) * t);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  /* o CARTÃO de uma peça: só a estrutura, centrada (o nome e os dados ficam em Resultados). valor: no termômetro em
     pé, a temperatura escrita à esquerda, dentro do cartão */
  _cartao(ctx, i, r, P, flutuando, valor) {
    var k = this.pecas[i], sel = this.sel === i || (this.estado === 'certo' && this.foco === i);
    ctx.save();
    if (flutuando) { ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4; }
    ctx.fillStyle = ebRgba(P.painel, 0.97); ctx.strokeStyle = sel ? P.acento : ebRgba(P.suave, 0.5); ctx.lineWidth = sel ? 3 : 1.2;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8, 9); else ctx.rect(r.x + 4, r.y + 4, r.w - 8, r.h - 8); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.stroke();
    var esq = 0;
    if (valor) {
      ctx.fillStyle = P.texto; ctx.font = '700 12.5px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(valor, r.x + 12, r.y + r.h / 2); esq = this._valorLarg || 74;
    }
    var bx = r.x + 6 + esq, bw = r.w - 12 - esq, by = r.y + 6, bh = r.h - 12;
    this._miniatura(ctx, k, bx, by, bw, bh, P, this._escalaConjunto(r.w - 12 - esq, r.h - 12));
    ctx.restore();
    if (!flutuando) this._vistos.push({ i: i, x: r.x, y: r.y, w: r.w, h: r.h });
  }

  /* a MINIATURA: a estrutura em bastão na escala s (a do conjunto), centrada na caixa; devolve s */
  _miniatura(ctx, k, x, y, w, h, P, s) {
    var ids = Object.keys(k.pos), g = k.g;
    var xs = ids.map(function (id) { return k.pos[id].x; }), ys = ids.map(function (id) { return k.pos[id].y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    if (!s) s = Math.min(26, (w - 18) / Math.max(0.5, maxX - minX), (h - 18) / Math.max(0.5, maxY - minY));
    var cx = x + w / 2 - (minX + maxX) / 2 * s, cy = y + h / 2 - (minY + maxY) / 2 * s;
    var T = function (id) { return { x: cx + k.pos[id].x * s, y: cy + k.pos[id].y * s }; };
    var lw = Math.max(1.4, Math.min(2.2, s * 0.075)), dupla = Math.max(2.5, s * 0.13), fonte = Math.max(10.5, Math.min(13, s * 0.48)), raio = fonte * 0.68;
    ctx.save(); ctx.strokeStyle = ebRgba(P.texto, 0.85); ctx.lineWidth = lw; ctx.lineCap = 'round';
    g.ligacoes.forEach(function (l) { var a = T(l.a), b = T(l.b), dx = b.y - a.y, dy = a.x - b.x, L = Math.hypot(dx, dy) || 1;
      if (l.ordem === 2) { [-1, 1].forEach(function (sg) { ctx.beginPath(); ctx.moveTo(a.x + dx / L * dupla / 2 * sg, a.y + dy / L * dupla / 2 * sg); ctx.lineTo(b.x + dx / L * dupla / 2 * sg, b.y + dy / L * dupla / 2 * sg); ctx.stroke(); }); }
      else { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        if (l.ordem === 3) [-1, 1].forEach(function (sg) { ctx.beginPath(); ctx.moveTo(a.x + dx / L * dupla * sg, a.y + dy / L * dupla * sg); ctx.lineTo(b.x + dx / L * dupla * sg, b.y + dy / L * dupla * sg); ctx.stroke(); }); } });
    if (g.pesados().length === 1) { var p0 = T(ids[0]); ctx.fillStyle = P.texto; ctx.font = '700 ' + (fonte + 1.5).toFixed(1) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CH₄', p0.x, p0.y); }
    ctx.font = '700 ' + fonte.toFixed(1) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    g.pesados().forEach(function (id) { var el = g.atomos[id].el; if (el === 'C') return; var p = T(id); ctx.fillStyle = P.painel; ctx.beginPath(); ctx.arc(p.x, p.y, raio, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = P.elementos[el] || P.texto; ctx.fillText(el, p.x, p.y); });
    ctx.restore();
    return s;
  }

  /* o TERMÔMETRO: cada composto sobe até a temperatura real (a ordem da trilha fica na horizontal).
     O cartão fica PENDURADO ABAIXO do ponto, e a linha guia chega ao centro do topo dele: nenhuma
     linha cruza cartão algum — a de um composto mais quente passa sempre acima dos cartões dos
     anteriores, que pendem de pontos mais baixos. */
  _escalaTermo(H, topo, base) {
    var vals = this.pecas.map(function (k) { return k.teb; });
    var min = Math.floor(Math.min.apply(null, vals) / 20) * 20 - 20, max = Math.ceil(Math.max.apply(null, vals) / 20) * 20 + 20;
    return { min: min, max: max, Y: function (v) { return base - (v - min) / (max - min) * (base - topo); } };
  }
  _eixoTermo(ctx, P, eixoX, topo, base, E) {
    ctx.save();
    ctx.strokeStyle = ebRgba(P.suave, 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(eixoX, topo); ctx.lineTo(eixoX, base); ctx.stroke();
    ctx.fillStyle = P.suave; ctx.font = '500 11px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    var passo = (E.max - E.min) > 200 ? 40 : 20;
    while ((E.max - E.min) / passo * 15 > base - topo && passo < 400) passo *= 2;   // numa escala curta, menos marcas: os rótulos não se encavalam
    for (var v = E.min; v <= E.max; v += passo) { var yv = E.Y(v); ctx.beginPath(); ctx.moveTo(eixoX - 5, yv); ctx.lineTo(eixoX, yv); ctx.stroke(); ctx.fillText(v + ' °C', eixoX - 9, yv); }
    ctx.fillStyle = P.claro ? '#c0392b' : '#ff7a6b'; ctx.beginPath(); ctx.arc(eixoX, base + 14, 10, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  _termometro(ctx, W, H, P) {
    var self = this;
    var baixa = H < 430;   // celular deitado: cartões mais baixos e a escala começando mais acima, para sobrar termômetro
    var alturaCartao = baixa ? 76 : 96, topo = baixa ? 70 : 96, base = H - (baixa ? 20 : 44) - alturaCartao - 14, eixoX = 70;
    var E = this._escalaTermo(H, topo, base), Y = E.Y, min = E.min;
    var e = 1 - Math.pow(1 - this.anim, 3);   // subida suave
    this._eixoTermo(ctx, P, eixoX, topo, base, E);
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
  /* O TERMÔMETRO EM PÉ: a escala na vertical, à esquerda; os cartões numa coluna à direita, cada um na altura da
     sua temperatura (os muito próximos se afastam o mínimo para não se cobrirem, na mesma ordem), com a temperatura
     escrita dentro do cartão. A linha guia sai do ponto na escala e chega ao cartão. Na subida, o ponto sobe pela
     escala e o valor conta; os cartões já estão no lugar, aparecendo. */
  _termometroEmPe(ctx, W, H, P) {
    var self = this, G = this._geo, L = G.L, n = this.trilha.length;
    var eixoX = L.x + 52, topo = L.y + 14, base = L.y + L.h - 30;
    var E = this._escalaTermo(H, topo, base), e = 1 - Math.pow(1 - this.anim, 3);
    this._eixoTermo(ctx, P, eixoX, topo, base, E);
    var cx0 = eixoX + 30, cw = L.x + L.w - cx0, vao = 6, ch = Math.max(40, Math.min(84, Math.floor((base - topo - vao * (n - 1)) / n)));
    // os centros: cada um na sua temperatura; do mais frio ao mais quente, afastados o mínimo; dentro da escala
    var ordem = this.trilha.slice(), alvo = ordem.map(function (i) { return E.Y(self.pecas[i].teb); }), meia = ch / 2;
    for (var a = 1; a < n; a++) alvo[a] = Math.min(alvo[a], alvo[a - 1] - ch - vao);
    if (alvo[n - 1] < topo + meia) { alvo[n - 1] = topo + meia; for (var b = n - 2; b >= 0; b--) alvo[b] = Math.max(alvo[b], alvo[b + 1] + ch + vao); }
    ctx.save(); ctx.font = '700 12.5px system-ui, sans-serif';
    this._valorLarg = Math.ceil(Math.max.apply(null, ordem.map(function (i) { return ctx.measureText(self._fmt(self.pecas[i].teb)).width; }))) + 18;
    ctx.restore();
    ordem.forEach(function (i, p) {
      var k = self.pecas[i], yp = base + (E.Y(k.teb) - base) * e, yc = alvo[p];
      ctx.save();
      ctx.strokeStyle = ebRgba(P.acento, 0.55); ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(eixoX, yp); ctx.lineTo(cx0 - 8, yp); ctx.lineTo(cx0 + 4, yc); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = P.acento; ctx.beginPath(); ctx.arc(eixoX, yp, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    ordem.forEach(function (i, p) {
      var k = self.pecas[i], yc = alvo[p];
      ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * e;
      self._cartao(ctx, i, { x: cx0, y: yc - meia, w: cw, h: ch }, P, false, self._fmt(k.teb * e + (1 - e) * E.min));
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

  /* A FICHA: o conjunto, a trilha e a peça tocada — o nome, a fórmula, a massa molar, a função e o O–H/N–H, que
     antes eram escritos no cartão; com a trilha certa, também a ebulição e a força entre as moléculas */
  resultados() {
    var n = this.trilha.length, postas = this.trilha.filter(function (x) { return x !== null; }).length;
    var linhas = [{ l: 'Conjunto', v: this.conj.nome }, { l: 'Variável isolada', v: this.conj.variavel },
                  { l: 'Trilha', v: this.estado === 'certo' ? 'certa' : postas + ' de ' + n + ' posições', cls: this.estado === 'certo' ? 'val-ok' : '' }];
    var k = this.foco !== null && this.foco !== undefined ? this.pecas[this.foco] : null;
    if (!k) return linhas;
    var pos = this._naTrilha(this.foco);
    linhas.push({ l: 'Peça', v: k.nome });
    linhas.push({ l: 'Fórmula', v: k.formula + ' · ' + k.massa.toFixed(1).replace('.', ',') + ' g/mol' });
    linhas.push({ l: 'Função', v: k.funcao + ' · ' + (k.ohnh ? 'tem O–H ou N–H' : 'sem O–H nem N–H'), cls: 'val-texto' });
    if (this.estado === 'certo') {
      linhas.push({ l: 'Ebulição', v: this._fmt(k.teb) + ' (1 atm)' });
      linhas.push({ l: 'Força entre as moléculas', v: k.forca, cls: 'val-texto' });
    } else linhas.push({ l: 'Na trilha', v: pos >= 0 ? 'posição ' + (pos + 1) : this.sel === this.foco ? 'escolhida: toque numa posição' : 'na bandeja', cls: 'val-texto' });
    return linhas;
  }
  /* o retorno da conferência, no alto dos Resultados (o mesmo do painel Trilha) */
  retorno() {
    if (this.estado === 'certo') return { tipo: 'ok', texto: 'Trilha certa. Cada composto subiu no termômetro até a sua temperatura de ebulição; a força entre as moléculas de cada um está em Dados.' };
    if (this.estado === 'erro') return { tipo: 'erro', texto: 'Existe erro na trilha.' };
    if (this.estado === 'incompleta') return { tipo: 'erro', texto: 'Complete a trilha antes de conferir.' };
    return null;
  }
  /* o que fazer agora (a frase "ebulição crescente" que ficava no alto da cena mora aqui, completa) */
  proximoPasso() {
    var n = this.trilha.length, postas = this.trilha.filter(function (x) { return x !== null; }).length;
    if (this.estado === 'certo') return 'Toque num cartão do termômetro para ver os dados dele aqui. Para outro conjunto, escolha em Trilha.';
    if (this.sel !== null) return 'Toque numa posição da trilha para pôr ' + this.pecas[this.sel].nome + '. Tocar de novo na peça a solta.';
    if (this.estado === 'erro') return 'Troque peças de lugar (toque numa peça da trilha para tirá-la) e confira de novo.';
    if (postas === n) return 'Trilha completa: toque em Conferir a trilha.';
    if (!postas) return 'Ordene por ebulição crescente: a posição 1 é a de menor temperatura de ebulição, e a faixa vai do frio (azul) ao quente (vermelho). Toque numa peça para ver aqui o nome e os dados dela; depois, numa posição — ou arraste a peça até lá.';
    return 'Continue: falta' + (n - postas > 1 ? 'm ' + (n - postas) + ' posições' : ' 1 posição') + '. Toque numa peça para ver aqui o nome e os dados dela.';
  }
  /* a pílula: o nome da peça tocada (na cena, as peças não têm nome); sem peça, o conjunto */
  overlay() { return this.foco !== null && this.foco !== undefined ? this.pecas[this.foco].nome : this.conj.nome; }
}
