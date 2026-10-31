/* ═══════════════════════════════════════════════════════════════
   CAMADA: MÓDULO 1 — NOMENCLATURA
   ARQUIVO: biblioteca.js
   ───────────────────────────────────────────────────────────────
   Monta a lista de compostos da Biblioteca (com busca e abas por
   função inorgânica) e a renderiza — cada item mostra se já foi
   desbloqueado (✓) ou ainda está com o desafio pendente.
   Depende de: core/dados-adapter.js (COMPOSTOS),
               core/desbloqueio.js.
   Usado por: js/nomenclatura/desafio.js (chama ao desbloquear).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   9. LISTA DE COMPOSTOS — mol-cat-tabs + sub-list (padrão SIEM)
════════════════════════════════════════════════════════════════ */
function initSubList(){
  var tabsEl=$('sub-cat-tabs');
  var listEl=$('sub-list');
  var searchEl=$('sub-search');
  if(!tabsEl||!listEl) return;

  /* Abas de categoria */
  CATEGORIAS.forEach(function(cat){
    var btn=document.createElement('button');
    btn.type='button'; btn.className='mol-cat-btn'; btn.textContent=cat.label;
    btn.setAttribute('role','tab');
    btn.setAttribute('aria-selected', cat.id==='todos'?'true':'false');
    if(cat.id==='todos') btn.classList.add('active-cat');
    btn.addEventListener('click',function(){
      tabsEl.querySelectorAll('.mol-cat-btn').forEach(function(b){
        b.classList.remove('active-cat'); b.setAttribute('aria-selected','false');
      });
      btn.classList.add('active-cat'); btn.setAttribute('aria-selected','true');
      STATE.catAtiva=cat.id;
      renderSubList('');
      if(searchEl) searchEl.value='';
    });
    tabsEl.appendChild(btn);
  });

  /* Busca */
  if(searchEl){
    searchEl.addEventListener('input',function(){
      renderSubList(normTxt(searchEl.value));
    });
  }

  renderSubList('');
}

function renderSubList(query){
  var listEl=$('sub-list'); if(!listEl) return;
  listEl.innerHTML='';

  var grupos={};
  Object.entries(COMPOSTOS).forEach(function(pair){
    var formula=pair[0], c=pair[1];
    if(STATE.catAtiva!=='todos'&&c.funcao!==STATE.catAtiva) return;
    if(query){
      var haystack=normTxt(formula+' '+c.nome+' '+c.nomenclatura);
      if(!haystack.includes(query)) return;
    }
    if(!grupos[c.funcao]) grupos[c.funcao]=[];
    grupos[c.funcao].push([formula,c]);
  });

  var total=0;
  var ordem=['acido','base','sal','oxido'];
  ordem.forEach(function(fn){
    if(!grupos[fn]) return;
    var meta=FUNCAO_META[fn]||{};
    if(STATE.catAtiva==='todos'){
      var hdr=document.createElement('li');
      hdr.className='sub-group-hdr'; hdr.textContent=meta.label||fn;
      listEl.appendChild(hdr);
    }
    grupos[fn].forEach(function(pair){
      var formula=pair[0], c=pair[1];
      total++;
      var desbloqueado = estaDesbloqueado(formula);
      var li=document.createElement('li');
      li.className='sub-item'+(formula===STATE.compostoAtual?' active':'')+(desbloqueado?'':' bloqueado');
      li.setAttribute('role','option');
      li.setAttribute('aria-selected', formula===STATE.compostoAtual?'true':'false');
      li.setAttribute('title', desbloqueado?c.nome:'Acerte a nomenclatura na ◈ Ficha para desbloquear');
      li.dataset.formula = formula;
      li.tabIndex=0;
      if(desbloqueado){
        li.innerHTML='<span class="si-dot" style="color:'+meta.cor+';" aria-hidden="true"></span>'+
          '<span class="si-formula">'+sub2(formula)+'</span>'+
          '<span class="si-name">'+c.nome+'</span>';
      } else {
        li.innerHTML='<span class="si-dot si-dot-lock" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#ic-lock"/></svg></span>'+
          '<span class="si-formula">'+sub2(formula)+'</span>'+
          '<span class="si-name si-name-lock">???</span>';
      }
      function selecionar(){
        if(!estaDesbloqueado(formula)){
          /* Levar para ficha de nomenclatura sem revelar nome.
             Este e o caminho que o clique na biblioteca usa de fato — ele
             NAO passa por carregarComposto(), entao a limpeza do painel
             "Dados & Estrutura" tem de ser chamada aqui tambem. Sem ela,
             o painel continuava mostrando os dados do composto liberado
             anteriormente. */
          STATE.compostoAtual = formula;
          _limparPainelFicha(formula);
          _mostrarDesafio(formula);
          listEl.querySelectorAll('.sub-item').forEach(function(el){
            el.classList.remove('active'); el.setAttribute('aria-selected','false');
          });
          li.classList.add('active'); li.setAttribute('aria-selected','true');
          return;
        }
        carregarComposto(formula);
        listEl.querySelectorAll('.sub-item').forEach(function(el){
          el.classList.remove('active'); el.setAttribute('aria-selected','false');
        });
        li.classList.add('active'); li.setAttribute('aria-selected','true');
      }
      li.addEventListener('click',selecionar);
      li.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); selecionar(); }});
      listEl.appendChild(li);
    });
  });

  var badge=$('badge-total'); if(badge) badge.textContent=total;
  if(total===0){
    var empty=document.createElement('li');
    empty.style.cssText='padding:.4rem .5rem;font-size:.72rem;color:var(--tx3);';
    empty.textContent='Nenhum composto encontrado.';
    listEl.appendChild(empty);
  }
}

