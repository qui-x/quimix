(function(){

  /* ============================================================
     CONTRATO DE ACESSIBILIDADE PARA SIMULADORES INTEGRADOS
     ------------------------------------------------------------
     Este arquivo é o script do PAINEL DE SELEÇÃO DE ANO (index.html),
     que agora é a PRIMEIRA tela da Central — antes mesmo do menu de
     simuladores. É aqui, e só aqui, que ficam os controles de
     acessibilidade (tema, contraste, fonte, espaçamento, animações,
     leitura simples e daltonismo). Os menus de cada ano
     (indexprimeiroano.html e indexsegundoano.html) e cada simulador
     não têm mais painel de acessibilidade próprio: eles só LEEM o
     estado que chega pela URL e aplicam, exatamente como qualquer
     simulador integrado já fazia em relação ao antigo hub.

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

     Ao escolher um ano, este painel navega a própria aba até o menu
     correspondente (indexprimeiroano.html ou indexsegundoano.html),
     acrescentando o estado atual de acessibilidade na URL:

          ?theme=dark|light
          &reading=on|off
          &colorblind=none|protanopia|deuteranopia|tritanopia|acromatopsia
          &contrast=true|false
          &fontscale=0.75–1.5
          &spacing=true|false
          &motion=true|false

     Cada menu de ano lê esses parâmetros no carregamento, aplica aos
     próprios estilos (mesma convenção data-theme/data-contrast/... do
     style.css) e os REPASSA para o simulador escolhido dentro dele,
     mantendo a cadeia até o fim.

     DALTONISMO — ATENÇÃO: nunca aplicar o filtro (`filter: url(#f-...)`)
     direto em <body>/<html>. A técnica correta é: um
     <div id="colorblindOverlay"> fixo cobrindo a tela com
     `backdrop-filter: url(#f-...)` e `pointer-events:none`.

     VLibras é a ÚNICA exceção a esse contrato: cada página carrega o
     seu próprio script, direto no HTML, sem depender de parâmetro de
     URL nem de estado centralizado.

     MEMÓRIA: as escolhas feitas aqui ficam salvas em localStorage
     (chave "central_a11y_prefs"). Assim, voltar pelo botão "← Central"
     de qualquer menu de ano ou simulador não reseta nada — este
     painel reabre exatamente como o usuário deixou.
     ============================================================ */

  var state = {
    theme: 'dark',
    reading: 'off',
    colorblind: 'none',
    contrast: false,
    fontScale: 1,
    spacing: false,
    motion: false
  };

  /* ---------- memória: lembra as escolhas entre visitas ao painel ---------- */
  var STORAGE_KEY = 'central_a11y_prefs';

  function savePrefs(){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
    atualizarPreviasIframe();
  }

  /* As prévias "ao vivo" da seção Alguns exemplos (iframes) carregam
     o simulador de verdade — sem os parâmetros de acessibilidade na
     URL, cada uma abria sempre no padrão (tema escuro), ignorando o
     que a pessoa tinha acabado de escolher aqui. src fica vazio no
     HTML de propósito (ver data-src) até essa função rodar, pra
     nunca carregar com o estado errado primeiro pra só depois trocar. */
  function atualizarPreviasIframe(){
    document.querySelectorAll('.destaque-preview-frame[data-src]').forEach(function(frame){
      frame.src = buildUrl(frame.dataset.src);
    });
  }

  /* ---------- "Alguns exemplos" — sorteia 4 dos 21 simuladores a
     cada carregamento da home, em vez de mostrar sempre os mesmos 4
     fixos. Os dados (nome/descrição/link) são os mesmos que já
     aparecem nos cards das páginas de cada ano — mantidos aqui numa
     lista só, pra sortear sem precisar ler as outras páginas. ---------- */
  var TODOS_SIMULADORES = [
    { href: 'primeiroano/sime/indexsime.html', nome: 'Simulador Interativo de Matéria e Estados', desc: 'Manipule temperatura e pressão para observar transições entre sólido, líquido e gasoso.', ano: '1º Ano' },
    { href: 'primeiroano/sima/indexsima.html', nome: 'Simulador Interativo de Modelos Atômicos', desc: 'Explore os modelos de Dalton, Thomson, Rutherford e Bohr e veja como a ideia de átomo evoluiu.', ano: '1º Ano' },
    { href: 'primeiroano/sitp/indexsitp.html', nome: 'Simulador Interativo da Tabela Periódica', desc: 'Navegue por grupos e períodos, comparando propriedades e tendências entre os elementos.', ano: '1º Ano' },
    { href: 'primeiroano/siem/indexsiem.html', nome: 'Simulador Interativo de Estrutura da Matéria', desc: 'Veja como partículas, moléculas e íons se organizam em cada tipo de estrutura da matéria.', ano: '1º Ano' },
    { href: 'primeiroano/silq/indexsilq.html', nome: 'Simulador Interativo de Ligações Químicas', desc: 'Monte ligações iônicas, covalentes e metálicas e entenda como os átomos se combinam.', ano: '1º Ano' },
    { href: 'primeiroano/sifi/indexsifi.html', nome: 'Simulador Interativo de Forças Intermoleculares', desc: 'Analise as interações intermoleculares dipolo-dipolo, pontes de hidrogenio e forças de London.', ano: '1º Ano' },
    { href: 'primeiroano/sie/indexsie.html', nome: 'Simulador Interativo de Estequiometria', desc: 'Monte reações químicas, balanceie equações e calcule reagente limitante e rendimento teórico.', ano: '1º Ano' },
    { href: 'primeiroano/siqi/indexsiqi.html', nome: 'Simulador Interativo de Química Inorgânica', desc: 'Explore ácidos, bases, sais e óxidos com fórmulas, ionizações e reações modelo.', ano: '1º Ano' },
    { href: 'segundoano/gases/index.html', nome: 'Simulador Interativo de Gases', desc: 'Estude as transformações gasosas no pistão, a equação de Clapeyron, a difusão pela Lei de Graham e a teoria cinética dos gases.', ano: '2º Ano' },
    { href: 'segundoano/solucoes/index.html', nome: 'Simulador Interativo de Soluções', desc: 'Classifique misturas, prepare e dilua soluções e explore curvas reais de solubilidade — do dia a dia ao laboratório.', ano: '2º Ano' },
    { href: 'segundoano/termoquimica/index.html', nome: 'Simulador Interativo de Termoquímica', desc: 'Use o calorímetro, a curva de aquecimento da água, diagramas endo/exo, a Lei de Hess e a energia de ligação em 3D.', ano: '2º Ano' },
    { href: 'segundoano/cinetica/index.html', nome: 'Simulador Interativo de Cinética Química', desc: 'Veja colisões efetivas, curvas de consumo de reagente e o efeito do catalisador na energia de ativação.', ano: '2º Ano' },
    { href: 'segundoano/equilibrio/index.html', nome: 'Simulador Interativo de Equilíbrio Químico e Iônico', desc: 'Atinja o equilíbrio, aplique Le Chatelier, compare Q com K, percorra a escala de pH e titule ácido com base.', ano: '2º Ano' },
    { href: 'segundoano/eletroquimica/index.html', nome: 'Simulador Interativo de Eletroquímica', desc: 'Monte pilhas, calcule ΔE°, teste a espontaneidade, faça eletrólise e aplique as leis de Faraday na galvanoplastia.', ano: '2º Ano' },
    { href: 'segundoano/radioatividade/index.html', nome: 'Simulador Interativo de Radioatividade', desc: 'Compare as emissões alfa, beta e gama, acompanhe a meia-vida de isótopos reais e controle uma fissão nuclear em cadeia.', ano: '2º Ano' },
    { href: 'segundoano/coligativas/index.html', nome: 'Simulador Interativo de Propriedades Coligativas', desc: 'Meça pressão de vapor, misturas de líquidos voláteis, ebulioscopia, crioscopia, osmose e a Lei de Henry.', ano: '2º Ano' },
    { href: 'terceiroano/indexcarbono.html', nome: 'Simulador Interativo de Química do Carbono', desc: 'Compare as hibridizações sp³, sp² e sp, classifique cadeias carbônicas nos quatro critérios e identifique carbonos primários a quaternários.', ano: '3º Ano' },
    { href: 'terceiroano/indexfuncoes.html', nome: 'Simulador Interativo de Funções Orgânicas', desc: 'Reconheça os grupos funcionais, monte nomes IUPAC com prefixo, infixo e sufixo e compare o ponto de ebulição de alcanos e álcoois.', ano: '3º Ano' },
    { href: 'terceiroano/indexreacoes.html', nome: 'Simulador Interativo de Reações Orgânicas', desc: 'Acompanhe adições à dupla com a regra de Markovnikov, substituições em alcanos e aromáticos e a combustão balanceada na hora.', ano: '3º Ano' },
    { href: 'terceiroano/indexambiental.html', nome: 'Simulador Interativo de Química Ambiental', desc: 'Compare gases de efeito estufa pelo GWP do IPCC, veja o pH da chuva cair com SO₂ e NOₓ e a camada de ozônio afinar com os CFCs.', ano: '3º Ano' },
    { href: 'terceiroano/indexbioquimica.html', nome: 'Simulador Interativo de Bioquímica', desc: 'Monte polímeros a partir dos monômeros das quatro biomoléculas, forme dipeptídeos e teste a atividade enzimática em pH e temperatura.', ano: '3º Ano' }
  ];

  function sortearDestaques(){
    /* Um simulador de cada ano — não mais aleatório do total. Agrupa
       por ano, sorteia um dentro de cada grupo, devolve na ordem
       1º → 2º → 3º (não na ordem em que os grupos foram sorteados). */
    var ANOS = ['1º Ano', '2º Ano', '3º Ano'];
    return ANOS.map(function(ano){
      var doAno = TODOS_SIMULADORES.filter(function(s){ return s.ano === ano; });
      return doAno[Math.floor(Math.random() * doAno.length)];
    });
  }

  var SETA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function montarDestaques(){
    var grid = document.querySelector('.destaques-grid');
    if (!grid) return;
    var escolhidos = sortearDestaques();
    grid.innerHTML = escolhidos.map(function(s){
      var nomeCurto = s.nome.replace(/^Simulador Interativo (d[aeo]s? )?/i, '');
      nomeCurto = nomeCurto.charAt(0).toUpperCase() + nomeCurto.slice(1);
      return (
        '<a class="destaque-card" href="' + s.href + '" data-file="' + s.href + '">' +
          '<div class="destaque-preview">' +
            '<iframe class="destaque-preview-frame" data-src="' + s.href + '" title="Prévia ao vivo do simulador" tabindex="-1" aria-hidden="true" loading="lazy"></iframe>' +
          '</div>' +
          '<span class="destaque-badge">' + s.ano + '</span>' +
          '<h3>' + nomeCurto + '</h3>' +
          '<p>' + s.desc + '</p>' +
          '<span class="destaque-cta">Abrir ' + SETA_SVG + '</span>' +
        '</a>'
      );
    }).join('');

    // liga o clique dos cards recém-criados (mesmo contrato dos outros)
    grid.querySelectorAll('.destaque-card[data-file]').forEach(function(card){
      card.addEventListener('click', function(e){
        e.preventDefault();
        openDestino(card.dataset.file);
      });
    });
  }
  montarDestaques();
  function loadPrefs(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }
  var saved = loadPrefs();
  if (saved){
    state.theme = saved.theme === 'light' ? 'light' : 'dark';
    state.reading = saved.reading === 'on' ? 'on' : 'off';
    state.colorblind = ['protanopia','deuteranopia','tritanopia','acromatopsia'].indexOf(saved.colorblind) !== -1 ? saved.colorblind : 'none';
    state.contrast = !!saved.contrast;
    state.fontScale = (typeof saved.fontScale === 'number' && saved.fontScale >= 0.75 && saved.fontScale <= 1.5) ? saved.fontScale : 1;
    state.spacing = !!saved.spacing;
    state.motion = !!saved.motion;
  }

  var html = document.documentElement;
  var anoGrid = document.getElementById('anoGrid');

  /* ---------- aplica o estado restaurado (ou padrão) imediatamente ---------- */
  html.setAttribute('data-theme', state.theme);
  html.setAttribute('data-contrast', state.contrast ? 'on' : 'off');
  html.setAttribute('data-reading', state.reading);
  html.setAttribute('data-spacing', state.spacing ? 'on' : 'off');
  html.setAttribute('data-motion', state.motion ? 'on' : 'off');
  html.setAttribute('data-colorblind', state.colorblind);
  html.style.setProperty('--font-scale', state.fontScale);
  applyColorblindFilter();
  atualizarPreviasIframe();

  /* ---------- daltonismo: aplicado numa camada separada, não no body ---------- */
  function applyColorblindFilter(){
    var overlay = document.getElementById('colorblindOverlay');
    if (!overlay) return;
    var value = (state.colorblind === 'none') ? 'none' : 'url(#f-' + state.colorblind + ')';
    overlay.style.backdropFilter = value;
    overlay.style.webkitBackdropFilter = value;
  }

  /* ---------- liga cada cartão de ano já presente no HTML ---------- */
  // Cada cartão já é um <a href="..."> real: funciona mesmo sem JS
  // (abre o menu do ano na mesma aba, só sem os parâmetros de
  // acessibilidade). Com JS, reescrevemos a URL com o estado atual
  // antes de navegar, para o menu do ano (e depois o simulador) já
  // abrir no tema/contraste/leitura/fonte/daltonismo escolhidos aqui.
  // anoGrid pode não existir mais (a home mudou de "cards de ano" pra
  // uma página de apresentação — os cards agora vivem só dentro da
  // gaveta, ver bindDrawerSimLinks() logo abaixo).
  if (anoGrid) {
    anoGrid.querySelectorAll('.tile[data-file]').forEach(function(tile){
      tile.addEventListener('click', function(e){
        e.preventDefault();
        openDestino(tile.dataset.file);
      });
    });
  }

  /* ---------- liga os links de simulador de dentro da GAVETA ----------
     Mesmo contrato dos cards de ano acima (data-file + openDestino) —
     só que agora é a fonte PRINCIPAL de navegação até um simulador,
     já que a home deixou de ser uma grade de cards. */
  document.querySelectorAll('.drawer-sim-link[data-file]').forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      openDestino(link.dataset.file);
    });
  });

  /* ---------- trilha dos 3 anos (hero) — mesmo contrato ---------- */
  document.querySelectorAll('.trilha-ano[data-file]').forEach(function(card){
    card.addEventListener('click', function(e){
      e.preventDefault();
      openDestino(card.dataset.file);
    });
  });

  /* ════════ GAVETA (MENU PRINCIPAL) ════════
     Abrir/fechar: botão hambúrguer, ✕ próprio, toque no fundo
     escurecido, ou Esc — mesmo contrato de fechamento usado em toda a
     coleção de simuladores. Categorias de ano (e a seção de
     Acessibilidade) expandem uma de cada vez dentro da gaveta, sem
     navegar pra lugar nenhum. */
  (function initDrawer(){
    var toggle = document.getElementById('drawerToggle');
    var drawer = document.getElementById('appDrawer');
    var backdrop = document.getElementById('drawerBackdrop');
    var closeBtn = document.getElementById('drawerClose');
    if (!toggle || !drawer || !backdrop) return;

    function abrir(){
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      backdrop.hidden = false;
      requestAnimationFrame(function(){ backdrop.classList.add('open'); });
      toggle.setAttribute('aria-expanded', 'true');
    }
    function fechar(){
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      backdrop.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      setTimeout(function(){ backdrop.hidden = true; }, 300);
    }
    toggle.addEventListener('click', function(){
      drawer.classList.contains('open') ? fechar() : abrir();
    });
    if (closeBtn) closeBtn.addEventListener('click', fechar);
    backdrop.addEventListener('click', fechar);
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && drawer.classList.contains('open')) fechar();
    });

    /* ════════ TOUR GUIADO (COACHMARK) — "Como funciona" ════════
       Os mesmos 4 passos que já existem como cards estáticos logo
       abaixo, só que entregues como um tour de verdade: balão
       apontando pro elemento real (hambúrguer, gaveta) nos passos
       1-2; nos passos 3-4 (que descrevem o que acontece DENTRO de um
       simulador — não tem como mostrar isso na home) o balão destaca
       o próprio card explicativo, como reforço visual do texto.
       Dispara sozinho na primeira vez que o menu fica disponível
       (login feito) — depois disso, só reaparece se a pessoa pedir
       pelo botão "Rever tour". */
    function abrirGavetaSeFechada() {
      if (drawer && !drawer.classList.contains('open')) toggle.click();
    }
    function fecharGavetaSeAberta() {
      if (drawer && drawer.classList.contains('open')) toggle.click();
    }
    function abrirA11yPainelSeFechado() {
      var painel = document.getElementById('a11yPanel');
      var botao = document.getElementById('a11yToggle');
      if (!painel || !botao || painel.classList.contains('open')) return;
      /* BUG CORRIGIDO (2ª volta): a versão anterior simulava um
         clique real (botao.click()) atrasado com setTimeout pra
         evitar que o clique em "Próximo" — que ainda estava se
         propagando até o document, onde existe um listener de
         "clique fora fecha o painel" — fechasse o painel de novo
         assim que abria. Isso resolvia aquela corrida, mas criava
         outra: o painel só abria de verdade alguns milissegundos
         DEPOIS que renderPasso() (em coachmark.js) já tinha chamado
         scrollIntoView() nele — rolar até um elemento que ainda
         está fechado (altura zero) não rola pra lugar nenhum, então
         o recorte do destaque acabava medindo certo (o motor já foi
         reforçado com várias medições), mas na posição errada da
         tela, sem ter rolado até ali.
         A correção de verdade: abrir o painel manipulando a classe e
         o aria-expanded diretamente, sem disparar clique nenhum —
         nem escapa pro document (nada de corrida), nem precisa de
         atraso (o painel já está aberto, com o tamanho final, antes
         de renderPasso() sequer rodar). */
      painel.classList.add('open');
      botao.setAttribute('aria-expanded', 'true');
    }
    function fecharA11yPainelSeAberto() {
      var painel = document.getElementById('a11yPanel');
      var botao = document.getElementById('a11yToggle');
      if (!painel || !botao || !painel.classList.contains('open')) return;
      painel.classList.remove('open');
      botao.setAttribute('aria-expanded', 'false');
    }
    function iniciarTourComoFunciona() {
      if (typeof Coachmark === 'undefined') return;
      Coachmark.iniciar({
        id: 'home-como-funciona-v3',
        passos: [
          {
            alvo: '#drawerToggle',
            titulo: 'Abra o menu',
            texto: 'Toque no ícone de menu, no canto superior — os simuladores estão organizados por ano.'
          },
          {
            alvo: '#drawerSimuladoresSection',
            titulo: 'Escolha um simulador',
            texto: 'Cada ano tem os simuladores daquele conteúdo. Ao abrir um pela primeira vez, ele mesmo mostra um tour rápido de como funciona.',
            ao_entrar: abrirGavetaSeFechada
          },
          {
            alvo: '#a11yToggle',
            titulo: 'Acessibilidade sempre à mão',
            texto: 'Esse botão fica aqui desde a tela de login — antes mesmo de entrar ou escolher um simulador. Toque pra ver as opções.'
          },
          {
            alvo: '#a11yPanel',
            titulo: 'Tudo isso acompanha você',
            texto: 'Tema claro e escuro, alto contraste, simulação de daltonismo, tamanho da fonte, espaçamento e redução de movimento — escolha uma vez aqui, e vale automaticamente dentro de qualquer um dos simuladores, sem precisar configurar de novo em cada um.',
            ao_entrar: abrirA11yPainelSeFechado,
            ao_sair: function () { fecharA11yPainelSeAberto(); fecharGavetaSeAberta(); }
          }
        ]
      });
    }
    window.addEventListener('quimix:menu-liberado', function () {
      if (!Coachmark.jaViu('home-como-funciona-v3')) {
        setTimeout(iniciarTourComoFunciona, 500); // dá tempo da home renderizar embaixo
      }
    });
    var btnRever = document.getElementById('btnReverTour');
    if (btnRever) btnRever.addEventListener('click', function () {
      Coachmark.reiniciar('home-como-funciona-v3');
      iniciarTourComoFunciona();
    });

    /* Categorias (1º/2º/3º ano): clicar expande a lista ali mesmo,
       dentro da gaveta — clicar de novo recolhe. Não é exclusivo
       (pode ter mais de uma aberta ao mesmo tempo), igual a um
       acordeão comum de FAQ. .drawer-cat-expand é só o botão
       separado do link de cada ano (ver .drawer-cat-link logo
       abaixo) — #a11yToggle continua com a própria mecânica, mais
       abaixo neste arquivo (acessibilidade não tem "página própria"
       pra linkar, então não faz parte deste split). */
    document.querySelectorAll('.drawer-cat-expand').forEach(function(btn){
      btn.addEventListener('click', function(){
        var listaId = btn.getAttribute('aria-controls');
        var lista = document.getElementById(listaId);
        var aberto = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!aberto));
        if (lista) lista.hidden = aberto;
      });
    });

    // Link do próprio ano (ícone+nome+contagem, ao lado do botão de
    // expandir) — mesmo contrato de sempre: data-file + openDestino.
    // A página de cada ano (indexprimeiroano.html etc.) já existe e
    // ficava sem nenhum acesso direto por aqui antes disso.
    document.querySelectorAll('.drawer-cat-link[data-file]').forEach(function(link){
      link.addEventListener('click', function(e){
        e.preventDefault();
        openDestino(link.dataset.file);
      });
    });
  })();

  /* ---------- saudação por horário ---------- */
  function setGreeting(){
    var alvo = document.getElementById('greetingText');
    if (!alvo) return; // home mudou pra página de apresentação — pode não ter mais esse elemento
    var h = new Date().getHours();
    var txt;
    if (h >= 5 && h < 12) txt = 'Bom dia! Qual ano você está cursando?';
    else if (h >= 12 && h < 18) txt = 'Boa tarde! Qual ano você está cursando?';
    else txt = 'Boa noite! Qual ano você está cursando?';
    alvo.textContent = txt;
  }
  setGreeting();

  /* ---------- painel de acessibilidade ---------- */
  var a11yToggle = document.getElementById('a11yToggle');
  var a11yPanel = document.getElementById('a11yPanel');

  function closePanel(){
    a11yPanel.classList.remove('open');
    a11yToggle.setAttribute('aria-expanded', 'false');
  }
  a11yToggle.addEventListener('click', function(){
    var open = a11yPanel.classList.toggle('open');
    a11yToggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function(e){
    /* Clique nos próprios botões do tour guiado (Próximo/Anterior/
       Pular, dentro de .coach-overlay) não conta como "fora" — se
       contasse, o passo do tour que aponta pro painel de
       acessibilidade abriria ele só pra fechar de novo na mesma
       hora: o clique em "Próximo" que trouxe a pessoa até esse
       passo continua se propagando até aqui, depois de já ter
       aberto o painel. */
    if (e.target.closest && e.target.closest('.coach-overlay')) return;
    if (!a11yPanel.contains(e.target) && e.target !== a11yToggle && !a11yToggle.contains(e.target)){
      closePanel();
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closePanel();
  });

  /* ---------- tema claro/escuro ---------- */
  var themeToggle = document.getElementById('themeToggle');
  themeToggle.checked = (state.theme === 'dark');
  themeToggle.addEventListener('change', function(){
    state.theme = themeToggle.checked ? 'dark' : 'light';
    html.setAttribute('data-theme', state.theme);
    // Esse toggle é local (não passa por window.A11Y.definir), então
    // o favicon não seguiria sozinho — chama direto o a11y.js pra
    // trocar a aba pela variante certa (ver atualizarFavicon lá).
    if (window.A11Y && typeof window.A11Y.atualizarFavicon === 'function') {
      window.A11Y.atualizarFavicon(state.theme);
    }
    savePrefs();
  });

  /* ---------- alto contraste ---------- */
  var contrastToggle = document.getElementById('contrastToggle');
  contrastToggle.checked = state.contrast;
  contrastToggle.addEventListener('change', function(){
    state.contrast = contrastToggle.checked;
    html.setAttribute('data-contrast', state.contrast ? 'on' : 'off');
    savePrefs();
  });

  /* ---------- tamanho da fonte ---------- */
  var fontDec = document.getElementById('fontDec');
  var fontInc = document.getElementById('fontInc');
  var fontPct = document.getElementById('fontPct');
  function setFontScale(value){
    state.fontScale = Math.min(1.5, Math.max(0.75, Math.round(value * 10) / 10));
    html.style.setProperty('--font-scale', state.fontScale);
    fontPct.textContent = Math.round(state.fontScale * 100) + '%';
    savePrefs();
  }
  fontPct.textContent = Math.round(state.fontScale * 100) + '%';
  fontDec.addEventListener('click', function(){ setFontScale(state.fontScale - 0.1); });
  fontInc.addEventListener('click', function(){ setFontScale(state.fontScale + 0.1); });

  /* ---------- leitura simples ---------- */
  var readingToggle = document.getElementById('readingToggle');
  readingToggle.checked = (state.reading === 'on');
  readingToggle.addEventListener('change', function(){
    state.reading = readingToggle.checked ? 'on' : 'off';
    html.setAttribute('data-reading', state.reading);
    savePrefs();
  });

  /* ---------- espaçamento de letras ---------- */
  var spacingToggle = document.getElementById('spacingToggle');
  spacingToggle.checked = state.spacing;
  spacingToggle.addEventListener('change', function(){
    state.spacing = spacingToggle.checked;
    html.setAttribute('data-spacing', state.spacing ? 'on' : 'off');
    savePrefs();
  });

  /* ---------- reduzir animações ---------- */
  var motionToggle = document.getElementById('motionToggle');
  motionToggle.checked = state.motion;
  motionToggle.addEventListener('change', function(){
    state.motion = motionToggle.checked;
    html.setAttribute('data-motion', state.motion ? 'on' : 'off');
    savePrefs();
  });

  /* ---------- daltonismo ---------- */
  var colorblindSelect = document.getElementById('colorblindSelect');
  colorblindSelect.value = state.colorblind;
  colorblindSelect.addEventListener('change', function(){
    state.colorblind = colorblindSelect.value;
    html.setAttribute('data-colorblind', state.colorblind);
    applyColorblindFilter();
    savePrefs();
  });

  /* ---------- VLibras ---------- */
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

  /* ---------- navegação para o menu do ano escolhido, na mesma aba ---------- */
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

  function openDestino(file){
    // Se o arquivo for inválido, nulo, "#" ou "Em Produção", cancela a navegação e permanece na tela inicial
    if (!file || file === '#' || file === 'Em Produção' || !file.endsWith('.html')) return;
    
    window.location.href = buildUrl(file);
  }

  /* ============================================================
     "PUXAR PRO CENTRO": cada estrutura mora numa trilha lateral
     (miniatura, sempre visível) e, de tempos em tempos, UMA das
     estruturas químicas (as marcadas com bg-item--hero) é animada
     voando até o centro da tela, bem grande — depois volta pro
     lugar e outra é puxada.
     ------------------------------------------------------------
     Não existe clone nem elemento duplicado: é o MESMO elemento que
     se move, via CSS "transform" (translate + scale). O JS só
     precisa medir a posição real da miniatura (getBoundingClientRect)
     e calcular a distância até o centro da tela — isso vira 3
     variáveis CSS (--tx, --ty, --scale) que a classe "active" usa.
     Tudo isso é ignorado quando "reduzir animações" está ativo, ou
     quando a aba está em segundo plano (a peça ativa simplesmente
     fica onde estava, sem trocar).
     ============================================================ */
  function initBackgroundPull(){
    var todosOsItens = Array.prototype.slice.call(document.querySelectorAll('.bg-item'));
    var heroes = todosOsItens.filter(function(el){ return el.classList.contains('bg-item--hero'); });
    if (!heroes.length) return;

    // mede a miniatura (posição/tamanho reais, já com o layout pronto)
    // e calcula o quanto ela precisa se mover/crescer pra chegar
    // grande e centralizada na tela
    function calcularTransformDeVoo(el){
      var tamanhoNoCentro = Math.min(window.innerWidth, window.innerHeight) * 0.72;
      var rect = el.getBoundingClientRect();
      var origemX = rect.left + rect.width / 2;
      var origemY = rect.top + rect.height / 2;
      var destinoX = window.innerWidth / 2;
      var destinoY = window.innerHeight / 2;
      var escala = tamanhoNoCentro / rect.width;
      el.style.setProperty('--tx', (destinoX - origemX) + 'px');
      el.style.setProperty('--ty', (destinoY - origemY) + 'px');
      el.style.setProperty('--scale', escala);
    }

    // recalcula todo mundo (chamado no início e ao redimensionar a
    // janela) — pula quem está ativo no momento, porque medir um
    // elemento já "voado" pro centro daria uma conta errada
    function recalcularTodos(){
      heroes.forEach(function(el){
        if (!el.classList.contains('active')) calcularTransformDeVoo(el);
      });
    }
    recalcularTodos();

    var resizeTimer;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(recalcularTodos, 200);
    });

    var indice = Math.floor(Math.random() * heroes.length);

    function ativar(el){
      calcularTransformDeVoo(el); // garante que a conta está fresca antes de voar
      el.classList.add('active');
    }

    // sorteia o próximo índice, diferente do atual (senão, com pouca
    // sorte, a mesma estrutura poderia "voltar a voar" duas vezes seguidas)
    function sortearProximoIndice(){
      if (heroes.length < 2) return indice;
      var proximo;
      do {
        proximo = Math.floor(Math.random() * heroes.length);
      } while (proximo === indice);
      return proximo;
    }

    // a primeira já entra puxada pro centro pouco depois do carregamento
    setTimeout(function(){ ativar(heroes[indice]); }, 600);

    setInterval(function(){
      if (state.motion || document.hidden) return; // fica só na que já estava puxada, sem trocar
      heroes[indice].classList.remove('active');
      indice = sortearProximoIndice();
      ativar(heroes[indice]);
    }, 12000);
  }

  /* ---------- alterna o modelo atômico visível ---------- */
  function initAtomCycle(){
    var atomItem = document.getElementById('atomItem');
    if (!atomItem) return;
    var total = 4; // thomson, rutherford, bohr, quântico
    var i = 0;
    setInterval(function(){
      if (state.motion || document.hidden) return;
      i = (i + 1) % total;
      atomItem.setAttribute('data-model', String(i));
    }, 5000);
  }

  /* ---------- tabela periódica: 118 elementos ---------- */
  // [número atômico, símbolo, massa atômica aproximada]
  var PERIODIC_ELEMENTS = [
    [1,'H','1,008'],[2,'He','4,003'],[3,'Li','6,94'],[4,'Be','9,012'],
    [5,'B','10,81'],[6,'C','12,01'],[7,'N','14,01'],[8,'O','16,00'],
    [9,'F','19,00'],[10,'Ne','20,18'],[11,'Na','22,99'],[12,'Mg','24,31'],
    [13,'Al','26,98'],[14,'Si','28,09'],[15,'P','30,97'],[16,'S','32,07'],
    [17,'Cl','35,45'],[18,'Ar','39,95'],[19,'K','39,10'],[20,'Ca','40,08'],
    [21,'Sc','44,96'],[22,'Ti','47,87'],[23,'V','50,94'],[24,'Cr','52,00'],
    [25,'Mn','54,94'],[26,'Fe','55,85'],[27,'Co','58,93'],[28,'Ni','58,69'],
    [29,'Cu','63,55'],[30,'Zn','65,38'],[31,'Ga','69,72'],[32,'Ge','72,63'],
    [33,'As','74,92'],[34,'Se','78,97'],[35,'Br','79,90'],[36,'Kr','83,80'],
    [37,'Rb','85,47'],[38,'Sr','87,62'],[39,'Y','88,91'],[40,'Zr','91,22'],
    [41,'Nb','92,91'],[42,'Mo','95,95'],[43,'Tc','[98]'],[44,'Ru','101,1'],
    [45,'Rh','102,9'],[46,'Pd','106,4'],[47,'Ag','107,9'],[48,'Cd','112,4'],
    [49,'In','114,8'],[50,'Sn','118,7'],[51,'Sb','121,8'],[52,'Te','127,6'],
    [53,'I','126,9'],[54,'Xe','131,3'],[55,'Cs','132,9'],[56,'Ba','137,3'],
    [57,'La','138,9'],[58,'Ce','140,1'],[59,'Pr','140,9'],[60,'Nd','144,2'],
    [61,'Pm','[145]'],[62,'Sm','150,4'],[63,'Eu','152,0'],[64,'Gd','157,3'],
    [65,'Tb','158,9'],[66,'Dy','162,5'],[67,'Ho','164,9'],[68,'Er','167,3'],
    [69,'Tm','168,9'],[70,'Yb','173,0'],[71,'Lu','175,0'],[72,'Hf','178,5'],
    [73,'Ta','180,9'],[74,'W','183,8'],[75,'Re','186,2'],[76,'Os','190,2'],
    [77,'Ir','192,2'],[78,'Pt','195,1'],[79,'Au','197,0'],[80,'Hg','200,6'],
    [81,'Tl','204,4'],[82,'Pb','207,2'],[83,'Bi','209,0'],[84,'Po','[209]'],
    [85,'At','[210]'],[86,'Rn','[222]'],[87,'Fr','[223]'],[88,'Ra','[226]'],
    [89,'Ac','[227]'],[90,'Th','232,0'],[91,'Pa','231,0'],[92,'U','238,0'],
    [93,'Np','[237]'],[94,'Pu','[244]'],[95,'Am','[243]'],[96,'Cm','[247]'],
    [97,'Bk','[247]'],[98,'Cf','[251]'],[99,'Es','[252]'],[100,'Fm','[257]'],
    [101,'Md','[258]'],[102,'No','[259]'],[103,'Lr','[266]'],[104,'Rf','[267]'],
    [105,'Db','[268]'],[106,'Sg','[269]'],[107,'Bh','[270]'],[108,'Hs','[269]'],
    [109,'Mt','[278]'],[110,'Ds','[281]'],[111,'Rg','[282]'],[112,'Cn','[285]'],
    [113,'Nh','[286]'],[114,'Fl','[289]'],[115,'Mc','[290]'],[116,'Lv','[293]'],
    [117,'Ts','[294]'],[118,'Og','[294]']
  ];

  /* ---------- percorre os 118 elementos no único card fixo ---------- */
  function initElementCycle(){
    var num  = document.querySelector('#elementItem .js-num');
    var sym  = document.querySelector('#elementItem .js-sym');
    var mass = document.querySelector('#elementItem .js-mass');
    if (!num || !sym || !mass) return;
    var i = 0;
    setInterval(function(){
      if (state.motion || document.hidden) return;
      i = (i + 1) % PERIODIC_ELEMENTS.length;
      var e = PERIODIC_ELEMENTS[i];
      num.textContent  = e[0];
      sym.textContent  = e[1];
      mass.textContent = e[2];
    }, 2200);
  }

  initBackgroundPull();
  initAtomCycle();
  initElementCycle();

})();
