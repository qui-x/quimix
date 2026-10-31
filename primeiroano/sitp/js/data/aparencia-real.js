/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: aparencia-real.js
   ───────────────────────────────────────────────────────────────
   Como cada elemento se APRESENTA de verdade em CNTP (aqui: 25 °C,
   1 atm — a mesma referência que o resto do simulador já usa em
   ESTADO FÍSICO, não a definição antiga de 0 °C): cor e "textura"
   (metálico, gasoso, cristalino/fosco ou líquido), pra colorir o
   fundo do cabeçalho do modal como uma sugestão visual da aparência
   real, sem depender de fotos (que teriam problema de direito
   autoral e de peso de arquivo — 118 fotos é inviável).

   ESTRUTURA EM DUAS CAMADAS, de propósito:
     1) COR_POR_ELEMENTO — só para os ~35 elementos com aparência
        real bem documentada e visualmente distinta (cobre, ouro,
        enxofre, halogênios, mercúrio líquido etc.). Fonte: cor
        observada, não pigmento de tabela didática.
     2) COR_PADRAO_POR_CATEGORIA — para todo o resto. A maioria dos
        metais realmente É cinza-prateado a olho nu (a "cor" que os
        livros pintam por categoria é só código de cores da TABELA,
        não a aparência real — mas cinza-prateado como aparência
        real de um metal desconhecido é uma aposta honesta, não uma
        invenção). Para os elementos sintéticos superpesados (a
        partir de Z~104), a aparência real é literalmente
        desconhecida (produzidos átomo a átomo, decaem em segundos)
        — o cinza-metálico aqui é a extrapolação teórica mais aceita
        pela IUPAC/literatura, não uma medição.

   O TIPO (metálico/gasoso/cristalino/líquido) não é escolhido à mão
   por elemento: vem do ESTADO FÍSICO REAL em 25 °C (que o modal já
   calcula com estadoNaTemperatura(), em temperatura/controle-
   temperatura.js) cruzado com a categoria. Assim o mercúrio (metal,
   mas líquido) e o bromo (halogênio, mas líquido) saem certos
   automaticamente, sem precisar de caso especial escrito à mão.

   Depende de: FUSAO/EBULICAO (dadossitp.js, indiretamente, via
               estadoNaTemperatura), nenhuma outra tabela.
   Usado por: js/render/aparencia-fundo.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const APARENCIA_COR_POR_ELEMENTO = {
  // ── metais de transição com cor própria marcante (a maioria é
  //    cinza-prateada — só estes fogem à regra) ──
  29: ['#e7a06a', '#a85d29'], // Cu — cobre, avermelhado
  47: ['#eef0f2', '#b9bcc1'], // Ag — prata, o metal mais reflexivo
  78: ['#dfe0e2', '#a9acb0'], // Pt — platina, branco-acinzentado
  79: ['#f3cd6a', '#c8942a'], // Au — ouro, amarelo metálico

  // ── metais representativos com aparência distinta ──
  82: ['#8d95a0', '#525a63'], // Pb — chumbo, cinza-azulado fosco
  83: ['#e9c7cf', '#b98d9b'], // Bi — bismuto, rosado com tarnish iridescente
  31: ['#dde0e4', '#aeb2b8'], // Ga — gálio, prateado (funde na mão)

  // ── semimetais/metaloides ──
  5:  ['#4a3a34', '#241a17'], // B  — boro, marrom-escuro/preto
  14: ['#5c6873', '#2c343a'], // Si — silício, cinza-azulado com brilho metálico
  32: ['#8d939a', '#4c5155'], // Ge — germânio, cinza metálico
  33: ['#9aa0a6', '#565b60'], // As — arsênio, cinza-metálico (forma estável)
  51: ['#aeb4ba', '#666b70'], // Sb — antimônio, cinza-prateado
  52: ['#c7c0ac', '#847d69'], // Te — telúrio, branco-prateado

  // ── não-metais sólidos com cor própria ──
  6:  ['#2c2c2c', '#0e0e0e'], // C  — carbono (grafite, forma comum)
  15: ['#8a3230', '#4a1613'], // P  — fósforo (vermelho, forma estável)
  16: ['#f1e24c', '#c8ac1f'], // S  — enxofre, amarelo vivo
  34: ['#786f63', '#3d362d'], // Se — selênio, cinza escuro

  // ── halogênios (cada um bem diferente do vizinho) ──
  9:  ['#eaf5a0', '#c6dd63'], // F  — flúor, gás amarelo muito pálido
  17: ['#d9f0ab', '#a6d95c'], // Cl — cloro, gás verde-amarelado
  35: ['#8a2e1c', '#47160e'], // Br — bromo, ÚNICO não-metal líquido em CNTP
  53: ['#472850', '#1c0f1e'], // I  — iodo, sólido roxo-escuro quase preto

  // ── metal líquido ──
  80: ['#d6d8da', '#96999e'], // Hg — mercúrio, único metal líquido em CNTP

  // ── gases nobres: praticamente incolores de verdade — a "cor"
  //    vibrante que aparece em placas de neon é do gás EXCITADO por
  //    descarga elétrica, não do gás em repouso. Aqui uso só uma
  //    sugestão bem sutil, quase transparente. ──
  2:  ['#eef8ff', '#dceaf8'], // He
  10: ['#eef4ff', '#dde6f7'], // Ne
  18: ['#eefaf5', '#dcf0e8'], // Ar
  36: ['#eef6ff', '#dae8f9'], // Kr
  54: ['#f3eefc', '#e3d9f7'], // Xe
  86: ['#e9ece9', '#d0d5d0'], // Rn
};

/* Cor padrão por categoria — usada quando o elemento não está na
   tabela acima. Ver nota no cabeçalho do arquivo sobre por que
   "cinza-prateado" é uma aposta honesta pra metais em geral. */
const APARENCIA_COR_POR_CATEGORIA = {
  'Metal alcalino':         ['#d9d9dd', '#9d9da3'],
  'Metal alcalino-terroso': ['#cbcbd1', '#909096'],
  'Metal de transição':     ['#cacdd2', '#888c92'],
  'Metal representativo':   ['#c5c9d0', '#83888f'],
  'Lantanídeo':             ['#c8cace', '#8c8e92'],
  'Actinídeo':              ['#c0c2c6', '#85878b'],
  'Semimetal':              ['#8f9296', '#4c4e51'],
  'Não-metal':              ['#d9dce0', '#aeb2b8'],
  'Halogênio':              ['#d8e8c8', '#9fc47a'],
  'Gás nobre':              ['#e9f4fb', '#d0e6f5'],
};

const APARENCIA_COR_FALLBACK = ['#9aa0a6', '#5c6166'];

const APARENCIA_CATEGORIAS_METALICAS = new Set([
  'Metal alcalino', 'Metal alcalino-terroso', 'Metal de transição',
  'Metal representativo', 'Lantanídeo', 'Actinídeo',
]);

/* Monta { tipo, cor, cor2 } pra um elemento — tipo vem do ESTADO REAL
   em 25 °C (S/L/G), não é escolhido à mão por elemento (ver cabeçalho
   do arquivo). 'est' já vem calculado por estadoNaTemperatura() no
   modal, então esta função não recalcula nada, só interpreta. */
function getAparenciaElemento(Z, cat, est) {
  const cores = APARENCIA_COR_POR_ELEMENTO[Z]
    || APARENCIA_COR_POR_CATEGORIA[cat]
    || APARENCIA_COR_FALLBACK;
  let tipo;
  if (est === 'L') tipo = 'liquido';
  else if (est === 'G') tipo = 'gas';
  else tipo = APARENCIA_CATEGORIAS_METALICAS.has(cat) ? 'metal' : 'cristal';
  return { tipo, cor: cores[0], cor2: cores[1] };
}
