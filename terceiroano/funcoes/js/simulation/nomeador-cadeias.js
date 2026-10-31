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

   ONDE CADA COISA APARECE (a cena fica só com o desenho)
     cena (canvas) .... a doca, só com as miniaturas e os sinais de cada
                        espaço (✓ certo, ↺ a rever, ⊘ fora do escopo, •
                        previsão feita), e a estrutura do espaço
                        escolhido, numerada quando o nome está certo
     card Nome ........ as peças do nome e a previsão, ao vivo
     Resultados ....... a conferência (retorno), o próximo passo
                        (proximoPasso) e a ficha do espaço escolhido:
                        situação, fórmula, nome nas formas que tiver
                        (resultados)
   Antes, o número, a fórmula e o nome certo eram escritos nos cartões da
   doca (o nome descia a 6,5 px), e "Faltam previsões" aparecia no card
   Bancada, longe do botão Conferir. No computador, o card Nome abre com
   os Resultados logo abaixo (data-rail-junto, em index.html).
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
    this.sel = 0; this.nota = null; this.erro = null; this._ciclo = null; this.contador = ''; this._ret = null;
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
    this.sel = 0; this._novoAlvo(); this._ret = null;   // leva nova: a conferência anterior não vale mais
    // na tela, só o CONTADOR (pedido do professor, agora nos Resultados); o leitor de tela recebe a frase completa
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
      this._ret = NomeadorCadeias.prototype._faltam(faltam.map(function (i) { return i + 1; }));
      announce(this._ret.texto); this._sincronizarPainel(); return true;
    }
    var certos = [], rever = [];
    cheios.forEach(function (i) {
      var e = self.espacos[i];
      if (e.estado === 'fora') return;
      if (e.estado !== 'certo') e.estado = self._pecasIguais(e.prev, e.r) ? 'certo' : 'rever';
      (e.estado === 'certo' ? certos : rever).push(i + 1);
    });
    playTone(660, .08, .04);
    this.nota = '';   // nos cartões, ✓ ou ↺; a frase, nos Resultados
    this._ret = this._frasesConferencia(certos, rever);
    announce(this._ret.texto);
    this._novoAlvo(); this._sincronizarPainel();
    return true;
  }

  /* a conferência pedida antes da hora (serve também ao Módulo 4, por NomeadorCadeias.prototype) */
  _faltam(nums) {
    var t = nums.length === 1 ? 'Falta a previsão do espaço ' + nums[0]
      : 'Faltam as previsões dos espaços ' + nums.slice(0, -1).join(', ') + ' e ' + nums[nums.length - 1];
    return { tipo: 'info', texto: 'A conferência vem depois da previsão de todas as estruturas. ' + t + '.' };
  }
  /* a frase da conferência: só certo ou a rever, espaço por espaço — sem dizer o que está errado */
  _frasesConferencia(certos, rever) {
    var lista = function (n) { return n.length === 1 ? 'no espaço ' + n[0] : 'nos espaços ' + n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1]; };
    var t = (certos.length ? 'Nome certo ' + lista(certos) + '.' : '') +
            (rever.length ? (certos.length ? ' ' : '') + 'A rever ' + lista(rever) + ': mexa nas peças e confira de novo.' : '');
    return { tipo: rever.length ? 'info' : 'ok', texto: t || 'Nenhuma estrutura dentro do escopo para conferir.' };
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

  /* A CENA: a doca no alto (só miniaturas e sinais) e, no resto da área, a estrutura do espaço escolhido.
     Nenhum texto de interface: o número do espaço, a fórmula, o nome e o "vazio" moram nos Resultados. */
  desenhar(ctx, W, H) {
    var P = Q3.Desenho.paleta();
    if (this.fonte === 'desenhar') { this.editor.desenhar(ctx, W, H); return; }
    var A = this._docaEArea(ctx, W, H, P, NM_ESPACOS), e = this.espacos[this.sel];
    if (e) this._estrutura(ctx, e, A.x, A.y, A.w, A.h, P);
  }

  /* desenha a doca e devolve o retângulo que sobra para a estrutura: embaixo da doca ou, no celular deitado
     (doca ao lado), à direita dela. Serve aos Módulos 2 e 4 (chamada com .call). */
  _docaEArea(ctx, W, H, P, n) {
    var D = NomeadorCadeias.prototype._desenharDoca.call(this, ctx, W, P, n, H), M = Q3.Moldura.livre(W, H, false);
    if (D.lado) { var x = D.x1 + 16; return { x: x, y: M.y, w: M.x + M.w - x, h: M.h }; }
    var y = D.y1 + (H < 430 ? 8 : 14);
    return { x: M.x, y: y, w: M.w, h: M.y + M.h - y };
  }

  /* A DOCA: os espaços em MINIATURA, no alto e ao centro, logo abaixo da pílula do modo. Numa TELA ESTREITA
     (celular), onde os oito não cabem numa fileira, vão em duas fileiras de quatro. Cada cartão tem só a
     miniatura e, no canto, o SINAL do espaço (desenhado, não escrito): ✓ nome certo, ↺ a rever, ⊘ fora do
     escopo, • previsão feita e ainda não conferida; vazio, um contorno tracejado com um +.
     CELULAR DEITADO (cena larga e baixa, menos de 340 px): no alto, a doca levava metade da altura e a
     estrutura ficava minúscula; ali ela vai para a esquerda, em duas fileiras de quatro, e a estrutura fica
     à direita com a altura toda.
     Serve aos Módulos 2 e 4 (n espaços). Devolve a caixa da doca { x0, y0, x1, y1, lado }. */
  _desenharDoca(ctx, W, P, n, H) {
    // os ajudantes vêm do protótipo, não de this: o Módulo 4 (outra classe) desenha esta mesma doca com .call
    var M2 = NomeadorCadeias.prototype;
    var gap = 6, pad = 8, margem = 10, alto = !H || H >= 430 ? 64 : H < 300 ? 46 : 54, larg0 = 72, largMin = 56;
    var topo = Q3.Moldura.pilula(W).y1 + pad + 2;   // logo abaixo da pílula do modo
    var lado = !!H && H < 340 && W >= 560;
    var cabe = function (c) { return c * largMin + (c - 1) * gap + 2 * (pad + margem) <= W; };
    var cols = !lado && cabe(n) ? n : Math.ceil(n / 2), linhas = Math.ceil(n / cols);
    var larg = lado ? largMin : Math.max(44, Math.min(larg0, Math.floor((W - 2 * (pad + margem) - (cols - 1) * gap) / cols)));
    if (lado) alto = Math.max(38, Math.min(alto, Math.floor((H - topo - 14 - gap) / 2)));   // as duas fileiras cabem na altura
    var total = cols * larg + (cols - 1) * gap, altoT = linhas * alto + (linhas - 1) * gap;
    var x0 = lado ? Q3.Moldura.livre(W, H, false).x + pad : Math.round((W - total) / 2);
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
      ctx.fillStyle = nmRgba(P.fundo, ativo ? 0.9 : e ? 0.55 : 0.3);
      ctx.strokeStyle = ativo ? P.acento : nmRgba(P.suave, e ? 0.4 : 0.55); ctx.lineWidth = ativo ? 2.5 : 1;
      if (!e) ctx.setLineDash([4, 3]);
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, larg, alto, 7); else ctx.rect(x, y, larg, alto); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      if (e) {
        M2._miniatura.call(this, ctx, e, x + 4, y + 6, larg - 8, alto - 10, P);
        M2._sinal(ctx, M2._sinalDe.call(this, e), x + larg - 9, y + 9, P);
      } else {
        // um + bem claro: espaço livre para uma estrutura
        ctx.strokeStyle = nmRgba(P.suave, 0.55); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        var cx = x + larg / 2, cy = y + alto / 2;
        ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke();
      }
      ctx.restore();
    }
    return { x0: x0 - pad, y0: topo - pad, x1: x0 + total + pad, y1: topo + altoT + pad, lado: lado };
  }

  /* o sinal de um espaço: certo, rever, fora, previsto (previsão completa, ainda não conferida) ou nenhum */
  _sinalDe(e) {
    if (e.estado === 'certo' || e.estado === 'rever' || e.estado === 'fora') return e.estado;
    return this._completa(e.prev) ? 'previsto' : '';
  }

  /* os sinais, desenhados com traços (não são letras): o ✓, a seta que volta (↺), o círculo cortado (⊘) e o ponto */
  _sinal(ctx, tipo, cx, cy, P) {
    if (!tipo) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // um fundo claro atrás do sinal: ele fica legível mesmo por cima de um traço da miniatura
    ctx.fillStyle = nmRgba(P.painel, 0.92); ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
    if (tipo === 'certo') {
      ctx.strokeStyle = P.ok; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(cx - 4, cy + 0.2); ctx.lineTo(cx - 1.2, cy + 3); ctx.lineTo(cx + 4.2, cy - 3.4); ctx.stroke();
    } else if (tipo === 'rever') {
      var cor = P.claro ? '#8a4b00' : '#ffb454', r = 4.2, a0 = -0.35 * Math.PI, a1 = 1.2 * Math.PI;
      ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1, false); ctx.stroke();
      // a ponta da seta, no começo do arco, apontando para trás (o sentido de "voltar")
      var px = cx + Math.cos(a0) * r, py = cy + Math.sin(a0) * r;
      ctx.beginPath(); ctx.moveTo(px + 3.2, py - 0.4); ctx.lineTo(px - 0.6, py - 2.6); ctx.lineTo(px - 0.2, py + 1.8); ctx.closePath(); ctx.fill();
    } else if (tipo === 'fora') {
      ctx.strokeStyle = P.suave; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy, 4.5, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 3.1, cy + 3.1); ctx.lineTo(cx + 3.1, cy - 3.1); ctx.stroke();
    } else if (tipo === 'previsto') {
      ctx.fillStyle = P.acento; ctx.beginPath(); ctx.arc(cx, cy, 3.2, 0, Math.PI * 2); ctx.fill();
    }
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

  /* A ESTRUTURA do espaço escolhido, enquadrada no retângulo (x, y, w, h): a maior escala em que cabem os átomos
     com o rótulo e a bolinha do número de cada carbono da cadeia (o lugar das bolinhas fica reservado desde o
     começo: o desenho não muda de tamanho quando o nome fica certo). A cadeia numerada aparece quando o nome
     desta estrutura está certo. Serve também ao Módulo 4 (chamada com .call). */
  _estrutura(ctx, e, x, y, w, h, P) {
    var g = e.g, D = Q3.Desenho, r = e.estado === 'certo' && e.r && e.r.ok ? e.r : null;
    var E = NomeadorCadeias.prototype._enquadrar.call(this, ctx, e, x, y, w, h);
    var T = {}, ids = Object.keys(e.pos), fonte = E.fonte, margem = E.margem;
    ids.forEach(function (id) { T[id] = { x: E.cx + e.pos[id].x * E.s, y: E.cy + e.pos[id].y * E.s }; });
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
      ctx.font = '700 ' + E.num + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      r.cadeia.forEach(function (id) {
        /* o número vai no meio da MAIOR abertura entre as ligações ("oposto à
           soma dos vizinhos" punha o 2 do butan-2-ol em cima da ligação C–OH) */
        var p = T[id], angs = g.vizinhos(id).map(function (v) { return Math.atan2(T[v.id].y - p.y, T[v.id].x - p.x); }).sort(function (a, b) { return a - b; });
        var dirA = -Math.PI / 2;
        if (angs.length === 1) dirA = angs[0] + Math.PI;
        else if (angs.length > 1) { var maior = -1; angs.forEach(function (an, k) { var prox = k + 1 < angs.length ? angs[k + 1] : angs[0] + 2 * Math.PI, vao = prox - an; if (vao > maior) { maior = vao; dirA = an + vao / 2; } }); }
        var d = Math.max(margem[id].mx, margem[id].my, 10) + 4 + E.raio, nx = p.x + Math.cos(dirA) * d, ny = p.y + Math.sin(dirA) * d;
        ctx.fillStyle = P.acento; ctx.beginPath(); ctx.arc(nx, ny, E.raio, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = P.fundo; ctx.fillText(String(r.numeracao[id]), nx, ny + 0.5);
      });
    }
    ctx.restore();
  }

  /* O ENQUADRAMENTO: a escala cresce (busca binária) até o desenho, com a folga de cada átomo — o rótulo e a
     bolinha do número (até máx(mx, my, 10) + 4 + 2 × raio do centro) —, encostar no retângulo. A letra
     acompanha a escala: de 12 a 17 px e, numa tela grande como a do projetor, até 20 px. Guardado por espaço
     e por retângulo: a conta só se refaz quando um dos dois muda. */
  _enquadrar(ctx, e, x, y, w, h) {
    var chave = [x, y, w, h].map(Math.round).join(',');
    if (this._enqE && this._enqE.e === e && this._enqE.chave === chave) return this._enqE;
    var g = e.g, D = Q3.Desenho, ids = Object.keys(e.pos), textos = {};
    ids.forEach(function (id) { textos[id] = D.rotulo(g, id); });
    var fonteDe = function (s) { return Math.max(12, Math.min(s > 96 ? 17 + (s - 96) * 0.09 : 17, s * 0.3)); };
    var medir = function (s) {
      var f = fonteDe(s), num = Math.max(12, Math.round(f * 0.7)), raio = Math.max(10, num * 0.85), m = {}, ext = {};
      ids.forEach(function (id) { m[id] = D.medirRotulo(ctx, textos[id], f); ext[id] = Math.max(m[id].mx, m[id].my, 10) + 4 + 2 * raio + 2; });
      return { fonte: f, num: num, raio: raio, m: m, ext: ext };
    };
    var lados = function (s, eixo, me) {
      var mais = -Infinity, menos = -Infinity;
      ids.forEach(function (id) { var v = e.pos[id][eixo] * s; mais = Math.max(mais, v + me.ext[id]); menos = Math.max(menos, me.ext[id] - v); });
      return { mais: mais, menos: menos };
    };
    // o teto da escala cresce com a área: a cena agora é só a estrutura, e ela pode ocupar o espaço que sobra
    var sMax = Math.max(84, Math.min(120, Math.min(w, h) / 6)), lo = 4, hi = sMax;
    for (var k = 0; k < 26; k++) {
      var s = (lo + hi) / 2, me = medir(s), lx = lados(s, 'x', me), ly = lados(s, 'y', me);
      if (lx.mais + lx.menos <= w && ly.mais + ly.menos <= h) lo = s; else hi = s;
    }
    var mf = medir(lo), fx = lados(lo, 'x', mf), fy = lados(lo, 'y', mf);
    this._enqE = { e: e, chave: chave, s: lo, fonte: mf.fonte, num: mf.num, raio: mf.raio, margem: mf.m,
                   cx: x + (fx.menos + w - fx.mais) / 2, cy: y + (fy.menos + h - fy.mais) / 2 };
    return this._enqE;
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
    // no card Bancada, só o erro de digitação (fica junto do campo); o contador e a conferência vão para os Resultados
    var nota = document.getElementById('nm-nota'); if (nota) nota.textContent = this.erro || '';
    var prev = document.getElementById('nm-previsao'); if (prev) prev.textContent = this.nomePrevisto() ? 'Previsão: ' + this.nomePrevisto() : '';
    // a ordem dos cards na gaveta do celular depende de a bancada estar vazia ou cheia (ver stylefuncoes.css)
    if (this.ativo) document.body.dataset.bancada = this.fonte === 'desenhar' ? 'desenho' : this.espacos.some(Boolean) ? 'cheia' : 'vazia';
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

  /* a conferência (ou o pedido de prever tudo antes), no alto dos Resultados; nada antes da primeira */
  retorno() { return this.fonte === 'desenhar' ? null : this._ret; }

  /* o que fazer agora, para o espaço escolhido */
  proximoPasso() {
    if (this.fonte === 'desenhar') return this.editor.proximoPasso() + ' Para terminar, toque em Levar o desenho para o espaço, na Bancada.';   // a dica do editor, antes no pé da cena
    var self = this, e = this.espacos[this.sel], cheios = this.espacos.filter(Boolean);
    if (!cheios.length) return 'Comece pela Bancada: digite uma fórmula molecular e gere os isômeros, ou ponha uma estrutura no espaço.';
    if (!e) return 'Este espaço está vazio: toque noutro cartão da doca, ou ponha uma estrutura nele pela Bancada.';
    var abertos = this.espacos.filter(function (x) { return x && x.estado !== 'certo' && x.estado !== 'fora'; });
    if (!abertos.length) return 'Toda a bancada conferida. Gere outra leva na Bancada.';
    if (e.estado === 'fora') return 'Esta estrutura está fora do escopo do módulo (o motivo está abaixo). Toque noutro cartão da doca.';
    if (e.estado === 'certo') return 'Nome certo. Toque noutro cartão da doca.';
    if (e.estado === 'rever') return 'A rever: mexa nas peças do nome em Nome e confira de novo.';
    if (!this._completa(e.prev)) return 'Monte o nome desta estrutura com as peças em Nome.';
    var faltam = abertos.filter(function (x) { return !self._completa(x.prev); }).length;
    return faltam ? 'Previsão feita. Toque noutro cartão da doca (falta' + (faltam > 1 ? 'm ' + faltam : ' 1') + ').' : 'Todas as previsões feitas: toque em Conferir as previsões, em Nome.';
  }

  /* A FICHA do espaço escolhido: o sinal do cartão em palavras, a fórmula e, depois de conferido, o nome */
  resultados() {
    if (this.fonte === 'desenhar') return this.editor.resultados();   // desenhando: a ficha do desenho (a fórmula, a cadeia)
    var e = this.espacos[this.sel], r = e && e.r;
    var sit = { certo: 'nome certo ✓', rever: 'a rever ↺', fora: 'fora do escopo ⊘', previsto: 'previsão feita •', '': 'sem previsão' };
    var linhas = [{ l: 'Espaço', v: (this.sel + 1) + ' de ' + NM_ESPACOS }];
    if (this.contador) linhas.push({ l: 'Isômeros', v: this.contador });
    if (!e) { linhas.push({ l: 'Situação', v: 'vazio' }); return linhas; }
    linhas.push({ l: 'Situação', v: sit[this._sinalDe(e)], cls: e.estado === 'certo' ? 'val-ok' : e.estado === 'rever' ? 'val-warn' : '' });
    linhas.push({ l: 'Fórmula molecular', v: e.formula });
    if (e.estado === 'certo') {
      linhas.push({ l: 'Nome', v: r.nome });
      if (r.curto) linhas.push({ l: 'Também', v: r.curto });
      if (r.antigo) linhas.push({ l: 'Formato antigo', v: r.antigo });
      if (r.nota2013) linhas.push({ l: 'IUPAC 2013', v: 'recomenda outro nome', cls: 'val-texto' });
    }
    if (e.estado === 'fora' && r && r.motivo) linhas.push({ l: 'Motivo', v: r.motivo, cls: 'val-texto' });
    return linhas;
  }

  overlay() {
    if (this.fonte === 'desenhar') return 'desenho livre';
    var e = this.espacos[this.sel], sit = { certo: 'nome certo', rever: 'a rever', fora: 'fora do escopo', previsto: 'previsão feita', '': '' };
    var t = e ? sit[this._sinalDe(e)] : 'vazio';
    return 'espaço ' + (this.sel + 1) + (t ? ' · ' + t : '');
  }
}
