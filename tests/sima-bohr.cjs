const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('As seis quedas do hidrogênio emitem fótons pelo motor do canvas', () => {
  class AtomicSim {}
  class AtomicApp {}
  const canvas = new EventTarget();
  const controls = new Map();
  const document = Object.assign(new EventTarget(), {
    querySelectorAll: () => [],
    getElementById(id) {

      if (id === 'photon-log') return null;
      if (!controls.has(id)) controls.set(id, new EventTarget());
      return controls.get(id);
    }
  });
  const context = vm.createContext({
    AtomicSim, PHYS: { E0: 13.6, hc: 1240 }, BOHR_OMEGA_K: 0.01,
    SHELLS: 'KLMNOPQ', playTone() {}, announce() {},
    document, window: new EventTarget(), AtomicApp
  });
  for (const file of ['core/fisica.js', 'models/bohr.js', 'app/elemento-ui.js', 'app/modelos-ui.js', 'app/eventos.js']) {
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
    sim._buildBohr();
    const electron = sim.bohrElectrons[0];
    controls.get('bohr-from-shell').value = '0';
    controls.get('bohr-to-shell').value = String(upper - 1);
    controls.get('btn-bohr-up').dispatchEvent(new Event('click'));
    assert.equal(sim.bohrPhotons.length, 0);
    assert.equal(controls.get('btn-bohr-up').disabled, true);
    assert.equal(controls.get('btn-bohr-down').disabled, false);
    for (let frame = 0; frame < 90; frame++) sim._updateBohr();
    assert.equal(electron.shell, upper - 1);
    controls.get('bohr-to-shell').value = String(lower - 1);
    controls.get('btn-bohr-down').dispatchEvent(new Event('click'));
    assert.equal(sim.selectedBohrElectron, electron);
    assert.ok(controls.get('d-bohr-energy').textContent.includes('n=' + lower + ')'));
    const photon = sim.bohrPhotons.at(-1);
    assert.ok(Math.abs(photon.lambda - nm) <= 1);
    assert.ok(photon.series.includes(band));
    assert.equal(sim.bohrElectrons[0].shell, lower - 1);
    controls.get('btn-bohr-up').dispatchEvent(new Event('click'));
    assert.equal(sim.bohrPhotons.length, 1);
    assert.equal(sim.bohrLog[0].color, photon.color);
    assert.ok(sim.bohrLog[0].texto.includes('λ≈' + photon.lambda + ' nm'));
    controls.get('btn-bohr-down').dispatchEvent(new Event('click'));
    if (lower > 1) {
      controls.get('bohr-to-shell').value = '0';
      controls.get('btn-bohr-down').dispatchEvent(new Event('click'));
      assert.equal(electron.shell, 0);
      assert.equal(sim.bohrPhotons.length, 3);
    }
    if (band === 'visível') colors.add(photon.color);
  }
  assert.equal(colors.size, 4);
  sim._buildBohr();
  for (const [nm, color] of [[656, '#e63946'], [486, '#4cc9c0'], [434, '#3a6df0'], [410, '#7b4fe0']]) {
    assert.ok(sim.exciteBohr(0));
    for (let frame = 0; frame < 81; frame++) sim._updateBohr();
    const line = sim.bohrPhotons.at(-1);
    assert.ok(Math.abs(line.lambda - nm) <= 1);
    assert.equal(line.color, color);
    for (let frame = 0; frame < 80; frame++) sim._updateBohr();
    assert.equal(sim.bohrElectrons[0].shell, 0);
    assert.ok(sim.bohrPhotons.at(-1).series.includes('UV'));
  }
});
