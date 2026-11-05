/* ══════════════════════════════════════════════════════════════════
   SIRO · MÓDULO 2 — A BIBLIOTECA DA ELIMINAÇÃO (lista com busca; cresce sem
   mudar o código). Cada reação aplica um MODELO do motor de setas:
   'desidratacao' (álcool + ácido forte e calor: E1, ou concertada no primário)
   ou 'e2' (haleto + KOH em álcool). O nome mostra SÓ os reagentes.
     { id, nome: 'reagentes', substrato: 'SMILES', nomeSubstrato,
       modelo: 'desidratacao' | 'e2', catalisadores: true (desidratação), sinonimos: [...] }
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  var D = function (id, nome, sm, sin) { return { id: id, nome: nome + ' + H₂SO₄ (calor)', substrato: sm, nomeSubstrato: nome, modelo: 'desidratacao', catalisadores: true, sinonimos: ['desidratação', 'álcool', 'ácido'].concat(sin || []) }; };
  var B = function (id, nome, sm, sin) { return { id: id, nome: nome + ' + KOH (álcool)', substrato: sm, nomeSubstrato: nome, modelo: 'e2', sinonimos: ['desidroalogenação', 'haleto', 'base', 'hidróxido de potássio'].concat(sin || []) }; };
  Q3.BibliotecaEliminacao = [
    D('etanol', 'etanol', 'CCO', ['álcool etílico']),
    D('propan1ol', 'propan-1-ol', 'CCCO', ['1-propanol']),
    D('propan2ol', 'propan-2-ol', 'CC(C)O', ['isopropanol', '2-propanol']),
    D('butan2ol', 'butan-2-ol', 'CCC(C)O', ['2-butanol']),
    D('terc-butanol', '2-metilpropan-2-ol', 'CC(C)(C)O', ['terc-butanol', 'álcool terc-butílico']),
    D('metilbutan2ol', '2-metilbutan-2-ol', 'CCC(C)(C)O', ['álcool terc-amílico']),
    D('pentan2ol', 'pentan-2-ol', 'CCCC(C)O', ['2-pentanol', 'Zaitsev']),
    D('cicloexanol', 'ciclo-hexanol', 'OC1CCCCC1', ['cicloexanol', 'anel']),
    B('bromoetano', 'bromoetano', 'CCBr', ['brometo de etila']),
    B('1-bromopropano', '1-bromopropano', 'CCCBr'),
    B('2-bromopropano', '2-bromopropano', 'CC(C)Br', ['brometo de isopropila']),
    B('2-bromobutano', '2-bromobutano', 'CCC(C)Br'),
    B('2-bromo-2-metilbutano', '2-bromo-2-metilbutano', 'CCC(C)(C)Br'),
    B('2-bromopentano', '2-bromopentano', 'CCCC(C)Br', ['Zaitsev']),
    B('clorocicloexano', 'clorociclo-hexano', 'ClC1CCCCC1', ['anel', 'cloro'])
  ];
})();
