/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS (constantes de referência)
   ARQUIVO: escalas-visuais.js
   ───────────────────────────────────────────────────────────────
   Faixas de classificação de pressão e temperatura (para os
   rótulos "Normal", "Alta", "Criogênica" etc. e suas cores) e a
   escala de cor do termômetro.
   Depende de: nada.
   Usado por: core/fisica.js (corTermometro, encontrarFaixa),
              ui/render-temperatura.js, ui/render-pressao.js,
              ui/render-medidas.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── FAIXAS DE PRESSÃO ─── */
var FAIXAS_PRESSAO = [
  { max:0.5,      cor:'#00D4FF', rotulo:'Vácuo'      },
  { max:0.8,      cor:'#38BDF8', rotulo:'Baixa'      },
  { max:1.2,      cor:'#4ADE80', rotulo:'Normal'     },
  { max:3.0,      cor:'#FACC15', rotulo:'Elevada'    },
  { max:8.0,      cor:'#FB923C', rotulo:'Alta'       },
  { max:15.0,     cor:'#F87171', rotulo:'Muito alta' },
  { max:Infinity, cor:'#EF4444', rotulo:'Crítica'    },
];

/* ─── FAIXAS DE TEMPERATURA ─── */
var FAIXAS_TEMPERATURA = [
  { max:-200,     cor:'#A5F3FC', rotulo:'Criogênica'   },
  { max:-50,      cor:'#7DD3FC', rotulo:'Muito fria'   },
  { max:0,        cor:'#93C5FD', rotulo:'Fria'         },
  { max:40,       cor:'#86EFAC', rotulo:'Ambiente'     },
  { max:150,      cor:'#FDE68A', rotulo:'Quente'       },
  { max:500,      cor:'#FCA5A5', rotulo:'Muito quente' },
  { max:Infinity, cor:'#F87171', rotulo:'Extrema'      },
];

/* ─── TERMÔMETRO ─── */
var TERMOMETRO = {
  alturaMaxima: 155,
  gradientes: [
    { temp:-273, cor:'#A5F3FC' },
    { temp:-50,  cor:'#7DD3FC' },
    { temp:0,    cor:'#38BDF8' },
    { temp:40,   cor:'#4ADE80' },
    { temp:100,  cor:'#FB923C' },
    { temp:500,  cor:'#EF4444' },
    { temp:3600, cor:'#7C3AED' },
  ],
};
