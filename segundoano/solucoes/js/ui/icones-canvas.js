/* ================================================================
   CAMADA: UI — icones-canvas.js
   ================================================================
   Ícones desenhados DIRETO no canvas (não são SVG — SVG não entra
   dentro de um <canvas>). Usados só nos poucos lugares onde a
   simulação desenha um veredito (certo/errado, travado/destravado,
   alerta) ao lado de um texto, substituindo o emoji que ficava
   embutido na própria string.

   kIconText(ctx, desenhaIcone, texto, x, y, o) — desenha o ícone e o
   texto juntos como um bloco só, respeitando o alinhamento
   (center/left/right) do mesmo jeito que kLabel já fazia sozinho.
   ================================================================ */
'use strict';

SISOL.kIconText = function kIconText(ctx, desenhaIcone, texto, x, y, o = {}) {
  ctx.save();
  const size = o.size || 12;
  ctx.font = `${o.bold ? '700 ' : ''}${size}px ${o.mono ? "'Consolas','Monaco',monospace" : "'Segoe UI',system-ui,sans-serif"}`;
  const textW = ctx.measureText(texto).width;
  const iconSize = o.iconSize || size + 2;
  const gap = o.gap != null ? o.gap : 5;
  const totalW = iconSize + gap + textW;
  const align = o.align || 'center';
  let startX;
  if (align === 'center') startX = x - totalW / 2;else if (align === 'right') startX = x - totalW;else startX = x;
  desenhaIcone(ctx, startX + iconSize / 2, y, iconSize, o.iconColor);
  ctx.fillStyle = o.color || SISOL.cssVar('--text-secondary', '#7a9ab8');
  ctx.textAlign = 'left';
  ctx.textBaseline = o.baseline || 'middle';
  ctx.fillText(texto, startX + iconSize + gap, y);
  ctx.restore();
};
/** Certo — check simples, duas linhas. */
SISOL.kIconCheck = function kIconCheck(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color || '#4ade80';
  ctx.lineWidth = Math.max(1.4, size * 0.13);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size / 24;
  ctx.beginPath();
  ctx.moveTo(cx - 7 * s, cy + 0.5 * s);
  ctx.lineTo(cx - 2 * s, cy + 5 * s);
  ctx.lineTo(cx + 8 * s, cy - 6 * s);
  ctx.stroke();
  ctx.restore();
};
/** Errado — X simples, duas linhas cruzadas. */
SISOL.kIconX = function kIconX(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color || '#f87171';
  ctx.lineWidth = Math.max(1.4, size * 0.13);
  ctx.lineCap = 'round';
  const s = size / 24 * 6.5;
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s);
  ctx.lineTo(cx + s, cy + s);
  ctx.moveTo(cx + s, cy - s);
  ctx.lineTo(cx - s, cy + s);
  ctx.stroke();
  ctx.restore();
};
/** Travado — corpo retangular + arco fechado por cima. */
SISOL.kIconLock = function kIconLock(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color || '#e0b04d';
  ctx.lineWidth = Math.max(1.3, size * 0.1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size / 24;
  SISOL.kRound(ctx, cx - 6.5 * s, cy - 1 * s, 13 * s, 10 * s, 2 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - 3.5 * s, 4.5 * s, Math.PI, 0, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + 3.5 * s, 1 * s, 0, Math.PI * 2);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
  ctx.restore();
};
/** Destravado — corpo retangular + arco aberto (deslocado). */
SISOL.kIconUnlock = function kIconUnlock(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color || '#4ade80';
  ctx.lineWidth = Math.max(1.3, size * 0.1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size / 24;
  SISOL.kRound(ctx, cx - 6.5 * s, cy - 1 * s, 13 * s, 10 * s, 2 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx - 2 * s, cy - 5 * s, 4.5 * s, Math.PI, 1.65 * Math.PI, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + 3.5 * s, 1 * s, 0, Math.PI * 2);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
  ctx.restore();
};
/** Alerta — triângulo + ponto de exclamação. */
SISOL.kIconWarning = function kIconWarning(ctx, cx, cy, size, color) {
  ctx.save();
  ctx.strokeStyle = color || '#f5a524';
  ctx.lineWidth = Math.max(1.4, size * 0.11);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const s = size / 24;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8 * s);
  ctx.lineTo(cx + 8 * s, cy + 7 * s);
  ctx.lineTo(cx - 8 * s, cy + 7 * s);
  ctx.closePath();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 2.5 * s);
  ctx.lineTo(cx, cy + 1.5 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + 4.3 * s, 0.9 * s, 0, Math.PI * 2);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
  ctx.restore();
};
/** Pílula com ícone + texto (mesmo visual de kChip, com um ícone de
 *  veredito no lugar do emoji que ficava embutido no texto). */
SISOL.kChipIcon = function kChipIcon(ctx, desenhaIcone, texto, x, y, o = {}) {
  ctx.save();
  const size = o.size || 11;
  ctx.font = `${size}px 'Segoe UI',system-ui,sans-serif`;
  const iconSize = o.iconSize || size + 2;
  const gap = 5;
  const w = ctx.measureText(texto).width + iconSize + gap + 16,
    h = size + 10;
  SISOL.kRound(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = o.bg || 'rgba(0,0,0,.45)';
  ctx.fill();
  if (o.border) {
    ctx.strokeStyle = o.border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  SISOL.kIconText(ctx, desenhaIcone, texto, x, y + .5, {
    size,
    iconSize,
    gap,
    color: o.fg || '#fff',
    bold: o.bold,
    align: 'center'
  });
  ctx.restore();
};