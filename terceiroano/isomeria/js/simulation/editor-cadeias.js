/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/editor-cadeias.js
   ───────────────────────────────────────────────────────────────
   SIQC · MÓDULO 1 — CADEIAS E CLASSIFICAÇÃO

   O aluno MONTA a cadeia e a classificação é calculada ao vivo, a
   partir da estrutura — nunca consultada numa lista de moléculas
   prontas. Qualquer cadeia de até 20 átomos pesados funciona.

   COMO SE CONSTRÓI (toque discreto, sem arrasto de precisão)
     Anexar ... toque num átomo para selecioná-lo; o + mostra onde o
                próximo átomo entra; toque no + para anexar o elemento
                da paleta. Toque numa ligação alterna simples → dupla →
                tripla, filtrado pela valência e pelo par de elementos.
     Ligar .... toque em dois átomos: a ligação fecha um anel.
     Apagar ... toque num átomo ou ligação; o que ficar solto sai junto.
   H é sempre implícito: aparece no rótulo (CH₃), nunca como peça.

   RELAXAMENTO
   Automático e animado nos três gatilhos da especificação — fechar
   anel, ramificar, mudar a ordem —, e sempre LOCAL: só se movem os
   ramos do centro afetado (geometria-molecular.js). O botão "Snap
   Literatura" refaz o desenho de livro inteiro e desfaz sobreposições
   de ramos distantes, sob demanda.

   CLASSIFICAÇÃO
   O painel de Resultados mostra, a cada mudança, os quatro critérios
   (fechamento, saturação, natureza, ramificação) e os carbonos por
   classe. O antigo painel de Desafio saiu deste módulo — estava
   desconexo dele —; a classificação com mais profundidade vai ganhar
   um módulo próprio, e o gerador de estruturas aleatórias foi para
   core/gerador-estruturas.js.

   Depende de: grafo-molecular.js, geometria-molecular.js,
               desenho-molecula.js, anuncios.js (announce, playTone).
═══════════════════════════════════════════════════════════════ */

'use strict';

var NOME_ORDEM = { 1: 'simples', 2: 'dupla', 3: 'tripla' };
var CRITERIOS = [
  ['cadeia', 'Fechamento'], ['saturacao', 'Saturação'],
  ['natureza', 'Natureza'], ['ramificacao', 'Ramificação']
];

class EditorCadeias {
  constructor(D) {
    this.D = D;
    this.elemento = 'C';
    this.ferramenta = 'anexar';
    this.cunhaTipo = 'frente';      // ferramenta Cunha: para onde a ligação tocada aponta
    this.tensao = false;            // tensão angular entre as nuvens (vistas espaciais)
    this.ativo = false;
    this.escala = 72;
    this.foco = -1;
    this.t = 0;
    this.versao = 0;
    this._panLivre = false;
    /* Representação em exibição. Só a condensada edita; as demais são
       a MESMA molécula vista de outro jeito (representacoes.js). */
    this.vista = 'condensada';
    this.cam3 = new OrbitCamera();
    this.cam3.definirPadrao(0.35, 0.22);
    this.centro3d = null;   // átomo cujos ângulos a esfera e bastão mostra (null: o mais ligado)
    /* navegação das vistas espaciais (girar, mover, ampliar, ajustar) —
       módulo único, compartilhado com a hibridização (navegacao-3d.js) */
    var eu = this;
    this.nav3 = new Navegacao3D({
      canvas: document.getElementById('sim-canvas'), camera: this.cam3,
      ativo: function () { return eu.ativo && Q3.Representacoes.vista(eu.vista).tresD; },
      escala: function () { return eu._r3 && eu._r3.escala ? eu._r3.escala : 200; },
      centroTela: function (w, h) { var f = eu._faixas(w, h); return { x: w / 2, y: f.topo + (h - f.topo - f.base) / 2 }; },
      fraseAjustar: 'Molécula inteira na tela.',
      vistaPapel: true
    });
    /* navegação das vistas PLANAS: os mesmos gestos, teclas e botões das
       espaciais — arrastar move, rolagem e pinça ampliam em direção ao
       cursor, duplo toque ajusta. Na condensada (onde se edita tocando),
       o duplo toque só ajusta no espaço vazio. */
    this.cam2 = new Camera2D();
    this.cam2.aoMexer = function () { eu._seguir = false; };   // o gesto do aluno manda na vista
    this.nav2 = new Navegacao3D({
      canvas: document.getElementById('sim-canvas'), camera: this.cam2,
      ativo: function () { return eu.ativo && !Q3.Representacoes.vista(eu.vista).tresD; },
      escala: function () { return 1; },
      centroTela: function (w, h) { return eu._centroTela2D || { x: w / 2, y: h / 2 }; },
      fraseAjustar: 'Molécula inteira na tela.',
      podeAjustarEm: function (x, y) { return eu.vista !== 'condensada' || !eu._alvoEm(x, y); }
    });
    this._avisoVista = 0;
    this.reiniciar();
    this._ligarPonteiro();
  }

  /* ── estado ────────────────────────────────────────────────── */

  reiniciar() {
    this.g = new Q3.Grafo();
    var id = this.g.addAtomo('C');
    this.pos = {}; this.pos[id] = { x: 0, y: 0 };
    this.vis = Q3.Geometria.copiarPosicoes(this.pos);
    this.sel = id;
    this.ligarDe = null;
    this.historico = [];
    if (this.cam2) { this.cam2.zoom = 1; this.cam2.alvo = [0, 0, 0]; this.cam2.manual = false; this.cam2._anim = null; }
    this.foco = -1;
    this._mudou();
  }

  ativar() {
    this.ativo = true;
    var cv = document.getElementById('sim-canvas');
    if (cv) cv.style.touchAction = 'none';   // o arraste de pan não pode rolar a página
  }
  desativar() {
    this.ativo = false;
    var cv = document.getElementById('sim-canvas');
    if (cv) cv.style.touchAction = '';
  }

  /* Toda mudança de estado religa o seguimento da seleção (ver
     _calcVista): depois de anexar ou selecionar, a vista vai buscar o
     átomo se ele estiver fora da tela. */
  _mudou() { this.versao++; this._seguir = true; }
  _ids() {
    return Object.keys(this.g.atomos).sort(function (a, b) {
      return parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10);
    });
  }
  _nC(id) {
    var g = this.g;
    return g.vizinhos(id).filter(function (v) { return g.atomos[v.id].el === 'C'; }).length;
  }

  /* Antes de toda edição: guarda para o Desfazer. */
  _guardar() {
    this.historico.push({ g: this.g.clonar(), pos: Q3.Geometria.copiarPosicoes(this.pos), sel: this.sel });
    if (this.historico.length > 60) this.historico.shift();
  }

  /* O encaixe do átomo selecionado: calculado rodando o MESMO anexar()
     numa cópia, então o átomo novo cai exatamente onde o + estava. */
  _encaixe() {
    if (this.vista !== 'condensada' || this.ferramenta !== 'anexar' || !this.g.atomos[this.sel]) return null;
    var chave = this.versao + '|' + this.sel + '|' + this.elemento;
    if (chave !== this._chaveEncaixe) {
      this._chaveEncaixe = chave;
      this._cacheEncaixe = null;
      if (this.g.pesados().length < Q3.TETO_PESADOS) {
        var pr = Q3.Geometria.previsaoAnexo(this.g, this.pos, this.sel, this.elemento);
        if (pr) this._cacheEncaixe = { x: pr.x, y: pr.y };
      }
    }
    return this._cacheEncaixe;
  }

  _aneis() {
    if (this._chaveAneis !== this.versao) {
      this._chaveAneis = this.versao;
      this._cacheAneis = Q3.Geometria.aneisMinimos(this.g);
    }
    return this._cacheAneis;
  }

  /* ── animação e vista ──────────────────────────────────────── */

  _reduzido() {
    return document.body.classList.contains('reduce-motion') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* Garante uma posição de exibição para cada átomo existente, e só para
     eles. Chamado no começo do desenho e do toque, sem depender de o
     atualizar() ter rodado antes: a app tem uma espera de partida depois
     de ativar o módulo em que ela PULA o update mas continua chamando o
     draw. Um átomo que surgisse nesse intervalo — ou que o Desfazer
     trouxesse de volta depois de um Apagar — não teria posição, o desenho
     lançava exceção e o laço de animação da app morria, congelando a tela.
     Achado no navegador: a pílula parada em "CH₄" com seis átomos no grafo. */
  _sincronizarVis() {
    var self = this;
    Object.keys(this.pos).forEach(function (id) {
      if (!self.vis[id]) self.vis[id] = { x: self.pos[id].x, y: self.pos[id].y };
    });
    Object.keys(this.vis).forEach(function (id) { if (!self.pos[id]) delete self.vis[id]; });
  }

  /* A app chama update(dt) a cada quadro — MAS só depois de uma espera de
     partida de 2 s após ativar o módulo (faz sentido para simulações que
     "rodam": o aluno vê o estado inicial antes de as partículas andarem).
     Num editor, o aluno já começa a tocar nesses 2 s, e o relaxamento
     ficava congelado até a espera acabar, para então saltar de uma vez.
     Por isso a animação do editor anda pelo próprio relógio, dentro do
     desenho, e este método fica só para cumprir o contrato da Mech. */
  atualizar() {}

  _animar(dt) {
    this.t += dt;
    var k = this._reduzido() ? 1 : 1 - Math.exp(-dt * 11);
    var self = this;
    Object.keys(this.pos).forEach(function (id) {
      var p = self.pos[id], v = self.vis[id];
      if (!v) { self.vis[id] = { x: p.x, y: p.y }; return; }
      v.x += (p.x - v.x) * k; v.y += (p.y - v.y) * k;
    });
    Object.keys(this.vis).forEach(function (id) { if (!self.pos[id]) delete self.vis[id]; });
  }

  /* Enquadramento automático: zoom no conteúdo até o PISO em que o alvo
     de toque de cada átomo (44px) ainda não encavala no do vizinho.
     Abaixo disso o zoom para e o aluno arrasta a vista (pan). */
  _calcVista(W, H) {
    var ids = Object.keys(this.vis), self = this;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    var inclui = function (p) {
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
    };
    ids.forEach(function (id) { inclui(self.vis[id]); });
    var enc = this._encaixe();
    if (enc && this.vis[this.sel]) {
      inclui({ x: self.vis[self.sel].x + enc.x - self.pos[self.sel].x, y: self.vis[self.sel].y + enc.y - self.pos[self.sel].y });
    }
    /* A ÁREA DO DESENHO: a área livre da cena (ui/moldura-cena.js) — abaixo da pílula do modo e fora da coluna de
       zoom —, e no pé só a faixa da dica de teclado (no computador). O rodapé de texto que havia aqui (a dica de
       como mexer, a legenda das cunhas, a contagem de Lewis) foi para os Resultados: a cena fica só com o desenho.
       O TETO da escala cresce com a área: antes era fixo (92 px por ligação, pensado para o dedo), e no computador
       a cadeia inicial ficava pequena no meio da tela; agora ela começa grande e o enquadramento a reduz conforme
       cresce, até o PISO do toque (52 px). Numa cena baixa (o celular deitado), o piso desce até 36 px: com 52, uma
       cadeia de seis carbonos já não cabia na altura, e a ponta oposta à que se monta saía da tela. */
    var f = this._faixas(W, H), TOPO = f.topo, BASE = f.base, LADO = f.esq, DIR = f.dir, PISO = Math.max(36, Math.min(52, (H - TOPO - BASE) / 4.4));
    var TETO = Math.max(92, Math.min(150, Math.min(W - LADO - DIR, H - TOPO - BASE) / 5.2));
    var MARGEM = 0.95 + Q3.Representacoes.margemExtra(this.vista);
    var w = (x1 - x0) + 2 * MARGEM, h = (y1 - y0) + 2 * MARGEM;
    var alvo = Math.min((W - LADO - DIR) / w, (H - TOPO - BASE) / h, TETO);
    var cabe = alvo >= PISO;
    alvo = Math.max(alvo, PISO);
    var cam = this.cam2, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    cam.passo();
    /* AUTOMÁTICO ATÉ O ALUNO MEXER. Enquanto a câmera plana não estiver em
       modo manual, a escala e o centro acompanham a molécula, como sempre
       foi. Ao primeiro gesto (arrastar, ampliar), ficam onde estavam:
       editar não faz a vista pular. "Ajustar" devolve ao automático. */
    if (!cam.manual || !this._ref2D) {
      this.escala += (alvo - this.escala) * (this._reduzido() ? 1 : 0.18);
      this._ref2D = { cx: cx, cy: cy, esc: this.escala };
      if (cabe && !cam.animando) { cam.alvo[0] *= 0.82; cam.alvo[1] *= 0.82; }
    }
    this._panLivre = !cabe;
    var ref = this._ref2D, esc = ref.esc * cam.zoom;
    var centro = { x: LADO + (W - LADO - DIR) / 2, y: TOPO + (H - TOPO - BASE) / 2 };
    this._centroTela2D = centro;                     // o zoom em direção ao cursor mede a partir daqui
    this._vista = {
      ox: centro.x - ref.cx * esc + cam.alvo[0],
      oy: centro.y - ref.cy * esc + cam.alvo[1],
      esc: esc, W: W, H: H
    };
    /* Com pan, a vista vai buscar o átomo selecionado DEPOIS DE UMA
       EDIÇÃO — e para assim que ele aparece. Não pode valer sempre: na
       primeira versão valia a cada quadro, e quando o aluno arrastava a
       vista para olhar outra parte da cadeia, o editor puxava de volta
       (o teste de arraste no celular pegou: o pan andava 3px em vez de
       100). O arraste do aluno desliga o seguimento na hora. */
    if ((!cabe || cam.manual) && this._seguir && this.vis[this.sel]) {
      /* o átomo selecionado E o + do encaixe dele (é nele que o aluno toca a seguir) ficam dentro da área: antes só
         o átomo contava, e numa cena baixa o + subia para baixo da pílula do modo */
      var p = this._tela(this.vis[this.sel]), pts = [p], mg = Math.max(16, esc * 0.38);
      if (enc) pts.push(this._tela({ x: this.vis[this.sel].x + enc.x - this.pos[this.sel].x, y: this.vis[this.sel].y + enc.y - this.pos[this.sel].y }));
      var xa = Infinity, xb = -Infinity, ya = Infinity, yb = -Infinity;
      pts.forEach(function (q) { xa = Math.min(xa, q.x - mg); xb = Math.max(xb, q.x + mg); ya = Math.min(ya, q.y - mg); yb = Math.max(yb, q.y + mg); });
      var ajx = xa < LADO ? LADO - xa : (xb > W - DIR ? W - DIR - xb : 0);
      var ajy = ya < TOPO ? TOPO - ya : (yb > H - BASE ? H - BASE - yb : 0);
      if (Math.abs(ajx) < 1 && Math.abs(ajy) < 1) this._seguir = false;
      else { cam.alvo[0] += ajx * 0.25; cam.alvo[1] += ajy * 0.25; }
    }
  }
  _tela(p) { return { x: this._vista.ox + p.x * this._vista.esc, y: this._vista.oy + p.y * this._vista.esc }; }
  /* as faixas da cena que o desenho não usa: em cima, a pílula do modo; à direita, a coluna de zoom; embaixo, a dica
     de teclado do canvas (no computador; no celular ela sai com o modo ativo) */
  _faixas(W, H) {
    var L = Q3.Moldura ? Q3.Moldura.livre(W, H, true) : { x: 28, y: 72, w: W - 56, h: H - 72 - 70 };
    var celular = typeof ehCelular === 'function' && ehCelular();
    return { topo: L.y, base: Math.max(H - L.y - L.h, celular ? 14 : 34), esq: L.x, dir: Math.max(L.x, W - L.x - L.w) };
  }

  /* O pan das vistas planas, que morava aqui, passou para o módulo de
     navegação (navegacao-3d.js, com a Camera2D): as vistas planas e as
     espaciais têm agora os mesmos gestos, teclas e botões. */
  _ligarPonteiro() {}

  /* ── entrada: toque ────────────────────────────────────────── */

  _alvoEm(x, y) {
    if (!this._vista) return null;
    var self = this;
    var enc = this._encaixe();
    if (enc && this.vis[this.sel]) {
      var pe = this._tela({ x: this.vis[this.sel].x + enc.x - this.pos[this.sel].x,
                            y: this.vis[this.sel].y + enc.y - this.pos[this.sel].y });
      if (Math.hypot(pe.x - x, pe.y - y) <= 26) return { tipo: 'encaixe' };
    }
    var melhor = null, dMelhor = Infinity;
    this._ids().forEach(function (id) {
      var p = self._tela(self.vis[id]), d = Math.hypot(p.x - x, p.y - y);
      if (d <= Math.max(22, self._vista.esc * 0.34) && d < dMelhor) { dMelhor = d; melhor = { tipo: 'atomo', id: id }; }
    });
    if (melhor) return melhor;
    this.g.ligacoes.forEach(function (l) {
      var a = self._tela(self.vis[l.a]), b = self._tela(self.vis[l.b]);
      var dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy;
      var t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / L2));
      var d = Math.hypot(a.x + t * dx - x, a.y + t * dy - y);
      if (d <= 16 && d < dMelhor && t > 0.12 && t < 0.88) { dMelhor = d; melhor = { tipo: 'ligacao', a: l.a, b: l.b }; }
    });
    return melhor;
  }

  tocar(x, y) {
    if (!this.ativo) return false;
    this._sincronizarVis();
    if (this.nav3.consumirClique()) return false;          // foi arraste, pinça ou toque duplo na 3D
    if (this.nav2.consumirClique()) return false;          // idem nas vistas planas
    if (Q3.Representacoes.vista(this.vista).tresD) {
      /* Tocar num átomo o leva para o CENTRO DE ROTAÇÃO, com transição: o
         aluno gira a molécula em torno do carbono que está estudando. Na
         esfera e bastão, os ângulos em volta dele aparecem também. É
         explorar, não editar — a edição continua só na condensada. */
      var tocado = this._r3 ? this._r3.proj.filter(function (a) { return !a.h && Math.hypot(a.sx - x, a.sy - y) <= Math.max(a.r, 16); })
        .sort(function (a, b) { return a.depth - b.depth; })[0] : null;
      if (!tocado) return false;
      var k = this._r3.k;
      this.nav3.focarEm([tocado.x * k, tocado.y * k, tocado.z * k]);
      if (this.vista === 'esfera') {
        this.centro3d = tocado.id;
        announce(this._falado(this._descreverCentro(tocado.id)).replace(/  ·  /g, ', ') + '. A molécula agora gira em torno dele, com os ângulos na tela.');
      } else announce(this._falado(Q3.Desenho.rotulo(this.g, tocado.id)) + ' no centro: a molécula agora gira em torno dele.');
      return true;
    }
    if (this.vista !== 'condensada') { this._avisarSoVer(); return false; }
    var alvo = this._alvoEm(x, y);
    if (alvo) { alvo.x = x; alvo.y = y; }      // a Cunha usa o ponto tocado para escolher a ponta estreita
    if (!alvo) {
      if (this.ligarDe) { this.ligarDe = null; this._mudou(); announce('Ligação cancelada.'); return true; }
      return false;
    }
    return this._executar(alvo);
  }

  _executar(alvo) {
    if (this.ferramenta === 'anexar') {
      if (alvo.tipo === 'encaixe') return this._anexar();
      if (alvo.tipo === 'atomo') {
        this.sel = alvo.id; this._mudou();
        announce(this._descreverAtomo(alvo.id) + (this.g.capacidade(alvo.id) ? '.' : '. Toque em outro átomo para continuar.'));
        playTone(700, .04, .03);
        return true;
      }
      if (alvo.tipo === 'ligacao') return this._ciclar(alvo.a, alvo.b);
    } else if (this.ferramenta === 'ligar') {
      if (alvo.tipo === 'atomo') return this._ligar(alvo.id);
      announce('Com a ferramenta Ligar, toque em dois átomos.');
    } else if (this.ferramenta === 'apagar') {
      if (alvo.tipo === 'atomo') return this._apagarAtomo(alvo.id);
      if (alvo.tipo === 'ligacao') return this._apagarLigacao(alvo.a, alvo.b);
    } else if (this.ferramenta === 'cunha') {
      if (alvo.tipo === 'ligacao') return this._cunha(alvo.a, alvo.b, alvo.x, alvo.y);
      announce('Com a ferramenta Cunha, toque numa ligação simples.');
    }
    return false;
  }

  /* ═══ CUNHA: o aluno escolhe a estereoquímica ═══════════════════
     Grava na ligação { de, tipo } (core/grafo-molecular.js). A montagem
     3D obedece — o substituinte "frente" vai de fato para a frente do
     plano —, e o desenho plano, derivado dela, fica coerente sozinho. É
     o que permite montar os dois enantiômeros de uma molécula quiral. */
  _cunha(a, b, x, y) {
    var g = this.g, l = g.ligacao(a, b);
    if (!l) return false;
    if (l.ordem !== 1) { announce('Dupla e tripla ficam no plano do desenho: só a ligação simples pode sair dele.'); playTone(220, .1, .05); return false; }
    if (!Q3.Geometria.lado(g, a, b)) { announce('Ligação de anel fica no plano: o anel é desenhado como polígono. Os substituintes dele podem sair.'); playTone(220, .1, .05); return false; }
    var c = this._estreito(a, b, x, y), o = c === a ? b : a, tipo = this.cunhaTipo;
    var hib = Q3.Geometria.hibridizacao(g, c);
    if (tipo !== 'plano' && hib !== 'sp3') {
      announce('Esse carbono é ' + (hib === 'sp2' ? 'sp²' : 'sp') + ', e é plano: as ligações dele não saem do papel.');
      playTone(220, .1, .05); return false;
    }
    this._guardar();
    var nome = Q3.Desenho.rotulo(g, c) + '–' + Q3.Desenho.rotulo(g, o);
    if (l.estereo && l.estereo.de === c && l.estereo.tipo === tipo) {
      delete l.estereo;                      // tocar de novo com o mesmo tipo: volta ao automático
      announce('Ligação ' + this._falado(nome) + ' de volta ao automático.');
    } else {
      l.estereo = { de: c, tipo: tipo };
      var trocou = false;
      if (tipo !== 'plano') {
        /* um tetraedro só tem UM lugar à frente e um atrás: se outro
           substituinte do mesmo carbono já estava nesse lado, ele troca */
        g.ligacoes.forEach(function (x2) {
          if (x2 !== l && x2.estereo && x2.estereo.de === c && x2.estereo.tipo === tipo) {
            x2.estereo.tipo = tipo === 'frente' ? 'tras' : 'frente'; trocou = true;
          }
        });
      }
      /* VALIDAÇÃO: há combinações de cunha que não definem configuração —
         frente numa ligação da cadeia e trás na outra, com o ramo no
         plano, por exemplo. A IUPAC recomenda evitá-las; o editor avisa, e
         o carbono ganha um "?" até o desenho voltar a definir. */
      var qd = Q3.Geometria3D.quiralidadeDesenho(g, this.pos, c);
      var ambiguo = qd && Math.abs(qd.v) < Q3.Geometria3D.LIMIAR_QUIRAL;
      announce('Ligação ' + this._falado(nome) + ({ frente: ' vem para a frente.', tras: ' vai para trás.', plano: ' fica no plano.' })[tipo] +
        (trocou ? ' O substituinte que estava desse lado passou para o outro.' : '') +
        (ambiguo ? ' Atenção: com essas cunhas o desenho não define a configuração deste carbono — ficou ambíguo. O costume é pôr a cunha num substituinte, não nas ligações da cadeia.' : ''));
    }
    this._mudou();
    playTone(tipo === 'frente' ? 820 : tipo === 'tras' ? 560 : 680, .06, .045);
    return true;
  }

  /* Ponta estreita da cunha: no carbono mais substituído (o candidato a
     centro estereogênico); no empate, no lado mais perto do toque. */
  /* Carbonos cujas cunhas definidas pelo aluno deixam o desenho ambíguo
     (não definem configuração). Recalculado a cada mudança da molécula. */
  _ambiguos() {
    if (this._chaveAmb !== this.versao) {
      this._chaveAmb = this.versao;
      var g = this.g, pos = this.pos, out = [];
      Object.keys(g.atomos).forEach(function (c) {
        var qd = Q3.Geometria3D.quiralidadeDesenho(g, pos, c);
        if (qd && Math.abs(qd.v) < Q3.Geometria3D.LIMIAR_QUIRAL) out.push(c);
      });
      this._amb = out;
    }
    return this._amb;
  }

  _estreito(a, b, x, y) {
    var na = this.g.vizinhos(a).length, nb = this.g.vizinhos(b).length;
    if (na !== nb) return na > nb ? a : b;
    if (x !== undefined && this._vista) {
      var pa = this._tela(this.vis[a]), pb = this._tela(this.vis[b]);
      return Math.hypot(pa.x - x, pa.y - y) <= Math.hypot(pb.x - x, pb.y - y) ? a : b;
    }
    return a;
  }

  /* ── as operações ──────────────────────────────────────────── */

  _anexar() {
    if (this.g.pesados().length >= Q3.TETO_PESADOS) {
      announce('Teto de ' + Q3.TETO_PESADOS + ' átomos pesados atingido.'); playTone(220, .1, .05); return false;
    }
    var antes = this.g.classificar(), pai = this.sel;
    this._guardar();
    var r = Q3.Geometria.anexar(this.g, this.pos, pai, this.elemento);
    if (!r) { this.historico.pop(); announce('Esse átomo não tem valência livre.'); return false; }
    this.vis[r.id] = { x: this.pos[r.id].x, y: this.pos[r.id].y };   // nasce onde estava o +
    if (this.g.capacidade(r.id) > 0) this.sel = r.id;              // tocar de novo no + segue a cadeia
    this._mudou();
    playTone(r.gatilho ? 620 : 780, .06, .045);
    var extra = r.gatilho === 'ramificar' ? ' ' + this._falado(Q3.Desenho.rotulo(this.g, pai)) + ' virou ponto de ramificação.' : '';
    this._anunciar(Q3.Desenho.NOMES[this.elemento] + ' anexado.' + extra, antes);
    return true;
  }

  _ciclar(a, b) {
    var antes = this.g.classificar();
    this._guardar();
    var nova = this.g.ciclarOrdem(a, b);
    if (nova === null) {
      this.historico.pop();
      var ea = this.g.atomos[a].el, eb = this.g.atomos[b].el;
      var hal = { F: 1, Cl: 1, Br: 1, I: 1 }, met = Q3.METAIS;
      announce(hal[ea] || hal[eb] ? 'Halogênio só faz ligação simples.'
        : met[ea] || met[eb] ? 'Os metais dos compostos orgânicos (Na, K, Mg) só fazem ligação simples.'
        : 'Não há valência livre para uma ligação mais forte.');
      playTone(220, .1, .05);
      return false;
    }
    Q3.Geometria.relaxarOrdem(this.g, this.pos, a, b);
    this._mudou();
    playTone(nova === 1 ? 560 : nova === 2 ? 700 : 860, .06, .045);
    this._anunciar('Ligação ' + NOME_ORDEM[nova] + ' entre ' + this.g.atomos[a].el + ' e ' + this.g.atomos[b].el + '.', antes);
    return true;
  }

  _ligar(id) {
    var nome = Q3.Desenho.NOMES[this.g.atomos[id].el];
    if (!this.ligarDe) {
      if (this.g.capacidade(id) < 1) { announce(nome + ' sem valência livre para outra ligação.'); return false; }
      this.ligarDe = id; this._mudou();
      announce(nome + ' escolhido. Toque no segundo átomo para fechar o anel.');
      playTone(700, .04, .03);
      return true;
    }
    if (id === this.ligarDe) { this.ligarDe = null; this._mudou(); announce('Ligação cancelada.'); return true; }
    var a = this.ligarDe;
    if (this.g.ligacao(a, id)) { announce('Esses átomos já estão ligados.'); return false; }
    if (this.g.capacidade(id) < 1) { announce('O segundo átomo não tem valência livre.'); return false; }
    var antes = this.g.classificar();
    this._guardar();
    this.g.addLigacao(a, id, 1);
    var anel = Q3.Geometria.aneisMinimos(this.g)
      .filter(function (r) { return r.indexOf(a) >= 0 && r.indexOf(id) >= 0; })
      .sort(function (x, y) { return x.length - y.length; })[0];
    if (anel) Q3.Geometria.relaxarAnel(this.g, this.pos, anel);
    this.ligarDe = null; this.sel = id; this._mudou();
    playTone(880, .09, .05);
    this._anunciar('Anel de ' + (anel ? anel.length : '') + ' átomos fechado.', antes);
    return true;
  }

  /* Remover pode partir a molécula em pedaços: fica a maior parte, e o
     que se soltou sai junto — com aviso, para não sumir em silêncio. */
  _maiorParte() {
    var comps = this.g.componentes();
    if (comps.length <= 1) return 0;
    var primeiro = this._ids()[0];
    comps.sort(function (x, y) { return (y.length - x.length) || (x.indexOf(primeiro) >= 0 ? -1 : 1); });
    var n = 0, self = this;
    comps.slice(1).forEach(function (c) {
      c.forEach(function (id) { self.g.removeAtomo(id); delete self.pos[id]; n++; });
    });
    return n;
  }

  _apagarAtomo(id) {
    if (this.g.pesados().length <= 1) { announce('A cadeia precisa de ao menos um átomo.'); return false; }
    var antes = this.g.classificar();
    this._guardar();
    this.g.removeAtomo(id); delete this.pos[id];
    var soltos = this._maiorParte();
    if (!this.g.atomos[this.sel]) this.sel = this._ids()[0];
    this.ligarDe = null; this._mudou();
    playTone(420, .07, .045);
    this._anunciar('Átomo removido' + (soltos ? ', e ' + soltos + ' que ficaram soltos também.' : '.'), antes);
    return true;
  }

  _apagarLigacao(a, b) {
    var antes = this.g.classificar();
    this._guardar();
    this.g.removeLigacao(a, b);
    var soltos = this._maiorParte();
    if (!this.g.atomos[this.sel]) this.sel = this._ids()[0];
    this._mudou();
    playTone(420, .07, .045);
    this._anunciar('Ligação removida' + (soltos ? ', e ' + soltos + ' átomo' + (soltos > 1 ? 's' : '') + ' solto' + (soltos > 1 ? 's' : '') + ' saiu junto.' : '. O anel foi aberto.'), antes);
    return true;
  }

  /* ── comandos do painel ────────────────────────────────────── */

  /* Aviso de "só para ver", no máximo a cada 4 s: tocar várias vezes
     seguidas num modelo 3D não pode virar uma rajada de anúncios. */
  _avisarSoVer() {
    var agora = performance.now();
    if (agora - this._avisoVista < 4000) return;
    this._avisoVista = agora;
    announce(Q3.Representacoes.vista(this.vista).nome + ' é só para ver. Para montar ou editar, volte à estrutural condensada.');
  }

  param(k, v) {
    if (k === 'vista') {
      var vi = Q3.Representacoes.vista(v);
      this.vista = vi.id; this.foco = -1; this._mudou();
      var cunhas = !vi.tresD && this._temCunhas() ? ' As cunhas mostram as ligações que saem do papel: cheia vem para a frente, tracejada vai para trás.' : '';
      return { say: vi.nome + (vi.edita ? ': aqui você monta e edita a cadeia.' : vi.tresD ? ': a molécula no espaço, com os ângulos reais. Arraste para girar.' : ': a mesma molécula, só para ver.') + cunhas };
    }
    if (k === 'elemento') {
      this.elemento = v; this._mudou();
      return { say: Q3.Desenho.NOMES[v] + ' na paleta.' };
    }
    if (k === 'ferramenta') {
      this.ferramenta = v; this.ligarDe = null; this._mudou();
      var falas = {
        anexar: 'Anexar: toque num átomo e depois no + para acrescentar.',
        ligar: 'Ligar: toque em dois átomos para fechar um anel.',
        apagar: 'Apagar: toque num átomo ou numa ligação para remover.',
        cunha: 'Cunha: escolha frente, trás ou no plano, e toque numa ligação simples.'
      };
      var grupo = document.getElementById('grupo-cunha');
      if (grupo) grupo.hidden = v !== 'cunha';
      return { say: falas[v] };
    }
    if (k === 'tensao') {
      this.tensao = v === 'on';
      if (!Q3.Representacoes.vista(this.vista).tresD) {
        // nas vistas planas a chave não tem efeito (por desenho): a dica diz onde olhar
        this._dicaTemp = { texto: 'A tensão angular aparece nas vistas espaciais: escolha Esfera e bastão ou Modelo compacto.', ate: performance.now() + 4500 };
        return { say: 'Tensão angular ' + (this.tensao ? 'ligada' : 'desligada') + '. Ela aparece nas vistas espaciais: escolha Esfera e bastão ou Modelo compacto.' };
      }
      return { say: this.tensao
        ? 'Tensão angular ligada: pares isolados, ligações duplas e grupos volumosos ocupam mais espaço e empurram as outras nuvens. Veja nas vistas espaciais.'
        : 'Tensão angular desligada: todas as nuvens do mesmo tamanho, ângulos ideais da hibridização.' };
    }
    if (k === 'cunhaTipo') {
      this.cunhaTipo = v; this._mudou();
      return { say: { frente: 'Frente: a ligação tocada vem para o observador, em cunha cheia.',
                      tras: 'Trás: a ligação tocada vai para longe, em cunha tracejada.',
                      plano: 'No plano: a ligação tocada fica no papel, em traço simples.' }[v] };
    }
    return {};
  }

  acao(nome) {
    if (this.vista !== 'condensada' && (nome === 'cad-desfazer' || nome === 'cad-limpar' || nome === 'cad-snap' || nome === 'cad-ativar')) {
      this._avisoVista = 0; this._avisarSoVer(); return false;
    }
    if (nome === 'cad-ativar') return this._ativarFoco();
    if (nome === 'cad-desfazer') {
      var h = this.historico.pop();
      if (!h) { announce('Nada para desfazer.'); return false; }
      this.g = h.g; this.pos = h.pos; this.sel = h.sel; this.ligarDe = null; this._mudou();
      playTone(520, .05, .04); announce('Desfeito.');
      return true;
    }
    if (nome === 'cad-limpar') {
      this._guardar();
      var hist = this.historico;
      this.reiniciar(); this.historico = hist;
      announce('Tela limpa: um carbono para começar.');
      return true;
    }
    if (nome === 'cad-snap') {
      this._guardar();
      this.pos = Q3.Geometria.snap(this.g, this.pos, { raiz: this._ids()[0] });
      this._mudou(); playTone(900, .07, .04);
      var sobra = Q3.Geometria.sobreposicoes(this.g, this.pos).length;
      announce('Snap Literatura: ângulos de leque corrigidos em cada centro' + (sobra ? '.' : ' e nenhuma sobreposição.'));
      return true;
    }
    return false;
  }



  /* ── teclado: setas percorrem os alvos, Enter ativa ────────── */

  _alvos() {
    var lista = [];
    if (this._encaixe()) lista.push({ tipo: 'encaixe' });
    this._ids().forEach(function (id) { lista.push({ tipo: 'atomo', id: id }); });
    this.g.ligacoes.forEach(function (l) { lista.push({ tipo: 'ligacao', a: l.a, b: l.b }); });
    return lista;
  }

  navegar(dx, dy) {
    if (!this.ativo) return false;
    var vi = Q3.Representacoes.vista(this.vista);
    if (vi.tresD) { this.nav3.girarTeclado(dx, dy); return true; }
    if (!vi.edita) { this._avisarSoVer(); return false; }
    var alvos = this._alvos();
    if (!alvos.length) return false;
    var passo = (dx || dy) > 0 ? 1 : -1;
    this.foco = this.foco < 0 ? (passo > 0 ? 0 : alvos.length - 1) : (this.foco + passo + alvos.length) % alvos.length;
    announce(this._descreverAlvo(alvos[this.foco]));
    return true;
  }

  _ativarFoco() {
    var alvos = this._alvos();
    if (this.foco < 0 || this.foco >= alvos.length) {
      announce('Use as setas para escolher o encaixe, um átomo ou uma ligação; Enter ativa.');
      return false;
    }
    var r = this._executar(alvos[this.foco]);
    var novos = this._alvos();
    this.foco = novos.length && novos[0].tipo === 'encaixe' ? 0 : Math.min(this.foco, novos.length - 1);
    return r;
  }

  /* ── fala ──────────────────────────────────────────────────── */

  _falado(txt) { return txt.replace(/[₀-₉]/g, function (c) { return String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)); }); }

  _descreverAtomo(id) {
    var a = this.g.atomos[id], s = this._falado(Q3.Desenho.rotulo(this.g, id));
    if (a.el === 'C') s += ', carbono ' + this.g.classeCarbono(id);
    else if (a.el !== 'C') s += ', ' + Q3.Desenho.NOMES[a.el].toLowerCase();
    var livres = this.g.capacidade(id);
    return s + (livres ? ', ' + livres + ' valência' + (livres > 1 ? 's' : '') + ' livre' + (livres > 1 ? 's' : '') : ', completo');
  }

  _descreverAlvo(alvo) {
    if (alvo.tipo === 'encaixe') return 'Encaixe livre. Enter anexa ' + Q3.Desenho.NOMES[this.elemento].toLowerCase() + '.';
    if (alvo.tipo === 'atomo') return this._descreverAtomo(alvo.id) + '.';
    var l = this.g.ligacao(alvo.a, alvo.b);
    return 'Ligação ' + NOME_ORDEM[l.ordem] + ' entre ' + this.g.atomos[alvo.a].el + ' e ' + this.g.atomos[alvo.b].el +
      (this.ferramenta === 'anexar' ? '. Enter muda a ordem.' : '.');
  }

  /* Diz o que mudou na CLASSIFICAÇÃO — é o que o aluno está aprendendo. */
  _anunciar(msg, antes) {
    var depois = this.g.classificar(), mud = [];
    CRITERIOS.forEach(function (c) { if (antes[c[0]] !== depois[c[0]]) mud.push(depois[c[0]]); });
    announce(msg + (mud.length ? ' A cadeia agora é ' + mud.join(' e ') + '.' : ''));
  }

  /* ── desenho ───────────────────────────────────────────────── */

  desenhar(ctx, W, H) {
    var agora = performance.now();
    this._animar(this._ultimoQuadro ? Math.min(0.05, (agora - this._ultimoQuadro) / 1000) : 0);
    this._ultimoQuadro = agora;
    this._sincronizarVis();
    var vi = Q3.Representacoes.vista(this.vista);
    this.nav3.sincronizar();                  // a barra de navegação serve às duas: espaciais…
    this.nav2.sincronizar();                  // …e planas (sem o botão recentrar)
    if (vi.tresD) this._desenhar3D(ctx, W, H);
    else {
      this._calcVista(W, H);
      if (vi.edita) this._desenharCondensada(ctx, W, H);
      else this._desenharPlana(ctx, W, H);
    }
  }
  /* a letra dos rótulos acompanha a escala (antes parava em 21 px: com a escala que cresce com a área, o CH₄ do
     começo ficava miúdo no computador) */
  _fonte(esc) { return Math.max(12, Math.min(28, Math.round(esc * 0.26))); }

  _desenharPlana(ctx, W, H) {
    var self = this, esc = this._vista.esc;
    Q3.Representacoes.desenharPlana(ctx, this.vista, {
      g: this.g, T: function (id) { return self._tela(self.vis[id]); }, esc: esc,
      cores: Q3.Desenho.paleta(), aneis: this._aneis(), estereo: this._estereo(), posH: this._posicoesH(), fonte: this._fonte(esc)
    });
  }

  /* A molécula no espaço: coordenadas 3D reais (geometria-3d.js),
     recalculadas só quando a estrutura muda; desenhada no estilo do
     visualizador 3D do SILQ (representacoes.js). */
  _desenhar3D(ctx, W, H) {
    var cores = Q3.Desenho.paleta(), b = document.body;
    this.cam3.passo();                        // transição em curso (ajustar, recentrar, focar)
    var chave = this.versao + (this.tensao ? '|tensão' : '');
    if (this._chave3d !== chave) {
      var antes = this._mol3, mesmaMolecula = this._versao3d === this.versao;
      this._chave3d = chave;
      this._mol3 = Q3.Geometria3D.embutir(this.g, this.pos, { tensao: this.tensao });
      if (this.centro3d && !this.g.atomos[this.centro3d]) this.centro3d = null;
      if (!mesmaMolecula) this.cam3.alvo = [0, 0, 0];   // molécula nova: o centro volta a ser o dela
      /* Alternar a tensão ANIMA a troca de geometria (0,7 s): os átomos, as
         nuvens e os números dos ângulos deslizam juntos — o movimento torna
         visível até uma mudança de 2°. Mesma conformação nas duas (a tensão
         vem depois dela), então só os ângulos se mexem. */
      this._morph = mesmaMolecula && antes && !OrbitCamera.movimentoReduzido() ? { de: antes, t0: performance.now(), ms: 700 } : null;
      this._versao3d = this.versao;
    }
    var molDesenho = this._mol3;
    if (this._morph) {
      var kk = Math.min(1, (performance.now() - this._morph.t0) / this._morph.ms), e = kk * kk * (3 - 2 * kk), deAt = {};
      this._morph.de.atomos.forEach(function (a) { deAt[a.id] = a; });
      molDesenho = { ligacoes: this._mol3.ligacoes, planoZ: this._mol3.planoZ, tensao: this._mol3.tensao,
        atomos: this._mol3.atomos.map(function (a) { var o = deAt[a.id]; if (!o) return a;
          return { id: a.id, el: a.el, h: a.h, pai: a.pai, x: o.x + (a.x - o.x) * e, y: o.y + (a.y - o.y) * e, z: o.z + (a.z - o.z) * e }; }) };
      if (kk >= 1) this._morph = null;
    }
    var centro = this.centro3d || this._centroPadrao();
    var nv = this.vista === 'esfera' && centro ? Q3.Geometria3D.nuvens(this.g, molDesenho, centro, this.tensao) : { lista: [], ideal: 0 };
    var f = this._faixas(W, H);
    this._r3 = Q3.Representacoes.desenhar3D(ctx, this.vista, { mol: molDesenho, cam: this.cam3, W: W, H: H,
      claro: cores.claro, contraste: b.classList.contains('high-contrast'), centro: centro,
      nuvens: nv.lista, tensao: this.tensao, idealCentro: nv.ideal, topo: f.topo, base: f.base });
    this._centro3dVisto = centro;   // o que o HUD dizia (o centro, a tensão, a legenda) agora está nos Resultados
  }

  /* Centro padrão dos ângulos: o átomo pesado com mais ligações (o
     ponto de ramificação costuma ser o mais interessante de olhar). */
  _centroPadrao() {
    var g = this.g, melhor = null, n = -1;
    this._ids().forEach(function (id) {
      var k = g.vizinhos(id).length + g.hidrogenios(id);
      if (k >= 2 && k > n) { n = k; melhor = id; }
    });
    return melhor;
  }

  /* "CH₂ · sp³ · tetraédrica" — o que o HUD e o anúncio dizem do centro. */
  /* O que a tensão angular faz no centro escolhido — honesto com os casos
     que contrariam a regra simples: no éter, os dois grupos volumosos se
     empurram mais do que os pares isolados fecham, e o ângulo ABRE
     (111,7°). Por isso compara com o ângulo real do modelo. Em anel
     pequeno, o desvio de Baeyer, (109°28′ − α)/2, como nos livros. */
  _notaTensao(id) {
    var g = this.g;
    if (!id || !g.atomos[id] || !this._mol3) return '';
    var lp = Q3.Geometria3D.paresIsoladosDe(g, id), hib = Q3.Geometria.hibridizacao(g, id), partes = [];
    var aneis = this._aneis().filter(function (r) { return r.indexOf(id) >= 0; });
    var menor = aneis.length ? Math.min.apply(null, aneis.map(function (r) { return r.length; })) : 0;
    var gm = function (x) { var gr = Math.floor(x), mi = Math.round((x - gr) * 60); if (mi === 60) { gr++; mi = 0; } return gr + '°' + (mi < 10 ? '0' : '') + mi + '′'; };
    if (menor >= 3 && menor <= 5 && hib === 'sp3') partes.push('anel de ' + menor + ': desvio de Baeyer ' + gm((109 + 28 / 60 - 180 * (menor - 2) / menor) / 2) + ' por ligação' +
      (this.tensao && menor <= 4 ? '  ·  as nuvens abrem até ' + (menor === 3 ? 104 : 98) + '°: ligações curvas' : ''));
    if (menor === 6 && hib === 'sp3' && aneis.length === 1) partes.push('anel de 6 em cadeira: sem tensão (109,5°)');
    // ângulo médio real entre as ligações do centro, no modelo
    var P = {}; this._mol3.atomos.forEach(function (a) { P[a.id] = [a.x, a.y, a.z]; });
    var vz = this._mol3.ligacoes.filter(function (l) { return l.a === id || l.b === id; }).map(function (l) { return l.a === id ? l.b : l.a; });
    var soma = 0, n = 0;
    if (!aneis.length) for (var i = 0; i < vz.length; i++) for (var j = i + 1; j < vz.length; j++) { soma += Q3.Geometria3D.angulo(P[vz[i]], P[id], P[vz[j]]); n++; }
    var media = n ? soma / n : 0, ideal = hib === 'sp3' ? 109.47 : hib === 'sp2' ? 120 : 180;
    var num = function (x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); };
    var ppl = lp > 1 ? ' pares isolados' : ' par isolado';
    if (!this.tensao) {
      if (lp) partes.push(lp + ppl + ' do tamanho das ligações');
      return 'tensão angular desligada  ·  ' + (partes.length ? partes.join('  ·  ') + '  ·  ' : '') + 'ângulos ideais da hibridização';
    }
    if (n && vz.length >= 2 && Math.abs(media - ideal) > 0.4) {
      if (lp && media < ideal) partes.push(lp + ppl + (lp > 1 ? ' ocupam' : ' ocupa') + ' mais espaço e fecham as ligações: ' + num(media) + '°');
      else if (lp && media > ideal) partes.push('os grupos volumosos se empurram mais do que ' + (lp > 1 ? 'os pares isolados fecham' : 'o par isolado fecha') + ': ' + num(media) + '°');
      else if (hib === 'sp2') partes.push('a dupla ocupa mais espaço e fecha as simples');
      else partes.push('grupos volumosos se afastam mais que os H');
    }
    if (!partes.length) partes.push(lp ? lp + ppl + ' (fora da ligação: nada a comprimir)' : 'nuvens equivalentes: nada muda');
    return 'tensão angular ligada  ·  ' + partes.join('  ·  ');
  }

  _descreverCentro(id) {
    if (!id || !this.g.atomos[id]) return 'toque num átomo para ver os ângulos em volta dele';
    var g = this.g, hib = Q3.Geometria.hibridizacao(g, id), ligs = g.vizinhos(id).length + g.hidrogenios(id);
    var dom = ligs + Q3.Lewis.atomo(g, id).pares;
    var geo = ligs < 2 ? '—' : dom === 4 ? (ligs === 4 ? 'tetraédrica' : ligs === 3 ? 'piramidal' : 'angular')
            : dom === 3 ? (ligs === 3 ? 'trigonal plana' : 'angular') : 'linear';
    return Q3.Desenho.rotulo(g, id) + '  ·  ' + { sp3: 'sp³', sp2: 'sp²', sp: 'sp' }[hib] + '  ·  ' + geo;
  }

  _desenharCondensada(ctx, W, H) {
    var self = this, P = Q3.Desenho, cores = P.paleta(), g = this.g, esc = this._vista.esc;
    var fonte = this._fonte(esc);
    var ids = this._ids(), med = {}, rot = {};
    ids.forEach(function (id) { rot[id] = P.rotulo(g, id); med[id] = P.medirRotulo(ctx, rot[id], fonte); });
    var T = function (id) { return self._tela(self.vis[id]); };

    // ligações; a segunda linha da dupla de anel vai para DENTRO do anel
    var aneis = this._aneis();
    g.ligacoes.forEach(function (l) {
      var interno = null;
      for (var i = 0; i < aneis.length; i++) {
        var r = aneis[i], ia = r.indexOf(l.a), ib = r.indexOf(l.b);
        if (ia >= 0 && ib >= 0 && (Math.abs(ia - ib) === 1 || Math.abs(ia - ib) === r.length - 1)) {
          var cx = 0, cy = 0;
          r.forEach(function (id) { var p = T(id); cx += p.x; cy += p.y; });
          interno = { x: cx / r.length, y: cy / r.length }; break;
        }
      }
      var cunha = self._estereo().ligacoes[l.a < l.b ? l.a + '|' + l.b : l.b + '|' + l.a];
      if (cunha) {
        var outro = cunha.estreito === l.a ? l.b : l.a;
        P.cunha(ctx, T(cunha.estreito), T(outro), med[cunha.estreito], med[outro], cunha.tipo,
          { cor: cores.suave, meia: Math.max(3.5, esc * 0.07), traco: Math.max(1.4, esc * 0.022) });
        return;
      }
      P.ligacao(ctx, T(l.a), T(l.b), l.ordem, med[l.a], med[l.b],
        { cor: cores.suave, largura: Math.max(2, Math.min(3.4, esc * 0.042)), espacamento: Math.max(4, esc * 0.07), interno: interno });
    });

    // foco de teclado numa ligação
    var alvos = this.foco >= 0 ? this._alvos() : [];
    var alvoFoco = alvos[this.foco];
    if (alvoFoco && alvoFoco.tipo === 'ligacao') {
      var fa = T(alvoFoco.a), fb = T(alvoFoco.b);
      P.foco(ctx, { x: (fa.x + fb.x) / 2, y: (fa.y + fb.y) / 2 }, 14, cores.acento);
    }

    // encaixe
    var enc = this._encaixe(), pe = null;
    if (enc && this.vis[this.sel]) {
      pe = this._tela({ x: this.vis[this.sel].x + enc.x - this.pos[this.sel].x,
                            y: this.vis[this.sel].y + enc.y - this.pos[this.sel].y });
      P.encaixe(ctx, T(this.sel), pe, this.elemento, cores, this._reduzido() ? 0 : (Math.sin(this.t * 3) + 1) / 2);
      if (alvoFoco && alvoFoco.tipo === 'encaixe') P.foco(ctx, pe, 28, cores.acento);
    }

    // átomos, com o anel da classe do carbono
    ids.forEach(function (id) {
      var el = g.atomos[id].el, classe = el === 'C' ? Math.min(4, self._nC(id)) : null;
      var p = T(id);
      P.atomo(ctx, p, rot[id], fonte, cores, {
        corTexto: cores.elementos[el] || cores.texto,
        aro: (classe !== null && ids.length > 1) ? cores.classes[classe] : null,
        destaque: (self.ferramenta === 'anexar' && id === self.sel) || id === self.ligarDe
      });
      if (classe !== null && ids.length > 1) {
        // selo 1°–4° no lado com mais espaço em volta do átomo
        var angs = g.vizinhos(id).map(function (v) { var q = T(v.id); return Math.atan2(q.y - p.y, q.x - p.x); });
        // o + do átomo selecionado mora no maior vão livre — exatamente onde o
        // selo iria. Conta como direção ocupada, senão os dois se sobrepõem.
        if (pe && id === self.sel) angs.push(Math.atan2(pe.y - p.y, pe.x - p.x));
        angs.sort(function (a, b) { return a - b; });
        var ang = -Math.PI / 4;
        if (angs.length) {
          var melhor = 0, ini = angs[angs.length - 1];
          for (var i = 0; i < angs.length; i++) {
            var gap = (angs[i] - (i ? angs[i - 1] : ini - 2 * Math.PI));
            if (gap > melhor) { melhor = gap; ang = (i ? angs[i - 1] : ini - 2 * Math.PI) + gap / 2; }
          }
        }
        P.seloClasse(ctx, p, classe, cores.classes[classe], Math.cos(ang), Math.sin(ang), Math.max(med[id].mx, med[id].my) + 10, Math.max(11, Math.round(fonte * 0.62)));
      }
      if (alvoFoco && alvoFoco.tipo === 'atomo' && alvoFoco.id === id) P.foco(ctx, p, Math.max(med[id].mx, med[id].my) + 9, cores.acento);
    });
    /* "?" nos carbonos cujas cunhas deixam o desenho AMBÍGUO (não definem
       configuração). Âmbar com contorno escuro: sobre o fundo claro o âmbar
       sozinho não teria contraste de elemento gráfico (3:1). */
    var hc = document.body.classList.contains('high-contrast'), claro = document.body.classList.contains('light-mode');
    this._ambiguos().forEach(function (c) {
      if (!g.atomos[c] || !med[c]) return;
      var p = T(c), r = Math.max(med[c].mx, med[c].my) + 11, q = { x: p.x - r * 0.72, y: p.y - r * 0.72 };
      ctx.save();
      ctx.beginPath(); ctx.arc(q.x, q.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = hc ? '#ffff00' : '#f0b429'; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = hc ? '#000000' : (claro ? '#5c3d00' : '#1a1200'); ctx.stroke();
      ctx.fillStyle = '#1a1200'; ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', q.x, q.y + 0.5);
      ctx.restore();
    });

  }

  /* Estereoquímica das vistas planas: que ligação sai do papel. Vem da
     geometria 3D real (geometria-3d.js), recalculada só quando a
     estrutura muda — a mesma que a esfera e bastão desenha. */
  _estereo() {
    if (this._chaveEst !== this.versao) {
      this._chaveEst = this.versao;
      if (this._chave3d !== this.versao) { this._chave3d = this.versao; this._mol3 = Q3.Geometria3D.embutir(this.g, this.pos); }
      this._est = Q3.Geometria3D.estereo(this.g, this._mol3);
    }
    return this._est;
  }
  /* Onde desenhar cada H nas vistas planas (completa e Lewis): calculado
     uma vez por mudança da molécula, em unidades do desenho — o ângulo
     de um H não depende de zoom nem de pan. 0,72 = C–H no desenho plano. */
  _posicoesH() {
    if (this._chavePosH !== this.versao) {
      this._chavePosH = this.versao;
      var pos = this.pos;
      this._posH = Q3.Lewis.posicoesH(this.g, function (id) { return pos[id]; }, 0.72);
    }
    return this._posH;
  }

  _temCunhas() {
    var e = this._estereo();
    if (Object.keys(e.ligacoes).length) return true;
    if (this.vista !== 'completa' && this.vista !== 'lewis') return false;
    return Object.keys(e.hidrogenios).some(function (k) { return e.hidrogenios[k].some(function (t) { return t !== 'plano'; }); });
  }

  /* O QUE ERA TEXTO NA CENA, agora nos Resultados: a dica de como mexer vira o próximo passo (ela muda com a
     ferramenta e com a vista), e a contagem de Lewis, a legenda das cunhas e, nas vistas espaciais, o centro dos
     ângulos e a nota da tensão viram linhas da ficha. */
  proximoPasso() {
    if (!this.ativo) return '';
    var vi = Q3.Representacoes.vista(this.vista);
    if (vi.tresD) {
      if (this._dicaTemp && performance.now() < this._dicaTemp.ate) return this._dicaTemp.texto;
      var celular = typeof ehCelular === 'function' && ehCelular();
      return (celular ? 'Arraste para girar; com dois dedos, mova e amplie.' : 'Arraste para girar; Shift ou o botão direito movem; a rolagem amplia; o duplo clique ajusta.') +
        (this.vista === 'esfera' ? ' Toque num átomo para ver os ângulos em volta dele.' : '') + ' Para montar, volte à estrutural condensada.';
    }
    return this._dica();
  }
  _dica() {
    if (this._dicaTemp && performance.now() < this._dicaTemp.ate) return this._dicaTemp.texto;
    var vi = Q3.Representacoes.vista(this.vista);
    if (!vi.edita) return vi.nome + ': só para ver. Para montar, volte à estrutural condensada.';
    if (this.ferramenta === 'ligar') return this.ligarDe ? 'Toque no segundo átomo para fechar o anel.' : 'Toque em dois átomos para ligá-los.';
    if (this.ferramenta === 'apagar') return 'Toque num átomo ou numa ligação para remover.';
    if (this.ferramenta === 'cunha' && this._ambiguos().length) return 'O ? marca cunhas ambíguas: o desenho não define a configuração desse carbono. Mude uma delas de lugar.';
    if (this.ferramenta === 'cunha') return 'Toque numa ligação simples: ela ' + ({ frente: 'vem para a frente', tras: 'vai para trás', plano: 'fica no plano' })[this.cunhaTipo] + '. Tocar de novo volta ao automático.';
    if (this.g.pesados().length >= Q3.TETO_PESADOS) return 'Teto de ' + Q3.TETO_PESADOS + ' átomos pesados atingido.';
    if (!this._encaixe()) return 'Esse átomo está completo: toque em outro átomo.';
    return 'Toque no + para anexar ' + Q3.Desenho.NOMES[this.elemento].toLowerCase() + ', ou numa ligação para mudar a ordem.';
  }

  /* ── painel de resultados ──────────────────────────────────── */

  resultados() {
    var g = this.g, c = g.classificar(), self = this;
    var formula = g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); });
    var cond = g.formulaCondensada();
    var linhas = [
      { l: 'Fórmula molecular', v: formula },
      { l: 'Fórmula condensada', v: cond === null ? '— (cadeia fechada)' : cond.replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); }) },
      { l: 'Átomos pesados', v: g.pesados().length + ' de ' + Q3.TETO_PESADOS }
    ];
    CRITERIOS.forEach(function (x) { linhas.push({ l: x[1], v: c[x[0]] }); });
    var cont = [0, 0, 0, 0, 0];
    g.pesados().forEach(function (id) { if (g.atomos[id].el === 'C') cont[Math.min(4, self._nC(id))]++; });
    var nomes = ['nulários', 'primários', 'secundários', 'terciários', 'quaternários'];
    cont.forEach(function (n, i) { if (n || (i >= 1 && g.pesados().length > 1)) linhas.push({ l: 'Carbonos ' + nomes[i], v: String(n) }); });
    // o que antes era escrito no rodapé da cena (ou no HUD das vistas espaciais)
    var vi = Q3.Representacoes.vista(this.vista), limpa = function (t) { return String(t).replace(/\s+·\s+/g, ' · '); };
    if (this.vista === 'lewis') linhas.push({ l: 'Contagem de Lewis', v: limpa(Q3.Representacoes.contagemLewis(g)), cls: 'val-texto' });
    if (!vi.tresD && this._temCunhas()) linhas.push({ l: 'Cunhas', v: 'cheia: vem para a frente · tracejada: vai para trás', cls: 'val-texto' });
    if (this.vista === 'esfera') {
      var c3 = this._centro3dVisto || this.centro3d || this._centroPadrao();
      if (c3 && g.atomos[c3]) {
        linhas.push({ l: 'Centro dos ângulos', v: limpa(this._descreverCentro(c3)), cls: 'val-texto' });
        // os mesmos valores dos rótulos da cena (ângulos iguais dividem um rótulo: 109,5° × 6)
        if (this._r3 && this._r3.rotulos && this._r3.rotulos.length) linhas.push({ l: 'Ângulos', v: this._r3.rotulos.join(' · ') });
        var nt = this._notaTensao(c3); if (nt) linhas.push({ l: 'Tensão angular', v: limpa(nt).replace(/^tensão angular (ligada|desligada) · /, '$1 · '), cls: 'val-texto' });
      }
      linhas.push({ l: 'Ligações', v: 'cunha cheia: para a frente · tracejada: para trás · traço: no plano', cls: 'val-texto' });
    } else if (this.vista === 'compacto') linhas.push({ l: 'Modelo', v: 'compacto: raios de van der Waals, em escala', cls: 'val-texto' });
    return linhas;
  }

  /* A app já monta a pílula como "<módulo> ativo · <isto>": repetir o
     nome do módulo aqui fazia ele aparecer duas vezes. */
  overlay() {
    var n = this.g.pesados().length, vi = Q3.Representacoes.vista(this.vista);
    var f = this.g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); });
    return vi.edita ? f + ' · ' + n + ' de ' + Q3.TETO_PESADOS + ' átomos' : f + ' · ' + vi.nome.toLowerCase();
  }
}
