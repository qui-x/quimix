/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: js/ui/moldura-cena.js
   ───────────────────────────────────────────────────────────────
   A MOLDURA DA CENA: o que o HTML cobre na área livre do canvas.

   A cena de cada modo é desenhada num retângulo W × H (a área livre).
   Por cima dele ficam dois elementos de HTML:
     · a pílula do modo, no alto e ao centro (.canvas-overlay: top
       .72rem, uns 30 px de altura, no máximo 94% da largura);
     · nos modos com câmera, a coluna dos botões de zoom, à direita e
       no meio da altura (.nav3d: right 12px, botões de 38 px — 44 px
       no toque —, vão de 6 px).
   Antes, cada módulo supunha esses lugares com números próprios, e
   rótulos acabavam por baixo da pílula ou do zoom (o estudo da área
   livre mediu isso em 90 tamanhos). Agora a cena pergunta aqui.

   Os números seguem o CSS de stylecarbono.css. Mudou o CSS da pílula
   ou do zoom, muda aqui também.
═══════════════════════════════════════════════════════════════ */

'use strict';

window.Q3 = window.Q3 || {};

Q3.Moldura = (function () {
  var PILULA_ALTO = 46;          // do topo da cena até um pouco abaixo da pílula
  var PILULA_MEIA = 300;         // meia-largura que a pílula costuma ocupar no computador
  var ZOOM_LADO = 44, ZOOM_VAO = 6, ZOOM_DIR = 12;   // o pior caso: botões de toque

  /* a faixa da pílula, centrada (o texto dela muda; a conta usa a largura costumeira) */
  function pilula(W) {
    var meia = Math.min(W * 0.47, PILULA_MEIA);
    return { x0: W / 2 - meia, y0: 0, x1: W / 2 + meia, y1: PILULA_ALTO };
  }

  /* os botões de zoom: em COLUNA à direita, no meio da altura (o normal), ou em FILEIRA no pé da cena,
     centrada (o CSS faz isso no celular em pé, onde falta largura e sobra altura). Quem decide é o CSS:
     aqui só se lê a direção e quantos botões estão à vista, e a conta usa o tamanho de toque (44 px).
     null: a cena não tem botões de zoom agora. */
  function zoom(W, H, n) {
    var nav = typeof document !== 'undefined' ? document.querySelector('.canvas-wrap .nav3d') : null;
    if (nav && (nav.hidden || nav.offsetParent === null)) return null;
    var vis = nav ? nav.querySelectorAll('.nav3d-btn:not([hidden])').length : 0;
    n = vis || n || 4;
    var comp = n * ZOOM_LADO + (n - 1) * ZOOM_VAO;
    if (nav && getComputedStyle(nav).flexDirection === 'row')
      return { x0: W / 2 - comp / 2, y0: H - ZOOM_DIR - ZOOM_LADO, x1: W / 2 + comp / 2, y1: H - ZOOM_DIR, fileira: true };
    return { x0: W - ZOOM_DIR - ZOOM_LADO, y0: H / 2 - comp / 2, x1: W - ZOOM_DIR, y1: H / 2 + comp / 2 };
  }

  /* o retângulo onde o DESENHO pode ir sem passar por baixo do HTML: abaixo da pílula, e à esquerda da
     coluna de zoom (ou acima da fileira de zoom). Uma folga pequena nas bordas. */
  function livre(W, H, comZoom) {
    var p = pilula(W), z = comZoom ? zoom(W, H) : null;
    var esq = W < 520 ? 10 : 18, dir = esq, topo = p.y1 + 6, pe = 14;
    if (z && z.fileira) pe = H - z.y0 + 6;
    else if (z) dir = W - z.x0 + 6;
    return { x: esq, y: topo, w: Math.max(40, W - esq - dir), h: Math.max(40, H - topo - pe) };
  }

  function cruza(a, b, folga) {
    folga = folga || 0;
    return a.x0 < b.x1 + folga && a.x1 > b.x0 - folga && a.y0 < b.y1 + folga && a.y1 > b.y0 - folga;
  }
  function area(a, b) {
    var w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
    return w > 0 && h > 0 ? w * h : 0;
  }

  /* RÓTULOS QUE DESVIAM. Cada rótulo tem um ponto preferido e uma direção "para fora" (ux, uy). Os
     candidatos andam nessa direção e para os lados; fica o primeiro que não encosta em nenhum obstáculo
     (núcleos, selos σ/π, a pílula, o zoom) nem em rótulo já posto, e que cabe na cena. Sem nenhum livre,
     fica o de menor sobreposição. Devolve, para cada rótulo, o centro escolhido { x, y }. */
  function posicionar(rotulos, obstaculos, W, H) {
    var postos = [], saida = [];
    rotulos.forEach(function (r) {
      var ux = r.ux || 0, uy = r.uy || 0, m = Math.hypot(ux, uy);
      if (m > 1e-6) { ux /= m; uy /= m; } else { ux = 0; uy = -1; }
      var px = -uy, py = ux, cands = [];
      for (var k = 0; k <= 4; k++) cands.push([r.x + ux * k * 7, r.y + uy * k * 7]);
      for (var j = 0; j <= 2; j++) {
        var lado = r.w / 2 + 6;
        cands.push([r.x + ux * j * 7 + px * lado, r.y + uy * j * 7 + py * lado]);
        cands.push([r.x + ux * j * 7 - px * lado, r.y + uy * j * 7 - py * lado]);
      }
      // sem lugar por fora (a borda, a coluna de zoom): o rótulo volta para dentro, ao longo da mesma linha
      for (var q = 1; q <= 9; q++) cands.push([r.x - ux * q * 8, r.y - uy * q * 8]);
      var melhor = null, menor = Infinity;
      for (var c = 0; c < cands.length; c++) {
        var cx = cands[c][0], cy = cands[c][1];
        var cx0 = Math.max(4 + r.w / 2, Math.min(W - 4 - r.w / 2, cx)), cy0 = Math.max(4 + r.h / 2, Math.min(H - 4 - r.h / 2, cy));
        var caixa = { x0: cx0 - r.w / 2, y0: cy0 - r.h / 2, x1: cx0 + r.w / 2, y1: cy0 + r.h / 2 };
        var sob = 0;
        obstaculos.concat(postos).forEach(function (o) { if (cruza(caixa, o, 2)) sob += area(caixa, { x0: o.x0 - 2, y0: o.y0 - 2, x1: o.x1 + 2, y1: o.y1 + 2 }) + 1; });
        if (cx0 !== cx || cy0 !== cy) sob += 0.5;          // empurrado pela borda: aceitável, mas um livre é melhor
        if (sob < menor) { menor = sob; melhor = { x: cx0, y: cy0, caixa: caixa }; }
        if (sob === 0) break;
      }
      postos.push(melhor.caixa);
      saida.push({ x: melhor.x, y: melhor.y });
    });
    return saida;
  }

  return { pilula: pilula, zoom: zoom, livre: livre, cruza: cruza, posicionar: posicionar };
})();
