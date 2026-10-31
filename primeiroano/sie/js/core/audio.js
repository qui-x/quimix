/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (utilitário)
   ARQUIVO: audio.js
   ───────────────────────────────────────────────────────────────
   Toca um tom curto (Web Audio API) como retorno sonoro de ações —
   mesmo padrão usado no SIEM/SILQ.
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Portado do SIMA (scriptsima.js) — feedback sonoro discreto para
// mecânicas da sidebar (abrir/fechar painel, ativar módulo). Osc +
// gain com decaimento exponencial, sem dependência externa. Falha
// silenciosa em navegadores sem Web Audio ou com autoplay bloqueado —
// nunca deve travar a interação por causa de som.
let _audioCtx = null;

function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!_audioCtx) _audioCtx = new Ctx();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    const osc = _audioCtx.createOscillator();
    const gain = _audioCtx.createGain();
    osc.connect(gain); gain.connect(_audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, _audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + dur);
    osc.start(); osc.stop(_audioCtx.currentTime + dur);
  } catch (e) { /* silencioso — som é reforço, nunca bloqueio */ }
}

