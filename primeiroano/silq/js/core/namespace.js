/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (namespace compartilhado)
   ARQUIVO: namespace.js
   ───────────────────────────────────────────────────────────────
   Declara window.SILQ = {} — o objeto que substitui as ~150
   variáveis/funções que, no arquivo original, viviam soltas dentro
   de um único `document.addEventListener('DOMContentLoaded', () =>
   {...3400 linhas...})`. Ver README para a explicação completa da
   técnica (por que foi necessária e como funciona).
   ⚠ Deve ser o PRIMEIRO arquivo a carregar (depois só dos dados e
   do view3d.js, que não usam o namespace).
═══════════════════════════════════════════════════════════════ */

'use strict';

// Objeto de namespace compartilhado — ver README para a técnica completa.
window.SILQ = {};

