/* ================================================================
   SIPT — dadospetroleo.js | dados fixos de Cinética Química
   ================================================================
   FONTES:
   - Ea da decomposição do H₂O₂ (sem/iodeto/catalase): Purdue University
     Chem Demos "19.6 Catalytic Decomposition of Hydrogen Peroxide"
     (chemed.chem.purdue.edu/demos/demosheets/19.6.html) — mesma página
     cobre também a via de platina coloidal.
   - ΔH da reação: Quizlet/Bursten et al., Chemistry: The Central Science
     15ed — ΔH = −196,1 kJ para 2 H₂O₂ → 2 H₂O + O₂ (−98 kJ/mol H₂O₂).
   - Mecanismo em duas etapas (iodeto): Brown, LeMay & Bursten, Chemistry:
     The Central Science (mecanismo padrão de livro-texto).
   - Reações de referência do Gráfico de Arrhenius (N₂O₅, ciclopropano):
     ver comentário no array ARRHENIUS_EXTRA.
   - Exemplos reais de ordem de reação: OpenStax Chemistry 2e (NH₃ sobre
     W/SiO₂) e Brown, Chemistry: The Central Science (decomposição do NO₂).
   - Potenciais-padrão de redução (Mg/Zn/Fe, usados para ordenar a
     reatividade no modo Superfície): mesma fonte já citada no cabeçalho
     de dadoseletroquimica.js.
   Regra de van 't Hoff (Q₁₀ ≈ 2) usada como modelo didático em alguns
   modos — documentado localmente onde aparece.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIPT',
  TITLE: 'Simulador Interativo de Cinética Química',

  /* ── Caminhos de reação da decomposição do H₂O₂ ──
     Fonte de todas as Ea: Purdue University Chem Demos 19.6. */
  CAMINHOS: [
    { id: 'sem',      nome: 'Sem catalisador',   ea: 75, dot: '#94a3b8', nota: 'reação lenta à temperatura ambiente' },
    { id: 'iodeto',   nome: 'Iodeto (I⁻)',       ea: 57, dot: '#a78bfa', nota: 'catálise homogênea' },
    { id: 'catalase', nome: 'Catalase (enzima)', ea: 23, dot: '#4ade80', nota: 'catálise enzimática — a mais eficiente' },
    { id: 'platina',  nome: 'Platina coloidal',  ea: 49, dot: '#f472b6', nota: 'catálise heterogênea (metal em suspensão)' },
  ],
  DH: -98,          // kJ por mol de H₂O₂
  EQ_TXT: '2 H₂O₂(aq) → 2 H₂O(l) + O₂(g)',
  R_KJ: 0.008314,   // kJ·mol⁻¹·K⁻¹

  /* ── Mecanismo em duas etapas da via do iodeto ──
     Etapa 1 é a lenta/determinante — por isso sua Ea é a mesma Ea
     medida para a via do iodeto (57 kJ/mol). A etapa 2 não tem Ea
     tabelada isoladamente em fonte introdutória; é desenhada só
     qualitativamente (mais baixa/rápida), sem valor inventado. */
  MECANISMO_IODETO: {
    etapas: [
      { eq: 'H₂O₂ + I⁻ → H₂O + IO⁻', tag: 'lenta — determina a velocidade' },
      { eq: 'IO⁻ + H₂O₂ → H₂O + O₂ + I⁻', tag: 'rápida' },
    ],
    intermediario: 'IO⁻ (hipoiodito)',
    leiVelocidade: 'v = k [H₂O₂] [I⁻]',
  },

  /* ══════════════════════════════════════════════════════════════
     MODO 7 — MECANISMO DE REAÇÃO E ETAPA DETERMINANTE
     Este dado ja existia no arquivo (MECANISMO_IODETO, acima) e nao era
     usado por NENHUM modulo: alimentava apenas texto. Agora vira mecanica.

     Campos de cada mecanismo:
       global      equacao global observada
       etapas      cada etapa elementar, com `lenta` marcando a determinante
                   e `mol` a molecularidade (nº de espécies que colidem)
       lei         lei de velocidade EXPERIMENTAL
       inter       intermediários (aparecem e desaparecem)
       cat         catalisador (entra e é regenerado) — pode ser null
       ordemGlobal soma dos expoentes da lei
       pega        a confusão que o mecanismo desmonta
     FONTES: Brown & LeMay, Química: a Ciência Central; Atkins.
  ══════════════════════════════════════════════════════════════ */
  MECANISMOS: [
    {
      id: 'iodeto',
      nome: 'Decomposição do H₂O₂ com I⁻',
      global: '2 H₂O₂ → 2 H₂O + O₂',
      lei: 'v = k·[H₂O₂]·[I⁻]',
      ordemGlobal: 2,
      inter: ['IO⁻'],
      cat: 'I⁻',
      etapas: [
        { eq: 'H₂O₂ + I⁻ → H₂O + IO⁻', lenta: true,  mol: 2, ea: 57,
          nota: 'Etapa LENTA: é ela que dita a velocidade do conjunto. Repare que o I⁻ aparece aqui, e é por isso que ele entra na lei de velocidade mesmo sem estar na equação global.' },
        { eq: 'IO⁻ + H₂O₂ → H₂O + O₂ + I⁻', lenta: false, mol: 2, ea: 21,
          nota: 'Etapa rápida, que regenera o I⁻ — a assinatura de um catalisador.' },
      ],
      pega: 'A equação global tem coeficiente 2 no H₂O₂, mas a ordem em relação a ele é 1. Ordem NÃO se lê dos coeficientes: ela vem do experimento, e aqui vem da etapa lenta.',
    },
    {
      id: 'no2co',
      nome: 'NO₂ + CO',
      global: 'NO₂ + CO → NO + CO₂',
      lei: 'v = k·[NO₂]²',
      ordemGlobal: 2,
      inter: ['NO₃'],
      cat: null,
      etapas: [
        { eq: 'NO₂ + NO₂ → NO₃ + NO', lenta: true,  mol: 2, ea: 111,
          nota: 'A etapa lenta consome DUAS moléculas de NO₂ — daí o expoente 2 na lei.' },
        { eq: 'NO₃ + CO → NO₂ + CO₂', lenta: false, mol: 2, ea: 30,
          nota: 'Etapa rápida. O CO só participa aqui.' },
      ],
      pega: 'O caso mais didático de todos: o CO está na equação global e NÃO aparece na lei de velocidade. Motivo: ele só entra na etapa RÁPIDA, e a velocidade do conjunto é ditada pela lenta.',
    },
    {
      id: 'no2f2',
      nome: 'NO₂ + F₂',
      global: '2 NO₂ + F₂ → 2 NO₂F',
      lei: 'v = k·[NO₂]·[F₂]',
      ordemGlobal: 2,
      inter: ['F'],
      cat: null,
      etapas: [
        { eq: 'NO₂ + F₂ → NO₂F + F', lenta: true,  mol: 2, ea: 84,
          nota: 'A etapa lenta é bimolecular e usa 1 NO₂ e 1 F₂ — exatamente os expoentes da lei.' },
        { eq: 'NO₂ + F → NO₂F', lenta: false, mol: 2, ea: 8,
          nota: 'O átomo de flúor livre é um intermediário reativíssimo: é consumido tão rápido quanto aparece.' },
      ],
      pega: 'A global tem coeficiente 2 no NO₂, mas a ordem em NO₂ é 1. De novo: coeficiente da global ≠ expoente da lei.',
    },
    {
      id: 'ozonio',
      nome: 'Destruição do ozônio por CFC',
      global: '2 O₃ → 3 O₂',
      lei: 'v = k·[O₃]·[Cl]',
      ordemGlobal: 2,
      inter: ['ClO'],
      cat: 'Cl',
      etapas: [
        { eq: 'Cl + O₃ → ClO + O₂', lenta: true,  mol: 2, ea: 2.1,
          nota: 'Etapa lenta, mas com Ea baixíssima — é por isso que um único átomo de cloro consegue destruir milhares de moléculas de ozônio.' },
        { eq: 'ClO + O → Cl + O₂', lenta: false, mol: 2, ea: 0.4,
          nota: 'O cloro é REGENERADO: ele volta ao início e ataca outro ozônio. Catálise em cadeia — e a razão de os CFCs terem sido proibidos.' },
      ],
      pega: 'O cloro não aparece na equação global porque é catalisador: entra e sai inalterado. Mas está na lei de velocidade, porque participa da etapa lenta.',
    },
  ],

  /* ── Exemplos reais de cada ordem de reação (informativo) ──
     Ordem 0: OpenStax Chemistry 2e — decomposição do NH₃ é de ordem
     zero sobre superfície de tungstênio (W), mas de 1ª ordem sobre
     quartzo (SiO₂) — mesma reação, ordem diferente por causa do
     catalisador de superfície.
     Ordem 1: a própria reação-base do SIPT (decomposição do H₂O₂).
     Ordem 2: Brown, Chemistry: The Central Science — decomposição do
     NO₂ (2 NO₂ → 2 NO + O₂) é o exemplo clássico de 2ª ordem. */
  ORDEM_EXEMPLOS: [
    { nome: 'Decomposição do NH₃ sobre tungstênio (W)', eq: '2 NH₃(g) → N₂(g) + 3 H₂(g)', fonte: 'OpenStax Chemistry 2e' },
    { nome: 'Decomposição do H₂O₂ (reação-base do SIPT)', eq: '2 H₂O₂(aq) → 2 H₂O(l) + O₂(g)', fonte: 'mesma reação dos outros modos' },
    { nome: 'Decomposição do NO₂', eq: '2 NO₂(g) → 2 NO(g) + O₂(g)', fonte: 'Brown, Chemistry: The Central Science' },
  ],

  /* ── Reações de referência do Gráfico de Arrhenius ──
     Diferente dos CAMINHOS (que usam um fator pré-exponencial A
     ilustrativo, mesmo para todas as vias do H₂O₂), estas duas trazem
     Ea E A realmente medidos/tabelados — "especificidades próprias":
     - N₂O₅: Ea = 102,2 kJ/mol, A = 2,81×10¹³ s⁻¹ (1ª ordem).
       Fonte: problema-padrão reproduzido em bartleby/transtutors a
       partir de livro-texto de físico-química.
     - Isomerização do ciclopropano → propeno: Ea = 272 kJ/mol,
       A = 1×10¹⁵ s⁻¹ (1ª ordem). Fonte: MIT OpenCourseWare, 5.111SC
       Principles of Chemical Science, solução da Lecture 33. */
  ARRHENIUS_EXTRA: [
    { id: 'n2o5', nome: 'Decomposição do N₂O₅', eq: 'N₂O₅(g) → 2 NO₂(g) + ½ O₂(g)',
      ea: 102.2, aFator: 2.81e13, dot: '#38bdf8', fonte: 'valor de livro-texto (bartleby/transtutors)' },
    { id: 'ciclopropano', nome: 'Ciclopropano → propeno', eq: 'C₃H₆(g) → CH₂=CH–CH₃(g)',
      ea: 272, aFator: 1e15, dot: '#fb923c', fonte: 'MIT OpenCourseWare 5.111SC' },
  ],

  /* ── Substâncias e soluções do modo Superfície de Contato ──
     Sólidos: a ordem de reatividade dos metais (Mg > Al > Zn > Fe)
     segue os potenciais-padrão já usados no simulador de Eletroquímica
     (E° Mg²⁺/Mg=−2,37V, Al³⁺/Al=−1,66V, Zn²⁺/Zn=−0,76V, Fe²⁺/Fe=−0,44V).
     O alumínio é uma exceção conhecida: apesar do E° favorável, sua
     camada de óxido (Al₂O₃) o passiva e retarda a reação na prática —
     por isso seu relK é mais baixo do que o E° sozinho sugeriria.
     CaCO₃ e NaHCO₃ são os carbonatos clássicos do experimento de
     mármore/bicarbonato + ácido.
     relK é um modelo didático (ordem real, magnitude ilustrativa).

     Soluções: a força relativa segue o grau de ionização — ácidos
     fortes (HCl, H₂SO₄ diluído) ionizam quase por completo, o ácido
     acético (vinagre) é fraco e ioniza pouco, reagindo bem mais devagar
     na mesma concentração (mesmo racional do simulador de Soluções/pH).
     H₂SO₄ com carbonatos também pode formar sulfato de cálcio pouco
     solúvel, que retarda a reação real — não modelado aqui. */
  SUP_SUBSTANCIAS: [
    { id: 'caco3', nome: 'Carbonato de cálcio (mármore)', formula: 'CaCO₃',
      eq: 'CaCO₃(s) + 2 H⁺(aq) → Ca²⁺(aq) + H₂O(l) + CO₂(g)', gas: 'CO₂', relK: 1, cor: '#94a3b8' },
    { id: 'nahco3', nome: 'Bicarbonato de sódio', formula: 'NaHCO₃',
      eq: 'NaHCO₃(s) + H⁺(aq) → Na⁺(aq) + H₂O(l) + CO₂(g)', gas: 'CO₂', relK: 1.8, cor: '#e5e7eb' },
    { id: 'mg', nome: 'Magnésio', formula: 'Mg',
      eq: 'Mg(s) + 2 H⁺(aq) → Mg²⁺(aq) + H₂(g)', gas: 'H₂', relK: 3.5, cor: '#cbd5e1' },
    { id: 'al', nome: 'Alumínio', formula: 'Al',
      eq: '2 Al(s) + 6 H⁺(aq) → 2 Al³⁺(aq) + 3 H₂(g)', gas: 'H₂', relK: 1.1, cor: '#e2e8f0',
      nota: 'E° favorável, mas a camada de óxido (Al₂O₃) passiva a superfície e retarda o início da reação' },
    { id: 'zn', nome: 'Zinco', formula: 'Zn',
      eq: 'Zn(s) + 2 H⁺(aq) → Zn²⁺(aq) + H₂(g)', gas: 'H₂', relK: 1.4, cor: '#a3a3a3' },
    { id: 'fe', nome: 'Ferro', formula: 'Fe',
      eq: 'Fe(s) + 2 H⁺(aq) → Fe²⁺(aq) + H₂(g)', gas: 'H₂', relK: 0.5, cor: '#78716c' },
  ],
  SUP_SOLUCOES: [
    { id: 'hcl', nome: 'Ácido clorídrico (HCl)', relK: 1, nota: 'ácido forte — ioniza quase por completo' },
    { id: 'h2so4', nome: 'Ácido sulfúrico diluído (H₂SO₄)', relK: 0.85, nota: 'ácido forte, mas pode formar sais pouco solúveis com alguns sólidos' },
    { id: 'acetico', nome: 'Ácido acético (vinagre)', relK: 0.15, nota: 'ácido fraco — ioniza pouco, reage bem mais devagar' },
  ],

  MODES: [
    {
      id: 'colisoes', sigla: 'A + B', nome: 'Teoria das Colisões', sub: 'Energia + orientação',
      hint: 'Ajuste concentração, temperatura e catalisador. Cada partícula "aponta" uma direção reativa (o tracinho claro) — repare que só colisões com energia suficiente E orientação alinhada viram produto.',
      info: 'Para reagir, uma colisão precisa de DOIS requisitos ao mesmo tempo (Brown, Chemistry: The Central Science, cap. de Cinética): energia igual ou maior que a Ea, e orientação geometricamente favorável entre as partículas. Aqui os dois fatores são simulados separadamente: o tracinho em cada partícula mostra sua "face reativa"; um choque só forma produto (flash verde) se a energia for suficiente E as faces estiverem voltadas uma para a outra dentro de uma janela angular. Energia insuficiente = colisão comum (sem flash); energia suficiente mas orientação errada = quase-reação (flash âmbar, não conta como produto).',
      formula: 'v ∝ (freq. de colisões) × (fração c/ energia) × (fração c/ orientação)',
      formulaNote: 'A janela de orientação (±70°) é um modelo didático genérico — fatores estéricos reais variam muito reação a reação e não estão tabelados para o H₂O₂ em fonte introdutória.',
      hintCanvas: 'Enter/Espaço reinicia a mistura',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>',
      def: 'Uma colisão só forma produto se tiver energia suficiente E orientação favorável ao mesmo tempo — os dois fatores da teoria das colisões.',
      fatos: [
        { l: 'Fórmula',        v: 'v∝freq×f(energia)×f(orientação)' },
        { l: 'Aumenta v',      v: 'T↑, concentração↑, catalisador' },
        { l: 'Flash âmbar',    v: 'energia OK, orientação errada' },
        { l: 'Flash verde',    v: 'energia OK + orientação OK = produto' },
      ],
      canvasInteracao: 'Ajuste concentração, temperatura e catalisador e veja quais colisões têm energia e orientação certas para formar produto.',
      overlay: 'Colisões', panels: ['panel-colisoes'], primary: 'col-reset',
    },
    {
      id: 'superficie', sigla: 'A_s', nome: 'Superfície de Contato', sub: 'Fragmentação do sólido',
      hint: 'Escolha a substância e a solução, o grau de fragmentação, e clique em "Depositar e iniciar" — o sólido cai no béquer e só então a reação é cronometrada.',
      info: 'Fragmentar um sólido não muda a quantidade de matéria nem o volume final de produto — só a área de superfície exposta ao líquido reagente. Mais área exposta significa mais colisões por segundo entre as partículas do sólido e do ácido, logo uma reação mais rápida. É por isso que mármore em pó reage com ácido muito mais rápido que uma pedra inteira, mesmo liberando o mesmo volume de gás no final (experimento clássico de mármore/HCl). Metais diferentes também reagem em velocidades bem diferentes com o mesmo ácido — a ordem usada aqui (Mg > Al > Zn > Fe) segue os potenciais-padrão de redução, os mesmos do simulador de Eletroquímica (com uma exceção conhecida: o alumínio reage mais devagar do que o E° sozinho sugere, por causa da camada de óxido protetora). A solução também importa: ácidos fortes como HCl ionizam quase por completo e reagem bem mais rápido que um ácido fraco como o vinagre na mesma concentração.',
      formula: 'V(t) = V∞·(1 − e^(−k·t))   ·   k ∝ área exposta × reatividade da substância × força do ácido',
      formulaNote: 'A curva sobe mais rápido com mais fragmentos, substância mais reativa ou ácido mais forte, mas todas chegam ao mesmo platô V∞.',
      hintCanvas: 'Enter/Espaço deposita e inicia a reação',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 9v6" /><path d="M16 15v6" /><path d="M16 3v6" /><path d="M3 15h18" /><path d="M3 9h18" /><path d="M8 15v6" /><path d="M8 3v6" /></svg>',
      def: 'Quebrar o sólido em pedaços menores aumenta a área exposta ao ácido, acelerando a reação sem mudar o volume final de gás.',
      fatos: [
        { l: 'Fórmula',       v: 'V(t)=V∞(1−e^(−kt))' },
        { l: 'k depende de',  v: 'área, substância e ácido' },
        { l: 'Volume final',  v: 'não muda' },
        { l: 'Pó fino',       v: 'reação quase instantânea' },
      ],
      canvasInteracao: 'Escolha a substância, a solução e o grau de fragmentação, depois deposite o sólido pra cronometrar a dissolução.',
      overlay: 'Superfície de contato', panels: ['panel-superficie-subst', 'panel-superficie-controles'], primary: 'sup-play',
    },
    {
      id: 'curva', sigla: '[A] × t', nome: 'Velocidade da Reação', sub: 'Média e instantânea',
      hint: 'Escolha uma via do H₂O₂ ou uma reação de referência, ajuste [A]₀ e temperatura, e clique em "Iniciar corrida" — a corrida só começa quando você mandar.',
      info: 'A velocidade média é a variação da concentração dividida pelo intervalo de tempo. Na curva, ela é a inclinação da reta secante entre dois pontos; a instantânea é a tangente. O k usado aqui vem da mesma equação de Arrhenius do modo Energia — mudar a reação ou a temperatura muda k de verdade, não é mais um multiplicador arbitrário. As reações de referência (N₂O₅, ciclopropano) usam Ea e A reais, diferentes dos ilustrativos do H₂O₂.',
      formula: 'v_m = −Δ[A]/Δt   ·   [A] = [A]₀·e^(−k·t)   ·   k = A·e^(−Ea/RT)',
      formulaNote: 'Modelo de 1ª ordem. t½ = ln2/k é o tempo de meia-vida — independe da concentração inicial.',
      hintCanvas: 'Enter/Espaço inicia a corrida',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 17h6v-6" /><path d="m22 17-8.5-8.5-5 5L2 7" /></svg>',
      def: 'A velocidade média é a variação da concentração dividida pelo tempo — a inclinação da reta secante na curva.',
      fatos: [
        { l: 'Fórmula', v: 'v_m = −Δ[A]/Δt' },
        { l: 'Modelo',  v: '[A]=[A]₀·e^(−kt)' },
        { l: 't½',      v: 'ln2 / k' },
        { l: 'Ordem',   v: '1ª ordem' },
      ],
      canvasInteracao: 'Escolha a reação e a temperatura, inicie a corrida e calcule a velocidade média entre dois instantes.',
      overlay: 'Curva cinética', panels: ['panel-curva-subst', 'panel-curva-controles'], primary: 'cur-play',
    },
    {
      id: 'ordem', sigla: 'n', nome: 'Ordem de Reação', sub: 'Zero, 1ª e 2ª ordem',
      hint: 'Escolha a ordem "verdadeira" — cada uma tem um exemplo real associado — ajuste [A]₀ e k, e clique em "Iniciar corrida" pra ver qual gráfico linearizado fica reto.',
      info: 'A ordem de uma reação NÃO vem dos coeficientes da equação balanceada — ela só é conhecida por experimento. O método gráfico usa essa ideia: para ordem zero o gráfico de [A]×t já é reto; para 1ª ordem é ln[A]×t que fica reto; para 2ª ordem é 1/[A]×t. Cada ordem aqui tem um exemplo real de livro-texto associado (veja a aba Resultados).',
      formula: '[A]=[A]₀−kt (0) · [A]=[A]₀e^(−kt) (1ª) · 1/[A]=1/[A]₀+kt (2ª)',
      formulaNote: 'A meia-vida se comporta diferente em cada ordem: diminui ao longo da reação (0), é constante (1ª) ou aumenta (2ª).',
      hintCanvas: 'Enter/Espaço inicia a corrida',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 7h6v6" /><path d="m22 7-8.5 8.5-5-5L2 17" /></svg>',
      def: 'A ordem de uma reação é determinada experimentalmente, não pelos coeficientes da equação — o gráfico que fica reto revela a ordem.',
      fatos: [
        { l: 'Ordem 0', v: '[A]=[A]₀−kt' },
        { l: 'Ordem 1', v: '[A]=[A]₀e^(−kt)' },
        { l: 'Ordem 2', v: '1/[A]=1/[A]₀+kt' },
        { l: 'Meia-vida', v: 'muda com a ordem' },
      ],
      canvasInteracao: 'Escolha a ordem, inicie a corrida e veja o gráfico da transformação certa ficar reto.',
      overlay: 'Ordem de reação', panels: ['panel-ordem'], primary: 'ord-play',
    },
    {
      id: 'energia', sigla: 'Ea', nome: 'Energia de Ativação', sub: 'Diagrama e catálise',
      hint: 'Toque no botão ⇄ no canto do canvas pra alternar entre o diagrama de energia e a curva de Maxwell-Boltzmann — assim cada gráfico ocupa a tela inteira e fica mais fácil de ler.',
      info: 'O catalisador oferece um caminho alternativo com energia de ativação menor — ele NÃO muda o ΔH nem o rendimento, só a velocidade. A distribuição de Maxwell-Boltzmann mostra quantas moléculas têm energia acima de Ea.',
      formula: 'k = A·e^(−Ea/RT)',
      formulaNote: 'A área sombreada da curva de Maxwell-Boltzmann à direita de Ea é a fração de moléculas com energia suficiente.',
      hintCanvas: 'Enter/Espaço anuncia a comparação dos caminhos',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 3 4 8 5-5 5 15H2L8 3z" /></svg>',
      def: 'O catalisador oferece um caminho com Ea menor — não muda o ΔH nem o rendimento, só a velocidade. O botão ⇄ no canto do canvas alterna a visualização.',
      fatos: [
        { l: 'Fórmula',          v: 'k = A·e^(−Ea/RT)' },
        { l: 'Sem catalisador',  v: 'Ea = 75 kJ/mol' },
        { l: 'Catalase (enzima)', v: 'Ea = 23 kJ/mol' },
        { l: 'Botão ⇄',          v: 'alterna diagrama/Maxwell-Boltzmann' },
      ],
      canvasInteracao: 'Compare os caminhos no diagrama de energia; use o botão no canvas pra ver a curva de Maxwell-Boltzmann em tela cheia.',
      recomendados: ['Sem catalisador', 'Iodeto (I⁻)', 'Catalase (enzima)', 'Platina coloidal'],
      overlay: 'Energia de ativação', panels: ['panel-energia'], primary: 'ene-status',
    },
    {
      id: 'arrhenius', sigla: 'ln k', nome: 'Gráfico de Arrhenius', sub: 'Descobrindo Ea pelos dados',
      hint: 'Escolha uma via do H₂O₂ ou uma reação de referência com dados reais tabelados, meça k em pelo menos duas temperaturas e veja a reta de ln k × 1/T aparecer.',
      info: 'Tomando o logaritmo natural dos dois lados da equação de Arrhenius, k=A·e^(−Ea/RT) vira uma reta: ln k = −(Ea/R)·(1/T) + ln A. As reações de referência (N₂O₅, ciclopropano) usam Ea E fator pré-exponencial A realmente medidos — diferente das vias do H₂O₂, que compartilham um A ilustrativo.',
      formula: 'ln k = −(Ea/R)·(1/T) + ln A',
      formulaNote: 'Nas vias do H₂O₂ os dados são gerados sem ruído experimental. Nas reações de referência, Ea e A vêm de fonte real.',
      hintCanvas: 'Enter/Espaço mede k na temperatura atual',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></svg>',
      def: 'Linearizando a equação de Arrhenius, a inclinação do gráfico de ln k contra 1/T revela a energia de ativação.',
      fatos: [
        { l: 'Fórmula',        v: 'lnk=−(Ea/R)(1/T)+lnA' },
        { l: 'Inclinação',     v: '−Ea/R' },
        { l: 'Intercepto',     v: 'ln A' },
        { l: 'Mínimo de pontos', v: '2 temperaturas' },
      ],
      canvasInteracao: 'Ajuste a temperatura, meça k, repita em outra temperatura e veja a reta e a Ea calculada aparecerem.',
      overlay: 'Gráfico de Arrhenius', panels: ['panel-arrhenius'], primary: 'arr-medir',
    },
    {
      id: 'mecanismo', sigla: 'etapa lenta', nome: 'Mecanismo de Reação', sub: 'Quem dita a velocidade',
      hint: 'Veja a reação global se decompor em etapas elementares e descubra por que a lei de velocidade não sai dos coeficientes.',
      info: 'Quase nenhuma reação acontece numa única colisão. O que se escreve como equação global costuma ser a soma de várias etapas ELEMENTARES, e essas sim acontecem num só choque. A consequência prática é a mais cobrada do capítulo: a lei de velocidade NÃO se lê dos coeficientes da equação global. Ela vem do experimento, e o experimento reflete a etapa mais LENTA — a etapa determinante, que funciona como o gargalo de uma fila. Numa etapa elementar, e só nela, os expoentes coincidem com os coeficientes; a molecularidade é quantas espécies precisam colidir ali. Dois sinais ajudam a ler um mecanismo. Intermediário é a espécie que APARECE numa etapa e é CONSUMIDA em outra, então não sobra na global. Catalisador é o contrário: é CONSUMIDO primeiro e REGENERADO depois, então também não aparece na global — mas, se ele participar da etapa lenta, aparece na lei de velocidade. É exatamente isso que acontece com o I⁻ na decomposição do peróxido, e com o cloro atacando o ozônio.',
      formula: 'a lei de velocidade sai da ETAPA LENTA, não da equação global',
      formulaNote: 'Numa etapa elementar os expoentes da lei SÃO os coeficientes daquela etapa. A soma dos expoentes é a ordem global. Intermediário: aparece e depois é consumido. Catalisador: é consumido e depois regenerado. Mecanismos conferidos contra Brown & LeMay e Atkins.',
      hintCanvas: 'Setas ← → percorrem as etapas; Enter/Espaço reproduz o mecanismo',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>',
      def: 'A velocidade de uma reação em várias etapas é ditada pela etapa mais lenta — o gargalo do processo.',
      fatos: [
        { l: 'Etapa lenta',  v: 'determina a velocidade' },
        { l: 'Etapa elementar', v: 'expoente = coeficiente' },
        { l: 'Intermediário', v: 'aparece e é consumido' },
        { l: 'Catalisador',  v: 'consumido e regenerado' },
      ],
      canvasInteracao: 'Percorra as etapas e veja o gargalo: a etapa lenta trava a fila, e é ela que define os expoentes da lei de velocidade.',
      recomendados: ['NO₂ + CO', 'H₂O₂ com I⁻', 'Ozônio e CFC'],
      overlay: 'Mecanismo de reação', panels: ['panel-mecanismo'], primary: 'mec-play',
    },
  ],

  CURIOSIDADES: [
    'A regra de van \'t Hoff diz que cada 10 °C a mais costuma dobrar a velocidade de uma reação — por isso a geladeira conserva alimentos.',
    'A catalase do fígado decompõe peróxido de hidrogênio milhões de vezes mais rápido que a reação sem catalisador: é a espuma da água oxigenada no machucado.',
    'O catalisador não é consumido: ele participa do mecanismo e é regenerado no fim.',
    'Na reação NO₂ + CO → NO + CO₂ o monóxido de carbono não aparece na lei de velocidade: ele só entra na etapa rápida, e a lenta é que manda.',
    'Um único átomo de cloro vindo de CFC destrói cerca de 100 mil moléculas de ozônio, porque é regenerado a cada ciclo do mecanismo.',
    'Reação elementar é a única em que os expoentes da lei de velocidade são iguais aos coeficientes — nas demais, os expoentes vêm do experimento.',
    'Etapa determinante é gargalo: acelerar a etapa rápida não muda quase nada na velocidade total, como abrir mais caixas numa fila que trava na entrada.',
    'Palha de aço enferruja mais rápido que um prego porque a superfície de contato é muito maior.',
    'Catalisadores automotivos de platina e ródio convertem CO e NOₓ em CO₂ e N₂ antes da saída do escapamento.',
    'A explosão de pó de farinha em silos acontece porque partículas finíssimas reagem com o oxigênio quase instantaneamente.',
    'Enzimas são catalisadores biológicos tão seletivos que costumam agir sobre um único substrato.',
    'Magnésio reage tão rápido com ácido diluído que é um clássico de demonstração em sala de aula — zinco e ferro reagem visivelmente mais devagar com o mesmo ácido.',
  ],
};
