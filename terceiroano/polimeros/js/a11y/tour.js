/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING — tour.js (SIPL)
   ───────────────────────────────────────────────────────────────
   7 módulos, arquitetura dinâmica (padrão SIGAS/SISOL — #model-list
   é display:contents, gerado em tempo de execução; a barra mobile
   chama setMode() direto, não clica no botão real — detecção via
   aria-pressed). Tem modal antigo de resumo (mode-info-modal) — o
   tour espera ele fechar antes de começar.

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
      id: 'sipl-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Sete módulos de cinética química',
          texto: 'Teoria das Colisões, Superfície de Contato, Velocidade da Reação, Ordem de Reação, Energia de Ativação, Gráfico de Arrhenius e Mecanismo de Reação.'
        },
        {
          alvo: '#hdr-result',
          titulo: 'Resultados sempre visíveis',
          texto: 'Esse painel não muda de lugar — os valores calculados aparecem aqui não importa qual módulo esteja ativo.',
          ao_entrar: function () { abrirPainel('hdr-result'); }
        }
      ]
    });
  }
  if (!Coachmark.jaViu('sipl-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO ════════ */
  var MODULOS = {
    colisoes:   { passos: [{ hdr: 'hdr-col', titulo: 'Energia e orientação', texto: 'Ajuste energia e orientação das moléculas — só colisões com energia suficiente E orientação certa viram reação de verdade.' }] },
    superficie: { passos: [
      { hdr: 'hdr-sup-subst', titulo: 'Escolha a substância', texto: 'Cada substância sólida reage numa velocidade diferente.' },
      { hdr: 'hdr-sup-ctrl', titulo: 'Fragmente o sólido', texto: 'Pedaço inteiro, picado ou em pó — veja a velocidade da reação mudar: mais superfície exposta, mais colisões possíveis.' }
    ] },
    curva: { passos: [
      { hdr: 'hdr-cur-subst', titulo: 'Escolha a reação', texto: 'O gráfico [A] × tempo mostra o consumo do reagente.' },
      { hdr: 'hdr-cur-ctrl', titulo: 'Média × instantânea', texto: 'Compare a velocidade média (entre dois pontos) com a velocidade instantânea (a inclinação da curva num ponto só).' }
    ] },
    ordem:     { passos: [{ hdr: 'hdr-ord', titulo: 'Zero, 1ª ou 2ª ordem', texto: 'Veja como cada ordem muda o formato da curva de velocidade em função da concentração.' }] },
    energia:   { passos: [{ hdr: 'hdr-ene', titulo: 'A barreira de energia', texto: 'O diagrama mostra a barreira que precisa ser vencida (Ea) — adicione um catalisador e veja essa barreira baixar, sem mudar o ΔH.' }] },
    arrhenius: { passos: [{ hdr: 'hdr-arr', titulo: 'Descubra a Ea pelos dados', texto: 'A partir de pontos experimentais (ln k × 1/T), descubra a energia de ativação pela inclinação da reta — a mesma lógica que cientistas usam de verdade.' }] },
    mecanismo: { passos: [{ hdr: 'hdr-mec', titulo: 'A etapa mais lenta manda', texto: 'Uma reação pode acontecer em várias etapas — a etapa mais lenta (a "gargalo") é que dita a velocidade da reação inteira.' }] }
  };

  function tourModulo(modId) {
    var m = MODULOS[modId];
    if (!m) return;
    abrirPainel(m.passos[0].hdr);
    var passos = m.passos.map(function (p) {
      return {
        alvo: ehMobile() ? null : ('#body-' + p.hdr.replace('hdr-', '')),
        titulo: p.titulo,
        texto: p.texto,
        ao_entrar: ehMobile() ? undefined : function () { abrirPainel(p.hdr); }
      };
    });
    Coachmark.iniciar({ id: 'sipl-modulo-' + modId, passos: passos });
  }

  var jaObservados = new WeakSet();
  function observarBotaoModo(btn) {
    if (jaObservados.has(btn)) return;
    jaObservados.add(btn);
    var painel = btn.closest('.panel');
    var header = painel ? painel.querySelector('[id^="hdr-mode-"]') : null;
    if (!header) return;
    var modeId = header.id.replace('hdr-mode-', '');
    if (!MODULOS[modeId]) return;
    new MutationObserver(function () {
      if (btn.getAttribute('aria-pressed') !== 'true') return;
      var id = 'sipl-modulo-' + modeId;
      if (Coachmark.jaViu(id)) return;
      setTimeout(function () {
        depoisDoModalAntigoFechar(function () { tourModulo(modeId); });
      }, 300);
    }).observe(btn, { attributes: true, attributeFilter: ['aria-pressed'] });
  }
  var listaModos = document.getElementById('model-list');
  if (listaModos) {
    listaModos.querySelectorAll('.mode-activate-btn').forEach(observarBotaoModo);
    new MutationObserver(function () {
      listaModos.querySelectorAll('.mode-activate-btn').forEach(observarBotaoModo);
    }).observe(listaModos, { childList: true, subtree: true });
  }
});
