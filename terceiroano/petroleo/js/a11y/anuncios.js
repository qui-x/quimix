SIPT.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SIPT._audioCtx = null;
SIPT.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SIPT._audioCtx) SIPT._audioCtx = new Ctx();
    if (SIPT._audioCtx.state === 'suspended') SIPT._audioCtx.resume();
    const osc = SIPT._audioCtx.createOscillator();
    const gain = SIPT._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SIPT._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SIPT._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SIPT._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SIPT._audioCtx.currentTime + dur);
  } catch (e) {}
};