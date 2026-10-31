/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS
   ARQUIVO: interacao-atomos.js
   ───────────────────────────────────────────────────────────────
   O clique num átomo do canvas: primeiro clique num elemento novo
   abre o modal de ficha (é lá que o aluno "descobre" a massa);
   fechar o modal já conta esse primeiro átomo. Cliques seguintes no
   mesmo elemento (mesma substância) contam direto, sem reabrir o
   modal.
   Depende de: core/estado-reacao.js, mols/reacao-investigar.js,
               mols/modal-elemento.js, dadossitp.js (MASSA).
═══════════════════════════════════════════════════════════════ */

'use strict';

// Chamada pelo hit-test do canvas (ver o pointerdown mais abaixo), não
// mais por um clique de ficha na barra lateral.
function cliqueAtomoMols(atomo) {
  const formula = atomo.molsFormula;
  const indice = atomo.molsIndice;
  const simbolo = atomo.elemento;
  if (formula === undefined || indice === undefined) return; // átomo fora da investigação atual
  const substancia = molsSubstancias[formula];
  if (!substancia) return;
  const registro = substancia.contagem[simbolo];
  if (!registro) return;

  if (registro.massa === null) {
    // 1º clique nesse elemento NESTA substância: abre o modal completo
    // do SITP — é lá que o aluno localiza o dado de massa. Ao fechar,
    // marcarAtomoContado registra a massa e já conta este clique como
    // a 1ª ocorrência.
    molsFichaPendente = { formula, indice };
    abrirModalElemento(simbolo);
    return;
  }
  if (registro.contadosIdx.has(indice)) return; // já contada, clique não faz nada
  marcarAtomoContado(formula, indice, simbolo);
}

// Hit-test do canvas: mesma encontrarAtomoEm() que o arrastar-e-ligar da
// Estequiometria usa. Só reage quando o módulo Mols está ativo e há uma
// investigação em andamento — não interfere no fluxo de reação.
canvas.addEventListener("pointerdown", (evento) => {
  if (moduloAtivo !== "mols" || !molsReacaoAtual) return;
  const { x, y } = pointFromEvent(evento);
  const atomo = encontrarAtomoEm(x, y);
  if (atomo) cliqueAtomoMols(atomo);
});

// O "anel" de estado ao redor do átomo não é atualizado aqui: ele é
// desenhado a cada quadro por dibujarAtomo(), lendo molsSubstancias
// diretamente — atualizar o estado já é suficiente pro próximo frame
// mostrar o anel certo, sem precisar tocar em nenhum elemento de DOM.
function marcarAtomoContado(formula, indice, simbolo) {
  const registro = molsSubstancias[formula].contagem[simbolo];
  registro.contadosIdx.add(indice);
  const numero = registro.contadosIdx.size;
  anunciar(`${simbolo} em ${rotuloFormula(formula)}, ocorrência ${numero} de ${registro.total} contada.`);
  renderizarTallyMols();
  atualizarModeIndicator();
}

// Chamada quando o modal fecha — se havia um átomo pendente (o clique
// que ABRIU o modal), registra a massa e já conta aquele clique como a
// 1ª ocorrência, sem exigir um segundo clique no mesmo átomo.
function aoFecharModalMols(simboloFechado) {
  if (molsFichaPendente === null || !simboloFechado) return;
  const { formula, indice } = molsFichaPendente;
  molsFichaPendente = null;
  const substancia = molsSubstancias[formula];
  const registro = substancia && substancia.contagem[simboloFechado];
  if (!registro || registro.massa !== null) return; // segurança: não é o fluxo esperado

  const bruta = MASSA[ELEMENTO_POR_SIMBOLO_MOLS[simboloFechado].numero];
  registro.massa = parseFloat(String(bruta).replace(/[\[\]]/g, "").replace(",", "."));
  marcarAtomoContado(formula, indice, simboloFechado);
}

