/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO 2D
   ARQUIVO: dipolo-glow-eletrons.js
   ───────────────────────────────────────────────────────────────
   O dipolo molecular (setas δ+/δ-) para ligações polares, o brilho
   de estabilidade ao redor de moléculas completas, e a animação do
   "mar de elétrons" da ligação metálica (elétrons deslocalizados se
   movendo entre os cátions).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     17. DIPOLO MOLECULAR (δ+ / δ-)
     =================================================================== */
  SILQ.updateDipoles = function updateDipoles() {
    SILQ.canvasAtoms.forEach(atom=>{ if(atom.dipoleDom) atom.dipoleDom.style.display='none'; });

    SILQ.bonds.filter(b=>b.type==='covalent').forEach(bond=>{
      const a=SILQ.canvasAtoms.find(at=>at.id===bond.a);
      const b=SILQ.canvasAtoms.find(at=>at.id===bond.b);
      if (!a||!b) return;
      const enA=ELEMENTS[a.element].en||1, enB=ELEMENTS[b.element].en||1;
      const dEN=Math.abs(enA-enB);
      if (dEN<0.4) return; // apolar: sem dipolo visível

      // δ+ no átomo menos eletronegativo, δ- no mais eletronegativo
      const [plus, minus] = enA < enB ? [a,b] : [b,a];
      if (plus.dipoleDom) {
        plus.dipoleDom.style.display='block';
        plus.dipoleDom.textContent='δ+';
        plus.dipoleDom.style.color='#fbbf24';
      }
      if (minus.dipoleDom) {
        minus.dipoleDom.style.display='block';
        minus.dipoleDom.textContent='δ−';
        minus.dipoleDom.style.color='#60a5fa';
      }
    });
  };

  /* ===================================================================
     18. GLOW DE ESTABILIDADE
     =================================================================== */
  SILQ.updateGlow = function updateGlow() {
    SILQ.canvasAtoms.forEach(a=>a.dom.classList.remove('stable','near-bond'));
    SILQ.bonds.forEach(bond=>{
      const a=SILQ.canvasAtoms.find(at=>at.id===bond.a), b=SILQ.canvasAtoms.find(at=>at.id===bond.b);
      if (!a||!b) return;
      const d=SILQ.dist(a,b), bl=SILQ.getBondLength(a.element,b.element);
      if (Math.abs(d-bl)<=bl*.15) { a.dom.classList.add('stable'); b.dom.classList.add('stable'); }
      else if (d<bl*1.5) { a.dom.classList.add('near-bond'); b.dom.classList.add('near-bond'); }
    });
    // Distância de pré-ligação (VdW)
    for (let i=0;i<SILQ.canvasAtoms.length;i++) {
      for (let j=i+1;j<SILQ.canvasAtoms.length;j++) {
        const a=SILQ.canvasAtoms[i], b=SILQ.canvasAtoms[j];
        if (SILQ.findBond(a.id,b.id)) continue;
        const d=SILQ.dist(a,b), bl=SILQ.getBondLength(a.element,b.element);
        if (d<=bl*1.6&&d>bl*1.15) { a.dom.classList.add('near-bond'); b.dom.classList.add('near-bond'); }
      }
    }
  };

  /* ===================================================================
     19. MAR DE ELÉTRONS (ligação metálica)
     =================================================================== */
  SILQ.updateElectronSea = function updateElectronSea() {
    const mIds=new Set();
    SILQ.bonds.filter(b=>b.type==='metallic').forEach(b=>{mIds.add(b.a);mIds.add(b.b);});
    const mAtoms=SILQ.canvasAtoms.filter(a=>mIds.has(a.id));
    if (!mAtoms.length) { SILQ.seaElectrons.forEach(e=>{gsap.killTweensOf(e);e.remove();}); SILQ.seaElectrons=[]; return; }
    const xs=mAtoms.map(a=>a.x), ys=mAtoms.map(a=>a.y);
    const mnX=Math.min(...xs)-50, mxX=Math.max(...xs)+50, mnY=Math.min(...ys)-50, mxY=Math.max(...ys)+50;
    const desired=Math.min(mAtoms.length*3,18);
    while (SILQ.seaElectrons.length<desired) { const e=document.createElement('div'); e.className='sea-electron'; SILQ.canvas.appendChild(e); SILQ.seaElectrons.push(e); SILQ.animateSea(e,mnX,mxX,mnY,mxY); }
    while (SILQ.seaElectrons.length>desired) { const e=SILQ.seaElectrons.pop(); gsap.killTweensOf(e); e.remove(); }
  };

  SILQ.animateSea = function animateSea(e,mnX,mxX,mnY,mxY) {
    if (SILQ.prefersReducedMotion) {
      /* A11Y: posiciona elétron de forma estática, sem animação */
      gsap.set(e,{xPercent:-50,yPercent:-50,x:mnX+Math.random()*(mxX-mnX),y:mnY+Math.random()*(mxY-mnY)});
      return;
    }
    const go=()=>gsap.to(e,{x:mnX+Math.random()*(mxX-mnX),y:mnY+Math.random()*(mxY-mnY),duration:.8+Math.random()*1.4,ease:'sine.inOut',onComplete:go});
    gsap.set(e,{xPercent:-50,yPercent:-50,x:mnX+Math.random()*(mxX-mnX),y:mnY+Math.random()*(mxY-mnY)});
    go();
  };
});


