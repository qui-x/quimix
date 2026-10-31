/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: fisica-intermolecular.js
   ORIGEM:  INSPIRADO em js/simulation/fisica-tick.js do SILQ (mesmo
            padrão de loop: startSimLoop/stopSimLoop/setInterval, e a
            mesma convenção de sinal de força: F>0 atrai, F<0 repele),
            mas é um motor NOVO — o do SILQ move ÁTOMOS dentro de uma
            molécula (com ângulos VSEPR); este move E GIRA MOLÉCULAS
            inteiras umas em relação às outras.
   ───────────────────────────────────────────────────────────────
   A cada 16ms (SIFI.PHYS_DT), para cada par de moléculas na caixa
   de areia dentro do raio de interação:

     1. Colisão (muito perto): sempre REPELE um pouco — as moléculas
        têm "tamanho" e não podem ocupar o mesmo espaço. Isso não tem
        relação com polo nenhum, é só volume.
     2. Forças de London (pelo menos uma molécula é apolar): SEMPRE
        atrai fracamente. Sem polo fixo, não existe "orientação
        certa" — é por isso que, quimicamente, a força de London não
        depende de direção nenhuma (ver rotação livre, abaixo).
     3. Dipolo-Dipolo / Ligação de Hidrogênio (as duas são polares):
        SEMPRE atrai (a intensidade certa para cada força). O que
        muda com a orientação não é SE atrai, é o quão bem alinhados
        os dipolos estão — e quem resolve isso é a ROTAÇÃO, não mais
        uma inversão de sinal na força de translação.

   ROTAÇÃO (a parte nova desta etapa):
     • Moléculas POLARES, quando têm uma interação dipolo-dipolo/
       ligação de hidrogênio ativa, giram para alinhar o PRÓPRIO
       dipolo (SIFI.dipoloAngleLocal, calculado uma vez na criação)
       com a direção até a molécula vizinha — δ+ "liderando" rumo ao
       δ− da outra (alinhamento cauda-cabeça, o de menor energia).
       As DUAS moléculas do par giram para a MESMA direção (a da reta
       que liga os dois centros): é assim que, na química real, dois
       dipolos se alinham quando se aproximam. Sem interação polar
       ativa, ficam paradas — nada as está "chamando" para girar.
     • Moléculas APOLARES giram devagar e livremente o tempo todo,
       em qualquer sentido, sorteado uma vez na criação
       (`tumbleSpeed`) — não existe orientação "certa" para elas.

   Depende de: js/core/estado.js (constantes ATTRACT_K_*, DAMPING,
              ROTATION_EASING, TUMBLE_SPEED_MAX...),
              js/ui/sandbox.js (classifyPairForce, polosMaisProximos,
              updateForceDetection),
              js/ui/menu-moleculas.js (SIFI.dipoloAngleLocal, calculado
              na criação de cada molécula em sandbox.js).
   Usado por: js/init/ativacao-modulos.js (chama startSimLoop ao
              ativar o Módulo 1, stopSimLoop ao desativar).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* Menor caminho angular de "atual" até "alvo", em graus, sempre
     entre -180 e +180 — sem isso, girar de 350° para 10° daria a
     volta inteira pelo caminho errado (340° de giro) em vez do
     caminho curto de 20°. Exposta em SIFI.* para poder testar sozinha. */
  SIFI.anguloMaisCurto = function anguloMaisCurto(atual, alvo) {
    return ((alvo - atual + 180) % 360 + 360) % 360 - 180;
  };

  /* A ÁREA LIVRE (ver sidebar-rail.js · Oclusao). Um card flutuante aberto
     dá padding ao #main-content (css/sifi-extra.css), e a sandbox encolhe
     para a parte que se vê. As moléculas guardam px relativos à borda
     esquerda da sandbox: as que ficariam além da nova parede direita não
     são presas UMA A UMA contra ela (amontoando umas sobre as outras): o
     GRUPO inteiro desliza para a esquerda o quanto for preciso; se ainda
     assim não couber, ele se aperta na horizontal, mantendo a ordem e as
     proporções do arranjo que o aluno montou. Durante um arrasto, nada se
     mexe por conta própria. Roda no tique da física e no deslizamento do
     card (com a física pausada). */
  SIFI.acomodarNaAreaLivre = function acomodarNaAreaLivre(sbW, sbH) {
    const mols = SIFI.canvasMolecules;
    if (!mols || !mols.length || mols.some(m => m.dragging)) return false;
    let maxR = -Infinity, minL = Infinity, maxB = -Infinity, minT = Infinity, wMax = 0, spanX = 0;
    mols.forEach(m => { const w = m.dom.offsetWidth, h = m.dom.offsetHeight; wMax = Math.max(wMax, w);
      maxR = Math.max(maxR, m.x + w); minL = Math.min(minL, m.x); maxB = Math.max(maxB, m.y + h); minT = Math.min(minT, m.y); });
    mols.forEach(m => { spanX = Math.max(spanX, m.x - minL); });
    let mexeu = false;
    if (maxR > sbW + 0.5) {
      if (maxR - minL <= sbW) { const dx = maxR - sbW; mols.forEach(m => { m.x -= dx; }); }          // desliza
      else { const k = Math.max(0, sbW - wMax) / Math.max(1, spanX);                                   // aperta, na ordem
        mols.forEach(m => { m.x = (m.x - minL) * k; }); }
      mexeu = true;
    }
    if (maxB > sbH + 0.5) { const dy = Math.min(maxB - sbH, Math.max(0, minT)); mols.forEach(m => { m.y -= dy; }); mexeu = true; }
    if (mexeu) mols.forEach(m => { m.dom.style.left = m.x + 'px'; m.dom.style.top = m.y + 'px'; });
    return mexeu;
  };
  window.addEventListener('oclusao', () => {
    if (SIFI.activeModule !== 1 || !SIFI.sandbox || SIFI.physicsEnabled) return;   // com a física ligada, o tique já cuida
    if (SIFI.acomodarNaAreaLivre(SIFI.sandbox.clientWidth, SIFI.sandbox.clientHeight) && SIFI.updateForceDetection) SIFI.updateForceDetection();
  });

  SIFI.physicsTick = function physicsTick() {
    if (!SIFI.physicsEnabled || SIFI.activeModule !== 1 || !SIFI.sandbox) return;
    const mols = SIFI.canvasMolecules;
    const sbRect = SIFI.sandbox.getBoundingClientRect();
    SIFI.acomodarNaAreaLivre(sbRect.width, sbRect.height);

    const fx = new Map(), fy = new Map();
    // Para cada molécula, guarda o alvo de rotação vindo da interação
    // MAIS PRÓXIMA (a que mais deveria "mandar" na orientação agora).
    const alvoRotacao = new Map(); // id -> { alvo, dist }
    mols.forEach(m => { fx.set(m.id, 0); fy.set(m.id, 0); });

    const considerarAlvoRotacao = (m, alvo, dist) => {
      if (m.dipoloAngleLocal === null) return; // apolar: sem alvo, gira livre
      const atual = alvoRotacao.get(m.id);
      if (!atual || dist < atual.dist) alvoRotacao.set(m.id, { alvo, dist });
    };

    for (let i = 0; i < mols.length; i++) {
      for (let j = i + 1; j < mols.length; j++) {
        const a = mols[i], b = mols[j];
        const aw = a.dom.offsetWidth, ah = a.dom.offsetHeight;
        const bw = b.dom.offsetWidth, bh = b.dom.offsetHeight;
        const cax = a.x + aw / 2, cay = a.y + ah / 2;
        const cbx = b.x + bw / 2, cby = b.y + bh / 2;
        const dx = cbx - cax, dy = cby - cay;
        const d = Math.hypot(dx, dy) || 0.1;
        const nx = dx / d, ny = dy / d;

        const minDist = (aw + bw) / 2 * 0.6;
        let F = 0;

        if (d < minDist) {
          // (1) Colisão de curto alcance — sempre repele. Volume, não polo.
          const overlap = (minDist - d) / minDist;
          F = -SIFI.REPEL_COLISAO * overlap * overlap;
        } else if (d < SIFI.RAIO_INTERACAO) {
          const forceKey = SIFI.classifyPairForce(a.mol, b.mol);
          if (forceKey === 'london') {
            // (2) London — sempre atrai fracamente, sem depender de direção.
            F = SIFI.ATTRACT_K_LONDON;
          } else {
            // (3) Dipolo-dipolo / ligação de hidrogênio — sempre atrai; a
            // ORIENTAÇÃO (não a força) é resolvida pela rotação abaixo.
            F = forceKey === 'hydrogen-bond' ? SIFI.ATTRACT_K_HIDROGENIO : SIFI.ATTRACT_K_DIPOLO;

            // Ambas as moléculas do par miram girar o próprio dipolo para
            // a MESMA direção — a da reta que une os dois centros — o que
            // produz o alinhamento cauda-cabeça (δ+ de uma rumo ao δ− da
            // outra) que minimiza a energia da interação.
            const anguloDir = Math.atan2(dy, dx) * 180 / Math.PI;
            considerarAlvoRotacao(a, anguloDir, d);
            considerarAlvoRotacao(b, anguloDir, d);
          }
        }

        fx.set(a.id, fx.get(a.id) + F * nx);
        fy.set(a.id, fy.get(a.id) + F * ny);
        fx.set(b.id, fx.get(b.id) - F * nx);
        fy.set(b.id, fy.get(b.id) - F * ny);
      }
    }

    // Integração: velocidade += força, aplica atrito (DAMPING), move.
    // Rotação: alvo de alinhamento (polares perto de outra) ou giro
    // livre (apolares, sempre) — molécula sendo arrastada fica parada
    // nos dois casos, o usuário está no controle dela.
    mols.forEach(m => {
      if (m.dragging) return;

      m.vx = (m.vx + fx.get(m.id)) * SIFI.DAMPING;
      m.vy = (m.vy + fy.get(m.id)) * SIFI.DAMPING;
      const spd = Math.hypot(m.vx, m.vy);
      if (spd > SIFI.MAX_SPEED) { m.vx *= SIFI.MAX_SPEED / spd; m.vy *= SIFI.MAX_SPEED / spd; }

      const w = m.dom.offsetWidth, h = m.dom.offsetHeight;
      m.x = Math.max(0, Math.min(sbRect.width - w, m.x + m.vx));
      m.y = Math.max(0, Math.min(sbRect.height - h, m.y + m.vy));
      m.dom.style.left = m.x + 'px';
      m.dom.style.top = m.y + 'px';

      if (m.dipoloAngleLocal === null) {
        // Apolar: gira livre e devagar, sempre — sem "alvo" nenhum.
        m.rotation = (m.rotation + m.tumbleSpeed + 360) % 360;
      } else {
        const alvo = alvoRotacao.get(m.id);
        if (alvo) {
          // Alvo de rotação do MUNDO = alvo.alvo; o dipolo da molécula,
          // no referencial dela, já aponta para dipoloAngleLocal — a
          // rotação da ficha precisa compensar essa diferença.
          const alvoRotacaoFicha = alvo.alvo - m.dipoloAngleLocal;
          const diff = SIFI.anguloMaisCurto(m.rotation, alvoRotacaoFicha);
          m.rotation = (m.rotation + diff * SIFI.ROTATION_EASING + 360) % 360;
        }
        // Sem interação polar ativa agora: fica exatamente onde estava.
      }
      m.dom.style.transform = `rotate(${m.rotation.toFixed(1)}deg)`;
    });

    // DESEMPENHO: a detecção de interação + desenho das linhas/painel
    // não roda todo tick — só a cada SIFI.INTERACAO_RENDER_A_CADA
    // ticks (ver estado.js). O MOVIMENTO acima já rodou a taxa cheia;
    // só a parte "cara" (mexe em DOM) é que fica mais espaçada.
    SIFI.tickCount = (SIFI.tickCount + 1) % 1000000;
    if (SIFI.tickCount % SIFI.INTERACAO_RENDER_A_CADA === 0) {
      SIFI.updateForceDetection();
    }
  };

  SIFI.startSimLoop = function startSimLoop() {
    if (SIFI.simLoop) return;
    SIFI.physicsEnabled = true;
    SIFI.tickCount = 0; // reinicia contagem — comportamento previsível a cada ativação
    SIFI.simLoop = setInterval(SIFI.physicsTick, SIFI.PHYS_DT);
  };

  SIFI.stopSimLoop = function stopSimLoop() {
    if (SIFI.simLoop) { clearInterval(SIFI.simLoop); SIFI.simLoop = null; }
    SIFI.physicsEnabled = false;
  };
});
