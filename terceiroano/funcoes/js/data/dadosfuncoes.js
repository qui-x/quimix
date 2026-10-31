/* ================================================================
   dadosfuncoes.js — DADOS DO SIFO (Funções Orgânicas)
   ================================================================
   Os modos (um card por módulo, na ordem da especificação) e as
   curiosidades do logo. Os compostos do Módulo 1 moram em
   biblioteca-funcoes.js; o catálogo das 14 classes, no núcleo
   (grupos-funcionais.js). Os módulos entram aqui conforme ficam
   prontos: nenhum card leva a uma tela vazia.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIFO',
  TITLE: 'Simulador Interativo de Funções Orgânicas',

  CURIOSIDADES: [
    'O cheiro de banana das balas vem de um éster: o acetato de isoamila (etanoato de 3-metilbutila).',
    'O formol é uma solução aquosa de metanal, o aldeído mais simples que existe.',
    'O vinagre é uma solução de ácido etanoico (ácido acético), em geral de 4 a 6 por cento.',
    'A propanona, conhecida como acetona, é a cetona mais simples e um solvente muito usado.',
    'As aminas são derivadas da amônia e aparecem em muitos medicamentos.',
    'O etanol e o metoximetano têm a mesma fórmula, C₂H₆O, mas funções diferentes: são isômeros de função.',
    'Álcoois de até três carbonos se misturam com a água em qualquer proporção; a partir do butan-1-ol, a solubilidade cai bastante.',
  ],

  MODES: [
    {
      id: 'grupos', sigla: '–OH', nome: 'Grupos Funcionais', sub: 'Pinte os grupos',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 16l4-7 4 7"/><path d="M12 16h4"/><circle cx="19" cy="16" r="2"/><path d="M8 9V5"/></svg>',
      hint: 'Escolha um composto real na biblioteca; se quiser prever, pinte na estrutura cada grupo funcional com o pincel da função, e revele.',
      info: 'Grupo funcional é o conjunto de átomos que dá a uma família de compostos o seu comportamento químico: –OH nos álcoois, –COOH nos ácidos carboxílicos, –NH₂ nas aminas. O grupo é decidido pela vizinhança INTEIRA do átomo: um O–H preso a um carbono que também tem =O é ácido, não álcool; um O entre um carbono de carbonila e outro carbono é éster, não éter; um N preso a um carbono de carbonila é amida, não amina.',
      formula: 'R–OH · R–CHO · R–CO–R · R–COOH · R–COO–R · R–NH₂ · R–CONH₂ · R–C≡N · R–X · R–O–R',
      formulaNote: 'Um mesmo composto pode ter vários grupos: o paracetamol tem amida e fenol; o ácido cítrico, três carboxilas e um álcool.',
      hintCanvas: 'Setas escolhem um átomo · Enter pinta com o pincel',
      def: 'Função orgânica é o conjunto de compostos com o mesmo grupo funcional e, por isso, propriedades químicas semelhantes.',
      fatos: [
        { l: 'Álcool', v: 'OH em carbono saturado' },
        { l: 'Fenol', v: 'OH em carbono de anel aromático' },
        { l: 'Éster', v: 'O entre a C=O e outro carbono' },
        { l: 'Amida', v: 'N preso ao carbono da C=O' },
        { l: 'Éter', v: 'O entre dois carbonos comuns' },
      ],
      canvasInteracao: 'Para prever, escolha o pincel de uma função no painel Investigar e arraste sobre os átomos do grupo; toque de novo com o mesmo pincel para despintar. Depois de revelar, toque num grupo: a ficha dele aparece no painel Resultados. Na fonte Construir, o canvas vira o editor de cadeias: os grupos acendem conforme se formam, até 6 ao mesmo tempo.',
      overlay: 'Grupos', panels: ['panel-biblioteca', 'panel-investigar'], primary: 'gf-acao',
    },
    {
      id: 'nomenclatura', sigla: '-ol', nome: 'Nomenclatura', sub: 'Nome a partir da estrutura',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
      hint: 'Ponha estruturas na bancada — por fórmula molecular, por fórmula estrutural ou desenhando —, preveja o nome de cada uma pelas peças e confira: o nome certo vai para o cartão; os outros você refaz.',
      info: 'O nome IUPAC sai da estrutura: a cadeia principal passa pelo carbono do grupo funcional, contém a insaturação e é a mais longa; a numeração dá o menor localizador ao grupo, depois à insaturação, depois aos substituintes. Prefixo (quantos carbonos), infixo (tipo de ligação) e sufixo (função) formam o nome: but + an + ol = butan-2-ol.',
      formula: 'prefixo (met, et, prop, but…) + infixo (an, en, in) + sufixo (o, ol, al, ona, oico, amina…)',
      formulaNote: 'Escopo do módulo: cadeia aberta, um grupo funcional, uma ramificação e uma insaturação. Estruturas com dois grupos funcionais ficam fora do escopo deste módulo.',
      hintCanvas: 'Setas trocam o espaço da bancada · Enter confere as previsões',
      def: 'Nomenclatura IUPAC é o sistema de regras que dá a cada estrutura um nome único, lido a partir da própria estrutura.',
      fatos: [
        { l: 'Prefixo', v: 'número de carbonos da cadeia principal' },
        { l: 'Infixo', v: 'an (simples), en (dupla), in (tripla)' },
        { l: 'Sufixo', v: 'a função: o, ol, al, ona, oico, amina' },
        { l: 'Numeração', v: 'menor localizador para o grupo' },
      ],
      canvasInteracao: 'Toque num cartão da bancada para selecioná-lo; a estrutura dele aparece grande. Quando o nome estiver certo, ele vai para o cartão, e a cadeia principal aparece destacada e numerada.',
      overlay: 'Nomenclatura', panels: ['panel-bancada', 'panel-nome'], primary: 'nm-acao',
    },
    {
      id: 'ebulicao', sigla: 'Tₑ', nome: 'Ponto de Ebulição', sub: 'Ordene e confira',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
      hint: 'Ordene os compostos de um conjunto por ebulição crescente, montando a trilha; confira e refaça até acertar. Cada conjunto isola uma variável.',
      info: 'A temperatura de ebulição depende da força entre as moléculas: dispersão de London (cresce com o tamanho e a superfície de contato), dipolo-dipolo (moléculas polares) e ligação de hidrogênio (O–H, N–H). Com massas parecidas, a força decide; na mesma função, o tamanho e a forma decidem.',
      formula: 'London  <  dipolo-dipolo  <  ligação de hidrogênio  (com massas parecidas)',
      formulaNote: 'Os valores são experimentais, a 1 atm, e só aparecem depois que a trilha estiver certa.',
      hintCanvas: 'Setas escolhem a posição · Enter seleciona e põe a peça',
      def: 'Temperatura de ebulição é a temperatura em que a pressão de vapor do líquido iguala a pressão externa (1 atm, aqui).',
      fatos: [
        { l: 'London', v: 'cresce com o tamanho e o contato' },
        { l: 'Dipolo-dipolo', v: 'moléculas polares' },
        { l: 'Ligação de H', v: 'O–H e N–H' },
        { l: 'Ramificação', v: 'menos contato, ebulição menor' },
      ],
      canvasInteracao: 'Toque numa peça e depois numa posição da trilha, ou arraste a peça até a posição (ela se encaixa). Toque numa peça da trilha para tirá-la. Com a trilha certa, cada composto sobe no termômetro até a sua temperatura.',
      overlay: 'Ebulição', panels: ['panel-trilha', 'panel-dados'], primary: 'eb-acao',
    },
    {
      id: 'prioridade', sigla: '1º', nome: 'Prioridade de Funções', sub: 'Nomes completos',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20h18"/><path d="M6 20V14h4v-4h4V6h4v14"/></svg>',
      hint: 'Monte o nome completo de compostos reais com vários grupos: o de maior prioridade dá o sufixo; os outros viram prefixos. Preveja todos, confira e refaça até acertar.',
      info: 'Com vários grupos, o de maior prioridade dá o sufixo e os outros entram como prefixos (hidroxi, oxo, amino…). A cadeia principal é a que tem mais grupos principais; a numeração dá os menores localizadores ao grupo principal, depois às insaturações, depois aos prefixos. Prefixos iguais ganham multiplicador (di, tri) e todos entram em ordem alfabética.',
      formula: 'prefixos (em ordem alfabética) + cadeia + insaturações + sufixo do grupo principal',
      formulaNote: 'Exemplo: ácido 2-amino-3-hidroxipropanoico (serina): o ácido dá o sufixo; o amino e o hidroxi viram prefixos.',
      hintCanvas: 'Setas trocam o espaço da bancada · Enter confere as previsões',
      def: 'Prioridade de funções é a ordem que decide qual grupo dá o sufixo do nome quando a molécula tem mais de um grupo funcional.',
      fatos: [
        { l: 'No alto', v: 'ácido carboxílico' },
        { l: 'Sufixo', v: 'o grupo de maior prioridade' },
        { l: 'Prefixos', v: 'hidroxi, oxo, amino…' },
        { l: 'Multiplicador', v: 'di, tri (não conta na ordem alfabética)' },
      ],
      canvasInteracao: 'Toque num cartão da bancada para selecioná-lo. A escada das funções fica à esquerda; com o nome certo, os grupos do composto sobem até os seus degraus.',
      overlay: 'Prioridade', panels: ['panel-nc-bancada', 'panel-nc-nome'], primary: 'nc-acao',
    },
  ],
};
