/* ═══════════════════════════════════════════════════════════════
   CAMADA: FÍSICA (módulo Estequiometria)
   ARQUIVO: magnetismo-limites.js
   ───────────────────────────────────────────────────────────────
   Atração leve entre átomos próximos e compatíveis (facilita formar
   ligação sem precisar de precisão milimétrica) e o confinamento dos
   átomos dentro da área de jogo (rebote nas bordas).
   Depende de: core/estado-reacao.js, core/canvas-setup.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Magnetismo ambiente: nudge de posição sutil e contínuo entre átomos
// com valência aberta — dá vida à cena, mas a ligação só se forma com
// ação manual (arrastar e soltar dentro do raio de captura).
function aplicarMagnetismoAmbiente() {
  const livres = [...atoms.values()].filter((a) => slotsLivres(a) > 0 && !a.isDragging);
  for (let i = 0; i < livres.length; i++) {
    for (let j = i + 1; j < livres.length; j++) {
      const a = livres[i], b = livres[j];
      const dist = Math.hypot(b.body.position.x - a.body.position.x, b.body.position.y - a.body.position.y);
      const raioAtracao = (a.radiusPx + b.radiusPx) * RAIO_ATRACAO_MULT;
      if (dist > raioAtracao || dist < 1) continue;
      const nudge = 0.16 * (1 - dist / raioAtracao);
      const ux = (b.body.position.x - a.body.position.x) / dist, uy = (b.body.position.y - a.body.position.y) / dist;
      Matter.Body.translate(a.body, { x: ux * nudge, y: uy * nudge });
      Matter.Body.translate(b.body, { x: -ux * nudge, y: -uy * nudge });
    }
  }
}

function manterDentroDosLimites() {
  const rect = areaDeJogo();
  atoms.forEach((a) => {
    if (a.isDragging) return;
    const p = a.body.position;
    if (p.x < rect.left) Matter.Body.translate(a.body, { x: 2, y: 0 });
    if (p.x > rect.right) Matter.Body.translate(a.body, { x: -2, y: 0 });
    if (p.y < rect.top) Matter.Body.translate(a.body, { x: 0, y: 2 });
    if (p.y > rect.bottom) Matter.Body.translate(a.body, { x: 0, y: -2 });
  });
}

