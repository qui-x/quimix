/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Lista de substâncias
   ARQUIVO: app-substancias.js
   ───────────────────────────────────────────────────────────────
   Constrói a lista de substâncias (com busca por nome/fórmula, sem
   classificação por categoria química), e trata a seleção de uma
   substância: recalibra o slider de temperatura, atualiza o painel
   de dados e reinicia a simulação para a nova substância.
   Adiciona a App.prototype: _buildList, _selectEntry.
   Depende de: app/app-core.js, data/catalogo-substancias.js
               (CATALOG). O campo `cat` de cada substância continua
               nos dados, mas não é mais usado para classificar ou
               filtrar a interface.
═══════════════════════════════════════════════════════════════ */

'use strict';

App.prototype._buildList = function(filter='') {
    const list=document.getElementById('sub-list');
    const q=filter.toLowerCase().trim();
    const mapaEstado = { solid:'solido', liquid:'liquido', gas:'gasoso' };
    let visiveis = 0;
    list.innerHTML='';
    for (const e of CATALOG) {
      // Filtro de MÓDULO (Gases/Líquidos/Sólidos, sidebar esquerda): com um
      // módulo ativo, só aparecem substâncias daquele estado físico de
      // referência (25°C, 1atm — ver estadoPadrao() em termodinamica.js).
      if (this._activeModulo && mapaEstado[estadoPadrao(e)] !== this._activeModulo) continue;
      if (q && !e.name.toLowerCase().includes(q) && !e.formula.toLowerCase().includes(q)) continue;
      visiveis++;
      const li=document.createElement('li');
      li.className='sub-item'; li.setAttribute('role','option'); li.setAttribute('tabindex','0');
      li.innerHTML=`<span class="si-dot" style="background:${e.color};color:${e.color}"></span>
        <span class="si-formula">${e.formula}</span>
        <span class="si-name">${e.name}</span>`;
      li.addEventListener('click',()=>this._selectEntry(e,li));
      li.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' ')this._selectEntry(e,li);});
      list.appendChild(li);
    }
    if (visiveis === 0) {
      const vazio = document.createElement('li');
      vazio.className = 'sub-lista-vazia';
      vazio.setAttribute('role', 'note');
      vazio.textContent = 'Nenhuma substância nesta combinação de filtros.';
      list.appendChild(vazio);
    }
  };

  App.prototype._selectEntry = function(entry, liEl) {
    document.querySelectorAll('.sub-item').forEach(el=>{el.classList.remove('active');el.removeAttribute('aria-selected');});
    liEl.classList.add('active'); liEl.setAttribute('aria-selected','true');
    this.sim.entry=entry;
    this._calibrateTempSlider(entry);
    // Pressão sempre reinicia em 1 atm (pressão atmosférica padrão) ao
    // trocar de substância — ponto de partida didaticamente coerente,
    // consistente com os 25°C padrão da temperatura.
    const pressSl = document.getElementById('press-slider');
    pressSl.value = 0; // slider é log10(atm); 0 → 10^0 = 1 atm
    document.getElementById('press-val').textContent = '1.00 atm';
    this.sim.T_C=+document.getElementById('temp-slider').value;
    this.sim.P_atm=1.0;
    this.sim.N=+document.getElementById('n-slider').value;
    this.sim.init();
    this._populateDataPanel(entry);
    this._populateAtomLegend(entry);
    this._updateMeasures();
  };

