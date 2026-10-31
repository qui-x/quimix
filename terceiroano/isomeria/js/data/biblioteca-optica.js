/* ══════════════════════════════════════════════════════════════════
   SIIS · MÓDULO 3 — A BIBLIOTECA (pontos de partida, não uma lista fechada)
   ──────────────────────────────────────────────────────────────────
   O aluno pode estudar QUALQUER molécula (digitada ou desenhada). Estas
   são as dos livros e as de aplicação conhecida. Para cada configuração:
   o sinal da luz polarizada medido no POLARÍMETRO — (+) dextrogira,
   (−) levogira — e o que se sabe dela. R/S sai da estrutura; o sinal NÃO:
   só a medida dá. Onde o sinal não é bem estabelecido, fica sem sinal.
   config: os descritores na ordem dos carbonos quirais do motor (R/S…).

   PARA ACRESCENTAR UM COMPOSTO (a lista tem busca e cresce sem mudar o código):
     { id: 'unico-sem-espacos',
       nome: 'nome IUPAC ou usual (o que aparece na lista)',
       categoria: 'clássico' | 'aminoácido' | 'açúcar' | 'aroma' | 'medicamento' | … (texto livre),
       sinonimos: ['outros nomes, para a busca'],
       smiles: 'a estrutura em SMILES (sem @: a configuração vem de formas)',
       formas: [ { config: 'R' (ou 'RS'…), sinal: '+' | '−' | '0' | null, nota: 'o que se sabe dela' }, … ] }
   A lista mostra SÓ o nome, e a busca procura só no nome, na categoria e nos
   sinônimos (sem maiúsculas nem acentos): nada pode antecipar a previsão.
   NÃO ponha nos sinônimos o que revela a configuração ou a resposta — R-, S-,
   D-, L-, meso, racêmico, os dois aromas de um par… As notas das formas só
   aparecem depois de revelar.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  Q3.BibliotecaOptica = [
    { id: 'latico', nome: 'ácido lático', categoria: 'clássico',
      sinonimos: ['ácido 2-hidroxipropanoico', 'lactato', 'leite'],
      smiles: 'CC(O)C(=O)O', formas: [
      { config: 'S', sinal: '+', nota: 'o ácido lático dos músculos (L)' },
      { config: 'R', sinal: '−', nota: 'produzido por algumas bactérias (D)' }] },
    { id: 'gliceraldeido', nome: 'gliceraldeído', categoria: 'açúcar',
      sinonimos: ['2,3-di-hidroxipropanal', 'triose'],
      smiles: 'OCC(O)C=O', formas: [
      { config: 'R', sinal: '+', nota: 'D-gliceraldeído: a referência das séries D e L dos açúcares' },
      { config: 'S', sinal: '−', nota: 'L-gliceraldeído' }] },
    { id: 'alanina', nome: 'alanina', categoria: 'aminoácido',
      sinonimos: ['ácido 2-aminopropanoico'],
      smiles: 'CC(N)C(=O)O', formas: [
      { config: 'S', sinal: '+', nota: 'L-alanina, a das proteínas' },
      { config: 'R', sinal: '−', nota: 'D-alanina, presente na parede de bactérias' }] },
    { id: 'bcf', nome: 'bromoclorofluorometano', categoria: 'clássico',
      sinonimos: ['CHBrClF'],
      smiles: 'FC(Cl)Br', formas: [
      { config: 'R', sinal: null, nota: 'o exemplo mais simples: um carbono com quatro átomos diferentes' },
      { config: 'S', sinal: null, nota: 'separados em laboratório; o sinal de cada um se mede no polarímetro' }] },
    { id: 'butanol', nome: 'butan-2-ol', categoria: 'clássico',
      sinonimos: ['sec-butanol', '2-butanol', 'álcool sec-butílico'],
      smiles: 'CCC(C)O', formas: [
      { config: 'R', sinal: '−', nota: '' },
      { config: 'S', sinal: '+', nota: '' }] },
    { id: 'tartarico', nome: 'ácido tartárico', categoria: 'clássico',
      sinonimos: ['ácido 2,3-di-hidroxibutanodioico', 'uva', 'cremor tártaro'],
      smiles: 'OC(=O)C(O)C(O)C(=O)O', formas: [
      { config: 'RR', sinal: '+', nota: 'o natural, da uva' },
      { config: 'SS', sinal: '−', nota: 'o enantiômero do natural' },
      { config: 'RS', sinal: '0', nota: 'meso: opticamente inativo (plano de simetria interno)' }] },
    { id: 'carvona', nome: 'carvona', categoria: 'aroma',
      sinonimos: ['menta'],
      smiles: 'CC1=CCC(CC1=O)C(C)=C', formas: [
      { config: 'R', sinal: '−', nota: 'cheiro de hortelã' },
      { config: 'S', sinal: '+', nota: 'cheiro de alcaravia (cominho)' }] },
    { id: 'limoneno', nome: 'limoneno', categoria: 'aroma',
      sinonimos: ['citrus', 'terpeno'],
      smiles: 'CC1=CCC(CC1)C(C)=C', formas: [
      { config: 'R', sinal: '+', nota: 'cheiro de laranja' },
      { config: 'S', sinal: '−', nota: 'cheiro de pinho' }] },
    { id: 'ibuprofeno', nome: 'ibuprofeno', categoria: 'medicamento',
      sinonimos: ['remédio', 'analgésico', 'anti-inflamatório'],
      smiles: 'CC(C)CC1=CC=C(C=C1)C(C)C(=O)O', formas: [
      { config: 'S', sinal: '+', nota: 'a forma ativa contra dor e inflamação' },
      { config: 'R', sinal: '−', nota: 'pouco ativa; o corpo converte parte dela na forma S' }] },
    { id: 'talidomida', nome: 'talidomida', categoria: 'medicamento',
      sinonimos: ['remédio', 'sedativo'],
      smiles: 'O=C1CCC(N2C(=O)C3=CC=CC=C3C2=O)C(=O)N1', formas: [
      { config: 'R', sinal: '+', nota: 'o efeito sedativo' },
      { config: 'S', sinal: '−', nota: 'associada às malformações em bebês nos anos 1950–60. No corpo, uma forma se converte na outra: dar só a R não teria evitado o dano' }] }
  ];
})();
