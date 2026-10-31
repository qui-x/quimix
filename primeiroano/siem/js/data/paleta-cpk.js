/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: paleta-cpk.js
   ───────────────────────────────────────────────────────────────
   Cores CPK (convenção Corey-Pauling-Koltun) por elemento químico —
   a mesma paleta usada universalmente em modelos moleculares.
   Exposto globalmente (window.CPK) para uso tanto pela simulação 2D
   quanto pela visão 3D, sem duplicar a tabela em dois lugares.
   Depende de: nada.
   Usado por: js/simulation/simulation-render.js,
              js/app/app-dados-medidas.js, js/view3d/view3d.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

const CPK = {
  H:  '#f0f4f8',   // hidrogênio: branco/cinza muito claro
  C:  '#3a3a3a',   // carbono: cinza escuro/preto
  N:  '#3050f8',   // nitrogênio: azul
  O:  '#ff3030',   // oxigênio: vermelho
  Na: '#ab5cf2',   // sódio: violeta
  Cl: '#1ff01f',   // cloro: verde
  Hg: '#b8b8d0',   // mercúrio: cinza azulado
  Fe: '#e06633',   // ferro: laranja-marrom
  He: '#d9ffff',   // hélio: ciano muito claro
  S:  '#ffc832',   // enxofre: amarelo
  F:  '#90e050',   // flúor: verde claro
  Br: '#a62929',   // bromo: vermelho-marrom
  I:  '#940094',   // iodo: violeta escuro
  K:  '#8f40d4',   // potássio: violeta
  Ne: '#b3e3f5',   // neônio: ciano claro
  Ar: '#80d1e3',   // argônio: ciano
  Si: '#daa520',   // silício: dourado
  Al: '#bfa6a6',   // alumínio: cinza rosado
  Cu: '#c88033',   // cobre: cobre
  Zn: '#7d80b0',   // zinco: azul-acinzentado
  Ca: '#3dff00',   // cálcio: verde vivo
  Mg: '#8aff00',   // magnésio: verde claro
  P:  '#ff8000',   // fósforo: laranja
  Li: '#cc80ff',   // lítio: violeta claro
  B:  '#ffb5b5',   // boro: rosa claro
  Ba: '#00c900',   // bário: verde escuro
  Sr: '#00ff00',   // estrôncio: verde vivo
  Mn: '#9c7ac7',   // manganês: violeta acinzentado
  Cr: '#8a99c7',   // cromo: azul acinzentado
  Ni: '#50d050',   // níquel: verde
  Ti: '#bfc2c7',   // titânio: cinza claro
};
// Exposto globalmente para que script.js e view3d.js reutilizem a
// mesma paleta CPK, sem duplicar a tabela de cores em outro arquivo.
window.CPK = CPK;
