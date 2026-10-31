/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (utilitário compartilhado)
   ARQUIVO: audio.js
   ───────────────────────────────────────────────────────────────
   Toca um tom curto (Web Audio API) como retorno sonoro de ações —
   usado tanto por modelos físicos (Thomson, Bohr) quanto pelos
   controles da interface (ativar/desativar Easter Eggs). Por isso
   também vive no núcleo, compartilhado pelas duas camadas acima.
   Depende de: nada.
   Usado por: models/thomson.js, models/bohr.js, app/easter-eggs.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

let _audioCtx = null;

function playTone(freq=880, dur=0.08, vol=0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!_audioCtx) _audioCtx = new Ctx();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
    const osc = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.connect(gain); gain.connect(_audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + dur);
    osc.start(); osc.stop(_audioCtx.currentTime + dur);
  } catch(e) {}
}

