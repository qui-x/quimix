/* ═══════════════════════════════════════════════════════════════
   CAMADA: ESTEQUIOMETRIA (utilitário)
   ARQUIVO: formula-utils.js
   ───────────────────────────────────────────────────────────────
   Máximo divisor comum (para simplificar coeficientes) e a
   formatação de fórmulas químicas com subscritos Unicode (H₂O em vez
   de H2O).
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   15d. UTILITÁRIOS COMPARTILHADOS DE FÓRMULA
   mdc/rotuloFormula/anunciar continuam usados pelo resto do simulador
   (analisarGrupo, atualizarCalculadora, mensagens de status etc.) — a
   tabela periódica e o gerador de reações por valência cruzada que
   viviam aqui foram removidos: a mecânica de criar reações por conta
   própria deixava a coluna poluída, então o SIE volta a trabalhar só
   com o catálogo de reações reais.
   --------------------------------------------------------------- */
function mdc(a, b) { return b === 0 ? a : mdc(b, a % b); }

const SUBSCRITOS = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };

function rotuloFormula(formula) {
  return formula.replace(/\d+/g, (m) => m.split("").map((d) => SUBSCRITOS[d]).join(""));
}

