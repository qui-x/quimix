/* ════════════════════════════════════════════════════════════════════
   SILQ — view3dsilq.js  v3
   ════════════════════════════════════════════════════════════════════
   Renderizador 3D autossuficiente para o Simulador de Ligações Químicas.

   ARQUITETURA DESTA VERSÃO:
   ─ Geometria 3D calculada de FORMA INDEPENDENTE do layout 2D do canvas.
     Usa ângulos VSEPR/banco de literatura para posicionar os ligantes em
     3D real, sem converter posições 2D do usuário (que variam com zoom,
     drag e estado da física) — isso elimina os bugs de escala variável.
   ─ Raio dos átomos proporcional ao span projetado da molécula inteira,
     não ao scale individual de perspectiva — nenhum átomo domina a tela.
   ─ Cunhas estereoquímicas IUPAC (sólida / tracejada / plana).
   ─ Label de ângulo sempre fora dos átomos, com linha de chamada.
   ─ Zero dependências externas.
   ════════════════════════════════════════════════════════════════════ */
'use strict';

(function () {

/* ─────────────────────────────────────────────────────────────────────
   0. POLYFILL roundRect
───────────────────────────────────────────────────────────────────── */
if (typeof CanvasRenderingContext2D !== 'undefined' &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    this.beginPath();
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y,     x + w, y + h, rr);
    this.arcTo(x + w, y + h, x,     y + h, rr);
    this.arcTo(x,     y + h, x,     y,     rr);
    this.arcTo(x,     y,     x + w, y,     rr);
    this.closePath();
  };
}

/* ─────────────────────────────────────────────────────────────────────
   1. HELPERS
───────────────────────────────────────────────────────────────────── */
function hexToRgb(hex) {
  const c = (hex || '#888888').replace('#', '');
  return [parseInt(c.slice(0,2),16), parseInt(c.slice(2,4),16), parseInt(c.slice(4,6),16)];
}
function rgba(hex, a) {
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function getColor(el) {
  const s = window.SILQ_VIEW3D_STATE;
  return (s && s.ELEMENTS[el] && s.ELEMENTS[el].color) || '#888888';
}
// .light-mode: classe que o a11y.js liga. Antes era 'theme-light', nome do
// painel local antigo do SILQ — o visualizador 3D nunca detectava o modo
// claro e desenhava sempre com as cores do tema escuro.
function isLight()    { return document.body.classList.contains('light-mode'); }
function isHiContrast(){ return document.body.classList.contains('high-contrast'); }
function bgColor()    { return isHiContrast() ? '#000' : isLight() ? '#f0f4f8' : '#080c14'; }
function textColor()  { return isHiContrast() ? '#fff' : isLight() ? '#374151' : '#94a3b8'; }

/* ─────────────────────────────────────────────────────────────────────
   2. GEOMETRIA 3D — calcula posições absolutas no espaço 3D
      a partir da TOPOLOGIA (quem está ligado a quem) e dos ÂNGULOS
      VSEPR reais, independente de como o usuário posicionou os átomos
      no canvas 2D. Isso elimina a variabilidade de escala/zoom/drag.

   Convenção de unidades: comprimento de ligação = 1.0 (adimensional).
   A câmera e o auto-fit cuidam de mapear para pixels de tela.
───────────────────────────────────────────────────────────────────── */

/* Comprimentos de ligação relativos por par (unidades adimensionais).
   Valores aproximados normalizados ao comprimento C–C = 1.0. */
const BOND_LEN = {
  'H-H':0.74,'H-O':0.96,'H-N':1.01,'H-C':1.09,'H-S':1.34,'H-Cl':1.27,
  'H-F':0.92,'O-O':1.48,'O-C':1.43,'O-N':1.46,'O-S':1.63,'C-C':1.54,
  'C-N':1.47,'C-Cl':1.77,'C-F':1.35,'N-N':1.46,'N-O':1.40,'S-O':1.51,
  'S-Cl':2.01,'P-O':1.63,'Na-Cl':2.36,
};
function bondLen(elA, elB) {
  const k1 = `${elA}-${elB}`, k2 = `${elB}-${elA}`;
  return (BOND_LEN[k1] || BOND_LEN[k2] || 1.5);
}

/**
 * Calcula as posições 3D (x,y,z) de cada átomo da molécula.
 *
 * CORREÇÕES v3:
 *  1. Multi-centro (C₂H₆, C₂H₄, C₂H₂, N₂H₄, H₂O₂): posiciona o 2º
 *     centro em relação ao 1º e distribui seus ligantes corretamente.
 *  2. Quadrado Planar (XeF₄): ramo dedicado (4 lig + 2 pares solitários).
 *  3. H₂SO₄ / H₃PO₄: H ligados a O (não ao S/P central) são posicionados
 *     radialmente a partir do O ao qual estão ligados.
 *  4. T-shaped (ClF₃) e Gangorra (SF₄): ramos dedicados.
 */
function buildGeometry3D(canvasAtoms, bonds, ELEMENTS,
                         getMoleculeKey, MOLECULE_GEOMETRY_DB,
                         vsepAngle, bondOrderSum) {
  if (!canvasAtoms.length) return [];

  const covBonds = bonds.filter(b => b.type === 'covalent');
  const allBonds = bonds;

  // Conta todas as ligações por átomo
  const bCnt = new Map(canvasAtoms.map(a => [a.id, 0]));
  allBonds.forEach(b => {
    bCnt.set(b.a, (bCnt.get(b.a)||0) + 1);
    bCnt.set(b.b, (bCnt.get(b.b)||0) + 1);
  });

  // Átomo central primário = mais ligações
  let centralId = canvasAtoms[0].id, maxC = 0;
  bCnt.forEach((c, id) => { if (c > maxC) { maxC = c; centralId = id; } });
  const central = canvasAtoms.find(a => a.id === centralId);

  if (!central || maxC === 0) {
    return canvasAtoms.map(a => ({ atomId:a.id, el:a.element, x:0, y:0, z:0 }));
  }

  // Posições calculadas (Map id → [x,y,z])
  const pos = new Map([[centralId, [0,0,0]]]);
  const placed = new Set([centralId]);

  // ── Função interna: posiciona ligantes de um centro dado ──────────────
  function placeLigands(centerId, refDir) {
    const cenEl  = ELEMENTS[canvasAtoms.find(a=>a.id===centerId).element] || {};
    const cenPos = pos.get(centerId) || [0,0,0];
    const myBonds = allBonds.filter(b => (b.a===centerId||b.b===centerId));
    const ligIds  = myBonds
      .map(b => b.a===centerId ? b.b : b.a)
      .filter((id,i,a) => a.indexOf(id)===i && !placed.has(id));
    const ligAtoms = ligIds.map(id => canvasAtoms.find(a=>a.id===id)).filter(Boolean);
    if (!ligAtoms.length) return;

    const nB = ligAtoms.length;
    const totalOrder = myBonds.filter(b=>placed.has(b.a===centerId?b.b:b.a)===false||true)
      .reduce((s,b)=>s+(b.order||1),0);
    const nLone = Math.max(0, Math.floor(((cenEl.valence||4) - totalOrder)/2));

    const molKey = getMoleculeKey();
    const dbMol  = MOLECULE_GEOMETRY_DB[molKey];
    const angleDeg = dbMol ? dbMol.angle
      : vsepAngle(nB + (placed.size > 1 ? 1 : 0), nLone) * 180/Math.PI;
    const geo = dbMol ? dbMol.geometry : '';

    const bLen = (el) => bondLen(cenEl.symbol || canvasAtoms.find(a=>a.id===centerId).element, el);
    const bl0  = bLen(ligAtoms[0].element);

    // ── Direção de referência para orientar a geometria ────────────────
    // Se o centro já é ligante de outro (multi-centro), orienta
    // os novos ligantes na direção oposta à ligação que chegou.
    const ref = refDir || [1,0,0];

    // ── Ramos de geometria ─────────────────────────────────────────────
    if (nB === 0) {
      // Nada a fazer

    } else if (angleDeg > 175 || nB === 1) {
      // Linear
      ligAtoms.forEach((lig,i) => {
        const sign = i%2===0 ? 1 : -1;
        const bl   = bLen(lig.element);
        pos.set(lig.id, vadd(cenPos, vscale([sign,0,0], bl)));
        placed.add(lig.id);
      });

    } else if (nB === 2) {
      // Angular: dois ligantes no plano ref⊗Y
      const half = angleDeg * Math.PI/180 / 2;
      const u    = vnorm(ref);
      const perp = vnorm(vperp(u));
      ligAtoms.forEach((lig,i) => {
        const bl  = bLen(lig.element);
        const ang = i===0 ? -half : half;
        const dir = vadd(vscale(u, Math.cos(ang)), vscale(perp, Math.sin(ang)));
        pos.set(lig.id, vadd(cenPos, vscale(dir, bl)));
        placed.add(lig.id);
      });

    } else if (nB === 3 && nLone === 0 ||
               geo === 'Trigonal Planar' || geo === 'Trigonal planar') {
      // Trigonal planar: 3 ligantes a 120° num plano
      ligAtoms.forEach((lig,i) => {
        const th = i*2*Math.PI/3;
        const bl = bLen(lig.element);
        pos.set(lig.id, vadd(cenPos, [bl*Math.cos(th), bl*Math.sin(th), 0]));
        placed.add(lig.id);
      });

    } else if (nB === 3 && nLone >= 1 ||
               geo === 'Piramidal Trigonal' || geo === 'Piramidal') {
      // Pirâmide trigonal
      const h = 0.50, r = 0.87;
      ligAtoms.forEach((lig,i) => {
        const th = i*2*Math.PI/3;
        const bl = bLen(lig.element);
        pos.set(lig.id, vadd(cenPos, [bl*r*Math.cos(th), bl*r*Math.sin(th), -bl*h]));
        placed.add(lig.id);
      });
      // Eleva levemente o centro
      const [cx,cy,cz] = pos.get(centerId);
      pos.set(centerId, [cx, cy, cz + bl0*h*0.4]);

    } else if (nB === 4 && nLone >= 2 ||
               geo === 'Quadrado Planar') {
      // Quadrado planar (XeF₄: 4 lig + 2 pares solitários)
      // Os 4 ligantes nos vértices de um quadrado no plano XY
      ligAtoms.forEach((lig,i) => {
        const th = i*Math.PI/2;
        const bl = bLen(lig.element);
        pos.set(lig.id, vadd(cenPos, [bl*Math.cos(th), bl*Math.sin(th), 0]));
        placed.add(lig.id);
      });

    } else if (nB === 4) {
      // Tetraédrico
      const TETRA = [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]];
      ligAtoms.forEach((lig,i) => {
        const d  = TETRA[i%4];
        const m  = Math.hypot(...d);
        const bl = bLen(lig.element);
        pos.set(lig.id, vadd(cenPos, d.map(v=>v/m*bl)));
        placed.add(lig.id);
      });

    } else if (nB === 3 && (geo === 'T-shaped')) {
      // T-shaped (ClF₃: 3 lig + 2 pares): F axial ±Z, F equatorial +X
      const bl = bLen(ligAtoms[0].element);
      const dirs = [[0,0,bl],[0,0,-bl],[bl,0,0]];
      ligAtoms.forEach((lig,i) => {
        pos.set(lig.id, vadd(cenPos, dirs[i%3]));
        placed.add(lig.id);
      });

    } else if (nB === 4 && (geo === 'Gangorra (Seesaw)' || geo === 'Gangorra')) {
      // Gangorra SF₄: 2 axiais ±Z, 2 equatoriais no plano XY a ~101°
      const bl  = bLen(ligAtoms[0].element);
      const ang = 101.6 * Math.PI/180 / 2;
      const dirs = [
        [0, 0, bl*1.1],
        [0, 0,-bl*1.1],
        [bl*Math.cos(ang), bl*Math.sin(ang), 0],
        [bl*Math.cos(ang),-bl*Math.sin(ang), 0],
      ];
      ligAtoms.forEach((lig,i) => {
        pos.set(lig.id, vadd(cenPos, dirs[i%4]));
        placed.add(lig.id);
      });

    } else if (nB === 5) {
      // Bipiramidal trigonal
      const bl = bLen(ligAtoms[0].element);
      ligAtoms.forEach((lig,i) => {
        if (i < 3) {
          const th = i*2*Math.PI/3;
          pos.set(lig.id, vadd(cenPos, [bl*Math.cos(th), bl*Math.sin(th), 0]));
        } else {
          pos.set(lig.id, vadd(cenPos, [0, 0, i===3 ? bl*1.1 : -bl*1.1]));
        }
        placed.add(lig.id);
      });

    } else if (nB === 6) {
      // Octaédrico
      const bl   = bLen(ligAtoms[0].element);
      const DIRS = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
      ligAtoms.forEach((lig,i) => {
        const d = DIRS[i%6];
        pos.set(lig.id, vadd(cenPos, d.map(v=>v*bl)));
        placed.add(lig.id);
      });

    } else {
      // Caso geral: espiral de Fibonacci
      ligAtoms.forEach((lig,i) => {
        const phi = Math.PI*(3-Math.sqrt(5));
        const y   = 1-(i/(Math.max(nB-1,1)))*2;
        const rr  = Math.sqrt(Math.max(0,1-y*y));
        const th  = phi*i;
        const bl  = bLen(lig.element);
        pos.set(lig.id, vadd(cenPos, [bl*rr*Math.cos(th), bl*y, bl*rr*Math.sin(th)]));
        placed.add(lig.id);
      });
    }
  }

  // ── Passo 1: Posiciona ligantes do centro primário ────────────────────
  placeLigands(centralId, [1,0,0]);

  // ── Passo 2: Para moléculas multi-centro, posiciona o 2º centro ───────
  // (C₂H₆, C₂H₄, C₂H₂, N₂H₄, H₂O₂ têm dois centros com ≥2 ligações)
  const secondaryCenters = canvasAtoms.filter(a => {
    if (placed.has(a.id) && a.id !== centralId) return false; // já ligante
    const myBonds = allBonds.filter(b=>b.a===a.id||b.b===a.id);
    const myLigands = myBonds.map(b=>b.a===a.id?b.b:b.a).filter(id=>id!==centralId);
    return myLigands.length >= 1 && a.id !== centralId;
  });

  secondaryCenters.forEach(secCenter => {
    if (!placed.has(secCenter.id)) return; // só processa se já posicionado como ligante
    // Direção de chegada: do centro primário para o secundário
    const [cx,cy,cz] = pos.get(centralId) || [0,0,0];
    const [sx,sy,sz] = pos.get(secCenter.id) || [1,0,0];
    const refDir = vnorm([sx-cx, sy-cy, sz-cz]);
    placeLigands(secCenter.id, refDir);
  });

  // ── Passo 3: Átomos ainda não posicionados (H em O de H₂SO₄, etc.) ──
  // Percorre as ligações para encontrar vizinhos do já-posicionados
  let changed = true;
  let safety  = 0;
  while (changed && safety++ < 20) {
    changed = false;
    allBonds.forEach(b => {
      const idA = b.a, idB = b.b;
      const aPlaced = placed.has(idA), bPlaced = placed.has(idB);
      if (aPlaced === bPlaced) return; // ambos ou nenhum
      const parentId = aPlaced ? idA : idB;
      const childId  = aPlaced ? idB : idA;
      const childEl  = canvasAtoms.find(a=>a.id===childId)?.element || 'H';
      const parentEl = canvasAtoms.find(a=>a.id===parentId)?.element || 'O';
      const parentPos = pos.get(parentId) || [0,0,0];
      // Conta vizinhos já posicionados do parent para orientar a saída
      const parentBonds = allBonds.filter(bx=>bx.a===parentId||bx.b===parentId);
      const placedNeighbors = parentBonds
        .map(bx=>bx.a===parentId?bx.b:bx.a)
        .filter(id=>placed.has(id)&&id!==childId);
      const bl = bondLen(parentEl, childEl);
      let dir;
      if (placedNeighbors.length > 0) {
        // Posiciona na direção oposta à média dos vizinhos já colocados
        const avgNeighDir = placedNeighbors.reduce((acc,id)=>{
          const np=pos.get(id)||[0,0,0];
          return vadd(acc, vnorm(vsub(np,parentPos)));
        },[0,0,0]);
        dir = vnorm(vscale(avgNeighDir,-1));
        // Pequeno offset perpendicular para evitar colinearidade exata
        const perp=vnorm(vperp(dir));
        dir = vnorm(vadd(dir, vscale(perp, 0.25)));
      } else {
        dir = [0, 0, 1];
      }
      pos.set(childId, vadd(parentPos, vscale(dir, bl)));
      placed.add(childId);
      changed = true;
    });
  }

  // Átomos completamente desconectados: offset determinístico pequeno
  canvasAtoms.forEach((a,i) => {
    if (!pos.has(a.id)) {
      pos.set(a.id, [0.2*(i%3-1), 0.2*((i+1)%3-1), 0.2*((i+2)%3-1)]);
    }
  });

  return canvasAtoms.map(a => {
    const [x,y,z] = pos.get(a.id) || [0,0,0];
    return { atomId:a.id, el:a.element, x, y, z };
  });
}

/* ─── Utilitários de vetor ─────────────────────────────────────────── */
function vadd(a,b){ return [a[0]+b[0], a[1]+b[1], a[2]+b[2]]; }
function vsub(a,b){ return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
function vscale(a,s){ return [a[0]*s, a[1]*s, a[2]*s]; }
function vmag(a){ return Math.hypot(...a)||1; }
function vnorm(a){ const m=vmag(a); return [a[0]/m, a[1]/m, a[2]/m]; }
function vcross(a,b){
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
// Vetor perpendicular a u (escolhe um eixo que não seja colinear)
function vperp(u){
  const abs=[Math.abs(u[0]),Math.abs(u[1]),Math.abs(u[2])];
  const minI=abs.indexOf(Math.min(...abs));
  const ref=[0,0,0]; ref[minI]=1;
  return vnorm(vcross(u,ref));
}

/* ─────────────────────────────────────────────────────────────────────
   3. CÂMERA ORBITAL
───────────────────────────────────────────────────────────────────── */
class OrbitCamera {
  constructor() {
    this.yaw   =  0.55;
    this.pitch =  0.30;
    this.zoom  =  1.0;   // fator de zoom aplicado à escala
  }

  /** Projeta ponto 3D → tela 2D.
   *  cx,cy: centro da tela. baseScale: px por unidade de comprimento. */
  project(x, y, z, cx, cy, baseScale) {
    const cosY = Math.cos(this.yaw),   sinY = Math.sin(this.yaw);
    const cosP = Math.cos(this.pitch), sinP = Math.sin(this.pitch);
    // Yaw (em torno de Y)
    const x1 =  x*cosY + z*sinY;
    const z1 = -x*sinY + z*cosY;
    // Pitch (em torno de X)
    const y1 =  y*cosP - z1*sinP;
    const z2 =  y*sinP + z1*cosP;
    // Perspectiva suave — distância focal = 3.5 unidades
    const focalLen = 3.5;
    const camZ = z2 + focalLen;
    const persp = focalLen / Math.max(0.1, camZ);
    const s = baseScale * this.zoom * persp;
    return {
      sx:    cx + x1 * s,
      sy:    cy - y1 * s,   // Y invertido (tela cresce pra baixo)
      depth: camZ,
      persp,
    };
  }
}

/* ─────────────────────────────────────────────────────────────────────
   4. RENDERER
───────────────────────────────────────────────────────────────────── */
class SilqView3D {
  constructor(canvas) {
    this.canvas      = canvas;
    this.ctx         = canvas.getContext('2d');
    this.camera      = new OrbitCamera();
    this.active      = false;
    this.showAngles  = true;
    this._dragging   = false;
    this._lastX = 0; this._lastY = 0;
    this._pinchDist  = null;
    this._geo3d      = null; // cache da geometria (recalcular só quando mudar)
    this._geoKey     = '';   // chave: JSON dos atomIds+bondIds para invalidar cache
    this._bindInput();
  }

  _bindInput() {
    const cv = this.canvas;
    const dn = (x,y) => { this._dragging=true; this._lastX=x; this._lastY=y; };
    const mv = (x,y) => {
      if (!this._dragging) return;
      this.camera.yaw   += (x - this._lastX) * 0.010;
      this.camera.pitch  = Math.max(-1.4, Math.min(1.4,
        this.camera.pitch + (y - this._lastY) * 0.010));
      this._lastX=x; this._lastY=y;
    };
    const up = () => { this._dragging=false; };

    cv.addEventListener('mousedown',  e => dn(e.clientX,e.clientY));
    window.addEventListener('mousemove', e => { if(this.active) mv(e.clientX,e.clientY); });
    window.addEventListener('mouseup',   up);

    cv.addEventListener('touchstart', e => {
      if (e.touches.length===1) { dn(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); }
      if (e.touches.length===2) {
        this._pinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY);
      }
    }, {passive:false});
    cv.addEventListener('touchmove', e => {
      if (e.touches.length===1) { mv(e.touches[0].clientX,e.touches[0].clientY); e.preventDefault(); }
      if (e.touches.length===2 && this._pinchDist!==null) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY);
        this.camera.zoom = Math.max(0.3, Math.min(4, this.camera.zoom * (d/this._pinchDist)));
        this._pinchDist = d;
        e.preventDefault();
      }
    }, {passive:false});
    cv.addEventListener('touchend',    () => { up(); this._pinchDist=null; });
    cv.addEventListener('touchcancel', () => { up(); this._pinchDist=null; });

    cv.addEventListener('wheel', e => {
      e.preventDefault();
      this.camera.zoom = Math.max(0.3, Math.min(4,
        this.camera.zoom * (e.deltaY > 0 ? 0.92 : 1.09)));
    }, {passive:false});
  }

  setActive(on) {
    this.active = on;
    this.canvas.hidden = !on;
    if (on) this._resize();
  }

  _resize() {
    const dpr  = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width*dpr));
    const h = Math.max(1, Math.round(rect.height*dpr));
    if (this.canvas.width!==w || this.canvas.height!==h) {
      this.canvas.width=w; this.canvas.height=h;
    }
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  /* Invalida o cache de geometria quando a molécula muda */
  _geoKeyFor(canvasAtoms, bonds) {
    return canvasAtoms.map(a=>a.id+a.element).join(',')
         + '|' + bonds.map(b=>b.a+'-'+b.b+'-'+b.type).join(',');
  }

  draw() {
    if (!this.active) return;
    const state = window.SILQ_VIEW3D_STATE;
    if (!state) return;

    this._resize();
    const ctx  = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = bgColor();
    ctx.fillRect(0,0,W,H);

    const { canvasAtoms, bonds, ELEMENTS, getMoleculeKey,
            MOLECULE_GEOMETRY_DB, vsepAngle, bondOrderSum } = state;

    if (!canvasAtoms.length) {
      ctx.font      = `${Math.max(12, W*0.014)}px 'Segoe UI',sans-serif`;
      ctx.fillStyle = rgba(textColor(), 0.55);
      ctx.textAlign = 'center';
      ctx.fillText('Monte uma molécula no canvas 2D para visualizar em 3D', W/2, H/2);
      ctx.textAlign = 'left';
      return;
    }

    /* Recalcula geometria apenas quando a molécula muda */
    const gk = this._geoKeyFor(canvasAtoms, bonds);
    if (gk !== this._geoKey) {
      this._geoKey = gk;
      this._geo3d  = buildGeometry3D(canvasAtoms, bonds, ELEMENTS,
        getMoleculeKey, MOLECULE_GEOMETRY_DB, vsepAngle, bondOrderSum);
    }
    const geo3d = this._geo3d;
    if (!geo3d || !geo3d.length) return;

    /* baseScale: fator px/unidade calculado para que a molécula caiba
       em ~55% da menor dimensão da tela, independente do número de átomos. */
    const maxCoord = geo3d.reduce((m,a) =>
      Math.max(m, Math.abs(a.x), Math.abs(a.y), Math.abs(a.z)), 0.01);
    const fitTarget = Math.min(W,H) * 0.27; // raio alvo em px
    const baseScale = fitTarget / maxCoord;

    const cx = W/2, cy = H/2;

    /* Projeta todos os átomos */
    const proj = geo3d.map(a => ({
      ...a,
      ...this.camera.project(a.x, a.y, a.z, cx, cy, baseScale),
    }));
    const byId = new Map(proj.map(p => [p.atomId, p]));

    /* Raio de átomo: fração do tamanho projetado da molécula, uniforme.
       Usa o span médio dos átomos projetados como referência. */
    const projXY = proj.map(p => [p.sx, p.sy]);
    const spanPx = projXY.reduce((m,[x,y]) => {
      const d = Math.hypot(x - cx, y - cy);
      return Math.max(m, d);
    }, 10);
    // Raio base = 28% do span; H = 60% do raio base; máximo absoluto = 80px
    const atomR    = Math.min(80, spanPx * 0.28);
    const atomR_H  = atomR * 0.60;

    /* Ordenação depth: mais longe primeiro (painter's algorithm) */
    const sorted = [...proj].sort((a,b) => b.depth - a.depth);

    /* Caixa de referência */
    this._drawBox(ctx, geo3d, cx, cy, baseScale);

    /* Tipos de ligações */
    const covBonds = bonds.filter(b => b.type==='covalent');
    const ionBonds = bonds.filter(b => b.type==='ionic');
    const metBonds = bonds.filter(b => b.type==='metallic');

    const bCnt = new Map(canvasAtoms.map(a => [a.id, 0]));
    covBonds.forEach(b => {
      bCnt.set(b.a, (bCnt.get(b.a)||0)+1);
      bCnt.set(b.b, (bCnt.get(b.b)||0)+1);
    });

    /* Limiar de cunha: diferença de Z projetada > 8% do span */
    const THRESH = maxCoord * 0.08;

    /* Ligações covalentes com cunhas */
    covBonds.forEach(b => {
      const pA = byId.get(b.a), pB = byId.get(b.b);
      const g3A = geo3d.find(a => a.atomId===b.a);
      const g3B = geo3d.find(a => a.atomId===b.b);
      if (!pA||!pB||!g3A||!g3B) return;
      const cntA = bCnt.get(b.a)||0, cntB = bCnt.get(b.b)||0;
      const [cenP,ligP,g3C,g3L] = cntA>=cntB ? [pA,pB,g3A,g3B] : [pB,pA,g3B,g3A];

      /* Direção da cunha:
         1. Propriedade individual da ligação (b.wedge) — definida quando
            o usuário cria a ligação com o seletor ativo
         2. wedgeDirection global do estado — afeta todas as ligações
            enquanto estiver diferente de 'auto'
         3. Geometria 3D calculada automaticamente (padrão)            */
      let dzRel = g3L.z - g3C.z;
      const wd = b.wedge || state.wedgeDirection;
      if (wd === 'front') dzRel =  THRESH * 4;
      else if (wd === 'back')  dzRel = -THRESH * 4;
      else if (wd === 'plane') dzRel =  0;

      this._drawBond(ctx, cenP, ligP, dzRel, THRESH, atomR, b.order||1,
        getColor(g3L.el));
    });

    /* Iônicas */
    ionBonds.forEach(b => {
      const pA=byId.get(b.a), pB=byId.get(b.b);
      if (!pA||!pB) return;
      ctx.save();
      ctx.setLineDash([5,4]);
      ctx.strokeStyle = rgba('#ffb74d',0.80);
      ctx.lineWidth   = Math.max(1.5, atomR*0.04);
      ctx.beginPath(); ctx.moveTo(pA.sx,pA.sy); ctx.lineTo(pB.sx,pB.sy); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    });

    /* Metálicas */
    metBonds.forEach(b => {
      const pA=byId.get(b.a), pB=byId.get(b.b);
      if (!pA||!pB) return;
      ctx.strokeStyle = rgba('#fde68a',0.30);
      ctx.lineWidth   = Math.max(8, atomR*0.22);
      ctx.lineCap     = 'round';
      ctx.beginPath(); ctx.moveTo(pA.sx,pA.sy); ctx.lineTo(pB.sx,pB.sy); ctx.stroke();
    });

    /* Átomos */
    sorted.forEach(p => {
      const isH = p.el==='H';
      const r   = isH ? atomR_H : atomR;
      this._drawAtom(ctx, p.sx, p.sy, r, getColor(p.el), p.el);
    });

    /* Ângulos — seleciona centros elegíveis:
       INCLUIR: qualquer átomo não-H com ≥ 2 ligações covalentes que tenha
                pelo menos dois ligantes NON-H OU seja o único caminho de
                ângulo (ex: O em C–O–H do metanol, N–O–H do HNO₃).
       EXCLUIR: H (nunca centro), metais alcalinos/terrosos em pontes
                iônicas (Na em Na–O–H: ângulo sem relevância química).     */
    if (this.showAngles && covBonds.length >= 2) {

      const METAL_CATS = new Set([
        'alkali-metal','alkaline-earth','transition',
        'post-transition','lanthanide','actinide'
      ]);
      const isMetal = el => {
        const s = state.ELEMENTS[el];
        return s && METAL_CATS.has(s.category);
      };

      const centers = canvasAtoms.filter(a => {
        if (a.el === 'H' || a.element === 'H') return false; // H nunca é centro
        if (isMetal(a.element)) return false;                // metais: sem ângulo covalente
        const c = bCnt.get(a.id) || 0;
        return c >= 2;
      });

      const usedLabelPositions = [];
      centers.forEach(centerAtom => {
        this._drawAngle(ctx, proj, byId, covBonds, centerAtom.id, state,
                        atomR, geo3d, getMoleculeKey, MOLECULE_GEOMETRY_DB,
                        vsepAngle, bondOrderSum, ELEMENTS, canvasAtoms,
                        usedLabelPositions);
      });
    }

    /* HUD */
    this._drawHUD(ctx, W, H);
  }

  /* ── Ligação: cunha sólida / tracejada / linha plana ── */
  _drawBond(ctx, cenP, ligP, dzRel, THRESH, atomR, order, colLig) {
    const dx = ligP.sx - cenP.sx, dy = ligP.sy - cenP.sy;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;

    /* Recorta o segmento para começar/terminar na superfície dos átomos,
       não nos centros — evita que cunhas atravessem os átomos. */
    const rCen = atomR;         // raio do átomo central
    const rLig = atomR * 0.65; // raio do ligante (H menor)
    const tStart = Math.min(rCen / len, 0.45);
    const tEnd   = Math.max(1 - rLig / len, 0.55);
    if (tStart >= tEnd) return; // átomos sobrepostos na tela

    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const lw = Math.max(1.2, atomR * 0.040);

    /* Pontos recortados */
    const x0 = cenP.sx + ux * len * tStart, y0 = cenP.sy + uy * len * tStart;
    const x1 = cenP.sx + ux * len * tEnd,   y1 = cenP.sy + uy * len * tEnd;
    const drawLen = len * (tEnd - tStart);

    if (Math.abs(dzRel) <= THRESH) {
      /* Linha plana */
      if (order > 1) {
        const gaps = order === 2 ? [-lw*1.4, lw*1.4] : [-lw*2.2, 0, lw*2.2];
        gaps.forEach(off => {
          ctx.beginPath();
          ctx.moveTo(x0 + px*off, y0 + py*off);
          ctx.lineTo(x1 + px*off, y1 + py*off);
          ctx.strokeStyle = rgba(colLig, 0.72);
          ctx.lineWidth   = lw;
          ctx.lineCap     = 'round';
          ctx.stroke();
        });
      } else {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.strokeStyle = rgba(colLig, 0.70);
        ctx.lineWidth   = lw;
        ctx.lineCap     = 'round';
        ctx.stroke();
      }
    } else if (dzRel > THRESH) {
      /* Cunha sólida — vem para frente */
      const hw = Math.max(1.2, atomR * 0.09);
      ctx.beginPath();
      ctx.moveTo(x0, y0);                        // ponta estreita (centro)
      ctx.lineTo(x1 + px*hw, y1 + py*hw);        // base larga (ligante)
      ctx.lineTo(x1 - px*hw, y1 - py*hw);
      ctx.closePath();
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, rgba(colLig, 0.12));
      g.addColorStop(1, rgba(colLig, 0.92));
      ctx.fillStyle   = g;
      ctx.fill();
      ctx.strokeStyle = rgba(colLig, 0.38);
      ctx.lineWidth   = 0.7;
      ctx.stroke();
    } else {
      /* Cunha tracejada — vai para trás */
      const nS = Math.max(4, Math.min(14, Math.round(drawLen / 5)));
      ctx.lineCap = 'round';
      for (let k = 1; k <= nS; k++) {
        const t  = k / (nS + 1);
        const mx = x0 + ux * drawLen * t;
        const my = y0 + uy * drawLen * t;
        const hw = Math.max(0.5, atomR * 0.09 * t);
        ctx.beginPath();
        ctx.moveTo(mx - px*hw, my - py*hw);
        ctx.lineTo(mx + px*hw, my + py*hw);
        ctx.strokeStyle = rgba(colLig, 0.72);
        ctx.lineWidth   = Math.max(0.6, lw * 0.55 * t);
        ctx.stroke();
      }
    }
  }

  /* ── Átomo: esfera com gradiente + símbolo ── */
  _drawAtom(ctx, x, y, r, col, el) {
    if (r < 1) return;
    const g = ctx.createRadialGradient(x-r*0.3, y-r*0.3, 0, x, y, r);
    g.addColorStop(0,   rgba(col,1.0));
    g.addColorStop(0.65,rgba(col,0.88));
    g.addColorStop(1,   rgba(col,0.50));
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle=g; ctx.fill();
    // Brilho
    ctx.beginPath();
    ctx.arc(x-r*0.30, y-r*0.30, r*0.25, 0, Math.PI*2);
    ctx.fillStyle=rgba('#ffffff',0.20); ctx.fill();
    // Símbolo
    if (r > 7) {
      const fs = Math.max(8, r * 0.70);
      ctx.font          = `bold ${fs}px 'Segoe UI',sans-serif`;
      ctx.textAlign     = 'center';
      ctx.textBaseline  = 'middle';
      ctx.fillStyle     = rgba('#ffffff',0.95);
      ctx.fillText(el, x, y);
      ctx.textAlign     = 'left';
      ctx.textBaseline  = 'alphabetic';
    }
  }

  /* ── Arcos de ângulo + labels para todos os pares de ligantes de um centro ── */
  _drawAngle(ctx, proj, byId, covBonds, centralId, state,
             atomR, geo3d, getMoleculeKey, MOLECULE_GEOMETRY_DB,
             vsepAngle, bondOrderSum, ELEMENTS, canvasAtoms,
             usedLabelPositions) {

    const cenP = byId.get(centralId);
    if (!cenP) return;

    /* Ligantes deste centro específico */
    const ligIds = covBonds
      .filter(b => b.a === centralId || b.b === centralId)
      .map(b => b.a === centralId ? b.b : b.a)
      .filter((id, i, a) => a.indexOf(id) === i);
    const ligPs = ligIds.map(id => byId.get(id)).filter(Boolean);
    if (ligPs.length < 2) return;

    /* ── Ângulo de referência POR CENTRO (não pela molécula toda) ──
       1. Banco específico da molécula (se bate a fórmula Hill total)
       2. VSEPR calculado para ESTE centro: valência do elemento central
          menos a soma das ordens de ligação das ligações que saem DESTE centro
       Isso garante que C em C₂H₄ (sp2 → 120°) e C em CH₄ (sp3 → 109.5°)
       recebam ângulos corretos independentemente.                       */
    const molKey = getMoleculeKey();
    const dbMol  = MOLECULE_GEOMETRY_DB[molKey];
    let refDeg;

    if (dbMol) {
      refDeg = dbMol.angle;
    } else {
      const ca = canvasAtoms.find(a => a.id === centralId);
      if (ca) {
        const el        = ELEMENTS[ca.element] || {};
        /* bondOrderSum conta ordens reais (dupla=2, tripla=3) */
        const usedEl    = bondOrderSum(centralId);
        const nLone     = Math.max(0, Math.floor(((el.valence || 4) - usedEl) / 2));
        const nLigands  = ligIds.length;
        refDeg = vsepAngle(nLigands, nLone) * 180 / Math.PI;
      }
    }
    if (!refDeg) return;

    const txt   = `${refDeg.toFixed(1)}°`;
    const fsize = Math.max(11, Math.min(14, atomR * 0.38));
    ctx.font    = `bold ${fsize}px 'Segoe UI', Consolas, sans-serif`;
    const tw    = ctx.measureText(txt).width;
    const pw    = tw + 9, ph = fsize + 6;

    /* Raio do arco — 26% da distância média centro→ligante */
    const avgDist = ligPs.reduce((s, p) =>
      s + Math.hypot(p.sx - cenP.sx, p.sy - cenP.sy), 0) / ligPs.length;
    const arcR = Math.max(10, avgDist * 0.26);

    /* Itera por todos os pares (i, j) com i < j.
       Para centros com muitos ligantes (CH₄, C₂H₆: 6 pares cada),
       limita a exibição: mostra todos os pares entre não-H primeiro,
       depois pares H–nonH representativos, máx 4 pares por centro.    */
    const MAX_PAIRS_PER_CENTER = 4;

    // Separa ligantes H e não-H para priorização
    const nonHIds = ligIds.filter(id => {
      const a = canvasAtoms.find(x => x.id === id);
      return a && a.element !== 'H';
    });
    const hIds = ligIds.filter(id => {
      const a = canvasAtoms.find(x => x.id === id);
      return a && a.element === 'H';
    });

    // Gera pares priorizados: (nonH, nonH) primeiro, depois (H, nonH), depois (H, H)
    const prioritizedPairs = [];
    for (let i = 0; i < ligIds.length; i++) {
      for (let j = i + 1; j < ligIds.length; j++) {
        const aIsH = hIds.includes(ligIds[i]);
        const bIsH = hIds.includes(ligIds[j]);
        const priority = (aIsH && bIsH) ? 2 : (aIsH || bIsH) ? 1 : 0;
        prioritizedPairs.push({ i, j, priority });
      }
    }
    prioritizedPairs.sort((a, b) => a.priority - b.priority);

    let pairsDrawn = 0;
    for (const { i, j } of prioritizedPairs) {
      if (pairsDrawn >= MAX_PAIRS_PER_CENTER) break;
        const La = ligPs[i], Lb = ligPs[j];

        const a1 = Math.atan2(La.sy - cenP.sy, La.sx - cenP.sx);
        const a2 = Math.atan2(Lb.sy - cenP.sy, Lb.sx - cenP.sx);
        let da   = a2 - a1;
        if (da >  Math.PI) da -= 2 * Math.PI;
        if (da < -Math.PI) da += 2 * Math.PI;

        /* Pula pares onde os ligantes coincidem na projeção (< 6°) */
        if (Math.abs(da) < 0.10) continue;

        /* ── Ângulo 3D real (para detectar linear e para bissetriz correta) ── */
        const g3Cen = geo3d.find(g => g.atomId === centralId);
        const g3La  = geo3d.find(g => g.atomId === ligIds[i]);
        const g3Lb  = geo3d.find(g => g.atomId === ligIds[j]);
        let isLinear = false;
        let angle3dDeg = Math.abs(da) * 180 / Math.PI;
        if (g3Cen && g3La && g3Lb) {
          const vax=g3La.x-g3Cen.x, vay=g3La.y-g3Cen.y, vaz=g3La.z-g3Cen.z;
          const vbx=g3Lb.x-g3Cen.x, vby=g3Lb.y-g3Cen.y, vbz=g3Lb.z-g3Cen.z;
          const ma=Math.hypot(vax,vay,vaz)||1, mb=Math.hypot(vbx,vby,vbz)||1;
          const cosA3d=(vax*vbx+vay*vby+vaz*vbz)/(ma*mb);
          angle3dDeg = Math.acos(Math.max(-1,Math.min(1,cosA3d)))*180/Math.PI;
          isLinear = angle3dDeg > 170;
        }

        /* ── Ângulo projetado correto via produto escalar 2D ──────────────
           O `da` calculado por atan2 pode ser o ângulo pelo lado MAIOR
           (reflex arc), o que faz o arco sair por fora da molécula.
           Usamos o produto vetorial 2D para determinar o sentido CORRETO:
             cross2d > 0 → La está à esquerda de Lb (anti-horário)
             cross2d < 0 → La está à direita de Lb (horário)
           E limitamos ao ângulo MENOR (≤ π) entre os dois vetores.        */
        const vAx = La.sx - cenP.sx, vAy = La.sy - cenP.sy;
        const vBx = Lb.sx - cenP.sx, vBy = Lb.sy - cenP.sy;
        const dot2d   = vAx*vBx + vAy*vBy;
        const cross2d = vAx*vBy - vAy*vBx;   // sinal determina sentido
        const mA = Math.hypot(vAx,vAy)||1, mB = Math.hypot(vBx,vBy)||1;
        // Ângulo projetado (sempre positivo, ≤ π)
        const projAngle = Math.acos(Math.max(-1, Math.min(1, dot2d/(mA*mB))));
        // Ângulo de início do arco = ângulo do vetor La
        const arcStart  = Math.atan2(vAy, vAx);
        // Sentido: cross2d > 0 → de La para Lb é anti-horário → anticlockwise=false
        //          cross2d < 0 → de La para Lb é horário     → anticlockwise=true
        // Mas queremos o arco pelo LADO MENOR (≤ π), então:
        // se projAngle ≤ π, o arco correto vai da direção La até La+projAngle*sinal
        const arcCCW = cross2d < 0; // vai anti-horário se cross < 0
        const arcEnd  = arcStart + (arcCCW ? -projAngle : projAngle);

        /* Bissetriz do arco correto */
        const aMid = arcStart + (arcCCW ? -projAngle/2 : projAngle/2);
        const bisX = Math.cos(aMid), bisY = Math.sin(aMid);

        /* Arco (ou marcadores para 180°) */
        if (isLinear) {
          const perpX=-bisY, perpY=bisX, hw=arcR*0.40;
          ctx.strokeStyle=rgba('#fbbf24',0.80); ctx.lineWidth=1.6; ctx.lineCap='round';
          const tipX=cenP.sx+bisX*arcR, tipY=cenP.sy+bisY*arcR;
          ctx.beginPath(); ctx.moveTo(tipX-perpX*hw,tipY-perpY*hw); ctx.lineTo(tipX+perpX*hw,tipY+perpY*hw); ctx.stroke();
          const tipX2=cenP.sx-bisX*arcR, tipY2=cenP.sy-bisY*arcR;
          ctx.beginPath(); ctx.moveTo(tipX2-perpX*hw,tipY2-perpY*hw); ctx.lineTo(tipX2+perpX*hw,tipY2+perpY*hw); ctx.stroke();
        } else {
          /* Arco sempre pelo lado menor — nunca o arco reflexo */
          ctx.beginPath();
          ctx.arc(cenP.sx, cenP.sy, arcR, arcStart, arcEnd, arcCCW);
          ctx.strokeStyle = rgba('#fbbf24', 0.80);
          ctx.lineWidth   = 1.6;
          ctx.lineCap     = 'butt';
          ctx.stroke();
        }

        /* Posição do label na bissetriz do arco ──────────────────────
           Base: entre o arco e o ligante mais próximo (40-55% do dist)
           O label nunca vai além do ligante para não cair sobre outros átomos */
        const dA    = Math.hypot(La.sx - cenP.sx, La.sy - cenP.sy);
        const dB    = Math.hypot(Lb.sx - cenP.sx, Lb.sy - cenP.sy);
        const dMin  = Math.min(dA, dB);
        // Distância base: entre o arco e 50% do ligante — nunca ultrapassa o ligante
        const baseDist = Math.max(arcR + pw * 0.7, Math.min(dMin * 0.52, dMin - atomR * 0.6));

        let lx = cenP.sx + bisX * baseDist;
        let ly = cenP.sy + bisY * baseDist;
        let bestX = lx, bestY = ly, bestOverlap = Infinity;

        /* Candidatos em espiral ao redor da posição ideal */
        const candidates = [[lx, ly]];
        const steps = [pw * 0.6, pw * 1.1, pw * 1.7];
        const angles8 = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4,
                         Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
        for (const r of steps) {
          for (const th of angles8) {
            // Mantém o candidato dentro de dMin para não ultrapassar o ligante
            const cx2 = lx + Math.cos(th) * r;
            const cy2 = ly + Math.sin(th) * r;
            const distFromCen = Math.hypot(cx2 - cenP.sx, cy2 - cenP.sy);
            if (distFromCen < dMin * 0.9) {
              candidates.push([cx2, cy2]);
            }
          }
        }

        /* Escolhe candidato com maior distância mínima dos labels existentes */
        for (const [cx2, cy2] of candidates) {
          const overlap = usedLabelPositions.reduce((mn, [ox, oy]) =>
            Math.min(mn, Math.hypot(cx2 - ox, cy2 - oy)), Infinity);
          if (overlap <= bestOverlap) continue;
          bestOverlap = overlap;
          bestX = cx2; bestY = cy2;
          if (overlap > pw * 0.9) break; // sem colisão — aceita
        }
        lx = bestX; ly = bestY;
        usedLabelPositions.push([lx, ly]);
        pairsDrawn++;

        /* Linha de chamada arco → label */
        const arcTipX  = cenP.sx + bisX * (arcR + 2);
        const arcTipY  = cenP.sy + bisY * (arcR + 2);
        /* Ponto na borda do pill mais próxima do arco */
        const ang2Lab  = Math.atan2(ly - arcTipY, lx - arcTipX);
        const labEdgeX = lx - Math.cos(ang2Lab) * (pw / 2 + 1);
        const labEdgeY = ly - Math.sin(ang2Lab) * (ph / 2 + 1);
        ctx.beginPath();
        ctx.moveTo(arcTipX, arcTipY);
        ctx.lineTo(labEdgeX, labEdgeY);
        ctx.strokeStyle = rgba('#fbbf24', 0.30);
        ctx.lineWidth   = 0.8;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        /* Pill */
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const bgFill = isLight() ? '#ffffff' : '#0f172a';
        ctx.fillStyle = rgba(bgFill, 0.93);
        ctx.beginPath();
        ctx.roundRect(lx - pw/2, ly - ph/2, pw, ph, 4);
        ctx.fill();
        ctx.strokeStyle = rgba('#fbbf24', 0.70);
        ctx.lineWidth   = 1.2;
        ctx.stroke();

        /* Texto */
        ctx.fillStyle = '#34d399';
        ctx.fillText(txt, lx, ly);
    }

    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  /* ── Caixa wireframe de referência espacial ── */
  _drawBox(ctx, geo3d, cx, cy, baseScale) {
    const maxC = geo3d.reduce((m,a)=>
      Math.max(m,Math.abs(a.x),Math.abs(a.y),Math.abs(a.z)),0.5);
    const s = maxC * 1.55;
    const verts = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1, 1],[1,-1, 1],[1,1, 1],[-1,1, 1],
    ].map(([x,y,z]) => this.camera.project(x*s,y*s*0.7,z*s*0.7, cx,cy,baseScale));
    const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
                 [0,4],[1,5],[2,6],[3,7]];
    const bc = isHiContrast()?'#444444': isLight()?'#c8d3e0':'#1e3a5f';
    ctx.strokeStyle=rgba(bc,0.35); ctx.lineWidth=0.8;
    for (const [a,b] of edges) {
      ctx.beginPath();
      ctx.moveTo(verts[a].sx,verts[a].sy);
      ctx.lineTo(verts[b].sx,verts[b].sy);
      ctx.stroke();
    }
  }

  /* ── HUD ── */
  _drawHUD(ctx, W, H) {
    const tc = textColor();
    const state = window.SILQ_VIEW3D_STATE;

    // Linha 1: geometria + hibridização da molécula atual
    if (state) {
      const molKey = state.getMoleculeKey();
      const db     = state.MOLECULE_GEOMETRY_DB?.[molKey];
      if (db) {
        const geoLabel = `${db.geometry}${db.hybridization ? '  ·  ' + db.hybridization : ''}`;
        const stereoIcon = {
          'tetrahedral':  'sp³ quiral',
          'EZ':           'E/Z',
          'pyramidal':    'piramidal',
          'squareplanar': 'quad. planar',
          'seesaw':       'gangorra',
          'tshaped':      'T-shaped',
          'linear':       'linear',
          'ionic':        'iônico',
        }[db.stereo] || '';
        const hudLine = stereoIcon ? `${geoLabel}  ·  ${stereoIcon}` : geoLabel;
        ctx.font      = '11px Consolas,monospace';
        ctx.fillStyle = rgba(tc, 0.55);
        ctx.textAlign = 'left';
        ctx.fillText(hudLine, 10, H - 36);
      }
    }

    ctx.font='10px Consolas,monospace';
    ctx.fillStyle=rgba(tc,0.60);
    ctx.textAlign='left';
    ctx.fillText('Arraste para rotacionar · Scroll/pinça para zoom', 10, H-22);
    ctx.fillStyle=rgba(tc,0.42);
    ctx.fillText('▶ frente   ╌╌ atrás   ─── plano', 10, H-8);
  }
}

/* ─────────────────────────────────────────────────────────────────────
   5. INICIALIZAÇÃO
───────────────────────────────────────────────────────────────────── */
function init() {
  const viewer = document.getElementById('viewer3d');
  if (!viewer) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'silq-canvas-3d';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label',
    'Visualização 3D da molécula — arraste para rotacionar, scroll para zoom');
  viewer.appendChild(canvas);

  const view3d = new SilqView3D(canvas);
  window.SILQ_VIEW3D = view3d;
  window.SILQ_VIEW3D.toggleAngles = on => {
    view3d.showAngles = (typeof on==='boolean') ? on : !view3d.showAngles;
  };

  (function loop(){ view3d.draw(); requestAnimationFrame(loop); })();
  window.addEventListener('resize', () => { if(view3d.active) view3d._resize(); });
}

if (document.readyState==='loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
