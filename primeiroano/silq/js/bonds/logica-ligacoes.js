/* ═══════════════════════════════════════════════════════════════
   CAMADA: LIGAÇÕES
   ARQUIVO: logica-ligacoes.js
   ───────────────────────────────────────────────────────────────
   O núcleo da lógica de ligações: encontrar uma ligação existente
   (findBond), verificar TODOS os pares de átomos a cada frame para
   formar/quebrar ligações conforme a distância e as regras químicas
   (checkAllBonds), formar (formBond) e remover (removeBond) uma
   ligação específica, e os efeitos visuais de formação/quebra
   (animateBondFormation, breakBondEffect, spawnBurstAt).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/*, core/validacao-ligacoes.js
               (determineBondType).
   Usado por: js/simulation/fisica-tick.js, js/atoms/atomos.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     14. LÓGICA DE LIGAÇÕES
     =================================================================== */
  SILQ.findBond = function findBond(idA, idB) {
    return SILQ.bonds.find(b=>(b.a===idA&&b.b===idB)||(b.a===idB&&b.b===idA));
  };

  SILQ.checkAllBonds = function checkAllBonds() {
    for (let i=0;i<SILQ.canvasAtoms.length;i++) {
      for (let j=i+1;j<SILQ.canvasAtoms.length;j++) {
        const a=SILQ.canvasAtoms[i], b=SILQ.canvasAtoms[j];
        const d=SILQ.dist(a,b), bl=SILQ.getBondLength(a.element,b.element);
        const ex=SILQ.findBond(a.id,b.id);

        if (ex) {
          if (d > bl*1.75) { SILQ.breakBondEffect(ex,a,b); SILQ.removeBond(ex); }
          continue;
        }

        if (d<=bl*1.15) {
          // determineBondType retorna null se a combinação for inválida
          const bondInfo = SILQ.determineBondType(a.element, b.element);
          if (!bondInfo) continue; // bloqueado pelo sistema de validação

          const {type, subtype, polarNote} = bondInfo;

          /* Guarda de valência iônica: nunca excede a capacidade do íon */
          if (type === 'ionic' && !SILQ.canFormIonicBond(a, b)) {
            const capA = SILQ.ionicCapacity(a.element), usedA = SILQ.ionicBondCount(a.id);
            const capB = SILQ.ionicCapacity(b.element), usedB = SILQ.ionicBondCount(b.id);
            if (usedA >= capA) SILQ.showIonicCapacityWarning(a.element, capA);
            else               SILQ.showIonicCapacityWarning(b.element, capB);
            continue;
          }

          SILQ.formBond(a, b, type, polarNote, subtype);
        }
      }
    }
    SILQ.updateBondLines();
    SILQ.updateGlow();
    SILQ.updateElectronSea();
    SILQ.updateEnergyChart();
    SILQ.updateChargeLabels();
    SILQ.updateDipoles();
    SILQ.updateMolPanel();
  };

  SILQ.formBond = function formBond(a, b, type, polarNote=null, subtype=null) {
    if (!type) return; // bloqueado pelo sistema de validação
    const bond={a:a.id, b:b.id, type, subtype, order:1, polarNote};

    /* Estampa a direção de cunha escolhida pelo usuário na ligação.
       'auto' não é gravado (undefined = auto pelo view3dsilq.js).      */
    if (type === 'covalent' && SILQ.wedgeDirection && SILQ.wedgeDirection !== 'auto') {
      bond.wedge = SILQ.wedgeDirection;
    }

    if (type==='covalent') {
      const rA=SILQ.covalentCap(a.element)-SILQ.bondOrderSum(a.id);
      const rB=SILQ.covalentCap(b.element)-SILQ.bondOrderSum(b.id);
      if (rA<=0||rB<=0) return;

      if (SILQ.forcedBondOrder !== null) {
        const maxPossible = Math.min(rA, rB, 3);
        if (SILQ.forcedBondOrder > maxPossible) {
          SILQ.showBondOrderWarning(a.element, b.element, SILQ.forcedBondOrder, maxPossible);
          bond.order = maxPossible;
        } else {
          bond.order = SILQ.forcedBondOrder;
        }
      } else {
        bond.order = Math.max(1, Math.min(rA, rB, 3));
      }
    }

    if (type==='ionic') {
      /* Segunda guarda: nunca forma ligação iônica além da capacidade.
         Garante que mesmo chamadas diretas (ex: mountPreset) respeitem
         a valência do íon.                                              */
      if (!SILQ.canFormIonicBond(a, b)) return;

      const aIsM = SILQ.isMetal(ELEMENTS[a.element].category);
      const donor    = aIsM ? a : b;
      const acceptor = donor === a ? b : a;

      /* Transfere exatamente 1 e⁻ por ligação iônica formada.
         A carga acumula a cada nova ligação até atingir o máximo.
         Ex: Ca (cap=2) + 2×Cl: 1ª ligação → Ca+1; 2ª → Ca+2.         */
      donor.charge    = (donor.charge    || 0) + 1;
      acceptor.charge = (acceptor.charge || 0) - 1;
      bond.transferred = 1;
      bond.donor    = donor.id;
      bond.acceptor = acceptor.id;
    }

    SILQ.bonds.push(bond);
    SILQ.animateBondFormation(bond, a, b);
    SILQ.updateInfoPanel(bond, a, b);

    /* A11Y: anuncia a formação da ligação */
    const typeNames = {covalent:'covalente', ionic:'iônica', metallic:'metálica'};
    SILQ.announce(`Ligação ${typeNames[type]||type} formada entre ${ELEMENTS[a.element].name} e ${ELEMENTS[b.element].name}.`);
  };

  SILQ.removeBond = function removeBond(bond) {
    if (bond.type === 'ionic') {
      /* Reverte sempre 1 e⁻ por ligação iônica removida,
         independente do valor de bond.transferred             */
      const d  = SILQ.canvasAtoms.find(at => at.id === bond.donor);
      const ac = SILQ.canvasAtoms.find(at => at.id === bond.acceptor);
      if (d)  d.charge  = (d.charge  || 0) - 1;
      if (ac) ac.charge = (ac.charge || 0) + 1;
    }
    SILQ.bonds = SILQ.bonds.filter(b => b !== bond);
  };

  /* ===================================================================
     14. EFEITOS DE FORMAÇÃO E QUEBRA DE LIGAÇÃO
     =================================================================== */
  SILQ.animateBondFormation = function animateBondFormation(bond, a, b) {
    // Flash de energia na formação
    SILQ.spawnBurstAt((a.x+b.x)/2, (a.y+b.y)/2, bond.type, bond.subtype);

    if (bond.type==='ionic'&&bond.transferred) {
      const d=SILQ.canvasAtoms.find(at=>at.id===bond.donor);
      const ac=SILQ.canvasAtoms.find(at=>at.id===bond.acceptor);
      if (!d||!ac) return;
      // Múltiplas partículas de elétron
      for (let k=0;k<3;k++) {
        setTimeout(()=>{
          const ep=document.createElement('div'); ep.className='electron-particle';
          SILQ.canvas.appendChild(ep);
          gsap.set(ep,{xPercent:-50,yPercent:-50,x:d.x+(Math.random()-0.5)*20,y:d.y+(Math.random()-0.5)*20});
          gsap.to(ep,{x:ac.x,y:ac.y,duration:.55+Math.random()*.3,ease:'power2.inOut',onComplete:()=>ep.remove()});
        }, k*90);
      }
    }

    if (bond.type==='covalent') {
      // Linha de "compartilhamento" que pulsa brevemente
      const fl=document.createElementNS('http://www.w3.org/2000/svg','line');
      fl.setAttribute('x1',a.x); fl.setAttribute('y1',a.y);
      fl.setAttribute('x2',b.x); fl.setAttribute('y2',b.y);
      fl.setAttribute('stroke','#ffffff'); fl.setAttribute('stroke-width','6');
      fl.setAttribute('opacity','0.9'); fl.setAttribute('stroke-linecap','round');
      SILQ.svgEl.appendChild(fl);
      gsap.to(fl,{attr:{opacity:0,'stroke-width':0},duration:.45,ease:'power2.out',onComplete:()=>fl.remove()});
    }
  };

  SILQ.breakBondEffect = function breakBondEffect(bond, a, b) {
    if (SILQ.prefersReducedMotion) return; /* A11Y: sem partículas se preferência de movimento reduzido */
    const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    for (let k=0;k<5;k++) {
      const p=document.createElement('div'); p.className='break-particle'; SILQ.canvas.appendChild(p);
      const angle=Math.random()*Math.PI*2, spd=20+Math.random()*40;
      gsap.set(p,{xPercent:-50,yPercent:-50,x:mx,y:my,opacity:1});
      gsap.to(p,{x:mx+Math.cos(angle)*spd, y:my+Math.sin(angle)*spd,
        opacity:0, duration:.4+Math.random()*.3, ease:'power2.out', onComplete:()=>p.remove()});
    }
  };

  SILQ.spawnBurstAt = function spawnBurstAt(x, y, type, subtype) {
    if (SILQ.prefersReducedMotion) return; /* A11Y: sem partículas se preferência de movimento reduzido */
    const colors={covalent:'#4fc3f7', ionic:'#ffb74d', metallic:'#fde68a'};
    const clr=colors[subtype]||colors[type]||'#ffffff';
    for (let k=0;k<6;k++) {
      const p=document.createElement('div'); p.className='burst-particle';
      p.style.background=clr; p.style.boxShadow=`0 0 6px ${clr}`;
      SILQ.canvas.appendChild(p);
      const angle=(k/6)*Math.PI*2, r=18+Math.random()*20;
      gsap.set(p,{xPercent:-50,yPercent:-50,x,y,opacity:1,scale:1});
      gsap.to(p,{x:x+Math.cos(angle)*r, y:y+Math.sin(angle)*r,
        opacity:0, scale:0, duration:.5, ease:'power2.out', onComplete:()=>p.remove()});
    }
  };
});


