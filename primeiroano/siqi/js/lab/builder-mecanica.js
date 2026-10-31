/* ═══════════════════════════════════════════════════════════════
   CAMADA: LABORATÓRIO (mecânica principal)
   ARQUIVO: builder-mecanica.js
   ───────────────────────────────────────────────────────────────
   O núcleo do laboratório interativo: monta a bancada com os slots
   de reagentes (criarBuilder), os controles de cada reagente
   (spinner de coeficiente, bandeja de moléculas), coloca/remove uma
   molécula de um slot, e recalcula a estequiometria em tempo real
   (atualizarStoich — a função mais longa deste arquivo) conforme o
   aluno monta a equação.
   Depende de: lab/builder-estado.js, lab/parser-formula.js,
               lab/estado-fisico.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* Gera coeficiente aleatório 1-6 diferente do correto */
function coefAleatorio(correto){
  var ops = [1,2,3,4,5,6].filter(function(n){ return n !== (correto||1); });
  return ops[Math.floor(Math.random()*ops.length)];
}

function builderReset(exp){
  BUILDER.expId    = exp.id;
  BUILDER.slots    = new Array(exp.produtos_visuais.length).fill(null);
  BUILDER.selected = null;

  /* Coeficientes dos REAGENTES: valor aleatório ≠ correto */
  BUILDER.coefR = {};
  if(exp.coefR){
    Object.keys(exp.coefR).forEach(function(r){
      BUILDER.coefR[r] = coefAleatorio(exp.coefR[r]);
    });
  } else {
    exp.reagentes.forEach(function(r){ BUILDER.coefR[r] = coefAleatorio(1); });
  }

  /* Coeficientes dos PRODUTOS: sempre iniciam em 1 (aluno ajusta) */
  BUILDER.coefP = new Array(exp.produtos_visuais.length).fill(1);
}

/* ═══════════════════════════════════════════════════════════════
   CRIAÇÃO DO BUILDER
═══════════════════════════════════════════════════════════════ */
function criarBuilder(exp){
  builderReset(exp);

  var root=document.createElement('div');
  root.className='rxb-root'; root.id='rxb-root-'+exp.id;

  /* ── Zona da equação ───────────────────────────────────────── */
  var eqRow=document.createElement('div');
  eqRow.className='rxb-eq-row';

  /* Reagentes */
  exp.reagentes.forEach(function(r,i){
    if(i>0) eqRow.appendChild(rxbOp('+'));
    eqRow.appendChild(rxbReagente(r, exp));
  });

  /* Seta */
  var seta=document.createElement('div');
  seta.className='rxb-seta';
  seta.innerHTML='<span class="rxb-seta-arrow">⟶</span>'+
    (exp.condicao?'<span class="rxb-seta-cond">'+exp.condicao+'</span>':'');
  eqRow.appendChild(seta);

  /* Slots de produto */
  var slotsWrap=document.createElement('div');
  slotsWrap.className='rxb-slots-wrap'; slotsWrap.id='rxb-slots-'+exp.id;
  BUILDER.slots.forEach(function(_,idx){
    if(idx>0) slotsWrap.appendChild(rxbOp('+'));
    slotsWrap.appendChild(rxbSlot(exp,idx));
  });
  eqRow.appendChild(slotsWrap);
  root.appendChild(eqRow);

  /* ── Tray ──────────────────────────────────────────────────── */
  var trayLabel=document.createElement('div');
  trayLabel.className='rxb-tray-label';
  trayLabel.innerHTML='<span style="color:var(--tx3);">Candidatos</span>'
    + '<span style="color:var(--bdr2);margin:0 .4rem;">—</span>'
    + '<span style="color:var(--tx3);font-size:.58rem;">arraste ou clique para o slot ↑</span>';
  root.appendChild(trayLabel);

  var tray=document.createElement('div');
  tray.className='rxb-tray'; tray.id='rxb-tray-'+exp.id;
  /* Candidatos: do experimento (inclui distratores) ou fallback */
  var candidatosList = exp.candidatos || CANDIDATOS[exp.id] || exp.produtos_visuais;
  candidatosList.forEach(function(f){
    tray.appendChild(rxbTrayMol(f,exp));
  });
  root.appendChild(tray);

  /* ── Painel estequiométrico ────────────────────────────────── */
  var stoich=document.createElement('div');
  stoich.className='rxb-stoich'; stoich.id='rxb-stoich-'+exp.id;
  stoich.innerHTML='<span class="rxb-stoich-hint">Preencha os slots de produto ↑</span>';
  root.appendChild(stoich);

  /* ── Botão verificar ────────────────────────────────────────── */
  var footer=document.createElement('div');
  footer.className='rxb-footer';
  var btnCheck=document.createElement('button');
  btnCheck.className='rxb-btn-check'; btnCheck.id='rxb-btn-check-'+exp.id;
  btnCheck.textContent='Verificar reação ↗';
  btnCheck.addEventListener('click',function(){ verificarBuilder(exp); });
  footer.appendChild(btnCheck);
  root.appendChild(footer);

  return root;
}

/* ── Reagente com spinner ───────────────────────────────────── */
function rxbReagente(r, exp){
  var wrap=document.createElement('div');
  wrap.className='rxb-reagente';

  var bubble=document.createElement('div');
  bubble.className='rxb-mol rxb-mol-reagente';
  var efr=estadoFisico(r);
  bubble.innerHTML='<div class="rxb-mol-formula">'+r+'<span class="rxb-mol-estado">'+efr+'</span></div>'+
    '<div class="rxb-mol-nome">'+(nomeMol(r)||'')+'</div>';

  var coefInicial = BUILDER.coefR[r] || 1;
  var sp=rxbSpinner(coefInicial,function(v){
    BUILDER.coefR[r]=v; atualizarStoich(exp);
  });

  wrap.appendChild(sp);
  wrap.appendChild(bubble);
  return wrap;
}

/* ── Slot de produto ─────────────────────────────────────────── */
function rxbSlot(exp, idx){
  var slot=document.createElement('div');
  slot.className='rxb-slot rxb-slot-empty';
  slot.id='rxb-slot-'+exp.id+'-'+idx;
  slot.dataset.idx=idx;

  var ph=document.createElement('div');
  ph.className='rxb-slot-ph';
  ph.innerHTML='<span class="rxb-slot-ph-icon">＋</span><span class="rxb-slot-ph-txt">produto '+(idx+1)+'</span>';
  slot.appendChild(ph);

  function bindSlot(){
    slot.addEventListener('dragover',function(e){
      e.preventDefault(); slot.classList.add('rxb-drag-over');
    });
    slot.addEventListener('dragleave',function(){
      slot.classList.remove('rxb-drag-over');
    });
    slot.addEventListener('drop',function(e){
      e.preventDefault(); slot.classList.remove('rxb-drag-over');
      var f=e.dataTransfer.getData('text/plain');
      if(f) colocarNoSlot(f,idx,exp);
    });
    slot.addEventListener('click',function(){
      if(BUILDER.selected){
        colocarNoSlot(BUILDER.selected,idx,exp);
        deselecionarTray(exp.id);
      }
    });
  }
  bindSlot();
  return slot;
}

/* ── Molécula no tray ───────────────────────────────────────── */
function rxbTrayMol(f, exp){
  var el=document.createElement('div');
  el.className='rxb-tray-mol';
  el.id='rxb-tray-mol-'+exp.id+'-'+sanitizeId(f);
  el.draggable=true;
  el.dataset.formula=f;
  var ef=estadoFisico(f);
  el.innerHTML='<div class="rxb-mol-formula">'+f+'<span class="rxb-mol-estado">'+ef+'</span></div>'+
    '<div class="rxb-mol-nome">'+(nomeMol(f)||'')+'</div>';

  el.addEventListener('dragstart',function(e){
    e.dataTransfer.setData('text/plain',f);
    el.classList.add('rxb-dragging');
  });
  el.addEventListener('dragend',function(){
    el.classList.remove('rxb-dragging');
  });
  el.addEventListener('click',function(){
    var jaSelected=el.classList.contains('rxb-selected');
    deselecionarTray(exp.id);
    if(!jaSelected){
      el.classList.add('rxb-selected');
      BUILDER.selected=f;
    }
  });
  return el;
}

/* ── Spinner genérico (−/valor/+) ───────────────────────────── */
function rxbSpinner(init, onChange){
  var val=init;
  var wrap=document.createElement('div');
  wrap.className='rxb-coef-wrap';

  var bm=document.createElement('button');
  bm.className='rxb-coef-btn'; bm.textContent='−'; bm.type='button';
  var cv=document.createElement('span');
  cv.className='rxb-coef-val'; cv.textContent=String(val);
  var bp=document.createElement('button');
  bp.className='rxb-coef-btn'; bp.textContent='+'; bp.type='button';

  bm.addEventListener('click',function(e){
    e.stopPropagation();
    if(val>1){ val--; cv.textContent=val; onChange(val); }
  });
  bp.addEventListener('click',function(e){
    e.stopPropagation();
    if(val<9){ val++; cv.textContent=val; onChange(val); }
  });

  wrap.appendChild(bm); wrap.appendChild(cv); wrap.appendChild(bp);
  /* expõe getter/setter para leitura externa */
  wrap._getVal=function(){ return val; };
  wrap._setVal=function(v){ val=v; cv.textContent=v; };
  return wrap;
}

/* ── Colocar no slot ─────────────────────────────────────────── */
function colocarNoSlot(f, idx, exp){
  BUILDER.slots[idx]=f;
  BUILDER.coefP[idx]=1;

  var slot=document.getElementById('rxb-slot-'+exp.id+'-'+idx);
  if(!slot) return;

  slot.className='rxb-slot rxb-slot-filled';
  slot.innerHTML='';

  /* Spinner do produto */
  var sp=rxbSpinner(1,function(v){
    BUILDER.coefP[idx]=v;
    atualizarStoich(exp);
  });
  sp.className+=' rxb-coef-slot';

  /* Molécula */
  var molDiv=document.createElement('div');
  molDiv.className='rxb-slot-mol';
  var efs=estadoFisico(f);
  molDiv.innerHTML='<div class="rxb-mol-formula">'+f+'<span class="rxb-mol-estado">'+efs+'</span></div>'+
    '<div class="rxb-mol-nome">'+(nomeMol(f)||'')+'</div>';

  /* Botão remover */
  var btnRem=document.createElement('button');
  btnRem.type='button'; btnRem.className='rxb-slot-remove';
  btnRem.innerHTML='&times;'; btnRem.title='Remover';
  btnRem.addEventListener('click',function(e){
    e.stopPropagation();
    removerDoSlot(idx,exp);
  });

  slot.appendChild(sp);
  slot.appendChild(molDiv);
  slot.appendChild(btnRem);

  atualizarStoich(exp);
}

/* ── Remover do slot ─────────────────────────────────────────── */
function removerDoSlot(idx, exp){
  BUILDER.slots[idx]=null;
  BUILDER.coefP[idx]=1;

  var slot=document.getElementById('rxb-slot-'+exp.id+'-'+idx);
  if(!slot) return;

  slot.className='rxb-slot rxb-slot-empty';
  slot.innerHTML='';
  var ph=document.createElement('div');
  ph.className='rxb-slot-ph';
  ph.innerHTML='<span class="rxb-slot-ph-icon">＋</span><span class="rxb-slot-ph-txt">produto '+(idx+1)+'</span>';
  slot.appendChild(ph);

  slot.addEventListener('dragover',function(e){ e.preventDefault(); slot.classList.add('rxb-drag-over'); });
  slot.addEventListener('dragleave',function(){ slot.classList.remove('rxb-drag-over'); });
  slot.addEventListener('drop',function(e){
    e.preventDefault(); slot.classList.remove('rxb-drag-over');
    var f=e.dataTransfer.getData('text/plain');
    if(f) colocarNoSlot(f,idx,exp);
  });
  slot.addEventListener('click',function(){
    if(BUILDER.selected){ colocarNoSlot(BUILDER.selected,idx,exp); deselecionarTray(exp.id); }
  });

  atualizarStoich(exp);
}

/* ── Desselecionar tray ──────────────────────────────────────── */
function deselecionarTray(expId){
  var tray=document.getElementById('rxb-tray-'+expId);
  if(tray) tray.querySelectorAll('.rxb-tray-mol').forEach(function(m){
    m.classList.remove('rxb-selected');
  });
  BUILDER.selected=null;
}

/* ── Estequiometria ──────────────────────────────────────────── */
function atualizarStoich(exp){

  /* ── Painel central: equação em andamento ── */
  var stoich = document.getElementById('rxb-stoich-'+exp.id);
  if(stoich){
    var todosOkLocal = BUILDER.slots.every(function(s){ return s!==null; });
    if(!todosOkLocal){
      stoich.innerHTML = '<span class="rxb-stoich-hint">Preencha os slots de produto ↑</span>';
    } else {
      var esqTxt = exp.reagentes.map(function(r){
        var c = BUILDER.coefR[r]||1;
        return (c>1 ? '<span class="rxb-stoich-coef">'+c+'</span> ' : '') + r;
      }).join(' + ');
      var dirTxt = BUILDER.slots.map(function(p,i){
        var c = BUILDER.coefP[i]||1;
        return (c>1 ? '<span class="rxb-stoich-coef">'+c+'</span> ' : '') + p;
      }).join(' + ');
      stoich.innerHTML =
        '<div class="rxb-stoich-eq">' +
          '<span class="rxb-stoich-mol">'+esqTxt+'</span>' +
          '<span class="rxb-stoich-arrow"> ⟶ </span>' +
          '<span class="rxb-stoich-mol">'+dirTxt+'</span>' +
        '</div>';
    }
  }

  /* ── Sidebar direita: painel analítico ── */
  var balEq   = document.getElementById('bal-equacao');
  var balGrid = document.getElementById('bal-grid');
  if(!balEq && !balGrid) return;

  var todosOk = BUILDER.slots.every(function(s){ return s!==null; });

  if(!todosOk){
    if(balEq)   balEq.innerHTML   = '<span class="bal-status-idle">⏳ Aguardando produtos…</span>';
    if(balGrid) balGrid.innerHTML = '<p class="bal-hint">Arraste compostos para os slots de produto para ver a análise em tempo real.</p>';
    return;
  }

  /* ── Contar átomos ── */
  var esqAt = somarAtomos(exp.reagentes.map(function(r){
    return escalarAtomos(parsearFormula(r), BUILDER.coefR[r]||1);
  }));
  var dirAt = somarAtomos(BUILDER.slots.map(function(p,i){
    return escalarAtomos(parsearFormula(p||''), BUILDER.coefP[i]||1);
  }));

  var els = {};
  Object.keys(esqAt).forEach(function(e){ els[e]=1; });
  Object.keys(dirAt).forEach(function(e){ els[e]=1; });
  var todosEls = Object.keys(els).sort();

  var okCount = todosEls.filter(function(el){
    return (esqAt[el]||0) === (dirAt[el]||0);
  }).length;
  var totalOk = okCount === todosEls.length;
  var pct = todosEls.length ? Math.round((okCount/todosEls.length)*100) : 0;

  /* ── Equação + barra de progresso global ── */
  if(balEq){
    var esqS = exp.reagentes.map(function(r){
      var c = BUILDER.coefR[r]||1; return (c>1?c+' ':'')+r;
    }).join(' + ');
    var dirS = BUILDER.slots.map(function(p,i){
      var c = BUILDER.coefP[i]||1; return (c>1?c+' ':'')+p;
    }).join(' + ');
    var barColor = totalOk ? 'var(--green)' : (pct>=50 ? 'var(--amber)' : 'var(--red,#f55)');
    balEq.innerHTML =
      '<div class="bal-eq-line">'+esqS+' ⟶ '+dirS+'</div>' +
      '<div class="bal-progress-wrap">' +
        '<div class="bal-progress-bar" style="width:'+pct+'%;background:'+barColor+';"></div>' +
      '</div>' +
      '<div class="bal-status-row">' +
        '<span class="'+(totalOk?'bal-status-ok':'bal-status-err')+'">' +
          (totalOk ? '<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> Perfeitamente balanceado' : '<svg class="icon" aria-hidden="true"><use href="#ic-close"/></svg> '+okCount+'/'+todosEls.length+' elementos OK') +
        '</span>' +
        '<span class="bal-pct">'+(totalOk?'100':pct)+'%</span>' +
      '</div>';
  }

  /* ── Grid analítico por elemento ── */
  if(balGrid){
    balGrid.innerHTML = todosEls.map(function(el){
      var esq = esqAt[el]||0;
      var dir = dirAt[el]||0;
      var ok  = esq===dir;
      var max = Math.max(esq, dir, 1);
      var barEsqW = Math.round((esq/max)*100);
      var barDirW = Math.round((dir/max)*100);
      var diff = dir - esq;
      var rowCls = ok ? 'bal-row bal-row-ok' : (dir>esq ? 'bal-row bal-row-over' : 'bal-row bal-row-under');
      var badge = ok
        ? '<span class="bal-badge bal-badge-ok"><svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg></span>'
        : (diff>0
            ? '<span class="bal-badge bal-badge-over">+'+diff+'</span>'
            : '<span class="bal-badge bal-badge-under">'+diff+'</span>');

      return '<div class="'+rowCls+'">' +
        '<div class="bal-row-hd">' +
          '<span class="bal-el">'+el+'</span>' +
          '<div class="bal-counts">' +
            '<span class="bal-count bal-count-esq" title="Reagentes">'+esq+'</span>' +
            '<span class="bal-count-sep">⟶</span>' +
            '<span class="bal-count bal-count-dir'+(ok?' bal-count-ok':(dir>esq?' bal-count-over':' bal-count-under'))+'" title="Produtos">'+dir+'</span>' +
          '</div>' +
          badge +
        '</div>' +
        '<div class="bal-bars">' +
          '<div class="bal-bar-track" title="Reagentes: '+esq+'">' +
            '<div class="bal-bar-fill bal-bar-esq" style="width:'+barEsqW+'%"></div>' +
          '</div>' +
          '<div class="bal-bar-track" title="Produtos: '+dir+'">' +
            '<div class="bal-bar-fill '+(ok?'bal-bar-ok':(dir>esq?'bal-bar-over':'bal-bar-under'))+'" style="width:'+barDirW+'%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="bal-row-labels">' +
          '<span class="bal-lbl">Reagentes</span>' +
          '<span class="bal-lbl">Produtos</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }
}

function escalarAtomos(atoms, coef){
  var r={};
  Object.keys(atoms).forEach(function(el){ r[el]=atoms[el]*coef; });
  return r;
}

function somarAtomos(lista){
  var t={};
  lista.forEach(function(a){ Object.keys(a).forEach(function(el){ t[el]=(t[el]||0)+a[el]; }); });
  return t;
}

