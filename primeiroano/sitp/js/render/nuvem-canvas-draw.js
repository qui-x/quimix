/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO
   ARQUIVO: nuvem-canvas-draw.js
   ───────────────────────────────────────────────────────────────
   O desenho pixel-a-pixel de um orbital atômico (s, p, d, f) no
   canvas, simulando a densidade de probabilidade eletrônica real —
   a parte mais pesada computacionalmente do simulador. Compartilhado
   entre a vista normal e a tela cheia.
   Depende de: core/config-eletronica.js.
   Usado por: render/nuvem-eletronica.js, render/fullscreen.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function _nuvemDrawOnCanvas(canvas, orbital){
  if(!canvas) return;
  const orbitaisInfo = JSON.parse(canvas.dataset.orbitais||'[]');
  const atomCor = canvas.dataset.cor || '#00e5ff';
  const Z_num   = parseInt(canvas.dataset.z)||1;
  const DIM = Math.max(canvas.offsetWidth, canvas.offsetHeight, 340);
  canvas.width  = DIM;
  canvas.height = DIM;
  const ctx = canvas.getContext('2d');
  /* getContext pode devolver null: navegador sem suporte a canvas 2D,
     contexto perdido (troca de GPU, aba suspensa por muito tempo) ou
     ambiente sem renderizacao. Sem esta guarda a funcao lancava
     "Cannot read properties of null" e o painel da nuvem ficava em
     branco, sem nenhuma mensagem. */
  if(!ctx){
    const aviso = canvas.parentElement;
    if(aviso && !aviso.querySelector('.nuvem-sem-canvas')){
      const p = document.createElement('p');
      p.className = 'nuvem-sem-canvas raio-sem-dados';
      p.textContent = 'Não foi possível desenhar a nuvem eletrônica neste navegador. '
        + 'A distribuição em texto continua disponível no card de configuração eletrônica.';
      aviso.appendChild(p);
    }
    return;
  }
  ctx.clearRect(0,0,DIM,DIM);
  const bg = resolverCorCSS('--bg-card');
  ctx.fillStyle = bg;
  ctx.fillRect(0,0,DIM,DIM);
  const CX = DIM/2, CY = DIM/2;
  const MAX_R = DIM*0.46;
  const SHELL_SCALE = { s:1.0, p:0.78, d:0.6, f:0.45 };
  const N_DOTS = Math.min(12000, Math.max(2000, Z_num * 60));
  function hexToRgb(hex){
    if(!hex) return {r:0,g:229,b:255};
    const mRgb = hex.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if(mRgb) return {r:parseInt(mRgb[1]),g:parseInt(mRgb[2]),b:parseInt(mRgb[3])};
    const h = hex.replace('#','');
    if(h.length < 6) return {r:0,g:229,b:255};
    return {r:parseInt(h.slice(0,2),16), g:parseInt(h.slice(2,4),16), b:parseInt(h.slice(4,6),16)};
  }
  const toRender = orbital === 'all' ? orbitaisInfo : orbitaisInfo.filter(o=>o.sub===orbital);
  if(!toRender.length) return;
  const totalE = toRender.reduce((a,o)=>a+o.e,0);
  toRender.forEach(orb=>{
    const frac = orb.e / totalE;
    const nDots = Math.round(N_DOTS * frac);
    const nLevel = orb.n;
    const tipo   = orb.tipo;
    const scale  = SHELL_SCALE[tipo] || 1.0;
    const baseR  = MAX_R * (nLevel / 7) * scale;
    const spread = baseR * (0.35 + 0.15*(tipo==='s'?0:tipo==='p'?1:tipo==='d'?2:3));
    const {r:cr, g:cg, b:cb} = hexToRgb(orb.cor);
    for(let i=0; i<nDots; i++){
      let x, y, alpha;
      if(tipo === 's'){
        const u = Math.random();
        const r = baseR * Math.pow(u, 1/3) + (Math.random()-0.5)*spread*0.6;
        const theta = Math.random() * Math.PI * 2;
        x = CX + r * Math.cos(theta);
        y = CY + r * Math.sin(theta);
        alpha = 0.55 - (r/(baseR+spread))*0.4;
      } else if(tipo === 'p'){
        const lobe = Math.random() < 0.5 ? 1 : -1;
        const r = baseR * (0.5 + Math.random() * 0.9);
        const ang = (Math.random() - 0.5) * Math.PI * 0.7;
        x = CX + lobe * r * Math.cos(ang);
        y = CY + r * Math.sin(ang) * 0.5;
        alpha = 0.5 * (1 - Math.abs(ang) / (Math.PI*0.7)*0.5);
      } else if(tipo === 'd'){
        const lobe = Math.floor(Math.random()*4);
        const ang0 = lobe * Math.PI/2 + Math.PI/4;
        const r  = baseR * (0.3 + Math.random() * 0.85);
        const jitter = (Math.random()-0.5) * spread * 0.9;
        x = CX + (r + jitter) * Math.cos(ang0 + (Math.random()-0.5)*0.6);
        y = CY + (r + jitter) * Math.sin(ang0 + (Math.random()-0.5)*0.6);
        alpha = 0.4 + Math.random()*0.2;
      } else {
        const lobe = Math.floor(Math.random()*7);
        const ang0 = lobe * (Math.PI*2/7);
        const r  = baseR * (0.25 + Math.random() * 0.75);
        const jitter = (Math.random()-0.5) * spread * 1.1;
        x = CX + (r + jitter) * Math.cos(ang0 + (Math.random()-0.5)*0.4);
        y = CY + (r + jitter) * Math.sin(ang0 + (Math.random()-0.5)*0.4);
        alpha = 0.3 + Math.random()*0.25;
      }
      alpha = Math.max(0.05, Math.min(0.82, alpha));
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(2)})`;
      ctx.fill();
    }
  });
  const grd = ctx.createRadialGradient(CX,CY,1,CX,CY,14);
  const {r:nr,g:ng,b:nb} = hexToRgb(atomCor);
  grd.addColorStop(0, `rgba(${nr},${ng},${nb},0.95)`);
  grd.addColorStop(0.5,`rgba(${nr},${ng},${nb},0.5)`);
  grd.addColorStop(1,  `rgba(${nr},${ng},${nb},0)`);
  ctx.beginPath();
  ctx.arc(CX,CY,14,0,Math.PI*2);
  ctx.fillStyle = grd;
  ctx.fill();
}

