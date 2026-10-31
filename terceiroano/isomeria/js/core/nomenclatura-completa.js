/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/nomenclatura-completa.js
   ───────────────────────────────────────────────────────────────
   NOMES COMPLETOS (SIFO, Módulo 4) — compostos com VÁRIOS grupos.
   Separado do motor do Módulo 2 (que continua com um grupo por
   estrutura); reaproveita as tabelas dele.

   REGRAS, na ordem dos livros:
     1. o grupo de MAIOR PRIORIDADE (catálogo do Módulo 1) dá o SUFIXO,
        que pode se repetir (diol, dioico, diona); os outros viram
        PREFIXO: hidroxi, oxo, amino, halogênios, alcóxi, ramificações;
     2. cadeia principal: mais grupos principais → mais insaturações →
        mais longa → mais prefixos;
     3. numeração: menores localizadores para o grupo principal → para
        as insaturações → para todos os prefixos juntos → ordem alfabética;
     4. montagem: prefixos em ordem alfabética SEM contar o multiplicador
        (di, tri); hífen antes de "h" (di-hidroxi); "a" de eufonia
        (buta-1,3-dieno); o "o" cai antes de vogal e fica antes de
        consoante (propan-2-ol, butano-1,4-diol);
     5. éster: o ácido com os prefixos dele, "-ico" → "-ato" + "de" + alquila;
     6. benzeno: nomes consagrados como base (ácido benzoico, benzaldeído,
        fenol, anilina); benzeno-1,2-diol quando o grupo se repete.
   Localizadores dos prefixos: sempre citados.

   FORA, com o motivo: substituinte substituído (N-(4-hidroxifenil)…),
   estereoquímica, mais de um anel, heterociclos, anel que não seja o
   benzeno, grupo ramificado preso à cadeia, amina/amida com grupo no N,
   nitrila/amida/éster/anidrido que não sejam o grupo principal.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var N = Q3.Nomenclatura, M = Q3.NomenclaturaCompleta = {};
  var MULT = ['', '', 'di', 'tri', 'tetra', 'penta', 'hexa'];
  M.SUFIXOS = { acido: 'oico', aldeido: 'al', cetona: 'ona', alcool: 'ol', amina: 'amina', nitrila: 'nitrila', amida: 'amida' };
  var TERMINAL = { acido: 1, aldeido: 1, nitrila: 1, amida: 1 };
  var SO_PREFIXO = { haleto: 1, eter: 1 };
  M.BENZENO = { acido: 'ácido benzoico', aldeido: 'benzaldeído', fenol: 'fenol', alcool: 'fenol', amina: 'anilina' };
  function fora(m) { return { ok: false, motivo: m }; }
  M.multiplicar = function (k, nome) { var m = MULT[k] || ''; return m ? m + (/^h/.test(nome) ? '-' : '') + nome : nome; };
  function lex(a, b) { for (var i = 0; i < Math.max(a.length, b.length); i++) { var x = a[i] === undefined ? -1 : a[i], y = b[i] === undefined ? -1 : b[i]; if (x !== y) return x - y; } return 0; }
  function prioridade(id) { var c = Q3.Funcoes.POR_ID[id]; return c ? c.prioridade : 99; }

  /* os prefixos agrupados: [{nome, locs}] → "2-amino-3,4-di-hidroxi" (ordem alfabética sem o multiplicador) */
  M.textoPrefixos = function (lista, semLocantes) {
    var por = {};
    lista.forEach(function (p) { (por[p.nome] = por[p.nome] || []).push(p.loc); });
    var chaveAlfa = function (x) { return x.replace(/[^a-záàâãéêíóôõúç]/gi, ''); };   // a ordem alfabética ignora parênteses e números
    return Object.keys(por).sort(function (a, b) { return chaveAlfa(a).localeCompare(chaveAlfa(b), 'pt'); }).map(function (nome) {
      var locs = por[nome].sort(function (a, b) { return a - b; });
      return semLocantes ? M.multiplicar(locs.length, nome) : locs.join(',') + '-' + M.multiplicar(locs.length, nome);
    }).join('-');
  };

  /* opts.amplo (o SIIS liga; o Módulo 4 do SIFO não): enol como álcool (etenol), anéis de
     carbono com vários grupos (1,1-dimetilciclopropano, ciclopropano-1,2-diol,
     metilidenociclopropano) e bicíclicos/espiro sem substituintes (biciclo[1.1.0]butano). */
  M.nomear = function (g, opts) {
    var el = function (id) { return g.atomos[id].el; }, amplo = !!(opts && opts.amplo);
    if (!g.pesados().some(function (id) { return el(id) === 'C'; })) return fora('Sem carbono, não é composto orgânico.');
    var det = Q3.Funcoes.detectar(g);
    if (amplo) det.fora = det.fora.filter(function (f) {
      if (!/^enol/.test(f.nome || '')) return true;
      var o = f.atomos.filter(function (a) { return el(a) === 'O'; })[0], c = f.atomos.filter(function (a) { return el(a) === 'C'; })[0];
      det.grupos.push({ id: 'alcool', tipo: 'enol', centro: o, atomos: [c, o] });
      return false;
    });
    if (det.fora.length) return fora('Há um grupo fora do catálogo: ' + det.fora[0].nome + '.');
    var gs = det.grupos.filter(function (x) { return x.id !== 'hidrocarboneto'; });
    var candidatos = gs.filter(function (x) { return !SO_PREFIXO[x.id]; });
    var topo = candidatos.length ? Math.min.apply(null, candidatos.map(function (x) { return prioridade(x.id); })) : null;
    var principais = candidatos.filter(function (x) { return prioridade(x.id) === topo; });
    var classe = principais.length ? principais[0].id : null;
    if (classe === 'ester') return nomearEster(g, principais);
    if (['anidrido', 'haletoAcila'].indexOf(classe) >= 0) return fora('Anidrido e haleto de ácido com outros grupos ficam fora do escopo do Módulo 4.');
    if (candidatos.some(function (x) { return ['ester', 'anidrido', 'haletoAcila', 'nitrila', 'amida'].indexOf(x.id) >= 0 && x.id !== classe; })) return fora('Éster, nitrila ou amida que não é o grupo principal: fica fora do escopo do Módulo 4.');
    if (amplo) {
      var aneisA = Q3.Geometria.aneisMinimos(g);
      if (aneisA.length === 1 && !ehBenzeno(g, aneisA[0])) {
        // o grupo principal FORA do anel (CH2OH preso ao anel…): a cadeia é a principal, e o anel vira prefixo
        if (classe && !principalNoAnel(g, aneisA[0], classe, principais)) return nomearCadeia(g, classe, principais, aneisA[0]);
        if (aneisA[0].some(function (id) { return el(id) !== 'C'; })) return nomearHeterociclo(g, aneisA[0], classe);
      }
    }
    if (gs.some(function (x) { return (x.id === 'amina' || x.id === 'amida') && x.tipo && x.tipo !== 'primária'; })) return fora('Amina ou amida com grupo preso ao N: fica fora do escopo do Módulo 4.');
    var aneis = Q3.Geometria.aneisMinimos(g);
    if (aneis.length === 2 && amplo) return nomearBiciclo(g, aneis);
    if (aneis.length > 1) return fora('Mais de um anel: fica fora do escopo do Módulo 4.');
    if (aneis.length && amplo && !ehBenzeno(g, aneis[0])) {
      var temHet = aneis[0].some(function (id) { return el(id) !== 'C'; });
      return temHet ? nomearHeterociclo(g, aneis[0], classe) : nomearCiclo(g, aneis[0], classe);
    }
    if (aneis.length) return nomearBenzeno(g, aneis[0], classe, principais);
    return nomearCadeia(g, classe, principais);
  };

  /* ══ CADEIA ABERTA ══════════════════════════════════════════════ */
  function nomearCadeia(g, classe, principais, anelFora) {
    var el = function (id) { return g.atomos[id].el; };
    var noAnel = {}; (anelFora || []).forEach(function (id) { noAnel[id] = 1; });
    var carbonos = g.pesados().filter(function (id) { return el(id) === 'C' && !noAnel[id]; });
    var vizC = {}; carbonos.forEach(function (c) { vizC[c] = g.vizinhos(c).filter(function (v) { return el(v.id) === 'C' && !noAnel[v.id]; }).map(function (v) { return v.id; }); });
    // o carbono de cada grupo principal
    var pc = principais.map(function (gr) {
      if (TERMINAL[gr.id] || gr.id === 'cetona') return gr.centro;
      return g.vizinhos(gr.centro).filter(function (v) { return el(v.id) === 'C'; })[0].id;
    });
    var caminho = function (a, b) {
      var pai = {}; pai[a] = null; var fila = [a];
      while (fila.length) { var x = fila.shift(); if (x === b) break; vizC[x].forEach(function (y) { if (!(y in pai)) { pai[y] = x; fila.push(y); } }); }
      if (!(b in pai)) return null;
      var out = []; for (var y = b; y !== null; y = pai[y]) out.unshift(y); return out;
    };
    var melhor = null;
    for (var i = 0; i < carbonos.length; i++) for (var j = i; j < carbonos.length; j++) {
      var ch = caminho(carbonos[i], carbonos[j]); if (!ch) continue;
      [ch, ch.slice().reverse()].forEach(function (cad, k) {
        if (i === j && k) return;
        var av = avaliar(cad); if (!av) return;
        if (!melhor || compara(av, melhor) < 0) melhor = av;
      });
    }
    function avaliar(cad) {
      var pos = {}; cad.forEach(function (id, k) { pos[id] = k + 1; });
      var locP = pc.filter(function (c) { return pos[c]; }).map(function (c) { return pos[c]; }).sort(function (a, b) { return a - b; });
      if (principais.some(function (gr, k) { return TERMINAL[gr.id] && pos[pc[k]] && pos[pc[k]] !== 1 && pos[pc[k]] !== cad.length; })) return null;
      var mult = [];
      for (var k = 0; k + 1 < cad.length; k++) { var o = g.ligacao(cad[k], cad[k + 1]).ordem; if (o > 1) mult.push({ loc: k + 1, ordem: o }); }
      var pref = [], problema = null, pcSet = {}, ignorar = {}; pc.forEach(function (c) { pcSet[c] = 1; });
      cad.forEach(function (a) {
        g.vizinhos(a).forEach(function (v) {
          if (pos[v.id]) return;
          var e = el(v.id), noSufixo = pcSet[a] && pos[a];
          if (noAnel[v.id]) {                               // um anel preso à cadeia: prefixo (ciclopropil, (oxiran-2-il)…)
            var ns = nomeAnelSubstituinte(g, anelFora, v.id, a);
            if (v.ordem === 2) { ignorar[a + '|' + v.id] = ignorar[v.id + '|' + a] = 1; }       // anel preso por dupla: "-ilideno"
            if (!ns) problema = problema || 'um anel substituinte que não é simples';
            pref.push({ nome: ns ? (/\d/.test(ns) ? '(' + ns + ')' : ns) : '?', loc: pos[a] });
            return;
          }
          if (e === 'C') {
            var ramo = [v.id], vis = {}; vis[a] = 1; vis[v.id] = 1;
            for (var q = 0; q < ramo.length; q++) g.vizinhos(ramo[q]).forEach(function (w) { if (!vis[w.id]) { vis[w.id] = 1; if (noAnel[w.id]) problema = problema || 'um anel no fim de uma ramificação'; else if (el(w.id) === 'C') ramo.push(w.id); else problema = 'um grupo preso a uma ramificação'; } });
            var linear = ramo.every(function (x) { return (vizC[x] || []).filter(function (y) { return !pos[y]; }).length <= (x === v.id ? 1 : 2); });
            var insat = ramo.some(function (x) { return g.vizinhos(x).some(function (w) { return w.ordem > 1; }); });
            if (!linear || insat || !N.RAMOS[ramo.length]) problema = problema || 'uma ramificação ramificada ou insaturada';
            pref.push({ nome: N.RAMOS[ramo.length] || '?', loc: pos[a] });
          } else if (e === 'O') {
            if (v.ordem === 2) { if (!(noSufixo && (classe === 'cetona' || classe === 'aldeido' || classe === 'acido' || classe === 'amida'))) pref.push({ nome: 'oxo', loc: pos[a] }); }
            else if (g.hidrogenios(v.id) >= 1) { if (!(noSufixo && (classe === 'alcool' || classe === 'acido'))) pref.push({ nome: 'hidroxi', loc: pos[a] }); }
            else {
              var c1 = g.vizinhos(v.id).filter(function (w) { return w.id !== a; })[0].id, lado = [c1], vs = {}; vs[v.id] = 1; vs[c1] = 1;
              for (var r = 0; r < lado.length; r++) g.vizinhos(lado[r]).forEach(function (w) { if (!vs[w.id]) { vs[w.id] = 1; if (el(w.id) === 'C') lado.push(w.id); else problema = 'um grupo alcóxi com outro grupo'; } });
              var vinil = lado.length === 2 && g.ligacao(lado[0], lado[1]).ordem === 2;          // –O–CH=CH2: (eteniloxi)
              if (vinil) { ignorar[lado[0] + '|' + lado[1]] = ignorar[lado[1] + '|' + lado[0]] = 1; pref.push({ nome: '(eteniloxi)', loc: pos[a] }); }
              else {
                if (!N.ALCOXI[lado.length] || g.vizinhos(c1).filter(function (w) { return el(w.id) === 'C'; }).length > 1) problema = problema || 'um grupo alcóxi ramificado';
                pref.push({ nome: N.ALCOXI[lado.length] || '?', loc: pos[a] });
              }
            }
          } else if (e === 'N') {
            if (noSufixo && (classe === 'amina' || classe === 'amida' || classe === 'nitrila')) return;
            if (g.hidrogenios(v.id) === 2) pref.push({ nome: 'amino', loc: pos[a] });
            else problema = 'um nitrogênio que não é NH2 como prefixo';
          } else if (N.HALOGENIOS[e]) pref.push({ nome: N.HALOGENIOS[e], loc: pos[a] });
          else problema = 'um átomo fora do escopo';
        });
      });
      var multFora = 0; g.ligacoes.forEach(function (l) { if (l.ordem > 1 && el(l.a) === 'C' && el(l.b) === 'C' && !(pos[l.a] && pos[l.b]) && !(noAnel[l.a] && noAnel[l.b]) && !ignorar[l.a + '|' + l.b]) multFora++; });
      if (multFora) problema = problema || 'uma insaturação fora da cadeia principal';
      var locPref = pref.map(function (p) { return p.loc; }).sort(function (a, b) { return a - b; });
      var alfa = pref.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt'); }).map(function (p) { return p.loc; });
      return { cad: cad, pos: pos, locP: locP, mult: mult, pref: pref, locPref: locPref, alfa: alfa, problema: problema };
    }
    function compara(a, b) {
      return (b.locP.length - a.locP.length) || (b.mult.length - a.mult.length) || (b.cad.length - a.cad.length) || (b.pref.length - a.pref.length) ||
        lex(a.locP, b.locP) || lex(a.mult.map(function (m) { return m.loc; }), b.mult.map(function (m) { return m.loc; })) || lex(a.locPref, b.locPref) || lex(a.alfa, b.alfa);
    }
    if (!melhor) return fora('Não achei a cadeia principal.');
    if (melhor.problema) return fora('Há ' + melhor.problema + ': fica fora do escopo do Módulo 4.');
    if (melhor.locP.length < pc.length) return fora('Os grupos principais não cabem numa mesma cadeia: fica fora do escopo do Módulo 4.');
    var n = melhor.cad.length; if (!N.PREFIXOS[n]) return fora('A cadeia principal tem mais de 10 carbonos.');
    // ── o nome
    var duplas = melhor.mult.filter(function (m) { return m.ordem === 2; }).map(function (m) { return m.loc; });
    var triplas = melhor.mult.filter(function (m) { return m.ordem === 3; }).map(function (m) { return m.loc; });
    var k = melhor.locP.length;
    var raiz = N.PREFIXOS[n] + ((duplas.length > 1 || triplas.length > 1) ? 'a' : '');
    var insat = '';
    if (!duplas.length && !triplas.length) insat = 'an';
    else {
      if (duplas.length) insat += '-' + duplas.join(',') + '-' + M.multiplicar(duplas.length, 'en');
      if (triplas.length) insat += '-' + triplas.join(',') + '-' + M.multiplicar(triplas.length, 'in');
    }
    var sufixoBase = classe ? M.SUFIXOS[classe] : '';
    var suf = classe ? M.multiplicar(k, sufixoBase) : '';
    var locSuf = classe && !TERMINAL[classe] ? '-' + melhor.locP.join(',') + '-' : '';
    // com 2 carbonos e um item só (além da insaturação), o localizador sobra: etenol, etanal
    // no eteno/etino a insaturação só tem uma posição: o localizador dela nunca é citado (1,2-dicloroeteno);
    // com um item só, o do sufixo também sobra (etenol)
    if (n === 2) { insat = insat.replace(/-\d+(,\d+)*-/g, ''); if (k + melhor.pref.length <= 1) locSuf = ''; }
    var mae = raiz + insat, nome;
    if (!classe) nome = mae + 'o';
    else if (/^[aeiou]/.test(suf)) nome = mae + locSuf + suf;
    else nome = mae + 'o' + locSuf + suf;
    nome = nome.replace(/-(\d)/, function (x, d) { return '-' + d; });
    // sem localizador: cadeia de 1 carbono (metanol…) ou de 2 com um item só ((eteniloxi)eteno, cloroeteno)
    var prefixos = M.textoPrefixos(melhor.pref, n === 1 || (n === 2 && k + melhor.pref.length <= 1));
    if (n === 1) { nome = nome.replace(/-\d+(,\d+)*-/g, ''); }
    nome = prefixos + nome;
    if (classe === 'acido') nome = 'ácido ' + nome;
    var numeracao = {}; melhor.cad.forEach(function (id, i2) { numeracao[id] = i2 + 1; });
    return { ok: true, nome: nome, classe: classe,
      pecas: { prefixos: melhor.pref.map(function (p) { return { nome: p.nome, loc: p.loc }; }), cadeia: N.PREFIXOS[n], carbonos: n, anel: null,
               duplas: duplas, triplas: triplas, sufixo: { grupo: classe, nome: sufixoBase, k: k, locs: TERMINAL[classe] ? [] : melhor.locP } },
      cadeia: melhor.cad, numeracao: numeracao, grupos: gruposDoNome(classe, melhor.pref) };
  }

  /* os grupos e o papel de cada um no nome (a escada da revelação) */
  function gruposDoNome(classe, pref) {
    var out = []; if (classe) out.push({ id: classe, papel: 'sufixo' });
    var mapa = { hidroxi: 'alcool', oxo: 'cetona', amino: 'amina', metoxi: 'eter', etoxi: 'eter', propoxi: 'eter', butoxi: 'eter', cloro: 'haleto', bromo: 'haleto', iodo: 'haleto', fluoro: 'haleto' };
    pref.forEach(function (p) { if (mapa[p.nome] && !out.some(function (o) { return o.id === mapa[p.nome]; })) out.push({ id: mapa[p.nome], papel: 'prefixo', prefixo: p.nome }); });
    return out;
  }

  /* ══ ANÉIS DE CARBONO (opção amplo) ═════════════════════════════ */
  function ordemDoAnel(g, anel) {
    var emAnel = {}; anel.forEach(function (id) { emAnel[id] = 1; });
    var ordem = [anel[0]];
    while (ordem.length < anel.length) { var ult = ordem[ordem.length - 1], prox = g.vizinhos(ult).map(function (v) { return v.id; }).filter(function (id) { return emAnel[id] && ordem.indexOf(id) < 0; })[0]; if (prox === undefined) break; ordem.push(prox); }
    return { ordem: ordem, emAnel: emAnel };
  }
  function ehBenzeno(g, anel) {
    var o = ordemDoAnel(g, anel).ordem, d = 0;
    if (o.length !== 6 || o.some(function (id) { return g.atomos[id].el !== 'C'; })) return false;
    for (var k = 0; k < 6; k++) if (g.ligacao(o[k], o[(k + 1) % 6]).ordem === 2) d++;
    return d === 3;
  }
  var PREFIXO_ANEL = { alcool: 'hidroxi', cetona: 'oxo', amina: 'amino', aldeido: 'formil', acido: 'carboxi', nitrila: 'ciano' };
  /* um grupo de carbonos preso a um átomo de anel → o nome do prefixo (ou null):
     metil… butil (alquila linear), metilideno (=CH2), etilideno (=CH–CH3),
     etenil (–CH=CH2) e etinil (–C≡CH) */
  function prefixoCarbono(g, a, v, lado) {
    var el = function (id) { return g.atomos[id].el; };
    if (lado.some(function (x) { return el(x) !== 'C'; })) return null;
    var ordemAV = g.ligacao(a, v.id || v).ordem, vid = v.id || v;
    var vz = function (x) { return g.vizinhos(x).filter(function (w) { return lado.indexOf(w.id) >= 0; }); };
    if (lado.length === 1) return ordemAV === 2 ? 'metilideno' : ordemAV === 1 ? 'metil' : null;
    if (lado.length === 2) {
      var w = lado[0] === vid ? lado[1] : lado[0], o2 = g.ligacao(vid, w).ordem;
      if (ordemAV === 2 && o2 === 1) return 'etilideno';
      if (ordemAV === 1 && o2 === 2) return 'etenil';
      if (ordemAV === 1 && o2 === 3) return 'etinil';
    }
    if (ordemAV !== 1) return null;
    if (vz(vid).length > 1 || lado.some(function (x) { return vz(x).length > 2; }) || lado.some(function (x) { return g.vizinhos(x).some(function (w) { return w.ordem > 1; }); })) return null;
    return N.RAMOS[lado.length] || null;
  }
  var SUFIXO_ANEL = { alcool: 'ol', cetona: 'ona', amina: 'amina', aldeido: 'carbaldeído', acido: 'carboxílico', nitrila: 'carbonitrila' };
  function nomearCiclo(g, anel, classe) {
    var el = function (id) { return g.atomos[id].el; }, oa = ordemDoAnel(g, anel), ordem = oa.ordem, emAnel = oa.emAnel, n = ordem.length;
    if (ordem.some(function (id) { return el(id) !== 'C'; })) return fora('Heterociclo com vários grupos: fica fora do escopo.');
    if (!N.PREFIXOS[n]) return fora('Anel grande demais.');
    var duplas = [];
    for (var k = 0; k < n; k++) { var ob = g.ligacao(ordem[k], ordem[(k + 1) % n]).ordem; if (ob === 3) return fora('Tripla no anel.'); if (ob === 2) duplas.push(k); }
    if (duplas.length > 1) return fora('Mais de uma dupla no anel: fica fora do escopo.');
    var presos = [], problema = null;
    var ladoDe = function (a, v) { var lado = [v], vis = {}; vis[a] = 1; vis[v] = 1; for (var q = 0; q < lado.length; q++) g.vizinhos(lado[q]).forEach(function (w) { if (!vis[w.id]) { vis[w.id] = 1; lado.push(w.id); } }); return lado; };
    var alquil = function (lado, c0) {
      if (lado.some(function (x) { return el(x) !== 'C'; })) return 0;
      var vz = function (x) { return g.vizinhos(x).filter(function (w) { return lado.indexOf(w.id) >= 0; }).length; };
      if (vz(c0) > 1 || lado.some(function (x) { return vz(x) > 2; }) || lado.some(function (x) { return g.vizinhos(x).some(function (w) { return w.ordem > 1; }); })) return 0;
      return lado.length;
    };
    ordem.forEach(function (a, i) {
      g.vizinhos(a).forEach(function (v) {
        if (emAnel[v.id]) return;
        var e = el(v.id), lado = ladoDe(a, v.id);
        if (e === 'C') {
          // CHO, COOH e CN presos ao anel: o grupo é sufixo do anel (ciclopropanocarbaldeído…)
          var dO = g.vizinhos(v.id).filter(function (w) { return w.ordem === 2 && el(w.id) === 'O'; }).length, sOH = g.vizinhos(v.id).filter(function (w) { return w.ordem === 1 && el(w.id) === 'O' && g.hidrogenios(w.id) === 1; }).length;
          if (dO === 1 && lado.length === 2) { presos.push({ idx: i, tipo: 'aldeido' }); return; }
          if (dO === 1 && sOH === 1 && lado.length === 3) { presos.push({ idx: i, tipo: 'acido' }); return; }
          if (lado.length === 2 && g.vizinhos(v.id).some(function (w) { return w.ordem === 3 && el(w.id) === 'N'; })) { presos.push({ idx: i, tipo: 'nitrila' }); return; }
          var pc = prefixoCarbono(g, a, v, lado);
          if (!pc) { problema = 'um grupo preso ao anel que não é simples'; return; }
          presos.push({ idx: i, nome: pc });
        } else if (e === 'O') {
          if (v.ordem === 2) presos.push({ idx: i, tipo: 'cetona' });
          else if (lado.length === 1) presos.push({ idx: i, tipo: 'alcool' });
          else { var c1 = lado[1], mo = lado.length - 1; if (lado.slice(1).every(function (x) { return el(x) === 'C'; }) && N.ALCOXI[mo] && alquil(ladoDe(v.id, c1), c1)) presos.push({ idx: i, nome: N.ALCOXI[mo] }); else problema = 'um grupo alcóxi que não é simples'; }
        } else if (e === 'N' && lado.length === 1 && v.ordem === 1) presos.push({ idx: i, tipo: 'amina' });
        else if (N.HALOGENIOS[e] && lado.length === 1) presos.push({ idx: i, nome: N.HALOGENIOS[e] });
        else problema = 'um átomo fora do escopo preso ao anel';
      });
    });
    if (problema) return fora('Há ' + problema + '.');
    var tipos = presos.filter(function (p) { return p.tipo; }).map(function (p) { return p.tipo; });
    var cl = tipos.length ? tipos.slice().sort(function (a, b) { return prioridade(a) - prioridade(b); })[0] : null;
    if (classe && cl !== classe) return fora('O grupo principal não está no anel: fica fora do escopo.');
    var prin = presos.filter(function (p) { return cl && p.tipo === cl; });
    var outros = presos.filter(function (p) { return !(cl && p.tipo === cl); }).map(function (p) { return { idx: p.idx, nome: p.nome || PREFIXO_ANEL[p.tipo] }; });
    var melhor = null;
    for (var s0 = 0; s0 < n; s0++) [1, -1].forEach(function (dir) {
      var loc = function (idx) { return ((dir * (idx - s0)) % n + n) % n + 1; };
      var lp = prin.map(function (p) { return loc(p.idx); }).sort(function (a, b) { return a - b; });
      if (prin.length && lp[0] !== 1) return;
      var ld = 0;
      if (duplas.length) { var la = loc(duplas[0]), lb = loc((duplas[0] + 1) % n); if (Math.abs(la - lb) !== 1) return; ld = Math.min(la, lb); }
      var lo = outros.map(function (p) { return { nome: p.nome, loc: loc(p.idx) }; });
      var chave = lp.concat([99, ld, 99], lo.map(function (p) { return p.loc; }).sort(function (a, b) { return a - b; }), [99], lo.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt'); }).map(function (p) { return p.loc; }));
      if (!melhor || lex(chave, melhor.chave) < 0) melhor = { dir: dir, s0: s0, lp: lp, ld: ld, lo: lo, chave: chave };
    });
    if (!melhor) return fora('Não achei a numeração do anel.');
    var itens = prin.length + outros.length + (duplas.length ? 1 : 0), comLoc = itens >= 2;
    var pre = comLoc ? M.textoPrefixos(melhor.lo) : (outros.length === 1 ? outros[0].nome : '');
    var base = N.ciclo(N.PREFIXOS[n]) + (duplas.length ? (comLoc ? '-' + melhor.ld + '-' : '') + 'en' : 'an'), nome;
    if (cl) {
      var sfx = M.multiplicar(prin.length, SUFIXO_ANEL[cl]), locSuf = comLoc ? '-' + melhor.lp.join(',') + '-' : '';
      nome = /^[aeiou]/.test(sfx) ? base + locSuf + sfx : base + 'o' + locSuf + sfx;
    } else nome = base + 'o';
    nome = pre + nome;
    if (cl === 'acido') nome = 'ácido ' + nome;
    var locDe = function (idx) { return ((melhor.dir * (idx - melhor.s0)) % n + n) % n + 1; };
    var cadeia = ordem.slice().sort(function (a, b) { return locDe(ordem.indexOf(a)) - locDe(ordem.indexOf(b)); }), num = {};
    cadeia.forEach(function (id, i) { num[id] = i + 1; });
    return { ok: true, nome: nome, classe: cl, pecas: { prefixos: melhor.lo, anel: 'ciclo', cadeia: N.PREFIXOS[n], carbonos: n }, cadeia: cadeia, numeracao: num, grupos: gruposDoNome(cl, melhor.lo) };
  }

  /* ══ HETEROCICLOS SATURADOS com vários substituintes (opção amplo) ══
     O heteroátomo é o 1; os substituintes, os menores localizadores (sempre
     citados, como no Módulo 2): 2,2-dimetiloxirano, 2-metilidenoaziridina. */
  function nomearHeterociclo(g, anel, classe) {
    var el = function (id) { return g.atomos[id].el; }, oa = ordemDoAnel(g, anel), ordem = oa.ordem, emAnel = oa.emAnel, n = ordem.length;
    var het = ordem.filter(function (id) { return el(id) !== 'C'; });
    if (het.length !== 1 || !N.HETEROCICLOS[el(het[0])] || !N.HETEROCICLOS[el(het[0])][n]) return fora('Heterociclo fora do escopo.');
    var temDupla = false;
    for (var k = 0; k < n; k++) { var obh = g.ligacao(ordem[k], ordem[(k + 1) % n]).ordem; if (obh === 3) return fora('Tripla no anel.'); if (obh === 2) temDupla = true; }
    if (classe && classe !== 'eter' && classe !== 'amina') return fora('O grupo principal não é o anel: fica fora do escopo.');
    var presos = [], problema = null;
    var ladoDe = function (a, v) { var lado = [v], vis = {}; vis[a] = 1; vis[v] = 1; for (var q = 0; q < lado.length; q++) g.vizinhos(lado[q]).forEach(function (w) { if (!vis[w.id]) { vis[w.id] = 1; lado.push(w.id); } }); return lado; };
    ordem.forEach(function (a, i) {
      g.vizinhos(a).forEach(function (v) {
        if (emAnel[v.id]) return;
        var e = el(v.id), lado = ladoDe(a, v.id);
        if (e === 'C') { var pc = prefixoCarbono(g, a, v, lado); if (pc) presos.push({ idx: i, nome: pc }); else problema = 1; }
        else if (N.HALOGENIOS[e] && lado.length === 1 && el(a) === 'C') presos.push({ idx: i, nome: N.HALOGENIOS[e] });
        else if (e === 'O' && el(a) === 'C' && lado.length > 1 && lado.slice(1).every(function (x) { return el(x) === 'C'; }) && N.ALCOXI[lado.length - 1]) presos.push({ idx: i, nome: N.ALCOXI[lado.length - 1] });
        else problema = 1;
      });
    });
    if (problema) return fora('Há um grupo preso ao heterociclo que fica fora do escopo.');
    if (temDupla) return nomearHeteroInsat(g, ordem, het[0], presos);
    var ih = ordem.indexOf(het[0]), melhor = null;
    [1, -1].forEach(function (dir) {
      var loc = function (idx) { return ((dir * (idx - ih)) % n + n) % n + 1; };
      var lo = presos.map(function (p) { return { nome: p.nome, loc: loc(p.idx) }; });
      var chave = lo.map(function (p) { return p.loc; }).sort(function (a, b) { return a - b; }).concat([99], lo.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt'); }).map(function (p) { return p.loc; }));
      if (!melhor || lex(chave, melhor.chave) < 0) melhor = { lo: lo, chave: chave };
    });
    var nome = M.textoPrefixos(melhor.lo) + N.HETEROCICLOS[el(het[0])][n];
    return { ok: true, nome: nome, classe: classe, pecas: { prefixos: melhor.lo, anel: 'heterociclo', carbonos: n - 1 }, cadeia: [], numeracao: {}, grupos: [] };
  }

  /* o grupo principal está NO anel? (OH/NH2 num carbono do anel; C=O do anel; CHO/COOH/CN presos a ele) */
  function principalNoAnel(g, anel, classe, principais) {
    var noAnel = function (id) { return anel.indexOf(id) >= 0; };
    return principais.some(function (gr) {
      if (classe === 'alcool' || classe === 'amina') return g.vizinhos(gr.centro).some(function (v) { return noAnel(v.id); }) || noAnel(gr.centro);
      if (classe === 'cetona') return noAnel(gr.centro);
      if (classe === 'aldeido' || classe === 'acido' || classe === 'nitrila') return g.vizinhos(gr.centro).some(function (v) { return noAnel(v.id); });
      return true;
    });
  }
  /* um ANEL como substituinte (ligado ao pai pelo átomo 'ataque'): ciclopropil, cicloprop-2-en-1-il, oxiran-2-il, aziridin-1-il */
  function nomeAnelSubstituinte(g, anel, ataque, pai) {
    var el = function (id) { return g.atomos[id].el; }, oa = ordemDoAnel(g, anel), ordem = oa.ordem, n = ordem.length;
    if (ordem.some(function (a) { return g.vizinhos(a).some(function (v) { return !oa.emAnel[v.id] && !(a === ataque && v.id === pai); }); })) return null;
    var ilideno = pai && g.ligacao(ataque, pai) && g.ligacao(ataque, pai).ordem === 2;
    var duplas = [];
    for (var k = 0; k < n; k++) { var ob = g.ligacao(ordem[k], ordem[(k + 1) % n]).ordem; if (ob === 3) return null; if (ob === 2) duplas.push(k); }
    var het = ordem.filter(function (id) { return el(id) !== 'C'; }), ia = ordem.indexOf(ataque);
    if (!het.length) {
      if (duplas.length > 1 || !N.PREFIXOS[n]) return null;
      var base = N.ciclo(N.PREFIXOS[n]);
      if (ilideno) return duplas.length ? null : base + 'ilideno';                      // ciclopropilideno
      if (!duplas.length) return base + 'il';
      var ld = 99;
      [1, -1].forEach(function (dir) { var loc = function (idx) { return ((dir * (idx - ia)) % n + n) % n + 1; }, la = loc(duplas[0]), lb = loc((duplas[0] + 1) % n); if (Math.abs(la - lb) === 1) ld = Math.min(ld, la, lb); });
      return ld < 99 ? base + '-' + ld + '-en-1-il' : null;
    }
    if (het.length !== 1 || duplas.length || !N.HETEROCICLOS[el(het[0])] || !N.HETEROCICLOS[el(het[0])][n]) return null;
    var ih = ordem.indexOf(het[0]), lAt = 99;
    [1, -1].forEach(function (dir) { lAt = Math.min(lAt, ((dir * (ia - ih)) % n + n) % n + 1); });
    return N.HETEROCICLOS[el(het[0])][n].replace(/[oa]$/, '') + '-' + lAt + '-il';
  }

  /* ══ HETEROCICLOS INSATURADOS (opção amplo): os nomes consagrados, com o heteroátomo em 1 ══
     cada entrada: as duplas (pares de localizadores) e o nome */
  var HETERO_INSAT = {
    O: { 4: [[[3, 4]], '2H-oxeto'], 5: [[[4, 5]], '2,3-di-hidrofurano', [[3, 4]], '2,5-di-hidrofurano'],
         6: [[[5, 6]], '3,4-di-hidro-2H-pirano', [[4, 5]], '3,6-di-hidro-2H-pirano', [[3, 4], [5, 6]], '2H-pirano', [[2, 3], [5, 6]], '4H-pirano'] },
    N: { 4: [[[3, 4]], '1,2-di-hidroazeto'], 5: [[[4, 5]], '2,3-di-hidro-1H-pirrol', [[3, 4]], '2,5-di-hidro-1H-pirrol'],
         6: [[[5, 6]], '1,2,3,4-tetra-hidropiridina', [[4, 5]], '1,2,3,6-tetra-hidropiridina', [[3, 4], [5, 6]], '1,2-di-hidropiridina', [[2, 3], [5, 6]], '1,4-di-hidropiridina'] }
  };
  function nomearHeteroInsat(g, ordem, het, presos) {
    var el = function (id) { return g.atomos[id].el; }, n = ordem.length, tab = (HETERO_INSAT[el(het)] || {})[n];
    if (!tab) return fora('Heterociclo insaturado fora do escopo.');
    var ih = ordem.indexOf(het), melhor = null;
    [1, -1].forEach(function (dir) {
      var loc = function (idx) { return ((dir * (idx - ih)) % n + n) % n + 1; }, du = [];
      for (var k = 0; k < n; k++) if (g.ligacao(ordem[k], ordem[(k + 1) % n]).ordem === 2) { var a = loc(k), b = loc((k + 1) % n); du.push([Math.min(a, b), Math.max(a, b)]); }
      du.sort(function (x, y) { return x[0] - y[0]; });
      for (var t = 0; t < tab.length; t += 2) {
        if (JSON.stringify(tab[t]) !== JSON.stringify(du)) continue;
        var lo = presos.map(function (p) { return { nome: p.nome, loc: loc(p.idx) }; });
        var chave = lo.map(function (p) { return p.loc; }).sort(function (x, y) { return x - y; }).concat([99], lo.slice().sort(function (x, y) { return x.nome.localeCompare(y.nome, 'pt'); }).map(function (p) { return p.loc; }));
        if (!melhor || lex(chave, melhor.chave) < 0) melhor = { lo: lo, chave: chave, nome: tab[t + 1] };
      }
    });
    if (!melhor) return fora('Heterociclo insaturado fora do escopo.');
    var pre = M.textoPrefixos(melhor.lo);
    return { ok: true, nome: pre + (pre && /^\d/.test(melhor.nome) ? '-' : '') + melhor.nome, classe: null, pecas: { prefixos: melhor.lo, anel: 'heterociclo' }, cadeia: [], numeracao: {}, grupos: [] };
  }

  /* ══ BICÍCLICOS E ESPIRO sem substituintes (opção amplo): von Baeyer ══ */
  function nomearBiciclo(g, aneis) {
    var el = function (id) { return g.atomos[id].el; }, todos = {};
    aneis.forEach(function (r) { r.forEach(function (id) { todos[id] = 1; }); });
    var ids = Object.keys(todos), n = ids.length;
    var het = ids.filter(function (id) { return el(id) !== 'C'; });
    if (het.length > 1 || het.some(function (id) { return el(id) !== 'O' && el(id) !== 'N'; })) return fora('Bicíclico com mais de um heteroátomo: fica fora do escopo.');
    if (!N.PREFIXOS[n]) return fora('Bicíclico grande demais.');
    var duplas = [];
    g.ligacoes.forEach(function (l) { if (todos[l.a] && todos[l.b] && l.ordem > 1) { if (l.ordem === 3) duplas.push(null); else duplas.push([l.a, l.b]); } });
    if (duplas.length > 1 || duplas.some(function (d) { return !d; })) return fora('Bicíclico com mais de uma insaturação: fica fora do escopo.');
    // o que está preso ao sistema de anéis: grupos principais e prefixos
    var presos = [], ruim = false;
    ids.forEach(function (a) {
      g.vizinhos(a).forEach(function (v) {
        if (todos[v.id]) return;
        var lado = [v.id], vis = {}; vis[a] = 1; vis[v.id] = 1;
        for (var q = 0; q < lado.length; q++) g.vizinhos(lado[q]).forEach(function (w) { if (!vis[w.id]) { vis[w.id] = 1; lado.push(w.id); } });
        var e = el(v.id);
        if (e === 'O' && lado.length === 1) presos.push({ at: a, tipo: v.ordem === 2 ? 'cetona' : 'alcool' });
        else if (e === 'N' && lado.length === 1 && v.ordem === 1) presos.push({ at: a, tipo: 'amina' });
        else if (N.HALOGENIOS[e] && lado.length === 1) presos.push({ at: a, nome: N.HALOGENIOS[e] });
        else if (e === 'C') { var pc = prefixoCarbono(g, a, v, lado); if (pc && pc !== 'etilideno') presos.push({ at: a, nome: pc }); else ruim = true; }
        else if (e === 'O' && lado.slice(1).every(function (x) { return el(x) === 'C'; }) && N.ALCOXI[lado.length - 1]) presos.push({ at: a, nome: N.ALCOXI[lado.length - 1] });
        else ruim = true;
      });
    });
    if (ruim) return fora('Bicíclico com um grupo fora do escopo.');
    var tipos = presos.filter(function (p) { return p.tipo; }).map(function (p) { return p.tipo; });
    var cl = tipos.length ? tipos.slice().sort(function (a, b) { return prioridade(a) - prioridade(b); })[0] : null;
    var prin = presos.filter(function (p) { return cl && p.tipo === cl; }), outros = presos.filter(function (p) { return !(cl && p.tipo === cl); }).map(function (p) { return { at: p.at, nome: p.nome || PREFIXO_ANEL[p.tipo] }; });
    var viz = function (id) { return g.vizinhos(id).map(function (v) { return v.id; }).filter(function (x) { return todos[x]; }); };
    var comuns = aneis[0].filter(function (id) { return aneis[1].indexOf(id) >= 0; }), nome;
    if (comuns.length === 1) {
      if (cl || duplas.length) return fora('Espiro com grupo principal ou dupla: fica fora do escopo.');
      /* a numeração do espiro: começa no anel MENOR, no átomo vizinho ao espiro; dá a volta nele; o átomo
         espiro; e segue pelo anel maior. Menores localizadores: o heteroátomo → os prefixos → a ordem alfabética */
      var sp = comuns[0], seq = function (anel, dir) { var o = ordemDoAnel(g, anel).ordem, i0 = o.indexOf(sp), out = []; for (var k2 = 1; k2 < o.length; k2++) out.push(o[((i0 + dir * k2) % o.length + o.length) % o.length]); return out; };
      var ordens = aneis[0].length === aneis[1].length ? [[aneis[0], aneis[1]], [aneis[1], aneis[0]]] : [aneis.slice().sort(function (a, b) { return a.length - b.length; })];
      var melhorE = null;
      ordens.forEach(function (par) { [1, -1].forEach(function (d1) { [1, -1].forEach(function (d2) {
        var num = {}, k3 = 1; seq(par[0], d1).forEach(function (id) { num[id] = k3++; }); num[sp] = k3++; seq(par[1], d2).forEach(function (id) { num[id] = k3++; });
        var lh = het.map(function (id) { return num[id]; }), lo = outros.map(function (p) { return { nome: p.nome, loc: num[p.at] }; });
        var chave = lh.concat([99], lo.map(function (p) { return p.loc; }).sort(function (a, b) { return a - b; }), [99], lo.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt'); }).map(function (p) { return p.loc; }));
        if (!melhorE || lex(chave, melhorE.chave) < 0) melhorE = { lh: lh, lo: lo, chave: chave };
      }); }); });
      var t = [aneis[0].length - 1, aneis[1].length - 1].sort(function (a, b) { return a - b; });
      var nomeE = (het.length ? melhorE.lh[0] + '-' + (el(het[0]) === 'O' ? 'oxa' : 'aza') : '') + 'espiro[' + t[0] + '.' + t[1] + ']' + N.PREFIXOS[n] + 'ano';
      var preE = melhorE.lo.length ? M.textoPrefixos(melhorE.lo) : '';
      return { ok: true, nome: preE + (preE && /^\d/.test(nomeE) ? '-' : '') + nomeE, classe: null, pecas: { prefixos: melhorE.lo, anel: 'biciclo', carbonos: n }, cadeia: [], numeracao: {}, grupos: [] };
    }
    var cab = ids.filter(function (id) { return viz(id).length === 3; });
    if (cab.length !== 2) return fora('Bicíclico que não é simples.');
    var pontes = viz(cab[0]).map(function (v0) {
      if (v0 === cab[1]) return [];
      var ant = cab[0], at = v0, lista = [];
      while (at !== cab[1]) { lista.push(at); var prox = viz(at).filter(function (x) { return x !== ant; })[0]; ant = at; at = prox; }
      return lista;
    }).sort(function (a, b) { return b.length - a.length; });
    /* von Baeyer: C1 = uma cabeça de ponte; a ponte MAIOR até a outra cabeça; volta pela MÉDIA; por fim
       a MENOR, a partir do átomo mais perto do C1. Entre as numerações válidas, a de menores localizadores
       para: o heteroátomo → o grupo principal → a dupla → os prefixos → a ordem alfabética. */
    var perms = [[0, 1, 2], [1, 0, 2], [0, 2, 1], [2, 0, 1], [1, 2, 0], [2, 1, 0]].filter(function (pm) { return pontes[pm[0]].length >= pontes[pm[1]].length && pontes[pm[1]].length >= pontes[pm[2]].length; });
    var melhor = null;
    [0, 1].forEach(function (c1) {
      perms.forEach(function (pm) {
        [false, true].forEach(function (inv) {
          var num = {}, k = 1, ini = cab[c1], fim = cab[1 - c1];
          var sentido = function (lista) { return c1 === 0 ? lista.slice() : lista.slice().reverse(); };
          num[ini] = k++;
          sentido(pontes[pm[0]]).forEach(function (id) { num[id] = k++; });
          num[fim] = k++;
          sentido(pontes[pm[1]]).reverse().forEach(function (id) { num[id] = k++; });
          var menor = sentido(pontes[pm[2]]); (inv ? menor.slice().reverse() : menor).forEach(function (id) { num[id] = k++; });
          var lh = het.map(function (id) { return num[id]; });
          var lp = prin.map(function (p) { return num[p.at]; }).sort(function (a, b) { return a - b; });
          var ld = duplas.length ? [num[duplas[0][0]], num[duplas[0][1]]].sort(function (a, b) { return a - b; }) : [];
          if (ld.length && ld[1] - ld[0] !== 1) return;                     // a dupla precisa ter localizadores seguidos
          var lo = outros.map(function (p) { return { nome: p.nome, loc: num[p.at] }; });
          var chave = lh.concat([99], lp, [99], ld.slice(0, 1), [99], lo.map(function (p) { return p.loc; }).sort(function (a, b) { return a - b; }), [99], lo.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt'); }).map(function (p) { return p.loc; }));
          if (!melhor || lex(chave, melhor.chave) < 0) melhor = { lh: lh, lp: lp, ld: ld, lo: lo, chave: chave };
        });
      });
    });
    if (!melhor) return fora('Não achei a numeração do bicíclico.');
    var base = 'biciclo[' + pontes.map(function (p) { return p.length; }).join('.') + ']' + N.PREFIXOS[n] + (melhor.ld.length ? '-' + melhor.ld[0] + '-en' : 'an');
    if (cl) { var sfx = M.multiplicar(prin.length, SUFIXO_ANEL[cl]), ls = '-' + melhor.lp.join(',') + '-'; nome = /^[aeiou]/.test(sfx) ? base + ls + sfx : base + 'o' + ls + sfx; }
    else nome = base + 'o';
    if (het.length) nome = melhor.lh[0] + '-' + (el(het[0]) === 'O' ? 'oxa' : 'aza') + nome;          // o "oxa"/"aza" fica colado ao "biciclo"
    var preB = melhor.lo.length ? M.textoPrefixos(melhor.lo) : '';
    nome = preB + (preB && /^\d/.test(nome) ? '-' : '') + nome;
    if (cl === 'acido') nome = 'ácido ' + nome;
    return { ok: true, nome: nome, classe: cl, pecas: { prefixos: melhor.lo, anel: 'biciclo', carbonos: n }, cadeia: [], numeracao: {}, grupos: [] };
  }


  /* ══ ÉSTER: o ácido (com os prefixos dele) → "-ato de alquila" ═══ */
  var ALQUILA = { 1: 'metila', 2: 'etila', 3: 'propila', 4: 'butila', 5: 'pentila', 6: 'hexila', 7: 'heptila', 8: 'octila' };
  function nomearEster(g, ests) {
    if (ests.length > 1) return fora('Mais de um grupo éster: fica fora do escopo do Módulo 4.');
    var el = function (id) { return g.atomos[id].el; }, e = ests[0], c = e.centro;
    var oE = g.vizinhos(c).filter(function (v) { return v.ordem === 1 && el(v.id) === 'O'; })[0].id;
    var cA = g.vizinhos(oE).filter(function (v) { return v.id !== c; })[0].id;
    var lado = [cA], vis = {}; vis[oE] = 1; vis[cA] = 1;
    for (var q = 0; q < lado.length; q++) g.vizinhos(lado[q]).forEach(function (w) { if (!vis[w.id]) { vis[w.id] = 1; lado.push(w.id); } });
    if (lado.some(function (x) { return el(x) !== 'C'; }) || lado.some(function (x) { return g.vizinhos(x).filter(function (w) { return lado.indexOf(w.id) >= 0; }).length > 2; }) ||
        g.vizinhos(cA).filter(function (w) { return lado.indexOf(w.id) >= 0; }).length > 1 || !ALQUILA[lado.length]) return fora('O grupo alquila do éster é ramificado ou tem outro grupo: fica fora do escopo do Módulo 4.');
    // a parte ácida: tudo menos o grupo alquila (o O do éster vira OH)
    var ids = g.pesados().filter(function (id) { return lado.indexOf(id) < 0; });
    var h = new Q3.Grafo(), mapa = {}, volta = {};
    ids.forEach(function (id) { var nn = h.addAtomo(el(id)); mapa[id] = nn; volta[nn] = id; });
    g.ligacoes.forEach(function (l) { if (mapa[l.a] && mapa[l.b]) h.addLigacao(mapa[l.a], mapa[l.b], l.ordem); });
    var r = M.nomear(h);
    if (!r.ok) return r;
    if (!/^ácido .*oico$/.test(r.nome)) return fora('A parte ácida do éster não é um ácido simples: fica fora do escopo.');
    var nome = r.nome.replace(/^ácido /, '').replace(/ico$/, 'ato') + ' de ' + ALQUILA[lado.length];
    var cad = r.cadeia.map(function (id) { return volta[id]; }), num = {}; cad.forEach(function (id, i) { num[id] = i + 1; });
    var pecas = JSON.parse(JSON.stringify(r.pecas)); pecas.sufixo = { grupo: 'ester', nome: 'oato', k: 1, locs: [] }; pecas.ester = ALQUILA[lado.length];
    var grupos = [{ id: 'ester', papel: 'sufixo' }].concat(r.grupos.filter(function (x) { return x.papel === 'prefixo'; }));
    return { ok: true, nome: nome, classe: 'ester', pecas: pecas, cadeia: cad, numeracao: num, grupos: grupos };
  }

  /* ══ BENZENO ════════════════════════════════════════════════════ */
  function nomearBenzeno(g, anel, classe, principais) {
    var el = function (id) { return g.atomos[id].el; };
    var emAnel = {}; anel.forEach(function (id) { emAnel[id] = 1; });
    var ordem = [anel[0]];
    while (ordem.length < anel.length) { var ult = ordem[ordem.length - 1], prox = g.vizinhos(ult).map(function (v) { return v.id; }).filter(function (id) { return emAnel[id] && ordem.indexOf(id) < 0; })[0]; if (prox === undefined) break; ordem.push(prox); }
    var duplas = 0; for (var k = 0; k < ordem.length; k++) if (g.ligacao(ordem[k], ordem[(k + 1) % ordem.length]).ordem === 2) duplas++;
    if (ordem.length !== 6 || ordem.some(function (id) { return el(id) !== 'C'; }) || duplas !== 3) return fora('No Módulo 4, o único anel é o benzeno.');
    var presos = [], problema = null;
    ordem.forEach(function (a, i) {
      g.vizinhos(a).forEach(function (v) {
        if (emAnel[v.id]) return;
        var e = el(v.id), lado = [v.id], vis = {}; vis[a] = 1; vis[v.id] = 1;
        for (var q = 0; q < lado.length; q++) g.vizinhos(lado[q]).forEach(function (w) { if (!vis[w.id]) { vis[w.id] = 1; lado.push(w.id); } });
        if (e === 'O' && lado.length === 1) presos.push({ idx: i, tipo: 'OH' });
        else if (e === 'N' && lado.length === 1) presos.push({ idx: i, tipo: 'NH2' });
        else if (N.HALOGENIOS[e] && lado.length === 1) presos.push({ idx: i, tipo: 'pref', nome: N.HALOGENIOS[e] });
        else if (e === 'O') { var m = lado.length - 1; if (lado.slice(1).every(function (x) { return el(x) === 'C'; }) && N.ALCOXI[m]) presos.push({ idx: i, tipo: 'pref', nome: N.ALCOXI[m] }); else problema = 'um grupo alcóxi com outro grupo'; }
        else if (e === 'C') {
          var so = lado.map(el).sort().join('');
          var carb = g.vizinhos(v.id).filter(function (w) { return w.ordem === 2 && el(w.id) === 'O'; }).length;
          if (carb && so === 'CO' && lado.length === 2) presos.push({ idx: i, tipo: 'CHO' });
          else if (carb && so === 'COO' && g.vizinhos(v.id).some(function (w) { return el(w.id) === 'O' && w.ordem === 1 && g.hidrogenios(w.id) === 1; })) presos.push({ idx: i, tipo: 'COOH' });
          else if (lado.every(function (x) { return el(x) === 'C'; }) && N.RAMOS[lado.length] && !lado.some(function (x) { return g.vizinhos(x).some(function (w) { return w.ordem > 1; }); }) &&
                   lado.every(function (x) { return g.vizinhos(x).filter(function (w) { return lado.indexOf(w.id) >= 0; }).length <= 2; })) presos.push({ idx: i, tipo: 'pref', nome: N.RAMOS[lado.length] });
          else problema = 'um grupo preso ao anel que não é simples (substituinte substituído, cadeia com função…)';
        } else problema = 'um átomo fora do escopo preso ao anel';
      });
    });
    if (problema) return fora('Há ' + problema + ': fica fora do escopo do Módulo 4.');
    // o grupo principal no anel
    var ordemP = [['COOH', 'acido'], ['CHO', 'aldeido'], ['OH', 'fenol'], ['NH2', 'amina']], prin = null;
    for (var z = 0; z < ordemP.length && !prin; z++) if (presos.some(function (p) { return p.tipo === ordemP[z][0]; })) prin = ordemP[z];
    var nomesPref = { OH: 'hidroxi', NH2: 'amino', CHO: 'formil', COOH: 'carboxi' };
    var itensP = prin ? presos.filter(function (p) { return p.tipo === prin[0]; }) : [];
    var outros = presos.filter(function (p) { return !prin || p.tipo !== prin[0]; }).map(function (p) { return { idx: p.idx, nome: p.tipo === 'pref' ? p.nome : nomesPref[p.tipo] }; });
    if (outros.some(function (p) { return p.nome === 'formil' || p.nome === 'carboxi'; })) return fora('Dois grupos de carbono no anel: fica fora do escopo do Módulo 4.');
    if (itensP.length > 2) return fora('Grupo principal repetido mais de duas vezes no anel: fica fora do escopo.');
    // numeração: o(s) principal(is) com os menores localizadores (o 1º no 1), depois os prefixos, depois a ordem alfabética
    var melhor = null;
    for (var s0 = 0; s0 < 6; s0++) [1, -1].forEach(function (dir) {
      var loc = function (idx) { return ((dir * (idx - s0)) % 6 + 6) % 6 + 1; };
      var lp = itensP.map(function (p) { return loc(p.idx); }).sort(function (a, b) { return a - b; });
      if (itensP.length && lp[0] !== 1) return;
      var lo = outros.map(function (p) { return { nome: p.nome, loc: loc(p.idx) }; });
      var chave = lp.concat([99], lo.map(function (p) { return p.loc; }).sort(function (a, b) { return a - b; }), [99], lo.slice().sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt'); }).map(function (p) { return p.loc; }));
      if (!melhor || lex(chave, melhor.chave) < 0) melhor = { s0: s0, dir: dir, lp: lp, lo: lo, chave: chave };
    });
    var locDe = function (idx) { return ((melhor.dir * (idx - melhor.s0)) % 6 + 6) % 6 + 1; };
    var mae, cl = prin ? prin[1] : null;
    if (!prin) mae = 'benzeno';
    else if (itensP.length === 1) mae = M.BENZENO[cl];
    else if (cl === 'fenol') mae = 'benzeno-' + melhor.lp.join(',') + '-diol';
    else if (cl === 'amina') mae = 'benzeno-' + melhor.lp.join(',') + '-diamina';
    else return fora('Esse grupo repetido no anel fica fora do escopo.');
    var pre = M.textoPrefixos(melhor.lo);
    if (!prin && melhor.lo.length === 1) pre = melhor.lo[0].nome;       // metilbenzeno: um prefixo só, sem localizador
    var nome = /^ácido /.test(mae) ? 'ácido ' + pre + mae.replace(/^ácido /, '') : pre + mae;
    var cadeia = ordem.slice().sort(function (a, b) { return locDe(ordem.indexOf(a)) - locDe(ordem.indexOf(b)); }), num = {};
    cadeia.forEach(function (id, i) { num[id] = i + 1; });
    return { ok: true, nome: nome, classe: cl,
      pecas: { prefixos: melhor.lo, cadeia: '', carbonos: 6, anel: itensP.length > 1 ? 'benzeno' : (prin ? M.BENZENO[cl] : 'benzeno'), duplas: [], triplas: [],
               sufixo: { grupo: cl, nome: itensP.length > 1 ? (cl === 'fenol' ? 'ol' : 'amina') : '', k: itensP.length, locs: itensP.length > 1 ? melhor.lp : [] } },
      cadeia: cadeia, numeracao: num, grupos: gruposDoNome(cl === 'fenol' ? 'fenol' : cl, melhor.lo) };
  }

})(typeof window !== 'undefined' ? window : globalThis);
