/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/formatacao.js
   ───────────────────────────────────────────────────────────────
   Formatação de número, clamp/lerp, leitura de variável CSS e contraste WCAG. Nada aqui sabe de química nem de canvas.

   Extraído de scriptambiental.js na refatoração para a estrutura de
   pastas do SIMA. A divisão é literal: o escopo continua global e
   as tags <script> continuam compartilhando-o, então nenhuma
   referência mudou de nome. O que mudou é onde cada coisa mora.

   Ordem de carga (definida em index.html): a11y → core → data →
   ui → simulation → init. Quebrar essa ordem quebra o simulador.
═══════════════════════════════════════════════════════════════ */

'use strict';

function fmt(v, casas = 1) {
  const s = Number(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 0, maximumFractionDigits: casas,
  });
  return s.replace('-', '−');
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp  = (a, b, t) => a + (b - a) * t;
const isReduced = () => document.body.classList.contains('reduce-motion');

/** Lê uma variável de cor do CSS (fonte única de cores do simulador). */
function cssVar(name, fallback = '#94a3b8') {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
}

/** Contraste preto/branco por luminância YIQ. */
function getContrastColor(hex) {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#111827';
  const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
  /* Escolhe entre texto escuro e claro pelo CONTRASTE REAL (WCAG 2.1).
     Antes: (r*299 + g*587 + b*114)/1000 >= 145 ? escuro : claro
     O limiar 145 do YIQ nao corresponde ao contraste percebido. Medido no
     Chromium, escolhia BRANCO para cores de meio-tom e o resultado ficava
     abaixo do minimo — ex.: teal #14b8a6 + branco = 2.49:1, quando com
     texto escuro daria 7.13:1.
     Agora calcula as duas razoes e devolve a melhor. Nao garante 4.5:1
     para toda cor (algumas nao alcancam com preto nem com branco), mas
     eleva todos os casos e nunca piora nenhum. */
  var _canal = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  var _lum = function (c) { return 0.2126 * _canal(c[0]) + 0.7152 * _canal(c[1]) + 0.0722 * _canal(c[2]); };
  var _razao = function (a, b) { var L1 = _lum(a), L2 = _lum(b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05); };
  return _razao([r, g, b], [17, 24, 39]) >= _razao([r, g, b], [255, 255, 255]) ? '#111827' : '#ffffff';
}

// ══════════════════════════════════════════════════════════════════
// KIT DE DESENHO — helpers de canvas compartilhados pela família de
// simuladores. Todas as cores vêm de cssVar() → variáveis do CSS.
// ══════════════════════════════════════════════════════════════════
