/* ═══════════════════════════════════════════════════════════════
   CAMADA: INICIALIZAÇÃO — Disparo final
   ARQUIVO: inicializacao-final.js
   ───────────────────────────────────────────────────────────────
   O "botão liga" do app: chama buildPeriodicTable(), buildLegend(),
   clearChart() e inicializa os três blocos de interface que faltam
   (accordion da sidebar, seletor de cunha, botões "Ativar Modo" de
   cada tipo de ligação) e o painel de moléculas prontas. É o
   arquivo mais próximo de um "main.js" que este projeto tem — por
   isso é o ÚLTIMO dos arquivos "de conteúdo" a carregar (só
   menu-mobile.js e sidebar-resizer.js vêm depois).

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: praticamente tudo (é o ponto de entrada de fato).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     26. INICIALIZAÇÃO
     =================================================================== */
  SILQ.buildPeriodicTable();

  SILQ.buildLegend();

  SILQ.clearChart();

  if(SILQ.molPanel) SILQ.molPanel.style.display='none';

  /* ===================================================================
     ACCORDION UNIFICADO — gerencia todos os painéis da sidebar
     Persiste estado aberto/fechado no localStorage por painel.
     =================================================================== */
  (function initAccordion() {
    const panels = document.querySelectorAll('.panel-header');

    function openPanel(btn, body) {
      btn.setAttribute('aria-expanded', 'true');
      body.classList.remove('collapsed');
    }
    function closePanel(btn, body) {
      btn.setAttribute('aria-expanded', 'false');
      body.classList.add('collapsed');
    }
    function saveState(id, open) {
      try { localStorage.setItem('acc_' + id, open ? '1' : '0'); } catch(e) {}
    }
    function loadState(id) {
      try { return localStorage.getItem('acc_' + id); } catch(e) { return null; }
    }

    panels.forEach(btn => {
      const bodyId = btn.getAttribute('aria-controls');
      const body   = document.getElementById(bodyId);
      if (!body) return;
      const pid = btn.dataset.panel || bodyId;

      // Restaura estado salvo; por padrão todos fechados
      const saved = loadState(pid);
      if (saved === '1') openPanel(btn, body);
      else               closePanel(btn, body);

      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        if (isOpen) {
          closePanel(btn, body);
          saveState(pid, false);
          SILQ.announce(`Painel ${btn.querySelector('.panel-label')?.textContent || ''} recolhido.`);
        } else {
          openPanel(btn, body);
          saveState(pid, true);
          SILQ.announce(`Painel ${btn.querySelector('.panel-label')?.textContent || ''} expandido.`);
        }
      });

      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });
  })();

  /* Inicializa o painel de moléculas prontas (grid + filtros) */
  SILQ.initMolPresets();

  /* ===================================================================
     SELETOR DE CUNHA — define direção da cunha para montagem manual
     =================================================================== */
  (function initWedgeSelector() {
    const btns = document.querySelectorAll('.wedge-btn');
    if (!btns.length) return;

    function setWedge(dir) {
      SILQ.wedgeDirection = dir;
      btns.forEach(btn => {
        const isThis = btn.dataset.wedge === dir;
        btn.classList.toggle('active-wedge', isThis);
        btn.setAttribute('aria-pressed', isThis ? 'true' : 'false');
      });
      const labels = { auto:'automático (geometria 3D)', front:'frente (cunha sólida ▶)', back:'atrás (cunha tracejada ╌╌)', plane:'plano (linha ───)' };
      SILQ.announce(`Cunha: ${labels[dir] || dir}`);
    }

    btns.forEach(btn => {
      btn.addEventListener('click', () => setWedge(btn.dataset.wedge));
      btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
      });
    });

    // Restaura preferência salva
    try {
      const saved = localStorage.getItem('silq_wedge');
      if (saved && ['auto','front','back','plane'].includes(saved)) setWedge(saved);
    } catch(e) {}
  })();

  /* ===================================================================
     MÓDULOS DE LIGAÇÃO — botões "Ativar Modo" por tipo
     Cada botão filtra as interações do canvas para um único tipo.
     =================================================================== */
  (function initBondModes() {
    const modeBtns = document.querySelectorAll('.bond-mode-btn');
    const indicator      = document.getElementById('bond-mode-indicator');
    const indicatorIcon  = document.getElementById('bond-mode-indicator-icon');
    const indicatorText  = document.getElementById('bond-mode-indicator-text');
    const indicatorClear = document.getElementById('bond-mode-indicator-clear');

    const MODE_CONFIG = {
      covalent:  { icon: 'link',   label: 'Modo Covalente ativo', cls: 'mode--covalent',  canvasCls: 'mode-covalent',  nome: 'covalente' },
      ionic:     { icon: 'bolt',   label: 'Modo Iônico ativo',    cls: 'mode--ionic',     canvasCls: 'mode-ionic',     nome: 'iônico'    },
      metallic:  { icon: 'magnet', label: 'Modo Metálico ativo',  cls: 'mode--metallic',  canvasCls: 'mode-metallic',  nome: 'metálico'  },
    };

    function setMode(type) {
      SILQ.activeBondFilter = type;
      SILQ.refreshTableDimming(); // atualiza dimming da tabela periódica

      /* PEDIDO: a barra direita (Tabela Periódica, Moléculas, Info,
         Controles) só mostra informação com um modo de ligação
         ativo — mesmo padrão do 2º/3º ano. Os 4 painéis valem pra
         qualquer um dos 3 tipos de ligação (não são exclusivos de
         um só), por isso é um "liga tudo/desliga tudo" baseado em
         type ser ou não null, e não um mapeamento por painel. */
      document.querySelectorAll('#sidebar-right .panel').forEach(painel => {
        painel.hidden = !type;
      });

      // Atualiza botões
      modeBtns.forEach(btn => {
        const isThis = btn.dataset.bondType === type;
        btn.setAttribute('aria-pressed', isThis ? 'true' : 'false');
        // O clique aqui sempre foi um toggle, mas o rotulo continuava
        // escrito "Ativar" mesmo quando a acao seria desligar. O title
        // agora acompanha o estado — mesmo comportamento dos outros 19
        // simuladores, junto com o "✕ desativar" no hover (CSS).
        const nomeMod = (MODE_CONFIG[btn.dataset.bondType] || {}).nome || '';
        btn.title = isThis ? ('Desativar o modo ' + nomeMod)
                           : ('Ativar o modo ' + nomeMod + ' no canvas');
      });

      // Atualiza indicador no canvas
      if (type && MODE_CONFIG[type]) {
        const cfg = MODE_CONFIG[type];
        indicator.className = `bond-mode-indicator ${cfg.cls}`;
        indicatorIcon.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#ic-${cfg.icon}"/></svg>`;
        indicatorText.textContent = cfg.label;
        // Remove todas as classes de modo do canvas e aplica a atual
        SILQ.canvas.classList.remove('mode-covalent', 'mode-ionic', 'mode-metallic');
        SILQ.canvas.classList.add(cfg.canvasCls);
        SILQ.canvas.style.borderWidth = '2px';
        SILQ.canvas.style.borderStyle = 'solid';
        SILQ.announce(`${cfg.label}. O canvas aceita apenas ligações ${type === 'covalent' ? 'covalentes' : type === 'ionic' ? 'iônicas' : 'metálicas'}.`, 'assertive');
      } else {
        indicator.className = 'bond-mode-indicator hidden';
        SILQ.canvas.classList.remove('mode-covalent', 'mode-ionic', 'mode-metallic');
        SILQ.canvas.style.borderWidth = '';
        SILQ.canvas.style.borderStyle = '';
        SILQ.announce('Modo de ligação desativado — todas as ligações permitidas.');
      }

      // Limpa canvas ao trocar modo para evitar mistura de tipos
      if (SILQ.canvasAtoms.length > 0) {
        SILQ.stopSimLoop();
        SILQ.frozenGeometry = false;
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
        SILQ.clearChart();
      }

      // Ao ativar, o painel se RECOLHE — o gatilho abre espaço pro
      // canvas. Reabrir é um clique no cabeçalho, a qualquer momento.
      if (type) {
        const painelAtivo = document.querySelector(`#sidebar-left [data-bond-type="${type}"]`)?.closest('.panel');
        if (painelAtivo) {
          const hdr = painelAtivo.querySelector('.panel-header');
          const bd = painelAtivo.querySelector('.panel-body');
          if (hdr) hdr.setAttribute('aria-expanded', 'false');
          if (bd) bd.classList.add('collapsed');
        }
      }
      SILQ.syncMobileModeUI(type);
    }

    function clearMode() {
      setMode(null);
    }

    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.bondType;
        // Toggle: se já ativo, desativa
        if (SILQ.activeBondFilter === type) {
          clearMode();
        } else {
          setMode(type);
        }
      });
    });

    if (indicatorClear) {
      indicatorClear.addEventListener('click', clearMode);
    }
  })();

  // Seletor de ordem de ligação
  document.querySelectorAll('.bond-order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.order;
      const order = val === 'auto' ? null : parseInt(val);
      SILQ.setBondOrder(order);
      SILQ.updateBondOrderARIA(order);
      const labels = {auto:'Automático', '1':'Simples', '2':'Dupla', '3':'Tripla'};
      SILQ.announce(`Ordem de ligação: ${labels[val]||val}.`);
    });
  });

  // Inicializa aria-pressed
  SILQ.updateBondOrderARIA(null);
});


