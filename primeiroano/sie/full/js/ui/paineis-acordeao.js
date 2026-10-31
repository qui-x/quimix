/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: paineis-acordeao.js
   ───────────────────────────────────────────────────────────────
   Abrir/fechar os painéis recolhíveis da sidebar direita, com
   abertura exclusiva (abrir um fecha os outros do mesmo grupo).
   Depende de: nada além do HTML.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   15c. PAINÉIS COLAPSÁVEIS
   O estado vive no .panel (data-open), não no <button>: CSS não sobe
   na árvore, então com a classe no botão era impossível estilizar a
   borda do painel, o badge e o chevron a partir do estado — por isso
   antes "só o chevron mudava" quando um painel abria.
   Em .accordion--exclusive, abrir um painel fecha os outros. É esse
   mecanismo, somado ao painel aberto crescer via flex, que faz a coluna
   direita caber sem barra de rolagem.
   --------------------------------------------------------------- */
document.querySelectorAll(".panel-header").forEach((header) => {
  const panel = header.closest(".panel");
  const body = document.getElementById(header.getAttribute("aria-controls"));
  const grupo = panel.closest(".accordion--exclusive");

  panel.dataset.open = header.getAttribute("aria-expanded") === "true" ? "true" : "false";
  if (panel.dataset.open === "true" && body) body.classList.add("scroll-ready");

  header.addEventListener("click", () => {
    const estavaAberto = panel.dataset.open === "true";
    playTone(estavaAberto ? 500 : 750, .06, .04); // mesmo padrão do SIMA: grave ao fechar, agudo ao abrir

    if (!estavaAberto && grupo) {
      grupo.querySelectorAll('.panel[data-open="true"]').forEach((outro) => {
        outro.dataset.open = "false";
        const btn = outro.querySelector(".panel-header");
        if (btn) btn.setAttribute("aria-expanded", "false");
        const bd = outro.querySelector(".panel-body");
        if (bd) bd.classList.remove("scroll-ready");
      });
    }

    panel.dataset.open = estavaAberto ? "false" : "true";
    header.setAttribute("aria-expanded", String(!estavaAberto));
    if (!body) return;

    if (estavaAberto) {
      body.classList.remove("scroll-ready");
      return;
    }

    // O scroll interno só passa a existir DEPOIS da animação: assim a
    // barra não aparece e desaparece durante o abre-e-fecha.
    const aoTerminar = (e) => {
      if (e.target !== body || e.propertyName !== "max-height") return;
      body.classList.add("scroll-ready");
      body.removeEventListener("transitionend", aoTerminar);
    };
    body.addEventListener("transitionend", aoTerminar);
  });
});

