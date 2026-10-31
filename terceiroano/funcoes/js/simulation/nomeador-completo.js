/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/nomeador-completo.js
   ───────────────────────────────────────────────────────────────
   MÓDULO 4 — PRIORIDADE DE FUNÇÕES (SIFO). O Módulo 2 levado ao fim:
   nomes COMPLETOS de compostos reais com vários grupos. Independente
   do Módulo 2 (o Módulo 2 não manda nada para cá); reaproveita dele só
   as funções de desenho (miniatura, estrutura numerada, nome no cartão).

   A BANCADA: 8 cartões em doca, no alto e ao centro. "Sortear compostos"
   percorre a biblioteca (nomes-completos.js) numa ordem sorteada, sem
   repetir até todos aparecerem; uma fórmula estrutural digitada também
   serve (a tripla: -= vira ≡).

   O CONSTRUTOR DO NOME (painel): lista de prefixos que CRESCE (cada linha:
   localizadores "2,3" + grupo); cadeia (met… dec) ou anel (benzeno,
   fenol, anilina, benzaldeído, ácido benzoico); duplas e triplas pelos
   localizadores; sufixo com localizadores ou "nas duas pontas"; o "de
   …ila" do éster. O multiplicador sai da quantidade de localizadores; o
   nome se forma ao vivo com as MESMAS regras de montagem do motor.

   A ESCADA das 14 funções, nos Resultados (é a regra, não a resposta).
   Com o nome certo, os grupos do composto sobem aos seus degraus: o
   principal vira "sufixo"; os outros, o prefixo que viraram. Antes ela
   era desenhada na cena, à esquerda: no celular os degraus desciam a
   8 px e os nomes se sobrepunham.

   ONDE CADA COISA APARECE (como no Módulo 2): na cena, a doca de
   miniaturas com os sinais e a estrutura escolhida; no card Nome
   completo, o construtor e a previsão; nos Resultados, a conferência,
   o próximo passo, a escada e a ficha do espaço.

   CONFERIR, como no Módulo 2: depois da previsão de TODOS os cartões;
   só "certo" ou "a rever", sem dizer o quê; o nome certo vai para o
   cartão. Sem pistas, pontuação ou celebração.
═══════════════════════════════════════════════════════════════ */

'use strict';

var NC_ESPACOS = 8;
var NC_PREFIXOS = ['hidroxi', 'oxo', 'amino', 'metil', 'etil', 'propil', 'metoxi', 'etoxi', 'cloro', 'bromo', 'iodo', 'fluoro'];
var NC_ANEIS = ['benzeno', 'fenol', 'anilina', 'benzaldeído', 'ácido benzoico'];
var NC_SUFIXOS = [['o', 'o (nenhum grupo)'], ['ol', 'ol'], ['al', 'al'], ['ona', 'ona'], ['oico', 'oico (ácido)'], ['amina', 'amina'], ['nitrila', 'nitrila'], ['amida', 'amida'], ['oato', 'oato (éster)']];
var NC_ALQUILAS = ['metila', 'etila', 'propila', 'butila'];

class NomeadorCompleto {
  constructor(D) { this.D = D; this.ativo = false; this.t = 0; this.reiniciar(true); }

  _prevVazia() { return { prefixos: [{ locs: '', nome: '' }], base: '', duplas: '', triplas: '', sufixo: '', sufLocs: '', dois: false, ester: '' }; }

  /* a troca de módulo LIMPA o que sai */
  reiniciar(inicio) {
    this.espacos = []; for (var i = 0; i < NC_ESPACOS; i++) this.espacos.push(null);
    this.sel = 0; this.nota = ''; this.erro = null; this.contador = ''; this._ciclo = null; this._ret = null;
    if (!inicio) { var c = document.getElementById('nc-estrutural'); if (c) c.value = ''; this._montarConstrutor(); this._sincronizarPainel(); }
  }
  ativar() { this.ativo = true; var cv = document.getElementById('sim-canvas'); if (cv) cv.style.touchAction = 'none'; this._ligarPainel(); this._montarConstrutor(); this._sincronizarPainel(); }
  desativar() { this.ativo = false; }
  atualizar(dt) { this.t += dt; }   // a subida dos grupos na escada é uma animação do CSS (stylefuncoes.css)

  /* ══ A BANCADA ═════════════════════════════════════════════════ */

  _espaco(g, origem, comum) {
    var r = Q3.NomenclaturaCompleta.nomear(g);
    return { g: g, origem: origem, comum: comum || null, pos: NomeadorCadeias.prototype._horizontal.call(this, Q3.Geometria.layout(g)),
             formula: g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); }),
             prev: this._prevVazia(), estado: r.ok ? 'aberto' : 'fora', r: r };
  }

  /* a biblioteca numa ordem sorteada (Fisher–Yates), sem repetir até todos aparecerem */
  gerar() {
    var L = Q3.NOMES_COMPLETOS, n = L.length, c = this._ciclo || (this._ciclo = { fila: [], vistos: {} });
    var perm = function () { var a = []; for (var i = 0; i < n; i++) a.push(i); for (var k = n - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)), t = a[k]; a[k] = a[j]; a[j] = t; } return a; };
    while (c.fila.length < NC_ESPACOS + n) c.fila = c.fila.concat(perm());
    var leva = [], adiados = [];
    while (leva.length < Math.min(NC_ESPACOS, n) && c.fila.length) { var k2 = c.fila.shift(); if (leva.indexOf(k2) >= 0) adiados.push(k2); else leva.push(k2); }
    c.fila = adiados.concat(c.fila);
    for (var i = 0; i < NC_ESPACOS; i++) this.espacos[i] = i < leva.length ? this._espaco(Q3.deSmiles(L[leva[i]].smiles), 'biblioteca', L[leva[i]]) : null;
    leva.forEach(function (k3) { c.vistos[k3] = 1; });
    this.sel = 0; this.erro = null; this.nota = ''; this._ret = null;   // leva nova: a conferência anterior não vale mais
    this.contador = Object.keys(c.vistos).length + ' de ' + n + ' compostos';
    playTone(660, .06, .04);
    announce('Bancada com ' + leva.length + ' compostos reais. Já apareceram ' + this.contador + '.');
    this._montarConstrutor(); this._sincronizarPainel();
    return true;
  }
  porFormula(texto) {
    var g;
    try { g = Q3.deFormulaCondensada(texto); } catch (e) { this.erro = e.message; announce(e.message); this._sincronizarPainel(); return false; }
    this.erro = null;
    this.espacos[this.sel] = this._espaco(g, 'digitada', null);
    var e2 = this.espacos[this.sel];
    announce('Estrutura no espaço ' + (this.sel + 1) + (e2.estado === 'fora' ? ': ' + e2.r.motivo : '.'));
    this._montarConstrutor(); this._sincronizarPainel();
    return true;
  }
  selecionar(i) {
    if (i < 0 || i >= NC_ESPACOS) return false;
    this.sel = i; this.erro = null;
    var e = this.espacos[i];
    announce('Espaço ' + (i + 1) + (e ? ': ' + (e.comum ? e.comum.comum + ', ' : '') + e.formula + '.' : ': vazio.'));
    this._montarConstrutor(); this._sincronizarPainel();
    return true;
  }
  esvaziar() { this.espacos[this.sel] = null; this._montarConstrutor(); this._sincronizarPainel(); return true; }

  /* ══ A PREVISÃO: o nome se monta com as MESMAS regras do motor ═ */

  _locs(txt) { return String(txt || '').split(/[^0-9]+/).filter(Boolean).map(Number); }

  nomePrevisto(pArg) {
    var e = this.espacos[this.sel], p = pArg || (e ? e.prev : this._prevVazia()), M = Q3.NomenclaturaCompleta, self = this;
    if (!p.base && !p.sufixo && !p.prefixos.some(function (x) { return x.nome; })) return '';
    var pref = [];
    p.prefixos.forEach(function (row) { if (!row.nome) return; var ls = self._locs(row.locs); (ls.length ? ls : [0]).forEach(function (l) { pref.push({ nome: row.nome, loc: l }); }); });
    var preTxt = M.textoPrefixos(pref).replace(/(^|[-,])0(?=[-,])/g, '$1?');
    if (p.base.indexOf('a:') === 0) {
      var anel = p.base.slice(2), sL = this._locs(p.sufLocs);
      if (anel === 'benzeno' && (p.sufixo === 'ol' || p.sufixo === 'amina') && sL.length >= 2) return preTxt + 'benzeno-' + sL.join(',') + '-' + M.multiplicar(sL.length, p.sufixo);
      if (anel === 'benzeno' && pref.length === 1) preTxt = pref[0].nome;           // metilbenzeno
      if (anel === 'ácido benzoico') { var nb = 'ácido ' + preTxt + 'benzoico'; return p.sufixo === 'oato' ? nb.replace(/^ácido /, '').replace(/ico$/, 'ato') + ' de ' + (p.ester || '…') : nb; }
      return preTxt + anel;
    }
    var stem = p.base ? p.base.slice(2) : '…', d = this._locs(p.duplas), tr = this._locs(p.triplas);
    var raiz = stem + ((d.length > 1 || tr.length > 1) ? 'a' : '');
    var insat = (!d.length && !tr.length) ? 'an' : (d.length ? '-' + d.join(',') + '-' + M.multiplicar(d.length, 'en') : '') + (tr.length ? '-' + tr.join(',') + '-' + M.multiplicar(tr.length, 'in') : '');
    var mae = raiz + insat, suf = p.sufixo, nome;
    if (!suf || suf === 'o') nome = mae + (suf ? 'o' : '…');
    else {
      var bs = suf === 'oato' ? 'oico' : suf, term = { oico: 1, al: 1, nitrila: 1, amida: 1 }[bs];
      var ls = this._locs(p.sufLocs), k = term ? (p.dois ? 2 : 1) : Math.max(1, ls.length);
      var sfx = M.multiplicar(k, bs), locSuf = term ? '' : (ls.length ? '-' + ls.join(',') + '-' : '');
      nome = /^[aeiou]/.test(sfx) ? mae + locSuf + sfx : mae + 'o' + locSuf + sfx;
    }
    nome = preTxt + nome;
    if (suf === 'oico') nome = 'ácido ' + nome;
    if (suf === 'oato') nome = nome.replace(/ico$/, 'ato') + ' de ' + (p.ester || '…');
    return nome;
  }
  _completa(p) { return !!(p.base && (p.base.indexOf('a:') === 0 || p.sufixo)); }

  /* CONFERIR (como no Módulo 2): só depois de TODAS as previsões; só certo ou a rever */
  conferir() {
    var self = this, cheios = [];
    this.espacos.forEach(function (e, i) { if (e) cheios.push(i); });
    if (!cheios.length) { announce('A bancada está vazia: sorteie compostos ou digite uma fórmula.'); return false; }
    var faltam = cheios.filter(function (i) { var e = self.espacos[i]; return e.estado !== 'fora' && e.estado !== 'certo' && !self._completa(e.prev); });
    if (faltam.length) { this._ret = NomeadorCadeias.prototype._faltam(faltam.map(function (i) { return i + 1; })); announce(this._ret.texto); this._sincronizarPainel(); return true; }
    var certos = [], rever = [];
    cheios.forEach(function (i) {
      var e = self.espacos[i]; if (e.estado === 'fora') return;
      if (e.estado !== 'certo') e.estado = self.nomePrevisto(e.prev) === e.r.nome ? 'certo' : 'rever';
      (e.estado === 'certo' ? certos : rever).push(i + 1);
    });
    this.nota = '';
    playTone(660, .08, .04);
    this._ret = NomeadorCadeias.prototype._frasesConferencia(certos, rever);
    announce(this._ret.texto);
    this._montarConstrutor(); this._sincronizarPainel();
    return true;
  }

  /* ══ O PAINEL: o construtor do nome ═══════════════════════════ */

  _montarConstrutor() {
    var box = document.getElementById('nc-construtor'); if (!box) return;
    var e = this.espacos[this.sel], p = e ? e.prev : this._prevVazia(), trav = !e || e.estado === 'certo' || e.estado === 'fora';
    var op = function (v, t, s) { return '<option value="' + v + '"' + (v === s ? ' selected' : '') + '>' + t + '</option>'; };
    var dis = trav ? ' disabled' : '';
    var h = '<span class="ctrl-label">Prefixos</span><div class="nc-prefixos">';
    p.prefixos.forEach(function (row, i) {
      h += '<div class="nc-linha"><input type="text" class="nc-locs" data-campo="locs" data-i="' + i + '" value="' + row.locs + '" placeholder="2,3" aria-label="localizadores do prefixo ' + (i + 1) + '" inputmode="numeric"' + dis + '>' +
        '<select data-campo="nome" data-i="' + i + '" aria-label="grupo do prefixo ' + (i + 1) + '"' + dis + '>' + op('', '—', row.nome) + NC_PREFIXOS.map(function (x) { return op(x, x, row.nome); }).join('') + '</select>' +
        '<button type="button" class="nc-tirar" data-i="' + i + '" aria-label="tirar o prefixo ' + (i + 1) + '"' + dis + '>×</button></div>';
    });
    h += '</div><button type="button" class="action-btn nc-mais"' + dis + '>+ prefixo</button>';
    h += '<label class="nm-campo"><span>Cadeia ou anel</span><select data-campo="base"' + dis + '>' + op('', '—', p.base) +
      '<optgroup label="Cadeia">' + Q3.Nomenclatura.PREFIXOS.slice(1).map(function (x) { return op('c:' + x, x, p.base); }).join('') + '</optgroup>' +
      '<optgroup label="Anel">' + NC_ANEIS.map(function (x) { return op('a:' + x, x, p.base); }).join('') + '</optgroup></select></label>';
    h += '<div class="nc-par"><label class="nm-campo"><span>Duplas nos carbonos</span><input type="text" data-campo="duplas" value="' + p.duplas + '" placeholder="1,3" inputmode="numeric"' + dis + '></label>' +
         '<label class="nm-campo"><span>Triplas nos carbonos</span><input type="text" data-campo="triplas" value="' + p.triplas + '" placeholder="1" inputmode="numeric"' + dis + '></label></div>';
    h += '<div class="nc-par"><label class="nm-campo"><span>Sufixo (grupo principal)</span><select data-campo="sufixo"' + dis + '>' + op('', '—', p.sufixo) + NC_SUFIXOS.map(function (x) { return op(x[0], x[1], p.sufixo); }).join('') + '</select></label>' +
         '<label class="nm-campo"><span>nos carbonos</span><input type="text" data-campo="sufLocs" value="' + p.sufLocs + '" placeholder="1,2" inputmode="numeric"' + dis + '></label></div>';
    h += '<label class="nc-check" data-ctx="pontas"><input type="checkbox" data-campo="dois"' + (p.dois ? ' checked' : '') + dis + '> nas duas pontas (dial, dioico)</label>';
    h += '<label class="nm-campo" data-ctx="oato"><span>de … (éster)</span><select data-campo="ester"' + dis + '>' + op('', '—', p.ester) + NC_ALQUILAS.map(function (x) { return op(x, x, p.ester); }).join('') + '</select></label>';
    box.innerHTML = h;
    // cada campo sabe para qual cartão foi desenhado: um "change" atrasado de um campo que
    // está sendo removido (troca de cartão) não pode gravar no cartão novo
    var sel = String(this.sel);
    box.querySelectorAll('[data-campo]').forEach(function (el) { el.dataset.espaco = sel; });
    this._contexto();
  }
  _contexto() {
    var e = this.espacos[this.sel], s = e ? e.prev.sufixo : '';
    document.querySelectorAll('#nc-construtor [data-ctx]').forEach(function (l) { l.hidden = !((l.dataset.ctx === 'oato' && s === 'oato') || (l.dataset.ctx === 'pontas' && (s === 'al' || s === 'oico'))); });
  }

  _ligarPainel() {
    if (this._painelLigado) return; this._painelLigado = true;
    var self = this, box = document.getElementById('nc-construtor');
    var mexeu = function (el) {
      var e = self.espacos[self.sel]; if (!e || e.estado === 'certo' || e.estado === 'fora') return;
      var campo = el.dataset.campo; if (!campo) return;
      if (el.dataset.espaco !== String(self.sel)) return;       // aviso atrasado de um campo de outro cartão
      if (el.dataset.i !== undefined && !e.prev.prefixos[+el.dataset.i]) return;
      var v = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset.i !== undefined) e.prev.prefixos[+el.dataset.i][campo] = v; else e.prev[campo] = v;
      if (e.estado === 'rever') e.estado = 'aberto';          // mexeu: tentativa nova
      self._contexto(); self._sincronizarPainel();
    };
    if (box) {
      box.addEventListener('input', function (ev) { if (self.ativo) mexeu(ev.target); });
      box.addEventListener('change', function (ev) { if (self.ativo) mexeu(ev.target); });
      box.addEventListener('click', function (ev) {
        if (!self.ativo) return; var e = self.espacos[self.sel]; if (!e || e.estado === 'certo' || e.estado === 'fora') return;
        if (ev.target.closest('.nc-mais')) { e.prev.prefixos.push({ locs: '', nome: '' }); self._montarConstrutor(); var ult = box.querySelectorAll('.nc-locs'); if (ult.length) ult[ult.length - 1].focus(); }
        var tb = ev.target.closest('.nc-tirar');
        if (tb) { e.prev.prefixos.splice(+tb.dataset.i, 1); if (!e.prev.prefixos.length) e.prev.prefixos.push({ locs: '', nome: '' }); if (e.estado === 'rever') e.estado = 'aberto'; self._montarConstrutor(); self._sincronizarPainel(); }
      });
    }
    var campo = document.getElementById('nc-estrutural');
    if (campo) {
      campo.addEventListener('input', function () { var v = campo.value, pos = campo.selectionStart || v.length; if (v.indexOf('-=') < 0) return; var a = v.slice(0, pos).replace(/-=/g, '≡').length; campo.value = v.replace(/-=/g, '≡'); try { campo.setSelectionRange(a, a); } catch (e) {} });
      campo.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && self.ativo) { ev.preventDefault(); self.acao('nc-por'); } });
    }
  }

  _sincronizarPainel() {
    var e = this.espacos[this.sel];
    var set = function (id, t) { var el = document.getElementById(id); if (el) el.textContent = t; };
    set('nc-rotulo-espaco', 'Fórmula estrutural do espaço ' + (this.sel + 1));
    set('nc-nota', this.erro || '');   // o contador e a conferência moram nos Resultados
    set('nc-previsao', this.nomePrevisto() ? 'Previsão: ' + this.nomePrevisto() : '');
    if (this.ativo) document.body.dataset.bancada = this.espacos.some(Boolean) ? 'cheia' : 'vazia';   // a ordem dos cards na gaveta
    var b = document.querySelector('[data-action="nc-conferir"]'); if (b) b.disabled = !this.espacos.some(Boolean);
  }

  /* ══ ENTRADA ═══════════════════════════════════════════════════ */

  tocar(x, y) { var r = this._espacosTela || []; for (var i = 0; i < r.length; i++) if (x >= r[i].x && x <= r[i].x + r[i].w && y >= r[i].y && y <= r[i].y + r[i].h) return this.selecionar(i); return false; }
  navegar(dx) { if (!dx) return false; return this.selecionar((this.sel + (dx > 0 ? 1 : NC_ESPACOS - 1)) % NC_ESPACOS); }
  acao(nome) {
    if (nome === 'nc-gerar') return this.gerar();
    if (nome === 'nc-por') { var c = document.getElementById('nc-estrutural'); return this.porFormula(c ? c.value : ''); }
    if (nome === 'nc-esvaziar') return this.esvaziar();
    if (nome === 'nc-conferir' || nome === 'nc-acao') return this.conferir();
    return false;
  }

  /* ══ DESENHO: a doca e a estrutura (a escada mora nos Resultados) ══ */

  desenhar(ctx, W, H) {
    var P = Q3.Desenho.paleta(), M2 = NomeadorCadeias.prototype;
    var A = M2._docaEArea.call(this, ctx, W, H, P, NC_ESPACOS), es = this.espacos[this.sel];   // a mesma doca do Módulo 2
    if (es) M2._estrutura.call(this, ctx, es, A.x, A.y, A.w, A.h, P);
  }

  /* A ESCADA (nos Resultados): as 14 funções em ordem de prioridade, em duas colunas de sete. Montada uma vez;
     quando muda o espaço escolhido ou o estado dele, marca os degraus das funções do composto — só com o nome
     certo — com a cor da função, o papel no nome e um ponto que sobe do pé da coluna (animação do CSS).
     O app chama a cada atualização dos Resultados; a chave evita mexer no DOM sem necessidade. */
  sincronizarEscada(mostrar) {
    var box = document.getElementById('nc-escada-box'), ol = document.getElementById('nc-escada');
    if (!box || !ol) return;
    box.hidden = !mostrar;
    if (!mostrar) { this._escChave = null; return; }
    var classes = this._classes || (this._classes = Object.keys(Q3.Funcoes.POR_ID).map(function (id) { return { id: id, c: Q3.Funcoes.POR_ID[id] }; })
      .filter(function (o) { return o.c.prioridade <= 14; }).sort(function (a, b) { return a.c.prioridade - b.c.prioridade; }));
    if (ol.children.length !== classes.length) {
      ol.innerHTML = classes.map(function (o) {
        return '<li data-funcao="' + o.id + '"><span class="esc-n" aria-hidden="true">' + o.c.prioridade + '</span><span class="esc-nome">' + o.c.nome + '</span><span class="esc-papel"></span></li>';
      }).join('');
    }
    var e = this.espacos[this.sel], claro = Q3.Desenho.paleta().claro, ativos = e && e.estado === 'certo' && e.r.grupos ? e.r.grupos : [];
    var chave = this.sel + '|' + (claro ? 'c' : 'e') + '|' + ativos.map(function (g) { return g.id + ':' + g.papel + ':' + g.prefixo; }).join(',');
    if (chave === this._escChave) return;
    this._escChave = chave;
    var cores = typeof GF_CORES !== 'undefined' ? GF_CORES[claro ? 'claro' : 'escuro'] : {};
    var porCol = Math.ceil(classes.length / 2);
    classes.forEach(function (o, k) {
      var li = ol.children[k], g = ativos.filter(function (x) { return x.id === o.id; })[0];
      var papel = g ? (g.papel === 'sufixo' ? 'sufixo' : g.prefixo || 'prefixo') : '';
      li.classList.remove('esc-marcado'); void li.offsetWidth;   // tirar e pôr a classe reinicia a animação
      li.querySelector('.esc-papel').textContent = papel;
      if (g) {
        li.style.setProperty('--cor', cores[o.id] || '');
        // o ponto sobe do pé da coluna (o último degrau dela) até este degrau
        li.style.setProperty('--sobe', ((porCol - 1 - k % porCol) * ((li.offsetHeight || 18) + 2)) + 'px');
        li.classList.add('esc-marcado');
      } else { li.style.removeProperty('--cor'); li.style.removeProperty('--sobe'); }
      li.setAttribute('aria-label', 'Prioridade ' + o.c.prioridade + ': ' + o.c.nome + (g ? '. Neste composto: ' + (g.papel === 'sufixo' ? 'o sufixo' : 'o prefixo ' + papel) : ''));
    });
  }

  /* a conferência (ou o pedido de prever tudo antes), no alto dos Resultados */
  retorno() { return this._ret; }

  /* o que fazer agora, para o espaço escolhido */
  proximoPasso() {
    var self = this, e = this.espacos[this.sel];
    if (!this.espacos.some(Boolean)) return 'Comece pela Biblioteca: sorteie compostos reais, ou digite uma fórmula estrutural e ponha no espaço.';
    if (!e) return 'Este espaço está vazio: toque noutro cartão da doca, ou ponha uma estrutura nele pela Biblioteca.';
    var abertos = this.espacos.filter(function (x) { return x && x.estado !== 'certo' && x.estado !== 'fora'; });
    if (!abertos.length) return 'Toda a bancada conferida. Sorteie outros compostos na Biblioteca.';
    if (e.estado === 'fora') return 'Esta estrutura está fora do escopo do módulo (o motivo está abaixo). Toque noutro cartão da doca.';
    if (e.estado === 'certo') return 'Nome certo: veja na escada a função que virou sufixo e as que viraram prefixo. Toque noutro cartão da doca.';
    if (e.estado === 'rever') return 'A rever: mexa no nome em Nome completo e confira de novo.';
    if (!this._completa(e.prev)) return 'Monte o nome completo desta estrutura em Nome completo. A escada abaixo diz qual grupo vira o sufixo.';
    var faltam = abertos.filter(function (x) { return !self._completa(x.prev); }).length;
    return faltam ? 'Previsão feita. Toque noutro cartão da doca (falta' + (faltam > 1 ? 'm ' + faltam : ' 1') + ').' : 'Todas as previsões feitas: toque em Conferir as previsões, em Nome completo.';
  }

  /* A FICHA do espaço escolhido: o sinal do cartão em palavras, a fórmula e, com o nome certo, os nomes e onde
     o composto aparece */
  resultados() {
    var e = this.espacos[this.sel], M2 = NomeadorCadeias.prototype;
    var sit = { certo: 'nome certo ✓', rever: 'a rever ↺', fora: 'fora do escopo ⊘', previsto: 'previsão feita •', '': 'sem previsão' };
    var l = [{ l: 'Espaço', v: (this.sel + 1) + ' de ' + NC_ESPACOS }];
    if (this.contador) l.push({ l: 'Compostos', v: this.contador });
    if (!e) { l.push({ l: 'Situação', v: 'vazio' }); return l; }
    l.push({ l: 'Situação', v: sit[M2._sinalDe.call(this, e)], cls: e.estado === 'certo' ? 'val-ok' : e.estado === 'rever' ? 'val-warn' : '' });
    l.push({ l: 'Fórmula molecular', v: e.formula });
    if (e.estado === 'certo') {
      l.push({ l: 'Nome IUPAC', v: e.r.nome });
      if (e.comum) {
        l.push({ l: 'Nome comum', v: e.comum.comum });
        l.push({ l: 'Onde aparece', v: e.comum.onde.charAt(0).toUpperCase() + e.comum.onde.slice(1) + '.', cls: 'val-texto' });
      }
    }
    if (e.estado === 'fora' && e.r && e.r.motivo) l.push({ l: 'Motivo', v: e.r.motivo, cls: 'val-texto' });
    return l;
  }
  overlay() {
    var e = this.espacos[this.sel], sit = { certo: 'nome certo', rever: 'a rever', fora: 'fora do escopo', previsto: 'previsão feita', '': '' };
    var t = e ? sit[NomeadorCadeias.prototype._sinalDe.call(this, e)] : 'vazio';
    return 'espaço ' + (this.sel + 1) + (t ? ' · ' + t : '');
  }
}
