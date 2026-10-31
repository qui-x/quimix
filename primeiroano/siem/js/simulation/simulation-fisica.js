/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO — física (sem tocar em canvas/ctx)
   ARQUIVO: simulation-fisica.js
   ───────────────────────────────────────────────────────────────
   Posicionamento inicial das partículas (_placeParticles), a
   integração do movimento a cada frame (update — inclui agitação
   térmica, atração de coesão no estado líquido e vibração no
   sólido) e a resolução de colisões elásticas entre partículas
   (_resolveCollisions).
   Adiciona a Simulation.prototype: _placeParticles, update,
   _resolveCollisions.
   Depende de: simulation/simulation-core.js, core/termodinamica.js
               (determineState).
═══════════════════════════════════════════════════════════════ */

'use strict';

Simulation.prototype._placeParticles = function() {
    const { x,y,w,h } = this.box;
    const n=this.N;
    this.particles=[];

    if (this.state==='solid') {
      const densRatio = this.entry.densSolid/this.entry.densLiquid;
      const spacingFactor = this.entry.anomalyDensity ? 1.08 : Math.pow(1/densRatio,1/2)*0.95;
      const cols=Math.ceil(Math.sqrt(n*w/h));
      const rows=Math.ceil(n/cols);
      const cellW=w/(cols+1)*spacingFactor, cellH=h/(rows+1)*spacingFactor;
      // Espaçamento mínimo: nunca menor que o raio de colisão (evita overlap inicial)
      const minCell = this._particleRadius()*1.8;
      const cellSize=Math.max(minCell, Math.min(cellW,cellH,28));
      const gridW=cellSize*(cols-1), gridH=cellSize*(rows-1);
      const ox=x+(w-gridW)/2, oy=y+(h-gridH)/2;
      let i=0;
      for (let r=0;r<rows && i<n;r++) for (let c=0;c<cols && i<n;c++,i++) {
        this.particles.push({
          bx:ox+c*cellSize, by:oy+r*cellSize,
          x:ox+c*cellSize, y:oy+r*cellSize,
          vx:0, vy:0, jitter:Math.random()*Math.PI*2, angle:Math.random()*Math.PI*2,
        });
      }
    } else if (this.state==='liquid') {
      const r=this._particleRadius();
      for (let i=0;i<n;i++) {
        this.particles.push({
          x:x+r+Math.random()*(w-2*r), y:y+r+Math.random()*(h-2*r),
          vx:(Math.random()-.5)*0.6, vy:(Math.random()-.5)*0.6, jitter:0, angle:Math.random()*Math.PI*2, omega:(Math.random()-.5)*0.04,
        });
      }
    } else {
      for (let i=0;i<n;i++) {
        this.particles.push({
          x:x+Math.random()*w, y:y+Math.random()*h,
          vx:(Math.random()-.5)*3, vy:(Math.random()-.5)*3, jitter:0, angle:Math.random()*Math.PI*2, omega:(Math.random()-.5)*0.15,
        });
      }
    }
  };

  Simulation.prototype.update = function() {
    if (!this.entry) return;
    this.frame++;
    const { x,y,w,h } = this.box;
    const Tk=this.T_C+273.15;
    const agitation=Math.max(0.1,Math.min(3,Tk/300));
    const pr = this._particleRadius();

    if (this.state==='solid') {
      for (const p of this.particles) {
        p.jitter+=0.15;
        const amp=1.4*agitation;
        p.x=p.bx+Math.sin(p.jitter*1.3)*amp;
        p.y=p.by+Math.cos(p.jitter*1.7)*amp;
        p.angle+=0.00025*agitation;
      }
      // Sólido: vizinhos não devem se sobrepor mesmo vibrando — empurra de volta
      this._resolveCollisions(pr*1.7, 0.5);
    } else if (this.state==='liquid') {
      for (const p of this.particles) {
        p.vx+=(Math.random()-.5)*0.25*agitation;
        p.vy+=(Math.random()-.5)*0.25*agitation;
        const sp=Math.hypot(p.vx,p.vy), maxSp=1.4*agitation;
        if (sp>maxSp){p.vx*=maxSp/sp;p.vy*=maxSp/sp;}
        p.x+=p.vx; p.y+=p.vy;
        p.angle+=p.omega;
        const r=pr;
        if (p.x<x+r){p.x=x+r;p.vx*=-0.8;} if (p.x>x+w-r){p.x=x+w-r;p.vx*=-0.8;}
        if (p.y<y+r){p.y=y+r;p.vy*=-0.8;} if (p.y>y+h-r){p.y=y+h-r;p.vy*=-0.8;}
      }
      this._resolveCollisions(pr*2, 1.0);
    } else {
      const speed=2.2*agitation;
      for (const p of this.particles) {
        p.vx+=(Math.random()-.5)*0.4;
        p.vy+=(Math.random()-.5)*0.4;
        const sp=Math.hypot(p.vx,p.vy), maxSp=speed;
        if (sp>maxSp){p.vx*=maxSp/sp;p.vy*=maxSp/sp;}
        p.x+=p.vx; p.y+=p.vy;
        p.angle+=p.omega;
        if (p.x<x){p.x=x;p.vx*=-1;} if (p.x>x+w){p.x=x+w;p.vx*=-1;}
        if (p.y<y){p.y=y;p.vy*=-1;} if (p.y>y+h){p.y=y+h;p.vy*=-1;}
      }
      this._resolveCollisions(pr*2, 1.0);
    }
  };

  /**
   * Detecta e resolve colisões círculo-círculo entre todas as partículas,
   * evitando que se sobreponham ("efeito fantasma"). Usa separação
   * posicional simples + troca de velocidade normal (elástica simplificada).
   * @param {number} minDist   distância mínima entre centros antes de colidir
   * @param {number} restitution  fator de "quique" na troca de velocidade (0-1)
   */
  Simulation.prototype._resolveCollisions = function(minDist, restitution) {
    const ps=this.particles, n=ps.length;
    const minD2=minDist*minDist;
    for (let i=0;i<n-1;i++) for (let j=i+1;j<n;j++) {
      const a=ps[i], b=ps[j];
      let dx=b.x-a.x, dy=b.y-a.y;
      let d2=dx*dx+dy*dy;
      if (d2>=minD2 || d2<1e-6) continue;
      const d=Math.sqrt(d2);
      const overlap=minDist-d;
      const nx=dx/d, ny=dy/d;
      // Separa as duas partículas igualmente para fora do overlap
      const push=overlap*0.5;
      a.x-=nx*push; a.y-=ny*push;
      b.x+=nx*push; b.y+=ny*push;
      // Troca componente normal da velocidade (colisão elástica simplificada)
      if (a.vx!==undefined && b.vx!==undefined) {
        const avn=a.vx*nx+a.vy*ny, bvn=b.vx*nx+b.vy*ny;
        const diff=(bvn-avn)*restitution;
        a.vx+=nx*diff; a.vy+=ny*diff;
        b.vx-=nx*diff; b.vy-=ny*diff;
      }
    }
  };

