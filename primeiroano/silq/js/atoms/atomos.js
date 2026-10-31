/* ═══════════════════════════════════════════════════════════════
   CAMADA: ÁTOMOS
   ARQUIVO: atomos.js
   ───────────────────────────────────────────────────────────────
   Criação e remoção de átomos no canvas (addAtom/removeAtom), a
   renderização visual de cada átomo (círculo colorido + rótulo +
   animação de entrada via GSAP), posicionamento (setAtomPos) e o
   arraste interativo pelo mouse/toque (makeDraggable).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/*, js/bonds/logica-ligacoes.js (checkAllBonds,
               chamado ao soltar um átomo arrastado).
   Usado por: js/ui/tabela-periodica.js, js/molecules/presets.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  SILQ.addAtom = function addAtom(sym, x, y) {
    const atom={id:'atom_'+(SILQ.idCounter++), element:sym, x, y, charge:0};
    SILQ.initPhysics(atom);
    SILQ.canvasAtoms.push(atom);
    SILQ.renderAtom(atom);
    SILQ.canvasHint.classList.add('hidden');
    SILQ.startSimLoop();
    SILQ.checkAllBonds();
    SILQ.updateMolPanel();
  };

  SILQ.removeAtom = function removeAtom(atom) {
    // Desfaz ligações e cargas iônicas associadas
    const atomBonds = SILQ.bonds.filter(b => b.a === atom.id || b.b === atom.id);
    atomBonds.forEach(b => SILQ.removeBond(b));

    // Animação de saída com escala
    gsap.to(atom.dom, {
      scale: 0, opacity: 0, duration: 0.22, ease: 'back.in(2)',
      onComplete: () => {
        gsap.killTweensOf(atom.orbitDom);
        atom.dom.remove();
        atom.orbitDom.remove();
        if (atom.dipoleDom) atom.dipoleDom.remove();
      }
    });

    SILQ.canvasAtoms = SILQ.canvasAtoms.filter(a => a.id !== atom.id);

    if (SILQ.canvasAtoms.length === 0) {
      SILQ.canvasHint.classList.remove('hidden');
      if (SILQ.molPanel) SILQ.molPanel.style.display = 'none';
      if (SILQ.deleteMode) SILQ.toggleDeleteMode();
      SILQ.stopSimLoop();
    }

    SILQ.checkAllBonds();
    SILQ.updateMolPanel();
    SILQ.updateBondLines();
    SILQ.updateDipoles();
    SILQ.updateEnergyChart();
  };

  SILQ.renderAtom = function renderAtom(atom) {
    const data=ELEMENTS[atom.element];
    const ci=CATEGORY_INFO[data.category]||{label:data.category};
    const div=document.createElement('div');
    div.className='atom';
    const atomColor = SILQ.themedElementColor(data.color);
    div.style.backgroundColor=atomColor;
    div.style.color=SILQ.getContrastColor(atomColor);
    div.style.setProperty('--glow-color', atomColor);
    div.innerHTML=`<span aria-hidden="true">${atom.element}</span><span class="charge-label" aria-hidden="true"></span><span class="atom-remove-x" aria-hidden="true">\u00d7</span>`;

    /* A11Y: torna o \u00e1tomo focavel e descrit\u00edvel por leitores de tela */
    div.setAttribute('tabindex', '0');
    div.setAttribute('role', 'button');
    div.setAttribute('aria-label',
      `\u00c1tomo de ${data.name} (${atom.element}), ${ci.label}. Duplo clique ou pressione Delete para remover. Arraste para mover.`
    );

    SILQ.canvas.appendChild(div);
    atom.dom=div;

    /* A11Y: remove \u00e1tomo por tecla Delete ou Backspace */
    div.addEventListener('keydown', e => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        SILQ.announce(`${data.name} removido do canvas.`, 'assertive');
        SILQ.removeAtom(atom);
      }
    });

    /* El\u00e9trons de val\u00eancia orbitando (ocultos para leitores de tela) */
    const orbit=document.createElement('div'); orbit.className='electron-orbit'; orbit.setAttribute('aria-hidden','true');
    const count=Math.min(data.valence,8);
    for (let i=0;i<count;i++) {
      const dot=document.createElement('div'); dot.className='electron-dot';
      dot.style.transform=`rotate(${(360/count)*i}deg) translateX(38px)`;
      orbit.appendChild(dot);
    }
    SILQ.canvas.appendChild(orbit); atom.orbitDom=orbit;

    /* Respeita prefer\u00eancia de movimento reduzido */
    if (!SILQ.prefersReducedMotion) {
      gsap.to(orbit,{rotation:360, duration:6+Math.random()*3, repeat:-1, ease:'none'});
    }

    /* Dipolo visual (oculto para leitores de tela — info \u00e9 texto no painel) */
    const dipole=document.createElement('div'); dipole.className='dipole-indicator'; dipole.style.display='none'; dipole.setAttribute('aria-hidden','true');
    SILQ.canvas.appendChild(dipole); atom.dipoleDom=dipole;

    /* Duplo clique sempre remove */
    div.addEventListener('dblclick', e => {
      e.stopPropagation();
      SILQ.announce(`${data.name} removido.`, 'assertive');
      SILQ.removeAtom(atom);
    });

    SILQ.setAtomPos(atom);
    SILQ.makeDraggable(atom);
  };

  SILQ.setAtomPos = function setAtomPos(atom) {
    atom.dom.style.left      = atom.x+'px';
    atom.dom.style.top       = atom.y+'px';
    atom.orbitDom.style.left = atom.x+'px';
    atom.orbitDom.style.top  = atom.y+'px';
    if (atom.dipoleDom) { atom.dipoleDom.style.left=atom.x+'px'; atom.dipoleDom.style.top=atom.y+'px'; }
  };

  /* ===================================================================
     12. ARRASTAR ÁTOMOS
     =================================================================== */
  SILQ.makeDraggable = function makeDraggable(atom) {
    let pointerMoved = false;

    atom.dom.addEventListener('pointerdown', e=>{
      e.preventDefault();
      pointerMoved = false;
      atom.dom.setPointerCapture(e.pointerId);
      atom.dom.classList.add('dragging');
      atom.dragging=true; atom.vx=0; atom.vy=0;
      // Arrastar um átomo desfaz o freeze: o usuário quer editar manualmente
      if (SILQ.frozenGeometry) {
        SILQ.frozenGeometry = false;
        const btnFrz = document.getElementById('btn-freeze-geo');
        if (btnFrz) {
          btnFrz.classList.remove('active-a11y');
          btnFrz.setAttribute('aria-pressed','false');
          btnFrz.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-unlock"/></svg> Física Livre';
        }
      }
    });

    atom.dom.addEventListener('pointermove', e=>{
      if (!atom.dragging) return;
      pointerMoved = true;
      // Em modo delete não permite arrastar — apenas clique
      if (SILQ.deleteMode) return;
      const rect=SILQ.canvas.getBoundingClientRect();
      atom.x=Math.max(28,Math.min(rect.width-28,e.clientX-rect.left));
      atom.y=Math.max(28,Math.min(rect.height-28,e.clientY-rect.top));
      SILQ.setAtomPos(atom); SILQ.checkAllBonds();
    });

    atom.dom.addEventListener('pointerup', e=>{
      atom.dragging=false; atom.dom.classList.remove('dragging');
      atom.dom.releasePointerCapture(e.pointerId);
      // Clique sem arrastar em modo delete → remove
      if (SILQ.deleteMode && !pointerMoved) {
        SILQ.removeAtom(atom);
      }
    });
  };
});


