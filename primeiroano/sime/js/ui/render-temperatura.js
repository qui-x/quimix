/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (renderização)
   ARQUIVO: render-temperatura.js
   ───────────────────────────────────────────────────────────────
   Tudo o que a tela mostra sobre TEMPERATURA:
     • display numérico e faixa (Fria/Ambiente/Quente...);
     • chapa aquecedora (cor conforme a temperatura);
     • barra de progresso térmico (zonas sólido/líquido/gasoso e o
       cursor da temperatura atual);
     • linhas de fusão/ebulição no termômetro legado (guardadas por
       "if (el)", ver nota em dom-cache.js);
     • o range dinâmico do slider (expande/contrai para sempre manter
       Tf e Tb visíveis);
     • a calibração inicial do slider ao trocar de substância.
   Depende de: core/estado-simulacao.js, core/fisica.js,
               data/escalas-visuais.js, ui/dom-cache.js.
   Usado por: orquestrador.js, ui/painel-substancias.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   DOM — TEMPERATURA
═══════════════════════════════════════════════════════ */
function atualizarDisplayTemperatura() {
  var t = estado.temperatura;
  ajustarRangeTemperatura();     // expande/contrai range conforme a temperatura
  if (D.displayTemp)    D.displayTemp.textContent    = t + ' °C';
  var f = encontrarFaixa(t, FAIXAS_TEMPERATURA);
  if (D.pontoFaixaTemp) D.pontoFaixaTemp.style.background = f.cor;
  if (D.textoFaixaTemp) D.textoFaixaTemp.textContent      = f.rotulo;
}
 
function tempParaTermometro(tempC) {
  var mn  = D.sliderTemp ? parseFloat(D.sliderTemp.min)  : LIMITES.temperatura.min;
  var mx  = D.sliderTemp ? parseFloat(D.sliderTemp.max)  : LIMITES.temperatura.max;
  var alt = TERMOMETRO.alturaMaxima;
  var prop = (mx > mn) ? (tempC - mn) / (mx - mn) : 0;
  var h = Math.max(4, Math.min(alt, prop * alt));
  return { y: 175 - h, height: h };
}
 
function atualizarTermometro() {
  var tv  = tempParaTermometro(estado.temperatura);
  var cor = corTermometro(estado.temperatura);
  if (D.mercurioColuna) {
    D.mercurioColuna.setAttribute('y',      tv.y);
    D.mercurioColuna.setAttribute('height', tv.height);
    D.mercurioColuna.setAttribute('fill',   cor);
  }
  if (D.mercurioBulbo) D.mercurioBulbo.setAttribute('fill', cor);
}

/* ═══════════════════════════════════════════════════════
   DOM — CHAPA AQUECEDORA
═══════════════════════════════════════════════════════ */
function atualizarChapa() {
  var chapaSVG = document.getElementById('sv-chapa');
  var res = ['sv-res-1','sv-res-2','sv-res-3','sv-res-4'];
  var t = estado.temperatura;
  var cor, brilho;
  if (t > 300)      { cor = '#FF2200'; brilho = '#FF6644'; }
  else if (t > 150) { cor = '#CC4400'; brilho = '#FF8833'; }
  else if (t > 50)  { cor = '#882200'; brilho = '#CC4422'; }
  else if (t > 0)   { cor = '#3D2010'; brilho = '#5a3020'; }
  else              { cor = '#0a1a2a'; brilho = '#1a3a5a'; }
  if (chapaSVG) chapaSVG.setAttribute('fill', cor);
  for (var i = 0; i < res.length; i++) {
    var el = document.getElementById(res[i]);
    if (el) el.setAttribute('stroke', brilho);
  }
}

/* ═══════════════════════════════════════════════════════
   DOM — CURSOR TÉRMICO
═══════════════════════════════════════════════════════ */
function atualizarCursorTermico() {
  var Tf   = TRANSICOES.fusao;
  var Tb   = TRANSICOES.ebulicao;
  var t    = estado.temperatura;
  var mn   = D.sliderTemp ? parseFloat(D.sliderTemp.min)  : -50;
  var mx   = D.sliderTemp ? parseFloat(D.sliderTemp.max)  : 300;
  var span = mx - mn;
  if (span <= 0) return;
 
  var fS = Math.max(0.5, Tf - mn);
  var fL = Math.max(0.5, Tb - Tf);
  var fG = Math.max(0.5, mx - Tb);
  if (D.tpZonaSolido)  D.tpZonaSolido.style.flexGrow  = fS;
  if (D.tpZonaLiquido) D.tpZonaLiquido.style.flexGrow = fL;
  if (D.tpZonaGasoso)  D.tpZonaGasoso.style.flexGrow  = fG;
  if (D.tpLblFusao)    D.tpLblFusao.textContent    = Tf.toFixed(0) + '°C';
  if (D.tpLblEbulicao) D.tpLblEbulicao.textContent = Tb.toFixed(0) + '°C';
 
  var pct = Math.max(0, Math.min(100, (t - mn) / span * 100));
  var cursor = document.getElementById('tp-cursor');
  if (cursor) cursor.style.left = pct.toFixed(2) + '%';
 
}

/* ═══════════════════════════════════════════════════════
   DOM — LINHAS E CORES DO CILINDRO
═══════════════════════════════════════════════════════ */
function atualizarLinhasTermometro(sub) {
  if (!sub || !D.sliderTemp) return;
  var mn = parseFloat(D.sliderTemp.min);
  var mx = parseFloat(D.sliderTemp.max);
  var span = mx - mn;
  if (span <= 0) return;
  var alt = TERMOMETRO.alturaMaxima;
  var yBase = 175;
  function tempY(t) {
    var p = Math.max(0, Math.min(1, (t - mn) / span));
    return yBase - p * alt;
  }
  var lf = document.getElementById('linha-fusao');
  var le = document.getElementById('linha-ebulicao');
  if (lf) lf.setAttribute('y1', tempY(TRANSICOES.fusao).toFixed(1)),
          lf.setAttribute('y2', tempY(TRANSICOES.fusao).toFixed(1));
  if (le) le.setAttribute('y1', tempY(TRANSICOES.ebulicao).toFixed(1)),
          le.setAttribute('y2', tempY(TRANSICOES.ebulicao).toFixed(1));
  if (D.lblTmin) D.lblTmin.textContent = mn + '°C';
  if (D.lblTmax) D.lblTmax.textContent = mx + '°C';
  if (D.lblTmid) D.lblTmid.textContent = Math.round((mn + mx) / 2) + '°C';
}

/* ═══════════════════════════════════════════════════════
   RANGE DINÂMICO — ajusta o slider conforme a temperatura.
   Expande ao se aproximar dos limites.
   Contrai quando a temperatura retorna à zona central,
   mantendo sempre Tf e Tb visíveis com margem adequada.
═══════════════════════════════════════════════════════ */
function ajustarRangeTemperatura() {
  if (!D.sliderTemp || !estado.substancia) return;
 
  var t    = estado.temperatura;
  var sub  = estado.substancia;
 
  var TEMP_PADRAO = 25;
  var MARGEM_FIXA = 30;
  var MARGEM_PROP = 0.30;
  var BLOCO       = 50;
  var LIMIAR_EXP  = 0.08;
 
  var span   = Math.abs(sub.Tb - sub.Tf);
  var margem = Math.max(40, Math.round(span * MARGEM_PROP));
 
  // Range ideal — cobre Tf/Tb da substância + 25°C
  var minIdeal = Math.min(sub.Tf - margem, TEMP_PADRAO - MARGEM_FIXA);
  var maxIdeal = Math.max(sub.Tb + margem, TEMP_PADRAO + MARGEM_FIXA);
 
  // Estender para cobrir T com margem mínima se necessário
  if (t - MARGEM_FIXA < minIdeal) minIdeal = t - MARGEM_FIXA;
  if (t + MARGEM_FIXA > maxIdeal) maxIdeal = t + MARGEM_FIXA;
 
  minIdeal = Math.max(LIMITES.temperatura.min, Math.floor(minIdeal / 5) * 5);
  maxIdeal = Math.min(LIMITES.temperatura.max, Math.ceil (maxIdeal / 5) * 5);
 
  var minAtual  = parseFloat(D.sliderTemp.min);
  var maxAtual  = parseFloat(D.sliderTemp.max);
  var spanAtual = maxAtual - minAtual;
  var novoMin   = minAtual;
  var novoMax   = maxAtual;
  var mudou     = false;
 
  // ── Expansão: T perto dos extremos atuais ──
  if (t >= maxAtual - spanAtual * LIMIAR_EXP && maxAtual < LIMITES.temperatura.max) {
    novoMax = Math.min(LIMITES.temperatura.max, maxAtual + BLOCO);
    mudou   = true;
    // Expansão tem prioridade — retorna imediatamente
  } else if (t <= minAtual + spanAtual * LIMIAR_EXP && minAtual > LIMITES.temperatura.min) {
    novoMin = Math.max(LIMITES.temperatura.min, minAtual - BLOCO);
    mudou   = true;
  } else {
    // ── Contração direta: T confortavelmente dentro do ideal ──
    var spanIdeal = maxIdeal - minIdeal;
    var folga     = Math.max(20, spanIdeal * 0.15);
    var tConf     = (t > minIdeal + folga) && (t < maxIdeal - folga);
 
    if (tConf) {
      if (maxAtual > maxIdeal) { novoMax = maxIdeal; mudou = true; }
      if (minAtual < minIdeal) { novoMin = minIdeal; mudou = true; }
    }
  }
 
  if (!mudou) return;
 
  var step = Math.max(1, Math.round((novoMax - novoMin) / 200));
  D.sliderTemp.min   = novoMin;
  D.sliderTemp.max   = novoMax;
  D.sliderTemp.step  = step;
  D.sliderTemp.value = t;
 
  if (D.sliderTempMin) D.sliderTempMin.textContent = novoMin + ' °C';
  if (D.sliderTempMax) D.sliderTempMax.textContent = novoMax + ' °C';
  if (D.lblTmin) D.lblTmin.textContent = novoMin + '°C';
  if (D.lblTmax) D.lblTmax.textContent = novoMax + '°C';
  if (D.lblTmid) D.lblTmid.textContent = Math.round((novoMin + novoMax) / 2) + '°C';
 
  atualizarTermometro();
  atualizarLinhasTermometro(estado.substancia);
  atualizarCursorTermico();
}

/* ═══════════════════════════════════════════════════════
   CALIBRAR SLIDER DE TEMPERATURA
═══════════════════════════════════════════════════════ */
function calibrarSliderTemp(sub) {
  var TEMP_PADRAO = 25;
  var MARGEM_FIXA = 30;
  var span   = sub.Tb - sub.Tf;
  var margem = Math.max(40, Math.round(span * 0.30));
  var minBruto = Math.min(sub.Tf - margem, TEMP_PADRAO - MARGEM_FIXA);
  var maxBruto = Math.max(sub.Tb + margem, TEMP_PADRAO + MARGEM_FIXA);
  var min = Math.max(-273, Math.floor(minBruto / 5) * 5);
  var max = Math.ceil(maxBruto / 5) * 5;
  var step = Math.max(1, Math.round((max - min) / 200));
  var tempInicial = TEMP_PADRAO;
  D.sliderTemp.min   = min;
  D.sliderTemp.max   = max;
  D.sliderTemp.step  = step;
  D.sliderTemp.value = tempInicial;
  var tempReal = parseFloat(D.sliderTemp.value);
  estado.temperatura = tempReal;
  if (D.displayTemp) D.displayTemp.textContent = tempReal + ' °C';
  if (D.sliderTempMin) D.sliderTempMin.textContent = min + ' °C';
  if (D.sliderTempMax) D.sliderTempMax.textContent = max + ' °C';
  if (D.lblTmin) D.lblTmin.textContent = min + '°C';
  if (D.lblTmax) D.lblTmax.textContent = max + '°C';
  if (D.lblTmid) D.lblTmid.textContent = Math.round((min + max) / 2) + '°C';
}
