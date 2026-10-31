/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODELOS FÍSICOS — Thomson (1904)
   ARQUIVO: thomson.js
   ───────────────────────────────────────────────────────────────
   "Pudim de passas": elétrons em anéis concêntricos estáveis
   dentro de uma esfera contínua de carga positiva, seguindo a
   Tabela 1 empírica do artigo original de Thomson (1904) — ver
   THOMSON_TABLE_1904 em data/dados-sima.js.
   Adiciona a AtomicSim.prototype: _thomsonOuterRingFor,
   _thomsonRingLayout, _buildThomson, _updateThomson, _drawThomson.
   Depende de: models/atomic-sim-core.js, core/audio.js (playTone),
               core/dados.js (THOMSON_TABLE_1904).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
  // THOMSON — Problema de Thomson + textura orgânica de "pudim"
  // ════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════
  // THOMSON (1904) — "Pudim de Passas" / Plum Pudding Model
  // ────────────────────────────────────────────────────────────────
  // REESTRUTURADO com base em fontes históricas primárias (Thomson,
  // Phil. Mag. 1904) e na literatura de física revisada:
  //
  // 1. CARGA POSITIVA: Thomson descreveu uma esfera de carga positiva
  //    CONTÍNUA e UNIFORME (não pontos "+" discretos espalhados) —
  //    ele a comparava a um fluido/gelatina, nunca a um sólido com
  //    "caroços" de carga. A textura deve ser um gradiente suave e
  //    homogêneo, não pontos de "+" sobrepostos ou orgânicos demais.
  //
  // 2. ELÉTRONS EM ANÉIS CONCÊNTRICOS: Thomson não distribuiu os
  //    elétrons aleatoriamente — ele provou matematicamente (e depois
  //    demonstrou com agulhas magnetizadas flutuando em cortiça) que
  //    a configuração ELETROSTATICAMENTE ESTÁVEL é em anéis concêntricos
  //    coplanares, com MAIS elétrons no anel externo e MENOS nos
  //    internos (ex: N=12 → anel de 6 + 1 no centro + ... ver Thomson
  //    1904, Tabela II). Implementamos a regra de preenchimento real:
  //    cada anel suporta um número máximo de elétrons que cresce do
  //    centro para fora; o excedente forma o próximo anel.
  //
  // 3. SEM "BLOB" ORGÂNICO: o contorno irregular tipo geleia adicionado
  //    antes não tem base histórica e causava sobreposição visual de
  //    cargas "+" (mesmo ângulo recalculado com fórmulas conflitantes
  //    para raio/posição) — removido em favor de uma esfera lisa com
  //    gradiente, fiel à descrição original de Thomson.
  // ════════════════════════════════════════════════════════════════

  /**
   * Tabela empírica REAL de Thomson — agora vem de window.SIMA_DATA
   * (dadossima.js) como THOMSON_TABLE_1904. Fonte primária:
   * Thomson, J.J. "On the Structure of the Atom" (Phil. Mag., 1904).
   */

  /**
   * Decide o anel externo estável para o N restante. Prioridades,
   * na mesma ordem de raciocínio que Thomson aplicou em 1904:
   *  1) Se existe uma linha da tabela com n+p EXATAMENTE igual a N,
   *     use-a (caso perfeito: o anel externo n e os p elétrons
   *     internos exigidos esgotam exatamente o total do átomo).
   *  2) Caso contrário, usa o maior n tal que n ≤ N (o anel externo
   *     leva o máximo de elétrons permitido pela estabilidade), e o
   *     restante (incluindo os p internos da própria linha) é
   *     resolvido recursivamente para dentro.
   */
  AtomicSim.prototype._thomsonOuterRingFor = function(N) {
    const table = THOMSON_TABLE_1904;
    const exact = table.find(row => row.n + row.p === N);
    if (exact) return exact;
    let best = { n: Math.min(N, 3), p: 0 };
    for (const row of table) {
      if (row.n <= N && row.n > best.n) best = row;
    }
    return best;
  };

  /**
   * Monta os anéis concêntricos do mais interno para o mais externo,
   * aplicando recursivamente a tabela de Thomson: o anel externo leva
   * o maior `n` estável permitido pelo N restante, e o que sobra
   * (incluindo os `p` elétrons internos exigidos) é resolvido para
   * dentro, recursivamente, até esgotar N.
   */
  AtomicSim.prototype._thomsonRingLayout = function(N) {
    if (N <= 0) return [];
    if (N <= 2) return [N]; // 1–2 elétrons: caso trivial, sem anel formal

    const rings = []; // será preenchido externo→interno, depois invertido
    let remaining = N;

    while (remaining > 2) {
      const { n, p } = this._thomsonOuterRingFor(remaining);
      rings.push(n);
      remaining -= n;
      // Os p elétrons internos exigidos por este anel já fazem parte do
      // "remaining" a ser resolvido nas próximas iterações (eles formam
      // os anéis mais internos, exatamente como Thomson descreveu).
    }
    if (remaining > 0) rings.push(remaining); // núcleo central final

    return rings.reverse(); // ordem interno→externo para o desenho
  };

  AtomicSim.prototype._buildThomson = function() {
    const W=this.canvas.width||800, H=this.canvas.height||600;
    const cx=W/2, cy=H/2;
    const R=Math.min(W,H)*.32;
    const N=Math.max(1, Math.min(this.totalE, 60)); // teto visual de 60 (mantém legibilidade)

    const ringCounts = this._thomsonRingLayout(N);
    const numRings = ringCounts.length;

    this.thomsonElectrons = [];
    this.thomsonRings = []; // guarda raio de cada anel para desenho de referência

    ringCounts.forEach((count, ringIdx) => {
      // Anéis mais externos (índice maior) ficam mais perto da borda;
      // o índice 0 é o anel mais interno (ou o elétron central único).
      const ringFrac = numRings === 1 ? 0.55 : 0.25 + (ringIdx/(numRings-1)) * 0.62;
      const ringR = count === 1 && ringIdx === 0 && numRings === 1 ? 0 : R*ringFrac;
      this.thomsonRings.push(ringR);

      for (let i=0;i<count;i++) {
        const a = (i/count)*Math.PI*2 + ringIdx*0.35; // leve rotação por anel evita alinhamento visual
        this.thomsonElectrons.push({
          x:cx+Math.cos(a)*ringR, y:cy+Math.sin(a)*ringR,
          vx:0, vy:0,
          ring: ringIdx, ringR, ringAngle: a,
          wobblePhase: Math.random()*Math.PI*2,
        });
      }
    });

    this._thomsonR = R;
  };

  // ════════════════════════════════════════════════════════════════
  // FÍSICA DA DINÂMICA: por que não é Coulomb puro
  // ────────────────────────────────────────────────────────────────
  // Testamos numericamente a física pura de Thomson (atração de Gauss
  // ke·Z·r/R² vs. repulsão de Coulomb ke/r² entre elétrons): o raio de
  // equilíbrio resultante (~15px para um anel de 6 elétrons em R=88px)
  // é MUITO menor que o raio do anel calculado pela tabela histórica
  // de Thomson (_thomsonRingLayout) — fisicamente correto (a razão Z/N
  // sempre colapsa o anel para perto do centro em escalas de poucos
  // elétrons), mas visualmente inútil: os elétrons "afundavam" todos
  // para perto do núcleo, escondendo a estrutura em anéis que é o
  // ponto central do modelo.
  //
  // Por isso a dinâmica usa uma força de ANCORAGEM RADIAL (mola fraca
  // até o raio do anel definido pelo layout de Thomson) somada à
  // repulsão de Coulomb mútua entre elétrons (que continua dando o
  // espaçamento angular natural e os pequenos ajustes dinâmicos da
  // "dança" do anel). O resultado preserva o comportamento qualitativo
  // correto — elétrons em anéis concêntricos estáveis, mais elétrons
  // no anel externo — na escala visual pretendida pelo simulador.
  // ════════════════════════════════════════════════════════════════
  AtomicSim.prototype._updateThomson = function() {
    const W=this.canvas.width, H=this.canvas.height;
    const cx=W/2, cy=H/2;
    const R=this._thomsonR || Math.min(W,H)*.32;
    const N=this.thomsonElectrons.length;
    const ke=R*R*0.012;       // repulsão de Coulomb (espaçamento angular)
    const kAnchor=0.05;       // ancoragem radial ao raio do anel próprio
    const dt=0.25, damp=0.85;

    for (let i=0;i<N;i++) {
      const e=this.thomsonElectrons[i];
      const dx=e.x-cx, dy=e.y-cy, r=Math.hypot(dx,dy)||0.1;
      const nx=dx/r, ny=dy/r;
      // Ancoragem ao raio do PRÓPRIO anel (e.ringR, definido na
      // construção pelo layout histórico de Thomson)
      const Fanchor = kAnchor*(e.ringR - r);
      let fx=Fanchor*nx, fy=Fanchor*ny;
      // Repulsão de Coulomb entre todos os elétrons (dá o espaçamento
      // angular dentro do anel e empurra anéis vizinhos levemente)
      for (let j=0;j<N;j++) {
        if (i===j) continue;
        const ej=this.thomsonElectrons[j];
        const ddx=e.x-ej.x, ddy=e.y-ej.y;
        const rij=Math.hypot(ddx,ddy)||0.1;
        const Frep=ke/(rij*rij+0.5);
        fx+=Frep*(ddx/rij); fy+=Frep*(ddy/rij);
      }
      // Pequena oscilação (caráter "fluido" do meio — Thomson descrevia
      // o meio positivo como gelatinoso/líquido, com elétrons móveis)
      e.wobblePhase += 0.03 + Math.random()*0.015;
      fx += Math.sin(e.wobblePhase) * 0.04;
      fy += Math.cos(e.wobblePhase*1.3) * 0.04;

      e.vx=(e.vx+fx*dt)*damp;
      e.vy=(e.vy+fy*dt)*damp;
      e.x+=e.vx*dt; e.y+=e.vy*dt;
      const rNew=Math.hypot(e.x-cx,e.y-cy);
      if (rNew>R) {
        const nx2=(e.x-cx)/rNew, ny2=(e.y-cy)/rNew;
        e.x=cx+nx2*(R-0.5); e.y=cy+ny2*(R-0.5);
        const vdotn=e.vx*nx2+e.vy*ny2;
        if (vdotn>0) { e.vx-=1.8*vdotn*nx2; e.vy-=1.8*vdotn*ny2; }
      }
    }
  };

  // ── THOMSON ────────────────────────────────────────────────────
  // Renderização fiel à descrição histórica (Thomson, 1904):
  //  • esfera de carga positiva CONTÍNUA e uniforme — sem blob
  //    orgânico nem pontos "+" discretos sobrepostos (esses geravam
  //    os "conflitos visuais" relatados: ângulos e raios recalculados
  //    de formas incompatíveis faziam cargas se aglomerarem ou
  //    desaparecerem em certas regiões da esfera).
  //  • elétrons organizados em ANÉIS CONCÊNTRICOS reais, seguindo a
  //    tabela empírica de Thomson (mais elétrons no anel externo,
  //    menos nos internos) — anéis tênues servem de guia visual.
  AtomicSim.prototype._drawThomson = function(ctx,W,H) {
    const cx=W/2, cy=H/2, R=this._thomsonR||Math.min(W,H)*.32;
    const pulse=1+.008*Math.sin(this.t*.03); // pulsação sutil (caráter fluido/gelatinoso)
    const Rp = R*pulse;

    // Esfera de carga positiva — gradiente radial CONTÍNUO e uniforme,
    // sem irregularidades de contorno (fiel à descrição de Thomson de
    // uma distribuição homogênea, comparada a um fluido/gelatina).
    ctx.beginPath(); ctx.arc(cx,cy,Rp,0,Math.PI*2);
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Rp);
    g.addColorStop(0,   'rgba(253,186,116,.42)');
    g.addColorStop(0.7, 'rgba(251,146,60,.30)');
    g.addColorStop(1,   'rgba(217,119,30,.16)');
    ctx.fillStyle=g; ctx.fill();
    ctx.strokeStyle='rgba(253,186,116,.45)'; ctx.lineWidth=1.5; ctx.stroke();

    // Leve brilho especular (reforça o caráter "fluido/gelatinoso",
    // sem distorcer o contorno como o blob anterior fazia)
    const spec = ctx.createRadialGradient(cx-Rp*.32,cy-Rp*.35,0,cx-Rp*.1,cy-Rp*.1,Rp*.7);
    spec.addColorStop(0,'rgba(255,255,255,.10)'); spec.addColorStop(1,'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(cx,cy,Rp,0,Math.PI*2); ctx.fillStyle=spec; ctx.fill();

    // Anéis-guia tênues, na posição real de cada anel de elétrons —
    // ajudam a visualizar a estrutura concêntrica descoberta por Thomson
    const ringRadii = [...new Set(this.thomsonRings||[])].filter(r=>r>0);
    ctx.setLineDash([2,5]);
    for (const rr of ringRadii) {
      ctx.beginPath(); ctx.arc(cx,cy,rr,0,Math.PI*2);
      ctx.strokeStyle='rgba(253,186,116,.18)'; ctx.lineWidth=1; ctx.stroke();
    }
    ctx.setLineDash([]);

    // Carga positiva: representada pela própria área contínua da esfera
    // (não por símbolos "+" individuais, que não têm base na descrição
    // original de Thomson e causavam sobreposição visual confusa).
    // Um único rótulo central indica a natureza da carga de fundo.
    ctx.fillStyle='rgba(253,186,116,.35)'; ctx.font=`${Math.max(9,Math.min(13,Rp*0.09))}px Consolas`;
    ctx.textAlign='center';
    ctx.fillText(`+${this.Z}`, cx, cy + Rp*0.06);
    ctx.font='8px Consolas'; ctx.fillStyle='rgba(253,186,116,.22)';
    ctx.fillText('carga positiva uniforme', cx, cy + Rp*0.06 + 13);
    ctx.textAlign='left';

    // Linhas de Coulomb entre elétrons próximos (mostra a repulsão
    // mútua que Thomson usou para deduzir a estrutura em anéis)
    ctx.lineWidth=0.6;
    for (let i=0;i<this.thomsonElectrons.length-1;i++) {
      for (let j=i+1;j<this.thomsonElectrons.length;j++) {
        const a=this.thomsonElectrons[i], b=this.thomsonElectrons[j];
        const d=Math.hypot(a.x-b.x,a.y-b.y);
        if (d<R*.55) {
          const alpha=Math.max(0, 0.16*(1-d/(R*.55)));
          ctx.strokeStyle=`rgba(248,113,113,${alpha.toFixed(2)})`;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }

    // Elétrons — rótulo "e⁻" individual só quando há poucos (legível);
    // com muitos elétrons, o rótulo poluiria a cena, então mostra-se
    // apenas o corpo da partícula (mesma convenção usada nos outros
    // modelos do simulador quando o número de partículas é grande).
    const showLabels = this.thomsonElectrons.length <= 12;
    for (const e of this.thomsonElectrons) {
      const eg=ctx.createRadialGradient(e.x-3,e.y-3,0,e.x,e.y,6.5);
      eg.addColorStop(0,'#93c5fd'); eg.addColorStop(1,'#1e40af');
      ctx.shadowColor='#60a5fa'; ctx.shadowBlur=9;
      ctx.beginPath(); ctx.arc(e.x,e.y,6.5,0,Math.PI*2); ctx.fillStyle=eg; ctx.fill();
      ctx.shadowBlur=0;
      if (showLabels) {
        ctx.fillStyle='rgba(255,255,255,.78)'; ctx.font='bold 7px Consolas';
        ctx.fillText('e⁻',e.x-6,e.y+3);
      }
    }

    const ringCount = ringRadii.length + (this.thomsonElectrons.some(e=>e.ringR===0)?1:0);
    this._legend(ctx,H,`Esfera de carga +${this.Z} contínua · ${this.thomsonElectrons.length} e⁻ em ${ringCount||1} anel(éis) concêntrico(s) (Thomson, 1904)`);
  };

