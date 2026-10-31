/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS (química)
   ARQUIVO: estado-fisico.js
   ───────────────────────────────────────────────────────────────
   Estado físico do elemento a 25°C (temperatura de referência fixa —
   o Mols não tem slider de temperatura) e se ele sublima (passa
   direto de sólido a gás, sem fase líquida a 1 atm).
   Depende de: dadossitp.js (FUSAO, EBULICAO).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ---- estado físico (fixo em TEMP_REF — o Mols não tem slider) ----
function estadoNaTemperaturaMols(Z, t) {
  const f = FUSAO[Z], e = EBULICAO[Z];
  if (f === null && e === null) return '?';
  if (f === null) return (e !== null && t >= e) ? 'G' : 'L';
  if (e !== null && e < f) return (t < e) ? 'S' : 'G';
  if (t < f) return 'S';
  if (e === null) return 'L';
  return (t < e) ? 'L' : 'G';
}

function sublimaMols(Z) {
  const f = FUSAO[Z], e = EBULICAO[Z];
  return f !== null && e !== null && e < f;
}

