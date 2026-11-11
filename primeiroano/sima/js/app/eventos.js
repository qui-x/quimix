/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Eventos
   ARQUIVO: eventos.js
   ───────────────────────────────────────────────────────────────
   Liga TODOS os controles da interface (busca da tabela periódica,
   filtros de categoria, botões de ativar modelo, painéis
   recolhíveis, controles de Bohr, botões dos Easter Eggs, atalhos
   de teclado) aos métodos correspondentes de AtomicApp/AtomicSim.
   Adiciona a AtomicApp.prototype: _bindEvents.
   Depende de: praticamente todos os outros arquivos de app/ e
               models/ (é o método que conecta a interface inteira).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── Eventos ───────────────────────────────────────────────────
  AtomicApp.prototype._bindEvents = function() {
    document.getElementById('abrir-espalhamento').addEventListener('click', () => {
      if (this.sim.model !== 'rutherford') document.querySelector('[data-model="rutherford"]').click();
      this._toggleRutherfordEgg();
    });
    window.addEventListener('resize',()=>this._resize());

    document.querySelectorAll('.panel-header').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const expanded=btn.getAttribute('aria-expanded')==='true';
        btn.setAttribute('aria-expanded',String(!expanded));
        const body=document.getElementById(btn.getAttribute('aria-controls'));
        if (body) body.classList.toggle('collapsed', expanded);
        playTone(expanded?500:750,.06,.04);
      });
    });

    // Botao ✕ da pilula do canvas — desativa o modelo, mesmo papel do
    // #bond-mode-indicator-clear do SILQ.
    const xBtn = document.getElementById('overlay-clear');
    if (xBtn) xBtn.addEventListener('click', () => this.clearModel());

    // Modelos
    document.querySelectorAll('[data-model]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        // TOGGLE — clicar no modelo JA ativo desativa e devolve o canvas
        // ao estado puro. Mesmo contrato do SILQ (setMode / clearMode).
        if (this.sim.model === btn.dataset.model) { this.clearModel(); return; }
        playTone(btn.dataset.model==='quantum'?1100:880,.08,.07);
        document.querySelectorAll('[data-model]').forEach(b=>{
          b.classList.remove('active'); b.setAttribute('aria-pressed','false');
        });
        btn.classList.add('active'); btn.setAttribute('aria-pressed','true');
        this.sim.model=btn.dataset.model;
        // Se o elemento atualmente selecionado ainda não era conhecido
        // no ano do novo modelo, volta para o Hidrogênio (Z=1, conhecido
        // desde 1671, disponível em todos os modelos) — evita ficar com
        // um elemento anacrônico selecionado ao mudar de modelo.
        // EXCEÇÃO: o modelo Quântico (Schrödinger, 1926) descreve a
        // física que vale para QUALQUER elemento, independente de
        // quando foi descoberto — diferente de Dalton/Thomson/
        // Rutherford/Bohr, cujo ano é o do próprio modelo histórico
        // sendo simulado. Por isso o Quântico nunca reverte o elemento.
        const isQuantum = btn.dataset.model==='quantum';
        if (!isQuantum) {
          const newYear = MODEL_YEAR[btn.dataset.model] ?? 9999;
          if ((DISCOVERY_YEAR[this.sim.elData[1]] ?? 9999) > newYear) {
            this.sim.elData = ELEMENTS[0]; // H
          }
        }
        this.sim.rebuild();
        this.sim.bohrPhotons=[];
        const isBohr = btn.dataset.model==='bohr';
        const isRutherford = btn.dataset.model==='rutherford';
        // Painéis "Esferas de Dalton", "Experimento de Rutherford",
        // "Salto Quântico" e "Níveis de Energia" foram removidos da
        // sidebar — não há mais elementos de painel fixo para ocultar
        // por modelo. Os Easter Eggs (Rutherford/Bohr) são geridos
        // separadamente abaixo, acionados só pelo logo do cabeçalho.

        // Projeção Matemática (regra de Madelung) — exclusiva do
        // modelo Quântico, explica por que ele desbloqueia os 118
        // elementos sem restrição histórica de ano.
        const projectionPanel = document.getElementById('projection-panel');
        if (projectionPanel) {
          projectionPanel.hidden = !isQuantum;
          if (isQuantum) this._updateProjectionPanel();
        }

        // O logo NÃO muda de aparência por modelo — o Easter Egg deve
        // passar despercebido visualmente, sem nenhuma pista no ícone.
        // Saindo do modelo correspondente, cada Easter Egg é desativado
        // (volta ao estado padrão) — não faz sentido manter esse
        // estado de exibição associado a um modelo diferente.
        if (!isRutherford && this.sim.ruthEggMode) {
          this.sim.ruthEggMode = false;
          this.canvas.classList.remove('sim-canvas--egg-mode');
          const ruthPanel = document.getElementById('egg-panel-rutherford');
          if (ruthPanel) ruthPanel.hidden = true;
        }
        if (!isBohr && this.sim.bohrEggMode) {
          this.sim.bohrEggMode = false;
          const bohrPanel = document.getElementById('egg-panel-bohr');
          if (bohrPanel) bohrPanel.hidden = true;
        }
        this._syncModelPanels();
        // A restrição histórica por ano se aplica à Tabela Periódica
        // principal — reconstrói a tabela com o novo corte de ano.
        this._buildPeriodicTable(search?search.value:'');
        this._updateOverlay();
        this._updateElementUI();
        this._updateBohrShellSelectors();
        const name=btn.querySelector('.model-name').textContent;
        // Ao ativar, o painel se RECOLHE — o gatilho abre espaço pro
        // canvas. Reabrir é um clique no cabeçalho, a qualquer momento.
        const painelAtivo = btn.closest('.panel[data-mode-card]');
        if (painelAtivo) {
          const header = painelAtivo.querySelector('.panel-header');
          const body = painelAtivo.querySelector('.panel-body');
          if (header) header.setAttribute('aria-expanded', 'false');
          if (body) body.classList.add('collapsed');
        }
        this._syncMobileModeUI(btn.dataset.model);
        // No mobile, ativar um modelo RECOLHE o bottom sheet de controles
        // (se estiver aberto) em vez de abri-lo — reabrir pra ajustar
        // parâmetros é um toque no botão 🎛 do cabeçalho, a qualquer
        // momento, inclusive com a simulação já rodando.
        if (window.innerWidth <= 900 && typeof window._closeSidebar === 'function') {
          window._closeSidebar();
        }
        // ── largada com 2s de antecipação ──
        // O ESTADO já foi montado acima (sim.rebuild()), então o canvas
        // mostra o quadro inicial "parado" imediatamente — só a FÍSICA
        // (sim.update, chamada em _loop) fica pausada por 2s. O
        // #canvas-hint normalmente fica hidden com um modelo ativo (ver
        // _syncModelPanels() acima) — reaproveitado aqui por 2s só pra
        // avisar a largada, depois volta a ficar escondido.
        const hint = document.getElementById('canvas-hint');
        if (this._modeStartTimer) clearTimeout(this._modeStartTimer);
        this._modeStartsAt = performance.now() + 2000;
        if (hint) { hint.hidden = false; hint.textContent = 'Iniciando em instantes…'; }
        const modeloAtivado = btn.dataset.model;
        this._modeStartTimer = setTimeout(() => {
          const h = document.getElementById('canvas-hint');
          if (h && this.sim.model === modeloAtivado) h.hidden = true;
        }, 2000);
        announce(`Modelo ${name} selecionado. A animação começa em 2 segundos. ${MODEL_INFO[btn.dataset.model].split('.')[0]}.`);
      });
    });

    // Busca na tabela
    const search=document.getElementById('pt-search');
    if (search) {
      search.addEventListener('input',e=>this._buildPeriodicTable(e.target.value));
      search.addEventListener('keydown',e=>{
        if (e.key==='Escape'){search.value='';this._buildPeriodicTable('');}
        if (e.key==='ArrowDown') {
          const first=this._ptFocusGrid.find(c=>c?.matches);
          if (first){e.preventDefault();first.btn.focus();}
        }
      });
    }

    // Filtro de categoria — réplica exata do comportamento do SILQ:
    // cada categoria é um toggle independente (clicar de novo no mesmo
    // item desativa o filtro); os demais itens da legenda recebem
    // .dimmed enquanto um filtro está ativo, e a tabela usa .dimmed/
    // .highlighted nas células (sem desabilitar clique).
    document.querySelectorAll('.mol-cat-btn[data-cat]').forEach(btn=>{
      if (btn.dataset.cat==='all') { btn.hidden = true; return; } // SILQ não tem botão "Todas"
      btn.addEventListener('click',()=>{
        const cat=btn.dataset.cat;
        const wasActive = this._categoryFilter === cat;
        this._categoryFilter = wasActive ? null : cat;
        document.querySelectorAll('.mol-cat-btn[data-cat]').forEach(b=>{
          if (b.dataset.cat==='all') return;
          const isActive = b===btn && !wasActive;
          b.classList.toggle('active-cat', isActive);
          b.classList.toggle('dimmed', !!this._categoryFilter && b!==btn);
          b.setAttribute('aria-pressed', isActive?'true':'false');
        });
        this._buildPeriodicTable(search?search.value:'');
        announce(this._categoryFilter?`Filtrando por ${btn.textContent.trim()}.`:`Filtro ${btn.textContent.trim()} removido.`);
      });
    });

    const inCloud = () => this.sim.model === 'quantum' && !this.sim.qSection;
    let drag = null;
    this.canvas.addEventListener('pointerdown', event => {
      if (!inCloud() || !event.isPrimary || event.button !== 0) return;
      drag = { id:event.pointerId, x:event.clientX, y:event.clientY };
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener('pointermove', event => {
      if (!inCloud() || drag?.id !== event.pointerId) return;
      this.sim.qCamera.arrastar(event.clientX-drag.x,event.clientY-drag.y);
      drag.x=event.clientX; drag.y=event.clientY;
    });
    this.canvas.addEventListener('lostpointercapture', () => { drag=null; });
    this.canvas.addEventListener('keydown', event => {
      if (!inCloud()) return;
      const step = {ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[event.key];
      if (step) { event.preventDefault(); this.sim.qCamera.arrastar(...step); }
      if (event.key === 'Home') {
        event.preventDefault();
        this.sim.qCamera.definirPadrao(.55,.30);
      }
    });

    // ══ BOHR — excitar / retornar por camada selecionada ══
    const origin = document.getElementById('bohr-from-shell');
    const target = document.getElementById('bohr-to-shell');
    const useShells = () => {
      document.getElementById('bohr-photon').value = '';
      this._syncBohrDirection();
    };
    origin.addEventListener('change', useShells);
    target.addEventListener('change', useShells);
    const jump = (up) => {
      const from = Number(origin.value), to = Number(target.value);
      if (from === to || (to > from) !== up || !this.sim.moveBohrElectron(from, to)) {
        announce('Verifique o elétron na origem e a direção do salto.', 'assertive');
        return;
      }
      picker.value = '';
      this._updateBohrEnergy();
      origin.value = String(to);
      target.value = String(up ? from : this.sim.selectedBohrElectron.returnPath.at(-1) ?? from);
      this._syncBohrDirection();
    };
    document.getElementById('btn-bohr-up').addEventListener('click', () => jump(true));
    document.getElementById('btn-bohr-down').addEventListener('click', () => jump(false));
    const picker = document.getElementById('bohr-photon');
    picker.addEventListener('change', () => {
      if (picker.value === '') return;
      const line = bohrMeasuredLines[this.sim.Z][Number(picker.value)];
      origin.value = String(line[1]-1);
      target.value = String(line[2]-1);
      this._syncBohrDirection();
    });
    document.getElementById('btn-excite').addEventListener('click', () => {
      const line = picker.value ? bohrMeasuredLines[this.sim.Z]?.[Number(picker.value)] : null;
      const from = Number(origin.value), to = Number(target.value);
      const chosen = this.sim.selectedBohrElectron;
      if (!this.sim.exciteBohr(from, to, chosen?.shell === from ? chosen : null, line)) {
        announce('Escolha uma camada de origem ocupada e um destino superior, ou prepare o elétron na origem da linha medida.', 'assertive');
      }
    });
    document.querySelectorAll('[data-shell]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (+btn.dataset.shell < this.sim.bohrShellRadii.length) target.value = btn.dataset.shell;
        useShells();
      });
    });

    // Canvas — clique trata Bohr (excitação de elétron) e, no modo
    // Easter Egg do Rutherford, dispara uma partícula alfa com
    // parâmetro de impacto definido pela posição vertical do clique.
    // A VISTA do quadro que o aluno estava vendo ao apertar (ver
    // _vistaLivre em models/atomic-sim-loop.js): o card da esquerda fecha no
    // pointerdown, e no 'click' a cena já começou a deslizar de volta.
    this.canvas.addEventListener('pointerdown',()=>{ this._vistaClique = this.sim._vista; }, true);
    this.canvas.addEventListener('click',e=>{
      const v = this._vistaClique || this.sim._vista || { s:1, tx:0, ty:0 }; this._vistaClique = null;
      const mx = (e.offsetX - v.tx) / v.s, my = (e.offsetY - v.ty) / v.s;   // tela → mundo
      if (this.sim.model === 'thomson') {
        const index = this.sim.thomsonElectrons.findIndex(el => Math.hypot(el.x-mx, el.y-my) <= 12/v.s);
        const mensagem = this.sim.alternarEletronThomson(index);
        if (mensagem) announce(mensagem);
        return;
      }
      if (this.sim.model==='rutherford' && this.sim.ruthEggMode) {
        const b = my - this.sim.ruthNucleusY;
        this.sim.fireAlpha(b); playTone(900,.05,.04);
        return;
      }
      if (this.sim.model==='bohr') {
        const cx=this.canvas.width/2, cy=this.canvas.height/2;
        const d=Math.hypot(mx-cx,my-cy);
        const radii = this.sim.bohrShellRadii || [];
        const ns=radii.length;
        let shellClicked=null;
        for (let s=0;s<ns;s++) {
          const r = radii[s] ?? 60;
          if (Math.abs(d-r)<18/v.s) { shellClicked=s; break; }   // 18 px de TELA, em qualquer escala
        }
        if (this.sim.bohrEggMode) {
          const electron = this.sim.bohrElectrons.find(e => {
            const r = radii[e.shell];
            return Math.hypot(mx-cx-r*Math.cos(e.angle), my-cy-r*Math.sin(e.angle)) <= 12/v.s;
          });
          if (electron) {
            this.sim.selectedBohrElectron = electron;
            this._updateBohrEnergy();
            origin.value = String(electron.shell);
          } else if (shellClicked !== null) target.value = String(shellClicked);
          useShells();
        } else if (shellClicked !== null) this.sim.exciteBohr(shellClicked);
      }
    });
    this.canvas.addEventListener('keydown',e=>{
      if (!['Enter',' '].includes(e.key)) return;
      e.preventDefault();
      if (this.sim.model === 'thomson') { announce(this.sim.alternarEletronThomson(0)); return; }
      if (this.sim.model==='rutherford' && this.sim.ruthEggMode) { this.sim.fireAlpha(); return; }
      if (this.sim.model==='bohr') {
        if (this.sim.bohrEggMode) jump(+target.value > +origin.value);
        else this.sim.exciteBohr();
      }
    });

    // Atalhos de teclado globais
    document.addEventListener('keydown',e=>{
      if (e.altKey&&['1','2','3','4','5'].includes(e.key)) {
        e.preventDefault();
        const models=['dalton','thomson','rutherford','bohr','quantum'];
        document.querySelector(`[data-model="${models[+e.key-1]}"]`)?.click();
      }
    });

    // ══ EASTER EGG — experimento de espalhamento (Geiger & Marsden) ══
    // Acionado pelo SÍMBOLO/LOGO da barra de título — sem modal: a
    // própria visualização do canvas (Rutherford) ou os controles
    // abaixo dele (Bohr) alternam entre vista padrão e Easter Egg.
    // Único gatilho — não há botão equivalente na sidebar.
    document.getElementById('btn-app-logo')?.addEventListener('click',()=>{
      if (this.sim.model === 'rutherford') { this._toggleRutherfordEgg(); return; }
      if (this.sim.model === 'bohr') { this._toggleBohrEgg(); return; }
      playTone(300,.08,.04);
      announce('Selecione o modelo de Rutherford ou Bohr para revelar um experimento histórico.');
    });
    document.getElementById('btn-egg-fire-one')?.addEventListener('click',()=>{
      this.sim.fireAlpha(); playTone(900,.05,.04); announce('Partícula alfa disparada.');
    });
    document.getElementById('btn-egg-fire-burst')?.addEventListener('click',()=>{
      for (let i=0;i<20;i++) setTimeout(()=>this.sim.fireAlpha(), i*60);
      announce('20 partículas alfa disparadas em sequência.');
    });
    document.getElementById('btn-egg-reset')?.addEventListener('click',()=>{
      this._resetEggExperiment();
    });

    /* Chips de elemento ("Elementos conhecidos em 1803" etc.) — antes
       eram só texto decorativo. Clicar agora ativa o modelo dono do
       card (se ainda não estiver ligado) e carrega o elemento
       clicado na tabela periódica, igual clicar direto nela. */
    document.querySelectorAll('.chip[data-z]').forEach(chip => {
      chip.addEventListener('click', () => {
        const painel = chip.closest('.panel[data-mode-card]');
        const modelo = painel ? painel.dataset.modeCard : null;
        if (modelo && this.sim.model !== modelo) {
          const activateBtn = painel.querySelector('[data-model]');
          if (activateBtn) activateBtn.click();
        }
        const ptBtn = document.querySelector(`.pt-cell[data-z="${chip.dataset.z}"]`);
        if (ptBtn && !ptBtn.disabled) ptBtn.click();
      });
    });
  };

