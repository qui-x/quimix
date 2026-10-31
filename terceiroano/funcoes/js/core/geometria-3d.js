/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/geometria-3d.js
   ───────────────────────────────────────────────────────────────
   A MOLÉCULA NO ESPAÇO — coordenadas 3D reais, com os hidrogênios.

   O desenho plano (geometria-molecular.js) segue a convenção do papel:
   zigue-zague de 120° mesmo no sp³. Esta camada é o contrário: é o que
   a molécula É no espaço, para as representações espaciais do Módulo 1
   (esfera e bastão, modelo compacto). Por isso aqui valem os ângulos
   verdadeiros:
     · sp³ ... 109,47° (tetraedro) — inclusive H–C–H
     · sp² ... 120°, e os dois carbonos de uma dupla com os substituintes
               no MESMO plano (o eteno é plano)
     · sp  ... 180°
   e os comprimentos médios de ligação em ångström (C–C 1,54; C=C 1,34;
   C≡C 1,20; C–H 1,09).

   A cadeia principal sai na conformação ANTIPERIPLANAR (zigue-zague
   plano), que é a de menor energia de um alcano — e é por isso que a
   vista espacial, olhada de frente, lembra o desenho em linha. Os H
   saem para fora desse plano, como no tetraedro de verdade.

   ANÉIS
     · anel de 6 saturado e isolado → CADEIRA (a forma real do
       cicloexano; a hexagonal plana do papel não existe no espaço)
     · anel aromático (6 com três duplas alternadas) → plano, com lado
       de 1,39 Å (o benzeno não tem simples e duplas: tem seis iguais)
     · demais anéis → planos. Envelope do ciclopentano, meia-cadeira do
       cicloexeno e conformações de anéis fundidos ficam fora do escopo
       do Ensino Médio; o anel plano tem os comprimentos certos.

   Entrada: o grafo (grafo-molecular.js) e as posições 2D do editor,
   usadas só para a molécula no espaço ficar com a mesma "cara" do
   desenho plano quando vista de frente.

   Saída: { atomos: [{ id, el, h, x, y, z }], ligacoes: [{ a, b, ordem }] }
   em ångström. y para cima (convenção da OrbitCamera).

   Depende de: grafo-molecular.js, geometria-molecular.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

(function (raiz) {
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var G3 = Q3.Geometria3D = {};

  var CC = 1.54;                     // Å por unidade do desenho plano
  var LIG_H = { C: 1.09, N: 1.01, O: 0.96, S: 1.34, P: 1.42, Si: 1.48 };
  var TETRA = Math.acos(-1 / 3);     // 109,47°

  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { var m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m]; }
  function perpDe(u) { return norm(cross(u, Math.abs(u[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0])); }
  G3.angulo = function (a, b, c) {       // ângulo em b, em graus
    var u = norm(sub(a, b)), v = norm(sub(c, b));
    return Math.acos(Math.max(-1, Math.min(1, dot(u, v)))) * 180 / Math.PI;
  };

  /* Quantas direções de ligação o átomo tem (σ + pares isolados que
     ocupam lugar no arranjo): 4 no sp³, 3 no sp², 2 no sp. */
  function arranjo(hib) { return hib === 'sp' ? 2 : hib === 'sp2' ? 3 : 4; }

  /* Direções que faltam, dadas as que já estão ocupadas (u[] a partir do
     átomo). `ref` é o vetor para o qual o PRIMEIRO filho deve apontar o
     mais possível (a direção dele no desenho plano). */
  function direcoesLivres(hib, u, faltam, ref, lado) {
    if (faltam <= 0) return [];
    var n = arranjo(hib), out = [];
    if (u.length === 0) {
      /* Átomo-raiz: a primeira direção É a do 1º filho no desenho plano,
         e as demais saem dela pelo arranjo da hibridização — com a
         primeira delas no plano do desenho, para a cadeia continuar em
         zigue-zague plano. (A primeira versão gerava as quatro a partir
         de −e: nenhuma apontava para e, e o primeiro filho saía 70,5°
         fora de onde o desenho o punha.) */
      var e = norm(ref || [1, 0, 0]);
      var noPlano = cross([0, 0, 1], e);
      noPlano = Math.hypot(noPlano[0], noPlano[1], noPlano[2]) > 1e-6 ? norm(noPlano) : perpDe(e);
      return [e].concat(direcoesLivres(hib, [e], n - 1, noPlano)).slice(0, faltam);
    }
    if (u.length === 1) {
      var w = u[0];
      if (hib === 'sp') return [mul(w, -1)];
      // base perpendicular a w: e1 na direção de ref (projetado), e2 = w × e1
      var r0 = ref ? sub(ref, mul(w, dot(ref, w))) : null;
      var e1 = r0 && Math.hypot(r0[0], r0[1], r0[2]) > 1e-6 ? norm(r0) : perpDe(w), e2 = cross(w, e1);
      var alfa = hib === 'sp2' ? Math.PI / 3 : Math.PI - TETRA;   // ângulo a partir de −w
      var passos = hib === 'sp2' ? [0, 180] : [0, 120, 240];
      passos.forEach(function (g) {
        var r = g * Math.PI / 180, lateral = add(mul(e1, Math.cos(r)), mul(e2, Math.sin(r)));
        out.push(norm(add(mul(w, -Math.cos(alfa)), mul(lateral, Math.sin(alfa)))));
      });
      return out.slice(0, faltam);
    }
    if (u.length === 2) {
      var b = norm(add(u[0], u[1])), nn = norm(cross(u[0], u[1]));
      if (Math.hypot(nn[0], nn[1], nn[2]) < 1e-6) nn = perpDe(b);
      if (hib === 'sp2' || n === 3) return [mul(b, -1)].slice(0, faltam);
      var beta = TETRA / 2;
      return [norm(add(mul(b, -Math.cos(beta)), mul(nn, Math.sin(beta)))),
              norm(add(mul(b, -Math.cos(beta)), mul(nn, -Math.sin(beta))))].slice(0, faltam);
    }
    /* Três ou mais direções já ocupadas: a que sobra é a MAIS AFASTADA
       de todas. A regra antiga — "o oposto da soma" — só acerta quando as
       três já formam um tetraedro. No ciclopropano, com 60° entre as
       ligações do anel, ela punha o H a 90° do substituinte. Candidatos:
       o oposto da soma, as duas saídas tetraédricas de cada par de
       ligações, e a normal ao plano (a junção de anéis planos, onde as
       três ficam no mesmo plano; o lado vem de quem chama, o de mais
       espaço). Vence o que tiver o MAIOR menor-ângulo com as existentes. */
    var soma = u.reduce(function (s, x) { return add(s, x); }, [0, 0, 0]), cands = [];
    var n0 = cross(u[0], u[1]);
    if (Math.hypot(n0[0], n0[1], n0[2]) > 1e-6) { n0 = norm(n0); cands.push(mul(n0, lado || 1), mul(n0, -(lado || 1))); }
    if (Math.hypot(soma[0], soma[1], soma[2]) >= 0.35) cands.push(mul(norm(soma), -1));
    var beta = TETRA / 2;
    for (var i = 0; i < u.length; i++) for (var j = i + 1; j < u.length; j++) {
      var bb = norm(add(u[i], u[j])), nn = cross(u[i], u[j]);
      if (Math.hypot(nn[0], nn[1], nn[2]) < 1e-6) continue;
      nn = norm(nn);
      cands.push(norm(add(mul(bb, -Math.cos(beta)), mul(nn, Math.sin(beta)))), norm(add(mul(bb, -Math.cos(beta)), mul(nn, -Math.sin(beta)))));
    }
    var melhor = cands[0] || mul(norm(soma), -1), nota = -Infinity;
    cands.forEach(function (c) {
      var menor = Math.min.apply(null, u.map(function (x) { return Math.acos(Math.max(-1, Math.min(1, dot(c, x)))); }));
      if (menor > nota + 1e-6) { nota = menor; melhor = c; }
    });
    return [melhor].slice(0, faltam);
  }

  /* Leva pontos do referencial local ao do mundo, dadas três
     correspondências não alinhadas (p0→q0, p1→q1, p2→q2): monta um
     triedro ortonormal em cada lado e troca um pelo outro. É rotação
     pura (sem espelhar) mais translação. */
  function girarVetor(v, eixo, th) {
    var k = norm(eixo), co = Math.cos(th), si = Math.sin(th);
    return add(add(mul(v, co), mul(cross(k, v), si)), mul(k, dot(k, v) * (1 - co)));
  }

  function det3(a, b, c) {
    return a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }

  function alinhar(p, q) {
    var e1 = norm(sub(p[1], p[0])), tp = sub(p[2], p[0]), e2 = norm(sub(tp, mul(e1, dot(tp, e1)))), e3 = cross(e1, e2);
    var f1 = norm(sub(q[1], q[0])), tq = sub(q[2], q[0]), f2 = norm(sub(tq, mul(f1, dot(tq, f1)))), f3 = cross(f1, f2);
    return function (x) {
      var v = sub(x, p[0]);
      return add(q[0], add(add(mul(f1, dot(v, e1)), mul(f2, dot(v, e2))), mul(f3, dot(v, e3))));
    };
  }
  /* Raio do círculo que inscreve um polígono com estes lados: resolve
     Σ 2·arcsen(sᵢ/2R) = 2π por bisseção (o lado esquerdo cai com R).
     Sempre existe quando o maior lado não passa da soma dos outros. */
  function raioInscrito(lados) {
    var lo = Math.max.apply(null, lados) / 2 + 1e-9, hi = lados.reduce(function (a, b) { return a + b; }, 0);
    var f = function (R) { return lados.reduce(function (s, l) { return s + 2 * Math.asin(Math.min(1, l / (2 * R))); }, 0) - 2 * Math.PI; };
    if (f(lo) < 0) return hi / (2 * Math.PI);          // degenerado: cai para o círculo de mesmo perímetro
    for (var k = 0; k < 60; k++) { var mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  function comprimento(g, a, b, ordem) { return Q3.Geometria.comprimento(g.atomos[a].el, g.atomos[b].el, ordem) * CC; }

  /* Anel de 6 saturado e isolado → cadeira. Raio e desnível calculados
     para C–C = 1,54 Å e ângulo C–C–C = 109,47°:
       R² + 4h² = 1,54²   e   cos θ = (−R²/2 + 4h²)/(R² + 4h²) = −1/3
     ⇒ h = R/√32, R = 1,452 Å, h = 0,257 Å. */
  function cadeira(anel, centro, eixoX, eixoY, eixoN) {
    var R = Math.sqrt(CC * CC / 1.125), h = R / Math.sqrt(32), out = {};
    anel.forEach(function (id, k) {
      var a = k * Math.PI / 3;
      out[id] = add(centro, add(add(mul(eixoX, R * Math.cos(a)), mul(eixoY, R * Math.sin(a))), mul(eixoN, k % 2 ? -h : h)));
    });
    return out;
  }

  /* ═══ SISTEMAS EM PONTE — a gaiola é dobrada no espaço ═════════════
     Num bicíclico em ponte (norbornano), dois anéis dividem TRÊS átomos:
     as duas cabeças de ponte e a ponte. Encaixar o segundo anel como
     polígono plano não funciona — a ponte, já posta, fica fora do lugar
     que o polígono espera, e a gaiola desmontava (36° entre duas ligações
     de uma cabeça de ponte). Aqui, só nesses sistemas, um relaxamento
     com alvos IDEAIS: comprimentos da tabela, 109,5° (ou 120°) em volta
     de cada átomo da gaiola, e repulsão entre átomos distantes na
     cadeia. Antes, a ponte é levantada para fora do plano, senão o
     relaxamento pode ficar preso na forma achatada. Os ângulos da gaiola
     real ficam abaixo de 109,5° (a tensão do anel); o relaxamento acha
     esse compromisso sozinho. */
  function relaxarPontes(g, P, atomosH, aneis) {
    var ponte = {}, interior = {};
    for (var i = 0; i < aneis.length; i++) for (var j = i + 1; j < aneis.length; j++) {
      var comuns = aneis[i].filter(function (id) { return aneis[j].indexOf(id) >= 0; });
      if (comuns.length < 3) continue;
      aneis[i].concat(aneis[j]).forEach(function (id) { ponte[id] = true; });
      comuns.forEach(function (id) { if (g.vizinhos(id).filter(function (v) { return comuns.indexOf(v.id) >= 0; }).length === 2) interior[id] = true; });
    }
    if (!Object.keys(ponte).length) return;
    var pos = {}, el = {}, viz = {};
    Object.keys(P).forEach(function (id) { pos[id] = P[id]; el[id] = g.atomos[id].el; viz[id] = g.vizinhos(id).map(function (v) { return v.id; }); });
    atomosH.forEach(function (h) { if (!h._p) return; pos[h.id] = h._p; el[h.id] = 'H'; viz[h.id] = [h.pai]; viz[h.pai].push(h.id); });
    // levanta a ponte (e os H dela) para fora do plano do primeiro anel
    var r0 = aneis.filter(function (r) { return r.some(function (id) { return ponte[id]; }); })[0];
    var nrm = norm(cross(sub(pos[r0[1]], pos[r0[0]]), sub(pos[r0[2]], pos[r0[0]])));
    Object.keys(interior).forEach(function (id) {
      var mv = [id].concat(viz[id].filter(function (x) { return el[x] === 'H'; }));
      mv.forEach(function (x) { var p = pos[x]; p[0] += nrm[0] * 0.9; p[1] += nrm[1] * 0.9; p[2] += nrm[2] * 0.9; });
    });
    var ideal = function (a, b) {
      if (el[a] === 'H') return LIG_H[el[b]] || 1.09;
      if (el[b] === 'H') return LIG_H[el[a]] || 1.09;
      var l = g.ligacao(a, b); return comprimento(g, a, b, l ? l.ordem : 1);
    };
    var dist = function (a, b) { var p = pos[a], q = pos[b]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
    var travas = [], todos = Object.keys(pos);
    todos.forEach(function (c) {
      var vs = viz[c];
      vs.forEach(function (x) { if (x > c) travas.push([c, x, ideal(c, x), 1]); });
      for (var a = 0; a < vs.length; a++) for (var b = a + 1; b < vs.length; b++) {
        var alvo;
        if (ponte[c]) {                                  // alvo ideal: tetraedro (ou trigonal)
          var th = (Q3.Geometria.hibridizacao(g, c) === 'sp2' ? 120 : 109.47) * Math.PI / 180;
          var la = ideal(c, vs[a]), lb = ideal(c, vs[b]);
          alvo = Math.sqrt(la * la + lb * lb - 2 * la * lb * Math.cos(th));
        } else alvo = dist(vs[a], vs[b]);                // fora da gaiola: mantém o que já está certo
        travas.push([vs[a], vs[b], alvo, 0.5]);
      }
    });
    var perto = {};
    todos.forEach(function (a) { var d = {}; d[a] = 0; var f = [a];
      while (f.length) { var x = f.shift(); if (d[x] >= 2) continue; viz[x].forEach(function (y) { if (!(y in d)) { d[y] = d[x] + 1; f.push(y); } }); }
      perto[a] = d; });
    var mover = function (a, b, alvo, k) {
      var p = pos[a], q = pos[b], dd = dist(a, b) || 1e-6, f = (dd - alvo) / dd * 0.5 * k;
      var dx = (q[0] - p[0]) * f, dy = (q[1] - p[1]) * f, dz = (q[2] - p[2]) * f;
      p[0] += dx; p[1] += dy; p[2] += dz; q[0] -= dx; q[1] -= dy; q[2] -= dz;
    };
    for (var it = 0; it < 400; it++) {
      travas.forEach(function (tv) { mover(tv[0], tv[1], tv[2], tv[3]); });
      if (it % 4 === 0) for (var x = 0; x < todos.length; x++) for (var y = x + 1; y < todos.length; y++) {
        var a2 = todos[x], b2 = todos[y]; if (b2 in perto[a2]) continue;
        var lim = (el[a2] === 'H' && el[b2] === 'H') ? 1.8 : (el[a2] === 'H' || el[b2] === 'H') ? 2.1 : 2.5;
        if (dist(a2, b2) < lim) mover(a2, b2, lim, 0.3);
      }
    }
  }

  /* ═══ CONFORMAÇÃO SEM CHOQUE ═══════════════════════════════════
     A montagem escolhe cada direção olhando o desenho plano, não os
     vizinhos: um ramo pode apontar para os H de outro (no 3-etilpentano,
     dois H a 0,73 Å). Aqui cada ligação que pode girar experimenta as
     outras duas conformações ALTERNADAS (±120°) e fica com a que tem
     menos choque. Todos os ângulos e comprimentos continuam os ideais —
     só muda para onde o ramo aponta.
     Giram só ramos já FORA do plano do desenho e grupos da ponta (CH₃,
     OH...): a cadeia principal continua no plano, e a estereoquímica das
     vistas planas continua valendo.
     Choque = pares a 3+ ligações de distância mais perto que a soma
     aproximada dos raios de van der Waals: H·H 2,0 Å, H·X 2,4, X·X 2,9. */
  function semChoque(g, P, atomosH, alvoQuiral) {
    var pos = {}, el = {}, viz = {};
    Object.keys(P).forEach(function (id) { pos[id] = P[id]; el[id] = g.atomos[id].el; viz[id] = g.vizinhos(id).map(function (v) { return v.id; }); });
    atomosH.forEach(function (h) { if (!h._p) return; pos[h.id] = h._p; el[h.id] = 'H'; viz[h.id] = [h.pai]; viz[h.pai].push(h.id); });
    var todos = Object.keys(pos);
    var perto = {};                                   // pares a 1 ou 2 ligações: não contam
    todos.forEach(function (a) {
      var d = {}; d[a] = 0; var f = [a];
      while (f.length) { var x = f.shift(); if (d[x] >= 2) continue; viz[x].forEach(function (y) { if (!(y in d)) { d[y] = d[x] + 1; f.push(y); } }); }
      perto[a] = d;
    });
    var LIM = function (a, b) { var ha = el[a] === 'H', hb = el[b] === 'H'; return ha && hb ? 2.0 : (ha || hb) ? 2.4 : 2.9; };
    var nota = function () {
      var s = 0;
      for (var i = 0; i < todos.length; i++) for (var j = i + 1; j < todos.length; j++) {
        var a = todos[i], b = todos[j]; if (b in perto[a]) continue;
        var p = pos[a], q = pos[b], d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]), lim = LIM(a, b);
        if (d < lim) s += (lim - d) * (lim - d);
      }
      return s;
    };
    var girarEm = function (ids, c, k, th) {        // Rodrigues: gira em torno do eixo k que passa por c
      var co = Math.cos(th), si = Math.sin(th);
      ids.forEach(function (id) {
        var v = sub(pos[id], c), kxv = cross(k, v), kv = dot(k, v);
        var r = add(add(mul(v, co), mul(kxv, si)), mul(k, kv * (1 - co)));
        var novo = add(c, r); pos[id][0] = novo[0]; pos[id][1] = novo[1]; pos[id][2] = novo[2];
      });
    };
    var eixos = [];
    g.ligacoes.forEach(function (l) {
      if (l.ordem !== 1) return;
      var la = Q3.Geometria.lado(g, l.a, l.b), lb = Q3.Geometria.lado(g, l.b, l.a);
      if (!la || !lb) return;                          // ligação de anel não gira
      var fixo = la.length <= lb.length ? l.a : l.b, mov = fixo === l.a ? l.b : l.a, lado = fixo === l.a ? la : lb;
      var ponta = lado.length === 1, foraDoPlano = Math.abs(pos[mov][2]) > 0.3;
      if (!ponta && !foraDoPlano) return;              // a cadeia principal fica no plano
      var conj = {}; lado.forEach(function (id) { conj[id] = true; });
      var moveis = todos.filter(function (id) { return conj[id] || (el[id] === 'H' && conj[viz[id][0]]); });
      eixos.push({ c: pos[mov], de: fixo, mov: mov, ids: moveis.filter(function (id) { return id !== mov; }) });
    });
    /* giros que levem um substituinte escolhido para o outro lado do
       plano são recusados: a escolha do aluno vale mais que a folga */
    /* Um giro não pode inverter a quiralidade de um centro definido NEM
       trocar de lado uma cunha definida. A quiralidade sozinha não basta:
       girar um trecho da cadeia move um carbono e todos os vizinhos dele
       juntos — cada centro continua o mesmo, mas um centro passa para a
       frente do vizinho que estava atrás (a molécula certa, vista de outro
       ângulo). O lado de referência é o que a montagem deixou, e não o z
       nominal: num fragmento inclinado o z do mundo não é a frente local. */
    var centros = Object.keys(alvoQuiral || {});
    var cunhas = g.ligacoes.filter(function (l) { return l.estereo && l.estereo.tipo !== 'plano' && l.ordem === 1; }).map(function (l) {
      var c = l.estereo.de, o = c === l.a ? l.b : l.a;
      return { c: c, o: o, lado: Math.sign(pos[o][2] - pos[c][2]) };
    });
    var respeita = function () {
      return centros.every(function (c) {
        var al = alvoQuiral[c], v = al.trio.map(function (n) { return sub(pos[n], pos[c]); });
        return Math.sign(det3(v[0], v[1], v[2])) === al.sinal;
      }) && cunhas.every(function (w) { return Math.sign(pos[w.o][2] - pos[w.c][2]) === w.lado; });
    };
    var atual = nota();
    for (var passe = 0; passe < 5 && atual > 1e-6; passe++) {
      var melhorou = false;
      eixos.forEach(function (e) {
        var k = norm(sub(pos[e.mov], pos[e.de])), c = pos[e.mov].slice();
        var melhor = { th: 0, s: atual };
        [2 * Math.PI / 3, 4 * Math.PI / 3].forEach(function (th) {
          girarEm(e.ids, c, k, th); var s2 = respeita() ? nota() : Infinity; girarEm(e.ids, c, k, -th);
          if (s2 < melhor.s - 1e-6) melhor = { th: th, s: s2 };
        });
        if (melhor.th) { girarEm(e.ids, c, k, melhor.th); atual = melhor.s; melhorou = true; }
      });
      if (!melhorou) break;
    }
    ajustarChoques(g, pos, el, viz, perto, todos, respeita);
  }

  /* ═══ AJUSTE FINAL — só quando ainda sobra choque ═══════════════════
     As rotações de conformação não alcançam todo caso: no anidrido, por
     exemplo, a cadeia principal fica no plano (para a estereoquímica das
     vistas planas continuar valendo), mas com 109,5° no lugar dos 120° do
     desenho ela fecha mais, e um O de carbonila chega a 2,1 Å de um
     carbono. Aqui os átomos que se chocam se afastam, com TODO
     comprimento de ligação e TODO ângulo travados no valor atual (que já
     é o ideal): o único jeito de se afastarem é torcendo as ligações — o
     que a molécula real faz. Distância mínima entre átomos a 3+ ligações:
     2,6 Å entre pesados, 2,1 com H, 1,8 entre H.
     Não roda se não houver choque: as geometrias que já saem perfeitas
     não são tocadas. */
  function ajustarChoques(g, pos, el, viz, perto, todos, respeita) {
    var MIN = function (a, b) { var ha = el[a] === 'H', hb = el[b] === 'H'; return ha && hb ? 1.8 : (ha || hb) ? 2.1 : 2.6; };
    var d = function (a, b) { var p = pos[a], q = pos[b]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
    var choques = function () {
      var out = [];
      for (var i = 0; i < todos.length; i++) for (var j = i + 1; j < todos.length; j++) {
        var a = todos[i], b = todos[j];
        if (b in perto[a]) continue;
        if (d(a, b) < MIN(a, b) - 0.02) out.push([a, b]);
      }
      return out;
    };
    if (!choques().length) return;
    // travas: cada ligação (1–2) e cada ângulo (1–3), no valor de agora
    var travas = [];
    todos.forEach(function (c) {
      var vs = viz[c];
      vs.forEach(function (x) { if (x > c) travas.push([c, x, d(c, x)]); });
      for (var i = 0; i < vs.length; i++) for (var j = i + 1; j < vs.length; j++) travas.push([vs[i], vs[j], d(vs[i], vs[j])]);
    });
    var mover = function (a, b, alvo, k) {
      var p = pos[a], q = pos[b], dd = d(a, b) || 1e-6, f = (dd - alvo) / dd * 0.5 * k;
      var dx = (q[0] - p[0]) * f, dy = (q[1] - p[1]) * f, dz = (q[2] - p[2]) * f;
      p[0] += dx; p[1] += dy; p[2] += dz; q[0] -= dx; q[1] -= dy; q[2] -= dz;
    };
    /* TRAVA DE DISTÂNCIA NÃO IMPEDE INVERSÃO: a imagem especular de um
       carbono tem as mesmas distâncias. Numa cadeira apertada, a repulsão
       empurrava um H através do plano dos vizinhos, e o centro passava para
       a configuração espelhada sem violar trava nenhuma. Guarda-se o último
       estado com toda configuração definida e todo lado de cunha certos, e
       é para ele que se volta se algo se inverter: aceita-se um choque
       residual; configuração errada, nunca. */
    var foto = function () { var f = {}; todos.forEach(function (id) { f[id] = pos[id].slice(); }); return f; };
    var restaurar = function (f) { todos.forEach(function (id) { pos[id][0] = f[id][0]; pos[id][1] = f[id][1]; pos[id][2] = f[id][2]; }); };
    var bom = foto();
    for (var it = 0; it < 160; it++) {
      var ch = choques();
      if (!ch.length) break;
      ch.forEach(function (c) { mover(c[0], c[1], MIN(c[0], c[1]), 0.5); });
      for (var rep = 0; rep < 4; rep++) travas.forEach(function (tv) { mover(tv[0], tv[1], tv[2], 1); });
      if (!respeita || respeita()) bom = foto(); else { restaurar(bom); break; }
    }
    /* fase final só de travas: a repulsão deixa um resto de deformação
       (um sp² terminava a 114,7°); como as torções não brigam com
       comprimentos e ângulos, eles voltam ao exato e o afastamento fica */
    for (var fim = 0; fim < 60; fim++) travas.forEach(function (tv) { mover(tv[0], tv[1], tv[2], 1); });
    if (respeita && !respeita()) restaurar(bom);
  }

  G3.LIMIAR_QUIRAL = 0.3;
  /* Volume com sinal que o DESENHO dá a um centro (papel + cunhas com ponta
     estreita nele), no mesmo cálculo da montagem. Devolve null se o centro
     não tem cunha definida pelo aluno ou tem menos de três vizinhos
     pesados. |v| abaixo de LIMIAR_QUIRAL = desenho ambíguo. O editor usa
     para avisar o aluno. */
  G3.quiralidadeDesenho = function (g, pos2d, c) {
    var vz = g.vizinhos(c).map(function (v) { return v.id; });
    if (vz.length < 3) return null;
    var vec = {}, definido = false;
    vz.forEach(function (n) {
      var l = g.ligacao(c, n), z = 0;
      if (l && l.ordem === 1 && l.estereo && l.estereo.de === c && l.estereo.tipo !== 'plano') { z = l.estereo.tipo === 'frente' ? -1 : 1; definido = true; }
      var dx = pos2d[n].x - pos2d[c].x, dy = -(pos2d[n].y - pos2d[c].y), L = Math.hypot(dx, dy) || 1;
      vec[n] = [dx / L, dy / L, z];
    });
    if (!definido) return null;
    var melhor = null;
    for (var i = 0; i < vz.length; i++) for (var j = i + 1; j < vz.length; j++) for (var k = j + 1; k < vz.length; k++) {
      var v = det3(vec[vz[i]], vec[vz[j]], vec[vz[k]]);
      if (!melhor || Math.abs(v) > Math.abs(melhor.v)) melhor = { v: v, trio: [vz[i], vz[j], vz[k]] };
    }
    return melhor;
  };

  /* ═══ TENSÃO ANGULAR ENTRE AS NUVENS ═════════════════════════════
     Com a chave DESLIGADA, todas as nuvens eletrônicas de um átomo têm o
     mesmo tamanho e os ângulos são os ideais da hibridização (109,5°,
     120°, 180°). LIGADA, as nuvens se empurram com forças diferentes —
     é a repulsão entre pares da camada de valência (VSEPR) — e os
     ângulos cedem para os valores medidos:
       · par isolado ocupa mais espaço que par ligante: H–N–H 106,7°
         (amônia), H–O–H 104,5° (água), C–S–C 99,0° (sulfeto de dimetila);
       · ligação dupla ocupa mais espaço que simples: H–C–H 116,5° no
         formaldeído, 117,4° no eteno;
       · grupos volumosos também se empurram: C–O–C 111,7° no éter
         dimetílico — acima do tetraédrico, apesar dos dois pares;
       · em anel pequeno os núcleos ficam presos a 60° ou 90°, e as
         ligações de fora do anel se abrem: H–C–H 114,8° no ciclopropano.
     Valores experimentais típicos das moléculas de referência (NIST
     CCCBDB); em outras moléculas o valor real difere de 1 a 2°. */
  var ELETRONS_V = { C: 4, Si: 4, N: 5, P: 5, O: 6, S: 6, F: 7, Cl: 7, Br: 7, I: 7 };
  var FLEX = {   // sp³ por número de pares isolados: pares H–H, H–X e X–X (X = átomo pesado)
    C: { HH: 107.8, HX: 109.5, XX: 112.0 },
    N: { HH: 106.7, HX: 109.0, XX: 111.0 },
    O: { HH: 104.5, HX: 108.5, XX: 111.7 },
    P: { HH: 93.3, HX: 97.5, XX: 98.6 },
    S: { HH: 92.1, HX: 96.5, XX: 99.0 }
  };
  G3.paresIsoladosDe = function (g, id) {
    var at = g.atomos[id], v = ELETRONS_V[at.el];
    if (v === undefined) return 0;
    return Math.max(0, Math.floor((v - g.ordemTotal(id) - g.hidrogenios(id) - (at.carga || 0)) / 2));
  };
  /* Ângulo-alvo (graus) entre as ligações c–x e c–y com a chave ligada;
     null = fica como está (o ideal). h: tipoDe(n) 'H'|'X', ordemDe(c, n)
     (o H implícito conta como simples), vizDe(c) com os H, aneisDe,
     hib, angulo(c, a, b) atual. */
  function anguloFlexivel(g, c, x, y, h) {
    var el = g.atomos[c].el, aneisC = h.aneisDe[c] || [];
    if (aneisC.length) {
      var anelDe = function (n) { return aneisC.filter(function (r) { return r.indexOf(n) >= 0; })[0]; };
      var rx = anelDe(x), ry = anelDe(y);
      if (rx && ry) return null;                                   // interno: preso pelo anel
      var menor = Math.min.apply(null, aneisC.map(function (r) { return r.length; }));
      var fora = h.vizDe(c).filter(function (n) { return !anelDe(n); });
      if (menor > 4 || h.hib !== 'sp3' || fora.length !== 2) return null;
      var phi = menor === 3 ? 114.8 : 110.0;                       // as duas de fora se abrem
      if (!rx && !ry) return phi;
      /* de fora × do anel: abrir as de fora obriga a fechar estas. Na
         disposição simétrica, cos ψ = −cos(φ/2)·cos(α/2), com α o ângulo
         interno: φ 114,8° e α 60° dão ψ 117,8° — o valor medido. */
      var dentro = h.vizDe(c).filter(function (n) { return anelDe(n); });
      var alfa = h.angulo(c, dentro[0], dentro[1]) * Math.PI / 180;
      return Math.acos(-Math.cos(phi / 2 * Math.PI / 180) * Math.cos(alfa / 2)) * 180 / Math.PI;
    }
    if (h.hib === 'sp3') {
      var t = FLEX[el]; if (!t) return null;
      var tx = h.tipoDe(x), ty = h.tipoDe(y), k = tx === 'H' && ty === 'H' ? 'HH' : (tx === 'H' || ty === 'H') ? 'HX' : 'XX';
      return t[k];
    }
    if (h.hib === 'sp2') {
      var vz = h.vizDe(c);
      if (vz.length !== 3) return null;
      var dupla = vz.filter(function (n) { return h.ordemDe(c, n) === 2; })[0];
      if (!dupla) return null;
      var ss = g.atomos[dupla] && g.atomos[dupla].el !== 'C' ? 116.5 : 117.4;   // entre as duas simples
      if (h.ordemDe(c, x) === 1 && h.ordemDe(c, y) === 1) return ss;
      return (360 - ss) / 2;                                               // simples–dupla: o resto até 360°
    }
    return null;
  }
  /* Relaxa os ângulos até os alvos, com os comprimentos travados. Protegido
     como o ajuste de choques: se inverter uma configuração definida ou
     trocar o lado de uma cunha, desfaz. */
  function flexibilizar(g, P, atomosH, aneis, alvoQuiral) {
    var pos = {}, el = {}, viz = {};
    Object.keys(P).forEach(function (id) { pos[id] = P[id]; el[id] = g.atomos[id].el; viz[id] = g.vizinhos(id).map(function (v) { return v.id; }); });
    atomosH.forEach(function (h) { if (!h._p) return; pos[h.id] = h._p; el[h.id] = 'H'; viz[h.id] = [h.pai]; viz[h.pai].push(h.id); });
    var todos = Object.keys(pos), aneisDe = {};
    aneis.forEach(function (r) { r.forEach(function (id) { (aneisDe[id] = aneisDe[id] || []).push(r); }); });
    var tipoDe = function (n) { return el[n] === 'H' ? 'H' : 'X'; };
    var ordemDe = function (c, n) { if (el[n] === 'H') return 1; var l = g.ligacao(c, n); return l ? l.ordem : 1; };
    var angAtual = function (c, a, b) { return G3.angulo(pos[a], pos[c], pos[b]); };
    var d = function (a, b) { var p = pos[a], q = pos[b]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
    var travas = [];
    todos.forEach(function (c) {
      var vs = viz[c];
      vs.forEach(function (x) { if (x > c) travas.push([c, x, d(c, x), 1]); });
      if (el[c] === 'H') return;
      var ajuda = { tipoDe: tipoDe, ordemDe: ordemDe, vizDe: function (x) { return viz[x]; }, aneisDe: aneisDe, hib: Q3.Geometria.hibridizacao(g, c), angulo: angAtual };
      for (var i = 0; i < vs.length; i++) for (var j = i + 1; j < vs.length; j++) {
        var alvo = anguloFlexivel(g, c, vs[i], vs[j], ajuda);
        var li = d(c, vs[i]), lj = d(c, vs[j]);
        var dd = alvo === null ? d(vs[i], vs[j]) : Math.sqrt(li * li + lj * lj - 2 * li * lj * Math.cos(alvo * Math.PI / 180));
        travas.push([vs[i], vs[j], dd, alvo === null ? 0.35 : 0.5]);
      }
    });
    var foto = {}; todos.forEach(function (id) { foto[id] = pos[id].slice(); });
    var mover = function (a, b, alvo, k) {
      var p = pos[a], q = pos[b], dd = d(a, b) || 1e-6, f = (dd - alvo) / dd * 0.5 * k;
      var dx = (q[0] - p[0]) * f, dy = (q[1] - p[1]) * f, dz = (q[2] - p[2]) * f;
      p[0] += dx; p[1] += dy; p[2] += dz; q[0] -= dx; q[1] -= dy; q[2] -= dz;
    };
    for (var it = 0; it < 300; it++) travas.forEach(function (tv) { mover(tv[0], tv[1], tv[2], tv[3]); });
    for (var fim = 0; fim < 40; fim++) travas.forEach(function (tv) { if (tv[3] === 1) mover(tv[0], tv[1], tv[2], 1); });
    // proteção: configuração definida e lado das cunhas intactos, senão desfaz
    var ok = Object.keys(alvoQuiral || {}).every(function (c) {
      var al = alvoQuiral[c], v = al.trio.map(function (n) { return sub(pos[n], pos[c]); });
      return Math.sign(det3(v[0], v[1], v[2])) === al.sinal;
    }) && g.ligacoes.every(function (l) {
      if (!l.estereo || l.estereo.tipo === 'plano' || l.ordem !== 1) return true;
      var c = l.estereo.de, o = c === l.a ? l.b : l.a;
      return Math.sign(pos[o][2] - pos[c][2]) === Math.sign(foto[o][2] - foto[c][2]);
    });
    if (!ok) todos.forEach(function (id) { pos[id][0] = foto[id][0]; pos[id][1] = foto[id][1]; pos[id][2] = foto[id][2]; });
  }

  /* DIREÇÕES DOS PARES ISOLADOS de um átomo, na geometria pronta — para
     desenhar as nuvens não ligantes. sp³: um par = oposto à soma das
     ligações; dois pares = no plano perpendicular ao das duas ligações,
     abrindo o que as ligações fecham (ângulo par–par = 219° − ângulo da
     ligação: 109,5° no ideal, 114,5° na água); três pares = o leque em
     volta da única ligação. sp² (O de carbonila): no plano da molécula,
     a 120° da ligação. sp (N de nitrila): oposto à ligação. */
  G3.paresIsolados = function (g, mol, id) {
    var L = G3.paresIsoladosDe(g, id);
    if (!L) return [];
    var P = {}; mol.atomos.forEach(function (a) { P[a.id] = [a.x, a.y, a.z]; });
    var viz = mol.ligacoes.filter(function (l) { return l.a === id || l.b === id; }).map(function (l) { return l.a === id ? l.b : l.a; });
    var u = viz.map(function (n) { return norm(sub(P[n], P[id])); });
    if (!u.length) return [];
    var hib = Q3.Geometria.hibridizacao(g, id), soma = u.reduce(function (s2, x) { return add(s2, x); }, [0, 0, 0]);
    if (hib === 'sp' || (L === 1 && u.length >= 2)) return [norm(mul(soma, -1))];
    if (hib === 'sp2' && u.length === 1 && L === 2) {
      // O de carbonila: no plano da molécula (o do carbono vizinho), a 120° da C=O
      var c = viz[0], outros = mol.ligacoes.filter(function (l) { return (l.a === c || l.b === c) && l.a !== id && l.b !== id; });
      var w = outros.length ? sub(P[outros[0].a === c ? outros[0].b : outros[0].a], P[c]) : perpDe(u[0]);
      w = norm(sub(w, mul(u[0], dot(w, u[0]))));
      var c1 = Math.cos(2 * Math.PI / 3), s1 = Math.sin(2 * Math.PI / 3);
      return [norm(add(mul(u[0], c1), mul(w, s1))), norm(add(mul(u[0], c1), mul(w, -s1)))];
    }
    if (u.length === 2 && L === 2) {
      var th = Math.acos(Math.max(-1, Math.min(1, dot(u[0], u[1])))) * 180 / Math.PI;
      var fi = (219 - th) * Math.PI / 180, b = norm(soma), n = norm(cross(u[0], u[1]));
      return [norm(add(mul(b, -Math.cos(fi / 2)), mul(n, Math.sin(fi / 2)))), norm(add(mul(b, -Math.cos(fi / 2)), mul(n, -Math.sin(fi / 2))))];
    }
    if (u.length === 1 && L === 3) return direcoesLivres('sp3', u, 3, null, 1);
    return direcoesLivres(hib, u, L, null, 1).slice(0, L);
  };

  /* ═══ AS NUVENS DE UM ÁTOMO ══════════════════════════════════════
     Cada domínio eletrônico em volta do átomo: uma nuvem por ligação
     (com tantos pares quanto a ordem) e uma por par isolado. Serve para
     DESENHAR a tensão angular entre as nuvens:
       · desligada, todas do mesmo tamanho, cada nuvem de ligação no eixo
         da ligação;
       · ligada, par isolado e ligação múltipla ficam maiores (ocupam mais
         espaço), e — em anel de 3 ou 4 — as nuvens das ligações do anel
         NÃO acompanham o ângulo entre os núcleos: abrem até o ângulo que
         conseguem manter (≈ 104° no ciclopropano, ≈ 98° no ciclobutano;
         modelo de Coulson–Moffitt). A ligação fica CURVA — o "orbital
         banana". É a tensão angular de Baeyer vista pelas nuvens.
     Devolve [{ tipo: 'ligacao'|'par', dir, pares, fator, vizinho, curva }]
     e o ângulo ideal da hibridização do átomo. */
  var ABERTURA_ANEL = { 3: 104, 4: 98 };
  G3.nuvens = function (g, mol, id, tensao) {
    var P = {}; mol.atomos.forEach(function (a) { P[a.id] = [a.x, a.y, a.z]; });
    if (!P[id]) return { lista: [], ideal: 109.47 };
    var hib = Q3.Geometria.hibridizacao(g, id), lista = [];
    var viz = mol.ligacoes.filter(function (l) { return l.a === id || l.b === id; }).map(function (l) { return l.a === id ? l.b : l.a; });
    var aneis = Q3.Geometria.aneisMinimos(g).filter(function (r) { return r.indexOf(id) >= 0; });
    viz.forEach(function (n) {
      var l = g.atomos[n] ? g.ligacao(id, n) : null, ordem = l ? l.ordem : 1;
      lista.push({ tipo: 'ligacao', dir: norm(sub(P[n], P[id])), pares: ordem, fator: tensao ? (ordem === 1 ? 1 : ordem === 2 ? 1.25 : 1.35) : 1, vizinho: n, curva: 0 });
    });
    if (tensao && aneis.length) {
      var r = aneis.slice().sort(function (a, b) { return a.length - b.length; })[0], abre = ABERTURA_ANEL[r.length];
      if (abre) {
        var k = r.indexOf(id), n1 = r[(k + r.length - 1) % r.length], n2 = r[(k + 1) % r.length];
        var c1 = lista.filter(function (x) { return x.vizinho === n1; })[0], c2 = lista.filter(function (x) { return x.vizinho === n2; })[0];
        if (c1 && c2) {
          var alfa = Math.acos(Math.max(-1, Math.min(1, dot(c1.dir, c2.dir)))) * 180 / Math.PI;
          var b = norm(add(c1.dir, c2.dir)), meio = abre / 2 * Math.PI / 180;
          [c1, c2].forEach(function (c) {
            var p = norm(sub(c.dir, mul(b, dot(c.dir, b))));
            c.dir = norm(add(mul(b, Math.cos(meio)), mul(p, Math.sin(meio))));
            c.curva = (abre - alfa) / 2;          // quanto a nuvem se desvia do eixo da ligação
          });
        }
      }
    }
    G3.paresIsolados(g, mol, id).forEach(function (d) { lista.push({ tipo: 'par', dir: d, pares: 1, fator: tensao ? 1.35 : 1, vizinho: null, curva: 0 }); });
    return { lista: lista, ideal: hib === 'sp' ? 180 : hib === 'sp2' ? 120 : 109.47 };
  };

  G3.embutir = function (g, pos2d, opcoes) {
    var ids = Object.keys(g.atomos).sort(function (a, b) { return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10); });
    var P = {}, ligs = [], atomos = [];
    if (!ids.length) return { atomos: [], ligacoes: [] };
    var p2 = function (id) { var p = pos2d && pos2d[id] ? pos2d[id] : { x: 0, y: 0 }; return [p.x * CC, -p.y * CC, 0]; };
    var hib = {}; ids.forEach(function (id) { hib[id] = Q3.Geometria.hibridizacao(g, id); });
    var aneis = Q3.Geometria.aneisMinimos(g);
    var anelDe = {}; aneis.forEach(function (r, i) { r.forEach(function (id) { (anelDe[id] = anelDe[id] || []).push(i); }); });

    /* 1. anéis: posições a partir do desenho plano (mesma orientação), no
       tamanho real; o de 6 saturado e isolado vira cadeira */
    /* ═══ QUIRALIDADE DEFINIDA NO CAMPO EDITÁVEL ═════════════════════
       Para cada carbono com cunha definida pelo aluno (ponta estreita
       nele), o alvo é o SINAL DO VOLUME formado pelos vizinhos pesados:
       posições no papel (y para cima) e o z da cunha — frente −1, trás +1,
       plano 0 —, como os programas de química leem uma cunha. Impor o
       sinal de z não bastava: num fragmento inclinado (um anel ligado por
       uma cunha fica inclinado no espaço), o z do mundo já não é a frente
       daquele carbono, e o 3D saía com a configuração oposta à desenhada
       (medido: 254 de 395 centros). A quiralidade não muda com rotação,
       então vale em qualquer inclinação — e em qualquer giro da câmera. */
    var alvoQuiral = {};
    ids.forEach(function (c) {
      var vz = g.vizinhos(c).map(function (v) { return v.id; });
      if (vz.length < 3) return;
      var vec = {}, definido = false;
      vz.forEach(function (n) {
        var l = g.ligacao(c, n), z = 0;
        if (l && l.ordem === 1 && l.estereo && l.estereo.de === c && l.estereo.tipo !== 'plano') { z = l.estereo.tipo === 'frente' ? -1 : 1; definido = true; }
        var d = sub(p2(n), p2(c)), L = Math.hypot(d[0], d[1]) || 1;
        vec[n] = [d[0] / L, d[1] / L, z];
      });
      if (!definido) return;
      var melhor = null;
      for (var i = 0; i < vz.length; i++) for (var j = i + 1; j < vz.length; j++) for (var k = j + 1; k < vz.length; k++) {
        var v = det3(vec[vz[i]], vec[vz[j]], vec[vz[k]]);
        if (!melhor || Math.abs(v) > Math.abs(melhor.v)) melhor = { v: v, trio: [vz[i], vz[j], vz[k]] };
      }
      /* Volume quase zero = desenho AMBÍGUO: não define configuração (por
         exemplo, frente numa ligação da cadeia e trás na outra, com o ramo
         no plano: dá exatamente zero). Não vira alvo — o sinal seria ruído
         de arredondamento. Um desenho limpo dá cerca de 0,87. O editor
         avisa o aluno quando uma cunha deixa o desenho assim. */
      if (melhor && Math.abs(melhor.v) >= G3.LIMIAR_QUIRAL) alvoQuiral[c] = { trio: melhor.trio, sinal: Math.sign(melhor.v) };
    });

    var anelPosto = {};
    /* ═══ ANÉIS — montados no próprio referencial e ENCAIXADOS no que já
       está posto ═════════════════════════════════════════════════════
       A primeira versão punha o anel onde ele estava no DESENHO PLANO, em
       coordenadas absolutas. Só que a cadeia, no 3D, não fica onde estava
       no plano: 109,5° em vez de 120° e ramos fora do plano vão acumulando
       diferença. O anel ia para o lugar "do desenho" e o átomo que o
       segura ficava em outro — a ligação entre eles esticava (medido: uma
       C–C de 18,52 Å num anidrido com dois ciclobutanos).
       Agora:
         1. o anel é montado no PRÓPRIO referencial, com o centro na origem:
            cadeira (6 saturado, só de carbono, isolado) ou polígono plano
            INSCRITO NUM CÍRCULO com os lados certos — C–S 1,82, C–C 1,54,
            aromático 1,39. (O polígono regular dava o mesmo lado a todos, e
            num anel com enxofre as C–S saíam curtas e as C–C compridas.)
         2. e é encaixado por três correspondências:
            · um átomo já posto (a entrada): ele fica onde está; o centro do
              anel fica na continuação da ligação que chega nele; o plano do
              anel, o mais perto possível do plano do desenho;
            · dois já postos (anel fundido, ou um anel alcançado por dois
              lados): os dois ficam onde estão, e o centro vai para o lado
              de FORA, longe do que já existe;
            · três ou mais (anel em ponte): os três mais afastados.
       Devolve os átomos que colocou agora — quem chama os põe na fila. */
    var porAnel = function (i) {
      if (anelPosto[i]) return [];
      anelPosto[i] = true;
      var r = aneis[i], n = r.length, novos = r.filter(function (id) { return !P[id]; });
      if (!novos.length) return [];
      var isolado = r.every(function (id) { return anelDe[id].length === 1; });
      var saturado = r.every(function (id, k) { var l = g.ligacao(id, r[(k + 1) % n]); return l && l.ordem === 1 && hib[id] === 'sp3'; });
      var soCarbono = r.every(function (id) { return g.atomos[id].el === 'C'; });
      var aromatico = n === 6 && [0, 1].some(function (s) {
        return r.every(function (id, k) { var l = g.ligacao(id, r[(k + 1) % 6]); return l && l.ordem === ((k + s) % 2 ? 1 : 2); });
      });
      // 1. o anel no próprio referencial
      var L = {};
      if (n === 6 && isolado && saturado && soCarbono) {
        L = cadeira(r, [0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
      } else {
        var lados = r.map(function (id, k) {
          var o = r[(k + 1) % n], l = g.ligacao(id, o);
          return aromatico ? 1.39 : comprimento(g, id, o, l ? l.ordem : 1);
        });
        var Rc = raioInscrito(lados), a0 = 0;
        r.forEach(function (id, k) { L[id] = [Rc * Math.cos(a0), Rc * Math.sin(a0), 0]; a0 += 2 * Math.asin(Math.min(1, lados[k] / (2 * Rc))); });
      }
      /* O anel acima foi montado no sentido ANTI-HORÁRIO. Se no papel ele
         está desenhado no sentido horário, a montagem tem de ser espelhada
         ANTES do encaixe — o encaixe é uma rotação, e rotação não desfaz
         espelhamento. Sem isto o anel saía como a imagem especular do
         desenho: invisível num anel sem centro estereogênico, mas um
         carbono do anel com cunha definida ficava com a configuração
         invertida (o 3D mostrava o outro enantiômero). O sentido no papel
         é o sinal da área do polígono, com y para cima. */
      var areaPapel = 0;
      r.forEach(function (id, k) { var p = p2(id), q2 = p2(r[(k + 1) % n]); areaPapel += p[0] * q2[1] - q2[0] * p[1]; });
      if (areaPapel < 0) Object.keys(L).forEach(function (id) { L[id] = [L[id][0], -L[id][1], L[id][2]]; });
      var cadeiraAqui = n === 6 && isolado && saturado && soCarbono;
      /* Direção em que um substituinte sai de um átomo do anel, no
         referencial local. No sp² (anel aromático), radial. No sp³, uma das
         duas saídas tetraédricas — na CADEIRA, a equatorial:
         a direção radial dá 121,5° nos ângulos do átomo de entrada, e o
         certo é o tetraedro (as duas direções livres são −b·cos β ± n·sen β;
         a equatorial é a mais deitada no plano médio). */
      var saida = function (id) {
        var k = r.indexOf(id), v1 = norm(sub(L[r[(k + n - 1) % n]], L[id])), v2 = norm(sub(L[r[(k + 1) % n]], L[id]));
        var b = norm(add(v1, v2));
        /* Radial (no plano do anel) só para o átomo sp² — o do benzeno. O
           sp³ de anel tem duas saídas, uma de cada lado do plano, como na
           cadeira: com a radial, o substituinte de um ciclopropano saía a
           150° do anel (o certo é ~120°), e o H desse carbono ficava sem
           lugar e saía perpendicular a tudo (90°). */
        if (hib[id] !== 'sp3') return mul(b, -1);
        var nn = norm(cross(v1, v2)), beta = TETRA / 2;
        var d1 = norm(add(mul(b, -Math.cos(beta)), mul(nn, Math.sin(beta)))), d2 = norm(add(mul(b, -Math.cos(beta)), mul(nn, -Math.sin(beta))));
        // na cadeira, a equatorial (a mais deitada no plano médio); no anel
        // plano as duas são simétricas, e qualquer uma serve
        return !cadeiraAqui || Math.abs(d1[2]) <= Math.abs(d2[2]) ? d1 : d2;
      };
      // 2. o encaixe
      var fix = r.filter(function (id) { return P[id]; }), mapa;
      if (!fix.length) {
        // primeiro anel da molécula: no plano do desenho, com a orientação dele
        var c2 = [0, 0, 0]; r.forEach(function (id) { c2 = add(c2, p2(id)); }); c2 = mul(c2, 1 / n);
        var dir0 = sub(p2(r[0]), c2); dir0 = Math.hypot(dir0[0], dir0[1], dir0[2]) > 1e-6 ? norm(dir0) : [1, 0, 0];
        // o plano MÉDIO do anel fica paralelo ao desenho (na cadeira, o
        // átomo 0 está 0,26 Å fora dele: alinhar por ele inclinava tudo ~10°)
        var proj0 = norm([L[r[0]][0], L[r[0]][1], 0]);
        mapa = alinhar([[0, 0, 0], proj0, [0, 0, 1]], [c2, add(c2, dir0), add(c2, [0, 0, 1])]);
      } else if (fix.length === 1) {
        var e = fix[0], ancoras = g.vizinhos(e).filter(function (v) { return P[v.id] && r.indexOf(v.id) < 0; });
        var dc = Math.hypot(L[e][0], L[e][1], L[e][2]), u, t;
        if (ancoras.length >= 2) {
          /* ESPIRO: o átomo de entrada já tem dois vizinhos postos (é de
             outro anel). O anel novo sai pela bissetriz OPOSTA a eles e fica
             no plano das duas direções tetraédricas livres — perpendicular
             ao primeiro anel. Com uma âncora só, ele saía no mesmo plano e
             os dois anéis se atravessavam (C···C a 2,02 Å). */
          var v1 = norm(sub(P[ancoras[0].id], P[e])), v2 = norm(sub(P[ancoras[1].id], P[e]));
          u = mul(norm(add(v1, v2)), -1);
          t = cross(u, norm(cross(v1, v2)));
        } else {
          u = ancoras.length ? norm(sub(P[e], P[ancoras[0].id])) : [1, 0, 0];
          // normal do anel: perpendicular à ligação de entrada, o mais perto possível do eixo z do desenho
          t = sub([0, 0, 1], mul(u, u[2]));
          if (Math.hypot(t[0], t[1], t[2]) < 1e-3) t = sub([0, 1, 0], mul(u, u[1]));
        }
        if (ancoras.length >= 2) {
          var qc = add(P[e], mul(u, dc));
          mapa = alinhar([L[e], [0, 0, 0], [0, 0, 1]], [P[e], qc, add(qc, norm(t))]);
        } else {
          /* O ENCAIXE se orienta por três referências: o átomo de entrada,
             a saída e uma terceira que fixa o giro em torno da ligação. A
             terceira era sempre a normal do anel — só que a saída AXIAL da
             cadeira é paralela à normal: o referencial degenerava e o anel
             colapsava (dois átomos no mesmo ponto). Agora a terceira é a
             normal (casada com o z do desenho) ou a direção do átomo de
             entrada ao centro do anel (casada com a do desenho), a que
             estiver mais longe de paralela à saída. */
          var c2d = [0, 0, 0]; r.forEach(function (id) { c2d = add(c2d, p2(id)); }); c2d = mul(c2d, 1 / n);
          var encaixe = function (sx) {
            var zL = [0, 0, 1], cL = norm(mul(L[e], -1));
            var pz = Math.hypot.apply(null, cross(sx, zL)), pc = Math.hypot.apply(null, cross(sx, cL));
            if (pz >= pc) return alinhar([L[e], add(L[e], sx), add(L[e], zL)], [P[e], sub(P[e], u), add(P[e], norm(t))]);
            var w2 = sub(c2d, p2(e)), tb = sub(w2, mul(u, dot(u, w2)));
            if (Math.hypot(tb[0], tb[1], tb[2]) < 1e-3) tb = perpDe(u);
            return alinhar([L[e], add(L[e], sx), add(L[e], cL)], [P[e], sub(P[e], u), add(P[e], norm(tb))]);
          };
          /* Um sp³ de anel tem DUAS saídas, e a escolha decide a quiralidade
             desse carbono: com configuração definida no campo editável —
             cunha na ligação de entrada ou em qualquer outra dele —,
             experimentam-se as duas e fica a que reproduz o desenho. Depois
             os vizinhos dele já estão fixos, e não sobraria o que trocar. */
          var sd = saida(e), alvoE = alvoQuiral[e];
          if (alvoE && hib[e] === 'sp3') {
            var k0 = r.indexOf(e), rA = r[(k0 + n - 1) % n], rB = r[(k0 + 1) % n];
            var w1 = norm(sub(L[rA], L[e])), w2b = norm(sub(L[rB], L[e]));
            var bb = norm(add(w1, w2b)), nn2 = norm(cross(w1, w2b)), bt = TETRA / 2;
            var s1 = norm(add(mul(bb, -Math.cos(bt)), mul(nn2, Math.sin(bt)))), s2 = norm(add(mul(bb, -Math.cos(bt)), mul(nn2, -Math.sin(bt))));
            var prova = function (sx, sy) {
              var mp = encaixe(sx), dirs3 = {};
              dirs3[ancoras[0].id] = norm(sub(P[ancoras[0].id], P[e]));
              dirs3[rA] = norm(sub(mp(L[rA]), P[e])); dirs3[rB] = norm(sub(mp(L[rB]), P[e]));
              var livre = norm(sub(mp(add(L[e], sy)), P[e]));        // o lugar que sobra, para o outro substituinte
              var v = alvoE.trio.map(function (x) { return dirs3[x] || livre; });
              return Math.sign(det3(v[0], v[1], v[2]));
            };
            sd = prova(s1, s2) === alvoE.sinal ? s1 : s2;
          }
          mapa = encaixe(sd);
        }
      } else {
        // dois ou mais postos: os dois mais afastados + o centro do lado de fora
        var pa = fix[0], pb = fix[1], dmax = -1;
        fix.forEach(function (x) { fix.forEach(function (y) {
          if (x < y) { var dd = Math.hypot(P[x][0] - P[y][0], P[x][1] - P[y][1], P[x][2] - P[y][2]); if (dd > dmax) { dmax = dd; pa = x; pb = y; } }
        }); });
        var mid = mul(add(P[pa], P[pb]), 0.5), aresta = norm(sub(P[pb], P[pa]));
        // "dentro" = onde já há estrutura: os vizinhos já postos de pa e pb fora deste anel
        var dentro = [0, 0, 0], nd = 0;
        [pa, pb].forEach(function (x) { g.vizinhos(x).forEach(function (v) { if (P[v.id] && r.indexOf(v.id) < 0) { dentro = add(dentro, P[v.id]); nd++; } }); });
        var w = nd ? sub(mid, mul(dentro, 1 / nd)) : [0, 0, 1];
        w = sub(w, mul(aresta, dot(w, aresta)));
        if (Math.hypot(w[0], w[1], w[2]) < 1e-3) w = perpDe(aresta);
        w = norm(w);
        var Lmid = mul(add(L[pa], L[pb]), 0.5), dcm = Math.hypot(Lmid[0], Lmid[1], Lmid[2]);
        mapa = alinhar([L[pa], L[pb], [0, 0, 0]], [P[pa], P[pb], add(mid, mul(w, dcm))]);
      }
      novos.forEach(function (id) { P[id] = mapa(L[id]); });
      return novos;
    };

    // 2. raiz
    var raizId = ids[0];
    if (anelDe[raizId]) porAnel(anelDe[raizId][0]); else P[raizId] = [0, 0, 0];

    // 3. em largura: cada átomo coloca os filhos pesados e os H que carrega
    var fila = [raizId], visto = {}, nH = 0;
    var jaPostoPorAnel = function () {
      Object.keys(P).forEach(function (id) { (anelDe[id] || []).forEach(porAnel); });
    };
    jaPostoPorAnel();
    ids.forEach(function (id) { if (P[id] && fila.indexOf(id) < 0) fila.push(id); });
    while (fila.length) {
      var a = fila.shift();
      if (visto[a]) continue; visto[a] = true;
      (anelDe[a] || []).forEach(function (i) { porAnel(i).forEach(function (id) { fila.push(id); }); });
      var viz = g.vizinhos(a);
      var postos = viz.filter(function (v) { return P[v.id]; });
      var filhos = viz.filter(function (v) { return !P[v.id]; })
        .sort(function (x, y) { return parseInt(x.id.slice(1), 10) - parseInt(y.id.slice(1), 10); });
      var hs = g.hidrogenios(a);
      var u = postos.map(function (v) { return norm(sub(P[v.id], P[a])); });
      // referência: a direção do 1º filho no desenho plano
      var ref = filhos.length ? norm(sub(p2(filhos[0].id), p2(a))) : null;
      // antiperiplanar: com um vizinho posto que tem outro vizinho posto,
      // o 1º filho fica em anti ao "avô" (zigue-zague plano)
      if (postos.length === 1 && filhos.length) {
        var pai = postos[0].id;
        var avo = g.vizinhos(pai).filter(function (v) { return v.id !== a && P[v.id]; })[0];
        if (avo && hib[a] !== 'sp') ref = norm(sub(P[pai], P[avo.id]));
      }
      var lado = 1;
      if (u.length >= 3) {
        var n0 = norm(cross(u[0], u[1])), folga = function (sg) {
          var q = add(P[a], mul(n0, sg * 1.09)), m = Infinity;
          Object.keys(P).forEach(function (id) { if (id !== a) m = Math.min(m, Math.hypot(P[id][0] - q[0], P[id][1] - q[1], P[id][2] - q[2])); });
          atomos.forEach(function (h) { if (h._p) m = Math.min(m, Math.hypot(h._p[0] - q[0], h._p[1] - q[1], h._p[2] - q[2])); });
          return m;
        };
        lado = folga(1) >= folga(-1) ? 1 : -1;
      }
      var dirsBase = direcoesLivres(hib[a], u, filhos.length + hs, ref, lado);
      /* espaço livre em volta de um ponto, contra tudo que já foi posto */
      var folgaEm = function (q) {
        var m = Infinity;
        Object.keys(P).forEach(function (id) { if (id !== a) m = Math.min(m, Math.hypot(P[id][0] - q[0], P[id][1] - q[1], P[id][2] - q[2])); });
        atomos.forEach(function (h) { if (h._p) m = Math.min(m, Math.hypot(h._p[0] - q[0], h._p[1] - q[1], h._p[2] - q[2])); });
        return m;
      };
      /* Filhos com cunha definida escolhem PRIMEIRO: senão um filho sem
         cunha pode ocupar o único lugar da frente antes de o marcado
         "frente" ser atendido. O primeiro da lista original continua
         sendo o que segue a referência do desenho. */
      var comCunha = function (f) { var l = g.ligacao(a, f.id); return !!(l && l.ordem === 1 && l.estereo && l.estereo.tipo !== 'plano'); };
      filhos = filhos.slice(0, 1).concat(filhos.slice(1).filter(comCunha), filhos.slice(1).filter(function (f) { return !comCunha(f); }));
      if (filhos.length > 1 && !comCunha(filhos[0]) && ref && filhos.slice(1).some(comCunha)) {
        filhos = filhos.filter(comCunha).concat(filhos.filter(function (f) { return !comCunha(f); }));
      }
      /* lado exigido para o filho: −1 à frente, +1 atrás, 0 livre. Ponta
         estreita no pai: o filho vai para o lado escolhido; ponta estreita
         no filho: é o PAI que fica desse lado, e o filho vai para o oposto. */
      var ladoExigido = function (f) {
        var lg = g.ligacao(a, f.id), est = lg && lg.ordem === 1 ? lg.estereo : null;
        if (!est || est.tipo === 'plano') return 0;
        return (est.tipo === 'frente' ? -1 : 1) * (est.de === a ? 1 : -1);
      };
      /* Atribui os filhos a um conjunto de direções: cada um fica com a mais
         parecida com a do desenho, entre as do lado exigido. Devolve também
         quantas exigências de lado foram atendidas. */
      var atribuir = function (conj) {
        var livres = conj.slice(), escolha = [], atendidas = 0, parecido = 0;
        filhos.forEach(function (f, i) {
          var w = norm(sub(p2(f.id), p2(a)));
          /* A direção mais parecida com a do desenho plano. EMPATE — as duas
             direções fora do plano de um carbono terciário têm a mesma
             projeção no desenho — se decide pelo espaço livre: sem isso o
             empate caía sempre no mesmo lado, e dois ramos em C2 e C4
             ficavam do mesmo lado da cadeia, encarados (a interação
             syn-pentano; H a 0,79 Å). */
          var notas = livres.map(function (d) { return i === 0 && ref ? dot(d, ref) : dot(d, w); });
          /* ESTEREOQUÍMICA ESCOLHIDA: a ligação a–f pode ter vindo marcada
             pelo aluno (frente, trás, no plano). Frente é z negativo — a
             câmera padrão olha de z < 0 —, com o sinal invertido quando a
             ponta estreita (o centro) é o filho e não o pai. A escolha FILTRA
             as direções livres; se nenhuma serve (centro sp²), fica o normal. */
          var permitidas = livres.map(function (_, j) { return j; });
          var lg = g.ligacao(a, f.id), est = lg && lg.ordem === 1 ? lg.estereo : null;
          if (est && est.tipo === 'plano') {
            var zmin = Math.min.apply(null, permitidas.map(function (j) { return Math.abs(livres[j][2]); }));
            permitidas = permitidas.filter(function (j) { return Math.abs(livres[j][2]) <= zmin + 0.05; });
          } else if (est) {
            var querZ = (est.tipo === 'frente' ? -1 : 1) * (est.de === a ? 1 : -1);
            var boas = permitidas.filter(function (j) { return livres[j][2] * querZ > 0.05; });
            if (boas.length) permitidas = boas;
          }
          var topo = Math.max.apply(null, permitidas.map(function (j) { return notas[j]; }).concat(notas.length ? [] : [0])), melhor = permitidas[0] || 0, folgaMelhor = -Infinity;
          livres.forEach(function (d, j) {
            if (permitidas.indexOf(j) < 0) return;
            if (notas[j] < topo - 0.02) return;
            var fo = folgaEm(add(P[a], mul(d, comprimento(g, a, f.id, f.ordem))));
            if (fo > folgaMelhor + 1e-9) { folgaMelhor = fo; melhor = j; }
          });
          var d = livres.splice(melhor, 1)[0] || perpDe(u[0] || [1, 0, 0]);
          escolha.push({ id: f.id, d: d, ordem: f.ordem, w: w });
          var lx = ladoExigido(f); if (lx && d[2] * lx > 0.05) atendidas++;
          parecido += dot(d, w);
        });
        return { escolha: escolha, sobra: livres, atendidas: atendidas, parecido: parecido };
      };
      /* O LEQUE PODE GIRAR em torno da ligação com o pai sem mudar ângulo
         nenhum. Na posição padrão ele tem um lugar no plano, um à frente e
         um atrás — e às vezes o centro precisa de DOIS à frente (a cunha
         dele e a do vizinho, que põe o vizinho à frente dele). Com lado
         exigido, experimenta-se o leque girado em passos de 20° e fica o
         giro que atende mais exigências; a semelhança com o desenho
         desempata. Na raiz, o giro é em torno da primeira direção. */
      var exigencias = filhos.filter(function (f) { return ladoExigido(f) !== 0; }).length;
      var eixoGiro = u.length === 1 ? mul(u[0], -1) : (u.length === 0 && dirsBase.length ? dirsBase[0] : null);
      var giros = exigencias && eixoGiro ? [0, 20, -20, 40, -40, 60, -60, 80, -80, 100, -100, 120] : [0];
      var melhorGiro = null;
      giros.forEach(function (gr) {
        var conj = gr ? dirsBase.map(function (d) { return girarVetor(d, eixoGiro, gr * Math.PI / 180); }) : dirsBase;
        var at = atribuir(conj), nota = at.atendidas * 10 + at.parecido - Math.abs(gr) * 0.002;
        if (!melhorGiro || nota > melhorGiro.nota + 1e-9) { melhorGiro = at; melhorGiro.nota = nota; }
      });
      var escolha = melhorGiro.escolha, livres = melhorGiro.sobra;
      var vagasH = []; for (var kh = 0; kh < hs; kh++) vagasH.push(livres[kh] || perpDe(u[0] || [1, 0, 0]));
      /* O centro definido pelo aluno sai com a quiralidade do desenho: se o
         sinal no 3D não bate, trocam de lugar dois dos que ainda estão sendo
         postos (filhos ou H), escolhendo a troca que mais preserva o
         desenho. Trocar dois de lugar sempre inverte a quiralidade. */
      var alvo = alvoQuiral[a];
      if (alvo) {
        var dirDe = function (nid) {
          for (var q = 0; q < escolha.length; q++) if (escolha[q].id === nid) return escolha[q].d;
          return P[nid] ? norm(sub(P[nid], P[a])) : null;
        };
        var sinal3D = function () {
          var v = alvo.trio.map(dirDe);
          return v.some(function (x) { return !x; }) ? 0 : Math.sign(det3(v[0], v[1], v[2]));
        };
        var atual3 = sinal3D();
        if (atual3 !== 0 && atual3 !== alvo.sinal) {
          var vagas = escolha.map(function (_, q) { return { f: q }; }).concat(vagasH.map(function (_, q) { return { h: q }; }));
          var pega = function (x) { return x.f !== undefined ? escolha[x.f].d : vagasH[x.h]; };
          var poe = function (x, dd) { if (x.f !== undefined) escolha[x.f].d = dd; else vagasH[x.h] = dd; };
          var troca = null, notaT = -Infinity;
          for (var t1 = 0; t1 < vagas.length; t1++) for (var t2 = t1 + 1; t2 < vagas.length; t2++) {
            var d1 = pega(vagas[t1]), d2 = pega(vagas[t2]);
            poe(vagas[t1], d2); poe(vagas[t2], d1);
            if (sinal3D() === alvo.sinal) {
              /* Entre as trocas que corrigem a quiralidade, vence a que
                 mantém cada cunha definida no LADO escolhido (a orientação
                 do campo editável); a semelhança com o desenho só desempata.
                 Sem esta ordem, com "trás" na ligação da cadeia, a troca
                 escolhida punha a cadeia à frente e o H atrás: a molécula
                 certa, mas vista de outro ângulo. */
              var nt = escolha.reduce(function (sm, x) {
                var lx = g.ligacao(a, x.id), ex = lx && lx.ordem === 1 ? lx.estereo : null, bonus = 0;
                if (ex && ex.tipo !== 'plano') {
                  // ponta estreita no pai: o filho vai para o lado escolhido;
                  // ponta estreita no filho: o PAI é que está do lado escolhido
                  // em relação a ele, então o filho vai para o lado oposto
                  var querLado = (ex.tipo === 'frente' ? -1 : 1) * (ex.de === a ? 1 : -1);
                  bonus = (x.d[2] * querLado > 0) ? 10 : -10;
                } else if (ex && ex.de === a) bonus = 2 * (1 - Math.abs(x.d[2]));
                return sm + dot(x.d, x.w) + bonus;
              }, 0);
              if (nt > notaT) { notaT = nt; troca = [t1, t2]; }
            }
            poe(vagas[t1], d1); poe(vagas[t2], d2);
          }
          if (troca) { var e1 = pega(vagas[troca[0]]), e2 = pega(vagas[troca[1]]); poe(vagas[troca[0]], e2); poe(vagas[troca[1]], e1); }
        }
      }
      escolha.forEach(function (x) { P[x.id] = add(P[a], mul(x.d, comprimento(g, a, x.id, x.ordem))); fila.push(x.id); });
      // os H: o que sobrou do arranjo
      for (var k = 0; k < hs; k++) {
        var hid = 'h' + (++nH), dh = vagasH[k];
        atomos.push({ id: hid, el: 'H', h: true, pai: a, x: 0, y: 0, z: 0, _p: add(P[a], mul(dh, LIG_H[g.atomos[a].el] || 1.09)) });
        ligs.push({ a: a, b: hid, ordem: 1 });
      }
    }
    relaxarPontes(g, P, atomos, aneis);
    semChoque(g, P, atomos, alvoQuiral);
    /* A tensão vem DEPOIS da escolha de conformação: assim ligada e
       desligada são a MESMA conformação, só com os ângulos cedendo — e a
       transição animada entre as duas mostra os ângulos, não um H de OH
       pulando para outro lugar. */
    if (opcoes && opcoes.tensao) flexibilizar(g, P, atomos, aneis, alvoQuiral);
    ids.forEach(function (id) {
      var p = P[id] || [0, 0, 0];
      atomos.push({ id: id, el: g.atomos[id].el, h: false, x: p[0], y: p[1], z: p[2] });
    });
    atomos.forEach(function (at) { if (at._p) { at.x = at._p[0]; at.y = at._p[1]; at.z = at._p[2]; delete at._p; } });
    g.ligacoes.forEach(function (l) { ligs.push({ a: l.a, b: l.b, ordem: l.ordem }); });
    // centra na origem, para a câmera girar em torno da molécula
    var c = [0, 0, 0]; atomos.forEach(function (at) { c = add(c, [at.x, at.y, at.z]); });
    c = mul(c, 1 / atomos.length);
    atomos.forEach(function (at) { at.x -= c[0]; at.y -= c[1]; at.z -= c[2]; });
    /* planoZ: onde foi parar o plano do desenho (z = 0 antes de centrar).
       A estereoquímica no plano mede "dentro ou fora do papel" contra ele. */
    return { atomos: atomos, ligacoes: ligs, planoZ: -c[2], tensao: !!(opcoes && opcoes.tensao) };
  };

  /* ═══ ESTEREOQUÍMICA NO PLANO — que ligação sai do papel ═══════════
     O desenho plano (zigue-zague) É o plano z = 0 desta geometria: a
     cadeia principal fica nele, na conformação antiperiplanar. Uma
     ligação que liga um átomo NO plano a um átomo FORA dele é desenhada
     como cunha nas representações planas:
       · cheia (frente) — o átomo de fora vem para o observador. A câmera
         padrão olha de z negativo, então "frente" é z menor que o plano;
       · tracejada (trás) — vai para longe.
     A ponta estreita da cunha fica no átomo que está no plano.
     Nunca viram cunha:
       · ligação de ANEL — o anel é desenhado como polígono plano, mesmo
         sendo cadeira no espaço (como nos livros);
       · DUPLA e TRIPLA — sp² e sp são planos;
       · ligação entre dois átomos já fora do plano — só a que SAI do
         papel é cunha; o resto do ramo segue em traço comum, como nos
         livros.
     Para os H implícitos (desenhados na estrutural completa e na de
     Lewis), devolve o tipo de cada H do átomo: plano, frente ou trás.
     O desenho escolhe qual H do plano recebe qual tipo (plano no meio,
     frente e trás nas pontas) — para centro aquiral qualquer escolha é
     a mesma molécula. */
  G3.estereo = function (g, mol) {
    var P = {}, hsDe = {}, z0 = mol.planoZ || 0, NO_PLANO = 0.30, SAI = 0.35;
    mol.atomos.forEach(function (a) { P[a.id] = a; if (a.h) (hsDe[a.pai] = hsDe[a.pai] || []).push(a); });
    var noPlano = function (a) { return Math.abs(a.z - z0) < NO_PLANO; };
    var tipo = function (cen, fora) {
      var dx = fora.x - cen.x, dy = fora.y - cen.y, dz = fora.z - cen.z, L = Math.hypot(dx, dy, dz) || 1;
      if (Math.abs(dz) / L < SAI) return 'plano';
      return dz < 0 ? 'frente' : 'tras';
    };
    var ligacoes = {};
    g.ligacoes.forEach(function (l) {
      if (l.ordem !== 1 || !Q3.Geometria.lado(g, l.a, l.b)) return;   // dupla, tripla ou anel
      var A = P[l.a], B = P[l.b];
      if (!A || !B || noPlano(A) === noPlano(B)) return;
      var cen = noPlano(A) ? A : B, fora = cen === A ? B : A, t = tipo(cen, fora);
      if (t !== 'plano') ligacoes[l.a < l.b ? l.a + '|' + l.b : l.b + '|' + l.a] = { tipo: t, estreito: cen.id };
    });
    /* A escolha do aluno manda no desenho plano, por cima da automática.
       "No plano" tira a cunha mesmo quando o tetraedro não deixa o
       substituinte rente ao papel — é uma convenção de desenho. */
    g.ligacoes.forEach(function (l) {
      if (!l.estereo || l.ordem !== 1) return;
      var k = l.a < l.b ? l.a + '|' + l.b : l.b + '|' + l.a;
      if (l.estereo.tipo === 'plano') delete ligacoes[k];
      else ligacoes[k] = { tipo: l.estereo.tipo, estreito: l.estereo.de, escolhida: true };
    });
    /* Num carbono com cunha definida pelo aluno, as OUTRAS ligações dele
       ficam sem cunha automática — uma cunha basta para fixar a
       configuração, e é assim que os livros desenham —, e o H dele recebe
       o lado oposto ao escolhido. */
    var definidos = {};
    g.ligacoes.forEach(function (l) { if (l.estereo && l.ordem === 1 && l.estereo.tipo !== 'plano') (definidos[l.estereo.de] = definidos[l.estereo.de] || []).push(l.estereo.tipo); });
    Object.keys(ligacoes).forEach(function (k) {
      var w = ligacoes[k];
      if (!w.escolhida && definidos[w.estreito]) delete ligacoes[k];
    });
    var hidrogenios = {};
    Object.keys(hsDe).forEach(function (pai) {
      var C = P[pai];
      hidrogenios[pai] = hsDe[pai].map(function (h) { return noPlano(C) ? tipo(C, h) : 'plano'; });
    });
    Object.keys(definidos).forEach(function (c) {
      if (!hidrogenios[c] || !hidrogenios[c].length) return;
      var t = definidos[c], tem = function (x) { return t.indexOf(x) >= 0; };
      var oposto = tem('frente') && tem('tras') ? 'plano' : tem('frente') ? 'tras' : 'frente';
      hidrogenios[c] = hidrogenios[c].map(function (_, i) { return i === 0 ? oposto : 'plano'; });
    });
    return { ligacoes: ligacoes, hidrogenios: hidrogenios };
  };

})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).Q3;
}
