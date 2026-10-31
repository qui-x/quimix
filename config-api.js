/* ================================================================
   config-api.js — CAMADA DE ACESSO À API (Apps Script)
   ================================================================
   Um único ponto de contato com o backend. Todo o resto do sistema
   de login (identidade.js, auth-formularios.js, conta.js,
   usuarios-admin.js) passa por chamarAPI()/chamarAPIGet() em vez de
   usar fetch() direto — assim, se o formato da chamada mudar um dia,
   muda só aqui.

   ----------------------------------------------------------------
   POR QUE POST SEM DEFINIR Content-Type
   ----------------------------------------------------------------
   fetch(url, { method:'POST', body: JSON.stringify(payload) }) sem
   um header Content-Type explícito faz o navegador mandar
   "text/plain" — e por ser um tipo "simples" pro CORS, o navegador
   NÃO manda a requisição de pré-verificação (OPTIONS) antes. Isso
   importa porque o Apps Script não trata OPTIONS por padrão: se o
   preflight acontecesse, a chamada falharia. Do lado do backend,
   Code.gs lê o corpo como texto (e.postData.contents) e faz
   JSON.parse() nele — o Content-Type declarado não importa ali.

   NÃO adicione headers em chamarAPI() sem entender essa parte.
   ================================================================ */


// TROQUE pela URL que o Google Apps Script te dá depois do deploy
// como Web App (termina em "/exec"). Veja LEIA-ME-LOGIN.md.
var API_URL = 'https://script.google.com/macros/s/AKfycbySUjd3ipVHWlT1MeV2oPnLg0nvZkIp-mwgbC0GOUB8L7kz_HSJtZY3_uL2_v5YeR-eFw/exec';

async function chamarAPI(payload) {
  var resposta = await fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    cache: 'no-store'
  });
  return resposta.json();
}

async function chamarAPIGet(params) {
  var query = Object.keys(params)
    .map(function (chave) { return encodeURIComponent(chave) + '=' + encodeURIComponent(params[chave]); })
    .join('&');
  // cache: 'no-store' é essencial aqui — sem isso, o navegador pode
  // decidir sozinho que uma resposta anterior pra essa MESMA URL
  // (mesma action + mesmo token) ainda "vale", e nunca chega a
  // perguntar pro servidor de novo. Pra verificarSessao isso é grave:
  // uma resposta velha (de quando a sessão ainda não existia, ou já
  // tinha expirado) ficaria "presa", fazendo a Central parecer
  // deslogar sozinha mesmo com um token válido.
  var resposta = await fetch(API_URL + '?' + query, { cache: 'no-store' });
  return resposta.json();
}

/* ---------------------------------------------------------------
   Erros de sessão/permissão que voltam do backend com um "codigo"
   (SESSAO_EXPIRADA, PERMISSAO_NEGADA) são tratados de um jeito
   central: se for sessão expirada, desloga na hora; se for
   permissão negada, só avisa. Retorna true se já cuidou do erro
   (quem chamou pode parar por ali), false se o chamador precisa
   mostrar o erro do jeito normal.
   --------------------------------------------------------------- */
function tratarErroSessaoOuPermissao(resposta) {
  if (!resposta || resposta.sucesso) return false;
  if (resposta.codigo === 'SESSAO_EXPIRADA') {
    alert('Sua sessão expirou. Faça login de novo.');
    encerrarSessaoLocal();
    return true;
  }
  if (resposta.codigo === 'PERMISSAO_NEGADA') {
    alert(resposta.erro || 'Você não tem permissão para essa ação.');
    return true;
  }
  return false;
}

/* ---------------------------------------------------------------
   Helpers de UI reaproveitados pelos formulários de conta/login.
   --------------------------------------------------------------- */
function mostrarMsg(elementoId, texto, tipo) {
  var el = document.getElementById(elementoId);
  if (!el) return;
  el.textContent = texto;
  el.className = 'auth-msg ' + (tipo === 'ok' ? 'ok' : 'erro');
  el.classList.remove('hidden');
}

function esconderMsg(elementoId) {
  var el = document.getElementById(elementoId);
  if (el) el.classList.add('hidden');
}

function definirCarregando(botao, carregando, textoNormal) {
  if (!botao) return;
  botao.disabled = carregando;
  botao.textContent = carregando ? 'Só um instante…' : textoNormal;
}

// Escapa texto antes de jogar dentro de innerHTML (nome/e-mail vêm
// da planilha — mesmo sendo dados "de confiança", mais vale prevenir).
function escaparHtml_(texto) {
  var div = document.createElement('div');
  div.textContent = texto === null || texto === undefined ? '' : String(texto);
  return div.innerHTML;
}
