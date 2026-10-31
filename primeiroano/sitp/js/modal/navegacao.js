/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODAL
   ARQUIVO: navegacao.js
   ───────────────────────────────────────────────────────────────
   Botões "◀ Anterior" / "Próximo ▶" no topo do modal — trocam de
   elemento SEM fechar o modal (chamam abrirModal() de novo, com o
   próximo/anterior número atômico). Funciona igual em desktop e no
   bottom sheet mobile: a linha de botões faz parte do cabeçalho do
   modal, não de nenhuma seção específica.

   Não duplica a lista de elementos: junta as 3 listas que já existem
   (elementosBase + lantanideos + actinideos — mesma técnica já usada
   em js/render/fullscreen.js) e ordena por número atômico uma única
   vez, no carregamento da página.

   Depende de: dadossitp.js (elementosBase, lantanideos, actinideos),
               modal/estado-modal.js (elementoAtivo), modal/abrir-fechar.js
               (abrirModal). Precisa carregar DEPOIS dos três.
═══════════════════════════════════════════════════════════════ */

'use strict';

const TODOS_ELEMENTOS_NAV = [...elementosBase, ...lantanideos, ...actinideos]
  .sort((a, b) => a.numero - b.numero);
const Z_MIN_NAV = TODOS_ELEMENTOS_NAV[0].numero;
const Z_MAX_NAV = TODOS_ELEMENTOS_NAV[TODOS_ELEMENTOS_NAV.length - 1].numero;

/* Troca para o elemento em elementoAtivo+delta (delta = -1 ou +1).
   Não faz nada nas pontas (antes do H, depois do Og) — os botões já
   ficam desabilitados nesse caso, mas a checagem aqui protege contra
   Enter/Espaço num botão que perdeu o estado disabled por algum motivo. */
function navegarElemento(delta) {
  if (elementoAtivo == null) return;
  const alvo = elementoAtivo + delta;
  if (alvo < Z_MIN_NAV || alvo > Z_MAX_NAV) return;
  const el = TODOS_ELEMENTOS_NAV.find(e => e.numero === alvo);
  const div = document.querySelector(`[data-z="${alvo}"]`);
  if (!el || !div) return;
  abrirModal(el, div);
  // abrirModal() sempre move o foco pro ✕ (setTimeout 260ms) — pra quem
  // está navegando de Anterior/Próximo em sequência, devolve o foco pro
  // MESMO botão logo em seguida, assim dá pra continuar navegando sem
  // precisar tabular de volta.
  const btn = document.getElementById(delta < 0 ? 'btnPrevEl' : 'btnNextEl');
  if (btn) setTimeout(() => { if (!btn.disabled) btn.focus(); }, 280);
}

/* Desabilita Anterior em Z=1 (Hidrogênio) e Próximo em Z=118
   (Oganessônio) — chamada toda vez que um elemento abre (ver
   abrirModal() em abrir-fechar.js). */
function atualizarBotoesNavegacao() {
  const btnPrev = document.getElementById('btnPrevEl');
  const btnNext = document.getElementById('btnNextEl');
  if (!btnPrev || !btnNext) return;
  btnPrev.disabled = elementoAtivo == null || elementoAtivo <= Z_MIN_NAV;
  btnNext.disabled = elementoAtivo == null || elementoAtivo >= Z_MAX_NAV;
}

document.addEventListener('DOMContentLoaded', () => {
  const btnPrev = document.getElementById('btnPrevEl');
  const btnNext = document.getElementById('btnNextEl');
  if (btnPrev) btnPrev.addEventListener('click', () => navegarElemento(-1));
  if (btnNext) btnNext.addEventListener('click', () => navegarElemento(1));
});
