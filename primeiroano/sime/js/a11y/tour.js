/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) do SIME. Dois momentos:

   1. Boas-vindas geral — os 3 módulos → escolher a substância →
      os controles (temperatura/pressão/volume) → o estado & medidas.
   2. Módulo (1ª vez que qualquer um dos 3 é ativado) — UM tour só,
      reaproveitado pelos 3 (Gases/Líquidos/Sólidos): a estrutura de
      cada card é idêntica (definição, fact-grid, "no experimento",
      exemplos clicáveis) — só o CONTEÚDO muda, e esse conteúdo já
      está escrito na própria página. O tour explica a MECÂNICA da
      interface (o que cada bloco faz), não repete o fato físico.

   Mesma lógica mobile/desktop do SIEM/SIQI: #sidebar-left é
   display:none no mobile (mode-tabs-mobile assume o lugar) e
   #sidebar-right vira bottom sheet (mobile-menu-btn-right abre).

   Depende de: coachmark.js (motor genérico, referenciado da raiz).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;

  var LARGURA_MOBILE = 900; // mesmo ponto de corte do CSS (ver stylesime.css)
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
        alvo: '#hdr-controles',
        titulo: 'Temperatura, pressão e volume',
        texto: 'Esses três controles movem a amostra pelas transições de fase — observe o cilindro reagir em tempo real.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-controles'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#hdr-medidas',
        titulo: 'Estado & medidas',
        texto: 'Acompanhe aqui o estado físico atual e as medidas da substância enquanto você mexe nos controles.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-medidas'); },
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
        texto: 'A lista aqui tem substâncias reais — o cilindro central reage de acordo com a que você escolher.',
        ao_entrar: function () { abrirPainel('hdr-substancia'); }
      },
      {
        alvo: '#hdr-controles',
        titulo: 'Temperatura, pressão e volume',
        texto: 'Esses três controles movem a amostra pelas transições de fase — observe o cilindro reagir em tempo real.',
        ao_entrar: function () { abrirPainel('hdr-controles'); }
      },
      {
        alvo: '#hdr-medidas',
        titulo: 'Estado & medidas',
        texto: 'Acompanhe aqui o estado físico atual e as medidas da substância enquanto você mexe nos controles.',
        ao_entrar: function () { abrirPainel('hdr-medidas'); }
      }
    ];
    Coachmark.iniciar({ id: 'sime-boas-vindas', passos: passos });
  }
  if (!Coachmark.jaViu('sime-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ 2. TOUR DE MÓDULO — reaproveitado por Gases/Líquidos/Sólidos ════════
     No desktop aponta pro conteúdo de dentro do card ativo (sidebar
     esquerda). No mobile essa sidebar não existe (mode-tabs-mobile
     assume o lugar) — o balão vira flutuante, com o mesmo texto, em
     vez de apontar pra algo que não vai estar na tela. */
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
        texto: 'A mesma aba explica o que procurar no cilindro central quando você mexer nos controles com esse módulo ativo.'
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
        texto: 'Essa nota explica o que procurar no cilindro central quando você mexer nos controles com esse módulo ativo.'
      },
      {
        alvo: 'section[data-modulo="' + modulo + '"] .chip-row',
        titulo: 'Exemplos prontos',
        texto: 'Clique em qualquer um desses pra carregar a substância direto — sem precisar procurar na lista completa.'
      }
    ];
    Coachmark.iniciar({ id: 'sime-modulo-' + modulo, passos: passos });
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
      var id = 'sime-modulo-' + modulo;
      if (!Coachmark.jaViu(id)) {
        setTimeout(function () {
          depoisDoModalAntigoFechar(function () { tourModulo(modulo, headerId); });
        }, 400);
      }
    });
  });
});
