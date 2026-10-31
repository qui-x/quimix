/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/classificacao-cadeias.js
   ───────────────────────────────────────────────────────────────
   CLASSIFICAÇÃO DE CADEIAS CARBÔNICAS, COM EVIDÊNCIAS (SIQC M3).

   Para cada critério, devolve a resposta E os átomos ou ligações que a
   provam. É isso que permite ao Módulo 3 pedir ao aluno que APONTE a
   evidência na estrutura, em vez de só marcar um botão.

   Os quatro critérios clássicos seguem EXATAMENTE as regras de
   Grafo.prototype.classificar (Módulo 1) — um teste confere, em
   centenas de estruturas sorteadas, que as duas funções concordam:
     · ESQUELETO = carbonos + heteroátomos ENTRE carbonos. O O de um
       álcool na ponta, o Cl de um haleto, o =O de uma cetona são
       grupos pendurados na cadeia, não parte dela.
     · fechamento: há anel no esqueleto?
     · disposição: em cadeia aberta, um átomo do esqueleto ligado a 3
       ou mais outros do esqueleto; em anel, uma cadeia lateral saindo
       do anel. Carbonos de fusão (naftaleno) não ramificam.
     · saturação: dupla ou tripla ENTRE CARBONOS. C=O não conta.
     · natureza: heteroátomo ENTRE carbonos.

   Critérios das cadeias fechadas:
     · aromaticidade — regra de Hückel: anel plano, todo conjugado,
       com 4n + 2 elétrons π (n = 0, 1, 2…). Na forma de Kekulé:
         carbono com dupla para outro átomo de anel ...... 1 elétron π
         N com dupla no anel (piridina) ................... 1
         N, O ou S sem dupla (pirrol, furano, tiofeno) .... 2 (o par isolado)
       Um CH₂ no anel, ou uma dupla para fora dele (C=O de quinona),
       quebra a conjugação: o anel não é aromático. Por isso o
       ciclo-octatetraeno (8 π, que é 4n) também não é.
     · núcleos (só aromáticas): um anel aromático = mononuclear; dois
       ou mais = polinuclear, de núcleos CONDENSADOS (compartilham
       átomos: naftaleno) ou ISOLADOS (não compartilham: bifenila).
     · homocíclica × heterocíclica: há heteroátomo NO ANEL?
       (A vanilina é heterogênea — o O do metoxi está entre dois
       carbonos — mas homocíclica: o anel só tem carbonos.)

   CADEIA MISTA. Muitos livros chamam de "mista" a cadeia com uma parte
   em anel e outra aberta (tolueno, limoneno). O Módulo 1 a classifica
   como fechada e ramificada. A análise sempre informa `mista`, e a
   convenção de exibição é uma escolha única: C.CONVENCAO.mista.

   Uso: var a = Q3.Classificacao.analisar(g)

   Depende de: grafo-molecular.js, geometria-molecular.js (aneisMinimos,
   hibridizacao).
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var C = Q3.Classificacao = {};

  /* DECISÃO DO PROFESSOR (setembro de 2026): como no Módulo 1 — anel
     com cadeia lateral é "fechada e ramificada", nunca "mista". Os dois
     módulos precisam dizer a mesma coisa ao aluno. O teste de
     classificação trava esta escolha: se alguém ligar a "mista" aqui,
     ele falha. (true faria a combinação aparecer como "mista".) */
  C.CONVENCAO = { mista: false };

  C.analisar = function (g) {
    var el = function (id) { return g.atomos[id].el; };
    var pesados = g.pesados();
    var vizC = function (id) { return g.vizinhos(id).filter(function (v) { return el(v.id) === 'C'; }).length; };
    var ehEsqueleto = function (id) { return el(id) === 'C' || vizC(id) >= 2; };
    var esqueleto = pesados.filter(ehEsqueleto);

    // anéis: o conjunto mínimo (SSSR), cada um na ordem em que se percorre
    var aneis = Q3.Geometria.aneisMinimos(g);
    var emAnel = {};
    aneis.forEach(function (r) { r.forEach(function (id) { emAnel[id] = true; }); });
    var temAnel = aneis.length > 0;

    // ── disposição: os pontos de onde sai um ramo
    var pontos = esqueleto.filter(function (id) {
      var viz = g.vizinhos(id).filter(function (v) { return ehEsqueleto(v.id); });
      if (!emAnel[id]) return viz.length >= 3;
      return viz.some(function (v) { return !emAnel[v.id]; });
    });

    // ── saturação: as duplas e triplas entre carbonos; e as que NÃO contam
    var insaturacoes = [], naoContam = [];
    g.ligacoes.forEach(function (l) {
      if (l.ordem < 2) return;
      var par = { a: l.a, b: l.b, ordem: l.ordem };
      (el(l.a) === 'C' && el(l.b) === 'C' ? insaturacoes : naoContam).push(par);
    });

    // ── natureza: heteroátomos entre carbonos; e os da ponta (a pegadinha)
    var heteroatomos = pesados.filter(function (id) { return el(id) !== 'C' && vizC(id) >= 2; });
    var pendentes = pesados.filter(function (id) { return el(id) !== 'C' && vizC(id) < 2; });

    // ── cadeias fechadas: Hückel em cada anel
    var eletronsPi = function (anel) {
      var total = 0;
      for (var k = 0; k < anel.length; k++) {
        var id = anel[k], liga = g.vizinhos(id);
        if (liga.some(function (v) { return v.ordem === 3; })) return null;   // sp no anel: fora do escopo
        var dupla = liga.filter(function (v) { return v.ordem === 2; })[0];
        if (el(id) === 'C') {
          if (!dupla || !emAnel[dupla.id]) return null;   // CH₂ ou C=O exocíclico: quebra a conjugação
          total += 1;
        } else if (el(id) === 'N' || el(id) === 'O' || el(id) === 'S') {
          if (dupla) { if (!emAnel[dupla.id]) return null; total += 1; }
          else total += 2;                                 // o par isolado entra na nuvem π
        } else return null;
      }
      return total;
    };
    var infoAneis = aneis.map(function (r) {
      var pi = eletronsPi(r);
      return {
        atomos: r.slice(),
        eletronsPi: pi,
        aromatico: pi !== null && pi >= 2 && (pi - 2) % 4 === 0,
        hetero: r.filter(function (id) { return el(id) !== 'C'; })
      };
    });
    var aromaticos = infoAneis.filter(function (r) { return r.aromatico; });
    var condensados = false;
    for (var x = 0; x < aromaticos.length; x++) {
      for (var y = x + 1; y < aromaticos.length; y++) {
        var comuns = aromaticos[x].atomos.filter(function (id) { return aromaticos[y].atomos.indexOf(id) >= 0; });
        if (comuns.length >= 2) condensados = true;
      }
    }
    var heteroNoAnel = [];
    infoAneis.forEach(function (r) { r.hetero.forEach(function (id) { if (heteroNoAnel.indexOf(id) < 0) heteroNoAnel.push(id); }); });

    // ── classes e hibridização de cada carbono
    var classes = {}, hibridizacao = {};
    pesados.forEach(function (id) {
      if (el(id) !== 'C') return;
      classes[id] = g.classeCarbono(id);
      hibridizacao[id] = Q3.Geometria.hibridizacao(g, id);
    });

    return {
      esqueleto: esqueleto,
      cadeia: temAnel ? 'fechada' : 'aberta',
      aneis: infoAneis,
      // parte aberta do esqueleto numa cadeia com anel: o que os livros chamam de "mista"
      mista: temAnel && esqueleto.some(function (id) { return !emAnel[id]; }),
      parteAberta: temAnel ? esqueleto.filter(function (id) { return !emAnel[id]; }) : [],
      ramificacao: pontos.length ? 'ramificada' : 'normal',
      pontosRamificacao: pontos,
      saturacao: insaturacoes.length ? 'insaturada' : 'saturada',
      insaturacoes: insaturacoes,
      naoContam: naoContam,
      natureza: heteroatomos.length ? 'heterogênea' : 'homogênea',
      heteroatomos: heteroatomos,
      pendentes: pendentes,
      aromaticidade: temAnel ? (aromaticos.length ? 'aromática' : 'alicíclica') : null,
      nucleos: aromaticos.length ? (aromaticos.length === 1 ? 'mononuclear' : 'polinuclear') : null,
      tipoPolinuclear: aromaticos.length > 1 ? (condensados ? 'condensados' : 'isolados') : null,
      heterociclo: temAnel ? (heteroNoAnel.length ? 'heterocíclica' : 'homocíclica') : null,
      heteroNoAnel: heteroNoAnel,
      classes: classes,
      hibridizacao: hibridizacao
    };
  };

  /* Os critérios que se aplicam a esta cadeia, na ordem dos livros,
     com a resposta segundo a convenção escolhida. */
  C.criterios = function (a, convencao) {
    var conv = convencao || C.CONVENCAO;
    var out = [
      { chave: 'cadeia', opcoes: conv.mista ? ['aberta', 'fechada', 'mista'] : ['aberta', 'fechada'],
        resposta: conv.mista && a.mista ? 'mista' : a.cadeia },
      { chave: 'ramificacao', opcoes: ['normal', 'ramificada'], resposta: a.ramificacao },
      { chave: 'saturacao', opcoes: ['saturada', 'insaturada'], resposta: a.saturacao },
      { chave: 'natureza', opcoes: ['homogênea', 'heterogênea'], resposta: a.natureza }
    ];
    if (a.cadeia === 'fechada') {
      out.push({ chave: 'aromaticidade', opcoes: ['aromática', 'alicíclica'], resposta: a.aromaticidade });
      out.push({ chave: 'heterociclo', opcoes: ['homocíclica', 'heterocíclica'], resposta: a.heterociclo });
      if (a.nucleos) {
        out.push({ chave: 'nucleos', opcoes: ['mononuclear', 'polinuclear'], resposta: a.nucleos });
        if (a.tipoPolinuclear) out.push({ chave: 'tipoPolinuclear', opcoes: ['condensados', 'isolados'], resposta: a.tipoPolinuclear });
      }
    }
    return out;
  };

})(typeof window !== 'undefined' ? window : globalThis);
