/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS (constantes de referência)
   ARQUIVO: paleta-cores.js
   ───────────────────────────────────────────────────────────────
   Paletas de cor (sólido/líquido/gás) reutilizadas pelo catálogo
   de substâncias, para dar a cada material uma aparência visual
   coerente com sua identidade química (gelo azulado, metais
   prateados, halogênios coloridos etc.).
   Depende de: nada.
   Usado por: data/catalogo-substancias.js (carregar este arquivo
              ANTES do catálogo — as substâncias referenciam COR.*
              diretamente na hora de montar a lista).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─── Paletas de cor reutilizáveis ─────────────────────────── */
var COR = {
  /* sólidos */
  geloAzul:   ['#BFE0FF','#7EC8FF','#5BAAEE','#3A88CC'],
  gelo2:      ['#E0F2FF','#B8DEFF','#8AC8F5','#5AAEDE'],
  gelo3:      ['#C8E8FF','#9BC8FF','#6AACF0','#4090D8'],
  branco:     ['#F0F0F0','#DCDCDC','#C0C0C0','#A0A0A0'],
  cinzaEscuro:['#909090','#707070','#505050','#303030'],
  cinzaMed:   ['#B0B8C8','#909AAA','#707888','#505868'],
  cinzaCla:   ['#D0D8E8','#B0BDD0','#8898B8','#6075A0'],
  amareloVivo:['#FFE84A','#FFD020','#E8B000','#C89000'],
  amareloP:   ['#FFFACD','#FFE680','#FFD020','#E8B800'],
  laranja:    ['#FFD0A0','#FFB060','#FF8C20','#E06800'],
  vermelho:   ['#FFB0A0','#FF8070','#EE4040','#CC2020'],
  roxo:       ['#E0C0FF','#C090EE','#A060DD','#7830BB'],
  rosa:       ['#FFE0F0','#FFB8D8','#FF90C0','#E870A8'],
  verdeClaro: ['#C8FFD0','#90EEA0','#50CC60','#30AA40'],
  marrom:     ['#D0A880','#B08060','#905040','#703020'],
  dourado:    ['#FFE880','#FFD040','#E8A800','#C08000'],
  prata:      ['#E8E8F0','#C8C8D8','#A0A0B8','#808098'],
  bronze:     ['#E0C090','#C09A60','#A07040','#804820'],
  cobre:      ['#FFB880','#E08850','#C05828','#A03010'],
  /* líquidos */
  liqAzul:    ['rgba(74,158,255,0.8)','rgba(30,100,200,0.9)','rgba(10,40,130,0.95)'],
  liqAzulCla: ['rgba(100,180,255,0.75)','rgba(60,140,230,0.88)','rgba(20,90,190,0.95)'],
  liqAzulGel: ['rgba(180,220,255,0.75)','rgba(130,190,240,0.88)','rgba(80,150,210,0.95)']  ,
  liqBrancoAz:['rgba(200,230,255,0.75)','rgba(160,200,240,0.88)','rgba(110,160,210,0.95)'],
  liqAmbar:   ['rgba(255,200,100,0.78)','rgba(230,160,60,0.90)','rgba(200,120,20,0.95)'],
  liqRosa:    ['rgba(255,160,210,0.78)','rgba(230,110,170,0.90)','rgba(200,60,130,0.95)'],
  liqVermelho:['rgba(255,100,100,0.80)','rgba(220,50,50,0.90)','rgba(180,20,20,0.95)'],
  liqLaranja: ['rgba(255,165,80,0.80)','rgba(230,120,40,0.90)','rgba(200,80,10,0.95)'],
  liqRoxo:    ['rgba(180,100,255,0.78)','rgba(140,60,220,0.90)','rgba(100,20,180,0.95)'],
  liqVerde:   ['rgba(100,200,120,0.78)','rgba(60,160,80,0.90)','rgba(20,120,40,0.95)'],
  liqVerdeCla:['rgba(140,220,150,0.75)','rgba(90,180,100,0.88)','rgba(40,140,60,0.95)'],
  liqCinza:   ['rgba(160,175,195,0.82)','rgba(130,145,170,0.92)','rgba(90,105,140,0.97)'],
  liqPrata:   ['rgba(180,195,215,0.82)','rgba(150,165,195,0.92)','rgba(100,115,155,0.97)'],
  liqDourado: ['rgba(255,215,80,0.80)','rgba(230,175,40,0.90)','rgba(200,135,10,0.95)'],
  liqMarrom:  ['rgba(200,150,100,0.80)','rgba(170,110,60,0.90)','rgba(140,70,20,0.95)'],
  liqAmarelo: ['rgba(255,240,100,0.78)','rgba(240,210,50,0.90)','rgba(210,175,10,0.95)'],
  liqIncolor: ['rgba(220,235,255,0.65)','rgba(190,210,240,0.78)','rgba(160,185,220,0.90)'],
  liqFusao:   ['rgba(255,120,40,0.85)','rgba(220,80,10,0.92)','rgba(180,40,0,0.97)'],
  /* gases */
  gasRoxo:    'rgba(139,92,246,0.07)',
  gasAzul:    'rgba(100,180,255,0.05)',
  gasAzulCla: 'rgba(180,220,255,0.05)',
  gasBranco:  'rgba(200,210,230,0.05)',
  gasVerde:   'rgba(100,200,120,0.05)',
  gasAmbar:   'rgba(255,200,100,0.05)',
  gasLaranja: 'rgba(255,140,60,0.05)',
  gasVermelho:'rgba(255,80,80,0.05)',
  gasRosa:    'rgba(255,160,210,0.05)',
  gasAmarelo: 'rgba(255,240,80,0.05)',
  /* blobs de gás */
  blobRoxo:   ['rgba(139,92,246,0.18)','rgba(167,130,255,0.15)','rgba(139,92,246,0.14)','rgba(200,170,255,0.12)'],
  blobAzul:   ['rgba(100,180,255,0.15)','rgba(80,160,240,0.12)','rgba(100,180,255,0.1)','rgba(130,200,255,0.09)'],
  blobAzulCla:['rgba(180,220,255,0.15)','rgba(150,200,245,0.12)','rgba(180,220,255,0.1)','rgba(200,230,255,0.09)'],
  blobBranco: ['rgba(200,210,230,0.15)','rgba(180,195,220,0.12)','rgba(200,210,230,0.1)','rgba(215,223,240,0.09)'],
  blobVerde:  ['rgba(100,200,120,0.16)','rgba(80,180,100,0.13)','rgba(100,200,120,0.11)','rgba(120,215,140,0.10)'],
  blobAmbar:  ['rgba(255,200,100,0.16)','rgba(240,175,70,0.13)','rgba(255,200,100,0.11)','rgba(255,215,130,0.10)'],
  blobLaranja:['rgba(255,140,60,0.16)','rgba(240,115,40,0.13)','rgba(255,140,60,0.11)','rgba(255,165,90,0.10)'],
  blobRosa:   ['rgba(255,160,210,0.16)','rgba(240,130,185,0.13)','rgba(255,160,210,0.11)','rgba(255,180,220,0.10)'],
  blobAmarelo:['rgba(255,240,80,0.16)','rgba(245,220,60,0.13)','rgba(255,240,80,0.11)','rgba(255,248,110,0.10)'],
};
