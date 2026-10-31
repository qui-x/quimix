/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/lewis.js
   ───────────────────────────────────────────────────────────────
   ESTRUTURA DE LEWIS — a contabilidade dos elétrons de valência.

   POR QUE ESTE ARQUIVO EXISTE SEPARADO DO DESENHO
   A representação "eletrônica de Lewis" do SIQC (Módulo 1) é o
   primeiro uso. O segundo, e o mais exigente, é o SIRO — Reações
   Orgânicas —, em que setas curvas MOVEM pares de elétrons: um par
   isolado vira ligação, uma ligação se quebra e o par fica com um dos
   átomos, surgem carbocátions, alcóxidos, íons oxônio. Para isso o
   modelo precisa ser uma contabilidade, não um desenho: quantos elétrons
   cada átomo tem, onde estão (ligantes ou não ligantes), qual a carga
   formal, se o octeto fecha. O desenho (render/representacoes.js) só lê
   o resultado daqui. O documento completo, com exemplos resolvidos e o
   roteiro para o SIRO, está em docs/estrutura-de-lewis.md.

   ═══ O MODELO ═══════════════════════════════════════════════════

   Para cada átomo:
     V  elétrons de valência do elemento (tabela abaixo)
     B  pares LIGANTES em que ele participa = soma das ordens das suas
        ligações + os H implícitos (cada H é uma ligação simples)
     q  carga formal
     r  elétrons desemparelhados (radical), 0 quase sempre
     N  elétrons NÃO LIGANTES, os que são só dele

   A relação que amarra tudo (definição de carga formal):
         q = V − N − B          ⇔          N = V − B − q
   Pares isolados = (N − r) / 2.

   Elétrons em volta do átomo = 2B + N: cada par ligante conta INTEIRO
   para os dois átomos da ligação. A regra do octeto pede 8 (2 para o H,
   a regra do dueto). Um carbocátion fica com 6 — é por isso que é
   reativo, e o modelo o marca como "incompleto" em vez de esconder.

   QUAL É A FONTE DE VERDADE
   · Padrão (editor do SIQC, moléculas neutras): a CARGA é guardada no
     átomo (a.carga, 0 se ausente) e N é calculado. O H implícito sai da
     valência efetiva do grafo, que já leva a carga em conta: CH₃⁺ tem 3
     H, NH₄⁺ tem 4, Cl⁻ não tem nenhum.
   · Com a.naoLigantes definido (uso do SIRO, quando uma seta moveu
     elétrons): N é a fonte e a carga é calculada. Depois de cada seta,
     o SIRO grava a carga calculada em a.carga — assim o H implícito do
     grafo continua certo. Ver docs/estrutura-de-lewis.md, seção 9.

   CONFERÊNCIA — o que ela pega e o que não pega
   Soma dos V (incluindo cada H) − carga total = elétrons contados
   (2 × pares ligantes + soma dos N). Isso é uma IDENTIDADE nos dois
   modos: com N vindo de fora, a carga calculada absorve a diferença
   (N = 6 no O do metanol vira carga −2, e a soma fecha). O que de fato
   denuncia elétrons criados ou destruídos é a CARGA TOTAL do sistema
   mudar entre um passo e outro — uma seta só move elétrons, nunca muda
   a carga total. Por isso analisar() aceita { cargaEsperada }, e o SIRO
   deve passar a carga do sistema antes da seta. (A primeira versão
   deste comentário prometia que a soma pegaria o erro; o teste mostrou
   que não pega, e a verificação foi trocada pela de carga.)

   ═══ ARRANJO NO PLANO ══════════════════════════════════════════

   arranjo2D() diz em que DIREÇÃO desenhar, em volta de cada átomo, os
   seus H implícitos, pares isolados, elétron desemparelhado e o sinal
   da carga. Ordem de ocupação dos vãos entre as ligações:
     1. H — com o MESMO algoritmo da estrutural completa, para os H
        ficarem no mesmo lugar nas duas representações;
     2. pares isolados — nos vãos que sobraram;
     3. elétron desemparelhado;
     4. sinal da carga formal — no maior vão restante.
   O algoritmo de vão (distribuir) põe cada item onde ficaria MAIS
   espaço depois de colocado: os dois H de um CH₂ de cadeia saem juntos
   para fora do ângulo, como nos livros.

   ═══ O QUE ESTE MODELO NÃO FAZ ═════════════════════════════════
   · ressonância: desenha uma estrutura de Kekulé (o benzeno com três
     duplas alternadas), sem híbridos de ressonância;
   · octeto expandido (S e P com mais de 8): não modelado;
   · escolha automática de carga: a carga vem do estado (a.carga ou
     a.naoLigantes), nunca é "adivinhada" a partir da conectividade.

   Depende de: grafo-molecular.js (Grafo, valência efetiva).
═══════════════════════════════════════════════════════════════ */

'use strict';

(function (raiz) {
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var L = Q3.Lewis = {};

  L.ELETRONS_VALENCIA = { H: 1, C: 4, Si: 4, N: 5, O: 6, S: 6, P: 5, F: 7, Cl: 7, Br: 7, I: 7, Na: 1, K: 1, Mg: 2 };
  /* A regra de cada elemento: dueto no H; nos metais, os elétrons das
     próprias ligações (Na e K com uma: 2; Mg com duas: 4) — eles não
     seguem o octeto; octeto nos demais. */
  L.regra = function (el) { return (el === 'H' || el === 'Na' || el === 'K') ? 2 : el === 'Mg' ? 4 : 8; };
  /* OCTETO EXPANDIDO: S e P (3º período) podem passar de 8 — o S de uma
     sulfona fica com 12, o P de um fosfato com 10. Não é erro: o modelo
     informa, e o limite de cada um barra o impossível. */
  L.EXPANDE = { S: 12, P: 10 };

  /* A contabilidade de UM átomo. */
  L.atomo = function (g, id) {
    var a = g.atomos[id];
    var V = L.ELETRONS_VALENCIA[a.el];
    var hs = g.hidrogenios(id);
    var B = g.ordemTotal(id) + hs;
    var r = a.radical || 0;
    var N, q;
    if (typeof a.naoLigantes === 'number') { N = a.naoLigantes; q = V - N - B; }   // modo SIRO
    else { q = a.carga || 0; N = V - B - q; }                                       // modo padrão
    var total = 2 * B + N, regra = L.regra(a.el), teto = L.EXPANDE[a.el] || regra;
    return {
      id: id, el: a.el,
      valencia: V, hidrogenios: hs, ligantes: B, naoLigantes: N,
      pares: Math.max(0, Math.floor((N - r) / 2)), desemparelhados: r,
      cargaFormal: q, eletronsEmVolta: total, regra: regra,
      completo: total === regra || (total > regra && total <= teto),
      expandido: total > regra && total <= teto,
      consistente: N >= 0 && (N - r) % 2 === 0 && total <= teto
    };
  };

  /* A molécula inteira: cada átomo, cada ligação (com seus pares) e a
     conferência de elétrons. `problemas` lista, em português, o que o
     aluno (ou o SIRO) precisa saber: octeto incompleto, excedido,
     elétrons que não fecham. */
  L.analisar = function (g, opcoes) {
    var ids = Object.keys(g.atomos), atomos = {}, problemas = [];
    var somaV = 0, cargaTotal = 0, somaN = 0, hImpl = 0;
    ids.forEach(function (id) {
      var x = L.atomo(g, id);
      atomos[id] = x;
      somaV += x.valencia + x.hidrogenios;        // cada H implícito traz 1 elétron
      cargaTotal += x.cargaFormal;
      somaN += Math.max(0, x.naoLigantes);
      hImpl += x.hidrogenios;
      if (x.naoLigantes < 0) problemas.push({ id: id, tipo: 'impossivel', texto: x.el + ' com elétrons não ligantes negativos: a estrutura não existe' });
      else if (x.eletronsEmVolta > (L.EXPANDE[x.el] || x.regra)) problemas.push({ id: id, tipo: 'excedido', texto: x.el + ' com ' + x.eletronsEmVolta + ' elétrons em volta (o máximo é ' + (L.EXPANDE[x.el] || x.regra) + ')' });
      else if (x.expandido) problemas.push({ id: id, tipo: 'expandido', texto: x.el + ' com octeto expandido (' + x.eletronsEmVolta + ' elétrons)' });
      else if (x.eletronsEmVolta < x.regra) problemas.push({ id: id, tipo: 'incompleto', texto: x.el + ' com ' + x.eletronsEmVolta + ' elétrons em volta: octeto incompleto' });
    });
    var ordens = g.ligacoes.reduce(function (s, l) { return s + l.ordem; }, 0);
    var paresLigantes = ordens + hImpl;
    var contados = 2 * paresLigantes + somaN, esperado = somaV - cargaTotal;
    if (contados !== esperado) problemas.push({ id: null, tipo: 'conservacao', texto: 'os elétrons não fecham: ' + contados + ' contados, ' + esperado + ' esperados' });
    if (opcoes && typeof opcoes.cargaEsperada === 'number' && cargaTotal !== opcoes.cargaEsperada) {
      problemas.push({ id: null, tipo: 'carga', texto: 'a carga total ficou ' + cargaTotal + ', mas era ' + opcoes.cargaEsperada + ': algum passo criou ou destruiu elétrons' });
    }
    return {
      atomos: atomos,
      ligacoes: g.ligacoes.map(function (l) { return { a: l.a, b: l.b, ordem: l.ordem, pares: l.ordem }; }),
      eletrons: { valencia: esperado, paresLigantes: paresLigantes, naoLigantes: somaN, contados: contados, confere: contados === esperado },
      cargaTotal: cargaTotal,
      problemas: problemas
    };
  };

  /* Distribui n itens nos vãos livres em volta de um átomo (ângulos em
     radianos, no referencial da tela: y para baixo). Cada item vai para o
     vão que ficaria com MAIS espaço entre vizinhos depois de recebê-lo. */
  L.distribuir = function (angFixos, n) {
    var out = [], i;
    if (n <= 0) return out;
    if (!angFixos.length) { for (i = 0; i < n; i++) out.push(-Math.PI / 2 + i * 2 * Math.PI / n); return out; }
    var a = angFixos.slice().sort(function (x, y) { return x - y; });
    var vaos = a.map(function (x, k) { return { ini: x, tam: (k < a.length - 1 ? a[k + 1] : a[0] + 2 * Math.PI) - x, m: 0 }; });
    for (i = 0; i < n; i++) {
      var melhor = vaos[0];
      vaos.forEach(function (v) { if (v.tam / (v.m + 2) > melhor.tam / (melhor.m + 2) + 1e-9) melhor = v; });
      melhor.m++;
    }
    vaos.forEach(function (v) { for (var j = 0; j < v.m; j++) out.push(v.ini + v.tam * (j + 1) / (v.m + 1)); });
    return out;
  };

  /* ═══ ONDE DESENHAR CADA H NO PLANO — fugindo dos vizinhos ═══════
     distribuir() espalha os H de UM átomo olhando só as ligações dele.
     Nos centros apertados — a cruz do neopentano, dois metilas no mesmo
     carbono — os H de átomos vizinhos caíam uns sobre os outros (até
     0,15 unidade de distância). Aqui os átomos mais apertados escolhem
     primeiro, e cada um experimenta, DENTRO dos próprios vãos:
       · girar o leque de H (até ±48°),
       · fechá-lo em direção ao centro do vão (até 48%),
       · encurtar a ligação ao H (até 62%, custando caro) — como os livros desenham H
         em centros congestionados;
     sem nunca deixar um H a menos de 45° de outra ligação do átomo (a
     angulação continua legível), e fica com o arranjo que mais se afasta
     de outros átomos, de H já postos e de ligações alheias. Quando nada
     colide, fica o arranjo padrão (cada desvio custa um pouco na nota).
     Duas passadas: na segunda, cada átomo reconsidera o seu arranjo
     sabendo onde ficaram os H de todos os outros.
     Custo: roda uma vez por MUDANÇA da molécula, em unidades do desenho
     (o editor guarda o resultado); a tela só converte para pixels.
     `T(id)` dá a posição do átomo; `comp` é o comprimento da ligação ao H
     no desenho. Devolve { id: [ { ang, comp }, ... ] }, na ordem de
     distribuir() — a estereoquímica atribui frente, plano e trás por ela. */
  L.posicoesH = function (g, T, comp) {
    var RAD = Math.PI / 180, ids = Object.keys(g.atomos), P = {}, out = {};
    ids.forEach(function (id) { P[id] = T(id); });
    var segs = g.ligacoes.map(function (l) { return { a: P[l.a], b: P[l.b], ia: l.a, ib: l.b }; });
    var dist = function (u, v) { return Math.hypot(u.x - v.x, u.y - v.y); };
    var distSeg = function (q, sg) {
      var dx = sg.b.x - sg.a.x, dy = sg.b.y - sg.a.y, L2 = dx * dx + dy * dy || 1;
      var t = Math.max(0, Math.min(1, ((q.x - sg.a.x) * dx + (q.y - sg.a.y) * dy) / L2));
      return Math.hypot(sg.a.x + t * dx - q.x, sg.a.y + t * dy - q.y);
    };
    var ordem = ids.filter(function (id) { return g.hidrogenios(id) > 0; }).sort(function (x, y) {
      return (g.vizinhos(y).length - g.vizinhos(x).length) || (g.hidrogenios(y) - g.hidrogenios(x)) || (x < y ? -1 : 1);
    });
    var colocadosDe = {};
    var arranjar = function (id) {
      var p = P[id], n = g.hidrogenios(id);
      var fixos = g.vizinhos(id).map(function (v) { return Math.atan2(P[v.id].y - p.y, P[v.id].x - p.x); });
      var base = L.distribuir(fixos, n);
      var marca = function (angs, k) { return angs.map(function (a) { return { x: p.x + Math.cos(a) * comp * k, y: p.y + Math.sin(a) * comp * k }; }); };
      if (!fixos.length) {
        out[id] = base.map(function (a) { return { ang: a, comp: comp }; });
        colocadosDe[id] = marca(base, 1);
        return;
      }
      var f = fixos.slice().sort(function (x, y) { return x - y; });
      var vaoDe = function (a) {
        var x = a; while (x < f[0]) x += 2 * Math.PI; while (x >= f[0] + 2 * Math.PI) x -= 2 * Math.PI;
        for (var k = 0; k < f.length; k++) {
          var ini = f[k], fim = k < f.length - 1 ? f[k + 1] : f[0] + 2 * Math.PI;
          if (x >= ini && x < fim) return { ini: ini, fim: fim, x: x };
        }
        return { ini: f[0], fim: f[0] + 2 * Math.PI, x: x };
      };
      var melhor = null;
      var outrosH = [];
      Object.keys(colocadosDe).forEach(function (o) { if (o !== id) colocadosDe[o].forEach(function (q) { outrosH.push(q); }); });
      [0, -12, 12, -24, 24, -36, 36, -48, 48].forEach(function (giro) {
        [1, 0.78, 0.6, 0.48].forEach(function (fecha) {
          [1, 0.85, 0.72, 0.62].forEach(function (encurta) {
            var angs = base.map(function (a) {
              var v = vaoDe(a), c = (v.ini + v.fim) / 2, margem = 45 * RAD;
              var na = c + (v.x - c) * fecha + giro * RAD;
              return Math.max(v.ini + margem, Math.min(v.fim - margem, na));
            });
            // os H do próprio átomo também seguem a régua: no mínimo 45° entre eles
            for (var i = 0; i < angs.length; i++) for (var j = i + 1; j < angs.length; j++) {
              var d = Math.abs(angs[i] - angs[j]) % (2 * Math.PI); d = Math.min(d, 2 * Math.PI - d);
              if (d < 45 * RAD) return;
            }
            var pts = marca(angs, encurta), folga = Infinity;
            pts.forEach(function (q) {
              ids.forEach(function (o) { if (o !== id) folga = Math.min(folga, dist(q, P[o]) / (0.78 * comp)); });
              outrosH.forEach(function (h) { folga = Math.min(folga, dist(q, h) / (0.62 * comp)); });
              segs.forEach(function (sg) { if (sg.ia !== id && sg.ib !== id) folga = Math.min(folga, distSeg(q, sg) / (0.30 * comp)); });
            });
            var nota = Math.min(folga, 1) - (Math.abs(giro) * 0.004 + (1 - fecha) * 0.25 + (1 - encurta) * 0.6);
            if (!melhor || nota > melhor.nota + 1e-9) melhor = { nota: nota, angs: angs, k: encurta, pts: pts };
          });
        });
      });
      if (!melhor) melhor = { angs: base, k: 1, pts: marca(base, 1) };
      out[id] = melhor.angs.map(function (a) { return { ang: a, comp: comp * melhor.k }; });
      colocadosDe[id] = melhor.pts;
    };
    ordem.forEach(arranjar);      // 1ª passada: os mais apertados primeiro
    ordem.forEach(arranjar);      // 2ª: cada um reconsidera, sabendo onde ficaram os outros
    return out;
  };

  /* Em que direção desenhar, em volta de cada átomo, os H implícitos, os
     pares isolados, o elétron desemparelhado e a carga. `T(id)` dá a
     posição do átomo na tela; `analise` é o resultado de analisar(). */
  L.arranjo2D = function (g, analise, T, posH) {
    var out = {};
    posH = posH || L.posicoesH(g, T, 40);
    Object.keys(g.atomos).forEach(function (id) {
      var x = analise.atomos[id], p = T(id);
      var fixos = g.vizinhos(id).map(function (v) { var q = T(v.id); return Math.atan2(q.y - p.y, q.x - p.x); });
      var hs = (posH[id] || []).map(function (h) { return h.ang; });   // os MESMOS lugares da estrutural completa
      var comH = fixos.concat(hs);
      var pares = L.distribuir(comH, x.pares);
      var comPares = comH.concat(pares);
      var soltos = L.distribuir(comPares, x.desemparelhados);
      var todos = comPares.concat(soltos);
      var carga = x.cargaFormal ? L.distribuir(todos, 1)[0] : null;
      out[id] = { hidrogenios: hs, pares: pares, desemparelhados: soltos, carga: carga };
    });
    return out;
  };

  /* O sinal da carga como se escreve: +, −, 2+, 2−. */
  L.textoCarga = function (q) {
    if (!q) return '';
    var n = Math.abs(q);
    return (n > 1 ? n : '') + (q > 0 ? '+' : '−');
  };

  /* ═══ AS DUAS SETAS DA MECÂNICA POLAR ═══════════════════════════
     Toda seta curva de um mecanismo polar do Ensino Médio é uma destas
     duas, ou uma em seguida da outra (ver docs, seção 9):

     formarComPar(g, doador, aceptor)
        um PAR ISOLADO do doador vira ligação com o aceptor.
        doador:  N − 2, B + 1  ⇒  carga + 1
        aceptor: N igual, B + 1 ⇒  carga − 1
        Ex.: CH₃OH + H⁺ → CH₃OH₂⁺ (o O fica +1, o H⁺ fica neutro)

     quebrarPara(g, a, b, fica)
        a ligação a–b perde um par, que fica INTEIRO com `fica`.
        fica:  N + 2, B − 1  ⇒  carga − 1
        outro: N igual, B − 1 ⇒  carga + 1
        Ex.: (CH₃)₃C–Cl → (CH₃)₃C⁺ + Cl⁻

     A ORDEM IMPORTA: a carga nova é gravada ANTES de mexer na ligação,
     porque é a carga que define a valência efetiva no grafo — o O
     neutro do metanol só aceita 2 ligações; já com carga +1, aceita a 3ª.
     Cada função devolve null, sem alterar nada, se a seta for impossível
     (sem par para doar, ou aceptor que passaria do octeto). */
  L.formarComPar = function (g, doador, aceptor) {
    var d = L.atomo(g, doador), a = L.atomo(g, aceptor);
    if (d.pares < 1) return null;                                   // não há par para doar
    if (a.eletronsEmVolta + 2 > (L.EXPANDE[a.el] || a.regra)) return null;   // aceptor passaria do octeto
    var lig = g.ligacao(doador, aceptor);
    if (lig && lig.ordem >= 3) return null;
    var ad = g.atomos[doador], aa = g.atomos[aceptor];
    var hD = d.hidrogenios, hA = a.hidrogenios;
    ad.carga = d.cargaFormal + 1;
    aa.carga = a.cargaFormal - 1;
    var ok = lig ? (lig.ordem += 1, true) : g.addLigacao(doador, aceptor, 1);
    if (!ok) { ad.carga = d.cargaFormal; aa.carga = a.cargaFormal; return null; }
    /* os H implícitos não podem mudar numa seta: se a carga nova mexeu
       na valência efetiva a ponto de alterar a conta, a seta é inválida */
    if (g.hidrogenios(doador) !== hD || g.hidrogenios(aceptor) !== hA) {
      if (lig) lig.ordem -= 1; else g.removeLigacao(doador, aceptor);
      ad.carga = d.cargaFormal; aa.carga = a.cargaFormal;
      return null;
    }
    return { doador: ad.carga, aceptor: aa.carga };
  };

  L.quebrarPara = function (g, a, b, fica) {
    var lig = g.ligacao(a, b);
    if (!lig || (fica !== a && fica !== b)) return null;
    var outro = fica === a ? b : a;
    var f = L.atomo(g, fica), o = L.atomo(g, outro);
    var af = g.atomos[fica], ao = g.atomos[outro];
    var hF = f.hidrogenios, hO = o.hidrogenios, ordemAntes = lig.ordem;
    af.carga = f.cargaFormal - 1;
    ao.carga = o.cargaFormal + 1;
    if (ordemAntes > 1) lig.ordem -= 1; else g.removeLigacao(a, b);
    if (g.hidrogenios(fica) !== hF || g.hidrogenios(outro) !== hO) {
      // desfaz na ordem inversa: primeiro a carga (que define a valência), depois a ligação
      af.carga = f.cargaFormal; ao.carga = o.cargaFormal;
      if (ordemAntes > 1) lig.ordem = ordemAntes; else g.addLigacao(a, b, 1);
      return null;
    }
    return { fica: af.carga, outro: ao.carga };
  };

})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).Q3;
}
