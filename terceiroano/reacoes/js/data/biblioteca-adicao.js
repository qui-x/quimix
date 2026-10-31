/* ══════════════════════════════════════════════════════════════════
   SIRO · MÓDULO 1 — A BIBLIOTECA DA ADIÇÃO (lista com busca; cresce sem
   mudar o código). Cada reação aplica um MODELO do motor de setas aos
   reagentes; nada de setas ou intermediários cadastrados à mão.

   PARA ACRESCENTAR UMA REAÇÃO:
     { id: 'unico', nome: 'os REAGENTES, como na lousa (ex.: propeno + HBr)',
       substrato: 'SMILES do alceno', nomeSubstrato: 'nome do alceno',
       modelo: 'hx' | 'hidratacao' | 'halogenacao' | 'hidrogenacao',
       reagente: 'Br' | 'Cl' | 'I' (HX, X₂), catalisadores: true (só na hidratação),
       sinonimos: ['para a busca'] }
   O nome mostra SÓ os reagentes: o produto e o mecanismo não podem
   aparecer antes de o aluno desenhar as setas.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var Q3 = window.Q3 = window.Q3 || {};
  Q3.BibliotecaAdicao = [
    { id: 'propeno-hbr', nome: 'propeno + HBr', substrato: 'C=CC', nomeSubstrato: 'propeno', modelo: 'hx', reagente: 'Br', sinonimos: ['brometo de hidrogênio', 'ácido bromídrico'] },
    { id: 'eteno-hbr', nome: 'eteno + HBr', substrato: 'C=C', nomeSubstrato: 'eteno', modelo: 'hx', reagente: 'Br', sinonimos: ['etileno'] },
    { id: 'buteno2-hbr', nome: 'but-2-eno + HBr', substrato: 'CC=CC', nomeSubstrato: 'but-2-eno', modelo: 'hx', reagente: 'Br', sinonimos: ['2-buteno'] },
    { id: 'buteno1-hcl', nome: 'but-1-eno + HCl', substrato: 'C=CCC', nomeSubstrato: 'but-1-eno', modelo: 'hx', reagente: 'Cl', sinonimos: ['1-buteno', 'cloreto de hidrogênio', 'ácido clorídrico'] },
    { id: 'metilpropeno-hcl', nome: 'metilpropeno + HCl', substrato: 'C=C(C)C', nomeSubstrato: 'metilpropeno', modelo: 'hx', reagente: 'Cl', sinonimos: ['isobutileno', '2-metilpropeno'] },
    { id: 'metilbuteno-hi', nome: '2-metilbut-2-eno + HI', substrato: 'CC=C(C)C', nomeSubstrato: '2-metilbut-2-eno', modelo: 'hx', reagente: 'I', sinonimos: ['iodeto de hidrogênio', 'ácido iodídrico'] },
    { id: 'ciclohexeno-hbr', nome: 'ciclo-hexeno + HBr', substrato: 'C1=CCCCC1', nomeSubstrato: 'ciclo-hexeno', modelo: 'hx', reagente: 'Br', sinonimos: ['cicloexeno', 'anel'] },
    { id: 'eteno-agua', nome: 'eteno + H₂O (ácido)', substrato: 'C=C', nomeSubstrato: 'eteno', modelo: 'hidratacao', catalisadores: true, sinonimos: ['água', 'hidratação', 'etileno'] },
    { id: 'propeno-agua', nome: 'propeno + H₂O (ácido)', substrato: 'C=CC', nomeSubstrato: 'propeno', modelo: 'hidratacao', catalisadores: true, sinonimos: ['água', 'hidratação'] },
    { id: 'metilpropeno-agua', nome: 'metilpropeno + H₂O (ácido)', substrato: 'C=C(C)C', nomeSubstrato: 'metilpropeno', modelo: 'hidratacao', catalisadores: true, sinonimos: ['água', 'hidratação', 'isobutileno'] },
    { id: 'eteno-br2', nome: 'eteno + Br₂', substrato: 'C=C', nomeSubstrato: 'eteno', modelo: 'halogenacao', reagente: 'Br', sinonimos: ['bromo', 'água de bromo', 'etileno'] },
    { id: 'propeno-cl2', nome: 'propeno + Cl₂', substrato: 'C=CC', nomeSubstrato: 'propeno', modelo: 'halogenacao', reagente: 'Cl', sinonimos: ['cloro'] },
    { id: 'ciclohexeno-br2', nome: 'ciclo-hexeno + Br₂', substrato: 'C1=CCCCC1', nomeSubstrato: 'ciclo-hexeno', modelo: 'halogenacao', reagente: 'Br', sinonimos: ['bromo', 'cicloexeno', 'anel'] },
    { id: 'propeno-h2', nome: 'propeno + H₂ (Ni)', substrato: 'C=CC', nomeSubstrato: 'propeno', modelo: 'hidrogenacao', sinonimos: ['hidrogênio', 'níquel', 'hidrogenação'] }
  ];
})();
