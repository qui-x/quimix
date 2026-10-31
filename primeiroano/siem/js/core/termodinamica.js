/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (física pura — sem tocar em DOM/canvas)
   ARQUIVO: termodinamica.js
   ───────────────────────────────────────────────────────────────
   Deslocamento do ponto de fusão/ebulição com a pressão e a
   determinação do estado físico (sólido/líquido/gás) resultante,
   incluindo os casos especiais de ponto triplo (abaixo dele não há
   líquido) e ponto supercrítico (acima do ponto crítico).
     boilingPointAtPressure() usa a equação de Clausius-Clapeyron
       (forma integrada, com R_GAS = 8.314 J/mol·K).
     meltingPointAtPressure() é linear, com sinal invertido para
       substâncias de densidade anômala (como a água).
   Depende de: nada.
   Usado por: js/simulation/simulation-fisica.js,
              js/app/app-controles.js, js/app/app-dados-medidas.js,
              js/phase-diagram/*.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ====================================================================
   3. TERMODINÂMICA
==================================================================== */
const R_GAS = 8.314;

function boilingPointAtPressure(entry, P_atm) {
  const T0 = entry.Tb + 273.15;
  const dHvap_J = entry.dHvap * 1000;
  if (P_atm <= 0.0001) P_atm = 0.0001;
  const invT = 1/T0 - (R_GAS/dHvap_J) * Math.log(P_atm / 1.0);
  return (1/invT) - 273.15;
}

function meltingPointAtPressure(entry, P_atm) {
  const dP = P_atm - 1.0;
  if (entry.anomalyDensity) return entry.Tf - 0.0074 * dP;
  return entry.Tf + 0.02 * dP;
}

function determineState(entry, T_C, P_atm) {
  const canHaveLiquid = P_atm > entry.Pt;
  let Tf_eff, Tb_eff;

  if (!canHaveLiquid) {
    Tf_eff = entry.Tt;
    const state = T_C < Tf_eff ? 'solid' : 'gas';
    return { state, canHaveLiquid, Tf_eff, Tb_eff: Tf_eff };
  }

  Tf_eff = meltingPointAtPressure(entry, P_atm);
  Tb_eff = boilingPointAtPressure(entry, P_atm);

  if (P_atm > entry.Pc && T_C > entry.Tc) {
    return { state:'gas', canHaveLiquid, Tf_eff, Tb_eff, supercritical:true };
  }
  let state;
  if (T_C < Tf_eff) state='solid';
  else if (T_C < Tb_eff) state='liquid';
  else state='gas';
  return { state, canHaveLiquid, Tf_eff, Tb_eff };
}

/* ====================================================================
   ESTADO DE REFERÊNCIA (25 °C, 1 atm — condição padrão IUPAC)
   ---------------------------------------------------------------------
   Classifica uma substância do catálogo pelo estado físico que ela
   assume na condição de referência, usando os próprios Tf/Tb do
   catálogo — mesma regra e mesma condição de referência já usadas em
   determineState() acima (que resolve o estado em QUALQUER T/P), só
   que fixando T=25°C e P=1atm para dar sempre a mesma resposta,
   independente dos controles de temperatura/pressão no momento.
   Usada pelos módulos Gases/Líquidos/Sólidos da sidebar esquerda (ver
   ui/painel-modulos.js) para filtrar a lista de substâncias por
   estado físico, sem precisar simular nada.
==================================================================== */
function estadoPadrao(entry) {
  if (!entry) return null;
  if (entry.Tf > 25) return 'solid';
  if (entry.Tb <= 25) return 'gas';
  return 'liquid';
}

