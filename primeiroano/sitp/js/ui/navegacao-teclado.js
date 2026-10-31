/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (acessibilidade)
   ARQUIVO: navegacao-teclado.js
   ───────────────────────────────────────────────────────────────
   Navegação da tabela periódica pelas setas do teclado (grid real,
   não uma lista) — registra a posição de cada célula, encontra a
   vizinha na direção certa, e mantém um único elemento com
   tabindex="0" por vez (roving tabindex, padrão WAI-ARIA para
   grids).
   Depende de: modal/estado-modal.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function registrarPosicao(el,div){const key=`${el.periodo||0}_${el.grupo}`;if(!posicaoMap[key])posicaoMap[key]=[];posicaoMap[key].push(div);}

/* Devolve o vizinho NAVEGAVEL: pula card atenuado por filtro (que e
   aria-hidden e tem tabindex -1) e card de serie recolhida (display:none).
   Antes devolvia o primeiro da lista, e a seta pousava num card que o
   leitor de tela nao anuncia. */
function vizinho(g,p){
  return (posicaoMap[`${p}_${g}`] || []).find(cardNavegavel) || null;
}

/* ── TABINDEX MOVEL (roving tabindex) ─────────────────────────────────
   Antes o container e os 118 cards tinham tabindex="0": 119 paradas de
   Tab. Quem navega por teclado passava por 118 cards antes de alcancar a
   legenda, e nao havia como sair da tabela sem atravessar tudo.

   O padrao ARIA de grade pede UMA parada: so o card "atual" tem
   tabindex="0", todos os outros "-1", e as SETAS movem o foco. Tab entra
   na grade e Tab sai dela.

   O card atual e guardado em _cardAtual. Regras:
     - comeca no hidrogenio (primeiro card navegavel)
     - andar com as setas move o tabindex="0" junto do foco
     - card atenuado por filtro nunca e o atual (e aria-hidden)
     - se o atual sair de cena (filtro ou serie recolhida), escolhe outro
   -------------------------------------------------------------------- */
let _cardAtual = null;

/* Criterio ESTRUTURAL, nao de layout. A versao anterior usava
   offsetParent !== null, que depende de o navegador ja ter calculado
   layout — funciona no browser, mas nao e testavel e falha se chamada
   antes do primeiro paint.
   As tres condicoes cobrem os unicos casos em que um card nao e
   navegavel: atenuado por filtro, marcado como oculto, ou dentro de uma
   serie recolhida (a unica regra display:none que atinge cards). */
function cardNavegavel(d){
  return !!d && !d.classList.contains('dim')
             && d.getAttribute('aria-hidden') !== 'true'
             && !d.closest('.linha-serie.recolhida');
}

/* Faz de `div` o unico card na ordem de tabulacao. */
function definirCardAtual(div){
  if(!div) return;
  if(_cardAtual && _cardAtual !== div) _cardAtual.setAttribute('tabindex','-1');
  _cardAtual = div;
  div.setAttribute('tabindex','0');
}

/* Recalcula quem deve ser o atual. Chamada no render e a cada mudanca de
   filtro, temperatura ou serie — situacoes em que o card atual pode ter
   deixado de ser navegavel. */
function tabindexMovel(){
  /* :not(.serie-toggle) — os dois botoes de serie (La-Lu / Ac-Lr) tambem
     tem a classe .element e um data-z, mas sao CONTROLES independentes,
     com role=button e aria-expanded. Eles precisam continuar na ordem de
     tabulacao: o tabindex movel vale so para os 118 cards de elemento. */
  const todosCards = [...document.querySelectorAll('.element[data-z]:not(.serie-toggle)')];
  // ninguem em tabindex 0 alem do escolhido
  todosCards.forEach(d=>{ if(d !== _cardAtual) d.setAttribute('tabindex','-1'); });
  if(cardNavegavel(_cardAtual)){ _cardAtual.setAttribute('tabindex','0'); return; }
  const novo = todosCards.find(cardNavegavel);
  if(novo) definirCardAtual(novo);
  else _cardAtual = null;
}

function navegarTabela(e,div){
  const g=parseInt(div.dataset.grupo)||0,p=parseInt(div.dataset.periodo)||0;
  let alvo=null;
  if(e.key==='ArrowRight')alvo=vizinho(g+1,p)||vizinho(g+2,p)||vizinho(g+3,p);
  if(e.key==='ArrowLeft') alvo=vizinho(g-1,p)||vizinho(g-2,p)||vizinho(g-3,p);
  if(e.key==='ArrowDown') alvo=vizinho(g,p+1)||vizinho(g,p+2);
  if(e.key==='ArrowUp')   alvo=vizinho(g,p-1)||vizinho(g,p-2);
  if(alvo){e.preventDefault();definirCardAtual(alvo);alvo.focus();}
}

