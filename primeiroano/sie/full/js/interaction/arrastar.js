/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERAÇÃO (módulo Estequiometria)
   ARQUIVO: arrastar.js
   ───────────────────────────────────────────────────────────────
   Arrastar um átomo pelo mouse/toque: começa o arraste
   (pointerdown), segue o ponteiro (pointermove) e solta — se soltar
   perto o bastante de outro átomo compatível, tenta formar uma
   ligação.
   Depende de: core/estado-reacao.js, core/canvas-setup.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   10. ARRASTO (corpo estático durante o drag) + MAGNETISMO
   --------------------------------------------------------------- */
const LIMIAR_RUPTURA_MANUAL = 2.3; // x o comprimento natural da ligação — puxar o átomo além disso a rompe

let draggedAtom = null;

let candidatoAtual = null;

function pointFromEvent(evento) {
  const rect = canvas.getBoundingClientRect();
  return { x: evento.clientX - rect.left, y: evento.clientY - rect.top };
}

function encontrarAtomoEm(x, y) {
  let melhor = null, menorD = Infinity;
  atoms.forEach((a) => {
    const d = Math.hypot(a.body.position.x - x, a.body.position.y - y);
    if (d <= a.radiusPx + 4 && d < menorD) { menorD = d; melhor = a; }
  });
  return melhor;
}

canvas.addEventListener("pointerdown", (evento) => {
  if (state !== "ACTIVATED") return;
  const { x, y } = pointFromEvent(evento);
  const atomo = encontrarAtomoEm(x, y);
  if (!atomo) return;

  draggedAtom = atomo;
  draggedAtom.isDragging = true;
  Matter.Body.setStatic(draggedAtom.body, true);
});

canvas.addEventListener("pointermove", (evento) => {
  if (!draggedAtom) return;
  const { x, y } = pointFromEvent(evento);
  Matter.Body.setPosition(draggedAtom.body, { x, y });
  candidatoAtual = encontrarCandidatoProximo(draggedAtom);
  romperLigacoesPorEstiramento(draggedAtom);
});

addEventListener("pointerup", () => {
  if (!draggedAtom) return;
  if (candidatoAtual) formarNovaLigacao(draggedAtom, candidatoAtual);
  Matter.Body.setStatic(draggedAtom.body, false);
  Matter.Body.setVelocity(draggedAtom.body, { x: 0, y: 0 }); // sem ricochete: solta sem nenhuma velocidade residual
  draggedAtom.isDragging = false;
  draggedAtom = null;
  candidatoAtual = null;
});

