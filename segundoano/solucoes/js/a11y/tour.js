/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING — tour.js (SISOL)
   ───────────────────────────────────────────────────────────────
   9 módulos, cada um com UM painel único (mais compacto que o
   SIGAS) — cobertura completa: cada módulo aponta pro seu painel
   com uma explicação do conceito específico daquele módulo, tirada
   do mesmo texto (`sub`) que já aparece no card do menu.

   Mesma arquitetura do SIGAS/SICQ/SITERMO: #model-list é gerado
   em tempo de execução (display:contents, sem caixa própria — o
   alvo do passo 1 usa #sidebar-left) e a barra mobile chama
   setMode() direto, sem clicar no botão real — por isso a detecção
   observa aria-pressed em vez de clique.

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
      id: 'sisol-boas-vindas-v2',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Quatro módulos sobre soluções',
          texto: 'Classificação de Misturas, Preparo de Solução, Diluição e Mistura, e Curvas de Solubilidade — cada módulo explora um conceito diferente, com o próprio experimento.'
        },
        {
          alvo: '#sim-canvas',
          titulo: 'O canvas muda com o módulo',
          texto: 'O desenho aqui troca completamente conforme o módulo ativo — béquer, gráfico de solubilidade, membrana de osmose e mais.'
        }
      ]
    });
  }
  if (!Coachmark.jaViu('sisol-boas-vindas-v2')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO — 1 painel cada, texto vindo do
     mesmo resumo que já aparece no card do menu (SIM_DATA.MODES) ════════ */
  var MODULOS = {
    classificacao: { hdr: 'hdr-mix', texto: 'Compare o tamanho de partícula de soluções, colóides e suspensões — e veja o efeito Tyndall (o feixe de luz que só aparece em colóides) na prática.' },
    preparo:       { hdr: 'hdr-preparo', texto: 'Monte uma solução com soluto, solvente e temperatura — acompanhe a concentração (C = m/V) e o ponto de saturação em tempo real.' },
    diluicao:      { hdr: 'hdr-dil', texto: 'Abra e feche torneiras de KMnO₄ e água pra ver C₁V₁ = C₂V₂ acontecer — a cor da solução muda junto com a concentração.' },
    curvas:        { hdr: 'hdr-curvas', texto: 'Quinze sais diferentes, cada um com sua própria curva de solubilidade — veja como a temperatura muda quanto cada um dissolve.' }
  };

  function tourModulo(modId) {
    var m = MODULOS[modId];
    if (!m) return;
    abrirPainel(m.hdr);
    Coachmark.iniciar({
      id: 'sisol-modulo-' + modId,
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
      var id = 'sisol-modulo-' + modeId;
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
