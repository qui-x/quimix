/* ================================================================
   identidade.js — ABRIR/FECHAR O PORTÃO DE LOGIN
   ================================================================
   Cuida do ciclo de vida da sessão: aplicar uma sessão nova (depois
   de login/cadastro), restaurar uma sessão salva ao abrir a página,
   e encerrar a sessão (local e no servidor).

   O <main id="conteudo"> só aparece depois de aplicarSessao() — e o
   botão de menu (hambúrguer) segue o mesmo destino: ele dá acesso a
   conta, simuladores e acessibilidade, então só faz sentido DEPOIS
   do login (mostrar simuladores/conta pra quem ainda não entrou não
   faz sentido). Por isso #drawerToggle começa com o atributo hidden
   direto no HTML — falha "fechado": se o JS falhar, o botão nunca
   aparece antes da hora, em vez do contrário.

   ----------------------------------------------------------------
   TRÊS FORMAS DE "ESTAR DENTRO" (setembro/2026)
   ----------------------------------------------------------------
   1. Sessão normal, verificada agora mesmo com o servidor.
   2. Sessão em CACHE: havia um token salvo, mas o servidor não
      respondeu (sem internet agora) — usamos o retrato da ÚLTIMA
      verificação que deu certo (nome/e-mail/papel), guardado à
      parte. Corrige um bug real: antes, ficar sem rede por um
      instante DESLOGAVA a pessoa, mesmo com uma sessão válida.
      Só dura enquanto durar o cache do navegador — na próxima vez
      que houver internet, a verificação de verdade roda de novo e
      substitui o retrato.
   3. Modo VISITANTE: quem nunca teve conta (ou não quer uma agora)
      pode entrar sem login, direto da tela de login. Sem token, sem
      papel de verdade, sem "Minha conta"/"Administração" — só os
      simuladores, que já são 100% client-side. Fica salvo local até
      a pessoa sair ou entrar de verdade.
   ================================================================ */

var CHAVE_TOKEN          = 'quimix_token';          // localStorage: sobrevive a F5, a trocar de aba e ao
                                                      // navegador descartar a aba da memória (comum no Android
                                                      // quando o app fica em segundo plano). Quem expira a
                                                      // sessão de verdade é o servidor (VALIDADE_SESSAO_HORAS).
var CHAVE_SESSAO_CACHE   = 'quimix_sessao_cache';    // retrato {idUsuario,nome,email,papel} da ÚLTIMA vez que
                                                      // o servidor confirmou essa sessão — usado só quando não
                                                      // há como perguntar de novo (sem internet).
var CHAVE_MODO_VISITANTE = 'quimix_modo_visitante';  // '1' enquanto alguém estiver usando sem conta.

/* Erro "de verdade" (o servidor respondeu e disse que a sessão não
   vale mais) — diferente de um fetch() que nem chegou a sair do
   aparelho. iniciarSessao() trata os dois de formas diferentes. */
function ErroSessaoInvalida_(mensagem) { this.message = mensagem; }
ErroSessaoInvalida_.prototype = Object.create(Error.prototype);

function salvarSessaoCache_(dados) {
  try {
    localStorage.setItem(CHAVE_SESSAO_CACHE, JSON.stringify({
      idUsuario: dados.idUsuario, nome: dados.nome, email: dados.email, papel: dados.papel
    }));
  } catch (e) { /* modo privado: sem cache offline possível, sem problema */ }
}

function lerSessaoCache_() {
  try {
    var bruto = localStorage.getItem(CHAVE_SESSAO_CACHE);
    return bruto ? JSON.parse(bruto) : null;
  } catch (e) { return null; }
}

function limparSessaoCache_() {
  try { localStorage.removeItem(CHAVE_SESSAO_CACHE); } catch (e) { /* nada a fazer */ }
}

/* ---------------------------------------------------------------
   Aviso fixo no topo — só aparece nas sessões 2 e 3 (cache/offline
   ou visitante). #aviso-modo-sessao mora no HTML, começa hidden.
   --------------------------------------------------------------- */
function mostrarAvisoModoSessao_(texto, variante) {
  var b = document.getElementById('aviso-modo-sessao');
  if (!b) return;
  b.textContent = texto;
  b.className = 'aviso-modo-sessao aviso-modo-sessao--' + variante;
  b.hidden = false;
}
function esconderAvisoModoSessao_() {
  var b = document.getElementById('aviso-modo-sessao');
  if (b) b.hidden = true;
}

function aplicarSessao(dadosLogin) {
  sessaoUsuario = {
    token: dadosLogin.token,
    idUsuario: dadosLogin.idUsuario,
    nome: dadosLogin.nome,
    email: dadosLogin.email,
    papel: dadosLogin.papel
  };
  try { localStorage.setItem(CHAVE_TOKEN, dadosLogin.token); } catch (e) { /* modo privado: segue só na memória */ }
  try { localStorage.removeItem(CHAVE_MODO_VISITANTE); } catch (e) { /* nada a fazer */ } // login de verdade sempre substitui um modo visitante salvo
  salvarSessaoCache_(sessaoUsuario);
  esconderAvisoModoSessao_();
  mostrarConteudoLiberado_();
}

/* Entra sem conta nenhuma — chamado pelo link "Usar sem conta" na
   tela de login, ou sozinho ao recarregar a página se a pessoa já
   tinha escolhido isso antes (ver iniciarSessao()). Sem token: as
   páginas que exigem sessão de verdade (Minha conta, Administração)
   continuam fora de alcance — só os simuladores ficam liberados. */
function entrarComoVisitante() {
  sessaoUsuario = { visitante: true, papel: 'visitante', nome: 'Visitante', email: '', token: null };
  try { localStorage.setItem(CHAVE_MODO_VISITANTE, '1'); } catch (e) { /* nada a fazer — só não persiste entre recargas */ }
  mostrarAvisoModoSessao_('Modo visitante — sem conta. Seu progresso não é salvo nem sincronizado.', 'visitante');
  mostrarConteudoLiberado_();
}

async function handleLogout() {
  var token = sessaoUsuario ? sessaoUsuario.token : null;
  encerrarSessaoLocal();
  if (token) {
    try { await chamarAPI({ action: 'logout', token: token }); } catch (erro) { /* já saímos localmente, não precisa travar por isso */ }
  }
}

function encerrarSessaoLocal() {
  sessaoUsuario = null;
  usuariosCarregado = false;
  usuariosRoster = [];
  atividadeLog = [];
  try { localStorage.removeItem(CHAVE_TOKEN); } catch (e) { /* nada a fazer */ }
  try { localStorage.removeItem(CHAVE_MODO_VISITANTE); } catch (e) { /* nada a fazer */ }
  limparSessaoCache_();
  esconderAvisoModoSessao_();

  var _ct2 = document.getElementById('conteudo'); if (_ct2) _ct2.classList.add('hidden');
  var _ib = document.getElementById('identity-bar'); if (_ib) _ib.classList.add('hidden');
  var _mns = document.getElementById('modal-nova-senha'); if (_mns) _mns.classList.add('hidden');
  if (typeof fecharModalConta === 'function') fecharModalConta();
  if (typeof fecharModalAdmin === 'function') fecharModalAdmin();
  esconderMenuPrincipal();

  // Páginas sem #auth-gate (hoje, só minha-conta.html) não têm como
  // "mostrar a tela de login de novo" no lugar — a tela de login só
  // existe na Central. Sem sessão, não há mais nada pra fazer aqui, então
  // volta pra lá (com os parâmetros de acessibilidade, via a11y.js).
  if (!document.getElementById('auth-gate')) {
    window.location.href = 'index.html';
    return;
  }
  var _ag2 = document.getElementById('auth-gate'); if (_ag2) _ag2.classList.remove('hidden');
  if (typeof mostrarAuthView === 'function') mostrarAuthView('login');
}

// Mostra/esconde o botão de menu (hambúrguer) e, ao esconder, garante
// que a gaveta não fique aberta por trás da tela de login caso o
// usuário saia com ela aberta. #drawerToggle/#appDrawer podem não
// existir ainda dependendo da ordem de carregamento dos scripts —
// por isso os elementos são buscados de novo aqui, sem cache.
function mostrarMenuPrincipal() {
  // O botão em si (#drawerToggle) fica SEMPRE visível, mesmo na tela
  // de login — é o único jeito de chegar em Acessibilidade antes de
  // entrar, e isso precisa continuar funcionando pra quem depende de
  // alto contraste/fonte maior só pra conseguir ler o formulário.
  // Só a parte de Conta+Simuladores (que não faz sentido pré-login)
  // liga/desliga aqui — ver #drawerAuthOnlySection no HTML.
  var authOnly = document.getElementById('drawerAuthOnlySection');
  if (authOnly) authOnly.hidden = false;
  // Aviso pra quem quiser reagir ao menu ficar disponível (hoje, só
  // o tour guiado da home — ver script.js) sem acoplar os dois
  // arquivos diretamente.
  window.dispatchEvent(new CustomEvent('quimix:menu-liberado'));
}
function esconderMenuPrincipal() {
  var authOnly = document.getElementById('drawerAuthOnlySection');
  var drawer = document.getElementById('appDrawer');
  var backdrop = document.getElementById('drawerBackdrop');
  if (drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
  if (backdrop) { backdrop.classList.remove('open'); backdrop.hidden = true; }
  if (authOnly) authOnly.hidden = true;
  var toggle = document.getElementById('drawerToggle');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

// Esconde/mostra tudo que tem [data-papel="administrador"] (hoje, o
// botão "Administração") — e também [data-requer="conta"] (hoje,
// "Minha conta"), que faz sentido pra sessão normal OU em cache, mas
// não pro modo visitante (sem conta = nada pra ver lá).
function aplicarPermissoesPapel() {
  var admin = souAdmin();
  var temConta = !!(sessaoUsuario && !sessaoUsuario.visitante);
  var elementosAdmin = document.querySelectorAll('[data-papel="administrador"]');
  for (var i = 0; i < elementosAdmin.length; i++) elementosAdmin[i].classList.toggle('hidden', !admin);
  var elementosConta = document.querySelectorAll('[data-requer="conta"]');
  for (var j = 0; j < elementosConta.length; j++) elementosConta[j].classList.toggle('hidden', !temConta);
}

function atualizarBarraIdentidade() {
  if (!sessaoUsuario) return;
  var texto = document.getElementById('identity-status-texto');
  if (texto) texto.textContent = sessaoUsuario.nome;
  document.getElementById('identity-bar').classList.remove('hidden');
}

function mostrarConteudoLiberado_() {
  var _ag = document.getElementById('auth-gate'); if (_ag) _ag.classList.add('hidden');
  var _ct = document.getElementById('conteudo'); if (_ct) _ct.classList.remove('hidden');
  mostrarMenuPrincipal();
  aplicarPermissoesPapel();
  atualizarBarraIdentidade();
}

/* ---------------------------------------------------------------
   Ponto de entrada: roda ao carregar a página.
   --------------------------------------------------------------- */
async function iniciarSessao() {
  var tokenSalvo = null;
  try { tokenSalvo = localStorage.getItem(CHAVE_TOKEN); } catch (e) { /* sem localStorage: segue pro login */ }

  if (!tokenSalvo) {
    var modoVisitanteSalvo = false;
    try { modoVisitanteSalvo = localStorage.getItem(CHAVE_MODO_VISITANTE) === '1'; } catch (e) { /* nada a fazer */ }
    if (modoVisitanteSalvo) { entrarComoVisitante(); return; }

    var _ag3 = document.getElementById('auth-gate'); if (_ag3) _ag3.classList.remove('hidden');
    return;
  }

  // Se houver um token salvo, confirma com o backend antes de confiar
  // nele (pode ter expirado, ou a conta pode ter sido removida nesse
  // meio-tempo) — MAS um fetch() que nem saiu do aparelho (sem
  // internet agora) não é a mesma coisa que o servidor dizer "não".
  try {
    var resposta;
    try {
      resposta = await chamarAPIGet({ action: 'verificarSessao', token: tokenSalvo });
    } catch (erroFetch) {
      // Ainda dentro do try externo, mas isolado aqui: um erro NESTE
      // ponto especificamente é sempre "a chamada não voltou" — rede
      // caiu, DNS falhou, CORS bloqueou a leitura da resposta, etc.
      // Nunca é "o servidor disse não" (isso só existe depois, quando
      // resposta.sucesso === false). Log detalhado pra conseguir
      // diferenciar esses casos se isso voltar a acontecer — abra o
      // DevTools (Ctrl+Shift+I ou o menu do app) pra ver esta linha.
      console.warn('[QuímiX] verificarSessao: a chamada de rede falhou (não é rejeição do servidor).', {
        tipo: erroFetch && erroFetch.name,
        mensagem: erroFetch && erroFetch.message,
        online: typeof navigator !== 'undefined' ? navigator.onLine : 'desconhecido'
      });
      throw erroFetch;
    }

    if (!resposta.sucesso) {
      console.warn('[QuímiX] verificarSessao: o servidor respondeu e recusou o token.', resposta);
      throw new ErroSessaoInvalida_(resposta.erro || 'Sessão inválida.');
    }

    sessaoUsuario = {
      token: tokenSalvo,
      idUsuario: resposta.dados.idUsuario,
      nome: resposta.dados.nome,
      email: resposta.dados.email,
      papel: resposta.dados.papel
    };
    salvarSessaoCache_(sessaoUsuario);
    esconderAvisoModoSessao_();
    mostrarConteudoLiberado_();
  } catch (erro) {
    if (erro instanceof ErroSessaoInvalida_) {
      // O servidor respondeu e foi claro: essa sessão não vale mais.
      console.error('Sessão salva não pôde ser restaurada:', erro.message);
      encerrarSessaoLocal();
      return;
    }

    // Qualquer outro erro aqui (fetch rejeitado, DNS, timeout, sem
    // internet) é uma falha de REDE, não uma resposta do servidor.
    // Em vez de deslogar quem tem uma sessão válida só porque a rede
    // caiu, usa o retrato da última verificação que deu certo.
    console.warn('Sem conexão com o servidor de login agora — tentando usar a sessão em cache:', erro);
    var cache = lerSessaoCache_();
    if (cache) {
      sessaoUsuario = {
        token: tokenSalvo,
        idUsuario: cache.idUsuario, nome: cache.nome, email: cache.email, papel: cache.papel,
        offline: true
      };
      console.info('[QuímiX] Entrando com a sessão em cache (offline).', cache);
      mostrarAvisoModoSessao_('Sem conexão agora — mostrando sua última sessão salva. "Minha conta" e "Administração" exigem internet.', 'offline');
      mostrarConteudoLiberado_();
    } else {
      // Nunca confirmamos essa sessão com sucesso antes (ou o cache foi
      // limpo) — sem nada confiável pra mostrar offline, então segue
      // pro login normal (que também vai falhar sem rede, mas ao menos
      // não finge uma sessão que nunca foi validada).
      console.warn('[QuímiX] Sem cache de sessão pra usar — mostrando tela de login.');
      var _ag5 = document.getElementById('auth-gate'); if (_ag5) _ag5.classList.remove('hidden');
    }
  }
}

// Só dispara sozinho em páginas que TÊM #auth-gate (hoje, só a
// Central). minha-conta.html carrega este arquivo pelas funções
// compartilhadas (sessaoUsuario, aplicarPermissoesPapel etc.), mas
// tem sua PRÓPRIA guarda de sessão (ver guarda-conta.js) — sem esta
// checagem, os dois rodariam em paralelo, e iniciarSessao() ainda
// tentaria mexer num #auth-gate que não existe ali.
if (document.getElementById('auth-gate')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarSessao);
  } else {
    iniciarSessao();
  }
}
