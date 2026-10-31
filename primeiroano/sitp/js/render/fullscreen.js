/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO
   ARQUIVO: fullscreen.js
   ───────────────────────────────────────────────────────────────
   Abre qualquer uma das vistas (Bohr, Lewis, nuvem, raio) em tela
   cheia, recalculando a escala de desenho para ocupar o espaço
   disponível da melhor forma.
   Depende de: render/fullscreen-consts-estado.js,
               render/bohr.js, render/lewis.js,
               render/nuvem-eletronica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* A segunda passada de ajuste (_fsCaberNaTela) foi removida: ela media o
   transbordo e encolhia a escala do SVG para caber. Nao faz mais sentido —
   o tamanho passou a ser definido pela caixa do CSS, que cabe por
   construcao, e a funcao ficava reduzindo a escala em vao, deixando o
   desenho cada vez menor sem resolver nada. */
/* silencioso=true é usado pelo recálculo de resize/rotação: refaz o
   desenho sem reanunciar no leitor de tela nem mexer no foco, que
   seria intrusivo a cada arraste da janela. */
function abrirFullscreen(vista, Z, silencioso){
  _fsZ = Z; _fsVista = vista;
  const ov    = document.getElementById('fullscreen-overlay');
  const body  = document.getElementById('fullscreen-body');
  const title = document.getElementById('fullscreen-title');
  if(!ov || !body) return;
  const titulos = {grade:'Grade de Raios Atômicos', bohr:'Diagrama de Bohr', lewis:'Diagrama de Lewis', nuvem:'Nuvem Eletrônica de Probabilidade'};
  title.textContent = titulos[vista] || vista;
  const srcPainel = document.getElementById('raio-painel-'+vista+'-'+Z);
  if(!srcPainel) return;
  const atomCor  = srcPainel.dataset.cor  || '#00e5ff';
  const atomGlow = srcPainel.dataset.glow || 'rgba(0,229,255,0.5)';
  const elData   = JSON.parse(srcPainel.dataset.el || '{}');
  const Z_num    = parseInt(srcPainel.dataset.z) || Z;
  const sub      = ultimoSubnivel(Z_num);
  const allEls   = [...elementosBase, ...lantanideos, ...actinideos];
  const el       = allEls.find(e=>e.numero===Z_num) || elData;
  const VH = window.innerHeight - 52;
  const VW = window.innerWidth;
  body.innerHTML = '';
  if(vista === 'grade'){
    const { mesmoPer, mesmoGrp } = vizinhosRaio(Z_num, el, allEls);
    /* A grade usava (r/260)*110, SEM o piso de 14px que a versão dentro
       do modal tem. Resultado: o hidrogênio (31 pm) saía com 13px em
       tela cheia contra 19px no modal — MENOR ao expandir. Agora usa a
       mesma fórmula da versão embutida, multiplicada por um fator de
       ampliação calculado a partir do espaço real disponível.
       O fator considera a maior das duas fileiras (período e grupo),
       porque é ela que define a largura necessária. */
    const nMaior     = Math.max(mesmoPer.length, mesmoGrp.length) + 1;
    const larguraNec = nMaior * (60 + 14);        // esfera máxima + gap
    const alturaNec  = 2 * (60 + 58);             // duas fileiras + rótulos
    const escalaGrade = Math.min(
      (VW * FS_MARGEM_W) / larguraNec,
      (VH * FS_MARGEM_H) / alturaNec,
      FS_ESCALA_MAX
    );
    const esfera = (e, isA) => {
      const r = RAIO[e.numero]; if(!r) return '';
      const cE = corBlocoDe(e.numero, getCatColorHex(e.cat));
      const h6 = cE.replace('#','');
      const gE = h6.length>=6?`rgba(${parseInt(h6.slice(0,2),16)},${parseInt(h6.slice(2,4),16)},${parseInt(h6.slice(4,6),16)},0.4)`:'rgba(136,136,136,0.4)';
      const d  = Math.round((14 + (r.r/RAIO_MAX_PM)*46) * escalaGrade);
      const bd = isA?`outline:3px solid var(--accent);outline-offset:3px;`:'';
      return `<div class="raio-grade-item fs-grade-item"><div class="raio-grade-esfera" style="width:${d}px;height:${d}px;--esfera-cor:${cE};--esfera-glow:${gE};${bd}" aria-label="${e.nome}: ${r.r} pm"></div><span class="raio-grade-sim fs-grade-sim" style="color:${isA?'var(--accent)':'var(--text-dim)'}">${e.simbolo}</span><span class="raio-grade-val fs-grade-val">${r.r} pm</span></div>`;
    };
    const blocoFs = (lista, atual, titulo, seta) => {
      if(!lista.length) return '';
      const todos = [...lista, atual].sort((a,b)=>a.grupo-b.grupo||((a.periodo||0)-(b.periodo||0)));
      return `<div class="raio-grade-wrap visivel fs-grade-wrap"><span class="raio-grade-titulo fs-grade-titulo">${titulo}</span><div class="raio-grade fs-grade">${todos.map(e=>esfera(e,e.numero===Z_num)).join('')}</div><div class="raio-grade-setas">${seta}</div></div>`;
    };
    const gPer = blocoFs(mesmoPer, el, `Período ${(el.periodo||0)<=7?el.periodo:(el.cat==='Lantanídeo'?6:7)} — raio diminui →`, '← raio maior &nbsp;&nbsp;&nbsp; raio menor →');
    const gGrp = blocoFs(mesmoGrp, el, `Grupo ${el.grupo} — raio aumenta ↓`, '↑ raio menor &nbsp;&nbsp;&nbsp; raio maior ↓');
    body.innerHTML = `<div class="fs-grade-container">${gPer}${gGrp}</div>`;
  } else if(vista === 'bohr'){
    /* ESCALA FIXA — e nao calculada da viewport.
       O SVG e vetorial e tem viewBox: quem decide o tamanho na tela e a
       CAIXA definida no CSS, e o preserveAspectRatio padrao ajusta o
       desenho dentro dela. Calcular a escala aqui era redundante e
       prejudicial: mudava a PROPORCAO do viewBox conforme a janela (as
       constantes +16 e +100 nao escalam junto), entao o desenho tinha
       proporcoes diferentes em cada tela. Com escala fixa, tela cheia e
       modal mostram exatamente o mesmo desenho, so em tamanhos
       diferentes — e o CSS faz o resto.
       Nao ha mais _fsCaberNaTela aqui: a caixa do CSS ja cabe por
       construcao, e a segunda passada estava encolhendo a escala em vao. */
    const wrap = document.createElement('div');
    wrap.className = 'fs-bohr-wrap';
    wrap.innerHTML = renderBohr(Z_num, el, sub, atomCor, atomGlow, FS_ESCALA_DESENHO);
    body.appendChild(wrap);
  } else if(vista === 'lewis'){
    // mesma razao do Bohr: escala fixa, tamanho definido pelo CSS
    const wrap = document.createElement('div');
    wrap.className = 'fs-lewis-wrap';
    wrap.innerHTML = renderLewis(Z_num, el, sub, atomCor, atomGlow, FS_ESCALA_DESENHO);
    body.appendChild(wrap);
  } else if(vista === 'nuvem'){
    const orbitaisData = srcPainel.dataset.orbitais || '[]';
    const nuvemHTML = renderNuvem(Z_num, el, sub, atomCor, atomGlow);
    body.innerHTML = `<div class="fs-nuvem-wrap">${nuvemHTML}</div>`;
    const canvas = body.querySelector('canvas');
    const sel    = body.querySelector('.nuvem-select');
    if(canvas){
      canvas.dataset.z        = Z_num;
      canvas.dataset.orbitais = orbitaisData;
      canvas.dataset.cor      = atomCor;
      canvas.dataset.glow     = atomGlow;
      canvas.classList.add('fs-nuvem-canvas');
    }
    if(sel) sel.onchange = ()=>{ if(canvas){ _nuvemDrawOnCanvas(canvas, sel.value); nuvemLegenda(body, canvas, sel.value); } };
    setTimeout(()=>{
      if(canvas){ _nuvemDrawOnCanvas(canvas, 'all'); nuvemLegenda(body, canvas, 'all'); }
    }, 50);
  }
  ov.classList.add('aberto');
  ov.setAttribute('aria-hidden','false');
  if(!silencioso){
    document.getElementById('btnFullscreenClose').focus();
    anunciar(`${titulos[vista]||vista} expandido para tela cheia.`);
  }
}

