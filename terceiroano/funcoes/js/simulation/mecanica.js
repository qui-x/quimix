/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/mecanica.js (SIFO)
   ───────────────────────────────────────────────────────────────
   A classe Mech: o roteador entre o app e os módulos. Cada módulo é
   uma classe com o mesmo contrato — ativar, desativar, tocar,
   navegar, atualizar, desenhar, resultados, overlay.

     Módulo 1 — Grupos Funcionais ......... investigador-grupos.js
                (compostos reais; pintar os grupos com o pincel da função;
                 construção livre com o editor do SIQC, editor-cadeias.js)

     Módulo 2 — Nomenclatura .............. nomeador-cadeias.js
                (bancada de isômeros; nome a partir da estrutura)
     Módulo 3 — Ponto de Ebulição ......... trilha-ebulicao.js
                (trilha por toque ou arrasto; termômetro na revelação)
     Módulo 4 — Prioridade de Funções ..... nomeador-completo.js
                (nomes completos de compostos reais; a escada de prioridade)

   Os Módulos 3 (Ponto de Ebulição) e 4 (Prioridade de Funções) entram
   aqui conforme ficam prontos.
═══════════════════════════════════════════════════════════════ */

'use strict';

class Mech {
  constructor(D) {
    this.D = D;
    this.modo = 'grupos';
    this.gf = new InvestigadorGrupos(D);        // Módulo 1
    this.nm = new NomeadorCadeias(D);           // Módulo 2
    this.eb = new TrilhaEbulicao(D);            // Módulo 3
    this.nc = new NomeadorCompleto(D);          // Módulo 4
  }
  _ativo() { return this.modo === 'nomenclatura' ? this.nm : this.modo === 'ebulicao' ? this.eb : this.modo === 'prioridade' ? this.nc : this.gf; }
  build() { /* os painéis do Módulo 1 são montados pelo próprio módulo */ }
  /* Ativar um módulo DESATIVA E LIMPA o anterior (regra do projeto);
     desligar o módulo sem ativar outro também o limpa. */
  setMode(id) {
    this.modo = id;
    const novo = id === 'grupos' ? this.gf : id === 'nomenclatura' ? this.nm : id === 'ebulicao' ? this.eb : id === 'prioridade' ? this.nc : null;
    [this.gf, this.nm, this.eb, this.nc].forEach(m => { if (m !== novo && m.ativo) m.desativar(); });
    if (this._anterior && this._anterior !== novo) this._anterior.reiniciar();
    if (novo) novo.ativar();
    this._anterior = novo;
  }
  setParam(k, v) {
    if (k === 'eb-conjunto') return this.eb.param(k, v);
    if (k === 'gf-pincel') return this.gf.definirPincel(v);
    if (k === 'gf-composto') return this.gf.abrir(v);
    if (k === 'gf-categoria') return this.gf.definirCategoria(v);
    if (k === 'gf-fonte') return this.gf.definirFonte(v);
    // controles do editor herdado do SIQC (construção livre); o elemento passa pela trava de grupos
    if (['elemento', 'ferramenta', 'cunhaTipo', 'tensao', 'vista'].indexOf(k) >= 0)
      return this.modo === 'nomenclatura' ? this.nm.editor.param(k, v) : this.gf.paramEditor(k, v);
    return {};
  }
  action(name) {
    if (name.indexOf('gf-') === 0) return this.gf.acao(name);
    if (name.indexOf('nm-') === 0) return this.nm.acao(name);
    if (name.indexOf('eb-') === 0) return this.eb.acao(name);
    if (name.indexOf('nc-') === 0) return this.nc.acao(name);
    if (name.indexOf('cad-') === 0) return this.modo === 'nomenclatura' ? this.nm.editor.acao(name) : this.gf.acaoEditor(name);
    return false;
  }
  /* ── entrada no canvas: cada módulo tem a sua ── */
  onCanvasClick(x, y) { return this._ativo().tocar(x, y); }
  onArrow(dx, dy) { return this._ativo().navegar(dx, dy); }
  update(dt) { this._ativo().atualizar(dt); }
  draw(ctx, W, H) { this._ativo().desenhar(ctx, W, H); }
  getResults() { return this._ativo().resultados(); }
  getOverlay() { return this._ativo().overlay(); }
}
