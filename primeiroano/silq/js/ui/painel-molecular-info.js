/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: painel-molecular-info.js
   ───────────────────────────────────────────────────────────────
   Painel "fórmula + estatísticas" da molécula atual (updateMolPanel)
   e o painel de informação/análise com a descrição textual de cada
   ligação e seus rótulos de carga parcial (δ+/δ-).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, core/fisica-quimica-utils.js,
               js/molecules/estereoquimica.js (getMoleculeKey).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     20. PAINEL MOLECULAR (fórmula + estatísticas)
     =================================================================== */
  SILQ.updateMolPanel = function updateMolPanel() {
    if (!SILQ.molPanel) return;
    if (SILQ.canvasAtoms.length === 0) { SILQ.molPanel.style.display='none'; return; }
    SILQ.molPanel.style.display='block';

    // Fórmula molecular simplificada (Hill: C primeiro, H segundo, resto alfabético)
    const counts={};
    SILQ.canvasAtoms.forEach(a=>{ counts[a.element]=(counts[a.element]||0)+1; });
    const order=['C','H',...Object.keys(counts).filter(k=>k!=='C'&&k!=='H').sort()];
    const formula=order.filter(k=>counts[k]).map(k=>counts[k]>1?`${k}<sub>${counts[k]}</sub>`:k).join('');
    SILQ.molFormula.innerHTML = formula || '—';

    // Estatísticas por tipo
    const bCov  = SILQ.bonds.filter(b=>b.type==='covalent').length;
    const bIon  = SILQ.bonds.filter(b=>b.type==='ionic').length;
    const bMet  = SILQ.bonds.filter(b=>b.type==='metallic').length;
    const totalEN = SILQ.canvasAtoms.reduce((s,a)=>s+(ELEMENTS[a.element].en||0),0);
    const avgEN   = SILQ.canvasAtoms.length ? (totalEN/SILQ.canvasAtoms.length).toFixed(2) : '—';

    // Dipolo total estimado (soma vetorial simples)
    let dipX=0, dipY=0;
    SILQ.bonds.filter(b=>b.type==='covalent').forEach(bond=>{
      const a=SILQ.canvasAtoms.find(at=>at.id===bond.a), b2=SILQ.canvasAtoms.find(at=>at.id===bond.b);
      if (!a||!b2) return;
      const enA=ELEMENTS[a.element].en||1, enB=ELEMENTS[b2.element].en||1;
      const dEN=enB-enA, len=SILQ.dist(a,b2)||1;
      dipX += dEN*(b2.x-a.x)/len; dipY += dEN*(b2.y-a.y)/len;
    });
    const dipMag=Math.hypot(dipX,dipY).toFixed(2);
    const polar = parseFloat(dipMag) > 0.3 ? `<span style="color:#fbbf24">polar (μ≈${dipMag})</span>` : `<span style="color:#6ee7b7">apolar</span>`;

    // Geometrias VSEPR de todos os centros ativos
    const geoLines = [];
    SILQ.canvasAtoms.forEach(at => {
      const v = SILQ.getVSEPR(at);
      if (v) geoLines.push(`${at.element}: <b>${v.name}</b>`);
    });

    SILQ.molStats.innerHTML = [
      `<span><svg class="icon" aria-hidden="true"><use href="#ic-atom"/></svg> Átomos: <b>${SILQ.canvasAtoms.length}</b></span>`,
      bCov  ? `<span><svg class="icon" aria-hidden="true"><use href="#ic-link"/></svg> Cov: <b>${bCov}</b></span>` : '',
      bIon  ? `<span><svg class="icon" aria-hidden="true"><use href="#ic-bolt"/></svg> Iôn: <b>${bIon}</b></span>` : '',
      bMet  ? `<span><svg class="icon" aria-hidden="true"><use href="#ic-magnet"/></svg> Met: <b>${bMet}</b></span>` : '',
      `<span>EN médio: <b>${avgEN}</b></span>`,
      SILQ.canvasAtoms.length>1 ? `<span>Dipolo: ${polar}</span>` : '',
    ].filter(Boolean).join('');

    if (geoLines.length) {
      SILQ.molStats.innerHTML += `<div style="width:100%;margin-top:4px;padding-top:4px;border-top:1px solid #2a3142;font-size:.65rem;color:#94a3b8;"><svg class="icon" aria-hidden="true"><use href="#ic-angle"/></svg> Geometrias: ${geoLines.join(' &nbsp;|&nbsp; ')}</div>`;
    }

    // Nota de estereoquímica (se disponível no banco)
    const stereoNote = (typeof SILQ.getStereochemistryNote === 'function')
      ? SILQ.getStereochemistryNote(SILQ.getMoleculeKey()) : null;
    if (stereoNote) {
      SILQ.molStats.innerHTML += `
        <div class="stereo-note" style="
          width:100%;margin-top:6px;padding:6px 8px;
          border-top:1px solid #2a3142;border-left:3px solid #a78bfa;
          border-radius:0 6px 6px 0;background:rgba(167,139,250,.07);
          font-size:.65rem;color:#c4b5fd;line-height:1.55;">
          <svg class="icon" aria-hidden="true"><use href="#ic-microscope"/></svg> <strong>Estereoquímica:</strong> ${stereoNote}
        </div>`;
    }
  };

  /* ===================================================================
     21. PAINEL DE INFORMAÇÃO
     =================================================================== */
  SILQ.updateChargeLabels = function updateChargeLabels() {
    SILQ.canvasAtoms.forEach(a=>{ const l=a.dom.querySelector('.charge-label'); if(l) l.textContent=SILQ.formatCharge(a.charge); });
  };

  SILQ.describeBond = function describeBond(bond, a, b) {
    if (!a || !b) return '';
    const enA=ELEMENTS[a.element].en||1, enB=ELEMENTS[b.element].en||1;
    const dEN=Math.abs(enA-enB).toFixed(2);
    const sub = bond.subtype || bond.type;
    const bd  = BOND_DATA[sub] || BOND_DATA[bond.type] || {};
    const iupacNote = `<span class="iupac-note"><svg class="icon" aria-hidden="true"><use href="#ic-book"/></svg> <strong>IUPAC</strong>: ligação química existe quando forças entre átomos formam agregado estável o suficiente para ser uma espécie independente. A fronteira iônica/covalente é um contínuo — não uma divisão absoluta.</span>`;

    // Cabeçalho rico para qualquer tipo
    function richHeader(bd, extra='') {
      return `<div class="bond-card">
        <div class="bond-card-title"><svg class="icon" aria-hidden="true"><use href="#ic-${bd.icon||'microscope'}"/></svg> ${bd.label||sub}</div>
        <div class="bond-card-pair">${a.element} '—' ${b.element} &nbsp;|&nbsp; ΔEN = ${dEN}</div>
        <div class="bond-card-grid">
          <span><svg class="icon" aria-hidden="true"><use href="#ic-bolt"/></svg> Energia: <b>${bd.energy||'—'}</b></span>
          <span><svg class="icon" aria-hidden="true"><use href="#ic-ruler"/></svg> Comprimento: <b>${bd.length||'—'}</b></span>
          <span><svg class="icon" aria-hidden="true"><use href="#ic-shuffle"/></svg> Natureza: <b>${bd.nature||'—'}</b></span>
          <span><svg class="icon" aria-hidden="true"><use href="#ic-flask"/></svg> Ex: <b>${bd.examples||'—'}</b></span>
        </div>
        <div class="bond-card-desc">${bd.desc||''}</div>
        ${extra}
      </div>`;
    }

    if (bond.type==='ionic') {
      const d=SILQ.canvasAtoms.find(at=>at.id===bond.donor), ac=SILQ.canvasAtoms.find(at=>at.id===bond.acceptor);

      /* Capacidade restante de cada íon */
      const capDonor    = d  ? SILQ.ionicCapacity(d.element)  : 0;
      const capAcceptor = ac ? SILQ.ionicCapacity(ac.element) : 0;
      const usedDonor   = d  ? SILQ.ionicBondCount(d.id)      : 0;
      const usedAcceptor= ac ? SILQ.ionicBondCount(ac.id)     : 0;
      const remDonor    = Math.max(0, capDonor    - usedDonor);
      const remAcceptor = Math.max(0, capAcceptor - usedAcceptor);

      const xtraIon = d && ac
        ? `<div class="bond-transfer">${ELEMENTS[d.element].name} → ${bond.transferred||1}e⁻ → ${ELEMENTS[ac.element].name}: <b>${d.element}${SILQ.formatCharge(d.charge)}</b> + <b>${ac.element}${SILQ.formatCharge(ac.charge)}</b></div>
           <div class="bond-ionic-capacity">
             <span><svg class="icon" aria-hidden="true"><use href="#ic-retort"/></svg> ${d.element}: ${usedDonor}/${capDonor} ligações usadas${remDonor===0?' <b style="color:#ef4444">— saturado</b>':''}</span>
             <span><svg class="icon" aria-hidden="true"><use href="#ic-retort"/></svg> ${ac.element}: ${usedAcceptor}/${capAcceptor} ligações usadas${remAcceptor===0?' <b style="color:#ef4444">— saturado</b>':''}</span>
           </div>` : '';
      return richHeader(BOND_DATA.ionic, xtraIon) + iupacNote;
    }

    if (bond.type==='covalent') {
      const orderNames={1:'Simples — 1 par σ',2:'Dupla — σ + π',3:'Tripla — σ + 2π'};
      const datKey = sub==='covalent_polar' ? 'covalent_polar' :
                     sub==='covalent_transition' ? 'covalent_transition' : 'covalent_nonpolar';
      const extra = `<div class="bond-order-tag">Ordem: <b>${orderNames[bond.order]||bond.order}</b></div>`
                  + (bond.polarNote ? `<div class="bond-polar-note">${bond.polarNote}</div>` : '');
      return richHeader(BOND_DATA[datKey]||BOND_DATA.covalent_nonpolar, extra) + iupacNote;
    }

    if (bond.type==='metallic') return richHeader(BOND_DATA.metallic) + iupacNote;

    return `<b>${sub||bond.type}</b> — ${a.element}–${b.element}`;
  };

  SILQ.updateInfoPanel = function updateInfoPanel(bond, a, b) {
    SILQ.infoText.innerHTML = SILQ.describeBond(bond, a, b);
    // Detecta e exibe geometria VSEPR do átomo central (o que tem mais ligações)
    const candidates = [a, b].filter(at => {
      const myBonds = SILQ.bonds.filter(bx => bx.type==='covalent' && (bx.a===at.id||bx.b===at.id));
      return myBonds.length >= 2;
    });
    if (candidates.length > 0) {
      const central = candidates.sort((x,y)=>
        SILQ.bonds.filter(bx=>bx.type==='covalent'&&(bx.a===y.id||bx.b===y.id)).length -
        SILQ.bonds.filter(bx=>bx.type==='covalent'&&(bx.a===x.id||bx.b===x.id)).length
      )[0];
      const vsepr = SILQ.getVSEPR(central);
      if (vsepr) {
        const { nBonds, nLone, name } = vsepr;
        SILQ.infoText.innerHTML += `<span class="iupac-note"><svg class="icon" aria-hidden="true"><use href="#ic-angle"/></svg> <strong>Geometria VSEPR (${central.element})</strong>: ${nBonds} ligante(s) + ${nLone} par(es) solitário(s) → <strong>${name}</strong>. Motor aplica forças angulares para convergir ao ângulo de equilíbrio.</span>`;
      }
    }
  };
});


