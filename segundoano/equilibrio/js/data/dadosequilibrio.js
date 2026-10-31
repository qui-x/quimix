/* ================================================================
   SIEQ — dadosequilibrio.js | dados de Equilíbrio Químico e Iônico
   ================================================================
   FONTES: H₂ + I₂ ⇌ 2 HI (Kc ≈ 50 a 448 °C, Bodenstein) e
   N₂O₄ ⇌ 2 NO₂ (ΔH = +57,2 kJ/mol) — Chang; Atkins. Constantes de
   ionização Ka/Kb a 25 °C — CRC Handbook (97ª ed.). Faixas de
   viragem dos indicadores — Vogel. Kw = 1,0·10⁻¹⁴ a 25 °C.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIEQ',
  TITLE: 'Simulador Interativo de Equilíbrio Químico e Iônico',

  HI:  { kc: 50, eq: 'H₂(g) + I₂(g) ⇌ 2 HI(g)', temp: 448 },
  NO2: { kc25: 4.6e-3, dh: 57.2, eq: 'N₂O₄(g) ⇌ 2 NO₂(g)', r: 0.008314 },

  PERTURBACOES: [
    { id: 'add-n2o4', rot: 'Adicionar N₂O₄' },
    { id: 'add-no2',  rot: 'Adicionar NO₂' },
    { id: 'aquecer',  rot: 'Aquecer +10 °C' },
    { id: 'resfriar', rot: 'Resfriar −10 °C' },
    { id: 'comprimir', rot: 'Reduzir volume' },
    { id: 'expandir', rot: 'Aumentar volume' },
    /* As duas que faltavam. Existem justamente para o aluno TENTAR e descobrir
       que nada acontece — sem elas, o erro classico nao tinha como ser
       cometido e corrigido dentro do simulador. */
    { id: 'inerte', rot: 'Add. gás inerte (Ar)', nota: 'a volume constante NÃO desloca: as pressões parciais não mudam' },
    { id: 'catal',  rot: 'Catalisador ⇄',        nota: 'NÃO desloca: acelera as duas reações igualmente' },
  ],

  KW: 1e-14,

  /* ── Substâncias do cotidiano (pH médio a 25 °C) ── */
  SUBSTANCIAS: [
    { id: 'gastrico', nome: 'Suco gástrico',     ph: 2.0,  cor: '#dc2626' },
    { id: 'limao',    nome: 'Suco de limão',     ph: 2.3,  cor: '#ea580c' },
    { id: 'vinagre',  nome: 'Vinagre',           ph: 2.9,  cor: '#f97316' },
    { id: 'refri',    nome: 'Refrigerante cola', ph: 3.0,  cor: '#f59e0b' },
    { id: 'cafe',     nome: 'Café',              ph: 5.0,  cor: '#facc15' },
    { id: 'chuva',    nome: 'Chuva natural',     ph: 5.6,  cor: '#d9f99d' },
    { id: 'leite',    nome: 'Leite',             ph: 6.6,  cor: '#a3e635' },
    { id: 'agua',     nome: 'Água pura',         ph: 7.0,  cor: '#4ade80' },
    { id: 'sangue',   nome: 'Sangue',            ph: 7.4,  cor: '#34d399' },
    { id: 'marinha',  nome: 'Água do mar',       ph: 8.0,  cor: '#22d3ee' },
    { id: 'magnesia', nome: 'Leite de magnésia', ph: 10.5, cor: '#3b82f6' },
    { id: 'amoniaco', nome: 'Amoníaco caseiro',  ph: 11.5, cor: '#6366f1' },
    { id: 'soda',     nome: 'Soda cáustica',     ph: 13.5, cor: '#8b5cf6' },
  ],

  /* ── Ácidos e bases do modo Cálculo ── */
  ELETROLITOS: [
    { id: 'hcl',   nome: 'HCl',        tipo: 'acido', forte: true,  k: null,    dot: '#f87171', desc: 'ácido forte (100 % ionizado)' },
    { id: 'hf',    nome: 'HF',         tipo: 'acido', forte: false, k: 6.8e-4,  dot: '#fb923c', desc: 'ácido fraco, Ka = 6,8·10⁻⁴' },
    { id: 'hac',   nome: 'CH₃COOH',    tipo: 'acido', forte: false, k: 1.8e-5,  dot: '#fbbf24', desc: 'ácido acético, Ka = 1,8·10⁻⁵' },
    { id: 'naoh',  nome: 'NaOH',       tipo: 'base',  forte: true,  k: null,    dot: '#60a5fa', desc: 'base forte (100 % dissociada)' },
    { id: 'nh3',   nome: 'NH₃',        tipo: 'base',  forte: false, k: 1.8e-5,  dot: '#a78bfa', desc: 'amônia, Kb = 1,8·10⁻⁵' },
  ],

  /* ── Indicadores: faixa de viragem e cores ── */
  INDICADORES: [
    { id: 'fenol',  nome: 'Fenolftaleína',          a: 8.2, b: 10.0, c1: '#e2e8f0', c2: '#e91e8c', r1: 'incolor', r2: 'rosa' },
    { id: 'metila', nome: 'Alaranjado de metila',   a: 3.1, b: 4.4,  c1: '#e53e3e', c2: '#f6e05e', r1: 'vermelho', r2: 'amarelo' },
    { id: 'bromo',  nome: 'Azul de bromotimol',     a: 6.0, b: 7.6,  c1: '#eab308', c2: '#2563eb', r1: 'amarelo', r2: 'azul' },
    { id: 'tornas', nome: 'Tornassol',              a: 4.5, b: 8.3,  c1: '#dc2626', c2: '#2563eb', r1: 'vermelho', r2: 'azul' },
  ],

  /* ── Titulação padrão: 25,0 mL de HCl 0,100 M com NaOH 0,100 M ── */
  TIT: { va: 25.0, ca: 0.100, cb: 0.100 },

  /* ── ids de modo atendidos pela SEGUNDA mecânica (fachada Mech) ── */
  MECH_B: ['escala', 'calculo', 'titulacao'],
  /* ── TERCEIRA mecânica: os três equilíbrios que faltavam ──
     Mesma estratégia das duas anteriores: uma classe nova (MechC) em vez de
     inflar MechA/MechB, que já funcionam. A fachada Mech roteia por estes ids. */
  MECH_C: ['kps', 'tampao', 'hidrolise'],

  /* ══════════════════════════════════════════════════════════════
     EQUILÍBRIO DE SOLUBILIDADE — produto de solubilidade Kps
     FONTES: Kps a 25 °C do CRC Handbook (97ª ed.) e Lange's Handbook.
     `n` é o número total de íons na dissolução; `ec` são os coeficientes
     do cátion e do ânion, usados para montar a expressão de Kps e para
     calcular a solubilidade molar s a partir dela.
     Exemplos:
       AgCl   → Ag⁺ + Cl⁻        Kps = s·s      = s²      → s = √Kps
       CaF₂   → Ca²⁺ + 2 F⁻      Kps = s·(2s)²  = 4s³     → s = ∛(Kps/4)
       Ag₂CrO₄→ 2 Ag⁺ + CrO₄²⁻   Kps = (2s)²·s  = 4s³     → s = ∛(Kps/4)
  ══════════════════════════════════════════════════════════════ */
  SAIS_KPS: [
    { id: 'agcl',   nome: 'AgCl',      cat: 'Ag⁺',  ani: 'Cl⁻',    ec: [1, 1], kps: 1.8e-10,
      cor: '#e2e8f0', desc: 'cloreto de prata — o precipitado branco que escurece na luz' },
    { id: 'agbr',   nome: 'AgBr',      cat: 'Ag⁺',  ani: 'Br⁻',    ec: [1, 1], kps: 5.4e-13,
      cor: '#fef3c7', desc: 'brometo de prata — base do filme fotográfico' },
    { id: 'agi',    nome: 'AgI',       cat: 'Ag⁺',  ani: 'I⁻',     ec: [1, 1], kps: 8.5e-17,
      cor: '#fde68a', desc: 'iodeto de prata — usado em semeadura de nuvens' },
    { id: 'baso4',  nome: 'BaSO₄',     cat: 'Ba²⁺', ani: 'SO₄²⁻',  ec: [1, 1], kps: 1.1e-10,
      cor: '#f8fafc', desc: 'sulfato de bário — contraste de raio X: tão insolúvel que o Ba²⁺ tóxico não é absorvido' },
    { id: 'caso4',  nome: 'CaSO₄',     cat: 'Ca²⁺', ani: 'SO₄²⁻',  ec: [1, 1], kps: 4.9e-5,
      cor: '#e0f2fe', desc: 'sulfato de cálcio — gipsita e gesso; o mais solúvel desta lista' },
    { id: 'caco3',  nome: 'CaCO₃',     cat: 'Ca²⁺', ani: 'CO₃²⁻',  ec: [1, 1], kps: 3.3e-9,
      cor: '#f1f5f9', desc: 'carbonato de cálcio — calcário, casca de ovo, concha e a incrustação do chuveiro' },
    { id: 'caf2',   nome: 'CaF₂',      cat: 'Ca²⁺', ani: 'F⁻',     ec: [1, 2], kps: 3.9e-11,
      cor: '#dbeafe', desc: 'fluorita — aqui Kps = 4s³, não s²: repare no expoente do coeficiente 2' },
    { id: 'mgoh2',  nome: 'Mg(OH)₂',   cat: 'Mg²⁺', ani: 'OH⁻',    ec: [1, 2], kps: 5.6e-12,
      cor: '#ecfeff', desc: 'leite de magnésia — a suspensão é justamente o excesso não dissolvido' },
    { id: 'feoh3',  nome: 'Fe(OH)₃',   cat: 'Fe³⁺', ani: 'OH⁻',    ec: [1, 3], kps: 2.8e-39,
      cor: '#b45309', desc: 'hidróxido de ferro III — Kps = 27s⁴; a ferrugem gelatinosa da água de poço' },
    { id: 'ag2cro4', nome: 'Ag₂CrO₄',  cat: 'Ag⁺',  ani: 'CrO₄²⁻', ec: [2, 1], kps: 1.1e-12,
      cor: '#dc2626', desc: 'cromato de prata — o precipitado vermelho-tijolo do método de Mohr' },
    { id: 'pbi2',   nome: 'PbI₂',      cat: 'Pb²⁺', ani: 'I⁻',     ec: [1, 2], kps: 9.8e-9,
      cor: '#facc15', desc: 'iodeto de plumbo II — a “chuva de ouro” das aulas de laboratório' },
    { id: 'pbcl2',  nome: 'PbCl₂',     cat: 'Pb²⁺', ani: 'Cl⁻',    ec: [1, 2], kps: 1.7e-5,
      cor: '#f1f5f9', desc: 'cloreto de plumbo II — solúvel em água quente, precipita ao esfriar' },
  ],

  /* ══════════════════════════════════════════════════════════════
     SOLUÇÃO TAMPÃO — pares ácido/base conjugada
     FONTES: Ka a 25 °C do CRC Handbook. pKa = −log Ka.
     Henderson-Hasselbalch: pH = pKa + log([base conj.]/[ácido]).
     `faixa` é a faixa útil de tamponamento (pKa ± 1), convenção de Vogel.
  ══════════════════════════════════════════════════════════════ */
  TAMPOES: [
    { id: 'acetato',  nome: 'Acético / Acetato', ha: 'CH₃COOH', a: 'CH₃COO⁻', ka: 1.8e-5,
      cor: '#fbbf24', uso: 'tampão de bancada mais comum; também o do vinagre com acetato de sódio' },
    { id: 'fosfato',  nome: 'Fosfato (H₂PO₄⁻/HPO₄²⁻)', ha: 'H₂PO₄⁻', a: 'HPO₄²⁻', ka: 6.2e-8,
      cor: '#60a5fa', uso: 'tampão intracelular e do soro fisiológico tamponado (PBS): pKa 7,2, quase o pH do corpo' },
    { id: 'bicarb',   nome: 'Carbônico / Bicarbonato', ha: 'H₂CO₃', a: 'HCO₃⁻', ka: 4.3e-7,
      cor: '#34d399', uso: 'o tampão do SANGUE — mantém o pH entre 7,35 e 7,45; hiperventilar o desloca' },
    { id: 'amonio',   nome: 'Amônio / Amônia', ha: 'NH₄⁺', a: 'NH₃', ka: 5.6e-10,
      cor: '#a78bfa', uso: 'tampão básico (pKa 9,25), usado em análise de metais' },
    { id: 'formiato', nome: 'Fórmico / Formiato', ha: 'HCOOH', a: 'HCOO⁻', ka: 1.8e-4,
      cor: '#fb923c', uso: 'tampão ácido (pKa 3,74); o ácido da picada de formiga' },
  ],

  /* ══════════════════════════════════════════════════════════════
     HIDRÓLISE SALINA — o pH que um SAL produz ao dissolver
     Os quatro casos canônicos, decididos pela FORÇA dos íons de origem:
       forte + forte  → nenhum íon hidroliza          → pH 7  (neutro)
       forte + fraco  → o ÂNION hidroliza             → pH > 7 (básico)
       fraco + forte  → o CÁTION hidroliza            → pH < 7 (ácido)
       fraco + fraco  → os dois; ganha o de maior K   → depende
     Constante de hidrólise: Kh = Kw/Ka (ânion) ou Kw/Kb (cátion).
     FONTES de Ka/Kb: CRC Handbook (97ª ed.).
  ══════════════════════════════════════════════════════════════ */
  SAIS_HIDROLISE: [
    { id: 'nacl',   nome: 'NaCl',       cat: 'Na⁺',  ani: 'Cl⁻',
      catForte: true,  aniForte: true,  ka: null,    kb: null,   cor: '#e2e8f0',
      origem: 'NaOH (base forte) + HCl (ácido forte)',
      desc: 'sal de cozinha: nenhum dos íons reage com a água, o pH fica em 7' },
    { id: 'kno3',   nome: 'KNO₃',       cat: 'K⁺',   ani: 'NO₃⁻',
      catForte: true,  aniForte: true,  ka: null,    kb: null,   cor: '#f1f5f9',
      origem: 'KOH (base forte) + HNO₃ (ácido forte)',
      desc: 'salitre: também neutro, por isso serve de eletrólito inerte' },
    { id: 'naac',   nome: 'CH₃COONa',   cat: 'Na⁺',  ani: 'CH₃COO⁻',
      catForte: true,  aniForte: false, ka: 1.8e-5,  kb: null,   cor: '#fbbf24',
      origem: 'NaOH (base forte) + CH₃COOH (ácido fraco)',
      desc: 'acetato de sódio: o ânion rouba H⁺ da água e sobra OH⁻ — solução BÁSICA' },
    { id: 'nahco3', nome: 'NaHCO₃',     cat: 'Na⁺',  ani: 'HCO₃⁻',
      catForte: true,  aniForte: false, ka: 4.3e-7,  kb: null,   cor: '#a3e635',
      origem: 'NaOH (base forte) + H₂CO₃ (ácido fraco)',
      desc: 'bicarbonato de sódio: básico por hidrólise — é por isso que alivia azia' },
    { id: 'nacn',   nome: 'NaCN',       cat: 'Na⁺',  ani: 'CN⁻',
      catForte: true,  aniForte: false, ka: 6.2e-10, kb: null,   cor: '#22d3ee',
      origem: 'NaOH (base forte) + HCN (ácido muito fraco)',
      desc: 'cianeto de sódio: ácido de origem fraquíssimo, então a hidrólise é intensa e o pH sobe muito' },
    { id: 'nh4cl',  nome: 'NH₄Cl',      cat: 'NH₄⁺', ani: 'Cl⁻',
      catForte: false, aniForte: true,  ka: null,    kb: 1.8e-5, cor: '#f87171',
      origem: 'NH₃ (base fraca) + HCl (ácido forte)',
      desc: 'cloreto de amônio: o cátion cede H⁺ à água — solução ÁCIDA' },
    { id: 'nh4no3', nome: 'NH₄NO₃',     cat: 'NH₄⁺', ani: 'NO₃⁻',
      catForte: false, aniForte: true,  ka: null,    kb: 1.8e-5, cor: '#fb923c',
      origem: 'NH₃ (base fraca) + HNO₃ (ácido forte)',
      desc: 'nitrato de amônio: ácido por hidrólise; é também o sal das compressas frias' },
    { id: 'nh4ac',  nome: 'CH₃COONH₄',  cat: 'NH₄⁺', ani: 'CH₃COO⁻',
      catForte: false, aniForte: false, ka: 1.8e-5,  kb: 1.8e-5, cor: '#4ade80',
      origem: 'NH₃ (base fraca) + CH₃COOH (ácido fraco)',
      desc: 'acetato de amônio: caso raro em que Ka ≈ Kb, então os dois efeitos se cancelam e o pH volta a ~7' },
    { id: 'nh4cn',  nome: 'NH₄CN',      cat: 'NH₄⁺', ani: 'CN⁻',
      catForte: false, aniForte: false, ka: 6.2e-10, kb: 1.8e-5, cor: '#38bdf8',
      origem: 'NH₃ (base fraca) + HCN (ácido fraco)',
      desc: 'cianeto de amônio: Ka do HCN é MUITO menor que Kb da NH₃, então vence a hidrólise do ânion — BÁSICO' },
  ],

  MODES: [
    {
      id: 'atingir', sigla: 'v→v', nome: 'Atingindo o Equilíbrio', sub: 'H₂ + I₂ ⇌ 2 HI',
      hint: 'Parta de hidrogênio e iodo e acompanhe as concentrações até o platô, quando as velocidades direta e inversa se igualam.',
      info: 'O equilíbrio é dinâmico: as reações direta e inversa continuam acontecendo, mas com velocidades iguais, e as concentrações param de mudar. Qualquer que seja o ponto de partida, a mesma temperatura leva ao mesmo Kc.',
      formula: 'Kc = [HI]² / ([H₂]·[I₂]) ≈ 50 (448 °C)',
      formulaNote: 'No equilíbrio v_direta = v_inversa. As concentrações ficam constantes, não iguais.',
      hintCanvas: 'Enter/Espaço reinicia a reação',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18" /><path d="m19 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" /><path d="m5 8 3 8a5 5 0 0 1-6 0zV7" /><path d="M7 21h10" /></svg>',
      def: 'O equilíbrio é dinâmico: as reações direta e inversa não param, só passam a ter a mesma velocidade.',
      fatos: [
        { l: 'Reação',  v: 'H₂ + I₂ ⇌ 2 HI' },
        { l: 'Kc',      v: '≈ 50 (448 °C)' },
        { l: 'Tipo',    v: 'Equilíbrio homogêneo' },
        { l: 'Fonte',   v: 'Bodenstein' },
      ],
      canvasInteracao: 'Acompanhe [H₂], [I₂] e [HI] mudarem até o platô, onde as concentrações param de variar.',
      overlay: 'Rumo ao equilíbrio', panels: ['panel-atingir'], primary: 'eq-reset',
    },
    {
      id: 'lechatelier', sigla: 'Le Chatelier', nome: 'Princípio de Le Chatelier', sub: 'N₂O₄ ⇌ 2 NO₂',
      hint: 'Perturbe o equilíbrio incolor-castanho adicionando gases, mudando a temperatura ou o volume e veja o sistema reagir.',
      info: 'Perturbado, o equilíbrio se desloca no sentido que atenua a perturbação. Como a reação é endotérmica, aquecer desloca para NO₂ (castanho) e resfriar para N₂O₄ (incolor). Comprimir favorece o lado com menos mols de gás.',
      formula: 'Q vs. Kc decide o sentido do deslocamento',
      formulaNote: 'Q < K desloca para a direita; Q > K desloca para a esquerda; Q = K é o equilíbrio.',
      hintCanvas: 'Enter/Espaço aquece o frasco em 10 °C',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" /></svg>',
      def: 'Perturbado, o equilíbrio se desloca no sentido que atenua a perturbação — é o princípio de Le Chatelier.',
      fatos: [
        { l: 'Reação', v: 'N₂O₄ ⇌ 2 NO₂' },
        { l: 'ΔH',     v: '+57,2 kJ/mol (endo)' },
        { l: 'Cores',  v: 'incolor ↔ castanho' },
        { l: 'Ano',    v: 'Le Chatelier, 1884' },
      ],
      canvasInteracao: 'Adicione gás, aqueça, resfrie ou mude o volume e veja o frasco mudar de cor com o deslocamento.',
      recomendados: ['Adicionar N₂O₄', 'Aquecer +10 °C', 'Reduzir volume'],
      overlay: 'Le Chatelier', panels: ['panel-lechatelier'], primary: 'aquecer',
    },
    {
      id: 'qk', sigla: 'Q ⋛ K', nome: 'Quociente Q e Constante K', sub: 'Prever o sentido',
      hint: 'Escolha concentrações arbitrárias, compare o quociente Q com a constante Kc e descubra para que lado a reação caminha.',
      info: 'O quociente de reação Q tem a mesma expressão de Kc, mas vale para qualquer instante. Comparando Q com Kc é possível prever se ainda faltam produtos, se falta reagente, ou se o sistema já está em equilíbrio.',
      formula: 'Q = [HI]² / ([H₂]·[I₂])',
      formulaNote: 'Q < Kc: consome reagentes. Q > Kc: consome produtos. Q = Kc: equilíbrio.',
      hintCanvas: 'Enter/Espaço anuncia a comparação',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></svg>',
      def: 'Comparando Q com Kc dá pra prever se a reação ainda vai formar produto, reagente, ou já está no equilíbrio.',
      fatos: [
        { l: 'Expressão', v: '[HI]²/([H₂][I₂])' },
        { l: 'Q < Kc',    v: 'forma produto' },
        { l: 'Q > Kc',    v: 'forma reagente' },
        { l: 'Q = Kc',    v: 'equilíbrio' },
      ],
      canvasInteracao: 'Escolha concentrações livres e veja o veredito: pra qual lado a reação caminha.',
      overlay: 'Q contra K', panels: ['panel-qk'], primary: 'qk-status',
    },
    {
      id: 'escala', sigla: '0–14', nome: 'Escala de pH', sub: 'Substâncias do dia a dia',
      hint: 'Percorra a escala de pH, escolha substâncias do cotidiano e veja as concentrações de íons hidrônio e hidróxido.',
      info: 'O pH é o cologaritmo da concentração de H₃O⁺. Cada unidade de pH representa uma mudança de dez vezes na acidez. Como Kw = [H₃O⁺]·[OH⁻] = 10⁻¹⁴ a 25 °C, sempre vale pH + pOH = 14.',
      formula: 'pH = −log[H₃O⁺]   ·   pH + pOH = 14',
      formulaNote: 'Kw = [H₃O⁺]·[OH⁻] = 1,0·10⁻¹⁴ a 25 °C. pH < 7 ácido, = 7 neutro, > 7 básico.',
      hintCanvas: 'Setas ← → movem o pH; Enter/Espaço anuncia a leitura',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" /></svg>',
      def: 'Cada unidade de pH representa dez vezes mais ou menos acidez — a escala é logarítmica, não linear.',
      fatos: [
        { l: 'Fórmula', v: 'pH = −log[H₃O⁺]' },
        { l: 'Kw',      v: '1,0×10⁻¹⁴ (25 °C)' },
        { l: 'Neutro',  v: 'pH = 7' },
        { l: 'Faixa',   v: '0 a 14' },
      ],
      canvasInteracao: 'Mova o pH pela escala e veja [H₃O⁺]/[OH⁻] e qual substância do dia a dia tem aquele valor.',
      recomendados: ['Suco gástrico', 'Água pura', 'Soda cáustica'],
      overlay: 'Escala de pH', panels: ['panel-escala'], primary: 'esc-status',
    },
    {
      id: 'calculo', sigla: 'Ka, Kb', nome: 'Ácidos e Bases', sub: 'Fortes × fracos',
      hint: 'Compare a ionização de ácidos e bases fortes e fracos na mesma concentração e calcule o pH e o grau de ionização.',
      info: 'Eletrólito forte ioniza praticamente por completo; o fraco estabelece equilíbrio governado por Ka ou Kb. Por isso HCl 0,1 mol/L tem pH 1, enquanto ácido acético na mesma concentração fica perto de pH 2,9.',
      formula: '[H⁺] = (−Ka + √(Ka² + 4·Ka·C)) / 2',
      formulaNote: 'Solução exata do equilíbrio do ácido fraco. Grau de ionização α = [H⁺]/C.',
      hintCanvas: 'Enter/Espaço anuncia o pH calculado',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2" /><path d="M6.453 15h11.094" /><path d="M8.5 2h7" /></svg>',
      def: 'Ácido ou base forte ioniza quase 100%; o fraco estabelece um equilíbrio próprio, regido por Ka ou Kb.',
      fatos: [
        { l: 'HCl (forte)',     v: 'pH = 1' },
        { l: 'CH₃COOH (fraco)', v: 'Ka = 1,8×10⁻⁵' },
        { l: 'Grau α',          v: '[H⁺]/C' },
        { l: 'Fonte',           v: 'CRC Handbook' },
      ],
      canvasInteracao: 'Escolha um eletrólito forte ou fraco e compare o pH e o grau de ionização na mesma concentração.',
      recomendados: ['HCl', 'CH₃COOH', 'NH₃'],
      overlay: 'Cálculo de pH', panels: ['panel-calculo'], primary: 'calc-status',
    },
    {
      id: 'titulacao', sigla: 'V×pH', nome: 'Titulação', sub: 'HCl com NaOH',
      hint: 'Goteje base sobre o ácido, acompanhe a curva de titulação e observe a virada do indicador no ponto de equivalência.',
      info: 'Na titulação ácido forte–base forte, o pH sobe devagar até quase 25 mL e então salta bruscamente: é o ponto de equivalência, em pH 7. O indicador deve ter faixa de viragem dentro desse salto.',
      formula: 'no ponto de equivalência: n_ácido = n_base',
      formulaNote: '25,0 mL de HCl 0,100 mol/L exigem 25,0 mL de NaOH 0,100 mol/L. Antes: excesso de ácido. Depois: excesso de base.',
      hintCanvas: 'Enter/Espaço goteja base',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5c-1.4 0-2.5-1.1-2.5-2.5V2" /><path d="M8.5 2h7" /><path d="M14.5 16h-5" /></svg>',
      def: 'Perto do ponto de equivalência o pH salta bruscamente — é aí que o indicador precisa mudar de cor.',
      fatos: [
        { l: 'Ácido',       v: 'HCl 25,0 mL 0,100 M' },
        { l: 'Base',        v: 'NaOH 0,100 M' },
        { l: 'Equivalência', v: 'pH = 7' },
        { l: 'Indicador',   v: 'vira dentro do salto' },
      ],
      canvasInteracao: 'Goteje base sobre o ácido e acompanhe a curva de titulação subir, com o salto na equivalência.',
      recomendados: ['Fenolftaleína', 'Azul de bromotimol', 'Tornassol'],
      overlay: 'Titulação', panels: ['panel-titulacao'], primary: 'gotejar',
    },
    {
      id: 'kps', sigla: 'Kps', nome: 'Produto de Solubilidade', sub: 'Precipita ou não?',
      hint: 'Ajuste as concentrações dos dois íons, compare o produto iônico Q com o Kps do sal e veja o precipitado aparecer no instante em que Q passa de Kps.',
      info: 'Um sal pouco solúvel em contato com sua solução saturada estabelece um equilíbrio: AB(s) ⇌ A⁺(aq) + B⁻(aq). A constante desse equilíbrio é o produto de solubilidade Kps — e nela o sólido NÃO entra, porque sua concentração é constante. A regra de decisão é a mesma de qualquer equilíbrio, aplicada ao produto iônico Q: se Q < Kps a solução é insaturada e nada precipita; se Q = Kps ela está exatamente saturada; se Q > Kps o excesso precipita até Q voltar a Kps. Daí sai a solubilidade molar s: para AgCl, Kps = s² e s = √Kps; mas para CaF₂ a estequiometria muda a conta, porque Kps = s·(2s)² = 4s³. O efeito do ÍON COMUM é a consequência mais útil: acrescentar Cl⁻ a uma solução saturada de AgCl faz precipitar mais AgCl, porque o produto iônico foi empurrado acima do Kps sem que o Kps tenha mudado.',
      formula: 'Kps = [A⁺]^a · [B⁻]^b   ·   Q ⋛ Kps decide',
      formulaNote: 'O sólido não aparece na expressão. Q < Kps: insaturada, nada precipita. Q = Kps: saturada. Q > Kps: precipita o excesso. A solubilidade molar s sai de Kps considerando os coeficientes: AgCl → s = √Kps; CaF₂ → s = ∛(Kps/4); Fe(OH)₃ → s = ⁴√(Kps/27). Valores de Kps a 25 °C: CRC Handbook.',
      hintCanvas: 'Enter/Espaço anuncia a comparação Q × Kps',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6l1 4H8z" /><path d="M8 7h8l-1.2 12.2a2 2 0 0 1-2 1.8h-1.6a2 2 0 0 1-2-1.8z" /><circle cx="12" cy="12" r=".5" fill="currentColor" /><circle cx="10" cy="15" r=".5" fill="currentColor" /><circle cx="14" cy="15" r=".5" fill="currentColor" /></svg>',
      def: 'Kps é o teto do produto das concentrações dos íons: passar dele obriga o sal a precipitar de volta.',
      fatos: [
        { l: 'Expressão', v: 'Kps = [A⁺]ᵃ·[B⁻]ᵇ' },
        { l: 'Q < Kps',   v: 'insaturada' },
        { l: 'Q > Kps',   v: 'precipita' },
        { l: 'Sais',      v: '12 com Kps real' },
      ],
      canvasInteracao: 'Mova as concentrações dos dois íons e veja o precipitado surgir no exato momento em que Q ultrapassa o Kps.',
      recomendados: ['AgCl', 'CaF₂', 'Fe(OH)₃', 'Ag₂CrO₄'],
      overlay: 'Kps e precipitação', panels: ['panel-kps'], primary: 'kps-status',
    },
    {
      id: 'tampao', sigla: 'pH = pKa + log', nome: 'Solução Tampão', sub: 'Por que o sangue não muda de pH',
      hint: 'Pingue ácido ou base forte numa solução tampão e na água pura ao lado, e compare o quanto cada uma resiste.',
      info: 'Tampão é uma mistura de um ácido fraco com sua base conjugada em quantidades comparáveis. Ele resiste à variação de pH porque tem os dois lados do equilíbrio em estoque: se entra H⁺, a base conjugada o consome; se entra OH⁻, o ácido fraco o neutraliza. O pH sai da equação de Henderson-Hasselbalch: pH = pKa + log([base conjugada]/[ácido]). Duas consequências que valem decorar: quando as duas concentrações são IGUAIS, o log é zero e pH = pKa exatamente; e a faixa útil de tamponamento é pKa ± 1, porque fora dela um dos componentes já está praticamente esgotado. A capacidade de tamponamento depende da quantidade ABSOLUTA de cada componente — diluir um tampão não muda o pH (a razão se mantém), mas reduz o quanto ele suporta. O tampão carbônico/bicarbonato é o que mantém seu sangue entre 7,35 e 7,45.',
      formula: 'pH = pKa + log([A⁻]/[HA])',
      formulaNote: '[A⁻] = [HA] → pH = pKa. Faixa útil: pKa ± 1. Adicionar n mol de ácido forte converte n mol de A⁻ em HA (e vice-versa para base) — é assim que o simulador calcula o novo pH, sem aproximação. Ka a 25 °C: CRC Handbook.',
      hintCanvas: 'Enter/Espaço pinga ácido forte no tampão',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>',
      def: 'O tampão tem os dois lados do equilíbrio em estoque, então absorve H⁺ ou OH⁻ sem deixar o pH disparar.',
      fatos: [
        { l: 'Equação',      v: 'pH = pKa + log([A⁻]/[HA])' },
        { l: '[A⁻] = [HA]',  v: 'pH = pKa' },
        { l: 'Faixa útil',   v: 'pKa ± 1' },
        { l: 'No sangue',    v: 'H₂CO₃ / HCO₃⁻' },
      ],
      canvasInteracao: 'Adicione ácido ou base forte e compare, lado a lado, o tampão com a água pura: um quase não se move, a outra desaba.',
      recomendados: ['Acético / Acetato', 'Carbônico / Bicarbonato', 'Fosfato'],
      overlay: 'Solução tampão', panels: ['panel-tampao'], primary: 'tamp-acido',
    },
    {
      id: 'hidrolise', sigla: 'Kh = Kw/Ka', nome: 'Hidrólise Salina', sub: 'O pH que o sal produz',
      hint: 'Dissolva sais diferentes em água pura e descubra por que alguns deixam a solução ácida, outros básica, e poucos realmente neutra.',
      info: 'Dizer que “sal é neutro” é errado. Ao dissolver, os íons do sal podem reagir com a água — é a hidrólise salina — e o resultado depende da FORÇA do ácido e da base que originaram aquele sal. São quatro casos. Base forte + ácido forte: nenhum íon reage e o pH fica em 7 (NaCl, KNO₃). Base forte + ácido fraco: o ânion, sendo base conjugada de um ácido fraco, rouba H⁺ da água e sobra OH⁻ — solução BÁSICA (CH₃COONa, NaHCO₃). Base fraca + ácido forte: o cátion cede H⁺ à água — solução ÁCIDA (NH₄Cl). Base fraca + ácido fraco: os dois hidrolizam e vence o de maior constante — no NH₄CN, o Ka do HCN é muito menor que o Kb da NH₃, então o ânion domina e a solução fica básica; já no CH₃COONH₄ as duas constantes são praticamente iguais e o pH volta a 7. A constante de hidrólise é Kh = Kw/Ka para o ânion, ou Kw/Kb para o cátion — quanto MAIS fraco o ácido de origem, MAIOR a hidrólise do seu ânion.',
      formula: 'Kh = Kw/Ka   ·   [OH⁻] = √(Kh·C)',
      formulaNote: 'Quatro casos: forte+forte → pH 7 · forte+fraco → básico · fraco+forte → ácido · fraco+fraco → decide o maior K. O simulador resolve o equilíbrio de hidrólise pela equação de 2º grau completa, não pela aproximação √(Kh·C), para valer também em concentrações baixas. Kw = 1,0·10⁻¹⁴ a 25 °C.',
      hintCanvas: 'Enter/Espaço anuncia o pH e o caso de hidrólise',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>',
      def: 'O pH de uma solução de sal depende da força do ácido e da base que o formaram — só forte com forte dá neutro.',
      fatos: [
        { l: 'forte + forte', v: 'pH = 7 (neutro)' },
        { l: 'forte + fraco', v: 'pH > 7 (básico)' },
        { l: 'fraco + forte', v: 'pH < 7 (ácido)' },
        { l: 'Constante',     v: 'Kh = Kw/Ka' },
      ],
      canvasInteracao: 'Escolha o sal e a concentração: o béquer muda de cor com o pH calculado e o painel mostra qual íon hidrolizou.',
      recomendados: ['NaCl', 'CH₃COONa', 'NH₄Cl', 'NH₄CN'],
      overlay: 'Hidrólise salina', panels: ['panel-hidrolise'], primary: 'hid-status',
    },
  ],

  CURIOSIDADES: [
    'A seta dupla ⇌ indica equilíbrio dinâmico: nada para, as velocidades apenas se igualam.',
    'Kc depende só da temperatura — mudar concentração ou pressão desloca o equilíbrio, mas não altera K.',
    'O processo Haber-Bosch usa alta pressão para deslocar N₂ + 3 H₂ ⇌ 2 NH₃ para o lado com menos mols de gás.',
    'O NO₂ castanho da poluição urbana está sempre em equilíbrio com o N₂O₄ incolor: dia quente deixa o ar mais amarelado.',
    'No sangue, CO₂ + H₂O ⇌ H₂CO₃ ⇌ H⁺ + HCO₃⁻ mantém o pH perto de 7,4; hiperventilar desloca esse equilíbrio.',
    'Catalisador não desloca equilíbrio: ele acelera as duas reações igualmente e só faz chegar mais rápido ao mesmo ponto.',
    'A formação de cáries envolve o equilíbrio da hidroxiapatita do esmalte; o flúor desloca-o para um mineral mais resistente.',
    'Cada unidade de pH vale dez vezes: pH 3 é cem vezes mais ácido que pH 5.',
    'O sangue humano fica entre 7,35 e 7,45; fora dessa faixa estreita o organismo entra em acidose ou alcalose.',
    'Chuva natural já é levemente ácida (pH ≈ 5,6) por causa do CO₂ dissolvido; chuva ácida tem pH abaixo de 5.',
    'O repolho roxo é um indicador natural: vermelho em meio ácido, verde-amarelado em meio muito básico.',
    'O suco gástrico chega a pH 1,5: a mucosa se protege com uma camada de bicarbonato e muco.',
    'Antiácidos são bases fracas — hidróxido de magnésio ou bicarbonato — que neutralizam o excesso de HCl estomacal.',
    'A água pura tem pH 7 só a 25 °C; a 100 °C o Kw aumenta e a água neutra tem pH próximo de 6,1.',
    'O sulfato de bário é engolido como contraste de raio X apesar de o Ba²⁺ ser tóxico: o Kps é tão baixo (1,1·10⁻¹⁰) que praticamente nenhum íon livre chega ao sangue.',
    'A “chuva de ouro” do laboratório é PbI₂ recristalizando: quente ele dissolve, frio o Kps cai e ele precipita em plaquetas douradas.',
    'Estalactites e cavernas são Kps em ação: CaCO₃ dissolve com CO₂ e água, e reprecipita quando o CO₂ escapa.',
    'Pasta de dente com flúor troca a hidroxiapatita do esmalte por fluorapatita, que tem Kps muito menor — o dente passa a resistir mais ao ácido.',
    'Num tampão, DILUIR não muda o pH: a razão [A⁻]/[HA] permanece. O que cai é a capacidade — ele passa a suportar menos ácido antes de ceder.',
    'Prender a respiração acumula CO₂ e desloca H₂CO₃ ⇌ H⁺ + HCO₃⁻ para a direita: o sangue acidifica, e é isso que dispara a vontade de respirar.',
    'Bicarbonato de sódio alivia azia por hidrólise: o ânion HCO₃⁻ é base conjugada de um ácido fraco e deixa a solução básica.',
    'Nitrato de amônio dissolvido dá solução ÁCIDA por hidrólise do NH₄⁺ — e ainda esfria a água, porque a dissolução é endotérmica.',
  ],
};
