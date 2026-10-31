/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/bancada-isomeria.js
   ───────────────────────────────────────────────────────────────
   SIIS — MÓDULO 1: ISOMERIA CONSTITUCIONAL.

   A BANCADA: 10 espaços (pedido do professor). O ARRANJO muda com a
   SELEÇÃO, com transição animada, para estudar cada estrutura:
     · nenhum selecionado → os 10 em grade;
     · um → ele grande no centro; os outros numa doca no alto;
     · dois → A e B lado a lado, grandes (um sobre o outro em tela
       estreita), prontos para o Comparar.
   Tocar de novo num espaço o solta.

   ENTRADAS: a fórmula molecular, em REMESSAS (cada toque em Gerar troca
   os isômeros gerados pelos próximos, sem repetir até todos aparecerem;
   as estruturas que o aluno digitou ou desenhou ficam); a fórmula
   estrutural digitada (a tripla: -= vira ≡); o desenho no editor do
   SIQC. A fórmula molecular de cada espaço fica sempre visível.

   COMPARAR (dois selecionados): fórmulas diferentes · mesma molécula ·
   isômeros com o tipo (tautomeria, função, metameria, posição, cadeia).
   O quadro Dados só aparece DEPOIS do Comparar (especificação) e some
   quando a seleção muda.
═══════════════════════════════════════════════════════════════ */

'use strict';

var BI_ESPACOS = 10;
function biRgba(hex, a) {
  var h = String(hex).replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
  var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

class BancadaIsomeria {
  constructor(D) {
    this.D = D; this.ativo = false; this.t = 0;
    this.editor = new EditorCadeias(D);
    this.reiniciar(true);
  }

  /* a troca de módulo LIMPA o que sai */
  reiniciar(inicio) {
    this.espacos = []; for (var i = 0; i < BI_ESPACOS; i++) this.espacos.push(null);
    this.sel = []; this.foco = 0; this.veredito = null; this.nota = ''; this.erro = null; this._ciclo = null;
    this.fonte = 'bancada'; this.rects = []; this._alvos = [];
    if (this.vista === undefined) this.vista = 'completa';     // a representação dos cartões: as seis do Módulo 1 do SIQC
    if (!inicio) {
      this.editor.reiniciar(); this.editor.desativar();
      ['bi-molecular', 'bi-estrutural'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      this._mostrarFonte(); this._sincronizarPainel();
    }
  }
  ativar() {
    this.ativo = true; var cv = document.getElementById('sim-canvas'); if (cv) cv.style.touchAction = 'none';
    this._ligarPainel(); this._ligarOrbita();
    if (this.fonte === 'desenhar') this.editor.ativar();
    this._mostrarFonte(); this._sincronizarPainel();
  }
  desativar() { this.ativo = false; this.editor.desativar(); this._mostrarFonte(); }
  atualizar(dt) { this.t += dt; if (this.fonte === 'desenhar') this.editor.atualizar(dt); }

  /* ══ OS ESPAÇOS ════════════════════════════════════════════════ */

  _horizontal(pos) {
    var ids = Object.keys(pos), n = ids.length || 1, mx = 0, my = 0;
    ids.forEach(function (id) { mx += pos[id].x / n; my += pos[id].y / n; });
    var sxx = 0, syy = 0, sxy = 0;
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), s = Math.sin(-th), out = {};
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; out[id] = { x: dx * c - dy * s, y: dx * s + dy * c }; });
    return out;
  }
  _nomeDe(g) { return Q3.Isomeros.nomear(g); }
  _espaco(g, origem) {
    return { g: g, origem: origem, pos: this._horizontal(Q3.Geometria.layout(g)), canonica: Q3.Isomeros.canonica(g), nome: this._nomeDe(g),
             formula: g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); }) };
  }
  _mudouSelecao() { this.veredito = null; this._sincronizarPainel(); }
  /* ganchos (o Módulo 2 os troca): a lista gerada e o espaço de um item dela */
  _gerarLista(texto) { return Q3.Isomeros.gerar(texto); }
  _espacoDe(item, origem) { return this._espaco(item.g, origem); }

  /* onde entra uma estrutura digitada ou desenhada: no espaço selecionado (se houver só um); senão, no 1º vazio */
  _destino() { if (this.sel.length === 1) return this.sel[0]; for (var i = 0; i < BI_ESPACOS; i++) if (!this.espacos[i]) return i; return -1; }

  /* ══ GERAR: enche os espaços VAZIOS, sem repetir ══════════════ */
  /* GERAR, EM REMESSAS (pedido do professor): cada toque troca os isômeros GERADOS
     pela próxima remessa — mesmo com a bancada cheia —, sem repetir até todos terem
     aparecido; depois, uma ordem nova (e nenhuma remessa repete estrutura, nem na
     virada). As estruturas que o aluno digitou ou desenhou FICAM, e não voltam
     repetidas na remessa. Fórmula nova recomeça do zero. */
  gerar(texto) {
    var r;
    try { r = this._gerarLista(texto); } catch (e) { this.erro = e.message; announce(e.message); this._sincronizarPainel(); return false; }
    this.erro = null;
    var chave = Object.keys(r.formula.cont).sort().map(function (k) { return k + r.formula.cont[k]; }).join(''), N = r.total, self = this;
    if (!this._ciclo || this._ciclo.chave !== chave) this._ciclo = { chave: chave, lista: r.estruturas, fila: [], vistos: {}, leva: 0 };
    var c = this._ciclo;
    // os espaços da remessa: os vazios e os que têm estruturas GERADAS (as do aluno ficam)
    var livres = []; for (var i = 0; i < BI_ESPACOS; i++) if (!this.espacos[i] || this.espacos[i].origem === 'gerada') livres.push(i);
    if (!livres.length) { this.nota = 'Sem espaço livre: esvazie algum.'; announce(this.nota); this._sincronizarPainel(); return true; }
    var doAluno = {}; this.espacos.forEach(function (e) { if (e && e.origem !== 'gerada') doAluno[e.canonica] = 1; });
    var disponiveis = c.lista.filter(function (e) { return !doAluno[e.canonica]; }).length;
    var quantos = Math.min(livres.length, disponiveis);
    var perm = function () { var a = []; for (var q = 0; q < N; q++) a.push(q); for (var k = N - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)), t = a[k]; a[k] = a[j]; a[j] = t; } return a; };
    while (c.fila.length < quantos + N) c.fila = c.fila.concat(perm());
    var leva = [], adiados = [], guarda = 0;
    while (leva.length < quantos && c.fila.length && guarda++ < 8 * N + 8) {
      var k2 = c.fila.shift(), est = c.lista[k2];
      if (doAluno[est.canonica]) { c.vistos[k2] = 1; continue; }            // já está na bancada, pelo aluno
      if (leva.indexOf(k2) >= 0) { adiados.push(k2); continue; }            // repetiria dentro da remessa: fica para a próxima
      leva.push(k2);
      if (!c.fila.length) c.fila = perm();
    }
    c.fila = adiados.concat(c.fila);
    livres.forEach(function (i2) { self.espacos[i2] = null; });
    leva.forEach(function (k3, j) { self.espacos[livres[j]] = self._espacoDe(c.lista[k3], 'gerada'); c.vistos[k3] = 1; });
    c.leva++;
    this.sel = []; this.veredito = null;
    var vistos = Object.keys(c.vistos).length, cabem = livres.length >= disponiveis;
    this.nota = !N ? 'Nenhum isômero.' : (cabem ? N + (N === 1 ? ' isômero' : ' isômeros') : Math.min(vistos, N) + ' de ' + N + (r.recortado ? '' : ' isômeros')) +
                (r.recortado ? (cabem ? '' : ' · ') + 'os mais estudados de ' + r.possiveis + ' isômeros' : '');   // o recorte (até 50) fica dito
    playTone(660, .06, .04);
    announce((r.recortado ? 'A fórmula ' + texto + ' tem ' + r.possiveis + ' isômeros; a bancada usa os ' + N + ' mais estudados. ' : N + ' isômeros com a fórmula ' + texto + '. ') + (cabem ? (c.leva > 1 ? 'Todos na bancada, em outra ordem.' : 'Todos na bancada.') : 'Remessa ' + c.leva + ': já apareceram ' + Math.min(vistos, N) + ' de ' + N + '. Gere de novo para ver a próxima remessa.'));
    this._sincronizarPainel();
    return true;
  }

  porFormula(texto) {
    var g;
    try { g = Q3.deFormulaCondensada(texto); } catch (e) { this.erro = e.message; announce(e.message); this._sincronizarPainel(); return false; }
    var d = this._destino();
    if (d < 0) { this.erro = 'Bancada cheia: selecione um espaço para trocar.'; announce(this.erro); this._sincronizarPainel(); return false; }
    this.erro = null; this.espacos[d] = this._espaco(g, 'digitada'); this._mudouSelecao();
    playTone(660, .05, .03); announce('Estrutura no espaço ' + (d + 1) + ': ' + this.espacos[d].formula + '.');
    return true;
  }

  /* desenho no editor do SIQC */
  abrirDesenho() { this.fonte = 'desenhar'; this.editor.ativar(); this._mostrarFonte(); this._sincronizarPainel(); announce('Desenhe no editor e leve o desenho para a bancada.'); return true; }
  voltarBancada() { this.fonte = 'bancada'; this.editor.desativar(); this._mostrarFonte(); this._sincronizarPainel(); return true; }
  levarDesenho() {
    var g = this.editor.g.clonar ? this.editor.g.clonar() : this.editor.g;
    if (!g.pesados().length) { announce('O editor está vazio.'); return false; }
    var d = this._destino();
    if (d < 0) { this.erro = 'Bancada cheia: selecione um espaço para trocar.'; announce(this.erro); this._sincronizarPainel(); return false; }
    this.espacos[d] = this._espaco(g, 'desenhada'); this.voltarBancada(); this._mudouSelecao();
    announce('Desenho no espaço ' + (d + 1) + '.');
    return true;
  }
  _mostrarFonte() {
    var d = this.fonte === 'desenhar', at = this.ativo;
    var vis = function (id, sim) { var el = document.getElementById(id); if (el) el.hidden = !sim; };
    vis('panel-construcao', at && d); vis('panel-representacao', at && d);
    vis('bi-grupo-desenho', d); vis('bi-grupo-bancada', !d);
  }

  esvaziar() {
    var alvo = this.sel.length ? this.sel.slice() : [this.foco], self = this;
    alvo.forEach(function (i) { self.espacos[i] = null; });
    this.sel = []; this._mudouSelecao(); announce('Espaço esvaziado.'); return true;
  }
  limpar() { for (var i = 0; i < BI_ESPACOS; i++) this.espacos[i] = null; this.sel = []; this.nota = ''; this._mudouSelecao(); announce('Bancada limpa.'); return true; }

  /* ══ SELEÇÃO E COMPARAR ════════════════════════════════════════ */
  selecionar(i) {
    if (i < 0 || i >= BI_ESPACOS) return false;
    var k = this.sel.indexOf(i);
    if (k >= 0) this.sel.splice(k, 1);
    else { this.sel.push(i); if (this.sel.length > 2) this.sel.shift(); }
    this.foco = i; this._mudouSelecao();
    var e = this.espacos[i];
    announce(k >= 0 ? 'Espaço ' + (i + 1) + ' solto.' : 'Espaço ' + (i + 1) + (e ? ': ' + (e.nome ? e.nome + ', ' : '') + e.formula : ': vazio') + (this.sel.length === 2 ? '. Dois selecionados: pode comparar.' : '.'));
    return true;
  }
  comparar() {
    if (this.sel.length !== 2) { announce('Selecione dois espaços para comparar.'); return false; }
    var A = this.espacos[this.sel[0]], B = this.espacos[this.sel[1]];
    if (!A || !B) { announce('Um dos espaços selecionados está vazio.'); return false; }
    this.veredito = { r: Q3.Isomeros.classificar(A.g, B.g), a: this.sel[0], b: this.sel[1] };
    playTone(660, .08, .04); announce(this.veredito.r.texto);
    this._sincronizarPainel();
    return true;
  }

  /* ══ ENTRADA ═══════════════════════════════════════════════════ */
  tocar(x, y) {
    if (this.fonte === 'desenhar') return this.editor.tocar(x, y);
    if (this._girouOrbita) { this._girouOrbita = false; return true; }   // girar a molécula não é tocar
    for (var i = 0; i < this.rects.length; i++) { var r = this.rects[i]; if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return this.selecionar(i); }
    return false;
  }
  navegar(dx, dy) {
    if (this.fonte === 'desenhar') return this.editor.navegar(dx, dy);
    if (!dx && !dy) return false;
    this.foco = (this.foco + ((dx || dy) > 0 ? 1 : BI_ESPACOS - 1)) % BI_ESPACOS;
    var e = this.espacos[this.foco]; announce('Espaço ' + (this.foco + 1) + (e ? ': ' + e.formula : ': vazio') + '.');
    return true;
  }
  mudarVista(v) {
    var vi = Q3.Representacoes.vista(v); if (vi.id !== v) return false;
    this.vista = v; announce(vi.nome + (vi.tresD ? ': em três dimensões; arraste o cartão grande para girar.' : '.'));
    return true;
  }
  acao(nome) {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    if (nome === 'bi-gerar') return this.gerar(val('bi-molecular'));
    if (nome === 'bi-por') return this.porFormula(val('bi-estrutural'));
    if (nome === 'bi-comparar') return this.comparar();
    if (nome === 'bi-esvaziar') return this.esvaziar();
    if (nome === 'bi-limpar') return this.limpar();
    if (nome === 'bi-desenhar') return this.abrirDesenho();
    if (nome === 'bi-levar') return this.levarDesenho();
    if (nome === 'bi-voltar') return this.voltarBancada();
    if (nome === 'bi-acao') return this.fonte === 'desenhar' ? this.editor.acao('cad-ativar') : (this.sel.length === 2 && this.sel.indexOf(this.foco) >= 0 ? this.comparar() : this.selecionar(this.foco));
    return false;
  }

  /* ══ O ARRANJO (muda com a seleção; as caixas deslizam até o lugar novo) ══ */
  _calcularAlvos(W, H) {
    var alvos = [], topo = 58, m = 16, gap = 10, baixo = 34, sel = this.sel;   // baixo: a legenda de teclado do canvas
    if (typeof window !== 'undefined' && window.innerWidth <= 1100) baixo = 12;   // no celular essa legenda sai com o modo ativo: a altura volta para as caixas
    if (!sel.length) {
      // numa cena baixa e larga (celular deitado), cinco colunas: duas fileiras em vez de três, caixas mais altas
      var cols = W >= 640 || (W >= 520 && H < 460) ? 5 : W >= 430 ? 4 : 2, rows = Math.ceil(BI_ESPACOS / cols);
      var w = (W - 2 * m - (cols - 1) * gap) / cols, h = Math.min((H - topo - baixo - (rows - 1) * gap) / rows, w * 1.15);
      var y0 = topo + Math.max(0, (H - topo - baixo - (rows * h + (rows - 1) * gap)) / 2);
      for (var i = 0; i < BI_ESPACOS; i++) alvos.push({ x: m + (i % cols) * (w + gap), y: y0 + Math.floor(i / cols) * (h + gap), w: w, h: h });
      return alvos;
    }
    var doca = []; for (var j = 0; j < BI_ESPACOS; j++) if (sel.indexOf(j) < 0) doca.push(j);
    var dg = 6, dw = Math.min(70, (W - 2 * m - (doca.length - 1) * dg) / doca.length), linhas = 1;
    if (dw < 46) { linhas = 2; dw = Math.min(70, (W - 2 * m - (Math.ceil(doca.length / 2) - 1) * dg) / Math.ceil(doca.length / 2)); }
    var dh = Math.max(48, Math.min(64, dw * 0.95)), porLinha = Math.ceil(doca.length / linhas);
    doca.forEach(function (idx, k) {
      var lin = Math.floor(k / porLinha), col = k % porLinha, nesta = Math.min(porLinha, doca.length - lin * porLinha);
      var x0 = (W - (nesta * dw + (nesta - 1) * dg)) / 2;
      alvos[idx] = { x: x0 + col * (dw + dg), y: topo + lin * (dh + dg), w: dw, h: dh };
    });
    var yG = topo + linhas * (dh + dg) + 14, hG = H - yG - baixo;
    if (sel.length === 1) { var wG = Math.min(W - 2 * m, 760); alvos[sel[0]] = { x: (W - wG) / 2, y: yG, w: wG, h: hG }; }
    else if (W >= 600) { var w2 = Math.min((W - 2 * m - gap) / 2, 560), x2 = (W - (2 * w2 + gap)) / 2; alvos[sel[0]] = { x: x2, y: yG, w: w2, h: hG }; alvos[sel[1]] = { x: x2 + w2 + gap, y: yG, w: w2, h: hG }; }
    else { var h2 = (hG - gap) / 2; alvos[sel[0]] = { x: m, y: yG, w: W - 2 * m, h: h2 }; alvos[sel[1]] = { x: m, y: yG + h2 + gap, w: W - 2 * m, h: h2 }; }
    return alvos;
  }

  /* ══ DESENHO ═══════════════════════════════════════════════════ */
  desenhar(ctx, W, H) {
    if (this.fonte === 'desenhar') { this.editor.desenhar(ctx, W, H); return; }
    var P = Q3.Desenho.paleta(), alvos = this._calcularAlvos(W, H), self = this;
    this._alvos = alvos;                                   // o destino de cada caixa (a animação desliza até ele)
    // a animação anda pelo TEMPO real, não por quadro: chega no mesmo tempo em aparelho rápido ou lento
    var agora = (typeof performance !== 'undefined' ? performance.now() : Date.now()), dt = this._tUlt ? Math.min(0.12, (agora - this._tUlt) / 1000) : 0.016;
    this._tUlt = agora;
    var f = 1 - Math.exp(-dt * 12);
    for (var i = 0; i < BI_ESPACOS; i++) {
      var a = alvos[i], r = this.rects[i];
      if (!r || this._WH !== W + 'x' + H && !this._animando) this.rects[i] = { x: a.x, y: a.y, w: a.w, h: a.h };
      else { r.x += (a.x - r.x) * f; r.y += (a.y - r.y) * f; r.w += (a.w - r.w) * f; r.h += (a.h - r.h) * f; }
    }
    this._WH = W + 'x' + H; this._animando = true;
    // os pequenos primeiro, os grandes por cima
    var ordem = []; for (var k = 0; k < BI_ESPACOS; k++) ordem.push(k);
    ordem.sort(function (x, y) { return self.rects[x].w * self.rects[x].h - self.rects[y].w * self.rects[y].h; });
    ordem.forEach(function (idx) { self._cartao(ctx, idx, self.rects[idx], P); });
  }

  _cartao(ctx, i, r, P) {
    var e = this.espacos[i], s = this.sel.indexOf(i), foco = i === this.foco;
    ctx.save();
    ctx.fillStyle = biRgba(P.painel, 0.95); ctx.strokeStyle = s >= 0 ? P.acento : biRgba(P.suave, 0.45); ctx.lineWidth = s >= 0 ? 3 : 1;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x, r.y, r.w, r.h, 10); else ctx.rect(r.x, r.y, r.w, r.h); ctx.fill(); ctx.stroke();
    if (foco && s < 0) { ctx.setLineDash([5, 4]); ctx.strokeStyle = P.acento; ctx.lineWidth = 1.5; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12); else ctx.rect(r.x - 3, r.y - 3, r.w + 6, r.h + 6); ctx.stroke(); ctx.setLineDash([]); }
    var peq = r.h < 90;
    ctx.fillStyle = P.suave; ctx.font = '700 ' + (peq ? 9.5 : 11.5) + 'px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(i + 1), r.x + 6, r.y + (peq ? 12 : 16));
    if (s >= 0) {   // o selo A / B
      var rr = peq ? 7 : 11, cx = r.x + r.w - rr - 5, cy = r.y + rr + 5;
      ctx.fillStyle = P.acento; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.fundo; ctx.font = '800 ' + (peq ? 9 : 12) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s === 0 ? 'A' : 'B', cx, cy + 0.5);
    }
    if (!e) { ctx.fillStyle = P.suave; ctx.font = '500 ' + (peq ? 10 : 13) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('vazio', r.x + r.w / 2, r.y + r.h / 2); ctx.restore(); return; }
    // rodapé: a fórmula (sempre) e o nome (se couber e se os motores souberem)
    var rod = peq ? 14 : (e.nome && r.h > 140 ? 40 : 24);
    ctx.fillStyle = P.texto; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.font = '600 ' + (peq ? 9.5 : 13) + 'px system-ui, sans-serif'; ctx.fillText(e.formula, r.x + r.w / 2, r.y + r.h - (peq ? 5 : (rod > 24 ? 22 : 8)));
    if (!peq && e.nome && r.h > 140) {
      ctx.fillStyle = P.suave; ctx.font = '500 11.5px system-ui, sans-serif';
      var nm = e.nome; while (ctx.measureText(nm).width > r.w - 16 && nm.length > 4) nm = nm.slice(0, -2) + '…';
      ctx.fillText(nm, r.x + r.w / 2, r.y + r.h - 7);
    }
    var area = { x: r.x + 8, y: r.y + (peq ? 14 : 22), w: r.w - 16, h: r.h - (peq ? 14 : 22) - rod };
    // o desenho com os rótulos (CH3, OH) só quando a molécula cabe numa escala legível; senão, as linhas
    var L = this._limites(e), escala = Math.min(80, (area.w - 70) / Math.max(1, L.maxX - L.minX), (area.h - 40) / Math.max(1, L.maxY - L.minY));
    if (r.h >= 150) this._estrutura(ctx, e, area, P); else this._miniatura(ctx, e, area, P);
    ctx.restore();
  }

  _limites(e) { var ids = Object.keys(e.pos), xs = ids.map(function (id) { return e.pos[id].x; }), ys = ids.map(function (id) { return e.pos[id].y; }); return { ids: ids, minX: Math.min.apply(null, xs), maxX: Math.max.apply(null, xs), minY: Math.min.apply(null, ys), maxY: Math.max.apply(null, ys) }; }

  /* ══ AS REPRESENTAÇÕES DOS CARTÕES: as seis do Módulo 1 do SIQC (representacoes.js) ══════
     condensada (rótulos CH3…), completa (todos os H), em linha, Lewis, esfera e bastão (3D),
     compacto (3D). A MESMA representação em todos os cartões, grandes e pequenos. */
  _hAbs(e) {                                           // os H (posições no referencial de e.pos): o modelo de Lewis do SIQC
    var chave = (e.versao || 0) + '|' + e.canonica;
    if (e._chaveH !== chave) {
      var ph = Q3.Lewis.posicoesH(e.g, function (id) { return e.pos[id]; }, 0.72), out = {};
      Object.keys(ph).forEach(function (id) { out[id] = ph[id].map(function (h) { return { x: e.pos[id].x + Math.cos(h.ang) * h.comp, y: e.pos[id].y + Math.sin(h.ang) * h.comp }; }); });
      e._H = out; e._chaveH = chave;
    }
    return e._H;
  }
  _mol3(e) {                                           // a molécula no espaço, com as cunhas do espaço impostas (o R/S escolhido)
    var chave = (e.versao || 0) + '|' + JSON.stringify(e.cunhas || {});
    if (e._chave3 !== chave) {
      e.g.ligacoes.forEach(function (l) { delete l.estereo; });
      Object.keys(e.cunhas || {}).forEach(function (c) { var cu = e.cunhas[c], l = e.g.ligacao(c, cu.viz); if (l) l.estereo = { de: c, tipo: cu.z > 0 ? 'frente' : 'tras' }; });
      e._m3 = Q3.Geometria3D.embutir(e.g, e.pos, { tensao: false });
      e._est = Q3.Geometria3D.estereo(e.g, e._m3);
      e._chave3 = chave;
    }
    return e._m3;
  }
  _ehTres() { return !!Q3.Representacoes.vista(this.vista).tresD; }

  /* desenha a vista escolhida na área a; devolve T (átomo → tela) e HT (os H na tela) para as camadas
     de cima. o.tf(p, dono): transformação das posições (o giro da tela e o da dupla, no Módulo 2);
     o.antes(T, HT, fonte): desenhado ANTES da molécula (os realces); o.mexer(): ajuste temporário do
     grafo durante o desenho (devolve quem desfaz); o.comEstereo: as cunhas (Módulo 2) */
  _desenharVista(ctx, e, a, P, o) {
    o = o || {};
    var R = Q3.Representacoes, vista = this.vista || 'completa', g = e.g, ids = g.pesados(), self = this;
    if (R.vista(vista).tresD) { this._desenhar3DCartao(ctx, e, a, P, vista); return { T: null, HT: {}, esc: 0, fonte: 12 }; }
    var tf = o.tf || function (p) { return p; }, posD = {};
    ids.forEach(function (id) { posD[id] = tf(e.pos[id], id); });
    var comH = vista === 'completa' || vista === 'lewis', Habs = {};
    if (comH || o.precisaH) { var h0 = this._hAbs(e); Object.keys(h0).forEach(function (id) { Habs[id] = h0[id].map(function (q) { return tf(q, id); }); }); }
    var xs = [], ys = [];
    ids.forEach(function (id) { xs.push(posD[id].x); ys.push(posD[id].y); if (comH) (Habs[id] || []).forEach(function (q) { xs.push(q.x); ys.push(q.y); }); });
    var marg = (o.mini ? 0.32 : 0.62) + (o.mini ? 0 : R.margemExtra(vista)) + (vista === 'condensada' ? 0.35 : 0);
    var minX = Math.min.apply(null, xs) - marg, maxX = Math.max.apply(null, xs) + marg, minY = Math.min.apply(null, ys) - marg, maxY = Math.max.apply(null, ys) + marg;
    var esc = Math.min(o.cap || (o.mini ? 34 : 84), a.w / Math.max(0.6, maxX - minX), a.h / Math.max(0.6, maxY - minY));
    var ox = a.x + a.w / 2 - (minX + maxX) / 2 * esc, oy = a.y + a.h / 2 - (minY + maxY) / 2 * esc;
    var Tm = {}; ids.forEach(function (id) { Tm[id] = { x: ox + posD[id].x * esc, y: oy + posD[id].y * esc }; });
    var T = function (id) { return Tm[id]; }, HT = {};
    Object.keys(Habs).forEach(function (id) { HT[id] = Habs[id].map(function (q) { return { x: ox + q.x * esc, y: oy + q.y * esc }; }); });
    var fonte = Math.max(o.mini ? 5.5 : 10, Math.min(21, Math.round(esc * 0.26)));
    if (o.antes) o.antes(T, HT, fonte, esc);
    var comEst = o.comEstereo !== undefined ? o.comEstereo : !!e.und;
    if (comEst && vista !== 'condensada') this._mol3(e);          // a molécula 3D ANTES de qualquer ajuste temporário do grafo
    var desfaz = o.mexer ? o.mexer() : null;
    if (vista === 'condensada') this._condensada(ctx, e, T, P, esc, fonte, comEst);
    else {
      var posH = {};
      if (comH) Object.keys(HT).forEach(function (id) { var p = Tm[id]; posH[id] = HT[id].map(function (q) { return { ang: Math.atan2(q.y - p.y, q.x - p.x), comp: Math.hypot(q.x - p.x, q.y - p.y) / esc }; }); });
      R.desenharPlana(ctx, vista, { g: g, T: T, esc: esc, cores: P, aneis: Q3.Geometria.aneisMinimos(g), estereo: comEst ? e._est : { ligacoes: {}, hidrogenios: {} }, posH: comH ? posH : null, fonte: fonte });
    }
    if (desfaz) desfaz();
    return { T: T, Tm: Tm, HT: HT, esc: esc, fonte: fonte };
  }
  /* a condensada: os rótulos (CH3, CH2, OH…) e, no Módulo 2, as cunhas do espaço */
  _condensada(ctx, e, T, P, esc, fonte, comEst) {
    var g = e.g, D = Q3.Desenho, self = this, margem = {}, ids = g.pesados();
    ids.forEach(function (id) { margem[id] = D.medirRotulo(ctx, D.rotulo(g, id), fonte); });
    g.ligacoes.forEach(function (l) {
      var cu = comEst ? self._cunhaDe(e, l) : null;
      if (cu) { self._traco(ctx, T(cu.de), cu.de === l.a ? T(l.b) : T(l.a), cu.z, P.texto, Math.max(2.5, esc * 0.07)); return; }
      D.ligacao(ctx, T(l.a), T(l.b), l.ordem, margem[l.a], margem[l.b], { cor: P.texto, largura: Math.max(1.2, Math.min(2.4, esc * 0.035)) });
    });
    ids.forEach(function (id) { var el = g.atomos[id].el; D.atomo(ctx, T(id), D.rotulo(g, id), fonte, P, { corTexto: P.elementos[el] || P.texto }); });
  }
  /* a vista espacial dentro do cartão: o desenho 3D do SIQC (que reserva 72 px em cima e 96 embaixo
     para os textos do editor) deslocado e recortado para que a área útil seja exatamente a do cartão */
  _desenhar3DCartao(ctx, e, a, P, vista) {
    var mol = this._mol3(e), cam = e._cam3 || (e._cam3 = new OrbitCamera());
    ctx.save(); ctx.beginPath(); ctx.rect(a.x, a.y, a.w, a.h); ctx.clip();
    ctx.translate(a.x, a.y - 72);
    e._r3 = Q3.Representacoes.desenhar3D(ctx, vista, { mol: mol, cam: cam, W: a.w, H: a.h + 168, claro: P.claro, contraste: document.body.classList.contains('high-contrast'), centro: null, nuvens: [], tensao: false, idealCentro: 0 });
    ctx.restore();
  }
  _cunhaDe(e, l) { if (!e.cunhas) return null; for (var c in e.cunhas) { var cu = e.cunhas[c]; if ((l.a === c && l.b === cu.viz) || (l.b === c && l.a === cu.viz)) return { de: c, z: cu.z }; } return null; }
  _traco(ctx, p, q, z, cor, larg) {                           // cunha cheia (z>0) ou tracejada (z<0), do centro para o ligante
    var dx = q.x - p.x, dy = q.y - p.y, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n, w = larg;
    ctx.save(); ctx.fillStyle = cor; ctx.strokeStyle = cor;
    if (z > 0) { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x + nx * w, q.y + ny * w); ctx.lineTo(q.x - nx * w, q.y - ny * w); ctx.closePath(); ctx.fill(); }
    else { ctx.lineWidth = Math.max(1, larg * 0.28); for (var t = 0.15; t <= 1.001; t += 0.14) { var mx = p.x + dx * t, my = p.y + dy * t, ww = w * t; ctx.beginPath(); ctx.moveTo(mx + nx * ww, my + ny * ww); ctx.lineTo(mx - nx * ww, my - ny * ww); ctx.stroke(); } }
    ctx.restore();
  }
  _miniatura(ctx, e, a, P) { this._desenharVista(ctx, e, a, P, { mini: true }); }
  _estrutura(ctx, e, a, P) { this._desenharVista(ctx, e, a, P, { mini: false }); }

  /* girar a molécula no cartão grande, nas vistas espaciais (arrastar) */
  _ligarOrbita() {
    if (this._orbitaLigada) return; this._orbitaLigada = true;
    var self = this, cv = document.getElementById('sim-canvas'); if (!cv) return;
    var ponto = function (ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left - (cv.cenaX || 0), y: ev.clientY - r.top }; }   // na cena (a área livre do card flutuante);
    cv.addEventListener('pointerdown', function (ev) {
      if (!self.ativo || self.fonte !== 'bancada' || !self._ehTres() || self.sel.length !== 1) return;
      var r = self.rects[self.sel[0]], p = ponto(ev);
      if (r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) { self._orbita = p; self._girouOrbita = false; }
    });
    cv.addEventListener('pointermove', function (ev) {
      if (!self._orbita) return; var p = ponto(ev), e = self.espacos[self.sel[0]];
      if (e && e._cam3) { e._cam3.arrastar(p.x - self._orbita.x, p.y - self._orbita.y); if (Math.abs(p.x - self._orbita.x) + Math.abs(p.y - self._orbita.y) > 2) self._girouOrbita = true; }
      self._orbita = p;
    });
    var fim = function () { self._orbita = null; };
    cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
  }

  /* ══ O PAINEL ══════════════════════════════════════════════════ */
  _ligarPainel() {
    if (this._painelLigado) return; this._painelLigado = true;
    var self = this, campo = document.getElementById('bi-estrutural');
    if (campo) {
      campo.addEventListener('input', function () { var v = campo.value, pos = campo.selectionStart || v.length; if (v.indexOf('-=') < 0) return; var a = v.slice(0, pos).replace(/-=/g, '≡').length; campo.value = v.replace(/-=/g, '≡'); try { campo.setSelectionRange(a, a); } catch (e) {} });
      document.querySelectorAll('#panel-bi-bancada .nm-simbolo').forEach(function (b) {
        b.addEventListener('click', function () { if (!self.ativo) return; var sb = b.dataset.simbolo, ini = campo.selectionStart != null ? campo.selectionStart : campo.value.length, fim = campo.selectionEnd != null ? campo.selectionEnd : ini;
          campo.value = campo.value.slice(0, ini) + sb + campo.value.slice(fim); campo.focus(); try { campo.setSelectionRange(ini + sb.length, ini + sb.length); } catch (e) {} });
      });
    }
    [['bi-molecular', 'bi-gerar'], ['bi-estrutural', 'bi-por']].forEach(function (par) {
      var el = document.getElementById(par[0]); if (el) el.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && self.ativo) { ev.preventDefault(); self.acao(par[1]); } });
    });
  }

  _sincronizarPainel() {
    var self = this, set = function (id, t) { var el = document.getElementById(id); if (el) el.textContent = t; };
    set('bi-nota', this.erro || this.nota || '');
    var d = this._destino();
    set('bi-rotulo-destino', 'Fórmula estrutural' + (d >= 0 ? ' → espaço ' + (d + 1) : ''));
    set('bi-selecao', 'A: ' + (this.sel[0] != null ? 'espaço ' + (this.sel[0] + 1) : '—') + ' · B: ' + (this.sel[1] != null ? 'espaço ' + (this.sel[1] + 1) : '—'));
    var bc = document.querySelector('[data-action="bi-comparar"]'); if (bc) bc.disabled = this.sel.length !== 2;
    var box = document.getElementById('bi-dados');
    if (box) {
      var v = this.veredito; box.hidden = !v;
      if (v) {
        var r = v.r, A = this.espacos[v.a], B = this.espacos[v.b];
        var titulo = r.titulo || (r.veredito === 'formulas' ? 'Fórmulas diferentes' : r.veredito === 'mesma' ? 'Mesma molécula' : 'Isômeros de ' + r.subtipo);
        if (r.veredito === 'isomeros' && r.subtipo === 'tautomeria') titulo = 'Tautômeros';
        if (r.veredito === 'isomeros' && r.subtipo === 'metameria') titulo = 'Isômeros por metameria';
        box.innerHTML = '<p class="bi-veredito">' + titulo + '</p>' +
          '<p class="hint-text bi-par"><strong>A</strong> (espaço ' + (v.a + 1) + '): ' + A.formula + (A.nome ? ' · ' + A.nome : '') + '<br><strong>B</strong> (espaço ' + (v.b + 1) + '): ' + B.formula + (B.nome ? ' · ' + B.nome : '') + '</p>';
      }
    }
  }

  resultados() {
    var self = this, l = [{ l: 'Na bancada', v: this.espacos.filter(Boolean).length + ' de ' + BI_ESPACOS }];
    this.sel.forEach(function (i, k) { var e = self.espacos[i]; l.push({ l: (k ? 'B' : 'A') + ' (espaço ' + (i + 1) + ')', v: e ? e.formula + (e.nome ? ' · ' + e.nome : '') : 'vazio' }); });
    if (this.veredito) l.push({ l: 'Veredito', v: this.veredito.r.veredito === 'isomeros' ? 'isômeros de ' + this.veredito.r.subtipo : this.veredito.r.veredito === 'mesma' ? 'mesma molécula' : 'fórmulas diferentes' });
    return l;
  }
  overlay() { return this.fonte === 'desenhar' ? 'Constitucional · desenho' : 'Constitucional'; }
}
