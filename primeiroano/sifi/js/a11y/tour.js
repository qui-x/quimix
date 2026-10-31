/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) do SIFI. Diferente do SIME/SIEM (que
   reaproveitam UM tour pros 3 módulos, já que são variações do
   mesmo experimento), os 3 módulos do SIFI são experimentos
   REALMENTE diferentes — cada um ganha o próprio tour:

   1. Boas-vindas geral — os 3 módulos → o canvas central (que muda
      de forma completamente conforme o módulo ativo).
   2. Tabuleiro das Atrações — Biblioteca de Compostos → aproximar
      moléculas no tabuleiro → o painel Interações mostra a força
      detectada.
   3. Termostato Molecular — escolher o líquido → o termostato →
      observar o béquer fechado esquentando.
   4. Laboratório de Solubilidade — Prateleira de Reagentes → os
      tubos de ensaio → adicionar mais tubos.

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
    Coachmark.iniciar({
      id: 'sifi-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Três experimentos diferentes',
          texto: 'Tabuleiro das Atrações, Termostato Molecular e Laboratório de Solubilidade — cada um mostra as forças intermoleculares de um jeito.'
        },
        {
          alvo: '#main-content',
          titulo: 'O canvas muda com o módulo',
          texto: 'O que aparece aqui no meio troca completamente conforme o módulo ativo — tabuleiro, béquer fechado ou tubos de ensaio.'
        }
      ]
    });
  }
  if (!Coachmark.jaViu('sifi-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ 2. MÓDULO 1 — TABULEIRO DAS ATRAÇÕES ════════ */
  function tourModulo1() {
    var passos = ehMobile() ? [
      {
        alvo: '#hdr-biblioteca',
        titulo: 'Escolha moléculas',
        texto: 'Toque no ícone de engrenagem, no canto superior, pra abrir a Biblioteca de Compostos e colocar moléculas no tabuleiro.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-biblioteca'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#sandbox-hint',
        titulo: 'Aproxime duas moléculas',
        texto: 'Arraste duas moléculas até ficarem próximas — a força intermolecular entre elas aparece na hora.'
      },
      {
        alvo: '#hdr-forca',
        titulo: 'Veja a força detectada',
        texto: 'Dipolo-dipolo, ligação de hidrogênio ou força de London — o painel Interações identifica qual está atuando.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-forca'); },
        ao_sair: fecharGavetaDireitaMobile
      }
    ] : [
      {
        alvo: '#hdr-biblioteca',
        titulo: 'Escolha moléculas',
        texto: 'A Biblioteca de Compostos aqui lista as moléculas disponíveis — clique numa pra colocá-la no tabuleiro.',
        ao_entrar: function () { abrirPainel('hdr-biblioteca'); }
      },
      {
        alvo: '#sandbox-hint',
        titulo: 'Aproxime duas moléculas',
        texto: 'Arraste duas moléculas até ficarem próximas — a força intermolecular entre elas aparece na hora.'
      },
      {
        alvo: '#hdr-forca',
        titulo: 'Veja a força detectada',
        texto: 'Dipolo-dipolo, ligação de hidrogênio ou força de London — o painel Interações identifica qual está atuando.',
        ao_entrar: function () { abrirPainel('hdr-forca'); }
      }
    ];
    Coachmark.iniciar({ id: 'sifi-modulo-1', passos: passos });
  }

  /* ════════ 3. MÓDULO 2 — TERMOSTATO MOLECULAR ════════ */
  function tourModulo2() {
    var passos = ehMobile() ? [
      {
        alvo: '#hdr-termostato-liquido',
        titulo: 'Escolha o líquido',
        texto: 'Toque no ícone de engrenagem pra abrir a lista de líquidos — cada um tem forças intermoleculares diferentes.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-termostato-liquido'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#hdr-termostato',
        titulo: 'Ajuste a temperatura',
        texto: 'Aumente a temperatura e observe o líquido, dentro do béquer fechado, se aproximar do ponto de ebulição.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-termostato'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#beaker',
        titulo: 'O béquer fechado',
        texto: 'A ligação covalente de cada molécula continua intacta — só a força intermolecular com as vizinhas é que se rompe ao esquentar.'
      }
    ] : [
      {
        alvo: '#hdr-termostato-liquido',
        titulo: 'Escolha o líquido',
        texto: 'A lista aqui tem líquidos reais, cada um com forças intermoleculares diferentes.',
        ao_entrar: function () { abrirPainel('hdr-termostato-liquido'); }
      },
      {
        alvo: '#hdr-termostato',
        titulo: 'Ajuste a temperatura',
        texto: 'Aumente a temperatura e observe o líquido, dentro do béquer fechado, se aproximar do ponto de ebulição.',
        ao_entrar: function () { abrirPainel('hdr-termostato'); }
      },
      {
        alvo: '#beaker',
        titulo: 'O béquer fechado',
        texto: 'A ligação covalente de cada molécula continua intacta — só a força intermolecular com as vizinhas é que se rompe ao esquentar.'
      }
    ];
    Coachmark.iniciar({ id: 'sifi-modulo-2', passos: passos });
  }

  /* ════════ 4. MÓDULO 3 — LABORATÓRIO DE SOLUBILIDADE ════════ */
  function tourModulo3() {
    var passos = ehMobile() ? [
      {
        alvo: '#hdr-prateleira',
        titulo: 'Escolha um reagente',
        texto: 'Toque no ícone de engrenagem pra abrir a Prateleira de Reagentes.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-prateleira'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#lab-tubos',
        titulo: 'Escolha um tubo de ensaio',
        texto: 'Toque num tubo e depois num reagente na prateleira — "semelhante dissolve semelhante" é o que você vai testar aqui.'
      },
      {
        alvo: '#btn-adicionar-tubo',
        titulo: 'Adicione mais tubos',
        texto: 'Compare até 10 combinações diferentes de uma vez, lado a lado.'
      }
    ] : [
      {
        alvo: '#hdr-prateleira',
        titulo: 'Escolha um reagente',
        texto: 'A Prateleira de Reagentes aqui tem as substâncias disponíveis pra testar solubilidade.',
        ao_entrar: function () { abrirPainel('hdr-prateleira'); }
      },
      {
        alvo: '#lab-tubos',
        titulo: 'Escolha um tubo de ensaio',
        texto: 'Clique num tubo e depois num reagente na prateleira — "semelhante dissolve semelhante" é o que você vai testar aqui.'
      },
      {
        alvo: '#btn-adicionar-tubo',
        titulo: 'Adicione mais tubos',
        texto: 'Compare até 10 combinações diferentes de uma vez, lado a lado.'
      }
    ];
    Coachmark.iniciar({ id: 'sifi-modulo-3', passos: passos });
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

  var TOURS_MODULO = { '1': tourModulo1, '2': tourModulo2, '3': tourModulo3 };
  document.querySelectorAll('.bond-mode-btn[data-module]').forEach(function (btn) {
    var modulo = btn.dataset.module;
    btn.addEventListener('click', function () {
      var id = 'sifi-modulo-' + modulo;
      var tourFn = TOURS_MODULO[modulo];
      if (tourFn && !Coachmark.jaViu(id)) {
        setTimeout(function () { depoisDoModalAntigoFechar(tourFn); }, 400);
      }
    });
  });
});
