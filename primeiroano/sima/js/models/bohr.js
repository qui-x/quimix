/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODELOS FÍSICOS — Bohr (1913)
   ARQUIVO: bohr.js
   ───────────────────────────────────────────────────────────────
   Modelo planetário: elétrons em camadas de energia quantizada.
   Clicar numa órbita excita um elétron (absorção); ele retorna
   emitindo luz na cor REAL calculada pela fórmula de Rydberg-Ritz
   (série de Balmer no visível para o hidrogênio).
   Adiciona a AtomicSim.prototype: _buildBohr, exciteBohr,
   _bohrFarthestAngle, returnBohr, _emitBohrPhoton, _updateBohr,
   _addBohrLog, _drawBohr.
   Depende de: models/atomic-sim-core.js, core/fisica.js
               (bohrEnergy, photonLambda, spectralSeries,
               photonColor, BOHR_OMEGA_K), core/audio.js (playTone).
═══════════════════════════════════════════════════════════════ */

'use strict';

// ════════════════════════════════════════════════════════════════
  // BOHR — exclusivamente saltos de elétrons entre camadas com energia
  // quantizada e emissão de luz real (cores de Balmer). Subir/voltar
  // explicitamente por camada: evita duas transições simultâneas na
  // mesma camada, que seria incoerente com a literatura — um elétron
  // por vez ocupa o "estado de transição" visível.
  // ════════════════════════════════════════════════════════════════
  /**
   * Constrói as camadas do modelo de Bohr usando o MESMO espaçamento
   * linear já validado no modelo de Rutherford (_buildNucleusStructure):
   * raio = maxShellR * (0.35 + i/(N-1) * 0.65), onde i é o índice da
   * camada e N o total de camadas do elemento. Isso resolve a
   * compressão visual que a fórmula anterior (raio ∝ n²/Z) causava em
   * elementos pesados — ali, a camada K de um átomo com Z alto ficava
   * com raio menor que o próprio núcleo desenhado, sobrepondo tudo.
   * Manter a mesma fórmula do Rutherford também é mais coerente
   * historicamente: a noção de núcleo central + camadas externas já
   * vem de Rutherford (1911); Bohr (1913) apenas quantizou a energia
   * dessas camadas, sem mudar sua disposição espacial relativa.
   */
  AtomicSim.prototype._buildBohr = function() {
    const W=this.canvas.width||800, H=this.canvas.height||600;
    const shells=this.electrons;
    const ns=Math.min(shells.length, 7);
    const maxShellR = Math.min(W,H)*0.46; // mesmo valor usado no Rutherford
    this.bohrShellRadii = Array.from({length:ns}, (_,i) =>
      maxShellR * (0.35 + (i/Math.max(1,ns-1))*0.65)
    );

    this.bohrElectrons=[];
    for (let s=0;s<ns;s++) {
      const n=s+1;
      // Velocidade angular SEM dependência de Z — antes, elementos
      // leves giravam muito mais lento que pesados (H ficava quase
      // parado, ~70s por volta, enquanto elementos com Z alto giravam
      // rápido o suficiente para causar tontura). Agora todo elemento
      // gira no mesmo ritmo, calibrado para ficar confortável:
      // BOHR_OMEGA_K corresponde a ~7s por volta na camada K (n=1);
      // o decaimento 1/√n (mais suave que o 1/n² anterior) mantém as
      // camadas externas mais lentas que as internas — coerente com a
      // física real — sem nunca ficarem perceptivelmente paradas
      // (camada Q, n=7, fica em ~18.5s por volta).
      const omega = BOHR_OMEGA_K / Math.sqrt(n);
      for (let ei=0;ei<shells[s];ei++) {
        this.bohrElectrons.push({
          n, shell:s, baseShell:s,
          angle:(ei/shells[s])*Math.PI*2,
          omega,
          transition: null,
        });
      }
    }
    this.bohrPhotons=[];
    this.bohrLog=[];
    this._bohrShellBusy = new Set();
  };

  /**
   * Excita (sobe) um elétron da camada `from` para `to`.
   * Só permite uma transição por camada de origem ao mesmo tempo —
   * evita inconsistência de dois saltos simultâneos na mesma camada.
   *
   * Reescrito para refletir 4 propriedades reais do postulado de Bohr:
   *  1) Órbitas estacionárias: enquanto não excitado, o elétron mantém
   *     raio e velocidade angular fixos na sua camada (já era assim).
   *  2) Salto instantâneo: a posição RADIAL muda em 1 frame só — nada
   *     de interpolação suave ao longo de 40+ frames. O estado
   *     'leap' dura exatamente 1 ciclo de update() antes de virar
   *     'excited'.
   *  3) Tempo fixo no estado excitado: depois do salto instantâneo, o
   *     elétron permanece estabilizado na nova camada por um tempo
   *     determinado (excitedDuration), só então inicia o retorno
   *     (também instantâneo) — ver _updateBohr.
   *  4) Fase angular sincronizada: o ângulo de chegada na camada de
   *     destino é escolhido para maximizar a distância angular em
   *     relação aos elétrons já presentes ali — aproximação visual do
   *     Princípio de Exclusão de Pauli (elétrons reais não podem
   *     ocupar o mesmo estado quântico; aqui, evitamos que fiquem
   *     alinhados no mesmo eixo radial).
   */
  AtomicSim.prototype.exciteBohr = function(from, to) {
    const shells=this.electrons;
    const ns=Math.min(shells.length,7);
    if (ns<2) return false;
    if (from===undefined) from = Math.floor(Math.random()*(ns-1));
    if (to===undefined)   to   = from+1;
    if (from<0||from>=ns||to<0||to>=ns||from===to) return false;
    if (this._bohrShellBusy.has(from)) return false; // já tem elétron subindo dessa camada

    for (const e of this.bohrElectrons) {
      if (e.shell===from && !e.transition) {
        const ni=to+1, nf=from+1;
        const dE=Math.abs(bohrEnergy(this.Z,ni)-bohrEnergy(this.Z,nf));
        const λ=photonLambda(this.Z, nf, ni);
        const arrivalAngle = this._bohrFarthestAngle(to, e);
        // EXCITED_DURATION: tempo fixo no estado excitado (ponto 3) —
        // mantido em 80 frames (já calibrado visualmente antes), mas
        // agora SEM nenhuma fase de interpolação consumindo esse tempo:
        // o salto em si é instantâneo (ponto 2), só a PERMANÊNCIA leva
        // tempo, exatamente como o postulado descreve.
        e.transition = {
          phase: 'leap',          // 'leap' (1 frame) → 'excited' (tempo fixo) → 'fall' (1 frame)
          from, to,
          arrivalAngle,
          excitedTimer: 80,
          excitedDuration: 80,
        };
        this._bohrShellBusy.add(from);
        playTone(300+from*120, 0.15, 0.07);
        announce(`Absorção: elétron camada ${SHELLS[from]}→${SHELLS[to]}, ΔE=${dE.toFixed(2)} eV.`);
        this._addBohrLog(nf, ni, λ, photonColor(λ), spectralSeries(nf), 'absorção');
        return true;
      }
    }
    return false;
  };

  /**
   * Calcula o ângulo, na camada `shell`, mais distante angularmente de
   * TODOS os elétrons já presentes nela — aproximação visual do
   * Princípio de Exclusão de Pauli (ponto 4 do pedido): evita que o
   * elétron recém-chegado fique alinhado no mesmo eixo radial que um
   * elétron de outra camada, distribuindo a repulsão eletromagnética
   * de forma harmônica. Busca em 36 candidatos (passo de 10°) o que
   * maximiza a menor distância angular até qualquer elétron existente
   * na camada de destino — não precisa ser exaustivo, só visualmente
   * bem distribuído.
   */
  AtomicSim.prototype._bohrFarthestAngle = function(shell, excludeElectron) {
    const occupants = this.bohrElectrons.filter(e => e!==excludeElectron &&
      (e.shell===shell || (e.transition && e.transition.to===shell)));
    if (occupants.length===0) return Math.random()*Math.PI*2;

    let bestAngle = 0, bestMinDist = -1;
    const CANDIDATES = 36;
    for (let i=0;i<CANDIDATES;i++) {
      const candidate = (i/CANDIDATES)*Math.PI*2;
      let minDist = Infinity;
      for (const o of occupants) {
        let diff = Math.abs(candidate - o.angle) % (Math.PI*2);
        if (diff > Math.PI) diff = Math.PI*2 - diff;
        if (diff < minDist) minDist = diff;
      }
      if (minDist > bestMinDist) { bestMinDist = minDist; bestAngle = candidate; }
    }
    return bestAngle;
  };

  /**
   * Retorna (desce) explicitamente um elétron que está atualmente
   * excitado (fase 'excited') na camada `atShell` de volta à sua
   * camada de origem. Sem isso, só seria possível "subir" — pedido
   * explícito do usuário para poder forçar emissão sem esperar o
   * tempo fixo natural. A queda em si também é instantânea (fase
   * 'fall', 1 frame), igual à subida.
   */
  AtomicSim.prototype.returnBohr = function(atShell) {
    for (const e of this.bohrElectrons) {
      if (e.transition && e.transition.phase==='excited' && e.transition.to===atShell) {
        e.transition.phase = 'fall';
        return true;
      }
    }
    return false;
  };

  /** Emite o fóton e finaliza a transição — chamado após a fase 'fall'
   * (instantânea) ter colocado o elétron de volta na camada de origem. */
  AtomicSim.prototype._emitBohrPhoton = function(e) {
    const { from, to } = e.transition;
    const ni=to+1, nf=from+1;
    const λ=photonLambda(this.Z, ni, nf);
    const col=photonColor(λ);
    const series=spectralSeries(nf);
    const dE=Math.abs(bohrEnergy(this.Z,nf)-bohrEnergy(this.Z,ni));
    this.bohrPhotons.push({
      x:this.canvas.width/2, y:this.canvas.height/2,
      r:0, color:col, lambda:Math.round(λ), series, deltaE:dE.toFixed(2), alpha:1,
    });
    this._addBohrLog(ni, nf, λ, col, series, 'emissão');
    playTone(220 + (λ < 750 ? (750-λ)*1.5 : 0), 0.25, 0.06);
    announce(`Fóton emitido: λ=${Math.round(λ)} nm, ${series}, cor real da literatura.`);
    this._bohrShellBusy.delete(from);
    e.transition = null;
  };

  /**
   * Avança a máquina de estados de cada elétron em transição. As duas
   * fases de movimento real ('leap' e 'fall') duram exatamente 1
   * chamada de update() — o "teletransporte" do ponto 2 do pedido:
   * não há nenhum frame intermediário com posição interpolada entre
   * as duas camadas. Só a fase 'excited' tem duração de fato (tempo
   * fixo, ponto 3), contada em excitedTimer.
   */
  AtomicSim.prototype._updateBohr = function() {
    for (const e of this.bohrElectrons) {
      if (!e.transition) { e.angle += e.omega; continue; }
      const t = e.transition;

      if (t.phase === 'leap') {
        // Salto instantâneo: já no frame seguinte o elétron está
        // oficialmente na camada de destino, na fase 'excited'. O
        // ângulo de chegada (calculado em exciteBohr via
        // _bohrFarthestAngle) é aplicado aqui, no mesmo frame em que
        // a posição radial muda — sem nenhum frame de transição visual
        // gradual entre os dois raios.
        e.angle = t.arrivalAngle;
        e.shell = t.to;
        t.phase = 'excited';
      } else if (t.phase === 'excited') {
        // Tempo fixo no estado excitado (ponto 3): o elétron permanece
        // estabilizado na nova camada, girando normalmente nela
        // (mesma velocidade angular que qualquer elétron estacionário
        // teria naquele raio), até o timer esgotar ou o usuário chamar
        // returnBohr() explicitamente.
        const n = t.to+1;
        e.angle += BOHR_OMEGA_K / Math.sqrt(n);
        t.excitedTimer--;
        if (t.excitedTimer <= 0) {
          // Queda instantânea executada no MESMO tick em que o tempo
          // fixo se esgota — evita 1 frame de atraso desnecessário
          // entre "tempo esgotou" e "elétron de fato cai".
          e.angle = this._bohrFarthestAngle(t.from, e);
          e.shell = t.from;
          this._emitBohrPhoton(e);
        }
      } else if (t.phase === 'fall') {
        // Mantido por robustez (ex: returnBohr() força esta fase
        // diretamente, fora do ramo 'excited' acima) — queda
        // instantânea idêntica à executada no ramo 'excited'.
        e.angle = this._bohrFarthestAngle(t.from, e);
        e.shell = t.from;
        this._emitBohrPhoton(e);
      }
    }
    for (const ph of this.bohrPhotons) {
      ph.r += 2.2;
      ph.alpha = Math.max(0, 1 - ph.r / (Math.min(this.canvas.width, this.canvas.height)*.45));
    }
    this.bohrPhotons = this.bohrPhotons.filter(p=>p.alpha>0.02);
  };

  AtomicSim.prototype._addBohrLog = function(ni, nf, λ, color, series, tipo='emissão') {
    const entry = { texto: `${tipo} ${SHELLS[ni-1]}→${SHELLS[nf-1]} λ≈${Math.round(λ)} nm (${series})`, color, time: Date.now() };
    this.bohrLog.unshift(entry);
    if (this.bohrLog.length>8) this.bohrLog.pop();
    const log=document.getElementById('photon-log');
    if (!log) return;
    const div=document.createElement('div');
    div.className='photon-entry';
    div.style.borderLeftColor=color;
    div.textContent=entry.texto;
    log.insertBefore(div, log.firstChild);
    if (log.children.length>8) log.removeChild(log.lastChild);
  };

  // ── BOHR ───────────────────────────────────────────────────────
  AtomicSim.prototype._drawBohr = function(ctx,W,H) {
    const cx=W/2, cy=H/2;
    const shells=this.electrons;
    const ns=Math.min(shells.length,7);
    // Raios pré-calculados em _buildBohr, com o MESMO espaçamento
    // linear usado no Rutherford — nunca comprime, independente de Z.
    const radii = this.bohrShellRadii || [];

    for (let s=0;s<ns;s++) {
      const n=s+1;
      const r=radii[s] ?? 60;
      const hasExcited=this.bohrElectrons.some(e=>e.shell===s && e.transition);
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.strokeStyle=hasExcited?'rgba(167,139,250,.55)':'rgba(96,165,250,.18)';
      ctx.setLineDash([3,7]); ctx.lineWidth=hasExcited?1.8:1; ctx.stroke(); ctx.setLineDash([]);
      const En=bohrEnergy(this.Z,n).toFixed(1);
      ctx.fillStyle='rgba(122,154,181,.55)'; ctx.font='9px Consolas';
      ctx.fillText(`${SHELLS[s]} (${En} eV)`,cx+r+4,cy+4);
    }

    const ng=ctx.createRadialGradient(cx-4,cy-4,0,cx,cy,18);
    ng.addColorStop(0,'#fef9c3'); ng.addColorStop(1,'#92400e');
    ctx.beginPath(); ctx.arc(cx,cy,18,0,Math.PI*2);
    ctx.fillStyle=ng; ctx.shadowColor='#f59e0b'; ctx.shadowBlur=14; ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.8)'; ctx.font=`bold ${this.sym.length>1?9:11}px Consolas`;
    ctx.fillText(this.sym,cx-this.sym.length*3.2,cy+4);

    for (const e of this.bohrElectrons) {
      // e.shell já reflete a camada ATUAL — o salto (leap/fall) já
      // aconteceu de forma instantânea em _updateBohr, então aqui só
      // lemos o raio correspondente, sem nenhuma interpolação radial.
      const r=radii[e.shell] ?? 60;
      let ealpha=1, ecol='#93c5fd';

      if (e.transition && e.transition.phase==='excited') {
        const { from, to, excitedTimer, excitedDuration } = e.transition;
        const progress = 1 - excitedTimer/excitedDuration;
        ealpha = 0.65+0.35*Math.sin(progress*Math.PI); // pulsa enquanto excitado, sem mover raio
        // Cor do elétron durante a excitação = cor real do fóton que será emitido
        const niPreview=to+1, nfPreview=from+1;
        const λPreview = photonLambda(this.Z, niPreview, nfPreview);
        ecol = photonColor(λPreview);
      }

      const angle=e.angle;
      const ex=cx+Math.cos(angle)*r, ey=cy+Math.sin(angle)*r;
      ctx.globalAlpha=ealpha;
      ctx.beginPath(); ctx.arc(ex,ey,5.5,0,Math.PI*2);
      ctx.fillStyle=ecol; ctx.shadowColor=ecol; ctx.shadowBlur=12; ctx.fill(); ctx.shadowBlur=0;
      ctx.globalAlpha=1;
    }

    // Fótons emitidos — cor real da literatura, com rótulo de série
    for (const ph of this.bohrPhotons) {
      ctx.beginPath(); ctx.arc(ph.x,ph.y,ph.r,0,Math.PI*2);
      ctx.strokeStyle=ph.color+Math.round(ph.alpha*255).toString(16).padStart(2,'0');
      ctx.lineWidth=2.5; ctx.shadowColor=ph.color; ctx.shadowBlur=8*ph.alpha;
      ctx.stroke(); ctx.shadowBlur=0;
      if (ph.r>20 && ph.r<60) {
        ctx.fillStyle=ph.color+Math.round(ph.alpha*220).toString(16).padStart(2,'0');
        ctx.font='9px Consolas';
        ctx.fillText(`${ph.lambda}nm`,ph.x+ph.r*.7,ph.y-ph.r*.1);
      }
    }
    this._legend(ctx,H,`Eₙ=−${(13.6*this.Z*this.Z).toFixed(1)}/n² eV · cores reais de Balmer · use os seletores K/L/M/N`);
  };

