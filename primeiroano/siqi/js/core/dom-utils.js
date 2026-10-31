/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (utilitários de DOM)
   ARQUIVO: dom-utils.js
   ───────────────────────────────────────────────────────────────
   Atalhos usados o tempo todo: $ (getElementById), txt/html
   (atualizar conteúdo com segurança), sub2 (subscritos Unicode em
   fórmulas), srAnnounce (avisos ao leitor de tela), normTxt
   (normalização de texto para comparação de respostas) e renderMD
   (um Markdown bem simples usado nas descrições).
   Depende de: nada. Usado por: praticamente todo o app.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════════════
   4. UTILIDADES
════════════════════════════════════════════════════════════════ */
function $(id){ return document.getElementById(id); }

function txt(id,v){ var el=$(id); if(el) el.textContent=v; }

function html(id,v){ var el=$(id); if(el) el.innerHTML=v; }

function sub2(f){
  var m={'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
  return f.replace(/\d/g,function(d){ return m[d]||d; });
}

function srAnnounce(msg, prio){
  var id = prio==='assertive' ? 'sr-live-assertive' : 'sr-live';
  var el=$(id); if(!el) return;
  el.textContent=''; setTimeout(function(){ el.textContent=msg; }, 50);
}

function normTxt(t){
  return t.toLowerCase()
    .replace(/[áàãâ]/g,'a').replace(/[éèê]/g,'e')
    .replace(/[íì]/g,'i').replace(/[óòõô]/g,'o')
    .replace(/[úù]/g,'u').replace(/ç/g,'c')
    .replace(/\s+/g,' ').trim();
}

/* ── Render Markdown simples ───────────────────────────────── */
function renderMD(t){
  return t
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/`([^`]+)`/g,'<code style="background:var(--bg3);padding:.1em .3em;border-radius:3px;font-family:var(--mono);color:var(--coral2);">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,'<em>$1</em>')
    .replace(/^#{1,3}\s+(.+)$/gm,'<div style="font-weight:700;color:var(--coral);margin:.35rem 0 .15rem;">$1</div>')
    .replace(/^[-•]\s+(.+)$/gm,'<div style="padding-left:.75rem;margin:.1rem 0;">• $1</div>')
    .replace(/\n\n/g,'<br><br>').replace(/\n/g,'<br>');
}

