/* ═══════════════════════════════════════════════════════════════
   CAMADA: INICIALIZAÇÃO — Visão 3D e reset
   ARQUIVO: visualizacao-3d-reset.js
   ───────────────────────────────────────────────────────────────
   Expõe window.SILQ_VIEW3D_STATE — a ponte pela qual js/view3d/
   view3d.js lê o estado ao vivo do canvas 2D (átomos, ligações,
   direção da cunha), usando getters para refletir sempre o array
   atual, sem precisar de eventos. Também liga o botão de alternância
   2D/3D e o botão "Limpar".
   getMoleculeKey() foi relocada para cá (de
   js/molecules/estereoquimica.js) — ver comentário "CORREÇÃO DE
   ORDEM" no arquivo e a seção sobre function hoisting no README.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/*, js/view3d/view3d.js (consumidor da ponte).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     24. VISUALIZAÇÃO 3D — view3dsilq.js
     ===================================================================
     O renderizador 3D agora é autossuficiente (view3dsilq.js), sem
     dependências externas. Ele lê os dados do SILQ via o objeto
     window.SILQ_VIEW3D_STATE exposto aqui — apenas referências
     (não cópias), portanto reflete sempre o estado atual do canvas.

     A comunicação é unidirecional:
       scriptsilq.js → expõe SILQ_VIEW3D_STATE com canvasAtoms, bonds etc.
       view3dsilq.js → lê esse estado a cada frame (rAF próprio)
       scriptsilq.js → chama window.SILQ_VIEW3D.setActive(true/false)
                       para mostrar/ocultar o canvas 3D
     =================================================================== */

  /* Expõe o estado ao view3dsilq.js — usando referências ao próprio
     scope deste DOMContentLoaded para que canvasAtoms/bonds sejam
     sempre os arrays atuais, sem precisar de setters ou eventos. */

  /* CORREÇÃO DE ORDEM (ver README, seção "hoisting perdido"):
     getMoleculeKey foi RELOCADA para cá, de js/molecules/estereoquimica.js.
     No original era "function getMoleculeKey(){}", içada (hoisted) pelo
     JavaScript para o topo do escopo — então o objeto abaixo já a
     enxergava mesmo ela sendo declarada bem mais adiante no arquivo.
     Virando "SILQ.getMoleculeKey = function(){}", esse hoisting some;
     a declaração teve que vir fisicamente antes do uso. O corpo da
     função é idêntico ao original, só a ORDEM mudou. */
  SILQ.getMoleculeKey = function getMoleculeKey() {
    const counts = {};
    SILQ.canvasAtoms.forEach(a => { counts[a.element] = (counts[a.element] || 0) + 1; });
    const order = ['C','H', ...Object.keys(counts).filter(k=>k!=='C'&&k!=='H').sort()];
    return order.filter(k => counts[k]).map(k => counts[k]>1 ? `${k}${counts[k]}` : k).join('');
  };

  window.SILQ_VIEW3D_STATE = {
    get canvasAtoms()           { return SILQ.canvasAtoms; },
    get bonds()                 { return SILQ.bonds; },
    get wedgeDirection()        { return SILQ.wedgeDirection; },
    ELEMENTS,
    MOLECULE_GEOMETRY_DB: null,
    getMoleculeKey: SILQ.getMoleculeKey,
    vsepAngle: SILQ.vsepAngle,
    bondOrderSum: SILQ.bondOrderSum,
    get stereoNote() {
      return (typeof SILQ.getStereochemistryNote === 'function')
        ? SILQ.getStereochemistryNote(SILQ.getMoleculeKey()) : null;
    },
  };

  SILQ.btn3D.addEventListener('click', () => {
    SILQ.is3DActive = !SILQ.is3DActive;
    if (SILQ.is3DActive) {
      // Salva posições antes de esconder o canvas 2D
      SILQ.canvasAtoms.forEach(a => { a.savedX = a.x; a.savedY = a.y; });
      SILQ.canvasWrapper.style.display = 'none';
      SILQ.viewer3dEl.style.setProperty('display', 'block', 'important');

      // Ativa o renderizador 3D próprio — sincroniza estado de ângulos
      if (window.SILQ_VIEW3D) {
        window.SILQ_VIEW3D.setActive(true);
        window.SILQ_VIEW3D.showAngles = SILQ.showAngles;
      }

      SILQ.btn3D.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-microscope"/></svg> Voltar ao Editor 2D';
      SILQ.btn3D.classList.replace('btn-outline-info', 'btn-info');
      SILQ.setToggleState(SILQ.btn3D, true);
      SILQ.viewer3dEl.setAttribute('tabindex', '0');
      SILQ.viewer3dEl.focus();
      SILQ.announce('Visualiza\u00e7\u00e3o 3D ativada com cunhas e \u00e2ngulos reais. Arraste para rotacionar.');
    } else {
      if (window.SILQ_VIEW3D) window.SILQ_VIEW3D.setActive(false);
      SILQ.viewer3dEl.style.display = 'none';
      SILQ.canvasWrapper.style.display = 'block';
      SILQ.btn3D.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-cube"/></svg> Visualizar em 3D';
      SILQ.btn3D.classList.replace('btn-info', 'btn-outline-info');
      SILQ.setToggleState(SILQ.btn3D, false);
      SILQ.viewer3dEl.setAttribute('tabindex', '-1');
      SILQ.announce('Modo 2D restaurado.');
      // Restaura posições exatas e redesenha tudo
      SILQ.canvasAtoms.forEach(a => {
        if (a.savedX !== undefined) { a.x = a.savedX; a.y = a.savedY; }
        a.vx = 0; a.vy = 0;
        SILQ.setAtomPos(a);
      });
      SILQ.updateBondLines();
      SILQ.updateGlow();
      SILQ.updateDipoles();
      SILQ.updateChargeLabels();
      SILQ.updateEnergyChart();
    }
  });

  /* ===================================================================
     25. RESET
     =================================================================== */
  SILQ.btnReset.addEventListener('click',()=>{
    SILQ.stopSimLoop();
    SILQ.frozenGeometry = false;
    const btnFrz = document.getElementById('btn-freeze-geo');
    if (btnFrz) {
      btnFrz.classList.remove('active-a11y');
      btnFrz.setAttribute('aria-pressed','false');
      btnFrz.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-unlock"/></svg> F\u00edsica Livre';
    }
    SILQ.canvasAtoms.forEach(a=>{gsap.killTweensOf(a.orbitDom);a.dom.remove();a.orbitDom.remove();if(a.dipoleDom)a.dipoleDom.remove();});
    SILQ.seaElectrons.forEach(e=>{gsap.killTweensOf(e);e.remove();});
    SILQ.canvasAtoms=[];SILQ.bonds=[];SILQ.seaElectrons=[];
    SILQ.svgEl.innerHTML='';
    SILQ.canvasHint.classList.remove('hidden');
    SILQ.infoText.textContent='Clique em dois elementos para detectar interações.';
    SILQ.clearChart();
    if(SILQ.molPanel) SILQ.molPanel.style.display='none';
    if(SILQ.is3DActive) SILQ.btn3D.click();
    SILQ.announce('Canvas limpo. Todos os átomos e ligações foram removidos.', 'assertive');
  });
});


