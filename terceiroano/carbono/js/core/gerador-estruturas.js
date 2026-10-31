/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/gerador-estruturas.js
   ───────────────────────────────────────────────────────────────
   GERADOR DE ESTRUTURAS ALEATÓRIAS — cadeias carbônicas válidas, de
   tamanho sorteado, com ramificações, insaturações, anéis e heteroátomos
   em proporções sorteadas.

   Saiu do editor do Módulo 1 junto com o painel de Desafio, que foi
   removido (estava desconexo do módulo). Fica no núcleo porque serve:
     · ao futuro módulo de classificação de cadeias;
     · aos verificadores do projeto, que montam centenas de moléculas de
       teste com ele (geometria plana, 3D, hidrogênios, estereoquímica).
   Não é carregado pelo index.html enquanto nenhum módulo o usa.

   Uso: var g = Q3.gerarEstrutura(rng)  — rng: função que devolve [0, 1)
   (Math.random se omitida). Devolve um Q3.Grafo conexo, com no máximo
   Q3.TETO_PESADOS átomos pesados.

   Depende de: grafo-molecular.js, geometria-molecular.js.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};

  /* Estrutura válida ao acaso: cadeia de 4 a 9 carbonos com viés de
     cadeia longa, e chance de anel, de dupla entre carbonos, de
     heteroátomo NO MEIO da cadeia (que a torna heterogênea) e de grupo
     na PONTA (que não torna — a pegadinha clássica do livro). */
  Q3.gerarEstrutura = function (rng) {
    var rnd = rng || Math.random, G = Q3.Geometria;
    var sorteia = function (lista) { return lista[Math.floor(rnd() * lista.length)]; };
    var g, pos;
    for (var tent = 0; tent < 30; tent++) {
      g = new Q3.Grafo(); pos = {};
      var raiz = g.addAtomo('C'); pos[raiz] = { x: 0, y: 0 };
      var n = 4 + Math.floor(rnd() * 6), ultimo = raiz;
      for (var i = 1; i < n; i++) {
        var cands = g.pesados().filter(function (id) { return g.valenciaLivre(id) > 0 && g.vizinhos(id).length < 3; });
        var pai = (rnd() < 0.62 && cands.indexOf(ultimo) >= 0) ? ultimo : sorteia(cands);
        ultimo = G.anexar(g, pos, pai, 'C').id;
      }
      if (rnd() < 0.34) {                          // anel de 5 ou 6
        var dists = function (o) {
          var d = {}; d[o] = 0; var f = [o];
          while (f.length) { var x = f.shift(); g.vizinhos(x).forEach(function (v) { if (!(v.id in d)) { d[v.id] = d[x] + 1; f.push(v.id); } }); }
          return d;
        };
        var pares = [];
        g.pesados().forEach(function (a) {
          var d = dists(a);
          g.pesados().forEach(function (b) {
            if (a < b && (d[b] === 4 || d[b] === 5) && g.valenciaLivre(a) > 0 && g.valenciaLivre(b) > 0) pares.push([a, b]);
          });
        });
        if (pares.length) { var par = sorteia(pares); g.addLigacao(par[0], par[1], 1); }
      }
      if (rnd() < 0.4) {                           // dupla entre carbonos
        var simples = g.ligacoes.filter(function (l) {
          return l.ordem === 1 && g.valenciaLivre(l.a) > 0 && g.valenciaLivre(l.b) > 0 &&
            G.hibridizacao(g, l.a) === 'sp3' && G.hibridizacao(g, l.b) === 'sp3';
        });
        if (simples.length) { var l = sorteia(simples); g.ciclarOrdem(l.a, l.b); }
      }
      if (rnd() < 0.3) {                           // heteroátomo ENTRE carbonos
        var meio = g.pesados().filter(function (id) {
          var v = g.vizinhos(id);
          return v.length === 2 && v.every(function (x) { return x.ordem === 1 && g.atomos[x.id].el === 'C'; });
        });
        if (meio.length) g.atomos[sorteia(meio)].el = sorteia(['O', 'O', 'N', 'S']);   // tioéter também torna a cadeia heterogênea
      }
      if (rnd() < 0.35) {                          // grupo na PONTA
        var livres = g.pesados().filter(function (id) { return g.atomos[id].el === 'C' && g.valenciaLivre(id) > 0; });
        if (livres.length) G.anexar(g, pos, sorteia(livres), sorteia(['O', 'Cl', 'Br', 'N']));
      }
      if (g.pesados().length <= Q3.TETO_PESADOS && g.componentes().length === 1) return g;
    }
    return g;
  };

})(typeof window !== 'undefined' ? window : globalThis);
