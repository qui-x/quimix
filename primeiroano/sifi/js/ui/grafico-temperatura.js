/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: grafico-temperatura.js
   ORIGEM:  NOVO arquivo do SIFI. O SILQ tem um gráfico (grafico-energia.js)
            mas ele depende do D3.js (CDN externa) e desenha uma curva
            de energia potencial de ligação — nada a ver com "temperatura
            ao longo do tempo". Em vez de carregar uma biblioteca nova
            só pra isto, o gráfico aqui é SVG puro, do mesmo jeito que
            SIFI.drawInteractionLine (sandbox.js) já desenha as linhas
            de interação — consistente com o resto do projeto, e não
            quebra se uma CDN estiver fora do ar.
   ───────────────────────────────────────────────────────────────
   O gráfico "Temperatura × Tempo" do Módulo 2: mostra como a
   temperatura do termostato mudou nos últimos pontos registrados
   (`SIFI.termostato.historico`), com uma linha tracejada horizontal
   marcando o ponto de ebulição REAL da substância escolhida — assim
   dá pra ver visualmente o momento em que a curva cruza essa marca.
   Depende de: js/core/estado.js, js/core/dom-refs.js,
              js/data/dados-forcas-intermoleculares.js.
   Usado por: js/ui/beaker.js, js/simulation/fisica-termostato.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const NS = 'http://www.w3.org/2000/svg';

  function criarSvgEl(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  /* O domínio Y (faixa de temperatura mostrada) se ajusta à substância
     ATUAL — inclui o ponto de ebulição dela, a temperatura de agora e
     todo o histórico recente, com uma margem. Um domínio FIXO
     (-270 a 200, a faixa inteira do slider) deixaria o gráfico de
     quase toda substância minúsculo perto do fundo/topo da escala —
     a água (ferve a 100°C) ficaria espremida perto de um gráfico
     pensado pra caber o Hélio (-269°C) também. */
  function calcularDominioY(mol) {
    const temps = SIFI.termostato.historico.map(h => h.temp);
    temps.push(SIFI.termostato.temperatura, mol.boilingPoint);
    if (mol.meltingPoint !== null) temps.push(mol.meltingPoint);
    let min = Math.min(...temps) - 15;
    let max = Math.max(...temps) + 15;
    if (max - min < 20) { max += 10; min -= 10; } // evita domínio quase-zero (linha reta)
    return [min, max];
  }

  SIFI.desenharGraficoTemperatura = function desenharGraficoTemperatura() {
    const svg = SIFI.termostatoGraficoSvg;
    if (!svg) return;
    svg.innerHTML = '';

    const W = 260, H = 120;
    const pad = { top: 8, right: 8, bottom: 18, left: 32 };
    const mol = INTERMOL_MOLECULES.find(m => m.key === SIFI.termostato.substanciaKey);

    if (!mol || SIFI.termostato.historico.length < 2) {
      const texto = criarSvgEl('text', {
        x: W / 2, y: H / 2, 'text-anchor': 'middle', class: 'termostato-grafico-vazio',
      });
      texto.textContent = mol ? 'Aguardando dados…' : 'Escolha um líquido no béquer';
      svg.appendChild(texto);
      return;
    }

    const historico = SIFI.termostato.historico;
    const [yMin, yMax] = calcularDominioY(mol);
    const xMin = historico[0].tempo;
    const xMax = Math.max(historico[historico.length - 1].tempo, xMin + 1);

    const px = t => pad.left + ((t - xMin) / (xMax - xMin)) * (W - pad.left - pad.right);
    const py = temp => H - pad.bottom - ((temp - yMin) / (yMax - yMin)) * (H - pad.top - pad.bottom);

    // Linha tracejada horizontal no ponto de ebulição — a marca central
    // deste gráfico: "quando a curva cruzar essa linha, começa a ferver".
    const peY = py(mol.boilingPoint);
    svg.appendChild(criarSvgEl('line', {
      x1: pad.left, x2: W - pad.right, y1: peY.toFixed(1), y2: peY.toFixed(1),
      class: 'termostato-grafico-pe',
    }));
    const labelPE = criarSvgEl('text', {
      x: W - pad.right, y: (peY - 3).toFixed(1), 'text-anchor': 'end', class: 'termostato-grafico-pe-label',
    });
    labelPE.textContent = mol.sublima ? `Sublima ${mol.boilingPoint}°C` : `PE ${mol.boilingPoint}°C`;
    svg.appendChild(labelPE);

    // Segunda linha tracejada, no ponto de FUSÃO — só quando a
    // substância realmente tiver um (não desenha pro Hélio, que nunca
    // solidifica a 1 atm — ver dados-forcas-intermoleculares.js).
    if (mol.meltingPoint !== null) {
      const pfY = py(mol.meltingPoint);
      svg.appendChild(criarSvgEl('line', {
        x1: pad.left, x2: W - pad.right, y1: pfY.toFixed(1), y2: pfY.toFixed(1),
        class: 'termostato-grafico-pf',
      }));
      const labelPF = criarSvgEl('text', {
        x: W - pad.right, y: (pfY - 3).toFixed(1), 'text-anchor': 'end', class: 'termostato-grafico-pf-label',
      });
      labelPF.textContent = `PF ${mol.meltingPoint}°C`;
      svg.appendChild(labelPF);
    }

    // Eixo Y — só os dois extremos, pra não poluir um gráfico pequeno.
    [yMin, yMax].forEach(v => {
      const rotulo = criarSvgEl('text', {
        x: pad.left - 4, y: (py(v) + 3).toFixed(1), 'text-anchor': 'end', class: 'termostato-grafico-eixo',
      });
      rotulo.textContent = `${Math.round(v)}°`;
      svg.appendChild(rotulo);
    });

    // A curva de temperatura em si.
    const pontos = historico.map(h => `${px(h.tempo).toFixed(1)},${py(h.temp).toFixed(1)}`).join(' ');
    svg.appendChild(criarSvgEl('polyline', { points: pontos, class: 'termostato-grafico-linha' }));

    // Bolinha marcando o ponto mais recente (a "agora").
    const ultimo = historico[historico.length - 1];
    svg.appendChild(criarSvgEl('circle', {
      cx: px(ultimo.tempo).toFixed(1), cy: py(ultimo.temp).toFixed(1), r: 3,
      class: 'termostato-grafico-ponto-atual',
    }));
  };
});
