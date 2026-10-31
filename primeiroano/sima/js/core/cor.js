/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (utilitário compartilhado)
   ARQUIVO: cor.js
   ───────────────────────────────────────────────────────────────
   Cor de cada categoria química (lida do CSS, com fallback) e
   cálculo de contraste (WCAG) para escolher texto claro ou escuro
   sobre um fundo colorido. Usado tanto pelos modelos físicos
   (Dalton pinta os átomos) quanto pela interface (botões da tabela
   periódica) — por isso vive no núcleo, não em ui/ nem em models/.
   Depende de: nada (lê variáveis CSS em runtime).
   Usado por: models/dalton.js, app/tabela-periodica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ══════════════════════════════════════════════════════════════════
/**
 * Cor de uma categoria química no canvas. Lê a variável CSS
 * --cat-<categoria> do stylesima.css — a MESMA fonte usada pela
 * legenda e pela Tabela Periódica — para que canvas e legenda nunca
 * voltem a divergir. O fallback espelha os valores de :root, para o
 * caso de a variável não existir no tema ativo.
 */
function catColor(cat) {
  const FALLBACK = {
    alkali:'#ef4444', alkaline:'#fb923c', transition:'#60a5fa',
    metal:'#94a3b8', metalloid:'#2dd4bf', nonmetal:'#4ade80',
    noble:'#7dd3fc', lanthanide:'#fbbf24', actinide:'#34d399',
  };
  const css = (typeof document !== 'undefined' && document.body)
    ? getComputedStyle(document.body).getPropertyValue(`--cat-${cat}`).trim()
    : '';
  return css || FALLBACK[cat] || '#475569';
}

/**
 * Calcula a cor de texto (preto ou branco) com melhor contraste sobre
 * um fundo hexadecimal — réplica exata da função usada no SILQ, baseada
 * na fórmula de luminância perceptual (YIQ).
 */
function getContrastColor(hex) {
  const c = hex.replace('#','');
  const r=parseInt(c.substr(0,2),16), g=parseInt(c.substr(2,2),16), b=parseInt(c.substr(4,2),16);
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

