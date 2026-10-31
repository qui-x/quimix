/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) do SITP. Dois momentos:

   1. Boas-vindas geral — dispara uma vez, na primeira visita: a
      tabela em si → o modo de propriedades (colore tudo por
      escala) → o controle de temperatura.
   2. Modal do elemento — dispara na primeira vez que qualquer
      elemento é aberto. Cobertura completa da ficha: navegação →
      estado físico → distribuição eletrônica → propriedades
      periódicas → as 5 vistas do raio atômico → tela cheia.

   A legenda e os controles de propriedade (passo 1) vivem DENTRO da
   própria grade da tabela — não precisam de tratamento mobile
   especial. O MODAL, porém, muda de verdade: em telas largas todas
   as seções (.info-card) ficam visíveis, uma embaixo da outra; em
   telas estreitas (bottom sheet) elas viram ABAS — só uma seção por
   vez fica visível (ver secoes-mobile.js). Sem selecionar a aba
   certa antes de cada passo, o alvo daquele passo simplesmente não
   está na tela — por isso o helper selecionarAbaMobileParaAlvo()
   abaixo.

   Depende de: coachmark.js (motor genérico, referenciado da raiz).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;

  var LARGURA_MOBILE = 760; // mesmo ponto de corte do CSS do modal (secoes-mobile.js)
  function ehMobile() { return window.innerWidth <= LARGURA_MOBILE; }

  /* No mobile, cada seção do modal (.info-card) tem uma aba própria
     (#modalAba0, #modalAba1...) na mesma ordem em que os cards
     aparecem em .modal-body. Dado um seletor de alvo (que pode estar
     DENTRO de um card, não ser o card em si), acha o card mais
     próximo e toca na aba correspondente — só assim o conteúdo
     daquela seção existe na tela pra ser destacado. */
  function selecionarAbaMobileParaAlvo(seletorAlvo) {
    if (!ehMobile()) return;
    var corpo = document.querySelector('.modal-body');
    var alvoEl = document.querySelector(seletorAlvo);
    if (!corpo || !alvoEl) return;
    var card = alvoEl.closest('.info-card');
    if (!card) return;
    var cards = Array.prototype.slice.call(corpo.querySelectorAll('.info-card'));
    var idx = cards.indexOf(card);
    if (idx === -1) return;
    var tab = document.getElementById('modalAba' + idx);
    if (tab && tab.getAttribute('aria-selected') !== 'true') tab.click();
  }

  /* ════════ 1. BOAS-VINDAS GERAL ════════ */
  function tourBoasVindas() {
    Coachmark.iniciar({
      id: 'sitp-boas-vindas-v3',
      passos: [
        {
          alvo: '#periodic-table',
          titulo: 'Clique em qualquer elemento',
          texto: 'Cada célula mostra a cor da categoria química — clique numa pra ver raio, eletronegatividade, diagramas e mais.'
        },
        {
          alvo: '.legend-grid-cats',
          titulo: 'Filtre por categoria',
          texto: 'Clique numa categoria (metal alcalino, halogênio...) pra apagar o resto da tabela e destacar só o que combina.'
        },
        {
          alvo: '.legend-grid-states',
          titulo: 'Ou filtre por estado físico',
          texto: 'O mesmo vale pro estado físico — sólido, líquido, gasoso ou desconhecido, à temperatura escolhida no controle.'
        },
        {
          alvo: '#legendPropsBotoes',
          titulo: 'Veja uma propriedade na tabela toda',
          texto: 'Escolha raio, eletronegatividade ou outra propriedade e a tabela inteira se colore em escala, do menor ao maior valor.'
        },
        {
          alvo: '.header-temp',
          titulo: 'Mude a temperatura',
          texto: 'Arraste o controle e veja o estado físico de cada elemento (sólido, líquido, gasoso) mudar em tempo real.'
        }
      ]
    });
  }
  if (!Coachmark.jaViu('sitp-boas-vindas-v3')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ 2. MODAL DO ELEMENTO (1ª vez que abre qualquer um) ════════
     Cobertura completa: da barra de navegação até a última seção da
     ficha (raio atômico com as 5 vistas + tela cheia) — não só um
     resumo de 2 passos, já que a ficha realmente tem tudo isso. */
  function tourModalElemento() {
    Coachmark.iniciar({
      id: 'sitp-modal-elemento-v3',
      passos: [
        {
          alvo: '#modalNavRow',
          titulo: 'Troque de elemento sem fechar',
          texto: 'As setas levam ao elemento anterior ou seguinte — sem precisar fechar e clicar de novo na tabela.'
        },
        {
          alvo: '#stateCard',
          titulo: 'Estado físico e partículas',
          texto: 'Prótons, nêutrons e elétrons desse elemento, e o estado físico dele a 25 °C — muda se você arrastar o controle de temperatura, na tabela.',
          ao_entrar: function () { selecionarAbaMobileParaAlvo('#stateCard'); }
        },
        {
          alvo: '.info-card:has(#modalConfig)',
          titulo: 'Distribuição eletrônica',
          texto: 'A configuração eletrônica completa, camada por camada, no modelo de Pauling.',
          ao_entrar: function () { selecionarAbaMobileParaAlvo('#modalConfig'); }
        },
        {
          alvo: '#modalPropriedades .info-card',
          titulo: 'Propriedades periódicas',
          texto: 'Eletronegatividade, energia de ionização e outras propriedades — cada uma com uma explicação rápida do que significa.',
          ao_entrar: function () { selecionarAbaMobileParaAlvo('#modalPropriedades .info-card'); }
        },
        {
          alvo: '.raio-view-toggle',
          titulo: 'Cinco jeitos de ver o raio atômico',
          texto: 'Dados numéricos, comparação em Grade com os vizinhos, diagrama de Bohr, estrutura de Lewis e nuvem eletrônica de probabilidade — toque em cada aba pra trocar.',
          ao_entrar: function () { selecionarAbaMobileParaAlvo('.raio-view-toggle'); }
        },
        {
          alvo: '.painel-fullscreen-btn',
          titulo: 'Tela cheia',
          texto: 'Qualquer uma dessas vistas pode abrir bem maior, ocupando a tela toda — útil pros diagramas mais detalhados.',
          ao_entrar: function () {
            selecionarAbaMobileParaAlvo('.raio-view-toggle');
            var btnBohr = document.querySelector('[id^="rbtn-bohr-"]');
            if (btnBohr && btnBohr.getAttribute('aria-pressed') !== 'true') btnBohr.click();
          }
        }
      ]
    });
  }

  /* O modal abre ao clicar numa célula ou navegar por teclado —
     não existe um único "botão de abrir" pra prender um listener,
     então observamos o overlay ganhar a classe "aberto" (mesma
     classe que abrir-fechar.js usa pra mostrar o modal). */
  var overlay = document.getElementById('modalOverlay');
  if (overlay) {
    var jaMostrouNestaSessao = false;
    new MutationObserver(function () {
      var aberto = overlay.classList.contains('aberto');
      if (aberto && !jaMostrouNestaSessao && !Coachmark.jaViu('sitp-modal-elemento-v3')) {
        jaMostrouNestaSessao = true;
        setTimeout(tourModalElemento, 450);
      }
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  }
});
