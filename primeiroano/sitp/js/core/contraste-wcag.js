/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (acessibilidade visual)
   ARQUIVO: contraste-wcag.js
   ───────────────────────────────────────────────────────────────
   Calcula a luminância relativa e a razão de contraste (WCAG 2.1)
   entre duas cores, escolhe automaticamente texto claro ou escuro
   sobre um fundo colorido, e ajusta um fundo até atingir contraste
   mínimo aceitável (AA) contra o texto.
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

const EN_TXT_CLARO  = '#f5f5fb';

const EN_TXT_ESCURO  = '#0b0b14';

const EN_CONTRASTE_MIN = 4.5;   // WCAG 2.1 AA para texto normal

// Luminancia relativa (WCAG 2.1).
function luminancia(hex){
  const lin = c => { c = c/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const [r,g,b] = hexParaRgb(hex);
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}

// Razao de contraste entre duas cores (1:1 a 21:1).
function contraste(a, b){
  const la = luminancia(a), lb = luminancia(b);
  const claro = Math.max(la, lb), escuro = Math.min(la, lb);
  return (claro + 0.05) / (escuro + 0.05);
}

// Escolhe entre texto claro e escuro o que der MAIS contraste sobre o
// fundo. Um limiar fixo de luminancia erra nos tons medios da escala,
// onde nenhum dos dois e obviamente melhor.
function corTextoSobre(hex){
  return contraste(hex, EN_TXT_CLARO) >= contraste(hex, EN_TXT_ESCURO)
    ? EN_TXT_CLARO : EN_TXT_ESCURO;
}

/* Garantia de legibilidade: nos tons medios da escala (verde, ciano)
   NENHUMA das duas cores de texto alcanca 4,5:1. Em vez de aceitar
   texto ilegivel ou de trocar a escala por uma sem graca, o fundo e
   empurrado no sentido oposto ao texto — escurecido se o texto e claro,
   clareado se e escuro — em passos de 4%, ate cruzar o minimo.
   O matiz se mantem, entao a leitura de mapa de calor nao se perde, e
   o contraste passa a ser garantido por construcao, nao por sorte. */
function ajustarFundoParaContraste(bgHex, txtHex){
  const alvoEscuro = txtHex === EN_TXT_CLARO;   // texto claro -> escurecer o fundo
  let [r,g,b] = hexParaRgb(bgHex);
  for(let i = 0; i < 25; i++){
    const atual = rgbParaHex(r,g,b);
    if(contraste(atual, txtHex) >= EN_CONTRASTE_MIN) return atual;
    if(alvoEscuro){ r *= 0.96; g *= 0.96; b *= 0.96; }
    else          { r += (255-r)*0.06; g += (255-g)*0.06; b += (255-b)*0.06; }
  }
  return rgbParaHex(r,g,b);
}

