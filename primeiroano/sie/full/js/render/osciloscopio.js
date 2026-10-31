/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO (módulo Estequiometria)
   ARQUIVO: osciloscopio.js
   ───────────────────────────────────────────────────────────────
   Desenha o osciloscópio de energia exibido após validar a reação
   (a "cena congelada"), com interpolação de cor suave entre os
   pontos da curva.
   Depende de: core/estado-reacao.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   13. OSCILOSCÓPIO DE ENERGIA (assinatura visual)
   --------------------------------------------------------------- */
function desenharOsciloscopio() {
  /* O buffer deste canvas ficava travado no valor do HTML (232x50) enquanto
     o CSS o exibia em outro tamanho (259x57 no desktop). Duas consequencias:
     a onda saia esticada de forma desigual (12% na horizontal, 15% na
     vertical) e, em telas de alta densidade, com um quarto dos pixels.
     Agora o buffer acompanha o tamanho exibido x DPR, e setTransform deixa
     o desenho trabalhando em pixels CSS — o resto da funcao continua igual.
     Mesmo padrao do #scene deste arquivo e dos outros 19 simuladores. */
  const dpr = window.devicePixelRatio || 1;
  const r = waveformCanvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  const bufW = Math.round(w * dpr), bufH = Math.round(h * dpr);
  if (waveformCanvas.width !== bufW || waveformCanvas.height !== bufH) {
    waveformCanvas.width = bufW; waveformCanvas.height = bufH;
  }
  wfCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  wfCtx.clearRect(0, 0, w, h);
  wfCtx.strokeStyle = "rgba(35,43,56,0.6)";
  wfCtx.beginPath(); wfCtx.moveTo(0, h / 2); wfCtx.lineTo(w, h / 2); wfCtx.stroke();

  // Produtos formados: sistema estável, de baixa energia — onda calma e
  // verde, visualmente distinta do complexo ativado (vermelho/agitado).
  if (state === "VALIDATED") {
    wfCtx.strokeStyle = "rgba(46, 204, 154, 0.85)";
    wfCtx.lineWidth = 2;
    wfCtx.beginPath();
    const t = (tempoCongelado || 0) * 0.004;
    for (let x = 0; x <= w; x += 4) {
      const y = h / 2 + Math.sin(x * 0.08 + t) * 2.5;
      x === 0 ? wfCtx.moveTo(x, y) : wfCtx.lineTo(x, y);
    }
    wfCtx.stroke();
    return;
  }

  const frac = charge / EA_NECESSARIA;
  const cor = frac < 0.5
    ? lerpColorRgb([240, 207, 76], [255, 140, 66], frac / 0.5)
    : lerpColorRgb([255, 140, 66], [255, 71, 87], (frac - 0.5) / 0.5);

  wfCtx.strokeStyle = `rgb(${cor[0]},${cor[1]},${cor[2]})`;
  wfCtx.lineWidth = 2;
  wfCtx.beginPath();
  const t = performance.now() * 0.01;
  for (let x = 0; x <= w; x += 4) {
    const freq = 0.15 + frac * 0.5;
    const ruido = (Math.random() - 0.5) * frac * 10;
    const y = h / 2 + Math.sin(x * freq + t) * (3 + frac * 16) + ruido;
    x === 0 ? wfCtx.moveTo(x, y) : wfCtx.lineTo(x, y);
  }
  wfCtx.stroke();
}

function lerpColorRgb(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round);
}

