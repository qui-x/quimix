/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: js/data/banco-cadeias.js
   ───────────────────────────────────────────────────────────────
   BANCO DE MOLÉCULAS REAIS DO MÓDULO 3 (classificação de cadeias).

   Cada entrada guarda só o que NÃO se calcula:
     smiles ..... a estrutura, na forma de Kekulé (confira no PubChem)
     formula .... fórmula molecular de referência. NÃO é usada na
                  classificação: serve para o teste conferir que o
                  SMILES descreve a substância nomeada (um erro de
                  digitação que produzisse outra molécula aparece ali)
     contexto ... onde o aluno encontra essa substância
     nivel ...... 1 abertas · 2 heteroátomos e pegadinhas ·
                  3 anéis não aromáticos · 4 aromáticas e heterociclos

   A classificação NUNCA fica guardada aqui: é calculada ao vivo por
   Q3.Classificacao.analisar, a mesma regra do Módulo 1.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};

  Q3.BANCO_CADEIAS = [
    // ── nível 1: cadeias abertas, só carbono
    { id: 'propano',     nome: 'Propano',        smiles: 'CCC',             formula: 'C3H8',   nivel: 1, contexto: 'Um dos gases do botijão de cozinha (GLP).' },
    { id: 'butano',      nome: 'Butano',         smiles: 'CCCC',            formula: 'C4H10',  nivel: 1, contexto: 'Gás do isqueiro e do botijão de cozinha.' },
    { id: 'isobutano',   nome: 'Isobutano (metilpropano)', smiles: 'CC(C)C', formula: 'C4H10', nivel: 1, contexto: 'Isômero do butano, também presente no GLP.' },
    { id: 'isoctano',    nome: 'Isoctano (2,2,4-trimetilpentano)', smiles: 'CC(C)(C)CC(C)C', formula: 'C8H18', nivel: 1, contexto: 'Referência 100 da escala de octanagem da gasolina.' },
    { id: 'eteno',       nome: 'Eteno (etileno)', smiles: 'C=C',            formula: 'C2H4',   nivel: 1, contexto: 'Hormônio vegetal que faz as frutas amadurecerem.' },
    { id: 'etino',       nome: 'Etino (acetileno)', smiles: 'C#C',          formula: 'C2H2',   nivel: 1, contexto: 'Combustível do maçarico de solda oxiacetilênica.' },
    { id: 'propeno',     nome: 'Propeno',        smiles: 'C=CC',            formula: 'C3H6',   nivel: 1, contexto: 'Monômero do polipropileno (potes, para-choques).' },
    { id: 'isopreno',    nome: 'Isopreno (2-metilbuta-1,3-dieno)', smiles: 'C=C(C)C=C', formula: 'C5H8', nivel: 1, contexto: 'Monômero da borracha natural, do látex da seringueira.' },

    // ── nível 2: heteroátomos, e as pegadinhas do =O e do grupo na ponta
    { id: 'etanol',      nome: 'Etanol',         smiles: 'CCO',             formula: 'C2H6O',  nivel: 2, contexto: 'Combustível dos carros flex e álcool das bebidas.' },
    { id: 'eter',        nome: 'Éter dietílico (etoxietano)', smiles: 'CCOCC', formula: 'C4H10O', nivel: 2, contexto: 'Usado na primeira anestesia pública, em 1846.' },
    { id: 'acetico',     nome: 'Ácido acético',  smiles: 'CC(=O)O',         formula: 'C2H4O2', nivel: 2, contexto: 'O ácido do vinagre (4 a 6% em massa).' },
    { id: 'acetona',     nome: 'Propanona (acetona)', smiles: 'CC(=O)C',    formula: 'C3H6O',  nivel: 2, contexto: 'Removedor de esmalte de unhas.' },
    { id: 'trimetilamina', nome: 'Trimetilamina', smiles: 'CN(C)C',         formula: 'C3H9N',  nivel: 2, contexto: 'Responsável pelo cheiro de peixe.' },
    { id: 'acetato',     nome: 'Acetato de etila', smiles: 'CC(=O)OCC',     formula: 'C4H8O2', nivel: 2, contexto: 'Solvente de esmaltes e aroma de frutas.' },
    { id: 'sulfeto',     nome: 'Sulfeto de dimetila', smiles: 'CSC',        formula: 'C2H6S',  nivel: 2, contexto: 'Dá o cheiro de maresia e de repolho cozido.' },
    { id: 'latico',      nome: 'Ácido lático',   smiles: 'CC(O)C(=O)O',     formula: 'C3H6O3', nivel: 2, contexto: 'Produzido no músculo e no leite fermentado (iogurte).' },
    { id: 'glicina',     nome: 'Glicina',        smiles: 'NCC(=O)O',        formula: 'C2H5NO2', nivel: 2, contexto: 'O aminoácido mais simples das proteínas.' },

    // ── nível 3: anéis não aromáticos
    { id: 'ciclopropano', nome: 'Ciclopropano',  smiles: 'C1CC1',           formula: 'C3H6',   nivel: 3, contexto: 'Foi usado como anestésico no século XX.' },
    { id: 'cicloexano',  nome: 'Ciclo-hexano',   smiles: 'C1CCCCC1',        formula: 'C6H12',  nivel: 3, contexto: 'Matéria-prima do náilon.' },
    { id: 'cicloexeno',  nome: 'Ciclo-hexeno',   smiles: 'C1=CCCCC1',       formula: 'C6H10',  nivel: 3, contexto: 'Alceno cíclico: a dupla fica no anel.' },
    { id: 'thf',         nome: 'Tetra-hidrofurano (oxolano)', smiles: 'C1CCOC1', formula: 'C4H8O', nivel: 3, contexto: 'Solvente; é o anel das furanoses, como a ribose.' },
    { id: 'limoneno',    nome: 'Limoneno',       smiles: 'CC1=CCC(CC1)C(=C)C', formula: 'C10H16', nivel: 3, contexto: 'O cheiro da casca da laranja e do limão.' },
    { id: 'mentol',      nome: 'Mentol',         smiles: 'CC(C)C1CCC(C)CC1O', formula: 'C10H20O', nivel: 3, contexto: 'A sensação refrescante da hortelã.' },

    // ── nível 4: aromáticas e heterociclos
    { id: 'benzeno',     nome: 'Benzeno',        smiles: 'C1=CC=CC=C1',     formula: 'C6H6',   nivel: 4, contexto: 'Solvente hoje restrito: é cancerígeno.' },
    { id: 'tolueno',     nome: 'Tolueno (metilbenzeno)', smiles: 'CC1=CC=CC=C1', formula: 'C7H8', nivel: 4, contexto: 'Solvente de tintas e colas.' },
    { id: 'fenol',       nome: 'Fenol (hidroxibenzeno)', smiles: 'OC1=CC=CC=C1', formula: 'C6H6O', nivel: 4, contexto: 'Antisséptico pioneiro nas cirurgias do século XIX.' },
    { id: 'anilina',     nome: 'Anilina (fenilamina)', smiles: 'NC1=CC=CC=C1', formula: 'C6H7N', nivel: 4, contexto: 'Base da indústria de corantes.' },
    { id: 'estireno',    nome: 'Estireno (vinilbenzeno)', smiles: 'C=CC1=CC=CC=C1', formula: 'C8H8', nivel: 4, contexto: 'Monômero do poliestireno (isopor).' },
    { id: 'benzoico',    nome: 'Ácido benzoico', smiles: 'OC(=O)C1=CC=CC=C1', formula: 'C7H6O2', nivel: 4, contexto: 'Conservante de alimentos e refrigerantes.' },
    { id: 'naftaleno',   nome: 'Naftaleno',      smiles: 'C1=CC=C2C=CC=CC2=C1', formula: 'C10H8', nivel: 4, contexto: 'As bolinhas de naftalina, contra traças.' },
    { id: 'bifenila',    nome: 'Bifenila',       smiles: 'C1=CC=C(C=C1)C2=CC=CC=C2', formula: 'C12H10', nivel: 4, contexto: 'Fungicida aplicado na casca de frutas cítricas.' },
    { id: 'piridina',    nome: 'Piridina',       smiles: 'C1=CC=NC=C1',     formula: 'C5H5N',  nivel: 4, contexto: 'O anel da nicotina e da vitamina B3.' },
    { id: 'furano',      nome: 'Furano',         smiles: 'C1=COC=C1',       formula: 'C4H4O',  nivel: 4, contexto: 'Heterociclo aromático de cinco átomos, com O.' },
    { id: 'pirrol',      nome: 'Pirrol',         smiles: 'C1=CNC=C1',       formula: 'C4H5N',  nivel: 4, contexto: 'Quatro deles formam o anel da clorofila e da hemoglobina.' },
    { id: 'tiofeno',     nome: 'Tiofeno',        smiles: 'C1=CSC=C1',       formula: 'C4H4S',  nivel: 4, contexto: 'Presente no petróleo; removido na dessulfurização.' },
    { id: 'vanilina',    nome: 'Vanilina',       smiles: 'COC1=C(O)C=CC(C=O)=C1', formula: 'C8H8O3', nivel: 4, contexto: 'O aroma da baunilha.' },
    { id: 'aspirina',    nome: 'Ácido acetilsalicílico', smiles: 'CC(=O)OC1=CC=CC=C1C(=O)O', formula: 'C9H8O4', nivel: 4, contexto: 'O princípio ativo da aspirina.' }
  ];

})(typeof window !== 'undefined' ? window : globalThis);
