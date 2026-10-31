/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: eletronegatividade.js
   ───────────────────────────────────────────────────────────────
   Eletronegatividade de Pauling por elemento (Gillespie & Nyholm
   1957, Bent 1961, NIST) — usada para determinar o tipo de ligação
   (iônica/covalente/metálica) e a correção de ângulo VSEPR pela
   regra de Bent.
   Depende de: nada. Usado por: js/core/validacao-ligacoes.js,
              js/core/vsepr.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const EN_PAULING = {
  H:2.20, He:0, Li:0.98, Be:1.57, B:2.04, C:2.55, N:3.04, O:3.44,
  F:3.98, Ne:0, Na:0.93, Mg:1.31, Al:1.61, Si:1.90, P:2.19, S:2.58,
  Cl:3.16, Ar:0, K:0.82, Ca:1.00, Sc:1.36, Ti:1.54, V:1.63, Cr:1.66,
  Mn:1.55, Fe:1.83, Co:1.88, Ni:1.91, Cu:1.90, Zn:1.65, Ga:1.81,
  Ge:2.01, As:2.18, Se:2.55, Br:2.96, Kr:3.00, Rb:0.82, Sr:0.95,
  I:2.66, Xe:2.60, Cs:0.79, Ba:0.89, Au:2.54, Pt:2.28, Pb:2.33,
  Bi:2.02, N2:3.04,
};
