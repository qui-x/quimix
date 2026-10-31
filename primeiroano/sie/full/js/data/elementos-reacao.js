/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS (módulo Estequiometria)
   ARQUIVO: elementos-reacao.js
   ───────────────────────────────────────────────────────────────
   Catálogo LOCAL e enxuto de elementos usados nas reações químicas
   (cor, raio de covalência, valência, categoria) — não é o mesmo
   catálogo completo de 118 elementos que vem de dadossitp.js: este é
   só o necessário para desenhar átomos e formar ligações no módulo
   Estequiometria.
   Depende de: nada.
   Usado por: praticamente todos os módulos de física/renderização
              do lado Estequiometria (não usado pelo módulo Mols,
              que usa ELEMENTO_POR_SIMBOLO_MOLS de dadossitp.js).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   1. REGISTRO DE ELEMENTOS — propriedades químicas reais
   - massa molar (g/mol): valores oficiais do CIAAW/IUPAC, tabela
     "Abridged Standard Atomic Weights 2024" (ciaaw.org/abridged-
     atomic-weights.htm).
   - raio (Å): raios de ligação simples de Cordero et al. (2008),
     Dalton Trans., 2832–2838 (covalentes/metaloides) ou raio
     metálico/iônico padrão para os metais.
   - tipo: "covalente" (compartilha pares — usa valence/lonePairs),
     "ionico" (doa elétrons — usa valence como carga/elétrons
     doáveis, lonePairs sempre 0) ou "metalico" (mar de elétrons —
     não segue regra do octeto, valence/lonePairs não se aplicam).
   - valência = nº de elétrons DESPAREADOS (covalente) ou Nº de
     elétrons doáveis = carga iônica (iônico); lonePairs = pares
     isolados (só covalente).
   --------------------------------------------------------------- */
const ELEMENTS = {
  // --- COVALENTES (compartilham pares de elétrons) ---
  H:  { z: 1,  tipo: "covalente", valence: 1, molar: 1.008,  radius: 0.31, lonePairs: 0, colorCss: "#f2f5f7", textColor: "#11151b", categoria: "Não-metal" },
  C:  { z: 6,  tipo: "covalente", valence: 4, molar: 12.011, radius: 0.76, lonePairs: 0, colorCss: "#3a3f47", textColor: "#fff",    categoria: "Não-metal" },
  N:  { z: 7,  tipo: "covalente", valence: 3, molar: 14.007, radius: 0.71, lonePairs: 1, colorCss: "#4c6fff", textColor: "#fff",    categoria: "Não-metal" },
  O:  { z: 8,  tipo: "covalente", valence: 2, molar: 15.999, radius: 0.66, lonePairs: 2, colorCss: "#ff5d5d", textColor: "#fff",    categoria: "Não-metal" },
  F:  { z: 9,  tipo: "covalente", valence: 1, molar: 18.998, radius: 0.57, lonePairs: 3, colorCss: "#b8f24c", textColor: "#15210a", categoria: "Halogênio" },
  Si: { z: 14, tipo: "covalente", valence: 4, molar: 28.085, radius: 1.11, lonePairs: 0, colorCss: "#caa472", textColor: "#241a0a", categoria: "Metaloide" },
  P:  { z: 15, tipo: "covalente", valence: 3, molar: 30.974, radius: 1.07, lonePairs: 1, colorCss: "#ff9d42", textColor: "#2a1500", categoria: "Não-metal" },
  S:  { z: 16, tipo: "covalente", valence: 2, molar: 32.06,  radius: 1.05, lonePairs: 2, colorCss: "#ffd23f", textColor: "#241a02", categoria: "Não-metal" },
  Cl: { z: 17, tipo: "covalente", valence: 1, molar: 35.45,  radius: 1.02, lonePairs: 3, colorCss: "#3ddc6a", textColor: "#08230f", categoria: "Halogênio" },
  Br: { z: 35, tipo: "covalente", valence: 1, molar: 79.904, radius: 1.20, lonePairs: 3, colorCss: "#a83232", textColor: "#fff",    categoria: "Halogênio" },
  I:  { z: 53, tipo: "covalente", valence: 1, molar: 126.90, radius: 1.39, lonePairs: 3, colorCss: "#8b2fb5", textColor: "#fff",    categoria: "Halogênio" },

  // --- IÔNICOS (doam elétrons — formam cátion; valence = carga/e⁻ doáveis) ---
  Li: { z: 3,  tipo: "ionico", valence: 1, molar: 6.94,   radius: 1.28, lonePairs: 0, colorCss: "#c9a0ff", textColor: "#1d0a2e", categoria: "Metal Alcalino" },
  Na: { z: 11, tipo: "ionico", valence: 1, molar: 22.990, radius: 1.66, lonePairs: 0, colorCss: "#ab5cf2", textColor: "#fff",    categoria: "Metal Alcalino" },
  K:  { z: 19, tipo: "ionico", valence: 1, molar: 39.098, radius: 2.03, lonePairs: 0, colorCss: "#8f3fd6", textColor: "#fff",    categoria: "Metal Alcalino" },
  Mg: { z: 12, tipo: "ionico", valence: 2, molar: 24.305, radius: 1.41, lonePairs: 0, colorCss: "#6bcb3c", textColor: "#0a1a04", categoria: "Metal Alcalino-Terroso" },
  Ca: { z: 20, tipo: "ionico", valence: 2, molar: 40.078, radius: 1.76, lonePairs: 0, colorCss: "#3dbb6e", textColor: "#fff",    categoria: "Metal Alcalino-Terroso" },
  Al: { z: 13, tipo: "ionico", valence: 3, molar: 26.982, radius: 1.21, lonePairs: 0, colorCss: "#c0c4cc", textColor: "#15171a", categoria: "Metal" },
  Zn: { z: 30, tipo: "ionico", valence: 2, molar: 65.38,  radius: 1.42, lonePairs: 0, colorCss: "#7d9bb0", textColor: "#fff",    categoria: "Metal de Transição" },
  // Fe: na vida real tem estados de oxidação variáveis (Fe²⁺/Fe³⁺); aqui
  // fixamos Fe³⁺ (valence:3) por ser o mais comum no ensino médio — a
  // ferrugem, Fe2O3. Por isso Fe entra como "ionico", não "metalico".
  Fe: { z: 26, tipo: "ionico", valence: 3, molar: 55.845, radius: 1.32, lonePairs: 0, colorCss: "#d8852b", textColor: "#1a0d00", categoria: "Metal de Transição" },

  // --- METÁLICOS (mar de elétrons deslocalizados — sem regra do octeto) ---
  Cu: { z: 29, tipo: "metalico", valence: 0, lonePairs: 0, molar: 63.546, radius: 1.32, colorCss: "#c87137", textColor: "#fff",    categoria: "Metal de Transição" },
  Sn: { z: 50, tipo: "ionico", valence: 2, lonePairs: 0, molar: 118.71, radius: 1.40, colorCss: "#9fa6ad", textColor: "#15171a", categoria: "Metal" },
  Au: { z: 79, tipo: "metalico", valence: 0, lonePairs: 0, molar: 196.97, radius: 1.36, colorCss: "#ffd24c", textColor: "#241a00", categoria: "Metal de Transição" },
  Ag: { z: 47, tipo: "ionico", valence: 1, lonePairs: 0, molar: 107.87, radius: 1.45, colorCss: "#e3e6ea", textColor: "#15171a", categoria: "Metal de Transição" },

  // --- IONICO (gerado por grupo/categoria) ---
  Be: { z: 4, tipo: "ionico", valence: 2, molar: 9.0122, radius: 0.96, lonePairs: 0, colorCss: "#fb923c", textColor: "#111827", categoria: "Metal Alcalino-Terroso" },
  Ga: { z: 31, tipo: "ionico", valence: 3, molar: 69.723, radius: 1.22, lonePairs: 0, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  Rb: { z: 37, tipo: "ionico", valence: 1, molar: 85.468, radius: 2.2, lonePairs: 0, colorCss: "#ef4444", textColor: "#ffffff", categoria: "Metal Alcalino" },
  Sr: { z: 38, tipo: "ionico", valence: 2, molar: 87.62, radius: 1.95, lonePairs: 0, colorCss: "#fb923c", textColor: "#111827", categoria: "Metal Alcalino-Terroso" },
  Cd: { z: 48, tipo: "ionico", valence: 2, molar: 112.41, radius: 1.44, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  In: { z: 49, tipo: "ionico", valence: 3, molar: 114.82, radius: 1.42, lonePairs: 0, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  Cs: { z: 55, tipo: "ionico", valence: 1, molar: 132.91, radius: 2.44, lonePairs: 0, colorCss: "#ef4444", textColor: "#ffffff", categoria: "Metal Alcalino" },
  Ba: { z: 56, tipo: "ionico", valence: 2, molar: 137.33, radius: 2.15, lonePairs: 0, colorCss: "#fb923c", textColor: "#111827", categoria: "Metal Alcalino-Terroso" },
  La: { z: 57, tipo: "ionico", valence: 3, molar: 138.91, radius: 2.07, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Ce: { z: 58, tipo: "ionico", valence: 3, molar: 140.12, radius: 2.04, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Pr: { z: 59, tipo: "ionico", valence: 3, molar: 140.91, radius: 2.03, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Nd: { z: 60, tipo: "ionico", valence: 3, molar: 144.24, radius: 2.01, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Pm: { z: 61, tipo: "ionico", valence: 3, molar: 145.0, radius: 1.99, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Sm: { z: 62, tipo: "ionico", valence: 3, molar: 150.36, radius: 1.98, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Eu: { z: 63, tipo: "ionico", valence: 3, molar: 151.96, radius: 1.98, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Gd: { z: 64, tipo: "ionico", valence: 3, molar: 157.25, radius: 1.96, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Tb: { z: 65, tipo: "ionico", valence: 3, molar: 158.93, radius: 1.94, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Dy: { z: 66, tipo: "ionico", valence: 3, molar: 162.5, radius: 1.92, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Ho: { z: 67, tipo: "ionico", valence: 3, molar: 164.93, radius: 1.92, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Er: { z: 68, tipo: "ionico", valence: 3, molar: 167.26, radius: 1.89, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Tm: { z: 69, tipo: "ionico", valence: 3, molar: 168.93, radius: 1.9, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Yb: { z: 70, tipo: "ionico", valence: 3, molar: 173.05, radius: 1.87, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Lu: { z: 71, tipo: "ionico", valence: 3, molar: 174.97, radius: 1.87, lonePairs: 0, colorCss: "#fbbf24", textColor: "#111827", categoria: "Lantanídeo" },
  Hg: { z: 80, tipo: "ionico", valence: 2, molar: 200.59, radius: 1.32, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Tl: { z: 81, tipo: "ionico", valence: 1, molar: 204.38, radius: 1.45, lonePairs: 0, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  Pb: { z: 82, tipo: "ionico", valence: 2, molar: 207.2, radius: 1.46, lonePairs: 0, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  Bi: { z: 83, tipo: "ionico", valence: 3, molar: 208.98, radius: 1.48, lonePairs: 0, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  Fr: { z: 87, tipo: "ionico", valence: 1, molar: 223.0, radius: 2.6, lonePairs: 0, colorCss: "#ef4444", textColor: "#ffffff", categoria: "Metal Alcalino" },
  Ra: { z: 88, tipo: "ionico", valence: 2, molar: 226.0, radius: 2.21, lonePairs: 0, colorCss: "#fb923c", textColor: "#111827", categoria: "Metal Alcalino-Terroso" },
  Nh: { z: 113, tipo: "ionico", valence: 3, molar: 286.0, radius: 1.36, lonePairs: 0, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  Fl: { z: 114, tipo: "ionico", valence: 2, molar: 289.0, radius: 1.43, lonePairs: 0, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  Mc: { z: 115, tipo: "ionico", valence: 3, molar: 290.0, radius: 1.62, lonePairs: 0, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  // --- COVALENTE (gerado por grupo/categoria) ---
  B: { z: 5, tipo: "covalente", valence: 3, molar: 10.81, radius: 0.84, lonePairs: 0, colorCss: "#2dd4bf", textColor: "#111827", categoria: "Metaloide" },
  Ge: { z: 32, tipo: "covalente", valence: 4, molar: 72.63, radius: 1.22, lonePairs: 0, colorCss: "#2dd4bf", textColor: "#111827", categoria: "Metaloide" },
  As: { z: 33, tipo: "covalente", valence: 3, molar: 74.922, radius: 1.19, lonePairs: 1, colorCss: "#2dd4bf", textColor: "#111827", categoria: "Metaloide" },
  Se: { z: 34, tipo: "covalente", valence: 2, molar: 78.971, radius: 1.2, lonePairs: 2, colorCss: "#4ade80", textColor: "#111827", categoria: "Não-metal" },
  Sb: { z: 51, tipo: "covalente", valence: 3, molar: 121.76, radius: 1.39, lonePairs: 1, colorCss: "#2dd4bf", textColor: "#111827", categoria: "Metaloide" },
  Te: { z: 52, tipo: "covalente", valence: 2, molar: 127.6, radius: 1.38, lonePairs: 2, colorCss: "#2dd4bf", textColor: "#111827", categoria: "Metaloide" },
  Po: { z: 84, tipo: "covalente", valence: 2, molar: 209.0, radius: 1.4, lonePairs: 2, colorCss: "#2dd4bf", textColor: "#111827", categoria: "Metal" },
  At: { z: 85, tipo: "covalente", valence: 1, molar: 210.0, radius: 1.5, lonePairs: 3, colorCss: "#4ade80", textColor: "#111827", categoria: "Halogênio" },
  Lv: { z: 116, tipo: "covalente", valence: 2, molar: 293.0, radius: 1.75, lonePairs: 2, colorCss: "#94a3b8", textColor: "#111827", categoria: "Metal" },
  Ts: { z: 117, tipo: "covalente", valence: 1, molar: 294.0, radius: 1.65, lonePairs: 3, colorCss: "#4ade80", textColor: "#111827", categoria: "Halogênio" },
  // --- METALICO (gerado por grupo/categoria) ---
  Sc: { z: 21, tipo: "metalico", valence: 0, molar: 44.956, radius: 1.7, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Ti: { z: 22, tipo: "metalico", valence: 0, molar: 47.867, radius: 1.6, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  V: { z: 23, tipo: "metalico", valence: 0, molar: 50.942, radius: 1.53, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Cr: { z: 24, tipo: "metalico", valence: 0, molar: 51.996, radius: 1.39, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Mn: { z: 25, tipo: "metalico", valence: 0, molar: 54.938, radius: 1.61, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Co: { z: 27, tipo: "metalico", valence: 0, molar: 58.933, radius: 1.26, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Ni: { z: 28, tipo: "metalico", valence: 0, molar: 58.693, radius: 1.24, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Y: { z: 39, tipo: "metalico", valence: 0, molar: 88.906, radius: 1.9, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Zr: { z: 40, tipo: "metalico", valence: 0, molar: 91.224, radius: 1.75, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Nb: { z: 41, tipo: "metalico", valence: 0, molar: 92.906, radius: 1.64, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Mo: { z: 42, tipo: "metalico", valence: 0, molar: 95.95, radius: 1.54, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Tc: { z: 43, tipo: "metalico", valence: 0, molar: 97.0, radius: 1.47, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Ru: { z: 44, tipo: "metalico", valence: 0, molar: 101.07, radius: 1.46, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Rh: { z: 45, tipo: "metalico", valence: 0, molar: 102.91, radius: 1.42, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Pd: { z: 46, tipo: "metalico", valence: 0, molar: 106.42, radius: 1.39, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Hf: { z: 72, tipo: "metalico", valence: 0, molar: 178.49, radius: 1.75, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Ta: { z: 73, tipo: "metalico", valence: 0, molar: 180.95, radius: 1.7, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  W: { z: 74, tipo: "metalico", valence: 0, molar: 183.84, radius: 1.62, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Re: { z: 75, tipo: "metalico", valence: 0, molar: 186.21, radius: 1.51, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Os: { z: 76, tipo: "metalico", valence: 0, molar: 190.23, radius: 1.44, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Ir: { z: 77, tipo: "metalico", valence: 0, molar: 192.22, radius: 1.41, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Pt: { z: 78, tipo: "metalico", valence: 0, molar: 195.08, radius: 1.36, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Ac: { z: 89, tipo: "metalico", valence: 0, molar: 227.0, radius: 2.15, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Th: { z: 90, tipo: "metalico", valence: 0, molar: 232.04, radius: 2.06, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Pa: { z: 91, tipo: "metalico", valence: 0, molar: 231.04, radius: 2.0, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  U: { z: 92, tipo: "metalico", valence: 0, molar: 238.03, radius: 1.96, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Np: { z: 93, tipo: "metalico", valence: 0, molar: 237.0, radius: 1.9, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Pu: { z: 94, tipo: "metalico", valence: 0, molar: 244.0, radius: 1.87, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Am: { z: 95, tipo: "metalico", valence: 0, molar: 243.0, radius: 1.8, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Cm: { z: 96, tipo: "metalico", valence: 0, molar: 247.0, radius: 1.69, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Bk: { z: 97, tipo: "metalico", valence: 0, molar: 247.0, radius: 1.68, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Cf: { z: 98, tipo: "metalico", valence: 0, molar: 251.0, radius: 1.68, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Es: { z: 99, tipo: "metalico", valence: 0, molar: 252.0, radius: 1.65, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Fm: { z: 100, tipo: "metalico", valence: 0, molar: 257.0, radius: 1.67, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Md: { z: 101, tipo: "metalico", valence: 0, molar: 258.0, radius: 1.73, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  No: { z: 102, tipo: "metalico", valence: 0, molar: 259.0, radius: 1.76, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Lr: { z: 103, tipo: "metalico", valence: 0, molar: 266.0, radius: 1.61, lonePairs: 0, colorCss: "#34d399", textColor: "#111827", categoria: "Actinídeo" },
  Rf: { z: 104, tipo: "metalico", valence: 0, molar: 267.0, radius: 1.57, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Db: { z: 105, tipo: "metalico", valence: 0, molar: 268.0, radius: 1.49, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Sg: { z: 106, tipo: "metalico", valence: 0, molar: 269.0, radius: 1.43, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Bh: { z: 107, tipo: "metalico", valence: 0, molar: 270.0, radius: 1.41, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Hs: { z: 108, tipo: "metalico", valence: 0, molar: 269.0, radius: 1.34, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Mt: { z: 109, tipo: "metalico", valence: 0, molar: 278.0, radius: 1.29, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Ds: { z: 110, tipo: "metalico", valence: 0, molar: 281.0, radius: 1.28, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Rg: { z: 111, tipo: "metalico", valence: 0, molar: 282.0, radius: 1.21, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  Cn: { z: 112, tipo: "metalico", valence: 0, molar: 285.0, radius: 1.22, lonePairs: 0, colorCss: "#60a5fa", textColor: "#111827", categoria: "Metal de Transição" },
  // --- INERTE (gerado por grupo/categoria) ---
  He: { z: 2, tipo: "inerte", valence: 0, molar: 4.0026, radius: 0.31, lonePairs: 0, colorCss: "#7dd3fc", textColor: "#111827", categoria: "Gás Nobre" },
  Ne: { z: 10, tipo: "inerte", valence: 0, molar: 20.18, radius: 0.38, lonePairs: 0, colorCss: "#7dd3fc", textColor: "#111827", categoria: "Gás Nobre" },
  Ar: { z: 18, tipo: "inerte", valence: 0, molar: 39.948, radius: 0.71, lonePairs: 0, colorCss: "#7dd3fc", textColor: "#111827", categoria: "Gás Nobre" },
  Kr: { z: 36, tipo: "inerte", valence: 0, molar: 83.798, radius: 0.88, lonePairs: 0, colorCss: "#7dd3fc", textColor: "#111827", categoria: "Gás Nobre" },
  Xe: { z: 54, tipo: "inerte", valence: 0, molar: 131.29, radius: 1.08, lonePairs: 0, colorCss: "#7dd3fc", textColor: "#111827", categoria: "Gás Nobre" },
  Rn: { z: 86, tipo: "inerte", valence: 0, molar: 222.0, radius: 1.2, lonePairs: 0, colorCss: "#7dd3fc", textColor: "#111827", categoria: "Gás Nobre" },
  Og: { z: 118, tipo: "inerte", valence: 0, molar: 294.0, radius: 1.57, lonePairs: 0, colorCss: "#7dd3fc", textColor: "#111827", categoria: "Gás Nobre" },
};

// ordem de exibição das fórmulas (convenção usual: cátion primeiro em
// compostos iônicos e hidretos, halogênios em ordem decrescente de
// tamanho, O/F por último)
const ELEMENT_ORDER = [
  "Li", "Na", "K", "Rb", "Cs", "Fr", "Be", "Mg", "Ca", "Sr", "Ba", "Ra",
  "Al", "Ga", "In", "Tl", "Zn", "Cd", "Hg", "Fe", "Ag", "Sn", "Pb", "Bi",
  "Nh", "Fl", "Mc",
  "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu",
  "B", "Si", "Ge", "C", "N", "P", "As", "Sb", "H", "S", "Se", "Te", "Po", "Lv",
  "I", "Br", "Cl", "F", "At", "Ts", "O",
];

