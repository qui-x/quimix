/* ================================================================
   CAMADA: DADOS — dados-desestruturados.js
   ================================================================
   Pega os dados que vêm de dadostermoquimica.js (window.SITQ_DATA)
   e os expõe como constantes soltas (PHYS, SUBSTANCIAS, etc.) —
   FORA do namespace SITQ, de propósito, seguindo a mesma regra da
   camada de dados dos outros simuladores: dado nunca entra no
   namespace, só comportamento (funções/classes) entra.

   Usado por quase todo o resto do simulador (física, renderização,
   aplicação) — precisa carregar logo depois de dadostermoquimica.js
   e antes de qualquer outro arquivo.
   ================================================================ */
'use strict';

const {
  PHYS, SUBSTANCIAS, CURVA_SUBSTANCIAS, REACOES_PERFIL, CATALISADOR_FATOR, REACOES_GIBBS,
  HESS, HESS_MULTS, ENERGIA_LIGACAO, REACOES_LIGACAO,
  ATOMO_3D, MOLECULAS_3D, MODO_NOME, MODO_INFO, FORMULAS, CURIOSIDADES, MODO_EXTRA,
} = window.SITQ_DATA;
