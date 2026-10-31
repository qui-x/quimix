/* ══════════════════════════════════════════════════════════════════
   SIRO · O DESENHO DO MECANISMO
   ──────────────────────────────────────────────────────────────────
   A fórmula em BASTÃO: carbono sem rótulo; heteroátomos e os H que reagem
   com o símbolo; pares isolados como pares de pontos nos espaços livres;
   a carga formal num círculo; o radical, um ponto. As posições seguem os
   passos: quando uma ligação nova une duas moléculas, a menor vem para
   junto da outra (no halônio, o X fica entre os dois carbonos, por fora).
   As setas: curvas, com ponta cheia (par de elétrons) ou farpa (um
   elétron). Devolve os PONTOS DE ENCAIXE (pares, ligações, átomos) para o
   imã — na dupla, um perto de cada carbono (a decisão de Markovnikov).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  var DM = Q3.DesenhoMecanismo = {};
  var M = function () { return Q3.Mecanismo; };

  /* ══ AS POSIÇÕES ══════════════════════════════════════════════════ */
  /* um reagente COM CADEIA (o anidrido acético): desenhado pelo mesmo motor de layout do substrato */
  var temCadeia = function (S, c, pes) {
    var Mc = M();
    return pes.length >= 3 || (pes.length === 2 && c.length > 2 && pes.every(function (id) { return S.at[id].el === 'C' || S.at[id].el === 'O'; }) && Mc.vizinhos(S, pes[0]).indexOf(pes[1]) >= 0 && S.at[pes[0]].el === 'C');
  };
  /* as posições do reagente com cadeia, pelo layout 2D (só a conectividade importa), relativas ao canto (x mínimo, y médio) */
  var layoutCadeia = function (S, pes) {
    var Mc = M(), g2 = new Q3.Grafo(), mapa = {}, out = {};
    pes.forEach(function (id) { mapa[id] = g2.addAtomo(S.at[id].el); });
    pes.forEach(function (id) { Mc.vizinhos(S, id).forEach(function (v) { if (mapa[v] && id < v) g2.ligacoes.push({ a: mapa[id], b: mapa[v], ordem: Math.max(1, Math.round((S.lig[Mc.chaveLig(id, v)] || 2) / 2)) }); }); });
    var lay2 = Q3.Geometria.layout(g2), xs2 = pes.map(function (id) { return lay2[mapa[id]].x; }), ys2 = pes.map(function (id) { return lay2[mapa[id]].y; });
    var mx = Math.min.apply(null, xs2), my = (Math.min.apply(null, ys2) + Math.max.apply(null, ys2)) / 2;
    pes.forEach(function (id) { out[id] = { x: lay2[mapa[id]].x - mx, y: lay2[mapa[id]].y - my }; });
    return out;
  };
  /* posições iniciais: o substrato pelo desenho 2D do SIQC; os reagentes à direita da dupla, um embaixo do outro.
     embaixo (opcional, { alvo, reagente }): numa área MAIS ALTA QUE LARGA (o celular em pé), os reagentes vão
     EMBAIXO do substrato, numa fileira — ver reagentesEmbaixo. alvo: o que o primeiro reagente ataca no substrato,
     pela literatura ({ at } ou { lig }); o substrato fica com ele virado para baixo, para os reagentes. reagente: o
     átomo do reagente que faz esse ataque (fica no alto do reagente). */
  DM.posicoesIniciais = function (S, smilesSubstrato, embaixo) {
    var pos = {}, Mc = M(), g = typeof smilesSubstrato === 'string' ? Q3.deSmiles(smilesSubstrato) : smilesSubstrato, lay = Q3.Geometria.layout(g), ids = g.pesados();
    ids.forEach(function (id, i) { pos['a' + (i + 1)] = { x: lay[id].x, y: lay[id].y }; });
    // os H EXPLÍCITOS do substrato (os dos carbonos vizinhos, na eliminação): nos espaços livres em volta do carbono
    Object.keys(S.at).forEach(function (id) {
      if (!pos[id] || S.at[id].el === 'H') return;
      var hs = Mc.vizinhos(S, id).filter(function (v) { return S.at[v].el === 'H' && !pos[v]; }); if (!hs.length) return;
      var p0 = pos[id], ocup = Mc.vizinhos(S, id).filter(function (v) { return pos[v]; }).map(function (v) { return Math.atan2(pos[v].y - p0.y, pos[v].x - p0.x); });
      var obst = Object.keys(pos).filter(function (q) { return q !== id && Mc.vizinhos(S, id).indexOf(q) < 0; }).map(function (q) { return pos[q]; });
      DM.esquivar(p0, ocup, hs.length + S.at[id].hImp, 0.75, obst).slice(0, hs.length).forEach(function (ang, k) { pos[hs[k]] = { x: p0.x + Math.cos(ang) * 0.75, y: p0.y + Math.sin(ang) * 0.75 }; });
    });
    // o alvo dos reagentes: a dupla (adição) ou o carbono do grupo que sai (eliminação)
    var d = Mc.duplaCC(S), grupo = Object.keys(S.at).filter(function (id) { return pos[id] && /^(O|Cl|Br|I)$/.test(S.at[id].el) && Mc.vizinhos(S, id).some(function (v) { return S.at[v].el === 'C'; }); })[0];
    var alvo = d ? { x: (pos[d.a].x + pos[d.b].x) / 2, y: (pos[d.a].y + pos[d.b].y) / 2 } : grupo ? { x: pos[grupo].x, y: pos[grupo].y } : { x: 0, y: 0 };
    var maxX = Math.max.apply(null, Object.keys(pos).map(function (id) { return pos[id].x; }));
    var comps = Mc.componentes(S).filter(function (c) { return c.indexOf('a1') < 0 && !c.some(function (id) { return pos[id]; }); }), y0 = alvo.y - (comps.length - 1) * 0.9;
    if (embaixo) {
      /* o que o reagente ataca, virado para BAIXO: se está na metade de cima do substrato, o desenho é espelhado
         (de cima para baixo — a mesma molécula vista do outro lado). O metano que perde um H para o O₂: o H de
         cima passa para baixo, de frente para o O₂, e as farpas ficam curtas. */
      var a0 = embaixo.alvo, T = a0 && a0.at && pos[a0.at] ? { x: pos[a0.at].x, y: pos[a0.at].y }
        : a0 && a0.lig && pos[a0.lig[0]] && pos[a0.lig[1]] ? { x: (pos[a0.lig[0]].x + pos[a0.lig[1]].x) / 2, y: (pos[a0.lig[0]].y + pos[a0.lig[1]].y) / 2 } : { x: alvo.x, y: alvo.y };
      var ysS = Object.keys(pos).map(function (id) { return pos[id].y; }), meio = (Math.min.apply(null, ysS) + Math.max.apply(null, ysS)) / 2;
      if (T.y < meio - 0.05) { Object.keys(pos).forEach(function (id) { pos[id].y = 2 * meio - pos[id].y; }); T.y = 2 * meio - T.y; }
      DM.reagentesEmbaixo(S, pos, comps, T, embaixo.reagente);
    }
    else comps.forEach(function (c, k) {
      var pes = c.filter(function (id) { return S.at[id].el !== 'H'; }), cx = Math.max(maxX, alvo.x) + 2.2, cy = y0 + k * 1.8;
      if (pes.length === 2 && c.length === 2) { pos[pes[0]] = { x: cx, y: cy }; pos[pes[1]] = { x: cx + 1, y: cy }; return; }   // X–X
      if (temCadeia(S, c, pes)) {
        // um reagente COM CADEIA (o anidrido acético): o mesmo motor de layout do substrato (só a conectividade importa)
        var lay2 = layoutCadeia(S, pes);
        pes.forEach(function (id) { pos[id] = { x: cx + lay2[id].x, y: cy + lay2[id].y }; });
        c.filter(function (id) { return S.at[id].el === 'H'; }).forEach(function (h) { var pai = Mc.vizinhos(S, h)[0]; if (pai && pos[pai]) { var ang = DM.vao(S, pos, pai); pos[h] = { x: pos[pai].x + Math.cos(ang) * 0.75, y: pos[pai].y + Math.sin(ang) * 0.75 }; } });
        return;
      }
      var central = pes[0] || c[0]; pos[central] = { x: cx + 0.6, y: cy };
      var hs = c.filter(function (id) { return id !== central; }), n = hs.length;
      hs.forEach(function (h, i) {                                   // os H em volta, o primeiro virado para o substrato
        var ang = Math.PI + (n === 1 ? 0 : (i - (n - 1) / 2) * (n === 2 ? 1.85 : 2.1));
        pos[h] = { x: pos[central].x + Math.cos(ang) * 0.85, y: pos[central].y + Math.sin(ang) * 0.85 };
      });
    });
    DM.relaxarH(S, pos, true);                                        // os H se acomodam juntos
    return DM.arrumar(S, pos, embaixo || false);                       // a cena inicial também, arrumada
  };
  /* OS REAGENTES EMBAIXO DO SUBSTRATO (a área mais alta que larga: o celular em pé). Lado a lado eles alargam o
     desenho, e a escala é a que cabe na largura: o desenho vira uma faixa no meio da tela. Embaixo, ocupam a altura
     que sobra. Cada reagente com o lado que reage virado para CIMA, para o substrato — o X–X em pé (como se desenha
     o Br₂ chegando à dupla), o H do HX em cima, os H da água para cima —, numa fileira sob o alvo, sem passar
     da largura do substrato quando cabe. O átomo mais alto fica a 2,1 ligações do substrato, como à direita.
     reag (opcional, { at } ou { lig }): o átomo do reagente que a primeira seta da literatura liga ao substrato
     (o H do H₃O⁺ que o O do álcool ataca). Ele fica no alto do seu reagente, e a fileira se ajeita para ele cair
     o mais perto possível de baixo do alvo, sem alargar o desenho.
     As caixas são as do arrumar (com a folga dos H): lado a lado, ninguém é empurrado para a faixa. */
  DM.reagentesEmbaixo = function (S, pos, comps, alvo, reag) {
    var Mc = M(), folgaAt = function (id) { return S.at[id].hImp ? 1.0 : 0.62; }, R = reag ? (reag.at || (reag.lig && reag.lig[0])) : null;
    var subs = Object.keys(pos), sx0 = Infinity, sx1 = -Infinity, sy1 = -Infinity;
    subs.forEach(function (id) { sx0 = Math.min(sx0, pos[id].x - folgaAt(id)); sx1 = Math.max(sx1, pos[id].x + folgaAt(id)); sy1 = Math.max(sy1, pos[id].y); });
    // cada reagente na sua forma, em coordenadas locais (o átomo que reage no alto)
    var blocos = comps.map(function (c) {
      var pes = c.filter(function (id) { return S.at[id].el !== 'H'; }), loc = {}, hsSoltos = [], temR = !!R && c.indexOf(R) >= 0;
      if (pes.length === 2 && c.length === 2) {                                                                         // X–X em pé, o que reage em cima
        var cima = temR && R === pes[1] ? pes[1] : pes[0], baixo = cima === pes[0] ? pes[1] : pes[0];
        loc[cima] = { x: 0, y: 0 }; loc[baixo] = { x: 0, y: 1 };
      } else if (temCadeia(S, c, pes)) {                                                                                // a cadeia: deitada, como no papel
        var lay2 = layoutCadeia(S, pes); pes.forEach(function (id) { loc[id] = lay2[id]; });
        if (temR && loc[R] && loc[R].y > 0.05) pes.forEach(function (id) { loc[id] = { x: loc[id].x, y: -loc[id].y }; });   // o que reage para cima
        hsSoltos = c.filter(function (id) { return S.at[id].el === 'H'; });                                              // os H explícitos, depois, nos vãos
      } else {
        var central = pes[0] || c[0], hs = c.filter(function (id) { return id !== central; }), n = hs.length;
        var angs = hs.map(function (h, i) { return -Math.PI / 2 + (n === 1 ? 0 : (i - (n - 1) / 2) * (n === 2 ? 1.85 : 2.1)); });
        if (temR && hs.indexOf(R) >= 0) {                                                                               // o H que reage no lugar mais alto
          var iCima = 0; angs.forEach(function (a, i) { if (Math.sin(a) < Math.sin(angs[iCima]) - 1e-9) iCima = i; });
          var iR = hs.indexOf(R); hs[iR] = hs[iCima]; hs[iCima] = R;
        }
        loc[central] = { x: 0, y: 0 };
        hs.forEach(function (h, i) { loc[h] = { x: Math.cos(angs[i]) * 0.85, y: Math.sin(angs[i]) * 0.85 }; });
      }
      var b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity, topo: Infinity };
      Object.keys(loc).forEach(function (id) { var f = folgaAt(id), q = loc[id]; b.x0 = Math.min(b.x0, q.x - f); b.x1 = Math.max(b.x1, q.x + f); b.y0 = Math.min(b.y0, q.y - f); b.y1 = Math.max(b.y1, q.y + f); b.topo = Math.min(b.topo, q.y); });
      if (hsSoltos.length) { b.y0 -= 0.75; b.y1 += 0.75; }                                                            // espaço para os H da cadeia
      return { c: c, loc: loc, b: b, hs: hsSoltos, reage: temR };
    });
    /* a fileira: o reagente que reage primeiro numa das pontas (a mais perto do alvo), e a fileira posta para o átomo
       dele cair o mais perto possível de baixo do alvo — sem passar da largura do substrato quando cabe nela, ou, se
       é mais larga, cobrindo o substrato (a largura do desenho é a menor possível nos dois casos) */
    var vao = 0.25, larg = blocos.reduce(function (s, q) { return s + q.b.x1 - q.b.x0; }, 0) + vao * (blocos.length - 1);
    var lo = (sx1 - sx0) >= larg ? sx0 : sx1 - larg, hi = (sx1 - sx0) >= larg ? sx1 - larg : sx0;
    var iRe = Math.max(0, blocos.findIndex(function (k) { return k.reage; })), melhor = null;
    [true, false].forEach(function (primeiro) {
      var ordem = blocos.slice(), kR = ordem.splice(iRe, 1)[0]; if (primeiro) ordem.unshift(kR); else ordem.push(kR);
      var ini = 0, offR = 0;                                              // onde cai o átomo que reage, a partir do começo da fileira
      ordem.forEach(function (k) { if (k === kR) offR = ini + ((R && k.loc[R] ? k.loc[R].x : (k.b.x0 + k.b.x1) / 2) - k.b.x0); ini += k.b.x1 - k.b.x0 + vao; });
      var x0 = Math.max(lo, Math.min(hi, alvo.x - offR)), d = Math.abs(x0 + offR - alvo.x);
      if (!melhor || d < melhor.d - 1e-6) melhor = { d: d, x0: x0, ordem: ordem };
    });
    var x = melhor.x0, topoAt = Math.max(sy1, alvo.y) + 2.1;
    melhor.ordem.forEach(function (k) {
      var dx = x - k.b.x0, dy = topoAt - k.b.topo;
      Object.keys(k.loc).forEach(function (id) { pos[id] = { x: k.loc[id].x + dx, y: k.loc[id].y + dy }; });
      k.hs.forEach(function (h) { var pai = Mc.vizinhos(S, h)[0]; if (pai && pos[pai]) { var ang = DM.vao(S, pos, pai); pos[h] = { x: pos[pai].x + Math.cos(ang) * 0.75, y: pos[pai].y + Math.sin(ang) * 0.75 }; } });
      x += k.b.x1 - k.b.x0 + vao;
    });
  };
  /* o maior espaço livre em volta de um átomo (para pôr um H, um par, um grupo que chega) */
  DM.vao = function (S, pos, id, ignora) {
    var p = pos[id], angs = M().vizinhos(S, id).filter(function (v) { return pos[v] && v !== ignora; }).map(function (v) { return Math.atan2(pos[v].y - p.y, pos[v].x - p.x); }).sort(function (a, b) { return a - b; });
    if (!angs.length) return 0; if (angs.length === 1) return angs[0] + Math.PI;
    var melhor = -1, ang = 0; angs.forEach(function (a, i) { var b = i + 1 < angs.length ? angs[i + 1] : angs[0] + 2 * Math.PI; if (b - a > melhor) { melhor = b - a; ang = a + (b - a) / 2; } });
    return ang;
  };
  /* as posições depois de um passo: as moléculas que se uniram vêm para junto; o resto fica.
     embaixo: a cena tem os reagentes embaixo do substrato (a área mais alta que larga) — o que sai vai para baixo */
  DM.posicoesDepois = function (Sa, Sd, posA, embaixo) {
    /* QUEM SE MOVE: a parte com carbonos é a âncora (fica); do outro lado, só vem o que CHEGA — os átomos
       da molécula nova que vieram da molécula de quem se liga (o H que passa do H3O+ vem sozinho; a água
       que ataca o C+ vem inteira; no halônio, só o X que fecha o anel) */
    var Mc = M(), pos = {}; for (var k in posA) pos[k] = { x: posA[k].x, y: posA[k].y };
    var compA = {}, partesA = Mc.componentes(Sa); partesA.forEach(function (c, i) { c.forEach(function (id) { compA[id] = i; }); });
    var compD = {}; Mc.componentes(Sd).forEach(function (c, i) { c.forEach(function (id) { compD[id] = i; }); });
    var peso = function (i) { return partesA[i].reduce(function (s, id) { return s + (Sa.at[id].el === 'C' ? 100 : 1) + Sa.at[id].hImp; }, 0); };
    var novas = []; for (var l in Sd.lig) if (!Sa.lig[l]) { var p = l.split('|'); if (compA[p[0]] !== compA[p[1]]) novas.push(p); }
    var movidos = {};
    novas.forEach(function (p) {
      var a = p[0], b = p[1], ca = compA[a], cb = compA[b];
      var vem = peso(ca) <= peso(cb) ? a : b, fica = vem === a ? b : a, cVem = compA[vem];
      if (movidos[vem]) return;
      /* o PEDAÇO que chega por esta ligação: o que continua ligado a 'vem' DEPOIS do passo, sem passar pelo lado
         que fica. Num passo só, o H–Br se rompe e cada um se liga a um carbono: são dois pedaços, cada um no seu lugar */
      var parte = [vem], visto = {}, alternativas = null; visto[vem] = 1;
      for (var qi = 0; qi < parte.length; qi++) Mc.vizinhos(Sd, parte[qi]).forEach(function (v) { if (!visto[v] && compA[v] === cVem && pos[v]) { visto[v] = 1; parte.push(v); } });
      var outros = Mc.vizinhos(Sd, vem).filter(function (v) { return compA[v] === compA[fica]; }), alvo;
      if (outros.length >= 2) {                                    // o halônio: entre os dois carbonos, por fora
        var m = { x: (pos[outros[0]].x + pos[outros[1]].x) / 2, y: (pos[outros[0]].y + pos[outros[1]].y) / 2 };
        var ux = pos[outros[1]].y - pos[outros[0]].y, uy = pos[outros[0]].x - pos[outros[1]].x, n = Math.hypot(ux, uy) || 1; ux /= n; uy /= n;
        var c0 = { x: 0, y: 0 }, cnt = 0; for (var id0 in pos) if (compA[id0] === compA[fica]) { c0.x += pos[id0].x; c0.y += pos[id0].y; cnt++; } c0.x /= cnt; c0.y /= cnt;
        if ((m.x - c0.x) * ux + (m.y - c0.y) * uy < 0) { ux = -ux; uy = -uy; }          // para FORA: a partir do meio da ligação
        alvo = { x: m.x + ux * 0.85, y: m.y + uy * 0.85 };
      } else {
        /* QUEM CHEGA: a direção com MAIS FOLGA no arco livre do carbono (a cada 10°, a mais de 40° das ligações),
           contando os átomos e os H implícitos da molécula; no empate, o ziguezague dos livros (120°) */
        var hTerm = function (v) { return Sa.at[v].el === 'H' && Mc.vizinhos(Sa, v).length === 1; };   // um H terminal se reacomoda depois
        var vz = Mc.vizinhos(Sa, fica).filter(function (v) { return pos[v] && !hTerm(v); }), dist = Sd.at[vem].el === 'H' ? 0.75 : 1, pf = pos[fica];
        var ocupF = vz.map(function (v) { return Math.atan2(pos[v].y - pf.y, pos[v].x - pf.x); });
        var hiA = DM.hImplicitos(Sa, pos), obstF = [];
        Object.keys(pos).forEach(function (q) { if (compA[q] === compA[fica] && q !== fica && !(hTerm(q) && Mc.vizinhos(Sa, q)[0] === fica)) obstF.push(pos[q]); });
        // PARA FORA: o grupo que chega se estende para longe do centro da molécula que o recebe
        var cxA = 0, cyA = 0, nA = 0; Object.keys(pos).forEach(function (q) { if (compA[q] === compA[fica] && Sa.at[q].el !== 'H') { cxA += pos[q].x; cyA += pos[q].y; nA++; } });
        var fora = nA > 1 ? Math.atan2(pf.y - cyA / nA, pf.x - cxA / nA) : null;
        Object.keys(hiA).forEach(function (q) { if (q !== fica && compA[q] === compA[fica]) hiA[q].forEach(function (h) { obstF.push(h); }); });
        var difA = function (a, b) { var d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
        var preferidas = vz.length === 1 ? [ocupF[0] + 2 * Math.PI / 3, ocupF[0] - 2 * Math.PI / 3] : [DM.vao(Sa, pos, fica)];
        var dentro = [];                                             // os anéis do carbono: para dentro, não (a convenção dos livros)
        DM.aneisDe(Sa, pos).forEach(function (r) { if (r.indexOf(fica) < 0) return; var cx = 0, cy = 0; r.forEach(function (q) { cx += pos[q].x / r.length; cy += pos[q].y / r.length; }); dentro.push(Math.atan2(cy - pf.y, cx - pf.x)); });
        var melhorA = null, cands = [];
        for (var g10 = 0; g10 < 36; g10++) {
          var an = g10 * Math.PI / 18; if (ocupF.some(function (o) { return difA(o, an) < 0.7; }) || dentro.some(function (d) { return difA(d, an) < 1.1; })) continue;
          var px = pf.x + Math.cos(an) * dist, py = pf.y + Math.sin(an) * dist, f = Infinity;
          obstF.forEach(function (q) { f = Math.min(f, Math.hypot(q.x - px, q.y - py)); });
          var bonus = (preferidas.some(function (pr) { return difA(pr, an) < 0.18; }) ? 0.12 : 0) + (fora != null ? 0.35 * Math.cos(an - fora) : 0);   // o ziguezague; para fora
          cands.push({ an: an, f: f + bonus }); if (!melhorA || f + bonus > melhorA.f) melhorA = { an: an, f: f + bonus };
        }
        var ang2 = melhorA ? melhorA.an : preferidas[0];
        alvo = { x: pf.x + Math.cos(ang2) * dist, y: pf.y + Math.sin(ang2) * dist };
        var alternativas = cands.sort(function (x, y) { return y.f - x.f; }).slice(0, 3).map(function (c3) { return { x: pf.x + Math.cos(c3.an) * dist, y: pf.y + Math.sin(c3.an) * dist }; });
      }
      var dx = alvo.x - pos[vem].x, dy = alvo.y - pos[vem].y;
      parte.forEach(function (id) { pos[id].x += dx; pos[id].y += dy; });
      /* A MOLÉCULA QUE CHEGA: o centro que ganha a ligação nova SE REABRE, como nos livros — as ramificações de
         quem chega giram RÍGIDAS em volta dele: três vão a 90°, 180° e 270° da ligação nova (a cruz do sp³ no papel),
         duas a ±120°, uma ao lado oposto. Testam-se as três melhores direções de chegada × os dois sentidos (a imagem
         e o espelho): fica a de mais folga, contando o alcance dos H implícitos. */
      if (parte.length > 1) {
        var ramos = Mc.vizinhos(Sd, vem).filter(function (u) { return parte.indexOf(u) >= 0; }).map(function (u) {
          var r = [u], vr = {}; vr[u] = 1; vr[vem] = 1;
          for (var qi2 = 0; qi2 < r.length; qi2++) Mc.vizinhos(Sd, r[qi2]).forEach(function (w) { if (!vr[w] && parte.indexOf(w) >= 0) { vr[w] = 1; r.push(w); } });
          return r;
        });
        var rel = {}; parte.forEach(function (id) { rel[id] = { x: pos[id].x - pos[vem].x, y: pos[id].y - pos[vem].y }; });
        var obstP = []; Object.keys(pos).forEach(function (q) { if (parte.indexOf(q) < 0 && compD[q] === compD[vem]) obstP.push(pos[q]); });
        var hiP = DM.hImplicitos(Sa, pos); Object.keys(hiP).forEach(function (q) { if (parte.indexOf(q) < 0 && compD[q] === compD[vem] && q !== fica) hiP[q].forEach(function (h) { obstP.push(h); }); });
        var angDe = function (v) { return Math.atan2(v.y, v.x); };
        var ordem = ramos.slice().sort(function (r1, r2) { return angDe(rel[r1[0]]) - angDe(rel[r2[0]]); });
        var passoAng = ordem.length === 3 ? Math.PI / 2 : ordem.length === 2 ? 2 * Math.PI / 3 : Math.PI;
        var pontosVem = (alternativas && alternativas.length) ? alternativas : [{ x: alvo.x, y: alvo.y }];
        var melhorC = null;
        pontosVem.forEach(function (pv) {
          var thF = Math.atan2(pos[fica].y - pv.y, pos[fica].x - pv.x);           // de quem chega até quem fica
          [1, -1].forEach(function (sentido) {
            var cand = {}; cand[vem] = { x: pv.x, y: pv.y };
            ordem.forEach(function (ramo, k) {
              var alvoAng = thF + sentido * passoAng * (k + 1), rot = alvoAng - angDe(rel[ramo[0]]), cr = Math.cos(rot), sr = Math.sin(rot);
              ramo.forEach(function (id) { var v = rel[id]; cand[id] = { x: pv.x + v.x * cr - v.y * sr, y: pv.y + v.x * sr + v.y * cr }; });
            });
            var f = Infinity;
            Object.keys(cand).forEach(function (id) { var q = cand[id], margem = Sd.at[id] && Sd.at[id].hImp ? 0.55 : 0; obstP.forEach(function (o) { f = Math.min(f, Math.hypot(o.x - q.x, o.y - q.y) - margem); }); });
            if (!melhorC || f > melhorC.f + 0.02) melhorC = { f: f, cand: cand };
          });
        });
        if (melhorC) parte.forEach(function (id) { if (melhorC.cand[id]) { pos[id].x = melhorC.cand[id].x; pos[id].y = melhorC.cand[id].y; } });
      }

      parte.forEach(function (id) { movidos[id] = true; });
    });
    DM.relaxarH(Sd, pos, true);                                     // os H (explícitos e implícitos) se acomodam juntos
    DM.arrumar(Sd, pos, embaixo);                                   // o que SAIU não fica em cima de ninguém
    return pos;
  };
  /* ARRUMAR A CENA (como se arruma uma lousa): a molécula orgânica é a âncora e fica; toda molécula que se
     separou dela e ENCOSTA em outra (a água que saiu, o haleto, o H3O+ que se formou) vai para uma faixa livre
     ao lado da orgânica, empilhada sem se sobrepor. O tamanho conta os H desenhados em volta. O que não
     encosta em nada fica onde está (os reagentes que ainda vão reagir).
     embaixo (a área mais alta que larga; { aspecto: largura/altura da área }): uma faixa fixa ao lado alarga o
     desenho, e uma embaixo o faz descer à toa. Cada molécula que precisa sair do lugar vai para o lugar LIVRE onde a
     cena fica mais compacta PARA A FORMA DA TELA — o menor max(largura/aspecto, altura) da caixa de tudo —, e,
     entre lugares iguais, o mais perto de onde ela estava (a animação anda menos). Nunca acima da orgânica. */
  DM.arrumar = function (S, pos, embaixo) {
    var Mc = M(), comps = Mc.componentes(S).map(function (c) { return c.filter(function (id) { return pos[id]; }); }).filter(function (c) { return c.length; });
    var nC = function (c) { return c.filter(function (id) { return S.at[id].el === 'C'; }).length; };
    comps.sort(function (a, b) { return nC(b) - nC(a) || b.length - a.length; });
    var caixa = function (c) {
      var b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      c.forEach(function (id) { var m = S.at[id].hImp ? 1.0 : 0.62, q = pos[id]; b.minX = Math.min(b.minX, q.x - m); b.maxX = Math.max(b.maxX, q.x + m); b.minY = Math.min(b.minY, q.y - m); b.maxY = Math.max(b.maxY, q.y + m); });
      return b;
    };
    var bate = function (a, b) { return !(a.maxX <= b.minX || b.maxX <= a.minX || a.maxY <= b.minY || b.maxY <= a.minY); };
    var ocupado = [caixa(comps[0])], ancora = ocupado[0];
    var faixaX = ancora.maxX + 1.2, topo = ancora.minY - 0.6;
    comps.slice(1).forEach(function (c, i) {
      var b = caixa(c);
      if (ocupado.some(function (o) { return bate(b, o); })) {
        var w = b.maxX - b.minX, h = b.maxY - b.minY, x = faixaX, y = topo, tent = 0, livre = function () { return !ocupado.some(function (o) { return bate({ minX: x, maxX: x + w, minY: y, maxY: y + h }, o); }); };
        if (embaixo) {
          // os outros: os já postos e os que ainda vêm (onde estão); a cena sem esta molécula
          var outros = ocupado.concat(comps.slice(i + 2).map(caixa)), asp = embaixo.aspecto || 0.7, U = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
          outros.forEach(function (o) { U.minX = Math.min(U.minX, o.minX); U.maxX = Math.max(U.maxX, o.maxX); U.minY = Math.min(U.minY, o.minY); U.maxY = Math.max(U.maxY, o.maxY); });
          var livreDeTodos = function () { var q = { minX: x, maxX: x + w, minY: y, maxY: y + h }; return !outros.some(function (o) { return bate(q, o); }); };
          var melhor = null, cx0 = (b.minX + b.maxX) / 2, cy0 = (b.minY + b.maxY) / 2;
          for (var yy = ancora.minY; yy <= U.maxY + h + 3; yy += 0.35) for (var xx = U.minX - w - 0.6; xx <= U.maxX + 0.6; xx += 0.35) {
            x = xx; y = yy; if (!livreDeTodos()) continue;
            var cu = Math.max((Math.max(U.maxX, xx + w) - Math.min(U.minX, xx)) / asp, Math.max(U.maxY, yy + h) - Math.min(U.minY, yy)), di = Math.hypot(xx + w / 2 - cx0, yy + h / 2 - cy0);
            if (!melhor || cu < melhor.cu - 1e-6 || (cu <= melhor.cu + 1e-6 && di < melhor.di)) melhor = { cu: cu, di: di, x: xx, y: yy };
          }
          if (melhor) { x = melhor.x; y = melhor.y; }
          else { x = ancora.minX; y = U.maxY + 0.6; }                  // sem lugar livre por perto: logo abaixo de tudo
        }
        else while (!livre() && tent < 60) { y += 0.35; tent++; if (tent % 20 === 0) { x += 2.2; y = topo; } }
        var dx = x - b.minX, dy = y - b.minY; c.forEach(function (id) { pos[id].x += dx; pos[id].y += dy; });
        b = caixa(c);
      }
      ocupado.push(b);
    });
    return pos;
  };

  /* ══ O DESENHO ═══════════════════════════════════════════════════
     desenhar(ctx, S, pos, area, P, o) → { T(id) na tela, encaixes: { pares, ligacoes, atomos } }
     o: { setas: [...], realce: { at: id } (a fonte escolhida no modo toque), fantasma: {de, x, y} (a seta sendo arrastada) } */
  DM.desenhar = function (ctx, S, pos, area, P, o) {
    o = o || {}; var Mc = M(), ids = Object.keys(S.at).filter(function (id) { return pos[id]; });
    /* ESTRUTURAL COMPLETA: os H que não reagem (implícitos no sistema) também aparecem, nos maiores espaços livres */
    var hImp = DM.hImplicitos(S, pos);                                 // a molécula inteira, desviando dos vizinhos
    /* AS CUNHAS: o carbono sp3 (quatro ligações simples) em perspectiva, como nos livros — dois ligantes no
       plano (os pesados; no CH3 da ponta, também o H oposto), um para a FRENTE (cunha cheia) e um para TRÁS
       (tracejada), no espaço entre os do plano. O carbono da dupla e o carbocátion (sp2) ficam planos.
       A escolha só depende da geometria: a mesma em todos os quadros da animação. */
    var cunha = {}, difAng = function (a, b) { var d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
    ids.forEach(function (id) {
      var a = S.at[id]; if (a.el !== 'C') return;
      var viz = Mc.vizinhos(S, id).filter(function (v) { return pos[v]; });
      if (viz.some(function (v) { return S.lig[chaveLigD(id, v)] > 2; }) || viz.length + a.hImp !== 4) return;   // só o sp3
      var p0 = pos[id];
      var subs = viz.map(function (v) { return { chave: id + '>' + v, ang: Math.atan2(pos[v].y - p0.y, pos[v].x - p0.x), pesado: S.at[v].el !== 'H' }; })
        .concat((hImp[id] || []).map(function (q, k) { return { chave: id + '>h' + k, ang: q.ang, pesado: false }; }));
      var pesados = subs.filter(function (x) { return x.pesado; }), leves = subs.filter(function (x) { return !x.pesado; });
      if (pesados.length >= 3) { if (leves.length) cunha[leves[0].chave] = 'tras'; return; }        // CH com três pesados: o H para trás
      var plano = pesados.slice(0, 2);
      if (plano.length === 1) {                                     // CH3 da ponta: no plano, também o H oposto ao pesado
        var op = leves.slice().sort(function (x, y) { return difAng(y.ang, plano[0].ang) - difAng(x.ang, plano[0].ang); })[0]; plano.push(op);
      } else if (!plano.length) plano = leves.slice(0, 2);
      var fora = subs.filter(function (x) { return plano.indexOf(x) < 0; }); if (fora.length !== 2) return;
      var vira = Math.atan2(Math.sin(fora[1].ang - fora[0].ang), Math.cos(fora[1].ang - fora[0].ang)) > 0;
      cunha[fora[vira ? 0 : 1].chave] = 'frente'; cunha[fora[vira ? 1 : 0].chave] = 'tras';
    });
    var xs = ids.map(function (id) { return pos[id].x; }), ys = ids.map(function (id) { return pos[id].y; });
    for (var hk in hImp) hImp[hk].forEach(function (q) { xs.push(q.x); ys.push(q.y); });
    var esc, ox, oy;
    if (o.transform) { esc = o.transform.esc; ox = o.transform.ox; oy = o.transform.oy; }      // o mesmo enquadramento do antes e do depois
    else {
      var minX = Math.min.apply(null, xs) - 0.8, maxX = Math.max.apply(null, xs) + 0.8, minY = Math.min.apply(null, ys) - 0.8, maxY = Math.max.apply(null, ys) + 0.8;
      esc = Math.min(o.maxEsc || 120, area.w / (maxX - minX), area.h / (maxY - minY));
      ox = area.x + area.w / 2 - (minX + maxX) / 2 * esc; oy = area.y + area.h / 2 - (minY + maxY) / 2 * esc;
    }
    var T = function (id) { return { x: ox + pos[id].x * esc, y: oy + pos[id].y * esc }; };
    var rotulado = function () { return true; };                          // estrutural completa: todos os átomos com o símbolo
    var fonte = Math.max(13, Math.min(22, esc * 0.3)), raio = fonte * 0.62;
    var enc = { pares: [], ligacoes: [], atomos: [], cargas: [] };
    ctx.save(); ctx.lineCap = 'round'; if (o.alpha != null) ctx.globalAlpha = o.alpha;
    // as ligações
    Object.keys(S.lig).forEach(function (k) {
      var p = k.split('|'); if (!pos[p[0]] || !pos[p[1]]) return;
      var a = T(p[0]), b = T(p[1]), ordem = S.lig[k] / 2, dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, nx = -uy, ny = ux;
      var ra = rotulado(p[0]) ? raio : 0, rb = rotulado(p[1]) ? raio : 0;
      var a2 = { x: a.x + ux * ra, y: a.y + uy * ra }, b2 = { x: b.x - ux * rb, y: b.y - uy * rb };
      var cu = cunha[p[0] + '>' + p[1]] ? [cunha[p[0] + '>' + p[1]], a2, b2] : cunha[p[1] + '>' + p[0]] ? [cunha[p[1] + '>' + p[0]], b2, a2] : null;
      if (cu && ordem === 1) { DM.cunha(ctx, cu[1], cu[2], cu[0], P.texto, Math.max(3.5, esc * 0.06)); var meio0 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; enc.ligacoes.push({ lig: [p[0], p[1]], x: meio0.x, y: meio0.y, ordem: ordem }); return; }
      ctx.strokeStyle = P.texto; ctx.lineWidth = Math.max(1.8, esc * 0.035);
      for (var i = 0; i < ordem; i++) {
        var off = (i - (ordem - 1) / 2) * Math.max(5, esc * 0.09);
        ctx.beginPath(); ctx.moveTo(a2.x + nx * off, a2.y + ny * off); ctx.lineTo(b2.x + nx * off, b2.y + ny * off); ctx.stroke();
      }
      var meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      enc.ligacoes.push({ lig: [p[0], p[1]], x: meio.x, y: meio.y, ordem: ordem });
      if (ordem >= 2) {                                           // a dupla: um encaixe perto de cada carbono (de onde parte o lado)
        enc.ligacoes.push({ lig: [p[0], p[1]], lado: p[0], x: a.x + dx * 0.3, y: a.y + dy * 0.3, ordem: ordem });
        enc.ligacoes.push({ lig: [p[0], p[1]], lado: p[1], x: a.x + dx * 0.7, y: a.y + dy * 0.7, ordem: ordem });
      }
    });
    // os H que não reagem: a ligação e o rótulo
    var fH = fonte * 0.88, rH = fH * 0.6;
    Object.keys(hImp).forEach(function (id) {
      var p = T(id); hImp[id].forEach(function (q, k) {
        var t = { x: ox + q.x * esc, y: oy + q.y * esc }, dx = t.x - p.x, dy = t.y - p.y, n = Math.hypot(dx, dy) || 1;
        var ini = { x: p.x + dx / n * raio, y: p.y + dy / n * raio }, fim = { x: t.x - dx / n * rH, y: t.y - dy / n * rH }, tipo = cunha[id + '>h' + k];
        if (tipo) DM.cunha(ctx, ini, fim, tipo, P.texto, Math.max(3.2, esc * 0.055));
        else { ctx.strokeStyle = P.texto; ctx.lineWidth = Math.max(1.4, esc * 0.028); ctx.beginPath(); ctx.moveTo(ini.x, ini.y); ctx.lineTo(fim.x, fim.y); ctx.stroke(); }
        ctx.fillStyle = P.texto; ctx.font = '600 ' + fH.toFixed(1) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', t.x, t.y + 0.5);
      });
    });
    // os átomos: rótulos, pares, cargas, radicais
    ids.forEach(function (id) {
      var a = S.at[id], p = T(id), q = Mc.carga(S, id), pares = Mc.pares(S, id), rad = Mc.radical(S, id);
      if (rotulado(id)) {
        ctx.fillStyle = P.fundo; ctx.beginPath(); ctx.arc(p.x, p.y, raio, 0, Math.PI * 2); ctx.fill();
        var fAt = a.el === 'H' ? fonte * 0.88 : fonte;                     // todo H do mesmo tamanho (os que reagem e os outros)
        ctx.fillStyle = (P.elementos && P.elementos[a.el]) || P.texto; ctx.font = (a.el === 'H' ? '600 ' : '700 ') + fAt.toFixed(1) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(a.el, p.x, p.y + 0.5);                                // os H já estão desenhados um a um
      }
      // os espaços livres: pares isolados, radical e carga, nos maiores vãos
      var ocupados = Mc.vizinhos(S, id).filter(function (v) { return pos[v]; }).map(function (v) { var t = T(v); return Math.atan2(t.y - p.y, t.x - p.x); }).concat((hImp[id] || []).map(function (q) { return q.ang; }));   // os H também ocupam
      var itens = []; for (var i2 = 0; i2 < pares; i2++) itens.push('par'); if (rad) itens.push('rad');
      var angs = DM.angulosLivres(ocupados, itens.length + (q ? 1 : 0));
      var dist = (rotulado(id) ? raio : 6) + fonte * 0.32;
      itens.forEach(function (it, i3) {
        var ang = angs[i3], cx = p.x + Math.cos(ang) * dist, cy = p.y + Math.sin(ang) * dist, tx = -Math.sin(ang), ty = Math.cos(ang);
        ctx.fillStyle = P.texto;
        if (it === 'par') { [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.arc(cx + tx * s * fonte * 0.17, cy + ty * s * fonte * 0.17, Math.max(1.8, fonte * 0.1), 0, Math.PI * 2); ctx.fill(); }); enc.pares.push({ at: id, x: cx, y: cy }); }
        else {                                                       // o RADICAL: o elétron num círculo (⊙), a mesma linguagem do ⊕ e do ⊖ das cargas
          var rr = fonte * 0.36, cxr = p.x + Math.cos(ang) * (dist + 3), cyr = p.y + Math.sin(ang) * (dist + 3);
          ctx.strokeStyle = P.texto; ctx.lineWidth = 1.6; ctx.fillStyle = P.fundo; ctx.beginPath(); ctx.arc(cxr, cyr, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = P.texto; ctx.beginPath(); ctx.arc(cxr, cyr, Math.max(2.2, fonte * 0.13), 0, Math.PI * 2); ctx.fill();
          enc.pares.push({ at: id, x: cxr, y: cyr, radical: true });
        }
      });
      if (q) {
        var ang = angs[itens.length], cx2 = p.x + Math.cos(ang) * (dist + 3), cy2 = p.y + Math.sin(ang) * (dist + 3), r = fonte * 0.36;
        ctx.strokeStyle = P.texto; ctx.lineWidth = 1.6; ctx.fillStyle = P.fundo; ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx2 - r * 0.55, cy2); ctx.lineTo(cx2 + r * 0.55, cy2); if (q > 0) { ctx.moveTo(cx2, cy2 - r * 0.55); ctx.lineTo(cx2, cy2 + r * 0.55); } ctx.stroke();
        enc.cargas.push({ at: id, x: cx2, y: cy2, q: q });                // pegar o íon pela carga também
      }
      enc.atomos.push({ at: id, x: p.x, y: p.y, r: rotulado(id) ? raio : 9 });
    });
    // o realce da fonte escolhida (modo toque)
    if (o.realce) { var pr = o.realce; ctx.strokeStyle = P.acento; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(pr.x, pr.y, 14, 0, Math.PI * 2); ctx.stroke(); }
    // as setas
    (o.setas || []).forEach(function (s) { DM.seta(ctx, s.x0, s.y0, s.x1, s.y1, s.n, s.cor || P.acento, s.lado || 1); });
    if (o.fantasma) { var f = o.fantasma; ctx.globalAlpha = 0.6; DM.seta(ctx, f.x0, f.y0, f.x1, f.y1, f.n, P.acento, 1); ctx.globalAlpha = 1; }
    ctx.restore();
    return { T: T, esc: esc, ox: ox, oy: oy, encaixes: enc };
  };
  /* a cunha: cheia (para a FRENTE: estreita no carbono, larga no ligante) ou tracejada (para TRÁS) */
  DM.cunha = function (ctx, p, q, tipo, cor, larg) {
    var dx = q.x - p.x, dy = q.y - p.y, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
    ctx.save(); ctx.fillStyle = cor; ctx.strokeStyle = cor;
    if (tipo === 'frente') { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x + nx * larg, q.y + ny * larg); ctx.lineTo(q.x - nx * larg, q.y - ny * larg); ctx.closePath(); ctx.fill(); }
    else { ctx.lineWidth = 1.5; ctx.lineCap = 'butt'; for (var t = 0.12; t <= 1.001; t += 0.15) { var mx = p.x + dx * t, my = p.y + dy * t, w = larg * t; ctx.beginPath(); ctx.moveTo(mx + nx * w, my + ny * w); ctx.lineTo(mx - nx * w, my - ny * w); ctx.stroke(); } }
    ctx.restore();
  };
  var chaveLigD = function (a, b) { return a < b ? a + '|' + b : b + '|' + a; };
  /* os anéis (ciclos pequenos) de cada molécula, pelos índices do sistema */
  DM.aneisDe = function (S, pos) {
    var Mc = M(), ids = Object.keys(S.at).filter(function (id) { return pos[id] && S.at[id].el !== 'H'; }), aneis = [];
    var viz = function (id) { return Mc.vizinhos(S, id).filter(function (v) { return ids.indexOf(v) >= 0; }); };
    ids.forEach(function (a) { viz(a).forEach(function (b) {
      if (b < a) return; var pai = {}; pai[b] = null; var fila = [b];                // o menor caminho de b até a sem usar a ligação a–b
      while (fila.length) { var x = fila.shift(); if (x === a) break; viz(x).forEach(function (y) { if (y in pai || (x === b && y === a)) return; pai[y] = x; fila.push(y); }); }
      if (!(a in pai)) return; var ciclo = []; for (var y = a; y != null; y = pai[y]) ciclo.push(y);
      if (ciclo.length >= 3 && ciclo.length <= 8) { var k = ciclo.slice().sort().join(','); if (!aneis.some(function (r) { return r.slice().sort().join(',') === k; })) aneis.push(ciclo); }
    }); });
    return aneis;
  };
  /* O DESVIO: os n itens de um átomo (H) começam nos maiores espaços livres (a geometria dos livros) e o
     conjunto GIRA EM BLOCO até ±60° para a rotação com MAIS FOLGA em relação aos obstáculos (átomos e H já
     postos); nunca a menos de 35° das ligações do próprio átomo. Determinístico: o mesmo resultado em todo quadro. */
  DM.esquivar = function (p, ocupados, n, dist, obst, giroMax) {
    var base = DM.angulosLivres(ocupados, n); if (!base.length) return base;
    var difAng = function (a, b) { var d = Math.abs(a - b) % (2 * Math.PI); return d > Math.PI ? 2 * Math.PI - d : d; };
    var folga = function (angs) {
      var m = Infinity;
      for (var i = 0; i < angs.length; i++) {
        if (ocupados.some(function (o) { return difAng(o, angs[i]) < 0.96; })) return -1;             // a menos de 55° de uma ligação: não
        var x = p.x + Math.cos(angs[i]) * dist, y = p.y + Math.sin(angs[i]) * dist;
        obst.forEach(function (q) { var d = Math.hypot(q.x - x, q.y - y); if (d < m) m = d; });
        for (var j = 0; j < i; j++) { var x2 = p.x + Math.cos(angs[j]) * dist, y2 = p.y + Math.sin(angs[j]) * dist, d2 = Math.hypot(x2 - x, y2 - y); if (d2 < m) m = d2; }
      }
      return m;
    };
    var melhor = { angs: base, f: folga(base) };
    if (melhor.f >= 0.95) return base;                                 // já folgado: fica a geometria dos livros
    for (var g = 5; g <= (giroMax || 60); g += 5) [g, -g].forEach(function (gr) {
      var r = gr * Math.PI / 180, angs = base.map(function (a) { return a + r; }), f = folga(angs);
      if (f > melhor.f + 0.02) melhor = { angs: angs, f: f };
    });
    return melhor.angs;
  };
  /* OS H IMPLÍCITOS DA MOLÉCULA INTEIRA (o desenho e o verificador usam esta mesma função): átomo por átomo,
     cada um desviando dos átomos e dos H já postos */
  /* A RELAXAÇÃO DOS H (como se espalham rótulos sem choque nos desenhos de moléculas): cada H é um ponto que
     só DESLIZA num círculo em volta do seu átomo; todos os pontos se repelem (átomos e H, mais forte de perto),
     e cada H é empurrado para longe das ligações do próprio átomo. Todos andam juntos, em passos pequenos;
     partem da posição dos livros (os maiores espaços livres). Determinístico: o mesmo em todo quadro.
     moverExplicitos: também os átomos H do sistema (terminais), que então ganham a posição nova em pos. */
  DM.relaxarH = function (S, pos, moverExplicitos) {
    var Mc = M(), itens = [], fixos = [];
    var explicitoMovel = function (id) { if (!moverExplicitos || S.at[id].el !== 'H') return false; var v = Mc.vizinhos(S, id); return v.length === 1 && pos[v[0]]; };
    Object.keys(pos).forEach(function (id) { if (S.at[id] && !explicitoMovel(id)) fixos.push({ id: id, x: pos[id].x, y: pos[id].y }); });
    Object.keys(S.at).filter(function (id) { return pos[id] && S.at[id].el !== 'H'; }).sort().forEach(function (id) {
      var p = pos[id], viz = Mc.vizinhos(S, id).filter(function (v) { return pos[v]; });
      var movE = viz.filter(function (v) { return explicitoMovel(v); }), fixosV = viz.filter(function (v) { return !explicitoMovel(v); });
      var ocup = fixosV.map(function (v) { return Math.atan2(pos[v].y - p.y, pos[v].x - p.x); });
      var n = S.at[id].hImp + movE.length; if (!n) return;
      var angs = DM.angulosLivres(ocup, n);
      // os explícitos móveis ficam com os ângulos mais próximos dos que já têm (para não trocarem de lugar)
      var livres = angs.slice();
      movE.forEach(function (h) { var a0 = Math.atan2(pos[h].y - p.y, pos[h].x - p.x), k = 0, dm = 9; livres.forEach(function (a, i) { var d = Math.abs(Math.atan2(Math.sin(a - a0), Math.cos(a - a0))); if (d < dm) { dm = d; k = i; } }); itens.push({ pai: id, ang: livres[k], r: 0.75, h: h, ocup: ocup }); livres.splice(k, 1); });
      livres.forEach(function (a) { itens.push({ pai: id, ang: a, r: 0.68, h: null, ocup: ocup }); });
    });
    var ponto = function (it) { var p = pos[it.pai]; return { x: p.x + Math.cos(it.ang) * it.r, y: p.y + Math.sin(it.ang) * it.r }; };
    for (var it = 0; it < 90; it++) {
      var pts = itens.map(ponto), passo = 0.12 * (1 - it / 100);
      itens.forEach(function (a, i) {
        var pa = pts[i], fx = 0, fy = 0;
        var empurra = function (q, peso) { var dx = pa.x - q.x, dy = pa.y - q.y, d = Math.hypot(dx, dy); if (d < 1e-6 || d > 2) return; var f = peso / (d * d * d); fx += dx * f; fy += dy * f; };
        fixos.forEach(function (q) { if (q.id !== a.pai && q.id !== a.h) empurra(q, S.at[q.id].el === 'H' ? 1 : 1.6); });   // os pesados empurram mais
        pts.forEach(function (q, j) { if (j !== i) empurra(q, 1); });
        var tx = -Math.sin(a.ang), ty = Math.cos(a.ang), t = (fx * tx + fy * ty) / a.r;
        a.ocup.forEach(function (o) { var d = Math.atan2(Math.sin(a.ang - o), Math.cos(a.ang - o)); if (Math.abs(d) < 1.3) t += 0.35 * Math.sign(d || 1) / Math.max(0.15, d * d); });   // longe das ligações do átomo
        a.ang += Math.max(-passo, Math.min(passo, t * 0.02));
      });
    }
    var out = {};
    itens.forEach(function (a) { var q = ponto(a); if (a.h) { pos[a.h].x = q.x; pos[a.h].y = q.y; } else (out[a.pai] = out[a.pai] || []).push({ ang: a.ang, x: q.x, y: q.y }); });
    return out;
  };
  DM.hImplicitos = function (S, pos) { return DM.relaxarH(S, pos, false); };          // o desenho: só os implícitos se movem


  /* O ENQUADRAMENTO DE VÁRIAS CENAS JUNTAS (o antes e o depois de um passo): a mesma escala e o mesmo
     centro, para a animação não saltar de tamanho; folga para os H e os pares.
     folga (opcional): { lig, px } — a folga em cada borda, em ligações mais px. A de sempre é 1,4 ligação.
     DM.FOLGA_JUSTA cobre o que se desenha além dos átomos: o H que não reage (a 0,68 ligação do átomo, com o
     rótulo), os pares, a carga e o radical (até 1,3 letra + 3 px do átomo). */
  DM.FOLGA_JUSTA = { lig: 0.8, px: 10 };
  DM.transformar = function (posicoes, area, maxEsc, folga) {
    var fl = folga ? folga.lig : 1.4, fp = folga ? folga.px : 0;
    var xs = [], ys = []; posicoes.forEach(function (pos) { for (var id in pos) { xs.push(pos[id].x); ys.push(pos[id].y); } });
    var minX = Math.min.apply(null, xs) - fl, maxX = Math.max.apply(null, xs) + fl, minY = Math.min.apply(null, ys) - fl, maxY = Math.max.apply(null, ys) + fl;
    var esc = Math.min(maxEsc || 120, (area.w - 2 * fp) / (maxX - minX), (area.h - 2 * fp) / (maxY - minY));
    return { esc: esc, ox: area.x + area.w / 2 - (minX + maxX) / 2 * esc, oy: area.y + area.h / 2 - (minY + maxY) / 2 * esc };
  };
  /* as posições a meio caminho (s de 0 a 1) */
  DM.interpolar = function (pa, pb, s) { var out = {}; for (var id in pa) { var b = pb[id] || pa[id]; out[id] = { x: pa[id].x + (b.x - pa[id].x) * s, y: pa[id].y + (b.y - pa[id].y) * s }; } return out; };
  /* os ângulos livres: n itens nos maiores vãos entre as ligações, como os H */
  DM.angulosLivres = function (ocupados, n) {
    if (!n) return [];
    var angs = ocupados.slice().sort(function (a, b) { return a - b; }), out = [];
    if (!angs.length) { for (var i = 0; i < n; i++) out.push(-Math.PI / 2 + i * 2 * Math.PI / n); return out; }
    var vaos = angs.map(function (a, i) { return { ini: a, tam: (i + 1 < angs.length ? angs[i + 1] : angs[0] + 2 * Math.PI) - a, k: 0 }; });
    for (var j = 0; j < n; j++) { vaos.sort(function (x, y) { return y.tam / (y.k + 1) - x.tam / (x.k + 1); }); vaos[0].k++; }
    vaos.forEach(function (v) { for (var k = 1; k <= v.k; k++) out.push(v.ini + v.tam * k / (v.k + 1)); });
    return out;
  };
  /* ══ A SETA ═════════════════════════════════════════════════════
     curva CÚBICA (como nos programas de desenho químico): 'curva' é o afastamento máximo da corda, em px,
     com sinal (o lado); a ponta segue a tangente do fim; um contorno da cor do fundo por baixo separa a seta
     das ligações que ela cruza. n = 2: ponta cheia (par de elétrons); n = 1: farpa (meia ponta, por fora).
     progresso (0–1): a seta cresce da fonte até a ponta (ao nascer). */
  DM.controles = function (x0, y0, x1, y1, curva) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, k = curva * 4 / 3;
    return [{ x: x0, y: y0 }, { x: x0 + dx * 0.22 + nx * k, y: y0 + dy * 0.22 + ny * k }, { x: x1 - dx * 0.22 + nx * k, y: y1 - dy * 0.22 + ny * k }, { x: x1, y: y1 }];
  };
  var bez = function (c, t) { var u = 1 - t; return { x: u * u * u * c[0].x + 3 * u * u * t * c[1].x + 3 * u * t * t * c[2].x + t * t * t * c[3].x, y: u * u * u * c[0].y + 3 * u * u * t * c[1].y + 3 * u * t * t * c[2].y + t * t * t * c[3].y }; };
  DM.seta = function (ctx, x0, y0, x1, y1, n, cor, curva, progresso, fundo) {
    if (typeof curva !== 'number') curva = 30;
    var c = DM.controles(x0, y0, x1, y1, curva), t1 = progresso == null ? 1 : Math.max(0.02, Math.min(1, progresso)), pts = [];
    for (var i = 0; i <= 28; i++) pts.push(bez(c, t1 * i / 28));
    var fim = pts[pts.length - 1], antes = pts[pts.length - 3] || pts[0], ang = Math.atan2(fim.y - antes.y, fim.x - antes.x);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var traco = function () { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y); ctx.stroke(); };
    if (fundo) { ctx.strokeStyle = fundo; ctx.lineWidth = 6.5; traco(); }
    ctx.strokeStyle = cor; ctx.lineWidth = 2.4; traco();
    if (t1 >= 0.999) {                                           // a ponta, alinhada com o fim da curva
      var tam = 13, ab = 0.42, lado = curva >= 0 ? 1 : -1;
      var b1 = { x: fim.x + Math.cos(ang + Math.PI - ab) * tam, y: fim.y + Math.sin(ang + Math.PI - ab) * tam };
      var b2 = { x: fim.x + Math.cos(ang + Math.PI + ab) * tam, y: fim.y + Math.sin(ang + Math.PI + ab) * tam };
      var mio = { x: fim.x + Math.cos(ang + Math.PI) * tam * 0.62, y: fim.y + Math.sin(ang + Math.PI) * tam * 0.62 };
      ctx.fillStyle = cor; ctx.beginPath();
      if (n === 1) { var bx = lado > 0 ? b1 : b2; ctx.moveTo(fim.x, fim.y); ctx.lineTo(bx.x, bx.y); ctx.lineTo(mio.x, mio.y); }   // a farpa: meia ponta, por fora
      else { ctx.moveTo(fim.x, fim.y); ctx.lineTo(b1.x, b1.y); ctx.lineTo(mio.x, mio.y); ctx.lineTo(b2.x, b2.y); }
      ctx.closePath(); if (fundo) { ctx.strokeStyle = fundo; ctx.lineWidth = 2; ctx.stroke(); } ctx.fill();
    }
    ctx.restore();
  };
  DM.pontoNaSeta = function (x0, y0, x1, y1, curva, u) { return bez(DM.controles(x0, y0, x1, y1, curva), Math.max(0, Math.min(1, u))); };
  /* o lado mais livre: dos dois lados possíveis, o que passa mais longe dos átomos (a curva não atravessa a molécula) */
  DM.ladoLivre = function (atomos, x0, y0, x1, y1, mag) {
    var folga = function (sinal) {
      var c = DM.controles(x0, y0, x1, y1, sinal * mag), d = Infinity;
      for (var i = 2; i <= 18; i++) { var q = bez(c, i / 20); atomos.forEach(function (a) { var dd = Math.hypot(a.x - q.x, a.y - q.y); if (dd > 2 && dd < d) d = dd; }); }
      return d;
    };
    return folga(1) >= folga(-1) ? 1 : -1;
  };
  /* a curva do gesto: o maior afastamento (com sinal) da trilha do dedo em relação à corda */
  DM.curvaDoGesto = function (trilha, x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, m = 0;
    trilha.forEach(function (p) { var t = ((p.x - x0) * dx + (p.y - y0) * dy) / (L * L); if (t < 0.1 || t > 0.9) return; var d = (p.x - x0) * nx + (p.y - y0) * ny; if (Math.abs(d) > Math.abs(m)) m = d; });
    return m;
  };
})();
