/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) do SIEM. Estrutura quase idêntica ao
   SIME (mesmos 3 módulos de estado físico), com uma diferença: o
   SIEM tem um painel exclusivo de Diagrama de Fases, que o SIME não
   tem — por isso ganha um passo a mais no tour de boas-vindas.

   1. Boas-vindas geral — os 3 módulos → substância → diagrama de
      fases (exclusivo daqui) → controles → dados & medidas.
   2. Módulo (1ª vez que qualquer um dos 3 é ativado) — UM tour só,
      reaproveitado pelos 3, igual ao SIME.

   Depende de: coachmark.js (motor genérico, referenciado da raiz).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;

  var LARGURA_MOBILE = 900;
  function ehMobile() { return window.innerWidth <= LARGURA_MOBILE; }

  function abrirPainel(headerId) {
    var header = document.getElementById(headerId);
    if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
  }
  function abrirGavetaDireitaMobile() {
    var lado = document.querySelector('.sidebar--right');
    if (lado && !lado.classList.contains('mobile-open')) {
      var btn = document.getElementById('mobile-menu-btn-right');
      if (btn) btn.click();
    }
  }
  function fecharGavetaDireitaMobile() {
    var lado = document.querySelector('.sidebar--right');
    if (lado && lado.classList.contains('mobile-open')) {
      var btn = document.getElementById('mobile-menu-btn-right');
      if (btn) btn.click();
    }
  }

  /* ════════ 1. BOAS-VINDAS GERAL ════════ */
  function tourBoasVindas() {
    var passos = ehMobile() ? [
      {
        alvo: '#mode-tabs-mobile',
        titulo: 'Escolha um módulo',
        texto: 'Gases, Líquidos ou Sólidos — cada um explica o comportamento das partículas naquele estado.'
      },
      {
        alvo: '#hdr-substancia',
        titulo: 'Escolha uma substância',
        texto: 'Toque no ícone de engrenagem, no canto superior, pra abrir a lista de substâncias reais.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-substancia'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#hdr-diagrama',
        titulo: 'Diagrama de fases',
        texto: 'Veja em que região do diagrama pressão × temperatura a substância está — e como ela se move quando você muda os controles.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-diagrama'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#hdr-controles',
        titulo: 'Controles',
        texto: 'Temperatura e pressão movem a amostra pelas transições de fase — observe o experimento reagir em tempo real.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-controles'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#hdr-dados',
        titulo: 'Dados & medidas',
        texto: 'Acompanhe aqui o estado físico atual e as medidas da substância enquanto você mexe nos controles.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-dados'); },
        ao_sair: fecharGavetaDireitaMobile
      }
    ] : [
      {
        alvo: '#sidebar-left',
        titulo: 'Escolha um módulo',
        texto: 'Gases, Líquidos ou Sólidos — cada um explica o comportamento das partículas naquele estado.'
      },
      {
        alvo: '#hdr-substancia',
        titulo: 'Escolha uma substância',
        texto: 'A lista aqui tem substâncias reais — o experimento reage de acordo com a que você escolher.',
        ao_entrar: function () { abrirPainel('hdr-substancia'); }
      },
      {
        alvo: '#hdr-diagrama',
        titulo: 'Diagrama de fases',
        texto: 'Veja em que região do diagrama pressão × temperatura a substância está — e como ela se move quando você muda os controles.',
        ao_entrar: function () { abrirPainel('hdr-diagrama'); }
      },
      {
        alvo: '#hdr-controles',
        titulo: 'Controles',
        texto: 'Temperatura e pressão movem a amostra pelas transições de fase — observe o experimento reagir em tempo real.',
        ao_entrar: function () { abrirPainel('hdr-controles'); }
      },
      {
        alvo: '#hdr-dados',
        titulo: 'Dados & medidas',
        texto: 'Acompanhe aqui o estado físico atual e as medidas da substância enquanto você mexe nos controles.',
        ao_entrar: function () { abrirPainel('hdr-dados'); }
      }
    ];
    Coachmark.iniciar({ id: 'siem-boas-vindas', passos: passos });
  }
  if (!Coachmark.jaViu('siem-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ 2. TOUR DE MÓDULO — reaproveitado por Gases/Líquidos/Sólidos ════════ */
  var NOMES_MODULO = { gasoso: 'Gases', liquido: 'Líquidos', solido: 'Sólidos' };
  function tourModulo(modulo, headerId) {
    var nome = NOMES_MODULO[modulo] || modulo;
    abrirPainel(headerId);
    var passos = ehMobile() ? [
      {
        alvo: null,
        titulo: 'Como é esse estado',
        texto: 'Toque na aba "' + nome + '" pra rever forma, volume, compressibilidade e força intermolecular típica desse estado.'
      },
      {
        alvo: null,
        titulo: 'O que esperar no experimento',
        texto: 'A mesma aba explica o que procurar no experimento quando você mexer nos controles com esse módulo ativo.'
      },
      {
        alvo: null,
        titulo: 'Exemplos prontos',
        texto: 'Ali também tem substâncias prontas pra clicar e carregar direto — sem precisar procurar na lista completa.'
      }
    ] : [
      {
        alvo: '#body-mod-' + modulo + ' .fact-grid',
        titulo: 'Como é esse estado',
        texto: 'Forma, volume, compressibilidade e força intermolecular típica de ' + nome.toLowerCase() + ' — resumo rápido antes de ir pro experimento.'
      },
      {
        alvo: 'section[data-modulo="' + modulo + '"] .canvas-interactions',
        titulo: 'O que esperar no experimento',
        texto: 'Essa nota explica o que procurar no experimento quando você mexer nos controles com esse módulo ativo.'
      },
      {
        alvo: 'section[data-modulo="' + modulo + '"] .chip-row',
        titulo: 'Exemplos prontos',
        texto: 'Clique em qualquer um desses pra carregar a substância direto — sem precisar procurar na lista completa.'
      }
    ];
    Coachmark.iniciar({ id: 'siem-modulo-' + modulo, passos: passos });
  }

  /* ── espera o modal antigo de resumo (mode-info-modal, só no
     mobile — ver modo-mobile.js) fechar antes de iniciar o tour.
     São DOIS avisos de "1ª vez" diferentes, com informação
     diferente — não devem aparecer ao mesmo tempo, um por cima do
     outro. Se o modal antigo não estiver aberto (desktop, ou já foi
     fechado), inicia o tour na hora. ── */
  function depoisDoModalAntigoFechar(tourFn) {
    var overlay = document.getElementById('modeInfoOverlay');
    if (!overlay || !overlay.classList.contains('aberto')) {
      tourFn();
      return;
    }
    var observer = new MutationObserver(function () {
      if (!overlay.classList.contains('aberto')) {
        observer.disconnect();
        setTimeout(tourFn, 300);
      }
    });
    observer.observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }

  document.querySelectorAll('.mode-activate-btn[data-modulo-ativar]').forEach(function (btn) {
    var modulo = btn.dataset.moduloAtivar;
    var headerId = 'hdr-mod-' + modulo;
    btn.addEventListener('click', function () {
      var id = 'siem-modulo-' + modulo;
      if (!Coachmark.jaViu(id)) {
        setTimeout(function () {
          depoisDoModalAntigoFechar(function () { tourModulo(modulo, headerId); });
        }, 400);
      }
    });
  });
});
