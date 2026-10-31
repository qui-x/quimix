/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS (constantes de referência)
   ARQUIVO: estados-e-fenomenos.js
   ───────────────────────────────────────────────────────────────
   Vocabulário dos 3 estados físicos (nome, ícone, descrição) e dos
   6 fenômenos de mudança de estado (fusão, solidificação,
   vaporização, condensação, sublimação, ressublimação).
   Depende de: nada.
   Usado por: ui/render-cilindro.js, ui/render-medidas.js,
              core/fisica.js (detectarFenomeno).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── ESTADOS FÍSICOS ───
   O campo "icone" guarda a CHAVE do ícone SVG (ver <defs> de <symbol>
   no topo do indexsime.html: #ic-solid, #ic-liquid, #ic-gas), não mais
   um emoji. Quem consome este campo (render-cilindro.js) monta o
   <svg><use.../></svg> a partir dela. */
var ESTADOS = {
  SOLIDO:  { id:'solido',  nome:'Sólido',  icone:'solid',  descricao:'Forma e volume definidos. Não precisa de recipiente.' },
  LIQUIDO: { id:'liquido', nome:'Líquido', icone:'liquid', descricao:'Volume definido, forma variável. Adapta-se ao recipiente.' },
  GASOSO:  { id:'gasoso',  nome:'Gasoso',  icone:'gas',    descricao:'Sem forma nem volume definidos. Preenche todo o espaço disponível.' },
};

/* ─── FENÔMENOS ───
   Mesma lógica: "icone" é a chave do símbolo SVG, não um emoji. */
var FENOMENOS = {
  FUSAO:        { nome:'Fusão',         descricao:'Sólido → Líquido', icone:'flame',  cor:'#FF8C00' },
  SOLIDIFICACAO:{ nome:'Solidificação', descricao:'Líquido → Sólido', icone:'snow',   cor:'#00D4FF' },
  VAPORIZACAO:  { nome:'Vaporização',   descricao:'Líquido → Gasoso', icone:'gas',    cor:'#FF4500' },
  CONDENSACAO:  { nome:'Condensação',   descricao:'Gasoso → Líquido', icone:'liquid', cor:'#7C3AED' },
  SUBLIMACAO:   { nome:'Sublimação',    descricao:'Sólido → Gasoso',  icone:'gas',    cor:'#EC4899' },
  RESSUBLIMACAO:{ nome:'Ressublimação', descricao:'Gasoso → Sólido',  icone:'solid',  cor:'#06B6D4' },
};
