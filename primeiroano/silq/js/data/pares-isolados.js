/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: pares-isolados.js
   ───────────────────────────────────────────────────────────────
   Pares de elétrons isolados de cada elemento no estado livre —
   usado pela teoria VSEPR para determinar a geometria molecular.
   Depende de: nada. Usado por: js/core/vsepr.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const LONE_PAIRS_FREE = {
  // Grupo 14 (4 ligações possíveis → 0 solitários no estado ligado típico)
  C:0, Si:0, Ge:0, Sn:0, Pb:0,
  // Grupo 15 (3 ligações, 1 par solitário)
  N:1, P:1, As:1, Sb:1, Bi:1,
  // Grupo 16 (2 ligações, 2 pares solitários)
  O:2, S:2, Se:2, Te:2, Po:2,
  // Grupo 17 (1 ligação, 3 pares solitários)
  F:3, Cl:3, Br:3, I:3, At:3,
  // Grupo 1 e 2 (metais) → tratados como ligação iônica, não VSEPR
  // Hidrogênio: terminal, nunca central
  H:0,
};
