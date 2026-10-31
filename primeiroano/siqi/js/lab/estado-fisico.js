/* ═══════════════════════════════════════════════════════════════
   CAMADA: LABORATÓRIO (química)
   ARQUIVO: estado-fisico.js
   ───────────────────────────────────────────────────────────────
   Determina o estado físico (sólido/líquido/gasoso/aquoso) de uma
   substância a 25°C a partir de seus pontos de fusão/ebulição.
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Estado físico de compostos comuns (25 °C, 1 atm) ──────── */
var ESTADO_FISICO = {
  /* Gases */
  'H₂':'(g)','H2':'(g)','O₂':'(g)','O2':'(g)',
  'CO₂':'(g)','CO2':'(g)','SO₃':'(g)','SO3':'(g)',
  'HCl':'(g)','NH₃':'(g)','NH3':'(g)',
  'NO':'(g)','NO₂':'(g)','SO₂':'(g)',
  /* Líquidos */
  'H₂O':'(l)','H2O':'(l)',
  'H₂SO₄':'(l)','H2SO4':'(l)',
  'HNO₃':'(l)','HNO3':'(l)',
  /* Sólidos */
  'NaOH':'(s)','CaO':'(s)','Ca(OH)₂':'(s)','Ca(OH)2':'(s)',
  'CaCO₃':'(s)','CaCO3':'(s)',
  'NaCl':'(s)','ZnCl₂':'(s)','ZnCl2':'(s)',
  'AgCl':'(s)','AgBr':'(s)',
  'CaSO₄':'(s)','CaSO4':'(s)',
  'Fe₂O₃':'(s)','Fe2O3':'(s)',
  'Al₂O₃':'(s)','Al2O3':'(s)',
  'Fe':'(s)','Al':'(s)','Zn':'(s)','Cu':'(s)',
  'NH₄Cl':'(s)','NH4Cl':'(s)',
  'CuSO₄':'(s)','CuSO4':'(s)',
  'AgNO₃':'(s)','AgNO3':'(s)',
  'FeCl₂':'(s)','FeCl2':'(s)',
  'FeCl₃':'(s)','FeCl3':'(s)',
  'ZnO':'(s)','ZnSO₄':'(s)','ZnSO4':'(s)',
  'KNO₃':'(s)','KNO3':'(s)','KOH':'(s)',
  'Na₂SO₄':'(s)','Na2SO4':'(s)',
  'Na₂CO₃':'(s)','Na2CO3':'(s)',
  'NaHCO₃':'(s)','NaHCO3':'(s)',
  'Cu(OH)₂':'(s)','Fe(OH)₃':'(s)',
  'CaCl₂':'(s)','CaCl2':'(s)',
  'Fe₂(SO₄)₃':'(s)',
  /* Aquosos — em solução */
  'H₂CO₃':'(aq)','H2CO3':'(aq)',
};

function estadoFisico(f){
  /* Verificar diretamente, depois sem subscripts */
  if(ESTADO_FISICO[f]) return ESTADO_FISICO[f];
  var k=normFormula(f);
  if(ESTADO_FISICO[k]) return ESTADO_FISICO[k];
  /* Padrão por funcao */
  var fn=funcaoMol(f);
  if(fn==='gas') return '(g)';
  if(fn==='elem') return '(s)';
  return '(aq)'; /* sais e ácidos em solução por padrão */
}

