/* ═══════════════════════════════════════════════════════════════
   CAMADA: DESENHO
   ARQUIVO: js/render/representacoes.js
   ───────────────────────────────────────────────────────────────
   AS OUTRAS FORMAS DE REPRESENTAR A MESMA MOLÉCULA.

   O editor monta na estrutural CONDENSADA (desenho-molecula.js). Este
   arquivo desenha a mesma molécula das outras formas do Ensino Médio,
   só para ver:

     completa .... todos os átomos, inclusive cada H, e todas as ligações
     linha ....... em bastão: carbono é vértice ou ponta, H omitido,
                   heteroátomo com seu rótulo (OH, NH₂, Cl)
     lewis ....... cada ligação é um par de elétrons (pontos), com os
                   pares isolados do O, do N e dos halogênios
     esfera ...... 3D, esfera e bastão, com ângulos e comprimentos reais
     compacto .... 3D, modelo compacto (raios de van der Waals)

   Duas regras de desenho que valem para as planas:
     · os H ocupam o MESMO lugar na completa e na de Lewis — o aluno
       troca de uma para a outra e reconhece a molécula;
     · cada H vai para o vão com mais espaço em volta do átomo. No CH₂
       do meio da cadeia os dois H saem para FORA do ângulo, como nos
       livros, e não um dentro e outro fora.

   Depende de: desenho-molecula.js (paleta, rótulos, ligações).
═══════════════════════════════════════════════════════════════ */

'use strict';

(function (raiz) {
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var R = Q3.Representacoes = {};
  var FONTE = 'system-ui, -apple-system, "Segoe UI", sans-serif';

  R.VISTAS = [
    { id: 'condensada', nome: 'Estrutural condensada', extra: 'edita', edita: true },
    { id: 'completa',   nome: 'Estrutural completa',   extra: 'todos os H' },
    { id: 'linha',      nome: 'Em linha (bastão)',      extra: 'esqueleto' },
    { id: 'lewis',      nome: 'Eletrônica de Lewis',    extra: 'pares de e⁻' },
    { id: 'esfera',     nome: 'Esfera e bastão',        extra: '3D', tresD: true },
    { id: 'compacto',   nome: 'Modelo compacto',        extra: '3D', tresD: true }
  ];
  R.vista = function (id) { return R.VISTAS.filter(function (v) { return v.id === id; })[0] || R.VISTAS[0]; };


  /* A distribuição nos vãos vem do modelo de Lewis (core/lewis.js): é a
     MESMA função que decide onde ficam os H na completa e na de Lewis,
     e onde o simulador de reações vai desenhar os pares. Uma só fonte. */
  R.distribuir = function (a, n) { return Q3.Lewis.distribuir(a, n); };
  R.paresIsolados = function (g, id) { return Q3.Lewis.atomo(g, id).pares; };

  function angulosPesados(g, id, T) {
    var p = T(id);
    return g.vizinhos(id).map(function (v) { var q = T(v.id); return Math.atan2(q.y - p.y, q.x - p.x); });
  }

  /* Rótulo com fundo na cor do canvas, para a ponta das linhas não
     atravessar a letra. Devolve a caixa, para as ligações recuarem. */
  function rotulo(ctx, texto, p, fonte, cor, fundo) {
    ctx.font = '600 ' + fonte + 'px ' + FONTE;
    var w = ctx.measureText(texto).width;
    var caixa = { mx: w / 2 + 3, my: fonte * 0.58 };
    ctx.fillStyle = fundo; ctx.fillRect(p.x - caixa.mx, p.y - caixa.my, caixa.mx * 2, caixa.my * 2);
    ctx.fillStyle = cor; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(texto, p.x, p.y + 0.5);
    return caixa;
  }
  function medir(ctx, texto, fonte) {
    ctx.font = '600 ' + fonte + 'px ' + FONTE;
    return { mx: ctx.measureText(texto).width / 2 + 3, my: fonte * 0.58 };
  }
  var VAZIO = { mx: 0, my: 0 };

  /* Cunha entre duas caixas de rótulo (ponta estreita em pa). Mesmo
     desenho de D.cunha, com o recuo deste arquivo — sem fresta nos
     vértices do desenho em linha. Devolve o segmento recortado. */
  function cunhaEntre(ctx, pa, pb, ca, cb, tipo, cor, hw, traco) {
    var dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy);
    if (L < 1) return null;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux, ra = recuo(ca, ux, uy), rb = recuo(cb, ux, uy);
    var x0 = pa.x + ux * ra, y0 = pa.y + uy * ra, x1 = pb.x - ux * rb, y1 = pb.y - uy * rb;
    if (tipo === 'frente') {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + nx * hw, y1 + ny * hw); ctx.lineTo(x1 - nx * hw, y1 - ny * hw); ctx.closePath();
      ctx.fillStyle = cor; ctx.fill();
    } else {
      var comp = Math.hypot(x1 - x0, y1 - y0), n = Math.max(4, Math.min(11, Math.round(comp / 5)));
      ctx.strokeStyle = cor; ctx.lineWidth = traco; ctx.lineCap = 'butt';
      for (var i = 1; i <= n; i++) {
        var t = i / n, mx = x0 + (x1 - x0) * t, my = y0 + (y1 - y0) * t, h = Math.max(0.8, hw * t);
        ctx.beginPath(); ctx.moveTo(mx - nx * h, my - ny * h); ctx.lineTo(mx + nx * h, my + ny * h); ctx.stroke();
      }
    }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }
  /* Os tipos dos H de um átomo, na ordem de desenho: o do plano no meio,
     frente e trás nas pontas (CH₃: frente, plano, trás; CH₂: frente, trás). */
  function ordenarTiposH(t) {
    t = t || [];
    return t.filter(function (x) { return x === 'frente'; })
      .concat(t.filter(function (x) { return x === 'plano'; }), t.filter(function (x) { return x === 'tras'; }));
  }

  /* segmento simples entre duas caixas (sem o recuo fixo de desenho-molecula,
     que deixaria uma fresta nos vértices do desenho em linha) */
  function segmento(ctx, pa, pb, ca, cb, cor, larg, off) {
    var dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy);
    if (L < 1) return;
    var ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var ra = recuo(ca, ux, uy), rb = recuo(cb, ux, uy);
    ctx.strokeStyle = cor; ctx.lineWidth = larg; ctx.lineCap = 'round';
    (off || [0]).forEach(function (o) {
      var e = o.encurta || 0, d = o.d !== undefined ? o.d : o;
      ctx.beginPath();
      ctx.moveTo(pa.x + ux * (ra + e) + nx * d, pa.y + uy * (ra + e) + ny * d);
      ctx.lineTo(pb.x - ux * (rb + e) + nx * d, pb.y - uy * (rb + e) + ny * d);
      ctx.stroke();
    });
  }
  function recuo(c, ux, uy) {
    if (!c.mx && !c.my) return 0;
    var tx = Math.abs(ux) > 1e-6 ? c.mx / Math.abs(ux) : Infinity;
    var ty = Math.abs(uy) > 1e-6 ? c.my / Math.abs(uy) : Infinity;
    return Math.min(tx, ty) + 2;
  }
  function linhasDa(ordem, esp, interno, pa, pb) {
    if (ordem === 1) return [0];
    if (ordem === 3) return [0, esp * 1.2, -esp * 1.2];
    if (interno) {
      var nx = -(pb.y - pa.y), ny = pb.x - pa.x, lado = ((interno.x - pa.x) * nx + (interno.y - pa.y) * ny) > 0 ? 1 : -1;
      return [0, { d: lado * esp * 1.5, encurta: Math.hypot(pb.x - pa.x, pb.y - pa.y) * 0.13 }];
    }
    return [esp * 0.72, -esp * 0.72];
  }

  /* ═══════════════ REPRESENTAÇÕES PLANAS ═══════════════ */

  /* d: { g, T(id)→{x,y}, esc, cores, aneis, fonte } */
  R.desenharPlana = function (ctx, tipo, d) {
    var g = d.g, T = d.T, cores = d.cores, esc = d.esc, fonte = d.fonte;
    var ids = Object.keys(g.atomos);
    var larg = Math.max(2, Math.min(3.2, esc * 0.04)), esp = Math.max(4, esc * 0.07);
    var interno = function (l) {
      for (var i = 0; i < d.aneis.length; i++) {
        var r = d.aneis[i], ia = r.indexOf(l.a), ib = r.indexOf(l.b);
        if (ia >= 0 && ib >= 0 && (Math.abs(ia - ib) === 1 || Math.abs(ia - ib) === r.length - 1)) {
          var cx = 0, cy = 0; r.forEach(function (id) { var p = T(id); cx += p.x; cy += p.y; });
          return { x: cx / r.length, y: cy / r.length };
        }
      }
      return null;
    };
    var corEl = function (el) { return cores.elementos[el] || cores.texto; };
    var est = d.estereo || { ligacoes: {}, hidrogenios: {} };
    var hwC = Math.max(3.5, esc * 0.07), trC = Math.max(1.3, esc * 0.022);
    var cunhaDe = function (l) { return est.ligacoes[l.a < l.b ? l.a + '|' + l.b : l.b + '|' + l.a] || null; };

    if (tipo === 'linha') {
      // metano não tem esqueleto para desenhar: mostra o rótulo
      if (ids.length === 1) { rotulo(ctx, Q3.Desenho.rotulo(g, ids[0]), T(ids[0]), fonte + 2, corEl(g.atomos[ids[0]].el), cores.fundo); return; }
      var caixa = {};
      ids.forEach(function (id) {
        caixa[id] = g.atomos[id].el === 'C' ? VAZIO : medir(ctx, Q3.Desenho.rotulo(g, id), fonte);
      });
      g.ligacoes.forEach(function (l) {
        var c = cunhaDe(l);
        if (c) { var o = c.estreito === l.a ? l.b : l.a; cunhaEntre(ctx, T(c.estreito), T(o), caixa[c.estreito], caixa[o], c.tipo, cores.texto, hwC, trC); return; }
        segmento(ctx, T(l.a), T(l.b), caixa[l.a], caixa[l.b], cores.texto, larg, linhasDa(l.ordem, esp, interno(l), T(l.a), T(l.b)));
      });
      ids.forEach(function (id) {
        if (g.atomos[id].el !== 'C') rotulo(ctx, Q3.Desenho.rotulo(g, id), T(id), fonte, corEl(g.atomos[id].el), cores.fundo);
      });
      return;
    }

    // completa e Lewis: cada H é um átomo, no mesmo lugar nas duas
    var LH = esc * 0.72, fH = Math.max(11, Math.round(fonte * 0.86));
    var hs = [], caixas = {}, angH = {};
    /* onde cada H vai, fugindo dos H e átomos vizinhos (core/lewis.js).
       O editor calcula uma vez por mudança da molécula, em unidades do
       desenho (d.posH); aqui só se converte para a tela. */
    var posH = {};
    if (d.posH) Object.keys(d.posH).forEach(function (id) { posH[id] = d.posH[id].map(function (h) { return { ang: h.ang, comp: h.comp * esc }; }); });
    else posH = Q3.Lewis.posicoesH(g, T, LH);
    ids.forEach(function (id) {
      var p = T(id), lista = posH[id] || [];
      angH[id] = lista.map(function (h) { return h.ang; });
      var tiposH = ordenarTiposH(est.hidrogenios[id]);
      lista.forEach(function (h, i) { hs.push({ de: id, a: h.ang, tipo: tiposH[i] || 'plano', p: { x: p.x + Math.cos(h.ang) * h.comp, y: p.y + Math.sin(h.ang) * h.comp } }); });
      caixas[id] = medir(ctx, g.atomos[id].el, fonte);
    });
    var cH = medir(ctx, 'H', fH);
    var raioPonto = Math.max(2, esc * 0.028);   // 2 px no mínimo: no celular os pontos de Lewis ficavam no limite do visível
    var ponto = function (x, y) { ctx.beginPath(); ctx.arc(x, y, raioPonto, 0, Math.PI * 2); ctx.fill(); };
    /* par de elétrons compartilhado no meio da ligação; na dupla e na
       tripla, os pares ficam lado a lado ao longo dela (C::C, C:::C) */
    var paresNaLigacao = function (pa, pb, ordem) {
      var dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      var mx = (pa.x + pb.x) / 2, my = (pa.y + pb.y) / 2, sep = raioPonto * 2.6, passo = raioPonto * 3.4;
      for (var k = 0; k < ordem; k++) {
        var o = (k - (ordem - 1) / 2) * passo;
        ponto(mx + ux * o + nx * sep / 2, my + uy * o + ny * sep / 2);
        ponto(mx + ux * o - nx * sep / 2, my + uy * o - ny * sep / 2);
      }
    };

    if (tipo === 'completa') {
      g.ligacoes.forEach(function (l) {
        var c = cunhaDe(l);
        if (c) { var o = c.estreito === l.a ? l.b : l.a; cunhaEntre(ctx, T(c.estreito), T(o), caixas[c.estreito], caixas[o], c.tipo, cores.suave, hwC, trC); return; }
        segmento(ctx, T(l.a), T(l.b), caixas[l.a], caixas[l.b], cores.suave, larg, linhasDa(l.ordem, esp, interno(l), T(l.a), T(l.b)));
      });
      hs.forEach(function (h) {
        if (h.tipo !== 'plano') { cunhaEntre(ctx, T(h.de), h.p, caixas[h.de], cH, h.tipo, cores.suave, hwC * 0.85, trC); return; }
        segmento(ctx, T(h.de), h.p, caixas[h.de], cH, cores.suave, Math.max(1.6, larg * 0.8), [0]);
      });
      ids.forEach(function (id) { rotulo(ctx, g.atomos[id].el, T(id), fonte, corEl(g.atomos[id].el), cores.fundo); });
      hs.forEach(function (h) { rotulo(ctx, 'H', h.p, fH, cores.texto, cores.fundo); });
      return;
    }

    /* ── LEWIS ─────────────────────────────────────────────────────
       Cada BASTÃO carrega exatamente UM par de elétrons, desenhado sobre
       ele: a simples é um bastão com um par; a dupla, dois bastões com
       um par cada; a tripla, três. Assim a vista continua "eletrônica"
       (os elétrons aparecem) e a conectividade fica visível — e o aluno
       vê que cada traço da fórmula estrutural É um par de elétrons, que
       é a notação das setas no simulador de reações.
       O bastão é fino e o par é desenhado por cima, com um recorte na
       cor do fundo: os elétrons são o assunto desta representação. */
    var an = Q3.Lewis.analisar(g), arr = Q3.Lewis.arranjo2D(g, an, T, posH);
    var larB = Math.max(1.3, larg * 0.55);
    var parSobre = function (x0, y0, x1, y1) {
      var ux = x1 - x0, uy = y1 - y0, L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
      var mx = (x0 + x1) / 2, my = (y0 + y1) / 2, sep = raioPonto * 1.45;
      ctx.fillStyle = cores.fundo;
      ctx.beginPath(); ctx.arc(mx - ux * sep, my - uy * sep, raioPonto + 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(mx + ux * sep, my + uy * sep, raioPonto + 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = cores.texto;
      ponto(mx - ux * sep, my - uy * sep); ponto(mx + ux * sep, my + uy * sep);
    };
    /* um bastão por par; devolve os segmentos já recortados nas caixas */
    var bastoes = function (pa, pb, ca, cb, offs) {
      var dx = pb.x - pa.x, dy = pb.y - pa.y, L = Math.hypot(dx, dy);
      if (L < 1) return;
      var ux = dx / L, uy = dy / L, nx = -uy, ny = ux, ra = recuo(ca, ux, uy), rb = recuo(cb, ux, uy);
      offs.forEach(function (o) {
        var e = o.encurta || 0, d = o.d !== undefined ? o.d : o;
        var x0 = pa.x + ux * (ra + e) + nx * d, y0 = pa.y + uy * (ra + e) + ny * d;
        var x1 = pb.x - ux * (rb + e) + nx * d, y1 = pb.y - uy * (rb + e) + ny * d;
        ctx.strokeStyle = cores.suave; ctx.lineWidth = larB; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        parSobre(x0, y0, x1, y1);
      });
    };
    /* ligação que sai do papel: o bastão é a própria cunha, e o par de
       elétrons vai sobre ela, como nos bastões comuns */
    var bastaoCunha = function (pa, pb, ca, cb, tipo, hw) {
      var sg = cunhaEntre(ctx, pa, pb, ca, cb, tipo, cores.suave, hw, trC);
      if (sg) parSobre(sg.x0, sg.y0, sg.x1, sg.y1);
    };
    g.ligacoes.forEach(function (l) {
      var c = cunhaDe(l);
      if (c) { var o = c.estreito === l.a ? l.b : l.a; bastaoCunha(T(c.estreito), T(o), caixas[c.estreito], caixas[o], c.tipo, hwC); return; }
      bastoes(T(l.a), T(l.b), caixas[l.a], caixas[l.b], linhasDa(l.ordem, esp * 1.25, interno(l), T(l.a), T(l.b)));
    });
    hs.forEach(function (h) {
      if (h.tipo !== 'plano') { bastaoCunha(T(h.de), h.p, caixas[h.de], cH, h.tipo, hwC * 0.85); return; }
      bastoes(T(h.de), h.p, caixas[h.de], cH, [0]);
    });
    ids.forEach(function (id) { rotulo(ctx, g.atomos[id].el, T(id), fonte, corEl(g.atomos[id].el), cores.fundo); });
    hs.forEach(function (h) { rotulo(ctx, 'H', h.p, fH, cores.texto, cores.fundo); });

    // pares isolados, elétron desemparelhado e carga formal, nos vãos que sobraram
    ctx.fillStyle = cores.texto;
    ids.forEach(function (id) {
      var p = T(id), c = caixas[id], ar = arr[id];
      var dist = Math.max(c.mx, c.my) + raioPonto * 3.2, sep = raioPonto * 2.6;
      ar.pares.forEach(function (a) {
        var cx = p.x + Math.cos(a) * dist, cy = p.y + Math.sin(a) * dist, nx = -Math.sin(a), ny = Math.cos(a);
        ponto(cx + nx * sep / 2, cy + ny * sep / 2); ponto(cx - nx * sep / 2, cy - ny * sep / 2);
      });
      ar.desemparelhados.forEach(function (a) { ponto(p.x + Math.cos(a) * dist, p.y + Math.sin(a) * dist); });
      if (ar.carga !== null) {
        var q = an.atomos[id].cargaFormal, txt = Q3.Lewis.textoCarga(q);
        var cx = p.x + Math.cos(ar.carga) * (dist + 5), cy = p.y + Math.sin(ar.carga) * (dist + 5), r = Math.max(8, fonte * 0.5);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = cores.fundo; ctx.fill(); ctx.lineWidth = 1.4; ctx.strokeStyle = cores.texto; ctx.stroke();
        ctx.fillStyle = cores.texto; ctx.font = '700 ' + Math.round(r * 1.2) + 'px ' + FONTE;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, cx, cy + 0.5);
      }
    });
  };

  /* Linha de contagem da vista de Lewis — contar elétrons é o que esta
     representação ensina. Vai acima da dica do editor. */
  R.contagemLewis = function (g) {
    var an = Q3.Lewis.analisar(g), e = an.eletrons, pares = e.naoLigantes / 2;
    var inc = an.problemas.filter(function (p) { return p.tipo === 'incompleto' || p.tipo === 'excedido'; });
    // octeto expandido (S e P) não é erro, mas é o que a Lewis tem a ensinar ali
    var exp = an.problemas.filter(function (p) { return p.tipo === 'expandido'; });
    return e.valencia + ' elétrons de valência  ·  ' + e.paresLigantes + ' pares ligantes  ·  ' + pares + ' pares isolados' +
      (inc.length ? '  ·  ' + inc[0].texto : exp.length ? '  ·  ' + exp[0].texto : '  ·  todos os octetos completos');
  };

  /* Quanto a representação ocupa ALÉM das posições dos átomos pesados,
     em unidades do desenho: os H e os pares isolados ficam para fora. */
  R.margemExtra = function (tipo) { return tipo === 'completa' || tipo === 'lewis' ? 0.95 : 0; };

  /* ═══════════════ REPRESENTAÇÕES ESPACIAIS — no estilo do SILQ ═══
     Mesma estética do visualizador 3D do SILQ (primeiroano/silq/js/
     view3d/view3d.js), para o projeto inteiro ter uma cara só:
       · esfera com gradiente radial deslocado, brilho branco a 20% no
         alto à esquerda e o SÍMBOLO do elemento dentro;
       · raio UNIFORME para os átomos pesados, H a 60% dele;
       · ligação recortada na superfície das esferas, na cor do átomo
         ligante: traço no plano, CUNHA CHEIA para a frente, CUNHA
         TRACEJADA para trás;
       · arcos de ângulo âmbar com o valor numa caixinha, e HUD
         monoespaçado no rodapé (a caixa de referência em arame do SILQ
         ficou de fora: competia com a molécula);
       · as cores dos elementos da tabela do SILQ.
     Quatro desvios, todos correções de defeitos do original:
       1. o símbolo escolhe branco ou escuro pela cor da esfera — o
          branco do SILQ sobre o H (#dbeafe) dá 1,2:1;
       2. no tema claro, ligação e contorno ganham tom mais escuro — o H
          e as ligações para ele sumiam no fundo #f0f4f8;
       3. as cunhas usam a profundidade DA CÂMERA — no SILQ usam a do
          modelo, e depois de girar uma cunha "da frente" podia apontar
          para trás, contrariando a legenda do próprio HUD;
       4. o raio é 28% do comprimento médio das LIGAÇÕES na tela, e não
          28% do tamanho da molécula: para o metano dá o mesmo que o
          SILQ, e numa cadeia de 20 carbonos as esferas não viram bolas
          de 80 px engolindo a molécula. */

  var COR_EL = { C: '#6b7280', H: '#dbeafe', O: '#ef4444', N: '#6366f1', F: '#22c55e', Cl: '#16a34a',
                 Br: '#92400e', I: '#7c3aed', S: '#eab308', P: '#f97316',
                 Si: '#0d9488', Mg: '#f97316', Na: '#dc2626', K: '#b91c1c' };   // tabela do SILQ
  var RAIO_VDW = { H: 1.10, C: 1.70, N: 1.55, O: 1.52, F: 1.47, Cl: 1.75, Br: 1.85, I: 1.98, S: 1.80, P: 1.80, Si: 2.10, Mg: 1.73, Na: 2.27, K: 2.75 };
  R.NOMES_EL = { C: 'carbono', H: 'hidrogênio', O: 'oxigênio', N: 'nitrogênio', F: 'flúor', Cl: 'cloro', Br: 'bromo', I: 'iodo', S: 'enxofre', P: 'fósforo', Si: 'silício', Mg: 'magnésio', Na: 'sódio', K: 'potássio' };
  var FONTE_3D = "'Segoe UI', system-ui, sans-serif", MONO = 'Consolas, "SF Mono", monospace';

  function hexRgb(h) { h = (h || '#888888').replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function rgba(h, a) { var c = hexRgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function mistura(h, alvo, k) { var a = hexRgb(h), b = hexRgb(alvo); return '#' + a.map(function (v, i) { return Math.round(v + (b[i] - v) * k).toString(16).padStart(2, '0'); }).join(''); }
  function lum(h) { return hexRgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function razao(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function textoSobre(h) { return razao('#ffffff', h) >= razao('#111827', h) ? '#ffffff' : '#111827'; }
  /* Cor de preenchimento que garante 4,5:1 para o símbolo: se nem branco
     nem escuro passam (o N #6366f1 do SILQ dá 4,47:1 com branco), a esfera
     escurece aos poucos, na mesma matiz, até o branco passar. */
  function preenchimento(h) {
    var c = h;
    for (var i = 0; i < 12 && Math.max(razao('#ffffff', c), razao('#111827', c)) < 4.5; i++) c = mistura(c, '#000000', 0.06);
    return c;
  }
  R._contrasteSimbolo = function (el, claro) { var c = preenchimento(corEsfera(el, claro)); return razao(textoSobre(c), c); };

  /* Duas cores por elemento, e não uma: a ESFERA e a LIGAÇÃO. No tema
     claro a ligação precisa escurecer para aparecer no fundo #f0f4f8, mas
     a esfera do H tem de continuar clara — escurecida junto, ela virava um
     tom médio (#74808f) em que nem branco nem escuro passavam de 4,3:1. */
  function corEsfera(el, claro) {
    var c = COR_EL[el] || '#888888';
    if (!claro) return c;
    return el === 'H' ? '#d4e2f7' : mistura(c, '#1f2937', 0.15);
  }
  function corLigacao(el, claro) { var c = COR_EL[el] || '#888888'; return claro ? mistura(c, '#1f2937', 0.45) : c; }

  function esfera(ctx, x, y, r, col, el, claro) {
    if (r < 1) return;
    col = preenchimento(col);
    var g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, rgba(col, 1.0)); g.addColorStop(0.65, rgba(col, 0.88)); g.addColorStop(1, rgba(col, 0.50));
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    if (claro) { ctx.lineWidth = 1; ctx.strokeStyle = rgba('#1f2937', 0.28); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x - r * 0.30, y - r * 0.30, r * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#ffffff', 0.20); ctx.fill();
    if (r > 7) {
      ctx.font = 'bold ' + Math.max(8, r * 0.70) + 'px ' + FONTE_3D;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = textoSobre(col); ctx.fillText(el, x, y);
    }
  }

  function ligacao(ctx, cen, lig, dz, lim, rCen, rLig, ordem, col) {
    var dx = lig.sx - cen.sx, dy = lig.sy - cen.sy, len = Math.hypot(dx, dy);
    if (len < 1) return;
    var t0 = Math.min(rCen / len, 0.45), t1 = Math.max(1 - rLig / len, 0.55);
    if (t0 >= t1) return;
    var ux = dx / len, uy = dy / len, px = -uy, py = ux, lw = Math.max(1.2, rCen * 0.040);
    var x0 = cen.sx + ux * len * t0, y0 = cen.sy + uy * len * t0, x1 = cen.sx + ux * len * t1, y1 = cen.sy + uy * len * t1;
    var comp = len * (t1 - t0);
    ctx.lineCap = 'round';
    if (Math.abs(dz) <= lim) {
      var gaps = ordem === 2 ? [-lw * 1.4, lw * 1.4] : ordem === 3 ? [-lw * 2.2, 0, lw * 2.2] : [0];
      gaps.forEach(function (o) {
        ctx.beginPath(); ctx.moveTo(x0 + px * o, y0 + py * o); ctx.lineTo(x1 + px * o, y1 + py * o);
        ctx.strokeStyle = rgba(col, ordem > 1 ? 0.72 : 0.70); ctx.lineWidth = lw; ctx.stroke();
      });
    } else if (dz > lim) {                               // cunha cheia: vem para a frente
      var hw = Math.max(1.2, rCen * 0.09);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + px * hw, y1 + py * hw); ctx.lineTo(x1 - px * hw, y1 - py * hw); ctx.closePath();
      var gr = ctx.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, rgba(col, 0.12)); gr.addColorStop(1, rgba(col, 0.92));
      ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = rgba(col, 0.38); ctx.lineWidth = 0.7; ctx.stroke();
    } else {                                             // cunha tracejada: vai para trás
      var n = Math.max(4, Math.min(14, Math.round(comp / 5)));
      for (var k = 1; k <= n; k++) {
        var t = k / (n + 1), mx = x0 + ux * comp * t, my = y0 + uy * comp * t, h2 = Math.max(0.5, rCen * 0.09 * t);
        ctx.beginPath(); ctx.moveTo(mx - px * h2, my - py * h2); ctx.lineTo(mx + px * h2, my + py * h2);
        ctx.strokeStyle = rgba(col, 0.72); ctx.lineWidth = Math.max(0.6, lw * 0.55 * t); ctx.stroke();
      }
    }
  }

  /* d: { mol, cam, W, H, claro, contraste, centro }
     Devolve o que o editor precisa para o toque e o HUD: posições
     projetadas, raio, e o centro dos ângulos efetivamente usado. */
  R.desenhar3D = function (ctx, tipo, d) {
    var mol = d.mol, cam = d.cam, claro = d.claro && !d.contraste, compacto = tipo === 'compacto';
    if (!mol.atomos.length) return { proj: [] };
    var maxN = mol.atomos.reduce(function (m, a) { return Math.max(m, Math.hypot(a.x, a.y, a.z)); }, 0.3);
    var k = 1 / maxN;                                   // Å → unidade da câmera (raio 1)
    var BASE = 96, area = Math.min(d.W, d.H - 72 - BASE);
    var cx = d.W / 2, cy = 72 + (d.H - 72 - BASE) / 2;
    /* O SILQ enquadra a MAIOR COORDENADA em 27% da menor dimensão; aqui o
       enquadramento é pela maior DISTÂNCIA ao centro (para a molécula nunca
       sair da tela ao girar), e isso numa cadeia comprida encolhia tudo.
       36% compensa: no pior giro a perspectiva amplia 1,4×, e 1,4 × 36%
       ≈ 50% — cabe. */
    var baseScale = area * 0.36;
    var byId = {}, proj = mol.atomos.map(function (a) {
      var p = cam.project(a.x * k, a.y * k, a.z * k, cx, cy, baseScale);
      var o = { id: a.id, el: a.el, h: a.h, sx: p.sx, sy: p.sy, depth: p.depth, x: a.x, y: a.y, z: a.z };
      byId[a.id] = o; return o;
    });
    // raio uniforme: 28% do comprimento médio de ligação na tela (ver desvio 4)
    var somaL = 0, nL = 0;
    mol.ligacoes.forEach(function (l) { var A = byId[l.a], B = byId[l.b]; if (A && B) { somaL += Math.hypot(A.x - B.x, A.y - B.y, A.z - B.z); nL++; } });
    var Lref = nL ? somaL / nL : 1.09;
    var atomR = Math.min(80, 0.28 * Lref * k * baseScale * cam.zoom), atomRH = atomR * 0.60;
    var raioDe = function (a) { return compacto ? RAIO_VDW[a.el] * k * baseScale * cam.zoom * 0.62 : (a.el === 'H' ? atomRH : atomR); };
    var corDe = function (el) { return corEsfera(el, claro); };
    var corLig = function (el) { return corLigacao(el, claro); };

    /* Sem a caixa de referência em arame do SILQ: numa cadeia de carbono
       ela competia com a molécula e não ajudava a ler a profundidade —
       quem faz isso aqui são as cunhas e o tamanho em perspectiva. */
    // ligações (antes dos átomos, como no SILQ)
    if (!compacto) {
      var grau = {}; mol.ligacoes.forEach(function (l) { grau[l.a] = (grau[l.a] || 0) + 1; grau[l.b] = (grau[l.b] || 0) + 1; });
      mol.ligacoes.forEach(function (l) {
        var A = byId[l.a], B = byId[l.b]; if (!A || !B) return;
        var cen = (grau[l.a] || 0) >= (grau[l.b] || 0) ? A : B, lig = cen === A ? B : A;
        var dz = cen.depth - lig.depth;                 // > 0: o ligante está mais perto do observador
        // recorte como no SILQ: no ligante pesado a ligação entra 35% na esfera (que a cobre), no H para na borda
        ligacao(ctx, cen, lig, dz, 0.08, raioDe(cen), lig.el === 'H' ? raioDe(lig) : raioDe(lig) * 0.65, l.ordem, corLig(lig.el));
      });
    }
    /* AS NUVENS DO ÁTOMO ESCOLHIDO (d.nuvens, de Geometria3D.nuvens): uma
       por ligação (ciano) e uma por par isolado (violeta), com os pontos
       dos pares dentro — dois por par, como na estrutura de Lewis. Com a
       tensão desligada, todas do mesmo tamanho; ligada, par isolado e
       ligação múltipla ficam maiores, e em anel de 3 ou 4 as nuvens das
       ligações do anel saem CURVAS, fora do eixo do bastão (a tensão de
       Baeyer vista pelas nuvens). Entram na mesma ordem de profundidade
       dos átomos: a que aponta para longe fica atrás da esfera. */
    var itens = proj.map(function (a) { return { tipo: 'atomo', a: a, depth: a.depth }; });
    var cen = !compacto && d.centro ? byId[d.centro] : null;
    if (cen && d.nuvens && d.nuvens.length) {
      d.nuvens.forEach(function (nv) {
        var par = nv.tipo === 'par', comp = (par ? 0.74 : 0.56) * Lref * nv.fator, larg = (par ? 0.34 : 0.24) * Lref * nv.fator * (par ? 1 : Math.sqrt(nv.pares));
        var v = nv.dir;
        var pt = function (f) { return cam.project((cen.x + v[0] * comp * f) * k, (cen.y + v[1] * comp * f) * k, (cen.z + v[2] * comp * f) * k, cx, cy, baseScale); };
        var meio = pt(0.58), ponta = pt(1);
        itens.push({ tipo: 'nuvem', par: par, pares: nv.pares, meio: meio, ponta: ponta, larg: larg * k * baseScale * cam.zoom * meio.persp, depth: meio.depth });
      });
    }
    var corPar = d.contraste ? '#ffff00' : claro ? '#6d28d9' : '#a78bfa';
    var corLigN = d.contraste ? '#00ffff' : claro ? '#0e7490' : '#22d3ee';
    itens.sort(function (x, y) { return y.depth - x.depth; }).forEach(function (it) {
      if (it.tipo === 'nuvem') {
        var corNuvem = it.par ? corPar : corLigN;
        var ang = Math.atan2(it.ponta.sy - cen.sy, it.ponta.sx - cen.sx);
        var semi = Math.max(it.larg, Math.hypot(it.ponta.sx - cen.sx, it.ponta.sy - cen.sy) * 0.55), mn = it.larg;
        ctx.save();
        ctx.translate(it.meio.sx, it.meio.sy); ctx.rotate(ang);
        var gr = ctx.createRadialGradient(0, 0, 0, 0, 0, semi);
        gr.addColorStop(0, rgba(corNuvem, d.contraste ? 0.35 : (it.par ? 0.50 : 0.42))); gr.addColorStop(1, rgba(corNuvem, 0.05));
        ctx.beginPath(); ctx.ellipse(0, 0, semi, mn, 0, 0, Math.PI * 2);
        ctx.fillStyle = gr; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = rgba(corNuvem, d.contraste ? 0.95 : 0.55); ctx.stroke();
        // os pares dentro da nuvem: dois pontos por par, lado a lado ao longo da nuvem
        ctx.fillStyle = claro ? (it.par ? '#2e1065' : '#083344') : (d.contraste ? '#ffffff' : '#ecfeff');
        var np = it.pares, passo = Math.min(semi * 0.55, 7), rp = Math.max(1.6, Math.min(mn * 0.14, 2.6)), afast = Math.max(2.2, Math.min(mn * 0.3, 4.5));
        for (var q = 0; q < np; q++) {
          var x0 = (q - (np - 1) / 2) * passo;
          [-1, 1].forEach(function (sg) { ctx.beginPath(); ctx.arc(x0, sg * afast, rp, 0, Math.PI * 2); ctx.fill(); });
        }
        ctx.restore();
        return;
      }
      var a = it.a, r = raioDe(a);
      if (!compacto && d.centro === a.id) {
        ctx.beginPath(); ctx.arc(a.sx, a.sy, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(claro ? '#b45309' : '#fbbf24', 0.9); ctx.lineWidth = 2; ctx.stroke();
      }
      esfera(ctx, a.sx, a.sy, r, corDe(a.el), a.el, claro || d.contraste);
    });

    // ângulos em volta do centro escolhido (só esfera e bastão)
    var angulos = [], rotulos = [];
    if (!compacto && d.centro && byId[d.centro]) {
      var c = byId[d.centro];
      var viz = mol.ligacoes.filter(function (l) { return l.a === c.id || l.b === c.id; }).map(function (l) { return byId[l.a === c.id ? l.b : l.a]; });
      var ambar = claro ? '#b45309' : '#fbbf24', verde = claro ? '#065f46' : '#34d399', fundo = d.contraste ? '#000000' : claro ? '#f0f4f8' : '#080c14';
      var usados = [];
      for (var i = 0; i < viz.length; i++) for (var j = i + 1; j < viz.length; j++) {
        var A = viz[i], B = viz[j];
        var u = [A.x - c.x, A.y - c.y, A.z - c.z], v = [B.x - c.x, B.y - c.y, B.z - c.z];
        var graus = Math.acos(Math.max(-1, Math.min(1, (u[0]*v[0]+u[1]*v[1]+u[2]*v[2]) / (Math.hypot(u[0],u[1],u[2]) * Math.hypot(v[0],v[1],v[2]))))) * 180 / Math.PI;
        angulos.push(graus);
        var a1 = Math.atan2(A.sy - c.sy, A.sx - c.sx), a2 = Math.atan2(B.sy - c.sy, B.sx - c.sx);
        var dif = a2 - a1; while (dif > Math.PI) dif -= 2 * Math.PI; while (dif < -Math.PI) dif += 2 * Math.PI;
        var rArc = atomR * 1.55 + 4 + (i + j) * 1.5;
        ctx.beginPath(); ctx.arc(c.sx, c.sy, rArc, a1, a1 + dif, dif < 0);
        ctx.strokeStyle = rgba(ambar, 0.80); ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.stroke();
        var am = a1 + dif / 2, txt = (Math.round(graus * 10) / 10).toFixed(1).replace('.', ',') + '°';
        /* com a tensão ligada, o DESVIO do ideal da hibridização ao lado —
           é o que torna visível até uma mudança de 2° */
        var desvio = d.tensao && d.idealCentro ? graus - d.idealCentro : 0, txtD = '';
        if (Math.abs(desvio) >= 0.45) txtD = (desvio > 0 ? '+' : '−') + (Math.round(Math.abs(desvio) * 10) / 10).toFixed(1).replace('.', ',');
        ctx.font = 'bold 11px ' + FONTE_3D;
        var wPrin = ctx.measureText(txt).width;
        ctx.font = 'bold 10px ' + FONTE_3D;
        var wDes = txtD ? ctx.measureText(' ' + txtD).width : 0;
        ctx.font = 'bold 11px ' + FONTE_3D;
        var pw = wPrin + wDes + 10, ph = 17;
        var lx = c.sx + Math.cos(am) * (rArc + 16), ly = c.sy + Math.sin(am) * (rArc + 16);
        var bate = usados.some(function (q) { return Math.abs(q.x - lx) < (pw + q.w) / 2 && Math.abs(q.y - ly) < ph; });
        if (bate) continue;
        usados.push({ x: lx, y: ly, w: pw });
        rotulos.push(txt + (txtD ? ' ' + txtD : ''));
        ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = rgba(ambar, 0.30); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c.sx + Math.cos(am) * rArc, c.sy + Math.sin(am) * rArc); ctx.lineTo(lx, ly); ctx.stroke(); ctx.restore();
        ctx.fillStyle = rgba(fundo, 0.93); ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(lx - pw / 2, ly - ph / 2, pw, ph, 4); else ctx.rect(lx - pw / 2, ly - ph / 2, pw, ph);
        ctx.fill();
        ctx.strokeStyle = rgba(ambar, 0.70); ctx.lineWidth = 1; ctx.stroke();
        ctx.textBaseline = 'middle';
        if (!txtD) { ctx.fillStyle = verde; ctx.textAlign = 'center'; ctx.fillText(txt, lx, ly + 0.5); }
        else {
          // o ângulo à esquerda; o desvio ao lado, na cor do sentido (fecha: rosa-violeta; abre: ciano)
          var x0 = lx - pw / 2 + 5;
          ctx.textAlign = 'left'; ctx.fillStyle = verde; ctx.fillText(txt, x0, ly + 0.5);
          ctx.font = 'bold 10px ' + FONTE_3D;
          ctx.fillStyle = d.contraste ? '#ffffff' : desvio < 0 ? (claro ? '#a21caf' : '#f0abfc') : (claro ? '#0e7490' : '#67e8f9');
          ctx.fillText(' ' + txtD, x0 + wPrin, ly + 0.5);
        }
      }
    }
    return {
      proj: proj.map(function (a) { return { id: a.id, el: a.el, h: a.h, sx: a.sx, sy: a.sy, depth: a.depth, r: raioDe(a), x: a.x, y: a.y, z: a.z }; }),
      angulos: angulos,
      rotulos: rotulos,        // o texto de cada rótulo de ângulo desenhado (com o desvio, se houver)
      nuvens: cen && d.nuvens ? d.nuvens.length : 0,   // nuvens desenhadas no átomo escolhido
      k: k,                 // Å → unidade da câmera (para levar o alvo a um átomo)
      escala: baseScale     // px por unidade com zoom 1 (para o pan andar junto com o dedo)
    };
  };

  /* HUD no rodapé, à esquerda, em monoespaçada — como no SILQ. Três
     linhas: o que se vê, como se mexe, e a legenda das cunhas. Com cor
     de texto cheia (o SILQ usa texto a 42–60% de opacidade, abaixo de
     4,5:1). Fica acima da dica fixa da app, que mora no canto de baixo. */
  R.hud3D = function (ctx, linhas, W, H, cor) {
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // com mais de três linhas, começa mais alto: a última fica sempre a 54 px da borda
    var y0 = H - 84 - Math.max(0, linhas.length - 3) * 15;
    linhas.forEach(function (t, i) {
      ctx.font = (i === 0 ? '11px ' : '10px ') + MONO;
      ctx.fillStyle = cor; ctx.fillText(t, 12, y0 + i * 15);
    });
  };

})(typeof window !== 'undefined' ? window : globalThis);
