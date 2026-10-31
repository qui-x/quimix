/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (utilitários físico-químicos)
   ARQUIVO: fisica-quimica-utils.js
   ───────────────────────────────────────────────────────────────
   Funções pequenas e reutilizadas o tempo todo: distância entre
   pontos, comprimento de ligação (soma dos raios atômicos), regra do
   octeto (covalentCap), classificação metal/ametal/semimetal, carga
   iônica máxima, capacidade iônica, contraste de cor (WCAG), cor do
   elemento ajustada ao tema ativo, e formatação de carga (ex: "2+").

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, core/namespace.js,
               data/tabela-elementos.js (ELEMENTS).
   Usado por: praticamente todos os módulos de física/renderização.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     5. AUXILIARES FÍSICO-QUÍMICOS CORE
     =================================================================== */
  SILQ.dist = function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); };

  SILQ.getBondLength = function getBondLength(eA, eB) { return (ELEMENTS[eA].radius + ELEMENTS[eB].radius) * SILQ.SCALE; };

  SILQ.covalentCap = function covalentCap(sym) { return (sym === 'H' ? 2 : 8) - ELEMENTS[sym].valence; };

  SILQ.bondOrderSum = function bondOrderSum(id) {
    return SILQ.bonds.filter(b => b.type === 'covalent' && (b.a === id || b.b === id))
                .reduce((s, b) => s + b.order, 0);
  };

  SILQ.isMetal = function isMetal(cat) {
    return ['alkali-metal','alkaline-earth','transition','post-transition','lanthanide','actinide'].includes(cat);
  };

  SILQ.isNonmetal = function isNonmetal(cat) {
    return ['nonmetal','noble-gas'].includes(cat);
  };

  SILQ.isMetalloid = function isMetalloid(cat) {
    return cat === 'metalloid';
  };

  SILQ.maxIonicCharge = function maxIonicCharge(sym) {
    const el = ELEMENTS[sym];
    if (SILQ.isMetal(el.category)) return el.valence;
    return -((sym === 'H' ? 2 : 8) - el.valence);
  };

  SILQ.ionicBondCount = function ionicBondCount(id) {
    return SILQ.bonds.filter(b => b.type === 'ionic' && (b.a === id || b.b === id)).length;
  };

  SILQ.ionicCapacity = function ionicCapacity(sym) {
    return Math.abs(SILQ.maxIonicCharge(sym));
  };

  SILQ.canFormIonicBond = function canFormIonicBond(a, b) {
    const capA = SILQ.ionicCapacity(a.element);
    const capB = SILQ.ionicCapacity(b.element);
    return SILQ.ionicBondCount(a.id) < capA && SILQ.ionicBondCount(b.id) < capB;
  };

  SILQ.getContrastColor = function getContrastColor(hex) {
    /* Escolhe entre texto escuro e claro pelo CONTRASTE REAL (WCAG 2.1),
       nao pela heuristica YIQ que estava aqui antes.

       A versao anterior era:
         (r*299 + g*587 + b*114)/1000 >= 145 ? '#111827' : '#ffffff'

       O limiar 145 do YIQ nao corresponde ao contraste percebido. Medido
       no Chromium, ela escolhia BRANCO para varias cores de categoria e o
       resultado ficava abaixo do minimo:
         teal   #14b8a6 + branco -> 2.49:1   (com escuro: 3.66:1)
         verde  #10b981 + branco -> 2.54:1
         laranja#f97316 + branco -> 2.80:1

       Agora calcula a razao de contraste com os dois candidatos e devolve
       o melhor. Nao e possivel garantir 4.5:1 para toda cor de categoria
       apenas trocando o texto — algumas cores de meio-tom nao alcancam
       isso com preto nem com branco. Mas escolher o melhor dos dois eleva
       todos os casos e nunca piora nenhum. */
    const ESCURO = '#111827', CLARO = '#ffffff';
    const c = hex.replace('#','');
    const rgb = [0,2,4].map(i => parseInt(c.substr(i,2),16));
    const canal = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    const lum = ([r,g,b]) => 0.2126*canal(r) + 0.7152*canal(g) + 0.0722*canal(b);
    const razao = (a, b) => { const L1 = lum(a), L2 = lum(b);
      return (Math.max(L1,L2) + 0.05) / (Math.min(L1,L2) + 0.05); };
    return razao(rgb, [17,24,39]) >= razao(rgb, [255,255,255]) ? ESCURO : CLARO;
  };

  /* As cores de cada elemento (CATALOG[x].color) foram escolhidas pra
     "brilhar" contra o fundo quase-preto do tema escuro — por isso
     várias são tons bem claros/quase-brancos (ex.: Hidrogênio #dbeafe).
     No tema claro, esses mesmos tons ficam praticamente invisíveis,
     se misturando com o fundo (era exatamente o bug relatado: cor
     "existe" nos dados, mas não se distingue visualmente). Esta função
     escurece/satura qualquer cor muito clara antes de desenhá-la,
     preservando o tom (matiz) original — só ajusta o quanto necessário
     pra continuar visível em qualquer fundo. */
  SILQ.themedElementColor = function themedElementColor(hex) {
    if (!document.body.classList.contains('light-mode')) return hex;
    const c = hex.replace('#','');
    let r=parseInt(c.substr(0,2),16)/255, g=parseInt(c.substr(2,2),16)/255, b=parseInt(c.substr(4,2),16)/255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0, s=0, l=(max+min)/2;
    const d=max-min;
    if (d>0) {
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      if (max===r) h=((g-b)/d + (g<b?6:0));
      else if (max===g) h=(b-r)/d+2;
      else h=(r-g)/d+4;
      h/=6;
    }
    if (l < 0.62) return hex; // já é escura/saturada o bastante, não precisa de ajuste
    l = 0.5; s = Math.max(s, 0.55); // escurece e garante saturação mínima
    const hue2rgb=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
    const q = l<0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
    const toHex=(v)=>Math.round(v*255).toString(16).padStart(2,'0');
    return '#'+toHex(hue2rgb(p,q,h+1/3))+toHex(hue2rgb(p,q,h))+toHex(hue2rgb(p,q,h-1/3));
  };

  /* Reaplica as cores de elemento/categoria depois de uma troca de tema
     (chamado pelo receptor de acessibilidade, que vive num escopo
     separado — ver window.__silqRefreshThemedColors mais abaixo).
     Sem isto, células da tabela, legenda e átomos já montados no canvas
     ficariam com a cor "antiga" até o usuário recarregar a página. */
  SILQ.refreshThemedColors = function refreshThemedColors() {
    SILQ.buildPeriodicTable();
    SILQ.buildLegend();
    SILQ.canvasAtoms.forEach(atom => {
      if (!atom.dom) return;
      const data = ELEMENTS[atom.element];
      const c = SILQ.themedElementColor(data.color);
      atom.dom.style.backgroundColor = c;
      atom.dom.style.color = SILQ.getContrastColor(c);
      atom.dom.style.setProperty('--glow-color', c);
    });
  };

  window.__silqRefreshThemedColors = SILQ.refreshThemedColors;

  SILQ.formatCharge = function formatCharge(ch) {
    if (!ch) return '';
    const mag=Math.abs(ch), sup={1:'',2:'²',3:'³'}, sign=ch>0?'⁺':'⁻';
    return `${mag>1?(sup[mag]||mag):''}${sign}`;
  };
});


