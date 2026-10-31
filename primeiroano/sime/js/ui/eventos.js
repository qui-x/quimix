/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (interação)
   ARQUIVO: eventos.js
   ───────────────────────────────────────────────────────────────
   Liga os controles do painel direito (sliders e botões de
   temperatura/pressão, atalho Esc para fechar gavetas mobile) às
   mudanças de estado.js e ao orquestrador (atualizarSimulador).
   Depende de: core/estado-simulacao.js, ui/dom-cache.js,
               orquestrador.js.
   Usado por: main.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   CONECTAR EVENTOS
═══════════════════════════════════════════════════════ */
function conectarEventos() {
  // Slider temperatura
  if (D.sliderTemp) {
    D.sliderTemp.addEventListener('input', function() {
      var ant = estado.temperatura;
      estado.temperatura = parseFloat(this.value);
      var tempReal = parseFloat(D.sliderTemp.value);
      estado.temperatura = tempReal;
      if (D.displayTemp) D.displayTemp.textContent = tempReal + ' °C';
      atualizarSimulador(ant);
    });
  }
  // Botões Aquecer / Resfriar
  var tempStep = 5;
  if (D.btnHeat) D.btnHeat.addEventListener('click', function() {
    if (!D.sliderTemp) return;
    var ant = estado.temperatura;
    estado.temperatura = Math.min(parseFloat(D.sliderTemp.max), estado.temperatura + tempStep);
    D.sliderTemp.value = estado.temperatura;
    if (D.displayTemp) D.displayTemp.textContent = estado.temperatura + ' °C';
    atualizarSimulador(ant);
  });
  if (D.btnCool) D.btnCool.addEventListener('click', function() {
    if (!D.sliderTemp) return;
    var ant = estado.temperatura;
    estado.temperatura = Math.max(parseFloat(D.sliderTemp.min), estado.temperatura - tempStep);
    D.sliderTemp.value = estado.temperatura;
    if (D.displayTemp) D.displayTemp.textContent = estado.temperatura + ' °C';
    atualizarSimulador(ant);
  });
  // Slider volume
  if (D.sliderVol) {
    D.sliderVol.addEventListener('input', function() {
      estado._volumeAnterior = estado.volume;
      estado.volume = parseFloat(this.value);
      atualizarSimulador(undefined, false, true);
    });
  }
  // Slider pressão
  if (D.sliderPressao) {
    D.sliderPressao.addEventListener('input', function() {
      estado.pressao = parseFloat(this.value);
      if (D.displayPressaoCtrl) D.displayPressaoCtrl.textContent = estado.pressao.toFixed(2) + ' atm';
      atualizarSimulador(undefined, true);
    });
  }
  // Botões pressão
  var pressStep = 0.5;
  if (D.btnPressUp) D.btnPressUp.addEventListener('click', function() {
    estado.pressao = Math.min(25,  parseFloat((estado.pressao + pressStep).toFixed(2)));
    if (D.sliderPressao) D.sliderPressao.value = estado.pressao;
    if (D.displayPressaoCtrl) D.displayPressaoCtrl.textContent = estado.pressao.toFixed(2) + ' atm';
    atualizarSimulador(undefined, true);
  });
  if (D.btnPressDown) D.btnPressDown.addEventListener('click', function() {
    estado.pressao = Math.max(0.1, parseFloat((estado.pressao - pressStep).toFixed(2)));
    if (D.sliderPressao) D.sliderPressao.value = estado.pressao;
    if (D.displayPressaoCtrl) D.displayPressaoCtrl.textContent = estado.pressao.toFixed(2) + ' atm';
    atualizarSimulador(undefined, true);
  });
 
  // ── Atalhos de teclado globais ──
  document.addEventListener('keydown', function(e) {
    // Escape → fechar painéis mobile abertos
    if (e.key === 'Escape') {
      var left  = document.getElementById('sidebar-left');
      var right = document.getElementById('sidebar-right');
      var bd    = document.getElementById('mobile-backdrop');
      if (left)  left.classList.remove('mobile-open');
      if (right) right.classList.remove('mobile-open');
      if (bd)    bd.hidden = true;
    }
  });
}
