/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/formula-condensada.js
   ───────────────────────────────────────────────────────────────
   LEITOR DE FÓRMULA CONDENSADA (SIFO, Módulo 2) — do jeito que os
   livros escrevem: CH3-CH(OH)-CH3, CH3-COOH, CH3-CO-CH3, C(CH3)3-CH3.

   O leitor herdado do SIQC lia os grupos condensados letra por letra:
   "COOH" virava C–O–O–H (um peróxido), "CHO" virava um álcool, "CO"
   um éter, "CN" uma amina. Aqui cada grupo é uma UNIDADE:

     unidade   átomos           a cadeia continua em
     C, CH…    C                C
     CO        C(=O)            C       (cetona, no meio da cadeia)
     COO       C(=O)–O          O       (éster: CH3-COO-CH3)
     CONH      C(=O)–N          N       (amida N-substituída)
     COOH      C(=O)–OH         —       (terminal)
     CHO       C(=O)H           —       (terminal)
     CONH2     C(=O)–NH2        —       (terminal)
     CN        C≡N              —       (terminal)
     COCl…     C(=O)–X          —       (terminal)
     OH, NH2, Cl, Br, I, F, SH  — (terminais)    O, NH, N, S  (no meio)
   No começo da fórmula valem as formas invertidas: HOOC–, OHC–,
   NC–, HO–, H2N–, H3C–.

   Ramos entre parênteses logo depois da unidade, com multiplicador:
   C(CH3)3, CH(OH), C(=O). Ligações: - (ou nada) · = · ≡.
   A TRIPLA é "≡", o símbolo do livro. Como ele é difícil de digitar, o
   atalho é "-=": os três traços na ordem em que se ensina — uma ligação
   σ e duas π (escolha do professor). O campo da bancada converte "-="
   em "≡" enquanto o aluno digita. "~", "#" e "=-" NÃO são aceitos: não
   têm relação com σ e π; quem os digita recebe a explicação da convenção.
   Os H escritos são conferidos contra a valência: CH3=CH2 é recusado.

   Uso: var g = Q3.deFormulaCondensada('CH3-CH(OH)-CH3')
   Erros lançam exceção com a posição — a interface mostra ao aluno.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};

  var SUB = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9' };
  var HALOGENIOS = ['Cl', 'Br', 'I', 'F'];

  /* unidades, das mais longas para as mais curtas; `inicio` = só vale no começo */
  var UNIDADES = [
    // derivados do ácido metanoico no começo da fórmula: HCOO–R (éster), HCON(…) (amida), HCO– (aldeído)
    { t: 'HCOO', inicio: true, monta: function (g) { var c = g.addAtomo('C'), o1 = g.addAtomo('O'), o2 = g.addAtomo('O'); g.addLigacao(c, o1, 2); g.addLigacao(c, o2, 1); return { ancora: c, fim: o2 }; } },
    { t: 'HCONH', inicio: true, monta: function (g) { var c = g.addAtomo('C'), o = g.addAtomo('O'), n = g.addAtomo('N'); g.addLigacao(c, o, 2); g.addLigacao(c, n, 1); return { ancora: c, fim: n }; } },
    { t: 'HCON', inicio: true, monta: function (g) { var c = g.addAtomo('C'), o = g.addAtomo('O'), n = g.addAtomo('N'); g.addLigacao(c, o, 2); g.addLigacao(c, n, 1); return { ancora: n, fim: n }; } },
    { t: 'HOOC', inicio: true, monta: function (g) { var c = g.addAtomo('C'), o1 = g.addAtomo('O'), o2 = g.addAtomo('O'); g.addLigacao(c, o1, 2); g.addLigacao(c, o2, 1); return { ancora: c, fim: c, terminal: false }; } },
    { t: 'OHC', inicio: true, monta: function (g) { var c = g.addAtomo('C'), o = g.addAtomo('O'); g.addLigacao(c, o, 2); return { ancora: c, fim: c }; } },
    { t: 'H2NOC', inicio: true, monta: function (g) { var c = g.addAtomo('C'), o = g.addAtomo('O'), n = g.addAtomo('N'); g.addLigacao(c, o, 2); g.addLigacao(c, n, 1); return { ancora: c, fim: c }; } },
    { t: 'COOH', monta: function (g) { var c = g.addAtomo('C'), o1 = g.addAtomo('O'), o2 = g.addAtomo('O'); g.addLigacao(c, o1, 2); g.addLigacao(c, o2, 1); return { ancora: c, fim: c, terminal: true }; } },
    { t: 'CONH2', monta: function (g) { var c = g.addAtomo('C'), o = g.addAtomo('O'), n = g.addAtomo('N'); g.addLigacao(c, o, 2); g.addLigacao(c, n, 1); return { ancora: c, fim: c, terminal: true }; } },
    { t: 'CONH', monta: function (g) { var c = g.addAtomo('C'), o = g.addAtomo('O'), n = g.addAtomo('N'); g.addLigacao(c, o, 2); g.addLigacao(c, n, 1); return { ancora: c, fim: n }; } },
    { t: 'COCl', monta: function (g) { return acila(g, 'Cl'); } },
    { t: 'COBr', monta: function (g) { return acila(g, 'Br'); } },
    { t: 'COO', monta: function (g) { var c = g.addAtomo('C'), o1 = g.addAtomo('O'), o2 = g.addAtomo('O'); g.addLigacao(c, o1, 2); g.addLigacao(c, o2, 1); return { ancora: c, fim: o2 }; } },
    { t: 'CHO', monta: function (g) { var c = g.addAtomo('C'), o = g.addAtomo('O'); g.addLigacao(c, o, 2); return { ancora: c, fim: c, terminal: true }; } },
    { t: 'CO', monta: function (g) { var c = g.addAtomo('C'), o = g.addAtomo('O'); g.addLigacao(c, o, 2); return { ancora: c, fim: c }; } },
    { t: 'CN', monta: function (g) { var c = g.addAtomo('C'), n = g.addAtomo('N'); g.addLigacao(c, n, 3); return { ancora: c, fim: c, terminal: true }; } },
    { t: 'NC', inicio: true, monta: function (g) { var c = g.addAtomo('C'), n = g.addAtomo('N'); g.addLigacao(c, n, 3); return { ancora: c, fim: c }; } },
    { t: 'H3C', inicio: true, monta: function (g) { var c = g.addAtomo('C'); return { ancora: c, fim: c, h: 3 }; } },
    { t: 'H2N', inicio: true, monta: function (g) { var n = g.addAtomo('N'); return { ancora: n, fim: n }; } },
    { t: 'HO', inicio: true, monta: function (g) { var o = g.addAtomo('O'); return { ancora: o, fim: o }; } },
    { t: 'HS', inicio: true, monta: function (g) { var s = g.addAtomo('S'); return { ancora: s, fim: s }; } },
    { t: 'OH', monta: function (g) { var o = g.addAtomo('O'); return { ancora: o, fim: o, terminal: true }; } },
    { t: 'SH', monta: function (g) { var s = g.addAtomo('S'); return { ancora: s, fim: s, terminal: true }; } },
    { t: 'NH2', monta: function (g) { var n = g.addAtomo('N'); return { ancora: n, fim: n, terminal: true }; } },
    { t: 'NH', monta: function (g) { var n = g.addAtomo('N'); return { ancora: n, fim: n }; } }
  ];
  function acila(g, x) { var c = g.addAtomo('C'), o = g.addAtomo('O'), h = g.addAtomo(x); g.addLigacao(c, o, 2); g.addLigacao(c, h, 1); return { ancora: c, fim: c, terminal: true }; }

  Q3.deFormulaCondensada = function (texto) {
    var bruto = String(texto).replace(/\s+/g, '').replace(/[–—−]/g, '-');
    if (/=-|~|#/.test(bruto)) throw new Error('Para a ligação tripla, digite -= (uma σ e duas π): vira ≡. Ou use o botão ≡.');
    var s = String(texto).replace(/\s+/g, '').replace(/[₀-₉]/g, function (c) { return SUB[c]; }).replace(/[–—−]/g, '-').replace(/-=|≡/g, '#');   // a tripla: ≡ (o do livro) ou o atalho -= (# é só o código interno)
    if (!s) throw new Error('Fórmula vazia.');
    var g = new Q3.Grafo(), i = 0;
    var erro = function (msg) { throw new Error(msg + ' (posição ' + (i + 1) + ' de "' + texto + '")'); };
    var ordemDe = function (ch) { return ch === '=' ? 2 : ch === '#' ? 3 : ch === '-' ? 1 : 0; };
    var ligar = function (a, b, o) {
      if (!g.addLigacao(a, b, o)) erro('Ligação ' + (o === 2 ? 'dupla ' : o === 3 ? 'tripla ' : '') + 'impossível aqui: estoura a valência de ' + g.atomos[a].el + ' ou de ' + g.atomos[b].el);
    };
    var hEscritos = [];   // [id, H escritos] para conferir depois

    /* lê UMA unidade a partir de i; devolve { ancora, fim, terminal } */
    function unidade(noInicio) {
      for (var k = 0; k < UNIDADES.length; k++) {
        var u = UNIDADES[k];
        if (u.inicio && !noInicio) continue;
        if (s.substr(i, u.t.length) === u.t) {
          // "CO" não pode engolir o começo de "COOH", "COO"… (a tabela já vem do mais longo ao mais curto)
          i += u.t.length;
          var r = u.monta(g); if (u.t === 'H3C') hEscritos.push([r.ancora, 3]);
          return r;
        }
      }
      var m = /^(Cl|Br|I|F)/.exec(s.substr(i));
      if (m) { i += m[1].length; var x = g.addAtomo(m[1]); return { ancora: x, fim: x, terminal: true }; }
      m = /^C(H(\d?))?/.exec(s.substr(i));
      if (m && m[0]) {
        i += m[0].length; var c = g.addAtomo('C'); if (!c) erro('Passou do limite de átomos');
        if (m[1] !== undefined) hEscritos.push([c, m[2] ? +m[2] : 1]);
        return { ancora: c, fim: c };
      }
      m = /^(O|N|S)/.exec(s.substr(i));
      if (m) { i += 1; var h = g.addAtomo(m[1]); return { ancora: h, fim: h }; }
      erro('Não reconheci "' + s.substr(i, 4) + '"');
    }

    /* lê uma cadeia: unidade (ramos)* [ligação unidade (ramos)*]* ; devolve a primeira âncora */
    function cadeia(noInicio, anterior, ordemEntrada) {
      var primeira = null, atual = null, ordem = ordemEntrada || 1;
      while (i < s.length && s[i] !== ')') {
        var u = unidade(noInicio && primeira === null);
        if (atual !== null) {
          if (atual.terminal) erro('Nada pode vir depois de um grupo terminal');
          ligar(atual.fim, u.ancora, ordem);
        } else if (anterior !== undefined && anterior !== null) ligar(anterior, u.ancora, ordem);
        if (primeira === null) primeira = u.ancora;
        atual = u;
        // ramos: ( [ligação] cadeia ) [multiplicador]
        while (s[i] === '(') {
          i++;
          var o = ordemDe(s[i]); if (o) i++;
          var ini = i;                                   // início do conteúdo do ramo
          cadeia(false, atual.ancora, o || 1);
          if (s[i] !== ')') erro('Parêntese aberto sem fechar');
          var fimRamo = i;
          i++;
          var mult = /^\d+/.exec(s.substr(i));
          if (mult) {
            var depois = i + mult[0].length;
            // C(CH3)3: relê o MESMO trecho do ramo, n − 1 vezes, voltando o cursor
            for (var r = 1; r < +mult[0]; r++) {
              i = ini; cadeia(false, atual.ancora, o || 1);
              if (i !== fimRamo) erro('Ramo repetido de forma inconsistente');
            }
            i = depois;
          }
        }
        if (i < s.length && s[i] !== ')') {
          var ob = ordemDe(s[i]);
          if (ob) { ordem = ob; i++; }
          else ordem = 1;     // sem símbolo: ligação simples implícita (CH3CH2OH)
          if (i >= s.length) erro('A fórmula termina numa ligação');
        }
      }
      return primeira;
    }

    cadeia(true, null, 1);
    if (i < s.length) erro('Parêntese fechando sem abrir');
    // os H escritos precisam bater com a valência (CH3=CH2 é recusado)
    hEscritos.forEach(function (par) {
      var real = g.hidrogenios(par[0]);
      if (real !== par[1]) throw new Error('O carbono escrito com ' + par[1] + ' H teria ' + real + ' H pelas ligações que você desenhou: confira as ligações de "' + texto + '".');
    });
    return g;
  };

})(typeof window !== 'undefined' ? window : globalThis);
