/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) do SIE.

   1. Boas-vindas geral — os módulos → reações prontas → análise
      estequiométrica → dados da reação.
   2. Módulo Estequiometria (1ª vez que é ativado) — o único módulo
      funcional hoje: escolher uma reação → energia de ativação →
      produtos no canvas → dados calculados.

   O módulo "Mols" ainda está em desenvolvimento (só o card existe,
   com aviso — ver comentário em indexsie.html) — de propósito, não
   tem tour próprio ainda: não faz sentido guiar por uma tela que
   ainda não foi desenhada. Quando o Mols ganhar conteúdo de verdade,
   entra aqui do mesmo jeito que o de Estequiometria.

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
    var lado = document.querySelector('.sidebar--right') || document.getElementById('sidebar-right');
    if (lado && !lado.classList.contains('mobile-open')) {
      var btn = document.getElementById('mobile-menu-btn');
      if (btn) btn.click();
    }
  }
  function fecharGavetaDireitaMobile() {
    var lado = document.querySelector('.sidebar--right') || document.getElementById('sidebar-right');
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
        titulo: 'Escolha um módulo',
        texto: 'Estequiometria calcula reagentes e produtos numa reação — o módulo Mols ainda está sendo construído.'
      },
      {
        alvo: '#hdr-reactions',
        titulo: 'Escolha uma reação pronta',
        texto: 'Toque no ícone de engrenagem, no canto superior, pra abrir a lista de reações já balanceadas.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-reactions'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: null,
        titulo: 'Dados da reação',
        texto: 'Depois que a reação acontece, os resultados calculados (reagente limitante, rendimento) aparecem no painel "Dados da Reação" — vazio até lá, de propósito.'
      }
    ] : [
      {
        alvo: '#sidebar-left',
        titulo: 'Escolha um módulo',
        texto: 'Estequiometria calcula reagentes e produtos numa reação — o módulo Mols ainda está sendo construído.'
      },
      {
        alvo: '#hdr-reactions',
        titulo: 'Escolha uma reação pronta',
        texto: 'A lista aqui tem reações já balanceadas — clique numa pra carregar os reagentes no canvas.',
        ao_entrar: function () { abrirPainel('hdr-reactions'); }
      },
      {
        alvo: null,
        titulo: 'Dados da reação',
        texto: 'Depois que a reação acontece, os resultados calculados (reagente limitante, rendimento) aparecem no painel "Dados da Reação" — vazio até lá, de propósito.'
      }
    ];
    Coachmark.iniciar({ id: 'sie-boas-vindas', passos: passos });
  }
  if (!Coachmark.jaViu('sie-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ 2. MÓDULO ESTEQUIOMETRIA ════════ */
  function tourEstequiometria() {
    abrirPainel('hdr-mod-estequiometria');
    var passos = ehMobile() ? [
      {
        alvo: null,
        titulo: 'Como a reação se monta',
        texto: 'Toque na aba "Estequiometria" pra rever a lei de conservação da massa e o que é o reagente limitante.'
      },
      {
        alvo: '#hdr-analysis',
        titulo: 'Forneça energia de ativação',
        texto: 'Toque no ícone de engrenagem pra abrir a Análise Estequiométrica e liberar a reação.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-analysis'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: null,
        titulo: 'Exemplos prontos',
        texto: 'Volte na aba do módulo — ali tem reações prontas pra testar sem precisar montar do zero.'
      }
    ] : [
      {
        alvo: '#body-mod-estequiometria .fact-grid',
        titulo: 'Como a reação se monta',
        texto: 'Lei de Lavoisier, conservação de massa, reagente limitante, grau de avanço — os conceitos por trás do cálculo.'
      },
      {
        alvo: '#hdr-analysis',
        titulo: 'Forneça energia de ativação',
        texto: 'Com os reagentes no canvas, a Análise Estequiométrica aqui libera a reação e mostra os cálculos em tempo real.',
        ao_entrar: function () { abrirPainel('hdr-analysis'); }
      },
      {
        alvo: '#body-mod-estequiometria .chip-row',
        titulo: 'Exemplos prontos',
        texto: 'Bons pontos de partida pra testar — água, sal de cozinha, metano e outras reações conhecidas.'
      }
    ];
    Coachmark.iniciar({ id: 'sie-modulo-estequiometria', passos: passos });
  }

  var btnEsteq = document.querySelector('.mode-activate-btn[data-modulo="estequiometria"]');
  if (btnEsteq) {
    btnEsteq.addEventListener('click', function () {
      if (!Coachmark.jaViu('sie-modulo-estequiometria')) setTimeout(tourEstequiometria, 400);
    });
  }
});
