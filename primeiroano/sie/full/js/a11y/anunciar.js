/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE (interna)
   ARQUIVO: anunciar.js
   ───────────────────────────────────────────────────────────────
   anunciar() — avisa leitores de tela via live region (aria-live).
   Usado por praticamente todo o simulador (os dois módulos).
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

const a11yAnnouncer = document.getElementById("a11yAnnouncer");

function anunciar(texto) { if (a11yAnnouncer) a11yAnnouncer.textContent = texto; }

