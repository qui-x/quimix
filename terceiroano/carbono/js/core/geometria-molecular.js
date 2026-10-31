/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/geometria-molecular.js
   ───────────────────────────────────────────────────────────────
   ONDE CADA ÁTOMO FICA NO DESENHO — geometria 2D determinística.

   A especificação do SIQC pede "posicionamento geométrico direto pela
   tabela de ângulos/comprimentos por hibridização (não física contínua)
   — determinístico, sempre fiel à literatura". Este arquivo é essa
   tabela e as regras que a aplicam. Nada aqui anima, desenha ou lê o
   DOM: recebe um grafo (grafo-molecular.js) e um mapa de posições, e
   devolve posições. Por isso dá para testar fora do navegador, e por
   isso o SIIS e o SIPT podem herdá-lo sem trazer o editor junto.

   CONVENÇÃO DE DESENHO (a "literatura" de um desenho plano)
   Fórmula estrutural no papel não é o modelo 3D. O que os livros
   desenham no plano, e o que este arquivo reproduz:
     · sp  ............ 180°  (linear: C≡C, C=C=C)
     · sp² ............ 120°
     · sp³, até 3 vizinhos ... 120°  (o zigue-zague da cadeia é a
                                      projeção plana do tetraedro)
     · sp³, 4 vizinhos ....... 90°   (a cruz do carbono quaternário)
     · anéis .......... polígonos regulares, mesmo com duplas (o benzeno
                        é desenhado como hexágono regular)
   Os 109,5° reais do tetraedro são assunto do Módulo 2 (Hibridização),
   que é 3D justamente para mostrar o que o plano não mostra.

   Comprimentos seguem a tabela de distâncias médias de ligação (pm),
   normalizados para C–C simples = 1 unidade de desenho: a tripla sai
   visivelmente mais curta que a simples, como na literatura.

   O QUE ESTE ARQUIVO OFERECE
     comprimento(elA, elB, ordem) ... tamanho da ligação, em unidades
     hibridizacao(g, id) ............ 'sp' | 'sp2' | 'sp3'
     leque(hib, n) .................. ângulos ideais para n vizinhos
     anexar(g, pos, pai, el) ........ anexa um átomo NO lugar certo e
                                      relaxa o pai se ele ramificou
     relaxarOrdem(g, pos, a, b) ..... após mudar a ordem de a–b
     relaxarAnel(g, pos, anel) ...... após fechar um anel
     layout(g, opcoes) .............. desenho completo do zero (Snap)
     snap(g, pos) ................... layout + resolve sobreposições
     sobreposicoes(g, pos) .......... pares de átomos próximos demais
     aneisMinimos(g) ................ o conjunto mínimo de anéis (SSSR)

   Depende de: grafo-molecular.js (window.Q3.Grafo).
═══════════════════════════════════════════════════════════════ */

'use strict';

(function (raiz) {
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var G = Q3.Geometria = {};

  var RAD = Math.PI / 180;
  var REF_PM = 154;         // C–C simples = 1 unidade
  var DIR_INICIAL = -30;    // primeira ligação de um átomo sozinho: para cima e à direita
  var LIMIAR_SOBREPOSICAO = 0.78;  // átomos não ligados mais próximos que isso colidem

  /* ── comprimentos (pm) por par e ordem: simples, dupla, tripla ── */
  var TABELA = {
    'C-C': [154, 134, 120], 'C-N': [147, 129, 116], 'C-O': [143, 123, 113],
    'C-F': [135], 'C-Cl': [177], 'C-Br': [194], 'C-I': [214],
    'N-N': [145, 125, 110], 'N-O': [140, 121], 'O-O': [148],
    'N-F': [136], 'N-Cl': [175], 'O-F': [142], 'O-Cl': [170],
    'C-S': [182, 160], 'S-O': [157, 143], 'S-S': [205], 'S-N': [168], 'S-H': [134],
    'C-P': [184], 'P-O': [161, 148], 'P-N': [177],
    'C-Si': [187], 'Si-O': [163], 'Si-Si': [233],
    'C-Mg': [215], 'Mg-Cl': [218], 'Mg-Br': [234], 'Mg-I': [254],
    'O-Na': [230], 'O-K': [265]                          // nos sais orgânicos a ligação é iônica: distância média
  };
  var RAIO = { C: 77, N: 73, O: 73, F: 71, Cl: 99, Br: 114, I: 133, S: 104, P: 110, Si: 111, Mg: 141, Na: 166, K: 203 };
  var FATOR_ORDEM = [1, 0.87, 0.78];

  G.comprimento = function (elA, elB, ordem) {
    ordem = ordem || 1;
    var t = TABELA[elA + '-' + elB] || TABELA[elB + '-' + elA];
    var pm = (t && t[ordem - 1]) ? t[ordem - 1]
           : ((RAIO[elA] || 77) + (RAIO[elB] || 77)) * FATOR_ORDEM[ordem - 1];
    return pm / REF_PM;
  };

  G.hibridizacao = function (g, id) {
    var el = g.atomos[id].el;
    /* S e P com octeto expandido: a regra das duplas não serve — o S de
       uma sulfona tem dois =O e sairia "sp" (linear). O arranjo sai dos
       DOMÍNIOS (ligações σ + pares isolados), como no VSEPR: 4 domínios
       é tetraédrico. O nome devolvido é o da geometria equivalente; a
       hibridização de verdade do S hipervalente não é assunto do EM. */
    if (el === 'S' || el === 'P') {
      var sig = g.vizinhos(id).length + g.hidrogenios(id), eV = el === 'S' ? 6 : 5;
      var pares = Math.max(0, Math.floor((eV - g.ordemTotal(id) - g.hidrogenios(id) - (g.atomos[id].carga || 0)) / 2));
      var dom = sig + pares;
      return dom >= 4 ? 'sp3' : dom === 3 ? 'sp2' : 'sp';
    }
    if (el === 'Mg') return 'sp';          // R–Mg–X é linear
    var v = g.vizinhos(id), duplas = 0;
    for (var i = 0; i < v.length; i++) {
      if (v[i].ordem === 3) return 'sp';
      if (v[i].ordem === 2) duplas++;
    }
    if (duplas >= 2) return 'sp';     // aleno: C=C=C é linear no centro
    return duplas === 1 ? 'sp2' : 'sp3';
  };

  /* Ângulos ideais (graus, relativos ao primeiro vizinho) para n vizinhos. */
  G.leque = function (hib, n) {
    if (n <= 1) return [0];
    if (hib === 'sp') return [0, 180];
    if (n === 2) return [0, 120];
    if (n === 3) return [0, 120, 240];
    return [0, 90, 180, 270];
  };

  /* ── vetores e ângulos ────────────────────────────────────────── */
  function ang(a, b) { return Math.atan2(b.y - a.y, b.x - a.x) / RAD; }
  function norm(d) { d %= 360; return d < 0 ? d + 360 : d; }
  function dif(a, b) { var d = norm(a - b); return d > 180 ? d - 360 : d; }
  function ponto(o, graus, d) {
    return { x: o.x + Math.cos(graus * RAD) * d, y: o.y + Math.sin(graus * RAD) * d };
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function girar(pos, ids, c, graus) {
    if (!graus) return;
    var cs = Math.cos(graus * RAD), sn = Math.sin(graus * RAD);
    ids.forEach(function (id) {
      var p = pos[id], dx = p.x - c.x, dy = p.y - c.y;
      pos[id] = { x: c.x + dx * cs - dy * sn, y: c.y + dx * sn + dy * cs };
    });
  }
  function mover(pos, ids, dx, dy) {
    ids.forEach(function (id) { pos[id] = { x: pos[id].x + dx, y: pos[id].y + dy }; });
  }
  function copia(pos) {
    var o = {};
    Object.keys(pos).forEach(function (k) { o[k] = { x: pos[k].x, y: pos[k].y }; });
    return o;
  }
  G.copiarPosicoes = copia;
  G.angulo = ang;

  /* Lado de uma ligação: os átomos alcançáveis a partir de `viz` sem
     passar por `centro`. Devolve null se a ligação está num ciclo — aí
     não existe "ramo" que se possa girar sem rasgar o anel. */
  G.lado = function (g, centro, viz) {
    var vistos = {}; vistos[centro] = true; vistos[viz] = true;
    var pilha = [viz], out = [viz];
    while (pilha.length) {
      var n = pilha.pop(), vs = g.vizinhos(n);
      for (var i = 0; i < vs.length; i++) {
        var w = vs[i].id;
        if (w === centro && n !== viz) return null;
        if (!vistos[w]) { vistos[w] = true; out.push(w); pilha.push(w); }
      }
    }
    return out;
  };

  /* O maior vão angular livre em torno de `c`, dados os ângulos das
     ligações que NÃO vão se mexer. Devolve {inicio, tamanho}. */
  function maiorVao(angulos) {
    if (!angulos.length) return { inicio: DIR_INICIAL, tamanho: 360 };
    var a = angulos.map(norm).sort(function (x, y) { return x - y; });
    var melhor = { inicio: a[a.length - 1], tamanho: a[0] + 360 - a[a.length - 1] };
    for (var i = 1; i < a.length; i++) {
      if (a[i] - a[i - 1] > melhor.tamanho) melhor = { inicio: a[i - 1], tamanho: a[i] - a[i - 1] };
    }
    return melhor;
  }

  /* Distância livre em volta de um ponto (menor distância a outro átomo). */
  function folga(pos, p, ignorar) {
    var m = Infinity;
    Object.keys(pos).forEach(function (id) {
      if (ignorar && ignorar[id]) return;
      m = Math.min(m, dist(pos[id], p));
    });
    return m;
  }

  /* ═══════════════════════════════════════════════════════════
     RELAXAMENTO LOCAL — reacomoda os vizinhos de um centro
     Gira cada ramo livre como CORPO RÍGIDO em torno do centro até o
     ângulo ideal do leque, e acerta o comprimento da ligação. O resto
     da molécula não se mexe. Preserva a ordem cíclica atual dos
     vizinhos, então nunca cria cruzamento de ligações.
     ═══════════════════════════════════════════════════════════ */
  G.releque = function (g, pos, c, ancora) {
    var viz = g.vizinhos(c);
    if (viz.length < 2) return;
    var pc = pos[c];
    var lados = {}, fixos = [], moveis = [];
    viz.forEach(function (v) {
      var l = G.lado(g, c, v.id);
      lados[v.id] = l;
      if (!l || v.id === ancora) fixos.push(v); else moveis.push(v);
    });
    if (!fixos.length) { fixos.push(moveis.shift()); }

    var alvos;
    if (fixos.length === 1) {
      // caso de cadeia: leque ideal relativo à âncora
      var base = ang(pc, pos[fixos[0].id]);
      var hib = G.hibridizacao(g, c);
      var rel = G.leque(hib, viz.length).slice(1);
      var m = moveis.map(function (v) {
        return { v: v, r: norm(ang(pc, pos[v.id]) - base) };
      }).sort(function (a, b) { return a.r - b.r; });
      if (viz.length === 2 && hib !== 'sp') rel = [m[0].r <= 180 ? 120 : 240];  // mantém o lado do zigue-zague
      alvos = m.map(function (x, i) { return { v: x.v, graus: base + rel[i] }; });
    } else {
      // ligado a um anel (dois ou mais vizinhos fixos): os ramos livres se
      // espalham por igual no maior vão livre, para fora do anel
      var vao = maiorVao(fixos.map(function (v) { return ang(pc, pos[v.id]); }));
      var ms = moveis.map(function (v) {
        return { v: v, r: norm(ang(pc, pos[v.id]) - vao.inicio) };
      }).sort(function (a, b) { return a.r - b.r; });
      alvos = ms.map(function (x, i) {
        return { v: x.v, graus: vao.inicio + vao.tamanho * (i + 1) / (ms.length + 1) };
      });
    }

    alvos.forEach(function (a) {
      var l = lados[a.v.id];
      girar(pos, l, pc, dif(a.graus, ang(pc, pos[a.v.id])));
      var L = G.comprimento(g.atomos[c].el, g.atomos[a.v.id].el, a.v.ordem);
      var d = dist(pc, pos[a.v.id]);
      if (d > 1e-9 && Math.abs(d - L) > 1e-9) {
        mover(pos, l, (pos[a.v.id].x - pc.x) / d * (L - d), (pos[a.v.id].y - pc.y) / d * (L - d));
      }
    });
  };

  /* Âncora natural de um centro: o vizinho por onde passa a MAIOR parte
     da molécula. Reacomodar em torno dela move o mínimo possível. */
  G.ancoraDe = function (g, c, excluir) {
    var melhor = null, tam = -1;
    g.vizinhos(c).forEach(function (v) {
      if (v.id === excluir) return;
      var l = G.lado(g, c, v.id);
      var t = l ? l.length : 1e6;   // vizinho em anel pesa como "o resto todo"
      if (t > tam || (t === tam && v.id < melhor)) { tam = t; melhor = v.id; }
    });
    return melhor;
  };

  /* ═══════════════════════════════════════════════════════════
     ANEXAR — onde nasce um átomo novo
     Uma função só serve ao editor e à prévia do encaixe: o encaixe que
     o aluno vê na tela é calculado rodando ESTA função numa cópia. Por
     isso o átomo cai exatamente onde o encaixe estava, e o que se move
     em volta é o relaxamento que a especificação pede ao ramificar.
     ═══════════════════════════════════════════════════════════ */
  G.anexar = function (g, pos, pai, el) {
    var id = g.addAtomo(el);
    if (id === null) return null;
    if (!g.addLigacao(pai, id, 1)) { g.removeAtomo(id); return null; }
    var pp = pos[pai];
    var outros = g.vizinhos(pai).filter(function (v) { return v.id !== id; });
    var L = G.comprimento(g.atomos[pai].el, el, 1);
    var excluir = {}; excluir[id] = true;

    if (!outros.length) {
      pos[id] = ponto(pp, DIR_INICIAL, L);
      return { id: id, gatilho: null };
    }
    if (outros.length === 1) {
      // prolonga a cadeia: zigue-zague, ou reta se o pai for sp
      var viz = outros[0].id, phi = ang(pp, pos[viz]);
      if (G.hibridizacao(g, pai) === 'sp') {
        pos[id] = ponto(pp, phi + 180, L);
        return { id: id, gatilho: null };
      }
      // o lado do zigue-zague: o oposto da curva que a cadeia fez no vizinho;
      // se não houver curva a seguir, o lado com mais espaço livre
      var sinal = 0, antes = g.vizinhos(viz).filter(function (v) { return v.id !== pai; });
      if (antes.length === 1) {
        var q = pos[antes[0].id], p = pos[viz];
        var curva = (p.x - q.x) * (pp.y - p.y) - (p.y - q.y) * (pp.x - p.x);
        // o candidato 0 (φ+120°) curva no sentido negativo e o 1 (φ−120°) no
        // positivo; zigue-zague = curvar ao CONTRÁRIO do vizinho. (Estava
        // invertido: a cadeia enrolava em espiral. O teste pegou.)
        sinal = curva > 0 ? 1 : -1;
      }
      var cand = [ponto(pp, phi + 120, L), ponto(pp, phi - 120, L)];
      var fA = folga(pos, cand[0], excluir), fB = folga(pos, cand[1], excluir);
      var escolha = sinal === 0 ? (fA >= fB ? 0 : 1) : (sinal > 0 ? 0 : 1);
      // se o lado do zigue-zague bateria em algo, vira para o outro
      if ((escolha === 0 ? fA : fB) < LIMIAR_SOBREPOSICAO && (escolha === 0 ? fB : fA) > (escolha === 0 ? fA : fB)) escolha = 1 - escolha;
      pos[id] = cand[escolha];
      return { id: id, gatilho: null };
    }
    // RAMIFICAR: nasce no maior vão e o centro inteiro se reacomoda
    var vao = maiorVao(outros.map(function (v) { return ang(pp, pos[v.id]); }));
    pos[id] = ponto(pp, vao.inicio + vao.tamanho / 2, L);
    G.releque(g, pos, pai, G.ancoraDe(g, pai, id));
    return { id: id, gatilho: 'ramificar' };
  };

  /* Onde o próximo átomo anexado a `pai` vai parar — a prévia do encaixe. */
  G.previsaoAnexo = function (g, pos, pai, el) {
    if (g.capacidade(pai) < 1) return null;
    var gc = g.clonar(), pc = copia(pos);
    var r = G.anexar(gc, pc, pai, el || 'C');
    return r ? { x: pc[r.id].x, y: pc[r.id].y, posicoes: pc, gatilho: r.gatilho } : null;
  };

  /* MUDAR A ORDEM de a–b: o comprimento muda e as duas pontas trocam de
     hibridização — as duas se reacomodam, e os ramos giram inteiros
     (a "cascata para os vizinhos" da especificação). Ligação de anel
     mantém o comprimento: o anel continua um polígono regular. */
  G.relaxarOrdem = function (g, pos, a, b) {
    var lb = G.lado(g, a, b);
    if (lb) {
      var l = g.ligacao(a, b);
      var L = G.comprimento(g.atomos[a].el, g.atomos[b].el, l.ordem);
      var d = dist(pos[a], pos[b]);
      if (d > 1e-9) mover(pos, lb, (pos[b].x - pos[a].x) / d * (L - d), (pos[b].y - pos[a].y) / d * (L - d));
    }
    G.releque(g, pos, a, b);
    G.releque(g, pos, b, a);
  };

  /* ═══════════════════════════════════════════════════════════
     ANÉIS
     ═══════════════════════════════════════════════════════════ */

  /* Conjunto mínimo de anéis (SSSR). Os ciclos fundamentais do grafo
     não servem para desenhar: no naftaleno eles podem dar um anel de 6
     e o PERÍMETRO de 10, em vez de dois anéis de 6. Aqui: o menor ciclo
     por cada ligação, do menor para o maior, ficando só os que são
     independentes entre si (base sobre o conjunto de ligações). */
  G.aneisMinimos = function (g) {
    var ids = Object.keys(g.atomos);
    var nAneis = g.ligacoes.length - ids.length + g.componentes().length;
    if (nAneis <= 0) return [];
    var chave = function (a, b) { return a < b ? a + '|' + b : b + '|' + a; };
    var candidatos = [], vistos = {};
    g.ligacoes.forEach(function (lig) {
      // menor caminho de a até b sem usar a própria ligação
      var ant = {}; ant[lig.a] = null;
      var fila = [lig.a];
      while (fila.length && !(lig.b in ant)) {
        var n = fila.shift();
        g.vizinhos(n).forEach(function (v) {
          if (v.id in ant) return;
          if ((n === lig.a && v.id === lig.b)) return;
          ant[v.id] = n; fila.push(v.id);
        });
      }
      if (!(lig.b in ant)) return;
      var ciclo = [], x = lig.b;
      while (x !== null) { ciclo.push(x); x = ant[x]; }
      var k = ciclo.slice().sort().join(',');
      if (!vistos[k]) { vistos[k] = true; candidatos.push(ciclo); }
    });
    candidatos.sort(function (a, b) { return a.length - b.length; });
    // independência linear sobre GF(2): vetor de ligações de cada ciclo
    var base = [], escolhidos = [];
    var vetor = function (ciclo) {
      var s = {};
      for (var i = 0; i < ciclo.length; i++) s[chave(ciclo[i], ciclo[(i + 1) % ciclo.length])] = true;
      return s;
    };
    var xor = function (a, b) {
      var o = {};
      Object.keys(a).forEach(function (k) { if (!b[k]) o[k] = true; });
      Object.keys(b).forEach(function (k) { if (!a[k]) o[k] = true; });
      return o;
    };
    var pivo = function (v) { return Object.keys(v).sort()[0]; };
    for (var i = 0; i < candidatos.length && escolhidos.length < nAneis; i++) {
      var v = vetor(candidatos[i]);
      for (var j = 0; j < base.length; j++) if (v[base[j].p]) v = xor(v, base[j].v);
      if (Object.keys(v).length) {
        base.push({ v: v, p: pivo(v) });
        base.sort(function (a, b) { return a.p < b.p ? -1 : 1; });
        escolhidos.push(candidatos[i]);
      }
    }
    return escolhidos;
  };

  /* Desenha um anel como polígono regular, respeitando átomos que já
     têm lugar (`fixos`): se dois vizinhos do anel já estão postos, o
     polígono é construído sobre essa aresta, do lado de fora (anéis
     fundidos); se só um, o anel cresce para longe do que já existe
     (espiro, ou anel na ponta de uma cadeia). */
  G.posicionarAnel = function (g, pos, anel, fixos) {
    var n = anel.length, s = 1;
    var R = s / (2 * Math.sin(Math.PI / n));
    var ap = s / (2 * Math.tan(Math.PI / n));
    var colocados = anel.filter(function (id) { return fixos[id]; });
    var ordem = anel.slice();

    var centro, a0, passo;
    // procura uma aresta do anel com as duas pontas já colocadas
    var e = -1;
    for (var i = 0; i < n; i++) {
      if (fixos[ordem[i]] && fixos[ordem[(i + 1) % n]]) { e = i; break; }
    }
    if (e >= 0) {
      ordem = ordem.slice(e).concat(ordem.slice(0, e));   // ordem[0], ordem[1] = a aresta
      var u = pos[ordem[0]], v = pos[ordem[1]];
      var meio = { x: (u.x + v.x) / 2, y: (u.y + v.y) / 2 };
      var nrm = ang(u, v) + 90;
      var c1 = ponto(meio, nrm, ap), c2 = ponto(meio, nrm + 180, ap);
      // o lado de fora: longe do centroide dos outros átomos já postos
      var outros = Object.keys(fixos).filter(function (id) { return id !== ordem[0] && id !== ordem[1] && pos[id]; });
      var cx = 0, cy = 0;
      outros.forEach(function (id) { cx += pos[id].x; cy += pos[id].y; });
      if (outros.length) { cx /= outros.length; cy /= outros.length; }
      centro = !outros.length || dist(c1, { x: cx, y: cy }) >= dist(c2, { x: cx, y: cy }) ? c1 : c2;
      a0 = ang(centro, u);
      passo = dif(ang(centro, v), a0);
    } else if (colocados.length >= 1) {
      var ent = colocados[0];
      var k = ordem.indexOf(ent);
      ordem = ordem.slice(k).concat(ordem.slice(0, k));
      var pe = pos[ent];
      // cresce para longe dos vizinhos já postos da entrada
      var vs = g.vizinhos(ent).filter(function (v) { return pos[v.id] && anel.indexOf(v.id) < 0; });
      var dirFora = DIR_INICIAL;
      if (vs.length) {
        var sx = 0, sy = 0;
        vs.forEach(function (v) { sx += pos[v.id].x - pe.x; sy += pos[v.id].y - pe.y; });
        dirFora = Math.atan2(-sy, -sx) / RAD;
      }
      centro = ponto(pe, dirFora, R);
      a0 = ang(centro, pe);
      passo = 360 / n;
    } else {
      centro = { x: 0, y: 0 };
      a0 = 90 + 180 / n;   // aresta de baixo na horizontal, como nos livros
      passo = 360 / n;
    }
    if (Math.abs(Math.abs(passo) - 360 / n) > 1) passo = (passo >= 0 ? 1 : -1) * 360 / n;
    for (var t = 0; t < n; t++) {
      if (fixos[ordem[t]] && t < 2 && e >= 0) continue;
      if (t === 0 && e < 0 && colocados.length) continue;
      pos[ordem[t]] = ponto(centro, a0 + passo * t, R);
    }
    return centro;
  };

  /* FECHAR UM ANEL no editor: o anel vira polígono regular e cada átomo
     dele leva junto os próprios substituintes, como corpo rígido. Se o
     anel novo encosta num anel que já existia, o antigo não se mexe e o
     novo é construído sobre a aresta compartilhada. */
  G.relaxarAnel = function (g, pos, anel) {
    var outrosAneis = G.aneisMinimos(g).filter(function (r) {
      return r.slice().sort().join() !== anel.slice().sort().join();
    });
    var fixos = {};
    outrosAneis.forEach(function (r) {
      r.forEach(function (id) { if (anel.indexOf(id) >= 0) fixos[id] = true; });
    });
    var nFixos = Object.keys(fixos).length;
    var antes = {};
    anel.forEach(function (id) { antes[id] = { x: pos[id].x, y: pos[id].y }; });

    if (nFixos === 0) {
      // anel isolado: mantém o centroide e o sentido de percurso atuais
      var n = anel.length, cx = 0, cy = 0, area = 0;
      anel.forEach(function (id) { cx += pos[id].x; cy += pos[id].y; });
      cx /= n; cy /= n;
      for (var i = 0; i < n; i++) {
        var p = pos[anel[i]], q = pos[anel[(i + 1) % n]];
        area += p.x * q.y - q.x * p.y;
      }
      var R = 1 / (2 * Math.sin(Math.PI / n));
      var a0 = ang({ x: cx, y: cy }, pos[anel[0]]);
      var sentido = area >= 0 ? 1 : -1;
      anel.forEach(function (id, k) { pos[id] = ponto({ x: cx, y: cy }, a0 + sentido * k * 360 / n, R); });
    } else {
      var fx = {};
      Object.keys(pos).forEach(function (id) { if (anel.indexOf(id) < 0 || fixos[id]) fx[id] = true; });
      // só os átomos do anel que NÃO pertencem a outro anel são reposicionados
      var soAnel = {};
      Object.keys(fixos).forEach(function (id) { soAnel[id] = true; });
      G.posicionarAnel(g, pos, anel, soAnel);
    }
    // cada átomo do anel arrasta os substituintes que tinha
    anel.forEach(function (id) {
      var dx = pos[id].x - antes[id].x, dy = pos[id].y - antes[id].y;
      if (!dx && !dy) return;
      g.vizinhos(id).forEach(function (v) {
        if (anel.indexOf(v.id) >= 0) return;
        var l = G.lado(g, id, v.id);
        if (l) mover(pos, l, dx, dy);
      });
    });
    // e os substituintes se abrem para fora, no vão livre
    anel.forEach(function (id) { G.releque(g, pos, id, null); });
  };

  /* ═══════════════════════════════════════════════════════════
     LAYOUT COMPLETO — o desenho "de livro" do zero (Snap Literatura)
     Refaz a construção em ordem de largura a partir da raiz, com leque
     ideal em cada centro e anéis como polígonos. Determinístico: o
     mesmo grafo dá sempre o mesmo desenho.
     ═══════════════════════════════════════════════════════════ */
  G.layout = function (g, opcoes) {
    opcoes = opcoes || {};
    var ids = Object.keys(g.atomos).sort(function (a, b) {
      return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
    });
    var pos = {};
    if (!ids.length) return pos;
    var raizId = opcoes.raiz && g.atomos[opcoes.raiz] ? opcoes.raiz : ids[0];
    var aneis = G.aneisMinimos(g);
    var aneisDe = {};
    aneis.forEach(function (r, i) { r.forEach(function (id) { (aneisDe[id] = aneisDe[id] || []).push(i); }); });
    var anelPosto = {};
    var colocado = {};

    var porAnel = function (i) {
      if (anelPosto[i]) return [];
      anelPosto[i] = true;
      var novos = aneis[i].filter(function (id) { return !colocado[id]; });
      G.posicionarAnel(g, pos, aneis[i], colocado);
      novos.forEach(function (id) { colocado[id] = true; });
      return novos;
    };

    pos[raizId] = opcoes.origem ? { x: opcoes.origem.x, y: opcoes.origem.y } : { x: 0, y: 0 };
    colocado[raizId] = true;
    var fila = [raizId];
    if (aneisDe[raizId]) {
      delete pos[raizId]; delete colocado[raizId];
      fila = porAnel(aneisDe[raizId][0]);
      if (opcoes.origem) {
        var dx = opcoes.origem.x - pos[raizId].x, dy = opcoes.origem.y - pos[raizId].y;
        mover(pos, Object.keys(pos), dx, dy);
      }
    }
    var visitado = {};
    while (fila.length) {
      var a = fila.shift();
      if (visitado[a]) continue;
      visitado[a] = true;
      // 1. anéis de que `a` faz parte e que ainda não foram desenhados
      (aneisDe[a] || []).forEach(function (i) { fila = fila.concat(porAnel(i)); });
      // 2. filhos da árvore
      var filhos = g.vizinhos(a).filter(function (v) { return !colocado[v.id]; })
        .sort(function (x, y) { return parseInt(x.id.slice(1), 10) - parseInt(y.id.slice(1), 10); });
      if (!filhos.length) continue;
      var pa = pos[a];
      var postos = g.vizinhos(a).filter(function (v) { return colocado[v.id]; });
      var dirs;
      if (postos.length === 0) {
        var hib0 = G.hibridizacao(g, a), rel0 = G.leque(hib0, filhos.length);
        dirs = rel0.map(function (r) { return DIR_INICIAL + r; });
      } else if (postos.length === 1) {
        var phi = ang(pa, pos[postos[0].id]);
        var hib = G.hibridizacao(g, a), nTot = g.vizinhos(a).length;
        var rel = G.leque(hib, nTot).slice(1);
        if (nTot === 2 && hib !== 'sp') {
          // zigue-zague: o oposto da curva feita no vizinho de trás
          var viz = postos[0].id, atras = g.vizinhos(viz).filter(function (v) { return v.id !== a && colocado[v.id]; });
          var sinal = 1;
          if (atras.length) {
            var q = pos[atras[0].id], p = pos[viz];
            var curva = (p.x - q.x) * (pa.y - p.y) - (p.y - q.y) * (pa.x - p.x);
            sinal = curva > 0 ? 1 : -1;   // mesmo critério de anexar()
          }
          rel = [sinal > 0 ? 120 : 240];
        } else if (nTot === 4 && hib === 'sp3') {
          rel = [180, 90, 270];      // a cadeia principal atravessa a cruz reto
        } else if (nTot === 3) {
          rel = [120, 240];
        }
        dirs = rel.map(function (r) { return phi + r; });
      } else {
        var vao = maiorVao(postos.map(function (v) { return ang(pa, pos[v.id]); }));
        dirs = filhos.map(function (_, i) { return vao.inicio + vao.tamanho * (i + 1) / (filhos.length + 1); });
      }
      filhos.forEach(function (f, i) {
        var L = G.comprimento(g.atomos[a].el, g.atomos[f.id].el, f.ordem);
        pos[f.id] = ponto(pa, dirs[i % dirs.length], L);
        colocado[f.id] = true;
        fila.push(f.id);
      });
    }
    return pos;
  };

  /* Pares de átomos NÃO ligados perto demais. */
  G.sobreposicoes = function (g, pos, limiar) {
    limiar = limiar || LIMIAR_SOBREPOSICAO;
    var ids = Object.keys(pos), out = [];
    for (var i = 0; i < ids.length; i++) {
      for (var j = i + 1; j < ids.length; j++) {
        if (g.ligacao(ids[i], ids[j])) continue;
        var d = dist(pos[ids[i]], pos[ids[j]]);
        if (d < limiar) out.push([ids[i], ids[j], d]);
      }
    }
    return out;
  };

  function pontuacao(g, pos) {
    return G.sobreposicoes(g, pos).reduce(function (s, x) { return s + (LIMIAR_SOBREPOSICAO - x[2]); }, 0);
  }

  /* Espelha um ramo inteiro sobre o eixo da ligação que o prende. */
  function espelhar(pos, ids, a, b) {
    var pa = pos[a], pb = pos[b];
    var dx = pb.x - pa.x, dy = pb.y - pa.y, L2 = dx * dx + dy * dy;
    ids.forEach(function (id) {
      var p = pos[id], t = ((p.x - pa.x) * dx + (p.y - pa.y) * dy) / L2;
      var px = pa.x + t * dx, py = pa.y + t * dy;
      pos[id] = { x: 2 * px - p.x, y: 2 * py - p.y };
    });
  }

  /* SNAP LITERATURA: desenho de livro do zero + resolve ramos distantes
     que se sobrepõem. Primeiro tenta ESPELHAR ramos sobre a ligação que
     os prende (conserva todos os ângulos e comprimentos: continua "de
     livro"); só se sobrar colisão aplica uma repulsão curta e limitada,
     que termina — não há física contínua neste editor. */
  G.snap = function (g, pos, opcoes) {
    var ids = Object.keys(g.atomos);
    if (!ids.length) return {};
    var raizId = (opcoes && opcoes.raiz) || ids.sort(function (a, b) {
      return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
    })[0];
    var novo = G.layout(g, { raiz: raizId, origem: pos && pos[raizId] });
    // mantém a orientação geral: gira tudo para a primeira ligação da
    // raiz apontar para onde apontava antes
    if (pos && pos[raizId]) {
      var v = g.vizinhos(raizId).map(function (x) { return x.id; }).sort()[0];
      if (v && pos[v]) girar(novo, Object.keys(novo), novo[raizId], dif(ang(pos[raizId], pos[v]), ang(novo[raizId], novo[v])));
    }
    // 1. espelhamentos
    var tentativas = 0, s = pontuacao(g, novo);
    while (s > 0 && tentativas < 60) {
      tentativas++;
      var melhora = false;
      var ligs = g.ligacoes.slice().sort(function (x, y) { return (x.a + x.b) < (y.a + y.b) ? -1 : 1; });
      for (var i = 0; i < ligs.length && !melhora; i++) {
        var l = ligs[i];
        [[l.a, l.b], [l.b, l.a]].forEach(function (par) {
          if (melhora) return;
          var lado = G.lado(g, par[0], par[1]);
          if (!lado || lado.length > ids.length / 2 + 0.5) return;
          var teste = copia(novo);
          espelhar(teste, lado, par[0], par[1]);
          var s2 = pontuacao(g, teste);
          if (s2 < s - 1e-6) { novo = teste; s = s2; melhora = true; }
        });
      }
      if (!melhora) break;
    }
    // 2. repulsão limitada, com as ligações segurando o comprimento
    for (var it = 0; it < 120 && s > 0; it++) {
      G.sobreposicoes(g, novo).forEach(function (x) {
        var a = novo[x[0]], b = novo[x[1]], d = Math.max(x[2], 1e-3);
        var f = (LIMIAR_SOBREPOSICAO - d) / 2 + 0.01;
        var ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
        novo[x[0]] = { x: a.x - ux * f, y: a.y - uy * f };
        novo[x[1]] = { x: b.x + ux * f, y: b.y + uy * f };
      });
      g.ligacoes.forEach(function (l) {
        var a = novo[l.a], b = novo[l.b], d = dist(a, b);
        var L = G.comprimento(g.atomos[l.a].el, g.atomos[l.b].el, l.ordem);
        var k = (d - L) / 2 / Math.max(d, 1e-6);
        novo[l.a] = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
        novo[l.b] = { x: b.x - (b.x - a.x) * k, y: b.y - (b.y - a.y) * k };
      });
      s = pontuacao(g, novo);
    }
    return novo;
  };

})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).Q3;
}
