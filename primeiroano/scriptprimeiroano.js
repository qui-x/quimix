(function(){

  /* ============================================================
     CONTRATO DE ACESSIBILIDADE — MENU DO 1º ANO (ELO INTERMEDIÁRIO)
     ------------------------------------------------------------
     Estrutura REAL de pastas (a Central fica na raiz; cada ano tem a
     sua própria subpasta com o menu do ano e os simuladores dele):

         /              index.html, style.css, script.js, a11y.js
         /primeiroano   indexprimeiroano.html + SILQ SIEM SIQI SIME
                        SITP SIE SIMA
         /segundoano    indexsegundoano.html + 8 módulos
         /terceiroano   indexterceiroano.html + 5 módulos

     É por isso que todo simulador carrega "../a11y.js" (um nível acima)
     e que o botão de voltar aponta para o menu do ANO, nunca para
     "index.html" — dentro de uma subpasta, "index.html" daria 404.
     (Foi exatamente esse o bug que existia no indexsima.html.)

     Este arquivo NÃO tem mais painel de acessibilidade próprio.
     Quem escolhe tema, contraste, fonte, espaçamento, animações,
     leitura simples e daltonismo é SÓ a Central raiz (index.html).

     Este menu apenas:
       1) LÊ os parâmetros que chegam na própria URL, colocados lá
          pela Central raiz ao navegar para cá:

            ?theme=dark|light
            &reading=on|off
            &colorblind=none|protanopia|deuteranopia|tritanopia|acromatopsia
            &contrast=true|false
            &fontscale=0.75–1.5
            &spacing=true|false
            &motion=true|false

       2) APLICA esse estado aos próprios estilos (mesma convenção
          data-theme/data-contrast/... do styleprimeiroano.css);

       3) REPASSA o mesmo estado para o simulador escolhido, mantendo
          a cadeia até o fim (Central → menu do ano → simulador).

     O botão "← Central" deste menu volta para a Central raiz
     (index.html) sem parâmetros — a Central raiz já guarda as
     escolhas do usuário em localStorage e as reaplica sozinha.

     DALTONISMO — ATENÇÃO: nunca aplicar o filtro (`filter: url(#f-...)`)
     direto em <body>/<html>. A técnica correta é: um
     <div id="colorblindOverlay"> fixo cobrindo a tela com
     `backdrop-filter: url(#f-...)` e `pointer-events:none`.
     ============================================================ */

  /* ============================================================
     ESTADO DE ACESSIBILIDADE — QUEM MANDA E O a11y.js
     ------------------------------------------------------------
     BUG CORRIGIDO: este menu tinha um `state` proprio que lia SO a
     URL. Quando a URL vinha limpa — que e exatamente o caso do botao
     "voltar" do simulador, do F5 e do favorito — ele nao achava
     parametro nenhum, ficava no padrao (tema escuro) e sobrescrevia
     no <html> o que o a11y.js tinha acabado de aplicar corretamente.

     Resultado visivel: o aluno escolhia tema claro na Central, entrava
     num simulador (claro, certo), voltava para o menu do ano — e o
     menu aparecia ESCURO. O <body> ficava com .light-mode correto, mas
     este CSS pinta o tema pelo atributo [data-theme] do <html>, que
     havia sido sobrescrito.

     AGORA: o a11y.js e a UNICA fonte da verdade. Ele tem tres camadas
     com prioridade (URL vence memoria, memoria vence padrao), grava a
     cada mudanca e recarimba a URL quando ela chega limpa. Este script
     apenas LE o estado dele, e nao aplica nada no <html>.
     ============================================================ */

  // Le do a11y.js. O fallback so existe para o caso de o a11y.js nao
  // ter carregado; nele o proprio a11y ja teria falhado antes.
  var state = (window.A11Y && window.A11Y.estado) || {
    theme: 'dark', reading: 'off', colorblind: 'none',
    contrast: false, fontScale: 1, spacing: false, motion: false
  };

  // (readFromUrl removido: o a11y.js le a URL, a memoria e o padrao,
  //  nessa ordem de prioridade — ver a nota acima.)

  var grid = document.getElementById('grid');

  /* Nada de aplicar no <html> aqui: quem faz isso e o a11y.js, no
     <head>, antes do primeiro pixel. Aplicar de novo era o bug. */

  /* (applyColorblindFilter removido: o a11y.js aplica o filtro no
     #colorblindOverlay, com a mesma tecnica de backdrop-filter. Ter
     duas funcoes fazendo isso era duplicacao — e a daqui usava o
     `state` local, que podia estar desatualizado.) */

  /* ---------- liga cada módulo de simulador já presente no HTML ---------- */
  // Cada módulo já é um <a href="..."> real: funciona mesmo sem JS
  // (abre a página do simulador na mesma aba, só sem os parâmetros de
  // acessibilidade). Com JS, reescrevemos a URL com o estado atual
  // (recebido da Central raiz) antes de navegar, para o simulador já
  // abrir no tema/contraste/leitura/fonte/daltonismo escolhidos lá.
  if (grid) {
    grid.querySelectorAll('.year-card[data-file]').forEach(function(tile){
      tile.addEventListener('click', function(e){
        e.preventDefault();
        openSimulator(tile.dataset.file);
      });
    });
  }

  /* ---------- prévias AO VIVO dos cards — mesmos parâmetros de
     acessibilidade da navegação normal (buildUrl, mais abaixo), pra
     elas não abrirem sempre no tema padrão independente do que a
     pessoa escolheu na Central. src fica vazio no HTML de propósito
     (ver data-src) até esta função rodar. ---------- */
  function atualizarPreviasIframe(){
    document.querySelectorAll('.year-card-preview-frame[data-src]').forEach(function(frame){
      frame.src = buildUrl(frame.dataset.src);
    });
  }
  atualizarPreviasIframe();

  /* ---------- saudação por horário ---------- */
  function setGreeting(){
    var h = new Date().getHours();
    var txt;
    if (h >= 5 && h < 12) txt = 'Bom dia, qual assunto deseja aprender hoje?';
    else if (h >= 12 && h < 18) txt = 'Boa tarde, qual assunto deseja aprender hoje?';
    else txt = 'Boa noite, qual assunto deseja aprender hoje?';
    var el = document.getElementById('greetingText');
    if (el) el.textContent = txt;
  }
  setGreeting();

  /* ---------- VLibras ---------- */
  // Sempre ativo — sem botão. Carrega o script oficial assim que a
  // página abre; o próprio widget (ver markup #vlibrasWidget) já fica
  // visível por padrão (não há classe condicional para escondê-lo).
  function loadVLibrasScript(){
    var s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = function(){
      try {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      } catch(err){ /* segue mesmo se o widget não inicializar */ }
    };
    s.onerror = function(){
      var note = document.createElement('div');
      note.style.cssText = 'position:fixed;bottom:16px;right:16px;max-width:260px;font-size:12px;background:var(--surface);border:1px solid var(--border);color:var(--muted);padding:10px 12px;border-radius:10px;z-index:400;';
      note.textContent = 'O serviço do VLibras não pôde ser carregado agora. Verifique a conexão ou tente novamente mais tarde.';
      document.body.appendChild(note);
      setTimeout(function(){ note.remove(); }, 6000);
    };
    document.body.appendChild(s);
  }
  loadVLibrasScript();

  /* ---------- navegação para o simulador, na mesma aba ---------- */
  // Este menu e os simuladores do 1º ano estão TODOS dentro de
  // /primeiroano, então o link de um simulador é só o nome do arquivo
  // (ex.: indexsima.html) — caminho relativo dentro da mesma subpasta.
  // Por isso aqui basta acrescentar a query string de acessibilidade ao
  // nome do arquivo. Quem sobe um nível é o botão "← Central"
  // (../index.html) e a tag do a11y.js (../a11y.js).
  function buildUrl(file){
    if (!file) return '#';
    var fileUrl = encodeURI(file);
    return fileUrl + '?' +
      'theme=' + encodeURIComponent(state.theme) +
      '&reading=' + encodeURIComponent(state.reading) +
      '&colorblind=' + encodeURIComponent(state.colorblind) +
      '&contrast=' + encodeURIComponent(state.contrast) +
      '&fontscale=' + encodeURIComponent(state.fontScale) +
      '&spacing=' + encodeURIComponent(state.spacing) +
      '&motion=' + encodeURIComponent(state.motion);
  }

  function openSimulator(file){
    if (!file) return;
    window.location.href = buildUrl(file);
  }

})();
