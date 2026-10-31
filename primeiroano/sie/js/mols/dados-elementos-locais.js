/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS (dados locais)
   ARQUIVO: dados-elementos-locais.js
   ───────────────────────────────────────────────────────────────
   Junta as 3 listas de elementos vindas de dadossitp.js (base +
   lantanídeos + actinídeos) num único array de 118 elementos e num
   mapa por símbolo — mesma combinação que o SITP original usa
   internamente. Os ícones SVG usados nos cartões de propriedade
   (ionização, eletronegatividade) também ficam aqui.
   Depende de: dadossitp.js (elementosBase, lantanideos, actinideos
               — script externo, ver README).
   Usado por: praticamente todo o módulo Mols.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ===================================================================
   MÓDULO MOLS — funções extraídas do scriptsitp.js (SITP)
   ===================================================================
   Os DADOS (118 elementos, massas, config eletrônica, fusão/ebulição,
   curiosidades, propriedades) vêm de graça via <script src="dadossitp.js">
   no HTML — zero cópia, mesmo arquivo que o SITP usa.

   Só as FUNÇÕES PURAS abaixo foram extraídas (copiadas) do
   scriptsitp.js: são as que renderizam o conteúdo do modal a partir
   dos dados, sem tocar em nenhum elemento de DOM específico do SITP
   (grade de 118 células, slider de temperatura, filtros). O card de
   Raio Atômico (5 vistas: Dados/Grade/Bohr/Lewis/Nuvem, ~721 linhas)
   ficou de fora por decisão — não tem relação com massa molar.

   TEMP_REF (25 °C, de dadossitp.js) é usado como temperatura fixa em
   todo canto que o SITP original deixaria variável por um slider — o
   Mols não tem controle de temperatura.
   =================================================================== */

// Os 118 elementos, juntando as 3 listas do dadossitp.js — mesma
// combinação que o SITP usa internamente ([...elementosBase, ...lantanideos, ...actinideos]).
const TODOS_ELEMENTOS_MOLS = [...elementosBase, ...lantanideos, ...actinideos];

const ELEMENTO_POR_SIMBOLO_MOLS = {};

TODOS_ELEMENTOS_MOLS.forEach((el) => { ELEMENTO_POR_SIMBOLO_MOLS[el.simbolo] = el; });

// Só os dois ícones que os cards de propriedade usam (ionização e
// eletronegatividade) — o de raio ficou de fora junto com o card.
const ICO_MOLS = {
  ionizacao: '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="9.6" cy="14.2" r="5.5"/><line x1="7.4" y1="14.2" x2="11.8" y2="14.2"/><line x1="9.6" y1="12" x2="9.6" y2="16.4"/><line x1="14.4" y1="9.4" x2="19.2" y2="4.6"/><polyline points="15.6,4.4 19.6,4.4 19.6,8.4"/></svg>',
  en: '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="7" cy="12" r="4.1"/><circle cx="17" cy="12" r="5.5"/><circle cx="14.2" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
};

