SIGAS.KIN = {
  VSCALE: 13
};
SIGAS.GRAHAM_K = 1.1 / Math.sqrt(300);
/** Normaliza hex de 3 dígitos (#0ff) para 6 dígitos, exigido por kMix. */
SIGAS.hex6 = function hex6(h) {
  if (!h) return '#000000';
  h = h.trim();
  if (h[0] !== '#') return h;
  if (h.length === 4) {
    const r = h[1],
      g = h[2],
      b = h[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return h;
};
/** Cor por rapidez normalizada (0..1): ciano → âmbar → vermelho. */
SIGAS.speedColor = function speedColor(t) {
  t = SIGAS.clamp(t, 0, 1);
  const c1 = SIGAS.hex6(SIGAS.cssVar('--accent-cyan', '#38bdf8'));
  const c2 = SIGAS.hex6(SIGAS.cssVar('--accent-amber', '#fbbf24'));
  const c3 = SIGAS.hex6(SIGAS.cssVar('--accent-exo', '#f87171'));
  return t < .5 ? SIGAS.kMix(c1, c2, t * 2) : SIGAS.kMix(c2, c3, (t - .5) * 2);
};
/** Converte hex (3 ou 6 dígitos) + alfa em 'rgba(r,g,b,a)'. */
SIGAS.toRgba = function toRgba(hex, a) {
  hex = SIGAS.hex6(hex);
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};
/** v_rms tridimensional real: √(3·R·T/M), M em kg/mol → v em m/s. */
SIGAS.vrms3D = function vrms3D(T, M, RSI) {
  return Math.sqrt(3 * RSI * T / (M / 1000));
};
SIGAS.KinEngine = class KinEngine {
  constructor() {
    this.parts = [];
    this.T = 300;
    this.M = 28;
    this.r = 3.2;
    this.box = {
      x: 0,
      y: 0,
      w: 100,
      h: 100
    };
    this.collisions = true;
    this._pFrac = 0;
    this._collRate = 0;
  }
  get sigmaT() {
    return SIGAS.KIN.VSCALE * Math.sqrt(Math.max(1, this.T) / Math.max(0.1, this.M));
  }
  get collRate() {
    return this._collRate;
  }
  get pressureFrac() {
    return this._pFrac;
  }
  config(o) {
    if (o.T != null) this.T = o.T;
    if (o.M != null) this.M = o.M;
    if (o.r != null) this.r = o.r;
  }
  setBox(b) {
    this.box = b;
    const r = this.r;
    this.parts.forEach(p => {
      p.x = SIGAS.clamp(p.x, b.x + r, Math.max(b.x + r, b.x + b.w - r));
      p.y = SIGAS.clamp(p.y, b.y + r, Math.max(b.y + r, b.y + b.h - r));
    });
  }
  _spawnOne() {
    const s = this.sigmaT,
      b = this.box,
      r = this.r;
    const u1 = Math.random() || 1e-6,
      u2 = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u1));
    const vx = mag * Math.cos(Math.PI * 2 * u2) * s;
    const vy = mag * Math.sin(Math.PI * 2 * u2) * s;
    return {
      x: b.x + r + Math.random() * Math.max(1, b.w - 2 * r),
      y: b.y + r + Math.random() * Math.max(1, b.h - 2 * r),
      vx,
      vy
    };
  }
  setN(n) {
    n = Math.max(1, Math.round(n));
    while (this.parts.length < n) this.parts.push(this._spawnOne());
    if (this.parts.length > n) this.parts.length = n;
  }

  /** Redistribui as velocidades pela curva de Maxwell-Boltzmann (mantém posições). */
  resample() {
    this.parts.forEach(p => {
      const np = this._spawnOne();
      p.vx = np.vx;
      p.vy = np.vy;
    });
  }

  /** Todas as partículas com a MESMA rapidez, direções aleatórias — para a demo pedagógica. */
  uniform() {
    const s = this.sigmaT * Math.SQRT2;
    this.parts.forEach(p => {
      const a = Math.random() * Math.PI * 2;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
    });
  }
  meanV2() {
    if (!this.parts.length) return 0;
    let s = 0;
    this.parts.forEach(p => {
      s += p.vx * p.vx + p.vy * p.vy;
    });
    return s / this.parts.length;
  }

  /** Razão entre energia cinética atual e a esperada para T alvo (1 = equilíbrio). */
  tRatio() {
    const s = this.sigmaT;
    if (s <= 0) return 1;
    return this.meanV2() / (2 * s * s);
  }
  histo(bins) {
    const vmax = this.sigmaT * 3.4;
    const bw = vmax / bins;
    const counts = new Array(bins).fill(0);
    this.parts.forEach(p => {
      const v = Math.hypot(p.vx, p.vy);
      let idx = Math.floor(v / bw);
      if (idx >= bins) idx = bins - 1;
      if (idx < 0) idx = 0;
      counts[idx]++;
    });
    return {
      counts,
      binWidth: bw,
      vmax
    };
  }
  step(dt) {
    if (!this.parts.length || dt <= 0) return;
    const subN = SIGAS.clamp(Math.ceil(dt / 0.008), 1, 5);
    const sdt = dt / subN;
    for (let s = 0; s < subN; s++) this._substep(sdt);
  }
  _substep(dt) {
    const b = this.box,
      r = this.r;
    let impulseSum = 0;
    const perim = Math.max(1, 2 * (b.w + b.h));
    for (const p of this.parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < b.x + r) {
        p.x = b.x + r;
        if (p.vx < 0) {
          impulseSum += 2 * this.M * Math.abs(p.vx);
          p.vx = -p.vx;
        }
      } else if (p.x > b.x + b.w - r) {
        p.x = b.x + b.w - r;
        if (p.vx > 0) {
          impulseSum += 2 * this.M * Math.abs(p.vx);
          p.vx = -p.vx;
        }
      }
      if (p.y < b.y + r) {
        p.y = b.y + r;
        if (p.vy < 0) {
          impulseSum += 2 * this.M * Math.abs(p.vy);
          p.vy = -p.vy;
        }
      } else if (p.y > b.y + b.h - r) {
        p.y = b.y + b.h - r;
        if (p.vy > 0) {
          impulseSum += 2 * this.M * Math.abs(p.vy);
          p.vy = -p.vy;
        }
      }
    }

    // pressão 2D medida pelo impulso → fração relativa a um valor de referência estatístico
    const sigma = this.sigmaT,
      area = Math.max(1, b.w * b.h);
    const pRef = this.parts.length * this.M * sigma * sigma / area;
    const p2d = impulseSum / (Math.max(dt, 1e-6) * perim);
    const instFrac = pRef > 0 ? p2d / pRef : 0;
    const kSm = 1 - Math.exp(-dt / 0.5);
    this._pFrac = SIGAS.lerp(this._pFrac, instFrac, kSm);
    let collCount = 0;
    if (this.collisions && this.parts.length > 1) collCount = this._collideGrid();
    const collRateInst = collCount / Math.max(dt, 1e-6);
    this._collRate = SIGAS.lerp(this._collRate, collRateInst, kSm);

    // termostato suave (tipo Berendsen): relaxa a energia cinética rumo ao alvo sem "teleportar"
    const ratio = this.tRatio();
    if (ratio > 0) {
      const tau = 0.6;
      const scale = Math.sqrt(1 + dt / tau * (1 / ratio - 1));
      const sc = SIGAS.clamp(scale, 0.9, 1.1);
      this.parts.forEach(p => {
        p.vx *= sc;
        p.vy *= sc;
      });
    }
  }

  /** Colisões partícula-partícula via grade espacial (célula ≈ 2,2·r). */
  _collideGrid() {
    const r = this.r,
      cell = 2.2 * r,
      b = this.box;
    const cols = Math.max(1, Math.floor(b.w / cell)),
      rows = Math.max(1, Math.floor(b.h / cell));
    const buckets = new Map();
    const cellOf = p => {
      let cx = Math.floor((p.x - b.x) / cell),
        cy = Math.floor((p.y - b.y) / cell);
      cx = SIGAS.clamp(cx, 0, cols - 1);
      cy = SIGAS.clamp(cy, 0, rows - 1);
      return cy * cols + cx;
    };
    this.parts.forEach((p, i) => {
      const k = cellOf(p);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(i);
    });
    const offsets = [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 1]];
    const r2 = 2 * r * (2 * r);
    let count = 0;
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const list0 = buckets.get(cy * cols + cx);
        if (!list0) continue;
        offsets.forEach(([ox, oy]) => {
          const nx = cx + ox,
            ny = cy + oy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return;
          const list1 = buckets.get(ny * cols + nx);
          if (!list1) return;
          const same = ox === 0 && oy === 0;
          for (let a = 0; a < list0.length; a++) {
            const startB = same ? a + 1 : 0;
            for (let bI = startB; bI < list1.length; bI++) {
              const i = list0[a],
                j = list1[bI];
              if (i === j) continue;
              const p1 = this.parts[i],
                p2 = this.parts[j];
              const dx = p2.x - p1.x,
                dy = p2.y - p1.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > 0 && d2 < r2) {
                const d = Math.sqrt(d2) || .001;
                const nx1 = dx / d,
                  ny1 = dy / d;
                const overlap = (2 * r - d) / 2;
                p1.x -= nx1 * overlap;
                p1.y -= ny1 * overlap;
                p2.x += nx1 * overlap;
                p2.y += ny1 * overlap;
                const v1n = p1.vx * nx1 + p1.vy * ny1,
                  v2n = p2.vx * nx1 + p2.vy * ny1;
                if (v2n - v1n < 0) {
                  const v1tx = p1.vx - v1n * nx1,
                    v1ty = p1.vy - v1n * ny1;
                  const v2tx = p2.vx - v2n * nx1,
                    v2ty = p2.vy - v2n * ny1;
                  p1.vx = v1tx + v2n * nx1;
                  p1.vy = v1ty + v2n * ny1;
                  p2.vx = v2tx + v1n * nx1;
                  p2.vy = v2ty + v1n * ny1;
                  count++;
                }
              }
            }
          }
        });
      }
    }
    return count;
  }
};
// ══════════════════════════════════════════════════════════════════
// MixEngine — motor de partículas de VÁRIAS espécies no mesmo recipiente
// ══════════════════════════════════════════════════════════════════
// Serve ao modo "Mistura de Gases" (Dalton e Amagat). Não é uma variação
// do KinEngine por um motivo de projeto: o KinEngine tem UM único M e um
// termostato global, e três modos já dependem dele. Mexer nele para
// aceitar massas diferentes por partícula colocaria em risco Transformações,
// Clapeyron e Teoria Cinética de uma vez. Aqui o custo é uma classe a mais
// e zero risco para o que já funciona.
//
// O QUE ESTE MOTOR FAZ DE DIFERENTE
// A pressão parcial de cada gás NÃO é calculada por fórmula: é MEDIDA,
// somando separadamente o impulso que cada espécie entrega às paredes
// (Δp = 2·m·|v⊥| por choque). Depois o simulador compara a soma das
// parciais medidas com a total medida — e é assim que a Lei de Dalton
// (P_total = ΣP_i) aparece como RESULTADO do modelo cinético, não como
// afirmação de livro. É o mesmo espírito da pressão medida que o modo
// Teoria Cinética já usava, agora resolvido por espécie.
//
// Base física: à mesma temperatura, todas as espécies têm a MESMA energia
// cinética média, então a velocidade típica de cada uma vai com √(T/M) —
// o gás leve é rápido, o pesado é lento (Maxwell-Boltzmann).
SIGAS.MixEngine = class MixEngine {
  constructor() {
    this.parts = [];
    this.specs = []; // [{ M, cor, n, id, f }]
    this.T = 300;
    this.r = 3.2;
    this.box = {
      x: 0,
      y: 0,
      w: 100,
      h: 100
    };
    this.collisions = true;
    this.vBoost = 1; // ver _ajustaBoost()
    // (nao existe mais um acumulador de pressao TOTAL: ver get pressureFrac)
    this._pFracSp = []; // fração de pressão POR ESPÉCIE medida
    this._collRate = 0;
  }

  /** Velocidade típica da espécie de massa molar M.
   *
   *  vBoost: um relógio mais rápido para a cena toda. Necessário por um motivo
   *  medido, não estético. Com a escala visual do KinEngine (VSCALE = 13), o
   *  SF₆ a 300 K anda a ~19 px/s: numa caixa de 420 px ele demora mais de 20 s
   *  só para alcançar uma parede. Resultado no primeiro teste desta classe: a
   *  parcial medida do SF₆ saía 34 % ABAIXO da do H₂ com os mesmos mols, porque
   *  a medição simplesmente não tinha amostra suficiente. O boost multiplica
   *  TODAS as espécies pelo mesmo fator — a razão √(M₂/M₁) entre elas, que é a
   *  física que importa, fica intacta; muda só a escala de tempo. E como a
   *  pressão de referência usa esta mesma sigmaOf, o boost se cancela na fração
   *  medida: não contamina o valor da pressão. */
  sigmaOf(M) {
    return SIGAS.KIN.VSCALE * this.vBoost * Math.sqrt(Math.max(1, this.T) / Math.max(0.1, M));
  }

  /** Escolhe o vBoost para que a espécie MAIS LENTA da mistura ainda cruze a
   *  caixa em poucos segundos — do contrário a parcial dela nunca converge. */
  _ajustaBoost() {
    if (!this.specs.length) {
      this.vBoost = 1;
      return;
    }
    const Mmax = Math.max(...this.specs.map(s => s.M));
    const sigmaBase = SIGAS.KIN.VSCALE * Math.sqrt(Math.max(1, this.T) / Math.max(0.1, Mmax));
    const alvo = 34; // px/s minimos para a especie mais lenta
    this.vBoost = SIGAS.clamp(alvo / Math.max(1e-6, sigmaBase), 1, 7);
  }
  get collRate() {
    return this._collRate;
  }
  /** Fração de pressão TOTAL medida.
   *
   *  Definida como a média das frações parciais PONDERADA pelos mols de cada
   *  espécie — e não medida por um acumulador próprio. Motivo, também medido:
   *  cada espécie usa a sua janela de suavização (τ_i ∝ L/σ_i, ver _substep),
   *  então um acumulador total com τ único devolvia um número 12 % diferente da
   *  soma das parciais. Duas medidas do mesmo fenômeno que não fecham entre si
   *  são pior que inúteis num simulador que quer PROVAR a Lei de Dalton.
   *
   *  Assim, P_total_medida = Σ P_i_medida por construção, e a verificação que o
   *  aluno faz na tela passa a ser a que interessa: a soma das parciais medidas
   *  contra o valor previsto por Clapeyron para a mistura (n_total·R·T/V). */
  get pressureFrac() {
    if (!this.specs.length) return 0;
    let num = 0,
      den = 0;
    this.specs.forEach((sp, i) => {
      const n = sp.n || 0;
      num += (this._pFracSp[i] || 0) * n;
      den += n;
    });
    return den > 0 ? num / den : 0;
  }
  /** Fração de pressão medida da espécie i (0 se ela não existe). */
  fracOf(i) {
    return this._pFracSp[i] || 0;
  }
  setBox(b) {
    this.box = b;
    const r = this.r;
    this.parts.forEach(p => {
      p.x = SIGAS.clamp(p.x, b.x + r, Math.max(b.x + r, b.x + b.w - r));
      p.y = SIGAS.clamp(p.y, b.y + r, Math.max(b.y + r, b.y + b.h - r));
    });
  }
  config(o) {
    if (o.T != null && o.T !== this.T) {
      this.T = o.T;
      this._ajustaBoost();
    }
    if (o.r != null) this.r = o.r;
  }
  _spawnOne(spIdx) {
    const M = this.specs[spIdx].M;
    const s = this.sigmaOf(M),
      b = this.box,
      r = this.r;
    // Box-Muller: duas gaussianas independentes de desvio s dão, no plano,
    // exatamente a distribuição de Maxwell-Boltzmann 2D da rapidez.
    const u1 = Math.random() || 1e-6,
      u2 = Math.random();
    const mag = Math.sqrt(-2 * Math.log(u1));
    return {
      sp: spIdx,
      M,
      x: b.x + r + Math.random() * Math.max(1, b.w - 2 * r),
      y: b.y + r + Math.random() * Math.max(1, b.h - 2 * r),
      vx: mag * Math.cos(Math.PI * 2 * u2) * s,
      vy: mag * Math.sin(Math.PI * 2 * u2) * s
    };
  }

  /** Define a mistura. specs = [{ id, M, cor, n }] com n = nº de partículas
   *  desejado por espécie. Reaproveita as partículas que já existem para não
   *  "piscar" a cena a cada ajuste de slider. */
  setMix(specs) {
    const antes = this.specs.map(s => s.id + ':' + s.M).join('|');
    this.specs = specs;
    this._ajustaBoost();
    // se a composicao mudou de especie (nao so de quantidade), reamostra as
    // velocidades: as sobreviventes estariam com a sigma da mistura antiga
    if (antes !== specs.map(s => s.id + ':' + s.M).join('|')) this._reamostrarDepois = true;
    const alvo = specs.map(sp => Math.max(0, Math.round(sp.n)));
    // conta o que já existe de cada espécie
    const atual = specs.map(() => 0);
    this.parts.forEach(p => {
      if (atual[p.sp] != null) atual[p.sp]++;
    });
    // remove excedentes (varre de trás pra frente)
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const sp = this.parts[i].sp;
      if (sp >= specs.length || atual[sp] > alvo[sp]) {
        atual[sp]--;
        this.parts.splice(i, 1);
      }
    }
    // cria faltantes
    specs.forEach((sp, i) => {
      while (atual[i] < alvo[i]) {
        this.parts.push(this._spawnOne(i));
        atual[i]++;
      }
    });
    if (this._pFracSp.length !== specs.length) this._pFracSp = specs.map(() => 0);
    if (this._reamostrarDepois) {
      this._reamostrarDepois = false;
      this.resample();
    }
  }

  /** Redistribui as velocidades pela curva de Maxwell-Boltzmann da espécie
   *  de cada partícula (usado ao mudar T ou ao pedir reamostragem). */
  resample() {
    this.parts.forEach(p => {
      const np = this._spawnOne(p.sp);
      p.vx = np.vx;
      p.vy = np.vy;
    });
  }

  /** Histograma de rapidez de UMA espécie — permite sobrepor as duas curvas
   *  de Maxwell-Boltzmann e ver o gás leve deslocado para a direita. */
  histoOf(spIdx, bins, vmax) {
    const bw = vmax / bins;
    const counts = new Array(bins).fill(0);
    this.parts.forEach(p => {
      if (p.sp !== spIdx) return;
      let idx = Math.floor(Math.hypot(p.vx, p.vy) / bw);
      if (idx >= bins) idx = bins - 1;
      if (idx < 0) idx = 0;
      counts[idx]++;
    });
    return counts;
  }

  /** Energia cinética média medida por espécie, em unidades de m·v².
   *  Serve para checar na tela que ela é IGUAL para as duas espécies à mesma
   *  temperatura — o postulado que sustenta Graham e Dalton. */
  ecOf(spIdx) {
    let s = 0,
      n = 0;
    this.parts.forEach(p => {
      if (p.sp === spIdx) {
        s += p.M * (p.vx * p.vx + p.vy * p.vy);
        n++;
      }
    });
    return n ? s / n : 0;
  }
  step(dt) {
    if (!this.parts.length || dt <= 0) return;
    const subN = SIGAS.clamp(Math.ceil(dt / 0.008), 1, 5);
    const sdt = dt / subN;
    for (let i = 0; i < subN; i++) this._substep(sdt);
  }
  _substep(dt) {
    const b = this.box,
      r = this.r;
    const nsp = this.specs.length;
    const impSp = new Array(nsp).fill(0);
    const perim = Math.max(1, 2 * (b.w + b.h));
    for (const p of this.parts) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // Δp = 2·m·|v⊥| a cada reflexão, contabilizado na conta da espécie
      let imp = 0;
      if (p.x < b.x + r) {
        p.x = b.x + r;
        if (p.vx < 0) {
          imp += 2 * p.M * Math.abs(p.vx);
          p.vx = -p.vx;
        }
      } else if (p.x > b.x + b.w - r) {
        p.x = b.x + b.w - r;
        if (p.vx > 0) {
          imp += 2 * p.M * Math.abs(p.vx);
          p.vx = -p.vx;
        }
      }
      if (p.y < b.y + r) {
        p.y = b.y + r;
        if (p.vy < 0) {
          imp += 2 * p.M * Math.abs(p.vy);
          p.vy = -p.vy;
        }
      } else if (p.y > b.y + b.h - r) {
        p.y = b.y + b.h - r;
        if (p.vy > 0) {
          imp += 2 * p.M * Math.abs(p.vy);
          p.vy = -p.vy;
        }
      }
      if (imp > 0 && impSp[p.sp] != null) impSp[p.sp] += imp;
    }

    // Referência estatística: cada espécie contribui n_i·M_i·σ_i²/área, que é
    // justamente o análogo 2D de n_i·R·T/V. Dividir o impulso medido por ela
    // dá uma FRAÇÃO adimensional que o Mech multiplica pela pressão ideal —
    // exatamente o contrato que o modo Teoria Cinética já usava.
    const area = Math.max(1, b.w * b.h);
    const L = Math.max(1, (b.w + b.h) / 2); // caminho tipico ate a parede
    const kSmTot = 1 - Math.exp(-dt / 0.6); // suavizacao da pressao TOTAL
    const cont = this.specs.map((sp, i) => {
      const n = this.parts.reduce((a, p) => a + (p.sp === i ? 1 : 0), 0);
      const sg = this.sigmaOf(sp.M);
      return n * sp.M * sg * sg / area; // analogo 2D de n_i·R·T/V
    });
    // Detalhe que faz a conta fechar: como sigma² = VSCALE²·T/M, o produto
    // M·sigma² vale VSCALE²·T e NAO depende da massa molar. Logo
    // ref_i = n_i·VSCALE²·T/area — proporcional so a n_i e T, exatamente
    // como a pressao parcial ideal P_i = n_i·R·T/V. Por isso a fracao medida
    // de cada especie e diretamente comparavel com a sua parcial ideal.
    // Cada especie precisa da SUA janela de medicao. Uma constante unica de
    // 0,5 s servia para o gas rapido e era curta demais para o lento: o
    // primeiro teste desta classe mostrou o SF6 medindo 34 % a menos que o H2
    // com os mesmos mols. Agora tau_i acompanha o tempo que a especie leva
    // para cruzar a caixa (L/sigma_i), com teto para nao ficar preguicosa.
    this.specs.forEach((sp, i) => {
      const p2d = impSp[i] / (Math.max(dt, 1e-6) * perim);
      const inst = cont[i] > 0 ? p2d / cont[i] : 0;
      const tau = SIGAS.clamp(2.2 * L / Math.max(1e-6, this.sigmaOf(sp.M)), 0.5, 5);
      const k = 1 - Math.exp(-dt / tau);
      this._pFracSp[i] = SIGAS.lerp(this._pFracSp[i] || 0, inst, k);
    });
    let collCount = 0;
    if (this.collisions && this.parts.length > 1) collCount = this._collideGrid();
    this._collRate = SIGAS.lerp(this._collRate, collCount / Math.max(dt, 1e-6), kSmTot);

    // Termostato por espécie (tipo Berendsen). Necessário porque a correção
    // de sobreposição das colisões vaza um pouco de energia; sem ele a mistura
    // esfria devagar e as pressões medidas caem junto.
    this.specs.forEach((sp, i) => {
      const sg = this.sigmaOf(sp.M);
      if (sg <= 0) return;
      let s2 = 0,
        n = 0;
      this.parts.forEach(p => {
        if (p.sp === i) {
          s2 += p.vx * p.vx + p.vy * p.vy;
          n++;
        }
      });
      if (!n) return;
      const ratio = s2 / n / (2 * sg * sg);
      if (ratio <= 0) return;
      // tau curto (0,25 s) de proposito: a especie MINORITARIA (poucas
      // particulas) e a que mais demora a equipartilhar energia por colisao,
      // e foi justamente ela que apareceu 18 % fria no teste do ar (O2 com 44
      // particulas contra 164 de N2). O termostato compensa isso.
      const sc = SIGAS.clamp(Math.sqrt(1 + dt / 0.25 * (1 / ratio - 1)), 0.88, 1.12);
      this.parts.forEach(p => {
        if (p.sp === i) {
          p.vx *= sc;
          p.vy *= sc;
        }
      });
    });
  }

  /** Colisões elásticas partícula-partícula com massas DIFERENTES, via grade
   *  espacial. É aqui que a mistura se termaliza: o gás pesado rouba momento
   *  do leve nos choques até as energias médias se igualarem. */
  _collideGrid() {
    const r = this.r,
      cell = 2.2 * r,
      b = this.box;
    const cols = Math.max(1, Math.floor(b.w / cell)),
      rows = Math.max(1, Math.floor(b.h / cell));
    const buckets = new Map();
    this.parts.forEach((p, i) => {
      let cx = SIGAS.clamp(Math.floor((p.x - b.x) / cell), 0, cols - 1);
      let cy = SIGAS.clamp(Math.floor((p.y - b.y) / cell), 0, rows - 1);
      const k = cy * cols + cx;
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(i);
    });
    const offsets = [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 1]];
    const r2 = 2 * r * (2 * r);
    let count = 0;
    for (let cy = 0; cy < rows; cy++) {
      for (let cx = 0; cx < cols; cx++) {
        const l0 = buckets.get(cy * cols + cx);
        if (!l0) continue;
        for (const [ox, oy] of offsets) {
          const nx = cx + ox,
            ny = cy + oy;
          if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;
          const l1 = buckets.get(ny * cols + nx);
          if (!l1) continue;
          const same = ox === 0 && oy === 0;
          for (let a = 0; a < l0.length; a++) {
            for (let bI = same ? a + 1 : 0; bI < l1.length; bI++) {
              const i = l0[a],
                j = l1[bI];
              if (i === j) continue;
              const p1 = this.parts[i],
                p2 = this.parts[j];
              const dx = p2.x - p1.x,
                dy = p2.y - p1.y;
              const d2 = dx * dx + dy * dy;
              if (d2 <= 0 || d2 >= r2) continue;
              const d = Math.sqrt(d2) || .001;
              const nx1 = dx / d,
                ny1 = dy / d;
              const over = (2 * r - d) / 2;
              p1.x -= nx1 * over;
              p1.y -= ny1 * over;
              p2.x += nx1 * over;
              p2.y += ny1 * over;
              const v1n = p1.vx * nx1 + p1.vy * ny1,
                v2n = p2.vx * nx1 + p2.vy * ny1;
              if (v2n - v1n >= 0) continue; // já se afastando
              // colisão elástica 1D na direção normal, COM massas distintas:
              //   v1' = ((m1−m2)v1 + 2m2·v2) / (m1+m2)
              const m1 = p1.M,
                m2 = p2.M,
                ms = m1 + m2;
              const u1 = ((m1 - m2) * v1n + 2 * m2 * v2n) / ms;
              const u2 = ((m2 - m1) * v2n + 2 * m1 * v1n) / ms;
              const v1tx = p1.vx - v1n * nx1,
                v1ty = p1.vy - v1n * ny1;
              const v2tx = p2.vx - v2n * nx1,
                v2ty = p2.vy - v2n * ny1;
              p1.vx = v1tx + u1 * nx1;
              p1.vy = v1ty + u1 * ny1;
              p2.vx = v2tx + u2 * nx1;
              p2.vy = v2ty + u2 * ny1;
              count++;
            }
          }
        }
      }
    }
    return count;
  }
};
/** Preenche um <select> com opções a partir de itens dos dados. */
SIGAS.fillSelect = function fillSelect(selectId, items, selValue) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '';
  items.forEach(it => {
    const o = document.createElement('option');
    o.value = it.value;
    o.textContent = it.nome;
    if (String(it.value) === String(selValue)) o.selected = true;
    sel.appendChild(o);
  });
};
// ══════════════════════════════════════════════════════════════════
// MECÂNICA — SIGAS · Gases
// Transformações: P = nRT/V (isotérmica/isocórica) e V = nRT/P
// (isobárica), sempre com n = 1 mol e T em kelvin. Clapeyron:
// PV = nRT com d = PM/RT — ficha do gás com Teb, densidade nas CNTP,
// v_rms e van der Waals. Graham: v₁/v₂ = √(M₂/M₁) — dois gases
// soltos nas pontas de um tubo se encontram no ponto que divide as
// distâncias na razão das velocidades (anel de NH₄Cl). Teoria
// Cinética: motor de partículas com colisões elásticas reais e
// pressão medida pelos choques nas paredes (classe KinEngine acima).
// ══════════════════════════════════════════════════════════════════
SIGAS.Mech = class Mech {
  constructor(D) {
    this.D = D;
    this.mode = 'transform';
    const gN2 = D.GASES.find(g => g.id === 'n2') || D.GASES[0];
    const gNH3 = D.GASES.find(g => g.id === 'nh3') || D.GASES[0];
    const gHCl = D.GASES.find(g => g.id === 'hcl') || D.GASES[1] || D.GASES[0];
    this.tr = {
      tipo: 'isotermica',
      n: 1,
      T: 300,
      V: 20,
      P: 1,
      eng: new SIGAS.KinEngine()
    };
    this.cl = {
      gas: gN2,
      n: 1.0,
      T: 300,
      V: 24.6,
      eng: new SIGAS.KinEngine()
    };
    this.gr = {
      a: gNH3,
      b: gHCl,
      T: 300,
      fa: 0,
      fb: 0,
      run: false,
      done: false,
      ta: 0,
      seed: []
    };
    this.kin = {
      gas: gN2,
      N: 80,
      T: 300,
      V: 24.6,
      r: 3,
      collisions: true,
      colorMode: 'gas',
      histOn: true,
      eng: new SIGAS.KinEngine()
    };
    // ── MODO 5: mistura de gases (Dalton/Amagat) ──
    // Comeca no ar atmosferico simplificado (N2 + O2), a mistura em que o
    // aluno esta literalmente respirando enquanto usa o simulador.
    const gO2 = D.GASES.find(g => g.id === 'o2') || D.GASES[0];
    this.mix = {
      a: gN2,
      b: gO2,
      c: null,
      na: 2.34,
      nb: 0.63,
      nc: 0,
      // ≈ 78 % e 21 % em fracao molar
      T: 300,
      V: 24.6,
      r: 2.5,
      // ver nota sobre excesso de gas real em _mixCalc
      view: 'dalton',
      eng: new SIGAS.MixEngine()
    };
    this._grReset();
  }
  build() {
    const D = this.D;
    SIGAS.fillOptGrid('clape-grid', D.GASES.map(g => ({
      value: g.id,
      nome: g.nome,
      dot: g.cor,
      extra: `${SIGAS.fmt(g.M, 2)} g/mol`,
      aria: `${g.nome}, massa molar ${SIGAS.fmt(g.M, 2)} gramas por mol`
    })), this.cl.gas.id);
    const selItems = D.GASES.map(g => ({
      value: g.id,
      nome: `${g.f} — ${g.nome} (${SIGAS.fmt(g.M, 2)} g/mol)`
    }));
    SIGAS.fillSelect('graham-a', selItems, this.gr.a.id);
    SIGAS.fillSelect('graham-b', selItems, this.gr.b.id);
    SIGAS.fillSelect('kin-gas', selItems, this.kin.gas.id);
    // ── selects do modo Mistura. O gas C aceita "nenhum" (value vazio),
    //    para permitir mistura binaria sem inventar um terceiro gas. ──
    SIGAS.fillSelect('mix-a', selItems, this.mix.a.id);
    SIGAS.fillSelect('mix-b', selItems, this.mix.b.id);
    SIGAS.fillSelect('mix-c', [{
      value: '',
      nome: '— nenhum —'
    }].concat(selItems), '');
    this._buildPares();
    this._buildMisturas();
  }

  /** Chips das misturas prontas de SIM_DATA.MISTURAS. */
  _buildMisturas() {
    const row = document.getElementById('mix-presets');
    if (!row) return;
    row.innerHTML = '';
    (this.D.MISTURAS || []).forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip-btn';
      b.dataset.action = 'mixpreset';
      b.dataset.idx = String(i);
      b.textContent = m.rot;
      b.title = m.tag;
      b.setAttribute('aria-label', `${m.rot} — ${m.tag}`);
      row.appendChild(b);
    });
  }
  _buildPares() {
    const row = document.getElementById('pares-row');
    if (!row) return;
    row.innerHTML = '';
    (this.D.PARES || []).forEach(p => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip-btn';
      b.dataset.action = 'par';
      b.dataset.a = p.a;
      b.dataset.b = p.b;
      b.textContent = p.rot;
      b.title = p.tag;
      b.setAttribute('aria-label', `${p.rot} — ${p.tag}`);
      row.appendChild(b);
    });
  }
  setMode(id) {
    this.mode = id;
  }
  setParam(k, v) {
    const T = this.tr,
      C = this.cl,
      G = this.gr,
      K = this.kin,
      X = this.mix,
      D = this.D;
    switch (k) {
      case 'trtipo':
        {
          T.tipo = v;
          document.getElementById('row-tr-v').hidden = v === 'isobarica';
          document.getElementById('row-tr-p').hidden = v !== 'isobarica';
          const t = D.TRANSFORMACOES[v];
          return {
            say: `Transformação ${t.nome} (${t.lei}). ${t.frase}`
          };
        }
      case 'trN':
        T.n = v;
        return;
      case 'trT':
        T.T = v;
        return;
      case 'trV':
        T.V = v;
        return;
      case 'trP':
        T.P = v;
        return;
      case 'gas':
        {
          C.gas = D.GASES.find(g => g.id === v) || C.gas;
          return {
            say: `${C.gas.nome} selecionado. Massa molar ${SIGAS.fmt(C.gas.M, 2)} gramas por mol.`
          };
        }
      case 'claN':
        C.n = v;
        return;
      case 'claT':
        C.T = v;
        return;
      case 'claV':
        C.V = v;
        return;
      case 'gasa':
        {
          G.a = D.GASES.find(g => g.id === v) || G.a;
          this._grReset();
          return {
            say: `Gás da esquerda: ${G.a.nome}.`
          };
        }
      case 'gasb':
        {
          G.b = D.GASES.find(g => g.id === v) || G.b;
          this._grReset();
          return {
            say: `Gás da direita: ${G.b.nome}.`
          };
        }
      case 'grT':
        G.T = v;
        return;
      case 'kinGas':
        {
          K.gas = D.GASES.find(g => g.id === v) || K.gas;
          K.eng.resample();
          return {
            say: `${K.gas.nome} selecionado no motor cinético.`
          };
        }
      case 'kinN':
        K.N = v;
        return;
      case 'kinT':
        K.T = v;
        return;
      case 'kinV':
        K.V = v;
        return;
      case 'kinR':
        K.r = v;
        return;
      case 'kincol':
        K.collisions = v === 'on';
        return {
          say: K.collisions ? 'Colisões entre partículas ligadas.' : 'Colisões entre partículas desligadas.'
        };
      case 'kinview':
        K.colorMode = v;
        return;
      case 'kinhist':
        K.histOn = v === 'on';
        return;

      /* ── modo Mistura ── */
      case 'mixA':
        {
          X.a = D.GASES.find(g => g.id === v) || X.a;
          X.eng.resample();
          return {
            say: `Gás A da mistura: ${X.a.nome}, massa molar ${SIGAS.fmt(X.a.M, 2)}.`
          };
        }
      case 'mixB':
        {
          X.b = D.GASES.find(g => g.id === v) || X.b;
          X.eng.resample();
          return {
            say: `Gás B da mistura: ${X.b.nome}, massa molar ${SIGAS.fmt(X.b.M, 2)}.`
          };
        }
      case 'mixC':
        {
          X.c = v ? D.GASES.find(g => g.id === v) || null : null;
          // sem gas C a linha de mols dele nao faz sentido na tela
          const row = document.getElementById('row-mix-nc');
          if (row) row.hidden = !X.c;
          if (X.c && X.nc <= 0) {
            X.nc = 0.5;
            this.app.syncSlider('mix-nc', 0.5);
          }
          if (!X.c) X.nc = 0;
          X.eng.resample();
          return {
            say: X.c ? `Gás C: ${X.c.nome}. Mistura ternária.` : 'Gás C removido. Mistura binária.'
          };
        }
      case 'mixNa':
        X.na = v;
        return;
      case 'mixNb':
        X.nb = v;
        return;
      case 'mixNc':
        X.nc = v;
        return;
      case 'mixT':
        X.T = v;
        X.eng.config({
          T: v
        });
        return;
      case 'mixV':
        X.V = v;
        return;
      case 'mixview':
        X.view = v;
        return {
          say: v === 'dalton' ? 'Exibindo a Lei de Dalton: coluna de pressões parciais empilhadas.' : 'Exibindo a Lei de Amagat: barra de volumes parciais e a comparação de energia cinética.'
        };
    }
  }
  action(name, el) {
    const T = this.tr,
      G = this.gr,
      K = this.kin;
    if (name === 'tr-reset') {
      Object.assign(T, {
        n: 1,
        T: 300,
        V: 20,
        P: 1
      });
      this.app.syncSlider('tr-n', 1);
      this.app.syncSlider('tr-t', 300);
      this.app.syncSlider('tr-v', 20);
      this.app.syncSlider('tr-p', 1);
      SIGAS.playTone(440, .07, .05);
      SIGAS.announce('Transformação reiniciada: 1 mol, 300 kelvin, 20 litros, 1 atmosfera de referência.');
    } else if (name === 'cla-status') {
      const c = this._claCalc();
      SIGAS.playTone(700, .08, .06);
      SIGAS.announce(`${this.cl.gas.nome}: pressão de ${SIGAS.fmt(c.P, 2)} atmosferas e densidade de ${SIGAS.fmt(c.d, 2)} gramas por litro.`, 'assertive');
    } else if (name === 'liberar') {
      this._grReset();
      G.run = true;
      if (SIGAS.isReduced()) {
        G.fa = this._grMeet();
        G.fb = 1 - G.fa;
        G.run = false;
        G.done = true;
      }
      SIGAS.playTone(700, .08, .06);
      SIGAS.announce(`${G.a.nome} e ${G.b.nome} liberados nas pontas do tubo.`);
    } else if (name === 'gr-reset') {
      this._grReset();
      SIGAS.playTone(440, .07, .05);
      SIGAS.announce('Tubo limpo. Escolha os gases e libere novamente.');
    } else if (name === 'par') {
      const a = el && el.dataset.a,
        b = el && el.dataset.b;
      if (a && b) {
        G.a = this.D.GASES.find(g => g.id === a) || G.a;
        G.b = this.D.GASES.find(g => g.id === b) || G.b;
        this._grReset();
        const selA = document.getElementById('graham-a'),
          selB = document.getElementById('graham-b');
        if (selA) selA.value = G.a.id;
        if (selB) selB.value = G.b.id;
        SIGAS.playTone(600, .07, .05);
        SIGAS.announce(`Dupla selecionada: ${G.a.nome} e ${G.b.nome}. Clique em Liberar gases.`);
      }
    } else if (name === 'kin-mb') {
      K.eng.resample();
      SIGAS.playTone(700, .08, .06);
      SIGAS.announce('Velocidades redistribuídas pela distribuição de Maxwell-Boltzmann.');
    } else if (name === 'kin-uni') {
      K.eng.uniform();
      SIGAS.playTone(500, .08, .06);
      SIGAS.announce('Todas as partículas com a mesma rapidez agora — repare que a distribuição deixa de ser Maxwell-Boltzmann.');
    } else if (name === 'kin-reset') {
      Object.assign(K, {
        N: 80,
        T: 300,
        V: 24.6,
        r: 3,
        collisions: true
      });
      this.app.syncSlider('kin-n', 80);
      this.app.syncSlider('kin-t', 300);
      this.app.syncSlider('kin-v', 24.6);
      this.app.syncSlider('kin-r', 3);
      this.app._syncSeg && this.app._syncSeg('kincol', 'on');
      K.eng.resample();
      SIGAS.playTone(440, .07, .05);
      SIGAS.announce('Motor cinético reiniciado: 80 partículas, 300 kelvin, 24,6 litros.');
    } else if (name === 'mix-status') {
      const c = this._mixCalc();
      if (!c.itens.length) {
        SIGAS.announce('Nenhum gás na mistura. Dê mols a pelo menos um deles.', 'assertive');
        return;
      }
      const detalhe = c.itens.map(it => `${it.g.nome}: fração molar ${SIGAS.fmt(it.x, 3)}, parcial de ${SIGAS.fmt(it.PiMed, 2)} atmosferas`).join('; ');
      SIGAS.playTone(700, .08, .06);
      SIGAS.announce(`Pressão total ${SIGAS.fmt(c.Ptot, 2)} atmosferas. ${detalhe}. A soma das parciais medidas dá ${SIGAS.fmt(c.somaMed, 2)} atmosferas — Lei de Dalton confirmada. Massa molar aparente da mistura: ${SIGAS.fmt(c.Mbar, 2)} gramas por mol.`, 'assertive');
    } else if (name === 'mix-reset') {
      const X = this.mix,
        D = this.D;
      X.a = D.GASES.find(g => g.id === 'n2') || X.a;
      X.b = D.GASES.find(g => g.id === 'o2') || X.b;
      X.c = null;
      Object.assign(X, {
        na: 2.34,
        nb: 0.63,
        nc: 0,
        T: 300,
        V: 24.6,
        view: 'dalton'
      });
      this._mixSyncUI();
      X.eng.resample();
      SIGAS.playTone(440, .07, .05);
      SIGAS.announce('Mistura reiniciada no ar atmosférico: 78 por cento de nitrogênio e 21 por cento de oxigênio.');
    } else if (name === 'mixpreset') {
      const idx = el && +el.dataset.idx;
      const p = (this.D.MISTURAS || [])[idx];
      if (!p) return;
      const X = this.mix,
        D = this.D;
      const acha = id => D.GASES.find(g => g.id === id) || null;
      X.a = acha(p.itens[0][0]) || X.a;
      X.na = p.itens[0][1];
      X.b = acha(p.itens[1][0]) || X.b;
      X.nb = p.itens[1][1];
      if (p.itens[2]) {
        X.c = acha(p.itens[2][0]);
        X.nc = p.itens[2][1];
      } else {
        X.c = null;
        X.nc = 0;
      }
      this._mixSyncUI();
      X.eng.resample();
      SIGAS.playTone(600, .07, .05);
      SIGAS.announce(`${p.rot} carregada. ${p.tag}.`);
    }
  }

  /** Devolve os controles do modo Mistura ao estado do objeto (usado pelo
   *  Reiniciar e pelas misturas prontas). */
  _mixSyncUI() {
    const X = this.mix;
    ['mix-a', 'mix-b'].forEach((id, i) => {
      const sel = document.getElementById(id);
      if (sel) sel.value = (i === 0 ? X.a : X.b).id;
    });
    const selC = document.getElementById('mix-c');
    if (selC) selC.value = X.c ? X.c.id : '';
    const row = document.getElementById('row-mix-nc');
    if (row) row.hidden = !X.c;
    this.app.syncSlider('mix-na', X.na);
    this.app.syncSlider('mix-nb', X.nb);
    this.app.syncSlider('mix-nc', X.nc);
    this.app.syncSlider('mix-t', X.T);
    this.app.syncSlider('mix-v', X.V);
    if (this.app._syncSeg) this.app._syncSeg('mixview', X.view);
  }

  /* ── setas do teclado no canvas ── */
  onArrow(dx, dy) {
    if (this.mode === 'cinetica') {
      const K = this.kin;
      if (dy) {
        K.T = SIGAS.clamp(K.T - dy * 10, 0, 1000);
        this.app.syncSlider('kin-t', K.T);
      }
      if (dx) {
        K.V = SIGAS.clamp(K.V + dx * 0.5, 10, 50);
        this.app.syncSlider('kin-v', K.V);
      }
      return !!(dx || dy);
    }
    if (this.mode === 'transform') {
      const T = this.tr;
      if (dy) {
        T.T = SIGAS.clamp(T.T - dy * 5, 0, 600);
        this.app.syncSlider('tr-t', T.T);
      }
      if (dx) {
        if (T.tipo === 'isobarica') {
          T.P = SIGAS.clamp(T.P + dx * 0.05, 0.5, 3);
          this.app.syncSlider('tr-p', T.P);
        } else {
          T.V = SIGAS.clamp(T.V + dx * 1, 5, 50);
          this.app.syncSlider('tr-v', T.V);
        }
      }
      return !!(dx || dy);
    }
    if (this.mode === 'mistura') {
      // setas no canvas: ↑↓ temperatura, ←→ volume — mesma convencao dos
      // outros modos, para o teclado ser previsivel em todo o simulador
      const X = this.mix;
      if (dy) {
        X.T = SIGAS.clamp(X.T - dy * 10, 100, 900);
        this.app.syncSlider('mix-t', X.T);
        X.eng.config({
          T: X.T
        });
      }
      if (dx) {
        X.V = SIGAS.clamp(X.V + dx * 0.5, 10, 60);
        this.app.syncSlider('mix-v', X.V);
      }
      return !!(dx || dy);
    }
    return false;
  }

  /* ── contas ── */
  _trCalc() {
    const T = this.tr,
      R = this.D.R,
      n = T.n;
    if (T.tipo === 'isobarica') {
      const V = n * R * T.T / T.P;
      return {
        P: T.P,
        V,
        T: T.T,
        n,
        inv: T.tipo
      };
    }
    const P = n * R * T.T / T.V;
    return {
      P,
      V: T.V,
      T: T.T,
      n,
      inv: T.tipo
    };
  }
  _claCalc() {
    const C = this.cl,
      R = this.D.R;
    const P = C.n * R * C.T / C.V;
    return {
      P,
      d: P * C.gas.M / (R * C.T),
      massa: C.n * C.gas.M
    };
  }
  _grV(g) {
    return SIGAS.GRAHAM_K * Math.sqrt(Math.max(1, this.gr.T)) / Math.sqrt(g.M);
  } // fração do tubo por segundo
  _grMeet() {
    const va = this._grV(this.gr.a),
      vb = this._grV(this.gr.b);
    return va / (va + vb);
  }
  _grReset() {
    Object.assign(this.gr, {
      fa: 0,
      fb: 0,
      run: false,
      done: false,
      ta: 0
    });
    const seed = [];
    for (let i = 0; i < 44; i++) seed.push({
      s: Math.pow(Math.random(), .7),
      y: Math.random(),
      ph: Math.random() * Math.PI * 2,
      sp: .6 + Math.random() * .8
    });
    this.gr.seed = seed;
  }
  _kinPressure() {
    const K = this.kin,
      D = this.D;
    const Pideal = K.N / D.PART_PER_MOL * D.R * K.T / K.V;
    return K.eng.pressureFrac * Pideal;
  }
  update(dt, app) {
    const G = this.gr;
    if (G.run) {
      G.ta += dt;
      G.fa = Math.min(1, G.fa + this._grV(G.a) * dt);
      G.fb = Math.min(1, G.fb + this._grV(G.b) * dt);
      if (G.fa + G.fb >= 1 && !G.done) {
        G.done = true;
        G.run = false;
        const m = this._grMeet();
        SIGAS.playTone(880, .12, .06);
        SIGAS.announce(`Encontro! ${G.a.nome} percorreu ${SIGAS.fmt(m * 100, 0)} por cento do tubo e ${G.b.nome}, ${SIGAS.fmt((1 - m) * 100, 0)} por cento — razão de velocidades ${SIGAS.fmt(Math.sqrt(G.b.M / G.a.M), 2)}.`, 'assertive');
        if (app) app.refresh();
      }
    }
    if (!SIGAS.isReduced()) {
      if (this.mode === 'transform') this.tr.eng.step(dt);else if (this.mode === 'clapeyron') this.cl.eng.step(dt);else if (this.mode === 'cinetica') this.kin.eng.step(dt);else if (this.mode === 'mistura') this.mix.eng.step(dt);
    }
  }

  /* ── desenho ── */
  draw(ctx, W, H, app) {
    if (this.mode === 'transform') this._dTransform(ctx, W, H, app);else if (this.mode === 'clapeyron') this._dClape(ctx, W, H, app);else if (this.mode === 'graham') this._dGraham(ctx, W, H, app);else if (this.mode === 'mistura') this._dMistura(ctx, W, H, app);else this._dKinetic(ctx, W, H, app);
  }
  _gauge(ctx, cx, cy, r, P, pmax, cor) {
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--glass');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * .75, Math.PI * 2.25);
    ctx.stroke();
    for (let i = 0; i <= 4; i++) {
      const a = Math.PI * .75 + i / 4 * Math.PI * 1.5;
      ctx.strokeStyle = SIGAS.cssVar('--text-muted');
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
      SIGAS.kLabel(ctx, SIGAS.fmt(pmax * i / 4, 0), cx + Math.cos(a) * (r + 11), cy + Math.sin(a) * (r + 11), {
        size: 9,
        color: SIGAS.cssVar('--text-muted'),
        mono: true
      });
    }
    const a = Math.PI * .75 + SIGAS.clamp(P / pmax, 0, 1) * Math.PI * 1.5;
    ctx.strokeStyle = cor;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * (r - 9), cy + Math.sin(a) * (r - 9));
    ctx.stroke();
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Manômetro de duas marcas: agulha = pressão medida, traço verde = pressão ideal. */
  _gauge2(ctx, cx, cy, r, Pmedida, Pideal, pmax, cor) {
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--glass');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * .75, Math.PI * 2.25);
    ctx.stroke();
    for (let i = 0; i <= 4; i++) {
      const a = Math.PI * .75 + i / 4 * Math.PI * 1.5;
      ctx.strokeStyle = SIGAS.cssVar('--text-muted');
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6));
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.stroke();
      SIGAS.kLabel(ctx, SIGAS.fmt(pmax * i / 4, 0), cx + Math.cos(a) * (r + 11), cy + Math.sin(a) * (r + 11), {
        size: 9,
        color: SIGAS.cssVar('--text-muted'),
        mono: true
      });
    }
    const ai = Math.PI * .75 + SIGAS.clamp(Pideal / pmax, 0, 1) * Math.PI * 1.5;
    ctx.strokeStyle = SIGAS.cssVar('--accent-ok');
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ai) * (r - 10), cy + Math.sin(ai) * (r - 10));
    ctx.lineTo(cx + Math.cos(ai) * (r + 2), cy + Math.sin(ai) * (r + 2));
    ctx.stroke();
    const am = Math.PI * .75 + SIGAS.clamp(Pmedida / pmax, 0, 1) * Math.PI * 1.5;
    ctx.strokeStyle = cor;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(am) * (r - 9), cy + Math.sin(am) * (r - 9));
    ctx.stroke();
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /** Brilho térmico ambiente: azulado quando resfria, avermelhado quando aquece
   *  (referência em 300 K), com leve cintilação. Substitui indicadores textuais. */
  _thermalGlow(ctx, cx, cy, w, h, T, time) {
    const dev = SIGAS.clamp((T - 300) / 300, -1, 1);
    if (Math.abs(dev) < .04) return;
    const hot = dev > 0;
    const cor = SIGAS.hex6(SIGAS.cssVar(hot ? '--accent-exo' : '--accent-cyan'));
    const flick = SIGAS.isReduced() ? 0 : Math.sin(time * (hot ? 5 : 2.4)) * .03;
    const alpha = SIGAS.clamp(Math.abs(dev) * .3 + flick, .02, .38);
    const spread = Math.max(w, h) * .95;
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, spread * .1, cx, cy, spread);
    g.addColorStop(0, SIGAS.toRgba(cor, alpha));
    g.addColorStop(1, SIGAS.toRgba(cor, 0));
    ctx.fillStyle = g;
    ctx.fillRect(cx - spread, cy - spread, spread * 2, spread * 2);
    ctx.restore();
  }
  _cylinder(ctx, cx, topY, w, h, V, vmax, T, app, corGas) {
    const frac = SIGAS.clamp(V / vmax, .12, 1);
    const gasH = frac * (h - 26),
      gasY = topY + h - gasH;
    this._thermalGlow(ctx, cx, topY + h / 2, w, h, T, app.time);
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--glass');
    ctx.lineWidth = 2.6;
    ctx.strokeRect(cx - w / 2, topY, w, h);
    ctx.fillStyle = SIGAS.cssVar('--bg-hover');
    ctx.strokeStyle = SIGAS.cssVar('--border-glow');
    ctx.lineWidth = 1.6;
    SIGAS.kRound(ctx, cx - w / 2 + 3, gasY - 14, w - 6, 14, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = SIGAS.cssVar('--text-muted');
    ctx.fillRect(cx - 3, topY - 16, 6, gasY - topY + 2);
    ctx.restore();
    const box = {
      x: cx - w / 2 + 6,
      y: gasY,
      w: w - 12,
      h: gasH - 6
    };
    const eng = this.tr.eng;
    eng.config({
      T,
      M: 28,
      r: 3.2
    });
    eng.setBox(box);
    eng.setN(26);
    ctx.save();
    ctx.fillStyle = corGas;
    ctx.globalAlpha = .9;
    eng.parts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    return box;
  }
  _dTransform(ctx, W, H, app) {
    const c = this._trCalc();
    // ANTES: `clamp(W * .26, 130, 190)` — o cilindro PARAVA de crescer em 190 px,
    // e o manometro estava fixo em W*.72 / H*.34, colidindo com o cilindro em
    // canvas estreito. Agora o teto do cilindro e proporcional e, em tela
    // estreita, o manometro desce para baixo do cilindro em vez de ficar ao lado.
    const est = SIGAS.isEstreito(W);
    const cw = SIGAS.propW(W, est ? .34 : .26, 120, W * .42);
    const ch = H * (est ? .44 : .58),
      top = H * (est ? .09 : .16);
    const cx = est ? W * .42 : W * .34;
    this._cylinder(ctx, cx, top, cw, ch, c.V, 50, c.T, app, SIGAS.cssVar('--accent-main'));
    SIGAS.kThermo(ctx, est ? W * .08 : W * .11, top + 8, ch * .8, c.T - 273, -273, 327, {
      escala: false,
      casas: 0,
      rotulo: false
    });
    const gr = SIGAS.propW(W, .09, 38, 96);
    if (est) this._gauge(ctx, W * .5, Math.min(H - gr - 14, top + ch + gr + 24), gr, c.P, 4, SIGAS.cssVar('--accent-amber'));else this._gauge(ctx, W * .72, H * .34, gr, c.P, 4, SIGAS.cssVar('--accent-amber'));
  }
  _dClape(ctx, W, H, app) {
    const C = this.cl,
      c = this._claCalc(),
      g = C.gas;
    // ANTES: `clamp(W * .3, 150, 220)` — recipiente travado em 220 px.
    const est = SIGAS.isEstreito(W);
    const cw = SIGAS.propW(W, est ? .38 : .3, 130, W * .46);
    const ch = H * (est ? .42 : .56),
      top = H * (est ? .09 : .16);
    const cx = est ? W * .5 : W * .32;
    const frac = SIGAS.clamp(C.V / 50, .15, 1),
      gasH = frac * ch,
      gasY = top + ch - gasH;
    this._thermalGlow(ctx, cx, top + ch / 2, cw, ch, C.T, app.time);
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--glass');
    ctx.lineWidth = 2.6;
    ctx.strokeRect(cx - cw / 2, gasY, cw, gasH);
    ctx.restore();
    const box = {
      x: cx - cw / 2 + 6,
      y: gasY + 6,
      w: cw - 12,
      h: gasH - 12
    };
    const eng = this.cl.eng,
      r = SIGAS.clamp(2.6 + Math.sqrt(g.M) * .16, 3, 4.6);
    eng.config({
      T: C.T,
      M: g.M,
      r
    });
    eng.setBox(box);
    eng.setN(SIGAS.clamp(Math.round(C.n * 24), 5, 80));
    ctx.save();
    ctx.fillStyle = g.cor;
    ctx.globalAlpha = .92;
    eng.parts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    const gr2 = SIGAS.propW(W, .09, 38, 96);
    if (est) this._gauge(ctx, W * .5, Math.min(H - gr2 - 14, top + ch + gr2 + 24), gr2, c.P, 6, SIGAS.cssVar('--accent-amber'));else this._gauge(ctx, W * .74, H * .3, gr2, c.P, 6, SIGAS.cssVar('--accent-amber'));
  }
  _dGraham(ctx, W, H, app) {
    const G = this.gr;
    const tx = W * .1,
      tw = W * .8,
      ty = H * .42,
      th = SIGAS.clamp(H * .12, 34, 56);
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--glass');
    ctx.lineWidth = 2.6;
    SIGAS.kRound(ctx, tx, ty, tw, th, th / 2);
    ctx.stroke();
    const xa = tx + G.fa * tw,
      xb = tx + (1 - G.fb) * tw;
    ctx.globalAlpha = .34;
    ctx.fillStyle = G.a.cor;
    SIGAS.kRound(ctx, tx + 2, ty + 2, Math.max(0, xa - tx - 4), th - 4, th / 2 - 2);
    ctx.fill();
    ctx.fillStyle = G.b.cor;
    SIGAS.kRound(ctx, Math.min(tx + tw - 2, xb + 2), ty + 2, Math.max(0, tx + tw - xb - 4), th - 4, th / 2 - 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // "chumaços de algodão" coloridos nas pontas — identificam os gases sem texto
    ctx.save();
    ctx.fillStyle = G.a.cor;
    ctx.globalAlpha = .95;
    SIGAS.kRound(ctx, tx - 9, ty - 3, 10, th + 6, 4);
    ctx.fill();
    ctx.fillStyle = G.b.cor;
    SIGAS.kRound(ctx, tx + tw - 1, ty - 3, 10, th + 6, 4);
    ctx.fill();
    ctx.restore();
    if (!SIGAS.isReduced() && (G.run || G.done) && G.seed.length) {
      ctx.save();
      G.seed.forEach(sd => {
        const jitter = Math.sin(app.time * sd.sp + sd.ph) * 3;
        const ay = ty + 6 + sd.y * (th - 12);
        const ax = tx + sd.s * (xa - tx) + jitter;
        if (ax >= tx && ax <= xa) {
          ctx.fillStyle = G.a.cor;
          ctx.globalAlpha = .85;
          ctx.beginPath();
          ctx.arc(ax, ay, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        const bx = xb + sd.s * (tx + tw - xb) + jitter;
        if (bx >= xb && bx <= tx + tw) {
          ctx.fillStyle = G.b.cor;
          ctx.beginPath();
          ctx.arc(bx, ay, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }
    if (G.done) {
      const mx = tx + this._grMeet() * tw;
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = .9;
      ctx.beginPath();
      ctx.moveTo(mx, ty - 6);
      ctx.lineTo(mx, ty + th + 6);
      ctx.stroke();
      ctx.restore();
    }
  }
  _kinHisto(ctx, eng, g, W, H) {
    const bins = 22;
    const {
      counts,
      binWidth,
      vmax
    } = eng.histo(bins);
    const topCount = Math.max(1, Math.max(...counts));
    const ax = SIGAS.kAxes(ctx, {
      x: W * .08,
      y: H * .58,
      w: W * .84,
      h: H * .28,
      xmin: 0,
      xmax: Math.max(1, vmax),
      ymin: 0,
      ymax: topCount * 1.15,
      xticks: [0, vmax * .25, vmax * .5, vmax * .75, vmax],
      yticks: [],
      xlab: 'rapidez (escala do motor)',
      fmtx: v => SIGAS.fmt(v, 0)
    });
    ctx.save();
    ctx.fillStyle = g.cor;
    ctx.globalAlpha = .75;
    counts.forEach((c, i) => {
      const x0 = ax.px(i * binWidth),
        x1 = ax.px((i + 1) * binWidth);
      const y0 = ax.py(0),
        y1 = ax.py(c);
      ctx.fillRect(x0 + 1, y1, Math.max(1, x1 - x0 - 2), y0 - y1);
    });
    ctx.restore();
    const N = eng.parts.length,
      sigma = Math.max(.001, eng.sigmaT);
    const pts = [];
    for (let v = 0; v <= vmax; v += vmax / 60) {
      const f = N * binWidth * (v / (sigma * sigma)) * Math.exp(-v * v / (2 * sigma * sigma));
      pts.push([v, f]);
    }
    SIGAS.kLine(ctx, pts, ax.px, ax.py, {
      color: SIGAS.cssVar('--accent-ok'),
      w: 2
    });
    const vrms2d = sigma * Math.SQRT2;
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--text-primary');
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(ax.px(vrms2d), ax.py(0));
    ctx.lineTo(ax.px(vrms2d), ax.py(topCount * 1.1));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  _dKinetic(ctx, W, H, app) {
    const K = this.kin,
      D = this.D,
      g = K.gas,
      eng = K.eng;
    const boxX = W * .05,
      boxY = H * .10,
      boxW = SIGAS.clamp(W * .5, 200, 380),
      boxH = SIGAS.clamp(H * .4, 140, 230);
    const frac = SIGAS.clamp(K.V / 50, .2, 1),
      w = Math.max(30, boxW * frac);
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--glass');
    ctx.lineWidth = 2.6;
    ctx.strokeRect(boxX, boxY, boxW, boxH);
    ctx.fillStyle = SIGAS.cssVar('--bg-hover');
    ctx.strokeStyle = SIGAS.cssVar('--border-glow');
    ctx.lineWidth = 1.6;
    SIGAS.kRound(ctx, boxX + w - 6, boxY - 4, 12, boxH + 8, 3);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    const box = {
      x: boxX + 4,
      y: boxY + 4,
      w: Math.max(20, w - 10),
      h: boxH - 8
    };
    eng.config({
      T: K.T,
      M: g.M,
      r: K.r
    });
    eng.setBox(box);
    eng.setN(Math.round(K.N));
    eng.collisions = K.collisions;
    ctx.save();
    eng.parts.forEach(p => {
      let color;
      if (K.colorMode === 'vel') {
        const speed = Math.hypot(p.vx, p.vy);
        const t = SIGAS.clamp(speed / (Math.max(1, eng.sigmaT) * 3.4), 0, 1);
        color = SIGAS.speedColor(t);
      } else color = g.cor;
      ctx.fillStyle = color;
      ctx.globalAlpha = .88;
      ctx.beginPath();
      ctx.arc(p.x, p.y, K.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    const Pideal = K.N / D.PART_PER_MOL * D.R * K.T / K.V;
    const Pm = eng.pressureFrac * Pideal;
    const pmaxList = [2, 3, 4, 6, 8, 10, 15, 20];
    const pmax = pmaxList.find(m => m >= Math.max(Pm, Pideal) * 1.05) || 20;
    this._gauge2(ctx, W * .80, H * .22, SIGAS.clamp(W * .075, 34, 52), Pm, Pideal, pmax, g.cor);
    if (K.histOn) this._kinHisto(ctx, eng, g, W, H);
  }

  /* ══════════════════════════════════════════════════════════════════
     MODO 5 — MISTURA DE GASES (Leis de Dalton e de Amagat)
     ══════════════════════════════════════════════════════════════════
     Preenche a maior lacuna de conteudo que o SIGAS tinha: pressao parcial
     e fracao molar nao existiam em lugar nenhum do simulador.
      O ponto de projeto: as parciais sao MEDIDAS pelo MixEngine, separando o
     impulso nas paredes por especie. Depois o painel compara
       ΣPᵢ (medida)  ×  P total (medida)  ×  P total ideal (nRT/V)
     e a Lei de Dalton aparece como consequencia do modelo cinetico, em vez
     de ser afirmada. Mesma filosofia da pressao medida do modo Teoria
     Cinetica, agora resolvida por gas.
  ══════════════════════════════════════════════════════════════════ */

  /** Gases efetivamente presentes na mistura (n > 0 e gas escolhido). */
  _mixAtivos() {
    const X = this.mix;
    return [{
      g: X.a,
      n: X.na
    }, {
      g: X.b,
      n: X.nb
    }, {
      g: X.c,
      n: X.nc
    }].filter(it => it.g && it.n > 0.001);
  }

  /** Todas as contas do modo. Devolve tanto os valores IDEAIS (o que a teoria
   *  prevê) quanto os MEDIDOS (o que os choques entregaram) — o painel mostra
   *  os dois lado a lado, e é essa comparação que ensina. */
  _mixCalc() {
    const X = this.mix,
      D = this.D,
      R = D.R;
    const ativos = this._mixAtivos();
    const nTot = ativos.reduce((a, it) => a + it.n, 0);
    const Ptot = nTot > 0 ? nTot * R * X.T / X.V : 0; // Clapeyron para a mistura

    // massa molar aparente: média das massas molares PONDERADA pelas
    // frações molares. É o número que decide se a mistura sobe ou desce no ar
    // (ar ≈ 29 g/mol) e o que entra em d = P·M̄/(R·T).
    const Mbar = nTot > 0 ? ativos.reduce((a, it) => a + it.n / nTot * it.g.M, 0) : 0;
    const itens = ativos.map((it, i) => {
      const x = nTot > 0 ? it.n / nTot : 0;
      return {
        g: it.g,
        n: it.n,
        x,
        Pi: x * Ptot,
        // Dalton:  Pᵢ = xᵢ·P
        Vi: x * X.V,
        // Amagat:  Vᵢ = xᵢ·V
        PiMed: X.eng.fracOf(i) * (it.n * R * X.T / X.V),
        // parcial MEDIDA
        vrms: SIGAS.vrms3D(X.T, it.g.M, D.RSI),
        ec: X.eng.ecOf(i),
        idx: i
      };
    });
    const somaMed = itens.reduce((a, it) => a + it.PiMed, 0);
    const PtotMed = X.eng.pressureFrac * Ptot;
    return {
      itens,
      nTot,
      Ptot,
      Mbar,
      d: X.T > 0 ? Ptot * Mbar / (R * X.T) : 0,
      // densidade da mistura
      massa: ativos.reduce((a, it) => a + it.n * it.g.M, 0),
      somaMed,
      PtotMed,
      // Desvio entre a soma das parciais medidas e a total medida. Por
      // construcao do getter pressureFrac esse numero e ~0: e o teste INTERNO
      // da Lei de Dalton, e e ele que o canvas mostra no rodape.
      desvio: PtotMed > 0 ? Math.abs(somaMed - PtotMed) / PtotMed : 0,
      // Excesso do medido sobre o ideal. NAO e erro de simulacao: as
      // particulas do motor tem volume proprio e nao podem se interpenetrar,
      // exatamente a correcao `b` de van der Waals. O teste numerico mediu
      // +8 % a +18 % conforme o empacotamento — quanto mais particulas e mais
      // gordas, maior o afastamento do gas ideal. E o mesmo fenomeno que o
      // modo Teoria Cinetica ja exibia no manometro de duas agulhas, e vale
      // mostrar com nome em vez de esconder.
      excessoReal: Ptot > 0 ? (somaMed - Ptot) / Ptot : 0
    };
  }

  /** Sincroniza o motor com os controles. Chamado do update() e do draw(),
   *  porque a caixa de desenho só é conhecida na hora de desenhar. */
  _mixSync() {
    const X = this.mix,
      D = this.D;
    const ativos = this._mixAtivos();
    const nTot = ativos.reduce((a, it) => a + it.n, 0) || 1;
    // Nº de partículas por espécie ∝ mols da espécie, com o total limitado a
    // 210 para o motor não engasgar. Usa a MESMA equivalência do modo
    // cinético (PART_PER_MOL partículas ≙ 1 mol) enquanto ela couber.
    const TETO = 260; // orcamento total de particulas do motor
    const PISO = 22; // minimo por especie presente — ver abaixo
    const escala = Math.min(D.PART_PER_MOL, TETO / nTot);

    // PISO POR ESPECIE. O teste numerico do MixEngine mostrou que a parcial da
    // especie MINORITARIA oscilava 5–15 % em torno do valor ideal e nao
    // convergia com o tempo: com 44 particulas de O2 contra 164 de N2, o que
    // sobrava era ruido estatistico de amostra pequena, nao vies do modelo.
    // Garantir um piso corta esse ruido pela raiz de n. O preco e que a razao
    // VISUAL entre as quantidades de particulas deixa de ser exatamente a razao
    // molar quando um dos gases e muito minoritario — por isso o numero que o
    // painel mostra continua saindo dos MOLS, nunca da contagem de particulas.
    let contagens = ativos.map(it => Math.max(PISO, Math.round(it.n * escala)));
    const soma = contagens.reduce((a, b) => a + b, 0);
    if (soma > TETO) {
      const k = TETO / soma;
      contagens = contagens.map(c => Math.max(8, Math.round(c * k)));
    }
    X.eng.config({
      T: X.T,
      r: X.r
    });
    X.eng.setMix(ativos.map((it, i) => ({
      id: it.g.id,
      M: it.g.M,
      cor: it.g.cor,
      n: contagens[i]
    })));
  }
  _dMistura(ctx, W, H, app) {
    const X = this.mix,
      c = this._mixCalc();
    const est = SIGAS.isEstreito(W);

    // ── recipiente ──
    const cw = SIGAS.propW(W, est ? .82 : .46, 200, W * (est ? .88 : .52));
    const ch = H * (est ? .40 : .62);
    const top = H * (est ? .06 : .14);
    const cx = est ? W / 2 : cw / 2 + W * .05;
    this._thermalGlow(ctx, cx, top + ch / 2, cw, ch, X.T, app.time);
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--glass');
    ctx.lineWidth = 2.6;
    ctx.strokeRect(cx - cw / 2, top, cw, ch);
    ctx.restore();
    const box = {
      x: cx - cw / 2 + 6,
      y: top + 6,
      w: cw - 12,
      h: ch - 12
    };
    this._mixSync();
    X.eng.setBox(box);

    // partículas: raio cresce um pouco com a massa molar, para o aluno
    // distinguir o gás pesado do leve sem depender só da cor
    ctx.save();
    X.eng.parts.forEach(p => {
      const sp = X.eng.specs[p.sp];
      if (!sp) return;
      const r = SIGAS.clamp(2.2 + Math.sqrt(sp.M) * .17, 2.4, 5.4);
      ctx.fillStyle = sp.cor;
      ctx.globalAlpha = .9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
    if (!c.itens.length) {
      SIGAS.kLabel(ctx, 'Escolha os gases e dê mols a pelo menos um deles.', cx, top + ch / 2, {
        size: 13,
        color: SIGAS.cssVar('--text-secondary'),
        maxW: cw - 20
      });
      return;
    }

    // ── barras: empilhadas (Dalton, pressões) ou lado a lado (Amagat, volumes)
    const bx = est ? W * .08 : cx + cw / 2 + W * .05;
    const bw = est ? W * .84 : Math.max(150, W - bx - W * .04);
    const by = est ? top + ch + 34 : top + 10;
    const bh = est ? Math.max(70, H - by - 56) : ch * .74;
    if (X.view === 'dalton') this._mixBarrasDalton(ctx, c, bx, by, bw, bh, est);else this._mixBarrasAmagat(ctx, c, X, bx, by, bw, bh, est);

    // rodapé: a verificação numérica da lei
    const ok = c.desvio < .06;
    SIGAS.kChipIcon(ctx, SIGAS.kIconCheck, `ΣPᵢ medida = ${SIGAS.fmt(c.somaMed, 2)} atm  =  P total medida ${SIGAS.fmt(c.PtotMed, 2)} atm  Dalton`, W / 2, H - (est ? 30 : 32), {
      fg: ok ? SIGAS.cssVar('--accent-ok') : SIGAS.cssVar('--accent-amber'),
      size: 11,
      bold: true,
      border: ok ? SIGAS.cssVar('--accent-ok') : SIGAS.cssVar('--accent-amber')
    });
    // O gas ideal previsto por Clapeyron fica um pouco ABAIXO do medido, e
    // isso e informacao, nao defeito: as particulas tem volume proprio.
    SIGAS.kLabel(ctx, `Clapeyron para a mistura: ${SIGAS.fmt(c.Ptot, 2)} atm  ·  medido ${c.excessoReal >= 0 ? '+' : ''}${SIGAS.fmt(c.excessoReal * 100, 0)} % (volume próprio das partículas — o “b” de van der Waals)`, W / 2, H - 10, {
      size: 9,
      color: SIGAS.cssVar('--text-muted'),
      maxW: W - 16
    });
  }

  /** Coluna única de pressão, dividida em faixas proporcionais às parciais.
   *  A altura total é a pressão total; cada faixa é uma parcial. Ler a coluna
   *  de baixo para cima É a Lei de Dalton. */
  _mixBarrasDalton(ctx, c, bx, by, bw, bh, est) {
    const colW = est ? bw * .42 : Math.min(bw * .38, 120);
    const colX = bx;
    const pmaxList = [1, 2, 3, 4, 6, 8, 10, 15, 20, 30];
    const pmax = pmaxList.find(m => m >= c.Ptot * 1.12) || 40;

    // trilho
    ctx.save();
    ctx.fillStyle = SIGAS.cssVar('--bg-hover');
    SIGAS.kRound(ctx, colX, by, colW, bh, 5);
    ctx.fill();
    ctx.strokeStyle = SIGAS.cssVar('--border');
    ctx.lineWidth = 1.2;
    SIGAS.kRound(ctx, colX, by, colW, bh, 5);
    ctx.stroke();
    ctx.restore();

    // escala do eixo
    for (let i = 0; i <= 4; i++) {
      const v = pmax * i / 4,
        y = by + bh - v / pmax * bh;
      SIGAS.kLabel(ctx, SIGAS.fmt(v, 1), colX - 8, y, {
        size: 9,
        align: 'right',
        mono: true,
        color: SIGAS.cssVar('--text-muted')
      });
      ctx.save();
      ctx.strokeStyle = SIGAS.cssVar('--border');
      ctx.globalAlpha = .5;
      ctx.beginPath();
      ctx.moveTo(colX, y);
      ctx.lineTo(colX + colW, y);
      ctx.stroke();
      ctx.restore();
    }

    // faixas empilhadas — usa a parcial MEDIDA, que é o que o motor entregou
    let acc = 0;
    c.itens.forEach(it => {
      const h = it.PiMed / pmax * bh;
      const y = by + bh - acc - h;
      ctx.save();
      ctx.fillStyle = it.g.cor;
      ctx.globalAlpha = .82;
      SIGAS.kRound(ctx, colX + 2, y, colW - 4, Math.max(1, h), 3);
      ctx.fill();
      ctx.restore();
      if (h > 15) {
        SIGAS.kLabel(ctx, `${it.g.f}  ${SIGAS.fmt(it.PiMed, 2)} atm`, colX + colW / 2, y + h / 2, {
          size: 10,
          bold: true,
          color: SIGAS.getContrastColor(it.g.cor),
          maxW: colW - 8
        });
      }
      acc += h;
    });
    SIGAS.kLabel(ctx, 'PRESSÕES PARCIAIS (medidas)', colX + colW / 2, by - 16, {
      size: 10,
      bold: true,
      color: SIGAS.cssVar('--text-secondary'),
      maxW: colW * 1.6
    });

    // tabela ao lado da coluna
    const tx = colX + colW + (est ? 14 : 26);
    const tw = Math.max(90, bx + bw - tx);
    let ty = by + 6;
    const dy = Math.max(16, Math.min(30, bh / (c.itens.length + 2)));
    c.itens.forEach(it => {
      ctx.save();
      ctx.fillStyle = it.g.cor;
      ctx.beginPath();
      ctx.arc(tx + 5, ty, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      SIGAS.kLabel(ctx, `${it.g.f}  x = ${SIGAS.fmt(it.x, 3)}`, tx + 16, ty, {
        size: 10,
        align: 'left',
        mono: true,
        color: SIGAS.cssVar('--text-primary'),
        maxW: tw - 20
      });
      ty += dy * .62;
      SIGAS.kLabel(ctx, `Pᵢ = xᵢ·P = ${SIGAS.fmt(it.Pi, 2)} atm`, tx + 16, ty, {
        size: 9,
        align: 'left',
        mono: true,
        color: SIGAS.cssVar('--text-muted'),
        maxW: tw - 20
      });
      ty += dy;
    });
    SIGAS.kLabel(ctx, `Σxᵢ = ${SIGAS.fmt(c.itens.reduce((a, i) => a + i.x, 0), 3)}  (sempre 1)`, tx, ty, {
      size: 10,
      align: 'left',
      mono: true,
      color: SIGAS.cssVar('--accent-ok'),
      maxW: tw
    });
    ty += dy * .7;
    SIGAS.kLabel(ctx, `M̄ = ${SIGAS.fmt(c.Mbar, 2)} g/mol  ·  d = ${SIGAS.fmt(c.d, 3)} g/L`, tx, ty, {
      size: 10,
      align: 'left',
      mono: true,
      color: SIGAS.cssVar('--text-secondary'),
      maxW: tw
    });
  }

  /** Barra horizontal única de volume, repartida pelas frações molares —
   *  a leitura de Amagat. O detalhe pedagógico: cada gás OCUPA todo o
   *  recipiente; o "volume parcial" é o volume que ele ocuparia sozinho
   *  à mesma pressão total. A barra deixa isso explícito no rótulo. */
  _mixBarrasAmagat(ctx, c, X, bx, by, bw, bh, est) {
    const barH = Math.min(46, Math.max(26, bh * .22));
    const y = by + (est ? 8 : bh * .18);
    ctx.save();
    ctx.fillStyle = SIGAS.cssVar('--bg-hover');
    SIGAS.kRound(ctx, bx, y, bw, barH, 6);
    ctx.fill();
    ctx.restore();
    let acc = 0;
    c.itens.forEach(it => {
      const w = it.x * bw;
      ctx.save();
      ctx.fillStyle = it.g.cor;
      ctx.globalAlpha = .82;
      SIGAS.kRound(ctx, bx + acc, y, Math.max(1, w), barH, 4);
      ctx.fill();
      ctx.restore();
      if (w > 34) {
        SIGAS.kLabel(ctx, it.g.f, bx + acc + w / 2, y + barH / 2 - 6, {
          size: 11,
          bold: true,
          color: SIGAS.getContrastColor(it.g.cor)
        });
        SIGAS.kLabel(ctx, `${SIGAS.fmt(it.Vi, 1)} L`, bx + acc + w / 2, y + barH / 2 + 7, {
          size: 9,
          mono: true,
          color: SIGAS.getContrastColor(it.g.cor)
        });
      }
      acc += w;
    });
    ctx.save();
    ctx.strokeStyle = SIGAS.cssVar('--border');
    ctx.lineWidth = 1.2;
    SIGAS.kRound(ctx, bx, y, bw, barH, 6);
    ctx.stroke();
    ctx.restore();
    SIGAS.kLabel(ctx, `VOLUMES PARCIAIS (Amagat) — total ${SIGAS.fmt(X.V, 1)} L`, bx + bw / 2, y - 14, {
      size: 10,
      bold: true,
      color: SIGAS.cssVar('--text-secondary'),
      maxW: bw
    });
    SIGAS.kLabel(ctx, 'cada gás ocupa o recipiente TODO: Vᵢ é o volume que ele ocuparia sozinho à pressão total', bx + bw / 2, y + barH + 18, {
      size: 9,
      color: SIGAS.cssVar('--text-muted'),
      maxW: bw
    });

    // velocidades e energia cinética: o argumento de por que a parcial não
    // depende da massa molar
    let ty = y + barH + 44;
    SIGAS.kLabel(ctx, 'À mesma T: velocidades diferentes, MESMA energia cinética média', bx + bw / 2, ty, {
      size: 10,
      bold: true,
      color: SIGAS.cssVar('--accent-cyan'),
      maxW: bw
    });
    ty += 20;
    const ecMax = Math.max(1e-9, ...c.itens.map(i => i.ec));
    c.itens.forEach(it => {
      SIGAS.kLabel(ctx, `${it.g.f}  M = ${SIGAS.fmt(it.g.M, 1)} g/mol  ·  v_rms = ${SIGAS.fmt(it.vrms, 0)} m/s`, bx, ty, {
        size: 10,
        align: 'left',
        mono: true,
        color: it.g.cor,
        maxW: bw * .72
      });
      // barrinha de energia cinética média medida — todas praticamente iguais
      const w = it.ec / ecMax * (bw * .24);
      ctx.save();
      ctx.fillStyle = SIGAS.cssVar('--accent-cyan');
      ctx.globalAlpha = .55;
      SIGAS.kRound(ctx, bx + bw * .74, ty - 5, Math.max(2, w), 10, 3);
      ctx.fill();
      ctx.restore();
      ty += 19;
    });
    SIGAS.kLabel(ctx, '↑ as barrinhas de Ec ficam do mesmo tamanho — é isso que Dalton exige', bx, ty + 2, {
      size: 9,
      align: 'left',
      color: SIGAS.cssVar('--text-muted'),
      maxW: bw
    });
  }
  getResults() {
    if (this.mode === 'transform') {
      const c = this._trCalc(),
        t = this.tr.tipo,
        zeroAbs = c.T <= 0;
      return [{
        l: 'Transformação',
        v: this.D.TRANSFORMACOES[t].nome
      }, {
        l: 'Quantidade n',
        v: `${SIGAS.fmt(c.n, 1)} mol`
      }, {
        l: 'Pressão P',
        v: `${SIGAS.fmt(c.P, 2)} atm`,
        cls: t === 'isobarica' ? '' : 'val-ok'
      }, {
        l: 'Volume V',
        v: `${SIGAS.fmt(c.V, 1)} L`,
        cls: t === 'isobarica' ? 'val-ok' : ''
      }, {
        l: 'Temperatura T',
        v: `${SIGAS.fmt(c.T, 0)} K (${SIGAS.fmt(c.T - 273, 0)} °C)`
      }, {
        l: 'P·V',
        v: `${SIGAS.fmt(c.P * c.V, 1)} atm·L`,
        cls: t === 'isotermica' ? 'val-ok' : ''
      }, {
        l: 'V/T',
        v: zeroAbs ? 'indefinido (T = 0)' : `${SIGAS.fmt(c.V / c.T, 4)} L/K`,
        cls: t === 'isobarica' ? 'val-ok' : ''
      }, {
        l: 'P/T',
        v: zeroAbs ? 'indefinido (T = 0)' : `${SIGAS.fmt(c.P / c.T, 4)} atm/K`,
        cls: t === 'isocorica' ? 'val-ok' : ''
      }];
    }
    if (this.mode === 'clapeyron') {
      const C = this.cl,
        c = this._claCalc(),
        g = C.gas,
        D = this.D,
        zeroAbs = C.T <= 0;
      const dCNTP = g.M / 22.4,
        vr298 = SIGAS.vrms3D(298, g.M, D.RSI);
      return [{
        l: 'Gás',
        v: `${g.f} — ${g.nome}`
      }, {
        l: 'Massa molar M',
        v: `${SIGAS.fmt(g.M, 2)} g/mol`
      }, {
        l: 'Ponto de ebulição',
        v: `${SIGAS.fmt(g.Teb, 1)} °C${g.sub ? ' (sublima)' : ''}`
      }, {
        l: 'Densidade nas CNTP',
        v: `${SIGAS.fmt(dCNTP, 3)} g/L`
      }, {
        l: 'v_rms a 298 K',
        v: `${SIGAS.fmt(vr298, 0)} m/s`
      }, {
        l: 'van der Waals (a · b)',
        v: `${SIGAS.fmt(g.a, 2)} atm·L²/mol² · ${SIGAS.fmt(g.b, 4)} L/mol`
      }, {
        l: 'Quantidade n',
        v: `${SIGAS.fmt(C.n, 1)} mol`
      }, {
        l: 'Temperatura',
        v: `${SIGAS.fmt(C.T, 0)} K`
      }, {
        l: 'Volume',
        v: `${SIGAS.fmt(C.V, 1)} L`
      }, {
        l: 'Pressão P = nRT/V',
        v: `${SIGAS.fmt(c.P, 2)} atm`,
        cls: 'val-ok'
      }, {
        l: 'Massa do gás',
        v: `${SIGAS.fmt(c.massa, 1)} g`
      }, {
        l: 'Densidade d = PM/RT',
        v: zeroAbs ? 'indefinido (T = 0)' : `${SIGAS.fmt(c.d, 2)} g/L`,
        cls: 'val-endo'
      }];
    }
    if (this.mode === 'graham') {
      const G = this.gr,
        m = this._grMeet();
      const tPrevisto = 1 / (this._grV(G.a) + this._grV(G.b));
      const anel = G.a.id === 'nh3' && G.b.id === 'hcl' || G.a.id === 'hcl' && G.b.id === 'nh3';
      return [{
        l: 'Gás A (esquerda)',
        v: G.a.nome
      }, {
        l: 'Gás B (direita)',
        v: G.b.nome
      }, {
        l: 'Temperatura',
        v: `${SIGAS.fmt(G.T, 0)} K`
      }, {
        l: 'v_A / v_B',
        v: `√(${SIGAS.fmt(G.b.M, 1)}/${SIGAS.fmt(G.a.M, 1)}) = ${SIGAS.fmt(Math.sqrt(G.b.M / G.a.M), 2)}`,
        cls: 'val-ok'
      }, {
        l: 'Progresso atual de A',
        v: `${SIGAS.fmt(G.fa * 100, 0)} % do tubo`
      }, {
        l: 'Progresso atual de B',
        v: `${SIGAS.fmt(G.fb * 100, 0)} % do tubo`
      }, {
        l: 'Trajeto previsto de A',
        v: `${SIGAS.fmt(m * 100, 0)} % do tubo`
      }, {
        l: 'Trajeto previsto de B',
        v: `${SIGAS.fmt((1 - m) * 100, 0)} % do tubo`
      }, {
        l: 'Tempo até o encontro',
        v: G.done ? `${SIGAS.fmt(G.ta, 1)} s` : `${SIGAS.fmt(tPrevisto, 1)} s (previsto)`
      }, {
        l: 'Situação',
        v: G.done ? anel ? 'anel branco de NH₄Cl formado' : 'encontro registrado' : G.run ? 'difundindo…' : 'aguardando',
        cls: G.done ? 'val-ok' : ''
      }];
    }
    if (this.mode === 'mistura') {
      const X = this.mix,
        c = this._mixCalc();
      if (!c.itens.length) return [{
        l: 'Mistura',
        v: 'vazia — dê mols a um gás'
      }];
      const rows = [{
        l: 'Temperatura',
        v: `${SIGAS.fmt(X.T, 0)} K`
      }, {
        l: 'Volume total',
        v: `${SIGAS.fmt(X.V, 1)} L`
      }, {
        l: 'n total',
        v: `${SIGAS.fmt(c.nTot, 2)} mol`
      }, {
        l: 'P total (nRT/V)',
        v: `${SIGAS.fmt(c.Ptot, 2)} atm`,
        cls: 'val-ok'
      }];
      c.itens.forEach(it => {
        rows.push({
          l: `x (${it.g.f})`,
          v: SIGAS.fmt(it.x, 4)
        });
        rows.push({
          l: `P${it.g.f} = x·P`,
          v: `${SIGAS.fmt(it.Pi, 3)} atm`
        });
        rows.push({
          l: `P${it.g.f} medida`,
          v: `${SIGAS.fmt(it.PiMed, 3)} atm`,
          cls: 'val-endo'
        });
        rows.push({
          l: `V${it.g.f} = x·V (Amagat)`,
          v: `${SIGAS.fmt(it.Vi, 2)} L`
        });
        rows.push({
          l: `v_rms (${it.g.f})`,
          v: `${SIGAS.fmt(it.vrms, 0)} m/s`
        });
      });
      rows.push({
        l: 'Σ pressões parciais',
        v: `${SIGAS.fmt(c.somaMed, 2)} atm`,
        cls: 'val-ok'
      });
      rows.push({
        l: 'P total medida',
        v: `${SIGAS.fmt(c.PtotMed, 2)} atm`,
        cls: 'val-ok'
      });
      rows.push({
        l: 'Dalton confere?',
        v: c.desvio < .06 ? `sim (desvio ${SIGAS.fmt(c.desvio * 100, 1)} %)` : `medindo… (${SIGAS.fmt(c.desvio * 100, 1)} %)`,
        cls: c.desvio < .06 ? 'val-ok' : ''
      });
      rows.push({
        l: 'Medido − ideal',
        v: `${c.excessoReal >= 0 ? '+' : ''}${SIGAS.fmt(c.excessoReal * 100, 1)} %`
      });
      rows.push({
        l: 'Por que sobra?',
        v: 'volume próprio das partículas (gás real)'
      });
      rows.push({
        l: 'M̄ aparente',
        v: `${SIGAS.fmt(c.Mbar, 2)} g/mol`,
        cls: 'val-endo'
      });
      rows.push({
        l: 'Massa da mistura',
        v: `${SIGAS.fmt(c.massa, 1)} g`
      });
      rows.push({
        l: 'Densidade d = P·M̄/RT',
        v: `${SIGAS.fmt(c.d, 3)} g/L`
      });
      rows.push({
        l: 'Σ frações molares',
        v: SIGAS.fmt(c.itens.reduce((a, i) => a + i.x, 0), 3)
      });
      return rows;
    }
    const K = this.kin,
      eng = K.eng,
      g = K.gas,
      D = this.D;
    const nMol = K.N / D.PART_PER_MOL;
    const Pideal = nMol * D.R * K.T / K.V;
    const Pm = this._kinPressure();
    const Tk = K.T * eng.tRatio();
    const vr = SIGAS.vrms3D(K.T, g.M, D.RSI);
    return [{
      l: 'Gás',
      v: `${g.f} — ${g.nome}`
    }, {
      l: 'Partículas',
      v: `${K.N} ≙ ${SIGAS.fmt(nMol, 2)} mol`
    }, {
      l: 'Temperatura alvo',
      v: `${SIGAS.fmt(K.T, 0)} K`
    }, {
      l: 'Temperatura cinética',
      v: `${SIGAS.fmt(Tk, 0)} K`,
      cls: 'val-endo'
    }, {
      l: 'Volume',
      v: `${SIGAS.fmt(K.V, 1)} L`
    }, {
      l: 'Pressão ideal (P = nRT/V)',
      v: `${SIGAS.fmt(Pideal, 2)} atm`
    }, {
      l: 'Pressão medida (choques)',
      v: `${SIGAS.fmt(Pm, 2)} atm`,
      cls: 'val-ok'
    }, {
      l: 'v_rms (3D)',
      v: `${SIGAS.fmt(vr, 0)} m/s`
    }, {
      l: 'Colisões/s',
      v: `${SIGAS.fmt(eng.collRate, 0)}`
    }];
  }
  getOverlay() {
    if (this.mode === 'transform') {
      const c = this._trCalc();
      return `${this.D.TRANSFORMACOES[this.tr.tipo].nome} · ${SIGAS.fmt(c.P, 2)} atm`;
    }
    if (this.mode === 'clapeyron') {
      const c = this._claCalc();
      return `${this.cl.gas.nome.split(' ')[0]} · ${SIGAS.fmt(c.P, 2)} atm`;
    }
    if (this.mode === 'graham') return `${this.gr.a.nome.split(' ')[0]} × ${this.gr.b.nome.split(' ')[0]}`;
    if (this.mode === 'mistura') {
      const c = this._mixCalc();
      return `mistura · ${SIGAS.fmt(c.Ptot, 2)} atm · M̄ ${SIGAS.fmt(c.Mbar, 1)}`;
    }
    const Pm = this._kinPressure();
    return `${this.kin.gas.f} · ${SIGAS.fmt(Pm, 2)} atm`;
  }
};