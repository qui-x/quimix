/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS
   ARQUIVO: tally-resultado.js
   ───────────────────────────────────────────────────────────────
   Verifica se uma substância já foi totalmente investigada, calcula
   sua massa molar (soma das massas × contagem de átomos) e a massa
   total na reação, renderiza a tabela de contagem por substância, e
   o resumo final com a conferência da Lei de Lavoisier (massa dos
   reagentes = massa dos produtos) quando TUDO já foi investigado.
   Depende de: mols/reacao-investigar.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function substanciaCompletaMols(formula) {
  const registros = Object.values(molsSubstancias[formula].contagem);
  return registros.every((r) => r.massa !== null && r.contadosIdx.size === r.total);
}

// Massa de 1 mol da substância — soma (massa atômica × átomos POR
// UNIDADE de fórmula). Não muda com o coeficiente da reação: é a mesma
// se a equação pedir 1 ou 12 unidades dela.
function massaMolarSubstanciaMols(formula) {
  let total = 0;
  Object.values(molsSubstancias[formula].contagem).forEach((r) => { total += r.massa * r.porUnidade; });
  return total;
}

// Massa REAL presente na reação — massa molar × coeficiente
// estequiométrico. É essa que soma dos dois lados da equação (Lei de
// Lavoisier): a massa total dos reagentes tem que bater com a dos
// produtos.
function massaTotalSubstanciaMols(formula) {
  return massaMolarSubstanciaMols(formula) * molsSubstancias[formula].coeficiente;
}

// Tabela agrupada por substância: cabeçalho (fórmula + papel), linhas
// de elemento — a CONTAGEM já é o total real da reação (coeficiente ×
// átomos por unidade), não uma unidade de fórmula só — e, assim que
// TODOS os átomos daquela substância estiverem descobertos e contados,
// duas linhas de resultado: massa molar (1 mol) e massa total (a
// quantidade real que a equação pede). Sem precisar de nenhum botão
// "Pronto". Quando TODAS as substâncias da reação estão completas, o
// resumo final aparece, com a conferência de Lavoisier.
function renderizarTallyMols() {
  molsTallyBody.innerHTML = "";
  let todasCompletas = Object.keys(molsSubstancias).length > 0;

  Object.entries(molsSubstancias).forEach(([formula, substancia]) => {
    const coef = substancia.coeficiente;
    const prefixoCoef = coef > 1 ? `${coef} × ` : "";
    const trCab = document.createElement("tr");
    trCab.className = "mols-tally-substancia" + (substancia.papel === "produto" ? " mols-tally-substancia--produto" : "");
    trCab.innerHTML = `<td colspan="3">${prefixoCoef}${rotuloFormula(formula)}<span class="mols-substance-papel">${substancia.papel}</span></td>`;
    molsTallyBody.appendChild(trCab);

    Object.entries(substancia.contagem).forEach(([simbolo, registro]) => {
      const completo = registro.contadosIdx.size === registro.total;
      const tr = document.createElement("tr");
      tr.className = completo ? "is-completo" : "";
      tr.innerHTML = `
        <td>${simbolo}</td>
        <td>${registro.massa === null ? "?" : registro.massa.toFixed(3).replace(".", ",")}</td>
        <td>${registro.contadosIdx.size}/${registro.total}${completo ? ' <svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg>' : ""}</td>`;
      molsTallyBody.appendChild(tr);
    });

    if (substanciaCompletaMols(formula)) {
      const massaMolar = massaMolarSubstanciaMols(formula);
      const trMolar = document.createElement("tr");
      trMolar.className = "mols-tally-resultado";
      trMolar.innerHTML = `<td colspan="3">Massa molar (1 mol): ${massaMolar.toFixed(2).replace(".", ",")} g/mol</td>`;
      molsTallyBody.appendChild(trMolar);

      if (coef > 1) {
        const massaTotal = massaTotalSubstanciaMols(formula);
        const trTotal = document.createElement("tr");
        trTotal.className = "mols-tally-resultado";
        trTotal.innerHTML = `<td colspan="3">Massa total nesta reação (${coef} mol): ${massaTotal.toFixed(2).replace(".", ",")} g</td>`;
        molsTallyBody.appendChild(trTotal);
      }
    } else {
      todasCompletas = false;
    }
  });

  if (todasCompletas) {
    mostrarResumoFinalMols();
  } else {
    molsResultadoEl.hidden = true;
  }
}

// Resumo final — junta a massa total de cada substância (coeficiente ×
// massa molar) e confere a Lei de Lavoisier: massa total dos reagentes
// tem que ser igual à massa total dos produtos. É a mesma conservação
// de massa que a equação balanceada já garante em número de átomos —
// aqui ela aparece em gramas, fechando o ciclo entre balanceamento e
// massa molar que o módulo Mols existe pra ensinar.
function mostrarResumoFinalMols() {
  const formulas = Object.keys(molsSubstancias);

  const massaReagentes = formulas
    .filter((f) => molsSubstancias[f].papel === "reagente")
    .reduce((soma, f) => soma + massaTotalSubstanciaMols(f), 0);
  const massaProdutos = formulas
    .filter((f) => molsSubstancias[f].papel === "produto")
    .reduce((soma, f) => soma + massaTotalSubstanciaMols(f), 0);
  // margem pequena pra arredondamento de ponto flutuante, não pra erro químico real
  const conserva = Math.abs(massaReagentes - massaProdutos) < 0.05;

  const fmt = (x) => x.toFixed(2).replace(".", ",");
  const linhasPorSubstancia = formulas
    .map((formula) => {
      const sub = molsSubstancias[formula];
      const coef = sub.coeficiente;
      const detalhe = coef > 1 ? `${coef} mol × ${fmt(massaMolarSubstanciaMols(formula))} g/mol = ${fmt(massaTotalSubstanciaMols(formula))} g` : `${fmt(massaMolarSubstanciaMols(formula))} g/mol`;
      return `<strong>${rotuloFormula(formula)}</strong>: ${detalhe}`;
    })
    .join(" · ");

  const linhaLavoisier = `<p class="mols-lavoisier ${conserva ? "is-ok" : "is-erro"}">
    ${conserva ? '<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg>' : '<svg class="icon" aria-hidden="true"><use href="#ic-close"/></svg>'} Massa dos reagentes (${fmt(massaReagentes)} g) ${conserva ? "=" : "≠"} massa dos produtos (${fmt(massaProdutos)} g) — Lei de Lavoisier.
  </p>`;

  molsResultadoEl.hidden = false;
  molsResultadoEl.innerHTML = `Reação totalmente investigada — ${linhasPorSubstancia}${linhaLavoisier}`;
  anunciar(`Todas as substâncias da reação foram investigadas. Massa dos reagentes: ${fmt(massaReagentes)} gramas. Massa dos produtos: ${fmt(massaProdutos)} gramas. ${conserva ? "A massa se conserva, confirmando a Lei de Lavoisier." : "Atenção: as massas não bateram — confira a contagem."}`);
}

