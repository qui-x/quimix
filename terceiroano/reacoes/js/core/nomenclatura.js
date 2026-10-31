/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/nomenclatura.js
   ───────────────────────────────────────────────────────────────
   MOTOR DE NOMENCLATURA (SIFO, Módulo 2) — nome IUPAC a partir da
   ESTRUTURA (Caminho B da especificação: nunca montar peças soltas).

   ESCOPO DO MÓDULO 2 (especificação: 1 grupo, 1 ramificação)
     · cadeia aberta;
     · no máximo 1 grupo funcional entre: álcool, aldeído, cetona,
       ácido carboxílico, amina primária, nitrila, amida primária,
       haleto (este sempre como prefixo);
     · no máximo 1 ramificação, alquila linear (metil, etil, propil…);
     · no máximo 1 insaturação (C=C ou C≡C), na cadeia principal.
     Fora disso, `ok: false` e o MOTIVO — com dois grupos, a estrutura fica fora
     (prioridade); éster, éter e aminas secundárias têm nome em duas
     partes e ficam para depois.

   CADEIA PRINCIPAL — a regra dos livros brasileiros (e do ENEM):
     1. contém o carbono do grupo principal;
     2. tem o MÁXIMO de insaturações;
     3. é a mais LONGA;
     4. tem o máximo de substituintes.
     A recomendação IUPAC de 2013 inverteu 2 e 3 (a mais longa primeiro).
     Quando isso muda o nome, o motor avisa em `nota2013`.

   NUMERAÇÃO: menor localizador para o grupo principal; depois para a
   insaturação; depois para os substituintes; no empate, o primeiro em
   ordem alfabética recebe o menor.

   O NOME
     nome ........ formato atual, localizadores junto do que indicam, e
                   sempre citados (butan-2-ol, propan-2-ona, 2-metilpropano)
                   — menos onde a própria IUPAC os omite: cadeias de 1 ou
                   2 carbonos (etanol) e grupos que só podem estar no C1
                   (butanal, ácido butanoico, butanonitrila, butanamida)
     curto ....... a forma dos livros quando o localizador não é necessário
                   (propanona, metilpropano) — ou null
     antigo ...... o formato anterior (2-butanol, 3-metil-2-butanol)
     pecas ....... o que o aluno monta: ramificação, halogênio, prefixo,
                   insaturação, sufixo — cada um com o localizador e se
                   ele é necessário

   Depende de: grafo-molecular.js, geometria-molecular.js,
   classificacao-cadeias.js, grupos-funcionais.js.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var N = Q3.Nomenclatura = {};

  N.PREFIXOS = ['', 'met', 'et', 'prop', 'but', 'pent', 'hex', 'hept', 'oct', 'non', 'dec'];
  N.RAMOS = { 1: 'metil', 2: 'etil', 3: 'propil', 4: 'butil', 5: 'pentil', 6: 'hexil', 7: 'heptil', 8: 'octil' };
  N.HALOGENIOS = { F: 'fluoro', Cl: 'cloro', Br: 'bromo', I: 'iodo' };
  N.SUFIXOS = { alcool: 'ol', aldeido: 'al', cetona: 'ona', acido: 'oico', amina: 'amina', nitrila: 'nitrila', amida: 'amida' };
  var TERMINAL = { aldeido: 1, acido: 1, nitrila: 1, amida: 1 };
  var FORA_DUAS_PARTES = { ester: 'éster', anidrido: 'anidrido', haletoAcila: 'haleto de ácido' };
  /* o ÉTER entra pela nomenclatura substitutiva da IUPAC: a cadeia mais
     longa é a principal; o outro lado do O vira o prefixo alcóxi
     (CH3–O–CH2–CH3 = metoxietano). */
  N.ALCOXI = { 1: 'metoxi', 2: 'etoxi', 3: 'propoxi', 4: 'butoxi', 5: 'pentiloxi', 6: 'hexiloxi', 7: 'heptiloxi' };   // do pentil em diante, a forma completa (IUPAC)

  function fora(motivo, destino) { return { ok: false, motivo: motivo, destino: destino || null }; }

  N.nomear = function (g, opts) {
    var el = function (id) { return g.atomos[id].el; };
    var pesados = g.pesados();
    if (!pesados.length) return fora('Nada para nomear ainda.');
    var carbonos = pesados.filter(function (id) { return el(id) === 'C'; });
    if (!carbonos.length) return fora('Sem carbono, não é composto orgânico.');

    // ── o grupo funcional (motor do Módulo 1)
    var det = Q3.Funcoes.detectar(g);
    if (det.fora.length) return fora('Há um grupo fora do catálogo: ' + det.fora[0].nome + '.');
    var gs = det.grupos.filter(function (x) { return x.id !== 'hidrocarboneto'; });
    // anel-substituinte (fenil, ciclo-hexil…): os átomos do anel ficam FORA da busca de cadeia
    var excl = (opts && opts.excluir) || {};
    carbonos = carbonos.filter(function (c) { return !excl[c]; });
    if (gs.length > 1) return fora('Há ' + gs.length + ' grupos funcionais: fica fora do escopo do Módulo 2.');
    var gr = gs[0] || null;
    var aneisG = Q3.Geometria.aneisMinimos(g);
    if (aneisG.length && !(opts && opts.excluir)) return nomearComAnel(g, gr, aneisG);
    if (gr && (FORA_DUAS_PARTES[gr.id] || ((gr.id === 'amina' || gr.id === 'amida') && gr.tipo !== 'primária' && gr.tipo !== 'heterocíclica aromática'))) return nomearPorPartes(g, gr);
    if (gr && gr.id === 'fenol') return fora('O fenol tem anel aromático: fica para a nomenclatura de cadeias fechadas.');
    if (gr && gr.tipo === 'heterocíclica aromática') return fora('O N está num anel aromático: fica para a nomenclatura de cadeias fechadas.');

    // carbono do grupo principal (o do sufixo) e o halogênio (sempre prefixo)
    var principal = gr && gr.id !== 'haleto' && gr.id !== 'eter' ? gr : null;   // haleto e éter: só prefixo
    var oEter = gr && gr.id === 'eter' ? gr.centro : null;
    var cGrupo = null;
    if (principal) {
      if (TERMINAL[principal.id] || principal.id === 'cetona') cGrupo = principal.centro;
      else cGrupo = g.vizinhos(principal.centro).filter(function (v) { return el(v.id) === 'C'; })[0].id;   // C do OH / do NH2
    }

    // ── árvore de carbonos
    var vizC = {};
    carbonos.forEach(function (c) { vizC[c] = g.vizinhos(c).filter(function (v) { return el(v.id) === 'C' && !excl[v.id]; }).map(function (v) { return v.id; }); });
    var caminho = function (a, b) {
      var pai = {}; pai[a] = null; var fila = [a];
      while (fila.length) { var x = fila.shift(); if (x === b) break; vizC[x].forEach(function (y) { if (!(y in pai)) { pai[y] = x; fila.push(y); } }); }
      var out = []; for (var y = b; y !== null && y !== undefined; y = pai[y]) out.unshift(y);
      return out;
    };

    // ── candidatas: o caminho entre cada par de carbonos (numa árvore, é único)
    var melhor = null, candidatos = [];
    for (var i = 0; i < carbonos.length; i++) for (var j = i; j < carbonos.length; j++) {
      var ch = caminho(carbonos[i], carbonos[j]);
      if (ch[0] !== carbonos[i]) continue;                  // lados diferentes do O do éter: não há caminho de carbonos
      if (principal && ch.indexOf(cGrupo) < 0) continue;
      [ch, ch.slice().reverse()].forEach(function (dir, k) {
        if (i === j && k === 1) return;
        var av = avaliar(dir); if (av) candidatos.push(av);
      });
    }
    function avaliar(cad) {
      var pos = {}; cad.forEach(function (id, k) { pos[id] = k + 1; });
      if (principal && TERMINAL[principal.id] && pos[cGrupo] !== 1) return null;
      // insaturações da cadeia
      var mult = [];
      for (var k = 0; k + 1 < cad.length; k++) { var l = g.ligacao(cad[k], cad[k + 1]); if (l.ordem > 1) mult.push({ loc: k + 1, ordem: l.ordem }); }
      // substituintes: ramos de carbono e halogênios presos à cadeia
      var subs = [], problema = null;
      cad.forEach(function (id) {
        g.vizinhos(id).forEach(function (v) {
          if (pos[v.id]) return;
          if (excl[v.id]) { if (opts && id === opts.anelEm) subs.push({ loc: pos[id], nome: opts.nomeAnel, tipo: 'ramificacao', tam: 0 }); return; }
          var e = el(v.id);
          if (e === 'C') {
            // o ramo inteiro, sem voltar à cadeia
            var ramo = [v.id], vistos = {}; vistos[id] = 1; vistos[v.id] = 1;
            for (var q = 0; q < ramo.length; q++) g.vizinhos(ramo[q]).forEach(function (w) { if (!vistos[w.id]) { vistos[w.id] = 1; if (excl[w.id]) problema = 'um anel preso a uma ramificação'; else if (el(w.id) === 'C') ramo.push(w.id); else problema = 'um grupo preso à ramificação'; } });
            var linear = ramo.every(function (x) { return vizC[x].filter(function (y) { return !pos[y]; }).length <= (x === v.id ? 1 : 2); });
            var insat = false; ramo.forEach(function (x) { g.vizinhos(x).forEach(function (w) { if (w.ordem > 1) insat = true; }); });
            if (insat) problema = 'uma insaturação na ramificação';
            else if (!linear || !N.RAMOS[ramo.length]) problema = 'uma ramificação que é ela mesma ramificada';
            subs.push({ loc: pos[id], nome: N.RAMOS[ramo.length] || '?', tipo: 'ramificacao', tam: ramo.length });
          } else if (N.HALOGENIOS[e]) subs.push({ loc: pos[id], nome: N.HALOGENIOS[e], tipo: 'halogenio' });
          else if (v.id === oEter) {
            // o outro lado do O: um grupo alcóxi linear, preso pela ponta
            var c0 = g.vizinhos(oEter).filter(function (w) { return w.id !== id && el(w.id) === 'C'; })[0].id;
            var lado = [c0], vistosA = {}; vistosA[c0] = 1;
            for (var qa = 0; qa < lado.length; qa++) vizC[lado[qa]].forEach(function (w) { if (!vistosA[w]) { vistosA[w] = 1; lado.push(w); } });
            var linearA = vizC[c0].length <= 1 && lado.every(function (x) { return vizC[x].length <= 2; });
            var insatA = lado.some(function (x) { return g.vizinhos(x).some(function (w) { return w.ordem > 1; }); });
            if (insatA) problema = 'uma insaturação no grupo alcóxi';
            else if (!linearA || !N.ALCOXI[lado.length]) problema = 'um grupo alcóxi ramificado ou longo demais';
            subs.push({ loc: pos[id], nome: N.ALCOXI[lado.length] || '?', tipo: 'alcoxi', tam: lado.length });
          }
        });
      });
      var totalMult = 0; g.ligacoes.forEach(function (l) { if (l.ordem > 1 && el(l.a) === 'C' && el(l.b) === 'C' && !excl[l.a] && !excl[l.b]) totalMult++; });
      return { cad: cad, pos: pos, mult: mult, subs: subs, problema: problema, foraDaCadeia: totalMult - mult.length,
               lg: principal ? pos[cGrupo] : 0 };
    }
    // ordem: + insaturações · + comprimento · + substituintes · menor loc do grupo · das insaturações · dos substituintes · alfabética
    var lex = function (a, b) { for (var k = 0; k < Math.max(a.length, b.length); k++) { var x = a[k] === undefined ? -1 : a[k], y = b[k] === undefined ? -1 : b[k]; if (x !== y) return x - y; } return 0; };
    candidatos.sort(function (a, b) {
      return (b.mult.length - a.mult.length) || (b.cad.length - a.cad.length) || (b.subs.length - a.subs.length) || (a.lg - b.lg) ||
        lex(a.mult.map(function (m) { return m.loc; }), b.mult.map(function (m) { return m.loc; })) ||
        lex(a.subs.map(function (s) { return s.loc; }).sort(function (x, y) { return x - y; }), b.subs.map(function (s) { return s.loc; }).sort(function (x, y) { return x - y; })) ||
        lex(a.subs.slice().sort(porNome).map(function (s) { return s.loc; }), b.subs.slice().sort(porNome).map(function (s) { return s.loc; }));
    });
    function porNome(x, y) { return x.nome < y.nome ? -1 : x.nome > y.nome ? 1 : 0; }
    melhor = candidatos[0];
    if (!melhor) return fora('Não achei a cadeia principal.');

    // ── escopo
    if (melhor.problema) return fora('Há ' + melhor.problema + ': fica fora do escopo do Módulo 2.');
    if (melhor.foraDaCadeia > 0) return fora('Há uma insaturação fora da cadeia principal: fica fora do escopo do Módulo 2.');
    if (melhor.mult.length > 1) return fora('Há mais de uma insaturação: o Módulo 2 trabalha com uma só.');
    var ramos = melhor.subs.filter(function (s) { return s.tipo === 'ramificacao'; });
    if (ramos.length > 1) return fora('Há ' + ramos.length + ' ramificações: o Módulo 2 trabalha com uma só.');
    var n = melhor.cad.length;
    if (!N.PREFIXOS[n]) return fora('A cadeia principal tem mais de 10 carbonos.');

    // ── as peças
    var insat = melhor.mult[0] || null;
    var infixo = !insat ? 'an' : insat.ordem === 2 ? 'en' : 'in';
    var sufixo = principal ? N.SUFIXOS[principal.id] : 'o';
    var subs = melhor.subs.slice().sort(porNome);
    // localizadores que a IUPAC omite: cadeia de 1–2 C; grupo terminal (sempre C1)
    var itens = subs.length + (insat ? 1 : 0) + (principal && !TERMINAL[principal.id] ? 1 : 0);
    // cadeia de 1 carbono: nunca há localizador. De 2: só se houver dois itens ALÉM da insaturação
    // (metoxieteno, cloroeteno, etanol; mas 1- e 2-feniletanol são compostos diferentes)
    var curta = n === 1 || (n === 2 && itens - (insat ? 1 : 0) <= 1);
    var simetrica = !(principal && TERMINAL[principal.id]);
    // o localizador é NECESSÁRIO se, com este item sozinho, outra posição daria outro composto
    var necessario = function (tipo, tam) {
      if (curta) return false;
      if (itens > 1) return true;
      var validas;
      if (tipo === 'cetona') validas = rango(2, n - 1);
      else if (tipo === 'insat') validas = rango(1, n - 1);
      else if (tipo === 'ramificacao') validas = rango(tam + 1, n - tam);
      else validas = rango(1, n);
      var distintas = {};
      validas.forEach(function (p) {
        var espelho = tipo === 'insat' ? n - p : n + 1 - p;
        distintas[simetrica ? Math.min(p, espelho) : p] = 1;
      });
      return Object.keys(distintas).length > 1;
    };
    function rango(a, b) { var r = []; for (var x = a; x <= b; x++) r.push(x); return r; }

    var pecas = {
      ramificacao: null, halogenio: null, alcoxi: null,
      prefixo: N.PREFIXOS[n], carbonos: n,
      // no eteno/etino a insaturação só tem uma posição: o localizador nunca é citado (1,2-dicloroeteno)
      insaturacao: { infixo: infixo, loc: insat ? insat.loc : null, necessario: insat && n > 2 ? necessario('insat') : false },
      sufixo: { nome: sufixo, grupo: principal ? principal.id : (gr ? gr.id : 'hidrocarboneto'),
                loc: principal && !TERMINAL[principal.id] ? melhor.lg : null,
                necessario: principal && !TERMINAL[principal.id] ? necessario(principal.id === 'cetona' ? 'cetona' : 'grupo') : false }
    };
    subs.forEach(function (s) {
      var p = { nome: s.nome, loc: s.loc, necessario: necessario(s.tipo, s.tam) };
      if (s.tipo === 'ramificacao') pecas.ramificacao = p; else if (s.tipo === 'alcoxi') pecas.alcoxi = p; else pecas.halogenio = p;
    });

    // ── o nome
    var montar = function (comLoc) {
      var L = function (peca, sempre) { return peca && (sempre || peca.necessario || (comLoc && !curta)) ? peca.loc : null; };
      var pre = subs.map(function (s) {
        var p = s.tipo === 'ramificacao' ? pecas.ramificacao : s.tipo === 'alcoxi' ? pecas.alcoxi : pecas.halogenio, l = L(p);
        return (l ? l + '-' : '') + s.nome;
      }).join('-');
      var lInsat = insat && n > 2 ? L(pecas.insaturacao) : null, lGrupo = pecas.sufixo.loc ? L(pecas.sufixo) : null;
      var mae = N.PREFIXOS[n] + (lInsat ? '-' + lInsat + '-' : '') + infixo;
      var nome;
      if (sufixo === 'o') nome = mae + 'o';
      else if (sufixo === 'nitrila') nome = mae + 'onitrila';
      else nome = mae + (lGrupo ? '-' + lGrupo + '-' : '') + sufixo;
      nome = pre + nome;
      return principal && principal.id === 'acido' ? 'ácido ' + nome : nome;
    };
    var nome = montar(true), curto = montar(false);
    // formato antigo: localizadores na frente (2-butanol; 3-buten-2-ol)
    var antigo = (function () {
      var pre = subs.map(function (s) { var p = s.tipo === 'ramificacao' ? pecas.ramificacao : s.tipo === 'alcoxi' ? pecas.alcoxi : pecas.halogenio; return (!curta ? p.loc + '-' : '') + s.nome; }).join('-');
      var lInsat = insat && !curta && n > 2 ? insat.loc : null, lGrupo = pecas.sufixo.loc && !curta ? pecas.sufixo.loc : null;
      var raizN = N.PREFIXOS[n] + infixo;
      var fim = sufixo === 'o' ? 'o' : sufixo === 'nitrila' ? 'onitrila' : sufixo;
      var s;
      if (lInsat && lGrupo) s = lInsat + '-' + raizN + '-' + lGrupo + '-' + fim;
      else if (lInsat || lGrupo) s = (lInsat || lGrupo) + '-' + raizN + fim;
      else s = raizN + fim;
      s = pre ? pre + (/^\d/.test(s) ? '-' : '') + s : s;
      return principal && principal.id === 'acido' ? 'ácido ' + s : s;
    })();

    // ── a regra de 2013 escolheria outra cadeia? (a mais longa, antes das insaturações)
    var nota2013 = null;
    var maisLonga = candidatos.slice().sort(function (a, b) { return b.cad.length - a.cad.length; })[0];
    if (maisLonga && maisLonga.cad.length > n)
      nota2013 = 'Pela recomendação IUPAC de 2013, a cadeia principal seria a mais longa (' + maisLonga.cad.length + ' carbonos), mesmo sem a ligação ' + (insat && insat.ordem === 3 ? 'tripla' : 'dupla') + ' — e o nome mudaria. Aqui vale a regra dos livros: a cadeia contém a insaturação.';

    var numeracao = {}; melhor.cad.forEach(function (id, k) { numeracao[id] = k + 1; });
    return { ok: true, nome: nome, curto: curto !== nome ? curto : null, antigo: antigo !== nome ? antigo : null,
             pecas: pecas, cadeia: melhor.cad, numeracao: numeracao, grupo: pecas.sufixo.grupo, nota2013: nota2013 };
  };

  /* ═══ ANÉIS ═══════════════════════════════════════════════════════
     Anéis de carbono (3 a 8, com ou sem uma dupla), benzeno e derivados,
     heterociclos de O e de N (3 a 6) e os aromáticos furano, pirrol e
     piridina. Um anel só, com até dois grupos presos a ele.
       · o ANEL é a cadeia principal — a não ser que o grupo principal esteja
         numa cadeia lateral: aí a cadeia manda e o anel vira substituinte
         (fenilmetanol, 2-feniletan-1-ol, 1-feniletan-1-ona);
       · grupo de carbono preso ao anel: carbaldeído, carboxílico,
         carbonitrila, carboxamida (ciclo-hexanocarbaldeído);
       · benzeno: nomes consagrados — fenol, anilina, benzaldeído, ácido
         benzoico, benzonitrila, benzamida; orto/meta/para no formato antigo;
       · heterociclo: o heteroátomo é o 1.
     Numeração: grupo principal no 1; depois a dupla; depois os
     substituintes (menores localizadores); no empate, a ordem alfabética. */
  N.HETEROCICLOS = { O: { 3: 'oxirano', 4: 'oxetano', 5: 'oxolano', 6: 'oxano' }, N: { 3: 'aziridina', 4: 'azetidina', 5: 'pirrolidina', 6: 'piperidina' } };
  N.HETERO_AROM = { O5: 'furano', N5: 'pirrol', N6: 'piridina' };
  N.RAMOS_ANEL = { 3: 'ciclopropil', 4: 'ciclobutil', 5: 'ciclopentil', 6: 'ciclo-hexil', 7: 'ciclo-heptil', 8: 'ciclo-octil' };
  N.BENZENO = { fenol: 'fenol', amina: 'anilina', aldeido: 'benzaldeído', acido: 'ácido benzoico', nitrila: 'benzonitrila', amida: 'benzamida' };
  var CARBO_SUF = { aldeido: 'carbaldeído', acido: 'carboxílico', nitrila: 'carbonitrila', amida: 'carboxamida' };
  N.ciclo = function (pref) { return 'ciclo' + (/^[ho]/.test(pref) ? '-' : '') + pref; };   // ciclo-hexano, ciclo-octano

  function nomearComAnel(g, gr, aneis) {
    var el = function (id) { return g.atomos[id].el; };
    if (aneis.length > 1) return fora('Há mais de um anel: fica fora do escopo do Módulo 2.');
    var conj = aneis[0], emAnel = {}; conj.forEach(function (id) { emAnel[id] = 1; });
    var ordem = [conj[0]];
    while (ordem.length < conj.length) {
      var ult = ordem[ordem.length - 1];
      var prox = g.vizinhos(ult).map(function (v) { return v.id; }).filter(function (id) { return emAnel[id] && ordem.indexOf(id) < 0; })[0];
      if (prox === undefined) break; ordem.push(prox);
    }
    var n = ordem.length, heteros = ordem.filter(function (id) { return el(id) !== 'C'; });
    if (n > 8) return fora('Anel com mais de 8 átomos: fica fora do escopo do Módulo 2.');
    if (heteros.length > 1 || heteros.some(function (id) { return el(id) !== 'O' && el(id) !== 'N'; })) return fora('Anel com mais de um heteroátomo (ou com S): fica fora do escopo do Módulo 2.');
    var het = heteros[0] || null, duplas = [];
    for (var k = 0; k < n; k++) { var ob = g.ligacao(ordem[k], ordem[(k + 1) % n]).ordem; if (ob === 3) return fora('Ligação tripla num anel: fica fora do escopo.'); if (ob === 2) duplas.push(k); }
    var benzeno = !het && n === 6 && duplas.length === 3;
    var aromHet = !!het && ((n === 5 && duplas.length === 2) || (n === 6 && el(het) === 'N' && duplas.length === 3));
    var arom = benzeno || aromHet;
    if (!arom && duplas.length > 1) return fora('Mais de uma insaturação: o Módulo 2 trabalha com uma só.');
    if (het && !arom && duplas.length) return fora('Heterociclo com uma ligação dupla (di-hidro…): fica fora do escopo do Módulo 2.');
    if (het && !N.HETEROCICLOS[el(het)][n] && !arom) return fora('Heterociclo de tamanho fora do escopo.');
    // o que se prende a cada átomo do anel
    var grAt = {}; if (gr) gr.atomos.forEach(function (a) { grAt[a] = 1; });
    var presos = [], problema = null, cadeiaLat = null;
    var ladoDe = function (a, v) { var lado = [v], vis = {}; vis[a] = 1; vis[v] = 1; for (var q = 0; q < lado.length; q++) g.vizinhos(lado[q]).forEach(function (w) { if (!vis[w.id]) { vis[w.id] = 1; lado.push(w.id); } }); return lado; };
    var alquil = function (lado, c0) {
      if (lado.some(function (x) { return el(x) !== 'C'; })) return 0;
      var vz = function (x) { return g.vizinhos(x).filter(function (v) { return lado.indexOf(v.id) >= 0; }).length; };
      if (vz(c0) > 1 || lado.some(function (x) { return vz(x) > 2; }) || lado.some(function (x) { return g.vizinhos(x).some(function (v) { return v.ordem > 1; }); })) return 0;
      return lado.length;
    };
    ordem.forEach(function (a, i) {
      g.vizinhos(a).forEach(function (v) {
        if (emAnel[v.id]) return;
        var e = el(v.id), lado = ladoDe(a, v.id);
        if (a === het && e !== 'C') { problema = 'um átomo preso ao heteroátomo do anel (N–O, N–X…)'; return; }
        if (e === 'C' && a === het) {
          var mh = alquil(lado, v.id);
          if (!mh || !N.RAMOS[mh]) problema = 'um grupo preso ao heteroátomo que é ramificado ou longo demais'; else presos.push({ idx: i, tipo: 'ramificacao', nome: N.RAMOS[mh] });
          return;
        }
        if (e === 'C') {
          if (gr && CARBO_SUF[gr.id] && gr.centro === v.id && lado.every(function (x) { return grAt[x]; })) { presos.push({ idx: i, tipo: 'grupo', suf: CARBO_SUF[gr.id], carbono: true }); return; }
          if (lado.some(function (x) { return grAt[x]; })) { cadeiaLat = { a: a, v: v.id, lado: lado }; return; }
          var m = alquil(lado, v.id);
          if (!m || !N.RAMOS[m]) { problema = 'um grupo preso ao anel que é ramificado, insaturado ou longo demais'; return; }
          presos.push({ idx: i, tipo: 'ramificacao', nome: N.RAMOS[m] });
        } else if (e === 'O') {
          if (v.ordem === 2) presos.push({ idx: i, tipo: 'grupo', suf: 'ona' });
          else if (lado.length === 1) presos.push({ idx: i, tipo: 'grupo', suf: 'ol' });
          else { var c1 = lado[1], ladoO = ladoDe(v.id, c1), mo = alquil(ladoO, c1); if (!mo || !N.ALCOXI[mo]) problema = 'um grupo alcóxi ramificado ou longo demais'; else presos.push({ idx: i, tipo: 'alcoxi', nome: N.ALCOXI[mo] }); }
        } else if (e === 'N') {
          if (lado.length === 1) presos.push({ idx: i, tipo: 'grupo', suf: 'amina' });
          else problema = 'uma amina com grupo no N presa ao anel';
        } else if (N.HALOGENIOS[e]) presos.push({ idx: i, tipo: 'halogenio', nome: N.HALOGENIOS[e] });
        else problema = 'um átomo fora do escopo preso ao anel';
      });
    });
    if (problema) return fora('Há ' + problema + ': fica fora do escopo do Módulo 2.');
    // ── o grupo principal está numa cadeia lateral: a cadeia manda, o anel vira substituinte
    if (cadeiaLat) {
      if (presos.length) return fora('O anel tem outro grupo além da cadeia com a função: fica fora do escopo do Módulo 2.');
      var nomeAnel = benzeno ? 'fenil' : (!het && !duplas.length ? N.RAMOS_ANEL[n] : null);
      if (!nomeAnel) return fora('Esse anel como substituinte fica fora do escopo do Módulo 2.');
      return N.nomear(g, { excluir: emAnel, anelEm: cadeiaLat.v, nomeAnel: nomeAnel });
    }
    var grupoP = presos.filter(function (x) { return x.tipo === 'grupo'; });
    var prefixos = presos.filter(function (x) { return x.tipo !== 'grupo'; });
    if (grupoP.length > 1) return fora('Há mais de um grupo no anel: fica fora do escopo do Módulo 2.');
    if (prefixos.filter(function (x) { return x.tipo === 'ramificacao'; }).length > 1) return fora('Há mais de uma ramificação: o Módulo 2 trabalha com uma só.');
    if (prefixos.length > 2 || (grupoP.length && prefixos.length > 1)) return fora('Grupos demais no anel para o Módulo 2.');
    if (het && grupoP.length) return fora('Heterociclo com outro grupo funcional: fica fora do escopo do Módulo 2.');
    if (arom && grupoP.some(function (x) { return x.suf === 'ona'; })) return fora('Fora do escopo.');
    // ── a numeração: o grupo (ou o heteroátomo) no 1; depois a dupla; depois os prefixos
    var principalIdx = het ? ordem.indexOf(het) : grupoP.length ? grupoP[0].idx : null;
    var melhor = null;
    for (var s0 = 0; s0 < n; s0++) [1, -1].forEach(function (dir) {
      var loc = function (idx) { return ((dir * (idx - s0)) % n + n) % n + 1; };
      if (principalIdx !== null && loc(principalIdx) !== 1) return;
      var ld = null;
      if (!arom && duplas.length) { var la = loc(duplas[0]), lb = loc((duplas[0] + 1) % n); if (Math.abs(la - lb) !== 1) return; ld = Math.min(la, lb); }
      var lp = prefixos.map(function (x) { return { nome: x.nome, loc: loc(x.idx), tipo: x.tipo }; });
      var chave = [ld || 0].concat(lp.map(function (x) { return x.loc; }).sort(function (a, b) { return a - b; }), lp.slice().sort(function (a, b) { return a.nome < b.nome ? -1 : 1; }).map(function (x) { return x.loc; }));
      var cand = { s0: s0, dir: dir, ld: ld, lp: lp, chave: chave };
      if (!melhor || lexMenor(cand.chave, melhor.chave)) melhor = cand;
    });
    function lexMenor(a, b) { for (var q = 0; q < a.length; q++) { if (a[q] !== b[q]) return a[q] < b[q]; } return false; }
    if (!melhor) return fora('Não achei uma numeração para o anel.');
    var locDe = function (idx) { return ((melhor.dir * (idx - melhor.s0)) % n + n) % n + 1; };
    var cadeia = ordem.slice().sort(function (a, b) { return locDe(ordem.indexOf(a)) - locDe(ordem.indexOf(b)); }), numeracao = {};
    cadeia.forEach(function (id, k3) { numeracao[id] = k3 + 1; });
    var itens = prefixos.length + grupoP.length + (!arom && duplas.length ? 1 : 0);
    var comLoc = itens >= 2 || !!het;
    var subs = melhor.lp.slice().sort(function (a, b) { return a.nome < b.nome ? -1 : 1; });
    var pre = function (ver) { return subs.map(function (x) { return (ver ? x.loc + '-' : '') + x.nome; }).join('-'); };
    var pecas = { anel: null, prefixo: '', carbonos: n, ramificacao: null, halogenio: null, alcoxi: null,
                  insaturacao: { infixo: 'an', loc: null, necessario: false }, sufixo: { nome: '', grupo: gr ? gr.id : 'hidrocarboneto', loc: null, necessario: false } };
    subs.forEach(function (x) { pecas[x.tipo === 'ramificacao' ? 'ramificacao' : x.tipo === 'alcoxi' ? 'alcoxi' : 'halogenio'] = { nome: x.nome, loc: x.loc, necessario: comLoc }; });
    var nome, curto = null, antigo = null;
    if (benzeno || het) {
      var mae = het ? (arom ? N.HETERO_AROM[el(het) + n] : N.HETEROCICLOS[el(het)][n]) : grupoP.length ? N.BENZENO[gr.id === 'fenol' ? 'fenol' : gr.id] : 'benzeno';
      pecas.anel = { tipo: 'nomeado', nome: mae };
      var montaB = function (m2, pr) { return /^ácido /.test(m2) ? 'ácido ' + pr + m2.replace(/^ácido /, '') : pr + m2; };
      nome = montaB(mae, pre(comLoc));
      if (mae === 'benzeno' && subs.length === 1 && subs[0].nome === 'metil') curto = 'tolueno';
      if (benzeno && grupoP.length && subs.length === 1) antigo = montaB(mae, { 2: 'o-', 3: 'm-', 4: 'p-' }[subs[0].loc] + subs[0].nome);
    } else {
      var base = function (ver) { return N.ciclo(N.PREFIXOS[n]) + (melhor.ld ? (ver ? '-' + melhor.ld + '-' : '') + 'en' : 'an'); };
      pecas.anel = { tipo: 'ciclo' }; pecas.prefixo = N.PREFIXOS[n];
      pecas.insaturacao = { infixo: melhor.ld ? 'en' : 'an', loc: melhor.ld, necessario: false };
      var suf = grupoP.length ? grupoP[0] : null;
      pecas.sufixo = { nome: suf ? suf.suf : 'o', grupo: gr ? gr.id : 'hidrocarboneto', loc: suf ? 1 : null, necessario: false };
      /* verPre: localizadores dos prefixos · verDupla: o da dupla · ver1: o "1" do sufixo.
         Nome completo: tudo citado quando há dois itens ou mais (ciclo-hex-2-en-1-ol,
         3-metilciclo-hex-1-eno). Forma curta, a dos livros: o "1" do sufixo cai, e o
         "1" da dupla cai quando não há sufixo (ciclo-hex-2-enol, 3-metilciclo-hexeno). */
      var monta = function (verPre, verDupla, ver1) {
        var b = N.ciclo(N.PREFIXOS[n]) + (melhor.ld ? (verDupla ? '-' + melhor.ld + '-' : '') + 'en' : 'an'), fim;
        if (!suf) fim = b + 'o';
        else if (suf.carbono) fim = b + 'o' + (ver1 ? '-1-' : '') + suf.suf;
        else fim = b + (ver1 ? '-1-' : '') + suf.suf;
        fim = pre(verPre) + fim;
        return suf && suf.suf === 'carboxílico' ? 'ácido ' + fim : fim;
      };
      nome = monta(comLoc, comLoc && !!melhor.ld, comLoc && !!suf);
      var c2 = monta(comLoc, comLoc && !!melhor.ld && !(melhor.ld === 1 && !suf), false);
      curto = c2 !== nome ? c2 : null;
    }
    return { ok: true, nome: nome, curto: curto, antigo: antigo, pecas: pecas, cadeia: cadeia, numeracao: numeracao, grupo: gr ? gr.id : 'hidrocarboneto', nota2013: null };
  }

  /* ═══ FUNÇÕES NOMEADAS POR PARTES ═══════════════════════════════
     Éster, haleto de ácido, anidrido, aminas e amidas com grupos no N:
     cada uma se reduz a uma função que o motor já nomeia.
       éster ............ o ÁCIDO (-ico → -ato) + "de" + o grupo alquila (-ila)
       haleto de ácido .. o halogênio no lugar do OH: -oico → -oíla
       anidrido ......... DOIS ácidos: "anidrido etanoico (propanoico)"
       amina 2ª e 3ª .... a amina primária da cadeia mais longa + N-alquila
       amida N-subst. ... a amida primária + N-alquila
     O grupo alquila (do éster e do N) é linear e preso pela ponta. */
  var ALQUILA = { 1: 'metila', 2: 'etila', 3: 'propila', 4: 'butila', 5: 'pentila', 6: 'hexila', 7: 'heptila', 8: 'octila' };
  var HALETO = { F: 'fluoreto', Cl: 'cloreto', Br: 'brometo', I: 'iodeto' };

  // uma cópia de parte do grafo (os ids dados), com o mapa novo → antigo
  function subgrafo(g, ids) {
    var h = new Q3.Grafo(), mapa = {}, volta = {};
    ids.forEach(function (id) { var n = h.addAtomo(g.atomos[id].el); mapa[id] = n; volta[n] = id; });
    g.ligacoes.forEach(function (l) { if (mapa[l.a] && mapa[l.b]) h.addLigacao(mapa[l.a], mapa[l.b], l.ordem); });
    return { g: h, mapa: mapa, volta: volta };
  }
  // os carbonos ligados a `c0` sem passar por `barreira`
  function ladoCarbono(g, c0, barreira) {
    var lado = [c0], vistos = {}; vistos[c0] = 1; vistos[barreira] = 1;
    for (var k = 0; k < lado.length; k++) g.vizinhos(lado[k]).forEach(function (v) { if (!vistos[v.id] && g.atomos[v.id].el === 'C') { vistos[v.id] = 1; lado.push(v.id); } });
    return lado;
  }
  // um grupo alquila linear, preso pela ponta, sem insaturação: devolve o tamanho (ou 0)
  function alquilaLinear(g, lado, c0) {
    var vizC = function (x) { return g.vizinhos(x).filter(function (v) { return lado.indexOf(v.id) >= 0; }).length; };
    if (vizC(c0) > 1 || lado.some(function (x) { return vizC(x) > 2; })) return 0;
    if (lado.some(function (x) { return g.vizinhos(x).some(function (v) { return v.ordem > 1; }); })) return 0;
    return lado.length;
  }
  // nomeia a parte ácida (o carbono da carbonila, o =O e um O como OH, e a cadeia)
  function acidoDe(g, cC, oxo, oComoOH) {
    var lado = ladoCarbono(g, cC, oComoOH);
    var sub = subgrafo(g, lado.concat([oxo]));
    var o = sub.g.addAtomo('O'); sub.g.addLigacao(sub.mapa[cC], o, 1);
    return { r: N.nomear(sub.g), sub: sub };
  }
  function devolver(r, sub, extra) {
    var cadeia = r.cadeia.map(function (id) { return sub.volta[id]; }), numeracao = {};
    cadeia.forEach(function (id, k) { numeracao[id] = k + 1; });
    var pecas = JSON.parse(JSON.stringify(r.pecas));
    Object.keys(extra.pecas || {}).forEach(function (k) { pecas[k] = extra.pecas[k]; });
    return { ok: true, nome: extra.nome, curto: extra.curto || null, antigo: null, pecas: pecas, cadeia: cadeia, numeracao: numeracao, grupo: extra.grupo, nota2013: r.nota2013 || null };
  }
  function prefixoN(subs) {
    subs = subs.slice().sort();
    if (!subs.length) return '';
    if (subs.length === 2 && subs[0] === subs[1]) return 'N,N-di' + subs[0];
    return subs.map(function (x) { return 'N-' + x; }).join('-');
  }

  function nomearPorPartes(g, gr) {
    var el = function (id) { return g.atomos[id].el; };
    // o =O só existe nas funções com carbonila (a amina não tem)
    var cC = gr.centro, comOxo = gr.id === 'ester' || gr.id === 'haletoAcila' || gr.id === 'amida';
    var oxo = comOxo ? g.vizinhos(cC).filter(function (v) { return v.ordem === 2 && el(v.id) === 'O'; })[0].id : null;
    if (gr.id === 'ester') {
      var oE = g.vizinhos(cC).filter(function (v) { return v.ordem === 1 && el(v.id) === 'O'; })[0].id;
      var cA = g.vizinhos(oE).filter(function (v) { return v.id !== cC; })[0].id;
      var ladoA = ladoCarbono(g, cA, oE), m = alquilaLinear(g, ladoA, cA);
      if (!m || !ALQUILA[m]) return fora('O grupo alquila do éster é ramificado, insaturado ou longo demais: fica fora do escopo do Módulo 2.');
      var ac = acidoDe(g, cC, oxo, oE);
      if (!ac.r.ok) return ac.r;
      var base = function (x) { return x.replace(/^ácido /, '').replace(/ico$/, 'ato'); };
      return devolver(ac.r, ac.sub, { nome: base(ac.r.nome) + ' de ' + ALQUILA[m], curto: ac.r.curto ? base(ac.r.curto) + ' de ' + ALQUILA[m] : null, grupo: 'ester',
        pecas: { sufixo: { nome: 'oato', grupo: 'ester', loc: null, necessario: false }, ester: { nome: ALQUILA[m] } } });
    }
    if (gr.id === 'haletoAcila') {
      var x = g.vizinhos(cC).filter(function (v) { return HALETO[el(v.id)]; })[0].id;
      var ah = acidoDe(g, cC, oxo, x);
      if (!ah.r.ok) return ah.r;
      var oila = function (t) { return t.replace(/^ácido /, '').replace(/oico$/, 'oíla'); };
      return devolver(ah.r, ah.sub, { nome: HALETO[el(x)] + ' de ' + oila(ah.r.nome), curto: ah.r.curto ? HALETO[el(x)] + ' de ' + oila(ah.r.curto) : null, grupo: 'haletoAcila',
        pecas: { sufixo: { nome: 'oila', grupo: 'haletoAcila', loc: null, necessario: false }, haleto: { nome: HALETO[el(x)] } } });
    }
    if (gr.id === 'anidrido') {
      var oP = gr.centro, acs = g.vizinhos(oP).map(function (v) { return v.id; });
      var partes = acs.map(function (c) {
        var ox = g.vizinhos(c).filter(function (v) { return v.ordem === 2 && el(v.id) === 'O'; })[0].id;
        return acidoDe(g, c, ox, oP);
      });
      if (partes.some(function (pt) { return !pt.r.ok || pt.r.pecas.ramificacao || pt.r.pecas.insaturacao.loc; })) return fora('Anidrido com ramificação ou insaturação: fica fora do escopo do Módulo 2.');
      var nomes = partes.map(function (pt) { return pt.r.nome.replace(/^ácido /, ''); }).sort();
      return devolver(partes[0].r, partes[0].sub, { nome: 'anidrido ' + (nomes[0] === nomes[1] ? nomes[0] : nomes.join(' ')), grupo: 'anidrido',
        pecas: { sufixo: { nome: 'anidrido', grupo: 'anidrido', loc: null, necessario: false }, anidrido: partes.map(function (pt) { return pt.r.pecas.prefixo; }).sort() } });
    }
    // aminas 2ª e 3ª, amidas N-substituídas: a parte principal + os grupos no N
    var nId = gr.id === 'amina' ? gr.centro : g.vizinhos(cC).filter(function (v) { return el(v.id) === 'N'; })[0].id;
    var noN = g.vizinhos(nId).filter(function (v) { return el(v.id) === 'C' && v.id !== (gr.id === 'amida' ? cC : null); }).map(function (v) { return v.id; });
    var opcoes = (gr.id === 'amida' ? [cC] : noN).map(function (c0) {
      var lado = ladoCarbono(g, c0, nId), ids = lado.slice();
      if (gr.id === 'amida') ids.push(oxo);
      var sub = subgrafo(g, ids);
      var nn = sub.g.addAtomo('N'); sub.g.addLigacao(sub.mapa[c0], nn, 1);
      var outros = noN.filter(function (c) { return c !== c0; }).map(function (c) { var ld = ladoCarbono(g, c, nId), mm = alquilaLinear(g, ld, c); return mm && N.RAMOS[mm] ? N.RAMOS[mm] : null; });
      return { r: N.nomear(sub.g), sub: sub, subs: outros };
    }).filter(function (o) { return o.r.ok && o.subs.every(Boolean); });
    if (!opcoes.length) return fora('Os grupos presos ao N são ramificados ou insaturados: fica fora do escopo do Módulo 2.');
    // a cadeia principal é a mais longa; no empate, a de nome que vem primeiro
    opcoes.sort(function (a, b) { return (b.r.pecas.carbonos - a.r.pecas.carbonos) || (a.r.nome < b.r.nome ? -1 : 1); });
    var o = opcoes[0];
    if (o.r.pecas.ramificacao || o.r.pecas.halogenio) return fora('Grupo no N e ramificação na cadeia ao mesmo tempo (N,2-dimetil…): fica para uma próxima etapa.');
    var pre = prefixoN(o.subs);
    return devolver(o.r, o.sub, { nome: pre + o.r.nome, curto: o.r.curto ? pre + o.r.curto : null, grupo: gr.id,
      pecas: { nSubs: o.subs.slice().sort() } });
  }

  /* ═══ GERADOR DE ISÔMEROS (a caixa de fórmula molecular da bancada) ═══
     Monta as estruturas DENTRO DO ESCOPO que têm exatamente a fórmula
     pedida, e as nomeia pelo mesmo motor. As repetidas caem pelo nome
     calculado. O grau de insaturação sai da fórmula:
         GI = (2C + 2 + N − H − X) / 2
     e os heteroátomos dizem quais funções são possíveis. */
  N.lerFormula = function (texto) {
    var s = String(texto).replace(/\s+/g, '').replace(/[₀-₉]/g, function (c) { return '₀₁₂₃₄₅₆₇₈₉'.indexOf(c); });
    if (!/^([A-Z][a-z]?\d*)+$/.test(s)) throw new Error('Escreva a fórmula molecular como C4H10O.');
    var cont = {}, m, re = /([A-Z][a-z]?)(\d*)/g;
    while ((m = re.exec(s))) { if (['C', 'H', 'O', 'N', 'F', 'Cl', 'Br', 'I'].indexOf(m[1]) < 0) throw new Error('Elemento fora do escopo: ' + m[1] + '.'); cont[m[1]] = (cont[m[1]] || 0) + (m[2] ? +m[2] : 1); }
    if (!cont.C) throw new Error('Sem carbono, não é composto orgânico.');
    return cont;
  };

  N.isomeros = function (texto) {
    var f = N.lerFormula(texto), nC = f.C, H = f.H || 0, O = f.O || 0, Nn = f.N || 0;
    var hal = ['F', 'Cl', 'Br', 'I'].filter(function (x) { return f[x]; }), nX = hal.reduce(function (a, x) { return a + f[x]; }, 0);
    var gi = (2 * nC + 2 + Nn - H - nX) / 2;
    if (gi < 0 || gi !== Math.floor(gi)) throw new Error('Essa fórmula não fecha: nenhuma estrutura tem esse número de hidrogênios.');
    if (nC > 8) throw new Error('A bancada gera isômeros de até 8 carbonos.');
    var tipos, nota = null;
    if (!O && !Nn && !nX) tipos = [null];
    else if (O === 1 && !Nn && !nX) tipos = ['alcool', 'aldeido', 'cetona', 'eter'];
    else if (O === 2 && !Nn && !nX) tipos = ['acido', 'ester'];
    else if (Nn === 1 && !O && !nX) tipos = ['amina', 'aminaN', 'nitrila'];
    else if (Nn === 1 && O === 1 && !nX) tipos = ['amida', 'amidaN'];
    else if (nX === 1 && !O && !Nn) tipos = ['haleto'];
    else if (nX === 1 && O === 1 && !Nn) tipos = ['haletoAcila'];
    else if (O === 3 && !Nn && !nX) tipos = ['anidrido'];
    else throw new Error('Essa fórmula pede mais de um grupo funcional: fica fora do escopo do Módulo 2.');
    var alvo = Object.keys(f).sort().map(function (k) { return k + f[k]; }).join('');
    var plana = function (g) { var c = {}; g.pesados().forEach(function (id) { var e = g.atomos[id].el; c[e] = (c[e] || 0) + 1; c.H = (c.H || 0) + g.hidrogenios(id); }); return Object.keys(c).filter(function (k) { return c[k]; }).sort().map(function (k) { return k + c[k]; }).join(''); };
    var vistos = {}, out = [];
    for (var L = 1; L <= nC; L++) {
      var k = nC - L; if (k > 3) continue;
      var ramos = k === 0 ? [null] : []; for (var p = 1; p <= L && k > 0; p++) ramos.push({ p: p, k: k });
      var insats = [null]; for (var i = 1; i < L; i++) { insats.push({ i: i, o: 2 }); insats.push({ i: i, o: 3 }); }
      var grupos = [];
      tipos.forEach(function (t) {
        if (['eter', 'ester', 'aminaN', 'amidaN', 'haletoAcila', 'anidrido'].indexOf(t) >= 0) return;   // enumeração própria (abaixo)
        if (t === null) grupos.push(null);
        else if (t === 'aldeido' || t === 'acido' || t === 'amida' || t === 'nitrila') grupos.push({ t: t, q: 1 });
        else for (var q = 1; q <= L; q++) grupos.push({ t: t, q: q });
      });
      ramos.forEach(function (r) { insats.forEach(function (ins) { grupos.forEach(function (gr) {
        var g = montar(L, r, ins, gr, hal[0]);
        if (!g || plana(g) !== alvo) return;
        var nm = N.nomear(g);
        if (!nm.ok || vistos[nm.nome]) return;
        vistos[nm.nome] = 1; out.push({ g: g, nome: nm.nome, grupo: nm.grupo + (nm.pecas.nSubs && nm.pecas.nSubs.length ? '-N' + nm.pecas.nSubs.length : '') + (nm.pecas.anel ? '-anel' : '') });
      }); }); });
    }
    // éteres: m carbonos do outro lado do O; os demais, na cadeia (e num ramo)
    if (tipos.indexOf('eter') >= 0) for (var m = 1; m < nC; m++) for (var L2 = 1; L2 <= nC - m; L2++) {
      var k2 = nC - m - L2; if (k2 > 3) continue;
      var ramos2 = k2 === 0 ? [null] : []; for (var p2 = 1; p2 <= L2 && k2 > 0; p2++) ramos2.push({ p: p2, k: k2 });
      var insats2 = [null]; for (var i2 = 1; i2 < L2; i2++) { insats2.push({ i: i2, o: 2 }); insats2.push({ i: i2, o: 3 }); }
      ramos2.forEach(function (r) { insats2.forEach(function (ins) { for (var q2 = 1; q2 <= L2; q2++) {
        var g = montar(L2, r, ins, { t: 'eter', q: q2, m: m }, null);
        if (!g || plana(g) !== alvo) continue;
        var nm = N.nomear(g);
        if (!nm.ok || vistos[nm.nome]) continue;
        vistos[nm.nome] = 1; out.push({ g: g, nome: nm.nome, grupo: nm.grupo + (nm.pecas.nSubs && nm.pecas.nSubs.length ? '-N' + nm.pecas.nSubs.length : '') + (nm.pecas.anel ? '-anel' : '') });
      } }); });
    }
    /* as funções nomeadas por partes: a cadeia principal (com ramo e
       insaturação) e o que vai do outro lado do O ou no N */
    var guardar = function (g) {
      if (!g || plana(g) !== alvo) return;
      var nm = N.nomear(g);
      if (!nm.ok || vistos[nm.nome]) return;
      vistos[nm.nome] = 1; out.push({ g: g, nome: nm.nome, grupo: nm.grupo + (nm.pecas.nSubs && nm.pecas.nSubs.length ? '-N' + nm.pecas.nSubs.length : '') + (nm.pecas.anel ? '-anel' : '') });
    };
    var cadeias = function (nCadeia, fn) {      // todas as cadeias de nCadeia carbonos (ramo de até 3, uma insaturação)
      for (var L = 1; L <= nCadeia; L++) {
        var k = nCadeia - L; if (k > 3) continue;
        var rs = k === 0 ? [null] : []; for (var p = 1; p <= L && k > 0; p++) rs.push({ p: p, k: k });
        var ins = [null]; for (var i = 1; i < L; i++) { ins.push({ i: i, o: 2 }); ins.push({ i: i, o: 3 }); }
        rs.forEach(function (r) { ins.forEach(function (x) { fn(L, r, x); }); });
      }
    };
    var alquila = function (g, de, m) { var ant = de; for (var j = 0; j < m; j++) { var c = g.addAtomo('C'); if (!g.addLigacao(ant, c, 1)) return false; ant = c; } return true; };
    if (tipos.indexOf('ester') >= 0) for (var mE = 1; mE < nC; mE++) cadeias(nC - mE, function (L, r, x) {
      var g = montar(L, r, x, null, null); if (!g) return;
      var c1 = g.pesados()[0], o1 = g.addAtomo('O'), o2 = g.addAtomo('O');
      if (!g.addLigacao(c1, o1, 2) || !g.addLigacao(c1, o2, 1) || !alquila(g, o2, mE)) return;
      guardar(g);
    });
    if (tipos.indexOf('haletoAcila') >= 0) cadeias(nC, function (L, r, x) {
      var g = montar(L, r, x, null, null); if (!g) return;
      var c1 = g.pesados()[0], o1 = g.addAtomo('O'), h = g.addAtomo(hal[0]);
      if (!g.addLigacao(c1, o1, 2) || !g.addLigacao(c1, h, 1)) return;
      guardar(g);
    });
    if (tipos.indexOf('anidrido') >= 0) for (var a1 = 1; a1 <= nC - a1; a1++) {
      var g = new Q3.Grafo(), lados = [a1, nC - a1].map(function (a) { var ids = []; for (var j = 0; j < a; j++) { ids.push(g.addAtomo('C')); if (j) g.addLigacao(ids[j - 1], ids[j], 1); } return ids; });
      var op = g.addAtomo('O'), ok = true;
      lados.forEach(function (ids) { var ox = g.addAtomo('O'); ok = ok && g.addLigacao(ids[0], ox, 2) && g.addLigacao(ids[0], op, 1); });
      if (ok) guardar(g);
    }
    if (tipos.indexOf('aminaN') >= 0) for (var m1 = 1; m1 < nC; m1++) for (var m2 = 0; m2 <= m1 && m1 + m2 < nC; m2++) cadeias(nC - m1 - m2, function (L, r, x) {
      for (var q = 1; q <= L; q++) {
        var g = montar(L, r, x, null, null); if (!g) return;
        var cq = g.pesados()[q - 1], nn = g.addAtomo('N');
        if (!g.addLigacao(cq, nn, 1) || !alquila(g, nn, m1) || (m2 && !alquila(g, nn, m2))) continue;
        guardar(g);
      }
    });
    if (tipos.indexOf('amidaN') >= 0) for (var n1 = 1; n1 < nC; n1++) for (var n2 = 0; n2 <= n1 && n1 + n2 < nC; n2++) cadeias(nC - n1 - n2, function (L, r, x) {
      var g = montar(L, r, x, null, null); if (!g) return;
      var c1 = g.pesados()[0], o1 = g.addAtomo('O'), nn = g.addAtomo('N');
      if (!g.addLigacao(c1, o1, 2) || !g.addLigacao(c1, nn, 1) || !alquila(g, nn, n1) || (n2 && !alquila(g, nn, n2))) return;
      guardar(g);
    });

    /* ANÉIS: anéis de carbono (3 a 8, com ou sem uma dupla), benzeno,
       heterociclos de O e de N (3 a 6), furano, pirrol e piridina — com até
       duas peças presas. Cada peça tem a composição conhecida (C, O, N, X):
       só as combinações que fecham a fórmula são montadas e nomeadas. */
    var tiposAnel = [];
    for (var ta = 3; ta <= Math.min(nC, 8); ta++) { tiposAnel.push({ tam: ta, het: null, duplas: [] }); tiposAnel.push({ tam: ta, het: null, duplas: [0] }); }
    if (nC >= 6) tiposAnel.push({ tam: 6, het: null, duplas: [0, 2, 4] });
    ['O', 'N'].forEach(function (h) { for (var tb = 3; tb <= 6 && tb - 1 <= nC; tb++) tiposAnel.push({ tam: tb, het: h, duplas: [] }); });
    if (nC >= 4) { tiposAnel.push({ tam: 5, het: 'O', duplas: [1, 3] }); tiposAnel.push({ tam: 5, het: 'N', duplas: [1, 3] }); }
    if (nC >= 5) tiposAnel.push({ tam: 6, het: 'N', duplas: [0, 2, 4] });
    var liga = function (g, a, b, o) { return g.addLigacao(a, b, o || 1); };
    var cadeiaDe = function (g, de, L) { var ant = de, ids = []; for (var j = 0; j < L; j++) { var c = g.addAtomo('C'); if (!liga(g, ant, c)) return null; ids.push(c); ant = c; } return ids; };
    var pecasAnel = [{ c: 0, o: 0, n: 0, x: 0, monta: null }];   // índice 0: nada preso
    for (var La = 1; La <= 4; La++) (function (L) { pecasAnel.push({ c: L, o: 0, n: 0, x: 0, monta: function (g, a) { return !!cadeiaDe(g, a, L); } }); })(La);
    [['OH', 0, 1, 0, 0], ['NH2', 0, 0, 1, 0], ['X', 0, 0, 0, 1], ['=O', 0, 1, 0, 0], ['CHO', 1, 1, 0, 0], ['COOH', 1, 2, 0, 0], ['CN', 1, 0, 1, 0], ['CONH2', 1, 1, 1, 0]].forEach(function (d) {
      pecasAnel.push({ c: d[1], o: d[2], n: d[3], x: d[4], monta: function (g, a) {
        if (d[0] === 'OH') return liga(g, a, g.addAtomo('O'));
        if (d[0] === 'NH2') return liga(g, a, g.addAtomo('N'));
        if (d[0] === 'X') return !!hal[0] && liga(g, a, g.addAtomo(hal[0]));
        if (d[0] === '=O') return liga(g, a, g.addAtomo('O'), 2);
        var c = g.addAtomo('C'); if (!liga(g, a, c)) return false;
        if (d[0] === 'CN') return liga(g, c, g.addAtomo('N'), 3);
        if (!liga(g, c, g.addAtomo('O'), 2)) return false;
        if (d[0] === 'COOH') return liga(g, c, g.addAtomo('O'));
        if (d[0] === 'CONH2') return liga(g, c, g.addAtomo('N'));
        return true;
      } });
    });
    for (var ma = 1; ma <= 3; ma++) (function (m) { pecasAnel.push({ c: m, o: 1, n: 0, x: 0, monta: function (g, a) { var o = g.addAtomo('O'); return liga(g, a, o) && !!cadeiaDe(g, o, m); } }); })(ma);
    // cadeias curtas com a função (o anel vira substituinte): OH, NH2, X ou =O num carbono; COOH, CHO, CN, CONH2 na ponta
    for (var Lc = 1; Lc <= 3; Lc++) for (var qc = 1; qc <= Lc; qc++) (function (L, q) {
      [['OH', 0, 1, 0, 0], ['NH2', 0, 0, 1, 0], ['X', 0, 0, 0, 1], ['=O', 0, 1, 0, 0]].forEach(function (d) {
        pecasAnel.push({ c: L, o: d[2], n: d[3], x: d[4], monta: function (g, a) {
          var ids = cadeiaDe(g, a, L); if (!ids) return false; var alvo = ids[q - 1];
          if (d[0] === 'OH') return liga(g, alvo, g.addAtomo('O'));
          if (d[0] === 'NH2') return liga(g, alvo, g.addAtomo('N'));
          if (d[0] === 'X') return !!hal[0] && liga(g, alvo, g.addAtomo(hal[0]));
          return liga(g, alvo, g.addAtomo('O'), 2);
        } });
      });
    })(Lc, qc);
    for (var Lp = 1; Lp <= 2; Lp++) (function (L) {
      [['COOH', 1, 2, 0], ['CN', 1, 0, 1], ['CONH2', 1, 1, 1]].forEach(function (d) {
        pecasAnel.push({ c: L + 1, o: d[2], n: d[3], x: 0, monta: function (g, a) {
          var ids = cadeiaDe(g, a, L + 1); if (!ids) return false; var c = ids[L];
          if (d[0] === 'CN') return liga(g, c, g.addAtomo('N'), 3);
          if (!liga(g, c, g.addAtomo('O'), 2)) return false;
          return d[0] === 'COOH' ? liga(g, c, g.addAtomo('O')) : liga(g, c, g.addAtomo('N'));
        } });
      });
    })(Lp);
    var nX2 = nX;
    tiposAnel.forEach(function (T) {
      var cAnel = T.tam - (T.het ? 1 : 0), oAnel = T.het === 'O' ? 1 : 0, nAnel = T.het === 'N' ? 1 : 0;
      if (cAnel > nC || oAnel > O || nAnel > Nn) return;
      var posicoes = []; for (var i = 0; i < T.tam; i++) posicoes.push(i);
      var primeiras = T.het ? posicoes : [0];                 // sem heteroátomo, o anel é simétrico: a 1ª peça vai no átomo 0
      var soAlquila = function (P) { return !P.o && !P.n && !P.x && P.monta && P.c <= 4 && pecasAnel.indexOf(P) <= 4; };   // no heteroátomo, só alquila
      pecasAnel.forEach(function (A, ia) {
        if (cAnel + A.c > nC || oAnel + A.o > O || nAnel + A.n > Nn || A.x > nX2) return;
        pecasAnel.forEach(function (B, ib) {
          var semB = ib === 0;
          if (ia === 0 && !semB) return;                        // "nada" só como a segunda peça
          if (cAnel + A.c + B.c !== nC || oAnel + A.o + B.o !== O || nAnel + A.n + B.n !== Nn || A.x + B.x !== nX2) return;
          primeiras.forEach(function (p1) {
            (semB ? [null] : posicoes.filter(function (p) { return p !== p1; })).forEach(function (p2) {
              var g = new Q3.Grafo(), anel = [];
              for (var k = 0; k < T.tam; k++) anel.push(g.addAtomo(k === 0 && T.het ? T.het : 'C'));
              for (var k2 = 0; k2 < T.tam; k2++) if (!liga(g, anel[k2], anel[(k2 + 1) % T.tam], T.duplas.indexOf(k2) >= 0 ? 2 : 1)) return;
              if (T.het && ((p1 === 0 && ia && !soAlquila(A)) || (p2 === 0 && !semB && !soAlquila(B)))) return;
              if (ia && A.monta && !A.monta(g, anel[p1])) return;
              if (!semB && B.monta && !B.monta(g, anel[p2])) return;
              guardar(g);
            });
          });
        });
      });
    });

    out.sort(function (a, b) { return a.nome.replace(/^ácido /, '').localeCompare(b.nome.replace(/^ácido /, ''), 'pt'); });
    return { estruturas: out, nota: nota, formula: alvo };
  };

  function montar(L, ramo, insat, grupo, halogenio) {
    var g = new Q3.Grafo(), c = [];
    for (var i = 0; i < L; i++) { c.push(g.addAtomo('C')); if (i && !g.addLigacao(c[i - 1], c[i], insat && insat.i === i ? insat.o : 1)) return null; }
    if (ramo) {
      var ant = c[ramo.p - 1];
      for (var j = 0; j < ramo.k; j++) { var x = g.addAtomo('C'); if (!g.addLigacao(ant, x, 1)) return null; ant = x; }
    }
    if (grupo) {
      var alvo = c[grupo.q - 1], t = grupo.t, a, b;
      if (t === 'alcool') { a = g.addAtomo('O'); if (!g.addLigacao(alvo, a, 1)) return null; }
      else if (t === 'amina') { a = g.addAtomo('N'); if (!g.addLigacao(alvo, a, 1)) return null; }
      else if (t === 'haleto') { a = g.addAtomo(halogenio); if (!g.addLigacao(alvo, a, 1)) return null; }
      else if (t === 'cetona' || t === 'aldeido') { a = g.addAtomo('O'); if (!g.addLigacao(alvo, a, 2)) return null; }
      else if (t === 'acido') { a = g.addAtomo('O'); b = g.addAtomo('O'); if (!g.addLigacao(alvo, a, 2) || !g.addLigacao(alvo, b, 1)) return null; }
      else if (t === 'amida') { a = g.addAtomo('O'); b = g.addAtomo('N'); if (!g.addLigacao(alvo, a, 2) || !g.addLigacao(alvo, b, 1)) return null; }
      else if (t === 'nitrila') { a = g.addAtomo('N'); if (!g.addLigacao(alvo, a, 3)) return null; }
      else if (t === 'eter') {
        a = g.addAtomo('O'); if (!g.addLigacao(alvo, a, 1)) return null;
        var antE = a; for (var j = 0; j < grupo.m; j++) { var ce = g.addAtomo('C'); if (!g.addLigacao(antE, ce, 1)) return null; antE = ce; }
      }
    }
    return g;
  }

})(typeof window !== 'undefined' ? window : globalThis);
