/* ═══════════════════════════════════════════════════════════════
   CAMADA: ESTEQUIOMETRIA
   ARQUIVO: calculadora.js
   ───────────────────────────────────────────────────────────────
   Calcula a massa molar de uma fórmula química a partir dos
   elementos que a compõem, e atualizarCalculadora() — o painel que
   mostra esse cálculo passo a passo para a substância em foco.
   Depende de: core/estado-reacao.js, data/elementos-reacao.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Extrai a massa molar de uma fórmula (ex.: "CO2", "H2O", "CCl4") somando
// a massa de cada elemento presente — mesma fonte de dados (ELEMENTS)
// usada em todo o resto do simulador, então calculadora, HUD e validação
// nunca podem divergir entre si.
function massaMolarDaFormula(formula) {
  const regex = /([A-Z][a-z]?)(\d*)/g;
  let total = 0, m;
  while ((m = regex.exec(formula)) !== null) {
    if (!m[1]) continue;
    const contagem = m[2] ? parseInt(m[2], 10) : 1;
    if (ELEMENTS[m[1]]) total += ELEMENTS[m[1]].molar * contagem;
  }
  return total;
}

// Painel "Calculadora Estequiométrica": deixa o usuário testar livremente
// as quantidades de reagentes (via os steppers) e ver, ANTES de montar
// qualquer átomo, qual é o reagente limitante e o rendimento teórico
// exato — reaproveita calcularRendimentoTeorico(), a mesma função usada
// pela validação, então o que a calculadora mostra é garantidamente o
// que será exigido para validar a montagem.
// Leitura da analise estequiometrica. Agora em <dl>: pares termo->valor
// tem semantica propria, que o leitor de tela navega (WCAG 1.3.1). E sem
// text-overflow:ellipsis — antes o dado central do simulador virava
// "3 ÷ 1 = 3.0…" quando a coluna estreitava.
// O reagente limitante vem PRIMEIRO, porque e a leitura que importa; e e
// identificado pela MENOR RAZAO, nao por "quem nao sobrou".
function atualizarCalculadora() {
  const container = document.getElementById("calcPanel");
  container.innerHTML = "";
  const badges = [document.getElementById("analysisBadge"), document.getElementById("reactionDataBadge")].filter(Boolean);
  if (!reacaoEscolhida) { badges.forEach((b) => { b.textContent = "—"; b.removeAttribute("title"); }); return; }

  const r = REACTIONS[currentReactionKey];

  // Badge do cabeçalho mostra QUAL reação está selecionada — antes
  // mostrava o reagente limitante (só calculado lá embaixo, e some de
  // novo ao trocar de reação); agora fica fixo assim que a reação é
  // escolhida, com o texto completo em title pra quando o nome for
  // maior que o espaço da pílula. Os dois painéis (Análise e Dados da
  // Reação) mostram o mesmo nome — é a mesma reação, só a INTERAÇÃO
  // que está separada em dois lugares agora.
  badges.forEach((b) => { b.textContent = r.label; b.title = r.label; });

  const par = (rotulo, valor, className) => {
    const dr = document.createElement("div");
    dr.className = "dr" + (className ? ` ${className}` : "");
    dr.innerHTML = `<dt>${rotulo}</dt><dd>${valor}</dd>`;
    container.appendChild(dr);
  };

  if (r.modo === "metalico") {
    par("Modelo", "Mar de elétrons deslocalizados");
    par("Energia de ligação", "70–850 kJ/mol");
    par("Conduz calor e eletricidade", "Sempre");
    par("Maleável e dúctil", "Sim");
    return;
  }

  // Caráter da ligação — calculado a partir da eletronegatividade real
  // (mesma tabela e mesma regra de Pauling que o SILQ usa), não um
  // rótulo estático. Mostra o ΔEN de verdade mesmo quando o veredito
  // (iônica/covalente) já está fixo no catálogo — é isso que torna a
  // classificação uma CONTA que o aluno pode conferir, não uma
  // afirmação pra decorar.
  if (r.caraterLigacao) {
    const valorEN = r.deltaEN !== undefined ? `ΔEN = ${r.deltaEN.toFixed(2).replace(".", ",")} · ${r.caraterLigacao}` : r.caraterLigacao;
    par("Caráter da ligação", valorEN, "is-bond-character");
  }

  const { esperado, reagentesFormulas } = calcularRendimentoTeorico(r);

  // coeffsOriginais aqui, não r.coeffs — "Dados da Reação" mostra a
  // química de verdade (o que aconteceria com o que está no canvas
  // agora), independente de a equação em "Ajustar e Reagir" já estar
  // balanceada ou não.
  const razoes = r.reagents.map((rg) => ({
    label: rg.label,
    qtd: currentQuantities[rg.formula],
    coef: r.coeffsOriginais[rg.formula],
    razao: currentQuantities[rg.formula] / r.coeffsOriginais[rg.formula],
  }));
  const menorRazao = Math.min(...razoes.map((x) => x.razao));
  const limitantes = razoes
    .filter((x) => Math.abs(x.razao - menorRazao) < 1e-9)
    .map((x) => x.label);

  par("Reagente limitante", limitantes.join(" e "), "is-limiting");
  par("Grau de avanço (ξ)", `${menorRazao.toFixed(2)} mol`);

  razoes.forEach((x) => {
    par(`Razão ${x.label}`, `${x.qtd} ÷ ${x.coef} = ${x.razao.toFixed(2)}`);
  });

  // Só mol aqui — massa em gramas saiu de propósito: é o módulo Mols
  // (Investigar Reação) que já faz essa conta, elemento por elemento,
  // como investigação em si. Duplicar o número pronto aqui roubaria o
  // motivo de existir daquele módulo.
  Object.entries(esperado).forEach(([formula, qtd]) => {
    const ehProduto = !reagentesFormulas.includes(formula);
    par(
      `${ehProduto ? "Produto" : "Sobra"} ${rotuloFormula(formula)}`,
      `${qtd} mol`,
      ehProduto ? "is-product" : "is-leftover"
    );
  });
}

