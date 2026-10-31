/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/bancada-isomeria.js
   ───────────────────────────────────────────────────────────────
   SIIS — MÓDULO 1: ISOMERIA CONSTITUCIONAL.

   A BANCADA: 10 espaços (pedido do professor). O ARRANJO muda com a
   SELEÇÃO, com transição animada, para estudar cada estrutura:
     · nenhum selecionado → os 10 em grade;
     · um → ele grande no centro; os outros numa doca no alto (numa
       cena baixa e larga, o celular deitado, a doca vai para a esquerda);
     · dois → A e B lado a lado, grandes (um sobre o outro em tela
       estreita), prontos para o Comparar.
   Tocar de novo num espaço o solta.

   ENTRADAS: a fórmula molecular, em REMESSAS (cada toque em Gerar troca
   os isômeros gerados pelos próximos, sem repetir até todos aparecerem;
   as estruturas que o aluno digitou ou desenhou ficam); a fórmula
   estrutural digitada (a tripla: -= vira ≡); o desenho no editor do
   SIQC.

   COMPARAR (dois selecionados): fórmulas diferentes · mesma molécula ·
   isômeros com o tipo (tautomeria, função, metameria, posição, cadeia).
   O veredito só aparece DEPOIS do Comparar (especificação) e some
   quando a seleção muda.

   A CENA FICA SÓ COM O DESENHO (regra do projeto): os cartões não têm
   número, fórmula, nome nem a palavra "vazio". Ficam o desenho, o selo
   A / B dos selecionados (é ele que liga a cena aos Resultados) e, no
   espaço livre, um contorno tracejado com um + claro. Em Resultados:
   a fórmula molecular da bancada (antes escrita em cada cartão), a
   contagem de isômeros, a fórmula e o nome de A e de B, o veredito
   e, no alto, o retorno (a explicação do veredito) e o próximo passo.

   O NÍVEL DE DETALHE de cada cartão: a representação escolhida quando
   os rótulos dela ficam legíveis no tamanho do cartão; num cartão
   pequeno (a doca, a grade do celular), o ESQUELETO — as ligações, os
   heteroátomos com a letra e as cunhas, sem os H (que ali eram só
   ruído, letras de 5 px). O cartão cresce e a representação volta.
═══════════════════════════════════════════════════════════════ */

'use strict';

var BI_ESPACOS = 10;
/* a menor escala (px por ligação) em que os rótulos de cada representação se leem: abaixo dela, a miniatura.
   A fonte dos rótulos nunca fica abaixo de 10 px; numa ligação curta, sobra pouco traço entre as letras. Na
   fórmula em linha só os heteroátomos têm letra; na completa e na de Lewis, cada H é um rótulo (o traço C–H
   precisa de uns 8 px à vista); na condensada, o CH₂ ocupa uns 17 px, e a ligação entre dois deles, mais. */
var BI_ESC_LEGIVEL = { linha: 12, completa: 20, lewis: 22, condensada: 25 };
/* a folga em volta do desenho, em comprimentos de ligação: os H já entram no enquadramento (na completa e na de
   Lewis), então basta meia letra; a condensada precisa de meio CH₃ para os lados. No cartão, a folga do editor
   (0,62 + 0,95 na completa) deixava o desenho com metade do tamanho que cabia. */
function biMargem(vista) { return vista === 'condensada' ? 0.95 : vista === 'completa' || vista === 'lewis' ? 0.85 : 0.5; }
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
  desativar() { this.ativo = false; this.editor.desativar(); this._mostrarFonte(); delete document.body.dataset.bancada; }
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
  /* a seleção mudou: o veredito e o aviso de erro eram do passo anterior */
  _mudouSelecao() { this.veredito = null; this.erro = null; this._sincronizarPainel(); }
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
    if (!livres.length) { this.erro = 'Sem espaço livre: esvazie algum.'; announce(this.erro); this._sincronizarPainel(); return true; }
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
    // a contagem, dita em Resultados: quantos isômeros a fórmula tem e quantos já vieram (o recorte, até 50, fica dito)
    this.nota = !N ? 'nenhum' : (r.recortado ? 'os ' + N + ' mais estudados, de ' + r.possiveis : String(N)) +
                (!N ? '' : cabem ? (N === 1 ? ' — na bancada' : ' — todos na bancada') : ' — já vieram ' + Math.min(vistos, N) + '; Gerar traz os próximos');
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
    /* o alto (abaixo da pílula do modo) e as margens vêm da moldura da cena (ui/moldura-cena.js), a mesma conta
       do SIQC e do SIFO: o HTML que cobre o canvas tem um lugar só, dito num arquivo só */
    var L = typeof Q3 !== 'undefined' && Q3.Moldura ? Q3.Moldura.livre(W, H, false) : { x: 16, y: 58 };
    var alvos = [], topo = L.y, m = L.x, gap = 10, baixo = 34, sel = this.sel;   // baixo: a legenda de teclado do canvas
    if (typeof ehCelular === 'function' ? ehCelular() : typeof window !== 'undefined' && window.innerWidth <= 900) baixo = 12;   // no celular essa legenda sai com o modo ativo: a altura volta para as caixas
    if (!sel.length) {
      // numa cena baixa e larga (celular deitado), cinco colunas: duas fileiras em vez de três, caixas mais altas
      var cols = W >= 640 || (W >= 520 && H < 460) ? 5 : W >= 430 ? 4 : 2;
      /* numa cena ALTA (o tablet em pé), duas colunas de cinco: as cinco colunas deixavam cartões estreitos e
         metade da altura vazia. Vale a que dá o maior desenho para uma molécula típica (deitada, 1,6 : 1). */
      var tam = function (c) { var r = Math.ceil(BI_ESPACOS / c), w0 = (W - 2 * m - (c - 1) * gap) / c, h0 = Math.min((H - topo - baixo - (r - 1) * gap) / r, w0 * 1.15); return Math.min((w0 - 20) / 1.6, h0 - 20); };
      if (cols !== 2 && tam(2) > 1.25 * tam(cols)) cols = 2;
      var rows = Math.ceil(BI_ESPACOS / cols);
      var w = (W - 2 * m - (cols - 1) * gap) / cols, h = Math.min((H - topo - baixo - (rows - 1) * gap) / rows, w * 1.15);
      var y0 = topo + Math.max(0, (H - topo - baixo - (rows * h + (rows - 1) * gap)) / 2);
      for (var i = 0; i < BI_ESPACOS; i++) alvos.push({ x: m + (i % cols) * (w + gap), y: y0 + Math.floor(i / cols) * (h + gap), w: w, h: h });
      return alvos;
    }
    var doca = []; for (var j = 0; j < BI_ESPACOS; j++) if (sel.indexOf(j) < 0) doca.push(j);
    var dg = 6;
    /* CENA BAIXA E LARGA (o celular deitado): a doca vai para a ESQUERDA, em colunas. No alto, ela comia um terço
       da altura, e a estrutura grande ficava com a metade do tamanho que cabe. */
    if (H < 360 && W >= 560) {
      var hDisp = H - topo - baixo, linL = Math.max(1, Math.floor((hDisp + dg) / (40 + dg))), colL = Math.ceil(doca.length / linL);
      linL = Math.ceil(doca.length / colL);
      var dhL = Math.min(64, (hDisp - (linL - 1) * dg) / linL), dwL = Math.min(72, dhL * 1.15);
      doca.forEach(function (idx, k) { alvos[idx] = { x: m + Math.floor(k / linL) * (dwL + dg), y: topo + (k % linL) * (dhL + dg), w: dwL, h: dhL }; });
      var xG = m + colL * (dwL + dg) + 8, wDisp = W - xG - m;
      if (sel.length === 1) alvos[sel[0]] = { x: xG, y: topo, w: wDisp, h: hDisp };
      else { var wL = (wDisp - gap) / 2; alvos[sel[0]] = { x: xG, y: topo, w: wL, h: hDisp }; alvos[sel[1]] = { x: xG + wL + gap, y: topo, w: wL, h: hDisp }; }
      return alvos;
    }
    var dw = Math.min(70, (W - 2 * m - (doca.length - 1) * dg) / doca.length), linhas = 1;
    if (dw < 46) { linhas = 2; dw = Math.min(70, (W - 2 * m - (Math.ceil(doca.length / 2) - 1) * dg) / Math.ceil(doca.length / 2)); }
    var dh = Math.max(48, Math.min(64, dw * 0.95));
    /* cena muito baixa e estreita: se a doca em duas fileiras deixa a estrutura grande com menos de 90 px, ela
       volta a uma fileira só, de miniaturas menores (o esqueleto ainda se reconhece com 26 px) */
    if (linhas === 2 && H - (topo + 2 * (dh + dg) + 14) - baixo < 90) { linhas = 1; dw = (W - 2 * m - (doca.length - 1) * dg) / doca.length; dh = Math.max(26, Math.min(48, dw * 0.95)); }
    var porLinha = Math.ceil(doca.length / linhas);
    doca.forEach(function (idx, k) {
      var lin = Math.floor(k / porLinha), col = k % porLinha, nesta = Math.min(porLinha, doca.length - lin * porLinha);
      var x0 = (W - (nesta * dw + (nesta - 1) * dg)) / 2;
      alvos[idx] = { x: x0 + col * (dw + dg), y: topo + lin * (dh + dg), w: dw, h: dh };
    });
    var yG = topo + linhas * (dh + dg) + 14, hG = H - yG - baixo;
    if (sel.length === 1) { var wG = Math.min(W - 2 * m, 760); alvos[sel[0]] = { x: (W - wG) / 2, y: yG, w: wG, h: hG }; }
    else if (W >= 600 || (hG - gap) / 2 < 70) { var w2 = Math.min((W - 2 * m - gap) / 2, 560), x2 = (W - (2 * w2 + gap)) / 2; alvos[sel[0]] = { x: x2, y: yG, w: w2, h: hG }; alvos[sel[1]] = { x: x2 + w2 + gap, y: yG, w: w2, h: hG }; }   // numa cena baixa, lado a lado mesmo estreita
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
    this._lod = this._nivelDetalhe(W, H, alvos);
    // os pequenos primeiro, os grandes por cima
    var ordem = []; for (var k = 0; k < BI_ESPACOS; k++) ordem.push(k);
    ordem.sort(function (x, y) { return self.rects[x].w * self.rects[x].h - self.rects[y].w * self.rects[y].h; });
    ordem.forEach(function (idx) { self._cartao(ctx, idx, self.rects[idx], P); });
  }

  /* UM CARTÃO: só o desenho. O contorno diz o estado — selecionado (traço cheio, na cor de destaque, com o
     selo A ou B), em foco pelo teclado (tracejado por fora), livre (tracejado, com um + claro no meio). */
  _cartao(ctx, i, r, P) {
    var e = this.espacos[i], s = this.sel.indexOf(i), foco = i === this.foco;
    var caixa = function (x, y, w, h, raio) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, raio); else ctx.rect(x, y, w, h); };
    ctx.save();
    if (e) { ctx.fillStyle = biRgba(P.painel, 0.95); ctx.strokeStyle = s >= 0 ? P.acento : biRgba(P.suave, 0.45); ctx.lineWidth = s >= 0 ? 3 : 1; }
    else { ctx.fillStyle = biRgba(P.painel, 0.4); ctx.strokeStyle = s >= 0 ? P.acento : biRgba(P.suave, 0.5); ctx.lineWidth = s >= 0 ? 2.5 : 1.2; ctx.setLineDash([6, 5]); }
    caixa(r.x, r.y, r.w, r.h, 10); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
    if (foco && s < 0) { ctx.setLineDash([5, 4]); ctx.strokeStyle = P.acento; ctx.lineWidth = 1.5; caixa(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 12); ctx.stroke(); ctx.setLineDash([]); }
    var peq = r.h < 90;
    if (s >= 0) {   // o selo A / B: é ele que liga o cartão às linhas A e B dos Resultados
      var rr = peq ? 7 : 11, cx = r.x + r.w - rr - 5, cy = r.y + rr + 5;
      ctx.fillStyle = P.acento; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.fundo; ctx.font = '800 ' + (peq ? 9 : 12) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s === 0 ? 'A' : 'B', cx, cy + 0.5);
    }
    if (!e) {         // o espaço livre: um + bem claro, do tamanho do cartão
      var mx = r.x + r.w / 2, my = r.y + r.h / 2, b = Math.max(5, Math.min(12, Math.min(r.w, r.h) * 0.12));
      ctx.strokeStyle = biRgba(P.suave, 0.55); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(mx - b, my); ctx.lineTo(mx + b, my); ctx.moveTo(mx, my - b); ctx.lineTo(mx, my + b); ctx.stroke();
      ctx.restore(); return;
    }
    var area = this._areaDe(r, s >= 0);
    if (this._lod ? this._lod[s >= 0 ? 'sel' : 'resto'] : this._detalhado(e, area, i)) this._estrutura(ctx, e, area, P); else this._miniatura(ctx, e, area, P);
    ctx.restore();
  }
  /* a área do desenho dentro do cartão (no selecionado, abaixo do selo A / B) */
  _areaDe(r, selecionado) {
    var peq = r.h < 90, lado = peq ? 5 : 10, topo = selecionado ? 2 * (peq ? 7 : 11) + 8 : lado;
    return { x: r.x + lado, y: r.y + topo, w: r.w - 2 * lado, h: r.h - topo - lado };
  }
  /* O NÍVEL DE DETALHE POR FILEIRA: os cartões do mesmo tamanho (a grade, a doca, o par A e B) vão todos com a
     representação escolhida ou todos com o esqueleto, nunca misturados — decidido pelo tamanho FINAL de cada um
     (o da arrumação, não o da animação). Guardado até mudar a tela, a seleção, a vista ou a bancada. */
  _nivelDetalhe(W, H, alvos) {
    var chave = W + 'x' + H + '|' + this.sel.join(',') + '|' + this.vista + '|' + this.espacos.map(function (e) { return e ? e.canonica + ':' + (e.versao || 0) : ''; }).join(',');
    if (this._lodChave === chave) return this._lodVal;
    var ok = { sel: true, resto: true };
    for (var i = 0; i < BI_ESPACOS; i++) {
      var e = this.espacos[i], g = this.sel.indexOf(i) >= 0 ? 'sel' : 'resto';
      if (e && ok[g] && alvos[i] && !this._detalhado(e, this._areaDe(alvos[i], g === 'sel'), i)) ok[g] = false;
    }
    this._lodChave = chave; this._lodVal = ok;
    return ok;
  }

  /* a representação escolhida cabe legível nesta área? (a mesma escala que _desenharVista usaria) */
  _detalhado(e, a) {
    var R = Q3.Representacoes, vista = this.vista || 'completa';
    if (R.vista(vista).tresD) return true;                 // as esferas se leem em qualquer tamanho (a letra só entra quando cabe)
    var ids = e.g.pesados(), comH = vista === 'completa' || vista === 'lewis', Hs = comH ? this._hAbs(e) : null, xs = [], ys = [];
    ids.forEach(function (id) { xs.push(e.pos[id].x); ys.push(e.pos[id].y); if (Hs) (Hs[id] || []).forEach(function (q) { xs.push(q.x); ys.push(q.y); }); });
    var marg = biMargem(vista);
    var esc = Math.min(84, a.w / Math.max(0.6, Math.max.apply(null, xs) - Math.min.apply(null, xs) + 2 * marg),
                           a.h / Math.max(0.6, Math.max.apply(null, ys) - Math.min.apply(null, ys) + 2 * marg));
    return esc >= (BI_ESC_LEGIVEL[vista] || 34);
  }


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
     grafo durante o desenho (devolve quem desfaz); o.comEstereo: as cunhas (Módulo 2); o.cap: a maior
     escala, em px por ligação (84; 120 no cartão em estudo do Módulo 2) */
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
    var marg = biMargem(vista);
    var minX = Math.min.apply(null, xs) - marg, maxX = Math.max.apply(null, xs) + marg, minY = Math.min.apply(null, ys) - marg, maxY = Math.max.apply(null, ys) + marg;
    var esc = Math.min(o.cap || 84, a.w / Math.max(0.6, maxX - minX), a.h / Math.max(0.6, maxY - minY));
    var ox = a.x + a.w / 2 - (minX + maxX) / 2 * esc, oy = a.y + a.h / 2 - (minY + maxY) / 2 * esc;
    var Tm = {}; ids.forEach(function (id) { Tm[id] = { x: ox + posD[id].x * esc, y: oy + posD[id].y * esc }; });
    var T = function (id) { return Tm[id]; }, HT = {};
    Object.keys(Habs).forEach(function (id) { HT[id] = Habs[id].map(function (q) { return { x: ox + q.x * esc, y: oy + q.y * esc }; }); });
    var fonte = Math.max(10, Math.min(21, Math.round(esc * 0.26)));   // nunca abaixo de 10 px: menor que isso, o cartão usa a miniatura
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
  /* A MINIATURA: o esqueleto, como na fórmula em linha — as ligações (dupla e tripla com os traços paralelos),
     os heteroátomos com a letra num disco e, no Módulo 2, as cunhas dos carbonos quirais (sem elas, R e S teriam
     a mesma miniatura; a posição dos ligantes da dupla já mostra cis e trans). Sem os H. Nas vistas espaciais,
     as próprias esferas. */
  _miniatura(ctx, e, a, P) {
    if (this._ehTres()) { this._desenhar3DCartao(ctx, e, a, P, this.vista); return; }
    var g = e.g, ids = g.pesados(), self = this; if (!ids.length) return;
    var xs = ids.map(function (id) { return e.pos[id].x; }), ys = ids.map(function (id) { return e.pos[id].y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var m = 8, s = Math.min(24, (a.w - 2 * m) / Math.max(0.5, maxX - minX), (a.h - 2 * m) / Math.max(0.5, maxY - minY));
    var ox = a.x + a.w / 2 - (minX + maxX) / 2 * s, oy = a.y + a.h / 2 - (minY + maxY) / 2 * s;
    var T = function (id) { return { x: ox + e.pos[id].x * s, y: oy + e.pos[id].y * s }; };
    var cor = biRgba(P.texto, 0.85), larg = s < 14 ? 1.2 : 1.5, sep = s < 14 ? 2 : 2.6;
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = cor; ctx.lineWidth = larg;
    var pesado = function (id) { return g.atomos[id] && g.atomos[id].el !== 'H' && e.pos[id]; };
    g.ligacoes.forEach(function (l) {
      if (!pesado(l.a) || !pesado(l.b)) return;
      var p = T(l.a), q = T(l.b), cu = self._cunhaDe(e, l);
      if (cu) { self._traco(ctx, T(cu.de), cu.de === l.a ? q : p, cu.z, cor, Math.max(2, s * 0.13)); return; }
      var dx = q.x - p.x, dy = q.y - p.y, n = Math.hypot(dx, dy) || 1, nx = -dy / n * sep, ny = dx / n * sep;
      var desl = l.ordem === 2 ? [-0.5, 0.5] : l.ordem === 3 ? [-1, 0, 1] : [0];
      desl.forEach(function (k) { ctx.beginPath(); ctx.moveTo(p.x + nx * k, p.y + ny * k); ctx.lineTo(q.x + nx * k, q.y + ny * k); ctx.stroke(); });
    });
    // os heteroátomos (e um carbono sozinho, sem ligações: o metano) com a letra, num disco da cor do cartão
    var fonte = s < 14 ? 8.5 : 9.5;
    ctx.font = '700 ' + fonte + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ids.forEach(function (id) {
      var el = g.atomos[id].el; if (el === 'C' && g.vizinhos(id).some(function (v) { return pesado(v.id); })) return;
      var p = T(id), rd = el.length > 1 ? fonte * 0.78 : fonte * 0.66;
      ctx.fillStyle = P.painel; ctx.beginPath(); ctx.arc(p.x, p.y, rd, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.elementos[el] || P.texto; ctx.fillText(el, p.x, p.y + 0.5);
    });
    ctx.restore();
  }
  _estrutura(ctx, e, a, P) { this._desenharVista(ctx, e, a, P, {}); }

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

  /* o painel só tem controles: o aviso de erro (junto do campo onde o aluno digitou), o rótulo do campo da
     fórmula estrutural (dizendo quando ela vai TROCAR a estrutura A) e o botão Comparar. O resto mora em
     Resultados. No body, data-bancada ordena os cards na gaveta do celular (ver o CSS). */
  _sincronizarPainel() {
    var set = function (id, t) { var el = document.getElementById(id); if (el && el.textContent !== t) el.textContent = t; };
    set('bi-nota', this.erro || '');
    var d = this._destino();
    set('bi-rotulo-destino', 'Fórmula estrutural' + (d < 0 ? ' (bancada cheia: toque num cartão para trocá-lo)' : this.sel.length === 1 && this.espacos[d] ? ' (vai no lugar da A)' : ''));
    var bc = document.querySelector('[data-action="bi-comparar"]'); if (bc) bc.disabled = this.sel.length !== 2;
    if (this.ativo) document.body.dataset.bancada = this._estadoBancada();
  }
  /* vazia · cheia (nenhum selecionado) · estudo (um) · par (dois) · desenho (no editor) */
  _estadoBancada() {
    if (this.fonte === 'desenhar') return 'desenho';
    if (!this.espacos.some(Boolean)) return 'vazia';
    return this.sel.length === 2 ? 'par' : this.sel.length === 1 ? 'estudo' : 'cheia';
  }

  /* o nome curto do veredito (a linha Veredito e a pílula do modo) */
  _tituloVeredito(r) {
    if (r.titulo) return r.titulo;
    if (r.veredito === 'formulas') return 'Fórmulas diferentes';
    if (r.veredito === 'mesma') return 'Mesma molécula';
    if (r.subtipo === 'tautomeria') return 'Tautômeros';
    if (r.subtipo === 'metameria') return 'Isômeros por metameria';
    return 'Isômeros de ' + r.subtipo;
  }

  /* O RETORNO, no alto dos Resultados: a explicação do veredito (a hierarquia, o que muda entre A e B) */
  retorno() {
    if (this.fonte === 'desenhar' || !this.veredito) return null;
    var r = this.veredito.r;
    return { tipo: 'info', texto: r.texto + (r.nota ? ' ' + r.nota : '') };
  }

  /* O PRÓXIMO PASSO, logo abaixo: o que fazer agora, com o nome do card onde se faz */
  proximoPasso() {
    if (this.fonte === 'desenhar') return this.editor.proximoPasso() + ' Para terminar, toque em Levar o desenho para a bancada, no card Bancada.';   // a dica do editor, antes no pé da cena
    var n = this.espacos.filter(Boolean).length;
    if (!n) return 'Comece pela Bancada: digite uma fórmula molecular (por exemplo, C4H10O) e gere os isômeros, ou ponha uma estrutura sua.';
    if (!this.sel.length) return n === 1 ? 'Toque no cartão para ver a estrutura grande. Para comparar, ponha mais uma estrutura pela Bancada.' : 'Toque num cartão para ver a estrutura grande; toque em dois para compará-los.';
    var A = this.espacos[this.sel[0]], B = this.sel.length === 2 ? this.espacos[this.sel[1]] : null;
    if (this.sel.length === 1) return A ? 'Toque noutro cartão da doca: ele vira a B, ao lado. Tocar de novo na A a solta.' : 'Este espaço está livre: ponha uma estrutura nele pela Bancada, ou toque noutro cartão.';
    if (!A || !B) return 'Um dos dois espaços está livre: toque nele para soltá-lo e escolha um cartão com estrutura.';
    if (!this.veredito) return 'Toque em Comparar A e B, no card Comparar.';
    return 'Para outro par, toque na A ou na B para soltá-la e escolha outro cartão da doca.';
  }

  /* OS RESULTADOS: o que antes vinha escrito nos cartões (a fórmula molecular, o nome) e o veredito curto */
  resultados() {
    if (this.fonte === 'desenhar') return this.editor.resultados();   // desenhando: a ficha do desenho (a fórmula, a cadeia)
    var self = this, cheios = this.espacos.filter(Boolean), l = [{ l: 'Na bancada', v: cheios.length + ' de ' + BI_ESPACOS }];
    if (cheios.length) {
      var fs = []; cheios.forEach(function (e) { if (fs.indexOf(e.formula) < 0) fs.push(e.formula); });
      l.push({ l: fs.length > 1 ? 'Fórmulas moleculares' : 'Fórmula molecular', v: fs.length > 1 ? fs.join(', ') : fs[0] + (cheios.length > 1 ? ' (todas)' : ''), cls: fs.length > 2 ? 'val-texto' : '' });
    }
    if (this.nota && cheios.some(function (e) { return e.origem === 'gerada'; })) l.push({ l: 'Isômeros da fórmula', v: this.nota, cls: this.nota.length > 18 ? 'val-texto' : '' });
    this.sel.forEach(function (i, k) {
      var e = self.espacos[i];
      l.push({ l: k ? 'B' : 'A', v: e ? e.formula + (e.nome ? ' · ' + e.nome : '') : 'espaço livre', cls: 'val-texto' });
    });
    if (this.veredito) l.push({ l: 'Veredito', v: this._tituloVeredito(this.veredito.r), cls: 'val-texto' });
    return l;
  }
  overlay() {
    if (this.fonte === 'desenhar') return 'desenho no editor';
    if (this.veredito) return this._tituloVeredito(this.veredito.r).toLowerCase();
    var n = this.espacos.filter(Boolean).length;
    return this.sel.length === 2 ? 'A e B' : this.sel.length === 1 ? 'estrutura A' : n ? n + ' na bancada' : 'bancada vazia';
  }
}
