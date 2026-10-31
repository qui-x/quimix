/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE
   ARQUIVO: preferencias.js
   ───────────────────────────────────────────────────────────────
   Receptor de preferências de acessibilidade (tema, contraste,
   daltonismo, leitura simples, redução de movimento, escala de
   fonte) vindas da URL ou por postMessage da Central de Simuladores.
   Mesmo contrato usado no SIEM.
   Depende de: nada (roda assim que a página carrega).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   scriptsiqi.js — SIQI v2
   Arquitetura: mesma do SIEM
     · receptor de acessibilidade (data-* no <html>)
     · painéis recolhíveis com transitionend / scroll-ready
     · sub-list com mol-cat-tabs (abas de categoria)
     · modal de expansão (expand-overlay)
     · mobile off-canvas com backdrop
     · canvas de partículas adaptado ao estado do Lab
   Didática: método socrático, 4 famílias de reações
═══════════════════════════════════════════════════════════════════ */
 /* Receptor de acessibilidade — mesmo contrato do SIEM.
       Aceita URL params e postMessage.
       Aplica: data-theme, data-contrast, #colorblindOverlay (daltonismo),
               data-reading, data-motion, --a11y-font-scale */
    (function(){
      var CVD=['none','protanopia','deuteranopia','tritanopia','acromatopsia'];
      function applyColorblindOverlay(type){
        var ov=document.getElementById('colorblindOverlay');
        if(!ov) return;
        var val=(!type||type==='none')?'none':'url(#f-'+type+')';
        ov.style.backdropFilter=val;
        ov.style.webkitBackdropFilter=val;
      }
      function applyPayload(pl){
        if(!pl) return;
        var h=document.documentElement;
        if(pl.theme)      h.setAttribute('data-theme', pl.theme);
        if(pl.contrast)   h.setAttribute('data-contrast', pl.contrast==='true'||pl.contrast===true?'high':'');
        if(pl.colorblind && CVD.indexOf(pl.colorblind)!==-1) applyColorblindOverlay(pl.colorblind);
        if(pl.reading)    h.setAttribute('data-reading', pl.reading);
        if(pl.motion)     h.setAttribute('data-motion', String(!!pl.motion));
        if(pl.fontScale)  h.style.setProperty('--a11y-font-scale', Math.min(1.5,Math.max(0.75,parseFloat(pl.fontScale)||1)));
      }
      (function(){
        var p=new URLSearchParams(window.location.search);
        applyPayload({
          theme:     p.get('theme'),
          contrast:  p.get('contrast'),
          colorblind:p.get('colorblind'),
          reading:   p.get('reading'),
          motion:    p.get('motion'),
          fontScale: p.get('fontscale'),
        });
      })();
      window.addEventListener('message',function(e){
        if(!e.data||e.data.source!=='central-simuladores'||e.data.type!=='a11y-update') return;
        applyPayload(e.data.payload);
      });
    })();

