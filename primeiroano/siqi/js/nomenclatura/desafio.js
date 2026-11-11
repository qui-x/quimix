/* ═══════════════════════════════════════════════════════════════
   CAMADA: MÓDULO 1 — NOMENCLATURA
   ARQUIVO: desafio.js
   ───────────────────────────────────────────────────────────────
   O núcleo do método socrático: mostra a fórmula e o desafio (sem
   revelar o nome), aceita a resposta do aluno (comparação flexível
   de texto), desbloqueia e mostra a ficha completa ao acertar. Inclui
   carregarComposto() — o ponto de entrada chamado ao clicar num item
   da Biblioteca — e a limpeza do painel de ficha quando nada está
   selecionado.
   Depende de: core/*, nomenclatura/biblioteca.js, render/lewis.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   10. CARREGAR COMPOSTO
════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════
   FICHA DE NOMENCLATURA — desafio para desbloquear o composto
════════════════════════════════════════════════════════════════ */
var _nomHtmlOriginal = null;

 /* salvo uma vez para restaurar */

/* Retorna um exemplo de nome que NÃO seja o composto atual */
function _placeholderNomeclatura(formulaIdAtual){
  var exemplos = [
    {id:'HCl',   nome:'Ácido clorídrico'},
    {id:'H2SO4', nome:'Ácido sulfúrico'},
    {id:'NaOH',  nome:'Hidróxido de sódio'},
    {id:'CaO',   nome:'Óxido de cálcio'},
    {id:'NaCl',  nome:'Cloreto de sódio'},
    {id:'CO2',   nome:'Dióxido de carbono'},
    {id:'NH3',   nome:'Amônia'},
    {id:'H2O',   nome:'Água'},
    {id:'FeCl3', nome:'Cloreto de ferro III'},
    {id:'ZnO',   nome:'Óxido de zinco'},
  ];
  var normaAtual = normFormula(formulaIdAtual);
  var disponiveis = exemplos.filter(function(e){
    return normFormula(e.id) !== normaAtual && e.id !== formulaIdAtual;
  });
  if(!disponiveis.length) return 'Digite o nome do composto…';
  var escolha = disponiveis[Math.floor(Math.random() * disponiveis.length)];
  return 'Ex.: ' + escolha.nome + '…';
}

// Somente nomes completos. O texto explicativo da ficha também contém
// exemplos, fórmulas e atributos e por isso não constitui um gabarito.
var nomesAlternativosPorFormula = {
  NaHCO3: ['hidrogenocarbonato de sódio'],
  FeCl2: ['cloreto ferroso'], FeCl3: ['cloreto férrico'],
  FeSO4: ['sulfato ferroso'], 'Fe(OH)3': ['hidróxido férrico'],
  CuO: ['óxido cúprico'], CuSO4: ['sulfato cúprico'],
  SnCl2: ['cloreto estanoso'], NH3: ['azano'],
  Al2O3: ['trióxido de dialumínio'], N2O5: ['anidrido nítrico'],
  Fe3O4: ['óxido de ferro(II,III)'], NO: ['óxido nítrico'],
  Zn: ['zinco'], Al: ['alumínio'], Cu: ['cobre']
};

function normalizarNomeCompleto(nome) {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\s*\(\s*([ivx]+(?:\s*,\s*[ivx]+)*)\s*\)/g, ' $1')
    .replace(/\s*,\s*/g, ',').replace(/\s+/g, ' ').trim();
}

function _mostrarDesafio(formulaId){
  var c = COMPOSTOS[formulaId]; if(!c) return;
  var f = FUNCAO_META[c.funcao] || {};
  var painelInfo = document.getElementById('panel-info');
  if(!painelInfo) return;

  /* Salvar HTML original da ficha apenas uma vez */
  if(!_nomHtmlOriginal){
    _nomHtmlOriginal = painelInfo.innerHTML;
  }

  var nomesAceitos = [c.nome].concat(nomesAlternativosPorFormula[formulaId] || [])
    .map(normalizarNomeCompleto);

  /* ── Dicas progressivas ── */
  var dicas = [];
  var funcDesc = {acido:'ácido — libera H⁺ em solução aquosa',base:'base / hidróxido — libera OH⁻',sal:'sal — cátion ≠ H⁺ e ânion ≠ OH⁻',oxido:'óxido — binário com oxigênio'};
  dicas.push('Este composto é um ' + (funcDesc[c.funcao]||c.funcao) + '.');
  if(c.nome){
    dicas.push('O nome começa com "' + c.nome.charAt(0).toUpperCase() + '".');
    var palavras = c.nome.split(' ');
    if(palavras.length > 1){
      dicas.push('O nome tem ' + palavras.length + ' palavra(s): "' +
        palavras.map(function(p,i){ return i===0 ? p : '___'; }).join(' ') + '".');
    }
    if(palavras.length > 2){
      dicas.push('Penúltima palavra: "' + palavras[palavras.length-2] + '".');
    }
  }
  if(c.uso) dicas.push('Pista de uso: ' + c.uso.split(',')[0].split('.')[0] + '.');

  /* ── Montar HTML do desafio ── */
  var pistasHtml =
    '<div class="nom-pista-card"><span class="nom-pista-label">Função</span>'+
    '<span class="nom-pista-val" style="color:'+f.cor+'">'+( f.label||c.funcao)+'</span></div>';
  if(c.geometria) pistasHtml +=
    '<div class="nom-pista-card"><span class="nom-pista-label">Geometria</span>'+
    '<span class="nom-pista-val">'+c.geometria+'</span></div>';
  if(c.massa) pistasHtml +=
    '<div class="nom-pista-card"><span class="nom-pista-label">Massa Molar</span>'+
    '<span class="nom-pista-val mono">'+c.massa+'</span></div>';

  painelInfo.innerHTML =
    '<div class="ficha-scroll">' +
      '<div class="nom-desafio-hero">' +
        '<div class="nom-formula-big">'+sub2(formulaId)+'</div>' +
        '<div class="nom-funcao-pill" style="background:'+f.cor+';color:#09090b">'+
          (f.label||c.funcao)+
        '</div>' +
        '<p class="nom-instrucao">Digite o nome deste composto para desbloqueá-lo na biblioteca:</p>' +
      '</div>' +
      '<div class="nom-input-wrap">' +
        '<div class="nom-input-row">' +
          '<input type="text" id="nom-input" class="nom-input"' +
            ' placeholder="'+_placeholderNomeclatura(formulaId)+'" autocomplete="off" spellcheck="false"/>' +
          '<button type="button" id="nom-btn" class="nom-btn">Verificar ↩</button>' +
        '</div>' +
        '<div id="nom-feedback" class="nom-feedback" aria-live="polite"></div>' +
      '</div>' +
      '<div class="nom-dica-wrap">' +
        '<button type="button" id="nom-dica-btn" class="nom-dica-btn"><svg class="icon" aria-hidden="true"><use href="#ic-bulb"/></svg> Pedir dica ('+(dicas.length)+')</button>' +
        '<div id="nom-dica-txt" class="nom-dica-txt" hidden></div>' +
      '</div>' +
      '<div class="nom-pistas">'+pistasHtml+'</div>' +
      '<div class="nom-lewis-wrap">' +
        '<p class="ficha-section-label" style="text-align:center;margin-bottom:.5rem">Estrutura (pista visual) <span class="silq-selo" title="Renderizado no estilo do SILQ">via SILQ</span></p>' +
        '<div id="nom-lewis-2d" class="silq2d-canvas" role="img" aria-label="Representação estrutural simplificada do composto"></div>' +
      '</div>' +
    '</div>';

  /* Mostrar o painel (sem chamar _setView para evitar loop) */
  var panelLab  = document.getElementById('panel-lab');
  var panelInfo = document.getElementById('panel-info');
  var btnLab    = document.getElementById('view-lab-btn');
  var btnInfo   = document.getElementById('view-info-btn');
  if(panelLab)  panelLab.hidden  = true;
  if(panelInfo) panelInfo.hidden = false;
  if(btnLab)  { btnLab.classList.remove('active');  btnLab.setAttribute('aria-pressed','false'); }
  if(btnInfo) { btnInfo.classList.add('active');     btnInfo.setAttribute('aria-pressed','true'); }
  STATE.modoView = 'info';

  /* Estrutura (pista visual) — estilo 2D do SILQ (átomo com anel de
     elétrons orbitando, ver js/render/silq-2d-preview.js). Substituiu
     o SVG simples de círculos+linhas que existia aqui antes. */
  setTimeout(function(){
    var lewDiv = document.getElementById('nom-lewis-2d');
    if(lewDiv && typeof desenharSILQ2D === 'function') desenharSILQ2D(formulaId, c, lewDiv);
  }, 50);

  /* Dicas */
  var dicasNivel = 0;
  var dicaBtn = document.getElementById('nom-dica-btn');
  var dicaTxt = document.getElementById('nom-dica-txt');
  if(dicaBtn){
    dicaBtn.addEventListener('click', function(){
      if(dicasNivel < dicas.length){
        dicaTxt.textContent = dicas[dicasNivel++];
        dicaTxt.hidden = false;
        if(dicasNivel >= dicas.length) dicaBtn.disabled = true;
        else dicaBtn.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-bulb"/></svg> Pedir dica ('+(dicas.length-dicasNivel)+' restantes)';
      }
    });
  }

  /* Verificação */
  var tentativas = 0;
  function verificarNome(){
    var input    = document.getElementById('nom-input');
    var feedback = document.getElementById('nom-feedback');
    if(!input||!feedback) return;
    var resposta = normalizarNomeCompleto(input.value);
    if(!resposta){
      feedback.className = 'nom-feedback nom-feedback-err';
      feedback.textContent = 'Digite o nome do composto acima.';
      return;
    }
    tentativas++;

    var acertou = nomesAceitos.includes(resposta);

    if(acertou){
      feedback.className = 'nom-feedback nom-feedback-ok';
      feedback.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> Correto! "' + c.nome + '" — desbloqueado!';
      input.disabled = true;
      var btnV = document.getElementById('nom-btn');
      if(btnV) btnV.disabled = true;
      if(dicaBtn) dicaBtn.hidden = true;

      desbloquearComposto(formulaId);

      setTimeout(function(){
        /* Restaurar HTML original da ficha e carregar composto normalmente */
        if(_nomHtmlOriginal){
          var pi = document.getElementById('panel-info');
          if(pi) pi.innerHTML = _nomHtmlOriginal;
        }
        STATE.compostoAtual = formulaId;
        carregarComposto(formulaId);
        /* Mostrar painel info com ficha completa */
        if(window._setView) window._setView('info');
      }, 1800);

    } else {
      feedback.className = 'nom-feedback nom-feedback-err';
      var erros = ['Não foi. Tente novamente!','Incorreto — use a dica se precisar.',
                   'Ainda não… verifique a ortografia.','Quase! Confira o nome completo.'];
      feedback.textContent = erros[Math.min(tentativas-1, erros.length-1)];
      input.select();
    }
  }

  var btn = document.getElementById('nom-btn');
  var inp = document.getElementById('nom-input');
  if(btn) btn.addEventListener('click', verificarNome);
  if(inp){
    inp.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); verificarNome(); }});
    setTimeout(function(){ inp.focus(); }, 150);
  }
}

/* ════════════════════════════════════════════════════════════════
   11b. LIMPAR O PAINEL "DADOS & ESTRUTURA"

   CORRECAO DE BUG. carregarComposto() sai mais cedo quando o composto
   selecionado esta BLOQUEADO (vai direto para o desafio de nomenclatura).
   Como saia antes de escrever nos campos, o painel continuava exibindo
   os dados do composto ANTERIOR — ou seja, o aluno clicava num composto
   bloqueado e lia, ao lado, massa molar, pH, geometria e a estrutura de
   Lewis de outro composto. Alem de errado, entregava de graca parte do
   que o desafio deveria cobrar.

   Esta funcao zera o painel e o marca como bloqueado. E chamada logo
   antes de _mostrarDesafio().
════════════════════════════════════════════════════════════════ */
function _limparPainelFicha(formulaId){
  /* Chip de consulta: mantem a formula (ela nao e segredo — aparece na
     biblioteca e no proprio desafio), mas o nome vira o aviso de bloqueio */
  txt('consulta-formula', formulaId ? sub2(formulaId) : '—');
  txt('consulta-nome',    'Bloqueado — acerte a nomenclatura');
  var chip=$('consulta-chip');
  if(chip){
    chip.style.borderColor = 'var(--bdr2)';
    var chipFormula = chip.querySelector('#consulta-formula');
    if(chipFormula) chipFormula.style.color = 'var(--tx3)';
  }

  /* Todos os campos de dados voltam a "—" */
  ['d-formula','d-funcao','d-nomenclatura','d-geometria','d-massa','d-estado',
   'd-solu','d-ph','d-pf','d-pe','d-densidade','d-uso'].forEach(function(id){
    txt(id, '—');
  });

  /* Estrutura de Lewis: SVG esvaziado e legenda avisando o motivo */
  var svg=$('lewis-svg');
  if(svg){ while(svg.firstChild) svg.removeChild(svg.firstChild); }
  txt('lewis-legenda', 'Composto bloqueado — estrutura oculta');

  /* Pill do cabecalho tambem nao pode ficar com a funcao do composto
     anterior (nem revelar a funcao deste, que e a 1a dica do desafio) */
  var pill=$('state-pill');
  if(pill){
    var t0=document.getElementById('state-pill-text');
    if(t0) t0.textContent='Bloqueado';
    pill.className='state-pill';
  }
}

function carregarComposto(formula){
  var c=COMPOSTOS[formula]; if(!c) return;
  /* Se bloqueado, redirecionar para desafio de nomenclatura */
  if(!estaDesbloqueado(formula)){
    STATE.compostoAtual = formula;
    _limparPainelFicha(formula);   /* ← zera o painel antes de sair */
    _mostrarDesafio(formula);
    return;
  }

  /* BUG REAL relatado pelo usuário (verificação exaustiva contra os
     100 compostos): clicar num composto AINDA BLOQUEADO deixa
     #panel-info mostrando o template do desafio socrático — se o
     usuário então clica direto em OUTRO composto que JÁ estava
     desbloqueado (sem resolver o primeiro), o código abaixo tentava
     popular #ficha-formula, #viewer3d etc., mas esses elementos não
     existiam mais no DOM (o template do desafio não tem essa
     estrutura) — populava silenciosamente nada, e a Estrutura
     Molecular (junto com o resto da ficha) ficava vazia/quebrada.
     Autocorreção: se a estrutura da ficha não estiver presente
     (checando um elemento-marcador, #ficha-formula) e existir uma
     cópia salva do HTML original, restaura ANTES de tentar popular
     qualquer campo — garante que #panel-info sempre tem a estrutura
     certa antes de usá-la, não importa o que estava lá antes. */
  if(!document.getElementById('ficha-formula') && typeof _nomHtmlOriginal !== 'undefined' && _nomHtmlOriginal){
    var piRestaurar = document.getElementById('panel-info');
    if(piRestaurar) piRestaurar.innerHTML = _nomHtmlOriginal;
  }

  STATE.compostoAtual=formula;
  var f=FUNCAO_META[c.funcao]||{};

  /* Pill de estado no header */
  var pill=$('state-pill');
  if(pill){
    var t1=document.getElementById('state-pill-text');
    if(t1) t1.textContent=f.label||'sem composto';
    pill.className='state-pill '+(f.label?c.funcao:'state-pill--vazio');
  }

  /* Ao selecionar composto:
     - Se lab ativo com experimento em curso → destacar no tray + mostrar ficha na sidebar
     - Se não há experimento ativo → ir para ficha central */
  if(STATE._compostoInicialCarregado){
    if(STATE.modoView==='lab'){
      /* Lab: abrir reações disponíveis para este composto */
      abrirReacoesLivres(formula, c);
    } else if(window._setView){
      window._setView('info');
    }
  }
  STATE._compostoInicialCarregado = true;

  /* Chip de consulta no topo do painel */
  txt('consulta-formula', sub2(formula));
  txt('consulta-nome',    c.nome||'—');
  var chip=$('consulta-chip');
  if(chip){
    chip.style.borderColor = f.cor||'var(--bdr2)';
    var chipFormula = chip.querySelector('#consulta-formula');
    if(chipFormula) chipFormula.style.color = f.cor||'var(--coral)';
  }

  /* Sidebar esquerda — dados gerais */
  txt('d-formula', sub2(formula));
  txt('d-funcao', f.label||'—');
  txt('d-nomenclatura', c.nomenclatura||'—');
  txt('d-massa', c.massa||'—');
  txt('d-estado', c.estado||'—');
  txt('d-solu', c.solubilidade||'—');
  txt('d-ph', c.ph||'—');
  txt('d-uso',          c.uso||'—');
  /* Campos extras de dadossiqi */
  txt('d-pf',       c.pfStr  || '—');
  txt('d-pe',       c.peStr  || '—');
  txt('d-densidade',c.densidade || '—');
  txt('d-geometria',c.geometria || '—');

  /* Estrutura molecular (sidebar, compacta) — SVG 2D próprio,
     já auditado contra os 100 compostos (js/render/lewis.js). A
     versão 3D (motor do SILQ) fica na Ficha central, mais abaixo
     nesta mesma função — só cabe UM #viewer3d na página. */
  desenharLewis(formula, c);

  /* reacao-mini e curiosidade-side removidos */

  /* ── Painel Ficha (área central) ── */
  txt('ficha-formula',     sub2(formula));
  txt('ficha-name',        c.nome);

  /* Badges de classificação */
  var badges=$('ficha-badges');
  if(badges) badges.innerHTML=(c.badges||[]).map(function(b){
    return '<span class="badge '+c.funcao+'">'+b+'</span>';
  }).join('');

  /* Banner de função */
  var ftag=$('funcao-tag'), fdesc=$('funcao-desc');
  if(ftag)  ftag.textContent=f.label||'—';
  if(fdesc) fdesc.textContent=f.desc||'—';
  var ftBanner=$('funcao-banner');
  if(ftBanner) ftBanner.style.borderLeftColor=f.cor||'var(--coral)';

  /* Equação de ionização */
  txt('equacao-display', c.equacao||'—');

  /* Grid de propriedades */
  txt('ficha-nomenclatura', c.nomenclatura||'—');
  txt('ficha-geometria',    c.geometria||'—');
  txt('ficha-massa',        c.massa||'—');
  txt('ficha-estado',       c.estado||'—');
  txt('ficha-pf',           c.pfStr||'—');
  txt('ficha-pe',           c.peStr||'—');
  txt('ficha-densidade',    c.densidade||'—');
  txt('ficha-ph',           c.ph||'—');
  txt('ficha-solu',         c.solubilidade||'—');
  txt('ficha-uso',          c.uso||'—');

  /* Estrutura molecular central — motor 3D do SILQ (ver comentário
     em indexsiqi.html, seção "Diagrama de Lewis central" /
     "Estrutura molecular"). Substitui o dispatch antigo que
     referenciava lewisHaloidro/lewisOxigenado/etc. diretamente — essas
     funções nem existem mais desde a reescrita de js/render/lewis.js
     (auditoria: cada tipo desenhava sempre o MESMO composto fixo,
     ex. sal_ionico sempre "Na⁺⋯Cl⁻" mesmo pra AgNO₃/K₂CO₃/CaSO₄...).
     Bug real, achado testando em Chromium real: "lewisHaloidro is not
     defined" — código morto que nunca foi atualizado junto com a
     reescrita, porque vivia AQUI dentro de desafio.js, não em
     lewis.js, e passou batido na auditoria anterior. */
  /* Estrutura molecular central — motor 3D do SILQ (ver comentário
     em indexsiqi.html, seção "Diagrama de Lewis central" /
     "Estrutura molecular"). Substitui o dispatch antigo que
     referenciava lewisHaloidro/lewisOxigenado/etc. diretamente — essas
     funções nem existem mais desde a reescrita de js/render/lewis.js
     (auditoria: cada tipo desenhava sempre o MESMO composto fixo,
     ex. sal_ionico sempre "Na⁺⋯Cl⁻" mesmo pra AgNO₃/K₂CO₃/CaSO₄...).
     Bug real, achado testando em Chromium real: "lewisHaloidro is not
     defined" — código morto que nunca foi atualizado junto com a
     reescrita, porque vivia AQUI dentro de desafio.js, não em
     lewis.js, e passou batido na auditoria anterior.

     BUG REAL #2, relatado pelo usuário testando no navegador de
     verdade (Chrome/Windows, fora do ambiente de teste automatizado):
     a caixa "Estrutura Molecular" ficava em branco — legenda e badge
     "via SILQ 3D" apareciam certos, mas nenhum átomo era desenhado.
     Causa: essa chamada rodava SÍNCRONA, no mesmo instante em que o
     painel da Ficha era desescondido (panelInfo.hidden=false, lá em
     cima nesta função) — o motor 3D mede o tamanho do container
     (getBoundingClientRect()) pra dimensionar o <canvas> assim que
     ativa (setActive(true)→_resize()), e alguns navegadores ainda não
     tinham terminado de recalcular o layout do painel recém-visível
     nesse exato instante síncrono, resultando num canvas 0×0 que
     nunca mais era redimensionado. A pista visual 2D (2 blocos acima)
     já evitava exatamente esse problema rodando dentro de um
     setTimeout — replicado aqui, pelo mesmo motivo. */
  setTimeout(function(){
    if(typeof atualizarEstruturaSILQ3D === 'function') atualizarEstruturaSILQ3D(formula, c);
    var fichaLeg = $('ficha-lewis-leg');
    if(fichaLeg) fichaLeg.textContent = (f.label||c.funcao) + ' — arraste para rotacionar, role para zoom';
  }, 50);

  /* Reação e curiosidade */
  txt('reacao-txt',       c.reacao||'—');
  txt('curiosidade-txt',  c.curiosidade||'—');

  /* Medidas (painel direito) */


  /* Canvas */
  gerarParticulas('repouso');

  /* Atualizar destaque na lista sem re-renderizar tudo */
  atualizarDestaqueLista(formula);

  /* SR */
  srAnnounce('Composto '+c.nome+' ('+sub2(formula)+') carregado.');
}

/* ── Atualiza só o highlight visual da lista, sem re-render ── */
function atualizarDestaqueLista(formula){
  var listEl=$('sub-list'); if(!listEl) return;
  listEl.querySelectorAll('.sub-item').forEach(function(li){
    var isActive = li.dataset.formula === formula;
    li.classList.toggle('active', isActive);
    li.setAttribute('aria-selected', String(isActive));
  });
}

/* Chips de exemplo do card Nomenclatura ("Bons exemplos") — antes
   eram só texto decorativo. Clicar ativa o módulo Nomenclatura (se
   ainda não estiver ligado) e já abre o desafio daquele composto. */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.chip[data-formula]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var btn = document.querySelector('.mode-activate-btn[data-module="nomenclatura"]');
      if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click();
      _mostrarDesafio(chip.dataset.formula);
    });
  });
});

