/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: fisica-termostato.js
   ORIGEM:  NOVO arquivo do SIFI, mas segue o MESMO padrão de loop de
            js/simulation/fisica-intermolecular.js (startLoop/stopLoop
            com setInterval) — só que mais devagar (50ms em vez de
            16ms: agitação térmica não precisa da mesma fluidez que
            um arraste de mouse) e sem pares de moléculas — aqui é
            "uma partícula, três estados possíveis".
   ───────────────────────────────────────────────────────────────
   A cada SIFI.TERMOSTATO_DT (50ms), pra cada partícula do béquer:

     • SÓLIDA: presa numa posição fixa de grade (`p.x`/`p.y` nunca
       mudam enquanto sólida) — só VIBRA visualmente ao redor desse
       ponto (`SIFI.TERMOSTATO_VIBRACAO_SOLIDO`), sem se afastar dali.
       Se a temperatura passar do ponto de FUSÃO real, tem uma chance
       a cada tick de "derreter" pra líquida — a chance cresce quanto
       mais quente acima do ponto de fusão. CASO ESPECIAL (CO₂/SF₆,
       `mol.sublima`): não existe fusão pra essas — passam direto de
       sólido pra GÁS quando a temperatura cruza o ponto de ebulição
       (que, pra elas, é na prática o ponto de SUBLIMAÇÃO).

     • LÍQUIDA: balança livre (movimento browniano — quanto maior a
       temperatura, maior a agitação) por toda a zona líquida. Duas
       transições possíveis: ferve (chance cresce acima do ponto de
       ebulição) OU solidifica de novo (chance cresce abaixo do ponto
       de fusão, se a temperatura cair rápido demais).

     • GASOSA: se move mais livre e mais rápido (energia cinética
       maior), na zona de cima do béquer. Se a temperatura cair de
       volta pra abaixo do ponto de ebulição, condensa — pra líquida
       normalmente, ou direto pra SÓLIDA (deposição) nas substâncias
       que sublimam, fechando o ciclo sem passar por líquido nunca.

   IMPORTANTE (repetindo a nota da especificação): mudar de estado
   AQUI não quebra nenhuma ligação química — é só a partícula (a
   molécula inteira, com a ligação covalente interna 100% intacta)
   se afastando ou se aproximando das vizinhas. Ver
   SIFI.atualizarStatusTexto (beaker.js), que deixa isso explícito
   na tela quando a substância está fervendo.
   Depende de: js/core/estado.js, js/data/dados-forcas-intermoleculares.js,
              js/ui/beaker.js (moverParticulaPara Gas/Liquido/Solido,
              atualizarContadoresEstado, atualizarStatusTexto),
              js/ui/grafico-temperatura.js (desenharGraficoTemperatura).
   Usado por: js/init/ativacao-modulos.js (chama startTermostatoLoop
              ao ativar o Módulo 2, stopTermostatoLoop ao desativar).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* Quanto a partícula balança por tick — cresce com a temperatura,
     mas nunca chega a zero (mesmo "frio" tem alguma vibração
     residual — é por isso que sólidos vibram nas suas posições,
     mesmo sem se mover de lugar; aqui simplificado pra um líquido). */
  SIFI.calcularAmplitudeTermica = function calcularAmplitudeTermica(temp) {
    return 0.15 + Math.max(0, temp - SIFI.TERMOSTATO_TEMP_MIN) * 0.012;
  };

  /* Chance de uma partícula LÍQUIDA escapar pra gás neste tick —
     zero até o ponto de ebulição, cresce suavemente acima dele.
     Simplificação didática intencional: a curva real de evaporação
     depende de muito mais variáveis (pressão de vapor, área de
     superfície...); aqui o que importa é a LIÇÃO: "quanto mais
     quente acima do ponto de ebulição, mais rápido evapora". */
  SIFI.calcularChanceEscape = function calcularChanceEscape(temp, pontoEbulicao) {
    const acima = temp - pontoEbulicao;
    if (acima <= 0) return 0;
    return Math.min(0.22, 0.012 + acima * 0.0045);
  };

  /* Chance de uma partícula GASOSA condensar de volta neste tick —
     zero enquanto ainda estiver acima do ponto de ebulição, cresce
     suavemente conforme esfria mais abaixo dele. */
  SIFI.calcularChanceCondensa = function calcularChanceCondensa(temp, pontoEbulicao) {
    const abaixo = pontoEbulicao - temp;
    if (abaixo <= 0) return 0;
    return Math.min(0.18, 0.006 + abaixo * 0.003);
  };

  /* Chance de uma partícula SÓLIDA derreter pra líquida neste tick —
     mesmíssimo formato das duas de cima, só que comparando com o
     ponto de FUSÃO em vez do de ebulição (é a mesma ideia física:
     "quanto mais quente acima da temperatura de transição, mais
     rápido a mudança de estado acontece"). */
  SIFI.calcularChanceFusao = function calcularChanceFusao(temp, pontoFusao) {
    const acima = temp - pontoFusao;
    if (acima <= 0) return 0;
    return Math.min(0.22, 0.012 + acima * 0.0045);
  };

  /* Chance de uma partícula LÍQUIDA solidificar de volta neste tick —
     zero enquanto ainda estiver acima do ponto de fusão, cresce
     suavemente conforme esfria mais abaixo dele. */
  SIFI.calcularChanceSolidificacao = function calcularChanceSolidificacao(temp, pontoFusao) {
    const abaixo = pontoFusao - temp;
    if (abaixo <= 0) return 0;
    return Math.min(0.18, 0.006 + abaixo * 0.003);
  };

  SIFI.termostatoTick = function termostatoTick() {
    if (!SIFI.termostato.rodando) return;
    const t = SIFI.termostato;
    const mol = INTERMOL_MOLECULES.find(m => m.key === t.substanciaKey);
    if (!mol) return;

    const amplitude = SIFI.calcularAmplitudeTermica(t.temperatura);
    const acimaPE = t.temperatura >= mol.boilingPoint;
    const acimaPF = mol.meltingPoint !== null && t.temperatura >= mol.meltingPoint;

    t.particulas.forEach(p => {
      if (p.estado === 'solido') {
        // Vibra ao redor da posição FIXA da grade (p.x/p.y não mudam
        // enquanto sólida) — só o desenho na tela balança um pouco,
        // sem "andar" de verdade. É isso que faz um sólido parecer
        // sólido: preso no lugar, não deriva pela zona inteira.
        const jitterX = (Math.random() - 0.5) * SIFI.TERMOSTATO_VIBRACAO_SOLIDO;
        const jitterY = (Math.random() - 0.5) * SIFI.TERMOSTATO_VIBRACAO_SOLIDO;
        p.dom.style.left = (p.x + jitterX) + '%';
        p.dom.style.top = (p.y + jitterY) + '%';

        if (mol.sublima) {
          // CO₂/SF₆: sem fusão — direto pra gás quando cruza o "ponto
          // de ebulição" (que, pra essas duas, É o ponto de sublimação).
          if (acimaPE && Math.random() < SIFI.calcularChanceEscape(t.temperatura, mol.boilingPoint)) {
            SIFI.moverParticulaParaGas(p);
            p.dom.style.left = p.x + '%'; p.dom.style.top = p.y + '%';
            if (SIFI.announce) SIFI.announce(`Uma molécula de ${mol.formula} sublimou direto para o estado gasoso.`);
          }
        } else if (mol.meltingPoint !== null && acimaPF) {
          if (Math.random() < SIFI.calcularChanceFusao(t.temperatura, mol.meltingPoint)) {
            SIFI.moverParticulaParaLiquido(p);
            p.dom.style.left = p.x + '%'; p.dom.style.top = p.y + '%';
          }
        }
        return; // já cuidou da posição — pula o trecho comum lá embaixo
      }

      if (p.estado === 'liquido') {
        p.vx = (p.vx + (Math.random() - 0.5) * amplitude) * 0.85;
        p.vy = (p.vy + (Math.random() - 0.5) * amplitude) * 0.85;
        p.x = Math.min(96, Math.max(2, p.x + p.vx));
        p.y = Math.min(96, Math.max(2, p.y + p.vy));

        if (acimaPE && Math.random() < SIFI.calcularChanceEscape(t.temperatura, mol.boilingPoint)) {
          SIFI.moverParticulaParaGas(p);
          if (SIFI.announce) SIFI.announce(`Uma molécula de ${mol.formula} escapou para o estado gasoso.`);
        } else if (mol.meltingPoint !== null && !acimaPF
          && Math.random() < SIFI.calcularChanceSolidificacao(t.temperatura, mol.meltingPoint)) {
          SIFI.moverParticulaParaSolido(p);
        }
      } else {
        // gasosa
        p.vx = (p.vx + (Math.random() - 0.5) * amplitude * 1.6) * 0.9;
        p.vy = (p.vy + (Math.random() - 0.5) * amplitude * 1.6 - 0.015) * 0.9; // leve tendência pra cima
        p.x = Math.min(96, Math.max(2, p.x + p.vx));
        p.y = Math.min(96, Math.max(2, p.y + p.vy));

        if (!acimaPE && Math.random() < SIFI.calcularChanceCondensa(t.temperatura, mol.boilingPoint)) {
          if (mol.sublima) {
            // Deposição: gás vira sólido direto, sem passar por líquido.
            SIFI.moverParticulaParaSolido(p);
          } else {
            SIFI.moverParticulaParaLiquido(p);
            // "Pinga" perto da superfície ao condensar, não solta no
            // meio aleatório da zona inteira — mais parecido com o
            // vapor condensando na "tampa" e caindo de volta.
            p.x = 10 + Math.random() * 80;
            p.y = 65 + Math.random() * 30;
          }
        }
      }

      p.dom.style.left = p.x + '%';
      p.dom.style.top = p.y + '%';
    });

    SIFI.atualizarContadoresEstado();

    // Registra um ponto novo no histórico do gráfico de tempos em
    // tempos (não todo tick — o gráfico não precisa de mais
    // resolução que isso, e economiza redesenhar o SVG toda hora).
    t.tempoDecorrido++;
    if (t.tempoDecorrido % SIFI.TERMOSTATO_REGISTRO_A_CADA === 0) {
      t.historico.push({ tempo: t.tempoDecorrido, temp: t.temperatura });
      if (t.historico.length > SIFI.TERMOSTATO_HISTORICO_MAX) t.historico.shift();
      if (SIFI.desenharGraficoTemperatura) SIFI.desenharGraficoTemperatura();
      SIFI.atualizarStatusTexto();
    }
  };

  SIFI.startTermostatoLoop = function startTermostatoLoop() {
    if (SIFI.simLoopTermostato) return;
    SIFI.termostato.rodando = true;
    SIFI.simLoopTermostato = setInterval(SIFI.termostatoTick, SIFI.TERMOSTATO_DT);
  };

  SIFI.stopTermostatoLoop = function stopTermostatoLoop() {
    if (SIFI.simLoopTermostato) { clearInterval(SIFI.simLoopTermostato); SIFI.simLoopTermostato = null; }
    SIFI.termostato.rodando = false;
  };
});
