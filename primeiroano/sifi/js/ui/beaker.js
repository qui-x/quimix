/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: beaker.js
   ORIGEM:  NOVO arquivo do SIFI. Sem equivalente direto no SILQ —
            o mais próximo é atomos.js (criar/remover elementos no
            canvas).
   ───────────────────────────────────────────────────────────────
   Cria, seleciona e remove as partículas do béquer do Módulo 2, e
   move cada uma entre sólido, líquido e gás quando muda de estado.
   A FÍSICA de quando cada partícula funde/ferve/condensa/solidifica
   mora em js/simulation/fisica-termostato.js — este arquivo só sabe
   COMO representar visualmente o resultado.

   CADA PARTÍCULA É A ESTRUTURA MOLECULAR DE VERDADE (átomos,
   ligações, polos δ+/δ−) — a mesma que o Módulo 1 desenha
   (`SIFI.buildMoleculeMiniSVG`, versão pequena), não uma bolinha
   genérica. O Módulo 1 já prova que dezenas de estruturas assim
   animando ao mesmo tempo rodam bem (até 90 moléculas, a 60×/s, com
   física de pares); aqui são só 40, atualizando a 20×/s
   (SIFI.TERMOSTATO_DT) — folgado.

   TRÊS ESTADOS, UMA ZONA SÓ: sólido e líquido dividem o MESMO
   contêiner (`beaker-liquido-zona`, a parte de baixo do béquer) —
   não existe uma "zona sólida" separada. O que muda é o
   COMPORTAMENTO: sólido fica preso numa posição fixa de grade (só
   vibra ali, não se afasta — `calcularPosicaoGrade`); líquido balança
   livre por toda a zona. É a mesma ideia de um cubo de gelo derretendo
   dentro de um copo de água: os dois "moram" no mesmo espaço físico,
   só a organização das partículas é diferente.
   Depende de: js/core/estado.js, js/core/dom-refs.js,
              js/data/dados-forcas-intermoleculares.js,
              js/ui/menu-moleculas.js (SIFI.buildMoleculeMiniSVG).
   Usado por: js/init/ativacao-modulos.js, js/simulation/fisica-termostato.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* Decide em qual dos 3 estados uma partícula NASCE, dada a
     temperatura atual do termostato — mais correto do que sempre
     começar líquida: se o termostato já estiver bem frio quando você
     escolhe a água, ela já devia nascer congelada, não líquida. */
  function estadoInicialPara(mol, temp) {
    if (temp >= mol.boilingPoint) return 'gas';
    if (mol.sublima) return 'solido'; // CO₂/SF₆: sem fase líquida — ou sólido, ou gás
    if (mol.meltingPoint === null) return 'liquido'; // Hélio: nunca solidifica a 1 atm
    return temp >= mol.meltingPoint ? 'liquido' : 'solido';
  }

  /* Posição fixa de uma partícula sólida dentro de uma grade regular
     — é isso que faz o sólido parecer ORGANIZADO (uma rede cristalina
     simplificada) em vez de um amontoado aleatório como o líquido.
     Exposta em SIFI.* porque js/simulation/fisica-termostato.js
     também precisa dela ao SOLIDIFICAR uma partícula que estava
     líquida (não só na criação). */
  SIFI.calcularPosicaoGrade = function calcularPosicaoGrade(index, total) {
    const cols = Math.max(1, Math.ceil(Math.sqrt(total)));
    const rows = Math.max(1, Math.ceil(total / cols));
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = 8 + (cols > 1 ? (col / (cols - 1)) * 84 : 42);
    const y = 8 + (rows > 1 ? (row / (rows - 1)) * 84 : 42);
    return { x, y };
  };

  /* Cria as partículas da substância escolhida — cada uma já nasce no
     estado FISICAMENTE CORRETO pra temperatura atual do termostato
     (sólida/líquida/gasosa), não sempre líquida. Posições em % (não
     pixel), dentro de um contêiner posicionado por CSS. */
  SIFI.criarParticulasBequer = function criarParticulasBequer(mol) {
    SIFI.termostato.particulas = [];
    if (SIFI.beakerLiquidoZona) SIFI.beakerLiquidoZona.innerHTML = '';
    if (SIFI.beakerGasZona) SIFI.beakerGasZona.innerHTML = '';

    const f = FORCE_TYPES[mol.dominantForce];
    const total = SIFI.TERMOSTATO_NUM_PARTICULAS;

    for (let i = 0; i < total; i++) {
      const dom = document.createElement('div');
      dom.className = 'termostato-particula';
      dom.style.setProperty('--particula-cor', f.color);
      dom.innerHTML = SIFI.buildMoleculeMiniSVG(mol, false);
      dom.setAttribute('aria-hidden', 'true');

      const estado = estadoInicialPara(mol, SIFI.termostato.temperatura);
      const instance = { id: i, x: 0, y: 0, vx: 0, vy: 0, estado, dom };

      if (estado === 'solido') {
        const pos = SIFI.calcularPosicaoGrade(i, total);
        instance.x = pos.x; instance.y = pos.y;
        dom.classList.add('termostato-particula--solido');
        if (SIFI.beakerLiquidoZona) SIFI.beakerLiquidoZona.appendChild(dom);
      } else if (estado === 'gas') {
        instance.x = 8 + Math.random() * 84;
        instance.y = 8 + Math.random() * 78;
        dom.classList.add('termostato-particula--gas');
        if (SIFI.beakerGasZona) SIFI.beakerGasZona.appendChild(dom);
      } else {
        instance.x = 6 + Math.random() * 88;
        instance.y = 6 + Math.random() * 88;
        if (SIFI.beakerLiquidoZona) SIFI.beakerLiquidoZona.appendChild(dom);
      }
      dom.style.left = instance.x + '%';
      dom.style.top = instance.y + '%';

      SIFI.termostato.particulas.push(instance);
    }
  };

  /* ===================================================================
     TRANSIÇÕES DE ESTADO — cada uma só troca CLASSE CSS + contêiner
     pai (appendChild em um nó que já existe move, não duplica) e
     reseta a velocidade. A física (QUANDO cada transição acontece)
     mora em fisica-termostato.js; aqui é só o "como fica visualmente".
     =================================================================== */

  // Evaporação (líquido → gás): impulso pra cima ao escapar.
  SIFI.moverParticulaParaGas = function moverParticulaParaGas(p) {
    p.estado = 'gas';
    p.dom.classList.remove('termostato-particula--solido');
    p.dom.classList.add('termostato-particula--gas');
    if (SIFI.beakerGasZona) SIFI.beakerGasZona.appendChild(p.dom);
    p.x = 8 + Math.random() * 84;
    p.y = 8 + Math.random() * 78;
    p.vx = (Math.random() - 0.5) * 2;
    p.vy = -1.5 - Math.random();
  };

  // Fusão (sólido → líquido) OU condensação (gás → líquido) — quem
  // chama decide se reposiciona (a condensação "pinga" perto da
  // superfície; a fusão pode simplesmente começar a balançar dali
  // mesmo onde já estava, sem teleportar).
  SIFI.moverParticulaParaLiquido = function moverParticulaParaLiquido(p) {
    p.estado = 'liquido';
    p.dom.classList.remove('termostato-particula--gas', 'termostato-particula--solido');
    if (SIFI.beakerLiquidoZona) SIFI.beakerLiquidoZona.appendChild(p.dom);
    p.vx = 0; p.vy = 0;
  };

  // Solidificação (líquido → sólido): "trava" numa posição de grade.
  SIFI.moverParticulaParaSolido = function moverParticulaParaSolido(p) {
    p.estado = 'solido';
    p.dom.classList.remove('termostato-particula--gas');
    p.dom.classList.add('termostato-particula--solido');
    if (SIFI.beakerLiquidoZona) SIFI.beakerLiquidoZona.appendChild(p.dom);
    const pos = SIFI.calcularPosicaoGrade(p.id, SIFI.termostato.particulas.length);
    p.x = pos.x; p.y = pos.y;
    p.vx = 0; p.vy = 0;
  };

  /* ===================================================================
     ESCOLHER O LÍQUIDO — coloca a substância no béquer (troca a que
     já estava, se houver). Zera o histórico do gráfico: cada
     substância começa sua própria "corrida" do zero.
     =================================================================== */
  SIFI.selecionarSubstanciaTermostato = function selecionarSubstanciaTermostato(key) {
    // Portão de ativação — mesmo padrão do Módulo 1
    // (SIFI.addMoleculeToSandbox): sem o Módulo 2 ativo, nada acontece.
    if (SIFI.activeModule !== 2) {
      if (SIFI.announce) SIFI.announce('Ative o Módulo 2 antes de escolher um líquido.', 'assertive');
      return;
    }

    const mol = INTERMOL_MOLECULES.find(m => m.key === key);
    if (!mol) return;

    SIFI.termostato.substanciaKey = key;
    SIFI.termostato.historico = [];
    SIFI.termostato.tempoDecorrido = 0;
    SIFI.criarParticulasBequer(mol);

    if (SIFI.beakerHint) SIFI.beakerHint.classList.add('hidden');

    if (SIFI.termostatoSubstanciaNome) SIFI.termostatoSubstanciaNome.textContent = `${mol.name} (${mol.formula})`;
    if (SIFI.termostatoPE) {
      const pf = mol.meltingPoint === null ? 'não solidifica' : `${mol.meltingPoint}°C`;
      SIFI.termostatoPE.textContent = `PF ${pf} · PE ${mol.boilingPoint}°C`;
    }

    SIFI.buildTermostatoLista(); // reconstrói a lista pra marcar a selecionada
    SIFI.atualizarContadoresEstado();
    SIFI.atualizarStatusTexto();
    if (SIFI.desenharGraficoTemperatura) SIFI.desenharGraficoTemperatura();

    if (SIFI.announce) {
      SIFI.announce(`${mol.name} colocada no béquer. Ponto de ebulição real: ${mol.boilingPoint} graus Celsius.`);
    }
  };

  /* ===================================================================
     ESVAZIAR O BÉQUER
     =================================================================== */
  SIFI.limparBequer = function limparBequer() {
    SIFI.termostato.substanciaKey = null;
    SIFI.termostato.particulas = [];
    SIFI.termostato.historico = [];
    SIFI.termostato.tempoDecorrido = 0;
    if (SIFI.beakerLiquidoZona) SIFI.beakerLiquidoZona.innerHTML = '';
    if (SIFI.beakerGasZona) SIFI.beakerGasZona.innerHTML = '';
    if (SIFI.beakerBondsSvg) SIFI.beakerBondsSvg.innerHTML = '';
    if (SIFI.beakerHint) SIFI.beakerHint.classList.remove('hidden');
    if (SIFI.beakerNotaCovalente) SIFI.beakerNotaCovalente.hidden = true;
    if (SIFI.termostatoSubstanciaNome) SIFI.termostatoSubstanciaNome.textContent = 'Nenhuma';
    if (SIFI.termostatoPE) SIFI.termostatoPE.textContent = '—';

    SIFI.buildTermostatoLista();
    SIFI.atualizarContadoresEstado();
    SIFI.atualizarStatusTexto();
    if (SIFI.desenharGraficoTemperatura) SIFI.desenharGraficoTemperatura();
  };

  /* ===================================================================
     LEITURAS E TEXTO DE STATUS
     =================================================================== */
  SIFI.atualizarContadoresEstado = function atualizarContadoresEstado() {
    const solido = SIFI.termostato.particulas.filter(p => p.estado === 'solido').length;
    const liquido = SIFI.termostato.particulas.filter(p => p.estado === 'liquido').length;
    const gas = SIFI.termostato.particulas.filter(p => p.estado === 'gas').length;
    if (SIFI.termostatoNumSolido) SIFI.termostatoNumSolido.textContent = solido;
    if (SIFI.termostatoNumLiquido) SIFI.termostatoNumLiquido.textContent = liquido;
    if (SIFI.termostatoNumGas) SIFI.termostatoNumGas.textContent = gas;
  };

  /* Texto de status — determinado pela TEMPERATURA ATUAL contra os
     dois pontos de transição da substância, não pela contagem de
     partículas (mais previsível: o texto muda exatamente quando a
     temperatura cruza a marca, sem esperar as partículas "reagirem"). */
  SIFI.atualizarStatusTexto = function atualizarStatusTexto() {
    if (!SIFI.termostatoStatusTexto) return;
    const mol = INTERMOL_MOLECULES.find(m => m.key === SIFI.termostato.substanciaKey);
    if (!mol) { SIFI.termostatoStatusTexto.textContent = 'Escolha um líquido para começar.'; return; }

    const t = SIFI.termostato.temperatura;
    const acimaPE = t >= mol.boilingPoint;
    const acimaPF = mol.meltingPoint !== null && t >= mol.meltingPoint;

    // Sempre define os dois estados (visível/escondida) explicitamente
    // — só tratar "quando aparece" e nunca "quando some" deixaria a
    // nota presa visível pra sempre depois da primeira vez que ferveu.
    if (SIFI.beakerNotaCovalente) SIFI.beakerNotaCovalente.hidden = !acimaPE;

    if (acimaPE) {
      SIFI.termostatoStatusTexto.innerHTML = mol.sublima
        ? `<strong>Sublimando!</strong> Acima de ${mol.boilingPoint}°C, o ${mol.formula} vai direto de ` +
          `sólido pra gás, sem passar por líquido — a energia térmica está vencendo a força intermolecular.`
        : `<strong>Fervendo!</strong> Acima do ponto de ebulição (${mol.boilingPoint}°C) — a energia ` +
          `térmica está vencendo a força intermolecular.`;
    } else if (mol.sublima) {
      SIFI.termostatoStatusTexto.innerHTML =
        `<strong>${mol.name}</strong> no estado sólido — a 1 atm essa substância não tem fase líquida ` +
        `estável, então sublima direto pra gás acima de ${mol.boilingPoint}°C.`;
    } else if (mol.meltingPoint === null) {
      SIFI.termostatoStatusTexto.innerHTML =
        `<strong>${mol.name}</strong> no estado líquido — é a única substância que NUNCA solidifica a ` +
        `1 atm, nem chegando perto do zero absoluto (um efeito quântico das forças de London dela).`;
    } else if (acimaPF) {
      SIFI.termostatoStatusTexto.innerHTML =
        `<strong>${mol.name}</strong> no estado líquido — entre o ponto de fusão (${mol.meltingPoint}°C) ` +
        `e o de ebulição (${mol.boilingPoint}°C).`;
    } else {
      SIFI.termostatoStatusTexto.innerHTML =
        `<strong>${mol.name}</strong> no estado sólido — abaixo do ponto de fusão (${mol.meltingPoint}°C).`;
    }
  };

  SIFI.atualizarLeituraTemperatura = function atualizarLeituraTemperatura() {
    if (SIFI.termostatoTempAtual) SIFI.termostatoTempAtual.textContent = `${SIFI.termostato.temperatura}°C`;
    SIFI.atualizarStatusTexto();
  };

  /* ===================================================================
     CONTROLES: SLIDER DE TEMPERATURA + BOTÃO ESVAZIAR
     =================================================================== */
  SIFI.initTermostatoSliderControles = function initTermostatoSliderControles() {
    if (SIFI.termostatoSlider) {
      SIFI.termostatoSlider.addEventListener('input', () => {
        SIFI.termostato.temperatura = Number(SIFI.termostatoSlider.value);
        SIFI.atualizarLeituraTemperatura();
      });
    }
    if (SIFI.btnLimparBequer) {
      SIFI.btnLimparBequer.addEventListener('click', () => {
        SIFI.limparBequer();
        if (SIFI.announce) SIFI.announce('Béquer esvaziado.');
      });
    }
  };
});
