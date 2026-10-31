/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (renderização)
   ARQUIVO: render-cilindro.js
   ───────────────────────────────────────────────────────────────
   Tudo o que a tela mostra dentro do cilindro experimental (SVG):
     • posição do êmbolo conforme o volume;
     • qual desenho (sólido/líquido/gás) fica visível, e o texto do
       badge de estado físico no cabeçalho;
     • as cores do gelo/líquido/gás específicas da substância ativa;
     • o registro do fenômeno detectado (fusão, vaporização etc.).
   Depende de: core/estado-simulacao.js, core/fisica.js,
               data/estados-e-fenomenos.js, ui/dom-cache.js.
   Usado por: orquestrador.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   DOM — ÊMBOLO E VOLUME
═══════════════════════════════════════════════════════ */
function atualizarEmbolo() {
  if (D.sliderVol) {
    var sv = parseFloat(D.sliderVol.value);
    if (!isNaN(sv)) estado.volume = sv;
  }
  var vol  = estado.volume;
  var prop = (vol - LIMITES.volume.min) / (LIMITES.volume.max - LIMITES.volume.min);
  if (D.displayVol) D.displayVol.textContent = vol + ' %';
  var dy    = prop * 300;
  var emb   = document.getElementById('sv-embolo');
  if (emb) emb.style.transform = 'translateY(' + dy.toFixed(1) + 'px)';
  var yFace = 104 + dy;
  var yBase = 424;
  var gasRect = document.getElementById('sv-gas-rect');
  if (gasRect) {
    gasRect.setAttribute('y',      yFace);
    gasRect.setAttribute('height', Math.max(0, yBase - yFace));
  }
  var altDisp     = Math.max(0, yBase - yFace);
  var posRelativas = [0.18, 0.38, 0.62, 0.82];
  var blobIds     = ['sv-blob-1','sv-blob-2','sv-blob-3','sv-blob-4'];
  for (var bi = 0; bi < blobIds.length; bi++) {
    var blob = document.getElementById(blobIds[bi]);
    if (blob) blob.setAttribute('cy', (yFace + posRelativas[bi] * altDisp).toFixed(1));
  }
  var liqCorpo = document.getElementById('sv-liq-corpo');
  var onda1    = document.getElementById('sv-onda1');
  var onda2    = document.getElementById('sv-onda2');
  var solRect  = document.getElementById('sv-sol-rect');
  if (liqCorpo) {
    liqCorpo.setAttribute('y',      yFace);
    liqCorpo.setAttribute('height', Math.max(0, yBase - yFace));
  }
  if (onda1) onda1.setAttribute('cy', yFace);
  if (onda2) onda2.setAttribute('cy', yFace);
  if (solRect) {
    var altSol = Math.min(84, yBase - yFace);
    solRect.setAttribute('y',      yBase - altSol);
    solRect.setAttribute('height', altSol);
  }
}

/* ═══════════════════════════════════════════════════════
   DOM — VISUAL DO CILINDRO (estado físico)
═══════════════════════════════════════════════════════ */
function atualizarMateriaVisual() {
  /* Sem substancia escolhida nao existe materia para mostrar. Sem esta
     guarda, TRANSICOES cai nos valores padrao (0/100 C) e o cilindro
     desenhava LIQUIDO a 25 C — parecia haver agua dentro antes de o
     aluno escolher qualquer coisa. */
  if (!estado.substancia) {
    var vazios = ['sv-solido','sv-liquido','sv-gasoso'];
    for (var v = 0; v < vazios.length; v++) {
      var el = document.getElementById(vazios[v]);
      if (el) el.setAttribute('opacity', '0');
    }
    if (D.materiaS) D.materiaS.hidden = true;
    if (D.materiaL) D.materiaL.hidden = true;
    if (D.materiaG) D.materiaG.hidden = true;
    if (D.badgeIcone) D.badgeIcone.textContent = '';
    if (D.badgeTexto) D.badgeTexto.textContent = 'sem substância';
    if (D.badge)      D.badge.className        = 'state-pill state-pill--vazio';
    if (D.descricao)  D.descricao.textContent  = 'Escolha uma substancia para comecar.';
    estado.estadoFisico = '';
    return;
  }
  var novo   = determinarEstado(estado.temperatura);
  var mudou  = (novo !== estado.estadoFisico);
  var info   = ESTADOS[novo.toUpperCase()];
 
  if (info) {
    if (D.badgeIcone) D.badgeIcone.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-' + info.icone + '"/></svg>';
    if (D.badgeTexto) D.badgeTexto.textContent = info.nome;
    if (D.badge)      D.badge.className        = 'state-pill ' + novo;
    if (D.descricao)  D.descricao.textContent  = info.descricao;
 
 
 
    var cores = { solido: '#60a5fa', liquido: '#00e696', gasoso: '#a78bfa' };
    var elDesc = document.getElementById('descricao-estado');
    if (elDesc) elDesc.style.borderLeftColor = cores[novo];
  }
 
 
 
  if (!mudou) return;
  estado.estadoFisico = novo;
 
  var svSolido  = document.getElementById('sv-solido');
  var svLiquido = document.getElementById('sv-liquido');
  var svGasoso  = document.getElementById('sv-gasoso');
  if (svSolido)  svSolido.setAttribute('opacity',  novo === 'solido'  ? '1' : '0');
  if (svLiquido) svLiquido.setAttribute('opacity', novo === 'liquido' ? '1' : '0');
  if (svGasoso)  svGasoso.setAttribute('opacity',  novo === 'gasoso'  ? '1' : '0');
 
  if (D.materiaS) D.materiaS.hidden = true;
  if (D.materiaL) D.materiaL.hidden = true;
  if (D.materiaG) D.materiaG.hidden = true;
  var mapa = { solido: D.materiaS, liquido: D.materiaL, gasoso: D.materiaG };
  if (mapa[novo]) mapa[novo].hidden = false;
}

function atualizarCoresCilindro(sub) {
  if (!sub) return;
  var gradGelo   = document.getElementById('grad-gelo');
  var gradLiquido= document.getElementById('grad-liquido');
  if (gradGelo && sub.corSolido && sub.corSolido.length >= 4) {
    var stops = gradGelo.querySelectorAll('stop');
    for (var i = 0; i < stops.length && i < sub.corSolido.length; i++) {
      stops[i].setAttribute('stop-color', sub.corSolido[i]);
    }
  }
  if (gradLiquido && sub.corLiquido && sub.corLiquido.length >= 3) {
    var stopsL = gradLiquido.querySelectorAll('stop');
    for (var j = 0; j < stopsL.length && j < sub.corLiquido.length; j++) {
      stopsL[j].setAttribute('stop-color', sub.corLiquido[j]);
    }
  }
  var gasRect = document.getElementById('sv-gas-rect');
  if (gasRect) gasRect.setAttribute('fill', sub.corGas);
  var blobEls = ['sv-blob-1','sv-blob-2','sv-blob-3','sv-blob-4'];
  var cb = sub.corGasBlob;
  for (var bi = 0; bi < blobEls.length; bi++) {
    var bel = document.getElementById(blobEls[bi]);
    if (bel && cb && cb[bi]) bel.setAttribute('fill', cb[bi]);
  }
}

/* ═══════════════════════════════════════════════════════
   DOM — FENÔMENO
═══════════════════════════════════════════════════════ */
function atualizarFenomeno(chave) {
  // Fenômeno: apenas registrar (setas visuais removidas)
  if (!chave) return;
}
