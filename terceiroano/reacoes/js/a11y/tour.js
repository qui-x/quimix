/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: js/a11y/tour.js (SIRO)
   ───────────────────────────────────────────────────────────────
   Tour guiado — boas-vindas na primeira visita e um tour curto na
   primeira vez que cada módulo é ativado. Mesmo padrão do 2º ano.

   O que o aluno precisa descobrir aqui: que as SETAS de elétrons se
   desenham na própria cena — de um par, de um elétron livre ou de uma
   ligação até o destino — e que o resultado sai da contagem dos
   elétrons, calculado, nunca de uma tabela de respostas. (Os ids dos
   tours dos módulos guardam o prefixo 'siis-modulo-' de quando este
   arquivo nasceu, para não repetir o tour de quem já o viu.)

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
      id: 'siro-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Um laboratório de setas de elétrons',
          texto: 'Escolha um módulo — Adição, Eliminação, Substituição ou Combustão — e ative. Na cena, a reação em fórmula estrutural completa: você desenha as setas de elétrons e o simulador faz o que elas pedem.'
        },
        {
          alvo: '#hdr-result',
          titulo: 'Calculado, não consultado',
          texto: 'Cada passo sai da contagem dos elétrons — pares, ligações, cargas e radicais —, e não de uma tabela de respostas. O que aconteceu em cada experimento aparece aqui.',
          ao_entrar: function () { abrirPainel('hdr-result'); }
        }
      ]
    });
  }
  if (!Coachmark.jaViu('siro-boas-vindas')) setTimeout(function () { depoisDoModal(tourBoasVindas); }, 700);

  /* ════════ UM TOUR POR MÓDULO ════════ */
  var MODULOS = {
    adicao: [
      { alvo: '#sim-canvas', titulo: 'A reação, átomo por átomo',
        texto: 'Todos os átomos aparecem, os H inclusive. Os pontos em pares são os pares isolados; o sinal no círculo é a carga formal. Arraste de um par ou de uma ligação até o átomo de destino para desenhar uma seta de elétrons — ou toque na fonte e depois no destino.' },
      { hdr: 'hdr-ad-rea', titulo: 'Escolha a reação',
        texto: 'Busque pelo reagente. A lista mostra só os reagentes: o produto aparece depois, quando as setas chegam ao fim.' },
      { hdr: 'hdr-ad-con', titulo: 'Monte as suas reações',
        texto: 'Escolha a fórmula geral do reagente 1 (CₙH₂ₙ, com o n que quiser), uma fórmula molecular ou uma estrutural, e a do reagente 2 (HX, X₂, H₂O, H₂): o simulador gera todas as combinações para você testar a mesma regra em várias moléculas.' },
      { hdr: 'hdr-ad-cat', titulo: 'O catalisador',
        texto: 'Na hidratação, troque o ácido: os fortes funcionam; com HCl, o Cl⁻ compete com a água; com ácido acético, fraco, a reação não avança.' },
      { hdr: 'hdr-ad-mec', titulo: 'O laboratório de setas',
        texto: 'Desenhe setas e aplique: o simulador faz o que você pediu, mostra o resultado e descreve o que aconteceu — o tipo de carbocátion, os íons. Desfaça um passo, tente outro caminho. No estado estável, compare o seu produto com o da literatura: pela regra de Markovnikov, o H entra no carbono que já tem mais H, e o carbocátion fica no mais substituído, o mais estável.' }
    ],
    eliminacao: [
      { alvo: '#sim-canvas', titulo: 'A molécula, com os H vizinhos',
        texto: 'Os H dos carbonos vizinhos ao grupo que sai estão disponíveis para as setas: escolha qual a base vai retirar. Arraste de um par ou de uma ligação até o destino — ou toque na fonte e depois no destino.' },
      { hdr: 'hdr-el-rea', titulo: 'Escolha a reação', texto: 'Álcoois com ácido forte e calor (desidratação) e haletos com KOH em álcool (E2). A lista mostra só os reagentes.' },
      { hdr: 'hdr-el-con', titulo: 'Monte as suas reações', texto: 'Fórmula geral do reagente 1 (álcoois CₙH₂ₙ₊₂O ou bromoalcanos CₙH₂ₙ₊₁Br), molecular ou estrutural, e o reagente 2: o simulador gera todas as combinações.' },
      { hdr: 'hdr-el-cat', titulo: 'O catalisador', texto: 'Na desidratação, troque o ácido: o fraco não protona o OH; com HCl, o Cl⁻ ataca o carbocátion — uma substituição que compete com a eliminação.' },
      { hdr: 'hdr-el-mec', titulo: 'O laboratório de setas', texto: 'Aplique as setas e veja a dupla se formar. Retire o H de outro carbono vizinho e compare com a literatura: a regra de Zaitsev.' }
    ],
    substituicao: [
      { alvo: '#sim-canvas', titulo: 'A molécula, com os H disponíveis', texto: 'Nas reações radicalares, todos os H do alcano estão disponíveis para as farpas; no benzeno, os do anel. Arraste de um par, de um elétron ou de uma ligação até o destino.' },
      { hdr: 'hdr-sb-rea', titulo: 'Escolha a reação', texto: 'Alcanos com Cl₂ ou Br₂ e luz (radicalar), haletos com OH⁻ (SN2) ou água (SN1), e o benzeno com os seus eletrófilos.' },
      { hdr: 'hdr-sb-con', titulo: 'Monte as suas reações', texto: 'Fórmula geral do reagente 1 (alcanos CₙH₂ₙ₊₂ ou bromoalcanos CₙH₂ₙ₊₁Br), molecular ou estrutural: o simulador gera as halogenações e as substituições nucleofílicas.' },
      { hdr: 'hdr-sb-mec', titulo: 'O laboratório de setas', texto: 'Na radicalar, a farpa já vem escolhida: iniciação, propagação e terminação. Tire o H de outro carbono e compare: o radical mais estável decide o produto. Com luz, o X–X se quebra por igual, em radicais — não em íons.' }
    ],
    combustao: [
      { alvo: '#sim-canvas', titulo: 'O combustível e o O₂ do ar', texto: 'O O₂ aparece como birradical (•O–O•): cada O tem um elétron livre (⊙). É por isso que a combustão é uma reação em cadeia de radicais, desenhada com farpas.' },
      { hdr: 'hdr-cb-rea', titulo: 'Escolha o combustível', texto: 'GNV, GLP, etanol, metanol, gasolina… O metano mostra a cadeia inteira, até o CO₂; nos outros, o começo da cadeia.' },
      { hdr: 'hdr-cb-con', titulo: 'Monte os seus', texto: 'Alcanos CₙH₂ₙ₊₂ e álcoois CₙH₂ₙ₊₁OH, com o n que quiser: o simulador gera todos os isômeros.' },
      { hdr: 'hdr-cb-ar', titulo: 'Quanto ar', texto: 'Com ar suficiente, a cadeia chega ao CO₂: chama azul. Com pouco ar, para no CO — a combustão incompleta, de chama amarela (fuligem incandescente); o CO é tóxico, sem cor e sem cheiro.' },
      { hdr: 'hdr-cb-mec', titulo: 'A faísca e as farpas', texto: 'Sem a faísca, nada reage: o primeiro passo absorve muita energia. Acenda, desenhe a farpa, aplique — e acompanhe a energia de cada passo: somadas, dão a ΔH da equação global (lei de Hess).' },
      { hdr: 'hdr-cb-bal', titulo: 'Balanço e energia', texto: 'As equações globais, completa e incompleta, e quanta energia cada combustível libera por grama: os álcoois, que já têm um O na molécula, liberam menos.' }
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
