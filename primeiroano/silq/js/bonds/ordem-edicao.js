/* ═══════════════════════════════════════════════════════════════
   CAMADA: LIGAÇÕES
   ARQUIVO: ordem-edicao.js
   ───────────────────────────────────────────────────────────────
   Modo de edição individual de ligação: clicar numa ligação no
   canvas para selecioná-la e trocar sua ordem (simples/dupla/tripla)
   pelos botões dedicados, com validação de capacidade iônica e
   avisos quando a troca não é quimicamente possível.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, core/fisica-quimica-utils.js,
               js/bonds/logica-ligacoes.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     13. SELETOR DE ORDEM DE LIGAÇÃO — MODO INDIVIDUAL

     Dois modos:
     • Auto (padrão): novas ligações usam octeto/VSEPR
     • Editar Ligação: clique sobre uma linha de ligação no canvas para
       selecionar — ela fica destacada e os botões 1/2/3 alteram só ela.
     =================================================================== */
  SILQ.forcedBondOrder  = null;   // null = auto para novas ligações

  SILQ.selectedBond     = null;   // bond object atualmente selecionado

  SILQ.bondEditMode     = false;  // true = modo de clique nas linhas

  /* --- Coleta o bond mais próximo de um ponto (x,y) no canvas --- */
  SILQ.getBondNear = function getBondNear(x, y, threshold = 20) {
    let closest = null, minDist = threshold;
    // Inclui tanto covalentes quanto não-covalentes
    SILQ.bonds.filter(b => b.type === 'covalent').forEach(bond => {
      const a  = SILQ.canvasAtoms.find(at => at.id === bond.a);
      const b2 = SILQ.canvasAtoms.find(at => at.id === bond.b);
      if (!a || !b2) return;
      // Distância de ponto a segmento de reta
      const dx = b2.x - a.x, dy = b2.y - a.y;
      const len2 = dx*dx + dy*dy;
      if (len2 === 0) return;
      const t = Math.max(0, Math.min(1, ((x - a.x)*dx + (y - a.y)*dy) / len2));
      const px = a.x + t*dx - x, py = a.y + t*dy - y;
      const d = Math.hypot(px, py);
      if (d < minDist) { minDist = d; closest = bond; }
    });
    return closest;
  };

  /* --- Seleciona uma ligação e destaca visualmente --- */
  SILQ.selectBond = function selectBond(bond) {
    SILQ.selectedBond = bond;
    SILQ.updateBondLines(); // redesenha com highlight
    if (bond) {
      const a = SILQ.canvasAtoms.find(at => at.id === bond.a);
      const b = SILQ.canvasAtoms.find(at => at.id === bond.b);
      if (a && b) SILQ.updateInfoPanel(bond, a, b);
    }
    // Atualiza botões de ordem — não-covalentes não têm ordem alterável
    const isCov = bond && bond.type === 'covalent';
    document.querySelectorAll('.bond-order-btn[data-order]').forEach(btn => {
      const v = btn.dataset.order;
      if (v === 'auto') {
        btn.classList.toggle('active-order', !bond);
      } else {
        btn.classList.toggle('active-order', isCov && bond.order === parseInt(v));
      }

    });
    // Mostra dica específica para não-covalentes
    const hint = document.getElementById('bond-edit-hint');
    if (hint) {
      if (bond) {
        hint.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> Ligação selecionada: <strong>${BOND_DATA[bond.subtype]?.label || 'covalente'}</strong>. Escolha a ordem acima.`;
        hint.style.borderColor = 'rgba(41,182,246,.25)';
        hint.style.color = '#94a3b8';
      } else {
        hint.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-point"/></svg> Clique sobre uma ligação no canvas para selecioná-la, depois escolha a ordem acima.';
        hint.style.borderColor = 'rgba(41,182,246,.25)';
        hint.style.color = '#94a3b8';
      }
    }
  };

  /* --- Ativa/desativa modo de edição de ligação --- */
  SILQ.toggleBondEditMode = function toggleBondEditMode() {
    SILQ.bondEditMode = !SILQ.bondEditMode;
    const btn     = document.getElementById('btn-bond-edit');
    const hint    = document.getElementById('bond-edit-hint');
    const overlay = document.getElementById('bond-edit-overlay');
    if (!btn) return;
    if (SILQ.bondEditMode) {
      btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> Clique na liga\u00e7\u00e3o para editar';
      btn.classList.replace('btn-outline-info', 'btn-info');
      SILQ.canvas.classList.add('bond-edit-mode');
      if (hint)    hint.style.display    = 'block';
      if (overlay) overlay.style.display = 'block';
      SILQ.selectedBond = null;
      SILQ.updateBondLines();
      SILQ.setToggleState(btn, true);
      SILQ.announce('Modo de edi\u00e7\u00e3o de liga\u00e7\u00e3o ativado. Clique sobre uma liga\u00e7\u00e3o no canvas para selecion\u00e1-la.', 'assertive');
    } else {
      btn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-pencil"/></svg> Editar Liga\u00e7\u00e3o';
      btn.classList.replace('btn-info', 'btn-outline-info');
      SILQ.canvas.classList.remove('bond-edit-mode');
      if (hint)    hint.style.display    = 'none';
      if (overlay) overlay.style.display = 'none';
      SILQ.selectedBond = null;
      SILQ.updateBondLines();
      SILQ.setToggleState(btn, false);
      SILQ.announce('Modo de edi\u00e7\u00e3o de liga\u00e7\u00e3o desativado.');
    }
  };

  document.getElementById('btn-bond-edit')?.addEventListener('click', SILQ.toggleBondEditMode);

  /* --- Overlay div captura cliques sobre o canvas em modo edição ---
     Fica em z-index alto, transparente, sobre tudo. Converte as
     coordenadas do clique para o espaço do canvas e chama getBondNear. */
  SILQ.bondOverlay = document.getElementById('bond-edit-overlay');

  if (SILQ.bondOverlay) {
    SILQ.bondOverlay.addEventListener('click', e => {
      if (!SILQ.bondEditMode) return;
      const rect = SILQ.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = SILQ.getBondNear(x, y, 22);
      SILQ.selectBond(hit ?? null);
    });
  }

  /* --- Aplica ordem a UMA ligação específica ou a todas --- */
  SILQ.applyBondOrder = function applyBondOrder(order) {
    SILQ.forcedBondOrder = order;

    if (SILQ.selectedBond && SILQ.bondEditMode) {
      // Modo individual: altera só a ligação selecionada
      const a = SILQ.canvasAtoms.find(at => at.id === SILQ.selectedBond.a);
      const b = SILQ.canvasAtoms.find(at => at.id === SILQ.selectedBond.b);
      if (a && b && SILQ.selectedBond.type === 'covalent') {
        const rA = SILQ.covalentCap(a.element) - (SILQ.bondOrderSum(a.id) - SILQ.selectedBond.order);
        const rB = SILQ.covalentCap(b.element) - (SILQ.bondOrderSum(b.id) - SILQ.selectedBond.order);
        const maxPossible = Math.max(1, Math.min(rA, rB, 3));
        if (order !== null && order > maxPossible) {
          SILQ.showBondOrderWarning(a.element, b.element, order, maxPossible);
          SILQ.selectedBond.order = maxPossible;
        } else if (order !== null) {
          SILQ.selectedBond.order = order;
        } else {
          SILQ.selectedBond.order = Math.max(1, Math.min(rA, rB, 3));
        }
        SILQ.selectBond(SILQ.selectedBond); // mantém seleção e atualiza botões
      }
    } else {
      // Modo global: aplica a todas as ligações covalentes
      SILQ.bonds.filter(b => b.type === 'covalent').forEach(bond => {
        const a = SILQ.canvasAtoms.find(at => at.id === bond.a);
        const b = SILQ.canvasAtoms.find(at => at.id === bond.b);
        if (!a || !b) return;
        const rA = SILQ.covalentCap(a.element) - (SILQ.bondOrderSum(a.id) - bond.order);
        const rB = SILQ.covalentCap(b.element) - (SILQ.bondOrderSum(b.id) - bond.order);
        const maxPossible = Math.max(1, Math.min(rA, rB, 3));
        if (order !== null) {
          if (order <= maxPossible) { bond.order = order; }
          else { SILQ.showBondOrderWarning(a.element, b.element, order, maxPossible); bond.order = maxPossible; }
        } else {
          bond.order = maxPossible;
        }
      });
    }

    SILQ.updateBondLines();
    SILQ.updateMolPanel();
    // Atualiza painel de info
    const ref = SILQ.selectedBond || SILQ.bonds.find(b => b.type === 'covalent');
    if (ref) {
      const atA = SILQ.canvasAtoms.find(a => a.id === ref.a);
      const atB = SILQ.canvasAtoms.find(a => a.id === ref.b);
      if (atA && atB) SILQ.updateInfoPanel(ref, atA, atB);
    }
  };

  // Alias para compatibilidade com listener da inicialização
  SILQ.setBondOrder = function setBondOrder(order) { SILQ.applyBondOrder(order); };

  SILQ.showBondOrderWarning = function showBondOrderWarning(symA, symB, requested, allowed) {
    const warn = document.getElementById('bond-order-warning');
    if (!warn) return;
    const names = {1:'simples',2:'dupla',3:'tripla'};
    warn.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#ic-warning"/></svg> ${symA}–${symB}: ligação ${names[requested]} excede o octeto. Máximo: ${names[allowed]||allowed}.`;
    warn.style.display = 'block';
    clearTimeout(warn._t);
    warn._t = setTimeout(() => { warn.style.display='none'; }, 3500);
  };

  /* Exibe aviso quando a capacidade iônica de um átomo está esgotada */
  SILQ.showIonicCapacityWarning = function showIonicCapacityWarning(sym, cap) {
    const warn = document.getElementById('bond-order-warning');
    const el   = ELEMENTS[sym];
    if (!warn || !el) return;
    const chargeStr = SILQ.isMetal(el.category) ? `+${cap}` : `−${cap}`;
    warn.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#ic-warning"/></svg> ${sym} já atingiu sua capacidade iônica máxima (${chargeStr}). Não é possível formar mais ligações iônicas com este átomo.`;
    warn.style.display = 'block';
    clearTimeout(warn._t);
    warn._t = setTimeout(() => { warn.style.display='none'; }, 4000);
    SILQ.announce(`${el.name} já atingiu capacidade iônica máxima ${chargeStr}.`, 'assertive');
  };
});


