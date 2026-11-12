'use strict';

function desenharNuvemOrbital(ctx, it, claro, rgba) {
  ctx.save();
  ctx.translate(it.x, it.y); ctx.rotate(it.ang); ctx.scale(it.A, it.B);
  var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1), base = claro ? 0.92 : 0.82;
  g.addColorStop(0, rgba(it.cor, base * it.alfa));
  g.addColorStop(0.55, rgba(it.cor, base * 0.5 * it.alfa));
  g.addColorStop(1, rgba(it.cor, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
