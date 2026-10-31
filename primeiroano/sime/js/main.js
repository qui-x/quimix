/* ═══════════════════════════════════════════════════════════════
   CAMADA: PONTO DE ENTRADA (composition root)
   ARQUIVO: main.js
   ───────────────────────────────────────────────────────────────
   Último arquivo carregado. Define inicializar() — a função que liga
   tudo: cacheia o DOM, conecta eventos, monta os painéis recolhíveis,
   o menu mobile e os módulos de estado físico (Gases/Líquidos/Sólidos),
   constrói a lista de substâncias e faz a primeira renderização (com
   o cilindro vazio, sem substância escolhida, até o usuário selecionar
   uma). Registrada para rodar em DOMContentLoaded.
   Depende de: todos os demais módulos (é o topo da árvore de
               dependências).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   INICIALIZAR
═══════════════════════════════════════════════════════ */
function inicializar() {
  cachearDOM();
  conectarEventos();
  initPanels();
  initMobileMenu();
  construirPainelSubstancia();
  inicializarModulos();
  /* ── ESTADO VAZIO NO CARREGAMENTO ──
     Antes o SIME abria com agua ja selecionada. Isso tinha dois efeitos
     ruins: (1) o aluno via um cilindro cheio sem ter escolhido nada, e
     (2) "tem substancia selecionada" era sempre verdadeiro, entao o
     realce da area central nunca podia significar nada.
     Agora o cilindro nasce vazio e a dica orienta a escolha. Todas as
     funcoes chamadas por atualizarSimulador() ja toleram substancia
     nula (guardas com `if (!sub) return`); a unica que faltava era
     atualizarMateriaVisual, tratada logo abaixo neste arquivo. */
  estado.estadoFisico = '';
  atualizarSimulador();
}
 
document.addEventListener('DOMContentLoaded', inicializar);
