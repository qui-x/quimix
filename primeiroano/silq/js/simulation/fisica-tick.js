/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: fisica-tick.js
   ───────────────────────────────────────────────────────────────
   O loop de física (physicsTick, chamado a cada frame via
   requestAnimationFrame): agitação térmica, atração de coesão,
   colisões, e a chamada a checkAllBonds() que forma/quebra ligações
   conforme os átomos se aproximam ou afastam.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, core/fisica-quimica-utils.js.
   Usado por: js/init/controles-fisica.js e outros pontos que
              iniciam/param o loop.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  SILQ.initPhysics = function initPhysics(atom) {
    atom.vx = 0;
    atom.vy = 0;
  };

  SILQ.startSimLoop = function startSimLoop() {
    if (SILQ.simLoop) return;
    SILQ.simLoop = setInterval(SILQ.physicsTick, SILQ.PHYS_DT);
  };

  SILQ.stopSimLoop = function stopSimLoop() {
    if (SILQ.simLoop) { clearInterval(SILQ.simLoop); SILQ.simLoop = null; }
  };

  /* A ÁREA LIVRE (ver sidebar-rail.js · Oclusao). Um card flutuante aberto
     dá padding ao #main-content (css/stylesilq.css), e o #canvas encolhe
     para a parte que se vê. Os átomos guardam px relativos à borda esquerda
     do #canvas: os que ficariam além da nova parede seriam presos UM A UM
     (esticando e quebrando ligações) ou, com a geometria travada de uma
     molécula pronta, simplesmente cortados. Então a MOLÉCULA INTEIRA desliza
     junta para dentro — só translação: as distâncias, e portanto as
     ligações, não mudam. Durante um arrasto, nada se mexe sozinho. Roda no
     tique da física e a cada quadro do deslizamento do card. */
  SILQ.acomodarNaAreaLivre = function acomodarNaAreaLivre(W, H) {
    const at = SILQ.canvasAtoms, M = 28;
    if (!at || !at.length || at.some(a => a.dragging)) return false;
    let mexeu = false;
    // na vertical o card não muda nada: basta não deixar sair (translação)
    let y0 = Infinity, y1 = -Infinity; at.forEach(a => { y0 = Math.min(y0, a.y); y1 = Math.max(y1, a.y); });
    const dy = y1 > H - M ? -Math.min(y1 - (H - M), Math.max(0, y0 - M)) : y0 < M ? Math.min(M - y0, Math.max(0, (H - M) - y1)) : 0;
    if (Math.abs(dy) > 0.25) { at.forEach(a => { a.y += dy; }); mexeu = true; }
    // na horizontal: cada MOLÉCULA (os átomos ligados entre si) é um corpo rígido
    const pai = new Map(at.map(a => [a.id, a.id]));
    const raiz = id => { while (pai.get(id) !== id) { pai.set(id, pai.get(pai.get(id))); id = pai.get(id); } return id; };
    (SILQ.bonds || []).forEach(b => { if (pai.has(b.a) && pai.has(b.b)) pai.set(raiz(b.a), raiz(b.b)); });
    const grupos = new Map(); at.forEach(a => { const r = raiz(a.id); if (!grupos.has(r)) grupos.set(r, []); grupos.get(r).push(a); });
    const mols = [...grupos.values()].map(g => ({ g, x0: Math.min(...g.map(a => a.x)), x1: Math.max(...g.map(a => a.x)) })).sort((a, b) => a.x0 - b.x0);
    const X0 = mols[0].x0, X1 = Math.max(...mols.map(m => m.x1));
    if (X1 <= W - M + 0.25 && X0 >= M - 0.25) { if (mexeu) at.forEach(a => SILQ.setAtomPos(a)); return mexeu; }
    if (X1 - X0 <= W - 2 * M) {
      // cabe: TUDO desliza junto
      const dx = X1 > W - M ? (W - M) - X1 : M - X0;
      at.forEach(a => { a.x += dx; });
    } else {
      // não cabe: as moléculas se APROXIMAM, na ordem, cada uma inteira — só os vãos entre elas encolhem, até
      // uma folga mínima (para não chegarem à distância de ligação e se ligarem sozinhas)
      const FOLGA = 96;
      const arrumar = (k, aplicar) => {
        let fimOrig = -Infinity, fimNovo = M;
        mols.forEach((m, i) => {
          let x0n;
          if (i === 0) x0n = M;
          else { const g = m.x0 - fimOrig; x0n = fimNovo + (g > 0 ? Math.min(g, FOLGA) + (g - Math.min(g, FOLGA)) * k : g); }
          if (aplicar) { const dx = x0n - m.x0; m.g.forEach(a => { a.x += dx; }); }
          fimOrig = Math.max(fimOrig, m.x1); fimNovo = Math.max(fimNovo, x0n + (m.x1 - m.x0));
        });
        return fimNovo;
      };
      const S0 = arrumar(0, false), S1 = arrumar(1, false);
      const k = S1 - S0 > 0.5 ? Math.max(0, Math.min(1, ((W - M) - S0) / (S1 - S0))) : 0;
      arrumar(k, true);
    }
    at.forEach(a => SILQ.setAtomPos(a));
    return true;
  };
  window.addEventListener('oclusao', (e) => {
    if (!SILQ.canvas || !SILQ.canvasAtoms || !SILQ.canvasAtoms.length) return;
    if (SILQ.acomodarNaAreaLivre(SILQ.canvas.clientWidth, SILQ.canvas.clientHeight)) {
      if (SILQ.updateBondLines) SILQ.updateBondLines();
      if (SILQ.updateDipoles) SILQ.updateDipoles();
      SILQ._marRefazer = true;
    }
    // o mar de elétrons do metal guarda a caixa por onde vagueia: no fim do deslizamento, ele se refaz no lugar novo
    if (e.detail && e.detail.fim && SILQ._marRefazer && SILQ.seaElectrons && SILQ.updateElectronSea) {
      SILQ._marRefazer = false;
      SILQ.seaElectrons.forEach(el => { if (window.gsap) gsap.killTweensOf(el); el.remove(); }); SILQ.seaElectrons = [];
      SILQ.updateElectronSea();
    }
  });

  SILQ.physicsTick = function physicsTick() {
    /* Quando a geometria está travada (preset recém-montado), não move
       nenhum átomo nem recalcula ligações — apenas mantém o loop vivo
       para animações visuais (órbitas de elétrons via GSAP).            */
    if (SILQ.frozenGeometry) return;
    if (!SILQ.physicsEnabled || SILQ.canvasAtoms.length < 2) return;
    const rect = SILQ.canvas.getBoundingClientRect();
    if (SILQ.acomodarNaAreaLivre(rect.width, rect.height)) SILQ._marRefazer = true;   // a molécula inteira, antes da parede prender átomo por átomo

    const fx = new Map(), fy = new Map();
    SILQ.canvasAtoms.forEach(a => { fx.set(a.id, 0); fy.set(a.id, 0); });

    /* ---- (A) FORÇAS RADIAIS ---- */
    for (let i = 0; i < SILQ.canvasAtoms.length; i++) {
      for (let j = i + 1; j < SILQ.canvasAtoms.length; j++) {
        const a = SILQ.canvasAtoms[i], b = SILQ.canvasAtoms[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.hypot(dx, dy) || 0.1;
        const nx = dx / d, ny = dy / d;
        const bl = SILQ.getBondLength(a.element, b.element);
        const bond = SILQ.findBond(a.id, b.id);
        const isStrong = bond && (bond.type === 'covalent' || bond.type === 'ionic' || bond.type === 'metallic');
        const minDist = bl * 0.70;

        let F = 0;
        if (d < minDist) {
          const overlap = (minDist - d) / minDist;
          F = -220 * overlap * overlap;
        } else if (isStrong) {
          const delta = d - bl;
          if (Math.abs(delta) > bl * 0.04) F = SILQ.SNAP_K * delta;
        } else if (!bond && d < bl * 1.6) {
          const ratio = bl / d;
          F = 0.03 * (Math.pow(ratio, 6) - Math.pow(ratio, 3));
        }

        fx.set(a.id, fx.get(a.id) + F * nx);
        fy.set(a.id, fy.get(a.id) + F * ny);
        fx.set(b.id, fx.get(b.id) - F * nx);
        fy.set(b.id, fy.get(b.id) - F * ny);
      }
    }

    /* ---- (B) FORÇAS ANGULARES — usa ângulo EXATO do banco quando disponível ----
       Prioridade: MOLECULE_GEOMETRY_DB (ângulo da literatura) > vsepAngle (VSEPR geral)
       Isso garante que H₂O use 104,5°, NH₃ use 107,8°, CH₄ use 109,5°, etc.
       O banco é consultado pela fórmula Hill da molécula atual no canvas.        */
    const ANG_K = 0.55; // aumentado: força angular mais assertiva

    // Ângulo alvo vindo do banco (se existir)
    const molKeyNow    = SILQ.getMoleculeKey();
    const knownMolNow  = (typeof MOLECULE_GEOMETRY_DB !== 'undefined') ? MOLECULE_GEOMETRY_DB[molKeyNow] : null;
    const dbAngleRad   = knownMolNow ? (knownMolNow.angle * Math.PI / 180) : null;

    SILQ.canvasAtoms.forEach(central => {
      const myBonds = SILQ.bonds.filter(b =>
        b.type === 'covalent' && (b.a === central.id || b.b === central.id)
      );
      const nBondsDistinct = myBonds.length;
      if (nBondsDistinct < 2) return;

      // Ângulo alvo: banco DB > VSEPR genérico
      let targetAngle;
      if (dbAngleRad !== null) {
        targetAngle = dbAngleRad;
      } else {
        const el2 = ELEMENTS[central.element];
        const usedElectrons = SILQ.bondOrderSum(central.id);
        const nLone2 = Math.max(0, Math.floor((el2.valence - usedElectrons) / 2));
        targetAngle = SILQ.vsepAngle(nBondsDistinct, nLone2);
      }

      const ligands = myBonds.map(b => {
        const lid = b.a === central.id ? b.b : b.a;
        return SILQ.canvasAtoms.find(at => at.id === lid);
      }).filter(Boolean);
      if (ligands.length < 2) return;

      for (let i = 0; i < ligands.length; i++) {
        for (let j = i + 1; j < ligands.length; j++) {
          const Li = ligands[i], Lj = ligands[j];
          const ix = Li.x - central.x, iy = Li.y - central.y;
          const jx = Lj.x - central.x, jy = Lj.y - central.y;
          const di = Math.hypot(ix, iy) || 0.1;
          const dj = Math.hypot(jx, jy) || 0.1;
          const uix = ix/di, uiy = iy/di;
          const ujx = jx/dj, ujy = jy/dj;

          const cosA = Math.max(-1, Math.min(1, uix*ujx + uiy*ujy));
          const currentAngle = Math.acos(cosA);
          const dAngle = currentAngle - targetAngle;
          if (Math.abs(dAngle) < 0.005) continue;

          const sinA = Math.sqrt(Math.max(1e-6, 1 - cosA*cosA));
          const gix = (ujx - cosA*uix) / (di * sinA);
          const giy = (ujy - cosA*uiy) / (di * sinA);
          const gjx = (uix - cosA*ujx) / (dj * sinA);
          const gjy = (uiy - cosA*ujy) / (dj * sinA);

          const Fmag = ANG_K * dAngle;
          fx.set(Li.id, fx.get(Li.id) + Fmag * gix);
          fy.set(Li.id, fy.get(Li.id) + Fmag * giy);
          fx.set(Lj.id, fx.get(Lj.id) + Fmag * gjx);
          fy.set(Lj.id, fy.get(Lj.id) + Fmag * gjy);
          fx.set(central.id, fx.get(central.id) - 0.5*Fmag*(gix+gjx));
          fy.set(central.id, fy.get(central.id) - 0.5*Fmag*(giy+gjy));
        }
      }
    });

    /* ---- (C) INTEGRAÇÃO DE EULER ---- */
    SILQ.canvasAtoms.forEach(atom => {
      if (atom.dragging) { atom.vx = 0; atom.vy = 0; return; }
      atom.vx = (atom.vx + fx.get(atom.id)) * SILQ.DAMPING;
      atom.vy = (atom.vy + fy.get(atom.id)) * SILQ.DAMPING;
      const spd = Math.hypot(atom.vx, atom.vy);
      const maxSpd = 8;
      if (spd > maxSpd) { atom.vx *= maxSpd/spd; atom.vy *= maxSpd/spd; }
      atom.x = Math.max(28, Math.min(rect.width  - 28, atom.x + atom.vx));
      atom.y = Math.max(28, Math.min(rect.height - 28, atom.y + atom.vy));
      SILQ.setAtomPos(atom);
    });

    SILQ.checkAllBonds();
  };
});


