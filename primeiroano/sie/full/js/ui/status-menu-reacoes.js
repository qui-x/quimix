/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (módulo Estequiometria)
   ARQUIVO: status-menu-reacoes.js
   ───────────────────────────────────────────────────────────────
   Anúncio de status (voz, sem elemento visual), a montagem do menu
   de "Reações Prontas" agrupado por tipo de ligação, e o filtro por
   tipo/busca por texto.
   Depende de: core/estado-reacao.js, data/reacoes.js,
               a11y/anunciar.js.
   Usado por: js/reactions/selecionar-reacao.js (chama
              renderizarMenuReacoes na inicialização).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   14. STATUS / MENSAGENS DIDÁTICAS
   O #statusBanner saiu do topo da sidebar direita (era a "dica" fixa
   ali). setStatus() continua existindo — dezenas de lugares no arquivo
   chamam ela — só que agora ela só ANUNCIA por voz (via anunciar(),
   a mesma live region que já cuidava dos leitores de tela), sem
   desenhar nada na tela para quem enxerga.
   --------------------------------------------------------------- */
function setStatus(texto) {
  anunciar(texto);
}

/* ---------------------------------------------------------------
   15. SIDEBAR — MENU DE REAÇÕES E STEPPERS DE REAGENTES
   --------------------------------------------------------------- */
function renderizarMenuReacoes() {
  const container = document.getElementById("reactionMenu");
  container.innerHTML = "";
  const ROTULO_TIPO = { covalente: "Covalente", ionico: "Iônica", metalico: "Metálica" };
  const grupos = { covalente: [], ionico: [], metalico: [] };

  Object.entries(REACTIONS).forEach(([key, r]) => {
    const tipo = r.modo === "metalico" ? "metalico" : (r.tipoLigacao || "covalente");
    grupos[tipo].push([key, r]);
  });

  ["covalente", "ionico", "metalico"].forEach((tipo) => {
    if (grupos[tipo].length === 0) return;

    const heading = document.createElement("div");
    heading.className = "rc-group-heading";
    heading.dataset.tipoGrupo = tipo;
    heading.textContent = `${ROTULO_TIPO[tipo]} (${grupos[tipo].length})`;
    container.appendChild(heading);

    grupos[tipo].forEach(([key, r]) => {
      const card = document.createElement("button");
      card.type = "button";
      const estaAtivo = reacaoEscolhida && key === currentReactionKey;
    card.className = "reaction-card" + (estaAtivo ? " is-active" : "");
    /* WCAG 4.1.2 (Nome, Funcao, Valor): sem isto o card ativo se anunciava
       igual aos inativos no leitor de tela — a selecao existia so na cor e
       na borda. O card e <button>, entao aria-pressed e o atributo certo. */
    card.setAttribute("aria-pressed", estaAtivo ? "true" : "false");
      card.dataset.busca = `${r.label} ${r.equation} ${ROTULO_TIPO[tipo]}`.toLowerCase();
      card.dataset.tipo = tipo;
      card.innerHTML = `<span class="rc-dot" aria-hidden="true"></span><span class="rc-name">${r.label}</span>`;
      card.addEventListener("click", () => selecionarReacao(key));
      container.appendChild(card);
    });
  });

  document.getElementById("reactionsBadge").textContent = Object.keys(REACTIONS).length;
  aplicarFiltroReacoes();
}

let reactionTipoFiltroAtivo = "todas";

function aplicarFiltroReacoes() {
  const termo = document.getElementById("reactionSearch").value.trim().toLowerCase();
  document.querySelectorAll(".reaction-card").forEach((card) => {
    const correspondeBusca = !termo || card.dataset.busca.includes(termo);
    const correspondeTipo = reactionTipoFiltroAtivo === "todas" || card.dataset.tipo === reactionTipoFiltroAtivo;
    card.style.display = correspondeBusca && correspondeTipo ? "" : "none";
  });
  // esconde o cabeçalho de um grupo se nenhum card dele sobrou visível
  document.querySelectorAll(".rc-group-heading").forEach((heading) => {
    const tipo = heading.dataset.tipoGrupo;
    const algumVisivel = [...document.querySelectorAll(`.reaction-card[data-tipo="${tipo}"]`)].some((c) => c.style.display !== "none");
    heading.style.display = algumVisivel ? "" : "none";
  });
}

document.getElementById("reactionSearch").addEventListener("input", aplicarFiltroReacoes);

document.querySelectorAll(".rc-filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    reactionTipoFiltroAtivo = chip.dataset.tipo;
    document.querySelectorAll(".rc-filter-chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    aplicarFiltroReacoes();
  });
});

