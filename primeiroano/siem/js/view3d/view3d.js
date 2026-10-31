/* ════════════════════════════════════════════════════════════════════
   SIEM — view3d.js
   ════════════════════════════════════════════════════════════════════
   Renderizador 3D opcional, totalmente separado do motor de física
   (script.js). Propósito: oferecer uma SEGUNDA representação visual das
   mesmas moléculas e do mesmo estado físico já calculados pela
   simulação 2D, sem duplicar nem alterar a lógica de física, catálogo
   ou termodinâmica existentes.

   ARQUITETURA:
   - Não usa bibliotecas externas (Three.js etc.) — projeção em
     perspectiva e rotação de câmera implementadas manualmente com
     matrizes 3×3 simples, mantendo o arquivo leve e sem dependências.
   - Lê diretamente `sim.particles`, `sim.entry`, `sim.state` do objeto
     Simulation já existente (window.SIEM_APP.sim) — a física continua
     sendo calculada apenas em 2D pelo script.js; aqui só elevamos a
     geometria molecular (que já é VSEPR/3D por natureza) para um eixo Z
     e desenhamos a MESMA distribuição espacial das partículas em 3D.
   - Cada partícula 2D (x,y) ganha uma profundidade Z sintética baseada
     em ruído determinístico (hash da posição), suficiente para dar
     sensação de volume ao sólido/líquido/gás sem precisar resolver
     física 3D completa — mais barato computacionally e visualmente
     coerente com o que já é mostrado em 2D.
   - A geometria interna de cada molécula (posição dos átomos) é
     elevada para 3D real a partir do ângulo VSEPR e do número de
     átomos: moléculas lineares ficam no plano XY, anguladas/piramidais
     ganham profundidade Z calculada a partir do ângulo de ligação real,
     tetraédricas usam as 4 direções clássicas de um tetraedro regular.

   INTEGRAÇÃO COM script.js:
   - Não requer NENHUMA mudança no script.js. Lê window.SIEM_APP (já
     exposto por App.constructor) para obter sim/entry/particles/state.
   - index.html aciona window.SIEM_VIEW3D.toggle()/setActive() pelos
     botões do alternador 2D/3D.
   ════════════════════════════════════════════════════════════════════ */
'use strict';

(function () {

  /* ──────────────────────────────────────────────────────────────────
     1. TOPOLOGIA DE LIGAÇÕES
     O catálogo (script.js) só guarda POSIÇÕES dos átomos, não diz quais
     pares estão quimicamente ligados. Para moléculas simples (H2O, NH3,
     CH4, CCl4, SO2, H2S — todas com um único átomo central pesado e
     ligantes periféricos) a topologia é uma "estrela": todo ligante
     conecta direto ao átomo [0]. Isso é fisicamente correto para essas,
     mas ERRADO para moléculas em cadeia como o Etanol (C-C-O-H), onde
     os átomos se ligam em sequência, não todos ao mesmo centro.

     Por isso, cada substância pode opcionalmente ter sua topologia real
     definida aqui como lista de pares [i,j] (índices em `entry.atoms`).
     Quando ausente, cai no fallback de estrela (correto para a grande
     maioria do catálogo, que tem um único átomo central).
  ────────────────────────────────────────────────────────────────── */
  const BOND_TOPOLOGY = {
    // Etanol: C0-C1, C1-O2 (cadeia carbono-carbono-oxigênio),
    // H3,H4 ligados ao C0 (CH3-), H5 ligado ao O2 (-OH)
    'C₂H₅OH': [[0,1],[1,2],[0,3],[0,4],[2,5]],

    // Isobutano: C0 é o carbono central, ligado aos outros 3 carbonos
    // (CH(CH3)3 — na prática uma estrela, mas explícito para clareza)
    'C₄H₁₀': [[0,1],[0,2],[0,3]],

    // Ciclohexano: anel fechado de 6 carbonos, cada um ligado aos
    // dois vizinhos (C0-C1-C2-C3-C4-C5-C0)
    'C₆H₁₂': [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]],

    // Propanol: cadeia C0-C1-C2-O3, H4/H5 no carbono terminal (CH3-)
    'C₃H₇OH': [[0,1],[1,2],[2,3],[0,4],[0,5]],

    // Butanol: cadeia C0-C1-C2-C3-O4
    'C₄H₉OH': [[0,1],[1,2],[2,3],[3,4]],

    // Etilenoglicol: C0-C1 (ligação central), O2 no C0, O3 no C1
    // (HO-CH2-CH2-OH)
    'C₂H₆O₂': [[0,1],[0,2],[1,3]],

    // Butanona (metil-etil-cetona): cadeia C0-C1(=O2)-C3-C4,
    // carbonila no segundo carbono
    'C₄H₈O': [[0,1],[1,2],[1,3],[3,4]],

    // Ácido fórmico: C0 ligado a O1(=O, carbonila), O2(-OH), H3 no O2
    'HCOOH': [[0,1],[0,2],[2,3]],

    // Ácido propanoico: cadeia C0-C1-C2(=O3)(-O4)
    'C₂H₅COOH': [[0,1],[1,2],[2,3],[2,4]],

    // Tolueno: anel de 6 carbonos (C0..C5) + grupo metila C6 ligado ao C0
    'C₇H₈': [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6]],

    // Fenol: anel de 6 carbonos (C0..C5) + grupo OH (O6) ligado ao C0
    'C₆H₅OH': [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6]],

    // Tricloroetileno: C0=C1 (dupla ligação), 2 Cl no C0, 1 H + 1 Cl no C1
    'C₂HCl₃': [[0,1],[0,2],[0,3],[1,4],[1,5]],

    // Pentóxido de fósforo (estrutura simplificada P4O10): os 4
    // fósforos formam um tetraedro, com o oxigênio central representando
    // a rede de pontes O ligando todos os vértices (modelo simplificado
    // para fins didáticos, não a estrutura cristalográfica completa)
    'P₄O₁₀': [[0,1],[1,2],[2,3],[3,0],[0,4],[1,4],[2,4],[3,4]],

    // Carbonato de cálcio: C0 central do íon CO3²⁻ ligado aos 3
    // oxigênios (O1,O2,O3); Ca4 é o cátion, mostrado próximo mas como
    // par iônico (ligação eletrostática, não covalente — desenhada
    // mesmo assim para dar contexto visual à fórmula)
    'CaCO₃': [[0,1],[0,2],[0,3],[0,4]],

    // Sulfato de cobre: S0 central do íon SO4²⁻ ligado aos 3 oxigênios
    // explícitos (O1,O2,O3); Cu4 é o cátion (par iônico)
    'CuSO₄': [[0,1],[0,2],[0,3],[0,4]],

    // Etileno: C0=C1 (dupla ligação), 2 H em cada carbono
    'C₂H₄': [[0,1],[0,2],[0,3],[1,4],[1,5]],

    // Propileno: C0=C1-C2 (dupla ligação entre os dois primeiros carbonos)
    'C₃H₆': [[0,1],[1,2]],

    // Hidróxido de amônio (referência simplificada NH4OH = NH3 + H2O):
    // N0 central com 3 H (H2,H3,H4) + O1 próximo (ligação de H, não
    // covalente real — NH4OH não existe como molécula isolada estável,
    // é uma representação didática da dissolução de NH3 em água)
    'NH₄OH': [[0,1],[0,2],[0,3],[0,4]],

    // Glicerina (propano-1,2,3-triol): cadeia C0-C1-C2, com um OH
    // (O3,O4,O5) em cada carbono
    'C₃H₈O₃': [[0,1],[1,2],[0,3],[1,4],[2,5]],

    // Peróxido de hidrogênio: cadeia H-O-O-H (O0-O1 ligação central,
    // H2 no O0, H3 no O1) — NÃO é estrela, pois os dois H não se ligam
    // ao mesmo átomo
    'H₂O₂': [[0,1],[0,2],[1,3]],
  };

  /**
   * Retorna a lista de pares de índices [i,j] que devem ser desenhados
   * como ligação para esta substância. Usa BOND_TOPOLOGY se definida
   * explicitamente; senão assume estrela (átomo 0 ligado a todos os
   * demais), que é a topologia real de moléculas com átomo central
   * único — a grande maioria do catálogo.
   */
  function getBondTopology(entry) {
    const explicit = BOND_TOPOLOGY[entry.formula];
    if (explicit) return explicit;
    const n = entry.atoms.length;
    const star = [];
    for (let i = 1; i < n; i++) star.push([0, i]);
    return star;
  }

  /* ──────────────────────────────────────────────────────────────────
     2. GEOMETRIA 3D POR TIPO DE MOLÉCULA
     Eleva as posições 2D (dx,dy) do catálogo para 3D real (dx,dy,dz),
     usando a regra VSEPR correta para cada tipo de geometria — não é
     uma estimativa visual, é a estrutura 3D que a geometria 2D do
     catálogo já representa em projeção.
  ────────────────────────────────────────────────────────────────── */

  /**
   * Calcula a posição 3D de cada átomo de uma molécula a partir da
   * geometria 2D já presente no catálogo (script.js) + do nome da
   * geometria VSEPR real da substância. Memoizado por entry (recalcular
   * a cada frame seria desperdício, já que a geometria é fixa por
   * substância).
   */
  const geom3dCache = new WeakMap();

  function get3dAtoms(entry) {
    if (geom3dCache.has(entry)) return geom3dCache.get(entry);
    const atoms2d = entry.atoms;
    const n = atoms2d.length;
    const geo = (entry.geometry || '').toLowerCase();
    let atoms3d;

    // PRIORIDADE MÁXIMA: substâncias com topologia de ligação explícita
    // (moléculas em cadeia, várias geometrias coexistindo no mesmo nome
    // — ex. "Tetraédrica (no C) + angular (no O)" do Etanol, que bateria
    // erroneamente no branch "angular" se checado por substring) usam
    // sempre o tratamento de cadeia, independente do texto da geometria.
    if (BOND_TOPOLOGY[entry.formula]) {
      atoms3d = atoms2d.map((a, i) => ({
        el: a.el, dx: a.dx, dy: a.dy, dz: (i % 2 === 0 ? 1 : -1) * 0.12,
      }));
    } else if (n <= 1) {
      // Monoatômico: um único ponto na origem
      atoms3d = atoms2d.map(a => ({ el: a.el, dx: 0, dy: 0, dz: 0 }));
    } else if (n === 2 || geo.includes('linear')) {
      // Diatômica ou linear com 3+ átomos (CO2, NaCl, HCl, Cl2 etc.):
      // permanece no plano, sem profundidade — já é 3D-completa
      atoms3d = atoms2d.map(a => ({ el: a.el, dx: a.dx, dy: a.dy, dz: 0 }));
    } else if (geo.includes('pirâmide trigonal') || geo.includes('piramide trigonal')) {
      // Pirâmide trigonal (NH3): átomo central no ápice, ligantes
      // formando a base triangular abaixo — eleva os 3 H em Z negativo
      // (checado ANTES de "angular" — embora não haja sobreposição
      // textual hoje, evita futuras ambiguidades de nomenclatura)
      atoms3d = atoms2d.map((a, i) => ({
        el: a.el, dx: a.dx, dy: a.dy,
        dz: i === 0 ? 0.3 : -0.15,
      }));
    } else if (geo === 'tetraédrica' || geo === 'tetraedrica') {
      // Tetraédrica "pura" SEM complemento entre parênteses (CH4, CCl4,
      // CF4 — átomo central único com exatamente 4 ligantes idênticos):
      // usa as 4 direções clássicas de um tetraedro regular, preservando
      // o raio 2D já presente no catálogo.
      // IMPORTANTE: variantes como "Tetraédrica (no SO4)" ou "Tetraédrica
      // (em cada C)" descrevem geometria LOCAL em torno de um átomo
      // específico dentro de uma molécula maior — não significam que a
      // molécula inteira é um tetraedro simples de 5 átomos, por isso
      // caem no branch genérico (else final), não aqui.
      const r = Math.hypot(atoms2d[1].dx, atoms2d[1].dy, atoms2d[1].dz || 0) || 1;
      const TETRA = [
        [ 1, 1, 1], [-1,-1, 1], [-1, 1,-1], [ 1,-1,-1],
      ].map(v => { const m = Math.hypot(...v); return v.map(c => c/m*r); });
      atoms3d = [{ el: atoms2d[0].el, dx:0, dy:0, dz:0 }];
      for (let i = 1; i < n; i++) {
        const [tx, ty, tz] = TETRA[i-1];
        atoms3d.push({ el: atoms2d[i].el, dx: tx, dy: ty, dz: tz });
      }
    } else if (geo === 'trigonal planar') {
      // Trigonal planar PURA (BF3, SO3, formaldeído — átomo central com
      // exatamente 3 ligantes, todos no mesmo plano, ângulos de 120°):
      // geometria já é verdadeiramente plana, sem profundidade real —
      // mantém no plano XY mas com leve inclinação para dar volume ao
      // rotacionar a câmera (igual ao tratamento de moléculas angulares).
      atoms3d = atoms2d.map((a, i) => ({
        el: a.el, dx: a.dx, dy: a.dy,
        dz: i === 0 ? 0 : Math.sin(i * 2.0944) * 0.15, // 2π/3 por ligante
      }));
    } else if (geo.includes('hexagonal') || geo.includes('anel')) {
      // Anéis de 6 membros (ciclohexano, benzeno, tolueno, fenol):
      // ciclohexano real tem conformação "cadeira" (carbonos alternam
      // acima/abaixo do plano médio); anéis aromáticos (ligação π
      // deslocalizada) são verdadeiramente planos. Diferenciamos os dois
      // casos pela presença de "aromático" no nome da geometria.
      const isAromatic = geo.includes('aromático') || geo.includes('aromatico');
      const ringAtoms = Math.min(6, n);
      atoms3d = atoms2d.map((a, i) => {
        if (i < ringAtoms) {
          const dz = isAromatic ? 0 : (i % 2 === 0 ? 0.18 : -0.18);
          return { el: a.el, dx: a.dx, dy: a.dy, dz };
        }
        // Substituintes fora do anel (ex. grupo OH do fenol): leve
        // profundidade para não ficar achatado
        return { el: a.el, dx: a.dx, dy: a.dy, dz: 0.1 };
      });
    } else if (geo.includes('angular') || geo.includes('bent')) {
      // Angular (H2O, SO2, H2S): a geometria 2D já é bent num plano;
      // inclinamos levemente em Z para dar volume visual ao rotacionar
      atoms3d = atoms2d.map((a, i) => ({
        el: a.el, dx: a.dx, dy: a.dy,
        dz: i === 0 ? 0 : (a.dx !== 0 ? Math.sign(a.dx) * 0.18 : 0),
      }));
    } else {
      // Caso geral (qualquer geometria não coberta acima): mantém o
      // plano XY do catálogo e adiciona variação leve em Z por átomo,
      // suficiente para dar volume em 3D sem inventar uma conformação
      // química que não foi modelada explicitamente.
      atoms3d = atoms2d.map((a, i) => ({
        el: a.el, dx: a.dx, dy: a.dy, dz: (i % 2 === 0 ? 1 : -1) * 0.12,
      }));
    }

    geom3dCache.set(entry, atoms3d);
    return atoms3d;
  }

  /* ──────────────────────────────────────────────────────────────────
     3. CÂMERA — rotação por arraste do mouse/touch, projeção em
     perspectiva simples (sem matriz 4×4 homogênea; suficiente para o
     caso de uma cena centrada na origem com câmera orbitando-a).
  ────────────────────────────────────────────────────────────────── */
  class OrbitCamera {
    constructor() {
      this.yaw = 0.5;     // rotação horizontal (rad)
      this.pitch = 0.35;  // rotação vertical (rad), limitada para não capotar
      this.dist = 260;    // distância da câmera ao centro da cena
      this.fov = 420;     // "distância focal" — controla intensidade da perspectiva
    }

    /** Gira um ponto (x,y,z) pela orientação atual da câmera e projeta
     *  em coordenadas de tela 2D, com profundidade para ordenação. */
    project(x, y, z, cx, cy) {
      // Rotação Yaw (em torno do eixo Y)
      const cosY = Math.cos(this.yaw), sinY = Math.sin(this.yaw);
      const x1 = x*cosY - z*sinY;
      const z1 = x*sinY + z*cosY;
      // Rotação Pitch (em torno do eixo X)
      const cosP = Math.cos(this.pitch), sinP = Math.sin(this.pitch);
      const y1 = y*cosP - z1*sinP;
      const z2 = y*sinP + z1*cosP;

      const camZ = z2 + this.dist;
      const scale = this.fov / Math.max(1, camZ);
      return {
        sx: cx + x1 * scale,
        sy: cy + y1 * scale,
        depth: camZ,    // maior = mais longe da câmera
        scale,
      };
    }
  }

  /* ──────────────────────────────────────────────────────────────────
     4. HASH DETERMINÍSTICO — gera profundidade Z sintética e estável
     por partícula (mesma partícula sempre recebe o mesmo Z relativo
     entre frames, evitando "tremedeira" de profundidade).
  ────────────────────────────────────────────────────────────────── */
  function hash2(a, b) {
    let h = Math.sin(a*12.9898 + b*78.233) * 43758.5453;
    return h - Math.floor(h);
  }

  /* ──────────────────────────────────────────────────────────────────
     5. RENDERER 3D
  ────────────────────────────────────────────────────────────────── */
  class View3D {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.camera = new OrbitCamera();
      this.active = false;
      this._dragging = false;
      this._lastX = 0; this._lastY = 0;
      this._depthCache = new Map(); // partícula -> z sintético estável
      this._bindInteraction();
    }

    /* ── Interação: arrastar para rotacionar, scroll para zoom ──── */
    _bindInteraction() {
      const cv = this.canvas;

      const onDown = (clientX, clientY) => {
        this._dragging = true;
        this._lastX = clientX; this._lastY = clientY;
      };
      const onMove = (clientX, clientY) => {
        if (!this._dragging) return;
        const dx = clientX - this._lastX, dy = clientY - this._lastY;
        this.camera.yaw   += dx * 0.008;
        this.camera.pitch  = Math.max(-1.4, Math.min(1.4, this.camera.pitch + dy * 0.008));
        this._lastX = clientX; this._lastY = clientY;
      };
      const onUp = () => { this._dragging = false; };

      cv.addEventListener('mousedown', e => onDown(e.clientX, e.clientY));
      window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
      window.addEventListener('mouseup', onUp);

      cv.addEventListener('touchstart', e => {
        if (e.touches.length===1) { onDown(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }
      }, { passive:false });
      cv.addEventListener('touchmove', e => {
        if (e.touches.length===1) { onMove(e.touches[0].clientX, e.touches[0].clientY); e.preventDefault(); }
      }, { passive:false });
      cv.addEventListener('touchend', onUp);
      cv.addEventListener('touchcancel', onUp);

      cv.addEventListener('wheel', e => {
        e.preventDefault();
        this.camera.dist = Math.max(80, Math.min(700, this.camera.dist + e.deltaY*0.4));
      }, { passive:false });
    }

    /** Profundidade Z sintética estável por partícula, escalada pelo
     *  tamanho da caixa de simulação 2D (mantém proporção visual). */
    _syntheticZ(p, boxW, boxH) {
      if (!this._depthCache.has(p)) {
        const h = hash2(p.x*0.01, p.y*0.01);
        this._depthCache.set(p, (h - 0.5) * Math.min(boxW, boxH) * 0.35);
      }
      return this._depthCache.get(p);
    }

    resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width*dpr)), h = Math.max(1, Math.round(rect.height*dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w; this.canvas.height = h;
      }
      this.ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    /** Desenha a cena 3D a partir do estado atual da Simulation 2D
     *  (window.SIEM_APP.sim) — não recalcula física, só reprojeta. */
    draw() {
      if (!this.active) return;
      const app = window.SIEM_APP;
      if (!app) return;
      const sim = app.sim;

      this.resize();
      const ctx = this.ctx;
      const rect = this.canvas.getBoundingClientRect();
      const W = rect.width, H = rect.height;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = rgba(window.SIEM_THEME.bg1,1);
      ctx.fillRect(0,0,W,H);

      if (!sim || !sim.entry) {
        /* Mesma fonte itálica do hint 2D (simulation-render.js) —
           consistência com o padrão do resto do projeto. */
        ctx.font = `italic ${Math.max(11,W*0.013)}px system-ui, sans-serif`;
        ctx.fillStyle = rgba(window.SIEM_THEME.tx2,0.4); ctx.textAlign='center';
        ctx.fillText('← Selecione uma substância para começar', W/2, H/2);
        ctx.textAlign = 'left';
        return;
      }

      const entry = sim.entry;
      const cx = W/2, cy = H/2;
      const box = sim.box;
      /* A ÁREA LIVRE (sidebar-rail.js · Oclusao): com um card flutuante
         aberto, o QUADRO 3D inteiro (o que se via no canvas todo, com o zoom
         que o aluno escolheu) é desenhado em escala na parte que se vê. A
         rotação e o zoom usam só deslocamentos do mouse: nada a inverter. */
      const dpr3 = this.canvas.width / Math.max(1, W);
      const a3 = window.Oclusao ? window.Oclusao.area(this.canvas) : null;
      let v3 = { s:1, tx:0, ty:0 };
      if (a3 && a3.esq + a3.dir > 0.5) {
        const s3 = Math.min(1, a3.w / Math.max(1, W));
        v3 = { s:s3, tx:a3.x + (a3.w - W*s3)/2, ty:H*(1-s3)/2 };
      }
      ctx.setTransform(dpr3*v3.s, 0, 0, dpr3*v3.s, dpr3*v3.tx, dpr3*v3.ty);
      const boxCx = box.x + box.w/2, boxCy = box.y + box.h/2;

      // Caixa/recipiente em wireframe — dá referência espacial de volume
      this._drawBoxWireframe(ctx, box, cx, cy);

      // Calcula posições 3D projetadas + profundidade de cada partícula
      const atoms3d = get3dAtoms(entry);
      const isMono = atoms3d.length === 1;
      const projected = [];

      for (const p of sim.particles) {
        const lx = p.x - boxCx, ly = p.y - boxCy; // centra a cena na origem
        const lz = this._syntheticZ(p, box.w, box.h);
        const ang = p.angle || 0;
        const cosA = Math.cos(ang), sinA = Math.sin(ang);
        const scale = sim._particleRadius ? sim._particleRadius() : 9;

        if (isMono) {
          const pr = this.camera.project(lx, ly, lz, cx, cy);
          projected.push({ depth: pr.depth, draw: () => this._drawAtom(ctx, pr.sx, pr.sy, scale*0.85*pr.scale*0.6, atoms3d[0].el, entry) });
          continue;
        }

        // Posições 3D dos átomos desta molécula, rotacionados pelo
        // ângulo de "spin" (p.angle) no plano XY, depois projetados
        const atomScreen = atoms3d.map(at => {
          const ax = lx + (at.dx*cosA - at.dy*sinA) * scale;
          const ay = ly + (at.dx*sinA + at.dy*cosA) * scale;
          const az = lz + at.dz * scale;
          return { el: at.el, ...this.camera.project(ax, ay, az, cx, cy) };
        });
        const avgDepth = atomScreen.reduce((s,a)=>s+a.depth,0) / atomScreen.length;

        projected.push({
          depth: avgDepth,
          draw: () => this._drawMolecule3d(ctx, atomScreen, entry),
        });
      }

      // Ordena do mais distante para o mais próximo (depth sorting —
      // substitui o z-buffer que um canvas 2D não tem nativamente)
      projected.sort((a,b) => b.depth - a.depth);
      for (const item of projected) item.draw();

      ctx.setTransform(dpr3, 0, 0, dpr3, 0, 0);
      this._drawHint(ctx, W, H, a3 && a3.esq > 0.5 ? a3.x : 0);   // a dica fica na borda da parte livre
    }

    _drawBoxWireframe(ctx, box, cx, cy) {
      const hw = box.w/2, hh = box.h/2, hd = Math.min(box.w,box.h)*0.35;
      const corners = [
        [-hw,-hh,-hd],[hw,-hh,-hd],[hw,hh,-hd],[-hw,hh,-hd],
        [-hw,-hh, hd],[hw,-hh, hd],[hw,hh, hd],[-hw,hh, hd],
      ].map(([x,y,z]) => this.camera.project(x,y,z,cx,cy));
      const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      ctx.strokeStyle = rgba(window.SIEM_THEME.bdr2,0.7); ctx.lineWidth = 1;
      for (const [a,b] of edges) {
        ctx.beginPath();
        ctx.moveTo(corners[a].sx, corners[a].sy);
        ctx.lineTo(corners[b].sx, corners[b].sy);
        ctx.stroke();
      }
    }

    _drawAtom(ctx, x, y, r, el, entry) {
      if (r < 0.4) return;
      const col = (window.CPK && window.CPK[el]) || entry.color;
      const g = ctx.createRadialGradient(x-r*0.3,y-r*0.3,0,x,y,r);
      g.addColorStop(0, col); g.addColorStop(1, col+'66');
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    }

    _drawMolecule3d(ctx, atomScreen, entry) {
      const bonds = getBondTopology(entry);
      // Ligações — desenhadas conforme a topologia real (pares
      // explicitamente conectados), não mais assumindo que tudo liga
      // ao átomo [0]. Corrige o caso de moléculas em cadeia (ex.
      // Etanol) onde isso produzia ligações visualmente erradas.
      ctx.strokeStyle = rgba(window.SIEM_THEME.tx2,0.55);
      const avgScale = atomScreen.reduce((s,a)=>s+a.scale,0) / atomScreen.length;
      ctx.lineWidth = Math.max(0.6, avgScale*0.4);
      for (const [i,j] of bonds) {
        const a = atomScreen[i], b = atomScreen[j];
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
      // Átomos — átomo [0] desenhado por último apenas quando for de
      // fato o centro de uma topologia estelar; em moléculas de cadeia
      // a ordem de desenho usa profundidade (já ordenada no caller),
      // então aqui basta desenhar todos na ordem do array.
      for (let i=0;i<atomScreen.length;i++) {
        const a = atomScreen[i];
        const r = (a.el==='H' ? 2.6 : 3.6) * a.scale * 0.55;
        this._drawAtom(ctx, a.sx, a.sy, r, a.el, entry);
      }
    }

    _drawHint(ctx, W, H, x0) {
      ctx.font = '10px Consolas';
      ctx.fillStyle = rgba(window.SIEM_THEME.tx3,0.7);
      ctx.textAlign = 'left';
      ctx.fillText('Arraste para rotacionar · Scroll para zoom', (x0 || 0) + 10, H-10);
    }

    setActive(on) {
      this.active = on;
      this.canvas.hidden = !on;
      if (on) this.resize();
    }
  }

  /* ──────────────────────────────────────────────────────────────────
     6. INICIALIZAÇÃO E TOGGLE 2D/3D
  ────────────────────────────────────────────────────────────────── */
  function init() {
    const canvas3d = document.getElementById('sim-canvas-3d');
    const canvas2d = document.getElementById('sim-canvas');
    const btn2d = document.getElementById('view-2d-btn');
    const btn3d = document.getElementById('view-3d-btn');
    if (!canvas3d || !canvas2d) return;

    const view3d = new View3D(canvas3d);
    window.SIEM_VIEW3D = view3d;

    function setMode(mode) {
      const is3d = mode === '3d';
      view3d.setActive(is3d);
      canvas2d.hidden = is3d;
      btn2d?.classList.toggle('active', !is3d);
      btn3d?.classList.toggle('active', is3d);
      btn2d?.setAttribute('aria-pressed', String(!is3d));
      btn3d?.setAttribute('aria-pressed', String(is3d));
    }

    btn2d?.addEventListener('click', () => setMode('2d'));
    btn3d?.addEventListener('click', () => setMode('3d'));

    // Acoplado ao loop de renderização principal via rAF próprio —
    // independente do _loop() do script.js, então nunca adiciona custo
    // quando o modo 3D está inativo (early-return em draw()).
    function loop() {
      view3d.draw();
      requestAnimationFrame(loop);
    }
    loop();

    window.addEventListener('resize', () => { if (view3d.active) view3d.resize(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();