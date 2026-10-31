/* ══════════════════════════════════════════════════════════════════
   SIRO · A COMBUSTÃO (Módulo 4) — a cadeia de radicais da chama
   ──────────────────────────────────────────────────────────────────
   A queima não é uma colisão de CH₄ com 2 O₂: é uma REAÇÃO EM CADEIA de
   radicais, como a halogenação do Módulo 3 — iniciação, propagação,
   ramificação e terminação, desenhadas com farpas.

   · O O₂ do ar é um BIRRADICAL (estado fundamental tripleto): aqui ele é
     •O–O• — dois elétrons desemparelhados, um em cada O. Por isso reage
     por farpas, e por isso o O₂ e o combustível podem ficar misturados
     sem reagir: o primeiro passo (o O₂ arranca um H) absorve ~230 kJ/mol.
     A faísca fornece essa energia; depois, a própria chama.
   · Os passos da literatura são REAÇÕES ELEMENTARES reais dos mecanismos
     de chama (GRI-Mech 3.0, Smith et al., Berkeley): CH₄ + O₂ → CH₃ + HO₂;
     CH₃ + HO₂ → CH₃O + OH; CH₃O → CH₂O + H; CH₂O + OH → HCO + H₂O;
     HCO + O₂ → CO + HO₂; H + HO₂ → 2 OH; OH + CO → H + CO₂ (passando pelo
     HOCO); H + OH → H₂O. Somados, os radicais se cancelam e sobra a
     equação global CH₄ + 2 O₂ → CO₂ + 2 H₂O.
   · A ENERGIA de cada passo sai das entalpias de formação das espécies
     (ΔH = Σ produtos − Σ reagentes), com os valores das Active
     Thermochemical Tables (ATcT, Argonne National Laboratory, versão
     1.130, 25 °C, gás). Como a entalpia é função de estado, a soma dos
     passos é EXATAMENTE a ΔH da equação global (lei de Hess):
     −802,6 kJ/mol com a água em vapor (como sai da chama); com a água
     condensada, −890,6 kJ/mol — o valor das tabelas.
   · Espécies fora da tabela (as dos alcanos e álcoois do Construtor): a
     molécula pela aditividade de grupos de Benson; o radical pela molécula
     de origem + a energia típica da ligação X–H rompida (≈, ± 10 kJ/mol).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  var M = Q3.Mecanismo, chaveLig = M.chaveLig;
  var CB = Q3.Combustao = {};
  var H_ATOMO = 217.998;                     // ΔfH(H•), kJ/mol (ATcT)

  /* ══ O O₂ BIRRADICAL: •O–O• (uma ligação e um elétron livre em cada O) ══ */
  M.acrescentarO2 = function (S, pref) { return M.acrescentar(S, [{ id: pref + '1', el: 'O' }, { id: pref + '2', el: 'O' }], [[pref + '1', pref + '2', 1]]); };

  /* ══ A TABELA DAS ESPÉCIES (ΔfH a 25 °C, gás, kJ/mol — ATcT v1.130) ══
     cada espécie como a cena a desenha: TODOS os H explícitos; [elementos, H em cada um, ligações, cargas] */
  var TABELA = [
    ['H•', 217.998, ['H'], [0]],
    ['H₂', 0, ['H', 'H'], [0, 0], [[0, 1, 1]]],
    ['O₂', 0, ['O', 'O'], [0, 0], [[0, 1, 1]]],
    ['•OH', 37.518, ['O'], [1]],
    ['H₂O', -241.805, ['O'], [2]],
    ['HO₂•', 12.18, ['O', 'O'], [1, 0], [[0, 1, 1]]],
    ['H₂O₂', -135.403, ['O', 'O'], [1, 1], [[0, 1, 1]]],
    ['CO', -110.520, ['C', 'O'], [0, 0], [[0, 1, 3]], [-1, 1]],
    ['CO₂', -393.476, ['O', 'C', 'O'], [0, 0, 0], [[0, 1, 2], [1, 2, 2]]],
    ['HCO•', 41.752, ['C', 'O'], [1, 0], [[0, 1, 2]]],
    ['CH₂O', -109.232, ['C', 'O'], [2, 0], [[0, 1, 2]]],
    ['CH₃•', 146.473, ['C'], [3]],
    ['CH₄', -74.518, ['C'], [4]],
    ['CH₃O•', 21.56, ['C', 'O'], [3, 0], [[0, 1, 1]]],
    ['•CH₂OH', -16.66, ['C', 'O'], [2, 1], [[0, 1, 1]]],
    ['CH₃OH', -200.92, ['C', 'O'], [3, 1], [[0, 1, 1]]],
    ['CH₃OOH', -127.71, ['C', 'O', 'O'], [3, 0, 1], [[0, 1, 1], [1, 2, 1]]],
    ['CH₃OO•', 13.08, ['C', 'O', 'O'], [3, 0, 0], [[0, 1, 1], [1, 2, 1]]],
    ['HOCO•', -184.12, ['O', 'C', 'O'], [1, 0, 0], [[0, 1, 1], [1, 2, 2]]],
    ['C₂H₆', -84.01, ['C', 'C'], [3, 3], [[0, 1, 1]]],
    ['C₂H₅•', 120.68, ['C', 'C'], [3, 2], [[0, 1, 1]]],
    ['C₂H₄', 52.38, ['C', 'C'], [2, 2], [[0, 1, 2]]],
    ['C₂H₃•', 297.22, ['C', 'C'], [2, 1], [[0, 1, 2]]],
    ['C₂H₅OH', -235.03, ['C', 'C', 'O'], [3, 2, 1], [[0, 1, 1], [1, 2, 1]]],
    ['CH₃CH•OH', -56.30, ['C', 'C', 'O'], [3, 1, 1], [[0, 1, 1], [1, 2, 1]]],
    ['CH₃CHO', -165.53, ['C', 'C', 'O'], [3, 1, 0], [[0, 1, 1], [1, 2, 2]]],
    ['CH₃C•O', -10.05, ['C', 'C', 'O'], [3, 0, 0], [[0, 1, 1], [1, 2, 2]]],
    ['•CH₂CHO', 16.23, ['C', 'C', 'O'], [2, 1, 0], [[0, 1, 1], [1, 2, 2]]],
    ['CH₃CH₂O•', -12.65, ['C', 'C', 'O'], [3, 2, 0], [[0, 1, 1], [1, 2, 1]]],
    ['C₃H₈', -104.99, ['C', 'C', 'C'], [3, 2, 3], [[0, 1, 1], [1, 2, 1]]],
    ['n-C₃H₇•', 100.98, ['C', 'C', 'C'], [3, 2, 2], [[0, 1, 1], [1, 2, 1]]],
    ['i-C₃H₇•', 88.67, ['C', 'C', 'C'], [3, 1, 3], [[0, 1, 1], [1, 2, 1]]],
    ['C₃H₆', 20.02, ['C', 'C', 'C'], [3, 1, 2], [[0, 1, 1], [1, 2, 2]]],
    ['C₃H₅• (alila)', 168.15, ['C', 'C', 'C'], [2, 1, 2], [[0, 1, 1], [1, 2, 2]]],
    ['propanal', -186.64, ['C', 'C', 'C', 'O'], [3, 2, 1, 0], [[0, 1, 1], [1, 2, 1], [2, 3, 2]]],
    ['propanona', -216.94, ['C', 'C', 'C', 'O'], [3, 0, 3, 0], [[0, 1, 1], [1, 2, 1], [1, 3, 2]]],
    ['1-propanol', -255.11, ['C', 'C', 'C', 'O'], [3, 2, 2, 1], [[0, 1, 1], [1, 2, 1], [2, 3, 1]]],
    ['2-propanol', -272.77, ['C', 'C', 'C', 'O'], [3, 1, 3, 1], [[0, 1, 1], [1, 2, 1], [1, 3, 1]]],
    ['C₄H₁₀', -125.66, ['C', 'C', 'C', 'C'], [3, 2, 2, 3], [[0, 1, 1], [1, 2, 1], [2, 3, 1]]],
    ['i-C₄H₁₀', -134.50, ['C', 'C', 'C', 'C'], [3, 1, 3, 3], [[0, 1, 1], [1, 2, 1], [1, 3, 1]]],
    ['n-C₄H₉•', 80.47, ['C', 'C', 'C', 'C'], [3, 2, 2, 2], [[0, 1, 1], [1, 2, 1], [2, 3, 1]]],
    ['t-C₄H₉•', 49.98, ['C', 'C', 'C', 'C'], [3, 0, 3, 3], [[0, 1, 1], [1, 2, 1], [1, 3, 1]]],
    ['1-buteno', 0.19, ['C', 'C', 'C', 'C'], [2, 1, 2, 3], [[0, 1, 2], [1, 2, 1], [2, 3, 1]]],
    ['2-buteno', -11.12, ['C', 'C', 'C', 'C'], [3, 1, 1, 3], [[0, 1, 1], [1, 2, 2], [2, 3, 1]]],      // trans (o mais estável)
    ['metilpropeno', -16.90, ['C', 'C', 'C', 'C'], [2, 0, 3, 3], [[0, 1, 2], [1, 2, 1], [1, 3, 1]]],
    ['1-metilalila', 135.22, ['C', 'C', 'C', 'C'], [3, 1, 1, 2], [[0, 1, 1], [1, 2, 2], [2, 3, 1]]],
    ['C₅H₁₂', -146.07, ['C', 'C', 'C', 'C', 'C'], [3, 2, 2, 2, 3], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1]]],
    ['neopentano', -167.13, ['C', 'C', 'C', 'C', 'C'], [3, 0, 3, 3, 3], [[0, 1, 1], [1, 2, 1], [1, 3, 1], [1, 4, 1]]],
    ['C₆H₁₄', -166.78, ['C', 'C', 'C', 'C', 'C', 'C'], [3, 2, 2, 2, 2, 3], [[0, 1, 1], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1]]]
  ];
  var construir = function (els, hs, ligs, cargas) {
    var S = M.vazio(), at = [], lg = [];
    els.forEach(function (el, i) {
      at.push({ id: 'x' + i, el: el, hImp: 0, carga: (cargas && cargas[i]) || 0 });
      for (var k = 0; k < (hs[i] || 0); k++) { at.push({ id: 'x' + i + 'h' + k, el: 'H', hImp: 0 }); lg.push(['x' + i, 'x' + i + 'h' + k, 1]); }
    });
    (ligs || []).forEach(function (l) { lg.push(['x' + l[0], 'x' + l[1], l[2] || 1]); });
    M.acrescentar(S, at, lg);
    return S;
  };
  var mapa = null;
  var tabela = function () {
    if (mapa) return mapa; mapa = {};
    TABELA.forEach(function (t) { var S = construir(t[2], t[3], t[4], t[5]); mapa[M.assinaturaMol(S, Object.keys(S.at))] = { nome: t[0], v: t[1] }; });
    return mapa;
  };

  /* ══ A ESTIMATIVA (fora da tabela) ══════════════════════════════
     MOLÉCULA (C, H, O, sem carga nem radical): aditividade de grupos de Benson (1976), kJ/mol.
     Cada átomo pesado é um grupo, pelo que está ligado a ele: C-(C)(H)3, Cd-(C)(H), O-(C)(H)…
     (Cd = carbono da dupla C=C; CO = carbono da carbonila). */
  var GRUPOS = {
    'C:H4': -74.52, 'C:C1H3': -42.68, 'C:C2H2': -20.63, 'C:C3H1': -7.95, 'C:C4': 2.09,
    'C:Cd1H3': -42.68, 'C:C1Cd1H2': -19.92, 'C:C2Cd1H1': -6.19, 'C:C3Cd1': 7.03, 'C:Cd2H2': -17.95,
    'Cd:H2': 26.19, 'Cd:C1H1': 35.96, 'Cd:C2': 43.28,
    'C:O1H3': -42.68, 'C:C1O1H2': -33.91, 'C:C2O1H1': -30.13, 'C:C3O1': -27.63,
    'O:C1H1': -158.68, 'O:C2': -97.07, 'O:O1H1': -68.07, 'O:C1O1': -18.83,
    'CO:H2': -108.8, 'CO:C1H1': -121.84, 'CO:C2': -131.38,
    'C:CO1H3': -42.68, 'C:C1CO1H2': -21.76, 'C:C2CO1H1': -7.11, 'C:C3CO1': 5.86
  };
  var tipoC = function (S, c) {
    var vz = M.vizinhos(S, c);
    if (vz.some(function (v) { return S.at[v].el === 'O' && S.lig[chaveLig(c, v)] === 4; })) return 'CO';
    if (vz.some(function (v) { return S.at[v].el === 'C' && S.lig[chaveLig(c, v)] === 4; })) return 'Cd';
    return 'C';
  };
  var grupoDe = function (S, id) {
    var a = S.at[id], vz = M.vizinhos(S, id), ordem = function (v) { return S.lig[chaveLig(id, v)] / 2; };
    if (a.el === 'H') return '';
    if (vz.some(function (v) { return ordem(v) === 3; })) return null;
    if (a.el === 'C') {
      var t = tipoC(S, id), parceiro = vz.filter(function (v) { return ordem(v) === 2; })[0], conta = { C: 0, Cd: 0, CO: 0, O: 0, H: 0 }, outro = false;
      if (vz.filter(function (v) { return ordem(v) === 2; }).length > 1) return null;
      vz.forEach(function (v) { if (v === parceiro) return; var e = S.at[v].el; if (e === 'H') conta.H++; else if (e === 'O') conta.O++; else if (e === 'C') conta[tipoC(S, v)]++; else outro = true; });
      if (outro) return null;
      return t + ':' + ['C', 'Cd', 'CO', 'O', 'H'].map(function (k) { return conta[k] ? k + conta[k] : ''; }).join('');
    }
    if (a.el === 'O') {
      if (vz.some(function (v) { return ordem(v) === 2; })) return '';                   // o O da carbonila é parte do grupo CO
      var c = { C: 0, O: 0, H: 0 }, x = false; vz.forEach(function (v) { var e = S.at[v].el; if (e in c) c[e]++; else x = true; }); if (x) return null;
      return 'O:' + ['C', 'O', 'H'].map(function (k) { return c[k] ? k + c[k] : ''; }).join('');
    }
    return null;
  };
  var benson = function (S, ids) {
    var soma = 0;
    for (var i = 0; i < ids.length; i++) { var g = grupoDe(S, ids[i]); if (g === null) return null; if (g === '') continue; if (!(g in GRUPOS)) return null; soma += GRUPOS[g]; }
    return soma;
  };
  /* RADICAL: ΔfH(R•) = ΔfH(R–H) + D(R–H) − ΔfH(H•). D: a energia típica da ligação X–H que se rompeu, pelo tipo
     do átomo (valores das moléculas pequenas da ATcT: CH₄ 439; primário 423; secundário 412; terciário 402,5;
     junto ao OH 402 / 397; alílico 366 / 353; vinílico 463; aldeídico 374; formila 369; O–H de álcool 440; ROO–H 359). */
  var bdeTipo = function (S, X) {
    var vz = M.vizinhos(S, X), ordem = function (v) { return S.lig[chaveLig(X, v)] / 2; }, el = S.at[X].el;
    if (el === 'O') { if (vz.length !== 1) return null; var ev = S.at[vz[0]].el; return ev === 'O' ? 358.8 : ev === 'C' ? 440.4 : null; }
    if (el !== 'C') return null;
    if (vz.some(function (v) { return S.at[v].el === 'O' && ordem(v) === 2; })) { var simples = vz.filter(function (v) { return ordem(v) === 1; }); return simples.length && S.at[simples[0]].el === 'H' ? 368.98 : 373.5; }
    if (vz.some(function (v) { return S.at[v].el === 'C' && ordem(v) === 2; })) return 462.8;
    var nC = vz.filter(function (v) { return S.at[v].el === 'C'; }).length;
    if (vz.some(function (v) { return S.at[v].el === 'C' && tipoC(S, v) === 'Cd'; })) return [366.1, 366.1, 353.0, 345.0][nC];
    if (vz.some(function (v) { return S.at[v].el === 'C' && tipoC(S, v) === 'CO'; })) return 399.8;
    if (vz.some(function (v) { return S.at[v].el === 'O'; })) return [402.3, 396.7, 391.0, null][nC];
    return [439.0, 423.0, 411.7, 402.5][nC];
  };

  /* ══ A ΔfH DE UMA ESPÉCIE (uma molécula ou radical da cena) ══════
     { v (kJ/mol), est (estimada?), nome } — ou null quando não há como saber (íons, carbenos, birradicais) */
  M.dfH = function (S, ids) {
    var t = tabela()[M.assinaturaMol(S, ids)];
    if (t) return { v: t.v, est: false, nome: t.nome };
    if (!ids.every(function (id) { return /^(C|H|O)$/.test(S.at[id].el) && M.carga(S, id) === 0 && !S.at[id].hImp; })) return null;
    var rad = ids.filter(function (id) { return M.radical(S, id); }), nome = M.formulaDe(S, ids) + (rad.length ? '•' : '');
    if (!rad.length) {
      if (!ids.every(function (id) { var e = S.at[id].el; return M.eletrons(S, id) === (e === 'H' ? 2 : 8); })) return null;
      var b = benson(S, ids); return b == null ? null : { v: b, est: true, nome: nome };
    }
    if (rad.length !== 1 || M.eletrons(S, rad[0]) !== 7) return null;
    var X = rad[0], T = M.copiar(S), hid = X + '_h';
    T.at[hid] = { el: 'H', nb: 0, hImp: 0, mol: T.at[X].mol }; T.at[X].nb -= 1; T.lig[chaveLig(X, hid)] = 2;
    var pai = M.dfH(T, ids.concat([hid])), D = bdeTipo(S, X);
    if (!pai || D == null) return null;
    return { v: pai.v + D - H_ATOMO, est: true, nome: nome };
  };
  M.nomeEspecie = function (S, ids) {
    var t = tabela()[M.assinaturaMol(S, ids)]; if (t) return t.nome.replace(/ \(.*\)$/, '');
    var nm = ids.some(function (id) { return S.at[id].el === 'C'; }) ? M.nomeDe(S, ids) : null;
    var rad = ids.filter(function (id) { return M.radical(S, id); }).length;
    return (nm && !rad ? nm : M.formulaDe(S, ids)) + (rad ? '•' : '');
  };

  /* ══ A ENERGIA DE UM PASSO: ΔH = Σ ΔfH(o que se formou) − Σ ΔfH(o que reagiu) ══
     as moléculas que não mudaram (a mesma assinatura antes e depois) ficam fora da conta */
  M.entalpiaCombustao = function (Sa, Sb) {
    var ca = M.componentes(Sa), cb = M.componentes(Sb);
    var sa = ca.map(function (c) { return M.assinaturaMol(Sa, c); }), sb = cb.map(function (c) { return M.assinaturaMol(Sb, c); });
    var livresB = sb.map(function (s, j) { return j; }), soA = [];
    sa.forEach(function (s, i) { var j = livresB.filter(function (q) { return sb[q] === s; })[0]; if (j == null) soA.push(i); else livresB.splice(livresB.indexOf(j), 1); });
    if (!soA.length && !livresB.length) return null;
    var dH = 0, est = false, falta = [], reag = [], form = [];
    soA.forEach(function (i) { var f = M.dfH(Sa, ca[i]); if (!f) { falta.push(M.nomeEspecie(Sa, ca[i])); return; } dH -= f.v; est = est || f.est; reag.push(f.nome); });
    livresB.forEach(function (j) { var f = M.dfH(Sb, cb[j]); if (!f) { falta.push(M.nomeEspecie(Sb, cb[j])); return; } dH += f.v; est = est || f.est; form.push(f.nome); });
    if (falta.length) return { dH: null, falta: falta };
    return { dH: dH, estimado: est, reagiram: reag, formados: form };
  };
  /* a leitura do número, para o aluno */
  CB.leitura = function (dH) {
    return dH > 150 ? 'absorve MUITA energia: só acontece em alta temperatura — na faísca, ou dentro da chama'
      : dH > 40 ? 'absorve energia: acontece no calor da chama'
      : dH >= -40 ? 'quase neutro'
      : dH >= -200 ? 'libera energia' : 'libera MUITA energia';
  };
  CB.fmtKJ = function (v, casas) { var t = (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(casas || 0); return t.replace('.', ','); };

  /* ══ O COMBUSTÍVEL: alcano ou álcool (um OH, ligações simples) ══ */
  M.combustivel = function (g) {
    var ids = g.pesados(); if (!ids.length) return null;
    if (!ids.every(function (id) { return /^(C|O)$/.test(g.atomos[id].el); })) return null;
    if (!g.ligacoes.every(function (l) { return l.ordem === 1; })) return null;
    var os = ids.filter(function (id) { return g.atomos[id].el === 'O'; });
    if (!os.length) return { tipo: 'alcano' };
    if (os.length === 1 && g.hidrogenios(os[0]) === 1 && g.vizinhos(os[0]).length === 1) return { tipo: 'alcool' };
    return null;
  };

  /* ══ OS MECANISMOS DA LITERATURA ═════════════════════════════════ */
  var passo = function (antes, setas, fase, explica) {
    var r = M.aplicar(antes, setas); if (!r.ok) throw new Error('combustão: ' + r.erro);
    var e = M.entalpiaCombustao(antes, r.S), dH = e && e.dH != null ? e.dH : null;
    var txt = fase + ': ' + explica + (dH != null ? ' (ΔH ≈ ' + CB.fmtKJ(Math.round(dH)) + ' kJ/mol' + (e.estimado ? ', estimada' : '') + ')' : '');
    return { setas: setas, antes: antes, depois: r.S, explica: txt, fase: fase, dH: dH, estimado: !!(e && e.estimado) };
  };
  var hDe = function (S, c) { return M.vizinhos(S, c).filter(function (v) { return S.at[v].el === 'H'; })[0]; };
  var abstrai = function (X, H, C) { return [{ n: 1, de: { at: X }, para: { at: H } }, { n: 1, de: { lig: [C, H] }, para: { lig: [H, X] } }, { n: 1, de: { lig: [C, H] }, para: { at: C } }]; };
  var abstraiPi = function (X, H, A, R) { return [{ n: 1, de: { at: X }, para: { at: H } }, { n: 1, de: { lig: [A, H] }, para: { lig: [H, X] } }, { n: 1, de: { lig: [A, H] }, para: { lig: [A, R] } }, { n: 1, de: { at: R }, para: { lig: [A, R] } }]; };
  var combina = function (A, B) { return [{ n: 1, de: { at: A }, para: { at: B } }, { n: 1, de: { at: B }, para: { at: A } }]; };
  var homolise = function (A, B) { return [{ n: 1, de: { lig: [A, B] }, para: { at: A } }, { n: 1, de: { lig: [A, B] }, para: { at: B } }]; };
  var betaCisao = function (R, A, Z) { return [{ n: 1, de: { lig: [A, Z] }, para: { at: Z } }, { n: 1, de: { lig: [A, Z] }, para: { lig: [A, R] } }, { n: 1, de: { at: R }, para: { lig: [A, R] } }]; };
  var dativa = function (O, C) { return [{ n: 2, de: { at: O }, para: { lig: [C, O] } }]; };
  var ataqueCO = function (X, C, O) { return [{ n: 1, de: { at: X }, para: { at: C } }, { n: 1, de: { at: C }, para: { at: X } }, { n: 2, de: { lig: [C, O] }, para: { at: O } }]; };
  var oDe = function (S, c) { return M.vizinhos(S, c).filter(function (v) { return S.at[v].el === 'O'; })[0]; };

  var T = {                                                          // os textos que se repetem
    iniMetano: 'O O₂ do ar é um BIRRADICAL (•O–O•): um dos seus elétrons livres arranca um H do metano. Rompe-se a C–H, forte, e forma-se a H–O do HO₂•, bem mais fraca — o passo absorve muita energia. A 25 °C nenhuma colisão tem essa energia: por isso o gás e o ar ficam misturados sem reagir até a FAÍSCA.',
    metilaHO2: 'O radical metila (CH₃•) se liga ao O livre do HO₂•, e a ligação O–O — fraca — se rompe na hora: saem o radical METÓXI (CH₃O•) e o radical HIDROXILA (•OH), o grande carregador da chama.',
    metoxi: 'O elétron livre do O forma uma ligação π com o C, e uma C–H se rompe: sai um átomo H• e fica o FORMALDEÍDO (CH₂=O). A cada passo, o carbono troca ligações com H por ligações com O.',
    formaldeido: 'O •OH arranca um H do formaldeído: forma-se ÁGUA — a ligação H–OH é muito forte, e formá-la libera energia — e o radical formila (HC•=O).',
    co2: 'O elétron livre do C forma a segunda ligação C=O, e a O–H se rompe: forma-se o DIÓXIDO DE CARBONO (O=C=O) e sai um H•. É o último passo do carbono, e o mais lento: só acontece quando há •OH — ou seja, O₂ de sobra.'
  };

  M.modelos.combustao = function (sub, ar) {
    var g = typeof sub === 'string' ? Q3.deSmiles(sub) : sub, cmb = M.combustivel(g);
    if (!cmb) return { ok: false, erro: 'o combustível precisa ser um alcano ou um álcool' };
    var nC = g.pesados().filter(function (id) { return g.atomos[id].el === 'C'; }).length, pouco = ar === 'pouco';
    var metano = nC === 1 && cmb.tipo === 'alcano', metanol = nC === 1 && cmb.tipo === 'alcool';
    var S = M.vazio(), info = M.explicitar(S, g, 'a', function (id, gg) { return gg.hidrogenios(id); });
    M.acrescentarO2(S, 'o'); var doisO2 = !(pouco && (metano || metanol)); if (doisO2) M.acrescentarO2(S, 'p');
    var P = [], ult = function () { return P.length ? P[P.length - 1].depois : S; }, add = function (setas, fase, txt) { P.push(passo(ult(), setas, fase, txt)); };
    var fim = 'continua', nota = '';
    if (metano) {
      var c = 'a1', h = ['a1h1', 'a1h2', 'a1h3', 'a1h4'];
      add(abstrai('o1', h[0], c), 'INICIAÇÃO — precisa da faísca', T.iniMetano);
      add(combina(c, 'o2').concat(homolise('o1', 'o2')), 'PROPAGAÇÃO', T.metilaHO2);
      add(betaCisao('o2', c, h[1]), 'PROPAGAÇÃO (β-cisão)', T.metoxi);
      add(abstrai('o1', h[2], c), 'PROPAGAÇÃO', T.formaldeido);
      if (!pouco) {
        add(abstrai('p1', h[3], c).concat(dativa('o2', c)), 'PROPAGAÇÃO', 'O outro O₂ arranca o último H do carbono: forma-se o MONÓXIDO DE CARBONO. O C fica com um par isolado, e o O cede um par para a terceira ligação — a ligação DATIVA do C≡O. Se faltasse ar, a cadeia pararia aqui: combustão incompleta.');
        add(combina(h[1], 'p2').concat(homolise('p1', 'p2')), 'PROPAGAÇÃO', 'O H• se liga ao O livre do HO₂•, e a O–O se rompe: dois radicais •OH.');
        add(ataqueCO('p1', c, 'o2'), 'PROPAGAÇÃO', 'Um •OH ataca o C do CO: o C usa um elétron do seu par na nova ligação, e uma das ligações π vai para o O. Forma-se o radical HOCO•.');
        add(betaCisao(c, 'p1', h[3]), 'PROPAGAÇÃO (β-cisão)', T.co2);
        add(combina(h[3], 'p2'), 'TERMINAÇÃO', 'O H• e o último •OH se juntam: a segunda molécula de ÁGUA. É o passo que mais libera energia — a ligação H–O se forma inteira, sem nada a romper.');
        fim = 'completa';
        nota = 'Somando os nove passos, todos os radicais se cancelam e sobra a equação global: CH₄ + 2 O₂ → CO₂ + 2 H₂O. E a soma das energias é a ΔH dessa equação — lei de Hess.';
      } else {
        add(homolise(c, h[3]).concat(dativa('o2', c)), 'PROPAGAÇÃO (β-cisão)', 'Sem outro O₂, o radical formila se desfaz no calor: a C–H se rompe, sai um H•, e o C fica com um par isolado; o O cede um par (a ligação DATIVA): forma-se o MONÓXIDO DE CARBONO. Sem •OH por perto, ele não vira CO₂.');
        add(combina(h[1], h[3]), 'TERMINAÇÃO', 'Os dois átomos H• se juntam: H₂. Com pouco ar, parte do hidrogênio também sai sem queimar — a fumaça de uma queima ruim ainda é inflamável (CO e H₂).');
        fim = 'incompleta';
        nota = 'Com só um O₂ por metano, o carbono para no CO: CH₄ + O₂ → CO + H₂O + H₂. Combustão INCOMPLETA — menos energia, e o CO é tóxico.';
      }
      return { ok: true, inicio: S, passos: P, fim: fim, nota: nota, combustivel: cmb, nC: nC };
    }
    if (metanol && pouco) {
      var cm = 'a1', om = 'a2', hm = ['a1h1', 'a1h2', 'a1h3'], ho = 'a2h1';
      add(abstrai('o1', hm[0], cm), 'INICIAÇÃO — precisa da faísca', 'O O₂ (birradical) arranca um H do carbono do metanol — o do C ligado ao OH, o mais fácil de sair. Ficam o radical •CH₂OH e o HO₂•.');
      add(abstraiPi('o2', ho, om, cm), 'PROPAGAÇÃO', 'O O livre do HO₂• arranca o H do OH; o elétron que sobra no O forma a π com o C: FORMALDEÍDO (CH₂=O) e peróxido de hidrogênio (H₂O₂).');
      add(homolise('o1', 'o2'), 'RAMIFICAÇÃO', 'A ligação O–O do H₂O₂ é fraca e se rompe no calor: UMA molécula vira DOIS radicais •OH. É assim que a cadeia se multiplica e a chama se espalha.');
      add(abstrai('o1', hm[1], cm), 'PROPAGAÇÃO', 'Um •OH arranca um H do formaldeído: ÁGUA e o radical formila (HC•=O).');
      add(abstrai('o2', hm[2], cm).concat(dativa(om, cm)), 'TERMINAÇÃO', 'O outro •OH arranca o último H: a segunda ÁGUA. O C fica com um par isolado e o O cede um par (a ligação DATIVA): MONÓXIDO DE CARBONO.');
      return { ok: true, inicio: S, passos: P, fim: 'incompleta', nota: 'Com só um O₂ por metanol, o carbono para no CO: CH₃OH + O₂ → CO + 2 H₂O. Combustão INCOMPLETA.', combustivel: cmb, nC: nC };
    }
    /* ── O COMEÇO DA CADEIA (qualquer alcano ou álcool): iniciação, o alceno ou a carbonila, a ramificação pelo
       H₂O₂, a primeira água — e, quando aparece uma carbonila na ponta, o CO e o CO₂ ── */
    var C1, oAlfa = null, cs = info.ids.filter(function (id) { return S.at[id].el === 'C' && hDe(S, id); });
    if (cmb.tipo === 'alcool') oAlfa = cs.filter(function (id) { return oDe(S, id); })[0] || null;
    cs.sort(function (a, b) { return M.substituicao(S, b) - M.substituicao(S, a) || (a < b ? -1 : 1); });
    C1 = oAlfa || cs[0];
    var H1 = hDe(S, C1), grau = M.substituicao(S, C1), qual = oAlfa ? 'o do carbono ligado ao OH' : ['um H do carbono', 'um H de um carbono primário', 'um H de um carbono secundário', 'o H do carbono terciário'][grau];
    add(abstrai('o1', H1, C1), 'INICIAÇÃO — precisa da faísca', 'O O₂ (birradical) arranca o H mais fácil de sair — ' + qual + ' (fica o radical mais estável, como na halogenação). Formam-se o radical do combustível e o HO₂•. A 25 °C nada disso acontece: é a FAÍSCA que dá a energia.');
    var S1 = ult(), O1 = oDe(S1, C1), Hoh = O1 ? hDe(S1, O1) : null, betas = M.vizinhos(S1, C1).filter(function (v) { return S1.at[v].el === 'C' && hDe(S1, v); }), produtoPi = null;
    var nomeOrg = function (Sx) { var o = M.organico(Sx); return M.nomeEspecie(Sx, o); };
    if (O1 && Hoh) {
      add(abstraiPi('p1', Hoh, O1, C1), 'PROPAGAÇÃO', 'O segundo O₂ arranca o H do OH; o elétron que sobra no O forma a π com o C: ' + (grau >= 2 ? 'uma CETONA' : 'um ALDEÍDO') + ' (' + nomeOrg(ult()) + ') e outro HO₂•.');
      produtoPi = 'carbonila';
    } else if (betas.length) {
      var z = M.zaitsev(S1, C1, betas), Hb = hDe(S1, z.beta);
      add(abstraiPi('p1', Hb, z.beta, C1), 'PROPAGAÇÃO', 'O segundo O₂ arranca um H do carbono vizinho ao radical; o elétron que sobra forma a ligação π: um ALCENO (' + nomeOrg(ult()) + ') e outro HO₂•. No calor da chama, as cadeias grandes se quebram em pedaços insaturados como este.');
      produtoPi = 'alceno';
    } else {                                                           // sem H vizinho (o neopentano): o caminho do metano
      add(combina(C1, 'o2').concat(homolise('o1', 'o2')), 'PROPAGAÇÃO', 'O radical se liga ao O livre do HO₂•, e a O–O, fraca, se rompe: um radical ALCÓXI (C–O•) e o •OH.');
      var hb = hDe(ult(), C1);
      if (hb) add(betaCisao(oDe(ult(), C1), C1, hb), 'PROPAGAÇÃO (β-cisão)', 'O elétron do O forma a π com o C e sai um H•: um ALDEÍDO (' + nomeOrg(ult()) + ').');
      return { ok: true, inicio: S, passos: P, fim: 'continua', nota: 'A cadeia continua: os radicais que sobraram atacam as outras moléculas e os pedaços, até cada carbono virar CO₂ e cada H, água. A cadeia completa está no metano.', combustivel: cmb, nC: nC };
    }
    add(abstrai('p2', H1, 'o1'), 'PROPAGAÇÃO', 'Os dois HO₂• trocam um H: formam-se o peróxido de hidrogênio (H₂O₂), uma molécula sem elétron livre, e o O₂ de volta. Parece que a cadeia ia parar — veja o próximo passo.');
    add(homolise('p1', 'p2'), 'RAMIFICAÇÃO', 'A O–O do H₂O₂ é fraca e se rompe no calor da chama: UMA molécula vira DOIS radicais •OH — a cadeia se multiplica. É por isso que a chama se espalha tão depressa.');
    // a primeira ÁGUA: o •OH (p2) arranca o H mais fraco do produto π
    var S4 = ult(), org = M.organico(S4), alvoH = null, alvoC = null, tipoH = '';
    var cands = org.filter(function (id) { return S4.at[id].el === 'C' && hDe(S4, id); });
    var escolhe = function (f, rot) { if (alvoC) return; var c2 = cands.filter(f).sort(function (a, b) { return M.substituicao(S4, b) - M.substituicao(S4, a) || (a < b ? -1 : 1); })[0]; if (c2) { alvoC = c2; alvoH = hDe(S4, c2); tipoH = rot; } };
    escolhe(function (id) { return tipoC(S4, id) === 'CO'; }, 'o H do grupo aldeído, o mais fraco');
    escolhe(function (id) { return tipoC(S4, id) === 'C' && M.vizinhos(S4, id).some(function (v) { return S4.at[v].el === 'C' && tipoC(S4, v) === 'Cd'; }); }, 'um H vizinho da dupla (alílico), o mais fraco');
    escolhe(function (id) { return tipoC(S4, id) === 'C' && M.vizinhos(S4, id).some(function (v) { return S4.at[v].el === 'C' && tipoC(S4, v) === 'CO'; }); }, 'um H vizinho da carbonila');
    escolhe(function (id) { return tipoC(S4, id) === 'Cd'; }, 'um H da própria dupla');
    escolhe(function () { return true; }, 'um H');
    add(abstrai('p2', alvoH, alvoC), 'PROPAGAÇÃO', 'Um •OH arranca ' + tipoH + ': forma-se ÁGUA — o destino de todo H do combustível.');
    var S5 = ult(), acila = alvoC, oAc = tipoC(S5, acila) === 'CO' ? oDe(S5, acila) : null;
    if (produtoPi === 'carbonila' && oAc) {
      var vizAc = M.vizinhos(S5, acila).filter(function (v) { return v !== oAc; })[0];
      if (vizAc && S5.at[vizAc].el === 'H') add(abstrai('o1', vizAc, acila).concat(dativa(oAc, acila)), 'PROPAGAÇÃO', 'O O₂ que voltou arranca o último H do formila: MONÓXIDO DE CARBONO (o C≡O, com a ligação dativa) e HO₂•.');
      else if (vizAc) add(homolise(acila, vizAc).concat(dativa(oAc, acila)), 'PROPAGAÇÃO', 'O radical acila se quebra: sai o MONÓXIDO DE CARBONO (C≡O, a ligação dativa do O) e fica um radical alquila, que segue a cadeia como o do metano.');
      add(ataqueCO('p1', acila, oAc), 'PROPAGAÇÃO', 'O outro •OH ataca o C do CO: o C usa um elétron do seu par, uma π vai para o O — o radical HOCO•.');
      var S7 = ult(), hp = hDe(S7, 'p1');
      add(betaCisao(acila, 'p1', hp), 'PROPAGAÇÃO (β-cisão)', T.co2);
      nota = 'O primeiro carbono já virou CO₂. A cadeia continua: os radicais que sobraram atacam outras moléculas de combustível e os pedaços, até cada carbono virar CO₂ e cada H, água. Com pouco ar, o fim muda — sobra CO (veja o metano com pouco ar).';
    } else nota = 'A cadeia continua: os radicais que sobraram atacam outras moléculas de combustível e os pedaços, que passam pelo mesmo caminho do metano — formaldeído, CO e, por fim, CO₂. A cadeia inteira está no metano.';
    return { ok: true, inicio: S, passos: P, fim: 'continua', nota: nota, combustivel: cmb, nC: nC };
  };

  /* ══ O BALANÇO GLOBAL: completa, incompleta (CO) e incompleta (fuligem) ══
     comb: { C, H, O (átomos), dfH (kJ/mol), estado ('g' | 'l'), estimado, massa (g/mol) }. A água LÍQUIDA (o valor
     das tabelas); o mesmo com a água em vapor (como sai da chama). ΔfH: CO₂ −393,476; CO −110,520;
     H₂O(l) −285,800; H₂O(g) −241,805 (ATcT); C(grafite) 0. */
  var DF = { CO2: -393.476, CO: -110.520, H2Ol: -285.800, H2Og: -241.805, C: 0 };
  var mdc = function (a, b) { return b ? mdc(b, a % b) : a; };
  CB.balanco = function (comb) {
    var x = comb.C, y = comb.H, z = comb.O, saidas = [];
    var monta = function (tipo, o2x4, prod, dfProd) {                    // o2x4: 4 × (mols de O₂)
      if (o2x4 <= 0) return null;
      var k = 4 / mdc(mdc(o2x4, 4), mdc(4 * x, 2 * y));                  // multiplica até tudo ficar inteiro
      var co = { f: k / 4 * 4, o2: o2x4 * k / 4, c: x * k, h2o: y / 2 * k };
      var g0 = mdc(mdc(co.f, co.o2), mdc(co.c, co.h2o)); Object.keys(co).forEach(function (q) { co[q] /= g0; });
      var dHl = x * dfProd + y / 2 * DF.H2Ol - comb.dfH, dHg = x * dfProd + y / 2 * DF.H2Og - comb.dfH;
      return { tipo: tipo, coef: co, prod: prod, dH: dHl, dHvapor: dHg, o2: o2x4 / 4 };
    };
    saidas.push(monta('completa', 4 * x + y - 2 * z, 'CO₂', DF.CO2));
    saidas.push(monta('co', 2 * x + y - 2 * z, 'CO', DF.CO));
    saidas.push(monta('fuligem', y - 2 * z, 'C', DF.C));
    return saidas.filter(Boolean);
  };
  CB.massaMolar = function (comb) { return comb.C * 12.011 + comb.H * 1.008 + comb.O * 15.999; };
  /* os dados do combustível a partir do grafo (e da biblioteca, quando há o valor de tabela) */
  CB.dados = function (g, reacao) {
    var ids = g.pesados(), C = 0, H = 0, O = 0;
    ids.forEach(function (id) { var e = g.atomos[id].el; if (e === 'C') C++; else if (e === 'O') O++; H += g.hidrogenios(id); });
    var d = { C: C, H: H, O: O, estado: 'g', estimado: false, dfH: null };
    if (reacao && reacao.dfH != null) { d.dfH = reacao.dfH; d.estado = reacao.estado || 'g'; }
    else {
      var S = M.vazio(); M.explicitar(S, g, 'a', function (id, gg) { return gg.hidrogenios(id); });
      var f = M.dfH(S, Object.keys(S.at)); if (f) { d.dfH = f.v; d.estimado = f.est; }
    }
    d.massa = CB.massaMolar(d);
    return d;
  };
})();
