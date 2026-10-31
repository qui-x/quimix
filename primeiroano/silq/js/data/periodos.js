/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: periodos.js
   ───────────────────────────────────────────────────────────────
   Período (1–7) de cada elemento — usado na correção VSEPR por
   tamanho do átomo central.
   Depende de: nada. Usado por: js/core/vsepr.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const PERIOD_OF = {
  H:1,He:1,
  Li:2,Be:2,B:2,C:2,N:2,O:2,F:2,Ne:2,
  Na:3,Mg:3,Al:3,Si:3,P:3,S:3,Cl:3,Ar:3,
  K:4,Ca:4,Sc:4,Ti:4,V:4,Cr:4,Mn:4,Fe:4,Co:4,Ni:4,Cu:4,Zn:4,
  Ga:4,Ge:4,As:4,Se:4,Br:4,Kr:4,
  Rb:5,Sr:5,I:5,Xe:5,
  Cs:6,Ba:6,Au:6,Pt:6,Pb:6,Bi:6,
};
