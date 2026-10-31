/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/bancada-geometrica.js
   ───────────────────────────────────────────────────────────────
   SIIS — MÓDULO 2: ISOMERIA GEOMÉTRICA (E/Z, cis/trans e o R/S dos
   carbonos quirais — sobretudo nos anéis). Herda a bancada do Módulo 1
   (10 espaços, arranjo pela seleção, remessas, Comparar) e acrescenta:

   ESTUDO de uma estrutura (um espaço selecionado, grande): cada dupla C=C
   e cada carbono viram alvos de toque — NEUTROS, iguais para todos, para
   não entregar quais são estereogênicos. Os H das unidades aparecem.

   PREVER → REVELAR (painel Prioridades): numa dupla, "tem isomeria?",
   a prioridade em cada carbono, E/Z e cis/trans; num carbono, "é quiral?",
   a ordem 1→4 e R/S. A revelação marca cada item (igual/diferente) e abre
   a árvore ESFERA POR ESFERA: os átomos da esfera se acendem na estrutura,
   com os conjuntos — (O,C,H) × (C,C,H) — ao lado de cada ligante.

   O GIRO DA DUPLA: arrastar uma ponta gira aquela metade contra uma
   resistência crescente (a ligação π — a 2ª linha — some com cos²θ).
   Solta antes de 90°, volta; passado o limiar, a configuração troca. Se a
   troca dá a MESMA molécula, a dupla não tem isomeria geométrica.

   A VISTA 3D do carbono quiral: o aluno gira até o ligante 4 ficar atrás;
   revelado, a seta 1→2→3 aparece.

   O LABORATÓRIO: trocar um ligante sem mexer na geometria (o E pode virar
   Z) e trocar dois ligantes de lugar num carbono quiral (R vira S).
═══════════════════════════════════════════════════════════════ */

'use strict';

var BG_CORES = ['#d9485f', '#e08a1e', '#2f80d1', '#7a869a'];     // ligante 1..4 (claro); o escuro clareia
/* AS ROTAÇÕES DA VISTA 3D: a orientação é uma MATRIZ; cada arrasto compõe um giro pequeno em torno dos
   eixos DA TELA (para o lado: o vertical; para cima/baixo: o horizontal) — qualquer orientação se alcança.
   As animações interpolam pelo caminho mais curto (quatérnios, slerp). x para a direita, y para cima, z para o observador. */
var R3 = {
  mul: function (A, B) { var C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) C[i][j] += A[i][k] * B[k][j]; return C; },
  rx: function (a) { var c = Math.cos(a), s = Math.sin(a); return [[1, 0, 0], [0, c, -s], [0, s, c]]; },
  ry: function (a) { var c = Math.cos(a), s = Math.sin(a); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; },
  ap: function (M, v) { return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]]; },
  un: function (v) { var m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; },
  cruz: function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; },
  orto: function (M) { var r0 = R3.un(M[0]), d = M[1][0] * r0[0] + M[1][1] * r0[1] + M[1][2] * r0[2], r1 = R3.un([M[1][0] - d * r0[0], M[1][1] - d * r0[1], M[1][2] - d * r0[2]]); return [r0, r1, R3.cruz(r0, r1)]; },
  quat: function (M) {
    var t = M[0][0] + M[1][1] + M[2][2], S, q;
    if (t > 0) { S = Math.sqrt(t + 1) * 2; q = [0.25 * S, (M[2][1] - M[1][2]) / S, (M[0][2] - M[2][0]) / S, (M[1][0] - M[0][1]) / S]; }
    else if (M[0][0] > M[1][1] && M[0][0] > M[2][2]) { S = Math.sqrt(1 + M[0][0] - M[1][1] - M[2][2]) * 2; q = [(M[2][1] - M[1][2]) / S, 0.25 * S, (M[0][1] + M[1][0]) / S, (M[0][2] + M[2][0]) / S]; }
    else if (M[1][1] > M[2][2]) { S = Math.sqrt(1 + M[1][1] - M[0][0] - M[2][2]) * 2; q = [(M[0][2] - M[2][0]) / S, (M[0][1] + M[1][0]) / S, 0.25 * S, (M[1][2] + M[2][1]) / S]; }
    else { S = Math.sqrt(1 + M[2][2] - M[0][0] - M[1][1]) * 2; q = [(M[1][0] - M[0][1]) / S, (M[0][2] + M[2][0]) / S, (M[1][2] + M[2][1]) / S, 0.25 * S]; }
    return q;   // [w, x, y, z]
  },
  mat: function (q) { var w = q[0], x = q[1], y = q[2], z = q[3]; return [[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]]; },
  slerp: function (a, b, t) {
    var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (d < 0) { b = b.map(function (v) { return -v; }); d = -d; }
    if (d > 0.9995) { var r = a.map(function (v, i) { return v + t * (b[i] - v); }), m = Math.hypot(r[0], r[1], r[2], r[3]); return r.map(function (v) { return v / m; }); }
    var th0 = Math.acos(d), th = th0 * t, s0 = Math.cos(th) - d * Math.sin(th) / Math.sin(th0), s1 = Math.sin(th) / Math.sin(th0);
    return a.map(function (v, i) { return s0 * v + s1 * b[i]; });
  }
};
var BG_PALETA = [['H', 'H'], ['CH₃', 'C'], ['C₂H₅', 'CC'], ['OH', 'O'], ['NH₂', 'N'], ['Cl', 'Cl'], ['Br', 'Br']];

class BancadaGeometrica extends BancadaIsomeria {
  reiniciar(inicio) {
    this.unid = null; this.esfera = 0; this.arr = null; this.rot3d = { M: R3.mul(R3.rx(0.35), R3.ry(0.5)), vx: 0, vy: 0, anim: null }; this.arr3d = null;
    this.lab = null; this._estudo = null; this._arrastou = false;
    super.reiniciar(inicio);
    if (!inicio) this._montarPrioridades();
  }
  ativar() { super.ativar(); this._ligarArrasto(); this._montarPrioridades(); }
  atualizar(dt) {
    super.atualizar(dt);
    var r3 = this.rot3d;
    if (r3.anim) {                                                    // a animação até a orientação escolhida (slerp, suave)
      r3.anim.t = Math.min(1, r3.anim.t + dt / 0.55); var tt = r3.anim.t, ease = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
      r3.M = R3.mat(R3.slerp(r3.anim.q0, r3.anim.q1, ease)); if (r3.anim.t >= 1) r3.anim = null;
    } else if (!this.arr3d && Math.abs(r3.vx) + Math.abs(r3.vy) > 0.05) {   // a inércia: continua girando e desacelera
      this._girar3d(r3.vx * dt * 60, r3.vy * dt * 60); var f = Math.exp(-dt * 5); r3.vx *= f; r3.vy *= f;
    }
    var a = this.arr;
    if (a && a.solto) {                                   // a mola (volta) ou o encaixe (troca)
      var alvo = a.theta >= 90 ? 180 : 0, v = 420 * dt;
      a.theta = Math.abs(alvo - a.theta) <= v ? alvo : a.theta + Math.sign(alvo - a.theta) * v;
      if (a.theta === alvo) { if (alvo === 180) this._concluirGiro(a); this.arr = null; }
    }
  }

  /* ══ OS ESPAÇOS: cada um com a sua geometria (lados da dupla, cunhas) ══ */
  _gerarLista(texto) { var self = this; return Q3.Estereo.gerar(texto, function (g) { return self._horizontal(Q3.Geometria.layout(g)); }); }
  _espacoDe(item, origem) { return this._espaco(item.g, origem, item); }
  _espaco(g, origem, extra) {
    var gg = g.clonar ? g.clonar() : g;
    var e = { g: gg, origem: origem, pos: extra && extra.pos ? Q3.Estereo.clonarPos(extra.pos) : this._horizontal(Q3.Geometria.layout(gg)),
              cunhas: extra && extra.cunhas ? JSON.parse(JSON.stringify(extra.cunhas)) : {}, prev: {}, revelado: {} };
    this._recalcular(e);
    return e;
  }
  _recalcular(e) {
    var E = Q3.Estereo, g = e.g;
    e.versao = (e.versao || 0) + 1;                       // os caches (molécula 3D, posições dos H) dependem dela
    e.und = E.unidades(g);
    e.und.forEach(function (u) {                          // estrutura digitada/desenhada: uma cunha padrão nos carbonos quirais
      if (u.tipo === 'centro' && u.estereogenica && (!e.cunhas[u.c] || !g.ligacao(u.c, e.cunhas[u.c].viz))) e.cunhas[u.c] = { viz: E.escolherCunha(g, u.c), z: 1 };
    });
    for (var c in e.cunhas) if (!e.und.some(function (u) { return u.tipo === 'centro' && u.estereogenica && u.c === c; })) delete e.cunhas[c];
    e.desc = E.descritores(g, e.pos, e.cunhas, e.und);
    e.ct = E.cisTrans(g, e.pos, e.cunhas, e.und);
    e.canonica = E.assinatura(g, e.desc);
    e.constitucional = Q3.Isomeros.canonica(g);
    e.nomeConst = Q3.Isomeros.nomear(g);
    var rn = Q3.Nomenclatura.nomear(g); if (!rn.ok) rn = Q3.NomenclaturaCompleta.nomear(g, { amplo: true });
    e.numeracao = rn.ok && rn.numeracao ? rn.numeracao : null;     // os localizadores do nome (C2, C6… nos ligantes de anel)
    e.nomeCompleto = E.nome(g, e.desc) || e.nomeConst;
    var todas = e.und.filter(function (u) { return u.estereogenica; }).every(function (u) { return e.revelado[BancadaGeometrica.chave(u)]; });
    e.nome = todas ? e.nomeCompleto : e.nomeConst;        // o nome com E/Z e R/S só depois de revelar (prever → revelar)
    e.formula = g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); });
  }
  static chave(u) { return u.tipo === 'dupla' ? 'd:' + [u.a, u.b].sort().join('-') : 'c:' + u.c; }
  _estudoEspaco() { return this.sel.length === 1 ? this.espacos[this.sel[0]] : null; }
  _unidade() { var e = this._estudoEspaco(); if (!e || !this.unid) return null; return e.und.filter(function (u) { return BancadaGeometrica.chave(u) === this.unid; }, this)[0] || null; }
  _mudouSelecao() { this.unid = null; this.lab = null; this.esfera = 0; super._mudouSelecao(); this._montarPrioridades(); }

  selecionarUnidade(k) {
    var e = this._estudoEspaco(); if (!e) return false;
    this.unid = k; this.esfera = 0; this.lab = null;
    var u = this._unidade();
    if (!e.prev[k]) e.prev[k] = { tem: null, ordem: [], topo: [null, null], desc: null, ct: null };
    announce(u.tipo === 'dupla' ? 'Dupla escolhida. Preveja: tem isomeria geométrica?' : 'Carbono escolhido. Preveja: ele é quiral?');
    this._montarPrioridades();
    return true;
  }

  /* ══ PREVER → REVELAR ══════════════════════════════════════════ */
  _completa(u, p) {
    if (p.tem === false) return true;
    if (p.tem !== true) return false;
    return u.tipo === 'dupla' ? (p.topo[0] !== null && p.topo[1] !== null && !!p.desc && !!p.ct) : (p.ordem.length === 4 && !!p.desc);
  }
  revelar() {
    var e = this._estudoEspaco(), u = this._unidade(); if (!e || !u) return false;
    var k = this.unid, p = e.prev[k];
    if (!this._completa(u, p)) { announce('Complete a previsão antes de revelar.'); return false; }
    e.revelado[k] = true; this.esfera = 0;
    this._recalcular(e);
    playTone(660, .08, .04);
    announce(this._textoRevelacao(e, u).replace(/<[^>]+>/g, ''));
    this._montarPrioridades();
    return true;
  }
  _descDe(e, u) { var k = BancadaGeometrica.chave(u); return e.desc.filter(function (d) { return BancadaGeometrica.chave(d.u) === k; })[0]; }
  _ctDe(e, u) { if (u.tipo !== 'dupla') return null; var k = BancadaGeometrica.chave(u); return e.ct.filter(function (c) { return c.u && BancadaGeometrica.chave(c.u) === k; })[0] || null; }
  _ligs(u) { return u.tipo === 'dupla' ? [u.ligA, u.ligB] : [u.ligs]; }
  _rotulo(e, u, lig, centro) { return Q3.Estereo.rotuloLigante(e.g, centro, lig, e.numeracao); }
  _textoRevelacao(e, u) {
    var E = Q3.Estereo, d = this._descDe(e, u), self = this;
    if (!u.estereogenica) {
      if (u.tipo === 'dupla') {
        var fim = Q3.Estereo.compara(u.ligA[0], u.ligA[1]) === 0 ? u.a : u.b, ls = fim === u.a ? u.ligA : u.ligB;
        return 'Sem isomeria geométrica: um dos carbonos da dupla tem dois ligantes iguais (' + this._rotulo(e, u, ls[0], fim) + ' e ' + this._rotulo(e, u, ls[1], fim) + '). Girar essa ponta dá a mesma molécula.';
      }
      return 'Não é quiral: dois dos quatro ligantes são iguais — ou há uma ligação dupla (o carbono não é sp³ com quatro ligantes).';
    }
    if (u.tipo === 'dupla') {
      var t1 = this._rotulo(e, u, u.ligA[0], u.a), t2 = this._rotulo(e, u, u.ligB[0], u.b), ct = this._ctDe(e, u);
      return 'Em cada carbono, a prioridade é de ' + t1 + ' e de ' + t2 + '. Eles estão ' + (d.d === 'Z' ? 'do mesmo lado: <strong>Z</strong>' : 'em lados opostos: <strong>E</strong>') + '.' + (ct ? ' Cada carbono tem um H e um outro ligante: <strong>' + ct.d + '</strong>.' : ' O cis/trans não se aplica: não há um H em cada carbono.');
    }
    return 'Com o ligante 4 (' + this._rotulo(e, u, u.ligs[3], u.c) + ') para trás, 1 → 2 → 3 gira no sentido ' + (d.d === 'R' ? 'horário: <strong>R</strong>' : 'anti-horário: <strong>S</strong>') + '. Na vista 3D, gire até o 4 ficar atrás para ver a seta.';
  }

  /* ══ O GIRO DA DUPLA ══════════════════════════════════════════ */
  _ladoGiro(g, a, b) { var vis = {}; vis[a] = 1; vis[b] = 1; var fila = [b], lista = [b]; while (fila.length) { var x = fila.shift(); g.vizinhos(x).forEach(function (v) { if (!vis[v.id]) { vis[v.id] = 1; fila.push(v.id); lista.push(v.id); } }); } return lista; }
  _concluirGiro(a) {
    var e = this.espacos[a.slot]; if (!e) return;
    var antes = e.canonica, dAntes = (this._descDe(e, a.u) || {}).d;
    Q3.Estereo.refletirLado(e.g, e.pos, a.fixo, a.gira);
    this._recalcular(e);
    var u2 = e.und.filter(function (x) { return BancadaGeometrica.chave(x) === BancadaGeometrica.chave(a.u); })[0];
    if (e.canonica === antes) announce('A mesma molécula: girar esta ponta não muda nada — um dos carbonos da dupla tem dois ligantes iguais.');
    else announce('A outra configuração' + (e.revelado[BancadaGeometrica.chave(a.u)] && u2 ? ': ' + dAntes + ' virou ' + (this._descDe(e, u2) || {}).d + '.' : '.') + ' Para voltar, a ligação π teria de se romper de novo.');
    this._montarPrioridades();
  }
  _ligarArrasto() {
    if (this._arrastoLigado) return; this._arrastoLigado = true;
    var self = this, cv = document.getElementById('sim-canvas'); if (!cv) return;
    var ponto = function (ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left - (cv.cenaX || 0), y: ev.clientY - r.top }; }   // na cena (a área livre do card flutuante);
    cv.addEventListener('pointerdown', function (ev) {
      if (!self.ativo || self.fonte !== 'bancada' || !self._estudo) return;
      var p = ponto(ev), s = self._estudo;
      if (s.w3d && p.x >= s.w3d.x && p.x <= s.w3d.x + s.w3d.w && p.y >= s.w3d.y && p.y <= s.w3d.y + s.w3d.h) {
        self.arr3d = { x: p.x, y: p.y, x0: p.x, y0: p.y, t: performance.now(), moveu: false };
        self.rot3d.vx = self.rot3d.vy = 0; self.rot3d.anim = null; self._arrastou = false;
        try { cv.setPointerCapture(ev.pointerId); } catch (e) {}           // o arrasto continua mesmo fora da vista
        return;
      }
      if (self.lab) return;
      var melhor = null;
      (s.pontas || []).forEach(function (pt) { var d = Math.hypot(pt.x - p.x, pt.y - p.y); if (d < 46 && (!melhor || d < melhor.d)) melhor = { d: d, pt: pt }; });
      if (melhor) { self.arr = { slot: s.slot, u: melhor.pt.u, fixo: melhor.pt.fixo, gira: melhor.pt.gira, y0: p.y, yUlt: p.y, theta: 0, solto: false }; self._arrastou = false; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} }
    });
    cv.addEventListener('pointermove', function (ev) {
      var p = ponto(ev);
      if (self.arr3d) {
        var a3 = self.arr3d, dx = p.x - a3.x, dy = p.y - a3.y, agora = performance.now(), dtm = Math.max(1, agora - a3.t);
        if (Math.abs(p.x - a3.x0) + Math.abs(p.y - a3.y0) > 3) { a3.moveu = true; self._arrastou = true; }
        self._girar3d(dx, dy);
        self.rot3d.vx = 0.55 * self.rot3d.vx + 0.45 * (dx / dtm * 16); self.rot3d.vy = 0.55 * self.rot3d.vy + 0.45 * (dy / dtm * 16);
        a3.x = p.x; a3.y = p.y; a3.t = agora;
        return;
      }
      var a = self.arr; if (!a || a.solto) return;
      var dy2 = Math.abs(p.y - a.yUlt); a.yUlt = p.y; if (Math.abs(p.y - a.y0) > 4) self._arrastou = true;
      // a RESISTÊNCIA cresce com o ângulo: cada pixel gira menos perto de 90°
      a.theta = Math.max(0, Math.min(180, a.theta + dy2 * 1.1 / (1 + 2.2 * Math.sin(a.theta * Math.PI / 180))));
    });
    var soltar = function () {
      if (self.arr3d) {
        var a3 = self.arr3d; self.arr3d = null;
        if (!a3.moveu) {                                            // um toque: o ligante tocado vai para trás
          var bolas = (self._estudo && self._estudo.bolas3d) || [], perto = null;
          bolas.forEach(function (b) { var d = Math.hypot(b.x - a3.x0, b.y - a3.y0); if (d < b.r + 8 && (!perto || d < perto.d)) perto = { d: d, i: b.i }; });
          if (perto) { self._mandarParaTras(perto.i); self._arrastou = true; }
          self.rot3d.vx = self.rot3d.vy = 0;
        } else if (performance.now() - a3.t > 90) { self.rot3d.vx = self.rot3d.vy = 0; }   // parou antes de soltar: sem inércia
        return;
      } if (self.arr && !self.arr.solto) { self.arr.solto = true; if (self.arr.theta < 90 && self.arr.theta > 5) announce('Voltou: antes de 90°, a ligação π puxa a estrutura de volta.'); } };
    cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', soltar);
  }

  /* ══ O LABORATÓRIO DE LIGANTES ══════════════════════════════════ */
  _posImplicita(e, u, fimA) {                               // onde fica o H implícito (para trocá-lo por um grupo)
    var pos = e.pos;
    if (u.tipo === 'dupla') {
      var a = fimA ? u.a : u.b, b = fimA ? u.b : u.a, ls = fimA ? u.ligA : u.ligB, outro = ls.filter(function (l) { return l.id; })[0];
      var A = pos[a], B = pos[b];
      if (!outro) { var ux = A.x - B.x, uy = A.y - B.y, n = Math.hypot(ux, uy) || 1; return { x: A.x + ux / n * 0.8 - uy / n * 0.7, y: A.y + uy / n * 0.8 + ux / n * 0.7 }; }
      var P = pos[outro.id], dx = B.x - A.x, dy = B.y - A.y, L = dx * dx + dy * dy || 1, t = ((P.x - A.x) * dx + (P.y - A.y) * dy) / L, fx = A.x + t * dx, fy = A.y + t * dy;
      return { x: 2 * fx - P.x, y: 2 * fy - P.y };
    }
    // no carbono: o H vai para o MAIOR VÃO entre os outros ligantes (a convenção dos livros); a cunha dele sai de vetores()
    var c0 = pos[u.c], angs = e.g.vizinhos(u.c).map(function (v2) { return Math.atan2(pos[v2.id].y - c0.y, pos[v2.id].x - c0.x); }).sort(function (a, b) { return a - b; });
    if (!angs.length) return { x: c0.x + 1, y: c0.y };
    var melhor = { vao: -1, meio: 0 };
    angs.forEach(function (a1, i) { var a2 = i + 1 < angs.length ? angs[i + 1] : angs[0] + 2 * Math.PI, vao = a2 - a1; if (vao > melhor.vao) melhor = { vao: vao, meio: a1 + vao / 2 }; });
    return { x: c0.x + Math.cos(melhor.meio) * 0.85, y: c0.y + Math.sin(melhor.meio) * 0.85 };
  }
  _ligantesLab(e, u) {
    var ligs = [];
    this._ligs(u).forEach(function (ls, k) { var c = u.tipo === 'dupla' ? (k ? u.b : u.a) : u.c; ls.forEach(function (l) { ligs.push({ lig: l, centro: c, rot: Q3.Estereo.rotuloLigante(e.g, c, l, e.numeracao) }); }); });
    return ligs;
  }
  trocarLigante(novo) {
    var e = this._estudoEspaco(), u = this._unidade(); if (!e || !u || !this.lab || this.lab.lig == null) return false;
    var g = e.g, info = this.lab.ligs[this.lab.lig], centro = info.centro, lig = info.lig;
    var pAlvo;
    if (lig.id) {                                         // tira o ligante antigo (o átomo e o que vem depois dele)
      pAlvo = e.pos[lig.id];
      var fora = this._ladoGiro(g, centro, lig.id);
      fora.forEach(function (id) { g.removeAtomo(id); delete e.pos[id]; });
    } else { var kH = this.lab.ligs.slice(0, this.lab.lig).filter(function (x) { return !x.lig.id && x.centro === centro; }).length; pAlvo = (this._hAbs(e)[centro] || [])[kH] || this._posImplicita(e, u, u.tipo === 'dupla' ? centro === u.a : true); }
    if (novo !== 'H') {                                   // o novo, no mesmo lugar (a geometria não muda)
      var cadeia = novo === 'CC' ? ['C', 'C'] : [novo], ant = centro, P0 = e.pos[centro], dir = { x: pAlvo.x - P0.x, y: pAlvo.y - P0.y };
      cadeia.forEach(function (el, i) { var id = g.addAtomo(el); g.addLigacao(ant, id, 1); e.pos[id] = { x: pAlvo.x + dir.x * i * 0.9, y: pAlvo.y + dir.y * i * 0.9 - (i ? 0.45 : 0) }; if (i === 0 && e.cunhas[centro] && e.cunhas[centro].viz === lig.id) e.cunhas[centro].viz = id; ant = id; });
    }
    var dAntes = (this._descDe(e, u) || {}).d;
    this._recalcular(e);
    var u2 = e.und.filter(function (x) { return BancadaGeometrica.chave(x) === this.unid; }, this)[0];
    this.lab.lig = null;
    if (u2) this.lab.ligs = this._ligantesLab(e, u2); else { this.lab = null; this.unid = null; }   // a lista antiga apontava para o ligante trocado
    announce('Ligante trocado. ' + (u2 && u2.estereogenica ? 'Agora: ' + (this._descDe(e, u2) || {}).d + (dAntes && dAntes !== (this._descDe(e, u2) || {}).d ? ' (antes: ' + dAntes + '), sem mexer na geometria.' : '.') : 'Esta unidade deixou de ser estereogênica.'));
    this._montarPrioridades();
    return true;
  }
  trocarDeLugar() {                                          // num carbono quiral: dois ligantes trocam de posição → R vira S
    var e = this._estudoEspaco(), u = this._unidade(); if (!e || !u || u.tipo !== 'centro' || !this.lab || this.lab.par.length !== 2) return false;
    var L = this.lab.ligs, a = L[this.lab.par[0]].lig, b = L[this.lab.par[1]].lig;
    var dAntes = (this._descDe(e, u) || {}).d, cu = e.cunhas[u.c];
    if (a.id && b.id) {                                       // troca as posições dos dois ramos (e a cunha acompanha a posição)
      var ra = this._ladoGiro(e.g, u.c, a.id), rb = this._ladoGiro(e.g, u.c, b.id), pa = e.pos[a.id], pb = e.pos[b.id];
      var dxa = pb.x - pa.x, dya = pb.y - pa.y;
      ra.forEach(function (id) { e.pos[id] = { x: e.pos[id].x + dxa, y: e.pos[id].y + dya }; });
      rb.forEach(function (id) { e.pos[id] = { x: e.pos[id].x - dxa, y: e.pos[id].y - dya }; });
      if (cu && (cu.viz === a.id || cu.viz === b.id)) cu.viz = cu.viz === a.id ? b.id : a.id;
    } else if (cu) cu.z = -cu.z;                              // com o H implícito: inverter a cunha tem o mesmo efeito
    this._recalcular(e);
    this.lab.par = [];
    var u3 = e.und.filter(function (x) { return BancadaGeometrica.chave(x) === this.unid; }, this)[0]; if (u3) this.lab.ligs = this._ligantesLab(e, u3);
    announce('Dois ligantes trocaram de lugar: ' + dAntes + ' virou ' + (this._descDe(e, u) || {}).d + '. Trocar dois ligantes quaisquer sempre inverte a configuração.');
    this._montarPrioridades();
    return true;
  }

  /* ══ ENTRADA ═══════════════════════════════════════════════════ */
  tocar(x, y) {
    if (this.fonte === 'desenhar') return this.editor.tocar(x, y);
    if (this._arrastou) { this._arrastou = false; return true; }
    var s = this._estudo;
    if (s && this.sel.length === 1 && s.slot === this.sel[0] && x >= s.card.x && x <= s.card.x + s.card.w && y >= s.card.y && y <= s.card.y + s.card.h) {
      if (this.lab) {
        var hit = null; (s.ligs || []).forEach(function (l, i) { var d = Math.hypot(l.x - x, l.y - y); if (d < 22 && (!hit || d < hit.d)) hit = { d: d, i: i }; });
        if (hit) {
          if (this.lab.modo === 'lugar') { if (this.lab.par.indexOf(hit.i) < 0) this.lab.par.push(hit.i); if (this.lab.par.length === 2) this.trocarDeLugar(); else announce('Toque no segundo ligante.'); }
          else { this.lab.lig = hit.i; announce('Ligante escolhido: ' + this.lab.ligs[hit.i].rot + '. Escolha o novo no painel.'); }
          this._montarPrioridades(); return true;
        }
      }
      var alvo = null; (s.alvos || []).forEach(function (a) { var d = Math.hypot(a.x - x, a.y - y); if (d < a.r && (!alvo || d < alvo.d)) alvo = { d: d, a: a }; });
      if (alvo) return this.selecionarUnidade(alvo.a.k);
      return true;                                          // um toque no cartão grande não solta o espaço
    }
    return super.tocar(x, y);
  }
  acao(nome) {
    var e = this._estudoEspaco(), u = this._unidade(), p = e && u ? e.prev[this.unid] : null;
    if (nome === 'bg-revelar') return this.revelar();
    if (nome === 'bg-padrao3d') return u && u.tipo === 'centro' ? this._mandarParaTras(3, 0) : false;
    if (nome === 'bg-soltar') { this.sel = []; this._mudouSelecao(); return true; }
    if (nome === 'bg-outra') { this.unid = null; this.lab = null; this._montarPrioridades(); return true; }
    if (nome === 'bg-esfera+' || nome === 'bg-esfera-') { var max = u ? Q3.Estereo.rastro(this._ligs(u)[0]).esferas.length - 1 : 0; this.esfera = Math.max(0, Math.min(max, this.esfera + (nome === 'bg-esfera+' ? 1 : -1))); this._montarPrioridades(); return true; }
    if (nome === 'bg-lab' || nome === 'bg-lugar') {
      if (!u) return false;
      if (this.lab && this.lab.modo === (nome === 'bg-lab' ? 'trocar' : 'lugar')) { this.lab = null; this._montarPrioridades(); return true; }
      this.lab = { modo: nome === 'bg-lab' ? 'trocar' : 'lugar', ligs: this._ligantesLab(e, u), lig: null, par: [] };
      announce(nome === 'bg-lab' ? 'Toque num ligante na estrutura e escolha o novo no painel.' : 'Toque em dois ligantes do carbono para trocá-los de lugar.');
      this._montarPrioridades(); return true;
    }
    if (nome.indexOf('bg-novo:') === 0) return this.trocarLigante(nome.slice(8));
    if (nome === 'bg-acao') { if (u && p && !e.revelado[this.unid] && this._completa(u, p)) return this.revelar(); return super.acao('bi-acao'); }
    return super.acao(nome);
  }

  /* ══ COMPARAR (com a configuração) ═════════════════════════════ */
  comparar() {
    if (this.sel.length !== 2) { announce('Selecione dois espaços para comparar.'); return false; }
    var A = this.espacos[this.sel[0]], B = this.espacos[this.sel[1]];
    if (!A || !B) { announce('Um dos espaços selecionados está vazio.'); return false; }
    var r;
    if (A.constitucional !== B.constitucional) r = Q3.Isomeros.classificar(A.g, B.g);
    else if (A.canonica === B.canonica) r = { veredito: 'mesma', texto: 'Mesma molécula: mesmas ligações e a mesma configuração em todas as unidades.' };
    else {
      var inv = function (e) { return Q3.Estereo.assinatura(e.g, e.desc.map(function (d) { return { u: d.u, tipo: d.tipo, d: d.d === 'R' ? 'S' : d.d === 'S' ? 'R' : d.d }; })); };
      var soDuplas = A.desc.every(function (d, i) { return d.tipo !== 'centro'; }) && B.desc.every(function (d) { return d.tipo !== 'centro'; });
      var anelCT = A.ct.some(function (c) { return c.anel; });
      if (inv(A) === B.canonica) r = { veredito: 'isomeros', subtipo: 'enantiômeros', titulo: 'Enantiômeros', texto: 'Um é a imagem especular do outro, e não se sobrepõem: todos os carbonos quirais têm a configuração invertida (R ⇄ S).' };
      else if (soDuplas || anelCT) r = { veredito: 'isomeros', subtipo: 'geométrica', titulo: 'Isômeros geométricos', texto: 'Mesmas ligações, com os ligantes ' + (soDuplas ? 'da dupla' : 'do anel') + ' em lados diferentes (cis × trans; E × Z). Um não vira o outro sem romper a ligação π' + (soDuplas ? '' : ' ou o anel') + '.' };
      else r = { veredito: 'isomeros', subtipo: 'diastereoisômeros', titulo: 'Diastereoisômeros', texto: 'Estereoisômeros que não são imagens especulares: só parte das unidades tem a configuração invertida.' };
    }
    this.veredito = { r: r, a: this.sel[0], b: this.sel[1] };
    playTone(660, .08, .04); announce(r.texto);
    this._sincronizarPainel();
    return true;
  }

  /* ══ DESENHO ═══════════════════════════════════════════════════ */
  desenhar(ctx, W, H) {
    this._estudo = null;
    try { super.desenhar(ctx, W, H); }
    catch (err) { if (!this._erroDesenho) { this._erroDesenho = true; console.error('SIIS · Módulo 2: erro ao desenhar (a tela continua):', err); } ctx.restore && ctx.restore(); }
  }
  _cartao(ctx, i, r, P) { this._cartaoAtual = { i: i, r: r }; super._cartao(ctx, i, r, P); }

  _projecao(e) {                                             // as posições com o giro em andamento (a metade que gira se "achata" com cos θ)
    var a = this.arr; if (!a || this.espacos[a.slot] !== e || !a.theta) return e.pos;
    var pos = {}, lado = this._ladoGiro(e.g, a.fixo, a.gira), A = e.pos[a.fixo], B = e.pos[a.gira], dx = B.x - A.x, dy = B.y - A.y, L = dx * dx + dy * dy || 1, c = Math.cos(a.theta * Math.PI / 180);
    for (var k in e.pos) pos[k] = e.pos[k];
    lado.forEach(function (id) { if (id === a.gira) return; var p = e.pos[id], t = ((p.x - A.x) * dx + (p.y - A.y) * dy) / L, fx = A.x + t * dx, fy = A.y + t * dy; pos[id] = { x: fx + (p.x - fx) * c, y: fy + (p.y - fy) * c }; });
    return pos;
  }




  _estrutura(ctx, e, a, P) {
    var g = e.g, self = this, idx = this._cartaoAtual ? this._cartaoAtual.i : -1;
    var estudo = this.sel.length === 1 && this.sel[0] === idx;
    if (this._ehTres()) { this._desenhar3DCartao(ctx, e, a, P, this.vista); return; }     // espacial: só para ver (o arrasto gira)
    // no carbono quiral, a vista 3D divide o espaço: ao lado (tela larga) ou embaixo (tela estreita)
    var com3d = estudo && this._unidade() && this._unidade().tipo === 'centro', estreito = a.w < 520;
    var area = !com3d ? a : estreito ? { x: a.x, y: a.y, w: a.w, h: a.h * 0.58 } : { x: a.x, y: a.y, w: a.w * 0.62, h: a.h };
    // no estudo, a dupla escolhida fica na HORIZONTAL (girar no plano não muda E/Z nem R/S)
    var u0 = estudo ? this._unidade() : null, ang = u0 && u0.tipo === 'dupla' ? Math.atan2(e.pos[u0.b].y - e.pos[u0.a].y, e.pos[u0.b].x - e.pos[u0.a].x) : 0;
    var ca = Math.cos(-ang), sa = Math.sin(-ang);
    // o giro da dupla: a metade que gira se achata com cos θ — os átomos E os H dela
    var ar = this.arr && this.espacos[this.arr.slot] === e && this.arr.theta ? this.arr : null, ladoG = ar ? this._ladoGiro(g, ar.fixo, ar.gira) : [];
    var tf = function (p, dono) {
      var q = p;
      if (ar && ladoG.indexOf(dono) >= 0) { var A = e.pos[ar.fixo], B = e.pos[ar.gira], dx = B.x - A.x, dy = B.y - A.y, L2 = dx * dx + dy * dy || 1, c = Math.cos(ar.theta * Math.PI / 180), t = ((p.x - A.x) * dx + (p.y - A.y) * dy) / L2, fx = A.x + t * dx, fy = A.y + t * dy; q = { x: fx + (p.x - fx) * c, y: fy + (p.y - fy) * c }; }
      return { x: q.x * ca - q.y * sa, y: q.x * sa + q.y * ca };
    };
    var u = estudo ? this._unidade() : null, rev = u && e.revelado[this.unid];
    var ehGiro = function (l) { return ar && ((l.a === ar.fixo && l.b === ar.gira) || (l.b === ar.fixo && l.a === ar.gira)); };
    var r = this._desenharVista(ctx, e, area, P, { mini: false, cap: estudo ? 120 : 84, tf: tf, comEstereo: true, precisaH: true,
      antes: function (T, HT, fonte) {                          // o realce da esfera (revelado), por baixo da molécula
        if (!(rev && (u.estereogenica || u.tipo === 'centro'))) return;
        self._ligs(u).forEach(function (ls) {
          var rs = Q3.Estereo.rastro(ls), k = Math.min(self.esfera, rs.atomos.length - 1);
          ls.forEach(function (l, i) { (rs.atomos[k][i] || []).forEach(function (id) { var p = T(id); if (!p) return; ctx.save(); ctx.fillStyle = biRgba(BG_CORES[u.tipo === 'dupla' ? i * 2 : i], 0.28); ctx.beginPath(); ctx.arc(p.x, p.y, fonte * 1.25, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }); });
        });
      },
      mexer: function () { if (!ar) return null; var l = g.ligacoes.filter(ehGiro)[0]; if (!l) return null; var o0 = l.ordem; l.ordem = 1; return function () { l.ordem = o0; }; }
    });
    var T = r.T, HT = r.HT, fonte = r.fonte, vista = this.vista;
    if (ar) {                                                    // a π da dupla que gira, sumindo com cos²θ
      var c2 = Math.pow(Math.cos(ar.theta * Math.PI / 180), 2), p1 = T(ar.fixo), q1 = T(ar.gira), dx1 = q1.y - p1.y, dy1 = p1.x - q1.x, n1 = Math.hypot(dx1, dy1) || 1;
      ctx.save(); ctx.globalAlpha = c2; ctx.strokeStyle = P.acento; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(p1.x + dx1 / n1 * 6, p1.y + dy1 / n1 * 6); ctx.lineTo(q1.x + dx1 / n1 * 6, q1.y + dy1 / n1 * 6); ctx.stroke(); ctx.restore();
    }
    if (!estudo) return;
    var posLig = function (centro, lig, kH) { if (lig.id) return T(lig.id) || T(centro); var lista = HT[centro]; return lista && lista[kH] ? lista[kH] : T(centro); };
    var mostraH = vista === 'completa' || vista === 'lewis';
    // ── a camada de estudo: os alvos neutros, as pontas que giram, os H das unidades (nas vistas sem H), o laboratório
    var est = this._estudo = { slot: idx, card: this._cartaoAtual.r, alvos: [], pontas: [], ligs: [] };
    e.und.forEach(function (un) {
      var k = BancadaGeometrica.chave(un), ativo = k === self.unid;
      if (un.tipo === 'dupla') {
        var pa = T(un.a), pb = T(un.b), mxx = (pa.x + pb.x) / 2, myy = (pa.y + pb.y) / 2;
        est.alvos.push({ k: k, x: mxx, y: myy, r: 20 });
        est.pontas.push({ u: un, fixo: un.a, gira: un.b, x: pb.x, y: pb.y }, { u: un, fixo: un.b, gira: un.a, x: pa.x, y: pa.y });
        ctx.save(); ctx.strokeStyle = ativo ? P.acento : biRgba(P.suave, 0.7); ctx.lineWidth = ativo ? 2.5 : 1.3; if (!ativo) ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.ellipse(mxx, myy, Math.hypot(pb.x - pa.x, pb.y - pa.y) / 2 + 14, 16, Math.atan2(pb.y - pa.y, pb.x - pa.x), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        if (!mostraH) [[un.a, un.ligA], [un.b, un.ligB]].forEach(function (x) { var kH = 0; x[1].forEach(function (l) { if (!l.id) self._hImplicito(ctx, T(x[0]), posLig(x[0], l, kH++), P, fonte); }); });
      } else {
        est.alvos.push({ k: k, x: T(un.c).x, y: T(un.c).y, r: 18 });
        ctx.save(); ctx.strokeStyle = ativo ? P.acento : biRgba(P.suave, 0.55); ctx.lineWidth = ativo ? 2.5 : 1.1; if (!ativo) ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.arc(T(un.c).x, T(un.c).y, fonte * 1.35, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        if (!mostraH && ativo && un.ligs.some(function (l) { return !l.id; })) self._hImplicito(ctx, T(un.c), posLig(un.c, un.ligs.filter(function (l) { return !l.id; })[0], 0), P, fonte);
      }
    });
    // os ligantes do laboratório (os mesmos pontos desenhados)
    if (u && this.lab) {
      var contH = {};
      this.lab.ligs.forEach(function (li, i) {
        var kH = li.lig.id ? 0 : (contH[li.centro] = (contH[li.centro] || 0) + 1) - 1, p = posLig(li.centro, li.lig, kH);
        est.ligs.push({ x: p.x, y: p.y });
        var marc = self.lab.lig === i || self.lab.par.indexOf(i) >= 0;
        ctx.save(); ctx.strokeStyle = marc ? P.acento : biRgba(P.acento, 0.5); ctx.lineWidth = marc ? 3 : 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, fonte * 1.2, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      });
    }
    // os conjuntos da esfera, ao lado de cada ligante (revelado)
    if (rev && u.estereogenica) {
      this._ligs(u).forEach(function (ls, kk) {
        var rs = Q3.Estereo.rastro(ls), k = Math.min(self.esfera, rs.esferas.length - 1), centro = u.tipo === 'dupla' ? (kk ? u.b : u.a) : u.c, kH = 0;
        ls.forEach(function (l, i) {
          var p = posLig(centro, l, l.id ? 0 : kH++), c0 = T(centro);
          var txt = (rs.esferas[k][i] || []).map(function (st) { return '(' + (st.length ? st.join(',') : '–') + ')'; }).join(' ');
          var dx = p.x - c0.x, dy = p.y - c0.y, n = Math.hypot(dx, dy) || 1, lx = p.x + dx / n * 52, ly = p.y + dy / n * 34;
          ctx.save(); ctx.font = '700 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          var w = ctx.measureText(txt).width + 12, cor = BG_CORES[u.tipo === 'dupla' ? i * 2 : i];
          ctx.fillStyle = biRgba(P.fundo, 0.94); ctx.strokeStyle = cor; ctx.lineWidth = 1.5; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx - w / 2, ly - 11, w, 22, 7); else ctx.rect(lx - w / 2, ly - 11, w, 22); ctx.fill(); ctx.stroke();
          ctx.fillStyle = P.texto; ctx.fillText(txt, lx, ly); ctx.restore();
        });
      });
    }
    if (u && u.tipo === 'centro') {                             // números e seta só num carbono QUIRAL revelado (sem ordem 1→4 com ligantes iguais)
      rev = rev && u.estereogenica;
      var lado3 = estreito ? Math.min(a.w * 0.7, a.h * 0.38) : Math.min(a.h * 0.72, a.w * 0.34);
      this._vista3d(ctx, e, u, estreito ? { x: a.x + (a.w - lado3) / 2, y: a.y + a.h * 0.58, w: lado3, h: lado3 } : { x: a.x + a.w * 0.64, y: a.y + (a.h - lado3) / 2, w: lado3, h: lado3 }, P, rev);
    }
  }
  _hImplicito(ctx, c, h, P, fonte, z) {
    ctx.save(); var fim = { x: c.x + (h.x - c.x) * 0.72, y: c.y + (h.y - c.y) * 0.72 };
    if (z) this._traco(ctx, c, fim, z, biRgba(P.suave, 0.9), 4);          // o H do carbono quiral: cunha cheia (frente) ou tracejada (trás)
    else { ctx.strokeStyle = biRgba(P.suave, 0.8); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(fim.x, fim.y); ctx.stroke(); }
    ctx.fillStyle = P.suave; ctx.font = '600 ' + Math.round(fonte * 0.9) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', h.x, h.y); ctx.restore();
  }

  _girar3d(dx, dy) { var k = 0.0165; this.rot3d.M = R3.orto(R3.mul(R3.rx(dy * k), R3.mul(R3.ry(dx * k), this.rot3d.M))); }
  _vetores3d() { var e = this._estudoEspaco(), u = this._unidade(); if (!e || !u || u.tipo !== 'centro') return null; return Q3.Estereo.tetraedroIdeal(Q3.Estereo.vetores(e.g, e.pos, e.cunhas, u.c, u.ligs)).map(R3.un); }
  /* leva o ligante i para trás (−z); em cima fica o ligante 'cima' (ou o que já estava mais alto) */
  _mandarParaTras(i, cima) {
    var vs = this._vetores3d(); if (!vs) return false;
    var M = this.rot3d.M, Z = vs[i].map(function (v) { return -v; });
    if (cima === undefined) { var alto = -9; vs.forEach(function (v, k) { if (k === i) return; var y = R3.ap(M, v)[1]; if (y > alto) { alto = y; cima = k; } }); }
    var vc = vs[cima], d = vc[0] * Z[0] + vc[1] * Z[1] + vc[2] * Z[2], Y = R3.un([vc[0] - d * Z[0], vc[1] - d * Z[1], vc[2] - d * Z[2]]), X = R3.cruz(Y, Z);
    var T = [X, Y, Z];
    /* o de trás NÃO fica escondido atrás do carbono: inclina ~28° para o maior espaço livre entre os três da frente
       (no empate, para baixo — entre o 2 e o 3), e continua bem atrás. Assim se vê os três da frente e o de trás. */
    var angs = []; vs.forEach(function (v, k) { if (k === i) return; var q = R3.ap(T, v); angs.push(Math.atan2(q[1], q[0])); });
    angs.sort(function (a1, b1) { return a1 - b1; });
    var melhorV = null;
    angs.forEach(function (a1, k) {
      var a2 = k + 1 < angs.length ? angs[k + 1] : angs[0] + 2 * Math.PI, vao = a2 - a1, meio = a1 + vao / 2;
      var paraBaixo = Math.abs(Math.atan2(Math.sin(meio + Math.PI / 2), Math.cos(meio + Math.PI / 2)));     // distância do "para baixo"
      if (!melhorV || vao > melhorV.vao + 0.26 || (Math.abs(vao - melhorV.vao) <= 0.26 && paraBaixo < melhorV.pb)) melhorV = { vao: vao, meio: meio, pb: paraBaixo };
    });
    var dx = Math.cos(melhorV.meio), dy = Math.sin(melhorV.meio), alfa = 28 * Math.PI / 180;
    var kx = dy, ky = -dx, c = Math.cos(alfa), sn = Math.sin(alfa);                     // giro em torno de (dy, −dx, 0): leva o −z na direção (dx, dy)
    var Rt = [[c + kx * kx * (1 - c), kx * ky * (1 - c), ky * sn], [ky * kx * (1 - c), c + ky * ky * (1 - c), -kx * sn], [-ky * sn, kx * sn, c]];
    this.rot3d.anim = { q0: R3.quat(M), q1: R3.quat(R3.orto(R3.mul(Rt, T))), t: 0 }; this.rot3d.vx = this.rot3d.vy = 0;
    var e = this._estudoEspaco(), u = this._unidade();
    announce(Q3.Estereo.rotuloLigante(e.g, u.c, u.ligs[i], e.numeracao) + ' para trás' + (cima !== undefined ? ', ' + Q3.Estereo.rotuloLigante(e.g, u.c, u.ligs[cima], e.numeracao) + ' em cima.' : '.'));
    return true;
  }
  /* a vista 3D do carbono: o centro e os 4 ligantes; gira com o arrasto. Revelado: os números e a seta 1→2→3 com o 4 atrás */
  _vista3d(ctx, e, u, r, P, rev) {
    var vs = Q3.Estereo.tetraedroIdeal(Q3.Estereo.vetores(e.g, e.pos, e.cunhas, u.c, u.ligs)), M3 = this.rot3d.M;   // o tetraedro regular (só para mostrar)
    this._estudo.w3d = r;
    var rot = function (v) { return R3.ap(M3, R3.un(v)); };
    var cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = Math.min(r.w, r.h) * 0.36;
    ctx.save(); ctx.fillStyle = biRgba(P.fundo, 0.7); ctx.strokeStyle = biRgba(P.suave, 0.45); ctx.lineWidth = 1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(r.x, r.y, r.w, r.h, 10); else ctx.rect(r.x, r.y, r.w, r.h); ctx.fill(); ctx.stroke();
    var pts = vs.map(function (v, i) { var q = rot(v); return { i: i, x: cx + q[0] * R, y: cy - q[1] * R, z: q[2], rot: Q3.Estereo.rotuloLigante(e.g, u.c, u.ligs[i], e.numeracao, true) }; });
    this._estudo.bolas3d = pts.map(function (q) { return { i: q.i, x: q.x, y: q.y, r: 13 + 4 * q.z }; });
    pts.slice().sort(function (a, b) { return a.z - b.z; }).forEach(function (p) {
      ctx.strokeStyle = biRgba(P.texto, 0.55 + 0.35 * (p.z + 1) / 2); ctx.lineWidth = p.z > 0.35 ? 3.4 : 2 + 0.6 * p.z;
      if (p.z < -0.35) ctx.setLineDash([4, 4]);                                          // atrás: tracejada, como a cunha tracejada do papel
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.setLineDash([]);
      var rb = 13 + 4 * p.z, cor = rev ? BG_CORES[p.i] : P.suave;
      ctx.fillStyle = biRgba(cor, 0.35 + 0.45 * (p.z + 1) / 2); ctx.beginPath(); ctx.arc(p.x, p.y, rb, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = P.texto; ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(rev ? String(p.i + 1) : p.rot, p.x, p.y);
      if (rev) { ctx.font = '600 9.5px system-ui, sans-serif'; ctx.fillStyle = P.suave; ctx.fillText(p.rot, p.x, p.y + rb + 8); }
      if (p.i === 0 || p.i === 1) { ctx.fillStyle = P.texto; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill(); }
    });
    if (rev && pts[3].z < -0.55) {                         // o 4 está atrás: a seta 1 → 2 → 3
      ctx.strokeStyle = P.acento; ctx.lineWidth = 2.5; ctx.beginPath();
      [0, 1, 2].forEach(function (k) { var a1 = pts[k], a2 = pts[(k + 1) % 3]; if (k === 2) return; var mx = (a1.x + a2.x) / 2, my = (a1.y + a2.y) / 2, ox = (mx - cx) * 0.5, oy = (my - cy) * 0.5; if (!k) ctx.moveTo(a1.x, a1.y); ctx.quadraticCurveTo(mx + ox, my + oy, a2.x, a2.y); });
      ctx.stroke();
      var ult = pts[2], pen = pts[1], ang = Math.atan2(ult.y - pen.y, ult.x - pen.x);
      ctx.fillStyle = P.acento; ctx.beginPath(); ctx.moveTo(ult.x, ult.y); ctx.lineTo(ult.x - 11 * Math.cos(ang - 0.45), ult.y - 11 * Math.sin(ang - 0.45)); ctx.lineTo(ult.x - 11 * Math.cos(ang + 0.45), ult.y - 11 * Math.sin(ang + 0.45)); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  /* ══ O PAINEL PRIORIDADES ══════════════════════════════════════ */
  _montarPrioridades() {
    var box = document.getElementById('bg-prioridades'); if (!box) return;
    var e = this._estudoEspaco(), u = this._unidade(), self = this;
    var btn = function (acao, txt, extra) { return '<button type="button" class="action-btn' + (extra || '') + '" data-action="' + acao + '">' + txt + '</button>'; };
    if (!e) { box.innerHTML = '<p class="hint-text">Nenhuma estrutura escolhida.</p>'; this._montarLaboratorio(); return; }
    if (this._ehTres()) { box.innerHTML = '<p class="hint-text">' + Q3.Representacoes.vista(this.vista).nome + ': só para ver (use uma vista plana).</p><div class="action-row">' + btn('bg-soltar', 'Voltar à bancada') + '</div>'; this._montarLaboratorio(); return; }
    if (!u) { box.innerHTML = '<p class="hint-text">Nenhuma dupla ou carbono escolhido.</p><div class="action-row">' + btn('bg-soltar', 'Voltar à bancada') + '</div>'; this._montarLaboratorio(); return; }
    var k = this.unid, p = e.prev[k], rev = e.revelado[k], ligs = this._ligs(u), h = '';
    var esc = function (grupo, valor, txt, marcado) { return '<button type="button" class="bg-opcao' + (marcado ? ' is-on' : '') + '" data-bg="' + grupo + '" data-v="' + valor + '"' + (rev || self.lab ? ' disabled' : '') + ' aria-pressed="' + !!marcado + '">' + txt + '</button>'; };
    var rotulos = ligs.map(function (ls, kk) { var c = u.tipo === 'dupla' ? (kk ? u.b : u.a) : u.c; return ls.map(function (l) { return Q3.Estereo.rotuloLigante(e.g, c, l, e.numeracao); }); });
    h += '<p class="bg-titulo">' + (u.tipo === 'dupla' ? 'A dupla escolhida' : 'O carbono escolhido') + '</p>';
    if (this.lab) { h += '<p class="hint-text">Laboratório aberto.</p>'; box.innerHTML = h; this._montarLaboratorio(); return; }
    if (!rev) {
      h += '<p class="ctrl-label">' + (u.tipo === 'dupla' ? 'Isomeria geométrica?' : 'Carbono quiral?') + '</p><div class="bg-grupo">' + esc('tem', '1', 'Sim', p.tem === true) + esc('tem', '0', 'Não', p.tem === false) + '</div>';
      if (p.tem === true && u.tipo === 'dupla') {
        h += '<p class="ctrl-label">Prioridade em cada carbono</p>';
        [0, 1].forEach(function (kk) { h += '<div class="bg-grupo">' + rotulos[kk].map(function (t, i) { return esc('topo' + kk, String(i), t, p.topo[kk] === i); }).join('') + '</div>'; });
        h += '<p class="ctrl-label">Configuração</p><div class="bg-grupo">' + esc('desc', 'E', 'E', p.desc === 'E') + esc('desc', 'Z', 'Z', p.desc === 'Z') + '</div>';
        h += '<p class="ctrl-label">cis/trans</p><div class="bg-grupo">' + esc('ct', 'cis', 'cis', p.ct === 'cis') + esc('ct', 'trans', 'trans', p.ct === 'trans') + esc('ct', 'na', 'não se aplica', p.ct === 'na') + '</div>';
      }
      if (p.tem === true && u.tipo === 'centro') {
        h += '<p class="ctrl-label">Prioridade (1 → 4)</p><div class="bg-grupo">' + rotulos[0].map(function (t, i) { var n = p.ordem.indexOf(i); return esc('ordem', String(i), (n >= 0 ? (n + 1) + ' · ' : '') + t, n >= 0); }).join('') + '</div>';
        h += '<p class="ctrl-label">Configuração</p><div class="bg-grupo">' + esc('desc', 'R', 'R', p.desc === 'R') + esc('desc', 'S', 'S', p.desc === 'S') + '</div>';
      }
      h += '<div class="action-row">' + btn('bg-revelar', 'Revelar', ' is-primario') + '</div><div class="action-row">' + btn('bg-outra', 'Outra unidade') + btn('bg-soltar', 'Voltar à bancada') + '</div>';
    } else {
      // a comparação da previsão (igual / diferente), a árvore e o descritor
      var linhas = [], marca = function (ok) { return ok ? '<span class="bg-igual">igual</span>' : '<span class="bg-dif">diferente</span>'; };
      linhas.push('Isomeria: ' + (u.estereogenica ? 'sim' : 'não') + ' ' + marca(p.tem === !!u.estereogenica));
      if (u.estereogenica && p.tem === true) {
        var d2 = this._descDe(e, u);
        if (u.tipo === 'dupla') { [0, 1].forEach(function (kk) { linhas.push('Prioridade no ' + (kk + 1) + 'º carbono: ' + rotulos[kk][0] + ' ' + marca(p.topo[kk] === 0)); }); var ct2 = this._ctDe(e, u); linhas.push('cis/trans: ' + (ct2 ? ct2.d : 'não se aplica') + ' ' + marca((ct2 ? ct2.d : 'na') === p.ct)); }
        else linhas.push('Ordem: ' + rotulos[0].map(function (t, i) { return (i + 1) + ' ' + t; }).join(', ') + ' ' + marca(p.ordem.join() === '0,1,2,3'));
        linhas.push('Configuração: ' + d2.d + ' ' + marca(p.desc === d2.d));
      }
      h += '<ul class="bg-conferencia">' + linhas.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>';
      if (u.estereogenica) {
        var rs = Q3.Estereo.rastro(ligs[0]), kE = Math.min(this.esfera, rs.esferas.length - 1);
        h += '<p class="ctrl-label">Esfera por esfera (CIP)</p><ol class="bg-esferas">';
        ligs.forEach(function (ls, kk) {
          var r2 = Q3.Estereo.rastro(ls), kx = Math.min(self.esfera, r2.esferas.length - 1);
          h += '<li>' + (ligs.length > 1 ? (kk + 1) + 'º carbono — ' : '') + 'esfera ' + (kx + 1) + ': ' + ls.map(function (l, i) { return rotulos[kk][i] + ' ' + (r2.esferas[kx][i] || []).map(function (st) { return '(' + (st.length ? st.join(',') : '–') + ')'; }).join(''); }).join(' × ') +
               (r2.decisao.map(function (dd, i) { return dd === kx ? ' → aqui ' + rotulos[kk][i] + ' > ' + rotulos[kk][i + 1] : ''; }).join('')) + '</li>';
        });
        h += '</ol><div class="action-row">' + btn('bg-esfera-', 'Esfera anterior') + btn('bg-esfera+', 'Próxima esfera') + '</div>';
      }
      if (u.tipo === 'centro' && u.estereogenica) h += '<div class="action-row">' + btn('bg-padrao3d', 'Posição de leitura (4 atrás, 1 em cima)') + '</div>';
      h += '<div class="action-row">' + btn('bg-outra', 'Outra unidade') + btn('bg-soltar', 'Voltar à bancada') + '</div>';
    }
    box.innerHTML = h;
    this._montarLaboratorio();
    var bR = box.querySelector('[data-action="bg-revelar"]'); if (bR) bR.disabled = !this._completa(u, p);
  }
  /* ══ O PAINEL LABORATÓRIO (separado da previsão) ══════════════ */
  _montarLaboratorio() {
    var box = document.getElementById('bg-laboratorio'); if (!box) return;
    var e = this._estudoEspaco(), u = this._unidade(), self = this;
    var btn = function (acao, txt, extra) { return '<button type="button" class="action-btn' + (extra || '') + '" data-action="' + acao + '">' + txt + '</button>'; };
    if (this._ehTres()) { box.innerHTML = '<p class="hint-text">Só nas vistas planas.</p>'; return; }
    if (!e || !u) { box.innerHTML = '<p class="hint-text">Nenhuma dupla ou carbono escolhido.</p>'; return; }
    var h = '';
    if (!this.lab) {
      h += '<div class="action-row">' + btn('bg-lab', 'Trocar um ligante') + (u.tipo === 'centro' ? btn('bg-lugar', 'Trocar dois de lugar') : '') + '</div>';
      box.innerHTML = h; return;
    }
    var d = this._descDe(e, u), ct = this._ctDe(e, u);
    var rotulos = this._ligs(u).map(function (ls, kk) { var c = u.tipo === 'dupla' ? (kk ? u.b : u.a) : u.c; return ls.map(function (l) { return Q3.Estereo.rotuloLigante(e.g, c, l, e.numeracao); }); });
    h += '<p class="hint-text">' + (this.lab.modo === 'trocar' ? (this.lab.lig == null ? 'Toque num ligante.' : 'No lugar de ' + this.lab.ligs[this.lab.lig].rot + ':') : 'Toque em dois ligantes.') + '</p>';
    if (this.lab.modo === 'trocar' && this.lab.lig != null) h += '<div class="bg-grupo">' + BG_PALETA.map(function (x) { return '<button type="button" class="bg-opcao" data-action="bg-novo:' + x[1] + '">' + x[0] + '</button>'; }).join('') + '</div>';
    h += '<p class="bg-ao-vivo">' + (u.estereogenica ? 'Prioridades: ' + rotulos.map(function (r) { return r.join(' > '); }).join('  ·  ') + '<br>Agora: <strong>' + (d ? d.d : '—') + '</strong>' + (ct ? ' · ' + ct.d : '') : 'Não estereogênica.') + '</p>';
    h += '<div class="action-row">' + btn(this.lab.modo === 'trocar' ? 'bg-lab' : 'bg-lugar', 'Sair do laboratório') + '</div>';
    box.innerHTML = h;
  }
  _ligarPainel() {
    super._ligarPainel();
    if (this._prioLigado) return; this._prioLigado = true;
    var self = this, box = document.getElementById('bg-prioridades'); if (!box) return;
    box.addEventListener('click', function (ev) {
      if (!self.ativo) return;
      var b = ev.target.closest('[data-bg]'); if (!b || b.disabled) return;
      var e = self._estudoEspaco(), u = self._unidade(); if (!e || !u) return;
      var p = e.prev[self.unid], gr = b.dataset.bg, v = b.dataset.v;
      if (gr === 'tem') p.tem = v === '1';
      else if (gr === 'topo0' || gr === 'topo1') p.topo[+gr.slice(4)] = +v;
      else if (gr === 'desc') p.desc = v;
      else if (gr === 'ct') p.ct = v;
      else if (gr === 'ordem') { var i = +v, j = p.ordem.indexOf(i); if (j >= 0) p.ordem.splice(j); else if (p.ordem.length < 4) p.ordem.push(i); }
      self._montarPrioridades();
    });
  }
  _sincronizarPainel() { super._sincronizarPainel(); }
  mudarVista(v) { var ok = super.mudarVista(v); this.arr = null; this._montarPrioridades(); return ok; }
  overlay() { return this.fonte === 'desenhar' ? 'Geométrica · desenho' : 'Geométrica'; }
}
