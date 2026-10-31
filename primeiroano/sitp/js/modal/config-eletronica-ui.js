/* ═══════════════════════════════════════════════════════════════
   CAMADA: MODAL
   ARQUIVO: config-eletronica-ui.js
   ───────────────────────────────────────────────────────────────
   Verbaliza a notação eletrônica para leitores de tela (transforma
   "3d¹⁰" em "3d com 10 elétrons") e monta o HTML completo da seção
   de distribuição eletrônica do modal.
   Depende de: core/config-eletronica.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function verbalizarConfig(notacao){
  const sup2n = {'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9'};
  return notacao.split(/\s+/).map(termo=>{
    let base = '', exp = '';
    for(const ch of termo){
      if(sup2n[ch] !== undefined) exp += sup2n[ch]; else base += ch;
    }
    if(!exp) return base;
    if(exp === '1') return `${base} com 1 elétron`;
    if(exp === '2') return `${base} com 2 elétrons`;
    return `${base} com ${exp} elétrons`;
  }).join(', ');
}

function renderConfig(Z){
  const notacao=CONFIG_EC[Z];
  if(!notacao){
    return `<div class="ec-title">Notação eletrônica</div>
<p class="ec-aviso">Configuração não disponível para este elemento (Z=${Z}).</p>`;
  }
  const aviso = Z>=104
    ? `<p class="ec-aviso">${ICO.aviso} Configuração prevista por cálculos relativísticos — este é um elemento sintético superpesado.</p>`
    : '';
  const dist=distribuirEletrons(Z);
  const camadas=porCamada(dist);
  let html=`<div class="ec-title">Notação eletrônica</div>${aviso}<div class="ec-full" role="text" aria-label="Configuração eletrônica: ${verbalizarConfig(notacao)}">${notacao}</div>
<div class="ec-title tecnico-avancado" style="margin-top:6px">Por camada (Diagrama de Pauling)</div><div class="ec-camadas tecnico-avancado">`;
  const nMax=Object.keys(camadas).length;
  for(let n=1;n<=nMax;n++){
    const nome=CAMADAS_NOME[n-1]||'?';
    const subs=camadas[n]||[];
    const orbs=subs.map(({sub,e})=>{
      const tipo=sub[1];
      const col={s:'var(--orb-s)',p:'var(--orb-p)',d:'var(--orb-d)',f:'var(--orb-f)'}[tipo]||'var(--text-dim)';
      const exp=String(e).split('').map(d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[parseInt(d)]).join('');
      const leitura = e===1 ? `${sub} com 1 elétron` : `${sub} com ${e} elétrons`;
      return `<span class="ec-orbital" style="color:${col}" role="text" aria-label="${leitura}">${sub}${exp}</span>`;
    }).join(' ');
    html+=`<div class="ec-row"><span class="ec-camada-name" aria-label="Camada ${nome}">${nome}</span><div class="ec-orbitals">${orbs}</div></div>`;
  }
  return html+'</div>';
}

