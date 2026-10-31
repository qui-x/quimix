/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING — tour.js (SITQ)
   ───────────────────────────────────────────────────────────────
   6 módulos, arquitetura estática (padrão SILQ/SIME — diferente do
   SIGAS/SISOL, que geram os cards em tempo de execução): Calorímetro,
   Curva de Aquecimento, Endo×Exo, Lei de Hess, Energia de Ligação,
   Espontaneidade (ΔG). O painel Resultados é sempre visível,
   independe do módulo — por isso entra no tour geral, não em cada
   módulo. Sem modal antigo de resumo (mode-info-modal) — este
   simulador não tem esse popup, não precisa de sequenciamento.

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

  /* ════════ 1. BOAS-VINDAS GERAL ════════ */
  function tourBoasVindas() {
    Coachmark.iniciar({
      id: 'sitq-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mobile-info-btn' : '#sidebar-left',
          titulo: 'Seis módulos de termoquímica',
          texto: ehMobile()
            ? 'Toque aqui pra abrir a lista de módulos — Calorímetro, Curva de Aquecimento, Endo×Exo, Lei de Hess, Energia de Ligação e Espontaneidade.'
            : 'Calorímetro, Curva de Aquecimento, Endo×Exo, Lei de Hess, Energia de Ligação e Espontaneidade — cada um com seu próprio experimento.'
        },
        {
          alvo: '#hdr-result',
          titulo: 'Resultados sempre visíveis',
          texto: 'Esse painel não muda de lugar — os valores calculados (Q, ΔH, ΔG...) aparecem aqui não importa qual módulo esteja ativo.',
          ao_entrar: function () { abrirPainel('hdr-result'); }
        }
      ]
    });
  }
  if (!Coachmark.jaViu('sitq-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO ════════ */
  var TOURS_MODULO = {
    calor: function () {
      abrirPainel('hdr-calor');
      var passos = ehMobile() ? [
        { alvo: null, titulo: 'Escolha uma substância', texto: 'A lista tem 18 substâncias reais, cada uma com seu próprio calor específico.' },
        { alvo: null, titulo: 'Ajuste massa e ΔT', texto: 'Os controles calculam o calor trocado — Q = m·c·ΔT — em tempo real.' }
      ] : [
        { alvo: '#body-calor', titulo: 'Escolha uma substância', texto: 'A lista tem 18 substâncias reais, cada uma com seu próprio calor específico.' },
        { alvo: '#body-controles', titulo: 'Ajuste massa e ΔT', texto: 'Os controles calculam o calor trocado — Q = m·c·ΔT — em tempo real.', ao_entrar: function () { abrirPainel('hdr-controles'); } }
      ];
      Coachmark.iniciar({ id: 'sitq-modulo-calor', passos: passos });
    },
    curva: function () {
      abrirPainel('hdr-curva');
      var passos = [
        { alvo: ehMobile() ? null : '#body-curva', titulo: 'Aqueça a substância', texto: 'Acompanhe a curva de aquecimento — a temperatura sobe até parar nos platôs de mudança de estado (fusão, ebulição).' }
      ];
      Coachmark.iniciar({ id: 'sitq-modulo-curva', passos: passos });
    },
    perfil: function () {
      abrirPainel('hdr-perfil');
      var passos = [
        { alvo: ehMobile() ? null : '#body-perfil', titulo: 'Escolha a reação e o catalisador', texto: 'Veja o diagrama de energia — reagentes, produtos, energia de ativação — e como um catalisador muda o caminho da reação, sem mudar o ΔH.' }
      ];
      Coachmark.iniciar({ id: 'sitq-modulo-perfil', passos: passos });
    },
    hess: function () {
      abrirPainel('hdr-hess');
      var passos = [
        { alvo: ehMobile() ? null : '#body-hess', titulo: 'Monte as etapas', texto: 'Empilhe as reações intermediárias na ordem certa — a Lei de Hess garante que o ΔH total só depende do início e do fim, não do caminho.' }
      ];
      Coachmark.iniciar({ id: 'sitq-modulo-hess', passos: passos });
    },
    ligacao: function () {
      abrirPainel('hdr-ligacao');
      var passos = ehMobile() ? [
        { alvo: null, titulo: 'Escolha a reação', texto: 'Veja a projeção 3D das moléculas — ligações se quebram (absorvem energia) e se formam (liberam energia).' },
        { alvo: null, titulo: 'Consulte a tabela', texto: 'As energias médias de ligação usadas no cálculo ficam nessa aba, pra consulta.' }
      ] : [
        { alvo: '#body-ligacao', titulo: 'Escolha a reação', texto: 'Veja a projeção 3D das moléculas — ligações se quebram (absorvem energia) e se formam (liberam energia).' },
        { alvo: '#body-tabela', titulo: 'Consulte a tabela', texto: 'As energias médias de ligação usadas no cálculo ficam neste painel, pra consulta.', ao_entrar: function () { abrirPainel('hdr-tabela'); } }
      ];
      Coachmark.iniciar({ id: 'sitq-modulo-ligacao', passos: passos });
    },
    gibbs: function () {
      abrirPainel('hdr-gibbs');
      var passos = [
        { alvo: ehMobile() ? null : '#body-gibbs', titulo: 'Ajuste temperatura e a reação', texto: 'ΔG = ΔH − TΔS — veja como a temperatura decide se uma reação é espontânea, mesmo sendo endotérmica.' }
      ];
      Coachmark.iniciar({ id: 'sitq-modulo-gibbs', passos: passos });
    }
  };

  document.querySelectorAll('.mode-activate-btn[data-mode]').forEach(function (btn) {
    var modo = btn.dataset.mode;
    var tourFn = TOURS_MODULO[modo];
    if (!tourFn) return;
    btn.addEventListener('click', function () {
      var id = 'sitq-modulo-' + modo;
      if (!Coachmark.jaViu(id)) setTimeout(tourFn, 400);
    });
  });
});
