/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS
   ARQUIVO: canvas-reacao.js
   ───────────────────────────────────────────────────────────────
   Desenha reagentes E produtos juntos no canvas ao escolher uma
   reação para investigar (reaproveitando instanciarMolecula/
   criarAtomo do módulo Estequiometria), marcando cada átomo com sua
   substância e índice — é isso que o clique no canvas usa para saber
   qual elemento de qual substância foi tocado.
   Depende de: core/estado-reacao.js, molecules/instanciar.js,
               atoms/atomos-ligacoes-crud.js,
               mols/reacao-investigar.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function resetInvestigacaoMols() {
  molsReacaoAtual = null;
  molsSubstancias = {};
  molsFichaPendente = null;
  molsSubstanceRow.hidden = true;
  molsSubstanceLegend.innerHTML = "";
  molsInstrucaoCanvas.hidden = true;
  atualizarModeIndicator();
  molsTallyEl.hidden = true;
  molsTallyBody.innerHTML = "";
  molsResultadoEl.hidden = true;
  molsResultadoEl.textContent = "";
  limparCena();
}

// Desenha TODA a reação no canvas — reagentes à esquerda, produtos à
// direita, com um respiro no meio. O NÚMERO DE CÓPIAS de cada substância
// segue o coeficiente estequiométrico de verdade na LEGENDA e no
// CÁLCULO (massa total = coeficiente × massa molar) — mas não mais no
// número de cópias desenhadas. Chegou a desenhar uma molécula por
// unidade de coeficiente (Si + 2 H₂ → SiH₄ desenhava 2 moléculas de
// H₂), o que ficava correto pra reações pequenas mas virava um canvas
// ilegível em reações com muitas substâncias e coeficientes grandes
// (ex.: "Reatividade total do potássio", coeficiente 6+ em vários
// halogênios de uma vez — dezenas de círculos sobrepostos). Voltou a
// ser 1 molécula por substância, sempre — o coeficiente aparece por
// escrito na legenda ("6 × K") e entra direto na conta da massa total,
// sem precisar ser desenhado fisicamente dezenas de vezes.
// Reaproveita instanciarMolecula()/criarAtomo() e o mesmo espalhamento
// sem sobreposição (gerarPosicoesSemSobreposicao) que a montagem de
// reagentes da Estequiometria já usa.
// Escala de desenho do módulo Mols — bem menor que o tamanho normal
// (1 = tamanho real da Estequiometria). Faz sentido reduzir aqui e só
// aqui: o Mols pode mostrar até uma dezena de substâncias diferentes
// de uma vez (uma reação inteira), enquanto a Estequiometria só
// desenha os poucos reagentes escolhidos — o mesmo tamanho de átomo
// que cabe bem lá vira ilegível aqui. 0,5 ainda deixa cada átomo
// clicável com folga (a tolerância de clique já soma +4px ao raio).
const MOLS_ESCALA = 0.5;

function renderizarReacaoNoCanvasMols(reactionKey) {
  limparCena();
  const r = REACTIONS[reactionKey];
  const reagentesFormulas = r.reagents.map((rg) => rg.formula);
  const produtosFormulas = Object.keys(r.coeffs).filter((f) => !reagentesFormulas.includes(f));

  const area = areaDeJogo();
  const meio = (area.left + area.right) / 2;
  const vao = 34; // respiro em volta do centro, onde a leitura da equação "vira" de reagente pra produto
  const areaEsq = { left: area.left, right: Math.max(area.left + 40, meio - vao), top: area.top, bottom: area.bottom };
  const areaDir = { left: Math.min(area.right - 40, meio + vao), right: area.right, top: area.top, bottom: area.bottom };

  const posReagentes = gerarPosicoesSemSobreposicao(reagentesFormulas, areaEsq, MOLS_ESCALA);
  const posProdutos = gerarPosicoesSemSobreposicao(produtosFormulas, areaDir, MOLS_ESCALA);

  const criarSubstancia = (formula, centro, papel) => {
    const contagem = contarAtomos(formula); // átomos por 1 unidade de fórmula
    const coeficiente = r.coeffs[formula];

    // total = porUnidade (não multiplicado pelo coeficiente): clicar
    // conta os átomos DESSA molécula, uma vez — o coeficiente entra na
    // conta de massa total depois, sem precisar de mais cliques.
    molsSubstancias[formula] = { papel, coeficiente, contagem: {} };
    const proximoIndice = {};
    Object.entries(contagem).forEach(([simbolo, n]) => {
      molsSubstancias[formula].contagem[simbolo] = { porUnidade: n, total: n, contadosIdx: new Set(), massa: null };
      proximoIndice[simbolo] = 0;
    });

    const simbolosNaOrdem = [];
    Object.entries(contagem).forEach(([simbolo, n]) => { for (let i = 0; i < n; i++) simbolosNaOrdem.push(simbolo); });

    const tagear = (a, simbolo) => {
      a.molsFormula = formula;
      a.molsIndice = proximoIndice[simbolo]++;
    };

    if (MOLECULE_TEMPLATES[formula]) {
      const antes = new Set(atoms.keys());
      instanciarMolecula(formula, centro, MOLS_ESCALA);
      const indicesLocaisPorSimbolo = {}; // só pra casar átomo-do-template com seu símbolo, na ordem certa
      simbolosNaOrdem.forEach((s, i) => { (indicesLocaisPorSimbolo[s] = indicesLocaisPorSimbolo[s] || []).push(i); });
      const usadosLocal = {};
      Object.keys(contagem).forEach((s) => { usadosLocal[s] = 0; });
      atoms.forEach((a, id) => {
        if (antes.has(id)) return; // átomo de outra substância já criada
        const lista = indicesLocaisPorSimbolo[a.elemento];
        if (!lista || usadosLocal[a.elemento] >= lista.length) return;
        usadosLocal[a.elemento]++;
        tagear(a, a.elemento);
      });
    } else {
      // Sem gabarito de geometria (produto formado só pela física de
      // ligação de uma reação de verdade — NH₃, HCl, SiH₄...). Antes:
      // círculo solto de átomos, NENHUM ligado a nada — incoerente com
      // o resto do canvas, onde toda molécula aparece com os átomos de
      // fato ligados (é assim que o módulo Estequiometria sempre
      // desenhou). Agora: um átomo CENTRAL (o símbolo com menor
      // contagem — geralmente o elemento menos eletronegativo do
      // composto, como N em NH₃ ou Si em SiH₄) com todos os demais
      // ligados a ele por criarLigacao(), a mesma função que os
      // gabaritos de MOLECULE_TEMPLATES usam — não é a geometria real
      // da ligação (não sabemos os ângulos VSEPR de cada composto sem
      // um gabarito dedicado), mas ao menos fica visualmente CONECTADO,
      // como uma molécula de verdade.
      const simbolosUnicos = Object.keys(contagem);
      let simboloCentral = simbolosUnicos[0];
      simbolosUnicos.forEach((s) => { if (contagem[s] < contagem[simboloCentral]) simboloCentral = s; });

      const central = criarAtomo(simboloCentral, { x: centro.x, y: centro.y }, MOLS_ESCALA);
      tagear(central, simboloCentral);

      const perifericos = [];
      Object.entries(contagem).forEach(([s, n]) => {
        const vezes = s === simboloCentral ? n - 1 : n; // 1 ocorrência do central já foi criada acima
        for (let i = 0; i < vezes; i++) perifericos.push(s);
      });
      perifericos.forEach((simbolo, i) => {
        // Comprimento de ligação = soma dos raios reais dos dois átomos
        // (em Å, convertido pra px) — antes era um valor GENÉRICO fixo
        // (1,0 Å pra qualquer par), que ficava menor que o próprio raio
        // de átomos grandes como K (2,03 Å): o periférico nascia
        // literalmente DENTRO do círculo do central. Com a soma dos
        // raios, o periférico sempre nasce encostado na borda externa
        // do central, nunca sobreposto — mesmo princípio que os
        // gabaritos manuais (H-H, Cl-Cl etc.) já usam, só que calculado
        // na hora em vez de medido à mão por composto.
        const comprimentoLigacao = (ELEMENTS[simboloCentral].radius + ELEMENTS[simbolo].radius) * PX_POR_ANGSTROM * MOLS_ESCALA;
        const ang = (i / perifericos.length) * Math.PI * 2;
        const a = criarAtomo(simbolo, {
          x: centro.x + Math.cos(ang) * comprimentoLigacao,
          y: centro.y + Math.sin(ang) * comprimentoLigacao,
        }, MOLS_ESCALA);
        tagear(a, simbolo);
        criarLigacao(central, a, 1, comprimentoLigacao);
      });
    }
  };

  reagentesFormulas.forEach((formula, i) => criarSubstancia(formula, posReagentes[i], "reagente"));
  produtosFormulas.forEach((formula, i) => criarSubstancia(formula, posProdutos[i], "produto"));

  atoms.forEach((a) => Matter.Body.setStatic(a.body, true)); // parado: o Mols não simula reação
}

function iniciarInvestigacaoReacaoMols(reactionKey) {
  molsReacaoAtual = reactionKey;
  molsFichaPendente = null;
  molsResultadoEl.hidden = true;
  molsResultadoEl.textContent = "";

  renderizarReacaoNoCanvasMols(reactionKey);

  const r = REACTIONS[reactionKey];
  const reagentesFormulas = r.reagents.map((rg) => rg.formula);
  const todasFormulas = Object.keys(r.coeffs);

  molsSubstanceLegend.innerHTML = todasFormulas.map((formula) => {
    const ehReagente = reagentesFormulas.includes(formula);
    const coef = r.coeffs[formula];
    const prefixoCoef = coef > 1 ? `${coef} × ` : "";
    return `<span class="mols-substance-chip${ehReagente ? "" : " mols-substance-chip--produto"}">
      <span class="mols-substance-dot" aria-hidden="true"></span>
      <span class="mols-substance-formula">${prefixoCoef}${rotuloFormula(formula)}</span>
      <span class="mols-substance-papel">${ehReagente ? "reagente" : "produto"}</span>
    </span>`;
  }).join("");
  molsSubstanceRow.hidden = false;
  molsInstrucaoCanvas.hidden = false;

  renderizarTallyMols();
  molsTallyEl.hidden = false;

  atualizarModeIndicator();
  anunciar(`Investigando a reação ${r.label}. Reagentes à esquerda, produtos à direita — clique nos átomos do canvas para descobrir a massa de cada elemento.`);
}

