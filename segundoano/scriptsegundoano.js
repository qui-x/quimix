(function(){

  /* ============================================================
     MENU DO 2º ANO — indexsegundoano.html
     ------------------------------------------------------------
     Mesmo contrato do menu do 1º ano (scriptprimeiroano.js): esta
     página não tem painel de acessibilidade próprio. Ela só lê o
     estado que chega pela URL (definido no painel de seleção de ano,
     index.html), aplica na própria página e repassa, sem alterar
     nada, para o simulador escolhido.
     ============================================================ */

  var CVD = ['protanopia','deuteranopia','tritanopia','acromatopsia'];

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

  /* Nada de aplicar no <html> aqui: quem faz isso e o a11y.js, no
     <head>, antes do primeiro pixel. Aplicar de novo era o bug. */

  /* (applyColorblindFilter removido: o a11y.js aplica o filtro no
     #colorblindOverlay, com a mesma tecnica de backdrop-filter. Ter
     duas funcoes fazendo isso era duplicacao — e a daqui usava o
     `state` local, que podia estar desatualizado.) */
  /* ---------- repassa o estado atual para o simulador escolhido ---------- */
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

  var grid = document.getElementById('grid');
  if (grid){
    grid.querySelectorAll('.year-card[data-file]').forEach(function(tile){
      tile.addEventListener('click', function(e){
        e.preventDefault();
        window.location.href = buildUrl(tile.dataset.file);
      });
    });
  }

  /* ---------- prévias AO VIVO dos cards — mesmos parâmetros de
     acessibilidade da navegação normal (buildUrl, acima), pra elas
     não abrirem sempre no tema padrão independente do escolhido na
     Central. src fica vazio no HTML de propósito (ver data-src) até
     esta função rodar. ---------- */
  function atualizarPreviasIframe(){
    document.querySelectorAll('.year-card-preview-frame[data-src]').forEach(function(frame){
      frame.src = buildUrl(frame.dataset.src);
    });
  }
  atualizarPreviasIframe();

  /* ---------- VLibras ---------- */
  function loadVLibrasScript(){
    var s = document.createElement('script');
    s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    s.onload = function(){
      try { new window.VLibras.Widget('https://vlibras.gov.br/app'); }
      catch(err){ /* segue mesmo se o widget não inicializar */ }
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

})();
