/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (ponte de dados)
   ARQUIVO: dados.js
   ───────────────────────────────────────────────────────────────
   Desestrutura window.SIMA_DATA (definido em data/dados-sima.js)
   nas mesmas constantes soltas que o resto do código usa
   diretamente (PHYS, ELEMENTS, SHELLS...). Precisa carregar logo
   depois de data/dados-sima.js e antes de qualquer outro módulo
   que use esses nomes.
   Depende de: data/dados-sima.js (window.SIMA_DATA).
   Usado por: core/fisica.js, models/*, app/tabela-periodica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════════
// DADOS ESTÁTICOS — agora vêm de dadossima.js (window.SIMA_DATA),
// carregado antes deste script. Desestruturados aqui para uso direto
// com os mesmos nomes que o resto do código já utilizava.
// ══════════════════════════════════════════════════════════════════
const {
  PHYS, ELEMENTS, SHELLS, DISCOVERY_YEAR, MODEL_YEAR,
  ORBITAL_FILL_ORDER, SUBSHELL_CAPACITY, SUBSHELL_LABEL,
  THOMSON_TABLE_1904, MODEL_INFO,
} = window.SIMA_DATA;

