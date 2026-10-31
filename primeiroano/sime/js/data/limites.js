/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS (constantes de referência — não mutam em runtime)
   ARQUIVO: limites.js
   ───────────────────────────────────────────────────────────────
   Limites físicos e valores padrão do simulador (faixas de
   temperatura/volume aceitas pelos controles, pressão/volume de
   referência a 1 atm). É o primeiro arquivo carregado: quase todo
   o resto do simulador consulta LIMITES para saber os extremos
   válidos de cada grandeza.
   Depende de: nada.
   Usado por: core/estado-simulacao.js, core/fisica.js,
              ui/render-temperatura.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

var LIMITES = {
  temperatura: { min: -273, max: 3600, padrao: 25 },  // 25°C = condição padrão IUPAC
  volume:      { min: 20,   max: 100,  padrao: 60  },
  pressaoRef:  1.0,
  tempRef:     293.15,
  volRef:      60,
};
