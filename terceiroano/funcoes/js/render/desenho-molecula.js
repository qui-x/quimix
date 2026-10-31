/* ═══════════════════════════════════════════════════════════════
   CAMADA: DESENHO
   ARQUIVO: js/render/desenho-molecula.js
   ───────────────────────────────────────────────────────────────
   COMO UMA MOLÉCULA APARECE NO CANVAS — fórmula estrutural.

   Desenha átomos como rótulos condensados (CH₃, CH₂, OH, NH₂, Cl) e
   ligações simples, duplas e triplas, no padrão dos livros: o
   hidrogênio nunca é um átomo solto no desenho, ele aparece no rótulo
   de quem o carrega. Não decide nada sobre química nem sobre onde os
   átomos ficam — recebe posições em pixels e desenha.

   CORES
   Tudo sai de uma paleta lida do tema no momento do desenho. Os
   elementos têm duas versões: tons claros para fundo escuro (tema
   escuro e alto contraste, que no 3º ano é preto) e tons escuros para
   o tema claro. Cada par foi escolhido para passar 4,5:1 contra o
   painel do seu tema — o texto no canvas também é texto.

   Depende de: formatacao.js (cssVar).
═══════════════════════════════════════════════════════════════ */

'use strict';

(function (raiz) {
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var D = Q3.Desenho = {};

  var ELEMENTOS = {
    escuro: { C: '#d3dde8', O: '#ff8a80', N: '#8ab8ff', F: '#a8eca8', Cl: '#6ee69a',
              Br: '#f0b070', I: '#d2a8ff', S: '#f5d76e', P: '#ffb070',
              Si: '#e8c9a0', Mg: '#b7e78a', Na: '#c9a8ff', K: '#e3b0ff' },
    claro:  { C: '#1f2d3d', O: '#b3261e', N: '#1d4ed8', F: '#2f6f31', Cl: '#146c34',
              Br: '#7c4210', I: '#6b21a8', S: '#7a5c00', P: '#8a3b00',
              Si: '#6e4712', Mg: '#3a6410', Na: '#5a2db0', K: '#76209f' }
  };
  // classe do carbono: nulário, primário, secundário, terciário, quaternário
  var CLASSES = {
    escuro: ['#aab4c0', '#7cb4ff', '#6ee69a', '#f7c948', '#ff8cc8'],
    claro:  ['#4b5563', '#1d4ed8', '#146c34', '#8a5a00', '#a3195b']
  };
  var NOMES = { C: 'Carbono', O: 'Oxigênio', N: 'Nitrogênio', F: 'Flúor',
                Cl: 'Cloro', Br: 'Bromo', I: 'Iodo', S: 'Enxofre', P: 'Fósforo',
                Si: 'Silício', Mg: 'Magnésio', Na: 'Sódio', K: 'Potássio' };
  D.NOMES = NOMES;

  var SUB = '₀₁₂₃₄₅₆₇₈₉';
  D.subscrito = function (n) { return String(n).split('').map(function (d) { return SUB[+d]; }).join(''); };

  /* Paleta do momento. Lida a cada quadro: o aluno pode trocar de tema
     com o simulador aberto e o desenho acompanha na hora. */
  D.paleta = function () {
    var b = document.body;
    var claro = b.classList.contains('light-mode') && !b.classList.contains('high-contrast');
    var tom = claro ? 'claro' : 'escuro';
    return {
      claro: claro,
      fundo: cssVar('--bg-void', claro ? '#f0f4f8' : '#080c14'),
      painel: cssVar('--bg-panel', claro ? '#e4eaf2' : '#0c1520'),
      texto: cssVar('--text-primary', claro ? '#0d1a2e' : '#ddeaf8'),
      suave: cssVar('--text-secondary', claro ? '#2c4a6e' : '#7a9ab8'),
      acento: cssVar('--accent-main', claro ? '#3c5b0a' : '#cbf6a6'),
      borda: cssVar('--border', claro ? '#9badc4' : '#1c2e44'),
      ok: cssVar('--accent-ok', claro ? '#116932' : '#4ade80'),
      elementos: ELEMENTOS[tom],
      classes: CLASSES[tom]
    };
  };

  /* Rótulo condensado de um átomo: C + seus H implícitos. */
  D.rotulo = function (g, id) {
    var a = g.atomos[id], h = g.hidrogenios(id);
    return a.el + (h ? 'H' + (h > 1 ? D.subscrito(h) : '') : '');
  };

  /* Meia-largura e meia-altura da "pílula" de um rótulo, para as
     ligações começarem e terminarem na borda dela, não no centro. */
  D.medirRotulo = function (ctx, texto, fonte) {
    ctx.font = '600 ' + fonte + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
    var w = ctx.measureText(texto).width;
    return { mx: w / 2 + fonte * 0.42, my: fonte * 0.62 + 2 };
  };

  /* UM TEXTO QUE CABE na largura `larg` (as telas estreitas do celular): a fonte encolhe até `min` e,
     se ainda não couber, o texto quebra nas palavras em até `linhas` linhas (a última ganha "…" se
     sobrar). `subir`: as linhas extras sobem — para um texto de rodapé não sair por baixo do canvas.
     Usa o alinhamento e a linha de base que o ctx já tem. `medir`: só mede, não desenha.
     Devolve { linhas, tam, altura } (altura = a distância da 1ª à última linha + uma linha). */
  D.textoQueCabe = function (ctx, texto, x, y, larg, o) {
    o = o || {};
    var peso = o.peso || '500', fam = o.fam || 'system-ui, sans-serif', tam = o.tam || 13, min = o.min || 10, maxL = o.linhas || 2;
    var fonte = function (t) { ctx.font = peso + ' ' + t + 'px ' + fam; };
    var t = tam; fonte(t);
    while (t > min && ctx.measureText(texto).width > larg) { t -= 0.5; fonte(t); }
    var linhas = [texto];
    if (ctx.measureText(texto).width > larg) {
      linhas = []; var atual = '';
      String(texto).split(' ').forEach(function (p) { var tt = atual ? atual + ' ' + p : p; if (atual && ctx.measureText(tt).width > larg) { linhas.push(atual); atual = p; } else atual = tt; });
      if (atual) linhas.push(atual);
      if (linhas.length > maxL) {
        linhas = linhas.slice(0, maxL); var u = linhas[maxL - 1];
        while (u.length > 1 && ctx.measureText(u + '…').width > larg) u = u.slice(0, -1);
        linhas[maxL - 1] = u + '…';
      }
      // uma palavra só, mais larga que a linha: ganha "…" (o texto inteiro está nos painéis)
      linhas = linhas.map(function (l) { if (ctx.measureText(l).width <= larg) return l; while (l.length > 1 && ctx.measureText(l + '…').width > larg) l = l.slice(0, -1); return l + '…'; });
    }
    var lh = t * (o.entre || 1.28), y0 = o.subir ? y - (linhas.length - 1) * lh : y;
    if (!o.medir) linhas.forEach(function (l, k) { ctx.fillText(l, x, y0 + k * lh); });
    return { linhas: linhas.length, tam: t, altura: linhas.length * lh };
  };

  /* Recuo do centro até a borda da pílula, na direção (ux, uy). */
  function recuo(m, ux, uy) {
    var tx = Math.abs(ux) > 1e-6 ? m.mx / Math.abs(ux) : Infinity;
    var ty = Math.abs(uy) > 1e-6 ? m.my / Math.abs(uy) : Infinity;
    return Math.min(tx, ty) + 3;
  }

  /* Ligação simples, dupla ou tripla. `interno` (opcional) é um ponto do
     lado de DENTRO de um anel: a segunda linha da dupla vai para lá e sai
     mais curta, como nos livros. Fora de anel, as linhas ficam simétricas. */
  D.ligacao = function (ctx, pa, pb, ordem, mA, mB, opcoes) {
    opcoes = opcoes || {};
    var dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy);
    if (L < 1) return;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var ra = recuo(mA, ux, uy), rb = recuo(mB, ux, uy);
    if (ra + rb > L - 4) { var k = (L - 4) / (ra + rb); ra *= k; rb *= k; }
    var a = { x: pa.x + ux * ra, y: pa.y + uy * ra }, b = { x: pb.x - ux * rb, y: pb.y - uy * rb };
    var esp = opcoes.espacamento || 5;
    ctx.strokeStyle = opcoes.cor; ctx.lineWidth = opcoes.largura || 2.4; ctx.lineCap = 'round';
    var linha = function (off, encurta) {
      var e = encurta || 0;
      ctx.beginPath();
      ctx.moveTo(a.x + nx * off + ux * e, a.y + ny * off + uy * e);
      ctx.lineTo(b.x + nx * off - ux * e, b.y + ny * off - uy * e);
      ctx.stroke();
    };
    if (ordem === 1) linha(0);
    else if (ordem === 2) {
      if (opcoes.interno) {
        var lado = ((opcoes.interno.x - pa.x) * nx + (opcoes.interno.y - pa.y) * ny) > 0 ? 1 : -1;
        linha(0); linha(lado * esp * 1.5, (L - ra - rb) * 0.14);
      } else { linha(-esp * 0.75); linha(esp * 0.75); }
    } else { linha(0); linha(-esp * 1.25); linha(esp * 1.25); }
  };

  /* CUNHA ESTEREOQUÍMICA no plano: ponta estreita em pa (o átomo que
     está no plano do papel), larga em pb (o que sai dele). 'frente' é a
     cunha cheia; 'tras', a tracejada, com traços que alargam rumo a pb.
     Recorta nas caixas dos rótulos como as ligações comuns, e devolve o
     segmento recortado (a vista de Lewis põe o par de elétrons nele). */
  D.cunha = function (ctx, pa, pb, mA, mB, tipo, opcoes) {
    var dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy);
    if (L < 1) return null;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var ra = recuo(mA, ux, uy), rb = recuo(mB, ux, uy);
    if (ra + rb > L - 4) { var k = (L - 4) / (ra + rb); ra *= k; rb *= k; }
    var x0 = pa.x + ux * ra, y0 = pa.y + uy * ra, x1 = pb.x - ux * rb, y1 = pb.y - uy * rb;
    var hw = opcoes.meia || 4.5;
    if (tipo === 'frente') {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + nx * hw, y1 + ny * hw); ctx.lineTo(x1 - nx * hw, y1 - ny * hw); ctx.closePath();
      ctx.fillStyle = opcoes.cor; ctx.fill();
    } else {
      var comp = Math.hypot(x1 - x0, y1 - y0), n = Math.max(4, Math.min(11, Math.round(comp / 5)));
      ctx.strokeStyle = opcoes.cor; ctx.lineWidth = opcoes.traco || 1.5; ctx.lineCap = 'butt';
      for (var i = 1; i <= n; i++) {
        var t = i / n, mx = x0 + (x1 - x0) * t, my = y0 + (y1 - y0) * t, h = Math.max(0.8, hw * t);
        ctx.beginPath(); ctx.moveTo(mx - nx * h, my - ny * h); ctx.lineTo(mx + nx * h, my + ny * h); ctx.stroke();
      }
    }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  };

  /* Átomo: pílula com o rótulo condensado. `aro` desenha um anel colorido
     em volta (classe do carbono); `destaque` é a seleção. */
  D.atomo = function (ctx, p, texto, fonte, cores, opcoes) {
    opcoes = opcoes || {};
    var m = D.medirRotulo(ctx, texto, fonte);
    var r = Math.min(m.my, m.mx);
    var arred = function (x, y, w, h, rr) {
      ctx.beginPath();
      ctx.moveTo(x + rr, y); ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr); ctx.closePath();
    };
    if (opcoes.destaque) {
      arred(p.x - m.mx - 5, p.y - m.my - 5, 2 * m.mx + 10, 2 * m.my + 10, r + 5);
      ctx.strokeStyle = cores.acento; ctx.lineWidth = 3; ctx.stroke();
    }
    arred(p.x - m.mx, p.y - m.my, 2 * m.mx, 2 * m.my, r);
    ctx.fillStyle = cores.painel; ctx.fill();
    ctx.strokeStyle = opcoes.aro || cores.borda; ctx.lineWidth = opcoes.aro ? 2.2 : 1.2; ctx.stroke();
    ctx.fillStyle = opcoes.corTexto; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 ' + fonte + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillText(texto, p.x, p.y + 0.5);
    return m;
  };

  /* Encaixe livre: onde o próximo átomo vai entrar. Tracejado, com o
     símbolo do elemento que será anexado — o aluno vê o que e onde. */
  D.encaixe = function (ctx, de, p, el, cores, pulso) {
    ctx.save();
    ctx.setLineDash([4, 5]); ctx.strokeStyle = cores.acento; ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.75;
    ctx.beginPath(); ctx.moveTo(de.x, de.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.globalAlpha = 1;
    var r = 21 + (pulso || 0) * 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = cores.painel; ctx.fill(); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = cores.acento; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 15px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillText('+' + el, p.x, p.y + 0.5);
    ctx.restore();
  };

  /* Selo da classe do carbono (1°, 2°...), fora da pílula, no lado com
     mais espaço — calculado por quem chama. */
  D.seloClasse = function (ctx, p, n, cor, dirX, dirY, dist) {
    var x = p.x + dirX * dist, y = p.y + dirY * dist;
    ctx.font = '700 11px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = cor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n + '°', x, y);
  };

  /* Anel de foco de teclado: tracejado e grosso, visível em qualquer tema. */
  D.foco = function (ctx, p, r, cor) {
    ctx.save();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = cor; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  };

})(typeof window !== 'undefined' ? window : globalThis);
