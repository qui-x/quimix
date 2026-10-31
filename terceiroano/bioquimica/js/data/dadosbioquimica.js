/* ================================================================
   SIQB — dadosbioquimica.js | dados fixos de Bioquímica
   ================================================================
   FONTES DOS DADOS (conferir/atualizar sempre nestas referências):
   - Classes de biomoléculas, monômeros e tipos de ligação: Nelson &
     Cox, "Lehninger Principles of Biochemistry" — capítulos de
     aminoácidos/peptídeos, carboidratos, lipídios e nucleotídeos.
   - Pontos isoelétricos (pI) dos aminoácidos: tabela de propriedades
     dos 20 aminoácidos padrão do Lehninger (valores em água, 25 °C).
     Conferir também no IUPAC-IUBMB "Nomenclature and Symbolism for
     Amino Acids and Peptides" (recomendações de 1983, ainda vigentes).
   - Nomenclatura dos aminoácidos e dos peptídeos: IUPAC-IUBMB, mesma
     recomendação acima (o resíduo que doa a carbonila vem primeiro).
   - pH ótimo das enzimas digestivas (pepsina, amilase salivar,
     tripsina) e temperatura ótima de enzimas humanas (≈ 37 °C):
     livro-texto de bioquímica/fisiologia; os valores são faixas, não
     pontos exatos — por isso aparecem aqui como valores centrais.

   MODELO DIDÁTICO DESTE MÓDULO (declarado abertamente)
   A atividade enzimática é calculada por duas curvas em forma de sino
   (uma para pH, uma para temperatura), com uma queda extra acima da
   temperatura de desnaturação. É um modelo qualitativo: serve para
   mostrar o formato da curva e a irreversibilidade da desnaturação,
   não para prever atividade real em unidades enzimáticas.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIQB',
  TITLE: 'Simulador Interativo de Bioquímica',

  /* ── As quatro grandes classes de biomoléculas ── */
  BIOMOLECULAS: [
    {
      id: 'carboidrato', nome: 'Carboidratos', dot: '#38bdf8',
      monomero: 'monossacarídeo (glicose, frutose)',
      polimero: 'polissacarídeo (amido, glicogênio, celulose)',
      ligacao: 'ligação glicosídica', elementos: 'C, H, O',
      formulaGeral: 'Cₙ(H₂O)ₙ para os monossacarídeos simples',
      funcao: 'fonte rápida de energia e estrutura (celulose na parede vegetal)',
      exemplo: 'Glicose — C₆H₁₂O₆',
    },
    {
      id: 'lipidio', nome: 'Lipídios', dot: '#fbbf24',
      monomero: 'não é polímero verdadeiro: glicerol + ácidos graxos',
      polimero: 'triglicerídeo (três ácidos graxos por glicerol)',
      ligacao: 'ligação éster', elementos: 'C, H, O (P e N nos fosfolipídios)',
      formulaGeral: 'R–COO–CH₂ ligado ao glicerol',
      funcao: 'reserva de energia, isolante térmico e membranas celulares',
      exemplo: 'Ácido esteárico — C₁₈H₃₆O₂',
    },
    {
      id: 'proteina', nome: 'Proteínas', dot: '#4ade80',
      monomero: 'aminoácido (20 padrão)',
      polimero: 'polipeptídeo / proteína',
      ligacao: 'ligação peptídica (amida)', elementos: 'C, H, O, N (e S em duas)',
      formulaGeral: 'H₂N–CHR–COOH',
      funcao: 'enzimas, transporte, defesa, estrutura e contração',
      exemplo: 'Insulina, hemoglobina, colágeno',
    },
    {
      id: 'nucleico', nome: 'Ácidos nucleicos', dot: '#a78bfa',
      monomero: 'nucleotídeo (base + pentose + fosfato)',
      polimero: 'DNA e RNA',
      ligacao: 'ligação fosfodiéster', elementos: 'C, H, O, N, P',
      formulaGeral: 'base nitrogenada + pentose + grupo fosfato',
      funcao: 'guardar e transmitir a informação genética',
      exemplo: 'DNA (desoxirribose) e RNA (ribose)',
    },
  ],

  /* ── Aminoácidos e seus pontos isoelétricos ──
     pI é o pH em que o aminoácido tem carga elétrica líquida zero
     (forma de zwitterion predominante). Fonte: Lehninger. */
  AMINOACIDOS: [
    { id: 'gly', nome: 'Glicina',            sigla: 'Gly', pI: 5.97, r: '–H',        tipo: 'apolar (o menor de todos)', dot: '#94a3b8' },
    { id: 'ala', nome: 'Alanina',            sigla: 'Ala', pI: 6.01, r: '–CH₃',      tipo: 'apolar',                    dot: '#cbd5e1' },
    { id: 'ser', nome: 'Serina',             sigla: 'Ser', pI: 5.68, r: '–CH₂OH',    tipo: 'polar neutro',              dot: '#38bdf8' },
    { id: 'asp', nome: 'Ácido aspártico',    sigla: 'Asp', pI: 2.77, r: '–CH₂COOH',  tipo: 'ácido (carga negativa)',    dot: '#f87171' },
    { id: 'glu', nome: 'Ácido glutâmico',    sigla: 'Glu', pI: 3.22, r: '–CH₂CH₂COOH', tipo: 'ácido (carga negativa)',  dot: '#fb923c' },
    { id: 'lys', nome: 'Lisina',             sigla: 'Lys', pI: 9.74, r: '–(CH₂)₄NH₂', tipo: 'básico (carga positiva)',  dot: '#4ade80' },
    { id: 'arg', nome: 'Arginina',           sigla: 'Arg', pI: 10.76, r: '–(CH₂)₃NHC(NH₂)=NH₂⁺', tipo: 'básico (o mais básico)', dot: '#a78bfa' },
  ],

  /* ── Enzimas de referência ──
     phOtimo é o valor central da faixa ótima citada na literatura;
     tOtima e tDesnatura valem para enzimas humanas típicas. */
  ENZIMAS: [
    { id: 'pepsina',  nome: 'Pepsina',         local: 'estômago',        phOtimo: 2.0, tOtima: 37, tDesnatura: 50, substrato: 'proteínas', dot: '#f87171' },
    { id: 'amilase',  nome: 'Amilase salivar', local: 'boca',            phOtimo: 6.8, tOtima: 37, tDesnatura: 50, substrato: 'amido',     dot: '#38bdf8' },
    { id: 'tripsina', nome: 'Tripsina',        local: 'intestino delgado', phOtimo: 8.0, tOtima: 37, tDesnatura: 50, substrato: 'proteínas', dot: '#4ade80' },
    { id: 'catalase', nome: 'Catalase',        local: 'fígado e sangue', phOtimo: 7.0, tOtima: 37, tDesnatura: 50, substrato: 'H₂O₂',      dot: '#fbbf24' },
  ],

  MODES: [
    {
      id: 'biomoleculas', sigla: 'C,H,O,N', nome: 'Biomoléculas', sub: 'Monômero e polímero',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3c0 4 5 5 5 9s-5 5-5 9"/><path d="M19 3c0 4-5 5-5 9s5 5 5 9"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="6.4" y1="11" x2="17.6" y2="11"/><line x1="6.4" y1="13" x2="17.6" y2="13"/><line x1="7" y1="17" x2="17" y2="17"/></svg>',
      hint: 'Escolha uma classe e veja os monômeros se ligando para formar o polímero; o nome da ligação e o que cada parte do esquema é estão em Resultados.',
      info: 'As quatro grandes classes de biomoléculas seguem a mesma lógica: unidades pequenas (monômeros) se unem por um tipo específico de ligação, sempre com saída de água, formando moléculas gigantes (polímeros). Carboidratos usam ligação glicosídica, proteínas usam ligação peptídica, ácidos nucleicos usam ligação fosfodiéster. Lipídios são a exceção: não formam polímero verdadeiro, mas juntam glicerol e ácidos graxos por ligação éster.',
      formula: 'monômero + monômero → polímero + H₂O',
      formulaNote: 'Reagir liberando água é condensação; quebrar usando água é hidrólise — é assim que a digestão funciona.',
      hintCanvas: 'Enter/Espaço passa para a próxima classe',
      def: 'Toda biomolécula grande é feita de unidades pequenas unidas por uma ligação própria, com saída de água.',
      fatos: [
        { l: 'Carboidrato', v: 'lig. glicosídica' },
        { l: 'Proteína',    v: 'lig. peptídica' },
        { l: 'Lipídio',     v: 'lig. éster' },
        { l: 'Ác. nucleico', v: 'lig. fosfodiéster' },
      ],
      canvasInteracao: 'O esquema de cada classe, com a água que sai em cada ligação: anéis de monossacarídeo unidos pelo O (glicosídica), aminoácidos (peptídica), nucleotídeos com fosfato, pentose e base (fosfodiéster) e o triglicerídeo, um glicerol com três ácidos graxos (éster).',
      recomendados: ['Proteínas', 'Carboidratos'],
      overlay: 'Biomoléculas', panels: ['panel-biomoleculas'], primary: 'bio-next',
    },
    {
      id: 'peptidica', sigla: '–CO–NH–', nome: 'Ligação Peptídica', sub: 'Aminoácidos e pI',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      hint: 'Escolha dois aminoácidos e monte o dipeptídeo; compare também o ponto isoelétrico de cada um.',
      info: 'A ligação peptídica é uma amida formada entre a carboxila de um aminoácido e o grupo amino do seguinte, com saída de uma molécula de água. Todo aminoácido tem ao mesmo tempo um grupo ácido e um grupo básico, e por isso existe em solução como zwitterion — íon com carga positiva e negativa na mesma molécula. O pH em que a carga líquida é zero se chama ponto isoelétrico (pI): abaixo dele o aminoácido fica positivo, acima fica negativo.',
      formula: 'H₂N–CHR–COOH + H₂N–CHR′–COOH → dipeptídeo + H₂O',
      formulaNote: 'Aminoácidos ácidos têm pI baixo (Asp 2,77) e os básicos pI alto (Arg 10,76).',
      hintCanvas: 'Enter/Espaço troca a ordem dos dois aminoácidos',
      def: 'A ligação peptídica une a carboxila de um aminoácido ao grupo amino do outro, liberando água.',
      fatos: [
        { l: 'Ligação',   v: 'amida (–CO–NH–)' },
        { l: 'Sai',       v: '1 H₂O por ligação' },
        { l: 'Zwitterion', v: '+ e − na mesma molécula' },
        { l: 'pI da glicina', v: '5,97' },
      ],
      canvasInteracao: 'Os dois aminoácidos em cima, com os grupos que reagem contornados; embaixo, o dipeptídeo, com a ligação peptídica (CO–NH) em destaque. Os nomes, o pI e a fórmula geral estão em Resultados.',
      overlay: 'Ligação peptídica', panels: ['panel-peptidica'], primary: 'pep-inverter',
    },
    {
      id: 'enzimas', sigla: 'E+S', nome: 'Atividade Enzimática', sub: 'pH e temperatura',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 2h6"/><path d="M10 2v6.5L4.5 18a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 8.5V2"/><line x1="6.5" y1="14" x2="17.5" y2="14"/></svg>',
      hint: 'Escolha a enzima e mexa no pH e na temperatura — a curva mostra onde ela trabalha melhor e onde desnatura.',
      info: 'Enzimas são catalisadores biológicos e só funcionam bem numa faixa estreita de pH e temperatura. Fora do pH ótimo, a mudança de ionização dos aminoácidos deforma o sítio ativo e a atividade cai. Acima da temperatura de desnaturação, as ligações que mantêm a forma da proteína se rompem e a perda de atividade é irreversível: baixar a temperatura depois não recupera a enzima. É por isso que a pepsina só age no pH ácido do estômago e a tripsina no pH básico do intestino.',
      formula: 'atividade = f(pH) × f(temperatura)',
      formulaNote: 'Curvas em forma de sino, com queda extra e irreversível acima da temperatura de desnaturação.',
      hintCanvas: 'Enter/Espaço anuncia a atividade atual',
      def: 'Cada enzima tem um pH e uma temperatura ótimos; acima da temperatura de desnaturação a perda de atividade é irreversível.',
      fatos: [
        { l: 'Pepsina',  v: 'pH ≈ 2 (estômago)' },
        { l: 'Amilase',  v: 'pH ≈ 6,8 (boca)' },
        { l: 'Tripsina', v: 'pH ≈ 8 (intestino)' },
        { l: 'Desnatura', v: 'acima de ≈ 50 °C' },
      ],
      canvasInteracao: 'A curva de atividade contra o pH, com o ponto atual marcado, e a escala da temperatura: o triângulo marca a ótima e a linha tracejada, a desnaturação. Desnaturada, a curva fica tracejada.',
      overlay: 'Atividade enzimática', panels: ['panel-enzimas'], primary: 'enz-status',
    },
  ],

  CURIOSIDADES: [
    'A celulose e o amido são feitos da mesma glicose: muda só o tipo de ligação glicosídica, e por isso não digerimos celulose.',
    'Aminoácidos existem em solução como zwitterions: têm carga positiva e negativa na mesma molécula.',
    'A pepsina do estômago trabalha em pH próximo de 2, um dos ambientes mais ácidos do corpo humano.',
    'Cozinhar um ovo é desnaturar proteínas: a mudança na forma é irreversível, o ovo não volta a ser cru.',
    'O DNA usa desoxirribose e o RNA usa ribose — a diferença é uma única hidroxila.',
    'Existem 20 aminoácidos padrão nas proteínas, mas as combinações possíveis em uma cadeia média são astronômicas.',
    'A catalase é uma das enzimas mais rápidas conhecidas: decompõe milhões de moléculas de peróxido por segundo.',
  ],
};
