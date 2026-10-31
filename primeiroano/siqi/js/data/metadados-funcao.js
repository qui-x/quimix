/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: metadados-funcao.js
   ───────────────────────────────────────────────────────────────
   Metadados das 4 funções inorgânicas (ácido, base, sal, óxido —
   rótulo, cor, ícone) e as categorias/abas usadas para filtrar a
   Biblioteca.
   FONTE GERAL DESTE CATÁLOGO (dadossiqi.js original): NIST WebBook,
   CRC Handbook, Toda Matéria, InfoEscola, Manual da Química,
   Infopédia, Scientia, Wikipédia (pt) — valores verificados em
   múltiplas fontes. Dados dos módulos 2 (Construtor) e 3 (Redox):
   IUPAC Red Book 2005; Brown, LeMay & Bursten (2012) "Chemistry: The
   Central Science", 12ª ed.; Zumdahl & Zumdahl (2009) "Chemistry",
   8ª ed. BNCC: EF09CI05 e EF09CI07.
   Depende de: nada. Usado por: js/nomenclatura/*, js/core/*.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Metadados das funções inorgânicas ──────────────────────── */
var FUNCAO_META = {
  acido: {
    label: 'Ácido',
    desc:  'Doa prótons H⁺ em solução aquosa (Brønsted-Lowry)',
    cor:   '#F87171',
  },
  base: {
    label: 'Base',
    desc:  'Aceita prótons / libera OH⁻ em solução aquosa',
    cor:   '#4ADE80',
  },
  sal: {
    label: 'Sal',
    desc:  'Produto de neutralização: cátion + ânion iônico',
    cor:   '#FACC15',
  },
  oxido: {
    label: 'Óxido',
    desc:  'Composto binário: elemento + oxigênio',
    cor:   '#FB923C',
  },
};

/* ── Categorias para filtro de busca ────────────────────────── */
var CATEGORIAS_SIQI = [
  { id:'todos',  label:'Todos'  },
  { id:'acido',  label:'Ácidos' },
  { id:'base',   label:'Bases'  },
  { id:'sal',    label:'Sais'   },
  { id:'oxido',  label:'Óxidos' },
];

