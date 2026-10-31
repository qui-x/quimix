/* ═══════════════════════════════════════════════════════════════
   CAMADA: VISTA 3D
   ARQUIVO: js/view3d/navegacao-3d.js
   ───────────────────────────────────────────────────────────────
   NAVEGAÇÃO — um módulo só para as vistas espaciais E planas do SIQC.
   (O nome ficou do tempo em que servia só ao 3D; com a Camera2D, no fim
   deste arquivo, as vistas planas usam os mesmos gestos, teclas e botões:
   ali, arrastar move em vez de girar, e o botão recentrar some.)

   Antes, cada vista 3D tinha a sua (o editor de cadeias e o módulo de
   hibridização, cada um com os próprios ouvintes de ponteiro), e as
   duas só giravam — uma nem tinha zoom. Esta é a navegação do OrbisV,
   com quatro coisas que nem ele tem.

   GESTOS
     mouse / 1 dedo ........ arrastar gira
     Shift, botão direito
       ou do meio .......... arrastar move a vista (pan)
     2 dedos ............... pinça amplia; arrastar os dois move a vista
     rolagem ............... amplia em direção ao cursor
     duplo clique / toque .. ajusta a molécula à tela
   TECLADO (com o canvas em foco)
     setas ................. giram (vêm da app, pelo onArrow da simulação)
     Shift + setas ......... movem a vista
     + e − ................. ampliam e reduzem
     F ..................... ajusta à tela
     0 ..................... recentra (posição e ângulo iniciais)
   BOTÕES NA TELA
     ampliar, reduzir, ajustar, recentrar — para quem não tem rolagem
     nem teclado. Uma barra só, compartilhada pelas vistas 3D.

   O QUE NEM O ORBISV TEM
     · o menu de contexto é suprimido nas vistas 3D: arrastar com o
       botão direito move a vista sem abrir o menu do navegador;
     · pan com dois dedos no celular;
     · transições suaves (recentrar, ajustar, focar num átomo), que
       respeitam o movimento reduzido;
     · a barra de botões.

   ROBUSTEZ
     · captura do ponteiro: um arraste que sai do canvas continua;
     · um arraste nunca vira toque: a simulação pergunta
       consumirClique() antes de tratar o clique que o navegador dispara
       ao fim do gesto;
     · as teclas próprias (Shift+setas, + − F 0) são tratadas na fase
       de captura, um nível acima do canvas, e não chegam à app — que
       trataria Shift+seta como giro.

   Uso:
     var nav = new Navegacao3D({
       canvas, camera,            // OrbitCamera
       ativo:  () => bool,        // esta vista 3D está na tela?
       escala: () => px por unidade (baseScale do desenho),
       fraseAjustar: 'Molécula inteira na tela.',
       centroTela: (w, h) => ({ x, y })   // onde o alvo fica na tela
     });
     nav.sincronizar()   uma vez por quadro (mostra ou esconde a barra)
     nav.consumirClique() no início do tratamento de clique
     nav.focarEm([x,y,z]) leva o centro de rotação a um ponto

   Depende de: camera-orbital.js, anuncios.js (announce).
═══════════════════════════════════════════════════════════════ */

'use strict';

class Navegacao3D {
  constructor(o) {
    this.canvas = o.canvas;
    this.cam = o.camera;
    this.ativo = o.ativo;
    this.escala = o.escala;
    this.fraseAjustar = o.fraseAjustar || 'Molécula inteira na tela.';
    this.vistaPapel = !!o.vistaPapel;
    // região da tela que a navegação cede (ex.: arrastar um elétron num diagrama)
    this.cede = o.cede || null;       // botão e tecla P: câmera alinhada com o campo editável
    /* centro da vista na tela: o alvo fica nele, e o zoom em direção ao
       cursor mede a partir dele. Cada vista tem o seu (a área útil
       desconta o topo e o rodapé), então quem desenha informa. */
    this.centroTela = o.centroTela || function (w, h) { return { x: w / 2, y: h / 2 }; };
    /* Onde um duplo clique (ou duplo toque) pode AJUSTAR. Na vista em que
       se edita tocando, só no espaço vazio: o aluno toca várias vezes
       seguidas no + para crescer uma cadeia, e esses toques são dele. */
    this.podeAjustarEm = o.podeAjustarEm || function () { return true; };
    this._clique = false;
    this._dedos = new Map();
    this._arraste = null;
    this._pinca = null;
    this._ultimoToque = null;
    this._anuncioZoom = 0;
    if (!this.canvas) return;
    this.barra = Navegacao3D._barra(this.canvas);
    this._ligar();
  }

  /* ── o que a simulação chama ───────────────────────────────── */

  consumirClique() { var c = this._clique; this._clique = false; return c; }

  /* Mostra a barra quando esta vista 3D está na tela; esconde quando
     nenhuma está. Só a vista ativa chama isto por quadro, então quem
     sai de cena é notado pela próxima que desenhar. */
  sincronizar() {
    var b = this.barra; if (!b) return;
    if (this.ativo()) {
      Navegacao3D.dono = this;
      if (b.hidden) b.hidden = false;
      // no plano não há giro: o botão recentrar faria o mesmo que ajustar
      var rc = b.querySelector('[data-nav="recentrar"]'), sem = !!this.cam.semGiro;
      if (rc && rc.hidden !== sem) rc.hidden = sem;
      var pp = b.querySelector('[data-nav="papel"]'), semPapel = !this.vistaPapel;
      if (pp && pp.hidden !== semPapel) pp.hidden = semPapel;
      return;
    }
    var d = Navegacao3D.dono;
    if (!d || d === this || !d.ativo()) { Navegacao3D.dono = null; if (!b.hidden) b.hidden = true; }
  }

  girarTeclado(dx, dy) { this.cam.arrastar(dx * 18, dy * 18); }

  aproximar() { this._zoomBotao(1.3); }
  afastar() { this._zoomBotao(1 / 1.3); }
  ajustar() {
    this.cam.animarPara({ zoom: 1, alvo: [0, 0, 0] }, 380);
    announce(this.fraseAjustar);
  }
  /* VISTA DO PAPEL: a câmera exatamente de frente para o plano do
     desenho — a molécula como está no campo editável, com o que foi
     marcado "frente" mais perto de quem olha. Girar muda a aparência (como
     girar uma maquete na mão); a configuração é a mesma, e esta vista é o
     jeito direto de comparar com o desenho. */
  papel() {
    if (!this.vistaPapel) return;
    this.cam.animarPara({ yaw: 0, pitch: 0, alvo: [0, 0, 0] }, 420);
    announce('Vista do papel: a molécula como no campo editável. O que está marcado para a frente fica mais perto de você.');
  }

  recentrar() {
    this.cam.animarPara({ yaw: this.cam.padrao.yaw, pitch: this.cam.padrao.pitch, zoom: 1, alvo: [0, 0, 0] }, 380);
    announce('Câmera na posição inicial.');
  }
  focarEm(ponto) { this.cam.animarPara({ alvo: ponto }, 420); }

  _zoomBotao(f) {
    var alvoZoom = Math.max(OrbitCamera.ZOOM_MIN, Math.min(OrbitCamera.ZOOM_MAX, this.cam.zoom * f));
    this.cam.animarPara({ zoom: alvoZoom }, 200);
    announce('Ampliação ' + (Math.round(alvoZoom * 10) / 10).toString().replace('.', ',') + ' vezes.');
  }

  /* ── ouvintes ──────────────────────────────────────────────── */

  /* na CENA: um card flutuante pode deslocá-la (ver sidebar-rail.js · Oclusao; o shell publica cenaX/cenaW no canvas) */
  _local(e) { var r = this.canvas.getBoundingClientRect(), cv = this.canvas; return { x: e.clientX - r.left - (cv.cenaX || 0), y: e.clientY - r.top, w: cv.cenaW || r.width, h: r.height }; }
  /* distância do ponto ao centro da vista (o alvo fica no centro) */
  _doCentro(p) { var c = this._centro(); return { x: p.x - c.x, y: p.y - c.y }; }
  _centro() { var r = this.canvas.getBoundingClientRect(); return this.centroTela(this.canvas.cenaW || r.width, r.height); }

  _ligar() {
    var self = this, cv = this.canvas;
    cv.addEventListener('pointerdown', function (e) {
      if (!self.ativo()) return;
      if (self.cede) { var r0 = cv.getBoundingClientRect(); if (self.cede(e.clientX - r0.left - (cv.cenaX || 0), e.clientY - r0.top)) return; }
      self._dedos.set(e.pointerId, { x: e.clientX, y: e.clientY, tipo: e.pointerType });
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* sem captura, segue */ }
      if (self._dedos.size === 2) {
        var p = Array.from(self._dedos.values());
        self._pinca = { d: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), m: { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 } };
        self._arraste = null;
        self._clique = true;                  // gesto de dois dedos nunca é toque
        return;
      }
      if (self._dedos.size > 2) return;
      var mover = e.shiftKey || e.button === 1 || e.button === 2;
      self._arraste = { x: e.clientX, y: e.clientY, ux: e.clientX, uy: e.clientY, moveu: false, modo: mover ? 'pan' : 'girar' };
    });

    cv.addEventListener('pointermove', function (e) {
      if (!self._dedos.has(e.pointerId)) return;
      self._dedos.set(e.pointerId, { x: e.clientX, y: e.clientY, tipo: e.pointerType });
      if (self._pinca && self._dedos.size === 2) {
        var p = Array.from(self._dedos.values());
        var d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), m = { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 };
        var r = cv.getBoundingClientRect(), u = self._doCentro({ x: m.x - r.left - (cv.cenaX || 0), y: m.y - r.top });
        if (self._pinca.d > 0 && d > 0) self.cam.zoomEm(d / self._pinca.d, u.x, u.y, self.escala());
        self.cam.pan(m.x - self._pinca.m.x, m.y - self._pinca.m.y, self.escala());   // arrastar os dois dedos move
        self._pinca = { d: d, m: m };
        return;
      }
      var a = self._arraste;
      if (!a) return;
      if (!a.moveu && Math.hypot(e.clientX - a.x, e.clientY - a.y) < 6) return;
      a.moveu = true;
      var dx = e.clientX - a.ux, dy = e.clientY - a.uy;
      a.ux = e.clientX; a.uy = e.clientY;
      if (a.modo === 'pan' || e.shiftKey) self.cam.pan(dx, dy, self.escala());
      else self.cam.arrastar(dx, dy);
    });

    var soltar = function (e) {
      if (!self._dedos.has(e.pointerId)) return;
      var info = self._dedos.get(e.pointerId);
      self._dedos.delete(e.pointerId);
      try { cv.releasePointerCapture(e.pointerId); } catch (err) { /* já solto */ }
      var a = self._arraste;
      if (a && a.moveu) self._clique = true;
      // duplo toque (celular): ajusta à tela, e o 2º toque não vira seleção
      if (e.type === 'pointerup' && info && info.tipo === 'touch' && a && !a.moveu && !self._pinca) {
        var agora = OrbitCamera.agora(), u = self._ultimoToque;
        if (u && agora - u.t < 320 && Math.hypot(e.clientX - u.x, e.clientY - u.y) < 30) {
          self._ultimoToque = null;
          var lt = self._local(e);
          if (self.podeAjustarEm(lt.x, lt.y)) { self._clique = true; self.ajustar(); }
        } else self._ultimoToque = { t: agora, x: e.clientX, y: e.clientY };
      }
      if (self._dedos.size < 2) self._pinca = null;
      if (!self._dedos.size) self._arraste = null;
    };
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);

    cv.addEventListener('wheel', function (e) {
      if (!self.ativo()) return;
      e.preventDefault();
      var u = self._doCentro(self._local(e));
      self.cam.zoomEm(Math.exp(-e.deltaY * 0.0015), u.x, u.y, self.escala());
      var agora = OrbitCamera.agora();
      if (agora - self._anuncioZoom > 1500) {         // no máximo um anúncio por gesto de rolagem
        self._anuncioZoom = agora;
        setTimeout(function () { announce('Ampliação ' + (Math.round(self.cam.zoom * 10) / 10).toString().replace('.', ',') + ' vezes.'); }, 400);
      }
    }, { passive: false });

    cv.addEventListener('dblclick', function (e) {
      if (!self.ativo()) return;
      var lt = self._local(e);
      if (!self.podeAjustarEm(lt.x, lt.y)) return;
      e.preventDefault(); self.ajustar();
    });

    // o arraste com o botão direito move a vista: o menu do navegador não pode abrir
    cv.addEventListener('contextmenu', function (e) { if (self.ativo()) e.preventDefault(); });

    // teclas próprias, na captura, um nível acima: não chegam à app
    var acima = cv.parentElement || document;
    acima.addEventListener('keydown', function (e) {
      if (!self.ativo() || e.target !== cv) return;
      var passo = 30, tratou = true;
      if (e.shiftKey && e.key === 'ArrowLeft') self.cam.pan(-passo, 0, self.escala());
      else if (e.shiftKey && e.key === 'ArrowRight') self.cam.pan(passo, 0, self.escala());
      else if (e.shiftKey && e.key === 'ArrowUp') self.cam.pan(0, -passo, self.escala());
      else if (e.shiftKey && e.key === 'ArrowDown') self.cam.pan(0, passo, self.escala());
      else if (e.key === '+' || e.key === '=') self.aproximar();
      else if (e.key === '-' || e.key === '_') self.afastar();
      else if (e.key === 'f' || e.key === 'F') self.ajustar();
      else if (e.key === '0' || e.key === 'Home') self.recentrar();
      else if ((e.key === 'p' || e.key === 'P') && self.vistaPapel) self.papel();
      else tratou = false;
      if (tratou) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  }
}

Navegacao3D.dono = null;

/* ═══ CÂMERA PLANA — a mesma navegação, para as vistas 2D ═════════════
   Mesma interface da OrbitCamera (arrastar, pan, zoomEm, animarPara,
   passo), para o MESMO módulo de navegação servir às vistas planas.
   No plano não há o que girar: arrastar MOVE. O deslocamento (alvo) é em
   pixels de tela, e zoom é um multiplicador sobre o enquadramento
   automático de quem desenha.
   `manual` diz se o aluno já mexeu na vista: enquanto for false, quem
   desenha continua enquadrando sozinho; ao primeiro gesto, a vista fica
   onde ele deixou. Ajustar (zoom 1, deslocamento 0) devolve ao automático
   quando a transição termina. */
class Camera2D {
  constructor() {
    this.zoom = 1;
    this.alvo = [0, 0, 0];
    this.padrao = { yaw: 0, pitch: 0 };
    this.semGiro = true;
    this.manual = false;
    this._anim = null;
  }
  arrastar(dx, dy) { this.pan(dx, dy); }                       // no plano, arrastar move
  pan(dx, dy) { this._anim = null; this.alvo[0] += dx; this.alvo[1] += dy; this.manual = true; if (this.aoMexer) this.aoMexer(); }
  /* amplia em direção ao ponto (ux, uy) px, contado do centro da vista:
     o que está sob o cursor fica sob o cursor */
  zoomEm(f, ux, uy) {
    this._anim = null;
    var z0 = this.zoom, z1 = Math.max(Camera2D.ZOOM_MIN, Math.min(Camera2D.ZOOM_MAX, z0 * f));
    if (z1 === z0) return;
    var k = 1 - z1 / z0;
    this.alvo[0] += ((ux || 0) - this.alvo[0]) * k;
    this.alvo[1] += ((uy || 0) - this.alvo[1]) * k;
    this.zoom = z1; this.manual = true;
    if (this.aoMexer) this.aoMexer();
  }
  animarPara(para, ms) {
    var destino = {
      zoom: para.zoom !== undefined ? Math.max(Camera2D.ZOOM_MIN, Math.min(Camera2D.ZOOM_MAX, para.zoom)) : this.zoom,
      alvo: para.alvo ? [para.alvo[0], para.alvo[1], 0] : this.alvo.slice()
    };
    var ajuste = destino.zoom === 1 && !destino.alvo[0] && !destino.alvo[1];
    if (!ajuste) this.manual = true;
    if (OrbitCamera.movimentoReduzido() || !ms) {
      this._anim = null; this.zoom = destino.zoom; this.alvo = destino.alvo;
      if (ajuste) this.manual = false;
      return;
    }
    this._anim = { de: { zoom: this.zoom, alvo: this.alvo.slice() }, para: destino, t0: OrbitCamera.agora(), ms: ms, ajuste: ajuste };
  }
  passo() {
    var a = this._anim;
    if (!a) return false;
    var k = Math.min(1, (OrbitCamera.agora() - a.t0) / a.ms), e = 1 - Math.pow(1 - k, 3);
    this.zoom = a.de.zoom + (a.para.zoom - a.de.zoom) * e;
    this.alvo = [0, 1].map(function (i) { return a.de.alvo[i] + (a.para.alvo[i] - a.de.alvo[i]) * e; }).concat([0]);
    if (k >= 1) { this._anim = null; if (a.ajuste) this.manual = false; }
    return true;
  }
  get animando() { return !!this._anim; }
}
Camera2D.ZOOM_MIN = 0.5;
Camera2D.ZOOM_MAX = 6;

/* A barra de botões: uma só por canvas, compartilhada pelas vistas 3D;
   cada clique vai para a navegação que está com a tela no momento. */
Navegacao3D._barra = function (canvas) {
  var wrap = canvas.parentElement;
  if (!wrap) return null;
  var b = wrap.querySelector('.nav3d');
  if (b) return b;
  var svg = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
  var botoes = [
    ['aproximar', 'Ampliar (tecla +)', svg('<circle cx="11" cy="11" r="7"/><path d="M11 8v6M8 11h6M20 20l-4-4"/>')],
    ['afastar', 'Reduzir (tecla −)', svg('<circle cx="11" cy="11" r="7"/><path d="M8 11h6M20 20l-4-4"/>')],
    ['ajustar', 'Ajustar à tela (tecla F, ou duplo clique)', svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>')],
    ['recentrar', 'Recentrar a câmera (tecla 0)', svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>')],
    ['papel', 'Vista do papel: como no campo editável (tecla P)', svg('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 13h7M9 17h5"/>')]
  ];
  b = document.createElement('div');
  b.className = 'nav3d';
  b.setAttribute('role', 'toolbar');
  b.setAttribute('aria-label', 'Navegação 3D');
  b.setAttribute('aria-orientation', 'vertical');
  b.hidden = true;
  b.innerHTML = botoes.map(function (x) {
    return '<button type="button" class="nav3d-btn" data-nav="' + x[0] + '" aria-label="' + x[1] + '" title="' + x[1] + '">' + x[2] + '</button>';
  }).join('');
  b.addEventListener('click', function (e) {
    var bt = e.target.closest('[data-nav]');
    if (bt && Navegacao3D.dono) Navegacao3D.dono[bt.getAttribute('data-nav')]();
  });
  wrap.appendChild(b);
  return b;
};
