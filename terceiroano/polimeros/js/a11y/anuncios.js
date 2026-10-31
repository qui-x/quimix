SIPL.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SIPL._audioCtx = null;
SIPL.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SIPL._audioCtx) SIPL._audioCtx = new Ctx();
    if (SIPL._audioCtx.state === 'suspended') SIPL._audioCtx.resume();
    const osc = SIPL._audioCtx.createOscillator();
    const gain = SIPL._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SIPL._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SIPL._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SIPL._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SIPL._audioCtx.currentTime + dur);
  } catch (e) {}
};