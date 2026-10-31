/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: moleculas-prontas.js
   ───────────────────────────────────────────────────────────────
   49 moléculas pré-montadas do painel "Moléculas Prontas": fórmula,
   nome, categoria, geometria e a posição/ligações de cada átomo,
   prontas para montar no canvas com um clique.
   Depende de: nada. Usado por: js/molecules/presets.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const MOL_PRESETS = [
  // ── INORGÂNICAS ──────────────────────────────────────────────────
  {
    formula:'H₂', name:'Hidrogênio', category:'inorganic', geometry:'Linear',
    atoms:[{el:'H',x:-0.6,y:0},{el:'H',x:0.6,y:0}],
    bonds:[{a:0,b:1,order:1}]
  },
  {
    formula:'O₂', name:'Oxigênio', category:'inorganic', geometry:'Linear',
    atoms:[{el:'O',x:-0.6,y:0},{el:'O',x:0.6,y:0}],
    bonds:[{a:0,b:1,order:2}]
  },
  {
    formula:'N₂', name:'Nitrogênio', category:'inorganic', geometry:'Linear',
    atoms:[{el:'N',x:-0.6,y:0},{el:'N',x:0.6,y:0}],
    bonds:[{a:0,b:1,order:3}]
  },
  {
    formula:'Cl₂', name:'Cloro', category:'inorganic', geometry:'Linear',
    atoms:[{el:'Cl',x:-0.75,y:0},{el:'Cl',x:0.75,y:0}],
    bonds:[{a:0,b:1,order:1}]
  },
  {
    formula:'F₂', name:'Flúor', category:'inorganic', geometry:'Linear',
    atoms:[{el:'F',x:-0.55,y:0},{el:'F',x:0.55,y:0}],
    bonds:[{a:0,b:1,order:1}]
  },
  {
    formula:'HCl', name:'Ácido Clorídrico', category:'inorganic', geometry:'Linear',
    atoms:[{el:'H',x:-0.55,y:0},{el:'Cl',x:0.55,y:0}],
    bonds:[{a:0,b:1,order:1}]
  },
  {
    formula:'HF', name:'Fluoreto de Hidrogênio', category:'inorganic', geometry:'Linear',
    atoms:[{el:'H',x:-0.45,y:0},{el:'F',x:0.45,y:0}],
    bonds:[{a:0,b:1,order:1}]
  },
  {
    formula:'H₂O', name:'Água', category:'inorganic', geometry:'Angular 104,5°',
    // O no centro; H a 104,5° (±52,25° do eixo)
    atoms:[
      {el:'O',x:0,y:0},
      {el:'H',x:-Math.sin(52.25*Math.PI/180)*0.8, y:-Math.cos(52.25*Math.PI/180)*0.8},
      {el:'H',x: Math.sin(52.25*Math.PI/180)*0.8, y:-Math.cos(52.25*Math.PI/180)*0.8},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1}]
  },
  {
    formula:'H₂O₂', name:'Peróxido de Hidrogênio', category:'inorganic', geometry:'Angular',
    atoms:[
      {el:'O',x:-0.55,y:0},
      {el:'O',x: 0.55,y:0},
      {el:'H',x:-1.1, y:-0.55},
      {el:'H',x: 1.1, y:-0.55},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:1,b:3,order:1}]
  },
  {
    formula:'NH₃', name:'Amônia', category:'inorganic', geometry:'Piramidal 107,8°',
    atoms:[
      {el:'N',x:0,y:0},
      {el:'H',x:-Math.sin(53.9*Math.PI/180)*0.85, y:Math.cos(53.9*Math.PI/180)*0.85},
      {el:'H',x: Math.sin(53.9*Math.PI/180)*0.85, y:Math.cos(53.9*Math.PI/180)*0.85},
      {el:'H',x:0,y:-0.85},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1}]
  },
  {
    formula:'CH₄', name:'Metano', category:'inorganic', geometry:'Tetraédrico 109,5°',
    atoms:[
      {el:'C',x:0,y:0},
      {el:'H',x:0,y:-1.0},
      {el:'H',x: 0.94,y: 0.33},
      {el:'H',x:-0.94,y: 0.33},
      {el:'H',x:0,y: 0.85},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1}]
  },
  {
    formula:'CO₂', name:'Dióxido de Carbono', category:'inorganic', geometry:'Linear 180°',
    atoms:[{el:'O',x:-1.05,y:0},{el:'C',x:0,y:0},{el:'O',x:1.05,y:0}],
    bonds:[{a:0,b:1,order:2},{a:1,b:2,order:2}]
  },
  {
    formula:'SO₂', name:'Dióxido de Enxofre', category:'inorganic', geometry:'Angular 119,5°',
    atoms:[
      {el:'S',x:0,y:0},
      {el:'O',x:-Math.sin(59.75*Math.PI/180)*0.95, y:-Math.cos(59.75*Math.PI/180)*0.95},
      {el:'O',x: Math.sin(59.75*Math.PI/180)*0.95, y:-Math.cos(59.75*Math.PI/180)*0.95},
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:2}]
  },
  {
    formula:'SO₃', name:'Trióxido de Enxofre', category:'inorganic', geometry:'Trigonal Planar 120°',
    atoms:[
      {el:'S',x:0,y:0},
      {el:'O',x:0,y:-1.0},
      {el:'O',x: 0.866,y: 0.5},
      {el:'O',x:-0.866,y: 0.5},
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:2},{a:0,b:3,order:2}]
  },
  {
    formula:'NO₂', name:'Dióxido de Nitrogênio', category:'inorganic', geometry:'Angular 134°',
    atoms:[
      {el:'N',x:0,y:0},
      {el:'O',x:-Math.sin(67*Math.PI/180)*0.9, y:-Math.cos(67*Math.PI/180)*0.9},
      {el:'O',x: Math.sin(67*Math.PI/180)*0.9, y:-Math.cos(67*Math.PI/180)*0.9},
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:2}]
  },
  {
    formula:'N₂O', name:'Óxido Nitroso', category:'inorganic', geometry:'Linear',
    atoms:[{el:'N',x:-0.65,y:0},{el:'N',x:0,y:0},{el:'O',x:0.65,y:0}],
    bonds:[{a:0,b:1,order:2},{a:1,b:2,order:2}]
  },
  {
    formula:'O₃', name:'Ozônio', category:'inorganic', geometry:'Angular 116,8°',
    atoms:[
      {el:'O',x:0,y:0},
      {el:'O',x:-Math.sin(58.4*Math.PI/180)*0.85, y:Math.cos(58.4*Math.PI/180)*0.85},
      {el:'O',x: Math.sin(58.4*Math.PI/180)*0.85, y:Math.cos(58.4*Math.PI/180)*0.85},
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:1}]
  },
  {
    formula:'H₂S', name:'Sulfeto de Hidrogênio', category:'inorganic', geometry:'Angular 92,1°',
    atoms:[
      {el:'S',x:0,y:0},
      {el:'H',x:-Math.sin(46.05*Math.PI/180)*0.85, y:-Math.cos(46.05*Math.PI/180)*0.85},
      {el:'H',x: Math.sin(46.05*Math.PI/180)*0.85, y:-Math.cos(46.05*Math.PI/180)*0.85},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1}]
  },
  {
    formula:'PH₃', name:'Fosfina', category:'inorganic', geometry:'Piramidal 93,5°',
    atoms:[
      {el:'P',x:0,y:0},
      {el:'H',x:-Math.sin(46.75*Math.PI/180)*0.9, y:Math.cos(46.75*Math.PI/180)*0.9},
      {el:'H',x: Math.sin(46.75*Math.PI/180)*0.9, y:Math.cos(46.75*Math.PI/180)*0.9},
      {el:'H',x:0,y:-0.9},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1}]
  },
  // ── ÁCIDOS ────────────────────────────────────────────────────────
  {
    formula:'HNO₃', name:'Ácido Nítrico', category:'acid', geometry:'Trigonal Planar',
    atoms:[
      {el:'N',x:0,y:0},
      {el:'O',x:0,y:-0.9},
      {el:'O',x: 0.78,y: 0.45},
      {el:'O',x:-0.78,y: 0.45},
      {el:'H',x:-1.35,y: 0.45},
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:3,b:4,order:1}]
  },
  {
    formula:'H₂SO₄', name:'Ácido Sulfúrico', category:'acid', geometry:'Tetraédrico',
    atoms:[
      {el:'S',x:0,y:0},
      {el:'O',x:0,y:-1.0},
      {el:'O',x: 0.9,y: 0},
      {el:'O',x:-0.9,y: 0},
      {el:'O',x:0,y:1.0},
      {el:'H',x: 1.6,y: 0},
      {el:'H',x:-1.6,y: 0},
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:2},{a:2,b:5,order:1},{a:3,b:6,order:1}]
  },
  {
    formula:'H₃PO₄', name:'Ácido Fosfórico', category:'acid', geometry:'Tetraédrico',
    atoms:[
      {el:'P',x:0,y:0},
      {el:'O',x:0,y:-1.0},
      {el:'O',x: 0.9,y: 0.35},
      {el:'O',x:-0.9,y: 0.35},
      {el:'O',x:0,y: 1.0},
      {el:'H',x: 1.55,y: 0.35},
      {el:'H',x:-1.55,y: 0.35},
      {el:'H',x: 0,y: 1.65},
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1},{a:2,b:5,order:1},{a:3,b:6,order:1},{a:4,b:7,order:1}]
  },
  {
    formula:'HCN', name:'Ácido Cianídrico', category:'acid', geometry:'Linear',
    atoms:[{el:'H',x:-0.8,y:0},{el:'C',x:0,y:0},{el:'N',x:0.9,y:0}],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:3}]
  },
  // ── BASES ─────────────────────────────────────────────────────────
  {
    formula:'NaOH', name:'Hidróxido de Sódio', category:'base', geometry:'Linear',
    atoms:[{el:'Na',x:-0.8,y:0},{el:'O',x:0,y:0},{el:'H',x:0.7,y:0}],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:1}]
  },
  {
    formula:'KOH', name:'Hidróxido de Potássio', category:'base', geometry:'Linear',
    atoms:[{el:'K',x:-0.9,y:0},{el:'O',x:0,y:0},{el:'H',x:0.7,y:0}],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:1}]
  },
  {
    formula:'Ca(OH)₂', name:'Hidróxido de Cálcio', category:'base', geometry:'Angular',
    atoms:[
      {el:'Ca',x:0,y:0},
      {el:'O',x:-0.9,y:0.45},
      {el:'O',x: 0.9,y:0.45},
      {el:'H',x:-1.5,y:0.45},
      {el:'H',x: 1.5,y:0.45},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:1,b:3,order:1},{a:2,b:4,order:1}]
  },
  {
    formula:'N₂H₄', name:'Hidrazina', category:'base', geometry:'Piramidal',
    atoms:[
      {el:'N',x:-0.6,y:0},
      {el:'N',x: 0.6,y:0},
      {el:'H',x:-1.1,y:-0.65},
      {el:'H',x:-1.1,y: 0.65},
      {el:'H',x: 1.1,y:-0.65},
      {el:'H',x: 1.1,y: 0.65},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:1,b:4,order:1},{a:1,b:5,order:1}]
  },
  // ── ORGÂNICAS ─────────────────────────────────────────────────────
  {
    formula:'CH₄', name:'Metano', category:'organic', geometry:'Tetraédrico',
    atoms:[
      {el:'C',x:0,y:0},
      {el:'H',x:0,y:-1.0},
      {el:'H',x: 0.94,y: 0.33},
      {el:'H',x:-0.94,y: 0.33},
      {el:'H',x:0,y: 0.85},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1}]
  },
  {
    formula:'C₂H₆', name:'Etano', category:'organic', geometry:'Tetraédrico',
    atoms:[
      {el:'C',x:-0.7,y:0},
      {el:'C',x: 0.7,y:0},
      {el:'H',x:-1.25,y:-0.75},
      {el:'H',x:-1.25,y: 0.75},
      {el:'H',x:-0.7,y:-0.9},
      {el:'H',x: 1.25,y:-0.75},
      {el:'H',x: 1.25,y: 0.75},
      {el:'H',x: 0.7,y:-0.9},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1},{a:1,b:5,order:1},{a:1,b:6,order:1},{a:1,b:7,order:1}]
  },
  {
    formula:'C₂H₄', name:'Etileno', category:'organic', geometry:'Trigonal Planar',
    atoms:[
      {el:'C',x:-0.65,y:0},
      {el:'C',x: 0.65,y:0},
      {el:'H',x:-1.25,y:-0.7},
      {el:'H',x:-1.25,y: 0.7},
      {el:'H',x: 1.25,y:-0.7},
      {el:'H',x: 1.25,y: 0.7},
    ],
    bonds:[{a:0,b:1,order:2},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:1,b:4,order:1},{a:1,b:5,order:1}]
  },
  {
    formula:'C₂H₂', name:'Acetileno', category:'organic', geometry:'Linear',
    atoms:[
      {el:'H',x:-1.45,y:0},
      {el:'C',x:-0.65,y:0},
      {el:'C',x: 0.65,y:0},
      {el:'H',x: 1.45,y:0},
    ],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:3},{a:2,b:3,order:1}]
  },
  {
    formula:'CH₃OH', name:'Metanol', category:'organic', geometry:'Tetraédrico',
    atoms:[
      {el:'C',x:-0.55,y:0},
      {el:'O',x: 0.55,y:0},
      {el:'H',x:-1.1,y:-0.7},
      {el:'H',x:-1.1,y: 0.7},
      {el:'H',x:-0.55,y:-0.9},
      {el:'H',x: 1.2,y:0},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1},{a:1,b:5,order:1}]
  },
  {
    formula:'CH₃CHO', name:'Acetaldeído', category:'organic', geometry:'Trigonal Planar',
    atoms:[
      {el:'C',x:-0.7,y:0},
      {el:'C',x: 0.55,y:0},
      {el:'O',x: 1.4,y:0},
      {el:'H',x:-1.25,y:-0.7},
      {el:'H',x:-1.25,y: 0.7},
      {el:'H',x:-0.7,y:-0.9},
      {el:'H',x: 0.55,y:-0.9},
    ],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:2},{a:0,b:3,order:1},{a:0,b:4,order:1},{a:0,b:5,order:1},{a:1,b:6,order:1}]
  },
  {
    formula:'CO', name:'Monóxido de Carbono', category:'organic', geometry:'Linear',
    atoms:[{el:'C',x:-0.55,y:0},{el:'O',x:0.55,y:0}],
    bonds:[{a:0,b:1,order:3}]
  },
  {
    formula:'CCl₄', name:'Tetracloreto de Carbono', category:'organic', geometry:'Tetraédrico',
    atoms:[
      {el:'C',x:0,y:0},
      {el:'Cl',x:0,y:-1.1},
      {el:'Cl',x: 1.04,y: 0.37},
      {el:'Cl',x:-1.04,y: 0.37},
      {el:'Cl',x:0,y: 0.9},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1}]
  },
  // ── HALETOS ───────────────────────────────────────────────────────
  {
    formula:'NaCl', name:'Cloreto de Sódio', category:'halide', geometry:'Iônica',
    atoms:[{el:'Na',x:-0.75,y:0},{el:'Cl',x:0.75,y:0}],
    bonds:[{a:0,b:1,order:1}]
  },
  {
    formula:'MgCl₂', name:'Cloreto de Magnésio', category:'halide', geometry:'Linear',
    atoms:[{el:'Cl',x:-1.1,y:0},{el:'Mg',x:0,y:0},{el:'Cl',x:1.1,y:0}],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:1}]
  },
  {
    formula:'AlCl₃', name:'Cloreto de Alumínio', category:'halide', geometry:'Trigonal Planar 120°',
    atoms:[
      {el:'Al',x:0,y:0},
      {el:'Cl',x:0,y:-1.1},
      {el:'Cl',x: 0.95,y: 0.55},
      {el:'Cl',x:-0.95,y: 0.55},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1}]
  },
  {
    formula:'BF₃', name:'Trifluoreto de Boro', category:'halide', geometry:'Trigonal Planar 120°',
    atoms:[
      {el:'B',x:0,y:0},
      {el:'F',x:0,y:-1.0},
      {el:'F',x: 0.866,y: 0.5},
      {el:'F',x:-0.866,y: 0.5},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1}]
  },
  {
    formula:'SF₆', name:'Hexafluoreto de Enxofre', category:'halide', geometry:'Octaédrico 90°',
    atoms:[
      {el:'S', x:0,   y:0},
      {el:'F', x:0,   y:-1.1},
      {el:'F', x:0,   y: 1.1},
      {el:'F', x:-1.1,y:0},
      {el:'F', x: 1.1,y:0},
      {el:'F', x:-0.78,y:-0.78},
      {el:'F', x: 0.78,y: 0.78},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1},{a:0,b:5,order:1},{a:0,b:6,order:1}]
  },
  {
    formula:'PCl₅', name:'Pentacloreto de Fósforo', category:'halide', geometry:'Trigonal Bipiramidal',
    atoms:[
      {el:'P', x:0,   y:0},
      {el:'Cl',x:0,   y:-1.2},
      {el:'Cl',x:0,   y: 1.2},
      {el:'Cl',x:-1.04,y:0},
      {el:'Cl',x: 0.52,y:-0.9},
      {el:'Cl',x: 0.52,y: 0.9},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1},{a:0,b:5,order:1}]
  },
  {
    formula:'XeF₂', name:'Difluoreto de Xenônio', category:'noble', geometry:'Linear 180°',
    atoms:[{el:'F',x:-1.0,y:0},{el:'Xe',x:0,y:0},{el:'F',x:1.0,y:0}],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:1}]
  },
  {
    formula:'XeF₄', name:'Tetrafluoreto de Xenônio', category:'noble', geometry:'Quadrado Planar 90°',
    atoms:[
      {el:'Xe',x:0,y:0},
      {el:'F', x:0,y:-1.0},
      {el:'F', x:0,y: 1.0},
      {el:'F', x:-1.0,y:0},
      {el:'F', x: 1.0,y:0},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1}]
  },
  {
    formula:'KrF₂', name:'Difluoreto de Crípton', category:'noble', geometry:'Linear 180°',
    atoms:[{el:'F',x:-1.0,y:0},{el:'Kr',x:0,y:0},{el:'F',x:1.0,y:0}],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:1}]
  },
  // Mais inorgânicas
  {
    formula:'BeH₂', name:'Beriletodidreto', category:'inorganic', geometry:'Linear 180°',
    atoms:[{el:'H',x:-0.8,y:0},{el:'Be',x:0,y:0},{el:'H',x:0.8,y:0}],
    bonds:[{a:0,b:1,order:1},{a:1,b:2,order:1}]
  },
  {
    formula:'CS₂', name:'Dissulfeto de Carbono', category:'inorganic', geometry:'Linear 180°',
    atoms:[{el:'S',x:-1.1,y:0},{el:'C',x:0,y:0},{el:'S',x:1.1,y:0}],
    bonds:[{a:0,b:1,order:2},{a:1,b:2,order:2}]
  },
  {
    formula:'SiH₄', name:'Silano', category:'inorganic', geometry:'Tetraédrico',
    atoms:[
      {el:'Si',x:0,y:0},
      {el:'H',x:0,y:-1.0},
      {el:'H',x: 0.94,y: 0.33},
      {el:'H',x:-0.94,y: 0.33},
      {el:'H',x:0,y: 0.85},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1},{a:0,b:4,order:1}]
  },
  {
    formula:'NF₃', name:'Trifluoreto de Nitrogênio', category:'inorganic', geometry:'Piramidal 102,2°',
    atoms:[
      {el:'N',x:0,y:0},
      {el:'F',x:-Math.sin(51.1*Math.PI/180)*0.9, y:Math.cos(51.1*Math.PI/180)*0.9},
      {el:'F',x: Math.sin(51.1*Math.PI/180)*0.9, y:Math.cos(51.1*Math.PI/180)*0.9},
      {el:'F',x:0,y:-0.9},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1},{a:0,b:3,order:1}]
  },
  {
    formula:'OF₂', name:'Difluoreto de Oxigênio', category:'inorganic', geometry:'Angular 103,2°',
    atoms:[
      {el:'O',x:0,y:0},
      {el:'F',x:-Math.sin(51.6*Math.PI/180)*0.8, y:-Math.cos(51.6*Math.PI/180)*0.8},
      {el:'F',x: Math.sin(51.6*Math.PI/180)*0.8, y:-Math.cos(51.6*Math.PI/180)*0.8},
    ],
    bonds:[{a:0,b:1,order:1},{a:0,b:2,order:1}]
  },
];
