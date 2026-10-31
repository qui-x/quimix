/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (namespace compartilhado)
   ARQUIVO: namespace.js
   ORIGEM:  mesmo padrão do SILQ (js/core/namespace.js), adaptado
            de window.SILQ para window.SIFI.
   ───────────────────────────────────────────────────────────────
   Declara window.SIFI = {} — o único objeto global do projeto.
   Todo o resto do código (dados, estado, funções) mora dentro
   dele: SIFI.canvasMolecules, SIFI.addMolecule(), etc.

   POR QUE ISSO EXISTE (explicação para quem está começando):
   Em vez de espalhar "var x", "function y()" soltos pela página
   (o que causa bugs difíceis de rastrear, porque qualquer script
   pode acidentalmente sobrescrever o nome de outro), guardamos
   TUDO dentro de uma única "caixa" (SIFI). Assim:
     - SIFI.canvasMolecules  → lista de moléculas no canvas
     - SIFI.addMolecule(...) → função que adiciona uma molécula
   Isso é chamado de "namespace" e é a mesma técnica usada no SILQ.

   ⚠ Deve ser o PRIMEIRO arquivo de js/core a carregar — todos os
   outros arquivos escrevem propriedades dentro de SIFI, então o
   objeto precisa existir antes.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Objeto de namespace compartilhado — equivalente ao window.SILQ.
window.SIFI = {};
