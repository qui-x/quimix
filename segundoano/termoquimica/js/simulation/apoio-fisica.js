/* ================================================================
   CAMADA: SIMULAÇÃO — apoio-fisica.js
   ================================================================
   Helpers de física/renderização exclusivos de Termoquímica, que no
   arquivo original viviam dentro da seção "ESCALA DO CANVAS" (mesma
   seção dos outros simuladores) mas não têm nada a ver com escala de
   canvas — são apoio aos modos Calorímetro e Curva de Aquecimento.
   Usam SUBSTANCIAS/PHYS (dados, ficam soltos — ver js/data/) e
   SITQ.clamp/SITQ.fmt (núcleo).
   ================================================================ */
'use strict';

SITQ.shadeColor = function shadeColor(hex, amt) {
  const c = hex.replace('#', '');
  const r = SITQ.clamp(parseInt(c.substr(0, 2), 16) + amt, 0, 255);
  const g = SITQ.clamp(parseInt(c.substr(2, 2), 16) + amt, 0, 255);
  const b = SITQ.clamp(parseInt(c.substr(4, 2), 16) + amt, 0, 255);
  return `rgb(${r},${g},${b})`;
};
SITQ.VOL_MIN = Math.min(...SUBSTANCIAS.map(s => PHYS.MASSA_MIN / s.densidade));
SITQ.VOL_MAX = Math.max(...SUBSTANCIAS.map(s => PHYS.MASSA_MAX / s.densidade));
SITQ.fracVolume = function fracVolume(massa, sub, fracMin = 0.07, fracMax = 0.94) {
  const vol = massa / sub.densidade;
  const t = SITQ.clamp((Math.log(vol) - Math.log(SITQ.VOL_MIN)) / (Math.log(SITQ.VOL_MAX) - Math.log(SITQ.VOL_MIN)), 0, 1);
  return fracMin + (fracMax - fracMin) * t;
};
/**
 * Monta os trechos sólido→(fusão)→líquido→(vaporização)→vapor entre Ti e
 * Tf para uma substância com dados de mudança de fase (cSolido/cLiquido/
 * cVapor/Lfusao/Lvap/Tfusao/Tebulicao — ver CURVA_SUBSTANCIAS). Reaproveitada
 * pela Curva de Aquecimento E pelo Calorímetro (quando a substância
 * escolhida tem esses dados): a física de sensível+latente é a MESMA nos
 * dois modos, só muda onde e como o resultado é desenhado.
 * Só aceita Tf > Ti (aquecimento) — resfriamento atravessando uma mudança
 * de fase não é suportado (ver aviso na mecânica que chama esta função).
 */
SITQ.construirSegmentosFase = function construirSegmentosFase(sub, massa, Ti, Tf) {
  const {
    cSolido,
    cLiquido,
    cVapor,
    Lfusao,
    Lvap,
    Tfusao,
    Tebulicao,
    fases
  } = sub;
  let T = Ti;
  const segs = [];
  const sens = (c, T0, T1, fase, nome) => segs.push({
    tipo: 's',
    fase,
    nome,
    T0,
    T1,
    Q: massa * c * (T1 - T0)
  });
  if (T < Tfusao) {
    const T1 = Math.min(Tf, Tfusao);
    sens(cSolido, T, T1, 'gelo', 'Aquecer o sólido');
    T = T1;
  }
  if (T === Tfusao && Tf > Tfusao) {
    segs.push({
      tipo: 'l',
      fase: 'fusao',
      nome: `Fusão (${SITQ.fmt(Tfusao, 1)} °C)`,
      T0: T,
      T1: T,
      Q: massa * Lfusao
    });
  }
  if (Tf > Tfusao && T < Tebulicao) {
    const T0 = Math.max(T, Tfusao);
    const T1 = Math.min(Tf, Tebulicao);
    sens(cLiquido, T0, T1, 'agua', 'Aquecer o líquido');
    T = T1;
  }
  if (T === Tebulicao && Tf > Tebulicao) {
    segs.push({
      tipo: 'l',
      fase: 'vapor',
      nome: `Vaporização (${SITQ.fmt(Tebulicao, 1)} °C)`,
      T0: T,
      T1: T,
      Q: massa * Lvap
    });
  }
  if (Tf > Tebulicao) {
    const T0 = Math.max(T, Tebulicao);
    sens(cVapor, T0, Tf, 'vaporS', 'Aquecer o vapor');
  }
  return {
    segs,
    totalQ: segs.reduce((s, g) => s + g.Q, 0),
    fasesTxt: fases
  };
};
/**
 * Encontra a posição (T, fase, fracSeg) para um calor acumulado q dentro
 * de uma lista de segmentos (ver construirSegmentosFase). fracSeg = 0→1
 * é o progresso dentro do trecho/patamar atual — essencial pra misturar
 * as fases nos patamares em vez de trocar de textura de uma vez.
 * "<" (não "<=") por design: na fronteira EXATA entre dois trechos, isso
 * escolhe sempre o INÍCIO do próximo (fracSeg=0), nunca o fim do anterior.
 */
SITQ.pontoNosSegmentos = function pontoNosSegmentos(segs, fasesTxt, q) {
  let acc = 0;
  for (const s of segs) {
    if (q < acc + s.Q || s === segs[segs.length - 1]) {
      const f = s.Q ? SITQ.clamp((q - acc) / s.Q, 0, 1) : 1;
      const T = SITQ.lerp(s.T0, s.T1, f);
      const rot = s.tipo === 'l' ? `${s.nome} — T constante!` : s.fase === 'gelo' ? fasesTxt.gelo : s.fase === 'vaporS' ? fasesTxt.vapor : fasesTxt.agua;
      return {
        T,
        rotulo: rot,
        seg: s,
        fracSeg: f
      };
    }
    acc += s.Q;
  }
  return {
    T: segs[0] ? segs[0].T0 : 0,
    rotulo: fasesTxt.gelo,
    seg: segs[0],
    fracSeg: 0
  };
};