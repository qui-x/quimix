/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE
   ARQUIVO: acessibilidade.js
   ───────────────────────────────────────────────────────────────
   Receptor de preferências de acessibilidade (tema, contraste,
   daltonismo, leitura simples, escala de fonte) vindas da URL ou
   por postMessage da Central de Simuladores — e announce(), usada
   por todo o app para avisos ao leitor de tela (aria-live).
   Depende de: nada (roda assim que a página carrega).
   Usado por: app/tabela-periodica.js, app/easter-eggs.js e outros
              pontos da interface que chamam announce().
═══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════════
// RECEPTOR DE ACESSIBILIDADE — Central de Simuladores
// ══════════════════════════════════════════════════════════════════
(function () {
  const root = document.documentElement;
  const CVD_CYCLE = ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'acromatopsia'];

  function applyFontScale(scale) {
    const fs = Math.min(1.5, Math.max(0.75, scale));
    root.style.setProperty('--font-scale', fs);
  }

  function applyPayload(payload) {
    if (!payload) return;
    if (payload.theme) document.body.classList.toggle('light-mode', payload.theme === 'light');
    if (typeof payload.contrast !== 'undefined') document.body.classList.toggle('high-contrast', !!payload.contrast);
    if (typeof payload.colorblind !== 'undefined' && payload.colorblind !== null && CVD_CYCLE.includes(payload.colorblind)) {
      // Técnica do hub: aplicar o filtro SVG via backdrop-filter num
      // overlay fixo (pointer-events:none), nunca diretamente no body/html.
      // Isso evita que `filter` no body quebre elementos position:fixed do
      // simulador (canvas, painéis, tooltips) — mesmo contrato do hub.
      applyColorblindOverlay(payload.colorblind);
    }
    if (payload.reading) document.body.classList.toggle('simple-read', payload.reading === 'on');
    if (payload.fontScale) applyFontScale(payload.fontScale);
  }

  function applyColorblindOverlay(type) {
    const overlay = document.getElementById('colorblindOverlay');
    if (!overlay) return;
    const value = (!type || type === 'none') ? 'none' : `url(#f-${type})`;
    overlay.style.backdropFilter = value;
    overlay.style.webkitBackdropFilter = value;
  }

  (function applyFromUrl() {
    const p = new URLSearchParams(window.location.search);
    if (![...p.keys()].length) return;
    applyPayload({
      theme: p.get('theme'),
      contrast: p.get('contrast') === 'true',
      colorblind: p.get('colorblind'),
      reading: p.get('reading'),
      fontScale: parseFloat(p.get('fontscale')) || 1.0,
    });
  })();

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.source !== 'central-simuladores' || e.data.type !== 'a11y-update') return;
    applyPayload(e.data.payload);
  });
})();

function announce(msg, priority='polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

