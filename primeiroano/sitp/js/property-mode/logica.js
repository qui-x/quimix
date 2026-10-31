/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODO PROPRIEDADE
   ARQUIVO: logica.js
   ───────────────────────────────────────────────────────────────
   Colore a tabela periódica INTEIRA por uma propriedade contínua
   (eletronegatividade ou energia de ionização): busca a propriedade
   pelo id, calcula o valor de cada elemento, formata para exibição,
   pinta cada célula na escala de cor correspondente, e monta os
   botões de alternância no cabeçalho.
   Depende de: dadossitp.js (PROPRIEDADES), core/escala-propriedade.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* =====================================================================
   MOTOR GENÉRICO DE MODOS DE PROPRIEDADE
   ---------------------------------------------------------------------
   Um único mecanismo para todas as entradas de PROPRIEDADES
   (dadossitp.js). Substituiu aplicarModoRaio/toggleModoRaio e
   aplicarModoEN/toggleModoEN, que eram quase idênticas.

   EXCLUSÃO MÚTUA VEM DE GRAÇA: o estado mora num único atributo,
   data-modo="<id>" no #periodic-table. Um atributo só pode ter um valor,
   então é impossível dois modos ficarem ligados ao mesmo tempo — antes
   isso dependia de duas funções lembrarem de se desligar uma à outra.

   ZERO CSS NOVO POR PROPRIEDADE: o CSS não conhece "raio" nem "en".
   Ele reage a data-modo (qualquer valor), data-modo-desenho e
   data-modo-mapa, que saem do campo `visual` da propriedade. Cada card
   tem UM elemento de valor e UM de desenho, cujo conteúdo é preenchido
   na troca de modo, em vez de um par de elementos por propriedade.
   ===================================================================== */
let modoAtivo = null;                       // id da propriedade, ou null

function propriedadePorId(id){ return PROPRIEDADES.find(p => p.id === id) || null; }

// Lê o número de uma propriedade para o elemento Z, ou null se não houver.
function valorPropriedade(prop, Z){
  const linha = prop.tabela ? prop.tabela[Z] : undefined;
  if(linha === null || linha === undefined) return null;
  const v = prop.campo ? linha[prop.campo] : linha;
  return (typeof v === 'number' && isFinite(v)) ? v : null;
}

// Impressão em pt-BR: vírgula decimal. Só o número, sem unidade —
// o rótulo acessível escreve a unidade por extenso ("picômetros") e
// somar as duas daria "31 pm picômetros".
function numeroPropriedade(prop, v){
  if(v === null) return '—';
  return v.toFixed(prop.decimais).replace('.', ',');
}

// Para o card: número + unidade abreviada.
function formatarPropriedade(prop, v){
  if(v === null) return '—';
  return numeroPropriedade(prop, v) + prop.unidade;
}

/* Complemento opcional do rótulo acessível: um segundo campo da mesma
   tabela, traduzido por uma tabela de rótulos. É o que preserva o tipo
   de raio ("Covalente (ligação simples)"), que a tela não mostra mas o
   leitor de tela anunciava. Declarado em campoExtra + tabelaExtra. */
function extraPropriedade(prop, Z){
  if(!prop.campoExtra || !prop.tabelaExtra || !prop.tabela) return '';
  const linha = prop.tabela[Z];
  if(!linha) return '';
  const chave = linha[prop.campoExtra];
  const rotulo = prop.tabelaExtra[chave];
  return rotulo ? ` — ${rotulo}` : '';
}

// Posição de 0 a 1 dentro da faixa declarada — serve ao tamanho do
// círculo e à posição na rampa de cor.
function fracaoPropriedade(prop, v){
  if(v === null) return 0;
  const span = prop.vmax - prop.vmin;
  if(!(span > 0)) return 0;
  return Math.max(0, Math.min(1, (v - prop.vmin) / span));
}

/* Escreve no card tudo que a propriedade ativa exige: texto do valor,
   tamanho e cor do desenho, tonalidade de fundo e cor de texto legível.
   Uma passada por card, sem recriar nada. */
function pintarCardPropriedade(div, prop, paleta){
  const Z = parseInt(div.dataset.z) || 0;
  const alvoValor   = div.querySelector('.el-prop-valor');
  const alvoDesenho = div.querySelector('.el-prop-desenho');
  if(!prop){
    div.removeAttribute('data-prop-sem-dado');
    ['--prop-frac','--prop-cor','--prop-glow','--prop-bg','--prop-txt']
      .forEach(v => div.style.removeProperty(v));
    return;
  }
  const v = valorPropriedade(prop, Z);
  if(alvoValor) alvoValor.textContent = formatarPropriedade(prop, v);
  if(v === null) div.setAttribute('data-prop-sem-dado','');
  else           div.removeAttribute('data-prop-sem-dado');

  if(prop.visual === 'circulo'){
    const frac = fracaoPropriedade(prop, v);
    if(alvoDesenho) alvoDesenho.style.setProperty('--prop-frac', frac.toFixed(3));
    const cor = corDesenhoPropriedade(div, prop, paleta);
    div.style.setProperty('--prop-cor', cor);
    div.style.setProperty('--prop-glow', hexToRgba(cor, 0.5));
    div.style.removeProperty('--prop-bg');
    div.style.removeProperty('--prop-txt');
  }else if(prop.visual === 'mapa'){
    if(v === null){
      div.style.removeProperty('--prop-bg');
      div.style.removeProperty('--prop-txt');
    }else{
      const bruto = corNaEscala(prop, v);
      const txt   = corTextoSobre(bruto);
      div.style.setProperty('--prop-bg', ajustarFundoParaContraste(bruto, txt));
      div.style.setProperty('--prop-txt', txt);
    }
  }
}

/* Cor do desenho. corBloco=true usa a cor do bloco s/p/d/f, a mesma do
   círculo do modal; no easter egg segue o hex do lamber para não brigar
   com a borda e o sticker do card. */
function corDesenhoPropriedade(div, prop, paleta){
  const Z = parseInt(div.dataset.z) || 0;
  if(modoLamber && LAMBER[Z]) return LAMBER_HEX[LAMBER[Z]];
  if(prop.corBloco) return paleta[div.dataset.bloco||''] || getCatColorHex(div.dataset.cat) || '#888888';
  return getCatColorHex(div.dataset.cat) || '#888888';
}

/* Repinta todos os cards. Chamada na troca de modo e por
   redesenharCores() quando muda tema, daltonismo ou alto contraste —
   ambos alteram as cores de bloco e a rampa do mapa de calor. */
function atualizarVisualPropriedade(){
  const prop = propriedadePorId(modoAtivo);
  const paleta = paletaOrbital(true);
  document.querySelectorAll('.element[data-z]:not(.serie-toggle)')
    .forEach(div => pintarCardPropriedade(div, prop, paleta));
}

/* Rótulo do leitor de tela: recomposto de dataset.rotuloBase. Num lugar
   só, senão ligar um modo apagaria o acréscimo do outro. */
function atualizarRotulos(){
  const prop = propriedadePorId(modoAtivo);
  document.querySelectorAll('.element[data-z]:not(.serie-toggle)').forEach(div=>{
    const base = div.dataset.rotuloBase || '';
    if(!base) return;
    if(!prop){ div.setAttribute('aria-label', base); return; }
    const Z = parseInt(div.dataset.z) || 0;
    const v = valorPropriedade(prop, Z);
    const extra = (v === null)
      ? prop.semDado
      : prop.a11yValor.replace('@', numeroPropriedade(prop, v)) + extraPropriedade(prop, Z);
    div.setAttribute('aria-label', `${base}, ${extra}`);
  });
}

/* Liga a propriedade indicada, ou desliga tudo com id null. */
function aplicarModoPropriedade(id){
  const prop = propriedadePorId(id);
  modoAtivo = prop ? prop.id : null;
  const tabela = document.getElementById('periodic-table');
  if(tabela){
    if(prop){
      tabela.setAttribute('data-modo', prop.id);
      // atributos derivados do tipo de visual: é só neles que o CSS mexe
      if(prop.visual === 'circulo'){ tabela.setAttribute('data-modo-desenho',''); tabela.removeAttribute('data-modo-mapa'); }
      else if(prop.visual === 'mapa'){ tabela.setAttribute('data-modo-mapa','');   tabela.removeAttribute('data-modo-desenho'); }
      else { tabela.removeAttribute('data-modo-desenho'); tabela.removeAttribute('data-modo-mapa'); }
    }else{
      ['data-modo','data-modo-desenho','data-modo-mapa'].forEach(a=>tabela.removeAttribute(a));
    }
  }
  PROPRIEDADES.forEach(pr=>{
    const b = document.getElementById('btnProp-'+pr.id);
    if(!b) return;
    const on = (pr.id === modoAtivo);
    b.classList.toggle('ativo', on);
    b.setAttribute('aria-pressed', String(on));
  });
  atualizarVisualPropriedade();
  atualizarRotulos();
}

function alternarModoPropriedade(id){
  const ligar = (modoAtivo !== id);
  aplicarModoPropriedade(ligar ? id : null);
  const prop = propriedadePorId(id);
  if(prop) anunciar(ligar ? prop.ligado : prop.desligado);
}

/* Botões gerados do registro: propriedade nova entra sem tocar no HTML. */
/* Botões gerados do registro, dentro da célula "Propriedades" da legenda.
   Levam ÍCONE + NOME: no cabeçalho eram só ícone por falta de espaço, e
   aqui há largura para o rótulo, o que dispensa o tooltip para saber o
   que cada um faz.
   Propriedade nova entra sem tocar em HTML nem em CSS. */
function montarBotoesPropriedade(){
  const cx = document.getElementById('legendPropsBotoes');
  if(!cx) return;
  cx.innerHTML = PROPRIEDADES.map(pr=>
    `<button type="button" id="btnProp-${pr.id}" class="legend-prop-item" aria-pressed="false"
             data-prop="${pr.id}" aria-label="Mostrar no card: ${pr.label}" title="${pr.titulo}">
       <span class="lp-ico" aria-hidden="true">${ICO[pr.icone] || ''}</span><span>${pr.label}</span>
     </button>`).join('');
  cx.querySelectorAll('button[data-prop]').forEach(b=>{
    b.addEventListener('click', ()=>alternarModoPropriedade(b.dataset.prop));
  });
}

