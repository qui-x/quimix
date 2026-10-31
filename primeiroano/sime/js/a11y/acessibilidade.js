/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE
   ARQUIVO: acessibilidade.js
   ───────────────────────────────────────────────────────────────
   Receptor de preferências de acessibilidade (tema, contraste,
   daltonismo, leitura simplificada, redução de movimento, espaçamento
   e escala de fonte), aceitas por parâmetro de URL ou por postMessage
   vindo da Central de Simuladores — mesma técnica usada no SIMA.
   Também define announce(), usada por todo o simulador para avisar
   leitores de tela (aria-live) quando a substância ou o estado físico
   mudam.
   NOTA DE REFATORAÇÃO: o arquivo original (scriptsime.js) continha
   este mesmo bloco duplicado (colado duas vezes, de forma idêntica).
   A duplicata foi removida aqui — o comportamento não muda (aplicar
   o mesmo payload duas vezes era redundante), mas o código deixa de
   rodar em duplicidade a cada carregamento da página.
   Depende de: nada (roda assim que a página carrega).
   Usado por: ui/painel-substancias.js e orquestrador.js chamam
              announce() para avisos ao leitor de tela.
═══════════════════════════════════════════════════════════════ */

'use strict';

 /* Receptor de acessibilidade — mesma técnica do SIMA.
       Aceita URL params e postMessage da Central de Simuladores.
       Classes aplicadas: body.light-mode / .high-contrast / .simple-read
       / .reduce-motion / .wide-spacing
       Overlay de daltonismo: backdrop-filter no #colorblindOverlay
       IMPORTANTE: este script roda logo após <body> abrir (não em <head>)
       porque usa document.body diretamente — em <head> o body ainda não
       existe e document.body.classList.toggle(...) lançava um erro que
       travava todo o script (tema, daltonismo e o listener de postMessage
       nunca chegavam a ser aplicados). */
    (function(){
      var CVD = ['none','protanopia','deuteranopia','tritanopia','acromatopsia'];
 
      function applyFontScale(s) {
        var fs = Math.min(1.5, Math.max(0.75, parseFloat(s)||1));
        document.documentElement.style.setProperty('--font-scale', fs);
      }
      function applyColorblindOverlay(type) {
        var ov = document.getElementById('colorblindOverlay');
        if (!ov) return;
        var val = (!type || type==='none') ? 'none' : 'url(#f-'+type+')';
        ov.style.backdropFilter = val;
        ov.style.webkitBackdropFilter = val;
      }
      function applyPayload(pl) {
        if (!pl) return;
        if (pl.theme)    document.body.classList.toggle('light-mode',    pl.theme==='light');
        if (pl.contrast!=null) document.body.classList.toggle('high-contrast', !!pl.contrast);
        if (pl.reading)  document.body.classList.toggle('simple-read',   pl.reading==='on');
        if (pl.motion)   document.body.classList.toggle('reduce-motion', !!pl.motion);
        if (pl.spacing!=null) document.body.classList.toggle('wide-spacing', !!pl.spacing);
        if (pl.colorblind && CVD.indexOf(pl.colorblind)!==-1) applyColorblindOverlay(pl.colorblind);
        if (pl.fontScale) applyFontScale(pl.fontScale);
      }
 
      // Aplicar a partir da URL
      (function(){
        var p = new URLSearchParams(window.location.search);
        applyPayload({
          theme:      p.get('theme'),
          contrast:   p.get('contrast')==='true',
          colorblind: p.get('colorblind'),
          reading:    p.get('reading'),
          motion:     p.get('motion')==='true',
          spacing:    p.get('spacing')==='true',
          fontScale:  parseFloat(p.get('fontscale'))||1,
        });
      })();
 
      // Escutar postMessage da Central
      window.addEventListener('message', function(e){
        if (!e.data || e.data.source!=='central-simuladores' || e.data.type!=='a11y-update') return;
        applyPayload(e.data.payload);
      });
    })();

/**
 * Anuncia uma mensagem para leitores de tela via aria-live.
 * priority: 'polite' (espera o usuário parar) | 'assertive' (interrompe)
 */
function announce(msg, priority) {
  var id = (priority === 'assertive') ? 'sr-live-assertive' : 'sr-live';
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(function() { el.textContent = msg; });
}
