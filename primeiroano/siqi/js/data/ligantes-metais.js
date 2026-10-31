/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: ligantes-metais.js
   ───────────────────────────────────────────────────────────────
   Ligantes comuns em complexos de coordenação (nome, fórmula,
   carga), os metais mais usados nos desafios do Construtor (com seus
   sufixos aniônicos: ferrato, cuprato...) e os prefixos
   multiplicadores gregos (di, tri, tetra...) usados na nomenclatura
   de complexos.
   Depende de: nada. Usado por: js/construtor/*.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   LIGANTES / METAIS_COMPLEXOS / PREFIXOS_MULT / DESAFIOS_CONSTRUTOR
   Módulo 2 — Construtor de Nomenclatura (química de coordenação)
   ---------------------------------------------------------------------
   Dados do novo Módulo 2, que substitui a antiga "Classificação" por
   um construtor de blocos ("estilo LEGO") para nomenclatura IUPAC de
   compostos de coordenação: [prefixo multiplicador] + [ligante] +
   ... + [metal (+sufixo -ato se o complexo for aniônico)] + [NOx em
   romano] + "de" + [cátion externo], na ordem certa da língua
   portuguesa (ânion primeiro, "de", cátion depois — ex.: "cloreto DE
   sódio").

   Referências: IUPAC Nomenclature of Inorganic Chemistry,
   Recommendations 2005 ("Red Book"), Seção IR-9 (Coordination
   Compounds); Brown, LeMay & Bursten (2012) "Chemistry: The Central
   Science", 12ª ed., Cap. 24; Lee, J.D. (1996) "Química Inorgânica
   não tão Concisa".

   BNCC: conteúdo de Ensino Médio (nomenclatura de coordenação vai além
   de EF09) — habilidades EM13CNT101/EM13CNT207 (investigação e
   representação de fenômenos químicos com linguagem própria da área).
═══════════════════════════════════════════════════════════════════ */

/* ── LIGANTES ─────────────────────────────────────────────────────
   Nome do ligante quando coordenado a um átomo central. Regra geral
   (IUPAC IR-9.2.2.1): ânions terminados em "-eto" viram "-o" (cloreto→
   cloro); ânions "-ato"/"-ito" mantêm a raiz; moléculas neutras usam o
   nome comum, com 4 exceções consagradas (água→aqua, amônia→amino,
   CO→carbonila, NO→nitrosila). */
var LIGANTES = {
  cloro:    { formula: 'Cl⁻',  nome_origem: 'cloreto', tipo: 'aniônico', desc: 'Ligante haleto mais comum.' },
  bromo:    { formula: 'Br⁻',  nome_origem: 'brometo', tipo: 'aniônico', desc: 'Haleto, menos comum que o cloro.' },
  fluoro:   { formula: 'F⁻',   nome_origem: 'fluoreto', tipo: 'aniônico', desc: 'Haleto mais eletronegativo.' },
  iodo:     { formula: 'I⁻',   nome_origem: 'iodeto', tipo: 'aniônico', desc: 'Haleto mais volumoso.' },
  ciano:    { formula: 'CN⁻',  nome_origem: 'cianeto', tipo: 'aniônico', desc: 'Liga-se pelo carbono; ligante forte, comum em complexos de ferro.' },
  hidroxo:  { formula: 'OH⁻',  nome_origem: 'hidróxido', tipo: 'aniônico', desc: 'Pode formar pontes entre dois metais.' },
  oxo:      { formula: 'O²⁻',  nome_origem: 'óxido', tipo: 'aniônico', desc: 'Ligante de carga 2−.' },
  tio:      { formula: 'S²⁻',  nome_origem: 'sulfeto', tipo: 'aniônico', desc: 'Análogo ao oxo, com enxofre.' },
  nitro:    { formula: 'NO₂⁻', nome_origem: 'nitrito', tipo: 'aniônico', desc: 'Liga-se pelo nitrogênio (isômero: nitrito liga pelo O).' },
  sulfato:  { formula: 'SO₄²⁻', nome_origem: 'sulfato', tipo: 'aniônico', desc: 'Mantém o próprio nome como ligante.' },
  carbonato:{ formula: 'CO₃²⁻', nome_origem: 'carbonato', tipo: 'aniônico', desc: 'Mantém o próprio nome como ligante.' },
  aqua:     { formula: 'H₂O',  nome_origem: 'água', tipo: 'neutro', desc: 'Exceção consagrada — não seria "oxidano".' },
  amino:    { formula: 'NH₃',  nome_origem: 'amônia', tipo: 'neutro', desc: 'Exceção consagrada — não seria "trihidridonitrogênio".' },
  carbonila:{ formula: 'CO',   nome_origem: 'monóxido de carbono', tipo: 'neutro', desc: 'Exceção consagrada, comum em complexos metal-carbonila.' },
  nitrosila:{ formula: 'NO',   nome_origem: 'óxido nítrico', tipo: 'neutro', desc: 'Exceção consagrada.' },
};

/* ── METAIS_COMPLEXOS ──────────────────────────────────────────────
   Nome do átomo central conforme o COMPLEXO seja catiônico/neutro
   (nome comum, sem sufixo) ou aniônico (sufixo "-ato", às vezes sobre
   a raiz latina — regra IUPAC IR-9.2.4.2). NOX comuns listados para
   referência pedagógica ao verificar as respostas. */
var METAIS_COMPLEXOS = {
  Fe: { nome_cation: 'ferro',    nome_anion: 'ferrato',    origem_latina: 'ferrum',    nox_comuns: [2, 3] },
  Cu: { nome_cation: 'cobre',    nome_anion: 'cuprato',    origem_latina: 'cuprum',    nox_comuns: [1, 2] },
  Ag: { nome_cation: 'prata',    nome_anion: 'argentato',  origem_latina: 'argentum',  nox_comuns: [1] },
  Au: { nome_cation: 'ouro',     nome_anion: 'aurato',     origem_latina: 'aurum',     nox_comuns: [1, 3] },
  Zn: { nome_cation: 'zinco',    nome_anion: 'zincato',    origem_latina: null,        nox_comuns: [2] },
  Ni: { nome_cation: 'níquel',   nome_anion: 'niquelato',  origem_latina: null,        nox_comuns: [2] },
  Co: { nome_cation: 'cobalto',  nome_anion: 'cobaltato',  origem_latina: null,        nox_comuns: [2, 3] },
  Cr: { nome_cation: 'cromo',    nome_anion: 'cromato',    origem_latina: null,        nox_comuns: [2, 3] },
  Mn: { nome_cation: 'manganês', nome_anion: 'manganato',  origem_latina: null,        nox_comuns: [2, 4] },
  Pt: { nome_cation: 'platina',  nome_anion: 'platinato',  origem_latina: null,        nox_comuns: [2, 4] },
  Sn: { nome_cation: 'estanho',  nome_anion: 'estanato',   origem_latina: 'stannum',   nox_comuns: [2, 4] },
  Pb: { nome_cation: 'chumbo',   nome_anion: 'plumbato',   origem_latina: 'plumbum',   nox_comuns: [2, 4] },
};

/* ── PREFIXOS_MULT ─────────────────────────────────────────────────
   Simples (mono–hexa): usados para ligantes de nome simples. Compostos
   (bis/tris/tetraquis...): usados quando o nome do próprio ligante já
   tem um prefixo multiplicador embutido, ou é composto/entre
   parênteses — regra IUPAC IR-9.2.3.3 (evita ambiguidade; nenhum
   ligante da lista acima precisa deles, mas ficam disponíveis como
   distratores para testar se o aluno sabe quando NÃO usá-los).

   "tetraquis" (não "tetrakis"): confirmado em múltiplas fontes de
   nomenclatura em português (ex.: Prof. J.D. Ayala, UFJF — "bis (2),
   tris (3), tetraquis (4), pentaquis (5), hexaquis (6)") — a forma
   com "qu" é a adaptação fonética padrão em português, "tetrakis"
   é a grafia em inglês. */
var PREFIXOS_MULT = {
  simples:   { 1: '', 2: 'di', 3: 'tri', 4: 'tetra', 5: 'penta', 6: 'hexa' },
  compostos: { 2: 'bis', 3: 'tris', 4: 'tetraquis', 5: 'pentaquis', 6: 'hexaquis' },
};

