/* ================================================================
   NÚCLEO COMPARTILHADO — canvas-escala.js
   ================================================================
   Extraído do bloco "ESCALA DO CANVAS", IDÊNTICO nos seis
   simuladores da família (única diferença real entre eles era o
   simulador de Cinética ter, dentro desta seção, a função
   fmtCientifico — que foi movida para utilitarios.js por ser
   genérica, não específica de canvas).

   O QUE FAZ
   · canvasFS(W) / kFont() / patchCtxFont(ctx) — reescala a fonte
     desenhada no <canvas> proporcionalmente à largura E à opção de
     "aumentar fonte" da Central de Acessibilidade (--font-scale).
   · layoutMode(W) / isEstreito(W) — convenção única de breakpoint
     (estreito < 620px, normal < 1000px, largo ≥ 1000px) usada por
     todos os simuladores da família para decidir empilhar ou não.
   · propW(W, frac, min, max) — medida proporcional com piso
     obrigatório e teto opcional, para o canvas crescer com a tela.
   · lerp / easeIO / isReduced() — interpolação e checagem de
     "reduzir movimento" (acessibilidade).
   · cssVar(nome, fallback) — lê uma variável de cor definida no CSS
     do simulador (fonte única de verdade das cores).
   · getContrastColor(hex) — escolhe texto preto ou branco sobre uma
     cor de fundo pelo contraste real WCAG 2.1 (não pela luminância
     YIQ ingênua, que dava contraste insuficiente em alguns casos).

   ORDEM DE CARGA: depois de utilitarios.js, antes de kit-desenho.js.
   ================================================================ */
'use strict';

SITQ.CANVAS_FS = 1;
/** Fator tipografico: 1,0 na largura de referencia (900 px), sobe em telas
 *  largas e desce um pouco em telas estreitas. Multiplica pela variavel
 *  --font-scale da Central de Simuladores, para que aumentar a fonte no menu
 *  de acessibilidade aumente TAMBEM o texto do canvas (antes nao aumentava). */
SITQ.canvasFS = function canvasFS(W) {
  let a11y = 1;
  try {
    const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-scale'));
    if (isFinite(v) && v > 0) a11y = v;
  } catch (e) {/* getComputedStyle indisponivel: mantem 1 */}
  const base = Math.min(1.45, Math.max(0.92, W / 900));
  return base * a11y;
};
/** Reescala a primeira medida em px de uma string de fonte CSS.
 *  '700 11px Consolas' → '700 15.9px Consolas' quando CANVAS_FS = 1,45. */
SITQ.kFont = function kFont(spec) {
  if (typeof spec !== 'string' || SITQ.CANVAS_FS === 1) return spec;
  return spec.replace(/(\d+(?:\.\d+)?)px/, (m, n) => Math.round(parseFloat(n) * SITQ.CANVAS_FS * 10) / 10 + 'px');
};
/** Intercepta ctx.font uma unica vez por contexto. Se o navegador nao
 *  expuser o acessor no prototipo (caso improvavel), nao faz nada — o
 *  desenho continua funcionando, so sem a escala tipografica. */
SITQ.patchCtxFont = function patchCtxFont(ctx) {
  if (!ctx || ctx._fontPatched) return;
  try {
    const proto = Object.getPrototypeOf(ctx);
    const desc = Object.getOwnPropertyDescriptor(proto, 'font');
    if (!desc || !desc.get || !desc.set) return;
    Object.defineProperty(ctx, 'font', {
      get() {
        return desc.get.call(ctx);
      },
      set(v) {
        desc.set.call(ctx, SITQ.kFont(v));
      },
      configurable: true
    });
    ctx._fontPatched = true;
  } catch (e) {/* ambiente sem acessor de fonte: segue sem escala */}
};
/** Faixa de layout do canvas. Convencao unica da familia — nasceu no SISOL
 *  (que ja usava `estreito = W < 620`) e agora vale para os sete:
 *    estreito → celular em retrato / gaveta aberta: empilhar na vertical
 *    normal   → tablet / metade de monitor: layout padrao
 *    largo    → monitor: pode espalhar e crescer */
SITQ.layoutMode = function layoutMode(W) {
  return W < 620 ? 'estreito' : W < 1000 ? 'normal' : 'largo';
};
SITQ.isEstreito = W => W < 620;
/** Medida proporcional com PISO obrigatorio e teto OPCIONAL.
 *  Substitui o padrao `Math.min(W * f, TETO)`, que travava o desenho num
 *  numero fixo de pixels e deixava o canvas grande com sobra vazia.
 *  propW(W, .3, 120)      → cresce sem teto, nunca abaixo de 120
 *  propW(W, .3, 120, 400) → cresce ate 400 (use so quando houver motivo) */
SITQ.propW = function propW(W, frac, min_, max_) {
  const v = W * frac;
  return max_ == null ? Math.max(min_, v) : Math.min(max_, Math.max(min_, v));
};
SITQ.lerp = (a, b, t) => a + (b - a) * t;
SITQ.easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
SITQ.isReduced = () => document.body.classList.contains('reduce-motion');
/** Lê uma variável de cor do CSS (fonte única de cores do simulador). */
SITQ.cssVar = function cssVar(name, fallback = '#fb923c') {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
};
/** Contraste preto/branco por luminância YIQ — réplica do SIMA/SILQ. */
SITQ.getContrastColor = function getContrastColor(hex) {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#111827';
  const r = parseInt(c.substr(0, 2), 16),
    g = parseInt(c.substr(2, 2), 16),
    b = parseInt(c.substr(4, 2), 16);
  /* Escolhe entre texto escuro e claro pelo CONTRASTE REAL (WCAG 2.1).
     Antes: (r*299 + g*587 + b*114)/1000 >= 145 ? escuro : claro
     O limiar 145 do YIQ nao corresponde ao contraste percebido. Medido no
     Chromium, escolhia BRANCO para cores de meio-tom e o resultado ficava
     abaixo do minimo — ex.: teal #14b8a6 + branco = 2.49:1, quando com
     texto escuro daria 7.13:1.
     Agora calcula as duas razoes e devolve a melhor. Nao garante 4.5:1
     para toda cor (algumas nao alcancam com preto nem com branco), mas
     eleva todos os casos e nunca piora nenhum. */
  var _canal = function (v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  var _lum = function (c) {
    return 0.2126 * _canal(c[0]) + 0.7152 * _canal(c[1]) + 0.0722 * _canal(c[2]);
  };
  var _razao = function (a, b) {
    var L1 = _lum(a),
      L2 = _lum(b);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };
  return _razao([r, g, b], [17, 24, 39]) >= _razao([r, g, b], [255, 255, 255]) ? '#111827' : '#ffffff';
};