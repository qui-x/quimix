/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Easter Eggs
   ARQUIVO: easter-eggs.js
   ───────────────────────────────────────────────────────────────
   Os dois experimentos escondidos, acionados pelo logo do
   cabeçalho: (1) espalhamento de Geiger e Marsden no modelo de
   Rutherford; (2) controles explícitos de salto quântico no
   modelo de Bohr. Inclui o utilitário que garante que o painel
   correspondente apareça expandido na sidebar.
   Adiciona a AtomicApp.prototype: _toggleRutherfordEgg,
   _expandSidebarPanel, _resetEggExperiment, _toggleBohrEgg.
   Depende de: app/atomic-app-core.js, core/audio.js (playTone),
               a11y/acessibilidade.js (announce).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════
  // EASTER EGG — animação da estrutura interna do núcleo (prótons +
  // nêutrons) com a eletrosfera externa, fisicamente simplificada:
  // partículas se atraem por uma força fraca de curto alcance (mimetiza
  // a força nuclear forte mantendo o núcleo coeso) e ficam confinadas
  // numa pequena região central, enquanto pontos de elétron orbitam
  // bem distantes — visualizando a proporção real (núcleo ocupa uma
  // fração minúscula do raio atômico total).
  // ══════════════════════════════════════════════════════════════
  /**
   * EASTER EGG (Rutherford) — experimento de espalhamento de Geiger e
   * Marsden (1909). NÃO é modal: alterna a própria renderização do
   * canvas principal entre a vista padrão (estrutura do núcleo) e o
   * experimento histórico. Disparo manual apenas — nunca contínuo. O
   * ciclo de física/desenho roda dentro do _loop() principal da
   * aplicação, não em um requestAnimationFrame isolado. Acionado
   * exclusivamente pelo logo do cabeçalho (#btn-app-logo) — não há
   * mais nenhum botão na sidebar para isso.
   */
  AtomicApp.prototype._toggleRutherfordEgg = function() {
    const on = !this.sim.ruthEggMode;
    this.sim.ruthEggMode = on;
    this.canvas.classList.toggle('sim-canvas--egg-mode', on);

    const panel = document.getElementById('egg-panel-rutherford');
    if (panel) {
      panel.hidden = !on;
      if (on) this._expandSidebarPanel(panel);
    }

    if (on) {
      this.sim.ruthAlphas = [];
      this.sim.ruthScint = [];
      this.sim.ruthFired = 0;
      this.sim.ruthDeflected = 0;
      this.sim.ruthFoilNuclei = null;
      this.sim._buildRutherford(); // recalcula geometria de espalhamento no canvas principal
      playTone(520, .1, .05);
      setTimeout(()=>playTone(780, .12, .04), 90);
      announce('Experimento de espalhamento de Geiger e Marsden (1909) ativado. Use os botões de disparo manual.', 'assertive');
    } else {
      this.sim._buildRutherford(); // reconstrói a vista padrão (estrutura do núcleo)
      playTone(420, .08, .04);
      announce('Voltando à vista padrão: estrutura interna do núcleo.');
    }
  };

  /**
   * Garante que um painel da sidebar apareça EXPANDIDO (acordeão
   * aberto) e o rola até a área visível. Necessário porque os
   * Easter Eggs reaproveitam o componente padrão de acordeão — o
   * usuário pode tê-lo recolhido manualmente numa sessão anterior, e
   * isso não deve impedir o painel de aparecer aberto ao ser revelado
   * de novo pelo logo.
   */
  AtomicApp.prototype._expandSidebarPanel = function(panel) {
    const header = panel.querySelector('.panel-header');
    const body = panel.querySelector('.panel-body');
    if (header) header.setAttribute('aria-expanded', 'true');
    if (body) body.classList.remove('collapsed');
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  AtomicApp.prototype._resetEggExperiment = function() {
    this.sim.ruthAlphas = [];
    this.sim.ruthScint = [];
    this.sim.ruthFired = 0;
    this.sim.ruthDeflected = 0;
    announce('Experimento reiniciado.');
    playTone(600, .07, .04);
  };

  /**
   * EASTER EGG (Bohr) — controles explícitos de salto quântico entre
   * camadas (seletor de/para, botões de excitar/retornar, log de
   * fótons, fórmula de energia). A interação básica de clicar numa
   * órbita no canvas para excitar um elétron continua funcionando
   * independente deste modo — o Easter Egg só adiciona os controles
   * EXPLÍCITOS de escolher origem/destino, agora num painel de
   * acordeão na sidebar (não mais ao lado do canvas).
   */
  AtomicApp.prototype._toggleBohrEgg = function() {
    const on = !this.sim.bohrEggMode;
    this.sim.bohrEggMode = on;

    const panel = document.getElementById('egg-panel-bohr');
    if (panel) {
      panel.hidden = !on;
      if (on) this._expandSidebarPanel(panel);
    }

    if (on) {
      this._updateBohrShellSelectors();
      playTone(520, .1, .05);
      setTimeout(()=>playTone(780, .12, .04), 90);
      announce('Controles de salto quântico de Bohr (1913) ativados.', 'assertive');
    } else {
      playTone(420, .08, .04);
      announce('Controles de salto quântico ocultados.');
    }
  };

