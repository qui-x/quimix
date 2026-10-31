/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLS (visual)
   ARQUIVO: cores-escalas.js
   ───────────────────────────────────────────────────────────────
   Cor de categoria do elemento conforme o tema ativo (claro/escuro/
   daltônico), e o sistema de escala de cores para os cartões de
   propriedade (ex: energia de ionização) — onde o valor do elemento
   cai numa escala visual entre um mínimo e um máximo.
   Depende de: dadossitp.js (ESCALA_CALOR e o formato de cada
               propriedade em PROPRIEDADES).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ---- cor por categoria (lê os mesmos atributos data-theme/data-daltonico
// que o SIE já usa, herdados do a11y.js compartilhado entre simuladores) ----
function getCatColorHexMols(cat) {
  const dalt = document.documentElement.getAttribute('data-daltonico');
  if (dalt && CAT_COLOR_HEX_DALT[dalt]) return CAT_COLOR_HEX_DALT[dalt][cat] || '#888';
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  return (isLight ? CAT_COLOR_HEX_LIGHT : CAT_COLOR_HEX_DARK)[cat] || '#888';
}

// ---- cards de propriedade (eletronegatividade / energia de ionização) ----
function escalaDaPropriedadeMols(prop) {
  const r = document.documentElement;
  const dalt = r.getAttribute('data-daltonico');
  const alto = r.getAttribute('data-contrast') === 'on';
  const mono = (alto || (dalt && dalt !== 'nenhum'));
  return (mono && prop.escalaMono) ? prop.escalaMono : (prop.escala || ESCALA_CALOR);
}

function hexParaRgbMols(hex) {
  const h = String(hex).replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbParaHexMols(r, g, b) {
  return '#' + [r, g, b].map((n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')).join('');
}

function corNaEscalaMols(prop, v) {
  const paradas = escalaDaPropriedadeMols(prop);
  const p = fracaoPropriedadeMols(prop, v);
  for (let i = 0; i < paradas.length - 1; i++) {
    const a = paradas[i], b = paradas[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = (b.p === a.p) ? 0 : (p - a.p) / (b.p - a.p);
      const ca = hexParaRgbMols(a.hex), cb = hexParaRgbMols(b.hex);
      return rgbParaHexMols(ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t);
    }
  }
  return paradas[paradas.length - 1].hex;
}

function valorPropriedadeMols(prop, Z) {
  const linha = prop.tabela ? prop.tabela[Z] : undefined;
  if (linha === null || linha === undefined) return null;
  const v = prop.campo ? linha[prop.campo] : linha;
  return (typeof v === 'number' && isFinite(v)) ? v : null;
}

function numeroPropriedadeMols(prop, v) {
  if (v === null) return '—';
  return v.toFixed(prop.decimais).replace('.', ',');
}

function fracaoPropriedadeMols(prop, v) {
  if (v === null) return 0;
  const span = prop.vmax - prop.vmin;
  if (!(span > 0)) return 0;
  return Math.max(0, Math.min(1, (v - prop.vmin) / span));
}

