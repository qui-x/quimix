/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/isomeros-gerais.js
   ───────────────────────────────────────────────────────────────
   SIIS — GERADOR GERAL DE ISÔMEROS CONSTITUCIONAIS e FORMA CANÔNICA.
   Não depende do escopo de nomenclatura: gera TODOS os isômeros de uma
   fórmula (até 8 átomos pesados e 2 anéis — decisão do professor),
   inclusive várias insaturações, duplas acumuladas (alenos), anéis com
   insaturação e enóis (sem enol não há tautomeria).

   ETAPAS
     1. esqueletos em árvore, átomo a átomo, respeitando a valência
        (C 4, N 3, O 2, halogênio 1), sem O–O, O–N, N–N nem halogênio
        fora do carbono;
     2. até 2 anéis (arestas entre átomos ainda não ligados);
     3. as insaturações que faltam para o grau de insaturação da fórmula;
     4. o FILTRO QUÍMICO (o que não existe como composto estável):
        tripla ou dupla acumulada em anel; dupla em cabeça de ponte
        (junção de dois anéis); mais duplas do que o anel comporta
        (anel de 3 ou 4: uma; de 5: duas; de 6: três); imina C=N (exceto
        o anel da piridina); ceteno (C=C=O); OH em carbono da tripla;
        NH2 em carbono da dupla; heteroátomo em anel de 3 com dupla;
        carbonila em anel de 3.
   Os repetidos saem pela FORMA CANÔNICA do grafo (refinamento de cores
   + individualização): dois desenhos da mesma molécula têm a mesma
   forma — é ela que responde "mesma molécula" no Comparar.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var I = Q3.Isomeros = {};
  var VAL = { C: 4, N: 3, O: 2, F: 1, Cl: 1, Br: 1, I: 1 };
  var HAL = { F: 1, Cl: 1, Br: 1, I: 1 };
  I.MAX_PESADOS = 8;          // qualquer fórmula até 8 átomos além do H
  I.MAX_PESADOS_SIMPLES = 10; // 9 e 10 átomos: só com uma insaturação/anel e um heteroátomo no máximo
  I.MAX_ANEIS = 2;
  I.LIMITE = 50;              // a bancada usa no máximo 50 estruturas por fórmula (as mais estudadas)

  /* ══ FORMA CANÔNICA ═════════════════════════════════════════════
     m = { els: ['C','O',…], ord: matriz n×n de ordens (0 = sem ligação) } */
  function refinar(m, cor) {
    var n = m.els.length;
    for (var volta = 0; volta < n + 1; volta++) {
      var chaves = [];
      for (var i = 0; i < n; i++) {
        var viz = [];
        for (var j = 0; j < n; j++) if (m.ord[i][j]) viz.push(cor[j] + '.' + m.ord[i][j]);
        chaves.push(cor[i] + '|' + viz.sort().join(','));
      }
      var dist = chaves.slice().sort().filter(function (x, k, a) { return !k || a[k - 1] !== x; });
      var antes = new Set(cor).size;
      cor = chaves.map(function (k) { return dist.indexOf(k); });
      if (dist.length === antes) break;                 // a partição parou de se refinar
    }
    return cor;
  }
  function certificado(m, cor) {
    var n = m.els.length, ordem = []; for (var i = 0; i < n; i++) ordem.push(i);
    ordem.sort(function (a, b) { return cor[a] - cor[b]; });
    var s = ordem.map(function (v) { return m.els[v]; }).join('') + ':';
    for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) { var o = m.ord[ordem[a]][ordem[b]]; if (o) s += a + '-' + b + '=' + o + ';'; }
    return s;
  }
  function canonicaRec(m, cor) {
    cor = refinar(m, cor);
    var n = m.els.length, contagem = {};
    cor.forEach(function (c) { contagem[c] = (contagem[c] || 0) + 1; });
    var alvo = null;
    Object.keys(contagem).map(Number).sort(function (a, b) { return a - b; }).forEach(function (c) { if (alvo === null && contagem[c] > 1) alvo = c; });
    if (alvo === null) return certificado(m, cor);
    var melhor = null;
    for (var v = 0; v < n; v++) {
      if (cor[v] !== alvo) continue;
      var c2 = cor.map(function (c) { return c * 2 + 1; }); c2[v] = alvo * 2;   // individualiza v
      var cert = canonicaRec(m, c2);
      if (melhor === null || cert < melhor) melhor = cert;
    }
    return melhor;
  }
  I.canonicaMatriz = function (m) {
    var cor = m.els.map(function (e, i) { var s = 0; m.ord[i].forEach(function (o) { s += o; }); return e + s; });
    var dist = cor.slice().sort().filter(function (x, k, a) { return !k || a[k - 1] !== x; });
    return canonicaRec(m, cor.map(function (k) { return dist.indexOf(k); }));
  };
  /* de/para o grafo do laboratório (só os átomos pesados; os H são implícitos) */
  I.matrizDe = function (g) {
    var ids = g.pesados(), idx = {}; ids.forEach(function (id, k) { idx[id] = k; });
    var n = ids.length, ord = []; for (var i = 0; i < n; i++) { ord.push([]); for (var j = 0; j < n; j++) ord[i].push(0); }
    g.ligacoes.forEach(function (l) { if (l.a in idx && l.b in idx) { ord[idx[l.a]][idx[l.b]] = l.ordem; ord[idx[l.b]][idx[l.a]] = l.ordem; } });
    return { els: ids.map(function (id) { return g.atomos[id].el; }), ord: ord };
  };
  I.canonica = function (g) { return I.canonicaMatriz(I.matrizDe(g)); };
  I.grafoDe = function (m) {
    var g = new Q3.Grafo(), ids = m.els.map(function (e) { return g.addAtomo(e); });
    for (var a = 0; a < m.els.length; a++) for (var b = a + 1; b < m.els.length; b++) if (m.ord[a][b]) g.addLigacao(ids[a], ids[b], m.ord[a][b]);
    return g;
  };

  /* ══ A FÓRMULA ═══════════════════════════════════════════════════ */
  I.lerFormula = function (texto) {
    var s = String(texto).replace(/\s+/g, '').replace(/[₀-₉]/g, function (c) { return '₀₁₂₃₄₅₆₇₈₉'.indexOf(c); });
    if (!/^([A-Z][a-z]?\d*)+$/.test(s)) throw new Error('Escreva a fórmula molecular como C4H8.');
    var cont = {}, m, re = /([A-Z][a-z]?)(\d*)/g;
    while ((m = re.exec(s))) { if (!(m[1] in VAL) && m[1] !== 'H') throw new Error('Elemento fora do escopo: ' + m[1] + '.'); cont[m[1]] = (cont[m[1]] || 0) + (m[2] ? +m[2] : 1); }
    if (!cont.C) throw new Error('Sem carbono, não é composto orgânico.');
    var H = cont.H || 0, n = 0, soma = 0;
    Object.keys(cont).forEach(function (e) { if (e !== 'H') { n += cont[e]; soma += cont[e] * (VAL[e] - 2); } });
    var gi2 = soma + 2 - H;                           // 2 × grau de insaturação
    if (gi2 % 2) throw new Error('Essa fórmula não fecha: com esses átomos, o número de H precisa ser ' + (H % 2 ? 'par' : 'ímpar') + ' — assim seria um radical ou um íon, não uma molécula neutra.');
    if (gi2 < 0) throw new Error('Essa fórmula não fecha: há hidrogênios demais para esses átomos.');
    var nHet = n - (cont.C || 0);
    if (n > I.MAX_PESADOS_SIMPLES) throw new Error('O gerador trabalha com até ' + I.MAX_PESADOS_SIMPLES + ' átomos além do H.');
    if (n > I.MAX_PESADOS && (gi2 / 2 > 1 || nHet > 1)) throw new Error('Fórmula grande demais para a bancada: com 9 ou 10 átomos além do H, só cabe uma insaturação ou anel e um heteroátomo (os isômeros passariam de dez mil).');
    return { cont: cont, H: H, pesados: n, gi: gi2 / 2 };
  };

  /* ══ O GERADOR ═══════════════════════════════════════════════════ */
  function copia(m) { return { els: m.els.slice(), ord: m.ord.map(function (l) { return l.slice(); }) }; }
  function grau(m, i) { var s = 0; m.ord[i].forEach(function (o) { s += o; }); return s; }
  function ligacaoPermitida(a, b) {
    if (HAL[a] && HAL[b]) return false;
    if (HAL[a] && b !== 'C') return false; if (HAL[b] && a !== 'C') return false;
    if ((a === 'O' || a === 'N') && (b === 'O' || b === 'N')) return false;
    return true;
  }
  /* os anéis mínimos (até 2) pela matriz: arestas que estão em ciclo, e cada ciclo pequeno */
  function arestaEmCiclo(m, a, b) {
    var n = m.els.length, vis = {}, fila = [a]; vis[a] = 1;
    while (fila.length) { var x = fila.shift(); for (var y = 0; y < n; y++) if (m.ord[x][y] && !vis[y] && !(x === a && y === b)) { if (y === b) return true; vis[y] = 1; fila.push(y); } }
    return false;
  }
  function aneisMinimos(m) { return Q3.Geometria.aneisMinimos(I.grafoDe(m)).map(function (r) { return r.map(function (id) { return +String(id).replace(/\D/g, '') - 1; }); }); }

  function quimicamenteOk(m) {
    var n = m.els.length, e = m.els;
    var aneis = null, noAnel = [];
    var temCiclo = false;
    for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) if (m.ord[a][b] && arestaEmCiclo(m, a, b)) temCiclo = true;
    if (temCiclo) { aneis = aneisMinimos(m); for (var i = 0; i < n; i++) noAnel.push(aneis.filter(function (r) { return r.indexOf(i) >= 0; }).length); }
    for (var x = 0; x < n; x++) {
      var duplas = 0, triplas = 0, duplaCom = [];
      for (var y = 0; y < n; y++) { if (m.ord[x][y] === 2) { duplas++; duplaCom.push(y); } if (m.ord[x][y] === 3) triplas++; }
      if (e[x] === 'N' && duplas && !(aneis && noAnel[x])) return false;                 // imina C=N (fora do anel aromático)
      if (e[x] === 'C' && duplas >= 2 && duplaCom.some(function (y) { return e[y] === 'O'; })) return false;   // ceteno C=C=O
      if (temCiclo && noAnel[x] && (duplas >= 2 || triplas)) return false;              // acumulada / tripla em anel
      if (temCiclo && noAnel[x] >= 2 && duplas) return false;                           // dupla em cabeça de ponte
      if (e[x] === 'O' && grau(m, x) === 1) {                                           // OH: não em carbono da tripla
        var c = m.ord[x].findIndex(function (o) { return o > 0; });
        if (m.ord[x][c] === 1 && m.ord[c].some(function (o) { return o === 3; })) return false;
      }
      if (e[x] === 'C') {                                                               // gem-diol, hemiacetal, hemiaminal
        var simplesHet = 0, comH = 0;
        for (var w = 0; w < n; w++) if (m.ord[x][w] === 1 && (e[w] === 'O' || e[w] === 'N')) { simplesHet++; if (grau(m, w) === 1) comH++; }
        if (simplesHet >= 2 && comH >= 1) return false;
      }
      if (e[x] === 'N' && grau(m, x) === 1) {                                           // NH2 em carbono de dupla (enamina)
        var cn = m.ord[x].findIndex(function (o) { return o > 0; });
        if (m.ord[x][cn] === 1 && m.ord[cn].some(function (o) { return o === 2; })) return false;
      }
    }
    if (aneis) for (var r = 0; r < aneis.length; r++) {
      var anel = aneis[r], t = anel.length, d = 0, het = anel.some(function (k) { return e[k] !== 'C'; });
      for (var k = 0; k < t; k++) for (var k2 = k + 1; k2 < t; k2++) if (m.ord[anel[k]][anel[k2]] === 2) d++;
      var limite = t <= 4 ? 1 : t === 5 ? 2 : 3;
      if (d > limite) return false;
      if (t === 3 && het && d) return false;                                            // oxireno, azirina
      if (t === 3) for (var k3 = 0; k3 < 3; k3++) for (var z = 0; z < n; z++) if (anel.indexOf(z) < 0 && m.ord[anel[k3]][z] === 2 && e[z] === 'O') return false;   // ciclopropanona
      if (anel.some(function (k4) { return e[k4] === 'N'; }) && anel.some(function (k4) { return m.els[k4] === 'N' && m.ord[k4].some(function (o) { return o === 2; }); }) && !(t === 6 && d === 3)) return false;
    }
    return true;
  }

  /* ══ A RELEVÂNCIA DIDÁTICA: o que aparece nos livros do ensino médio e do início da licenciatura ══
     pontuação estrutural (barata): sobem uma função só do catálogo, cadeia aberta, benzeno, os pares
     clássicos (aminoácido, hidroxiácido); descem bicíclicos, heterociclos (mais ainda com dupla), anéis de
     3–4 com dupla, alenos, enóis e éteres de enol, mais de duas funções. */
  I.relevancia = function (m, g) {
    var n = m.els.length, pts = 100, el = m.els;
    var aneis = Q3.Geometria.aneisMinimos(g), nAn = aneis.length;
    if (nAn === 2) pts -= 60;
    aneis.forEach(function (r) {
      var het = r.some(function (id) { return g.atomos[id].el !== 'C'; }), d = 0;
      for (var i = 0; i < r.length; i++) for (var j = i + 1; j < r.length; j++) { var l = g.ligacao(r[i], r[j]); if (l && l.ordem === 2) d++; }
      var arom = r.length === 6 && d === 3 && !het;
      if (arom) pts += 15;
      else { if (het) pts -= 30 + (d ? 20 : 0); if (r.length <= 4) pts -= 8 + (d ? 22 : 0); if (!het && r.length === 6) pts += 2; if (!het && r.length >= 8) pts -= 4; }   // o anel de 6, o mais comum nos livros; o de 8, raro
    });
    if (!nAn) pts += 6;
    var enol = 0, eterEnol = 0, acumulada = 0, tripla = 0, aromatico = {};
    var ids0 = g.pesados();
    aneis.forEach(function (r) { var d = 0; for (var i = 0; i < r.length; i++) for (var j = i + 1; j < r.length; j++) { var l = g.ligacao(r[i], r[j]); if (l && l.ordem === 2) d++; } if (r.length === 6 && d === 3) r.forEach(function (id) { aromatico[ids0.indexOf(id)] = 1; }); });
    for (var a = 0; a < n; a++) {
      var duplasC = 0;
      for (var b = 0; b < n; b++) { if (m.ord[a][b] === 2 && el[b] === 'C' && el[a] === 'C') duplasC++; if (m.ord[a][b] === 3) tripla++; }
      if (duplasC >= 2) acumulada++;
      if ((el[a] === 'O' || el[a] === 'N') && el.some(function (x, c) { return m.ord[a][c] === 1 && x === 'C' && !aromatico[c] && m.ord[c].some(function (o, d2) { return o >= 2 && el[d2] === 'C'; }); })) {
        var deg = m.ord[a].filter(function (o) { return o > 0; }).length;
        if (el[a] === 'O' && deg === 1) enol++; else eterEnol++;
      }
    }
    pts -= 40 * acumulada + 25 * enol + 30 * eterEnol;
    var det = Q3.Funcoes.detectar(g), ids = det.grupos.map(function (x) { return x.id; }).filter(function (x) { return x !== 'hidrocarboneto'; });
    if (enol) for (var en = 0; en < enol; en++) ids.push('enol');                // o OH do enol é um grupo (não "some" da contagem)
    var nf = ids.length, assin = ids.slice().sort().join('+'), classico = assin === 'acido+amina' || assin === 'acido+alcool';   // aminoácidos e hidroxiácidos
    if (nf === 1) pts += 12;
    if (nf === 2 && !classico) pts -= 15;
    if (nf > 2) pts -= 25 * (nf - 1);
    var insatC = 0; for (var x = 0; x < n; x++) for (var y = x + 1; y < n; y++) if (m.ord[x][y] >= 2 && el[x] === 'C' && el[y] === 'C') insatC++;
    if (nf && insatC && !nAn) pts -= 14;                                   // função numa cadeia insaturada: aparece menos nos livros
    // a SIMPLICIDADE, como nos livros: menos ramificação na cadeia e menos substituintes no anel vêm primeiro
    var noAnel = {}; aneis.forEach(function (r) { r.forEach(function (id) { noAnel[ids0.indexOf(id)] = 1; }); });
    for (var q = 0; q < n; q++) {
      if (el[q] !== 'C') continue;
      var vC = 0; for (var w = 0; w < n; w++) if (m.ord[q][w] && el[w] === 'C') vC++;
      if (!noAnel[q] && vC >= 3) pts -= 2;
    }
    var subsAnel = 0; for (var q2 = 0; q2 < n; q2++) if (noAnel[q2]) for (var w2 = 0; w2 < n; w2++) if (m.ord[q2][w2] && !noAnel[w2]) subsAnel++;
    if (subsAnel > 1) pts -= 3 * (subsAnel - 1);
    var tipoCadeia = nAn === 2 ? 'biciclo' : !nAn ? 'aberta' : aneis[0].some(function (id) { return g.atomos[id].el !== 'C'; }) ? 'heterociclo' : (aneis[0].length === 6 && pts > 0 && aneis.some(function (r) { var d = 0; for (var i = 0; i < r.length; i++) for (var j = i + 1; j < r.length; j++) { var l = g.ligacao(r[i], r[j]); if (l && l.ordem === 2) d++; } return d === 3; }) ? 'aromatico' : 'carbociclo');
    return { pts: pts, assinatura: assin || 'hidrocarboneto', grupoDidatico: (nf <= 1 || classico) ? (assin || 'hidrocarboneto') + '|' + tipoCadeia : null };
  };
  /* as 50 (ou o limite): 1º o melhor de cada combinação de funções, depois por pontuação; e o nome por
     último — o que o motor não sabe nomear perde lugar para o que ele sabe */
  function recortar(lista, limite) {
    lista.forEach(function (it) { var r = I.relevancia(it.m, it.g); it.relev = r.pts; it.assinFun = r.assinatura; it.grupoDid = r.grupoDidatico; });
    var ordem = lista.slice().sort(function (x, y) { return (y.relev - x.relev) || (x.canonica < y.canonica ? -1 : 1); });
    var escolhidos = [], ja = {}, porGrupo = {};
    // 1º: o melhor de cada função isolada (ou par clássico) em cada tipo de cadeia — aberta, anel de carbono,
    //     heterociclo, aromático —, para que cada família dos livros esteja representada
    ordem.forEach(function (it) { if (it.grupoDid && !porGrupo[it.grupoDid] && it.relev > 50) porGrupo[it.grupoDid] = it; });
    // 2º: por pontuação. Em ambos, só o que o motor sabe NOMEAR (com recorte, o sem nome não entra)
    var tentar = function (it) { if (escolhidos.length >= limite || ja[it.canonica]) return; if (!I.nomear(it.g)) { ja[it.canonica] = 1; return; } escolhidos.push(it); ja[it.canonica] = 1; };
    Object.keys(porGrupo).map(function (k) { return porGrupo[k]; }).sort(function (x, y) { return y.relev - x.relev; }).forEach(tentar);
    for (var i = 0; i < ordem.length && escolhidos.length < limite; i++) tentar(ordem[i]);
    return escolhidos;
  }

  I.gerar = function (texto, limite) {
    var f = I.lerFormula(texto), cont = f.cont, els = [];
    ['C', 'N', 'O', 'F', 'Cl', 'Br', 'I'].forEach(function (e) { for (var k = 0; k < (cont[e] || 0); k++) els.push(e); });
    var n = els.length;
    // 1. árvores, átomo a átomo (a ordem dos elementos é livre: cada nível tenta todos os que sobram)
    var restante = function (m) { var c = {}; els.forEach(function (e) { c[e] = (c[e] || 0) + 1; }); m.els.forEach(function (e) { c[e]--; }); return c; };
    var nivel = {}, tiposIni = els.filter(function (e, k, a) { return a.indexOf(e) === k; });
    tiposIni.forEach(function (e) { var m = { els: [e], ord: [[0]] }; nivel[I.canonicaMatriz(m)] = m; });
    for (var tam = 1; tam < n; tam++) {
      var prox = {};
      Object.keys(nivel).forEach(function (k) {
        var m = nivel[k], sobra = restante(m);
        Object.keys(sobra).forEach(function (e) {
          if (!sobra[e]) return;
          for (var i = 0; i < m.els.length; i++) {
            if (grau(m, i) >= VAL[m.els[i]] || !ligacaoPermitida(m.els[i], e)) continue;
            var m2 = copia(m); m2.els.push(e); m2.ord.forEach(function (l) { l.push(0); }); m2.ord.push(m2.els.map(function () { return 0; }));
            var j = m2.els.length - 1; m2.ord[i][j] = 1; m2.ord[j][i] = 1;
            var c = I.canonicaMatriz(m2); if (!prox[c]) prox[c] = m2;
          }
        });
      });
      nivel = prox;
    }
    // 2. anéis (até 2, e não mais que o grau de insaturação)
    var comAneis = {}; Object.keys(nivel).forEach(function (k) { comAneis[k] = { m: nivel[k], r: 0 }; });
    var frente = Object.keys(comAneis).map(function (k) { return comAneis[k]; });
    for (var r = 1; r <= Math.min(I.MAX_ANEIS, f.gi); r++) {
      var nova = [];
      frente.forEach(function (it) {
        var m = it.m;
        for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) {
          if (m.ord[a][b] || grau(m, a) >= VAL[m.els[a]] || grau(m, b) >= VAL[m.els[b]] || !ligacaoPermitida(m.els[a], m.els[b])) continue;
          var m2 = copia(m); m2.ord[a][b] = 1; m2.ord[b][a] = 1;
          var c = I.canonicaMatriz(m2); if (!comAneis[c]) { comAneis[c] = { m: m2, r: r }; nova.push(comAneis[c]); }
        }
      });
      frente = nova;
    }
    // 3. as insaturações que faltam (π = GI − anéis), aresta por aresta
    var saida = {}, lista = [];
    Object.keys(comAneis).forEach(function (k) {
      var it = comAneis[k], pi = f.gi - it.r; if (pi < 0) return;
      var arestas = []; for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) if (it.m.ord[a][b]) arestas.push([a, b]);
      (function distribuir(m, resta, desde) {
        if (!resta) {
          var c = I.canonicaMatriz(m); if (saida[c]) return; saida[c] = 1;
          if (quimicamenteOk(m)) lista.push({ m: copia(m), canonica: c, aneis: it.r });
          return;
        }
        for (var q = desde; q < arestas.length; q++) {
          var x = arestas[q][0], y = arestas[q][1];
          if (m.ord[x][y] >= 3 || grau(m, x) >= VAL[m.els[x]] || grau(m, y) >= VAL[m.els[y]]) continue;
          if (HAL[m.els[x]] || HAL[m.els[y]]) continue;
          if (m.els[x] !== 'C' && m.els[y] !== 'C') continue;
          m.ord[x][y]++; m.ord[y][x]++;
          distribuir(m, resta - 1, q);
          m.ord[x][y]--; m.ord[y][x]--;
        }
      })(copia(it.m), pi, 0);
    });
    // a contagem de H confere (a fórmula já garante; é só a salvaguarda)
    lista = lista.filter(function (it) { var h = 0; it.m.els.forEach(function (e, i) { h += VAL[e] - grau(it.m, i); }); return h === f.H; });
    lista.forEach(function (it) { it.g = I.grafoDe(it.m); });
    var possiveis = lista.length, lim = limite === 0 ? Infinity : (limite || I.LIMITE);
    if (lista.length > lim) lista = recortar(lista, lim);
    return { estruturas: lista, total: lista.length, possiveis: possiveis, recortado: possiveis > lista.length, formula: f };
  };

  /* ══ O NOME de uma estrutura: o motor do Módulo 2 e, se ele não souber,
     o de nomes completos com a opção ampla (enóis, anéis com vários grupos,
     metilideno, bicíclicos e espiro). null quando nenhum sabe. */
  I.nomear = function (g) {
    var a = Q3.Nomenclatura.nomear(g); if (a.ok) return a.nome;
    var b = Q3.NomenclaturaCompleta.nomear(g, { amplo: true }); return b.ok ? b.nome : null;
  };

  /* ══ O COMPARAR: veredito de 3 vias e o tipo de isomeria ═════════
     1. fórmulas diferentes; 2. mesma molécula (mesma forma canônica);
     3. isômeros, com o tipo, nesta ordem de decisão:
        tautomeria · função · metameria · posição · cadeia. */
  function formulaDe(g) { return g.formulaMolecular(); }
  function tautomerosEnol(m) {   // ceto → enol: C=O com um H no carbono vizinho
    var out = [], n = m.els.length;
    for (var c = 0; c < n; c++) {
      if (m.els[c] !== 'C') continue;
      var o = -1; for (var k = 0; k < n; k++) if (m.ord[c][k] === 2 && m.els[k] === 'O') o = k;
      if (o < 0) continue;
      for (var a = 0; a < n; a++) {
        if (m.ord[c][a] !== 1 || m.els[a] !== 'C' || grau(m, a) >= VAL.C) continue;
        var t = copia(m); t.ord[c][o] = t.ord[o][c] = 1; t.ord[c][a] = t.ord[a][c] = 2; out.push(I.canonicaMatriz(t));
      }
    }
    return out;
  }
  function classeHidrocarboneto(m) {
    var d = 0, t = 0; for (var a = 0; a < m.els.length; a++) for (var b = a + 1; b < m.els.length; b++) { if (m.ord[a][b] === 2) d++; if (m.ord[a][b] === 3) t++; }
    return { duplas: d, triplas: t };
  }
  function esqueletoC(m) {       // só os carbonos, com ligações simples
    var idx = []; m.els.forEach(function (e, i) { if (e === 'C') idx.push(i); });
    return I.canonicaMatriz({ els: idx.map(function () { return 'C'; }), ord: idx.map(function (i) { return idx.map(function (j) { return m.ord[i][j] ? 1 : 0; }); }) });
  }
  function ladosDoHeteroatomo(m, het) {   // os tamanhos das cadeias de carbono de cada lado
    var n = m.els.length;
    return m.ord[het].map(function (o, v) { return o && m.els[v] === 'C' ? v : -1; }).filter(function (v) { return v >= 0; }).map(function (v0) {
      var vis = {}; vis[het] = 1; vis[v0] = 1; var fila = [v0], tam = 0;
      while (fila.length) { var x = fila.shift(); if (m.els[x] === 'C') tam++; for (var y = 0; y < n; y++) if (m.ord[x][y] && !vis[y] && m.els[y] === 'C') { vis[y] = 1; fila.push(y); } }
      return tam;
    }).sort(function (a, b) { return a - b; }).join('+');
  }
  /* ══ A CLASSIFICAÇÃO DA CADEIA, como nos livros ══
     a cadeia: os carbonos e os heteroátomos ENTRE carbonos (com 2+ vizinhos de carbono, ou num anel)
     aberta/fechada · normal/ramificada · homogênea/heterogênea · insaturações (duplas/triplas C–C) · aromática
     e a FORMA, sem as posições: o tamanho da cadeia principal (a mais longa; no empate, a de mais ramos) e
     os tamanhos dos ramos; nos anéis, os tamanhos dos anéis e dos ramos presos a eles */
  function classificarCadeia(m, g) {
    var n = m.els.length, el = m.els, naCadeia = [];
    var aneisIdx = Q3.Geometria.aneisMinimos(g).map(function (r) { var ids = g.pesados(); return r.map(function (id) { return ids.indexOf(id); }); });
    var emAnel = {}; aneisIdx.forEach(function (r) { r.forEach(function (k) { emAnel[k] = 1; }); });
    for (var i = 0; i < n; i++) {
      var vizC = 0; for (var j = 0; j < n; j++) if (m.ord[i][j] && el[j] === 'C') vizC++;
      naCadeia[i] = el[i] === 'C' || ((el[i] === 'O' || el[i] === 'N') && (vizC >= 2 || emAnel[i]));
    }
    var viz = function (i) { var v = []; for (var j = 0; j < n; j++) if (m.ord[i][j] && naCadeia[j]) v.push(j); return v; };
    var d = 0, t = 0; for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) if (el[a] === 'C' && el[b] === 'C') { if (m.ord[a][b] === 2) d++; if (m.ord[a][b] === 3) t++; }
    var aromatica = aneisIdx.some(function (r) { if (r.length !== 6 || r.some(function (k) { return el[k] !== 'C'; })) return false; var dd = 0; for (var x = 0; x < 6; x++) for (var y = x + 1; y < 6; y++) if (m.ord[r[x]][r[y]] === 2) dd++; return dd === 3; });
    var heterogenea = false; for (var h = 0; h < n; h++) if (naCadeia[h] && el[h] !== 'C') heterogenea = true;
    var aberta = !aneisIdx.length, ramificada = false, forma;
    var tamanhoRamo = function (ini, de) { var vis = {}; vis[de] = 1; vis[ini] = 1; var fila = [ini], k = 0; while (fila.length) { var x = fila.shift(); k++; viz(x).forEach(function (y) { if (!vis[y]) { vis[y] = 1; fila.push(y); } }); } return k; };
    if (aberta) {
      // a cadeia principal: a mais longa; no empate, a de mais ramos (e depois a de ramos maiores)
      var idsC = []; for (var q = 0; q < n; q++) if (naCadeia[q]) idsC.push(q);
      var caminho = function (s0, t0) { var pai = {}; pai[s0] = -1; var fila = [s0]; while (fila.length) { var x = fila.shift(); viz(x).forEach(function (y) { if (!(y in pai)) { pai[y] = x; fila.push(y); } }); } if (!(t0 in pai)) return null; var out = []; for (var y = t0; y !== -1; y = pai[y]) out.unshift(y); return out; };
      var melhor = null;
      idsC.forEach(function (s0) { idsC.forEach(function (t0) {
        if (t0 < s0) return; var c = caminho(s0, t0); if (!c) return;
        var ramos = []; c.forEach(function (x) { viz(x).forEach(function (y) { if (c.indexOf(y) < 0) ramos.push(tamanhoRamo(y, x)); }); });
        ramos.sort(function (p1, p2) { return p2 - p1; });
        var chave = [c.length, ramos.length].concat(ramos);
        if (!melhor || chave.some(function (v, k) { return v !== melhor.chave[k]; }) && (function () { for (var k = 0; k < Math.max(chave.length, melhor.chave.length); k++) { var a1 = chave[k] || 0, b1 = melhor.chave[k] || 0; if (a1 !== b1) return a1 > b1; } return false; })()) melhor = { chave: chave, c: c, ramos: ramos };
      }); });
      ramificada = !!(melhor && melhor.ramos.length);
      forma = 'A' + (melhor ? melhor.c.length + '[' + melhor.ramos.join(',') + ']' : '0');
      var desc = melhor ? 'cadeia principal de ' + melhor.c.length + (melhor.ramos.length ? ' com ' + (melhor.ramos.length === 1 ? 'um ramo de ' + melhor.ramos[0] : melhor.ramos.length + ' ramos (' + melhor.ramos.join(', ') + ')') : ' sem ramos') : '—';
    } else {
      var tamAneis = aneisIdx.map(function (r) { return r.length; }).sort(), ramosAnel = [];
      aneisIdx.forEach(function (r) { r.forEach(function (x) { viz(x).forEach(function (y) { if (!emAnel[y]) ramosAnel.push(tamanhoRamo(y, x)); }); }); });
      ramosAnel.sort(function (p1, p2) { return p2 - p1; });
      ramificada = ramosAnel.length > 0;
      forma = 'F' + tamAneis.join('+') + '[' + ramosAnel.join(',') + ']';
      var desc = 'anel de ' + tamAneis.join(' e ') + (ramosAnel.length ? ' com ' + (ramosAnel.length === 1 ? 'um ramo de ' + ramosAnel[0] : ramosAnel.length + ' ramos (' + ramosAnel.join(', ') + ')') : ' sem ramos');
    }
    return { aberta: aberta, aromatica: aromatica, ramificada: ramificada, heterogenea: heterogenea, insat: d + '/' + t, forma: forma, descForma: desc };
  }
  function descInsat(x) { var p = x.split('/'), d = +p[0], t = +p[1], o = []; if (t) o.push(t === 1 ? 'uma tripla' : t + ' triplas'); if (d) o.push(d === 1 ? 'uma dupla' : d === 2 ? 'duas duplas' : d + ' duplas'); return o.join(' e ') || 'nenhuma'; }
  I.classificarCadeia = function (g) { return classificarCadeia(I.matrizDe(g), g); };

  I.classificar = function (gA, gB) {
    var fA = formulaDe(gA), fB = formulaDe(gB);
    if (fA !== fB) return { veredito: 'formulas', texto: 'Fórmulas diferentes (' + fA + ' e ' + fB + '): não são isômeros.' };
    var mA = I.matrizDe(gA), mB = I.matrizDe(gB), cA = I.canonicaMatriz(mA), cB = I.canonicaMatriz(mB);
    if (cA === cB) return { veredito: 'mesma', texto: 'Mesma molécula: os desenhos são diferentes, mas os átomos estão ligados do mesmo jeito.' };
    var tipo, texto, nota = '';
    if (tautomerosEnol(mA).indexOf(cB) >= 0 || tautomerosEnol(mB).indexOf(cA) >= 0) { tipo = 'tautomeria'; texto = 'Tautomeria: um vira o outro passando um H do carbono para o oxigênio (ceto ⇄ enol); os dois coexistem em equilíbrio.'; }
    else {
      // a função (o tipo de amina e de amida conta: 1ª × 2ª × 3ª é isomeria de função; o de álcool,
      // primário/secundário/terciário, é o mesmo grupo em outra posição e NÃO conta)
      var fun = function (g) { return Q3.Funcoes.detectar(g).grupos.map(function (x) { return x.id + (x.tipo && (x.id === 'amina' || x.id === 'amida') ? ':' + x.tipo : ''); }).sort().join(','); };
      var FA = fun(gA), FB = fun(gB);
      /* HIDROCARBONETOS têm todos a mesma função (critério dos vestibulares tradicionais):
         alcino × alcadieno NÃO é isomeria de função — a diferença é o tipo de insaturação
         da cadeia, e isso é isomeria de CADEIA (decisão do professor). A divergência entre
         materiais fica registrada na nota do veredito. */
      if (FA !== FB) { tipo = 'função'; texto = 'Isômeros de função: os grupos funcionais são diferentes.'; }
      if (!tipo) {
        /* A HIERARQUIA DA ISOMERIA PLANA: função (ou tautomeria) > CADEIA > posição (ou metameria).
           A cadeia que se classifica é a dos livros: carbonos e os heteroátomos ENTRE carbonos (o O do éter
           e do éster, o N da amina); OH, =O, halogênios e NH2 são grupos presos a ela, não cadeia. */
        var cA = classificarCadeia(mA, gA), cB = classificarCadeia(mB, gB), dif = [];
        if (cA.aberta !== cB.aberta) dif.push('aberta × fechada');
        if (cA.aromatica !== cB.aromatica) dif.push('aromática × não aromática');
        if (cA.ramificada !== cB.ramificada) dif.push('normal × ramificada');
        if (cA.heterogenea !== cB.heterogenea) dif.push('homogênea × heterogênea');
        if (cA.insat !== cB.insat) dif.push(cA.insat === '0/0' || cB.insat === '0/0' ? 'saturada × insaturada' : 'insaturações de tipos diferentes (' + descInsat(cA.insat) + ' × ' + descInsat(cB.insat) + ')');
        if (dif.length) {
          tipo = 'cadeia'; texto = 'Isômeros de cadeia: mesma função, cadeias de tipos diferentes — ' + dif.join('; ') + '. A diferença de cadeia vem antes da de posição.';
          var alcino = function (c) { var t = c.insat.split('/'); return +t[1] > 0 && +t[0] === 0; }, dieno = function (c) { var t = c.insat.split('/'); return +t[0] >= 2 && +t[1] === 0; };
          if (cA.aberta && cB.aberta && ((alcino(cA) && dieno(cB)) || (dieno(cA) && alcino(cB)))) nota = 'Alguns materiais chamam este par de isomeria de função, tratando alcinos e alcadienos como subfunções dos hidrocarbonetos.';
        } else if (cA.forma !== cB.forma) {
          // o mesmo tipo de cadeia, mas não só o LUGAR muda: a cadeia principal ou os ramos são outros
          tipo = 'cadeia'; texto = 'Isômeros de cadeia: mesma função e o mesmo tipo de cadeia, mas esqueletos diferentes — ' + cA.descForma + ' × ' + cB.descForma + '. Não é só o lugar que muda.';
        } else {
          var het = function (m) { for (var i = 0; i < m.els.length; i++) if ((m.els[i] === 'O' || m.els[i] === 'N') && m.ord[i].filter(function (o, v) { return o && m.els[v] === 'C'; }).length >= 2) return i; return -1; };
          var hA2 = het(mA), hB2 = het(mB);
          if (hA2 >= 0 && hB2 >= 0 && ladosDoHeteroatomo(mA, hA2) !== ladosDoHeteroatomo(mB, hB2)) { tipo = 'metameria'; texto = 'Metameria (compensação): mesma função e o mesmo tipo de cadeia (heterogênea); muda só o lugar do heteroátomo na cadeia.'; }
          else { tipo = 'posição'; texto = 'Isômeros de posição: mesma função e o mesmo tipo de cadeia; muda só o lugar do grupo, da insaturação ou da ramificação.'; }
        }
      }
    }
    return { veredito: 'isomeros', subtipo: tipo, texto: texto, nota: nota, formula: fA };
  };

})(typeof window !== 'undefined' ? window : globalThis);
