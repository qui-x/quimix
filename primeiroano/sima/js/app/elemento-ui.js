/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Dados do elemento selecionado
   ARQUIVO: elemento-ui.js
   ───────────────────────────────────────────────────────────────
   Preenche o cartão do elemento e o painel "Dados do Elemento"
   (nome, símbolo, massa, distribuição eletrônica, última
   subcamada, ano de descoberta) e o painel de Projeção Matemática
   (diagrama de Linus Pauling), exclusivo do modelo Quântico.
   Adiciona a AtomicApp.prototype: _updateElementUI,
   _updateProjectionPanel.
   Depende de: app/atomic-app-core.js, core/fisica.js
               (fillSubshells), core/dados.js (DISCOVERY_YEAR).
═══════════════════════════════════════════════════════════════ */

'use strict';

AtomicApp.prototype._updateElementUI = function() {
    const[Z,sym,name,mass,cat,,,electrons]=this.sim.elData;
    const shellStr=electrons.map((n,i)=>`${SHELLS[i]}: ${n}`).join(' · ');
    const catNames={noble:'Gás Nobre',nonmetal:'Ametal',metal:'Metal Pós-Transição',
      metalloid:'Semimetal',transition:'Metal de Transição',alkaline:'Metal Alcalino-terroso',
      alkali:'Metal Alcalino',lanthanide:'Lantanídeo',actinide:'Actinídeo'};
    const s=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    s('el-symbol',sym); s('el-name',name); s('el-detail',`Z=${Z} · ${shellStr}`); s('el-mass',mass+' u');
    s('d-name',name); s('d-symbol',sym); s('d-z',Z); s('d-mass',mass+' u');
    s('d-cat',catNames[cat]||cat); s('d-dist',shellStr);
    s('d-shells',electrons.length); s('d-electrons',electrons.reduce((a,b)=>a+b,0));

    // Ano de descoberta — atualizado em TODOS os modelos, já que
    // "Dados do Elemento" é sempre visível independente do modelo ativo.
    // Anos negativos = a.C. (ex: Cu=-9000 → "~9000 a.C.")
    const year = DISCOVERY_YEAR[sym];
    const yearLabel = (year !== undefined && year < 0)
      ? `~${Math.abs(year)} a.C.`
      : (year ?? '—');
    s('d-discovery-year', yearLabel);

    // Última subcamada — disponível só quando qSubshells foi calculado
    // (modelo Quântico); nos outros modelos, usa fillSubshells diretamente
    // para calcular sem depender do estado do canvas quântico.
    const subshells = (this.sim.qSubshells && this.sim.qSubshells.length)
      ? this.sim.qSubshells
      : fillSubshells(Z);
    const last = subshells[subshells.length - 1];
    s('d-last-subshell', last ? last.label : '—');

    if (this.sim.model === 'bohr') this._updateBohrEnergy();
  };

  AtomicApp.prototype._updateBohrEnergy = function() {
    const electron = this.sim.selectedBohrElectron || this.sim.bohrElectrons[0];
    const field = document.getElementById('d-bohr-energy');
    if (!field || !electron) return;
    const level = electron.shell + 1;
    const energy = bohrEnergy(this.sim.Z, level).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    field.textContent = `Elétron · ${SHELLS[electron.shell]} (n=${level}) · ${energy} eV`;
  };

  /**
   * Atualiza dois pontos que dependem do elemento selecionado:
   *  1) Os campos "Última subcamada" e "Conhecido desde", que agora
   *     vivem dentro do painel "Dados do Elemento" (não mais num
   *     painel próprio de "Projeção Matemática", que ficou só com o
   *     texto explicativo estático).
   *  2) A distribuição eletrônica no formato real do diagrama de
   *     Linus Pauling — 1s² 2s² 2p⁶ ... — com o número de elétrons de
   *     cada subnível como expoente, calculado a partir das
   *     subcamadas REAIS do elemento (this.sim.qSubshells), em vez de
   *     uma sequência estática genérica sem indicar ocupação.
   */
  AtomicApp.prototype._updateProjectionPanel = function() {
    const sym = this.sim.elData[1];
    const subshells = this.sim.qSubshells || [];
    const orbital = document.getElementById('quantum-orbital');
    const plane = document.getElementById('quantum-plane');
    const sample = document.getElementById('quantum-sample');
    const result = document.getElementById('quantum-result');
    const composition = document.getElementById('quantum-composition');
    const total = subshells.reduce((sum, sub) => sum + sub.count, 0);
    composition.textContent = `${total} e⁻ · ${subshells.length} subcamada(s) ocupada(s). ` +
      subshells.map(sub => `${sub.label}: ${sub.count} e⁻ (${(100*sub.count/total).toLocaleString('pt-BR',{maximumFractionDigits:1})}%)`).join(' · ');
    const choices = [];
    plane.value = 'projection';
    orbital.replaceChildren(new Option('Nuvem total', ''));
    for (const sub of subshells) {
      const group = document.createElement('optgroup');
      group.label = `${sub.label} · ${sub.count} e⁻ na subcamada`;
      for (const form of quantumForms[sub.l]) {
        const label = sub.n + form[0];
        group.appendChild(new Option(label, String(choices.length)));
        choices.push({ form, label, l: sub.l });
      }
      orbital.appendChild(group);
    }
    const accumulate = () => {
      this.sim.sampleQuantumSection();
      const count = this.sim.qSection.points.length;
      result.textContent = count ? `${count} posições amostradas` : 'Plano nodal · densidade nula neste corte';
      sample.disabled = !count || count >= quantumSampleLimit;
    };
    const select = () => {
      const sub = orbital.value === '' ? null : choices[Number(orbital.value)];
      composition.hidden = !!sub;
      plane.disabled = sample.disabled = !sub;
      result.textContent = '';
      this.sim.qSection = sub ? { ...sub, plane: plane.value, points: [] } : null;
      if (sub && sub.form[2].includes(plane.value)) {
        result.textContent = 'Plano nodal · densidade nula neste corte';
        sample.disabled = true;
      }
    };
    orbital.onchange = plane.onchange = select;
    sample.onclick = accumulate;
    select();
    const last = subshells[subshells.length-1];
    const year = DISCOVERY_YEAR[sym];
    const yearLabel = (year !== undefined && year < 0) ? `~${Math.abs(year)} a.C.` : (year ?? '—');

    const lastEl = document.getElementById('d-last-subshell');
    const yearEl = document.getElementById('d-discovery-year');
    if (lastEl) lastEl.textContent = last ? last.label : '—';
    if (yearEl) yearEl.textContent = yearLabel;

    // Expoentes Unicode para o número de elétrons em cada subnível —
    // mesma notação usada em livros didáticos (1s², 2p⁶, 3d¹⁰...).
    const SUPERSCRIPT = {0:'⁰',1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹'};
    const toSuperscript = (n) => String(n).split('').map(d=>SUPERSCRIPT[d]).join('');
    const paulingEl = document.getElementById('pauling-distribution');
    if (paulingEl && subshells.length) {
      paulingEl.textContent = subshells
        .map(s => `${s.label}${toSuperscript(s.count)}`)
        .join(' ');
    }
  };

