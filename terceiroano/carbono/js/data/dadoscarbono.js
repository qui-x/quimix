/* ================================================================
   SIQC — dadoscarbono.js | dados fixos de Química do Carbono
   ================================================================
   FONTES DOS DADOS (conferir/atualizar sempre nestas referências):
   - Nomenclatura, hibridização e classificação de cadeias:
     IUPAC, "Nomenclature of Organic Chemistry: Recommendations and
     Preferred Names 2013" (Blue Book) — regras P-2 (hidrocarbonetos)
     e P-14 (termos gerais).
   - Ângulos de ligação e geometria (VSEPR): valores clássicos de
     109,5° (tetraédrica), 120° (trigonal plana) e 180° (linear).
   - Comprimentos médios de ligação carbono–carbono em pm:
     C–C ≈ 154, C=C ≈ 134, C≡C ≈ 120 (valores tabelados em
     compilações de dados estruturais, como o CRC Handbook of
     Chemistry and Physics e o NIST Computational Chemistry
     Comparison and Benchmark Database — cccbdb.nist.gov).
   - Postulados de Kekulé (carbono tetravalente, ligações iguais,
     encadeamento) — base histórica da Química Orgânica.

   COMO ESTE ARQUIVO É USADO
   window.SIM_DATA é lido por scriptcarbono.js. As moléculas usam
   coordenadas normalizadas (0 a 1); quem converte para pixels é a
   função _drawEsqueleto() do script — assim o desenho se adapta a
   qualquer tamanho de tela.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIQC',
  TITLE: 'Simulador Interativo de Química do Carbono',

  /* ── Hibridização do carbono ── */
  HIBRIDIZACOES: [
    {
      id: 'sp3', nome: 'sp³', angulo: 109.5, geometria: 'tetraédrica',
      sigma: 4, pi: 0, ligacao: 'somente ligações simples',
      exemplo: 'CH₄ — metano', comprimento: 154, dot: '#60a5fa',
      nota: 'um orbital s + três orbitais p geram quatro orbitais iguais',
    },
    {
      id: 'sp2', nome: 'sp²', angulo: 120, geometria: 'trigonal plana',
      sigma: 3, pi: 1, ligacao: 'uma ligação dupla',
      exemplo: 'C₂H₄ — eteno', comprimento: 134, dot: '#a78bfa',
      nota: 'sobra um orbital p puro, que forma a ligação pi',
    },
    {
      id: 'sp', nome: 'sp', angulo: 180, geometria: 'linear',
      sigma: 2, pi: 2, ligacao: 'uma tripla ou duas duplas',
      exemplo: 'C₂H₂ — etino', comprimento: 120, dot: '#f472b6',
      nota: 'sobram dois orbitais p puros, que formam duas ligações pi',
    },
  ],

  /* ── Cadeias carbônicas para classificar ──
     Coordenadas normalizadas (x, y de 0 a 1) e lista de ligações
     [índiceA, índiceB, ordem]. A classificação segue os critérios
     da IUPAC/Blue Book usados no Ensino Médio. */
  /* Dois módulos, na ordem da especificação. Sem submódulos: o antigo
     "Classificação dos Carbonos" não é mais um modo à parte — a classe
     de cada carbono é parte da classificação ao vivo do Módulo 1. */
  MODES: [
    {
      id: 'cadeias', sigla: 'C–C', nome: 'Cadeias e Classificação', sub: 'Monte e classifique',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
      hint: 'Monte uma cadeia tocando no + ao lado do átomo selecionado. A classificação é calculada da estrutura que você montou, não de uma lista.',
      info: 'Toda cadeia carbônica é classificada por quatro critérios independentes, todos lidos da própria estrutura: fechamento (aberta ou fechada), saturação (dupla ou tripla entre carbonos), natureza (heteroátomo entre carbonos) e ramificação (mais de duas extremidades). Cada carbono também tem uma classe, dada pelo número de outros carbonos ligados a ele.',
      formula: 'fechamento · saturação · natureza · ramificação',
      formulaNote: 'Heteroátomo só torna a cadeia heterogênea quando está ENTRE carbonos; e só dupla ou tripla ENTRE carbonos torna a cadeia insaturada — a C=O da propanona não conta.',
      hintCanvas: 'Setas percorrem encaixe, átomos e ligações · Enter/Espaço ativa',
      def: 'Monte qualquer cadeia de até 20 átomos e veja a classificação calculada ao vivo — e a classe de cada carbono.',
      fatos: [
        { l: 'Fechamento',  v: 'aberta ou fechada' },
        { l: 'Saturação',   v: 'dupla ou tripla entre C' },
        { l: 'Natureza',    v: 'heteroátomo entre C' },
        { l: 'Ramificação', v: 'mais de 2 extremidades' },
      ],
      canvasInteracao: 'Toque num átomo para selecioná-lo: o + mostra onde o próximo átomo entra. Toque numa ligação para alternar simples, dupla e tripla. No painel Representação, veja a mesma cadeia como estrutural completa, em linha, de Lewis ou em 3D — a edição acontece só na condensada.',
      overlay: 'Cadeias e classificação', panels: ['panel-construcao', 'panel-representacao'], primary: 'cad-ativar',
    },
    {
      id: 'hibridizacao', sigla: 'sp³', nome: 'Hibridização do Carbono', sub: 'Misture os orbitais',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',
      hint: 'Escolha a hibridização e quais orbitais p entram; deslize a mistura e gire a câmera para conferir o ângulo.',
      info: 'O carbono tem um orbital s e três p na camada de valência. Misturados, eles viram orbitais híbridos iguais entre si: quatro sp³ a 109,5° (tetraedro), três sp² a 120° (plano) ou dois sp a 180° (linha). O orbital p que não entra na mistura continua puro, perpendicular aos híbridos — é dele que sai a ligação pi.',
      formula: 's + 3p → 4 sp³ · s + 2p → 3 sp² + p · s + p → 2 sp + 2p',
      formulaNote: 'A mistura é um modelo: explica os ângulos observados. As nuvens mostram onde o elétron tem mais chance de estar.',
      hintCanvas: 'Arraste ou use as setas para girar · Enter passa para a próxima hibridização',
      def: 'Na hibridização, o orbital s e alguns orbitais p do carbono se misturam em orbitais novos, iguais entre si, que definem o ângulo das ligações.',
      fatos: [
        { l: 'sp³', v: 's + 3p · 109,5° · 0 pi' },
        { l: 'sp²', v: 's + 2p · 120° · 1 pi' },
        { l: 'sp',  v: 's + 1p · 180° · 2 pi' },
        { l: 'Pi', v: 'vem do p que não mistura' },
      ],
      canvasInteracao: 'Arraste o elétron do 2s para o 2p vazio no diagrama de energia, no painel Resultados. Toque numa nuvem p para escolhê-la para a mistura. Com a mistura completa, escolha um parceiro, toque num híbrido para mirar e arraste o parceiro na tela: ao longo da ligação aproxima, de lado torce. Arraste no espaço vazio para girar a câmera.',
      overlay: 'Hibridização', panels: ['panel-hibridizacao', 'panel-ligacoes'], primary: 'hib-next',
    },
    {
      /* O nome não pode repetir o do Módulo 1 ("Cadeias e Classificação")
         nem soar como jogo ("desafio"): o módulo não pontua nem dá pistas. */
      id: 'classificacao', sigla: '1°–4°', nome: 'Classificação com Evidências', sub: 'Preveja e revele',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16l4-7 4 7 4-7 4 7"/><circle cx="8" cy="9" r="1.5"/><circle cx="16" cy="9" r="1.5"/></svg>',
      hint: 'Preveja a classe de cada carbono pintando-o e a classificação da cadeia critério por critério, apontando a evidência de cada resposta afirmativa; a cada passo, o simulador revela a resposta calculada e explica.',
      info: 'A cadeia carbônica é o esqueleto da molécula: os carbonos e os heteroátomos que estão ENTRE carbonos. Grupos na ponta — o OH de um álcool, o Cl de um haleto, o =O de uma cetona — ficam pendurados nela e não mudam a classificação. Cada carbono é primário, secundário, terciário ou quaternário conforme o número de carbonos ligados a ele. A cadeia se classifica por fechamento, disposição, saturação e natureza; se fechada, também pela aromaticidade (regra de Hückel: 4n + 2 elétrons π), pelo heteroátomo no anel e pelo número de núcleos aromáticos.',
      formula: 'aberta × fechada · normal × ramificada · saturada × insaturada · homogênea × heterogênea',
      formulaNote: 'Só contam ligações múltiplas ENTRE CARBONOS e heteroátomos ENTRE CARBONOS: a C=O e o OH da ponta não mudam a classificação.',
      hintCanvas: 'Setas escolhem um átomo · Enter pinta com o pincel ou aponta a evidência',
      def: 'Classificar uma cadeia é descrevê-la por critérios estruturais — fechamento, disposição, saturação e natureza —, e cada carbono pelo número de carbonos ligados a ele.',
      fatos: [
        { l: 'Primário', v: 'ligado a 1 carbono (ou nenhum: nulário)' },
        { l: 'Terciário', v: 'ligado a 3 carbonos' },
        { l: 'Insaturada', v: 'dupla ou tripla entre carbonos' },
        { l: 'Heterogênea', v: 'heteroátomo entre carbonos' },
        { l: 'Aromática', v: '4n + 2 elétrons π (Hückel)' },
      ],
      canvasInteracao: 'Para prever as classes, escolha um pincel e arraste sobre os carbonos; toque de novo com o mesmo pincel para despintar. Na classificação, aponte a evidência da sua previsão: toque na ligação, no átomo ou dentro do anel, ou trace o anel arrastando pelos átomos dele. Depois, o simulador revela.',
      overlay: 'Classificação', panels: ['panel-cls-estrutura', 'panel-cls-classificar'], primary: 'cls-acao',
    },  ],

  CURIOSIDADES: [
    'O carbono forma mais compostos do que todos os outros elementos somados — passam de dezenas de milhões de substâncias catalogadas.',
    'Diamante e grafite são feitos só de carbono: a diferença está na hibridização (sp³ no diamante, sp² no grafite).',
    'A tetravalência do carbono foi proposta por Kekulé em 1858, antes de existir qualquer modelo de orbital.',
    'O benzeno não tem três duplas fixas: as ligações são todas equivalentes por ressonância, algo que Kekulé só conseguiu representar alternando as duplas.',
    'O 2,2,4-trimetilpentano é o padrão de octanagem 100 dos combustíveis — daí o nome "isoctano".',
    'Quanto mais caráter s na hibridização, mais curta a ligação: por isso a tripla (sp) é a mais curta das três.',
  ],
};
