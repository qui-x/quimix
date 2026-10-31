/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE
   ARQUIVO: preferencias.js
   ───────────────────────────────────────────────────────────────
   Receptor de preferências de acessibilidade (tema, contraste,
   daltonismo, leitura simples, escala de fonte) vindas da URL ou
   por postMessage da Central de Simuladores. A tabela não tem
   controles de acessibilidade próprios — tudo chega de fora.
   Depende de: nada (roda assim que a página carrega).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* =====================================================================
   SITP — RECEPTOR DE ACESSIBILIDADE (mesclado aqui de acessibilidadesitp.js
   — arquivo extra removido, já que a acessibilidade geral é controlada
   pela Central via URL/postMessage; não há motivo pra manter isso num
   arquivo .js separado).
   ---------------------------------------------------------------------
   Este bloco NÃO cria botões nem controles. A tabela não tem UI de
   acessibilidade própria: quem controla é a Central de Simuladores (menu).

   O menu envia o estado de acessibilidade de duas formas:
     (1) parâmetros na URL, no momento em que abre a tabela:
         ?theme=dark|light
         &reading=on|off
         &colorblind=none|protanopia|deuteranopia|tritanopia|acromatopsia
         &contrast=true|false
         &fontscale=0.75–1.5
     (2) postMessage em tempo real (caso a tabela seja embutida em iframe):
         { source:'central-simuladores', type:'a11y-update', payload:{...} }

   Aqui apenas traduzimos esse estado para os atributos data-* e a
   variável --font-scale que o resto deste arquivo já lê internamente.
   ===================================================================== */

(function () {
  const MIN_SCALE = 0.8, MAX_SCALE = 2.5;
  const root = document.documentElement;

  function aplicarEscala(val) {
    const fs = Math.min(MAX_SCALE, Math.max(MIN_SCALE, val));
    root.style.setProperty('--font-scale', fs);
  }

  // Repinta as cores de categoria em toda a tabela e legenda quando o
  // daltonismo muda, sem recriar o DOM. Usa getCatColorHex() do script.js.
  function redesenharCores() {
    if (typeof getCatColorHex !== 'function') return;
    if (window.modoLamber) {
      if (typeof window.__sitpPintarModoLamber === 'function') window.__sitpPintarModoLamber(true);
      return;
    }
    document.querySelectorAll('.element[data-cat]').forEach(div => {
      const cc = getCatColorHex(div.dataset.cat) || '#888';
      div.style.setProperty('--cat-color', cc);
      const sym = div.querySelector('.el-symbol');
      if (sym) sym.style.color = cc;
    });
    document.querySelectorAll('.serie-toggle').forEach(div => {
      const cc = getCatColorHex(div.dataset.cat) || '#888';
      div.style.setProperty('--cat-color', cc);
      const sym = div.querySelector('.el-symbol');
      if (sym) sym.style.color = cc;
      const arrow = div.querySelector('.toggle-arrow');
      if (arrow) arrow.style.color = cc;
    });
    document.querySelectorAll('.legend-item[data-cat] .legend-dot').forEach(dot => {
      const cat = dot.closest('.legend-item').dataset.cat;
      dot.style.background = getCatColorHex(cat) || '#888';
    });
    document.querySelectorAll('.legend-item[data-cat].ativo').forEach(b => {
      if (typeof setItemAtivo === 'function')
        setItemAtivo(b, getCatColorHex(b.dataset.cat) || '#00e5ff');
    });
    // Círculos do modo raio: usam --orb-s/p/d/f, que mudam com tema e
    // alto contraste, então precisam ser recalculados junto.
    // (No modo lamber o retorno acima já cobriu isso, porque
    // pintarModoLamber() repinta o círculo por conta própria.)
    /* Uma chamada cobre TODAS as propriedades: cores de bloco (que mudam
       com tema e contraste) e a rampa do mapa de calor (que troca de
       colorida para luminosidade em modo daltônico). */
    if (typeof atualizarVisualPropriedade === 'function') atualizarVisualPropriedade();
  }
  // expõe para uso interno
  window.__sitpRedesenharCores = redesenharCores;

  // O SITP não tem paleta dedicada para acromatopsia: usamos deuteranopia.
  function normalizarDaltonico(cb) {
    if (cb === null || cb === undefined || cb === 'none' || cb === '') return '';
    if (cb === 'acromatopsia') return 'deuteranopia';
    if (['protanopia', 'deuteranopia', 'tritanopia'].includes(cb)) return cb;
    return '';
  }

  function aplicarPayload(payload) {
    if (!payload) return;
    let mudouDalt = false;

    if (payload.theme) {
      root.setAttribute('data-theme', payload.theme === 'light' ? 'light' : '');
    }
    if (typeof payload.contrast !== 'undefined') {
      root.setAttribute('data-contrast', payload.contrast ? 'high' : '');
    }
    if (payload.reading) {
      // data-reading (nao data-simple): e o atributo que o a11y.js usa,
      // e agora o stylesitp.css tambem espera esse nome.
      root.setAttribute('data-reading', payload.reading === 'on' ? 'on' : 'off');
    }
    if (typeof payload.colorblind !== 'undefined' && payload.colorblind !== null) {
      const modo = normalizarDaltonico(payload.colorblind);
      const atual = root.getAttribute('data-daltonico') || '';
      mudouDalt = atual !== modo;
      root.setAttribute('data-daltonico', modo);
    }
    if (typeof payload.fontScale === 'number' && !Number.isNaN(payload.fontScale)) {
      aplicarEscala(payload.fontScale);
    }

    // Se a tabela já foi renderizada e o daltonismo mudou, repinta.
    if (mudouDalt) redesenharCores();
  }

  function aplicarDaUrl() {
    const p = new URLSearchParams(window.location.search);
    if (![...p.keys()].length) return;
    aplicarPayload({
      theme: p.get('theme'),
      reading: p.get('reading'),
      colorblind: p.get('colorblind'),
      contrast: p.get('contrast') === 'true',
      fontScale: p.has('fontscale') ? parseFloat(p.get('fontscale')) : undefined
    });
  }

  // postMessage em tempo real (quando embutida em iframe pelo menu)
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.source !== 'central-simuladores' || e.data.type !== 'a11y-update') return;
    aplicarPayload(e.data.payload || {});
  });

  // Aplica o estado vindo da URL assim que possível.
  // 1ª passada: imediata (define data-* / --font-scale antes da pintura).
  aplicarDaUrl();
  // 2ª passada: após a tabela existir, para repintar as cores de categoria.
  window.addEventListener('DOMContentLoaded', () => {
    aplicarDaUrl();
    if (typeof window.__sitpRedesenharCores === 'function') window.__sitpRedesenharCores();
  });

  /* ─────────────────────────────────────────────────────────────────
     BUG CORRIGIDO: aplicarPayload() só repintava as cores quando o
     DALTONISMO mudava (mudouDalt) — nunca quando só o TEMA mudava.
     Passava despercebido porque, no carregamento normal (link vindo
     da Central com ?theme=... na URL), a 2ª passada acima já pinta
     tudo certo direto. Só ficava errado num caso real e comum: voltar
     pelo botão do navegador restaura a página do cache (bfcache) sem
     rodar os scripts de novo — o a11y.js (arquivo compartilhado pelas
     25 páginas do projeto, ver pageshow lá) reaplica data-theme/
     data-contrast/data-colorblind direto no <html>, mas não sabe que
     esta página tem uma função própria de repintura (redesenharCores),
     então símbolo do elemento e pontinhos da legenda ficavam com a
     cor do tema ANTERIOR.
     Corrigido observando os atributos direto no <html>, em vez de
     depender de quem os mudou — funciona tanto com o a11y.js quanto
     com o postMessage/URL legado desta página, sem precisar tocar no
     a11y.js compartilhado (risco zero pras outras 24 páginas). ───── */
  new MutationObserver(() => redesenharCores()).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-contrast', 'data-colorblind', 'data-daltonico']
  });
})();

