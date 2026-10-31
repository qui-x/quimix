/* ═══════════════════════════════════════════════════════════════
   CAMADA: VISTA 3D
   ARQUIVO: js/view3d/camera-orbital.js
   ───────────────────────────────────────────────────────────────
   Câmera orbital: gira em torno de um ALVO por guinada (yaw, eixo y) e
   arfagem (pitch, eixo x), com perspectiva suave e ampliação (zoom).

   ORIGEM: a classe OrbitCamera de primeiroano/silq/js/view3d/view3d.js
   (a especificação do SIQC manda reaproveitar o view3d.js). project()
   continua IDÊNTICO ao do SILQ quando o alvo está na origem — que é o
   estado padrão —, para as duas câmeras terem a mesma sensação.

   O QUE FOI ACRESCENTADO (navegação robusta, modelo do OrbisV)
     · ALVO móvel: o ponto em torno do qual se gira, que fica no centro
       da tela. É o que permite mover a vista (pan) e girar em torno do
       átomo que o aluno está estudando.
     · pan(): move o alvo no plano da tela, na medida do arraste.
     · zoomEm(): amplia em direção a um ponto da tela — o que está sob o
       cursor continua sob o cursor, como num mapa. O OrbisV aproxima
       movendo a câmera (dolly); aqui é AMPLIAÇÃO, como nos
       visualizadores de moléculas: de perto, o dolly faz o átomo mais
       próximo inchar com a perspectiva e deixa a câmera entrar na
       molécula.
     · animarPara() / passo(): transição suave (380 ms, desaceleração
       cúbica) para recentrar, ajustar e focar num átomo. Com movimento
       reduzido, o salto é imediato.
     · girar(): a mesma rotação sem perspectiva nem alvo — para
       direções (o encurtamento de um eixo visto de lado).

   Unidades: as de quem desenha. As representações normalizam a
   molécula para raio 1, então o alvo vive nessa escala.
   Convenção: y para cima (a tela cresce para baixo; project() inverte).
═══════════════════════════════════════════════════════════════ */

'use strict';

class OrbitCamera {
  constructor() {
    this.yaw   =  0.55;
    this.pitch =  0.30;
    this.zoom  =  1.0;
    this.alvo  = [0, 0, 0];
    this.padrao = { yaw: this.yaw, pitch: this.pitch };
    this._anim = null;
  }

  /** Posição inicial desta câmera — para onde "recentrar" volta. */
  definirPadrao(yaw, pitch) { this.padrao = { yaw: yaw, pitch: pitch }; this.yaw = yaw; this.pitch = pitch; }

  /** Projeta ponto 3D → tela 2D. cx,cy: centro da tela. baseScale: px por unidade. */
  project(x, y, z, cx, cy, baseScale) {
    x -= this.alvo[0]; y -= this.alvo[1]; z -= this.alvo[2];
    const cosY = Math.cos(this.yaw),   sinY = Math.sin(this.yaw);
    const cosP = Math.cos(this.pitch), sinP = Math.sin(this.pitch);
    const x1 =  x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    const y1 =  y * cosP - z1 * sinP;
    const z2 =  y * sinP + z1 * cosP;
    const focalLen = 3.5;
    const camZ = z2 + focalLen;
    const persp = focalLen / Math.max(0.1, camZ);
    const s = baseScale * this.zoom * persp;
    return { sx: cx + x1 * s, sy: cy - y1 * s, depth: camZ, persp };
  }

  /** A mesma rotação de project(), sem alvo, perspectiva nem deslocamento. */
  girar(x, y, z) {
    const cosY = Math.cos(this.yaw),   sinY = Math.sin(this.yaw);
    const cosP = Math.cos(this.pitch), sinP = Math.sin(this.pitch);
    const x1 =  x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;
    return [x1, y * cosP - z1 * sinP, y * sinP + z1 * cosP];
  }

  /** Para onde apontam, no espaço, a "direita" e o "para cima" da tela.
      São as linhas da matriz de rotação de project() (ela é ortonormal:
      a inversa é a transposta). */
  eixosTela() {
    const cY = Math.cos(this.yaw), sY = Math.sin(this.yaw), cP = Math.cos(this.pitch), sP = Math.sin(this.pitch);
    return { dir: [cY, 0, sY], cima: [sP * sY, cP, -sP * cY] };
  }

  arrastar(dx, dy) {
    this._anim = null;
    this.yaw += dx * 0.010;
    this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch + dy * 0.010));
  }

  /** Move a vista junto com o arraste: um ponto no plano do alvo anda
      exatamente (dx, dy) px na tela. pxPorUnidade: baseScale do desenho. */
  pan(dx, dy, pxPorUnidade) {
    this._anim = null;
    const e = this.eixosTela(), s = pxPorUnidade * this.zoom;
    for (let i = 0; i < 3; i++) this.alvo[i] += -e.dir[i] * dx / s + e.cima[i] * dy / s;
    this._limitarAlvo();
  }

  /** Amplia por f em direção ao ponto (ux, uy) px, medido a partir do
      centro da tela: o ponto do plano do alvo que está sob o cursor
      continua sob o cursor. */
  zoomEm(f, ux, uy, pxPorUnidade) {
    this._anim = null;
    const z0 = this.zoom, z1 = Math.max(OrbitCamera.ZOOM_MIN, Math.min(OrbitCamera.ZOOM_MAX, z0 * f));
    if (z1 === z0) return;
    const e = this.eixosTela(), k = (1 / z0 - 1 / z1) / pxPorUnidade;
    for (let i = 0; i < 3; i++) this.alvo[i] += e.dir[i] * (ux || 0) * k - e.cima[i] * (uy || 0) * k;
    this.zoom = z1;
    this._limitarAlvo();
  }

  /* O alvo não sai de perto da molécula (raio 1 nas unidades de quem
     desenha): nem pan nem zoom deixam o aluno perdê-la de vista. */
  _limitarAlvo() {
    const r = Math.hypot(this.alvo[0], this.alvo[1], this.alvo[2]), max = OrbitCamera.ALVO_MAX;
    if (r > max) for (let i = 0; i < 3; i++) this.alvo[i] *= max / r;
  }

  /** Transição suave para um novo estado (qualquer subconjunto de
      yaw, pitch, zoom, alvo). Com movimento reduzido, salta direto. */
  animarPara(para, ms) {
    const destino = {
      yaw: para.yaw !== undefined ? para.yaw : this.yaw,
      pitch: para.pitch !== undefined ? para.pitch : this.pitch,
      zoom: para.zoom !== undefined ? Math.max(OrbitCamera.ZOOM_MIN, Math.min(OrbitCamera.ZOOM_MAX, para.zoom)) : this.zoom,
      alvo: para.alvo ? para.alvo.slice() : this.alvo.slice()
    };
    // guinada pelo caminho mais curto: a guinada acumula voltas ao arrastar
    let d = destino.yaw - this.yaw;
    d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    destino.yaw = this.yaw + d;
    if (OrbitCamera.movimentoReduzido() || !ms) {
      this._anim = null;
      this.yaw = destino.yaw; this.pitch = destino.pitch; this.zoom = destino.zoom; this.alvo = destino.alvo;
      return;
    }
    this._anim = { de: { yaw: this.yaw, pitch: this.pitch, zoom: this.zoom, alvo: this.alvo.slice() }, para: destino, t0: OrbitCamera.agora(), ms: ms };
  }

  /** Avança a transição. Chamar uma vez por quadro, antes de desenhar. */
  passo() {
    const a = this._anim;
    if (!a) return false;
    const k = Math.min(1, (OrbitCamera.agora() - a.t0) / a.ms), e = 1 - Math.pow(1 - k, 3);
    const mix = (u, v) => u + (v - u) * e;
    this.yaw = mix(a.de.yaw, a.para.yaw);
    this.pitch = mix(a.de.pitch, a.para.pitch);
    this.zoom = mix(a.de.zoom, a.para.zoom);
    this.alvo = [0, 1, 2].map(i => mix(a.de.alvo[i], a.para.alvo[i]));
    if (k >= 1) this._anim = null;
    return true;
  }

  get animando() { return !!this._anim; }
}

OrbitCamera.ZOOM_MIN = 0.4;
OrbitCamera.ZOOM_MAX = 6;
OrbitCamera.ALVO_MAX = 1.25;
OrbitCamera.agora = function () { return (typeof performance !== 'undefined' ? performance : Date).now(); };
OrbitCamera.movimentoReduzido = function () {
  if (typeof document === 'undefined') return false;
  return document.body.classList.contains('reduce-motion') ||
    !!(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
};

if (typeof module !== 'undefined' && module.exports) module.exports = OrbitCamera;
