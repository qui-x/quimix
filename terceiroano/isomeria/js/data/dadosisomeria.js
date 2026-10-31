/* ================================================================
   dadosisomeria.js — DADOS DO SIIS (Isomeria)
   ================================================================
   Os modos (um card por módulo, na ordem da especificação) e as
   curiosidades do logo. Os isômeros NÃO ficam guardados: saem do
   gerador geral (js/core/isomeros-gerais.js). Os módulos entram aqui
   conforme ficam prontos: nenhum card leva a uma tela vazia.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIIS',
  TITLE: 'Simulador Interativo de Isomeria',

  CURIOSIDADES: [
    'O etanol e o metoximetano têm a mesma fórmula, C₂H₆O: um é o álcool das bebidas; o outro, um gás usado em aerossóis.',
    'O octano tem 18 isômeros constitucionais — e o decano, 75.',
    'A acetona e o seu enol coexistem em equilíbrio, mas em cada milhão de moléculas praticamente só uma está na forma enol.',
    'O butano e o metilpropano (isobutano) têm a mesma fórmula; o isobutano ferve a −12 °C, e o butano, a −0,5 °C.',
    'Os isômeros de função podem ter propriedades completamente diferentes: o ácido propanoico é azedo; o etanoato de metila tem cheiro de fruta.',
  ],

  MODES: [
    {
      id: 'constitucional', sigla: 'C≠', nome: 'Isomeria Constitucional', sub: 'Mesma fórmula, outras ligações',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><path d="M10 7.5h4"/><path d="M6.5 11v4M17.5 11v4"/><path d="M4 18h16"/></svg>',
      hint: 'Encha a bancada pela fórmula molecular, digite ou desenhe estruturas; toque em dois espaços e compare: fórmulas diferentes, a mesma molécula ou isômeros — e de que tipo.',
      info: 'Isômeros constitucionais têm a mesma fórmula molecular, mas os átomos ligados de outro jeito. Quando há mais de uma diferença, vale a HIERARQUIA: 1º função (ou tautomeria, se um H passa do carbono para o oxigênio, em equilíbrio); 2º cadeia — o tipo de cadeia muda (aberta × fechada, normal × ramificada, homogênea × heterogênea, tipo de insaturação) ou o esqueleto é outro; 3º posição — mesma função e mesma cadeia, mudando só o lugar do grupo, da insaturação ou do ramo (metameria, quando o que muda de lugar é o heteroátomo). O critério mais alto anula os seguintes.',
      formula: 'mesma fórmula molecular  +  ligações diferentes  =  isômeros',
      formulaNote: 'O gerador trabalha com até 8 átomos além do H e até dois anéis; o que não existe como composto estável fica de fora.',
      hintCanvas: 'Setas: espaço · Enter: seleciona',
      def: 'Isomeria é o fenômeno de compostos diferentes terem a mesma fórmula molecular.',
      fatos: [
        { l: 'Hierarquia', v: 'função > cadeia > posição' },
        { l: 'Função', v: 'funções diferentes (tautomeria: ceto ⇄ enol)' },
        { l: 'Cadeia', v: 'tipo de cadeia ou esqueleto diferente' },
        { l: 'Posição', v: 'só o lugar muda (metameria: o heteroátomo)' },
      ],
      canvasInteracao: 'Toque num espaço para selecioná-lo: com um selecionado, ele cresce no centro; com dois, os dois ficam lado a lado para comparar. Toque de novo para soltar.',
      overlay: 'Constitucional', panels: ['panel-bi-bancada', 'panel-bi-representacao', 'panel-bi-comparar'], primary: 'bi-acao',
    },
    {
      id: 'geometrica', sigla: 'E/Z', nome: 'Isomeria Geométrica', sub: 'E/Z, cis/trans e R/S',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 12h8"/><path d="M8 14.5h8"/><path d="M8 12 4 6M8 14.5 4 20M16 12l4-6M16 14.5l4 6"/></svg>',
      hint: 'Estude uma estrutura: toque numa dupla ou num carbono, preveja a prioridade dos ligantes e a configuração, e revele a regra esfera por esfera. Gire a dupla para trocar a configuração e troque ligantes no laboratório.',
      info: 'A configuração é lida pelas regras de prioridade de Cahn-Ingold-Prelog: ganha o ligante cujo átomo tem o maior número atômico; no empate, comparam-se os conjuntos de átomos da esfera seguinte, e a dupla conta como átomo repetido. Na dupla, os ligantes de maior prioridade do mesmo lado dão Z, em lados opostos, E. No carbono quiral, com o ligante 4 para trás, 1→2→3 no sentido horário é R; no anti-horário, S.',
      formula: 'E/Z e R/S: prioridade por número atômico → esfera seguinte no empate → dupla conta repetida',
      formulaNote: 'Os descritores saem da estrutura, sem experimento; o sinal da rotação da luz, (+) ou (−), só o polarímetro mede.',
      hintCanvas: 'Toque numa dupla ou carbono · arraste para girar',
      def: 'Isomeria geométrica é a dos compostos que só diferem pela disposição dos ligantes em relação a uma dupla ligação ou a um anel.',
      fatos: [
        { l: 'Z', v: 'prioridades do mesmo lado' },
        { l: 'E', v: 'prioridades em lados opostos' },
        { l: 'R', v: '1→2→3 horário, com o 4 atrás' },
        { l: 'Regra', v: 'número atômico; no empate, a esfera seguinte' },
      ],
      canvasInteracao: 'Toque num espaço para estudá-lo. Na estrutura grande, toque numa dupla ou num carbono; arraste uma ponta da dupla para girar aquela metade; gire a vista 3D do carbono.',
      overlay: 'Geométrica', panels: ['panel-bi-bancada', 'panel-bi-representacao', 'panel-bg-prioridades', 'panel-bg-laboratorio', 'panel-bi-comparar'], primary: 'bg-acao',
    },
    {
      id: 'optica', sigla: '(±)', nome: 'Isomeria Óptica', sub: 'Quiralidade, enantiômeros e meso',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18"/><path d="M8 7l-4 5 4 5M16 7l4 5-4 5"/></svg>',
      hint: 'Estude qualquer molécula com a sua imagem no espelho: preveja se é quiral, quantos carbonos quirais e quantos estereoisômeros tem; gire o espelho para tentar sobrepor as duas e revele.',
      info: 'Uma molécula é quiral quando a sua imagem no espelho é outra molécula, que não se sobrepõe a ela por nenhuma rotação: as duas são enantiômeros. O caso mais comum é o carbono quiral, ligado a quatro grupos diferentes. Com n unidades estereogênicas há no máximo 2ⁿ estereoisômeros; as formas meso — com carbonos quirais, mas um plano de simetria interno — são aquirais e contam uma vez só. Os enantiômeros desviam a luz polarizada em ângulos iguais e sentidos opostos; o sentido, (+) ou (−), só o polarímetro mede: ele não sai do R/S.',
      formula: 'quiral ⇔ a imagem no espelho não se sobrepõe · máximo de estereoisômeros = 2ⁿ (menos, com meso)',
      formulaNote: 'O veredito vem da configuração; a sobreposição geométrica é o experimento — girar ligações simples (conformação) não muda a molécula.',
      hintCanvas: 'Um dedo gira o espelho · dois dedos giram a cena',
      def: 'Isomeria óptica é a dos estereoisômeros que são imagens especulares não sobreponíveis (enantiômeros) e dos que não são imagens um do outro (diastereoisômeros).',
      fatos: [
        { l: 'Carbono quiral', v: 'quatro ligantes diferentes' },
        { l: 'Enantiômeros', v: 'imagens no espelho que não se sobrepõem' },
        { l: 'Máximo', v: '2ⁿ estereoisômeros' },
        { l: 'Meso', v: 'tem carbonos quirais, mas é aquiral' },
      ],
      canvasInteracao: 'A molécula e a sua imagem no espelho. Um dedo ou o botão esquerdo gira só o espelho; dois dedos ou o botão direito giram a cena; pinça ou roda dão zoom; as setas giram o espelho.',
      overlay: 'Óptica', panels: ['panel-op-molecula', 'panel-op-prever', 'panel-op-espelho', 'panel-op-config'], primary: 'op-acao',
    },
  ],
};
