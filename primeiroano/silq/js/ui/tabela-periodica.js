/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: tabela-periodica.js
   ───────────────────────────────────────────────────────────────
   Monta as 118 células da tabela periódica (clicar/Enter adiciona um
   átomo do elemento ao canvas), o esmaecimento por categoria
   selecionada, o tooltip ao passar o mouse, a legenda de categorias
   com filtro clicável, e a busca por nome/símbolo/número
   (applyFilters).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/*, data/tabela-elementos.js,
               data/layout-tabela-periodica.js, js/atoms/atomos.js
               (addAtom).
   Usado por: js/init/inicializacao-final.js (chama
              buildPeriodicTable() e buildLegend()).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ── Atualiza o dimming da tabela periódica baseado no modo de ligação ativo ──
     Elementos que não podem participar do tipo de ligação ativo ficam
     marcados com uma classe 'bond-blocked' e tooltip de explicação.        */
  SILQ.refreshTableDimming = function refreshTableDimming() {
    document.querySelectorAll('.pt-cell[data-symbol]').forEach(cell => {
      const sym = cell.dataset.symbol;
      if (!sym || !ELEMENTS[sym]) return;

      cell.classList.remove('bond-blocked', 'bond-incompatible');

      if (!SILQ.activeBondFilter) return; // sem filtro: sem dimming

      let compatible = false;
      if (SILQ.activeBondFilter === 'metallic') {
        compatible = SILQ.METALLIC_CAPABLE.has(sym);
      } else if (SILQ.activeBondFilter === 'ionic') {
        // Pode participar de ligação iônica como doador ou receptor
        const cat = ELEMENTS[sym].category;
        const isHydrideCompatible = (sym === 'H') || SILQ.IONIC_HYDRIDE_METALS.has(sym);
        compatible = !SILQ.NOBLE_NO_IONIC.has(sym) &&
                     !SILQ.NOBLE_NEVER.has(sym) &&
                     !SILQ.isMetalloid(cat) &&
                     (SILQ.isMetal(cat) || SILQ.isNonmetal(cat) || isHydrideCompatible);
      } else if (SILQ.activeBondFilter === 'covalent') {
        compatible = !SILQ.NOBLE_NEVER.has(sym) &&
                     !(SILQ.NOBLE_COVALENT_OK.has(sym) ? false : false); // Kr/Xe/Rn permitidos (com F/O)
        // Dois metais puros nunca fazem covalente entre si, mas cada um pode fazer com ametal
        // Na tabela, não há contexto de par, então mostramos todos exceto gases nobres leves
        if (SILQ.NOBLE_NEVER.has(sym)) compatible = false;
      }

      if (!compatible) {
        cell.classList.add('bond-incompatible');
        const oldLabel = cell.getAttribute('aria-label') || '';
        cell.dataset.savedLabel = oldLabel;
        const reason = SILQ.activeBondFilter === 'metallic'
          ? 'não é metal'
          : SILQ.activeBondFilter === 'ionic'
          ? 'não participa de ligações iônicas clássicas'
          : 'não forma ligações covalentes';
        cell.setAttribute('aria-label',
          `${ELEMENTS[sym].name} (${sym}) — ${reason} no modo ${SILQ.activeBondFilter}. ${oldLabel}`);
      } else if (cell.dataset.savedLabel) {
        cell.setAttribute('aria-label', cell.dataset.savedLabel);
        delete cell.dataset.savedLabel;
      }
    });
  };

  SILQ.buildPeriodicTable = function buildPeriodicTable() {
    SILQ.ptGrid.innerHTML = '';
    const placed = new Map();
    PT_GRID.forEach(([sym,col,row]) => placed.set(`${col},${row}`, sym));
    for (let row=1; row<=7; row++) {
      for (let col=1; col<=18; col++) {
        const sym = placed.get(`${col},${row}`);
        const isLant  = col===3&&row===6;
        const isActin = col===3&&row===7;
        if (!sym&&!isLant&&!isActin) {
          const sp=document.createElement('div'); sp.className='pt-spacer';
          sp.style.gridColumn=col; sp.style.gridRow=row; SILQ.ptGrid.appendChild(sp); continue;
        }
        const cell=document.createElement('div');
        cell.style.gridColumn=col; cell.style.gridRow=row;
        if (isLant||isActin) {
          cell.className='pt-cell';
          const mc=SILQ.themedElementColor(isLant?CATEGORY_INFO['lanthanide'].color:CATEGORY_INFO['actinide'].color);
          cell.style.backgroundColor=mc+'33'; cell.style.border=`1px solid ${mc}66`; cell.style.color=SILQ.getContrastColor(mc);
          cell.innerHTML=`<span class="c-sym" style="font-size:.6rem">${isLant?'57–71':'89–103'}</span>`;
          SILQ.ptGrid.appendChild(cell); continue;
        }
        SILQ.buildCell(cell, sym); SILQ.ptGrid.appendChild(cell);
      }
    }
    SILQ.fblockGrid.innerHTML='';
    FBLOCK.forEach(row => row.forEach(sym => {
      const cell=document.createElement('div'); SILQ.buildCell(cell,sym); SILQ.fblockGrid.appendChild(cell);
    }));
  };

  SILQ.buildCell = function buildCell(cell, sym) {
    const el=ELEMENTS[sym];
    const ci=CATEGORY_INFO[el.category]||{label:el.category};
    cell.className='pt-cell';
    cell.dataset.symbol=sym; cell.dataset.name=el.name.toLowerCase();
    cell.dataset.number=el.number; cell.dataset.category=el.category;
    cell.style.backgroundColor=SILQ.themedElementColor(el.color); cell.style.color=SILQ.getContrastColor(SILQ.themedElementColor(el.color));
    cell.innerHTML=`<span class="c-num" aria-hidden="true">${el.number}</span><span class="c-sym" aria-hidden="true">${sym}</span><span class="c-name" aria-hidden="true">${el.name}</span>`;

    /* A11Y: atributos de acessibilidade */
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label',
      `${el.name} (${sym}), n\u00famero at\u00f4mico ${el.number}, eletronegatividade ${el.en||'n/d'}, val\u00eancia ${el.valence}, ${ci.label}. Pressione Enter ou Espa\u00e7o para adicionar ao canvas.`
    );

    /* Adiciona \u00e1tomo por clique */
    function doAddAtom() {
      const rect=SILQ.canvas.getBoundingClientRect();
      const cx=rect.width/2+(Math.random()-.5)*200, cy=rect.height/2+(Math.random()-.5)*140;
      SILQ.addAtom(sym, Math.max(30,Math.min(rect.width-30,cx)), Math.max(30,Math.min(rect.height-30,cy)));
      cell.style.outline='2px solid #fff'; setTimeout(()=>cell.style.outline='',300);
      SILQ.announce(`${el.name} adicionado ao canvas.`);
    }

    cell.addEventListener('click', doAddAtom);

    /* A11Y: ativa por teclado (Enter e Espa\u00e7o) */
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        doAddAtom();
      }
    });

    cell.addEventListener('mouseenter', e=>SILQ.showTooltip(e,el));
    cell.addEventListener('mousemove',  e=>SILQ.moveTooltip(e));
    cell.addEventListener('mouseleave', ()=>SILQ.hideTooltip());

    /* A11Y: exibe info de foco via live region */
    cell.addEventListener('focus', () => {
      SILQ.announce(`${el.name}, s\u00edmbolo ${sym}, n\u00famero ${el.number}, ${ci.label}. EN: ${el.en||'n/d'}. Pressione Enter para adicionar.`);
    });
  };

  /* ===================================================================
     8. TOOLTIP
     =================================================================== */
  SILQ.showTooltip = function showTooltip(e, el) {
    const ci=CATEGORY_INFO[el.category]||{label:el.category};
    const enA=el.en||'n/d';
    SILQ.tooltip.innerHTML=`<strong>${el.symbol} — ${el.name}</strong><br>Nº: ${el.number} &nbsp;|&nbsp; EN: ${enA}<br>Valência: ${el.valence} &nbsp;|&nbsp; R: ${el.radius} pm<br><span class="tt-cat">${ci.label}</span>`;
    SILQ.tooltip.style.display='block'; SILQ.moveTooltip(e);
  };

  SILQ.moveTooltip = function moveTooltip(e) {
    let x=e.clientX+14, y=e.clientY-10;
    if (x+190>window.innerWidth) x=e.clientX-200;
    if (y+110>window.innerHeight) y=e.clientY-110;
    SILQ.tooltip.style.left=x+'px'; SILQ.tooltip.style.top=y+'px';
  };

  SILQ.hideTooltip = function hideTooltip() { SILQ.tooltip.style.display='none'; };

  /* ===================================================================
     9. BUSCA + FILTRO
     =================================================================== */
  SILQ.buildLegend = function buildLegend() {
    SILQ.ptLegend.innerHTML='';
    Object.entries(CATEGORY_INFO).forEach(([cat,ci])=>{
      const item=document.createElement('div');
      item.className='pt-legend-item';
      item.innerHTML=`<span class="pt-legend-dot" style="background:${SILQ.themedElementColor(ci.color)}" aria-hidden="true"></span>${ci.label}`;
      /* A11Y: torna o filtro de categoria acess\u00edvel por teclado */
      item.setAttribute('tabindex','0');
      item.setAttribute('role','button');
      item.setAttribute('aria-pressed','false');
      item.setAttribute('aria-label',`Filtrar por ${ci.label}`);

      function doFilter() {
        SILQ.toggleCategoryFilter(cat,item);
        const isActive = SILQ.activeCategoryFilter === cat;
        item.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        SILQ.announce(isActive ? `Filtrando por ${ci.label}.` : `Filtro ${ci.label} removido.`);
      }
      item.addEventListener('click', doFilter);
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doFilter(); }
      });
      SILQ.ptLegend.appendChild(item);
    });
  };

  /* CORREÇÃO DE ORDEM (ver README, seção "hoisting perdido"): no
     código original, "applyFilters" era uma `function` — e funções
     `function nome(){}` são "içadas" (hoisted) para o topo do escopo
     em JavaScript, então `searchInput.addEventListener('input',
     applyFilters)` já enxergava a função mesmo aparecendo ANTES dela
     no texto. Ao virar `SILQ.applyFilters = function(){}` (uma
     atribuição comum), esse hoisting deixa de existir — então a
     declaração precisa vir fisicamente antes do uso. Só a ORDEM
     mudou; o corpo de applyFilters é idêntico ao original. */
  SILQ.applyFilters = function applyFilters() {
    const q=SILQ.searchInput.value.toLowerCase().trim();
    document.querySelectorAll('.pt-cell[data-symbol]').forEach(cell=>{
      const match=(!q||(cell.dataset.symbol.toLowerCase().includes(q)||cell.dataset.name.includes(q)||cell.dataset.number.includes(q)))
                &&(!SILQ.activeCategoryFilter||cell.dataset.category===SILQ.activeCategoryFilter);
      cell.classList.toggle('dimmed',!match&&(!!q||!!SILQ.activeCategoryFilter));
      cell.classList.toggle('highlighted',match&&(!!q||!!SILQ.activeCategoryFilter));
      if (!q&&!SILQ.activeCategoryFilter) cell.classList.remove('dimmed','highlighted');
    });
  };

  SILQ.toggleCategoryFilter = function toggleCategoryFilter(cat, clicked) {
    SILQ.activeCategoryFilter = SILQ.activeCategoryFilter===cat ? null : cat;
    document.querySelectorAll('.pt-legend-item').forEach(i=>i.classList.toggle('dimmed',SILQ.activeCategoryFilter&&i!==clicked));
    if (!SILQ.activeCategoryFilter) document.querySelectorAll('.pt-legend-item').forEach(i=>i.classList.remove('dimmed'));
    SILQ.applyFilters();
  };

  SILQ.searchInput.addEventListener('input', SILQ.applyFilters);
});


