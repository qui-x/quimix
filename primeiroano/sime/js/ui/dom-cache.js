/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (DOM)
   ARQUIVO: dom-cache.js
   ───────────────────────────────────────────────────────────────
   Centraliza TODAS as buscas de elementos HTML (document.getElementById)
   num único objeto `D`, feitas uma única vez em cachearDOM(). Assim,
   o resto do código nunca repete document.getElementById — apenas lê
   D.nomeDoElemento, o que é mais rápido e mais fácil de manter.
   Alguns campos de D correspondem a elementos de uma versão anterior
   da tela (termômetro/manômetro em SVG) que não existem mais no HTML
   atual; foram mantidos de propósito porque todo o código que os usa
   já testa "if (D.elemento)" antes de mexer nele — path seguro caso
   uma versão futura da tela volte a incluir esses desenhos.
   Depende de: nada além do HTML já carregado.
   Usado por: todos os módulos de ui/.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   CACHE DOM
═══════════════════════════════════════════════════════ */
var D = {};
function cachearDOM() {
  D.sliderTemp        = document.getElementById('slider-temperatura');
  D.sliderVol         = document.getElementById('slider-volume');
  D.sliderPressao     = document.getElementById('slider-pressao');
  D.displayTemp       = document.getElementById('display-temp');
  D.displayVol        = document.getElementById('display-volume');
  D.displayPressao    = document.getElementById('display-pressao');
  D.displayPressaoCtrl= document.getElementById('display-pressao-ctrl');
  D.sliderTempMin     = document.getElementById('slider-temp-min');
  D.sliderTempMax     = document.getElementById('slider-temp-max');
  D.mercurioColuna    = document.getElementById('mercurio-coluna');
  D.mercurioBulbo     = document.getElementById('mercurio-bulbo');
  D.lblTmin           = document.getElementById('lbl-tmin');
  D.lblTmax           = document.getElementById('lbl-tmax');
  D.lblTmid           = document.getElementById('lbl-tmid');
  D.lblFusao          = document.getElementById('lbl-fusao');
  D.lblEbulicao       = document.getElementById('lbl-ebulicao');
  D.materiaS          = document.getElementById('materia-solida');
  D.materiaL          = document.getElementById('materia-liquida');
  D.materiaG          = document.getElementById('materia-gasosa');
  D.badge             = document.getElementById('state-pill');
  D.badgeIcone        = document.getElementById('state-pill-icon');
  D.badgeTexto        = document.getElementById('state-pill-text');
  D.descricao         = document.getElementById('texto-descricao-estado');
  D.ponteiro          = document.getElementById('ponteiro-manometro');
  D.arcoPressao       = document.getElementById('arco-pressao');
  D.valorPressaoSVG   = document.getElementById('valor-pressao-svg');
  D.pontoFaixaTemp    = document.getElementById('ponto-faixa-temp');
  D.textoFaixaTemp    = document.getElementById('texto-faixa-temp');
  D.pontoFaixaPressao = document.getElementById('ponto-faixa-pressao');
  D.textoFaixaPressao = document.getElementById('texto-faixa-pressao');
  D.tpZonaSolido      = document.getElementById('tp-zona-solido');
  D.tpZonaLiquido     = document.getElementById('tp-zona-liquido');
  D.tpZonaGasoso      = document.getElementById('tp-zona-gasoso');
  D.tpLblFusao        = document.getElementById('tp-lbl-fusao');
  D.tpLblEbulicao     = document.getElementById('tp-lbl-ebulicao');
  D.mSubstancia       = document.getElementById('m-substancia');
  D.mState            = document.getElementById('m-state');
  D.mTemp             = document.getElementById('m-temp');
  D.mVolume           = document.getElementById('m-volume');
  D.mPressao          = document.getElementById('m-pressao');
  D.mFusao            = document.getElementById('m-fusao');
  D.mEbulicao         = document.getElementById('m-ebulicao');
  D.subLista          = document.getElementById('sub-lista');
  D.btnCool           = document.getElementById('btn-cool');
  D.btnHeat           = document.getElementById('btn-heat');
  D.btnPressUp        = document.getElementById('btn-press-up');
  D.btnPressDown      = document.getElementById('btn-press-down');
  // Novos campos de medidas
  D.mPressaoEf        = document.getElementById('m-pressao-ef');
  D.mFaixaPressao     = document.getElementById('m-faixa-pressao');
  D.mFatorVol         = document.getElementById('m-fator-vol');
  // Valores no cabeçalho dos painéis
  D.pvTemperatura     = document.getElementById('pv-temperatura');
  D.pvPressao         = document.getElementById('pv-pressao');
  D.pvVolume          = document.getElementById('pv-volume');
  D.elEfeitoEstado    = document.getElementById('efeito-estado');  // pode ser null — verificado antes do uso
}
