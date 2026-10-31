/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE / ONBOARDING
   ARQUIVO: js/a11y/tour.js (SIQC)
   ───────────────────────────────────────────────────────────────
   Tour guiado — boas-vindas na primeira visita e um tour curto na
   primeira vez que cada módulo é ativado. Mesmo padrão do 2º ano.

   O que o aluno precisa descobrir aqui, e que nenhum outro simulador
   do projeto ensina: que o canvas se MONTA tocando (átomo, depois +),
   e que o hidrogênio nunca é peça — aparece no rótulo de quem o tem.

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
  function ehMobile() { return typeof ehCelular === 'function' ? ehCelular() : window.innerWidth <= 900; }   // a regra do celular mora em init/app.js

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
      id: 'siqc-boas-vindas',
      passos: [
        {
          alvo: ehMobile() ? '#mode-tabs-mobile' : '#sidebar-left',
          titulo: 'Dois módulos de química do carbono',
          texto: 'Em Cadeias e Classificação você monta a cadeia e a classificação é calculada a partir do que construiu. Em Hibridização, a mistura de orbitais que explica os ângulos.'
        },
        {
          alvo: '#hdr-result',
          titulo: 'Calculado, não consultado',
          texto: 'A fórmula, os quatro critérios da cadeia e as classes dos carbonos são recalculados a cada átomo que você põe ou tira — funciona com qualquer cadeia de até 20 átomos.',
          ao_entrar: function () { abrirPainel('hdr-result'); }
        }
      ]
    });
  }
  if (!Coachmark.jaViu('siqc-boas-vindas')) setTimeout(function () { depoisDoModal(tourBoasVindas); }, 700);

  /* ════════ UM TOUR POR MÓDULO ════════ */
  var MODULOS = {
    cadeias: [
      { alvo: '#sim-canvas', titulo: 'Monte tocando',
        texto: 'Toque num átomo para selecioná-lo: o + tracejado mostra onde o próximo átomo entra. Toque no + para anexar, e numa ligação para passar de simples a dupla e tripla.' },
      { hdr: 'hdr-cons', titulo: 'Paleta e ferramentas',
        texto: 'Escolha o elemento a anexar — o hidrogênio nunca entra como peça, ele aparece no rótulo (CH₃). Ligar fecha um anel entre dois átomos; Cunha escolhe se uma ligação vem para a frente, vai para trás ou fica no plano; Snap Literatura refaz o desenho de livro.' },
      { hdr: 'hdr-result', titulo: 'A dica e a cadeia',
        texto: 'Em Resultados: no alto, como usar a ferramenta escolhida; abaixo, a fórmula e a classificação da cadeia, que mudam a cada átomo. Nas vistas espaciais, também o centro dos ângulos e a legenda das ligações. A cena fica só com o desenho.' },
      { hdr: 'hdr-rep', titulo: 'Seis jeitos de ver a mesma molécula',
        texto: 'Estrutural condensada, completa, em linha, de Lewis e duas espaciais. A edição acontece só na condensada; as outras acompanham cada mudança. Nas espaciais, os ângulos saem da hibridização — 109,5° no carbono saturado. A chave Tensão angular mostra as nuvens se empurrando e leva aos ângulos medidos: pares isolados e duplas fecham os ângulos vizinhos.' }
    ],
    hibridizacao: [
      { alvo: '#sim-canvas', titulo: 'Um carbono, em nuvens',
        texto: 'Cada nuvem é um orbital, e os pontos são os elétrons. No estado fundamental o 2s tem um par e o 2p_z está vazio: só dois elétrons desemparelhados.' },
      { hdr: 'hdr-result', titulo: 'O diagrama e os números',
        texto: 'O diagrama de energia mora em Resultados: arraste o elétron do 2s para o 2p vazio. Aqui também ficam o próximo passo, a sobreposição σ e π, a distância e a energia para girar a ligação.' },
      { hdr: 'hdr-hib', titulo: 'Misture e veja o ângulo aparecer',
        texto: 'Promovido o elétron, escolha a hibridização e quais orbitais p entram. Deslize a mistura de 0% a 100%: os escolhidos giram e mudam de forma, e no diagrama os níveis se encontram. O p que fica de fora não se mexe — é dele que sai a ligação pi.' },
      { hdr: 'hdr-lig', titulo: 'Ligue a outro átomo',
        texto: 'Com a mistura completa, escolha um hidrogênio ou outro carbono e toque num híbrido para mirar. Arraste o parceiro na tela até o carbono: solto perto, ele é capturado e forma a sigma. Com dois carbonos sp², arraste de lado para torcer — a pi resiste e puxa de volta, e além de 90° ela se rompe. Na simples, um peteleco faz girar livre.' }
    ],
    classificacao: [
      { alvo: '#sim-canvas', titulo: 'Preveja pintando',
        texto: 'Se quiser prever, escolha um pincel no painel — primário, secundário, terciário ou quaternário — e arraste sobre os carbonos. Depois revele: o simulador mostra a classe de cada um, calculada pelo número de carbonos ligados a ele, e marca onde a previsão foi outra.' },
      { hdr: 'hdr-cls-cla', titulo: 'Classifique e aponte',
        texto: 'Um critério por vez: escolha a sua previsão. Se ela for afirmativa — insaturada, ramificada, heterogênea… —, aponte a evidência na estrutura. Em seguida o simulador revela a resposta e destaca a evidência real.' },
      { hdr: 'hdr-result', titulo: 'A explicação e o próximo passo',
        texto: 'Em Resultados ficam a explicação de cada resposta (inclusive por que a C=O e o OH da ponta não contam), o que fazer agora e a classificação que vai se formando, critério por critério.' },
      { hdr: 'hdr-cls-est', titulo: 'Moléculas reais ou sorteadas',
        texto: 'Escolha a fonte e o nível: de cadeias abertas até aromáticas e heterociclos. As moléculas reais vêm com o lugar onde você as encontra; as sorteadas vêm sem nome, para classificar só pela estrutura.' }
    ]
  };

  function tourModulo(id) {
    var m = MODULOS[id];
    if (!m) return;
    Coachmark.iniciar({
      id: 'siqc-modulo-' + id,
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
      if (Coachmark.jaViu('siqc-modulo-' + id)) return;
      setTimeout(function () { depoisDoModal(function () { tourModulo(id); }); }, 350);
    }).observe(btn, { attributes: true, attributeFilter: ['aria-pressed'] });
  }
  function varrer() { document.querySelectorAll('.mode-activate-btn').forEach(observar); }
  varrer();
  setTimeout(varrer, 400);   // cards gerados pela app depois deste arquivo, por garantia
});
