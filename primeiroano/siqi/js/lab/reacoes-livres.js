/* ═══════════════════════════════════════════════════════════════
   CAMADA: LABORATÓRIO
   ARQUIVO: reacoes-livres.js
   ───────────────────────────────────────────────────────────────
   Abre o modo de reação livre para o composto em consulta: lista as
   reações possíveis (do banco REACOES_LIVRES) e monta o builder para
   a reação escolhida.
   Depende de: data/reacoes-livres-*.js, lab/builder-mecanica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Modo Lab — selecionar composto abre painel de reações ──── */
function abrirReacoesLivres(formulaId, composto){
  var reacoes = (typeof REACOES_LIVRES !== 'undefined') && REACOES_LIVRES[formulaId] || [];

  /* Garantir modo Lab */
  if(window._setView) window._setView('lab');

  /* Header */
  var expHdr = document.getElementById('exp-header');
  if(expHdr) expHdr.hidden = false;
  txt('exp-num', 'Laboratório Livre');
  txt('exp-fam', sub2(formulaId) + ' — ' + composto.nome);

  var rxnWrap = document.getElementById('rxn-wrapper');
  if(!rxnWrap) return;
  rxnWrap.hidden = false;
  rxnWrap.innerHTML = '';

  /* ── SEMPRE mostrar seletor, mesmo com 1 reação ── */
  var sel = document.createElement('div');
  sel.className = 'rxl-seletor';

  /* Cabeçalho com bolha do composto */
  var hd = document.createElement('div');
  hd.className = 'rxl-seletor-hd';

  var bubbleWrap = document.createElement('div');
  bubbleWrap.className = 'rxl-composto-wrap';
  var bubble = document.createElement('div');
  bubble.className = 'rxl-composto-bubble rxb-mol-reagente';
  var ef = estadoFisico(sub2(formulaId));
  bubble.innerHTML =
    '<div class="rxb-mol-formula">'+sub2(formulaId)+
      '<span class="rxb-mol-estado">'+ef+'</span>'+
    '</div>' +
    '<div class="rxb-mol-nome">'+(nomeMol(sub2(formulaId))||composto.nome)+'</div>';
  bubbleWrap.appendChild(bubble);

  var hdInfo = document.createElement('div');
  hdInfo.className = 'rxl-hd-info';

  if(reacoes.length === 0){
    hdInfo.innerHTML =
      '<span class="rxl-seletor-nome">'+composto.nome+'</span>' +
      '<span class="rxl-seletor-label">Nenhuma reação cadastrada para este composto.</span>';
  } else {
    hdInfo.innerHTML =
      '<span class="rxl-seletor-nome">'+composto.nome+'</span>' +
      '<span class="rxl-seletor-label">' +
        (reacoes.length === 1
          ? '1 reação disponível — escolha uma:'
          : reacoes.length + ' reações disponíveis — escolha uma:') +
      '</span>';
  }

  hd.appendChild(bubbleWrap);
  hd.appendChild(hdInfo);
  sel.appendChild(hd);

  /* Cards de reação */
  if(reacoes.length > 0){
    var lista = document.createElement('div');
    lista.className = 'rxl-lista';

    reacoes.forEach(function(rxn){
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'rxl-card';

      /* Reagentes */
      var reagStr = rxn.reagentes.map(function(r){
        var ef2 = estadoFisico(r);
        return '<span class="rxl-card-mol">'+r+
          '<span style="font-size:.55em;opacity:.7;margin-left:.1rem;">'+ef2+'</span>'+
          '</span>';
      }).join('<span class="rxl-card-plus"> + </span>');

      /* Condição + seta */
      var cond = rxn.condicao ?
        '<span class="rxl-card-cond">'+rxn.condicao+'</span>' : '';

      card.innerHTML =
        '<span class="rxl-card-icon"><svg class="icon" aria-hidden="true"><use href="#ic-'+rxn.icon+'"/></svg></span>' +
        '<div class="rxl-card-info">' +
          '<div class="rxl-card-eq">'+
            reagStr +
            '<span class="rxl-card-arrow-eq">'+cond+'⟶</span>' +
            '<span class="rxl-card-prod">?</span>'+
          '</div>' +
          '<span class="rxl-card-familia">'+rxn.familia+'</span>' +
        '</div>' +
        '<span class="rxl-card-arrow">›</span>';

      card.addEventListener('click', function(){
        abrirReacaoLivre(rxn, formulaId, composto);
      });
      lista.appendChild(card);
    });
    sel.appendChild(lista);
  }

  /* Rodapé */
  var footer = document.createElement('div');
  footer.className = 'rxl-seletor-footer';
  var btnBack = document.createElement('button');
  btnBack.type = 'button';
  btnBack.className = 'rxl-btn-back';
  btnBack.textContent = '← Voltar';
  btnBack.addEventListener('click', mostrarBoasVindas);
  footer.appendChild(btnBack);
  sel.appendChild(footer);

  rxnWrap.appendChild(sel);
}

/* ─────────────────────────────────────────────────────────── */
function abrirReacaoLivre(rxn, formulaId, composto){
  /* Montar experimento compatível com o builder */
  var expFake = {
    id:             'livre_'+rxn.id,
    icon:           rxn.icon,
    familia:        rxn.familia,
    titulo:         rxn.titulo,
    descricao:      rxn.descricao || '',
    reagentes:      rxn.reagentes,
    condicao:       rxn.condicao || '',
    produtos_visuais: rxn.produtos_visuais,
    candidatos:     rxn.candidatos || rxn.produtos_visuais,
    coefR:          rxn.coefR     || null,
    coefP:          rxn.coefP     || null,
    gabarito:       rxn.gabarito,
    hints:          rxn.hints     || [],
    explicacao:     rxn.explicacao|| '',
    proxExp:        null,
    _isLivre:       true,
    _formulaId:     formulaId,
    _composto:      composto,
  };

  STATE.expAtual = expFake;
  STATE.hintIdx  = 0;
  STATE.aguardandoResposta = true;

  /* Header: familia + titulo da reação */
  var expHdr = document.getElementById('exp-header');
  if(expHdr) expHdr.hidden = false;
  txt('exp-num', rxn.familia);
  txt('exp-fam', rxn.titulo + (rxn.descricao ? '  ·  ' + rxn.descricao : ''));

  /* Builder */
  var rxnWrap = document.getElementById('rxn-wrapper');
  if(rxnWrap){
    rxnWrap.innerHTML = '';
    rxnWrap.appendChild(criarBuilder(expFake));
  }
}

