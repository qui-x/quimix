/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLÉCULAS (módulo Estequiometria)
   ARQUIVO: instanciar.js
   ───────────────────────────────────────────────────────────────
   Monta uma molécula completa no canvas a partir do seu template
   geométrico (instanciarMolecula), calcula o raio ocupado por ela
   (para não sobrepor outras) e gera posições sem sobreposição para
   várias moléculas de uma vez (usado ao montar reagentes/produtos).
   Depende de: core/estado-reacao.js, data/moleculas-templates.js,
               data/geometria-2d.js, atoms/atomos-ligacoes-crud.js.
   Usado por: js/reactions/montar-reagentes.js,
              js/mols/canvas-reacao.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function instanciarMolecula(formulaKey, centro, escala = 1) {
  const template = MOLECULE_TEMPLATES[formulaKey];
  const ang = Math.random() * Math.PI * 2;
  const cos = Math.cos(ang), sin = Math.sin(ang);
  const girar = (p) => ({ x: p.x * cos - p.y * sin, y: p.x * sin + p.y * cos });

  const criados = template.atoms.map((elemento, i) => {
    const off = girar(template.offsets[i]);
    return criarAtomo(elemento, { x: centro.x + off.x * escala, y: centro.y + off.y * escala }, escala);
  });

  template.bonds.forEach(([i, j, order]) => {
    const dx = template.offsets[i].x - template.offsets[j].x;
    const dy = template.offsets[i].y - template.offsets[j].y;
    const dist = Math.hypot(dx, dy) * escala;
    criarLigacao(criados[i], criados[j], order, dist);
  });

  return criados;
}

// Raio de "ocupação" de uma molécula (do centro até a borda do átomo
// mais distante) — usado para garantir espaçamento mínimo no spawn.
// Nem toda fórmula tem gabarito em MOLECULE_TEMPLATES: produtos que só
// existem depois de uma reação de verdade (ex. HCl, NH3, CO2) nunca
// precisaram de um, porque nasciam da física de ligação, não de um
// spawn direto — mas o módulo Mols desenha reagentes E produtos juntos
// de uma vez, então esta função passou a precisar cobrir os dois casos.
// Sem gabarito, estima o raio com o MESMO cálculo que o desenho de
// fallback do Mols usa (átomo central + periférico à distância da soma
// dos raios reais) — antes usava um valor genérico fixo (1 Å pra
// qualquer par), que subestimava o espaço de moléculas com átomos
// grandes (K, I, Br) e deixava moléculas vizinhas próximas demais.
// escala: mesmo multiplicador de criarAtomo/instanciarMolecula — default
// 1 preserva o comportamento de sempre pra Estequiometria.
function raioMolecula(formulaKey, escala = 1) {
  const template = MOLECULE_TEMPLATES[formulaKey];
  if (!template) {
    const contagem = contarAtomos(formulaKey);
    const simbolosUnicos = Object.keys(contagem);
    if (simbolosUnicos.length === 0) return 20 * escala;
    let simboloCentral = simbolosUnicos[0];
    simbolosUnicos.forEach((s) => { if (contagem[s] < contagem[simboloCentral]) simboloCentral = s; });
    const raioCentralAngstrom = ELEMENTS[simboloCentral].radius;
    let maiorAlcanceAngstrom = raioCentralAngstrom; // molécula de 1 átomo só (ex.: "K" sozinho como reagente)
    simbolosUnicos.forEach((s) => {
      if (s === simboloCentral) return; // o próprio central não é "periférico" de si mesmo
      const alcance = raioCentralAngstrom + ELEMENTS[s].radius * 2; // até a borda externa do periférico
      if (alcance > maiorAlcanceAngstrom) maiorAlcanceAngstrom = alcance;
    });
    return maiorAlcanceAngstrom * PX_POR_ANGSTROM * escala;
  }
  let maxR = 0;
  template.atoms.forEach((elemento, i) => {
    const off = template.offsets[i];
    const dist = (Math.hypot(off.x, off.y) + ELEMENTS[elemento].radius * PX_POR_ANGSTROM) * escala;
    if (dist > maxR) maxR = dist;
  });
  return maxR;
}

// Posiciona N moléculas numa grade embaralhada (em vez de posição 100%
// aleatória) — garante uma distância mínima entre os centros, grande o
// bastante para a maior molécula do lote. Sem isso, com até 6 reagentes
// e quantidades altas, a sobreposição inicial era comum e o solver de
// física tentava resolver várias penetrações ao mesmo tempo, "explodindo"
// os átomos com velocidades absurdas logo no primeiro frame.
function gerarPosicoesSemSobreposicao(formulas, area, escala = 1) {
  const n = formulas.length;
  if (n === 0) return [];

  const maiorRaio = Math.max(...formulas.map((f) => raioMolecula(f, escala)), 20);
  const espacamentoMinimo = maiorRaio * 2.3;

  const largura = Math.max(200, area.right - area.left);
  const altura = Math.max(200, area.bottom - area.top);

  // quantas colunas/linhas cabem no espaço SEM violar o espaçamento mínimo
  const maxCols = Math.max(1, Math.floor(largura / espacamentoMinimo));
  const maxRows = Math.max(1, Math.floor(altura / espacamentoMinimo));

  let cols, rows;
  if (maxCols * maxRows >= n) {
    // há espaço de sobra: escolhe a grade mais "quadrada" possível dentro
    // do limite que cada eixo permite, garantindo cellW E cellH adequados
    const minColsNecessarias = Math.ceil(n / maxRows);
    const colsIdeais = Math.round(Math.sqrt((n * largura) / altura));
    cols = Math.min(maxCols, Math.max(minColsNecessarias, colsIdeais, 1));
    rows = Math.ceil(n / cols);
  } else {
    // espaço insuficiente para o espaçamento ideal de todas as N moléculas
    // ao mesmo tempo — aceita a grade mais equilibrada possível (ainda
    // assim muito melhor que posição 100% aleatória, que sobrepunha tudo)
    cols = Math.max(1, Math.round(Math.sqrt((n * largura) / altura)));
    rows = Math.max(1, Math.ceil(n / cols));
  }

  const cellW = largura / cols;
  const cellH = altura / rows;

  const celulas = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) celulas.push({ r, c });
  for (let i = celulas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [celulas[i], celulas[j]] = [celulas[j], celulas[i]];
  }

  const jitterMax = Math.min(cellW, cellH) * 0.22;
  return formulas.map((_, idx) => {
    const { r, c } = celulas[idx % celulas.length];
    return {
      x: area.left + c * cellW + cellW / 2 + (Math.random() - 0.5) * jitterMax,
      y: area.top + r * cellH + cellH / 2 + (Math.random() - 0.5) * jitterMax,
    };
  });
}

