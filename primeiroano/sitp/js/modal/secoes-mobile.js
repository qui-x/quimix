/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODAL (bottom sheet mobile)
   ARQUIVO: secoes-mobile.js
   ───────────────────────────────────────────────────────────────
   Em telas largas o modal do elemento é uma janela central com TODAS
   as seções (.info-card) em lista — estado físico, distribuição
   eletrônica, obtenção, curiosidades, propriedades e raio atômico —
   uma embaixo da outra, e o usuário rola para ver tudo.

   Em telas estreitas (ver @media(max-width:760px) no CSS) o mesmo
   modal vira um BOTTOM SHEET que sobe da base da tela cobrindo
   metade dela. Ali não faz sentido rolar uma lista longa dentro de
   um espaço baixo — em vez disso, este arquivo monta uma barra
   horizontal de abas (uma por seção) logo abaixo do cabeçalho do
   elemento: tocar numa aba mostra SÓ aquela seção, escondendo as
   outras.

   IMPORTANTE: este módulo não decide o que é "mobile" — quem decide
   isso é o CSS (a barra de abas e o esconder/mostrar seção só têm
   efeito visual dentro do @media 760px). Aqui a gente só MONTA a
   estrutura (abas + índice de cada seção) toda vez que um elemento é
   aberto; se a tela for larga, a barra existe no DOM mas fica
   invisível e todas as seções aparecem normalmente, sem quebrar nada
   do comportamento desktop já existente.

   GENÉRICO DE PROPÓSITO: não há uma lista fixa de seções escrita
   aqui. O código lê TODOS os .info-card que existem dentro do
   .modal-body no momento em que é chamado — incluindo os cards de
   propriedade (eletronegatividade, energia de ionização) que
   renderCardsPropriedade() acabou de gerar. Se um dia entrar uma
   propriedade nova com cardModal:true, ou uma seção nova no HTML,
   ela ganha aba sozinha — sem editar este arquivo.

   Depende de: nada (só lê o DOM). Chamado por: modal/abrir-fechar.js,
               logo depois que todas as seções já foram preenchidas.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* Troca a seção visível do bottom sheet para o índice `idx`, e
   sincroniza o estado "selecionado" das abas. Function interna —
   quem aciona é o clique na aba, montada em montarAbasSecoesMobile(). */
function _selecionarSecaoMobile(tabs, cards, idx) {
  tabs.forEach((tab, i) => tab.setAttribute('aria-selected', i === idx ? 'true' : 'false'));
  cards.forEach((card, i) => card.classList.toggle('mobile-section-active', i === idx));

  // Nova seção começa do topo, mesmo que a anterior tivesse ficado
  // rolada — evita abrir "Raio atômico" já no meio do conteúdo.
  const corpo = document.querySelector('.modal-body');
  if (corpo) corpo.scrollTop = 0;

  // Mantém a aba tocada visível dentro da barra rolável, do mesmo
  // jeito que a barra de modos mobile dos simuladores de 2º ano já
  // faz — leva em conta prefers-reduced-motion.
  const abaAtiva = tabs[idx];
  if (abaAtiva && typeof abaAtiva.scrollIntoView === 'function') {
    const reduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    abaAtiva.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduzido ? 'auto' : 'smooth' });
  }
}

/* Constrói a barra de abas do zero a cada elemento aberto (o número e
   o conteúdo das seções — sobretudo as propriedades — mudam de
   elemento para elemento, então reaproveitar abas antigas daria mais
   trabalho do que recriar). Sempre volta para a 1ª aba selecionada,
   igual a abrir uma ficha nova. */
function montarAbasSecoesMobile() {
  const nav = document.getElementById('modalSectionTabs');
  const corpo = document.querySelector('.modal-body');
  if (!nav || !corpo) return;

  // Qualquer profundidade: pega tanto as seções fixas do HTML quanto
  // as que renderCardsPropriedade() acabou de criar dentro de
  // #modalPropriedades.
  const cards = Array.from(corpo.querySelectorAll('.info-card'));
  nav.innerHTML = '';
  if (!cards.length) return;

  const tabs = cards.map((card, i) => {
    // Preserva ids já existentes (ex.: #stateCard é usado por outro
    // arquivo para colorir a borda) — só cria um id novo se faltar.
    if (!card.id) card.id = 'modalPainel' + i;

    const h4 = card.querySelector('h4');
    const icone = h4 ? h4.querySelector('svg.ico') : null;
    // Rótulo completo (ex.: "Estado físico (25 °C, 1 atm)") vira o
    // title da aba; a versão antes do "(" é o texto curto que cabe
    // na pílula. Sem isso, teríamos que escrever um rótulo curto à
    // mão para cada seção — e esqueceríamos na próxima propriedade
    // nova.
    const rotuloCompleto = h4 ? h4.textContent.trim() : ('Seção ' + (i + 1));
    const rotuloCurto = rotuloCompleto.split('(')[0].trim() || rotuloCompleto;

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'modal-tab';
    tab.id = 'modalAba' + i;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.setAttribute('aria-controls', card.id);
    tab.title = rotuloCompleto;
    tab.innerHTML = (icone ? icone.outerHTML : '') + `<span>${rotuloCurto}</span>`;
    nav.appendChild(tab);
    return tab;
  });

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => _selecionarSecaoMobile(tabs, cards, i));
  });

  // 1ª seção ativa por padrão — mesmo comportamento de abrir a ficha
  // pela 1ª vez, de novo, para qualquer elemento.
  cards.forEach((card, i) => card.classList.toggle('mobile-section-active', i === 0));
}
