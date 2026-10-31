/* =====================================================================
   dadossitp.js — SITP | Dados fixos da Tabela Periodica
   ---------------------------------------------------------------------
   Este arquivo contem SOMENTE dados (tabelas e constantes). Nao ha
   nenhuma manipulacao de DOM, nenhum calculo e nenhum evento aqui.
   Toda a mecanica (render, modal, filtros, Bohr/Lewis/Nuvem, easter egg)
   fica no scriptsitp.js.

   ORDEM DE CARREGAMENTO (obrigatoria, em indexsitp.html):
       <script src="dadossitp.js"></script>   <-- primeiro
       <script src="scriptsitp.js"></script>  <-- depois

   Se inverter a ordem, o scriptsitp.js quebra: ele chama renderizar()
   no carregamento e precisa que elementosBase, RAIO, MASSA etc. ja
   existam.

   MAPA DO ARQUIVO
     1. Estado fisico ................ ESTADO, ESTADO_LABEL, ESTADO_DESC,
                                       ESTADO_DOT, ESTADO_HEX_*
     2. Massa e familia .............. MASSA, MASSA_ISOTOPO, FAMILIA
     3. Cores de categoria ........... CAT_COLOR_VAR, CAT_COLOR_HEX_*
     4. Easter egg "posso lamber" .... LAMBER, LAMBER_*
     5. Distribuicao eletronica ...... CONFIG_EC, CAMADAS_NOME,
                                       ORDEM_SUBNIVEIS, MAX_SUB
     6. Curiosidades ................. CURIOSIDADES
     7. Elementos .................... elementosBase, lantanideos,
                                       actinideos
     8. Raio atomico ................. RAIO, RAIO_MAX_PM, RAIO_TIPO_*,
                                       RAIO_FONTE_LABEL
     9. Espaco reservado ............. proximos dados (eletronegatividade)

   Todas as tabelas sao indexadas pelo NUMERO ATOMICO (Z), de 1 a 118.
   ===================================================================== */

/* ==================================================================
   1. ESTADO FISICO (25 C, 1 atm)
   ESTADO[Z] devolve o codigo: S=solido, L=liquido, G=gasoso, ?=desconhecido.
   Os HEX vem em duas versoes (tema escuro / claro). Quem escolhe entre
   as duas e a funcao getEstadoHex(), que fica no scriptsitp.js porque
   precisa ler o atributo data-theme do <html>.
   ================================================================== */
const ESTADO = {
  1:'G',2:'G',3:'S',4:'S',5:'S',6:'S',7:'G',8:'G',9:'G',10:'G',
  11:'S',12:'S',13:'S',14:'S',15:'S',16:'S',17:'G',18:'G',
  19:'S',20:'S',21:'S',22:'S',23:'S',24:'S',25:'S',26:'S',27:'S',28:'S',29:'S',30:'S',
  31:'S',32:'S',33:'S',34:'S',35:'L',36:'G',
  37:'S',38:'S',39:'S',40:'S',41:'S',42:'S',43:'S',44:'S',45:'S',46:'S',47:'S',48:'S',
  49:'S',50:'S',51:'S',52:'S',53:'S',54:'G',
  55:'S',56:'S',57:'S',58:'S',59:'S',60:'S',61:'S',62:'S',63:'S',64:'S',65:'S',66:'S',
  67:'S',68:'S',69:'S',70:'S',71:'S',72:'S',73:'S',74:'S',75:'S',76:'S',77:'S',78:'S',
  79:'S',80:'L',81:'S',82:'S',83:'S',84:'S',85:'S',86:'G',
  87:'S',88:'S',89:'S',90:'S',91:'S',92:'S',93:'S',94:'S',95:'S',96:'S',97:'S',98:'S',
  99:'S',100:'S',101:'S',102:'S',103:'S',
  104:'?',105:'?',106:'?',107:'?',108:'?',109:'?',110:'?',111:'?',112:'?',113:'?',
  114:'?',115:'?',116:'?',117:'?',118:'?'
};
const ESTADO_LABEL = { S:'Sólido', L:'Líquido', G:'Gasoso', '?':'Desconhecido' };
const ESTADO_DESC  = {
  S:'Sólido a 25 °C e 1 atm (IUPAC).',
  L:'Líquido a 25 °C e 1 atm (IUPAC).',
  G:'Gasoso a 25 °C e 1 atm (IUPAC).',
  '?':'Estado não confirmado — elemento sintético ultrapesado.'
};
/* ESTADO_DOT[Z] = icone do estado fisico, em SVG inline.
   Era emoji; virou SVG desenhado para nao depender da fonte de emoji
   do sistema (que muda de aparencia entre Windows, Android e iOS) e
   para poder herdar cor.
   DOIS DETALHES QUE FAZEM ISSO FUNCIONAR SEM MEXER NO CSS:
   1. width/height em "1em" -> o icone herda o font-size do container,
      exatamente como o emoji fazia. Nenhuma regra de tamanho mudou.
   2. stroke/fill em "currentColor" -> herda a cor do texto. Quem define
      a cor e o CSS, via --c-solid/--c-liquid/--c-gas/--c-unknown, que
      ja existiam nos tres temas (normal, claro e alto contraste) com os
      mesmos hex de ESTADO_HEX_DARK/LIGHT. Logo a troca de tema repinta
      sozinha, sem uma linha de JavaScript.
   Este e o ponto UNICO de verdade do icone de estado: card, badge do
   modal, filtros da legenda, card-demo e tabela do guia leem daqui. */
const ESTADO_DOT = {
  S: '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4.7" y="4.7" width="14.6" height="14.6" rx="1.6"/><rect x="9" y="9" width="6" height="6" rx=".8" fill="currentColor" stroke="none"/></svg>',
  L: '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3.8S5.7 11 5.7 14.9a6.3 6.3 0 0 0 12.6 0C18.3 11 12 3.8 12 3.8z"/></svg>',
  G: '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="7.2" cy="15.2" r="2.3" fill="currentColor" stroke="none"/><circle cx="13.2" cy="8.8" r="2.7" fill="currentColor" stroke="none"/><circle cx="18.2" cy="16.2" r="1.9" fill="currentColor" stroke="none"/></svg>',
  '?': '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9.3 9.1a2.8 2.8 0 1 1 4.4 2.7c-1 .8-1.7 1.4-1.7 2.6"/><circle cx="12" cy="17.9" r="1.35" fill="currentColor" stroke="none"/></svg>'
};
const ESTADO_HEX_DARK  = { S:'#5aabff', L:'#ff6e6e', G:'#7df5b8', '?':'#bbbbbb' };
const ESTADO_HEX_LIGHT = { S:'#005fa3', L:'#b00020', G:'#006b40', '?':'#5a5a5a' };
const ESTADO_HEX = ESTADO_HEX_DARK;

/* ==================================================================
   2. MASSA ATOMICA E FAMILIA (GRUPO)
   MASSA[Z] ...... massa atomica padrao IUPAC/CIAAW 2021, como texto
                   (virgula decimal). Colchetes = intervalo ou isotopo
                   mais estavel de elemento sintetico.
   MASSA_ISOTOPO[Z] numero de massa (A) do isotopo mais comum, inteiro.
                   Usado por calcNeutrons() para achar N = A - Z.
                   (Esta tabela ficava escondida DENTRO de calcNeutrons
                    no scriptsitp.js; foi trazida para ca por ser dado.)
   FAMILIA[g] .... nome do grupo 1..18 em notacao nova + antiga.
   ================================================================== */
const MASSA = {
  1:'1,0080',2:'4,0026',3:'6,94',4:'9,0122',5:'10,81',6:'12,011',7:'14,007',8:'15,999',
  9:'18,998',10:'20,180',11:'22,990',12:'24,305',13:'26,982',14:'28,085',15:'30,974',
  16:'32,06',17:'35,45',18:'39,95',19:'39,098',20:'40,078',21:'44,956',
  22:'47,867',23:'50,942',24:'51,996',25:'54,938',26:'55,845',27:'58,933',28:'58,693',
  29:'63,546',30:'65,38',31:'69,723',32:'72,630',33:'74,922',34:'78,971',35:'79,904',
  36:'83,798',37:'85,468',38:'87,62',39:'88,906',40:'91,222',41:'92,906',42:'95,95',
  43:'[97]',44:'101,07',45:'102,91',46:'106,42',47:'107,87',48:'112,41',49:'114,82',
  50:'118,71',51:'121,76',52:'127,60',53:'126,90',54:'131,29',55:'132,91',56:'137,33',
  57:'138,91',58:'140,12',59:'140,91',60:'144,24',61:'[145]',62:'150,36',63:'151,96',
  64:'157,25',65:'158,93',66:'162,50',67:'164,93',68:'167,26',69:'168,93',70:'173,05',
  71:'174,97',72:'178,49',73:'180,95',74:'183,84',75:'186,21',76:'190,23',77:'192,22',
  78:'195,08',79:'196,97',80:'200,59',81:'204,38',82:'207,2',83:'208,98',
  84:'[209]',85:'[210]',86:'[222]',87:'[223]',88:'[226]',89:'[227]',90:'232,04',
  91:'231,04',92:'238,03',93:'[237]',94:'[244]',95:'[243]',96:'[247]',97:'[247]',
  98:'[251]',99:'[252]',100:'[257]',101:'[258]',102:'[259]',103:'[266]',104:'[267]',
  105:'[268]',106:'[269]',107:'[270]',108:'[269]',109:'[278]',110:'[281]',111:'[282]',
  112:'[285]',113:'[286]',114:'[289]',115:'[290]',116:'[293]',117:'[294]',118:'[294]'
};

const MASSA_ISOTOPO = {
  1:1, 2:4, 3:7, 4:9, 5:11, 6:12, 7:14, 8:16, 9:19, 10:20,
  11:23, 12:24, 13:27, 14:28, 15:31, 16:32, 17:35, 18:40, 19:39, 20:40,
  21:45, 22:48, 23:51, 24:52, 25:55, 26:56, 27:59, 28:58, 29:63, 30:65,
  31:70, 32:73, 33:75, 34:79, 35:80, 36:84, 37:85, 38:88, 39:89, 40:91,
  41:93, 42:96, 43:98, 44:102, 45:103, 46:106, 47:108, 48:112, 49:115, 50:119,
  51:122, 52:128, 53:127, 54:131, 55:133, 56:137, 57:139, 58:140, 59:141, 60:144,
  61:145, 62:150, 63:152, 64:157, 65:159, 66:163, 67:165, 68:167, 69:169, 70:173,
  71:175, 72:178, 73:181, 74:184, 75:186, 76:190, 77:192, 78:195, 79:197, 80:201,
  81:204, 82:207, 83:209, 84:209, 85:210, 86:222, 87:223, 88:226, 89:227, 90:232,
  91:231, 92:238, 93:237, 94:244, 95:243, 96:247, 97:247, 98:251, 99:252, 100:257,
  101:258, 102:259, 103:266, 104:267, 105:268, 106:269, 107:270, 108:269, 109:278, 110:281,
  111:282, 112:285, 113:286, 114:289, 115:290, 116:293, 117:294, 118:294
};

const FAMILIA = {
  1:'1 (IA)',2:'2 (IIA)',3:'3 (IIIB)',4:'4 (IVB)',5:'5 (VB)',6:'6 (VIB)',
  7:'7 (VIIB)',8:'8 (VIII)',9:'9 (VIII)',10:'10 (VIII)',11:'11 (IB)',12:'12 (IIB)',
  13:'13 (IIIA)',14:'14 (IVA)',15:'15 (VA)',16:'16 (VIA)',17:'17 (VIIA)',18:'18 (0)'
};

/* ==================================================================
   2b. INTERVALO DE MASSA ATOMICA (tabela COMPLETA da CIAAW)
   ------------------------------------------------------------------
   MASSA_INTERVALO[Z] = ['limite inferior', 'limite superior']

   POR QUE DUAS TABELAS
   MASSA[Z] alimenta o CARD, onde cabem ~7 caracteres. Um intervalo como
   [206,14; 207,94] tem 16 e, com a fonte aumentada pela barra de
   acessibilidade, e cortado pelo text-overflow — justo para quem mais
   precisa ler. Ja o modal tem espaco de sobra.
   Entao: MASSA (curta) no card, MASSA_INTERVALO (completa) no modal.
   Nenhuma informacao se perde e nada fica truncado.

   Antes, o projeto tinha intervalo em Ar e Pb e valor abreviado nos
   outros 12 elementos que TAMBEM sao de intervalo — duas convencoes no
   mesmo arquivo. Agora as 14 estao aqui, completas.

   O QUE O INTERVALO SIGNIFICA (bom gancho de aula)
   Nao e imprecisao de medida. A CIAAW separa tres causas de incerteza, e
   o intervalo marca a primeira: variacao natural bem documentada da
   abundancia isotopica. O argonio [39,792; 39,963] quer dizer que uma
   amostra real de argonio tem massa atomica em algum ponto desse
   intervalo, dependendo da origem. Para o chumbo a variacao e enorme
   porque ele e produto final de decaimento radioativo: a proporcao dos
   isotopos depende de quanto uranio e torio havia na rocha.

   Fonte: CIAAW, Standard Atomic Weights 2024 (baseada no relatorio
   Atomic Weights 2021, com as revisoes de 2024).
   ================================================================== */
const MASSA_INTERVALO = {
  1  : ['1,00784', '1,00811'],     // H
  3  : ['6,938', '6,997'],    // Li
  5  : ['10,806', '10,821'],     // B
  6  : ['12,0096', '12,0116'],     // C
  7  : ['14,00643', '14,00728'],     // N
  8  : ['15,99903', '15,99977'],     // O
  12 : ['24,304', '24,307'],    // Mg
  14 : ['28,084', '28,086'],    // Si
  16 : ['32,059', '32,076'],     // S
  17 : ['35,446', '35,457'],    // Cl
  18 : ['39,792', '39,963'],    // Ar
  35 : ['79,901', '79,907'],    // Br
  81 : ['204,382', '204,385'],    // Tl
  82 : ['206,14', '207,94'],    // Pb
};

/* ==================================================================
   3. CORES POR CATEGORIA
   Quatro paletas para a mesma lista de 10 categorias:
     CAT_COLOR_VAR ....... variaveis CSS (usadas na pintura normal)
     CAT_COLOR_HEX_DARK .. hex do tema escuro
     CAT_COLOR_HEX_LIGHT . hex do tema claro
     CAT_COLOR_HEX_DALT .. hex por tipo de daltonismo
   A escolha entre elas e feita por getCatColorHex(), no scriptsitp.js.
   IMPORTANTE: se criar uma categoria nova, ela precisa ser adicionada
   nas QUATRO paletas, senao cai no cinza de fallback (#888).
   ================================================================== */
const CAT_COLOR_VAR = {
  'Metal alcalino':        'var(--cat-alcalino)',
  'Metal alcalino-terroso':'var(--cat-alcalino-t)',
  'Lantanídeo':            'var(--cat-lantanideo)',
  'Actinídeo':             'var(--cat-actinideo)',
  'Metal de transição':    'var(--cat-transicao)',
  'Metal representativo':  'var(--cat-representat)',
  'Semimetal':             'var(--cat-semimetal)',
  'Não-metal':             'var(--cat-naometal)',
  'Halogênio':             'var(--cat-halogeno)',
  'Gás nobre':             'var(--cat-gasNobre)'
};
const CAT_COLOR_HEX_DARK = {
  'Metal alcalino':        '#e74c3c',
  'Metal alcalino-terroso':'#e67e22',
  'Lantanídeo':            '#b07edc',
  'Actinídeo':             '#a060cc',
  'Metal de transição':    '#f5a623',
  'Metal representativo':  '#22d4ae',
  'Semimetal':             '#3acf74',
  'Não-metal':             '#5aabff',
  'Halogênio':             '#4fa8e8',
  'Gás nobre':             '#20c9a0'
};
const CAT_COLOR_HEX_LIGHT = {
  'Metal alcalino':        '#a01825',
  'Metal alcalino-terroso':'#7a3e00',
  'Lantanídeo':            '#5c1a8c',
  'Actinídeo':             '#55127f',
  'Metal de transição':    '#7a4d00',
  'Metal representativo':  '#006b53',
  'Semimetal':             '#0d6b38',
  'Não-metal':             '#00508a',
  'Halogênio':             '#004d8c',
  'Gás nobre':             '#006152'
};
const CAT_COLOR_HEX_DALT = {
  protanopia: {
    'Metal alcalino':        '#d55e00',
    'Metal alcalino-terroso':'#e69f00',
    'Lantanídeo':            '#785ef0',
    'Actinídeo':             '#648fff',
    'Metal de transição':    '#f0e442',
    'Metal representativo':  '#56b4e9',
    'Semimetal':             '#b0b0b0',
    'Não-metal':             '#009e9e',
    'Halogênio':             '#0072b2',
    'Gás nobre':             '#cc79a7'
  },
  deuteranopia: {
    'Metal alcalino':        '#d55e00',
    'Metal alcalino-terroso':'#e69f00',
    'Lantanídeo':            '#785ef0',
    'Actinídeo':             '#648fff',
    'Metal de transição':    '#f0e442',
    'Metal representativo':  '#56b4e9',
    'Semimetal':             '#b0b0b0',
    'Não-metal':             '#009e9e',
    'Halogênio':             '#0072b2',
    'Gás nobre':             '#cc79a7'
  },
  tritanopia: {
    'Metal alcalino':        '#d92b2b',
    'Metal alcalino-terroso':'#ff6699',
    'Lantanídeo':            '#00b3b3',
    'Actinídeo':             '#007a7a',
    'Metal de transição':    '#e60073',
    'Metal representativo':  '#00d0d0',
    'Semimetal':             '#b0b0b0',
    'Não-metal':             '#d92b2b',
    'Halogênio':             '#8c1a1a',
    'Gás nobre':             '#006666'
  }
};
const CAT_COLOR = CAT_COLOR_VAR;

/* ==================================================================
   4. EASTER EGG — "Posso lamber isso?"
   Somente as tabelas. A mecanica de ativar/pintar/banner esta no fim
   do scriptsitp.js (toggleModoLamber, pintarModoLamber).
   ================================================================== */
/* =====================================================================
   🥚 EASTER EGG — "Posso lamber isso?" (referência à camiseta de meme
   sobre a tabela periódica). Não tem nenhuma dica visível: ativa
   clicando no ícone (grade 2x3) ao lado do título "SITP" no topo da
   página (ver bloco no fim do arquivo). Classificação baseada na
   estampa original.
   ===================================================================== */
const LAMBER = {
  1:'verde',2:'verde',3:'amarelo',4:'laranja',5:'verde',6:'verde',7:'verde',8:'verde',9:'laranja',10:'verde',
  11:'laranja',12:'verde',13:'verde',14:'verde',15:'amarelo',16:'verde',17:'laranja',18:'verde',
  19:'laranja',20:'verde',21:'verde',22:'verde',23:'verde',24:'verde',25:'verde',26:'verde',27:'verde',28:'verde',29:'verde',30:'verde',
  31:'verde',32:'verde',33:'amarelo',34:'amarelo',35:'laranja',36:'verde',
  37:'laranja',38:'laranja',39:'verde',40:'verde',41:'verde',42:'verde',43:'laranja',44:'verde',45:'verde',46:'verde',47:'verde',48:'laranja',
  49:'verde',50:'verde',51:'amarelo',52:'amarelo',53:'laranja',54:'verde',
  55:'laranja',56:'laranja',57:'verde',58:'verde',59:'verde',60:'laranja',61:'verde',62:'verde',63:'verde',64:'verde',65:'verde',66:'verde',
  67:'verde',68:'verde',69:'verde',70:'verde',71:'verde',72:'verde',73:'verde',74:'verde',75:'verde',76:'amarelo',77:'verde',78:'verde',
  79:'verde',80:'laranja',81:'laranja',82:'amarelo',83:'verde',84:'vermelho',85:'vermelho',86:'vermelho',
  87:'laranja',88:'verde',89:'amarelo',90:'vermelho',91:'amarelo',92:'vermelho',93:'vermelho',94:'vermelho',95:'vermelho',96:'vermelho',97:'vermelho',98:'vermelho',
  99:'vermelho',100:'vermelho',101:'vermelho',102:'vermelho',103:'vermelho',
  104:'vermelho',105:'vermelho',106:'vermelho',107:'vermelho',108:'vermelho',109:'vermelho',110:'vermelho',111:'vermelho',112:'vermelho',113:'vermelho',
  114:'vermelho',115:'vermelho',116:'vermelho',117:'vermelho',118:'vermelho'
};
const LAMBER_ORDEM = ['verde','amarelo','laranja','vermelho'];
const LAMBER_LABEL = {
  verde:    'Foi feito pra isso',
  amarelo:  'Até pode, mas não recomendo',
  laranja:  'Por favor não faça isso',
  vermelho: 'Te vejo do outro lado'
};
const LAMBER_HEX = { verde:'#3ddc5c', amarelo:'#ffe14d', laranja:'#ff9f1c', vermelho:'#ff4d4d' };
const LAMBER_EMOJI = { verde:'😋', amarelo:'😬', laranja:'🙅', vermelho:'☠️' };
// gatilho extra e ainda mais secreto: clique duplo em Pa, U ou Cu também ativa/desativa
const LAMBER_DBLCLICK_TRIGGER = [91, 92, 29]; // Pa, U, Cu

/* ==================================================================
   5. DISTRIBUICAO ELETRONICA
   CONFIG_EC[Z] ...... configuracao em notacao de gas nobre, com
                       expoentes em caracteres unicode (2s^2 -> 2s²).
   CAMADAS_NOME ...... K L M N O P Q (indice 0 = camada n=1)
   ORDEM_SUBNIVEIS ... ordem de preenchimento (diagrama de Pauling)
   MAX_SUB ........... eletrons maximos por tipo de subnivel
   As funcoes que percorrem essas tabelas (distribuirEletrons,
   porCamada, ultimoSubnivel) ficam no scriptsitp.js.
   ================================================================== */
const CONFIG_EC = {
  1:'1s¹', 2:'1s²',
  3:'[He] 2s¹', 4:'[He] 2s²', 5:'[He] 2s² 2p¹', 6:'[He] 2s² 2p²',
  7:'[He] 2s² 2p³', 8:'[He] 2s² 2p⁴', 9:'[He] 2s² 2p⁵', 10:'[He] 2s² 2p⁶',
  11:'[Ne] 3s¹', 12:'[Ne] 3s²', 13:'[Ne] 3s² 3p¹', 14:'[Ne] 3s² 3p²',
  15:'[Ne] 3s² 3p³', 16:'[Ne] 3s² 3p⁴', 17:'[Ne] 3s² 3p⁵', 18:'[Ne] 3s² 3p⁶',
  19:'[Ar] 4s¹', 20:'[Ar] 4s²', 21:'[Ar] 3d¹ 4s²', 22:'[Ar] 3d² 4s²',
  23:'[Ar] 3d³ 4s²', 24:'[Ar] 3d⁵ 4s¹', 25:'[Ar] 3d⁵ 4s²', 26:'[Ar] 3d⁶ 4s²',
  27:'[Ar] 3d⁷ 4s²', 28:'[Ar] 3d⁸ 4s²', 29:'[Ar] 3d¹⁰ 4s¹', 30:'[Ar] 3d¹⁰ 4s²',
  31:'[Ar] 3d¹⁰ 4s² 4p¹', 32:'[Ar] 3d¹⁰ 4s² 4p²', 33:'[Ar] 3d¹⁰ 4s² 4p³',
  34:'[Ar] 3d¹⁰ 4s² 4p⁴', 35:'[Ar] 3d¹⁰ 4s² 4p⁵', 36:'[Ar] 3d¹⁰ 4s² 4p⁶',
  37:'[Kr] 5s¹', 38:'[Kr] 5s²', 39:'[Kr] 4d¹ 5s²', 40:'[Kr] 4d² 5s²',
  41:'[Kr] 4d⁴ 5s¹', 42:'[Kr] 4d⁵ 5s¹', 43:'[Kr] 4d⁵ 5s²', 44:'[Kr] 4d⁷ 5s¹',
  45:'[Kr] 4d⁸ 5s¹', 46:'[Kr] 4d¹⁰', 47:'[Kr] 4d¹⁰ 5s¹', 48:'[Kr] 4d¹⁰ 5s²',
  49:'[Kr] 4d¹⁰ 5s² 5p¹', 50:'[Kr] 4d¹⁰ 5s² 5p²', 51:'[Kr] 4d¹⁰ 5s² 5p³',
  52:'[Kr] 4d¹⁰ 5s² 5p⁴', 53:'[Kr] 4d¹⁰ 5s² 5p⁵', 54:'[Kr] 4d¹⁰ 5s² 5p⁶',
  55:'[Xe] 6s¹', 56:'[Xe] 6s²',
  57:'[Xe] 5d¹ 6s²', 58:'[Xe] 4f¹ 5d¹ 6s²',
  59:'[Xe] 4f³ 6s²', 60:'[Xe] 4f⁴ 6s²', 61:'[Xe] 4f⁵ 6s²', 62:'[Xe] 4f⁶ 6s²',
  63:'[Xe] 4f⁷ 6s²', 64:'[Xe] 4f⁷ 5d¹ 6s²', 65:'[Xe] 4f⁹ 6s²', 66:'[Xe] 4f¹⁰ 6s²',
  67:'[Xe] 4f¹¹ 6s²', 68:'[Xe] 4f¹² 6s²', 69:'[Xe] 4f¹³ 6s²', 70:'[Xe] 4f¹⁴ 6s²',
  71:'[Xe] 4f¹⁴ 5d¹ 6s²', 72:'[Xe] 4f¹⁴ 5d² 6s²', 73:'[Xe] 4f¹⁴ 5d³ 6s²',
  74:'[Xe] 4f¹⁴ 5d⁴ 6s²', 75:'[Xe] 4f¹⁴ 5d⁵ 6s²', 76:'[Xe] 4f¹⁴ 5d⁶ 6s²',
  77:'[Xe] 4f¹⁴ 5d⁷ 6s²', 78:'[Xe] 4f¹⁴ 5d⁹ 6s¹', 79:'[Xe] 4f¹⁴ 5d¹⁰ 6s¹',
  80:'[Xe] 4f¹⁴ 5d¹⁰ 6s²', 81:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', 82:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²',
  83:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', 84:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', 85:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵',
  86:'[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶',
  87:'[Rn] 7s¹', 88:'[Rn] 7s²',
  89:'[Rn] 6d¹ 7s²', 90:'[Rn] 6d² 7s²', 91:'[Rn] 5f² 6d¹ 7s²', 92:'[Rn] 5f³ 6d¹ 7s²',
  93:'[Rn] 5f⁴ 6d¹ 7s²', 94:'[Rn] 5f⁶ 7s²', 95:'[Rn] 5f⁷ 7s²', 96:'[Rn] 5f⁷ 6d¹ 7s²',
  97:'[Rn] 5f⁹ 7s²', 98:'[Rn] 5f¹⁰ 7s²', 99:'[Rn] 5f¹¹ 7s²', 100:'[Rn] 5f¹² 7s²',
  101:'[Rn] 5f¹³ 7s²', 102:'[Rn] 5f¹⁴ 7s²', 103:'[Rn] 5f¹⁴ 7s² 7p¹',
  104:'[Rn] 5f¹⁴ 6d² 7s²', 105:'[Rn] 5f¹⁴ 6d³ 7s²', 106:'[Rn] 5f¹⁴ 6d⁴ 7s²',
  107:'[Rn] 5f¹⁴ 6d⁵ 7s²', 108:'[Rn] 5f¹⁴ 6d⁶ 7s²', 109:'[Rn] 5f¹⁴ 6d⁷ 7s²',
  110:'[Rn] 5f¹⁴ 6d⁸ 7s²', 111:'[Rn] 5f¹⁴ 6d¹⁰ 7s¹', 112:'[Rn] 5f¹⁴ 6d¹⁰ 7s²',
  113:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', 114:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', 115:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³',
  116:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', 117:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', 118:'[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶'
};
const CAMADAS_NOME    = ['K','L','M','N','O','P','Q'];
const ORDEM_SUBNIVEIS = ['1s','2s','2p','3s','3p','4s','3d','4p','5s','4d','5p',
                         '6s','4f','5d','6p','7s','5f','6d','7p'];
const MAX_SUB = { s:2, p:6, d:10, f:14 };

/* ==================================================================
   6. CURIOSIDADES
   CURIOSIDADES[Z] = texto exibido no card "Curiosidades" do modal.
   ================================================================== */
const CURIOSIDADES = {
  1: "Elemento mais abundante do universo (~75% da massa bariónica). Combustível de fusão nas estrelas (reação p–p). A maior parte do H₂ industrial provém do vapor de metano reformado (steam methane reforming).",
  2: "Segundo elemento mais abundante do universo, formado pela fusão nuclear do hidrogênio nas estrelas (processo pp e ciclo CNO). Único elemento que permanece líquido a pressão atmosférica até o zero absoluto (Pe = −268,93 °C = 4,22 K, temperatura de ebulição normal). Não se solidifica a pressão ambiente, qualquer que seja a temperatura — solidifica apenas acima de 2,5 MPa (25 atm).",
  3: "Metal mais leve (0,534 g/cm³) e o elemento sólido com maior capacidade calorífica específica. Essencial em baterias de íon-lítio (Li-ion). Reservas significativas nas salinas da Bolívia, Chile e Argentina.",
  4: "Extremamente tóxico — poeira de berílio causa beriliose pulmonar crônica. Liga Be–Cu é usada em molas e instrumentos de precisão. Janelas de berílio são usadas em tubos de raios-X por sua baixa absorção de radiação.",
  5: "O boro-10 (19,9% natural) tem seção de choque de captura de nêutrons de ~3840 barns, tornando-o valioso em barras de controle de reatores e em radioterapia por captura de nêutrons (BNCT).",
  6: "Forma mais compostos do que qualquer outro elemento. O ciclo do carbono regula o clima da Terra. O carbono-14 (t½ = 5 730 anos) é base da datação radiocarbônica.",
  7: "Constitui 78,09% do volume da atmosfera terrestre (N₂). O processo Haber–Bosch, que fixa N₂ atmosférico em NH₃ (Fe como catalisador, 400–500 °C, 150–300 atm), sustenta a produção de fertilizantes nitrogenados que alimenta ~50% da população mundial atual.",
  8: "Segundo elemento mais abundante na crosta terrestre (~46% em massa). Responsável pela camada de ozônio (O₃) que bloqueia UV solar. Independentemente descoberto por Carl Wilhelm Scheele (1772) e Joseph Priestley (1774).",
  9: "Elemento mais eletronegativo (χ = 3,98 na escala Pauling). Tão reativo que reage diretamente com a maioria dos outros elementos, incluindo gases nobres como xenônio. O flúor-18 é fundamental em tomografias PET.",
  10: "Gás nobre usado em lâmpadas de descarga (luz laranja-avermelhada). Detectado espectroscopicamente no Sol antes de ser isolado na Terra (Ramsay & Travers, 1898). Produzido industrialmente por destilação do ar líquido.",
  11: "Reage violentamente com água, liberando H₂ e hidróxido de sódio. Essencial na regulação do potencial de ação neuronal (bomba Na⁺/K⁺-ATPase). Obtido industrialmente por eletrólise do NaCl fundido (processo Downs).",
  12: "Quarto elemento mais abundante na crosta terrestre por massa. Cofator de mais de 300 enzimas no corpo humano. A clorofila, pigmento central da fotossíntese, tem Mg²⁺ no centro do anel porfirínico.",
  13: "Metal mais abundante na crosta terrestre (~8,1% em massa) e terceiro elemento mais abundante. O processo Hall–Héroult (1886) tornou o alumínio acessível: eletrólise de Al₂O₃ dissolvida em criolita fundida.",
  14: "Segundo elemento mais abundante na crosta terrestre (~27,7%). Base da eletrônica moderna: semicondutor com gap de banda de 1,12 eV a 300 K. O SiO₂ é o principal componente do vidro comum.",
  15: "Essencial para a vida: compõe DNA, RNA e ATP. O fósforo branco (P₄) é pirofórico e altamente tóxico; o vermelho é estável e usado em fósforos de segurança. Obtido industrialmente por redução de fosfato de cálcio com carbono.",
  16: "Componente dos aminoácidos cisteína e metionina, essenciais para a estrutura de proteínas (pontes dissulfeto). O SO₂ liberado em erupções vulcânicas forma aerossóis de H₂SO₄ na estratosfera que refletem radiação solar, causando resfriamento climático temporário (p. ex., erupção do Pinatubo, 1991, reduziu T global em ~0,5 °C).",
  17: "Halogênio de alta reatividade; agente desinfetante usado em tratamento de água desde o início do século XX. O gás Cl₂ foi usado como arma química na Batalha de Ypres (1915). Produzido por eletrólise de salmoura (processo cloro-álcali).",
  18: "Terceiro gás mais abundante na atmosfera terrestre (~0,934% em volume). Utilizado como atmosfera inerte na soldagem TIG e em lâmpadas incandescentes de alta qualidade. Sem compostos estáveis conhecidos em condições normais.",
  19: "Metal alcalino essencial ao funcionamento celular: o gradiente K⁺/Na⁺ através das membranas é a base do potencial de repouso dos neurônios. Obtido industrialmente pela redução de KCl com sódio metálico.",
  20: "Elemento mais abundante nos ossos e dentes humanos (como hidroxiapatita, Ca₁₀(PO₄)₆(OH)₂). Quinto elemento mais abundante na crosta terrestre. Cofator essencial na contração muscular e coagulação sanguínea.",
  21: "Terra rara leve de ocorrência dispersa. Produzido em reatores nucleares pela fissão de urânio e plutônio. Adicionado ao alumínio para melhorar resistência mecânica em ligas aeroespaciais (ligas Al–Sc).",
  22: "Biocompatível e mais resistente à corrosão que qualquer outro metal. Razão resistência/densidade superior à do aço. Produzido pelo processo Kroll: redução de TiCl₄ com magnésio metálico em atmosfera inerte.",
  23: "Descoberto em 1801 por Andrés Manuel del Río (México) e erroneamente identificado como cromo; redescoberto em 1830–1831 por Nils Gabriel Sefström. O pentóxido V₂O₅ é catalisador no processo de contato para produção de H₂SO₄. Adicionado ao aço melhora dureza e resistência ao impacto.",
  24: "A configuração eletrônica anômala [Ar]3d⁵4s¹ (esperada: 3d⁴4s²) deve-se à estabilidade extra da subcamada d semicheia. O cromo confere resistência à corrosão ao aço inoxidável (mínimo 10,5% Cr).",
  25: "A configuração anômala [Ar]3d⁵4s² com a camada d semicheia o torna paramagnético. Essencial na produção de aço (remove enxofre e oxigênio). O MnO₂ é catalisador e eletrodo em pilhas secas zinco-carbono.",
  26: "Quarto elemento mais abundante na crosta terrestre e principal constituinte do núcleo terrestre (~80% do núcleo externo líquido e núcleo interno sólido). A hemoglobina e mioglobina contêm Fe²⁺ no centro do grupo heme para transporte de O₂. A fusão redutora em alto-forno combina hematita + coque + calcário a ~1 500 °C.",
  27: "Essencial para a vitamina B₁₂ (única vitamina que contém metal de transição). O azul da cobalto foi usado na cerâmica desde a Antiguidade. Principal produtor mundial: República Democrática do Congo (~70%).",
  28: "Primeiro a ser descoberto por seu forte ferromagnetismo (junto com Fe e Co). Componente de ligas resistentes a altas temperaturas (superligas de Ni em turbinas). Ocorre em meteoros ferro-níquel.",
  29: "Metal usado pelo ser humano há ~10 000 anos — o mais antigo com uso documentado. Melhor condutor elétrico depois da prata. Essencial à vida: centro ativo da citocromo c oxidase. O Chile detém as maiores reservas mundiais (~23%), seguido de Peru, Austrália e Rússia.",
  30: "Micronutriente essencial; cofator de mais de 300 enzimas. A deficiência de zinco afeta ~2 bilhões de pessoas. Produzido principalmente pelo processo pirometalúrgico Imperial Smelting ou por eletrólise de ZnSO₄.",
  31: "Ponto de fusão 29,76 °C — derrete ao ser aquecido pela mão. Produzido como subproduto do refino de bauxita (Al) e esfalerita (Zn). Usado em LEDs de alta eficiência (GaN, GaAs) e em substratos de semicondutores.",
  32: "Predito por Mendeleev em 1871 como 'eka-silício' antes de sua descoberta por Clemens Winkler em 1886. Semicondutor histórico: base dos primeiros transistores de ponto de contato (Bell Labs, 1947). Atualmente obtido do zinco.",
  33: "Veneno histórico: usado em crimes e como medicamento (Salvarsan, 1909 — primeiro agente quimioterápico moderno). O arseneto de gálio (GaAs) é semicondutor de alta velocidade. Ocorre em minerais sulfetados de Cu, Pb e Zn.",
  34: "Micronutriente essencial — componente da selenocisteína (21º aminoácido) e da enzima glutationa peroxidase. A China detém mais de 30% das reservas mundiais. Obtido como subproduto anódico do refino eletrolítico do cobre.",
  35: "Único não-metal líquido a 25 °C e 1 atm. Descrito pela IUPAC como halogênio de alta reatividade. Ocorre principalmente como brometo (Br⁻) dissolvido no oceano e no Mar Morto. Produzido por oxidação de Br⁻ com Cl₂.",
  36: "Gás nobre usado na iluminação de sinais luminosos (cor azul-branca). Isolado em 1898 por Ramsay & Travers. O criptônio-85 (t½ = 10,8 anos) liberado em reprocessamentos nucleares é indicador de proliferação nuclear.",
  37: "O mais reativo dos alcalinos leves. Os relógios atômicos de rubídio baseiam-se na transição hiperfina do Rb-87 a 6 835 MHz. Rb-87 (t½ = 47,5 × 10⁹ anos) é usado na geocronologia Rb–Sr.",
  38: "O Sr-90 (t½ = 28,8 anos), subproduto de explosões nucleares, se deposita nos ossos substituindo cálcio — cancerígeno. Usado em fogos de artifício (cor vermelha intensa, comprimento de onda ~650 nm). Minerais: celestita (SrSO₄).",
  39: "Componente dos fósforos YAG:Nd (lasers cirúrgicos e industriais) e Y₂O₃:Eu (fósforos vermelhos em televisões CRT). O Y-90 (t½ = 64 h) é usado em radioterapia de câncer hepático. Ocorre em areias monazíticas.",
  40: "Resistente à corrosão por neutrons, tornando-o ideal para revestimentos internos de reatores nucleares. Sempre coexiste com háfnio na natureza; separação difícil por similaridade química. Mineral principal: zircão (ZrSiO₄).",
  41: "O Brasil detém ~98% das reservas mundiais de nióbio (jazidas de pirocloro em Araxá, MG). Adicionado ao aço em quantidade de ~0,1% aumenta a resistência mecânica em ~30%. Supercondutores NbTi e Nb₃Sn equipam o LHC (CERN).",
  42: "O MoS₂ (molibdenita) é lubrificante sólido eficaz em vácuo e alta temperatura — usado na NASA. A enzima nitrogenase, que fixa N₂ atmosférico, contém um cofator Mo-Fe. Principal produtor mundial: China.",
  43: "Primeiro elemento artificial, produzido por Perrier & Segrè (1937) por bombardeio de Mo-98 com dêuterons. Sem isótopos estáveis. O Tc-99m (t½ = 6 h) é o radionuclídeo mais utilizado em medicina nuclear diagnóstica (~80% dos exames).",
  44: "Metal do grupo da platina; o RuO₂ é catalisador na oxidação do Cl₂ (processo DSA — Dimensionally Stable Anode). Componente de ligas para contatos elétricos de alta resistência ao desgaste. Produzido a partir dos resíduos do refino da platina.",
  45: "Metal mais raro da crosta terrestre (~0,001 ppb). Catalisador homogêneo essencial: o catalisador de Wilkinson [RhCl(PPh₃)₃] revolucionou a hidrogenação de alcenos. O Rh-103 é o único isótopo estável; o Rh é mononuclídico.",
  46: "Único metal de transição com configuração eletrônica [Kr]4d¹⁰ (sem elétrons 5s). Absorve H₂ em quantidade enorme (até 900× seu volume) — usado em células de combustível. Catalisador de referência em reações de hidrogenação.",
  47: "Maior condutividade elétrica (6,30×10⁷ S/m) e térmica de todos os metais. Empregado em contatos elétricos de alta confiabilidade, espelhos de telescópios e antimicrobianos. Os íons Ag⁺ são altamente bactericidas.",
  48: "Altamente tóxico — causa itai-itai (dor-dor), doença de desmineralização óssea documentada no Japão pós-II Guerra. Usado em eletroposicionamento e em detectores de raios-X (CdTe, CdZnTe). Subproduto do refino do zinco.",
  49: "Componente do óxido de estanho-índio (ITO — Indium Tin Oxide), transparente e condutor, indispensável em telas LCD, OLED e painéis sensíveis ao toque. ~80% do índio produzido destina-se a esta aplicação.",
  50: "A 'praga do estanho' (transformação alotrópica β→α abaixo de 13,2 °C) destruiu material de canhões no Exército de Napoleão em 1812. O estanho-orgânico é biocida; o SnO₂ é cerâmica elétrica e sensor de gases.",
  51: "Usado desde a Antiguidade em liga com chumbo (chumbo-antimônio para tipos gráficos). O Sb₂O₃ é retardante de chamas em plásticos. A estibina (SbH₃) é extremamente tóxica. Principal fonte: estibina (Sb₂S₃).",
  52: "Semicondutor usado em células solares de telureto de cádmio (CdTe), segunda tecnologia mais instalada no mundo. O Bi₂Te₃ é o melhor termoelétrico à temperatura ambiente. Obtido quase exclusivamente do refino do cobre.",
  53: "Essencial para a síntese dos hormônios tireoidianos (T₃ e T₄). O I-131 (t½ = 8,02 dias) é usado no tratamento do hipertireoidismo e câncer de tireoide. O I-123 é usado em imagens diagnósticas. Obtido de salmouras e algas marinhas.",
  54: "Gás nobre com notáveis compostos de inclusão. O XeF₂, XeF₄ e XeF₆ foram os primeiros compostos de gases nobres sintetizados (Bartlett, 1962). Os motores de íons de sondas como Dawn e Hayabusa usam Xe como propelente.",
  55: "Metal alcalino de maior raio atômico entre os elementos não-radioativos. O padrão de frequência do Cs-133 define o segundo SI (9 192 631 770 Hz — transição hiperfina). Reage violentamente com água e se inflama espontaneamente no ar (pirofórico).",
  56: "O BaSO₄ é insolúvel e opaco a raios-X, usado como agente de contraste gastrointestinal. O Ba(NO₃)₂ produz cor verde brilhante em fogos de artifício. Tóxico em formas solúveis (Ba²⁺ inibe canais de K⁺).",
  57: "Primeiro e mais abundante dos lantanídeos (~39 ppm na crosta). O La₂O₃ melhora o índice de refração em vidros ópticos especiais. A liga mischmetall (Ce-La-Nd) é usada na pedra de isqueiro.",
  58: "Lantanídeo mais abundante (~68 ppm). O CeO₂ é catalisador em conversores automotivos (oxida CO e HC). Polidor óptico de alta eficiência. A liga mischmetall contém ~50% de Ce.",
  59: "Os óculos de proteção para soldadores usam vidro dopado com Pr (absorve comprimentos de onda do arco elétrico). O Pr₂O₃ confere cor verde-amarelada a vidros e cerâmicas.",
  60: "Os ímãs de Nd₂Fe₁₄B são os mais potentes ímãs permanentes conhecidos (produto de energia máximo ~400 kJ/m³) — indispensáveis em motores elétricos de veículos e geradores eólicos.",
  61: "Único lantanídeo sem isótopos estáveis ou de meia-vida geológica. Encontrado em traços em minérios de urânio (fissão espontânea). O Pm-147 (t½ = 2,62 anos) alimenta células nucleares de marcapassos e baterias espaciais.",
  62: "Ímãs SmCo₅ e Sm₂Co₁₇ têm alta temperatura de Curie (~700–800 °C), ideais em motores de alta temperatura. O Sm-153 (t½ = 1,94 dias) é radiofármaco para tratamento paliativo de metástases ósseas.",
  63: "Os fosfores Eu²⁺ e Eu³⁺ emitem azul e vermelho, respectivamente — críticos nas lâmpadas fluorescentes compactas (CFL) e em telas de LEDs brancos. As notas de euro contêm pigmentos de európio para autenticação.",
  64: "O Gd³⁺ (7 elétrons desemparelhados, momento magnético máximo entre lantanídeos) é o agente de contraste MRI mais usado (complexo [Gd(DTPA)]²⁻). O Gd-157 tem a maior seção de choque de captura de nêutrons de todos os elementos estáveis (~259 000 barns).",
  65: "A liga Tb₀,₃Dy₀,₇Fe₂ (Terfenol-D) tem a maior magnetostrição à temperatura ambiente — usada em sensores e atuadores acústicos subaquáticos (sonares). O Tb³⁺ ativa o fósforo verde em tricolor de lâmpadas fluorescentes.",
  66: "O Dy₂Fe₁₄B é adicionado aos ímãs de Nd-Fe-B para aumentar a temperatura de Curie e resistência à desmagnetização. Absorvedor de nêutrons em barras de controle de reatores de alta potência.",
  67: "Maior momento magnético de dipolo entre todos os elementos (~10,6 μB). Os compostos de Ho são usados em magnetos de campo focal em equipamentos de RMN. O Ho-166 é radiofármaco experimental.",
  68: "Os amplificadores de fibra óptica dopados com érbio (EDFA — Erbium-Doped Fiber Amplifier) amplificam sinais a 1 550 nm sem conversão elétrica — fundamentais nas telecomunicações de longa distância.",
  69: "O lantanídeo mais raro de ocorrência natural (~0,52 ppm). O Tm-170 (t½ = 128,6 dias) é fonte de raios-X portátil usada em triagem radiológica. A meia-vida curta limita aplicações industriais.",
  70: "Resistência elétrica muito sensível à pressão — usado em transdutores de pressão de alta precisão. O Yb³⁺/Yb²⁺ é par redox de referência em química de lantanídeos. Produzido a partir da monazita por troca iônica.",
  71: "Lantanídeo mais pesado e menor (contração dos lantanídeos). O Lu₂SiO₅:Ce (LSO) é o cintilador mais eficiente em detectores PET. O Lu-177 (t½ = 6,65 dias) é radionuclídeo terapêutico de alta precisão (PRRT).",
  72: "Sempre coexiste com zircônio em minerais (diferença de raio ≤ 2 pm por contração dos lantanídeos). Altamente transparente a neutrons (ao contrário do Zr) — impede seu uso em elementos de combustível nuclear. Usado em microeletrônica (high-κ dielectric, HfO₂).",
  73: "O Ta₂O₅ tem alta permissividade dielétrica, essencial nos capacitores de tântalo (presentes em smartphones e eletrônica médica). Biocompatível: usado em implantes cranianos. O coltan (columbita-tantalita) origina conflitos no Congo.",
  74: "Maior ponto de fusão de todos os metais puros (3 422 °C). Maior módulo de Young entre metais elementares. Filamentos de W dominaram a iluminação incandescente por um século. O W-186 e W-184 são usados em blindagem de radiação.",
  75: "Um dos elementos mais raros da crosta terrestre (~1 ppb). Descoberto em 1925 por Noddack, Tacke & Berg. Ligas Re-W são usadas em filamentos de espectrômetros de massa. O Re-187 (t½ = 41,6 × 10⁹ anos) é base do cronômetro Re–Os.",
  76: "Metal natural mais denso (22,59 g/cm³). O OsO₄ é fixador e corador em microscopia eletrônica; extremamente tóxico (vaporiza a 130 °C). Ligas Os-Ir são as mais resistentes ao desgaste conhecidas, usadas em pontas de caneta.",
  77: "A camada de enriquecimento de irídio na fronteira Cretáceo-Paleógeno (K-Pg, 66 Ma) forneceu evidência do impacto de asteroide que causou a extinção em massa dos dinossauros (Alvarez et al., 1980). Metal mais resistente à corrosão.",
  78: "Não corrói a nenhuma temperatura. Catalisador crítico: o processo Ostwald (HNO₃) e as células de combustível PEM usam Pt como eletrodo. A cisplatina [Pt(NH₃)₂Cl₂] é o quimioterápico mais amplamente usado no mundo.",
  79: "Maleável: 1 g pode ser laminado a uma folha de ~1 m² ou esticado a ~3 km de fio. O Au-198 (t½ = 2,69 dias) é usado em braquiterapia. Os nanopartículas de ouro têm propriedades ópticas únicas (plasmônica).",
  80: "Único metal líquido à temperatura ambiente (junto com o gálio). A amalgamação com Au e Ag foi historicamente usada na mineração, causando contaminação ambiental grave. A Convenção de Minamata (2013) restringe seu uso.",
  81: "Altamente tóxico — o acetato de Tálio foi raticida até ser proibido em muitos países nos anos 1970–1980. O Tl⁺ mimetiza K⁺ nas bombas Na⁺/K⁺-ATPase e nos canais de potássio, acumulando-se intracelularmente. O Tl-201 (t½ = 73 h) foi padrão em cintilografia de perfusão miocárdica antes de ser amplamente substituído pelo Tc-99m.",
  82: "Material de blindagem de radiação por excelência (alta densidade, alto Z). A contaminação por chumbo (plumbismo) afetou civilizações antigas que usavam encanamentos e vasilhames de Pb. O Pb-210 é rastreador geoquímico.",
  83: "O Bi-209 foi considerado estável por décadas; sua radioatividade (α-decaimento, t½ = 1,9 × 10¹⁹ anos — ~10⁹× a idade do universo) foi descoberta em 2003 por De Marcillac et al. Cristais de bismuto solidificado formam estruturas cúbicas em degraus com óxidos iridescentes. O subsalicilato de bismuto (Pepto-Bismol) é usado no tratamento de gastrites e infecção por H. pylori.",
  84: "Descoberto por Marie e Pierre Curie em 1898 — homenagem à Polônia natal de Marie. O Po-210 (t½ = 138,4 dias) é α-emissor puro de alta toxicidade; usado em eliminadores de estática e no envenenamento de Alexander Litvinenko (2006).",
  85: "Elemento natural mais raro: estima-se que existam menos de 70 mg na crosta terrestre inteira. O At-211 (t½ = 7,2 h) é promissor em radioterapia α-dirigida (TAT — Targeted Alpha Therapy) por sua cadeia de decaimento pura em α.",
  86: "Gás nobre radioativo — o Rn-222 (t½ = 3,82 dias) é produto do decaimento do Ra-226. Segunda principal causa de câncer de pulmão em não-fumantes, segundo a OMS (após o tabagismo). Acumula-se em porões e locais com granito.",
  87: "Elemento natural mais instável: o isótopo mais duradouro, Fr-223 (t½ = 22,0 min), decai em Ra-223 ou At-219. Estimado que existam menos de 30 g de frâncio na crosta terrestre em qualquer momento. Descoberto em 1939 por Marguerite Perey.",
  88: "Descoberto em 1898 por Marie e Pierre Curie a partir da pechblenda. O Ra-226 (t½ = 1 600 anos) foi usado em tintas luminescentes (radioterapia), causando mortes entre as 'Radium Girls'. O Ra-223 é aprovado para metástases ósseas.",
  89: "Emite luz azul-pálida visível no escuro por radioluminescência — fenômeno de Cherenkov. O Ac-225 (t½ = 9,9 dias) é alvo de intenso desenvolvimento para radioterapia α dirigida (TAT) contra cânceres resistentes.",
  90: "Thorium-232 (t½ = 14 × 10⁹ anos) é três vezes mais abundante que o urânio na crosta. Reatores de tório (ciclo Th-232/U-233) produzem menos actinídeos transurânicos que reatores de urânio. Mineral: monazita [(Ce,La,Nd,Th)PO₄].",
  91: "Intermediário do decaimento do U-235. O Pa-231 (t½ = 32 760 anos) é usado como marcador geocronológico no estudo de circulação oceânica profunda. É o actinídeo natural mais raro (~1 ppm em minérios de urânio ricos).",
  92: "Combustível nuclear predominante: U-235 (0,72% natural) é fissil; U-238 (99,27%) é fértil (gera Pu-239 por captura de nêutron). A bomba de urânio Little Boy (1945) usou o método gun-type com U-235 altamente enriquecido.",
  93: "Primeiro elemento transuraniano, sintetizado em 1940 por McMillan & Abelson no ciclotron de Berkeley por bombardeio de U-238 com nêutrons. Encontrado em traços em minérios de urânio por fissão espontânea de U-238.",
  94: "O Pu-238 (t½ = 87,7 anos) alimenta Geradores Termoelétricos de Radioisótopos (RTG) em sondas Voyager, Cassini e Curiosity. O Pu-239 (t½ = 24 110 anos) é material fissil para armas e reatores nucleares.",
  95: "O Am-241 (t½ = 432,2 anos) é a fonte de radiação α em detectores de fumaça ionizantes (~0,3 μg ou ~37 kBq por unidade doméstica). Partículas α de 5,5 MeV ionizam o ar entre eletrodos; aerossóis de fumaça capturam os íons, reduzindo a corrente e disparando o alarme. Aprovado pela NRC (EUA) e regulamentado pela IAEA.",
  96: "Nomeado em homenagem a Marie e Pierre Curie. O Cm-244 (t½ = 18,1 anos) é fonte de calor em RTGs de missão de longa duração. O Cm-248 é produzido em reatores e serve como alvo para síntese de californium.",
  97: "Sintetizado em 1949 por Thompson, Ghiorso & Seaborg na UC Berkeley. O Bk-249 (t½ = 330 dias) é o único isótopo produzido em quantidades macroscópicas (~μg/ano) e serve como alvo-chave para síntese de elementos ainda mais pesados (Ts, Og).",
  98: "O Cf-252 (t½ = 2,65 anos) tem a maior taxa de emissão de nêutrons espontâneos de qualquer nuclídeo prático (~2,3 × 10¹² n/g·s) — usado para inicialização de reatores, análise por ativação de nêutrons e como fonte portátil.",
  99: "Identificado em 1952 nos detritos da primeira detonação de bomba de hidrogênio (Ivy Mike, Pacífico Sul) — produto de captura múltipla de nêutrons pelo U-238. Nomeado em homenagem a Albert Einstein.",
  100: "Identificado nos mesmos detritos de Ivy Mike que o einstênio. O Fm-257 (t½ = 100,5 dias) é o isótopo mais estável. A síntese acima de Z=100 é extremamente difícil pois o Fm não forma íons M³⁺ estáveis em solução aquosa.",
  101: "Sintetizado em 1955 por Ghiorso, Harvey, Choppin, Thompson & Seaborg bombardeando ~10⁹ átomos de Es-253 com partículas α. Primeiro elemento sintetizado um átomo de cada vez e identificado quimicamente. Homenagem a Mendeleev.",
  102: "Nomeado em homenagem a Alfred Nobel. A controvérsia sobre a descoberta (reivindicações de Dubna, Berkeley e Estocolmo) levou à primeira revisão formal de prioridade de descoberta pela IUPAC. O No-259 tem t½ = 58 min.",
  103: "Último actinídeo. Sintetizado em 1961 (Berkeley) por bombardeio de Cf com boro. A configuração eletrônica experimental é [Rn]5f¹⁴7s²7p¹ — a única exceção ao preenchimento sequencial entre os actinídeos.",
  104: "Análogo químico do háfnio (mesmo grupo). Sintetizado em 1964 (Dubna) e 1969 (Berkeley) — disputa de prioridade resolvida pela IUPAC em 1997. O isótopo mais estável, Rf-267 (t½ ≈ 1,3 h), permite experimentos químicos em fase gasosa.",
  105: "Análogo do tântalo. Confirmado pela IUPAC em 1997. O Db-268 (t½ ≈ 29 h) tem a maior meia-vida do elemento. Experimentos confirmaram seu comportamento químico análogo ao Nb e Ta em cromatografia de troca aniônica.",
  106: "Nomeado em 1997 em homenagem a Glenn T. Seaborg — único elemento nomeado enquanto o homenageado ainda vivia (Seaborg morreu em 1999). Análogo do tungstênio. O Sg-271 (t½ ≈ 1,9 min) permite estudos de volatilidade.",
  107: "Análogo do rênio. Primeiro transactinídeo com propriedades confirmadas de metal de transição do grupo 7 (em analogia com Mn, Tc, Re) por experimentos de cromatografia de troca iônica em 1994 (GSI, Darmstadt).",
  108: "Análogo do ósmio. Sintetizado pela primeira vez em 1984 no GSI (Darmstadt) pela fusão de Pb-208 com Fe-58. O Hs-270 (t½ ≈ 22 s) permitiu a observação do tetróxido HsO₄ volátil — análogo ao OsO₄ — em 2002.",
  109: "Nomeado em 1997 em homenagem a Lise Meitner — física austríaca co-descobridora da fissão nuclear com Otto Hahn e Fritz Strassmann. Análogo do irídio. Isótopo mais estável: Mt-278 (t½ ≈ 4,5 s).",
  110: "Análogo da platina. Sintetizado em 1994 no GSI. O Ds-281 (t½ ≈ 12,7 s) é o isótopo mais estável. Efeitos relativísticos podem tornar o Ds mais nobre que a platina, com possível configuração [Rn]5f¹⁴6d⁸7s² ou 6d⁹7s¹.",
  111: "Nomeado em 2004 em homenagem a Wilhelm Conrad Röntgen, descobridor dos raios-X. Análogo do ouro. O Rg-282 (t½ ≈ 100 s) é o isótopo mais estável. Cálculos relativísticos preveem alto potencial de ionização — mais nobre que o Au.",
  112: "Análogo do mercúrio. O Cn-285 (t½ ≈ 29 s) é o isótopo mais estável. Experimentos de 2007–2009 em Dubna e PSI (Suíça) sugerem que o Cn se comporta como gás nobre em condições ambientais, em vez de metal — consequência de efeitos relativísticos extremos.",
  113: "Primeiro elemento sintetizado na Ásia: descoberto pelo grupo RIKEN (Japão) em 2004. A confirmação definitiva pela IUPAC em dezembro de 2015 concedeu ao Japão o direito de nomeação — primeiro para um país asiático. Nomeado em homenagem ao Japão (Nihon = 日本).",
  114: "Análogo do chumbo; possivelmente na 'ilha de estabilidade' nuclear (núcleo duplamente mágico Z=114, N=184 está próximo). O Fl-289 (t½ ≈ 1,9 s) mostra comportamento mais próximo de gás nobre que de metal por efeitos relativísticos — referência: experimentos na RIKEN e JINR.",
  115: "Confirmado pela IUPAC em dezembro de 2015. Análogo do bismuto. Nomeado em homenagem à Oblast de Moscou (Moscóvia), onde fica o JINR em Dubna. O Mc-290 (t½ ≈ 0,65 s) é o isótopo mais estável.",
  116: "Análogo do polônio. Sintetizado em 2000 em Dubna pela fusão de Cm-248 com Ca-48. Nomeado em 2012 em homenagem ao Lawrence Livermore National Laboratory (EUA), parceiro da colaboração JINR-LLNL. O Lv-293 (t½ ≈ 57 ms) é o mais estável.",
  117: "Análogo do ástato. Sintetizado em 2010 em Dubna pela fusão de Bk-249 (produzido no ORNL, EUA) com Ca-48. Confirmado pela IUPAC em 2015. Nomeado em homenagem ao estado do Tennessee (EUA). O Ts-294 (t½ ≈ 51 ms) é o mais estável.",
  118: "Elemento de maior número atômico confirmado. Sintetizado em 2002 em Dubna (3 átomos). Confirmado pela IUPAC em 2015. Nomeado em homenagem a Yuri Oganessyan, pioneiro em síntese de elementos superpesados. Gás nobre previsto com t½ = 0,89 ms (Og-294)."
};

/* ==================================================================
   7. ELEMENTOS
   Tres listas que juntas formam os 118 elementos:
     elementosBase . corpo principal da tabela (tem periodo E grupo)
     lantanideos ... serie 4f  (nao tem periodo; grupo = posicao na linha)
     actinideos .... serie 5f  (idem)
   Campos de cada objeto:
     numero ... Z, numero atomico (chave de todas as outras tabelas)
     simbolo .. simbolo IUPAC
     nome ..... nome em portugues
     grupo .... coluna na grade (1..18)
     periodo .. linha na grade (ausente nas duas series)
     cat ...... categoria; precisa existir em CAT_COLOR_VAR
     obtencao . texto do card "Como e obtido"
   Para adicionar uma propriedade nova por elemento voce tem 2 caminhos:
     (a) acrescentar o campo em cada objeto destas 3 listas, ou
     (b) criar uma tabela separada indexada por Z (ver secao 9).
   O caminho (b) e mais simples de colar a partir de planilha e nao
   mexe em 118 objetos ja existentes.
   ================================================================== */
const elementosBase = [
  {numero:1, simbolo:"H", nome:"Hidrogênio", grupo:1, periodo:1, cat:"Não-metal", obtencao:"Industrialmente por reforma a vapor do metano (CH₄ + H₂O → CO + 3H₂) ou por eletrólise da água (2H₂O → 2H₂ + O₂). O H₂ verde, por eletrólise com energia renovável, é tecnologia emergente."},
  {numero:2, simbolo:"He", nome:"Hélio", grupo:18, periodo:1, cat:"Gás nobre", obtencao:"Extraído como subproduto do gás natural (campos de Kansas, Texas e Argélia contêm até 7% He). Formado pelo decaimento α de U e Th. Não pode ser sintetizado economicamente."},
  {numero:3, simbolo:"Li", nome:"Lítio", grupo:1, periodo:2, cat:"Metal alcalino", obtencao:"Salmouras de salares (Bolívia, Chile, Argentina — 'triângulo do lítio') por evaporação e precipitação seletiva. Também do mineral espodumênio (LiAlSi₂O₆) por lixiviação ácida."},
  {numero:4, simbolo:"Be", nome:"Berílio", grupo:2, periodo:2, cat:"Metal alcalino-terroso", obtencao:"Do mineral berilo [Be₃Al₂(SiO₃)₆] por fusão com NaOH e lixiviação ácida, seguida de redução de BeF₂ com magnésio metálico (processo Kjeldahl-modificado)."},
  {numero:5, simbolo:"B", nome:"Boro", grupo:13, periodo:2, cat:"Semimetal", obtencao:"Principalmente da bórax (Na₂B₄O₇·10H₂O) e cernita em depósitos evaporíticos (Turquia, EUA). Boro elementar por redução de B₂O₃ com magnésio ou alumínio a alta temperatura."},
  {numero:6, simbolo:"C", nome:"Carbono", grupo:14, periodo:2, cat:"Não-metal", obtencao:"Grafite e diamante são minerados diretamente. Carvão por destilação da madeira ou mineração. Carbono industrial sintético por decomposição de metano em plasma (negro de fumo) ou CVD (diamante sintético)."},
  {numero:7, simbolo:"N", nome:"Nitrogênio", grupo:15, periodo:2, cat:"Não-metal", obtencao:"Industrialmente por destilação fracionada do ar líquido (ponto de ebulição: −195,8 °C). O processo Linde-Hampson liquefaz o ar; a destilação separa N₂ do O₂ (−183 °C) e Ar (−185,8 °C)."},
  {numero:8, simbolo:"O", nome:"Oxigênio", grupo:16, periodo:2, cat:"Não-metal", obtencao:"Por destilação fracionada do ar líquido (processo Linde-Hampson). Em escala laboratorial, por decomposição de KMnO₄ ou H₂O₂. Eletrólise da água produz O₂ de alta pureza como subproduto."},
  {numero:9, simbolo:"F", nome:"Flúor", grupo:17, periodo:2, cat:"Halogênio", obtencao:"Exclusivamente por eletrólise do fluoreto de hidrogênio anidro (HF) dissolvido em KF fundido (célula de Moissan, 1886). O F₂ não pode ser obtido por rotas químicas convencionais."},
  {numero:10, simbolo:"Ne", nome:"Neônio", grupo:18, periodo:2, cat:"Gás nobre", obtencao:"Por destilação fracionada do ar líquido. O Ne se concentra no topo da coluna (ponto de ebulição: −246,1 °C). Separado do He por adsorção seletiva em carvão ativo a temperatura de N₂ líquido."},
  {numero:11, simbolo:"Na", nome:"Sódio", grupo:1, periodo:3, cat:"Metal alcalino", obtencao:"Industrialmente por eletrólise do NaCl fundido no processo Downs (cátodo de aço, ânodo de grafite, separador de aço para evitar recombinação de Na e Cl₂). Temperatura de operação ~600 °C."},
  {numero:12, simbolo:"Mg", nome:"Magnésio", grupo:2, periodo:3, cat:"Metal alcalino-terroso", obtencao:"Pela eletrólise do MgCl₂ fundido (processo Dow, obtendo MgCl₂ da água do mar por tratamento com cal e cloreto). Também por redução de MgO com silício em forno a vácuo (processo Pidgeon)."},
  {numero:13, simbolo:"Al", nome:"Alumínio", grupo:13, periodo:3, cat:"Metal representativo", obtencao:"Processo Hall–Héroult (1886): eletrólise de Al₂O₃ (alumina) dissolvida em criolita (Na₃AlF₆) fundida a ~960 °C. A alumina é extraída da bauxita pelo processo Bayer com NaOH sob pressão e temperatura."},
  {numero:14, simbolo:"Si", nome:"Silício", grupo:14, periodo:3, cat:"Semimetal", obtencao:"Sílica (SiO₂) reduzida com coque em forno elétrico a arco (Si grau metalúrgico, ~98%). Si ultrapuro (eletrônico) por decomposição do tricloro-silano (SiHCl₃) e refino de zona flutuante (FZ) ou Czochralski (CZ)."},
  {numero:15, simbolo:"P", nome:"Fósforo", grupo:15, periodo:3, cat:"Não-metal", obtencao:"Processo de fornos elétricos: redução de Ca₃(PO₄)₂ com coque e SiO₂ a ~1 400 °C. O P₄ formado é condensado. O fósforo vermelho é obtido por aquecimento controlado do P₄ branco na ausência de ar."},
  {numero:16, simbolo:"S", nome:"Enxofre", grupo:16, periodo:3, cat:"Não-metal", obtencao:"Processo Frasch (enxofre nativo em sal domes): injeção de água superaquecida que funde o enxofre, expelido à superfície com ar comprimido. Também como subproduto da dessulfurização de petróleo e gás (processo Claus)."},
  {numero:17, simbolo:"Cl", nome:"Cloro", grupo:17, periodo:3, cat:"Halogênio", obtencao:"Processo cloro-álcali: eletrólise de solução aquosa saturada de NaCl (salmoura). Produz Cl₂ no ânodo e NaOH + H₂ no cátodo. Células de membrana (processo DuPont) substituíram as células de mercúrio por razões ambientais."},
  {numero:18, simbolo:"Ar", nome:"Argônio", grupo:18, periodo:3, cat:"Gás nobre", obtencao:"Subproduto da destilação fracionada do ar líquido (ponto de ebulição: −185,8 °C — entre N₂ e O₂). O Ar (0,934% do ar) é separado num ciclo lateral da coluna de destilação do ar e purificado por oxidação catalítica do H₂ residual."},
  {numero:19, simbolo:"K", nome:"Potássio", grupo:1, periodo:4, cat:"Metal alcalino", obtencao:"Por redução térmica de KCl fundido com vapores de sódio a ~850 °C e destilação fracionada do K metálico (processo Griesheimer-Castner adaptado). A eletrólise do KCl fundido é ineficiente pois o K metálico se dissolve no eletrólito fundido, exigindo separação por destilação de qualquer forma."},
  {numero:20, simbolo:"Ca", nome:"Cálcio", grupo:2, periodo:4, cat:"Metal alcalino-terroso", obtencao:"Eletrólise do CaCl₂ fundido (cátodo de aço, ânodo de grafite) a ~800 °C. O CaCl₂ é obtido a partir da calcita (CaCO₃) tratada com HCl. Escala muito menor que Al ou Mg; consumo industrial limitado."},
  {numero:21, simbolo:"Sc", nome:"Escândio", grupo:3, periodo:4, cat:"Metal de transição", obtencao:"Subproduto do processamento de minerais de terras raras (bastnasita, monazita, euxênita) e do refino de titânio e urânio. O Sc metálico é obtido por redução de ScF₃ com Ca em atmosfera de Ar. Produção mundial: ~15–20 toneladas/ano; Rússia e China dominam."},
  {numero:22, simbolo:"Ti", nome:"Titânio", grupo:4, periodo:4, cat:"Metal de transição", obtencao:"Processo Kroll (1940): cloração do rutilo (TiO₂) com Cl₂ e C a ~900 °C para obter TiCl₄, seguida de redução com Mg metálico em atmosfera de Ar a ~800 °C. O produto ('esponja') é fundido em forno a arco."},
  {numero:23, simbolo:"V", nome:"Vanádio", grupo:5, periodo:4, cat:"Metal de transição", obtencao:"Subproduto do processamento de magnetita vanadifera (Rússia, China, África do Sul). A escória rica em V₂O₅ é reduzida com Al ou Ca. Também recuperado do petróleo cru vanadifico por incineração e lixiviação."},
  {numero:24, simbolo:"Cr", nome:"Cromo", grupo:6, periodo:4, cat:"Metal de transição", obtencao:"Do mineral cromita (FeCr₂O₄) por redução aluminotérmica (processo de Goldschmidt) ou redução com carbono em forno elétrico. A pureza é ajustada pelo processo eletrolítico em banho de CrO₃/H₂SO₄."},
  {numero:25, simbolo:"Mn", nome:"Manganês", grupo:7, periodo:4, cat:"Metal de transição", obtencao:"Do mineral pirolusita (MnO₂) por redução com Al (aluminotermia) ou por eletrólise de MnSO₄ aquoso (Mn eletrolítico de alta pureza). A maior parte é usada diretamente como ferroliga (FeMn, SiMn)."},
  {numero:26, simbolo:"Fe", nome:"Ferro", grupo:8, periodo:4, cat:"Metal de transição", obtencao:"Redução de hematita (Fe₂O₃) ou magnetita (Fe₃O₄) com coque e calcário em alto-forno a ~1 500 °C. O ferro-gusa resultante é convertido em aço pelo processo LD (Basic Oxygen Furnace) ou em forno elétrico a arco (EAF)."},
  {numero:27, simbolo:"Co", nome:"Cobalto", grupo:9, periodo:4, cat:"Metal de transição", obtencao:"Subproduto do refino hidrometalúrgico do cobre e do níquel (extração por solvente com D2EHPA). Também de minerais cobaltíferos (cobaltita, eritrita). Principal produtor: República Democrática do Congo (~70%)."},
  {numero:28, simbolo:"Ni", nome:"Níquel", grupo:10, periodo:4, cat:"Metal de transição", obtencao:"De lateritas (Ni em goethita — processamento por lixiviação ácida sob pressão, HPAL) ou de sulfetos (pentlandita — pirometalurgia: tostação → fusão matte → processo Mond para Ni ultrapuro). Rússia e Indonésia líderes."},
  {numero:29, simbolo:"Cu", nome:"Cobre", grupo:11, periodo:4, cat:"Metal de transição", obtencao:"De sulfetos (calcopirita, CuFeS₂): concentração por flotação, tostação, fusão em forno de reverberação, conversão, e refino eletrolítico (catodo de Cu ≥99,99%). Também por lixiviação em pilha de minério oxidado + extração por solvente + eletrólise (SX-EW)."},
  {numero:30, simbolo:"Zn", nome:"Zinco", grupo:12, periodo:4, cat:"Metal de transição", obtencao:"Da esfalerita (ZnS) por tostação (ZnO), lixiviação em H₂SO₄, purificação (remoção de Cu, Cd, Co) e eletrólise de solução de ZnSO₄ (processo hidrometalúrgico — ~80% da produção mundial). Alternativa: forno Imperial Smelting."},
  {numero:31, simbolo:"Ga", nome:"Gálio", grupo:13, periodo:4, cat:"Metal representativo", obtencao:"Subproduto do processo Bayer (lixiviação alcalina da bauxita): o Ga³⁺ se concentra no licor de alumina e é recuperado por eletrólise em célula de mercúrio ou por extração com resinas quelantes, seguida de eletrólise."},
  {numero:32, simbolo:"Ge", nome:"Germânio", grupo:14, periodo:4, cat:"Semimetal", obtencao:"Subproduto do refino do zinco (concentra-se em poeiras de forno) e de cinzas volantes de carvão. Purificado por destilação de GeCl₄, hidrólise a GeO₂ e redução com H₂. Refino de zona para Ge eletrônico."},
  {numero:33, simbolo:"As", nome:"Arsênio", grupo:15, periodo:4, cat:"Semimetal", obtencao:"Subproduto da tostação de sulfetos de cobre, chumbo e ouro que contêm arsenopirita (FeAsS). O As₂O₃ (arsenolite) sublima e é condensado. Arsênio metálico obtido por redução de As₂O₃ com carbono."},
  {numero:34, simbolo:"Se", nome:"Selênio", grupo:16, periodo:4, cat:"Não-metal", obtencao:"Recuperado da lama anódica do refino eletrolítico do cobre (onde o Se se concentra como CuSeO₃). A lama é fundida com Na₂CO₃, lixiviada e o selenito precipitado por acidificação, depois reduzido com SO₂."},
  {numero:35, simbolo:"Br", nome:"Bromo", grupo:17, periodo:4, cat:"Halogênio", obtencao:"De salmouras naturais (Israel — Mar Morto, EUA) por oxidação de Br⁻ com Cl₂ e destilação a vapor (processo de deslocamento de halogênio). O processo Ethyl Corporation usa salmouras do Golfo do México."},
  {numero:36, simbolo:"Kr", nome:"Criptônio", grupo:18, periodo:4, cat:"Gás nobre", obtencao:"Subproduto da destilação fracionada do ar líquido (concentra-se no resíduo junto com Xe). Separado do Xe por adsorção seletiva em carvão ativo a temperatura de N₂ líquido ou por nova destilação fracionada."},
  {numero:37, simbolo:"Rb", nome:"Rubídio", grupo:1, periodo:5, cat:"Metal alcalino", obtencao:"Subproduto do processamento da lepidolita (lítio) e da polucita (césio). Separado por troca iônica ou cromatografia. O Rb metálico é obtido por redução de RbCl com Ca ou pelo método de getters em sistemas de vácuo."},
  {numero:38, simbolo:"Sr", nome:"Estrôncio", grupo:2, periodo:5, cat:"Metal alcalino-terroso", obtencao:"Do mineral celestita (SrSO₄) por conversão a SrCO₃ (tratamento com Na₂CO₃) e subsequente redução aluminotérmica de SrO a ~1 000 °C em vácuo. Também por eletrólise do SrCl₂ fundido."},
  {numero:39, simbolo:"Y", nome:"Ítrio", grupo:3, periodo:5, cat:"Metal de transição", obtencao:"De concentrados de terras raras (bastnasita, xenotímio) por extração líquido-líquido com D2EHPA ou EHEHPA. O Y metálico é obtido por redução de YF₃ com Ca metálico em forno a vácuo."},
  {numero:40, simbolo:"Zr", nome:"Zircônio", grupo:4, periodo:5, cat:"Metal de transição", obtencao:"Do zircão (ZrSiO₄) por cloração com C e Cl₂ a ~900 °C para obter ZrCl₄, seguida de redução com Mg (processo Kroll, análogo ao titânio). A separação do Hf é obrigatória para uso nuclear."},
  {numero:41, simbolo:"Nb", nome:"Nióbio", grupo:5, periodo:5, cat:"Metal de transição", obtencao:"Da pirocloro [(Ca,Na)₂Nb₂O₆(OH,F)] — jazidas de Araxá (MG) e Catalão (GO), Brasil. Concentrado por flotação, reduzido aluminotermicamente a Nb metálico. O ferronióbio é o produto comercial principal."},
  {numero:42, simbolo:"Mo", nome:"Molibdênio", grupo:6, periodo:5, cat:"Metal de transição", obtencao:"Da molibdenita (MoS₂) por flotação (concentrado) e tostação a MoO₃, depois reduzida com H₂ a ~1 100 °C para Mo metálico. Subproduto da mineração de cobre pórfiro (Cu-Mo). Principais produtores: China, EUA, Chile."},
  {numero:43, simbolo:"Tc", nome:"Tecnécio", grupo:7, periodo:5, cat:"Metal de transição", obtencao:"Produzido em reatores nucleares pela fissão de U-235 (rendimento de fissão ~6%). O Tc-99m (t½ = 6,01 h) é obtido de geradores Mo-99/Tc-99m: o Mo-99 (t½ = 65,9 h) adsorve em alumina e o Tc-99m é eluído com solução salina. É o radionuclídeo mais usado em medicina nuclear (~40 milhões de exames/ano)."},
  {numero:44, simbolo:"Ru", nome:"Rutênio", grupo:8, periodo:5, cat:"Metal de transição", obtencao:"Subproduto do refino dos metais do grupo da platina (PGMs) a partir de concentrados de Norilsk (Rússia) e Merensky Reef (África do Sul). Separado por destilação do tetróxido RuO₄, depois reduzido com H₂."},
  {numero:45, simbolo:"Rh", nome:"Ródio", grupo:9, periodo:5, cat:"Metal de transição", obtencao:"Subproduto do refino dos PGMs (Pt, Pd). Concentra-se na lama de refino do Ni/Cu. Separado por extração seletiva com TBP e outros extratantes, depois precipitado como (NH₄)₃[RhCl₆] e calcinado/reduzido."},
  {numero:46, simbolo:"Pd", nome:"Paládio", grupo:10, periodo:5, cat:"Metal de transição", obtencao:"Subproduto do refino do Pt e Ni. Os maiores produtores são Rússia (Norilsk Nickel) e África do Sul (Anglo American Platinum). Separado por dissolução seletiva em HCl/Cl₂ e precipitação como Pd(NH₃)₂Cl₂."},
  {numero:47, simbolo:"Ag", nome:"Prata", grupo:11, periodo:5, cat:"Metal de transição", obtencao:"Principalmente como subproduto do refino eletrolítico do cobre (lama anódica), zinco e chumbo (por copelação). A prata nativa é rara; a maior parte provém de argento-galena e argentita (Ag₂S)."},
  {numero:48, simbolo:"Cd", nome:"Cádmio", grupo:12, periodo:5, cat:"Metal de transição", obtencao:"Exclusivamente como subproduto do refino do zinco: o Cd se concentra no pó de tostação (Cd_gaseificado a ~767 °C) e é recuperado por condensação seletiva e eletrólise de solução de CdSO₄."},
  {numero:49, simbolo:"In", nome:"Índio", grupo:13, periodo:5, cat:"Metal representativo", obtencao:"Subproduto do refino hidrometalúrgico do zinco — concentra-se nas lamas e resíduos ácidos. Recuperado por extração com D2EHPA seguida de eletrólise de In₂(SO₄)₃. Produção mundial: ~900 toneladas/ano."},
  {numero:50, simbolo:"Sn", nome:"Estanho", grupo:14, periodo:5, cat:"Metal representativo", obtencao:"Da cassiterita (SnO₂) por redução com carbono em forno de reverberação a ~1 300 °C (processo pirometalúrgico clássico). O Sn fundido é refinado por liquação e eletrólise para remover Cu, Pb, Bi e As."},
  {numero:51, simbolo:"Sb", nome:"Antimônio", grupo:15, periodo:5, cat:"Semimetal", obtencao:"Da estibina (Sb₂S₃) por precipitação com ferro ('ferro-processo'), ou por tostação a Sb₂O₃ e redução com carbono. A China produz ~80% do antimônio mundial. Refinado por fusão de zona para Sb eletrônico."},
  {numero:52, simbolo:"Te", nome:"Telúrio", grupo:16, periodo:5, cat:"Semimetal", obtencao:"Quase exclusivamente como subproduto do refino eletrolítico do cobre (lama anódica). O TeO₂ é extraído por dissolução alcalina, acidificado para precipitar TeO₂, e reduzido com SO₂ ou eletrólise."},
  {numero:53, simbolo:"I", nome:"Iodo", grupo:17, periodo:5, cat:"Halogênio", obtencao:"De salmouras petrolíferas (Japão — Chiba; Chile — deserto do Atacama) por oxidação do I⁻ com Cl₂ ou H₂O₂ e sopro de vapor. O Chile domina >60% da produção mundial pela concentração em depósitos de salitre (NaNO₃)."},
  {numero:54, simbolo:"Xe", nome:"Xenônio", grupo:18, periodo:5, cat:"Gás nobre", obtencao:"Subproduto da destilação do ar líquido — concentra-se no resíduo com Kr. Separado por adsorção seletiva em sílica-gel a −100 °C. O Xe (0,0000087% do ar) é o mais raro dos gases nobres obtidos do ar."},
  {numero:55, simbolo:"Cs", nome:"Césio", grupo:1, periodo:6, cat:"Metal alcalino", obtencao:"Do mineral polucita (Cs₄Al₄Si₉O₂₆·H₂O) de Bernic Lake, Manitoba, Canadá (maior depósito mundial). Cs metálico por redução de CsCl com cálcio a alta temperatura, sob vácuo, e destilação fracionada."},
  {numero:56, simbolo:"Ba", nome:"Bário", grupo:2, periodo:6, cat:"Metal alcalino-terroso", obtencao:"Da barita (BaSO₄) por redução com carvão a BaS (processo de bário negro), depois convertida em BaCl₂ e eletrolisada em estado fundido. Ba metálico puro também por redução aluminotérmica de BaO."},
  {numero:72, simbolo:"Hf", nome:"Háfnio", grupo:4, periodo:6, cat:"Metal de transição", obtencao:"Sempre coexiste com Zr em minerais. Separado por destilação fracionada de ZrCl₄/HfCl₄ ou extração líquido-líquido com TBP (tributilfosfato) em HNO₃. O HfCl₄ é reduzido com Mg (processo Kroll adaptado)."},
  {numero:73, simbolo:"Ta", nome:"Tântalo", grupo:5, periodo:6, cat:"Metal de transição", obtencao:"Do coltan (columbita-tantalita) da RDC, Ruanda e Brasil. O Ta₂O₅ é separado do Nb₂O₅ por extração com MIBK (metil-isobutil-cetona) em HF/H₂SO₄. O Ta metálico é obtido por redução de K₂TaF₇ com sódio."},
  {numero:74, simbolo:"W", nome:"Tungstênio", grupo:6, periodo:6, cat:"Metal de transição", obtencao:"Da scheelita (CaWO₄) e volframita [(Fe,Mn)WO₄] por digestão alcalina para Na₂WO₄, precipitação de WO₃, e redução com H₂ a ~850 °C. A China produz ~80% do tungstênio mundial."},
  {numero:75, simbolo:"Re", nome:"Rênio", grupo:7, periodo:6, cat:"Metal de transição", obtencao:"Subproduto do processamento da molibdenita: na tostação oxidante, o Re volatiliza como Re₂O₇, que é capturado nos gases de combustão por absorção em água e precipitado como NH₄ReO₄. Chile e Cazaquistão são produtores."},
  {numero:76, simbolo:"Os", nome:"Ósmio", grupo:8, periodo:6, cat:"Metal de transição", obtencao:"Subproduto do refino dos PGMs (Norilsk, Bushveld Complex). Separado por destilação do OsO₄ volátil (f.e. 130 °C) em solução de HNO₃/HClO₄, depois reduzido com H₂. Produção: ~1 tonelada/ano."},
  {numero:77, simbolo:"Ir", nome:"Irídio", grupo:9, periodo:6, cat:"Metal de transição", obtencao:"Subproduto do refino dos PGMs no Bushveld Complex (África do Sul) e Norilsk (Rússia). Separado do Pt e Rh por dissolução seletiva em água régia, precipitação e redução. Produção: ~7–10 toneladas/ano."},
  {numero:78, simbolo:"Pt", nome:"Platina", grupo:10, periodo:6, cat:"Metal de transição", obtencao:"Principalmente do Bushveld Complex (África do Sul, ~75% mundial) e de depósitos de Ni-Cu (Norilsk, Rússia). Extraída de concentrados de PGMs por dissolução em água régia e precipitação seletiva de (NH₄)₂[PtCl₆]."},
  {numero:79, simbolo:"Au", nome:"Ouro", grupo:11, periodo:6, cat:"Metal de transição", obtencao:"Mineração de ouro nativo ou dissolvido em soluções de cianeto de sódio (processo MacArthur-Forrest). O Au é recuperado por cimentação com zinco (processo Merrill-Crowe) ou por adsorção em carvão ativo (CIL/CIP)."},
  {numero:80, simbolo:"Hg", nome:"Mercúrio", grupo:12, periodo:6, cat:"Metal de transição", obtencao:"Do cinábrio (HgS) por tostação oxidante (HgS + O₂ → Hg + SO₂) e condensação do vapor de Hg. A produção está em declínio por restrições ambientais (Convenção de Minamata, 2013). China e Quirguistão principais produtores."},
  {numero:81, simbolo:"Tl", nome:"Tálio", grupo:13, periodo:6, cat:"Metal representativo", obtencao:"Subproduto da tostação de sulfetos de Zn, Pb e Cu e do processamento de pirita. Concentrado em poeiras de câmaras de Cottrell. O Tl metálico é obtido por eletrólise de solução de TlSO₄ ou por redução química."},
  {numero:82, simbolo:"Pb", nome:"Chumbo", grupo:14, periodo:6, cat:"Metal representativo", obtencao:"Da galena (PbS) por concentração (flotação), tostação a PbO, e redução com coque em forno de cuba. O Pb é refinado por pirometalurgia (processo Harris para As/Sn/Sb) e desplatinizado (processo Parkes com Zn)."},
  {numero:83, simbolo:"Bi", nome:"Bismuto", grupo:15, periodo:6, cat:"Metal representativo", obtencao:"Subproduto do refino do chumbo (lamas de copelação) e do cobre. O Bi₂O₃ presente nas escórias é reduzido com carbono. China domina a produção mundial (>80%). Também de bismutinita (Bi₂S₃) em depósitos menores."},
  {numero:84, simbolo:"Po", nome:"Polônio", grupo:16, periodo:6, cat:"Metal representativo", obtencao:"Produzido em reatores nucleares por irradiação de Bi-209 com nêutrons (Bi-209 + n → Bi-210 → Po-210). Ocorre em traços em minérios de urânio (produto da cadeia de decaimento do Ra-226). Produção: gramas por ano."},
  {numero:85, simbolo:"At", nome:"Ástato", grupo:17, periodo:6, cat:"Halogênio", obtencao:"Produzido em cíclotrons por bombardeio de Bi-209 com partículas α aceleradas a 28 MeV: ²⁰⁹Bi(α,2n)²¹¹At. O At-211 é separado por destilação a seco. Sem ocorrência natural prática; raro na crosta (~25 g estimados)."},
  {numero:86, simbolo:"Rn", nome:"Radônio", grupo:18, periodo:6, cat:"Gás nobre", obtencao:"Emanado naturalmente do solo por decaimento do Ra-226 (cadeia U-238). Não produzido industrialmente. Para uso em pesquisa, é coletado por bombeamento do gás desprendido de soluções de Ra-226 em água e crioconcentração."},
  {numero:87, simbolo:"Fr", nome:"Frâncio", grupo:1, periodo:7, cat:"Metal alcalino", obtencao:"Não há produção industrial. Formado em traços por decaimento alfa do actínio-227: ²²⁷Ac → ²²³Fr (t½ = 22 min). Em laboratório, produzido por bombardeio de Au-197 com ¹⁸O acelerado em cíclotron (ISOLDE, CERN)."},
  {numero:88, simbolo:"Ra", nome:"Rádio", grupo:2, periodo:7, cat:"Metal alcalino-terroso", obtencao:"Ocorre em minérios de urânio (1 g de Ra por ~7 toneladas de pechblenda). Hoje produzido em reatores por irradiação de Ba-130 ou Ba-132 com nêutrons. O Ra-223 é produzido de geradores Ac-227/Ra-223 para uso médico."},
  {numero:104, simbolo:"Rf", nome:"Rutherfórdio", grupo:4, periodo:7, cat:"Metal de transição", obtencao:"²²⁶Ra(¹²C,4n)²⁶⁸Rf tentado; confirmado por ²⁴⁹Cf(¹²C,4n)²⁵⁷Rf (Berkeley, 1969, GHIORSO et al.) e ²⁴²Pu(²²Ne,4n)²⁶⁰Rf (Dubna, 1964, FLEROV et al.). A IUPAC reconheceu prioridade compartilhada em 1997. Dezenas de átomos por experimento; identificados por espectrometria de decaimento-alfa em separadores de retrocesso (separador SHIP/BGS)."},
  {numero:105, simbolo:"Db", nome:"Dúbnio", grupo:5, periodo:7, cat:"Metal de transição", obtencao:"²⁴⁹Cf(¹⁵N,4n)²⁶⁰Db (Berkeley, 1970) ou ²⁴³Am(²²Ne,5n)²⁶⁰Db (Dubna, 1968). Identificado por decaimento alfa em cascata. Poucas dezenas de átomos por experimento."},
  {numero:106, simbolo:"Sg", nome:"Seabórgio", grupo:6, periodo:7, cat:"Metal de transição", obtencao:"²⁴⁹Cf(¹⁸O,4n)²⁶³Sg (Berkeley, 1974, equipe de Ghiorso et al.) ou ²⁰⁶Pb(⁵⁴Cr,xn)Sg por fusão fria (GSI, 1981). Nomeado após mediação da IUPAC sobre disputa Berkeley-Dubna-GSI."},
  {numero:107, simbolo:"Bh", nome:"Bóhrio", grupo:7, periodo:7, cat:"Metal de transição", obtencao:"²⁰⁹Bi(⁵⁴Cr,n)²⁶²Bh por fusão fria (GSI, 1981). O Bh-267 (t½ ≈ 17 s) foi confirmado por GSI e RIKEN. Síntese: separador de velocidades SHIP (GSI) ou GARIS (RIKEN)."},
  {numero:108, simbolo:"Hs", nome:"Hássio", grupo:8, periodo:7, cat:"Metal de transição", obtencao:"²⁰⁸Pb(⁵⁸Fe,n)²⁶⁵Hs por fusão fria (GSI, 1984). Nomeado em 1997 em homenagem ao estado de Hessen (Alemanha), onde fica o GSI. O HsO₄, análogo ao OsO₄, foi detectado em 2002 por cromatografia de gás quente."},
  {numero:109, simbolo:"Mt", nome:"Meitnério", grupo:9, periodo:7, cat:"Metal de transição", obtencao:"²⁰⁹Bi(⁵⁸Fe,n)²⁶⁶Mt por fusão fria (GSI, 1982). Um único átomo foi detectado. O isótopo mais estável, Mt-278, tem t½ ≈ 4,5 s. Sintetizado em separadores de velocidade tipo SHIP."},
  {numero:110, simbolo:"Ds", nome:"Darmstádtio", grupo:10, periodo:7, cat:"Metal de transição", obtencao:"²⁰⁸Pb(⁶²Ni,n)²⁶⁹Ds por fusão fria (GSI, 1994). Nomeado em 2003 em homenagem a Darmstadt, cidade onde fica o GSI. O Ds-281 (t½ ≈ 12,7 s) é o isótopo mais estável identificado."},
  {numero:111, simbolo:"Rg", nome:"Roentgênio", grupo:11, periodo:7, cat:"Metal de transição", obtencao:"²⁰⁹Bi(⁶⁴Ni,n)²⁷²Rg por fusão fria (GSI, 1994). Confirmado pela IUPAC em 2004. Nomeado em 2004 em homenagem a Wilhelm Röntgen, primeiro ganhador do Nobel de Física (1901). O Rg-282 tem t½ ≈ 100 s."},
  {numero:112, simbolo:"Cn", nome:"Copernício", grupo:12, periodo:7, cat:"Metal de transição", obtencao:"²⁰⁸Pb(⁷⁰Zn,n)²⁷⁷Cn por fusão fria (GSI, 1996). Confirmado pela IUPAC em 2010. Nomeado em homenagem a Nicolau Copérnico. O Cn-285 (t½ ≈ 29 s) é o isótopo mais estável."},
  {numero:113, simbolo:"Nh", nome:"Nihônio", grupo:13, periodo:7, cat:"Metal representativo", obtencao:"²⁰⁹Bi(⁷⁰Zn,n)²⁷⁸Nh por fusão fria (RIKEN, Japão, 2004). A confirmação pela IUPAC em dezembro de 2015 concedeu ao RIKEN o direito de nomeação — primeiro elemento descoberto na Ásia. O Nh-286 tem t½ ≈ 9,5 s."},
  {numero:114, simbolo:"Fl", nome:"Fleróvio", grupo:14, periodo:7, cat:"Metal representativo", obtencao:"²⁴⁴Pu(⁴⁸Ca,3-4n)²⁸⁸⁻²⁸⁹Fl por fusão quente (JINR Dubna + LLNL, 1999–2004). Nomeado em 2012 em homenagem ao Laboratório Flerov de Reações Nucleares (JINR). Isótopo mais estável: Fl-289 (t½ ≈ 1,9 s)."},
  {numero:115, simbolo:"Mc", nome:"Moscóvio", grupo:15, periodo:7, cat:"Metal representativo", obtencao:"²⁴³Am(⁴⁸Ca,3-4n)²⁸⁷⁻²⁸⁸Mc (JINR Dubna + LLNL, 2003). Confirmado pela IUPAC em 2015. Nomeado em 2016 em homenagem à Oblast de Moscou. Isótopo mais estável: Mc-290 (t½ ≈ 0,65 s)."},
  {numero:116, simbolo:"Lv", nome:"Livermório", grupo:16, periodo:7, cat:"Metal representativo", obtencao:"²⁴⁸Cm(⁴⁸Ca,3-4n)²⁹²⁻²⁹³Lv (JINR Dubna + LLNL, 2000). Nomeado em 2012 em homenagem ao Lawrence Livermore National Laboratory (EUA). Isótopo mais estável: Lv-293 (t½ ≈ 57 ms)."},
  {numero:117, simbolo:"Ts", nome:"Tenessino", grupo:17, periodo:7, cat:"Halogênio", obtencao:"²⁴⁹Bk(⁴⁸Ca,3-4n)²⁹³⁻²⁹⁴Ts (JINR Dubna + ORNL/Vanderbilt, 2010). O Bk-249 foi produzido em 250 dias no reator HFIR do ORNL. Confirmado pela IUPAC em 2015. Ts-294 tem t½ ≈ 51 ms."},
  {numero:118, simbolo:"Og", nome:"Oganessônio", grupo:18, periodo:7, cat:"Gás nobre", obtencao:"²⁴⁹Cf(⁴⁸Ca,3n)²⁹⁴Og (JINR Dubna + LLNL, 2002–2005, 3 átomos). Confirmado pela IUPAC em 2015. Nomeado em 2016 em homenagem a Yuri Oganessian, pioneiro da síntese de elementos superpesados. Og-294 tem t½ ≈ 0,89 ms."}
];
const lantanideos = [
  {numero:57, simbolo:"La", nome:"Lantânio", grupo:4, cat:"Lantanídeo", obtencao:"Da bastnasita [(Ce,La,Nd)CO₃F] e monazita [(Ce,La,Nd,Th)PO₄] por digestão ácida ou alcalina. O La³⁺ é separado por troca iônica ou extração líquido-líquido com D2EHPA (ácido di-2-etilexilfosfórico). La metálico por eletrólise de LaF₃/LiF fundidos."},
  {numero:58, simbolo:"Ce", nome:"Cério", grupo:5, cat:"Lantanídeo", obtencao:"O mais abundante dos lantanídeos (~68 ppm na crosta). Obtido da bastnasita por tostação, lixiviação ácida e extração seletiva de Ce⁴⁺ (único lantanídeo estável no estado +4) por oxidação com KMnO₄ e precipitação de Ce(OH)₄."},
  {numero:59, simbolo:"Pr", nome:"Praseodímio", grupo:6, cat:"Lantanídeo", obtencao:"Separado do Ce e Nd por extração líquido-líquido em processo de múltiplos estágios com D2EHPA ou EHEHPA em HNO₃. O Pr metálico é obtido por redução de PrF₃ com Ca ou por eletrólise de PrCl₃/KCl fundidos."},
  {numero:60, simbolo:"Nd", nome:"Neodímio", grupo:7, cat:"Lantanídeo", obtencao:"Da bastnasita e monazita por extração multistágio. O Nd é separado do La, Pr e Sm em colunas de extração líquido-líquido com 2-etilexilfosfato (P507). O Nd metálico é obtido por eletrólise de NdF₃/LiF fundidos a ~1 000 °C."},
  {numero:61, simbolo:"Pm", nome:"Promécio", grupo:8, cat:"Lantanídeo", obtencao:"Produzido em reatores nucleares por fissão de U-235 (rendimento ~2,6%) e pelo decaimento do Nd-147 (captura de nêutron). Separado de outros produtos de fissão por troca iônica em HDEHP/Dowex-50. Sem ocorrência natural prática."},
  {numero:62, simbolo:"Sm", nome:"Samário", grupo:9, cat:"Lantanídeo", obtencao:"Separado das terras raras pesadas da bastnasita/monazita por extração com D2EHPA após remoção dos lantanídeos leves (La, Ce, Pr, Nd). O Sm metálico é obtido por redução de SmO com lantânio ou por eletrólise de SmCl₃/KCl fundidos."},
  {numero:63, simbolo:"Eu", nome:"Európio", grupo:10, cat:"Lantanídeo", obtencao:"Separado seletivamente pelo aproveitamento do estado +2 do Eu (único lantanídeo com +2 estável em solução aquosa): redução com Zn amalgamado em HCl precipita Eu²⁺ como EuSO₄, enquanto os outros lantanídeos permanecem em solução como M³⁺."},
  {numero:64, simbolo:"Gd", nome:"Gadolínio", grupo:11, cat:"Lantanídeo", obtencao:"Separado da fração de terras raras pesadas da bastnasita e de minerais de Gd como gadolinita [Be₂FeY₂Si₂O₁₀] por extração com EHEHPA. O Gd metálico é obtido por redução de GdF₃ com Ca a alta temperatura em vácuo."},
  {numero:65, simbolo:"Tb", nome:"Térbio", grupo:12, cat:"Lantanídeo", obtencao:"Separado junto com as terras raras pesadas (Dy, Ho, Er, Tm, Yb, Lu) da bastnasita/xenotímio por múltiplos estágios de extração. Purificado por aproveitamento da oxidação a Tb⁴⁺ em meio alcalino forte. Produção: ~10 toneladas/ano."},
  {numero:66, simbolo:"Dy", nome:"Disprósio", grupo:13, cat:"Lantanídeo", obtencao:"Obtido principalmente do xenotímio [(Y,Er,Dy,...)PO₄] e da bastnasita por extração em cascata. A separação Dy/Ho é uma das mais difíceis na química das terras raras (raios iônicos quasi-idênticos). China domina ~90% da produção."},
  {numero:67, simbolo:"Ho", nome:"Hólmio", grupo:14, cat:"Lantanídeo", obtencao:"Separado do Dy e Er por extração em colunas de HDEHP sobre sílica ou por troca iônica em resinas quelantes. O Ho metálico é obtido por redução de HoF₃ com Ca em vácuo. Produção mundial: ~10 toneladas/ano."},
  {numero:68, simbolo:"Er", nome:"Érbio", grupo:15, cat:"Lantanídeo", obtencao:"Obtido do xenotímio e de concentrate de terras raras pesadas por extração líquido-líquido com P507 em HCl. Após separação do Ho e Tm, ErCl₃ é precipitado e calcinado a Er₂O₃. Metálico por redução com Ca ou eletrólise de fluoretos fundidos."},
  {numero:69, simbolo:"Tm", nome:"Túlio", grupo:16, cat:"Lantanídeo", obtencao:"Mais raro dos lantanídeos (~0,52 ppm). Separado das frações pesadas de xenotímio e euxênio [Y(Nb,Ti,Ta)O₄] por extração multistágio. O Tm metálico é obtido por redução de TmF₃ com Ca a >1 000 °C em vácuo. Produção: <50 t/ano."},
  {numero:70, simbolo:"Yb", nome:"Itérbio", grupo:17, cat:"Lantanídeo", obtencao:"Separado das terras raras pesadas por extração com P507 em HCl em colunas contínuas de mixer-settler. A separação Yb/Lu é facilitada pela diferença de raio iônico (~3 pm). O Yb metálico é obtido por redução de YbF₃ com Ca."},
  {numero:71, simbolo:"Lu", nome:"Lutécio", grupo:18, cat:"Lantanídeo", obtencao:"Lantanídeo mais pesado, mais caro e mais difícil de separar. Concentra-se no xenotímio (~5%). A separação Lu/Yb exige >100 estágios de extração. O Lu metálico é obtido por redução de LuF₃ com Ca e destilação a vácuo a ~1 400 °C."}
];
const actinideos = [
  {numero:89, simbolo:"Ac", nome:"Actínio", grupo:4, cat:"Actinídeo", obtencao:"Ocorre em traços em minérios de urânio como produto da cadeia de decaimento do U-235 (Ac-227). Produzido em reatores por irradiação de Ra-226 com nêutrons: Ra-226(n,γ)Ra-227 → Ac-227. Separado por extração com TTA ou HDEHP em HNO₃."},
  {numero:90, simbolo:"Th", nome:"Tório", grupo:5, cat:"Actinídeo", obtencao:"Da monazita [(Ce,Th)PO₄] por digestão com NaOH a 140 °C (processo alcalino) ou com H₂SO₄ concentrado. O Th(OH)₄ é precipitado e convertido a ThO₂. O Th metálico é obtido por redução de ThF₄ com Ca a alta temperatura."},
  {numero:91, simbolo:"Pa", nome:"Protactínio", grupo:6, cat:"Actinídeo", obtencao:"Produto intermediário da cadeia de decaimento do U-235 (Pa-231, t½ = 32 760 anos). Em 1961, 125 g de Pa-231 foram isolados de ~60 toneladas de resíduos de refino de urânio pelo UKAEA, Harwell. Separado por extração com TBP em HF/HNO₃."},
  {numero:92, simbolo:"U", nome:"Urânio", grupo:7, cat:"Actinídeo", obtencao:"Da uraninita/pechblenda (UO₂) ou carnotita [K₂(UO₂)₂(VO₄)₂] por lixiviação em H₂SO₄ ou Na₂CO₃. Purificado por extração com TBP em parafina (processo PUREX), precipitado como UO₂(NO₃)₂ e calcinado a UO₃. Reduzido a UF₄ e depois a U com Ca ou Mg."},
  {numero:93, simbolo:"Np", nome:"Netúnio", grupo:8, cat:"Actinídeo", obtencao:"Subproduto de reatores nucleares: U-238(n,γ)U-239 → Np-239 → Pu-239. O Np-237 (t½ = 2,14 × 10⁶ anos) acumula-se no combustível irradiado e é separado no processo PUREX por ajuste de valência e extração seletiva com TBP."},
  {numero:94, simbolo:"Pu", nome:"Plutônio", grupo:9, cat:"Actinídeo", obtencao:"Produzido em reatores: U-238(n,γ)U-239(β⁻)Np-239(β⁻)Pu-239. Separado do U e produtos de fissão pelo processo PUREX (extração com TBP em parafina): o Pu⁴⁺ e U⁶⁺ são co-extraídos, depois o Pu é reduzido a Pu³⁺ e re-extraído seletivamente."},
  {numero:95, simbolo:"Am", nome:"Amerício", grupo:10, cat:"Actinídeo", obtencao:"Produzido em reatores de alta fluxo de nêutrons: Pu-239(n,γ)Pu-240(n,γ)Pu-241(β⁻)Am-241. Separado do Pu por precipitação de Am(OH)₃ ou por extração com HDEHP. O Am-243 é obtido por irradiação prolongada do Am-241."},
  {numero:96, simbolo:"Cm", nome:"Cúrio", grupo:11, cat:"Actinídeo", obtencao:"Produzido em reatores de fluxo ultra-alto: Am-241(n,γ)Am-242m(n,γ)Am-243(n,γ)Cm-244. Separado por extração com HDEHP em HNO₃ (processo TALSPEAK) ou por cromatografia de troca iônica com α-HIBA. Principal isotopo de produção: Cm-244."},
  {numero:97, simbolo:"Bk", nome:"Berquélio", grupo:12, cat:"Actinídeo", obtencao:"Produzido no reator HFIR (Oak Ridge National Laboratory, EUA) por irradiação intensa de Am-243 com nêutrons: Am-243(n,γ)Am-244(β⁻)Cm-244(n,γ)...Bk-249. Ciclo de ~250 dias. Separado por cromatografia de troca iônica. Produção: ~mg/ciclo."},
  {numero:98, simbolo:"Cf", nome:"Califórnio", grupo:13, cat:"Actinídeo", obtencao:"Produzido no HFIR (ORNL) e no reator SM-3 (RIAR, Rússia) por irradiação de Cm-244/245 com nêutrons, seguida de múltiplas capturas. Separado por cromatografia de troca iônica com citrato de amônio. Produção mundial: ~500 μg/ano (Cf-252)."},
  {numero:99, simbolo:"Es", nome:"Einstênio", grupo:14, cat:"Actinídeo", obtencao:"Produzido em quantidade de nanogramas por irradiação de Pu-239 com fluxos de nêutrons muito altos no HFIR (ORNL): requer ~15 capturas de nêutrons sucessivas por U-238. Separado por cromatografia de troca iônica com α-HIBA."},
  {numero:100, simbolo:"Fm", nome:"Férmio", grupo:15, cat:"Actinídeo", obtencao:"Produzido em quantidades de picogramas no HFIR (ORNL) por irradiação de alvos de Es. Também identificado nos detritos de testes nucleares (Ivy Mike, 1952). Separado por cromatografia de troca iônica. Sem aplicações fora da pesquisa básica."},
  {numero:101, simbolo:"Md", nome:"Mendelévio", grupo:16, cat:"Actinídeo", obtencao:"Produzido por bombardeio de Es-253 com partículas α de 41 MeV em cíclotron: ²⁵³Es(α,n)²⁵⁶Md. Primeira síntese (1955): 17 átomos identificados por migração química em resina de troca iônica com α-HIBA."},
  {numero:102, simbolo:"No", nome:"Nobélio", grupo:17, cat:"Actinídeo", obtencao:"Síntese confirmada: ²⁰⁶Pb(⁴⁸Ca,2n)²⁵²No (Dubna, 1966, Flerov et al.) e ²⁴⁸Cm(¹²C,4n)²⁵⁶No (Berkeley). Identificado por migração eletroquímica em cromatografia de troca iônica. O No²⁺ é estável em solução aquosa — anomalia entre actinídeos."},
  {numero:103, simbolo:"Lr", nome:"Laurêncio", grupo:18, cat:"Actinídeo", obtencao:"Síntese original: ²⁵²Cf(¹⁰B,n)²⁵⁸Lr e (¹¹B,2n)²⁵⁸Lr (Berkeley, 1961). Reconfirmado: ²⁵¹Cf(¹¹B,n)²⁵⁸Lr. Identificado por captura de recuo em fita de cobre e detecção alfa. O Lr-266 (t½ = 11 h) é o isótopo mais estável."}
];

/* ==================================================================
   8. RAIO ATOMICO
   RAIO[Z] = { r: valor em pm, t: tipo, f: codigo da fonte }
     t: cov = covalente | vdW = Van der Waals | met = metalico
     f: chave de RAIO_FONTE_LABEL (referencia bibliografica)
   RAIO_MAX_PM e a escala usada nas barras comparativas do modal.
   Esta e a tabela que vai alimentar o futuro filtro por tamanho de raio.
   ================================================================== */
const RAIO = {
  1: {r:31,  t:'cov', f:'P09'},
  2: {r:140, t:'vdW', f:'Alv13'},
  3: {r:128, t:'cov', f:'C08'},
  4: {r:96,  t:'cov', f:'C08'},
  5: {r:84,  t:'cov', f:'C08'},
  6: {r:77,  t:'cov', f:'C08'},
  7: {r:71,  t:'cov', f:'C08'},
  8: {r:66,  t:'cov', f:'C08'},
  9: {r:64,  t:'cov', f:'C08'},
  10:{r:154, t:'vdW', f:'Alv13'},
  11:{r:166, t:'cov', f:'C08'},
  12:{r:141, t:'cov', f:'C08'},
  13:{r:121, t:'cov', f:'C08'},
  14:{r:111, t:'cov', f:'C08'},
  15:{r:107, t:'cov', f:'C08'},
  16:{r:105, t:'cov', f:'C08'},
  17:{r:102, t:'cov', f:'C08'},
  18:{r:188, t:'vdW', f:'Alv13'},
  19:{r:203, t:'cov', f:'C08'},
  20:{r:176, t:'cov', f:'C08'},
  21:{r:170, t:'cov', f:'C08'},
  22:{r:160, t:'cov', f:'C08'},
  23:{r:153, t:'cov', f:'C08'},
  24:{r:139, t:'cov', f:'C08'},
  25:{r:139, t:'cov', f:'C08'},
  26:{r:132, t:'cov', f:'C08'},
  27:{r:126, t:'cov', f:'C08'},
  28:{r:124, t:'cov', f:'C08'},
  29:{r:132, t:'cov', f:'C08'},
  30:{r:122, t:'cov', f:'C08'},
  31:{r:122, t:'cov', f:'C08'},
  32:{r:120, t:'cov', f:'C08'},
  33:{r:119, t:'cov', f:'C08'},
  34:{r:120, t:'cov', f:'C08'},
  35:{r:120, t:'cov', f:'C08'},
  36:{r:202, t:'vdW', f:'Alv13'},
  37:{r:220, t:'cov', f:'C08'},
  38:{r:195, t:'cov', f:'C08'},
  39:{r:190, t:'cov', f:'C08'},
  40:{r:175, t:'cov', f:'C08'},
  41:{r:164, t:'cov', f:'C08'},
  42:{r:154, t:'cov', f:'C08'},
  43:{r:147, t:'cov', f:'C08'},
  44:{r:146, t:'cov', f:'C08'},
  45:{r:142, t:'cov', f:'C08'},
  46:{r:139, t:'cov', f:'C08'},
  47:{r:145, t:'cov', f:'C08'},
  48:{r:144, t:'cov', f:'C08'},
  49:{r:142, t:'cov', f:'C08'},
  50:{r:139, t:'cov', f:'C08'},
  51:{r:139, t:'cov', f:'C08'},
  52:{r:138, t:'cov', f:'C08'},
  53:{r:139, t:'cov', f:'C08'},
  54:{r:216, t:'vdW', f:'Alv13'},
  55:{r:244, t:'cov', f:'C08'},
  56:{r:215, t:'cov', f:'C08'},
  57:{r:207, t:'cov', f:'C08'},
  58:{r:204, t:'cov', f:'C08'},
  59:{r:203, t:'cov', f:'C08'},
  60:{r:201, t:'cov', f:'C08'},
  61:{r:199, t:'cov', f:'C08'},
  62:{r:198, t:'cov', f:'C08'},
  63:{r:198, t:'cov', f:'C08'},
  64:{r:196, t:'cov', f:'C08'},
  65:{r:194, t:'cov', f:'C08'},
  66:{r:192, t:'cov', f:'C08'},
  67:{r:192, t:'cov', f:'C08'},
  68:{r:189, t:'cov', f:'C08'},
  69:{r:190, t:'cov', f:'C08'},
  70:{r:187, t:'cov', f:'C08'},
  71:{r:187, t:'cov', f:'C08'},
  72:{r:175, t:'cov', f:'C08'},
  73:{r:170, t:'cov', f:'C08'},
  74:{r:162, t:'cov', f:'C08'},
  75:{r:151, t:'cov', f:'C08'},
  76:{r:144, t:'cov', f:'C08'},
  77:{r:141, t:'cov', f:'C08'},
  78:{r:136, t:'cov', f:'C08'},
  79:{r:136, t:'cov', f:'C08'},
  80:{r:132, t:'cov', f:'C08'},
  81:{r:145, t:'cov', f:'C08'},
  82:{r:146, t:'cov', f:'C08'},
  83:{r:148, t:'cov', f:'C08'},
  84:{r:140, t:'cov', f:'C08'},
  85:{r:150, t:'cov', f:'C08'},
  86:{r:220, t:'vdW', f:'Alv13'},
  87:{r:260, t:'cov', f:'P09'},
  88:{r:221, t:'cov', f:'P09'},
  89:{r:215, t:'cov', f:'P09'},
  90:{r:206, t:'cov', f:'P09'},
  91:{r:200, t:'cov', f:'P09'},
  92:{r:196, t:'cov', f:'P09'},
  93:{r:190, t:'cov', f:'P09'},
  94:{r:187, t:'cov', f:'P09'},
  95:{r:180, t:'cov', f:'P09'},
  96:{r:169, t:'cov', f:'C08'},
  97:{r:168, t:'cov', f:'P09'},
  98:{r:168, t:'cov', f:'P09'},
  99:{r:165, t:'cov', f:'P09'},
  100:{r:167,t:'cov', f:'P09'},
  101:{r:173,t:'cov', f:'P09'},
  102:{r:176,t:'cov', f:'P09'},
  103:{r:161,t:'cov', f:'P09'},
  104:{r:157,t:'cov', f:'P09'},
  105:{r:149,t:'cov', f:'P09'},
  106:{r:143,t:'cov', f:'P09'},
  107:{r:141,t:'cov', f:'P09'},
  108:{r:134,t:'cov', f:'P09'},
  109:{r:129,t:'cov', f:'P09'},
  110:{r:128,t:'cov', f:'P09'},
  111:{r:121,t:'cov', f:'P09'},
  112:{r:122,t:'cov', f:'P09'},
  113:{r:136,t:'cov', f:'P09'},
  114:{r:143,t:'cov', f:'P09'},
  115:{r:162,t:'cov', f:'P09'},
  116:{r:175,t:'cov', f:'P09'},
  117:{r:165,t:'cov', f:'P09'},
  118:{r:157,t:'cov', f:'P09'}
};
const RAIO_MAX_PM = 260;
const RAIO_TIPO_LABEL = {
  cov: 'Covalente (ligação simples)',
  vdW: 'Van der Waals',
  met: 'Metálico'
};
const RAIO_TIPO_DEF = {
  cov: 'Metade da distância internuclear entre dois átomos idênticos unidos por ligação covalente simples σ. É a medida preferida pela IUPAC para comparações periódicas.',
  vdW: 'Metade da distância mínima entre núcleos de dois átomos do mesmo elemento sem interação covalente ou metálica. Aplicado a gases nobres e moléculas sem ligação.',
  met: 'Metade da distância entre centros de átomos adjacentes na rede cristalina metálica.'
};
const RAIO_FONTE_LABEL = {
  C08:   'Cordero et al., Dalton Trans. 2008, 2832–2838',
  P09:   'Pyykkö & Atsumi, Chem. Eur. J. 15 (2009) 186–197',
  Alv13: 'Alvarez, Dalton Trans. 42 (2013) 8617–8636'
};

/* ==================================================================
   9. BLOCO DA TABELA PERIODICA (s / p / d / f)
   ------------------------------------------------------------------
   BLOCO[Z] = "S" | "P" | "D" | "F"

   POR QUE ESTA TABELA EXISTE
   Havia como deduzir o bloco em tempo de execucao com
   ultimoSubnivel(), mas essa funcao devolve o subnivel MAIS EXTERNO
   (a camada de valencia), nao o subnivel DIFERENCIADOR. Para o ferro
   ela devolve 4s, nao 3d. Como todo metal de transicao, lantanideo e
   actinideo termina em ns2, deduzir o bloco por ali daria 80
   elementos no bloco s (68 por cento), 37 no p, 1 no d (so o Pd) e
   ZERO no f — a cor perderia qualquer valor informativo.

   Com a tabela explicita: s=14, p=36, d=38, f=30 (soma 118), que e a
   classificacao real e reproduz o formato da tabela periodica.

   REGRA USADA PARA MONTAR (util se precisar conferir):
     S .. grupos 1 e 2, mais o He (grupo 18, porem 1s2)
     D .. grupos 3 a 12
     P .. grupos 13 a 18, exceto o He
     F .. as duas series (lantanideos e actinideos), 15 + 15

   Lu e Lr aparecem aqui como F, seguindo a convencao adotada no
   ensino medio brasileiro de tratar as duas series inteiras como
   bloco f. Se um dia quiser a convencao que os coloca no bloco d,
   basta trocar 71 e 103 para "D" nesta tabela — nada no
   scriptsitp.js precisa mudar.

   QUEM LE ESTA TABELA (via corBlocoDe() no scriptsitp.js)
     - circulo do raio no card (modo raio atomico)
     - circulo do raio no modal
     - esferas de comparacao das vistas "Grade" e tela cheia
   Os quatro usam a mesma fonte, entao nao ha como dessincronizar.
   ================================================================== */
const BLOCO = {
  1:"S", 2:"S", 3:"S", 4:"S", 5:"P", 6:"P", 7:"P", 8:"P", 9:"P", 10:"P",   // H He Li Be B C N O F Ne
  11:"S", 12:"S", 13:"P", 14:"P", 15:"P", 16:"P", 17:"P", 18:"P", 19:"S", 20:"S",   // Na Mg Al Si P S Cl Ar K Ca
  21:"D", 22:"D", 23:"D", 24:"D", 25:"D", 26:"D", 27:"D", 28:"D", 29:"D", 30:"D",   // Sc Ti V Cr Mn Fe Co Ni Cu Zn
  31:"P", 32:"P", 33:"P", 34:"P", 35:"P", 36:"P", 37:"S", 38:"S", 39:"D", 40:"D",   // Ga Ge As Se Br Kr Rb Sr Y Zr
  41:"D", 42:"D", 43:"D", 44:"D", 45:"D", 46:"D", 47:"D", 48:"D", 49:"P", 50:"P",   // Nb Mo Tc Ru Rh Pd Ag Cd In Sn
  51:"P", 52:"P", 53:"P", 54:"P", 55:"S", 56:"S", 57:"F", 58:"F", 59:"F", 60:"F",   // Sb Te I Xe Cs Ba La Ce Pr Nd
  61:"F", 62:"F", 63:"F", 64:"F", 65:"F", 66:"F", 67:"F", 68:"F", 69:"F", 70:"F",   // Pm Sm Eu Gd Tb Dy Ho Er Tm Yb
  71:"F", 72:"D", 73:"D", 74:"D", 75:"D", 76:"D", 77:"D", 78:"D", 79:"D", 80:"D",   // Lu Hf Ta W Re Os Ir Pt Au Hg
  81:"P", 82:"P", 83:"P", 84:"P", 85:"P", 86:"P", 87:"S", 88:"S", 89:"F", 90:"F",   // Tl Pb Bi Po At Rn Fr Ra Ac Th
  91:"F", 92:"F", 93:"F", 94:"F", 95:"F", 96:"F", 97:"F", 98:"F", 99:"F", 100:"F",   // Pa U Np Pu Am Cm Bk Cf Es Fm
  101:"F", 102:"F", 103:"F", 104:"D", 105:"D", 106:"D", 107:"D", 108:"D", 109:"D", 110:"D",   // Md No Lr Rf Db Sg Bh Hs Mt Ds
  111:"D", 112:"D", 113:"P", 114:"P", 115:"P", 116:"P", 117:"P", 118:"P"   // Rg Cn Nh Fl Mc Lv Ts Og
};

/* ==================================================================
   10. ELETRONEGATIVIDADE (escala de Pauling)
   ------------------------------------------------------------------
   ELETRONEGATIVIDADE[Z] = numero adimensional, ou null se nao houver
   valor publicado. NUNCA use 0 para "sem valor": o zero seria lido
   como medida real e esmagaria a escala do filtro.

   COBERTURA: 97 elementos com valor, 21 sem.
   Sem valor: He, Ne, Ar (gases nobres leves, nao formam ligacao
   suficiente para o metodo termoquimico); Pm, Eu, Yb (sem fonte
   confiavel, ver nota abaixo); e os 15 elementos do 104 ao 118
   (sinteticos, sem dado experimental de energia de ligacao).

   ── DE ONDE VEIO ─────────────────────────────────────────────────
   ATENCAO a um ponto que costuma ser mal entendido: a IUPAC NAO
   publica uma tabela oficial de eletronegatividade. O Gold Book
   (verbete E01990) define o conceito e a formula de Pauling, mas nao
   traz valores. Nao existe "valor IUPAC" para citar. A NIST tambem
   nao publica essa propriedade — ela cobre massas atomicas, isotopos
   e espectros, nao eletronegatividade.

   O que existe é a escala de Pauling na revisao de Allred (1961),
   compilada em handbooks. Esta tabela usa esse conjunto:
     - A. L. Allred, J. Inorg. Nucl. Chem. 17, 215-221 (1961)
       "Electronegativity values from thermochemical data"
     - L. Pauling, The Nature of the Chemical Bond, 3a ed. (1960)
     - CRC Handbook of Chemistry and Physics, secao 9
     - Allen & Huheey, J. Inorg. Nucl. Chem. 42, 1523 (1980)
       — unica fonte dos gases nobres Kr, Xe e Rn

   Os valores foram conferidos em tres compilacoes independentes
   (CRC/Wikipedia data page, KnowledgeDoor com citacao por valor, e
   RoyMech) e validados por tendencia periodica: o maior valor cai no
   Fluor (3,98), o menor no Francio (0,70), os periodos 2 e 3 crescem
   da esquerda para a direita, e os grupos 1 e 17 decrescem de cima
   para baixo.

   ── TRES DIVERGENCIAS ENTRE AS FONTES (decisao documentada) ───────
   Onde as fontes discordam, o valor escolhido esta abaixo e a
   alternativa fica registrada. Para trocar, basta editar o numero
   aqui — nada no scriptsitp.js depende da escolha.

   1) Tl (81) = 1,62 e Pb (82) = 1,87
      Esses dois elementos tem valor diferente por estado de oxidacao:
      Tl(I)=1,62 / Tl(III)=2,04 e Pb(II)=1,87 / Pb(IV)=2,33. Muitos
      posteres usam os valores altos (2,04 e 2,33). Foram adotados os
      baixos por dois motivos: e o conjunto do CRC, e produz tendencia
      monotonica no periodo 6 (Tl 1,62 < Pb 1,87 < Bi 2,02), boa para
      ensinar. Com Pb=2,33 aparece um pico anomalo, que a propria
      literatura atribui a artefato de selecao de dados.

   2) Kr (36) = 3,00, Xe (54) = 2,60, Rn (86) = 2,20
      Nao vem de Allred e sim de Allen & Huheey (1980). Varias
      compilacoes deixam os tres em branco. Ficaram preenchidos porque
      sao valores publicados e mostram um fato interessante: gas nobre
      pesado forma ligacao e tem eletronegatividade alta. He, Ne e Ar
      seguem sem valor.

   3) Fr (87) = 0,70
      Valor de Pauling (1960), anterior aos calculos relativisticos.
      Hoje se sabe que o Francio provavelmente NAO e o menos
      eletronegativo — o Cesio (0,79) deve ser menor. O 0,70 foi
      mantido por ser o unico numero publicado, mas vale como
      curiosidade em sala: e um dado que a teoria ja superou.
   ================================================================== */
const ELETRONEGATIVIDADE = {
  1:2.20, 2:null, 3:0.98, 4:1.57, 5:2.04, 6:2.55, 7:3.04, 8:3.44, 9:3.98, 10:null,   // H He Li Be B C N O F Ne
  11:0.93, 12:1.31, 13:1.61, 14:1.90, 15:2.19, 16:2.58, 17:3.16, 18:null, 19:0.82, 20:1.00,   // Na Mg Al Si P S Cl Ar K Ca
  21:1.36, 22:1.54, 23:1.63, 24:1.66, 25:1.55, 26:1.83, 27:1.88, 28:1.91, 29:1.90, 30:1.65,   // Sc Ti V Cr Mn Fe Co Ni Cu Zn
  31:1.81, 32:2.01, 33:2.18, 34:2.55, 35:2.96, 36:3.00, 37:0.82, 38:0.95, 39:1.22, 40:1.33,   // Ga Ge As Se Br Kr Rb Sr Y Zr
  41:1.60, 42:2.16, 43:1.90, 44:2.20, 45:2.28, 46:2.20, 47:1.93, 48:1.69, 49:1.78, 50:1.96,   // Nb Mo Tc Ru Rh Pd Ag Cd In Sn
  51:2.05, 52:2.10, 53:2.66, 54:2.60, 55:0.79, 56:0.89, 57:1.10, 58:1.12, 59:1.13, 60:1.14,   // Sb Te I Xe Cs Ba La Ce Pr Nd
  61:null, 62:1.17, 63:null, 64:1.20, 65:1.21, 66:1.22, 67:1.23, 68:1.24, 69:1.25, 70:null,   // Pm Sm Eu Gd Tb Dy Ho Er Tm Yb
  71:1.27, 72:1.30, 73:1.50, 74:2.36, 75:1.90, 76:2.20, 77:2.20, 78:2.28, 79:2.54, 80:2.00,   // Lu Hf Ta W Re Os Ir Pt Au Hg
  81:1.62, 82:1.87, 83:2.02, 84:2.00, 85:2.20, 86:2.20, 87:0.70, 88:0.90, 89:1.10, 90:1.30,   // Tl Pb Bi Po At Rn Fr Ra Ac Th
  91:1.50, 92:1.38, 93:1.36, 94:1.28, 95:1.30, 96:1.28, 97:1.30, 98:1.30, 99:1.30, 100:1.30,   // Pa U Np Pu Am Cm Bk Cf Es Fm
  101:1.30, 102:1.30, 103:1.30, 104:null, 105:null, 106:null, 107:null, 108:null, 109:null, 110:null,   // Md No Lr Rf Db Sg Bh Hs Mt Ds
  111:null, 112:null, 113:null, 114:null, 115:null, 116:null, 117:null, 118:null   // Rg Cn Nh Fl Mc Lv Ts Og
};

/* Faixas didaticas para o filtro. A REGRA mora aqui, nao no
   scriptsitp.js: se um dia o corte mudar, muda-se em um lugar so.
   Intervalo semiaberto [min, max): um valor entra na faixa se
   min <= x < max. Distribuicao atual dos 97 valores:
   baixa 26 | media-baixa 32 | media-alta 27 | alta 12 */
const FAIXAS_EN = [
  { id:'baixa',  label:'Baixa (< 1,30)',        curto:'< 1,30',      min:0.00, max:1.30 },
  { id:'mbaixa', label:'Média-baixa (1,30-1,90)', curto:'1,30-1,90', min:1.30, max:1.90 },
  { id:'malta',  label:'Média-alta (1,90-2,50)',  curto:'1,90-2,50', min:1.90, max:2.50 },
  { id:'alta',   label:'Alta (>= 2,50)',        curto:'>= 2,50',     min:2.50, max:4.01 }
];
const EN_MIN = 0.70;   // Fr — piso da escala de cor
const EN_MAX = 3.98;   // F  — teto da escala de cor

/* ── ESCALAS DE COR DO MAPA DE CALOR (genericas) ─────────────────────────────────
   Paradas de cor interpoladas por corEN() no scriptsitp.js. p vai de
   0 (= EN_MIN, o Francio) a 1 (= EN_MAX, o Fluor).

   POR QUE EXISTEM DUAS ESCALAS
   A colorida e a leitura intuitiva de mapa de calor: frio embaixo,
   quente em cima. Mas ela usa verde em 0,55 e vermelho em 1,00, e
   quem tem protanopia ou deuteranopia confunde exatamente esse par.
   Entao, quando o simulador esta em modo daltonico ou alto contraste,
   entra a ESCALA_CALOR_MONO: uma rampa de um unico tom em que muda so a
   LUMINOSIDADE (escuro = baixo, claro = alto). Rampa de luminosidade
   e legivel com qualquer tipo de visao de cor, porque a ordem nao
   depende de distinguir matizes.

   De qualquer forma o valor numerico aparece impresso em todo card,
   entao a cor e reforco visual, nunca a unica via de informacao.

   Sao GENERICAS: qualquer propriedade com visual "mapa" as referencia.
   O nome era ESCALA_EN quando so a eletronegatividade as usava. */
const ESCALA_CALOR = [
  { p:0.00, hex:'#2c3e8f' },   // azul escuro   — menos eletronegativo
  { p:0.30, hex:'#2b8cb0' },   // azul-ciano
  { p:0.55, hex:'#41b06e' },   // verde
  { p:0.78, hex:'#e8b13c' },   // amarelo
  { p:1.00, hex:'#e0492f' }    // vermelho      — mais eletronegativo
];
const ESCALA_CALOR_MONO = [
  { p:0.00, hex:'#14203a' },
  { p:0.35, hex:'#2f5c93' },
  { p:0.70, hex:'#7aa8d8' },
  { p:1.00, hex:'#dce9f7' }
];

/* ==================================================================
   11. ENERGIA DE IONIZACAO (1a), em eV
   ------------------------------------------------------------------
   ENERGIA_IONIZACAO[Z] = energia minima para arrancar o eletron mais
   externo do atomo neutro, em eletron-volt. null se nao houver medida.

   COBERTURA: 104 com valor, 14 sem (Z = 105 a 118).

   ── AQUI A NIST E FONTE OFICIAL DE VERDADE ───────────────────────
   Diferente da eletronegatividade, que nao tem tabela oficial de
   ninguem, esta propriedade tem: NIST Standard Reference Database 111,
   "Ground Levels and Ionization Energies for the Neutral Atoms"
   (Martin, Musgrove, Kotochigova, Sansonetti), hoje servida pela
   Atomic Spectra Database. Sao valores ESPECTROSCOPICOS medidos, com
   incerteza publicada — nao estimativas.
   A NIST cobre Z = 1 a 104. Acima disso existem apenas previsoes
   teoricas (Fricke 1975; Hoffman, Lee e Pershina 2006), que ficaram
   como null por nao serem medida experimental.

   ── UNIDADE: POR QUE eV E NAO kJ/mol ─────────────────────────────
   O eV e a grandeza que a NIST publica. Converter para kJ/mol
   (multiplicar por 96,485) daria um numero derivado, com arredondamento
   meu por cima do arredondamento da fonte. O card mostra eV, e o card
   do modal mostra as duas unidades — a conversao ali e conteudo de
   aula, nao detalhe tecnico.

   ── COMO OS VALORES FORAM CONFERIDOS ─────────────────────────────
   Tres fontes independentes cruzadas. Duas divergencias reais foram
   resolvidas, e vale registrar:
   1) Uma das fontes usava valores ANTIGOS para os metais 5d e para
      Fr e Th (Ta 7,89 em vez de 7,5496; Fr 3,90 em vez de 4,0727;
      Th 6,08 em vez de 6,3067; Os 8,70 em vez de 8,4382). Ficaram os
      atuais da NIST, confirmados pelas outras duas.
   2) A fonte de maior precisao tinha Co e Ni TROCADOS de lugar. As
      outras duas concordam que Co(27) = 7,88 e Ni(28) = 7,64, e essa
      e a atribuicao usada aqui.
   Alem disso, a tabela foi validada por tendencia periodica: o maior
   valor cai no He, o menor no Cs, grupos 1 e 18 decrescem de cima para
   baixo, e as QUATRO anomalias classicas aparecem (B < Be, O < N,
   Al < Mg, S < P). Se um valor estivesse no Z errado, alguma dessas
   checagens quebraria.

   ── POR QUE O MAPA DE CALOR SE INVERTE ───────────────────────────
   Ionizacao e anticorrelacionada com o raio: atomo pequeno segura o
   eletron com mais forca. Entao o mapa fica quente onde o do raio
   ficaria frio. Isso e o conteudo aparecendo na tela, nao um bug — e
   um bom exercicio: ligar os dois modos em sequencia e comparar.
   ================================================================== */
const ENERGIA_IONIZACAO = {
  1:13.59844, 2:24.58741, 3:5.39172, 4:9.3227, 5:8.29803, 6:11.2603,   // H He Li Be B C
  7:14.53414, 8:13.61806, 9:17.42282, 10:21.5646, 11:5.13908, 12:7.64624,   // N O F Ne Na Mg
  13:5.98577, 14:8.15169, 15:10.48669, 16:10.36001, 17:12.96764, 18:15.75962,   // Al Si P S Cl Ar
  19:4.34066, 20:6.11316, 21:6.5615, 22:6.8281, 23:6.7462, 24:6.7665,   // K Ca Sc Ti V Cr
  25:7.43402, 26:7.9024, 27:7.881, 28:7.6398, 29:7.72638, 30:9.3942,   // Mn Fe Co Ni Cu Zn
  31:5.9993, 32:7.8994, 33:9.7886, 34:9.75238, 35:11.81381, 36:13.99961,   // Ga Ge As Se Br Kr
  37:4.17713, 38:5.6949, 39:6.2171, 40:6.6339, 41:6.75885, 42:7.09243,   // Rb Sr Y Zr Nb Mo
  43:7.28, 44:7.3605, 45:7.4589, 46:8.3369, 47:7.5762, 48:8.9938,   // Tc Ru Rh Pd Ag Cd
  49:5.78636, 50:7.3439, 51:8.6084, 52:9.0096, 53:10.45126, 54:12.1298,   // In Sn Sb Te I Xe
  55:3.8939, 56:5.2117, 57:5.5769, 58:5.5387, 59:5.473, 60:5.525,   // Cs Ba La Ce Pr Nd
  61:5.582, 62:5.6436, 63:5.6704, 64:6.1501, 65:5.8638, 66:5.9389,   // Pm Sm Eu Gd Tb Dy
  67:6.0215, 68:6.1077, 69:6.18431, 70:6.25416, 71:5.4259, 72:6.82507,   // Ho Er Tm Yb Lu Hf
  73:7.5496, 74:7.864, 75:7.8335, 76:8.4382, 77:8.967, 78:8.9587,   // Ta W Re Os Ir Pt
  79:9.2255, 80:10.4375, 81:6.1082, 82:7.41666, 83:7.2856, 84:8.417,   // Au Hg Tl Pb Bi Po
  85:9.31751, 86:10.7485, 87:4.0727, 88:5.2784, 89:5.17, 90:6.3067,   // At Rn Fr Ra Ac Th
  91:5.89, 92:6.19405, 93:6.2657, 94:6.0262, 95:5.9738, 96:5.9915,   // Pa U Np Pu Am Cm
  97:6.1979, 98:6.2817, 99:6.42, 100:6.5, 101:6.58, 102:6.65,   // Bk Cf Es Fm Md No
  103:4.9, 104:6.0, 105:null, 106:null, 107:null, 108:null,   // Lr Rf Db Sg Bh Hs
  109:null, 110:null, 111:null, 112:null, 113:null, 114:null,   // Mt Ds Rg Cn Nh Fl
  115:null, 116:null, 117:null, 118:null   // Mc Lv Ts Og
};
const EI_MIN = 3.8939;    // Cs — piso da escala de cor
const EI_MAX = 24.58741;  // He — teto da escala de cor
const EV_PARA_KJ_MOL = 96.485;   // fator de conversao (CODATA)

/* Faixas didaticas. Cortes escolhidos nas quebras naturais da tabela:
   alcalinos e alcalino-terrosos abaixo de 7; a maior parte dos metais
   entre 7 e 10; nao-metais entre 10 e 15; gases nobres leves acima. */
const FAIXAS_EI = [
  { id:'baixa',  label:'Baixa (< 7 eV)',        curto:'< 7',     min:0,  max:7 },
  { id:'media',  label:'Média (7 a 10 eV)',     curto:'7-10',    min:7,  max:10 },
  { id:'alta',   label:'Alta (10 a 15 eV)',     curto:'10-15',   min:10, max:15 },
  { id:'mualta', label:'Muito alta (> 15 eV)',  curto:'> 15',    min:15, max:30 }
];

/* ==================================================================
   12. REGISTRO DE PROPRIEDADES  (dirige os modos de exibicao)
   ------------------------------------------------------------------
   Cada entrada aqui gera, sozinha: um botao no cabecalho, o valor
   impresso no card, o desenho ou o mapa de calor, os anuncios do leitor
   de tela e o acrescimo ao rotulo acessivel.
   Acrescentar uma propriedade nova = acrescentar uma entrada nesta
   lista. NAO se escreve JavaScript nem CSS novo.

   Antes desta refatoracao havia toggleModoRaio() e toggleModoEN() como
   funcoes irmas quase identicas, mais dois blocos de CSS quase iguais.
   Com seis propriedades isso viraria seis copias de cada.

   CAMPOS (todos declarativos — este arquivo nao tem logica)
     id ......... identificador curto; vira o valor de data-modo
     label ...... nome exibido no tooltip e no rotulo do botao
     tabela ..... REFERENCIA a tabela de dados (nao string: em script
                  classico, const de topo nao vira propriedade de
                  window, entao busca por nome nao funcionaria)
     campo ...... propriedade a ler dentro do objeto da tabela, ou null
                  quando o valor da tabela JA e o numero
                  (RAIO[Z] = {r,t,f} -> campo 'r';
                   ELETRONEGATIVIDADE[Z] = 1.83 -> campo null)
     unidade .... sufixo impresso depois do numero ('' se nao tem)
     decimais ... casas decimais na impressao (virgula, pt-BR)
     visual ..... 'circulo' = desenho proporcional no lugar do simbolo
                  'mapa'    = tonaliza o fundo do card
     vmin/vmax .. limites da escala. Para 'circulo' definem o tamanho;
                  para 'mapa', a posicao na rampa de cor
     corBloco ... true = o desenho usa a cor do bloco s/p/d/f
     escala /
     escalaMono . rampas de cor do 'mapa'. A segunda entra em modo
                  daltonico e alto contraste (rampa de luminosidade)
     icone ...... chave em ICO (scriptsitp.js), onde moram os SVG
     ligado /
     desligado .. texto anunciado ao leitor de tela na troca
     semDado .... texto acrescentado ao rotulo quando falta o valor
   ================================================================== */
const PROPRIEDADES = [
  {
    id: 'raio',
    label: 'Raio atômico',
    tabela: RAIO,
    campo: 'r',
    unidade: ' pm',
    decimais: 0,
    visual: 'circulo',
    vmin: 0,
    vmax: RAIO_MAX_PM,
    corBloco: true,
    // segundo campo levado ao rótulo acessível: o tipo de raio (covalente,
    // Van der Waals, metálico). Não aparece na tela, mas é anunciado.
    campoExtra: 't',
    tabelaExtra: RAIO_TIPO_LABEL,
    icone: 'raio',
    titulo: 'Modo raio atômico — troca o símbolo pelo desenho do raio em escala',
    ligado: 'Modo raio atômico ligado. O símbolo de cada card deu lugar ao desenho do raio em escala, e a massa atômica ao valor em picômetros. A cor indica o bloco: s, p, d ou f.',
    desligado: 'Modo raio atômico desligado. Os cards voltaram a mostrar símbolo e massa atômica.',
    a11yValor: 'raio @ picômetros',
    semDado: 'raio sem dado publicado',
    // o raio ja tem secao propria no modal (com vistas e tela cheia),
    // entao nao gera o card generico
    cardModal: false
  },
  {
    id: 'en',
    label: 'Eletronegatividade',
    tabela: ELETRONEGATIVIDADE,
    campo: null,
    unidade: '',
    decimais: 2,
    visual: 'mapa',
    vmin: EN_MIN,
    vmax: EN_MAX,
    escala: ESCALA_CALOR,
    escalaMono: ESCALA_CALOR_MONO,
    icone: 'en',
    titulo: 'Modo eletronegatividade — mapa de calor pela escala de Pauling; a massa atômica dá lugar ao valor',
    ligado: 'Modo eletronegatividade ligado. Cada card foi tingido conforme a escala de Pauling: tons frios para os menos eletronegativos, quentes para os mais. A massa atômica deu lugar ao valor. Vinte e um elementos não têm dado publicado e aparecem em cinza com um traço.',
    desligado: 'Modo eletronegatividade desligado. Os cards voltaram às cores de categoria e à massa atômica.',
    a11yValor: 'eletronegatividade @ na escala de Pauling',
    semDado: 'eletronegatividade sem dado publicado',
    cardModal: true,
    unidadeLonga: 'na escala de Pauling',
    faixas: FAIXAS_EN,
    fonte: 'Pauling (1960), revisão de Allred (1961)',
    semDadoTitulo: 'Sem valor publicado na escala de Pauling.',
    semDadoMotivos: [
      { zs:[2,10,18], texto:'Gases nobres leves não formam ligações em número suficiente para o método termoquímico de Pauling.' },
      { zs:[61,63,70], texto:'Não há fonte confiável para este elemento; a literatura só indica a faixa aproximada de 1,1 a 1,2.' }
    ],
    semDadoPadrao: 'Elemento sintético sem medida experimental de energia de ligação.'
  },
  {
    id: 'ei',
    label: 'Energia de ionização',
    tabela: ENERGIA_IONIZACAO,
    campo: null,
    unidade: ' eV',
    decimais: 2,
    visual: 'mapa',
    vmin: EI_MIN,
    vmax: EI_MAX,
    escala: ESCALA_CALOR,
    escalaMono: ESCALA_CALOR_MONO,
    icone: 'ionizacao',
    titulo: 'Modo energia de ionização — mapa de calor da 1ª energia de ionização; a massa atômica dá lugar ao valor em eV',
    ligado: 'Modo energia de ionização ligado. Cada card foi tingido conforme a primeira energia de ionização: tons frios para os elementos que perdem elétron com facilidade, quentes para os que seguram o elétron com mais força. A massa atômica deu lugar ao valor em elétron-volt. Catorze elementos sintéticos não têm medida e aparecem em cinza com um traço.',
    desligado: 'Modo energia de ionização desligado. Os cards voltaram às cores de categoria e à massa atômica.',
    a11yValor: 'energia de ionização @ elétron-volt',
    semDado: 'energia de ionização sem medida experimental',
    cardModal: true,
    unidadeLonga: 'elétron-volt (eV)',
    faixas: FAIXAS_EI,
    fonte: 'NIST SRD 111 — Ground Levels and Ionization Energies for the Neutral Atoms',
    // conversao mostrada no card do modal: e conteudo de aula
    fatorAlt: EV_PARA_KJ_MOL,
    unidadeAlt: 'kJ/mol',
    semDadoTitulo: 'Sem medida experimental publicada.',
    semDadoMotivos: [],
    semDadoPadrao: 'A NIST cobre até o elemento 104. Deste ponto em diante existem apenas previsões teóricas, não medidas espectroscópicas.'
  }
];

/* ==================================================================
   13. PONTO DE FUSAO E DE EBULICAO, em graus Celsius
   ------------------------------------------------------------------
   FUSAO[Z] / EBULICAO[Z] = temperatura em C a 1 atm, ou null quando
   nao existe valor publicado.
   COBERTURA: fusao 102 de 118 | ebulicao 94 de 118.

   ── PARA QUE SERVEM ──────────────────────────────────────────────
   ESTADO[Z] e fixo: o estado a 25 C. Com estes dois pontos o estado
   passa a ser CALCULADO por estadoNaTemperatura(), e a tabela ganha um
   controle de temperatura: o aluno arrasta e ve os 118 elementos
   mudando de estado. O mercurio solidifica a -39, o cesio derrete a
   28, o nitrogenio liquefaz a -196, o tungstenio so ferve a 5555.

   ── FONTE ────────────────────────────────────────────────────────
   Wolfram ElementData (Mathematica), compilacao curada, via
   periodictable.com. As duas propriedades vem da MESMA compilacao de
   proposito: misturar fontes produziria pares incoerentes (fusao de um
   lugar, ebulicao de outro, com um elemento "fervendo" abaixo do
   proprio ponto de fusao).
   Isso importa porque as compilacoes divergem bastante nos refratarios
   — a ebulicao do berilio aparece como 2470 C em umas e 2970 C em
   outras, a do boro como 4000 ou 2550. Nao e erro de ninguem: sao
   medidas dificeis, com faixas de incerteza largas.

   ── VALIDACAO ────────────────────────────────────────────────────
   Cruzamento decisivo: o estado calculado a 25 C tem de bater com a
   tabela ESTADO, que veio de outra fonte (IUPAC). Bate em 118 de 118.
   Se qualquer ponto estivesse no Z errado ou com sinal trocado, essa
   checagem quebraria.

   ── NOTAS DE ALOTROPIA (o valor depende da forma) ─────────────────
   C  = diamante | P = fosforo branco | S = enxofre monoclinico beta
   Se = selenio cinza hexagonal | Bk = forma alfa
   Por isso o carbono aparece com 3550 C: e o diamante, e a rigor ele
   sublima a 1 atm em vez de fundir.

   ── UMA CORRECAO DELIBERADA ──────────────────────────────────────
   Fr (87): a fonte marca N/A para os dois pontos. Foi adotado
   fusao = 27 C, valor que duas outras compilacoes trazem, porque sem
   ele o frâncio ficaria como estado desconhecido a 25 C e contradiria
   a tabela ESTADO. E um numero ESTIMADO: nunca se produziu francio
   suficiente para ver uma amostra derreter — o recorde e da ordem de
   alguns milhares de atomos. Ebulicao segue null.
   ================================================================== */
const FUSAO = {
  1:-259.14, 2:null, 3:180.54, 4:1287, 5:2075, 6:3550,   // H He Li Be B C
  7:-210.1, 8:-218.3, 9:-219.6, 10:-248.59, 11:97.72, 12:650,   // N O F Ne Na Mg
  13:660.32, 14:1414, 15:44.2, 16:115.21, 17:-101.5, 18:-189.3,   // Al Si P S Cl Ar
  19:63.38, 20:842, 21:1541, 22:1668, 23:1910, 24:1907,   // K Ca Sc Ti V Cr
  25:1246, 26:1538, 27:1495, 28:1455, 29:1084.62, 30:419.53,   // Mn Fe Co Ni Cu Zn
  31:29.76, 32:938.3, 33:817, 34:221, 35:-7.3, 36:-157.36,   // Ga Ge As Se Br Kr
  37:39.31, 38:777, 39:1526, 40:1855, 41:2477, 42:2623,   // Rb Sr Y Zr Nb Mo
  43:2157, 44:2334, 45:1964, 46:1554.9, 47:961.78, 48:321.07,   // Tc Ru Rh Pd Ag Cd
  49:156.6, 50:231.93, 51:630.63, 52:449.51, 53:113.7, 54:-111.8,   // In Sn Sb Te I Xe
  55:28.44, 56:727, 57:919, 58:798, 59:931, 60:1021,   // Cs Ba La Ce Pr Nd
  61:1100, 62:1072, 63:822, 64:1313, 65:1356, 66:1412,   // Pm Sm Eu Gd Tb Dy
  67:1474, 68:1497, 69:1545, 70:819, 71:1663, 72:2233,   // Ho Er Tm Yb Lu Hf
  73:3017, 74:3422, 75:3186, 76:3033, 77:2466, 78:1768.3,   // Ta W Re Os Ir Pt
  79:1064.18, 80:-38.83, 81:304, 82:327.46, 83:271.3, 84:254,   // Au Hg Tl Pb Bi Po
  85:302, 86:-71, 87:27, 88:700, 89:1050, 90:1750,   // At Rn Fr Ra Ac Th
  91:1572, 92:1135, 93:644, 94:640, 95:1176, 96:1345,   // Pa U Np Pu Am Cm
  97:1050, 98:900, 99:860, 100:1527, 101:828, 102:828,   // Bk Cf Es Fm Md No
  103:1627, 104:null, 105:null, 106:null, 107:null, 108:null,   // Lr Rf Db Sg Bh Hs
  109:null, 110:null, 111:null, 112:null, 113:null, 114:null,   // Mt Ds Rg Cn Nh Fl
  115:null, 116:null, 117:null, 118:null   // Mc Lv Ts Og
};
const EBULICAO = {
  1:-252.87, 2:-268.93, 3:1342, 4:2470, 5:4000, 6:4027,   // H He Li Be B C
  7:-195.79, 8:-182.9, 9:-188.12, 10:-246.08, 11:883, 12:1090,   // N O F Ne Na Mg
  13:2519, 14:2900, 15:280.5, 16:444.72, 17:-34.04, 18:-185.8,   // Al Si P S Cl Ar
  19:759, 20:1484, 21:2830, 22:3287, 23:3407, 24:2671,   // K Ca Sc Ti V Cr
  25:2061, 26:2861, 27:2927, 28:2913, 29:2562, 30:907,   // Mn Fe Co Ni Cu Zn
  31:2204, 32:2820, 33:614, 34:685, 35:59, 36:-153.22,   // Ga Ge As Se Br Kr
  37:688, 38:1382, 39:3345, 40:4409, 41:4744, 42:4639,   // Rb Sr Y Zr Nb Mo
  43:4265, 44:4150, 45:3695, 46:2963, 47:2162, 48:767,   // Tc Ru Rh Pd Ag Cd
  49:2072, 50:2602, 51:1587, 52:988, 53:184.3, 54:-108,   // In Sn Sb Te I Xe
  55:671, 56:1870, 57:3464, 58:3360, 59:3290, 60:3100,   // Cs Ba La Ce Pr Nd
  61:3000, 62:1803, 63:1527, 64:3250, 65:3230, 66:2567,   // Pm Sm Eu Gd Tb Dy
  67:2700, 68:2868, 69:1950, 70:1196, 71:3402, 72:4603,   // Ho Er Tm Yb Lu Hf
  73:5458, 74:5555, 75:5596, 76:5012, 77:4428, 78:3825,   // Ta W Re Os Ir Pt
  79:2856, 80:356.73, 81:1473, 82:1749, 83:1564, 84:962,   // Au Hg Tl Pb Bi Po
  85:null, 86:-61.7, 87:null, 88:1737, 89:3200, 90:4820,   // At Rn Fr Ra Ac Th
  91:4000, 92:3927, 93:4000, 94:3230, 95:2011, 96:3110,   // Pa U Np Pu Am Cm
  97:null, 98:null, 99:null, 100:null, 101:null, 102:null,   // Bk Cf Es Fm Md No
  103:null, 104:null, 105:null, 106:null, 107:null, 108:null,   // Lr Rf Db Sg Bh Hs
  109:null, 110:null, 111:null, 112:null, 113:null, 114:null,   // Mt Ds Rg Cn Nh Fl
  115:null, 116:null, 117:null, 118:null   // Mc Lv Ts Og
};

/* Faixa e referencia do controle de temperatura.
   O TETO de 6000 C cobre o renio (5596), o tungstenio (5555) e o
   tantalo (5458), os tres mais refratarios. O PISO e o zero absoluto. */
const TEMP_REF  = 25;      // referencia da tabela ESTADO (IUPAC)
const TEMP_MIN  = -273;
const TEMP_MAX  = 6000;
/* O controle NAO e linear. Numa regua linear de -273 a 6000, a faixa
   onde quase tudo acontece (-273 a 500 C, com mais de 60 mudancas de
   estado) ocuparia 12% do curso, e passar de -200 para -190 seria
   impossivel de acertar. Com expoente 2, o inicio do curso anda pouco
   em temperatura e o fim anda muito, dando resolucao fina justamente
   onde estao as transicoes. Ver posParaTemp() no scriptsitp.js. */
const TEMP_CURVA = 2;
const TEMP_PASSOS = 1000;  // resolucao do controle

/* ==================================================================
   14. ESPACO RESERVADO — PROXIMOS DADOS FIXOS
   ------------------------------------------------------------------
   Espaco preparado para as tabelas novas (eletronegatividade e o que
   mais vier da planilha). O padrao recomendado e uma tabela por
   propriedade, indexada por Z, no mesmo formato das de cima:

       const ELETRONEGATIVIDADE = {
         1: 2.20, 2: null, 3: 0.98, ...
       };

   Use null (nao 0) para "sem valor definido" — gases nobres e
   sinteticos sem medida. O 0 seria lido como um valor real e
   estragaria a faixa do filtro.

   Se o filtro precisar de faixas com rotulo, a faixa tambem e dado
   fixo e mora aqui, nao no scriptsitp.js. Exemplo do formato:

       const FAIXAS_EN = [
         { id:'baixa',  label:'Baixa (< 1,5)',      min:0,   max:1.5 },
         { id:'media',  label:'Media (1,5 - 2,5)',  min:1.5, max:2.5 },
         { id:'alta',   label:'Alta (> 2,5)',       min:2.5, max:10  }
       ];

   Com isso, o scriptsitp.js so precisa ler a tabela e comparar — a
   regra de negocio fica visivel e editavel aqui.
   ================================================================== */
