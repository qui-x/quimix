/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO (núcleo da classe Simulation)
   ARQUIVO: simulation-core.js
   ───────────────────────────────────────────────────────────────
   Mecânica central do SIEM: partículas são MOLÉCULAS com geometria
   VSEPR real, formando o estado físico correto (sólido/líquido/gás)
   controlado por Temperatura e Pressão (dados termodinâmicos reais
   do catálogo). Cada átomo usa a cor CPK padrão do elemento; os
   ângulos de ligação são valores experimentais, não estimativas
   visuais.

   Este arquivo declara a classe Simulation: o construtor, o
   dimensionamento do canvas (setSize/_dims), a inicialização por
   substância (init/_recompute), os controles externos
   (setControls) e o raio visual da partícula.
   Os métodos de FÍSICA (colocar partículas, integrar o movimento,
   resolver colisões) e de DESENHO vivem em arquivos próprios
   (simulation-fisica.js, simulation-render.js) e são adicionados a
   esta classe depois, via Simulation.prototype.metodo = function(){}.

   TÉCNICA: a classe é declarada em UM arquivo (construtor + membros
   essenciais) e os demais métodos são adicionados depois, escrevendo
   direto no protótipo:  NomeDaClasse.prototype.metodo = function(){};
   Equivalente a declarar tudo num único `class{}` — só exige que o
   arquivo que DECLARA a classe carregue antes dos que ADICIONAM
   métodos a ela (ver documentação completa no README do projeto).
   Depende de: nada além do canvas recebido no construtor.
   Usado por: simulation-fisica.js, simulation-render.js (ADICIONAM
              métodos), js/app/app-core.js (instancia
              `new Simulation(canvas)`), js/view3d/view3d.js (lê
              window.SIEM_APP.sim).
   ⚠ Deve ser o PRIMEIRO arquivo de simulation/ a carregar.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ====================================================================
   5. SIMULAÇÃO — moléculas com geometria real formando o estado físico
==================================================================== */
class Simulation {
  constructor(canvas) {
    this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.entry=null;
    this.T_C=25; this.P_atm=1.0; this.N=40;
    this.state='liquid'; this.stateInfo={};
    this.particles=[]; this.frame=0;
    this.box={x:0,y:0,w:0,h:0};
    /* Tamanho LOGICO da cena, em pixels CSS. Precisa ser guardado separado
       de canvas.width/height, que sao o buffer FISICO (px CSS x DPR).
       Como _resize() aplica setTransform(dpr,...), tudo que e desenhado
       trabalha em pixels CSS — usar canvas.width aqui fazia a caixa sair
       com o tamanho errado por um fator DPR. */
    this.W=0; this.H=0;
  }

  /* Chamado por _resize() com as medidas em px CSS do container. */
  setSize(w,h) { this.W=Math.max(1,w); this.H=Math.max(1,h); }

  /* Tamanho logico, com fallback para quem chamar init() antes do
     primeiro _resize() (a divisao pelo DPR e a conversao fisico -> CSS). */
  _dims() {
    if (this.W && this.H) return [this.W, this.H];
    const dpr=window.devicePixelRatio||1;
    return [this.canvas.width/dpr, this.canvas.height/dpr];
  }

  init() {
    const [W,H]=this._dims();
    this.box={x:W*0.08,y:H*0.08,w:W*0.84,h:H*0.84};
    this.frame=0;
    if (!this.entry) return;
    this._recompute();
    this._placeParticles();
  }

  _recompute() {
    this.stateInfo = determineState(this.entry, this.T_C, this.P_atm);
    this.state = this.stateInfo.state;
  }

  setControls(T_C, P_atm, N) {
    const prevState=this.state;
    this.T_C=T_C; this.P_atm=P_atm;
    if (N!==this.N) { this.N=N; this._recompute(); this._placeParticles(); return; }
    this._recompute();
    if (this.state!==prevState) this._placeParticles();
  }

  /** Raio de colisão de cada molécula, em px, escalado pelo tamanho real
   *  (número de átomos e raio de van der Waals aproximado). Usado tanto
   *  para desenho quanto para resolver colisões entre partículas. */
  _particleRadius() {
    const n = this.entry.atoms.length;
    const base = this.state==='gas' ? 5.5 : 9;
    return base * (n>1 ? Math.min(1.35, 1+ (n-1)*0.08) : 1);
  }
}

