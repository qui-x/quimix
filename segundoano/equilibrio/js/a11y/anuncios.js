SIEQ.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SIEQ._audioCtx = null;
SIEQ.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SIEQ._audioCtx) SIEQ._audioCtx = new Ctx();
    if (SIEQ._audioCtx.state === 'suspended') SIEQ._audioCtx.resume();
    const osc = SIEQ._audioCtx.createOscillator();
    const gain = SIEQ._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SIEQ._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SIEQ._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SIEQ._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SIEQ._audioCtx.currentTime + dur);
  } catch (e) {}
};