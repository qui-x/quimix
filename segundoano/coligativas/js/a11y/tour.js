/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING — tour.js (SIPC)
   ───────────────────────────────────────────────────────────────
   5 módulos, cada um com UM painel único — cobertura completa: cada
   módulo aponta pro seu painel com uma explicação do conceito
   específico daquele módulo, tirada do mesmo texto (`sub`) que já
   aparece no card do menu.

   Simulador nascido de uma divisão do SISOL (que reunia "Soluções"
   e "Propriedades Coligativas" num só) — mesma arquitetura de
   #model-list dinâmico (display:contents) e detecção por
   aria-pressed (a barra mobile chama setMode() direto, sem clicar
   no botão real).

   Depende de: coachmark.js (motor genérico, referenciado da raiz).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;

  var LARGURA_MOBILE = 1100;
  function ehMobile() { return window.innerWidth <= LARGURA_MOBILE; }

  function abrirPainel(headerId) {
    var header = document.getElementById(headerId);
    if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
  }
  function depoisDoModalAntigoFechar(tourFn) {
    var overlay = document.getElementById('modeInfoOverlay');
    if (!overlay || !overlay.classList.contains('aberto')) { tourFn(); return; }
    var observer = new MutationObserver(function () {
      if (!overlay.classList.contains('aberto')) {
        observer.disconnect();
        setTimeout(tourFn, 300);
      }
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }

  /* ════════ 1. BOAS-VINDAS GERAL ════════ */
  function tourBoasVindas() {
    Coachmark.iniciar({
      id: 'sipc-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Cinco propriedades coligativas',
          texto: 'Pressão de vapor, misturas de líquidos voláteis, ebulioscopia/crioscopia, osmose e Lei de Henry — cada uma com seu próprio experimento.'
        },
        {
          alvo: '#sim-canvas',
          titulo: 'O canvas muda com o módulo',
          texto: 'O desenho aqui troca completamente conforme o módulo ativo — béquer fechado, tubo em U com membrana, tanque pressurizado e mais.'
        }
      ]
    });
  }
  if (!Coachmark.jaViu('sipc-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO — 1 painel cada, texto vindo do
     mesmo resumo que já aparece no card do menu (SIM_DATA.MODES) ════════ */
  var MODULOS = {
    pvap:   { hdr: 'hdr-pvap', texto: 'A pressão de vapor sobe com a temperatura — e cai com a altitude, por isso a água ferve mais rápido (e a temperaturas mais baixas) no alto de uma montanha.' },
    raoult: { hdr: 'hdr-raoult', texto: 'Nem toda mistura de líquidos voláteis se comporta como a soma das partes — veja quando a Lei de Raoult se aplica e quando não se aplica.' },
    colig:  { hdr: 'hdr-colig', texto: 'Ebulioscopia e crioscopia: adicionar soluto muda o ponto de ebulição e de fusão — e essa mudança (ΔT) serve pra descobrir a massa molar do soluto.' },
    osmose: { hdr: 'hdr-osm', texto: 'Duas soluções de concentrações diferentes, separadas por uma membrana semipermeável — a água atravessa sozinha até equilibrar. Aumente a pressão pra inverter o processo (osmose reversa).' },
    henry:  { hdr: 'hdr-henry', texto: 'A quantidade de gás dissolvido num líquido é proporcional à pressão desse gás sobre o líquido — é por isso que um refrigerante libera bolhas ao abrir a tampa.' }
  };

  function tourModulo(modId) {
    var m = MODULOS[modId];
    if (!m) return;
    abrirPainel(m.hdr);
    Coachmark.iniciar({
      id: 'sipc-modulo-' + modId,
      passos: [
        {
          alvo: ehMobile() ? null : ('#body-' + m.hdr.replace('hdr-', '')),
          titulo: 'Como este módulo funciona',
          texto: m.texto,
          ao_entrar: ehMobile() ? undefined : function () { abrirPainel(m.hdr); }
        },
        {
          alvo: ehMobile() ? null : '#body-result',
          titulo: 'Resultados calculados',
          texto: 'Os valores numéricos relevantes pra esse módulo aparecem aqui, atualizados em tempo real conforme você ajusta os controles.',
          ao_entrar: ehMobile() ? undefined : function () { abrirPainel('hdr-result'); }
        }
      ]
    });
  }

  /* Detecção de ativação: observa aria-pressed (funciona tanto pelo
     botão desktop quanto pela aba mobile, que chama setMode()
     direto sem clicar no botão real — ver app.js). */
  var jaObservados = new WeakSet();
  function observarBotaoModo(btn) {
    if (jaObservados.has(btn)) return;
    jaObservados.add(btn);
    var painel = btn.closest('.panel');
    var header = painel ? painel.querySelector('[id^="hdr-mode-"]') : null;
    if (!header) return;
    var modeId = header.id.replace('hdr-mode-', '');
    if (!MODULOS[modeId]) return;
    new MutationObserver(function () {
      if (btn.getAttribute('aria-pressed') !== 'true') return;
      var id = 'sipc-modulo-' + modeId;
      if (Coachmark.jaViu(id)) return;
      setTimeout(function () {
        depoisDoModalAntigoFechar(function () { tourModulo(modeId); });
      }, 300);
    }).observe(btn, { attributes: true, attributeFilter: ['aria-pressed'] });
  }
  var listaModos = document.getElementById('model-list');
  if (listaModos) {
    listaModos.querySelectorAll('.mode-activate-btn').forEach(observarBotaoModo);
    new MutationObserver(function () {
      listaModos.querySelectorAll('.mode-activate-btn').forEach(observarBotaoModo);
    }).observe(listaModos, { childList: true, subtree: true });
  }
});
