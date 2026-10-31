/* ================================================================
   guarda-admin.js — GUARDA DE SESSÃO E PAPEL DA PÁGINA "ADMINISTRAÇÃO"
   ================================================================
   Só existe nesta página. Mesmo contrato do guarda-conta.js (sem
   sessão válida, não tem o que mostrar, volta pra Central), mais uma
   camada extra: sem sessão válida OU papel diferente de
   "administrador", ninguém vê nada daqui — nem por um instante antes
   do redirecionamento. Reaproveita CHAVE_TOKEN, chamarAPIGet() e
   carregarUsuariosSeNecessario() já carregados pelos scripts
   anteriores (config-api.js, identidade.js, usuarios-admin.js).
   ================================================================ */

(async function guardaAdmin() {
  var tokenSalvo = null;
  try { tokenSalvo = localStorage.getItem(CHAVE_TOKEN); } catch (e) { /* sem localStorage: sem sessão possível */ }

  if (!tokenSalvo) {
    window.location.href = 'index.html';
    return;
  }

  try {
    var resposta = await chamarAPIGet({ action: 'verificarSessao', token: tokenSalvo });
    if (!resposta.sucesso) throw new ErroSessaoInvalida_(resposta.erro || 'Sessão inválida.');

    sessaoUsuario = {
      token: tokenSalvo,
      idUsuario: resposta.dados.idUsuario,
      nome: resposta.dados.nome,
      email: resposta.dados.email,
      papel: resposta.dados.papel
    };

    // Diferente do guarda-conta.js: aqui uma sessão válida não basta.
    // Sem papel de administrador, volta pra Central sem mostrar nada
    // — mesma mensagem que exigirAdministrador() usa em qualquer
    // outra ação restrita do site.
    if (!souAdmin()) {
      alert('Essa página é exclusiva de administradores.');
      window.location.href = 'index.html';
      return;
    }

    var main = document.getElementById('conteudo-admin');
    if (main) main.classList.remove('hidden');
    carregarUsuariosSeNecessario(false);
  } catch (erro) {
    // Administração só faz sentido conversando com o servidor (aprovar
    // gente, mudar papel, apagar conta — tudo escrita no backend), não
    // existe versão offline pra ela. Explica antes de voltar, em vez
    // de um redirecionamento silencioso.
    if (erro instanceof ErroSessaoInvalida_) {
      console.error('Sessão salva não pôde ser restaurada:', erro.message);
    } else {
      console.error('Sem conexão com o servidor agora:', erro);
      alert('Não foi possível abrir "Administração" agora — parece que você está sem internet. Esta página precisa de conexão; os simuladores continuam funcionando offline normalmente.');
    }
    window.location.href = 'index.html';
  }
})();
