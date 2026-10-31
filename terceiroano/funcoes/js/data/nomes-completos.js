/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: js/data/nomes-completos.js
   ───────────────────────────────────────────────────────────────
   MÓDULO 4 — compostos REAIS com mais de um grupo, para montar o nome
   completo. Só a estrutura (SMILES) e o contexto: o nome IUPAC é
   calculado pelo motor (nomenclatura-completa.js), e os testes garantem
   que cada composto daqui é nomeado — nenhum nome é escrito à mão.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  Q3.NOMES_COMPLETOS = [
    { comum: 'glicina', smiles: 'NCC(=O)O', onde: 'o aminoácido mais simples, nas proteínas' },
    { comum: 'alanina', smiles: 'CC(N)C(=O)O', onde: 'aminoácido das proteínas' },
    { comum: 'serina', smiles: 'OCC(N)C(=O)O', onde: 'aminoácido das proteínas' },
    { comum: 'valina', smiles: 'CC(C)C(N)C(=O)O', onde: 'aminoácido essencial' },
    { comum: 'leucina', smiles: 'CC(C)CC(N)C(=O)O', onde: 'aminoácido essencial, nos suplementos' },
    { comum: 'GABA', smiles: 'NCCCC(=O)O', onde: 'neurotransmissor que acalma o sistema nervoso' },
    { comum: 'ácido lático', smiles: 'CC(O)C(=O)O', onde: 'no leite azedo e nos músculos em esforço' },
    { comum: 'ácido pirúvico', smiles: 'CC(=O)C(=O)O', onde: 'no metabolismo da glicose' },
    { comum: 'ácido acetoacético', smiles: 'CC(=O)CC(=O)O', onde: 'corpo cetônico, no jejum prolongado' },
    { comum: 'ácido succínico', smiles: 'OC(=O)CCC(=O)O', onde: 'no ciclo de Krebs' },
    { comum: 'ácido oxálico', smiles: 'OC(=O)C(=O)O', onde: 'no espinafre e nos removedores de ferrugem' },
    { comum: 'ácido málico', smiles: 'OC(=O)CC(O)C(=O)O', onde: 'na maçã verde' },
    { comum: 'ácido tartárico', smiles: 'OC(=O)C(O)C(O)C(=O)O', onde: 'na uva e no vinho' },
    { comum: 'glicerol', smiles: 'OCC(O)CO', onde: 'nos sabonetes e cremes hidratantes' },
    { comum: 'etilenoglicol', smiles: 'OCCO', onde: 'no anticongelante dos radiadores' },
    { comum: 'propilenoglicol', smiles: 'CC(O)CO', onde: 'em alimentos, cosméticos e líquidos de vaporizador' },
    { comum: 'acetoína', smiles: 'CC(O)C(C)=O', onde: 'aroma de manteiga' },
    { comum: 'diacetil', smiles: 'CC(=O)C(C)=O', onde: 'aroma de manteiga da pipoca' },
    { comum: 'aldol', smiles: 'CC(O)CC=O', onde: 'produto da reação aldólica' },
    { comum: 'diacetona álcool', smiles: 'CC(=O)CC(C)(C)O', onde: 'solvente de tintas' },
    { comum: 'isopreno', smiles: 'C=CC(C)=C', onde: 'a unidade da borracha natural' },
    { comum: '1,2-dicloroetano', smiles: 'ClCCCl', onde: 'na fabricação do PVC' },
    { comum: 'etanolamina', smiles: 'NCCO', onde: 'em sabões e na limpeza de gases industriais' },
    { comum: 'ácido salicílico', smiles: 'OC(=O)C1=CC=CC=C1O', onde: 'nos produtos antiacne; origem da aspirina' },
    { comum: 'PABA', smiles: 'NC1=CC=C(C=C1)C(=O)O', onde: 'nos primeiros protetores solares' },
    { comum: 'vanilina', smiles: 'COC1=C(O)C=CC(C=O)=C1', onde: 'o aroma da baunilha' },
    { comum: 'catecol', smiles: 'OC1=CC=CC=C1O', onde: 'reveladores fotográficos' },
    { comum: 'hidroquinona', smiles: 'OC1=CC=C(O)C=C1', onde: 'cremes clareadores' },
    { comum: 'benzocaína', smiles: 'CCOC(=O)C1=CC=C(N)C=C1', onde: 'anestésico local de pomadas e sprays' },
    { comum: 'salicilato de metila', smiles: 'COC(=O)C1=CC=CC=C1O', onde: 'o óleo de gaultéria das pomadas' },
    { comum: 'lactato de etila', smiles: 'CCOC(=O)C(C)O', onde: 'solvente biodegradável e aroma' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
