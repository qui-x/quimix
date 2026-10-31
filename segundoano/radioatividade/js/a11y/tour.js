/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING — tour.js (SIRAD)
   ───────────────────────────────────────────────────────────────
   6 módulos, arquitetura dinâmica: Emissões Radioativas, Meia-vida,
   Fissão em Cadeia, Equações Nucleares, Datação Radioativa, Série
   Radioativa.

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
      id: 'sirad-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Seis módulos de radioatividade',
          texto: 'Emissões Radioativas, Meia-vida, Fissão em Cadeia, Equações Nucleares, Datação Radioativa e Série Radioativa.'
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
  if (!Coachmark.jaViu('sirad-boas-vindas')) {
    setTimeout(tourBoasVindas, 700);
  }

  /* ════════ TOURS POR MÓDULO ════════ */
  var MODULOS = {
    emissoes: { hdr: 'hdr-emis', texto: 'Alfa, beta e gama atravessam campos elétricos e materiais de jeitos diferentes — veja o desvio e a penetração de cada tipo de emissão.' },
    meiavida: { hdr: 'hdr-meia', texto: 'A cada meia-vida, metade dos átomos radioativos decai — acompanhe a curva de decaimento exponencial e o tempo que cada isótopo leva.' },
    cadeia:   { hdr: 'hdr-cadeia', texto: 'Um nêutron atinge um núcleo de U-235 e libera mais nêutrons — controle as barras pra manter a fissão em cadeia sob controle, sem explodir.' },
    soddy:    { hdr: 'hdr-soddy', texto: 'Balanceie número atômico (Z) e número de massa (A) nas equações nucleares — as Leis de Soddy garantem que os dois se conservam.' },
    datacao:  { hdr: 'hdr-datacao', texto: 'Meça a proporção de carbono-14 restante numa amostra pra descobrir sua idade — é a mesma técnica usada em fósseis e artefatos históricos.' },
    serie:    { hdr: 'hdr-serie', texto: 'Do urânio-238 até o chumbo-206 estável — acompanhe a cadeia inteira de decaimentos sucessivos, um isótopo virando outro.' }
  };

  function tourModulo(modId) {
    var m = MODULOS[modId];
    if (!m) return;
    abrirPainel(m.hdr);
    Coachmark.iniciar({
      id: 'sirad-modulo-' + modId,
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
      var id = 'sirad-modulo-' + modeId;
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
