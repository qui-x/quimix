const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('As seis quedas do hidrogênio emitem fótons pelo motor do canvas', () => {
  class AtomicSim {}
  class AtomicApp {}
  const canvas = new EventTarget();
  const line = {};
  const document = Object.assign(new EventTarget(), {
    querySelectorAll: () => [],
    getElementById(id) {
      if (id === 'bohr-line') return line;
      if (id === 'photon-log') return null;
      return new EventTarget();
    }
  });
  const context = vm.createContext({
    AtomicSim, PHYS: { E0: 13.6, hc: 1240 }, BOHR_OMEGA_K: 0.01,
    SHELLS: 'KLMNOPQ', playTone() {}, announce() {},
    document, window: new EventTarget(), AtomicApp
  });
  for (const file of ['core/fisica.js', 'models/bohr.js', 'app/eventos.js']) {
    vm.runInContext(fs.readFileSync('primeiroano/sima/js/' + file, 'utf8'), context);
  }
  const sim = Object.assign(new AtomicSim(), { Z: 1, electrons: [1], canvas: { width: 800, height: 600 } });
  sim._buildBohr();
  sim.model = "bohr";
  Object.assign(new AtomicApp(), { sim, canvas })._bindEvents();
  const colors = new Set();
  for (const [upper, lower, nm, band] of [
    [3, 2, 656, 'visível'], [4, 2, 486, 'visível'], [5, 2, 434, 'visível'],
    [6, 2, 410, 'visível'], [2, 1, 122, 'UV'], [4, 3, 1876, 'IR']
  ]) {
    line.value = [upper, lower].join(",");
    canvas.dispatchEvent(new Event("click"));
    assert.equal(sim.prepareHydrogenEmission(upper, lower), false);
    for (let frame = 0; frame < 80; frame++) sim._updateBohr();
    const photon = sim.bohrPhotons.at(-1);
    assert.ok(Math.abs(photon.lambda - nm) <= 1);
    assert.ok(photon.series.includes(band));
    assert.equal(sim.bohrElectrons[0].shell, lower - 1);
    if (band === 'visível') colors.add(photon.color);
  }
  assert.equal(colors.size, 4);
});
