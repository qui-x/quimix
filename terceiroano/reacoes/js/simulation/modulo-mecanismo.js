/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/modulo-mecanismo.js (SIRO · o LABORATÓRIO DE SETAS)
   ───────────────────────────────────────────────────────────────
   O mesmo módulo serve à Adição, à Eliminação e à Substituição — cada uma
   com a sua biblioteca (a Combustão é um módulo filho: modulo-combustao.js).
   Um LABORATÓRIO, não um roteiro:
   · o aluno desenha setas (arrasto com imã ou toque) e APLICA: o motor faz o
     que ele pediu e mostra o resultado, seja o caminho dos livros ou não;
     só o que a química proíbe é recusado, com o motivo numa linha;
   · o painel MOSTRA, não explica: o resultado de cada passo são DADOS curtos
     (as ligações que mudaram, o que surgiu — carbocátion de que tipo, íons,
     radicais — e a energia), e o experimento continua dali; desfaz-se um
     passo ou recomeça-se. O porquê de cada passo da literatura fica no código
     (o campo explica dos modelos, js/core/mecanismo.js), fora do painel;
   · no estado ESTÁVEL: o produto, a classificação pelo resultado e a
     comparação com o produto da literatura;
   · o mecanismo da literatura é REFERÊNCIA: assiste-se a ele e volta-se ao
     experimento.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

class ModuloMecanismo {
  constructor(D, cfg) { this.D = D; this.cfg = cfg; this.ativo = false; this.cat = 'H2SO4'; this.n = 2; this.geradas = []; var C = cfg.construtor; this.con = { modo: 'geral', geral: C.gerais[0].id, n: C.gerais[0].n0 || 4, r2: C.reagentes2[0].id, msg: '' }; this.reiniciar(true); }
  _todas() { return this.geradas.concat(this.cfg.biblioteca); }
  /* as farpas que o laboratório completa (cfg.farpas: as regras extras de um módulo — a combustão usa { cadeia: true }) */
  _completar(S, setas) { return Q3.Mecanismo.completarFarpas(S, setas, this.cfg.farpas); }

  reiniciar(inicio) {
    this.reacao = null; this.mod = null; this.k = 0; this.setas = []; this.estado = 'vazio'; this.msg = ''; this.hist = []; this.lit = null;
    this.fonteToque = null; this.arr = null; this._geo = null; this._erro = '';
    if (!inicio) this._sync();
  }
  ativar() { this.ativo = true; this._ligar(); this._ligarBusca(); if (!this.reacao) this.carregar(this.cfg.biblioteca[0].id); this._sync(); }
  desativar() { this.ativo = false; this.arr = null; this.fonteToque = null; }
  overlay() { return this.cfg.nome; }
  mudarVista() { return false; }

  /* ══ A REAÇÃO ══════════════════════════════════════════════════ */
  carregar(id) {
    var r = this._todas().filter(function (x) { return x.id === id; })[0]; if (!r) return false;
    this.n = r.modelo === 'radicalar' ? 1 : 2;                          // a farpa já escolhida onde ela é a seta certa
    this.reacao = r; this._montar();
    announce('Reação: ' + r.nome + '.');
    this._sync(); return true;
  }
  _montar() {
    var r = this.reacao, M = Q3.Mecanismo, DM = Q3.DesenhoMecanismo;
    this.mod = M.modelos[r.modelo](r.substrato, r.catalisadores ? this.cat : r.reagente);
    this.k = 0; this.setas = []; this.fonteToque = null; this.msg = '';
    if (this.mod.naoAvanca) {                                       // o ácido fraco: só o substrato, parado
      var S = M.vazio(); M.substrato(S, r.substrato, 'a'); this.mod.inicio = S; this.estado = 'naoAvanca';
    } else this.estado = this.mod.semSetas ? 'semSetas' : 'lab';
    this._posicoes();                                                // o começo e as posições da literatura
    this.hist = [{ S: this.mod.inicio, pos: this.pos[0], desc: null }]; this.lit = null; this.anim = null;   // o experimento começa nos reagentes
  }

  /* ══ A DISPOSIÇÃO NA CENA ══════════════════════════════════════
     Os reagentes começam à DIREITA do substrato, como nos livros. Numa área MAIS ALTA QUE LARGA (o celular em pé,
     o computador com os dois cards abertos), lado a lado eles alargam o desenho, e a escala é a que cabe na
     largura: o desenho vira uma faixa no meio da tela. EMBAIXO do substrato, numa fileira, eles usam a altura que
     sobra, e o substrato fica com o que o primeiro reagente ataca virado para eles. Fica a disposição que deixa a
     ligação maior na tela; a de sempre só perde se a outra crescer pelo menos 8% (a água, o H₃O⁺ e o haleto juntos
     são largos demais numa fileira: ficam à direita). Nessa área a folga das bordas também é a justa
     (DM.FOLGA_JUSTA): só o que se desenha além dos átomos. Fora dela (computador, projetor, celular deitado),
     tudo como sempre. */
  _area(W, H) {
    var L = Q3.Moldura ? Q3.Moldura.livre(W, H, false) : null;     // abaixo da pílula do modo
    if (L && L.h > L.w) { L.retrato = true; L.folga = Q3.DesenhoMecanismo.FOLGA_JUSTA; return L; }
    return { x: W * 0.04, y: H * 0.08, w: W * 0.92, h: H * 0.84 };
  }
  /* as disposições possíveis: à direita (false) ou embaixo ('embaixo'), quando há reagentes */
  _formas() {
    var n = this.mod && this.mod.inicio ? Q3.Mecanismo.componentes(this.mod.inicio).filter(function (c) { return c.indexOf('a1') < 0; }).length : 0;
    return n ? [false, 'embaixo'] : [false];
  }
  /* quem reage primeiro, pela literatura: a primeira seta que liga um átomo do substrato a um de reagente —
     { alvo: o lado do substrato, reagente: o lado do reagente } (cada um { at } ou { lig }). Na halogenação por
     luz, o 1º passo só quebra o Cl–Cl: vale o 2º, o Cl• que tira o H. */
  _alvoLit() {
    var m = this.mod, M = Q3.Mecanismo; if (!m || !m.inicio || !m.passos) return {};
    var sub = M.componentes(m.inicio).filter(function (c) { return c.indexOf('a1') >= 0; })[0] || [], doSub = function (id) { return sub.indexOf(id) >= 0; };
    var copia = function (l) { return l.at ? { at: l.at } : { lig: l.lig.slice() }; };
    for (var k = 0; k < m.passos.length; k++) {
      var s = (m.passos[k].setas || []).filter(function (x) {
        var a = (x.de.at ? [x.de.at] : x.de.lig).concat(x.para.at ? [x.para.at] : x.para.lig);
        return a.some(doSub) && !a.every(doSub);
      })[0];
      if (s) { var deSub = s.de.at ? doSub(s.de.at) : s.de.lig.some(doSub); return { alvo: copia(deSub ? s.de : s.para), reagente: copia(deSub ? s.para : s.de) }; }
    }
    return {};
  }
  /* as posições do começo numa disposição (guardadas até a reação mudar) */
  _iniciais(forma) {
    var c = this._ini || (this._ini = {}), k = String(forma);
    return c[k] || (c[k] = Q3.DesenhoMecanismo.posicoesIniciais(this.mod.inicio, this.reacao.substrato, forma ? Object.assign(this._alvoLit(), this._embaixo(forma)) : false));
  }
  /* o jeito embaixo, com a forma da área: o arrumar põe o que sai onde a cena fica mais compacta nela */
  _embaixo(forma) { var a = this._areaUlt; return forma ? { aspecto: a && a.retrato ? a.w / a.h : 0.7 } : false; }
  _escolherForma(area) {
    if (!area || !area.retrato || !this.mod || !this.mod.inicio) return false;
    var chave = this._versao + '|' + Math.round(area.w) + 'x' + Math.round(area.h);
    if (this._formaCache && this._formaCache.chave === chave) return this._formaCache.forma;
    var DM = Q3.DesenhoMecanismo, self = this, esc = function (f) { return DM.transformar([self._iniciais(f)], area, 120, area.folga).esc; };
    var melhor = false, eM = esc(false) * 1.08;
    this._formas().slice(1).forEach(function (f) { var e = esc(f); if (e > eM) { eM = e; melhor = f; } });
    this._formaCache = { chave: chave, forma: melhor };
    return melhor;
  }
  /* as posições da reação: o começo na disposição escolhida e, a partir dele, os passos da literatura */
  _posicoes() {
    this._versao = (this._versao || 0) + 1; this._ini = null; this._formaCache = null;
    this._dispor(this._escolherForma(this._areaUlt));
  }
  _dispor(forma) {
    var DM = Q3.DesenhoMecanismo, self = this, ini = this._iniciais(forma), copia = {}, a = this._areaUlt;
    for (var id in ini) copia[id] = { x: ini[id].x, y: ini[id].y };   // a atração dos íons mexe nas posições da cena; as guardadas ficam intactas
    this.forma = forma; this._tf = null; this._aspDisp = forma && a && a.retrato ? a.w / a.h : null;   // a forma da área para a qual a cena foi arrumada
    this.pos = [copia];
    (this.mod.passos || []).forEach(function (p, i) { self.pos.push(DM.posicoesDepois(p.antes, p.depois, self.pos[i], self._embaixo(forma))); });
  }
  /* a área mudou de forma (o aparelho girou): a reação é redisposta inteira — a literatura e os passos já aplicados
     (as setas desenhadas e não aplicadas continuam: elas apontam para átomos, não para lugares). Embaixo, também
     quando a proporção da área muda mais de 15% (outra tela em pé): o que sai é arrumado para a forma dela. */
  _orientar(area) {
    this._areaUlt = area;
    if (!this.mod || !this.pos || !this.pos.length) return;
    var f = this._escolherForma(area), asp = area.retrato ? area.w / area.h : null;
    var outraProporcao = !!(f && f === this.forma && this._aspDisp && asp && Math.abs(asp - this._aspDisp) > 0.15 * this._aspDisp);
    if ((f === this.forma && !outraProporcao) || this.anim || this.mov || this.arr) return;   // no meio da animação ou de um gesto, depois
    if (outraProporcao && this._ini) delete this._ini[String(f)];
    var DM = Q3.DesenhoMecanismo, h = this.hist;
    this._dispor(f);
    if (h && h.length) { h[0].pos = this.pos[0]; for (var i = 1; i < h.length; i++) h[i].pos = DM.posicoesDepois(h[i - 1].S, h[i].S, h[i - 1].pos, this._embaixo(f)); }
    this.fonteToque = null;
  }
  _passo() { return this.mod && this.mod.passos ? this.mod.passos[this.k] : null; }
  /* o que está na cena agora: o estado e as posições */
  _cena() {
    var m = this.mod;
    if (this.estado === 'semSetas') return { S: m.produto, pos: this.pos[0] };
    if (this.estado === 'naoAvanca') return { S: m.inicio, pos: this.pos[0] };
    if (this.lit) { var k = this.lit.k; return this.lit.visto ? { S: m.passos[k].depois, pos: this.pos[k + 1] } : { S: m.passos[k].antes, pos: this.pos[k] }; }
    var t = this.hist[this.hist.length - 1]; return { S: t.S, pos: t.pos };
  }

  /* ══ AS SETAS DO ALUNO ═════════════════════════════════════════ */
  _fonteDe(e) { return e.lig ? { lig: e.lig, lado: e.lado } : { at: e.at }; }
  _paraDe(e) { return e.lig ? { lig: e.lig } : { at: e.at }; }
  /* O GESTO "LEVAR O ÍON ATÉ O ALVO": vira a seta certa — dos elétrons (o doador) até o íon positivo */
  /* pegar um íon livre: pelo círculo da carga, ou pelo símbolo (perto do centro — os pares em volta continuam
     sendo o início das setas) */
  _ionEm(x, y) {
    var enc = this._geo ? this._geo.encaixes : null; if (!enc) return null;
    var S = this._cena().S, livres = this._ionsLivres(S), self = this;
    var dono = function (id) { return livres.filter(function (l) { return l.ids.indexOf(id) >= 0; })[0]; };
    var cg = this._maisPerto((enc.cargas || []).filter(function (c) { return dono(c.at); }), x, y, 16);
    var at = cg || this._maisPerto(enc.atomos.filter(function (a) { return dono(a.at); }), x, y, 13);
    if (!at) return null; var l = dono(at.at), T = this._geo.T, p0 = T(at.at);
    return { ids: l.ids.join(','), lista: l.ids, ancora: at.at, dx: p0.x - x, dy: p0.y - y, moveu: false };
  }
  _moverIon(x, y) {
    var m = this.mov, topo = this.hist[this.hist.length - 1], g = this._geo; if (!m || !g) return;
    var T = g.T, p0 = T(m.ancora), esc = g.esc, ddx = (x + m.dx - p0.x) / esc, ddy = (y + m.dy - p0.y) / esc;
    if (Math.abs(ddx) + Math.abs(ddy) > 0.01) m.moveu = true;
    m.lista.forEach(function (id) { topo.pos[id].x += ddx; topo.pos[id].y += ddy; });
    if (topo.vel) topo.vel[m.ids] = { x: 0, y: 0 };
  }
  /* soltar: a atração termina o caminho; em CONTATO com a carga oposta, a seta certa é SUGERIDA (dos elétrons ao íon +) */
  _soltarIon(m) {
    var M = Q3.Mecanismo, topo = this.hist[this.hist.length - 1], S = topo.S, pos = topo.pos, self = this;
    var ion = this._ionsLivres(S).filter(function (l) { return l.ids.join(',') === m.ids; })[0]; if (!ion) return;
    var alvo = this._alvoDoIon(S, pos, ion, {}); if (!alvo) { this._sync(); return; }
    var dist = Math.hypot(pos[alvo.de].x - pos[alvo.at].x, pos[alvo.de].y - pos[alvo.at].y);
    if (dist > 3.2) { this.nota = 'Solte mais perto da carga oposta.'; this._sync(); return; }
    // quem tem o par e quem recebe: o negativo dá; o positivo (sem par para dar, com espaço) recebe
    var neg = M.carga(S, alvo.de) < 0 ? alvo.de : alvo.at, pos2 = neg === alvo.de ? alvo.at : alvo.de;
    if (!(S.at[neg].nb >= 2) || !this._eletrofilo(pos2)) { this.nota = 'Sem par livre para atacar.'; this._sync(); return; }
    var seta = { n: 2, de: { at: neg }, para: { at: pos2 }, k: 0.3, nasce: performance.now(), sugerida: true };
    if (!this.setas.some(function (s) { return s.de.at === neg && s.para.at === pos2; })) this.setas.push(seta);
    this.n = 2;
    this.nota = 'Seta sugerida: par do ' + this._nomeAt(neg) + ' → ' + this._nomeAt(pos2) + '⁺.';
    this._sync(); announce(this.nota);
  }
  _acrescentarInvertida(eletrofilo, doador) {
    var d = doador.viaCarga || doador, E = this._geo ? this._geo.encaixes.atomos.filter(function (a) { return a.at === eletrofilo.at; })[0] : null;
    if (!E) return false;
    var ok = this._acrescentar(d, E);
    if (ok) {
      var S = this._cena().S, nomeE = S.at[eletrofilo.at].el + '⁺', ultimo = this.setas[this.setas.length - 1];
      var deQuem = ultimo.de.at ? 'o par de ' + this._nomeAt(ultimo.de.at) : 'a ligação ' + this._nomeAt(ultimo.de.lig[0]) + (Q3.Mecanismo.ordemLig ? '' : '') + '–' + this._nomeAt(ultimo.de.lig[1]);
      this.nota = 'Seta corrigida (sai dos elétrons): ' + deQuem + ' → ' + nomeE + '.';
      this._sync(); announce(this.nota);
    }
    return ok;
  }
  _acrescentar(fonte, alvo, curvaPx) {
    if (fonte.at && alvo.at && fonte.at === alvo.at) return false;
    var L = Math.hypot(alvo.x - fonte.x, alvo.y - fonte.y) || 1, k;
    if (typeof curvaPx === 'number' && Math.abs(curvaPx) >= 10) k = Math.max(0.16, Math.min(0.55, Math.abs(curvaPx) / L)) * (curvaPx > 0 ? 1 : -1);   // a curva do gesto
    else k = 0.32 * Q3.DesenhoMecanismo.ladoLivre(this._geo ? this._geo.encaixes.atomos : [], fonte.x, fonte.y, alvo.x, alvo.y, 0.32 * L);           // o lado mais livre
    var de = this._fonteDe(fonte), para = this._paraDe(alvo);
    if (de.lig && !de.lado && para.at && de.lig.indexOf(para.at) < 0 && this._geo) {     // ligação simples → átomo de fora: o lado mais perto
      var T = this._geo.T, ta = T(de.lig[0]), tb = T(de.lig[1]), ty = T(para.at);
      de.lado = Math.hypot(ta.x - ty.x, ta.y - ty.y) <= Math.hypot(tb.x - ty.x, tb.y - ty.y) ? de.lig[0] : de.lig[1];
    }
    this.setas.push({ n: this.n, de: de, para: para, k: k, nasce: performance.now() });
    this.msg = '';
    announce('Seta ' + this.setas.length + ': ' + this._descSeta(this.setas[this.setas.length - 1]) + '.');
    this._sync(); return true;
  }
  _nomeAt(id) { var S = this._cena().S, a = S.at[id]; return a ? (a.el === 'C' ? 'C' : a.el) : '?'; }
  _descSeta(s) {
    var f = s.de.at ? (s.n === 2 ? 'par de ' : 'elétron de ') + this._nomeAt(s.de.at) : 'ligação ' + this._nomeAt(s.de.lig[0]) + (this._ordem(s.de.lig) >= 2 ? '=' : '–') + this._nomeAt(s.de.lig[1]);
    var d = s.para.at ? this._nomeAt(s.para.at) : 'ligação ' + this._nomeAt(s.para.lig[0]) + '–' + this._nomeAt(s.para.lig[1]);
    return (s.n === 1 ? 'farpa: ' : '') + f + ' → ' + d;
  }
  _ordem(lig) { var S = this._cena().S, k = Q3.Mecanismo.chaveLig(lig[0], lig[1]); return (S.lig[k] || 0) / 2; }
  /* a seta na tela, a partir dos encaixes da cena (a fonte: o par do átomo / a ligação; o destino: o átomo / o meio da ligação) */
  _pontos(s, enc) {
    var acha = function (lista, f) { for (var i = 0; i < lista.length; i++) if (f(lista[i])) return lista[i]; return null; };
    var mesma = function (a, b) { return a && b && ((a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0])); };
    var o = s.de.at ? ((s.n === 1 && acha(enc.pares, function (p) { return p.at === s.de.at && p.radical; })) || acha(enc.pares, function (p) { return p.at === s.de.at && !p.radical; }) || acha(enc.pares, function (p) { return p.at === s.de.at; }) || acha(enc.atomos, function (p) { return p.at === s.de.at; }))
                    : acha(enc.ligacoes, function (l) { return mesma(l.lig, s.de.lig) && (s.de.lado ? l.lado === s.de.lado : !l.lado); }) || acha(enc.ligacoes, function (l) { return mesma(l.lig, s.de.lig); });
    var at = function (id) { return acha(enc.atomos, function (p) { return p.at === id; }); };
    var d = s.para.at ? at(s.para.at) : acha(enc.ligacoes, function (l) { return mesma(l.lig, s.para.lig) && !l.lado; });
    if (!d && s.para.lig) { var u = at(s.para.lig[0]), v = at(s.para.lig[1]); if (u && v) return { x0: o ? o.x : 0, y0: o ? o.y : 0, x1: (u.x + v.x) / 2, y1: (u.y + v.y) / 2, n: s.n, ok: !!o }; }   // a ligação que ainda vai se formar: o meio
    if (!o || !d) return null;
    if (s.n === 1 && s.de.at && s.para.at) { var fa = at(s.de.at); if (fa) return { x0: o.x, y0: o.y, x1: (fa.x + d.x) / 2, y1: (fa.y + d.y) / 2, n: 1 }; }   // a farpa que FORMA ligação termina no meio dela
    var dx = d.x - o.x, dy = d.y - o.y, L = Math.hypot(dx, dy) || 1, recuo = d.r ? d.r + 3 : 6;
    return { x0: o.x, y0: o.y, x1: d.x - dx / L * recuo, y1: d.y - dy / L * recuo, n: s.n };
  }

  /* ══ OS GESTOS: arrastar com imã · tocar fonte e destino ═══════ */
  _maisPerto(lista, x, y, raio) { var m = null, dm = raio; lista.forEach(function (e) { var d = Math.hypot(e.x - x, e.y - y); if (d < dm) { dm = d; m = e; } }); return m; }
  _fontes() { var enc = this._geo ? this._geo.encaixes : { pares: [], ligacoes: [] }; return enc.pares.concat(enc.ligacoes); }
  /* a fonte mais perto do dedo; tocar no SÍMBOLO de um átomo com pares também vale (o par mais perto do dedo) */
  /* um ELETRÓFILO para levar: carga + e espaço para um par (o H⁺ sem elétrons; o C⁺, o X⁺ com seis) */
  _eletrofilo(id) {
    var S = this._cena().S, M = Q3.Mecanismo, a = S.at[id]; if (!a || M.carga(S, id) <= 0) return false;
    return a.el === 'H' ? M.eletrons(S, id) === 0 : M.eletrons(S, id) < 8;
  }
  /* os DOADORES (onde há elétrons para atacar): os pares, as ligações, e um ânion pela carga */
  _doadores(excluir) {
    var enc = this._geo ? this._geo.encaixes : null; if (!enc) return [];
    var self = this, pares = enc.pares.filter(function (p) { return !p.radical && p.at !== excluir; });
    var anions = (enc.cargas || []).filter(function (c) { return c.q < 0 && c.at !== excluir; }).map(function (c) { var pp = pares.filter(function (p) { return p.at === c.at; })[0]; return pp ? { at: c.at, x: c.x, y: c.y, viaCarga: pp } : null; }).filter(Boolean);
    return pares.concat(enc.ligacoes.filter(function (l) { return l.lig.indexOf(excluir) < 0; })).concat(anions);
  }
  _fonteEm(x, y) {
    var enc0 = this._geo ? this._geo.encaixes : null, self = this;
    // o ÍON pela carga: um ânion dá o seu par; um cátion sem elétrons para dar é levado (o gesto é traduzido)
    var cg = enc0 ? this._maisPerto((enc0.cargas || []), x, y, 16) : null;
    if (cg && cg.q < 0) { var pc = this._maisPerto(enc0.pares.filter(function (p) { return p.at === cg.at && !p.radical; }), x, y, 999); if (pc) return pc; }
    if (cg && cg.q > 0 && this._eletrofilo(cg.at) && this.toqueMode) return { at: cg.at, x: cg.x, y: cg.y, eletrofilo: true };
    var f = this._maisPerto(this._fontes(), x, y, 30); if (f) return f;
    var enc = this._geo ? this._geo.encaixes : null; if (!enc) return null;
    var el = this.toqueMode ? this._maisPerto(enc.atomos.filter(function (a) { return self._eletrofilo(a.at); }), x, y, 20) : null;
    if (el) return { at: el.at, x: el.x, y: el.y, eletrofilo: true };
    var at = this._maisPerto(enc.atomos.filter(function (a) { return enc.pares.some(function (p) { return p.at === a.at; }); }), x, y, 20);
    return at ? this._maisPerto(enc.pares.filter(function (p) { return p.at === at.at; }), x, y, 999) : null;
  }
  _alvos() { var enc = this._geo ? this._geo.encaixes : { atomos: [], ligacoes: [], pares: [] }; return enc.atomos.concat(enc.ligacoes.filter(function (l) { return !l.lado; })).concat((enc.pares || []).filter(function (p) { return p.radical; }).map(function (p) { return { at: p.at, x: p.x, y: p.y, r: 0, radical: true }; })); }   // o ⊙ de um radical também é destino
  _podeDesenhar() { return this.ativo && this.estado === 'lab' && !this.lit && !this.anim && this._geo; }   // na animação (e na espera dela), não
  _ligar() {
    if (this._ligado) return; this._ligado = true;
    var self = this, cv = document.getElementById('sim-canvas'); if (!cv) return;
    var ponto = function (ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left - (cv.cenaX || 0), y: ev.clientY - r.top }; }   // na cena (a área livre do card flutuante);
    cv.addEventListener('pointerdown', function (ev) {
      if (!self._podeDesenhar()) return; var p = ponto(ev);
      var ion = self._ionEm(p.x, p.y);
      if (ion) { self.mov = ion; self.nota = ''; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} self._toqueUsado = false; return; }   // pegou o ÍON: ele vai junto
      var f = self._fonteEm(p.x, p.y);
      if (f && !self.fonteToque) { self.arr = { fonte: f, x: p.x, y: p.y, x0: p.x, y0: p.y, moveu: false, trilha: [{ x: p.x, y: p.y }] }; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} }
    });
    cv.addEventListener('pointermove', function (ev) {
      if (self.mov) { var pm = ponto(ev); self._moverIon(pm.x, pm.y); return; }
      if (!self.arr) return; var p = ponto(ev); self.arr.x = p.x; self.arr.y = p.y; self.arr.trilha.push({ x: p.x, y: p.y });
      if (Math.hypot(p.x - self.arr.x0, p.y - self.arr.y0) > 8) self.arr.moveu = true;
      self.arr.alvo = self.arr.fonte.eletrofilo ? self._maisPerto(self._doadores(self.arr.fonte.at), p.x, p.y, 30)    // levando o íon: o imã estala nos elétrons
                    : self._maisPerto(self._alvos().filter(function (a) { return a.at !== self.arr.fonte.at; }), p.x, p.y, 30);   // o imã: estala no destino
    });
    var fim = function () {
      if (self.mov) { var m0 = self.mov; self.mov = null; if (m0.moveu) { self._soltarIon(m0); self._toqueUsado = true; } return; }
      var a = self.arr; self.arr = null; if (!a) return;
      if (a.moveu) { if (a.alvo) { if (a.fonte.eletrofilo) self._acrescentarInvertida(a.fonte, a.alvo); else self._acrescentar(a.fonte, a.alvo, Q3.DesenhoMecanismo.curvaDoGesto(a.trilha, a.fonte.x, a.fonte.y, a.alvo.x, a.alvo.y)); } self._toqueUsado = true; }
    };
    cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', function () { self.arr = null; });
  }
  tocar(x, y) {                                                     // o modo por toque: fonte, depois destino
    if (this._toqueUsado) { this._toqueUsado = false; return true; }
    if (!this._podeDesenhar()) return false;
    if (!this.fonteToque) {
      this.toqueMode = true; var f = this._fonteEm(x, y); this.toqueMode = false;
      if (f) { this.fonteToque = f; announce(f.eletrofilo ? 'Íon escolhido: o ' + this._nomeAt(f.at) + '⁺. Toque nos elétrons que vão atacá-lo.' : 'Fonte escolhida: ' + (f.lig ? 'a ligação' : 'o par de ' + this._nomeAt(f.at)) + '. Toque no destino.'); return true; }
      return false;
    }
    var self = this, f2 = this.fonteToque;
    var alvo = f2.eletrofilo ? this._maisPerto(this._doadores(f2.at), x, y, 30) : this._maisPerto(this._alvos().filter(function (a) { return a.at !== self.fonteToque.at; }), x, y, 30);
    this.fonteToque = null;
    if (alvo) return f2.eletrofilo ? this._acrescentarInvertida(f2, alvo) : this._acrescentar(f2, alvo);
    announce('Toque fora de um destino: a fonte foi solta.'); return true;
  }
  navegar() { return false; }
  /* ══ A ATRAÇÃO ENTRE OS ÍONS ════════════════════════════════════
     cada íon LIVRE (sem carbono, com carga) é atraído pela carga OPOSTA mais próxima da molécula orgânica
     (a âncora, que fica parada) e desliza — mola com amortecimento — até o CONTATO, no espaço livre em volta do
     átomo carregado. Sem carga oposta na orgânica, o íon menor vai até o íon livre de carga oposta. Dois íons
     que miram o mesmo átomo se repartem os espaços livres. Nada reage sozinho: a atração só aproxima. */
  _ionsLivres(S) {
    var M = Q3.Mecanismo;
    return M.componentes(S).map(function (c) { return { ids: c, q: c.reduce(function (t, id) { return t + M.carga(S, id); }, 0), temC: c.some(function (id) { return S.at[id].el === 'C'; }) }; })
      .filter(function (x) { return x.q !== 0 && !x.temC; });
  }
  _alvoDoIon(S, pos, ion, ocupados) {
    var M = Q3.Mecanismo, DM = Q3.DesenhoMecanismo, self = this;
    var carregado = ion.ids.filter(function (id) { return M.carga(S, id) !== 0; })[0] || ion.ids[0];
    var cand = Object.keys(S.at).filter(function (id) { return pos[id] && ion.ids.indexOf(id) < 0 && M.carga(S, id) * ion.q < 0; });
    var naOrg = cand.filter(function (id) { return M.componentes(S).some(function (c) { return c.indexOf(id) >= 0 && c.some(function (x) { return S.at[x].el === 'C'; }); }); });
    if (naOrg.length) cand = naOrg;
    else cand = cand.filter(function (id) { var outro = self._ionsLivres(S).filter(function (x) { return x.ids.indexOf(id) >= 0; })[0]; return outro && (outro.ids.length > ion.ids.length || (outro.ids.length === ion.ids.length && outro.ids[0] < ion.ids[0])); });   // só o menor vai
    if (!cand.length) return null;
    var pc = pos[carregado], alvoAt = cand.sort(function (a, b) { return Math.hypot(pos[a].x - pc.x, pos[a].y - pc.y) - Math.hypot(pos[b].x - pc.x, pos[b].y - pc.y); })[0];
    var pa = pos[alvoAt], ocup = M.vizinhos(S, alvoAt).filter(function (v) { return pos[v] && ion.ids.indexOf(v) < 0; }).map(function (v) { return Math.atan2(pos[v].y - pa.y, pos[v].x - pa.x); });
    var semIon = {}; Object.keys(pos).forEach(function (id) { if (ion.ids.indexOf(id) < 0) semIon[id] = pos[id]; });   // o ponto de contato SEM o íon na cena: fixo, não foge dele
    var hi = DM.hImplicitos(S, semIon); (hi[alvoAt] || []).forEach(function (h) { ocup.push(h.ang); });
    var dc = 1.35, tomados = ocupados.__pontos || (ocupados.__pontos = []);
    tomados.forEach(function (t) { if (Math.hypot(t.x - pa.x, t.y - pa.y) < dc + 1.3) ocup.push(Math.atan2(t.y - pa.y, t.x - pa.x)); });   // o lugar de outro íon conta como ocupado
    var difA = function (a, b) { var d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
    var chegada = Math.atan2(pc.y - pa.y, pc.x - pa.x), ang = null, melhor = Infinity;
    for (var g = 0; g < 36; g++) {                                     // o espaço livre (a mais de 50° de tudo) mais perto do LADO DE CHEGADA
      var a = g * Math.PI / 18; if (ocup.some(function (o) { return difA(o, a) < 0.87; })) continue;
      var dd = difA(a, chegada); if (dd < melhor) { melhor = dd; ang = a; }
    }
    if (ang == null) ang = DM.angulosLivres(ocup, 1)[0];
    tomados.push({ x: pa.x + Math.cos(ang) * dc, y: pa.y + Math.sin(ang) * dc });
    return { at: alvoAt, de: carregado, x: pa.x + Math.cos(ang) * dc, y: pa.y + Math.sin(ang) * dc };
  }
  atualizar() {
    /* A ATRAÇÃO COMO CAMINHO (não só forças, que prendem o íon em bolsões): cada íon livre vai até o ponto de
       CONTATO junto à carga oposta (o espaço livre ao lado dela, calculado sem o íon — fixo). Caminho reto livre:
       vai direto; átomos no caminho: CONTORNA a molécula por fora, numa órbita, até o caminho reto se abrir.
       Rápido no começo, devagar ao chegar. Nada reage sozinho: a atração só aproxima. */
    if (!this.ativo || this.estado !== 'lab' || this.lit || this.anim || !this.hist.length) { this._tFis = null; return; }
    var M = Q3.Mecanismo, DM = Q3.DesenhoMecanismo, topo = this.hist[this.hist.length - 1], S = topo.S, pos = topo.pos, self = this;
    var agora = performance.now(), dt = this._tFis ? Math.min(0.15, (agora - this._tFis) / 1000) : 0.016; this._tFis = agora;
    var ions = this._ionsLivres(S); this._atracoes = []; if (!ions.length) return;
    var idsIons = {}; ions.forEach(function (l) { l.ids.forEach(function (id) { idsIons[id] = true; }); });
    var fixos = {}; Object.keys(pos).forEach(function (id) { if (!idsIons[id]) fixos[id] = pos[id]; });
    var obst = Object.keys(fixos).map(function (id) { return { x: fixos[id].x, y: fixos[id].y, id: id }; });
    var hi = DM.hImplicitos(S, fixos); Object.keys(hi).forEach(function (id) { hi[id].forEach(function (h) { obst.push({ x: h.x, y: h.y, id: id + '~h', dono: id }); }); });
    var ocupados = {};
    ions.slice().sort(function (a, b) { return a.ids[0] < b.ids[0] ? -1 : 1; }).forEach(function (ion) {
      var chave = ion.ids.join(','); if (self.mov && self.mov.ids === chave) return;          // o aluno está levando este
      var alvo = self._alvoDoIon(S, pos, ion, ocupados); if (!alvo) return;
      var c = alvo.de, pc = pos[c], P = { x: alvo.x, y: alvo.y }, dx = P.x - pc.x, dy = P.y - pc.y, d = Math.hypot(dx, dy);
      self._atracoes.push({ de: c, para: alvo.at, forca: Math.max(0.2, Math.min(1, d / 2 + 0.2)) });
      if (d < 0.02) return;
      // o caminho reto está livre? (nenhum átomo ou H desenhado a menos de 0,75 do segmento, fora o par)
      var livre = obst.every(function (q) {
        if (q.id === alvo.at || q.dono === alvo.at) return true;
        var t = ((q.x - pc.x) * dx + (q.y - pc.y) * dy) / (d * d); if (t <= 0.02 || t >= 1) return true;
        return Math.hypot(q.x - (pc.x + dx * t), q.y - (pc.y + dy * t)) > 0.75;
      });
      var vel = Math.min(livre ? 2.8 : 4.2, 0.6 + d * 2.2), passo = Math.min(d, vel * dt), mx, my;   // mais rápido na órbita, longe de tudo
      if (livre) { mx = dx / d * passo; my = dy / d * passo; }
      else {                                                            // CONTORNAR por fora: a órbita em volta da molécula do par
        var comp = M.componentes(S).filter(function (cc) { return cc.indexOf(alvo.at) >= 0; })[0] || [];
        var pes = comp.filter(function (id) { return pos[id] && S.at[id].el !== 'H'; }), gx = 0, gy = 0;
        pes.forEach(function (id) { gx += pos[id].x / pes.length; gy += pos[id].y / pes.length; });
        var Rm = Math.max.apply(null, pes.map(function (id) { return Math.hypot(pos[id].x - gx, pos[id].y - gy); })) + 1.1;
        var ri = Math.hypot(pc.x - gx, pc.y - gy), ai = Math.atan2(pc.y - gy, pc.x - gx), ap = Math.atan2(P.y - gy, P.x - gx);
        var dA = Math.atan2(Math.sin(ap - ai), Math.cos(ap - ai)), R = Rm;                // a órbita ENCOLHE até a molécula: o íon fica à vista
        var a2 = ai + Math.sign(dA || 1) * Math.min(Math.abs(dA), passo / R), r2 = ri + Math.max(-passo, Math.min(passo, R - ri));
        mx = gx + Math.cos(a2) * r2 - pc.x; my = gy + Math.sin(a2) * r2 - pc.y;
      }
      ion.ids.forEach(function (id) { pos[id].x += mx; pos[id].y += my; });
    });
  }



  /* ══ A CENA ═══════════════════════════════════════════════════ */
  desenhar(ctx, W, H) {
    this.atualizar();                                               // a física dos íons a CADA QUADRO (o relógio é dela)
    if (!this.mod) return;
    var area = this._area(W, H); this._orientar(area);               // a disposição segue a forma da área
    var P = Q3.Desenho.paleta(), c = this._cena(), self = this;
    var DM0 = Q3.DesenhoMecanismo;
    if (this.anim) { this._desenharAnimacao(ctx, P, DM0.transformar([this.anim.posA, this.anim.posB, this.hist[0].pos], area, 120, area.folga)); return; }
    var chaveTf = this.hist.length + '|' + (this.lit ? 'lit' + this.lit.k : '') + '|' + Math.round(area.w) + 'x' + Math.round(area.h);
    if (this._tf && this._tf.chave !== chaveTf) this._tf = null;
    var tf = this.estado === 'lab' || this.lit ? (this._tf ? this._tf.tf : (this._tf = { chave: chaveTf, tf: DM0.transformar([this.hist[0].pos, c.pos], area, 120, area.folga) }).tf) : null;   // FIXO por passo: os íons se movem sem a cena respirar
    // primeiro o desenho (para os encaixes), depois as setas sobre ele
    var geo = DM0.desenhar(ctx, c.S, c.pos, area, P, { transform: tf });
    this._geo = geo;
    var DM = Q3.DesenhoMecanismo, agora = performance.now(), fundo = P.fundo;
    if (this.estado === 'lab' && !this.lit && this._atracoes && geo.T) this._atracoes.forEach(function (a) {   // a ATRAÇÃO: pontilhado entre as cargas opostas
      var pa = geo.T(a.de), pb = geo.T(a.para); ctx.save(); ctx.globalAlpha = 0.25 + 0.5 * a.forca; ctx.setLineDash([2, 6]); ctx.lineCap = 'round'; ctx.strokeStyle = P.acento; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.restore();
    });
    if (this.estado === 'lab' && !this.lit && this.setas.length) {   // as farpas que o laboratório vai completar: TRACEJADAS, na hora
      var topoC = this.hist[this.hist.length - 1];
      try { this._completar(topoC.S, this.setas).adicionadas.forEach(function (s) {
        var q = self._pontos(s, geo.encaixes); if (!q) return; var L = Math.hypot(q.x1 - q.x0, q.y1 - q.y0);
        ctx.save(); ctx.setLineDash([5, 4]); ctx.globalAlpha = 0.85; Q3.DesenhoMecanismo.seta(ctx, q.x0, q.y0, q.x1, q.y1, 1, P.acento, -0.32 * Math.max(30, L), 1, P.fundo); ctx.restore();
      }); } catch (e) {}
    }
    if (this.estado === 'lab' && !this.lit) this.setas.forEach(function (s) {
      var q = self._pontos(s, geo.encaixes); if (!q) return;
      var L = Math.hypot(q.x1 - q.x0, q.y1 - q.y0), curva = (s.k >= 0 ? 1 : -1) * Math.max(18, Math.abs(s.k || 0.32) * L);
      DM.seta(ctx, q.x0, q.y0, q.x1, q.y1, s.n, P.acento, curva, Math.min(1, (agora - (s.nasce || 0)) / 220), fundo);   // nasce crescendo
    });
    if (this.arr && this.arr.moveu && this.arr.fonte.eletrofilo) {   // LEVANDO O ÍON: tracejado até o dedo; com destino, a seta certa (dos elétrons ao íon)
      var aE = this.arr; ctx.save();
      if (aE.alvo) { var dA = aE.alvo.viaCarga || aE.alvo; ctx.globalAlpha = 0.9; DM.seta(ctx, dA.x, dA.y, aE.fonte.x, aE.fonte.y, this.n, P.acento, 0.32 * Math.hypot(aE.fonte.x - dA.x, aE.fonte.y - dA.y), 1, fundo); }
      else { ctx.setLineDash([5, 5]); ctx.strokeStyle = P.acento; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(aE.fonte.x, aE.fonte.y); ctx.lineTo(aE.x, aE.y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = P.acento; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(aE.x, aE.y, 14, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    } else if (this.arr && this.arr.moveu) {                              // a seta sendo puxada
      var a = this.arr, mira = { x: a.x, y: a.y };
      if (a.alvo) { var vx = a.alvo.x - a.fonte.x, vy = a.alvo.y - a.fonte.y, vl = Math.hypot(vx, vy) || 1, rc = a.alvo.r ? a.alvo.r + 3 : 6; mira = { x: a.alvo.x - vx / vl * rc, y: a.alvo.y - vy / vl * rc }; }   // para onde a seta final para
      a.cab = a.cab ? { x: a.cab.x + (mira.x - a.cab.x) * 0.35, y: a.cab.y + (mira.y - a.cab.y) * 0.35 } : mira;   // desliza até o destino
      var perto = this._maisPerto(this._alvos().filter(function (t) { return t.at !== a.fonte.at; }), a.x, a.y, 64);
      if (perto) { var dd = Math.hypot(perto.x - a.x, perto.y - a.y), al = Math.max(0, 1 - dd / 64); ctx.save(); ctx.fillStyle = biRgbaSiro(P.acento, 0.12 + 0.28 * al); ctx.beginPath(); ctx.arc(perto.x, perto.y, 13 + 8 * al, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }   // o imã acende
      var Lg = Math.hypot(a.cab.x - a.fonte.x, a.cab.y - a.fonte.y), cg = DM.curvaDoGesto(a.trilha, a.fonte.x, a.fonte.y, a.cab.x, a.cab.y);
      if (Math.abs(cg) < 10) cg = 0.32 * Lg * DM.ladoLivre(geo.encaixes.atomos, a.fonte.x, a.fonte.y, a.cab.x, a.cab.y, 0.32 * Lg);
      ctx.save(); ctx.globalAlpha = a.alvo ? 0.9 : 0.6; DM.seta(ctx, a.fonte.x, a.fonte.y, a.cab.x, a.cab.y, this.n, P.acento, Math.sign(cg) * Math.max(14, Math.min(Math.abs(cg), 0.55 * Lg)), 1, fundo); ctx.restore();
    }
    if (this.fonteToque) { ctx.save(); ctx.strokeStyle = P.acento; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(this.fonteToque.x, this.fonteToque.y, 15, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  }

  /* ══ A DEMONSTRAÇÃO DO PASSO ═══════════════════════════════════
     fase A: as setas aparecem sobre o "antes", uma de cada vez (ao revelar) ou já inteiras (ao acertar);
     fase B: os elétrons andam pelas setas (dois pontos: um par; um ponto: a farpa), as ligações se desfazem
     e se formam, os átomos que mudam de molécula se deslocam, e chega-se ao intermediário. */
  _animar(o) {                                                     // o: { antes, depois, posA, posB, setas, uma (uma seta por vez), espera (ms parados antes), aoFim }
    var menos = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // durante a espera, o relógio da animação ainda não começou: a cena mostra o "antes" com as setas, parada
    this.anim = Object.assign({}, o, { setas: o.setas.map(function (x) { return Object.assign({}, x); }), t0: performance.now() + (o.espera || 0), lento: menos ? 0.3 : 1 });
    this._sync();
  }
  /* a gaveta de baixo do celular (bottom sheet), se estiver aberta: recolhe e devolve true (ui/offcanvas-mobile.js) */
  _recolherGaveta() {
    if (typeof document === 'undefined' || typeof window._closeSidebar !== 'function') return false;
    if (!document.querySelector('#sidebar-right.mobile-open, #sidebar-left.mobile-open')) return false;
    window._closeSidebar(); return true;
  }
  _duracoes() { var a = this.anim, A = (a.uma ? a.setas.length * 0.5 + 0.25 : 0.35) * a.lento, B = 2.0 * a.lento; return { A: A, B: B }; }
  _desenharAnimacao(ctx, P, tf) {
    var DM = Q3.DesenhoMecanismo, a = this.anim, p = { antes: a.antes, depois: a.depois }, d = this._duracoes(), dt = (performance.now() - a.t0) / 1000, self = this, fundo = P.fundo;
    var posA = a.posA, posB = a.posB, area = { x: 0, y: 0, w: 1, h: 1 };
    var suave = function (x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
    var t = dt < d.A ? 0 : Math.min(1, (dt - d.A) / d.B), sM = suave((t - 0.3) / 0.7);
    var pos = DM.interpolar(posA, posB, sM);
    // o antes (some) e o depois (aparece), nas mesmas posições a meio caminho
    var geoA = DM.desenhar(ctx, p.antes, dt < d.A ? posA : pos, area, P, { transform: tf, alpha: 1 - sM });
    if (sM > 0) DM.desenhar(ctx, p.depois, pos, area, P, { transform: tf, alpha: sM });
    if (dt < d.A || t < 0.65) {
      if (!a.enc) a.enc = DM.desenhar(ctx, p.antes, posA, area, P, { transform: tf, alpha: 0 }).encaixes;   // os encaixes do "antes" intacto (invisível), guardados no 1º quadro
      var geoSetas = { encaixes: a.enc };
      a.setas.forEach(function (s, i) {
        var q = self._pontos(s, geoSetas.encaixes); if (!q) return;
        if (s.k == null) s.k = 0.32 * DM.ladoLivre(geoSetas.encaixes.atomos, q.x0, q.y0, q.x1, q.y1, 0.32 * Math.hypot(q.x1 - q.x0, q.y1 - q.y0));
        var L = Math.hypot(q.x1 - q.x0, q.y1 - q.y0), curva = (s.k >= 0 ? 1 : -1) * Math.max(18, Math.abs(s.k) * L);
        var prog = a.uma ? Math.max(0, Math.min(1, (dt - i * 0.5 * a.lento) / (0.45 * a.lento))) : 1;
        ctx.save(); ctx.globalAlpha = 1 - suave(t / 0.6); if (s.completada) ctx.setLineDash([5, 4]); DM.seta(ctx, q.x0, q.y0, q.x1, q.y1, s.n, P.acento, curva, prog, fundo); ctx.restore();   // as completadas, tracejadas
        if (t > 0) {                                                // os elétrons andam pela seta
          var u = suave(t / 0.5), e = DM.pontoNaSeta(q.x0, q.y0, q.x1, q.y1, curva, u), dx = q.x1 - q.x0, dy = q.y1 - q.y0, n = Math.hypot(dx, dy) || 1;
          ctx.save(); ctx.fillStyle = P.acento; ctx.globalAlpha = 1 - suave((t - 0.5) / 0.15);
          (s.n === 1 ? [0] : [-1, 1]).forEach(function (k) { ctx.beginPath(); ctx.arc(e.x + (-dy / n) * k * 4.5, e.y + (dx / n) * k * 4.5, 3.6, 0, Math.PI * 2); ctx.fill(); });
          ctx.restore();
        }
      });
    }
    if (t >= 1) { this.anim = null; if (a.aoFim) a.aoFim.call(this); this._sync(); }
  }

  /* ══ O CONSTRUTOR: as fórmulas gerais 1 e 2 → todas as reações ══
     reagente 1: CnH2n (n escolhido), uma fórmula molecular ou uma fórmula estrutural; do gerador de isômeros,
     ficam os que têm dupla C=C. Reagente 2 (fórmula geral): HX (HCl, HBr, HI), X2 (Cl2, Br2), H2O (ácido), H2 (Ni). */
  _geral() { var C = this.cfg.construtor, c = this.con; return C.gerais.filter(function (x) { return x.id === c.geral; })[0] || C.gerais[0]; }
  _r2() { var C = this.cfg.construtor, c = this.con; return C.reagentes2.filter(function (x) { return x.id === c.r2; })[0] || C.reagentes2[0]; }
  gerar() {
    var I = Q3.Isomeros, C = this.cfg.construtor, c = this.con, subs = [], self = this, val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
    try {
      if (c.modo === 'estrutural') {
        var txt = val(this.cfg.pref + '-c-estrutural'); if (!txt) throw new Error('Digite a fórmula estrutural do reagente 1.');
        var g = Q3.deFormulaCondensada(txt); if (!C.aceita(g)) throw new Error('Essa molécula ' + C.recusaUma);
        subs.push({ g: g, nome: I.nomear(g) || txt });
      } else {
        var f = c.modo === 'geral' ? this._geral().formula(c.n) : val(this.cfg.pref + '-c-molecular');
        if (!f) throw new Error('Digite a fórmula molecular do reagente 1.');
        var r = I.gerar(f);
        r.estruturas.forEach(function (e) { if (C.aceita(e.g)) subs.push({ g: e.g, nome: I.nomear(e.g) || f }); });
        if (!subs.length) throw new Error(this._indices(f) + ' ' + C.recusa);
        c.formula = f;
      }
    } catch (e) { c.msg = e.message; this._sync(); announce(e.message); return false; }
    var r2 = this._r2(), lista = [], k = 0;
    subs.forEach(function (sb) { r2.expandir(sb.g).forEach(function (x) { k++; lista.push({ id: 'g' + k, nome: sb.nome + ' + ' + x.rotulo, substrato: sb.g, nomeSubstrato: sb.nome, modelo: x.modelo, reagente: x.reagente, catalisadores: !!x.catalisadores, gerada: true }); }); });
    if (!lista.length) { c.msg = 'Nenhuma reage com ' + r2.rotulo + '.'; this._sync(); announce(c.msg); return false; }
    this.geradas = lista;
    c.msg = (lista.length === 1 ? '1 reação gerada' : lista.length + ' reações geradas') + (c.modo !== 'estrutural' ? ' · ' + this._indices(c.formula) : '') + '.';
    announce(c.msg); this.carregar(lista[0].id);
    var busca = document.getElementById(this.cfg.pref + '-busca'); if (busca) busca.value = '';
    return true;
  }

  /* ══ AS AÇÕES DO LABORATÓRIO ══════════════════════════════════ */
  acao(nome) {
    var pre = this.cfg.pref + '-', self = this, M = Q3.Mecanismo, DM = Q3.DesenhoMecanismo;
    if (nome.indexOf(pre + 'lib:') === 0) return this.carregar(nome.slice(pre.length + 4));
    if (nome.indexOf(pre + 'cat:') === 0) { this.cat = nome.slice(pre.length + 4); this._montar(); announce('Catalisador: ' + M.CATALISADORES[this.cat].nome + '.'); this._sync(); return true; }
    if (nome === pre + 'seta1') { this.n = 1; this._sync(); announce('Farpa: move um elétron (radicais).'); return true; }
    if (nome === pre + 'seta2') { this.n = 2; this._sync(); announce('Seta curva: move um par de elétrons.'); return true; }
    if (nome === pre + 'desfazer') { this.setas.pop(); this.fonteToque = null; this.msg = ''; this._sync(); return true; }
    if (nome === pre + 'limpar') { this.setas = []; this.fonteToque = null; this.msg = ''; this.nota = ''; this._sync(); return true; }
    if (nome === pre + 'aplicar' || nome === pre + 'acao') return this.aplicar();
    if (nome.indexOf(pre + 'c-modo:') === 0) { this.con.modo = nome.slice(pre.length + 7); this.con.msg = ''; this._sync(); return true; }
    if (nome.indexOf(pre + 'c-n:') === 0) { var gG = this._geral(); this.con.n = Math.max(gG.nMin || 2, Math.min(gG.nMax || 8, this.con.n + (+nome.slice(pre.length + 4)))); this._sync(); return true; }
    if (nome.indexOf(pre + 'c-geral:') === 0) { this.con.geral = nome.slice(pre.length + 8); var gG2 = this._geral(); this.con.n = Math.max(gG2.nMin || 2, Math.min(gG2.nMax || 8, this.con.n)); this.con.msg = ''; this._sync(); return true; }
    if (nome.indexOf(pre + 'c-r2:') === 0) { this.con.r2 = nome.slice(pre.length + 5); this._sync(); return true; }
    if (nome === pre + 'gerar') return this.gerar();
    if (nome === pre + 'limpar-geradas') { var eraGerada = this.reacao && this.reacao.gerada; this.geradas = []; this.con.msg = ''; if (eraGerada) this.carregar(this.cfg.biblioteca[0].id); this._sync(); announce('As reações geradas foram apagadas.'); return true; }
    if (nome === pre + 'pular') { if (!this.anim) return false; var a = this.anim; this.anim = null; if (a.aoFim) a.aoFim.call(this); this._sync(); return true; }
    if (nome === pre + 'voltar') {                                  // desfaz o último passo aplicado
      if (this.hist.length < 2 || this.anim) return false; this.hist.pop(); this.setas = []; this.msg = '';
      announce('Voltou ao passo ' + (this.hist.length - 1) + '.'); this._sync(); return true;
    }
    if (nome === pre + 'recomecar') { this.nota = ''; this._montar(); this._sync(); announce('O experimento recomeçou dos reagentes.'); return true; }
    // a literatura: referência, não gabarito
    if (nome === pre + 'literatura') { if (!this.mod.passos || !this.mod.passos.length) return false; this.setas = []; this.lit = { k: 0, visto: false }; this._litPasso(); return true; }
    if (nome === pre + 'lit-proximo') { if (!this.lit) return false; if (this.lit.k + 1 < this.mod.passos.length) { this.lit = { k: this.lit.k + 1, visto: false }; this._litPasso(); } else { this.lit.fim = true; this._sync(); } return true; }
    if (nome === pre + 'lit-rever') { if (!this.lit) return false; this.lit.visto = false; this._litPasso(); return true; }
    if (nome === pre + 'lit-sair') { this.lit = null; this.anim = null; this._sync(); announce('De volta ao seu experimento.'); return true; }
    return false;
  }
  _litPasso() {
    var k = this.lit.k, p = this.mod.passos[k];
    announce('Literatura, passo ' + (k + 1) + ' de ' + this.mod.passos.length + ': ' + this._descLit(p).itens.join('; ') + '.');
    this._animar({ antes: p.antes, depois: p.depois, posA: this.pos[k], posB: this.pos[k + 1], setas: p.setas, uma: true, aoFim: function () { if (this.lit) this.lit.visto = true; } });
  }
  /* APLICAR: o motor faz o que as setas pedem; só o que a química proíbe é recusado (com o motivo) */
  aplicar() {
    if (this.estado !== 'lab' || this.lit || this.anim) return false;
    if (!this.setas.length) { announce('Desenhe ao menos uma seta.'); return false; }
    var M = Q3.Mecanismo, DM = Q3.DesenhoMecanismo, topo = this.hist[this.hist.length - 1], comp = this._completar(topo.S, this.setas), r = M.aplicar(topo.S, comp.setas);
    if (!r.ok) { this.msg = 'Não acontece: ' + r.erro + '.'; announce(this.msg); this._sync(); return false; }
    if (M.iguais(r.S, topo.S)) { this.msg = 'Nada muda na estrutura.'; this._sync(); return false; }
    var veto = this._veto(topo, r); if (veto) { this.msg = veto; announce(this.msg); this._sync(); return false; }   // o que a química permite, mas as condições não (a faísca)
    var posB = DM.posicoesDepois(topo.S, r.S, topo.pos, this._embaixo(this.forma)), desc = this._descrever(topo.S, r.S), setas = comp.setas; this.nota = '';
    if (comp.adicionadas.length) { var tf = comp.adicionadas.length === 1 ? '1 farpa completada' : comp.adicionadas.length + ' farpas completadas'; desc.linhas.unshift([tf]); desc.itens.unshift(tf); }   // as tracejadas
    this.msg = ''; this.setas = [];
    /* NO CELULAR o botão mora na gaveta de baixo, que cobre a cena: ela se recolhe, e as setas começam 2 s depois —
       o tempo de a gaveta descer e de o aluno ver as setas que desenhou antes de os elétrons andarem (o mesmo
       intervalo da largada de um modo). No computador a cena está à vista: começa na hora. */
    var espera = this._recolherGaveta() ? 2000 : 0;
    if (espera) announce('A gaveta se recolheu. As setas começam em 2 segundos.');
    this._animar({ antes: topo.S, depois: r.S, posA: topo.pos, posB: posB, setas: setas, uma: false, espera: espera, aoFim: function () {
      this.hist.push({ S: r.S, pos: posB, desc: desc });
      announce('Passo ' + (this.hist.length - 1) + ': ' + desc.itens.join('; ') + '.' + (desc.estavel ? ' Estado estável.' : ''));
    } });
    return true;
  }
  /* o produto do experimento (no estado estável) e a comparação com a literatura */
  _produto(S) {
    var M = Q3.Mecanismo, m = this.mod, org = M.organico(S);
    var out = { nome: M.nomeDe(S, org), formula: M.formulaDe(S, org), classe: M.classificar(this.hist[0].S, S) };
    var lit = m.semSetas ? m.produto : (m.passos && m.passos.length ? m.passos[m.passos.length - 1].depois : null);
    if (lit) {
      var aqui = M.assinaturaMol(S, org), la = M.organico(lit);
      out.literatura = M.nomeDe(lit, la) || (this.reacao && this.reacao.nomeProduto) || null; out.igualLiteratura = aqui === M.assinaturaMol(lit, la);
      if (!out.nome && out.igualLiteratura && this.reacao && this.reacao.nomeProduto) out.nome = this.reacao.nomeProduto;   // o motor não nomeia (nitro)
      if (!out.igualLiteratura && m.lateral) { var ll = M.organico(m.lateral.S); out.lateral = aqui === M.assinaturaMol(m.lateral.S, ll); }
    }
    return out;
  }

  /* ══ OS PAINÉIS ═══════════════════════════════════════════════ */
  _indices(f) { return String(f).replace(/\d+/g, function (d) { return d.split('').map(function (x) { return '₀₁₂₃₄₅₆₇₈₉'[+x]; }).join(''); }); }   // C4H8 → C₄H₈
  /* a etiqueta (a fórmula molecular do reagente principal) e a pílula (a família do reagente — nada do produto) */
  _formulaDe(x) {
    if (x._formula == null) { try { var M = Q3.Mecanismo, S = M.vazio(); M.substrato(S, x.substrato, 'a'); x._formula = M.formulaDe(S, M.organico(S)) || ''; } catch (e) { x._formula = ''; } }
    return x._formula;
  }
  _pilula(x) { return { hx: 'HX', halogenacao: 'X₂', hidratacao: 'H₂O', hidrogenacao: 'H₂', desidratacao: 'álcool', e2: 'haleto', radicalar: 'alcano', sn2: 'haleto', sn1: 'haleto', aromatica: 'aromático', acetilacao: 'acílica' }[x.modelo] || ''; }
  _valor(id) { var el = document.getElementById(id); return el ? el.value.replace(/"/g, '&quot;') : ''; }   // o que o aluno digitou continua no campo
  _normal(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }
  _montarLista() {
    var pre = this.cfg.pref, ul = document.getElementById(pre + '-lista'); if (!ul) return;
    var self = this, busca = document.getElementById(pre + '-busca'), q = this._normal(busca ? busca.value : ''), termos = q ? q.split(' ') : [];
    var todos = this._todas(), achados = todos.filter(function (x) { var ix = self._normal([x.nome, x.nomeSubstrato].concat(x.sinonimos || []).join(' ')); return termos.every(function (t) { return ix.indexOf(t) >= 0; }); });
    var atual = this.reacao ? this.reacao.id : null, chave = q + '|' + atual + '|' + this.geradas.length + (this.geradas[0] ? this.geradas[0].nome : '');
    if (ul.dataset.chave === chave && ul.children.length) return; ul.dataset.chave = chave;
    var foco = document.activeElement && ul.contains(document.activeElement) ? document.activeElement.dataset.action : null;
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var item = function (x) { var on = x.id === atual; return '<li role="none"><button type="button" class="op-item' + (on ? ' is-on' : '') + '" role="option" aria-selected="' + on + '" data-action="' + pre + '-lib:' + x.id + '">' +
      '<span class="op-item-tag" aria-hidden="true">' + self._formulaDe(x) + '</span><span class="op-item-nome">' + esc(x.nome) + '</span>' + (self._pilula(x) ? '<span class="op-item-pill">' + self._pilula(x) + '</span>' : '') + '</button></li>'; };
    var ger = achados.filter(function (x) { return x.gerada; }), bib = achados.filter(function (x) { return !x.gerada; });
    ul.innerHTML = (ger.length ? '<li role="presentation" class="sr-grupo">Geradas (' + ger.length + ')</li>' + ger.map(item).join('') + (bib.length ? '<li role="presentation" class="sr-grupo">Biblioteca</li>' : '') : '') + bib.map(item).join('');
    if (foco) { var vf = ul.querySelector('[data-action="' + foco + '"]'); if (vf) vf.focus(); }
    else { var ativo = ul.querySelector('.op-item.is-on'); if (ativo && ativo.scrollIntoView) ativo.scrollIntoView({ block: 'nearest' }); }   // o escolhido à vista
    var cont = document.getElementById(pre + '-contagem');
    if (cont) cont.textContent = !achados.length ? 'Nenhuma reação com "' + (busca ? busca.value.trim() : '') + '".' : (q ? achados.length + ' de ' + todos.length + ' reações' : todos.length + ' reações' + (this.geradas.length ? ' (' + this.geradas.length + ' geradas)' : ''));
  }
  _ligarBusca() {
    var pre = this.cfg.pref, busca = document.getElementById(pre + '-busca'), ul = document.getElementById(pre + '-lista'), self = this;
    if (!busca || !ul || busca.dataset.ligada) return; busca.dataset.ligada = '1';
    busca.addEventListener('input', function () { self._montarLista(); });
    busca.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowDown') { var f = ul.querySelector('.op-item'); if (f) { ev.preventDefault(); f.focus(); } } });
    ul.addEventListener('keydown', function (ev) {
      var itens = [].slice.call(ul.querySelectorAll('.op-item')), i = itens.indexOf(document.activeElement); if (i < 0) return;
      var alvo = ev.key === 'ArrowDown' ? itens[Math.min(itens.length - 1, i + 1)] : ev.key === 'ArrowUp' ? (i ? itens[i - 1] : busca) : ev.key === 'Home' ? itens[0] : ev.key === 'End' ? itens[itens.length - 1] : ev.key === 'Escape' ? busca : null;
      if (alvo) { ev.preventDefault(); alvo.focus(); }
    });
  }
  _sync() {
    if (typeof document === 'undefined' || !this.ativo) return;
    var pre = this.cfg.pref, self = this, set = function (id, h) { var el = document.getElementById(id); if (el) el.innerHTML = h; };
    var btn = function (acao, txt, extra, dis) { return '<button type="button" class="action-btn' + (extra || '') + '" data-action="' + pre + '-' + acao + '"' + (dis ? ' disabled' : '') + '>' + txt + '</button>'; };
    var esc = function (acao, txt, on) { return '<button type="button" class="bg-opcao' + (on ? ' is-on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-action="' + pre + '-' + acao + '">' + txt + '</button>'; };
    this._montarLista();
    var r = this.reacao, m = this.mod; if (!r) return;
    set(pre + '-atual', r.nome);
    // o construtor: as fórmulas gerais 1 e 2 (pela configuração do módulo)
    var c0 = this.con, C0 = this.cfg.construtor, gG = this._geral(), cs = '';
    cs += '<p class="bi-secao bi-secao--primeira">' + C0.rotulo1 + '</p><div class="bg-grupo">' + esc('c-modo:geral', 'Geral', c0.modo === 'geral') + esc('c-modo:molecular', 'Molecular', c0.modo === 'molecular') + esc('c-modo:estrutural', 'Estrutural', c0.modo === 'estrutural') + '</div>';
    if (c0.modo === 'geral') {
      if (C0.gerais.length > 1) cs += '<div class="bg-grupo">' + C0.gerais.map(function (x) { return esc('c-geral:' + x.id, x.html, c0.geral === x.id); }).join('') + '</div>';
      cs += '<p class="ctrl-label">' + gG.html + ' — n =</p><div class="op-stepper">' + btn('c-n:-1', '−') + '<span class="op-valor" aria-live="polite">' + c0.n + '</span>' + btn('c-n:1', '+') + '<span class="sr-formula" aria-label="fórmula">→ ' + this._indices(gG.formula(c0.n)) + '</span></div>';
    }
    else if (c0.modo === 'molecular') cs += '<label class="ctrl-label" for="' + pre + '-c-molecular">Fórmula molecular</label><input type="text" id="' + pre + '-c-molecular" class="gf-busca" placeholder="ex.: ' + C0.exemplo.molecular + '" autocomplete="off" spellcheck="false" value="' + (this._valor(pre + '-c-molecular') || '') + '">';
    else cs += '<label class="ctrl-label" for="' + pre + '-c-estrutural">Fórmula estrutural</label><input type="text" id="' + pre + '-c-estrutural" class="gf-busca" placeholder="ex.: ' + C0.exemplo.estrutural + '" autocomplete="off" spellcheck="false" value="' + (this._valor(pre + '-c-estrutural') || '') + '">';
    cs += '<p class="bi-secao">' + C0.rotulo2 + '</p><div class="bg-grupo' + (C0.reagentes2.length > 3 ? ' sr-grade-2' : C0.reagentes2.length === 3 ? ' sr-coluna' : '') + '">' + C0.reagentes2.map(function (x) { return esc('c-r2:' + x.id, x.rotulo, c0.r2 === x.id); }).join('') + '</div>';
    cs += '<div class="action-row">' + btn('gerar', 'Gerar as reações', ' is-primario') + '</div>';
    if (c0.msg) cs += '<p class="hint-text">' + c0.msg + '</p>';
    if (this.geradas.length) cs += '<div class="action-row">' + btn('limpar-geradas', 'Limpar as geradas') + '</div>';
    set(pre + '-construtor', cs);
    // o catalisador (só onde há)
    var pc = document.getElementById('panel-' + pre + '-catalisador');
    var C = Q3.Mecanismo.CATALISADORES, c = '';
    if (r.catalisadores) c = '<div class="bg-grupo sr-coluna">' + Object.keys(C).map(function (k) { return esc('cat:' + k, C[k].nome, self.cat === k); }).join('') + '</div>';
    else c = '<p class="hint-text">Sem catalisador.</p>';
    set(pre + '-catalisador', c);
    // o laboratório
    var h = '', topo = this.hist[this.hist.length - 1], nPassos = this.hist.length - 1;
    if (this.estado === 'naoAvanca') h = '<p class="sr-aviso">Não reage: ácido fraco.</p>';
    else if (this.estado === 'semSetas') { var pr = this._produto(m.produto); h = '<p class="sr-aviso">Sem setas: catálise na superfície do metal.</p>' + this._fimHtml(pr) + this._tagsHtml([this._pill(pr.classe.tipo)]) + '<div class="action-row">' + btn('recomecar', 'Recomeçar') + '</div>'; }
    else if (this.lit) {                                            // a literatura: referência
      var lp = m.passos[this.lit.k];
      h += '<p class="ctrl-label">Literatura — passo ' + (this.lit.k + 1) + ' de ' + m.passos.length + (lp.fase ? ' · ' + lp.fase.toLowerCase() : '') + '</p>';
      h += this._linhasHtml(this._descLit(lp)) + '<ol class="sr-setas">' + lp.setas.map(function (x) { return '<li>' + self._descSetaDe(lp.antes, x) + '</li>'; }).join('') + '</ol>';
      if (this.anim) h += '<div class="action-row">' + btn('pular', 'Pular a animação') + '</div>';
      else if (this.lit.fim) h += this._fimLiteraturaHtml(m);
      else h += '<div class="action-row">' + btn('lit-proximo', this.lit.k + 1 < m.passos.length ? 'Próximo passo' : 'Ver o produto', ' is-primario') + btn('lit-rever', 'Rever') + '</div>';
      h += '<div class="action-row">' + btn('lit-sair', 'Voltar ao meu experimento') + '</div>';
    } else {
      h += this._topoLabHtml();
      // ── SETAS
      h += '<p class="bi-secao' + (this._topoLabHtml() ? '' : ' bi-secao--primeira') + '">Setas</p>';
      h += '<div class="bg-grupo">' + esc('seta2', 'Seta curva (par)', this.n === 2) + esc('seta1', 'Farpa (um elétron)', this.n === 1) + '</div>';
      if (this.setas.length) {
        var compL = this._completar(this.hist[this.hist.length - 1].S, this.setas);
        h += '<ol class="sr-setas">' + compL.setas.map(function (x) { return '<li' + (x.completada ? ' class="sr-completada"' : '') + '>' + self._descSeta(x) + (x.completada ? ' <span class="sr-tag">completada</span>' : '') + (x.sugerida ? ' <span class="sr-tag">sugerida</span>' : '') + '</li>'; }).join('') + '</ol>';
      }
      if (this.nota) h += '<p class="hint-text">' + this.nota + '</p>';
      if (this.msg) h += '<p class="sr-aviso">' + this.msg + '</p>';
      if (this.anim) h += '<div class="action-row">' + btn('pular', 'Pular a animação') + '</div>';
      else {
        h += '<div class="action-row">' + btn('aplicar', 'Aplicar as setas', ' is-primario', !this.setas.length) + '</div>';
        h += '<div class="action-row">' + btn('desfazer', 'Desfazer seta', '', !this.setas.length) + btn('limpar', 'Limpar setas', '', !this.setas.length) + '</div>';
      }
      // ── RESULTADO (depois do primeiro passo aplicado)
      if (nPassos) {
        h += '<p class="bi-secao">Resultado — passo ' + nPassos + '</p>' + this._linhasHtml(topo.desc);
        if (topo.desc.estavel) h += this._estavelHtml(topo);
      }
      h += this._extrasLabHtml();
      // ── EXPERIMENTO
      h += '<p class="bi-secao">Experimento</p>';
      if (nPassos) h += '<div class="action-row">' + btn('voltar', 'Voltar um passo', '', !!this.anim) + btn('recomecar', 'Recomeçar', '', !!this.anim) + '</div>';
      h += '<div class="action-row">' + btn('literatura', 'Ver o mecanismo da literatura', '', !!this.anim) + '</div>';
    }
    set(pre + '-mecanismo', h);
  }
  /* ══ OS GANCHOS (o padrão é o comportamento de sempre; um módulo filho troca o que precisar) ══ */
  _veto() { return null; }
  _descrever(Sa, Sb) { return Q3.Mecanismo.descrever(Sa, Sb); }
  _topoLabHtml() { return ''; }
  _extrasLabHtml() { return ''; }
  _fimLiteraturaHtml(m) {
    var M = Q3.Mecanismo, pl = this._produto(m.passos[m.passos.length - 1].depois);
    var h = '<p class="ctrl-label">Produto da literatura</p><p class="sr-produto"><strong>' + (pl.nome || 'produto') + '</strong> · ' + pl.formula + '</p>';
    if (m.lateral) { var ll = M.organico(m.lateral.S); h += this._tagsHtml([this._pill('lateral: ' + (M.nomeDe(m.lateral.S, ll) || M.formulaDe(m.lateral.S, ll)))]); }   // o que se forma junto (com Cl⁻)
    return h;
  }
  /* o estado estável: o produto, a classificação e a comparação com a literatura — só os dados */
  _estavelHtml(topo) {
    var pe = this._produto(topo.S), tags = [this._pill(pe.classe.tipo)];
    if (pe.igualLiteratura) tags.push('<span class="bg-igual">= literatura</span>');
    else if (pe.lateral) tags.push('<span class="bg-igual">= literatura (lateral)</span>');
    else tags.push('<span class="bg-dif">literatura: ' + (pe.literatura || 'outro') + '</span>');
    // na halogenação radicalar, chegar pelo caminho iônico (a quebra do X–X em íons) não é o da literatura
    if (this.reacao && this.reacao.modelo === 'radicalar' && this.hist.some(function (hh) { return hh.desc && hh.desc.heterolitica; })) tags.push('<span class="bg-dif">caminho iônico</span>');
    return '<p class="ctrl-label">Estado estável</p>' + this._fimHtml(pe) + this._tagsHtml(tags);
  }
  /* o resultado de um passo: dados curtos, uma linha por grupo (as ligações · o que surgiu · a energia) */
  _linhasHtml(d) {
    if (!d || !d.linhas || !d.linhas.length) return '';
    return '<ul class="sr-linhas">' + d.linhas.map(function (l) { return '<li>' + l.join(' · ') + '</li>'; }).join('') + '</ul>';
  }
  _descLit(p) { return p._desc || (p._desc = this._descrever(p.antes, p.depois)); }   // o mesmo resumo dos passos do aluno
  _pill(t) { return '<span class="sr-pill">' + t + '</span>'; }
  _tagsHtml(tags) { return tags.length ? '<p class="sr-tags">' + tags.join('') + '</p>' : ''; }
  _descSetaDe(S, s) { var nome = function (id) { var a = S.at[id]; return a ? a.el : '?'; }; var f = s.de.at ? ((s.n || 2) === 1 ? 'elétron de ' : 'par de ') + nome(s.de.at) : 'ligação ' + nome(s.de.lig[0]) + ((S.lig[Q3.Mecanismo.chaveLig(s.de.lig[0], s.de.lig[1])] || 0) >= 4 ? '=' : '–') + nome(s.de.lig[1]); var d = s.para.at ? nome(s.para.at) : 'ligação ' + nome(s.para.lig[0]) + '–' + nome(s.para.lig[1]); return ((s.n || 2) === 1 ? 'farpa: ' : '') + f + ' → ' + d; }
  _fimHtml(pr) { return '<p class="sr-produto"><strong>' + (pr.nome || 'produto') + '</strong> · ' + pr.formula + '</p>'; }
  resultados() {
    var r = this.reacao, out = [{ l: 'Reação', v: r ? r.nome : '—' }]; if (!this.mod) return out;
    if (this.estado === 'semSetas') { var p0 = this._produto(this.mod.produto); out.push({ l: 'Produto', v: (p0.nome || '—') + ' · ' + p0.formula }); return out; }
    var topo = this.hist[this.hist.length - 1];
    out.push({ l: 'Passos aplicados', v: String(this.hist.length - 1) });
    if (topo.desc && topo.desc.estavel) { var pr = this._produto(topo.S); out.push({ l: 'Produto', v: (pr.nome || '—') + ' · ' + pr.formula }); out.push({ l: 'Classificação', v: pr.classe.tipo }); }
    else if (this.hist.length > 1) out.push({ l: 'Estado', v: 'intermediário' });
    if (this.reacao && this.reacao.catalisadores) out.push({ l: 'Catalisador', v: Q3.Mecanismo.CATALISADORES[this.cat].nome });
    return out;
  }

}
/* a cor com transparência (o halo do imã) */
function biRgbaSiro(hex, a) { var h = String(hex).replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); if (isNaN(n)) return 'rgba(0,128,128,' + a + ')'; return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
