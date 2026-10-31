/* ================================================================
   coachmark.js — MOTOR GENÉRICO DE TOUR GUIADO (COACHMARK)
   ================================================================
   Um "coachmark" é o balão flutuante que aponta pra um elemento real
   da tela e explica o que ele faz — a técnica de onboarding mais
   comum em apps (Notion, Duolingo, quase todo app novo usa isso nos
   primeiros segundos). Este arquivo é o MOTOR genérico: qualquer
   página do site pode montar seu próprio tour só descrevendo os
   passos, sem reescrever a mecânica de balão/destaque/navegação.

   COMO USAR (de qualquer página):
     Coachmark.iniciar({
       id: 'home',                 // chave própria no localStorage — tours diferentes não pisam um no outro
       passos: [
         { alvo: '#drawerToggle',  titulo: 'Abra o menu', texto: 'Toque aqui...' },
         { alvo: null,             titulo: 'Sem alvo', texto: 'Aparece centralizado, sem destaque.' },
       ]
     });

   Cada passo pode ter:
     alvo      — seletor CSS do elemento a destacar, ou null/ausente
                 pra um passo "flutuante" (sem recorte, balão centralizado)
     titulo    — título curto do balão
     texto     — texto explicativo
     ao_entrar — função opcional, roda ANTES de mostrar o passo (ex.:
                 abrir a gaveta pra revelar o próximo alvo)
     ao_sair   — função opcional, roda ao SAIR do passo (ex.: fechar
                 a gaveta de novo antes de avançar)

   Coachmark.jaViu(id)      — true se esse tour específico já foi
                               concluído ou pulado antes.
   Coachmark.reiniciar(id)  — esquece que já viu, pra rever o tour.

   Depende de: nada (motor puro). Estilos em coachmark.css.
   ================================================================ */

var Coachmark = (function () {
  'use strict';

  var CHAVE_PREFIXO = 'quimix_coach_visto_';
  var estadoAtual = null; // { id, passos, indice, els:{overlay,spot,balao,...} }

  function jaViu(id) {
    try { return localStorage.getItem(CHAVE_PREFIXO + id) === '1'; }
    catch (e) { return false; }
  }
  function marcarVisto(id) {
    try { localStorage.setItem(CHAVE_PREFIXO + id, '1'); } catch (e) { /* modo privado: ok, só reaparece na próxima visita */ }
  }
  function reiniciar(id) {
    try { localStorage.removeItem(CHAVE_PREFIXO + id); } catch (e) { /* nada a fazer */ }
  }

  function montarDom() {
    var overlay = document.createElement('div');
    overlay.className = 'coach-overlay';
    overlay.innerHTML =
      '<div class="coach-spot" id="coachSpot" hidden></div>' +
      '<div class="coach-balao" role="dialog" aria-modal="true" aria-labelledby="coachTitulo">' +
      '  <button type="button" class="coach-pular" id="coachPular">Pular tour</button>' +
      '  <p class="coach-titulo" id="coachTitulo"></p>' +
      '  <p class="coach-texto" id="coachTexto"></p>' +
      '  <div class="coach-rodape">' +
      '    <div class="coach-pontos" id="coachPontos"></div>' +
      '    <div class="coach-botoes">' +
      '      <button type="button" class="coach-btn coach-btn--voltar" id="coachVoltar">Anterior</button>' +
      '      <button type="button" class="coach-btn coach-btn--avancar" id="coachAvancar">Próximo</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(overlay);
    return {
      overlay: overlay,
      spot: overlay.querySelector('#coachSpot'),
      balao: overlay.querySelector('.coach-balao'),
      titulo: overlay.querySelector('#coachTitulo'),
      texto: overlay.querySelector('#coachTexto'),
      pontos: overlay.querySelector('#coachPontos'),
      btnVoltar: overlay.querySelector('#coachVoltar'),
      btnAvancar: overlay.querySelector('#coachAvancar'),
      btnPular: overlay.querySelector('#coachPular')
    };
  }

  function posicionarNoAlvo(els, alvoEl) {
    if (!alvoEl) {
      els.spot.hidden = true;
      els.balao.classList.add('coach-balao--centro');
      els.balao.style.top = '';
      els.balao.style.left = '';
      return;
    }
    els.balao.classList.remove('coach-balao--centro');
    var r = alvoEl.getBoundingClientRect();
    var pad = 8;
    els.spot.hidden = false;
    els.spot.style.top = (r.top - pad) + 'px';
    els.spot.style.left = (r.left - pad) + 'px';
    els.spot.style.width = (r.width + pad * 2) + 'px';
    els.spot.style.height = (r.height + pad * 2) + 'px';

    /* Ordem de tentativa: embaixo → em cima → à direita → à esquerda
       → por último, cola no topo da tela (alvo mais alto que a tela
       inteira, ex.: uma barra lateral esticada — nenhuma das quatro
       serve). Cada tentativa checa se cabe de verdade, sem cortar
       nas bordas. */
    var margemTela = 12;
    var balaoRect = els.balao.getBoundingClientRect();
    var top, left;

    var cabeEmbaixo = r.bottom + pad + 10 + balaoRect.height <= window.innerHeight - margemTela;
    var cabeEmCima = r.top - pad - 10 - balaoRect.height >= margemTela;
    var cabeDireita = r.right + pad + 10 + balaoRect.width <= window.innerWidth - margemTela;
    var cabeEsquerda = r.left - pad - 10 - balaoRect.width >= margemTela;

    if (cabeEmbaixo) {
      top = r.bottom + pad + 10;
      left = r.left + r.width / 2 - balaoRect.width / 2;
    } else if (cabeEmCima) {
      top = r.top - pad - 10 - balaoRect.height;
      left = r.left + r.width / 2 - balaoRect.width / 2;
    } else if (cabeDireita) {
      left = r.right + pad + 10;
      top = r.top + r.height / 2 - balaoRect.height / 2;
    } else if (cabeEsquerda) {
      left = r.left - pad - 10 - balaoRect.width;
      top = r.top + r.height / 2 - balaoRect.height / 2;
    } else {
      // alvo maior que a tela em todas as direções: última saída,
      // cola no topo, centralizado na largura.
      top = margemTela;
      left = window.innerWidth / 2 - balaoRect.width / 2;
    }

    top = Math.max(margemTela, Math.min(top, window.innerHeight - balaoRect.height - margemTela));
    left = Math.max(margemTela, Math.min(left, window.innerWidth - balaoRect.width - margemTela));

    els.balao.style.top = top + 'px';
    els.balao.style.left = left + 'px';
  }

  function renderPasso() {
    var st = estadoAtual;
    var passo = st.passos[st.indice];
    var els = st.els;

    els.titulo.textContent = passo.titulo || '';
    els.texto.textContent = passo.texto || '';
    els.btnVoltar.hidden = st.indice === 0;
    els.btnAvancar.textContent = (st.indice === st.passos.length - 1) ? 'Concluir' : 'Próximo';

    els.pontos.innerHTML = '';
    st.passos.forEach(function (_, i) {
      var p = document.createElement('span');
      p.className = 'coach-ponto' + (i === st.indice ? ' coach-ponto--ativo' : '');
      els.pontos.appendChild(p);
    });

    var alvoEl = passo.alvo ? document.querySelector(passo.alvo) : null;
    if (alvoEl && typeof alvoEl.scrollIntoView === 'function') {
      alvoEl.scrollIntoView({ block: 'center', behavior: 'auto' });
    }
    /* Mede a posição mais de uma vez, em vez de confiar numa única
       espera fixa. Uma máquina mais lenta (ou um navegador real,
       fora do sandbox onde isso foi testado) pode levar mais do que
       300ms pra terminar de aplicar o que ao_entrar() disparou (abrir
       gaveta, abrir painel) — medir cedo demais pega o alvo ainda no
       tamanho errado, e o recorte do destaque fica por cima do lugar
       errado. Reforça a medição em 300ms, 600ms e 1000ms: cada
       passada corrige qualquer posição capturada cedo demais nas
       anteriores, sem custo perceptível quando tudo já estava certo
       desde a primeira. */
    [300, 600, 1000].forEach(function (atraso) {
      setTimeout(function () { posicionarNoAlvo(els, alvoEl); }, atraso);
    });

    setTimeout(function () { els.btnAvancar.focus(); }, 50);
  }

  function irParaPasso(indice) {
    var st = estadoAtual;
    var passoAtual = st.passos[st.indice];
    if (passoAtual && typeof passoAtual.ao_sair === 'function') passoAtual.ao_sair();

    st.indice = indice;
    var novoPasso = st.passos[st.indice];
    if (novoPasso && typeof novoPasso.ao_entrar === 'function') novoPasso.ao_entrar();

    renderPasso();
  }

  function encerrar() {
    if (!estadoAtual) return;
    var passoAtual = estadoAtual.passos[estadoAtual.indice];
    if (passoAtual && typeof passoAtual.ao_sair === 'function') passoAtual.ao_sair();
    marcarVisto(estadoAtual.id);
    estadoAtual.els.overlay.remove();
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('resize', onResize);
    estadoAtual = null;
    /* Avisa quem precisa reagir ao fim do tour. Hoje só o trilho
       recolhível (js/ui/sidebar-rail.js) escuta: ele reabre as
       sidebars enquanto o tour roda e as devolve ao estado do aluno
       aqui. Ver o comentário gêmeo em iniciar(). */
    document.dispatchEvent(new CustomEvent('coachmark:fim'));
  }

  function onKeydown(e) {
    if (!estadoAtual) return;
    if (e.key === 'Escape') { encerrar(); return; }
    if (e.key === 'ArrowRight') avancar();
    if (e.key === 'ArrowLeft') voltar();
  }
  function onResize() {
    if (!estadoAtual) return;
    var passo = estadoAtual.passos[estadoAtual.indice];
    var alvoEl = passo.alvo ? document.querySelector(passo.alvo) : null;
    posicionarNoAlvo(estadoAtual.els, alvoEl);
  }

  function avancar() {
    var st = estadoAtual;
    if (st.indice >= st.passos.length - 1) { encerrar(); return; }
    irParaPasso(st.indice + 1);
  }
  function voltar() {
    var st = estadoAtual;
    if (st.indice <= 0) return;
    irParaPasso(st.indice - 1);
  }

  function iniciar(config) {
    /* BUG CORRIGIDO: as prévias "ao vivo" da home e das páginas de
       ano carregam a página REAL do simulador dentro de um <iframe>
       — inclusive todo o JS dela, então o tour disparava sozinho
       DENTRO da prévia minúscula, sem nenhum sentido ali (a prévia é
       só pra olhar, não é a página que a pessoa está usando).
       window.self !== window.top é o jeito padrão de saber se este
       documento está rodando dentro de um iframe (mesmo same-origin,
       como aqui) — se estiver, nunca inicia. Fica centralizado aqui
       no motor de propósito: protege TODO tour, de qualquer
       simulador, sem precisar repetir a checagem em cada tour.js. */
    try {
      if (window.self !== window.top) return;
    } catch (e) {
      // acesso a window.top bloqueado (cross-origin) — mais seguro
      // assumir que está embutido e não iniciar.
      return;
    }
    if (!config || !config.passos || !config.passos.length) return;
    if (estadoAtual) encerrar(); // não empilha dois tours

    var els = montarDom();
    estadoAtual = { id: config.id || 'tour', passos: config.passos, indice: 0, els: els };

    els.btnAvancar.addEventListener('click', avancar);
    els.btnVoltar.addEventListener('click', voltar);
    els.btnPular.addEventListener('click', encerrar);
    els.overlay.addEventListener('click', function (e) {
      if (e.target === els.overlay) encerrar(); // toque no fundo escurecido = pular
    });
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('resize', onResize);
    /* POR QUE ESTE EVENTO EXISTE
       Todo tour do projeto aponta para elementos que moram DENTRO das
       sidebars (#hdr-result, #sidebar-left, #hdr-periodic...). Desde
       que o trilho recolhível passou a recolher as sidebares por
       padrão, esses alvos ficam `visibility:hidden` — e o coachmark
       mede o retângulo de um elemento invisível, destacando o vazio.
       Levantamento na época: 16 dos 23 simuladores tinham pelo menos
       um alvo nessa situação; o gases tinha 12.
       Em vez de reescrever 23 tour.js, o motor avisa e quem mexeu no
       layout se ajeita. O trilho reabre as duas sidebars sem salvar a
       mudança e as devolve ao estado do aluno no 'coachmark:fim'. */
    document.dispatchEvent(new CustomEvent('coachmark:inicio'));

    var primeiroPasso = estadoAtual.passos[0];
    if (primeiroPasso && typeof primeiroPasso.ao_entrar === 'function') primeiroPasso.ao_entrar();
    renderPasso();
  }

  return { iniciar: iniciar, encerrar: encerrar, jaViu: jaViu, reiniciar: reiniciar };
})();
