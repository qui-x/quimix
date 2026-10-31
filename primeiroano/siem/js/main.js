/* ═══════════════════════════════════════════════════════════════
   CAMADA: PONTO DE ENTRADA (composition root)
   ARQUIVO: main.js
   ───────────────────────────────────────────────────────────────
   Instancia `new App()` ao carregar a página — que por sua vez cria
   a Simulation e o PhaseDiagram, monta a lista de substâncias e liga
   todos os eventos.
   ⚠ ORDEM IMPORTA: precisa carregar DEPOIS de js/view3d/view3d.js e
   ANTES de js/ui/sidebar-resizer.js, para reproduzir exatamente a
   mesma ordem de disparo dos três listeners de DOMContentLoaded que
   o arquivo original tinha (dadossiem.js → view3dsiem.js →
   scriptsiem.js, e dentro deste último: `new App()` antes do
   redimensionador de sidebars).
   Depende de: todos os demais módulos.
═══════════════════════════════════════════════════════════════ */

'use strict';

window.addEventListener('DOMContentLoaded',()=>new App());

