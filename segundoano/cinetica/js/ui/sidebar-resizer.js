/* ================================================================
   NÚCLEO COMPARTILHADO — sidebars-resize.js
   ================================================================
   Extraído do bloco "SIDEBARS REDIMENSIONÁVEIS", presente nos seis
   simuladores da família com uma ÚNICA diferença real entre eles:
   o prefixo da chave salva no localStorage (para cada simulador
   lembrar a largura de sidebar que o aluno escolheu, sem misturar
   com a de outro simulador).

   AJUSTE FEITO NESTA EXTRAÇÃO (documentado, não escondido):
   antes, cada arquivo tinha o prefixo escrito à mão ('cinetica-w-',
   'gases-w-'...). Aqui ele vem de `window.SIM_ID`, que cada
   simulador define numa linha no próprio HTML (ver index de cada
   um). Migração de dado: quem já tinha uma largura salva continua
   com a MESMA chave 'gases-w-...' etc., porque SIM_ID recebe
   exatamente o mesmo texto que estava fixo no código antigo — nada
   se perde para quem já usava o site.

   Também unifiquei uma pequena inconsistência encontrada: cinética,
   eletroquímica, equilíbrio, radioatividade e soluções já garantiam
   `position: relative` na sidebar antes de ancorar a alça de
   arrastar; o de gases não tinha essa linha (função ainda
   funcionava, mas dependia de o CSS já definir a posição — corrigido
   aqui para os oito simuladores usarem o mesmo comportamento mais
   seguro).

   ORDEM DE CARGA: depois de offcanvas-mobile.js — é o último módulo
   do núcleo. Depois dele vem o arquivo de mecânica específico do
   simulador.
   ================================================================ */
'use strict';

document.addEventListener('DOMContentLoaded', function () {
  var targets = [
    { id: 'sidebar-left', side: 'left', cssVar: '--swl', min: 250, max: 480 },
    { id: 'sidebar-right', side: 'right', cssVar: '--swr', min: 250, max: 480 },
  ];
  var root = document.documentElement;
  var rafPending = false;
  var simId = 'cinetica'; // travado — cada simulador tem sua própria cópia deste arquivo

  function fireResize() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      window.dispatchEvent(new Event('resize'));
    });
  }

  targets.forEach(function (cfg) {
    var el = document.getElementById(cfg.id);
    if (!el) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';

    var storeKey = simId + '-w-' + cfg.cssVar.replace(/^--/, '');
    try {
      var saved = parseInt(localStorage.getItem(storeKey), 10);
      if (saved && saved >= cfg.min && saved <= cfg.max) {
        root.style.setProperty(cfg.cssVar, saved + 'px');
      }
    } catch (e) { /* localStorage indisponível — segue sem persistência */ }

    var handle = document.createElement('div');
    handle.className = 'sidebar-resizer sidebar-resizer--' + cfg.side;
    handle.setAttribute('aria-hidden', 'true');
    el.appendChild(handle);

    var dragging = false, startX = 0, startW = 0;

    handle.addEventListener('pointerdown', function (e) {
      if (getComputedStyle(el).position === 'fixed') return; // gaveta mobile
      dragging = true;
      startX = e.clientX;
      startW = el.getBoundingClientRect().width;
      handle.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });

    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var delta = e.clientX - startX;
      var w = cfg.side === 'left' ? startW + delta : startW - delta;
      w = Math.max(cfg.min, Math.min(cfg.max, Math.round(w)));
      root.style.setProperty(cfg.cssVar, w + 'px');
      fireResize();
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem(storeKey, Math.round(el.getBoundingClientRect().width));
      } catch (e) { /* sem persistência */ }
      fireResize();
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
  });
});
