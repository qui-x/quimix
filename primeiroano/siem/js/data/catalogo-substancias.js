/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: catalogo-substancias.js
   ───────────────────────────────────────────────────────────────
   95 substâncias com dados termodinâmicos EXPERIMENTAIS reais
   (não estimados): temperatura de fusão/ebulição a 1 atm, ponto
   triplo, ponto crítico, entalpia de vaporização e densidades das
   três fases — validados contra NIST WebBook e CRC Handbook.

   Cada substância também traz sua geometria molecular REAL segundo
   a teoria VSEPR (Valence Shell Electron Pair Repulsion): o ângulo
   de ligação (`angle`) é o valor experimental, não uma estimativa
   visual, e as posições dos átomos (`atoms`) são calculadas
   trigonometricamente a partir desse ângulo.

   Campos de cada entrada:
     Tf, Tb        → fusão/ebulição a 1 atm (°C)
     Tt, Pt        → ponto triplo (°C, atm)
     Tc, Pc        → ponto crítico (°C, atm)
     dHvap         → entalpia de vaporização (kJ/mol)
     densSolid/densLiquid/densGas → densidades (kg/m³)
     geometry, angle, lonePairs, polarity → geometria VSEPR
     atoms         → posições 2D dos átomos (calculadas do ângulo real)

   NENHUM valor numérico ou textual foi alterado na refatoração —
   apenas movido de dadossiem.js para cá (que também tinha as cores
   CPK, agora em paleta-cpk.js). O arquivo original usava
   terminadores de linha CRLF (Windows); aqui foram normalizados
   para LF, como todo o resto do projeto — isso não muda nenhum
   dado, é só um detalhe de como as quebras de linha são
   representadas em bytes.
   Depende de: nada.
   Usado por: js/app/app-substancias.js (lista + seleção).
═══════════════════════════════════════════════════════════════ */

'use strict';

const CATALOG = [
  { name:'Água', formula:'H₂O', cat:'Referência', color:'#38bdf8',
    Tf:0, Tb:100, Tt:0.01, Pt:0.00604, Tc:374, Pc:217.7, dHvap:40.7,
    densSolid:917, densLiquid:997, densGas:0.59, anomalyDensity:true, hbond:true,
    geometry:'Angular (bent)', angle:104.5, lonePairs:2, polarity:'Polar (μ=1.85 D)',
    descricao:'Utilizado como solvente universal em processos químicos e biológicos, no resfriamento industrial e na regulação térmica de sistemas naturais e artificiais. Composto químico essencial para a vida, constituído por dois átomos de hidrogênio e um de oxigênio, sendo a substância líquida mais abundante na superfície da Terra.',
    atoms:[
      {el:'O',dx:0,dy:0},{el:'H',dx:-0.8,dy:0.5},{el:'H',dx:0.8,dy:0.5}
    ] },
  { name:'Dióxido de Carbono', formula:'CO₂', cat:'Gases', color:'#fb923c',
    Tf:-56.6, Tb:-78.5, Tt:-56.6, Pt:5.11, Tc:31.1, Pc:72.8, dHvap:25.2,
    densSolid:1562, densLiquid:1101, densGas:1.98, anomalyDensity:false, hbond:false,
    geometry:'Linear', angle:180, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Utilizado em processos de refrigeração e congelamento (como gelo seco), na indústria de bebidas gaseificadas, em extintores de incêndio e como matéria-prima na síntese de produtos químicos. Óxido ácido constituído por um átomo de carbono ligado covalentemente a dois átomos de oxigênio, sendo um gás essencial no ciclo do carbono e no efeito estufa natural da Terra.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'O',dx:-1.2,dy:0},{el:'O',dx:1.2,dy:0}
    ] },
  { name:'Nitrogênio', formula:'N₂', cat:'Gases', color:'#6ee7b7',
    Tf:-210, Tb:-196, Tt:-210.0, Pt:0.123, Tc:-147, Pc:33.5, dHvap:5.57,
    densSolid:1026, densLiquid:808, densGas:1.25, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:0, polarity:'Apolar',
    descricao:'Utilizado na produção de amônia pelo processo Haber-Bosch, na preservação de alimentos (atmosfera modificada), como agente de congelamento criogênico e para criar atmosferas inertes em processos industriais e metalúrgicos. Gás diatômico incolor e inodoro que constitui aproximadamente 78% da atmosfera terrestre, sendo um elemento essencial para a vida por compor proteínas e ácidos nucleicos.',
    atoms:[
      {el:'N',dx:-0.55,dy:0},{el:'N',dx:0.55,dy:0}
    ] },
  { name:'Oxigênio', formula:'O₂', cat:'Gases', color:'#60a5fa',
    Tf:-218.8, Tb:-183, Tt:-218.8, Pt:0.00152, Tc:-118.6, Pc:49.8, dHvap:6.82,
    densSolid:1426, densLiquid:1141, densGas:1.43, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:0, polarity:'Apolar',
    descricao:'Utilizado em processos industriais de alta temperatura (como a fabricação de aço), em oxigenoterapia médica e suporte à vida, e como comburente em reações de combustão e propulsão aeroespacial. Gás diatômico incolor e inodoro essencial para a respiração aeróbica da maioria dos seres vivos, constituindo cerca de 21% da atmosfera terrestre e sendo o elemento mais abundante na crosta terrestre.',
    atoms:[
      {el:'O',dx:-0.6,dy:0},{el:'O',dx:0.6,dy:0}
    ] },
  { name:'Amônia', formula:'NH₃', cat:'Gases', color:'#818cf8',
    Tf:-77.7, Tb:-33.4, Tt:-77.7, Pt:0.0607, Tc:132.4, Pc:111.3, dHvap:23.3,
    densSolid:817, densLiquid:682, densGas:0.73, anomalyDensity:false, hbond:true,
    geometry:'Pirâmide trigonal', angle:107, lonePairs:1, polarity:'Polar (μ=1.47 D)',
    descricao:'Utilizado na fabricação de fertilizantes, na produção de ácido nítrico, como refrigerante industrial e em agentes de limpeza domésticos e industriais. Composto químico gasoso à temperatura ambiente (ou líquido sob pressão) constituído por nitrogênio e hidrogênio, caracterizado por um odor pungente e forte basicidade em solução aquosa.',
    atoms:[
      {el:'N',dx:0,dy:0},{el:'H',dx:-0.8,dy:0.5},{el:'H',dx:0.8,dy:0.5},{el:'H',dx:0,dy:-0.8}
    ] },
  { name:'Metano', formula:'CH₄', cat:'Gases', color:'#6ee7b7',
    Tf:-182.5, Tb:-161.5, Tt:-182.5, Pt:0.116, Tc:-82.6, Pc:45.8, dHvap:8.17,
    densSolid:519, densLiquid:423, densGas:0.66, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica', angle:109.5, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Utilizado como principal componente do gás natural para geração de energia e aquecimento, e como matéria-prima na produção de hidrogênio, metanol e outros produtos químicos. Hidrocarboneto saturado mais simples, constituído por um átomo de carbono e quatro de hidrogênio, sendo um gás incolor, inodoro e altamente inflamável.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'H',dx:0,dy:-1},{el:'H',dx:-0.9,dy:0.3},{el:'H',dx:0.9,dy:0.3},{el:'H',dx:0,dy:0.9}
    ] },
  { name:'Dióxido de Enxofre', formula:'SO₂', cat:'Gases', color:'#fcd34d',
    Tf:-72.7, Tb:-10.1, Tt:-75.5, Pt:0.0157, Tc:157.5, Pc:78.8, dHvap:24.9,
    densSolid:1460, densLiquid:1377, densGas:2.93, anomalyDensity:false, hbond:false,
    geometry:'Angular (bent)', angle:119, lonePairs:1, polarity:'Polar (μ=1.63 D)',
    descricao:'Utilizado na fabricação de ácido sulfúrico, como agente branqueador na indústria de papel e celulose, e como conservante e antioxidante em alimentos e bebidas (como o vinho). Gás incolor, tóxico e não inflamável com um odor pungente e sufocante, sendo um dos principais subprodutos da combustão de combustíveis fósseis contendo enxofre e da atividade vulcânica.',
    atoms:[
      {el:'S',dx:0,dy:0},{el:'O',dx:-1,dy:0.6},{el:'O',dx:1,dy:0.6}
    ] },
  { name:'Hélio', formula:'He', cat:'Gases Nobres', color:'#c4b5fd',
    Tf:-272.2, Tb:-268.9, Tt:-271.4, Pt:0.0497, Tc:-268, Pc:2.24, dHvap:0.083,
    densSolid:187, densLiquid:125, densGas:0.18, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Utilizado em aplicações criogênicas para resfriamento de supercondutores (como em ressonância magnética), em misturas gasosas para mergulho profundo, no enchimento de balões e dirigíveis, e para criar atmosferas inertes na soldagem. Gás nobre incolor, inodoro e insípido, sendo o segundo elemento mais leve e abundante no universo, conhecido por seu ponto de ebulição extremamente baixo.',
    atoms:[
      {el:'He',dx:0,dy:0}
    ] },
  { name:'Mercúrio', formula:'Hg', cat:'Metais', color:'#cbd5e1',
    Tf:-38.8, Tb:356.7, Tt:-38.83, Pt:1.65e-10, Tc:1477, Pc:1698, dHvap:59.1,
    densSolid:14184, densLiquid:13546, densGas:5.43, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Utilizado em termômetros, barômetros, manômetros, lâmpadas fluorescentes, amálgamas dentárias e na extração de ouro. Elemento químico metálico líquido à temperatura ambiente, caracterizado por alta densidade, forte tensão superficial e toxicidade significativa para os seres vivos.',
    atoms:[
      {el:'Hg',dx:0,dy:0}
    ] },
  { name:'Sódio', formula:'Na', cat:'Metais', color:'#fbbf24',
    Tf:97.8, Tb:883, Tt:97.7, Pt:1e-7, Tc:2573, Pc:255, dHvap:97.4,
    densSolid:970, densLiquid:927, densGas:0.97, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal alcalino. Tf=97.8°C. Reage violentamente com água.',
    atoms:[
      {el:'Na',dx:0,dy:0}
    ] },
  { name:'Ferro', formula:'Fe', cat:'Metais', color:'#94a3b8',
    Tf:1538, Tb:2861, Tt:1538, Pt:1e-6, Tc:8227, Pc:825, dHvap:340,
    densSolid:7874, densLiquid:6980, densGas:7.9, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Base da siderurgia. Tf=1538°C. Forno alto para produção de aço.',
    atoms:[
      {el:'Fe',dx:0,dy:0}
    ] },
  { name:'Cloreto de Sódio', formula:'NaCl', cat:'Sais', color:'#fde68a',
    Tf:800.7, Tb:1413, Tt:800.5, Pt:1e-8, Tc:3900, Pc:170, dHvap:171,
    densSolid:2165, densLiquid:1556, densGas:2.2, anomalyDensity:false, hbond:false,
    geometry:'Linear (par iônico)', angle:180, lonePairs:0, polarity:'Iônica (μ=9.0 D)',
    descricao:'Sal de cozinha. Tf=800.7°C, Tb=1465°C. Tempero e conservante milenar.',
    atoms:[
      {el:'Na',dx:-0.9,dy:0},{el:'Cl',dx:0.9,dy:0}
    ] },
  { name:'Sulfeto de Hidrogênio', formula:'H₂S', cat:'Gases', color:'#facc15',
    Tf:-85.5, Tb:-60.3, Tt:-85.5, Pt:0.231, Tc:100.4, Pc:90.1, dHvap:18.7,
    densSolid:1120, densLiquid:993, densGas:1.36, anomalyDensity:false, hbond:false,
    geometry:'Angular (bent)', angle:92.1, lonePairs:2, polarity:'Polar (μ=0.97 D)',
    descricao:'Gás tóxico com odor de ovo podre. Tf=-85.6°C, Tb=-60.3°C.',
    atoms:[
      {el:'S',dx:0,dy:0},{el:'H',dx:-1,dy:0.7},{el:'H',dx:1,dy:0.7}
    ] },
  { name:'Tetracloreto de Carbono', formula:'CCl₄', cat:'Haletos/Solventes', color:'#65a30d',
    Tf:-22.9, Tb:76.7, Tt:-22.6, Pt:0.0123, Tc:283.2, Pc:44.6, dHvap:29.8,
    densSolid:1831, densLiquid:1594, densGas:5.31, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica', angle:109.5, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Tetracloreto de carbono. Tf=-22,9°C, Tb=76,7°C. Solvente e extinguidor antigo. Hepatotóxico.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'Cl',dx:0,dy:-1.2},{el:'Cl',dx:-1.1,dy:0.4},{el:'Cl',dx:1.1,dy:0.4},{el:'Cl',dx:0,dy:1.2}
    ] },
  { name:'Cloro', formula:'Cl₂', cat:'Gases', color:'#bef264',
    Tf:-101.0, Tb:-34.1, Tt:-101.0, Pt:0.0098, Tc:144.0, Pc:76.1, dHvap:20.4,
    densSolid:2030, densLiquid:1562, densGas:2.99, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:0, polarity:'Apolar',
    descricao:'Gás amarelo-esverdeado tóxico. Tb=-34°C. Usado em desinfecção e PVC.',
    atoms:[
      {el:'Cl',dx:-0.9,dy:0},{el:'Cl',dx:0.9,dy:0}
    ] },
  { name:'Flúor', formula:'F₂', cat:'Gases', color:'#90e050',
    Tf:-219.6, Tb:-188.1, Tt:-219.7, Pt:0.252, Tc:-128.8, Pc:51.5, dHvap:6.51,
    densSolid:1700, densLiquid:1505, densGas:1.70, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:0, polarity:'Apolar',
    descricao:'Elemento mais eletronegativo. Tb=-188.1°C. Extremamente reativo.',
    atoms:[
      {el:'F',dx:-0.7,dy:0},{el:'F',dx:0.7,dy:0}
    ] },
  { name:'Bromo', formula:'Br₂', cat:'Minerais', color:'#a62929',
    Tf:-7.2, Tb:58.8, Tt:-7.3, Pt:0.0596, Tc:315, Pc:102, dHvap:30.0,
    densSolid:3360, densLiquid:3119, densGas:7.59, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:0, polarity:'Apolar',
    descricao:'Único não-metal líquido em condições normais. Tf=-7.3°C, Tb=58.8°C. Tóxico.',
    atoms:[
      {el:'Br',dx:-1,dy:0},{el:'Br',dx:1,dy:0}
    ] },
  { name:'Iodo', formula:'I₂', cat:'Minerais', color:'#940094',
    Tf:113.7, Tb:184.4, Tt:113.6, Pt:0.118, Tc:546, Pc:115, dHvap:41.6,
    densSolid:4933, densLiquid:3960, densGas:11.27, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:0, polarity:'Apolar',
    descricao:'Sólido roxo-escuro. Tf=113.7°C, Tb=184.4°C. Sublima facilmente. Antisséptico.',
    atoms:[
      {el:'I',dx:-1.1,dy:0},{el:'I',dx:1.1,dy:0}
    ] },
  { name:'Cloreto de Hidrogênio', formula:'HCl', cat:'Inorgânica', color:'#a3e635',
    Tf:-114.2, Tb:-85.1, Tt:-114.2, Pt:0.226, Tc:51.4, Pc:81.5, dHvap:16.2,
    densSolid:1490, densLiquid:1190, densGas:1.49, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:3, polarity:'Polar (μ=1.08 D)',
    descricao:'Cloreto de hidrogênio. Tf=-114.2°C, Tb=-85.1°C. Gás industrial que forma o ácido clorídrico quando dissolvido em água. Composto inorgânico diatômico covalente de hidrogênio e cloro.',
    atoms:[
      {el:'H',dx:-0.8,dy:0},{el:'Cl',dx:0.8,dy:0}
    ] },
  { name:'Neônio', formula:'Ne', cat:'Gases Nobres', color:'#b3e3f5',
    Tf:-248.6, Tb:-246.1, Tt:-248.6, Pt:0.432, Tc:-228.7, Pc:26.9, dHvap:1.71,
    densSolid:1444, densLiquid:1207, densGas:0.90, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Gás nobre. Tb=-246.1°C. Usado em tubos luminosos e lasers.',
    atoms:[
      {el:'Ne',dx:0,dy:0}
    ] },
  { name:'Argônio', formula:'Ar', cat:'Gases Nobres', color:'#80d1e3',
    Tf:-189.4, Tb:-185.8, Tt:-189.3, Pt:0.690, Tc:-122.4, Pc:48.3, dHvap:6.43,
    densSolid:1620, densLiquid:1395, densGas:1.78, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'3.º gás mais abundante na atmosfera (0,93%). Usado como gás inerte em soldagem.',
    atoms:[
      {el:'Ar',dx:0,dy:0}
    ] },
  { name:'Etanol', formula:'C₂H₅OH', cat:'Álcoois', color:'#c084fc',
    Tf:-114.1, Tb:78.4, Tt:-114.1, Pt:4.3e-7, Tc:241, Pc:62.2, dHvap:38.6,
    densSolid:910, densLiquid:789, densGas:1.59, anomalyDensity:false, hbond:true,
    geometry:'Tetraédrica (no C) + angular (no O)', angle:109.5, lonePairs:2, polarity:'Polar (μ=1.69 D)',
    descricao:'Álcool etílico. Tf=-114.4°C, Tb=78.4°C. Bebidas, combustível e antisséptico.',
    atoms:[
      {el:'C',dx:-1,dy:0},{el:'C',dx:0,dy:0},{el:'O',dx:1,dy:0.5},{el:'H',dx:1.5,dy:0}
    ] },
  { name:'Cobre', formula:'Cu', cat:'Metais', color:'#c88033',
    Tf:1084.6, Tb:2562, Tt:1084.6, Pt:1e-6, Tc:7696, Pc:540, dHvap:300,
    densSolid:8960, densLiquid:8020, densGas:9.0, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Condutor elétrico excelente. Tf=1084.6°C, Tb=2562°C. Fios e moedas.',
    atoms:[
      {el:'Cu',dx:0,dy:0}
    ] },
  { name:'Potássio', formula:'K', cat:'Metais', color:'#8f40d4',
    Tf:63.4, Tb:759, Tt:63.4, Pt:1e-7, Tc:2223, Pc:160, dHvap:79.1,
    densSolid:856, densLiquid:828, densGas:0.86, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal alcalino. Tf=63.4°C, Tb=759°C. Essencial para células vivas.',
    atoms:[
      {el:'K',dx:0,dy:0}
    ] },
  { name:'Isobutano', formula:'C₄H₁₀', cat:'Orgânica', color:'#22d3ee',
    Tf:-159.4, Tb:-11.7, Tt:-159.6, Pt:0.0113, Tc:134.7, Pc:36.3, dHvap:21.3,
    densSolid:741, densLiquid:593, densGas:2.51, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica (no C central)', angle:109.5, lonePairs:0, polarity:'Apolar',
    descricao:'Isobutano. Tf=-159.6°C, Tb=-11.7°C. Utilizado como gás refrigerante (R-600a) e propelente em aerossóis. Hidrocarboneto alcano ramificado composto por quatro átomos de carbono.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'C',dx:-1,dy:0.8},{el:'C',dx:1,dy:0.8},{el:'C',dx:0,dy:-1.2}
    ] },
  { name:'Ciclohexano', formula:'C₆H₁₂', cat:'Orgânica', color:'#5eead4',
    Tf:6.5, Tb:80.7, Tt:6.5, Pt:0.0543, Tc:280.5, Pc:40.7, dHvap:33.0,
    densSolid:870, densLiquid:779, densGas:2.6, anomalyDensity:false, hbond:false,
    geometry:'Hexagonal (anel)', angle:111, lonePairs:0, polarity:'Apolar',
    descricao:'Ciclohexano. Tf=6.5°C, Tb=80.7°C. Solvente apolar amplamente utilizado na produção industrial de nylon. Cicloalcano de seis carbonos que adota preferencialmente a conformação em cadeira.',
    atoms:[
      {el:'C',dx:-1,dy:0.5},{el:'C',dx:0,dy:1},{el:'C',dx:1,dy:0.5},{el:'C',dx:1,dy:-0.5},{el:'C',dx:0,dy:-1},{el:'C',dx:-1,dy:-0.5}
    ] },
  { name:'Cloreto de Metileno', formula:'CH₂Cl₂', cat:'Haletos/Solventes', color:'#bef264',
    Tf:-96.7, Tb:39.6, Tt:-96.7, Pt:0.0013, Tc:237, Pc:60.8, dHvap:28.1,
    densSolid:1366, densLiquid:1325, densGas:3.0, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica', angle:109.5, lonePairs:0, polarity:'Polar (μ=1.60 D)',
    descricao:'Cloreto de metileno. Tf=-96.7°C, Tb=39.6°C. Solvente de baixo ponto de ebulição.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'Cl',dx:-1,dy:0.5},{el:'Cl',dx:1,dy:0.5},{el:'H',dx:0,dy:-1},{el:'H',dx:0,dy:1}
    ] },
  { name:'Propanol', formula:'C₃H₇OH', cat:'Álcoois', color:'#c084fc',
    Tf:-126.2, Tb:97.2, Tt:-126.4, Pt:5e-7, Tc:263.8, Pc:51.7, dHvap:41.4,
    densSolid:850, densLiquid:804, densGas:2.07, anomalyDensity:false, hbond:true,
    geometry:'Tetraédrica (no C) + angular (no O)', angle:109.5, lonePairs:2, polarity:'Polar (μ=1.68 D)',
    descricao:'Álcool propílico. Tf=-126.2°C, Tb=97.2°C. Solvente industrial.',
    atoms:[
      {el:'C',dx:-1.5,dy:0},{el:'C',dx:-0.5,dy:0},{el:'C',dx:0.5,dy:0},{el:'O',dx:1.5,dy:0.5}
    ] },
  { name:'Butanol', formula:'C₄H₉OH', cat:'Álcoois', color:'#d8b4fe',
    Tf:-89.8, Tb:117.7, Tt:-89.8, Pt:1e-7, Tc:289.9, Pc:44.2, dHvap:43.3,
    densSolid:860, densLiquid:810, densGas:2.55, anomalyDensity:false, hbond:true,
    geometry:'Tetraédrica (no C) + angular (no O)', angle:109.5, lonePairs:2, polarity:'Polar (μ=1.66 D)',
    descricao:'Butanol. Tf=-89.8°C, Tb=117.7°C. Solvente e precursor químico.',
    atoms:[
      {el:'C',dx:-2,dy:0},{el:'C',dx:-1,dy:0},{el:'C',dx:0,dy:0},{el:'C',dx:1,dy:0},{el:'O',dx:2,dy:0.5}
    ] },
  { name:'Etilenoglicol', formula:'C₂H₆O₂', cat:'Álcoois', color:'#f0abfc',
    Tf:-12.9, Tb:197.3, Tt:-12.9, Pt:1e-7, Tc:372, Pc:82, dHvap:51.9,
    densSolid:1130, densLiquid:1113, densGas:2.7, anomalyDensity:false, hbond:true,
    geometry:'Tetraédrica (em cada C)', angle:109.5, lonePairs:4, polarity:'Polar (μ=2.28 D)',
    descricao:'Etilenoglicol (etanodiol). Tf=-13°C, Tb=197,3°C. Anticongelante e fluido de freio.',
    atoms:[
      {el:'O',dx:-1.5,dy:0.5},{el:'C',dx:-0.5,dy:0},{el:'C',dx:0.5,dy:0},{el:'O',dx:1.5,dy:0.5}
    ] },
  { name:'Butanona', formula:'C₄H₈O', cat:'Orgânica', color:'#facc15',
    Tf:-86.6, Tb:79.6, Tt:-86.6, Pt:8e-5, Tc:260.0, Pc:41.5, dHvap:31.3,
    densSolid:850, densLiquid:805, densGas:2.41, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (no C carbonílico)', angle:120, lonePairs:2, polarity:'Polar (μ=2.76 D)',
    descricao:'Butanona. Tf=-86°C, Tb=79.6°C. Solvente industrial muito comum, conhecido como MEK, usado em tintas e resinas. Cetona alifática de cadeia curta com quatro átomos de carbono.',
    atoms:[
      {el:'C',dx:-1.5,dy:0},{el:'C',dx:-0.5,dy:0},{el:'C',dx:0.5,dy:0},{el:'C',dx:1.5,dy:0},{el:'O',dx:-0.5,dy:-1}
    ] },
  { name:'Formaldeído', formula:'CH₂O', cat:'Cetonas/Ésteres', color:'#86efac',
    Tf:-92.0, Tb:-19.0, Tt:-92.0, Pt:0.0009, Tc:137.2, Pc:65.9, dHvap:23.3,
    densSolid:1180, densLiquid:815, densGas:1.34, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar', angle:120, lonePairs:2, polarity:'Polar (μ=2.33 D)',
    descricao:'Formaldeído (metanal). Tf=-92°C, Tb=-19,1°C. Conservante biológico e matéria-prima de resinas.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'O',dx:0,dy:-1.2},{el:'H',dx:-0.9,dy:0.6},{el:'H',dx:0.9,dy:0.6}
    ] },
  { name:'Ácido Fórmico', formula:'HCOOH', cat:'Orgânica', color:'#fda4af',
    Tf:8.3, Tb:100.8, Tt:8.3, Pt:0.022, Tc:307.0, Pc:58.1, dHvap:22.7,
    densSolid:1246, densLiquid:1220, densGas:2.13, anomalyDensity:false, hbond:true,
    geometry:'Trigonal planar (no C)', angle:120, lonePairs:2, polarity:'Polar (μ=1.41 D)',
    descricao:'Ácido fórmico. Tf=8.4°C, Tb=100.8°C. Usado como conservante e antibacteriano na agropecuária; presente no veneno de formigas. O ácido carboxílico mais simples, contendo apenas um átomo de carbono.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'O',dx:0,dy:-1},{el:'O',dx:1,dy:0.5},{el:'H',dx:-1,dy:0.5}
    ] },
  { name:'Ácido Propanoico', formula:'C₂H₅COOH', cat:'Orgânica', color:'#fb7185',
    Tf:-20.8, Tb:141.2, Tt:-20.8, Pt:0.0001, Tc:339.0, Pc:53.7, dHvap:43.0,
    densSolid:1010, densLiquid:993, densGas:3.04, anomalyDensity:false, hbond:true,
    geometry:'Trigonal planar (no C carboxílico)', angle:120, lonePairs:2, polarity:'Polar (μ=1.75 D)',
    descricao:'Ácido propanoico. Tf=-20.5°C, Tb=141.1°C. Utilizado na forma de propionatos como conservante inibidor de fungos em alimentos. Ácido carboxílico alifático linear de três átomos de carbono.',
    atoms:[
      {el:'C',dx:-1,dy:0},{el:'C',dx:0,dy:0},{el:'C',dx:1,dy:0},{el:'O',dx:1,dy:-1},{el:'O',dx:2,dy:0.5}
    ] },
  { name:'Tolueno', formula:'C₇H₈', cat:'Aromáticos', color:'#fb923c',
    Tf:-95.0, Tb:110.6, Tt:-95.0, Pt:6e-5, Tc:318.6, Pc:41.1, dHvap:38.0,
    densSolid:990, densLiquid:867, densGas:3.18, anomalyDensity:false, hbond:false,
    geometry:'Hexagonal (anel aromático)', angle:120, lonePairs:0, polarity:'Apolar (fracamente polar)',
    descricao:'Tolueno (metilbenzeno). Tf=-95,1°C, Tb=110,6°C. Solvente de tintas e adesivos.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'C',dx:1,dy:0.5},{el:'C',dx:1,dy:1.5},{el:'C',dx:0,dy:2},{el:'C',dx:-1,dy:1.5},{el:'C',dx:-1,dy:0.5},{el:'C',dx:0,dy:-1}
    ] },
  { name:'Fenol', formula:'C₆H₅OH', cat:'Aromáticos', color:'#fde047',
    Tf:40.5, Tb:181.7, Tt:40.5, Pt:3e-5, Tc:419.0, Pc:61.3, dHvap:45.7,
    densSolid:1130, densLiquid:1070, densGas:3.24, anomalyDensity:false, hbond:true,
    geometry:'Hexagonal (anel) + angular (no O)', angle:120, lonePairs:2, polarity:'Polar (μ=1.45 D)',
    descricao:'Fenol (ácido carbólico). Tf=40.9°C, Tb=181.9°C. Antisséptico e precursor de plásticos.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'C',dx:1,dy:0.5},{el:'C',dx:1,dy:1.5},{el:'C',dx:0,dy:2},{el:'C',dx:-1,dy:1.5},{el:'C',dx:-1,dy:0.5},{el:'O',dx:0,dy:-1}
    ] },
  { name:'Bromometano', formula:'CH₃Br', cat:'Orgânica', color:'#fca5a5',
    Tf:-93.7, Tb:3.6, Tt:-93.7, Pt:0.0073, Tc:194.0, Pc:60.3, dHvap:23.3,
    densSolid:1840, densLiquid:1676, densGas:3.97, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica', angle:109.5, lonePairs:0, polarity:'Polar (μ=1.81 D)',
    descricao:'Bromoetano. Tf=-119°C, Tb=38.4°C. Reagente utilizado em sínteses orgânicas como agente de etilação. Haleto de alquila formado por um grupo etil ligado a um átomo de bromo.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'Br',dx:0,dy:-1.2},{el:'H',dx:-0.9,dy:0.4},{el:'H',dx:0.9,dy:0.4},{el:'H',dx:0,dy:1}
    ] },
  { name:'Tricloroetileno', formula:'C₂HCl₃', cat:'Orgânica', color:'#a3e635',
    Tf:-84.7, Tb:87.2, Tt:-84.7, Pt:0.0009, Tc:298.0, Pc:51.7, dHvap:34.5,
    densSolid:1560, densLiquid:1460, densGas:4.55, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (em cada C)', angle:120, lonePairs:0, polarity:'Polar (μ=0.8 D)',
    descricao:'Tricloroetileno. Tf=-84.8°C, Tb=87.2°C. Solvente industrial não inflamável amplamente usado para desengraxar peças metálicas. Alceno halogenado contendo três átomos de cloro.',
    atoms:[
      {el:'C',dx:-0.6,dy:0},{el:'C',dx:0.6,dy:0},{el:'Cl',dx:-1.5,dy:0.8},{el:'Cl',dx:-1.5,dy:-0.8},{el:'Cl',dx:1.5,dy:0.8}
    ] },
  { name:'Peróxido de Hidrogênio', formula:'H₂O₂', cat:'Inorgânica', color:'#7dd3fc',
    Tf:-0.4, Tb:150.2, Tt:-0.4, Pt:0.0003, Tc:457, Pc:214, dHvap:51.6,
    densSolid:1640, densLiquid:1450, densGas:3.0, anomalyDensity:false, hbond:true,
    geometry:'Não-planar (gauche, O-O-H torcido)', angle:94.8, lonePairs:4, polarity:'Polar (μ=1.57 D)',
    descricao:'Peróxido de hidrogênio. Tf=-0.4°C, Tb=150.2°C. Agente oxidante usado como alvejante e antisséptico (água oxigenada). Composto inorgânico caracterizado por uma ligação simples entre dois átomos de oxigênio.',
    atoms:[
      {el:'O',dx:-0.6,dy:0},{el:'O',dx:0.6,dy:0},{el:'H',dx:-1,dy:-0.8},{el:'H',dx:1,dy:0.8}
    ] },
  { name:'Trióxido de Enxofre', formula:'SO₃', cat:'Inorgânica', color:'#fde68a',
    Tf:16.9, Tb:45.0, Tt:16.9, Pt:0.27, Tc:217.9, Pc:82.1, dHvap:40.7,
    densSolid:1920, densLiquid:1923, densGas:3.6, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar', angle:120, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Trióxido de enxofre. Tf=16.9°C, Tb=44.9°C. Precursor direto na fabricação do ácido sulfúrico em escala industrial. Óxido inorgânico em que o enxofre se encontra no estado de oxidação +6.',
    atoms:[
      {el:'S',dx:0,dy:0},{el:'O',dx:0,dy:-1},{el:'O',dx:-0.86,dy:0.5},{el:'O',dx:0.86,dy:0.5}
    ] },
  { name:'Tetrafluoreto de Carbono', formula:'CF₄', cat:'Inorgânica', color:'#bae6fd',
    Tf:-183.6, Tb:-128.0, Tt:-183.6, Pt:0.1012, Tc:-45.6, Pc:37.4, dHvap:11.9,
    densSolid:1980, densLiquid:1890, densGas:3.78, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica', angle:109.5, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Tetrafluoreto de carbono. Tf=-183.6°C, Tb=-127.8°C. Gás refrigerante (R-14) e utilizado em processos de corrosão por plasma na eletrônica. O fluorocarboneto mais simples, com quatro átomos de flúor ligados a um carbono.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'F',dx:0,dy:-1},{el:'F',dx:-0.9,dy:0.3},{el:'F',dx:0.9,dy:0.3},{el:'F',dx:0,dy:0.9}
    ] },
  { name:'Trifluoreto de Boro', formula:'BF₃', cat:'Inorgânica', color:'#e0f2fe',
    Tf:-126.8, Tb:-100.3, Tt:-127.0, Pt:0.985, Tc:12.3, Pc:49.9, dHvap:19.8,
    densSolid:1900, densLiquid:1574, densGas:2.99, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar', angle:120, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Trifluoreto de boro. Tf=-126.8°C, Tb=-100.3°C. Catalisador ácido de Lewis importante em reações de síntese orgânica. Composto inorgânico gasoso com geometria molecular trigonal plana.',
    atoms:[
      {el:'B',dx:0,dy:0},{el:'F',dx:0,dy:-1},{el:'F',dx:-0.86,dy:0.5},{el:'F',dx:0.86,dy:0.5}
    ] },
  { name:'Pentóxido de Fósforo', formula:'P₄O₁₀', cat:'Inorgânica', color:'#ff8000',
    Tf:340, Tb:360, Tt:300, Pt:1, Tc:850, Pc:50, dHvap:55,
    densSolid:2390, densLiquid:2300, densGas:8.0, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica (estrutura P4O10)', angle:109.5, lonePairs:0, polarity:'Polar',
    descricao:'Pentóxido de fósforo. Tf=340°C, Tb=360°C (sublima). Agente desidratante extremamente potente usado em laboratórios. Anidrido do ácido fosfórico cuja verdadeira estrutura cristalina é P4O10.',
    atoms:[
      {el:'P',dx:0,dy:-0.5},{el:'P',dx:-0.5,dy:0.5},{el:'P',dx:0.5,dy:0.5},{el:'O',dx:0,dy:0}
    ] },
  { name:'Magnésio', formula:'Mg', cat:'Metal', color:'#8aff00',
    Tf:650, Tb:1090, Tt:650, Pt:1e-6, Tc:2832, Pc:300, dHvap:128,
    densSolid:1738, densLiquid:1590, densGas:1.74, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Magnésio. Tf=650°C, Tb=1090°C. Metal estrutural muito leve, essencial para ligas aeronáuticas e fogos de artifício. Metal alcalinoterroso altamente reativo do grupo 2 da tabela periódica.',
    atoms:[
      {el:'Mg',dx:0,dy:0}
    ] },
  { name:'Cálcio', formula:'Ca', cat:'Metal', color:'#3dff00',
    Tf:842, Tb:1484, Tt:842, Pt:1e-6, Tc:3200, Pc:215, dHvap:154.7,
    densSolid:1550, densLiquid:1378, densGas:1.55, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Cálcio. Tf=842°C, Tb=1484°C. Utilizado como agente redutor na extração de outros metais; mineral essencial aos ossos. Metal alcalinoterroso prateado e macio.',
    atoms:[
      {el:'Ca',dx:0,dy:0}
    ] },
  { name:'Zinco', formula:'Zn', cat:'Metais', color:'#7d80b0',
    Tf:419.5, Tb:907, Tt:419.5, Pt:1e-6, Tc:1180, Pc:295, dHvap:115.3,
    densSolid:7140, densLiquid:6570, densGas:7.14, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal de transição. Tf=419.5°C, Tb=907°C. Galvanização e baterias.',
    atoms:[
      {el:'Zn',dx:0,dy:0}
    ] },
  { name:'Alumínio', formula:'Al', cat:'Metais', color:'#bfa6a6',
    Tf:660.3, Tb:2470, Tt:660.3, Pt:1e-6, Tc:6700, Pc:355, dHvap:294,
    densSolid:2700, densLiquid:2375, densGas:2.7, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal mais abundante na crosta. Tf=660.3°C, Tb=2519°C. Leve e resistente.',
    atoms:[
      {el:'Al',dx:0,dy:0}
    ] },
  { name:'Estanho', formula:'Sn', cat:'Metais', color:'#94a3b8',
    Tf:231.9, Tb:2602, Tt:231.9, Pt:1e-6, Tc:5400, Pc:830, dHvap:295.8,
    densSolid:7287, densLiquid:6990, densGas:7.29, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal maleável. Tf=231.9°C. Usado em solda e latas de conserva.',
    atoms:[
      {el:'Sn',dx:0,dy:0}
    ] },
  { name:'Chumbo', formula:'Pb', cat:'Metais', color:'#64748b',
    Tf:327.5, Tb:1749, Tt:327.5, Pt:1e-6, Tc:4979, Pc:1620, dHvap:177.7,
    densSolid:11340, densLiquid:10660, densGas:11.34, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal denso. Tf=327.5°C, Tb=1749°C. Usado em baterias e blindagem.',
    atoms:[
      {el:'Pb',dx:0,dy:0}
    ] },
  { name:'Prata', formula:'Ag', cat:'Metais', color:'#cbd5e1',
    Tf:961.8, Tb:2162, Tt:961.8, Pt:1e-6, Tc:6410, Pc:1410, dHvap:255,
    densSolid:10490, densLiquid:9320, densGas:10.49, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Melhor condutor elétrico puro. Tf=961.8°C, Tb=2162°C. Joias e catálise.',
    atoms:[
      {el:'Ag',dx:0,dy:0}
    ] },
  { name:'Ouro', formula:'Au', cat:'Metais', color:'#fbbf24',
    Tf:1064.2, Tb:2856, Tt:1064.2, Pt:1e-6, Tc:6977, Pc:5100, dHvap:324,
    densSolid:19300, densLiquid:17310, densGas:19.3, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal nobre. Tf=1064.2°C, Tb=2856°C. Inalterável e maleável.',
    atoms:[
      {el:'Au',dx:0,dy:0}
    ] },
  { name:'Cloreto de Cálcio', formula:'CaCl₂', cat:'Sais', color:'#a3e635',
    Tf:772, Tb:1935, Tt:772, Pt:1e-7, Tc:3000, Pc:200, dHvap:175,
    densSolid:2150, densLiquid:2080, densGas:2.2, anomalyDensity:false, hbond:false,
    geometry:'Linear (no Ca)', angle:180, lonePairs:0, polarity:'Iônica',
    descricao:'CaCl₂. Tf=772°C, Tb=1935°C. Desumidificante e degelo de estradas.',
    atoms:[
      {el:'Ca',dx:0,dy:0},{el:'Cl',dx:-1.2,dy:0},{el:'Cl',dx:1.2,dy:0}
    ] },
  { name:'Carbonato de Cálcio', formula:'CaCO₃', cat:'Sal Iônico', color:'#e2e8f0',
    Tf:1339, Tb:1339, Tt:1200, Pt:101, Tc:3000, Pc:300, dHvap:170,
    densSolid:2710, densLiquid:2710, densGas:2.7, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (no CO3)', angle:120, lonePairs:0, polarity:'Iônica',
    descricao:'Carbonato de cálcio. Tf=825°C, Tb=Decompõe-se. Principal componente do calcário e do mármore, amplamente utilizado na fabricação de cimento e como suplemento antiácido. Sal inorgânico formado por um cátion cálcio e um ânion carbonato.',
    atoms:[
      {el:'Ca',dx:-2,dy:0},{el:'C',dx:0,dy:0},{el:'O',dx:0,dy:-1},{el:'O',dx:-0.86,dy:0.5},{el:'O',dx:0.86,dy:0.5}
    ] },
  { name:'Sulfato de Cobre', formula:'CuSO₄', cat:'Sais', color:'#38bdf8',
    Tf:560, Tb:650, Tt:500, Pt:50, Tc:1800, Pc:250, dHvap:120,
    densSolid:3600, densLiquid:3000, densGas:3.6, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica (no SO4)', angle:109.5, lonePairs:0, polarity:'Iônica',
    descricao:'Sulfato de cobre puro (anidro). Tf=200°C, Tb=650°C (decompõe). Fungicida.',
    atoms:[
      {el:'Cu',dx:-2,dy:0},{el:'S',dx:0,dy:0},{el:'O',dx:0,dy:-1},{el:'O',dx:-0.9,dy:0.3},{el:'O',dx:0.9,dy:0.3},{el:'O',dx:0,dy:0.9}
    ] },
  { name:'Etileno', formula:'C₂H₄', cat:'Gases', color:'#86efac',
    Tf:-169.2, Tb:-103.7, Tt:-169.2, Pt:0.0012, Tc:9.2, Pc:50.4, dHvap:13.5,
    densSolid:650, densLiquid:567, densGas:1.18, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (em cada C)', angle:120, lonePairs:0, polarity:'Apolar',
    descricao:'Etileno (eteno). Tf=-169,2°C, Tb=-103,7°C. Hormônio vegetal e monômero do polietileno.',
    atoms:[
      {el:'C',dx:-0.6,dy:0},{el:'C',dx:0.6,dy:0},{el:'H',dx:-1.2,dy:0.8},{el:'H',dx:-1.2,dy:-0.8},{el:'H',dx:1.2,dy:0.8},{el:'H',dx:1.2,dy:-0.8}
    ] },
  { name:'Acetileno', formula:'C₂H₂', cat:'Gases', color:'#fde047',
    Tf:-80.7, Tb:-84.0, Tt:-80.55, Pt:1.27, Tc:35.2, Pc:61.4, dHvap:17.6,
    densSolid:730, densLiquid:613, densGas:1.097, anomalyDensity:false, hbond:false,
    geometry:'Linear', angle:180, lonePairs:0, polarity:'Apolar',
    descricao:'Acetileno (etino). Sublima a -84°C a 1 atm. Usado em maçarico e síntese orgânica.',
    atoms:[
      {el:'C',dx:-0.6,dy:0},{el:'C',dx:0.6,dy:0},{el:'H',dx:-1.5,dy:0},{el:'H',dx:1.5,dy:0}
    ] },
  { name:'Propileno', formula:'C₃H₆', cat:'Orgânica', color:'#fcd34d',
    Tf:-185.2, Tb:-47.6, Tt:-185.2, Pt:8.5e-5, Tc:91.8, Pc:46.0, dHvap:18.4,
    densSolid:700, densLiquid:514, densGas:1.81, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (no C=C)', angle:120, lonePairs:0, polarity:'Apolar (fracamente polar)',
    descricao:'Propileno. Tf=-185.2°C, Tb=-47.6°C. Matéria-prima fundamental para a produção do plástico polipropileno. Alceno simples de três carbonos contendo uma ligação dupla.',
    atoms:[
      {el:'C',dx:-1,dy:0},{el:'C',dx:0,dy:0},{el:'C',dx:1,dy:0}
    ] },
  { name:'Óxido Nitroso', formula:'N₂O', cat:'Inorgânica', color:'#a5f3fc',
    Tf:-90.8, Tb:-88.5, Tt:-90.8, Pt:0.879, Tc:36.4, Pc:72.4, dHvap:16.5,
    densSolid:1226, densLiquid:1226, densGas:1.97, anomalyDensity:false, hbond:false,
    geometry:'Linear', angle:180, lonePairs:1, polarity:'Polar (μ=0.16 D)',
    descricao:'Óxido nitroso. Tf=-90.8°C, Tb=-88.5°C. Conhecido como gás hilariante, é usado como anestésico leve e propelente. Óxido inorgânico de geometria linear com dois átomos de nitrogênio.',
    atoms:[
      {el:'N',dx:-1,dy:0},{el:'N',dx:0,dy:0},{el:'O',dx:1,dy:0}
    ] },
  { name:'Dióxido de Nitrogênio', formula:'NO₂', cat:'Inorgânica', color:'#fb923c',
    Tf:-11.2, Tb:21.2, Tt:-11.2, Pt:0.19, Tc:158.0, Pc:101.3, dHvap:13.9,
    densSolid:1640, densLiquid:1450, densGas:1.88, anomalyDensity:false, hbond:false,
    geometry:'Angular (bent)', angle:134, lonePairs:1, polarity:'Polar (μ=0.32 D)',
    descricao:'Dióxido de nitrogênio. Tf=-11.2°C, Tb=21.2°C. Poluente atmosférico marrom-avermelhado e intermediário na produção de ácido nítrico. Gás paramagnético com estrutura molecular angular.',
    atoms:[
      {el:'N',dx:0,dy:0},{el:'O',dx:-0.8,dy:0.6},{el:'O',dx:0.8,dy:0.6}
    ] },
  { name:'Monóxido de Carbono', formula:'CO', cat:'Inorgânica', color:'#94a3b8',
    Tf:-205.0, Tb:-191.5, Tt:-205.0, Pt:0.1535, Tc:-140.2, Pc:35.0, dHvap:6.04,
    densSolid:929, densLiquid:789, densGas:1.25, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:2, polarity:'Polar (μ=0.11 D)',
    descricao:'Monóxido de carbono. Tf=-205°C, Tb=-191.5°C. Gás tóxico usado como agente redutor crucial na metalurgia do ferro. Molécula inorgânica diatômica com uma ligação tripla entre carbono e oxigênio.',
    atoms:[
      {el:'C',dx:-0.6,dy:0},{el:'O',dx:0.6,dy:0}
    ] },
  { name:'Sulfeto de Carbono', formula:'CS₂', cat:'Inorgânica', color:'#fde68a',
    Tf:-110.8, Tb:46.2, Tt:-110.8, Pt:0.0014, Tc:279.0, Pc:79.0, dHvap:26.7,
    densSolid:1490, densLiquid:1263, densGas:3.4, anomalyDensity:false, hbond:false,
    geometry:'Linear', angle:180, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Sulfeto de carbono. Tf=-111.6°C, Tb=46.2°C. Solvente apolar importante na fabricação de celofane e raiom viscose. Líquido volátil com molécula linear análoga ao dióxido de carbono.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'S',dx:-1.5,dy:0},{el:'S',dx:1.5,dy:0}
    ] },
  { name:'Iodeto de Hidrogênio', formula:'HI', cat:'Inorgânica', color:'#940094',
    Tf:-50.8, Tb:-35.4, Tt:-50.76, Pt:0.0218, Tc:150.7, Pc:83.1, dHvap:19.8,
    densSolid:2850, densLiquid:2850, densGas:5.66, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:3, polarity:'Polar (μ=0.38 D)',
    descricao:'Iodeto de hidrogênio. Tf=-50.8°C, Tb=-35.4°C. Utilizado como poderoso agente redutor e na preparação de ácido iodídrico. Molécula diatômica inorgânica contendo hidrogênio e iodo.',
    atoms:[
      {el:'H',dx:-1,dy:0},{el:'I',dx:1,dy:0}
    ] },
  { name:'Fluoreto de Hidrogênio', formula:'HF', cat:'Inorgânica', color:'#90e050',
    Tf:-83.6, Tb:19.5, Tt:-83.4, Pt:0.0699, Tc:188.2, Pc:64.9, dHvap:25.2,
    densSolid:1660, densLiquid:1000, densGas:0.92, anomalyDensity:false, hbond:true,
    geometry:'Linear (diatômica)', angle:180, lonePairs:3, polarity:'Polar (μ=1.82 D)',
    descricao:'Fluoreto de hidrogênio. Tf=-83.6°C, Tb=19.5°C. Gás ou líquido corrosivo usado para gravar vidros e produzir fluorcarbonos. Molécula inorgânica fortemente unida por ligações de hidrogênio.',
    atoms:[
      {el:'H',dx:-0.8,dy:0},{el:'F',dx:0.8,dy:0}
    ] },
  { name:'Bromocloro', formula:'BrCl', cat:'Inorgânica', color:'#a62929',
    Tf:-66.0, Tb:5.0, Tt:-66.0, Pt:0.16, Tc:215.0, Pc:62.0, dHvap:24.0,
    densSolid:2340, densLiquid:2340, densGas:5.06, anomalyDensity:false, hbond:false,
    geometry:'Linear (diatômica)', angle:180, lonePairs:0, polarity:'Polar (μ=0.52 D)',
    descricao:'Bromoclorometano (Bromocloro). Tf=-88°C, Tb=68°C. Solvente industrial e antigo fluido extintor de incêndios. Haloalcano simples contendo um átomo de bromo e um de cloro.',
    atoms:[
      {el:'Br',dx:-1,dy:0},{el:'Cl',dx:1,dy:0}
    ] },
  { name:'Amônia Líquida (NH4OH ref.)', formula:'NH₄OH', cat:'Inorgânica', color:'#a5b4fc',
    Tf:-57.5, Tb:37.7, Tt:-57.5, Pt:0.01, Tc:155, Pc:40, dHvap:30,
    densSolid:900, densLiquid:880, densGas:1.5, anomalyDensity:false, hbond:true,
    geometry:'Tetraédrica (no N)', angle:109.5, lonePairs:1, polarity:'Polar',
    descricao:'Utilizado na fabricação de fertilizantes nitrogenados, como solvente não aquoso em reações químicas e na indústria de refrigeração e produtos de limpeza. Composto químico constituído por nitrogênio e hidrogênio, apresentando-se como um líquido incolor com odor forte e característico.',
    atoms:[
      {el:'N',dx:-1,dy:0},{el:'O',dx:1,dy:0},{el:'H',dx:1.8,dy:0.5}
    ] },
  { name:'Glicerina', formula:'C₃H₈O₃', cat:'Orgânica', color:'#fbcfe8',
    Tf:17.8, Tb:290.0, Tt:17.8, Pt:1e-6, Tc:726.0, Pc:75.0, dHvap:91.7,
    densSolid:1270, densLiquid:1261, densGas:3.4, anomalyDensity:false, hbond:true,
    geometry:'Tetraédrica (em cada C)', angle:109.5, lonePairs:6, polarity:'Polar (μ=2.68 D)',
    descricao:'Utilizado em formulações cosméticas e farmacêuticas como umectante, agente emoliente e solvente, além de estar presente na produção de alimentos, resinas e explosivos. Álcool trivalente (poliol) viscoso e incolor de origem natural ou sintética, altamente higroscópico.',
    atoms:[
      {el:'C',dx:-1,dy:0},{el:'C',dx:0,dy:0},{el:'C',dx:1,dy:0},{el:'O',dx:-1,dy:1},{el:'O',dx:0,dy:1},{el:'O',dx:1,dy:1}
    ] },
  { name:'Dimetilsulfóxido', formula:'C₂H₆OS', cat:'Orgânica', color:'#c4b5fd',
    Tf:18.5, Tb:189.0, Tt:18.5, Pt:1e-6, Tc:729.0, Pc:56.0, dHvap:52.9,
    densSolid:1130, densLiquid:1100, densGas:3.05, anomalyDensity:false, hbond:false,
    geometry:'Piramidal (no S)', angle:106.7, lonePairs:1, polarity:'Polar (μ=3.96 D)',
    descricao:'Excelente solvente polar aprótico com a capacidade incomum de penetrar tecidos biológicos, amplamente utilizado em farmacologia e síntese orgânica. Composto organossulfurado contendo um grupo sulfóxido no centro, derivado da oxidação do dimetilsulfeto.',
    atoms:[
      {el:'S',dx:0,dy:0},{el:'C',dx:-1,dy:0.8},{el:'C',dx:1,dy:0.8},{el:'O',dx:0,dy:-1}
    ] },
  { name:'Ácido Sulfúrico', formula:'H₂SO₄', cat:'Ácidos/Bases', color:'#fef08a',
    Tf:10.4, Tb:337.0, Tt:10.4, Pt:1e-5, Tc:654.0, Pc:64.0, dHvap:55.0,
    densSolid:1841, densLiquid:1840, densGas:3.4, anomalyDensity:false, hbond:true,
    geometry:'Tetraédrica (no S)', angle:109.5, lonePairs:0, polarity:'Polar (μ=2.72 D)',
    descricao:'Utilizado na fabricação de fertilizantes, refino de petróleo, processamento de minérios e como eletrólito em baterias de chumbo-ácido. Ácido inorgânico diprótico forte e altamente corrosivo, sendo um dos produtos químicos industriais mais produzidos no mundo.',
    atoms:[
      {el:'S',dx:0,dy:0},{el:'O',dx:0,dy:-1},{el:'O',dx:0,dy:1},{el:'O',dx:-1,dy:0},{el:'O',dx:1,dy:0},{el:'H',dx:-1.8,dy:0},{el:'H',dx:1.8,dy:0}
    ] },
  { name:'Ácido Nítrico', formula:'HNO₃', cat:'Ácidos/Bases', color:'#fca5a5',
    Tf:-42.0, Tb:83.0, Tt:-42.0, Pt:0.005, Tc:307.0, Pc:68.9, dHvap:39.1,
    densSolid:1513, densLiquid:1513, densGas:2.18, anomalyDensity:false, hbond:true,
    geometry:'Trigonal planar (no N)', angle:120, lonePairs:0, polarity:'Polar (μ=2.17 D)',
    descricao:'Utilizado na fabricação de fertilizantes, corantes e explosivos, além de ser um forte agente oxidante. Ácido inorgânico monoprótico forte e altamente corrosivo.',
    atoms:[
      {el:'N',dx:0,dy:0},{el:'O',dx:0,dy:-1},{el:'O',dx:-0.86,dy:0.5},{el:'O',dx:0.86,dy:0.5},{el:'H',dx:1.5,dy:0.5}
    ] },
  { name:'Ácido Carbônico', formula:'H₂CO₃', cat:'Inorgânica', color:'#a5f3fc',
    Tf:-100, Tb:-25, Tt:-100, Pt:0.5, Tc:200, Pc:80, dHvap:25,
    densSolid:1230, densLiquid:1100, densGas:1.8, anomalyDensity:false, hbond:true,
    geometry:'Trigonal planar (no C) + angular (nos O)', angle:120, lonePairs:4, polarity:'Polar',
    descricao:'Responsável pela acidez de bebidas gaseificadas e controle do pH sanguíneo. Ácido inorgânico diprótico fraco que existe primariamente em solução aquosa.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'O',dx:0,dy:-1},{el:'O',dx:-0.86,dy:0.5},{el:'O',dx:0.86,dy:0.5},{el:'H',dx:-1.5,dy:0.5},{el:'H',dx:1.5,dy:0.5}
    ] },
  { name:'Lítio', formula:'Li', cat:'Metais', color:'#cc80ff',
    Tf:180.5, Tb:1342.0, Tt:180.5, Pt:1e-7, Tc:2950, Pc:670, dHvap:147.1,
    densSolid:534, densLiquid:512, densGas:0.53, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal alcalino extremamente leve e reativo, amplamente utilizado na fabricação de baterias recarregáveis e em tratamentos farmacêuticos. O elemento metálico mais leve da tabela periódica.',
    atoms:[
      {el:'Li',dx:0,dy:0}
    ] },
  { name:'Bário', formula:'Ba', cat:'Metal', color:'#00c900',
    Tf:727.0, Tb:1845.0, Tt:727.0, Pt:1e-7, Tc:3805, Pc:240, dHvap:142.0,
    densSolid:3510, densLiquid:3338, densGas:3.51, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Utilizado em fluidos de perfuração de poços de petróleo, na fabricação de vidros especiais e em pirotecnia para gerar a cor verde brilhante. Metal alcalinoterroso pesado e altamente reativo.',
    atoms:[
      {el:'Ba',dx:0,dy:0}
    ] },
  { name:'Estrôncio', formula:'Sr', cat:'Metal', color:'#00ff00',
    Tf:777.0, Tb:1382.0, Tt:777.0, Pt:1e-7, Tc:2800, Pc:230, dHvap:137.0,
    densSolid:2640, densLiquid:2375, densGas:2.64, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Utilizado em pirotecnia para conferir a cor vermelha brilhante a fogos de artifício e em ligas metálicas especiais. Metal alcalinoterroso prateado e altamente reativo.',
    atoms:[
      {el:'Sr',dx:0,dy:0}
    ] },
  { name:'Manganês', formula:'Mn', cat:'Metais', color:'#9c7ac7',
    Tf:1246.0, Tb:2061.0, Tt:1246.0, Pt:1e-6, Tc:3500, Pc:500, dHvap:226.0,
    densSolid:7470, densLiquid:5950, densGas:7.47, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal de transição essencial na produção de aços de alta resistência e ligas metálicas, além de atuar como importante cofator enzimático biológico.',
    atoms:[
      {el:'Mn',dx:0,dy:0}
    ] },
  { name:'Cromo', formula:'Cr', cat:'Metais', color:'#8a99c7',
    Tf:1907.0, Tb:2671.0, Tt:1907.0, Pt:1e-6, Tc:4982, Pc:970, dHvap:339.5,
    densSolid:7190, densLiquid:6300, densGas:7.19, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal de transição duro e lustroso, famoso por sua alta resistência à corrosão e por dar o acabamento brilhante ao aço cromado e a revestimentos metálicos.',
    atoms:[
      {el:'Cr',dx:0,dy:0}
    ] },
  { name:'Níquel', formula:'Ni', cat:'Metais', color:'#50d050',
    Tf:1455.0, Tb:2913.0, Tt:1455.0, Pt:1e-6, Tc:5300, Pc:600, dHvap:377.5,
    densSolid:8908, densLiquid:7810, densGas:8.91, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal de transição prateado resistente à corrosão, amplamente utilizado na fabricação de ligas metálicas (como o aço inoxidável), moedas e baterias recarregáveis.',
    atoms:[
      {el:'Ni',dx:0,dy:0}
    ] },
  { name:'Titânio', formula:'Ti', cat:'Metais', color:'#bfc2c7',
    Tf:1668.0, Tb:3287.0, Tt:1668.0, Pt:1e-6, Tc:6700, Pc:850, dHvap:425.0,
    densSolid:4506, densLiquid:4110, densGas:4.51, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico (metálico)', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Metal de transição notável por sua alta resistência mecânica, baixa densidade e excelente resistência à corrosão, sendo amplamente utilizado em implantes biomédicos e na indústria aeroespacial.',
    atoms:[
      {el:'Ti',dx:0,dy:0}
    ] },
  { name:'Criptônio', formula:'Kr', cat:'Gases Nobres', color:'#86efac',
    Tf:-157.4, Tb:-153.4, Tt:-157.4, Pt:0.7298, Tc:-63.8, Pc:54.3, dHvap:9.05,
    densSolid:2826, densLiquid:2413, densGas:3.74, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Gás nobre incolor e inodoro utilizado em iluminação de alta performance, lâmpadas de flash fotográfico e lasers. Elemento químico pertencente ao grupo 18 da tabela periódica.',
    atoms:[
      {el:'Kr',dx:0,dy:0}
    ] },
  { name:'Xenônio', formula:'Xe', cat:'Gases Nobres', color:'#a78bfa',
    Tf:-111.8, Tb:-108.1, Tt:-111.8, Pt:0.805, Tc:16.6, Pc:57.6, dHvap:12.6,
    densSolid:3640, densLiquid:3057, densGas:5.89, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Gás nobre utilizado em lâmpadas de alta intensidade (como faróis de carros), anestésicos e propulsão iônica espacial, famoso por formar compostos estáveis com flúor e oxigênio.',
    atoms:[
      {el:'Xe',dx:0,dy:0}
    ] },
  { name:'Radônio', formula:'Rn', cat:'Gases Nobres', color:'#7c2d92',
    Tf:-71.0, Tb:-61.7, Tt:-71.0, Pt:0.526, Tc:104.0, Pc:62.0, dHvap:18.1,
    densSolid:4400, densLiquid:4400, densGas:9.73, anomalyDensity:false, hbond:false,
    geometry:'Monoatômico', angle:null, lonePairs:0, polarity:'Apolar',
    descricao:'Gás nobre radioativo e incolor gerado pelo decaimento natural do rádio nas rochas e solos. O elemento gasoso mais pesado conhecido na tabela periódica.',
    atoms:[
      {el:'Rn',dx:0,dy:0}
    ] },
  { name:'Hidrazina', formula:'N₂H₄', cat:'Inorgânica', color:'#818cf8',
    Tf:2.0, Tb:113.5, Tt:2.0, Pt:0.0048, Tc:380.0, Pc:147.0, dHvap:41.7,
    densSolid:1010, densLiquid:1021, densGas:2.04, anomalyDensity:false, hbond:true,
    geometry:'Piramidal (em cada N)', angle:106, lonePairs:2, polarity:'Polar (μ=1.85 D)',
    descricao:'Empregada como propelente de foguetes espaciais e potente agente redutor em caldeiras. Composto inorgânico cáustico caracterizado por uma ligação direta nitrogênio-nitrogênio.',
    atoms:[
      {el:'N',dx:-0.6,dy:0},{el:'N',dx:0.6,dy:0},{el:'H',dx:-1,dy:0.8},{el:'H',dx:-1,dy:-0.8},{el:'H',dx:1,dy:0.8},{el:'H',dx:1,dy:-0.8}
    ] },
  { name:'Tetróxido de Dinitrogênio', formula:'N₂O₄', cat:'Inorgânica', color:'#fda4af',
    Tf:-11.2, Tb:21.1, Tt:-11.2, Pt:0.19, Tc:158.0, Pc:100.0, dHvap:38.1,
    densSolid:1640, densLiquid:1450, densGas:2.05, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (em cada N)', angle:120, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Poderoso agente oxidante estocável muito utilizado em propulsão de foguetes. Dímero em equilíbrio com o dióxido de nitrogênio, ligado por uma ponte N-N.',
    atoms:[
      {el:'N',dx:-0.6,dy:0},{el:'N',dx:0.6,dy:0},{el:'O',dx:-1.2,dy:0.8},{el:'O',dx:-1.2,dy:-0.8},{el:'O',dx:1.2,dy:0.8},{el:'O',dx:1.2,dy:-0.8}
    ] },
  { name:'Hexafluoreto de Enxofre', formula:'SF₆', cat:'Inorgânica', color:'#e0f2fe',
    Tf:-50.8, Tb:-63.8, Tt:-50.8, Pt:2.26, Tc:45.5, Pc:37.6, dHvap:16.0,
    densSolid:2510, densLiquid:1880, densGas:6.16, anomalyDensity:false, hbond:false,
    geometry:'Octaédrica', angle:90, lonePairs:0, polarity:'Apolar (simétrica)',
    descricao:'Gás inerte excelente como isolante térmico e elétrico em disjuntores de alta tensão. Molécula inorgânica hipervalente de geometria octaédrica perfeita.',
    atoms:[
      {el:'S',dx:0,dy:0},{el:'F',dx:0,dy:-1.2},{el:'F',dx:0,dy:1.2},{el:'F',dx:-1.2,dy:0},{el:'F',dx:1.2,dy:0},{el:'F',dx:-0.8,dy:0.8},{el:'F',dx:0.8,dy:-0.8}
    ] },
  { name:'Nonano', formula:'C₉H₂₀', cat:'Orgânica', color:'#7dd3fc',
    Tf:-53.5, Tb:150.8, Tt:-53.5, Pt:1e-7, Tc:321.4, Pc:22.9, dHvap:40.5,
    densSolid:730, densLiquid:718, densGas:4.46, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica (em cada C)', angle:109.5, lonePairs:0, polarity:'Apolar',
    descricao:'Componente comum de combustíveis líquidos como o querosene e o óleo diesel. Hidrocarboneto alcano de cadeia linear contendo nove átomos de carbono.',
    atoms:[
      {el:'C',dx:-4,dy:0},{el:'C',dx:-3,dy:0},{el:'C',dx:-2,dy:0},{el:'C',dx:-1,dy:0},{el:'C',dx:0,dy:0},{el:'C',dx:1,dy:0},{el:'C',dx:2,dy:0},{el:'C',dx:3,dy:0},{el:'C',dx:4,dy:0}
    ] },
  { name:'Decano', formula:'C₁₀H₂₂', cat:'Alcanos', color:'#38bdf8',
    Tf:-29.7, Tb:174.1, Tt:-29.7, Pt:1e-7, Tc:344.5, Pc:21.1, dHvap:42.8,
    densSolid:760, densLiquid:730, densGas:4.96, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica (em cada C)', angle:109.5, lonePairs:0, polarity:'Apolar',
    descricao:'Utilizado como solvente, padrão para o índice de octanas e componente de combustíveis fósseis. Hidrocarboneto alcano de cadeia linear contendo dez átomos de carbono.',
    atoms:[
      {el:'C',dx:-4.5,dy:0},{el:'C',dx:-3.5,dy:0},{el:'C',dx:-2.5,dy:0},{el:'C',dx:-1.5,dy:0},{el:'C',dx:-0.5,dy:0},{el:'C',dx:0.5,dy:0},{el:'C',dx:1.5,dy:0},{el:'C',dx:2.5,dy:0},{el:'C',dx:3.5,dy:0},{el:'C',dx:4.5,dy:0}
    ] },
  { name:'Isopreno', formula:'C₅H₈', cat:'Orgânica', color:'#bef264',
    Tf:-146.0, Tb:34.1, Tt:-146.0, Pt:1e-7, Tc:484.0, Pc:38.5, dHvap:25.5,
    densSolid:690, densLiquid:681, densGas:2.35, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (nos C=C)', angle:120, lonePairs:0, polarity:'Apolar (fracamente polar)',
    descricao:'Monômero fundamental utilizado na produção de borracha sintética e natural. Dieno conjugado alifático ramificado com cinco átomos de carbono.',
    atoms:[
      {el:'C',dx:-1.5,dy:0},{el:'C',dx:-0.5,dy:0},{el:'C',dx:0.5,dy:0},{el:'C',dx:1.5,dy:0},{el:'C',dx:-0.5,dy:-1}
    ] },
  { name:'Naftaleno', formula:'C₁₀H₈', cat:'Aromáticos', color:'#fbbf24',
    Tf:80.3, Tb:218.0, Tt:80.2, Pt:9e-4, Tc:475.2, Pc:40.5, dHvap:43.2,
    densSolid:1140, densLiquid:976, densGas:4.42, anomalyDensity:false, hbond:false,
    geometry:'Hexagonal (anéis aromáticos fundidos)', angle:120, lonePairs:0, polarity:'Apolar',
    descricao:'Componente das bolinhas de naftalina. Dois anéis aromáticos fundidos.',
    atoms:[
      {el:'C',dx:-0.5,dy:0.8},{el:'C',dx:0.5,dy:0.8},{el:'C',dx:1.5,dy:0},{el:'C',dx:0.5,dy:-0.8},{el:'C',dx:-0.5,dy:-0.8},{el:'C',dx:-1.5,dy:0}
    ] },
  { name:'Tetraidrofurano', formula:'C₄H₈O (THF)', cat:'Orgânica', color:'#67e8f9',
    Tf:-108.4, Tb:66.0, Tt:-108.4, Pt:6e-6, Tc:267.0, Pc:51.9, dHvap:29.8,
    densSolid:920, densLiquid:889, densGas:2.55, anomalyDensity:false, hbond:false,
    geometry:'Pentagonal (anel, angular no O)', angle:111, lonePairs:2, polarity:'Polar (μ=1.75 D)',
    descricao:'Solvente polar aprótico muito versátil, amplamente utilizado em sínteses orgânicas e na dissolução de polímeros como o PVC. Éter cíclico de cinco membros contendo um átomo de oxigênio.',
    atoms:[
      {el:'C',dx:-0.8,dy:0.5},{el:'C',dx:0.8,dy:0.5},{el:'C',dx:1,dy:-0.5},{el:'O',dx:0,dy:-1},{el:'C',dx:-1,dy:-0.5}
    ] },
  { name:'Acetonitrila', formula:'C₂H₃N', cat:'Orgânica', color:'#a5b4fc',
    Tf:-45.7, Tb:81.6, Tt:-45.7, Pt:8.5e-4, Tc:272.4, Pc:48.3, dHvap:30.0,
    densSolid:850, densLiquid:786, densGas:1.79, anomalyDensity:false, hbond:false,
    geometry:'Linear (no C≡N) + tetraédrica (no C metila)', angle:180, lonePairs:1, polarity:'Polar (μ=3.92 D)',
    descricao:'Solvente polar amplamente utilizado em cromatografia (HPLC). É a nitrila mais simples, com um grupo ciano ligado a um metil.',
    atoms:[
      {el:'C',dx:-1,dy:0},{el:'C',dx:0,dy:0},{el:'N',dx:1.2,dy:0}
    ] },
  { name:'Piridina', formula:'C₅H₅N', cat:'Orgânica', color:'#fda4af',
    Tf:-41.6, Tb:115.3, Tt:-41.6, Pt:1.6e-3, Tc:347.0, Pc:56.3, dHvap:35.1,
    densSolid:990, densLiquid:982, densGas:3.04, anomalyDensity:false, hbond:false,
    geometry:'Hexagonal (anel aromático, N substitui CH)', angle:120, lonePairs:1, polarity:'Polar (μ=2.2 D)',
    descricao:'Solvente e base orgânica com forte odor característico de peixe. Anel heterocíclico aromático contendo um átomo de nitrogênio.',
    atoms:[
      {el:'N',dx:0,dy:1},{el:'C',dx:1,dy:0.5},{el:'C',dx:1,dy:-0.5},{el:'C',dx:0,dy:-1},{el:'C',dx:-1,dy:-0.5},{el:'C',dx:-1,dy:0.5}
    ] },
  { name:'Dimetilformamida', formula:'C₃H₇NO', cat:'Orgânica', color:'#c4b5fd',
    Tf:-60.5, Tb:153.0, Tt:-60.5, Pt:1e-6, Tc:649.0, Pc:44.3, dHvap:46.9,
    densSolid:960, densLiquid:944, densGas:2.6, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (no N e C carbonílico)', angle:120, lonePairs:1, polarity:'Polar (μ=3.82 D)',
    descricao:'Solvente polar aprótico muito comum em sínteses orgânicas e plásticos. Amida derivada do ácido fórmico e da dimetilamina.',
    atoms:[
      {el:'N',dx:0,dy:0},{el:'C',dx:-1,dy:0.8},{el:'C',dx:-1,dy:-0.8},{el:'C',dx:1,dy:0},{el:'O',dx:1.8,dy:0.8}
    ] },
  { name:'Acetato de Metila', formula:'C₃H₆O₂', cat:'Orgânica', color:'#fde68a',
    Tf:-98.0, Tb:56.9, Tt:-98.0, Pt:1e-6, Tc:233.4, Pc:47.5, dHvap:30.3,
    densSolid:960, densLiquid:932, densGas:2.55, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (no C carbonílico)', angle:120, lonePairs:2, polarity:'Polar (μ=1.72 D)',
    descricao:'Solvente volátil de secagem rápida usado em colas, tintas e removedores. Éster metílico de cadeia curta derivado do ácido acético.',
    atoms:[
      {el:'C',dx:-1.5,dy:0},{el:'C',dx:-0.5,dy:0},{el:'O',dx:-0.5,dy:-1},{el:'O',dx:0.5,dy:0.5},{el:'C',dx:1.5,dy:0}
    ] },
  { name:'Anidrido Acético', formula:'C₄H₆O₃', cat:'Orgânica', color:'#fcd34d',
    Tf:-73.1, Tb:139.0, Tt:-73.1, Pt:1e-6, Tc:606.0, Pc:46.0, dHvap:41.5,
    densSolid:1100, densLiquid:1082, densGas:3.5, anomalyDensity:false, hbond:false,
    geometry:'Trigonal planar (em cada C carbonílico)', angle:120, lonePairs:4, polarity:'Polar (μ=2.8 D)',
    descricao:'Agente de acetilação usado na produção de aspirina e acetato de celulose. Anidrido de ácido carboxílico formado por duas moléculas de ácido acético.',
    atoms:[
      {el:'C',dx:-2,dy:0},{el:'C',dx:-1,dy:0},{el:'O',dx:-1,dy:-1},{el:'O',dx:0,dy:0.5},{el:'C',dx:1,dy:0},{el:'O',dx:1,dy:-1},{el:'C',dx:2,dy:0}
    ] },
  { name:'Difluorometano (R-32)', formula:'CH₂F₂', cat:'Orgânica', color:'#bae6fd',
    Tf:-136.0, Tb:-51.7, Tt:-136.0, Pt:0.05, Tc:78.1, Pc:58.0, dHvap:20.0,
    densSolid:1100, densLiquid:961, densGas:2.28, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica', angle:109.5, lonePairs:0, polarity:'Polar (μ=1.98 D)',
    descricao:'Gás refrigerante moderno utilizado em ares-condicionados. Composto orgânico halogenado derivado do metano com dois átomos de flúor.',
    atoms:[
      {el:'C',dx:0,dy:0},{el:'F',dx:-1,dy:0.5},{el:'F',dx:1,dy:0.5},{el:'H',dx:0,dy:-1},{el:'H',dx:0,dy:1}
    ] },
  { name:'Dióxido de Silício (quartzo)', formula:'SiO₂', cat:'Inorgânica', color:'#daa520',
    Tf:1713.0, Tb:2230.0, Tt:1700.0, Pt:1e-3, Tc:5000, Pc:1800, dHvap:230.0,
    densSolid:2650, densLiquid:2200, densGas:2.6, anomalyDensity:false, hbond:false,
    geometry:'Tetraédrica (rede estendida, simplificada)', angle:109.5, lonePairs:0, polarity:'Apolar (rede covalente)',
    descricao:'Principal componente da areia e matéria-prima fundamental para vidros. Estrutura de rede covalente tridimensional formada por tetraedros de sílica.',
    atoms:[
      {el:'Si',dx:0,dy:0},{el:'O',dx:0,dy:-0.95},{el:'O',dx:0.82,dy:0.42},{el:'O',dx:-0.82,dy:0.42},{el:'O',dx:0,dy:0.95}
    ] }
 
]

window.CATALOG = CATALOG;
