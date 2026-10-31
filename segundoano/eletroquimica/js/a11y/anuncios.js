SIEL.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SIEL._audioCtx = null;
SIEL.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SIEL._audioCtx) SIEL._audioCtx = new Ctx();
    if (SIEL._audioCtx.state === 'suspended') SIEL._audioCtx.resume();
    const osc = SIEL._audioCtx.createOscillator();
    const gain = SIEL._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SIEL._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SIEL._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SIEL._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SIEL._audioCtx.currentTime + dur);
  } catch (e) {}
};