/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (interação)
   ARQUIVO: painel-modulos.js
   ───────────────────────────────────────────────────────────────
   Os 3 cartões de módulo da sidebar esquerda — Gases, Líquidos e
   Sólidos — no mesmo padrão visual/comportamental do menu de modelos
   do SIMA (.panel--mode / .mode-activate-btn): cada um pode ser
   "ativado" para filtrar a lista de substâncias do painel direito
   (ui/painel-substancias.js) pelo estado físico de referência
   (25 °C, 1 atm — ver estadoPadrao() em core/fisica.js). Ativar um
   módulo é uma alternância (toggle), igual ao SIMA: clicar de novo
   no mesmo módulo desativa o filtro e a lista volta a mostrar as
   102 substâncias. Só um módulo fica ativo por vez — a troca para
   outro desativa o anterior automaticamente.

   A sidebar direita (Substância/Controles/Estado & Medidas) começa
   TRANCADA: sem nenhum módulo ativo, os 3 painéis ficam com o
   atributo `inert` (bloqueia clique, foco por Tab e leitura de tela)
   e esmaecidos por CSS; um aviso explica o porquê. Ativar qualquer
   módulo destrava tudo de uma vez — ver atualizarTrancaSidebarDireita().

   Também liga os "chips" de exemplo de cada módulo (ex.: O₂, N₂, CO₂
   no módulo Gases): diferente do SIMA, onde os chips de "bons
   exemplos" são só decorativos, aqui cada chip é um atalho clicável
   que já carrega aquela substância no cilindro — e, por estar dentro
   de um cartão de módulo trancado, clicar nele ativa esse módulo
   automaticamente (senão a sidebar direita continuaria trancada com
   uma substância já carregada, o que não faria sentido).

   Depende de: data/catalogo-substancias.js (SUBSTANCIAS),
               core/estado-simulacao.js (estado.modulo),
               core/fisica.js (estadoPadrao),
               ui/painel-substancias.js (renderizarLista,
               selecionarSubstancia), a11y/acessibilidade.js (announce).
   Usado por: main.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   CONTAGEM POR ESTADO — preenche o badge de cada cartão de módulo
   com o número real de substâncias do catálogo (nunca um valor fixo
   digitado à mão, que ficaria desatualizado se o catálogo mudasse).
═══════════════════════════════════════════════════════ */
function contarSubstanciasPorEstado() {
  var contagem = { solido: 0, liquido: 0, gasoso: 0 };
  for (var i = 0; i < SUBSTANCIAS.length; i++) {
    var e = estadoPadrao(SUBSTANCIAS[i]);
    if (contagem[e] !== undefined) contagem[e]++;
  }
  return contagem;
}

function preencherBadgesModulo() {
  var contagem = contarSubstanciasPorEstado();
  var mapaBadge = {
    gasoso:  'badge-mod-gasoso',
    liquido: 'badge-mod-liquido',
    solido:  'badge-mod-solido'
  };
  Object.keys(mapaBadge).forEach(function(chave) {
    var el = document.getElementById(mapaBadge[chave]);
    if (el) el.textContent = contagem[chave];
  });
}

/* ═══════════════════════════════════════════════════════
   TRANCA DA SIDEBAR DIREITA
   ───────────────────────────────────────────────────────
   `inert` é o atributo padrão HTML (não uma classe CSS) para "este
   pedaço da página existe, mas não está disponível agora": o
   navegador tira os elementos de dentro dele do foco por Tab e da
   árvore de acessibilidade sozinho — não precisamos desabilitar
   cada slider/botão/link um por um. O CSS (stylesime.css) só cuida
   da aparência esmaecida; quem bloqueia de verdade é isto aqui.
═══════════════════════════════════════════════════════ */
function atualizarTrancaSidebarDireita() {
  var travar = !estado.modulo;
  document.querySelectorAll('#sidebar-right > .panel').forEach(function(painel) {
    painel.inert = travar;
    /* Antes só travava (inert = não clicável/focável), mas o painel
       continuava visível com listas vazias e travessões — pedido:
       esconder de vez, no mesmo padrão do 2º/3º ano (data-owner +
       hidden), em vez de só desabilitar a interação. */
    painel.hidden = travar;
  });
}

/* ═══════════════════════════════════════════════════════
   ATIVAR / DESATIVAR MÓDULO
═══════════════════════════════════════════════════════ */
function alternarModulo(modulo, btn) {
  var jaEstavaAtivo = estado.modulo === modulo;

  // Qualquer outro botão de módulo que porventura estivesse pressionado
  // (não deveria — só um módulo fica ativo por vez — mas isto garante
  // consistência mesmo se o HTML for editado no futuro).
  document.querySelectorAll('.mode-activate-btn[data-modulo-ativar]').forEach(function(b) {
    b.setAttribute('aria-pressed', 'false');
  });

  var nomes = { gasoso: 'Gases', liquido: 'Líquidos', solido: 'Sólidos' };

  if (jaEstavaAtivo) {
    estado.modulo = null;
    announce('Módulo ' + nomes[modulo] + ' desativado. A barra de substância, controles e medidas foi trancada novamente.', 'assertive');
  } else {
    estado.modulo = modulo;
    btn.setAttribute('aria-pressed', 'true');
    announce('Módulo ' + nomes[modulo] + ' ativado. A lista de substâncias foi filtrada e a barra da direita foi destrancada.', 'assertive');
  }
  renderizarLista();
  atualizarTrancaSidebarDireita();
  if (typeof syncMobileModeUI === 'function') syncMobileModeUI(jaEstavaAtivo ? null : modulo);
}

/* ═══════════════════════════════════════════════════════
   CHIPS DE EXEMPLO — atalho para carregar a substância direto
═══════════════════════════════════════════════════════ */
function buscarSubstanciaPorId(id) {
  for (var i = 0; i < SUBSTANCIAS.length; i++) {
    if (SUBSTANCIAS[i].id === id) return SUBSTANCIAS[i];
  }
  return null;
}

/* ═══════════════════════════════════════════════════════
   INICIALIZAÇÃO
═══════════════════════════════════════════════════════ */
function inicializarModulos() {
  preencherBadgesModulo();

  document.querySelectorAll('.mode-activate-btn[data-modulo-ativar]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      alternarModulo(btn.dataset.moduloAtivar, btn);
    });
  });

  document.querySelectorAll('.chip[data-sub-id]').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var sub = buscarSubstanciaPorId(chip.dataset.subId);
      if (!sub) return;
      // O chip vive dentro do cartão de um módulo (data-modulo="gasoso"
      // etc.) — se esse módulo ainda não estiver ativo, ativa primeiro
      // (destrancando a sidebar direita) e só depois carrega a
      // substância, para nunca deixar algo selecionado atrás de uma
      // barra ainda trancada.
      var cartao = chip.closest('.panel--mode');
      var modulo = cartao ? cartao.dataset.modulo : null;
      if (modulo && estado.modulo !== modulo) {
        var btnAtivar = cartao.querySelector('.mode-activate-btn[data-modulo-ativar]');
        if (btnAtivar) alternarModulo(modulo, btnAtivar);
      }
      selecionarSubstancia(sub);
    });
  });

  // Estado inicial: nenhum módulo ativo → sidebar direita começa trancada.
  atualizarTrancaSidebarDireita();
}
