/* ═══════════════════════════════════════════════════════════════
   CAMADA: PONTO DE ENTRADA (composition root)
   ARQUIVO: bootstrap.js
   ───────────────────────────────────────────────────────────────
   Liga os atalhos de teclado finais, monta os botões de propriedade
   e, ao evento 'load' da página, monta a tabela periódica inteira e
   os botões de modo propriedade — o disparo final que coloca tudo
   em movimento.
   Depende de: praticamente tudo (é o topo da árvore de
               dependências).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── INICIALIZACAO (a ordem importa) ─────────────────────────────────
   1. renderizar() monta os 118 cards E as celulas da legenda, incluindo
      a de propriedades — que antes vivia no cabecalho e por isso era
      preenchida ANTES do render. Agora tem de ser depois.
   2. os botoes de propriedade, dentro da celula recem-criada
   3. icones de estado nos placeholders do guia
   4. o controle de temperatura
   ------------------------------------------------------------------- */
renderizar();

tabindexMovel();   // define o ponto de entrada unico da grade

montarBotoesPropriedade();

preencherIconesEstado();

montarControleTemperatura();

window.addEventListener('load', () => {
  setTimeout(() => {
    anunciar('Tabela periódica carregada. Use Tab para navegar até a tabela, depois as setas do teclado para mover entre os elementos e Enter para abrir os detalhes. Há botões de acessibilidade na barra de ferramentas: tamanho da fonte, tema, alto contraste e leitura simples.');
  }, 800);
});

