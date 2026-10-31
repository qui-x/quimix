/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Painéis
   ARQUIVO: app-paineis.js
   ───────────────────────────────────────────────────────────────
   Abrir/fechar os painéis recolhíveis da sidebar (_initPanels) e o
   modal de leitura ampliada (_initExpand) — o botão ⤢ move o
   .panel-body real para dentro do modal (sem clonar, preservando
   IDs únicos como #phase-diagram) e devolve à origem ao fechar.
   Adiciona a App.prototype: _initPanels, _initExpand.
   Depende de: app/app-core.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/**
   * Painéis recolhíveis: alterna data-open e gerencia a classe
   * scroll-ready do corpo do painel. A rolagem interna (overflow-y:auto)
   * só é ativada DEPOIS que a transição de altura termina — caso
   * contrário a barra de rolagem aparece/some abruptamente durante a
   * animação, criando um efeito visual de "salto".
   */
  App.prototype._initPanels = function() {
    document.querySelectorAll('.panel-header').forEach(btn=>{
      const sec = btn.closest('.panel');
      const bd  = sec.querySelector('.panel-body');

      // Painel já aberto no carregamento da página: ativa rolagem direto,
      // sem esperar transição (não há animação a observar nesse caso)
      if (sec.dataset.open === 'true' && bd) bd.classList.add('scroll-ready');

      btn.addEventListener('click', () => {
        const wasOpen = sec.dataset.open === 'true';
        sec.dataset.open = wasOpen ? 'false' : 'true';
        // BUG CORRIGIDO: antes so o data-open mudava. O aria-expanded ficava
        // congelado no "true" escrito no HTML, entao o leitor de tela
        // anunciava TODOS os 7 paineis como expandidos para sempre, inclusive
        // os visualmente fechados. Agora o estado visual e o estado anunciado
        // andam juntos — mesmo comportamento do SIME, do SIQI e do SILQ.
        btn.setAttribute('aria-expanded', wasOpen ? 'false' : 'true');
        if (!bd) return;

        if (wasOpen) {
          // Vai fechar: remove a rolagem imediatamente, antes da transição
          // começar, para não mostrar barra de rolagem encolhendo
          bd.classList.remove('scroll-ready');
        } else {
          // Vai abrir: espera a transição de max-height terminar para só
          // então permitir rolagem interna
          const onDone = (e) => {
            if (e.target !== bd || e.propertyName !== 'max-height') return;
            bd.classList.add('scroll-ready');
            bd.removeEventListener('transitionend', onDone);
          };
          bd.addEventListener('transitionend', onDone);
        }
      });
    });
  };

  /**
   * Liga os botões "⤢" (data-expand="gerais"|"diagrama"|"medidas") ao
   * modal de leitura ampliada (#expand-overlay). MOVE o .panel-body real
   * para dentro do modal (em vez de cloná-lo) e devolve ao lugar de
   * origem ao fechar — assim os IDs (#d-formula, #m-state, o próprio
   * canvas #phase-diagram etc.) continuam únicos no documento e todo
   * código que faz getElementById/atualização ao vivo continua
   * funcionando normalmente, esteja o conteúdo no painel ou no modal.
   */
  App.prototype._initExpand = function() {
    const overlay  = document.getElementById('expand-overlay');
    const body     = document.getElementById('expand-body');
    const titleEl  = document.getElementById('expand-title');
    const closeBtn = document.getElementById('expand-close');
    if (!overlay || !body || !titleEl || !closeBtn) return;

    // "gerais" e "medidas" viraram um painel unico (data-expand="dados").
    // A chave antiga fica no mapa por compatibilidade — se algum dia o
    // painel voltar a ser dividido, o titulo continua resolvendo.
    const TITLES = { dados: 'Dados & Medidas', diagrama: 'Diagrama de fases', gerais: 'Dados Gerais', medidas: 'Medidas' };

    let movedEl = null, originalParent = null, originalNext = null, openerBtn = null;

    const onKeydown = (e) => { if (e.key === 'Escape') closeExpand(); };

    const closeExpand = () => {
      if (movedEl && originalParent) originalParent.insertBefore(movedEl, originalNext);
      movedEl = null; originalParent = null; originalNext = null;
      overlay.hidden = true;
      document.removeEventListener('keydown', onKeydown);
      if (openerBtn) { openerBtn.focus(); openerBtn = null; }
    };

    document.querySelectorAll('.expand-btn[data-expand]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.expand;
        const sec = btn.closest('.panel');
        const bd  = sec ? sec.querySelector('.panel-body') : null;
        if (!bd) return;

        // Mantém o painel marcado como "aberto" enquanto o conteúdo
        // está no modal, para a transição de fechar (max-height) não
        // colidir quando o conteúdo voltar ao lugar de origem.
        if (sec.dataset.open !== 'true') sec.dataset.open = 'true';

        originalParent = bd.parentElement;
        originalNext   = bd.nextSibling;
        movedEl  = bd;
        openerBtn = btn;

        titleEl.textContent = TITLES[key] || 'Detalhes';
        body.appendChild(bd);
        overlay.hidden = false;
        closeBtn.focus();
        document.addEventListener('keydown', onKeydown);

        // Diagrama de fases: redesenha imediatamente no novo tamanho.
        // O _loop() principal já redesenha a cada frame quando há uma
        // substância selecionada, isso só evita um frame em branco ou
        // distorcido até o próximo tick depois do canvas mudar de lugar.
        if (key === 'diagrama' && this.sim.entry) this.phaseDiagram.draw();
      });
    });

    closeBtn.addEventListener('click', closeExpand);
    // Fecha ao clicar no fundo escurecido, mas não ao clicar dentro do modal
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeExpand(); });
  };

