/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: regras-iupac.js
   ───────────────────────────────────────────────────────────────
   As regras de nomenclatura IUPAC exibidas como guia contextual no
   Construtor (ordem alfabética dos ligantes, sufixo -ato em
   complexos aniônicos, NOX sempre em algarismo romano...).
   Depende de: nada. Usado por: js/construtor/bancada.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── REGRAS_IUPAC ──────────────────────────────────────────────────
   Cards explicativos mostrados no "Guia de Regras Ativas" (barra
   direita), filtrados por desafio.regras_ativas. */
var REGRAS_IUPAC = {
  ordem_sal: {
    titulo: 'Ordem do nome em sais (português)',
    texto: 'Em português, o nome de um sal segue [ânion] + "de" + [cátion] — o ânion vem primeiro no NOME, mesmo que o cátion venha primeiro na FÓRMULA. Ex.: NaCl → "cloreto DE sódio", não "sódio cloreto".',
  },
  sufixo_eto: {
    titulo: 'Sufixo "-eto" para ânions binários',
    texto: 'Ânions formados por um único elemento (haletos, calcogenetos) recebem o sufixo "-eto": Cl⁻ → cloreto, S²⁻ → sulfeto.',
  },
  sufixo_ico_oso: {
    titulo: 'Sufixos "-ico" e "-oso" em ácidos/sais oxigenados',
    texto: 'Quando um elemento forma dois oxoácidos comuns, o de NOX mais alto leva o sufixo "-ico" e o de NOX mais baixo leva "-oso". H₂SO₄ (S⁺⁶) → sulfúrico; H₂SO₃ (S⁺⁴) → sulfuroso.',
  },
  sufixo_ato_aniônico: {
    titulo: 'Sufixo "-ato" só quando o COMPLEXO é aniônico',
    texto: 'O nome do átomo central de um complexo só recebe o sufixo "-ato" quando o complexo INTEIRO tem carga negativa. Em complexos neutros ou catiônicos, usa-se o nome comum do metal, sem sufixo especial. Alguns metais usam a raiz latina nessa forma: ferro→ferrato, cobre→cuprato, prata→argentato.',
  },
  nox_romano: {
    titulo: 'Estado de oxidação em algarismo romano',
    texto: 'O NOX do átomo central vai em algarismos romanos entre parênteses, colado ao nome do metal, sem espaço: "ferrato(III)", não "ferrato (III)". Calcule pelo balanço de cargas: soma das cargas dos ligantes + NOX do metal = carga total do complexo.',
  },
  contagem_ligantes: {
    titulo: 'Prefixos multiplicadores contam ligantes, não átomos',
    texto: 'Os prefixos di-, tri-, tetra-, penta-, hexa- indicam quantos ligantes IGUAIS estão coordenados — não o número de átomos dentro do ligante. "Hexaciano" = 6 ligantes CN⁻, mesmo que cada um tenha 2 átomos.',
  },
  ordem_alfabetica: {
    titulo: 'Ordem alfabética dos ligantes',
    texto: 'Quando um complexo tem DOIS OU MAIS tipos de ligante diferentes, eles aparecem no nome em ordem ALFABÉTICA (pela primeira letra do nome do ligante) — os prefixos multiplicadores NÃO contam para essa ordenação. "Amino" vem antes de "cloro" porque A vem antes de C.',
  },
  sem_cation_externo: {
    titulo: 'Complexos neutros não têm "de + cátion"',
    texto: 'Quando o complexo inteiro já é eletricamente neutro (soma de cargas = 0), ele já É a substância — não existe um cátion externo separado para nomear com "de". O nome termina no NOX do metal.',
  },
  hipo_per: {
    titulo: 'Prefixos "hipo-" e "per-" em famílias de 4 oxiácidos',
    texto: 'Quando um elemento forma QUATRO oxiácidos diferentes (varia o número de oxigênios), os sufixos -oso/-ico sozinhos não bastam para diferenciar todos. Usa-se então: hipo-...-oso (NOX mais baixo da família) < -oso < -ico < per-...-ico (NOX mais alto). Ex.: cloro forma HClO (hipocloroso, Cl⁺¹), HClO₂ (cloroso, Cl⁺³), HClO₃ (clórico, Cl⁺⁵) e HClO₄ (perclórico, Cl⁺⁷).',
  },
};

