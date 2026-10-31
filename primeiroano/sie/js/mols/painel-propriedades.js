/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS (interface)
   ARQUIVO: painel-propriedades.js
   ───────────────────────────────────────────────────────────────
   Monta o cartão visual de uma propriedade periódica (barra de
   escala, posição do elemento nela, texto explicativo) e a lista de
   cartões exibidos no modal do elemento.
   Depende de: dadossitp.js (PROPRIEDADES), mols/cores-escalas.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function renderPropriedadeModalMols(prop, Z, el) {
  const v = valorPropriedadeMols(prop, Z);
  if (v === null) {
    const m = (prop.semDadoMotivos || []).find((g) => g.zs.includes(Z));
    return `<div class="en-wrap">
      <p class="en-sem-dados">${prop.semDadoTitulo || 'Sem valor publicado.'}
      ${m ? m.texto : (prop.semDadoPadrao || '')}</p>
    </div>`;
  }
  const cor = corNaEscalaMols(prop, v);
  const pct = Math.round(fracaoPropriedadeMols(prop, v) * 100);
  const faixa = (prop.faixas || []).find((f) => v >= f.min && v < f.max);
  const num = numeroPropriedadeMols(prop, v);
  const fmt = (x) => String(x).replace('.', ',');
  const alt = prop.fatorAlt
    ? `<span class="en-valor-alt">= ${fmt(Math.round(v * prop.fatorAlt))} ${prop.unidadeAlt}</span>`
    : '';
  return `<div class="en-wrap" style="--en-cor:${cor}">
    <div class="en-visual">
      <div class="en-valor-box">
        <span class="en-valor-titulo">${prop.label}</span>
        <span class="en-valor-num" aria-label="${num} ${prop.unidadeLonga || ''}">${num}${prop.unidade}</span>
        <span class="en-valor-escala">${prop.unidadeLonga || ''}</span>
        ${alt}
      </div>
      <div class="en-info-col">
        <span class="en-faixa-badge">${faixa ? faixa.label : '—'}</span>
        <span class="en-valor-fonte">Fonte: ${prop.fonte || '—'}</span>
      </div>
    </div>
    <div class="en-barra-wrap">
      <span class="en-barra-titulo">Posição na escala — de ${fmt(prop.vmin)} a ${fmt(prop.vmax)}${prop.unidade}</span>
      <div class="en-barra-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
           aria-label="Posição de ${el.nome} na escala de ${prop.label}: ${pct} por cento">
        <div class="en-barra-fill" style="width:${pct}%"></div>
        <div class="en-barra-marca" style="left:${pct}%" aria-hidden="true"></div>
      </div>
      <div class="en-barra-legenda"><span>menor</span><span>${num}${prop.unidade} (${pct}%)</span><span>maior</span></div>
    </div>
  </div>`;
}

function renderCardsPropriedadeMols(Z, el) {
  const cx = document.getElementById('modalPropriedadesMols');
  if (!cx) return;
  cx.innerHTML = PROPRIEDADES.filter((p) => p.cardModal).map((p) => `
    <section class="info-card" aria-labelledby="propTitleMols-${p.id}">
      <h4 id="propTitleMols-${p.id}">${ICO_MOLS[p.icone] || ''} ${p.label}</h4>
      <div>${renderPropriedadeModalMols(p, Z, el)}</div>
    </section>`).join('');
}

