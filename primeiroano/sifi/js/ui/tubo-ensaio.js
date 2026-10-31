/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: tubo-ensaio.js
   ORIGEM:  NOVO arquivo do SIFI. Sem equivalente no SILQ.
   ───────────────────────────────────────────────────────────────
   Gerencia os tubos de ensaio DINÂMICOS do Módulo 3 — 2 nascem ao
   ativar o módulo, o usuário pode adicionar até 10 no total
   (SIFI.LAB_MAX_TUBOS), e cada tubo aceita até 5 substâncias
   diferentes ao mesmo tempo (SIFI.LAB_MAX_SUBSTANCIAS_POR_TUBO).

   POR QUE NÃO EXISTE HTML FIXO PRA CADA TUBO: com o número de tubos
   mudando em tempo de execução, não dá pra escrever `#tubo-coluna-1`,
   `#tubo-coluna-2`... no HTML como antes (quando eram sempre
   exatamente 2). Cada tubo é criado por `SIFI.criarTubo()`, que monta
   o próprio HTML dele e guarda as referências de DOM DIRETO no objeto
   do tubo (`tubo.dom.corpo`, `tubo.dom.legenda`...) — mais robusto do
   que manter um array de referências separado indexado por posição,
   que quebraria fácil ao remover um tubo do meio da lista.

   A FÍSICA (como N substâncias se agrupam em fases, quando um sólido
   dissolve) mora em js/simulation/fisica-solubilidade.js — este
   arquivo só sabe COMO representar visualmente o resultado, mesma
   divisão de responsabilidade de beaker.js/fisica-termostato.js no
   Módulo 2.

   REGRA DE PREENCHIMENTO DE UM TUBO: a PRIMEIRA substância colocada
   num tubo vazio precisa ser líquida (não dá pra começar com um
   sólido boiando no vácuo). As próximas (até o teto de 5) podem ser
   líquido ou sólido, livremente.
   Depende de: js/core/estado.js, js/core/dom-refs.js,
              js/data/dados-forcas-intermoleculares.js,
              js/ui/menu-moleculas.js (SIFI.buildMoleculeMiniSVG),
              js/ui/prateleira.js (SIFI.estadoFisicoAmbiente),
              js/simulation/fisica-solubilidade.js (SIFI.classificarTubo,
              SIFI.gerarTextoStatusTubo — chamados daqui, definidos lá).
   Usado por: js/ui/prateleira.js (o clique num reagente chama
              SIFI.adicionarReagenteAoTubo daqui), js/init/ativacao-modulos.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  function pegarTuboAtivo() {
    return SIFI.laboratorio.tubos.find(t => t.id === SIFI.laboratorio.tuboAtivo);
  }

  /* ===================================================================
     TAMANHO RESPONSIVO DOS TUBOS — o problema que isto resolve: com
     tamanho FIXO (só baseado no viewport, "min(120px, 26vw)"), 8+
     tubos numa tela pequena não cabiam de jeito nenhum, e a única
     saída era rolar (`overflow-y:auto` no #lab-tubos). O usuário pediu
     pra encolher os tubos até caber, em vez de rolar.

     A ideia: dado o espaço disponível DE VERDADE (medido, não chutado)
     e quantos tubos existem agora, testa cada número de COLUNAS
     possível (1 até N) e escolhe o que dá o MAIOR tubo (mantendo a
     proporção largura/altura de um tubo de ensaio) sem estourar nem a
     largura nem a altura disponíveis — um problema clássico de
     "empacotamento", resolvido por força bruta (o N máximo é 10, then
     testar até 10 opções é instantâneo, não precisa de nada esperto). */
  SIFI.TUBO_ASPECT = 120 / 260;       // proporção largura/altura do desenho original
  SIFI.TUBO_LARGURA_MAX = 120;        // nunca cresce além do tamanho "grande" original
  SIFI.TUBO_LARGURA_MIN = 46;         // abaixo disso, a ficha/legenda não cabem mais decentemente
  SIFI.TUBO_ALTURA_EXTRA = 54;        // espaço do cabeçalho (botões) + legenda, por FORA do .tubo-corpo

  /* Função PURA (não mexe em DOM) — calcula o maior tamanho de tubo
     que cabe `n` tubos dentro de `larguraDisponivel`×`alturaDisponivel`,
     testando cada número de colunas possível. Exposta em SIFI.* pra
     poder ser testada isoladamente, sem precisar de layout de verdade
     (que o jsdom não mede). */
  SIFI.calcularLayoutTubos = function calcularLayoutTubos(n, larguraDisponivel, alturaDisponivel, larguraMinColuna, alturaExtra) {
    if (n <= 0) return { largura: SIFI.TUBO_LARGURA_MAX, colunas: 1 };
    const gap = 14;
    const extra = alturaExtra || SIFI.TUBO_ALTURA_EXTRA;   // o que a coluna gasta fora do corpo do tubo
    let melhor = { area: 0, largura: SIFI.TUBO_LARGURA_MIN, colunas: 1 };

    for (let colunas = 1; colunas <= n; colunas++) {
      const linhas = Math.ceil(n / colunas);
      const larguraPorTubo = (larguraDisponivel - gap * (colunas - 1)) / colunas;
      const alturaPorTubo = (alturaDisponivel - gap * (linhas - 1)) / linhas - extra;
      if (larguraPorTubo <= 0 || alturaPorTubo <= 0) continue;
      // a coluna nunca fica mais estreita que o cabeçalho dela ("Tubo 7 ×"):
      // se nem ele cabe, essa quantidade de colunas quebraria a linha
      if (larguraMinColuna && larguraPorTubo < larguraMinColuna) continue;

      // Dado o espaço por tubo, o maior tamanho mantendo a proporção
      // — largura limitada pela coluna, OU pela altura da linha,
      // o que for mais apertado primeiro.
      let largura = Math.min(larguraPorTubo, alturaPorTubo * SIFI.TUBO_ASPECT, SIFI.TUBO_LARGURA_MAX);
      if (largura < 0) continue;

      const area = largura * largura; // proporcional à área real (mesma proporção pra todos)
      if (area > melhor.area) melhor = { area, largura, colunas };
    }

    melhor.largura = Math.max(SIFI.TUBO_LARGURA_MIN, Math.min(SIFI.TUBO_LARGURA_MAX, melhor.largura));
    return melhor;
  };

  /* Mede o espaço DE VERDADE disponível (SIFI.labTubosContainer) e
     aplica o resultado como variáveis CSS — chamada sempre que o
     número de tubos muda (criar/remover/resetar) e no redimensionamento
     da janela. Sem medição real disponível (jsdom, ou o elemento ainda
     não está no layout), usa um tamanho de reserva sensato em vez de
     travar ou aplicar um valor de 0px. */
  SIFI.atualizarTamanhoTubos = function atualizarTamanhoTubos() {
    if (!SIFI.labTubosContainer) return;
    const n = SIFI.laboratorio.tubos.length;
    if (n === 0) return;

    const rect = SIFI.labTubosContainer.getBoundingClientRect();
    const larguraDisponivel = rect.width > 0 ? rect.width - 8 : SIFI.TUBO_LARGURA_MAX * n;
    // A ALTURA vem do embrulho (#lab-wrapper), não da caixa dos tubos: esta tem a
    // altura dos PRÓPRIOS tubos, e medi-la fazia cada novo cálculo encolher os
    // tubos de novo (≈4 px por chamada, com duas linhas) — com o card abrindo e
    // fechando, o cálculo roda várias vezes seguidas.
    let alturaLivre = rect.height;
    const embrulho = SIFI.labTubosContainer.parentElement;
    if (embrulho && embrulho.clientHeight > 0) {
      const ce = getComputedStyle(embrulho);
      let livre = embrulho.clientHeight - (parseFloat(ce.paddingTop) || 0) - (parseFloat(ce.paddingBottom) || 0);
      let irmaos = 0;
      Array.prototype.forEach.call(embrulho.children, (filho) => {
        if (filho === SIFI.labTubosContainer) return;
        const h = filho.getBoundingClientRect().height;
        if (h > 0) { livre -= h; irmaos++; }
      });
      livre -= (parseFloat(ce.rowGap) || 0) * irmaos;   // um espaço entre cada vizinho e a caixa
      const teto = parseFloat(getComputedStyle(SIFI.labTubosContainer).maxHeight);
      alturaLivre = Math.min(livre, teto > 0 ? teto : Infinity);
    }
    const alturaDisponivel = alturaLivre > 0 ? alturaLivre - 8 : (SIFI.TUBO_LARGURA_MAX / SIFI.TUBO_ASPECT + SIFI.TUBO_ALTURA_EXTRA);

    // o cabeçalho mais largo ("Tubo 10 ×") — a coluna não encolhe abaixo dele
    let cabecalho = 0;
    SIFI.labTubosContainer.querySelectorAll('.tubo-coluna-cabecalho').forEach(c => {
      cabecalho = Math.max(cabecalho, c.getBoundingClientRect().width);
    });
    // e a altura que cada coluna gasta FORA do corpo (cabeçalho + legenda + espaços), medida:
    // a constante TUBO_ALTURA_EXTRA (54) fica ~18 px curta e, com duas linhas de tubos, a
    // segunda passava da caixa e só aparecia rolando
    let extra = SIFI.TUBO_ALTURA_EXTRA;
    const col0 = SIFI.labTubosContainer.querySelector('.tubo-coluna');
    const corpo0 = col0 && col0.querySelector('.tubo-corpo');
    if (corpo0) {
      const hc = col0.getBoundingClientRect().height, hb = corpo0.getBoundingClientRect().height;
      if (hb > 0 && hc > hb) extra = Math.max(extra, Math.ceil(hc - hb));
    }
    const layout = SIFI.calcularLayoutTubos(n, larguraDisponivel, alturaDisponivel, Math.ceil(cabecalho), extra);
    // arredonda PARA BAIXO: 7 × 112,3 px estouraria por 0,1 px a linha de 870 px e o 7º tubo desceria
    const largura = Math.floor(layout.largura * 10) / 10;
    const altura = largura / SIFI.TUBO_ASPECT;
    const particula = Math.max(14, Math.min(30, largura * 0.28));

    SIFI.labTubosContainer.style.setProperty('--tubo-largura', largura.toFixed(1) + 'px');
    SIFI.labTubosContainer.style.setProperty('--tubo-altura', altura.toFixed(1) + 'px');
    SIFI.labTubosContainer.style.setProperty('--particula-tamanho', particula.toFixed(1) + 'px');
  };

  // A ÁREA LIVRE: o #lab-wrapper encolhe quando um card flutuante abre
  // (css/sifi-extra.css). Observa o EMBRULHO, e não o #lab-tubos — a altura
  // deste depende dos próprios tubos, e medir os dois daria laço.
  // (Este arquivo inteiro já roda dentro do DOMContentLoaded, então o
  // #lab-wrapper já existe aqui. Um segundo DOMContentLoaded registrado
  // AQUI DENTRO nunca dispararia — o evento já está acontecendo.)
  // Recalcula AQUI MESMO, no aviso do observador (que chega depois do layout e
  // antes da pintura): assim nenhum quadro chega a mostrar os tubos do tamanho
  // antigo, quebrando linha na área nova. Sem laço: o tamanho do embrulho não
  // depende dos tubos (ele é absoluto, preso às bordas da cena).
  (function vigiarAreaDosTubos() {
    const embrulho = document.getElementById('lab-wrapper');
    if (!window.ResizeObserver || !embrulho) return;
    new ResizeObserver(() => {
      if (SIFI.activeModule === 3) SIFI.atualizarTamanhoTubos();
    }).observe(embrulho);
  })();

  // Recalcula ao redimensionar a janela — pequeno debounce pra não
  // recalcular a cada pixel arrastado, só quando o usuário parar.
  let _resizeTubosTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTubosTimer);
    _resizeTubosTimer = setTimeout(() => {
      if (SIFI.activeModule === 3) SIFI.atualizarTamanhoTubos();
    }, 150);
  });

  /* ===================================================================
     CRIAR / REMOVER TUBOS (dinâmico)
     =================================================================== */

  /* Monta o HTML de UM tubo novo, do zero, e guarda as referências de
     DOM direto no objeto do tubo — ver o porquê no cabeçalho do
     arquivo. Não seleciona o tubo novo automaticamente (quem chama
     decide se quer selecionar). */
  SIFI.criarTubo = function criarTubo() {
    const id = SIFI.laboratorio.proximoIdTubo++;
    const tubo = {
      id, substancias: [], particulas: [], fases: [], compativel: null,
      temperatura: SIFI.LAB_TEMP_INICIAL,
    };

    const coluna = document.createElement('div');
    coluna.className = 'tubo-coluna';
    coluna.dataset.tubo = String(id);
    coluna.setAttribute('role', 'listitem');
    coluna.innerHTML = `
      <div class="tubo-coluna-cabecalho">
        <button type="button" class="tubo-selecionar" aria-pressed="false">Tubo ${id}</button>
        <button type="button" class="tubo-remover" aria-label="Remover Tubo ${id}" title="Remover este tubo">×</button>
      </div>
      <div class="tubo-corpo" aria-label="Tubo de ensaio ${id}" role="img">
        <svg class="tubo-bonds-svg" aria-hidden="true"></svg>
        <div class="tubo-particulas"></div>
      </div>
      <p class="tubo-legenda">Vazio</p>
    `;

    tubo.dom = {
      coluna,
      botaoSelecionar: coluna.querySelector('.tubo-selecionar'),
      botaoRemover: coluna.querySelector('.tubo-remover'),
      corpo: coluna.querySelector('.tubo-corpo'),
      bondsSvg: coluna.querySelector('.tubo-bonds-svg'),
      particulasEl: coluna.querySelector('.tubo-particulas'),
      legenda: coluna.querySelector('.tubo-legenda'),
    };

    tubo.dom.botaoSelecionar.addEventListener('click', () => SIFI.selecionarTubo(id));
    tubo.dom.botaoRemover.addEventListener('click', () => SIFI.removerTubo(id));

    if (SIFI.labTubosContainer) SIFI.labTubosContainer.appendChild(coluna);
    SIFI.laboratorio.tubos.push(tubo);
    SIFI.atualizarBotaoAdicionarTubo();
    SIFI.atualizarTamanhoTubos();
    return tubo;
  };

  /* Botão "Adicionar tubo" — cria um novo e já seleciona ele (o
     usuário provavelmente vai querer preencher o tubo que acabou de
     criar, não ficar mexendo em outro). Recusa além do teto. */
  SIFI.adicionarTubo = function adicionarTubo() {
    if (SIFI.laboratorio.tubos.length >= SIFI.LAB_MAX_TUBOS) {
      if (SIFI.announce) SIFI.announce(`Limite de ${SIFI.LAB_MAX_TUBOS} tubos atingido.`, 'assertive');
      return;
    }
    const tubo = SIFI.criarTubo();
    SIFI.selecionarTubo(tubo.id);
    if (SIFI.announce) SIFI.announce(`Tubo ${tubo.id} adicionado.`);
  };

  /* Remove um tubo por completo (não só limpa ele) — nunca deixa
     remover o último (SIFI.LAB_MIN_TUBOS). Se o tubo removido era o
     ativo, seleciona automaticamente o primeiro que sobrou. */
  SIFI.removerTubo = function removerTubo(id) {
    if (SIFI.laboratorio.tubos.length <= SIFI.LAB_MIN_TUBOS) {
      if (SIFI.announce) SIFI.announce(`Precisa de pelo menos ${SIFI.LAB_MIN_TUBOS} tubo no laboratório.`, 'assertive');
      return;
    }
    const idx = SIFI.laboratorio.tubos.findIndex(t => t.id === id);
    if (idx === -1) return;

    const tubo = SIFI.laboratorio.tubos[idx];
    tubo.dom.coluna.remove();
    SIFI.laboratorio.tubos.splice(idx, 1);

    if (SIFI.laboratorio.tuboAtivo === id) {
      SIFI.selecionarTubo(SIFI.laboratorio.tubos[0].id);
    }
    SIFI.atualizarBotaoAdicionarTubo();
    SIFI.atualizarTamanhoTubos();
    if (SIFI.announce) SIFI.announce(`Tubo ${id} removido.`);
  };

  SIFI.atualizarBotaoAdicionarTubo = function atualizarBotaoAdicionarTubo() {
    if (!SIFI.btnAdicionarTubo) return;
    const cheio = SIFI.laboratorio.tubos.length >= SIFI.LAB_MAX_TUBOS;
    SIFI.btnAdicionarTubo.disabled = cheio;
    SIFI.btnAdicionarTubo.setAttribute('aria-disabled', cheio ? 'true' : 'false');
  };

  /* Remove TODOS os tubos existentes, sem recriar nenhum — o estado
     "de verdade vazio", consistente com como o Módulo 1 zera
     `canvasMolecules` e o Módulo 2 zera `particulas` quando ficam
     inativos (nenhum dos dois mantém "2 moléculas escondidas" só
     porque não estão sendo exibidos). Usada ao SAIR do Módulo 3
     (trocar pra outro módulo, ou desativar tudo). */
  SIFI.limparLaboratorioCompleto = function limparLaboratorioCompleto() {
    SIFI.laboratorio.tubos.forEach(t => t.dom && t.dom.coluna.remove());
    SIFI.laboratorio.tubos = [];
    SIFI.laboratorio.proximoIdTubo = 1;
  };

  /* Zera tudo E recria exatamente SIFI.LAB_TUBOS_INICIAIS (2) tubos
     vazios — usada especificamente ao ATIVAR o Módulo 3 (é assim que
     ele deve "nascer" toda vez, com os 2 tubos padrão prontos). */
  SIFI.resetLaboratorio = function resetLaboratorio() {
    SIFI.limparLaboratorioCompleto();
    for (let i = 0; i < SIFI.LAB_TUBOS_INICIAIS; i++) SIFI.criarTubo();
    SIFI.laboratorio.tuboAtivo = SIFI.laboratorio.tubos[0].id;
    SIFI.selecionarTubo(SIFI.laboratorio.tuboAtivo);
  };

  /* ===================================================================
     SELECIONAR QUAL TUBO A PRATELEIRA VAI PREENCHER
     =================================================================== */
  SIFI.selecionarTubo = function selecionarTubo(id) {
    SIFI.laboratorio.tuboAtivo = id;
    SIFI.laboratorio.tubos.forEach(t => {
      const ativo = t.id === id;
      if (t.dom) {
        t.dom.botaoSelecionar.setAttribute('aria-pressed', ativo ? 'true' : 'false');
        t.dom.coluna.classList.toggle('tubo-coluna--ativo', ativo);
      }
    });
    SIFI.atualizarInfoTubo();
  };

  /* ===================================================================
     ADICIONAR REAGENTE AO TUBO ATIVO
     =================================================================== */
  SIFI.adicionarReagenteAoTubo = function adicionarReagenteAoTubo(key) {
    // Portão de ativação — mesmo padrão dos outros dois módulos.
    if (SIFI.activeModule !== 3) {
      if (SIFI.announce) SIFI.announce('Ative o Módulo 3 antes de escolher reagentes.', 'assertive');
      return;
    }

    const mol = INTERMOL_MOLECULES.find(m => m.key === key);
    if (!mol) return;

    const tubo = pegarTuboAtivo();
    if (!tubo) return;

    if (tubo.substancias.includes(key)) {
      if (SIFI.announce) SIFI.announce(`O Tubo ${tubo.id} já tem ${mol.name}.`, 'assertive');
      return;
    }
    if (tubo.substancias.length === 0 && SIFI.estadoFisicoNaTemperatura(mol, tubo.temperatura) === 'solido') {
      // A PRIMEIRA substância do tubo precisa ser líquida NA TEMPERATURA
      // ATUAL do tubo (não sempre 25°C — um tubo já aquecido acima do
      // ponto de fusão de um sólido normal aceita ele como primeira
      // substância, porque ali ele já nasce líquido de verdade).
      if (SIFI.announce) SIFI.announce(`${mol.name} é sólido na temperatura atual do tubo — coloque um líquido primeiro.`, 'assertive');
      return;
    }
    if (tubo.substancias.length >= SIFI.LAB_MAX_SUBSTANCIAS_POR_TUBO) {
      if (SIFI.announce) {
        SIFI.announce(`O Tubo ${tubo.id} já tem o máximo de ${SIFI.LAB_MAX_SUBSTANCIAS_POR_TUBO} substâncias — limpe antes de adicionar outra.`, 'assertive');
      }
      return;
    }

    tubo.substancias.push(key);
    SIFI.criarParticulasTubo(tubo);
    SIFI.atualizarInfoTubo();
    SIFI.atualizarLegendaTubo(tubo);
    if (SIFI.announce) SIFI.announce(`${mol.name} adicionado ao Tubo ${tubo.id}.`);
  };

  /* Cria as partículas de UMA substância dentro de um tubo — cada uma
     já nasce no estado FISICAMENTE CORRETO pra temperatura ATUAL do
     tubo (sólida/líquida/gasosa — mesma ideia do Módulo 2), não
     sempre sólida-se-for-sólido-a-25°C como antes. Sólidos nascem
     "presos" (amontoados perto do fundo, um cristal ainda inteiro);
     líquidos e gases nascem "livres" (a posição REAL deles, por fase
     ou na zona de gás, é ajustada logo em seguida por
     SIFI.classificarTubo). */
  function criarParticulasDe(tubo, mol, quantidade) {
    const f = FORCE_TYPES[mol.dominantForce];
    const estadoFisico = SIFI.estadoFisicoNaTemperatura(mol, tubo.temperatura);
    const particulas = [];

    for (let i = 0; i < quantidade; i++) {
      const dom = document.createElement('div');
      dom.className = 'tubo-particula';
      dom.style.setProperty('--particula-cor', f.color);
      dom.innerHTML = SIFI.buildMoleculeMiniSVG(mol, false);
      dom.setAttribute('aria-hidden', 'true');

      const x = 15 + Math.random() * 70;
      let y;
      if (estadoFisico === 'solido') {
        y = SIFI.LAB_ZONA_CRISTAL_MIN + Math.random() * (SIFI.LAB_ZONA_CRISTAL_MAX - SIFI.LAB_ZONA_CRISTAL_MIN);
        dom.classList.add('tubo-particula--cristal');
      } else if (estadoFisico === 'gas') {
        y = SIFI.LAB_ZONA_GAS_MIN + Math.random() * (SIFI.LAB_ZONA_GAS_MAX - SIFI.LAB_ZONA_GAS_MIN);
        dom.classList.add('tubo-particula--gas');
      } else {
        y = SIFI.LAB_ZONA_LIQUIDO_MIN + Math.random() * (SIFI.LAB_ZONA_LIQUIDO_MAX - SIFI.LAB_ZONA_LIQUIDO_MIN);
      }
      dom.style.left = x + '%';
      dom.style.top = y + '%';

      if (tubo.dom.particulasEl) tubo.dom.particulasEl.appendChild(dom);

      particulas.push({
        id: `${mol.key}-${i}`, substanciaKey: mol.key,
        estadoFisico,
        estadoNoTubo: estadoFisico === 'solido' ? 'presa' : 'livre',
        x, y, vx: 0, vy: 0, dom,
      });
    }
    return particulas;
  }

  SIFI.criarParticulasTubo = function criarParticulasTubo(tubo) {
    if (tubo.dom.particulasEl) tubo.dom.particulasEl.innerHTML = '';
    if (tubo.dom.bondsSvg) tubo.dom.bondsSvg.innerHTML = '';
    tubo.particulas = [];

    tubo.substancias.forEach(key => {
      const mol = INTERMOL_MOLECULES.find(m => m.key === key);
      if (mol) tubo.particulas.push(...criarParticulasDe(tubo, mol, SIFI.LAB_PARTICULAS_POR_SUBSTANCIA));
    });

    // O agrupamento em fases (compatível/incompatível, quantas camadas,
    // quem dissolve) mora em fisica-solubilidade.js — ela também
    // reposiciona as partículas na hora, pro feedback ser imediato.
    if (SIFI.classificarTubo) SIFI.classificarTubo(tubo);
  };

  /* ===================================================================
     LIMPAR UM TUBO (esvazia as substâncias, mas o tubo continua
     existindo — diferente de SIFI.removerTubo, que apaga o tubo
     inteiro do laboratório)
     =================================================================== */
  SIFI.limparTubo = function limparTubo(id) {
    const tubo = SIFI.laboratorio.tubos.find(t => t.id === id);
    if (!tubo) return;
    tubo.substancias = [];
    tubo.particulas = [];
    tubo.fases = [];
    tubo.compativel = null;
    tubo.temperatura = SIFI.LAB_TEMP_INICIAL;
    if (tubo.dom.particulasEl) tubo.dom.particulasEl.innerHTML = '';
    if (tubo.dom.bondsSvg) tubo.dom.bondsSvg.innerHTML = '';
    SIFI.atualizarLegendaTubo(tubo);
    if (id === SIFI.laboratorio.tuboAtivo) SIFI.atualizarInfoTubo();
  };

  /* ===================================================================
     TEXTOS: legenda de cada tubo (sempre visível) + painel do tubo ativo
     =================================================================== */
  SIFI.atualizarLegendaTubo = function atualizarLegendaTubo(tubo) {
    if (!tubo.dom || !tubo.dom.legenda) return;
    if (!tubo.substancias.length) { tubo.dom.legenda.textContent = 'Vazio'; return; }
    const formulas = tubo.substancias.map(k => {
      const m = INTERMOL_MOLECULES.find(x => x.key === k);
      return m ? m.formula : k;
    });
    tubo.dom.legenda.textContent = formulas.join(' + ');
  };

  SIFI.atualizarInfoTubo = function atualizarInfoTubo() {
    const tubo = pegarTuboAtivo();
    if (!tubo) return;
    if (SIFI.tuboInfoNumero) SIFI.tuboInfoNumero.textContent = tubo.id;
    if (SIFI.tuboInfoContador) {
      SIFI.tuboInfoContador.textContent = `${tubo.substancias.length}/${SIFI.LAB_MAX_SUBSTANCIAS_POR_TUBO} substâncias`;
    }

    // Sincroniza o slider de temperatura com o tubo que acabou de
    // virar o ativo — cada tubo tem a SUA própria temperatura, então
    // trocar de tubo precisa mostrar o valor certo, não o do tubo anterior.
    if (SIFI.tuboTempSlider) SIFI.tuboTempSlider.value = tubo.temperatura;
    if (SIFI.tuboTempAtual) SIFI.tuboTempAtual.textContent = `${tubo.temperatura}°C`;

    SIFI.atualizarContadorEstadosTubo(tubo);

    if (SIFI.tuboInfoLista) {
      if (!tubo.substancias.length) {
        SIFI.tuboInfoLista.innerHTML = '<li class="tubo-info-vazio">Vazio — adicione um líquido primeiro.</li>';
      } else {
        SIFI.tuboInfoLista.innerHTML = tubo.substancias.map(k => {
          const m = INTERMOL_MOLECULES.find(x => x.key === k);
          if (!m) return '';
          const f = FORCE_TYPES[m.dominantForce];
          return `<li><span class="tubo-info-dot" style="background:${f.color}" aria-hidden="true"></span>${m.name} (${m.formula})</li>`;
        }).join('');
      }
    }

    if (!tubo.substancias.length) {
      if (SIFI.tuboStatusTexto) SIFI.tuboStatusTexto.textContent = 'Escolha um líquido na prateleira pra começar.';
      return;
    }

    if (SIFI.gerarTextoStatusTubo && SIFI.tuboStatusTexto) {
      SIFI.tuboStatusTexto.innerHTML = SIFI.gerarTextoStatusTubo(tubo);
    }
  };

  /* Contador sólido/líquido/gás DO TUBO — mesma ideia do painel do
     Módulo 2 (SIFI.atualizarContadoresEstado, em beaker.js), só que
     por tubo em vez de pro béquer inteiro: cada tubo tem sua própria
     mistura de substâncias, cada uma podendo estar num estado físico
     diferente ao mesmo tempo (ex.: uma já ferveu, outra ainda sólida). */
  SIFI.atualizarContadorEstadosTubo = function atualizarContadorEstadosTubo(tubo) {
    const solido = tubo.particulas.filter(p => p.estadoFisico === 'solido').length;
    const liquido = tubo.particulas.filter(p => p.estadoFisico === 'liquido').length;
    const gas = tubo.particulas.filter(p => p.estadoFisico === 'gas').length;
    if (SIFI.tuboNumSolido) SIFI.tuboNumSolido.textContent = solido;
    if (SIFI.tuboNumLiquido) SIFI.tuboNumLiquido.textContent = liquido;
    if (SIFI.tuboNumGas) SIFI.tuboNumGas.textContent = gas;
  };

  /* ===================================================================
     CONTROLES: botão "Adicionar tubo" + "Limpar tubo selecionado" +
     slider de TEMPERATURA (por tubo — sempre mexe no tubo ATIVO)
     =================================================================== */
  if (SIFI.btnAdicionarTubo) {
    SIFI.btnAdicionarTubo.addEventListener('click', SIFI.adicionarTubo);
  }

  if (SIFI.btnLimparTubo) {
    SIFI.btnLimparTubo.addEventListener('click', () => {
      const id = SIFI.laboratorio.tuboAtivo;
      SIFI.limparTubo(id);
      if (SIFI.announce) SIFI.announce(`Tubo ${id} limpo.`);
    });
  }

  if (SIFI.tuboTempSlider) {
    SIFI.tuboTempSlider.addEventListener('input', () => {
      const tubo = pegarTuboAtivo();
      if (!tubo) return;
      tubo.temperatura = Number(SIFI.tuboTempSlider.value);
      if (SIFI.tuboTempAtual) SIFI.tuboTempAtual.textContent = `${tubo.temperatura}°C`;
      // Reclassifica na hora — se a temperatura cruzou um ponto de
      // fusão/ebulição de alguma substância presente, o texto de
      // status e o contador já refletem isso sem esperar o próximo
      // tick de física.
      if (SIFI.classificarTubo) SIFI.classificarTubo(tubo);
      SIFI.atualizarContadorEstadosTubo(tubo);
      if (SIFI.gerarTextoStatusTubo && SIFI.tuboStatusTexto && tubo.substancias.length) {
        SIFI.tuboStatusTexto.innerHTML = SIFI.gerarTextoStatusTubo(tubo);
      }
    });
  }
});
