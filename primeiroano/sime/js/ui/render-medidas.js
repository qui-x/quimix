/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (renderização)
   ARQUIVO: render-medidas.js
   ───────────────────────────────────────────────────────────────
   Preenche a tabela de medidas (substância, estado, temperatura,
   pontos de fusão/ebulição efetivos, pressão e pressão efetiva,
   volume e fator de compressão) e os valores resumidos no cabeçalho
   de cada painel de controle.
   Depende de: core/estado-simulacao.js, core/fisica.js,
               data/escalas-visuais.js, ui/dom-cache.js.
   Usado por: orquestrador.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   DOM — MEDIDAS
═══════════════════════════════════════════════════════ */
function atualizarMedidas() {
  var labels = { solido:'Sólido', liquido:'Líquido', gasoso:'Gasoso' };
 
  // Campos básicos
  if (D.mSubstancia) D.mSubstancia.textContent = estado.substancia ? estado.substancia.nome : '—';
  if (D.mState)      D.mState.textContent      = labels[estado.estadoFisico] || '—';
  if (D.mTemp)       D.mTemp.textContent       = estado.temperatura + ' °C';
  if (D.mFusao)      D.mFusao.textContent      = TRANSICOES.fusao.toFixed(1) + ' °C';
  if (D.mEbulicao)   D.mEbulicao.textContent   = TRANSICOES.ebulicao.toFixed(1) + ' °C';
 
  // Pressão
  var Pef = estado._pressaoEfetiva || estado.pressao;
  var fP  = encontrarFaixa(estado.pressao, FAIXAS_PRESSAO);
  if (D.mPressao)     D.mPressao.textContent     = estado.pressao.toFixed(2) + ' atm';
  if (D.mPressaoEf)   D.mPressaoEf.textContent   = Pef.toFixed(2) + ' atm';
  if (D.mFaixaPressao) D.mFaixaPressao.textContent = fP ? fP.rotulo : '—';
 
  // Volume e fator
  var propVol  = (estado.volume - 20) / 80;
  var fatorVol = 1.7 + (0.3 - 1.7) * propVol;
  if (D.mVolume)   D.mVolume.textContent   = estado.volume + ' %';
  if (D.mFatorVol) D.mFatorVol.textContent = fatorVol.toFixed(2) + '×';
 
  // Cabeçalhos dos painéis
  if (D.pvTemperatura) D.pvTemperatura.textContent = estado.temperatura + ' °C';
  if (D.pvPressao)     D.pvPressao.textContent     = estado.pressao.toFixed(2) + ' atm';
  if (D.pvVolume)      D.pvVolume.textContent      = estado.volume + ' %';
}
 
/* ═══════════════════════════════════════════════════════
   DOM — EFEITO PEDAGÓGICO DA PRESSÃO
═══════════════════════════════════════════════════════ */
function atualizarInfoPressaoEfetiva() {
  var sub = estado.substancia;
  if (!sub) return;
  var P    = estado.pressao;
  var Pef  = estado._pressaoEfetiva || P;
  var dP   = Pef - 1.0;
  var TfEf = TRANSICOES.fusao;
  var TbEf = TRANSICOES.ebulicao;
  if (D.lblFusao)    D.lblFusao.textContent    = TfEf.toFixed(0) + '°C';
  if (D.lblEbulicao) D.lblEbulicao.textContent = TbEf.toFixed(0) + '°C';
  if (estado.substancia) atualizarLinhasTermometro(estado.substancia);
  if (D.elEfeitoEstado) {
    var estadoAtual = determinarEstado(estado.temperatura);
    var nomes = { solido: 'Sólido', liquido: 'Líquido', gasoso: 'Gasoso' };
    D.elEfeitoEstado.textContent = nomes[estadoAtual] || '—';
  }
}
