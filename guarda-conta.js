/* ================================================================
   guarda-conta.js — GUARDA DE SESSÃO DA PÁGINA "MINHA CONTA"
   ================================================================
   Só existe nesta página. index.html tem seu próprio portão
   (#auth-gate) cuidado por iniciarSessao() em identidade.js; aqui é
   mais simples — sem sessão válida, não tem o que mostrar, então só
   volta pra Central. Reaproveita CHAVE_TOKEN, chamarAPIGet() e
   renderContaView()/sessaoUsuario já carregados pelos scripts
   anteriores (config-api.js, identidade.js, conta.js).
   ================================================================ */

(async function guardaConta() {
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

    renderContaView();
    var main = document.getElementById('conteudo-conta');
    if (main) main.classList.remove('hidden');
  } catch (erro) {
    // "Minha conta" mexe com dado sensível (senha, e-mail) e não tem
    // uma versão offline que faça sentido — ao contrário da Central,
    // aqui não tentamos usar uma sessão em cache. Mas explicamos O
    // QUE aconteceu antes de voltar, em vez de um redirecionamento
    // silencioso que só parece "a página sumiu".
    if (erro instanceof ErroSessaoInvalida_) {
      console.error('Sessão salva não pôde ser restaurada:', erro.message);
    } else {
      console.error('Sem conexão com o servidor agora:', erro);
      alert('Não foi possível abrir "Minha conta" agora — parece que você está sem internet. Esta página precisa de conexão; os simuladores continuam funcionando offline normalmente.');
    }
    window.location.href = 'index.html';
  }
})();
