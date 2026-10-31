/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (canvas)
   ARQUIVO: canvas-setup.js
   ───────────────────────────────────────────────────────────────
   Referência ao <canvas id="scene"> e seu contexto 2D, o
   redimensionamento (mantém a resolução do canvas em sincronia com
   o tamanho real na tela, inclusive em rotação de celular) e o
   cálculo da "área de jogo" utilizável (a região onde os átomos
   podem ser posicionados, considerando a barra lateral colapsável em
   telas pequenas).
   Depende de: nada.
   Usado por: praticamente todos os módulos de renderização.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   6. CANVAS 2D
   --------------------------------------------------------------- */
const canvas = document.getElementById("scene");

const ctx = canvas.getContext("2d");

let DPR_CENA = 1;                       // o DPR do buffer (o draw() refaz a transformação a cada quadro)

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  DPR_CENA = dpr;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

addEventListener("resize", resize);

addEventListener("orientationchange", () => setTimeout(resize, 150));

resize();

/* ---------------------------------------------------------------
   A ÁREA LIVRE — o card flutuante do trilho (ver sidebar-rail.js ·
   Oclusao) cobre uma faixa da moldura sem mudar o tamanho do canvas.
   Os átomos vivem em px absolutos dentro do Matter.js: mudar a área de
   jogo empurraria um a um contra a borda do card (e eles não voltariam
   quando ele fechasse). Então a CENA INTEIRA — a moldura — é desenhada
   em escala na parte que se vê: s = largura livre / largura da moldura,
   encostada no lado livre e centrada na vertical. A física continua nas
   mesmas coordenadas; só o desenho e o clique passam pela vista.
     tela = mundo × s + (tx, ty)      mundo = (tela − (tx, ty)) / s
   --------------------------------------------------------------- */
let VISTA_CENA = { s: 1, tx: 0, ty: 0 };   // a do último quadro desenhado (é a que o aluno vê e clica)

function vistaDaCena() {
  const O = window.Oclusao, moldura = document.getElementById("canvas-area");
  if (!O || !moldura || innerWidth <= 900) return { s: 1, tx: 0, ty: 0 };
  const o = O.area(moldura);
  if (!(o.esq + o.dir > 0.5) || !(o.W > 0)) return { s: 1, tx: 0, ty: 0 };
  const cr = canvas.getBoundingClientRect(), mr = moldura.getBoundingClientRect();
  const fx = mr.left - cr.left, fy = mr.top - cr.top, s = o.w / o.W;   // a moldura, nas coordenadas do canvas
  return { s, tx: fx + o.x - fx * s, ty: fy + mr.height * (1 - s) / 2 - fy * s };
}

const BREAKPOINT_MOBILE = 768;

function areaDeJogo() {
  const headerEl = document.querySelector(".app-header");
  const headerH = headerEl ? headerEl.getBoundingClientRect().height : 54;
  const top = headerH + 24; // título/status saíram do canvas; só uma margem de respiro
  const bottom = innerHeight - 24;

  // Em telas estreitas as sidebars viram GAVETAS que sobrepõem o canvas
  // (como em qualquer app mobile padrão) em vez de espremê-lo — então o
  // canvas usa a largura/altura cheias da tela, estejam as gavetas
  // abertas ou não.
  if (innerWidth <= BREAKPOINT_MOBILE) {
    const left = 14;
    const right = innerWidth - 14;
    return { left, right: Math.max(left + 150, right), top, bottom: Math.max(top + 150, bottom) };
  }

  // Medido em tempo real a partir do DOM (sidebar à esquerda, HUD à
  // direita, cabeçalho fixo no topo) — evita "chutar" margens fixas que
  // ficam erradas sempre que o layout muda (era a causa de átomos
  // aparecerem atrás da sidebar).
  const sidebarEl = document.getElementById("sidebar-left");
  const hudEl = document.getElementById("sidebar-right");
  // TRILHO RECOLHÍVEL: recolhida, a sidebar fica INVISÍVEL mas conserva
  // a largura dela (é uma camada fixed fora de vista, não display:none).
  // Medi-la devolveria 360px e confinaria os átomos à região antiga,
  // com a moldura do canvas já expandida até o trilho — a moldura crescia
  // e a física não. Recolhida, quem ocupa a borda é o trilho, então é ele
  // que se mede. Ver o adaptador no fim de css/stylesie.css.
  const larguraDaBorda = (sb, idTrilho, reserva) => {
    if (!sb) return reserva;
    if (sb.classList.contains("is-collapsed")) {
      const t = document.getElementById(idTrilho);
      return t ? t.getBoundingClientRect().width : 56;
    }
    return sb.getBoundingClientRect().width;
  };
  const sidebarW = larguraDaBorda(sidebarEl, "rail-left", 360);
  const hudW = hudEl ? larguraDaBorda(hudEl, "rail-right", 0) : 0; // 0 quando oculto (display:none)

  const left = sidebarW + 40;
  const right = innerWidth - (hudW > 0 ? hudW + 64 : 40);
  return {
    left,
    right: Math.max(left + 200, right),
    top,
    bottom: Math.max(top + 200, bottom),
  };
}

