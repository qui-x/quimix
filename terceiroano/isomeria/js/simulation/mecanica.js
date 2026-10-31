/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/mecanica.js (SIIS)
   ───────────────────────────────────────────────────────────────
   O ROTEADOR do SIIS: repassa ao módulo ativo o toque, as setas, os
   controles, as ações, o desenho e os resultados.
     Módulo 1 — Isomeria Constitucional ... bancada-isomeria.js
     Módulo 2 — Isomeria Geométrica ....... bancada-geometrica.js (herda a bancada)
     Módulo 3 — Isomeria Óptica ........... bancada-optica.js (qualquer molécula, com o espelho)
═══════════════════════════════════════════════════════════════ */

'use strict';

class Mech {
  constructor(D) {
    this.D = D;
    this.modo = 'constitucional';
    this.bi = new BancadaIsomeria(D);           // Módulo 1
    this.bg = new BancadaGeometrica(D);         // Módulo 2
    this.bo = new BancadaOptica(D);             // Módulo 3
  }
  _ativo() { return this.modo === 'geometrica' ? this.bg : this.modo === 'optica' ? this.bo : this.bi; }
  /* a lista das representações dos cartões: as seis do Módulo 1 do SIQC (representacoes.js) */
  build() {
    fillOptGrid('bi-vista-grid', Q3.Representacoes.VISTAS.map(v => ({
      value: v.id, nome: v.nome, extra: v.tresD ? '3D' : '',      // no SIIS os cartões não se editam: só a marca do 3D
      aria: v.nome + (v.tresD ? ', em três dimensões' : ''),
    })), 'completa');
  }
  /* Ativar um módulo DESATIVA E LIMPA o anterior (regra do projeto);
     desligar o módulo sem ativar outro também o limpa. */
  setMode(id) {
    this.modo = id;
    const novo = id === 'constitucional' ? this.bi : id === 'geometrica' ? this.bg : id === 'optica' ? this.bo : null;
    [this.bi, this.bg, this.bo].forEach(m => { if (m !== novo && m.ativo) m.desativar(); });
    if (this._anterior && this._anterior !== novo) this._anterior.reiniciar();
    if (novo) novo.ativar();
    this._anterior = novo;
  }
  setParam(k, v) {
    // a representação dos cartões vale para os DOIS módulos (a escolha continua ao trocar de módulo)
    if (k === 'bi-vista') { this.bi.vista = v; this.bg.vista = v; return this._ativo().mudarVista(v); }
    // controles do editor herdado do SIQC (o desenho de um espaço)
    if (['elemento', 'ferramenta', 'cunhaTipo', 'tensao', 'vista'].indexOf(k) >= 0) return this._ativo().editor.param(k, v);
    return {};
  }
  action(name) {
    if (name.indexOf('bi-') === 0) return this._ativo().acao(name);      // os painéis da bancada são dos dois módulos
    if (name.indexOf('bg-') === 0) return this.bg.acao(name);
    if (name.indexOf('op-') === 0) return this.bo.acao(name);
    if (name.indexOf('cad-') === 0) return this._ativo().editor.acao(name);
    return false;
  }
  onCanvasClick(x, y) { return this._ativo().tocar(x, y); }
  onArrow(dx, dy) { return this._ativo().navegar(dx, dy); }
  update(dt) { this._ativo().atualizar(dt); }
  draw(ctx, W, H) { this._ativo().desenhar(ctx, W, H); }
  getResults() { return this._ativo().resultados(); }
  getOverlay() { return this._ativo().overlay(); }

  /* O que mora no painel Resultados além da lista (cada módulo implementa se tiver): o retorno ({ tipo, texto },
     a resposta ao último passo do aluno), o próximo passo, em texto, e o que o módulo monta lá dentro (no M2, a
     conferência da previsão e as esferas). syncResults recebe se há modo ativo: sem ele, o que é de módulo some. */
  getFeedback() { const m = this._ativo(); return typeof m.retorno === 'function' ? m.retorno() : null; }
  getNext() { const m = this._ativo(); return typeof m.proximoPasso === 'function' ? m.proximoPasso() : ''; }
  syncResults(temModo) { this.bg.sincronizarResultado(temModo && this.modo === 'geometrica'); }
}
