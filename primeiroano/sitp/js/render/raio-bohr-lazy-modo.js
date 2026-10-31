/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO
   ARQUIVO: raio-bohr-lazy-modo.js
   ───────────────────────────────────────────────────────────────
   Renderização "preguiçosa" da seção de raio atômico (só desenha
   quando o card fica visível, evitando trabalho para nada), a troca
   entre as vistas comparativas de raio, e a troca de modo do
   diagrama de Bohr (camadas vs. subcamadas).
   Depende de: render/raio-e-propriedades-modal.js, render/bohr.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function raioLazyRender(vista, Z){
  const painel = document.getElementById('raio-painel-'+vista+'-'+Z);
  if(!painel || painel.dataset.rendered) return;
  painel.dataset.rendered = '1';
  const atomCor  = painel.dataset.cor  || '#00e5ff';
  const atomGlow = painel.dataset.glow || 'rgba(0,229,255,0.5)';
  const elData   = JSON.parse(painel.dataset.el || '{}');
  const Z_num    = parseInt(painel.dataset.z) || Z;
  const sub      = ultimoSubnivel(Z_num);
  const allEls = [...elementosBase, ...lantanideos, ...actinideos];
  const el     = allEls.find(e=>e.numero===Z_num) || elData;
  const fsBar = `<div class="painel-fullscreen-bar">
    <button class="painel-fullscreen-btn" aria-label="Expandir para tela cheia"
            onclick="abrirFullscreen('${vista}','${Z}')">${ICO.telacheia} Tela cheia</button>
  </div>`;
  if(vista === 'grade'){
    const dados      = RAIO[Z_num];
    const allEls2    = [...elementosBase, ...lantanideos, ...actinideos];
    const { mesmoPer, mesmoGrp } = vizinhosRaio(Z_num, el, allEls2);
    const esferaGrade = (e, isAtual) => {
      const r = RAIO[e.numero];
      if(!r) return '';
      const corE  = corBlocoDe(e.numero, getCatColorHex(e.cat));
      const h6    = corE.replace('#','');
      const glowE = h6.length>=6
        ? `rgba(${parseInt(h6.slice(0,2),16)},${parseInt(h6.slice(2,4),16)},${parseInt(h6.slice(4,6),16)},0.4)`
        : 'rgba(136,136,136,0.4)';
      const d     = Math.round(14+(r.r/RAIO_MAX_PM)*46);
      const bord  = isAtual ? `outline:2px solid var(--accent);outline-offset:2px;` : '';
      return `<div class="raio-grade-item">
        <div class="raio-grade-esfera" style="width:${d}px;height:${d}px;--esfera-cor:${corE};--esfera-glow:${glowE};${bord}"
             aria-label="${e.nome}: ${r.r} pm"></div>
        <span class="raio-grade-sim" style="color:${isAtual?'var(--accent)':'var(--text-dim)'}">${e.simbolo}</span>
        <span class="raio-grade-val">${r.r} pm</span>
      </div>`;
    };
    const blocoGrade = (lista, atual, titulo, seta) => {
      if(!lista.length) return '';
      const todos = [...lista, atual].sort((a,b)=>a.grupo-b.grupo||((a.periodo||0)-(b.periodo||0)));
      const items = todos.map(e=>esferaGrade(e, e.numero===Z_num)).join('');
      return `<div class="raio-grade-wrap visivel">
        <span class="raio-grade-titulo">${titulo}</span>
        <div class="raio-grade">${items}</div>
        <div class="raio-grade-setas"><span>${seta}</span></div>
      </div>`;
    };
    const gradePer = blocoGrade(mesmoPer, el, `Período ${(el.periodo||0)<=7?el.periodo:(el.cat==='Lantanídeo'?6:7)} — raio diminui →`, '← raio maior &nbsp;&nbsp;&nbsp; raio menor →');
    const gradeGrp = blocoGrade(mesmoGrp, el, `Grupo ${el.grupo} — raio aumenta ↓`, '↑ raio menor &nbsp;&nbsp;&nbsp; raio maior ↓');
    painel.innerHTML = fsBar + `<div id="raio-grade-container-${Z_num}">${gradePer}${gradeGrp}</div>`;
  } else if(vista === 'bohr'){
    painel.innerHTML = fsBar + renderBohr(Z_num, el, sub, atomCor, atomGlow);
  } else if(vista === 'lewis'){
    painel.innerHTML = fsBar + renderLewis(Z_num, el, sub, atomCor, atomGlow);
  } else if(vista === 'nuvem'){
    painel.innerHTML = fsBar + renderNuvem(Z_num, el, sub, atomCor, atomGlow);
    setTimeout(()=>{ nuvemIniciarCanvas(Z_num); }, 30);
  }
}

function raioVista(vista, Z, btnEl){
  const ids    = ['dados','grade','bohr','lewis','nuvem'];
  const paineis = ids.map(id => document.getElementById('raio-painel-'+id+'-'+Z));
  const btns    = ids.map(id => document.getElementById('rbtn-'+id+'-'+Z));
  ids.forEach((id, i) => {
    const active = id === vista;
    if(paineis[i]) paineis[i].style.display = active ? '' : 'none';
    if(btns[i]){
      btns[i].classList.toggle('ativo', active);
      btns[i].setAttribute('aria-pressed', String(active));
    }
  });
  if(vista !== 'dados'){
    raioLazyRender(vista, Z);
  }
}

function bohrModo(modo, Z){
  const svgVal  = document.getElementById('bohr-svg-val-'+Z);
  const svgAll  = document.getElementById('bohr-svg-all-'+Z);
  const btnVal  = document.getElementById('bohr-btn-val-'+Z);
  const btnAll  = document.getElementById('bohr-btn-all-'+Z);
  if(!svgVal || !svgAll) return;
  const isVal = modo === 'val';
  svgVal.style.display  = isVal ? '' : 'none';
  svgAll.style.display  = isVal ? 'none' : '';
  btnVal.classList.toggle('ativo', isVal);
  btnVal.setAttribute('aria-pressed', String(isVal));
  btnAll.classList.toggle('ativo', !isVal);
  btnAll.setAttribute('aria-pressed', String(!isVal));
}

