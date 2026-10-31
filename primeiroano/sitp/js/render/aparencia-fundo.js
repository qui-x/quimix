/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDER
   ARQUIVO: aparencia-fundo.js
   ───────────────────────────────────────────────────────────────
   Constrói o gradiente CSS que sugere a aparência real do elemento
   (ver js/data/aparencia-real.js) e aplica como plano de fundo do
   cabeçalho do modal, por trás do símbolo/nome/dados — uma camada
   escura (var(--bg-deep), via color-mix — funciona em qualquer tema
   sem precisar de uma variável extra de "cor em rgb") fica POR CIMA
   pra manter o texto legível, deixando só uma sugestão de cor.
   Depende de: js/data/aparencia-real.js (getAparenciaElemento).
   Usado por: js/modal/abrir-fechar.js (chamado dentro de abrirModal()).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* Um "estilo" de gradiente por tipo de aparência — a mesma forma pra
   qualquer elemento daquele tipo, só as cores mudam. */
function gradientePorTipo(tipo, cor, cor2) {
  switch (tipo) {
    case 'metal':
      // metal escovado: faixas diagonais claro/escuro sugerindo reflexo
      return `linear-gradient(125deg, ${cor2} 0%, ${cor} 25%, ${cor2} 42%, ${cor} 65%, ${cor2} 100%)`;
    case 'liquido':
      // brilho líquido: um realce mais forte e estreito, quase espelhado
      return `linear-gradient(120deg, ${cor2} 0%, ${cor} 30%, #ffffff55 45%, ${cor} 60%, ${cor2} 100%)`;
    case 'cristal':
      // sólido fosco/cristalino: gradiente suave, sem brilho de metal
      return `linear-gradient(160deg, ${cor} 0%, ${cor2} 100%)`;
    case 'gas':
      // gás: brilho radial suave, esmaece nas bordas
      return `radial-gradient(ellipse at 25% 20%, ${cor} 0%, ${cor2}66 45%, transparent 75%)`;
    default:
      return 'none';
  }
}

/* Aplica o fundo no cabeçalho do modal — chamada por abrirModal() logo
   depois de 'est' (estado físico real em 25 °C) já estar calculado.
   Guardado como variável CSS (--aparencia-bg) em vez de direto no
   background-image do elemento, pra a regra em CSS poder empilhar a
   camada escura de legibilidade por cima sem JS precisar saber disso. */
function aplicarFundoAparencia(Z, el, est) {
  const header = document.querySelector('.modal-header');
  if (!header) return;
  const { tipo, cor, cor2 } = getAparenciaElemento(Z, el.cat, est);
  header.style.setProperty('--aparencia-bg', gradientePorTipo(tipo, cor, cor2));
}
