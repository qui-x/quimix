/* ================================================================
   estado-sessao.js — ESTADO DA SESSÃO EM MEMÓRIA
   ================================================================
   Só o que os outros arquivos de login precisam ler/mudar em
   qualquer momento. Nada aqui é salvo sozinho — quem salva é
   identidade.js (sessionStorage, só o token).
   ================================================================ */

// Preenchido por aplicarSessao()/iniciarSessao() em identidade.js.
// Formato: { token, idUsuario, nome, email, papel }
var sessaoUsuario = null;

// Cache do painel de administração, pra não recarregar a lista toda
// vez que o modal abre — só quando pedido explicitamente (botão
// "atualizar") ou depois de uma ação que muda os dados.
var usuariosRoster = [];
var atividadeLog = [];
var usuariosCarregado = false;

function souAdmin() {
  return !!(sessaoUsuario && sessaoUsuario.papel === 'administrador');
}

function exigirAdministrador() {
  if (!souAdmin()) {
    alert('Essa ação é exclusiva de administradores.');
    return false;
  }
  return true;
}
