/* ================================================================
   conta.js — "MINHA CONTA"
   ================================================================
   Modal aberto pelo botão "Minha conta" na barra de identidade.
   Mostra nome/e-mail/papel e o botão de solicitar troca de senha
   (disponível pra qualquer papel — o administrador vê um aviso
   diferente, porque o fluxo dele pra recuperar a própria senha é
   sair e usar "Esqueceu sua senha?" na tela de login).
   ================================================================ */

function abrirModalConta() {
  renderContaView();
  document.getElementById('modal-conta').classList.remove('hidden');
}

function fecharModalConta() {
  var modal = document.getElementById('modal-conta');
  if (modal) modal.classList.add('hidden');
}

function renderContaView() {
  if (!sessaoUsuario) return;

  var info = document.getElementById('conta-info');
  if (info) {
    info.innerHTML =
      '<div class="linha"><span class="rotulo">Nome</span><span>' + escaparHtml_(sessaoUsuario.nome) + '</span></div>' +
      '<div class="linha"><span class="rotulo">E-mail</span><span>' + escaparHtml_(sessaoUsuario.email) + '</span></div>' +
      '<div class="linha"><span class="rotulo">Papel</span><span class="role-badge ' + (souAdmin() ? 'admin' : '') + '">' + escaparHtml_(sessaoUsuario.papel) + '</span></div>';
  }

  document.getElementById('conta-membro-area').classList.toggle('hidden', souAdmin());
  document.getElementById('conta-admin-area').classList.toggle('hidden', !souAdmin());
  document.getElementById('conta-admin-atalho').classList.toggle('hidden', !souAdmin());

  var status = document.getElementById('conta-reset-status');
  if (status) status.textContent = '';
  var botao = document.getElementById('solicitar-reset-btn');
  if (botao) { botao.disabled = false; botao.textContent = 'Solicitar nova senha'; }

  renderProgresso();
}

/* ----------------------------------------------------------------
   "Seu progresso" — reaproveita o que o tour guiado (coachmark.js)
   já grava sozinho no localStorage (quimix_coach_visto_<id>) toda
   vez que alguém vê o tour de boas-vindas de um simulador pela
   primeira vez. Sem backend, sem tabela nova — só lendo de novo o
   que já existe.

   De propósito SEM um "de 21" fixo no texto: o 3º ano ainda não tem
   tour de boas-vindas (só o 1º e o 2º ano têm, 16 ao todo hoje), e
   prometer uma fração errada seria pior que não mostrar fração
   nenhuma. Conforme o 3º ano ganhar tour, o número sobe sozinho —
   o código não precisa mudar. ---------------------------------- */
function renderProgresso() {
  var texto = document.getElementById('conta-progresso-texto');
  var barra = document.getElementById('conta-progresso-barra');
  if (!texto || !barra) return;

  var vistos = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var chave = localStorage.key(i);
      if (chave && chave.indexOf('quimix_coach_visto_') === 0 && chave.indexOf('boas-vindas') !== -1) {
        vistos++;
      }
    }
  } catch (e) { /* sem localStorage: sem como contar — fica em 0 */ }

  if (vistos === 0) {
    texto.textContent = 'Você ainda não abriu nenhum simulador neste navegador. Comece por qualquer um — o tour de boas-vindas te mostra como funciona.';
    barra.style.width = '4%';
  } else {
    texto.innerHTML = 'Você já conheceu <strong>' + vistos + '</strong> simulador' + (vistos === 1 ? '' : 'es') + ' diferente' + (vistos === 1 ? '' : 's') + ' neste navegador.';
    barra.style.width = Math.max(6, Math.min(100, vistos * 6)) + '%';
  }
}


async function handleSolicitarReset() {
  if (!sessaoUsuario) return;
  var botao = document.getElementById('solicitar-reset-btn');
  definirCarregando(botao, true, 'Solicitar nova senha');
  try {
    var resposta = await chamarAPI({ action: 'solicitarResetSenha', token: sessaoUsuario.token });
    if (!resposta.sucesso && tratarErroSessaoOuPermissao(resposta)) return;

    var status = document.getElementById('conta-reset-status');
    if (status) status.textContent = resposta.mensagem || resposta.erro || '';

    if (resposta.sucesso) {
      botao.disabled = true;
      botao.textContent = 'Solicitação enviada';
      return;
    }
  } catch (erro) {
    console.error(erro);
    var status2 = document.getElementById('conta-reset-status');
    if (status2) status2.textContent = 'Não foi possível conectar. Tente de novo.';
  }
  definirCarregando(botao, false, 'Solicitar nova senha');
}
