/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/estereo.js
   ───────────────────────────────────────────────────────────────
   SIIS — PRIORIDADES (Cahn-Ingold-Prelog) E ESTEREOQUÍMICA.
   Usado pelo Módulo 2 (isomeria geométrica: E/Z, cis/trans e o R/S dos
   carbonos quirais que aparecem, sobretudo nos anéis) e pelo Módulo 3.

   AS REGRAS (como os livros ensinam):
     1. número atômico: tem prioridade o ligante cujo átomo ligado
        diretamente tem o maior número atômico;
     2. desempate pela esfera seguinte: compara-se o conjunto de átomos
        ligados a esses, do maior para o menor — (O,C,H) × (C,C,H); a 1ª
        diferença decide; se empatar, avança uma esfera, pelos ramos de
        maior prioridade primeiro;
     3. ligação dupla/tripla: o átomo conta repetido (C=O: o C "tem dois O");
        no fechamento de um anel, o átomo reencontrado também entra
        repetido. Os repetidos (entre parênteses, como nos livros) não têm
        ligantes próprios: os lugares vazios contam como zero.
   Fora (a tela diz): as regras seguintes (pseudoassimetria, r/s
   minúsculo, like/unlike) — raras no ensino médio.

   A CONFIGURAÇÃO vem da GEOMETRIA do desenho: os lados da dupla (as
   posições 2D) e as cunhas dos carbonos quirais ({vizinho, z: +1 cunha
   cheia / −1 tracejada}). Por isso trocar um ligante sem mexer na
   geometria pode trocar o E pelo Z — o laboratório de ligantes.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var E = Q3.Estereo = {};
  var NUM = { H: 1, C: 6, N: 7, O: 8, F: 9, Cl: 17, Br: 35, I: 53 };
  E.NUM = NUM;

  /* ══ O DÍGRAFO HIERÁRQUICO ══════════════════════════════════════
     nó: { id (null = H implícito), el, z, dup (repetido), pai, caminho } */
  function no(g, id, pai, caminho, dup) {
    return { g: g, id: id, pai: pai, caminho: caminho, dup: !!dup, el: id ? g.atomos[id].el : 'H', z: id ? NUM[g.atomos[id].el] || 0 : 1, _f: null };
  }
  function filhos(n) {
    if (n._f) return n._f;
    var f = [];
    if (n.dup || !n.id) { n._f = f; return f; }
    var g = n.g, cam = n.caminho;
    g.vizinhos(n.id).forEach(function (v) {
      var k;
      if (v.id === n.pai) { for (k = 1; k < v.ordem; k++) f.push(no(g, v.id, n.id, cam, true)); return; }   // dupla com o pai: o pai repetido
      if (cam[v.id]) { for (k = 0; k < v.ordem; k++) f.push(no(g, v.id, n.id, cam, true)); return; }        // fechamento de anel: repetido
      var c2 = {}; for (var q in cam) c2[q] = 1; c2[v.id] = 1;
      f.push(no(g, v.id, n.id, c2, false));
      for (k = 1; k < v.ordem; k++) f.push(no(g, v.id, n.id, cam, true));                                   // dupla/tripla: repetidos
    });
    for (var h = g.hidrogenios(n.id); h > 0; h--) f.push(no(g, null, n.id, cam, false));
    f.sort(function (a, b) { return compara(b, a); });
    n._f = f; return f;
  }
  /* compara dois ramos, esfera por esfera (> 0: a tem prioridade) */
  function compara(a, b) {
    if (a.z !== b.z) return a.z - b.z;
    var fa = [a], fb = [b];
    for (var d = 0; d < 16; d++) {
      var ca = fa.map(filhos), cb = fb.map(filhos);
      var n = Math.max(ca.length, cb.length);
      for (var i = 0; i < n; i++) {
        var sa = ca[i] || [], sb = cb[i] || [], m = Math.max(sa.length, sb.length);
        for (var j = 0; j < m; j++) { var za = sa[j] ? sa[j].z : 0, zb = sb[j] ? sb[j].z : 0; if (za !== zb) return za - zb; }
      }
      fa = [].concat.apply([], ca); fb = [].concat.apply([], cb);
      if (!fa.length && !fb.length) return 0;
    }
    return 0;
  }
  E.compara = compara;
  E.raizLigante = function (g, centro, id) { var cam = {}; cam[centro] = 1; if (id) cam[id] = 1; return no(g, id, centro, cam, false); };

  /* os ligantes de um átomo (menos os excluídos), já em ordem de prioridade, com o H implícito */
  function ligantes(g, c, excluir) {
    var ls = [];
    g.vizinhos(c).forEach(function (v) { if (excluir.indexOf(v.id) < 0) ls.push(E.raizLigante(g, c, v.id)); });
    for (var h = g.hidrogenios(c); h > 0; h--) ls.push(E.raizLigante(g, c, null));
    ls.sort(function (a, b) { return compara(b, a); });
    return ls;
  }

  /* ══ O RASTRO (a revelação, esfera por esfera) ═══════════════════
     para cada ligante, os conjuntos de cada esfera (rótulos; repetidos entre
     parênteses) e, para cada par vizinho na ordem final, a esfera que decidiu. */
  function rotulo(n) { return n.dup ? '(' + n.el + ')' : n.el; }
  E.rastro = function (ls) {
    // esferas[k][ligante] = lista de conjuntos (rótulos); atomos[k][ligante] = os átomos reais daquela esfera
    var esferas = [], atomos = [], fronts = ls.map(function (l) { return [l]; });
    esferas.push(ls.map(function (l) { return [[rotulo(l)]]; }));
    atomos.push(ls.map(function (l) { return l.id && !l.dup ? [l.id] : []; }));
    for (var d = 0; d < 6; d++) {
      var prox = fronts.map(function (fr) { return fr.map(filhos); });
      if (prox.every(function (p) { return p.every(function (s) { return !s.length; }); })) break;
      esferas.push(prox.map(function (p) { return p.map(function (s) { return s.map(rotulo); }); }));
      atomos.push(prox.map(function (p) { var ids = []; p.forEach(function (s) { s.forEach(function (x) { if (x.id && !x.dup && ids.indexOf(x.id) < 0) ids.push(x.id); }); }); return ids; }));
      fronts = prox.map(function (p) { return [].concat.apply([], p); });
    }
    var decisao = [];
    for (var i = 0; i + 1 < ls.length; i++) decisao.push(esferaQueDecide(ls[i], ls[i + 1]));
    return { esferas: esferas, atomos: atomos, decisao: decisao };
  };
  function esferaQueDecide(a, b) {
    if (a.z !== b.z) return 0;
    var fa = [a], fb = [b];
    for (var d = 1; d < 16; d++) {
      var ca = fa.map(filhos), cb = fb.map(filhos), n = Math.max(ca.length, cb.length);
      for (var i = 0; i < n; i++) { var sa = ca[i] || [], sb = cb[i] || [], m = Math.max(sa.length, sb.length); for (var j = 0; j < m; j++) if ((sa[j] ? sa[j].z : 0) !== (sb[j] ? sb[j].z : 0)) return d; }
      fa = [].concat.apply([], ca); fb = [].concat.apply([], cb);
      if (!fa.length && !fb.length) return -1;
    }
    return -1;
  }

  /* o rótulo de um ligante, como os livros escrevem: H, Cl, OH, NH₂, CH₃, C₂H₅, CH₂OH, CHO, COOH, OCH₃ */
  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  function sub(n) { return String(n).replace(/\d/g, function (d) { return SUB[+d]; }); }
  /* num: a numeração do nome (átomo → localizador), para os ligantes de ANEL; curto: só o essencial (vista 3D) */
  E.rotuloLigante = function (g, centro, lig, num, curto) {
    if (!lig.id) return 'H';
    // um ligante que é o VIZINHO NO ANEL: pelo próprio átomo e pela posição — os dois caminhos de um anel dão a volta
    // e chegam ao mesmo resto da molécula, então a fórmula do "resto" seria a mesma para os dois (C6H12 duas vezes)
    var noAnel = Q3.Geometria.aneisMinimos(g).some(function (r) { return r.indexOf(centro) >= 0 && r.indexOf(lig.id) >= 0; });
    if (noAnel) {
      var loc = num && num[lig.id] ? 'C' + num[lig.id] : null;
      if (curto) return loc || Q3.Desenho.rotulo(g, lig.id);
      return Q3.Desenho.rotulo(g, lig.id) + ' do anel' + (loc ? ' (' + loc + ')' : '');
    }
    var ids = [lig.id], vis = {}; vis[centro] = 1; vis[lig.id] = 1;
    for (var q = 0; q < ids.length; q++) g.vizinhos(ids[q]).forEach(function (v) { if (!vis[v.id]) { vis[v.id] = 1; ids.push(v.id); } });
    var el = function (x) { return g.atomos[x].el; }, h = function (x) { return g.hidrogenios(x); };
    var p = el(lig.id);
    if (ids.length === 1) return p === 'C' ? 'CH' + sub(h(lig.id)).replace('₁', '') : p + (h(lig.id) ? 'H' + (h(lig.id) > 1 ? sub(h(lig.id)) : '') : '');
    if (p === 'O' || p === 'N') { var resto = ids.slice(1), nc = resto.filter(function (x) { return el(x) === 'C'; }).length, nh = 0; resto.forEach(function (x) { nh += h(x); }); return p + 'C' + (nc > 1 ? sub(nc) : '') + 'H' + sub(nh); }
    var cs = ids.filter(function (x) { return el(x) === 'C'; }), nH = 0, het = '';
    cs.forEach(function (x) { nH += h(x); });
    var carbonila = '', oh = '';
    ids.forEach(function (x) { if (el(x) === 'C') return; if (el(x) === 'O') { if (h(x)) oh += 'OH'; else carbonila += 'O'; } else if (el(x) === 'N') het += 'NH' + (h(x) > 1 ? sub(h(x)) : ''); else het += el(x); });
    het = carbonila + oh + het;                         // a carbonila antes do OH: COOH, e não COHO
    return 'C' + (cs.length > 1 ? sub(cs.length) : '') + (nH ? 'H' + (nH > 1 ? sub(nH) : '') : '') + het;
  };

  /* ══ AS UNIDADES ESTEREOGÊNICAS ══════════════════════════════════
     dupla C=C (fora de anel com menos de 8 átomos; sem dupla acumulada) e
     carbono sp3 com 4 ligantes. Cada unidade diz se é estereogênica. */
  E.unidades = function (g) {
    var aneis = Q3.Geometria.aneisMinimos(g), und = [];
    var noMesmoAnelPequeno = function (a, b) { return aneis.some(function (r) { return r.length < 8 && r.indexOf(a) >= 0 && r.indexOf(b) >= 0; }); };
    var el = function (id) { return g.atomos[id].el; };
    g.ligacoes.forEach(function (l) {
      if (l.ordem !== 2 || el(l.a) !== 'C' || el(l.b) !== 'C' || noMesmoAnelPequeno(l.a, l.b)) return;
      var acumulada = [l.a, l.b].some(function (x) { return g.vizinhos(x).some(function (v) { return v.ordem > 1 && v.id !== (x === l.a ? l.b : l.a); }); });
      if (acumulada) return;
      var la = ligantes(g, l.a, [l.b]), lb = ligantes(g, l.b, [l.a]);
      if (la.length !== 2 || lb.length !== 2) return;
      und.push({ tipo: 'dupla', a: l.a, b: l.b, ligA: la, ligB: lb, estereogenica: compara(la[0], la[1]) !== 0 && compara(lb[0], lb[1]) !== 0 });
    });
    g.pesados().forEach(function (c) {
      if (el(c) !== 'C' || g.vizinhos(c).some(function (v) { return v.ordem > 1; })) return;
      var ls = ligantes(g, c, []);
      if (ls.length !== 4) return;
      var distintos = true;
      for (var i = 0; i < 3; i++) if (compara(ls[i], ls[i + 1]) === 0) distintos = false;
      und.push({ tipo: 'centro', c: c, ligs: ls, estereogenica: distintos });
    });
    return und;
  };

  /* ══ A GEOMETRIA → OS DESCRITORES ════════════════════════════════
     pos: posições 2D (tela: y para baixo); cunhas: {centro: {viz, z}} */
  function lado(pos, a, b, p) { var ax = pos[a], bx = pos[b], px = pos[p]; return Math.sign((bx.x - ax.x) * (px.y - ax.y) - (bx.y - ax.y) * (px.x - ax.x)); }
  E.ladoDe = function (pos, u, fimA, lig, outro) {   // o lado de um ligante numa ponta da dupla (o H implícito fica do lado oposto ao outro ligante)
    var a = fimA ? u.a : u.b, b = fimA ? u.b : u.a;
    if (lig.id) return lado(pos, a, b, lig.id);
    return outro && outro.id ? -lado(pos, a, b, outro.id) : 0;
  };
  E.vetores = function (g, pos, cunhas, c, ligs) {   // os 4 ligantes como vetores 3D (x, y para cima, z para o observador)
    var cu = cunhas[c] || {}, vs = [], pc = pos[c], semH = [];
    ligs.forEach(function (l) {
      if (!l.id) { vs.push(null); return; }
      var v = [pos[l.id].x - pc.x, -(pos[l.id].y - pc.y), l.id === cu.viz ? cu.z || 0 : 0], n = Math.hypot(v[0], v[1]) || 1;
      v[0] /= n; v[1] /= n; vs.push(v); semH.push(v);
    });
    // 4 ligantes pesados e uma cunha só: o mais oposto à cunha vai para o outro lado
    if (semH.length === 4 && cu.viz) {
      var iw = ligs.findIndex(function (l) { return l.id === cu.viz; }), w = vs[iw], pior = -1, dm = 9;
      vs.forEach(function (v, i) { if (i !== iw) { var dd = v[0] * w[0] + v[1] * w[1]; if (dd < dm) { dm = dd; pior = i; } } });
      if (pior >= 0 && !vs[pior][2]) vs[pior][2] = -(cu.z || 0);
    }
    // os H implícitos: completam o TETRAEDRO, quantos forem (CH, CH2, CH3)
    var nulos = []; vs.forEach(function (v, i) { if (!v) nulos.push(i); });
    var unit = function (v) { var m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
    var cruz = function (a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; };
    var conhecidos = vs.filter(Boolean).map(unit);
    if (nulos.length === 1) {                                   // 3 conhecidos: o H oposto à soma
      var s = [0, 0, 0]; conhecidos.forEach(function (v) { s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; }); vs[nulos[0]] = [-s[0], -s[1], -s[2]];
    } else if (nulos.length === 2 && conhecidos.length === 2) { // CH2: do lado oposto, um acima e outro abaixo do plano dos outros dois
      var b = unit([-(conhecidos[0][0] + conhecidos[1][0]), -(conhecidos[0][1] + conhecidos[1][1]), -(conhecidos[0][2] + conhecidos[1][2])]);
      var nn = cruz(conhecidos[0], conhecidos[1]); nn = Math.hypot(nn[0], nn[1], nn[2]) < 1e-6 ? [0, 0, 1] : unit(nn);
      vs[nulos[0]] = [b[0] * 0.58 + nn[0] * 0.82, b[1] * 0.58 + nn[1] * 0.82, b[2] * 0.58 + nn[2] * 0.82];
      vs[nulos[1]] = [b[0] * 0.58 - nn[0] * 0.82, b[1] * 0.58 - nn[1] * 0.82, b[2] * 0.58 - nn[2] * 0.82];
    } else if (nulos.length === 3 && conhecidos.length === 1) { // CH3: um tripé oposto ao ligante, a 120° entre si
      var v1 = conhecidos[0], p0 = Math.abs(v1[2]) < 0.9 ? unit(cruz(v1, [0, 0, 1])) : unit(cruz(v1, [1, 0, 0])), q0 = unit(cruz(v1, p0));
      nulos.forEach(function (iN, k) { var t = k * 2 * Math.PI / 3, c = Math.cos(t), sn = Math.sin(t); vs[iN] = [-v1[0] / 3 + 0.943 * (c * p0[0] + sn * q0[0]), -v1[1] / 3 + 0.943 * (c * p0[1] + sn * q0[1]), -v1[2] / 3 + 0.943 * (c * p0[2] + sn * q0[2])]; });
    } else if (nulos.length) {                                  // CH4 (ou outro caso): o tetraedro ideal
      var tet = [[0, 0, 1], [0.943, 0, -0.333], [-0.471, 0.816, -0.333], [-0.471, -0.816, -0.333]];
      nulos.forEach(function (iN, k) { vs[iN] = tet[k]; });
    }
    return vs;
  };
  /* o TETRAEDRO REGULAR para mostrar (vista 3D): os quatro ligantes se repelem na esfera até ~109,5°.
     A deformação é contínua e não passa pelo plano: a configuração (o lado de cada ligante) se mantém —
     e, se mudasse, ficam os vetores originais. Só a exibição usa isto; o R/S sai de vetores(). */
  E.tetraedroIdeal = function (vs) {
    var un = function (v) { var m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
    var w = vs.map(un), quiral = function (q) { var d = q[3]; return Math.sign(det3([q[0][0] - d[0], q[0][1] - d[1], q[0][2] - d[2]], [q[1][0] - d[0], q[1][1] - d[1], q[1][2] - d[2]], [q[2][0] - d[0], q[2][1] - d[1], q[2][2] - d[2]])); };
    var antes = quiral(w);
    for (var it = 0; it < 60; it++) {
      w = w.map(function (vi, i) {
        var f = [0, 0, 0];
        w.forEach(function (vj, j) { if (i === j) return; var d = [vi[0] - vj[0], vi[1] - vj[1], vi[2] - vj[2]], r = Math.max(0.05, Math.hypot(d[0], d[1], d[2])), k = 1 / (r * r * r); f[0] += d[0] * k; f[1] += d[1] * k; f[2] += d[2] * k; });
        return un([vi[0] + 0.04 * f[0], vi[1] + 0.04 * f[1], vi[2] + 0.04 * f[2]]);
      });
    }
    return antes && quiral(w) !== antes ? vs.map(un) : w;
  };
  function det3(a, b, c) { return a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]); }
  E.descritores = function (g, pos, cunhas, und) {
    var out = [];
    und.forEach(function (u) {
      if (!u.estereogenica) return;
      if (u.tipo === 'dupla') {
        var sa = E.ladoDe(pos, u, true, u.ligA[0], u.ligA[1]), sb = E.ladoDe(pos, u, false, u.ligB[0], u.ligB[1]);
        // o lado do ligante de prioridade na ponta b, visto da mesma reta a→b
        var sbV = u.ligB[0].id ? lado(pos, u.a, u.b, u.ligB[0].id) : (u.ligB[1].id ? -lado(pos, u.a, u.b, u.ligB[1].id) : 0);
        var saV = u.ligA[0].id ? lado(pos, u.a, u.b, u.ligA[0].id) : (u.ligA[1].id ? -lado(pos, u.a, u.b, u.ligA[1].id) : 0);
        out.push({ u: u, tipo: 'dupla', d: saV && sbV ? (saV === sbV ? 'Z' : 'E') : '?' });
      } else {
        var vs = E.vetores(g, pos, cunhas, u.c, u.ligs);
        var d4 = vs[3], s = det3([vs[0][0] - d4[0], vs[0][1] - d4[1], vs[0][2] - d4[2]], [vs[1][0] - d4[0], vs[1][1] - d4[1], vs[1][2] - d4[2]], [vs[2][0] - d4[0], vs[2][1] - d4[1], vs[2][2] - d4[2]]);
        out.push({ u: u, tipo: 'centro', d: Math.abs(s) < 1e-6 ? '?' : (s < 0 ? 'R' : 'S') });
      }
    });
    return out;
  };

  /* cis/trans: dupla com um H em cada ponta; ou anel com dois carbonos quirais de um substituinte cada */
  E.cisTrans = function (g, pos, cunhas, und) {
    var out = [];
    und.forEach(function (u) {
      if (u.tipo !== 'dupla' || !u.estereogenica) return;
      var ha = u.ligA.filter(function (l) { return !l.id; }).length, hb = u.ligB.filter(function (l) { return !l.id; }).length;
      if (ha !== 1 || hb !== 1) return;
      var xa = u.ligA.filter(function (l) { return l.id; })[0].id, xb = u.ligB.filter(function (l) { return l.id; })[0].id;
      out.push({ u: u, d: lado(pos, u.a, u.b, xa) === lado(pos, u.a, u.b, xb) ? 'cis' : 'trans' });
    });
    var aneis = Q3.Geometria.aneisMinimos(g);
    aneis.forEach(function (r) {
      var cs = und.filter(function (u) { return u.tipo === 'centro' && u.estereogenica && r.indexOf(u.c) >= 0 && g.hidrogenios(u.c) === 1; });
      if (cs.length !== 2) return;
      var zs = cs.map(function (u) { var cu = cunhas[u.c]; return cu ? cu.z : 0; });
      if (zs[0] && zs[1]) out.push({ anel: r, centros: [cs[0].c, cs[1].c], d: zs[0] === zs[1] ? 'cis' : 'trans' });
    });
    return out;
  };

  /* ══ A ASSINATURA (forma canônica com a configuração) ═════════════ */
  E.assinatura = function (g, desc) {
    var m = Q3.Isomeros.matrizDe(g), ids = g.pesados(), rot = {};
    desc.forEach(function (d) { if (d.tipo === 'centro') rot[d.u.c] = d.d; else { rot[d.u.a] = d.d; rot[d.u.b] = d.d; } });
    m.els = m.els.map(function (e, i) { return e + (rot[ids[i]] ? '@' + rot[ids[i]] : ''); });
    return Q3.Isomeros.canonicaMatriz(m);
  };

  /* ══ A GEOMETRIA DE UM ESTEREOISÔMERO ════════════════════════════ */
  E.refletirLado = function (g, pos, a, b) {   // espelha, na reta a–b, tudo o que se alcança a partir de b sem passar por a
    var vis = {}; vis[a] = 1; vis[b] = 1; var fila = [b], lista = [];
    while (fila.length) { var x = fila.shift(); g.vizinhos(x).forEach(function (v) { if (!vis[v.id] && pos[v.id]) { vis[v.id] = 1; fila.push(v.id); lista.push(v.id); } }); }
    var A = pos[a], B = pos[b], dx = B.x - A.x, dy = B.y - A.y, L = dx * dx + dy * dy || 1;
    lista.forEach(function (id) { var p = pos[id], t = ((p.x - A.x) * dx + (p.y - A.y) * dy) / L, fx = A.x + t * dx, fy = A.y + t * dy; pos[id] = { x: 2 * fx - p.x, y: 2 * fy - p.y }; });
  };
  E.escolherCunha = function (g, c) {   // o ligante que recebe a cunha: fora de anel e, se possível, terminal
    var aneis = Q3.Geometria.aneisMinimos(g), noAnel = function (x) { return aneis.some(function (r) { return r.indexOf(x) >= 0 && r.indexOf(c) >= 0; }); };
    var vs = g.vizinhos(c).map(function (v) { return v.id; }), fora = vs.filter(function (x) { return !noAnel(x); });
    var term = fora.filter(function (x) { return g.vizinhos(x).length === 1; });
    return term[0] || fora[0] || vs[0];
  };
  function clonar(pos) { var o = {}; for (var k in pos) o[k] = { x: pos[k].x, y: pos[k].y }; return o; }
  E.clonarPos = clonar;

  /* todos os estereoisômeros de uma constituição (sem repetir: o meso sai uma vez) */
  E.expandir = function (g, pos) {
    var und = E.unidades(g), est = und.filter(function (u) { return u.estereogenica; }), out = [], vistos = {};
    var n = est.length;
    for (var mask = 0; mask < (1 << n); mask++) {
      var p2 = clonar(pos), cunhas = {};
      est.forEach(function (u, i) { if (u.tipo === 'dupla' && (mask >> i) & 1) E.refletirLado(g, p2, u.a, u.b); });
      est.forEach(function (u, i) { if (u.tipo === 'centro') cunhas[u.c] = { viz: E.escolherCunha(g, u.c), z: (mask >> i) & 1 ? -1 : 1 }; });
      var desc = E.descritores(g, p2, cunhas, und), sig = E.assinatura(g, desc);
      if (vistos[sig]) continue; vistos[sig] = 1;
      out.push({ pos: p2, cunhas: cunhas, und: und, desc: desc, assinatura: sig });
    }
    return out;
  };

  /* ══ O NOME COM OS DESCRITORES ═══════════════════════════════════ */
  E.nome = function (g, desc) {
    var base = Q3.Isomeros.nomear(g); if (!base) return null;
    if (!desc.length) return base;
    var r = Q3.Nomenclatura.nomear(g); if (!r.ok) r = Q3.NomenclaturaCompleta.nomear(g, { amplo: true });
    var num = r.ok && r.numeracao ? r.numeracao : null;
    if (desc.length === 1) return '(' + desc[0].d + ')-' + base;
    if (!num) return '(' + desc.map(function (d) { return d.d; }).join(',') + ')-' + base;
    var itens = desc.map(function (d) { var loc = d.tipo === 'centro' ? num[d.u.c] : Math.min(num[d.u.a] || 99, num[d.u.b] || 99); return { loc: loc || 0, d: d.d }; });
    if (itens.some(function (x) { return !x.loc; })) return '(' + desc.map(function (d) { return d.d; }).join(',') + ')-' + base;
    itens.sort(function (a, b) { return a.loc - b.loc; });
    // MESO (trocar todo R por S dá a mesma molécula): as duas numerações são equivalentes,
    // e a convenção dá o R ao menor localizador — (1R,2S), não (1S,2R)
    var espelho = desc.map(function (d) { return { u: d.u, tipo: d.tipo, d: d.d === 'R' ? 'S' : d.d === 'S' ? 'R' : d.d }; });
    if (E.assinatura(g, espelho) === E.assinatura(g, desc)) {
      var seq = itens.map(function (x) { return x.d; }), rev = seq.slice().reverse();
      if (rev.join() < seq.join()) itens.forEach(function (x, i) { x.d = rev[i]; });
    }
    return '(' + itens.map(function (x) { return x.loc + x.d; }).join(',') + ')-' + base;
  };

  /* o gerador: os isômeros constitucionais de uma fórmula, cada um com os seus estereoisômeros */
  E.gerar = function (texto, posDe) {
    var r = Q3.Isomeros.gerar(texto), out = [], lim = Q3.Isomeros.LIMITE, cortou = false;
    r.estruturas.forEach(function (e) {
      if (cortou) return;
      var pos = posDe(e.g), fam = E.expandir(e.g, pos);
      if (out.length + fam.length > lim) { cortou = true; return; }            // uma família inteira ou nada (o cis com o trans; o R com o S)
      fam.forEach(function (s) { out.push({ g: e.g, pos: s.pos, cunhas: s.cunhas, und: s.und, desc: s.desc, canonica: s.assinatura, constitucional: e.canonica }); });
    });
    return { estruturas: out, total: out.length, possiveis: r.possiveis, recortado: r.recortado || cortou, formula: r.formula, constitucionais: r.total };
  };

})(typeof window !== 'undefined' ? window : globalThis);
