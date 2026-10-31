/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: prateleira.js
   ORIGEM:  NOVO arquivo do SIFI. Mesma técnica de lista das outras
            (`.composto-item`, reaproveitada pela terceira vez — Módulo
            1 Biblioteca, Módulo 2 Líquidos, agora Módulo 3 Prateleira).
   ───────────────────────────────────────────────────────────────
   A prateleira de reagentes do Módulo 3 — os 6 originais da
   especificação (Água, Óleo de Soja, Álcool Etílico, Iodo, Sal de
   Cozinha, e Hexano — este último não estava na lista original, mas é
   necessário pro "Desafio do Iodo": iodo não dissolve em água, mas
   dissolve em hexano, então precisa dos dois pra comparar), mais 11
   substâncias adicionadas depois (6 reaproveitadas da Biblioteca do
   Módulo 1, que já tinham a geometria pronta, só ganharam `density`/
   `polaridade`; 5 inteiramente novas: Acetona, Ácido Acético,
   Glicerina, Clorofórmio, Éter Etílico) — 17 reagentes no total.
   Diferente da Biblioteca/Lista de Líquidos, não tem busca (a lista é
   curta o bastante pra rolar sem precisar filtrar).
   Depende de: js/core/namespace.js, js/core/dom-refs.js,
              js/data/dados-forcas-intermoleculares.js.
   Usado por: js/init/inicializacao-sifi.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Os reagentes da prateleira — TODA substância que tenha `density` E
  // `polaridade` definidos serve pro Módulo 3 (é o que ele precisa pra
  // funcionar); os 6 originais da especificação (H2O, C2H5OH, Oleo,
  // C6H14, I2, NaCl) continuam primeiro na lista, o resto (Metanol,
  // Ácido Fórmico, Peróxido de Hidrogênio, Bromo, Tetracloreto de
  // Carbono, Dissulfeto de Carbono, Acetona, Ácido Acético, Glicerina,
  // Clorofórmio, Éter Etílico) reaproveitados/adicionados depois.
  SIFI.REAGENTES_PRATELEIRA = [
    'H2O', 'C2H5OH', 'Oleo', 'C6H14', 'I2', 'NaCl',
    'CH3OH', 'HCOOH', 'H2O2', 'Br2', 'CCl4', 'CS2',
    'C3H6O', 'CH3COOH', 'C3H8O3', 'CHCl3', 'C4H10O',
  ];

  /* Versão GERAL — em qual estado uma substância está numa
     temperatura QUALQUER, não só a ambiente. Mesma lógica de
     `estadoInicialPara` do Módulo 2 (beaker.js), generalizada aqui
     pra virar reaproveitável: o Módulo 3 agora também tem termostato
     (um por tubo — ver tubo-ensaio.js), e cada partícula precisa
     recalcular o próprio estado a qualquer momento, não só uma vez
     na criação. */
  SIFI.estadoFisicoNaTemperatura = function estadoFisicoNaTemperatura(mol, temp) {
    if (temp >= mol.boilingPoint) return 'gas';
    if (mol.sublima) return 'solido'; // CO₂/SF₆: sem fase líquida — ou sólido, ou gás
    if (mol.meltingPoint === null || mol.meltingPoint === undefined) return 'liquido'; // Hélio, Óleo: sem dado de fusão
    return temp >= mol.meltingPoint ? 'liquido' : 'solido';
  };

  /* Sólido ou líquido À TEMPERATURA AMBIENTE (25°C) — usada pra
     prateleira (o "estado natural" de cada reagente, sempre fixo,
     independente da temperatura de qualquer tubo específico) e como
     valor inicial de cada tubo novo. Substâncias sem `meltingPoint`
     (como o Óleo, uma mistura sem ponto de fusão único — ver
     dados-forcas-intermoleculares.js) são tratadas como líquidas,
     que é o estado real delas à temperatura ambiente. */
  SIFI.estadoFisicoAmbiente = function estadoFisicoAmbiente(mol) {
    return SIFI.estadoFisicoNaTemperatura(mol, 25);
  };

  SIFI.buildPrateleira = function buildPrateleira() {
    const lista = SIFI.prateleiraLista;
    if (!lista) return;
    lista.innerHTML = '';

    SIFI.REAGENTES_PRATELEIRA.forEach(key => {
      const mol = INTERMOL_MOLECULES.find(m => m.key === key);
      if (!mol) return;
      const estadoFisico = SIFI.estadoFisicoAmbiente(mol);
      const corEstado = estadoFisico === 'solido' ? '#a78bfa' : '#60a5fa';

      const item = document.createElement('div');
      item.className = 'composto-item';
      item.setAttribute('role', 'listitem');
      item.setAttribute('tabindex', '0');
      item.setAttribute('aria-label',
        `${mol.name}, fórmula ${mol.formula}, ${estadoFisico === 'solido' ? 'sólido' : 'líquido'} ` +
        `à temperatura ambiente. Pressione Enter para colocar no tubo selecionado.`
      );
      item.title = `${mol.name} — ${estadoFisico === 'solido' ? 'sólido' : 'líquido'} à temperatura ambiente`;

      item.innerHTML = `
        <span class="composto-dot" style="background:${corEstado}" aria-hidden="true"></span>
        <span class="composto-formula">${mol.formula}</span>
        <span class="composto-nome">${mol.name}</span>
        <span class="composto-pe">${estadoFisico === 'solido' ? 'sólido' : 'líquido'}</span>
      `;

      item.addEventListener('click', () => SIFI.adicionarReagenteAoTubo(key));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); SIFI.adicionarReagenteAoTubo(key); }
      });

      lista.appendChild(item);
    });
  };
});
