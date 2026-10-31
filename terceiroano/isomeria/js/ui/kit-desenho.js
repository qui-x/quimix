/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: js/ui/kit-desenho.js
   ───────────────────────────────────────────────────────────────
   Primitivas de desenho no canvas — caixa, rótulo, seta, eixo, átomo, ligação, béquer, partículas. Só desenha; não decide nada.

   Extraído de scriptcarbono.js na refatoração para a estrutura de
   pastas do SIMA. A divisão é literal: o escopo continua global e
   as tags <script> continuam compartilhando-o, então nenhuma
   referência mudou de nome. O que mudou é onde cada coisa mora.

   Ordem de carga (definida em index.html): a11y → core → data →
   ui → simulation → init. Quebrar essa ordem quebra o simulador.
═══════════════════════════════════════════════════════════════ */

'use strict';

function kRound(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Texto simples com alinhamento e tamanho controlados. */
function kLabel(ctx, text, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.bold ? '700 ' : ''}${o.size || 12}px ${o.mono ? "'Consolas','Monaco',monospace" : "'Segoe UI',system-ui,sans-serif"}`;
  ctx.fillStyle = o.color || cssVar('--text-secondary', '#7a9ab8');
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.baseline || 'alphabetic';
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Etiqueta arredondada (pílula) centrada em (x,y). */
function kChip(ctx, text, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.bold ? '700 ' : ''}${o.size || 11}px 'Segoe UI',system-ui,sans-serif`;
  const w = ctx.measureText(text).width + 14, h = (o.size || 11) + 10;
  ctx.fillStyle = o.bg || cssVar('--bg-panel2', '#101c2b');
  kRound(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = o.border || cssVar('--border', '#1c2e44');
  ctx.lineWidth = 1; ctx.stroke();
  ctx.restore();
  kLabel(ctx, text, x, y + .5, {
    size: o.size || 11, color: o.fg || cssVar('--text-primary', '#ddeaf8'),
    bold: o.bold, align: 'center', baseline: 'middle',
  });
}

/** Seta reta com ponta — usada em equações e fluxos. */
function kArrow(ctx, x1, y1, x2, y2, o = {}) {
  const head = o.head || 7, ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = o.color || cssVar('--text-secondary', '#7a9ab8');
  ctx.lineWidth = o.width || 1.6;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - .4), y2 - head * Math.sin(ang - .4));
  ctx.lineTo(x2 - head * Math.cos(ang + .4), y2 - head * Math.sin(ang + .4));
  ctx.closePath();
  ctx.fillStyle = o.color || cssVar('--text-secondary', '#7a9ab8');
  ctx.fill();
  ctx.restore();
}

/** Eixos com grade e rótulos. Devolve px(v) e py(v) para converter
 *  valores em pixels — todo gráfico do simulador usa isso. */
function kAxes(ctx, cfg) {
  const { x, y, w, h, xmin, xmax, ymin, ymax } = cfg;
  const px = v => x + (v - xmin) / (xmax - xmin) * w;
  const py = v => y + h - (v - ymin) / (ymax - ymin) * h;
  const grid = cssVar('--border', '#1c2e44'), txt = cssVar('--text-muted', '#3d566e');

  ctx.save();
  ctx.strokeStyle = grid; ctx.lineWidth = 1;
  (cfg.xticks || []).forEach(t => {
    ctx.globalAlpha = .35;
    ctx.beginPath(); ctx.moveTo(px(t.v), y); ctx.lineTo(px(t.v), y + h); ctx.stroke();
    ctx.globalAlpha = 1;
    if (t.l != null) kLabel(ctx, String(t.l), px(t.v), y + h + 14, { size: 10, color: txt, align: 'center', mono: true });
  });
  (cfg.yticks || []).forEach(t => {
    ctx.globalAlpha = .35;
    ctx.beginPath(); ctx.moveTo(x, py(t.v)); ctx.lineTo(x + w, py(t.v)); ctx.stroke();
    ctx.globalAlpha = 1;
    if (t.l != null) kLabel(ctx, String(t.l), x - 6, py(t.v) + 3, { size: 10, color: txt, align: 'right', mono: true });
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = cssVar('--text-muted', '#3d566e'); ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.restore();

  if (cfg.xlabel) kLabel(ctx, cfg.xlabel, x + w, y + h + 30, { size: 11, align: 'right' });
  if (cfg.ylabel) {
    ctx.save(); ctx.translate(x - 34, y);
    ctx.rotate(-Math.PI / 2);
    kLabel(ctx, cfg.ylabel, 0, 0, { size: 11, align: 'right' });
    ctx.restore();
  }
  return { px, py };
}

/** Liga uma sequência de pontos {x,y} em valores de dados. */
function kLine(ctx, pts, px, py, o = {}) {
  if (!pts.length) return;
  ctx.save();
  ctx.strokeStyle = o.color || cssVar('--accent-main', '#4ade80');
  ctx.lineWidth = o.width || 2;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  pts.forEach((p, i) => { const X = px(p.x), Y = py(p.y); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();
  ctx.restore();
}

/** Átomo: bolinha com símbolo no centro — base dos desenhos orgânicos. */
function kAtom(ctx, x, y, r, simbolo, o = {}) {
  const cor = o.color || cssVar('--scene-b', '#94a3b8');
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = cor; ctx.fill();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = cssVar('--bg-void', '#080c14'); ctx.stroke();
  ctx.restore();
  if (simbolo) kLabel(ctx, simbolo, x, y + .5, {
    size: o.size || Math.max(9, r), bold: true, align: 'center', baseline: 'middle',
    color: o.fg || getContrastColor(cor.startsWith('#') ? cor : '#94a3b8'),
  });
}

/** Ligação entre dois pontos: ordem 1, 2 ou 3 (traços paralelos). */
function kBond(ctx, x1, y1, x2, y2, ordem = 1, o = {}) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;           // vetor perpendicular
  const gap = o.gap || 3.2;
  const desloc = ordem === 1 ? [0] : ordem === 2 ? [-gap, gap] : [-gap * 1.6, 0, gap * 1.6];
  ctx.save();
  ctx.strokeStyle = o.color || cssVar('--scene-a', '#94a3b8');
  ctx.lineWidth = o.width || 2;
  ctx.lineCap = 'round';
  desloc.forEach(d => {
    ctx.beginPath();
    ctx.moveTo(x1 + nx * d, y1 + ny * d);
    ctx.lineTo(x2 + nx * d, y2 + ny * d);
    ctx.stroke();
  });
  ctx.restore();
}

/** Béquer com líquido — usado nos módulos com solução aquosa. */
function kBeaker(ctx, cx, topY, w, h, level, liquidColor, o = {}) {
  const x = cx - w / 2, glass = cssVar('--glass', 'rgba(148,163,184,.38)');
  const lh = Math.max(0, Math.min(1, level)) * (h - 10);
  const ly = topY + h - lh;
  ctx.save();
  ctx.fillStyle = liquidColor;
  ctx.globalAlpha = o.alpha != null ? o.alpha : .8;
  ctx.beginPath(); ctx.rect(x + 3, ly, w - 6, lh); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = glass; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, topY); ctx.lineTo(x, topY + h); ctx.lineTo(x + w, topY + h); ctx.lineTo(x + w, topY);
  ctx.stroke();
  ctx.restore();
}

/** Partículas simples com colisão nas bordas de uma caixa. */
function kParticles(arr, n, box, speed, dt) {
  while (arr.length < n) {
    arr.push({
      x: box.x + Math.random() * box.w, y: box.y + Math.random() * box.h,
      vx: (Math.random() - .5), vy: (Math.random() - .5),
    });
  }
  while (arr.length > n) arr.pop();
  const v = isReduced() ? 0 : speed;
  arr.forEach(p => {
    p.x += p.vx * v * dt * 60; p.y += p.vy * v * dt * 60;
    if (p.x < box.x) { p.x = box.x; p.vx *= -1; }
    if (p.x > box.x + box.w) { p.x = box.x + box.w; p.vx *= -1; }
    if (p.y < box.y) { p.y = box.y; p.vy *= -1; }
    if (p.y > box.y + box.h) { p.y = box.y + box.h; p.vy *= -1; }
  });
}

function kDrawParticles(ctx, arr, r, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.fillStyle = color;
  arr.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); });
  ctx.restore();
}

/** Bolhas subindo (gás liberado). */
function kBubbles(arr, dt, box, rate, o = {}) {
  if (!isReduced() && Math.random() < rate * dt * 60) {
    arr.push({ x: box.x + Math.random() * box.w, y: box.y + box.h, r: 1.5 + Math.random() * 2.5, v: 20 + Math.random() * 30 });
  }
  arr.forEach(b => { b.y -= b.v * dt; });
  for (let i = arr.length - 1; i >= 0; i--) if (arr[i].y < box.y) arr.splice(i, 1);
  if (arr.length > (o.max || 120)) arr.splice(0, arr.length - (o.max || 120));
}

function kDrawBubbles(ctx, arr, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.globalAlpha = .7;
  arr.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); });
  ctx.restore();
}

/** Mistura duas cores hexadecimais (t = 0 → h1, t = 1 → h2). */
function kMix(h1, h2, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const a = p(h1), b = p(h2);
  const c = a.map((v, i) => Math.round(lerp(v, b[i], clamp(t, 0, 1))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// ══════════════════════════════════════════════════════════════════
// MECÂNICA — SIQC · Química do Carbono
// Modos: hibridização · classificação de cadeias · classes de carbono
// ══════════════════════════════════════════════════════════════════
