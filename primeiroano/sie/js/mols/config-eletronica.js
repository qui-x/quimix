/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS (química)
   ARQUIVO: config-eletronica.js
   ───────────────────────────────────────────────────────────────
   Distribuição eletrônica por subnível (regra de Madelung),
   agrupamento por camada (K, L, M...), cálculo de nêutrons a partir
   da massa isotópica, verbalização da notação para leitores de tela,
   e a montagem do HTML do diagrama de Pauling completo — extraído do
   SITP.
   Depende de: dadossitp.js (ORDEM_SUBNIVEIS, MAX_SUB,
               MASSA_ISOTOPO, CONFIG_EC, CAMADAS_NOME).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ---- distribuição eletrônica (extraído de scriptsitp.js) ----
function distribuirEletronsMols(Z) {
  let e = Z, dist = {};
  for (const sub of ORDEM_SUBNIVEIS) {
    if (e <= 0) break;
    const fill = Math.min(e, MAX_SUB[sub[sub.length - 1]]);
    if (fill > 0) { dist[sub] = fill; e -= fill; }
  }
  return dist;
}

function porCamadaMols(dist) {
  const camadas = {};
  for (const [sub, e] of Object.entries(dist)) {
    const n = parseInt(sub[0]);
    if (!camadas[n]) camadas[n] = [];
    camadas[n].push({ sub, e });
  }
  return camadas;
}

// N = A - Z, com A vindo de MASSA_ISOTOPO (dadossitp.js).
function calcNeutronsMols(Z) {
  return (MASSA_ISOTOPO[Z] || Z * 2) - Z;
}

function verbalizarConfigMols(notacao) {
  const sup2n = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' };
  return notacao.split(/\s+/).map((termo) => {
    let base = '', exp = '';
    for (const ch of termo) {
      if (sup2n[ch] !== undefined) exp += sup2n[ch]; else base += ch;
    }
    if (!exp) return base;
    if (exp === '1') return `${base} com 1 elétron`;
    if (exp === '2') return `${base} com 2 elétrons`;
    return `${base} com ${exp} elétrons`;
  }).join(', ');
}

function renderConfigMols(Z) {
  const notacao = CONFIG_EC[Z];
  if (!notacao) {
    return `<div class="ec-title">Notação eletrônica</div>
<p class="ec-aviso">Configuração não disponível para este elemento (Z=${Z}).</p>`;
  }
  const aviso = Z >= 104
    ? `<p class="ec-aviso">Configuração prevista por cálculos relativísticos — este é um elemento sintético superpesado.</p>`
    : '';
  const dist = distribuirEletronsMols(Z);
  const camadas = porCamadaMols(dist);
  let html = `<div class="ec-title">Notação eletrônica</div>${aviso}<div class="ec-full" role="text" aria-label="Configuração eletrônica: ${verbalizarConfigMols(notacao)}">${notacao}</div>
<div class="ec-title" style="margin-top:6px">Por camada (Diagrama de Pauling)</div><div class="ec-camadas">`;
  const nMax = Object.keys(camadas).length;
  for (let n = 1; n <= nMax; n++) {
    const nome = CAMADAS_NOME[n - 1] || '?';
    const subs = camadas[n] || [];
    const orbs = subs.map(({ sub, e }) => {
      const tipo = sub[1];
      const col = { s: 'var(--orb-s)', p: 'var(--orb-p)', d: 'var(--orb-d)', f: 'var(--orb-f)' }[tipo] || 'var(--text-secondary)';
      const exp = String(e).split('').map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(d)]).join('');
      const leitura = e === 1 ? `${sub} com 1 elétron` : `${sub} com ${e} elétrons`;
      return `<span class="ec-orbital" style="color:${col}" role="text" aria-label="${leitura}">${sub}${exp}</span>`;
    }).join(' ');
    html += `<div class="ec-row"><span class="ec-camada-name" aria-label="Camada ${nome}">${nome}</span><div class="ec-orbitals">${orbs}</div></div>`;
  }
  return html + '</div>';
}

