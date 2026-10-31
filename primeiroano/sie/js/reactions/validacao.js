/* ═══════════════════════════════════════════════════════════════
   CAMADA: ESTEQUIOMETRIA (validação)
   ARQUIVO: validacao.js
   ───────────────────────────────────────────────────────────────
   Confere se a equação está balanceada, calcula o rendimento teórico
   (reagente limitante, grau de avanço da reação) e compara o que o
   aluno montou no canvas com o esperado — o botão "Ajustar e Reagir"
   dispara tudo isso e preenche o painel "Dados da Reação".
   Depende de: core/estado-reacao.js, reactions/analise-grupos.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Calcula o rendimento TEÓRICO da reação a partir do reagente limitante e
// do multiplicador da equação balanceada (coeffs) — não apenas "tudo está
// com octeto satisfeito", mas "a quantidade de produto corresponde
// exatamente ao que a estequiometria da reação prevê". Sem essa conferência,
// seria possível "validar" simplesmente desfazendo tudo e reformando os
// próprios reagentes originais (que também satisfazem octeto/duteto).
// Checagem PURA de balanceamento — mesma lógica que verificarBalanceamentoUI
// já usava, extraída pra poder ser reaproveitada também na hora de
// sortear o estado inicial (garantir que não caia por acaso já
// balanceado, ver gerarCoeficientesIniciais).
function equacaoEstaBalanceada(r, coeffs) {
  const reagentes = r.reagents.map((rg) => rg.formula);
  const lados = { esq: {}, dir: {} };
  Object.entries(coeffs).forEach(([formula, coef]) => {
    const lado = reagentes.includes(formula) ? "esq" : "dir";
    Object.entries(contarAtomos(formula)).forEach(([simbolo, n]) => {
      lados[lado][simbolo] = (lados[lado][simbolo] || 0) + coef * n;
    });
  });
  const simbolos = new Set([...Object.keys(lados.esq), ...Object.keys(lados.dir)]);
  for (const s of simbolos) {
    if ((lados.esq[s] || 0) !== (lados.dir[s] || 0)) return false;
  }
  return true;
}

function calcularRendimentoTeorico(r) {
  // Usa coeffsOriginais — a proporção REAL da reação — nunca o que está
  // na caixinha (r.coeffs), que agora É o palpite que o aluno ainda
  // está ajustando. "Validar" e o rendimento teórico não podem
  // depender de uma equação que pode estar errada nesse instante.
  const coeffs = r.coeffsOriginais;
  const reagentesFormulas = r.reagents.map((rg) => rg.formula);
  const qtdInicial = (f) => currentQuantities[f] || 0;

  const razoes = reagentesFormulas.map((f) => qtdInicial(f) / coeffs[f]);
  const extensao = Math.floor(Math.min(...razoes) + 1e-9); // nº de "eventos de reação" completos possíveis

  const esperado = {};
  Object.keys(coeffs).forEach((f) => {
    esperado[f] = reagentesFormulas.includes(f)
      ? qtdInicial(f) - extensao * coeffs[f]   // sobra esperada do reagente
      : extensao * coeffs[f];                  // rendimento esperado do produto
  });
  return { extensao, esperado, reagentesFormulas };
}

function compararComEsperado(esperado, contagemFormulas) {
  const divergencias = [];
  Object.entries(esperado).forEach(([f, qtdEsperada]) => {
    const atual = contagemFormulas[f] || 0;
    if (atual !== qtdEsperada) divergencias.push({ formula: f, atual, esperado: qtdEsperada });
  });
  Object.entries(contagemFormulas).forEach(([f, atual]) => {
    if (!(f in esperado) && atual > 0) divergencias.push({ formula: f, atual, esperado: 0 });
  });
  return divergencias;
}

document.getElementById("validateBtn").addEventListener("click", () => {
  const r0 = REACTIONS[currentReactionKey];
  if (r0.modo === "metalico") {
    setStatus("Ligação metálica não tem fórmula fixa para validar — explore o mar de elétrons livremente.", "info");
    return;
  }

  const incompletos = listarIncompletos();
  if (incompletos.length > 0) {
    setStatus(`Avanço bloqueado: ${incompletos.length} átomo(s) com ligação incompleta (octeto/duteto não satisfeito).`, "error");
    return;
  }

  const grupos = calcularGrupos();
  const contagemFormulas = {};
  grupos.forEach((g) => {
    const { formula, multiplicidade } = analisarGrupo(g);
    contagemFormulas[formula] = (contagemFormulas[formula] || 0) + multiplicidade;
  });

  const r = REACTIONS[currentReactionKey];
  const { esperado, reagentesFormulas } = calcularRendimentoTeorico(r);
  const divergencias = compararComEsperado(esperado, contagemFormulas);

  if (divergencias.length > 0) {
    const detalhe = divergencias
      .map((d) => `${d.formula}: formado(s) ${d.atual}, esperado(s) ${d.esperado}`)
      .join(" | ");
    setStatus(
      `Octeto satisfeito, mas a quantidade não corresponde ao multiplicador da equação balanceada para o reagente limitante. ${detalhe}. Continue reorganizando até atingir o rendimento teórico.`,
      "error"
    );
    return;
  }

  state = "VALIDATED";
  congelarCena();
  atualizarRotuloBotaoEnergia();

  const sobras = Object.entries(contagemFormulas).filter(([f]) => reagentesFormulas.includes(f) && contagemFormulas[f] > 0);
  let banner = "Montagem validada — produtos formados: " +
    Object.entries(contagemFormulas).filter(([f]) => !reagentesFormulas.includes(f)).map(([f, n]) => `${n} ${f}`).join(", ") + ".";

  if (sobras.length > 0) {
    const excessoTxt = sobras.map(([f, n]) => `${f} sobrou (Excesso): ${n} unidade(s)`).join(" | ");
    const limitanteTxt = reagentesFormulas.filter((f) => !sobras.some(([sf]) => sf === f)).map((f) => `${f} esgotado (Limitante)`).join(" | ");
    banner += ` ${limitanteTxt} | ${excessoTxt}`;
  } else {
    banner += " Proporção exata — nenhum reagente em excesso.";
  }

  setStatus(banner, "success");
  document.getElementById("validateBtn").disabled = true;
});

