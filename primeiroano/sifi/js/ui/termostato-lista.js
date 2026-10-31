/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: termostato-lista.js
   ORIGEM:  NOVO arquivo do SIFI, mas a técnica de lista com busca é
            a MESMA de menu-moleculas.js (Biblioteca do Módulo 1) —
            reaproveita as mesmas classes CSS (`.composto-item`,
            `.pt-search-input`). A diferença central: aqui é seleção
            ÚNICA (escolher um líquido troca o que já estava no
            béquer), não "clique pra adicionar mais um" como a
            Biblioteca do Módulo 1.
   ───────────────────────────────────────────────────────────────
   A lista "Escolha o Líquido" (sidebar direita, só visível com o
   Módulo 2 ativo). Reaproveita INTERMOL_MOLECULES inteiro — as
   mesmas 34 substâncias do Módulo 1, porque TODAS já têm
   `boilingPoint` (é exatamente o dado que este módulo precisa).
   Depende de: js/core/namespace.js, js/core/dom-refs.js,
              js/data/dados-forcas-intermoleculares.js.
   Usado por: js/init/ativacao-modulos.js (chama SIFI.buildTermostatoLista
              e SIFI.initTermostatoListaControles ao ativar o Módulo 2).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  SIFI.termostatoBusca = '';

  /* Monta a lista de líquidos — cada item mostra fórmula, nome e
     ponto de ebulição (o dado central deste módulo), com o líquido
     atualmente no béquer marcado visualmente. */
  SIFI.buildTermostatoLista = function buildTermostatoLista() {
    const lista = SIFI.termostatoListaEl;
    if (!lista) return;

    // Mesmo total "de verdade" do Módulo 1 — exclui NaCl/Óleo.
    const totalModulo2 = INTERMOL_MOLECULES.filter(m => !m.apenasModulo3).length;
    if (SIFI.statTotalLiquidos) SIFI.statTotalLiquidos.textContent = totalModulo2;
    if (SIFI.badgeTermostato) {
      SIFI.badgeTermostato.textContent = totalModulo2;
      SIFI.badgeTermostato.setAttribute('aria-label', `${totalModulo2} líquidos disponíveis`);
    }

    const termo = SIFI.termostatoBusca.trim().toLowerCase();
    const visiveis = INTERMOL_MOLECULES.filter(mol =>
      // Mesmo filtro do Módulo 1 — NaCl/Óleo só existem no Módulo 3
      // (ver `apenasModulo3` em dados-forcas-intermoleculares.js).
      !mol.apenasModulo3 && (!termo || mol.name.toLowerCase().includes(termo) || mol.formula.toLowerCase().includes(termo) || mol.key.toLowerCase().includes(termo))
    );

    lista.innerHTML = '';
    if (!visiveis.length) {
      lista.innerHTML = '<p class="composto-lista-vazia">Nenhum líquido encontrado.</p>';
      return;
    }

    visiveis.forEach(mol => {
      const f = FORCE_TYPES[mol.dominantForce];
      const item = document.createElement('div');
      item.className = 'composto-item';
      if (mol.key === SIFI.termostato.substanciaKey) item.classList.add('composto-item--selecionado');
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-pressed', mol.key === SIFI.termostato.substanciaKey ? 'true' : 'false');
      item.setAttribute('aria-label',
        `${mol.name}, fórmula ${mol.formula}. Ponto de ebulição ${mol.boilingPoint}°C. ` +
        `Pressione Enter para colocar no béquer.`
      );
      item.title = `${mol.name} — PE ${mol.boilingPoint}°C`;

      item.innerHTML = `
        <span class="composto-dot" style="background:${f.color}" aria-hidden="true"></span>
        <span class="composto-formula">${mol.formula}</span>
        <span class="composto-nome">${mol.name}</span>
        <span class="composto-pe">${mol.boilingPoint}°C</span>
      `;

      item.addEventListener('click', () => SIFI.selecionarSubstanciaTermostato(mol.key));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); SIFI.selecionarSubstanciaTermostato(mol.key); }
      });

      lista.appendChild(item);
    });
  };

  SIFI.initTermostatoListaControles = function initTermostatoListaControles() {
    if (SIFI.buscaTermostato) {
      SIFI.buscaTermostato.addEventListener('input', () => {
        SIFI.termostatoBusca = SIFI.buscaTermostato.value;
        SIFI.buildTermostatoLista();
      });
    }
  };
});
