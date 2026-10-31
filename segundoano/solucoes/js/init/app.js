// ══════════════════════════════════════════════════════════════════
// APP — casco genérico da família de simuladores do 2º ano.
// Mesma usabilidade do SIMA/SITQ: acordeões, Alt+1–N,
// Enter/Espaço no canvas, gaveta mobile, resultados ao vivo.
// A mecânica específica vive na classe Mech (definida acima).
// ══════════════════════════════════════════════════════════════════
/** Preenche uma .opt-grid com botões a partir de itens dos dados. */
SISOL.fillOptGrid = function fillOptGrid(gridId, items, selValue) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  items.forEach(it => {
    const b = document.createElement('button');
    b.className = 'opt-btn' + (String(it.value) === String(selValue) ? ' active' : '');
    b.dataset.value = it.value;
    b.setAttribute('role', 'option');
    b.setAttribute('aria-selected', String(String(it.value) === String(selValue)));
    if (it.dot) {
      const d = document.createElement('span');
      d.className = 'opt-dot';
      d.style.setProperty('--dot', it.dot);
      b.appendChild(d);
    }
    const n = document.createElement('span');
    n.className = 'opt-nome';
    n.textContent = it.nome;
    b.appendChild(n);
    if (it.extra) {
      const x = document.createElement('span');
      x.className = 'opt-c';
      x.textContent = it.extra;
      b.appendChild(x);
    }
    if (it.aria) b.setAttribute('aria-label', it.aria);
    grid.appendChild(b);
  });
};
SISOL.App = class App {
  constructor(mech) {
    this.mech = mech;
    mech.app = this;
    this.D = window.SIM_DATA;
    this.time = 0;
    this._curio = 0;
    this._fpsN = 0;
    this._fpsT = 0;
    // Modos já vistos nesta sessão — controla se o resumo do modo, no
    // bottom sheet mobile, abre sozinho (1ª ativação) ou já vem recolhido
    // (ativações seguintes). Não persiste entre visitas de propósito.
    this._modosVistos = new Set();
    // Controla a "largada com antecipação" do gatilho de ativação — ver
    // setMode()/_loop(). 0 = física liberada (nenhuma pausa pendente).
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
    // visualViewport: cobre zoom por pinça (touch) e alguns zooms de
    // trackpad, que às vezes mudam só a escala visual sem disparar
    // resize/ResizeObserver (o self-heal por quadro no _loop já cobre
    // isso também, mas reagir ao evento evita 1 quadro de atraso).
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this._resize());
    }

    // mini-canvas do modo 4 (pvap): béquer+termômetro, fora do canvas central
    this.miniCanvas = document.getElementById('pvap-mini');
    this.miniCtx = this.miniCanvas ? this.miniCanvas.getContext('2d') : null;
    this._buildModes();
    this._buildModeTabsMobile();
    this._bindSidebar();
    this._bindModeIndicator();
    this._bindModeInfoModal();
    this._bindHeader();
    this._bindCanvasKeys();
    if (typeof mech.build === 'function') mech.build(this);

    // ── Estado inicial: NENHUM modo ativo — nada é desenhado no canvas
    //    até o usuário clicar em "Ativar" no painel do modo desejado
    //    (mesmo contrato do SILQ: canvas em branco por padrão). ──
    this.mode = null;
    document.querySelectorAll('.panel[data-owner]').forEach(p => {
      p.hidden = true;
    });
    const hint0 = document.getElementById('canvas-hint');
    if (hint0) hint0.textContent = 'Escolha um modo ao lado e clique em "Ativar" para iniciar a simulação.';
    this.refresh();
    SISOL.announce(`${this.D.ACRO} carregado. Nenhum modo ativo. Escolha um modo à esquerda e ative-o para começar.`);
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
    // ── escala do canvas (ver bloco ESCALA DO CANVAS, no topo) ──
    // patchCtxFont e idempotente (marca ctx._fontPatched), entao pode ser
    // chamado a cada resize sem empilhar interceptadores.
    SISOL.patchCtxFont(this.ctx);
    SISOL.CANVAS_FS = SISOL.canvasFS(this.W);
    this.lay = SISOL.layoutMode(this.W);
  }

  /* ── modos gerados de SIM_DATA.MODES: um .panel padrão por modo,
     igual a "Resultados" e às demais famílias (SICQ/SITERMO) —
     cabeçalho ícone+nome+sigla+seta que já expande/recolhe sozinho
     via _bindPanelArea, corpo com botão Ativar, definição, fatos-
     chave (incluindo a fórmula, que antes vivia num painel à parte),
     interação do canvas e dica final. #model-list é só o ponto de
     inserção do JS, não é uma caixa visual. ── */
  _buildModes() {
    const list = document.getElementById('model-list');
    this.D.MODES.forEach((m, i) => {
      const headerId = 'hdr-mode-' + m.id,
        bodyId = 'body-mode-' + m.id;
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
      header.innerHTML = `<span class="panel-icon" aria-hidden="true">${m.icon || '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2" /><path d="M8.5 2h7" /><path d="M14.5 16h-5" /></svg>'}</span>
        <span class="panel-label">${m.nome}</span>
        <span class="panel-badge">${m.sigla}</span>
        <span class="mode-active-tag">Ativo</span>
        <span class="chevron" aria-hidden="true">▾</span>`;
      const body = document.createElement('div');
      body.id = bodyId;
      body.className = 'panel-body collapsed';
      // PADRAO SILQ: corpo do painel como regiao nomeada pelo cabecalho.
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', headerId);
      const activateBtn = document.createElement('button');
      activateBtn.type = 'button';
      activateBtn.className = 'action-btn mode-activate-btn';
      // Toggle de estado -> aria-pressed (igual ao .bond-mode-btn do SILQ).
      activateBtn.setAttribute('aria-pressed', 'false');
      activateBtn.innerHTML = `<span aria-hidden="true"><svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" /></svg></span> Ativar ${m.nome}`;
      // TOGGLE — mesmo contrato do SILQ: clicar no modo JA ativo desativa e
      // devolve o simulador ao estado neutro (canvas em branco).
      activateBtn.addEventListener('click', () => {
        if (this.mode && this.mode.id === m.id) this.clearMode();else this.setMode(m.id);
      });
      // HINT DE HOVER — tooltip nativo, atualizado em setMode/clearMode.
      activateBtn.title = 'Ativar ' + m.nome + ' no canvas';
      body.appendChild(activateBtn);

      // definição curta = primeira frase de m.info; o restante vai pro
      // final do painel (hint-text), então nenhum texto original se perde
      const frases = (m.info || '').split(/(?<=\.)\s+/).filter(Boolean);
      if (frases.length) {
        const def = document.createElement('p');
        def.className = 'mode-define';
        def.textContent = frases[0];
        body.appendChild(def);
      }
      if (m.formula) {
        const grid = document.createElement('div');
        grid.className = 'fact-grid';
        const cells = [{
          l: 'Fórmula',
          v: m.formula
        }];
        if (m.hintCanvas) cells.push({
          l: 'Atalho',
          v: m.hintCanvas
        });
        cells.forEach(ft => {
          const cell = document.createElement('div');
          cell.className = 'fact-cell';
          cell.innerHTML = `<span class="fact-label">${ft.l}</span><span class="fact-value">${ft.v}</span>`;
          grid.appendChild(cell);
        });
        body.appendChild(grid);
      }
      if (m.formulaNote) {
        const note = document.createElement('p');
        note.className = 'energy-formula-note';
        note.textContent = m.formulaNote;
        body.appendChild(note);
      }
      if (m.hint) {
        const box = document.createElement('div');
        box.className = 'canvas-interactions';
        box.innerHTML = `<p class="canvas-interactions-title">Interações do canvas</p><p>${m.hint}</p>`;
        body.appendChild(box);
      }
      const resto = frases.slice(1).join(' ');
      const hint = document.createElement('p');
      hint.className = 'hint-text';
      hint.textContent = resto || m.sub || '';
      body.appendChild(hint);
      section.appendChild(header);
      section.appendChild(body);
      list.appendChild(section);
    });
  }

  /* ── barra de modos MOBILE — mesma ordem/dados de _buildModes() acima,
     só que como abas roláveis em vez de acordeão (ver CSS, ativa só
     abaixo de 1100px). Clicar chama setMode/clearMode, o MESMO contrato
     de sempre — a barra não tem lógica própria de estado, só delega. ── */
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
      tab.innerHTML = `<span aria-hidden="true">${m.icon || '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="stroke:none;fill:currentColor" width=".55em" height=".55em"><circle cx="12" cy="12" r="10" /></svg>'}</span><span>${m.nome}</span>`;
      tab.title = m.nome;
      tab.addEventListener('click', () => {
        if (this.mode && this.mode.id === m.id) this.clearMode();else this.setMode(m.id);
      });
      bar.appendChild(tab);
    });
  }

  /* ── resumo do modo, para dentro do bottom sheet mobile (definição +
     fatos-chave — a mesma informação que já existe no acordeão da
     sidebar esquerda, só que reduzida e em outro lugar, pensada pra
     leitura rápida no celular). Retorna string HTML pronta. ── */
  _modeSummaryHTML(m) {
    let html = '';
    if (m.def) html += `<p class="mode-define">${m.def}</p>`;
    if (m.fatos && m.fatos.length) {
      html += '<div class="fact-grid">' + m.fatos.map(ft =>
        `<div class="fact-cell"><span class="fact-label">${ft.l}</span><span class="fact-value">${ft.v}</span></div>`
      ).join('') + '</div>';
    }
    return html;
  }

  /* ── sincroniza a barra de modos e o resumo do bottom sheet com o modo
     ativo — chamada por setMode()/clearMode(), nunca sozinha. Segura
     mesmo se os elementos não existirem (desktop puro, ou simulador sem
     esse recurso ainda). ── */
  _syncMobileModeUI(id) {
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.setAttribute('aria-selected', tab.dataset.modeTab === id ? 'true' : 'false');
    });
    const activeTab = id && document.querySelector(`.mode-tab[data-mode-tab="${id}"]`);
    if (activeTab && typeof activeTab.scrollIntoView === 'function') {
      activeTab.scrollIntoView({ inline: 'center', block: 'nearest', behavior: SISOL.isReduced() ? 'auto' : 'smooth' });
    }
    const box = document.getElementById('mode-summary-mobile');
    const toggle = document.getElementById('mode-summary-toggle');
    const body = document.getElementById('mode-summary-body');
    if (!box || !toggle || !body) return;
    if (!id) { box.hidden = true; return; }
    const m = this.D.MODES.find(x => x.id === id);
    if (!m) { box.hidden = true; return; }
    box.hidden = false;
    body.innerHTML = this._modeSummaryHTML(m);
    // 1ª ativação do modo nesta sessão -> abre o MODAL (por cima de
    // tudo, força a leitura antes de simular). Nas ativações seguintes
    // o resumo já fica disponível dentro do bottom sheet, recolhido,
    // sem interromper de novo — o aluno abre manualmente pelo toggle
    // "Sobre este modo" se quiser reler.
    const primeiraVez = !this._modosVistos.has(id);
    this._modosVistos.add(id);
    toggle.setAttribute('aria-expanded', 'false');
    body.classList.remove('open');
    if (primeiraVez && window.innerWidth <= 1100) this._showModeInfoModal(m);
    if (!toggle._wired) {
      toggle._wired = true;
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!open));
        body.classList.toggle('open', !open);
      });
    }
  }

  /* ── MODAL de informações do modo (1ª ativação, mobile) ──
     Reaproveita _modeSummaryHTML(m) — o MESMO texto que aparece no
     "Sobre este modo" do bottom sheet — só muda a apresentação:
     aqui é um diálogo por cima de tudo, com foco automático no ✕
     para quem navega por teclado. ── */
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
    overlay.classList.add('aberto');
    overlay.setAttribute('aria-hidden', 'false');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 220);
  }
  _hideModeInfoModal() {
    const overlay = document.getElementById('modeInfoOverlay');
    if (!overlay) return;
    overlay.classList.remove('aberto');
    overlay.setAttribute('aria-hidden', 'true');
  }
  /* Fechamento: botão ✕, toque no fundo escurecido (fora da caixa) ou
     Esc — mesmo contrato do modal de elemento do SITP. Ligado uma
     única vez, no construtor. ── */
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

  /* ── DESATIVAR o modo — volta ao estado neutro, o mesmo em que o
     simulador abre (this.mode = null). Todo o resto do codigo ja trata
     esse caso: refresh(), o hint do canvas e os paineis por modo.
     Mesmo contrato de toggle do SILQ (setMode / clearMode). ── */
  clearMode() {
    this.mode = null;
    // Cancela qualquer "largada com antecipação" pendente do modo anterior
    // — sem isso, um setTimeout de 2s de um modo já desativado poderia
    // reescrever o hint do canvas por cima do texto neutro logo abaixo.
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
    document.querySelectorAll('.panel[data-owner]').forEach(p => {
      p.hidden = true;
    });
    const hint = document.getElementById('canvas-hint');
    if (hint) hint.textContent = 'Escolha um modo ao lado e clique em "Ativar" para iniciar a simulação.';
    // esconde a pilula do canvas — volta ao estado puro
    const ind0 = document.getElementById('mode-indicator');
    if (ind0) ind0.classList.remove('mode-on');
    if (this.mech && typeof this.mech.setMode === 'function') this.mech.setMode(null);
    this.refresh();
    this._syncMobileModeUI(null);
    if (typeof SISOL.playTone === 'function') SISOL.playTone(420, .06, .05);
    SISOL.announce('Modo desativado. Nenhum modo ativo — escolha um modo e ative-o para voltar a simular.');
  }
  setMode(id, silent) {
    const m = this.D.MODES.find(x => x.id === id);
    if (!m) return;
    this.mode = m;
    document.querySelectorAll('.panel[data-mode-card]').forEach(p => {
      const on = p.dataset.modeCard === id;
      p.classList.toggle('active', on);
      const h = p.querySelector('.panel-header');
      if (h) h.setAttribute('aria-current', on ? 'true' : 'false');
      // Espelha o estado no botao "Ativar" do modulo (padrao SILQ)
      const actBtn = p.querySelector('.mode-activate-btn');
      if (actBtn) {
        actBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        const nomeMod = (this.D.MODES.find(x => x.id === p.dataset.modeCard) || {}).nome || '';
        actBtn.title = on ? 'Desativar ' + nomeMod : 'Ativar ' + nomeMod + ' no canvas';
      }
      // Ao ativar, o painel se RECOLHE — o gatilho de ativação abre espaço
      // pro canvas, não pede pra continuar lendo a definição. Reabrir é um
      // clique no cabeçalho, a qualquer momento, inclusive com a
      // simulação já rodando.
      if (on) {
        if (h) h.setAttribute('aria-expanded', 'false');
        const body = p.querySelector('.panel-body');
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
    // estiver aberto) em vez de abri-lo — o gatilho libera o canvas
    // inteiro pra tela. Reabrir os controles pra ajustar parâmetros é um
    // toque no botão 🎛 do cabeçalho, a qualquer momento, inclusive com a
    // simulação já rodando.
    if (window.innerWidth <= 1100 && typeof window._closeSidebar === 'function') {
      window._closeSidebar();
    }
    // ── largada com 2s de antecipação ──
    // O ESTADO já foi montado (mech.setMode acima), então o canvas mostra
    // o quadro inicial "parado" imediatamente — só a FÍSICA (mech.update,
    // chamado em _loop) fica pausada por 2s, dando tempo de os controles
    // recolherem e o aluno olhar pro canvas antes de algo se mexer.
    if (this._modeStartTimer) clearTimeout(this._modeStartTimer);
    this._modeStartsAt = performance.now() + 2000;
    if (hint) hint.textContent = 'Iniciando em instantes…';
    this._modeStartTimer = setTimeout(() => {
      const h = document.getElementById('canvas-hint');
      if (h && this.mode && this.mode.id === id) h.textContent = m.hintCanvas || '';
    }, 2000);
    if (!silent) {
      SISOL.playTone(760, .06, .05);
      SISOL.announce(`Modo ${m.nome} selecionado. A animação começa em 2 segundos. ${(m.info || '').split('.')[0]}.`);
    }
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
    sb.addEventListener('click', e => {
      const hdr = e.target.closest('.panel-header');
      if (hdr) {
        const exp = hdr.getAttribute('aria-expanded') === 'true';
        hdr.setAttribute('aria-expanded', String(!exp));
        const body = document.getElementById(hdr.getAttribute('aria-controls'));
        if (body) body.classList.toggle('collapsed', exp);
        SISOL.playTone(exp ? 500 : 750, .06, .04);
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
    sb.addEventListener('input', e => {
      const t = e.target;
      if (t.matches('input[type="range"][data-bind]')) {
        const v = parseFloat(t.value);
        const out = document.getElementById('out-' + t.id);
        if (out) out.textContent = this.fmtOut(t, v);
        this._param(t.dataset.bind, v);
      }
    });
    sb.addEventListener('change', e => {
      if (e.target.matches('select[data-bind]')) this._param(e.target.dataset.bind, e.target.value);
    });
  }
  fmtOut(inp, v) {
    // 'data-pow' é um atributo booleano sem valor — no dataset ele vira
    // string vazia (""), que é FALSY em JS. Testar com "inp.dataset.pow ?"
    // nunca entra no ramo verdadeiro; é preciso checar a PRESENÇA do
    // atributo, não a veracidade do seu valor. (Correção replicada da versão
    // já certa em eletroquímica, unificada na refatoração do núcleo.)
    const ehLog = inp.hasAttribute('data-pow');
    const casas = inp.dataset.fmt === 'f2' ? 2 : inp.dataset.fmt === 'f1' ? 1 : 0;
    const val = ehLog ? Math.pow(10, v) : v;
    // Notação científica em vez de um número fixo de casas decimais:
    // um slider logarítmico varre várias ordens de grandeza (ex.: 10⁻⁸ a
    // 10⁰ mol/L no Kps), e um número fixo de casas arredondava valores
    // pequenos para "0" — escondendo a grandeza real da concentração.
    const txt = ehLog ? SISOL.fmtCientifico(val, 1) : SISOL.fmt(val, casas);
    return txt + (inp.dataset.unit ? ' ' + inp.dataset.unit : '');
  }
  _param(k, v) {
    const r = this.mech.setParam(k, v) || {};
    if (r.warn) SISOL.announce(r.warn, 'assertive');
    if (r.say) SISOL.announce(r.say);
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
        // Nenhum modo ativo: painel de Análise fica com aviso neutro,
        // igual ao "Clique em elementos..." do SILQ antes de qualquer ação.
        const p = document.createElement('p');
        p.className = 'hint-text';
        p.textContent = 'Ative um modo à esquerda para ver aqui a análise dos resultados.';
        grid.appendChild(p);
      } else {
        (this.mech.getResults() || []).forEach(r => {
          const row = document.createElement('div');
          row.className = 'data-row';
          const dt = document.createElement('dt');
          dt.className = 'data-label';
          dt.textContent = r.l;
          const dd = document.createElement('dd');
          dd.className = 'data-value' + (r.cls ? ' ' + r.cls : '');
          dd.textContent = r.v;
          row.append(dt, dd);
          grid.appendChild(row);
        });
      }
    }
    if (resultPanel) resultPanel.classList.toggle('panel--waiting', !this.mode);
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
        const detalhe = this.mech.getOverlay && this.mech.getOverlay() || this.mode.overlay || '';
        if (detalhe && detalhe !== this.mode.nome) {
          const sp = document.createElement('span');
          sp.className = 'overlay-detail';
          sp.textContent = ' · ' + detalhe;
          ovTxt.appendChild(sp);
        }
      }
      if (ovIco) ovIco.innerHTML = this.mode.icon || '';
    }
  }

  /* ── header: pausa + curiosidades ── */
  _bindHeader() {
    const logo = document.getElementById('btn-app-logo');
    if (logo) logo.addEventListener('click', () => {
      const c = this.D.CURIOSIDADES;
      if (!c || !c.length) return;
      const fato = c[this._curio++ % c.length];
      SISOL.playTone(660, .09, .06);
      SISOL.announce('Você sabia? ' + fato);
    });
    document.addEventListener('keydown', e => {
      if (!e.altKey) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= this.D.MODES.length) {
        e.preventDefault();
        this.setMode(this.D.MODES[n - 1].id);
      }
    });
  }

  /* ── teclado no canvas: Enter/Espaço = ação primária; setas → mech ── */
  _bindCanvasKeys() {
    this.canvas.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (this.mode && this.mode.primary) {
          this.mech.action(this.mode.primary);
          this.refresh();
        }
      } else if (this.mode && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && this.mech.onArrow) {
        const dx = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
        const dy = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
        if (this.mech.onArrow(dx, dy)) {
          e.preventDefault();
          this.refresh();
        }
      }
    });
    if (this.mech.onDrag) {
      let drag = false,
        lx = 0,
        ly = 0;
      this.canvas.addEventListener('pointerdown', e => {
        drag = true;
        lx = e.clientX;
        ly = e.clientY;
        this.canvas.setPointerCapture(e.pointerId);
      });
      this.canvas.addEventListener('pointermove', e => {
        if (!drag) return;
        this.mech.onDrag(e.clientX - lx, e.clientY - ly);
        lx = e.clientX;
        ly = e.clientY;
      });
      const up = () => {
        drag = false;
      };
      this.canvas.addEventListener('pointerup', up);
      this.canvas.addEventListener('pointercancel', up);
    }
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
    const dt = SISOL.clamp((now - this._last) / 1000, 0, .05);
    this._last = now;

    // Auto-correção de tamanho: ResizeObserver e window.resize cobrem
    // a maioria dos casos, mas existem formas de zoom (escala do
    // Windows, certos gestos de zoom) que mudam devicePixelRatio SEM
    // alterar o layout CSS — nesse caso o tamanho em CSS px continua
    // igual e só comparar boundingClientRect não pega a mudança.
    // Por isso comparamos os DOIS: tamanho CSS e devicePixelRatio.
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
      this._fpsN++;
      if (now - this._fpsT > 500) {
        const el = document.getElementById('fps-counter');
        if (el) el.textContent = Math.round(this._fpsN * 1000 / (now - this._fpsT)) + ' fps';
        this._fpsN = 0;
        this._fpsT = now;
      }
    }
    requestAnimationFrame(() => this._loop());
  }
};
window.addEventListener('DOMContentLoaded', () => new SISOL.App(new SISOL.Mech(window.SIM_DATA)));