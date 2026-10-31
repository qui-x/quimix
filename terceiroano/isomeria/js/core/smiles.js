/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/smiles.js
   ───────────────────────────────────────────────────────────────
   LEITOR DE SMILES — de texto para Q3.Grafo.

   SMILES (Simplified Molecular Input Line Entry System, Weininger,
   1988) é a notação de linha padrão da química: é o que o PubChem
   mostra em "Canonical SMILES" para cada substância. Escrever as
   moléculas do banco em SMILES permite a qualquer professor conferir
   cada uma numa fonte pública.

   Subconjunto aceito (o que o Ensino Médio usa):
     átomos ........ C N O S P F Cl Br I (os H ficam implícitos: o
                     grafo completa a valência, como o próprio SMILES)
     ligações ...... - (simples, opcional)  = (dupla)  # (tripla)
     ramos ......... ( ... ), podendo aninhar
     anéis ......... dígitos 1 a 9: o mesmo dígito abre e fecha o anel
   Os anéis aromáticos vão na forma de KEKULÉ (duplas alternadas,
   letras maiúsculas): benzeno = C1=CC=CC=C1. É como os livros os
   desenham, e a aromaticidade é DEDUZIDA depois (regra de Hückel,
   em classificacao-cadeias.js) — nunca declarada na entrada.

   Erros de escrita não passam em silêncio: símbolo desconhecido,
   anel sem fechar, parêntese sobrando, valência estourada ou teto de
   átomos — tudo lança erro com a posição.

   Uso: var g = Q3.deSmiles('CC(C)C')    // isobutano

   Depende de: grafo-molecular.js.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};

  var ELEMENTOS = { B: 1, C: 1, N: 1, O: 1, P: 1, S: 1, F: 1, I: 1, Cl: 1, Br: 1 };
  var ORDEM = { '-': 1, '=': 2, '#': 3 };

  Q3.deSmiles = function (texto) {
    var s = String(texto).replace(/\s+/g, '');
    var g = new Q3.Grafo();
    var i = 0, anterior = null, ordem = null, pilha = [], aneis = {};
    var erro = function (msg) { throw new Error('SMILES "' + s + '": ' + msg + ' (posição ' + i + ')'); };
    var ligar = function (a, b, o) {
      if (!g.addLigacao(a, b, o)) erro('ligação ' + g.atomos[a].el + '–' + g.atomos[b].el + ' de ordem ' + o + ' estoura a valência');
    };

    while (i < s.length) {
      var ch = s[i];
      if (ch === '(') {
        if (!anterior) erro('ramo sem átomo antes');
        pilha.push(anterior); i++; continue;
      }
      if (ch === ')') {
        if (!pilha.length) erro('parêntese fechando sem abrir');
        anterior = pilha.pop(); ordem = null; i++; continue;
      }
      if (ORDEM[ch]) { ordem = ORDEM[ch]; i++; continue; }
      if (ch >= '1' && ch <= '9') {
        if (!anterior) erro('fechamento de anel sem átomo antes');
        var aberto = aneis[ch];
        if (aberto) {
          // a ordem pode vir escrita na abertura ou no fechamento (C=1...C1)
          ligar(aberto.id, anterior, Math.max(ordem || 1, aberto.ordem || 1));
          delete aneis[ch];
        } else aneis[ch] = { id: anterior, ordem: ordem };
        ordem = null; i++; continue;
      }
      var el = null;
      if (ELEMENTOS[s.substr(i, 2)]) { el = s.substr(i, 2); i += 2; }
      else if (ELEMENTOS[ch]) { el = ch; i++; }
      else erro('símbolo inesperado "' + ch + '"');
      var id = g.addAtomo(el);
      if (!id) erro('passou do teto de ' + Q3.TETO_PESADOS + ' átomos pesados');
      if (anterior) ligar(anterior, id, ordem || 1);
      anterior = id; ordem = null;
    }
    if (pilha.length) erro('parêntese aberto sem fechar');
    var abertos = Object.keys(aneis);
    if (abertos.length) erro('anel ' + abertos.join(', ') + ' aberto sem fechar');
    return g;
  };

})(typeof window !== 'undefined' ? window : globalThis);
