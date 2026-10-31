/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: layout-tabela-periodica.js
   ───────────────────────────────────────────────────────────────
   Posição (grupo, período) de cada célula na tabela periódica
   principal (PT_GRID), o bloco f — lantanídeos/actinídeos — que fica
   em linhas separadas (FBLOCK), e o rótulo/cor de cada categoria
   química (CATEGORY_INFO).
   Depende de: nada. Usado por: js/ui/tabela-periodica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const PT_GRID = [
  ['H',1,1],['He',18,1],
  ['Li',1,2],['Be',2,2],['B',13,2],['C',14,2],['N',15,2],['O',16,2],['F',17,2],['Ne',18,2],
  ['Na',1,3],['Mg',2,3],['Al',13,3],['Si',14,3],['P',15,3],['S',16,3],['Cl',17,3],['Ar',18,3],
  ['K',1,4],['Ca',2,4],['Sc',3,4],['Ti',4,4],['V',5,4],['Cr',6,4],['Mn',7,4],['Fe',8,4],
  ['Co',9,4],['Ni',10,4],['Cu',11,4],['Zn',12,4],['Ga',13,4],['Ge',14,4],['As',15,4],['Se',16,4],['Br',17,4],['Kr',18,4],
  ['Rb',1,5],['Sr',2,5],['Y',3,5],['Zr',4,5],['Nb',5,5],['Mo',6,5],['Tc',7,5],['Ru',8,5],
  ['Rh',9,5],['Pd',10,5],['Ag',11,5],['Cd',12,5],['In',13,5],['Sn',14,5],['Sb',15,5],['Te',16,5],['I',17,5],['Xe',18,5],
  ['Cs',1,6],['Ba',2,6],['Hf',4,6],['Ta',5,6],['W',6,6],['Re',7,6],['Os',8,6],['Ir',9,6],
  ['Pt',10,6],['Au',11,6],['Hg',12,6],['Tl',13,6],['Pb',14,6],['Bi',15,6],['Po',16,6],['At',17,6],['Rn',18,6],
  ['Fr',1,7],['Ra',2,7],['Rf',4,7],['Db',5,7],['Sg',6,7],['Bh',7,7],['Hs',8,7],['Mt',9,7],
  ['Ds',10,7],['Rg',11,7],['Cn',12,7],['Nh',13,7],['Fl',14,7],['Mc',15,7],['Lv',16,7],['Ts',17,7],['Og',18,7],
];

/* ===================================================================
   2b. BLOCO F — Lantanídeos e Actinídeos (linhas separadas da tabela principal)
   =================================================================== */
const FBLOCK = [
  ['La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu'],
  ['Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr'],
];

/* ===================================================================
   2c. INFORMAÇÃO DE CATEGORIA — rótulo e cor de cada categoria de elemento
   =================================================================== */
const CATEGORY_INFO = {
  'alkali-metal':    {label:'Metal Alcalino',       color:'#ef4444'},
  'alkaline-earth':  {label:'Metal Alc.-Terroso',   color:'#fb923c'},
  'transition':      {label:'Metal de Transição',   color:'#60a5fa'},
  'post-transition': {label:'Metal Pós-Trans.',     color:'#94a3b8'},
  'metalloid':       {label:'Semimetal',             color:'#2dd4bf'},
  'nonmetal':        {label:'Ametal',                color:'#4ade80'},
  'noble-gas':       {label:'Gás Nobre',             color:'#7dd3fc'},
  'lanthanide':      {label:'Lantanídeo',            color:'#fbbf24'},
  'actinide':        {label:'Actinídeo',             color:'#34d399'},
};
