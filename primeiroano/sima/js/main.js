/* ═══════════════════════════════════════════════════════════════
   CAMADA: PONTO DE ENTRADA (composition root)
   ARQUIVO: main.js
   ───────────────────────────────────────────────────────────────
   Último arquivo carregado. Instancia `new AtomicApp()` — que por
   sua vez cria o AtomicSim, monta a tabela periódica e liga todos
   os eventos — e inicializa o menu mobile. Ambos aguardam
   DOMContentLoaded.
   Depende de: todos os demais módulos (é o topo da árvore de
               dependências).
═══════════════════════════════════════════════════════════════ */

'use strict';

window.addEventListener('DOMContentLoaded',()=>new AtomicApp());
window.addEventListener('DOMContentLoaded', initMobileSidebar);

