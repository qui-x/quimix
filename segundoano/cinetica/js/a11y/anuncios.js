SICQ.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SICQ._audioCtx = null;
SICQ.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SICQ._audioCtx) SICQ._audioCtx = new Ctx();
    if (SICQ._audioCtx.state === 'suspended') SICQ._audioCtx.resume();
    const osc = SICQ._audioCtx.createOscillator();
    const gain = SICQ._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SICQ._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SICQ._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SICQ._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SICQ._audioCtx.currentTime + dur);
  } catch (e) {}
};