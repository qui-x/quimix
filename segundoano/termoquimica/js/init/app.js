SITQ.MODOS_ORDEM = ['calor', 'curva', 'perfil', 'hess', 'ligacao', 'gibbs'];
SITQ.PAINEIS_POR_MODO = {
  calor: ['panel-calor', 'panel-controles'],
  curva: ['panel-curva'],
  perfil: ['panel-perfil'],
  hess: ['panel-hess'],
  ligacao: ['panel-ligacao', 'panel-tabela'],
  gibbs: ['panel-gibbs']
};
SITQ.HINT_CANVAS = {
  calor: 'Enter/Espaço: trocar calor',
  curva: 'Enter/Espaço: aquecer',
  perfil: 'Enter/Espaço: reproduzir a reação',
  hess: 'Enter/Espaço: somar as equações',
  ligacao: 'Arraste (ou setas ←→↑↓) para girar em 3D',
  gibbs: 'Setas ← → movem a temperatura; Enter/Espaço vai à T de inversão'
};
SITQ.ThermoApp = class ThermoApp {
  constructor() {
    this.canvas = document.getElementById('sim-canvas');
    this.sim = new SITQ.ThermoSim(this.canvas, ev => this._onSimEvent(ev));
    this.mode = 'calor';

    // Lei de Hess — operações do estudante sobre cada etapa
    this.hessIdx = 0;
    this.hessOps = [];
    this.hessSolved = false;
    this._buildSubstancias();
    this._syncCalorFaixa(SUBSTANCIAS[0]);
    this._buildCurvaSubstancias();
    this._syncCurvaFaixa(CURVA_SUBSTANCIAS[0], true);
    this._buildPerfilList();
    this._buildLigacaoList();
    this._buildGibbsList();
    this._buildBondTable();
    this._buildHessSelect();
    this._renderHess(0);
    this._bindPanels();
    this._bindModes();
    this._bindModeIndicator();
    this._bindCalor();
    this._bindCurva();
    this._bindPerfil();
    this._bindHess();
    this._bindLigacao();
    this._bindGibbs();
    this._bindGlobal();

    // ── Estado inicial: NENHUM modo ativo — nada é desenhado no canvas
    //    até o usuário clicar em "Ativar" no painel do modo desejado
    //    (mesmo contrato do SILQ: canvas em branco por padrão). ──
    this.started = false;
    document.querySelectorAll('[data-mode]').forEach(b => {
      b.classList.remove('active');
      // aria-pressed (nao aria-selected): o botao "Ativar" e um toggle,
      // nao um item de lista de opcoes. Mesmo contrato do SILQ.
      b.setAttribute('aria-pressed', 'false');
    });
    Object.values(SITQ.PAINEIS_POR_MODO).flat().forEach(id => {
      const p = document.getElementById(id);
      if (p) p.hidden = true;
    });
    document.querySelectorAll('.panel[data-mode-card]').forEach(panel => {
      const header = panel.querySelector('.panel-header');
      if (header) {
        header.removeAttribute('aria-current');
        header.setAttribute('aria-expanded', 'false');
      }
      const body = panel.querySelector('.panel-body');
      if (body) body.classList.add('collapsed');
    });
    const hint0 = document.getElementById('canvas-hint');
    if (hint0) hint0.textContent = 'Escolha um modo ao lado e clique em "Ativar" para iniciar a simulação.';
    const ind0 = document.getElementById('mode-indicator');
    if (ind0) ind0.classList.remove('mode-on');
    this.refreshResults();
    this.sim.resize();
    window.addEventListener('resize', () => this.sim.resize());
    // ResizeObserver: cobre qualquer mudança de tamanho da área de
    // desenho (arrastar o redimensionador do sidebar, abrir/fechar a
    // gaveta mobile, rotacionar o aparelho, zoom) — não só resize da
    // janela do navegador, que é o único evento que window.resize cobre.
    const wrap = this.canvas.closest('.canvas-wrap');
    if (wrap && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.sim.resize()).observe(wrap);
    }
    // visualViewport: cobre zoom por pinça (touch) e alguns zooms de
    // trackpad, que às vezes mudam só a escala visual sem disparar
    // resize/ResizeObserver (o self-heal por quadro no _loop já cobre
    // isso também, mas reagir ao evento evita 1 quadro de atraso).
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.sim.resize());
    }
    SITQ.announce('SITQ carregado. Nenhum modo ativo. Escolha um modo à esquerda e ative-o para começar.');
    this._frames = 0;
    this._fpsT = 0;
    this._last = performance.now();
    requestAnimationFrame(() => this._loop());
  }

  /* ── construção das listas a partir dos DADOS ────────────────── */
  _buildSubstancias() {
    const grid = document.getElementById('subst-grid');
    SUBSTANCIAS.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'subst-btn' + (i === 0 ? ' active' : '');
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.style.setProperty('--dot', s.cor);
      b.innerHTML = `<span class="subst-dot" aria-hidden="true"></span>` + `<span class="subst-nome">${s.nome}</span>` + `<span class="subst-c">${SITQ.fmt(s.c, 3)}</span>`;
      b.setAttribute('aria-label', `${s.nome}, calor específico ${SITQ.fmt(s.c, 3)} joules por grama grau Celsius`);
      b.addEventListener('click', () => {
        grid.querySelectorAll('.subst-btn').forEach(x => {
          x.classList.remove('active');
          x.setAttribute('aria-selected', 'false');
        });
        b.classList.add('active');
        b.setAttribute('aria-selected', 'true');
        this.sim.calor.sub = s;
        this.sim.calor.fired = false;
        this._syncCalorFaixa(s);
        SITQ.playTone(760, .06, .05);
        this._syncOverlay();
        this.refreshResults();
        SITQ.announce(`${s.nome} selecionada. Calor específico: ${SITQ.fmt(s.c, 3)} joule por grama grau Celsius.` + (s.faixa ? ` Controles de temperatura ajustados para ${SITQ.fmt(s.faixa[0], 0)} a ${SITQ.fmt(s.faixa[1], 0)} graus, faixa onde essa fase existe a 1 atmosfera.` : ''));
      });
      grid.appendChild(b);
    });
  }

  /**
   * Ajusta min/max dos sliders T inicial/final à faixa onde a
   * substância escolhida REALMENTE está na fase indicada (a 1 atm) —
   * evita, por exemplo, "esfriar água líquida" a −20 °C. Sem faixa
   * definida (metais, vidro, areia, óleo), os controles usam o
   * intervalo padrão do simulador (PHYS.T_MIN…T_MAX).
   *
   * Água e etanol têm dados COMPLETOS de mudança de fase (ver
   * CURVA_SUBSTANCIAS) — para essas duas, os controles liberam a
   * faixa AMPLA (faixaPadrao) em vez da faixa de uma única fase, e o
   * béquer passa a mostrar a transição de verdade (sólido↔líquido↔
   * vapor, com coexistência nos patamares) em vez de ficar travado
   * numa fase só. As demais substâncias continuam exatamente como
   * antes (uma fase só, sem dados de calor latente disponíveis).
   */
  _syncCalorFaixa(sub) {
    const fasesDados = CURVA_SUBSTANCIAS.find(c => c.id === sub.id) || null;
    const [fmin, fmax] = fasesDados ? fasesDados.faixaPadrao : sub.faixa || [PHYS.T_MIN, PHYS.T_MAX];
    const tiEl = document.getElementById('calor-ti');
    const tfEl = document.getElementById('calor-tf');
    const outTi = document.getElementById('out-calor-ti');
    const outTf = document.getElementById('out-calor-tf');
    tiEl.min = fmin;
    tiEl.max = fmax;
    tfEl.min = fmin;
    tfEl.max = fmax;
    const ti = SITQ.clamp(+tiEl.value, fmin, fmax);
    const tf = SITQ.clamp(+tfEl.value, fmin, fmax);
    tiEl.value = ti;
    tfEl.value = tf;
    if (outTi) outTi.textContent = `${SITQ.fmt(ti, 0)} °C`;
    if (outTf) outTf.textContent = `${SITQ.fmt(tf, 0)} °C`;
    const st = this.sim.calor;
    st.sub = sub; // esta função agora é autossuficiente: define a substância ela mesma
    st.fasesDados = fasesDados;
    st.Ti = ti;
    st.Tf = tf;
    st.Tcur = ti;
    st.fired = false;
    st.running = false;
    st.phase = 1;
    st.Qcur = 0;
    st.segs = [];
  }

  /** Botões de substância do modo Curva (por ora, água e etanol — cada uma com seu próprio P.F./P.E.). */
  _buildCurvaSubstancias() {
    const grid = document.getElementById('curva-subst-grid');
    if (!grid) return;
    CURVA_SUBSTANCIAS.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'subst-btn' + (i === 0 ? ' active' : '');
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.style.setProperty('--dot', s.cor);
      b.innerHTML = `<span class="subst-dot" aria-hidden="true"></span>` + `<span class="subst-nome">${s.nome}</span>` + `<span class="subst-c">${SITQ.fmt(s.Tfusao, 0)}…${SITQ.fmt(s.Tebulicao, 0)} °C</span>`;
      b.setAttribute('aria-label', `${s.nome}: funde a ${SITQ.fmt(s.Tfusao, 0)} graus, ferve a ${SITQ.fmt(s.Tebulicao, 0)} graus`);
      b.addEventListener('click', () => {
        grid.querySelectorAll('.subst-btn').forEach(x => {
          x.classList.remove('active');
          x.setAttribute('aria-selected', 'false');
        });
        b.classList.add('active');
        b.setAttribute('aria-selected', 'true');
        SITQ.playTone(760, .06, .05);
        this._syncCurvaFaixa(s);
        this._syncOverlay();
        SITQ.announce(`${s.nome} selecionada na curva de aquecimento. Funde a ${SITQ.fmt(s.Tfusao, 0)} graus, ferve a ${SITQ.fmt(s.Tebulicao, 0)} graus Celsius.`);
      });
      grid.appendChild(b);
    });
  }

  /**
   * Ajusta min/max dos sliders T inicial/final à faixaPadrao da
   * substância escolhida na Curva — cada uma tem P.F./P.E. bem
   * diferentes (água: 0/100 °C; etanol: −114/78 °C), então uma faixa
   * fixa de slider não serve pras duas. Ao contrário do Calorímetro,
   * aqui a faixa inclui DE PROPÓSITO os dois pontos de transição, já
   * que o objetivo do modo é justamente atravessá-los.
   */
  _syncCurvaFaixa(sub, inicial) {
    const [fmin, fmax] = sub.faixaPadrao;
    const tiEl = document.getElementById('curva-ti');
    const tfEl = document.getElementById('curva-tf');
    const outTi = document.getElementById('out-curva-ti');
    const outTf = document.getElementById('out-curva-tf');
    tiEl.min = fmin;
    tiEl.max = fmax;
    tfEl.min = fmin;
    tfEl.max = fmax;
    const ti = inicial ? fmin : SITQ.clamp(+tiEl.value, fmin, fmax);
    const tf = inicial ? fmax : SITQ.clamp(+tfEl.value, fmin, fmax);
    tiEl.value = ti;
    tfEl.value = tf;
    if (outTi) outTi.textContent = `${SITQ.fmt(ti, 0)} °C`;
    if (outTf) outTf.textContent = `${SITQ.fmt(tf, 0)} °C`;
    const st = this.sim.curva;
    st.sub = sub;
    st.Ti = ti;
    st.Tf = tf;
    st.Qcur = 0;
    st.running = false;
    st.done = false;
    this.sim.buildCurva();
    if (!inicial) {
      this.refreshResults();
    }
    const hint = document.getElementById('curva-hint');
    if (hint) {
      hint.textContent = `Aqueça ${sub.nome.toLowerCase()} do sólido ao vapor e observe os dois patamares — fusão (${SITQ.fmt(sub.Tfusao, 0)} °C) e ebulição (${SITQ.fmt(sub.Tebulicao, 0)} °C) — onde a temperatura não muda, mas as duas fases coexistem.`;
    }
  }
  _buildPerfilList() {
    const list = document.getElementById('perfil-list');
    REACOES_PERFIL.forEach((r, i) => {
      const b = document.createElement('button');
      b.className = 'model-btn' + (i === 0 ? ' active' : '');
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.innerHTML = `<span class="model-year" aria-hidden="true">${r.tipo === 'exo' ? 'EXO' : 'ENDO'}<br>${SITQ.fmt(r.dH, 0)} kJ</span>` + `<span class="model-name">${r.nome}</span>` + `<span class="model-sub">${r.eq}</span>`;
      b.setAttribute('aria-label', `${r.nome}. ${r.tipo === 'exo' ? 'Exotérmica' : 'Endotérmica'}, delta H ${SITQ.fmt(r.dH, 1)} quilojoules.`);
      b.addEventListener('click', () => {
        list.querySelectorAll('.model-btn').forEach(x => {
          x.classList.remove('active');
          x.setAttribute('aria-selected', 'false');
        });
        b.classList.add('active');
        b.setAttribute('aria-selected', 'true');
        this.sim.perfil.r = r;
        this.sim.perfil.t = 0;
        this.sim.perfil.playing = false;
        this.sim.perfil.done = false;
        this.sim.perfil.burst = [];
        SITQ.playTone(r.tipo === 'exo' ? 620 : 980, .07, .06);
        this._syncOverlay();
        document.getElementById('perfil-desc').textContent = r.desc;
        this.refreshResults();
        SITQ.announce(`${r.nome} selecionada. ${r.desc}`);
      });
      list.appendChild(b);
    });
    document.getElementById('perfil-desc').textContent = REACOES_PERFIL[0].desc;
  }
  _buildLigacaoList() {
    const list = document.getElementById('ligacao-list');
    REACOES_LIGACAO.forEach((r, i) => {
      const b = document.createElement('button');
      b.className = 'model-btn' + (i === 0 ? ' active' : '');
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.innerHTML = `<span class="model-year" aria-hidden="true">3D</span>` + `<span class="model-name">${r.nome}</span>` + `<span class="model-sub">${r.sub}</span>`;
      b.addEventListener('click', () => {
        list.querySelectorAll('.model-btn').forEach(x => {
          x.classList.remove('active');
          x.setAttribute('aria-selected', 'false');
        });
        b.classList.add('active');
        b.setAttribute('aria-selected', 'true');
        this.sim.lig.r = r;
        SITQ.playTone(880, .07, .06);
        this._syncOverlay();
        document.getElementById('ligacao-obs').textContent = r.obs;
        this.refreshResults();
        SITQ.announce(`${r.nome} selecionada: ${r.sub}. ${r.obs}`);
      });
      list.appendChild(b);
    });
    document.getElementById('ligacao-obs').textContent = REACOES_LIGACAO[0].obs;
  }

  /** Lista de reações do modo Espontaneidade. Cada cartão mostra de saída os
   *  DOIS sinais (ΔH e ΔS), porque é o par de sinais — e não cada um deles —
   *  que decide o comportamento. */
  _buildGibbsList() {
    const list = document.getElementById('gibbs-list');
    if (!list) return;
    REACOES_GIBBS.forEach((r, i) => {
      const b = document.createElement('button');
      b.className = 'model-btn' + (i === 0 ? ' active' : '');
      b.setAttribute('role', 'option');
      b.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      b.innerHTML = `<span class="model-year" aria-hidden="true">ΔH ${r.dH > 0 ? '+' : '−'}<br>ΔS ${r.dS > 0 ? '+' : '−'}</span>` + `<span class="model-name">${r.nome}</span>` + `<span class="model-sub">${r.eq}</span>`;
      b.setAttribute('aria-label', `${r.nome}. Delta H de ${SITQ.fmt(r.dH, 1)} quilojoules por mol, delta S de ${SITQ.fmt(r.dS, 1)} joules por mol kelvin.`);
      b.addEventListener('click', () => {
        list.querySelectorAll('.model-btn').forEach(x => {
          x.classList.remove('active');
          x.setAttribute('aria-selected', 'false');
        });
        b.classList.add('active');
        b.setAttribute('aria-selected', 'true');
        this.sim.gibbs.r = r;
        SITQ.playTone(r.dH < 0 ? 620 : 980, .07, .06);
        this._syncOverlay();
        const desc = document.getElementById('gibbs-desc');
        if (desc) desc.textContent = r.desc;
        this.refreshResults();
        const c = this.sim.gibbsCalc();
        SITQ.announce(`${r.nome} selecionada. ${c.caso}: ${c.regra}. A 25 graus, delta G vale ${SITQ.fmt(c.dG, 1)} quilojoules, ou seja, ${c.espontanea ? 'espontânea' : 'não espontânea'}. ${r.desc}`);
      });
      list.appendChild(b);
    });
    const desc0 = document.getElementById('gibbs-desc');
    if (desc0) desc0.textContent = REACOES_GIBBS[0].desc;
  }
  _bindGibbs() {
    const sl = document.getElementById('gibbs-t');
    if (sl) {
      sl.addEventListener('input', () => {
        this.sim.gibbs.T = +sl.value;
        const out = document.getElementById('out-gibbs-t');
        if (out) out.textContent = `${SITQ.fmt(+sl.value, 0)} K (${SITQ.fmt(+sl.value - 273.15, 0)} °C)`;
        this._syncOverlay();
        this.refreshResults();
      });
    }
    const btnInv = document.getElementById('gibbs-inversao');
    if (btnInv) btnInv.addEventListener('click', () => this._gibbsIrInversao());
    const btn25 = document.getElementById('gibbs-25');
    if (btn25) btn25.addEventListener('click', () => {
      this._gibbsSetT(298.15);
      SITQ.announce('Temperatura de volta a 298 kelvin, ou 25 graus Celsius — a condição padrão de tabela.');
    });
  }
  _gibbsSetT(T) {
    this.sim.gibbs.T = SITQ.clamp(T, 1, 1500);
    const sl = document.getElementById('gibbs-t');
    if (sl) sl.value = this.sim.gibbs.T;
    const out = document.getElementById('out-gibbs-t');
    if (out) out.textContent = `${SITQ.fmt(this.sim.gibbs.T, 0)} K (${SITQ.fmt(this.sim.gibbs.T - 273.15, 0)} °C)`;
    this._syncOverlay();
    this.refreshResults();
  }

  /** Leva a temperatura exatamente ao ponto onde ΔG = 0. Quando a reação não
   *  tem inversão (ΔH e ΔS de sinais opostos), diz POR QUE não tem — é uma das
   *  duas conclusões que o modo existe para ensinar. */
  _gibbsIrInversao() {
    const c = this.sim.gibbsCalc();
    if (!c.temInversao) {
      SITQ.playTone(300, .12, .06);
      return SITQ.announce(`Esta reação não tem temperatura de inversão. ΔH e ΔS têm sinais OPOSTOS, então a reta de ΔG nunca cruza o zero: o comportamento é o mesmo em qualquer temperatura — ${c.regra}.`, 'assertive');
    }
    if (c.Tinv > 1500 || c.Tinv < 1) {
      SITQ.playTone(420, .1, .06);
      return SITQ.announce(`A temperatura de inversão desta reação é ${SITQ.fmt(c.Tinv, 0)} kelvin, fora da faixa do controle (1 a 1500 kelvin). Na prática, isso significa que dentro de qualquer temperatura razoável ela é sempre ${c.espontanea ? 'espontânea' : 'não espontânea'}.`, 'assertive');
    }
    this._gibbsSetT(c.Tinv);
    SITQ.playTone(760, .09, .06);
    const d = this.sim.gibbsCalc();
    SITQ.announce(`Temperatura levada a ${SITQ.fmt(c.Tinv, 0)} kelvin, ou ${SITQ.fmt(c.Tinv - 273.15, 0)} graus Celsius: aqui ΔG vale ${SITQ.fmt(d.dG, 2)} quilojoules, praticamente zero. É o ponto de equilíbrio, em que o termo entálpico e o entrópico se cancelam. Abaixo dele o processo é espontâneo num sentido; acima, no sentido inverso.`, 'assertive');
  }
  _buildBondTable() {
    const tb = document.getElementById('bond-table');
    Object.entries(ENERGIA_LIGACAO).forEach(([lig, e]) => {
      const s = document.createElement('span');
      s.innerHTML = `${lig} <b>${e}</b>`;
      tb.appendChild(s);
    });
  }
  _buildHessSelect() {
    const wrap = document.getElementById('hess-select');
    HESS.forEach((ex, i) => {
      const b = document.createElement('button');
      b.className = 'shell-btn';
      b.textContent = ex.titulo;
      b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', () => {
        wrap.querySelectorAll('.shell-btn').forEach(x => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        SITQ.playTone(700, .06, .05);
        this._renderHess(i);
        SITQ.announce(`Exercício: ${ex.titulo}. Alvo: ${ex.alvo}. ${ex.dica}`);
      });
      wrap.appendChild(b);
    });
  }

  /* ── Lei de Hess: montagem/estado do exercício atual ─────────── */
  _renderHess(i) {
    this.hessIdx = i;
    const ex = HESS[i];
    this.hessOps = ex.passos.map(() => ({
      inv: false,
      mult: 1
    }));
    this.hessSolved = false;
    this.sim.hess.ex = ex;
    this.sim.hess.solved = false;
    this.sim.hess.flash = 0;
    this.canvas.classList.remove('sim-canvas--ok');
    document.getElementById('hess-dica').textContent = '💡 ' + ex.dica;
    this._setHessStatus('aguardando', '');
    this._renderHessAlvo();
    const cont = document.getElementById('hess-steps');
    cont.innerHTML = '';
    ex.passos.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'hess-step';
      const eq = document.createElement('p');
      eq.className = 'hess-eq';
      eq.innerHTML = `<span class="rot">${p.rot}.</span>${p.eq}   <span class="dh">ΔH = ${SITQ.fmt(p.dH, 1)} kJ</span>`;
      card.appendChild(eq);
      const ops = document.createElement('div');
      ops.className = 'hess-ops';
      const inv = document.createElement('button');
      inv.className = 'shell-btn';
      inv.textContent = '⇄ inverter';
      inv.setAttribute('aria-pressed', 'false');
      inv.setAttribute('aria-label', `Inverter a equação ${p.rot} (troca o sinal do delta H)`);
      inv.addEventListener('click', () => {
        this.hessOps[idx].inv = !this.hessOps[idx].inv;
        inv.setAttribute('aria-pressed', String(this.hessOps[idx].inv));
        card.classList.add('tocada');
        SITQ.playTone(this.hessOps[idx].inv ? 500 : 640, .06, .05);
        this._hessChanged();
      });
      ops.appendChild(inv);
      const lbl = document.createElement('span');
      lbl.className = 'op-label';
      lbl.textContent = '×';
      ops.appendChild(lbl);
      const seg = document.createElement('div');
      seg.className = 'seg';
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-label', `Multiplicador da equação ${p.rot}`);
      HESS_MULTS.forEach(m => {
        const sb = document.createElement('button');
        sb.className = 'seg-btn';
        sb.textContent = m === 0.5 ? '½' : String(m);
        sb.setAttribute('aria-pressed', m === 1 ? 'true' : 'false');
        sb.addEventListener('click', () => {
          this.hessOps[idx].mult = m;
          seg.querySelectorAll('.seg-btn').forEach(x => x.setAttribute('aria-pressed', 'false'));
          sb.setAttribute('aria-pressed', 'true');
          card.classList.add('tocada');
          SITQ.playTone(760, .05, .05);
          this._hessChanged();
        });
        seg.appendChild(sb);
      });
      ops.appendChild(seg);
      const contrib = document.createElement('span');
      contrib.className = 'hess-contrib';
      contrib.id = `hess-contrib-${idx}`;
      ops.appendChild(contrib);
      card.appendChild(ops);
      cont.appendChild(card);
    });
    this._hessChanged(true);
    this.refreshResults();
    this._syncOverlay();
  }
  _hessContribui(idx) {
    const ex = HESS[this.hessIdx];
    const op = this.hessOps[idx];
    return ex.passos[idx].dH * op.mult * (op.inv ? -1 : 1);
  }
  _hessSoma() {
    return this.hessOps.reduce((s, _, i) => s + this._hessContribui(i), 0);
  }
  _hessChanged(silencioso) {
    const soma = this._hessSoma();
    this.sim.hess.soma = soma;
    this.hessOps.forEach((_, i) => {
      const el = document.getElementById(`hess-contrib-${i}`);
      if (el) el.textContent = `→ ${SITQ.fmt(this._hessContribui(i), 1)} kJ`;
    });
    document.getElementById('hess-sum-val').textContent = `${SITQ.fmt(soma, 1)} kJ`;
    // qualquer alteração invalida os marcadores ✓/✗ da última conferência
    document.querySelectorAll('#hess-steps .hess-step').forEach(c => c.classList.remove('passo-ok', 'passo-errado'));
    if (!silencioso && this.hessSolved) {
      // mexeu depois de acertar: volta ao estado de montagem
      this.hessSolved = false;
      this.sim.hess.solved = false;
      this.canvas.classList.remove('sim-canvas--ok');
      this._setHessStatus('aguardando', '');
      this._renderHessAlvo();
    }
    this.refreshResults();
  }
  _renderHessAlvo() {
    const ex = HESS[this.hessIdx];
    const el = document.getElementById('hess-alvo-eq');
    el.innerHTML = '';
    el.append(ex.alvo + '   ');
    const b = document.createElement('b');
    b.textContent = this.hessSolved ? `ΔH = ${SITQ.fmt(ex.resposta, 1)} kJ` : 'ΔH = ?';
    el.appendChild(b);
  }
  _setHessStatus(txt, cls) {
    const el = document.getElementById('hess-status');
    el.textContent = txt;
    el.className = 'status-badge' + (cls ? ' ' + cls : '');
  }
  _hessCheck() {
    const ex = HESS[this.hessIdx];
    const passoOk = ex.solucao.map((s, i) => s.inv === this.hessOps[i].inv && Math.abs(s.mult - this.hessOps[i].mult) < 1e-9);
    const ok = passoOk.every(Boolean);
    const cards = document.querySelectorAll('#hess-steps .hess-step');
    cards.forEach((card, i) => {
      card.classList.remove('passo-ok', 'passo-errado');
      if (!ok) card.classList.add(passoOk[i] ? 'passo-ok' : 'passo-errado');
    });
    if (ok) {
      this.hessSolved = true;
      this.sim.hess.solved = true;
      this._setHessStatus('correto ✔', 'ok');
      this._renderHessAlvo();
      this.canvas.classList.add('sim-canvas--ok');
      clearTimeout(this._okT);
      this._okT = setTimeout(() => this.canvas.classList.remove('sim-canvas--ok'), 2600);
      SITQ.playTone(660, .09, .07);
      setTimeout(() => SITQ.playTone(880, .12, .07), 110);
      SITQ.announce(`Correto! Pela Lei de Hess, o ΔH da reação-alvo é ${SITQ.fmt(ex.resposta, 1)} quilojoules.`, 'assertive');
    } else {
      this.sim.hess.flash = 1.2;
      this._setHessStatus('ainda não', 'err');
      SITQ.playTone(300, .12, .06);
      const revisar = passoOk.map((k, i) => k ? null : ex.passos[i].rot).filter(Boolean);
      const msgPassos = revisar.length ? ` Revise a etapa ${revisar.join(', ')} (marcada em vermelho).` : '';
      SITQ.announce(`A combinação ainda não reproduz a equação-alvo. Σ atual: ${SITQ.fmt(this._hessSoma(), 1)} kJ.${msgPassos} Dica: ${ex.dica}`, 'assertive');
    }
    this.refreshResults();
  }
  _hessSolucao() {
    const ex = HESS[this.hessIdx];
    this._renderHess(this.hessIdx);
    ex.solucao.forEach((s, i) => {
      this.hessOps[i] = {
        inv: s.inv,
        mult: s.mult
      };
    });
    // reflete nos controles
    const cards = document.querySelectorAll('#hess-steps .hess-step');
    cards.forEach((card, i) => {
      card.classList.add('tocada');
      card.querySelector('.shell-btn').setAttribute('aria-pressed', String(ex.solucao[i].inv));
      const segs = card.querySelectorAll('.seg-btn');
      segs.forEach((sb, k) => sb.setAttribute('aria-pressed', String(HESS_MULTS[k] === ex.solucao[i].mult)));
    });
    this._hessChanged(true);
    this.hessSolved = true;
    this.sim.hess.solved = true;
    this._setHessStatus('solução aplicada', 'ok');
    this._renderHessAlvo();
    this.refreshResults();
    SITQ.announce(`Solução aplicada. ${ex.dica} Resultado: ΔH = ${SITQ.fmt(ex.resposta, 1)} quilojoules.`);
  }

  /* ── vínculos de interface ───────────────────────────────────── */
  _bindPanels() {
    document.querySelectorAll('.panel-header').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!expanded));
        const body = document.getElementById(btn.getAttribute('aria-controls'));
        if (body) body.classList.toggle('collapsed', expanded);
        SITQ.playTone(expanded ? 500 : 750, .06, .04);
      });
    });
  }

  /* Botao ✕ da pilula do canvas — desativa o modo, mesmo papel do
     #bond-mode-indicator-clear do SILQ. */
  _bindModeIndicator() {
    const btn = document.getElementById('overlay-clear');
    if (btn) btn.addEventListener('click', () => this.clearMode());
  }
  _bindModes() {
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.title = 'Ativar ' + (MODO_NOME[btn.dataset.mode] || '') + ' no canvas';
      btn.addEventListener('click', () => {
        // TOGGLE — mesmo contrato do SILQ: clicar no modo JA ativo desativa.
        if (this.started && this.mode === btn.dataset.mode) {
          SITQ.playTone(420, .06, .05);
          this.clearMode();
        } else {
          SITQ.playTone(880, .08, .07);
          this.setMode(btn.dataset.mode);
        }
      });
    });
  }

  /* ── DESATIVAR o modo — volta ao estado neutro em que o simulador abre
     (this.started = false, canvas em branco). Mesmo contrato de toggle do
     SILQ (setMode / clearMode). ── */
  clearMode() {
    this.started = false;
    this.mode = null;
    this.sim.mode = null;
    document.querySelectorAll('[data-mode]').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
      b.title = 'Ativar ' + (MODO_NOME[b.dataset.mode] || '') + ' no canvas';
    });
    Object.values(SITQ.PAINEIS_POR_MODO).flat().forEach(id => {
      const p = document.getElementById(id);
      if (p) p.hidden = true;
    });
    document.querySelectorAll('.panel[data-mode-card]').forEach(panel => {
      const header = panel.querySelector('.panel-header');
      if (header) header.removeAttribute('aria-current');
    });
    const hint = document.getElementById('canvas-hint');
    if (hint) hint.textContent = 'Escolha um modo ao lado e clique em "Ativar" para iniciar a simulação.';
    const indC = document.getElementById('mode-indicator');
    if (indC) indC.classList.remove('mode-on');
    this._syncOverlay();
    this.refreshResults();
    SITQ.announce('Modo desativado. Nenhum modo ativo — escolha um modo e ative-o para voltar a simular.');
  }
  setMode(mode, inicial) {
    this.mode = mode;
    this.sim.mode = mode;
    this.started = true;
    document.querySelectorAll('[data-mode]').forEach(b => {
      const on = b.dataset.mode === mode;
      b.classList.toggle('active', on);
      // Botao "Ativar" e um toggle de estado -> aria-pressed (padrao SILQ).
      // aria-selected seria invalido num <button> fora de role="option".
      b.setAttribute('aria-pressed', String(on));
      b.title = on ? 'Desativar ' + (MODO_NOME[b.dataset.mode] || '') : 'Ativar ' + (MODO_NOME[b.dataset.mode] || '') + ' no canvas';
      const panel = b.closest('.panel[data-mode-card]');
      if (panel) {
        const header = panel.querySelector('.panel-header');
        if (on) {
          header?.setAttribute('aria-current', 'true');
          header?.setAttribute('aria-expanded', 'true');
          panel.querySelector('.panel-body')?.classList.remove('collapsed');
        } else {
          header?.removeAttribute('aria-current');
        }
      }
    });
    // painéis exclusivos do modo
    const visiveis = SITQ.PAINEIS_POR_MODO[mode];
    Object.values(SITQ.PAINEIS_POR_MODO).flat().forEach(id => {
      const p = document.getElementById(id);
      if (p) p.hidden = !visiveis.includes(id);
    });
    document.getElementById('canvas-hint').textContent = SITQ.HINT_CANVAS[mode];
    this._syncOverlay();
    this.refreshResults();
    if (!inicial) {
      SITQ.announce(`Modo ${MODO_NOME[mode]} selecionado. ${MODO_INFO[mode].split('.')[0]}.`);
    }
  }

  /**
   * Q correto do Calorímetro no estado atual — centraliza a lógica pra
   * não repetir (e arriscar desalinhar) em refreshResults() e no anúncio
   * de conclusão: soma dos segmentos quando atravessa fusão/ebulição;
   * senão, m·c·ΔT com o c DA FASE REAL (não sempre o do líquido).
   */
  _calorQ() {
    const st = this.sim.calor;
    if (st.segs.length > 0) return st.totalQ;
    if (st.fasesDados) {
      const fase = this.sim._faseEstaticaDeT(st.fasesDados, st.Tcur);
      const cEf = fase === 'gelo' ? st.fasesDados.cSolido : fase === 'vaporS' ? st.fasesDados.cVapor : st.fasesDados.cLiquido;
      return st.massa * cEf * (st.Tf - st.Ti);
    }
    return st.massa * st.sub.c * (st.Tf - st.Ti);
  }

  /* Icone de cada modo — mesmo emoji do .panel-icon do painel, para a
     pilula do canvas casar visualmente com o menu de modulos. */
  static get ICONES() {
    return {
      calor: '🌡️',
      curva: '📈',
      perfil: '⛰️',
      hess: '🧩',
      ligacao: '⚛️',
      gibbs: '🧭'
    };
  }
  _syncOverlay() {
    // INDICADOR DE MODO ATIVO (padrao SILQ): a pilula so existe quando ha
    // modo ativo. Sem modo, o canvas fica PURO.
    const ind = document.getElementById('mode-indicator');
    if (ind) ind.classList.toggle('mode-on', !!(this.started && this.mode));
    const ico = document.getElementById('overlay-icon');
    if (ico) ico.textContent = SITQ.ThermoApp.ICONES[this.mode] || '';
    if (!this.started || !this.mode) return;
    const el = document.getElementById('overlay-text');
    const m = this.mode,
      s = this.sim;
    let extra = '';
    if (m === 'calor') extra = `${s.calor.sub.nome} (c = ${SITQ.fmt(s.calor.sub.c, 3)} J/g·°C)`;
    if (m === 'curva') extra = `${s.curva.sub.nome} · ${SITQ.fmt(s.curva.massa, 0)} g`;
    if (m === 'perfil') extra = s.perfil.r.nome;
    if (m === 'hess') extra = s.hess.ex.titulo;
    if (m === 'ligacao') extra = s.lig.r.nome + (s.lig.inverted ? ' (invertida)' : '');
    // "<Nome do modo> ativo" + detalhe dinamico num span proprio (padrao SILQ)
    if (el) {
      el.textContent = `${MODO_NOME[m]} ativo`;
      if (extra) {
        const sp = document.createElement('span');
        sp.className = 'overlay-detail';
        sp.textContent = ' · ' + extra;
        el.appendChild(sp);
      }
    }
  }
  _slider(id, outId, unidade, cb) {
    const inp = document.getElementById(id);
    const out = document.getElementById(outId);
    const upd = () => {
      out.textContent = `${SITQ.fmt(+inp.value, 0)} ${unidade}`;
      cb(+inp.value);
    };
    inp.addEventListener('input', upd);
    upd();
  }
  _bindCalor() {
    const st = this.sim.calor;
    const reset = () => {
      st.fired = false;
      st.running = false;
      st.phase = 1;
      st.Tcur = st.Ti;
      st.segs = [];
      st.Qcur = 0;
      this.refreshResults();
    };
    this._slider('calor-massa', 'out-calor-massa', 'g', v => {
      st.massa = v;
      reset();
    });
    this._slider('calor-ti', 'out-calor-ti', '°C', v => {
      st.Ti = v;
      reset();
    });
    this._slider('calor-tf', 'out-calor-tf', '°C', v => {
      st.Tf = v;
      reset();
    });
    document.getElementById('btn-calor-run').addEventListener('click', () => {
      if (st.Ti === st.Tf) {
        SITQ.announce('T inicial e T final são iguais: sem variação de temperatura, Q = 0.', 'assertive');
        return;
      }
      // a faixa [Ti,Tf] atravessa fusão ou ebulição desta substância?
      // (só faz sentido perguntar pra água/etanol, que têm esses dados)
      const lo = Math.min(st.Ti, st.Tf),
        hi = Math.max(st.Ti, st.Tf);
      const cruzaFase = !!st.fasesDados && SITQ.construirSegmentosFase(st.fasesDados, 1, lo, hi).segs.some(s => s.tipo === 'l');
      if (cruzaFase && st.Tf < st.Ti) {
        SITQ.announce('Para atravessar uma mudança de fase, a temperatura final precisa ser maior que a inicial — como na Curva de Aquecimento.', 'assertive');
        return;
      }
      if (cruzaFase) {
        const r = SITQ.construirSegmentosFase(st.fasesDados, st.massa, st.Ti, st.Tf);
        st.segs = r.segs;
        st.totalQ = r.totalQ;
        st.Qcur = 0;
      } else {
        st.segs = [];
        st.phase = 0;
      }
      st.running = true;
      st.fired = true;
      st.Tcur = st.Ti;
      SITQ.playTone(st.Tf > st.Ti ? 520 : 420, .1, .06);
      SITQ.announce(`Trocando calor: de ${SITQ.fmt(st.Ti, 0)} para ${SITQ.fmt(st.Tf, 0)} graus Celsius.` + (cruzaFase ? ' Atravessando mudança de fase: acompanhe as duas fases coexistindo no béquer.' : ''));
    });
    document.getElementById('btn-calor-reset').addEventListener('click', () => {
      document.getElementById('calor-massa').value = 200;
      document.getElementById('calor-ti').value = 20;
      document.getElementById('calor-tf').value = 80;
      ['calor-massa', 'calor-ti', 'calor-tf'].forEach(id => document.getElementById(id).dispatchEvent(new Event('input')));
      SITQ.playTone(440, .07, .05);
      SITQ.announce('Calorímetro reiniciado: 200 gramas, de 20 a 80 graus Celsius.');
    });
  }
  _bindCurva() {
    const st = this.sim.curva;
    const rebuild = () => {
      st.Qcur = 0;
      st.running = false;
      st.done = false;
      this.sim.buildCurva();
      this.refreshResults();
      this._syncOverlay();
    };
    this._slider('curva-massa', 'out-curva-massa', 'g', v => {
      st.massa = v;
      rebuild();
    });
    this._slider('curva-ti', 'out-curva-ti', '°C', v => {
      st.Ti = v;
      rebuild();
    });
    this._slider('curva-tf', 'out-curva-tf', '°C', v => {
      st.Tf = v;
      rebuild();
    });
    document.getElementById('btn-curva-run').addEventListener('click', () => {
      if (st.Tf <= st.Ti) {
        SITQ.announce('Neste modo de aquecimento, a temperatura final precisa ser maior que a inicial.', 'assertive');
        return;
      }
      st.Qcur = 0;
      st.done = false;
      st.running = true;
      SITQ.playTone(520, .1, .06);
      SITQ.announce(`Aquecendo ${SITQ.fmt(st.massa, 0)} gramas de ${st.sub.nome.toLowerCase()} de ${SITQ.fmt(st.Ti, 0)} a ${SITQ.fmt(st.Tf, 0)} graus Celsius.`);
    });
    document.getElementById('btn-curva-reset').addEventListener('click', () => {
      const [fmin, fmax] = st.sub.faixaPadrao;
      document.getElementById('curva-massa').value = 100;
      document.getElementById('curva-ti').value = fmin;
      document.getElementById('curva-tf').value = fmax;
      ['curva-massa', 'curva-ti', 'curva-tf'].forEach(id => document.getElementById(id).dispatchEvent(new Event('input')));
      SITQ.playTone(440, .07, .05);
      SITQ.announce(`Curva reiniciada: 100 gramas de ${st.sub.nome.toLowerCase()}, de ${SITQ.fmt(fmin, 0)} a ${SITQ.fmt(fmax, 0)} graus Celsius.`);
    });
  }
  _bindPerfil() {
    document.getElementById('btn-perfil-cat').addEventListener('click', e => {
      const b = e.currentTarget;
      this.sim.perfil.cat = !this.sim.perfil.cat;
      b.setAttribute('aria-pressed', String(this.sim.perfil.cat));
      SITQ.playTone(this.sim.perfil.cat ? 900 : 600, .07, .05);
      this.refreshResults();
      SITQ.announce(this.sim.perfil.cat ? 'Catalisador adicionado: a energia de ativação diminui, mas o ΔH permanece o mesmo.' : 'Catalisador removido.');
    });
    document.getElementById('btn-perfil-run').addEventListener('click', () => this._perfilRun());
  }
  _perfilRun() {
    const p = this.sim.perfil;
    if (p.playing) return;
    p.t = 0;
    p.playing = true;
    p.done = false;
    p.burst = [];
    SITQ.playTone(700, .08, .06);
    SITQ.announce(`Reproduzindo: ${p.r.nome}. Subindo a barreira de ativação de ${SITQ.fmt(p.r.Ea, 0)} quilojoules.`);
  }
  _bindHess() {
    document.getElementById('btn-hess-check').addEventListener('click', () => this._hessCheck());
    document.getElementById('btn-hess-sol').addEventListener('click', () => this._hessSolucao());
    document.getElementById('btn-hess-reset').addEventListener('click', () => {
      SITQ.playTone(440, .07, .05);
      this._renderHess(this.hessIdx);
      SITQ.announce('Exercício reiniciado: todas as etapas voltaram a ×1, sem inversão.');
    });
  }
  _bindLigacao() {
    const st = this.sim.lig;
    const toggle = (id, prop, msgOn, msgOff) => {
      document.getElementById(id).addEventListener('click', e => {
        st[prop] = !st[prop];
        e.currentTarget.setAttribute('aria-pressed', String(st[prop]));
        SITQ.playTone(st[prop] ? 860 : 560, .06, .05);
        this._syncOverlay();
        this.refreshResults();
        SITQ.announce(st[prop] ? msgOn : msgOff);
      });
    };
    toggle('btn-lig-inverter', 'inverted', 'Reação invertida: o sinal do ΔH troca — o que rompia agora se forma.', 'Reação no sentido direto.');
    toggle('btn-lig-girar', 'auto', 'Rotação automática ligada.', 'Rotação automática desligada.');
    toggle('btn-lig-rotulos', 'labels', 'Rótulos dos elementos visíveis.', 'Rótulos ocultos.');
  }
  _bindGlobal() {
    // atalhos globais
    document.addEventListener('keydown', e => {
      // Alt+1..6 (era ..5): entrou o sexto modo, Espontaneidade
      if (e.altKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const alvo = SITQ.MODOS_ORDEM[+e.key - 1];
        document.querySelector(`[data-mode="${alvo}"]`)?.click();
      }
    });

    // teclado dentro do canvas
    this.canvas.addEventListener('keydown', e => {
      // No modo Espontaneidade as setas movem a TEMPERATURA — a unica variavel
      // do modo, e a que faz a reta de ΔG cruzar o zero.
      if (this.mode === 'gibbs' && ['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        this._gibbsSetT(this.sim.gibbs.T + (e.key === 'ArrowRight' ? 25 : -25));
      }
      if (this.mode === 'ligacao' && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault();
        const st = this.sim.lig,
          passo = 0.14;
        if (e.key === 'ArrowLeft') st.ry -= passo;
        if (e.key === 'ArrowRight') st.ry += passo;
        if (e.key === 'ArrowUp') st.rx = SITQ.clamp(st.rx - passo, -1.25, 1.25);
        if (e.key === 'ArrowDown') st.rx = SITQ.clamp(st.rx + passo, -1.25, 1.25);
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const acao = {
          calor: 'btn-calor-run',
          curva: 'btn-curva-run',
          perfil: 'btn-perfil-run',
          hess: 'btn-hess-check',
          ligacao: 'btn-lig-girar',
          gibbs: 'gibbs-inversao'
        }[this.mode];
        document.getElementById(acao)?.click();
      }
    });

    // logo → curiosidade termoquímica (mesmo espírito do logo do SIMA)
    let ci = 0;
    document.getElementById('btn-app-logo').addEventListener('click', () => {
      SITQ.playTone(660, .09, .06);
      const fato = CURIOSIDADES[ci % CURIOSIDADES.length];
      ci++;
      SITQ.announce('Você sabia? ' + fato);
    });
  }

  /* ── eventos vindos da simulação ─────────────────────────────── */
  _onSimEvent(ev) {
    if (ev === 'calor-done') {
      const st = this.sim.calor;
      const Q = this._calorQ();
      const abs = Q > 0;
      SITQ.playTone(abs ? 920 : 380, .12, .06);
      this.refreshResults();
      SITQ.announce(`Troca concluída. Q = ${SITQ.fmt(Q / 1000, 2)} quilojoules ${abs ? 'absorvidos pela amostra' : 'liberados pela amostra'}.`, 'assertive');
    }
    if (ev === 'curva-done') {
      SITQ.playTone(880, .12, .06);
      this.refreshResults();
      SITQ.announce(`Aquecimento concluído. Calor total fornecido: ${SITQ.fmt(this.sim.curva.totalQ / 1000, 1)} quilojoules.`, 'assertive');
    }
    if (ev === 'perfil-done') {
      const r = this.sim.perfil.r;
      if (r.dH < 0) {
        SITQ.playTone(700, .1, .07);
        setTimeout(() => SITQ.playTone(460, .16, .07), 120);
      } else {
        SITQ.playTone(460, .1, .07);
        setTimeout(() => SITQ.playTone(760, .16, .07), 120);
      }
      SITQ.announce(`Reação concluída: ${r.tipo === 'exo' ? 'exotérmica, liberou' : 'endotérmica, absorveu'} ${SITQ.fmt(Math.abs(r.dH), 1)} quilojoules.`, 'assertive');
    }
  }

  /* ── grade de Resultados (por modo) ──────────────────────────── */
  refreshResults() {
    const grid = document.getElementById('result-grid');
    grid.innerHTML = '';
    const resultPanel = grid.closest('.panel');
    if (resultPanel) resultPanel.classList.toggle('panel--waiting', !this.started);
    if (!this.started) {
      const p = document.createElement('p');
      p.className = 'hint-text';
      p.textContent = 'Ative um modo à esquerda para ver aqui a análise dos resultados.';
      grid.appendChild(p);
      return;
    }
    const row = (label, value, cls) => {
      const d = document.createElement('div');
      d.className = 'data-row';
      const dt = document.createElement('dt');
      dt.className = 'data-label';
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.className = 'data-value' + (cls ? ' ' + cls : '');
      dd.textContent = value;
      d.append(dt, dd);
      grid.appendChild(d);
    };
    if (this.mode === 'calor') {
      const st = this.sim.calor;
      const dT = st.Tf - st.Ti;
      const multifase = st.segs.length > 0;
      // parado numa fase só (sem cruzar patamar) de água/etanol: usa o c
      // DA FASE atual — sub.c só representa o valor líquido, e mostrar
      // isso pra um estado sólido/vapor estaria errado.
      const faseParada = st.fasesDados && !multifase ? this.sim._faseEstaticaDeT(st.fasesDados, st.Tcur) : null;
      const NOME_FASE_C = {
        gelo: 'sólida',
        agua: 'líquida',
        vaporS: 'vapor'
      };
      const cAtual = faseParada ? faseParada === 'gelo' ? st.fasesDados.cSolido : faseParada === 'vaporS' ? st.fasesDados.cVapor : st.fasesDados.cLiquido : st.sub.c;
      row('Substância', st.sub.nome);
      row('c (calor específico)', `${SITQ.fmt(cAtual, 3)} J/g·°C` + (faseParada ? ` · fase ${NOME_FASE_C[faseParada]}` : ''));
      if (st.sub.pf !== null && st.sub.pf !== undefined) {
        row('Ponto de fusão', `${SITQ.fmt(st.sub.pf, 1)} °C`);
      }
      if (st.sub.pe !== null && st.sub.pe !== undefined) {
        row('Ponto de ebulição', `${SITQ.fmt(st.sub.pe, 1)} °C`);
      }
      row('Massa (m)', `${SITQ.fmt(st.massa, 0)} g`);
      row('ΔT = Tf − Ti', `${SITQ.fmt(dT, 0)} °C`);
      if (multifase) {
        // atravessando fusão/ebulição: Q é a SOMA dos trechos (sensível +
        // latente), não m·c·ΔT simples — essa conta ficaria errada porque
        // ignoraria a energia gasta na própria mudança de fase.
        const ICONE_FASE = {
          gelo: '❄',
          fusao: '❄→💧',
          agua: '💧',
          vapor: '💧→💨',
          vaporS: '💨'
        };
        st.segs.forEach(s => row(`${ICONE_FASE[s.fase] || ''} ${s.nome}`, `${SITQ.fmt(s.Q / 1000, 1)} kJ`, s.tipo === 'l' ? 'val-endo' : ''));
        row('Q total (sensível + latente)', `${SITQ.fmt(st.totalQ / 1000, 2)} kJ`, 'val-endo');
        row('Q em calorias', `${SITQ.fmt(st.totalQ / PHYS.CAL_J, 0)} cal`);
        const latente = st.segs.filter(s => s.tipo === 'l').reduce((a, s) => a + s.Q, 0);
        const sensivel = st.totalQ - latente;
        row('Calor sensível (ΔT)', `${SITQ.fmt(sensivel / 1000, 1)} kJ · ${SITQ.fmt(100 * sensivel / st.totalQ, 0)}%`);
        row('Calor latente (mudança de fase)', `${SITQ.fmt(latente / 1000, 1)} kJ · ${SITQ.fmt(100 * latente / st.totalQ, 0)}%`, 'val-endo');
        const atual = SITQ.pontoNosSegmentos(st.segs, st.fasesDados.fases, st.Qcur);
        if (atual.seg.fase === 'fusao' || atual.seg.fase === 'vapor') {
          const pct = atual.fracSeg * 100;
          const rotFase = atual.seg.fase === 'fusao' ? 'sólido / líquido' : 'líquido / vapor';
          row(`Coexistência agora (${rotFase})`, `${SITQ.fmt(100 - pct, 0)}% / ${SITQ.fmt(pct, 0)}%`, 'val-endo');
        }
        row('Processo', 'Absorve calor (Q > 0)', 'val-endo');
      } else {
        const Q = this._calorQ(); // já usa o c da fase real — ver método
        row('Q = m·c·ΔT', `${SITQ.fmt(Q / 1000, 2)} kJ`, Q > 0 ? 'val-endo' : Q < 0 ? 'val-exo' : '');
        row('Q em calorias', `${SITQ.fmt(Q / PHYS.CAL_J, 0)} cal`);
        row('Processo', dT > 0 ? 'Absorve calor (Q > 0)' : dT < 0 ? 'Libera calor (Q < 0)' : '—', dT > 0 ? 'val-endo' : dT < 0 ? 'val-exo' : '');
      }
      // comparação direta com a água — mesma energia, quanto varia a T°?
      const agua = SUBSTANCIAS.find(x => x.id === 'agua');
      if (st.sub.id !== 'agua') {
        const razao = agua.c / st.sub.c;
        row('Comparado à água (c)', `${SITQ.fmt(razao, 1)}× mais fácil de aquecer/esfriar`);
      }
    }
    if (this.mode === 'curva') {
      const st = this.sim.curva;
      const ICONE_FASE = {
        gelo: '❄',
        fusao: '❄→💧',
        agua: '💧',
        vapor: '💧→💨',
        vaporS: '💨'
      };
      row('Substância', `${st.sub.nome} (P.F. ${SITQ.fmt(st.sub.Tfusao, 0)} °C · P.E. ${SITQ.fmt(st.sub.Tebulicao, 0)} °C)`);
      st.segs.forEach(s => row(`${ICONE_FASE[s.fase] || ''} ${s.nome}`, `${SITQ.fmt(s.Q / 1000, 1)} kJ`, s.tipo === 'l' ? 'val-endo' : ''));
      row('Q total', `${SITQ.fmt(st.totalQ / 1000, 1)} kJ`, 'val-ok');
      // quanto da energia foi só p/ mudar de fase (latente) vs. mudar de T° (sensível)?
      if (st.totalQ > 0) {
        const latente = st.segs.filter(s => s.tipo === 'l').reduce((a, s) => a + s.Q, 0);
        const sensivel = st.totalQ - latente;
        row('Calor sensível (ΔT)', `${SITQ.fmt(sensivel / 1000, 1)} kJ · ${SITQ.fmt(100 * sensivel / st.totalQ, 0)}%`);
        row('Calor latente (mudança de fase)', `${SITQ.fmt(latente / 1000, 1)} kJ · ${SITQ.fmt(100 * latente / st.totalQ, 0)}%`, latente > 0 ? 'val-endo' : '');
      }
      const atual = this.sim._curvaPoint(st.Qcur);
      if (atual.seg.fase === 'fusao' || atual.seg.fase === 'vapor') {
        const pct = atual.fracSeg * 100;
        const rotFase = atual.seg.fase === 'fusao' ? 'sólido / líquido' : 'líquido / vapor';
        row(`Coexistência agora (${rotFase})`, `${SITQ.fmt(100 - pct, 0)}% / ${SITQ.fmt(pct, 0)}%`, 'val-endo');
      }
      const fim = this.sim._curvaPoint(st.totalQ);
      row('Estado em Tf', fim.rotulo);
    }
    if (this.mode === 'perfil') {
      const r = this.sim.perfil.r;
      const exo = r.dH < 0;
      const eaCat = exo ? r.Ea * CATALISADOR_FATOR : r.dH + (r.Ea - r.dH) * CATALISADOR_FATOR;
      row('Reação', r.nome);
      row('ΔH = Hp − Hr', `${SITQ.fmt(r.dH, 1)} kJ`, exo ? 'val-exo' : 'val-endo');
      if (r.massaMolar) row('ΔH por grama', `${SITQ.fmt(r.dH / r.massaMolar, 1)} kJ/g`, exo ? 'val-exo' : 'val-endo');
      row('Ea (sem catalisador)', `${SITQ.fmt(r.Ea, 0)} kJ`);
      row('Ea (com catalisador)', this.sim.perfil.cat ? `${SITQ.fmt(eaCat, 0)} kJ` : '—', this.sim.perfil.cat ? 'val-ok' : '');
      row('Classificação', exo ? 'Exotérmica' : 'Endotérmica', exo ? 'val-exo' : 'val-endo');
    }
    if (this.mode === 'hess') {
      const ex = HESS[this.hessIdx];
      row('Exercício', ex.titulo);
      row('Σ das etapas', `${SITQ.fmt(this._hessSoma(), 1)} kJ`);
      row('ΔH alvo', this.hessSolved ? `${SITQ.fmt(ex.resposta, 1)} kJ` : '?', this.hessSolved ? 'val-ok' : '');
      row('Situação', this.hessSolved ? 'Correto ✔' : 'Montando as etapas…', this.hessSolved ? 'val-ok' : '');
    }
    if (this.mode === 'ligacao') {
      const st = this.sim.lig,
        r = st.r;
      const romp = st.inverted ? r.formadas : r.rompidas;
      const form = st.inverted ? r.rompidas : r.formadas;
      romp.forEach(([b, n]) => row(`Romper ${n} × ${b}`, `+${SITQ.fmt(n * ENERGIA_LIGACAO[b], 0)} kJ`, 'val-endo'));
      form.forEach(([b, n]) => row(`Formar ${n} × ${b}`, `−${SITQ.fmt(n * ENERGIA_LIGACAO[b], 0)} kJ`, 'val-exo'));
      const {
        romp: somaRomp,
        form: somaForm
      } = this.sim._ligSums();
      row('Σ E(rompidas)', `+${SITQ.fmt(somaRomp, 0)} kJ`, 'val-endo');
      row('Σ E(formadas)', `−${SITQ.fmt(somaForm, 0)} kJ`, 'val-exo');
      const dH = somaRomp - somaForm;
      row('ΔH estimado', `${SITQ.fmt(dH, 0)} kJ`, dH < 0 ? 'val-exo' : 'val-endo');
      row('Classificação', dH < 0 ? 'Exotérmica' : 'Endotérmica', dH < 0 ? 'val-exo' : 'val-endo');
    }
    if (this.mode === 'gibbs') {
      const r = this.sim.gibbs.r,
        c = this.sim.gibbsCalc();
      row('Reação', r.nome);
      row('ΔH', `${SITQ.fmt(r.dH, 1)} kJ/mol`, r.dH < 0 ? 'val-exo' : 'val-endo');
      row('ΔS', `${SITQ.fmt(r.dS, 1)} J/(mol·K)`, r.dS > 0 ? 'val-ok' : 'val-endo');
      row('Temperatura', `${SITQ.fmt(c.T, 1)} K  =  ${SITQ.fmt(c.T - 273.15, 1)} °C`);
      // O termo T·ΔS aparece JÁ CONVERTIDO para kJ/mol de propósito: esquecer
      // de dividir ΔS por 1000 é o erro mais comum de todo o tópico.
      row('T·ΔS (convertido)', `${SITQ.fmt(c.tds, 2)} kJ/mol`);
      row('ΔG = ΔH − T·ΔS', `${SITQ.fmt(c.dG, 2)} kJ/mol`, c.espontanea ? 'val-exo' : 'val-endo');
      row('Veredito', c.espontanea ? 'ESPONTÂNEA (ΔG < 0)' : Math.abs(c.dG) < 0.5 ? 'EQUILÍBRIO (ΔG ≈ 0)' : 'NÃO espontânea (ΔG > 0)', c.espontanea ? 'val-ok' : 'val-endo');
      row('Par de sinais', c.caso);
      row('Comportamento', c.regra, 'val-ok');
      row('T de inversão', c.temInversao ? `${SITQ.fmt(c.Tinv, 1)} K  =  ${SITQ.fmt(c.Tinv - 273.15, 1)} °C` : 'não existe (sinais opostos)', c.temInversao ? 'val-ok' : '');
      row('K de equilíbrio', c.K > 1e12 ? '> 10¹²' : c.K < 1e-12 ? '< 10⁻¹²' : c.K.toExponential(2));
      row('Fonte de ΔG', 'ΔG° = −R·T·ln K');
      row('Por quê', r.desc);
    }
  }

  /* ── laço principal ──────────────────────────────────────────── */
  _loop() {
    const now = performance.now();
    const dt = SITQ.clamp((now - this._last) / 1000, 0, .05);
    this._last = now;

    // Auto-correção de tamanho: ResizeObserver e window.resize cobrem
    // a maioria dos casos, mas existem formas de zoom (escala do
    // Windows, certos gestos de zoom) que mudam devicePixelRatio SEM
    // alterar o layout CSS — nesse caso o tamanho em CSS px continua
    // igual e só comparar boundingClientRect não pega a mudança.
    // Por isso comparamos os DOIS: tamanho CSS e devicePixelRatio.
    if (this.sim.canvas) {
      const rNow = this.sim.canvas.getBoundingClientRect();
      const dprNow = window.devicePixelRatio || 1;
      if (Math.abs(rNow.width - (this.sim.Wc || this.sim.W)) > .5 || Math.abs(rNow.height - this.sim.H) > .5 || dprNow !== this.sim._lastDPR) {
        this.sim.resize();
      }
    }
    if (this.started) {
      this.sim.areaLivre();                  // a parte do canvas que nenhum card flutuante cobre
      this.sim.update(dt);
      this.sim.draw();
    } else if (this.sim.ctx) {
      // Nenhum modo ativo: canvas permanece em branco.
      this.sim.ctx.clearRect(0, 0, this.sim.Wc || this.sim.W, this.sim.H);
    }
    this._frames++;
    this._fpsT += dt;
    if (this._fpsT >= 1) {
      const el = document.getElementById('fps-counter');
      if (el) el.textContent = `${this._frames} fps`;
      this._frames = 0;
      this._fpsT = 0;
    }
    requestAnimationFrame(() => this._loop());
  }
};
window.addEventListener('DOMContentLoaded', () => new SITQ.ThermoApp());

/* Chips de exemplo ("Recomendados"/"Bons exemplos") — antes eram só
   texto decorativo. Clicar ativa o módulo dono do chip (se ainda não
   estiver ligado) e escolhe o item certo na lista já construída —
   substância (#subst-grid) ou reação (#perfil-list/#ligacao-list/
   #gibbs-list), conforme o data-modulo do chip. As listas são
   geradas em tempo de execução (_buildSubstancias/_buildPerfilList/
   etc.), então o botão-alvo só existe DEPOIS de ativar — por isso a
   pequena espera antes de procurar. */
window.addEventListener('DOMContentLoaded', () => {
  var LISTAS_POR_MODULO = {
    calor: { seletorLista: '#subst-grid .subst-btn', seletorTexto: '.subst-nome', dataAttr: 'substancia' },
    perfil: { seletorLista: '#perfil-list .model-btn', seletorTexto: '.model-name', dataAttr: 'reacao' },
    ligacao: { seletorLista: '#ligacao-list .model-btn', seletorTexto: '.model-name', dataAttr: 'reacao' },
    gibbs: { seletorLista: '#gibbs-list .model-btn, #gibbs-list button', seletorTexto: '.model-name', dataAttr: 'reacao' },
  };
  document.querySelectorAll('.chip[data-modulo]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var modulo = chip.dataset.modulo;
      var cfg = LISTAS_POR_MODULO[modulo];
      if (!cfg) return;
      var alvoTexto = chip.dataset[cfg.dataAttr];
      var btnAtivar = document.querySelector('.mode-activate-btn[data-mode="' + modulo + '"]');
      var jaAtivo = btnAtivar && btnAtivar.getAttribute('aria-pressed') === 'true';
      if (btnAtivar && !jaAtivo) btnAtivar.click();
      setTimeout(function () {
        var itens = document.querySelectorAll(cfg.seletorLista);
        for (var i = 0; i < itens.length; i++) {
          var span = itens[i].querySelector(cfg.seletorTexto);
          var texto = span ? span.textContent.trim() : itens[i].textContent.trim();
          if (texto === alvoTexto) { itens[i].click(); break; }
        }
      }, jaAtivo ? 0 : 250);
    });
  });
});

// ══════════════════════════════════════════════════════════════════
//