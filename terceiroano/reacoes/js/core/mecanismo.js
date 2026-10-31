/* ══════════════════════════════════════════════════════════════════
   SIRO · O MOTOR DE SETAS (mecanismos de reação)
   ──────────────────────────────────────────────────────────────────
   Contagem de ELÉTRONS, como as setas curvas dos livros:
   · cada átomo guarda os elétrons NÃO LIGANTES (nb): pares = nb/2;
     um elétron sobrando é radical;
   · cada ligação guarda os elétrons COMPARTILHADOS (e): 2 por ordem;
   · uma seta MOVE elétrons: 2 na seta curva (iônica/concertada), 1 na
     farpa (radicalar). Sai de um par/radical (átomo) ou de uma ligação;
     chega a um átomo ou forma uma ligação;
   · a CARGA FORMAL sai da conta: V − nb − (e/2 das ligações + H implícitos).
   Os H que reagem são átomos explícitos; os outros ficam implícitos (fixos).
   Conferir um passo = aplicar as setas do aluno e comparar a ESTRUTURA
   resultante com a esperada (assinatura química, não os ids): outro H
   equivalente é aceito; o carbocátion menos estável não.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  var M = Q3.Mecanismo = {};
  var V = { H: 1, C: 4, N: 5, O: 6, F: 7, Cl: 7, Br: 7, I: 7, S: 6, P: 5, B: 3 };
  var MAXE = { H: 2, C: 8, N: 8, O: 8, F: 8, B: 8 };          // o octeto (H: dueto); Cl, Br, I, S, P podem expandir
  M.V = V;

  /* ══ O SISTEMA ═════════════════════════════════════════════════
     at: { id: { el, nb, hImp, mol } } · lig: { 'a|b': e } (a < b)
     Cada peça entra com um prefixo (m0_, m1_…) e as ligações dela. */
  var chaveLig = function (a, b) { return a < b ? a + '|' + b : b + '|' + a; };
  M.chaveLig = chaveLig;
  M.vazio = function () { return { at: {}, lig: {}, nmol: 0 }; };
  M.copiar = function (S) { var T = { at: {}, lig: {}, nmol: S.nmol }; for (var k in S.at) T.at[k] = Object.assign({}, S.at[k]); for (var l in S.lig) T.lig[l] = S.lig[l]; return T; };
  /* acrescenta uma molécula: átomos [{id, el, hImp, carga?}] e ligações [[a, b, ordem]]; nb sai da neutralidade (ou da carga dada) */
  M.acrescentar = function (S, atomos, ligacoes) {
    var mol = S.nmol++;
    atomos.forEach(function (a) { S.at[a.id] = { el: a.el, nb: 0, hImp: a.hImp || 0, mol: mol }; });
    ligacoes.forEach(function (l) { S.lig[chaveLig(l[0], l[1])] = 2 * (l[2] || 1); });
    atomos.forEach(function (a) { var b = M.ligacoes(S, a.id) + (a.hImp || 0); S.at[a.id].nb = V[a.el] - b - (a.carga || 0); });
    return mol;
  };
  /* a partir de um SMILES (Q3.deSmiles): os pesados com H implícitos; explicitos: { idPesado: nº de H explícitos } */
  M.deSmiles = function (S, smiles, pref, explicitos, carga) {
    var g = Q3.deSmiles(smiles), ids = g.pesados(), at = [], lg = [], mapa = {};
    ids.forEach(function (id, i) { mapa[id] = pref + (i + 1); });
    ids.forEach(function (id, i) {
      var nE = (explicitos && explicitos[i + 1]) || 0, h = g.hidrogenios(id);
      at.push({ id: mapa[id], el: g.atomos[id].el, hImp: Math.max(0, h - nE), carga: carga && carga[i + 1] ? carga[i + 1] : 0 });
      for (var k = 0; k < nE; k++) { var hid = mapa[id] + 'h' + (k + 1); at.push({ id: hid, el: 'H', hImp: 0 }); lg.push([mapa[id], hid, 1]); }
    });
    g.ligacoes.forEach(function (l) { lg.push([mapa[l.a], mapa[l.b], l.ordem]); });
    var m = M.acrescentar(S, at, lg);
    return { mol: m, ids: ids.map(function (id) { return mapa[id]; }) };
  };
  /* o substrato também como ESTRUTURA (o grafo do gerador de isômeros ou da fórmula digitada), não só SMILES */
  M.deGrafo = function (S, g, pref) {
    var ids = g.pesados(), at = [], lg = [], mapa = {};
    ids.forEach(function (id, i) { mapa[id] = pref + (i + 1); at.push({ id: mapa[id], el: g.atomos[id].el, hImp: g.hidrogenios(id) }); });
    g.ligacoes.forEach(function (l) { if (mapa[l.a] && mapa[l.b]) lg.push([mapa[l.a], mapa[l.b], l.ordem]); });
    var m = M.acrescentar(S, at, lg); return { mol: m, ids: ids.map(function (id) { return mapa[id]; }) };
  };
  M.substrato = function (S, sub, pref) { return typeof sub === 'string' ? M.deSmiles(S, sub, pref) : M.deGrafo(S, sub, pref); };
  M.ligacoes = function (S, id) {           // a soma das ordens (e/2) das ligações explícitas do átomo
    var b = 0; for (var k in S.lig) { var p = k.split('|'); if (p[0] === id || p[1] === id) b += S.lig[k] / 2; } return b;
  };
  M.vizinhos = function (S, id) { var v = []; for (var k in S.lig) { if (!S.lig[k]) continue; var p = k.split('|'); if (p[0] === id) v.push(p[1]); else if (p[1] === id) v.push(p[0]); } return v; };
  M.carga = function (S, id) { var a = S.at[id]; return V[a.el] - a.nb - M.ligacoes(S, id) - a.hImp; };
  M.pares = function (S, id) { return Math.floor(S.at[id].nb / 2); };
  M.radical = function (S, id) { return S.at[id].nb % 2; };
  M.eletrons = function (S, id) { var a = S.at[id]; return a.nb + 2 * (M.ligacoes(S, id) + a.hImp); };   // o que o átomo "vê" (octeto)

  /* ══ APLICAR SETAS ══════════════════════════════════════════════
     seta: { n: 2 | 1,
             de: { at: X } (par isolado / radical de X)  |  { lig: [A, B], lado?: L }  (elétrons da ligação),
             para: { at: Y } | { lig: [B, C] } }
     · de átomo X → átomo Y: forma (ou reforça) a ligação X–Y
     · de ligação A–B → átomo A ou B: a ligação perde e; o átomo ganha (heterólise / homólise)
     · de ligação A–B → átomo Y (fora dela): forma L–Y (L = o lado indicado, o mais perto de Y)
     · de ligação A–B → ligação B–C: os elétrons passam a ser de B–C (a dupla que se forma na eliminação)
     Depois de todas as setas do passo: nenhuma conta negativa, as ligações inteiras, o octeto respeitado. */
  M.aplicar = function (S0, setas) {
    var S = M.copiar(S0), erro = null;
    /* SETAS DEMAIS DA MESMA LIGAÇÃO: diz o que cada quebra pede (o caso clássico: duas setas curvas de um X–X) */
    var pedidos = {};
    setas.forEach(function (s) { if (s.de.lig) { var k = chaveLig(s.de.lig[0], s.de.lig[1]); pedidos[k] = (pedidos[k] || 0) + (s.n || 2); } });
    for (var kp in pedidos) {
      var tem = S0.lig[kp] || 0; if (pedidos[kp] <= tem) continue;
      var pp = kp.split('|'), nome = S0.at[pp[0]].el + '–' + S0.at[pp[1]].el, daMesma = setas.filter(function (s) { return s.de.lig && chaveLig(s.de.lig[0], s.de.lig[1]) === kp; });
      if (tem === 2 && daMesma.length === 2 && daMesma.every(function (s) { return (s.n || 2) === 2 && s.para.at && (s.para.at === pp[0] || s.para.at === pp[1]); }))
        return { ok: false, erro: 'a ' + nome + ' tem 2 elétrons; duas setas curvas pedem 4' };
      return { ok: false, erro: tem ? 'a ' + nome + ' tem ' + tem + ' elétrons; as setas pedem ' + pedidos[kp] : 'não há ligação ' + nome };
    }
    var tira = function (k, n) { if (!(k in S.lig) || S.lig[k] < n) erro = 'não há elétrons nessa ligação'; else S.lig[k] -= n; };
    var poe = function (a, b, n) { if (a === b) { erro = 'uma ligação precisa de dois átomos'; return; } var k = chaveLig(a, b); S.lig[k] = (S.lig[k] || 0) + n; };
    setas.forEach(function (s) {
      if (erro) return; var n = s.n || 2;
      if (s.de.at) {
        var X = s.de.at; if (!S.at[X] || S.at[X].nb < n) { erro = 'esse átomo não tem ' + (n === 2 ? 'par isolado' : 'elétron livre'); return; }
        S.at[X].nb -= n;
        if (s.para.at) poe(X, s.para.at, n);
        else { var o = s.para.lig[0] === X ? s.para.lig[1] : s.para.lig[0]; poe(X, o, n); }
      } else {
        var A = s.de.lig[0], B = s.de.lig[1]; tira(chaveLig(A, B), n); if (erro) return;
        if (s.para.at) {
          var Y = s.para.at;
          if (Y === A || Y === B) S.at[Y].nb += n;                              // os elétrons ficam num dos átomos
          else poe(s.de.lado && (s.de.lado === A || s.de.lado === B) ? s.de.lado : A, Y, n);   // formam ligação com Y
        } else {
          var C1 = s.para.lig[0], C2 = s.para.lig[1], comum = (C1 === A || C1 === B) ? C1 : (C2 === A || C2 === B) ? C2 : null;
          if (!comum) erro = 'os elétrons de uma ligação só passam para uma ligação vizinha';
          else poe(C1, C2, n);
        }
      }
    });
    if (!erro) for (var k in S.lig) { if (S.lig[k] % 2) { erro = 'sobrou meia ligação: falta a outra farpa'; break; } if (!S.lig[k]) delete S.lig[k]; }
    if (!erro) for (var id in S.at) { var lim = MAXE[S.at[id].el]; if (lim && M.eletrons(S, id) > lim) { erro = S.at[id].el + ' ficaria com mais de ' + lim + ' elétrons'; break; } }
    return erro ? { ok: false, erro: erro } : { ok: true, S: S };
  };

  /* ══ A ASSINATURA QUÍMICA (para comparar estruturas, não ids) ══
     refinamento à Weisfeiler-Lehman sobre cada molécula (componente): elemento, carga, pares, radical,
     H implícitos e ligações; o sistema é o multiconjunto das assinaturas das moléculas. */
  M.componentes = function (S) {
    var vis = {}, comps = [];
    Object.keys(S.at).forEach(function (id) {
      if (vis[id]) return; var c = [], fila = [id]; vis[id] = 1;
      while (fila.length) { var x = fila.shift(); c.push(x); M.vizinhos(S, x).forEach(function (y) { if (!vis[y]) { vis[y] = 1; fila.push(y); } }); }
      comps.push(c);
    });
    return comps;
  };
  /* cada rodada resume o rótulo pelo CONTEÚDO (FNV-1a), não pela posição numa ordenação: rótulos diferentes
     continuam diferentes de uma molécula para outra */
  var resumo = function (t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); };
  M.assinaturaMol = function (S, ids) {
    var rot = {}; ids.forEach(function (id) { var a = S.at[id]; rot[id] = a.el + '/' + M.carga(S, id) + '/' + a.nb + '/' + a.hImp; });
    for (var it = 0; it < Math.min(ids.length, 12) + 1; it++) {
      var novo = {};
      ids.forEach(function (id) { novo[id] = resumo(rot[id] + '(' + M.vizinhos(S, id).map(function (v) { return S.lig[chaveLig(id, v)] / 2 + ':' + rot[v]; }).sort().join(',') + ')'); });
      rot = novo;
    }
    return ids.map(function (id) { return rot[id]; }).sort().join(';');
  };
  M.assinatura = function (S) { return M.componentes(S).map(function (c) { return M.assinaturaMol(S, c); }).sort().join(' + '); };
  M.iguais = function (S1, S2) { return M.assinatura(S1) === M.assinatura(S2); };

  /* ══ O CARBOCÁTION MAIS ESTÁVEL (Markovnikov) ══
     o grau de substituição: quantos carbonos estão ligados ao carbono (terciário > secundário > primário) */
  M.substituicao = function (S, id) { return M.vizinhos(S, id).filter(function (v) { return S.at[v].el === 'C'; }).length; };

  /* ══ OS MODELOS DA ADIÇÃO ═══════════════════════════════════════
     cada modelo monta o sistema e devolve os passos: { setas esperadas, o que se forma, a explicação } */
  M.modelos = {};
  /* HX + alceno (eletrofílica, Markovnikov): 1) a dupla ataca o H, e o H–X se rompe (X⁻); 2) X⁻ ataca o C⁺ */
  M.modelos.hx = function (smilesAlceno, X) {
    var S = M.vazio(), alc = M.substrato(S, smilesAlceno, 'a');
    var hx = M.deSmiles(S, X, 'r', { 1: 1 });                      // H–X, com o H explícito
    var Xid = hx.ids[0], H = Xid + 'h1';
    var dupla = null; for (var k in S.lig) { var p = k.split('|'); if (S.lig[k] === 4 && S.at[p[0]].el === 'C' && S.at[p[1]].el === 'C') { dupla = p; break; } }
    if (!dupla) return { ok: false, erro: 'o reagente não tem dupla C=C' };
    var s0 = M.substituicao(S, dupla[0]), s1 = M.substituicao(S, dupla[1]);
    var cMais = s0 >= s1 ? dupla[0] : dupla[1], cMenos = cMais === dupla[0] ? dupla[1] : dupla[0];
    var p1 = [{ n: 2, de: { lig: [dupla[0], dupla[1]], lado: cMenos }, para: { at: H } }, { n: 2, de: { lig: [H, Xid] }, para: { at: Xid } }];
    var r1 = M.aplicar(S, p1); if (!r1.ok) return { ok: false, erro: 'modelo: ' + r1.erro };
    var p2 = [{ n: 2, de: { at: Xid }, para: { at: cMais } }];
    var r2 = M.aplicar(r1.S, p2); if (!r2.ok) return { ok: false, erro: 'modelo: ' + r2.erro };
    return { ok: true, inicio: S, empate: s0 === s1, passos: [
      { setas: p1, antes: S, depois: r1.S, explica: 'A dupla C=C (rica em elétrons) ataca o H; a ligação H–' + X + ' se rompe e os elétrons ficam no ' + X + ' (' + X + '⁻). O H vai para o carbono menos substituído e o carbocátion fica no mais substituído, o mais estável (regra de Markovnikov).' },
      { setas: p2, antes: r1.S, depois: r2.S, explica: 'O ' + X + '⁻ usa um par isolado para ligar-se ao carbocátion.' }] };
  };
  /* ══ A MOLÉCULA ORGÂNICA, A FÓRMULA, O SMILES E O NOME ══════════ */
  M.organico = function (S) {          // a molécula com mais carbonos (o substrato e o que ele vira)
    var melhor = null, nC = -1;
    M.componentes(S).forEach(function (c) { var k = c.filter(function (id) { return S.at[id].el === 'C'; }).length; if (k > nC) { nC = k; melhor = c; } });
    return melhor || [];
  };
  M.formulaDe = function (S, ids) {
    var cont = {}; ids.forEach(function (id) { var a = S.at[id]; cont[a.el] = (cont[a.el] || 0) + 1; if (a.hImp) cont.H = (cont.H || 0) + a.hImp; });
    var sub = function (n) { return n > 1 ? String(n).split('').map(function (d) { return '₀₁₂₃₄₅₆₇₈₉'[+d]; }).join('') : ''; };
    var ordem = ['C', 'H'].concat(Object.keys(cont).filter(function (e) { return e !== 'C' && e !== 'H'; }).sort());
    return ordem.filter(function (e) { return cont[e]; }).map(function (e) { return e + sub(cont[e]); }).join('');
  };
  /* o SMILES da molécula (sem os H, que voltam implícitos ao ler): DFS com fechamentos de anel */
  M.smilesDe = function (S, ids) {
    var pes = ids.filter(function (id) { return S.at[id].el !== 'H'; }); if (!pes.length) return '';
    var vis = {}, fecha = {}, prox = 1, abertos = {};
    var viz = function (id) { return M.vizinhos(S, id).filter(function (v) { return S.at[v].el !== 'H' && pes.indexOf(v) >= 0; }); };
    // 1º: achar as ligações que fecham anéis (arestas de retorno da DFS)
    var pai = {}, ordem = [], marca = function (x, p) { vis[x] = 1; ordem.push(x); viz(x).forEach(function (y) { if (y === p) return; if (vis[y]) { var k = chaveLig(x, y); if (!fecha[k]) fecha[k] = prox++; } else { pai[y] = x; marca(y, x); } }); };
    marca(pes[0], null);
    var simb = function (o) { return o === 2 ? '=' : o === 3 ? '#' : ''; };
    var escreve = function (x, p) {
      var t = S.at[x].el;
      viz(x).forEach(function (y) { var k = chaveLig(x, y); if (fecha[k] && y !== p) t += simb(S.lig[k] / 2) + (fecha[k] > 9 ? '%' + fecha[k] : fecha[k]); });
      var filhos = viz(x).filter(function (y) { return pai[y] === x; });
      filhos.forEach(function (y, i) { var r = simb(S.lig[chaveLig(x, y)] / 2) + escreve(y, x); t += i < filhos.length - 1 ? '(' + r + ')' : r; });
      return t;
    };
    return escreve(pes[0], null);
  };
  M.nomeDe = function (S, ids) {
    try {
      var g = Q3.deSmiles(M.smilesDe(S, ids)), r = Q3.Nomenclatura && Q3.Nomenclatura.nomear(g);
      if ((!r || !r.ok) && Q3.NomenclaturaCompleta) r = Q3.NomenclaturaCompleta.nomear(g, { amplo: true });
      return r && r.ok ? r.nome : null;
    } catch (e) { return null; }
  };
  /* ══ A CLASSIFICAÇÃO PELO RESULTADO (a da literatura: o resultado, não o caminho) ══
     compara a molécula orgânica antes e depois: as ligações π entre carbonos e os átomos */
  M.classificar = function (Sa, Sd) {
    var oa = M.organico(Sa), od = M.organico(Sd);
    var pi = function (S, ids) { var n = 0; for (var k in S.lig) { var p = k.split('|'); if (ids.indexOf(p[0]) >= 0 && S.at[p[0]].el === 'C' && S.at[p[1]].el === 'C') n += S.lig[k] / 2 - 1; } return n; };
    var conta = function (S, ids) { var n = 0; ids.forEach(function (id) { n += 1 + S.at[id].hImp; }); return n; };
    var dPi = pi(Sd, od) - pi(Sa, oa), dAt = conta(Sd, od) - conta(Sa, oa);
    if (dPi < 0 && dAt > 0) return { tipo: 'adição' };          // a π entre carbonos se abriu e átomos entraram
    if (dPi > 0 && dAt < 0) return { tipo: 'eliminação' };      // saíram átomos e formou-se uma π entre carbonos
    if (dPi === 0) return { tipo: 'substituição' };             // um grupo saiu e outro entrou no lugar
    return { tipo: 'outra' };
  };

  /* ══ O QUE ACONTECEU (o laboratório descreve, não julga) ══════════
     compara dois estados e devolve DADOS curtos (o painel não explica: mostra), em até três linhas:
       1. as ligações que mudaram — formada, rompida (e o tipo da quebra: homolítica = radicais,
          heterolítica = íons) ou mudou de ordem (C=C → C–C);
       2. o que surgiu — carbocátion de que tipo, íon haleto, oxônio, halônio, radicais, o intermediário
          tetraédrico, o carboxilato, a aromaticidade de volta;
       3. a energia (nos passos radicalares).
     E se o sistema ficou ESTÁVEL (todos neutros — fora o catalisador regenerado — e octetos completos). */
  var NOME_EL = { C: 'C', H: 'H', O: 'O', N: 'N', Br: 'Br', Cl: 'Cl', I: 'I', F: 'F', S: 'S' };
  M.tipoCarbocation = function (S, id) {
    var n = M.substituicao(S, id);
    return n >= 3 ? { nome: 'terciário', nota: 'o mais estável: três grupos de carbono doam elétrons para o C⁺' }
      : n === 2 ? { nome: 'secundário', nota: 'estabilidade intermediária' }
      : n === 1 ? { nome: 'primário', nota: 'pouco estável: na prática quase não se forma, e o caminho que passa por ele é lento' }
      : { nome: 'metila', nota: 'o menos estável de todos' };
  };
  var juntarIguais = function (lista) {
    var cont = {}, ordem = []; lista.forEach(function (t) { if (!cont[t]) ordem.push(t); cont[t] = (cont[t] || 0) + 1; });
    return ordem.map(function (t) { return (cont[t] > 1 ? cont[t] + ' ' : '') + t; });
  };
  M.descrever = function (Sa, Sb) {
    var nome = function (S, id) { return NOME_EL[S.at[id].el] || S.at[id].el; };
    var simb = function (e) { return e >= 6 ? '≡' : e >= 4 ? '=' : '–'; };
    var HALETO = { F: 'fluoreto', Cl: 'cloreto', Br: 'brometo', I: 'iodeto' };
    var chaves = {}; Object.keys(Sa.lig).concat(Object.keys(Sb.lig)).forEach(function (k) { chaves[k] = 1; });
    var ligs = [], esp = [], neutros = [], energia = [], cations = [], homolitica = false, heterolitica = false;
    // 1. AS LIGAÇÕES (e o tipo da quebra de cada uma que se rompeu)
    Object.keys(chaves).forEach(function (k) {
      var ea = Sa.lig[k] || 0, eb = Sb.lig[k] || 0; if (ea === eb) return;
      var p = k.split('|'), a = nome(Sb, p[0]), b = nome(Sb, p[1]);
      if (!ea) { ligs.push(a + '–' + b + ' formada'); return; }
      if (eb) { ligs.push(a + simb(ea) + b + ' → ' + a + simb(eb) + b); return; }
      var ru = M.radical(Sb, p[0]) && !M.radical(Sa, p[0]), rv = M.radical(Sb, p[1]) && !M.radical(Sa, p[1]);
      var qu = M.carga(Sb, p[0]) - M.carga(Sa, p[0]), qv = M.carga(Sb, p[1]) - M.carga(Sa, p[1]), tipo = '';
      if (ru && rv) { homolitica = true; tipo = ' (homolítica)'; }          // um elétron para cada lado: radicais
      else if (qu * qv < 0) { heterolitica = true; tipo = ' (heterolítica)'; }   // o par todo para um lado: íons
      ligs.push(a + simb(ea) + b + ' rompida' + tipo);
    });
    // 2. O QUE SURGIU: as cargas e os radicais novos
    Object.keys(Sb.at).forEach(function (id) {
      var qa = Sa.at[id] ? M.carga(Sa, id) : 0, qb = M.carga(Sb, id), el = Sb.at[id].el, ra = Sa.at[id] ? M.radical(Sa, id) : 0, rb = M.radical(Sb, id);
      var hal = el === 'Br' || el === 'Cl' || el === 'I', nv = M.vizinhos(Sb, id).length;
      if (qb !== qa) {
        if (qb > 0 && el === 'C' && M.noAnel(Sb, id, 6)) { cations.push({ id: id, tipo: 'arênio' }); esp.push('íon arênio'); }
        else if (qb > 0 && el === 'C') { var tc = M.tipoCarbocation(Sb, id); cations.push({ id: id, tipo: tc.nome }); esp.push('carbocátion ' + tc.nome); }
        else if (qb > 0 && el === 'O') esp.push('íon oxônio');
        else if (qb > 0 && hal && nv >= 2) esp.push('íon halônio');
        else if (qb > 0 && hal && !nv) esp.push(el + '⁺ (eletrófilo)');
        else if (qb > 0 && el === 'H' && !nv) esp.push('H⁺');
        else if (qb < 0 && HALETO[el]) esp.push(el + '⁻ (' + HALETO[el] + ')');
        else if (qb === 0) neutros.push(el);
        else esp.push(el + (qb > 0 ? '⁺' : '⁻'));
      }
      if (rb && !ra) {
        if (el === 'C') { var nr = M.substituicao(Sb, id); esp.push('radical ' + (nr >= 3 ? 'terciário' : nr === 2 ? 'secundário' : nr === 1 ? 'primário' : 'metila')); }
        else esp.push(el + '•');
      }
    });
    // o INTERMEDIÁRIO TETRAÉDRICO: o C que tinha C=O agora tem quatro ligações simples, duas ou mais com O
    Object.keys(Sb.at).forEach(function (id) {
      if (!Sa.at[id] || Sb.at[id].el !== 'C') return;
      var tinhaCO = M.vizinhos(Sa, id).some(function (v) { return Sa.at[v].el === 'O' && Sa.lig[chaveLig(id, v)] === 4; });
      var vzB = M.vizinhos(Sb, id), simples = vzB.every(function (v) { return Sb.lig[chaveLig(id, v)] === 2; }), nO = vzB.filter(function (v) { return Sb.at[v].el === 'O'; }).length;
      if (tinhaCO && simples && nO >= 2 && vzB.length + Sb.at[id].hImp === 4) esp.push('intermediário tetraédrico');
    });
    // o íon CARBOXILATO (o acetato): um O⁻ ligado a um C que tem C=O
    Object.keys(Sb.at).forEach(function (id) {
      if (Sb.at[id].el !== 'O' || M.carga(Sb, id) !== -1 || (Sa.at[id] && M.carga(Sa, id) === -1)) return;
      var c = M.vizinhos(Sb, id)[0]; if (!c || Sb.at[c].el !== 'C') return;
      if (M.vizinhos(Sb, c).some(function (v) { return v !== id && Sb.at[v].el === 'O' && Sb.lig[chaveLig(c, v)] === 4; })) esp.push('carboxilato (saiu)');
    });
    var anelPi = function (S) { var n = 0; for (var k in S.lig) { var q = k.split('|'); if (S.lig[k] === 4 && S.at[q[0]].el === 'C' && S.at[q[1]].el === 'C' && M.noAnel(S, q[0], 6) && M.noAnel(S, q[1], 6)) n++; } return n; };
    if (anelPi(Sa) === 2 && anelPi(Sb) === 3) esp.push('aromaticidade de volta');
    if (neutros.length) esp.push(neutros.join(' e ') + (neutros.length > 1 ? ' neutros' : ' neutro'));   // as cargas que se anularam
    esp = juntarIguais(esp);                                                                              // Cl• · Cl• → 2 Cl•
    // 3. A ENERGIA (nos passos radicalares)
    var en = M.entalpiaRadicalar(Sa, Sb); if (en) energia.push(en.texto);
    return { ligacoes: ligs, especies: esp, energia: energia, itens: ligs.concat(esp, energia), linhas: [ligs, esp, energia].filter(function (l) { return l.length; }),
      cations: cations, estavel: M.estavel(Sb), homolitica: homolitica, heterolitica: heterolitica };
  };
  /* ESTÁVEL: nenhum carbocátion, nenhum radical e nenhum carbono com menos de 8 elétrons; as cargas que
     sobram estão só em íons simples conhecidos (H3O+, haletos), como o catalisador que volta */
  M.estavel = function (S) {
    /* nenhum radical; todo C neutro e com octeto; todo heteroátomo com octeto (S e P podem expandir); cada
       molécula com carga total ZERO — cargas dentro de uma molécula neutra valem (o grupo nitro: N⁺ e O⁻) —
       ou um íon simples conhecido (H3O+, um haleto livre) */
    var atomoOk = Object.keys(S.at).every(function (id) {
      var a = S.at[id]; if (M.radical(S, id)) return false;
      if (a.el === 'C') return (M.carga(S, id) === 0 || M.ehCO(S, id)) && M.eletrons(S, id) === 8;   // o C⁻ do C≡O (carga formal, molécula neutra) vale
      if (a.el === 'H') return M.eletrons(S, id) === 2;
      if (a.el === 'S' || a.el === 'P') return M.eletrons(S, id) >= 8;
      return M.eletrons(S, id) === 8;
    });
    if (!atomoOk) return false;
    return M.componentes(S).every(function (c) {
      var q = c.reduce(function (t, id) { return t + M.carga(S, id); }, 0); if (q === 0) return true;
      if (c.length === 1 && q === -1 && ['F', 'Cl', 'Br', 'I'].indexOf(S.at[c[0]].el) >= 0) return true;          // haleto livre
      if (q === 1 && c.length === 4 && c.filter(function (id) { return S.at[id].el === 'O'; }).length === 1 && c.filter(function (id) { return S.at[id].el === 'H'; }).length === 3) return true;   // H3O+
      return false;
    });
  };


  /* o C do MONÓXIDO DE CARBONO, C≡O: a terceira ligação é dativa (o par veio do O) — daí as cargas formais ⊖ no C e ⊕ no O */
  M.ehCO = function (S, id) {
    var a = S.at[id]; if (!a || a.el !== 'C' || a.hImp) return false;
    var vz = M.vizinhos(S, id); return vz.length === 1 && S.at[vz[0]].el === 'O' && S.lig[chaveLig(id, vz[0])] === 6;
  };
  /* a primeira dupla C=C e os seus carbonos (o mais e o menos substituído) */
  M.duplaCC = function (S) {
    for (var k in S.lig) { var p = k.split('|'); if (S.lig[k] === 4 && S.at[p[0]].el === 'C' && S.at[p[1]].el === 'C') {
      var s0 = M.substituicao(S, p[0]), s1 = M.substituicao(S, p[1]), mais = s0 >= s1 ? p[0] : p[1];
      return { a: p[0], b: p[1], mais: mais, menos: mais === p[0] ? p[1] : p[0], empate: s0 === s1 };
    } }
    return null;
  };
  var passo = function (antes, setas, explica) { var r = M.aplicar(antes, setas); if (!r.ok) throw new Error('modelo: ' + r.erro); return { setas: setas, antes: antes, depois: r.S, explica: explica }; };

  /* HIDRATAÇÃO ÁCIDA: 1) a dupla ataca o H do H3O+; 2) a água ataca o C+; 3) outra água retira o H do oxônio
     (o catalisador volta). Catalisadores: H2SO4, H3PO4, ácido sulfônico seguem; com HCl, o Cl− compete com a
     água pelo C+ (produto lateral); com ácido acético (fraco), quase não há H3O+: o mecanismo não avança. */
  M.CATALISADORES = {
    H2SO4: { nome: 'ácido sulfúrico (H₂SO₄)', forte: true },
    H3PO4: { nome: 'ácido fosfórico (H₃PO₄)', forte: true },
    TsOH: { nome: 'ácido p-toluenossulfônico', forte: true },
    HCl: { nome: 'ácido clorídrico (HCl)', forte: true, nucleofilo: 'Cl' },
    AcOH: { nome: 'ácido acético (CH₃COOH)', forte: false }
  };
  M.modelos.hidratacao = function (smilesAlceno, cat) {
    var c = M.CATALISADORES[cat || 'H2SO4'];
    if (!c.forte) return { ok: true, naoAvanca: true, explica: 'O ' + c.nome + ' é um ácido fraco: em água ele quase não forma H₃O⁺, e a dupla C=C não é protonada. Sem o carbocátion, o mecanismo não avança.' };
    var S = M.vazio(); M.substrato(S, smilesAlceno, 'a');
    var h3o = M.deSmiles(S, 'O', 'h', { 1: 3 }, { 1: 1 }), w1 = M.deSmiles(S, 'O', 'w', { 1: 2 }), w2 = M.deSmiles(S, 'O', 'v', { 1: 2 });
    var cl = null; if (c.nucleofilo) { M.acrescentar(S, [{ id: 'c1', el: 'Cl', hImp: 0, carga: -1 }], []); cl = { ids: ['c1'] }; }   // o íon cloreto (fora do SMILES)
    var d = M.duplaCC(S); if (!d) return { ok: false, erro: 'o reagente não tem dupla C=C' };
    var O1 = h3o.ids[0], H1 = O1 + 'h1', Ow = w1.ids[0], Ov = v2id(w2), Hw = Ow + 'h1';
    function v2id(x) { return x.ids[0]; }
    var p1 = passo(S, [{ n: 2, de: { lig: [d.a, d.b], lado: d.menos }, para: { at: H1 } }, { n: 2, de: { lig: [H1, O1] }, para: { at: O1 } }],
      'A dupla C=C ataca um H do H₃O⁺; a ligação O–H se rompe e sobra uma água. O H vai para o carbono menos substituído, e o carbocátion fica no mais substituído (Markovnikov).');
    var p2 = passo(p1.depois, [{ n: 2, de: { at: Ow }, para: { at: d.mais } }], 'Uma molécula de água usa um par isolado do O para ligar-se ao carbocátion: forma-se um íon oxônio (O com carga +).');
    var p3 = passo(p2.depois, [{ n: 2, de: { at: Ov }, para: { at: Hw } }, { n: 2, de: { lig: [Hw, Ow] }, para: { at: Ow } }], 'Outra água retira um H do oxônio: forma-se o álcool, e o H₃O⁺ volta — o ácido é catalisador, não é consumido.');
    var lateral = null;
    if (cl) { var rl = M.aplicar(p1.depois, [{ n: 2, de: { at: cl.ids[0] }, para: { at: d.mais } }]); if (rl.ok) lateral = { S: rl.S, explica: 'Com HCl, o Cl⁻ também ataca o carbocátion, competindo com a água: forma-se um cloreto de alquila como produto lateral.' }; }
    return { ok: true, inicio: S, empate: d.empate, catalisador: c, passos: [p1, p2, p3], lateral: lateral };
  };

  /* HALOGENAÇÃO (Br2, Cl2): 1) a dupla ataca um X, que fecha o anel de HALÔNIO (X+ ligado aos dois C) e o X–X
     se rompe (X−); 2) o X− abre o anel pelo lado oposto, no carbono mais substituído: o di-haleto vicinal */
  M.modelos.halogenacao = function (smilesAlceno, X) {
    var S = M.vazio(); M.substrato(S, smilesAlceno, 'a'); var x2 = M.deSmiles(S, X + X, 'x');
    var d = M.duplaCC(S); if (!d) return { ok: false, erro: 'o reagente não tem dupla C=C' };
    var Xa = x2.ids[0], Xb = x2.ids[1];
    var p1 = passo(S, [{ n: 2, de: { lig: [d.a, d.b], lado: d.menos }, para: { at: Xa } }, { n: 2, de: { at: Xa }, para: { at: d.mais } }, { n: 2, de: { lig: [Xa, Xb] }, para: { at: Xb } }],
      'A dupla C=C ataca um ' + X + ', que usa um par isolado para ligar-se também ao outro carbono: forma-se o íon ' + (X === 'Br' ? 'bromônio' : 'clorônio') + ', um anel de três átomos. A ligação ' + X + '–' + X + ' se rompe e sobra o ' + X + '⁻.');
    var p2 = passo(p1.depois, [{ n: 2, de: { at: Xb }, para: { at: d.mais } }, { n: 2, de: { lig: [Xa, d.mais] }, para: { at: Xa } }],
      'O ' + X + '⁻ ataca um carbono do anel pelo lado oposto ao ' + X + ' (adição anti) e o anel se abre: os dois ' + X + ' ficam em carbonos vizinhos.');
    return { ok: true, inicio: S, empate: d.empate, passos: [p1, p2] };
  };

  /* HIDROGENAÇÃO CATALÍTICA (H2 com Ni, Pt ou Pd): acontece na superfície do metal — sem setas no ensino médio.
     O produto: a dupla vira simples e cada carbono recebe um H. */
  M.modelos.hidrogenacao = function (smilesAlceno) {
    var S = M.vazio(); M.substrato(S, smilesAlceno, 'a'); var d = M.duplaCC(S); if (!d) return { ok: false, erro: 'o reagente não tem dupla C=C' };
    var P = M.copiar(S); P.lig[chaveLig(d.a, d.b)] = 2; P.at[d.a].hImp++; P.at[d.b].hImp++;
    return { ok: true, inicio: S, semSetas: true, produto: P, passos: [], explica: 'O H₂ e o alceno se prendem à superfície do metal (Ni, Pt ou Pd), que enfraquece as ligações; os dois H entram pelo mesmo lado da dupla. Não há carbocátion: no ensino médio, esta adição não se representa com setas.' };
  };
  /* ══ OS MODELOS DA ELIMINAÇÃO ═══════════════════════════════════
     o substrato com os H dos carbonos VIZINHOS (β) explícitos — a seta da base precisa chegar a eles.
     α: o carbono do grupo que sai (OH ou X); β: os carbonos ligados ao α que têm H.
     ZAITSEV: forma-se mais o alceno MAIS substituído (mais carbonos ligados aos dois carbonos da dupla). */
  M.eliminavel = function (g) {           // o grupo que sai (OH num carbono sp3, ou um halogênio) com algum H vizinho
    var ids = g.pesados(), alvo = null;
    ids.forEach(function (id) {
      if (alvo) return; var el = g.atomos[id].el, vz = g.vizinhos(id);
      var grupo = (el === 'O' && g.hidrogenios(id) === 1 && vz.length === 1) || ((el === 'Cl' || el === 'Br' || el === 'I') && vz.length === 1);
      if (!grupo) return; var a = vz[0].id; if (g.atomos[a].el !== 'C' || g.vizinhos(a).some(function (v) { return v.ordem > 1; })) return;
      var betas = g.vizinhos(a).filter(function (v) { return g.atomos[v.id].el === 'C' && g.hidrogenios(v.id) > 0 && v.ordem === 1; });
      if (betas.length) alvo = { grupo: id, alfa: a, betas: betas.map(function (v) { return v.id; }), tipo: el === 'O' ? 'alcool' : 'haleto' };
    });
    return alvo;
  };
  M.substratoEliminacao = function (S, sub, pref) {
    var g = typeof sub === 'string' ? Q3.deSmiles(sub) : sub, el = M.eliminavel(g); if (!el) return null;
    var ids = g.pesados(), at = [], lg = [], mapa = {};
    ids.forEach(function (id, i) { mapa[id] = pref + (i + 1); });
    ids.forEach(function (id) {
      var h = g.hidrogenios(id), nE = el.betas.indexOf(id) >= 0 ? h : 0;            // os H dos β: explícitos
      at.push({ id: mapa[id], el: g.atomos[id].el, hImp: h - nE });
      for (var k = 0; k < nE; k++) { var hid = mapa[id] + 'h' + (k + 1); at.push({ id: hid, el: 'H', hImp: 0 }); lg.push([mapa[id], hid, 1]); }
    });
    g.ligacoes.forEach(function (l) { lg.push([mapa[l.a], mapa[l.b], l.ordem]); });
    M.acrescentar(S, at, lg);
    return { g: g, grupo: mapa[el.grupo], alfa: mapa[el.alfa], betas: el.betas.map(function (b) { return mapa[b]; }), tipo: el.tipo };
  };
  /* o β de Zaitsev: o que deixa a dupla com mais carbonos em volta (no empate, o primeiro) */
  M.zaitsev = function (S, alfa, betas) {
    var nC = function (id) { return M.vizinhos(S, id).filter(function (v) { return S.at[v].el === 'C'; }).length; };
    var melhor = null; betas.forEach(function (b) { var sub = (nC(alfa) - 1) + (nC(b) - 1); if (!melhor || sub > melhor.sub) melhor = { b: b, sub: sub }; });
    return { beta: melhor.b, empate: betas.filter(function (b) { return (nC(alfa) - 1) + (nC(b) - 1) === melhor.sub; }).length > 1 };
  };
  var hDe = function (S, c) { return M.vizinhos(S, c).filter(function (v) { return S.at[v].el === 'H'; })[0]; };

  /* DESIDRATAÇÃO (ácido forte, calor): 1) o OH é protonado pelo H3O+; secundário/terciário (E1): 2) a água sai —
     o carbocátion; 3) uma água retira o H do β e forma-se a dupla. Primário: 2) concertado (sem carbocátion).
     Catalisador fraco: não protona. HCl: o Cl− ataca o carbocátion (substituição, ao lado). */
  M.modelos.desidratacao = function (sub, cat) {
    var c = M.CATALISADORES[cat || 'H2SO4'];
    if (!c.forte) return { ok: true, naoAvanca: true, explica: 'O ' + c.nome + ' é um ácido fraco: quase não forma H₃O⁺, e o OH do álcool não é protonado. Sem a água como grupo de saída, a eliminação não acontece.' };
    var S = M.vazio(), info = M.substratoEliminacao(S, sub, 'a'); if (!info || info.tipo !== 'alcool') return { ok: false, erro: 'o reagente não é um álcool com H no carbono vizinho' };
    var h3o = M.deSmiles(S, 'O', 'h', { 1: 3 }, { 1: 1 }), w = M.deSmiles(S, 'O', 'w', { 1: 2 });
    var cl = null; if (c.nucleofilo) { M.acrescentar(S, [{ id: 'c1', el: 'Cl', hImp: 0, carga: -1 }], []); cl = 'c1'; }
    var O = info.grupo, A = info.alfa, z = M.zaitsev(S, A, info.betas), B = z.beta, Hb = hDe(S, B), O1 = h3o.ids[0], H1 = O1 + 'h1', Ow = w.ids[0];
    var p1 = passo(S, [{ n: 2, de: { at: O }, para: { at: H1 } }, { n: 2, de: { lig: [H1, O1] }, para: { at: O1 } }], 'Um par isolado do O do álcool pega um H do H₃O⁺: o OH vira OH₂⁺ (oxônio). A água é um grupo de saída muito melhor que o OH⁻.');
    var passos = [p1], lateral = null, primario = M.substituicao(S, A) <= 1;
    if (primario) {
      passos.push(passo(p1.depois, [{ n: 2, de: { at: Ow }, para: { at: Hb } }, { n: 2, de: { lig: [B, Hb] }, para: { lig: [B, A] } }, { n: 2, de: { lig: [A, O] }, para: { at: O } }],
        'Num carbono primário não se forma carbocátion (seria muito instável): tudo acontece de uma vez — uma água retira um H do carbono vizinho, a ligação C–H vira a ligação π da dupla e a água sai.'));
    } else {
      var p2 = passo(p1.depois, [{ n: 2, de: { lig: [A, O] }, para: { at: O } }], 'A ligação C–O se rompe e a água sai, levando os elétrons: fica o carbocátion ' + M.tipoCarbocation(p1.depois, A).nome + '.');
      passos.push(p2);
      passos.push(passo(p2.depois, [{ n: 2, de: { at: Ow }, para: { at: Hb } }, { n: 2, de: { lig: [B, Hb] }, para: { lig: [B, A] } }],
        'Uma água retira um H de um carbono vizinho ao C⁺; os elétrons da ligação C–H formam a ligação π. O H sai do carbono que deixa a dupla mais substituída (regra de Zaitsev).'));
      if (cl) { var rl = M.aplicar(p2.depois, [{ n: 2, de: { at: cl }, para: { at: A } }]); if (rl.ok) lateral = { S: rl.S, explica: 'Com HCl, o Cl⁻ também ataca o carbocátion: forma-se um cloreto de alquila — uma SUBSTITUIÇÃO, que compete com a eliminação.' }; }
    }
    return { ok: true, inicio: S, empate: z.empate, catalisador: c, passos: passos, lateral: lateral };
  };
  /* DESIDROALOGENAÇÃO (KOH em álcool): E2, um passo concertado — a base retira o H do β, a ligação C–H vira a π
     e o haleto sai. Zaitsev: o H do β que deixa a dupla mais substituída. */
  M.modelos.e2 = function (sub) {
    var S = M.vazio(), info = M.substratoEliminacao(S, sub, 'a'); if (!info || info.tipo !== 'haleto') return { ok: false, erro: 'o reagente não é um haleto com H no carbono vizinho' };
    M.acrescentar(S, [{ id: 'b1', el: 'O', hImp: 1, carga: -1 }], []);                     // a base: OH−
    var X = info.grupo, A = info.alfa, z = M.zaitsev(S, A, info.betas), B = z.beta, Hb = hDe(S, B), nomeX = S.at[X].el;
    var p1 = passo(S, [{ n: 2, de: { at: 'b1' }, para: { at: Hb } }, { n: 2, de: { lig: [B, Hb] }, para: { lig: [B, A] } }, { n: 2, de: { lig: [A, X] }, para: { at: X } }],
      'Tudo de uma vez (E2): o OH⁻ retira um H do carbono vizinho, os elétrons da ligação C–H formam a ligação π, e o ' + nomeX + ' sai como ' + nomeX + '⁻. O H sai do carbono que deixa a dupla mais substituída (regra de Zaitsev).');
    return { ok: true, inicio: S, empate: z.empate, passos: [p1] };
  };
  /* ══ AS FARPAS QUE A QUÍMICA OBRIGA ══════════════════════════════
     uma farpa leva UM elétron, e uma ligação precisa de DOIS: o aluno desenha a farpa que inicia o evento e o
     laboratório completa as que faltam, como nos livros —
     · homólise: farpa de uma ligação para um dos átomos → a outra farpa, para o outro átomo;
     · combinação (terminação): farpa de um radical para outro RADICAL → a farpa de volta;
     · abstração / ataque a X–X: farpa de um radical para um átomo LIGADO a um só vizinho (o H do C–H, o X do X–X)
       → a ligação dele se divide: um elétron vai para a ligação nova, o outro fica no vizinho.
     Farpas repetidas são descartadas. Devolve { setas, adicionadas }. */
  /* op.cadeia (a combustão, Módulo 4): três casos a mais, os da química da chama —
     · β-CISÃO: farpa de uma ligação A–Z para Z (o que sai), com A vizinho de um RADICAL R: o outro elétron
       não fica em A — ele forma a ligação π A=R junto com o elétron de R (CH₃O• → CH₂=O + H•; HOCO• → CO₂ + H•);
     · ABSTRAÇÃO COM π: o átomo que perde o H é vizinho de um radical: o elétron que sobra forma a π com ele
       (R–CH₂–CH•–R' + O₂ → alceno + HO₂•; •CH₂–OH + O₂ → CH₂=O + HO₂•);
     · O C DO CO: um radical que ataca o C do C≡O usa um elétron do par do C, e uma das π vai para o O (HOCO•).
     O O₂ continua BIRRADICAL (•O–O•): nada forma π entre dois O. */
  M.completarFarpas = function (S, setas, op) {
    op = op || {};
    var igual = function (a, b) { return (a.n || 2) === (b.n || 2) && JSON.stringify(a.de) === JSON.stringify(b.de) && JSON.stringify(a.para) === JSON.stringify(b.para); };
    var out = []; setas.forEach(function (s) { if (!out.some(function (o) { return igual(o, s); })) out.push(s); });
    var adic = [], tem = function (s) { return out.concat(adic).some(function (o) { return igual(o, s); }); };
    var daLig = function (k) { return out.concat(adic).filter(function (o) { return o.de.lig && chaveLig(o.de.lig[0], o.de.lig[1]) === k; }); };
    var radicalVizinho = function (A, exceto) {                        // o radical ligado a A por ligação SIMPLES (onde nasce a π)
      if (!op.cadeia) return null;
      return M.vizinhos(S, A).filter(function (R) { return R !== exceto && M.radical(S, R) && S.lig[chaveLig(A, R)] === 2 && !(S.at[R].el === 'O' && S.at[A].el === 'O'); })[0] || null;
    };
    out.forEach(function (s) {
      if ((s.n || 2) !== 1) return;
      if (s.de.lig && s.para.at) {                                     // HOMÓLISE: falta a outra metade
        var A = s.de.lig[0], B = s.de.lig[1], Y = s.para.at; if (Y !== A && Y !== B) return;
        var outro = Y === A ? B : A, k = chaveLig(A, B), R = daLig(k).length < 2 ? radicalVizinho(outro, Y) : null;
        if (R) {                                                        // β-CISÃO: o elétron que fica forma a π com o radical vizinho
          var b1 = { n: 1, de: { lig: [A, B] }, para: { lig: [outro, R] } }, b2 = { n: 1, de: { at: R }, para: { lig: [outro, R] } };
          if (!tem(b1)) adic.push(b1); if (!tem(b2)) adic.push(b2); return;
        }
        var par = { n: 1, de: { lig: [A, B] }, para: { at: outro } };
        if (daLig(k).length < 2 && !tem(par)) adic.push(par);
      } else if (s.de.at && s.para.at) {
        var X = s.de.at, Yb = s.para.at; if (!S.at[Yb] || X === Yb) return;
        if (M.radical(S, Yb)) { var volta = { n: 1, de: { at: Yb }, para: { at: X } }; if (!tem(volta)) adic.push(volta); return; }   // COMBINAÇÃO
        var vz = M.vizinhos(S, Yb);
        if (op.cadeia && S.at[Yb].el === 'C' && S.at[Yb].nb === 2 && vz.length === 1 && S.at[vz[0]].el === 'O' && S.lig[chaveLig(Yb, vz[0])] === 6) {   // o C do CO
          var c1 = { n: 1, de: { at: Yb }, para: { at: X } }, c2 = { n: 2, de: { lig: [Yb, vz[0]] }, para: { at: vz[0] } };
          if (!tem(c1)) adic.push(c1); if (!tem(c2)) adic.push(c2); return;
        }
        if (vz.length !== 1) return;                                    // ABSTRAÇÃO / ataque a X–X: o vizinho único
        var Z = vz[0], kz = chaveLig(Yb, Z); if ((S.lig[kz] || 0) !== 2 || daLig(kz).length) return;
        adic.push({ n: 1, de: { lig: [Z, Yb] }, para: { lig: [Yb, X] } });
        var Rz = radicalVizinho(Z, Yb);
        if (Rz && Rz !== X) { adic.push({ n: 1, de: { lig: [Z, Yb] }, para: { lig: [Z, Rz] } }); adic.push({ n: 1, de: { at: Rz }, para: { lig: [Z, Rz] } }); }   // ABSTRAÇÃO COM π
        else adic.push({ n: 1, de: { lig: [Z, Yb] }, para: { at: Z } });
      }
    });
    adic.forEach(function (a) { a.completada = true; });
    return { setas: out.concat(adic), adicionadas: adic };
  };

  /* ══ A ENERGIA DE UM PASSO RADICALAR (ΔH pelas energias de dissociação, kJ/mol, valores aproximados de tabela)
     ΔH ≈ Σ(ligações rompidas) − Σ(ligações formadas). Só para passos em que todas as ligações mudadas estão na tabela. */
  M.ENERGIA_LIGACAO = function (S, a, b) {
    var ea = S.at[a].el, eb = S.at[b].el, par = [ea, eb].sort().join('–');
    var grauC = function (c) { return M.vizinhos(S, c).filter(function (v) { return S.at[v].el === 'C'; }).length; };
    if (par === 'C–H') { var c = ea === 'C' ? a : b, g = grauC(c); return g === 0 ? 440 : g === 1 ? 421 : g === 2 ? 410 : 400; }
    if (par === 'C–Cl') { var c2 = ea === 'C' ? a : b; return grauC(c2) === 0 ? 352 : 339; }
    if (par === 'Br–C') { var c3 = ea === 'C' ? a : b; return grauC(c3) === 0 ? 293 : 285; }
    return { 'Cl–Cl': 243, 'Br–Br': 193, 'I–I': 151, 'Cl–H': 432, 'Br–H': 366, 'H–I': 298, 'H–H': 436, 'C–C': 377 }[par] || null;
  };
  M.entalpiaRadicalar = function (Sa, Sb) {
    var quebras = [], formadas = [], ok = true, chaves = {};
    Object.keys(Sa.lig).concat(Object.keys(Sb.lig)).forEach(function (k) { chaves[k] = 1; });
    Object.keys(chaves).forEach(function (k) {
      var ea = Sa.lig[k] || 0, eb = Sb.lig[k] || 0; if (ea === eb) return; var p = k.split('|');
      if (ea === 2 && !eb) { var e = M.ENERGIA_LIGACAO(Sa, p[0], p[1]); if (e == null) ok = false; else quebras.push({ k: k, e: e, nome: Sa.at[p[0]].el + '–' + Sa.at[p[1]].el, p: p }); }
      else if (!ea && eb === 2) { var e2 = M.ENERGIA_LIGACAO(Sb, p[0], p[1]); if (e2 == null) ok = false; else formadas.push({ e: e2, nome: Sb.at[p[0]].el + '–' + Sb.at[p[1]].el }); }
      else ok = false;
    });
    var radical = Object.keys(Sa.at).concat(Object.keys(Sb.at)).some(function (id) { return (Sa.at[id] && M.radical(Sa, id)) || (Sb.at[id] && M.radical(Sb, id)); });
    if (!ok || !radical || (!quebras.length && !formadas.length)) return null;
    var dH = quebras.reduce(function (t, q) { return t + q.e; }, 0) - formadas.reduce(function (t, f) { return t + f.e; }, 0);
    var txt = 'ΔH ≈ ' + (dH > 0 ? '+' : dH < 0 ? '−' : '') + Math.abs(dH) + ' kJ/mol';   // ligações rompidas − formadas (as energias médias acima)
    return { dH: dH, texto: txt };
  };

  /* um átomo está num anel de n membros? (busca curta: os anéis aqui são pequenos) */
  M.noAnel = function (S, id, n) {
    var achou = false, so = function (x) { return S.at[x].el !== 'H'; };
    var busca = function (x, prof, visto) { if (achou) return; M.vizinhos(S, x).filter(so).forEach(function (y) { if (achou) return; if (y === id && prof === n - 1) { achou = true; return; } if (prof < n - 1 && visto.indexOf(y) < 0 && y !== id) busca(y, prof + 1, visto.concat([y])); }); };
    busca(id, 0, [id]); return achou;
  };
  /* o substrato com os H EXPLÍCITOS de quem a função escolher (quantos(id, g) → nº de H) */
  M.explicitar = function (S, sub, pref, quantos) {
    var g = typeof sub === 'string' ? Q3.deSmiles(sub) : sub, ids = g.pesados(), at = [], lg = [], mapa = {};
    ids.forEach(function (id, i) { mapa[id] = pref + (i + 1); });
    ids.forEach(function (id) { var h = g.hidrogenios(id), nE = Math.min(h, quantos(id, g) || 0); at.push({ id: mapa[id], el: g.atomos[id].el, hImp: h - nE }); for (var k = 0; k < nE; k++) { var hid = mapa[id] + 'h' + (k + 1); at.push({ id: hid, el: 'H', hImp: 0 }); lg.push([mapa[id], hid, 1]); } });
    g.ligacoes.forEach(function (l) { lg.push([mapa[l.a], mapa[l.b], l.ordem]); });
    M.acrescentar(S, at, lg); return { g: g, ids: ids.map(function (id) { return mapa[id]; }), mapa: mapa };
  };
  M.ehAlcano = function (g) { return g.pesados().every(function (id) { return g.atomos[id].el === 'C'; }) && g.ligacoes.every(function (l) { return l.ordem === 1; }); };
  M.haleto = function (g) {            // o halogênio num carbono sp3 (o grupo que sai na substituição)
    var x = null; g.pesados().forEach(function (id) { if (x) return; var el = g.atomos[id].el, vz = g.vizinhos(id); if (['Cl', 'Br', 'I'].indexOf(el) < 0 || vz.length !== 1) return; var a = vz[0].id; if (g.atomos[a].el === 'C' && !g.vizinhos(a).some(function (v) { return v.ordem > 1; })) x = { X: id, alfa: a }; });
    return x;
  };

  /* HALOGENAÇÃO DE ALCANOS (X2 e luz) — RADICALAR, com farpas. 1) iniciação: a luz quebra X–X por igual
     (dois X•); 2) propagação: o X• arranca um H (H–X e um radical no carbono); 3) propagação: o radical ataca
     outro X2 (o haleto e um novo X•); 4) terminação: dois X• se juntam. O H sai do carbono do radical MAIS
     ESTÁVEL (terciário > secundário > primário): muito seletivo com Br2; com Cl2, uma mistura. */
  M.modelos.radicalar = function (sub, X) {
    var g0 = typeof sub === 'string' ? Q3.deSmiles(sub) : sub; if (!M.ehAlcano(g0)) return { ok: false, erro: 'o reagente não é um alcano' };
    var S = M.vazio(), info = M.explicitar(S, g0, 'a', function (id, g) { return g.hidrogenios(id); });
    M.deSmiles(S, X + X, 'x'); M.deSmiles(S, X + X, 'y');
    var cs = info.ids.filter(function (id) { return M.vizinhos(S, id).some(function (v) { return S.at[v].el === 'H'; }); });
    cs.sort(function (a, b) { return M.substituicao(S, b) - M.substituicao(S, a) || (a < b ? -1 : 1); });
    var C = cs[0], H = M.vizinhos(S, C).filter(function (v) { return S.at[v].el === 'H'; })[0];
    var nr = M.substituicao(S, C), tipo = nr >= 3 ? 'terciário' : nr === 2 ? 'secundário' : nr === 1 ? 'primário' : 'metila';
    var p1 = passo(S, [{ n: 1, de: { lig: ['x1', 'x2'] }, para: { at: 'x1' } }, { n: 1, de: { lig: ['x1', 'x2'] }, para: { at: 'x2' } }],
      'INICIAÇÃO: a luz quebra a ligação ' + X + '–' + X + ' por igual — cada ' + X + ' fica com um dos elétrons: dois radicais ' + X + '•. É a cisão homolítica, e por isso as setas são FARPAS (um elétron cada).');
    var p2 = passo(p1.depois, [{ n: 1, de: { at: 'x1' }, para: { at: H } }, { n: 1, de: { lig: [C, H] }, para: { lig: [H, 'x1'] } }, { n: 1, de: { lig: [C, H] }, para: { at: C } }],
      'PROPAGAÇÃO: o ' + X + '• arranca um H do alcano — forma-se H–' + X + ' e sobra um elétron no carbono: um radical ' + tipo + '. O H sai do carbono que dá o radical mais estável.');
    var p3 = passo(p2.depois, [{ n: 1, de: { at: C }, para: { at: 'y1' } }, { n: 1, de: { lig: ['y1', 'y2'] }, para: { lig: ['y1', C] } }, { n: 1, de: { lig: ['y1', 'y2'] }, para: { at: 'y2' } }],
      'PROPAGAÇÃO: o radical do carbono ataca outra molécula de ' + X + '₂ — forma-se o haleto de alquila e um novo ' + X + '•, que recomeça o ciclo: uma reação EM CADEIA.');
    var p4 = passo(p3.depois, [{ n: 1, de: { at: 'x2' }, para: { at: 'y2' } }, { n: 1, de: { at: 'y2' }, para: { at: 'x2' } }],
      'TERMINAÇÃO: dois radicais ' + X + '• se encontram e cada um põe o seu elétron numa ligação nova: a cadeia para.');
    return { ok: true, inicio: S, passos: [p1, p2, p3, p4], nota: X === 'Cl' ? 'O Cl• é muito reativo e pouco seletivo: na prática forma-se uma MISTURA dos cloretos possíveis, com o que vem do radical mais estável em maior proporção.' : 'O Br• é muito seletivo: forma-se quase só o brometo que vem do radical mais estável.' };
  };
  /* SN2 (haleto primário ou secundário + OH−, num passo só): o OH− ataca o carbono pelo lado oposto ao X
     enquanto o X sai (a configuração se inverte) */
  M.modelos.sn2 = function (sub) {
    var g = typeof sub === 'string' ? Q3.deSmiles(sub) : sub, h = M.haleto(g); if (!h) return { ok: false, erro: 'o reagente não é um haleto de alquila' };
    var S = M.vazio(), info = M.explicitar(S, g, 'a', function () { return 0; }); M.acrescentar(S, [{ id: 'b1', el: 'O', hImp: 1, carga: -1 }], []);
    var X = info.mapa[h.X], A = info.mapa[h.alfa], nX = S.at[X].el;
    var p1 = passo(S, [{ n: 2, de: { at: 'b1' }, para: { at: A } }, { n: 2, de: { lig: [A, X] }, para: { at: X } }],
      'SN2, num passo só: o OH⁻ usa um par isolado para atacar o carbono pelo lado OPOSTO ao ' + nX + ', enquanto a ligação C–' + nX + ' se rompe e o ' + nX + '⁻ sai. Não há carbocátion; a configuração do carbono se inverte, como um guarda-chuva virado pelo vento.');
    return { ok: true, inicio: S, passos: [p1] };
  };
  /* SN1 (haleto terciário + água): 1) o X sai — o carbocátion terciário; 2) a água ataca; 3) outra água retira o H */
  M.modelos.sn1 = function (sub) {
    var g = typeof sub === 'string' ? Q3.deSmiles(sub) : sub, h = M.haleto(g); if (!h) return { ok: false, erro: 'o reagente não é um haleto de alquila' };
    var S = M.vazio(), info = M.explicitar(S, g, 'a', function () { return 0; }), w = M.deSmiles(S, 'O', 'w', { 1: 2 }), v = M.deSmiles(S, 'O', 'v', { 1: 2 });
    var X = info.mapa[h.X], A = info.mapa[h.alfa], nX = S.at[X].el, Ow = w.ids[0], Ov = v.ids[0], Hw = Ow + 'h1';
    var p1 = passo(S, [{ n: 2, de: { lig: [A, X] }, para: { at: X } }], 'SN1, passo lento: a ligação C–' + nX + ' se rompe sozinha e o ' + nX + '⁻ sai, levando os elétrons: fica o carbocátion ' + M.tipoCarbocation(S, A).nome + '. Só os carbocátions estáveis (terciários) se formam assim.');
    var p2 = passo(p1.depois, [{ n: 2, de: { at: Ow }, para: { at: A } }], 'A água ataca o carbocátion — plano, ele pode ser atacado pelas duas faces: forma-se um oxônio.');
    var p3 = passo(p2.depois, [{ n: 2, de: { at: Ov }, para: { at: Hw } }, { n: 2, de: { lig: [Hw, Ow] }, para: { at: Ow } }], 'Outra água retira um H do oxônio: fica o álcool. (Na prática, a eliminação E1 compete com esta substituição.)');
    return { ok: true, inicio: S, passos: [p1, p2, p3] };
  };
  /* SUBSTITUIÇÃO NO BENZENO (eletrofílica aromática): 1) o anel ataca o eletrófilo — o íon ARÊNIO, sem
     aromaticidade; 2) uma base retira o H do carbono atacado e a aromaticidade volta. O eletrófilo vem do
     catalisador (dito no texto): NO2+ (HNO3 + H2SO4), Br+ (Br2 + FeBr3), Cl+ (Cl2 + AlCl3), CH3+ (CH3Cl + AlCl3),
     CH3CO+ (CH3COCl + AlCl3). */
  M.ELETROFILOS = {
    nitracao: { nome: 'NO₂⁺ (íon nitrônio)', origem: 'O H₂SO₄ protona o HNO₃, que perde água: forma-se o íon nitrônio, NO₂⁺.', base: 'agua' },
    bromacao: { nome: 'Br⁺', origem: 'O FeBr₃ (ácido de Lewis) prende um Br do Br₂ e polariza a ligação: o outro Br fica como Br⁺, o eletrófilo.', base: 'Br' },
    cloracao: { nome: 'Cl⁺', origem: 'O AlCl₃ (ácido de Lewis) prende um Cl do Cl₂ e polariza a ligação: o outro Cl fica como Cl⁺, o eletrófilo.', base: 'Cl' },
    alquilacao: { nome: 'CH₃⁺', origem: 'O AlCl₃ arranca o Cl do CH₃Cl: forma-se o carbocátion CH₃⁺ (Friedel-Crafts).', base: 'Cl' },
    acilacao: { nome: 'CH₃CO⁺ (íon acílio)', origem: 'O AlCl₃ arranca o Cl do CH₃COCl: forma-se o íon acílio, CH₃–C≡O⁺ (Friedel-Crafts).', base: 'Cl' }
  };
  M.modelos.aromatica = function (sub, tipo) {
    var E = M.ELETROFILOS[tipo]; if (!E) return { ok: false, erro: 'eletrófilo desconhecido' };
    var S = M.vazio(), info = M.explicitar(S, sub || 'C1=CC=CC=C1', 'a', function (id, g) { return g.atomos[id].el === 'C' ? g.hidrogenios(id) : 0; });
    var setas1 = [], e = 'e1';
    if (tipo === 'nitracao') { M.acrescentar(S, [{ id: 'e1', el: 'N', carga: 1 }, { id: 'e2', el: 'O' }, { id: 'e3', el: 'O' }], [['e1', 'e2', 2], ['e1', 'e3', 2]]); }
    else if (tipo === 'bromacao' || tipo === 'cloracao') M.acrescentar(S, [{ id: 'e1', el: tipo === 'bromacao' ? 'Br' : 'Cl', carga: 1 }], []);
    else if (tipo === 'alquilacao') M.acrescentar(S, [{ id: 'e1', el: 'C', hImp: 3, carga: 1 }], []);
    else { M.acrescentar(S, [{ id: 'e0', el: 'C', hImp: 3 }, { id: 'e1', el: 'C' }, { id: 'e3', el: 'O', carga: 1 }], [['e0', 'e1', 1], ['e1', 'e3', 3]]); }
    if (E.base === 'agua') M.deSmiles(S, 'O', 'w', { 1: 2 }); else M.acrescentar(S, [{ id: 'w1', el: E.base, carga: -1 }], []);
    var anel = info.ids.filter(function (id) { return S.at[id].el === 'C' && M.noAnel(S, id, 6); }), a1 = null, a2 = null;
    anel.some(function (c) { var d = M.vizinhos(S, c).filter(function (v) { return anel.indexOf(v) >= 0 && S.lig[chaveLig(c, v)] === 4; })[0]; if (d && M.vizinhos(S, c).some(function (v) { return S.at[v].el === 'H'; })) { a1 = c; a2 = d; return true; } return false; });
    var Ha = M.vizinhos(S, a1).filter(function (v) { return S.at[v].el === 'H'; })[0];
    setas1.push({ n: 2, de: { lig: [a1, a2], lado: a1 }, para: { at: e } });
    if (tipo === 'nitracao') setas1.push({ n: 2, de: { lig: ['e1', 'e2'] }, para: { at: 'e2' } });
    if (tipo === 'acilacao') setas1.push({ n: 2, de: { lig: ['e1', 'e3'] }, para: { at: 'e3' } });
    var p1 = passo(S, setas1, E.origem + ' Uma dupla do anel ataca o eletrófilo (' + E.nome + '): forma-se o íon ARÊNIO — o carbono atacado fica com quatro ligações, a carga + passa ao anel, e a aromaticidade se perde.');
    var base = E.base === 'agua' ? 'w1' : 'w1';
    var p2 = passo(p1.depois, [{ n: 2, de: { at: base }, para: { at: Ha } }, { n: 2, de: { lig: [a1, Ha] }, para: { lig: [a1, a2] } }],
      'Uma base retira o H do carbono atacado; os elétrons da ligação C–H refazem a dupla, e o anel RECUPERA A AROMATICIDADE. Por isso o benzeno faz substituição, e não adição: assim o anel aromático, muito estável, é preservado.');
    return { ok: true, inicio: S, passos: [p1, p2], eletrofilo: E };
  };
  /* A ASPIRINA — ácido salicílico + anidrido acético, catalisada por H+ (substituição nucleofílica ACÍLICA):
     1) protonação da carbonila do anidrido; 2) o O FENÓLICO ataca — o intermediário TETRAÉDRICO; 3) uma água
     retira o H do O fenólico; 4) o intermediário se desfaz e o ACETATO sai; 5) o acetato pega o H da carbonila:
     ficam a aspirina e o ácido acético, e o H3O+ volta. */
  M.modelos.acetilacao = function (sub) {
    var g = typeof sub === 'string' ? Q3.deSmiles(sub) : sub;
    var fenol = null; g.pesados().forEach(function (id) {               // o OH ligado ao ANEL (não o do COOH)
      if (fenol || g.atomos[id].el !== 'O' || g.hidrogenios(id) !== 1) return; var vz = g.vizinhos(id); if (vz.length !== 1) return;
      var c = vz[0].id; if (!g.vizinhos(c).some(function (v) { return g.atomos[v.id].el === 'O' && v.ordem === 2; })) fenol = id;
    });
    if (!fenol) return { ok: false, erro: 'o reagente não tem um OH fenólico' };
    var S = M.vazio(), info = M.explicitar(S, g, 'a', function (id) { return id === fenol ? 1 : 0; });
    M.deSmiles(S, 'CC(=O)OC(C)=O', 'n');                                   // o anidrido acético: n1 CH3, n2 C=, n3 =O, n4 O ponte, n5 C=, n6 CH3, n7 =O
    var h3o = M.deSmiles(S, 'O', 'h', { 1: 3 }, { 1: 1 }), w = M.deSmiles(S, 'O', 'w', { 1: 2 });
    var pO = info.mapa[fenol], pH = pO + 'h1', O1 = h3o.ids[0], H1 = O1 + 'h1', Ow = w.ids[0];
    var p1 = passo(S, [{ n: 2, de: { at: 'n3' }, para: { at: H1 } }, { n: 2, de: { lig: [H1, O1] }, para: { at: O1 } }],
      'PROTONAÇÃO: o O de uma carbonila do anidrido pega um H do H₃O⁺ (o catalisador). O carbono dessa carbonila fica mais positivo — mais fácil de atacar.');
    var p2 = passo(p1.depois, [{ n: 2, de: { at: pO }, para: { at: 'n2' } }, { n: 2, de: { lig: ['n2', 'n3'] }, para: { at: 'n3' } }],
      'ATAQUE NUCLEOFÍLICO: um par isolado do O FENÓLICO (o OH do anel) ataca o carbono da carbonila; a ligação π vai para o O. Forma-se o INTERMEDIÁRIO TETRAÉDRICO — o carbono passa a ter quatro ligações simples.');
    var p3 = passo(p2.depois, [{ n: 2, de: { at: Ow }, para: { at: pH } }, { n: 2, de: { lig: [pO, pH] }, para: { at: pO } }],
      'TRANSFERÊNCIA DE PRÓTON: uma água retira o H do O fenólico, que estava com carga +. O intermediário tetraédrico fica neutro.');
    var p4 = passo(p3.depois, [{ n: 2, de: { at: 'n3' }, para: { at: 'n2' } }, { n: 2, de: { lig: ['n2', 'n4'] }, para: { at: 'n4' } }],
      'SAÍDA DO ACETATO: o intermediário se desfaz — um par do OH refaz a dupla C=O, e a ligação com o O da ponte se rompe: sai o íon ACETATO, um bom grupo de saída.');
    var p5 = passo(p4.depois, [{ n: 2, de: { at: 'n4' }, para: { at: H1 } }, { n: 2, de: { lig: ['n3', H1] }, para: { at: 'n3' } }],
      'O acetato pega o H da carbonila: ficam o ÁCIDO ACETILSALICÍLICO (a aspirina) e o ácido acético. O H⁺ do catalisador está de volta (como H₃O⁺).');
    return { ok: true, inicio: S, passos: [p1, p2, p3, p4, p5] };
  };
})();
