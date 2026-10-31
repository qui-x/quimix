/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE
   ARQUIVO: preferencias.js
   ORIGEM:  REAPROVEITADO do SILQ (preferencias.js), praticamente sem
            alteração — é uma IIFE independente, sem NENHUMA referência
            ao namespace SIFI (nem ao SILQ original), então o mesmo
            arquivo funciona em qualquer simulador da Central sem
            precisar adaptar nada de específico. A única mudança real
            foi o nome do hook opcional no fim de `applyTheme`
            (`__silqRefreshThemedColors` → `__sifiRefreshThemedColors`).
   ───────────────────────────────────────────────────────────────
   Receptor de preferências de acessibilidade (tema, contraste,
   daltonismo, leitura simples, espaçamento, redução de movimento,
   escala de fonte) vindas da URL ou por postMessage da Central de
   Simuladores. Este é o único arquivo do SIFI que roda FORA do
   namespace SIFI — de propósito: precisa aplicar as preferências o
   quanto antes, sem esperar nenhum outro script carregar.
   Depende de: nada (roda assim que a página carrega).
   Usado por: nenhum outro arquivo depende deste — ele só ESCUTA
              `window.A11Y` (definido por `../a11y.js`, carregado
              ANTES de tudo no `<head>`) e aplica o resultado direto
              no `document.body`/`document.documentElement`.
═══════════════════════════════════════════════════════════════ */

'use strict';

(function () {
  const FONT_MIN = 0.8, FONT_MAX = 1.5;

  function clampFont(v) {
    return Math.round(Math.max(FONT_MIN, Math.min(FONT_MAX, v)) * 100) / 100;
  }

  function savePref(key, val) {
    try { localStorage.setItem('a11y_' + key, val); } catch (e) {}
  }
  function loadPref(key, fallback) {
    try { return localStorage.getItem('a11y_' + key) ?? fallback; } catch (e) { return fallback; }
  }

  // Quando o painel LOCAL muda algo, propaga para o a11y.js: assim a
  // escolha feita aqui vale nas outras paginas tambem, em vez de ficar
  // presa neste simulador. O guard `_sifiSincronizando` evita laco
  // infinito (definir -> aplica -> definir -> ...).
  let _sifiSincronizando = false;
  function sincronizarA11Y(chave, valor) {
    if (_sifiSincronizando) return;
    if (!(window.A11Y && typeof window.A11Y.definir === 'function')) return;
    _sifiSincronizando = true;
    try { window.A11Y.definir(chave, valor); } finally { _sifiSincronizando = false; }
  }

  function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.body.classList.toggle('light-mode', t === 'light');
    savePref('theme', t);
    sincronizarA11Y('theme', t);
    // Hook opcional pra recolorir elementos que não seguem variável CSS
    // sozinhos (nenhum por enquanto no SIFI, mas o gancho fica pronto
    // pro dia que precisar, mesma ideia do SILQ).
    if (typeof window.__sifiRefreshThemedColors === 'function') window.__sifiRefreshThemedColors();
  }

  function applyContrast(active) {
    document.body.classList.toggle('high-contrast', !!active);
    savePref('highContrast', active ? 'true' : 'false');
    sincronizarA11Y('contrast', !!active);
  }

  function applyFontScale(scale) {
    const fs = clampFont(scale);
    document.documentElement.style.setProperty('--font-scale', fs);
    savePref('fontScale', fs);
    sincronizarA11Y('fontScale', fs);
  }

  function applySimpleReading(on) {
    document.body.classList.toggle('simple-read', !!on);
    savePref('simpleReading', on ? 'true' : 'false');
    sincronizarA11Y('reading', on ? 'on' : 'off');
  }

  function normalizarDaltonico(cb) {
    if (!cb || cb === 'none') return '';
    if (['protanopia', 'deuteranopia', 'tritanopia', 'acromatopsia'].includes(cb)) return cb;
    return '';
  }

  function applyCvd(tipoNormalizado) {
    const overlay = document.getElementById('colorblindOverlay');
    if (!overlay) return;
    const val = tipoNormalizado ? `url(#f-${tipoNormalizado})` : 'none';
    overlay.style.backdropFilter = val;
    overlay.style.webkitBackdropFilter = val;
    savePref('cvd', tipoNormalizado || 'none');
    sincronizarA11Y('colorblind', tipoNormalizado || 'none');
  }

  function aplicarPayload(payload) {
    if (!payload) return;
    if (payload.theme) applyTheme(payload.theme);
    if (typeof payload.contrast !== 'undefined') applyContrast(payload.contrast);
    if (typeof payload.fontScale === 'number' && !Number.isNaN(payload.fontScale)) applyFontScale(payload.fontScale);
    if (payload.reading) applySimpleReading(payload.reading === 'on');
    if (typeof payload.colorblind !== 'undefined' && payload.colorblind !== null) {
      applyCvd(normalizarDaltonico(payload.colorblind));
    }
  }

  function lerPayloadDaUrl() {
    const p = new URLSearchParams(window.location.search);
    if (![...p.keys()].length) return null;
    return {
      theme: p.get('theme'),
      reading: p.get('reading'),
      colorblind: p.get('colorblind'),
      contrast: p.get('contrast') === 'true',
      fontScale: p.has('fontscale') ? parseFloat(p.get('fontscale')) : undefined
    };
  }

  function restaurarPrefsLocais() {
    applyTheme(loadPref('theme', 'dark'));
    applyContrast(loadPref('highContrast', 'false') === 'true');
    applyFontScale(parseFloat(loadPref('fontScale', '1')));
    applySimpleReading(loadPref('simpleReading', 'false') === 'true');
    const cvd = loadPref('cvd', 'none');
    if (cvd && cvd !== 'none') applyCvd(cvd);
  }

  /* ============================================================
     QUEM MANDA É O a11y.js
     ------------------------------------------------------------
     MESMO BUG que o SILQ já tinha corrigido, evitado aqui desde o
     início: ler a URL e, se ela vier limpa — o caso do botão
     "voltar", do F5 e do favorito —, cair no localStorage PRÓPRIO
     deste simulador (chaves "a11y_*"), cujo padrão é tema ESCURO,
     sobrescreveria o que o a11y.js tinha acabado de aplicar
     corretamente a partir da memória global ("central_a11y_prefs").

     Seriam DOIS sistemas de preferência disputando o mesmo <body>,
     com armazenamentos separados que podem discordar.

     Por isso: o a11y.js é a fonte da verdade. Se ele estiver presente
     (e ele é o PRIMEIRO script de toda a página — ver `<head>` de
     index-sifi.html), o estado dele manda — inclusive porque já
     resolveu a prioridade URL > memória > padrão. O caminho da URL/
     localStorage só serve de reserva pro caso de o a11y.js não ter
     carregado (ex.: SIFI aberto isolado, fora da Central). Era
     JUSTAMENTE a ausência deste arquivo que fazia o SIFI ignorar as
     preferências da Central mesmo com `../a11y.js` carregado certo:
     o script central escrevia o estado em `window.A11Y`, mas nada no
     SIFI lia esse estado e aplicava no `<body>` — as classes CSS
     (`.high-contrast`, `.light-mode`, `.simple-read`) e o filtro de
     daltonismo (`#colorblindOverlay`) simplesmente nunca eram tocados.
     ============================================================ */
  if (window.A11Y && window.A11Y.estado) {
    const e = window.A11Y.estado;
    aplicarPayload({
      theme: e.theme,
      reading: e.reading,
      colorblind: e.colorblind,
      contrast: e.contrast,
      fontScale: e.fontScale
    });
  } else {
    const payloadUrl = lerPayloadDaUrl();
    if (payloadUrl) aplicarPayload(payloadUrl);
    else restaurarPrefsLocais();
  }

  window.addEventListener('message', (e) => {
    if (!e.data || e.data.source !== 'central-simuladores' || e.data.type !== 'a11y-update') return;
    aplicarPayload(e.data.payload || {});
  });
})();
