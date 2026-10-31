SIPC.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SIPC._audioCtx = null;
SIPC.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SIPC._audioCtx) SIPC._audioCtx = new Ctx();
    if (SIPC._audioCtx.state === 'suspended') SIPC._audioCtx.resume();
    const osc = SIPC._audioCtx.createOscillator();
    const gain = SIPC._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SIPC._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SIPC._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SIPC._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SIPC._audioCtx.currentTime + dur);
  } catch (e) {}
};