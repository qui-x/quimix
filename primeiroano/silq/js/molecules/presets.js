/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLÉCULAS
   ARQUIVO: presets.js
   ───────────────────────────────────────────────────────────────
   O painel "Moléculas Prontas": monta uma molécula pré-definida no
   canvas com um clique (mountPreset), constrói a grade de cartões
   com busca/filtro por categoria (buildMolPresets), o mini-diagrama
   SVG de cada cartão (buildPresetMiniSVG) e a inicialização do
   painel inteiro (initMolPresets).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/*, data/moleculas-prontas.js,
               js/atoms/atomos.js (addAtom), js/bonds/logica-ligacoes.js
               (formBond).
   Usado por: js/init/inicializacao-final.js (chama initMolPresets()).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     28. PAINEL DE MOLÉCULAS PRÉ-MONTADAS
     ===================================================================
     Cada entrada define:
       formula   : fórmula Hill (exibida no card)
       name      : nome IUPAC / comum
       category  : 'inorganic'|'organic'|'acid'|'base'|'halide'|'noble'
       geometry  : string descritiva
       color     : cor de destaque do card (tema da categoria)
       atoms     : [ {el, x, y} ] — posições NORMALIZADAS (centro em 0,0),
                   em unidades de 'raio de ligação', escala ~60px por unidade.
                   O sistema escalona para o canvas em tempo de montagem.
       bonds     : [ {a, b, order} ] — índices em atoms[], ordem covalente
     =================================================================== */

  /* MOL_PRESETS: movido para dadossilq.js (carregado antes deste arquivo) */

  /* ── Monta uma molécula pré-definida no canvas ──────────────────── */
  SILQ.mountPreset = function mountPreset(preset) {
    // 1. Para física e limpa canvas
    SILQ.stopSimLoop();
    SILQ.frozenGeometry = false; // garante reset limpo antes de remontar
    SILQ.canvasAtoms.forEach(a => {
      gsap.killTweensOf(a.orbitDom);
      a.dom.remove(); a.orbitDom.remove();
      if (a.dipoleDom) a.dipoleDom.remove();
    });
    SILQ.seaElectrons.forEach(e => { gsap.killTweensOf(e); e.remove(); });
    SILQ.canvasAtoms = []; SILQ.bonds = []; SILQ.seaElectrons = [];
    SILQ.svgEl.innerHTML = '';
    SILQ.canvasHint.classList.remove('hidden');
    if (SILQ.molPanel) SILQ.molPanel.style.display = 'none';

    // 2. Centro do canvas
    const rect = SILQ.canvas.getBoundingClientRect();
    const cx = rect.width  / 2;
    const cy = rect.height / 2;

    /* Escala: usa o comprimento médio de ligação real do preset para
       converter coordenadas normalizadas em pixels.
       getBondLength(A,B) = (radA + radB) * SCALE (em pixels).
       As coordenadas do preset estão em unidades onde 1.0 = 1 comprimento
       de ligação típico (~100–130px). Usamos 90px/unidade como base neutra
       e depois escalamos para caber no canvas sem ultrapassar 75% da largura. */
    const RAW_SCALE = 90; // px por unidade de coord do preset
    // Bounding box das coords do preset
    const xs = preset.atoms.map(a => a.x);
    const ys = preset.atoms.map(a => a.y);
    const spanX = Math.max(0.1, Math.max(...xs) - Math.min(...xs));
    const spanY = Math.max(0.1, Math.max(...ys) - Math.min(...ys));
    const maxSpan = Math.max(spanX, spanY);
    const maxAllowed = Math.min(rect.width, rect.height) * 0.65;
    const SCALE_PX = Math.min(RAW_SCALE, maxAllowed / maxSpan);

    // 3. Cria átomos nas posições exatas do preset
    const atomObjs = preset.atoms.map(({el, x, y}) => {
      const px = cx + x * SCALE_PX;
      const py = cy + y * SCALE_PX;
      const atom = { id: 'atom_' + (SILQ.idCounter++), element: el, x: px, y: py, charge: 0 };
      SILQ.initPhysics(atom);
      SILQ.canvasAtoms.push(atom);
      SILQ.renderAtom(atom);
      return atom;
    });

    SILQ.canvasHint.classList.add('hidden');

    // 4. Cria ligações diretamente (bypassa checkAllBonds por distância)
    preset.bonds.forEach(({a, b, order}) => {
      const atA = atomObjs[a], atB = atomObjs[b];
      if (!atA || !atB) return;
      const {type, subtype, polarNote} = SILQ.determineBondType(atA.element, atB.element);
      const bond = { a: atA.id, b: atB.id, type, subtype, order: order || 1, polarNote };
      if (type === 'ionic') {
        const aIsM = SILQ.isMetal(ELEMENTS[atA.element].category);
        const donor = aIsM ? atA : atB, acceptor = donor === atA ? atB : atA;
        const dMax = SILQ.maxIonicCharge(donor.element), aMax = SILQ.maxIonicCharge(acceptor.element);
        if ((donor.charge||0) < dMax && (acceptor.charge||0) > aMax) {
          donor.charge = (donor.charge||0) + 1;
          acceptor.charge = (acceptor.charge||0) - 1;
          bond.transferred = 1;
        } else { bond.transferred = 0; }
        bond.donor = donor.id; bond.acceptor = acceptor.id;
      }
      SILQ.bonds.push(bond);
    });

    // 5. Renderiza tudo
    SILQ.updateBondLines();
    SILQ.updateGlow();
    SILQ.updateDipoles();
    SILQ.updateChargeLabels();
    SILQ.updateEnergyChart();
    SILQ.updateMolPanel();

    // 6. TRAVA a física: inicia o loop (para animações visuais) mas
    //    com frozenGeometry=true o tick não move nenhum átomo.
    SILQ.frozenGeometry = true;
    SILQ.physicsEnabled = true;
    SILQ.startSimLoop();

    // Atualiza botão de freeze
    const btnFrz = document.getElementById('btn-freeze-geo');
    if (btnFrz) {
      btnFrz.classList.add('active-a11y');
      btnFrz.setAttribute('aria-pressed','true');
      btnFrz.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-lock"/></svg> Geometria Travada';
    }
    // Atualiza botão de física (visualmente continua "ativo")
    if (SILQ.btnPhysics) {
      SILQ.btnPhysics.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-pause"/></svg> Pausar Física';
      SILQ.btnPhysics.classList.remove('btn-outline-warning');
      SILQ.btnPhysics.classList.add('btn-warning');
    }

    SILQ.announce(`${preset.name} montado com geometria travada — ${preset.geometry}. Arraste um átomo para liberar a física.`);
  };

  /* ── Constrói o grid de cards de moléculas ── */
  SILQ.buildMolPresets = function buildMolPresets(filter = 'all', search = '') {
    const grid = document.getElementById('mol-preset-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const q = search.toLowerCase().trim();
    const filtered = MOL_PRESETS.filter(m => {
      const catOk = filter === 'all' || m.category === filter;
      const searchOk = !q
        || m.formula.toLowerCase().includes(q)
        || m.name.toLowerCase().includes(q)
        || m.geometry.toLowerCase().includes(q);
      return catOk && searchOk;
    });

    /* Atualiza o badge com a contagem atual (total ou filtrada) */
    const badge = document.getElementById('badge-mol');
    if (badge) {
      const total = MOL_PRESETS.length;
      if (!q && filter === 'all') {
        badge.textContent = total;
        badge.setAttribute('aria-label', `${total} moléculas disponíveis`);
      } else {
        badge.textContent = `${filtered.length}/${total}`;
        badge.setAttribute('aria-label', `${filtered.length} de ${total} moléculas`);
      }
    }

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="mol-preset-empty">Nenhuma molécula encontrada.</div>';
      return;
    }

    filtered.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'mol-preset-card';
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label',
        `${preset.name}, fórmula ${preset.formula}, geometria ${preset.geometry}. Pressione Enter para montar.`
      );
      card.title = `${preset.name} — ${preset.geometry}`;

      // Mini-diagrama SVG do card
      const svg = SILQ.buildPresetMiniSVG(preset);

      card.innerHTML = `
        ${svg}
        <div class="mol-card-formula">${preset.formula}</div>
        <div class="mol-card-name">${preset.name}</div>
        <div class="mol-card-geo">${preset.geometry}</div>
      `;

      card.addEventListener('click', () => SILQ.mountPreset(preset));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); SILQ.mountPreset(preset); }
      });

      grid.appendChild(card);
    });
  };

  /* ── Gera um mini-SVG representando a estrutura da molécula ── */
  SILQ.buildPresetMiniSVG = function buildPresetMiniSVG(preset) {
    const W = 52, H = 36;
    // Encontra bounding box das coordenadas
    const xs = preset.atoms.map(a => a.x);
    const ys = preset.atoms.map(a => a.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const spanX = (maxX - minX) || 1, spanY = (maxY - minY) || 1;
    const pad = 8;
    const scale = Math.min((W - pad*2) / spanX, (H - pad*2) / spanY);

    function px(x) { return pad + (x - minX) * scale + (W - pad*2 - spanX*scale)/2; }
    function py(y) { return pad + (y - minY) * scale + (H - pad*2 - spanY*scale)/2; }

    const ATOM_COLORS = {
      H:'#dbeafe',C:'#6b7280',N:'#6366f1',O:'#ef4444',F:'#22c55e',
      Cl:'#16a34a',S:'#eab308',P:'#f97316',Na:'#dc2626',K:'#b91c1c',
      Ca:'#ec4899',Mg:'#f97316',Al:'#94a3b8',Si:'#0d9488',Be:'#fb923c',
      Xe:'#7dd3fc',Kr:'#7dd3fc',B:'#2dd4bf',
    };

    let lines = '';
    preset.bonds.forEach(({a,b,order}) => {
      const aPos = preset.atoms[a], bPos = preset.atoms[b];
      const x1 = px(aPos.x), y1 = py(aPos.y), x2 = px(bPos.x), y2 = py(bPos.y);
      const dx = x2-x1, dy = y2-y1, len = Math.hypot(dx,dy)||1;
      const perpX = -dy/len, perpY = dx/len;
      const offsets = order===1?[0]: order===2?[-1.5,1.5]:[-2.5,0,2.5];
      offsets.forEach(off => {
        lines += `<line x1="${(x1+perpX*off).toFixed(1)}" y1="${(y1+perpY*off).toFixed(1)}" x2="${(x2+perpX*off).toFixed(1)}" y2="${(y2+perpY*off).toFixed(1)}" stroke="#4fc3f7" stroke-width="1.2" stroke-linecap="round"/>`;
      });
    });

    let circles = '';
    preset.atoms.forEach(({el, x, y}) => {
      const cx2 = px(x), cy2 = py(y);
      const col = ATOM_COLORS[el] || '#94a3b8';
      const r = el === 'H' ? 3.5 : 5;
      circles += `<circle cx="${cx2.toFixed(1)}" cy="${cy2.toFixed(1)}" r="${r}" fill="${col}" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>`;
      if (el !== 'H') {
        circles += `<text x="${cx2.toFixed(1)}" y="${(cy2+0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="4.5" font-weight="bold" fill="white" font-family="sans-serif">${el}</text>`;
      }
    });

    return `<svg class="mol-card-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${lines}${circles}</svg>`;
  };

  /* ── Inicializa o painel e seus controles ── */
  SILQ.initMolPresets = function initMolPresets() {
    let activeCat = 'all';
    SILQ.buildMolPresets('all', '');

    // Abas de categoria
    document.querySelectorAll('.mol-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCat = btn.dataset.cat;
        document.querySelectorAll('.mol-cat-btn').forEach(b => {
          b.classList.toggle('active-cat', b === btn);
          b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
        });
        SILQ.buildMolPresets(activeCat, document.getElementById('mol-preset-search')?.value || '');
      });
    });

    // Busca
    document.getElementById('mol-preset-search')?.addEventListener('input', e => {
      SILQ.buildMolPresets(activeCat, e.target.value);
    });
  };
});


