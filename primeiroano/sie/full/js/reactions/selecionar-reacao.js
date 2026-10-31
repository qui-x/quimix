/* ═══════════════════════════════════════════════════════════════
   CAMADA: ESTEQUIOMETRIA
   ARQUIVO: selecionar-reacao.js
   ───────────────────────────────────────────────────────────────
   Sorteia quantidades iniciais aleatórias dentro de uma faixa
   didática (gerarCoeficientesIniciais) e troca a reação ativa
   (selecionarReacao) — monta reagentes e produtos no canvas, atualiza
   os painéis. O botão "Resetar" volta a montar a MESMA reação com
   coeficientes-padrão sorteados de novo.
   Depende de: core/estado-reacao.js, data/reacoes.js,
               reactions/montar-reagentes.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Sorteia o estado INICIAL da equação inteira — reagentes e produtos —
// pra virar um exercício de balanceamento de verdade: a caixinha
// mostra esse número direto (não mais "quantidade real" separada do
// "coeficiente da equação balanceada" — os dois viraram a mesma coisa,
// editável, que o aluno ajusta até bater). A proporção CERTA continua
// guardada em r.coeffsOriginais (capturada em selecionarReacao, antes
// de qualquer sorteio) — é ela que "Restaurar coeficientes" devolve, e
// é ela que os cálculos de verdade (rendimento teórico, razão,
// reagente limitante) usam por baixo, não o palpite atual do aluno.
//
// Sorteio direto de 1 a LIMITE_MOLS_ALEATORIO por substância — não é
// mais um múltiplo do coeficiente (isso explodia em reações com
// coeficiente grande, ex. O₂:9 em "Combustão com impureza de
// silício"). Garantido não cair já balanceado por acaso: se dentro de
// algumas tentativas o sorteio bater na proporção certa (ou um
// múltiplo dela), resorteia tudo de novo — sem isso o exercício às
// vezes nasceria "já resolvido", sem nada pra ajustar.
const LIMITE_MOLS_ALEATORIO = 8;

function gerarCoeficientesIniciais(r) {
  const sorteio = () => 1 + Math.floor(Math.random() * LIMITE_MOLS_ALEATORIO); // 1..8
  let coeficientes;
  let tentativas = 0;
  do {
    coeficientes = {};
    Object.keys(r.coeffsOriginais).forEach((formula) => { coeficientes[formula] = sorteio(); });
    tentativas++;
  } while (equacaoEstaBalanceada(r, coeficientes) && tentativas < 25);
  return coeficientes;
}

function selecionarReacao(key) {
  // Mesmo contrato do SIMA: nada reage no canvas antes de um módulo
  // ser ativado. Sem esta guarda, um clique num card de "Reações
  // Prontas" montava reagentes no canvas mesmo com o módulo
  // Estequiometria desligado (ou nenhum módulo ativo, no carregamento
  // inicial da página).
  if (moduloAtivo !== "estequiometria") {
    setStatus("Ative o módulo Estequiometria, na barra lateral esquerda, antes de escolher uma reação.");
    return;
  }
  reacaoEscolhida = true;
  currentReactionKey = key;
  const r = REACTIONS[key];

  // Guarda a proporção REAL do catálogo antes de qualquer sorteio — só
  // na primeira vez que a reação é escolhida nesta sessão. É o que
  // "Restaurar coeficientes" devolve, e o que os cálculos de verdade
  // (rendimento teórico, razão, reagente limitante) usam por baixo,
  // mesmo enquanto o aluno está com a equação errada na tela.
  if (!r.coeffsOriginais) r.coeffsOriginais = { ...r.coeffs };

  if (r.modo === "metalico") {
    currentQuantities = Object.fromEntries(r.reagents.map((rg) => [rg.formula, rg.defaultQty]));
  } else {
    // A caixinha da equação passa a EDITAR r.coeffs diretamente — não
    // existe mais "coeficiente da equação balanceada" (fixo, mostrado)
    // separado de "quantidade real que você tem" (sorteada, escondida
    // atrás de um badge). É a mesma caixa, o mesmo número: o aluno
    // ajusta até a equação balancear de verdade.
    r.coeffs = gerarCoeficientesIniciais(r);
    currentQuantities = {};
    r.reagents.forEach((rg) => { currentQuantities[rg.formula] = r.coeffs[rg.formula]; });
  }

  renderizarMenuReacoes();
  renderizarQuantidades();
  atualizarCalculadora();
  montarReagentesAtual();
  atualizarModeIndicator();
}

document.getElementById("resetBtn").addEventListener("click", () => {
  /* sem esta guarda, "Reiniciar" montava a agua no canvas mesmo sem
     nenhuma reacao escolhida — currentReactionKey ainda aponta p/ ela */
  if (!reacaoEscolhida) {
    setStatus('Escolha uma reação em "Reações Prontas" primeiro.', "error");
    return;
  }
  montarReagentesAtual();
});

