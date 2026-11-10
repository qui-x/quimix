/* ═══════════════════════════════════════════════════════════════
   relatorio-core.js — RELATÓRIO COMPARTILHADO DOS SIMULADORES (QRel)
   ═══════════════════════════════════════════════════════════════

   O QUE É
   Um relatório de investigação que cresce SOZINHO enquanto o aluno
   usa um simulador (a ideia vem do SIAB, o Ácido-Base). Este arquivo
   é a parte COMUM; cada simulador só escreve um "adaptador" pequeno
   que diz (1) o que registrar e (2) como mostrar isso no relatório.

   COMO FUNCIONA (3 passos)
     1. O simulador chama  QRel.registrar('SIRO', 'seta', {...})
        a cada coisa importante que o aluno faz.
     2. O adaptador diz como desenhar esses registros:
        QRel.adaptador('SIRO', { secoes: function (rel) { ... } })
     3. O aluno abre o relatório (QRel.abrir('SIRO')), escreve a
        análise e imprime ou baixa o arquivo.

   O ENVELOPE (igual para todos os simuladores)
     { schema, id, simulador, criado, atualizado, origem,
       proposta:{titulo,objetivo,pergunta},
       identificacao:{nome,turma,data,professor,grupo},
       registros:[ { t, tipo, ...dados } ],
       autoral:{observacoes,analise,interpretacao,resposta,conclusao} }

   ONDE FICA GUARDADO
   Só no navegador do aluno (localStorage, chave quimix_relatorios_v1).
   Se o armazenamento falhar, guarda na memória e AVISA (nunca perde
   em silêncio). Nada é enviado para servidor. O aluno leva o trabalho
   por arquivo JSON ou impressão.

   REGRAS DE OURO
     - O relatório NUNCA pode quebrar o simulador: quem chama o QRel
       deve proteger a chamada com try/catch (o QRel também protege).
     - Todo texto vindo do simulador ou de um arquivo importado passa
       por QRel.esc() antes de virar HTML.
   ═══════════════════════════════════════════════════════════════ */
window.QRel = (function () {
  'use strict';

  var CHAVE = 'quimix_relatorios_v1';          // o armazenamento (todos os relatórios)
  var CHAVE_ATIVO = 'quimix_rel_ativo_';       // sessionStorage: o relatório em uso, por simulador
  var SCHEMA = 1;
  var MAX_REGISTROS = 3000;                    // teto de segurança por relatório
  var CAMPOS_AUTORAIS = [
    ['observacoes',   'Observações',   'O que você viu acontecer? Descreva sem interpretar ainda.'],
    ['analise',       'Análise',       'Organize o que observou: padrões, comparações, o que mudou de uma tentativa para outra.'],
    ['interpretacao', 'Interpretação', 'Explique POR QUÊ aconteceu, usando os conceitos da química.'],
    ['resposta',      'Resposta',      'Responda à pergunta da proposta com base nos seus dados.'],
    ['conclusao',     'Conclusão',     'O que você concluiu? O que ainda ficou em dúvida?']
  ];
  var CAMPOS_ID = [['nome', 'Nome'], ['turma', 'Turma'], ['data', 'Data'], ['professor', 'Professor(a)'], ['grupo', 'Grupo']];

  var memoria = null;          // cópia na memória (rede de segurança)
  var armazenamentoFalhou = false;
  var adaptadores = {};
  var dialogo = null;          // o <dialog> do relatório
  var estado = { sim: null, id: null, gravar: null, pend: {} };   // pend: edições digitadas que ainda não foram gravadas

  /* ── pequenas ferramentas ───────────────────────────────────── */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function agora() { return new Date().toISOString(); }
  function hoje() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); }
  function novoId() {
    try { if (window.crypto && crypto.randomUUID) return 'rel_' + crypto.randomUUID(); } catch (e) { /* segue */ }
    return 'rel_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function aviso(msg) { try { if (typeof window.announce === 'function') window.announce(msg); } catch (e) { /* mudo */ } }
  function dataBr(iso) { try { return new Date(iso).toLocaleString('pt-BR'); } catch (e) { return iso || ''; } }

  /* ── armazenamento ──────────────────────────────────────────── */
  function lerTudo() {
    try {
      var bruto = window.localStorage.getItem(CHAVE);
      if (bruto) { var o = JSON.parse(bruto); if (o && typeof o === 'object' && !Array.isArray(o)) { memoria = o; return o; } }
    } catch (e) { /* cai na memória */ }
    return memoria || {};
  }
  function gravarTudo(obj) {
    memoria = obj;
    try { window.localStorage.setItem(CHAVE, JSON.stringify(obj)); armazenamentoFalhou = false; return true; }
    catch (e) {
      if (!armazenamentoFalhou) aviso('Atenção: o navegador não deixou salvar o relatório. Baixe o arquivo antes de fechar a página.');
      armazenamentoFalhou = true; mostrarEstado(); return false;
    }
  }
  function ativoDe(sim) { try { return window.sessionStorage.getItem(CHAVE_ATIVO + sim); } catch (e) { return null; } }
  function marcarAtivo(sim, id) { try { window.sessionStorage.setItem(CHAVE_ATIVO + sim, id); } catch (e) { /* ok */ } }

  /* ── o relatório ────────────────────────────────────────────── */
  function criar(sim, base) {
    base = base || {};
    var p = base.proposta || {};
    var rel = {
      schema: SCHEMA, id: novoId(), simulador: sim, criado: agora(), atualizado: agora(),
      origem: base.origem || 'livre',
      proposta: { titulo: p.titulo || '', objetivo: p.objetivo || '', pergunta: p.pergunta || '' },
      identificacao: { nome: '', turma: '', data: hoje(), professor: '', grupo: '' },
      registros: [], autoral: { observacoes: '', analise: '', interpretacao: '', resposta: '', conclusao: '' }
    };
    var tudo = lerTudo(); tudo[rel.id] = rel; gravarTudo(tudo); marcarAtivo(sim, rel.id);
    return rel;
  }
  function obter(id) { return lerTudo()[id] || null; }
  function listar(sim) {
    var tudo = lerTudo();
    return Object.keys(tudo).map(function (k) { return tudo[k]; })
      .filter(function (r) { return r && (!sim || r.simulador === sim); })
      .sort(function (a, b) { return String(b.atualizado).localeCompare(String(a.atualizado)); });
  }
  /* o relatório em uso neste simulador (nesta aba); cria se pedido */
  function ativo(sim, base, criarSeFalta) {
    var id = ativoDe(sim), r = id ? obter(id) : null;
    if (r) return r;
    return criarSeFalta === false ? null : criar(sim, base);
  }
  function novo(sim, base) { return criar(sim, base); }
  function salvar(rel) {
    rel.atualizado = agora(); var tudo = lerTudo(); tudo[rel.id] = rel; return gravarTudo(tudo);
  }
  function remover(id) { var tudo = lerTudo(); delete tudo[id]; gravarTudo(tudo); }

  /* REGISTRAR: a única função que o simulador precisa chamar */
  function registrar(sim, tipo, dados, base) {
    try {
      var rel = ativo(sim, base, true);
      if (rel.registros.length >= MAX_REGISTROS) {
        if (!rel.truncado) { rel.truncado = true; salvar(rel); aviso('O relatório chegou ao limite de registros. Inicie um novo relatório.'); }
        return null;
      }
      var reg = { t: agora(), tipo: String(tipo) };
      if (dados && typeof dados === 'object') Object.keys(dados).forEach(function (k) { if (k !== 't' && k !== 'tipo') reg[k] = dados[k]; });
      rel.registros.push(reg); salvar(rel); atualizarSeAberto(rel.id);
      return reg;
    } catch (e) { return null; }
  }
  function identificacao(id, parcial) {
    var r = obter(id); if (!r) return false;
    CAMPOS_ID.forEach(function (c) { if (parcial && c[0] in parcial) r.identificacao[c[0]] = String(parcial[c[0]]).slice(0, 200); });
    return salvar(r);
  }
  function autoral(id, campo, texto) {
    var r = obter(id); if (!r || !(campo in r.autoral)) return false;
    r.autoral[campo] = String(texto).slice(0, 20000); return salvar(r);
  }
  function adaptador(sim, def) { adaptadores[sim] = def || {}; }

  /* ── exportar / importar ────────────────────────────────────── */
  function baixar(nome, texto, tipo) {
    var blob = new Blob([texto], { type: tipo || 'application/json' }), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = nome; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }
  function paraJson(id) {
    var r = obter(id); if (!r) return null;
    return JSON.stringify({ formato: 'quimix-relatorio', schema: SCHEMA, exportado: agora(), relatorio: r }, null, 2);
  }
  function exportar(id) {
    var txt = paraJson(id), r = obter(id); if (!txt) return false;
    var carimbo = (r.atualizado || agora()).replace(/[-:T]/g, '').slice(0, 12);
    baixar('quimix-relatorio-' + r.simulador + '-' + carimbo + '.json', txt); return true;
  }
  /* valida com cuidado: o arquivo vem de fora e NUNCA é confiável */
  function importar(texto) {
    var o; try { o = JSON.parse(texto); } catch (e) { return { ok: false, erro: 'O arquivo não é um JSON válido.' }; }
    if (!o || o.formato !== 'quimix-relatorio' || !o.relatorio) return { ok: false, erro: 'Este arquivo não é um relatório do Quimix.' };
    if (o.schema > SCHEMA) return { ok: false, erro: 'Este relatório é de uma versão mais nova do Quimix.' };
    var r = o.relatorio;
    if (!r || typeof r.simulador !== 'string' || !Array.isArray(r.registros)) return { ok: false, erro: 'O relatório está incompleto.' };
    var tudo = lerTudo(), id = String(r.id || '');
    if (!id || tudo[id]) { r.importadoDe = id || null; id = novoId(); }       // nunca sobrescreve um relatório existente
    var limpo = {
      schema: SCHEMA, id: id, simulador: r.simulador.slice(0, 40), criado: String(r.criado || agora()), atualizado: agora(),
      origem: String(r.origem || 'livre').slice(0, 40), importadoDe: r.importadoDe || undefined,
      proposta: { titulo: String((r.proposta || {}).titulo || '').slice(0, 300), objetivo: String((r.proposta || {}).objetivo || '').slice(0, 1000), pergunta: String((r.proposta || {}).pergunta || '').slice(0, 1000) },
      identificacao: {}, autoral: {}, registros: r.registros.slice(0, MAX_REGISTROS).filter(function (x) { return x && typeof x === 'object' && typeof x.tipo === 'string'; })
    };
    CAMPOS_ID.forEach(function (c) { limpo.identificacao[c[0]] = String((r.identificacao || {})[c[0]] || '').slice(0, 200); });
    CAMPOS_AUTORAIS.forEach(function (c) { limpo.autoral[c[0]] = String((r.autoral || {})[c[0]] || '').slice(0, 20000); });
    tudo[id] = limpo; gravarTudo(tudo); marcarAtivo(limpo.simulador, id);
    return { ok: true, relatorio: limpo };
  }

  /* ── o HTML do relatório (a tela e a impressão usam o mesmo) ── */
  /* modo: 'completo' (editável) · 'impressao' (com o que o aluno escreveu) · 'mao' (em branco, para escrever à mão) */
  function html(rel, modo) {
    var ad = adaptadores[rel.simulador] || {}, n = 0, partes = [];
    var sec = function (titulo, corpo) { n += 1; return '<section class="qrel-sec"><h3>' + n + '. ' + esc(titulo) + '</h3>' + corpo + '</section>'; };

    partes.push('<header class="qrel-cab"><p class="qrel-marca">Quimix · ' + esc(rel.simulador) + '</p><h2>Relatório de investigação</h2>'
      + '<p class="qrel-meta">Criado em ' + esc(dataBr(rel.criado)) + ' · atualizado em ' + esc(dataBr(rel.atualizado)) + ' · ' + rel.registros.length + ' registro(s)</p></header>');

    /* 1 · identificação */
    var idHtml;
    if (modo === 'completo') {
      idHtml = '<div class="qrel-grade">' + CAMPOS_ID.map(function (c) {
        return '<label class="qrel-campo"><span>' + c[1] + '</span><input type="' + (c[0] === 'data' ? 'date' : 'text') + '" data-id="' + c[0] + '" value="' + esc(rel.identificacao[c[0]]) + '" maxlength="200"/></label>';
      }).join('') + '</div>';
    } else {
      idHtml = '<dl class="qrel-dl">' + CAMPOS_ID.map(function (c) {
        var v = modo === 'mao' ? '' : rel.identificacao[c[0]];
        return '<div><dt>' + c[1] + '</dt><dd>' + (v ? esc(v) : '<span class="qrel-risco"></span>') + '</dd></div>';
      }).join('') + '</dl>';
    }
    partes.push(sec('Identificação', idHtml));

    /* 2 · proposta */
    var p = rel.proposta, propHtml = '';
    if (p.titulo) propHtml += '<p><strong>' + esc(p.titulo) + '</strong></p>';
    if (p.objetivo) propHtml += '<p><span class="qrel-rot">Objetivo:</span> ' + esc(p.objetivo) + '</p>';
    if (p.pergunta) propHtml += '<p><span class="qrel-rot">Pergunta:</span> ' + esc(p.pergunta) + '</p>';
    partes.push(sec('Proposta', propHtml || '<p class="qrel-vazio">Sem proposta definida.</p>'));

    /* 3… · as seções do simulador (o adaptador) */
    if (typeof ad.secoes === 'function') {
      var lista = [];
      try { lista = ad.secoes(rel, { esc: esc, modo: modo, dataBr: dataBr }) || []; } catch (e) { lista = [{ titulo: 'Registro', html: '<p class="qrel-vazio">Não foi possível montar esta parte do relatório.</p>' }]; }
      lista.forEach(function (s) { partes.push(sec(s.titulo, s.html)); });
    } else {
      partes.push(sec('Registro', '<p class="qrel-vazio">Este simulador ainda não tem adaptador de relatório.</p>'));
    }

    /* os campos do aluno */
    CAMPOS_AUTORAIS.forEach(function (c) {
      var corpo, v = rel.autoral[c[0]] || '';
      if (modo === 'completo') corpo = '<textarea class="qrel-area" data-campo="' + c[0] + '" rows="5" maxlength="20000" placeholder="' + esc(c[2]) + '" aria-label="' + esc(c[1]) + '">' + esc(v) + '</textarea>';
      else if (modo === 'impressao' && v) corpo = '<div class="qrel-texto">' + esc(v).replace(/\n/g, '<br>') + '</div>';
      else corpo = '<div class="qrel-linhas" aria-hidden="true"></div>';
      partes.push(sec(c[1], corpo));
    });
    return '<article class="qrel-doc" data-modo="' + modo + '">' + partes.join('') + '</article>';
  }

  /* ── a janela do relatório ──────────────────────────────────── */
  function montarDialogo() {
    if (dialogo) return dialogo;
    dialogo = document.createElement('dialog');
    dialogo.className = 'qrel-dialog'; dialogo.setAttribute('aria-labelledby', 'qrel-titulo');
    dialogo.innerHTML =
      '<div class="qrel-barra">'
      + '<h2 id="qrel-titulo">Relatório</h2>'
      + '<button type="button" class="qrel-bt qrel-fechar" data-q="fechar" aria-label="Fechar o relatório">✕</button></div>'
      + '<div class="qrel-ferr">'
      + '<label class="qrel-sel"><span>Relatório</span><select id="qrel-sel" data-q="trocar"></select></label>'
      + '<button type="button" class="qrel-bt" data-q="novo">Novo relatório</button>'
      + '<button type="button" class="qrel-bt" data-q="baixar">Baixar arquivo (.json)</button>'
      + '<button type="button" class="qrel-bt" data-q="importar">Abrir arquivo…</button>'
      + '<button type="button" class="qrel-bt qrel-prim" data-q="imprimir">Imprimir</button>'
      + '<button type="button" class="qrel-bt" data-q="imprimir-branco">Imprimir em branco (à mão)</button>'
      + '<button type="button" class="qrel-bt qrel-perigo" data-q="excluir">Excluir</button>'
      + '<input type="file" id="qrel-arq" accept="application/json,.json" hidden/></div>'
      + '<p class="qrel-estado" id="qrel-estado" role="status" aria-live="polite"></p>'
      + '<div class="qrel-corpo" id="qrel-corpo"></div>';
    document.body.appendChild(dialogo);

    dialogo.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-q]') : null; if (!b || b.tagName === 'SELECT') return;
      acao(b.getAttribute('data-q'));
    });
    dialogo.addEventListener('change', function (e) {
      if (e.target.id === 'qrel-sel') { gravarPendentes(); var r = obter(e.target.value); if (r) { descartarSeVazio(); marcarAtivo(estado.sim, r.id); estado.id = r.id; desenhar(); } }
      else if (e.target.id === 'qrel-arq') lerArquivo(e.target);
    });
    dialogo.addEventListener('input', function (e) {           // salva sozinho, sem botão
      var t = e.target, campo = t.getAttribute && t.getAttribute('data-campo'), idc = t.getAttribute && t.getAttribute('data-id');
      if (!campo && !idc) return;
      /* guarda a edição de CADA campo: digitar em outro campo não pode cancelar a gravação do anterior */
      estado.pend[(campo ? 'c:' : 'i:') + (campo || idc)] = t.value;
      clearTimeout(estado.gravar); estado.gravar = setTimeout(gravarPendentes, 350);
    });
    dialogo.addEventListener('close', function () { gravarPendentes(); descartarSeVazio(); });
    return dialogo;
  }
  /* grava TODAS as edições pendentes de uma vez (também chamada antes de fechar, imprimir e baixar) */
  function gravarPendentes() {
    clearTimeout(estado.gravar);
    var chaves = Object.keys(estado.pend); if (!chaves.length || !estado.id) { estado.pend = {}; return; }
    var ok = true;
    chaves.forEach(function (k) {
      var v = estado.pend[k], nome = k.slice(2), o;
      if (k.charAt(0) === 'c') ok = autoral(estado.id, nome, v) && ok;
      else { o = {}; o[nome] = v; ok = identificacao(estado.id, o) && ok; }
    });
    estado.pend = {}; mostrarEstado(ok ? 'Salvo neste navegador.' : '');
  }
  function mostrarEstado(msg) {
    var el = document.getElementById('qrel-estado'); if (!el) return;
    el.textContent = armazenamentoFalhou ? 'Atenção: este navegador não está salvando. Baixe o arquivo (.json) para não perder o trabalho.' : (msg || '');
    el.classList.toggle('qrel-erro', armazenamentoFalhou);
  }
  /* um relatório que ninguém usou não fica guardado */
  function descartarSeVazio() {
    var r = estado.id && obter(estado.id); if (!r) return;
    var algo = r.registros.length || CAMPOS_AUTORAIS.some(function (c) { return r.autoral[c[0]]; }) || CAMPOS_ID.some(function (c) { return c[0] !== 'data' && r.identificacao[c[0]]; });
    if (!algo) remover(r.id);
  }
  function desenhar() {
    var r = obter(estado.id); if (!r) return;
    var sel = document.getElementById('qrel-sel');
    sel.innerHTML = listar(estado.sim).map(function (x) {
      var nome = x.identificacao && x.identificacao.nome ? ' · ' + x.identificacao.nome : '';
      return '<option value="' + esc(x.id) + '"' + (x.id === estado.id ? ' selected' : '') + '>' + esc(dataBr(x.atualizado) + nome + ' · ' + x.registros.length + ' registros') + '</option>';
    }).join('');
    document.getElementById('qrel-titulo').textContent = 'Relatório · ' + estado.sim;
    document.getElementById('qrel-corpo').innerHTML = html(r, 'completo');
    mostrarEstado();
  }
  /* quando um registro novo chega com a janela aberta, redesenha só as partes do simulador */
  function atualizarSeAberto(id) {
    if (!dialogo || !dialogo.open || estado.id !== id) return;
    var foco = document.activeElement; if (foco && dialogo.contains(foco) && /TEXTAREA|INPUT/.test(foco.tagName)) return;
    desenhar();
  }
  function abrir(sim) {
    montarDialogo();
    var base = (adaptadores[sim] || {}).base;
    var r = ativo(sim, base, true); estado.sim = sim; estado.id = r.id;
    desenhar();
    if (typeof dialogo.showModal === 'function') { if (!dialogo.open) dialogo.showModal(); } else dialogo.setAttribute('open', '');
    aviso('Relatório aberto.');
  }
  function fechar() { if (!dialogo) return; if (typeof dialogo.close === 'function') dialogo.close(); else dialogo.removeAttribute('open'); }

  function acao(q) {
    gravarPendentes();
    var base = (adaptadores[estado.sim] || {}).base;
    if (q === 'fechar') return fechar();
    if (q === 'novo') { descartarSeVazio(); var r = novo(estado.sim, base); estado.id = r.id; desenhar(); mostrarEstado('Novo relatório criado.'); return; }
    if (q === 'baixar') { exportar(estado.id); return mostrarEstado('Arquivo gerado. Guarde-o ou envie ao professor.'); }
    if (q === 'importar') return document.getElementById('qrel-arq').click();
    if (q === 'imprimir') return imprimir(estado.id, 'impressao');
    if (q === 'imprimir-branco') return imprimir(estado.id, 'mao');
    if (q === 'excluir') {
      if (!window.confirm('Excluir este relatório deste navegador? Isso não pode ser desfeito (baixe o arquivo antes, se quiser guardar).')) return;
      remover(estado.id); var resto = listar(estado.sim); var prox = resto[0] || novo(estado.sim, base); estado.id = prox.id; marcarAtivo(estado.sim, prox.id); desenhar(); mostrarEstado('Relatório excluído.');
    }
  }
  function lerArquivo(input) {
    var f = input.files && input.files[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) { input.value = ''; return mostrarEstado('Arquivo grande demais para ser um relatório.'); }
    var leitor = new FileReader();
    leitor.onload = function () {
      var r = importar(String(leitor.result || ''));
      input.value = '';
      if (!r.ok) return mostrarEstado(r.erro);
      if (estado.id !== r.relatorio.id) descartarSeVazio();                 // o relatório em branco que estava aberto não fica sobrando
      if (r.relatorio.simulador !== estado.sim) { estado.sim = r.relatorio.simulador; }
      estado.id = r.relatorio.id; desenhar(); mostrarEstado('Relatório aberto a partir do arquivo.');
    };
    leitor.readAsText(f);
  }

  /* IMPRIMIR: monta uma cópia só para o papel, fora da janela, e imprime */
  function imprimir(id, modo) {
    var r = obter(id); if (!r) return;
    var antigo = document.getElementById('qrel-print'); if (antigo) antigo.remove();
    var caixa = document.createElement('div'); caixa.id = 'qrel-print'; caixa.innerHTML = html(r, modo);
    document.body.appendChild(caixa); document.body.classList.add('qrel-imprimindo');
    var limpar = function () { document.body.classList.remove('qrel-imprimindo'); var c = document.getElementById('qrel-print'); if (c) c.remove(); window.removeEventListener('afterprint', limpar); };
    window.addEventListener('afterprint', limpar);
    setTimeout(function () { try { window.print(); } catch (e) { limpar(); } }, 60);
  }

  return {
    SCHEMA: SCHEMA, esc: esc, adaptador: adaptador,
    registrar: registrar, ativo: ativo, novo: novo, obter: obter, listar: listar, remover: remover,
    identificacao: identificacao, autoral: autoral,
    exportar: exportar, paraJson: paraJson, importar: importar,
    html: html, abrir: abrir, fechar: fechar, imprimir: imprimir
  };
}());
