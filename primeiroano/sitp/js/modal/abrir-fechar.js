/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODAL
   ARQUIVO: abrir-fechar.js
   ───────────────────────────────────────────────────────────────
   Monta e abre a ficha completa de um elemento (todas as seções:
   estado físico, configuração, raio, propriedades, obtenção,
   curiosidade) e fecha o modal — incluindo o atalho de teclado Esc.
   Depende de: modal/estado-modal.js, modal/secoes-mobile.js (monta a
               barra de abas do bottom sheet mobile), modal/navegacao.js
               (atualiza os botões Anterior/Próximo), render/imagem-
               fundo.js (foto de fundo do cabeçalho) e praticamente
               todos os módulos de render/. Também liga o gesto de
               arrastar o cabeçalho pra baixo pra fechar (mobile).
═══════════════════════════════════════════════════════════════ */

'use strict';

function abrirModal(el,divEl){
  // estado na temperatura ATUAL do controle, para o modal não contradizer
  // o card que o usuário acabou de clicar
  const est=estadoNaTemperatura(el.numero, tempAtual);
  const cc=CAT_COLOR[el.cat]||'var(--text-dim)';
  const ccHex=getCatColorHex(el.cat)||'#888';
  const estHex=getEstadoHex(est);
  if(elementoAtivo===el.numero){fecharModal();return;}
  if(divAtiva)divAtiva.classList.remove('selected');
  elementoAtivo=el.numero;divAtiva=divEl;divEl.classList.add('selected');
  // Plano de fundo do cabeçalho: foto real do elemento (ver
  // js/render/imagem-fundo.js e js/data/imagem-elemento.js).
  aplicarFotoElemento(el.numero);
  const sym=document.getElementById('modalSymbol');
  sym.textContent=el.simbolo;sym.style.color=ccHex;
  document.getElementById('modalNumber').textContent='#'+el.numero;
  const nm=document.getElementById('modalName');
  nm.textContent=el.nome;nm.style.color=ccHex;
  (()=>{
    /* No modal cabe o intervalo completo, que no card seria truncado.
       O intervalo NÃO é imprecisão de medida: é variação natural da
       abundância isotópica, e por isso vale explicar em vez de esconder. */
    const iv = MASSA_INTERVALO[el.numero];
    const box = document.getElementById('modalMass');
    box.textContent = 'Massa: ' + (MASSA[el.numero]||'—') + ' u';
    if(iv){
      const nota = document.createElement('span');
      nota.className = 'modal-mass-intervalo';
      nota.textContent = `intervalo [${iv[0]}; ${iv[1]}] u`;
      nota.title = 'A massa atômica deste elemento varia naturalmente conforme a origem da amostra, por causa da variação na abundância dos seus isótopos. A CIAAW publica um intervalo em vez de um valor único.';
      box.appendChild(nota);
    }
  })();
  const familia=FAMILIA[el.grupo]||'—';
  const periodo=(el.periodo||0)<=7?el.periodo:(el.cat==='Lantanídeo'?6:7);
  document.getElementById('modalMeta').textContent='Família '+familia+' · Período '+periodo+' · '+el.cat;
  document.getElementById('modalBadges').innerHTML=
    (modoLamber ? '' : `<span class="badge" style="background:${estHex}22;color:${estHex};border-color:${estHex}55">${ESTADO_DOT[est]} ${ESTADO_LABEL[est]}</span>`)+
    `<span class="badge" style="background:${ccHex}22;color:${ccHex};border-color:${ccHex}55">${el.cat}</span>`+
    (modoLamber && LAMBER[el.numero] ? `<span class="badge lamber-badge" style="background:${LAMBER_HEX[LAMBER[el.numero]]}22;color:${LAMBER_HEX[LAMBER[el.numero]]};border-color:${LAMBER_HEX[LAMBER[el.numero]]}55">${LAMBER_EMOJI[LAMBER[el.numero]]} ${LAMBER_LABEL[LAMBER[el.numero]]}</span>` : '');
  document.getElementById('stateCard').style.borderLeftColor=estHex;
  document.getElementById('modalName').style.color=ccHex;
  (()=>{
    /* Card de estado físico: além da descrição, mostra os dois pontos que
       o cálculo usa, e a temperatura corrente quando ela saiu de 25 °C.
       Assim o aluno vê DE ONDE veio o estado que está na tela. */
    // el.numero, não Z: o const Z de abrirModal é declarado depois deste
    // bloco e estaria na zona morta (TDZ)
    const zz = el.numero;
    const box = document.getElementById('modalState');
    const f = FUSAO[zz], e = EBULICAO[zz];
    const fmt = v => v === null ? '—' : String(v).replace('.', ',') + ' °C';
    box.innerHTML = `<p class="est-desc">${ESTADO_DESC[est]}</p>
      <div class="est-pontos">
        <span><b>Fusão</b> ${fmt(f)}</span>
        <span><b>${sublima(zz) ? 'Sublimação' : 'Ebulição'}</b> ${fmt(e)}</span>
      </div>`
      + (sublima(zz) ? `<p class="est-nota">A 1 atm este elemento passa de sólido direto a gás: nunca é líquido.</p>` : '')
      + (tempAtual !== TEMP_REF
        ? `<p class="est-temp-aviso">${ICO.aviso} Estado calculado a ${tempAtual} °C, e não na referência de ${TEMP_REF} °C.</p>`
        : '');
  })();
  const Z=el.numero,N=calcNeutrons(Z);
  document.getElementById('modalParticles').innerHTML=
    `<div class="particle-box"><span class="pval" style="color:var(--orb-d)">${Z}</span><span class="plabel">Prótons</span></div>`+
    `<div class="particle-box"><span class="pval" style="color:var(--orb-f)">${N}</span><span class="plabel">Nêutrons</span></div>`+
    `<div class="particle-box"><span class="pval" style="color:var(--orb-s)">${Z}</span><span class="plabel">Elétrons</span></div>`;
  document.getElementById('modalConfig').innerHTML=renderConfig(Z);
  document.getElementById('modalObtencao').textContent=el.obtencao||'—';
  document.getElementById('modalCuriosidade').textContent=CURIOSIDADES[el.numero]||'—';
  document.getElementById("modalRaio").innerHTML=renderRaio(Z,el,ccHex);
  renderCardsPropriedade(Z, el);
  // Bottom sheet mobile: monta a barra de abas (Estado físico,
  // Distribuição Eletrônica etc.) DEPOIS que todas as seções acima já
  // foram preenchidas — em telas largas isso não muda nada visualmente
  // (ver secoes-mobile.js e o CSS do @media 760px).
  montarAbasSecoesMobile();
  atualizarBotoesNavegacao();
  modalOverlay.classList.add('aberto');
  modalOverlay.setAttribute('aria-hidden','false');
  anunciar(`${el.nome}, número atômico ${Z}, ${el.cat}, ${ESTADO_LABEL[est]}.`);
  // Sem botão ✕ próprio: o modal em si (tabindex="-1" no HTML) recebe o
  // foco — Esc, toque fora, ou arrastar o cabeçalho pra baixo fecham.
  setTimeout(()=>document.getElementById('modal').focus(),260);
}

function fecharModal(){
  modalOverlay.classList.remove('aberto');
  modalOverlay.setAttribute('aria-hidden','true');
  document.querySelector('.modal-body').scrollTop = 0;
  if(divAtiva){divAtiva.classList.remove('selected');divAtiva.focus();}
  elementoAtivo=null;divAtiva=null;
  anunciar('Modal fechado.');
}

modalOverlay.addEventListener('click',e=>{if(e.target===modalOverlay)fecharModal();});

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modalOverlay.classList.contains('aberto'))fecharModal();});

modalOverlay.addEventListener('keydown',e=>{
  if(e.key!=='Tab')return;
  const foc=[...modalOverlay.querySelectorAll('button,[tabindex="0"],[href],input,select,textarea')].filter(el=>!el.disabled);
  const first=foc[0],last=foc[foc.length-1];
  if(e.shiftKey){if(document.activeElement===first){e.preventDefault();last.focus();}}
  else{if(document.activeElement===last){e.preventDefault();first.focus();}}
});

/* ── Arrastar pra fechar (bottom sheet mobile) ──────────────────────
   Só entra em ação em telas estreitas (ver innerWidth abaixo) — no
   modal centralizado do desktop essa mecânica não faz sentido, ele
   não é um "sheet" que desliza. Arrastar a partir de qualquer ponto
   do CABEÇALHO (símbolo, nome, alça) — nunca do corpo, pra não
   atrapalhar a rolagem das seções. Solta e: se arrastou bastante OU
   soltou rápido (gesto de "jogar pra baixo"), fecha; senão, volta pro
   lugar. As setas de navegação ficam de fora de propósito (checagem
   de e.target), senão tocar nelas também dispararia o arraste. */
function initDragToDismiss(){
  const header=document.querySelector('.modal-header');
  const modalEl=document.getElementById('modal');
  if(!header||!modalEl)return;
  let arrastando=false,inicioY=0,deltaY=0,inicioEm=0,ponteiro=null;

  function podeArrastar(e){
    if(window.innerWidth>760)return false;
    if(e.target.closest('.modal-nav-mini-btn'))return false;
    return true;
  }
  function aoPressionar(e){
    if(!podeArrastar(e))return;
    arrastando=true;ponteiro=e.pointerId;
    header.setPointerCapture(ponteiro);
    inicioY=e.clientY;deltaY=0;inicioEm=performance.now();
    modalEl.style.transition='none';
  }
  function aoMover(e){
    if(!arrastando||e.pointerId!==ponteiro)return;
    deltaY=Math.max(0,e.clientY-inicioY);
    modalEl.style.transform=`translateY(${deltaY}px)`;
  }
  function aoSoltar(e){
    if(!arrastando||e.pointerId!==ponteiro)return;
    arrastando=false;
    header.releasePointerCapture(ponteiro);
    modalEl.style.transition='';
    modalEl.style.transform='';
    const decorrido=Math.max(1,performance.now()-inicioEm);
    const velocidade=deltaY/decorrido; // px por ms
    if(deltaY>90||(deltaY>30&&velocidade>0.5))fecharModal();
  }
  header.addEventListener('pointerdown',aoPressionar);
  header.addEventListener('pointermove',aoMover);
  header.addEventListener('pointerup',aoSoltar);
  header.addEventListener('pointercancel',aoSoltar);
}
initDragToDismiss();

