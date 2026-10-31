SITQ.announce = function announce(msg, priority = 'polite') {
  const el = document.getElementById(priority === 'assertive' ? 'sr-live-assertive' : 'sr-live');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => {
    el.textContent = msg;
  });
};
SITQ._audioCtx = null;
SITQ.playTone = function playTone(freq = 880, dur = 0.08, vol = 0.07) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!SITQ._audioCtx) SITQ._audioCtx = new Ctx();
    if (SITQ._audioCtx.state === 'suspended') SITQ._audioCtx.resume();
    const osc = SITQ._audioCtx.createOscillator();
    const gain = SITQ._audioCtx.createGain();
    osc.connect(gain);
    gain.connect(SITQ._audioCtx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, SITQ._audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, SITQ._audioCtx.currentTime + dur);
    osc.start();
    osc.stop(SITQ._audioCtx.currentTime + dur);
  } catch (e) {}
};