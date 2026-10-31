/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: fisica-solubilidade.js
   ORIGEM:  NOVO arquivo do SIFI, mas segue o MESMO padrão de loop dos
            outros dois motores (startLoop/stopLoop com setInterval).
   ───────────────────────────────────────────────────────────────
   O coração do Módulo 3 tem DOIS mecanismos independentes, que juntos
   respondem à pergunta "o que acontece quando eu misturo X com Y
   numa temperatura Z?":

   1) SOLUBILIDADE — "semelhante dissolve semelhante", medida numa
      escala contínua de polaridade (o índice de Snyder — L.R.
      Snyder, Journal of Chromatography, 92 (1978) 223-234). Decide
      se duas substâncias LÍQUIDAS se misturam (`SIFI.saoCompativeis`,
      `SIFI.agruparPorFase`) e se um SÓLIDO dissolve num líquido
      presente. Isso NÃO depende de temperatura — sal dissolve em
      água tanto a 5°C quanto a 60°C.

   2) TEMPERATURA — cada tubo tem seu próprio termostato
      (`tubo.temperatura`, controlado pelo slider no painel "Tubo
      Selecionado"). Compara a temperatura atual de cada substância
      com o PRÓPRIO ponto de fusão/ebulição dela
      (`SIFI.estadoFisicoNaTemperatura`, em prateleira.js) pra decidir
      se ela está sólida, líquida ou gasosa AGORA — e faz a transição
      de forma GRADUAL, não instantânea, reaproveitando as MESMAS
      funções de chance por tick já escritas pro Módulo 2
      (`SIFI.calcularChanceFusao/Escape/Condensa/Solidificacao`, em
      fisica-termostato.js, que carrega ANTES deste arquivo).

   Os dois mecanismos são INDEPENDENTES mas convivem no mesmo tubo:
   um sólido pode ficar livre de DUAS formas diferentes — porque
   DERRETEU (temperatura venceu a rede cristalina dele mesmo) ou
   porque DISSOLVEU (o solvente presente é compatível o bastante pra
   separar as partículas, mesmo sem chegar no ponto de fusão) — a
   mesma distinção quimicamente real entre "gelo derretendo" e "sal
   dissolvendo em água à temperatura ambiente".

   ZONAS VERTICAIS dentro de cada tubo (de cima pra baixo): GÁS →
   (várias camadas LÍQUIDAS, se não forem todas compatíveis) →
   SÓLIDO (cristal ainda não dissolvido, sempre no fundo).

   CASO ESPECIAL — sal (NaCl, `ionico: true`): ao dissolver (por
   solubilidade OU, em teoria, por fusão — embora o ponto de fusão
   real do sal, 800,7°C, fique fora do alcance do slider de -270 a
   200°C, então na prática isso nunca dispara), o par Na-Cl se SEPARA
   em dois íons independentes, não continua grudado como um sólido
   covalente (ex.: iodo) faria.
   Depende de: js/core/estado.js, js/data/dados-forcas-intermoleculares.js,
              js/ui/prateleira.js (SIFI.estadoFisicoNaTemperatura),
              js/ui/menu-moleculas.js (SIFI.buildMoleculeMiniSVG),
              js/simulation/fisica-termostato.js (as 4 funções de
              chance de transição, reaproveitadas diretamente).
   Usado por: js/ui/tubo-ensaio.js (SIFI.classificarTubo, ao criar/
              adicionar substância ou mexer no slider de temperatura),
              js/init/ativacao-modulos.js (startLabLoop/stopLabLoop).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Zonas verticais do tubo, em % — a mesma faixa pra todo mundo
  // calcular posição (criação de partícula, transição de estado,
  // movimento livre no tick).
  SIFI.LAB_ZONA_GAS_MIN = 4;
  SIFI.LAB_ZONA_GAS_MAX = 28;
  SIFI.LAB_ZONA_LIQUIDO_MIN = 34;
  SIFI.LAB_ZONA_LIQUIDO_MAX = 93;
  SIFI.LAB_ZONA_CRISTAL_MIN = 78;
  SIFI.LAB_ZONA_CRISTAL_MAX = 94;

  /* A regra PAREADA de solubilidade — "semelhante dissolve
     semelhante", numa escala contínua de polaridade, não um "polar
     ou apolar" binário. Substâncias iônicas (`ionico: true`, só o
     NaCl por enquanto) têm `polaridade` fixada BEM alta (10, acima
     até da água) — a atração íon-dipolo com um solvente polar é mais
     forte que a dipolo-dipolo comum entre duas moléculas polares,
     então sal se dá bem com água mas mal com qualquer coisa apolar,
     como na realidade. */
  SIFI.saoCompativeis = function saoCompativeis(molA, molB) {
    const diff = Math.abs(molA.polaridade - molB.polaridade);
    return diff <= SIFI.LAB_LIMITE_POLARIDADE;
  };

  /* Agrupa uma lista de moléculas ATUALMENTE LÍQUIDAS em fases — ver
     o cabeçalho do arquivo pra explicação completa do algoritmo
     (ordena por polaridade, anda pela lista juntando vizinhos
     compatíveis). */
  SIFI.agruparPorFase = function agruparPorFase(mols) {
    if (!mols.length) return [];
    const ordenados = mols.slice().sort((a, b) => a.polaridade - b.polaridade);
    const fases = [[ordenados[0]]];
    for (let i = 1; i < ordenados.length; i++) {
      const anterior = ordenados[i - 1], atual = ordenados[i];
      if (Math.abs(atual.polaridade - anterior.polaridade) <= SIFI.LAB_LIMITE_POLARIDADE) {
        fases[fases.length - 1].push(atual);
      } else {
        fases.push([atual]);
      }
    }
    return fases;
  };

  /* Classifica o tubo INTEIRO pro estado ATUAL — quais substâncias
     estão líquidas AGORA (na temperatura atual do tubo), como elas se
     agrupam em fases, e pra quais sólidos "presos" (ainda em cristal)
     existe uma fase compatível pra dissolver. NÃO decide transições
     de estado por si só (isso é do tick de física, com chance
     gradual) — só reflete a distribuição ATUAL em bandas verticais.
     Chamada tanto ao adicionar/remover substância quanto a cada tick
     de física (idempotente: chamar de novo sem nada ter mudado dá o
     mesmo resultado). */
  SIFI.classificarTubo = function classificarTubo(tubo) {
    const mols = tubo.substancias.map(k => INTERMOL_MOLECULES.find(m => m.key === k)).filter(Boolean);

    const liquidosAgora = mols.filter(m => {
      const p = tubo.particulas.find(pp => pp.substanciaKey === m.key);
      return p ? p.estadoFisico === 'liquido' : SIFI.estadoFisicoNaTemperatura(m, tubo.temperatura) === 'liquido';
    });
    const solidosAgora = mols.filter(m => {
      const p = tubo.particulas.find(pp => pp.substanciaKey === m.key);
      return p ? p.estadoFisico === 'solido' : SIFI.estadoFisicoNaTemperatura(m, tubo.temperatura) === 'solido';
    });

    const gruposBrutos = SIFI.agruparPorFase(liquidosAgora);
    const fases = gruposBrutos.map(grupo => ({
      mols: grupo,
      keys: grupo.map(m => m.key),
      densidadeMedia: grupo.reduce((s, m) => s + m.density, 0) / grupo.length,
    }));
    fases.sort((a, b) => a.densidadeMedia - b.densidadeMedia); // menos densa primeiro (fica em cima)

    const n = Math.max(1, fases.length);
    const alturaTotal = SIFI.LAB_ZONA_LIQUIDO_MAX - SIFI.LAB_ZONA_LIQUIDO_MIN;
    const alturaBanda = alturaTotal / n;
    fases.forEach((fase, i) => {
      fase.yMin = SIFI.LAB_ZONA_LIQUIDO_MIN + i * alturaBanda;
      fase.yMax = SIFI.LAB_ZONA_LIQUIDO_MIN + (i + 1) * alturaBanda;
    });

    tubo.fases = fases;
    tubo.compativel = fases.length <= 1; // mantém o nome antigo, generalizado pra N substâncias

    // Toda partícula ATUALMENTE líquida é clampada (não teleportada —
    // só empurrada de volta pra dentro, se preciso) pra banda certa.
    tubo.particulas.forEach(p => {
      if (p.estadoFisico !== 'liquido') return;
      const fase = fases.find(f => f.keys.includes(p.substanciaKey));
      if (!fase) return;
      p.faseMinY = fase.yMin; p.faseMaxY = fase.yMax;
      p.y = Math.min(fase.yMax, Math.max(fase.yMin, p.y));
      p.dom.style.top = p.y + '%';
    });

    // Sólidos AINDA PRESOS: recalcula se existe alguma fase compatível
    // pra dissolver dentro dela (guarda a fase inteira, não só um
    // booleano, pra saber pra ONDE mandar as partículas ao dissolver).
    solidosAgora.forEach(solidoMol => {
      const faseCompativel = fases.find(f => f.mols.some(lm => SIFI.saoCompativeis(lm, solidoMol))) || null;
      tubo.particulas
        .filter(p => p.substanciaKey === solidoMol.key && p.estadoFisico === 'solido' && p.estadoNoTubo === 'presa')
        .forEach(p => { p.faseAlvo = faseCompativel; });
    });
  };

  /* Texto explicativo do painel "Tubo Selecionado" — cobre os TRÊS
     estados possíveis ao mesmo tempo (algumas substâncias podem
     estar fervendo enquanto outras ainda estão sólidas, tudo no
     MESMO tubo, cada uma na sua própria temperatura de transição). */
  SIFI.gerarTextoStatusTubo = function gerarTextoStatusTubo(tubo) {
    const mols = tubo.substancias.map(k => INTERMOL_MOLECULES.find(m => m.key === k)).filter(Boolean);
    const partes = [];

    const porEstado = { solido: [], liquido: [], gas: [] };
    mols.forEach(m => {
      const p = tubo.particulas.find(pp => pp.substanciaKey === m.key);
      const estado = p ? p.estadoFisico : SIFI.estadoFisicoNaTemperatura(m, tubo.temperatura);
      porEstado[estado].push(m);
    });

    if (porEstado.gas.length) {
      const nomes = porEstado.gas.map(m => m.name).join(', ');
      partes.push(`<strong>Fervendo!</strong> ${nomes} — acima do próprio ponto de ebulição nesta temperatura, virando gás.`);
    }

    if (porEstado.liquido.length === 1) {
      partes.push(`<strong>${porEstado.liquido[0].name}</strong> líquida no tubo.`);
    } else if (porEstado.liquido.length > 1) {
      if (tubo.fases.length <= 1) {
        const nomes = porEstado.liquido.map(m => m.name).join(', ');
        partes.push(
          `<strong>Mistura homogênea!</strong> ${nomes} — todos compatíveis ` +
          `(dentro do limite de polaridade), uma fase só.`
        );
      } else {
        partes.push(
          `<strong>${tubo.fases.length} camadas separadas.</strong> Os líquidos se agruparam ` +
          `por polaridade parecida, ordenados por densidade (a mais densa embaixo).`
        );
      }
    }

    porEstado.solido.forEach(s => {
      const particula = tubo.particulas.find(p => p.substanciaKey === s.key);
      const presa = particula && particula.estadoNoTubo === 'presa';
      if (presa) {
        partes.push(particula.faseAlvo
          ? `<strong>${s.name}</strong> (sólida nesta temperatura) está dissolvendo aos poucos.`
          : `<strong>${s.name}</strong> (sólida nesta temperatura) não dissolve em nada presente — fica intacta no fundo.`);
      } else if (particula) {
        partes.push(`<strong>${s.name}</strong> já dissolvida, mesmo sendo sólida nesta temperatura.`);
      }
    });

    return partes.join(' ') || 'Nada acontecendo no momento.';
  };

  /* ===================================================================
     TRANSIÇÃO DE ESTADO FÍSICO (por temperatura) — reposiciona a
     partícula na zona certa do tubo. Chamada pelo tick quando a
     chance probabilística (SIFI.calcularChanceFusao/Escape/Condensa/
     Solidificacao, do Módulo 2) sorteia a transição neste tick.
     =================================================================== */
  function transicionarEstadoFisico(tubo, p, mol, novoEstado) {
    p.estadoFisico = novoEstado;
    p.dom.classList.remove('tubo-particula--cristal', 'tubo-particula--gas');
    p.vx = 0; p.vy = 0;

    if (novoEstado === 'solido') {
      p.estadoNoTubo = 'presa';
      p.dom.classList.add('tubo-particula--cristal');
      p.x = 15 + Math.random() * 70;
      p.y = SIFI.LAB_ZONA_CRISTAL_MIN + Math.random() * (SIFI.LAB_ZONA_CRISTAL_MAX - SIFI.LAB_ZONA_CRISTAL_MIN);
    } else if (novoEstado === 'gas') {
      p.estadoNoTubo = 'livre';
      p.dom.classList.add('tubo-particula--gas');
      p.x = 15 + Math.random() * 70;
      p.y = SIFI.LAB_ZONA_GAS_MIN + Math.random() * (SIFI.LAB_ZONA_GAS_MAX - SIFI.LAB_ZONA_GAS_MIN);
      p.vy = -0.5;
    } else { // líquido
      p.estadoNoTubo = 'livre';
      p.x = 15 + Math.random() * 70;
      p.y = SIFI.LAB_ZONA_LIQUIDO_MIN + Math.random() * (SIFI.LAB_ZONA_LIQUIDO_MAX - SIFI.LAB_ZONA_LIQUIDO_MIN);
      // faseMinY/faseMaxY são resolvidas no SIFI.classificarTubo logo
      // em seguida, no mesmo tick (roda depois do loop de partículas).
    }
    p.dom.style.left = p.x + '%';
    p.dom.style.top = p.y + '%';

    // Sal fundindo (só na teoria — o PF real, 800,7°C, fica fora do
    // alcance do slider) também se separa em íons, mesma lógica da
    // dissolução por solubilidade — consistência entre os dois
    // mecanismos que podem "libertar" um sólido iônico.
    if (mol.ionico && novoEstado !== 'solido' && tubo.particulas.includes(p)) {
      SIFI.separarEmIons(tubo, p, mol);
    }
  }

  /* ===================================================================
     DISSOLVER POR SOLUBILIDADE — solta do cristal e passa a se mover
     livre DENTRO DA BANDA da fase compatível (`p.faseAlvo`). Mecanismo
     INDEPENDENTE da temperatura (ver cabeçalho do arquivo).
     =================================================================== */
  function dissolverParticula(tubo, p, mol) {
    p.estadoNoTubo = 'livre';
    p.dom.classList.remove('tubo-particula--cristal');
    p.vx = 0; p.vy = 0;

    const fase = p.faseAlvo;
    p.x = 15 + Math.random() * 70;
    if (fase) {
      p.y = fase.yMin + Math.random() * (fase.yMax - fase.yMin);
      p.faseMinY = fase.yMin; p.faseMaxY = fase.yMax;
    } else {
      p.y = SIFI.LAB_ZONA_LIQUIDO_MIN + Math.random() * (SIFI.LAB_ZONA_LIQUIDO_MAX - SIFI.LAB_ZONA_LIQUIDO_MIN);
    }
    p.dom.style.left = p.x + '%';
    p.dom.style.top = p.y + '%';

    if (mol.ionico) SIFI.separarEmIons(tubo, p, mol);
  }

  /* Troca UMA partícula "par iônico" (ex.: NaCl inteiro) por DUAS
     partículas de um único íon cada (Na sozinho, Cl sozinho) —
     reaproveita SIFI.buildMoleculeMiniSVG com uma "molécula-fantasma"
     de 1 átomo só. Os dois íons herdam o MESMO estado físico e banda
     de fase da partícula original. Exposta em SIFI.* pra testar
     isoladamente. */
  SIFI.separarEmIons = function separarEmIons(tubo, parIonico, mol) {
    const idx = tubo.particulas.indexOf(parIonico);
    if (idx === -1) return;

    parIonico.dom.remove();
    tubo.particulas.splice(idx, 1);

    mol.atoms.forEach((atomo, i) => {
      const ionMol = { atoms: [{ el: atomo.el, x: 0, y: 0 }], bonds: [] };
      const dom = document.createElement('div');
      dom.className = 'tubo-particula tubo-particula--ion';
      dom.style.setProperty('--particula-cor', FORCE_TYPES[mol.dominantForce].color);
      dom.innerHTML = SIFI.buildMoleculeMiniSVG(ionMol, false);
      dom.setAttribute('aria-hidden', 'true');

      const x = Math.min(90, Math.max(10, parIonico.x + (Math.random() - 0.5) * 12));
      const y = Math.min(90, Math.max(10, parIonico.y + (Math.random() - 0.5) * 12));
      dom.style.left = x + '%';
      dom.style.top = y + '%';
      if (tubo.dom.particulasEl) tubo.dom.particulasEl.appendChild(dom);

      tubo.particulas.push({
        id: `${parIonico.id}-ion${i}`, substanciaKey: mol.key,
        estadoFisico: parIonico.estadoFisico, estadoNoTubo: 'livre',
        x, y, vx: 0, vy: 0, dom, ionDe: atomo.el,
        faseMinY: parIonico.faseMinY, faseMaxY: parIonico.faseMaxY,
      });
    });
  };

  /* ===================================================================
     TICK DE FÍSICA — roda pra TODOS os tubos existentes ao mesmo tempo
     (2 a 10, o que quer que exista no momento). Pra cada partícula:
       1) checa transição de estado por TEMPERATURA (probabilística)
       2) se sólida e presa, checa dissolução por SOLUBILIDADE
       3) move livre (líquido, gás, ou sólido já solto)
     =================================================================== */
  SIFI.labTick = function labTick() {
    if (!SIFI.laboratorio.rodando) return;

    SIFI.laboratorio.tubos.forEach(tubo => {
      if (!tubo.substancias.length) return;
      const mols = tubo.substancias.map(k => INTERMOL_MOLECULES.find(m => m.key === k)).filter(Boolean);
      const temp = tubo.temperatura;

      tubo.particulas.forEach(p => {
        const mol = mols.find(m => m.key === p.substanciaKey);
        if (!mol) return;

        // ---- 1) Transição por TEMPERATURA (reaproveita as funções
        // de chance do Módulo 2 — mesmo formato, mesma sensação de
        // "gradual", não instantâneo). ----
        const temFusao = mol.meltingPoint !== null && mol.meltingPoint !== undefined;

        if (p.estadoFisico === 'solido' && mol.sublima) {
          if (temp >= mol.boilingPoint && Math.random() < SIFI.calcularChanceEscape(temp, mol.boilingPoint)) {
            transicionarEstadoFisico(tubo, p, mol, 'gas');
          }
        } else if (p.estadoFisico === 'solido' && temFusao) {
          if (temp >= mol.meltingPoint && Math.random() < SIFI.calcularChanceFusao(temp, mol.meltingPoint)) {
            transicionarEstadoFisico(tubo, p, mol, 'liquido');
          }
        } else if (p.estadoFisico === 'liquido') {
          if (temp >= mol.boilingPoint && Math.random() < SIFI.calcularChanceEscape(temp, mol.boilingPoint)) {
            transicionarEstadoFisico(tubo, p, mol, 'gas');
          } else if (temFusao && temp < mol.meltingPoint
            && Math.random() < SIFI.calcularChanceSolidificacao(temp, mol.meltingPoint)) {
            transicionarEstadoFisico(tubo, p, mol, 'solido');
          }
        } else if (p.estadoFisico === 'gas') {
          if (temp < mol.boilingPoint && Math.random() < SIFI.calcularChanceCondensa(temp, mol.boilingPoint)) {
            transicionarEstadoFisico(tubo, p, mol, mol.sublima ? 'solido' : 'liquido');
          }
        }

        // ---- 2) Dissolução por SOLUBILIDADE (só se ainda sólida E presa). ----
        if (p.estadoFisico === 'solido' && p.estadoNoTubo === 'presa') {
          const jitterX = (Math.random() - 0.5) * 0.5;
          p.dom.style.left = (p.x + jitterX) + '%';
          if (p.faseAlvo && Math.random() < SIFI.LAB_CHANCE_DISSOLVER) {
            dissolverParticula(tubo, p, mol);
          }
          return; // ainda presa — não processa movimento livre abaixo
        }

        // ---- 3) Movimento LIVRE (líquido, gás, ou sólido já solto). ----
        if (p.estadoFisico === 'gas') {
          p.vx = (p.vx + (Math.random() - 0.5) * 0.5) * 0.9;
          p.vy = (p.vy + (Math.random() - 0.5) * 0.5 - 0.02) * 0.9; // leve tendência pra cima
          p.x = Math.min(92, Math.max(8, p.x + p.vx));
          p.y = Math.min(SIFI.LAB_ZONA_GAS_MAX, Math.max(SIFI.LAB_ZONA_GAS_MIN, p.y + p.vy));
        } else {
          p.vx = (p.vx + (Math.random() - 0.5) * 0.35) * 0.85;
          p.vy = (p.vy + (Math.random() - 0.5) * 0.35) * 0.85;
          p.x = Math.min(92, Math.max(8, p.x + p.vx));
          const minY = p.faseMinY !== undefined ? p.faseMinY : SIFI.LAB_ZONA_LIQUIDO_MIN;
          const maxY = p.faseMaxY !== undefined ? p.faseMaxY : SIFI.LAB_ZONA_LIQUIDO_MAX;
          p.y = Math.min(maxY, Math.max(minY, p.y + p.vy));
        }
        p.dom.style.left = p.x + '%';
        p.dom.style.top = p.y + '%';
      });

      // Reclassifica DEPOIS de aplicar as transições deste tick —
      // atualiza as bandas de fase (quem está líquido AGORA, quem
      // tem fase compatível pra dissolver).
      if (SIFI.classificarTubo) SIFI.classificarTubo(tubo);

      // Contador sólido/líquido/gás e o texto de status só precisam
      // atualizar de verdade pro tubo que está sendo mostrado no
      // painel agora — sem isso, uma transição GRADUAL (a chance por
      // tick pode levar vários ticks pra "pegar") só apareceria na
      // tela na próxima vez que o usuário mexesse no slider.
      if (SIFI.laboratorio.tuboAtivo === tubo.id) {
        if (SIFI.atualizarContadorEstadosTubo) SIFI.atualizarContadorEstadosTubo(tubo);
        if (SIFI.gerarTextoStatusTubo && SIFI.tuboStatusTexto && tubo.substancias.length) {
          SIFI.tuboStatusTexto.innerHTML = SIFI.gerarTextoStatusTubo(tubo);
        }
      }
    });
  };

  SIFI.startLabLoop = function startLabLoop() {
    if (SIFI.simLoopLab) return;
    SIFI.laboratorio.rodando = true;
    SIFI.simLoopLab = setInterval(SIFI.labTick, SIFI.LAB_DT);
  };

  SIFI.stopLabLoop = function stopLabLoop() {
    if (SIFI.simLoopLab) { clearInterval(SIFI.simLoopLab); SIFI.simLoopLab = null; }
    SIFI.laboratorio.rodando = false;
  };
});
