/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: dados-ligacoes.js
   ───────────────────────────────────────────────────────────────
   Comprimento e energia de ligação (experimentais) por par de
   elementos comuns.
   Depende de: nada. Usado por: js/core/validacao-ligacoes.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const BOND_DATA = {
  ionic: {
    label: 'Ligação Iônica', color: '#ffb74d', energy: '400–4000 kJ/mol', length: '200–320 pm',
    icon: 'bolt', nature: 'Eletrostática, não direcional', examples: 'NaCl, KF, MgO, CaCl₂',
    desc: 'Transferência completa de e⁻ de metal para ametal (ΔEN > 1,7). Forma cátions e ânions que se atraem eletrostaticamente. Resulta em rede cristalina iônica, alto ponto de fusão, conduz eletricidade no estado fundido.',
  },
  covalent_nonpolar: {
    label: 'Ligação Covalente Apolar', color: '#4fc3f7', energy: '150–942 kJ/mol', length: '74–300 pm',
    icon: 'link', nature: 'Compartilhamento simétrico de e⁻', examples: 'H₂, O₂, N₂, Cl₂, C₂H₆',
    desc: 'Compartilhamento igual de pares de elétrons (ΔEN < 0,4). Ligação σ (sobreposição frontal) e π (sobreposição lateral em duplas/triplas). Direcional; energia aumenta com a ordem: simples < dupla < tripla.',
  },
  covalent_polar: {
    label: 'Ligação Covalente Polar', color: '#38bdf8', energy: '150–942 kJ/mol', length: '74–300 pm',
    icon: 'link', nature: 'Compartilhamento assimétrico de e⁻', examples: 'HCl, H₂O, NH₃, HF, CO',
    desc: 'Compartilhamento desigual (0,4 ≤ ΔEN < 1,7). Elétrons deslocados para átomo mais eletronegativo (δ−). Cria dipolo elétrico permanente (μ ≠ 0). Responsável pelas propriedades polares do solvente.',
  },
  covalent_transition: {
    label: 'Covalente com Caráter Iônico', color: '#a78bfa', energy: '200–600 kJ/mol', length: '130–260 pm',
    icon: 'link', nature: 'Zona de transição (1,2 ≤ ΔEN ≤ 1,7)', examples: 'HBr, MgCl₂, AlCl₃, SO₂',
    desc: 'ΔEN na zona de transição — contínuo entre covalente e iônico. Compartilhamento existe mas é fortemente polarizado. A distinção iônica/covalente é uma simplificação didática (IUPAC).',
  },
  metallic: {
    label: 'Ligação Metálica', color: '#fde68a', energy: '70–850 kJ/mol', length: '230–320 pm',
    icon: 'magnet', nature: 'Cátions em "mar de elétrons"', examples: 'Fe, Cu, Al, Na, Au, ligas',
    desc: 'Cátions metálicos fixos imersos em elétrons de condução deslocalizados ("mar de elétrons"). Não direcional. Explica condutividade elétrica/térmica, maleabilidade, ductilidade e brilho metálico.',
  },
};
