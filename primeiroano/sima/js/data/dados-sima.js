/* ================================================================
   SIMA — dadossima.js  |  Dados estáticos do simulador
   ================================================================
   Este arquivo concentra TODOS os dados brutos do projeto: a tabela
   periódica completa, constantes físicas, anos de descoberta/modelo,
   regras de preenchimento de subcamadas, a tabela histórica de
   Thomson (1904) e os textos descritivos de cada modelo atômico.

   Não contém lógica de domínio (cálculos, física, renderização) —
   apenas dados. Funções derivadas desses dados (bohrEnergy, catColor,
   fillSubshells etc.) permanecem em scriptsima.js, que consome este
   arquivo como dependência.

   Como o projeto não usa bundler, este arquivo expõe um único objeto
   global — `window.SIMA_DATA` — para evitar poluir o escopo global
   com dezenas de `const` soltos. scriptsima.js desestrutura esse
   objeto no topo do arquivo. A ORDEM DE CARGA no HTML importa:
   dadossima.js deve ser carregado ANTES de scriptsima.js.
   ================================================================ */
(function (global) {
  'use strict';

  // ══════════════════════════════════════════════════════════════
  // CONSTANTES FÍSICAS
  // ══════════════════════════════════════════════════════════════
  const PHYS = {
    E0:   13.6,          // eV — energia de ionização do hidrogênio
    a0:   53,            // pm (Bohr radius) — escalado visualmente p/ px
    alpha: 1/137,        // constante de estrutura fina
    c:    3e8,           // m/s
    h:    4.136e-15,     // eV·s (Planck)
    hc:   1240,          // eV·nm  (hc)
    ke:   1.0,           // Coulomb em unidades normalizadas
  };

  // ══════════════════════════════════════════════════════════════
  // TABELA PERIÓDICA COMPLETA (118 elementos)
  // [Z, sym, name_pt, mass, cat, col, row, electrons[], color]
  // ══════════════════════════════════════════════════════════════
const ELEMENTS = [
  [1, 'H', 'Hidrogênio', '1.008', 'nonmetal', 1, 1, [1], '#dbeafe'],
  [2, 'He', 'Hélio', '4.003', 'noble', 18, 1, [2], '#7dd3fc'],
  [3, 'Li', 'Lítio', '6.941', 'alkali', 1, 2, [2,1], '#ef4444'],
  [4, 'Be', 'Berílio', '9.012', 'alkaline', 2, 2, [2,2], '#fb923c'],
  [5, 'B', 'Boro', '10.81', 'metalloid', 13, 2, [2,3], '#2dd4bf'],
  [6, 'C', 'Carbono', '12.011', 'nonmetal', 14, 2, [2,4], '#6b7280'],
  [7, 'N', 'Nitrogênio', '14.007', 'nonmetal', 15, 2, [2,5], '#6366f1'],
  [8, 'O', 'Oxigênio', '15.999', 'nonmetal', 16, 2, [2,6], '#ef4444'],
  [9, 'F', 'Flúor', '18.998', 'nonmetal', 17, 2, [2,7], '#22c55e'],
  [10, 'Ne', 'Neônio', '20.180', 'noble', 18, 2, [2,8], '#7dd3fc'],
  [11, 'Na', 'Sódio', '22.990', 'alkali', 1, 3, [2,8,1], '#dc2626'],
  [12, 'Mg', 'Magnésio', '24.305', 'alkaline', 2, 3, [2,8,2], '#f97316'],
  [13, 'Al', 'Alumínio', '26.982', 'metal', 13, 3, [2,8,3], '#94a3b8'],
  [14, 'Si', 'Silício', '28.086', 'metalloid', 14, 3, [2,8,4], '#0d9488'],
  [15, 'P', 'Fósforo', '30.974', 'nonmetal', 15, 3, [2,8,5], '#f97316'],
  [16, 'S', 'Enxofre', '32.06', 'nonmetal', 16, 3, [2,8,6], '#eab308'],
  [17, 'Cl', 'Cloro', '35.45', 'nonmetal', 17, 3, [2,8,7], '#16a34a'],
  [18, 'Ar', 'Argônio', '39.948', 'noble', 18, 3, [2,8,8], '#7dd3fc'],
  [19, 'K', 'Potássio', '39.098', 'alkali', 1, 4, [2,8,8,1], '#b91c1c'],
  [20, 'Ca', 'Cálcio', '40.078', 'alkaline', 2, 4, [2,8,8,2], '#ec4899'],
  [21, 'Sc', 'Escândio', '44.956', 'transition', 3, 4, [2,8,9,2], '#8b5cf6'],
  [22, 'Ti', 'Titânio', '47.867', 'transition', 4, 4, [2,8,10,2], '#7c3aed'],
  [23, 'V', 'Vanádio', '50.942', 'transition', 5, 4, [2,8,11,2], '#6d28d9'],
  [24, 'Cr', 'Cromo', '51.996', 'transition', 6, 4, [2,8,13,1], '#2563eb'],
  [25, 'Mn', 'Manganês', '54.938', 'transition', 7, 4, [2,8,13,2], '#0284c7'],
  [26, 'Fe', 'Ferro', '55.845', 'transition', 8, 4, [2,8,14,2], '#0891b2'],
  [27, 'Co', 'Cobalto', '58.933', 'transition', 9, 4, [2,8,15,2], '#0d9488'],
  [28, 'Ni', 'Níquel', '58.693', 'transition', 10, 4, [2,8,16,2], '#059669'],
  [29, 'Cu', 'Cobre', '63.546', 'transition', 11, 4, [2,8,18,1], '#b45309'],
  [30, 'Zn', 'Zinco', '65.38', 'transition', 12, 4, [2,8,18,2], '#64748b'],
  [31, 'Ga', 'Gálio', '69.723', 'metal', 13, 4, [2,8,18,3], '#78909c'],
  [32, 'Ge', 'Germânio', '72.630', 'metalloid', 14, 4, [2,8,18,4], '#14b8a6'],
  [33, 'As', 'Arsênio', '74.922', 'metalloid', 15, 4, [2,8,18,5], '#0f766e'],
  [34, 'Se', 'Selênio', '78.971', 'nonmetal', 16, 4, [2,8,18,6], '#d97706'],
  [35, 'Br', 'Bromo', '79.904', 'nonmetal', 17, 4, [2,8,18,7], '#92400e'],
  [36, 'Kr', 'Criptônio', '83.798', 'noble', 18, 4, [2,8,18,8], '#7dd3fc'],
  [37, 'Rb', 'Rubídio', '85.468', 'alkali', 1, 5, [2,8,18,8,1], '#991b1b'],
  [38, 'Sr', 'Estrôncio', '87.62', 'alkaline', 2, 5, [2,8,18,8,2], '#be185d'],
  [39, 'Y', 'Ítrio', '88.906', 'transition', 3, 5, [2,8,18,9,2], '#7c3aed'],
  [40, 'Zr', 'Zircônio', '91.224', 'transition', 4, 5, [2,8,18,10,2], '#6d28d9'],
  [41, 'Nb', 'Nióbio', '92.906', 'transition', 5, 5, [2,8,18,12,1], '#5b21b6'],
  [42, 'Mo', 'Molibdênio', '95.96', 'transition', 6, 5, [2,8,18,13,1], '#1d4ed8'],
  [43, 'Tc', 'Tecnécio', '[98]', 'transition', 7, 5, [2,8,18,13,2], '#1e40af'],
  [44, 'Ru', 'Rutênio', '101.07', 'transition', 8, 5, [2,8,18,15,1], '#0369a1'],
  [45, 'Rh', 'Ródio', '102.91', 'transition', 9, 5, [2,8,18,16,1], '#0e7490'],
  [46, 'Pd', 'Paládio', '106.42', 'transition', 10, 5, [2,8,18,18], '#047857'],
  [47, 'Ag', 'Prata', '107.87', 'transition', 11, 5, [2,8,18,18,1], '#e2e8f0'],
  [48, 'Cd', 'Cádmio', '112.41', 'transition', 12, 5, [2,8,18,18,2], '#cbd5e1'],
  [49, 'In', 'Índio', '114.82', 'metal', 13, 5, [2,8,18,18,3], '#94a3b8'],
  [50, 'Sn', 'Estanho', '118.71', 'metal', 14, 5, [2,8,18,18,4], '#64748b'],
  [51, 'Sb', 'Antimônio', '121.76', 'metalloid', 15, 5, [2,8,18,18,5], '#0f766e'],
  [52, 'Te', 'Telúrio', '127.60', 'metalloid', 16, 5, [2,8,18,18,6], '#065f46'],
  [53, 'I', 'Iodo', '126.90', 'nonmetal', 17, 5, [2,8,18,18,7], '#7c3aed'],
  [54, 'Xe', 'Xenônio', '131.29', 'noble', 18, 5, [2,8,18,18,8], '#7dd3fc'],
  [55, 'Cs', 'Césio', '132.91', 'alkali', 1, 6, [2,8,18,18,8,1], '#7f1d1d'],
  [56, 'Ba', 'Bário', '137.33', 'alkaline', 2, 6, [2,8,18,18,8,2], '#9d174d'],
  [57, 'La', 'Lantânio', '138.91', 'lanthanide', 3, 9, [2,8,18,18,9,2], '#b45309'],
  [58, 'Ce', 'Cério', '140.12', 'lanthanide', 4, 9, [2,8,18,19,9,2], '#b45309'],
  [59, 'Pr', 'Praseodímio', '140.91', 'lanthanide', 5, 9, [2,8,18,21,8,2], '#d97706'],
  [60, 'Nd', 'Neodímio', '144.24', 'lanthanide', 6, 9, [2,8,18,22,8,2], '#d97706'],
  [61, 'Pm', 'Promécio', '[145]', 'lanthanide', 7, 9, [2,8,18,23,8,2], '#92400e'],
  [62, 'Sm', 'Samário', '150.36', 'lanthanide', 8, 9, [2,8,18,24,8,2], '#92400e'],
  [63, 'Eu', 'Európio', '151.96', 'lanthanide', 9, 9, [2,8,18,25,8,2], '#78350f'],
  [64, 'Gd', 'Gadolínio', '157.25', 'lanthanide', 10, 9, [2,8,18,25,9,2], '#78350f'],
  [65, 'Tb', 'Térbio', '158.93', 'lanthanide', 11, 9, [2,8,18,27,8,2], '#92400e'],
  [66, 'Dy', 'Disprósio', '162.50', 'lanthanide', 12, 9, [2,8,18,28,8,2], '#b45309'],
  [67, 'Ho', 'Hólmio', '164.93', 'lanthanide', 13, 9, [2,8,18,29,8,2], '#d97706'],
  [68, 'Er', 'Érbio', '167.26', 'lanthanide', 14, 9, [2,8,18,30,8,2], '#d97706'],
  [69, 'Tm', 'Túlio', '168.93', 'lanthanide', 15, 9, [2,8,18,31,8,2], '#f59e0b'],
  [70, 'Yb', 'Itérbio', '173.05', 'lanthanide', 16, 9, [2,8,18,32,8,2], '#f59e0b'],
  [71, 'Lu', 'Lutécio', '174.97', 'lanthanide', 17, 9, [2,8,18,32,9,2], '#fbbf24'],
  [72, 'Hf', 'Háfnio', '178.49', 'transition', 4, 6, [2,8,18,32,10,2], '#0e7490'],
  [73, 'Ta', 'Tântalo', '180.95', 'transition', 5, 6, [2,8,18,32,11,2], '#0369a1'],
  [74, 'W', 'Tungstênio', '183.84', 'transition', 6, 6, [2,8,18,32,12,2], '#1d4ed8'],
  [75, 'Re', 'Rênio', '186.21', 'transition', 7, 6, [2,8,18,32,13,2], '#4338ca'],
  [76, 'Os', 'Ósmio', '190.23', 'transition', 8, 6, [2,8,18,32,14,2], '#5b21b6'],
  [77, 'Ir', 'Irídio', '192.22', 'transition', 9, 6, [2,8,18,32,15,2], '#6d28d9'],
  [78, 'Pt', 'Platina', '195.08', 'transition', 10, 6, [2,8,18,32,17,1], '#e2e8f0'],
  [79, 'Au', 'Ouro', '196.97', 'transition', 11, 6, [2,8,18,32,18,1], '#d97706'],
  [80, 'Hg', 'Mercúrio', '200.59', 'transition', 12, 6, [2,8,18,32,18,2], '#94a3b8'],
  [81, 'Tl', 'Tálio', '204.38', 'metal', 13, 6, [2,8,18,32,18,3], '#475569'],
  [82, 'Pb', 'Chumbo', '207.2', 'metal', 14, 6, [2,8,18,32,18,4], '#334155'],
  [83, 'Bi', 'Bismuto', '208.98', 'metal', 15, 6, [2,8,18,32,18,5], '#c026d3'],
  [84, 'Po', 'Polônio', '[209]', 'metalloid', 16, 6, [2,8,18,32,18,6], '#a21caf'],
  [85, 'At', 'Astato', '[210]', 'nonmetal', 17, 6, [2,8,18,32,18,7], '#7e22ce'],
  [86, 'Rn', 'Radônio', '[222]', 'noble', 18, 6, [2,8,18,32,18,8], '#7dd3fc'],
  [87, 'Fr', 'Frâncio', '[223]', 'alkali', 1, 7, [2,8,18,32,18,8,1], '#450a0a'],
  [88, 'Ra', 'Rádio', '[226]', 'alkaline', 2, 7, [2,8,18,32,18,8,2], '#831843'],
  [89, 'Ac', 'Actínio', '[227]', 'actinide', 3, 10, [2,8,18,32,18,9,2], '#0d9488'],
  [90, 'Th', 'Tório', '232.04', 'actinide', 4, 10, [2,8,18,32,18,10,2], '#0f766e'],
  [91, 'Pa', 'Protactínio', '231.04', 'actinide', 5, 10, [2,8,18,32,20,9,2], '#065f46'],
  [92, 'U', 'Urânio', '238.03', 'actinide', 6, 10, [2,8,18,32,21,9,2], '#064e3b'],
  [93, 'Np', 'Netúnio', '[237]', 'actinide', 7, 10, [2,8,18,32,22,9,2], '#065f46'],
  [94, 'Pu', 'Plutônio', '[244]', 'actinide', 8, 10, [2,8,18,32,24,8,2], '#047857'],
  [95, 'Am', 'Amerício', '[243]', 'actinide', 9, 10, [2,8,18,32,25,8,2], '#059669'],
  [96, 'Cm', 'Cúrio', '[247]', 'actinide', 10, 10, [2,8,18,32,25,9,2], '#10b981'],
  [97, 'Bk', 'Berkélio', '[247]', 'actinide', 11, 10, [2,8,18,32,27,8,2], '#34d399'],
  [98, 'Cf', 'Califórnio', '[251]', 'actinide', 12, 10, [2,8,18,32,28,8,2], '#6ee7b7'],
  [99, 'Es', 'Einstênio', '[252]', 'actinide', 13, 10, [2,8,18,32,29,8,2], '#a7f3d0'],
  [100, 'Fm', 'Férmio', '[257]', 'actinide', 14, 10, [2,8,18,32,30,8,2], '#d1fae5'],
  [101, 'Md', 'Mendelévio', '[258]', 'actinide', 15, 10, [2,8,18,32,31,8,2], '#ecfdf5'],
  [102, 'No', 'Nobélio', '[259]', 'actinide', 16, 10, [2,8,18,32,32,8,2], '#a7f3d0'],
  [103, 'Lr', 'Laurêncio', '[266]', 'actinide', 17, 10, [2,8,18,32,32,8,3], '#6ee7b7'],
  [104, 'Rf', 'Rutherfórdio', '[267]', 'transition', 4, 7, [2,8,18,32,32,10,2], '#4f46e5'],
  [105, 'Db', 'Dúbnio', '[268]', 'transition', 5, 7, [2,8,18,32,32,11,2], '#4338ca'],
  [106, 'Sg', 'Seabórgio', '[269]', 'transition', 6, 7, [2,8,18,32,32,12,2], '#3730a3'],
  [107, 'Bh', 'Bório', '[270]', 'transition', 7, 7, [2,8,18,32,32,13,2], '#312e81'],
  [108, 'Hs', 'Hássio', '[269]', 'transition', 8, 7, [2,8,18,32,32,14,2], '#1e1b4b'],
  [109, 'Mt', 'Meitnério', '[278]', 'transition', 9, 7, [2,8,18,32,32,15,2], '#2e1065'],
  [110, 'Ds', 'Darmstádtio', '[281]', 'transition', 10, 7, [2,8,18,32,32,16,2], '#4a044e'],
  [111, 'Rg', 'Roentgênio', '[282]', 'transition', 11, 7, [2,8,18,32,32,17,2], '#701a75'],
  [112, 'Cn', 'Copernício', '[285]', 'transition', 12, 7, [2,8,18,32,32,18,2], '#86198f'],
  [113, 'Nh', 'Nihônio', '[286]', 'metal', 13, 7, [2,8,18,32,32,18,3], '#4b5563'],
  [114, 'Fl', 'Fleróvio', '[289]', 'metal', 14, 7, [2,8,18,32,32,18,4], '#374151'],
  [115, 'Mc', 'Moscóvio', '[290]', 'metal', 15, 7, [2,8,18,32,32,18,5], '#6b7280'],
  [116, 'Lv', 'Livermório', '[293]', 'metal', 16, 7, [2,8,18,32,32,18,6], '#4b5563'],
  [117, 'Ts', 'Tenessino', '[294]', 'metal', 17, 7, [2,8,18,32,32,18,7], '#581c87'], // previsto: metal pós-transição
  [118, 'Og', 'Oganessônio', '[294]', 'noble', 18, 7, [2,8,18,32,32,18,8], '#7dd3fc'],
];


  const SHELLS = ['K','L','M','N','O','P','Q'];

  /**
   * Ano de descoberta/isolamento de cada elemento (por símbolo), baseado
   * em fontes históricas primárias (Wikipedia: Timeline of Chemical
   * Element Discoveries; periodictable.com). Usado para esmaecer e
   * bloquear na Tabela Periódica os elementos ainda não descobertos no
   * ANO do modelo atômico selecionado — evita o anacronismo de, por
   * exemplo, escolher flúor (1886) no modelo de Dalton (1803) — e para
   * o campo "Conhecido desde" do painel Dados do Elemento.
   *
   * CRITÉRIO adotado: ano do ISOLAMENTO/identificação como substância
   * elementar — ex.: H = 1766 (Cavendish), e não 1671 (observação de
   * Boyle). Efeito colateral assumido: Na, K, Ca e Mg (isolados por
   * Davy em 1807–08) ficam esmaecidos no modelo de Dalton (1803),
   * embora o próprio Dalton os listasse como elementos a partir de
   * seus compostos — mantido por coerência com o critério único.
   * Elementos conhecidos desde a Antiguidade (ouro, cobre, ferro, etc.)
   * recebem ano simbólico bem anterior (ex: -3000) para sempre passar
   * no filtro de qualquer modelo.
   */
  const DISCOVERY_YEAR = {
  H:1766, He:1868, Li:1817, Be:1798, B:1808, C:-3000, N:1772, O:1771, F:1886, Ne:1898,
  Na:1807, Mg:1808, Al:1825, Si:1823, P:1669, S:-2000, Cl:1774, Ar:1894,
  K:1807, Ca:1808, Sc:1879, Ti:1791, V:1801, Cr:1797, Mn:1774, Fe:-5000, Co:1735, Ni:1751,
  Cu:-9000, Zn:1746, Ga:1875, Ge:1886, As:1250, Se:1817, Br:1825, Kr:1898,
  Rb:1861, Sr:1790, Y:1794, Zr:1789, Nb:1801, Mo:1781, Tc:1937, Ru:1844, Rh:1804, Pd:1802,
  Ag:-3000, Cd:1817, In:1863, Sn:-3500, Sb:-3000, Te:1782, I:1811, Xe:1898,
  Cs:1860, Ba:1808, La:1839, Ce:1803, Pr:1885, Nd:1841, Pm:1945, Sm:1879, Eu:1901, Gd:1880,
  Tb:1843, Dy:1886, Ho:1878, Er:1843, Tm:1879, Yb:1878, Lu:1907,
  Hf:1923, Ta:1802, W:1781, Re:1925, Os:1803, Ir:1803, Pt:1748, Au:-4000, Hg:-1500, Tl:1861,
  Pb:-7000, Bi:1753, Po:1898, At:1940, Rn:1900,
  Fr:1939, Ra:1898, Ac:1899, Th:1828, Pa:1913, U:1789,
  Np:1940, Pu:1940, Am:1944, Cm:1944, Bk:1949, Cf:1950, Es:1952, Fm:1952, Md:1955, No:1965, Lr:1961,
  Rf:1969, Db:1970, Sg:1974, Bh:1981, Hs:1984, Mt:1982, Ds:1994, Rg:1994, Cn:1996,
  Nh:2004, Fl:1999, Mc:2003, Lv:2000, Ts:2010, Og:2002,
  };

  /**
   * Ano de publicação de cada modelo atômico — define o "corte" histórico
   * usado para esmaecer/bloquear elementos "ainda não descobertos" na
   * tabela periódica principal. O modelo Quântico usa 9999 (sem corte real): a
   * mecânica quântica de Schrödinger/Madelung descreve a estrutura
   * eletrônica de QUALQUER elemento, independente de quando foi
   * descoberto experimentalmente — diferente dos demais modelos, cujo
   * ano É o ano do próprio modelo histórico sendo simulado. Por isso o
   * Quântico desbloqueia os 118 elementos da tabela atual.
   */
  const MODEL_YEAR = { dalton:1803, thomson:1904, rutherford:1911, bohr:1913, quantum:9999 };

  // ══════════════════════════════════════════════════════════════
  // SUBCAMADAS REAIS (n,l) — usadas pelo modelo Quântico para escolher
  // a FORMA correta do orbital (s=esfera, p=dumbbell, d=clover, f=multilobular)
  // por elemento, em ordem de preenchimento de Madelung (regra n+l).
  // ══════════════════════════════════════════════════════════════
  const ORBITAL_FILL_ORDER = [
    [1,0],[2,0],[2,1],[3,0],[3,1],[4,0],[3,2],[4,1],[5,0],[4,2],
    [5,1],[6,0],[4,3],[5,2],[6,1],[7,0],[5,3],[6,2],[7,1],
  ];
  const SUBSHELL_CAPACITY = { 0:2, 1:6, 2:10, 3:14 };
  const SUBSHELL_LABEL    = { 0:'s', 1:'p', 2:'d', 3:'f' };

  /**
   * Tabela empírica REAL de Thomson (1904, Philosophical Magazine,
   * Vol. 7, p. 254, "Tabela 1"): para um anel externo de n elétrons
   * ser mecanicamente estável, são necessários p elétrons internos.
   * Anéis de até 5 elétrons são estáveis isoladamente (p=0); a partir
   * de 6, elétrons adicionais no centro tornam-se necessários, e essa
   * exigência cresce rapidamente (n=40 já exige 232 elétrons internos).
   * Fonte primária: Thomson, J.J. "On the Structure of the Atom" (1904).
   */
  const THOMSON_TABLE_1904 = [
    {n:3,  p:0},  {n:5,  p:0},  {n:6,  p:1},  {n:7,  p:1},
    {n:8,  p:1},  {n:9,  p:2},  {n:10, p:3},  {n:15, p:15},
    {n:20, p:39}, {n:30, p:101},{n:40, p:232},
  ];

  // ══════════════════════════════════════════════════════════════
  // TEXTOS DESCRITIVOS DE CADA MODELO (exibidos no painel "Sobre")
  // Parágrafo único, ~500 caracteres (≈8 linhas de leitura) por
  // modelo — explicação mais simples possível, sem perder o essencial.
  // ══════════════════════════════════════════════════════════════
  const MODEL_INFO = {
    dalton:
      'Dalton (1803): o átomo é uma esfera rígida e indivisível, com tamanho ' +
      'e cor próprios de cada elemento. Neste modo há apenas colisões ' +
      'perfeitamente elásticas — na teoria de Dalton, átomos não se ' +
      'transformam: combinam-se em proporções fixas para formar compostos.',
    thomson:
      'Thomson (1904): elétrons negativos ficam imersos numa esfera de carga ' +
      'positiva contínua, como passas num pudim. Thomson provou que a ' +
      'posição estável dos elétrons forma anéis concêntricos, com mais ' +
      'elétrons no anel externo — ideia que ajudou a explicar a periodicidade ' +
      'dos elementos.',
    rutherford:
      'Rutherford (1911) bombardeou ouro com partículas alfa e descobriu que ' +
      'o átomo tem um núcleo central denso e positivo, cercado por um ' +
      'enorme espaço vazio — a eletrosfera, onde os elétrons se movem. Esse ' +
      'experimento também levou à descoberta do próton, em 1919.',
    bohr:
      'Bohr (1913): os elétrons orbitam o núcleo em camadas de energia ' +
      'fixa. Ao saltar entre camadas, absorvem ou emitem luz de cor exata, ' +
      'calculada pela fórmula de Rydberg-Ritz. Clique numa órbita no canvas ' +
      'para excitar um elétron e ver isso acontecer.',
    quantum:
      'Modelo Quântico (Schrödinger, 1926): o elétron não tem uma órbita ' +
      'fixa, só uma região de probabilidade — a nuvem eletrônica. Cada tipo ' +
      'de subcamada tem uma forma própria (esfera, dois lóbulos, quatro ' +
      'lóbulos ou mais), que aparece conforme o elemento selecionado.',
  };

  // ══════════════════════════════════════════════════════════════
  // EXPOSIÇÃO DO MÓDULO — única superfície pública deste arquivo.
  // Congelado (Object.freeze) para sinalizar que são dados estáticos,
  // não devem ser mutados em runtime pelo resto da aplicação.
  // ══════════════════════════════════════════════════════════════
  global.SIMA_DATA = Object.freeze({
    PHYS,
    ELEMENTS,
    SHELLS,
    DISCOVERY_YEAR,
    MODEL_YEAR,
    ORBITAL_FILL_ORDER,
    SUBSHELL_CAPACITY,
    SUBSHELL_LABEL,
    THOMSON_TABLE_1904,
    MODEL_INFO,
  });

})(window);
