/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: icones-estado.js
   ───────────────────────────────────────────────────────────────
   Os pequenos ícones SVG de estado físico (sólido/líquido/gasoso/
   desconhecido) usados nas células da tabela e no guia, e a função
   que os aplica onde há um data-ico-estado no HTML.
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* Icones SVG usados em markup gerado por JavaScript. Os do estado
   fisico NAO estao aqui: moram em ESTADO_DOT (dadossitp.js), que e o
   ponto unico de verdade deles. Mesmas duas regras do molde: tamanho
   em 1em (herda font-size) e cor em currentColor (herda a cor do
   texto, entao acompanha tema e alto contraste sem JS). */
const ICO = {
  /* energia de ionizacao: atomo com sinal + no nucleo (ja perdeu eletron)
     e uma seta diagonal saindo. Silhueta = circulo com cruz + seta.
     NAO pode ser o icone de eletronegatividade espelhado: os dois eram
     o mesmo desenho com a seta invertida e, a 17px, ficavam
     indistinguiveis — parecia botao repetido. */
  ionizacao: '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="9.6" cy="14.2" r="5.5"/><line x1="7.4" y1="14.2" x2="11.8" y2="14.2"/><line x1="9.6" y1="12" x2="9.6" y2="16.4"/><line x1="14.4" y1="9.4" x2="19.2" y2="4.6"/><polyline points="15.6,4.4 19.6,4.4 19.6,8.4"/></svg>',
  /* eletronegatividade: a LIGACAO entre dois atomos de tamanhos
     diferentes, com o par de eletrons deslocado para o maior. E o que a
     propriedade mede: quem puxa o par da ligacao.
     Silhueta = DOIS circulos que se tocam, deliberadamente diferente da
     de ionizacao (um circulo com cruz). */
  en:        '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="7" cy="12" r="4.1"/><circle cx="17" cy="12" r="5.5"/><circle cx="14.2" cy="12" r="1.5" fill="currentColor" stroke="none"/></svg>',
  raio:      '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="8.5" stroke-dasharray="2.4 2.2"/><circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none"/><line x1="12" y1="12" x2="20.5" y2="12"/><polyline points="18.1,9.7 20.5,12 18.1,14.3"/></svg>',
  aviso:     '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 4.2 2.6 20.4h18.8L12 4.2z"/><line x1="12" y1="10.2" x2="12" y2="14.8"/><circle cx="12" cy="17.6" r="1.15" fill="currentColor" stroke="none"/></svg>',
  telacheia: '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="4.2,9.2 4.2,4.2 9.2,4.2"/><polyline points="14.8,4.2 19.8,4.2 19.8,9.2"/><polyline points="19.8,14.8 19.8,19.8 14.8,19.8"/><polyline points="9.2,19.8 4.2,19.8 4.2,14.8"/></svg>',
  livro:     '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 6.5S9.9 4.7 5.6 4.7v12.9S9.9 17.6 12 19.4c2.1-1.8 6.4-1.8 6.4-1.8V4.7C14.1 4.7 12 6.5 12 6.5z"/><line x1="12" y1="6.5" x2="12" y2="19.4"/></svg>',
  seta:      '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="9.8,5.6 16.2,12 9.8,18.4"/></svg>'
};

// Preenche os placeholders <... data-ico-estado="S"> do guia com o
// icone de ESTADO_DOT, para o desenho nao ficar duplicado no HTML.
function preencherIconesEstado(){
  document.querySelectorAll('[data-ico-estado]').forEach(n=>{
    n.innerHTML = ESTADO_DOT[n.dataset.icoEstado] || '';
  });
}

