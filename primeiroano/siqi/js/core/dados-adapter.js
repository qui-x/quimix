/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (ponte de dados)
   ARQUIVO: dados-adapter.js
   ───────────────────────────────────────────────────────────────
   Aliases (CATEGORIAS, EXPERIMENTOS) para os dados de
   js/data/metadados-funcao.js e experimentos.js, e a conversão do
   catálogo bruto (CATALOGO_SIQI, um array) no dicionário COMPOSTOS
   (indexado por fórmula) que o resto do app usa — já com o estado
   físico a 25°C calculado a partir de Tf/Tb.
   Depende de: js/data/* (CATALOGO_SIQI, CATEGORIAS_SIQI,
               EXPERIMENTOS_SIQI).
   Usado por: praticamente todo o app (via o dicionário COMPOSTOS).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   1. DADOS — lidos de dadossiqi.js (carregado antes deste script)
   dadossiqi.js exporta as variáveis globais:
     FUNCAO_META, CATEGORIAS_SIQI, CATALOGO_SIQI, EXPERIMENTOS_SIQI
════════════════════════════════════════════════════════════════ */

/* Aliases para os nomes usados internamente pelo script */
var CATEGORIAS   = CATEGORIAS_SIQI;

var EXPERIMENTOS = EXPERIMENTOS_SIQI;

/* Converte CATALOGO_SIQI (array) → COMPOSTOS (dict keyed by formulaId) */
var COMPOSTOS = (function(){
  var dict = {};
  CATALOGO_SIQI.forEach(function(c){
    var estado = '—';
    if(c.Tf !== null && c.Tb !== null){
      if(c.Tf > 25)      estado = 'Sólido (25 °C)';
      else if(c.Tb < 25) estado = 'Gasoso (25 °C)';
      else               estado = 'Líquido (25 °C)';
    } else if(c.Tf === null){
      estado = 'Aquoso / Instável';
    } else if(c.Tf > 25){
      estado = 'Sólido (25 °C)';
    }
    dict[c.formulaId] = {
      nome:c.nome, funcao:c.funcao, categoria:c.categoria,
      massa:c.massa, estado:estado,
      Tf:c.Tf, Tb:c.Tb,
      pfStr: c.Tf !== null ? c.Tf + ' °C' : '—',
      peStr: c.Tb !== null ? c.Tb + ' °C' : '—  (decompõe)',
      densidade:c.densidade, solubilidade:c.solubilidade, ph:c.ph,
      nomenclatura:c.nomenclatura, badges:c.badges || [],
      geometria:c.geometria || '—', ligacao:c.ligacao || '—',
      equacao:c.equacao, reacao:c.reacao, lewis:c.lewis,
      uso:c.uso, curiosidade:c.curiosidade, descricao:c.descricao || '',
    };
  });
  return dict;
}());

