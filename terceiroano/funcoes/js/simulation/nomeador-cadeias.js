/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/nomeador-cadeias.js
   ───────────────────────────────────────────────────────────────
   MÓDULO 2 — NOMENCLATURA (SIFO). Caminho B da especificação: o nome
   sai da ESTRUTURA, nunca de peças soltas.

   A BANCADA: 8 espaços. Duas caixas de entrada:
     · fórmula molecular (C4H10O), fixa fora da grade: enche os espaços
       com os isômeros DENTRO DO ESCOPO (Q3.Nomenclatura.isomeros);
     · fórmula estrutural do espaço selecionado (CH3-CH(OH)-CH3) — ou o
       desenho no editor herdado do SIQC.

   PREVER → REVELAR (princípio do projeto: sem pistas, pontuação, nova
   tentativa guiada ou celebração). As peças do nome — ramificação,
   halogênio, cadeia, ligações, função, e os localizadores — são a
   PREVISÃO, opcional; o nome se forma ao vivo. Revelar mostra o nome
   calculado nas três formas, a cadeia principal destacada e numerada,
   e as peças LADO A LADO ("=" ou "≠"), cada uma com a regra que a
   decide. Fora do escopo, o motivo (com dois grupos, a estrutura fica fora).

   Tudo o que o módulo diz sai de Q3.Nomenclatura (núcleo).
═══════════════════════════════════════════════════════════════ */

'use strict';

var NM_ESPACOS = 8;

function nmRgba(hex, a) {
  var h = String(hex).replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
  var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

class NomeadorCadeias {
  constructor(D) {
    this.D = D;
    this.ativo = false;
    this.t = 0;
    this.fonte = 'bancada';                 // 'bancada' · 'desenhar'
    this.editor = new EditorCadeias(D);     // o desenho: o editor do SIQC
    this.reiniciar(true);
    this._ligarPonteiro();
  }

  _previsaoVazia() { return { ramo: '', ramoLoc: '', hal: '', halLoc: '', alcoxi: '', alcoxiLoc: '', prefixo: '', infixo: '', insatLoc: '', sufixo: '', grupoLoc: '',
                              esterAlq: '', haleto: '', anidrido2: '', n1: '', n2: '', anel: '' }; }

  /* a troca de módulo LIMPA o que sai */
  reiniciar(inicio) {
    this.espacos = []; for (var i = 0; i < NM_ESPACOS; i++) this.espacos.push(null);
    this.sel = 0; this.nota = null; this.erro = null; this._ciclo = null; this.contador = '';
    this.fonte = 'bancada'; this.foco = null;
    if (!inicio) {
      this.editor.reiniciar(); this.editor.desativar();
      ['nm-molecular', 'nm-estrutural'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      document.querySelectorAll('#body-nome select').forEach(function (s) { s.value = ''; });
      this._mostrarFonte(); this._sincronizarPainel();
    }
  }

  ativar() {
    this.ativo = true;
    var cv = document.getElementById('sim-canvas'); if (cv) cv.style.touchAction = 'none';
    this._ligarPainel();
    if (this.fonte === 'desenhar') this.editor.ativar();
    this._mostrarFonte(); this._sincronizarPainel();
  }
  desativar() { this.ativo = false; this.editor.desativar(); this._mostrarFonte(); }
  atualizar(dt) { this.t += dt; if (this.fonte === 'desenhar') this.editor.atualizar(dt); }

  /* ══ A BANCADA ═════════════════════════════════════════════════ */

  _espaco(g, origem) {
    return { g: g, origem: origem, pos: this._horizontal(Q3.Geometria.layout(g)),
             formula: g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); }),
             prev: this._previsaoVazia(),   // a previsão DESTE espaço (as peças)
             estado: 'aberto',              // aberto · certo · rever · fora
             r: null };                      // o nome calculado (usado na conferência)
  }
  _horizontal(pos) {
    var ids = Object.keys(pos), n = ids.length || 1, mx = 0, my = 0;
    ids.forEach(function (id) { mx += pos[id].x / n; my += pos[id].y / n; });
    var sxx = 0, syy = 0, sxy = 0;
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), s = Math.sin(-th), out = {};
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; out[id] = { x: dx * c - dy * s, y: dx * s + dy * c }; });
    return out;
  }
  /* sincroniza os seletores com a previsão do espaço selecionado */
  _novoAlvo() {
    var e = this.espacos[this.sel], prev = e ? e.prev : this._previsaoVazia(), travado = !e || e.estado === 'certo' || e.estado === 'fora';
    document.querySelectorAll('#body-nome select[data-peca]').forEach(function (sl) { sl.value = prev[sl.dataset.peca] || ''; sl.disabled = travado; });
  }

  /* GERAR ISÔMEROS, EM LEVAS. O gerador enumera o conjunto COMPLETO dos
     isômeros do escopo; a bancada percorre esse conjunto numa ordem
     aleatória (permutação de Fisher–Yates):
       · cada toque, com a mesma fórmula, traz os PRÓXIMOS 8;
       · nenhuma estrutura se repete até todas terem aparecido;
       · esgotado o conjunto, começa uma permutação NOVA — e uma leva
         nunca tem a mesma estrutura duas vezes, nem na virada;
       · se o conjunto couber na bancada, cada toque o mostra em outra ordem;
       · fórmula nova recomeça do zero. */
  gerar(texto) {
    var r;
    try { r = Q3.Nomenclatura.isomeros(texto); } catch (e) { this.erro = e.message; announce(e.message); this._sincronizarPainel(); return false; }
    this.erro = null;
    var N = r.estruturas.length;
    if (!this._ciclo || this._ciclo.chave !== r.formula) this._ciclo = { chave: r.formula, lista: r.estruturas, fila: [], leva: 0, vistos: {} , nVistos: 0, todos: {}, voltas: Math.floor(Math.random() * 8) };
    var c = this._ciclo, quantos = Math.min(NM_ESPACOS, N);
    /* uma volta pelo conjunto, com as FUNÇÕES ALTERNADAS (pedido do
       professor): embaralha dentro de cada função e intercala as funções —
       álcool, éter, álcool, éter… —; a função que abre a volta muda a cada
       volta. Com uma função só, é um embaralhamento simples. */
    var embaralhar = function (a) { for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)), t = a[k]; a[k] = a[j]; a[j] = t; } return a; };
    var porFuncao = {};
    c.lista.forEach(function (e, idx) { (porFuncao[e.grupo || '?'] = porFuncao[e.grupo || '?'] || []).push(idx); });
    var funcoes = Object.keys(porFuncao).sort();
    var permutacao = function () {
      var filas = funcoes.map(function (f) { return embaralhar(porFuncao[f].slice()); }), ini = c.voltas++ % funcoes.length, ordem = [];
      while (ordem.length < N) for (var t = 0; t < filas.length; t++) { var fl = filas[(ini + t) % filas.length]; if (fl.length) ordem.push(fl.shift()); }
      return ordem;
    };
    while (c.fila.length < quantos + N) c.fila = c.fila.concat(permutacao());
    // tira os próximos da fila, sem repetir dentro da leva (o repetido volta para a frente da fila)
    var leva = [], adiados = [];
    while (leva.length < quantos && c.fila.length) {
      var k = c.fila.shift();
      if (leva.indexOf(k) >= 0) adiados.push(k); else leva.push(k);
    }
    c.fila = adiados.concat(c.fila);
    c.leva++;
    // cobertura do conjunto: quantos já apareceram nesta volta
    var fechou = false;
    leva.forEach(function (k) {
      if (c.vistos[k]) { c.vistos = {}; c.nVistos = 0; }      // começou uma volta nova
      c.vistos[k] = 1; c.nVistos++; c.todos[k] = 1;
      if (c.nVistos === N) fechou = true;                      // a volta se fechou dentro desta leva
    });
    for (var i = 0; i < NM_ESPACOS; i++) this.espacos[i] = i < leva.length ? this._espaco(c.lista[leva[i]].g, 'gerada') : null;
    this.sel = 0; this._novoAlvo();
    // na tela, só o CONTADOR (pedido do professor); o leitor de tela recebe a frase completa
    var vistosAte = Object.keys(c.todos).length;
    this.nota = '';
    this.contador = !N ? 'Nenhum isômero no escopo.' : N <= NM_ESPACOS ? N + (N === 1 ? ' isômero' : ' isômeros') : vistosAte + ' de ' + N + ' isômeros';
    var frase = !N ? this.nota : N <= NM_ESPACOS ? N + ' isômeros dentro do escopo, todos na bancada.' : 'Leva ' + c.leva + ': já apareceram ' + vistosAte + ' de ' + N + ' isômeros.' + (fechou ? ' Todos já apareceram; a próxima leva começa outra ordem.' : '');
    playTone(660, .06, .04);
    announce(frase);
    this._sincronizarPainel();
    return true;
  }


  porFormula(texto) {
    var g;
    try { g = Q3.deFormulaCondensada(texto); } catch (e) { this.erro = e.message; announce(e.message); this._sincronizarPainel(); return false; }
    this.erro = null;
    this.espacos[this.sel] = this._espaco(g, 'digitada'); this._novoAlvo();
    playTone(660, .05, .03);
    announce('Estrutura no espaço ' + (this.sel + 1) + ': ' + this.espacos[this.sel].formula + '.');
    this._sincronizarPainel();
    return true;
  }

  selecionar(i) {
    if (i < 0 || i >= NM_ESPACOS) return false;
    this.sel = i; this._novoAlvo(); this.erro = null;
    var e = this.espacos[i];
    announce('Espaço ' + (i + 1) + (e ? ': ' + e.formula + '.' : ': vazio.'));
    this._sincronizarPainel();
    return true;
  }
  esvaziar() { this.espacos[this.sel] = null; this._novoAlvo(); this._sincronizarPainel(); announce('Espaço ' + (this.sel + 1) + ' esvaziado.'); return true; }

  /* desenho no editor: abre, e "levar" copia a molécula para o espaço */
  abrirDesenho() { this.fonte = 'desenhar'; this.editor.ativar(); this._mostrarFonte(); this._sincronizarPainel(); announce('Desenhe no editor e toque em Levar o desenho para o espaço.'); return true; }
  voltarBancada() { this.fonte = 'bancada'; this.editor.desativar(); this._mostrarFonte(); this._sincronizarPainel(); return true; }
  levarDesenho() {
    var g = this.editor.g.clonar ? this.editor.g.clonar() : this.editor.g;
    if (!g.pesados().length) { announce('O editor está vazio.'); return false; }
    this.espacos[this.sel] = this._espaco(g, 'desenhada'); this._novoAlvo();
    this.voltarBancada();
    announce('Desenho levado para o espaço ' + (this.sel + 1) + '.');
    return true;
  }

  _mostrarFonte() {
    var d = this.fonte === 'desenhar', at = this.ativo;
    var vis = function (id, sim) { var el = document.getElementById(id); if (el) el.hidden = !sim; };
    vis('panel-construcao', at && d); vis('panel-representacao', at && d);
    vis('nm-grupo-desenho', d); vis('nm-grupo-bancada', !d);
  }

  /* ══ A PREVISÃO E A REVELAÇÃO ══════════════════════════════════ */

  definirPeca(k, v) {
    var e = this.espacos[this.sel];
    if (!e || e.estado === 'certo' || e.estado === 'fora' || !(k in e.prev)) return {};
    e.prev[k] = v;
    if (e.estado === 'rever') e.estado = 'aberto';     // mexeu: é uma tentativa nova
    this._sincronizarPainel();
    return {};
  }

  /* o nome que as peças escolhidas formam (a previsão, ao vivo) */
  /* o nome que as peças escolhidas formam (a previsão, ao vivo) */
  /* o nome que as peças escolhidas formam (a previsão, ao vivo) */
  nomePrevisto(prevArg) {
    var e = this.espacos[this.sel], p = prevArg || (e ? e.prev : this._previsaoVazia());
    if (!p.prefixo && !p.sufixo && !p.infixo && !p.ramo && !p.hal && !p.alcoxi && !p.anel) return '';
    var subs = [];
    if (p.hal) subs.push({ n: p.hal, l: p.halLoc });
    if (p.alcoxi) subs.push({ n: p.alcoxi, l: p.alcoxiLoc });
    if (p.ramo) subs.push({ n: p.ramo, l: p.ramoLoc });
    subs.sort(function (a, b) { return a.n < b.n ? -1 : 1; });
    var pre = subs.map(function (s) { return (s.l ? s.l + '-' : '') + s.n; }).join('-');
    var inf = p.infixo || '…', mae = (p.prefixo || '…') + (p.insatLoc && inf !== 'an' ? '-' + p.insatLoc + '-' : '') + inf;
    var suf = p.sufixo, nome;
    // ANÉIS: com nome próprio (benzeno e derivados, heterociclos) ou "ciclo…"
    if (p.anel && p.anel !== 'ciclo') return /^ácido /.test(p.anel) ? 'ácido ' + pre + p.anel.replace(/^ácido /, '') : pre + p.anel;
    if (p.anel === 'ciclo') {
      var bc = Q3.Nomenclatura.ciclo(p.prefixo || '…') + (p.insatLoc && inf !== 'an' ? '-' + p.insatLoc + '-' : '') + inf, nc;
      if (['carbaldeído', 'carboxílico', 'carbonitrila', 'carboxamida'].indexOf(suf) >= 0) nc = bc + 'o' + (p.grupoLoc ? '-' + p.grupoLoc + '-' : '') + suf;
      else if (!suf || suf === 'o') nc = bc + (suf ? 'o' : '…');
      else nc = bc + (p.grupoLoc ? '-' + p.grupoLoc + '-' : '') + suf;
      return (suf === 'carboxílico' ? 'ácido ' : '') + pre + nc;
    }
    if (suf === 'anidrido') {
      var a1 = (p.prefixo || '…') + inf + 'oico', a2 = !p.anidrido2 || p.anidrido2 === 'mesmo' ? null : p.anidrido2 + 'anoico';
      return 'anidrido ' + (a2 ? [a1, a2].sort().join(' ') : a1);
    }
    if (suf === 'oato') return pre + mae + 'oato de ' + (p.esterAlq || '…');
    if (suf === 'oila') return (p.haleto || '…') + ' de ' + pre + mae + 'oíla';
    if (!suf || suf === 'o') nome = mae + (suf ? 'o' : '…');
    else if (suf === 'nitrila') nome = mae + 'onitrila';
    else nome = mae + (p.grupoLoc ? '-' + p.grupoLoc + '-' : '') + suf;
    nome = pre + nome;
    if (suf === 'amina' || suf === 'amida') {
      var ns = [p.n1, p.n2].filter(Boolean).sort();
      nome = (ns.length === 2 && ns[0] === ns[1] ? 'N,N-di' + ns[0] : ns.map(function (x) { return 'N-' + x; }).join('-')) + nome;
    }
    return suf === 'oico' ? 'ácido ' + nome : nome;
  }

  /* CONFERIR AS PREVISÕES (pedido do professor): só depois de prever TODAS
     as estruturas da bancada; a resposta é só "certo" ou "a rever", espaço
     por espaço — SEM dizer o que está errado. O certo ganha o nome no
     cartão; o a rever volta para o aluno refazer e conferir de novo. */
  conferir() {
    var self = this, cheios = [];
    this.espacos.forEach(function (e, i) { if (e) cheios.push(i); });
    if (!cheios.length) { announce('A bancada está vazia: gere isômeros, digite uma fórmula ou desenhe.'); return false; }
    cheios.forEach(function (i) { var e = self.espacos[i]; if (!e.r) e.r = Q3.Nomenclatura.nomear(e.g); if (!e.r.ok) e.estado = 'fora'; });
    var faltam = cheios.filter(function (i) { var e = self.espacos[i]; return e.estado !== 'fora' && e.estado !== 'certo' && !self._completa(e.prev); });
    if (faltam.length) {
      this.nota = 'Faltam previsões: ' + faltam.map(function (i) { return i + 1; }).join(', ') + '.';
      announce('A conferência vem depois da previsão de todas as estruturas. ' + this.nota); this._sincronizarPainel(); return true;
    }
    var certos = [], rever = [];
    cheios.forEach(function (i) {
      var e = self.espacos[i];
      if (e.estado === 'fora') return;
      if (e.estado !== 'certo') e.estado = self._pecasIguais(e.prev, e.r) ? 'certo' : 'rever';
      (e.estado === 'certo' ? certos : rever).push(i + 1);
    });
    playTone(660, .08, .04);
    this.nota = '';   // o resultado está nos cartões: nome e ✓, ou ↺
    announce((certos.length ? 'Nome certo ' + (certos.length === 1 ? 'no espaço ' : 'nos espaços ') + certos.join(', ') + '.' : '') +
      (rever.length ? (certos.length ? ' ' : '') + 'A rever: ' + rever.join(', ') + '.' : ''));
    this._novoAlvo(); this._sincronizarPainel();
    return true;
  }
  _completa(p) { return p.anel && p.anel !== 'ciclo' ? true : !!(p.prefixo && p.infixo && p.sufixo); }   // fenol, piridina…: o nome do anel basta

  /* a previsão bate com o nome calculado, peça por peça (o localizador
     desnecessário vale presente ou ausente) */
  /* a previsão bate com o nome calculado, peça por peça (o localizador
     desnecessário vale presente ou ausente) */
  _pecasIguais(p, r) {
    if (!r || !r.ok) return false;
    var P = r.pecas, inf = P.insaturacao, S = P.sufixo, R = P.ramificacao, X = P.halogenio, A = P.alcoxi;
    var loc = function (peca, escolhido) { return peca && peca.loc ? (String(escolhido) === String(peca.loc) || (!peca.necessario && !escolhido)) : !escolhido; };
    var iguais = function (a, b) { return a.slice().sort().join() === b.slice().sort().join(); };
    var subsOk = (R ? p.ramo === R.nome && loc(R, p.ramoLoc) : !p.ramo) && (X ? p.hal === X.nome && loc(X, p.halLoc) : !p.hal) && (A ? p.alcoxi === A.nome && loc(A, p.alcoxiLoc) : !p.alcoxi);
    if (P.anel || p.anel) {
      if (!P.anel || !p.anel) return false;
      if (P.anel.tipo === 'nomeado') return p.anel === P.anel.nome && subsOk;
      return p.anel === 'ciclo' && p.prefixo === P.prefixo && p.infixo === inf.infixo && (inf.infixo === 'an' || loc(inf, p.insatLoc)) &&
        p.sufixo === S.nome && loc(S, p.grupoLoc) && subsOk;
    }
    if (S.nome !== p.sufixo) return false;
    if (S.nome === 'anidrido') return iguais([p.prefixo, !p.anidrido2 || p.anidrido2 === 'mesmo' ? p.prefixo : p.anidrido2], P.anidrido);
    var base = p.prefixo === P.prefixo &&
      p.infixo === inf.infixo && (inf.infixo === 'an' || loc(inf, p.insatLoc)) && loc(S, p.grupoLoc) &&
      (R ? p.ramo === R.nome && loc(R, p.ramoLoc) : !p.ramo) &&
      (X ? p.hal === X.nome && loc(X, p.halLoc) : !p.hal) &&
      (A ? p.alcoxi === A.nome && loc(A, p.alcoxiLoc) : !p.alcoxi);
    if (!base) return false;
    if (S.nome === 'oato') return p.esterAlq === P.ester.nome;
    if (S.nome === 'oila') return p.haleto === P.haleto.nome;
    if (S.nome === 'amina' || S.nome === 'amida') return iguais([p.n1, p.n2].filter(Boolean), P.nSubs || []);
    return true;
  }

  /* cada peça, lado a lado com a calculada, e a regra que a decide */

  /* ══ ENTRADA ═══════════════════════════════════════════════════ */

  _ligarPonteiro() { /* os toques chegam pelo app (tocar); o editor tem os seus */ }

  tocar(x, y) {
    if (this.fonte === 'desenhar') return this.editor.tocar(x, y);
    var r = this._espacosTela || [];
    for (var i = 0; i < r.length; i++) if (x >= r[i].x && x <= r[i].x + r[i].w && y >= r[i].y && y <= r[i].y + r[i].h) { this.selecionar(i); return true; }
    return false;
  }
  navegar(dx, dy) {
    if (this.fonte === 'desenhar') return this.editor.navegar(dx, dy);
    if (dx) return this.selecionar((this.sel + (dx > 0 ? 1 : NM_ESPACOS - 1)) % NM_ESPACOS);
    return false;
  }
  acao(nome) {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    if (nome === 'nm-gerar') return this.gerar(val('nm-molecular'));
    if (nome === 'nm-por') return this.porFormula(val('nm-estrutural'));
    if (nome === 'nm-conferir' || nome === 'nm-revelar') return this.conferir();
    if (nome === 'nm-esvaziar') return this.esvaziar();
    if (nome === 'nm-desenhar') return this.abrirDesenho();
    if (nome === 'nm-levar') return this.levarDesenho();
    if (nome === 'nm-voltar') return this.voltarBancada();
    if (nome === 'nm-acao') return this.fonte === 'desenhar' ? this.editor.acao('cad-ativar') : this.conferir();
    return false;
  }

  /* ══ DESENHO ═══════════════════════════════════════════════════ */

  desenhar(ctx, W, H) {
    var P = Q3.Desenho.paleta(), self = this;
    if (this.fonte === 'desenhar') { this.editor.desenhar(ctx, W, H); return; }
    var pad = 8, fimDoca = this._desenharDoca(ctx, W, P, NM_ESPACOS, H);
    // a estrutura do espaço selecionado, grande, numa faixa CENTRAL (longe das laterais)
    var e = this.espacos[this.sel], areaW = Math.min(W - 56, 720), ax = (W - areaW) / 2;
    var areaTopo = fimDoca + pad + 28, areaBase = H - 40;   // sem a faixa embaixo, a estrutura ganha a altura
    if (H < 430) { areaTopo = fimDoca + pad + 12; areaBase = H - 16; }   // cena baixa (celular deitado): menos folga em cima e embaixo
    if (e) this._estrutura(ctx, e, ax, areaTopo, areaW, areaBase - areaTopo, P);
    else { ctx.save(); ctx.fillStyle = P.suave; ctx.textAlign = 'center'; Q3.Desenho.textoQueCabe(ctx, 'Espaço ' + (this.sel + 1) + ' vazio.', W / 2, (areaTopo + areaBase) / 2, areaW, { tam: 14, min: 11 }); ctx.restore(); }
    // a faixa do nome: a previsão ao vivo; depois de revelar, o nome calculado
    /* sem faixa de texto no canvas (pedido do professor): o nome vai para o painel Nome (#nm-nome) */
  }

  /* A DOCA: os espaços em MINIATURA, flutuando no alto, ao centro, logo abaixo do selo de modo ativo.
     Os cards do trilho abrem nas LATERAIS; uma faixa de ponta a ponta ficava coberta por eles. No centro,
     nada a encobre, e o canvas não precisa mudar de tamanho a cada card. Numa TELA ESTREITA (celular),
     onde os oito não cabem numa fileira, vão em duas fileiras de quatro — nenhum espaço fica fora da tela.
     Serve aos Módulos 2 e 4 (n espaços). Devolve a altura em que a doca termina. */
  _desenharDoca(ctx, W, P, n, H) {
    /* os cartões estreitam até 60 px antes de a doca virar duas fileiras (no celular deitado, por 2 px,
       os oito iam para duas fileiras e roubavam 78 px de altura); numa cena baixa, ficam mais baixos */
    // os ajudantes vêm do protótipo, não de this: o Módulo 4 (outra classe) desenha esta mesma doca com .call
    var M2 = NomeadorCadeias.prototype;
    var gap = 6, pad = 8, margem = 10, alto = !H || H >= 430 ? 72 : H < 300 ? 54 : 60, topo = 60, larg0 = 70, largMin = 60;
    var cabe = function (c) { return c * largMin + (c - 1) * gap + 2 * (pad + margem) <= W; };
    var cols = cabe(n) ? n : Math.ceil(n / 2), linhas = Math.ceil(n / cols);
    var larg = Math.max(48, Math.min(larg0, Math.floor((W - 2 * (pad + margem) - (cols - 1) * gap) / cols)));
    var total = cols * larg + (cols - 1) * gap, altoT = linhas * alto + (linhas - 1) * gap, x0 = Math.round((W - total) / 2);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,' + (P.claro ? 0.16 : 0.45) + ')'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 4;
    ctx.fillStyle = nmRgba(P.painel, 0.94);
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0 - pad, topo - pad, total + 2 * pad, altoT + 2 * pad, 12); else ctx.rect(x0 - pad, topo - pad, total + 2 * pad, altoT + 2 * pad); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.strokeStyle = nmRgba(P.suave, 0.35); ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    this._espacosTela = [];
    for (var i = 0; i < n; i++) {
      var x = x0 + (i % cols) * (larg + gap), y = topo + Math.floor(i / cols) * (alto + gap), e = this.espacos[i], ativo = i === this.sel;
      this._espacosTela.push({ x: x, y: y, w: larg, h: alto });
      ctx.save();
      ctx.fillStyle = nmRgba(P.fundo, ativo ? 0.9 : 0.55); ctx.strokeStyle = ativo ? P.acento : nmRgba(P.suave, 0.4); ctx.lineWidth = ativo ? 2.5 : 1;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, larg, alto, 7); else ctx.rect(x, y, larg, alto); ctx.fill(); ctx.stroke();
      ctx.fillStyle = P.suave; ctx.font = '600 9.5px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(String(i + 1), x + 5, y + 11);
      if (e && e.estado === 'certo') M2._nomeNoCartao.call(this, ctx, e.r.nome, x + 14, y + 10, larg - 18, P);
      else if (e && e.estado === 'rever') { ctx.fillStyle = P.claro ? '#8a4b00' : '#ffb454'; ctx.font = '700 10px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('↺', x + larg - 5, y + 11); }
      else if (e && e.estado === 'fora') { ctx.fillStyle = P.suave; ctx.font = '600 8.5px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('fora', x + larg - 5, y + 11); }
      var dy = e && e.estado === 'certo' ? 12 : 0;   // o nome ocupa o alto do cartão
      if (e) { M2._miniatura.call(this, ctx, e, x + 4, y + 12 + dy, larg - 8, alto - 26 - dy, P); ctx.fillStyle = P.texto; ctx.textAlign = 'center'; ctx.font = '500 9.5px system-ui, sans-serif'; ctx.fillText(e.formula, x + larg / 2, y + alto - 5); }
      else { ctx.fillStyle = P.suave; ctx.textAlign = 'center'; ctx.font = '500 10px system-ui, sans-serif'; ctx.fillText('vazio', x + larg / 2, y + alto / 2 + 4); }
      ctx.restore();
    }
    return topo + altoT;
  }

  /* o nome certo no alto do cartão, ao lado do número: quebra nos hifens
     e nos espaços, em até duas linhas */
  /* o nome certo no alto do cartão, ao lado do número: quebra nos hifens e
     nos espaços, em até duas linhas; um pedaço largo demais ("metiletanamina")
     encolhe a fonte e, no limite, ganha "…" — o nome inteiro está na faixa e
     nos Resultados. */
  _nomeNoCartao(ctx, nome, x, y, w, P) {
    ctx.save(); ctx.textAlign = 'left'; ctx.fillStyle = P.texto;
    var partes = nome.match(/[^-\s]+[-\s]?/g) || [nome], tam = 8.5, linhas;
    var quebrar = function () {
      var ls = [], atual = '';
      partes.forEach(function (pt) { var t = atual + pt; if (ctx.measureText(t.trim()).width > w && atual) { ls.push(atual); atual = pt; } else atual = t; });
      if (atual) ls.push(atual);
      return ls;
    };
    for (; tam >= 6.5; tam -= 0.5) { ctx.font = '600 ' + tam + 'px system-ui, sans-serif'; linhas = quebrar(); if (linhas.length <= 2 && linhas.every(function (l) { return ctx.measureText(l.trim()).width <= w; })) break; }
    linhas = linhas.slice(0, 2).map(function (l) { l = l.trim(); while (l.length > 1 && ctx.measureText(l).width > w) l = l.slice(0, -2) + '…'; return l; });
    linhas.forEach(function (l, k) { ctx.fillText(l, x, y + 1 + k * (tam + 1.5)); });
    ctx.fillStyle = P.ok; ctx.textAlign = 'right'; ctx.font = '700 9px system-ui, sans-serif'; ctx.fillText('✓', x + w + 3, y + 1);
    ctx.restore();
  }

  _miniatura(ctx, e, x, y, w, h, P) {
    var ids = Object.keys(e.pos), xs = ids.map(function (id) { return e.pos[id].x; }), ys = ids.map(function (id) { return e.pos[id].y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var s = Math.min(18, (w - 10) / Math.max(1, maxX - minX), (h - 8) / Math.max(1, maxY - minY));
    var cx = x + w / 2 - (minX + maxX) / 2 * s, cy = y + h / 2 - (minY + maxY) / 2 * s, g = e.g;
    var T = function (id) { return { x: cx + e.pos[id].x * s, y: cy + e.pos[id].y * s }; };
    ctx.strokeStyle = nmRgba(P.texto, 0.85); ctx.lineWidth = 1.4;
    g.ligacoes.forEach(function (l) { var a = T(l.a), b = T(l.b); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (l.ordem > 1) { var dx = b.y - a.y, dy = a.x - b.x, L = Math.hypot(dx, dy) || 1; ctx.beginPath(); ctx.moveTo(a.x + dx / L * 2.5, a.y + dy / L * 2.5); ctx.lineTo(b.x + dx / L * 2.5, b.y + dy / L * 2.5); ctx.stroke(); } });
    ctx.font = '700 9px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    g.pesados().forEach(function (id) { var el = g.atomos[id].el; if (el === 'C') return; var p = T(id); ctx.fillStyle = P.painel; ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = P.elementos[el] || P.texto; ctx.fillText(el, p.x, p.y); });
    ctx.textBaseline = 'alphabetic';
  }

  _estrutura(ctx, e, x, y, w, h, P) {
    // a cadeia numerada aparece quando o nome desta estrutura já está certo
    var g = e.g, D = Q3.Desenho, r = e.estado === 'certo' && e.r && e.r.ok ? e.r : null;
    var ids = Object.keys(e.pos), xs = ids.map(function (id) { return e.pos[id].x; }), ys = ids.map(function (id) { return e.pos[id].y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    // numa área baixa (celular deitado), menos margem em cima e embaixo: a estrutura não vira miniatura
    var s = Math.min(84, (w - 90) / Math.max(1, maxX - minX), (h - (h < 140 ? 34 : 50)) / Math.max(1, maxY - minY));
    var cx = x + w / 2 - (minX + maxX) / 2 * s, cy = y + h / 2 - (minY + maxY) / 2 * s;
    var T = {}; ids.forEach(function (id) { T[id] = { x: cx + e.pos[id].x * s, y: cy + e.pos[id].y * s }; });
    var fonte = Math.max(12, Math.min(17, s * 0.3)), margem = {};
    ids.forEach(function (id) { margem[id] = D.medirRotulo(ctx, D.rotulo(g, id), fonte); });
    ctx.save();
    // a cadeia principal, revelada: um traço largo por baixo
    if (r) {
      ctx.strokeStyle = nmRgba(P.acento, 0.3); ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); r.cadeia.forEach(function (id, k) { var p = T[id]; if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      if (r.pecas && r.pecas.anel) ctx.closePath();   // num anel, o traço fecha (a ligação do último ao 1)
      ctx.stroke();
    }
    g.ligacoes.forEach(function (l) { D.ligacao(ctx, T[l.a], T[l.b], l.ordem, margem[l.a], margem[l.b], { cor: P.texto, largura: 2.4 }); });
    ids.forEach(function (id) { var el = g.atomos[id].el; D.atomo(ctx, T[id], D.rotulo(g, id), fonte, P, { corTexto: P.elementos[el] || P.texto }); });
    // a numeração, carbono a carbono
    if (r) {
      ctx.font = '700 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      r.cadeia.forEach(function (id) {
        /* o número vai no meio da MAIOR abertura entre as ligações ("oposto à
           soma dos vizinhos" punha o 2 do butan-2-ol em cima da ligação C–OH) */
        var p = T[id], angs = g.vizinhos(id).map(function (v) { return Math.atan2(T[v.id].y - p.y, T[v.id].x - p.x); }).sort(function (a, b) { return a - b; });
        var dirA = -Math.PI / 2;
        if (angs.length === 1) dirA = angs[0] + Math.PI;
        else if (angs.length > 1) { var maior = -1; angs.forEach(function (an, k) { var prox = k + 1 < angs.length ? angs[k + 1] : angs[0] + 2 * Math.PI, vao = prox - an; if (vao > maior) { maior = vao; dirA = an + vao / 2; } }); }
        var d = Math.max(margem[id].mx, margem[id].my, 10) + 14, nx = p.x + Math.cos(dirA) * d, ny = p.y + Math.sin(dirA) * d;
        ctx.fillStyle = P.acento; ctx.beginPath(); ctx.arc(nx, ny, 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.fundo; ctx.fillText(String(r.numeracao[id]), nx, ny + 0.5);
      });
    }
    ctx.restore();
  }


  /* ══ PAINEL ════════════════════════════════════════════════════ */

  _ligarPainel() {
    if (this._painelLigado) return;
    this._painelLigado = true;
    var self = this, corpo = document.getElementById('body-nome');
    if (corpo) corpo.addEventListener('change', function (e) { var s = e.target.closest('select[data-peca]'); if (s && self.ativo) self.definirPeca(s.dataset.peca, s.value); });
    /* a TRIPLA: o campo mostra sempre "≡", o símbolo do livro. O atalho
       "-=" (uma σ e duas π) vira "≡" enquanto o aluno digita; os botões
       de símbolo inserem na posição do cursor (celular e tablet). */
    var campo = document.getElementById('nm-estrutural');
    if (campo) {
      campo.addEventListener('input', function () {
        var v = campo.value, pos = campo.selectionStart || v.length;
        if (v.indexOf('-=') < 0) return;
        var antes = v.slice(0, pos).replace(/-=/g, '≡').length;
        campo.value = v.replace(/-=/g, '≡');
        try { campo.setSelectionRange(antes, antes); } catch (e) {}
      });
      document.querySelectorAll('.nm-simbolo').forEach(function (b) {
        b.addEventListener('click', function () {
          var sb = b.dataset.simbolo, ini = campo.selectionStart != null ? campo.selectionStart : campo.value.length, fim = campo.selectionEnd != null ? campo.selectionEnd : ini;
          campo.value = campo.value.slice(0, ini) + sb + campo.value.slice(fim);
          campo.focus(); try { campo.setSelectionRange(ini + sb.length, ini + sb.length); } catch (e) {}
        });
      });
    }
    [['nm-molecular', 'nm-gerar'], ['nm-estrutural', 'nm-por']].forEach(function (par) {
      var el = document.getElementById(par[0]);
      if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter' && self.ativo) { e.preventDefault(); self.acao(par[1]); } });
    });
  }

  _sincronizarPainel() {
    var self = this, e = this.espacos[this.sel];
    var rot = document.getElementById('nm-rotulo-espaco'); if (rot) rot.textContent = 'Fórmula estrutural do espaço ' + (this.sel + 1);
    var nota = document.getElementById('nm-nota'); if (nota) nota.textContent = this.erro || this.nota || this.contador || '';
    var prev = document.getElementById('nm-previsao'); if (prev) prev.textContent = this.nomePrevisto() ? 'Previsão: ' + this.nomePrevisto() : '';
    var nomeEl = document.getElementById('nm-nome');
    if (nomeEl) {
      var r = e && e.r;
      nomeEl.textContent = !e ? '' : e.estado === 'certo' ? r.nome + (r.curto ? ' · também ' + r.curto : '') + (r.antigo ? ' · antigo: ' + r.antigo : '') + (r.nota2013 ? ' · IUPAC 2013: outro nome' : '')
        : e.estado === 'fora' ? r.motivo : e.estado === 'rever' ? 'A rever.' : '';
    }
    var anelNomeado = !!(e && e.prev.anel && e.prev.anel !== 'ciclo');
    document.querySelectorAll('#body-nome [data-cadeia]').forEach(function (l) { l.hidden = anelNomeado; });
    var sufEsc = e ? e.prev.sufixo : '';
    document.querySelectorAll('#body-nome [data-contexto]').forEach(function (l) {
      var ctx = l.dataset.contexto;
      l.hidden = !(ctx === sufEsc || (ctx === 'N' && (sufEsc === 'amina' || sufEsc === 'amida')));
    });
    var bConf = document.querySelector('[data-action="nm-conferir"]'); if (bConf) bConf.disabled = !this.espacos.some(Boolean);

  }

  /* ══ RESULTADOS E SOBREPOSIÇÃO ═════════════════════════════════ */

  resultados() {
    var e = this.espacos[this.sel];
    var linhas = [{ l: 'Espaço', v: String(this.sel + 1) }, { l: 'Fórmula molecular', v: e ? e.formula : '—' }];
    if (e && e.estado === 'certo') { linhas.push({ l: 'Nome', v: e.r.nome }); if (e.r.antigo) linhas.push({ l: 'Formato antigo', v: e.r.antigo }); }
    if (e && e.estado === 'fora') linhas.push({ l: 'Nome', v: 'fora do escopo' });
    return linhas;
  }

  overlay() { return this.fonte === 'desenhar' ? 'Nomenclatura · desenho' : 'Nomenclatura · espaço ' + (this.sel + 1); }
}
