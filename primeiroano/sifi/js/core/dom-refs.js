/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (referências de DOM)
   ARQUIVO: dom-refs.js
   ORIGEM:  mesmo padrão do SILQ (js/core/dom-refs.js).
   ───────────────────────────────────────────────────────────────
   Busca cada elemento do HTML UMA vez só e guarda em SIFI.*.
   O resto do código lê SIFI.sandbox, SIFI.menuGrid etc. em vez de
   repetir document.getElementById toda hora.
   Depende de: js/core/namespace.js. Precisa rodar DEPOIS que o HTML
   (index-sifi.html) já existe no DOM.
   Usado por: js/ui/menu-moleculas.js, js/ui/sandbox.js,
              js/ui/termostato-lista.js, js/ui/beaker.js,
              js/ui/grafico-temperatura.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Canvas (sandbox) — o "canvas" do Módulo 1
  SIFI.canvasWrapper = document.getElementById('canvas-wrapper');
  SIFI.sandbox      = document.getElementById('sandbox');
  SIFI.sandboxHint  = document.getElementById('sandbox-hint');
  SIFI.svgEl        = document.getElementById('bond-svg');

  // Biblioteca de Compostos (dentro da sidebar direita)
  SIFI.menuGrid            = document.getElementById('menu-moleculas-grid');
  SIFI.statTotalMoleculas  = document.getElementById('stat-total-moleculas');
  SIFI.badgeBiblioteca     = document.getElementById('badge-biblioteca');
  SIFI.buscaBiblioteca     = document.getElementById('biblioteca-busca');
  SIFI.ordenarBiblioteca   = document.getElementById('biblioteca-ordenar');
  SIFI.contadorBiblioteca  = document.getElementById('biblioteca-contador');
  SIFI.filtroBtns          = document.querySelectorAll('.mol-cat-btn[data-forca]');

  // Indicador de módulo ativo no topo do canvas (mesmo papel
  // que o #bond-mode-indicator tem no SILQ)
  SIFI.moduleIndicator      = document.getElementById('module-indicator');
  SIFI.moduleIndicatorIcon  = document.getElementById('module-indicator-icon');
  SIFI.moduleIndicatorText  = document.getElementById('module-indicator-text');
  SIFI.moduleIndicatorClear = document.getElementById('module-indicator-clear');

  // Painel "Interações" (sidebar direita) — suporta várias interações
  // simultâneas, não só a mais próxima.
  SIFI.forcaPainel        = document.getElementById('forca-detectada-painel');
  SIFI.statNumMoleculas   = document.getElementById('stat-num-moleculas');
  SIFI.statNumInteracoes  = document.getElementById('stat-num-interacoes');
  SIFI.avisoLimiteInteracoes = document.getElementById('interacoes-limite-aviso');
  SIFI.interacoesLista    = document.getElementById('interacoes-lista');
  SIFI.btnLimpar    = document.getElementById('btn-limpar-sandbox');

  // ═══ MÓDULO 2 — Termostato Molecular ═══
  SIFI.beakerWrapper    = document.getElementById('beaker-wrapper');
  SIFI.beakerHint       = document.getElementById('beaker-hint');
  SIFI.beakerNotaCovalente = document.getElementById('beaker-nota-covalente');
  SIFI.beakerLiquidoZona   = document.getElementById('beaker-liquido-zona');
  SIFI.beakerGasZona       = document.getElementById('beaker-gas-zona');
  SIFI.beakerBondsSvg      = document.getElementById('beaker-bonds-svg');

  SIFI.termostatoListaEl   = document.getElementById('termostato-lista-liquidos');
  SIFI.badgeTermostato     = document.getElementById('badge-termostato-liquidos');
  SIFI.buscaTermostato     = document.getElementById('termostato-busca');
  SIFI.statTotalLiquidos   = document.getElementById('stat-total-liquidos');

  SIFI.termostatoSubstanciaNome = document.getElementById('termostato-substancia-nome');
  SIFI.termostatoPE             = document.getElementById('termostato-pe');
  SIFI.termostatoSlider         = document.getElementById('termostato-slider');
  SIFI.termostatoTempAtual      = document.getElementById('termostato-temp-atual');
  SIFI.termostatoNumSolido      = document.getElementById('termostato-num-solido');
  SIFI.termostatoNumLiquido     = document.getElementById('termostato-num-liquido');
  SIFI.termostatoNumGas         = document.getElementById('termostato-num-gas');
  SIFI.termostatoStatusTexto    = document.getElementById('termostato-status-texto');
  SIFI.termostatoGraficoSvg     = document.getElementById('termostato-grafico');
  SIFI.btnLimparBequer          = document.getElementById('btn-limpar-bequer');

  // ═══ MÓDULO 3 — Laboratório de Solubilidade ═══
  SIFI.labWrapper       = document.getElementById('lab-wrapper');
  SIFI.labHint          = document.getElementById('lab-hint');
  SIFI.prateleiraLista  = document.getElementById('prateleira-lista');
  SIFI.tuboInfoNumero      = document.getElementById('tubo-info-numero');
  SIFI.tuboInfoContador    = document.getElementById('tubo-info-contador');
  SIFI.tuboInfoLista       = document.getElementById('tubo-info-lista');
  SIFI.tuboStatusTexto     = document.getElementById('tubo-status-texto');
  SIFI.btnLimparTubo       = document.getElementById('btn-limpar-tubo');
  // Container onde os tubos são criados DINAMICAMENTE (SIFI.criarTubo,
  // em tubo-ensaio.js) — diferente do Módulo 1/2, não existe HTML fixo
  // pra cada tubo, já que o número deles muda em tempo de execução
  // (2 ao ativar, até 10 se o usuário for adicionando).
  SIFI.labTubosContainer = document.getElementById('lab-tubos');
  SIFI.btnAdicionarTubo  = document.getElementById('btn-adicionar-tubo');
  // Termostato POR TUBO — sempre mexe no tubo ATIVO (ver tubo-ensaio.js)
  SIFI.tuboTempSlider  = document.getElementById('tubo-temp-slider');
  SIFI.tuboTempAtual   = document.getElementById('tubo-temp-atual');
  SIFI.tuboNumSolido   = document.getElementById('tubo-num-solido');
  SIFI.tuboNumLiquido  = document.getElementById('tubo-num-liquido');
  SIFI.tuboNumGas      = document.getElementById('tubo-num-gas');
});
