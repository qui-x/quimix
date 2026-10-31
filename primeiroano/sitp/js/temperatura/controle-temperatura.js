/* ═══════════════════════════════════════════════════════════════
   CAMADA: TEMPERATURA
   ARQUIVO: controle-temperatura.js
   ───────────────────────────────────────────────────────────────
   O slider de temperatura do cabeçalho: escala não-linear (mais
   espaço perto de 25°C, onde a maioria das transições de estado
   interessantes acontece), determina o estado físico de cada
   elemento na temperatura escolhida (incluindo elementos que
   sublimam, sem fase líquida a 1 atm), e recolore a tabela inteira
   ao arrastar.
   Depende de: dadossitp.js (FUSAO, EBULICAO, TEMP_REF/MIN/MAX).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* =====================================================================
   CONTROLE DE TEMPERATURA — estado físico calculado
   ---------------------------------------------------------------------
   Isto NÃO é um modo de propriedade e não entra em PROPRIEDADES. Os
   modos trocam o que o card MOSTRA; este controle troca um dado
   DERIVADO (o estado físico) que a tabela toda já usava como fixo.
   Por isso tem mecânica própria: um parâmetro global, tempAtual, e uma
   função de recálculo.

   ESTADO[Z] continua existindo e continua sendo a referência da IUPAC a
   25 °C. Em TEMP_REF o cálculo devolve exatamente ela — validado nos
   118 elementos. Fora de 25 °C, quem manda é o cálculo.
   ===================================================================== */
let tempAtual = TEMP_REF;

/* Mapeamento não-linear do controle. Uma régua linear de -273 a 6000 °C
   deixaria a faixa de -273 a 500, onde estão mais de 60 transições, em
   12% do curso. Com expoente TEMP_CURVA o início anda pouco e o fim
   anda muito, dando resolução fina onde as transições estão. */
function posParaTemp(pos){
  const f = Math.max(0, Math.min(1, pos / TEMP_PASSOS));
  return Math.round(TEMP_MIN + (TEMP_MAX - TEMP_MIN) * Math.pow(f, TEMP_CURVA));
}

function tempParaPos(t){
  const f = (t - TEMP_MIN) / (TEMP_MAX - TEMP_MIN);
  return Math.round(TEMP_PASSOS * Math.pow(Math.max(0, f), 1 / TEMP_CURVA));
}

/* Estado físico de Z na temperatura t. Os casos sem dado são tratados
   um por um, em vez de virarem tudo "desconhecido":
     sem fusão e sem ebulição -> desconhecido de fato
     sem fusão, com ebulição  -> não solidifica a 1 atm (é o hélio):
                                 líquido abaixo da ebulição, gás acima
     com fusão, sem ebulição  -> sólido abaixo da fusão, líquido acima;
                                 nunca declara gás sem ter o dado */
function estadoNaTemperatura(Z, t){
  const f = FUSAO[Z], e = EBULICAO[Z];
  if(f === null && e === null) return '?';
  if(f === null) return (e !== null && t >= e) ? 'G' : 'L';
  /* SUBLIMAÇÃO: quando a ebulição é MENOR que a fusão, o elemento passa
     de sólido direto a gás e nunca é líquido a 1 atm. É o caso do
     arsênio (funde a 817, sublima a 614). Sem este ramo o cálculo o
     daria como líquido entre 614 e 817, uma faixa em que ele não
     existe como líquido. */
  if(e !== null && e < f) return (t < e) ? 'S' : 'G';
  if(t < f) return 'S';
  if(e === null) return 'L';
  return (t < e) ? 'L' : 'G';
}

// true quando o elemento sublima a 1 atm (ebulição abaixo da fusão)
function sublima(Z){
  const f = FUSAO[Z], e = EBULICAO[Z];
  return f !== null && e !== null && e < f;
}

/* Rótulo acessível base, recomposto: o estado entra nele, então muda
   junto com a temperatura. Antes era montado uma vez no criarEl. */
function montarRotuloBase(div){
  const est = div.dataset.est || '?';
  const per = parseInt(div.dataset.periodo) || 0;
  div.dataset.rotuloBase = `${div.dataset.nome}, símbolo ${div.dataset.simbolo}, `
    + `número atômico ${div.dataset.z}, ${div.dataset.cat}, `
    + `estado ${ESTADO_LABEL[est]}${per ? ', período ' + per : ''}`;
}

/* Aplica a temperatura: recalcula o estado de cada card, repinta o
   ícone (que vem de ESTADO_DOT, ponto único de verdade) e refaz os
   rótulos. Reaplica o filtro, senão ele continuaria filtrando pelo
   estado antigo. */
function aplicarTemperatura(t, silencioso){
  tempAtual = t;
  const tabela = document.getElementById('periodic-table');
  if(tabela){
    if(t === TEMP_REF) tabela.removeAttribute('data-temp-fora');
    else               tabela.setAttribute('data-temp-fora','');
  }
  document.querySelectorAll('.element[data-z]:not(.serie-toggle)').forEach(div=>{
    const Z = parseInt(div.dataset.z) || 0;
    const est = estadoNaTemperatura(Z, t);
    if(div.dataset.est !== est){
      div.dataset.est = est;
      const dot = div.querySelector('.state-dot');
      if(dot) dot.innerHTML = ESTADO_DOT[est] || '';
    }
    montarRotuloBase(div);
  });
  atualizarRotulos();
  if(typeof aplicarDim === 'function') aplicarDim();
  else if(typeof tabindexMovel === 'function') tabindexMovel();
  const out = document.getElementById('tempOut');
  if(out) out.textContent = `${t} °C`;
  const lbl = document.getElementById('lblStates');
  if(lbl) lbl.textContent = rotuloEstadoLegenda();
  const sl = document.getElementById('tempSlider');
  if(sl){
    sl.setAttribute('aria-valuetext', `${t} graus Celsius`);
    if(parseInt(sl.value) !== tempParaPos(t)) sl.value = tempParaPos(t);
  }
  const btn = document.getElementById('btnTempReset');
  if(btn) btn.hidden = (t === TEMP_REF);
  if(!silencioso) anunciarTemperatura(t);
}

/* Anúncio resumido: ler 118 mudanças seria inútil, então informa a
   temperatura e a contagem por estado. Com atraso, para o arraste do
   controle não gerar uma fila de anúncios. */
let _tempAnuncio = null;

function anunciarTemperatura(t){
  clearTimeout(_tempAnuncio);
  _tempAnuncio = setTimeout(()=>{
    const c = {S:0,L:0,G:0,'?':0};
    document.querySelectorAll('.element[data-z]:not(.serie-toggle)')
      .forEach(d=>{ c[d.dataset.est] = (c[d.dataset.est]||0) + 1; });
    anunciar(t === TEMP_REF
      ? `Temperatura de volta a 25 graus Celsius, a referência da tabela. ${c.S} sólidos, ${c.L} líquidos, ${c.G} gasosos.`
      : `${t} graus Celsius. ${c.S} elementos sólidos, ${c.L} líquidos, ${c.G} gasosos, ${c['?']} sem dado.`);
  }, 600);
}

// Rotulo da legenda de estado: acompanha a temperatura do controle.
function rotuloEstadoLegenda(){
  return `Estado Físico (${tempAtual} °C · 1 atm)`;
}

function montarControleTemperatura(){
  const sl = document.getElementById('tempSlider');
  if(!sl) return;
  sl.min = 0; sl.max = TEMP_PASSOS; sl.step = 1;
  sl.value = tempParaPos(TEMP_REF);
  sl.addEventListener('input', ()=>aplicarTemperatura(posParaTemp(parseInt(sl.value))));
  const btn = document.getElementById('btnTempReset');
  if(btn){
    btn.hidden = true;
    btn.addEventListener('click', ()=>aplicarTemperatura(TEMP_REF));
  }
}

