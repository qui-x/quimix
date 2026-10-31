/* ═══════════════════════════════════════════════════════════════
   CAMADA: DIAGRAMA DE FASES (núcleo da classe PhaseDiagram)
   ARQUIVO: phase-diagram-core.js
   ───────────────────────────────────────────────────────────────
   Declara a classe PhaseDiagram: o construtor (recebe o canvas e a
   Simulation) e o cálculo da janela de visualização — a faixa de
   temperatura/pressão mostrada no gráfico P×T (_computeWindow) e a
   escala não-linear de temperatura usada no eixo X (_tempScale,
   dá mais espaço visual perto do ponto atual).
   O método draw() (que desenha o gráfico inteiro) vive em
   phase-diagram-render.js e é adicionado depois via
   PhaseDiagram.prototype.draw = function(){}.

   TÉCNICA: a classe é declarada em UM arquivo (construtor + membros
   essenciais) e os demais métodos são adicionados depois, escrevendo
   direto no protótipo:  NomeDaClasse.prototype.metodo = function(){};
   Equivalente a declarar tudo num único `class{}` — só exige que o
   arquivo que DECLARA a classe carregue antes dos que ADICIONAM
   métodos a ela (ver documentação completa no README do projeto).
   Depende de: nada além do canvas e da Simulation recebidos.
   Usado por: phase-diagram-render.js (ADICIONA métodos),
              js/app/app-core.js (instancia
              `new PhaseDiagram(canvas, sim)`).
   ⚠ Deve carregar ANTES de phase-diagram-render.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ====================================================================
   6. PHASE DIAGRAM
==================================================================== */
class PhaseDiagram {
  constructor(canvas, sim) { this.canvas=canvas; this.sim=sim; }

  /**
   * Calcula a janela de visualização (Tmin/Tmax, Pmin/Pmax) do diagrama
   * garantindo que TODOS os pontos de referência da substância fiquem
   * visíveis simultaneamente:
   *   - ponto triplo (Tt, Pt)
   *   - ponto crítico (Tc, Pc)
   *   - fusão e ebulição normais (Tf, Tb a 1 atm)
   *   - o ponto ambiente atual definido pelos controles (T_C, P_atm)
   * A versão anterior só garantia o ponto ambiente, o que cortava o
   * ponto triplo/crítico da tela sempre que o ambiente ficava muito
   * distante deles (ex.: metais de Tf muito alto, onde a janela base
   * de Tc+30 podia nem cobrir o próprio Tc real).
   */
  _computeWindow(entry, sim) {
    // Coleta todas as temperaturas e pressões de referência que IMPÕEM
    // sua presença na janela — nenhuma pode ficar de fora.
    const temps = [entry.Tt, entry.Tc, entry.Tf, entry.Tb, sim.T_C];
    const press = [entry.Pt, entry.Pc, 1.0, sim.P_atm]; // Tf/Tb normais são a 1atm

    let Tmin = Math.min(...temps);
    let Tmax = Math.max(...temps);
    let Pmin = Math.min(...press.filter(p => p > 0));
    let Pmax = Math.max(...press);
    const Tspan = Math.max(Tmax - Tmin, 10);
    Tmin -= Tspan * 0.12;
    Tmax += Tspan * 0.12;

    const logPmin0 = Math.log10(Pmin);
    const logPmax0 = Math.log10(Math.max(Pmax, 1e-3));
    const logSpan = Math.max(logPmax0 - logPmin0, 0.5);
    let logPmin = logPmin0 - logSpan * 0.12;
    let logPmax = logPmax0 + logSpan * 0.12;

    return { Tmin, Tmax, Pmin: Math.pow(10, logPmin), Pmax: Math.pow(10, logPmax) };
  }

  _tempScale(entry, Tmin, Tmax) {
    // Ponto central de referência: meio do intervalo Tf↔Tb (a região
    // didaticamente mais importante)
    const mid = (entry.Tf + entry.Tb) / 2;
    const coreSpan = Math.max(entry.Tb - entry.Tf, 10);
    // Fator de compressão: quanto maior o range total comparado à
    // região核心 (Tf↔Tb), mais forte a compressão dos extremos.
    const totalSpan = Tmax - Tmin;
    const ratio = totalSpan / coreSpan;
    // k=1 → linear puro; k cresce suavemente com o ratio, mas com teto
    // (Math.min) para nunca distorcer tanto que vire ilegível
    const k = Math.min(2.2, 1 + Math.log10(Math.max(ratio, 1)) * 0.6);

    // Transforma cada temperatura em sua distância normalizada ao
    // centro, aplica uma curva de compressão (sinh inverso suaviza
    // extremos sem nunca cortar), depois remapeia para [0,1]
    function warp(T) {
      const d = (T - mid) / coreSpan; // distância ao centro, em unidades de "core span"
      // Math.sign(d) * Math.log1p(|d|*k) comprime suavemente valores
      // grandes de |d|, mantendo d≈0 quase linear (pouca distorção
      // perto da região de interesse)
      return Math.sign(d) * Math.log1p(Math.abs(d) * k);
    }
    const wMin = warp(Tmin), wMax = warp(Tmax);
    return { warp, wMin, wMax };
  }
}

