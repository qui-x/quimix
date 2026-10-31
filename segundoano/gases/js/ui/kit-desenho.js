/* ================================================================
   NÚCLEO COMPARTILHADO — kit-desenho.js
   ================================================================
   Extraído do bloco "KIT DE DESENHO", IDÊNTICO nos seis simuladores
   da família (soluções e gases têm, cada um, MAIS ALGUMAS funções
   próprias além destas — ex.: kDrops/kSnowflake/kSteam/kTap em
   Soluções — que continuam dentro do arquivo específico de cada
   simulador, não aqui).

   Helpers de desenho em <canvas> com a mesma linguagem visual da
   família inteira. Todas as cores vêm de cssVar() (canvas-escala.js)
   — nunca um valor de cor cru aqui dentro.

   FUNÇÕES
   · kRound        — retângulo de cantos arredondados (path).
   · kLabel        — texto com fonte/cor/alinhamento padronizados.
   · kChip         — "pílula" de texto (legenda flutuante).
   · kArrow        — seta simples entre dois pontos.
   · kAxes         — eixos cartesianos com marcações.
   · kLine         — linha/curva a partir de uma lista de pontos.
   · kBeaker       — desenho de um béquer/recipiente de vidraria.
   · kThermo       — termômetro com nível proporcional a uma fração.
   · kFlame        — chama (aquecimento) animada.
   · kParticles / kDrawParticles — nuvem de partículas (posição e
     desenho separados, pra reaproveitar o mesmo motor visual).
   · kBubbles / kDrawBubbles     — bolhas subindo (efervescência).
   · kFlowDots     — pontos fluindo ao longo de um caminho.
   · kMix          — mistura/interpolação de cores.
   · kInterp       — interpolação linear numa lista de pontos (x,y).

   ORDEM DE CARGA: depois de canvas-escala.js. Simuladores que têm
   funções kit próprias (ex.: mecanica-solucoes.js) as definem no seu
   próprio arquivo, carregado DEPOIS deste — podem usar cssVar() e
   as funções daqui livremente.
   ================================================================ */
'use strict';

SIGAS.kRound = function kRound(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
SIGAS.kLabel = function kLabel(ctx, text, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.bold ? '700 ' : ''}${o.size || 12}px ${o.mono ? "'Consolas','Monaco',monospace" : "'Segoe UI',system-ui,sans-serif"}`;
  ctx.fillStyle = o.color || SIGAS.cssVar('--text-secondary', '#7a9ab8');
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = o.baseline || 'middle';
  if (o.maxW) ctx.fillText(text, x, y, o.maxW);else ctx.fillText(text, x, y);
  ctx.restore();
};
/** Pílula de texto (legenda flutuante). */
SIGAS.kChip = function kChip(ctx, text, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.size || 11}px 'Segoe UI',system-ui,sans-serif`;
  const w = ctx.measureText(text).width + 14,
    h = (o.size || 11) + 10;
  SIGAS.kRound(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fillStyle = o.bg || 'rgba(0,0,0,.45)';
  ctx.fill();
  if (o.border) {
    ctx.strokeStyle = o.border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  SIGAS.kLabel(ctx, text, x, y + .5, {
    size: o.size || 11,
    color: o.fg || '#fff',
    bold: o.bold
  });
  ctx.restore();
};
SIGAS.kArrow = function kArrow(ctx, x1, y1, x2, y2, o = {}) {
  const head = o.head || 7,
    ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = o.color || SIGAS.cssVar('--text-secondary');
  ctx.lineWidth = o.w || 1.6;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - .45), y2 - head * Math.sin(ang - .45));
  ctx.lineTo(x2 - head * Math.cos(ang + .45), y2 - head * Math.sin(ang + .45));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};
/**
 * Eixos cartesianos com grade e ticks. Retorna {px, py, area} onde
 * px(v)/py(v) mapeiam valores de dados → pixels.
 */
SIGAS.kAxes = function kAxes(ctx, cfg) {
  const {
    x,
    y,
    w,
    h,
    xmin,
    xmax,
    ymin,
    ymax
  } = cfg;
  const px = v => x + (v - xmin) / (xmax - xmin) * w;
  const py = v => y + h - (v - ymin) / (ymax - ymin) * h;
  const grid = SIGAS.cssVar('--border', '#1c2e44'),
    txt = SIGAS.cssVar('--text-muted', '#3d566e');
  ctx.save();
  ctx.lineWidth = 1;
  (cfg.xticks || []).forEach(t => {
    ctx.strokeStyle = grid;
    ctx.globalAlpha = .5;
    ctx.beginPath();
    ctx.moveTo(px(t), y);
    ctx.lineTo(px(t), y + h);
    ctx.stroke();
    ctx.globalAlpha = 1;
    SIGAS.kLabel(ctx, cfg.fmtx ? cfg.fmtx(t) : SIGAS.fmt(t, 0), px(t), y + h + 11, {
      size: 10,
      color: txt,
      mono: true
    });
  });
  (cfg.yticks || []).forEach(t => {
    ctx.strokeStyle = grid;
    ctx.globalAlpha = .5;
    ctx.beginPath();
    ctx.moveTo(x, py(t));
    ctx.lineTo(x + w, py(t));
    ctx.stroke();
    ctx.globalAlpha = 1;
    SIGAS.kLabel(ctx, cfg.fmty ? cfg.fmty(t) : SIGAS.fmt(t, 0), x - 6, py(t), {
      size: 10,
      color: txt,
      align: 'right',
      mono: true
    });
  });
  ctx.strokeStyle = SIGAS.cssVar('--text-muted');
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  if (cfg.xlab) SIGAS.kLabel(ctx, cfg.xlab, x + w / 2, y + h + 26, {
    size: 11,
    color: SIGAS.cssVar('--text-secondary'),
    bold: true
  });
  if (cfg.ylab) {
    ctx.save();
    ctx.translate(x - 40, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    SIGAS.kLabel(ctx, cfg.ylab, 0, 0, {
      size: 11,
      color: SIGAS.cssVar('--text-secondary'),
      bold: true
    });
    ctx.restore();
  }
  ctx.restore();
  return {
    px,
    py
  };
};
/** Polilinha suave sobre eixos já mapeados. */
SIGAS.kLine = function kLine(ctx, pts, px, py, o = {}) {
  if (!pts.length) return;
  ctx.save();
  ctx.strokeStyle = o.color || SIGAS.cssVar('--accent-main');
  ctx.lineWidth = o.w || 2.2;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(px(p[0]), py(p[1])) : ctx.moveTo(px(p[0]), py(p[1])));
  ctx.stroke();
  ctx.restore();
};
/**
 * Béquer de vidro com líquido. level 0..1. Retorna o retângulo interno
 * do líquido (para posicionar partículas).
 */
SIGAS.kBeaker = function kBeaker(ctx, cx, topY, w, h, level, liquidColor, o = {}) {
  const x = cx - w / 2,
    glass = SIGAS.cssVar('--glass', 'rgba(148,163,184,.38)');
  const lh = Math.max(0, Math.min(1, level)) * (h - 10);
  const ly = topY + h - lh;
  if (lh > 1) {
    ctx.save();
    const g = ctx.createLinearGradient(0, ly, 0, topY + h);
    g.addColorStop(0, liquidColor);
    g.addColorStop(1, liquidColor);
    ctx.fillStyle = g;
    ctx.globalAlpha = o.alpha != null ? o.alpha : .85;
    SIGAS.kRound(ctx, x + 3, ly, w - 6, lh, 4);
    ctx.fill();
    // menisco
    ctx.globalAlpha = .5;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x + 4, ly + 1.5);
    ctx.lineTo(x + w - 4, ly + 1.5);
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.strokeStyle = glass;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x - 4, topY - 4);
  ctx.lineTo(x, topY);
  ctx.lineTo(x, topY + h - 6);
  ctx.quadraticCurveTo(x, topY + h, x + 6, topY + h);
  ctx.lineTo(x + w - 6, topY + h);
  ctx.quadraticCurveTo(x + w, topY + h, x + w, topY + h - 6);
  ctx.lineTo(x + w, topY);
  ctx.lineTo(x + w + 4, topY - 4);
  ctx.stroke();
  if (o.rotulo) SIGAS.kLabel(ctx, o.rotulo, cx, topY + h + 14, {
    size: 11,
    color: SIGAS.cssVar('--text-secondary')
  });
  ctx.restore();
  return {
    x: x + 4,
    y: ly,
    w: w - 8,
    h: lh,
    surfaceY: ly
  };
};
/** Termômetro vertical com escala. */
SIGAS.kThermo = function kThermo(ctx, x, topY, h, t, tmin, tmax, o = {}) {
  const frac = Math.max(0, Math.min(1, (t - tmin) / (tmax - tmin)));
  const bulbR = 8,
    tubeW = 7;
  const tubeTop = topY,
    tubeBot = topY + h - bulbR * 2;
  const merc = o.color || SIGAS.cssVar('--accent-exo', '#f87171');
  ctx.save();
  ctx.fillStyle = SIGAS.cssVar('--bg-void', '#080c14');
  ctx.strokeStyle = SIGAS.cssVar('--glass');
  ctx.lineWidth = 2;
  SIGAS.kRound(ctx, x - tubeW / 2, tubeTop, tubeW, h - bulbR, tubeW / 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, tubeBot + bulbR, bulbR, 0, Math.PI * 2);
  ctx.fillStyle = merc;
  ctx.fill();
  ctx.stroke();
  const mh = frac * (tubeBot - tubeTop - 4);
  ctx.fillStyle = merc;
  SIGAS.kRound(ctx, x - 2.2, tubeBot - mh, 4.4, mh + bulbR, 2.2);
  ctx.fill();
  for (let i = 0; i <= 4; i++) {
    const yy = tubeBot - i / 4 * (tubeBot - tubeTop - 4);
    ctx.strokeStyle = SIGAS.cssVar('--text-muted');
    ctx.beginPath();
    ctx.moveTo(x + tubeW / 2 + 2, yy);
    ctx.lineTo(x + tubeW / 2 + 6, yy);
    ctx.stroke();
    if (o.escala !== false) SIGAS.kLabel(ctx, SIGAS.fmt(tmin + i / 4 * (tmax - tmin), 0), x + tubeW / 2 + 9, yy, {
      size: 9,
      color: SIGAS.cssVar('--text-muted'),
      align: 'left',
      mono: true
    });
  }
  if (o.rotulo !== false) SIGAS.kChip(ctx, `${SIGAS.fmt(t, o.casas != null ? o.casas : 0)} °C`, x, tubeTop - 14, {
    bg: 'rgba(0,0,0,.45)',
    fg: merc,
    size: 11,
    bold: true
  });
  ctx.restore();
};
/** Chama de bico de Bunsen (t = relógio da animação). */
SIGAS.kFlame = function kFlame(ctx, x, y, s, time) {
  const flu = SIGAS.isReduced() ? 0 : Math.sin(time * 9) * s * .06;
  ctx.save();
  const g = ctx.createRadialGradient(x, y - s * .5, s * .1, x, y - s * .5, s);
  g.addColorStop(0, SIGAS.cssVar('--flame-b', '#fde047'));
  g.addColorStop(1, SIGAS.cssVar('--flame-a', '#f97316'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - s * .45, y);
  ctx.quadraticCurveTo(x - s * .5, y - s * .8, x + flu, y - s * 1.5);
  ctx.quadraticCurveTo(x + s * .5, y - s * .8, x + s * .45, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};
/** Mantém n partículas quicando dentro de box; vel escala com speed. */
SIGAS.kParticles = function kParticles(arr, n, box, speed, dt) {
  while (arr.length < n) arr.push({
    x: box.x + Math.random() * box.w,
    y: box.y + Math.random() * box.h,
    vx: Math.random() - .5,
    vy: Math.random() - .5
  });
  if (arr.length > n) arr.length = n;
  const v = SIGAS.isReduced() ? 0 : speed;
  arr.forEach(p => {
    p.x += p.vx * v * dt;
    p.y += p.vy * v * dt;
    if (p.x < box.x) {
      p.x = box.x;
      p.vx = Math.abs(p.vx);
    }
    if (p.x > box.x + box.w) {
      p.x = box.x + box.w;
      p.vx = -Math.abs(p.vx);
    }
    if (p.y < box.y) {
      p.y = box.y;
      p.vy = Math.abs(p.vy);
    }
    if (p.y > box.y + box.h) {
      p.y = box.y + box.h;
      p.vy = -Math.abs(p.vy);
    }
  });
};
SIGAS.kDrawParticles = function kDrawParticles(ctx, arr, r, color, alpha) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha != null ? alpha : .9;
  arr.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};
/** Bolhas de gás subindo a partir de srcY dentro de box. */
SIGAS.kBubbles = function kBubbles(arr, dt, box, rate, o = {}) {
  if (!SIGAS.isReduced() && Math.random() < rate * dt) {
    arr.push({
      x: (o.x != null ? o.x : box.x + Math.random() * box.w) + (Math.random() - .5) * (o.spread || 10),
      y: o.y != null ? o.y : box.y + box.h - 4,
      r: 1.5 + Math.random() * 2.5,
      v: 26 + Math.random() * 30
    });
  }
  for (let i = arr.length - 1; i >= 0; i--) {
    const b = arr[i];
    b.y -= b.v * dt;
    b.x += Math.sin(b.y * .12) * .25;
    if (b.y < (o.topo != null ? o.topo : box.y) + 3) arr.splice(i, 1);
  }
};
SIGAS.kDrawBubbles = function kDrawBubbles(ctx, arr, color) {
  ctx.save();
  ctx.strokeStyle = color || 'rgba(255,255,255,.65)';
  ctx.lineWidth = 1.1;
  arr.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
};
/** Elétrons (pontos) correndo ao longo de uma polilinha; t avança externamente. */
SIGAS.kFlowDots = function kFlowDots(ctx, pts, phase, n, color, o = {}) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0],
      dy = pts[i + 1][1] - pts[i][1];
    const L = Math.hypot(dx, dy);
    segs.push({
      p: pts[i],
      dx,
      dy,
      L
    });
    total += L;
  }
  ctx.save();
  ctx.fillStyle = color;
  for (let k = 0; k < n; k++) {
    let d = ((phase + k / n) % 1 + 1) % 1 * total;
    for (const s of segs) {
      if (d <= s.L) {
        const t = d / s.L;
        ctx.beginPath();
        ctx.arc(s.p[0] + s.dx * t, s.p[1] + s.dy * t, o.r || 2.6, 0, Math.PI * 2);
        ctx.fill();
        if (o.rotulo && k === 0) SIGAS.kLabel(ctx, 'e⁻', s.p[0] + s.dx * t, s.p[1] + s.dy * t - 9, {
          size: 9,
          color,
          mono: true
        });
        break;
      }
      d -= s.L;
    }
  }
  ctx.restore();
};
/** Interpola duas cores hex → 'rgb(r,g,b)'. */
SIGAS.kMix = function kMix(h1, h2, t) {
  const p = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const a = p(h1),
    b = p(h2);
  return `rgb(${Math.round(SIGAS.lerp(a[0], b[0], t))},${Math.round(SIGAS.lerp(a[1], b[1], t))},${Math.round(SIGAS.lerp(a[2], b[2], t))})`;
};
/** Interpolação linear em tabela de pontos [[x,y],...] ordenada por x. */
SIGAS.kInterp = function kInterp(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (x <= pts[i][0]) {
      const [x0, y0] = pts[i - 1],
        [x1, y1] = pts[i];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
  }
  return pts[pts.length - 1][1];
};