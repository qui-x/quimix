/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING — tour.js (SIEQ)
   ───────────────────────────────────────────────────────────────
   9 módulos, arquitetura dinâmica (padrão SIGAS/SISOL/SICQ):
   Atingindo o Equilíbrio, Le Chatelier, Q×K, Escala de pH, Ácidos e
   Bases, Titulação, Kps, Tampão, Hidrólise Salina. Um painel único
   por módulo (padrão SISOL) + Resultados sempre visível.

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
      id: 'sieq-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Nove módulos de equilíbrio',
          texto: 'Atingindo o Equilíbrio, Le Chatelier, Q×K, Escala de pH, Ácidos e Bases, Titulação, Kps, Tampão e Hidrólise Salina.'
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
  if (!Coachmark.jaViu('sieq-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO ════════ */
  var MODULOS = {
    atingir:     { hdr: 'hdr-atg', texto: 'Acompanhe H₂ + I₂ ⇌ 2 HI reagindo — as concentrações mudam até as velocidades direta e inversa se igualarem: aí o equilíbrio foi atingido.' },
    lechatelier: { hdr: 'hdr-lch', texto: 'Perturbe o equilíbrio N₂O₄ ⇌ 2 NO₂ — mude concentração, temperatura ou pressão, e veja o sistema se deslocar pra compensar.' },
    qk:          { hdr: 'hdr-qk', texto: 'Compare o quociente Q com a constante K — se Q < K a reação vai pra frente, se Q > K vai pra trás, se Q = K já está em equilíbrio.' },
    escala:      { hdr: 'hdr-esc', texto: 'Substâncias do dia a dia, do mais ácido ao mais básico — arraste a escala e veja onde cada uma se encaixa.' },
    calculo:     { hdr: 'hdr-calc', texto: 'Ácidos e bases fortes se dissociam completamente; fracos, não — Ka e Kb medem o quanto cada um se ioniza.' },
    titulacao:   { hdr: 'hdr-tit', texto: 'Adicione NaOH gota a gota numa solução de HCl — acompanhe o pH subir na curva de titulação até o ponto de equivalência.' },
    kps:         { hdr: 'hdr-kps', texto: 'O produto de solubilidade decide se um sal precipita ou fica dissolvido — compare a concentração dos íons com o Kps da substância.' },
    tampao:      { hdr: 'hdr-tampao', texto: 'Um par ácido fraco + sua base conjugada resiste a mudanças de pH — é por isso que o pH do sangue não varia, mesmo recebendo ácidos ou bases.' },
    hidrolise:   { hdr: 'hdr-hid', texto: 'Nem todo sal dá solução neutra — dependendo do ácido e da base que o formaram, a hidrólise deixa o pH ácido ou básico.' }
  };

  function tourModulo(modId) {
    var m = MODULOS[modId];
    if (!m) return;
    abrirPainel(m.hdr);
    Coachmark.iniciar({
      id: 'sieq-modulo-' + modId,
      passos: [{
        alvo: ehMobile() ? null : ('#body-' + m.hdr.replace('hdr-', '')),
        titulo: 'Como este módulo funciona',
        texto: m.texto,
        ao_entrar: ehMobile() ? undefined : function () { abrirPainel(m.hdr); }
      }]
    });
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
      var id = 'sieq-modulo-' + modeId;
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
