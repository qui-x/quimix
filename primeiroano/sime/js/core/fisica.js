/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (regras físicas — funções puras, sem DOM)
   ARQUIVO: fisica.js
   ───────────────────────────────────────────────────────────────
   Toda a fundamentação científica do simulador vive aqui, isolada
   da interface: nenhuma função deste arquivo lê ou escreve no HTML.
   Isso facilita revisar/testar a física separadamente da tela.

     • encontrarFaixa()             → classifica um valor numa faixa
                                       (usado para P e T).
     • corTermometro()              → mapeia temperatura → cor.
     • svgPonto()                   → trigonometria auxiliar (ponteiro
                                       do manômetro).
     • calcularTransicoesEfetivas() → aplica Clausius-Clapeyron:
                                       Tf/Tb efetivos = Tf/Tb da
                                       substância + coeficiente ×
                                       (pressão efetiva − 1 atm), onde
                                       a pressão efetiva combina o
                                       manômetro com o efeito de
                                       compressão do êmbolo (volume).
     • determinarEstado()           → compara a temperatura atual com
                                       TRANSICOES.fusao/ebulicao.
     • detectarFenomeno()           → nomeia a transição (ex.: sólido
                                       → líquido = "FUSAO").

   Depende de: data/limites.js, data/escalas-visuais.js,
               core/estado-simulacao.js (lê/escreve TRANSICOES e
               estado._pressaoEfetiva).
   Usado por: orquestrador.js e os módulos de ui/render-*.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   UTILITÁRIOS
═══════════════════════════════════════════════════════ */
function encontrarFaixa(valor, faixas) {
  for (var i = 0; i < faixas.length; i++) {
    if (valor < faixas[i].max) return faixas[i];
  }
  return faixas[faixas.length - 1];
}
 
function corTermometro(t) {
  var g = TERMOMETRO.gradientes;
  for (var i = 0; i < g.length - 1; i++) {
    if (t <= g[i + 1].temp) return g[i].cor;
  }
  return g[g.length - 1].cor;
}
 
function svgPonto(cx, cy, r, angGraus) {
  var rad = angGraus * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/* ═══════════════════════════════════════════════════════
   FÍSICA — TRANSIÇÕES EFETIVAS (P + V → Clausius-Clapeyron)
   
   O volume afeta a PRESSÃO EFETIVA interna do sistema:
     propVol = 0 (20% = comprimido) → fator = 3.0  (pressão triplicada)
     propVol = 1 (100% = expandido) → fator = 0.5  (pressão reduzida à metade)
     propVol = 0.5 (neutro) → fator = 1.0 (sem efeito do volume)
   
   P_efetiva = P_manômetro × fator_volume(propVol)
   
   Clausius-Clapeyron com P_efetiva:
     TbEf = Tb + dTb × (P_efetiva − 1)
     TfEf = Tf + dTf × (P_efetiva − 1)
   
   TRANSICOES é sempre atualizado com os valores finais —
   painel de medidas, termômetro e barra de estados refletem T+P+V.
═══════════════════════════════════════════════════════ */
function calcularTransicoesEfetivas() {
  var sub = estado.substancia;
  if (!sub) return { Tf: TRANSICOES.fusao, Tb: TRANSICOES.ebulicao };
 
  // propVol: 0 = totalmente comprimido, 1 = totalmente expandido
  var propVol = (estado.volume - LIMITES.volume.min) /
                (LIMITES.volume.max - LIMITES.volume.min);
 
  // Fator de pressão volumétrica — ponto neutro em vol=60% (propVol=0.4):
  //   vol=20%  (propVol=0.0) → fator=1.7 (comprimido aumenta pressão efetiva)
  //   vol=60%  (propVol=0.4) → fator=1.0 (neutro — sem efeito de volume)
  //   vol=100% (propVol=1.0) → fator=0.3 (expandido reduz pressão efetiva)
  //
  // Modelo: fatorVol = lerp(K_COMP, K_EXP, propVol)
  //   K_COMP=1.7, K_EXP=0.3 → lerp(1.7,0.3,0.4) = 1.7-(1.4×0.4) = 1.0 ✓
  var K_COMP = 1.7;
  var K_EXP  = 0.3;
  var fatorVol = K_COMP + (K_EXP - K_COMP) * propVol;
 
  // Pressão efetiva: combinação de pressão do manômetro e efeito do volume
  var P_efetiva = estado.pressao * fatorVol;
 
  // Clausius-Clapeyron com pressão efetiva
  var dP = P_efetiva - 1.0;
  var TfEf = sub.Tf + (sub.dTf || 0) * dP;
  var TbEf = sub.Tb + (sub.dTb || 0) * dP;
 
  // Garantia de consistência
  if (TfEf >= TbEf) TbEf = TfEf + 0.1;
 
  // Atualizar globais — TODOS os displays passam a refletir T+P+V
  TRANSICOES.fusao    = TfEf;
  TRANSICOES.ebulicao = TbEf;
 
  // Expor pressão efetiva para outros módulos
  estado._pressaoEfetiva = P_efetiva;
 
  return { Tf: TfEf, Tb: TbEf, Pef: P_efetiva };
}

/* ═══════════════════════════════════════════════════════
   FÍSICA — ESTADO DE REFERÊNCIA (25 °C, 1 atm — condição padrão IUPAC)
   ───────────────────────────────────────────────────────
   Classifica uma substância do catálogo pelo estado físico que ela
   assume na condição de referência, usando os próprios Tf/Tb do
   catálogo (nenhum dado novo — mesma regra que já existia, solta,
   dentro de ui/painel-substancias.js; centralizada aqui para ser
   reaproveitada também pelos módulos Gases/Líquidos/Sólidos da
   sidebar esquerda, em ui/painel-modulos.js).
═══════════════════════════════════════════════════════ */
function estadoPadrao(sub) {
  if (!sub) return null;
  if (sub.Tf > 25) return 'solido';
  if (sub.Tb <= 25) return 'gasoso';
  return 'liquido';
}

/* ═══════════════════════════════════════════════════════
   FÍSICA — ESTADO (usa TRANSICOES já calculados por T+P+V)
═══════════════════════════════════════════════════════ */
function determinarEstado(tempC) {
  // TRANSICOES já contém Tf/Tb efetivos (com efeito de P e V)
  // via calcularTransicoesEfetivas() chamado antes no orquestrador
  if (tempC < TRANSICOES.fusao)    return 'solido';
  if (tempC < TRANSICOES.ebulicao) return 'liquido';
  return 'gasoso';
}

/* ═══════════════════════════════════════════════════════
   FÍSICA — DETECÇÃO DE FENÔMENO
═══════════════════════════════════════════════════════ */
function detectarFenomeno(estadoAnterior, estadoAtual, subindo) {
  if (estadoAnterior === estadoAtual) return null;
  if (estadoAnterior === 'solido'  && estadoAtual === 'liquido') return 'FUSAO';
  if (estadoAnterior === 'liquido' && estadoAtual === 'solido')  return 'SOLIDIFICACAO';
  if (estadoAnterior === 'liquido' && estadoAtual === 'gasoso')  return 'VAPORIZACAO';
  if (estadoAnterior === 'gasoso'  && estadoAtual === 'liquido') return 'CONDENSACAO';
  if (estadoAnterior === 'solido'  && estadoAtual === 'gasoso')  return 'SUBLIMACAO';
  if (estadoAnterior === 'gasoso'  && estadoAtual === 'solido')  return 'RESSUBLIMACAO';
  return null;
}
