/* ================================================================
   SIEL — dadoseletroquimica.js | dados fixos de Eletroquímica
   ================================================================
   FONTES: potenciais padrão de redução (25 °C, 1 mol/L, 1 atm) —
   CRC Handbook (97ª ed.); Atkins & de Paula. Massas molares —
   IUPAC/CRC. F = 96.485 C/mol arredondado a 96.500 (praxe do EM).
   Filas de descarga — Usberco & Salvador; Feltre.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIEL',
  TITLE: 'Simulador Interativo de Eletroquímica',

  /* ── Metais e seus potenciais padrão de redução (V), 25 °C, 1 mol/L ──
     Ordem crescente de E° (mais redutor → mais oxidante), usada pela
     navegação por setas do modo "tabela".
     FONTES conferidas nesta expansão (ver changelog no fim do arquivo):
     - Categoria A (Li, K, Ca, Na, Cr, Sn): CRC Handbook / Chemistry LibreTexts
     - Categoria B (Rb, Cs, Sr, Ba, Mn, Cd, Co, Bi, Hg, Pt): Chemistry LibreTexts
       "P2: Standard Reduction Potentials by Value" (D. Harvey, DePauw Univ.),
       compilando Bard/Parsons/Jordan 1985 e Milazzo/Caroli/Sharma 1978 —
       https://chem.libretexts.org/Ancillary_Materials/Reference/Reference_Tables/Electrochemistry_Tables/P2:_Standard_Reduction_Potentials_by_Value */
  METAIS: [
    { id: 'li', nome: 'Lítio',     simb: 'Li', ion: 'Li⁺',  n: 1, e0: -3.04, cor: '#cbd5e1', sol: null },
    { id: 'rb', nome: 'Rubídio',   simb: 'Rb', ion: 'Rb⁺',  n: 1, e0: -2.98, cor: '#e2e8f0', sol: null },
    { id: 'k',  nome: 'Potássio',  simb: 'K',  ion: 'K⁺',   n: 1, e0: -2.93, cor: '#e5e7eb', sol: null },
    { id: 'cs', nome: 'Césio',     simb: 'Cs', ion: 'Cs⁺',  n: 1, e0: -2.92, cor: '#fde68a', sol: null },
    { id: 'ba', nome: 'Bário',     simb: 'Ba', ion: 'Ba²⁺', n: 2, e0: -2.91, cor: '#e5e7eb', sol: null },
    { id: 'sr', nome: 'Estrôncio', simb: 'Sr', ion: 'Sr²⁺', n: 2, e0: -2.89, cor: '#e5e7eb', sol: null },
    { id: 'ca', nome: 'Cálcio',    simb: 'Ca', ion: 'Ca²⁺', n: 2, e0: -2.87, cor: '#d6d3d1', sol: null },
    { id: 'na', nome: 'Sódio',     simb: 'Na', ion: 'Na⁺',  n: 1, e0: -2.71, cor: '#e2e8f0', sol: null },
    { id: 'mg', nome: 'Magnésio',  simb: 'Mg', ion: 'Mg²⁺', n: 2, e0: -2.37, cor: '#cbd5e1', sol: null },
    { id: 'al', nome: 'Alumínio',  simb: 'Al', ion: 'Al³⁺', n: 3, e0: -1.66, cor: '#e2e8f0', sol: null },
    { id: 'mn', nome: 'Manganês',  simb: 'Mn', ion: 'Mn²⁺', n: 2, e0: -1.18, cor: '#9ca3af', sol: '#fbcfe8' },
    { id: 'zn', nome: 'Zinco',     simb: 'Zn', ion: 'Zn²⁺', n: 2, e0: -0.76, cor: '#94a3b8', sol: null },
    { id: 'cr', nome: 'Cromo',     simb: 'Cr', ion: 'Cr³⁺', n: 3, e0: -0.74, cor: '#93c5fd', sol: '#86efac' },
    { id: 'ga', nome: 'Gálio',     simb: 'Ga', ion: 'Ga³⁺', n: 3, e0: -0.53, cor: '#dbeafe', sol: null },
    { id: 'fe', nome: 'Ferro',     simb: 'Fe', ion: 'Fe²⁺', n: 2, e0: -0.44, cor: '#78716c', sol: '#86a17a' },
    { id: 'cd', nome: 'Cádmio',    simb: 'Cd', ion: 'Cd²⁺', n: 2, e0: -0.40, cor: '#cbd5e1', sol: null },
    { id: 'in', nome: 'Índio',     simb: 'In', ion: 'In³⁺', n: 3, e0: -0.34, cor: '#e5e7eb', sol: null },
    { id: 'co', nome: 'Cobalto',   simb: 'Co', ion: 'Co²⁺', n: 2, e0: -0.28, cor: '#94a3b8', sol: '#f9a8d4' },
    { id: 'ni', nome: 'Níquel',    simb: 'Ni', ion: 'Ni²⁺', n: 2, e0: -0.25, cor: '#a8a29e', sol: '#5fa06a' },
    { id: 'sn', nome: 'Estanho',   simb: 'Sn', ion: 'Sn²⁺', n: 2, e0: -0.14, cor: '#cbd5e1', sol: null },
    { id: 'pb', nome: 'Chumbo',    simb: 'Pb', ion: 'Pb²⁺', n: 2, e0: -0.13, cor: '#9ca3af', sol: null },
    { id: 'h2', nome: 'Hidrogênio', simb: 'H₂', ion: 'H⁺',  n: 2, e0: 0.00,  cor: '#e5e7eb', sol: null, ref: true },
    { id: 'bi', nome: 'Bismuto',   simb: 'Bi', ion: 'Bi³⁺', n: 3, e0: 0.32,  cor: '#f0b8a4', sol: null },
    { id: 'cu', nome: 'Cobre',     simb: 'Cu', ion: 'Cu²⁺', n: 2, e0: 0.34,  cor: '#c2703a', sol: '#2f7fd6' },
    { id: 'ag', nome: 'Prata',     simb: 'Ag', ion: 'Ag⁺',  n: 1, e0: 0.80,  cor: '#d4d4d8', sol: null },
    { id: 'hg', nome: 'Mercúrio',  simb: 'Hg', ion: 'Hg²⁺', n: 2, e0: 0.85,  cor: '#d1d5db', sol: null },
    { id: 'pt', nome: 'Platina',   simb: 'Pt', ion: 'Pt²⁺', n: 2, e0: 1.20,  cor: '#e5e7eb', sol: null },
    { id: 'au', nome: 'Ouro',      simb: 'Au', ion: 'Au³⁺', n: 3, e0: 1.50,  cor: '#eab308', sol: null },
  ],

  F: 96500,

  /* ── Eletrólise ígnea (sal fundido) ── */
  /* ── Eletrólise ígnea: sais fundidos ──
     Fontes conferidas nesta expansão (3 → 14 sais):
     - Pontos de fusão: tabela CRC-compatível (DePauw Univ. Chem 130
       handout, "Melting Points for Selected Compounds") e
       moltensalt.org "Densities of Molten Elements and Representative
       Salts" — mesma linhagem de referência já usada no cabeçalho.
     - Hall-Héroult (Al₂O₃ em criolita): condições de operação (≈960 °C)
       e a semirreação anódica real (ânodo de grafite consumido, formando
       CO₂ em vez de O₂ puro) conferidas contra múltiplas fontes técnicas
       — essa é a diferença pedagógica chave desse exemplo: ao contrário
       dos outros sais, aqui o eletrodo NÃO é inerte, ele participa.
     - Todo candidato foi checado contra o ponto de fusão do PRÓPRIO
       metal formado, pra garantir que ele realmente fica líquido na
       temperatura de fusão do sal (o desenho sempre mostra uma poça
       líquida se acumulando no cátodo). Por isso NÃO entraram AgCl
       (Ag funde a 962 °C, seria sólido nos 455 °C do sal) nem ZnCl₂
       (Zn funde a 420 °C, seria sólido nos 283 °C do sal) — apesar de
       serem sais fundidos reais, dariam um desenho quimicamente errado
       aqui. CuCl₂ também ficou de fora: decompõe (2CuCl₂→2CuCl+Cl₂)
       bem antes do seu "ponto de fusão" citado, então não existe como
       um sal fundido simples e estável do jeito que os outros existem. */
  IGNEA: [
    { id: 'nacl', nome: 'NaCl fundido', cation: 'Na⁺', anion: 'Cl⁻',
      cat: 'Na(l)', an: 'Cl₂(g)', corCat: '#cbd5e1', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: '2 Na⁺ + 2 e⁻ → 2 Na(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 801 },
    { id: 'licl', nome: 'LiCl fundido', cation: 'Li⁺', anion: 'Cl⁻',
      cat: 'Li(l)', an: 'Cl₂(g)', corCat: '#dbe4ee', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: '2 Li⁺ + 2 e⁻ → 2 Li(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 605 },
    { id: 'lii', nome: 'LiI fundido', cation: 'Li⁺', anion: 'I⁻',
      cat: 'Li(l)', an: 'I₂(g)', corCat: '#dbe4ee', corAn: '#a855f7', gasAn: true, gasCat: false,
      semiCat: '2 Li⁺ + 2 e⁻ → 2 Li(l)', semiAn: '2 I⁻ → I₂ + 2 e⁻', tfusao: 449 },
    { id: 'nabr', nome: 'NaBr fundido', cation: 'Na⁺', anion: 'Br⁻',
      cat: 'Na(l)', an: 'Br₂(g)', corCat: '#cbd5e1', corAn: '#dc7633', gasAn: true, gasCat: false,
      semiCat: '2 Na⁺ + 2 e⁻ → 2 Na(l)', semiAn: '2 Br⁻ → Br₂(g) + 2 e⁻', tfusao: 747 },
    { id: 'nai', nome: 'NaI fundido', cation: 'Na⁺', anion: 'I⁻',
      cat: 'Na(l)', an: 'I₂(g)', corCat: '#cbd5e1', corAn: '#a855f7', gasAn: true, gasCat: false,
      semiCat: '2 Na⁺ + 2 e⁻ → 2 Na(l)', semiAn: '2 I⁻ → I₂ + 2 e⁻', tfusao: 661 },
    { id: 'kcl', nome: 'KCl fundido', cation: 'K⁺', anion: 'Cl⁻',
      cat: 'K(l)', an: 'Cl₂(g)', corCat: '#e2e8f0', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: '2 K⁺ + 2 e⁻ → 2 K(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 770 },
    { id: 'ki', nome: 'KI fundido', cation: 'K⁺', anion: 'I⁻',
      cat: 'K(l)', an: 'I₂(g)', corCat: '#e2e8f0', corAn: '#a855f7', gasAn: true, gasCat: false,
      semiCat: '2 K⁺ + 2 e⁻ → 2 K(l)', semiAn: '2 I⁻ → I₂ + 2 e⁻', tfusao: 681 },
    { id: 'cacl2', nome: 'CaCl₂ fundido', cation: 'Ca²⁺', anion: 'Cl⁻',
      cat: 'Ca(l)', an: 'Cl₂(g)', corCat: '#f1f5f9', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: 'Ca²⁺ + 2 e⁻ → Ca(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 772 },
    { id: 'mgcl2', nome: 'MgCl₂ fundido', cation: 'Mg²⁺', anion: 'Cl⁻',
      cat: 'Mg(l)', an: 'Cl₂(g)', corCat: '#d1d5db', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: 'Mg²⁺ + 2 e⁻ → Mg(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 714 },
    { id: 'mgbr2', nome: 'MgBr₂ fundido', cation: 'Mg²⁺', anion: 'Br⁻',
      cat: 'Mg(l)', an: 'Br₂(g)', corCat: '#d1d5db', corAn: '#dc7633', gasAn: true, gasCat: false,
      semiCat: 'Mg²⁺ + 2 e⁻ → Mg(l)', semiAn: '2 Br⁻ → Br₂(g) + 2 e⁻', tfusao: 700 },
    { id: 'srcl2', nome: 'SrCl₂ fundido', cation: 'Sr²⁺', anion: 'Cl⁻',
      cat: 'Sr(l)', an: 'Cl₂(g)', corCat: '#eef2f6', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: 'Sr²⁺ + 2 e⁻ → Sr(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 875 },
    { id: 'bacl2', nome: 'BaCl₂ fundido', cation: 'Ba²⁺', anion: 'Cl⁻',
      cat: 'Ba(l)', an: 'Cl₂(g)', corCat: '#e5e7eb', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: 'Ba²⁺ + 2 e⁻ → Ba(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 963 },
    { id: 'pbcl2', nome: 'PbCl₂ fundido', cation: 'Pb²⁺', anion: 'Cl⁻',
      cat: 'Pb(l)', an: 'Cl₂(g)', corCat: '#9ca3af', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: 'Pb²⁺ + 2 e⁻ → Pb(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 501 },
    { id: 'rbcl', nome: 'RbCl fundido', cation: 'Rb⁺', anion: 'Cl⁻',
      cat: 'Rb(l)', an: 'Cl₂(g)', corCat: '#e2e8f0', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: '2 Rb⁺ + 2 e⁻ → 2 Rb(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 718 },
    { id: 'cscl', nome: 'CsCl fundido', cation: 'Cs⁺', anion: 'Cl⁻',
      cat: 'Cs(l)', an: 'Cl₂(g)', corCat: '#fde68a', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: '2 Cs⁺ + 2 e⁻ → 2 Cs(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 645 },
    { id: 'kbr', nome: 'KBr fundido', cation: 'K⁺', anion: 'Br⁻',
      cat: 'K(l)', an: 'Br₂(g)', corCat: '#e2e8f0', corAn: '#dc7633', gasAn: true, gasCat: false,
      semiCat: '2 K⁺ + 2 e⁻ → 2 K(l)', semiAn: '2 Br⁻ → Br₂(g) + 2 e⁻', tfusao: 735 },
    { id: 'cdcl2', nome: 'CdCl₂ fundido', cation: 'Cd²⁺', anion: 'Cl⁻',
      cat: 'Cd(l)', an: 'Cl₂(g)', corCat: '#cbd5e1', corAn: '#a3e635', gasAn: true, gasCat: false,
      semiCat: 'Cd²⁺ + 2 e⁻ → Cd(l)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻', tfusao: 564 },
    { id: 'babr2', nome: 'BaBr₂ fundido', cation: 'Ba²⁺', anion: 'Br⁻',
      cat: 'Ba(l)', an: 'Br₂(g)', corCat: '#e5e7eb', corAn: '#dc7633', gasAn: true, gasCat: false,
      semiCat: 'Ba²⁺ + 2 e⁻ → Ba(l)', semiAn: '2 Br⁻ → Br₂(g) + 2 e⁻', tfusao: 857 },
    { id: 'al2o3', nome: 'Al₂O₃ em criolita fundida', cation: 'Al³⁺', anion: 'O²⁻',
      cat: 'Al(l)', an: 'CO₂(g)', corCat: '#d6dee6', corAn: '#cbd5e1', gasAn: true, gasCat: false,
      semiCat: '4 Al³⁺ + 12 e⁻ → 4 Al(l)', semiAn: '6 O²⁻ + 3 C(grafite) → 3 CO₂(g) + 12 e⁻', tfusao: 960 },
  ],

  /* ── Eletrólise aquosa ── */
  AQUOSA: [
    { id: 'nacl', nome: 'NaCl(aq)', corSol: '#bae6fd',
      cat: 'H₂(g)', an: 'Cl₂(g)', gasCat: true, gasAn: true,
      semiCat: '2 H₂O + 2 e⁻ → H₂(g) + 2 OH⁻', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻',
      resta: 'sobra NaOH em solução (soda cáustica)', corCat: '#e2e8f0', corAn: '#a3e635' },
    { id: 'cuso4', nome: 'CuSO₄(aq)', corSol: '#2f7fd6',
      cat: 'Cu(s)', an: 'O₂(g)', gasCat: false, gasAn: true,
      semiCat: 'Cu²⁺ + 2 e⁻ → Cu(s)', semiAn: '2 H₂O → O₂(g) + 4 H⁺ + 4 e⁻',
      resta: 'a cor azul desaparece à medida que o cobre deposita', corCat: '#c2703a', corAn: '#60a5fa' },
    { id: 'ki', nome: 'KI(aq)', corSol: '#fde68a',
      cat: 'H₂(g)', an: 'I₂(aq)', gasCat: true, gasAn: false,
      semiCat: '2 H₂O + 2 e⁻ → H₂(g) + 2 OH⁻', semiAn: '2 I⁻ → I₂ + 2 e⁻',
      resta: 'o iodo formado tinge a solução de castanho', corCat: '#e2e8f0', corAn: '#a855f7' },
    { id: 'na2so4', nome: 'Na₂SO₄(aq)', corSol: '#e0f2fe',
      cat: 'H₂(g)', an: 'O₂(g)', gasCat: true, gasAn: true,
      semiCat: '2 H₂O + 2 e⁻ → H₂(g) + 2 OH⁻', semiAn: '2 H₂O → O₂(g) + 4 H⁺ + 4 e⁻',
      resta: 'na prática é a eletrólise da água: 2 H₂ para 1 O₂', corCat: '#e2e8f0', corAn: '#60a5fa' },
    { id: 'agno3', nome: 'AgNO₃(aq)', corSol: '#f1f5f9',
      cat: 'Ag(s)', an: 'O₂(g)', gasCat: false, gasAn: true,
      semiCat: 'Ag⁺ + e⁻ → Ag(s)', semiAn: '2 H₂O → O₂(g) + 4 H⁺ + 4 e⁻',
      resta: 'prata metálica espelha o cátodo — base da prataria eletrolítica', corCat: '#d4d4d8', corAn: '#60a5fa' },
    { id: 'hcl', nome: 'HCl(aq)', corSol: '#fecaca',
      cat: 'H₂(g)', an: 'Cl₂(g)', gasCat: true, gasAn: true,
      semiCat: '2 H⁺ + 2 e⁻ → H₂(g)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻',
      resta: 'ambos os produtos são gasosos', corCat: '#e2e8f0', corAn: '#a3e635' },
    { id: 'znso4', nome: 'ZnSO₄(aq)', corSol: '#eff6ff',
      cat: 'Zn(s)', an: 'O₂(g)', gasCat: false, gasAn: true,
      semiCat: 'Zn²⁺ + 2 e⁻ → Zn(s)', semiAn: '2 H₂O → O₂(g) + 4 H⁺ + 4 e⁻',
      resta: 'o zinco deposita por SOBRETENSÃO do H₂ no eletrodo — apesar do E°(Zn²⁺/Zn) ser menor que o da água; é a base da galvanização eletrolítica industrial',
      corCat: '#94a3b8', corAn: '#60a5fa' },
    { id: 'niso4', nome: 'NiSO₄(aq)', corSol: '#86efac',
      cat: 'Ni(s)', an: 'O₂(g)', gasCat: false, gasAn: true,
      semiCat: 'Ni²⁺ + 2 e⁻ → Ni(s)', semiAn: '2 H₂O → O₂(g) + 4 H⁺ + 4 e⁻',
      resta: 'mesma exceção do zinco (sobretensão): é a niquelação — peças cromadas levam uma camada de níquel por baixo do cromo',
      corCat: '#a8a29e', corAn: '#60a5fa' },
    { id: 'sncl2', nome: 'SnCl₂(aq)', corSol: '#f1f5f9',
      cat: 'Sn(s)', an: 'Cl₂(g)', gasCat: false, gasAn: true,
      semiCat: 'Sn²⁺ + 2 e⁻ → Sn(s)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻',
      resta: 'o estanho deposita com folga — seu E° já é bem próximo do hidrogênio; é a base da estanhagem (a lata de conserva é aço folheado a estanho)',
      corCat: '#cbd5e1', corAn: '#a3e635' },
    { id: 'kbr', nome: 'KBr(aq)', corSol: '#dbeafe',
      cat: 'H₂(g)', an: 'Br₂(g)', gasCat: true, gasAn: true,
      semiCat: '2 H₂O + 2 e⁻ → H₂(g) + 2 OH⁻', semiAn: '2 Br⁻ → Br₂(g) + 2 e⁻',
      resta: 'mesmo padrão do NaCl(aq), só que com bromo: sobra KOH em solução', corCat: '#e2e8f0', corAn: '#dc7633' },
    { id: 'cucl2', nome: 'CuCl₂(aq)', corSol: '#2f7fd6',
      cat: 'Cu(s)', an: 'Cl₂(g)', gasCat: false, gasAn: true,
      semiCat: 'Cu²⁺ + 2 e⁻ → Cu(s)', semiAn: '2 Cl⁻ → Cl₂(g) + 2 e⁻',
      resta: 'aqui os DOIS íons do próprio sal descarregam — nem o cátion nem o ânion perdem pra água, diferente do CuSO₄(aq) (só o cátion) ou do NaCl(aq) (só o ânion)',
      corCat: '#c2703a', corAn: '#a3e635' },
    { id: 'pbno3', nome: 'Pb(NO₃)₂(aq)', corSol: '#f1f5f9',
      cat: 'Pb(s)', an: 'O₂(g)', gasCat: false, gasAn: true,
      semiCat: 'Pb²⁺ + 2 e⁻ → Pb(s)', semiAn: '2 H₂O → O₂(g) + 4 H⁺ + 4 e⁻',
      resta: 'mesma exceção por sobretensão do zinco e do níquel — é a base da clássica "árvore de chumbo"',
      corCat: '#9ca3af', corAn: '#60a5fa' },
    { id: 'feso4', nome: 'FeSO₄(aq)', corSol: '#d9f99d',
      cat: 'Fe(s)', an: 'O₂(g)', gasCat: false, gasAn: true,
      semiCat: 'Fe²⁺ + 2 e⁻ → Fe(s)', semiAn: '2 H₂O → O₂(g) + 4 H⁺ + 4 e⁻',
      resta: 'mesma família da sobretensão, mas o E° do ferro (−0,44 V) já é bem menos negativo que o do zinco — precisa de "menos ajuda" cinética pra descarregar',
      corCat: '#94a3b8', corAn: '#60a5fa' },
    { id: 'mgso4', nome: 'MgSO₄(aq)', corSol: '#f1f5f9',
      cat: 'H₂(g)', an: 'O₂(g)', gasCat: true, gasAn: true,
      semiCat: '2 H₂O + 2 e⁻ → H₂(g) + 2 OH⁻', semiAn: '2 H₂O → O₂(g) + 4 H⁺ + 4 e⁻',
      resta: 'aqui a sobretensão NÃO é suficiente: o E°(Mg²⁺/Mg) = −2,37 V é negativo demais até pra essa exceção — mostra que ela tem limite. Resultado igual ao Na₂SO₄(aq): só água se decompõe',
      corCat: '#e2e8f0', corAn: '#60a5fa' },
    { id: 'naoh', nome: 'NaOH(aq)', corSol: '#f8fafc',
      cat: 'H₂(g)', an: 'O₂(g)', gasCat: true, gasAn: true,
      semiCat: '2 H₂O + 2 e⁻ → H₂(g) + 2 OH⁻', semiAn: '4 OH⁻ → O₂(g) + 2 H₂O + 4 e⁻',
      resta: 'diferença sutil do Na₂SO₄(aq): aqui o OH⁻ já existe pronto no eletrólito e se oxida direto no ânodo, sem precisar "esperar" a água se ionizar primeiro',
      corCat: '#e2e8f0', corAn: '#60a5fa' },
  ],

  /* ── Filas de descarga (prioridade de descarregamento) ── */
  /* Fila de cátions ordenada pelo próprio E° do array METAIS (26 metais).
     A faixa do meio (Pb²⁺ a Zn²⁺) é a exceção por sobretensão do H₂:
     E° mais negativo que a água, mas descarrega mesmo assim na prática
     — ver ZnSO₄(aq), NiSO₄(aq) e SnCl₂(aq) acima. */
  FILA_CATIONS: 'Au³⁺ > Pt²⁺ > Hg²⁺ > Ag⁺ > Cu²⁺ > Bi³⁺ > H⁺ (descarregam com facilidade)  ‖  Pb²⁺, Sn²⁺, Ni²⁺, Co²⁺, Cd²⁺, Fe²⁺, Cr³⁺, Zn²⁺ (descarregam na prática por SOBRETENSÃO do H₂, apesar do E° menor que o do H⁺)  ‖  Mn²⁺ e os metais alcalinos/alcalinoterrosos — Al³⁺, Mg²⁺, Na⁺, Ca²⁺, K⁺ e demais (nunca descarregam em meio aquoso)',
  FILA_ANIONS:  'I⁻ > Br⁻ > Cl⁻  ‖  OH⁻  ‖  F⁻, NO₃⁻, SO₄²⁻ (não descarregam em meio aquoso)',

  /* ── Metais da galvanoplastia (Lei de Faraday) ── */
  /* Espelha a ordem (por E°) e as cores do array METAIS — mesma fonte
     de massas molares padrão da tabela periódica. Qualquer metal que
     tem par redox na Tabela de Potenciais agora também pode ser
     analisado aqui pelas Leis de Faraday (exceto H₂, que é gás de
     referência, não eletrodo sólido). */
  GALVANO: [
    { id: 'li', nome: 'Lítio (Li)',     M: 6.94,   n: 1, cor: '#cbd5e1' },
    { id: 'rb', nome: 'Rubídio (Rb)',   M: 85.47,  n: 1, cor: '#e2e8f0' },
    { id: 'k',  nome: 'Potássio (K)',   M: 39.10,  n: 1, cor: '#e5e7eb' },
    { id: 'cs', nome: 'Césio (Cs)',     M: 132.91, n: 1, cor: '#fde68a' },
    { id: 'ba', nome: 'Bário (Ba)',     M: 137.33, n: 2, cor: '#e5e7eb' },
    { id: 'sr', nome: 'Estrôncio (Sr)', M: 87.62,  n: 2, cor: '#e5e7eb' },
    { id: 'ca', nome: 'Cálcio (Ca)',    M: 40.08,  n: 2, cor: '#d6d3d1' },
    { id: 'na', nome: 'Sódio (Na)',     M: 22.99,  n: 1, cor: '#e2e8f0' },
    { id: 'mg', nome: 'Magnésio (Mg)',  M: 24.31,  n: 2, cor: '#cbd5e1' },
    { id: 'al', nome: 'Alumínio (Al)',  M: 26.98,  n: 3, cor: '#e2e8f0' },
    { id: 'mn', nome: 'Manganês (Mn)',  M: 54.94,  n: 2, cor: '#9ca3af' },
    { id: 'zn', nome: 'Zinco (Zn)',     M: 65.38,  n: 2, cor: '#94a3b8' },
    { id: 'cr', nome: 'Cromo (Cr)',     M: 52.00,  n: 3, cor: '#93c5fd' },
    { id: 'ga', nome: 'Gálio (Ga)',     M: 69.72,  n: 3, cor: '#dbeafe' },
    { id: 'fe', nome: 'Ferro (Fe)',     M: 55.85,  n: 2, cor: '#78716c' },
    { id: 'cd', nome: 'Cádmio (Cd)',    M: 112.41, n: 2, cor: '#f5d0c5' },
    { id: 'in', nome: 'Índio (In)',     M: 114.82, n: 3, cor: '#e5e7eb' },
    { id: 'co', nome: 'Cobalto (Co)',   M: 58.93,  n: 2, cor: '#94a3b8' },
    { id: 'ni', nome: 'Níquel (Ni)',    M: 58.69,  n: 2, cor: '#a8a29e' },
    { id: 'sn', nome: 'Estanho (Sn)',   M: 118.71, n: 2, cor: '#cbd5e1' },
    { id: 'pb', nome: 'Chumbo (Pb)',    M: 207.2,  n: 2, cor: '#9ca3af' },
    { id: 'bi', nome: 'Bismuto (Bi)',   M: 208.98, n: 3, cor: '#f0b8a4' },
    { id: 'cu', nome: 'Cobre (Cu)',     M: 63.55,  n: 2, cor: '#c2703a' },
    { id: 'ag', nome: 'Prata (Ag)',     M: 107.87, n: 1, cor: '#d4d4d8' },
    { id: 'hg', nome: 'Mercúrio (Hg)',  M: 200.59, n: 2, cor: '#d1d5db' },
    { id: 'pt', nome: 'Platina (Pt)',   M: 195.08, n: 2, cor: '#e5e7eb' },
    { id: 'au', nome: 'Ouro (Au)',      M: 196.97, n: 3, cor: '#eab308' },
  ],

  /* ── ids de modo atendidos pela SEGUNDA mecânica (fachada Mech) ── */
  MECH_B: ['ignea', 'aquosa', 'faraday'],

  MODES: [
    {
      id: 'montar', sigla: 'ΔE°', nome: 'Montar a Pilha', sub: 'Duas meias-células',
      hint: 'Escolha dois eletrodos, descubra qual sofre oxidação e qual sofre redução e calcule a diferença de potencial.',
      info: 'Numa pilha, o metal de MENOR potencial de redução sofre oxidação e é o ânodo (polo negativo); o de maior potencial sofre redução e é o cátodo (polo positivo). Os elétrons saem do ânodo pelo fio; a ponte salina fecha o circuito.',
      formula: 'ΔE° = E°(cátodo) − E°(ânodo)  ·  ΔE = ΔE° − (0,0592/n)·log Q',
      formulaNote: 'ΔE° positivo indica processo espontâneo em condição padrão (1 mol/L). Ajuste as concentrações e veja a equação de Nernst deslocar o ΔE real. Notação: ânodo(s) | ânodoⁿ⁺ ‖ cátodoᵐ⁺ | cátodo(s).',
      hintCanvas: 'Enter/Espaço anuncia a pilha montada',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M 22 14 L 22 10" /><rect x="2" y="6" width="16" height="12" rx="2" /></svg>',
      def: 'O metal de menor potencial de redução oxida (ânodo, polo −); o de maior potencial reduz (cátodo, polo +). Fora da concentração padrão (1 mol/L), a equação de Nernst corrige o ΔE°.',
      fatos: [
        { l: 'Fórmula padrão', v: 'ΔE° = E°cátodo − E°ânodo' },
        { l: 'Nernst (25 °C)', v: 'ΔE = ΔE° − (0,0592/n)·log Q' },
        { l: 'Ânodo',    v: 'menor E° (oxida)' },
        { l: 'Cátodo',   v: 'maior E° (reduz)' },
      ],
      canvasInteracao: 'Escolha dois eletrodos e veja qual oxida (ânodo) e qual reduz (cátodo), com o ΔE° calculado.',
      recomendados: ['Zinco', 'Cobre', 'Magnésio'],
      overlay: 'Pilha', panels: ['panel-montar'], primary: 'pilha-status',
    },
    {
      id: 'espontaneidade', sigla: 'reage?', nome: 'Espontaneidade', sub: 'Fita metálica na solução',
      hint: 'Mergulhe uma fita de metal numa solução de sal de outro metal e descubra se a reação de deslocamento acontece.',
      info: 'Um metal desloca da solução outro metal MENOS reativo — ou seja, de maior potencial de redução. O metal da fita é o agente redutor (oxida, perde elétrons); o íon da solução é o agente oxidante (reduz, ganha elétrons). Zinco mergulhado em sulfato de cobre escurece: deposita cobre metálico e a solução azul empalidece. O contrário não ocorre, porque o cobre é menos reativo que o zinco. Essa é a mesma lógica por trás da "árvore de prata" (zinco em nitrato de prata) e da cementação, técnica usada na mineração pra recuperar cobre dissolvido em água de mina usando sucata de ferro.',
      formula: 'ΔE° = E°(íon) − E°(fita) > 0 → reage',
      formulaNote: 'A fila de reatividade decorre diretamente dos potenciais padrão de redução. Quando os metais têm números de oxidação diferentes (ex.: Al³⁺ e Cu²⁺), a equação global só fecha com coeficientes — o simulador balanceia isso automaticamente pelo mínimo múltiplo comum dos elétrons trocados.',
      hintCanvas: 'Enter/Espaço mergulha a fita',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2" /><path d="M8.5 2h7" /><path d="M14.5 16h-5" /></svg>',
      def: 'Um metal desloca da solução outro metal menos reativo (maior potencial de redução) — o inverso não ocorre. Não existe ânodo/cátodo aqui (isso é terminologia de pilha); fala-se em agente redutor e agente oxidante.',
      fatos: [
        { l: 'Regra',      v: 'ΔE°=E°(íon)−E°(fita)' },
        { l: 'Reage se',   v: 'ΔE° > 0' },
        { l: 'Clássico',   v: 'Zn em AgNO₃ (árvore de prata)' },
        { l: 'Aplicação',  v: 'cementação de cobre na mineração' },
      ],
      canvasInteracao: 'Mergulhe uma fita de metal numa solução de sal de outro metal e veja se o deslocamento acontece.',
      recomendados: ['Zinco', 'Cobre', 'Prata'],
      overlay: 'Deslocamento', panels: ['panel-espont'], primary: 'mergulhar',
    },
    {
      id: 'tabela', sigla: 'E° (V)', nome: 'Tabela de Potenciais', sub: 'Régua de reatividade',
      hint: 'Percorra a régua de potenciais padrão e compare a força oxidante e redutora dos pares metálicos.',
      info: 'Quanto mais negativo o potencial de redução, maior o poder redutor do metal (mais fácil ele se oxida, perdendo elétrons). Quanto mais positivo, maior o poder oxidante do seu íon (mais fácil ele se reduz, ganhando elétrons). O eletrodo de hidrogênio, definido como 0,00 V por convenção internacional, é a referência da escala — todos os outros potenciais são medidos comparando-os a ele. É essa mesma régua que explica, de um só golpe, tanto o modo "Montar a Pilha" (quem fica no polo negativo) quanto o "Espontaneidade" (quem desloca quem).',
      formula: 'referência: 2 H⁺ + 2 e⁻ ⇌ H₂   E° = 0,00 V',
      formulaNote: 'Todos os potenciais são medidos a 25 °C, soluções 1 mol/L e gases a 1 atm (condição padrão, daí o símbolo °). Fora dessas condições, o potencial real muda — veja a equação de Nernst no modo "Montar a Pilha".',
      hintCanvas: 'Setas ↑ ↓ percorrem os metais',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></svg>',
      def: 'Quanto mais negativo o potencial, maior o poder redutor do metal; quanto mais positivo, maior o poder oxidante do íon.',
      fatos: [
        { l: 'Referência',     v: 'H⁺/H₂ = 0,00 V' },
        { l: 'Mais redutor',   v: 'Li (−3,04 V)' },
        { l: 'Mais oxidante',  v: 'Au³⁺ (+1,50 V)' },
        { l: 'Condições',      v: '25 °C, 1 mol/L' },
      ],
      canvasInteracao: 'Percorra a régua de potenciais padrão e compare a força oxidante e redutora dos pares metálicos.',
      overlay: 'Potenciais padrão', panels: ['panel-tabela'], primary: 'tab-status',
    },
    {
      id: 'ignea', sigla: 'fundido', nome: 'Eletrólise Ígnea', sub: 'Sal fundido, sem água',
      hint: 'Funda um sal, ligue a fonte e veja os cátions migrarem ao cátodo e os ânions ao ânodo.',
      info: 'Na eletrólise ígnea o sal está fundido, sem água: só existem os íons do próprio sal. Os cátions vão ao cátodo (polo negativo) e viram metal; os ânions vão ao ânodo (polo positivo) e viram não metal. É assim que se obtém sódio e alumínio metálicos na indústria.',
      formula: 'cátodo (−): redução   ·   ânodo (+): oxidação',
      formulaNote: 'Ao contrário da pilha, aqui a corrente é IMPOSTA por uma fonte externa: o processo é forçado, não espontâneo. No caso do Al₂O₃/criolita, repare que o ânodo é de grafite e é CONSUMIDO na reação (vira CO₂) — nos demais sais, os eletrodos são inertes, só conduzem a corrente.',
      hintCanvas: 'Enter/Espaço liga e desliga a fonte',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" /></svg>',
      def: 'Sem água, só existem os íons do sal fundido: cátions viram metal no cátodo, ânions viram não metal no ânodo.',
      fatos: [
        { l: 'Cátodo (−)', v: 'redução' },
        { l: 'Ânodo (+)',  v: 'oxidação' },
        { l: 'Processo',   v: 'forçado, não espontâneo' },
        { l: 'Exemplo',    v: 'Al metálico (Hall-Héroult)' },
      ],
      canvasInteracao: 'Funda um sal, ligue a fonte e veja os cátions migrarem ao cátodo e os ânions ao ânodo.',
      recomendados: ['NaCl fundido', 'CaCl₂ fundido', 'Al₂O₃ em criolita fundida'],
      overlay: 'Eletrólise ígnea', panels: ['panel-ignea', 'panel-ignea-controles'], primary: 'toggle-fonte',
    },
    {
      id: 'aquosa', sigla: 'H₂O', nome: 'Eletrólise Aquosa', sub: 'Filas de descarga',
      hint: 'Com água presente, escolha o eletrólito e descubra quais íons realmente descarregam nos eletrodos.',
      info: 'Em solução aquosa, a água compete com os íons do sal. Vale a fila de descarga: quem descarrega é a espécie com maior facilidade. Por isso NaCl(aq) produz H₂ e Cl₂ — e não sódio metálico — deixando NaOH na solução. Mas a fila tem uma exceção importante: Zn, Ni e Sn descarregam na prática mesmo tendo E° menor que o do H⁺/H₂O, por causa da SOBRETENSÃO do hidrogênio — a formação de H₂(g) tem uma barreira cinética alta demais nesses metais. É assim que funcionam a galvanização, a niquelação e a estanhagem industriais.',
      formula: 'compete: íon do sal × H₂O',
      formulaNote: 'Cátions de metais alcalinos e alcalinoterrosos não descarregam em água; ânions oxigenados como SO₄²⁻ e NO₃⁻ também não. Zn²⁺, Ni²⁺ e Sn²⁺ são a exceção: E° desfavorável, mas descarregam mesmo assim por sobretensão do H₂ — a regra do E° prevê a termodinâmica, não sempre vence a cinética.',
      hintCanvas: 'Enter/Espaço liga e desliga a fonte',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>',
      def: 'Com água presente, quem descarrega é a espécie com maior facilidade — segue a fila de descarga, não o próprio sal. Zn, Ni e Sn são exceção por sobretensão do H₂.',
      fatos: [
        { l: 'Não descarregam', v: 'alcalinos, SO₄²⁻, NO₃⁻' },
        { l: 'Exemplo',         v: 'NaCl(aq) → H₂ + Cl₂' },
        { l: 'Exceção',         v: 'Zn, Ni, Sn (sobretensão do H₂)' },
        { l: 'Eletrólitos',     v: '15 disponíveis' },
      ],
      canvasInteracao: 'Escolha o eletrólito e descubra quais íons realmente descarregam nos eletrodos, com a água competindo.',
      recomendados: ['NaCl(aq)', 'CuSO₄(aq)', 'ZnSO₄(aq)'],
      overlay: 'Eletrólise aquosa', panels: ['panel-aquosa', 'panel-aquosa-controles'], primary: 'toggle-fonte-aq',
    },
    {
      id: 'faraday', sigla: 'm = MIt/nF', nome: 'Leis de Faraday', sub: 'Galvanoplastia',
      hint: 'Ajuste corrente e tempo para calcular quanta massa de metal se deposita no cátodo durante a galvanoplastia.',
      info: 'Faraday descreveu DUAS leis, não uma. A 1ª Lei diz que a massa depositada é diretamente proporcional à carga elétrica Q = i·t que passa pelo eletrólito — dobrar o tempo ou a corrente dobra a massa. A 2ª Lei diz que, para a MESMA carga, metais diferentes depositam massas proporcionais ao seu equivalente-grama (M/n): por isso 1 mol de elétrons deposita menos zinco (n=2) que prata (n=1), mesmo a prata sendo mais leve por átomo. As duas juntas dão a fórmula combinada m = M·i·t/(n·F). Zinco e estanho aqui são os mesmos exemplos do modo Eletrólise Aquosa (galvanização e estanhagem) — lá a exceção era POR QUE eles depositam; aqui é QUANTO depositam.',
      formula: '1ª Lei: m ∝ Q = i·t     2ª Lei: m ∝ M/n (equivalente-grama)     m = M·i·t/(n·F)',
      formulaNote: 'M = massa molar (g/mol), i = corrente (A), t = tempo (s), n = elétrons por íon, F = 96.500 C/mol — a carga de 1 mol de elétrons.',
      hintCanvas: 'Enter/Espaço inicia a deposição',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z" /></svg>',
      def: '1ª Lei: massa ∝ carga elétrica (Q=i·t). 2ª Lei: pra mesma carga, massa ∝ equivalente-grama (M/n) de cada metal.',
      fatos: [
        { l: '1ª Lei',     v: 'm ∝ Q = i·t' },
        { l: '2ª Lei',     v: 'm ∝ M/n (equiv.-grama)' },
        { l: 'F',          v: '96.500 C/mol' },
        { l: 'Cientista',  v: 'Faraday, 1834' },
      ],
      canvasInteracao: 'Ajuste corrente e tempo e veja quanta massa de metal se deposita no cátodo durante a galvanoplastia.',
      recomendados: ['Prata (Ag)', 'Cromo (Cr)', 'Zinco (Zn)'],
      overlay: 'Lei de Faraday', panels: ['panel-faraday'], primary: 'depositar',
    },
  ],

  CURIOSIDADES: [
    'A pilha de Daniell (zinco e cobre) fornece 1,10 V — foi a primeira fonte de corrente contínua confiável, em 1836.',
    'O zinco protege o casco de navios como "ânodo de sacrifício": ele se oxida no lugar do ferro.',
    'Ferro galvanizado é ferro coberto de zinco; mesmo com a camada arranhada, o zinco continua protegendo.',
    'A ponte salina impede que as soluções se misturem, mas mantém a neutralidade elétrica das meias-células.',
    'Os elétrons sempre saem do ânodo e vão para o cátodo pelo fio externo — na pilha, o ânodo é o polo negativo.',
    'Uma bateria de carro de 12 V é formada por seis pilhas de chumbo-ácido de cerca de 2 V ligadas em série.',
    'O ouro não enferruja porque seu potencial de redução, +1,50 V, é altíssimo: ele quase nunca se oxida.',
    'O alumínio só ficou barato depois do processo Hall-Héroult, de 1886, que o obtém por eletrólise ígnea da alumina.',
    'Cerca de 5 % de toda a eletricidade produzida no Brasil vai para reduzir alumínio eletroliticamente.',
    'Na eletrólise, ânodo é o polo POSITIVO — o inverso da pilha, onde o ânodo é negativo. A oxidação é que continua no ânodo.',
    'Cromar um para-choque é galvanoplastia: a peça é o cátodo e recebe uma camada finíssima de cromo metálico.',
    'A eletrólise da água precisa de um eletrólito de apoio, porque água puríssima conduz muito mal a corrente.',
    'Michael Faraday enunciou suas leis da eletrólise em 1834, muito antes de o elétron ser descoberto.',
    'A soda cáustica industrial vem do processo cloro-álcali: eletrólise de salmoura que gera NaOH, Cl₂ e H₂ juntos.',
  ],
};

/* ================================================================
   CHANGELOG — expansão de METAIS (10 → 26)
   ================================================================
   Adicionados (Categoria A): Li, K, Ca, Na, Cr, Sn.
   Adicionados (Categoria B): Rb, Cs, Sr, Ba, Mn, Cd, Co, Bi, Hg, Pt.
   Fonte principal: Chemistry LibreTexts, "P2: Standard Reduction
   Potentials by Value" (D. Harvey, DePauw University), que reúne
   Bard/Parsons/Jordan (1985) e Milazzo/Caroli/Sharma (1978) — mesma
   linhagem de referência do CRC Handbook já citado no cabeçalho.

   NÃO adicionados, e por quê (para não quebrar a mecânica de METAIS,
   que pressupõe eletrodo metálico sólido mergulhável em solução):
   - Tungstênio (W): não existe um par simples Wⁿ⁺/W tabulado; os
     pares reais envolvem óxidos (WO₂/W = −0,12 V; WO₃/W = −0,09 V),
     que fogem do formato "íon simples" usado no array.
   - Semirreações não metálicas do prompt original (Cl₂/Cl⁻ = +1,36 V,
     Br₂/Br⁻ = +1,07 V, I₂/I⁻ = +0,54 V, O₂/H₂O = +1,23 V,
     MnO₄⁻/Mn²⁺ = +1,51 V, Cr₂O₇²⁻/Cr³⁺ = +1,33 V, F₂/F⁻ = +2,87 V):
     são oxidantes em solução, não metais sólidos — não têm "cor" de
     barra metálica nem depositam como sólido, então não cabem no
     mesmo array/mecânica sem reescrever boa parte de MechA e MechB.
     Ficam como sugestão para um NOVO modo futuro (ex.: "semirreações
     redox"), a discutir antes de implementar.
   ================================================================ */
