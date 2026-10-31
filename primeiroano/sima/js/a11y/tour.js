/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) do SIMA. Dois momentos:

   1. Boas-vindas geral — os 5 modelos atômicos (linha do tempo) →
      escolher o elemento na tabela periódica → dados do elemento.
   2. Modelo (1ª vez que qualquer um dos 5 é ativado) — UM tour só,
      reaproveitado pelos 5 (Dalton/Thomson/Rutherford/Bohr/
      Quântico): a estrutura de cada card é idêntica (definição,
      fact-grid, interações do canvas, elementos/nota) — só o
      CONTEÚDO muda. O Quântico ganha um passo a mais, exclusivo
      dele: o painel de Projeção (probabilidade eletrônica), que
      fica escondido pros outros 4 modelos.

   Mesma lógica mobile/desktop dos outros: #sidebar-left é
   display:none no mobile (mode-tabs-mobile assume o lugar) e
   #sidebar-right vira bottom sheet (mobile-menu-btn abre — aqui
   sem sufixo "-right", único botão mobile deste simulador).

   Depende de: coachmark.js (motor genérico, referenciado da raiz).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;

  var LARGURA_MOBILE = 900; // mesmo ponto de corte do CSS (ver stylesima.css)
  function ehMobile() { return window.innerWidth <= LARGURA_MOBILE; }

  function abrirPainel(headerId) {
    var header = document.getElementById(headerId);
    if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
  }
  function abrirGavetaDireitaMobile() {
    var lado = document.getElementById('sidebar-right');
    if (lado && !lado.classList.contains('mobile-open')) {
      var btn = document.getElementById('mobile-menu-btn');
      if (btn) btn.click();
    }
  }
  function fecharGavetaDireitaMobile() {
    var lado = document.getElementById('sidebar-right');
    if (lado && lado.classList.contains('mobile-open')) {
      var btn = document.getElementById('mobile-menu-btn');
      if (btn) btn.click();
    }
  }

  /* ════════ 1. BOAS-VINDAS GERAL ════════ */
  function tourBoasVindas() {
    var passos = ehMobile() ? [
      {
        alvo: '#mode-tabs-mobile',
        titulo: 'Escolha um modelo atômico',
        texto: 'De Dalton (1803) ao modelo Quântico (1926) — em ordem cronológica, cada um mostra como a ideia de átomo evoluiu.'
      },
      {
        alvo: '#hdr-periodic',
        titulo: 'Escolha o elemento',
        texto: 'Toque no ícone de engrenagem, no canto superior, pra abrir a Tabela Periódica e escolher qual átomo simular.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-periodic'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#hdr-eldata',
        titulo: 'Dados do elemento',
        texto: 'Número atômico, massa, distribuição eletrônica — ficha completa do elemento escolhido.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-eldata'); },
        ao_sair: fecharGavetaDireitaMobile
      }
    ] : [
      {
        alvo: '#sidebar-left',
        titulo: 'Escolha um modelo atômico',
        texto: 'De Dalton (1803) ao modelo Quântico (1926) — em ordem cronológica, cada um mostra como a ideia de átomo evoluiu.'
      },
      {
        alvo: '#hdr-periodic',
        titulo: 'Escolha o elemento',
        texto: 'A Tabela Periódica aqui define qual átomo é simulado — clique num elemento pra trocar.',
        ao_entrar: function () { abrirPainel('hdr-periodic'); }
      },
      {
        alvo: '#hdr-eldata',
        titulo: 'Dados do elemento',
        texto: 'Número atômico, massa, distribuição eletrônica — ficha completa do elemento escolhido.',
        ao_entrar: function () { abrirPainel('hdr-eldata'); }
      }
    ];
    Coachmark.iniciar({ id: 'sima-boas-vindas', passos: passos });
  }
  if (!Coachmark.jaViu('sima-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ 2. TOUR DE MODELO — reaproveitado pelos 5 ════════ */
  var NOMES_MODELO = {
    dalton: 'Dalton', thomson: 'Thomson', rutherford: 'Rutherford',
    bohr: 'Bohr', quantum: 'Quântico'
  };
  function tourModelo(modelo, headerId) {
    var nome = NOMES_MODELO[modelo] || modelo;
    abrirPainel(headerId);
    var passosBase = ehMobile() ? [
      {
        alvo: null,
        titulo: 'O que esse modelo prevê',
        texto: 'Toque na aba "' + nome + '" pra rever o que esse modelo previu (ou não) sobre núcleo, elétrons e a forma do átomo.'
      },
      {
        alvo: null,
        titulo: 'No canvas',
        texto: 'A mesma aba explica o que muda visualmente no átomo quando esse modelo está ativo.'
      }
    ] : [
      {
        alvo: '#body-mode-' + modelo + ' .fact-grid',
        titulo: 'O que esse modelo prevê',
        texto: 'Núcleo, elétrons, forma do átomo — o que o modelo de ' + nome + ' já previa e o que ainda não.'
      },
      {
        alvo: '#body-mode-' + modelo + ' .canvas-interactions',
        titulo: 'No canvas',
        texto: 'Essa nota explica o que muda visualmente no átomo quando esse modelo está ativo.'
      }
    ];
    /* Quântico é o único com um painel exclusivo: a Projeção de
       densidade de probabilidade eletrônica, escondida pros outros
       4 modelos (eles não preveem "nuvem" nenhuma pra mostrar). */
    if (modelo === 'quantum') {
      passosBase.push(ehMobile() ? {
        alvo: '#hdr-projection',
        titulo: 'Nuvem de probabilidade',
        texto: 'Só o modelo Quântico tem esse painel — toque no ícone de engrenagem pra ver a densidade de probabilidade eletrônica.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-projection'); },
        ao_sair: fecharGavetaDireitaMobile
      } : {
        alvo: '#hdr-projection',
        titulo: 'Nuvem de probabilidade',
        texto: 'Só o modelo Quântico tem esse painel — a densidade de probabilidade eletrônica, em vez de uma órbita fixa.',
        ao_entrar: function () { abrirPainel('hdr-projection'); }
      });
    }
    Coachmark.iniciar({ id: 'sima-modelo-' + modelo, passos: passosBase });
  }

  /* ── espera o modal antigo de resumo (mode-info-modal, só no
     mobile — ver js/app/modo-mobile.js) fechar antes de iniciar o
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

  document.querySelectorAll('.mode-activate-btn[data-model]').forEach(function (btn) {
    var modelo = btn.dataset.model;
    var headerId = 'hdr-mode-' + modelo;
    btn.addEventListener('click', function () {
      var id = 'sima-modelo-' + modelo;
      if (!Coachmark.jaViu(id)) {
        setTimeout(function () {
          depoisDoModalAntigoFechar(function () { tourModelo(modelo, headerId); });
        }, 400);
      }
    });
  });
});
