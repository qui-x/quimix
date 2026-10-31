/* ================================================================
   usuarios-admin.js — ADMINISTRAÇÃO DE USUÁRIOS
   ================================================================
   Lógica da página administracao.html (ver guarda-admin.js, que
   chama carregarUsuariosSeNecessario() assim que confirma sessão +
   papel de administrador — antes era um modal aberto por um botão
   na Central, hoje é uma página própria, no mesmo padrão de
   minha-conta.html).

   Duas listas:
   - Pedidos de acesso (aprovado=false): quem se cadastrou pela tela
     de login e ainda não pode entrar. Só dá pra Aprovar ou Recusar.
   - Contas (aprovado=true): promover/rebaixar, remover, e enviar o
     código temporário pra quem pediu troca de senha em "Minha conta".

   Também mostra as últimas linhas do log de atividade.
   ================================================================ */

async function carregarUsuariosSeNecessario(forcar) {
  if (!sessaoUsuario || !souAdmin()) return;
  if (usuariosCarregado && !forcar) { renderUsuarios(); return; }

  try {
    var resposta = await chamarAPIGet({ action: 'listarUsuarios', token: sessaoUsuario.token });
    if (!resposta.sucesso) {
      if (tratarErroSessaoOuPermissao(resposta)) return;
      throw new Error(resposta.erro || 'Falha ao carregar usuários.');
    }
    usuariosRoster = (resposta.dados && resposta.dados.usuarios) || [];
    atividadeLog = (resposta.dados && resposta.dados.log) || [];
    usuariosCarregado = true;
  } catch (erro) {
    console.error('Erro ao carregar usuários:', erro);
    usuariosRoster = [];
    atividadeLog = [];
  }
  renderUsuarios();
}

function renderUsuarios() {
  var pendentes = usuariosRoster.filter(function (u) { return !u.aprovado; });
  var aprovados = usuariosRoster.filter(function (u) { return u.aprovado; });

  var blocoPendentes = document.getElementById('pending-block');
  var listaPendentes = document.getElementById('pending-list');
  if (blocoPendentes && listaPendentes) {
    blocoPendentes.classList.toggle('hidden', pendentes.length === 0);
    listaPendentes.innerHTML = pendentes.map(linhaPendente_).join('');
  }

  var listaUsuarios = document.getElementById('user-list');
  if (listaUsuarios) {
    listaUsuarios.innerHTML = aprovados.length ? aprovados.map(linhaUsuario_).join('')
      : '<div class="empty-hint">Nenhuma conta aprovada ainda.</div>';
  }

  var listaLog = document.getElementById('log-list');
  if (listaLog) {
    listaLog.innerHTML = atividadeLog.length ? atividadeLog.map(linhaLog_).join('')
      : '<div class="empty-hint">Nenhuma atividade registrada ainda.</div>';
  }
}

function linhaPendente_(u) {
  return '<div class="user-row">' +
      '<span class="user-row-name">' + escaparHtml_(u.nome) +
        ' <span class="user-row-email">' + escaparHtml_(u.email) + '</span>' +
      '</span>' +
      '<span class="row-btns">' +
        '<button type="button" class="aprovar-btn" title="Aprovar acesso" onclick="handleAprovarUsuario(\'' + u.idUsuario + '\')"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M20 6 9 17l-5-5"/></svg> Aprovar</button>' +
        '<button type="button" class="del-x-btn" title="Recusar pedido" onclick="handleRejeitarCadastro(\'' + u.idUsuario + '\')">Recusar</button>' +
      '</span>' +
    '</div>';
}

function linhaUsuario_(u) {
  var souEu = sessaoUsuario && String(u.idUsuario) === String(sessaoUsuario.idUsuario);
  var badge = '<span class="role-badge' + (u.papel === 'administrador' ? ' admin' : '') + '">' + escaparHtml_(u.papel) + '</span>';
  var pendente = u.resetPendente ? '<span class="pending-reset-badge"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-1px"><circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.5 12.5 19 4M15 8l3 3M18 5l2 2"/></svg> pediu troca de senha</span>' : '';

  var acoes;
  if (souEu) {
    acoes = '<span class="empty-hint" style="padding:0;">é você</span>';
  } else {
    var proximoPapel = u.papel === 'administrador' ? 'membro' : 'administrador';
    var rotuloPapel = u.papel === 'administrador' ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-1px"><path d="M12 5v14M5 12l7 7 7-7"/></svg> tornar membro' : '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-1px"><path d="M12 19V5M5 12l7-7 7 7"/></svg> tornar admin';
    acoes =
      '<button type="button" class="del-x-btn" title="Alterar papel" onclick="handleAlterarPapel(\'' + u.idUsuario + '\',\'' + proximoPapel + '\')">' + rotuloPapel + '</button>';
    if (u.resetPendente) {
      acoes += '<button type="button" class="del-x-btn" title="Enviar código temporário" onclick="handleAdminEnviarReset(\'' + u.idUsuario + '\')">Enviar código</button>';
    }
    acoes += '<button type="button" class="del-x-btn" title="Remover conta" onclick="handleRemoverUsuario(\'' + u.idUsuario + '\')"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="vertical-align:-2px"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>';
  }

  return '<div class="user-row">' +
      '<span class="user-row-name">' + escaparHtml_(u.nome) +
        ' <span class="user-row-email">' + escaparHtml_(u.email) + '</span> ' + badge + ' ' + pendente +
      '</span>' +
      '<span class="row-btns">' + acoes + '</span>' +
    '</div>';
}

function linhaLog_(l) {
  var data = l.dataHora ? new Date(l.dataHora).toLocaleString('pt-BR') : '—';
  return '<div class="log-row">' +
      '<span class="log-row-data">' + escaparHtml_(data) + '</span>' +
      '<span class="log-row-usuario">' + escaparHtml_(l.usuario) + '</span>' +
      '<span class="log-row-acao">' + escaparHtml_(l.acao) + '</span>' +
    '</div>';
}

async function handleAprovarUsuario(idUsuario) {
  try {
    var resposta = await chamarAPI({ action: 'adminAprovarUsuario', token: sessaoUsuario.token, idUsuario: idUsuario });
    if (!resposta.sucesso) {
      if (tratarErroSessaoOuPermissao(resposta)) return;
      alert(resposta.erro || 'Não foi possível aprovar essa conta.');
      return;
    }
    await carregarUsuariosSeNecessario(true);
  } catch (erro) {
    console.error(erro);
    alert('Erro de conexão ao aprovar a conta.');
  }
}

async function handleRejeitarCadastro(idUsuario) {
  if (!confirm('Recusar esse pedido de cadastro? A conta é removida da planilha.')) return;
  try {
    var resposta = await chamarAPI({ action: 'adminRemoverUsuario', token: sessaoUsuario.token, idUsuario: idUsuario });
    if (!resposta.sucesso) {
      if (tratarErroSessaoOuPermissao(resposta)) return;
      alert(resposta.erro || 'Não foi possível recusar o pedido.');
      return;
    }
    await carregarUsuariosSeNecessario(true);
  } catch (erro) {
    console.error(erro);
    alert('Erro de conexão ao recusar o pedido.');
  }
}

async function handleAlterarPapel(idUsuario, novoPapel) {
  if (!confirm('Alterar o papel dessa conta para "' + novoPapel + '"?')) return;
  try {
    var resposta = await chamarAPI({ action: 'adminAlterarPapel', token: sessaoUsuario.token, idUsuario: idUsuario, novoPapel: novoPapel });
    if (!resposta.sucesso) {
      if (tratarErroSessaoOuPermissao(resposta)) return;
      alert(resposta.erro || 'Não foi possível alterar o papel.');
      return;
    }
    await carregarUsuariosSeNecessario(true);
  } catch (erro) {
    console.error(erro);
    alert('Erro de conexão ao alterar o papel.');
  }
}

async function handleRemoverUsuario(idUsuario) {
  if (!confirm('Remover essa conta? A pessoa perde o acesso ao site imediatamente.')) return;
  try {
    var resposta = await chamarAPI({ action: 'adminRemoverUsuario', token: sessaoUsuario.token, idUsuario: idUsuario });
    if (!resposta.sucesso) {
      if (tratarErroSessaoOuPermissao(resposta)) return;
      alert(resposta.erro || 'Não foi possível remover a conta.');
      return;
    }
    await carregarUsuariosSeNecessario(true);
  } catch (erro) {
    console.error(erro);
    alert('Erro de conexão ao remover a conta.');
  }
}

async function handleAdminEnviarReset(idUsuario) {
  try {
    var resposta = await chamarAPI({ action: 'adminEnviarReset', token: sessaoUsuario.token, idUsuario: idUsuario });
    if (!resposta.sucesso) {
      if (tratarErroSessaoOuPermissao(resposta)) return;
      alert(resposta.erro || 'Não foi possível enviar o código.');
      return;
    }
    alert(resposta.mensagem || 'Código enviado.');
    await carregarUsuariosSeNecessario(true);
  } catch (erro) {
    console.error(erro);
    alert('Erro de conexão ao enviar o código.');
  }
}
