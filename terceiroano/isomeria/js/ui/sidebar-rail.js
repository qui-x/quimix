/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE  ·  js/ui/sidebar-rail.js
   ───────────────────────────────────────────────────────────────
   TRILHO RECOLHÍVEL DAS SIDEBARS — versão única para as três séries.

   Recolhida, a sidebar sai do fluxo e vira um trilho de 56px só com
   os ícones dos seus painéis. Clicar num ícone traz aquele card de
   volta FLUTUANDO por cima do canvas — e, se o card for de um modo,
   ativa o modo junto.

   POR QUE FLUTUANTE, E NÃO REABRIR A SIDEBAR
   Reabrir no fluxo encolheria o canvas, disparando o recálculo de
   tamanho. Em parte dos simuladores isso RECOMEÇA a simulação (no
   SIMA o _resize() termina em sim.rebuild()). Flutuando, a sidebar é
   position:absolute e não ocupa espaço de flex: o canvas não muda de
   tamanho, nada é remedido, nada é reconstruído. Consultar um painel
   com a simulação rodando fica gratuito.

   O QUE VARIA ENTRE AS FAMÍLIAS, E COMO É ABSORVIDO
   1. Onde moram os cards de modo
        1º ano  → filhos diretos de #sidebar-left
        2º/3º   → dentro de <div id="model-list">
      Resolvido varrendo QUALQUER .panel descendente da sidebar e
      escondendo os irmãos nível a nível até a raiz (marcaCaminho).
   2. Como se ativa um modo
        1º ano  → <button data-model="bohr">
        2º/3º   → <button class="mode-activate-btn"> com listener de
                  fechamento, sem atributo que diga o modo
      Resolvido usando o denominador comum: o botão .mode-activate-btn
      e o aria-pressed que as duas famílias já mantêm. Nunca clicamos
      num botão já pressionado — os dois lados tratam o clique no modo
      ativo como DESATIVAR, e o ícone do trilho não pode desligar nada.
   3. Como o canvas descobre que mudou de tamanho
        2º/3º   → ResizeObserver no .canvas-wrap (pega sozinho)
        1º ano  → só window.resize
      Resolvido disparando um window.resize sintético ao fim da
      transição de recolher/expandir. Para quem tem ResizeObserver é
      redundante e inofensivo; para quem não tem, é o que faz funcionar.
      Nenhuma referência à instância da app é necessária — o que
      importa, porque no 2º ano ela nem é guardada em lugar nenhum
      (`new SICQ.App(...)` e pronto).

   CONFIGURAÇÃO
   Lê window.RAIL_CFG, escrito no HTML logo antes deste arquivo:
     { id: 'cinetica', bp: 1100 }
   `id`  prefixa a chave de localStorage que guarda a escolha.
   `bp`  é o breakpoint mobile daquele CSS: abaixo (e em) `bp` este
         módulo sai de cena e o layout mobile da casa assume inteiro.

   O QUE ELE NÃO FAZ
   · Não toca no mobile. Todo o CSS mora em @media (min-width: bp+1px)
     e o script sai pela porta dos fundos em telas estreitas.
   · Não move nenhum nó do DOM. Quem muda de posição é a sidebar toda,
     por CSS; os painéis ficam onde estavam e todos os listeners
     ligados na inicialização continuam válidos.
   · Não duplica ícone: cada botão clona o .panel-icon do cabeçalho.
═══════════════════════════════════════════════════════════════ */

'use strict';

(function () {
  var CFG = window.RAIL_CFG || {};
  var SIM_ID = CFG.id || 'sim';
  var BP = CFG.bp || 1100; // largura em que o layout mobile assume
  /* `mq` (opcional): a regra do celular como consulta de mídia, quando ela não é só uma largura — no SIQC,
     até 900 px ou deitado até 1100 × 500 px. Com ela, o trilho segue exatamente o que o CSS faz. */
  var MQ = CFG.mq || null;

  /* Botão que ATIVA o modo dono do card. Cada família nomeou o seu:
       1º ano SIMA/SIME ....... .mode-activate-btn  (+ data-model /
                                 data-modulo-ativar)
       1º ano SILQ/SIFI ....... .bond-mode-btn      (data-bond-type /
                                 data-module)
       2º/3º ano .............. .mode-activate-btn  (criado em
                                 _buildModes(), sem atributo de modo)
     O que TODAS têm em comum é o aria-pressed, que é o que o trilho
     usa para saber se já está ativo e para espelhar o ícone. Lista
     explícita de propósito: pegar "qualquer botão com aria-pressed"
     acertaria alvos errados (toggles de exibição, por exemplo). */
  var SEL_ATIVAR = '.mode-activate-btn, .bond-mode-btn, [data-model]';

  /* ═══ A OCLUSÃO — o que o card flutuante cobre da cena ═════════════
     O card flutua por cima do canvas SEM mudar o tamanho dele (ver o topo
     deste arquivo). Então a cena precisa saber que faixa ficou coberta
     para desenhar só no que se vê. Isto é publicado de três jeitos:

       1. window.Oclusao.area(el) → { x, y, w, h, esq, dir, W, H }: a área
          LIVRE do elemento el (px CSS, nas coordenadas de el), já ANIMADA —
          desliza ~280 ms quando o card abre, troca ou fecha. Quem redesenha
          a cada quadro só lê isto e desenha dentro de { x, w }.
       2. o evento 'oclusao' em window, a cada quadro do deslizamento e uma
          vez no fim (detail: { esq, dir, fim }, em px, relativo à área da
          cena) — para quem só redesenha quando algo muda.
       3. as variáveis CSS --oc-esq e --oc-dir no <html> (o valor FINAL, em
          px) — rótulos e botões HTML sobre o canvas se reposicionam com elas
          e uma transition do próprio CSS.

     POR QUE UMA FAIXA DE ALTO A BAIXO (e não só o retângulo do card)
     O card cresce e encolhe conforme o conteúdo (uma lista de setas, uma
     busca). Se a cena desviasse só do retângulo, ela mudaria de lugar a cada
     linha acrescentada. Uma faixa vertical inteira é previsível: o card abre,
     a cena desliza para o lado livre e fica parada até o card fechar.

     A borda do card é lida pela geometria de LAYOUT (offsetLeft/offsetWidth),
     não por getBoundingClientRect: o card entra com um translateX de 10px
     animado, e a medida do retângulo pegaria a posição no meio da entrada. */
  var Oclusao = window.Oclusao = (function () {
    var FOLGA = 14;                                  // px entre a cena e a borda do card
    var MIN_LIVRE = 0.42;                            // a cena nunca fica com menos que isto da largura
    var lados = {};
    var rodando = false, ultimoCss = '';
    function dur() { return document.body && document.body.classList.contains('reduce-motion') ? 0 : 280; }
    function suave(t) { return t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t); }
    function tw(v) { return { de: v, alvo: v, t0: 0 }; }
    function val(t, agora) { var d = dur(); return d ? t.de + (t.alvo - t.de) * suave((agora - t.t0) / d) : t.alvo; }
    function mirar(t, alvo, agora) { t.de = val(t, agora); t.alvo = alvo; t.t0 = agora; }
    function estado(lado) { return lados[lado] || (lados[lado] = { f: tw(0), x: tw(0), sb: null }); }
    function borda(lado, sb) {
      var pai = sb.offsetParent || sb.parentNode; if (!pai || !pai.getBoundingClientRect) return null;
      var x0 = pai.getBoundingClientRect().left + (pai.clientLeft || 0);
      return lado === 'left' ? x0 + sb.offsetLeft + sb.offsetWidth : x0 + sb.offsetLeft;
    }
    /* a área da cena: o embrulho do canvas, ou o que cada família chama assim */
    function hospedeiro() {
      var cv = document.getElementById('sim-canvas');
      return document.querySelector('.canvas-wrap') || document.getElementById('sim-area') ||
             document.getElementById('main-content') || (cv && cv.parentElement) || document.querySelector('main');
    }
    function intrusao(el, agora, final) {
      var r = el.getBoundingClientRect(), o = { esq: 0, dir: 0 };
      ['left', 'right'].forEach(function (l) {
        var s = lados[l]; if (!s) return;
        var f = final ? s.f.alvo : val(s.f, agora); if (f <= 0.001) return;
        var x = final ? s.x.alvo : val(s.x, agora);
        if (l === 'left') o.esq = f * Math.max(0, Math.min(r.width, x + FOLGA - r.left));
        else o.dir = f * Math.max(0, Math.min(r.width, r.right - (x - FOLGA)));
      });
      var limite = r.width * (1 - MIN_LIVRE), soma = o.esq + o.dir;   // tela estreita: as duas faixas cedem juntas
      if (soma > limite && soma > 0) { o.esq *= limite / soma; o.dir *= limite / soma; }
      o.W = r.width; o.H = r.height;
      return o;
    }
    function area(el) {
      el = el || hospedeiro(); if (!el) return { x: 0, y: 0, w: 0, h: 0, esq: 0, dir: 0, W: 0, H: 0 };
      var o = intrusao(el, performance.now(), false);
      return { x: o.esq, y: 0, w: Math.max(1, o.W - o.esq - o.dir), h: o.H, esq: o.esq, dir: o.dir, W: o.W, H: o.H };
    }
    function animando(agora) {
      var d = dur();
      return Object.keys(lados).some(function (l) { var s = lados[l]; return d && (agora - s.f.t0 < d || agora - s.x.t0 < d); });
    }
    function publicarCss() {
      var h = hospedeiro(); if (!h) return;
      var o = intrusao(h, 0, true), css = Math.round(o.esq) + '|' + Math.round(o.dir);
      if (css === ultimoCss) return; ultimoCss = css;
      document.documentElement.style.setProperty('--oc-esq', Math.round(o.esq) + 'px');
      document.documentElement.style.setProperty('--oc-dir', Math.round(o.dir) + 'px');
    }
    function avisar() {
      var h = hospedeiro(), agora = performance.now(), mexendo = animando(agora);
      if (h) {
        var o = intrusao(h, agora, false);
        window.dispatchEvent(new CustomEvent('oclusao', { detail: { esq: o.esq, dir: o.dir, fim: !mexendo } }));
      }
      if (mexendo) window.requestAnimationFrame(avisar); else rodando = false;
    }
    function mudou() {
      publicarCss();
      if (!rodando) { rodando = true; window.requestAnimationFrame(avisar); }
    }
    /* O DEDO NA CENA. O card da esquerda fecha quando o aluno toca no
       canvas (fechaNoCanvas). Se a cena deslizasse nesse instante, o que
       ele começou a arrastar — um átomo, a ponta de uma seta, um íon —
       fugiria de baixo do dedo. Então, enquanto esse ponteiro estiver
       apertado, a cena fica onde está (o card some, a faixa espera); ao
       soltar, ela desliza para a largura toda. */
    var segurando = false, fechaPendente = {};
    function soltar() {
      if (!segurando) return;
      segurando = false;
      window.removeEventListener('pointerup', soltar, true);
      window.removeEventListener('pointercancel', soltar, true);
      window.removeEventListener('blur', soltar);
      var agora = performance.now(), algum = false;
      Object.keys(fechaPendente).forEach(function (l) {
        var s = lados[l]; delete fechaPendente[l];
        if (s && !s.sb) { mirar(s.f, 0, agora); algum = true; }
      });
      if (algum) mudou();
    }
    return {
      area: area,
      /* a faixa coberta AGORA (animada) e a FINAL — para quem quer decidir sem desenhar */
      intrusao: function (el) { return intrusao(el || hospedeiro(), performance.now(), false); },
      final: function (el) { return intrusao(el || hospedeiro(), 0, true); },
      abrir: function (lado, sb) {
        var s = estado(lado), agora = performance.now(), x = borda(lado, sb); if (x == null) return;
        delete fechaPendente[lado];
        if (val(s.f, agora) > 0.001) mirar(s.x, x, agora); else s.x = tw(x);   // trocando de card: a borda desliza
        mirar(s.f, 1, agora); s.sb = sb; mudou();
      },
      fechar: function (lado) {
        var s = lados[lado]; if (!s || !s.sb) return;
        s.sb = null;
        if (segurando) { fechaPendente[lado] = true; return; }   // desliza quando o ponteiro soltar (ver segurar)
        mirar(s.f, 0, performance.now()); mudou();
      },
      /* segura a cena parada até o ponteiro apertado agora ser solto */
      segurar: function () {
        if (segurando) return;
        segurando = true;
        window.addEventListener('pointerup', soltar, true);
        window.addEventListener('pointercancel', soltar, true);
        window.addEventListener('blur', soltar);
      },
      remedir: function () {
        var agora = performance.now();
        Object.keys(lados).forEach(function (l) {
          var s = lados[l]; if (!s.sb) return; var x = borda(l, s.sb);
          if (x != null && Math.abs(x - s.x.alvo) > 0.5) mirar(s.x, x, agora);
        });
        ultimoCss = ''; mudou();
      }
    };
  })();

  function initSidebarRail() {
    var config = [
      { lado: 'left',  sidebar: document.getElementById('sidebar-left'),
        rotulo: 'menus e modos',     fechaNoCanvas: true  },
      { lado: 'right', sidebar: document.getElementById('sidebar-right'),
        rotulo: 'controles e dados', fechaNoCanvas: false }
    ].filter(function (c) { return c.sidebar; });
    if (!config.length) return;

    var abertoAgora = null;
    var abrindo = null;   // card no meio da abertura: o tour da ativação o reabre depois
    var suspenso = null;  // estado guardado enquanto um tour roda

    /* ── helpers ───────────────────────────────────────────────── */

    function ehDesktop() { return MQ && window.matchMedia ? !window.matchMedia(MQ).matches : window.innerWidth > BP; }
    function chaveDe(lado) { return SIM_ID + '-rail-' + lado; }

    /* RECOLHIDA É O PADRÃO: sem nada salvo, as duas nascem como trilho
       e o canvas abre com quase toda a largura da janela. */
    function lerEstado(lado) {
      try {
        var v = localStorage.getItem(chaveDe(lado));
        return v === null ? true : v === 'recolhida';
      } catch (e) { return true; }
    }
    function salvarEstado(lado, recolhida) {
      try { localStorage.setItem(chaveDe(lado), recolhida ? 'recolhida' : 'aberta'); }
      catch (e) { /* sem persistência, funciona só na sessão */ }
    }

    /* Publica o estado no <body> como classe: rail-recolhida-left /
       rail-recolhida-right. O trilho em si não precisa disso — serve de
       GANCHO para layouts que não são linha flex. O caso concreto é o
       SIE: sidebars e moldura do canvas são camadas position:fixed que
       derivam das mesmas variáveis (--sidebar-w), então recolher a
       sidebar não libera espaço sozinho; o CSS dele lê esta classe e
       encolhe a variável. Qualquer layout futuro fora do padrão se
       adapta pelo mesmo gancho, sem tocar neste arquivo. */
    function publicarEstado(cfg, recolhida) {
      document.body.classList.toggle('rail-recolhida-' + cfg.lado, !!recolhida);
    }

    function espera() {
      return document.body.classList.contains('reduce-motion') ? 0 : 200;
    }

    /* Avisa o simulador que a largura útil mudou. window.resize serve
       às duas famílias: quem tem ResizeObserver já reagiu antes e
       ignora; quem não tem depende disto. */
    function remedirCanvas() {
      window.dispatchEvent(new Event('resize'));
    }

    function anunciar(texto) {
      if (typeof window.announce === 'function') { window.announce(texto); return; }
      var vivo = document.getElementById('sr-live');
      if (vivo) vivo.textContent = texto;
    }

    /* Todos os .panel da sidebar que tenham cabeçalho, em qualquer
       profundidade — cobre tanto o 1º ano (filhos diretos) quanto o
       2º/3º (dentro de #model-list). */
    function paineisDe(sidebar) {
      return Array.prototype.filter.call(
        sidebar.querySelectorAll('.panel'),
        function (p) { return !!p.querySelector('.panel-header'); }
      );
    }

    /* ── cores: o trilho VESTE a cor da sua sidebar ───────────────
       O trilho é a sidebar recolhida — tem de ter a cor dela. A primeira
       versão lia tokens por nome (var(--bg-panel, #0c1520)), e isso só
       funciona na família que usa esses nomes. O SIME chama o fundo de
       --bg1, outros têm dialetos próprios: no tema claro --bg-panel não
       existia, o trilho caía no reserva ESCURO e aparecia como uma faixa
       preta ao lado de uma sidebar clara. Medido: 15,2:1 de diferença
       entre trilho e sidebar em cinco simuladores do 1º ano.
       Em vez de adivinhar nomes, o trilho lê do navegador as cores que
       a sidebar de fato tem — fundo, texto, borda, acento — e as aplica
       em si mesmo. Funciona com qualquer dialeto de token, e acompanha a
       troca de tema porque é refeito a cada mudança (ver o observador no
       fim do arquivo). */
    function rgbDe(txt) {
      var m = /rgba?\(([^)]+)\)/.exec(txt || '');
      if (!m) return null;
      var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    function lumi(c) {
      var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }
    function razao(a, b) {
      var x = lumi(a), y = lumi(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    }
    function mistura(a, b, t) {
      return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t, a: 1 };
    }
    function emCss(c) {
      return 'rgb(' + Math.round(c.r) + ', ' + Math.round(c.g) + ', ' + Math.round(c.b) + ')';
    }
    function fundoOpaco(el) {
      for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
        var c = rgbDe(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0.5) return c;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    }
    var PRETO = { r: 0, g: 0, b: 0, a: 1 }, BRANCO = { r: 255, g: 255, b: 255, a: 1 };

    function vestirTrilho(cfg) {
      var sb = cfg.sidebar, cs = getComputedStyle(sb);
      var bg = fundoOpaco(sb);
      var fg = rgbDe(cs.color) || PRETO;
      /* A cor de texto da sidebar nem sempre é legível sobre o fundo dela
         (há temas que deixam o texto para os filhos). Se não passar 4,5:1,
         fica com preto ou branco, o que contrastar mais. */
      if (razao(fg, bg) < 4.5) fg = razao(PRETO, bg) >= razao(BRANCO, bg) ? PRETO : BRANCO;
      /* ícone em repouso: um pouco mais apagado que o texto, mas nunca
         abaixo de 4,5:1 — é o único jeito de o aluno saber o que há ali */
      var suave = fg;
      for (var t = 0.30; t > 0; t -= 0.05) {
        var c = mistura(fg, bg, t);
        if (razao(c, bg) >= 4.5) { suave = c; break; }
      }
      var larg = parseFloat(cs[cfg.lado === 'left' ? 'borderRightWidth' : 'borderLeftWidth']) || 0;
      var borda = larg > 0 ? rgbDe(cs[cfg.lado === 'left' ? 'borderRightColor' : 'borderLeftColor']) : null;
      if (!borda || borda.a < 0.3) borda = mistura(bg, fg, 0.22);
      /* acento = a cor que a própria sidebar usa para destacar (o ícone do
         cabeçalho do painel, ou o título do simulador), desde que se
         destaque do fundo (3:1, o mínimo para componente de interface) */
      var acento = null;
      var cand = [sb.querySelector('.panel-header[aria-expanded="true"] .panel-icon'),
                  sb.querySelector('.panel-icon'),
                  document.querySelector('.header-brand h1, .app-header h1')];
      for (var i = 0; i < cand.length && !acento; i++) {
        var ca = cand[i] ? rgbDe(getComputedStyle(cand[i]).color) : null;
        if (ca && razao(ca, bg) >= 3 && razao(ca, fg) > 1.15) acento = ca;
      }
      if (!acento) acento = fg;
      var vars = {
        '--rail-bg': emCss(bg), '--rail-fg': emCss(fg), '--rail-fg-suave': emCss(suave),
        '--rail-borda': emCss(borda), '--rail-acento': emCss(acento),
        '--rail-hover': emCss(mistura(bg, fg, 0.10))
      };
      [cfg.trilho, cfg.sidebar].forEach(function (alvo) {
        if (!alvo) return;
        Object.keys(vars).forEach(function (k) { alvo.style.setProperty(k, vars[k]); });
      });
    }

    /* ── montagem do trilho ────────────────────────────────────── */

    var CHEVRON_ESQ = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>';
    var CHEVRON_DIR = '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>';

    /* Copia o desenho do .panel-icon do cabeçalho para o botão do
       trilho — sem criar um segundo catálogo de SVG para manter em dia.
       DUAS ARMADILHAS:
       1. Nem todo simulador tem ícone: o sifi usa
          <span class="panel-icon" data-icon="modulo1"></span>, um
          marcador VAZIO que o próprio app preenche depois. Quando o
          trilho monta, ele pode ainda estar em branco.
       2. Um ícone que chega depois precisa aparecer no trilho.
       Daí a inicial do nome como reserva (um trilho de quadrados vazios
       é pior que um de letras) e o re-preenchimento por observador
       logo abaixo, que troca a letra pelo desenho assim que ele existe. */
    function preencherIcone(b) {
      var span = b.querySelector('.rail-ico');
      if (!span) return;
      var conteudo = b._icone ? b._icone.innerHTML.trim() : '';
      if (conteudo) {
        if (span.innerHTML.trim() !== conteudo) span.innerHTML = conteudo;
        span.classList.remove('rail-ico--letra');
      } else if (!span.classList.contains('rail-ico--letra')) {
        span.textContent = b._inicial || '?';
        span.classList.add('rail-ico--letra');
      }
    }

    function criarTrilho(cfg) {
      var trilho = document.createElement('div');
      trilho.className = 'rail rail--' + cfg.lado;
      trilho.id = 'rail-' + cfg.lado;
      trilho.setAttribute('role', 'toolbar');
      trilho.setAttribute('aria-orientation', 'vertical');
      trilho.setAttribute('aria-label', 'Atalhos — ' + cfg.rotulo);
      trilho.hidden = true;

      var fixar = document.createElement('button');
      fixar.type = 'button';
      fixar.className = 'rail-btn rail-btn--expand';
      fixar.innerHTML = (cfg.lado === 'left' ? CHEVRON_DIR : CHEVRON_ESQ) +
        '<span class="rail-tip">Fixar painel de ' + cfg.rotulo + '</span>';
      fixar.setAttribute('aria-label', 'Fixar painel de ' + cfg.rotulo);
      fixar.addEventListener('click', function () { recolher(cfg, false); });
      trilho.appendChild(fixar);

      var sep = document.createElement('div');
      sep.className = 'rail-sep';
      sep.setAttribute('aria-hidden', 'true');
      trilho.appendChild(sep);

      paineisDe(cfg.sidebar).forEach(function (painel, i) {
        var cab = painel.querySelector('.panel-header');
        var icone = cab.querySelector('.panel-icon');
        var rotulo = cab.querySelector('.panel-label');
        var etiqueta = cab.querySelector('.panel-badge');
        var nome = rotulo ? rotulo.textContent.trim() : 'Painel ' + (i + 1);

        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'rail-btn';
        b.setAttribute('aria-label', nome);
        b.setAttribute('aria-expanded', 'false');

        var span = document.createElement('span');
        span.className = 'rail-ico';
        span.setAttribute('aria-hidden', 'true');
        b.appendChild(span);
        b._icone = icone;   // nó vivo do cabeçalho, para re-sincronizar
        b._inicial = nome.charAt(0).toUpperCase();
        preencherIcone(b);

        var tip = document.createElement('span');
        tip.className = 'rail-tip';
        tip.textContent = etiqueta ? nome + ' · ' + etiqueta.textContent.trim() : nome;
        b.appendChild(tip);

        b._painel = painel; // casa botão↔painel por REFERÊNCIA: metade
                            // dos painéis não tem atributo id
        b.addEventListener('click', function () { alternarFlutuante(cfg, painel, b); });
        trilho.appendChild(b);
      });
      return trilho;
    }

    /* ── recolher / fixar: muda a largura do canvas ─────────────── */

    function recolher(cfg, deveRecolher) {
      if (!ehDesktop()) return;
      fecharFlutuante();
      limparSolo(cfg);
      cfg.sidebar.classList.toggle('is-collapsed', deveRecolher);
      cfg.trilho.hidden = !deveRecolher;
      publicarEstado(cfg, deveRecolher);
      if (cfg.botaoRecolher) {
        cfg.botaoRecolher.setAttribute('aria-expanded', String(!deveRecolher));
        cfg.botaoRecolher.setAttribute('aria-label',
          (deveRecolher ? 'Fixar' : 'Recolher') + ' painel de ' + cfg.rotulo);
      }
      salvarEstado(cfg.lado, deveRecolher);
      anunciar('Painel de ' + cfg.rotulo + (deveRecolher ? ' recolhido.' : ' fixado.'));
      window.setTimeout(remedirCanvas, espera());
    }

    /* ── flutuante: NÃO muda a largura do canvas ────────────────── */

    /* Gerações POR SIDEBAR. A limpeza do formato compacto é adiada até
       o fim do fade (ver comentário em fecharFlutuante); sem um
       carimbo por sidebar, abrir um card na direita cancelaria a
       limpeza pendente da esquerda, que ficaria compacta para sempre. */

    function fecharFlutuante() {
      if (!abertoAgora) return;
      var cfg = abertoAgora.cfg;
      cfg.sidebar.classList.remove('is-floating');
      Oclusao.fechar(cfg.lado);              // a cena volta a usar a largura toda

      /* NÃO limpar o compacto agora. Tirar .is-floating apenas INICIA o
         fade; a sidebar segue visível por ~180ms. Se o compacto saísse
         no primeiro quadro, todos os cards voltariam e a sidebar
         esticaria de topo a base ainda à vista — era a sidebar inteira
         piscando ao fechar. O .has-solo sai quando já está invisível. */
      var g = cfg.geracao = (cfg.geracao || 0) + 1;
      window.setTimeout(function () {
        if (g === cfg.geracao) limparSolo(cfg);
      }, espera());

      Array.prototype.forEach.call(
        cfg.trilho.querySelectorAll('.rail-btn[aria-expanded]'),
        function (b) { b.setAttribute('aria-expanded', 'false'); });
      abertoAgora = null;
      document.removeEventListener('keydown', aoTeclar, true);
    }

    function aoTeclar(e) {
      if (e.key !== 'Escape' || !abertoAgora) return;
      var alvo = abertoAgora.botao;
      fecharFlutuante();
      if (alvo) alvo.focus();
    }

    /* O ÍCONE DE UM MÓDULO, NO TRILHO DA ESQUERDA, ATIVA O MÓDULO (regra
       do projeto: ativar um módulo na esquerda desativa e limpa o anterior).
       Delega o clique para o botão Ativar que já existe no card — mesmo
       caminho da barra de modos do celular, com som, painéis e desenho.
       Guardas: (1) o ícone do módulo JÁ ativo não o desliga, só abre o
       card; (2) só a ESQUERDA ativa — abrir cards na direita nunca ativa
       nem desativa módulos. */
    function ativarSeForModo(cfg, painel) {
      if (cfg.lado !== 'left') return false;
      var btn = painel.querySelector(SEL_ATIVAR);
      if (!btn || btn.getAttribute('aria-pressed') === 'true') return false;
      btn.click();
      return true;
    }

    /* Esconde os irmãos do painel nível a nível, subindo até a sidebar.
       É o que permite funcionar tanto com o card solto na sidebar (1º
       ano) quanto embrulhado em #model-list (2º/3º) sem saber de qual
       família se trata. */
    function mostrarSozinho(cfg, painel) {
      cfg.geracao = (cfg.geracao || 0) + 1; // invalida limpeza pendente
      limparSolo(cfg);
      var no = painel;
      while (no && no !== cfg.sidebar && no.parentNode) {
        Array.prototype.forEach.call(no.parentNode.children, function (irmao) {
          if (irmao !== no) irmao.classList.add('rail-oculto');
        });
        no = no.parentNode;
      }
      painel.classList.add('is-solo');
      /* a marca do compacto vive na SIDEBAR, não em .is-floating: é o
         que faz o formato sobreviver aos 180ms de fade ao fechar */
      cfg.sidebar.classList.add('has-solo');
      abrirCard(painel);
      abrirCompanheiro(cfg, painel);
    }

    /* CARD COM COMPANHEIRO (opcional): data-rail-junto="<id>" no painel faz
       o painel <id> flutuar junto, logo abaixo, no mesmo card. Caso de uso:
       no SIQC, o aluno responde em Classificar e lê a explicação nos
       Resultados — um card por vez o faria trocar de card a cada resposta.
       Só vale se o companheiro está na mesma sidebar e à vista (não
       [hidden]). Sem o atributo, nada muda: um card por vez. */
    function abrirCompanheiro(cfg, painel) {
      var id = painel.getAttribute('data-rail-junto');
      var junto = id ? document.getElementById(id) : null;
      if (!junto || junto === painel || !cfg.sidebar.contains(junto) || junto.hasAttribute('hidden')) return;
      for (var no = junto; no && no !== cfg.sidebar; no = no.parentNode) no.classList.remove('rail-oculto');
      junto.classList.add('is-solo');
      abrirCard(junto);
    }

    /* Abre o card, seja qual for o dialeto de recolhimento do simulador.
       O projeto tem TRÊS, e card que o aluno pediu para ver não pode
       aparecer só com o cabeçalho:

         1. .panel-body.collapsed ........ SIMA, 2º e 3º ano
         2. aria-expanded no cabeçalho ... todos (é o que o leitor de
                                           tela anuncia)
         3. data-open="false" na seção ... sie, siem, sime, siqi —
            com [data-open="false"] .panel-body { max-height:0 }

       A primeira versão só conhecia 1 e 2: marcava aria-expanded="true"
       enquanto data-open seguia "false", e o CSS mantinha o corpo com
       altura zero. Medido em navegador: 12 cards abriam só o cabeçalho,
       com o leitor de tela anunciando "expandido".

       No dialeto 3 o estado vive NO ATRIBUTO — o próprio app relê
       sec.dataset.open a cada clique — então escrevê-lo aqui é coerente
       com o modelo deles: o próximo clique no cabeçalho alterna certo.
       E vai junto o .scroll-ready, que eles só acrescentam depois de
       abrir: sem ele o corpo continua overflow:hidden e um card mais
       longo que min(600px, 70vh) seria cortado sem barra de rolagem. */
    function abrirCard(painel) {
      var cab = painel.querySelector('.panel-header');
      var corpo = painel.querySelector('.panel-body');
      if (cab) cab.setAttribute('aria-expanded', 'true');
      if (corpo) corpo.classList.remove('collapsed');
      var comEstado = corpo ? corpo.closest('[data-open]') : null;
      if (!comEstado && painel.hasAttribute('data-open')) comEstado = painel;
      if (comEstado && painel.contains(comEstado)) {
        comEstado.setAttribute('data-open', 'true');
        if (corpo) corpo.classList.add('scroll-ready');
      }
    }

    function limparSolo(cfg) {
      cfg.sidebar.classList.remove('has-solo');
      Array.prototype.forEach.call(
        cfg.sidebar.querySelectorAll('.rail-oculto, .is-solo'),
        function (el) { el.classList.remove('rail-oculto', 'is-solo'); });
    }

    function alternarFlutuante(cfg, painel, botao) {
      /* Card flutuante só existe com a barra RECOLHIDA (é quando o trilho
         aparece). Com ela fixada, os botões do trilho ficam escondidos e o
         aluno não os alcança; um clique por programação punha um card
         "flutuando" sobre uma barra já aberta, estado que chegava a
         derrubar a página (medido no equilíbrio). */
      if (!cfg.sidebar.classList.contains('is-collapsed')) return;
      var jaAberto = abertoAgora && abertoAgora.cfg === cfg &&
                     abertoAgora.painel === painel;
      fecharFlutuante();
      if (jaAberto) return;

      /* Ordem: ATIVAR primeiro, mostrar o card depois — as famílias
         recolhem o card logo após ativar. Na PRIMEIRA ativação de cada
         módulo, o tour dele abre no mesmo clique e o trilho sai de cena;
         o card é reaberto quando o tour terminar (ver 'coachmark:fim'). */
      abrindo = { cfg: cfg, painel: painel, botao: botao };
      ativarSeForModo(cfg, painel);
      abrindo = null;
      if (suspenso) { suspenso.reabrir = { cfg: cfg, painel: painel, botao: botao }; return; }
      mostrarSozinho(cfg, painel);
      sincronizarAtivo();
      sincronizarVisiveis(); // ativar um modo muda quais painéis existem

      cfg.sidebar.classList.add('is-floating');
      Oclusao.abrir(cfg.lado, cfg.sidebar);  // a cena desliza para a parte que se vê
      botao.setAttribute('aria-expanded', 'true');
      abertoAgora = { cfg: cfg, painel: painel, botao: botao };

      if (painel.scrollIntoView) painel.scrollIntoView({ block: 'start', behavior: 'auto' });
      var cab = painel.querySelector('.panel-header');
      if (cab) cab.focus({ preventScroll: true });
      document.addEventListener('keydown', aoTeclar, true);
    }

    /* ── espelhos do estado do app ─────────────────────────────── */

    /* Com a sidebar recolhida por padrão, o trilho é o único indicador
       de "onde eu estou": sem esta marca, o aluno ativa um modo, fecha
       o card e não sobra nada na tela dizendo qual modo está rodando. */
    function sincronizarAtivo() {
      config.forEach(function (cfg) {
        Array.prototype.forEach.call(cfg.trilho.querySelectorAll('.rail-btn'),
          function (b) {
            if (!b._painel) return;
            var alvo = b._painel.querySelector(SEL_ATIVAR);
            b.classList.toggle('is-active',
              !!alvo && alvo.getAttribute('aria-pressed') === 'true');
          });
      });
    }

    /* Painéis que entram e saem conforme o estado do app precisam
       entrar e sair do trilho junto: no 2º/3º ano os .panel[data-owner]
       trocam a cada modo; no 1º ano a Tabela Periódica e os Dados do
       Elemento só existem com algum modelo ativo.
       Casa por REFERÊNCIA (b._painel) e não por id: vários desses
       painéis não têm atributo id — só o cabeçalho tem. Filtrar por
       .panel[id] foi exatamente o bug que sumiu com o ícone da Tabela
       Periódica e nunca o devolveu. */
    function sincronizarVisiveis() {
      config.forEach(function (cfg) {
        Array.prototype.forEach.call(cfg.trilho.querySelectorAll('.rail-btn'),
          function (b) {
            if (!b._painel) return;
            b.hidden = b._painel.hasAttribute('hidden');
          });
        if (abertoAgora && abertoAgora.cfg === cfg &&
            abertoAgora.painel.hasAttribute('hidden')) fecharFlutuante();
      });
    }

    /* ── montagem final ────────────────────────────────────────── */

    config.forEach(function (cfg) {
      cfg.trilho = criarTrilho(cfg);
      /* O trilho entra ao lado da PRÓPRIA sidebar, não dentro de um
         container fixo. Em silq e sifi o #main-content é o canvas em
         si (<main class="canvas-area">), e as sidebars são irmãs dele;
         no sie não existe #main-content nem .app-main. Ancorar no pai
         real da sidebar funciona nas três estruturas sem saber de qual
         se trata. O pai também vira a referência do flutuante
         absoluto — daí a classe .rail-host. */
      var hosp = cfg.sidebar.parentNode;
      hosp.classList.add('rail-host');
      if (cfg.lado === 'left') hosp.insertBefore(cfg.trilho, cfg.sidebar);
      else hosp.insertBefore(cfg.trilho, cfg.sidebar.nextSibling);

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rail-toggle';
      b.dataset.railToggle = cfg.lado;
      b.innerHTML = cfg.lado === 'left' ? CHEVRON_ESQ : CHEVRON_DIR;
      b.setAttribute('aria-controls', cfg.sidebar.id);
      b.setAttribute('aria-expanded', 'true');
      b.setAttribute('aria-label', 'Recolher painel de ' + cfg.rotulo);
      b.addEventListener('click', function () {
        recolher(cfg, !cfg.sidebar.classList.contains('is-collapsed'));
      });
      cfg.botaoRecolher = b;
      b.style.display = ehDesktop() ? '' : 'none';   // no celular a sidebar vira gaveta: recolher não existe ali
      cfg.sidebar.insertBefore(b, cfg.sidebar.firstChild);

      if (ehDesktop() && lerEstado(cfg.lado)) recolher(cfg, true);
    });

    /* ── tour guiado ────────────────────────────────────────────
       Todo tour do projeto destaca elementos que moram dentro das
       sidebars. Com elas recolhidas, o coachmark mede o retângulo de
       um elemento invisível e o holofote cai no vazio.
       Enquanto o tour roda, as duas ficam fixas; ao terminar, voltam
       ao que o aluno tinha escolhido. Nada é salvo no meio — a
       preferência dele não muda por ter assistido ao tour. */
    /* O aluno apertou Ativar DENTRO do card flutuante: as famílias
       recolhem o painel ao ativar (para liberar o canvas), e flutuando
       sobraria só o cabeçalho. O card sai de cena. Se a ativação abrir o
       tour do modo, o 'coachmark:inicio' abaixo cuida do resto. */
    config.forEach(function (cfg) {
      cfg.sidebar.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest(SEL_ATIVAR);
        if (!btn || !abertoAgora || abertoAgora.cfg !== cfg || !abertoAgora.painel.contains(btn)) return;
        window.setTimeout(function () {
          if (abertoAgora && abertoAgora.painel.contains(btn) && btn.getAttribute('aria-pressed') === 'true') fecharFlutuante();
        }, 0);
      });
    });

    document.addEventListener('coachmark:inicio', function () {
      if (!ehDesktop() || suspenso) return;
      var alvo = abertoAgora || abrindo;
      suspenso = { reabrir: alvo ? { cfg: alvo.cfg, painel: alvo.painel, botao: alvo.botao } : null };
      fecharFlutuante();
      config.forEach(function (cfg) {
        suspenso[cfg.lado] = cfg.sidebar.classList.contains('is-collapsed');
        if (!suspenso[cfg.lado]) return;
        limparSolo(cfg);
        cfg.sidebar.classList.remove('is-collapsed');
        cfg.trilho.hidden = true;
        publicarEstado(cfg, false);
      });
      window.setTimeout(remedirCanvas, espera());
    });
    document.addEventListener('coachmark:fim', function () {
      if (!suspenso) return;
      var estava = suspenso; suspenso = null;
      if (!ehDesktop()) return;
      config.forEach(function (cfg) {
        if (!estava[cfg.lado]) return;
        cfg.sidebar.classList.add('is-collapsed');
        cfg.trilho.hidden = false;
        publicarEstado(cfg, true);
      });
      window.setTimeout(remedirCanvas, espera());
      /* O aluno clicou num ícone querendo ver aquele card; se o tour do
         modo entrou no meio, o clique termina como terminaria sem tour:
         com o card flutuando. Sem isto, o primeiro clique em cada modo
         "perdia" o card — era a diferença de comportamento em relação
         ao piloto do SIMA. */
      var r = estava.reabrir;
      if (r && r.cfg.sidebar.classList.contains('is-collapsed') &&
          !r.painel.hasAttribute('hidden')) {
        alternarFlutuante(r.cfg, r.painel, r.botao);
      }
    });

    var canvas = document.getElementById('sim-canvas') ||
                 document.querySelector('.canvas-wrap canvas');
    if (canvas) {
      canvas.addEventListener('pointerdown', function () {
        if (abertoAgora && abertoAgora.cfg.fechaNoCanvas) {
          Oclusao.segurar();     // a cena não foge do dedo: desliza só quando ele soltar
          fecharFlutuante();
        }
      });
    }

    /* O card muda de tamanho (a largura arrastada da sidebar, a janela): a
       faixa coberta acompanha. */
    if (typeof ResizeObserver !== 'undefined') {
      var vigiaCard = new ResizeObserver(function () { Oclusao.remedir(); });
      config.forEach(function (cfg) { vigiaCard.observe(cfg.sidebar); });
    }
    window.addEventListener('resize', function () { Oclusao.remedir(); });

    /* Ao cruzar para o mobile desfaz tudo — o layout de baixo do
       breakpoint (bottom sheet + barra de modos) assume sozinho. Ao
       voltar, restaura o que estava salvo. */
    var eraDesktop = ehDesktop();
    window.addEventListener('resize', function () {
      var agora = ehDesktop();
      if (agora === eraDesktop) return;
      eraDesktop = agora;
      fecharFlutuante();
      config.forEach(function (cfg) {
        limparSolo(cfg);
        if (cfg.botaoRecolher) cfg.botaoRecolher.style.display = agora ? '' : 'none';
        if (!agora) {
          cfg.sidebar.classList.remove('is-collapsed');
          cfg.trilho.hidden = true;
          publicarEstado(cfg, false);
        } else if (lerEstado(cfg.lado)) {
          recolher(cfg, true);
        }
      });
    });

    /* Veste agora e sempre que o tema mudar. O tema chega por três
       caminhos (a11y.js na carga, preferencias.js pela URL, mensagem
       a11y-update da central) e todos terminam em classe no <body> ou
       atributo no <html> — então é isso que se observa. A segunda
       passada, 450ms depois, pega sidebars que animam a troca de fundo:
       lida no meio da transição, a cor seria intermediária. */
    function vestirTodos() { config.forEach(vestirTrilho); }
    var agendado = null;
    function aoMudarTema() {
      if (agendado) return;
      agendado = window.requestAnimationFrame(function () {
        agendado = null; vestirTodos();
        window.setTimeout(vestirTodos, 450);
      });
    }
    vestirTodos();
    if (typeof MutationObserver !== 'undefined') {
      var vigiaTema = new MutationObserver(aoMudarTema);
      vigiaTema.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      vigiaTema.observe(document.documentElement, { attributes: true,
        attributeFilter: ['class', 'data-theme', 'data-contrast'] });
    }

    if (typeof MutationObserver !== 'undefined') {
      var vigia = new MutationObserver(function () {
        sincronizarVisiveis();
        sincronizarAtivo();
      });
      config.forEach(function (cfg) {
        paineisDe(cfg.sidebar).forEach(function (p) {
          vigia.observe(p, { attributes: true, attributeFilter: ['hidden'] });
          var alvo = p.querySelector(SEL_ATIVAR);
          if (alvo) vigia.observe(alvo, { attributes: true, attributeFilter: ['aria-pressed'] });
        });
        /* ícones preenchidos pelo app depois da montagem (sifi) */
        var vigiaIcone = new MutationObserver(function () {
          Array.prototype.forEach.call(cfg.trilho.querySelectorAll('.rail-btn'),
            function (b) { if (b._icone) preencherIcone(b); });
        });
        Array.prototype.forEach.call(cfg.trilho.querySelectorAll('.rail-btn'),
          function (b) {
            if (b._icone) vigiaIcone.observe(b._icone, { childList: true, subtree: true });
          });
      });
      sincronizarVisiveis();
      sincronizarAtivo();
    }
  }

  window.addEventListener('DOMContentLoaded', initSidebarRail);
})();
