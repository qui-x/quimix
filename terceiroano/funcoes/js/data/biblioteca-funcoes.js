/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: js/data/biblioteca-funcoes.js
   ───────────────────────────────────────────────────────────────
   BIBLIOTECA DE COMPOSTOS REAIS DO MÓDULO 1 (grupos funcionais).

   Cada entrada guarda só o que NÃO se calcula:
     smiles ..... a estrutura, na forma de Kekulé (confira no PubChem)
     formula .... fórmula molecular de referência. NÃO é usada na
                  detecção: o teste confere que o SMILES descreve a
                  substância nomeada
     categoria .. para a busca: medicamento · aroma · alimento ·
                  combustivel · industria
     contexto ... onde o aluno encontra essa substância

   Os grupos funcionais NUNCA ficam guardados aqui: saem ao vivo do
   motor (Q3.Funcoes.detectar), que o teste confere composto a composto.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};

  Q3.CATEGORIAS_FUNCOES = [
    { id: 'medicamento', nome: 'Medicamentos' },
    { id: 'aroma', nome: 'Aromas e sabores' },
    { id: 'alimento', nome: 'Alimentos e corpo' },
    { id: 'combustivel', nome: 'Combustíveis e solventes' },
    { id: 'industria', nome: 'Indústria e laboratório' }
  ];

  Q3.BIBLIOTECA_FUNCOES = [
    // ── medicamentos
    { id: 'paracetamol', nome: 'Paracetamol', smiles: 'CC(=O)NC1=CC=C(O)C=C1', formula: 'C8H9NO2', categoria: 'medicamento', contexto: 'Analgésico e antitérmico.' },
    { id: 'aas', nome: 'Ácido acetilsalicílico (AAS)', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O', formula: 'C9H8O4', categoria: 'medicamento', contexto: 'O princípio ativo da aspirina.' },
    { id: 'ibuprofeno', nome: 'Ibuprofeno', smiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O', formula: 'C13H18O2', categoria: 'medicamento', contexto: 'Anti-inflamatório.' },
    { id: 'naproxeno', nome: 'Naproxeno', smiles: 'COC1=CC2=CC=C(C=C2C=C1)C(C)C(=O)O', formula: 'C14H14O3', categoria: 'medicamento', contexto: 'Anti-inflamatório de efeito prolongado.' },
    { id: 'benzocaina', nome: 'Benzocaína', smiles: 'CCOC(=O)C1=CC=C(N)C=C1', formula: 'C9H11NO2', categoria: 'medicamento', contexto: 'Anestésico local de pomadas e sprays.' },
    { id: 'lidocaina', nome: 'Lidocaína', smiles: 'CCN(CC)CC(=O)NC1=C(C)C=CC=C1C', formula: 'C14H22N2O', categoria: 'medicamento', contexto: 'Anestésico do dentista.' },
    { id: 'salicilato', nome: 'Salicilato de metila', smiles: 'COC(=O)C1=CC=CC=C1O', formula: 'C8H8O3', categoria: 'medicamento', contexto: 'Óleo de gaultéria, das pomadas para dor muscular.' },
    { id: 'adrenalina', nome: 'Adrenalina', smiles: 'CNCC(O)C1=CC(O)=C(O)C=C1', formula: 'C9H13NO3', categoria: 'medicamento', contexto: 'Hormônio do susto; usada em emergências alérgicas.' },

    // ── aromas e sabores
    { id: 'vanilina', nome: 'Vanilina', smiles: 'COC1=C(O)C=CC(C=O)=C1', formula: 'C8H8O3', categoria: 'aroma', contexto: 'O aroma da baunilha.' },
    { id: 'cinamaldeido', nome: 'Cinamaldeído', smiles: 'O=CC=CC1=CC=CC=C1', formula: 'C9H8O', categoria: 'aroma', contexto: 'O aroma da canela.' },
    { id: 'eugenol', nome: 'Eugenol', smiles: 'COC1=C(O)C=CC(CC=C)=C1', formula: 'C10H12O2', categoria: 'aroma', contexto: 'O aroma do cravo-da-índia.' },
    { id: 'mentol', nome: 'Mentol', smiles: 'CC(C)C1CCC(C)CC1O', formula: 'C10H20O', categoria: 'aroma', contexto: 'A sensação refrescante da hortelã.' },
    { id: 'carvona', nome: 'Carvona', smiles: 'CC1=CCC(CC1=O)C(=C)C', formula: 'C10H14O', categoria: 'aroma', contexto: 'O aroma da hortelã e do cominho.' },
    { id: 'isoamila', nome: 'Acetato de isoamila', smiles: 'CC(C)CCOC(C)=O', formula: 'C7H14O2', categoria: 'aroma', contexto: 'O aroma de banana das balas.' },
    { id: 'butanoato', nome: 'Butanoato de etila', smiles: 'CCCC(=O)OCC', formula: 'C6H12O2', categoria: 'aroma', contexto: 'O aroma de abacaxi.' },
    { id: 'benzaldeido', nome: 'Benzaldeído', smiles: 'O=CC1=CC=CC=C1', formula: 'C7H6O', categoria: 'aroma', contexto: 'O aroma de amêndoa amarga.' },
    { id: 'geraniol', nome: 'Geraniol', smiles: 'CC(C)=CCCC(C)=CCO', formula: 'C10H18O', categoria: 'aroma', contexto: 'O aroma de rosa.' },
    { id: 'limoneno', nome: 'Limoneno', smiles: 'CC1=CCC(CC1)C(=C)C', formula: 'C10H16', categoria: 'aroma', contexto: 'O cheiro da casca de laranja: só carbono e hidrogênio.' },

    // ── alimentos e corpo
    { id: 'glicose', nome: 'Glicose (cadeia aberta)', smiles: 'OCC(O)C(O)C(O)C(O)C=O', formula: 'C6H12O6', categoria: 'alimento', contexto: 'O açúcar do sangue; em água, fica quase toda em anel.' },
    { id: 'frutose', nome: 'Frutose (cadeia aberta)', smiles: 'OCC(O)C(O)C(O)C(=O)CO', formula: 'C6H12O6', categoria: 'alimento', contexto: 'O açúcar das frutas e do mel.' },
    { id: 'latico', nome: 'Ácido lático', smiles: 'CC(O)C(=O)O', formula: 'C3H6O3', categoria: 'alimento', contexto: 'Produzido no músculo e no iogurte.' },
    { id: 'citrico', nome: 'Ácido cítrico', smiles: 'OC(=O)CC(O)(CC(=O)O)C(=O)O', formula: 'C6H8O7', categoria: 'alimento', contexto: 'A acidez do limão.' },
    { id: 'butanoico', nome: 'Ácido butanoico', smiles: 'CCCC(=O)O', formula: 'C4H8O2', categoria: 'alimento', contexto: 'O cheiro da manteiga rançosa.' },
    { id: 'glicina', nome: 'Glicina', smiles: 'NCC(=O)O', formula: 'C2H5NO2', categoria: 'alimento', contexto: 'O aminoácido mais simples das proteínas.' },
    { id: 'alanina', nome: 'Alanina', smiles: 'CC(N)C(=O)O', formula: 'C3H7NO2', categoria: 'alimento', contexto: 'Aminoácido das proteínas.' },
    { id: 'ureia', nome: 'Ureia', smiles: 'NC(N)=O', formula: 'CH4N2O', categoria: 'alimento', contexto: 'Eliminada na urina; também é adubo.' },
    { id: 'cafeina', nome: 'Cafeína', smiles: 'CN1C=NC2=C1C(=O)N(C)C(=O)N2C', formula: 'C8H10N4O2', categoria: 'alimento', contexto: 'O estimulante do café e do chá.' },
    { id: 'dopamina', nome: 'Dopamina', smiles: 'NCCC1=CC=C(O)C(O)=C1', formula: 'C8H11NO2', categoria: 'alimento', contexto: 'Neurotransmissor do prazer e do movimento.' },
    { id: 'putrescina', nome: 'Putrescina', smiles: 'NCCCCN', formula: 'C4H12N2', categoria: 'alimento', contexto: 'Parte do cheiro da carne em decomposição.' },
    { id: 'trimetilamina', nome: 'Trimetilamina', smiles: 'CN(C)C', formula: 'C3H9N', categoria: 'alimento', contexto: 'O cheiro de peixe.' },

    // ── combustíveis e solventes
    { id: 'etanol', nome: 'Etanol', smiles: 'CCO', formula: 'C2H6O', categoria: 'combustivel', contexto: 'Combustível dos carros flex e álcool das bebidas.' },
    { id: 'metanol', nome: 'Metanol', smiles: 'CO', formula: 'CH4O', categoria: 'combustivel', contexto: 'Combustível de corrida; tóxico se ingerido.' },
    { id: 'acetona', nome: 'Propanona (acetona)', smiles: 'CC(C)=O', formula: 'C3H6O', categoria: 'combustivel', contexto: 'Removedor de esmalte.' },
    { id: 'eter', nome: 'Éter dietílico', smiles: 'CCOCC', formula: 'C4H10O', categoria: 'combustivel', contexto: 'Solvente; usado na primeira anestesia pública, em 1846.' },
    { id: 'mtbe', nome: 'MTBE (metil terc-butil éter)', smiles: 'COC(C)(C)C', formula: 'C5H12O', categoria: 'combustivel', contexto: 'Aditivo que aumenta a octanagem da gasolina.' },
    { id: 'cloroformio', nome: 'Clorofórmio (triclorometano)', smiles: 'ClC(Cl)Cl', formula: 'CHCl3', categoria: 'combustivel', contexto: 'Solvente de laboratório; foi anestésico no século XIX.' },
    { id: 'acetato', nome: 'Acetato de etila', smiles: 'CC(=O)OCC', formula: 'C4H8O2', categoria: 'combustivel', contexto: 'Solvente de esmaltes e colas.' },
    { id: 'tolueno', nome: 'Tolueno', smiles: 'CC1=CC=CC=C1', formula: 'C7H8', categoria: 'combustivel', contexto: 'Solvente de tintas: só carbono e hidrogênio.' },
    { id: 'isoctano', nome: 'Isoctano', smiles: 'CC(C)(C)CC(C)C', formula: 'C8H18', categoria: 'combustivel', contexto: 'Referência 100 da octanagem: só carbono e hidrogênio.' },

    // ── indústria e laboratório
    { id: 'formol', nome: 'Metanal (formol)', smiles: 'C=O', formula: 'CH2O', categoria: 'industria', contexto: 'Conserva peças anatômicas; é o aldeído mais simples.' },
    { id: 'acetico', nome: 'Ácido acético', smiles: 'CC(=O)O', formula: 'C2H4O2', categoria: 'industria', contexto: 'O ácido do vinagre (4 a 6%).' },
    { id: 'anidrido', nome: 'Anidrido acético', smiles: 'CC(=O)OC(C)=O', formula: 'C4H6O3', categoria: 'industria', contexto: 'Reagente da fabricação da aspirina.' },
    { id: 'cloretoacetila', nome: 'Cloreto de acetila', smiles: 'CC(Cl)=O', formula: 'C2H3ClO', categoria: 'industria', contexto: 'Reagente de laboratório muito reativo.' },
    { id: 'acetonitrila', nome: 'Acetonitrila', smiles: 'CC#N', formula: 'C2H3N', categoria: 'industria', contexto: 'Solvente de análises químicas.' },
    { id: 'acrilonitrila', nome: 'Acrilonitrila', smiles: 'C=CC#N', formula: 'C3H3N', categoria: 'industria', contexto: 'Monômero das fibras acrílicas.' },
    { id: 'anilina', nome: 'Anilina', smiles: 'NC1=CC=CC=C1', formula: 'C6H7N', categoria: 'industria', contexto: 'Base da indústria de corantes.' },
    { id: 'fenol', nome: 'Fenol', smiles: 'OC1=CC=CC=C1', formula: 'C6H6O', categoria: 'industria', contexto: 'Matéria-prima de resinas e antisséptico histórico.' },
    { id: 'cloretovinila', nome: 'Cloreto de vinila', smiles: 'C=CCl', formula: 'C2H3Cl', categoria: 'industria', contexto: 'Monômero do PVC.' },
    { id: 'piridina', nome: 'Piridina', smiles: 'C1=CC=NC=C1', formula: 'C5H5N', categoria: 'industria', contexto: 'Solvente; o anel da nicotina e da vitamina B3.' }
  ];

})(typeof window !== 'undefined' ? window : globalThis);
