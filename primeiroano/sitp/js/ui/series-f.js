/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: series-f.js
   ───────────────────────────────────────────────────────────────
   Expande/recolhe as linhas separadas de lantanídeos e actinídeos
   na tabela periódica.
   Depende de: modal/estado-modal.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function abrirSerie(s){estadoSeries[s]=true;setTimeout(()=>tabindexMovel(),0);document.getElementById(`linha-${s}`)?.classList.remove('recolhida');if(botoesToggle[s]){botoesToggle[s].classList.add('aberta');botoesToggle[s].setAttribute('aria-expanded','true');}}

function fecharSerie(s){estadoSeries[s]=false;setTimeout(()=>tabindexMovel(),0);document.getElementById(`linha-${s}`)?.classList.add('recolhida');if(botoesToggle[s]){botoesToggle[s].classList.remove('aberta');botoesToggle[s].setAttribute('aria-expanded','false');}}

