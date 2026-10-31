/* ═══════════════════════════════════════════════════════════════
   CAMADA: ESTEQUIOMETRIA (UI de coeficientes)
   ARQUIVO: coeficientes-ui.js
   ───────────────────────────────────────────────────────────────
   Conta átomos por elemento numa fórmula, verifica se a equação está
   balanceada em tempo real (enquanto o aluno ajusta), restaura os
   coeficientes-padrão da reação, e renderizarQuantidades() — a função
   que desenha os steppers +/- de cada substância no painel de
   controle.
   Depende de: core/estado-reacao.js, data/reacoes.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   15a. COEFICIENTE + QUANTIDADE — mesma caixinha, papéis diferentes
   Antes existiam DOIS controles por substância em dois lugares: a
   bolinha do coeficiente numa "equação interativa" à parte, e a caixa
   de quantidade aqui embaixo. Isso duplicava a interação sem motivo —
   os dois são "entrada", só que uma é fixa (o coeficiente da equação
   balanceada) e a outra é livre (quanto você de fato tem). Agora as
   duas vivem na MESMA linha, com a MESMA linguagem visual retangular
   que o painel de Análise já usava — sem introduzir um segundo padrão
   de caixa (redonda) só para a equação.
   --------------------------------------------------------------- */

// Conta os átomos de cada elemento numa fórmula. Usa a MESMA varredura de
// massaMolarDaFormula, para não existirem no projeto duas leituras de
// fórmula que possam divergir entre si.
function contarAtomos(formula) {
  const regex = /([A-Z][a-z]?)(\d*)/g;
  const conta = {};
  let m;
  while ((m = regex.exec(formula)) !== null) {
    if (!m[1]) continue;
    conta[m[1]] = (conta[m[1]] || 0) + (m[2] ? parseInt(m[2], 10) : 1);
  }
  return conta;
}

// Lei de Lavoisier: cálculo estequiométrico só vale para equação
// balanceada. Como os coeficientes agora são editáveis nas próprias
// caixinhas de quantidade, a conferência fica logo abaixo da lista —
// antes era possível ajustar "2 H₂ + 5 O₂ → 2 H₂O" e a calculadora
// obedecia sem avisar nada.
// WCAG 3.3.3: a mensagem diz QUAL elemento está errado e QUANTO falta.
// WCAG 3.3.3 pede indicação de erro — mas aqui é intencional NÃO dizer
// qual elemento está errado nem por quanto: é o próprio aluno quem
// precisa avaliar a equação e decidir o que ajustar, não uma dica
// pronta apontando a resposta. A mensagem fica só o veredito.
function verificarBalanceamentoUI() {
  const el = document.getElementById("eqBalance");
  const r = reacaoEscolhida ? REACTIONS[currentReactionKey] : null;

  if (!r || r.modo === "metalico") {
    el.textContent = "";
    el.removeAttribute("data-ok");
    return;
  }

  const ok = equacaoEstaBalanceada(r, r.coeffs);
  el.dataset.ok = String(ok);
  el.innerHTML = ok
    ? '<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> Equação Balanceada'
    : '<svg class="icon" aria-hidden="true"><use href="#ic-close"/></svg> Equação Não Balanceada';

  document.querySelectorAll(".qty-coef-input").forEach((i) => {
    if (ok) i.removeAttribute("data-desbalanceado");
    else i.setAttribute("data-desbalanceado", "true");
  });
}

// Devolve os coeficientes originais do catálogo. Sem isto, depois de
// desbalancear a equação o aluno só voltaria recarregando a página.
function restaurarCoeficientes() {
  if (!reacaoEscolhida) return;
  const r = REACTIONS[currentReactionKey];
  if (!r.coeffsOriginais) return;
  Object.keys(r.coeffsOriginais).forEach((f) => { r.coeffs[f] = r.coeffsOriginais[f]; });
  // Mesma sincronização que editar uma caixinha já faz — sem isso o
  // canvas ficava com as quantidades sorteadas antigas mesmo depois da
  // equação voltar pra proporção certa.
  r.reagents.forEach((rg) => { currentQuantities[rg.formula] = r.coeffs[rg.formula]; });
  montarReagentesAtual();
  renderizarQuantidades();
  atualizarCalculadora();
  setStatus("Coeficientes restaurados para a equação balanceada do catálogo — canvas remontado.", "info");
}

document.getElementById("restoreCoeffBtn").addEventListener("click", restaurarCoeficientes);

/* ---------------------------------------------------------------
   15b. EQUAÇÃO EM LINHA — coeficiente por termo, sempre editável
   Formatada como na literatura química: reagentes + operadores + seta
   + produtos, tudo em UMA linha reta quando cabe. Cada grupo
   (reagentes / produtos) é seu próprio flex-wrap — se a reação for
   grande demais pra uma linha só, a quebra cai exatamente entre os
   dois grupos, nunca no meio de um deles. Sem toggle "ativar edição":
   os coeficientes já nascem editáveis, mudar qualquer um já reformula
   a equação e refaz a conferência de balanceamento na hora.
   --------------------------------------------------------------- */

function renderizarQuantidades() {
  const linha = document.getElementById("eqLine");
  const balanceEl = document.getElementById("eqBalance");
  linha.innerHTML = "";

  if (!reacaoEscolhida) {
    linha.innerHTML = '<p class="qty-empty">Escolha uma reação em "Reações Prontas", aqui do lado.</p>';
    balanceEl.textContent = "";
    balanceEl.removeAttribute("data-ok");
    return;
  }

  const r = REACTIONS[currentReactionKey];

  if (r.modo === "metalico") {
    linha.innerHTML = '<p class="qty-empty">Ligação metálica não tem coeficientes: a proporção entre os átomos não é fixa.</p>';
    balanceEl.textContent = "";
    balanceEl.removeAttribute("data-ok");
    return;
  }

  const reagentesFormulas = r.reagents.map((rg) => rg.formula);
  const produtosFormulas = Object.keys(r.coeffs).filter((f) => !reagentesFormulas.includes(f));

  // Um termo = caixinha de coeficiente + fórmula, exatamente como
  // aparece impresso numa equação de verdade ("2 H₂"). "+" entre
  // termos do mesmo grupo; a seta "→" fica sozinha, entre os dois
  // grupos — nunca dentro de um deles.
  //
  // A caixinha edita r.coeffs diretamente — não existe mais um
  // "coeficiente da equação balanceada" fixo separado de uma
  // "quantidade real" escondida atrás de um badge. É a mesma caixa, o
  // mesmo número: nasce sorteado (ver gerarCoeficientesIniciais, quase
  // sempre errado de propósito) e o aluno ajusta até "Reação
  // balanceada" aparecer. A proporção certa continua guardada em
  // r.coeffsOriginais — usada por baixo dos panos pelos cálculos de
  // verdade (razão, limitante, rendimento), não pela caixinha.
  const criarTermo = (formula, rotulo) => {
    const termo = document.createElement("span");
    termo.className = "eq-term";
    termo.innerHTML = `
      <label class="eq-coef">
        <span class="sr-only">Quantidade de ${rotulo} nesta reação</span>
        <input type="number" class="qty-coef-input" min="1" max="20"
               value="${r.coeffs[formula]}" data-formula="${formula}" />
      </label>
      <span class="eq-formula">${rotulo}</span>`;
    return termo;
  };
  const criarMais = () => {
    const s = document.createElement("span");
    s.className = "eq-plus";
    s.setAttribute("aria-hidden", "true");
    s.textContent = "+";
    return s;
  };

  const grupoReagentes = document.createElement("span");
  grupoReagentes.className = "eq-group eq-group--reagentes";
  r.reagents.forEach((rg, i) => {
    if (i > 0) grupoReagentes.appendChild(criarMais());
    grupoReagentes.appendChild(criarTermo(rg.formula, rg.label));
  });

  const seta = document.createElement("span");
  seta.className = "eq-arrow";
  seta.setAttribute("aria-hidden", "true");
  seta.textContent = "→";
  const setaLeitura = document.createElement("span");
  setaLeitura.className = "sr-only";
  setaLeitura.textContent = " produz ";

  const grupoProdutos = document.createElement("span");
  grupoProdutos.className = "eq-group eq-group--produtos";
  produtosFormulas.forEach((f, i) => {
    if (i > 0) grupoProdutos.appendChild(criarMais());
    grupoProdutos.appendChild(criarTermo(f, rotuloFormula(f)));
  });

  linha.appendChild(grupoReagentes);
  linha.appendChild(seta);
  linha.appendChild(setaLeitura);
  linha.appendChild(grupoProdutos);

  // Coeficiente: muda a estrutura da equação, então remonta a linha
  // inteira e refaz a conferência de balanceamento.
  linha.querySelectorAll(".qty-coef-input").forEach((input) => {
    input.addEventListener("change", () => {
      const formula = input.dataset.formula;
      r.coeffs[formula] = Math.max(1, Math.min(20, parseInt(input.value, 10) || 1));

      // O canvas ficava preso na primeira montagem (currentQuantities só
      // era definida uma vez, a partir de defaultQty, na hora de
      // escolher a reação) — editar um coeficiente nunca remontava nada,
      // então a equação dizia uma coisa e os círculos no canvas
      // continuavam mostrando outra. Agora, ao editar QUALQUER
      // coeficiente, o canvas remonta com a quantidade de cada reagente
      // igual ao coeficiente atual da equação — o desenho volta a bater
      // exatamente com o que está escrito, como um diagrama de
      // partículas de livro didático.
      r.reagents.forEach((rg) => { currentQuantities[rg.formula] = r.coeffs[rg.formula]; });
      montarReagentesAtual();

      atualizarCalculadora();
      renderizarQuantidades();
      setStatus(`Coeficiente de ${rotuloFormula(formula)} ajustado para ${r.coeffs[formula]} — canvas remontado com as novas quantidades.`);
    });
  });

  verificarBalanceamentoUI();
}

