/* ═══════════════════════════════════════════════════════════════
   CAMADA: PONTO DE ENTRADA
   ARQUIVO: eventos-finais.js
   ───────────────────────────────────────────────────────────────
   ARQUIVO RECONSTRUÍDO — não veio no projeto original, apesar de
   <script src="js/redox/eventos-finais.js"> já existir no HTML e
   de outros arquivos já dependerem dele (o comentário em
   init/bootstrap-simulador.js já dizia "initSimulador() ...
   Chamada pelo bootstrap final (js/redox/eventos-finais.js)").

   O nome do arquivo é histórico (era o disparo final do antigo
   módulo de Redox), mas o papel dele sempre foi mais amplo: é o
   composition-root do app inteiro — o único lugar que, depois de
   TODO script já ter carregado, efetivamente liga tudo:

     • chama cada função initX() que os outros arquivos já definiam
       mas que nunca eram invocadas em lugar nenhum — sintoma:
       nenhum painel recolhia, nenhum modal expandia, o canvas de
       partículas de fundo não desenhava nada, o toggle Lab/Ficha
       não respondia a clique, a lista de substâncias da Nomenclatura
       vinha vazia, e as gavetas mobile não abriam ao tocar no botão
       (o bug relatado);
     • liga o clique nos dois botões "Selecionar módulo"
       (Construtor/Nomenclatura) às funções trocarModulo()/
       desativarModulo() de modulos/alternar.js.

   Fica por último no HTML de propósito: só quando este script roda,
   toda função que ele chama (initPaineis, initCanvas, trocarModulo,
   etc.) já existe — não há ordem de carregamento para acertar.
   Depende de: praticamente todo js/ui/*.js e js/modulos/alternar.js
               (cada chamada abaixo é protegida por typeof — se
               algum desses arquivos não carregar por qualquer
               motivo, o resto da inicialização continua).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  if (typeof initPaineis === 'function')     initPaineis();
  if (typeof initExpandModal === 'function') initExpandModal();
  if (typeof initCanvas === 'function')      initCanvas();
  if (typeof initViewToggle === 'function')  initViewToggle();
  if (typeof initSubList === 'function')     initSubList();
  if (typeof initMobile === 'function')      initMobile();

  document.querySelectorAll('.mode-activate-btn[data-module]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var jaAtivo = btn.getAttribute('aria-pressed') === 'true';
      if (jaAtivo) {
        if (typeof desativarModulo === 'function') desativarModulo(btn);
      } else {
        if (typeof trocarModulo === 'function') trocarModulo(btn.dataset.module, btn);
      }
    });
  });

  if (typeof initSimulador === 'function') initSimulador();
});
