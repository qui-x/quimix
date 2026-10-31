/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: tour.js
   ───────────────────────────────────────────────────────────────
   Tours guiados (coachmark) do SIGAS. Cinco módulos bem distintos —
   cada um cobrindo uma lei dos gases diferente — cada um ganha o
   próprio tour, como no SIFI:

   1. Boas-vindas geral — os 5 módulos → o canvas (que muda de forma
      completa conforme o módulo) → o indicador de modo ativo.
   2. Transformações Gasosas — tipo de transformação (isotérmica/
      isobárica/isocórica) → grandezas → ações.
   3. Equação de Clapeyron — escolha do gás → grandezas (n,T,V) →
      ações.
   4. Difusão de Graham — gases da corrida → temperatura → duplas
      clássicas → ações.
   5. Teoria Cinética — gás → grandezas → exibição → ações.
   6. Mistura de Gases — gases da mistura → mols/T/V → misturas
      prontas → resultados.

   Os cards de módulo (#model-list) são gerados em tempo de
   execução por app.js a partir de SIM_DATA.MODES — por isso os
   gatilhos usam delegação de evento em vez de um addEventListener
   direto por botão (os botões ainda não existem quando este script
   carrega).

   Depende de: coachmark.js (motor genérico, referenciado da raiz).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;

  var LARGURA_MOBILE = 1100; // mesmo ponto de corte do CSS (ver stylegases.css)
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
  /* espera o modal de resumo (mode-info-modal, só no mobile) fechar
     antes de iniciar o tour — são dois avisos de "1ª vez"
     diferentes, não devem se sobrepor. */
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
      id: 'sigas-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Cinco leis dos gases, cinco módulos',
          texto: 'Transformações Gasosas, Equação de Clapeyron, Difusão de Graham, Teoria Cinética e Mistura de Gases — cada um com seu próprio experimento.'
        },
        {
          alvo: '#sim-canvas',
          titulo: 'O canvas muda com o módulo',
          texto: 'Pistão, tubo de difusão, motor de partículas ou câmara de mistura — o desenho aqui troca completamente conforme o módulo ativo, com uma pílula no canto mostrando qual está ligado.'
        }
      ]
    });
  }
  if (!Coachmark.jaViu('sigas-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO ════════ */
  var TOURS_MODULO = {
    transform: function () {
      abrirPainel('hdr-transf-tipo');
      var passos = ehMobile() ? [
        { alvo: null, titulo: 'Escolha o tipo de transformação', texto: 'Isotérmica (Boyle), isobárica (Charles) ou isocórica (Gay-Lussac) — cada uma prende uma grandeza diferente.' },
        { alvo: null, titulo: 'Ajuste n e T', texto: 'Quantidade de matéria e temperatura — o volume ou a pressão (conforme o tipo escolhido) reage no pistão.' },
        { alvo: null, titulo: 'Reinicie quando quiser', texto: 'O botão Reiniciar volta o pistão pro estado inicial, sem precisar recarregar a página.' }
      ] : [
        { alvo: '#body-transf-tipo', titulo: 'Escolha o tipo de transformação', texto: 'Isotérmica (Boyle), isobárica (Charles) ou isocórica (Gay-Lussac) — cada uma prende uma grandeza diferente.' },
        { alvo: '#body-transf-param', titulo: 'Ajuste n e T', texto: 'Quantidade de matéria e temperatura — o volume ou a pressão (conforme o tipo escolhido) reage no pistão.', ao_entrar: function () { abrirPainel('hdr-transf-param'); } },
        { alvo: '#body-transf-acoes', titulo: 'Reinicie quando quiser', texto: 'O botão Reiniciar volta o pistão pro estado inicial, sem precisar recarregar a página.', ao_entrar: function () { abrirPainel('hdr-transf-acoes'); } }
      ];
      Coachmark.iniciar({ id: 'sigas-modulo-transform', passos: passos });
    },
    clapeyron: function () {
      abrirPainel('hdr-clape-gas');
      var passos = ehMobile() ? [
        { alvo: null, titulo: 'Escolha o gás', texto: 'A biblioteca aqui tem gases reais — cada um com sua massa molar, usada na equação PV = nRT.' },
        { alvo: null, titulo: 'Ajuste n, T e V', texto: 'Mude qualquer grandeza e veja a pressão se recalcular na hora, respeitando a equação do gás ideal.' }
      ] : [
        { alvo: '#body-clape-gas', titulo: 'Escolha o gás', texto: 'A biblioteca aqui tem gases reais — cada um com sua massa molar, usada na equação PV = nRT.' },
        { alvo: '#body-clape-param', titulo: 'Ajuste n, T e V', texto: 'Mude qualquer grandeza e veja a pressão se recalcular na hora, respeitando a equação do gás ideal.', ao_entrar: function () { abrirPainel('hdr-clape-param'); } }
      ];
      Coachmark.iniciar({ id: 'sigas-modulo-clapeyron', passos: passos });
    },
    graham: function () {
      abrirPainel('hdr-graham-gases');
      var passos = ehMobile() ? [
        { alvo: null, titulo: 'Escolha os gases da corrida', texto: 'Dois gases correm lado a lado no tubo de difusão — o mais leve sempre chega na frente.' },
        { alvo: null, titulo: 'Duplas clássicas', texto: 'Atalhos pra pares famosos (H₂ vs. O₂, por exemplo) — carregam os dois gases de uma vez.' }
      ] : [
        { alvo: '#body-graham-gases', titulo: 'Escolha os gases da corrida', texto: 'Dois gases correm lado a lado no tubo de difusão — o mais leve sempre chega na frente.' },
        { alvo: '#body-graham-pares', titulo: 'Duplas clássicas', texto: 'Atalhos pra pares famosos (H₂ vs. O₂, por exemplo) — carregam os dois gases de uma vez.', ao_entrar: function () { abrirPainel('hdr-graham-pares'); } }
      ];
      Coachmark.iniciar({ id: 'sigas-modulo-graham', passos: passos });
    },
    cinetica: function () {
      abrirPainel('hdr-kin-gas');
      var passos = ehMobile() ? [
        { alvo: null, titulo: 'Escolha o gás', texto: 'Cada gás tem uma massa molar diferente, o que muda a velocidade média das partículas na mesma temperatura.' },
        { alvo: null, titulo: 'O motor de partículas', texto: 'Centenas de partículas se movendo e colidindo — a temperatura controla a energia cinética média delas.' }
      ] : [
        { alvo: '#body-kin-gas', titulo: 'Escolha o gás', texto: 'Cada gás tem uma massa molar diferente, o que muda a velocidade média das partículas na mesma temperatura.' },
        { alvo: '#body-kin-exibicao', titulo: 'O motor de partículas', texto: 'Centenas de partículas se movendo e colidindo — a temperatura controla a energia cinética média delas.', ao_entrar: function () { abrirPainel('hdr-kin-exibicao'); } }
      ];
      Coachmark.iniciar({ id: 'sigas-modulo-cinetica', passos: passos });
    },
    mistura: function () {
      abrirPainel('hdr-mix-gases');
      var passos = ehMobile() ? [
        { alvo: null, titulo: 'Escolha os gases da mistura', texto: 'Adicione 2 ou mais gases — cada um contribui com sua própria pressão parcial (Lei de Dalton).' },
        { alvo: null, titulo: 'Misturas prontas', texto: 'Atalhos pra misturas conhecidas, como o ar atmosférico, já com as proporções certas.' },
        { alvo: null, titulo: 'Resultados', texto: 'Pressão total, frações molares e pressões parciais de cada gás, calculados na hora.' }
      ] : [
        { alvo: '#body-mix-gases', titulo: 'Escolha os gases da mistura', texto: 'Adicione 2 ou mais gases — cada um contribui com sua própria pressão parcial (Lei de Dalton).' },
        { alvo: '#body-mix-param', titulo: 'Misturas prontas', texto: 'Atalhos pra misturas conhecidas, como o ar atmosférico, já com as proporções certas.', ao_entrar: function () { abrirPainel('hdr-mix-param'); } },
        { alvo: '#body-result', titulo: 'Resultados', texto: 'Pressão total, frações molares e pressões parciais de cada gás, calculados na hora.', ao_entrar: function () { abrirPainel('hdr-result'); } }
      ];
      Coachmark.iniciar({ id: 'sigas-modulo-mistura', passos: passos });
    }
  };

  /* Detecção de ativação: diferente do padrão de outros simuladores,
     aqui a aba mobile chama setMode() diretamente (não clica no botão
     real) — um addEventListener no clique do botão não pegaria a
     ativação feita pela barra mobile. Observando aria-pressed
     diretamente funciona não importa o caminho (botão desktop OU
     aba mobile), porque os dois levam a setMode() atualizando o
     mesmo atributo. */
  var jaObservados = new WeakSet();
  function observarBotaoModo(btn) {
    if (jaObservados.has(btn)) return;
    jaObservados.add(btn);
    var painel = btn.closest('.panel');
    var header = painel ? painel.querySelector('[id^="hdr-mode-"]') : null;
    if (!header) return;
    var modeId = header.id.replace('hdr-mode-', '');
    var tourFn = TOURS_MODULO[modeId];
    if (!tourFn) return;
    new MutationObserver(function () {
      if (btn.getAttribute('aria-pressed') !== 'true') return;
      var id = 'sigas-modulo-' + modeId;
      if (Coachmark.jaViu(id)) return;
      // pequena espera: o modal antigo de resumo (se for aparecer)
      // também reage à mesma ativação — dá tempo dele abrir antes de
      // checar se precisa esperar por ele.
      setTimeout(function () { depoisDoModalAntigoFechar(tourFn); }, 300);
    }).observe(btn, { attributes: true, attributeFilter: ['aria-pressed'] });
  }
  var listaModos = document.getElementById('model-list');
  if (listaModos) {
    listaModos.querySelectorAll('.mode-activate-btn').forEach(observarBotaoModo);
    // os cards são montados em tempo de execução — observa também
    // a lista em si, pra pegar botões que ainda não existiam.
    new MutationObserver(function () {
      listaModos.querySelectorAll('.mode-activate-btn').forEach(observarBotaoModo);
    }).observe(listaModos, { childList: true, subtree: true });
  }
});
