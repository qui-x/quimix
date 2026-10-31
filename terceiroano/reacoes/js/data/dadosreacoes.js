/* ================================================================
   dadosreacoes.js — DADOS DO SIRO (Reações Orgânicas)
   ================================================================
   Os modos (um card por módulo, na ordem da especificação) e as
   curiosidades do logo. As reações não guardam setas nem intermediários:
   saem dos MODELOS do motor de setas (js/core/mecanismo.js e, na combustão,
   js/core/combustao.js), aplicados aos
   reagentes da biblioteca de cada módulo. Os módulos entram aqui conforme
   ficam prontos: nenhum card leva a uma tela vazia.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIRO',
  TITLE: 'Simulador Interativo de Reações Orgânicas',

  CURIOSIDADES: [
    'A seta curva dos mecanismos mostra o caminho de um PAR de elétrons; a farpa, de meia ponta, mostra um elétron só.',
    'Markovnikov publicou a sua regra em 1870, décadas antes de se saber o que é um carbocátion.',
    'O etanol industrial é feito pela hidratação do eteno, com ácido fosfórico como catalisador.',
    'A margarina nasce de uma adição: a hidrogenação das duplas dos óleos vegetais, com níquel.',
    'O teste da água de bromo: a cor castanha some quando o Br₂ se adiciona a uma dupla C=C.',
    'O O₂ do ar é um birradical: tem dois elétrons desemparelhados. Por isso ele espera uma faísca — e, quando começa, reage em cadeia.',
    'Os extintores de pó químico apagam o fogo quebrando a reação em cadeia: o pó captura os radicais da chama.',
    'A luz amarela da vela vem de partículas de fuligem incandescentes; a parte azul, embaixo, é onde a queima é completa.',
    'O monóxido de carbono se prende à hemoglobina cerca de 200 vezes mais que o O₂: um aquecedor a gás num banheiro fechado é perigoso.',
  ],

  MODES: [
    {
      id: 'adicao', sigla: '+', nome: 'Adição', sub: 'A dupla C=C se abre e recebe dois grupos',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c3-9 11-9 14 0"/><path d="M16 15l3 4 1-5"/><path d="M12 3v6M9 6h6"/></svg>',
      hint: 'Um laboratório de setas: escolha uma reação, desenhe setas de elétrons e aplique — o simulador faz o que você pediu e mostra o que acontece. Depois, compare com o mecanismo da literatura.',
      info: 'Na adição, a ligação π da dupla C=C — rica em elétrons — se abre e o reagente entra nos dois carbonos. Com HX e com água (catalisada por ácido), o primeiro passo forma um carbocátion, e ele fica no carbono mais substituído, o mais estável: é a regra de Markovnikov. Com Br₂ e Cl₂, forma-se um íon halônio cíclico, aberto depois pelo haleto. A seta curva mostra um par de elétrons: sai de um par isolado ou de uma ligação e vai para onde os elétrons formam a nova ligação.',
      formula: 'C=C  +  X–Y   →   X–C–C–Y',
      formulaNote: 'Uma reação é classificada pelo resultado: a dupla vira simples e entram dois grupos — adição.',
      hintCanvas: 'Arraste de um par de elétrons até o destino · ou toque na fonte e depois no destino',
      def: 'Reação de adição é aquela em que duas moléculas se unem numa só, abrindo uma ligação π.',
      fatos: [
        { l: 'Seta curva', v: 'move um par de elétrons' },
        { l: 'Farpa', v: 'move um elétron (radicais)' },
        { l: 'Markovnikov', v: 'o C⁺ no carbono mais substituído' },
        { l: 'Catalisador', v: 'volta inteiro no fim' },
      ],
      canvasInteracao: 'A reação em fórmula estrutural completa. Arraste de um par isolado ou de uma ligação até o átomo de destino para desenhar uma seta de elétrons; ou toque na fonte e depois no destino.',
      overlay: 'Adição', panels: ['panel-ad-reacao', 'panel-ad-construtor', 'panel-ad-catalisador', 'panel-ad-mecanismo'], primary: 'ad-aplicar',
    },
    {
      id: 'eliminacao', sigla: '−', nome: 'Eliminação', sub: 'Saem um grupo e um H vizinhos: forma-se a dupla',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c3-9 11-9 14 0"/><path d="M16 15l3 4 1-5"/><path d="M9 6h6"/></svg>',
      hint: 'Um laboratório de setas para a eliminação: retire um H do carbono vizinho e faça o grupo sair — veja a dupla se formar e compare com o mecanismo da literatura.',
      info: 'Na eliminação, saem de carbonos VIZINHOS um grupo (a água de um álcool protonado, ou um haleto) e um H, e forma-se a ligação π. Na desidratação de álcoois com ácido forte e calor, o OH é protonado e sai como água; nos álcoois secundários e terciários forma-se um carbocátion antes (E1). Com um haleto e uma base forte (KOH em álcool), tudo acontece de uma vez (E2). Quando há mais de um H vizinho possível, forma-se mais o alceno mais substituído: é a regra de Zaitsev.',
      formula: 'H–C–C–X   →   C=C  +  H–X',
      formulaNote: 'Classificada pelo resultado: saem átomos da molécula e forma-se uma nova ligação π — eliminação.',
      hintCanvas: 'Arraste de um par de elétrons até o destino · ou toque na fonte e depois no destino',
      def: 'Reação de eliminação é aquela em que uma molécula perde átomos de carbonos vizinhos e forma uma ligação π.',
      fatos: [
        { l: 'E1', v: 'em etapas, com carbocátion' },
        { l: 'E2', v: 'num passo só, com base forte' },
        { l: 'Zaitsev', v: 'o alceno mais substituído' },
        { l: 'Desidratação', v: 'ácido forte e calor' },
      ],
      canvasInteracao: 'A reação em fórmula estrutural completa, com os H dos carbonos vizinhos ao grupo que sai disponíveis para as setas. Arraste de um par isolado ou de uma ligação até o destino; ou toque na fonte e depois no destino.',
      overlay: 'Eliminação', panels: ['panel-el-reacao', 'panel-el-construtor', 'panel-el-catalisador', 'panel-el-mecanismo'], primary: 'el-aplicar',
    },
    {
      id: 'substituicao', sigla: '⇆', nome: 'Substituição', sub: 'Um grupo sai e outro entra no lugar dele',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h11l-3-3"/><path d="M17 17H6l3 3"/></svg>',
      hint: 'Um laboratório de setas para a substituição: radicais com farpas nos alcanos, SN1 e SN2 nos haletos, e o benzeno que troca um H pelo eletrófilo sem perder a aromaticidade.',
      info: 'Na substituição, um átomo ou grupo da molécula sai e outro entra no lugar dele, sem mudar o número de ligações π. Nos alcanos, com X₂ e luz, o mecanismo é RADICALAR: a luz quebra o X–X em dois radicais, e uma reação em cadeia troca um H por X — desenhada com farpas, setas de um elétron. Nos haletos de alquila, um nucleófilo toma o lugar do halogênio: num passo só (SN2), ou passando por um carbocátion (SN1), nos terciários. No benzeno, um eletrófilo ataca o anel, forma-se o íon arênio, e a perda de um H devolve a aromaticidade.',
      formula: 'R–H  +  X–X   →   R–X  +  H–X',
      formulaNote: 'Classificada pelo resultado: saem átomos e entram outros, e o número de ligações π fica igual — substituição.',
      hintCanvas: 'Arraste de um par (ou de um elétron) até o destino · ou toque na fonte e depois no destino',
      def: 'Reação de substituição é aquela em que um átomo ou grupo de uma molécula é trocado por outro.',
      fatos: [
        { l: 'Radicalar', v: 'farpas: um elétron por seta' },
        { l: 'SN2', v: 'num passo só, sem carbocátion' },
        { l: 'SN1', v: 'pelo carbocátion (terciários)' },
        { l: 'Aromática', v: 'o íon arênio, e a aromaticidade volta' },
      ],
      canvasInteracao: 'A reação em fórmula estrutural completa. Nas reações radicalares, todos os H do alcano estão disponíveis para as farpas; no benzeno, os H do anel. Arraste de um par isolado, de um elétron ou de uma ligação até o destino; ou toque na fonte e depois no destino.',
      overlay: 'Substituição', panels: ['panel-sb-reacao', 'panel-sb-construtor', 'panel-sb-mecanismo'], primary: 'sb-aplicar',
    },
    {
      id: 'combustao', sigla: 'O₂', nome: 'Combustão', sub: 'O combustível queima em cadeia: radicais até a água e o CO₂',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-1 3-3 4-4 6-1-1-1-3-1-4-3 2-5 5-5 8 0 4 3 7 7 7z"/><path d="M12 22c-1.7 0-3-1.3-3-3 0-1.9 1.6-2.9 3-5 1.4 2.1 3 3.1 3 5 0 1.7-1.3 3-3 3z"/></svg>',
      hint: 'Um laboratório de setas para a chama: acenda a faísca, desenhe as farpas da reação em cadeia e acompanhe a energia de cada passo — até a água e o CO₂, ou até o CO, com pouco ar.',
      info: 'A combustão é uma reação em CADEIA de radicais. O O₂ do ar é um birradical (•O–O•): na iniciação, ele arranca um H do combustível — um passo que absorve muita energia, e por isso o combustível e o ar podem ficar misturados sem reagir até uma faísca. Depois, radicais como o •OH e o H• propagam a cadeia: o H do combustível vira água, e o carbono passa pelo formaldeído e pelo CO até chegar ao CO₂. A energia liberada nos passos mantém a chama acesa. Com pouco ar faltam •OH para o último passo: sai CO, um gás tóxico, e fuligem — a combustão incompleta.',
      formula: 'CₓHᵧ + O₂  →  CO₂ + H₂O  + energia',
      formulaNote: 'Na combustão completa, todo o carbono vira CO₂ e todo o hidrogênio, água; na incompleta, sobram CO e fuligem (C).',
      hintCanvas: 'Aperte a Faísca · arraste de um elétron (⊙) ou de uma ligação até o destino · ou toque na fonte e depois no destino',
      def: 'Combustão é a reação de um combustível com o comburente — o O₂ do ar — que libera energia como calor e luz. É uma reação em cadeia de radicais.',
      fatos: [
        { l: 'Tetraedro do fogo', v: 'combustível, O₂, calor e reação em cadeia' },
        { l: 'Faísca', v: 'a energia do primeiro passo' },
        { l: '•OH', v: 'o radical que carrega a chama' },
        { l: 'Pouco ar', v: 'CO (tóxico) e fuligem' },
      ],
      canvasInteracao: 'O combustível em fórmula estrutural completa e as moléculas de O₂, desenhadas como birradicais (•O–O•). Aperte Faísca para dar a energia do primeiro passo. Arraste de um elétron livre (⊙) ou de uma ligação até o destino para desenhar uma farpa; o laboratório completa as que a química obriga.',
      overlay: 'Combustão', panels: ['panel-cb-reacao', 'panel-cb-construtor', 'panel-cb-ar', 'panel-cb-mecanismo', 'panel-cb-balanco'], primary: 'cb-aplicar',
    },
  ],
};
