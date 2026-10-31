/* ═══════════════════════════════════════════════════════════════
   CAMADA: INICIALIZAÇÃO
   ARQUIVO: ativacao-modulos.js
   ORIGEM:  ADAPTADO do bloco initBondModes() que vive dentro de
            js/init/inicializacao-final.js no SILQ (os botões
            "Ativar Modo Covalente/Iônico/Metálico"). É o MESMO
            comportamento — pedido explicitamente: um clique ativa
            (com indicador colorido no canvas, botão marcado
            "✓ ativo", canvas com borda colorida), clicar de novo
            desativa, e trocar de módulo limpa a área de trabalho.
   ───────────────────────────────────────────────────────────────
   Os 3 módulos estão completos e habilitados: MODULE_CONFIG cobre
   1, 2 e 3, e o `disabled` já foi removido dos três botões no HTML.
   (Nota histórica: comentários antigos deste arquivo diziam que o
   Módulo 3 — Laboratório de Solubilidade — ainda estava desabilitado;
   isso ficou desatualizado assim que fisica-solubilidade.js e
   tubo-ensaio.js foram concluídos, sem que o comentário fosse revisado.)
   Depende de: js/core/estado.js, js/core/dom-refs.js,
              js/ui/sandbox.js (limparSandbox, updateSandboxHint),
              js/ui/beaker.js (limparBequer — Módulo 2),
              js/simulation/fisica-intermolecular.js (startSimLoop,
              stopSimLoop — Módulo 1),
              js/simulation/fisica-termostato.js (startTermostatoLoop,
              stopTermostatoLoop — Módulo 2),
              js/a11y/anuncios.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const MODULE_CONFIG = {
    1: {
      icon: SIFI.ICONS.modulo1,
      nome: 'Tabuleiro das Atrações',
      label: 'Módulo 1 ativo — Tabuleiro das Atrações',
      indicatorCls: 'mode--modulo1',
      canvasCls: 'modulo-1-ativo',
    },
    2: {
      icon: SIFI.ICONS.modulo2,
      nome: 'Termostato Molecular',
      label: 'Módulo 2 ativo — Termostato Molecular',
      indicatorCls: 'mode--modulo2',
      canvasCls: 'modulo-2-ativo',
    },
    3: {
      icon: SIFI.ICONS.modulo3,
      nome: 'Laboratório de Solubilidade',
      label: 'Módulo 3 ativo — Laboratório de Solubilidade',
      indicatorCls: 'mode--modulo3',
      canvasCls: 'modulo-3-ativo',
    },
  };

  const moduleBtns = Array.from(document.querySelectorAll('.bond-mode-btn[data-module]'));

  /* Troca o que aparece na área principal (o canvas do
     Módulo 1 ou o béquer do Módulo 2) e quais painéis da sidebar
     direita ficam visíveis — cada painel lá tem um `data-modulo="1"`
     ou `data-modulo="2"` marcando de qual módulo ele é (ver
     index-sifi.html). Sem módulo nenhum ativo, os dois ficam
     escondidos: não tem sentido mostrar controles de um módulo que
     não está rodando. */
  function atualizarVisibilidadePorModulo(num) {
    if (SIFI.canvasWrapper) SIFI.canvasWrapper.classList.toggle('hidden', num !== 1);
    if (SIFI.beakerWrapper) SIFI.beakerWrapper.classList.toggle('hidden', num !== 2);
    if (SIFI.labWrapper) SIFI.labWrapper.classList.toggle('hidden', num !== 3);

    // BUG CORRIGIDO: com os 3 wrappers acima escondidos ao mesmo
    // tempo (nenhum módulo ativo), a área central ficava em branco
    // sem nenhuma orientação — este hint mora fora dos 3 wrappers
    // de propósito, então continua visível justamente quando eles
    // não estão.
    const semModulo = document.getElementById('no-module-hint');
    if (semModulo) semModulo.hidden = !!num;

    document.querySelectorAll('[data-modulo]').forEach(el => {
      const deste = Number(el.dataset.modulo);
      el.hidden = deste !== num;
    });
  }

  /* Mostra/esconde e dessatura o menu de moléculas conforme o Módulo 1
     está ativo ou não, OU o teto de interações ativas foi atingido —
     reforço visual dos dois portões que já existem em
     SIFI.addMoleculeToSandbox (sandbox.js). Exposta em SIFI.* porque
     também precisa ser chamada de sandbox.js/renderInteracoesPanel,
     quando o teto de interações é cruzado em tempo real (a física
     pode aproximar moléculas o bastante para atingir o limite mesmo
     sem o usuário adicionar mais nenhuma). */
  function atualizarBloqueioMenu() {
    if (!SIFI.menuGrid) return;
    const noTetoInteracoes = SIFI.interacoesAtivas && SIFI.interacoesAtivas.size >= SIFI.MAX_INTERACOES_ATIVAS;
    const noTetoMoleculas = SIFI.canvasMolecules && SIFI.canvasMolecules.length >= SIFI.MAX_MOLECULAS_SANDBOX;
    SIFI.menuGrid.classList.toggle('grid-bloqueado', SIFI.activeModule !== 1 || !!noTetoInteracoes || !!noTetoMoleculas);
  }
  SIFI.atualizarBloqueioMenu = atualizarBloqueioMenu;

  function limparClassesCanvas() {
    if (!SIFI.sandbox) return;
    SIFI.sandbox.classList.remove('modulo-1-ativo', 'modulo-2-ativo', 'modulo-3-ativo');
  }

  /* Para o loop de física do módulo que estiver rodando (o de cima
     PARA o outro, senão os dois ficariam mexendo em DOM ao mesmo
     tempo à toa, já que só um módulo é visível por vez). */
  function pararTodosOsLoops() {
    if (SIFI.stopSimLoop) SIFI.stopSimLoop();
    if (SIFI.stopTermostatoLoop) SIFI.stopTermostatoLoop();
    if (SIFI.stopLabLoop) SIFI.stopLabLoop();
  }

  /* Ao ATIVAR o Módulo 3 (`criarPadrao=true`), reinicia pro estado
     padrão: remove qualquer tubo existente e recria os 2 iniciais.
     Ao SAIR do Módulo 3 pra qualquer outro lugar (`criarPadrao=false`),
     fica vazio de verdade — mesma consistência de "sem módulo ativo,
     sem estado nenhum" que o Módulo 1 (`canvasMolecules=[]`) e o
     Módulo 2 (`particulas=[]`) já têm quando ficam inativos. */
  function limparLaboratorio(criarPadrao) {
    if (criarPadrao && SIFI.resetLaboratorio) {
      SIFI.resetLaboratorio();
    } else if (SIFI.limparLaboratorioCompleto) {
      SIFI.limparLaboratorioCompleto();
    }
  }

  function setActiveModule(num) {
    // Trocar de módulo (ou ativar um novo) sempre limpa a área de
    // trabalho de QUALQUER módulo — o mesmo que o SILQ faz ao trocar
    // de "Ativar Modo X" com átomos já no canvas, para não misturar
    // estado de módulos diferentes.
    pararTodosOsLoops();
    if (SIFI.limparSandbox) SIFI.limparSandbox();
    if (SIFI.limparBequer) SIFI.limparBequer();
    limparLaboratorio(num === 3);

    SIFI.activeModule = num;
    const cfg = MODULE_CONFIG[num];

    moduleBtns.forEach(btn => {
      const thisNum = Number(btn.dataset.module);
      const isThis = thisNum === num;
      btn.setAttribute('aria-pressed', isThis ? 'true' : 'false');
      if (!btn.disabled) {
        btn.title = isThis
          ? `Desativar o Módulo ${thisNum}`
          : `Ativar o Módulo ${thisNum}`;
      }
    });

    if (SIFI.moduleIndicator && cfg) {
      SIFI.moduleIndicator.className = `module-indicator ${cfg.indicatorCls}`;
      if (SIFI.moduleIndicatorIcon) SIFI.moduleIndicatorIcon.innerHTML = cfg.icon;
      if (SIFI.moduleIndicatorText) SIFI.moduleIndicatorText.textContent = cfg.label;
    }

    limparClassesCanvas();
    if (SIFI.sandbox && cfg) SIFI.sandbox.classList.add(cfg.canvasCls);
    atualizarVisibilidadePorModulo(num);

    // Ao ativar, o painel se RECOLHE — o gatilho abre espaço pro
    // canvas. Reabrir é um clique no cabeçalho, a qualquer momento.
    const painelAtivado = document.querySelector(`.bond-mode-btn[data-module="${num}"]`)?.closest('.panel');
    if (painelAtivado) {
      const hdr = painelAtivado.querySelector('.panel-header');
      const bd = painelAtivado.querySelector('.panel-body');
      if (hdr) hdr.setAttribute('aria-expanded', 'false');
      if (bd) bd.classList.add('collapsed');
    }
    if (SIFI.syncMobileModeUI) SIFI.syncMobileModeUI(num);

    atualizarBloqueioMenu();
    if (SIFI.updateSandboxHint) SIFI.updateSandboxHint();

    // Cada módulo liga o loop de física que é dele.
    if (num === 1 && SIFI.startSimLoop) SIFI.startSimLoop();
    if (num === 2 && SIFI.startTermostatoLoop) SIFI.startTermostatoLoop();
    if (num === 3 && SIFI.startLabLoop) SIFI.startLabLoop();

    if (SIFI.announce && cfg) SIFI.announce(`${cfg.label}.`, 'assertive');
  }

  function clearActiveModule() {
    pararTodosOsLoops();
    if (SIFI.limparSandbox) SIFI.limparSandbox();
    if (SIFI.limparBequer) SIFI.limparBequer();
    limparLaboratorio(false);
    SIFI.activeModule = null;

    moduleBtns.forEach(btn => btn.setAttribute('aria-pressed', 'false'));

    if (SIFI.moduleIndicator) SIFI.moduleIndicator.className = 'module-indicator hidden';
    limparClassesCanvas();
    atualizarVisibilidadePorModulo(null);
    atualizarBloqueioMenu();
    if (SIFI.updateSandboxHint) SIFI.updateSandboxHint();
    if (SIFI.syncMobileModeUI) SIFI.syncMobileModeUI(null);

    if (SIFI.announce) SIFI.announce('Nenhum módulo ativo.');
  }

  moduleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return; // Módulos 2 e 3: ainda não existem
      const num = Number(btn.dataset.module);
      // Toggle: clicar no módulo já ativo desativa — igual ao SILQ.
      if (SIFI.activeModule === num) clearActiveModule();
      else setActiveModule(num);
    });
  });

  if (SIFI.moduleIndicatorClear) {
    SIFI.moduleIndicatorClear.addEventListener('click', clearActiveModule);
  }

  // Exposto em SIFI.* para outros arquivos (e para os testes) poderem
  // ativar/desativar um módulo programaticamente, se precisar.
  SIFI.setActiveModule = setActiveModule;
  SIFI.clearActiveModule = clearActiveModule;

  // Estado inicial da tela: nenhum módulo ativo.
  atualizarBloqueioMenu();
  // BUG CORRIGIDO: os painéis do Módulo 1 não tinham o atributo
  // hidden no HTML estático (os do 2 e 3 tinham) — apareciam na
  // primeira carga mesmo sem nenhum módulo ativo. Essa chamada
  // garante o estado inicial certo independente do HTML, sem
  // depender de nenhum atributo estar (ou não) presente de origem.
  atualizarVisibilidadePorModulo(null);
});
