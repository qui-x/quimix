/* ═══════════════════════════════════════════════════════════════
   CAMADA: TABELA
   ARQUIVO: criar-celula.js
   ───────────────────────────────────────────────────────────────
   Constrói uma célula completa da tabela periódica: número, símbolo,
   nome, ícone de estado, cor de categoria, todos os atributos de
   acessibilidade (aria-label completo) e os data-* que o CSS e os
   filtros usam.
   Depende de: core/cores-estado.js, ui/icones-estado.js,
               dadossitp.js (BLOCO).
═══════════════════════════════════════════════════════════════ */

'use strict';

function criarEl(el){
  const div=document.createElement('div');
  div.className='element';
  div.dataset.cat=el.cat;div.dataset.z=el.numero;
  div.dataset.grupo=el.grupo;div.dataset.periodo=el.periodo||0;
  // estado inicial pelo CÁLCULO, não pela tabela fixa: em 25 °C os dois
  // coincidem nos 118 (validado), e assim o card nasce coerente com o
  // controle de temperatura
  const est=estadoNaTemperatura(el.numero, tempAtual);
  div.dataset.est=est;   // usado pelo CSS para colorir o ícone de estado
  div.dataset.nome=el.nome; div.dataset.simbolo=el.simbolo;
  const ccHexEl=getCatColorHex(el.cat)||'#888';
  div.style.setProperty('--cat-color',ccHexEl);
  // dados do modo raio: bloco (define a cor) e fração do raio (define o tamanho)
  div.dataset.bloco = BLOCO[el.numero] || '';
  div.setAttribute('role','gridcell');div.setAttribute('tabindex','-1');   // ver tabindexMovel()
  // Guardado em dataset porque o modo raio acrescenta o valor em pm ao
  // rótulo e precisa poder voltar ao original ao desligar. O símbolo
  // continua no rótulo mesmo com o modo ligado: quem usa leitor de tela
  // não perde a informação que desapareceu da tela.
  montarRotuloBase(div);
  div.setAttribute('aria-label',div.dataset.rotuloBase);
  const massaEl = MASSA[el.numero]||'';
  div.innerHTML=
    `<div class="el-number" aria-hidden="true">${el.numero}</div>`+
    `<div class="el-symbol" style="color:${ccHexEl}" aria-hidden="true">${el.simbolo}</div>`+
    /* UM elemento de desenho e UM de valor, para QUALQUER propriedade.
       Ficam sempre no DOM (o CSS os esconde) e têm o conteúdo preenchido
       na troca de modo — então ligar um modo é trocar um atributo e
       escrever texto, sem recriar os 118 cards. Antes havia um par de
       elementos por propriedade (.el-raio/.el-pm/.el-en), o que exigia
       CSS novo a cada propriedade acrescentada. */
    `<div class="el-prop-desenho" aria-hidden="true"></div>`+
    `<div class="el-name"   aria-hidden="true">${el.nome}</div>`+
    `<div class="el-mass"   aria-hidden="true">${massaEl}</div>`+
    `<div class="el-prop-valor" aria-hidden="true"></div>`+
    `<div class="state-dot" aria-hidden="true">${ESTADO_DOT[est]}</div>`;
  if(LAMBER_DBLCLICK_TRIGGER.includes(el.numero)){
    let timerCliqueLamber=null;
    const ESPERA_LAMBER_MS=600; // janela generosa para o "clique duplo" do easter egg
    div.addEventListener('click',()=>{
      if(timerCliqueLamber){
        clearTimeout(timerCliqueLamber);
        timerCliqueLamber=null;
        toggleModoLamber();
      }else{
        timerCliqueLamber=setTimeout(()=>{
          timerCliqueLamber=null;
          abrirModal(el,div);
        },ESPERA_LAMBER_MS);
      }
    });
  }else{
    div.addEventListener('click',()=>abrirModal(el,div));
  }
  // clicar ou focar torna o card o ponto de entrada da grade
  div.addEventListener('focus',()=>definirCardAtual(div));
  div.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();abrirModal(el,div);}
    navegarTabela(e,div);
  });
  registrarPosicao(el,div);
  return div;
}

