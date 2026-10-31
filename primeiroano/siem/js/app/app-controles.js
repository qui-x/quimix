/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO — Controles de temperatura/pressão
   ARQUIVO: app-controles.js
   ───────────────────────────────────────────────────────────────
   Calibra o slider de temperatura pelos pontos reais de
   fusão/ebulição da substância ativa (_calibrateTempSlider),
   atualiza as marcações visuais desses pontos no próprio slider
   (_updateTempMarkers) e converte a posição do slider de pressão
   (escala logarítmica) para atm (_sliderToPressure).
   Adiciona a App.prototype: _calibrateTempSlider,
   _updateTempMarkers, _sliderToPressure.
   Depende de: app/app-core.js, core/termodinamica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/**
   * Recalibra o slider de temperatura para a substância selecionada,
   * garantindo SEMPRE dois requisitos simultâneos:
   *   1. Fusão e ebulição reais (a 1 atm) ficam dentro de uma faixa
   *      didaticamente coerente — nem tão larga que vire um ponto
   *      imperceptível no slider, nem tão estreita que corte o sólido
   *      ou o gás.
   *   2. 25°C (temperatura ambiente) SEMPRE está dentro do range visível
   *      E é sempre o valor inicial do slider — esse é o ponto
   *      pedagógico central: toda substância, ao ser selecionada, deve
   *      mostrar primeiro qual é seu estado físico real nas condições
   *      ambiente (25°C, 1 atm), antes de o usuário explorar outras
   *      temperaturas. Sem isso, metais (sólidos a 25°C) e gases
   *      criogênicos (gasosos a 25°C) abririam direto numa temperatura
   *      arbitrária do meio do intervalo Tf↔Tb, escondendo justamente
   *      a informação mais didática: "esta substância, no dia a dia,
   *      está em que estado?"
   */
  App.prototype._calibrateTempSlider = function(entry) {
    const tempSl = document.getElementById('temp-slider');
    const ROOM_T = 25; // temperatura ambiente — ponto de partida fixo

    const span = Math.max(entry.Tb - entry.Tf, 1);
    const margin = Math.max(span * 0.6, 40);

    // Range "natural" calibrado pelo intervalo Tf↔Tb da substância
    let min = entry.Tf - margin;
    let max = entry.Tb + margin;

    // GARANTIA: estende o range (sem encolher) para sempre incluir 25°C
    // com uma margem de respiro de 15°C — assim o marcador de "ambiente"
    // nunca fica colado na borda do slider, ficando sempre legível.
    if (ROOM_T < min) min = ROOM_T - 15;
    if (ROOM_T > max) max = ROOM_T + 15;

    // Zero absoluto (-273.15°C) é o limite físico inferior — nunca
    // permitir que o slider sugira temperaturas abaixo dele
    min = Math.max(-273, Math.floor(min / 5) * 5);
    max = Math.ceil(max / 5) * 5;

    // Step proporcional ao range total — mantém ~300 posições no slider
    const step = Math.max(0.5, Math.round((max - min) / 300 * 2) / 2);

    tempSl.min = min;
    tempSl.max = max;
    tempSl.step = step;

    // Marcadores de fusão/ebulição como atributos de dados (lidos pelo CSS/JS para desenhar marcas)
    tempSl.dataset.fusion = entry.Tf;
    tempSl.dataset.boiling = entry.Tb;
    tempSl.dataset.min = min;
    tempSl.dataset.max = max;

    document.getElementById('temp-min-lbl').textContent = `${min} °C`;
    document.getElementById('temp-max-lbl').textContent = `${max} °C`;

    // Estado físico real a 25°C/1atm — calculado para a nota didática
    const roomState = ROOM_T < entry.Tf ? 'sólida' : (ROOM_T < entry.Tb ? 'líquida' : 'gasosa');
    document.getElementById('temp-note').textContent =
      `${entry.name} é ${roomState} a 25°C/1 atm (fusão: ${entry.Tf.toFixed(1)}°C, ebulição: ${entry.Tb.toFixed(1)}°C).`;

    // SEMPRE inicia em 25°C — nunca foge para o meio do intervalo
    // líquido, mesmo quando a substância é sólida ou gasosa nessa
    // temperatura. É exatamente esse contraste (ex.: Ferro sólido,
    // Nitrogênio gasoso, ambos vistos a partir do mesmo ponto de
    // partida ambiente) que comunica a propriedade física real.
    tempSl.value = ROOM_T;
    document.getElementById('temp-val').textContent = `${ROOM_T} °C`;

    this._updateTempMarkers(entry, min, max);
  };

  /** Desenha marcadores visuais de Tf/Tb sobre a trilha do slider de temperatura. */
  App.prototype._updateTempMarkers = function(entry, min, max) {
    let track = document.getElementById('temp-track-markers');
    if (!track) {
      track = document.createElement('div');
      track.id = 'temp-track-markers';
      track.className = 'temp-track-markers';
      track.setAttribute('aria-hidden', 'true');
      const slider = document.getElementById('temp-slider');
      slider.insertAdjacentElement('afterend', track);
    }
    const range = max - min;
    const fusionPct = ((entry.Tf - min) / range) * 100;
    const boilingPct = ((entry.Tb - min) / range) * 100;
    track.innerHTML = `
      <span class="temp-mark fusion" style="left:${fusionPct.toFixed(2)}%" title="Fusão: ${entry.Tf.toFixed(1)}°C"><svg class="icon" aria-hidden="true"><use href="#ic-snow"/></svg></span>
      <span class="temp-mark boiling" style="left:${boilingPct.toFixed(2)}%" title="Ebulição: ${entry.Tb.toFixed(1)}°C"><svg class="icon" aria-hidden="true"><use href="#ic-gas"/></svg></span>
    `;
  };

  App.prototype._sliderToPressure = function(v){ return Math.pow(10,v); };

