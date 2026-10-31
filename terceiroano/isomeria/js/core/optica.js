/* ══════════════════════════════════════════════════════════════════
   SIIS · MÓDULO 3 — O MOTOR DA ISOMERIA ÓPTICA (sem limite de tamanho)
   ──────────────────────────────────────────────────────────────────
   Para QUALQUER molécula, numa configuração dada:
   · os carbonos quirais (quatro ligantes diferentes) e as duplas E/Z;
   · os descritores R/S de cada carbono (CIP, o motor do Módulo 2);
   · a IMAGEM NO ESPELHO: todos os R ↔ S trocados; E e Z ficam (o espelho
     não troca os lados de uma dupla);
   · QUIRAL se a assinatura (forma canônica com a configuração) difere da
     da imagem; senão aquiral — e MESO se tiver dois ou mais carbonos quirais;
   · o número de estereoisômeros: listados de verdade enquanto 2ⁿ for
     pequeno (o meso sai uma vez só); acima disso, o máximo 2ⁿ, dito como tal.
   O veredito vem da CONFIGURAÇÃO, não da geometria 3D: a sobreposição
   geométrica depende da conformação (o butano torcido não se sobrepõe à
   própria imagem naquela posição, e é aquiral).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  var O = Q3.Optica = {};
  O.LISTAR_ATE = 8;               // até 2^8 = 256 combinações, lista e conta de verdade (acima: o máximo 2ⁿ, dito como tal)

  O.inverter = function (desc) {   // a configuração da imagem no espelho
    return desc.map(function (d) { return d.tipo === 'centro' ? { u: d.u, tipo: d.tipo, d: d.d === 'R' ? 'S' : d.d === 'S' ? 'R' : d.d } : d; });
  };

  O.analisar = function (g, pos, cunhas) {
    var E = Q3.Estereo, und = E.unidades(g), est = und.filter(function (u) { return u.estereogenica; });
    var centros = est.filter(function (u) { return u.tipo === 'centro'; }), duplas = est.filter(function (u) { return u.tipo === 'dupla'; });
    var desc = E.descritores(g, pos, cunhas || {}, und), espelho = O.inverter(desc);
    var sig = E.assinatura(g, desc), sigE = E.assinatura(g, espelho), quiral = sig !== sigE;
    var n = est.length, total, exato = n <= O.LISTAR_ATE, lista = null;
    if (exato) { lista = E.expandir(g, pos); total = lista.length; } else total = Math.pow(2, n);
    return {
      und: und, centros: centros, duplas: duplas, desc: desc, espelho: espelho,
      assinatura: sig, assinaturaEspelho: sigE,
      quiral: quiral, meso: !quiral && centros.length >= 2,
      n: n, nCentros: centros.length, total: total, maximo: Math.pow(2, n), exato: exato, lista: lista
    };
  };

  /* o texto do veredito (para o painel), a partir da análise */
  O.veredito = function (a) {
    if (!a.nCentros && !a.quiral) return { tipo: 'aquiral', texto: 'Aquiral: nenhum carbono quiral. A imagem no espelho é a mesma molécula.' };
    if (a.meso) return { tipo: 'meso', texto: 'Meso: tem ' + a.nCentros + ' carbonos quirais, mas um plano de simetria interno faz a imagem no espelho ser a mesma molécula. Opticamente inativa.' };
    if (a.quiral) return { tipo: 'quiral', texto: 'Quiral: a imagem no espelho é OUTRA molécula — o seu enantiômero. Os dois desviam a luz polarizada em ângulos iguais e sentidos opostos.' };
    return { tipo: 'aquiral', texto: 'Aquiral: a imagem no espelho é a mesma molécula.' };
  };
})();
