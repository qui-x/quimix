/* ═══════════════════════════════════════════════════════════════
   CAMADA: LABORATÓRIO (química)
   ARQUIVO: parser-formula.js
   ───────────────────────────────────────────────────────────────
   Metadados de exibição de uma reação (RXN_META), identifica a
   função inorgânica e o nome de uma substância pela fórmula, e o
   parser que decompõe uma fórmula química em seus átomos
   constituintes (usado para o balanço atômico).
   Depende de: core/dados-adapter.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   RXN BUILDER v2 — construtor interativo de reação
   Correções:
   · Parser universal de fórmulas (sem dicionário fixo)
   · Estado por experimento isolado (sem contaminação entre exps)
   · Slots independentes com coeficientes próprios
   · Tray correto: só produtos candidatos, nunca reagentes
   · Eq. estequiométrica atualiza a cada mudança
════════════════════════════════════════════════════════════════ */

/* ── Metadados visuais ──────────────────────────────────────── */
var RXN_META = {
  /* Elementos e compostos simples */
  'Zn':      {funcao:'elem',  nome:'Zinco metálico'},
  'H₂':      {funcao:'gas',   nome:'Gás Hidrogênio'},   'H2':{funcao:'gas',   nome:'Gás Hidrogênio'},
  'O₂':      {funcao:'elem',  nome:'Oxigênio'},          'O2':{funcao:'elem',  nome:'Oxigênio'},
  'H₂O':     {funcao:'elem',  nome:'Água'},              'H2O':{funcao:'elem', nome:'Água'},
  /* Ácidos */
  'HCl':     {funcao:'acido', nome:'Ácido Clorídrico'},
  'H₂SO₄':   {funcao:'acido', nome:'Ácido Sulfúrico'},   'H2SO4':{funcao:'acido', nome:'Ácido Sulfúrico'},
  'HNO₃':    {funcao:'acido', nome:'Ácido Nítrico'},     'HNO3':{funcao:'acido',  nome:'Ácido Nítrico'},
  'H₂CO₃':   {funcao:'acido', nome:'Ácido Carbônico'},   'H2CO3':{funcao:'acido', nome:'Ácido Carbônico'},
  /* Bases */
  'NaOH':    {funcao:'base',  nome:'Hidróxido de Sódio'},
  'Ca(OH)₂': {funcao:'base',  nome:'Hidróxido de Cálcio'}, 'Ca(OH)2':{funcao:'base', nome:'Hidróxido de Cálcio'},
  'NH₃':     {funcao:'base',  nome:'Amônia'},            'NH3':{funcao:'base',  nome:'Amônia'},
  /* Sais */
  'NaCl':    {funcao:'sal',   nome:'Cloreto de Sódio'},
  'CuSO₄':   {funcao:'sal',   nome:'Sulfato de Cobre'},  'CuSO4':{funcao:'sal', nome:'Sulfato de Cobre'},
  'AgNO₃':   {funcao:'sal',   nome:'Nitrato de Prata'},  'AgNO3':{funcao:'sal', nome:'Nitrato de Prata'},
  'ZnCl₂':   {funcao:'sal',   nome:'Cloreto de Zinco'},  'ZnCl2':{funcao:'sal', nome:'Cloreto de Zinco'},
  'Na₂SO₄':  {funcao:'sal',   nome:'Sulfato de Sódio'},  'Na2SO4':{funcao:'sal', nome:'Sulfato de Sódio'},
  'ZnO':     {funcao:'oxido', nome:'Óxido de Zinco'},
  'CaCO₃':   {funcao:'sal',   nome:'Carbonato de Cálcio'}, 'CaCO3':{funcao:'sal', nome:'Carbonato de Cálcio'},
  /* Óxidos */
  'CaO':     {funcao:'oxido', nome:'Óxido de Cálcio'},
  'CO₂':     {funcao:'oxido', nome:'Dióxido de Carbono'}, 'CO2':{funcao:'oxido', nome:'Dióxido de Carbono'},
  'Fe₂O₃':   {funcao:'oxido', nome:'Óxido de Ferro III'}, 'Fe2O3':{funcao:'oxido', nome:'Óxido de Ferro III'},
  'SO₃':     {funcao:'oxido', nome:'Trióxido de Enxofre'}, 'SO3':{funcao:'oxido', nome:'Trióxido de Enxofre'},
};

function funcaoMol(f){
  var m=RXN_META[f]; if(m) return m.funcao;
  var k=normFormula(f); var c=COMPOSTOS[k]||COMPOSTOS[f];
  return c?c.funcao:'elem';
}

function nomeMol(f){
  var m=RXN_META[f]; if(m) return m.nome;
  var k=normFormula(f); var c=COMPOSTOS[k]||COMPOSTOS[f];
  return c?c.nome:'';
}

/* Normaliza subscripts unicode → ASCII para lookup */
function normFormula(f){
  return f.replace(/[₀₁₂₃₄₅₆₇₈₉]/g,function(c){
    return '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(c)];
  });
}

/* ── Parser universal de fórmulas ───────────────────────────── */
function parsearFormula(formula){
  var f = normFormula(formula);
  var resultado = {};
  function parse(seg, mult){
    var i=0;
    while(i<seg.length){
      if(seg[i]==='('){
        var depth=1, j=i+1;
        while(j<seg.length&&depth>0){
          if(seg[j]==='(') depth++; else if(seg[j]===')') depth--; j++;
        }
        var inner=seg.slice(i+1,j-1);
        var nm=seg.slice(j).match(/^(\d+)/);
        var n=nm?parseInt(nm[1]):1;
        parse(inner, mult*n);
        i=j+(nm?nm[1].length:0);
      } else if(/[A-Z]/.test(seg[i])){
        var j2=i+1;
        while(j2<seg.length&&/[a-z]/.test(seg[j2])) j2++;
        var el=seg.slice(i,j2);
        var nm2=seg.slice(j2).match(/^(\d+)/);
        var n2=nm2?parseInt(nm2[1]):1;
        resultado[el]=(resultado[el]||0)+n2*mult;
        i=j2+(nm2?nm2[1].length:0);
      } else { i++; }
    }
  }
  parse(f,1);
  return resultado;
}

