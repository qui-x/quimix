/* ══════════════════════════════════════════════════════════════════
   SIRO · MÓDULO 3 — A BIBLIOTECA DA SUBSTITUIÇÃO (lista com busca; cresce sem
   mudar o código). Cada reação aplica um MODELO do motor de setas:
   'radicalar' (alcano + X2 e luz: com farpas), 'sn2' (haleto + OH−),
   'sn1' (haleto terciário + água) ou 'aromatica' (benzeno + eletrófilo).
   O nome mostra SÓ os reagentes. nomeProduto: só onde o motor de
   nomenclatura não nomeia (o grupo nitro).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  var RAD = function (id, nome, sm, X, sin) { return { id: id, nome: nome + ' + ' + X + '₂ (luz)', substrato: sm, nomeSubstrato: nome, modelo: 'radicalar', reagente: X, sinonimos: ['radical', 'radicalar', 'halogenação', 'alcano', 'luz'].concat(sin || []) }; };
  var SN2 = function (id, nome, sm, sin) { return { id: id, nome: nome + ' + OH⁻', substrato: sm, nomeSubstrato: nome, modelo: 'sn2', sinonimos: ['SN2', 'haleto', 'hidróxido', 'base', 'NaOH'].concat(sin || []) }; };
  var SN1 = function (id, nome, sm, sin) { return { id: id, nome: nome + ' + H₂O', substrato: sm, nomeSubstrato: nome, modelo: 'sn1', sinonimos: ['SN1', 'haleto', 'água', 'carbocátion', 'terciário'].concat(sin || []) }; };
  var AR = function (id, reag, tipo, prod, sin) { return { id: id, nome: 'benzeno + ' + reag, substrato: 'C1=CC=CC=C1', nomeSubstrato: 'benzeno', modelo: 'aromatica', reagente: tipo, nomeProduto: prod, sinonimos: ['benzeno', 'aromático', 'anel'].concat(sin || []) }; };
  Q3.BibliotecaSubstituicao = [
    RAD('metano-cl2', 'metano', 'C', 'Cl', ['gás natural']),
    RAD('etano-cl2', 'etano', 'CC', 'Cl'),
    RAD('propano-cl2', 'propano', 'CCC', 'Cl'),
    RAD('propano-br2', 'propano', 'CCC', 'Br'),
    RAD('isobutano-br2', '2-metilpropano', 'CC(C)C', 'Br', ['isobutano']),
    RAD('etano-br2', 'etano', 'CC', 'Br'),
    RAD('butano-br2', 'butano', 'CCCC', 'Br'),
    SN2('bromometano', 'bromometano', 'CBr', ['brometo de metila']),
    SN2('bromoetano', 'bromoetano', 'CCBr', ['brometo de etila']),
    SN2('1-bromopropano', '1-bromopropano', 'CCCBr'),
    SN2('1-clorobutano', '1-clorobutano', 'CCCCCl'),
    SN2('1-bromobutano', '1-bromobutano', 'CCCCBr'),
    SN2('2-bromopropano', '2-bromopropano', 'CC(C)Br', ['secundário']),
    SN1('tbu-br', '2-bromo-2-metilpropano', 'CC(C)(C)Br', ['brometo de terc-butila']),
    SN1('tbu-cl', '2-cloro-2-metilpropano', 'CC(C)(C)Cl', ['cloreto de terc-butila']),
    SN1('tamil-br', '2-bromo-2-metilbutano', 'CCC(C)(C)Br'),
    AR('nitracao', 'HNO₃ (H₂SO₄)', 'nitracao', 'nitrobenzeno', ['nitração', 'ácido nítrico', 'nitrônio']),
    AR('bromacao', 'Br₂ (FeBr₃)', 'bromacao', null, ['halogenação', 'bromo']),
    AR('cloracao', 'Cl₂ (AlCl₃)', 'cloracao', null, ['halogenação', 'cloro']),
    AR('alquilacao', 'CH₃Cl (AlCl₃)', 'alquilacao', null, ['Friedel-Crafts', 'alquilação']),
    AR('acilacao', 'CH₃COCl (AlCl₃)', 'acilacao', null, ['Friedel-Crafts', 'acilação', 'cetona']),
    // SUBSTITUIÇÃO AVANÇADA (acílica): a síntese da aspirina
    { id: 'aspirina', nome: 'ácido salicílico + anidrido acético (H⁺)', substrato: 'OC(=O)C1=CC=CC=C1O', nomeSubstrato: 'ácido salicílico', modelo: 'acetilacao', nomeProduto: 'ácido acetilsalicílico (AAS, a aspirina)', avancado: true,
      sinonimos: ['aspirina', 'AAS', 'acetilação', 'anidrido', 'acílica', 'avançado', 'fármaco', 'éster'] }
  ];
})();
