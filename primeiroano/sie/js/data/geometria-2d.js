/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: geometria-2d.js
   ───────────────────────────────────────────────────────────────
   Conversão de comprimento de ligação (Å) para pixels na tela, e o
   cálculo de deslocamento 2D de átomos ao redor de um átomo central
   para as geometrias moleculares mais comuns (diatômica, cruz/linear,
   angular).
   Depende de: nada.
   Usado por: js/molecules/instanciar.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const PX_POR_ANGSTROM = 42;

/* ---------------------------------------------------------------
   2. GABARITOS MOLECULARES 2D — comprimentos de ligação reais (Å)
   H–H: 0.74 | O=O: 1.21 | N≡N: 1.10 | Cl–Cl: 1.99 | C–H: 1.09
   F–F: 1.42 | O–H (água): 0.96, ângulo 104.5°
   CH4 é desenhado em "cruz" (projeção 2D simplificada do tetraedro,
   convenção usual de estrutura de Lewis plana). H2O é desenhada com
   o ângulo real de ligação (geometria angular/VSEPR), já que aqui é
   usada como REAGENTE intacto (decomposição), não só como produto.
   --------------------------------------------------------------- */
function offsetsDiatomico2D(comprimentoAngstrom) {
  const len = comprimentoAngstrom * PX_POR_ANGSTROM;
  return [{ x: -len / 2, y: 0 }, { x: len / 2, y: 0 }];
}

function offsetsCruz2D(comprimentoAngstrom) {
  const len = comprimentoAngstrom * PX_POR_ANGSTROM;
  return [{ x: 0, y: 0 }, { x: len, y: 0 }, { x: -len, y: 0 }, { x: 0, y: len }, { x: 0, y: -len }];
}

function offsetsAngular2D(comprimentoAngstrom, anguloGraus) {
  const L = comprimentoAngstrom * PX_POR_ANGSTROM;
  const meio = (anguloGraus * Math.PI / 180) / 2;
  return [{ x: 0, y: 0 }, { x: L * Math.sin(meio), y: L * Math.cos(meio) }, { x: -L * Math.sin(meio), y: L * Math.cos(meio) }];
}

