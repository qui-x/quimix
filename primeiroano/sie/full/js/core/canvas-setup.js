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

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

addEventListener("resize", resize);

addEventListener("orientationchange", () => setTimeout(resize, 150));

resize();

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
  const sidebarW = sidebarEl ? sidebarEl.getBoundingClientRect().width : 360;
  const hudW = hudEl ? hudEl.getBoundingClientRect().width : 0; // 0 quando oculto (display:none)

  const left = sidebarW + 40;
  const right = innerWidth - (hudW > 0 ? hudW + 64 : 40);
  return {
    left,
    right: Math.max(left + 200, right),
    top,
    bottom: Math.max(top + 200, bottom),
  };
}

