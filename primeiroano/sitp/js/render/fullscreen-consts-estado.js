/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO (estado da tela cheia)
   ARQUIVO: fullscreen-consts-estado.js
   ───────────────────────────────────────────────────────────────
   Estado (qual elemento/vista está em tela cheia) e constantes de
   dimensionamento (margens, fatores de escala) usadas por
   render/fullscreen.js para redesenhar a vista atual em alta
   resolução.
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ===== FULLSCREEN ===== */
let _fsZ = null, _fsVista = null;

/* Orçamento de espaço do modo tela cheia, num lugar só. Antes cada
   vista tinha seus próprios números soltos (0.88/0.72 no Bohr,
   0.55/0.72 no Lewis, nada na Grade), e era por isso que uma vista
   ficava pequena e a outra estourava a tela.
   As sobras cobrem o cabeçalho, o respiro lateral e a legenda. */
const FS_MARGEM_W  = 0.90;   // fração da largura útil

const FS_MARGEM_H  = 0.74;   // fração da altura útil (desconta cabeçalho)

const FS_ESCALA_MAX = 4.0;   // teto: além disso o traço fica grosseiro

/* Escala usada ao gerar o SVG em tela cheia. NAO define o tamanho na
   tela — isso e do CSS. Define a PROPORCAO interna do desenho: espessura
   de traco e corpo de texto em relacao ao circulo. 1 mantem as mesmas
   proporcoes do desenho dentro do modal. */
const FS_ESCALA_DESENHO = 1;

const FS_ESCALA_MIN_FATOR = 0.42;  // piso da redução da 2ª passada

