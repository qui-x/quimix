/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Tabela Periódica
   ARQUIVO: tabela-periodica.js
   ───────────────────────────────────────────────────────────────
   Constrói as 118 células da tabela (+ lantanídeos/actinídeos),
   aplica o esmaecimento histórico (elemento ainda não descoberto
   no ano do modelo ativo), navegação por teclado (setas) e
   seleção de elemento.
   Adiciona a AtomicApp.prototype: _buildPeriodicTable, _ptKeyNav,
   _selectElement.
   Depende de: app/atomic-app-core.js, core/dados.js (ELEMENTS,
               DISCOVERY_YEAR, MODEL_YEAR), core/cor.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Tabela Periódica ──────────────────────────────────────────
  AtomicApp.prototype._buildPeriodicTable = function(filter='') {
    const grid=document.getElementById('periodic-table');
    if (!grid) return;
    grid.innerHTML='';
    const q=filter.toLowerCase().trim();

    // Tabela principal: 7 períodos reais × 18 colunas (sem linha de
    // gap vazia — a antiga linha 8 "57-71" ocupava uma célula inteira
    // de altura igual às demais, criando uma faixa vazia grande que
    // não existe na referência visual real).
    const ROWS=7, COLS=18;
    const cells=Array.from({length:ROWS},()=>Array(COLS).fill(null));
    // Lantanídeos/Actinídeos: 15 colunas (Z 57-71 e 89-103), renderizados
    // como duas linhas SEPARADAS abaixo da tabela principal, com pequeno
    // espaçamento visual — não embutidas no grid de 18 colunas.
    const lanRow = Array(15).fill(null);
    const actRow = Array(15).fill(null);

    for (const el of ELEMENTS) {
      const[Z,sym,name,mass,cat,col,row]=el;
      if (row>=1 && row<=7) cells[row-1][col-1]=el;
      else if (cat==='lanthanide') lanRow[col-3]=el;
      else if (cat==='actinide')   actRow[col-3]=el;
    }

    let matchCount=0;
    this._ptFocusGrid=[]; // grade linear p/ navegação por teclado (inclui as 2 linhas extras)

    // Restrição histórica: elementos ainda não descobertos no ano do
    // modelo atômico atualmente selecionado ficam marcados como
    // "undiscovered" — visualmente esmaecidos e não clicáveis, mas
    // permanecem na grade (preserva a posição correta na tabela em
    // vez de criar buracos). Aplica-se à Tabela Periódica principal.
    const modelYear = MODEL_YEAR[this.sim.model] ?? 9999;

    const makeCell=(el,r,c)=>{
      if (!el) {
        const g=document.createElement('div'); g.className='pt-gap';
        g.setAttribute('aria-hidden','true');
        grid.appendChild(g);
        this._ptFocusGrid.push(null);
        return;
      }
      const[Z,sym,name,mass,cat,,,,color]=el;
      const isUndiscovered = (DISCOVERY_YEAR[sym] ?? 9999) > modelYear;
      const textMatches=!q||name.toLowerCase().includes(q)||sym.toLowerCase().includes(q)||String(Z)===q;
      const catMatches=!this._categoryFilter||cat===this._categoryFilter;
      const matches=textMatches&&catMatches&&!isUndiscovered;
      const filterActive = !!q || !!this._categoryFilter;
      if (matches) matchCount++;
      const btn=document.createElement('button');
      // Estilo réplica do SILQ: cor individual do elemento, com
      // dimmed/highlighted controlados por filtro (não por seleção).
      btn.className='pt-cell'
        +(isUndiscovered ? ' undiscovered' : (filterActive?(matches?' highlighted':' dimmed'):''));
      btn.dataset.z=String(Z); btn.dataset.r=String(r); btn.dataset.c=String(c);
      btn.dataset.cat=cat;
      btn.style.backgroundColor = color || catColor(cat);
      btn.style.color = getContrastColor(color || '#475569');
      btn.setAttribute('role','gridcell');
      if (isUndiscovered) {
        btn.setAttribute('aria-label',`${name} (${sym}) — ainda não descoberto em ${modelYear}`);
        btn.setAttribute('aria-disabled','true');
        btn.disabled = true;
        btn.setAttribute('tabindex','-1');
        btn.title = `Descoberto em ${DISCOVERY_YEAR[sym]} — posterior ao modelo de ${modelYear}`;
      } else {
        btn.setAttribute('aria-label',`${name} (${sym}), número atômico ${Z}, ${mass} u`);
        btn.setAttribute('tabindex',Z===this.sim.Z?'0':'-1');
        if (filterActive && !matches) btn.setAttribute('aria-disabled','true');
        btn.addEventListener('click',()=>this._selectElement(el,btn));
        btn.addEventListener('keydown',e=>this._ptKeyNav(e,r,c,btn));
      }
      btn.innerHTML=`<span class="c-num" aria-hidden="true">${Z}</span><span class="c-sym" aria-hidden="true">${sym}</span><span class="c-name" aria-hidden="true">${name}</span>`;
      if (this.sim.Z===Z && !isUndiscovered) btn.classList.add('selected');
      grid.appendChild(btn);
      this._ptFocusGrid.push({r,c,btn,el,matches: matches});
    };

    // Renderiza as 7 linhas principais
    for (let r=0;r<ROWS;r++)
      for (let c=0;c<COLS;c++)
        makeCell(cells[r][c], r, c);

    // Linhas de Lantanídeos/Actinídeos — grid próprio de 15 colunas
    // (já existe estaticamente no HTML, com margem visual acima)
    const extra = document.getElementById('periodic-table-extra');
    extra.innerHTML = '';
    [lanRow, actRow].forEach((rowArr, ri) => {
      rowArr.forEach((el, ci) => {
        const r = ROWS + ri; // índices de linha virtuais (7 e 8) para navegação por teclado
        if (!el) {
          const g=document.createElement('div'); g.className='pt-gap';
          g.setAttribute('aria-hidden','true');
          extra.appendChild(g);
          this._ptFocusGrid.push(null);
          return;
        }
        const[Z,sym,name,mass,cat,,,,color]=el;
        const isUndiscovered = (DISCOVERY_YEAR[sym] ?? 9999) > modelYear;
        const textMatches=!q||name.toLowerCase().includes(q)||sym.toLowerCase().includes(q)||String(Z)===q;
        const catMatches=!this._categoryFilter||cat===this._categoryFilter;
        const matches=textMatches&&catMatches&&!isUndiscovered;
        const filterActive = !!q || !!this._categoryFilter;
        if (matches) matchCount++;
        const btn=document.createElement('button');
        btn.className='pt-cell'
          +(isUndiscovered ? ' undiscovered' : (filterActive?(matches?' highlighted':' dimmed'):''));
        btn.dataset.z=String(Z); btn.dataset.r=String(r); btn.dataset.c=String(ci+2);
        btn.dataset.cat=cat;
        btn.style.backgroundColor = color || catColor(cat);
        btn.style.color = getContrastColor(color || '#475569');
        btn.setAttribute('role','gridcell');
        if (isUndiscovered) {
          btn.setAttribute('aria-label',`${name} (${sym}) — ainda não descoberto em ${modelYear}`);
          btn.setAttribute('aria-disabled','true');
          btn.disabled = true;
          btn.setAttribute('tabindex','-1');
          btn.title = `Descoberto em ${DISCOVERY_YEAR[sym]} — posterior ao modelo de ${modelYear}`;
        } else {
          btn.setAttribute('aria-label',`${name} (${sym}), número atômico ${Z}, ${mass} u`);
          btn.setAttribute('tabindex',Z===this.sim.Z?'0':'-1');
          if (filterActive && !matches) btn.setAttribute('aria-disabled','true');
          btn.addEventListener('click',()=>this._selectElement(el,btn));
          btn.addEventListener('keydown',e=>this._ptKeyNav(e,r,ci+2,btn));
        }
        btn.innerHTML=`<span class="c-num" aria-hidden="true">${Z}</span><span class="c-sym" aria-hidden="true">${sym}</span><span class="c-name" aria-hidden="true">${name}</span>`;
        if (this.sim.Z===Z && !isUndiscovered) btn.classList.add('selected');
        extra.appendChild(btn);
        this._ptFocusGrid.push({r,c:ci+2,btn,el,matches:matches});
      });
    });

    if (filter) announce(`${matchCount} elemento${matchCount!==1?'s':''} encontrado${matchCount!==1?'s':''}.`);
    const countEl=document.getElementById('pt-count');
    if (countEl) countEl.textContent=filter?`${matchCount} de 118`:'118 elementos';
  };

  AtomicApp.prototype._ptKeyNav = function(e,row,col,currentBtn) {
    // Linhas 0–6: 18 colunas (tabela principal). Linhas 7–8 (lantanídeos/
    // actinídeos): só 15 colunas, ocupando colunas 2–16 — por isso a
    // navegação não usa indexação matemática fixa (tr*COLS+tc), e sim
    // uma busca direta no array linear por correspondência de {r,c}.
    const ROWS=9;
    let [tr,tc]=[row,col];
    if      (e.key==='ArrowRight'){ tc++; }
    else if (e.key==='ArrowLeft') { tc--; }
    else if (e.key==='ArrowDown') { tr++; }
    else if (e.key==='ArrowUp')   { tr--; }
    else if (e.key==='Home')      { tc=0; }
    else if (e.key==='End')       { tc=17; }
    else return;
    e.preventDefault();

    const findAt=(r,c)=>this._ptFocusGrid.find(cell=>cell && cell.r===r && cell.c===c);

    for (let attempt=0;attempt<ROWS*18;attempt++) {
      tr=((tr%ROWS)+ROWS)%ROWS;
      tc=((tc%18)+18)%18;
      const cell=findAt(tr,tc);
      if (cell?.matches) {
        currentBtn.setAttribute('tabindex','-1');
        cell.btn.setAttribute('tabindex','0');
        cell.btn.focus();
        return;
      }
      if (e.key.startsWith('Arrow')) {
        if (e.key==='ArrowRight'||e.key==='ArrowLeft') tc+=(e.key==='ArrowRight'?1:-1);
        else tr+=(e.key==='ArrowDown'?1:-1);
      } else break;
    }
  };

  AtomicApp.prototype._selectElement = function(el,btn) {
    playTone(750,.08,.07);
    document.querySelectorAll('.pt-cell.selected').forEach(c=>{
      c.classList.remove('selected'); c.setAttribute('tabindex','-1');
    });
    btn.classList.add('selected'); btn.setAttribute('tabindex','0');
    this.sim.elData=el;
    // No modo Dalton, trocar o elemento selecionado deve atualizar os
    // átomos do canvas — cor e tamanho precisam refletir o novo
    // elemento, não o antigo (_buildDalton só popula o array quando
    // está vazio, por isso o reset explícito aqui).
    if (this.sim.model==='dalton') {
      this.sim.resetDalton();
    } else {
      this.sim.rebuild();
    }
    this.sim.bohrPhotons=[];
    this.sim.bohrLog=[];
    this._updateElementUI();
    this._updateOverlay();
    this._updateBohrShellSelectors();
    if (this.sim.model==='quantum') {
      this._updateProjectionPanel();
    }
    const[Z,sym,name,mass,cat,,, electrons]=el;
    const shells=electrons.map((n,i)=>`${SHELLS[i]}:${n}`).join(' ');
    announce(`${name} selecionado. Z=${Z}. Distribuição: ${shells}.`, 'assertive');
  };

