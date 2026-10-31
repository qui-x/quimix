/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODELOS FÍSICOS (núcleo da classe AtomicSim)
   ARQUIVO: atomic-sim-core.js
   ───────────────────────────────────────────────────────────────
   Declara a classe AtomicSim: o construtor (estado inicial de cada
   um dos 5 modelos), os getters de conveniência (Z, símbolo,
   elétrons, massa) e rebuild() — o despachante que decide qual
   modelo "construir" com base em this.model.
   Os métodos de cada modelo específico (Dalton, Thomson,
   Rutherford, Bohr, Quântico) NÃO estão neste arquivo — cada um
   vive no seu próprio arquivo dentro de models/ e é adicionado à
   classe depois, via AtomicSim.prototype.metodo = function(){...}.

   TÉCNICA USADA: como o projeto não tem build step, a classe é
   declarada em UM arquivo (com o construtor e os membros mais
   básicos) e os demais métodos são adicionados depois, em outros
   arquivos, escrevendo diretamente no protótipo da classe:
       NomeDaClasse.prototype.nomeDoMetodo = function(...) { ... };
   Isso é 100% equivalente a declarar o método dentro do `class {}`
   original — funciona porque `class` e `prototype.metodo=` escrevem
   no MESMO objeto por baixo dos panos. A única regra é que todo
   arquivo que ADICIONA métodos precisa carregar DEPOIS do arquivo
   que declara a classe (senão o método seria escrito em algo que
   ainda não existe).
   Depende de: core/dados.js (ELEMENTS).
   Usado por: models/dalton.js, thomson.js, rutherford.js, bohr.js,
              quantum.js, atomic-sim-loop.js (todos ADICIONAM
              métodos a esta classe) e app/atomic-app-core.js (que
              instancia `new AtomicSim(canvas)`).
   ⚠ Este arquivo deve ser o PRIMEIRO de models/ a carregar.
═══════════════════════════════════════════════════════════════ */

'use strict';

// ══════════════════════════════════════════════════════════════════
// SIMULADOR — FÍSICA POR MODELO
// ══════════════════════════════════════════════════════════════════
class AtomicSim {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    // Nenhum modelo por padrao: o canvas abre PURO, como no SILQ. Os tres
    // switch(this.model) de rebuild/update/draw nao casam nenhum case com
    // null, entao nada e construido nem desenhado — draw() so faz clearRect.
    this.model   = null;
    this.elData  = ELEMENTS[0];
    this.t       = 0;

    // Dalton — esferas do elemento selecionado. Colisão puramente
    // elástica (postulado de Dalton: esferas indivisíveis).
    this.daltonParticles = [];

    // Thomson
    this.thomsonElectrons = [];

    // Rutherford
    this.ruthAlphas      = [];
    this.ruthEggMode     = false; // false = estrutura do núcleo (padrão); true = espalhamento (Easter Egg)

    // Bohr — exclusivamente saltos de elétrons entre camadas, com
    // emissão de luz colorida real (cores de Balmer) por transição
    this.bohrEggMode     = false; // false = órbitas simples (padrão); true = controles de salto quântico (Easter Egg)
    this.bohrElectrons   = [];
    this.bohrPhotons     = [];
    this.bohrLog         = [];

    // Quântico — nuvem pré-calculada por subcamada real
    this.qCloud          = [];
    this.qFrame          = 0;
    this.qSubshells      = [];

    this.rebuild();
  }

  get Z()        { return this.elData[0]; }

  get sym()      { return this.elData[1]; }

  get electrons(){ return this.elData[7]; }

  get totalE()   { return this.electrons.reduce((a,b)=>a+b, 0); }

  /** Massa atômica (número de massa A) — extrai o número da string,
   * ignorando colchetes de isótopos sintéticos (ex: "[98]" → 98). */
  get massNumber() {
    const raw = String(this.elData[3]).replace(/[\[\]]/g, '');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : 1;
  }

  /**
   * Raio visual do núcleo no experimento de Rutherford, escalado pela
   * lei física real do raio nuclear: R = R₀·A^(1/3), onde A é o número
   * de massa (não Z) — a mesma relação usada para calcular o tamanho
   * das esferas no modelo de Dalton (_atomRadius), aqui reaproveitada
   * para que o núcleo "cresça" de forma fisicamente coerente conforme
   * elementos mais pesados são selecionados (H é o menor; elementos
   * transurânicos como Og chegam a ~2.7× o raio de H).
   * @param {number} baseR  raio em px do menor caso (hidrogênio, A=1)
   */
  nucleusRadius(baseR) {
    return baseR * Math.cbrt(this.massNumber);
  }

  rebuild() {
    switch(this.model) {
      case 'dalton':     this._buildDalton();     break;
      case 'thomson':    this._buildThomson();     break;
      case 'rutherford': this._buildRutherford();  break;
      case 'bohr':       this._buildBohr();        break;
      case 'quantum':    this._buildQuantum();     break;
    }
  }
}

