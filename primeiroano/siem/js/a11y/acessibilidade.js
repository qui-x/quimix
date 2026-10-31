/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE + TEMA DO CANVAS
   ARQUIVO: acessibilidade.js
   ───────────────────────────────────────────────────────────────
   Duas responsabilidades que vivem juntas por dependerem uma da
   outra:
   1) Receptor de acessibilidade (tema, contraste, daltonismo,
      leitura simples, redução de movimento, espaçamento e escala
      de fonte) vindo da URL ou por postMessage da Central de
      Simuladores — igual ao SIMA e ao SIME (JS).
   2) window.SIEM_THEME — como a simulação, o diagrama de fases e a
      visão 3D são desenhados em <canvas> (não recebem tema via CSS
      automaticamente), este módulo lê as MESMAS variáveis CSS que o
      resto da interface usa e as guarda em window.SIEM_THEME. O
      resto do código lê esse objeto a cada frame ao desenhar, então
      basta chamar refreshSiemTheme() quando o tema muda — sem
      precisar redesenhar nada manualmente.
   Depende de: nada (roda assim que a página carrega).
   Usado por: js/simulation/simulation-render.js,
              js/phase-diagram/phase-diagram-render.js,
              js/view3d/view3d.js (leem window.SIEM_THEME a cada frame).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* =====================================================================
   SIEM — RECEPTOR DE ACESSIBILIDADE (mesclado aqui de accessibilitysiem.js
   — arquivo extra removido, já que a acessibilidade geral é controlada
   pela Central via URL/postMessage; não há motivo pra manter isso num
   arquivo .js separado).
   ---------------------------------------------------------------------
   Este arquivo NÃO cria botões nem controles. O SIEM não tem barra de
   acessibilidade própria: quem controla é a Central de Simuladores (menu),
   exatamente como no SIMA e no SITP.

   O menu envia o estado de acessibilidade de duas formas:
     (1) parâmetros na URL, no momento em que abre o simulador:
         ?theme=dark|light
         &reading=on|off
         &colorblind=none|protanopia|deuteranopia|tritanopia|acromatopsia
         &contrast=true|false
         &fontscale=0.75–1.5
         &spacing=true|false
         &motion=true|false
     (2) postMessage em tempo real (caso o simulador seja embutido em iframe):
         { source:'central-simuladores', type:'a11y-update', payload:{...} }

   Aqui apenas traduzimos esse estado para os atributos data-* em <html>,
   a variável --font-scale e o #colorblindOverlay (daltonismo via
   backdrop-filter, nunca filter direto no wrapper/body).
   ===================================================================== */
(function () {
  const root = document.documentElement;
  const MIN_SCALE = 0.75, MAX_SCALE = 2.0;

  const CVD_CYCLE = ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'acromatopsia'];

  /* -------------------------------------------------------------------
     CACHE DE CORES PARA O CANVAS (window.SIEM_THEME)
     -----------------------------------------------------------------
     A simulação, o diagrama de fases e a visão 3D são desenhados em
     <canvas>, então não recebem tema/contraste automaticamente via CSS
     — cada fillStyle/strokeStyle é só uma string fixa no JS. Em vez de
     cravar cores no scriptsiem.js/view3dsiem.js, lemos aqui as MESMAS
     variáveis CSS que o resto da interface usa (--bg1, --tx1, --solid-col
     etc.) e guardamos em window.SIEM_THEME. scriptsiem.js e
     view3dsiem.js leem esse objeto a cada frame ao desenhar, então
     basta atualizá-lo quando o tema muda — sem precisar redesenhar nada
     manualmente, o próximo frame do loop de animação já usa as cores
     certas. */
  window.SIEM_THEME = {};
  function refreshSiemTheme() {
    const cs = getComputedStyle(root);
    const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
    const T = window.SIEM_THEME;
    T.bg0 = v('--bg0', '#04080f');
    T.bg1 = v('--bg1', '#070e18');
    T.bg2 = v('--bg2', '#0a1524');
    T.bdr  = v('--bdr', '#182d45');
    T.bdr2 = v('--bdr2', '#1e3a55');
    T.tx1 = v('--tx1', '#cce0f5');
    T.tx2 = v('--tx2', '#6899b8');
    T.tx3 = v('--tx3', '#2d4f6a');
    T.cyan  = v('--cyan', '#00c8ff');
    T.red    = v('--red', '#ff5252');
    T.violet = v('--violet', '#a78bfa');
    T.solid  = v('--solid-col', '#60a5fa');
    T.liquid = v('--liquid-col', '#00e696');
    T.gas    = v('--gas-col', '#ffb020');
  }
  refreshSiemTheme();
  window.SIEM_refreshTheme = refreshSiemTheme;

  function applyFontScale(scale) {
    const fs = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    root.style.setProperty('--font-scale', fs);
    // a escala de fonte agora vive no <body> (o #app-wrapper foi removido)
    document.body.style.fontSize = (fs * 100) + '%';
  }

  function applyColorblindOverlay(type) {
    const overlay = document.getElementById('colorblindOverlay');
    if (!overlay) return;
    const val = (!type || type === 'none') ? 'none' : `url(#f-${type})`;
    overlay.style.backdropFilter = val;
    overlay.style.webkitBackdropFilter = val;
  }

  function applyThemePayload(payload) {
    if (!payload) return;
    if (payload.theme) root.setAttribute('data-theme', payload.theme);
    if (typeof payload.contrast !== 'undefined')
      root.setAttribute('data-contrast', payload.contrast ? 'high' : '');
    if (payload.reading)
      root.setAttribute('data-reading', payload.reading === 'on' ? 'on' : '');
    if (typeof payload.motion !== 'undefined')
      root.setAttribute('data-motion', payload.motion ? 'true' : '');
    if (typeof payload.spacing !== 'undefined')
      root.setAttribute('data-spacing', payload.spacing ? 'true' : '');
    if (typeof payload.colorblind !== 'undefined' && payload.colorblind !== null && CVD_CYCLE.includes(payload.colorblind)) {
      applyColorblindOverlay(payload.colorblind);
    }
    if (payload.fontScale) applyFontScale(payload.fontScale);
    refreshSiemTheme();
  }

  // URL params from central hub
  (function applyFromUrl() {
    const p = new URLSearchParams(window.location.search);
    if (![...p.keys()].length) return;
    applyThemePayload({
      theme: p.get('theme'),
      contrast: p.get('contrast') === 'true',
      reading: p.get('reading'),
      motion: p.get('motion') === 'true',
      spacing: p.get('spacing') === 'true',
      colorblind: p.get('colorblind'),
      fontScale: parseFloat(p.get('fontscale')) || 1.0
    });
  })();

  // postMessage em tempo real (quando embutido em iframe pelo menu)
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.source !== 'central-simuladores') return;
    if (e.data.type === 'a11y-update') applyThemePayload(e.data.payload);
  });
})();

