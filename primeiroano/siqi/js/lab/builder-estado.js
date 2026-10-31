/* ═══════════════════════════════════════════════════════════════
   CAMADA: LABORATÓRIO (estado)
   ARQUIVO: builder-estado.js
   ───────────────────────────────────────────────────────────────
   O estado do "builder" de reação: candidatos disponíveis e os
   slots preenchidos até agora (reagentes escolhidos pelo aluno).
   Depende de: nada.
   Usado por: praticamente todo o js/lab/.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Candidatos por experimento ─────────────────────────────── */
var CANDIDATOS = {
  /* Exp 1: CaO + H₂O — corretos: Ca(OH)₂ */
  1: ['Ca(OH)₂','CO₂','CaCO₃','H₂','CaO','HCl','Na₂O','Ca(NO₃)₂'],
  /* Exp 2: CaCO₃ →Δ — corretos: CaO + CO₂ */
  2: ['CaO','CO₂','Ca(OH)₂','CaCl₂','O₂','H₂O','CaCO₃','Ca(NO₃)₂'],
  /* Exp 3: Zn + HCl — corretos: ZnCl₂ + H₂ */
  3: ['ZnCl₂','H₂','ZnO','NaCl','ZnSO₄','H₂O','FeCl₂','HCl'],
  /* Exp 4: HCl + NaOH — corretos: NaCl + H₂O */
  4: ['NaCl','H₂O','Na₂SO₄','Na₂CO₃','NaHCO₃','HNO₃','Ca(OH)₂','CO₂'],
};

/* ── Estado do builder (um por experimento ativo) ──────────── */
var BUILDER = {
  expId:    null,
  slots:    [],   /* Array<string|null> — fórmula em cada slot */
  coefR:    {},   /* {formula: n} — coeficientes dos reagentes */
  coefP:    [],   /* Array<n> — coeficiente de cada slot produto */
  selected: null, /* fórmula selecionada no tray */
};

