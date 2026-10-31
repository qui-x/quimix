/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO
   ARQUIVO: alternar.js
   ───────────────────────────────────────────────────────────────
   ARQUIVO RECONSTRUÍDO — não veio no projeto original (o
   <script src="js/modulos/alternar.js"> já existia no HTML,
   apontando para um arquivo que não existia, então o navegador
   simplesmente falhava em carregá-lo e seguia em frente sem erro
   visível — por isso o sintoma era só "os botões não fazem nada",
   sem nenhuma mensagem óbvia do porquê).

   Reconstruído a partir de três pistas deixadas no próprio código:
     1) o comentário do #panel-none em indexsiqi.html cita as
        funções trocarModulo()/desativarModulo() por nome e descreve
        exatamente o que elas devem fazer;
     2) view-toggle.js expõe window._setView('none'|'lab'|'info'
        |'construtor') e diz explicitamente "trocarModulo()/
        desativarModulo() cuidam de trocar para/desta view";
     3) construtor/bancada.js já escuta window.addEventListener(
        'siqi:module-switch', ...) esperando e.detail.module —
        esse evento nunca era disparado por ninguém.

   trocarModulo(nome, btn) — ativa o cartão de módulo clicado (marca
   aria-pressed, desmarca os outros — a troca visual de qual cartão
   fica visível já é 100% CSS via :has(), não precisa de JS aqui),
   troca a view central para a correspondente, e dispara o evento
   que os módulos Construtor/Nomenclatura escutam para se inicializar
   sob demanda (só na primeira vez que são abertos).

   desativarModulo(btn) — desfaz a ativação e volta para a view
   "none" (dica central, mesmo comportamento do sim.model=null do
   SIMA).

   Depende de: window._setView (ui/view-toggle.js).
   Usado por: redox/eventos-finais.js (liga o clique nos botões
              ".mode-activate-btn[data-module]").
═══════════════════════════════════════════════════════════════ */

'use strict';

/* Esconde os painéis marcados data-hide-for-module quando o módulo
   ativo (Construtor/Nomenclatura) está na lista de valores do
   atributo — mesmo bug de origem do data-module-content: o HTML e os
   comentários já descreviam a intenção ("Balanço Atômico e Dados &
   Estrutura ocultos em Nomenclatura e Construtor — só fazem sentido
   no Lab livre"), mas nenhum código nunca lia o atributo. Resultado:
   a sidebar ficava com painéis redundantes sempre visíveis, mesmo
   sem informação nenhuma pra mostrar (o composto real está na
   Biblioteca/Ficha, não nesses dois). moduloAtivo=null (Lab, ou
   nenhum módulo selecionado) sempre mostra tudo de novo. */
function _atualizarOcultacaoPorModulo(moduloAtivo) {
  document.querySelectorAll('[data-hide-for-module]').forEach(function (p) {
    var lista = p.dataset.hideForModule.split(',').map(function (s) { return s.trim(); });
    p.hidden = moduloAtivo != null && lista.indexOf(moduloAtivo) !== -1;
  });
}

function trocarModulo(nome, btn) {
  document.querySelectorAll('.mode-activate-btn[data-module]').forEach(function (b) {
    if (b !== btn) b.setAttribute('aria-pressed', 'false');
  });
  btn.setAttribute('aria-pressed', 'true');

  // Ao ativar, o painel se RECOLHE — o gatilho abre espaço pra view
  // central. Reabrir é um clique no cabeçalho, a qualquer momento.
  // SIQI usa data-open no <section class="panel">, não uma classe
  // .collapsed no corpo (ver js/ui/paineis.js) — segue o MESMO
  // mecanismo aqui.
  var painel = btn.closest('.panel[data-mode-card]');
  if (painel) {
    var hdr = painel.querySelector('.panel-header');
    painel.dataset.open = 'false';
    if (hdr) hdr.setAttribute('aria-expanded', 'false');
  }
  if (typeof syncMobileModeUI === 'function') syncMobileModeUI(nome);
  _atualizarOcultacaoPorModulo(nome);

  // Restrito ao módulo Nomenclatura de propósito: o Construtor ainda
  // tem problemas próprios de inicialização, e alternar pra Lab/Ficha
  // com ele ativo deixava o estado inconsistente (view central de um
  // lado, módulo ativo de outro). Enquanto isso não for resolvido de
  // vez, o toggle Lab/Ficha só aparece com a Nomenclatura ativa.
  var toggleLabFicha = document.querySelector('.view-toggle');
  if (toggleLabFicha) toggleLabFicha.hidden = (nome === 'construtor');

  // 'construtor' tem sua própria view; 'nomenclatura' reaproveita a
  // Ficha (mesma tela de detalhes do composto que o Lab usa) — o
  // desafio de nomenclatura troca o conteúdo dela por dentro
  // (ver _mostrarDesafio() em nomenclatura/desafio.js).
  if (window._setView) {
    window._setView(nome === 'construtor' ? 'construtor' : 'info');
  }

  window.dispatchEvent(new CustomEvent('siqi:module-switch', { detail: { module: nome } }));
}

function desativarModulo(btn) {
  btn.setAttribute('aria-pressed', 'false');
  if (typeof syncMobileModeUI === 'function') syncMobileModeUI(null);
  _atualizarOcultacaoPorModulo(null);
  // Sem módulo ativo, o toggle Lab/Ficha não tem o que mostrar —
  // mesmo raciocínio do bloqueio acima.
  var toggleLabFicha = document.querySelector('.view-toggle');
  if (toggleLabFicha) toggleLabFicha.hidden = true;
  if (window._setView) window._setView('none');
}
