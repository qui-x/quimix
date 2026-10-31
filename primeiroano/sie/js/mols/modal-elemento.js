/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS (interface)
   ARQUIVO: modal-elemento.js
   ───────────────────────────────────────────────────────────────
   Abre e fecha o modal de ficha do elemento — a "carteira de
   identidade" completa (massa, família, período, estado físico,
   prótons/nêutrons/elétrons, configuração eletrônica, obtenção,
   curiosidade, cartões de propriedade). Versão nova, escrita para o
   SIE (não é a mesma do SITP — não tem grade de 118 células nem raio
   atômico).
   Depende de: dadossitp.js (via ELEMENTO_POR_SIMBOLO_MOLS, MASSA,
               FAMILIA, ESTADO_LABEL, ESTADO_DESC, FUSAO, EBULICAO,
               CURIOSIDADES), mols/config-eletronica.js,
               mols/estado-fisico.js, mols/painel-propriedades.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ===================================================================
   MODAL DE ELEMENTO — abrir/fechar (nova, escrita para o SIE)
   ===================================================================
   Não é a abrirModal()/fecharModal() do SITP copiada — aquela mexe em
   grade de 118 células, filtros e modo daltônico que o Mols não tem.
   Esta é uma versão nova, escrita para o contexto do SIE, que só
   monta o conteúdo do modal a partir do símbolo do elemento e chama
   as funções extraídas acima. Estado físico sempre a TEMP_REF (25°C,
   dadossitp.js) — sem slider.
   =================================================================== */
const modalOverlayMols = document.getElementById("modalOverlayMols");

const btnCloseMols = document.getElementById("btnCloseMols");

let elementoAbertoMols = null;

function abrirModalElemento(simbolo) {
  const el = ELEMENTO_POR_SIMBOLO_MOLS[simbolo];
  if (!el) { console.warn(`Elemento "${simbolo}" não encontrado em dadossitp.js.`); return; }

  const Z = el.numero;
  const est = estadoNaTemperaturaMols(Z, TEMP_REF);
  const ccHex = getCatColorHexMols(el.cat);

  const sym = document.getElementById("modalSymbolMols");
  sym.textContent = el.simbolo; sym.style.color = ccHex;
  document.getElementById("modalNumberMols").textContent = "#" + Z;
  const nm = document.getElementById("modalNameMols");
  nm.textContent = el.nome; nm.style.color = ccHex;

  const massaBox = document.getElementById("modalMassMols");
  massaBox.innerHTML = "";
  massaBox.append(`Massa: ${MASSA[Z] || "—"} u`);
  const iv = MASSA_INTERVALO[Z];
  if (iv) {
    const nota = document.createElement("span");
    nota.className = "modal-mass-intervalo";
    nota.textContent = `intervalo [${iv[0]}; ${iv[1]}] u`;
    nota.title = "A massa atômica deste elemento varia naturalmente conforme a origem da amostra, por causa da variação na abundância dos seus isótopos. A CIAAW publica um intervalo em vez de um valor único.";
    massaBox.appendChild(nota);
  }

  const familia = FAMILIA[el.grupo] || "—";
  const periodo = (el.periodo || 0) <= 7 ? el.periodo : (el.cat === "Lantanídeo" ? 6 : 7);
  document.getElementById("modalMetaMols").textContent = `Família ${familia} · Período ${periodo} · ${el.cat}`;

  const estHex = { S: "var(--text-primary)", L: "var(--accent-main)", G: "var(--accent-amber)", "?": "var(--text-secondary)" }[est] || "var(--text-secondary)";
  document.getElementById("modalBadgesMols").innerHTML =
    `<span class="badge" style="background:${estHex}22;color:${estHex};border-color:${estHex}55">${ESTADO_LABEL[est]}</span>` +
    `<span class="badge" style="background:${ccHex}22;color:${ccHex};border-color:${ccHex}55">${el.cat}</span>`;

  document.getElementById("stateCardMols").style.borderLeftColor = estHex;

  const f = FUSAO[Z], e = EBULICAO[Z];
  const fmt = (v) => v === null ? "—" : String(v).replace(".", ",") + " °C";
  document.getElementById("modalStateMols").innerHTML =
    `<p class="est-desc">${ESTADO_DESC[est]}</p>
     <div class="est-pontos">
       <span><b>Fusão</b> ${fmt(f)}</span>
       <span><b>${sublimaMols(Z) ? "Sublimação" : "Ebulição"}</b> ${fmt(e)}</span>
     </div>`
    + (sublimaMols(Z) ? `<p class="est-nota">A 1 atm este elemento passa de sólido direto a gás: nunca é líquido.</p>` : "");

  const N = calcNeutronsMols(Z);
  document.getElementById("modalParticlesMols").innerHTML =
    `<div class="particle-box"><span class="pval" style="color:var(--orb-d)">${Z}</span><span class="plabel">Prótons</span></div>` +
    `<div class="particle-box"><span class="pval" style="color:var(--orb-f)">${N}</span><span class="plabel">Nêutrons</span></div>` +
    `<div class="particle-box"><span class="pval" style="color:var(--orb-s)">${Z}</span><span class="plabel">Elétrons</span></div>`;

  document.getElementById("modalConfigMols").innerHTML = renderConfigMols(Z);
  document.getElementById("modalObtencaoMols").textContent = el.obtencao || "—";
  document.getElementById("modalCuriosidadeMols").textContent = (typeof CURIOSIDADES !== "undefined" && CURIOSIDADES[Z]) || "—";
  renderCardsPropriedadeMols(Z, el);

  elementoAbertoMols = simbolo;
  modalOverlayMols.classList.add("aberto");
  modalOverlayMols.setAttribute("aria-hidden", "false");
  anunciar(`${el.nome}, número atômico ${Z}, ${el.cat}, ${ESTADO_LABEL[est]}.`);
  setTimeout(() => btnCloseMols.focus(), 260);
}

function fecharModalElemento() {
  modalOverlayMols.classList.remove("aberto");
  modalOverlayMols.setAttribute("aria-hidden", "true");
  document.querySelector("#modalMols .modal-body-mols").scrollTop = 0;
  const simboloFechado = elementoAbertoMols;
  elementoAbertoMols = null;
  anunciar("Modal fechado.");
  // Ganchos por quem estava esperando o fechamento — hoje só a
  // investigação de massa molar (aoFecharModalMols), definida mais
  // abaixo no arquivo. A checagem typeof evita erro caso este arquivo
  // seja usado num contexto sem o módulo Mols carregado.
  if (typeof aoFecharModalMols === "function") aoFecharModalMols(simboloFechado);
  return simboloFechado;
}

btnCloseMols.addEventListener("click", () => fecharModalElemento());

modalOverlayMols.addEventListener("click", (e) => { if (e.target === modalOverlayMols) fecharModalElemento(); });

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlayMols.classList.contains("aberto")) fecharModalElemento();
});

