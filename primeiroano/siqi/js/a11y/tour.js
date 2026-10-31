/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) do SIQI. Mesmo padrão do SILQ: um tour
   geral de boas-vindas + um tour próprio por módulo (Construtor e
   Nomenclatura), disparado na primeira vez que aquele módulo
   específico é ativado.

   BUG CORRIGIDO: os alvos abaixo assumiam a interface de DESKTOP —
   no mobile, #sidebar-left fica display:none (a barra
   #mode-tabs-mobile assume esse lugar) e #sidebar-right só aparece
   depois de tocar em #mobile-menu-btn-right (vira bottom sheet). O
   balão aparecia, mas o "menu" que ele descrevia nunca existiu na
   tela. Corrigido detectando a largura da tela (mesmo ponto de
   corte do CSS, 900px) e montando um roteiro diferente pra cada
   caso — a #sim-area central (onde o Construtor/Ficha aparecem) não
   muda entre mobile/desktop, só as duas sidebars.

   Depende de: coachmark.js (motor genérico, referenciado da raiz),
               siqi:module-switch (evento já disparado por
               trocarModulo() em js/modulos/alternar.js).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;

  var LARGURA_MOBILE = 900; // mesmo ponto de corte do CSS (ver stylesiqi.css)
  function ehMobile() { return window.innerWidth <= LARGURA_MOBILE; }

  function abrirPainel(headerId) {
    var header = document.getElementById(headerId);
    if (header) {
      var painel = header.closest('.panel');
      if (painel && painel.dataset.open !== 'true') header.click();
    }
  }

  /* No mobile, a sidebar direita (Biblioteca, Dados & Estrutura,
     Balanço) só aparece depois de tocar no botão de engrenagem — é
     um bottom sheet, não fica sempre visível como no desktop. */
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
        texto: 'Construtor ou Nomenclatura — cada um ensina a montar o nome de um composto de um jeito diferente.'
      },
      {
        alvo: '#sim-area',
        titulo: 'Veja tudo acontecer aqui',
        texto: 'O composto escolhido alimenta todos os painéis — dados, estrutura e balanço atômico ficam atrás do ícone de engrenagem, no canto superior.'
      }
    ] : [
      {
        alvo: '#sidebar-left',
        titulo: 'Escolha um módulo',
        texto: 'Construtor ou Nomenclatura — cada um ensina a montar o nome de um composto de um jeito diferente.'
      },
      {
        alvo: '#sim-area',
        titulo: 'Veja tudo acontecer aqui',
        texto: 'O composto escolhido alimenta todos os painéis ao redor — dados, estrutura e balanço atômico.'
      }
    ];
    Coachmark.iniciar({ id: 'siqi-boas-vindas-v2', passos: passos });
  }
  if (!Coachmark.jaViu('siqi-boas-vindas-v2')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ 2. TOUR DO MÓDULO — CONSTRUTOR ════════ */
  function tourConstrutor() {
    var passos = ehMobile() ? [
      {
        alvo: '#hdr-construtor-biblioteca',
        titulo: 'Escolha um composto',
        texto: 'Toque no ícone de engrenagem, no canto superior, pra abrir a Biblioteca — o nome fica em segredo até você montá-lo certo.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-construtor-biblioteca'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#construtor-central-content',
        titulo: 'Monte o nome',
        texto: 'Arraste os blocos (metal, conectivo, cátion/ânion) até os espaços certos, na ordem certa.'
      },
      {
        alvo: null,
        titulo: 'Confira sua resposta',
        texto: 'O Validador e o Balanço Atômico, na engrenagem no topo, mostram se você está no caminho certo antes de confirmar.'
      }
    ] : [
      {
        alvo: '#hdr-construtor-biblioteca',
        titulo: 'Escolha um composto',
        texto: 'Escolha um composto pela fórmula — o nome fica em segredo até você montá-lo certo na área central.',
        ao_entrar: function () { abrirPainel('hdr-construtor-biblioteca'); }
      },
      {
        alvo: '#construtor-central-content',
        titulo: 'Monte o nome',
        texto: 'Arraste os blocos (metal, conectivo, cátion/ânion) até os espaços certos, na ordem certa.'
      },
      {
        alvo: null,
        titulo: 'Confira sua resposta',
        texto: 'O Validador e o Balanço Atômico, na barra direita, mostram se você está no caminho certo antes de confirmar.'
      }
    ];
    Coachmark.iniciar({ id: 'siqi-modulo-construtor-v2', passos: passos });
  }

  /* ════════ 3. TOUR DO MÓDULO — NOMENCLATURA ════════ */
  function tourNomenclatura() {
    var passos = ehMobile() ? [
      {
        alvo: '#hdr-compostos',
        titulo: 'Escolha um composto',
        texto: 'Toque no ícone de engrenagem, no canto superior, pra abrir a Biblioteca — escolha um composto real pra consultar tudo sobre ele.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-compostos'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#panel-info',
        titulo: 'Nome, fórmula e estrutura',
        texto: 'Ao contrário do Construtor, aqui o nome já aparece — é pra consultar e entender, não pra adivinhar.'
      }
    ] : [
      {
        alvo: '#hdr-compostos',
        titulo: 'Escolha um composto',
        texto: 'A Biblioteca aqui alimenta a Ficha ao lado — escolha um composto real pra consultar tudo sobre ele.',
        ao_entrar: function () { abrirPainel('hdr-compostos'); }
      },
      {
        alvo: '#panel-info',
        titulo: 'Nome, fórmula e estrutura',
        texto: 'Ao contrário do Construtor, aqui o nome já aparece — é pra consultar e entender, não pra adivinhar.'
      }
    ];
    Coachmark.iniciar({ id: 'siqi-modulo-nomenclatura-v2', passos: passos });
  }

  /* ── espera o modal antigo de resumo (mode-info-modal, só no
     mobile — ver js/ui/modo-mobile.js) fechar antes de iniciar o
     tour. São DOIS avisos de "1ª vez" diferentes, com informação
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

  window.addEventListener('siqi:module-switch', function (e) {
    var modulo = e.detail && e.detail.module;
    if (modulo === 'construtor' && !Coachmark.jaViu('siqi-modulo-construtor-v2')) {
      setTimeout(function () { depoisDoModalAntigoFechar(tourConstrutor); }, 400);
    } else if (modulo === 'nomenclatura' && !Coachmark.jaViu('siqi-modulo-nomenclatura-v2')) {
      setTimeout(function () { depoisDoModalAntigoFechar(tourNomenclatura); }, 400);
    }
  });
});
