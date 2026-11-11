/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Ativação/sincronização dos modelos
   ARQUIVO: modelos-ui.js
   ───────────────────────────────────────────────────────────────
   Ativa/desativa o modelo atômico corrente, mantém os cartões da
   sidebar esquerda sincronizados com o modelo ativo, atualiza a
   pílula indicadora sobre o canvas e os seletores de camada do
   Bohr (De/Para).
   Adiciona a AtomicApp.prototype: clearModel, _syncModelPanels,
   _updateOverlay, _updateBohrShellSelectors.
   Depende de: app/atomic-app-core.js, core/dados.js (SHELLS).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── DESATIVAR o modelo — canvas volta ao estado puro, o mesmo em que o
     SIMA agora abre (sim.model = null). Nada e desenhado porque os tres
     switch(this.model) de rebuild/update/draw nao casam nenhum case.
     Mesmo contrato de toggle do SILQ (setMode / clearMode). ── */
  AtomicApp.prototype.clearModel = function() {
    playTone(420, .06, .05);
    this.sim.model = null;
    // Cancela qualquer "largada com antecipação" pendente do modelo
    // anterior.
    if (this._modeStartTimer) { clearTimeout(this._modeStartTimer); this._modeStartTimer = null; }
    this._modeStartsAt = 0;
    // desliga eventuais easter eggs que pertencem a um modelo especifico
    this.sim.ruthEggMode = false;
    this.sim.bohrEggMode = false;
    document.querySelectorAll('[data-model]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    // Sem restricao historica de ano: a tabela volta com os 118 elementos
    // (MODEL_YEAR[null] e undefined, e o ?? 9999 ja cobre esse caso).
    const busca = document.getElementById('pt-search');
    this._buildPeriodicTable(busca ? busca.value : '');
    this._updateOverlay();
    this._updateElementUI();
    this._syncModelPanels();
    this._syncMobileModeUI(null);
    announce('Modelo desativado. Canvas em branco — escolha um modelo e ative-o para voltar a simular.');
  };

  /* Painéis que só fazem sentido com um modelo ativo.

     O painel "Sobre o Modelo" foi REMOVIDO da sidebar direita: ele repetia
     o <p class="mode-define"> que cada card de modelo (sidebar esquerda) já
     mostra, e o card só é relevante quando o modelo está ativo — que era
     exatamente o caso em que esse painel tinha o que dizer.
     O convite do estado "sem modelo" continua sendo dado pelo #canvas-hint,
     sobre o canvas em branco (última linha deste método). */
  AtomicApp.prototype._syncModelPanels = function() {
    const m = this.sim.model;
    const proj = document.getElementById('body-projection');
    if (proj && proj.closest('.panel')) proj.closest('.panel').hidden = (m !== 'quantum');
    ['egg-panel-rutherford', 'egg-panel-bohr'].forEach(id => {
      const p = document.getElementById(id);
      if (p && !m) p.hidden = true;
    });
    /* PEDIDO: a barra direita só mostra informação com um modelo
       ativo — mesmo padrão do 2º/3º ano. Tabela Periódica e Dados
       do Elemento valem pra QUALQUER modelo (não são exclusivos de
       um só, por isso não usam data-owner/panels como o 2º ano —
       aqui é um único "liga tudo/desliga tudo" baseado em m ser ou
       não null). */
    const periodic = document.getElementById('hdr-periodic');
    if (periodic && periodic.closest('.panel')) periodic.closest('.panel').hidden = !m;
    const eldata = document.getElementById('hdr-eldata');
    if (eldata && eldata.closest('.panel')) eldata.closest('.panel').hidden = !m;
    const hint = document.getElementById('canvas-hint');
    if (hint) hint.hidden = !!m;
  };

  AtomicApp.prototype._updateOverlay = function() {
    const MNAMES={dalton:'Dalton',thomson:'Thomson',rutherford:'Rutherford',bohr:'Bohr',quantum:'Quântico'};
    // mesmos icones SVG do .panel-icon de cada painel de modelo (ver <defs>
    // de <symbol> no topo do indexsima.html), para a pilula do canvas casar
    // visualmente com o menu de modulos (padrao SILQ). Substituiu os
    // emojis que existiam aqui antes — ver ic.innerHTML abaixo.
    const MICONS={
      dalton:'<svg class="icon" aria-hidden="true"><use href="#ic-dalton"/></svg>',
      thomson:'<svg class="icon" aria-hidden="true"><use href="#ic-thomson"/></svg>',
      rutherford:'<svg class="icon" aria-hidden="true"><use href="#ic-rutherford"/></svg>',
      bohr:'<svg class="icon" aria-hidden="true"><use href="#ic-bohr"/></svg>',
      quantum:'<svg class="icon" aria-hidden="true"><use href="#ic-quantum"/></svg>',
    };
    const[Z,,name]=this.sim.elData;
    const txt=document.getElementById('overlay-text');
    const ico=document.getElementById('overlay-icon');
    const ind=document.getElementById('mode-indicator');
    // Sem modelo ativo a pilula desaparece — canvas puro, como no SILQ.
    if (ind) ind.classList.toggle('mode-on', !!this.sim.model);
    /* BUG CORRIGIDO: a borda do canvas (.canvas-wrap, ver stylesima.css)
       tenta usar var(--mod-rgb) pra pegar a cor do modelo ativo — mas
       essa variável só existe dentro de .panel--mode[data-mode-card],
       na sidebar esquerda, um ramo DIFERENTE da árvore do DOM. CSS custom
       property não atravessa de lado assim, só desce pra descendentes —
       .canvas-wrap nunca recebia nada, a borda nunca tinha cor de
       verdade. Copiar o valor já calculado (considera tema claro/escuro
       sozinho, sem duplicar as cores aqui) pro body resolve, porque
       início da árvore inclui tanto a sidebar quanto o canvas. */
    if (this.sim.model) {
      const painelAtivo = document.querySelector(`.panel--mode[data-mode-card="${this.sim.model}"]`);
      if (painelAtivo) {
        const cs = getComputedStyle(painelAtivo);
        document.body.style.setProperty('--mod-rgb', cs.getPropertyValue('--mod-rgb'));
        document.body.style.setProperty('--mod', cs.getPropertyValue('--mod'));
      }
    } else {
      document.body.style.removeProperty('--mod-rgb');
      document.body.style.removeProperty('--mod');
    }
    if (!this.sim.model) { if (ind) ind.dataset.mode=''; return; }
    if (txt) {
      txt.textContent=`${MNAMES[this.sim.model]} ativo`;
      const sp=document.createElement('span');
      sp.className='overlay-detail';
      sp.textContent=` · ${name} (Z=${Z})`;
      txt.appendChild(sp);
    }
    if (ico) ico.innerHTML=MICONS[this.sim.model]||'';
    // data-mode pinta a pilula com a cor do modelo, as mesmas 5 cores do menu
    if (ind) ind.dataset.mode=this.sim.model||'';
  };

  // ── Seletores de camada do Bohr (subir/retornar) ───────────────
  AtomicApp.prototype._updateBohrShellSelectors = function() {
    const ns = this.sim.Z === 1 ? 3 : Math.min(this.sim.electrons.length, 7);
    const fromSel = document.getElementById('bohr-from-shell');
    const toSel   = document.getElementById('bohr-to-shell');
    if (!fromSel || !toSel) return;
    fromSel.innerHTML=''; toSel.innerHTML='';
    for (let s=0;s<ns;s++) {
      const optF=document.createElement('option'); optF.value=s; optF.textContent=SHELLS[s];
      if (this.sim.electrons[s]) fromSel.appendChild(optF);
      const optT=document.createElement('option'); optT.value=s; optT.textContent=SHELLS[s];
      toSel.appendChild(optT);
    }
    if (ns>1) toSel.value = 1;
  };

