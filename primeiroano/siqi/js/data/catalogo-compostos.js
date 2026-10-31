/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: catalogo-compostos.js
   ───────────────────────────────────────────────────────────────
   O catálogo principal: 100 compostos inorgânicos com fórmula, nome
   IUPAC, função, propriedades físicas medidas (massa, Tf, Tb,
   densidade, solubilidade, pH), nomenclatura, geometria/ligação,
   equação de ionização/dissociação, reação modelo, estrutura de
   Lewis, uso principal e curiosidade. 14 compostos prioritários
   também trazem os campos `classificacoes` e `regra`, usados pelos
   módulos 2 (Construtor) e 1 (Nomenclatura) respectivamente.
   NENHUM dado original foi alterado — apenas relocado.
   FONTE GERAL DESTE CATÁLOGO (dadossiqi.js original): NIST WebBook,
   CRC Handbook, Toda Matéria, InfoEscola, Manual da Química,
   Infopédia, Scientia, Wikipédia (pt) — valores verificados em
   múltiplas fontes. Dados dos módulos 2 (Construtor) e 3 (Redox):
   IUPAC Red Book 2005; Brown, LeMay & Bursten (2012) "Chemistry: The
   Central Science", 12ª ed.; Zumdahl & Zumdahl (2009) "Chemistry",
   8ª ed. BNCC: EF09CI05 e EF09CI07.
   Depende de: nada.
   Usado por: js/core/dados-adapter.js (converte para o dicionário
              COMPOSTOS usado pelo resto do app).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   CATÁLOGO PRINCIPAL
   Tf / Tb em °C (1 atm), densidade em g/cm³ (25 °C quando disponível)
═══════════════════════════════════════════════════════════════ */
var CATALOGO_SIQI = [

  /* ────────────────────────────────────────────────────────────
     ÁCIDOS
  ──────────────────────────────────────────────────────────── */
  {
    id: 'h2so4',
    formula: 'H₂SO₄',
    formulaId: 'H2SO4',
    nome: 'Ácido Sulfúrico',
    funcao: 'acido',
    categoria: 'Ácidos Fortes',

    /* Propriedades físicas — Fonte: Toda Matéria / Wikipédia pt */
    massa:      '98,08 g/mol',
    Tf:         10.4,          /* °C — puro */
    Tb:         337,           /* °C — puro */
    densidade:  '1,84 g/cm³',
    solubilidade: 'Miscível em água em qualquer proporção (exotérmico)',
    ph:         '< 1 (concentrado); ~1 a 2,5 mol·L⁻¹',

    /* Classificação */
    nomenclatura: 'Ácido sulfúrico (IUPAC: ácido tetraoxossulfúrico(VI))',
    badges: ['forte', 'diprótido', 'oxidante', 'higroscópico'],
    geometria: 'Tetraédrica distorcida (C₂ᵥ)',
    ligacao: 'Covalente polar; 2 ligações S=O e 2 ligações S–OH',

    /* Equações */
    equacao: 'H₂SO₄(aq) → 2 H⁺(aq) + SO₄²⁻(aq)',
    reacao:
      'Neutralização com NaOH:\n' +
      'H₂SO₄(aq) + 2 NaOH(aq) → Na₂SO₄(aq) + 2 H₂O(l)\n\n' +
      'Reação com metal (Zn):\n' +
      'Zn(s) + H₂SO₄(dil.) → ZnSO₄(aq) + H₂(g)',

    /* Diagrama Lewis simplificado */
    lewis: 'acido_oxigenado',

    /* Textos pedagógicos */
    uso: 'Fabricação de fertilizantes fosfatados (~50% da produção mundial), baterias de chumbo-ácido, refino de petróleo, síntese de outros ácidos',
    curiosidade:
      'O H₂SO₄ é o produto químico industrial mais produzido no mundo — sua ' +
      'produção anual supera 200 milhões de toneladas. É tão higroscópico que ' +
      'carboniza sacarose instantaneamente por desidratação: C₁₂H₂₂O₁₁ → 12 C + 11 H₂O. ' +
      'Sempre adicione o ácido à água, nunca o contrário — a diluição libera até 95 kJ/mol.',
    descricao:
      'Líquido viscoso, incolor e inodoro. Ácido forte dibásico que se ioniza ' +
      'completamente na 1ª etapa e ~10% na 2ª. Em altas concentrações age como ' +
      'desidratante e oxidante. P.F. = 10,4 °C; P.E. = 337 °C; d = 1,84 g/cm³.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=10,4°C / Tb=337°C -> líquido a 25°C (regra: Tf<25<Tb). Geometria tetraédrica distorcida C2v já descrita no campo geometria.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'liquido',
      tipoLigacao: 'covalente',
      polaridade: 'polar',
      geometria: 'tetraedrica',
    },
    regra: {
      tipo: 'ácido oxigenado',
      descricao: 'Derivado do ânion sulfato (SO₄²⁻). O enxofre está no NOX máximo (+6), por isso recebe o sufixo tradicional -ico.',
      padrao: 'NOX máximo do elemento -> ácido [elemento]ico; nomenclatura sistemática usa prefixo tetraoxo- + NOX em algarismo romano',
      exemplo: 'SO₄²⁻ (sulfato, S⁺⁶) → H₂SO₄ (ácido sulfúrico / ácido tetraoxossulfúrico(VI))',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.2; Brown et al. (2012) Cap. 2.8',
    },
  },

  {
    id: 'hcl',
    formula: 'HCl',
    formulaId: 'HCl',
    nome: 'Ácido Clorídrico',
    funcao: 'acido',
    categoria: 'Ácidos Fortes',

    /* Fonte: Scientia / Wikipédia pt / CRC Handbook */
    massa:      '36,46 g/mol',
    Tf:         -114.2,        /* °C — HCl gás puro */
    Tb:         -85.1,         /* °C — HCl gás puro; solução 38%: Tb ≈ 48 °C */
    densidade:  '1,19 g/cm³ (solução 37–38%)',
    solubilidade: '72 g/100 mL a 20 °C; miscível em todas proporções',
    ph:         '< 1 (concentrado); ~0,1 a 1,0 mol·L⁻¹',

    nomenclatura: 'Ácido clorídrico / ácido muriático (IUPAC: cloreto de hidrogênio)',
    badges: ['forte', 'monoprótico', 'haloidro', 'fumegante'],
    geometria: 'Linear (diatômica)',
    ligacao: 'Covalente polar; μ = 1,08 D',

    equacao: 'HCl(g) → H⁺(aq) + Cl⁻(aq)',
    reacao:
      'Neutralização total:\n' +
      'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)\n\n' +
      'Reação com metal ativo:\n' +
      'Zn(s) + 2 HCl(aq) → ZnCl₂(aq) + H₂(g)',

    lewis: 'acido_haloidro',

    uso: 'Decapagem de metais, limpeza industrial, síntese orgânica, ajuste de pH, produção de cloreto de polivinila (PVC)',
    curiosidade:
      'O suco gástrico humano contém HCl a ~0,5% (pH 1,5–3,5). ' +
      'Misturado com HNO₃ na proporção 3:1 (v/v), forma a água-régia — ' +
      'única mistura capaz de dissolver ouro e platina. O HCl concentrado ' +
      'libera névoas brancas de cloreto de amônio ao contato com NH₃ do ar.',
    descricao:
      'Gás incolor de odor pungente; em solução aquosa forma o ácido clorídrico. ' +
      'Ácido forte monoprótico, ionização praticamente completa (~99,9%). ' +
      'Gás puro: P.F. = −114,2 °C; P.E. = −85,1 °C. Solução 37%: d ≈ 1,19 g/cm³.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=-114,2°C / Tb=-85,1°C -> gasoso a 25°C (regra: Tb<25). Geometria linear diatômica já descrita no campo geometria.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'gas',
      tipoLigacao: 'covalente',
      polaridade: 'polar',
      geometria: 'linear',
    },
    regra: {
      tipo: 'ácido binário (hidrácido)',
      descricao: 'Formado por H + halogênio, sem oxigênio. O nome sistemático do composto molecular puro é cloreto de hidrogênio; em solução aquosa recebe o nome de ácido.',
      padrao: 'H + halogênio/calcogênio (sem O) → ácido [elemento]ídrico',
      exemplo: 'H + Cl → HCl(g) = cloreto de hidrogênio; em água: ácido clorídrico',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.1',
    },
  },

  {
    id: 'hno3',
    formula: 'HNO₃',
    formulaId: 'HNO3',
    nome: 'Ácido Nítrico',
    funcao: 'acido',
    categoria: 'Ácidos Fortes',

    /* Fonte: NIST WebBook, CRC */
    massa:      '63,01 g/mol',
    Tf:         -41.6,         /* °C */
    Tb:         83,            /* °C — puro (decompõe-se parcialmente) */
    densidade:  '1,51 g/cm³ (puro)',
    solubilidade: 'Miscível em água em qualquer proporção',
    ph:         '< 1 (concentrado)',

    nomenclatura: 'Ácido nítrico (IUPAC: ácido trioxonírico(V))',
    badges: ['forte', 'monoprótico', 'oxidante', 'corrosivo'],
    geometria: 'Planar (C_s)',
    ligacao: 'Covalente; estrutura de ressonância com dupla ligação N=O deslocalizada',

    equacao: 'HNO₃(aq) → H⁺(aq) + NO₃⁻(aq)',
    reacao:
      'Neutralização:\n' +
      'HNO₃(aq) + KOH(aq) → KNO₃(aq) + H₂O(l)\n\n' +
      'Reação com metal (Cu, diluído):\n' +
      '8 Cu(s) + ..HNO₃(dil.) → 3 Cu(NO₃)₂ + 2 NO(g) + 4 H₂O',

    lewis: 'acido_oxigenado',

    uso: 'Fabricação de explosivos (TNT, nitroglicerina), fertilizantes nitrogenados (nitrato de amônio), síntese de corantes e fármacos',
    curiosidade:
      'Água-régia = 3 vol HCl + 1 vol HNO₃. O HNO₃ oxida o metal e o HCl ' +
      'complexa o cátion gerado, impedindo a reprecipitação. O produto final ' +
      'para ouro é [AuCl₄]⁻. O ácido nítrico fumegante (>86%) tem cor ' +
      'amarela a marrom por acúmulo de NO₂.',
    descricao:
      'Líquido incolor a amarelado, forte ácido oxidante. Ionização completa ' +
      'em solução diluída. Decompõe-se à luz UV liberando NO₂ (gás marrom). ' +
      'P.F. = −41,6 °C; P.E. = 83 °C; d = 1,51 g/cm³ (puro).',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=-41,6°C / Tb=83°C -> líquido a 25°C. Geometria planar (C_s) com N central em arranjo trigonal (ressonância N=O) já descrita.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'liquido',
      tipoLigacao: 'covalente',
      polaridade: 'polar',
      geometria: 'trigonal',
    },
    regra: {
      tipo: 'ácido oxigenado',
      descricao: 'Derivado do ânion nitrato (NO₃⁻), com N no NOX máximo (+5).',
      padrao: 'NOX máximo do elemento -> sufixo -ico',
      exemplo: 'NO₃⁻ (nitrato, N⁺⁵) → HNO₃ (ácido nítrico)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.2; Brown et al. (2012) Cap. 2.8',
    },
  },

  {
    id: 'h2co3',
    formula: 'H₂CO₃',
    formulaId: 'H2CO3',
    nome: 'Ácido Carbônico',
    funcao: 'acido',
    categoria: 'Ácidos Fracos',

    /* Fonte: CRC Handbook — instável, dados da solução */
    massa:      '62,02 g/mol',
    Tf:         null,          /* Instável — decompõe antes de fundir */
    Tb:         null,
    densidade:  '~1,0 g/cm³ (solução aquosa)',
    solubilidade: 'Existe apenas em solução aquosa; CO₂(aq) ⇌ H₂CO₃',
    ph:         '3,7–4,0 (solução saturada de CO₂ a 25 °C)',

    nomenclatura: 'Ácido carbônico (IUPAC: ácido dioxocarbônico)',
    badges: ['fraco', 'diprótido', 'instável', 'volátil'],
    geometria: 'Planar (C₂ᵥ)',
    ligacao: 'Covalente; Ka₁ = 4,3×10⁻⁷; Ka₂ = 4,7×10⁻¹¹',

    equacao: 'H₂CO₃(aq) ⇌ H⁺(aq) + HCO₃⁻(aq)   (Ka₁ = 4,3×10⁻⁷)',
    reacao:
      'Formação a partir de CO₂:\n' +
      'CO₂(g) + H₂O(l) ⇌ H₂CO₃(aq)\n\n' +
      'Neutralização:\n' +
      'H₂CO₃(aq) + 2 NaOH(aq) → Na₂CO₃(aq) + 2 H₂O(l)',

    lewis: 'acido_oxigenado',

    uso: 'Bebidas carbonatadas (CO₂ sob pressão), regulação do pH sanguíneo (tampão bicarbonato), formação de estalactites e estalagmites em cavernas',
    curiosidade:
      'O H₂CO₃ é tão instável que menos de 0,3% do CO₂ dissolvido se converte ' +
      'nele. Por isso refrigerantes perdem gás ao serem abertos — o equilíbrio se ' +
      'desloca para CO₂(g). No sangue humano, a enzima anidrase carbônica acelera ' +
      'essa reação 10 milhões de vezes para garantir o transporte de CO₂.',
    descricao:
      'Ácido fraco dibásico, existe somente em solução aquosa. Forma-se pela ' +
      'dissolução de CO₂ em água. Ka₁ = 4,3×10⁻⁷; Ka₂ = 4,7×10⁻¹¹. ' +
      'Instável; decompõe-se rapidamente em CO₂ e H₂O.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf/Tb=null no catálogo (existe só em solução aquosa) -> tratado como líquido/aquoso, consistente com o rótulo "Aquoso / Instável" já usado pelo cálculo de estado em scriptsiqi.js. Geometria planar C2v (C central trigonal) já descrita.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'liquido',
      tipoLigacao: 'covalente',
      polaridade: 'polar',
      geometria: 'trigonal',
    },
    regra: {
      tipo: 'ácido oxigenado',
      descricao: 'Derivado do ânion carbonato (CO₃²⁻). Existe apenas em equilíbrio com CO₂ dissolvido; não é isolável puro.',
      padrao: 'CO₃²⁻ (carbonato) → H₂CO₃ (ácido carbônico)',
      exemplo: 'CO₂(g) + H₂O(l) ⇌ H₂CO₃(aq)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.2',
    },
  },

  /* ────────────────────────────────────────────────────────────
     BASES
  ──────────────────────────────────────────────────────────── */
  {
    id: 'naoh',
    formula: 'NaOH',
    formulaId: 'NaOH',
    nome: 'Hidróxido de Sódio',
    funcao: 'base',
    categoria: 'Bases Fortes',

    /* Fonte: Toda Matéria, Infopédia, InfoEscola, CRC */
    massa:      '40,00 g/mol',
    Tf:         318,           /* °C */
    Tb:         1388,          /* °C */
    densidade:  '2,13 g/cm³ (sólido)',
    solubilidade: '111 g/100 mL a 20 °C; dissolução muito exotérmica (~44 kJ/mol)',
    ph:         '> 13 (solução 1 mol·L⁻¹)',

    nomenclatura: 'Hidróxido de sódio / soda cáustica (IUPAC: hidróxido de sódio)',
    badges: ['forte', 'monovalente', 'corrosivo', 'higroscópico'],
    geometria: 'Linear (par iônico em solução)',
    ligacao: 'Iônica; Na⁺···OH⁻',

    equacao: 'NaOH(s) → Na⁺(aq) + OH⁻(aq)',
    reacao:
      'Neutralização:\n' +
      'NaOH(aq) + HCl(aq) → NaCl(aq) + H₂O(l)\n\n' +
      'Saponificação (triglicerídeo + NaOH → sabão + glicerol):\n' +
      'RCOOCH₂... + 3 NaOH → 3 RCOONa + C₃H₈O₃',

    lewis: 'base_forte',

    uso: 'Fabricação de sabão (saponificação), papel (processo Kraft), alumina da bauxita, desentupidores domésticos, ajuste de pH industrial',
    curiosidade:
      '"Cáustico" vem do grego kaustos — que queima. O NaOH destrói tecidos ' +
      'orgânicos por hidrólise de proteínas e saponificação de gorduras. ' +
      'É produzido industrialmente por eletrólise da salmoura (processo cloroálcali), ' +
      'gerando simultaneamente Cl₂ e H₂. Absorve CO₂ do ar formando Na₂CO₃ na superfície.',
    descricao:
      'Sólido branco cristalino, higroscópico. Base forte monovalente, ' +
      'dissociação completa em solução. ' +
      'P.F. = 318 °C; P.E. = 1388 °C; d = 2,13 g/cm³.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=318°C>25 -> sólido a 25°C. Ligação iônica Na+/OH- já descrita (retículo cristalino, sem geometria molecular VSEPR aplicável).
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'solido',
      tipoLigacao: 'ionico',
      polaridade: 'polar',
      geometria: 'reticular',
    },
    regra: {
      tipo: 'base (hidróxido)',
      descricao: 'Cátion metálico + ânion hidróxido (OH⁻).',
      padrao: '[Metal] + OH⁻ → hidróxido de [metal]',
      exemplo: 'Na⁺ + OH⁻ → NaOH (hidróxido de sódio)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.3',
    },
  },

  {
    id: 'caoh2',
    formula: 'Ca(OH)₂',
    formulaId: 'Ca(OH)2',
    nome: 'Hidróxido de Cálcio',
    funcao: 'base',
    categoria: 'Bases Fortes',

    /* Fonte: InfoEscola, CRC */
    massa:      '74,09 g/mol',
    Tf:         580,           /* °C — decompõe-se em CaO + H₂O */
    Tb:         null,          /* decompõe antes de ebulir */
    densidade:  '2,24 g/cm³ (sólido)',
    solubilidade: '1,73 g/L a 20 °C; 1,2 g/L a 25 °C (solubilidade diminui com temperatura)',
    ph:         '12,4–12,8 (solução saturada)',

    nomenclatura: 'Hidróxido de cálcio / cal hidratada / cal extinta (IUPAC: dihidróxido de cálcio)',
    badges: ['forte', 'divalente', 'pouco solúvel', 'construção'],
    geometria: 'Iônico (retículo hexagonal)',
    ligacao: 'Iônica; Ca²⁺ e 2 OH⁻',

    equacao: 'Ca(OH)₂(s) ⇌ Ca²⁺(aq) + 2 OH⁻(aq)   (Kps = 4,7×10⁻⁶)',
    reacao:
      'Neutralização com H₂SO₄:\n' +
      'Ca(OH)₂(aq) + H₂SO₄(aq) → CaSO₄↓(s) + 2 H₂O(l)\n\n' +
      'Carbonatação (reação com CO₂):\n' +
      'Ca(OH)₂(aq) + CO₂(g) → CaCO₃↓(s) + H₂O(l)',

    lewis: 'base_forte',

    uso: 'Construção civil (argamassa, cimento), tratamento de água e efluentes, correção de solo ácido, fabricação de açúcar (clarificação)',
    curiosidade:
      'A reação CaO + H₂O → Ca(OH)₂ libera ΔH = −63,7 kJ/mol — calor ' +
      'suficiente para elevar a temperatura da mistura a ~150 °C. ' +
      'A "água de cal" (solução saturada de Ca(OH)₂) fica leitosa ao soprar ' +
      'ar: o CO₂ expirado precipita CaCO₃ branco — teste clássico de CO₂ em laboratório.',
    descricao:
      'Sólido branco em pó ou pasta. Base forte divalente, pouco solúvel. ' +
      'Obtida pela hidratação do CaO (cal viva). ' +
      'P.F. = 580 °C (decomp.); d = 2,24 g/cm³; pH(sat.) = 12,4.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=580°C>25 -> sólido a 25°C. Retículo hexagonal iônico já descrito.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'solido',
      tipoLigacao: 'ionico',
      polaridade: 'polar',
      geometria: 'reticular',
    },
    regra: {
      tipo: 'base (hidróxido)',
      descricao: 'Cátion Ca²⁺ (carga +2) exige 2 OH⁻ para neutralidade elétrica — prefixo di- indica as 2 hidroxilas.',
      padrao: '[Metal]²⁺ + 2 OH⁻ → hidróxido de [metal] (di-hidróxido, IUPAC)',
      exemplo: 'Ca²⁺ + 2 OH⁻ → Ca(OH)₂ (hidróxido de cálcio)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.3',
    },
  },

  {
    id: 'nh3',
    formula: 'NH₃',
    formulaId: 'NH3',
    nome: 'Amônia',
    funcao: 'base',
    categoria: 'Bases Fracas',

    /* Fonte: CRC Handbook / NIST */
    massa:      '17,03 g/mol',
    Tf:         -77.7,         /* °C */
    Tb:         -33.4,         /* °C */
    densidade:  '0,73 kg/m³ (gás, 0 °C); 682 kg/m³ (líquido, −33 °C)',
    solubilidade: '89,9 g/100 mL a 0 °C; 31,1 g/100 mL a 25 °C (altamente solúvel)',
    ph:         '11,6 (solução 1 mol·L⁻¹)',

    nomenclatura: 'Amônia / hidróxido de amônio em solução (IUPAC: azano)',
    badges: ['fraca', 'polar', 'ligação H', 'refrigerante'],
    geometria: 'Pirâmide trigonal (C₃ᵥ); ângulo H–N–H = 107°',
    ligacao: 'Covalente polar; μ = 1,47 D; par isolado no N',

    equacao: 'NH₃(aq) + H₂O(l) ⇌ NH₄⁺(aq) + OH⁻(aq)   (Kb = 1,8×10⁻⁵)',
    reacao:
      'Com ácido forte:\n' +
      'NH₃(g) + HCl(g) → NH₄Cl(s)  (névoa branca)\n\n' +
      'Reação com H₂SO₄:\n' +
      '2 NH₃(aq) + H₂SO₄(aq) → (NH₄)₂SO₄(aq)',

    lewis: 'base_fraca',

    uso: 'Processo Haber-Bosch (síntese de fertilizantes nitrogenados), refrigeração industrial, limpadores domésticos, síntese de nylon e plásticos',
    curiosidade:
      'O processo Haber-Bosch (N₂ + 3H₂ ⇌ 2NH₃) é considerado a síntese ' +
      'química mais importante do séc. XX — sem ele não haveria fertilizantes ' +
      'suficientes para alimentar a população atual. Estima-se que 50% do ' +
      'nitrogênio no corpo humano passou pelo processo Haber-Bosch.',
    descricao:
      'Gás incolor de odor pungente característico. Base fraca molecular. ' +
      'Par isolado no N captura H⁺ (base de Brønsted). ' +
      'P.F. = −77,7 °C; P.E. = −33,4 °C; Kb = 1,8×10⁻⁵.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=-77,7°C / Tb=-33,4°C -> gasoso a 25°C. Pirâmide trigonal (C3v), ângulo H-N-H=107° já descrita.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'gas',
      tipoLigacao: 'covalente',
      polaridade: 'polar',
      geometria: 'piramidal',
    },
    regra: {
      tipo: 'base molecular (exceção ao padrão hidróxido)',
      descricao: 'Base de Brønsted-Lowry molecular, não um hidróxido metálico. Nome IUPAC sistemático do hidreto: azano.',
      padrao: 'Nome consagrado "amônia" — não segue o padrão hidróxido-de-metal',
      exemplo: 'NH₃(aq) + H₂O(l) ⇌ NH₄⁺(aq) + OH⁻(aq)',
      fonte: 'IUPAC Red Book 2005, Seção IR-6.2.2',
    },
  },

  /* ────────────────────────────────────────────────────────────
     SAIS
  ──────────────────────────────────────────────────────────── */
  {
    id: 'nacl',
    formula: 'NaCl',
    formulaId: 'NaCl',
    nome: 'Cloreto de Sódio',
    funcao: 'sal',
    categoria: 'Sais Neutros',

    /* Fonte: CRC Handbook / NIST */
    massa:      '58,44 g/mol',
    Tf:         800.7,         /* °C */
    Tb:         1465,          /* °C */
    densidade:  '2,165 g/cm³ (sólido)',
    solubilidade: '35,9 g/100 mL a 25 °C; pouco afetada pela temperatura',
    ph:         '6,7–7,3 (solução aquosa — praticamente neutro)',

    nomenclatura: 'Cloreto de sódio / sal de cozinha / halita (IUPAC: cloreto de sódio)',
    badges: ['neutro', 'iônico', 'haleto', 'alimentar'],
    geometria: 'Cúbica de face centrada (FCC) — retículo iônico',
    ligacao: 'Iônica; Na⁺ e Cl⁻; energia reticular = 787 kJ/mol',

    equacao: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)',
    reacao:
      'Teste qualitativo de Cl⁻ com AgNO₃:\n' +
      'NaCl(aq) + AgNO₃(aq) → AgCl↓(s) + NaNO₃(aq)\n\n' +
      'Eletrólise da salmoura:\n' +
      '2 NaCl(aq) + 2 H₂O(l) → Cl₂(g) + H₂(g) + 2 NaOH(aq)',

    lewis: 'sal_ionico',

    uso: 'Alimentação e conservação de alimentos, produção de NaOH e Cl₂ (eletrólise), dessalinização, industria química (síntese do PVC)',
    curiosidade:
      'A palavra "salário" vem do latim salarium — os soldados romanos eram ' +
      'pagos parcialmente em sal, tão valioso quanto ouro na Antiguidade. ' +
      'O corpo humano adulto contém ~250 g de NaCl. A concentração no sangue ' +
      '(~0,9% m/v) é mantida rigorosamente pelo sistema renal.',
    descricao:
      'Sólido cristalino branco, inodoro. Retículo iônico cúbico. ' +
      'Sal de neutralização forte: HCl + NaOH → NaCl + H₂O. ' +
      'P.F. = 800,7 °C; P.E. = 1465 °C; d = 2,165 g/cm³.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=800,7°C>25 -> sólido a 25°C. Retículo cúbico FCC já descrito.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'solido',
      tipoLigacao: 'ionico',
      polaridade: 'polar',
      geometria: 'reticular',
    },
    regra: {
      tipo: 'sal (haleto neutro)',
      descricao: 'Produto de neutralização entre HCl e NaOH. Sufixo -eto para ânions binários.',
      padrao: '[Cátion] + [ânion]eto → [ânion]eto de [cátion]',
      exemplo: 'Na⁺ + Cl⁻ → NaCl (cloreto de sódio)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.4',
    },
  },

  {
    id: 'cuso4',
    formula: 'CuSO₄',
    formulaId: 'CuSO4',
    nome: 'Sulfato de Cobre (II)',
    funcao: 'sal',
    categoria: 'Sais Coloridos',

    /* Fonte: CRC Handbook / NIST */
    massa:      '159,61 g/mol (anidro); 249,69 g/mol (pentaidratado)',
    Tf:         200,           /* °C — anidro; perde água em etapas: 63°C, 109°C, 200°C */
    Tb:         650,           /* °C — decomposição */
    densidade:  '3,60 g/cm³ (anidro); 2,28 g/cm³ (pentaidratado)',
    solubilidade: '20,3 g/100 mL a 20 °C; 75,4 g/100 mL a 100 °C',
    ph:         '3,5–4,5 (hidrólise: Cu²⁺ + H₂O ⇌ [Cu(OH)]⁺ + H⁺)',

    nomenclatura: 'Sulfato de cobre (II) / vitríolo azul / sulfato cúprico',
    badges: ['colorido', 'hidratável', 'ácido em água', 'fungicida'],
    geometria: 'Cobre: octaédrico distorcido (efeito Jahn-Teller); SO₄²⁻: tetraédrica',
    ligacao: 'Iônica; Cu²⁺ e SO₄²⁻; no hidratado Cu²⁺ coordena 4 H₂O',

    equacao: 'CuSO₄(s) → Cu²⁺(aq) + SO₄²⁻(aq)',
    reacao:
      'Precipitação de Cu(OH)₂:\n' +
      'CuSO₄(aq) + 2 NaOH(aq) → Cu(OH)₂↓(s) + Na₂SO₄(aq)\n\n' +
      'Cementação (deslocamento):\n' +
      'CuSO₄(aq) + Fe(s) → FeSO₄(aq) + Cu(s)',

    lewis: 'sal_colorido',

    uso: 'Fungicida (calda bordalesa = CuSO₄ + Ca(OH)₂), galvanoplastia, indicador de umidade (anidro branco → hidratado azul), tinta azul',
    curiosidade:
      'O CuSO₄ anidro é um pó branco. Ao absorver água forma o pentaidratado ' +
      'CuSO₄·5H₂O de cor azul intensa — usado como indicador visual de umidade ' +
      'em dessecadores. O azul vem do íon Cu²⁺ coordenado por 4 moléculas ' +
      'de água no centro octaédrico distorcido (efeito Jahn-Teller).',
    descricao:
      'Sal de cobre (II) com sulfato. Anidro: branco, higroscópico. ' +
      'Pentaidratado: cristais azuis, forma mais comum. ' +
      'P.F. (anidro) ≈ 200 °C (decomp.); d(pentaidratado) = 2,28 g/cm³.',
  },

  {
    id: 'agno3',
    formula: 'AgNO₃',
    formulaId: 'AgNO3',
    nome: 'Nitrato de Prata',
    funcao: 'sal',
    categoria: 'Sais Especiais',

    /* Fonte: CRC Handbook / NIST */
    massa:      '169,87 g/mol',
    Tf:         209.7,         /* °C */
    Tb:         444,           /* °C — decompõe-se acima de 440 °C */
    densidade:  '4,35 g/cm³ (sólido)',
    solubilidade: '256 g/100 mL a 25 °C; altamente solúvel',
    ph:         '5,4–6,0 (hidrólise leve)',

    nomenclatura: 'Nitrato de prata / lunar cáustico (IUPAC: nitrato de prata)',
    badges: ['fotossensível', 'oxidante', 'analítico', 'antisséptico'],
    geometria: 'Iônico ortorrômbico → monoclínico acima de 160 °C',
    ligacao: 'Iônica; Ag⁺ e NO₃⁻',

    equacao: 'AgNO₃(s) → Ag⁺(aq) + NO₃⁻(aq)',
    reacao:
      'Teste qualitativo de Cl⁻ (precipitado branco):\n' +
      'AgNO₃(aq) + NaCl(aq) → AgCl↓(s) + NaNO₃(aq)\n\n' +
      'Redução a prata metálica:\n' +
      '2 AgNO₃(aq) + Cu(s) → Cu(NO₃)₂(aq) + 2 Ag(s)',

    lewis: 'sal_ionico',

    uso: 'Fotografia analógica (AgBr sensível à luz), espelhos (processo de Tollens), antisséptico (cauterização), análise qualitativa de haletos',
    curiosidade:
      'A mancha negra que aparece na pele ao tocar AgNO₃ é prata metálica ' +
      'formada pela redução do Ag⁺ pela luz solar e compostos orgânicos da pele. ' +
      'É permanente por 1–2 semanas — o epitélio precisa descamar para sumir. ' +
      'No séc. XIX, AgNO₃ era chamado "lunar cáustico" e usado para cauterizar feridas.',
    descricao:
      'Sólido cristalino incolor, altamente solúvel. Fotossensível — escurece ' +
      'à luz (Ag⁺ → Ag⁰). Forte oxidante; cáustico para tecidos. ' +
      'P.F. = 209,7 °C; P.E. = 444 °C (decomp.); d = 4,35 g/cm³.',
  },

  /* ────────────────────────────────────────────────────────────
     ÓXIDOS
  ──────────────────────────────────────────────────────────── */
  {
    id: 'cao',
    formula: 'CaO',
    formulaId: 'CaO',
    nome: 'Óxido de Cálcio',
    funcao: 'oxido',
    categoria: 'Óxidos Básicos',

    /* Fonte: InfoEscola, CRC Handbook */
    massa:      '56,08 g/mol',
    Tf:         2613,          /* °C — um dos maiores pf entre óxidos comuns */
    Tb:         2850,          /* °C */
    densidade:  '3,35 g/cm³ (sólido)',
    solubilidade: 'Reage exotermicamente com água (ΔH = −63,7 kJ/mol); não dissolve-se, hidrata-se',
    ph:         '12,4 (como Ca(OH)₂ formado)',

    nomenclatura: 'Óxido de cálcio / cal viva / cal virgem (IUPAC: óxido de cálcio)',
    badges: ['básico', 'exotérmico', 'construção', 'cáustico'],
    geometria: 'Cúbica (NaCl-like); Ca²⁺ e O²⁻',
    ligacao: 'Iônica; energia reticular = 3401 kJ/mol',

    equacao: 'CaO(s) + H₂O(l) → Ca(OH)₂(s) + calor  (ΔH = −63,7 kJ/mol)',
    reacao:
      'Hidratação (cal viva → cal hidratada):\n' +
      'CaO(s) + H₂O(l) → Ca(OH)₂(s)\n\n' +
      'Reação com ácido:\n' +
      'CaO(s) + H₂SO₄(aq) → CaSO₄(s) + H₂O(l)',

    lewis: 'oxido_basico',

    uso: 'Produção de cimento Portland, cal hidratada para construção, tratamento de água e efluentes, siderurgia (escória de alto-forno)',
    curiosidade:
      'A reação de hidratação do CaO libera calor suficiente para elevar a ' +
      'temperatura da mistura a ~150 °C — a mistura "ferve" sem fogo. ' +
      'O CaO é obtido industrialmente calcinando CaCO₃ a ~900 °C em fornos ' +
      'rotativos. O Brasil é o 3° maior produtor mundial de cal.',
    descricao:
      'Sólido branco em pó ou pedaços. Óxido básico de metal alcalino-terroso. ' +
      'Ponto de fusão elevadíssimo (ligação iônica forte). ' +
      'P.F. = 2613 °C; P.E. = 2850 °C; d = 3,35 g/cm³.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=2613°C>25 -> sólido a 25°C. Retículo cúbico tipo NaCl já descrito.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'solido',
      tipoLigacao: 'ionico',
      polaridade: 'polar',
      geometria: 'reticular',
    },
    regra: {
      tipo: 'óxido básico',
      descricao: 'Óxido iônico de metal alcalino-terroso; reage com água formando base forte Ca(OH)₂.',
      padrao: 'Óxido de [metal]',
      exemplo: '2 Ca + O₂ → 2 CaO (óxido de cálcio)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.5',
    },
  },

  {
    id: 'co2',
    formula: 'CO₂',
    formulaId: 'CO2',
    nome: 'Dióxido de Carbono',
    funcao: 'oxido',
    categoria: 'Óxidos Ácidos',

    /* Fonte: NIST WebBook / CRC */
    massa:      '44,01 g/mol',
    Tf:         -56.6,         /* °C — ponto triplo (5,18 atm); sublima a −78,5 °C a 1 atm */
    Tb:         -78.5,         /* °C — temperatura de sublimação a 1 atm */
    densidade:  '1,98 kg/m³ (gás, 0 °C); 1562 kg/m³ (sólido, gelo seco)',
    solubilidade: '1,45 g/L a 25 °C (sob 1 atm); forma H₂CO₃',
    ph:         '—  (gás); 3,7–4,0 (solução saturada)',

    nomenclatura: 'Dióxido de carbono / anidrido carbônico (IUPAC: dióxido de carbono)',
    badges: ['ácido', 'gasoso', 'linear', 'ambiental'],
    geometria: 'Linear (D∞h); ângulo O=C=O = 180°',
    ligacao: 'Covalente; 2 ligações C=O; μ = 0 (apolar por simetria)',

    equacao: 'CO₂(g) + H₂O(l) ⇌ H₂CO₃(aq)',
    reacao:
      'Com base forte:\n' +
      'CO₂(g) + 2 NaOH(aq) → Na₂CO₃(aq) + H₂O(l)\n\n' +
      'Teste de CO₂ (água de cal):\n' +
      'CO₂(g) + Ca(OH)₂(aq) → CaCO₃↓(s) + H₂O(l)',

    lewis: 'oxido_acido',

    uso: 'Extintores de incêndio, carbonatação de bebidas (refrigerantes, cerveja), gelo seco, atmosfera modificada para conservação de alimentos, fotossíntese',
    curiosidade:
      'O CO₂ sólido (gelo seco, −78,5 °C) sublima diretamente para gás a ' +
      '1 atm — não existe CO₂ líquido à pressão atmosférica. ' +
      'O ponto triplo está em −56,6 °C e 5,18 atm. A concentração ' +
      'atmosférica atual é ~424 ppm (2024), 50% acima do pré-industrial.',
    descricao:
      'Gás incolor, inodoro, não inflamável. Óxido ácido de ametal. ' +
      'Molécula linear simétrica, apolar. Sublima a −78,5 °C (1 atm). ' +
      'Ponto triplo: −56,6 °C / 5,18 atm. d(gás, 0 °C) = 1,98 kg/m³.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tb=-78,5°C<25 -> gasoso (sublima) a 25°C. Molécula linear D∞h, apolar por simetria (μ=0) — já explicitado no campo ligacao.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'gas',
      tipoLigacao: 'covalente',
      polaridade: 'apolar',
      geometria: 'linear',
    },
    regra: {
      tipo: 'óxido ácido (anidrido)',
      descricao: 'Óxido covalente de ametal. Prefixos gregos indicam o número de átomos de oxigênio.',
      padrao: '[prefixo]óxido de [elemento]',
      exemplo: 'C + O₂ → CO₂ (dióxido de carbono)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.5',
    },
  },

  {
    id: 'fe2o3',
    formula: 'Fe₂O₃',
    formulaId: 'Fe2O3',
    nome: 'Óxido de Ferro (III)',
    funcao: 'oxido',
    categoria: 'Óxidos Básicos',

    /* Fonte: CRC Handbook / NIST */
    massa:      '159,69 g/mol',
    Tf:         1565,          /* °C — decomposição em Fe₃O₄ + O₂ acima de ~1400 °C */
    Tb:         null,          /* decompõe antes */
    densidade:  '5,26 g/cm³ (hematita, α-Fe₂O₃)',
    solubilidade: 'Insolúvel em água; solúvel em ácidos (HCl, H₂SO₄)',
    ph:         '—',

    nomenclatura: 'Óxido de ferro (III) / hematita / ferrugem (IUPAC: trióxido de dihierro)',
    badges: ['básico', 'insolúvel', 'mineral', 'pigmento'],
    geometria: 'Corindon (α); Fe³⁺ em octaédrica, O²⁻ em hexagonal compacta',
    ligacao: 'Iônica; Fe³⁺ e O²⁻',

    equacao: '4 Fe(s) + 3 O₂(g) → 2 Fe₂O₃(s)  (ferrugem)',
    reacao:
      'Dissolução em ácido:\n' +
      'Fe₂O₃(s) + 3 H₂SO₄(aq) → Fe₂(SO₄)₃(aq) + 3 H₂O(l)\n\n' +
      'Termoita (reação aluminotérmica):\n' +
      'Fe₂O₃(s) + 2 Al(s) → Al₂O₃(s) + 2 Fe(l)  (ΔT ≈ 2500 °C)',

    lewis: 'oxido_basico',

    uso: 'Pigmento vermelho (ocre, rouge), minério de ferro (hematita — principal minério siderúrgico), polimento (rouge de joalheiros), reação termoita para solda de trilhos',
    curiosidade:
      'A reação termoita (Fe₂O₃ + Al) atinge ~2500 °C em segundos — calor ' +
      'suficiente para fundir o ferro produzido. Era usada para soldar trilhos ' +
      'ferroviários in loco no campo, antes das soldas elétricas. ' +
      'A hematita é o principal minério de ferro e constitui a maior parte ' +
      'das exportações brasileiras (Carajás, PA).',
    descricao:
      'Sólido vermelho-marrom, insolúvel. Óxido básico de metal de transição. ' +
      'Mineral hematita (α-Fe₂O₃): estrutura corindon. ' +
      'P.F. ≈ 1565 °C (decomp.); d = 5,26 g/cm³.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf=1565°C>25 -> sólido a 25°C. Estrutura corindon (retículo) já descrita.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'solido',
      tipoLigacao: 'ionico',
      polaridade: 'polar',
      geometria: 'reticular',
    },
    regra: {
      tipo: 'óxido básico',
      descricao: 'Óxido iônico de metal de transição no NOX +3, indicado por algarismo romano na nomenclatura de estoque.',
      padrao: 'Óxido de [metal] (NOX em romano)',
      exemplo: '4 Fe + 3 O₂ → 2 Fe₂O₃ (óxido de ferro III)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.5; Brown et al. (2012) Cap. 2.8',
    },
  },

  {
    id: 'so3',
    formula: 'SO₃',
    formulaId: 'SO3',
    nome: 'Trióxido de Enxofre',
    funcao: 'oxido',
    categoria: 'Óxidos Ácidos',

    /* Fonte: CRC Handbook / NIST */
    massa:      '80,06 g/mol',
    Tf:         16.9,          /* °C — forma α (polimérico) */
    Tb:         45.0,          /* °C */
    densidade:  '1,92 g/cm³ (líquido, 20 °C)',
    solubilidade: 'Reage violentamente com água: SO₃ + H₂O → H₂SO₄ (ΔH = −130 kJ/mol)',
    ph:         '—  (reage com H₂O antes de dissolver)',

    nomenclatura: 'Trióxido de enxofre / anidrido sulfúrico (IUPAC: trióxido de enxofre)',
    badges: ['ácido', 'poluente', 'reativo', 'precursor H₂SO₄'],
    geometria: 'Trigonal planar (D₃h); ângulo O=S=O = 120°',
    ligacao: 'Covalente; 3 ligações S=O deslocalizadas (ressonância); μ = 0',

    equacao: 'SO₃(g) + H₂O(l) → H₂SO₄(aq)',
    reacao:
      'Produção industrial de H₂SO₄ (processo de contato):\n' +
      '2 SO₂(g) + O₂(g) ⇌ 2 SO₃(g)   (V₂O₅, 450 °C)\n' +
      'SO₃(g) + H₂SO₄(conc.) → H₂S₂O₇(l)  (oleum)\n\n' +
      'Com base:\n' +
      'SO₃(g) + 2 NaOH(aq) → Na₂SO₄(aq) + H₂O(l)',

    lewis: 'oxido_acido',

    uso: 'Produção de ácido sulfúrico (processo de contato), síntese de oleum, precursor de sulfonatos para detergentes',
    curiosidade:
      'O SO₂ emitido por vulcões e usinas termelétricas é oxidado ' +
      'na atmosfera a SO₃, que reage com vapor d\'água formando gotículas ' +
      'de H₂SO₄ — principal responsável pela chuva ácida (pH < 4,5). ' +
      'Já corroeu monumentos de calcário em toda a Europa industrial.',
    descricao:
      'Líquido incolor a 20–45 °C, altamente reativo com água. ' +
      'Óxido ácido de ametal. Trigonal planar, apolar. ' +
      'P.F. = 16,9 °C; P.E. = 45,0 °C; d(liq.) = 1,92 g/cm³.',
  },


  /* ─────────────────────────────────────────────────────────────
     ÁCIDO FOSFÓRICO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'h3po4',
    formula: 'H₃PO₄',
    formulaId: 'H3PO4',
    nome: 'Ácido Fosfórico',
    funcao: 'acido',
    categoria: 'Ácidos Médios',

    massa:       '97,99 g/mol',
    Tf:          42.4,
    Tb:          158,
    densidade:   '1,88 g/cm³ (puro); 1,69 g/cm³ (85%)',
    solubilidade:'Miscível em água em qualquer proporção',
    ph:          '1,5 a 2,1 (0,1 mol·L⁻¹)',

    nomenclatura: 'Ácido fosfórico / ácido ortofosfórico (IUPAC: ácido trioxofosfórico(V))',
    badges: ['médio', 'triprótico', 'higroscópico', 'não-oxidante'],
    geometria: 'Tetraédrica (C₃ᵥ)',
    ligacao: 'Covalente polar; 3 ligações P–OH e 1 P=O',
    pfStr: '42,4 °C', peStr: '158 °C',

    equacao: 'H₃PO₄ ⇌ H⁺ + H₂PO₄⁻  (Ka₁ = 7,5×10⁻³)',
    reacao:
      'Neutralização total:\n' +
      'H₃PO₄ + 3 NaOH → Na₃PO₄ + 3 H₂O\n\n' +
      'Neutralização parcial:\n' +
      'H₃PO₄ + NaOH → NaH₂PO₄ + H₂O',

    lewis: 'acido_oxigenado',

    uso: 'Refrigerantes cola (~0,05%), fertilizantes (superfosfato triplo), tratamento anti-ferrugem, aditivo alimentar (E338)',
    curiosidade:
      'O ácido fosfórico dá o sabor ácido às colas (Coca-Cola, Pepsi). ' +
      'Um copo de cola contém ~17 mg de H₃PO₄. É triprótico — pode perder ' +
      '3 H⁺ em três etapas — formando H₂PO₄⁻, HPO₄²⁻ e PO₄³⁻. ' +
      'Único ácido comum que não ataca o alumínio: forma camada protetora de AlPO₄.',
    descricao:
      'Sólido cristalino branco (puro) ou líquido viscoso incolor (85%). ' +
      'Ácido fraco a médio — triprótico, ioniza em 3 etapas. ' +
      'Não é oxidante (diferente de HNO₃ e H₂SO₄ conc). ' +
      'Produzido principalmente via "processo úmido": Ca₃(PO₄)₂ + 3H₂SO₄.',
  },

  /* ─────────────────────────────────────────────────────────────
     HIDRÓXIDO DE POTÁSSIO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'koh',
    formula: 'KOH',
    formulaId: 'KOH',
    nome: 'Hidróxido de Potássio',
    funcao: 'base',
    categoria: 'Bases Fortes',

    massa:       '56,11 g/mol',
    Tf:          360,
    Tb:          1327,
    densidade:   '2,04 g/cm³',
    solubilidade:'112 g/100 mL a 20 °C; dissolução muito exotérmica',
    ph:          '> 13 (solução 1 mol·L⁻¹)',

    nomenclatura: 'Hidróxido de potássio / potassa cáustica (IUPAC: hidróxido de potássio)',
    badges: ['forte', 'monovalente', 'higroscópico', 'cáustico'],
    geometria: 'Linear (par iônico em solução)',
    ligacao: 'Iônica; K⁺ e OH⁻',
    pfStr: '360 °C', peStr: '1327 °C',

    equacao: 'KOH(s) → K⁺(aq) + OH⁻(aq)',
    reacao:
      'Neutralização:\n' +
      'KOH + HCl → KCl + H₂O\n\n' +
      'Absorção de CO₂:\n' +
      'CO₂ + 2 KOH → K₂CO₃ + H₂O',

    lewis: 'base_forte',

    uso: 'Produção de sabão mole (potassa), eletrólito em pilhas alcalinas, síntese de K₂CO₃, fabricação de biodiesel',
    curiosidade:
      'KOH é chamado de "potassa cáustica". Pilhas alcalinas AA e AAA usam ' +
      'solução de KOH como eletrólito (não ácido sulfúrico!). ' +
      'É mais solúvel que NaOH (112 vs 111 g/100mL) e forma sabões mais macios — ' +
      'sabão líquido de potassa é a base de todos os sabões líquidos modernos.',
    descricao:
      'Sólido branco muito higroscópico. Base forte monovalente — ionização ' +
      'completa em água. Mais solúvel e mais cáustico que NaOH. ' +
      'Reage com vidro SiO₂ ao longo do tempo — não guardar em frascos de vidro fechados.',
  },

  /* ─────────────────────────────────────────────────────────────
     HIDRÓXIDO DE MAGNÉSIO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'mgoh2',
    formula: 'Mg(OH)₂',
    formulaId: 'Mg(OH)2',
    nome: 'Hidróxido de Magnésio',
    funcao: 'base',
    categoria: 'Bases Médias',

    massa:       '58,32 g/mol',
    Tf:          350,
    Tb:          null,
    densidade:   '2,37 g/cm³',
    solubilidade:'0,0009 g/100 mL a 20 °C (praticamente insolúvel)',
    ph:          '10,5 (suspensão saturada)',

    nomenclatura: 'Hidróxido de magnésio (IUPAC: hidróxido de magnésio)',
    badges: ['médio', 'divalente', 'insolúvel', 'antiácido'],
    geometria: 'Octaédrica (empacotamento em brucita)',
    ligacao: 'Iônica; Mg²⁺ e 2 OH⁻',
    pfStr: '350 °C (decomp.)', peStr: '—',

    equacao: 'Mg(OH)₂(s) ⇌ Mg²⁺(aq) + 2 OH⁻(aq)  [Kps = 5,6×10⁻¹²]',
    reacao:
      'Neutralização (antiácido):\n' +
      'Mg(OH)₂ + 2 HCl → MgCl₂ + 2 H₂O\n\n' +
      'Decomposição por calor:\n' +
      'Mg(OH)₂ →(Δ)→ MgO + H₂O',

    lewis: 'base_fraca',

    uso: 'Leite de magnésia (antiácido e laxante), retardante de chama em polímeros, tratamento de águas residuais, suplemento de Mg',
    curiosidade:
      'O "leite de magnésia" é uma suspensão de Mg(OH)₂ em água (não dissolve!). ' +
      'Neutraliza HCl do suco gástrico sem entrar na corrente sanguínea. ' +
      'Em doses altas, age como laxante osmótico — atrai água para o intestino. ' +
      'Retardante de chama: ao ser aquecido, libera H₂O que resfria o material.',
    descricao:
      'Pó branco praticamente insolúvel (Kps = 5,6×10⁻¹²). ' +
      'Base divalente de força média. Em água forma uma suspensão leitosa ' +
      '(não dissolve). Antiácido mais suave que NaOH. ' +
      'Decompõe-se a ~350 °C, liberando MgO e H₂O.',
  },

  /* ─────────────────────────────────────────────────────────────
     ÓXIDO DE ZINCO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'zno',
    formula: 'ZnO',
    formulaId: 'ZnO',
    nome: 'Óxido de Zinco',
    funcao: 'oxido',
    categoria: 'Óxidos Anfóteros',

    massa:       '81,38 g/mol',
    Tf:          1975,
    Tb:          null,
    densidade:   '5,60 g/cm³',
    solubilidade:'Insolúvel em água; dissolve em ácidos e bases',
    ph:          '7 (anfótero)',

    nomenclatura: 'Óxido de zinco (IUPAC: óxido de zinco)',
    badges: ['anfótero', 'fotocatalítico', 'semicondutor', 'branco'],
    geometria: 'Wurtzita (hexagonal)',
    ligacao: 'Iônico-covalente misto; Zn²⁺ e O²⁻',
    pfStr: '1975 °C', peStr: 'sublima >1800 °C',

    equacao: 'ZnO + H₂SO₄ → ZnSO₄ + H₂O  (ácido)\nZnO + 2 NaOH → Na₂ZnO₂ + H₂O  (base)',
    reacao:
      'Com ácido:\n' +
      'ZnO + 2 HCl → ZnCl₂ + H₂O\n\n' +
      'Com base:\n' +
      'ZnO + 2 NaOH → Na₂ZnO₂ + H₂O',

    lewis: 'oxido_acido',

    uso: 'Protetor solar (bloqueador físico de UV), borracha vulcanizada, pigmento branco (tinta), semicondutor, pomada de zinco (cicatrizante)',
    curiosidade:
      'ZnO é único pois é anfótero — reage com ácido E com base! ' +
      'No protetor solar, partículas nanométricas de ZnO dispersam UV-A e UV-B. ' +
      'Aparece branco por refletir toda a luz visível, mas emite luz UV azul — ' +
      'base de LEDs brancos modernos (ZnO + camada fluorescente).',
    descricao:
      'Pó cristalino branco. Óxido anfótero: comporta-se como base com ácidos ' +
      'e como ácido com bases — propriedade rara. ' +
      'Semicondutor tipo N, gap óptico de 3,37 eV. ' +
      'Não funde — sublima acima de 1800 °C.',
  },

  /* ─────────────────────────────────────────────────────────────
     ÓXIDO DE MAGNÉSIO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'mgo',
    formula: 'MgO',
    formulaId: 'MgO',
    nome: 'Óxido de Magnésio',
    funcao: 'oxido',
    categoria: 'Óxidos Básicos',

    massa:       '40,30 g/mol',
    Tf:          2852,
    Tb:          3600,
    densidade:   '3,58 g/cm³',
    solubilidade:'0,062 g/100 mL a 20 °C',
    ph:          '10,3 (solução saturada)',

    nomenclatura: 'Óxido de magnésio / magnésia (IUPAC: óxido de magnésio)',
    badges: ['refratário', 'básico', 'cerâmica', 'antiácido'],
    geometria: 'Cúbica NaCl (Oh)',
    ligacao: 'Iônica; Mg²⁺ e O²⁻; energia de rede = 3795 kJ/mol',
    pfStr: '2852 °C', peStr: '3600 °C',

    equacao: 'MgO + H₂O → Mg(OH)₂',
    reacao:
      'Com ácido:\n' +
      'MgO + 2 HCl → MgCl₂ + H₂O\n\n' +
      'Com água:\n' +
      'MgO + H₂O → Mg(OH)₂',

    lewis: 'oxido_basico',

    uso: 'Tijolos refratários (fornos de aço), antiácido, suplemento de magnésio, isolante elétrico em cabos de alta temperatura',
    curiosidade:
      'Com P.F. de 2852 °C, MgO é um dos óxidos mais refratários — ' +
      'usado para revestir fornos de aço e alto-forno. ' +
      'A Magnésia (Mαγνησία), região da Grécia onde o mineral era encontrado, ' +
      'deu nome ao magnésio, ao magneto e à manga.',
    descricao:
      'Pó branco de ponto de fusão altíssimo (2852 °C). ' +
      'Óxido básico — reage lentamente com água formando Mg(OH)₂. ' +
      'Muito estável termicamente. Excelente isolante elétrico e térmico. ' +
      'Energia de rede enorme (3795 kJ/mol) torna-o muito duro (6 na escala Mohs).',
  },

  /* ─────────────────────────────────────────────────────────────
     CARBONATO DE SÓDIO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'na2co3',
    formula: 'Na₂CO₃',
    formulaId: 'Na2CO3',
    nome: 'Carbonato de Sódio',
    funcao: 'sal',
    categoria: 'Sais de Ácido Fraco',

    massa:       '105,99 g/mol',
    Tf:          851,
    Tb:          null,
    densidade:   '2,54 g/cm³',
    solubilidade:'21,5 g/100 mL a 20 °C',
    ph:          '11,6 (0,1 mol·L⁻¹) — hidrólise básica',

    nomenclatura: 'Carbonato de sódio / barrilha (IUPAC: carbonato de dissódio)',
    badges: ['hidrolisável', 'barrilha', 'alcalino', 'processo Solvay'],
    geometria: 'Trigonal planar CO₃²⁻',
    ligacao: 'Iônica; 2 Na⁺ e CO₃²⁻',
    pfStr: '851 °C', peStr: 'decompõe',

    equacao: 'Na₂CO₃ + H₂O ⇌ NaHCO₃ + NaOH  (hidrólise básica)',
    reacao:
      'Com ácido forte:\n' +
      'Na₂CO₃ + 2 HCl → 2 NaCl + H₂O + CO₂\n\n' +
      'Hidrólise:\n' +
      'CO₃²⁻ + H₂O ⇌ HCO₃⁻ + OH⁻',

    lewis: 'sal_ionico',

    uso: 'Fabricação de vidro (~50% do consumo), detergentes, papel e celulose, tratamento de água, culinária (água com gás artificial)',
    curiosidade:
      'Na₂CO₃ é a "barrilha" — usado há 5000 anos no Egito para mumificação e ' +
      'fabricação de vidro. O processo Solvay (1863) revolucionou a produção: ' +
      'NaCl + NH₃ + CO₂ + H₂O → NaHCO₃ → Na₂CO₃. ' +
      'É o 11° produto químico mais produzido no mundo (~60 milhões ton/ano).',
    descricao:
      'Sólido cristalino branco. Sal de ácido fraco (H₂CO₃) e base forte (NaOH), ' +
      'portanto sofre hidrólise básica — solução aquosa tem pH ~11,6. ' +
      'Anidro (Na₂CO₃), mono- (·H₂O), deca- (·10H₂O = cristal de soda). ' +
      'O hidratado perde água ao ar (eflorescência).',
  },

  /* ─────────────────────────────────────────────────────────────
     CLORETO DE FERRO III
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'fecl3',
    formula: 'FeCl₃',
    formulaId: 'FeCl3',
    nome: 'Cloreto de Ferro III',
    funcao: 'sal',
    categoria: 'Sais de Metal de Transição',

    massa:       '162,20 g/mol',
    Tf:          306,
    Tb:          315,
    densidade:   '2,90 g/cm³',
    solubilidade:'91,2 g/100 mL a 20 °C',
    ph:          '3,0–3,5 (0,1 mol·L⁻¹) — hidrólise ácida',

    nomenclatura: 'Cloreto de ferro(III) / cloreto férrico (IUPAC: tricloreto de ferro)',
    badges: ['oxidante', 'coagulante', 'gravura', 'Lewis ácido'],
    geometria: 'Octaédrica [Fe(H₂O)₆]³⁺ em solução',
    ligacao: 'Iônico-covalente; Fe³⁺ e 3 Cl⁻',
    pfStr: '306 °C', peStr: '315 °C',

    equacao: 'FeCl₃ + 3 H₂O ⇌ Fe(OH)₃↓ + 3 HCl  (hidrólise ácida)',
    reacao:
      'Com NaOH:\n' +
      'FeCl₃ + 3 NaOH → Fe(OH)₃↓ + 3 NaCl\n\n' +
      'Gravura de cobre:\n' +
      '2 FeCl₃ + Cu → 2 FeCl₂ + CuCl₂',

    lewis: 'sal_colorido',

    uso: 'Gravura de PCBs (circuitos impressos), coagulante em tratamento de água, catalisador, pigmento marrom, reagente analítico (teste de fenol)',
    curiosidade:
      'FeCl₃ é o reagente usado para gravar circuitos impressos (PCBs): ' +
      'dissolve cobre seletivamente — 2FeCl₃ + Cu → 2FeCl₂ + CuCl₂. ' +
      'Teste de Mohr: FeCl₃ + KSCN → vermelho sangue intenso ([Fe(SCN)]²⁺) — ' +
      'detecta Fe³⁺ em concentrações nanomolares.',
    descricao:
      'Sólido cristalino marrom-preto ou escamas castanhas. ' +
      'Em solução adquire cor amarelo-alaranjada. ' +
      'Sal de ácido forte e base fraca: hidrólise ácida (pH ~3). ' +
      'Excelente coagulante — destabiliza coloides por troca de cargas.',
  },

  /* ─────────────────────────────────────────────────────────────
     ZINCO METÁLICO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'zn',
    formula: 'Zn',
    formulaId: 'Zn',
    nome: 'Zinco Metálico',
    funcao: 'elem',
    categoria: 'Metais de Transição',

    massa:       '65,38 g/mol',
    Tf:          419.5,
    Tb:          907,
    densidade:   '7,14 g/cm³',
    solubilidade:'Insolúvel em água; dissolve em ácidos e NaOH',
    ph:          '—',

    nomenclatura: 'Zinco (IUPAC: zinco)',
    badges: ['anfótero', 'galvanização', 'redutor', 'essencial'],
    geometria: 'Hexagonal compacta (hcp)',
    ligacao: 'Metálica; banda de condução semi-preenchida',
    pfStr: '419,5 °C', peStr: '907 °C',

    equacao: 'Zn → Zn²⁺ + 2e⁻  (E° = +0,76 V vs SHE)',
    reacao:
      'Com ácido:\n' +
      'Zn + 2 HCl → ZnCl₂ + H₂\n\n' +
      'Com base (anfótero):\n' +
      'Zn + 2 NaOH → Na₂ZnO₂ + H₂',

    lewis: 'generico',

    uso: 'Galvanização de aço (zinco como ânodo de sacrifício), ligas metálicas (latão = Cu+Zn), pilhas zinco-carbono, suplemento (enzimas)',
    curiosidade:
      'Zn é anfótero — reage com HCl E com NaOH, liberando H₂ nas duas reações! ' +
      'A galvanização protege o aço: mesmo se o zinco rachar, ' +
      'ele continua protegendo por ser mais ativo (ânodo de sacrifício). ' +
      '300 mg de Zn são encontrados no corpo humano — cofator de +300 enzimas.',
    descricao:
      'Metal azulado-prateado, moderadamente ativo. ' +
      'Anfótero — dissolve em ácidos (formando Zn²⁺) e em bases (formando ZnO₂²⁻). ' +
      'E° = −0,76 V (mais negativo que Fe: −0,44 V), portanto protege o ferro. ' +
      'Fragiliza abaixo de 0 °C (transição dúctil-frágil).',
  },

  /* ─────────────────────────────────────────────────────────────
     ALUMÍNIO METÁLICO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'al',
    formula: 'Al',
    formulaId: 'Al',
    nome: 'Alumínio Metálico',
    funcao: 'elem',
    categoria: 'Metais do Grupo Principal',

    massa:       '26,98 g/mol',
    Tf:          660.3,
    Tb:          2519,
    densidade:   '2,70 g/cm³',
    solubilidade:'Insolúvel em água; dissolve em ácidos diluídos e em NaOH',
    ph:          '—',

    nomenclatura: 'Alumínio (IUPAC: alumínio)',
    badges: ['anfótero', 'passivação', 'leve', 'redutor'],
    geometria: 'Cúbica de face centrada (fcc)',
    ligacao: 'Metálica; alta densidade eletrônica',
    pfStr: '660,3 °C', peStr: '2519 °C',

    equacao: 'Al → Al³⁺ + 3e⁻  (E° = +1,66 V vs SHE)',
    reacao:
      'Com ácido:\n' +
      '2 Al + 6 HCl → 2 AlCl₃ + 3 H₂\n\n' +
      'Com base (anfótero):\n' +
      '2 Al + 2 NaOH + 2 H₂O → 2 NaAlO₂ + 3 H₂',

    lewis: 'generico',

    uso: 'Embalagens (latas, folhas), aeronáutica, construção civil, condutores elétricos (alta tensão), ligas (duralumin)',
    curiosidade:
      'Al é o metal mais abundante na crosta terrestre (~8%), mas era mais ' +
      'valioso que ouro em 1850 (antes da eletrólise). Napoleão III usava talheres ' +
      'de Al nas grandes ocasiões. É anfótero: dissolve em HCl E em NaOH. ' +
      'O HNO₃ concentrado o passiva — forma Al₂O₃ protetora impenetrável.',
    descricao:
      'Metal leve, prateado, dúctil e maleável. ' +
      'Anfótero — dissolve em ácidos (Al³⁺) e em bases concentradas (AlO₂⁻). ' +
      'Em ar forma espontaneamente Al₂O₃ passivadora (2–3 nm) que o protege. ' +
      'Produzido por eletrólise da alumina (processo Hall-Héroult, 940 °C).',
  },

  /* ─────────────────────────────────────────────────────────────
     COBRE METÁLICO
  ──────────────────────────────────────────────────────────────── */
  {
    id: 'cu',
    formula: 'Cu',
    formulaId: 'Cu',
    nome: 'Cobre Metálico',
    funcao: 'elem',
    categoria: 'Metais de Transição',

    massa:       '63,55 g/mol',
    Tf:          1084.6,
    Tb:          2562,
    densidade:   '8,96 g/cm³',
    solubilidade:'Insolúvel em HCl e H₂SO₄ diluído; dissolve em HNO₃ e H₂SO₄ conc.',
    ph:          '—',

    nomenclatura: 'Cobre (IUPAC: cobre)',
    badges: ['nobre', 'condutor', 'colorido', 'biocida'],
    geometria: 'Cúbica de face centrada (fcc)',
    ligacao: 'Metálica; banda d preenchida — condução por banda s',
    pfStr: '1084,6 °C', peStr: '2562 °C',

    equacao: 'Cu + 2 H₂SO₄(conc.) → CuSO₄ + SO₂ + 2 H₂O',
    reacao:
      'Com HNO₃ diluído:\n' +
      '3 Cu + 8 HNO₃(dil.) → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O\n\n' +
      'Deslocamento por Fe:\n' +
      'Cu²⁺ + Fe → Fe²⁺ + Cu',

    lewis: 'generico',

    uso: 'Fiação elétrica (~65% do consumo), tubulações (resistente à corrosão), moedas, ligas (bronze, latão), fungicida (calda bordalesa)',
    curiosidade:
      'Cu NÃO reage com HCl nem H₂SO₄ diluído — menos reativo que H₂ na fila! ' +
      'Mas dissolve em HNO₃ (oxidante) e H₂SO₄ concentrado quente. ' +
      'É o único metal naturalmente colorido (junto com ouro e césio). ' +
      'A estátua da Liberdade = 80 t de Cu — verde por pátina de Cu₂(OH)₂CO₃.',
    descricao:
      'Metal avermelhado brilhante. Muito bom condutor elétrico (2° depois da Ag) ' +
      'e térmico. Resistente à corrosão em água, mas dissolve em ácidos oxidantes. ' +
      'Forma pátina verde (verdigris = Cu₂(OH)₂CO₃) lentamente ao ar. ' +
      'Biocida natural — superfícies de Cu matam bactérias em horas.',
  },




  /* ══════════════════════════════════════════════════════════════
     ÁCIDOS — novos
  ══════════════════════════════════════════════════════════════ */

  {
    id: 'hf', formula: 'HF', formulaId: 'HF',
    nome: 'Ácido Fluorídrico', funcao: 'acido', categoria: 'Ácidos Haloidros',
    massa: '20,01 g/mol', Tf: -83.6, Tb: 19.5, densidade: '1,15 g/mL (líq.)',
    solubilidade: 'Miscível em água em qualquer proporção',
    ph: '< 1 a 3 (0,1 mol·L⁻¹) — ácido fraco!',
    nomenclatura: 'Ácido fluorídrico (IUPAC: fluoreto de hidrogênio)',
    badges: ['semiforte','haloidro','corrosivo','dissolve vidro'],
    geometria: 'Linear (diatômica); μ = 1,82 D (mais polar do grupo)',
    ligacao: 'Covalente polar com ligação de hidrogênio fortíssima (F–H···F)',
    pfStr: '−83,6 °C', peStr: '19,5 °C',
    equacao: 'HF ⇌ H⁺(aq) + F⁻(aq)  [Ka = 6,8×10⁻⁴ — semiforte]',
    reacao: 'Dissolve vidro:\nSiO₂ + 4 HF → SiF₄(g) + 2 H₂O\n\nNeutralização:\nHF + NaOH → NaF + H₂O',
    lewis: 'acido_haloidro',
    uso: 'Gravura em vidro, produção de fluoretos, catalisador em refino de petróleo, síntese de politetrafluoretileno (Teflon), revelação de aeronaves (etch)',
    curiosidade: 'HF é o único ácido que dissolve vidro (SiO₂ + 4HF → SiF₄ + 2H₂O). Apesar de ser ácido fraco (Ka = 6,8×10⁻⁴), é extremamente perigoso: penetra a pele sem dor e destrói ossos internamente. Tratamento: gluconato de cálcio (Ca²⁺ precipita F⁻ como CaF₂ insolúvel).',
    descricao: 'Gás incolor de odor pungente; ponto de ebulição 19,5 °C (quase líquido à temperatura ambiente). Ácido semiforte — ionização parcial. Forma pontes de hidrogênio excepcionalmente fortes (F é o átomo mais eletronegativo). Dissolve vidro — única substância capaz disso.',
  },

  {
    id: 'hbr', formula: 'HBr', formulaId: 'HBr',
    nome: 'Ácido Bromídrico', funcao: 'acido', categoria: 'Ácidos Haloidros',
    massa: '80,91 g/mol', Tf: -86.8, Tb: -66.8, densidade: '1,49 g/mL (solução 48%)',
    solubilidade: '193 g/100 mL a 20 °C',
    ph: '< 1 (0,1 mol·L⁻¹) — ácido forte',
    nomenclatura: 'Ácido bromídrico (IUPAC: brometo de hidrogênio)',
    badges: ['forte','haloidro','fumegante','redutor'],
    geometria: 'Linear (diatômica)',
    ligacao: 'Covalente polar; μ = 0,82 D (menos polar que HCl)',
    pfStr: '−86,8 °C', peStr: '−66,8 °C',
    equacao: 'HBr(g) → H⁺(aq) + Br⁻(aq)  [ionização ~100%]',
    reacao: 'Com metal:\nFe + 2 HBr → FeBr₂ + H₂\n\nCom AgNO₃:\nHBr + AgNO₃ → AgBr↓(amarelo) + HNO₃',
    lewis: 'acido_haloidro',
    uso: 'Síntese de brometos orgânicos, catalisador em alquilação, fonte de Br⁻ em análise química, produção de brometo de potássio (KBr — sedativo)',
    curiosidade: 'HBr é mais forte que HCl porque o ânion Br⁻ é maior e mais estável. O teste com AgNO₃ distingue HBr do HCl: AgBr precipita amarelo-pálido (vs. branco do AgCl). Mais solúvel em água que HCl a baixas temperaturas.',
    descricao: 'Gás incolor de odor pungente. Ácido forte monoprótico (ionização praticamente total). Em solução aquosa forma o ácido bromídrico. Menos volátil que HCl mas mais volátil que HI. Reduz compostos de I⁺ e Cl⁺ por ser agente redutor moderado.',
  },

  {
    id: 'hi', formula: 'HI', formulaId: 'HI',
    nome: 'Ácido Iodídrico', funcao: 'acido', categoria: 'Ácidos Haloidros',
    massa: '127,91 g/mol', Tf: -50.8, Tb: -35.4, densidade: '1,70 g/mL (solução 57%)',
    solubilidade: '245 g/100 mL a 20 °C (o mais solúvel dos haloidros)',
    ph: '< 1 (0,1 mol·L⁻¹) — ácido mais forte dos haloidros',
    nomenclatura: 'Ácido iodídrico (IUPAC: iodeto de hidrogênio)',
    badges: ['forte','haloidro','redutor forte','amarelece ao sol'],
    geometria: 'Linear (diatômica)',
    ligacao: 'Covalente polar; μ = 0,44 D (menos polar do grupo H-X)',
    pfStr: '−50,8 °C', peStr: '−35,4 °C',
    equacao: 'HI(g) → H⁺(aq) + I⁻(aq)  [Ka ≈ 10⁹ — fortíssimo]',
    reacao: 'Redução de Cu²⁺:\n2 Cu²⁺ + 4 I⁻ → 2 CuI↓ + I₂\n\nNeutralização:\nHI + KOH → KI + H₂O',
    lewis: 'acido_haloidro',
    uso: 'Redutor orgânico, síntese de iodetos, catalisador em reações orgânicas, medicina (KI para proteção da tireoide em acidentes nucleares)',
    curiosidade: 'HI é o ácido mais forte dos haloidros — Ka ≈ 10⁹! O ânion I⁻ é tão estável (grande e polarizável) que ioniza quase completamente. Ao sol, decompõe-se: 2HI → H₂ + I₂ (solução fica roxa por I₂). Sequência de acidez: HI > HBr > HCl >> HF.',
    descricao: 'Gás incolor que fuma ao ar. Ácido mais forte dos haloidros devido ao tamanho do I⁻. Solução aquosa tem cor amarelada (traços de I₂ por decomposição). Redutor poderoso: reduz Fe³⁺, Cu²⁺, I⁰₂→. Forma precipitado amarelo escuro com AgNO₃ (AgI, praticamente insolúvel).',
  },

  {
    id: 'h2s', formula: 'H₂S', formulaId: 'H2S',
    nome: 'Ácido Sulfídrico', funcao: 'acido', categoria: 'Ácidos Haloidros',
    massa: '34,08 g/mol', Tf: -85.6, Tb: -60.3, densidade: '1,36 g/L (gás, 0°C)',
    solubilidade: '3,98 g/L a 20 °C (gás dissolvido)',
    ph: '3,9–4,5 (0,1 mol·L⁻¹) — ácido fraco',
    nomenclatura: 'Ácido sulfídrico / gás sulfídrico (IUPAC: sulfeto de hidrogênio)',
    badges: ['fraco','diprotônico','tóxico','ovo podre'],
    geometria: 'Angular (C₂ᵥ); ângulo H–S–H = 92°',
    ligacao: 'Covalente polar; dipolo pequeno — S menos eletronegativo que O',
    pfStr: '−85,6 °C', peStr: '−60,3 °C',
    equacao: 'H₂S ⇌ H⁺ + HS⁻  (Ka₁ = 9,5×10⁻⁸) — ácido muito fraco',
    reacao: 'Com NaOH:\nH₂S + 2 NaOH → Na₂S + 2 H₂O\n\nCom Pb(NO₃)₂:\nH₂S + Pb²⁺ → PbS↓ (preto) + 2 H⁺',
    lewis: 'acido_haloidro',
    uso: 'Análise qualitativa (precipitação de sulfetos metálicos), produção de enxofre elementar, síntese de compostos de enxofre, ocorre naturalmente em vulcões e gás natural',
    curiosidade: 'H₂S é detectado pelo olfato em concentrações de ~0,0005 ppm — mas paralisa o nervo olfativo acima de 100 ppm, impedindo de sentir o perigo! LC₅₀ = 800 ppm (30 min). PbS preto (teste analítico) — por isso tinta de Pb fica preta em locais com H₂S (museus antigos).',
    descricao: 'Gás incolor com odor característico de ovo podre. Ácido fraco diprotônico — ionização muito pequena. Produzido por bactérias anaeróbias (esgotos, pântanos) e vulcões. Altamente tóxico — bloqueia citocromos na cadeia respiratória. Análise clássica de cátions do 2° grupo (precipita como CuS, PbS, etc.).',
  },

  {
    id: 'hclo', formula: 'HClO', formulaId: 'HClO',
    nome: 'Ácido Hipocloroso', funcao: 'acido', categoria: 'Ácidos Oxigenados',
    massa: '52,46 g/mol', Tf: null, Tb: null, densidade: '—',
    solubilidade: 'Existe apenas em solução aquosa (instável)',
    ph: '4–5 (0,1 mol·L⁻¹) — ácido fraco',
    nomenclatura: 'Ácido hipocloroso (IUPAC: ácido dioxocloroso — Cl⁺¹)',
    badges: ['fraco','oxidante','desinfetante','instável'],
    geometria: 'Angular (Cl–O–H)',
    ligacao: 'Covalente polar; Cl no NOX +1',
    pfStr: '—', peStr: '—',
    equacao: 'HClO ⇌ H⁺ + ClO⁻  [Ka = 3,0×10⁻⁸ — ácido fraco]',
    reacao: 'Formação:\nCl₂ + H₂O ⇌ HCl + HClO\n\nDecomposição:\n2 HClO →(luz)→ 2 HCl + O₂',
    lewis: 'acido_oxigenado',
    uso: 'Principal agente bactericida do cloro em tratamento de água e piscinas, desinfetante hospitalar (água clorada), produção de hipocloritos (NaClO, Ca(ClO)₂)',
    curiosidade: 'HClO é o agente ativo da desinfecção por cloro em piscinas — muito mais potente que ClO⁻ (hipoclorito). Por isso o pH ideal de piscinas é 7,2–7,8: mais baixo → mais HClO (melhor desinfecção). Cloro gás produz HClO ao contato com água: Cl₂ + H₂O → HCl + HClO.',
    descricao: 'Ácido fraco existente apenas em solução — extremamente instável no estado puro. Decompõe-se rapidamente pela luz (2HClO → 2HCl + O₂). Cl está no NOX +1 — estado oxidante. O cloro livre em piscinas é a soma de [HClO] + [ClO⁻]. pH determina a proporção entre as duas formas.',
  },

  /* ══════════════════════════════════════════════════════════════
     BASES — novas
  ══════════════════════════════════════════════════════════════ */

  {
    id: 'baoh2', formula: 'Ba(OH)₂', formulaId: 'Ba(OH)2',
    nome: 'Hidróxido de Bário', funcao: 'base', categoria: 'Bases Fortes',
    massa: '171,34 g/mol', Tf: 78, Tb: null, densidade: '2,18 g/cm³',
    solubilidade: '3,89 g/100 mL a 20 °C (mais solúvel que Ca(OH)₂)',
    ph: '> 13 (solução saturada)',
    nomenclatura: 'Hidróxido de bário (IUPAC: hidróxido de bário)',
    badges: ['forte','divalente','precipita SO₄²⁻','bário tóxico'],
    geometria: 'Octaédrica (estrutura cristalina)',
    ligacao: 'Iônica; Ba²⁺ e 2 OH⁻',
    pfStr: '78 °C (·8H₂O)', peStr: '—',
    equacao: 'Ba(OH)₂(s) → Ba²⁺(aq) + 2 OH⁻(aq)  [dissociação total]',
    reacao: 'Com H₂SO₄:\nBa(OH)₂ + H₂SO₄ → BaSO₄↓ + 2 H₂O\n\nCom NH₄Cl:\nBa(OH)₂·8H₂O + 2 NH₄Cl → BaCl₂ + 10 H₂O + 2 NH₃',
    lewis: 'base_forte',
    uso: 'Indicador de CO₂ (forma BaCO₃ branco), purificação de H₂SO₄ (remove Cl⁻), produção de BaSO₄ (sulfato de bário — contraste em raio-X), análise química',
    curiosidade: 'Ba(OH)₂ + 2NH₄Cl é uma das reações que mais resfria — mistura endotérmica que atinge −20 °C! O Ba²⁺ livre é altamente tóxico (bloqueia canais de K⁺), mas BaSO₄ é completamente inerte — usado para raio-X do trato gastrointestinal.',
    descricao: 'Sólido branco, base forte divalente. Mais solúvel que Ca(OH)₂. Reage com H₂SO₄ produzindo BaSO₄ insolúvel (Kps = 1,1×10⁻¹⁰) — reação usada para detectar SO₄²⁻. A reação com NH₄Cl·8H₂O é excelente exemplo de reação endotérmica — congela a superfície.',
  },

  {
    id: 'aloh3', formula: 'Al(OH)₃', formulaId: 'Al(OH)3',
    nome: 'Hidróxido de Alumínio', funcao: 'base', categoria: 'Hidróxidos Anfóteros',
    massa: '78,00 g/mol', Tf: 300, Tb: null, densidade: '2,42 g/cm³',
    solubilidade: 'Praticamente insolúvel (Kps = 1,9×10⁻³³)',
    ph: '—  (anfótero)',
    nomenclatura: 'Hidróxido de alumínio (IUPAC: hidróxido de alumínio)',
    badges: ['anfótero','antiácido','retardante de chama','insolúvel'],
    geometria: 'Octaédrica (estrutura gibbsita)',
    ligacao: 'Iônico-covalente; Al³⁺ e 3 OH⁻',
    pfStr: '300 °C (decomp.)', peStr: '—',
    equacao: 'Al(OH)₃ + 3 H⁺ → Al³⁺ + 3 H₂O  (comportamento ácido)\nAl(OH)₃ + OH⁻ → [Al(OH)₄]⁻  (comportamento básico)',
    reacao: 'Com ácido:\nAl(OH)₃ + 3 HCl → AlCl₃ + 3 H₂O\n\nCom base:\nAl(OH)₃ + NaOH → NaAlO₂ + 2 H₂O',
    lewis: 'base_fraca',
    uso: 'Antiácido estomacal (Maalox, Mylanta), retardante de chama em plásticos, coagulante em tratamento de água, produção de Al₂O₃ (alumina — abrasivo e cerâmica)',
    curiosidade: 'Al(OH)₃ é anfótero: dissolve tanto em ácido quanto em base — propriedade raríssima! Comprimidos de antiácido contêm Al(OH)₃: neutraliza HCl sem elevar muito o pH (tamponamento suave). Decompõe a 300 °C liberando H₂O — por isso é retardante de chama: resfria e dilui O₂.',
    descricao: 'Sólido branco gelatinoso. Anfótero clássico — comporta-se como base com ácidos e como ácido com bases. Kps = 1,9×10⁻³³ (praticamente insolúvel). Mineral natural: gibbsita (Al(OH)₃) é o componente principal da bauxita — minério do alumínio.',
  },

  {
    id: 'feoh3', formula: 'Fe(OH)₃', formulaId: 'Fe(OH)3',
    nome: 'Hidróxido de Ferro III', funcao: 'base', categoria: 'Hidróxidos Insolúveis',
    massa: '106,87 g/mol', Tf: null, Tb: null, densidade: '3,12 g/cm³',
    solubilidade: 'Praticamente insolúvel (Kps = 2,8×10⁻³⁹)',
    ph: '—  (base insolúvel)',
    nomenclatura: 'Hidróxido de ferro(III) / hidróxido férrico',
    badges: ['insolúvel','marrom-ferrugem','coloide','base fraca'],
    geometria: 'Octaédrica (Fe³⁺ coordenado por 6 OH⁻)',
    ligacao: 'Iônico-covalente; Fe³⁺ e 3 OH⁻',
    pfStr: 'decomp. ~500°C', peStr: '—',
    equacao: 'Fe(OH)₃(s) ⇌ Fe³⁺(aq) + 3 OH⁻(aq)  [Kps = 2,8×10⁻³⁹]',
    reacao: 'Formação:\nFeCl₃ + 3 NaOH → Fe(OH)₃↓ + 3 NaCl\n\nDecomposição:\n2 Fe(OH)₃ →(Δ)→ Fe₂O₃ + 3 H₂O',
    lewis: 'base_fraca',
    uso: 'Coagulante em tratamento de água (forma coloide que arrasta impurezas), pigmento marrom (ocre — Fe(OH)₃ natural = limonita), antídoto para envenenamento por arsênio',
    curiosidade: 'Fe(OH)₃ forma um coloide marrom-alaranjado que é o principal agente de coagulação em ETAs (Estações de Tratamento de Água) — o FeCl₃ adicionado precipita como Fe(OH)₃ coloidal que arrasta partículas em suspensão por adsorção. É a ferrugem hidratada!',
    descricao: 'Precipitado gelatinoso marrom-alaranjado. Kps = 2,8×10⁻³⁹ — extremamente insolúvel. Base fraca. Forma facilmente coloides de Fe(OH)₃ que adsorvem contaminantes. Decompõe-se a ~500°C formando Fe₂O₃ (óxido vermelho). A "ferrugem" é uma mistura de Fe₂O₃ e Fe(OH)₃.',
  },

  /* ══════════════════════════════════════════════════════════════
     SAIS — novos
  ══════════════════════════════════════════════════════════════ */

  {
    id: 'nahco3', formula: 'NaHCO₃', formulaId: 'NaHCO3',
    nome: 'Bicarbonato de Sódio', funcao: 'sal', categoria: 'Sais Ácidos',
    massa: '84,01 g/mol', Tf: null, Tb: null, densidade: '2,20 g/cm³',
    solubilidade: '9,6 g/100 mL a 20 °C',
    ph: '8,3 (solução 0,1 mol·L⁻¹) — levemente básico',
    nomenclatura: 'Hidrogenocarbonato de sódio / bicarbonato de sódio (IUPAC)',
    badges: ['sal ácido','antiácido','fermento','hidrólise básica'],
    geometria: 'HCO₃⁻ planar (ânion bicarbonato)',
    ligacao: 'Iônico; Na⁺ e HCO₃⁻',
    pfStr: '50 °C (decomp.)', peStr: '—',
    equacao: 'NaHCO₃ → Na⁺ + HCO₃⁻ \nHCO₃⁻ + H⁺ → H₂CO₃ → H₂O + CO₂',
    reacao: 'Com ácido:\nNaHCO₃ + HCl → NaCl + H₂O + CO₂\n\nDecomposição:\n2 NaHCO₃ →(Δ)→ Na₂CO₃ + H₂O + CO₂',
    lewis: 'sal_ionico',
    uso: 'Fermento em pó (libera CO₂ pelo calor ou ácido), antiácido estomacal, extintor de incêndio classe B, limpeza suave, controle de pH em piscinas',
    curiosidade: 'NaHCO₃ reage com ácidos liberando CO₂ — base dos bolos! "Bicarbonato + vinagre = vulcão de escola". Como antiácido, neutraliza HCl gástrico mas pode causar eructação (arroto de CO₂). Extintor de pó BC usa NaHCO₃ que decompõe liberando CO₂ e Na₂CO₃.',
    descricao: 'Pó branco cristalino, sabor levemente salino-alcalino. Sal ácido (tem 1 H ionizável no HCO₃⁻). Solução levemente básica (pH 8,3) por hidrólise do HCO₃⁻. Decompõe-se a partir de 50 °C. Um dos produtos químicos mais versáteis do cotidiano.',
  },

  {
    id: 'kno3', formula: 'KNO₃', formulaId: 'KNO3',
    nome: 'Nitrato de Potássio', funcao: 'sal', categoria: 'Nitratos',
    massa: '101,10 g/mol', Tf: 334, Tb: 400, densidade: '2,11 g/cm³',
    solubilidade: '31,6 g/100 mL a 20 °C; 247 g a 100 °C',
    ph: '~7 (neutro)',
    nomenclatura: 'Nitrato de potássio / salitre (IUPAC: nitrato de potássio)',
    badges: ['oxidante','salitre','fertilizante','pólvora'],
    geometria: 'Trigonal planar NO₃⁻',
    ligacao: 'Iônico; K⁺ e NO₃⁻',
    pfStr: '334 °C', peStr: '400 °C (decomp.)',
    equacao: 'KNO₃ →(Δ 400°C)→ KNO₂ + ½ O₂  (decomposição)',
    reacao: 'Pólvora negra:\n75 KNO₃ + 15 C + 10 S → gases + calor (mistura)\n\nNeutralização:\nKOH + HNO₃ → KNO₃ + H₂O',
    lewis: 'sal_ionico',
    uso: 'Componente da pólvora negra (75% KNO₃, 15% C, 10% S), fertilizante (fonte de K e N), conservante de carnes (cura), fumo de cachimbo, fogos de artifício',
    curiosidade: 'KNO₃ (salitre) foi o ingrediente mais valioso da pólvora por séculos — guerras eram travadas pela posse de fontes de salitre. O Brasil colonial exportava salitre das cavernas de morcegos (fezes = nitratos). No forno de churrasco, NaNO₃ nas carnes conserva e dá cor avermelhada.',
    descricao: 'Cristais brancos inodoros. Oxidante poderoso em altas temperaturas — fornece O₂ para combustões. Muito solúvel, com solubilidade crescente com temperatura. Fertilizante de alto valor: fornece K⁺ e NO₃⁻ (ambos essenciais). Não confundir com NaNO₃ (salitre do Chile).',
  },

  {
    id: 'caco3', formula: 'CaCO₃', formulaId: 'CaCO3',
    nome: 'Carbonato de Cálcio', funcao: 'sal', categoria: 'Carbonatos',
    massa: '100,09 g/mol', Tf: null, Tb: null, densidade: '2,71 g/cm³ (calcita)',
    solubilidade: '0,0013 g/100 mL a 20 °C (praticamente insolúvel)',
    ph: '~9,9 (solução saturada)',
    nomenclatura: 'Carbonato de cálcio / calcário / calcita / mármore',
    badges: ['insolúvel','calcário','mármore','antiácido'],
    geometria: 'Trigonal planar CO₃²⁻',
    ligacao: 'Iônico; Ca²⁺ e CO₃²⁻',
    pfStr: '825 °C (decomp.)', peStr: '—',
    equacao: 'CaCO₃(s) ⇌ Ca²⁺(aq) + CO₃²⁻(aq)  [Kps = 3,4×10⁻⁹]',
    reacao: 'Com ácido:\nCaCO₃ + 2 HCl → CaCl₂ + H₂O + CO₂\n\nCalcinação:\nCaCO₃ →(900°C)→ CaO + CO₂',
    lewis: 'sal_ionico',
    uso: 'Construção civil (cimento, cal), antiácido (Tums, Calafate), suplemento de cálcio, fabricação de vidro, correção de acidez do solo, mármore e calcário natural',
    curiosidade: 'CaCO₃ existe em 3 formas cristalinas: calcita (hexagonal), aragonita (ortorrômbica) e vaterita. Cascas de ovos e conchas são CaCO₃. O processo de formação de cavernas: CaCO₃ + H₂O + CO₂ → Ca(HCO₃)₂ (solúvel) — dissolve o calcário. Evaporação reconverte para CaCO₃ (estalactites).',
    descricao: 'Sólido branco praticamente insolúvel. O mineral mais abundante da crosta terrestre (~4%). Decompõe-se a 900 °C (calcinação) produzindo CaO (cal viva) — base da indústria cimenteira. Reage com ácidos (HCl, H₂SO₄, chuva ácida) liberando CO₂. Polimorfo: calcita, aragonita.',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf:null no catálogo original (decompõe a 825°C em vez de fundir), porém quimicamente é um sólido (mineral calcário/mármore) — usa-se aqui o dado real. Geometria trigonal do ânion CO₃²⁻ já descrita.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'solido',
      tipoLigacao: 'ionico',
      polaridade: 'polar',
      geometria: 'trigonal',
    },
    regra: {
      tipo: 'sal (oxossal)',
      descricao: 'Sal do ácido carbônico: cátion Ca²⁺ + ânion carbonato (CO₃²⁻), sufixo -ato preservado do ácido de origem.',
      padrao: '[Cátion] + [ânion]ato → [ânion]ato de [cátion]',
      exemplo: 'Ca²⁺ + CO₃²⁻ → CaCO₃ (carbonato de cálcio)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.4',
    },
  },

  {
    id: 'baso4', formula: 'BaSO₄', formulaId: 'BaSO4',
    nome: 'Sulfato de Bário', funcao: 'sal', categoria: 'Sulfatos Insolúveis',
    massa: '233,39 g/mol', Tf: 1580, Tb: null, densidade: '4,49 g/cm³',
    solubilidade: '0,000245 g/100 mL a 25 °C — ultra insolúvel',
    ph: '~7 (neutro)',
    nomenclatura: 'Sulfato de bário / barita (IUPAC: sulfato de bário)',
    badges: ['ultra insolúvel','contraste RX','pigmento','Kps baixíssimo'],
    geometria: 'SO₄²⁻ tetraédrico',
    ligacao: 'Iônico; Ba²⁺ e SO₄²⁻',
    pfStr: '1580 °C', peStr: '—',
    equacao: 'BaSO₄(s) ⇌ Ba²⁺(aq) + SO₄²⁻(aq)  [Kps = 1,1×10⁻¹⁰]',
    reacao: 'Precipitação:\nBaCl₂ + Na₂SO₄ → BaSO₄↓ + 2 NaCl\n\nTeste:\nBa²⁺ + SO₄²⁻ → BaSO₄↓ (branco — confirma SO₄²⁻)',
    lewis: 'sal_ionico',
    uso: 'Contraste em raio-X gastrointestinal ("papa de bário"), pigmento branco (branco permanente), cargas em tintas/borracha, fluidos de perfuração petrolífera (barita)',
    curiosidade: 'BaSO₄ é inerte biologicamente pois é ultra insolúvel — o Ba²⁺ livre é tóxico mas BaSO₄ atravessa o trato GI sem dissolver! Usado em suspenão para raio-X: Ba⁵⁶ absorve muito raio-X por seu alto número atômico. Precipitado branco com Ba²⁺ + SO₄²⁻ é o teste clássico de sulfatos.',
    descricao: 'Sólido branco praticamente insolúvel em água, ácidos e bases (Kps = 1,1×10⁻¹⁰). Muito denso (4,49 g/cm³). Pigmento "branco permanente" — não amarela. Inerte quimicamente em condições normais. Mineral natural: barita. Principal teste de SO₄²⁻ em análise química qualitativa.',
  },

  {
    id: 'znso4', formula: 'ZnSO₄', formulaId: 'ZnSO4',
    nome: 'Sulfato de Zinco', funcao: 'sal', categoria: 'Sulfatos Solúveis',
    massa: '161,47 g/mol', Tf: null, Tb: null, densidade: '3,54 g/cm³ (anidro)',
    solubilidade: '57,7 g/100 mL a 20 °C',
    ph: '4,4–5,0 (hidrólise ácida)',
    nomenclatura: 'Sulfato de zinco (IUPAC: sulfato de zinco)',
    badges: ['solúvel','inseticida','fungicida','suplemento Zn'],
    geometria: 'Octaédrica [Zn(H₂O)₆]²⁺ em solução',
    ligacao: 'Iônico; Zn²⁺ e SO₄²⁻',
    pfStr: '680 °C (anidro)', peStr: '—',
    equacao: 'ZnSO₄ → Zn²⁺(aq) + SO₄²⁻(aq)',
    reacao: 'Formação:\nZn + H₂SO₄ → ZnSO₄ + H₂\n\nPrecipitação:\nZnSO₄ + 2 NaOH → Zn(OH)₂↓ + Na₂SO₄',
    lewis: 'sal_colorido',
    uso: 'Galvanização (banho eletrolítico de Zn), fungicida e inseticida agrícola (calda bordalesa de Zn), suplemento mineral para plantas, tratamento de água, indústria têxtil (mordente)',
    curiosidade: 'ZnSO₄·7H₂O é o "vitriolo branco" — irmão do "vitriolo azul" (CuSO₄·5H₂O). O zinco é essencial para >300 enzimas humanas. Deficiência de Zn causa anosmia (perda de olfato) — tema atual pós-COVID. A calda vitriolada (ZnSO₄ + CuSO₄) é fungicida clássico.',
    descricao: 'Sólido branco cristalino (anidro) ou cristais incolores (·7H₂O — vitriolo branco). Solução levemente ácida (hidrólise de Zn²⁺). Zn²⁺ é cofator enzimático essencial. Formado naturalmente por oxidação de sulfetos de zinco (ZnS + O₂ + H₂O). Galvanização eletrolítica usa ZnSO₄ como eletrólito.',
  },

  {
    id: 'feso4', formula: 'FeSO₄', formulaId: 'FeSO4',
    nome: 'Sulfato de Ferro II', funcao: 'sal', categoria: 'Sulfatos de Metais de Transição',
    massa: '151,91 g/mol', Tf: null, Tb: null, densidade: '3,65 g/cm³ (anidro)',
    solubilidade: '26,3 g/100 mL a 20 °C',
    ph: '3,7 (hidrólise ácida)',
    nomenclatura: 'Sulfato de ferro(II) / sulfato ferroso / vitriolo verde (IUPAC)',
    badges: ['vitriolo verde','anemia','redutor','oxidável'],
    geometria: 'Octaédrica [Fe(H₂O)₆]²⁺ em solução',
    ligacao: 'Iônico; Fe²⁺ e SO₄²⁻',
    pfStr: '300 °C (decomp.)', peStr: '—',
    equacao: 'FeSO₄ → Fe²⁺(aq) + SO₄²⁻(aq)\n4 FeSO₄ + O₂ + 2 H₂SO₄ → 2 Fe₂(SO₄)₃ + 2 H₂O  (oxidação ao ar)',
    reacao: 'Formação:\nFe + H₂SO₄(dil.) → FeSO₄ + H₂\n\nOxidação:\n2 FeSO₄ + H₂SO₄ + H₂O₂ → Fe₂(SO₄)₃ + 2 H₂O',
    lewis: 'sal_colorido',
    uso: 'Suplemento de ferro (tratamento de anemia ferropriva), redutor em síntese química, tinta de ferro galotanato (manuscritos medievais), tratamento de água residual, produção de pigmentos',
    curiosidade: 'FeSO₄·7H₂O ("vitriolo verde") foi usado por séculos para fazer tinta ferrogálica — a tinta com que manuscritos medievais e a Constituição dos EUA foram escritos. Oxida ao ar para Fe₂(SO₄)₃ (amarelo) — por isso soluções de FeSO₄ envelhecem. Tratamento de anemia: 200 mg/dia de FeSO₄.',
    descricao: 'Cristais verde-azulados (·7H₂O) ou pó branco-acinzentado (anidro). Solução levemente ácida. Fe²⁺ é oxidado facilmente a Fe³⁺ pelo O₂ do ar. Redutor útil em síntese. Mineral natural: melanterita (FeSO₄·7H₂O). Essencial para a hemoglobina (centro Fe do grupo heme).',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf:null (decompõe ~300°C), porém é sólido cristalino ("Cristais verde-azulados") — dado real usado. Geometria tetraédrica do ânion SO₄²⁻ (padrão dos sulfatos no catálogo).
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'solido',
      tipoLigacao: 'ionico',
      polaridade: 'polar',
      geometria: 'tetraedrica',
    },
    regra: {
      tipo: 'sal (oxossal de metal de transição)',
      descricao: 'Cátion Fe²⁺ (NOX +2, algarismo romano) + ânion sulfato.',
      padrao: 'Sulfato de [metal](NOX romano)',
      exemplo: 'Fe²⁺ + SO₄²⁻ → FeSO₄ (sulfato de ferro II)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.4',
    },
  },

  {
    id: 'kmno4', formula: 'KMnO₄', formulaId: 'KMnO4',
    nome: 'Permanganato de Potássio', funcao: 'sal', categoria: 'Oxossais Oxidantes',
    massa: '158,03 g/mol', Tf: null, Tb: null, densidade: '2,70 g/cm³',
    solubilidade: '6,4 g/100 mL a 20 °C',
    ph: '~7–8',
    nomenclatura: 'Permanganato de potássio (IUPAC: tetraoxomanganato(VII) de potássio)',
    badges: ['oxidante forte','roxo','Mn⁺⁷','antiséptico'],
    geometria: 'Tetraédrica MnO₄⁻',
    ligacao: 'Iônico; K⁺ e MnO₄⁻',
    pfStr: 'decompõe ~240°C', peStr: '—',
    equacao: '2 KMnO₄ →(Δ)→ K₂MnO₄ + MnO₂ + O₂  (decomposição)',
    reacao: 'Em meio ácido:\nMnO₄⁻ + 5 e⁻ + 8 H⁺ → Mn²⁺ + 4 H₂O  (incolor)\n\nEm meio básico:\nMnO₄⁻ + 3 e⁻ → MnO₂↓  (marrom)',
    lewis: 'sal_colorido',
    uso: 'Volumetria (permanganatometria), oxidante em síntese orgânica, tratamento de água (elimina Fe²⁺, Mn²⁺, H₂S), antisséptico (Permanganato 1:10.000), branqueamento de fibras',
    curiosidade: 'KMnO₄ é o oxidante roxo mais famoso da química. Em solução ácida fica incolor (Mn⁷⁺→Mn²⁺) — base da permanganatometria. Em básico fica marrom (MnO₂). 1 mol de KMnO₄ aceita 5 elétrons em ácido (potência oxidante enorme). Usado para tratar pé-de-atleta e infecções fúngicas.',
    descricao: 'Cristais roxo-escuros, quase negros. Solução violeta intensa. Mn está no NOX +7 — estado mais oxidado do Mn. Decompõe-se ao calor liberando O₂. Mancha a pele de marrom-escuro (MnO₂). Indicador próprio em volumetria (descoloração = ponto de viragem).',
    /* ═══ MÓDULOS 1(regra)/2(classificacoes) — Plano de Ação SIQI Modular (2026)
       Tf:null (decompõe ~240°C), porém é sólido cristalino ("Cristais roxo-escuros") — dado real usado. Geometria tetraédrica do ânion MnO₄⁻ já descrita.
       Fontes: IUPAC Red Book 2005; Brown, LeMay & Bursten (2012)
       "Chemistry: The Central Science" 12ª ed.; NIST WebBook. ═══ */
    classificacoes: {
      estadoFisico: 'solido',
      tipoLigacao: 'ionico',
      polaridade: 'polar',
      geometria: 'tetraedrica',
    },
    regra: {
      tipo: 'sal (oxossal, ânion complexo)',
      descricao: 'Cátion K⁺ + ânion permanganato (MnO₄⁻), Mn no NOX máximo +7. Nome sistemático: tetraoxomanganato(VII).',
      padrao: 'Nomenclatura sistemática: tetraoxo[metal]ato(NOX) de [cátion]',
      exemplo: 'K⁺ + MnO₄⁻ → KMnO₄ (permanganato de potássio)',
      fonte: 'IUPAC Red Book 2005, Seção IR-8.4',
    },
  },

  {
    id: 'alcl3', formula: 'AlCl₃', formulaId: 'AlCl3',
    nome: 'Cloreto de Alumínio', funcao: 'sal', categoria: 'Haletos de Metais',
    massa: '133,34 g/mol', Tf: 192.6, Tb: 180, densidade: '2,48 g/cm³',
    solubilidade: '43,9 g/100 mL a 0 °C (hidrólise violenta)',
    ph: '3–4 (hidrólise ácida intensa)',
    nomenclatura: 'Cloreto de alumínio / tricloreto de alumínio (IUPAC)',
    badges: ['Lewis ácido','catalisador','hidrólise violenta','sublima'],
    geometria: 'Trigonal planar (Al—Cl₃) — dímero Al₂Cl₆ no sólido',
    ligacao: 'Covalente polar (≠ sal iônico típico); ligação dativa Al←Cl',
    pfStr: '192,6 °C (2,5 atm)', peStr: '180 °C (sublima)',
    equacao: 'AlCl₃ + 3 H₂O → Al(OH)₃ + 3 HCl  (hidrólise)',
    reacao: 'Catálise Friedel-Crafts:\nC₆H₆ + RCl →(AlCl₃)→ C₆H₅R + HCl\n\nFormação:\n2 Al + 3 Cl₂ → 2 AlCl₃',
    lewis: 'sal_ionico',
    uso: 'Catalisador de Friedel-Crafts (síntese orgânica — mais de 100 reações industriais), coagulante em tratamento de água, desodorantes (antiperspirante — bloqueia poros), produção de Al puro',
    curiosidade: 'AlCl₃ é um ácido de Lewis clássico — aceita par de elétrons do Cl⁻ do cloreto de alquila, formando carbocátion. Base de toda a catálise de Friedel-Crafts (produção de plásticos, corantes, fármacos). Antiperspirante: AlCl₃ se hidrolisa e forma gel de Al(OH)₃ que obstrui poros de suor.',
    descricao: 'Sólido amarelo-esbranquiçado que sublima a 180 °C. Comporta-se como ácido de Lewis (aceita par de elétrons). Reage violentamente com água liberando HCl (hidrólise). Dímero Al₂Cl₆ no estado sólido e gasoso. Principal catalisador na síntese orgânica industrial (alquilação, acilação Friedel-Crafts).',
  },

  /* ══════════════════════════════════════════════════════════════
     ÓXIDOS — novos
  ══════════════════════════════════════════════════════════════ */

  {
    id: 'n2o5', formula: 'N₂O₅', formulaId: 'N2O5',
    nome: 'Pentóxido de Dinitrogênio', funcao: 'oxido', categoria: 'Óxidos Ácidos',
    massa: '108,01 g/mol', Tf: 41, Tb: null, densidade: '1,64 g/cm³',
    solubilidade: 'Reage explosivamente com água → 2 HNO₃',
    ph: '< 1 (reage com H₂O → HNO₃)',
    nomenclatura: 'Pentóxido de dinitrogênio / anidrido nítrico (IUPAC)',
    badges: ['anidrido nítrico','oxidante','instável','N⁺⁵'],
    geometria: 'O₂N–O–NO₂ (linear simétrico)',
    ligacao: 'Covalente; N no NOX +5',
    pfStr: '41 °C', peStr: 'decompõe ~47°C',
    equacao: 'N₂O₅ + H₂O → 2 HNO₃  (anidrido do ácido nítrico)',
    reacao: 'Com água:\nN₂O₅ + H₂O → 2 HNO₃\n\nCom base:\nN₂O₅ + 2 NaOH → 2 NaNO₃ + H₂O',
    lewis: 'oxido_acido',
    uso: 'Síntese de HNO₃ anidro (nitração de compostos orgânicos), oxidante em propelentes sólidos de foguetes, agente de nitração em síntese orgânica de explosivos',
    curiosidade: 'N₂O₅ é o anidrido do HNO₃ — ou seja, HNO₃ "sem água". Reage tão violentamente com H₂O que pode explodir se molhado. Formado na estratosfera: N₂O₅ + H₂O → 2 HNO₃ (contribui para a chuva ácida). É sólido à temperatura ambiente mas extremamente instável acima de 47°C.',
    descricao: 'Sólido branco, extremamente instável e oxidante. Decompõe-se espontaneamente: 2N₂O₅ → 4NO₂ + O₂. Anidrido do HNO₃ — reage com água para regenerar o ácido. Importante em química atmosférica: formado pela reação de NO₃• radical com NO₂ na estratosfera noturna.',
  },

  {
    id: 'p2o5', formula: 'P₂O₅', formulaId: 'P2O5',
    nome: 'Pentóxido de Fósforo', funcao: 'oxido', categoria: 'Óxidos Ácidos',
    massa: '141,94 g/mol', Tf: 340, Tb: null, densidade: '2,30 g/cm³',
    solubilidade: 'Reage violentamente com água → H₃PO₄',
    ph: '< 1 (reage com H₂O → H₃PO₄)',
    nomenclatura: 'Pentóxido de difósforo / anidrido fosfórico (IUPAC: decaóxido de tetrafósforo — P₄O₁₀)',
    badges: ['anidrido fosfórico','dessecante','P₄O₁₀','higroscópico extremo'],
    geometria: 'P₄O₁₀ real (quatro P em tetraedro com O conectando)',
    ligacao: 'Covalente; P no NOX +5; fórmula molecular P₄O₁₀',
    pfStr: '340 °C', peStr: '—',
    equacao: 'P₂O₅ + 3 H₂O → 2 H₃PO₄  (anidrido do ácido fosfórico)',
    reacao: 'Com água:\nP₄O₁₀ + 6 H₂O → 4 H₃PO₄\n\nCom base:\nP₂O₅ + 6 KOH → 2 K₃PO₄ + 3 H₂O',
    lewis: 'oxido_acido',
    uso: 'Dessecante mais potente conhecido (absorve até 0,1 mg H₂O/L de ar), síntese de H₃PO₄, agente de desidratação em síntese orgânica, produção de ésteres fosfóricos',
    curiosidade: 'P₂O₅ (fórmula mínima; real = P₄O₁₀) é o dessecante mais eficiente já descoberto — absorve 35% do seu peso em água! Usado em dessecadores para manter amostras absolutamente secas. Reage tão violentemente com água que provoca queimaduras por "desidratação dos tecidos".',
    descricao: 'Pó branco higroscópio em grau extremo. Fórmula molecular correta é P₄O₁₀. P em NOX +5 — estado mais oxidado do fósforo. Dessecante mais eficiente disponível. Reage violentamente com água e umidade. Anidrido do H₃PO₄ — reage com água formando o ácido fosfórico.',

  },

  /* ────────────────────────────────────────────────────────────
     EXPANSÃO 3 — Novos compostos (inseridos no catálogo estático)
     Fontes: NIST WebBook, CRC Handbook 2024, IUPAC Red Book 2005
  ──────────────────────────────────────────────────────────── */

  {
    id: 'na2so4', formula: 'Na₂SO₄', formulaId: 'Na2SO4',
    nome: 'Sulfato de Sódio', funcao: 'sal', categoria: 'Sais de Sódio',
    massa: '142,04 g/mol', Tf: 884, Tb: 1429, densidade: '2,66 g/cm³',
    solubilidade: 'Solúvel (19,4 g/100 mL a 25°C)',
    ph: '7–9 (levemente alcalino)',
    nomenclatura: 'Sulfato de sódio (Sal de Glauber: Na₂SO₄·10H₂O)',
    badges: ['sal neutro','higroscópico','laxante'],
    geometria: 'Iônica; SO₄²⁻ tetraédrico', ligacao: 'Iônica (Na⁺ e SO₄²⁻)',
    equacao: 'Na₂SO₄ → 2 Na⁺(aq) + SO₄²⁻(aq)',
    reacao: '2 NaOH(aq) + H₂SO₄(aq) → Na₂SO₄(aq) + 2 H₂O(l)',
    lewis: 'sal_ionico',
    uso: 'Produção de papel kraft, detergentes, vidro e laxante (sal de Glauber)',
    curiosidade: 'O decaidrato Na₂SO₄·10H₂O (sal de Glauber) libera 252 kJ/kg ao perder água — usado em sistemas de armazenamento de energia solar.',
    descricao: 'Sal formado pela neutralização total do H₂SO₄ dibásico com 2 mol de NaOH. Produzido via processo Mannheim (NaCl + H₂SO₄). Principal uso: produção de celulose (papel kraft).',
  },

  {
    id: 'k2so4', formula: 'K₂SO₄', formulaId: 'K2SO4',
    nome: 'Sulfato de Potássio', funcao: 'sal', categoria: 'Sais de Potássio',
    massa: '174,26 g/mol', Tf: 1069, Tb: 1689, densidade: '2,66 g/cm³',
    solubilidade: 'Moderadamente solúvel (11,1 g/100 mL a 20°C)',
    ph: '7–8',
    nomenclatura: 'Sulfato de potássio',
    badges: ['fertilizante','sem cloro','sal neutro'],
    geometria: 'Iônica; SO₄²⁻ tetraédrico', ligacao: 'Iônica (K⁺ e SO₄²⁻)',
    equacao: 'K₂SO₄ → 2 K⁺(aq) + SO₄²⁻(aq)',
    reacao: '2 KOH(aq) + H₂SO₄(aq) → K₂SO₄(aq) + 2 H₂O(l)',
    lewis: 'sal_ionico',
    uso: 'Fertilizante agrícola (K⁺ sem Cl⁻ para tabaco e frutas), vidro especial e alume',
    curiosidade: 'Preferido ao KCl em solos onde Cl⁻ é prejudicial. Demanda global supera 7 milhões de toneladas/ano.',
    descricao: 'Sal de alta importância agrícola. Formado pela neutralização de KOH com H₂SO₄. Preferido ao KCl em solos arenosos onde o excesso de Cl⁻ prejudica culturas sensíveis.',
  },

  {
    id: 'mgso4', formula: 'MgSO₄', formulaId: 'MgSO4',
    nome: 'Sulfato de Magnésio', funcao: 'sal', categoria: 'Sais de Magnésio',
    massa: '120,37 g/mol', Tf: 1124, Tb: null, densidade: '2,66 g/cm³',
    solubilidade: 'Muito solúvel (26,9 g/100 mL a 0°C; 71 g/100 mL a 100°C)',
    ph: '6–7',
    nomenclatura: 'Sulfato de magnésio (Sal de Epsom: MgSO₄·7H₂O)',
    badges: ['sal de Epsom','medicinal','fertilizante'],
    geometria: 'Iônica; SO₄²⁻ tetraédrico', ligacao: 'Iônica (Mg²⁺ e SO₄²⁻)',
    equacao: 'MgSO₄ → Mg²⁺(aq) + SO₄²⁻(aq)',
    reacao: 'MgO(s) + H₂SO₄(aq) → MgSO₄(aq) + H₂O(l)',
    lewis: 'sal_ionico',
    uso: 'Medicina (anticonvulsivante IV, laxante), agricultura (Mg para plantas), curtume',
    curiosidade: 'O sal de Epsom (MgSO₄·7H₂O) vem de uma fonte mineral em Epsom, Inglaterra. O Mg²⁺ é cofator de mais de 300 enzimas humanas. O MgSO₄ IV é padrão-ouro no tratamento de eclâmpsia.',
    descricao: 'Produto da reação entre MgO e H₂SO₄. O heptaidrato (sal de Epsom) é usado em banhos terapêuticos. Clinicamente, MgSO₄ IV é o tratamento de referência para eclâmpsia e convulsões neonatais.',
  },

  {
    id: 'cacl2', formula: 'CaCl₂', formulaId: 'CaCl2',
    nome: 'Cloreto de Cálcio', funcao: 'sal', categoria: 'Sais de Cálcio',
    massa: '110,98 g/mol', Tf: 772, Tb: 1935, densidade: '2,15 g/cm³',
    solubilidade: 'Muito solúvel (74,5 g/100 mL a 20°C); dissolução exotérmica',
    ph: '6,5–8,5',
    nomenclatura: 'Cloreto de cálcio',
    badges: ['higroscópico','descongelante','exotérmico'],
    geometria: 'Iônica', ligacao: 'Iônica (Ca²⁺ e Cl⁻)',
    equacao: 'CaCl₂ → Ca²⁺(aq) + 2 Cl⁻(aq)',
    reacao: 'Ca(OH)₂(aq) + 2 HCl(aq) → CaCl₂(aq) + 2 H₂O(l)',
    lewis: 'sal_ionico',
    uso: 'Descongelante de estradas, secante industrial, conservante alimentar (E509), reposição de Ca²⁺ IV',
    curiosidade: 'O CaCl₂ libera calor ao dissolver-se em água (ΔH = −81,3 kJ/mol) — por isso é usado em compressas quentes descartáveis. Abaixa o ponto de fusão do gelo até −51°C, superando o NaCl.',
    descricao: 'Sal iônico muito solúvel e exotérmico. Formado pela neutralização do Ca(OH)₂ com HCl. Usado como descongelante pois abaixa o ponto de fusão da água mais eficientemente que o NaCl.',
  },

  {
    id: 'cuoh2', formula: 'Cu(OH)₂', formulaId: 'Cu(OH)2',
    nome: 'Hidróxido de Cobre II', funcao: 'base', categoria: 'Bases Insolúveis',
    massa: '97,56 g/mol', Tf: null, Tb: null, densidade: '3,37 g/cm³',
    solubilidade: 'Insolúvel em água (Kps ≈ 2×10⁻¹⁹); solúvel em ácidos e NH₃',
    ph: '> 7',
    nomenclatura: 'Hidróxido de cobre(II)',
    badges: ['insolúvel','azul','fungicida','Fehling'],
    geometria: 'Octaédrica distorcida', ligacao: 'Iônica com caráter covalente',
    equacao: 'Cu(OH)₂ → Cu²⁺(aq) + 2 OH⁻(aq)  Kps = 2,2×10⁻²⁰',
    reacao: 'CuSO₄(aq) + 2 NaOH(aq) → Cu(OH)₂(s)↓ + Na₂SO₄(aq)',
    lewis: 'generico',
    uso: 'Fungicida agrícola (calda bordalesa), eletrodeposição de Cu, reagente de Fehling (detecção de glicose)',
    curiosidade: 'A Solução de Fehling usa Cu(OH)₂ em meio alcalino: reage com açúcares redutores formando Cu₂O vermelho tijolo — base do teste de glicose em urina. A calda bordalesa salva videiras desde 1885.',
    descricao: 'Precipitado azul formado pela reação entre CuSO₄ e NaOH. Exemplo clássico de dupla troca com precipitação. Decompõe-se a ~80°C formando CuO preto + H₂O.',
  },

  {
    id: 'feoh2', formula: 'Fe(OH)₂', formulaId: 'Fe(OH)2',
    nome: 'Hidróxido de Ferro II', funcao: 'base', categoria: 'Bases Insolúveis',
    massa: '89,86 g/mol', Tf: null, Tb: null, densidade: '3,40 g/cm³',
    solubilidade: 'Insolúvel em água (Kps ≈ 4,9×10⁻¹⁷); solúvel em ácidos',
    ph: '> 7',
    nomenclatura: 'Hidróxido de ferro(II)',
    badges: ['insolúvel','verde','oxidável','ferrugem'],
    geometria: 'Octaédrica (estrutura laminada)', ligacao: 'Iônica',
    equacao: 'Fe(OH)₂ → Fe²⁺(aq) + 2 OH⁻(aq)  Kps = 4,9×10⁻¹⁷',
    reacao: 'FeSO₄(aq) + 2 NaOH(aq) → Fe(OH)₂(s)↓ + Na₂SO₄(aq)',
    lewis: 'generico',
    uso: 'Intermediário na produção de Fe(OH)₃, tratamento de efluentes com Fe²⁺, pigmentos',
    curiosidade: 'O precipitado verde de Fe(OH)₂ oxida rapidamente ao ar: 4 Fe(OH)₂ + O₂ + 2H₂O → 4 Fe(OH)₃ (castanho). Essa transformação verde→ferrugem é observável em segundos ao agitar ao ar.',
    descricao: 'Base insolúvel verde, facilmente oxidável ao Fe(OH)₃ (castanho) na presença de O₂. Formado pela reação de sais de Fe²⁺ com bases fortes. Intermediário no ciclo biogeoquímico do ferro.',
  },

  {
    id: 'h2o2', formula: 'H₂O₂', formulaId: 'H2O2',
    nome: 'Peróxido de Hidrogênio', funcao: 'acido', categoria: 'Peróxidos',
    massa: '34,01 g/mol', Tf: -0.43, Tb: 150.2, densidade: '1,44 g/cm³',
    solubilidade: 'Miscível em água em todas as proporções',
    ph: '4,5–5,0 (solução 30%)',
    nomenclatura: 'Peróxido de hidrogênio (água oxigenada)',
    badges: ['oxidante','redutor','instável','antisséptico'],
    geometria: 'Angular não-plana (diedro 111,5°)', ligacao: 'Covalente polar; ligação O–O peroxídica',
    equacao: 'H₂O₂ ⇌ H⁺ + HO₂⁻   Ka = 2,4×10⁻¹²',
    reacao: '2 H₂O₂(l) →(MnO₂)→ 2 H₂O(l) + O₂(g)   [decomposição catalítica]',
    lewis: 'generico',
    uso: 'Antisséptico (3%), alvejante de papel e tecidos, propelente de foguetes (>90%), tratamento de efluentes',
    curiosidade: 'A enzima catalase (presente no sangue) decompõe H₂O₂ a 10⁷ vezes por segundo — a efervescência ao aplicar água oxigenada em um ferimento é esta reação. Elefante de pasta de dente usa H₂O₂ concentrado + KI.',
    descricao: 'Composto com ligação O–O peroxídica, mais oxidante que O₂. A catálise por MnO₂ ou pela enzima catalase gera O₂ rapidamente. Armazenado em frascos âmbar para retardar decomposição pela luz.',
  },

  {
    id: 'k2co3', formula: 'K₂CO₃', formulaId: 'K2CO3',
    nome: 'Carbonato de Potássio', funcao: 'sal', categoria: 'Sais de Potássio',
    massa: '138,21 g/mol', Tf: 891, Tb: null, densidade: '2,43 g/cm³',
    solubilidade: 'Muito solúvel (112 g/100 mL a 20°C)',
    ph: '11–12 (solução 1 mol/L)',
    nomenclatura: 'Carbonato de potássio (potassa)',
    badges: ['alcalino','higroscópico','vidro de cristal'],
    geometria: 'Iônica; CO₃²⁻ triangular plano', ligacao: 'Iônica (K⁺ e CO₃²⁻)',
    equacao: 'K₂CO₃ + H₂O ⇌ 2 K⁺ + HCO₃⁻ + OH⁻  (hidrólise básica)',
    reacao: '2 KOH(aq) + CO₂(g) → K₂CO₃(aq) + H₂O(l)',
    lewis: 'sal_ionico',
    uso: 'Produção de cristal de Bohemia (vidro óptico), sabão de potassa, fertilizante, indústria alimentícia',
    curiosidade: 'A potassa (K₂CO₃) era obtida lixiviando cinzas de madeira — daí o nome potássio (pot ash = cinza de pote). Historicamente o primeiro álcali industrial ocidental, usado em sabões desde o século XVII.',
    descricao: 'Sal higroscópico e alcalino em solução. Produzido pela eletrólise de KCl (processo Solvay adaptado). É a base do vidro de cristal (Bohemia) e cerâmica de alta qualidade. Reage com CO₂ formando KHCO₃.',
  },

  {
    id: 'pb_no3_2', formula: 'Pb(NO₃)₂', formulaId: 'Pb(NO3)2',
    nome: 'Nitrato de Chumbo II', funcao: 'sal', categoria: 'Sais de Chumbo',
    massa: '331,21 g/mol', Tf: 470, Tb: null, densidade: '4,53 g/cm³',
    solubilidade: 'Solúvel em água (56,5 g/100 mL a 20°C)',
    ph: '3,5–4,5',
    nomenclatura: 'Nitrato de chumbo(II)',
    badges: ['tóxico','oxidante','chuva dourada'],
    geometria: 'Iônica; NO₃⁻ triangular plano', ligacao: 'Iônica (Pb²⁺ e NO₃⁻)',
    equacao: 'Pb(NO₃)₂ → Pb²⁺(aq) + 2 NO₃⁻(aq)',
    reacao: '2 Pb(NO₃)₂(s) →(Δ ~470°C)→ 2 PbO(s) + 4 NO₂(g) + O₂(g)',
    lewis: 'sal_ionico',
    uso: 'Síntese de outros sais de Pb²⁺, demonstração da chuva dourada (PbI₂), análise qualitativa',
    curiosidade: 'A reação Pb(NO₃)₂ + 2 KI → PbI₂↓ + 2 KNO₃ produz cristais amarelo-ouro que precipitam lentamente ao resfriar uma solução quente — experimento chamado "chuva dourada", um dos mais espetaculares da química.',
    descricao: 'Um dos poucos sais de chumbo solúveis em água. Usado em síntese de precipitados de Pb²⁺ (PbSO₄, PbI₂ amarelo, PbCrO₄ amarelo canário). A decomposição térmica libera NO₂ alaranjado tóxico.',
  },

  {
    id: 'nan3', formula: 'NaN₃', formulaId: 'NaN3',
    nome: 'Azida de Sódio', funcao: 'sal', categoria: 'Sais de Sódio',
    massa: '65,01 g/mol', Tf: 275, Tb: null, densidade: '1,85 g/cm³',
    solubilidade: 'Muito solúvel em água (41,7 g/100 mL a 17°C)',
    ph: '9,5–10,5',
    nomenclatura: 'Azida de sódio (trinitreto de sódio)',
    badges: ['airbag','explosivo','tóxico'],
    geometria: 'Iônica; N₃⁻ linear', ligacao: 'Iônica (Na⁺ e N₃⁻)',
    equacao: 'NaN₃ → Na⁺(aq) + N₃⁻(aq)',
    reacao: '2 NaN₃(s) →(faísca elétrica)→ 2 Na(s) + 3 N₂(g)',
    lewis: 'generico',
    uso: 'Airbags automotivos (gerador de N₂ em <30 ms), preservante microbiológico',
    curiosidade: 'Em 30 ms após impacto a 40 km/h, 130 g de NaN₃ geram ~50 L de N₂ para inflar o airbag completamente. O Na metálico formado reage com KNO₃ e SiO₂ (também no cartucho) para ser neutralizado.',
    descricao: 'Sal do ácido hidrazoico (HN₃). A decomposição pela faísca elétrica gera N₂ gasoso em milissegundos — base do airbag moderno. Altamente tóxico: 0,7 mg/m³ é o limite de exposição ocupacional.',
  },

  {
    id: 'mgcl2', formula: 'MgCl₂', formulaId: 'MgCl2',
    nome: 'Cloreto de Magnésio', funcao: 'sal', categoria: 'Sais de Magnésio',
    massa: '95,21 g/mol', Tf: 714, Tb: 1412, densidade: '2,32 g/cm³',
    solubilidade: 'Muito solúvel (54,6 g/100 mL a 20°C)',
    ph: '4,5–6,5',
    nomenclatura: 'Cloreto de magnésio (nigari)',
    badges: ['higroscópico','tofu','eletrólise'],
    geometria: 'Iônica', ligacao: 'Iônica (Mg²⁺ e Cl⁻)',
    equacao: 'MgCl₂ → Mg²⁺(aq) + 2 Cl⁻(aq)',
    reacao: 'Mg(s) + 2 HCl(aq) → MgCl₂(aq) + H₂(g)',
    lewis: 'sal_ionico',
    uso: 'Produção de Mg metálico por eletrólise (processo Dow), nigari para coagulação do tofu, dessecante e descongelante',
    curiosidade: 'O nigari japonês (にがり) é MgCl₂ extraído da água do mar após cristalizar o NaCl. Coagula proteínas da soja formando o tofu. O Japão produz mais de 150.000 t/ano de tofu usando MgCl₂.',
    descricao: 'Sal higroscópico extraído da água do mar (bittern) e do mineral bischofita. Base da produção industrial de Mg metálico pelo processo Dow (eletrólise de MgCl₂ fundido). Mg: 3º metal mais usado no mundo.',
  },

  /* ═══════════════════════════════════════════════════════════════
     EXPANSÃO — 47 compostos que faltavam neste arquivo modular
     ───────────────────────────────────────────────────────────
     A modularização original só capturou os 53 compostos
     declarados diretamente no array inicial de CATALOGO_SIQI —
     os outros 47 eram adicionados no arquivo monolítico por dois
     blocos autoexecutáveis (`(function(){ var exp4=[...]; ... })()`
     e `exp5`), no MESMO padrão "núcleo + expansões" já usado (e já
     documentado no README) para REACOES_LIVRES — só que esses dois
     blocos de CATALOGO_SIQI ficaram fisicamente intercalados no
     meio de outras seções de dados (Experimentos, Reações) no
     arquivo original, e a separação por arquivo não os capturou.
     Conteúdo idêntico ao original, só reunido aqui num único
     lugar (achatado, sem os wrappers de IIFE/forEach — os campos
     calculados estado/pfStr/peStr que esses blocos adicionavam em
     runtime continuam sendo calculados normalmente por
     core/dados-adapter.js para TODO o catálogo, igual já acontecia
     para os 53 originais). ═══════════════════════════════════ */


  /* ── ÁCIDOS (7 novos) ── */
  {
    id:'hno2', formula:'HNO₂', formulaId:'HNO2',
    nome:'Ácido Nitroso', funcao:'acido', categoria:'Ácidos Fracos',
    massa:'47,01 g/mol', Tf:-42, Tb:null, densidade:'1,00 g/cm³ (aq)',
    solubilidade:'Solúvel em água; instável em solução',
    ph:'< 3 (solução 0,1 mol/L)',
    nomenclatura:'Ácido nitroso',
    badges:['fraco','instável','nitrosante'],
    geometria:'Angular (N central, ~120°)', ligacao:'Covalente polar',
    equacao:'HNO₂ ⇌ H⁺ + NO₂⁻   Ka = 4,5×10⁻⁴',
    reacao:'3 HNO₂ → HNO₃ + 2 NO + H₂O   [desproporcionamento]',
    lewis:'acido_oxigenado', uso:'Síntese de compostos diazo, agente nitrosante, diagnóstico de NO',
    curiosidade:'O HNO₂ é instável em solução. In vivo, os nitratos dos alimentos reduzem-se a nitrito e depois a NO — vasodilatador essencial. A nitroglicerina age pelo mesmo mecanismo.',
    descricao:'Ácido fraco e instável, existente apenas em solução aquosa. Importante intermediário em química orgânica (diazotação) e em bioquímica do óxido nítrico.',
  },
  {
    id:'h2so3', formula:'H₂SO₃', formulaId:'H2SO3',
    nome:'Ácido Sulfuroso', funcao:'acido', categoria:'Ácidos Fracos',
    massa:'82,07 g/mol', Tf:null, Tb:null, densidade:'1,03 g/cm³ (aq)',
    solubilidade:'Existe apenas em solução aquosa (SO₂ + H₂O)',
    ph:'< 2 (solução 1 mol/L)',
    nomenclatura:'Ácido sulfuroso',
    badges:['fraco','diácido','instável','conservante'],
    geometria:'Piramidal (S central)', ligacao:'Covalente polar',
    equacao:'H₂SO₃ ⇌ H⁺ + HSO₃⁻   Ka1 = 1,5×10⁻²',
    reacao:'SO₂(g) + H₂O(l) → H₂SO₃(aq)',
    lewis:'acido_oxigenado', uso:'Conservante alimentar (E220 via SO₂), branqueamento, antioxidante em vinhos',
    curiosidade:'O H₂SO₃ não existe como composto puro — forma-se ao dissolver SO₂ em água. O SO₂ dos vulcões e combustíveis fósseis forma H₂SO₃ na atmosfera → chuva ácida.',
    descricao:'Ácido diprótido instável, existente somente em solução. O sulfito (SO₃²⁻) é conservante largamente usado na indústria alimentícia. Facilmente oxidado a H₂SO₄.',
  },
  {
    id:'hclo3', formula:'HClO₃', formulaId:'HClO3',
    nome:'Ácido Clórico', funcao:'acido', categoria:'Oxiácidos do Cloro',
    massa:'84,46 g/mol', Tf:null, Tb:null, densidade:'1,28 g/cm³ (40% aq)',
    solubilidade:'Solúvel em água; instável >40%',
    ph:'< 1',
    nomenclatura:'Ácido clórico',
    badges:['forte','oxidante','instável','Cl(V)'],
    geometria:'Piramidal (Cl central)', ligacao:'Covalente polar',
    equacao:'HClO₃ → H⁺ + ClO₃⁻   (ionização completa)',
    reacao:'3 Cl₂(g) + 3 H₂O(l) → HClO₃(aq) + 5 HCl(aq)',
    lewis:'acido_oxigenado', uso:'Síntese de KClO₃, oxidante em laboratório',
    curiosidade:'HClO₃ a >40% é explosivo. O KClO₃ (sal do HClO₃) é usado na cabeça dos fósforos. Cl em NOX +5.',
    descricao:'Ácido forte da série dos cloroxiácidos. O ânion clorato (ClO₃⁻) é oxidante forte.',
  },
  {
    id:'hclo4', formula:'HClO₄', formulaId:'HClO4',
    nome:'Ácido Perclórico', funcao:'acido', categoria:'Oxiácidos do Cloro',
    massa:'100,46 g/mol', Tf:-112, Tb:203, densidade:'1,67 g/cm³',
    solubilidade:'Miscível em água',
    ph:'< 0 (superácido)',
    nomenclatura:'Ácido perclórico',
    badges:['superácido','mais forte','oxidante extremo','Cl(VII)'],
    geometria:'Tetraédrica (Cl central)', ligacao:'Covalente polar',
    equacao:'HClO₄ → H⁺ + ClO₄⁻   Ka ≈ 10⁷',
    reacao:'HClO₄(l) + H₂O → H₃O⁺ + ClO₄⁻',
    lewis:'acido_oxigenado', uso:'Digestão analítica, síntese de perclotatos, eletrólito em baterias',
    curiosidade:'O HClO₄ é o ácido inorgânico mais forte conhecido. Cl em NOX +7 (máximo). O perclorato de foguetes contamina solos e água potável.',
    descricao:'Ácido mais forte entre os ácidos inorgânicos. Concentrado é oxidante extremo. Diluído é estável e amplamente usado em análise.',
  },
  {
    id:'h3po3', formula:'H₃PO₃', formulaId:'H3PO3',
    nome:'Ácido Fosforoso', funcao:'acido', categoria:'Ácidos do Fósforo',
    massa:'82,00 g/mol', Tf:73.6, Tb:200, densidade:'1,65 g/cm³',
    solubilidade:'Muito solúvel (310 g/100 mL)',
    ph:'2–3',
    nomenclatura:'Ácido fosforoso (diácido — apenas 2 H ionizáveis)',
    badges:['diácido','redutor','P em NOX +3'],
    geometria:'Tetraédrica (P central, 1 H ligado ao P)', ligacao:'Covalente polar',
    equacao:'H₃PO₃ ⇌ H⁺ + H₂PO₃⁻   Ka1 = 5×10⁻²',
    reacao:'P₄O₆(s) + 6 H₂O(l) → 4 H₃PO₃(aq)',
    lewis:'acido_oxigenado', uso:'Redutor em síntese orgânica, estabilizante de polímeros',
    curiosidade:'Apesar da fórmula H₃PO₃ sugerir triácido, é diácido! Um H está ligado diretamente ao P (não ao O) e não é ionizável. Isso diferencia H₃PO₃ do H₃PO₄.',
    descricao:'Ácido diprótido com P no NOX +3. Uma ligação P-H não ionizável é característica marcante. Forte redutor: oxidado a H₃PO₄.',
  },
  {
    id:'h2cro4', formula:'H₂CrO₄', formulaId:'H2CrO4',
    nome:'Ácido Crômico', funcao:'acido', categoria:'Ácidos de Metais de Transição',
    massa:'118,00 g/mol', Tf:null, Tb:null, densidade:'1,20 g/cm³ (aq)',
    solubilidade:'Solúvel; existe em equilíbrio com Cr₂O₇²⁻',
    ph:'< 1',
    nomenclatura:'Ácido crômico (tetraoxocrômico(VI))',
    badges:['tóxico','cancerígeno','oxidante forte','Cr(VI)'],
    geometria:'Tetraédrica (Cr central)', ligacao:'Covalente com caráter iônico',
    equacao:'H₂CrO₄ ⇌ 2 H⁺ + CrO₄²⁻',
    reacao:'CrO₃(s) + H₂O(l) → H₂CrO₄(aq)',
    lewis:'acido_oxigenado', uso:'Cromagem industrial, oxidante em síntese orgânica (reagente de Jones)',
    curiosidade:'Cr(VI) é cancerígeno reconhecido pela IARC (grupo 1). O "caso Hinkley" da ativista Erin Brockovich envolvia Cr(VI) em água potável.',
    descricao:'Ácido diprótido com Cr em NOX +6. Em meio ácido, o cromato (CrO₄²⁻ amarelo) converte-se a dicromato (Cr₂O₇²⁻ laranja). Extremamente tóxico.',
  },
  /* ── BASES (5 novas) ── */
  {
    id:'lioh', formula:'LiOH', formulaId:'LiOH',
    nome:'Hidróxido de Lítio', funcao:'base', categoria:'Bases Fortes',
    massa:'23,95 g/mol', Tf:462, Tb:924, densidade:'1,46 g/cm³',
    solubilidade:'Solúvel (12,8 g/100 mL a 20°C)',
    ph:'> 13',
    nomenclatura:'Hidróxido de lítio',
    badges:['forte','baterias','Apollo','espacial'],
    geometria:'Iônica', ligacao:'Iônica (Li⁺ e OH⁻)',
    equacao:'LiOH → Li⁺(aq) + OH⁻(aq)',
    reacao:'2 Li(s) + 2 H₂O(l) → 2 LiOH(aq) + H₂(g)',
    lewis:'base_forte', uso:'Baterias de lítio, absorvedor de CO₂ em espaçonaves e submarinos',
    curiosidade:'O LiOH absorve CO₂: 2 LiOH + CO₂ → Li₂CO₃ + H₂O. A missão Apollo 13 entrou em crise quando os cartuchos de LiOH do módulo de comando não encaixavam no módulo lunar.',
    descricao:'Base forte, porém a mais fraca entre os hidróxidos de metais alcalinos. Fundamental nas baterias Li-íon de celulares e veículos elétricos.',
  },
  {
    id:'nh4oh', formula:'NH₄OH', formulaId:'NH4OH',
    nome:'Hidróxido de Amônio', funcao:'base', categoria:'Bases Fracas',
    massa:'35,05 g/mol', Tf:null, Tb:null, densidade:'0,91 g/cm³',
    solubilidade:'Solúvel (NH₃ em equilíbrio com NH₄OH)',
    ph:'11–12 (solução 1 mol/L)',
    nomenclatura:'Hidróxido de amônio (solução amoniacal)',
    badges:['fraca','volátil','limpeza','tampão'],
    geometria:'Tetraédrica (NH₄⁺)', ligacao:'Iônica + pontes de H',
    equacao:'NH₃ + H₂O ⇌ NH₄⁺ + OH⁻   Kb = 1,8×10⁻⁵',
    reacao:'NH₃(g) + H₂O(l) ⇌ NH₄OH(aq) ⇌ NH₄⁺(aq) + OH⁻(aq)',
    lewis:'base_fraca', uso:'Limpador multiuso, tingimento de tecidos, tampão amoniacal (pH 9-11)',
    curiosidade:'O NH₄OH não existe como composto puro — é um equilíbrio de NH₃ dissolvido em água. O cheiro pungente de amoníaco em produtos de limpeza vem do NH₃ volátil.',
    descricao:'Base fraca que existe em equilíbrio aquoso. Par conjugado: NH₄⁺/NH₃. Tampão amoniacal (NH₃+NH₄Cl) mantém pH 9–11.',
  },
  {
    id:'snoh4', formula:'Sn(OH)₄', formulaId:'Sn(OH)4',
    nome:'Hidróxido de Estanho IV', funcao:'base', categoria:'Bases Anfóteras',
    massa:'186,73 g/mol', Tf:null, Tb:null, densidade:'3,00 g/cm³',
    solubilidade:'Insolúvel em água; solúvel em ácidos e bases fortes',
    ph:'> 7',
    nomenclatura:'Hidróxido de estanho(IV)',
    badges:['insolúvel','anfótero','Sn(IV)'],
    geometria:'Octaédrica', ligacao:'Iônica com caráter covalente',
    equacao:'Sn(OH)₄ ⇌ Sn⁴⁺ + 4 OH⁻',
    reacao:'SnCl₄(aq) + 4 NaOH(aq) → Sn(OH)₄(s)↓ + 4 NaCl(aq)',
    lewis:'generico', uso:'Intermediário na produção de SnO₂ (vidro condutor ITO), eletrônica',
    curiosidade:'Sn(OH)₄ é anfótero: dissolve em HCl (→ SnCl₄) E em NaOH (→ Na₂[Sn(OH)₆]). O SnO₂ dopado com In forma o ITO — material essencial para telas de toque e painéis solares.',
    descricao:'Base insolúvel e anfótera do estanho(IV). Ao aquecer decompõe-se em SnO₂ + H₂O. O SnO₂ dopado com In₂O₃ forma o ITO, material de telas LCD e OLED.',
  },
  {
    id:'pboh2', formula:'Pb(OH)₂', formulaId:'Pb(OH)2',
    nome:'Hidróxido de Chumbo II', funcao:'base', categoria:'Bases Anfóteras',
    massa:'241,21 g/mol', Tf:145, Tb:null, densidade:'7,59 g/cm³',
    solubilidade:'Insolúvel em água (Kps = 1,2×10⁻¹⁵)',
    ph:'> 7',
    nomenclatura:'Hidróxido de chumbo(II)',
    badges:['insolúvel','anfótero','tóxico','Pb(II)'],
    geometria:'Hexagonal', ligacao:'Iônica',
    equacao:'Pb(OH)₂ ⇌ Pb²⁺ + 2 OH⁻   Kps = 1,2×10⁻¹⁵',
    reacao:'Pb(NO₃)₂(aq) + 2 NaOH(aq) → Pb(OH)₂(s)↓ + 2 NaNO₃(aq)',
    lewis:'generico', uso:'Intermediário na produção de PbO e Pb₃O₄ (zarcão)',
    curiosidade:'O Pb(OH)₂ é anfótero: reage com HNO₃ (→ Pb(NO₃)₂) e com NaOH (→ Na₂PbO₂ + H₂O). O zarcão Pb₃O₄ (vermelho) foi usado como anticorrosivo em pontes até ser banido.',
    descricao:'Base anfótera e insolúvel do chumbo(II). Extremamente tóxico. Ao aquecer decompõe-se em PbO. Relacionado às pinturas à base de chumbo (proibidas).',
  },
  {
    id:'rboh', formula:'RbOH', formulaId:'RbOH',
    nome:'Hidróxido de Rubídio', funcao:'base', categoria:'Bases Fortes',
    massa:'102,48 g/mol', Tf:300, Tb:null, densidade:'3,20 g/cm³',
    solubilidade:'Muito solúvel em água',
    ph:'> 14',
    nomenclatura:'Hidróxido de rubídio',
    badges:['forte','alcalino','raro'],
    geometria:'Iônica', ligacao:'Iônica (Rb⁺ e OH⁻)',
    equacao:'RbOH → Rb⁺(aq) + OH⁻(aq)',
    reacao:'2 Rb(s) + 2 H₂O(l) → 2 RbOH(aq) + H₂(g)   [reação violenta]',
    lewis:'base_forte', uso:'Pesquisa em espectroscopia, síntese de compostos de rubídio',
    curiosidade:'O Rb reage explosivamente com água. O RbOH é uma das bases mais fortes conhecidas. O rubídio tem apenas um isótopo estável (⁸⁵Rb) e um radioativo natural (⁸⁷Rb).',
    descricao:'Base muito forte do metal alcalino rubídio. Raramente encontrada no cotidiano por ser cara e rara. Mais forte que KOH e NaOH.',
  },

  /* ── ÓXIDOS (12 novos) ── */
  {
    id:'na2o', formula:'Na₂O', formulaId:'Na2O',
    nome:'Óxido de Sódio', funcao:'oxido', categoria:'Óxidos Básicos',
    massa:'61,98 g/mol', Tf:1275, Tb:null, densidade:'2,27 g/cm³',
    solubilidade:'Reage violentamente com água → NaOH',
    ph:'> 13',
    nomenclatura:'Óxido de sódio',
    badges:['básico','muito reativo','precursor NaOH'],
    geometria:'Cúbica (iônica)', ligacao:'Iônica (Na⁺ e O²⁻)',
    equacao:'Na₂O + H₂O → 2 NaOH',
    reacao:'4 Na(s) + O₂(g) → 2 Na₂O(s)',
    lewis:'oxido_basico', uso:'Precursor de NaOH, síntese de vidros especiais',
    curiosidade:'O Na queima em excesso de O₂ forma principalmente Na₂O₂ (peróxido). O Na₂O reage tão violentamente com água que o calor gerado pode inflamar o H₂ liberado.',
    descricao:'Óxido básico muito reativo. Reage com H₂O → NaOH. Com CO₂ → Na₂CO₃. Componente modificador em vidros técnicos (diminui ponto de fusão).',
  },
  {
    id:'k2o', formula:'K₂O', formulaId:'K2O',
    nome:'Óxido de Potássio', funcao:'oxido', categoria:'Óxidos Básicos',
    massa:'94,20 g/mol', Tf:740, Tb:null, densidade:'2,35 g/cm³',
    solubilidade:'Reage com água → KOH (violento)',
    ph:'> 14',
    nomenclatura:'Óxido de potássio',
    badges:['básico','muito reativo','fertilizante indireto'],
    geometria:'Cúbica (iônica)', ligacao:'Iônica (K⁺ e O²⁻)',
    equacao:'K₂O + H₂O → 2 KOH',
    reacao:'4 K(s) + O₂(g) → 2 K₂O(s)',
    lewis:'oxido_basico', uso:'Vidros especiais, fertilizante (% K₂O equivalente)',
    curiosidade:'Em fertilizantes, o teor de potássio é expresso como "% de K₂O equivalente" — herança histórica da análise de cinzas vegetais (potassa).',
    descricao:'Óxido básico muito reativo. O K puro prefere formar KO₂ (superóxido) com excesso de O₂. Componente de vidros e cálculos de fertilização.',
  },
  {
    id:'bao', formula:'BaO', formulaId:'BaO',
    nome:'Óxido de Bário', funcao:'oxido', categoria:'Óxidos Básicos',
    massa:'153,33 g/mol', Tf:1923, Tb:2000, densidade:'5,72 g/cm³',
    solubilidade:'Reage com água formando Ba(OH)₂ (exotérmico)',
    ph:'> 13',
    nomenclatura:'Óxido de bário',
    badges:['básico','tóxico','cerâmica','dessecante'],
    geometria:'Cúbica (NaCl)', ligacao:'Iônica (Ba²⁺ e O²⁻)',
    equacao:'BaO + H₂O → Ba(OH)₂   ΔH = −126 kJ/mol',
    reacao:'2 Ba(s) + O₂(g) → 2 BaO(s)',
    lewis:'oxido_basico', uso:'Dessecante para solventes, síntese de Ba(OH)₂, cerâmica eletrônica',
    curiosidade:'BaO é excelente dessecante para solventes orgânicos não-polares. Porém altamente tóxico — Ba²⁺ inibe a K⁺-ATPase muscular, causando paralisia.',
    descricao:'Óxido básico de alta reatividade. Reage exotermicamente com H₂O → Ba(OH)₂. Componente em cerâmicas capacitivas (BaTiO₃).',
  },
  {
    id:'so2', formula:'SO₂', formulaId:'SO2',
    nome:'Dióxido de Enxofre', funcao:'oxido', categoria:'Óxidos Ácidos',
    massa:'64,06 g/mol', Tf:-75.5, Tb:-10, densidade:'2,93 g/L (gás)',
    solubilidade:'Muito solúvel (113 g/L a 20°C; forma H₂SO₃)',
    ph:'< 3 (solução saturada)',
    nomenclatura:'Dióxido de enxofre (anidrido sulfuroso)',
    badges:['poluente','chuva ácida','conservante E220'],
    geometria:'Angular (S central, 119°)', ligacao:'Covalente polar',
    equacao:'SO₂ + H₂O ⇌ H₂SO₃',
    reacao:'2 SO₂(g) + O₂(g) →(V₂O₅, 450°C)→ 2 SO₃(g)',
    lewis:'oxido_acido', uso:'Conservante de alimentos e vinhos (E220), produção de H₂SO₄, branqueamento',
    curiosidade:'O SO₂ dos vulcões e usinas é o principal precursor da chuva ácida. A "chuva de enxofre" bíblica provavelmente foi erupção vulcânica.',
    descricao:'Gás incolor com odor sufocante. Anidrido sulfuroso. Poluente crítico de combustíveis fósseis ricos em S. Primeiro passo do processo de contato: S → SO₂ → SO₃ → H₂SO₄.',
  },
  {
    id:'no2', formula:'NO₂', formulaId:'NO2',
    nome:'Dióxido de Nitrogênio', funcao:'oxido', categoria:'Óxidos Ácidos',
    massa:'46,01 g/mol', Tf:-11.2, Tb:21.2, densidade:'3,71 g/L (gás)',
    solubilidade:'Reage com água → HNO₃ + HNO₂',
    ph:'< 2',
    nomenclatura:'Dióxido de nitrogênio',
    badges:['tóxico','chuva ácida','NOx','marrom-alaranjado'],
    geometria:'Angular (N central, 134°)', ligacao:'Covalente polar; radical livre',
    equacao:'3 NO₂(g) + H₂O(l) → 2 HNO₃(aq) + NO(g)',
    reacao:'2 NO(g) + O₂(g) → 2 NO₂(g)',
    lewis:'oxido_acido', uso:'Síntese de HNO₃ (Ostwald), diagnóstico ambiental (poluente NOx)',
    curiosidade:'O NO₂ equilibra-se com N₂O₄ (incolor): 2NO₂ ⇌ N₂O₄. Ao aquecer → marrom (NO₂); ao resfriar → incolor (N₂O₄). Experimento visual clássico de equilíbrio!',
    descricao:'Gás radical livre, marrom-alaranjado. Poluente de motores a combustão. Reage com H₂O formando HNO₃ (chuva ácida). Intermediário essencial no processo Ostwald.',
  },
  {
    id:'no', formula:'NO', formulaId:'NO',
    nome:'Monóxido de Nitrogênio', funcao:'oxido', categoria:'Óxidos Neutros',
    massa:'30,01 g/mol', Tf:-163.7, Tb:-151.8, densidade:'1,36 g/L (gás)',
    solubilidade:'Pouco solúvel em água',
    ph:'neutro',
    nomenclatura:'Monóxido de nitrogênio (óxido nítrico)',
    badges:['neutro','vasodilatador','poluente','Nobel 1998'],
    geometria:'Linear diatômico', ligacao:'Covalente (elétron desemparelhado)',
    equacao:'NO não reage com H₂O (óxido neutro)',
    reacao:'N₂(g) + O₂(g) →(>1500°C ou raio)→ 2 NO(g)',
    lewis:'generico', uso:'Sinalização biológica (vasodilatador), síntese de HNO₃',
    curiosidade:'O NO relaxa vasos sanguíneos → reduz pressão arterial. A nitroglicerina age liberando NO. O Nobel de Medicina 1998 foi dado aos descobridores do papel do NO como mensageiro biológico.',
    descricao:'Gás incolor, radical livre, óxido neutro. Produzido em motores e por raios. Mensageiro do relaxamento vascular. Oxida ao ar: 2NO + O₂ → 2NO₂.',
  },
  {
    id:'co', formula:'CO', formulaId:'CO',
    nome:'Monóxido de Carbono', funcao:'oxido', categoria:'Óxidos Neutros',
    massa:'28,01 g/mol', Tf:-205.0, Tb:-191.5, densidade:'1,25 g/L (gás)',
    solubilidade:'Ligeiramente solúvel em água',
    ph:'neutro',
    nomenclatura:'Monóxido de carbono',
    badges:['tóxico','inodoro','incolor','assassino silencioso'],
    geometria:'Linear diatômico', ligacao:'Triple bond C≡O',
    equacao:'2 CO(g) + O₂(g) → 2 CO₂(g)   ΔH = −566 kJ/mol',
    reacao:'C(s) + CO₂(g) → 2 CO(g)   [reação de Boudouard]',
    lewis:'generico', uso:'Metalurgia (redução de Fe₂O₃), Fischer-Tropsch, conversor catalítico',
    curiosidade:'CO é inodoro e incolor — "assassino silencioso". Liga-se à hemoglobina 250× mais forte que O₂. Detector de CO é obrigatório em países com inverno rigoroso.',
    descricao:'Óxido neutro e redutor forte. Produzido por combustão incompleta. Reduz óxidos metálicos na siderurgia. Base do processo Fischer-Tropsch (CO + H₂ → combustíveis).',
  },
  {
    id:'al2o3', formula:'Al₂O₃', formulaId:'Al2O3',
    nome:'Óxido de Alumínio', funcao:'oxido', categoria:'Óxidos Anfóteros',
    massa:'101,96 g/mol', Tf:2072, Tb:2977, densidade:'3,99 g/cm³',
    solubilidade:'Praticamente insolúvel em água; dissolve em ácidos e bases fortes',
    ph:'neutro em água pura',
    nomenclatura:'Trióxido de dialumínio (alumina)',
    badges:['anfótero','alumina','cerâmica','rubi','safira'],
    geometria:'Hexagonal compacto', ligacao:'Iônica com caráter covalente',
    equacao:'Al₂O₃ + 6 HCl → 2 AlCl₃ + 3 H₂O   [básico]\nAl₂O₃ + 2 NaOH → 2 NaAlO₂ + H₂O   [ácido]',
    reacao:'4 Al(s) + 3 O₂(g) → 2 Al₂O₃(s)   ΔH = −3352 kJ/mol',
    lewis:'generico', uso:'Abrasivo (lixa, pasta dental), cerâmica técnica, catalisadores, velas automotivas',
    curiosidade:'Rubi = Al₂O₃ com Cr³⁺ (vermelho). Safira = Al₂O₃ com Ti⁴⁺ e Fe³⁺ (azul). Dureza 9 (escala de Mohs). A camada de Al₂O₃ impede o Al de enferrujar.',
    descricao:'Alumina: óxido anfótero, extremamente duro (9 Mohs). Ponto de fusão 2072°C. Produzida por calcinação do Al(OH)₃ no processo Bayer. Polimorfos: coríndon, γ-alumina.',
  },
  {
    id:'cuo', formula:'CuO', formulaId:'CuO',
    nome:'Óxido de Cobre II', funcao:'oxido', categoria:'Óxidos Básicos',
    massa:'79,55 g/mol', Tf:1326, Tb:2000, densidade:'6,31 g/cm³',
    solubilidade:'Insolúvel em água; dissolve em HCl, HNO₃, H₂SO₄',
    ph:'> 7',
    nomenclatura:'Óxido de cobre(II) — cúprico',
    badges:['básico','preto','catalisador','vidros azuis'],
    geometria:'Monoclínica', ligacao:'Iônica (Cu²⁺ e O²⁻)',
    equacao:'CuO + 2 HCl → CuCl₂ + H₂O',
    reacao:'Cu(OH)₂(s) →(~80°C)→ CuO(s) + H₂O(g)',
    lewis:'oxido_basico', uso:'Pigmento preto em vidros e cerâmicas, catalisador, eletrodo de baterias',
    curiosidade:'CuO aquecido com H₂: CuO + H₂ → Cu + H₂O — experimento clássico de redução. O pó preto vira vermelho-metálico.',
    descricao:'Pó preto, óxido básico do Cu(II). Formado pela oxidação do cobre ou decomposição de Cu(OH)₂. Reduzido por H₂, CO ou C a Cu metálico.',
  },
  {
    id:'fe3o4', formula:'Fe₃O₄', formulaId:'Fe3O4',
    nome:'Magnetita', funcao:'oxido', categoria:'Óxidos Mistos',
    massa:'231,53 g/mol', Tf:1597, Tb:null, densidade:'5,20 g/cm³',
    solubilidade:'Insolúvel em água; dissolve em HCl concentrado',
    ph:'neutro',
    nomenclatura:'Óxido de ferro(II,III) — magnetita',
    badges:['magnético','Fe²⁺/Fe³⁺','bússola','nano medicina'],
    geometria:'Espinélio invertido (cúbica)', ligacao:'Iônica mista',
    equacao:'Fe₃O₄ = FeO·Fe₂O₃   [óxido misto Fe(II) e Fe(III)]',
    reacao:'3 Fe(s) + 2 O₂(g) →(Δ)→ Fe₃O₄(s)',
    lewis:'generico', uso:'Minério de ferro, pigmento preto, nanopartículas para medicina, bússolas',
    curiosidade:'A magnetita deu origem ao nome "magnético". Nanopartículas de Fe₃O₄ são aquecidas por campo magnético externo para destruir tumores (hipertermia magnética).',
    descricao:'Óxido misto com Fe em estados +2 e +3. Mineral magnético mais abundante da crosta. Estrutura espinélio invertido. Biocompatível — usado como contraste em MRI.',
  },
  {
    id:'mno2', formula:'MnO₂', formulaId:'MnO2',
    nome:'Dióxido de Manganês', funcao:'oxido', categoria:'Óxidos Anfóteros',
    massa:'86,94 g/mol', Tf:535, Tb:null, densidade:'5,03 g/cm³',
    solubilidade:'Insolúvel em água',
    ph:'neutro-anfótero',
    nomenclatura:'Dióxido de manganês (pirolusita)',
    badges:['catalisador','pilhas','oxidante','pirolusita'],
    geometria:'Rutilo (tetragonal)', ligacao:'Iônica (Mn⁴⁺ e O²⁻)',
    equacao:'MnO₂ + 4 HCl → MnCl₂ + Cl₂ + 2 H₂O',
    reacao:'2 H₂O₂(aq) →(MnO₂)→ 2 H₂O(l) + O₂(g)',
    lewis:'generico', uso:'Pilhas secas (cátodo Zn-MnO₂), catalisador do H₂O₂, produção de Cl₂',
    curiosidade:'A pilha comum usa MnO₂ como cátodo: MnO₂ + H₂O + e⁻ → MnOOH + OH⁻. Um celular tem ~3-5 g de MnO₂. A bateria mais comum do mundo depende deste mineral!',
    descricao:'Pirolusita: óxido de Mn(IV), mineral natural. Catalisador para H₂O₂ e KClO₃. Eletrodo positivo nas pilhas secas. Forte oxidante em meio ácido.',
  },
  {
    id:'sio2', formula:'SiO₂', formulaId:'SiO2',
    nome:'Dióxido de Silício', funcao:'oxido', categoria:'Óxidos Ácidos',
    massa:'60,09 g/mol', Tf:1710, Tb:2230, densidade:'2,65 g/cm³',
    solubilidade:'Insolúvel em água; dissolve em HF e NaOH fundido',
    ph:'levemente ácido (com NaOH)',
    nomenclatura:'Dióxido de silício (sílica)',
    badges:['ácido','areia','vidro','quartzo','fibra óptica'],
    geometria:'Rede covalente tridimensional (tetraedros SiO₄)', ligacao:'Covalente (rede infinita)',
    equacao:'SiO₂ + 4 HF → SiF₄ + 2 H₂O   [dissolução pelo HF]',
    reacao:'SiO₂ + 2 NaOH →(Δ)→ Na₂SiO₃ + H₂O',
    lewis:'oxido_acido', uso:'Vidro, cimento, fibra óptica, semicondutores (Si puro)',
    curiosidade:'O HF é o único ácido que dissolve vidro (SiO₂) — por isso é guardado em plástico. A fibra óptica da internet é 99,9999% SiO₂. O Si dos chips vem da areia!',
    descricao:'Rede covalente tridimensional. Três formas cristalinas: quartzo, cristobalita, tridimita. Matéria-prima do vidro: SiO₂ + Na₂CO₃ + CaO → vidro.',
  },

  /* ── SAIS (23 novos) ── */
  {
    id:'naclo_sal', formula:'NaClO', formulaId:'NaClO',
    nome:'Hipoclorito de Sódio', funcao:'sal', categoria:'Sais de Sódio',
    massa:'74,44 g/mol', Tf:null, Tb:null, densidade:'1,21 g/cm³ (solução 5%)',
    solubilidade:'Muito solúvel em água',
    ph:'11–13 (solução 5%)',
    nomenclatura:'Hipoclorito de sódio (água sanitária)',
    badges:['desinfetante','alvejante','bactericida','NUNCA misturar ácido'],
    geometria:'Iônica; ClO⁻ angular', ligacao:'Iônica (Na⁺ e ClO⁻)',
    equacao:'NaClO → Na⁺(aq) + ClO⁻(aq)',
    reacao:'Cl₂(g) + 2 NaOH(aq) → NaClO(aq) + NaCl(aq) + H₂O(l)',
    lewis:'sal_ionico', uso:'Água sanitária, piscinas, branqueamento de tecidos e papel',
    curiosidade:'NUNCA misturar água sanitária (NaClO) com vinagre ou ácidos — gera Cl₂ tóxico asfixiante. A água sanitária mata SARS-CoV-2 em 30 segundos.',
    descricao:'Sal do ácido hipocloroso. O Cl ativo (ClO⁻) oxida proteínas bacterianas. Decompõe-se em NaCl + O₂ com luz ou calor — por isso perde validade.',
  },
  {
    id:'kclo3', formula:'KClO₃', formulaId:'KClO3',
    nome:'Clorato de Potássio', funcao:'sal', categoria:'Sais de Potássio',
    massa:'122,55 g/mol', Tf:356, Tb:400, densidade:'2,32 g/cm³',
    solubilidade:'Solúvel (7,3 g/100 mL a 20°C)',
    ph:'neutro',
    nomenclatura:'Clorato de potássio',
    badges:['oxidante','explosivo','fósforos','pirotecnia'],
    geometria:'Iônica; ClO₃⁻ piramidal', ligacao:'Iônica (K⁺ e ClO₃⁻)',
    equacao:'2 KClO₃(s) →(MnO₂, Δ)→ 2 KCl(s) + 3 O₂(g)',
    reacao:'KClO₃(s) + C(s) →(ignição)→ KCl + CO₂',
    lewis:'sal_ionico', uso:'Cabeça de fósforos, fogos de artifício, produção laboratorial de O₂',
    curiosidade:'O fósforo de segurança contém KClO₃ + Sb₂S₃ na cabeça e fósforo vermelho na lixa. Inventado em 1855 por Johan Edvard Lundström.',
    descricao:'Forte oxidante cristalino. Libera O₂ ao aquecer com MnO₂. Misturado com combustíveis é explosivo. Cl em NOX +5.',
  },
  {
    id:'kclo4', formula:'KClO₄', formulaId:'KClO4',
    nome:'Perclorato de Potássio', funcao:'sal', categoria:'Sais de Potássio',
    massa:'138,55 g/mol', Tf:610, Tb:null, densidade:'2,52 g/cm³',
    solubilidade:'Ligeiramente solúvel (2,1 g/100 mL a 25°C)',
    ph:'neutro',
    nomenclatura:'Perclorato de potássio',
    badges:['oxidante','foguetes','propelente','Cl(VII)'],
    geometria:'Iônica; ClO₄⁻ tetraédrico', ligacao:'Iônica (K⁺ e ClO₄⁻)',
    equacao:'KClO₄ → K⁺ + ClO₄⁻',
    reacao:'KClO₃(s) →(Δ)→ KClO₄(s) + KCl(s)   [desproporcionamento]',
    lewis:'sal_ionico', uso:'Propelente sólido de foguetes (com Al), airbags, pirotecnia',
    curiosidade:'O Space Shuttle usava KClO₄ como oxidante do propelente sólido. O perclorato contamina solos e prejudica a tireoide — detectado em leite materno nos EUA.',
    descricao:'Oxidante mais estável que KClO₃. Cl em NOX +7. Propelente sólido: 4 Al + 3 KClO₄ → 2 Al₂O₃ + 3 KCl.',
  },
  {
    id:'znCl2_sal', formula:'ZnCl₂', formulaId:'ZnCl2',
    nome:'Cloreto de Zinco', funcao:'sal', categoria:'Sais de Zinco',
    massa:'136,30 g/mol', Tf:290, Tb:732, densidade:'2,91 g/cm³',
    solubilidade:'Muito solúvel (432 g/100 mL a 25°C!)',
    ph:'4–6',
    nomenclatura:'Cloreto de zinco',
    badges:['muito solúvel','ácido de Lewis','soldagem','galvanoplastia'],
    geometria:'Tetraédrica (Zn em coordenação IV)', ligacao:'Covalente com caráter iônico',
    equacao:'ZnCl₂ → Zn²⁺(aq) + 2 Cl⁻(aq)',
    reacao:'Zn(s) + 2 HCl(aq) → ZnCl₂(aq) + H₂(g)',
    lewis:'sal_ionico', uso:'Fluxo para solda de metais, galvanoplastia, pilhas secas, preservativo de madeira',
    curiosidade:'ZnCl₂ é tão solúvel (432 g/100 mL!) que soluções concentradas podem dissolver celulose. É um ácido de Lewis poderoso.',
    descricao:'Sal higroscópico altamente solúvel. Forte ácido de Lewis. Dissolve óxidos metálicos — usado como fluxo na solda. Eletrólito das pilhas secas Leclanché.',
  },
  {
    id:'fecl2', formula:'FeCl₂', formulaId:'FeCl2',
    nome:'Cloreto de Ferro II', funcao:'sal', categoria:'Sais de Ferro',
    massa:'126,75 g/mol', Tf:677, Tb:1023, densidade:'3,16 g/cm³',
    solubilidade:'Muito solúvel (68,5 g/100 mL a 20°C)',
    ph:'3–5',
    nomenclatura:'Cloreto de ferro(II) — cloreto ferroso',
    badges:['ferroso','redutor','Fe(II)','verde pálido'],
    geometria:'Iônica', ligacao:'Iônica (Fe²⁺ e Cl⁻)',
    equacao:'FeCl₂ → Fe²⁺(aq) + 2 Cl⁻(aq)',
    reacao:'Fe(s) + 2 HCl(aq) → FeCl₂(aq) + H₂(g)',
    lewis:'sal_ionico', uso:'Tratamento de efluentes, produção de Fe(OH)₂, síntese de pigmentos',
    curiosidade:'FeCl₂ é redutor — oxida-se facilmente a FeCl₃. Solução verde pálida ao ar vira marrom (FeCl₃). Mistura com FeCl₃ usada para gravar PCBs.',
    descricao:'Sal ferroso, verde pálido em solução. Fe em estado +2. Facilmente oxidado ao Fe(III). Tetrahidrato: FeCl₂·4H₂O verde.',
  },
  {
    id:'na2so3', formula:'Na₂SO₃', formulaId:'Na2SO3',
    nome:'Sulfito de Sódio', funcao:'sal', categoria:'Sais de Sódio',
    massa:'126,04 g/mol', Tf:33, Tb:null, densidade:'2,63 g/cm³',
    solubilidade:'Solúvel (22,7 g/100 mL a 20°C)',
    ph:'11–12',
    nomenclatura:'Sulfito de sódio',
    badges:['redutor','conservante','fotografia','antioxidante'],
    geometria:'Iônica; SO₃²⁻ piramidal', ligacao:'Iônica (Na⁺ e SO₃²⁻)',
    equacao:'Na₂SO₃ → 2 Na⁺ + SO₃²⁻',
    reacao:'Na₂SO₃(s) + H₂SO₄(aq) → Na₂SO₄(aq) + SO₂(g) + H₂O(l)',
    lewis:'sal_ionico', uso:'Conservante alimentar (E221), fotografia analógica, tratamento de efluentes com cloro',
    curiosidade:'Na₂SO₃ remove cloro residual da água: Na₂SO₃ + Cl₂ → Na₂SO₄ + 2 NaCl. Usado para dechlorinar efluentes antes de jogar em rios.',
    descricao:'Sal de S em NOX +4. Redutor — oxida-se a Na₂SO₄. Conservante E221. Essencial na fotografia analógica (revelador). Hidrolisa em meio básico.',
  },
  {
    id:'na3po4', formula:'Na₃PO₄', formulaId:'Na3PO4',
    nome:'Fosfato de Sódio', funcao:'sal', categoria:'Sais de Sódio',
    massa:'163,94 g/mol', Tf:1583, Tb:null, densidade:'2,54 g/cm³',
    solubilidade:'Solúvel (14,5 g/100 mL a 20°C)',
    ph:'11,5–12,5',
    nomenclatura:'Fosfato de trissódio (TSP)',
    badges:['alcalino','TSP','detergente industrial','eutrofização'],
    geometria:'Iônica; PO₄³⁻ tetraédrico', ligacao:'Iônica (Na⁺ e PO₄³⁻)',
    equacao:'Na₃PO₄ → 3 Na⁺ + PO₄³⁻',
    reacao:'H₃PO₄(aq) + 3 NaOH(aq) → Na₃PO₄(aq) + 3 H₂O(l)',
    lewis:'sal_ionico', uso:'Limpador industrial (TSP), condicionador de água, fertilizante',
    curiosidade:'O TSP era ingrediente de quase todo detergente de louça — banido em muitos países por eutrofização de rios (P alimenta algas). As caixas de cereal contêm Na₃PO₄ como "enriquecimento"!',
    descricao:'Sal básico intenso por hidrólise. Sequestrador de Ca²⁺ e Mg²⁺. Banido como detergente em muitos países por excesso de P em rios.',
  },
  {
    id:'caso4', formula:'CaSO₄', formulaId:'CaSO4',
    nome:'Sulfato de Cálcio', funcao:'sal', categoria:'Sais de Cálcio',
    massa:'136,14 g/mol', Tf:1460, Tb:null, densidade:'2,96 g/cm³',
    solubilidade:'Pouco solúvel (0,21 g/100 mL a 25°C)',
    ph:'6–7',
    nomenclatura:'Sulfato de cálcio (gesso: CaSO₄·½H₂O)',
    badges:['gesso','construção','fraturas','pirâmides'],
    geometria:'Iônica; SO₄²⁻ tetraédrico', ligacao:'Iônica (Ca²⁺ e SO₄²⁻)',
    equacao:'CaSO₄ → Ca²⁺(aq) + SO₄²⁻(aq)   Kps = 4,93×10⁻⁵',
    reacao:'Ca(OH)₂(aq) + H₂SO₄(aq) → CaSO₄(s)↓ + 2 H₂O(l)',
    lewis:'sal_ionico', uso:'Gesso médico, construção civil (drywall), anidrita, coagulante do tofu',
    curiosidade:'O gesso endurece expandindo ~1% — por isso não racha ao endurecer. As pirâmides egípcias foram cimentadas com gesso!',
    descricao:'Gipsita = CaSO₄·2H₂O. Gesso de Paris = CaSO₄·½H₂O (calcinado a 120°C). Reidrata e endurece em ~10 min. Incrusta em tubulações (dureza permanente da água).',
  },
  {
    id:'fes', formula:'FeS', formulaId:'FeS',
    nome:'Sulfeto de Ferro II', funcao:'sal', categoria:'Sais de Enxofre',
    massa:'87,91 g/mol', Tf:1193, Tb:null, densidade:'4,84 g/cm³',
    solubilidade:'Insolúvel em água (Kps ≈ 6×10⁻¹⁹)',
    ph:'neutro',
    nomenclatura:'Sulfeto de ferro(II)',
    badges:['insolúvel','gerador H₂S','mineral','Kipp'],
    geometria:'Hexagonal (empacotamento NiAs)', ligacao:'Iônica (Fe²⁺ e S²⁻)',
    equacao:'FeS + H₂SO₄ → FeSO₄ + H₂S↑',
    reacao:'Fe(s) + S(s) →(Δ)→ FeS(s)',
    lewis:'sal_ionico', uso:'Gerador laboratorial de H₂S (reação com HCl/H₂SO₄), produção de pigmentos',
    curiosidade:'FeS + 2 HCl → FeCl₂ + H₂S é o método de Kipp para H₂S. O H₂S tem cheiro de ovo podre e é mais tóxico que HCN! A pirita (FeS₂, "ouro dos tolos") confundiu mineradores por séculos.',
    descricao:'Sulfeto de Fe(II), precipitado preto. Produzido pela reação direta de Fe + S aquecidos. Principal uso: gerador de H₂S em laboratório via reação com ácidos.',
  },
  {
    id:'agcl', formula:'AgCl', formulaId:'AgCl',
    nome:'Cloreto de Prata', funcao:'sal', categoria:'Sais de Prata',
    massa:'143,32 g/mol', Tf:455, Tb:1547, densidade:'5,56 g/cm³',
    solubilidade:'Praticamente insolúvel (Kps = 1,8×10⁻¹⁰)',
    ph:'neutro',
    nomenclatura:'Cloreto de prata',
    badges:['insolúvel','fotossensível','fotografia','teste Cl⁻'],
    geometria:'Cúbica (NaCl)', ligacao:'Iônica com caráter covalente',
    equacao:'AgCl ⇌ Ag⁺ + Cl⁻   Kps = 1,8×10⁻¹⁰',
    reacao:'AgNO₃(aq) + HCl(aq) → AgCl(s)↓ + HNO₃(aq)',
    lewis:'sal_ionico', uso:'Fotografia analógica, eletrodo de referência, teste de cloretos',
    curiosidade:'O filme fotográfico usa cristais de AgBr/AgCl: luz reduz Ag⁺ → Ag⁰ (imagem latente). Um rolo de 36 fotos contém ~1,5 g de Ag!',
    descricao:'Precipitado branco fotossensível. Escurece ao sol (Ag⁺ → Ag⁰ pela luz UV). Dissolve em NH₃ formando [Ag(NH₃)₂]⁺. Eletrodo de referência padrão em eletroquímica.',
  },
  {
    id:'pbi2', formula:'PbI₂', formulaId:'PbI2',
    nome:'Iodeto de Chumbo II', funcao:'sal', categoria:'Sais de Chumbo',
    massa:'461,01 g/mol', Tf:402, Tb:954, densidade:'6,16 g/cm³',
    solubilidade:'Pouco solúvel (0,063 g/100 mL a 25°C; solúvel a quente)',
    ph:'neutro',
    nomenclatura:'Iodeto de chumbo(II)',
    badges:['amarelo canário','chuva dourada','perovskita solar'],
    geometria:'Hexagonal', ligacao:'Iônica com caráter covalente',
    equacao:'PbI₂ ⇌ Pb²⁺ + 2 I⁻   Kps = 9,8×10⁻⁹',
    reacao:'Pb(NO₃)₂(aq) + 2 KI(aq) → PbI₂(s)↓ + 2 KNO₃(aq)',
    lewis:'sal_ionico', uso:'"Chuva dourada" (demonstração), perovskitas fotovoltaicas, detecção de iodeto',
    curiosidade:'"Chuva dourada": PbI₂ dissolve-se em água quente; ao resfriar, cristais amarelo-ouro precipitam lentamente. PbI₂ na estrutura perovskita promete eficiência >30% em células solares!',
    descricao:'Precipitado amarelo-ouro vistoso. Solúvel a quente, precipita ao resfriar. Em pesquisa intensiva como material perovskita para células solares de alta eficiência.',
  },
  {
    id:'mnso4', formula:'MnSO₄', formulaId:'MnSO4',
    nome:'Sulfato de Manganês II', funcao:'sal', categoria:'Sais de Manganês',
    massa:'151,00 g/mol', Tf:700, Tb:null, densidade:'3,25 g/cm³',
    solubilidade:'Muito solúvel (70 g/100 mL a 20°C)',
    ph:'5–7',
    nomenclatura:'Sulfato de manganês(II)',
    badges:['Mn(II)','rosa pálido','fertilizante','micronutriente'],
    geometria:'Iônica; SO₄²⁻ tetraédrico', ligacao:'Iônica (Mn²⁺ e SO₄²⁻)',
    equacao:'MnSO₄ → Mn²⁺(aq) + SO₄²⁻(aq)',
    reacao:'MnO₂(s) + SO₂(g) → MnSO₄(s)',
    lewis:'sal_ionico', uso:'Fertilizante (micronutriente Mn), produção de MnO₂ eletrolítico, pigmento',
    curiosidade:'O manganês é micronutriente essencial: ativa enzimas fotossintéticas. Deficiência de Mn → clorose internervural. MnSO₄ é produto da titulação permanganométrica em meio ácido.',
    descricao:'Sal rosa pálido de Mn(II). Produto da redução do KMnO₄ em meio ácido. Fertilizante de micronutriente. Usado na produção industrial de MnO₂ por eletrólise.',
  },
  {
    id:'na2cro4', formula:'Na₂CrO₄', formulaId:'Na2CrO4',
    nome:'Cromato de Sódio', funcao:'sal', categoria:'Sais de Cromo',
    massa:'161,97 g/mol', Tf:792, Tb:null, densidade:'2,72 g/cm³',
    solubilidade:'Muito solúvel (87 g/100 mL a 20°C)',
    ph:'> 10',
    nomenclatura:'Cromato de sódio',
    badges:['amarelo','Cr(VI)','cancerígeno','indicador Mohr'],
    geometria:'Iônica; CrO₄²⁻ tetraédrico', ligacao:'Iônica (Na⁺ e CrO₄²⁻)',
    equacao:'Na₂CrO₄ → 2 Na⁺ + CrO₄²⁻',
    reacao:'2 Na₂CrO₄(aq) + H₂SO₄(aq) → Na₂Cr₂O₇(aq) + Na₂SO₄(aq) + H₂O(l)',
    lewis:'sal_ionico', uso:'Indicador de Ag⁺ (método Mohr), produção de Cr₂O₇²⁻, pigmento amarelo (proibido)',
    curiosidade:'CrO₄²⁻ (amarelo) ↔ Cr₂O₇²⁻ (laranja): equilíbrio dependente do pH! Método Mohr de titulação usa Na₂CrO₄ — quando AgNO₃ precipita todo Cl⁻, começa a precipitar Ag₂CrO₄ (vermelho).',
    descricao:'Sal amarelo de Cr(VI) — cancerígeno comprovado. Em meio ácido converte-se ao dicromato. Indicador clássico no método Mohr de titulação de cloretos.',
  },
  {
    id:'k2cr2o7', formula:'K₂Cr₂O₇', formulaId:'K2Cr2O7',
    nome:'Dicromato de Potássio', funcao:'sal', categoria:'Sais de Cromo',
    massa:'294,18 g/mol', Tf:398, Tb:500, densidade:'2,68 g/cm³',
    solubilidade:'Solúvel (11,7 g/100 mL a 20°C)',
    ph:'3,5–4,5',
    nomenclatura:'Dicromato de potássio',
    badges:['laranja cristalino','oxidante','bafômetro','padrão analítico'],
    geometria:'Iônica; Cr₂O₇²⁻', ligacao:'Iônica (K⁺ e Cr₂O₇²⁻)',
    equacao:'Cr₂O₇²⁻ + 14 H⁺ + 6 e⁻ → 2 Cr³⁺ + 7 H₂O   E° = +1,33 V',
    reacao:'K₂Cr₂O₇(aq) + 6 FeSO₄(aq) + 7 H₂SO₄(aq) → K₂SO₄ + Cr₂(SO₄)₃ + 3 Fe₂(SO₄)₃ + 7 H₂O',
    lewis:'sal_ionico', uso:'Padrão analítico (titulação dicromatométrica), curtimento de couro',
    curiosidade:'O bafômetro antigo usava K₂Cr₂O₇: laranja → verde ao oxidar etanol (Cr⁶⁺→Cr³⁺). Hoje substituído por sensores eletroquímicos.',
    descricao:'Cristais laranja, padrão primário analítico. Titulação dicromatométrica: Cr₂O₇²⁻ oxida Fe²⁺ a Fe³⁺. Cancerígeno IARC grupo 1.',
  },  {
    id:'na2s', formula:'Na₂S', formulaId:'Na2S',
    nome:'Sulfeto de Sódio', funcao:'sal', categoria:'Sais de Sódio',
    massa:'78,04 g/mol', Tf:1180, Tb:null, densidade:'1,86 g/cm³',
    solubilidade:'Muito solúvel (18,6 g/100 mL)',
    ph:'12–14',
    nomenclatura:'Sulfeto de sódio',
    badges:['fortemente básico','redutor','papel kraft','odor H₂S'],
    geometria:'Iônica (S²⁻ e Na⁺)', ligacao:'Iônica',
    equacao:'Na₂S + H₂O ⇌ NaHS + NaOH   (hidrólise intensa)',
    reacao:'Na₂SO₄(s) + 2 C(s) →(Δ 900°C)→ Na₂S(l) + 2 CO₂(g)',
    lewis:'sal_ionico', uso:'Processo kraft (papel), depilação de couro, tratamento de efluentes com metais pesados',
    curiosidade:'O cheiro característico de fábricas de papel é Na₂S → H₂S + mercaptanos. No processo kraft, Na₂S rompe ligações éter da lignina liberando as fibras de celulose.',
    descricao:'Fortemente básico por hidrólise do S²⁻. Redutor poderoso. Precipita metais pesados como sulfetos. Insumo do licor branco no processo kraft de papel.',
  },
  {
    id:'nh4cl', formula:'NH₄Cl', formulaId:'NH4Cl',
    nome:'Cloreto de Amônio', funcao:'sal', categoria:'Sais de Amônio',
    massa:'53,49 g/mol', Tf:338, Tb:520, densidade:'1,53 g/cm³',
    solubilidade:'Muito solúvel (37,2 g/100 mL a 20°C)',
    ph:'4,5–5,5',
    nomenclatura:'Cloreto de amônio (sal amoníaco)',
    badges:['ácido fraco','tampão','pilha Leclanché','fumaça branca'],
    geometria:'Iônica; NH₄⁺ tetraédrico', ligacao:'Iônica (NH₄⁺ e Cl⁻)',
    equacao:'NH₄Cl → NH₄⁺(aq) + Cl⁻(aq)   NH₄⁺ ⇌ NH₃ + H⁺   Ka = 5,6×10⁻¹⁰',
    reacao:'NH₃(g) + HCl(g) → NH₄Cl(s)   [fumaça branca]',
    lewis:'sal_ionico', uso:'Pilhas Leclanché (eletrólito), fertilizante nitrogenado, fluxo para solda',
    curiosidade:'Misturar NH₃ e HCl gasosos produz fumaça branca densa de NH₄Cl — demonstração clássica de formação de sal. NH₄Cl sublima sem fundir a 338°C.',
    descricao:'Sal ácido (NH₄⁺ hidrolisa-se levemente). Eletrólito das pilhas Leclanché. Fertilizante rápido. Sublima sem fundir: sólido → vapor a 338°C.',
  },
  {
    id:'naf', formula:'NaF', formulaId:'NaF',
    nome:'Fluoreto de Sódio', funcao:'sal', categoria:'Sais de Sódio',
    massa:'41,99 g/mol', Tf:993, Tb:1704, densidade:'2,56 g/cm³',
    solubilidade:'Solúvel (4,22 g/100 mL a 25°C)',
    ph:'6,5–8',
    nomenclatura:'Fluoreto de sódio',
    badges:['dentifício','água fluoretada','esmalte dental','saúde pública'],
    geometria:'Cúbica (NaCl)', ligacao:'Iônica (Na⁺ e F⁻)',
    equacao:'NaF → Na⁺(aq) + F⁻(aq)',
    reacao:'NaOH(aq) + HF(aq) → NaF(aq) + H₂O(l)',
    lewis:'sal_ionico', uso:'Fluoretação de água potável (0,7 ppm), pasta de dente, preservação de madeira',
    curiosidade:'A fluoretação da água é uma das 10 maiores conquistas de saúde pública do século XX (CDC): reduz cárie em 25-40%. O F⁻ forma fluorapatita — mais resistente ao ácido das bactérias.',
    descricao:'Fonte de F⁻ para fluoretação. Incorporado ao esmalte dental: Ca₅(PO₄)₃OH → Ca₅(PO₄)₃F (fluorapatita), 100× mais resistente ao ácido. Em excesso: fluorose dental.',
  },
  {
    id:'sncl2', formula:'SnCl₂', formulaId:'SnCl2',
    nome:'Cloreto de Estanho II', funcao:'sal', categoria:'Sais de Estanho',
    massa:'189,60 g/mol', Tf:247, Tb:623, densidade:'3,95 g/cm³',
    solubilidade:'Solúvel (84 g/100 mL a 0°C)',
    ph:'< 3',
    nomenclatura:'Cloreto de estanho(II) — cloreto estanoso',
    badges:['redutor','Sn(II)','espelhos','conservante E512'],
    geometria:'Piramidal (par solitário no Sn)', ligacao:'Covalente com caráter iônico',
    equacao:'SnCl₂ + 2 H₂O ⇌ Sn(OH)Cl + HCl   (hidrólise)',
    reacao:'SnCl₂(aq) + 2 FeCl₃(aq) → SnCl₄(aq) + 2 FeCl₂(aq)',
    lewis:'sal_ionico', uso:'Redutor em síntese orgânica, conservante E512, prateamento de espelhos',
    curiosidade:'SnCl₂ reduz Hg²⁺ a Hg⁰: SnCl₂ + HgCl₂ → SnCl₄ + Hg↓ — teste clássico de Hg²⁺! Usado industrialmente para "silvarizar" espelhos de automóveis.',
    descricao:'Forte redutor (Sn²⁺/Sn⁴⁺). Par solitário no Sn dá geometria piramidal. Hidrolisa em excesso de água. Conservante E512 — reduz oxidação em óleos enlatados.',
  },
  {
    id:'pbbr2', formula:'PbBr₂', formulaId:'PbBr2',
    nome:'Brometo de Chumbo II', funcao:'sal', categoria:'Sais de Chumbo',
    massa:'367,01 g/mol', Tf:371, Tb:916, densidade:'6,66 g/cm³',
    solubilidade:'Pouco solúvel (1,01 g/100 mL a 25°C)',
    ph:'neutro',
    nomenclatura:'Brometo de chumbo(II)',
    badges:['amarelo pálido','Pb(II)','perovskita LED'],
    geometria:'Ortorrômbica', ligacao:'Iônica (Pb²⁺ e Br⁻)',
    equacao:'PbBr₂ ⇌ Pb²⁺ + 2 Br⁻   Kps = 4,0×10⁻⁵',
    reacao:'Pb(NO₃)₂(aq) + 2 KBr(aq) → PbBr₂(s)↓ + 2 KNO₃(aq)',
    lewis:'sal_ionico', uso:'Síntese de compostos de Pb(II), perovskitas (MAPbBr₃ para LEDs verdes)',
    curiosidade:'CH₃NH₃PbBr₃ (perovskita de brometo) emite luz verde intensa — candidato para LEDs de próxima geração com eficiência maior que GaN.',
    descricao:'Precipitado branco-amarelado. Importante para síntese de perovskitas. Teste de Br⁻: AgNO₃ + Br⁻ → AgBr (amarelo pálido, distingue do AgCl branco e AgI amarelo intenso).',
  },

  {
    id:'cr2o3', formula:'Cr₂O₃', formulaId:'Cr2O3',
    nome:'Óxido de Cromo III', funcao:'oxido', categoria:'Óxidos Anfóteros',
    massa:'152,00 g/mol', Tf:2435, Tb:4000, densidade:'5,22 g/cm³',
    solubilidade:'Insolúvel em água; dissolve em ácidos fortes',
    ph:'neutro-anfótero', nomenclatura:'Trióxido de dicromo (esmeraldina)',
    badges:['anfótero','verde','pigmento','cromo III'],
    geometria:'Coríndon (hexagonal)', ligacao:'Iônica (Cr³⁺ e O²⁻)',
    equacao:'Cr₂O₃ + 6 HCl → 2 CrCl₃ + 3 H₂O',
    reacao:'4 Cr(s) + 3 O₂(g) → 2 Cr₂O₃(s)',
    lewis:'generico', uso:'Pigmento verde (tinta, plástico, vidro), polimento de metais (pasta de Cr₂O₃), catalisador',
    curiosidade:'O Cr₂O₃ (verde) é muito menos tóxico que o Cr(VI) (laranja/amarelo). A "pasta verde" usada para afiar navalhas e bisturis é Cr₂O₃ fino. Rubi = Al₂O₃ com Cr³⁺ (vermelho); Esmeralda = Be₃Al₂(SiO₃)₆ com Cr³⁺ (verde).',
    descricao:'Óxido anfótero de Cr(III), pó verde intenso. Ponto de fusão altíssimo (2435°C). Pigmento verde industrial. Muito mais estável e menos tóxico que compostos de Cr(VI). Forma-se na superfície do aço inoxidável (camada passiva).',
  },
  {
    id:'tio2', formula:'TiO₂', formulaId:'TiO2',
    nome:'Dióxido de Titânio', funcao:'oxido', categoria:'Óxidos Anfóteros',
    massa:'79,87 g/mol', Tf:1843, Tb:2972, densidade:'4,23 g/cm³',
    solubilidade:'Insolúvel em água; dissolve em H₂SO₄ concentrado quente e HF',
    ph:'neutro', nomenclatura:'Dióxido de titânio (titânia)',
    badges:['branco','fotocatalisador','protetor solar','pigmento'],
    geometria:'Rutilo (tetragonal) ou anatásio', ligacao:'Iônica (Ti⁴⁺ e O²⁻)',
    equacao:'TiO₂ →(UV)→ e⁻(BC) + h⁺(BV)   [fotocatálise]',
    reacao:'TiCl₄(l) + 2 H₂O(g) → TiO₂(s) + 4 HCl(g)',
    lewis:'generico', uso:'Pigmento branco (tintas, plásticos, papel), protetor solar (bloqueio UV), fotocatálise (purificação de ar e água)',
    curiosidade:'TiO₂ é o pigmento branco mais usado no mundo — está em quase toda tinta branca, creme dental e protetor solar. A anatásio (TiO₂) sob UV decompõe poluentes orgânicos e mata bactérias — painéis autolimpantes e purificadores de ar.',
    descricao:'Óxido de Ti(IV), branco intenso. Maior índice de refração entre os óxidos comuns (n=2,55 rutilo) — por isso brilhante opaco. Fotocatalisador: bandgap 3,2 eV absorve UV, gera radicais •OH que oxidam poluentes.',
  },
  {
    id:'na2o2', formula:'Na₂O₂', formulaId:'Na2O2',
    nome:'Peróxido de Sódio', funcao:'oxido', categoria:'Peróxidos',
    massa:'77,98 g/mol', Tf:675, Tb:null, densidade:'2,81 g/cm³',
    solubilidade:'Reage violentamente com água → NaOH + H₂O₂',
    ph:'> 13', nomenclatura:'Peróxido de sódio',
    badges:['peróxido','oxidante','gerador O₂','submarinos'],
    geometria:'Iônica (O₂²⁻ e Na⁺)', ligacao:'Iônica (Na⁺ e O₂²⁻)',
    equacao:'2 Na₂O₂ + 2 H₂O → 4 NaOH + O₂   [geração de O₂]',
    reacao:'2 Na(s) + O₂(g) → Na₂O₂(s)   [queima em excesso de O₂]',
    lewis:'generico', uso:'Gerador de O₂ em submarinos e minas (reage com CO₂ e H₂O liberando O₂), branqueamento, oxidante',
    curiosidade:'Em submarinos: Na₂O₂ + CO₂ → Na₂CO₃ + O₂. O tripulante expira CO₂, o cartucho absorve e libera O₂. Uma equação que sustenta vida submersa! Também bleaching de tecidos: Na₂O₂ + H₂O → NaOH + H₂O₂.',
    descricao:'Peróxido do sódio — contém o íon O₂²⁻ (peroxídico). Forma-se quando Na queima com excesso de O₂. Usado para regenerar ar em ambientes fechados (submarinos, minas): absorve CO₂ e H₂O, libera O₂.',
  },
  {
    id:'caso3', formula:'CaSO₃', formulaId:'CaSO3',
    nome:'Sulfito de Cálcio', funcao:'sal', categoria:'Sais de Cálcio',
    massa:'120,17 g/mol', Tf:null, Tb:null, densidade:'2,51 g/cm³',
    solubilidade:'Pouco solúvel (0,0043 g/100 mL a 18°C)',
    ph:'8–10', nomenclatura:'Sulfito de cálcio',
    badges:['insolúvel','dessulfurização','FGD','precipitado'],
    geometria:'Iônica; SO₃²⁻ piramidal', ligacao:'Iônica (Ca²⁺ e SO₃²⁻)',
    equacao:'CaSO₃ ⇌ Ca²⁺ + SO₃²⁻   Kps = 3,1×10⁻⁷',
    reacao:'CaO(s) + SO₂(g) → CaSO₃(s)   [dessulfurização de gases]',
    lewis:'sal_ionico', uso:'Dessulfurização de gases de combustão (FGD — Flue Gas Desulfurization), branqueamento de papel',
    curiosidade:'Usinas termelétricas a carvão injetam CaO (calcário calcinado) nos gases de combustão: CaO + SO₂ → CaSO₃, reduzindo a emissão de SO₂ (chuva ácida) em até 95%. Produção mundial: milhões de toneladas/ano como subproduto.',
    descricao:'Precipitado branco pouco solúvel. Produzido em larga escala no processo FGD (dessulfurização de gases) de termelétricas a carvão e óleo. Pode ser oxidado a CaSO₄ (gesso) vendável para a construção civil.',
  },
  {
    id:'zns', formula:'ZnS', formulaId:'ZnS',
    nome:'Sulfeto de Zinco', funcao:'sal', categoria:'Sais de Enxofre',
    massa:'97,47 g/mol', Tf:1700, Tb:null, densidade:'4,09 g/cm³',
    solubilidade:'Insolúvel em água (Kps = 1,6×10⁻²⁴)',
    ph:'neutro', nomenclatura:'Sulfeto de zinco (blenda, esfalerita)',
    badges:['insolúvel','luminescente','mineral','blenda'],
    geometria:'Cúbica (blenda de zinco) ou hexagonal (wurtzita)', ligacao:'Covalente com caráter iônico',
    equacao:'ZnS ⇌ Zn²⁺ + S²⁻   Kps = 1,6×10⁻²⁴',
    reacao:'Zn(s) + S(s) →(Δ)→ ZnS(s)   [síntese direta]',
    lewis:'sal_ionico', uso:'Pigmento branco, tela de raios catódicos (CRT), cintilador, material fosforescente (visão noturna)',
    curiosidade:'ZnS dopado com Cu emite luz verde ao ser excitado por raios-X ou elétrons — foi o material das telas de TVs e monitores CRT durante décadas. ZnS:Ag emite azul. Ainda usado em telas de osciloscópio e detectores de radiação.',
    descricao:'Mineral esfalerita (blenda de zinco) — principal minério de Zn. Semicondutor de bandgap largo (3,6 eV). Fosforescente quando dopado. Precipitado branco em análise qualitativa: H₂S + Zn²⁺ (pH neutro) → ZnS↓.',
  },

];

