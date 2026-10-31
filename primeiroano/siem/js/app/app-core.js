/* ═══════════════════════════════════════════════════════════════
   CAMADA: APLICAÇÃO (núcleo da classe App)
   ARQUIVO: app-core.js
   ───────────────────────────────────────────────────────────────
   Declara a classe App — o controlador da interface. O construtor
   cria a Simulation e o PhaseDiagram, expõe `window.SIEM_APP = this`
   (lido por js/view3d/view3d.js) e dispara a montagem de toda a UI.
   _resize() recalcula os canvases quando a janela muda de tamanho.
   Os demais métodos (lista de substâncias, controles, dados e
   medidas, painéis, eventos, menu mobile, loop principal) vivem em
   arquivos próprios dentro de app/ e são adicionados depois via
   App.prototype.metodo = function(){}.

   TÉCNICA: a classe é declarada em UM arquivo (construtor + membros
   essenciais) e os demais métodos são adicionados depois, escrevendo
   direto no protótipo:  NomeDaClasse.prototype.metodo = function(){};
   Equivalente a declarar tudo num único `class{}` — só exige que o
   arquivo que DECLARA a classe carregue antes dos que ADICIONAM
   métodos a ela (ver documentação completa no README do projeto).
   Depende de: simulation/ e phase-diagram/ (já devem estar prontos
               — `new Simulation(...)` e `new PhaseDiagram(...)` são
               chamados aqui dentro).
   Usado por: todos os demais arquivos de app/ (ADICIONAM métodos),
              js/main.js (que instancia `new App()`).
   ⚠ Deve ser o PRIMEIRO arquivo de app/ a carregar.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ====================================================================
   7. APP
==================================================================== */
class App {
  constructor() {
    this.canvas=document.getElementById('sim-canvas');
    this.sim=new Simulation(this.canvas);
    this.phaseDiagram=new PhaseDiagram(document.getElementById('phase-diagram'), this.sim);
    this._resize(); this._activeModulo=null; this._buildList(); this._initModulos(); this._buildModeTabsMobile(); this._bindModeInfoModal(); this._bindEvents(); this._initPanels(); this._initExpand(); this._initMobileMenu(); this._loop();
    // Exposto globalmente para o accessibility.js poder redesenhar o
    // diagrama de fases nativamente dentro do canvas clonado do modal de
    // expansão, em vez de copiar pixels esticados do canvas pequeno
    // original (causa da distorção na visualização ampliada).
    window.SIEM_APP = this;
  }

  _resize() {
    const dpr=window.devicePixelRatio||1;
    const wrap=this.canvas.parentElement;
    const rect=wrap.getBoundingClientRect();
    const W=Math.max(1,rect.width), H=Math.max(1,rect.height);
    this.canvas.width=Math.round(W*dpr); this.canvas.height=Math.round(H*dpr);
    this.canvas.style.width=W+'px'; this.canvas.style.height=H+'px';
    /* setTransform e nao scale: scale() MULTIPLICA a matriz existente, entao
       depende de o contexto ter acabado de ser resetado para dar no mesmo.
       setTransform define um valor absoluto e por isso e seguro chamar
       quantas vezes for. Era o unico ponto do projeto ainda com scale() —
       os outros 19 simuladores (e a propria visualizacao minimizada deste
       arquivo, na linha ~538) ja usavam setTransform. */
    this.canvas.getContext('2d').setTransform(dpr,0,0,dpr,0,0);
    /* informa o tamanho logico ANTES do init(), que recalcula a caixa */
    this.sim.setSize(W,H);
    if (this.sim.entry) this.sim.init();
  }
}

