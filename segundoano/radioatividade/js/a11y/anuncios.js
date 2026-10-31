SIRAD.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SIRAD._audioCtx = null;
SIRAD.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SIRAD._audioCtx) SIRAD._audioCtx = new Ctx();
    if (SIRAD._audioCtx.state === 'suspended') SIRAD._audioCtx.resume();
    const osc = SIRAD._audioCtx.createOscillator();
    const gain = SIRAD._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SIRAD._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SIRAD._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SIRAD._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SIRAD._audioCtx.currentTime + dur);
  } catch (e) {}
};