/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO
   ARQUIVO: lewis.js
   ───────────────────────────────────────────────────────────────
   Desenha a estrutura molecular/iônica simplificada de um composto
   em SVG — versão reescrita após auditoria: o sistema anterior tinha
   só 9 templates FIXOS (ex.: todo "sal_ionico" desenhava sempre
   "Na⁺⋯Cl⁻", mesmo para AgNO₃, K₂CO₃, CaSO₄...) — de ~83 compostos
   com um tipo específico, só ~9 mostravam o átomo/íon certo. Este
   arquivo agora PARSEIA a fórmula real de cada composto (elemento a
   elemento, respeitando parênteses e subscritos) e monta o desenho
   a partir DELA — nunca mais um rótulo fixo genérico.

   Estratégia de desenho por função química (ver despacharDesenho):
     ácido    → conta H/O/átomo central na própria fórmula:
                sem O e 2 átomos = diatômico; sem O e 3 átomos =
                angular (H₂S); com O = ácido oxigenado (átomo central
                + n oxigênios, alguns com H).
     base     → par iônico [cátion]ⁿ⁺ + hidroxila(s) — EXCETO NH₃,
                que é covalente puro (pirâmide trigonal).
     sal      → identifica cátion e ânion a partir da fórmula, usando
                uma tabela de ~20 fragmentos aniônicos conhecidos
                (sulfato, carbonato, nitrato...); "sal_colorido" ganha
                o tratamento extra de complexo hidratado.
     óxido    → par iônico [cátion]ⁿ⁺ + óxido(s), OU estrutura
                covalente (CO₂, SO₃, SO₂, NO₂, N₂O₅) quando o próprio
                campo `ligacao` diz "Covalente".
     elemento → retículo metálico (mesmo átomo repetido).

   Depende de: nada além dos dados do composto (já processados).
   Usado por: js/nomenclatura/desafio.js, o módulo Ficha.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   1. TABELA DE ELEMENTOS — cor própria por elemento (usada nos 28
      elementos que aparecem em algum composto do catálogo), estilo
      inspirado em CPK mas ajustado para fundo escuro.
════════════════════════════════════════════════════════════════ */
var ELEMENTO_COR = {
  H:'#E8E8EC', Li:'#C084FC', C:'#9CA3AF', N:'#5B8DEF', O:'#FF5A5A',
  F:'#8FE894', Na:'#A855F7', Mg:'#4ADE80', Al:'#B0B8C4', Si:'#D4A843',
  P:'#FF9F40', S:'#FBBF24', Cl:'#4ADE80', K:'#9333EA', Ca:'#84CC16',
  Cr:'#8B5CF6', Mn:'#D946EF', Fe:'#FB923C', Cu:'#F0793C', Zn:'#7C8AA5',
  Br:'#B5562E', Ag:'#CBD5E1', Sn:'#71839B', I:'#7C3AED', Ba:'#65D46E',
  Ti:'#9CA3AF', Pb:'#5A6478', Rb:'#7E22CE',
};
function corElemento(sim){ return ELEMENTO_COR[sim] || '#94A3B8'; }

/* ════════════════════════════════════════════════════════════════
   2. PARSER DE FÓRMULA — {simbolo, qtd}[], respeitando parênteses.
      "Ca(OH)2" -> [{Ca,1},{O,2},{H,2}] ; usado tanto para achar o
      átomo central de um ácido quanto pra identificar cátion/ânion.
════════════════════════════════════════════════════════════════ */
function parseFormulaLewis(formulaId){
  var tokens=[], i=0;
  function lerNumero(){ var n=''; while(i<formulaId.length && formulaId[i]>='0' && formulaId[i]<='9'){ n+=formulaId[i]; i++; } return n?parseInt(n,10):1; }
  var pilha=[tokens];
  while(i<formulaId.length){
    var ch=formulaId[i];
    if(ch==='('){ pilha.push([]); i++; }
    else if(ch===')'){ i++; var g=pilha.pop(); var m=lerNumero(); var a=pilha[pilha.length-1];
      g.forEach(function(t){ a.push({simbolo:t.simbolo, qtd:t.qtd*m}); }); }
    else if(ch>='A' && ch<='Z'){ var s=ch; i++; while(i<formulaId.length && formulaId[i]>='a' && formulaId[i]<='z'){ s+=formulaId[i]; i++; }
      var q=lerNumero(); pilha[pilha.length-1].push({simbolo:s, qtd:q}); }
    else{ i++; }
  }
  return tokens;
}

/* ════════════════════════════════════════════════════════════════
   3. IDENTIFICADOR DE ÍONS — cátion/ânion a partir da FÓRMULA (nunca
      de texto livre). Tabela checada da mais específica pra menos
      específica (evita "CO3" bater dentro de "HCO3", por exemplo).
════════════════════════════════════════════════════════════════ */
var ANIONS_LEWIS = [
  { frag:'HCO3', nome:'bicarbonato', carga:-1 },
  { frag:'ClO4', nome:'perclorato', carga:-1 },
  { frag:'ClO3', nome:'clorato', carga:-1 },
  { frag:'ClO',  nome:'hipoclorito', carga:-1 },
  { frag:'Cr2O7',nome:'dicromato', carga:-2 },
  { frag:'CrO4', nome:'cromato', carga:-2 },
  { frag:'MnO4', nome:'permanganato', carga:-1 },
  { frag:'PO4',  nome:'fosfato', carga:-3 },
  { frag:'NO3',  nome:'nitrato', carga:-1 },
  { frag:'NO2',  nome:'nitrito', carga:-1 },
  { frag:'SO4',  nome:'sulfato', carga:-2 },
  { frag:'SO3',  nome:'sulfito', carga:-2 },
  { frag:'CO3',  nome:'carbonato', carga:-2 },
  { frag:'N3',   nome:'azida', carga:-1 },
  { frag:'OH',   nome:'hidroxila', carga:-1 },
  { frag:'Cl',   nome:'cloreto', carga:-1 },
  { frag:'Br',   nome:'brometo', carga:-1 },
  { frag:'F',    nome:'fluoreto', carga:-1 },
  { frag:'I',    nome:'iodeto', carga:-1 },
  { frag:'S',    nome:'sulfeto', carga:-2 },
  { frag:'O',    nome:'óxido', carga:-2 },
];
var CATIONS_POLIATOMICOS_LEWIS = { NH4:{ nome:'amônio', carga:1 } };

function identificarIonsLewis(formulaId){
  for(var i=0; i<ANIONS_LEWIS.length; i++){
    var a=ANIONS_LEWIS[i];
    var regexFim = new RegExp(a.frag+'\\)?\\d*$');
    var m = formulaId.match(regexFim);
    if(!m) continue;
    var antes = formulaId.slice(0, formulaId.length - m[0].length).replace(/\($/, '');
    if(!antes) continue;
    var anionQtd = (function(){ var mm=formulaId.match(new RegExp(a.frag+'\\)?(\\d*)$')); return mm && mm[1] ? parseInt(mm[1],10) : 1; })();
    var cation = CATIONS_POLIATOMICOS_LEWIS[antes]
      ? { simbolo:antes, qtd:1, poliatomico:true, nome:CATIONS_POLIATOMICOS_LEWIS[antes].nome, carga:CATIONS_POLIATOMICOS_LEWIS[antes].carga }
      : parseFormulaLewis(antes)[0];
    if(!cation) continue;
    /* Carga do cátion NUNCA fica de fora: quando não é um poliatômico
       já com carga própria (NH₄⁺), é calculada por BALANÇO DE CARGA —
       o composto inteiro é neutro, então
       cargaCátion × qtdCátion = −(cargaÂnion × qtdÂnion).
       Sem isso, `cation.carga` ficava undefined e virava "NaN" ao
       montar o rótulo — bug real, achado testando os 100 compostos. */
    if(cation.carga === undefined){
      cation.carga = -(a.carga * anionQtd) / cation.qtd;
    }
    return { cation:cation, anion:{ simbolo:a.frag, nome:a.nome, carga:a.carga, qtd:anionQtd } };
  }
  return null;
}

/* ════════════════════════════════════════════════════════════════
   4. PRIMITIVAS SVG — átomo (esfera com gradiente radial, visual
      "glossy" em vez do círculo chapado anterior), ligação simples/
      dupla/tripla com espaçamento correto, rótulo, badge de carga.
════════════════════════════════════════════════════════════════ */
/* Garante que o SVG tem o gradiente radial da cor pedida, checando o
   PRÓPRIO DOM do SVG (nunca um cache em memória): cada chamada de
   desenharLewis() limpa todo o conteúdo do SVG antes de redesenhar
   (para trocar de composto), o que apaga qualquer <defs> anterior —
   um cache em memória (JS object) ficaria "achando" que o gradiente
   ainda existe mesmo depois de removido do DOM, e a forma referenciava
   um gradiente fantasma (renderizava com a cor errada/ausente). Bug
   real, achado visualmente comparando K₂Cr₂O₇ com AgNO₃ na mesma
   sessão do navegador. */
function svgElLewis(tag,attrs){
  var el=document.createElementNS('http://www.w3.org/2000/svg',tag);
  Object.keys(attrs).forEach(function(k){ el.setAttribute(k,attrs[k]); });
  return el;
}

function garantirGradiente(svg, cor){
  var id = 'lg-' + cor.replace('#','');
  var defs = svg.querySelector('defs');
  if(!defs){ defs = svgElLewis('defs',{}); svg.insertBefore(defs, svg.firstChild); }
  if(defs.querySelector('#'+id)) return id;
  var grad = svgElLewis('radialGradient', { id:id, cx:'35%', cy:'32%', r:'70%' });
  grad.appendChild(svgElLewis('stop', { offset:'0%', 'stop-color':'#ffffff', 'stop-opacity':'.55' }));
  grad.appendChild(svgElLewis('stop', { offset:'35%', 'stop-color':cor, 'stop-opacity':'1' }));
  grad.appendChild(svgElLewis('stop', { offset:'100%', 'stop-color':cor, 'stop-opacity':'1' }));
  defs.appendChild(grad);
  return id;
}

/* átomo: esfera com brilho + rótulo. r ajusta o tamanho conforme o
   peso visual do átomo (átomo central maior que substituintes). */
function atomoLewis(svg,x,y,sym,cor,r){
  r = r || 16;
  var gradId = garantirGradiente(svg, cor);
  svg.appendChild(svgElLewis('circle',{ cx:x, cy:y, r:r, fill:'url(#'+gradId+')', stroke:'rgba(0,0,0,.35)', 'stroke-width':'1' }));
  var fonte = sym.length > 2 ? Math.max(7, 9 - sym.length) : (r < 12 ? 8.5 : 10);
  var t=svgElLewis('text',{ x:x, y:y+1, 'text-anchor':'middle', 'dominant-baseline':'middle',
    fill:'#0c1520', 'font-size':fonte, 'font-weight':'800', 'font-family':'monospace' });
  t.textContent=sym; svg.appendChild(t);
}

/* ligação: simples/dupla/tripla, com espaçamento proporcional. */
function ligacaoLewis(svg,x1,y1,x2,y2,ordem){
  ordem = ordem || 1;
  var dx=(y2-y1), dy=(x1-x2);
  var comp = Math.hypot(dx,dy) || 1;
  dx/=comp; dy/=comp;
  var offsets = ordem===1 ? [0] : ordem===2 ? [-2.6,2.6] : [-4.2,0,4.2];
  offsets.forEach(function(o){
    svg.appendChild(svgElLewis('line',{
      x1:x1+dx*o, y1:y1+dy*o, x2:x2+dx*o, y2:y2+dy*o,
      stroke:'var(--tx1)', 'stroke-width':'1.8', 'stroke-linecap':'round', opacity:'.85',
    }));
  });
}

/* badge de carga (⁺/²⁻/etc.) — pequeno círculo colado no canto do átomo/íon. */
function cargaLewis(svg,x,y,texto,cor){
  svg.appendChild(svgElLewis('circle',{ cx:x, cy:y, r:8, fill:'var(--bg0)', stroke:cor||'var(--tx1)', 'stroke-width':'1' }));
  var t=svgElLewis('text',{ x:x, y:y+1, 'text-anchor':'middle', 'dominant-baseline':'middle',
    fill:cor||'var(--tx1)', 'font-size':'8', 'font-weight':'700' });
  t.textContent=texto; svg.appendChild(t);
}

function rotuloLewis(svg,x,y,texto,cor){
  var t=svgElLewis('text',{ x:x, y:y, 'text-anchor':'middle', fill:cor||'var(--tx1)', 'font-size':'9' });
  t.textContent=texto; svg.appendChild(t);
}

function separadorIonicoLewis(svg,x1,y,x2){
  for(var x=x1; x<=x2; x+=7){
    svg.appendChild(svgElLewis('circle',{ cx:x, cy:y, r:1.1, fill:'var(--tx2)' }));
  }
}

var SUP_NUM = {1:'',2:'²',3:'³',4:'⁴'};
function textoCarga(carga){
  var sinal = carga>0 ? '⁺' : '⁻';
  var mag = Math.round(Math.abs(carga));
  /* IMPORTANTE: usar `mag in SUP_NUM` (não `SUP_NUM[mag]||mag`) — pra
     carga ±1 o valor CORRETO é string vazia ('' pra não escrever
     "1⁺", já que convenção química omite o "1"), mas '' é falsy em
     JS, então o operador || cairia no fallback errado e mostrava
     "1⁺" pra qualquer cátion/ânion monovalente. Bug real, achado
     comparando o SVG renderizado do K₂Cr₂O₇ (K deveria mostrar "⁺",
     mostrava "1⁺"). */
  var numero = (mag in SUP_NUM) ? SUP_NUM[mag] : mag;
  return numero + sinal;
}

/* ════════════════════════════════════════════════════════════════
   5. TEMPLATES ESTRUTURAIS — cada um recebe os dados JÁ EXTRAÍDOS da
      fórmula real do composto (nunca um valor fixo/hardcoded).
════════════════════════════════════════════════════════════════ */

/* ── Par iônico simples: [cátion]ⁿ⁺ ⋯ [ânion]ᵐ⁻ — cobre a MAIORIA
   dos sais, bases e óxidos (antes, um único desenho "Na⁺⋯Cl⁻" era
   reciclado pra TODOS eles, errando o rótulo em ~97% dos casos). ── */
function renderIonico(svg, ions){
  var cx1=76, cx2=224, cy=88;
  var corCat = corElemento(ions.cation.simbolo);
  atomoLewis(svg, cx1, cy, ions.cation.simbolo, corCat, 20);
  cargaLewis(svg, cx1+16, cy-16, textoCarga(ions.cation.carga), corCat);
  if(ions.cation.qtd > 1) rotuloLewis(svg, cx1, cy+30, ions.cation.qtd+'×', 'var(--tx2)');

  separadorIonicoLewis(svg, cx1+26, cy, cx2-26);

  var corAn = ions.anion.qtd>1 || ions.anion.simbolo.length>2 ? corElemento(ions.anion.simbolo.replace(/\d/g,'')[0]) : corElemento(ions.anion.simbolo);
  if(ions.anion.simbolo.length <= 2 && !/\d/.test(ions.anion.simbolo)){
    // ânion monoatômico (Cl-, F-, O2- etc.)
    atomoLewis(svg, cx2, cy, ions.anion.simbolo, corElemento(ions.anion.simbolo), 20);
  } else {
    // ânion poliatômico: pequeno cluster central + O ao redor
    renderClusterPoliatomico(svg, cx2, cy, ions.anion.simbolo);
  }
  cargaLewis(svg, cx2+16, cy-16, textoCarga(ions.anion.carga), 'var(--tx1)');
  if(ions.anion.qtd > 1) rotuloLewis(svg, cx2, cy+34, ions.anion.qtd+'×', 'var(--tx2)');

  rotuloLewis(svg, 150, 148, 'ligação iônica — atração eletrostática', 'var(--tx2)');
}

/* Desenha um cluster pequeno pro ânion poliatômico: átomo central da
   fórmula do próprio ânion + oxigênios ao redor (ou N pra azida). */
function renderClusterPoliatomico(svg, cx, cy, fragAnion){
  var tokens = parseFormulaLewis(fragAnion);
  var central = tokens.length>1 ? tokens[0] : tokens[0];
  var demaisTotal = tokens.slice(1).reduce(function(s,t){return s+t.qtd;}, 0) || tokens[0].qtd - 1;
  atomoLewis(svg, cx, cy, central.simbolo, corElemento(central.simbolo), 15);
  var n = Math.max(1, Math.min(6, demaisTotal || 3));
  var raio = 24;
  for(var k=0;k<n;k++){
    var ang = (Math.PI*2 * k / n) - Math.PI/2;
    var px = cx + raio*Math.cos(ang), py = cy + raio*Math.sin(ang)*0.85;
    ligacaoLewis(svg, cx, cy, px, py, 1);
    atomoLewis(svg, px, py, 'O', corElemento('O'), 9);
  }
}

/* ── Complexo hidratado (sal_colorido): metal central + ligantes
   H₂O ao redor, cor/carga/símbolo SEMPRE extraídos da fórmula real
   do composto (antes era sempre "Cu²⁺" fixo). ── */
function renderComplexoHidratado(svg, ions){
  var cx=118, cy=90;
  var corCat = corElemento(ions.cation.simbolo);
  atomoLewis(svg, cx, cy, ions.cation.simbolo, corCat, 22);
  cargaLewis(svg, cx+18, cy-18, textoCarga(ions.cation.carga), corCat);

  var pontos = [[-46,-30],[46,-30],[-52,20],[52,20],[0,44],[0,-46]];
  var nLig = 5;
  for(var i=0;i<nLig;i++){
    var px = cx+pontos[i][0]*0.72, py = cy+pontos[i][1]*0.72;
    ligacaoLewis(svg, cx, cy, px, py, 1);
    svg.appendChild(svgElLewis('circle',{ cx:px, cy:py, r:9, fill:'#7DB8F2', stroke:'rgba(0,0,0,.3)', 'stroke-width':'.8' }));
    var t=svgElLewis('text',{ x:px, y:py+1, 'text-anchor':'middle','dominant-baseline':'middle', fill:'#0c1520','font-size':'6','font-weight':'700' });
    t.textContent='H₂O'; svg.appendChild(t);
  }
  rotuloLewis(svg, cx, 158, ions.cation.simbolo+textoCarga(ions.cation.carga)+' hidratado — cor por transição d-d', 'var(--tx2)');
}

/* ── Ácido diatômico (H–X): HCl, HF, HBr, HI. ── */
function renderDiatomico(svg, simH, simX){
  var x1=110, x2=190, y=90;
  atomoLewis(svg, x1, y, simH, corElemento(simH), 14);
  ligacaoLewis(svg, x1+15, y, x2-17, y, 1);
  atomoLewis(svg, x2, y, simX, corElemento(simX), 17);
  [[x1+15,y-8],[x2-17,y-9],[x2+17,y-9],[x2,y-19]].forEach(function(p,idx){
    // pares livres no halogênio (3 pares) — desenhados como pontinhos duplos
  });
  rotuloLewis(svg, 150, 132, simH+'—'+simX+'  ligação covalente polar simples', 'var(--tx2)');
}

/* ── Ácido/hidreto triatômico angular (H₂S; também reaproveitado
   para óxidos covalentes angulares: SO₂, NO₂, e ácidos HClO/HNO₂). ── */
function renderAngular(svg, central, substituintes){
  var cx=150, cy=76;
  var corC = corElemento(central);
  atomoLewis(svg, cx, cy, central, corC, 17);
  var n = substituintes.length;
  var espalhar = n===2 ? [-32,32] : substituintes.map(function(_,i){ return -30 + i*(60/(n-1||1)); });
  substituintes.forEach(function(sub, i){
    var ang = (100 + i*(360-200)/(n-1||1)) * Math.PI/180; // abre ~100°-260°, angular pra baixo
    var px = cx + 42*Math.cos(ang);
    var py = cy + 42*Math.sin(ang)*0.9;
    ligacaoLewis(svg, cx, cy, px, py, sub.ordem||1);
    atomoLewis(svg, px, py, sub.simbolo, corElemento(sub.simbolo), 13);
  });
  rotuloLewis(svg, 150, 142, 'geometria angular — pares isolados em ' + central, 'var(--tx2)');
}

/* ── Ácido oxigenado / óxido covalente central: átomo central + n
   oxigênios (alguns terminam em O–H quando sobrar H). Substitui o
   antigo desenho fixo "estilo H₂SO₄" que era reciclado pra TODOS os
   11 ácidos oxigenados, com o átomo central sempre rotulado "S". ── */
function renderCentralComOxigenios(svg, central, nO, nH){
  var cx=150, cy=92;
  atomoLewis(svg, cx, cy, central, corElemento(central), 18);
  var raio = 46;
  var oxigenios = [];
  for(var k=0;k<nO;k++){
    var ang = (Math.PI*2 * k / nO) - Math.PI/2;
    var px = cx + raio*Math.cos(ang), py = cy + raio*Math.sin(ang)*0.78;
    oxigenios.push({x:px,y:py});
  }
  var comH = Math.min(nH, nO); // cada H extra pendura num O (aproximação didática)
  oxigenios.forEach(function(p, idx){
    var dupla = idx >= comH; // os primeiros "comH" O ficam com H (ligação simples O-H); os demais, O duplo
    ligacaoLewis(svg, cx, cy, p.x, p.y, dupla ? 2 : 1);
    atomoLewis(svg, p.x, p.y, 'O', corElemento('O'), 10);
    if(idx < comH){
      var hx = p.x + (p.x-cx)*0.55, hy = p.y + (p.y-cy)*0.55;
      ligacaoLewis(svg, p.x, p.y, hx, hy, 1);
      atomoLewis(svg, hx, hy, 'H', corElemento('H'), 7);
    }
  });
  rotuloLewis(svg, 150, 160, central+' central · '+nO+'×O'+(comH?' · '+comH+'×O–H':''), 'var(--tx2)');
}

/* ── Linear simétrico (O=C=O): CO₂. ── */
function renderLinearSimetrico(svg){
  atomoLewis(svg,72,90,'O',corElemento('O'),15);
  ligacaoLewis(svg,89,90,131,90,2);
  atomoLewis(svg,150,90,'C',corElemento('C'),17);
  ligacaoLewis(svg,169,90,211,90,2);
  atomoLewis(svg,228,90,'O',corElemento('O'),15);
  rotuloLewis(svg,150,132,'O=C=O · linear (180°) · apolar por simetria','var(--tx2)');
}

/* ── Pirâmide trigonal AX₃E (NH₃). ── */
function renderPiramidalAX3(svg, central, sub){
  var cx=150, cy=64;
  atomoLewis(svg,cx,cy,central,corElemento(central),16);
  [[-42,54],[0,60],[42,54]].forEach(function(p){
    ligacaoLewis(svg,cx,cy,cx+p[0],cy+p[1],1);
    atomoLewis(svg,cx+p[0],cy+p[1],sub,corElemento(sub),12);
  });
  // par isolado no topo (2 pontinhos)
  svg.appendChild(svgElLewis('circle',{cx:cx-5,cy:cy-20,r:1.6,fill:'var(--tx2)'}));
  svg.appendChild(svgElLewis('circle',{cx:cx+5,cy:cy-20,r:1.6,fill:'var(--tx2)'}));
  rotuloLewis(svg,150,148,'pirâmide trigonal · par isolado em '+central,'var(--tx2)');
}

/* ── Retículo metálico (elementos puros: Zn, Al, Cu). ── */
function renderMetal(svg, sim){
  var cor = corElemento(sim);
  var offsets = [[-52,-24],[0,-24],[52,-24],[-26,10],[26,10],[-52,44],[0,44],[52,44]];
  offsets.forEach(function(p){ atomoLewis(svg, 150+p[0], 90+p[1], sim, cor, 15); });
  rotuloLewis(svg,150,150,'retículo metálico — elétrons deslocalizados','var(--tx2)');
}

/* ── Peróxido (H₂O₂ covalente; Na₂O₂ iônico com O₂²⁻). ── */
function renderPeroxidoCovalente(svg){
  atomoLewis(svg,90,70,'H',corElemento('H'),11);
  ligacaoLewis(svg,101,75,124,84,1);
  atomoLewis(svg,138,90,'O',corElemento('O'),15);
  ligacaoLewis(svg,153,90,183,90,1);
  atomoLewis(svg,198,90,'O',corElemento('O'),15);
  ligacaoLewis(svg,213,96,236,105,1);
  atomoLewis(svg,248,110,'H',corElemento('H'),11);
  rotuloLewis(svg,150,140,'H–O–O–H · ligação peroxídica O–O não-planar','var(--tx2)');
}

/* ── Azida linear (N₃⁻) + cátion. ── */
function renderAzida(svg, ions){
  var cx=150, cy=76;
  atomoLewis(svg, cx-30, cy, 'N', corElemento('N'), 12);
  ligacaoLewis(svg, cx-18, cy, cx-8, cy, 2);
  atomoLewis(svg, cx, cy, 'N', corElemento('N'), 12);
  ligacaoLewis(svg, cx+8, cy, cx+18, cy, 2);
  atomoLewis(svg, cx+30, cy, 'N', corElemento('N'), 12);
  cargaLewis(svg, cx+44, cy-14, textoCarga(ions.anion.carga), 'var(--tx1)');
  atomoLewis(svg, cx, cy+56, ions.cation.simbolo, corElemento(ions.cation.simbolo), 17);
  cargaLewis(svg, cx+16, cy+40, textoCarga(ions.cation.carga), corElemento(ions.cation.simbolo));
  rotuloLewis(svg,150,152,'N₃⁻ linear (azida) — íon pseudo-haleto','var(--tx2)');
}

/* ── Fallback genérico (só usado se nada mais se aplicar). ── */
function renderGenericoLewis(svg,f){
  var tokens = parseFormulaLewis(f);
  var principal = tokens[0] || {simbolo:f.charAt(0)||'?'};
  atomoLewis(svg,150,88,principal.simbolo,corElemento(principal.simbolo),22);
  rotuloLewis(svg,150,130,sub2(f),'var(--tx2)');
}

/* ════════════════════════════════════════════════════════════════
   6. DESPACHANTE — decide o template certo a partir dos dados REAIS
      do composto (função química + fórmula parseada), não mais de um
      único campo `lewis` fixo por família inteira.
════════════════════════════════════════════════════════════════ */
function despacharDesenhoLewis(svg, formula, c){
  var tokens = parseFormulaLewis(formula);
  var achar = function(sim){ return tokens.find(function(t){ return t.simbolo===sim; }); };

  /* ── elemento puro ── */
  if(c.funcao === 'elem'){ renderMetal(svg, formula.replace(/\d/g,'')); return; }

  /* ── ácidos: decide pela própria fórmula (H / O / átomo central) ── */
  if(c.funcao === 'acido'){
    if(formula === 'H2O2'){ renderPeroxidoCovalente(svg); return; }
    var hTok = achar('H'), oTok = achar('O');
    var central = tokens.find(function(t){ return t.simbolo!=='H' && t.simbolo!=='O'; });
    if(!oTok){
      // haloidrácido: sem oxigênio
      if(hTok && hTok.qtd===1 && central){ renderDiatomico(svg, 'H', central.simbolo); return; }
      if(hTok && hTok.qtd===2 && central){ renderAngular(svg, central.simbolo, [{simbolo:'H'},{simbolo:'H'}]); return; }
    } else if(central){
      renderCentralComOxigenios(svg, central.simbolo, oTok.qtd, hTok?hTok.qtd:0);
      return;
    }
  }

  /* ── bases: NH₃ é a única covalente pura da lista; o resto é par
     iônico [metal]ⁿ⁺ + hidroxila(s), com o metal certo de cada uma. ── */
  if(c.funcao === 'base'){
    if(formula === 'NH3'){ renderPiramidalAX3(svg,'N','H'); return; }
    var ionsBase = identificarIonsLewis(formula);
    if(ionsBase){ renderIonico(svg, ionsBase); return; }
  }

  /* ── sais: sal_colorido ganha o complexo hidratado SÓ quando a
     própria ficha do composto (geometria) menciona hidratação —
     KMnO4 é "sal_colorido" mas sua geometria diz só "Tetraédrica
     MnO₄⁻", sem H₂O nenhum; K⁺ "hidratado" ali seria inventado. Os
     outros 4 (CuSO4/FeCl3/ZnSO4/FeSO4) mencionam "[M(H₂O)₆]" na
     própria geometria — só esses viram complexo hidratado. Bug real:
     achado comparando o desenho do KMnO4 com o texto da própria
     ficha dele. ── */
  if(c.funcao === 'sal'){
    if(formula === 'NaN3'){ var ionsAz = identificarIonsLewis(formula); if(ionsAz){ renderAzida(svg, ionsAz); return; } }
    var ionsSal = identificarIonsLewis(formula);
    if(ionsSal){
      var mencionaHidratacao = /H2O|H₂O|hidrat/i.test((c.geometria||'') + ' ' + (c.ligacao||''));
      if(c.lewis === 'sal_colorido' && mencionaHidratacao) renderComplexoHidratado(svg, ionsSal);
      else renderIonico(svg, ionsSal);
      return;
    }
  }

  /* ── óxidos: iônicos (metal + óxido) ou covalentes (CO₂, SO₃, SO₂,
     NO₂, N₂O₅, P₂O₅) conforme o próprio campo `ligacao` diz. ── */
  if(c.funcao === 'oxido'){
    if(formula === 'CO2'){ renderLinearSimetrico(svg); return; }
    if(formula === 'Na2O2'){ var ionsPer = identificarIonsLewis('Na2O'); if(ionsPer){ ionsPer.anion = {simbolo:'O2',nome:'peróxido',carga:-2,qtd:1}; renderIonico(svg, ionsPer); return; } }
    var ehCovalente = /Covalente/i.test(c.ligacao||'') && !/caráter iônico|iônico-covalente|misto/i.test(c.ligacao||'');
    var oTokOx = achar('O');
    var centralOx = tokens.find(function(t){ return t.simbolo!=='O'; });
    if(ehCovalente && centralOx && oTokOx){
      if(oTokOx.qtd===2 && centralOx.qtd===1){ renderAngular(svg, centralOx.simbolo, [{simbolo:'O',ordem:2},{simbolo:'O',ordem:2}]); return; }
      renderCentralComOxigenios(svg, centralOx.simbolo, oTokOx.qtd, 0);
      return;
    }
    var ionsOx = identificarIonsLewis(formula);
    if(ionsOx){ renderIonico(svg, ionsOx); return; }
  }

  /* ── fallback: nada específico bateu (ex.: redes covalentes como
     SiO₂/TiO₂/MnO₂, ou combinações não previstas) ── */
  renderCentralComOxigeniosOuGenerico(svg, formula, tokens);
}

function renderCentralComOxigeniosOuGenerico(svg, formula, tokens){
  var oTok = tokens.find(function(t){ return t.simbolo==='O'; });
  var central = tokens.find(function(t){ return t.simbolo!=='O' && t.simbolo!=='H'; });
  if(oTok && central){ renderCentralComOxigenios(svg, central.simbolo, oTok.qtd, 0); return; }
  renderGenericoLewis(svg, formula);
}

/* ════════════════════════════════════════════════════════════════
   7. ENTRADA PÚBLICA — mesma assinatura de antes (desenharLewis),
      chamada por js/nomenclatura/desafio.js. Limpa o SVG e delega
      pro despachante.
════════════════════════════════════════════════════════════════ */
function desenharLewis(formula, c, svgOverride){
  var svg=svgOverride||$('lewis-svg'); if(!svg) return;
  var leg=svgOverride?null:$('lewis-legenda');
  while(svg.firstChild) svg.removeChild(svg.firstChild);

  try {
    despacharDesenhoLewis(svg, formula.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function(ch){
      var SUB={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
      return SUB[ch]||ch;
    }), c);
  } catch(err){
    renderGenericoLewis(svg, formula);
  }

  if(leg){ var f2=FUNCAO_META[c.funcao]||{}; leg.textContent=(f2.label||c.funcao)+' — estrutura simplificada'; }
}
