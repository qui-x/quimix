/* ═══════════════════════════════════════════════════════════════
   CAMADA: MÓDULO 2 — CONSTRUTOR (bancada de montagem)
   ARQUIVO: bancada.js
   ───────────────────────────────────────────────────────────────
   Monta a bancada de montagem na área central: os slots posicionais
   do nome (prefixo, ligante, metal, NOX), a paleta de blocos
   clicáveis, colocar/remover um bloco de um slot, a fórmula
   preliminar desenhada dinamicamente conforme o aluno monta, e o
   validador de sintaxe ao vivo. O "Guia de Regras IUPAC" que existia
   aqui foi removido (feedback do usuário: já virava "cola" demais,
   dado que as Informações do Composto e o card seletor já cobrem o
   essencial) — REGRAS_IUPAC (data/regras-iupac.js) continua existindo
   como dado, só não é mais renderizado por este arquivo.
   Depende de: construtor/estado-biblioteca.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* Rótulo mostrado no placeholder de cada slot vazio — indica o TIPO
   gramatical esperado naquela posição (não a resposta em si), igual
   ao "produto 1"/"produto 2" do Laboratório, só que tipado por
   categoria em vez de numerado. */
var MOD2_TIPO_LABEL = {
  mult: 'prefixo', ligante: 'ligante', metal: 'metal', nox: 'NOx',
  conectivo: 'conectivo', ion: 'cátion/ânion', radical: 'radical',
  sufixo: 'sufixo', fixo: 'palavra',
};

function mod2MontarBancada(desafio){
  _mod2Slots = desafio.blocos_corretos.map(function(){ return null; });
  _mod2Selecionado = null;

  var central = $('construtor-central-content');
  if(!central) return;

  var paleta = mod2PaletaEmbaralhada(desafio);

  central.innerHTML =
    '<div class="construtor-hero">'+
      '<p class="construtor-hero-label">'+desafio.nivel+' · '+desafio.tipo.replace('_',' ')+'</p>'+
      '<h2 class="construtor-hero-title">Monte o nome IUPAC deste composto</h2>'+
      '<code class="construtor-hero-formula">'+desafio.formula+'</code>'+
    '</div>'+
    '<div class="construtor-slots-wrap" id="construtor-slots" role="list" aria-label="Posições do nome a preencher"></div>'+
    '<div class="construtor-formula-preview" id="construtor-formula-preview"></div>'+
    '<p class="construtor-paleta-label">Blocos disponíveis — arraste até um slot, ou clique no bloco e depois no slot</p>'+
    '<div class="construtor-paleta" id="construtor-paleta" role="group" aria-label="Blocos disponíveis"></div>'+
    '<div class="construtor-acoes">'+
      '<button type="button" class="construtor-btn-limpar" id="construtor-btn-limpar">↺ Limpar montagem</button>'+
    '</div>';

  var slotsWrap = $('construtor-slots');
  desafio.blocos_corretos.forEach(function(_, idx){
    slotsWrap.appendChild(mod2CriarSlot(desafio, idx));
  });

  var paletaDiv = $('construtor-paleta');
  paleta.forEach(function(bloco){
    paletaDiv.appendChild(mod2CriarBlocoPaleta(bloco));
  });

  var btnLimpar = $('construtor-btn-limpar');
  if(btnLimpar) btnLimpar.addEventListener('click', function(){ mod2LimparSlots(desafio); });

  mod2RenderFormulaPreliminar();
}

/* ── Slot vazio: aceita arraste (dragover/dragleave/drop) E clique
   (se já houver um bloco selecionado na paleta) — mesmo padrão de
   dupla via de interação do rxbSlot() no Laboratório, garantindo que
   quem não consegue arrastar (teclado, leitor de tela, mobile sem
   suporte a drag) ainda consiga montar o nome. ────────────────── */
function mod2CriarSlot(desafio, idx){
  var slot = document.createElement('div');
  slot.className = 'construtor-slot construtor-slot--vazio';
  slot.id = 'construtor-slot-' + idx;
  slot.dataset.idx = idx;
  slot.setAttribute('role', 'listitem');
  mod2PreencherPlaceholderSlot(slot, desafio, idx);
  mod2BindSlotVazio(slot, desafio, idx);
  return slot;
}

function mod2PreencherPlaceholderSlot(slot, desafio, idx){
  var tipoEsperado = desafio.blocos_corretos[idx].tipo;
  var label = MOD2_TIPO_LABEL[tipoEsperado] || 'bloco';
  slot.innerHTML =
    '<span class="construtor-slot-ph-icon" aria-hidden="true">＋</span>'+
    '<span class="construtor-slot-ph-txt">'+label+'</span>';
}

function mod2BindSlotVazio(slot, desafio, idx){
  slot.addEventListener('dragover', function(e){
    e.preventDefault(); slot.classList.add('construtor-drag-over');
  });
  slot.addEventListener('dragleave', function(){
    slot.classList.remove('construtor-drag-over');
  });
  slot.addEventListener('drop', function(e){
    e.preventDefault(); slot.classList.remove('construtor-drag-over');
    var raw = e.dataTransfer.getData('text/plain');
    if(!raw) return;
    try { mod2ColocarNoSlot(JSON.parse(raw), idx, desafio); } catch(err){ /* payload inválido, ignora */ }
  });
  slot.addEventListener('click', function(){
    if(_mod2Selecionado){
      mod2ColocarNoSlot(_mod2Selecionado, idx, desafio);
      mod2DeselecionarPaleta();
    }
  });
}

/* ── Bloco na paleta: arrastável (dragstart carrega {texto,tipo} via
   dataTransfer) e clicável (seleciona/desseleciona, replicando
   rxbTrayMol()). Também navegável via teclado (Enter/Espaço). ──── */
function mod2CriarBlocoPaleta(bloco){
  var el = document.createElement('div');
  el.className = 'construtor-bloco construtor-bloco--' + bloco.tipo;
  el.textContent = bloco.texto;
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('title', 'Arraste até um slot, ou clique e depois clique no slot certo');
  el.draggable = true;

  el.addEventListener('dragstart', function(e){
    e.dataTransfer.setData('text/plain', JSON.stringify(bloco));
    el.classList.add('construtor-bloco--arrastando');
  });
  el.addEventListener('dragend', function(){
    el.classList.remove('construtor-bloco--arrastando');
  });

  function selecionar(){
    var jaSelecionado = el.classList.contains('construtor-bloco--selecionado');
    mod2DeselecionarPaleta();
    if(!jaSelecionado){
      el.classList.add('construtor-bloco--selecionado');
      _mod2Selecionado = bloco;
    }
  }
  el.addEventListener('click', selecionar);
  el.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); selecionar(); }
  });

  return el;
}

function mod2DeselecionarPaleta(){
  var paleta = $('construtor-paleta');
  if(paleta){
    paleta.querySelectorAll('.construtor-bloco--selecionado').forEach(function(b){
      b.classList.remove('construtor-bloco--selecionado');
    });
  }
  _mod2Selecionado = null;
}

/* ── Colocar/remover do slot — feedback IMEDIATO (correto/errado). */
function mod2ColocarNoSlot(bloco, idx, desafio){
  _mod2Slots[idx] = bloco;

  var slot = $('construtor-slot-' + idx);
  if(!slot) return;

  var correto = desafio.blocos_corretos[idx].texto === bloco.texto;

  slot.className = 'construtor-slot construtor-slot--preenchido construtor-bloco--' + bloco.tipo +
    (correto ? ' construtor-slot--correto' : ' construtor-slot--errado');
  slot.innerHTML =
    '<span class="construtor-slot-texto">' + bloco.texto + '</span>' +
    '<button type="button" class="construtor-slot-remover" title="Remover bloco" aria-label="Remover bloco ' + bloco.texto + '">&times;</button>';

  var btnRem = slot.querySelector('.construtor-slot-remover');
  btnRem.addEventListener('click', function(e){
    e.stopPropagation();
    mod2RemoverDoSlot(idx, desafio);
  });

  mod2RenderFormulaPreliminar();
  mod2AtualizarValidador();
}

function mod2RemoverDoSlot(idx, desafio){
  _mod2Slots[idx] = null;

  var slot = $('construtor-slot-' + idx);
  if(!slot) return;

  slot.className = 'construtor-slot construtor-slot--vazio';
  mod2PreencherPlaceholderSlot(slot, desafio, idx);
  mod2BindSlotVazio(slot, desafio, idx);

  mod2RenderFormulaPreliminar();
  mod2AtualizarValidador();
}

function mod2LimparSlots(desafio){
  desafio.blocos_corretos.forEach(function(_, idx){
    if(_mod2Slots[idx] !== null) mod2RemoverDoSlot(idx, desafio);
  });
  mod2DeselecionarPaleta();
  srAnnounce('Montagem limpa. Comece de novo.');
}

/* Fórmula-alvo revelada progressivamente, proporcional aos slots
   preenchidos CORRETAMENTE. */
function mod2RenderFormulaPreliminar(){
  var div = $('construtor-formula-preview');
  if(!div || !_mod2DesafioAtual) return;
  var corretos = _mod2DesafioAtual.blocos_corretos;
  var acertos = _mod2Slots.filter(function(b, i){ return b && corretos[i].texto === b.texto; }).length;
  var fracao = corretos.length ? acertos / corretos.length : 0;
  var alvo = _mod2DesafioAtual.formula;
  var visiveis = Math.round(alvo.length * fracao);
  var revelado = alvo.slice(0, visiveis);
  var oculto = alvo.slice(visiveis).replace(/[^\s]/g, '▢');

  div.innerHTML =
    '<p class="construtor-formula-preview-label">Fórmula preliminar</p>'+
    '<code class="construtor-formula-preview-valor">'+
      '<span class="revelado">'+revelado+'</span>'+
      '<span class="oculto">'+oculto+'</span>'+
    '</code>';
}

function mod2AtualizarValidador(){
  var div = $('construtor-validador');
  if(!div || !_mod2DesafioAtual) return;
  var corretos = _mod2DesafioAtual.blocos_corretos;
  var preenchidos = _mod2Slots.filter(function(b){ return b !== null; }).length;
  var acertos = _mod2Slots.filter(function(b, i){ return b && corretos[i].texto === b.texto; }).length;
  var errados = preenchidos - acertos;

  var estado, mensagem;
  if(preenchidos === 0){
    estado = 'vazio';
    mensagem = 'Arraste ou clique nos blocos para preencher os slots na área central.';
  } else if(errados > 0){
    estado = 'incorreto';
    mensagem = errados + ' bloco(s) no slot errado (marcado em vermelho). Confira o tipo indicado em cada posição.';
  } else if(preenchidos < corretos.length){
    estado = 'incompleto';
    mensagem = 'Até aqui está correto! Faltam ' + (corretos.length - preenchidos) + ' slot(s).';
  } else {
    estado = 'correto';
    /* SÓ AQUI, depois de resolvido de verdade, é que o nome completo
       aparece — recompensa final, não dica antecipada. */
    mensagem = '<svg class="icon" aria-hidden="true"><use href="#ic-check"/></svg> Nome completo e correto: "' + _mod2DesafioAtual.nome_correto + '"';
  }

  div.className = 'construtor-validador construtor-validador--' + estado;
  div.innerHTML = '<p class="construtor-validador-texto">' + mensagem + '</p>';

  if(estado === 'correto'){
    if(!_mod2Resolvidos[_mod2DesafioAtual.id]){
      _mod2Resolvidos[_mod2DesafioAtual.id] = true;
      mod2RenderBiblioteca(); // atualiza o selo "✓ resolvido" na lista
    }
    srAnnounce('Parabéns! Nome montado corretamente: ' + _mod2DesafioAtual.nome_correto);
  }
}

function initModulo2(){
  if(_mod2Iniciado) return;
  if(typeof DESAFIOS_CONSTRUTOR === 'undefined'){
    console.error('[modulo2] DESAFIOS_CONSTRUTOR não definido — verifique js/data/desafios-construtor.js.');
    return;
  }
  _mod2Iniciado = true;
  mod2MontarBiblioteca();
}

window.addEventListener('siqi:module-switch', function(e){
  if(e.detail && e.detail.module === 'construtor') initModulo2();
});

