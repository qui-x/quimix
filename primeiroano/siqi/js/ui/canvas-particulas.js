/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (decorativo)
   ARQUIVO: canvas-particulas.js
   ───────────────────────────────────────────────────────────────
   O canvas de partículas ambiente do laboratório — puramente
   decorativo, reage sutilmente ao estado do Lab.
   Depende de: nada.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   8. CANVAS DE PARTÍCULAS — visualização do béquer
════════════════════════════════════════════════════════════════ */
var CANVAS_STATE = { particulas:[], raf:null, modo:'repouso' };

function initCanvas(){
  var cv=$('sim-canvas'); if(!cv) return;
  function resize(){ cv.width=cv.offsetWidth; cv.height=cv.offsetHeight||120; }
  resize();
  new ResizeObserver(resize).observe(cv);
  gerarParticulas('repouso');
  animarCanvas();
}

function gerarParticulas(modo){
  var cv=$('sim-canvas'); if(!cv) return;
  var c=COMPOSTOS[STATE.compostoAtual]||{};
  var col=FUNCAO_META[c.funcao]?FUNCAO_META[c.funcao].cor:'#FF6B47';
  CANVAS_STATE.modo=modo;
  CANVAS_STATE.particulas=[];
  var n= modo==='reacao' ? 35 : modo==='acerto' ? 25 : 20;
  for(var i=0;i<n;i++){
    var speed= modo==='reacao' ? 1.8 : modo==='acerto' ? 2.5 : 0.4;
    CANVAS_STATE.particulas.push({
      x:Math.random()*cv.width, y:Math.random()*cv.height,
      r:Math.random()*3+2,
      vx:(Math.random()-.5)*speed*2, vy:(Math.random()-.5)*speed*2,
      alpha:Math.random()*.5+.4,
      col:col, pulse:Math.random()*Math.PI*2,
    });
  }
}

function animarCanvas(){
  var cv=$('sim-canvas'); if(!cv) return;
  var ctx=cv.getContext('2d');
  function frame(){
    CANVAS_STATE.raf=requestAnimationFrame(frame);
    ctx.clearRect(0,0,cv.width,cv.height);
    CANVAS_STATE.particulas.forEach(function(p){
      p.x+=p.vx; p.y+=p.vy; p.pulse+=0.04;
      if(p.x<0||p.x>cv.width)  p.vx*=-1;
      if(p.y<0||p.y>cv.height) p.vy*=-1;
      var r=p.r+(CANVAS_STATE.modo==='reacao'?Math.sin(p.pulse)*1.5:0);
      ctx.beginPath();
      ctx.arc(p.x,p.y,r,0,Math.PI*2);
      ctx.fillStyle=p.col+(Math.round(p.alpha*255).toString(16).padStart(2,'0'));
      ctx.fill();
    });
  }
  frame();
}

