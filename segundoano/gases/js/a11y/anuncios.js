SIGAS.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SIGAS._audioCtx = null;
SIGAS.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SIGAS._audioCtx) SIGAS._audioCtx = new Ctx();
    if (SIGAS._audioCtx.state === 'suspended') SIGAS._audioCtx.resume();
    const osc = SIGAS._audioCtx.createOscillator();
    const gain = SIGAS._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SIGAS._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SIGAS._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SIGAS._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SIGAS._audioCtx.currentTime + dur);
  } catch (e) {}
};