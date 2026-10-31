/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: escala-propriedade.js
   ───────────────────────────────────────────────────────────────
   Mapeia um valor de propriedade periódica (eletronegatividade,
   energia de ionização) para uma cor numa escala contínua — usado
   tanto no card do modal quanto para colorir a tabela inteira no
   "modo propriedade".
   Depende de: dadossitp.js (ESCALA_CALOR, ESCALA_CALOR_MONO,
               EN_MIN/MAX), js/property-mode/logica.js
               (propriedadePorId).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* =====================================================================
   MOTOR DE COR DO MAPA DE CALOR
   ---------------------------------------------------------------------
   corEN(chi) devolve o hex da tonalidade do card, interpolando as
   paradas de cor declaradas na propriedade (dadossitp.js).

   Escolha da escala: no modo daltonico ou em alto contraste usa a rampa
   de luminosidade (ESCALA_CALOR_MONO), porque a colorida passa por verde e
   vermelho — justamente o par que protanopia e deuteranopia confundem.

   corTextoSobre() resolve o problema que um fundo tingido cria: o texto
   do card tem cor fixa e ficaria ilegivel sobre as tonalidades claras
   da escala. Calcula a luminancia relativa do fundo (formula WCAG) e
   devolve texto escuro ou claro conforme o caso, garantindo contraste
   em toda a faixa da escala.
   ===================================================================== */
function escalaDaPropriedade(prop){
  const r = document.documentElement;
  const dalt = r.getAttribute('data-daltonico');
  const alto = r.getAttribute('data-contrast') === 'on';
  const mono = (alto || (dalt && dalt !== 'nenhum'));
  return (mono && prop.escalaMono) ? prop.escalaMono : (prop.escala || ESCALA_CALOR);
}

// mantida para o card de eletronegatividade do modal, que fala de UMA
// propriedade específica e não precisa do registro
function corEN(chi){ return corNaEscala(propriedadePorId('en') || {vmin:EN_MIN,vmax:EN_MAX,escala:ESCALA_CALOR,escalaMono:ESCALA_CALOR_MONO}, chi); }

function hexParaRgb(hex){
  const h = String(hex).replace('#','');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function rgbParaHex(r,g,b){
  return '#' + [r,g,b].map(n=>Math.round(Math.max(0,Math.min(255,n))).toString(16).padStart(2,'0')).join('');
}

/* Generalizada: recebe a propriedade e o valor, e usa as rampas
   declaradas nela. Antes era fixa na escala da eletronegatividade. */
function corNaEscala(prop, v){
  const paradas = escalaDaPropriedade(prop);
  const p = fracaoPropriedade(prop, v);
  for(let i=0; i<paradas.length-1; i++){
    const a = paradas[i], b = paradas[i+1];
    if(p >= a.p && p <= b.p){
      const t = (b.p === a.p) ? 0 : (p - a.p) / (b.p - a.p);
      const ca = hexParaRgb(a.hex), cb = hexParaRgb(b.hex);
      return rgbParaHex(ca[0]+(cb[0]-ca[0])*t, ca[1]+(cb[1]-ca[1])*t, ca[2]+(cb[2]-ca[2])*t);
    }
  }
  return paradas[paradas.length-1].hex;
}

