/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: js/a11y/tour.js (SIFO)
   ───────────────────────────────────────────────────────────────
   Tour guiado — boas-vindas na primeira visita e um tour curto na
   primeira vez que cada módulo é ativado. Mesmo padrão do 2º ano.

   O que o aluno precisa descobrir aqui: que o canvas se PINTA —
   escolhe-se o pincel de uma função e arrasta-se sobre os átomos do
   grupo — e que a resposta sai do motor, calculada, nunca de uma
   tabela por composto.

   Os cards de modo são gerados em tempo de execução (_buildModes), com
   cabeçalho hdr-mode-<id>. A ativação é detectada pelo aria-pressed do
   botão do card, que a app mantém em dia inclusive quando a troca vem
   da barra de modos do celular ou do trilho recolhível.

   Durante o tour, o trilho recolhível sai de cena sozinho (escuta os
   eventos coachmark:inicio/fim) para os alvos dentro das sidebars
   ficarem visíveis. Nada a fazer aqui por causa dele.

   Depende de: coachmark.js (motor genérico, na raiz do projeto).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof Coachmark === 'undefined') return;
  var LARGURA_MOBILE = 1100;
  function ehMobile() { return window.innerWidth <= LARGURA_MOBILE; }

  function abrirPainel(headerId) {
    var h = document.getElementById(headerId);
    if (h && h.getAttribute('aria-expanded') !== 'true') h.click();
  }

  /* O modal de resumo do modo (celular, primeira ativação) e o tour não
     podem disputar a tela: o tour espera o modal fechar. */
  function depoisDoModal(fn) {
    var ov = document.getElementById('modeInfoOverlay');
    if (!ov || !ov.classList.contains('aberto')) { fn(); return; }
    var obs = new MutationObserver(function () {
      if (!ov.classList.contains('aberto')) { obs.disconnect(); setTimeout(fn, 300); }
    });
    obs.observe(ov, { attributes: true, attributeFilter: ['class'] });
  }

  /* ════════ BOAS-VINDAS ════════ */
  function tourBoasVindas() {
    Coachmark.iniciar({
      id: 'sifo-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Funções orgânicas em compostos reais',
          texto: 'Em Grupos Funcionais você investiga medicamentos, aromas, alimentos e combustíveis de verdade, e pinta na estrutura cada grupo que encontrar. Os outros módulos entram nesta lista conforme ficam prontos.'
        },
        {
          alvo: '#hdr-result',
          titulo: 'Calculado, não consultado',
          texto: 'Os grupos de cada composto saem de um motor que lê a estrutura átomo por átomo — o mesmo que confere a sua pintura. Nenhuma resposta fica guardada numa tabela.',
          ao_entrar: function () { abrirPainel('hdr-result'); }
        }
      ]
    });
  }
  if (!Coachmark.jaViu('sifo-boas-vindas')) setTimeout(function () { depoisDoModal(tourBoasVindas); }, 700);

  /* ════════ UM TOUR POR MÓDULO ════════ */
  var MODULOS = {
    grupos: [
      { alvo: '#sim-canvas', titulo: 'Preveja pintando',
        texto: 'Se quiser prever, escolha o pincel de uma função no painel Investigar e arraste sobre os átomos do grupo: o O e o carbono do álcool, o C, o =O e o O do éster… Toque de novo com o mesmo pincel para despintar.' },
      { hdr: 'hdr-inv', titulo: 'Revele e entenda',
        texto: 'Revelar mostra todos os grupos, calculados a partir da estrutura. Onde a sua pintura for diferente, a explicação diz o que o átomo é — um O entre a C=O e outro carbono é éster, não éter. Se achar que só há carbono e hidrogênio, toque em Não há grupo funcional.' },
      { hdr: 'hdr-bib', titulo: 'A biblioteca',
        texto: 'Compostos reais em cinco categorias. Busque pelo nome ou pelo uso — dor, aroma, combustível — e toque num composto para abri-lo. Ou toque em Construir para montar a sua própria molécula: os grupos acendem conforme se formam, até 6 ao mesmo tempo.' }
    ],
    nomenclatura: [
      { alvo: '#sim-canvas', titulo: 'A bancada',
        texto: 'Oito cartões para estruturas. Toque num cartão para ver a estrutura grande. Quando o nome dela estiver certo, ele aparece no cartão, e a cadeia principal fica destacada e numerada.' },
      { hdr: 'hdr-banc', titulo: 'Três jeitos de pôr estruturas',
        texto: 'Digite uma fórmula molecular, como C4H10O, e a bancada se enche com os isômeros; digite a fórmula estrutural do espaço, como CH3-CH(OH)-CH3 — a ligação tripla é o botão ≡, ou digite -=, uma σ e duas π —; ou desenhe no editor.' },
      { hdr: 'hdr-nome', titulo: 'Preveja todas e confira',
        texto: 'Monte o nome de cada estrutura pelas peças: cadeia principal, ligações, função e localizadores. Quando todas tiverem previsão, confira: o nome certo vai para o cartão; os outros ficam marcados para você refazer e conferir de novo.' }
    ],
    ebulicao: [
      { alvo: '#sim-canvas', titulo: 'Monte a trilha',
        texto: 'Ordene os compostos por ebulição crescente: toque numa peça e depois numa posição, ou arraste a peça até a posição — ela se encaixa. Toque numa peça da trilha para tirá-la.' },
      { hdr: 'hdr-trilha', titulo: 'Escolha o conjunto e confira',
        texto: 'Cada conjunto isola uma variável: a força entre as moléculas, o tamanho da cadeia, a ramificação, o O–H, o N–H. Conferir diz só se existe erro na trilha; refaça até acertar. Com a trilha certa, cada composto sobe no termômetro até a sua temperatura.' },
      { hdr: 'hdr-dados', titulo: 'Os dados para raciocinar',
        texto: 'Massa molar, função e a presença de O–H ou N–H de cada composto. Depois do acerto, aparecem a temperatura de ebulição e a força intermolecular de cada um.' }
    ],
    prioridade: [
      { alvo: '#sim-canvas', titulo: 'A bancada e a escada',
        texto: 'Oito cartões com compostos reais de vários grupos. A escada à esquerda mostra a prioridade das funções: o grupo mais alto dá o sufixo do nome. Com o nome certo, os grupos do composto sobem até os seus degraus.' },
      { hdr: 'hdr-nc-banc', titulo: 'Os compostos',
        texto: 'Sorteie compostos da biblioteca — aminoácidos, ácidos da fruta, aromas, medicamentos — ou digite uma fórmula estrutural.' },
      { hdr: 'hdr-nc-nome', titulo: 'Monte o nome completo',
        texto: 'Acrescente um prefixo para cada grupo que não é o principal, com os localizadores (2,3 vira di-); escolha a cadeia ou o anel, as insaturações e o sufixo. Preveja todos os cartões e confira: o nome certo vai para o cartão; os outros você refaz.' }
    ]
  };

  function tourModulo(id) {
    var m = MODULOS[id];
    if (!m) return;
    Coachmark.iniciar({
      id: 'sifo-modulo-' + id,
      passos: m.map(function (p) {
        // no celular os painéis moram na gaveta de baixo: balão sem holofote
        var alvo = p.alvo || (ehMobile() ? null : '#body-' + p.hdr.replace('hdr-', ''));
        return {
          alvo: alvo, titulo: p.titulo, texto: p.texto,
          ao_entrar: p.hdr && !ehMobile() ? function () { abrirPainel(p.hdr); } : undefined
        };
      })
    });
  }

  var observados = new WeakSet();
  function observar(btn) {
    if (observados.has(btn)) return;
    observados.add(btn);
    var card = btn.closest('.panel');
    var cab = card ? card.querySelector('[id^="hdr-mode-"]') : null;
    if (!cab) return;
    var id = cab.id.replace('hdr-mode-', '');
    if (!MODULOS[id]) return;
    new MutationObserver(function () {
      if (btn.getAttribute('aria-pressed') !== 'true') return;
      if (Coachmark.jaViu('sifo-modulo-' + id)) return;
      setTimeout(function () { depoisDoModal(function () { tourModulo(id); }); }, 350);
    }).observe(btn, { attributes: true, attributeFilter: ['aria-pressed'] });
  }
  function varrer() { document.querySelectorAll('.mode-activate-btn').forEach(observar); }
  varrer();
  setTimeout(varrer, 400);   // cards gerados pela app depois deste arquivo, por garantia
});
