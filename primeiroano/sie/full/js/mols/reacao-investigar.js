/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS
   ARQUIVO: reacao-investigar.js
   ───────────────────────────────────────────────────────────────
   O estado da investigação em andamento (reação atual, contagem por
   substância, ficha pendente) e a lista de reações disponíveis para
   investigar — reaproveita o MESMO catálogo REACTIONS que "Reações
   Prontas" usa, num container próprio para não interferir na busca
   do outro módulo.
   Depende de: core/estado-reacao.js, data/reacoes.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ===================================================================
   INVESTIGAÇÃO DE MASSA MOLAR — módulo Mols
   ===================================================================
   Fluxo: escolhe uma reação (mesmo catálogo REACTIONS que "Reações
   Prontas" usa) → TODA a reação — reagentes e produtos — é desenhada
   junto no canvas, reagentes à esquerda, produtos à direita. É assim
   que estão de fato numa solução real: juntos, não um de cada vez.
   Clicar num átomo do CANVAS ainda sem massa descoberta abre o modal
   completo do SITP — é lá que o aluno localiza o dado de massa. Ao
   fechar, a massa é registrada e aquele clique já conta como a 1ª
   ocorrência NAQUELA substância. Cliques seguintes em átomos do mesmo
   elemento (já com massa conhecida) só numeram a ocorrência — sem
   reabrir o modal. A massa molar de cada substância aparece sozinha na
   tabela assim que todos os seus átomos estão contados — sem precisar
   de um botão "Pronto". Uma pílula flutuante sobre o canvas (mesmo
   padrão do #mode-indicator do SIMA) mostra quantas substâncias já
   foram concluídas.
   =================================================================== */
let molsReacaoAtual = null; // key da reação em REACTIONS, ou null

// { [formula]: { papel: "reagente"|"produto",
//                contagem: { [simbolo]: { total, contadosIdx: Set<number>, massa: number|null } } } }
let molsSubstancias = {};

let molsFichaPendente = null; // { formula, indice } do átomo que abriu o modal, aguardando fechamento

const molsReactionSearch = document.getElementById("molsReactionSearch");

const molsReactionMenu = document.getElementById("molsReactionMenu");

const molsSubstanceRow = document.getElementById("molsSubstanceRow");

const molsSubstanceLegend = document.getElementById("molsSubstanceLegend");

const molsInstrucaoCanvas = document.getElementById("molsInstrucaoCanvas");

const molsTallyEl = document.getElementById("molsTally");

const molsTallyBody = document.getElementById("molsTallyBody");

const molsResultadoEl = document.getElementById("molsResultado");

let molsReacaoSelecionadaKey = null;

// Popula a lista de reações a partir do MESMO catálogo REACTIONS —
// não é uma lista paralela, é o mesmo dado de "Reações Prontas". Mesmo
// template de card (.reaction-card/.rc-dot) que renderizarMenuReacoes()
// usa lá, num container PRÓPRIO (#molsReactionMenu) — buscar e escolher
// aqui não deve interferir na lista da Estequiometria.
function popularListaReacoesMols() {
  molsReactionMenu.innerHTML = "";
  const ROTULO_TIPO = { covalente: "Covalente", ionico: "Iônica" };
  Object.entries(REACTIONS).forEach(([key, r]) => {
    if (r.modo === "metalico") return; // ligação metálica não tem fórmula fixa pra investigar
    const tipo = r.tipoLigacao || "covalente";
    const card = document.createElement("button");
    card.type = "button";
    card.className = "reaction-card";
    card.setAttribute("role", "option");
    card.setAttribute("aria-selected", "false");
    card.dataset.busca = `${r.label} ${r.equation} ${ROTULO_TIPO[tipo] || tipo}`.toLowerCase();
    card.dataset.tipo = tipo;
    card.dataset.key = key;
    card.innerHTML = `<span class="rc-dot" aria-hidden="true"></span><span class="rc-name">${r.label}</span>`;
    card.addEventListener("click", () => {
      molsReacaoSelecionadaKey = key;
      molsReactionMenu.querySelectorAll(".reaction-card").forEach((c) => {
        const ativo = c === card;
        c.classList.toggle("is-active", ativo);
        c.setAttribute("aria-selected", String(ativo));
      });
      resetInvestigacaoMols();
      iniciarInvestigacaoReacaoMols(key);
    });
    molsReactionMenu.appendChild(card);
  });
}

popularListaReacoesMols();

function aplicarFiltroReacoesMols() {
  const termo = molsReactionSearch.value.trim().toLowerCase();
  molsReactionMenu.querySelectorAll(".reaction-card").forEach((card) => {
    card.style.display = !termo || card.dataset.busca.includes(termo) ? "" : "none";
  });
}

molsReactionSearch.addEventListener("input", aplicarFiltroReacoesMols);

