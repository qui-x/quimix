/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (estado mutável em tempo de execução)
   ARQUIVO: estado.js
   ORIGEM:  mesmo padrão do SILQ (js/core/estado.js: window.SILQ.*),
            adaptado para window.SIFI.*.
   ───────────────────────────────────────────────────────────────
   Guarda o que muda enquanto o usuário usa o simulador: quais
   moléculas estão no canvas agora, um contador de IDs, e
   (para as próximas etapas) as constantes físicas da simulação de
   atração/repulsão do Módulo 1.

   NOTA: assim como no SILQ, este código roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})`
   para garantir que a página já carregou antes de tocarmos nela.
   Depende de: js/core/namespace.js.
   Usado por: praticamente todos os módulos de UI.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     ESTADO GLOBAL DO MÓDULO 1 (Tabuleiro das Atrações)
     =================================================================== */

  /* Lista das moléculas atualmente no canvas. Cada item tem
     o formato:
       { id, key, x, y, dom, mol, vx, vy, dragging,
         poloLocal, rotation, dipoloAngleLocal, tumbleSpeed }
     — "key" aponta para uma entrada de INTERMOL_MOLECULES
     (js/data/dados-forcas-intermoleculares.js); "poloLocal" guarda a
     posição de cada polo δ+/δ−, RELATIVA AO CENTRO da ficha (para dar
     pra girar), calculada uma vez quando a molécula é criada.
     "rotation" é o ângulo atual (graus); "dipoloAngleLocal" é o
     ângulo do próprio dipolo da molécula, no referencial dela mesma,
     sem rotação (null se a molécula for apolar); "tumbleSpeed" é a
     velocidade do giro livre (só usada por moléculas apolares).
     Ver js/ui/sandbox.js e js/simulation/fisica-intermolecular.js. */
  SIFI.canvasMolecules = [];

  SIFI.idCounter = 0;

  /* Qual módulo está ativo agora. null = nenhum módulo ativo (estado
     inicial — igual ao SILQ, que começa sem nenhum "Modo" de ligação
     ativado). Vira 1, 2 ou 3 quando o usuário clica em "Ativar Módulo X"
     — ver js/init/ativacao-modulos.js. Por enquanto só o Módulo 1 tem
     botão habilitado; 2 e 3 existem na tela como "em breve". */
  SIFI.activeModule = null;

  /* Chaves ("idA-idB") das interações que já estavam ativas no frame
     anterior — usado só para saber quais são NOVAS agora (e piscar
     só essas no painel). Ver SIFI.updateForceDetection em sandbox.js. */
  SIFI.interacoesAtivas = new Set();

  /* ===================================================================
     FÍSICA DE ATRAÇÃO/REPULSÃO — Módulo 1
     ───────────────────────────────────────────────────────────────
     Mesmo padrão de nomes do fisica-tick.js do SILQ (PHYS_DT, DAMPING),
     mas os valores e o SIGNIFICADO são outros: aqui a "mola" liga
     MOLÉCULAS inteiras, não átomos dentro de uma molécula.
     Convenção de sinal (igual ao SILQ): F > 0 puxa as duas moléculas
     uma para a outra (atração); F < 0 empurra uma para longe da outra
     (repulsão). Ver js/simulation/fisica-intermolecular.js.
     =================================================================== */
  SIFI.physicsEnabled = false;
  SIFI.PHYS_DT   = 16;    // intervalo do loop de física, em ms (igual ao SILQ)
  SIFI.DAMPING   = 0.85;  // "atrito": sem isso as moléculas acelerariam para sempre
  SIFI.MAX_SPEED = 6;     // velocidade máxima de uma molécula (px por tick)

  /* Distância (px, centro a centro) a partir da qual duas moléculas
     passam a "sentir" a força uma da outra. */
  SIFI.RAIO_INTERACAO = 140;

  /* Intensidade de cada força — quanto maior, mais forte a atração.
     A ordem reflete a química real: Ligação de Hidrogênio > Dipolo-
     Dipolo > London (a mais fraca das três). */
  SIFI.ATTRACT_K_HIDROGENIO = 0.46;
  SIFI.ATTRACT_K_DIPOLO     = 0.26;
  SIFI.ATTRACT_K_LONDON     = 0.11;

  /* Repulsão de curtíssimo alcance: evita que duas moléculas ocupem
     o mesmo espaço na tela quando ficam muito perto (colisão), não
     tem relação com polos — é só "as moléculas têm um tamanho". */
  SIFI.REPEL_COLISAO = 60;

  /* ===================================================================
     ROTAÇÃO — cada molécula gira em torno do próprio eixo
     ───────────────────────────────────────────────────────────────
     Moléculas POLARES (dipolo-dipolo/ligação de hidrogênio) giram de
     propósito, para alinhar o próprio dipolo com a molécula vizinha
     mais próxima — δ+ de uma "levando" na direção do δ− da outra
     (alinhamento "cauda-cabeça", o de menor energia/mais estável).
     Só giram quando têm uma interação polar ativa por perto; fora
     disso ficam paradas (nada as está "chamando" para girar).

     Moléculas APOLARES (só London) não têm polo fixo, então não há
     alinhamento "certo" — na química real elas giram livremente sem
     preferência de direção (é por isso que a força de London não
     depende de orientação). Por isso recebem uma rotação livre e
     lenta, sempre ligada, independente de estarem perto de outra
     molécula ou não.
     =================================================================== */
  SIFI.ROTATION_EASING  = 0.10; // fração do ângulo restante corrigida a cada tick (moléculas polares)
  SIFI.TUMBLE_SPEED_MAX = 1.1;  // grau por tick, no máximo, do giro livre (moléculas apolares)

  /* ===================================================================
     DESEMPENHO — evitar sobrecarga com muitas moléculas na tela
     ───────────────────────────────────────────────────────────────
     O MOVIMENTO (posição, rotação) precisa rodar todo tick, senão a
     animação fica com solavancos. Mas DETECTAR interações e redesenhar
     a lista/linhas é bem mais caro (mexe em DOM) e o olho humano nem
     percebe isso rodando a 60×/s — por isso essa parte roda numa
     frequência menor, independente da física.
     =================================================================== */
  // A cada quantos ticks de física a detecção de interação + desenho
  // do painel/linhas é refeita. 6 ticks × 16ms ≈ 96ms → ~10×/s, rápido
  // o bastante para parecer instantâneo, raro o bastante para não
  // sobrecarregar o processador com muitas moléculas.
  SIFI.INTERACAO_RENDER_A_CADA = 6;
  SIFI.tickCount = 0;

  // Com MUITOS pares ativos ao mesmo tempo (20+ moléculas juntas dão
  // facilmente 100+ pares), desenhar uma linha tracejada para CADA UM
  // tanto pesa no processador quanto vira um emaranhado ilegível na
  // tela. Only os pares mais próximos (as interações "mais fortes"
  // agora) ganham linha; os números do painel continuam contando
  // todos, sem exceção — só o DESENHO é limitado.
  //
  // Por que 150 e não os 60 originais: esse limite existe pensando em
  // "quantas linhas por segundo", não "quantas linhas por vez". Com a
  // detecção agora rodando só ~10×/s (throttle acima) e o teto de
  // MAX_INTERACOES_ATIVAS abaixo, o pico real é 150×10=1.500 linhas/s
  // — folgado — em vez das ~3.600+/s que 60 linhas a 60×/s geravam
  // ANTES do throttle existir. Um valor baixo demais (como 60) fazia
  // pares que estavam interagindo de verdade parecerem "sem conexão"
  // na tela, só porque a linha deles não entrou no corte.
  SIFI.MAX_LINHAS_DESENHADAS = 150;

  /* Restrição de verdade (não só visual): acima deste número de
     interações ativas ao mesmo tempo, SIFI.addMoleculeToSandbox()
     se recusa a colocar mais compostos no canvas — nada de
     deixar a simulação crescer sem controle até travar o navegador.
     O painel "Interações" mostra um aviso discreto quando esse teto
     é atingido (ver SIFI.renderInteracoesPanel, em sandbox.js).
     Removendo moléculas (ou elas se afastando sozinhas) o número cai
     de novo e a restrição libera adicionar mais, automaticamente. */
  SIFI.MAX_INTERACOES_ATIVAS = 1000;

  /* Teto no número de moléculas no canvas — proteção
     SECUNDÁRIA, complementar ao teto de interações acima (que é a
     proteção PRINCIPAL de verdade, porque reage à posição REAL das
     moléculas, não a um cenário hipotético).
     ───────────────────────────────────────────────────────────────
     Por que 90 e não o "pior caso matemático absoluto" (que exigiria
     N≈45 para garantir C(N,2)<1000 mesmo com TODAS mutuamente coladas
     ao mesmo tempo): esse cenário é fisicamente exagerado — a física
     sempre mantém uma distância mínima de colisão entre moléculas
     (~48px), então elas nunca ficam realmente TODAS coladas.
     O valor 90 foi TESTADO, não só calculado: simulando o
     empacotamento mais apertado fisicamente alcançável (hexagonal,
     no limite da distância de colisão real — mais denso que uma
     grade quadrada) com várias quantidades de moléculas:
       90 moléculas → 983 interações (seguro)
       92 moléculas → 1004 interações (já passa do teto!)
     90 é o maior valor com folga confirmada abaixo de 1000 mesmo
     nesse pior caso realista — não uma estimativa teórica otimista.
     O teto de interações (acima) continua sendo quem VERDADEIRAMENTE
     impede a simulação de crescer sem controle no dia a dia,
     reagindo em tempo real à posição de cada molécula. */
  SIFI.MAX_MOLECULAS_SANDBOX = 90;

  // Guarda a última combinação (força+par+quantidade) desenhada no
  // painel de Interações — se for igual da vez anterior, pula a
  // reconstrução do DOM da lista (ver SIFI.renderInteracoesPanel).
  SIFI._ultimaAssinaturaPainel = '';

  /* ===================================================================
     MÓDULO 2 — TERMOSTATO MOLECULAR (Estados Físicos e Ebulição)
     ───────────────────────────────────────────────────────────────
     Um béquer FECHADO com várias partículas da MESMA substância. O
     usuário escolhe o líquido e mexe no termostato; quando a
     temperatura passa do ponto de ebulição REAL daquela substância
     (o mesmo dado já usado na Biblioteca do Módulo 1 — `boilingPoint`
     em dados-forcas-intermoleculares.js), as partículas começam a
     escapar para o estado gasoso, uma a uma — não tudo de uma vez,
     porque na vida real também não é assim.
     =================================================================== */
  SIFI.termostato = {
    substanciaKey: null,  // aponta pra uma entrada de INTERMOL_MOLECULES
    temperatura: 20,       // °C atual do termostato
    particulas: [],        // { id, x, y, vx, vy, estado: 'liquido'|'gas', dom }
    historico: [],         // [{tempo, temp}] — pontos do gráfico Temperatura×Tempo
    tempoDecorrido: 0,     // ticks desde que a substância atual foi escolhida
    rodando: false,
  };

  SIFI.TERMOSTATO_NUM_PARTICULAS = 40;   // "cerca de 50" da especificação — um pouco menos por desempenho
  SIFI.TERMOSTATO_TEMP_MIN = -270;
  SIFI.TERMOSTATO_TEMP_MAX = 200;
  SIFI.TERMOSTATO_TEMP_INICIAL = 20;

  SIFI.TERMOSTATO_DT = 50;               // intervalo do loop do termostato, em ms (mais devagar que o Módulo 1 — não precisa dos 60fps de um arraste)
  SIFI.TERMOSTATO_REGISTRO_A_CADA = 6;   // a cada quantos ticks um ponto novo entra no gráfico (~300ms)
  SIFI.TERMOSTATO_HISTORICO_MAX = 80;    // pontos guardados no gráfico — depois disso, os mais antigos saem (janela deslizante)
  SIFI.TERMOSTATO_VIBRACAO_SOLIDO = 0.35; // o quanto uma partícula sólida "treme" ao redor da posição fixa na grade — nunca chega a se afastar dali, só vibra (é assim que sólidos se comportam de verdade)

  SIFI.simLoopTermostato = null;

  /* ===================================================================
     MÓDULO 3 — LABORATÓRIO DE SOLUBILIDADE (Misturas e Densidade)
     ───────────────────────────────────────────────────────────────
     Tubos de ensaio DINÂMICOS — nascem 2 ao ativar o módulo (o padrão
     pedido), mas o usuário pode adicionar até 10 no total, e cada tubo
     aceita até 5 substâncias diferentes ao mesmo tempo (não é mais só
     "base + 1 adicionado" — ver seção 7 do ARQUITETURA-SIFI.md pra a
     explicação completa de como N substâncias se agrupam em fases).
     A regra central continua a mesma, "semelhante dissolve semelhante"
     (SIFI.saoCompativeis, em fisica-solubilidade.js), só que agora
     precisa lidar com AGRUPAR várias substâncias em várias fases ao
     mesmo tempo, não só decidir "compatível ou não" entre duas.

     `tubos` é populado dinamicamente (SIFI.criarTubo, em tubo-ensaio.js)
     — não existe HTML fixo pra cada tubo, cada um é um objeto com sua
     própria referência de DOM guardada em `tubo.dom` (mais robusto pra
     adicionar/remover em qualquer ordem do que manter um array de refs
     separado indexado por posição, que quebraria fácil ao remover um
     tubo do meio). `proximoIdTubo` só cresce, nunca reusa um ID já
     usado — evita confusão se o usuário remover o Tubo 2 e adicionar
     um novo (o novo vira Tubo 3, não um Tubo 2 "fantasma" diferente). */
  SIFI.laboratorio = {
    tuboAtivo: 1,      // ID do tubo que a prateleira preenche agora
    tubos: [],         // populado por SIFI.criarTubo() ao ativar o módulo
    proximoIdTubo: 1,
    rodando: false,
  };

  SIFI.LAB_MAX_TUBOS = 10;                    // teto pedido
  SIFI.LAB_TUBOS_INICIAIS = 2;                // quantos já vêm prontos ao ativar o módulo
  SIFI.LAB_MIN_TUBOS = 1;                     // nunca deixa remover o último
  SIFI.LAB_MAX_SUBSTANCIAS_POR_TUBO = 5;      // teto pedido
  SIFI.LAB_PARTICULAS_POR_SUBSTANCIA = 10;    // por substância — com o teto de 5, até 50 partículas por tubo
  SIFI.LAB_DT = 60;                        // intervalo do loop do laboratório, em ms
  SIFI.LAB_CHANCE_DISSOLVER = 0.02;        // chance, por tick, de uma unidade do sólido se soltar do cristal (quando compatível)

  /* Diferença MÁXIMA de índice de polaridade (escala de Snyder, ~0 a
     10) pra duas substâncias ainda serem consideradas compatíveis —
     ver SIFI.saoCompativeis em fisica-solubilidade.js. Calibrado
     contra ~12 pares reais de miscibilidade/solubilidade conhecidos
     (água+etanol miscíveis, água+hexano não, iodo+hexano dissolve,
     acetona+água E acetona+hexano miscíveis nos dois — o clássico
     "solvente versátil"...). 5,0 é o maior valor que acerta todos
     esses casos de calibração ao mesmo tempo, com uma exceção
     documentada (clorofórmio+água — ver o comentário na entrada do
     CHCl3 em dados-forcas-intermoleculares.js). */
  SIFI.LAB_LIMITE_POLARIDADE = 5.0;

  /* Termostato POR TUBO — cada tubo tem sua própria temperatura (não
     é um termostato só pro laboratório inteiro), pra dar pra comparar
     o mesmo composto em temperaturas diferentes lado a lado, ou uma
     mistura reagindo ao calor enquanto outra fica intocada num tubo
     vizinho. Mesma faixa e mesmas funções de chance de transição
     (calcularChanceFusao/Escape/Condensa/Solidificacao) já usadas no
     Módulo 2 — REAPROVEITADAS diretamente daqui, sem duplicar nada
     (fisica-termostato.js carrega ANTES de fisica-solubilidade.js). */
  SIFI.LAB_TEMP_INICIAL = 20;
  SIFI.LAB_TEMP_MIN = SIFI.TERMOSTATO_TEMP_MIN;
  SIFI.LAB_TEMP_MAX = SIFI.TERMOSTATO_TEMP_MAX;

  SIFI.simLoopLab = null;

  SIFI.simLoop = null;
});
