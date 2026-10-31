/* ═══════════════════════════════════════════════════════════════
   CAMADA: INICIALIZAÇÃO
   ARQUIVO: js/init/app.js
   ───────────────────────────────────────────────────────────────
   A classe App: monta a interface, liga os eventos, roda o laço de animação e redimensiona o canvas.

   Extraído de scriptcarbono.js na refatoração para a estrutura de
   pastas do SIMA. A divisão é literal: o escopo continua global e
   as tags <script> continuam compartilhando-o, então nenhuma
   referência mudou de nome. O que mudou é onde cada coisa mora.

   Ordem de carga (definida em index.html): a11y → core → data →
   ui → simulation → init. Quebrar essa ordem quebra o simulador.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ONDE O CELULAR COMEÇA — a mesma regra do CSS (stylecarbono.css): até 900 px de largura, como no SIMA, ou
   deitado (até 1100 × 500 px). Acima disso, a tela de computador: trilhos e cards ao lado da cena — é o que
   um tablet deitado de 1024 px recebe. Quem pergunta "é celular?" usa ehCelular(), nunca um número próprio. */
window.MQ_CELULAR = '(max-width: 900px), (max-width: 1100px) and (max-height: 500px)';
function ehCelular() { return window.matchMedia ? window.matchMedia(window.MQ_CELULAR).matches : window.innerWidth <= 900; }

/* A dica do canvas sem modo ativo. No celular os modos ficam nas abas de cima, sem botão Ativar. */
function dicaInicial() {
  return ehCelular() ? 'Escolha um modo nas abas acima para começar.'
    : 'Escolha um modo ao lado e clique em "Ativar" para iniciar a simulação.';
}

function fillOptGrid(gridId, items, selValue) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  items.forEach(it => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt-btn' + (String(it.value) === String(selValue) ? ' active' : '');
    b.dataset.value = it.value;
    b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', String(String(it.value) === String(selValue)));
    if (it.dot) { const d = document.createElement('span'); d.className = 'opt-dot'; d.style.setProperty('--dot', it.dot); b.appendChild(d); }
    const n = document.createElement('span'); n.className = 'opt-nome'; n.textContent = it.nome; b.appendChild(n);
    if (it.extra) { const x = document.createElement('span'); x.className = 'opt-c'; x.textContent = it.extra; b.appendChild(x); }
    if (it.aria) b.setAttribute('aria-label', it.aria);
    grid.appendChild(b);
  });
}

class App {
  constructor(mech) {
    this.mech = mech;
    mech.app = this;
    this.D = window.SIM_DATA;
    this.time = 0;
    this._curio = 0;
    this._fpsN = 0; this._fpsT = 0;
    // Modos já vistos nesta sessão (modal de 1ª ativação) + controle da
    // "largada com antecipação" do gatilho — ver setMode()/_loop().
    this._modosVistos = new Set();
    this._modeStartsAt = 0;
    this._modeStartTimer = null;

    this.canvas = document.getElementById('sim-canvas');
    this.ctx = this.canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
    // ResizeObserver: cobre qualquer mudança de tamanho da área de
    // desenho (arrastar o redimensionador do sidebar, abrir/fechar a
    // gaveta mobile, rotacionar o aparelho, zoom) — não só resize da
    // janela do navegador, que é o único evento que window.resize cobre.
    const wrap = this.canvas.closest('.canvas-wrap');
    if (wrap && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this._resize()).observe(wrap);
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this._resize());
    }

    this._buildModes();
    this._buildModeTabsMobile();
    this._bindSidebar();
    this._bindModeIndicator();
    this._bindModeInfoModal();
    this._bindHeader();
    this._bindCanvasKeys();
    if (typeof mech.build === 'function') mech.build(this);

    // ── Estado inicial: NENHUM modo ativo — nada é desenhado no canvas
    //    até o usuário clicar em "Ativar" no painel do modo desejado. ──
    this.mode = null;
    document.querySelectorAll('.panel[data-owner]').forEach(p => { p.hidden = true; });
    const hint0 = document.getElementById('canvas-hint');
    if (hint0) hint0.textContent = dicaInicial();
    this.refresh();
    announce(`${this.D.ACRO} carregado. Nenhum modo ativo. Escolha um modo à esquerda e ative-o para começar.`);

    this._last = performance.now();
    requestAnimationFrame(() => this._loop());
  }

  /* ── canvas responsivo com devicePixelRatio ── */
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.canvas.getBoundingClientRect();
    this.W = Math.max(80, r.width);
    this.H = Math.max(80, r.height);
    this.canvas.width = this.W * dpr;
    this.canvas.height = this.H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._lastDPR = dpr;
  }

  /* ── painéis individuais por modo, gerados de SIM_DATA.MODES ──
     cada modo é um .panel padrão, igual ao de "Resultados": cabeçalho
     ícone+nome+sigla+seta (expande/recolhe sozinho, cuidado por
     _bindPanelArea) + corpo com botão "Ativar", definição, fatos-chave,
     interação do canvas e itens recomendados ── */
  _buildModes() {
    const list = document.getElementById('model-list');
    if (!list) return;
    this.D.MODES.forEach((m) => {
      const headerId = 'hdr-mode-' + m.id, bodyId = 'body-mode-' + m.id;

      const section = document.createElement('section');
      section.className = 'panel';
      section.dataset.modeCard = m.id;
      section.setAttribute('aria-labelledby', headerId);

      const header = document.createElement('button');
      header.type = 'button';
      header.id = headerId;
      header.className = 'panel-header';
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-controls', bodyId);
      header.innerHTML = `<span class="panel-icon" aria-hidden="true">${m.icon || '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="7"/></svg>'}</span>
        <span class="panel-label">${m.nome}</span>
        <span class="panel-badge">${m.sigla}</span>
        <span class="mode-active-tag">Ativo</span>
        <span class="chevron" aria-hidden="true">▾</span>`;

      const body = document.createElement('div');
      body.id = bodyId;
      body.className = 'panel-body collapsed';
      // PADRAO SILQ: o corpo do painel e uma regiao nomeada pelo cabecalho,
      // para o leitor de tela saber onde o modulo comeca e termina.
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', headerId);

      const activateBtn = document.createElement('button');
      activateBtn.type = 'button';
      activateBtn.className = 'action-btn mode-activate-btn';
      // Botao de ativacao e um toggle de estado -> aria-pressed (igual ao
      // .bond-mode-btn do SILQ). Sincronizado em setMode().
      activateBtn.setAttribute('aria-pressed', 'false');
      activateBtn.innerHTML = `<span aria-hidden="true">▶</span> Ativar ${m.nome}`;
      // TOGGLE — mesmo contrato do SILQ: clicar no modo JA ativo desativa e
      // devolve o simulador ao estado neutro (canvas em branco).
      activateBtn.addEventListener('click', () => {
        if (this.mode && this.mode.id === m.id) this.clearMode();
        else this.setMode(m.id);
      });
      // HINT DE HOVER — tooltip nativo, atualizado em setMode/clearMode.
      activateBtn.title = 'Ativar ' + m.nome + ' no canvas';
      body.appendChild(activateBtn);

      if (m.def) {
        const def = document.createElement('p');
        def.className = 'mode-define';
        def.textContent = m.def;
        body.appendChild(def);
      }

      if (m.fatos && m.fatos.length) {
        const grid = document.createElement('div');
        grid.className = 'fact-grid';
        m.fatos.forEach(ft => {
          const cell = document.createElement('div');
          cell.className = 'fact-cell';
          cell.innerHTML = `<span class="fact-label">${ft.l}</span><span class="fact-value">${ft.v}</span>`;
          grid.appendChild(cell);
        });
        body.appendChild(grid);
      }

      if (m.canvasInteracao) {
        const box = document.createElement('div');
        box.className = 'canvas-interactions';
        box.innerHTML = `<p class="canvas-interactions-title">Interações do canvas</p><p>${m.canvasInteracao}</p>`;
        body.appendChild(box);
      }

      if (m.recomendados && m.recomendados.length) {
        const rec = document.createElement('div');
        rec.className = 'recommended';
        rec.innerHTML = `<p class="recommended-title">Recomendados</p>
          <div class="chip-row">${m.recomendados.map(r => `<span class="chip">${r}</span>`).join('')}</div>`;
        body.appendChild(rec);
      }

      const hint = document.createElement('p');
      hint.className = 'hint-text';
      hint.textContent = m.hint;
      body.appendChild(hint);

      section.appendChild(header);
      section.appendChild(body);
      list.appendChild(section);
    });
  }

  /* ── DESATIVAR o modo — volta ao estado neutro, o mesmo em que o
     simulador abre (this.mode = null). Todo o resto do codigo ja trata
     esse caso: refresh(), o hint do canvas e os paineis por modo.
     Mesmo contrato de toggle do SILQ (setMode / clearMode). ── */
  clearMode() {
    this.mode = null;
    delete document.body.dataset.modo;
    // Cancela qualquer "largada com antecipação" pendente do modo
    // anterior.
    if (this._modeStartTimer) { clearTimeout(this._modeStartTimer); this._modeStartTimer = null; }
    this._modeStartsAt = 0;
    document.querySelectorAll('.panel[data-mode-card]').forEach(panel => {
      panel.classList.remove('active');
      const header = panel.querySelector('.panel-header');
      if (header) header.removeAttribute('aria-current');
      const actBtn = panel.querySelector('.mode-activate-btn');
      if (actBtn) {
        actBtn.setAttribute('aria-pressed', 'false');
        const nomeMod = (this.D.MODES.find(x => x.id === panel.dataset.modeCard) || {}).nome || '';
        actBtn.title = 'Ativar ' + nomeMod + ' no canvas';
      }
    });
    document.querySelectorAll('.panel[data-owner]').forEach(p => { p.hidden = true; });
    const hint = document.getElementById('canvas-hint');
    if (hint) hint.textContent = dicaInicial();
    // esconde a pilula do canvas — volta ao estado puro
    const ind0 = document.getElementById('mode-indicator');
    if (ind0) ind0.classList.remove('mode-on');
    if (this.mech && typeof this.mech.setMode === 'function') this.mech.setMode(null);
    this.refresh();
    this._syncMobileModeUI(null);
    if (typeof playTone === 'function') playTone(420, .06, .05);
    announce('Modo desativado. Nenhum modo ativo — escolha um modo e ative-o para voltar a simular.');
  }

  setMode(id, silent) {
    const m = this.D.MODES.find(x => x.id === id);
    if (!m) return;
    this.mode = m;
    document.body.dataset.modo = id;   // gancho de CSS para o que muda por modo (ex.: a ordem dos painéis na gaveta)
    document.querySelectorAll('.panel[data-mode-card]').forEach(panel => {
      const on = panel.dataset.modeCard === id;
      panel.classList.toggle('active', on);
      const header = panel.querySelector('.panel-header');
      if (header) {
        if (on) header.setAttribute('aria-current', 'true'); else header.removeAttribute('aria-current');
      }
      // Espelha o estado no botao "Ativar" do modulo (padrao SILQ)
      const actBtn = panel.querySelector('.mode-activate-btn');
      if (actBtn) {
        actBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        const nomeMod = (this.D.MODES.find(x => x.id === panel.dataset.modeCard) || {}).nome || '';
        actBtn.title = on ? ('Desativar ' + nomeMod) : ('Ativar ' + nomeMod + ' no canvas');
      }
      // Ao ativar, o painel se RECOLHE (em vez de expandir) — o gatilho de
      // ativação abre espaço pro canvas. Reabrir é um clique no
      // cabeçalho, a qualquer momento, inclusive com a simulação rodando.
      if (on) {
        if (header) header.setAttribute('aria-expanded', 'false');
        const body = panel.querySelector('.panel-body');
        if (body) body.classList.add('collapsed');
      }
    });
    document.querySelectorAll('.panel[data-owner]').forEach(p => {
      p.hidden = !(m.panels || []).includes(p.id);
    });
    const hint = document.getElementById('canvas-hint');
    this.mech.setMode(id);
    this.refresh();
    this._syncMobileModeUI(id);
    // No mobile, ativar um modo RECOLHE o bottom sheet de controles (se
    // estiver aberto) em vez de abri-lo — reabrir pra ajustar parâmetros
    // é um toque no botão de controles do cabeçalho, a qualquer momento.
    if (ehCelular() && typeof window._closeSidebar === 'function') {
      window._closeSidebar();
    }
    // ── largada com 2s de antecipação ──
    // O ESTADO já foi montado (mech.setMode acima), então o canvas mostra
    // o quadro inicial "parado" imediatamente — só a FÍSICA (mech.update,
    // chamada em _loop) fica pausada por 2s.
    if (this._modeStartTimer) clearTimeout(this._modeStartTimer);
    this._modeStartsAt = performance.now() + 2000;
    if (hint) hint.textContent = 'Iniciando em instantes…';
    this._modeStartTimer = setTimeout(() => {
      const h = document.getElementById('canvas-hint');
      if (h && this.mode && this.mode.id === id) h.textContent = m.hintCanvas || '';
    }, 2000);
    if (!silent) {
      playTone(760, .06, .05);
      announce(`Modo ${m.nome} selecionado. A animação começa em 2 segundos. ${(m.info || '').split('.')[0]}.`);
    }
  }

  /* ── barra de modos MOBILE — mesma ordem/dados de _buildModes() acima,
     como abas roláveis em vez de acordeão (ver CSS, ativa só abaixo de
     ehCelular()). Clicar chama setMode/clearMode, o MESMO contrato de sempre —
     a barra não tem lógica própria de estado, só delega. ── */
  _buildModeTabsMobile() {
    const bar = document.getElementById('mode-tabs-mobile');
    if (!bar) return;
    this.D.MODES.forEach(m => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'mode-tab';
      tab.dataset.modeTab = m.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', 'false');
      tab.innerHTML = `<span aria-hidden="true">${m.icon || ''}</span><span>${m.nome}</span>`;
      tab.title = m.nome;
      tab.addEventListener('click', () => {
        if (this.mode && this.mode.id === m.id) this.clearMode();else this.setMode(m.id);
      });
      bar.appendChild(tab);
    });
  }

  /* ── resumo do modo, para dentro do bottom sheet mobile (definição +
     fatos-chave — a mesma informação que já existe no acordeão da
     sidebar esquerda, só que reduzida e em outro lugar). ── */
  _modeSummaryHTML(m, completo) {   // completo: o resumo da gaveta (o aviso da 1ª ativação fica mais curto)
    let html = '';
    if (m.def) html += `<p class="mode-define">${m.def}</p>`;
    if (m.fatos && m.fatos.length) {
      html += '<div class="fact-grid">' + m.fatos.map(ft =>
        `<div class="fact-cell"><span class="fact-label">${ft.l}</span><span class="fact-value">${ft.v}</span></div>`
      ).join('') + '</div>';
    }
    // o "como mexer" do modo: no computador mora no card da barra da esquerda, que no celular não aparece
    if (m.canvasInteracao) html += `<div class="canvas-interactions"><p class="canvas-interactions-title">Interações do canvas</p><p>${m.canvasInteracao}</p></div>`;
    if (completo && m.recomendados && m.recomendados.length) html += `<div class="recommended"><p class="recommended-title">Recomendados</p><div class="chip-row">${m.recomendados.map(r => `<span class="chip">${r}</span>`).join('')}</div></div>`;
    if (completo && m.hint) html += `<p class="hint-text">${m.hint}</p>`;
    return html;
  }

  /* ── sincroniza a barra de modos e o resumo do bottom sheet com o modo
     ativo — chamada por setMode()/clearMode(), nunca sozinha. ── */
  _syncMobileModeUI(id) {
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.setAttribute('aria-selected', tab.dataset.modeTab === id ? 'true' : 'false');
    });
    const activeTab = id && document.querySelector(`.mode-tab[data-mode-tab="${id}"]`);
    if (activeTab && typeof activeTab.scrollIntoView === 'function') {
      const reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduzido ? 'auto' : 'smooth' });
    }
    const box = document.getElementById('mode-summary-mobile');
    const toggle = document.getElementById('mode-summary-toggle');
    const body = document.getElementById('mode-summary-body');
    if (!box || !toggle || !body) return;
    if (!id) { box.hidden = true; return; }
    const m = this.D.MODES.find(x => x.id === id);
    if (!m) { box.hidden = true; return; }
    box.hidden = false;
    body.innerHTML = this._modeSummaryHTML(m, true);
    const primeiraVez = !this._modosVistos.has(id);
    this._modosVistos.add(id);
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('open');
    if (primeiraVez && ehCelular()) this._showModeInfoModal(m);
    if (!toggle._wired) {
      toggle._wired = true;
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        body.classList.toggle('open', !open);
      });
    }
  }

  /* ── MODAL de informações do modo (1ª ativação, mobile) ── */
  _showModeInfoModal(m) {
    const overlay = document.getElementById('modeInfoOverlay');
    if (!overlay) return;
    const icon = document.getElementById('modeInfoIcon');
    const title = document.getElementById('modeInfoTitle');
    const body = document.getElementById('modeInfoBody');
    const closeBtn = document.getElementById('modeInfoClose');
    if (icon) icon.innerHTML = m.icon || '';
    if (title) title.textContent = m.nome;
    if (body) body.innerHTML = this._modeSummaryHTML(m);
    this._modalVolta = document.activeElement;   // para devolver o foco a quem abriu o aviso
    overlay.classList.add('aberto');
    overlay.setAttribute('aria-hidden', 'false');
    if (closeBtn) setTimeout(() => { if (overlay.classList.contains('aberto')) closeBtn.focus(); }, 220);
  }
  _hideModeInfoModal() {
    const overlay = document.getElementById('modeInfoOverlay');
    if (!overlay) return;
    /* o foco sai do aviso ANTES de ele ganhar aria-hidden: com o foco dentro, o navegador bloqueia o
       aria-hidden (aviso no console) e o leitor de tela ficaria preso num elemento escondido. O foco volta
       para quem abriu o aviso (a aba do modo, em geral). */
    if (overlay.contains(document.activeElement)) {
      const volta = [this._modalVolta, document.querySelector('.mode-tab[aria-selected="true"]'), this.canvas]
        .find(el => el && el.isConnected && !overlay.contains(el) && el.offsetParent !== null && typeof el.focus === 'function');
      if (volta) volta.focus({ preventScroll: true }); else document.activeElement.blur();
    }
    overlay.classList.remove('aberto');
    overlay.setAttribute('aria-hidden', 'true');
  }
  _bindModeInfoModal() {
    const overlay = document.getElementById('modeInfoOverlay');
    const closeBtn = document.getElementById('modeInfoClose');
    if (!overlay || !closeBtn) return;
    closeBtn.addEventListener('click', () => this._hideModeInfoModal());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._hideModeInfoModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('aberto')) this._hideModeInfoModal();
    });
  }

  /* ── delegação de controles declarativos nas duas sidebars ──
     esquerda: menus/listagens e informativos · direita: controles */
  /* Botao ✕ da pilula do canvas — desativa o modo, mesmo papel do
     #bond-mode-indicator-clear do SILQ. */
  _bindModeIndicator() {
    const btn = document.getElementById('overlay-clear');
    if (btn) btn.addEventListener('click', () => this.clearMode());
  }

  _bindSidebar() {
    ['sidebar-left', 'sidebar-right'].forEach(id => {
      const el = document.getElementById(id);
      if (el) this._bindPanelArea(el);
    });
  }

  _bindPanelArea(sb) {
    sb.addEventListener('click', (e) => {
      const hdr = e.target.closest('.panel-header');
      if (hdr) {
        const exp = hdr.getAttribute('aria-expanded') === 'true';
        hdr.setAttribute('aria-expanded', String(!exp));
        const body = document.getElementById(hdr.getAttribute('aria-controls'));
        if (body) body.classList.toggle('collapsed', exp);
        playTone(exp ? 500 : 750, .06, .04);
        return;
      }
      const opt = e.target.closest('.opt-btn');
      if (opt) {
        const grid = opt.closest('[data-group]');
        grid.querySelectorAll('.opt-btn').forEach(b => {
          const on = b === opt;
          b.classList.toggle('active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        this._param(grid.dataset.group, opt.dataset.value);
        return;
      }
      const seg = e.target.closest('.seg-btn');
      if (seg) {
        seg.closest('.seg').querySelectorAll('.seg-btn').forEach(b => b.setAttribute('aria-pressed', String(b === seg)));
        this._param(seg.closest('.seg').dataset.group, seg.dataset.value);
        return;
      }
      const act = e.target.closest('[data-action]');
      if (act) {
        this.mech.action(act.dataset.action, act);
        this.refresh();
      }
    });

    sb.addEventListener('input', (e) => {
      const t = e.target;
      if (t.matches('input[type="range"][data-bind]')) {
        const v = parseFloat(t.value);
        const out = document.getElementById('out-' + t.id);
        if (out) out.textContent = this.fmtOut(t, v);
        this._param(t.dataset.bind, v);
      }
    });
    sb.addEventListener('change', (e) => {
      if (e.target.matches('select[data-bind]')) this._param(e.target.dataset.bind, e.target.value);
    });
  }

  fmtOut(inp, v) {
    const casas = inp.dataset.fmt === 'f2' ? 2 : inp.dataset.fmt === 'f1' ? 1 : 0;
    return fmt(v, casas) + (inp.dataset.unit ? ' ' + inp.dataset.unit : '');
  }

  _param(k, v) {
    const r = this.mech.setParam(k, v) || {};
    if (r.warn) announce(r.warn, 'assertive');
    if (r.say) announce(r.say);
    this.refresh();
  }

  /** Sincroniza um slider programaticamente (valor + output). */
  syncSlider(id, v) {
    const inp = document.getElementById(id);
    if (!inp) return;
    inp.value = v;
    const out = document.getElementById('out-' + id);
    if (out) out.textContent = this.fmtOut(inp, parseFloat(inp.value));
  }

  /* ── resultados + rótulo flutuante ── */
  refresh() {
    const grid = document.getElementById('result-grid');
    const resultPanel = grid ? grid.closest('.panel') : null;
    if (grid) {
      grid.innerHTML = '';
      if (!this.mode) {
        const p = document.createElement('p');
        p.className = 'hint-text';
        p.textContent = 'Ative um modo à esquerda para ver aqui a análise dos resultados.';
        grid.appendChild(p);
      } else {
        (this.mech.getResults() || []).forEach(r => {
          const row = document.createElement('div'); row.className = 'data-row';
          const dt = document.createElement('dt'); dt.className = 'data-label'; dt.textContent = r.l;
          const dd = document.createElement('dd'); dd.className = 'data-value' + (r.cls ? ' ' + r.cls : '');
          dd.textContent = r.v;
          row.append(dt, dd); grid.appendChild(row);
        });
      }
    }
    if (resultPanel) resultPanel.classList.toggle('panel--waiting', !this.mode);
    // o retorno do modo: a explicação do último passo do aluno, no alto dos Resultados. Sem aria-live:
    // o módulo já a anuncia ao leitor de tela (com a pergunta seguinte) no momento em que ela muda.
    const rt = document.getElementById('result-retorno');
    if (rt) {
      const fb = this.mode && typeof this.mech.getFeedback === 'function' ? this.mech.getFeedback() : null;
      const txt = fb ? fb.texto || '' : '', tipo = fb ? fb.tipo || 'info' : '';
      if (rt.textContent !== txt) rt.textContent = txt;
      if (rt.dataset.tipo !== tipo) rt.dataset.tipo = tipo;
      rt.hidden = !txt;
    }
    // o próximo passo do modo, logo abaixo (a cena fica só com o desenho)
    const nx = document.getElementById('result-next');
    if (nx) {
      const passo = this.mode && typeof this.mech.getNext === 'function' ? this.mech.getNext() || '' : '';
      if (nx.textContent !== passo) nx.textContent = passo;
      nx.hidden = !passo;
    }
    // INDICADOR DE MODO ATIVO (padrao SILQ): a pilula do topo do canvas
    // so existe quando ha modo ativo. Sem modo, o canvas fica PURO.
    const ind = document.getElementById('mode-indicator');
    const ovTxt = document.getElementById('overlay-text');
    const ovIco = document.getElementById('overlay-icon');
    if (ind) ind.classList.toggle('mode-on', !!this.mode);
    if (this.mode) {
      // "<Nome do modo> ativo" — igual ao SILQ ("Modo Metálico ativo").
      // O estado dinamico (temperatura, reagente, etc.) entra depois, num
      // span proprio, para nao virar frases como "t = 0 ativo".
      if (ovTxt) {
        ovTxt.textContent = this.mode.nome + ' ativo';
        const detalhe = (this.mech.getOverlay && this.mech.getOverlay()) || this.mode.overlay || '';
        if (detalhe && detalhe !== this.mode.nome) {
          const sp = document.createElement('span');
          sp.className = 'overlay-detail';
          sp.textContent = ' · ' + detalhe;
          ovTxt.appendChild(sp);
        }
      }
      if (ovIco) ovIco.innerHTML = this.mode.icon || '';
    }
    this._refreshResultChart();
  }

  /** Redesenha o canvas auxiliar de gráfico no painel de Resultados,
   *  se a mecânica do módulo implementar drawResultChart(). */
  _refreshResultChart() {
    const rc = document.getElementById('result-chart');
    if (!rc) return;
    const temGrafico = this.mode && typeof this.mech.drawResultChart === 'function';
    let desenhou = false;
    if (temGrafico) {
      const dpr = window.devicePixelRatio || 1;
      const w = rc.clientWidth || 260, h = rc.clientHeight || 160;
      if (rc.width !== w * dpr || rc.height !== h * dpr) { rc.width = w * dpr; rc.height = h * dpr; }
      const rctx = rc.getContext('2d');
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      desenhou = !!this.mech.drawResultChart(rctx, w, h);
    }
    rc.hidden = !desenhou;
  }

  /* ── header: pausa + curiosidades ── */
  _bindHeader() {
    const logo = document.getElementById('btn-app-logo');
    if (logo) logo.addEventListener('click', () => {
      const c = this.D.CURIOSIDADES;
      if (!c || !c.length) return;
      const fato = c[this._curio++ % c.length];
      playTone(660, .09, .06);
      announce('Você sabia? ' + fato);
    });
    document.addEventListener('keydown', (e) => {
      if (!e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.D.MODES.length) { e.preventDefault(); this.setMode(this.D.MODES[n - 1].id); }
    });
  }


  /* ── teclado no canvas: Enter/Espaço = ação primária; setas → mech ── */
  _bindCanvasKeys() {
    this.canvas.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.mode && this.mode.primary) { this.mech.action(this.mode.primary); this.refresh(); }
      } else if (this.mode && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && this.mech.onArrow) {
        const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
        const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        if (this.mech.onArrow(dx, dy)) { e.preventDefault(); this.refresh(); }
      }
    });
    // clique/toque no canvas — a mecânica decide se usa ou não
    this.canvas.addEventListener('click', (e) => {
      if (!this.mode || typeof this.mech.onCanvasClick !== 'function') return;
      const r = this.canvas.getBoundingClientRect();
      const x = e.clientX - r.left - (this.areaX || 0), y = e.clientY - r.top;   // nas coordenadas da cena (área livre)
      if (this.mech.onCanvasClick(x, y, this.areaW || this.W, this.H)) this.refresh();
    });
  }

  /* ── a área livre do canvas (o que nenhum card flutuante cobre) ──
     areaX/areaW ficam guardados para o clique e para as mecânicas que
     escutam o ponteiro direto no canvas: x_cena = x_canvas − areaX. */
  _areaLivre() {
    const a = window.Oclusao ? window.Oclusao.area(this.canvas) : null;
    this.areaX = a ? a.x : 0;
    this.areaW = a ? Math.min(this.W, a.w) : this.W;
    // publicado NO CANVAS, para os módulos que escutam o ponteiro direto nele
    this.canvas.cenaX = this.areaX; this.canvas.cenaW = this.areaW;
    return { x: this.areaX, w: this.areaW };
  }

  /* ── loop rAF ── */
  _loop() {
    const now = performance.now();
    const dt = clamp((now - this._last) / 1000, 0, .05);
    this._last = now;

    // Auto-correção de tamanho: existem formas de zoom que mudam o
    // devicePixelRatio SEM alterar o layout CSS — por isso comparamos
    // os DOIS: tamanho em CSS px e devicePixelRatio.
    const rNow = this.canvas.getBoundingClientRect();
    const dprNow = window.devicePixelRatio || 1;
    if (Math.abs(rNow.width - this.W) > .5 || Math.abs(rNow.height - this.H) > .5 || dprNow !== this._lastDPR) {
      this._resize();
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // Sem modo ativo → canvas permanece em branco (nada é desenhado
    // "sozinho"; exige ativação explícita do usuário no painel).
    if (this.mode) {
      // "Largada com antecipação": _modeStartsAt (marcado em setMode) segura
      // o UPDATE por 2s — o desenho continua rodando (mostra o quadro
      // congelado), só a física não avança até o tempo passar.
      if (now >= this._modeStartsAt) {
        this.time += dt;
        this.mech.update(dt, this);
      }
      // A ÁREA LIVRE: um card flutuante cobre uma faixa do canvas sem mudar o
      // tamanho dele (ver sidebar-rail.js · Oclusao). A cena é desenhada só na
      // parte que se vê — deslocada e mais estreita, deslizando junto com o card.
      const livre = this._areaLivre();
      ctx.save(); ctx.translate(livre.x, 0);
      this.mech.draw(ctx, livre.w, this.H, this);
      ctx.restore();

      // O painel de Resultados acompanha o tempo real da simulação,
      // com throttle de ~8x/s (rebuild de DOM a 60fps seria desperdício).
      if (!this._lastResultsRefresh || now - this._lastResultsRefresh > 120) {
        this._lastResultsRefresh = now;
        this.refresh();
      }

      this._fpsN++;
      if (now - this._fpsT > 500) {
        const el = document.getElementById('fps-counter');
        if (el) el.textContent = Math.round(this._fpsN * 1000 / (now - this._fpsT)) + ' fps';
        this._fpsN = 0; this._fpsT = now;
      }
    }
    requestAnimationFrame(() => this._loop());
  }
}

window.addEventListener('DOMContentLoaded', () => new App(new Mech(window.SIM_DATA)));

// ══════════════════════════════════════════════════════════════════
// MOBILE OFF-CANVAS — as duas sidebars viram gavetas em telas
// estreitas: a esquerda (menus e informações) desliza da esquerda e
// a direita (controles) desliza da direita. Botões próprios no
// header, backdrop compartilhado, Escape fecha, abrir uma fecha a outra.
// ══════════════════════════════════════════════════════════════════
