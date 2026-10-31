/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO 2D
   ARQUIVO: wedge-linhas.js
   ───────────────────────────────────────────────────────────────
   Notação estereoquímica de cunha (wedge bonds: sólida = ligante à
   frente do plano, tracejada = atrás, linha = no plano — a mesma
   notação usada em livros de química orgânica) e o desenho das
   linhas SVG de cada ligação (simples/dupla/tripla), incluindo os
   rótulos de ângulo de ligação com código de cor (verde = próximo do
   valor real da literatura, vermelho = divergente).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, core/vsepr.js.
   Usado por: js/bonds/logica-ligacoes.js (redesenha após
              formar/quebrar ligação).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     15. LINHAS SVG DAS LIGAÇÕES — COM SUPORTE A CUNHAS (WEDGE BONDS)
     ===================================================================
     Notação estereoquímica padrão da literatura química:
       • Linha plana  ─── : ligação no plano do papel
       • Cunha sólida ◀▶▶ : ligação vindo para frente do plano (vem ao leitor)
       • Cunha tracejada ╌╌ : ligação indo para trás do plano (afasta do leitor)

     Regra de atribuição automática (IUPAC / Nomenclatura Orgânica):
       Para molécula com geometria tetraédrica ou piramidal (nLone > 0):
         - 2 ligações no plano  (linha normal)
         - 1 cunha sólida       (ligante à frente)
         - 1 cunha tracejada    (ligante atrás)
       Para trigonal planar (3 ligantes, 0 pares solitários):
         - 3 linhas no plano (é planar mesmo)
       Para linear: 2 linhas planas (180°, no plano)
       Para angular (2 lig, ≥1 lone): 2 linhas planas (projeção 2D suficiente)
     =================================================================== */

  SILQ.wedgeMode  = false; // toggled pelo botão

  SILQ.showAngles = false; // mostra ângulos de ligação no canvas

  /* ── Tipo de cunha por ligação ── */
  SILQ.getWedgeType = function getWedgeType(central, ligand, ligandIndex, nBonds, nLone) {
    // Sem modo cunha: retorna 'plane' para todos
    if (!SILQ.wedgeMode) return 'plane';

    // Geometria puramente planar → tudo no plano
    if (nLone === 0 && nBonds <= 3) return 'plane';
    // Linear → plano
    if (nBonds === 2 && nLone === 0) return 'plane';
    // Angular (2 lig + ≥1 lone) → plano (já fica visível pelo ângulo)
    if (nBonds === 2) return 'plane';

    // Tetraédrico / Piramidal (nBonds=3,4): cunhas
    //   índice 0 → no plano (linha normal)
    //   índice 1 → no plano (linha normal)
    //   índice 2 → cunha sólida (vem para frente)
    //   índice 3 → cunha tracejada (vai para trás)
    if (nBonds >= 3) {
      if (ligandIndex === 0) return 'plane';
      if (ligandIndex === 1) return 'plane';
      if (ligandIndex === 2) return 'wedge-solid';
      if (ligandIndex >= 3)  return 'wedge-dash';
    }
    return 'plane';
  };

  /* ── Desenha cunha sólida: triângulo preenchido ── */
  SILQ.drawWedgeSolid = function drawWedgeSolid(svgParent, x1, y1, x2, y2, color) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len; // perpendicular
    const w = 6; // largura máxima da cunha no átomo distal
    // Triângulo: ponta em (x1,y1), base alargada em (x2,y2)
    const pts = [
      `${x1},${y1}`,
      `${x2 + nx*w},${y2 + ny*w}`,
      `${x2 - nx*w},${y2 - ny*w}`,
    ].join(' ');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', pts);
    poly.setAttribute('fill', color);
    poly.setAttribute('class', 'bond-wedge-solid');
    svgParent.appendChild(poly);
  };

  /* ── Desenha cunha tracejada: série de traços transversais ── */
  SILQ.drawWedgeDash = function drawWedgeDash(svgParent, x1, y1, x2, y2, color) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;   // unitário ao longo da ligação
    const nx = -uy, ny = ux;              // perpendicular
    const nStripes = 7;
    for (let i = 0; i < nStripes; i++) {
      const t  = (i + 1) / (nStripes + 1); // 0..1 ao longo da ligação
      const cx = x1 + t * dx;
      const cy = y1 + t * dy;
      const hw = 1.5 + t * 5; // meia-largura cresce em direção à ponta distal
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', cx - nx * hw); ln.setAttribute('y1', cy - ny * hw);
      ln.setAttribute('x2', cx + nx * hw); ln.setAttribute('y2', cy + ny * hw);
      ln.setAttribute('stroke', color);
      ln.setAttribute('stroke-width', '1.8');
      ln.setAttribute('stroke-linecap', 'round');
      ln.setAttribute('class', 'bond-wedge-dash');
      svgParent.appendChild(ln);
    }
  };

  /* ── Linha covalente paralela (dupla/tripla) com offset perpendicular ── */
  SILQ.drawLine = function drawLine(a, b, cls, ox=0, oy=0, extra='') {
    const ln=document.createElementNS('http://www.w3.org/2000/svg','line');
    ln.setAttribute('x1',a.x+ox); ln.setAttribute('y1',a.y+oy);
    ln.setAttribute('x2',b.x+ox); ln.setAttribute('y2',b.y+oy);
    ln.setAttribute('class',cls);
    if (extra) ln.setAttribute('style',extra);
    SILQ.svgEl.appendChild(ln);
  };

  SILQ.drawParallel = function drawParallel(a, b, order, cls) {
    const dx=b.x-a.x, dy=b.y-a.y, len=Math.hypot(dx,dy)||1;
    const px=-dy/len, py=dx/len;
    for (let i=0;i<order;i++) {
      const off=(i-(order-1)/2)*6; SILQ.drawLine(a,b,cls,px*off,py*off);
    }
  };

  /* ── Calcula ângulo real entre dois ligantes em torno de um átomo central ── */
  SILQ.calcBondAngle = function calcBondAngle(central, ligA, ligB) {
    const ax = ligA.x - central.x, ay = ligA.y - central.y;
    const bx = ligB.x - central.x, by = ligB.y - central.y;
    const dot = ax*bx + ay*by;
    const mag = (Math.hypot(ax, ay) || 1) * (Math.hypot(bx, by) || 1);
    return Math.acos(Math.max(-1, Math.min(1, dot/mag))) * 180 / Math.PI;
  };

  /* ── Desenha labels de ângulo entre pares de ligantes ──
     Versão melhorada: cada label compara o ângulo medido com o valor
     esperado pela literatura (banco específico > VSEPR genérico) e
     usa um código de cores para indicar o quão próximo está:
       verde   → desvio ≤ 2°   (dentro da tolerância experimental)
       amarelo → desvio 2–8°   (próximo, mas não convergido)
       laranja → desvio 8–20°  (divergente)
       vermelho→ desvio > 20°  (muito divergente — geometria incorreta)
     O label ganha um fundo (pill) para legibilidade em qualquer tema. */
  SILQ.drawAngleLabels = function drawAngleLabels() {
    SILQ.svgEl.querySelectorAll('.bond-angle-label,.bond-angle-arc,.bond-angle-pill,.bond-angle-group,.bond-angle-sublabel,.bond-angle-leader').forEach(e => e.remove());
    if (!SILQ.showAngles) return;

    const molKeyNow   = SILQ.getMoleculeKey();
    const knownMolNow = (typeof MOLECULE_GEOMETRY_DB !== 'undefined') ? MOLECULE_GEOMETRY_DB[molKeyNow] : null;
    const covalentBonds = SILQ.bonds.filter(b => b.type === 'covalent');

    /* ── Caso especial: moléculas lineares (diatômicas e trilineares) ──
       Exibe um badge "180°" centralizado sobre a ligação com marcadores ⊥.
       Só ativa se: banco confirma linear (angle=180) E há pelo menos 1 ligação. */
    if (knownMolNow && knownMolNow.angle === 180 && covalentBonds.length >= 1) {
      const bond0 = covalentBonds[0];
      const atA = SILQ.canvasAtoms.find(a => a.id === bond0.a);
      const atB = SILQ.canvasAtoms.find(a => a.id === bond0.b);
      if (atA && atB) {
        // Ponto médio da ligação
        const mx = (atA.x + atB.x) / 2, my = (atA.y + atB.y) / 2;
        const dx = atB.x - atA.x, dy = atB.y - atA.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx/len, uy = dy/len;
        const px = -uy, py = ux; // perpendicular

        // Dois traços perpendiculares (convenção para 180°)
        const hw = 10;
        const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        grp.setAttribute('class', 'bond-angle-group');
        [[0.35], [0.65]].forEach(([t]) => {
          const cx2 = atA.x + ux*len*t, cy2 = atA.y + uy*len*t;
          const mark = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          mark.setAttribute('x1', cx2 - px*hw); mark.setAttribute('y1', cy2 - py*hw);
          mark.setAttribute('x2', cx2 + px*hw); mark.setAttribute('y2', cy2 + py*hw);
          mark.setAttribute('stroke', '#34d399');
          mark.setAttribute('stroke-width', '2');
          mark.setAttribute('stroke-linecap', 'round');
          mark.setAttribute('class', 'bond-angle-arc');
          grp.appendChild(mark);
        });

        // Label 180° acima do ponto médio
        const lx = mx + py * 32, ly = my - px * 32; // desloca perpendicularmente
        const pillW = 48, pillH = 28;
        const pill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        pill.setAttribute('x', lx - pillW/2); pill.setAttribute('y', ly - pillH/2);
        pill.setAttribute('width', pillW); pill.setAttribute('height', pillH);
        pill.setAttribute('rx', 6);
        pill.setAttribute('class', 'bond-angle-pill angle-status--good');
        pill.setAttribute('stroke', '#34d399');
        grp.appendChild(pill);

        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x', lx); txt.setAttribute('y', ly - 4);
        txt.setAttribute('class', 'bond-angle-label');
        txt.setAttribute('fill', '#34d399');
        txt.textContent = '180.0°';
        grp.appendChild(txt);

        const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        sub.setAttribute('x', lx); sub.setAttribute('y', ly + 9);
        sub.setAttribute('class', 'bond-angle-sublabel');
        sub.textContent = knownMolNow.geometry;
        grp.appendChild(sub);

        SILQ.svgEl.appendChild(grp);
      }
      return; // molécula linear: só exibe o 180°, não processa pares
    }

    /* Lista global de posições já usadas (labels + átomos como obstáculos) */
    const usedPositions = [];
    const PILL_W = 50, PILL_H = 30; // dimensões reais do pill para colisão

    /* Registra TODOS os átomos do canvas como obstáculos fixos.
       Usa o raio visual estimado de cada átomo para a zona de exclusão. */
    SILQ.canvasAtoms.forEach(a => {
      const elR = (ELEMENTS[a.element]?.radius || 40) * 0.7 * 0.65;
      // Registra o centro do átomo com peso proporcional ao raio
      const clearance = elR + PILL_H / 2 + 4;
      usedPositions.push([a.x, a.y, clearance]);
    });

    SILQ.canvasAtoms.forEach(central => {
      const myBonds = covalentBonds.filter(b => b.a === central.id || b.b === central.id);
      if (myBonds.length < 2) return;
      const ligands = myBonds.map(b => {
        const lid = b.a === central.id ? b.b : b.a;
        return SILQ.canvasAtoms.find(at => at.id === lid);
      }).filter(Boolean);

      /* Ângulo de referência por centro usando o novo modelo quantitativo */
      let refAngle = null;
      if (knownMolNow) {
        refAngle = knownMolNow.angle;
      } else {
        const elC      = ELEMENTS[central.element];
        const used     = SILQ.bondOrderSum(central.id);
        const nLone    = Math.max(0, Math.floor(((elC.valence||4) - used) / 2));
        const ligSyms  = myBonds.map(b => {
          const lid = b.a === central.id ? b.b : b.a;
          return SILQ.canvasAtoms.find(at => at.id === lid)?.element || 'H';
        });
        const avgOrder = myBonds.reduce((s, b) => s + (b.order||1), 0) / myBonds.length;
        refAngle = SILQ.vsepAngleForElement(central.element, ligSyms, myBonds.length, nLone, avgOrder)
                   * 180 / Math.PI;
      }

      /* Raio do átomo central em px */
      const elData    = ELEMENTS[central.element];
      const atomRadPx = (elData?.radius || 40) * 0.7 * 0.65;

      /* Distância média e mínima centro→ligante */
      const ligDists   = ligands.map(L => Math.hypot(L.x - central.x, L.y - central.y));
      const avgLigDist = ligDists.reduce((s, d) => s + d, 0) / ligDists.length;
      const minLigDist = Math.min(...ligDists);

      /* Raio do arco: pequeno, próximo ao centro — só indica o ângulo */
      const arcR = Math.max(atomRadPx + 6, Math.min(avgLigDist * 0.30, 28));

      /* Distância do label: ALÉM do ligante mais próximo + margem fixa.
         Garante que o pill nunca fique dentro da molécula.             */
      const LABEL_MARGIN = 22; // px além do ligante mais próximo
      const labelBaseDist = minLigDist + LABEL_MARGIN;

      /* Limita pares desenhados por centro (máx 4 — igual ao 3D) */
      const MAX_PAIRS = 4;
      let pairsDrawn = 0;

      for (let i = 0; i < ligands.length && pairsDrawn < MAX_PAIRS; i++) {
        for (let j = i + 1; j < ligands.length && pairsDrawn < MAX_PAIRS; j++) {
          const Li = ligands[i], Lj = ligands[j];
          const angleDeg = SILQ.calcBondAngle(central, Li, Lj);
          const deviation = refAngle !== null ? Math.abs(angleDeg - refAngle) : null;

          /* ── Bug 1: pula pares cujo ângulo 2D medido está próximo de 180°
             para moléculas NÃO lineares. Isso acontece quando dois ligantes
             ficam em lados opostos na projeção 2D do canvas (física).
             Para moléculas genuinamente lineares, o banco de geometrias
             já retorna refAngle=180 e é tratado corretamente.            */
          const isGenuinelyLinear = refAngle !== null && refAngle > 170;
          if (!isGenuinelyLinear && angleDeg > 165) continue;

          // Código de cor por desvio da literatura
          let statusColor = '#60a5fa', statusClass = 'angle-status--neutral';
          if (deviation !== null) {
            if (deviation <= 2)       { statusColor = '#34d399'; statusClass = 'angle-status--good'; }
            else if (deviation <= 8)  { statusColor = '#fbbf24'; statusClass = 'angle-status--ok'; }
            else if (deviation <= 20) { statusColor = '#fb923c'; statusClass = 'angle-status--warn'; }
            else                      { statusColor = '#ef4444'; statusClass = 'angle-status--bad'; }
          }

          // Vetores para os dois ligantes
          const ax = Li.x - central.x, ay = Li.y - central.y;
          const bxv = Lj.x - central.x, byv = Lj.y - central.y;

          // ── Arco pelo lado MENOR usando produto escalar 2D (nunca reflexo) ──
          const dot2d   = ax*bxv + ay*byv;
          const cross2d = ax*byv - ay*bxv;
          const mA = Math.hypot(ax, ay) || 1, mB = Math.hypot(bxv, byv) || 1;
          const projAngle = Math.acos(Math.max(-1, Math.min(1, dot2d/(mA*mB))));
          const arcStart  = Math.atan2(ay, ax);
          const arcCCW    = cross2d < 0;
          const arcEnd    = arcStart + (arcCCW ? -projAngle : projAngle);

          const arcX1 = central.x + arcR * Math.cos(arcStart);
          const arcY1 = central.y + arcR * Math.sin(arcStart);
          const arcX2 = central.x + arcR * Math.cos(arcEnd);
          const arcY2 = central.y + arcR * Math.sin(arcEnd);
          const sweep = arcCCW ? 0 : 1;
          const large = projAngle > Math.PI ? 1 : 0;

          // ── Bissetriz correta (pelo lado menor) ──
          const aMid = arcStart + (arcCCW ? -projAngle/2 : projAngle/2);
          const bisX = Math.cos(aMid), bisY = Math.sin(aMid);

          // ── Posição do label: espiral radial a partir da bissetriz ──────
          // Começa além do ligante mais distante e expande em espiral
          // até encontrar posição livre de labels e átomos.
          const dA = Math.hypot(ax, ay), dB = Math.hypot(bxv, byv);
          const maxThisPairDist = Math.max(dA, dB);

          // Gera candidatos em espiral: 8 direções × 6 raios crescentes
          // Garante cobertura ampla ao redor da posição ideal
          const baseDist = maxThisPairDist + 28;
          const candidates = [];
          const NANGLES = 12; // 12 direções = a cada 30°
          for (let ri = 0; ri <= 5; ri++) {
            const rr = baseDist + ri * PILL_W * 0.7;
            for (let ai = 0; ai < NANGLES; ai++) {
              const th = aMid + (ai / NANGLES) * 2 * Math.PI;
              candidates.push([
                central.x + Math.cos(th) * rr,
                central.y + Math.sin(th) * rr,
              ]);
            }
          }

          // Função de pontuação: minimiza colisão com labels e átomos.
          // Retorna a menor distância livre de qualquer obstáculo.
          function scoreCand(cx2, cy2) {
            return usedPositions.reduce((mn, obs) => {
              const ox = obs[0], oy = obs[1];
              const clearance = obs[2] ?? (PILL_W * 0.5);
              const d = Math.hypot(cx2 - ox, cy2 - oy);
              // Distância efetiva = distância − clearance (negativo = colisão)
              return Math.min(mn, d - clearance);
            }, Infinity);
          }

          // Escolhe o candidato com maior distância livre
          let bestX = central.x + bisX * baseDist;
          let bestY = central.y + bisY * baseDist;
          let bestScore = scoreCand(bestX, bestY);

          for (const [cx2, cy2] of candidates) {
            const score = scoreCand(cx2, cy2);
            if (score > bestScore) {
              bestScore = score;
              bestX = cx2; bestY = cy2;
            }
            if (score > PILL_W * 0.6) break; // suficientemente livre — aceita
          }

          const lx = bestX, ly = bestY;
          // Registra o label como obstáculo para os próximos
          usedPositions.push([lx, ly, PILL_W * 0.55]);

          const grp = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          grp.setAttribute('class', 'bond-angle-group');

          // Arco SVG
          const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          arc.setAttribute('d', `M ${arcX1} ${arcY1} A ${arcR} ${arcR} 0 ${large} ${sweep} ${arcX2} ${arcY2}`);
          arc.setAttribute('fill', 'none');
          arc.setAttribute('stroke', statusColor);
          arc.setAttribute('stroke-width', '2');
          arc.setAttribute('opacity', '0.80');
          arc.setAttribute('class', 'bond-angle-arc');
          grp.appendChild(arc);

          // Dimensões do pill (necessárias para calcular a linha de chamada)
          const subText = deviation !== null ? `lit. ${refAngle.toFixed(1)}°` : null;
          const pillW = subText ? 48 : 36;
          const pillH = subText ? 28 : 18;

          // Linha de chamada: do arco ao pill (pontilhada, colorida)
          const arcTipX  = central.x + bisX * (arcR + 2);
          const arcTipY  = central.y + bisY * (arcR + 2);
          const ang2Lab  = Math.atan2(ly - central.y, lx - central.x);
          const labEdgeX = lx - Math.cos(ang2Lab) * (pillW/2 + 2);
          const labEdgeY = ly - Math.sin(ang2Lab) * (pillH/2 + 2);

          const leader = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          leader.setAttribute('x1', arcTipX);
          leader.setAttribute('y1', arcTipY);
          leader.setAttribute('x2', labEdgeX);
          leader.setAttribute('y2', labEdgeY);
          leader.setAttribute('stroke', statusColor);
          leader.setAttribute('stroke-width', '1.2');
          leader.setAttribute('stroke-dasharray', '4 3');
          leader.setAttribute('opacity', '0.55');
          leader.setAttribute('class', 'bond-angle-leader');
          grp.appendChild(leader);

          // Pill de fundo
          const pill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          pill.setAttribute('x', lx - pillW/2);
          pill.setAttribute('y', ly - pillH/2);
          pill.setAttribute('width', pillW);
          pill.setAttribute('height', pillH);
          pill.setAttribute('rx', 6);
          pill.setAttribute('class', `bond-angle-pill ${statusClass}`);
          pill.setAttribute('stroke', statusColor);
          grp.appendChild(pill);

          // Texto principal: ângulo medido
          const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          txt.setAttribute('x', lx);
          txt.setAttribute('y', subText ? ly - 5 : ly);
          txt.setAttribute('class', 'bond-angle-label');
          txt.setAttribute('fill', statusColor);
          txt.textContent = `${angleDeg.toFixed(1)}°`;
          grp.appendChild(txt);

          if (subText) {
            const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            sub.setAttribute('x', lx);
            sub.setAttribute('y', ly + 8);
            sub.setAttribute('class', 'bond-angle-sublabel');
            sub.textContent = subText;
            grp.appendChild(sub);
          }

          SILQ.svgEl.appendChild(grp);
          pairsDrawn++;
        }
      }
    });
  };

  /* ── Função principal de redesenho de todas as ligações ── */
  SILQ.updateBondLines = function updateBondLines() {
    SILQ.svgEl.querySelectorAll(
      '.bond-covalent,.bond-plane,.bond-wedge-solid,.bond-wedge-dash,' +
      '.bond-ionic,.bond-metallic,.bond-selected,.bond-label'
    ).forEach(el => el.remove());

    SILQ.bonds.forEach(bond => {
      const a = SILQ.canvasAtoms.find(at => at.id === bond.a);
      const b = SILQ.canvasAtoms.find(at => at.id === bond.b);
      if (!a || !b) return;
      const isSelected = bond === SILQ.selectedBond;

      if (bond.type === 'covalent') {
        // Glow amarelo para ligação selecionada
        if (isSelected) {
          const hl = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          hl.setAttribute('x1', a.x); hl.setAttribute('y1', a.y);
          hl.setAttribute('x2', b.x); hl.setAttribute('y2', b.y);
          hl.setAttribute('class', 'bond-selected');
          hl.setAttribute('stroke', '#facc15');
          hl.setAttribute('stroke-width', String(bond.order * 6 + 10));
          hl.setAttribute('stroke-linecap', 'round');
          hl.setAttribute('opacity', '0.4');
          SILQ.svgEl.insertBefore(hl, SILQ.svgEl.firstChild);
        }

        // Determina se esta ligação deve ser cunha
        // Procura o átomo central desta ligação (o que tem mais ligações)
        const aCount = SILQ.bonds.filter(bx => bx.type==='covalent' && (bx.a===a.id||bx.b===a.id)).length;
        const bCount = SILQ.bonds.filter(bx => bx.type==='covalent' && (bx.a===b.id||bx.b===b.id)).length;
        let central = null, ligand = null;
        if (aCount >= bCount && aCount >= 2) { central = a; ligand = b; }
        else if (bCount > aCount && bCount >= 2) { central = b; ligand = a; }

        let wedgeType = 'plane';
        if (SILQ.wedgeMode && central) {
          const el      = ELEMENTS[central.element];
          const used    = SILQ.bondOrderSum(central.id);
          const nLone   = Math.max(0, Math.floor((el.valence - used) / 2));
          const myBonds = SILQ.bonds.filter(bx => bx.type==='covalent' && (bx.a===central.id||bx.b===central.id));
          const nBonds  = myBonds.length;
          // índice desta ligação no array do centro
          const idx     = myBonds.findIndex(bx => bx === bond);
          wedgeType     = SILQ.getWedgeType(central, ligand, idx, nBonds, nLone);
        }

        const bondColor = '#4fc3f7';

        if (wedgeType === 'wedge-solid') {
          // Cunha sólida — apenas ligações simples (perspectiva)
          SILQ.drawWedgeSolid(SILQ.svgEl, central.x, central.y, ligand.x, ligand.y, bondColor);
        } else if (wedgeType === 'wedge-dash') {
          // Cunha tracejada
          SILQ.drawWedgeDash(SILQ.svgEl, central.x, central.y, ligand.x, ligand.y, bondColor);
        } else {
          // Linha plana normal (dupla/tripla ou plano puro)
          SILQ.drawParallel(a, b, bond.order, 'bond-covalent');
        }

        // Label de ordem (σ, σ+π, σ+2π) para ordem > 1 ou selecionado
        if (bond.order > 1 || isSelected) {
          const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
          const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          lbl.setAttribute('x', mx); lbl.setAttribute('y', my - 8);
          lbl.setAttribute('class', 'bond-label');
          lbl.setAttribute('fill', isSelected ? '#facc15' : '#93c5fd');
          lbl.setAttribute('font-size', isSelected ? '9' : '8');
          lbl.setAttribute('font-weight', isSelected ? 'bold' : 'normal');
          lbl.setAttribute('text-anchor', 'middle');
          const orderLabel = {1:'σ', 2:'σ+π', 3:'σ+2π'};
          lbl.textContent = orderLabel[bond.order] || '';
          SILQ.svgEl.appendChild(lbl);
        }
      }
      else if (bond.type === 'ionic')    SILQ.drawLine(a, b, 'bond-ionic');
      else if (bond.type === 'metallic') SILQ.drawLine(a, b, 'bond-metallic');
    });

    // Redesenha ângulos se ativado
    SILQ.drawAngleLabels();
  };
});


