/* ═══════════════════════════════════════════════════════════════
   CAMADA: MÓDULO 2 — CONSTRUTOR
   ARQUIVO: estado-biblioteca.js
   ───────────────────────────────────────────────────────────────
   O estado do Construtor (busca, tipo/aba ativa, desafio atual,
   slots preenchidos, resolvidos) e a Biblioteca de desafios: busca,
   filtro por tipo, seleção de um desafio, e o embaralhamento
   determinístico da paleta de blocos (com seed a partir da fórmula,
   para o mesmo composto sempre embaralhar igual, mas diferente entre
   compostos).
   Depende de: data/desafios-construtor.js, data/ligantes-metais.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── 7.2 Módulo 2 — Construtor de Nomenclatura ─────────────────────
   Química de coordenação: o aluno monta o nome IUPAC clicando em
   blocos (prefixo multiplicador → ligante(s) → metal → NOX → "de" →
   cátion externo, quando existir) — mesma ideia de peças que se
   encaixam descrita no pedido do usuário. A "bancada de montagem"
   (paleta de blocos + sequência + fórmula preliminar) vive na ÁREA
   CENTRAL (#panel-construtor); a barra lateral direita traz a
   Biblioteca (seletor de tipo + lista de desafios), as Informações
   do Composto (sem nome) e o Validador de sintaxe — mesmo padrão de
   3 camadas do Módulo 3. O "Guia de Regras" que existia aqui foi
   removido (feedback do usuário: virava "cola" demais, já que
   Informações do Composto e o card seletor já cobrem o essencial).

   Dados: LIGANTES, METAIS_COMPLEXOS, PREFIXOS_MULT, DESAFIOS_CONSTRUTOR
   (dadossiqi.js/js/data/*). ────────────────────────────────────────── */

var _mod2Busca = '';

var _mod2TipoAtual = 'todos';

var _mod2DesafioAtual = null;

var _mod2Slots = [];

           /* array de {texto,tipo}|null, uma posição por slot do gabarito */
var _mod2Selecionado = null;

   /* bloco selecionado na paleta (clique-para-colocar) */
var _mod2Resolvidos = {};

      /* {desafioId: true} — marcados ✓ na Biblioteca após acerto */
var _mod2Iniciado = false;

var MOD2_TIPO_ABA_LABEL = {
  todos: 'Todos', sal: 'Sal', acido: 'Ácido', base: 'Base', oxido: 'Óxido',
  cation_complexo: 'Cátion', anion_complexo: 'Ânion', neutro: 'Neutro',
};

/* ── 7.2a Biblioteca — mesmo padrão do Módulo 1 (busca + abas +
   lista), só que a fonte é DESAFIOS_CONSTRUTOR em vez do catálogo
   geral, e cada item mostra SÓ A FÓRMULA — o nome IUPAC nunca aparece
   aqui, de propósito, pra não entregar a resposta antes da hora. ── */
function mod2MontarBiblioteca(){
  var badge = $('construtor-badge-total');
  if(badge) badge.textContent = DESAFIOS_CONSTRUTOR.length;

  var tabsWrap = $('construtor-tipo-tabs');
  if(tabsWrap){
    tabsWrap.innerHTML = '';
    tabsWrap.setAttribute('role', 'tablist');
    Object.keys(MOD2_TIPO_ABA_LABEL).forEach(function(tipo){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mol-cat-btn' + (tipo === _mod2TipoAtual ? ' active-cat' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', tipo === _mod2TipoAtual ? 'true' : 'false');
      btn.textContent = MOD2_TIPO_ABA_LABEL[tipo];
      btn.addEventListener('click', function(){
        _mod2TipoAtual = tipo;
        document.querySelectorAll('#construtor-tipo-tabs .mol-cat-btn').forEach(function(b){
          b.classList.remove('active-cat'); b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active-cat'); btn.setAttribute('aria-selected', 'true');
        mod2RenderBiblioteca();
      });
      tabsWrap.appendChild(btn);
    });
  }

  var busca = $('construtor-search');
  if(busca){
    busca.addEventListener('input', function(){
      _mod2Busca = busca.value.trim().toLowerCase();
      mod2RenderBiblioteca();
    });
  }

  mod2RenderBiblioteca();
}

/* Compara fórmulas independente de subscrito unicode: o usuário digita
   "H2SO4" com dígitos normais, mas d.formula guarda "H₂SO₄" (subscrito,
   pra exibição). Sem isso, buscar qualquer fórmula com número dava
   ZERO resultados — bug real, achado testando HClO4/CO2/Fe2O3 em
   Chromium real. */
var MOD2_SUB_PARA_NORMAL = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
function mod2NormalizarFormula(str){
  return str.toLowerCase().replace(/[₀-₉]/g, function(ch){ return MOD2_SUB_PARA_NORMAL[ch] || ch; });
}

function mod2RenderBiblioteca(){
  var lista = $('construtor-lista');
  if(!lista) return;

  var buscaNorm = mod2NormalizarFormula(_mod2Busca);
  var itens = DESAFIOS_CONSTRUTOR.filter(function(d){
    var passaTipo = _mod2TipoAtual === 'todos' || d.tipo === _mod2TipoAtual;
    var passaBusca = !buscaNorm || mod2NormalizarFormula(d.formula).indexOf(buscaNorm) !== -1;
    return passaTipo && passaBusca;
  });

  lista.innerHTML = '';
  lista.setAttribute('role', 'listbox');
  lista.setAttribute('aria-label', 'Compostos disponíveis para montar');

  if(itens.length === 0){
    var vazio = document.createElement('li');
    vazio.className = 'no-results';
    vazio.textContent = 'Nenhum composto encontrado.';
    lista.appendChild(vazio);
    return;
  }

  itens.forEach(function(d){
    var li = document.createElement('li');
    li.className = 'sub-item construtor-lib-item';
    li.setAttribute('role', 'option');
    li.setAttribute('tabindex', '0');
    li.setAttribute('aria-selected', _mod2DesafioAtual && _mod2DesafioAtual.id === d.id ? 'true' : 'false');
    var resolvido = !!_mod2Resolvidos[d.id];
    li.innerHTML =
      '<span class="construtor-lib-formula">' + d.formula + '</span>' +
      '<span class="construtor-lib-badge' + (resolvido ? ' construtor-lib-badge--ok' : '') + '">' +
        (resolvido ? '<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> resolvido' : MOD2_TIPO_ABA_LABEL[d.tipo]) +
      '</span>';
    function selecionar(){
      lista.querySelectorAll('.construtor-lib-item').forEach(function(el){ el.setAttribute('aria-selected', 'false'); });
      li.setAttribute('aria-selected', 'true');
      mod2SelecionaDesafio(d);
    }
    li.addEventListener('click', selecionar);
    li.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); selecionar(); }
    });
    lista.appendChild(li);
  });
}

/* ── 7.2b Informações do Composto — ficha "cega": fórmula + tabela de
   composição química BRUTA (espécie/papel/quantidade/carga), o
   suficiente pro aluno raciocinar sobre NOX/prefixos/sufixos sozinho.
   NUNCA usa desafio.titulo/nome_correto aqui. ─────────────────────── */
function mod2AtualizarInfoComposto(desafio){
  var div = $('construtor-info-content');
  if(!div) return;

  var linhas = (desafio.composicao || []).map(function(c){
    return '<tr><td>' + c.especie + '</td><td>' + c.papel + '</td><td>' + c.quantidade + '</td><td>' + c.carga + '</td></tr>';
  }).join('');

  div.innerHTML =
    '<p class="construtor-info-formula"><code>' + desafio.formula + '</code></p>' +
    '<table class="construtor-info-table">' +
      '<thead><tr><th>Espécie</th><th>Papel</th><th>Qtd.</th><th>Carga</th></tr></thead>' +
      '<tbody>' + linhas + '</tbody>' +
    '</table>' +
    '<p class="construtor-info-nota">' + desafio.descricao + '</p>';
}

function mod2SelecionaDesafio(desafio){
  _mod2DesafioAtual = desafio;
  _mod2Slots = [];
  _mod2Selecionado = null;
  if(window._setView) window._setView('construtor');
  mod2MontarBancada(desafio);
  mod2AtualizarInfoComposto(desafio);
  mod2AtualizarValidador();
  /* Anúncio usa a FÓRMULA, nunca desafio.titulo — não revelar o nome
     nem no leitor de tela. */
  srAnnounce('Composto ' + desafio.formula + ' selecionado. Monte o nome arrastando os blocos até os slots certos, ou clicando num bloco e depois no slot.');
}

/* ── 7.2c Bancada de montagem (área central) ───────────────────────
   Hero NUNCA usa desafio.titulo (revelava a resposta) — só fórmula +
   tipo/nível, que são dados de entrada legítimos, não a resposta. */
function mod2SeedDeString(str){
  var h = 0;
  for(var i = 0; i < str.length; i++){ h = (h * 31 + str.charCodeAt(i)) >>> 0; }
  return h || 1;
}

/* Fisher-Yates com seed determinístico (mesmo desafio.id sempre
   embaralha igual, pra não reordenar sozinho a cada re-render — mas
   embaralha DE VERDADE). A tentativa anterior — ordenar por
   `(i*2654435761) % 97` — parecia aleatória, mas pra conjuntos
   pequenos (até 9 blocos) essa conta é estritamente crescente em i
   (0,12,24,36...): na prática NÃO embaralhava nada, e "hexa"+"ciano"+
   "ferrato" saíam adjacentes e na ordem certa — quase entregando a
   resposta. Confirmado calculando a sequência antes de trocar. */
function mod2TemParAdjacenteCorreto(itens, corretos){
  /* Varre a paleta já embaralhada procurando 2 blocos vizinhos que
     também sejam vizinhos, NA MESMA ORDEM, no gabarito — sinal de
     que a resposta está "legível" ali por acidente do embaralhamento
     (Fisher-Yates é correto em média, mas para 9 itens o seed de um
     desafio específico pode, por sorte, deixar isso acontecer). */
  for(var p = 0; p < itens.length - 1; p++){
    for(var c = 0; c < corretos.length - 1; c++){
      if(itens[p].texto === corretos[c].texto && itens[p+1].texto === corretos[c+1].texto){
        return p;
      }
    }
  }
  return -1;
}

function mod2PaletaEmbaralhada(desafio){
  var itens = desafio.blocos_corretos.concat(desafio.distratores).slice();
  var seed = mod2SeedDeString(desafio.id);
  function rand(){
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  }
  for(var i = itens.length - 1; i > 0; i--){
    var j = Math.floor(rand() * (i + 1));
    var tmp = itens[i]; itens[i] = itens[j]; itens[j] = tmp;
  }

  /* Garantia extra, determinística: continua trocando o item ofensor
     de lugar até nenhum par adjacente da paleta reproduzir a ordem
     do gabarito — não depende só da sorte do embaralhamento acima. */
  var pos, tentativas = 0;
  while((pos = mod2TemParAdjacenteCorreto(itens, desafio.blocos_corretos)) !== -1 && tentativas < 30){
    var outro = Math.floor(rand() * itens.length);
    var tmp2 = itens[pos]; itens[pos] = itens[outro]; itens[outro] = tmp2;
    tentativas++;
  }
  return itens;
}

/* Chips de exemplo do card Construtor ("Bons exemplos") — antes eram
   só texto decorativo. Clicar ativa o módulo Construtor (se ainda
   não estiver ligado) e já abre o desafio correspondente na
   bancada. */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.chip[data-desafio]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var btn = document.querySelector('.mode-activate-btn[data-module="construtor"]');
      if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click();
      var desafio = DESAFIOS_CONSTRUTOR.find(function (d) { return d.id === chip.dataset.desafio; });
      if (desafio) mod2SelecionaDesafio(desafio);
    });
  });
});

