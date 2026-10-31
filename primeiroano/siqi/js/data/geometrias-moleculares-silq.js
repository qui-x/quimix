/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS — INTEGRAÇÃO COM O SILQ
   ARQUIVO: geometrias-moleculares-silq.js
   ───────────────────────────────────────────────────────────────
   Cópia verbatim de js/data/geometrias-moleculares.js do SILQ: banco
   de geometrias moleculares específicas da literatura (ângulos reais
   NIST/IUPAC, hibridização, nota estereoquímica) por fórmula. Quando
   a fórmula de um composto do SIQI bate com uma chave daqui, o
   renderizador 3D usa o ângulo/geometria EXATO da literatura em vez
   da aproximação genérica VSEPR — mesmo mecanismo já usado no SILQ
   pro botão "Snap Literatura".
   Nenhum valor foi alterado; só o cabeçalho de arquivo é novo.
   Usado por: js/render/view3d-silq.js, js/render/silq-integracao.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const MOLECULE_GEOMETRY_DB = {
  // ══════════════════════════════════════════════════════════════════════
  // BANCO DE GEOMETRIAS + ESTEREOQUÍMICA COMPLETO
  // ══════════════════════════════════════════════════════════════════════
  // Campos:
  //   angle      : ângulo de ligação principal (graus, NIST/IUPAC)
  //   geometry   : nome IUPAC da geometria molecular
  //   note       : fonte / detalhe experimental
  //   stereo     : tipo estereoquímico relevante:
  //                'none'       — sem estereoisomeria aplicável
  //                'tetrahedral'— centro quiral sp³ (R/S possível)
  //                'EZ'         — ligação dupla sp², isomeria E/Z
  //                'pyramidal'  — piramidal, inversão de nitrogênio
  //                'linear'     — sp, sem estereoisomeria
  //                'squareplanar'— quadrado planar (isomeria cis/trans)
  //                'seesaw'     — gangorra (SF₄)
  //                'tshaped'    — T-shaped (ClF₃)
  //   hybridization: sp / sp2 / sp3 / dsp2 / d2sp3 / sp3d / sp3d2
  //   ionicCrystal : estrutura de rede para compostos iônicos (NaCl/CsCl/ZnS)
  //   metallicPack : empacotamento para metais (BCC/FCC/HCP)
  // ══════════════════════════════════════════════════════════════════════

  // ── Diatômicas e lineares simples ────────────────────────────────────
  'H2':   { angle:180.0, geometry:'Linear',            note:'H–H: 180°',                   stereo:'linear',    hybridization:'s'    },
  'Cl2':  { angle:180.0, geometry:'Linear',            note:'Cl–Cl: 180°',                 stereo:'linear',    hybridization:'sp3'  },
  'Br2':  { angle:180.0, geometry:'Linear',            note:'Br–Br: 180°',                 stereo:'linear',    hybridization:'sp3'  },
  'I2':   { angle:180.0, geometry:'Linear',            note:'I–I: 180°',                   stereo:'linear',    hybridization:'sp3'  },
  'F2':   { angle:180.0, geometry:'Linear',            note:'F–F: 180°',                   stereo:'linear',    hybridization:'sp3'  },
  'O2':   { angle:180.0, geometry:'Linear',            note:'O=O: 180°',                   stereo:'linear',    hybridization:'sp2'  },
  'N2':   { angle:180.0, geometry:'Linear',            note:'N≡N: 180°',                   stereo:'linear',    hybridization:'sp'   },
  'HCl':  { angle:180.0, geometry:'Linear',            note:'H–Cl: 180°',                  stereo:'linear',    hybridization:'sp3'  },
  'HF':   { angle:180.0, geometry:'Linear',            note:'H–F: 180°',                   stereo:'linear',    hybridization:'sp3'  },
  'HBr':  { angle:180.0, geometry:'Linear',            note:'H–Br: 180°',                  stereo:'linear',    hybridization:'sp3'  },
  'HI':   { angle:180.0, geometry:'Linear',            note:'H–I: 180°',                   stereo:'linear',    hybridization:'sp3'  },
  'CO':   { angle:180.0, geometry:'Linear',            note:'C≡O: 180°',                   stereo:'linear',    hybridization:'sp'   },
  'NO':   { angle:180.0, geometry:'Linear',            note:'N=O: 180° (radical)',          stereo:'linear',    hybridization:'sp2'  },

  // ── Angular (sp³ com 2 pares solitários) ─────────────────────────────
  'H2O':  { angle:104.5, geometry:'Angular',            note:'H–O–H: 104,5° (NIST)',        stereo:'none',      hybridization:'sp3'  },
  'H2S':  { angle: 92.1, geometry:'Angular',            note:'H–S–H: 92,1° (NIST)',         stereo:'none',      hybridization:'sp3'  },
  'H2Se': { angle: 91.0, geometry:'Angular',            note:'H–Se–H: 91,0°',               stereo:'none',      hybridization:'sp3'  },
  'H2Te': { angle: 90.0, geometry:'Angular',            note:'H–Te–H: 90,0°',               stereo:'none',      hybridization:'sp3'  },
  'OF2':  { angle:103.2, geometry:'Angular',            note:'F–O–F: 103,2°',               stereo:'none',      hybridization:'sp3'  },
  'SCl2': { angle:103.0, geometry:'Angular',            note:'Cl–S–Cl: 103,0°',             stereo:'none',      hybridization:'sp3'  },

  // ── Angular (sp² com 1 par solitário — ressonância) ──────────────────
  'SO2':  { angle:119.5, geometry:'Angular',            note:'O–S–O: 119,5° (ressonância)', stereo:'none',      hybridization:'sp2'  },
  'ClO2': { angle:117.5, geometry:'Angular',            note:'O–Cl–O: 117,5°',              stereo:'none',      hybridization:'sp2'  },
  'NO2':  { angle:134.1, geometry:'Angular',            note:'O–N–O: 134,1° (radical)',      stereo:'none',      hybridization:'sp2'  },
  'O3':   { angle:116.8, geometry:'Angular',            note:'O–O–O: 116,8°',               stereo:'none',      hybridization:'sp2'  },

  // ── Piramidal trigonal (sp³ com 1 par solitário) ──────────────────────
  // Estereoquímica: inversão de nitrogênio (N₃ pirâmide — N inverte muito
  // rápido em temperatura ambiente → racemização instantânea). P, As, Sb
  // invertem muito mais lento → centros quirais estáveis em compostos assimétricos.
  'NH3':  { angle:107.8, geometry:'Piramidal Trigonal', note:'H–N–H: 107,8° (NIST)',        stereo:'pyramidal', hybridization:'sp3'  },
  'PH3':  { angle: 93.5, geometry:'Piramidal Trigonal', note:'H–P–H: 93,5°',                stereo:'pyramidal', hybridization:'sp3'  },
  'AsH3': { angle: 91.8, geometry:'Piramidal Trigonal', note:'H–As–H: 91,8°',               stereo:'pyramidal', hybridization:'sp3'  },
  'NF3':  { angle:102.2, geometry:'Piramidal Trigonal', note:'F–N–F: 102,2°',               stereo:'pyramidal', hybridization:'sp3'  },
  'PCl3': { angle:100.3, geometry:'Piramidal Trigonal', note:'Cl–P–Cl: 100,3°',             stereo:'pyramidal', hybridization:'sp3'  },
  'NCl3': { angle:107.1, geometry:'Piramidal Trigonal', note:'Cl–N–Cl: 107,1°',             stereo:'pyramidal', hybridization:'sp3'  },

  // ── Linear (sp — sem estereoisomeria) ─────────────────────────────────
  'CO2':   { angle:180.0, geometry:'Linear',            note:'O–C–O: 180°',                 stereo:'linear',    hybridization:'sp'   },
  'CS2':   { angle:180.0, geometry:'Linear',            note:'S–C–S: 180°',                 stereo:'linear',    hybridization:'sp'   },
  'HCN':   { angle:180.0, geometry:'Linear',            note:'H–C≡N: 180°',                 stereo:'linear',    hybridization:'sp'   },
  'N2O':   { angle:180.0, geometry:'Linear',            note:'N–N–O: 180°',                 stereo:'linear',    hybridization:'sp'   },
  'C2H2':  { angle:180.0, geometry:'Linear',            note:'Acetileno: 180°',              stereo:'linear',    hybridization:'sp'   },
  'BeH2':  { angle:180.0, geometry:'Linear',            note:'H–Be–H: 180°',                stereo:'linear',    hybridization:'sp'   },
  'BeCl2': { angle:180.0, geometry:'Linear',            note:'Cl–Be–Cl: 180°',              stereo:'linear',    hybridization:'sp'   },
  'XeF2':  { angle:180.0, geometry:'Linear',            note:'F–Xe–F: 180°',                stereo:'linear',    hybridization:'sp3d' },

  // ── Trigonal planar (sp² — isomeria E/Z se substituintes diferentes) ──
  // C₂H₄: o C=C é o protótipo da isomeria cis/trans (E/Z).
  // Ambos os carbonos sp² e todos os 6 átomos numa plano (0°).
  'BF3':   { angle:120.0, geometry:'Trigonal Planar',   note:'F–B–F: 120°',                 stereo:'none',      hybridization:'sp2'  },
  'BCl3':  { angle:120.0, geometry:'Trigonal Planar',   note:'Cl–B–Cl: 120°',               stereo:'none',      hybridization:'sp2'  },
  'AlCl3': { angle:120.0, geometry:'Trigonal Planar',   note:'Cl–Al–Cl: 120°',              stereo:'none',      hybridization:'sp2'  },
  'SO3':   { angle:120.0, geometry:'Trigonal Planar',   note:'O–S–O: 120°',                 stereo:'none',      hybridization:'sp2'  },
  'NO3':   { angle:120.0, geometry:'Trigonal Planar',   note:'O–N–O: 120° (íon nitrato)',    stereo:'none',      hybridization:'sp2'  },
  'CO3':   { angle:120.0, geometry:'Trigonal Planar',   note:'O–C–O: 120° (íon carbonato)',  stereo:'none',      hybridization:'sp2'  },
  'C2H4':  { angle:117.4, geometry:'Trigonal Planar',   note:'H–C=C–H: 117,4° (NIST); estereoquímica E/Z possível quando substituintes diferentes', stereo:'EZ', hybridization:'sp2' },
  'HNO3':  { angle:120.0, geometry:'Trigonal Planar',   note:'N centro: 120°',              stereo:'none',      hybridization:'sp2'  },
  'COCl2': { angle:124.3, geometry:'Trigonal Planar',   note:'Fosgênio: Cl–C–Cl 111,4°, O–C–Cl 124,3°', stereo:'none', hybridization:'sp2' },

  // ── Tetraédrico (sp³ — centros quirais R/S possíveis) ─────────────────
  // Centro quiral: átomo sp³ com 4 substituintes DIFERENTES → R ou S
  // CH₄, SiH₄, CCl₄: todos iguais → sem quiralidade
  // CH₃Cl, CHCl₃: substituintes distintos → quiral potencial
  'CH4':    { angle:109.5, geometry:'Tetraédrico',      note:'H–C–H: 109,47° (NIST)',       stereo:'tetrahedral', hybridization:'sp3' },
  'SiH4':   { angle:109.5, geometry:'Tetraédrico',      note:'H–Si–H: 109,5°',              stereo:'tetrahedral', hybridization:'sp3' },
  'CF4':    { angle:109.5, geometry:'Tetraédrico',      note:'F–C–F: 109,5°',               stereo:'tetrahedral', hybridization:'sp3' },
  'CCl4':   { angle:109.5, geometry:'Tetraédrico',      note:'Cl–C–Cl: 109,5°',             stereo:'tetrahedral', hybridization:'sp3' },
  'SiF4':   { angle:109.5, geometry:'Tetraédrico',      note:'F–Si–F: 109,5°',              stereo:'tetrahedral', hybridization:'sp3' },
  'GeH4':   { angle:109.5, geometry:'Tetraédrico',      note:'H–Ge–H: 109,5°',              stereo:'tetrahedral', hybridization:'sp3' },
  'SnH4':   { angle:109.5, geometry:'Tetraédrico',      note:'H–Sn–H: 109,5°',              stereo:'tetrahedral', hybridization:'sp3' },
  'NH4':    { angle:109.5, geometry:'Tetraédrico',      note:'Amônio: 109,5°',              stereo:'tetrahedral', hybridization:'sp3' },
  'PO4':    { angle:109.5, geometry:'Tetraédrico',      note:'Fosfato: 109,5°',             stereo:'tetrahedral', hybridization:'sp3' },
  'SO4':    { angle:109.5, geometry:'Tetraédrico',      note:'Sulfato: 109,5°',             stereo:'tetrahedral', hybridization:'sp3' },
  'ClO4':   { angle:109.5, geometry:'Tetraédrico',      note:'Perclorato: 109,5°',          stereo:'tetrahedral', hybridization:'sp3' },
  'C2H6':   { angle:109.5, geometry:'Tetraédrico',      note:'Etano: H–C–H 107,8°; conformação alternada (anti) mais estável', stereo:'tetrahedral', hybridization:'sp3' },
  'CH3Cl':  { angle:109.5, geometry:'Tetraédrico',      note:'Clorometano: ~108,9°; C com 4 grupos diferentes → potencialmente quiral', stereo:'tetrahedral', hybridization:'sp3' },
  'CH2Cl2': { angle:112.0, geometry:'Tetraédrico dist.', note:'Diclorometano: Cl–C–Cl 112°', stereo:'tetrahedral', hybridization:'sp3' },
  'H2SO4':  { angle:109.5, geometry:'Tetraédrico',      note:'S centro: ~109°',             stereo:'tetrahedral', hybridization:'sp3' },
  'H3PO4':  { angle:109.5, geometry:'Tetraédrico',      note:'P centro: ~109°',             stereo:'tetrahedral', hybridization:'sp3' },

  // ── Geometrias especiais de camada de valência expandida ──────────────
  // T-shaped: AX₃E₂ — 3 lig + 2 pares solitários (ClF₃, BrF₃)
  'ClF3':   { angle: 87.5, geometry:'T-shaped',         note:'F–Cl–F axial 175°, equatorial 87,5°', stereo:'tshaped',     hybridization:'sp3d'  },
  'BrF3':   { angle: 86.2, geometry:'T-shaped',         note:'F–Br–F: 86,2°',               stereo:'tshaped',     hybridization:'sp3d'  },
  'IF3':    { angle: 87.5, geometry:'T-shaped',         note:'F–I–F: ~87,5°',               stereo:'tshaped',     hybridization:'sp3d'  },

  // Gangorra (Seesaw): AX₄E₁ — 4 lig + 1 par solitário (SF₄)
  // Par solitário na posição equatorial → distorção assimétrica
  'SF4':    { angle:101.6, geometry:'Gangorra (Seesaw)', note:'F–S–F eq: 101,6°; axial: 173,1°', stereo:'seesaw', hybridization:'sp3d'  },

  // Quadrado planar: AX₄E₂ — 4 lig + 2 pares solitários opostos
  // Isomeria cis/trans possível com substituintes mistos (ex: Pt(NH₃)₂Cl₂)
  'XeF4':   { angle: 90.0, geometry:'Quadrado Planar',  note:'F–Xe–F: 90°; pares solitários em posições axiais opostas', stereo:'squareplanar', hybridization:'dsp2' },
  'IF5':    { angle: 81.9, geometry:'Piramidal Quadrada',note:'F–I–F: 81,9°',               stereo:'squareplanar', hybridization:'sp3d2' },

  // Trigonal bipiramidal: AX₅ — 5 lig, posições axial e equatorial distintas
  // Ligantes diferentes em axial vs equatorial → possível estereoisomeria
  'PF5':    { angle:120.0, geometry:'Trigonal Bipiramidal', note:'equatorial: 120°, axial: 90°; posições não equivalentes', stereo:'none', hybridization:'sp3d'  },
  'PCl5':   { angle:120.0, geometry:'Trigonal Bipiramidal', note:'equatorial: 120°',        stereo:'none',        hybridization:'sp3d'  },

  // Octaédrico: AX₆ — 6 lig, todos equivalentes por simetria
  // Com substituintes mistos (AX₄Y₂): isomeria cis/trans (como Pt(NH₃)₂Cl₄)
  'SF6':    { angle: 90.0, geometry:'Octaédrico',        note:'F–S–F: 90°; todos equivalentes', stereo:'none',     hybridization:'sp3d2' },

  // ── Compostos iônicos — estrutura de rede cristalina ──────────────────
  // Não há estereoquímica de ligação individual, mas a geometria de
  // coordenação de cada íon é definida pela razão de raios iônico.
  'NaCl':   { angle: 90.0, geometry:'Rede Octaédrica (Rock Salt)', note:'Cada Na⁺ rodeado por 6 Cl⁻ em octaedro; cada Cl⁻ por 6 Na⁺; CN=6:6; rede FCC', stereo:'none', hybridization:'ionic', ionicCrystal:'NaCl-rock-salt' },
  'KCl':    { angle: 90.0, geometry:'Rede Octaédrica (Rock Salt)', note:'Isoestrutural ao NaCl; CN=6:6', stereo:'none', hybridization:'ionic', ionicCrystal:'NaCl-rock-salt' },
  'MgO':    { angle: 90.0, geometry:'Rede Octaédrica (Rock Salt)', note:'CN=6:6; distância Mg–O: 210 pm', stereo:'none', hybridization:'ionic', ionicCrystal:'NaCl-rock-salt' },
  'CaF2':   { angle:109.5, geometry:'Rede de Fluorita',  note:'Ca²⁺: CN=8 (cúbico); F⁻: CN=4 (tetraédrico)', stereo:'none', hybridization:'ionic', ionicCrystal:'fluorite' },

  // ── Outros compostos ──────────────────────────────────────────────────
  'H2O2':   { angle:111.4, geometry:'Angular (diedro)',  note:'H–O–O: 100°; ângulo diedro: 111,4°; H₂O₂ é quiral mas racemiza', stereo:'none', hybridization:'sp3' },
  'N2H4':   { angle:112.0, geometry:'Piramidal',         note:'H–N–H: ~112°; conformação gauche mais estável', stereo:'pyramidal', hybridization:'sp3' },
  'HClO':   { angle:103.0, geometry:'Angular',           note:'H–O–Cl: 103°',               stereo:'none',      hybridization:'sp3' },
  'HClO2':  { angle:110.9, geometry:'Angular',           note:'O–Cl–O: 110,9°',             stereo:'none',      hybridization:'sp3' },
  'ClO3':   { angle:107.0, geometry:'Piramidal Trigonal', note:'O–Cl–O: 107°',              stereo:'pyramidal', hybridization:'sp3' },
};
