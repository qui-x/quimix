/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: sandbox.js
   ORIGEM:  NOVO arquivo do SIFI. A ideia de "arrastar e detectar
            proximidade" é nova (o SILQ arrasta ÁTOMOS dentro de UMA
            molécula; aqui arrastamos MOLÉCULAS inteiras). A linha
            tracejada de interação reaproveita o mesmo <svg id="bond-svg">
            que o SILQ usa para desenhar ligações.
   ───────────────────────────────────────────────────────────────
   O "Tabuleiro das Atrações" (Módulo 1): coloca moléculas na caixa
   de areia, permite arrastá-las com o mouse/toque, REMOVÊ-LAS (duplo
   clique ou tecla Delete/Backspace — mesmo padrão de exclusão do
   SILQ em atomos.js), calcula a posição exata de cada polo δ+/δ−
   (usada pelo motor de física em js/simulation/fisica-intermolecular.js)
   e identifica TODAS as interações intermoleculares ativas ao mesmo
   tempo — não só o par mais próximo: com 3+ moléculas na tela,
   várias interações podem estar acontecendo simultaneamente, cada
   uma com sua própria força.

   DE PROPÓSITO, a ficha da molécula no canvas não mostra
   nome/fórmula (nem em tooltip): só os átomos, ligações e polos
   δ+/δ−, soltos, sem nenhum cartão/moldura ao redor. A ideia é que o
   aluno raciocine sobre a interação observando a FORMA e os POLOS
   visíveis — a identificação de qual composto é qual só aparece no
   painel "Interações" (sidebar direita), como uma conferência depois
   da análise visual, não como resposta pronta colada na molécula.
   Leitores de tela continuam recebendo o nome via aria-label (isso
   não é "trapaça visual" nenhuma — é a única forma de quem usa leitor
   de tela conseguir operar o simulador).

   PORTÃO DE ATIVAÇÃO: assim como o SILQ só reage a cliques na tabela
   periódica depois de o usuário escolher um tipo de ligação,
   SIFI.addMoleculeToSandbox() só funciona com o Módulo 1 ativo
   (SIFI.activeModule === 1). A ativação em si mora em
   js/init/ativacao-modulos.js.
   Depende de: js/core/estado.js, js/core/dom-refs.js,
              js/data/dados-forcas-intermoleculares.js,
              js/ui/menu-moleculas.js (SIFI.buildMoleculeMiniSVG e
              SIFI.moleculeLayout).
   Usado por: js/init/ativacao-modulos.js,
              js/simulation/fisica-intermolecular.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     ADICIONAR MOLÉCULA AO CANVAS
     =================================================================== */
  SIFI.addMoleculeToSandbox = function addMoleculeToSandbox(key) {
    // Portão de ativação: sem o Módulo 1 ativo, nada acontece — igual
    // ao SILQ, que ignora cliques na tabela periódica fora de um modo.
    if (SIFI.activeModule !== 1) {
      if (SIFI.announce) SIFI.announce('Ative o Módulo 1 antes de colocar moléculas no canvas.', 'assertive');
      return;
    }

    // Restrição de verdade (não só visual): já no teto de interações
    // ativas? Recusa adicionar mais — senão a simulação cresce sem
    // controle (e o processador sofre). Usa a contagem do último
    // cálculo (SIFI.interacoesAtivas), que é sempre recente: toda
    // adição/remoção recalcula na hora, e a física recalcula em loop.
    if (SIFI.interacoesAtivas.size >= SIFI.MAX_INTERACOES_ATIVAS) {
      if (SIFI.announce) {
        SIFI.announce(`Limite de ${SIFI.MAX_INTERACOES_ATIVAS} interações atingido. Remova algumas moléculas antes de adicionar mais.`, 'assertive');
      }
      return;
    }

    // O de cima (interações) é quem realmente protege no dia a dia —
    // reage à posição de verdade das moléculas. Este segundo portão
    // é a capacidade máxima da próprio canvas, testada para
    // ficar segura mesmo no agrupamento mais apertado fisicamente
    // possível (ver SIFI.MAX_MOLECULAS_SANDBOX em estado.js para os
    // números da simulação que validou esse valor).
    if (SIFI.canvasMolecules.length >= SIFI.MAX_MOLECULAS_SANDBOX) {
      if (SIFI.announce) {
        SIFI.announce(`Limite de ${SIFI.MAX_MOLECULAS_SANDBOX} moléculas no canvas atingido.`, 'assertive');
      }
      return;
    }

    const mol = INTERMOL_MOLECULES.find(m => m.key === key);
    if (!mol || !SIFI.sandbox) return;

    const id = ++SIFI.idCounter;
    // Espalha as moléculas em cascata, para não nascerem todas empilhadas.
    const n = SIFI.canvasMolecules.length;
    const x = 30 + (n % 4) * 95 + Math.random() * 15;
    const y = 30 + Math.floor(n / 4) * 85 + Math.random() * 15;

    const dom = document.createElement('div');
    dom.className = 'sifi-molecule';
    dom.dataset.id = String(id);
    dom.style.left = x + 'px';
    dom.style.top = y + 'px';

    // A11Y: torna a ficha focável e descritível por leitor de tela —
    // mesmo padrão do átomo no SILQ (atomos.js → renderAtom). O nome
    // do composto só existe AQUI (invisível, só para leitor de tela);
    // visualmente a ficha não identifica qual composto é.
    dom.setAttribute('tabindex', '0');
    dom.setAttribute('role', 'button');
    dom.setAttribute('aria-label',
      `${mol.name} (${mol.formula}) no canvas. Arraste para mover. ` +
      `Duplo clique ou tecla Delete para remover.`
    );

    dom.innerHTML = SIFI.buildMoleculeMiniSVG(mol, true);
    SIFI.sandbox.appendChild(dom);

    // Posição de cada polo δ+/δ−, RELATIVA AO CENTRO do desenho (não
    // ao canto) — é o que permite girar: um ponto relativo ao centro,
    // rotacionado, continua descrevendo o mesmo polo em qualquer
    // ângulo. Calculada uma vez aqui com a mesma função usada para
    // desenhar (SIFI.moleculeLayout) e reaproveitada a cada frame
    // pelo motor de física (SIFI.polosAbsolutos, mais abaixo).
    const { W, H, px, py } = SIFI.moleculeLayout(mol, true);
    const poloLocal = {
      positivo: (mol.poloPositivo || []).map(idx => ({ x: px(mol.atoms[idx].x) - W / 2, y: py(mol.atoms[idx].y) - H / 2 })),
      negativo: (mol.poloNegativo || []).map(idx => ({ x: px(mol.atoms[idx].x) - W / 2, y: py(mol.atoms[idx].y) - H / 2 })),
    };

    const instance = {
      id, key, x, y, vx: 0, vy: 0, dragging: false, dom, mol, poloLocal,
      // Rotação: começa em 0° (como foi desenhada). dipoloAngleLocal é
      // null para moléculas apolares (sem direção "certa" — ver
      // SIFI.dipoloAngleLocal em menu-moleculas.js). tumbleSpeed só é
      // usado por elas: um giro livre e lento, sorteado uma vez aqui,
      // representando a ausência de orientação preferencial da força
      // de London (ver js/simulation/fisica-intermolecular.js).
      rotation: 0,
      dipoloAngleLocal: SIFI.dipoloAngleLocal(mol),
      tumbleSpeed: (Math.random() - 0.5) * 2 * SIFI.TUMBLE_SPEED_MAX,
    };
    SIFI.canvasMolecules.push(instance);
    SIFI.makeMoleculeDraggable(instance);
    SIFI.attachRemovalHandlers(instance);
    SIFI.updateSandboxHint();
    SIFI.updateForceDetection();

    if (SIFI.announce) SIFI.announce(`${mol.name} adicionada ao canvas.`);
  };

  /* ===================================================================
     ARRASTAR MOLÉCULA (Pointer Events cobrem mouse e toque)
     =================================================================== */
  SIFI.makeMoleculeDraggable = function makeMoleculeDraggable(instance) {
    const dom = instance.dom;
    let offX = 0, offY = 0;
    dom.style.cursor = 'grab';

    dom.addEventListener('pointerdown', e => {
      instance.dragging = true;
      dom.setPointerCapture(e.pointerId);
      dom.style.cursor = 'grabbing';
      dom.classList.add('sifi-molecule--dragging');
      const r = dom.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
    });

    dom.addEventListener('pointermove', e => {
      if (!instance.dragging) return;
      const sbRect = SIFI.sandbox.getBoundingClientRect();
      let nx = e.clientX - sbRect.left - offX;
      let ny = e.clientY - sbRect.top - offY;
      nx = Math.max(0, Math.min(sbRect.width - dom.offsetWidth, nx));
      ny = Math.max(0, Math.min(sbRect.height - dom.offsetHeight, ny));
      instance.x = nx; instance.y = ny;
      instance.vx = 0; instance.vy = 0; // o usuário está no controle, a física espera
      dom.style.left = nx + 'px';
      dom.style.top = ny + 'px';
      SIFI.updateForceDetection();
    });

    const soltar = () => {
      instance.dragging = false;
      dom.style.cursor = 'grab';
      dom.classList.remove('sifi-molecule--dragging');
    };
    dom.addEventListener('pointerup', soltar);
    dom.addEventListener('pointercancel', soltar);
  };

  /* ===================================================================
     REMOVER MOLÉCULA — mesmo padrão de exclusão do SILQ (atomos.js):
       • Duplo clique na ficha remove.
       • Tecla Delete/Backspace com a ficha focada remove.
     (Sem botão "×" visível: com várias moléculas próximas, um botão
     fixo no canto acabava sobrepondo/tampando as vizinhas — ver
     ARQUITETURA-SIFI.md → "Por que sem botão de remover".)
     =================================================================== */
  SIFI.attachRemovalHandlers = function attachRemovalHandlers(instance) {
    const dom = instance.dom;

    // Duplo clique em qualquer parte da ficha remove — igual ao SILQ.
    dom.addEventListener('dblclick', e => {
      e.stopPropagation();
      SIFI.removeMolecule(instance);
    });

    // Delete/Backspace com a ficha focada (Tab até ela) remove — mesma
    // alternativa de acessibilidade do SILQ para quem não usa mouse.
    dom.addEventListener('keydown', e => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        SIFI.removeMolecule(instance);
      }
    });
  };

  SIFI.removeMolecule = function removeMolecule(instance) {
    // Tira do ESTADO imediatamente — a física e a detecção de força não
    // devem mais considerar esta molécula, mesmo antes da animação acabar.
    SIFI.canvasMolecules = SIFI.canvasMolecules.filter(m => m.id !== instance.id);

    // Efeito visual de saída (encolhe e some), remove o elemento do DOM
    // só depois — puramente cosmético, não bloqueia mais nada. Enquanto
    // a animação roda, a ficha já sai do foco/leitor de tela na hora
    // (pointer-events:none no CSS já impede clique nela nesse meio-tempo).
    // Limpa o `transform` inline (usado para a rotação a cada tick de
    // física) ANTES: como estilo inline tem prioridade sobre a classe
    // CSS, um "rotate(...)" esquecido ali impediria o scale(0) da
    // animação de saída de funcionar.
    instance.dom.style.transform = '';
    instance.dom.classList.add('sifi-molecule--removendo');
    instance.dom.setAttribute('aria-hidden', 'true');
    instance.dom.setAttribute('tabindex', '-1');
    setTimeout(() => instance.dom.remove(), 200);

    SIFI.updateSandboxHint();
    SIFI.updateForceDetection();

    if (SIFI.announce) SIFI.announce(`${instance.mol.name} removida do canvas.`, 'assertive');
  };

  /* ===================================================================
     CLASSIFICAÇÃO DA FORÇA ENTRE DUAS MOLÉCULAS
     ───────────────────────────────────────────────────────────────
     Regra didática (simplificação intencional para esta etapa):
       1. As duas moléculas conseguem fazer ligação de hidrogênio?
          → Ligação de Hidrogênio (a mais forte).
       2. Senão, as duas são polares?
          → Dipolo-Dipolo.
       3. Senão (pelo menos uma é apolar)
          → Dipolo Induzido / Forças de London (sempre presente,
            mas só é a força DOMINANTE quando não há polos fixos).
     =================================================================== */
  SIFI.classifyPairForce = function classifyPairForce(molA, molB) {
    if (molA.dominantForce === 'hydrogen-bond' && molB.dominantForce === 'hydrogen-bond') {
      return 'hydrogen-bond';
    }
    if (molA.polar && molB.polar) return 'dipole-dipole';
    return 'london';
  };

  /* ===================================================================
     POLOS ABSOLUTOS (posição real na tela de cada δ+/δ−) — já leva em
     conta a rotação atual da molécula: o ponto local (relativo ao
     centro) é girado pelo ângulo `instance.rotation` e só depois
     somado à posição do centro na tela. Sem isso, o δ+/δ− "ficaria
     parado" na tela enquanto o desenho gira ao redor dele.
     =================================================================== */
  SIFI.polosAbsolutos = function polosAbsolutos(instance) {
    const rad = (instance.rotation || 0) * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    const centerX = instance.x + instance.dom.offsetWidth / 2;
    const centerY = instance.y + instance.dom.offsetHeight / 2;
    const girar = p => ({
      x: centerX + (p.x * cos - p.y * sin),
      y: centerY + (p.x * sin + p.y * cos),
    });

    const abs = [];
    instance.poloLocal.positivo.forEach(p => { const g = girar(p); abs.push({ x: g.x, y: g.y, sinal: 1 }); });
    instance.poloLocal.negativo.forEach(p => { const g = girar(p); abs.push({ x: g.x, y: g.y, sinal: -1 }); });
    return abs;
  };

  /* Entre os polos de A e os polos de B, acha o par mais próximo.
     Retorna null se uma das duas não tiver polo (molécula apolar). */
  SIFI.polosMaisProximos = function polosMaisProximos(a, b) {
    const polosA = SIFI.polosAbsolutos(a), polosB = SIFI.polosAbsolutos(b);
    if (!polosA.length || !polosB.length) return null;
    let melhor = null, menorD = Infinity;
    polosA.forEach(pa => polosB.forEach(pb => {
      const d = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      if (d < menorD) { menorD = d; melhor = { pa, pb, d }; }
    }));
    return melhor;
  };

  /* ===================================================================
     DETECÇÃO DE PROXIMIDADE — TODAS as interações ativas ao mesmo
     tempo, não só a mais próxima. Com 3+ moléculas no canvas,
     é perfeitamente possível ter, por exemplo, um par fazendo Ligação
     de Hidrogênio enquanto outro par (envolvendo uma terceira
     molécula apolar) só faz London — os dois acontecem juntos, e o
     painel "Interações" (sidebar direita) precisa mostrar os dois.

     DESEMPENHO: com muitas moléculas (20+), o número de PARES cresce
     rápido (é combinação, não soma: 21 moléculas → até 210 pares).
     Duas coisas evitam sobrecarregar o processador:
       1. As linhas tracejadas SVG são desenhadas só para os pares MAIS
          PRÓXIMOS, até um limite (`SIFI.MAX_LINHAS_DESENHADAS`) — com
          150+ pares ativos, linhas demais também ficariam ilegíveis
          na tela (um emaranhado), então limitar ajuda dos dois lados.
          Os números do painel (substâncias, interações ativas, e a
          contagem "×N" de cada grupo) continuam contando TODOS os
          pares, sem exceção — só o DESENHO das linhas é limitado.
       2. Quem chama esta função com muita frequência (o loop de
          física, 60x/s) não chama a cada tick — ver
          js/simulation/fisica-intermolecular.js, que throttla essa
          chamada para umas 10x/s. Chamadas diretas (adicionar/remover
          molécula, arrastar) continuam imediatas, sem throttle —
          são eventos pontuais do usuário, não um loop contínuo.
     =================================================================== */
  SIFI.updateForceDetection = function updateForceDetection() {
    const mols = SIFI.canvasMolecules;
    const interacoes = [];
    const chavesAtuais = new Set();

    for (let i = 0; i < mols.length; i++) {
      for (let j = i + 1; j < mols.length; j++) {
        const a = mols[i], b = mols[j];
        const cx1 = a.x + a.dom.offsetWidth / 2, cy1 = a.y + a.dom.offsetHeight / 2;
        const cx2 = b.x + b.dom.offsetWidth / 2, cy2 = b.y + b.dom.offsetHeight / 2;
        const d = Math.hypot(cx2 - cx1, cy2 - cy1);
        if (d >= SIFI.RAIO_INTERACAO) continue;

        const forceKey = SIFI.classifyPairForce(a.mol, b.mol);
        const chave = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
        chavesAtuais.add(chave);
        interacoes.push({ chave, a, b, forceKey, dist: d, cx1, cy1, cx2, cy2, nova: !SIFI.interacoesAtivas.has(chave) });
      }
    }

    SIFI.interacoesAtivas = chavesAtuais;
    SIFI.desenharLinhasInteracao(interacoes);
    SIFI.renderInteracoesPanel(interacoes);
  };

  /* Desenha as linhas tracejadas no canvas — só para os pares
     mais próximos (as interações "mais fortes" nesse instante), até
     o limite de SIFI.MAX_LINHAS_DESENHADAS, para não criar centenas
     de elementos SVG por segundo quando há muitas moléculas juntas. */
  SIFI.desenharLinhasInteracao = function desenharLinhasInteracao(interacoes) {
    if (!SIFI.svgEl) return;
    const paraDesenhar = interacoes.length <= SIFI.MAX_LINHAS_DESENHADAS
      ? interacoes
      : interacoes.slice().sort((x, y) => x.dist - y.dist).slice(0, SIFI.MAX_LINHAS_DESENHADAS);

    while (SIFI.svgEl.childElementCount > paraDesenhar.length) SIFI.svgEl.lastElementChild.remove();
    paraDesenhar.forEach((inter, index) => {
      const cor = FORCE_TYPES[inter.forceKey].color;
      // Se as duas moléculas têm polo (dipolo-dipolo / ligação de
      // hidrogênio), a linha liga os DOIS POLOS mais próximos de
      // verdade, não os centros — "o δ+ desta encontrou o δ− daquela".
      const parPolos = SIFI.polosMaisProximos(inter.a, inter.b);
      if (parPolos) {
        SIFI.drawInteractionLine(parPolos.pa.x, parPolos.pa.y, parPolos.pb.x, parPolos.pb.y, cor, index);
      } else {
        SIFI.drawInteractionLine(inter.cx1, inter.cy1, inter.cx2, inter.cy2, cor, index);
      }
    });
  };

  SIFI.drawInteractionLine = function drawInteractionLine(x1, y1, x2, y2, color, index) {
    if (!SIFI.svgEl) return;
    const line = SIFI.svgEl.children[index] || document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2.5');
    line.setAttribute('stroke-dasharray', '6 5');
    line.setAttribute('stroke-linecap', 'round');
    if (!line.parentNode) SIFI.svgEl.appendChild(line);
  };

  /* ===================================================================
     PAINEL "INTERAÇÕES" (sidebar direita) — mostra quantas moléculas
     tem no canvas, quantas interações estão ativas AGORA
     (contagem BRUTA, par a par), e uma lista AGRUPADA delas: pares
     com a MESMA força e os MESMOS dois compostos (ex.: várias
     interações "Água + Água — Ligação de Hidrogênio" ao mesmo tempo,
     comum quando há muitas moléculas iguais no canvas) viram
     UMA linha só, com um contador "×N" — em vez de repetir a mesma
     linha dezenas de vezes.
     Um grupo pisca quando pelo menos UM par dentro dele é novo (não
     existia no cálculo anterior), para chamar atenção sem precisar
     reler a lista inteira.
     =================================================================== */
  SIFI.renderInteracoesPanel = function renderInteracoesPanel(interacoes) {
    const total = SIFI.canvasMolecules.length;
    if (SIFI.statNumMoleculas) SIFI.statNumMoleculas.textContent = total;
    if (SIFI.statNumInteracoes) SIFI.statNumInteracoes.textContent = interacoes.length;

    // Aviso discreto de teto atingido — texto montado aqui (não fixo
    // no HTML) para nunca ficar dessincronizado das constantes, caso
    // mudem no futuro. Considera os DOIS portões (ver addMoleculeToSandbox,
    // acima): interações ativas e número de moléculas no canvas.
    // E reforço visual (o menu de moléculas "apaga" igual a quando o
    // Módulo 1 está inativo).
    if (SIFI.avisoLimiteInteracoes) {
      const noTetoInteracoes = interacoes.length >= SIFI.MAX_INTERACOES_ATIVAS;
      const noTetoMoleculas = total >= SIFI.MAX_MOLECULAS_SANDBOX;
      const noTeto = noTetoInteracoes || noTetoMoleculas;
      SIFI.avisoLimiteInteracoes.hidden = !noTeto;
      if (noTetoInteracoes) {
        SIFI.avisoLimiteInteracoes.textContent =
          `Limite de ${SIFI.MAX_INTERACOES_ATIVAS} interações atingido — remova algumas moléculas para adicionar mais.`;
      } else if (noTetoMoleculas) {
        SIFI.avisoLimiteInteracoes.textContent =
          `Limite de ${SIFI.MAX_MOLECULAS_SANDBOX} moléculas no canvas atingido — remova algumas para adicionar mais.`;
      }
    }
    if (SIFI.atualizarBloqueioMenu) SIFI.atualizarBloqueioMenu();

    const lista = SIFI.interacoesLista;
    if (!lista) return;

    if (!interacoes.length) {
      let msg;
      if (SIFI.activeModule !== 1) msg = 'Ative o Módulo 1 e coloque compostos no canvas.';
      else if (total < 2) msg = 'Coloque pelo menos dois compostos no canvas.';
      else msg = 'Aproxime dois compostos para ver a interação entre eles.';
      if (SIFI._ultimaAssinaturaPainel === msg) return;
      SIFI._ultimaAssinaturaPainel = msg;
      lista.innerHTML = `<p class="interacoes-vazio">${msg}</p>`;
      return;
    }

    // Agrupa por (força + par de fórmulas, em ordem alfabética — assim
    // "HCl + H₂O" e "H₂O + HCl" caem no MESMO grupo, não em dois).
    const grupos = new Map();
    interacoes.forEach(inter => {
      const par = [inter.a.mol.formula, inter.b.mol.formula].sort((x, y) => x.localeCompare(y, 'pt-BR'));
      const chave = `${inter.forceKey}|${par[0]}|${par[1]}`;
      let grupo = grupos.get(chave);
      if (!grupo) {
        grupo = { forceKey: inter.forceKey, formulaA: par[0], formulaB: par[1], count: 0, nova: false };
        grupos.set(chave, grupo);
      }
      grupo.count++;
      if (inter.nova) grupo.nova = true;
    });

    // Ordem fixa (mais forte → mais fraca, depois alfabética) — não
    // reordena a cada tick conforme os contadores mudam, senão a
    // lista ficaria "pulando" de lugar toda hora, difícil de ler.
    const ORDEM_FORCA = { 'hydrogen-bond': 0, 'dipole-dipole': 1, 'london': 2 };
    const listaGrupos = Array.from(grupos.values()).sort((a, b) => {
      const diff = ORDEM_FORCA[a.forceKey] - ORDEM_FORCA[b.forceKey];
      if (diff !== 0) return diff;
      return `${a.formulaA}${a.formulaB}`.localeCompare(`${b.formulaA}${b.formulaB}`, 'pt-BR');
    });

    // DESEMPENHO: se o conjunto de grupos (força+par+quantidade) for
    // EXATAMENTE igual ao do último render, não reconstrói o DOM da
    // lista — é comum, com moléculas já "assentadas", recalcular o
    // mesmo resultado repetidas vezes seguidas. Os números do topo já
    // foram atualizados acima (são só texto, baratos de sempre
    // atualizar); só o HTML da lista (mais caro) é que se evita redesenhar.
    const assinatura = listaGrupos.map(g => `${g.forceKey}:${g.formulaA}+${g.formulaB}:${g.count}`).join('|');
    const houveNova = listaGrupos.some(g => g.nova);
    if (assinatura === SIFI._ultimaAssinaturaPainel && !houveNova) {
      // Nada mudou desde o último render: não reconstrói a lista, mas
      // ainda garante que nenhuma classe "nova" de um render anterior
      // fique pendurada pra sempre (ela só devia durar até o próximo
      // recálculo). Isso é barato — só tira uma classe de elementos
      // que já existem, bem diferente de recriar tudo do zero.
      lista.querySelectorAll('.interacao-nova').forEach(el => el.classList.remove('interacao-nova'));
      return;
    }
    SIFI._ultimaAssinaturaPainel = assinatura;

    lista.innerHTML = '';
    listaGrupos.forEach(grupo => {
      const f = FORCE_TYPES[grupo.forceKey];
      const item = document.createElement('div');
      item.className = 'interacao-item' + (grupo.nova ? ' interacao-nova' : '');
      item.style.setProperty('--forca-cor', f.color);
      item.innerHTML = `
        <span class="interacao-icone" aria-hidden="true">${f.icon}</span>
        <div class="interacao-texto">
          <span class="interacao-forca-label">${f.label}</span>
          <span class="interacao-par">${grupo.formulaA} + ${grupo.formulaB}</span>
        </div>
        ${grupo.count > 1 ? `<span class="interacao-contador" title="${grupo.count} pares com essa interação ao mesmo tempo">×${grupo.count}</span>` : ''}
      `;
      lista.appendChild(item);

      if (grupo.nova && SIFI.announce) {
        const prefixo = grupo.count > 1 ? `${grupo.count} interações` : 'Nova interação';
        SIFI.announce(`${prefixo}: ${f.label}, entre ${grupo.formulaA} e ${grupo.formulaB}.`);
      }
    });
  };

  /* Atalho para "esvaziar" o painel — usado ao limpar o canvas
     e no estado inicial da página. */
  SIFI.showForcaVazia = function showForcaVazia() {
    SIFI.interacoesAtivas = new Set();
    SIFI.renderInteracoesPanel([]);
  };

  /* ===================================================================
     DICA DO CANVAS — três estados possíveis
     =================================================================== */
  SIFI.updateSandboxHint = function updateSandboxHint() {
    if (!SIFI.sandboxHint) return;
    if (SIFI.activeModule !== 1) {
      SIFI.sandboxHint.textContent = 'Ative o Módulo 1 no menu ao lado para começar';
      SIFI.sandboxHint.classList.remove('hidden');
    } else if (SIFI.canvasMolecules.length === 0) {
      SIFI.sandboxHint.textContent = 'Clique em uma molécula no menu ao lado para começar';
      SIFI.sandboxHint.classList.remove('hidden');
    } else {
      SIFI.sandboxHint.classList.add('hidden');
    }
  };

  /* ===================================================================
     LIMPAR O CANVAS
     =================================================================== */
  SIFI.limparSandbox = function limparSandbox() {
    SIFI.canvasMolecules.forEach(m => m.dom.remove());
    SIFI.canvasMolecules = [];
    if (SIFI.svgEl) SIFI.svgEl.innerHTML = '';
    SIFI.updateSandboxHint();
    SIFI.showForcaVazia();
  };

  if (SIFI.btnLimpar) {
    SIFI.btnLimpar.addEventListener('click', () => {
      SIFI.limparSandbox();
      if (SIFI.announce) SIFI.announce('Canvas limpo.');
    });
  }
});
