/* ══════════════════════════════════════════════════════════════════
   SIRO · MÓDULO 4 — A BIBLIOTECA DA COMBUSTÃO: combustíveis do dia a dia
   (lista com busca; cresce sem mudar o código). Cada um aplica o modelo
   'combustao' do motor (js/core/combustao.js): a cadeia de radicais.

   dfH / estado: a entalpia de formação do combustível como ele está a
   25 °C (kJ/mol) — é dela que sai a energia do balanço global.
     · gases (metano, etano, propano, butano, 2-metilpropano): Active
       Thermochemical Tables (ATcT, Argonne National Laboratory, v1.130);
     · líquidos (metanol, etanol): CRC Handbook of Chemistry and Physics;
       2,2,4-trimetilpentano: média da faixa da literatura (−260,6 a −258,0).
   Com o CO₂ e a água líquida da ATcT, dão as entalpias de combustão das
   tabelas: metano −890,6; etanol −1366,8; metanol −725,9 kJ/mol
   (as mesmas da Termoquímica do 2º ano).
   tag: o nome do dia a dia (a pílula da lista); curto: o rótulo do gráfico de energia.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  var F = function (id, nome, sm, tag, dfH, estado, sin, curto) {
    return { id: id, nome: nome + ' + O₂', substrato: sm, nomeSubstrato: nome, modelo: 'combustao', tag: tag, dfH: dfH, estado: estado, curto: curto || nome,
      sinonimos: ['combustão', 'queima', 'combustível', 'chama', 'O₂', 'oxigênio', tag].concat(sin || []) };
  };
  Q3.BibliotecaCombustao = [
    F('metano', 'metano', 'C', 'GNV', -74.518, 'g', ['gás natural', 'biogás', 'gás encanado', 'CH4'], 'metano · GNV'),
    F('etano', 'etano', 'CC', 'gás natural', -84.01, 'g', ['C2H6']),
    F('propano', 'propano', 'CCC', 'GLP', -104.99, 'g', ['gás de cozinha', 'botijão', 'C3H8'], 'propano · GLP'),
    F('butano', 'butano', 'CCCC', 'GLP', -125.66, 'g', ['isqueiro', 'botijão', 'gás de cozinha', 'C4H10'], 'butano · GLP'),
    F('isobutano', '2-metilpropano', 'CC(C)C', 'GLP', -134.50, 'g', ['isobutano', 'aerossol', 'R600a'], 'isobutano'),
    F('metanol', 'metanol', 'CO', 'metanol', -239.2, 'l', ['álcool metílico', 'combustível de corrida', 'CH3OH']),
    F('etanol', 'etanol', 'CCO', 'álcool', -277.6, 'l', ['álcool combustível', 'etanol hidratado', 'cana', 'C2H5OH']),
    F('isoctano', '2,2,4-trimetilpentano', 'CC(C)CC(C)(C)C', 'gasolina', -259.3, 'l', ['isoctano', 'octano', 'octanagem', 'C8H18'], 'isoctano · gasolina')
  ];
})();
