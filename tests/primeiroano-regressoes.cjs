const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const vm = require('node:vm');

function carregar(arquivos, globais = {}) {
  const contexto = vm.createContext(globais);
  for (const arquivo of arquivos) {
    const caminho = resolve(__dirname, '../primeiroano', arquivo);
    vm.runInContext(readFileSync(caminho, 'utf8'), contexto, {filename: caminho});
  }
  return codigo => vm.runInContext(codigo, contexto);
}

test('SILQ distingue NaCl, cobre e hidrogênio molecular nas duas ordens', () => {
  const avaliar = carregar(['silq/js/data/tabela-elementos.js', 'silq/js/core/fisica-quimica-utils.js',
    'silq/js/core/validacao-ligacoes.js'], {
    window: {}, SILQ: {bonds: [], canvasAtoms: []}, document: {addEventListener: (_, iniciar) => iniciar()}
  });
  for (const [a,b,tipo,esperado] of [['Na','Cl','ionic',true],['Na','Cl','covalent',false],
    ['Cu','Cu','metallic',true],['H','H','covalent',true]]) {
    for (const par of [[a,b],[b,a]]) {
      const args = [...par,tipo].map(v => JSON.stringify(v)).join(',');
      assert.equal(avaliar('SILQ.validateBondCombination('+args+').allowed'), esperado);
    }
  }
});

test('SITP conserva a população dos 118 átomos e as ocupações de Cr e Cu', () => {
  const avaliar = carregar(['sitp/dadossitp.js','sitp/js/core/config-eletronica.js']);
  for (let z=1; z<=118; z++) {
    const distribuicao = avaliar('distribuirEletrons('+z+')');
    assert.equal(Object.values(distribuicao).reduce((a,b)=>a+b,0), z);
  }
  assert.equal(avaliar("distribuirEletrons(24)['3d']"),5);
  assert.equal(avaliar("distribuirEletrons(29)['4s']"),1);
});
