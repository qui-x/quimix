/* ═══════════════════════════════════════════════════════════════
   CAMADA: INICIALIZAÇÃO — Controles de física
   ARQUIVO: controles-fisica.js
   ───────────────────────────────────────────────────────────────
   Liga os botões Pausar Física, Travar Geometria e "Snap Literatura"
   — este último é o algoritmo completo que recalcula as posições de
   TODOS os átomos para que sigam os comprimentos de ligação e
   ângulos EXATOS da literatura química (banco específico da
   molécula, com fallback para VSEPR genérico), travando a geometria
   ao final.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/*, core/vsepr.js, data/geometrias-moleculares.js,
               js/bonds/logica-ligacoes.js, js/render/wedge-linhas.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     23. CONTROLES DE FÍSICA
     =================================================================== */
  if (SILQ.btnPhysics) {
    SILQ.btnPhysics.addEventListener('click',()=>{
      // Se estava frozen, desfreza primeiro
      if (SILQ.frozenGeometry) {
        SILQ.frozenGeometry = false;
        const btnFrz = document.getElementById('btn-freeze-geo');
        if (btnFrz) {
          btnFrz.classList.remove('active-a11y');
          btnFrz.setAttribute('aria-pressed','false');
          btnFrz.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-unlock"/></svg> F\u00edsica Livre';
        }
      }
      SILQ.physicsEnabled=!SILQ.physicsEnabled;
      SILQ.btnPhysics.innerHTML=SILQ.physicsEnabled?'<svg class="icon" aria-hidden="true"><use href="#ic-pause"/></svg> Pausar F\u00edsica':'<svg class="icon" aria-hidden="true"><use href="#ic-play"/></svg> Ativar F\u00edsica';
      SILQ.btnPhysics.classList.toggle('btn-outline-warning',!SILQ.physicsEnabled);
      SILQ.btnPhysics.classList.toggle('btn-warning',SILQ.physicsEnabled);
      SILQ.setToggleState(SILQ.btnPhysics, !SILQ.physicsEnabled);
      SILQ.announce(SILQ.physicsEnabled ? 'Simula\u00e7\u00e3o f\u00edsica ativada.' : 'Simula\u00e7\u00e3o f\u00edsica pausada.');
    });
  }

  /* Botão de travamento de geometria */
  document.getElementById('btn-freeze-geo')?.addEventListener('click', () => {
    SILQ.frozenGeometry = !SILQ.frozenGeometry;
    const btn = document.getElementById('btn-freeze-geo');
    if (btn) {
      btn.classList.toggle('active-a11y', SILQ.frozenGeometry);
      btn.setAttribute('aria-pressed', SILQ.frozenGeometry ? 'true' : 'false');
      btn.innerHTML = SILQ.frozenGeometry ? '<svg class="icon" aria-hidden="true"><use href="#ic-lock"/></svg> Geometria Travada' : '<svg class="icon" aria-hidden="true"><use href="#ic-unlock"/></svg> F\u00edsica Livre';
    }
    if (SILQ.frozenGeometry) {
      // Zera velocidades para não haver impulso ao destravar depois
      SILQ.canvasAtoms.forEach(a => { a.vx = 0; a.vy = 0; });
      SILQ.announce('Geometria travada. Os \u00e1tomos n\u00e3o se mover\u00e3o pela f\u00edsica. Arraste para editar.');
    } else {
      SILQ.announce('Geometria livre. A f\u00edsica pode mover os \u00e1tomos.');
    }
    if (!SILQ.simLoop) SILQ.startSimLoop();
  });

  if (SILQ.btnSnap) {
    /* ===================================================================
       SNAP LITERATURA — força o alinhamento geométrico exato
       ===================================================================
       Substitui o antigo "snap de distância" por um algoritmo completo
       que recalcula as posições de TODOS os átomos para que:
         1. Os comprimentos de ligação sigam getBondLength (raios reais)
         2. Os ângulos entre ligantes sigam o valor exato da literatura:
            - Banco específico da molécula (MOLECULE_GEOMETRY_DB) se a
              fórmula for conhecida (H2O→104.5°, NH3→107.8°, etc.)
            - Caso contrário, o ângulo VSEPR genérico calculado pela
              valência e pares solitários do átomo central
         3. Ao final, a geometria é travada (frozenGeometry=true) para
            que a física não desfaça o alinhamento imediatamente.
       Algoritmo: para cada átomo central (≥2 ligações covalentes),
       distribui os ligantes em um leque simétrico no ângulo exato,
       mantendo o comprimento de ligação correto a partir do centro. */
    SILQ.btnSnap.addEventListener('click', () => {
      if (SILQ.canvasAtoms.length < 2) {
        SILQ.announce('Adicione pelo menos dois átomos para alinhar a geometria.', 'assertive');
        return;
      }

      const covalentBonds = SILQ.bonds.filter(b => b.type === 'covalent');
      const ionicMetallicBonds = SILQ.bonds.filter(b => b.type !== 'covalent');

      // Resolve o ângulo de referência: banco específico > VSEPR genérico
      const molKey   = SILQ.getMoleculeKey();
      const knownMol = (typeof MOLECULE_GEOMETRY_DB !== 'undefined') ? MOLECULE_GEOMETRY_DB[molKey] : null;

      /* Identifica todos os átomos "centrais" (com ≥2 ligações covalentes).
         Processa em ordem decrescente de número de ligações, para que
         o átomo mais conectado seja o "ponto fixo" da molécula.        */
      const centers = SILQ.canvasAtoms
        .map(a => ({ atom: a, n: covalentBonds.filter(b => b.a === a.id || b.b === a.id).length }))
        .filter(o => o.n >= 2)
        .sort((x, y) => y.n - x.n);

      if (centers.length === 0) {
        // Sem átomo central com ≥2 ligações: apenas normaliza distâncias
        // (caso de moléculas diatômicas ou ligações iônicas/metálicas isoladas)
        snapBondLengthsOnly();
        SILQ.announce('Comprimentos de ligação ajustados (nenhuma geometria angular detectada).');
        return;
      }

      const processedAtoms = new Set();

      centers.forEach(({ atom: central }) => {
        const myBonds = covalentBonds.filter(b => b.a === central.id || b.b === central.id);
        const ligands = myBonds.map(b => {
          const lid = b.a === central.id ? b.b : b.a;
          return SILQ.canvasAtoms.find(at => at.id === lid);
        }).filter(Boolean);
        if (ligands.length < 2) return;

        // Ângulo alvo: banco específico > VSEPR genérico
        let targetAngleDeg;
        if (knownMol) {
          targetAngleDeg = knownMol.angle;
        } else {
          const elC   = ELEMENTS[central.element];
          const used  = SILQ.bondOrderSum(central.id);
          const nLone = Math.max(0, Math.floor((elC.valence - used) / 2));
          targetAngleDeg = (SILQ.vsepAngle(ligands.length, nLone) * 180) / Math.PI;
        }
        const targetAngleRad = (targetAngleDeg * Math.PI) / 180;

        // Comprimento de ligação correto para cada ligante
        const bondLens = ligands.map(l => SILQ.getBondLength(central.element, l.element));

        // Direção de referência: mantém a orientação atual média da molécula
        // (evita "girar" a molécula inteira ao snapar)
        let refAngle = 0;
        if (ligands.length > 0) {
          const first = ligands[0];
          refAngle = Math.atan2(first.y - central.y, first.x - central.x);
        }

        distributeAtTargetAngle(central, ligands, bondLens, targetAngleRad, refAngle);

        processedAtoms.add(central.id);
        ligands.forEach(l => processedAtoms.add(l.id));
      });

      // Zera velocidades de todos os átomos processados
      SILQ.canvasAtoms.forEach(a => { a.vx = 0; a.vy = 0; });

      // Recalcula posições de ligações iônicas/metálicas remanescentes
      // (átomos que não participam de geometria angular, apenas aproxima)
      ionicMetallicBonds.forEach(bond => {
        const a = SILQ.canvasAtoms.find(at => at.id === bond.a);
        const b = SILQ.canvasAtoms.find(at => at.id === bond.b);
        if (!a || !b) return;
        if (processedAtoms.has(a.id) && processedAtoms.has(b.id)) return; // já posicionados
        const d  = SILQ.dist(a, b) || 1;
        const bl = SILQ.getBondLength(a.element, b.element);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d;
        if (!processedAtoms.has(a.id)) { a.x = mx - nx*bl/2; a.y = my - ny*bl/2; }
        if (!processedAtoms.has(b.id)) { b.x = mx + nx*bl/2; b.y = my + ny*bl/2; }
      });

      // Atualiza visual
      SILQ.canvasAtoms.forEach(a => SILQ.setAtomPos(a));
      SILQ.updateBondLines();
      SILQ.updateGlow();
      SILQ.updateDipoles();
      SILQ.updateChargeLabels();
      SILQ.updateEnergyChart();
      SILQ.updateMolPanel();

      // Burst visual em cada ligação para indicar "snap" aplicado
      SILQ.bonds.forEach(bond => {
        const a = SILQ.canvasAtoms.find(at => at.id === bond.a);
        const b = SILQ.canvasAtoms.find(at => at.id === bond.b);
        if (a && b) SILQ.spawnBurstAt((a.x+b.x)/2, (a.y+b.y)/2, bond.type, bond.subtype);
      });

      /* Trava a geometria após o snap — a física não deve desfazer
         imediatamente o alinhamento que acabamos de forçar.            */
      SILQ.frozenGeometry = true;
      const btnFrz = document.getElementById('btn-freeze-geo');
      if (btnFrz) {
        btnFrz.classList.add('active-a11y');
        btnFrz.setAttribute('aria-pressed', 'true');
        btnFrz.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-lock"/></svg> Geometria Travada';
      }
      if (!SILQ.simLoop) SILQ.startSimLoop();

      const src = knownMol ? `literatura (${knownMol.note})` : 'VSEPR genérico';
      SILQ.announce(`Geometria alinhada com base na ${src}. Geometria travada — arraste um átomo para liberar.`, 'assertive');
    });

    /* Distribui ligantes em torno de um centro no ângulo exato solicitado,
       preservando a orientação geral atual da molécula (refAngle).        */
    function distributeAtTargetAngle(central, ligands, bondLens, targetAngleRad, refAngle) {
      const n = ligands.length;
      if (n === 0) return;

      if (n === 1) {
        ligands[0].x = central.x + bondLens[0] * Math.cos(refAngle);
        ligands[0].y = central.y + bondLens[0] * Math.sin(refAngle);
        return;
      }

      if (n === 2) {
        // Dois ligantes: distribui simetricamente em torno de refAngle
        const half = targetAngleRad / 2;
        ligands[0].x = central.x + bondLens[0] * Math.cos(refAngle - half);
        ligands[0].y = central.y + bondLens[0] * Math.sin(refAngle - half);
        ligands[1].x = central.x + bondLens[1] * Math.cos(refAngle + half);
        ligands[1].y = central.y + bondLens[1] * Math.sin(refAngle + half);
        return;
      }

      // 3+ ligantes: distribui em leque simétrico centrado em refAngle,
      // com espaçamento igual ao ângulo alvo entre vizinhos adjacentes
      const spread = (n - 1) * targetAngleRad;
      const startA = refAngle - spread / 2;
      for (let i = 0; i < n; i++) {
        const a = startA + i * targetAngleRad;
        ligands[i].x = central.x + bondLens[i] * Math.cos(a);
        ligands[i].y = central.y + bondLens[i] * Math.sin(a);
      }
    }

    /* Fallback: quando não há geometria angular para alinhar (ex: apenas
       uma ligação iônica/metálica isolada), normaliza só a distância.    */
    function snapBondLengthsOnly() {
      SILQ.bonds.forEach(bond => {
        if (bond.type === 'metallic') return;
        const a = SILQ.canvasAtoms.find(at => at.id === bond.a);
        const b = SILQ.canvasAtoms.find(at => at.id === bond.b);
        if (!a || !b) return;
        const d  = SILQ.dist(a, b) || 1;
        const bl = SILQ.getBondLength(a.element, b.element);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        const nx = (b.x - a.x) / d, ny = (b.y - a.y) / d;
        a.x = mx - nx*bl/2; a.y = my - ny*bl/2;
        b.x = mx + nx*bl/2; b.y = my + ny*bl/2;
        a.vx = 0; a.vy = 0; b.vx = 0; b.vy = 0;
        SILQ.setAtomPos(a); SILQ.setAtomPos(b);
        SILQ.spawnBurstAt(mx, my, bond.type, bond.subtype);
      });
      SILQ.checkAllBonds();
    }
  }
});


