SISOL.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SISOL._audioCtx = null;
SISOL.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SISOL._audioCtx) SISOL._audioCtx = new Ctx();
    if (SISOL._audioCtx.state === 'suspended') SISOL._audioCtx.resume();
    const osc = SISOL._audioCtx.createOscillator();
    const gain = SISOL._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SISOL._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SISOL._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SISOL._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SISOL._audioCtx.currentTime + dur);
  } catch (e) {}
};