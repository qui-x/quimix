/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO
   ARQUIVO: cores-atomo.js
   ───────────────────────────────────────────────────────────────
   Cor do núcleo/bloco de um elemento nos diagramas (Bohr, Lewis,
   nuvem) e a cor do átomo central, conforme sua categoria química.
   Depende de: core/cores-estado.js.
   Usado por: render/bohr.js, render/lewis.js,
              render/nuvem-eletronica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function corBlocoDe(Z, ccHex){
  return corAtomo(BLOCO[Z] || '', ccHex);
}

function corAtomo(bloco, ccHex){
  const varMap = {S:'--orb-s', P:'--orb-p', D:'--orb-d', F:'--orb-f'};
  const v = varMap[bloco];
  if(v){
    const raw = resolverCorCSS(v);
    return rgbToHex(raw);
  }
  return ccHex || '#888888';
}

