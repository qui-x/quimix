/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE (interna)
   ARQUIVO: anunciar.js
   ───────────────────────────────────────────────────────────────
   anunciar() — avisa leitores de tela via live region (aria-live).
   Usado por praticamente todo o simulador (modal, filtros, séries,
   temperatura, modo lamber).
   ⚠ DEPENDÊNCIA: este projeto inteiro (todos os arquivos de js/) lê
   as tabelas declaradas em dadossitp.js (ESTADO, MASSA,
   MASSA_ISOTOPO, FAMILIA, CAT_COLOR_*, LAMBER_*, CONFIG_EC,
   CURIOSIDADES, elementosBase, lantanideos, actinideos, RAIO,
   RAIO_*) — por isso dadossitp.js precisa carregar ANTES de
   qualquer módulo em js/, no indexsitp.html. Não declare dados
   novos em nenhum arquivo de js/: dado novo vai para dadossitp.js.
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Live region para leitores de tela (modais, filtros, navegação).
function anunciar(msg) {
  const lr = document.getElementById('live-region');
  if (!lr) return;
  lr.textContent = '';
  setTimeout(() => { lr.textContent = msg; }, 50);
}

