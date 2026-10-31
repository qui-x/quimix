/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE
   ARQUIVO: preferencias.js
   ───────────────────────────────────────────────────────────────
   Receptor de preferências de acessibilidade (tema, contraste,
   daltonismo, leitura simples, espaçamento, redução de movimento,
   escala de fonte) vindas da URL ou por postMessage da Central de
   Simuladores. Este é o único arquivo do SILQ que roda FORA do
   namespace SILQ (é a mesma IIFE independente do arquivo original,
   sem nenhuma referência às ~150 variáveis compartilhadas).
   Depende de: nada (roda assim que a página carrega).
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
  // presa neste simulador. O guard `_silqSincronizando` evita laco
  // infinito (definir -> aplica -> definir -> ...).
  let _silqSincronizando = false;
  function sincronizarA11Y(chave, valor) {
    if (_silqSincronizando) return;
    if (!(window.A11Y && typeof window.A11Y.definir === 'function')) return;
    _silqSincronizando = true;
    try { window.A11Y.definir(chave, valor); } finally { _silqSincronizando = false; }
  }

  function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.body.classList.toggle('light-mode', t === 'light');
    savePref('theme', t);
    sincronizarA11Y('theme', t);
    // buildPeriodicTable/buildLegend/canvasAtoms vivem num escopo
    // diferente deste (dentro do DOMContentLoaded mais abaixo no
    // arquivo); expõem esse hook em window pra podermos chamar daqui.
    if (typeof window.__silqRefreshThemedColors === 'function') window.__silqRefreshThemedColors();
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
     QUEM MANDA E O a11y.js
     ------------------------------------------------------------
     BUG CORRIGIDO: este bloco lia a URL e, se ela viesse limpa —
     o caso do botao "voltar", do F5 e do favorito — caia no
     localStorage PROPRIO deste simulador (chaves "a11y_*"), cujo
     padrao e tema ESCURO. Isso sobrescrevia o que o a11y.js tinha
     acabado de aplicar corretamente a partir da memoria global
     (chave "central_a11y_prefs").

     Eram DOIS sistemas de preferencia disputando o mesmo <body>,
     com armazenamentos separados que podiam discordar.

     AGORA: o a11y.js e a fonte da verdade. Se ele estiver presente
     (e ele e o primeiro script de toda pagina), o estado dele
     manda — inclusive porque ja resolveu a prioridade URL >
     memoria > padrao. O caminho antigo fica so como reserva para
     o caso de o a11y.js nao ter carregado.
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

  /* ─────────────────────────────────────────────────────────────────
     BUG CORRIGIDO: o bloco acima ("QUEM MANDA É O a11y.js") só lê
     window.A11Y.estado UMA VEZ, no carregamento — nunca de novo depois
     disso. Resultado: se o a11y.js mudar o tema/contraste/daltonismo
     DEPOIS da página já ter carregado (ex.: voltar pelo botão do
     navegador restaura do cache — bfcache — e o a11y.js reaplica o
     estado salvo sem os scripts rodarem de novo), data-theme no <html>
     muda, mas applyTheme()/refreshThemedColors() daqui nunca são
     chamados de novo: a tabela periódica inteira, a legenda e os
     átomos já no canvas ficavam com a cor do tema ANTERIOR.
     Corrigido observando os atributos direto no <html>, em vez de
     confiar só na leitura única do início — funciona não importa quem
     mudou o estado (a11y.js, postMessage, ou o próprio código local),
     e sincronizarA11Y() já tem guarda contra laço (_silqSincronizando),
     então não há risco de eco infinito. ───────────────────────────── */
  if (window.A11Y && window.A11Y.estado) {
    // Guarda contra eco infinito: setAttribute() gera um registro de
    // mutação mesmo reatribuindo o MESMO valor (o MutationObserver não
    // checa "mudou de verdade" sozinho) — sincronizarA11Y() chama
    // window.A11Y.definir() de novo dentro de applyTheme(), que
    // reescreve o mesmo data-theme, que dispara o observer nesta
    // mesma função, num laço sem fim. Só repinta se algum valor
    // realmente for diferente do que já foi processado da última vez.
    let ultimoProcessado = JSON.stringify(window.A11Y.estado);
    new MutationObserver(() => {
      const e = window.A11Y.estado;
      const atual = JSON.stringify(e);
      if (atual === ultimoProcessado) return;
      ultimoProcessado = atual;
      aplicarPayload({
        theme: e.theme,
        reading: e.reading,
        colorblind: e.colorblind,
        contrast: e.contrast,
        fontScale: e.fontScale
      });
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-contrast', 'data-colorblind']
    });
  }
})();

