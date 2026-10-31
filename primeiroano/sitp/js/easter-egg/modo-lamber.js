/* ═══════════════════════════════════════════════════════════════
   CAMADA: EASTER EGG
   ARQUIVO: modo-lamber.js
   ───────────────────────────────────────────────────────────────
   O "modo lamber" — recolore a tabela pelo nível de perigo de lamber
   cada elemento (referência bem-humorada ao famoso vídeo educativo
   sobre a tabela periódica), com um banner de aviso e um easter egg
   de duplo-clique em alguns elementos específicos.
   Depende de: dadossitp.js (LAMBER, LAMBER_*).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* =====================================================================
   🥚 EASTER EGG — motor de ativação do "Posso lamber isso?"
   Sem dica visível: clique no ícone (grade 2x3) ao lado do título
   "SITP" no topo da página para ativar/desativar.
   ===================================================================== */
let modoLamber = false;

window.modoLamber = false;

function pintarModoLamber(ativar){
  // Paleta de bloco resolvida uma vez: o círculo do modo raio também é
  // repintado aqui, senão ficaria na cor do bloco enquanto o resto do
  // card já está nas cores do easter egg.
  const paletaLamber = paletaOrbital(true);
  const propAtiva = propriedadePorId(modoAtivo);
  document.querySelectorAll('.element[data-z]:not(.serie-toggle)').forEach(div=>{
    const Z=parseInt(div.dataset.z)||0;
    const dot=div.querySelector('.state-dot');
    if(dot) dot.style.visibility = ativar ? 'hidden' : '';
    // o desenho da propriedade ativa também segue as cores do easter egg
    pintarCardPropriedade(div, propAtiva, paletaLamber);
    const cat=LAMBER[Z];
    if(!cat) return;
    const sym=div.querySelector('.el-symbol');
    if(ativar){
      const hex=LAMBER_HEX[cat];
      div.style.setProperty('--cat-color',hex);
      if(sym) sym.style.color=hex;
      if(!div.querySelector('.lamber-sticker')){
        const st=document.createElement('div');
        st.className='lamber-sticker';
        st.setAttribute('aria-hidden','true');
        st.textContent=LAMBER_EMOJI[cat];
        div.appendChild(st);
      }
    }else{
      const hex=getCatColorHex(div.dataset.cat)||'#888';
      div.style.setProperty('--cat-color',hex);
      if(sym) sym.style.color=hex;
      div.querySelector('.lamber-sticker')?.remove();
    }
  });
}

window.__sitpPintarModoLamber = pintarModoLamber;

function mostrarBannerLamber(){
  if(document.getElementById('lamberBanner')) return;
  const b=document.createElement('div');
  b.id='lamberBanner';
  b.className='lamber-banner';
  b.setAttribute('role','status');
  b.innerHTML=
    `<span class="lamber-banner-txt">🍭 Modo secreto ativado: <strong>"Posso lamber isso?"</strong> — confira os novos filtros na tabela. Clique no ícone do título (ou Esc) para sair.</span>`+
    `<button type="button" class="lamber-banner-close" aria-label="Fechar e sair do modo secreto">✕</button>`;
  b.querySelector('.lamber-banner-close').addEventListener('click',toggleModoLamber);
  const header=document.querySelector('.app-header');
  if(header && header.parentNode){
    header.insertAdjacentElement('afterend', b);
  }else{
    document.body.appendChild(b);
  }
}

function removerBannerLamber(){
  document.getElementById('lamberBanner')?.remove();
}

function toggleModoLamber(){
  modoLamber=!modoLamber;
  window.modoLamber=modoLamber;
  document.body.classList.toggle('modo-lamber',modoLamber);
  const legLamber=document.getElementById('legendGridLamber');
  const legCats=document.querySelector('.legend-grid-cats');
  const legStates=document.querySelector('.legend-grid-states');
  const legProps=document.getElementById('legendGridProps');
  if(modoLamber){
    if(legLamber) legLamber.hidden=false;
    if(legCats) legCats.hidden=true;
    if(legStates) legStates.hidden=true;
    /* A celula de propriedades some junto: no easter egg os cards sao
       repintados com as cores da piada, e um mapa de calor por cima disso
       nao significaria nada. Desliga o modo ativo ANTES de esconder,
       senao o usuario ficaria sem o botao para desligar. */
    if(legProps){ if(modoAtivo) aplicarModoPropriedade(null); legProps.hidden=true; }
    pintarModoLamber(true);
    aplicarDim();
    mostrarBannerLamber();
    anunciar('Modo secreto ativado: Posso lamber isso? Novos filtros disponíveis.');
  }else{
    if(filtroLamber) aplicarFiltroLamber(filtroLamber);
    if(legLamber) legLamber.hidden=true;
    if(legCats) legCats.hidden=false;
    if(legStates) legStates.hidden=false;
    if(legProps) legProps.hidden=false;
    pintarModoLamber(false);
    removerBannerLamber();
    anunciar('Modo secreto desativado.');
  }
}

(function(){
  const logo = document.getElementById('logoEasterEgg');
  if (logo) {
    logo.addEventListener('click', toggleModoLamber);
    logo.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleModoLamber(); }
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modoLamber) toggleModoLamber();
  });
})();

