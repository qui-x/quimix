/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: imagem-elemento.js
   ───────────────────────────────────────────────────────────────
   Uma foto real (não gerada por CSS) por elemento, pra usar como
   plano de fundo do cabeçalho do modal — a aparência de verdade do
   elemento em amostra pura, em vez de uma sugestão de cor.

   FONTE: Wikimedia Commons, todas de licença livre (a maioria CC BY /
   CC BY-SA, algumas de domínio público) — compiladas a partir do
   dataset público github.com/Bowserinator/Periodic-Table-JSON, que
   por sua vez reúne as imagens já usadas nos infoboxes da Wikipédia
   (Wikipédia só aceita mídia de licença livre nesse lugar). Cada
   entrada guarda o crédito ('credito') pra exibir junto — a maioria
   das licenças CC BY/BY-SA exige atribuição visível, não só um
   comentário no código.

   Se a imagem de algum elemento não carregar (sem internet, ou o
   arquivo mudou de lugar no Commons), o plano de fundo simplesmente
   fica em branco — nada quebra, porque é background-image, não uma
   tag <img> (que mostraria um ícone de link quebrado).

   Depende de: nada.
   Usado por: js/render/imagem-fundo.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const IMAGEM_ELEMENTO = {
  1: { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Hydrogenglow.jpg', credito: 'User:Jurii, CC BY 3.0' },
  2: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Helium-glow.jpg', credito: 'Jurii, CC BY 3.0' },
  3: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/0.5_grams_lithium_under_argon.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  4: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e2/Beryllium_%28Be%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  5: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Boron.jpg', credito: 'Jurii, CC BY 3.0' },
  6: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Pure_Carbon.png', credito: 'Texas Lane, CC BY-SA 4.0' },
  7: { url: 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Nitrogen-glow.jpg', credito: 'Jurii, CC BY 3.0' },
  8: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Liquid_oxygen_in_a_beaker_%28cropped_and_retouched%29.jpg', credito: 'Staff Sgt. Nika Glover, U.S. Air Force, Public domain' },
  9: { url: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Fluoro_liquido_a_-196%C2%B0C_1.jpg', credito: 'Fulvio314, CC BY-SA 3.0' },
  10: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f8/Neon-glow.jpg', credito: 'Jurii, CC BY 3.0' },
  11: { url: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Na_%28Sodium%29.jpg', credito: 'Dnn87, CC BY-SA 3.0' },
  12: { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Magnesium_crystals.jpg', credito: 'Warut Roonguthai, CC BY-SA 3.0' },
  13: { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Aluminium.jpg', credito: 'Jurii, CC BY 3.0' },
  14: { url: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Silicon.jpg', credito: 'Jurii, CC BY 3.0' },
  15: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Phosphorus-purple.jpg', credito: 'Jurii, CC BY 3.0' },
  16: { url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Native_sulfur_%28Vodinskoe_Deposit%3B_quarry_near_Samara%2C_Russia%29_9.jpg', credito: 'James St. John, CC BY 2.0' },
  17: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Chlorine-sample-flip.jpg', credito: 'Benjah-bmm27, Public domain' },
  18: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Argon-glow.jpg', credito: 'Jurii, CC BY 3.0' },
  19: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Potassium.JPG', credito: 'Dnn87, CC BY 3.0' },
  20: { url: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Calcium.jpg', credito: 'Jurii, CC BY 3.0' },
  21: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Scandium%2C_Sc.jpg', credito: 'JanDerChemiker, CC BY-SA 3.0' },
  22: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Titanium.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  23: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Vanadium-pieces.jpg', credito: 'Jurii, CC BY 3.0' },
  24: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Chromium.jpg', credito: 'Jurii, CC BY 3.0' },
  25: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Manganese_element.jpg', credito: 'W. Oelen, CC BY-SA 3.0' },
  26: { url: 'https://images-of-elements.com/iron-2.jpg', credito: 'Chemical ELements A Virtual Museum, CC BY 3.0  source: https://images-of-elements.com/iron.php' },
  27: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Cobalt_ore_2.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  28: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/57/Nickel_chunk.jpg', credito: 'Materialscientist at English Wikipedia, CC BY-SA 3.0' },
  29: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/NatCopper.jpg', credito: 'Native_Copper_Macro_Digon3.jpg: \'Jonathan Zander (Digon3)\' derivative work: Materialscientist, CC BY-SA 2.5' },
  30: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/Zinc_%2830_Zn%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  31: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Solid_gallium_%28Ga%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  32: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Polycrystalline-germanium.jpg', credito: 'Jurii, CC BY 3.0' },
  33: { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Arsenic_%2833_As%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  34: { url: 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Selenium.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  35: { url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Bromine-ampoule.jpg', credito: 'Jurii, CC BY 3.0' },
  36: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/Krypton-glow.jpg', credito: 'Jurii, CC BY 3.0' },
  37: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Rb5.JPG', credito: 'Dnn87, CC BY 3.0' },
  38: { url: 'https://upload.wikimedia.org/wikipedia/commons/8/84/Strontium-1.jpg', credito: 'Jurii, CC BY 3.0' },
  39: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Piece_of_Yttrium.jpg', credito: 'Jan Anskeit, CC BY-SA 4.0' },
  40: { url: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Zirconium-pieces.jpg', credito: 'Jurii, CC BY 3.0' },
  41: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Niobium_strips.JPG', credito: 'Mauro Cateb, CC BY-SA 3.0' },
  42: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Molybdenum.jpg', credito: 'Jurii, CC BY 3.0' },
  43: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Technetium-sample-cropped.jpg', credito: 'GFDL, CC BY-SA 4.0' },
  44: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Ruthenium_crystal.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  45: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Rhodium_%28Rh%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  46: { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Palladium_%2846_Pd%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  47: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Silver-nugget.jpg', credito: 'Jurii, CC BY 3.0' },
  48: { url: 'https://images-of-elements.com/cadmium-4.jpg', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/cadmium.php' },
  49: { url: 'https://images-of-elements.com/indium-2.jpg', credito: 'Jurii, CC BY 3.0' },
  50: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Tin-2.jpg', credito: 'Jurii, CC BY 3.0' },
  51: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Antimony-4.jpg', credito: 'Unknown authorUnknown author, CC BY 3.0' },
  52: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Tellurium2.jpg', credito: 'Unknown authorUnknown author, CC BY 3.0' },
  53: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Iodine-sample.jpg', credito: 'Benjah-bmm27, Public domain' },
  54: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5d/Xenon-glow.jpg', credito: 'Jurii, CC BY 3.0' },
  55: { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3d/Cesium.jpg', credito: 'Dnn87 Contact email: Dnn87yahoo.dk, CC BY-SA 3.0' },
  56: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f5/Barium_%2856_Ba%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  57: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Lanthanum.jpg', credito: 'Jurii, CC BY 3.0' },
  58: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Cerium2.jpg', credito: 'Jurii, CC BY 1.0' },
  59: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Praseodymium.jpg', credito: 'Jurii, CC BY 3.0' },
  60: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Neodymium_%2860_Nd%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  61: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/Promethium.jpg', credito: 'Unknown authorUnknown author, CC BY 3.0' },
  62: { url: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Samarium-2.jpg', credito: 'Unknown authorUnknown author, CC BY 1.0' },
  63: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/Europium.jpg', credito: 'Jurii, CC BY 3.0' },
  64: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Gadolinium-2.jpg', credito: 'Jurii, CC BY 3.0' },
  65: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/9a/Terbium-2.jpg', credito: 'Unknown authorUnknown author, CC BY 1.0' },
  66: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Dysprosium-2.jpg', credito: 'Jurii, CC BY 3.0' },
  67: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Holmium2.jpg', credito: 'Unknown authorUnknown author, CC BY 1.0' },
  68: { url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Erbium-2.jpg', credito: 'Jurii, CC BY 3.0' },
  69: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Thulium-2.jpg', credito: 'Jurii, CC BY 3.0' },
  70: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/Ytterbium-3.jpg', credito: 'Jurii, CC BY 1.0' },
  71: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Lutetium.jpg', credito: 'Jurii, CC BY 3.0' },
  72: { url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/Hafnium_%2872_Hf%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  73: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/61/Tantalum.jpg', credito: 'Jurii, CC BY 3.0' },
  74: { url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Tungsten_rod_with_oxidised_surface.jpg', credito: 'Jurii, CC BY 1.0' },
  75: { url: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Pure_rhenium_bead%2C_arc_melted%2C_21_grams._Original_size_in_cm_-_1.5_x_1.7.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  76: { url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Osmium-bead.jpg', credito: 'Jurii, CC BY 3.0' },
  77: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Iridium-2.jpg', credito: 'Unknown authorUnknown author, CC BY 1.0' },
  78: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Platinum_crystals.jpg', credito: 'Periodictableru, CC BY 3.0' },
  79: { url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Gold_%2879_Au%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  80: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Hydrargyrum_%2880_Hg%29.jpg', credito: 'Hi-Res Images of Chemical Elements, CC BY 3.0' },
  81: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Thallium_%2881_Tl%29.jpg', credito: 'Hi-Res Images ofChemical Elements, CC BY 3.0' },
  82: { url: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Lead-2.jpg', credito: 'Chemical Elements, CC BY 3.0' },
  83: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Bismuth-2.jpg', credito: 'Jurii, CC BY 3.0' },
  84: { url: 'https://images-of-elements.com/polonium.jpg', credito: 'Chemical ELements A Virtual Museum, CC BY 3.0  source: https://images-of-elements.com/polonium.php' },
  85: { url: 'https://images-of-elements.com/astatine.jpg', credito: 'Chemical ELements A Virtual Museum, CC BY 3.0  source: https://images-of-elements.com/astatine.php' },
  86: { url: 'https://images-of-elements.com/radon.jpg', credito: 'Chemical ELements A Virtual Museum, CC BY 3.0  source: https://images-of-elements.com/radon.php' },
  87: { url: 'https://images-of-elements.com/francium.jpg', credito: 'Chemical ELements A Virtual Museum, CC BY 3.0  source: https://images-of-elements.com/francium.jpg' },
  88: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Radium226.jpg', credito: 'grenadier, CC BY 3.0' },
  89: { url: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Actinium_sample_%2831481701837%29.png', credito: 'Oak Ridge National Laboratory, CC BY 2.0' },
  90: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Thorium-1.jpg', credito: 'W. Oelen, CC BY-SA 3.0' },
  91: { url: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Protactinium-233.jpg', credito: 'ENERGY.GOV, Public domain' },
  92: { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/Ames_Process_uranium_biscuit.jpg', credito: 'Unknown authorUnknown author, Public domain' },
  93: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Neptunium2.jpg', credito: 'Los Alamos National Laboratory,, Public domain' },
  94: { url: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Plutonium_ring.jpg', credito: 'Los Alamos National Laboratory, Attribution' },
  95: { url: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Americium_microscope.jpg', credito: 'Bionerd, CC BY 3.0' },
  96: { url: 'https://images-of-elements.com/s/curium-glow.jpg', credito: 'European Union, The Actinide Group, Institute for Transuranium Elements (JRC-ITU), source: https://images-of-elements.com/curium.php' },
  97: { url: 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Berkelium.jpg', credito: 'ORNL, Department of Energy, Public domain' },
  98: { url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Californium.jpg', credito: 'United States Department of Energy (see File:Einsteinium.jpg), Public domain' },
  99: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/55/Einsteinium.jpg', credito: 'Haire, R. G., US Department of Energy.Touched up by Materialscientist at en.wikipedia., Public domain' },
  100: { url: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Ivy_Mike_-_mushroom_cloud.jpg', credito: 'U.S. Department of Energy, Public domain' },
  101: { url: 'https://images-of-elements.com/s/mendelevium.jpg', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/mendelevium.php' },
  102: { url: 'https://images-of-elements.com/nobelium.jpg', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/nobelium.php' },
  103: { url: 'https://images-of-elements.com/lawrencium.jpg', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/lawrencium.php' },
  104: { url: 'https://images-of-elements.com/s/rutherfordium.jpg', credito: 'Image © CERN, Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/rutherfordium.php' },
  105: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/dubnium.php' },
  106: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/seaborgium.php' },
  107: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/bohrium.php' },
  108: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/hassium.php' },
  109: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/meitnerium.php' },
  110: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/darmstadtium.php' },
  111: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/roentgenium.php' },
  112: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/copernicium.php' },
  113: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/nihonium.php' },
  114: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/flerovium.php' },
  115: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/moscovium.php' },
  116: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/livermorium.php' },
  117: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/tenessine.php' },
  118: { url: 'https://images-of-elements.com/s/transactinoid.png', credito: 'Chemical Elements A Virtual Museum under a Creative Commons Attribution 3.0 Unported License, source: https://images-of-elements.com/oganesson.php' },
};
