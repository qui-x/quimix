/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/mecanica.js (SIRO — Reações Orgânicas)
   ───────────────────────────────────────────────────────────────
   O roteador dos módulos, na ordem da especificação. Todos usam o MESMO
   laboratório de setas (modulo-mecanismo.js); cada um traz a sua
   biblioteca e o seu Construtor (as fórmulas gerais 1 e 2).
     Módulo 1 — Adição ...... biblioteca-adicao.js
     Módulo 2 — Eliminação .. biblioteca-eliminacao.js
     Módulo 3 — Substituição  biblioteca-substituicao.js
     Módulo 4 — Combustão ... biblioteca-combustao.js (o módulo filho
       ModuloCombustao: a faísca, o ar e a energia de cada passo)
   ═══════════════════════════════════════════════════════════════ */
'use strict';

const SIRO_M = () => Q3.Mecanismo;
const SIRO_CFG = {
  adicao: {
    pref: 'ad', nome: 'Adição', biblioteca: () => Q3.BibliotecaAdicao,
    construtor: {
      rotulo1: 'Reagente 1 — com a dupla C=C', rotulo2: 'Reagente 2 — o que se adiciona', qual: 'com dupla C=C',
      gerais: [{ id: 'alceno', html: 'C<sub>n</sub>H<sub>2n</sub> (alcenos)', formula: n => 'C' + n + 'H' + 2 * n, nMin: 2, nMax: 8, n0: 4 }],
      exemplo: { molecular: 'C5H10', estrutural: 'CH2=CH-CH2-CH3' },
      aceita: g => { const M = SIRO_M(), S = M.vazio(); M.deGrafo(S, g, 'a'); return !!M.duplaCC(S); },
      recusa: 'não tem isômeros com dupla C=C.', recusaUma: 'não tem dupla C=C.',
      reagentes2: [
        { id: 'HX', rotulo: 'HX', expandir: () => [['Cl', 'HCl'], ['Br', 'HBr'], ['I', 'HI']].map(x => ({ modelo: 'hx', reagente: x[0], rotulo: x[1] })) },
        { id: 'X2', rotulo: 'X₂', expandir: () => [['Cl', 'Cl₂'], ['Br', 'Br₂']].map(x => ({ modelo: 'halogenacao', reagente: x[0], rotulo: x[1] })) },
        { id: 'H2O', rotulo: 'H₂O (ácido)', expandir: () => [{ modelo: 'hidratacao', rotulo: 'H₂O (ácido)', catalisadores: true }] },
        { id: 'H2', rotulo: 'H₂ (Ni)', expandir: () => [{ modelo: 'hidrogenacao', rotulo: 'H₂ (Ni)' }] }
      ]
    }
  },
  eliminacao: {
    pref: 'el', nome: 'Eliminação', biblioteca: () => Q3.BibliotecaEliminacao,
    construtor: {
      rotulo1: 'Reagente 1 — com o grupo que sai (OH ou X)', rotulo2: 'Reagente 2 — o que provoca a eliminação', qual: 'com OH ou halogênio e H vizinho',
      gerais: [
        { id: 'alcool', html: 'C<sub>n</sub>H<sub>2n+2</sub>O (álcoois)', formula: n => 'C' + n + 'H' + (2 * n + 2) + 'O', nMin: 2, nMax: 7, n0: 4 },
        { id: 'haleto', html: 'C<sub>n</sub>H<sub>2n+1</sub>Br (bromoalcanos)', formula: n => 'C' + n + 'H' + (2 * n + 1) + 'Br', nMin: 2, nMax: 7, n0: 4 }
      ],
      exemplo: { molecular: 'C4H10O', estrutural: 'CH3-CH(OH)-CH2-CH3' },
      aceita: g => !!SIRO_M().eliminavel(g),
      recusa: 'não tem isômeros com OH ou halogênio e H vizinho.', recusaUma: 'não tem OH ou halogênio com H vizinho.',
      reagentes2: [
        { id: 'adequado', rotulo: 'O adequado a cada um', expandir: g => SIRO_M().eliminavel(g).tipo === 'alcool' ? [SIRO_DESID] : [SIRO_E2] },
        { id: 'acido', rotulo: 'H₂SO₄ (calor)', expandir: g => SIRO_M().eliminavel(g).tipo === 'alcool' ? [SIRO_DESID] : [] },
        { id: 'base', rotulo: 'KOH (álcool)', expandir: g => SIRO_M().eliminavel(g).tipo === 'haleto' ? [SIRO_E2] : [] }
      ]
    }
  }
};
SIRO_CFG.substituicao = {
  pref: 'sb', nome: 'Substituição', biblioteca: () => Q3.BibliotecaSubstituicao,
  construtor: {
    rotulo1: 'Reagente 1 — o alcano ou o haleto', rotulo2: 'Reagente 2 — o que substitui', qual: 'alcanos ou haletos',
    gerais: [
      { id: 'alcano', html: 'C<sub>n</sub>H<sub>2n+2</sub> (alcanos)', formula: n => 'C' + n + 'H' + (2 * n + 2), nMin: 1, nMax: 6, n0: 3 },
      { id: 'haleto', html: 'C<sub>n</sub>H<sub>2n+1</sub>Br (bromoalcanos)', formula: n => 'C' + n + 'H' + (2 * n + 1) + 'Br', nMin: 1, nMax: 6, n0: 4 }
    ],
    exemplo: { molecular: 'C4H10', estrutural: 'CH3-CH2-CH2-Br' },
    aceita: g => SIRO_M().ehAlcano(g) || !!SIRO_M().haleto(g),
    recusa: 'não tem alcanos nem haletos de alquila.', recusaUma: 'não é alcano nem haleto de alquila.',
    reagentes2: [
      { id: 'adequado', rotulo: 'O adequado a cada um', expandir: g => SIRO_SB_X2(g).concat(SIRO_SB_SN(g)) },
      { id: 'X2', rotulo: 'X₂ (luz)', expandir: g => SIRO_SB_X2(g) },
      { id: 'SN', rotulo: 'OH⁻ ou H₂O', expandir: g => SIRO_SB_SN(g) }
    ]
  }
};
/* MÓDULO 4 — COMBUSTÃO: o combustível (alcano ou álcool) + o O₂ do ar. As farpas da cadeia (cfg.farpas.cadeia):
   a β-cisão, a abstração que forma π e o ataque ao C do CO (js/core/mecanismo.js · completarFarpas). */
SIRO_CFG.combustao = {
  pref: 'cb', nome: 'Combustão', biblioteca: () => Q3.BibliotecaCombustao, farpas: { cadeia: true }, Classe: () => ModuloCombustao,
  construtor: {
    rotulo1: 'Combustível — alcano ou álcool', rotulo2: 'Comburente', qual: 'alcanos ou álcoois',
    gerais: [
      { id: 'alcano', html: 'C<sub>n</sub>H<sub>2n+2</sub> (alcanos)', formula: n => 'C' + n + 'H' + (2 * n + 2), nMin: 1, nMax: 6, n0: 3 },
      { id: 'alcool', html: 'C<sub>n</sub>H<sub>2n+1</sub>OH (álcoois)', formula: n => 'C' + n + 'H' + (2 * n + 2) + 'O', nMin: 1, nMax: 5, n0: 2 }
    ],
    exemplo: { molecular: 'C5H12', estrutural: 'CH3-CH2-CH2-OH' },
    aceita: g => !!SIRO_M().combustivel(g),
    recusa: 'não tem alcanos nem álcoois.', recusaUma: 'não é alcano nem álcool.',
    reagentes2: [
      { id: 'O2', rotulo: 'O₂ do ar', expandir: () => [{ modelo: 'combustao', rotulo: 'O₂' }] }
    ]
  }
};
const SIRO_SB_X2 = g => SIRO_M().ehAlcano(g) ? [{ modelo: 'radicalar', reagente: 'Cl', rotulo: 'Cl₂ (luz)' }, { modelo: 'radicalar', reagente: 'Br', rotulo: 'Br₂ (luz)' }] : [];
const SIRO_SB_SN = g => { const h = SIRO_M().haleto(g); if (!h) return []; const nC = g.vizinhos(h.alfa).filter(v => g.atomos[v.id].el === 'C').length; return nC >= 3 ? [{ modelo: 'sn1', rotulo: 'H₂O' }] : [{ modelo: 'sn2', rotulo: 'OH⁻' }]; };
const SIRO_DESID = { modelo: 'desidratacao', rotulo: 'H₂SO₄ (calor)', catalisadores: true };
const SIRO_E2 = { modelo: 'e2', rotulo: 'KOH (álcool)' };

class Mech {
  constructor(D) {
    this.D = D; this.modo = null; this.mods = {};
    Object.keys(SIRO_CFG).forEach(id => { const c = Object.assign({}, SIRO_CFG[id]); c.biblioteca = SIRO_CFG[id].biblioteca(); const Classe = SIRO_CFG[id].Classe ? SIRO_CFG[id].Classe() : ModuloMecanismo; this.mods[id] = new Classe(D, c); });
  }
  _ativo() { return this.mods[this.modo] || this.mods.adicao; }
  build() { /* os painéis são montados pelo próprio módulo */ }
  setMode(id) {
    this.modo = id;
    const novo = this.mods[id] || null;
    Object.keys(this.mods).forEach(k => { const m = this.mods[k]; if (m !== novo && m.ativo) m.desativar(); });
    if (novo) novo.ativar();
  }
  setParam() { return {}; }
  action(name) { const k = Object.keys(this.mods).find(id => name.indexOf(this.mods[id].cfg.pref + '-') === 0); return k ? this.mods[k].acao(name) : false; }
  onCanvasClick(x, y) { return this._ativo().tocar(x, y); }
  onArrow(dx, dy) { return this._ativo().navegar(dx, dy); }
  update(dt) { this._ativo().atualizar(dt); }
  draw(ctx, W, H) { this._ativo().desenhar(ctx, W, H); }
  getResults() { return this._ativo().resultados(); }
  getOverlay() { return this._ativo().overlay(); }
  // a dica do canvas do módulo ativo, quando ela depende do estado (null = a do MODES)
  getHintCanvas() { const m = this._ativo(); return typeof m.dicaCanvas === 'function' ? m.dicaCanvas() : null; }
}
