/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (física pura — sem tocar em HTML/canvas)
   ARQUIVO: fisica.js
   ───────────────────────────────────────────────────────────────
   Matemática do modelo de Bohr (energia dos níveis, comprimento de
   onda e cor real do fóton emitido, série espectral) e a regra de
   preenchimento de subcamadas de Madelung, usada pelo modelo
   Quântico. Nenhuma função aqui mexe no DOM ou no canvas.
   Depende de: core/dados.js (usa PHYS).
   Usado por: models/bohr.js, models/quantum.js, app/elemento-ui.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Energias de Bohr: Eₙ = −13.6·Z²/n²
const bohrEnergy = (Z, n) => -PHYS.E0 * Z * Z / (n * n);

// Comprimento de onda do fóton: λ = hc / |ΔE|  (nm)
const photonLambda = (Z, ni, nf) => {
  const dE = Math.abs(bohrEnergy(Z, nf) - bohrEnergy(Z, ni));
  return dE > 0 ? PHYS.hc / dE : Infinity;
};

// Série espectral
const spectralSeries = (nf) => {
  if (nf === 1) return 'Lyman (UV)';
  if (nf === 2) return 'Balmer (visível)';
  if (nf === 3) return 'Paschen (IR)';
  return `n=${nf}`;
};

// ══════════════════════════════════════════════════════════════════
// COR DO FÓTON — calibrada pelas linhas reais de Balmer/Lyman/Paschen
// Fonte: valores modernos NO AR (CRC/NIST) — Hα 656.28nm,
//        Hβ 486.13nm, Hγ 434.05nm, Hδ 410.17nm; conversão λ→RGB por
//        aproximação CIE para as demais transições fora dessas linhas.
// ══════════════════════════════════════════════════════════════════
function photonColor(λ) {
  // Linhas de Balmer EXATAS — usa a cor real medida na literatura
  if (Math.abs(λ - 656.28) < 3)  return '#e63946'; // Hα vermelho
  if (Math.abs(λ - 486.13) < 3)  return '#4cc9c0'; // Hβ azul-petróleo/aqua
  if (Math.abs(λ - 434.05) < 3)  return '#3a6df0'; // Hγ azul
  if (Math.abs(λ - 410.17) < 3)  return '#7b4fe0'; // Hδ violeta

  // Demais transições: aproximação padrão de conversão λ(nm) → RGB
  // (modelo de Dan Bruton, amplamente usado em visualização de espectros)
  if (λ < 380)  return '#9d4edd';  // ultravioleta (visualização convencional violeta)
  let r=0,g=0,b=0;
  if (λ>=380 && λ<440) { r=-(λ-440)/(440-380); g=0; b=1; }
  else if (λ>=440 && λ<490) { r=0; g=(λ-440)/(490-440); b=1; }
  else if (λ>=490 && λ<510) { r=0; g=1; b=-(λ-510)/(510-490); }
  else if (λ>=510 && λ<580) { r=(λ-510)/(580-510); g=1; b=0; }
  else if (λ>=580 && λ<645) { r=1; g=-(λ-645)/(645-580); b=0; }
  else if (λ>=645 && λ<=780) { r=1; g=0; b=0; }
  else if (λ>780) return '#94a3b8'; // infravermelho (cinza convencional)
  const toHex = v => Math.round(Math.max(0,Math.min(1,v))*255).toString(16).padStart(2,'0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ELEMENTS agora vem de window.SIMA_DATA (dadossima.js)
// SHELLS, DISCOVERY_YEAR e MODEL_YEAR idem — desestruturados no topo.

// ORBITAL_FILL_ORDER, SUBSHELL_CAPACITY e SUBSHELL_LABEL também vêm de
// window.SIMA_DATA — desestruturados no topo do arquivo.

/** Distribui Z elétrons nas subcamadas reais seguindo a ordem de Madelung. */
function fillSubshells(Z) {
  let remaining = Z;
  const result = [];
  for (const [n,l] of ORBITAL_FILL_ORDER) {
    if (remaining <= 0) break;
    const cap = SUBSHELL_CAPACITY[l];
    const count = Math.min(cap, remaining);
    result.push({ n, l, count, label: `${n}${SUBSHELL_LABEL[l]}` });
    remaining -= count;
  }
  return result;
}

// MODEL_INFO agora vem de window.SIMA_DATA (dadossima.js)

// ══════════════════════════════════════════════════════════════════
// CONSTANTES VISUAIS
// ══════════════════════════════════════════════════════════════════
// Velocidade angular base do modelo de Bohr (camada K, n=1).
// Fórmula usada: omega = BOHR_OMEGA_K / √n  (sem dependência de Z)
//  n=1 K  → 7.0 s/volta | n=4 N → 14.0 s/volta
//  n=2 L  → 9.9 s/volta | n=5 O → 15.7 s/volta
//  n=3 M  → 12.1 s/volta| n=7 Q → 18.5 s/volta
// Decaimento 1/√n mantém camadas externas visivelmente em movimento,
// sem nenhuma ficar parada nem rápida o suficiente para causar tontura.
const BOHR_OMEGA_K = (2 * Math.PI) / (7 * 60); // rad/frame @60fps

