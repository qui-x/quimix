/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (renderização)
   ARQUIVO: render-pressao.js
   ───────────────────────────────────────────────────────────────
   Tudo o que a tela mostra sobre PRESSÃO: o arco/ponteiro do
   manômetro legado (guardado por "if (el)") e o display de pressão
   com sua faixa de classificação (Normal/Alta/Crítica...).
   Depende de: core/estado-simulacao.js, data/escalas-visuais.js,
               core/fisica.js (encontrarFaixa), ui/dom-cache.js.
   Usado por: orquestrador.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   DOM — MANÔMETRO
═══════════════════════════════════════════════════════ */
function atualizarArcoPressao(anguloFim, cor) {
  var arco = D.arcoPressao;
  if (!arco) return;
  var cx = 100, cy = 100, r = 68;
  var ini = 210, span = 240;
  if (anguloFim <= ini + 1) { arco.setAttribute('d', ''); return; }
  var p1 = svgPonto(cx, cy, r, ini);
  var p2 = svgPonto(cx, cy, r, anguloFim);
  var diff = anguloFim - ini;
  var laf  = diff > 180 ? 1 : 0;
  arco.setAttribute('d',
    'M ' + p1.x.toFixed(2) + ' ' + p1.y.toFixed(2) +
    ' A ' + r + ' ' + r + ' 0 ' + laf + ' 1 ' +
    p2.x.toFixed(2) + ' ' + p2.y.toFixed(2));
  arco.setAttribute('stroke', cor);
}
 
function atualizarManometro() {
  var P = estado.pressao;
  var f = encontrarFaixa(P, FAIXAS_PRESSAO);
  var anguloSVG = 210 + (P / 25)  * 240;
  var rotacao   = anguloSVG - 270;
  if (D.ponteiro) D.ponteiro.setAttribute('transform',
    'rotate(' + rotacao.toFixed(1) + ',100,100)');
  if (D.valorPressaoSVG) D.valorPressaoSVG.textContent = P.toFixed(2);
  if (D.arcoPressao)     atualizarArcoPressao(anguloSVG, f.cor);
  if (D.displayPressao)      D.displayPressao.textContent         = P.toFixed(2) + ' atm';
  if (D.pontoFaixaPressao)   D.pontoFaixaPressao.style.background = f.cor;
  if (D.textoFaixaPressao)   D.textoFaixaPressao.textContent      = f.rotulo;
}
