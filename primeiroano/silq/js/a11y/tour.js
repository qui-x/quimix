/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) específicos do SILQ. Dois níveis:

   1. Boas-vindas geral — dispara uma vez, na primeira visita, com
      a orientação básica: os 3 tipos de ligação → tabela periódica
      → canvas.
   2. Por MÓDULO — cada um dos 3 tipos de ligação (metálica, iônica,
      covalente) tem seu próprio tour curto, disparado na primeira
      vez que aquele modo específico é ativado, explicando só o que
      é exclusivo dali.

   BUG CORRIGIDO: os alvos e os "ao_entrar" abaixo assumiam a
   interface de DESKTOP — no mobile, #sidebar-left fica display:none
   (a barra #mode-tabs-mobile assume esse lugar) e #sidebar-right só
   aparece depois de tocar em #mobile-menu-btn-right (vira bottom
   sheet). O balão aparecia, mas o "menu" que ele descrevia nunca
   existiu na tela — resultado: instrução sem nada pra olhar.
   Corrigido detectando a largura da tela e montando um roteiro
   diferente pra cada caso, em vez de um único roteiro fixo.

   Depende de: coachmark.js (motor genérico, referenciado da raiz).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;

  var LARGURA_MOBILE = 900; // mesmo ponto de corte do CSS (ver stylesilq.css)
  function ehMobile() { return window.innerWidth <= LARGURA_MOBILE; }

  /* ── expande um painel-acordeão colapsado (clica no header se
     ainda não estiver aberto). Funciona tanto dentro da sidebar
     esquerda quanto da direita — os dois usam o mesmo padrão de
     aria-expanded. ── */
  function abrirPainel(headerId) {
    var header = document.getElementById(headerId);
    if (header && header.getAttribute('aria-expanded') !== 'true') header.click();
  }

  /* ── no mobile, a sidebar direita (tabela periódica, moléculas,
     controles) só aparece depois de tocar no botão de engrenagem —
     ela é um bottom sheet, não fica sempre visível como no desktop. ── */
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

  /* ════════ 1. BOAS-VINDAS GERAL (uma vez, ao entrar no SILQ) ════════ */
  function tourBoasVindas() {
    var passos = ehMobile() ? [
      {
        alvo: '#mode-tabs-mobile',
        titulo: 'Escolha o tipo de ligação',
        texto: 'Aqui estão os 3 tipos — metálica, iônica e covalente. Toque numa aba pra ver os detalhes e ativar o modo.'
      },
      {
        alvo: '#hdr-periodic',
        titulo: 'Escolha os elementos',
        texto: 'Toque no ícone de engrenagem, no canto superior, pra abrir a Tabela Periódica e escolher os elementos.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-periodic'); },
        ao_sair: fecharGavetaDireitaMobile
      },
      {
        alvo: '#main-content',
        titulo: 'Veja a ligação se formar',
        texto: 'O canvas mostra a ligação acontecendo na hora — cores, elétrons, tudo interativo.'
      }
    ] : [
      {
        alvo: '#left-accordion',
        titulo: 'Escolha o tipo de ligação',
        texto: 'Aqui estão os 3 tipos — metálica, iônica e covalente. Toque num card pra ver os detalhes e ativar o modo.'
      },
      {
        alvo: '#hdr-periodic',
        titulo: 'Escolha os elementos',
        texto: 'Com um modo ativo, abra a Tabela Periódica aqui e clique nos elementos pra adicioná-los ao canvas.',
        ao_entrar: function () { abrirPainel('hdr-periodic'); }
      },
      {
        alvo: '#main-content',
        titulo: 'Veja a ligação se formar',
        texto: 'O canvas mostra a ligação acontecendo na hora — cores, elétrons, tudo interativo.'
      }
    ];
    Coachmark.iniciar({ id: 'silq-boas-vindas-v2', passos: passos });
  }
  if (!Coachmark.jaViu('silq-boas-vindas-v2')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO (Metálica/Iônica/Covalente) ════════
     No desktop apontam pro conteúdo de dentro do card ativo (sidebar
     esquerda). No mobile essa sidebar não existe — o card equivalente
     só aparece por 1 instante no modal de 1ª ativação (que o próprio
     app já mostra sozinho) — então ali o balão vira "flutuante"
     (sem alvo), com o mesmo texto, em vez de apontar pra algo que
     não vai estar na tela. */
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

  function criarTourModulo(id, btnId, headerId, passosDesktop, passosMobile) {
    function rodar() {
      abrirPainel(headerId);
      Coachmark.iniciar({ id: id, passos: ehMobile() ? passosMobile : passosDesktop });
    }
    var btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', function () {
        if (!Coachmark.jaViu(id)) setTimeout(function () { depoisDoModalAntigoFechar(rodar); }, 400);
      });
    }
  }

  criarTourModulo(
    'silq-modo-metalica-v2', 'btn-mode-met', 'hdr-mode-metalica',
    [
      { alvo: '#body-mode-metalica .bond-ionic-pairs', titulo: 'Adicione metais iguais',
        texto: 'Clique em 2 metais iguais na tabela (ex.: Fe + Fe) — esses aqui são bons exemplos pra começar.' },
      { alvo: '#body-mode-metalica .bond-info-grid', titulo: 'Propriedades da ligação',
        texto: 'Energia, condutividade, maleabilidade — tudo isso muda de acordo com o tipo de ligação escolhido.' }
    ],
    [
      { alvo: null, titulo: 'Adicione metais iguais',
        texto: 'Abra a Tabela Periódica (ícone de engrenagem) e clique em 2 metais iguais — ex.: Fe + Fe.' },
      { alvo: null, titulo: 'Propriedades da ligação',
        texto: 'Energia, condutividade, maleabilidade — tudo isso muda de acordo com o tipo de ligação. Toque na aba "Ligação Metálica" pra rever esses detalhes quando quiser.' }
    ]
  );

  criarTourModulo(
    'silq-modo-ionica-v2', 'btn-mode-ion', 'hdr-mode-ionica',
    [
      { alvo: '#body-mode-ionica .bond-ionic-pairs', titulo: 'Escolha metal + ametal',
        texto: 'Clique num metal e depois num ametal (ex.: Na + Cl) — precisa ser um de cada, não dois iguais.' },
      { alvo: '#body-mode-ionica .bond-interactions', titulo: 'A carga aparece sozinha',
        texto: 'Assim que a transferência acontece, o simulador mostra Na⁺ e Cl⁻ automaticamente sobre os átomos.' }
    ],
    [
      { alvo: null, titulo: 'Escolha metal + ametal',
        texto: 'Abra a Tabela Periódica e clique num metal e depois num ametal (ex.: Na + Cl) — precisa ser um de cada.' },
      { alvo: null, titulo: 'A carga aparece sozinha',
        texto: 'Assim que a transferência acontece, o simulador mostra Na⁺ e Cl⁻ automaticamente sobre os átomos no canvas.' }
    ]
  );

  criarTourModulo(
    'silq-modo-covalente-v2', 'btn-mode-cov', 'hdr-mode-covalente',
    [
      { alvo: '#body-mode-covalente .bond-ionic-pairs', titulo: 'Escolha os átomos',
        texto: 'Clique em 2 átomos (ex.: H + O) pra formar a ligação — pode sair simples, dupla ou tripla.' },
      { alvo: '#hdr-controls', titulo: 'Ajuste a ligação aqui',
        texto: 'Ordem da ligação (σ/π), edição individual e direção da cunha ficam neste painel, não no de Ligação Covalente.',
        ao_entrar: function () { abrirPainel('hdr-controls'); } }
    ],
    [
      { alvo: null, titulo: 'Escolha os átomos',
        texto: 'Abra a Tabela Periódica e clique em 2 átomos (ex.: H + O) — pode sair simples, dupla ou tripla.' },
      { alvo: '#hdr-controls', titulo: 'Ajuste a ligação aqui',
        texto: 'Ordem da ligação (σ/π), edição individual e direção da cunha ficam no painel Controles — toque na engrenagem pra abrir.',
        ao_entrar: function () { abrirGavetaDireitaMobile(); abrirPainel('hdr-controls'); },
        ao_sair: fecharGavetaDireitaMobile }
    ]
  );
});
