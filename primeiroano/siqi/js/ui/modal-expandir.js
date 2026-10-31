/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: modal-expandir.js
   ───────────────────────────────────────────────────────────────
   O modal de leitura ampliada (⤢): move o conteúdo real de um painel
   para dentro do modal (sem clonar, preservando IDs) e devolve à
   origem ao fechar — mesmo padrão do SIEM/SILQ.
   Depende de: nada além do HTML.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   6. MODAL DE EXPANSÃO — mesmo padrão SIEM
════════════════════════════════════════════════════════════════ */
function initExpandModal(){
  var overlay=$('expand-overlay');
  var closeBtn=$('expand-close');
  var body=$('expand-body');
  var titleEl=$('expand-title');
  if(!overlay) return;

  document.querySelectorAll('.expand-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var target=btn.dataset.expand;
      var conteudo=gerarConteudoModal(target);
      if(!conteudo) return;
      titleEl.textContent=conteudo.titulo;
      body.innerHTML=conteudo.html;
      overlay.hidden=false;
      document.body.classList.add('modal-open');
      if(conteudo.onOpen) setTimeout(conteudo.onOpen, 30);
      closeBtn.focus();
    });
  });

  function fechar(){
    overlay.hidden=true;
    document.body.classList.remove('modal-open');
  }
  closeBtn && closeBtn.addEventListener('click',fechar);
  overlay.addEventListener('click',function(e){ if(e.target===overlay) fechar(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&!overlay.hidden) fechar(); });
}

function gerarConteudoModal(target){
  var c=COMPOSTOS[STATE.compostoAtual];
  if(!c) return null;
  var f=FUNCAO_META[c.funcao]||{};

  /* Composto BLOQUEADO nao tem ficha para expandir: o painel na tela esta
     zerado (ver _limparPainelFicha) e o modal precisa dizer o mesmo, em vez
     de revelar por atalho os dados que o desafio de nomenclatura esconde. */
  if(!estaDesbloqueado(STATE.compostoAtual)){
    return { titulo:'Composto bloqueado', html:
      '<p style="font-size:.9em;color:var(--tx2);line-height:1.7;text-align:center;'+
        'background:var(--bg2);border-radius:8px;padding:1rem;border:1px solid var(--bdr);">'+
        '<svg class="icon" aria-hidden="true"><use href="#ic-lock"/></svg> <strong>'+sub2(STATE.compostoAtual)+'</strong> ainda está bloqueado.<br>'+
        'Acerte a nomenclatura na aba ◈ Ficha para liberar os dados e a estrutura.'+
      '</p>' };
  }

  /* Painel unico "Dados & Estrutura" → um unico ⤢ que expande as duas
     fichas juntas. Reaproveita os geradores 'lewis' e 'gerais' em vez de
     duplicar o HTML dos dois. */
  if(target==='ficha'){
    var lew = gerarConteudoModal('lewis');
    var ger = gerarConteudoModal('gerais');
    if(!lew || !ger) return null;
    return {
      titulo: 'Dados & Estrutura — ' + c.nome,
      html:   '<p class="data-subhead">Estrutura molecular</p>' + lew.html + ger.html,
      onOpen: lew.onOpen
    };
  }

  if(target==='gerais'){
    function dr(dt,dd){
      return '<div class="dr"><dt>'+dt+'</dt><dd>'+
        (dd&&dd!=='—'?dd:'<span class="na">—</span>')+'</dd></div>';
    }
    return { titulo:'Dados Gerais — '+c.nome, html:
      '<p class="data-subhead">Identificação</p>'+
      '<dl class="data-grid">'+
        dr('Fórmula',      '<span style="font-size:1.05em;color:var(--coral);">'+sub2(STATE.compostoAtual)+'</span>')+
        dr('Função',       '<span style="color:'+(FUNCAO_META[c.funcao]||{cor:'var(--tx1)'}).cor+';">'+(f.label||'—')+'</span>')+
        dr('Nomenclatura', c.nomenclatura||'—')+
        dr('Geometria',    c.geometria||'—')+
        dr('Ligação',      c.ligacao||'—')+
      '</dl>'+
      '<p class="data-subhead">Propriedades Físicas</p>'+
      '<dl class="data-grid">'+
        dr('Massa Molar',  c.massa)+
        dr('Estado (25°C)',c.estado)+
        dr('Pt. Fusão',    c.pfStr||'—')+
        dr('Pt. Ebulição', c.peStr||'—')+
        dr('Densidade',    c.densidade||'—')+
        dr('Solubilidade', c.solubilidade)+
        dr('pH aprox.',    c.ph)+
      '</dl>'+
      '<p class="data-subhead">Aplicações</p>'+
      '<dl class="data-grid">'+
        dr('Uso principal', c.uso)+
      '</dl>'+
      (c.descricao?'<p style="font-size:.8em;color:var(--tx2);margin-top:.8rem;line-height:1.7;'
        +'background:var(--bg2);border-radius:6px;padding:.6rem .8rem;border:1px solid var(--bdr);">'+
        c.descricao+'</p>':'')+
      ''
    };
  }
  if(target==='lewis'){
    /* Gera SVG inline após montar o HTML */
    return {
      titulo: 'Estrutura — '+c.nome,
      html:
        '<svg id="modal-lewis-svg" viewBox="0 0 300 200" '+
          'style="width:100%;max-width:420px;height:200px;display:block;margin:0 auto;'+
          'background:var(--bg2);border-radius:8px;border:1px solid var(--bdr);">'+
        '</svg>'+
        '<p style="text-align:center;color:var(--tx2);font-size:.82em;margin:.6rem 0 0;">'+
          c.nomenclatura+
        '</p>'+
        '<p style="font-size:.82em;color:var(--tx2);margin-top:.9rem;line-height:1.7;'+
          'background:var(--bg2);border-radius:6px;padding:.65rem .8rem;border:1px solid var(--bdr);">'+
          (c.curiosidade||'').replace(/</g,'&lt;').replace(/>/g,'&gt;')+
        '</p>',
      onOpen: function(){
        var svg=document.getElementById('modal-lewis-svg');
        if(svg) desenharLewis(STATE.compostoAtual, c, svg);
      }
    };
  }
  /* medidas modal removido */
  if(target==='reacao'){
    var eqDisplay = (c.equacao||'—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    var reacaoDisplay = (c.reacao||'—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return { titulo:'Reação Modelo — '+c.nome, html:
      '<p class="data-subhead">Ionização / Dissociação</p>'+
      '<div style="font-family:var(--mono);font-size:1.05em;color:var(--coral2);'+
        'background:var(--bg2);border-radius:8px;padding:.75rem 1rem;'+
        'border:1px solid var(--bdr);text-align:center;letter-spacing:.02em;margin-bottom:.8rem;">'+
        eqDisplay+
      '</div>'+
      '<p class="data-subhead">Reação Modelo</p>'+
      '<pre style="font-family:var(--mono);font-size:.9em;line-height:1.9;'+
        'color:var(--tx1);white-space:pre-wrap;background:var(--bg2);'+
        'border-radius:8px;padding:.75rem 1rem;border:1px solid var(--bdr);">'+
        reacaoDisplay+
      '</pre>'+
      '<p class="data-subhead" style="margin-top:.9rem;">Curiosidade</p>'+
      '<p style="font-size:.85em;color:var(--tx2);line-height:1.75;'+
        'background:var(--bg2);border-radius:8px;padding:.7rem .9rem;border:1px solid var(--bdr);">'+
        (c.curiosidade||'—').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')+
      '</p>' };
  }
  return null;
}

