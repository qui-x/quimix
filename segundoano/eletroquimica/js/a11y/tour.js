/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING — tour.js (SIEL)
   ───────────────────────────────────────────────────────────────
   6 módulos, arquitetura dinâmica (padrão SIGAS/SISOL/SICQ/SIEQ):
   Montar a Pilha, Espontaneidade, Tabela de Potenciais, Eletrólise
   Ígnea, Eletrólise Aquosa, Leis de Faraday.

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
      id: 'siel-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Seis módulos de eletroquímica',
          texto: 'Montar a Pilha, Espontaneidade, Tabela de Potenciais, Eletrólise Ígnea, Eletrólise Aquosa e Leis de Faraday.'
        },
        {
          alvo: '#hdr-result',
          titulo: 'Resultados sempre visíveis',
          texto: 'Esse painel não muda de lugar — os valores calculados (ΔE°, massa depositada...) aparecem aqui não importa qual módulo esteja ativo.',
          ao_entrar: function () { abrirPainel('hdr-result'); }
        }
      ]
    });
  }
  if (!Coachmark.jaViu('siel-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO ════════ */
  var MODULOS = {
    montar: { passos: [{ hdr: 'hdr-mon', titulo: 'Duas meias-células', texto: 'Escolha os dois metais — o eletrodo de maior potencial vira o cátodo (redução), o de menor vira o ânodo (oxidação). A ponte salina fecha o circuito.' }] },
    espontaneidade: { passos: [{ hdr: 'hdr-esp', titulo: 'Vai reagir ou não?', texto: 'Mergulhe uma fita metálica numa solução — se o ΔE° for positivo, a reação de deslocamento acontece sozinha.' }] },
    tabela: { passos: [{ hdr: 'hdr-tab', titulo: 'Régua de reatividade', texto: 'Consulte os potenciais-padrão de redução — quanto maior o E°, maior a tendência de ganhar elétrons (reduzir).' }] },
    ignea: { passos: [
      { hdr: 'hdr-ign', titulo: 'Sal fundido', texto: 'Sem água, só o sal fundido conduz corrente — os próprios íons do sal migram e descarregam nos eletrodos.' },
      { hdr: 'hdr-ign-ctrl', titulo: 'Ligue a corrente', texto: 'Ajuste a corrente e veja os íons se movendo até o cátodo e o ânodo.' }
    ] },
    aquosa: { passos: [
      { hdr: 'hdr-aq', titulo: 'Filas de descarga', texto: 'Em solução aquosa, a água compete com os íons do sal — existe uma ordem de prioridade pra saber quem descarrega primeiro em cada eletrodo.' },
      { hdr: 'hdr-aq-ctrl', titulo: 'Escolha o sal', texto: 'Troque o sal dissolvido e veja a fila de descarga (e o produto formado) mudar.' }
    ] },
    faraday: { passos: [{ hdr: 'hdr-far', titulo: 'Galvanoplastia', texto: 'm = M·I·t / (n·F) — calcule quanto metal se deposita num objeto banhado, a partir da corrente e do tempo de eletrólise.' }] }
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
    Coachmark.iniciar({ id: 'siel-modulo-' + modId, passos: passos });
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
      var id = 'siel-modulo-' + modeId;
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
