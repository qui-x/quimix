/* ================================================================
   auth-formularios.js — LOGIN, CADASTRO, ESQUECI SENHA, NOVA SENHA
   ================================================================
   Lógica dos 3 formulários dentro de #auth-gate (login / cadastro /
   esqueci-senha) e do modal de troca de senha obrigatória, que
   aparece quando alguém entra com um código temporário.
   ================================================================ */

function mostrarAuthView(nome) {
  ['login', 'cadastro', 'esqueci'].forEach(function (v) {
    var view = document.getElementById('auth-view-' + v);
    if (view) view.classList.toggle('hidden', v !== nome);
  });
  esconderMsg('login-msg');
  esconderMsg('cadastro-msg');
  esconderMsg('esqueci-msg');

  var primeiroCampo = document.querySelector('#auth-view-' + nome + ' input');
  if (primeiroCampo) primeiroCampo.focus();
}

async function handleLogin(evento) {
  evento.preventDefault();
  var email = document.getElementById('login-email').value.trim();
  var senha = document.getElementById('login-senha').value;
  var botao = document.getElementById('login-btn');

  esconderMsg('login-msg');
  definirCarregando(botao, true, 'Entrar');
  try {
    var resposta = await chamarAPI({ action: 'login', email: email, senha: senha });
    if (!resposta.sucesso) {
      mostrarMsg('login-msg', resposta.erro || 'Não foi possível entrar.', 'erro');
      return;
    }
    if (resposta.dados.precisaTrocarSenha) {
      // Guarda os dados da sessão temporariamente: só vira "sessão de
      // verdade" (aplicarSessao) depois que a nova senha for definida.
      window._loginPendenteTrocaSenha = resposta.dados;
      abrirModalNovaSenha();
      return;
    }
    document.getElementById('login-senha').value = '';
    aplicarSessao(resposta.dados);
  } catch (erro) {
    console.error(erro);
    mostrarMsg('login-msg', 'Não foi possível conectar. Confira sua internet e tente de novo.', 'erro');
  } finally {
    definirCarregando(botao, false, 'Entrar');
  }
}

async function handleCadastro(evento) {
  evento.preventDefault();
  var nome = document.getElementById('cadastro-nome').value.trim();
  var email = document.getElementById('cadastro-email').value.trim();
  var senha = document.getElementById('cadastro-senha').value;
  var senha2 = document.getElementById('cadastro-senha2').value;
  var botao = document.getElementById('cadastro-btn');

  esconderMsg('cadastro-msg');
  if (senha !== senha2) {
    mostrarMsg('cadastro-msg', 'As senhas não conferem.', 'erro');
    return;
  }

  definirCarregando(botao, true, 'Criar conta');
  try {
    var resposta = await chamarAPI({
      action: 'cadastrar', nome: nome, email: email, senha: senha, confirmarSenha: senha2
    });
    if (!resposta.sucesso) {
      mostrarMsg('cadastro-msg', resposta.erro || 'Não foi possível criar a conta.', 'erro');
      return;
    }

    // De propósito NÃO loga automaticamente: a conta precisa ser
    // aprovada por um administrador antes (ver Code.gs).
    document.getElementById('cadastro-nome').value = '';
    document.getElementById('cadastro-email').value = '';
    document.getElementById('cadastro-senha').value = '';
    document.getElementById('cadastro-senha2').value = '';
    mostrarMsg('cadastro-msg', resposta.mensagem || 'Conta criada! Aguarde a aprovação de um administrador.', 'ok');
  } catch (erro) {
    console.error(erro);
    mostrarMsg('cadastro-msg', 'Não foi possível conectar. Confira sua internet e tente de novo.', 'erro');
  } finally {
    definirCarregando(botao, false, 'Criar conta');
  }
}

async function handleEsqueciSenha(evento) {
  evento.preventDefault();
  var email = document.getElementById('esqueci-email').value.trim();
  var botao = document.getElementById('esqueci-btn');

  esconderMsg('esqueci-msg');
  definirCarregando(botao, true, 'Enviar código');
  try {
    var resposta = await chamarAPI({ action: 'esqueciSenha', email: email });
    mostrarMsg('esqueci-msg', resposta.mensagem || resposta.erro || 'Se esse e-mail existir, o código já foi enviado.', resposta.sucesso ? 'ok' : 'erro');
  } catch (erro) {
    console.error(erro);
    mostrarMsg('esqueci-msg', 'Não foi possível conectar. Confira sua internet e tente de novo.', 'erro');
  } finally {
    definirCarregando(botao, false, 'Enviar código');
  }
}

function abrirModalNovaSenha() {
  document.getElementById('nova-senha-1').value = '';
  document.getElementById('nova-senha-2').value = '';
  esconderMsg('nova-senha-msg');
  document.getElementById('modal-nova-senha').classList.remove('hidden');
  var campo = document.getElementById('nova-senha-1');
  if (campo) campo.focus();
}

async function handleDefinirNovaSenha(evento) {
  evento.preventDefault();
  var dadosPendentes = window._loginPendenteTrocaSenha;
  if (!dadosPendentes) return;

  var s1 = document.getElementById('nova-senha-1').value;
  var s2 = document.getElementById('nova-senha-2').value;
  var botao = document.getElementById('nova-senha-btn');

  esconderMsg('nova-senha-msg');
  if (s1 !== s2) {
    mostrarMsg('nova-senha-msg', 'As senhas não conferem.', 'erro');
    return;
  }

  definirCarregando(botao, true, 'Salvar nova senha');
  try {
    var resposta = await chamarAPI({
      action: 'definirNovaSenha', token: dadosPendentes.token, novaSenha: s1, confirmarNovaSenha: s2
    });
    if (!resposta.sucesso) {
      mostrarMsg('nova-senha-msg', resposta.erro || 'Não foi possível salvar a nova senha.', 'erro');
      return;
    }
    document.getElementById('modal-nova-senha').classList.add('hidden');
    dadosPendentes.precisaTrocarSenha = false;
    window._loginPendenteTrocaSenha = null;
    aplicarSessao(dadosPendentes);
  } catch (erro) {
    console.error(erro);
    mostrarMsg('nova-senha-msg', 'Não foi possível conectar. Confira sua internet e tente de novo.', 'erro');
  } finally {
    definirCarregando(botao, false, 'Salvar nova senha');
  }
}
