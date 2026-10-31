/* ═══════════════════════════════════════════════════════════════
   CAMADA: LABORATÓRIO (verificação)
   ARQUIVO: builder-verificacao.js
   ───────────────────────────────────────────────────────────────
   Verifica se a montagem do aluno está quimicamente correta
   (verificarBuilder), revela os produtos da reação com efeito visual
   de partículas, e o botão "Reiniciar" que limpa a bancada.
   Depende de: lab/builder-mecanica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Verificar ───────────────────────────────────────────────── */
function verificarBuilder(exp){
  if(!BUILDER.slots.every(function(s){ return s!==null; })){
    shake('rxb-root-'+exp.id);
    showToast('err','Preencha todos os slots primeiro.');
    return;
  }

  /* Verificar se os produtos estão corretos (sem importar ordem) */
  /* Usar gabarito.produtos (textos normalizados) OU produtos_visuais (fórmulas) */
  var gabProdutos = (exp.gabarito && exp.gabarito.produtos) ? exp.gabarito.produtos : [];
  var corretos = exp.produtos_visuais.every(function(pC){
    var normC = normFormula(pC).toLowerCase().replace(/[^a-z0-9]/g,'');
    return BUILDER.slots.some(function(pS){
      if(!pS) return false;
      var normS = normFormula(pS).toLowerCase().replace(/[^a-z0-9]/g,'');
      /* Verificar por fórmula */
      if(normS === normC) return true;
      /* Verificar por nome no gabarito */
      return gabProdutos.some(function(gp){
        return normTxt(pS).includes(normTxt(gp)) || normTxt(gp).includes(normTxt(pS));
      });
    });
  });

  /* Verificar balanceamento usando parser universal */
  var esqAt=somarAtomos(exp.reagentes.map(function(r){
    return escalarAtomos(parsearFormula(r), BUILDER.coefR[r]||1);
  }));
  var dirAt=somarAtomos(BUILDER.slots.map(function(p,i){
    return escalarAtomos(parsearFormula(p||''), BUILDER.coefP[i]||1);
  }));
  var els={}; Object.keys(esqAt).forEach(function(e){els[e]=1;});
  Object.keys(dirAt).forEach(function(e){els[e]=1;});
  var balanceado=Object.keys(els).every(function(el){
    return (esqAt[el]||0)===(dirAt[el]||0);
  });

  if(corretos && balanceado){
    /* ✓ Tudo certo */
    BUILDER.slots.forEach(function(_,i){
      var sl=document.getElementById('rxb-slot-'+exp.id+'-'+i);
      if(sl) sl.classList.add('rxb-slot-correct');
    });
    var root=document.getElementById('rxb-root-'+exp.id);
    if(root) root.classList.add('rxb-acertou');
    var btn=document.getElementById('rxb-btn-check-'+exp.id);
    if(btn){ btn.disabled=true; btn.innerHTML='<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> Correto!'; }
    setTimeout(acertou,500);

  } else if(corretos && !balanceado){
    shake('rxb-root-'+exp.id);
    showToast('hint','Produtos corretos — ajuste os coeficientes até o painel ficar todo verde.');

  } else {
    shake('rxb-root-'+exp.id);
    /* Marcar slots errados brevemente */
    BUILDER.slots.forEach(function(p,i){
      if(!p) return;
      var ok=exp.produtos_visuais.some(function(pC){
        return normFormula(p)===normFormula(pC);
      });
      var sl=document.getElementById('rxb-slot-'+exp.id+'-'+i);
      if(sl){ sl.classList.add('rxb-slot-wrong'); setTimeout(function(){ sl.classList.remove('rxb-slot-wrong'); },700); }
    });
    var hint=exp.hints[Math.min(STATE.hintIdx,exp.hints.length-1)];
    showToast('err', hint);
    STATE.hintIdx=Math.min(STATE.hintIdx+1,exp.hints.length-1);
  }
}

/* ── Tela de acerto — grande, substitui o builder ───────────── */
function revelarProdutos(expId){
  var exp=EXPERIMENTOS.filter(function(e){ return e.id===expId; })[0];
  if(!exp) return;
  var rxnWrap=document.getElementById('rxn-wrapper');
  if(!rxnWrap) return;

  /* Construir equação colorida: reagentes (cinza) → seta (coral) → produtos (verde) */
  var eq = exp.gabarito.equacaoBalanceada;
  var partes = eq.split(/→|⟶/);
  var esqHtml = '<span class="rxb-eq-reagente">'+(partes[0]||'').trim()+'</span>';
  var dirHtml  = '<span class="rxb-eq-produto">'+ (partes[1]||'').trim()+'</span>';
  var eqHtml   = esqHtml+'<span class="rxb-eq-seta">→</span>'+dirHtml;

  var screen=document.createElement('div');
  screen.className='rxb-acerto-screen';
  screen.id='rxb-acerto-'+expId;
  screen.innerHTML=
    '<div class="rxb-acerto-icon"><svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg></div>'+
    '<div class="rxb-acerto-eq-wrap">'+
      '<div class="rxb-acerto-label">Equação Balanceada</div>'+
      '<div class="rxb-acerto-eq">'+eqHtml+'</div>'+
    '</div>'+
    '<div class="rxb-acerto-mecanismo">'+escapeHtml(exp.explicacao)+'</div>'+
    '<div class="rxb-acerto-actions">' +
      '<button class="rxb-acerto-btn-next" onclick="' +
        'var f=(STATE.expAtual&&STATE.expAtual._formulaId)||STATE.compostoAtual;' +
        'var c=COMPOSTOS[f];if(c)abrirReacoesLivres(f,c);else mostrarBoasVindas()' +
      '">← Explorar mais reações</button>' +
    '</div>';

  rxnWrap.innerHTML='';
  rxnWrap.appendChild(screen);

  /* Partículas de confetti */
  lancarParticulas(rxnWrap);
}

function escapeHtml(t){
  return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function lancarParticulas(container){
  var cores=['#FF6B47','#4ADE80','#FFAA44','#00C8FF','#A78BFA'];
  for(var i=0;i<18;i++){
    (function(i){
      setTimeout(function(){
        var p=document.createElement('div');
        p.className='rxb-particle';
        p.style.cssText='left:'+(15+Math.random()*70)+'%;top:'+(60+Math.random()*20)+'%;'+
          'background:'+cores[i%cores.length]+';'+
          'animation-delay:'+Math.random()*.3+'s;'+
          'animation-duration:'+(0.6+Math.random()*.5)+'s;';
        container.appendChild(p);
        setTimeout(function(){ if(p.parentNode) p.parentNode.removeChild(p); }, 1200);
      }, i*50);
    })(i);
  }
}

/* iniciarExp removida — laboratório em modo livre */

/* ── Utilitários ────────────────────────────────────────────── */
function shake(id){
  var el=document.getElementById(id); if(!el) return;
  el.classList.add('rxb-shake');
  setTimeout(function(){ el.classList.remove('rxb-shake'); },500);
}

function sanitizeId(s){ return s.replace(/[^a-zA-Z0-9]/g,'_'); }

function rxbOp(char){
  var s=document.createElement('span');
  s.className='rxb-op'; s.textContent=char; return s;
}

/* enviarResposta/analisarResposta removidos — builder é o único canal de input */

/* ── Acertou ───────────────────────────────────────────────── */
function acertou(){
  var exp=STATE.expAtual; if(!exp) return;
  STATE.aguardandoResposta=false;
  if(STATE.expConcluidos.indexOf(exp.id)===-1) STATE.expConcluidos.push(exp.id);

  /* partículas integradas na tela de acerto */

  revelarProdutos(exp.id);
  /* Toast 1 linha com o mecanismo */
  showToast('ok', exp.explicacao || 'Correto!');
  srAnnounce('Correto!', 'assertive');

  /* Após acerto: sempre voltar ao seletor do composto */
  setTimeout(function(){
    var formulaId = (exp._formulaId) || STATE.compostoAtual;
    var comp = COMPOSTOS[formulaId];
    if(comp) abrirReacoesLivres(formulaId, comp);
    else mostrarBoasVindas();
  }, 2500);
}

/* mostrarConclusao removida — modo livre */

/* darDica removida — modo livre */

/* pularExp removida — modo livre sem pular */

/* ── Reiniciar ─────────────────────────────────────────────── */
function reiniciar(){
  STATE.expAtual=null; STATE.hintIdx=0; STATE.dicasUsadas=0;
  STATE.expConcluidos=[]; STATE.aguardandoResposta=false;
  var chat=$('sim-chat'); if(chat) chat.innerHTML='';

  mostrarBoasVindas();
}

