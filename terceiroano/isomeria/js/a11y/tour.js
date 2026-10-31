/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: js/a11y/tour.js (SIIS)
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
      id: 'siis-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Isomeria: mesma fórmula, compostos diferentes',
          texto: 'Na Isomeria Constitucional você enche uma bancada de dez espaços com estruturas de mesma fórmula e compara duas a duas. Os outros módulos entram nesta lista conforme ficam prontos.'
        },
        {
          alvo: '#hdr-result',
          titulo: 'Calculado, não consultado',
          texto: 'Os isômeros saem de um gerador que monta cada estrutura possível átomo por átomo; o veredito do Comparar sai da comparação das ligações. Nenhuma resposta fica guardada numa tabela.',
          ao_entrar: function () { abrirPainel('hdr-result'); }
        }
      ]
    });
  }
  if (!Coachmark.jaViu('siis-boas-vindas')) setTimeout(function () { depoisDoModal(tourBoasVindas); }, 700);

  /* ════════ UM TOUR POR MÓDULO ════════ */
  var MODULOS = {
    constitucional: [
      { alvo: '#sim-canvas', titulo: 'A bancada muda com a seleção',
        texto: 'Toque num espaço: ele cresce no centro, e os outros viram uma doca no alto. Toque em outro: os dois ficam lado a lado. Toque de novo para soltar.' },
      { hdr: 'hdr-bi-banc', titulo: 'Três jeitos de pôr estruturas',
        texto: 'Digite uma fórmula molecular, como C4H8O: os isômeros vêm em remessas, e cada toque em Gerar traz os próximos, sem repetir até todos aparecerem. Digite também uma fórmula estrutural (a tripla: -= vira ≡), ou desenhe no editor: as estruturas suas ficam na bancada.' },
      { hdr: 'hdr-bi-comp', titulo: 'Compare dois',
        texto: 'Com dois espaços selecionados, compare: fórmulas diferentes, a mesma molécula desenhada de outro jeito, ou isômeros — de cadeia, posição, função, metameria ou tautomeria. O veredito aparece no mesmo painel.' }
    ],
    geometrica: [
      { alvo: '#sim-canvas', titulo: 'Estude uma estrutura',
        texto: 'Toque num espaço: ele cresce. Toque numa dupla ou num carbono para investigá-los. Arraste a ponta de uma dupla para girar aquela metade: antes de 90° ela volta; depois, a configuração troca — ou dá a mesma molécula.' },
      { hdr: 'hdr-bg-prio', titulo: 'Preveja e revele',
        texto: 'Em passos: diga se há isomeria, qual ligante tem prioridade e a configuração (E/Z, cis/trans, R/S). Ao revelar, a regra se abre esfera por esfera na estrutura. No painel Laboratório, troque ligantes sem mexer na geometria e veja a configuração mudar.' },
      { hdr: 'hdr-bi-comp', titulo: 'Compare dois',
        texto: 'Com dois espaços selecionados: mesma molécula, enantiômeros, isômeros geométricos ou diastereoisômeros.' }
    ],
    optica: [
      { alvo: '#sim-canvas', titulo: 'A molécula e o espelho',
        texto: 'À esquerda, a molécula; à direita, a sua imagem no espelho. Um dedo (ou o botão esquerdo) gira só o espelho; dois dedos (ou o botão direito) giram a cena; pinça ou roda dão zoom.' },
      { hdr: 'hdr-op-mol', titulo: 'Qualquer molécula',
        texto: 'Escolha da biblioteca, digite a fórmula estrutural ou desenhe no editor — as cunhas do desenho definem a configuração. Uma molécula maior que a tela aparece em recorte, com aviso.' },
      { hdr: 'hdr-op-prev', titulo: 'Preveja e revele',
        texto: 'É quiral? Quantos carbonos quirais? Quantos estereoisômeros? Ao revelar: o veredito, os R/S na cena e, nas moléculas da biblioteca, o sinal medido no polarímetro — o R/S sai da estrutura; o sinal (+) ou (−), só da medida.' },
      { hdr: 'hdr-op-esp', titulo: 'Tente sobrepor',
        texto: 'Antes de revelar, gire o espelho você mesmo. Depois, o melhor encaixe possível: num enantiômero, dois ligantes coincidem e os outros dois ficam trocados; no meso, as duas se sobrepõem depois de girar uma ligação simples.' },
      { hdr: 'hdr-op-cfg', titulo: 'Troque a configuração',
        texto: 'Depois de revelar, inverta cada carbono quiral e veja o veredito mudar na hora: o enantiômero, os diastereoisômeros e o meso.' }
    ]
  };

  function tourModulo(id) {
    var m = MODULOS[id];
    if (!m) return;
    Coachmark.iniciar({
      id: 'siis-modulo-' + id,
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
      if (Coachmark.jaViu('siis-modulo-' + id)) return;
      setTimeout(function () { depoisDoModal(function () { tourModulo(id); }); }, 350);
    }).observe(btn, { attributes: true, attributeFilter: ['aria-pressed'] });
  }
  function varrer() { document.querySelectorAll('.mode-activate-btn').forEach(observar); }
  varrer();
  setTimeout(varrer, 400);   // cards gerados pela app depois deste arquivo, por garantia
});
