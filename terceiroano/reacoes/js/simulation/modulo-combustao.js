/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/modulo-combustao.js (SIRO · Módulo 4 — COMBUSTÃO)
   ───────────────────────────────────────────────────────────────
   O mesmo laboratório de setas dos outros módulos (modulo-mecanismo.js),
   com o que a chama tem de próprio (no painel, só os dados — o porquê
   está aqui e no motor, js/core/combustao.js):
   · a FAÍSCA: sem ela, o primeiro passo não acontece (ele absorve
     ~200 kJ/mol); depois, a energia que a cadeia libera a mantém;
   · o AR: suficiente (a cadeia vai até o CO₂) ou pouco (para no CO);
   · a ENERGIA de cada passo (pelas entalpias de formação, combustao.js) e
     a soma, que bate com a ΔH da equação global — lei de Hess;
   · o BALANÇO: as equações globais (completa, CO, fuligem), a energia de
     cada uma e a energia por grama dos combustíveis do dia a dia.
   O motor de setas, as regras das farpas e os mecanismos da literatura
   estão em js/core/mecanismo.js e js/core/combustao.js.
   ═══════════════════════════════════════════════════════════════ */
'use strict';

class ModuloCombustao extends ModuloMecanismo {
  constructor(D, cfg) { super(D, cfg); this.ar = 'suficiente'; this.faisca = false; this._flash = 0; }

  /* ══ A REAÇÃO ══════════════════════════════════════════════════ */
  carregar(id) {
    var r = this._todas().filter(function (x) { return x.id === id; })[0]; if (!r) return false;
    this.n = 1;                                                       // a farpa: a cadeia é toda de radicais
    this.reacao = r; this._montar();
    announce('Combustível: ' + (r.nomeSubstrato || r.nome) + '. Acenda a faísca, desenhe as farpas e aplique.');
    this._sync(); return true;
  }
  _montar() {
    var r = this.reacao, M = Q3.Mecanismo, DM = Q3.DesenhoMecanismo, self = this;
    var g = typeof r.substrato === 'string' ? Q3.deSmiles(r.substrato) : r.substrato;
    this.mod = M.modelos.combustao(r.substrato, this.ar);
    this.comb = Q3.Combustao.dados(g, r);
    this.k = 0; this.setas = []; this.fonteToque = null; this.msg = ''; this.nota = ''; this.faisca = false; this._flash = 0;
    this.estado = this.mod.ok ? 'lab' : 'vazio';
    if (!this.mod.ok) { this.hist = []; this.pos = []; return; }
    this._posicoes();                                                 // o começo e a literatura, na disposição da área (modulo-mecanismo.js)
    this.hist = [{ S: this.mod.inicio, pos: this.pos[0], desc: null }]; this.lit = null; this.anim = null;
  }
  /* o lugar do sinal da chama: no canto de cima, à esquerda; quando a pílula chega até o canto (tela estreita),
     logo abaixo da faixa dela (ui/moldura-cena.js) */
  _lugarSelo(W) {
    var lado = 30, x = 14, y = 12, pil = Q3.Moldura ? Q3.Moldura.pilula(W) : { x0: W / 2 - Math.min(W * 0.47, 300), y1: 46 };
    if (pil.x0 < x + lado + 8) y = pil.y1 + 6;
    return { x: x, y: y, w: lado, h: lado };
  }
  /* na área mais alta que larga, a folga das bordas é a justa: o desenho começa abaixo do sinal da chama */
  _area(W, H) {
    var a = super._area(W, H);
    if (a.retrato) { var s = this._lugarSelo(W), d = s.y + s.h + 6 - a.y; if (d > 0) { a.y += d; a.h -= d; } }
    return a;
  }
  _chamaAcesa() { return this.lit ? (this.lit.k > 0 || this.lit.visto || !!this.anim) : (this.faisca || this.hist.length > 1); }   // na literatura, o 1º passo já é com a faísca

  /* ══ AS AÇÕES: a faísca e o ar (o resto é do laboratório) ══════ */
  acao(nome) {
    var pre = this.cfg.pref + '-';
    if (nome.indexOf(pre + 'ar:') === 0) {
      var v = nome.slice(pre.length + 3) === 'pouco' ? 'pouco' : 'suficiente'; if (v === this.ar) return false;
      this.ar = v; this._montar();
      announce(v === 'pouco' ? 'Pouco ar: combustão incompleta.' : 'Ar suficiente: combustão completa.');
      this._sync(); return true;
    }
    if (nome === pre + 'faisca') return this.acender();
    return super.acao(nome);
  }
  acender() {
    if (this.estado !== 'lab' || this.lit || this.anim) return false;
    if (this._chamaAcesa()) { announce('A chama já está acesa.'); return false; }
    this.faisca = true; this._flash = performance.now(); this.msg = ''; this.nota = '';
    announce('Faísca: chama acesa.'); this._sync(); return true;
  }
  _litPasso() {
    if (this.lit && this.lit.k === 0) this._flash = performance.now();   // a literatura também começa pela faísca
    super._litPasso();
  }
  /* sem a faísca, nada reage (a química permite; a temperatura, não: a 25 °C quase nenhuma colisão tem essa energia) */
  _veto(topo, r) {
    if (this.faisca || this.hist.length > 1) return null;
    var e = Q3.Mecanismo.entalpiaCombustao(topo.S, r.S);
    return 'Sem faísca, não reage' + (e && e.dH != null ? ': o passo absorveria ≈ ' + Q3.Combustao.fmtKJ(Math.round(e.dH)) + ' kJ/mol' : '') + '.';
  }

  /* ══ O QUE ACONTECEU EM CADA PASSO: dados curtos, em linhas ═══════
     1. as ligações que mudaram (do motor); 2. as espécies que surgiram — na chama, é isso que importa
     (no lugar das cargas e radicais átomo a átomo); 3. a energia, pelas entalpias de formação. */
  _descrever(Sa, Sb) {
    var M = Q3.Mecanismo, CB = Q3.Combustao, d = M.descrever(Sa, Sb);
    var cont = {}; this._novas(Sa, Sb).forEach(function (x) { cont[x.nome] = (cont[x.nome] || 0) + 1; });
    var nomes = Object.keys(cont), esp = [], en = [];
    if (nomes.length) esp.push('→ ' + nomes.map(function (n) { return (cont[n] > 1 ? cont[n] + ' ' : '') + n; }).join(' + '));
    if ((cont['•OH'] || 0) >= 2) esp.push('ramificação');                 // dois •OH de uma vez: a cadeia se multiplica
    if (cont.CO) esp.push('C≡O (dativa)');                                // a terceira ligação veio de um par do O
    // o C com seis elétrons (um par e a dupla com o O): falta a dativa do CO
    Object.keys(Sb.at).forEach(function (id) {
      if (Sb.at[id].el !== 'C' || Sb.at[id].nb !== 2 || M.eletrons(Sb, id) !== 6) return;
      if (M.vizinhos(Sb, id).some(function (v) { return Sb.at[v].el === 'O' && Sb.lig[M.chaveLig(id, v)] === 4 && Sb.at[v].nb >= 4; })) esp.push('C com 6 elétrons: falta a dativa');
    });
    var e = M.entalpiaCombustao(Sa, Sb);
    if (e && e.dH != null) { d.dH = e.dH; en.push('ΔH ≈ ' + CB.fmtKJ(Math.round(e.dH)) + ' kJ/mol' + (e.estimado ? ' (estimada)' : '')); }
    else if (e && e.falta) en.push('ΔH: sem dado');
    d.especies = esp; d.energia = en;
    d.linhas = [d.ligacoes, esp, en].filter(function (l) { return l.length; });
    d.itens = d.ligacoes.concat(esp, en);
    return d;
  }
  /* as moléculas que surgiram no passo (o que não mudou fica fora) */
  _novas(Sa, Sb) {
    var M = Q3.Mecanismo, ca = M.componentes(Sa), cb = M.componentes(Sb);
    var sa = ca.map(function (c) { return M.assinaturaMol(Sa, c); });
    return cb.filter(function (c) { var s = M.assinaturaMol(Sb, c), i = sa.indexOf(s); if (i >= 0) { sa.splice(i, 1); return false; } return true; })
      .map(function (c) { return { ids: c, nome: M.nomeEspecie(Sb, c) }; });
  }
  _somaDH() { var v = 0, falta = 0; this.hist.slice(1).forEach(function (h) { if (h.desc && h.desc.dH != null) v += Math.round(h.desc.dH); else falta++; }); return { v: v, falta: falta }; }

  /* ══ O RESULTADO: os produtos (a soma das moléculas), não "a orgânica" ══ */
  _lista(S) {
    var M = Q3.Mecanismo, cont = {}, ordem = ['CO₂', 'CO', 'H₂O', 'H₂', 'O₂'];
    M.componentes(S).forEach(function (c) { var n = M.nomeEspecie(S, c); cont[n] = (cont[n] || 0) + 1; });
    return Object.keys(cont).sort(function (a, b) { return ((ordem.indexOf(a) + 1) || 99) - ((ordem.indexOf(b) + 1) || 99); })
      .map(function (n) { return (cont[n] > 1 ? cont[n] + ' ' : '') + n; }).join(' + ');
  }
  _produto(S) {
    var M = Q3.Mecanismo, nomes = M.componentes(S).map(function (c) { return M.nomeEspecie(S, c); });
    var temCO2 = nomes.indexOf('CO₂') >= 0, temCO = nomes.indexOf('CO') >= 0;
    var sobraC = M.componentes(S).some(function (c) { return c.some(function (id) { return S.at[id].el === 'C' && M.vizinhos(S, id).some(function (v) { return S.at[v].el === 'H'; }); }); });
    var classe = temCO2 && !temCO && !sobraC ? { tipo: 'combustão completa' }          // todo o C virou CO₂; todo o H, água
      : temCO ? { tipo: 'combustão incompleta' }                                         // o C parou no CO: faltou O₂ (e •OH)
      : { tipo: 'incompleta: sobra C–H' };                                               // ainda há C ligado a H
    var m = this.mod, lit = m && m.passos.length ? m.passos[m.passos.length - 1].depois : null;
    return { nome: this._lista(S), formula: '', classe: classe, literatura: lit ? this._lista(lit) : null, igualLiteratura: !!(lit && m.fim !== 'continua' && M.iguais(S, lit)) };
  }
  _fimHtml(pr) { return '<p class="sr-produto"><strong>' + pr.nome + '</strong></p>'; }
  _estavelHtml(topo) {
    var M = Q3.Mecanismo, CB = Q3.Combustao, pe = this._produto(topo.S), soma = this._somaDH();
    var tags = [this._pill(pe.classe.tipo), pe.igualLiteratura ? '<span class="bg-igual">= literatura</span>' : '<span class="bg-dif">literatura: ' + (pe.literatura || 'outro') + '</span>'];
    var h = '<p class="ctrl-label">Estado estável</p>' + this._fimHtml(pe) + this._tagsHtml(tags);
    // a lei de Hess: a soma dos passos é a ΔH da equação global (a água em vapor); com a água líquida, o valor das tabelas
    var glob = M.entalpiaCombustao(this.hist[0].S, topo.S);
    if (glob && glob.dH != null && !soma.falta) {
      h += '<p class="cb-hess">Σ passos ≈ ' + CB.fmtKJ(soma.v) + ' · global ' + CB.fmtKJ(glob.dH, 1) + ' kJ/mol ' + this._pill('lei de Hess') + '</p>';
    }
    return h;
  }
  _fimLiteraturaHtml(m) {
    var CB = Q3.Combustao, last = m.passos[m.passos.length - 1].depois, soma = 0, falta = 0;
    m.passos.forEach(function (p) { if (p.dH != null) soma += Math.round(p.dH); else falta++; });
    var h = '<p class="ctrl-label">Resultado da literatura</p><p class="sr-produto"><strong>' + this._lista(last) + '</strong></p>';
    if (m.fim === 'continua') h += this._tagsHtml([this._pill('a cadeia continua')]);
    if (!falta) h += '<p class="cb-hess">Σ ' + m.passos.length + ' passos ≈ ' + CB.fmtKJ(soma) + ' kJ/mol' + (m.fim === 'continua' ? '' : ' · H₂O(g)') + '</p>';
    return h;
  }

  /* ══ O LABORATÓRIO: a faísca em cima, a energia acumulada embaixo ══ */
  _topoLabHtml() {
    if (this.estado !== 'lab') return '';
    var pre = this.cfg.pref, aceso = this._chamaAcesa();
    var raio = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';
    return '<div class="cb-chama' + (aceso ? ' is-acesa' : '') + '"><button type="button" class="action-btn' + (aceso ? '' : ' is-primario') + '" data-action="' + pre + '-faisca"' + (aceso || this.anim ? ' disabled' : '') + '>' + raio + ' Faísca</button>' +
      '<p class="hint-text"><strong>' + (aceso ? 'Chama acesa' : 'Chama apagada') + '</strong></p></div>';
  }
  _extrasLabHtml() {
    if (this.estado !== 'lab' || this.hist.length < 3) return '';                               // com um passo só, a soma é a ΔH dele
    var topo = this.hist[this.hist.length - 1]; if (topo.desc && topo.desc.estavel) return '';   // no fim, a linha da lei de Hess já dá a soma
    var s = this._somaDH();
    return '<p class="cb-energia">ΔH acumulado ≈ <strong>' + Q3.Combustao.fmtKJ(s.v) + ' kJ/mol</strong> · ' + (this.hist.length - 1) + ' passos' + (s.falta ? ' (' + s.falta + ' sem dado)' : '') + '</p>';
  }

  /* ══ OS PAINÉIS PRÓPRIOS: o ar e o balanço ═════════════════════ */
  _pilula(x) {
    if (x.tag) return x.tag;
    try { var g = typeof x.substrato === 'string' ? Q3.deSmiles(x.substrato) : x.substrato, c = Q3.Mecanismo.combustivel(g); return c ? (c.tipo === 'alcool' ? 'álcool' : 'alcano') : ''; } catch (e) { return ''; }
  }
  _formulaComb(c) {
    var sub = function (n) { return n > 1 ? String(n).split('').map(function (d) { return '₀₁₂₃₄₅₆₇₈₉'[+d]; }).join('') : ''; };
    return c.O ? 'C' + sub(c.C) + 'H' + sub(c.H - 1) + 'OH' : 'C' + sub(c.C) + 'H' + sub(c.H);   // álcool: CₙH₂ₙ₊₁OH
  }
  _equacao(b, c) {
    var co = b.coef, k = function (n) { return n === 1 ? '' : n + ' '; };
    var prod = b.tipo === 'completa' ? 'CO₂(g)' : b.tipo === 'co' ? 'CO(g)' : 'C(s)';
    return k(co.f) + this._formulaComb(c) + '(' + c.estado + ') + ' + k(co.o2) + 'O₂(g) → ' + k(co.c) + prod + ' + ' + k(co.h2o) + 'H₂O(l)';
  }
  _porGrama() {                                                     // a energia por grama dos combustíveis da biblioteca (completa)
    if (this._pg) return this._pg;
    var CB = Q3.Combustao;
    this._pg = this.cfg.biblioteca.map(function (x) {
      var d = CB.dados(Q3.deSmiles(x.substrato), x), b = CB.balanco(d)[0];
      return { id: x.id, nome: x.curto || x.nomeSubstrato, kjg: -b.dH / d.massa };
    }).sort(function (a, b) { return b.kjg - a.kjg; });
    return this._pg;
  }
  _sync() {
    super._sync();
    if (typeof document === 'undefined' || !this.ativo || !this.reacao) return;
    var pre = this.cfg.pref, self = this, CB = Q3.Combustao, set = function (id, h) { var el = document.getElementById(id); if (el) el.innerHTML = h; };
    var esc = function (acao, txt, on) { return '<button type="button" class="bg-opcao' + (on ? ' is-on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-action="' + pre + '-' + acao + '">' + txt + '</button>'; };
    var c = this.comb, m = this.mod, nome = this.reacao.nomeSubstrato || this.reacao.nome;
    // ── O AR: as duas opções e quantos O₂ há na cena
    var a = '<div class="bg-grupo sr-coluna">' + esc('ar:suficiente', 'Ar suficiente — completa', this.ar === 'suficiente') + esc('ar:pouco', 'Pouco ar — incompleta', this.ar === 'pouco') + '</div>';
    if (m && m.ok) {
      var S0 = m.inicio, nO2 = Q3.Mecanismo.componentes(S0).filter(function (cc) { return cc.length === 2 && cc.every(function (id) { return S0.at[id].el === 'O'; }); }).length;
      a += '<p class="hint-text">Na cena: ' + nO2 + ' O₂</p>';
    }
    set(pre + '-ar', a);
    // ── O BALANÇO
    var b = '';
    if (c && c.dfH != null) {
      var bs = CB.balanco(c), comp = bs[0];
      b += '<p class="bi-secao bi-secao--primeira">Equações globais — ' + nome + '</p><div class="cb-eqs">';
      bs.forEach(function (x) {
        var tit = x.tipo === 'completa' ? 'Completa' : x.tipo === 'co' ? 'Incompleta — CO' : 'Incompleta — fuligem';
        var nota = x.tipo === 'completa' ? 'chama azul' : x.tipo === 'co' ? 'CO: tóxico' : 'fumaça preta';
        var pct = Math.round(100 * x.dH / comp.dH), atual = (x.tipo === 'completa') === (self.ar === 'suficiente') && x.tipo !== 'fuligem';
        b += '<div class="cb-eq' + (atual ? ' is-on' : '') + '"><p class="cb-eq-tit">' + tit + ' <span class="cb-eq-nota">' + nota + '</span></p><p class="cb-eq-txt">' + self._equacao(x, c) + '</p>' +
          '<p class="cb-eq-dh">ΔH = ' + CB.fmtKJ(x.dH, 1) + ' kJ por mol de ' + nome + (x.tipo === 'completa' ? '' : ' · ' + pct + '% da energia') + '</p></div>';
      });
      b += '</div><p class="hint-text">25 °C, H₂O(l) · com H₂O(g): ' + CB.fmtKJ(comp.dHvapor, 1) + ' kJ/mol' + (c.estimado ? ' · ΔfH estimada (Benson)' : '') + '</p>';
      // a energia por grama: o que interessa no tanque
      var pg = this._porGrama(), maxv = pg.reduce(function (t, x) { return Math.max(t, x.kjg); }, 1), atualId = this.reacao.id, kjgAtual = -comp.dH / c.massa;
      b += '<p class="bi-secao">Energia por grama (combustão completa)</p><ul class="cb-barras" aria-label="Energia liberada por grama de combustível, em quilojoules">';
      var linhas = pg.slice();
      if (!pg.some(function (x) { return x.id === atualId; })) linhas.push({ id: atualId, nome: nome + ' (gerado)', kjg: kjgAtual });
      linhas.forEach(function (x) {
        var on = x.id === atualId, w = Math.max(4, Math.round(100 * x.kjg / Math.max(maxv, x.kjg)));
        b += '<li class="cb-barra' + (on ? ' is-on' : '') + '" title="' + x.nome + ': ' + x.kjg.toFixed(1).replace('.', ',') + ' kJ/g"><span class="cb-barra-nome">' + x.nome + '</span><span class="cb-barra-trilho" aria-hidden="true"><span style="width:' + w + '%"></span></span><span class="cb-barra-valor">' + x.kjg.toFixed(1).replace('.', ',') + ' kJ/g</span></li>';
      });
      b += '</ul>';
    } else b = '<p class="hint-text">Sem ΔfH deste combustível.</p>';
    set(pre + '-balanco', b);
  }
  /* a energia dos passos que estão na cena: os do experimento ou, na literatura, os já mostrados */
  _somaVista() {
    if (!this.lit) return this._somaDH().v;
    var soma = 0; this.mod.passos.slice(0, this.lit.k + (this.lit.visto ? 1 : 0)).forEach(function (p) { soma += Math.round(p.dH || 0); });
    return soma;
  }
  resultados() {
    var r = this.reacao, out = [{ l: 'Combustível', v: r ? (r.nomeSubstrato || r.nome) : '—' }]; if (!this.mod || !this.mod.ok) return out;
    var topo = this.hist[this.hist.length - 1], aceso = this._chamaAcesa(), soma = this._somaVista();
    out.push({ l: 'Ar', v: this.ar === 'pouco' ? 'pouco (incompleta)' : 'suficiente (completa)' });
    // o que o sinal da chama mostra na cena, em palavras (a cor dele: azul com ar suficiente, amarela com pouco ar)
    out.push({ l: 'Chama', v: aceso ? 'acesa · ' + (this.ar === 'pouco' ? 'amarela (pouco ar)' : 'azul (ar suficiente)') : 'apagada: sem a faísca, nada reage', cls: aceso ? '' : 'val-texto' });
    out.push({ l: 'Passos aplicados', v: String(this.hist.length - 1) });
    if (soma) out.push({ l: this.lit ? 'ΔH dos passos mostrados' : 'ΔH dos passos', v: '≈ ' + Q3.Combustao.fmtKJ(soma) + ' kJ/mol' });
    if (topo.desc && topo.desc.estavel) { var pr = this._produto(topo.S); out.push({ l: 'Produtos', v: pr.nome }); out.push({ l: 'Classificação', v: pr.classe.tipo }); }
    else if (this.hist.length > 1) out.push({ l: 'Estado', v: 'radicais na cena: a cadeia continua' });
    return out;
  }

  /* a dica do rodapé do canvas: "Aperte a Faísca" só enquanto a chama está apagada (null = a do MODES) */
  dicaCanvas() {
    return this.ativo && this.mod && this.mod.ok && this._chamaAcesa()
      ? 'Arraste de um elétron (⊙) ou de uma ligação até o destino · ou toque na fonte e depois no destino' : null;
  }

  /* ══ A CENA: o sinal da chama no canto e o clarão da faísca ════
     O SINAL DA CHAMA é só desenho: a gota azul (ar suficiente) ou amarela (pouco ar), acesa, ou o contorno,
     apagada. O que ele diz em palavras (a chama, o ar, a energia dos passos) mora em Resultados — antes era um
     selo com texto, que no celular em pé ficava por baixo da pílula do modo. Fica no canto de cima, à esquerda;
     quando a pílula chega até o canto (tela estreita), desce para logo abaixo da faixa dela (ui/moldura-cena.js). */
  desenhar(ctx, W, H) {
    super.desenhar(ctx, W, H);
    if (!this.mod || !this.mod.ok) return;
    var P = Q3.Desenho.paleta(), aceso = this._chamaAcesa(), azul = this.ar !== 'pouco';
    var sl = this._lugarSelo(W), lado = sl.w, x = sl.x, y = sl.y;
    this._selo = sl;                                 // onde o sinal ficou (nas coordenadas da cena)
    var cor = aceso ? (azul ? '#3b82f6' : '#f59e0b') : P.texto;
    ctx.save();
    ctx.fillStyle = P.fundo; ctx.globalAlpha = 0.92; ctx.beginPath(); ctx.arc(x + lado / 2, y + lado / 2, lado / 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = cor; ctx.lineWidth = 1.2; ctx.stroke();
    // a chama (uma gota com ponta), azul ou amarela; apagada: só o contorno
    var fx = x + lado / 2, fy = y + lado / 2 + 1, t = performance.now() / 1000, osc = aceso ? 1 + 0.06 * Math.sin(t * 9) : 1;
    ctx.beginPath(); ctx.moveTo(fx, fy - 9 * osc); ctx.bezierCurveTo(fx + 6, fy - 2, fx + 6, fy + 6, fx, fy + 7); ctx.bezierCurveTo(fx - 6, fy + 6, fx - 6, fy - 2, fx, fy - 9 * osc); ctx.closePath();
    if (aceso) { ctx.fillStyle = cor; ctx.fill(); ctx.fillStyle = azul ? '#bfdbfe' : '#fde68a'; ctx.beginPath(); ctx.ellipse(fx, fy + 3, 2.2, 3.4, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.strokeStyle = P.texto; ctx.lineWidth = 1.4; ctx.stroke(); }
    ctx.restore();
    // o clarão da faísca: raios curtos que se abrem e somem (no meio da cena)
    var dt = (performance.now() - this._flash) / 1000;
    if (this._flash && dt < 0.7) {
      var cx = W * 0.5, cy = H * 0.5, a = 1 - dt / 0.7, r0 = 10 + 50 * dt, r1 = r0 + 18 + 30 * dt;
      ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (var i = 0; i < 10; i++) { var ang = i * Math.PI / 5 + 0.3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0); ctx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); ctx.stroke(); }
      ctx.restore();
    }
  }
}
