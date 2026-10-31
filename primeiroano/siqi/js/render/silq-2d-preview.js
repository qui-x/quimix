/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO — INTEGRAÇÃO COM O SILQ (estilo 2D)
   ARQUIVO: silq-2d-preview.js
   ───────────────────────────────────────────────────────────────
   A "pista visual" do desafio bloqueado (Nomenclatura) passa a usar
   o MESMO estilo visual dos átomos 2D do SILQ — círculo colorido com
   anel de elétrons de valência orbitando — em vez do SVG simples de
   círculos+linhas que existia antes. Mesma integração entre
   simuladores da plataforma que o visualizador 3D da Ficha central
   (js/render/silq-integracao.js + view3d-silq.js), só que aqui é uma
   versão ESTÁTICA e leve do lado 2D do SILQ: reaproveita os MESMOS
   átomos/ligações (silqConstruirMolecula), mas dispensa a engrenagem
   inteira de física/arraste/GSAP do SILQ original — não faz sentido
   pra um preview pequeno e não-editável dentro de um card de dica.

   O visual em si (tamanho do átomo, cores, anel de elétrons) é uma
   cópia fiel do CSS real do SILQ (.atom/.electron-orbit/.electron-dot
   — ver css/stylesiqi.css, seção "SILQ 2D preview"), com UMA
   diferença deliberada: a rotação do anel de elétrons usa uma
   animação CSS (@keyframes) em vez do GSAP que o SILQ usa — mesmo
   efeito visual, sem precisar carregar uma biblioteca externa só
   pra girar um anel.

   Depende de: js/render/silq-integracao.js (silqConstruirMolecula,
               silqVsepAngle, ELEMENTS via elementos-silq.js).
   Usado por: js/nomenclatura/desafio.js (pista visual do desafio
              bloqueado, dentro de #nom-lewis-svg → substituído por
              um <div> irmão, #nom-lewis-2d).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   1. LAYOUT 2D — posiciona os átomos usando o MESMO motor de ângulos
      VSEPR do SILQ (silqVsepAngle), só que projetado em 2D (sem Z).
      Mesma ideia recursiva do motor 3D (buildGeometry3D em
      view3d-silq.js): posiciona os ligantes de um centro, depois
      recursa nos que também têm ligantes próprios (ramificações,
      como o H de uma hidroxila pendurada num O central).
════════════════════════════════════════════════════════════════ */
function silq2DCalcularLayout(atoms, bonds){
  if(!atoms.length) return new Map();
  var bCnt = new Map(atoms.map(function(a){ return [a.id, 0]; }));
  bonds.forEach(function(b){
    bCnt.set(b.a, (bCnt.get(b.a)||0) + 1);
    bCnt.set(b.b, (bCnt.get(b.b)||0) + 1);
  });
  var centralId = atoms[0].id, maxC = -1;
  bCnt.forEach(function(c, id){ if(c > maxC){ maxC = c; centralId = id; } });

  var pos = new Map([[centralId, [0,0]]]);
  var placed = new Set([centralId]);
  /* 78px: átomos têm 44px de diâmetro (22px de raio) — com uma
     distância de ligação parecida com o tamanho do átomo, a linha
     ficava quase toda coberta pelos próprios círculos (sobrava ~2px
     visíveis). Achado testando visualmente: com H₂S, a ligação
     "sumia" atrás dos átomos. 78px deixa ~34px de linha visível
     entre as bordas dos círculos. */
  var BOND_PX = 78;

  function colocarLigantes(centerId, refAngle){
    var centerAtom = atoms.find(function(a){ return a.id===centerId; });
    var cenEl = (typeof ELEMENTS!=='undefined' && ELEMENTS[centerAtom.element]) || {};
    var cenPos = pos.get(centerId) || [0,0];
    var meusBonds = bonds.filter(function(b){ return b.a===centerId || b.b===centerId; });
    var ligIds = [];
    meusBonds.forEach(function(b){
      var outroId = b.a===centerId ? b.b : b.a;
      if(!placed.has(outroId) && ligIds.indexOf(outroId)===-1) ligIds.push(outroId);
    });
    if(!ligIds.length) return;

    var nB = ligIds.length;
    var usado = meusBonds.filter(function(b){ return b.type==='covalent'; })
      .reduce(function(s,b){ return s+b.order; }, 0);
    var nLone = Math.max(0, Math.floor(((cenEl.valence||4) - usado) / 2));
    var angRad = (typeof silqVsepAngle==='function') ? silqVsepAngle(nB + (placed.size>1?1:0), nLone) : Math.PI;
    var angDeg = angRad * 180/Math.PI;

    /* `refAngle` já é a direção "pra fora" (do pai pro centro atual) —
       continuar NESSA MESMA direção estende a cadeia radialmente pra
       fora (comportamento certo pra ramificações tipo O–H pendurado
       num oxigênio central). Somar +180° (como numa versão anterior)
       apontava de volta pra PERTO do átomo de origem, quase
       cancelando a posição — bug real, achado testando H₂SO₄
       visualmente: o H ficava desenhado em cima do próprio S. */
    var base = refAngle!==undefined ? refAngle : -Math.PI/2; // aponta pra "longe" do centro anterior
    if(nB === 1){
      var a0 = base;
      var id0 = ligIds[0];
      pos.set(id0, [cenPos[0]+Math.cos(a0)*BOND_PX, cenPos[1]+Math.sin(a0)*BOND_PX]);
      placed.add(id0);
    } else if(angDeg > 175){
      // linear: um de cada lado
      ligIds.forEach(function(id, i){
        var sinal = i%2===0 ? 1 : -1;
        var a = base + (sinal>0?0:Math.PI);
        pos.set(id, [cenPos[0]+Math.cos(a)*BOND_PX, cenPos[1]+Math.sin(a)*BOND_PX]);
        placed.add(id);
      });
    } else {
      // distribui nB ligantes simetricamente ao redor de `base`,
      // espaçados pelo angulo VSEPR calculado (aprox. 2D)
      var passo = (angDeg * Math.PI/180);
      var inicio = base - passo*(nB-1)/2;
      ligIds.forEach(function(id, i){
        var a = inicio + passo*i;
        pos.set(id, [cenPos[0]+Math.cos(a)*BOND_PX, cenPos[1]+Math.sin(a)*BOND_PX]);
        placed.add(id);
      });
    }
    // recursa nos ligantes que também tem ligantes proprios (ramificacao)
    ligIds.forEach(function(id){
      var p = pos.get(id);
      var ang = Math.atan2(p[1]-cenPos[1], p[0]-cenPos[0]);
      colocarLigantes(id, ang);
    });
  }
  colocarLigantes(centralId, undefined);

  /* Auto-escala: moléculas maiores/mais ramificadas (H₂SO₄, H₃PO₄...)
     podem ultrapassar a área visível do card com BOND_PX fixo — achado
     testando H₂SO₄ visualmente (um dos H ficava fora do card, cortado).
     Em vez de um BOND_PX pequeno o bastante pro pior caso (deixando
     moléculas simples minúsculas), calcula o quanto a molécula atual
     realmente ocupa e encolhe SÓ se necessário, mantendo o layout
     grande e legível pros casos comuns (H₂O, HCl, NH₃...). */
  var maxAbs = 1;
  pos.forEach(function(p){ maxAbs = Math.max(maxAbs, Math.abs(p[0]), Math.abs(p[1])); });
  var LIMITE = 82; // metade da altura do card (200px) menos a margem do raio do átomo e um respiro extra
  if(maxAbs > LIMITE){
    var fator = LIMITE / maxAbs;
    pos.forEach(function(p, id){ pos.set(id, [p[0]*fator, p[1]*fator]); });
  }
  return pos;
}

/* ════════════════════════════════════════════════════════════════
   2. RENDERIZAÇÃO — átomo (div, estilo SILQ real) + ligação (SVG,
      mesmas cores/espessura do SILQ real: bond-covalent #4fc3f7,
      bond-ionic #ffb74d).
════════════════════════════════════════════════════════════════ */
function silq2DRenderAtomo(container, atomo, x, y){
  var elData = (typeof ELEMENTS!=='undefined' && ELEMENTS[atomo.element]) || { color:'#94a3b8', valence:0, name:atomo.element };
  var div = document.createElement('div');
  div.className = 'silq2d-atom';
  /* Coordenadas de silq2DCalcularLayout são relativas ao átomo central
     (0,0 = centro da molécula) — calc(50% + Xpx) ancora isso no meio
     visual do container, funcionando em qualquer largura responsiva
     (um deslocamento fixo em px quebraria em telas menores). */
  div.style.left = 'calc(50% + '+x+'px)'; div.style.top = 'calc(50% + '+y+'px)';
  div.style.backgroundColor = elData.color;
  div.style.color = silq2DCorContraste(elData.color);
  div.style.setProperty('--glow-color', elData.color);
  div.setAttribute('role','img');
  div.setAttribute('aria-hidden','true'); // decorativo: a fórmula/legenda em texto já descreve a estrutura
  var span = document.createElement('span');
  span.textContent = atomo.element;
  div.appendChild(span);
  container.appendChild(div);

  var orbit = document.createElement('div');
  orbit.className = 'silq2d-orbit';
  orbit.style.left = 'calc(50% + '+x+'px)'; orbit.style.top = 'calc(50% + '+y+'px)';
  var n = Math.min(elData.valence||0, 8);
  var duracao = (4 + (atomo.id.charCodeAt(atomo.id.length-1)%3)).toFixed(1); // varia um pouco por atomo, sem Math.random
  orbit.style.animationDuration = duracao+'s';
  for(var i=0;i<n;i++){
    var dot = document.createElement('div');
    dot.className = 'silq2d-electron';
    dot.style.transform = 'rotate('+((360/n)*i)+'deg) translateX(19px)';
    orbit.appendChild(dot);
  }
  container.appendChild(orbit);
}

function silq2DCorContraste(hex){
  var h = (hex||'#888888').replace('#','');
  var r = parseInt(h.slice(0,2),16)||128, g = parseInt(h.slice(2,4),16)||128, b = parseInt(h.slice(4,6),16)||128;
  var luminancia = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminancia > 0.6 ? '#0c1520' : '#ffffff';
}

function silq2DRenderLigacao(svg, x1, y1, x2, y2, ordem, tipo){
  var dx = x2-x1, dy = y2-y1, len = Math.hypot(dx,dy) || 1;
  var px = -dy/len, py = dx/len;
  var cls = tipo==='ionic' ? 'silq2d-bond-ionic' : tipo==='metallic' ? 'silq2d-bond-metallic' : 'silq2d-bond-covalent';
  var n = tipo==='covalent' ? Math.max(1, ordem||1) : 1;
  for(var i=0;i<n;i++){
    var off = (i-(n-1)/2) * 6;
    var ln = document.createElementNS('http://www.w3.org/2000/svg','line');
    ln.setAttribute('x1', x1+px*off); ln.setAttribute('y1', y1+py*off);
    ln.setAttribute('x2', x2+px*off); ln.setAttribute('y2', y2+py*off);
    ln.setAttribute('class', cls);
    svg.appendChild(ln);
  }
}

/* ════════════════════════════════════════════════════════════════
   3. ENTRADA PÚBLICA — desenha a molécula (átomos+ligações no estilo
      SILQ) dentro de um container. Espera um <div> com um <svg>
      filho pras ligações (ver estrutura criada em desafio.js).
════════════════════════════════════════════════════════════════ */
function desenharSILQ2D(formula, composto, container){
  if(!container) return;
  container.innerHTML = '<svg class="silq2d-bonds"></svg>';
  var svg = container.querySelector('.silq2d-bonds');
  /* IMPORTANTE: o SVG usa as dimensões REAIS (em px) do container,
     medidas agora, em vez de um viewBox com escala própria — os
     átomos (divs, posicionados com calc(50% + Xpx) em CSS puro) usam
     pixels diretos, sem escala nenhuma. Se o SVG tivesse um viewBox
     "zoomado" (e.g. "-160 -160 320 320"), o preserveAspectRatio
     escalaria as LIGAÇÕES pra caber, mas os ÁTOMOS (fora do SVG,
     posicionados via CSS) não acompanhariam essa escala — em telas
     menores que 360px (o max-width do card), ligação e átomo
     desalinhavam. Corrigido: 1 unidade do SVG = 1px real, sempre,
     medido no momento do desenho. */
  var rect = container.getBoundingClientRect();
  var W = rect.width || 360, H = rect.height || 200;
  svg.setAttribute('viewBox', '0 0 '+W+' '+H);
  var grupo = document.createElementNS('http://www.w3.org/2000/svg','g');
  grupo.setAttribute('transform', 'translate('+(W/2)+','+(H/2)+')');
  svg.appendChild(grupo);

  var molecula;
  try { molecula = silqConstruirMolecula(
    String(formula).replace(/[₀-₉]/g, function(ch){
      var SUB={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
      return SUB[ch]||ch;
    }), composto); }
  catch(err){ molecula = { atoms:[], bonds:[] }; }

  if(!molecula.atoms.length) return;
  var pos = silq2DCalcularLayout(molecula.atoms, molecula.bonds);

  molecula.bonds.forEach(function(b){
    var pa = pos.get(b.a), pb = pos.get(b.b);
    if(!pa || !pb) return;
    silq2DRenderLigacao(grupo, pa[0], pa[1], pb[0], pb[1], b.order, b.type);
  });
  molecula.atoms.forEach(function(a){
    var p = pos.get(a.id); if(!p) return;
    silq2DRenderAtomo(container, a, p[0], p[1]);
  });
}
