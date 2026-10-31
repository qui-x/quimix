/* ═════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/mecanica.js
   ─────────────────────────────────────────────────
   A classe Mech: o roteador entre os dois módulos do SIQC. Não faz
   química nem desenha — encaminha cada chamada da app para o módulo
   ativo, pelo mesmo contrato de sempre (build, setMode, setParam,
   action, onCanvasClick, onArrow, update, draw, getResults, getOverlay).

     Módulo 1 — Cadeias e Classificação ... editor-cadeias.js
                (o aluno monta a cadeia; a classificação é calculada)
     Módulo 2 — Hibridização .............. hibridizacao-orbitais.js
                (um carbono, nuvens de orbital em 3D, mistura 0–100%)
     Módulo 3 — Classificação ............. classificador-cadeias.js
                (pintar os carbonos; classificar apontando a evidência)

   Até a remodelação, os dois eram vitrines: o aluno escolhia uma
   molécula pronta numa lista, e a hibridização era um desenho plano
   com o ângulo escrito. A especificação do 3º ano pede os dois
   interativos e sem submódulos.

   Ordem de carga (definida em index.html): a11y → core → data →
   render → ui → view3d → simulation → init. Escopo global compartilhado.
══════════════════════════════════════════════════ */

'use strict';

class Mech {
  constructor(D) {
    this.D = D;
    this.modo = 'cadeias';
    this.editor = new EditorCadeias(D);          // Módulo 1
    this.orb = new HibridizacaoOrbitais(D);      // Módulo 2
    this.cls = new ClassificadorCadeias(D);      // Módulo 3
  }

  _ativo() { return this.modo === 'cadeias' ? this.editor : this.modo === 'classificacao' ? this.cls : this.orb; }

  /* ── o que o HTML só tem como contêiner ── */
  build() {
    fillOptGrid('vista-grid', Q3.Representacoes.VISTAS.map(v => ({
      value: v.id, nome: v.nome, extra: v.extra,
      aria: v.nome + (v.edita ? ', aqui se monta e edita' : v.tresD ? ', em três dimensões, só para ver' : ', só para ver'),
    })), this.editor.vista);
    fillOptGrid('hib-grid', this.D.HIBRIDIZACOES.map(h => ({
      value: h.id, nome: h.nome, dot: h.dot, extra: `${fmt(h.angulo, 1)}°`,
      aria: `${h.nome}, geometria ${h.geometria}, ângulo de ${fmt(h.angulo, 1)} graus`,
    })), this.orb.tipo);
  }

  /* Ativar um módulo DESATIVA E LIMPA o anterior (regra do projeto): quem
     sai volta ao estado inicial. Desligar o módulo sem ativar outro
     (id nulo) também o limpa. */
  setMode(id) {
    this.modo = id;
    const novo = id === 'cadeias' ? this.editor : id === 'hibridizacao' ? this.orb : id === 'classificacao' ? this.cls : null;
    [this.editor, this.orb, this.cls].forEach(m => { if (m !== novo && m.ativo) m.desativar(); });
    if (this._anterior && this._anterior !== novo) this._anterior.reiniciar();
    if (novo) novo.ativar();
    this._anterior = novo;
  }

  setParam(k, v) {
    if (k === 'hib') { this.orb.definirTipo(v); return {}; }
    if (k === 'mistura') return this.orb.definirMistura(v / 100);
    if (k === 'parceiro') return this.orb.definirParceiro(v);
    if (k === 'aproximar') return this.orb.definirAproximacao(v / 100);
    if (k === 'giro') return this.orb.definirGiro(v);
    if (k === 'cls-fonte') return this.cls.definirFonte(v);
    if (k === 'cls-nivel') return this.cls.definirNivel(v);
    if (k === 'cls-vista') return this.cls.definirVista(v);
    if (k === 'cls-pincel') return this.cls.definirPincel(v);
    if (k === 'cls-resposta') { this.cls.responder(v); return {}; }
    // elemento, ferramenta, cunha e tensão angular são do Módulo 1
    return this.editor.param(k, v);
  }

  action(name) {
    if (name.indexOf('cad-') === 0) return this.editor.acao(name);
    if (name.indexOf('cls-') === 0) return this.cls.acao(name);
    if (name.indexOf('hib-p-') === 0) return this.orb.alternarP(name.slice(6));
    if (name === 'hib-camera') { this.orb.cameraInicial(); return true; }
    if (name === 'hib-promover') return this.orb.promover();
    if (name === 'hib-fundamental') return this.orb.estadoFundamental();
    if (name === 'hib-soltar') return this.orb.soltar();
    if (name === 'hib-next') {
      const L = this.D.HIBRIDIZACOES;
      const i = (L.findIndex(h => h.id === this.orb.tipo) + 1) % L.length;
      this.orb.definirTipo(L[i].id);
      this._marcarOpt('hib-grid', L[i].id);
      playTone(720, .07, .05);
      return true;
    }
    return false;
  }

  /** Marca visualmente o botão ativo de uma .opt-grid montada por JS. */
  _marcarOpt(gridId, value) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.querySelectorAll('.opt-btn').forEach(b => {
      const on = b.dataset.value === String(value);
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
  }

  /* ── entrada no canvas: cada módulo tem a sua ── */
  onCanvasClick(x, y) { return this._ativo().tocar(x, y); }
  onArrow(dx, dy) { return this._ativo().navegar(dx, dy); }

  update(dt) { this._ativo().atualizar(dt); }
  draw(ctx, W, H) { this._ativo().desenhar(ctx, W, H); }
  getResults() { return this._ativo().resultados(); }
  getOverlay() { return this._ativo().overlay(); }

  /* O que mora no painel Resultados além da lista (cada módulo implementa se tiver):
     o próximo passo, em texto, e um gráfico no canvas auxiliar #result-chart. */
  getNext() { const m = this._ativo(); return typeof m.proximoPasso === 'function' ? m.proximoPasso() : ''; }
  drawResultChart(ctx, w, h) { const m = this._ativo(); return typeof m.graficoResultado === 'function' ? m.graficoResultado(ctx, w, h) : false; }
}
