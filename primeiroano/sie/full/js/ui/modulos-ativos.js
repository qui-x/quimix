/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (troca de módulo)
   ARQUIVO: modulos-ativos.js
   ───────────────────────────────────────────────────────────────
   Controla qual dos dois módulos (Estequiometria ou Mols) está
   ativo: a pílula indicadora sobre o canvas, os textos de dica, a
   ativação/desativação de cada módulo pelos botões da sidebar
   esquerda, e a sincronização de quais painéis aparecem na sidebar
   direita conforme o módulo ativo. Também dispara a primeira
   renderização ao carregar a página.
   Depende de: core/estado-reacao.js, a11y/anunciar.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   15b-ter. MÓDULOS DA SIDEBAR ESQUERDA — mesmo mecanismo do SIMA
   (models Dalton/Thomson/Rutherford/Bohr/Quântico): cada botão com
   data-modulo ativa um módulo e desativa os demais (mutuamente
   exclusivo); clicar no módulo JÁ ativo desativa e devolve tudo ao
   estado em branco (toggle — mesmo contrato do clearModel() do SIMA).
   Abrir/fechar o painel (o cabeçalho .panel-header) é uma ação
   independente — não mexe em qual módulo está ativo, só na
   visibilidade do conteúdo. O selo "Ativo" no cabeçalho é só CSS
   (:has()), não precisa de nada aqui.

   Como no SIMA, NENHUM módulo começa ativo (moduloAtivo = null) — o
   canvas nasce em branco, coberto pelo #canvas-hint, até o aluno
   clicar em "Ativar módulo". selecionarReacao() (mais acima no
   arquivo) recusa a escolha de reação enquanto o módulo Estequiometria
   não estiver ativo — é o mesmo contrato do SIMA, em que nada reage no
   canvas antes de um modelo ser ativado.

   Por enquanto só o módulo "Estequiometria" tem conteúdo funcional;
   "Mols" é um placeholder — ativá-lo anuncia o estado por voz e marca
   o botão como pressed, mas ainda não muda nada no canvas. Quando o
   módulo Mols ganhar comportamento de verdade, o ponto de entrada é
   este mesmo listener. --------------------------------------------- */
let moduloAtivo = null;

const NOMES_MODULO = { estequiometria: "Estequiometria", mols: "Mols" };

// Mostra o aviso sobre o canvas sempre que NENHUM módulo está ativo —
// inclusive no carregamento inicial, antes de qualquer clique. Mesmo
// papel do #canvas-hint do SIMA/SISOL. Bug corrigido: antes só reconhecia
// "estequiometria"; com o módulo Mols ativo o hint nunca escondia,
// mesmo com uma substância já desenhada no canvas por trás dele.
function atualizarCanvasHint() {
  const hint = document.getElementById("canvas-hint");
  if (hint) hint.hidden = moduloAtivo !== null;
}

// Pílula flutuante sobre o canvas — mesma peça #mode-indicator do
// SIMA/SISOL, compartilhada pelos DOIS módulos (não é mais exclusiva do
// Mols). Cor e ícone mudam por [data-mode], igual ao
// #mode-indicator[data-mode="dalton"] do SIMA. Precisa vir depois de
// TODAS as variáveis de Estequiometria e Mols já declaradas no arquivo
// (reacaoEscolhida, molsReacaoAtual etc.) — por isso só é chamada de
// dentro de handlers de clique, nunca no topo do script antes delas
// existirem.
function atualizarModeIndicator() {
  const canvasArea = document.getElementById("canvas-area");
  const overlay = document.getElementById("mode-indicator");
  const overlayIcon = document.getElementById("overlay-icon");
  const overlayText = document.getElementById("overlay-text");

  // Mesmo padrão do SIMA: um texto PRINCIPAL curto ("X ativo") e um
  // .overlay-detail secundário (opacidade menor) com o que está
  // acontecendo agora — nome da reação, progresso etc. Evita que a
  // pílula vire uma frase só do mesmo peso visual do início ao fim.
  const montarTexto = (principal, detalhe) => {
    overlayText.textContent = principal;
    if (detalhe) {
      const sp = document.createElement("span");
      sp.className = "overlay-detail";
      sp.textContent = ` · ${detalhe}`;
      overlayText.appendChild(sp);
    }
  };

  if (moduloAtivo === "estequiometria") {
    canvasArea.dataset.mode = "estequiometria"; // dono de --mod/--mod-rgb agora — ver stylesie.css
    overlayIcon.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-flask"/></svg>';
    if (reacaoEscolhida) {
      montarTexto("Investigando", REACTIONS[currentReactionKey].label);
    } else {
      montarTexto("Estequiometria ativa", "escolha uma reação em Reações Prontas");
    }
    overlay.classList.add("mode-on");
  } else if (moduloAtivo === "mols") {
    canvasArea.dataset.mode = "mols";
    overlayIcon.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-search"/></svg>';
    if (typeof molsReacaoAtual !== "undefined" && molsReacaoAtual) {
      const formulas = Object.keys(molsSubstancias);
      const completos = formulas.filter((f) => substanciaCompletaMols(f)).length;
      montarTexto("Investigando", `${REACTIONS[molsReacaoAtual].label} · ${completos}/${formulas.length} substâncias`);
    } else {
      montarTexto("Mols ativo", "escolha uma reação em Investigar Reação");
    }
    overlay.classList.add("mode-on");
  } else {
    delete canvasArea.dataset.mode;
    overlay.classList.remove("mode-on");
  }
}

// Mesmo gesto do ✕ do #mode-indicator no SIMA: desativa QUALQUER módulo
// que esteja ativo no momento (não é mais fixo no Mols) e devolve o
// canvas ao estado em branco.
document.getElementById("overlay-clear").addEventListener("click", () => {
  if (moduloAtivo) {
    const btn = document.querySelector(`.mode-activate-btn[data-modulo="${moduloAtivo}"]`);
    if (btn) btn.click();
  }
});

// Sair do módulo Estequiometria devolve o canvas ao estado em branco —
// mesmo contrato do clearModel() do SIMA. Sem isso, trocar para "Mols"
// deixaria reagentes/produtos da reação anterior soltos no canvas
// mesmo com o módulo desativado.
function desativarModuloEstequiometria() {
  limparCena();
  reacaoEscolhida = false;
  state = "IDLE";
  energyBtn.disabled = true;
  document.getElementById("validateBtn").disabled = true;
  renderizarMenuReacoes();
  renderizarQuantidades();
  atualizarCalculadora();
}

// Mesmo princípio: sair do módulo Mols reseta a investigação em
// andamento e trava o seletor de reação de novo — "nada aparece até o
// módulo ativar" vale nos dois sentidos, ativar E desativar.
function desativarModuloMols() {
  const search = document.getElementById("molsReactionSearch");
  search.disabled = true;
  search.value = "";
  molsReacaoSelecionadaKey = null;
  document.querySelectorAll("#molsReactionMenu .reaction-card").forEach((c) => {
    c.classList.remove("is-active");
    c.setAttribute("aria-selected", "false");
    c.style.display = "";
  });
  document.getElementById("molsSubstanceRow").hidden = true;
  if (typeof resetInvestigacaoMols === "function") resetInvestigacaoMols();
}

document.querySelectorAll(".mode-activate-btn[data-modulo]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modulo = btn.dataset.modulo;

    // TOGGLE — clicar no módulo JÁ ativo desativa e devolve o canvas
    // ao estado em branco. Mesmo contrato do SIMA (setMode/clearModel):
    // o clique sempre foi pensado como toggle, mas antes o "if (modulo
    // === moduloAtivo) return;" fazia o segundo clique não fazer nada —
    // dava para ATIVAR um módulo, mas não tinha como DESATIVAR de volta.
    if (modulo === moduloAtivo) {
      playTone(500, .08, .05); // grave — mesmo par de tons do abrir/fechar painel
      if (modulo === "estequiometria") desativarModuloEstequiometria();
      if (modulo === "mols") desativarModuloMols();
      moduloAtivo = null;
      btn.setAttribute("aria-pressed", "false");
      btn.title = `Ativar o módulo ${NOMES_MODULO[modulo]}`;
      atualizarCanvasHint();
      atualizarModeIndicator();
      sincronizarPaineisDireitaPorModulo();
      anunciar(`Módulo ${NOMES_MODULO[modulo]} desativado.`);
      return;
    }

    playTone(modulo === "mols" ? 1100 : 880, .08, .07); // agudo — mesmo padrão do SIMA (tom mais alto = modelo "mais avançado")
    const moduloAnterior = moduloAtivo;
    moduloAtivo = modulo;
    document.querySelectorAll(".mode-activate-btn[data-modulo]").forEach((b) => {
      const ativo = b.dataset.modulo === modulo;
      b.setAttribute("aria-pressed", String(ativo));
      b.title = ativo ? `Desativar o módulo ${NOMES_MODULO[b.dataset.modulo]}` : `Ativar o módulo ${NOMES_MODULO[b.dataset.modulo]}`;
    });

    if (moduloAnterior === "estequiometria" && modulo !== "estequiometria") {
      desativarModuloEstequiometria();
    }
    if (moduloAnterior === "mols" && modulo !== "mols") {
      desativarModuloMols();
    }
    if (modulo === "mols") {
      document.getElementById("molsReactionSearch").disabled = false;
    }
    atualizarCanvasHint();
    atualizarModeIndicator();
    sincronizarPaineisDireitaPorModulo();

    // Mesmo padrão do SIMA: "Modelo X selecionado. [1ª frase da
    // descrição]." — não só o nome, também o que o módulo faz, pra
    // quem usa leitor de tela não precisar navegar até o card pra
    // saber o que acabou de ativar.
    const def = document.getElementById(`def-mod-${modulo}`);
    const primeiraFrase = def ? def.textContent.trim().split(/(?<=[.!?])\s/)[0] : "";
    anunciar(`Módulo ${NOMES_MODULO[modulo]} ativado. ${primeiraFrase}`);

    // Mesmo comportamento do SIMA (.mode-activate-btn, .model-btn em
    // telas ≤1100px): ativar um módulo fecha a gaveta mobile sozinho —
    // o aluno já fez a escolha, a tela deve voltar pro canvas.
    if (innerWidth <= BREAKPOINT_MOBILE) fecharSidebarsMobile();
  });
});

// Mesmo papel que a Tabela Periódica tem, sozinha, na sidebar direita do
// SIMA: cada módulo tem seu próprio conjunto de painéis de ESCOLHA na
// direita, e só o do módulo ativo aparece. Reações Prontas + Análise
// pertencem à Estequiometria; Investigar Substância pertence ao Mols.
// Sem módulo nenhum ativo, nenhum dos três aparece — a coluna direita
// fica tão vazia quanto o canvas (mesmo #canvas-hint cobrindo os dois).
function sincronizarPaineisDireitaPorModulo() {
  const painelReacoes = document.getElementById("panel-reactions");
  const painelAnalise = document.getElementById("panel-analysis");
  const painelDados = document.getElementById("panel-reaction-data");
  const painelMols = document.getElementById("panel-mols-investigar");
  painelReacoes.hidden = moduloAtivo !== "estequiometria";
  painelAnalise.hidden = moduloAtivo !== "estequiometria";
  painelDados.hidden = moduloAtivo !== "estequiometria";
  painelMols.hidden = moduloAtivo !== "mols";
}

atualizarCanvasHint(); // estado inicial: nenhum módulo ativo, hint visível

sincronizarPaineisDireitaPorModulo(); // estado inicial: nenhum painel de escolha visível

