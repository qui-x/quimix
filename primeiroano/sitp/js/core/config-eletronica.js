/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (química)
   ARQUIVO: config-eletronica.js
   ───────────────────────────────────────────────────────────────
   Distribuição eletrônica por subnível (regra de Madelung),
   agrupamento por camada, cálculo de nêutrons, classificação de
   preenchimento de subcamada (vazio/parcial/completo — usado para
   colorir os orbitais no diagrama de Bohr) e a notação de gás nobre
   abreviada ([Ar] 3d¹⁰ 4s¹ em vez da configuração completa).
   Depende de: dadossitp.js (ORDEM_SUBNIVEIS, MAX_SUB,
               MASSA_ISOTOPO, CONFIG_EC).
   Usado por: js/modal/config-eletronica-ui.js,
              js/render/bohr.js, js/render/nuvem-eletronica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function distribuirEletrons(Z) {
  let e = Z, dist = {};
  for (const sub of ORDEM_SUBNIVEIS) {
    if (e <= 0) break;
    const fill = Math.min(e, MAX_SUB[sub[sub.length-1]]);
    if (fill > 0) { dist[sub] = fill; e -= fill; }
  }
  return dist;
}

function porCamada(dist) {
  const camadas = {};
  for (const [sub, e] of Object.entries(dist)) {
    const n = parseInt(sub[0]);
    if (!camadas[n]) camadas[n] = [];
    camadas[n].push({ sub, e });
  }
  return camadas;
}

// N = A - Z, com A vindo de MASSA_ISOTOPO (dadossitp.js).
function calcNeutrons(Z) {
  return (MASSA_ISOTOPO[Z] || Z * 2) - Z;
}

function classificarPreenchimento(elCount, maxEl, tipo){
  if(elCount === 0)           return { status:'vazio',          label:'Vazio',                   icon:'○' };
  if(elCount === maxEl)       return { status:'preenchido',      label:'Preenchido',              icon:'●' };
  if(elCount === maxEl / 2)   return { status:'semipreenchido',  label:'Semipreenchido',          icon:'◑' };
  return                       { status:'parcial',              label:'Parcialmente preenchido', icon:'◔' };
}

function ultimoSubnivel(Z){
  const cfg = CONFIG_EC[Z];
  if(!cfg) return null;
  const termos = cfg.replace(/\[[A-Za-z]+\]\s*/,'').trim().split(/\s+/);
  if(!termos.length) return null;
  const ultimo = termos[termos.length - 1];
  const match = ultimo.match(/^(\d[spdf])(.*)$/);
  if(!match) return null;
  const sub = match[1];
  const expStr = match[2];
  const sup2n = {'⁰':0,'¹':1,'²':2,'³':3,'⁴':4,'⁵':5,'⁶':6,'⁷':7,'⁸':8,'⁹':9};
  const elCount = [...expStr].reduce((acc,c)=>{
    const d = sup2n[c]; return d !== undefined ? acc * 10 + d : acc;
  }, 0);
  const tipo = sub[1];
  const bloco = tipo.toUpperCase();
  const n = parseInt(sub[0]);
  const maxEl = {s:2,p:6,d:10,f:14}[tipo]||0;
  const numOrbitais = maxEl / 2;
  const preenche = classificarPreenchimento(elCount, maxEl, tipo);
  return {
    sub, n, tipo, bloco, elCount, maxEl, numOrbitais,
    status:    preenche.status,
    statusLabel: preenche.label,
    statusIcon:  preenche.icon,
    camada: 'KLMNOPQ'[n-1]||'?'
  };
}

