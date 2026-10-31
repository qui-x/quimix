/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO (modal do elemento)
   ARQUIVO: raio-e-propriedades-modal.js
   ───────────────────────────────────────────────────────────────
   vizinhosRaio() encontra elementos próximos na tabela para
   comparar visualmente o raio atômico. renderPropriedadeModal() e
   renderCardsPropriedade() montam os cards genéricos de propriedade
   (eletronegatividade, energia de ionização) exibidos no modal —
   um card por entrada de PROPRIEDADES com cardModal:true, então uma
   propriedade nova aparece sem editar nenhum arquivo de UI.
   renderRaio() é a maior função deste arquivo: monta a seção
   completa de raio atômico do modal, com as vistas comparativas.
   Depende de: dadossitp.js (RAIO, RAIO_*, PROPRIEDADES),
               core/escala-propriedade.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function vizinhosRaio(Z, el, allEls){
  const periodo = (el.periodo||0)<=7?el.periodo:(el.cat==='Lantanídeo'?6:7);
  const grupo   = el.grupo||0;
  const mesmoPer = allEls
    .filter(e=>{
      const p=(e.periodo||0)<=7?e.periodo:(e.cat==='Lantanídeo'?6:7);
      return p===periodo && RAIO[e.numero] && e.numero!==Z;
    })
    .sort((a,b)=>a.grupo-b.grupo)
    .slice(0,5);
  const mesmoGrp = allEls
    .filter(e=>{
      const p=(e.periodo||0)<=7?e.periodo:(e.cat==='Lantanídeo'?6:7);
      return e.grupo===grupo && p!==periodo && RAIO[e.numero] && e.numero!==Z;
    })
    .sort((a,b)=>{
      const pa=(a.periodo||0)<=7?a.periodo:(a.cat==='Lantanídeo'?6:7);
      const pb=(b.periodo||0)<=7?b.periodo:(b.cat==='Lantanídeo'?6:7);
      return pa-pb;
    })
    .slice(0,5);
  return { mesmoPer, mesmoGrp };
}

/* =====================================================================
   CARD DE PROPRIEDADE no modal (GENÉRICO)
   ---------------------------------------------------------------------
   Um render para toda propriedade com cardModal: true no registro.
   Substituiu renderEN(), que era específica da eletronegatividade.
   Acrescentar uma propriedade ao registro faz o card do modal aparecer
   sozinho — não há HTML nem função nova.

   Estrutura espelhada na do raio de propósito (valor grande + barra de
   escala relativa + fonte), para o aluno reconhecer o mesmo padrão de
   leitura em todas as propriedades.

   A cor vem de corNaEscala(), a MESMA função do mapa de calor dos
   cards. Então a tonalidade aqui e a do card são iguais por construção.
   ===================================================================== */
function renderPropriedadeModal(prop, Z, el){
  const v = valorPropriedade(prop, Z);
  if(v === null){
    // motivo específico quando o registro declara um para este Z;
    // senão, o motivo padrão da propriedade
    const m = (prop.semDadoMotivos || []).find(g => g.zs.includes(Z));
    return `<div class="en-wrap">
      <p class="en-sem-dados">${prop.semDadoTitulo || 'Sem valor publicado.'}
      ${m ? m.texto : (prop.semDadoPadrao || '')}</p>
    </div>`;
  }
  const cor   = corNaEscala(prop, v);
  const pct   = Math.round(fracaoPropriedade(prop, v) * 100);
  const faixa = (prop.faixas || []).find(f => v >= f.min && v < f.max);
  const num   = numeroPropriedade(prop, v);
  const fmt   = x => String(x).replace('.', ',');
  // unidade alternativa: a conversão é conteúdo de aula, não detalhe
  const alt   = prop.fatorAlt
    ? `<span class="en-valor-alt">= ${fmt(Math.round(v * prop.fatorAlt))} ${prop.unidadeAlt}</span>`
    : '';
  return `<div class="en-wrap" style="--en-cor:${cor}">
    <div class="en-visual">
      <div class="en-valor-box">
        <span class="en-valor-titulo">${prop.label}</span>
        <span class="en-valor-num" aria-label="${num} ${prop.unidadeLonga || ''}">${num}${prop.unidade}</span>
        <span class="en-valor-escala">${prop.unidadeLonga || ''}</span>
        ${alt}
      </div>
      <div class="en-info-col">
        <span class="en-faixa-badge">${faixa ? faixa.label : '—'}</span>
        <span class="en-valor-fonte">Fonte: ${prop.fonte || '—'}</span>
      </div>
    </div>
    <div class="en-barra-wrap tecnico-avancado">
      <span class="en-barra-titulo">Posição na escala — de ${fmt(prop.vmin)} a ${fmt(prop.vmax)}${prop.unidade}</span>
      <div class="en-barra-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
           aria-label="Posição de ${el.nome} na escala de ${prop.label}: ${pct} por cento">
        <div class="en-barra-fill" style="width:${pct}%"></div>
        <div class="en-barra-marca" style="left:${pct}%" aria-hidden="true"></div>
      </div>
      <div class="en-barra-legenda"><span>menor</span><span>${num}${prop.unidade} (${pct}%)</span><span>maior</span></div>
    </div>
  </div>`;
}

/* Monta uma seção por propriedade com cardModal: true. O contêiner do
   HTML é único e vazio; as seções nascem daqui. */
function renderCardsPropriedade(Z, el){
  const cx = document.getElementById('modalPropriedades');
  if(!cx) return;
  cx.innerHTML = PROPRIEDADES.filter(p => p.cardModal).map(p => `
    <section class="info-card" aria-labelledby="propTitle-${p.id}">
      <h4 id="propTitle-${p.id}">${ICO[p.icone] || ''} ${p.label}</h4>
      <div>${renderPropriedadeModal(p, Z, el)}</div>
    </section>`).join('');
}

function renderRaio(Z, el, ccHex){
  const dados = RAIO[Z];
  const sub   = ultimoSubnivel(Z);
  if(!dados && !sub){
    return `<p class="raio-sem-dados">Dados de raio atômico não disponíveis — elemento sintético superpesado sem medição experimental confirmada.</p>`;
  }
  const atomCor  = corBlocoDe(Z, ccHex);
  const atomGlow = (()=>{
    const h = atomCor.replace('#','');
    if(h.length < 6) return 'rgba(136,136,136,0.5)';
    const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},0.5)`;
  })();
  const rPm      = dados ? dados.r   : null;
  const tipoKey  = dados ? dados.t   : null;
  const fonteKey = dados ? dados.f   : null;
  const tipoLabel = tipoKey  ? (RAIO_TIPO_LABEL[tipoKey] ||tipoKey)  : '—';
  const tipoDef   = tipoKey  ? (RAIO_TIPO_DEF[tipoKey]  ||'')        : '';
  const fonteLabel= fonteKey ? (RAIO_FONTE_LABEL[fonteKey]||fonteKey) : '—';
  const diam = rPm ? Math.round(20+(rPm/RAIO_MAX_PM)*60) : 40;
  const pct  = rPm ? Math.round((rPm/RAIO_MAX_PM)*100)   : 0;
  const circuloHtml=`
    <div class="raio-circulo-wrap">
      <div class="raio-circulo" style="width:${diam}px;height:${diam}px;--atom-color:${atomCor};--atom-color-glow:${atomGlow}"
           role="img" aria-label="${rPm||'sem dado'} pm — representação proporcional"></div>
      <span class="raio-circulo-label" aria-hidden="true">${el.simbolo||''}</span>
    </div>`;
  const valorHtml = rPm
    ? `<div class="raio-valor-box" style="--atom-color:${atomCor}">
         <span class="raio-valor-titulo">Raio ${tipoLabel}</span>
         <span class="raio-valor-num" aria-label="${rPm} picômetros">${rPm}<span class="raio-valor-unit"> pm</span></span>
         <span class="raio-valor-fonte">Fonte: ${fonteLabel}</span>
       </div>`
    : `<div class="raio-valor-box"><span class="raio-valor-titulo">Raio atômico</span>
       <span class="raio-sem-dados">Sem dado experimental disponível</span></div>`;
  const subHtml = sub ? (()=>{
    const statusClass = {
      preenchido:    'raio-status-preenchido',
      semipreenchido:'raio-status-semipreenchido',
      parcial:       'raio-status-parcial',
      vazio:         'raio-status-vazio'
    }[sub.status] || 'raio-status-parcial';
    return `
    <div class="raio-sub-box tecnico-avancado">
      <span class="raio-sub-titulo">Camada de valência — último subnível</span>
      <span class="raio-sub-valor" aria-label="Subnível ${sub.sub}: ${sub.elCount} de ${sub.maxEl} elétrons">${sub.sub} &nbsp;·&nbsp; ${sub.elCount}/${sub.maxEl} e⁻</span>
      <span class="raio-sub-tipo">
        Bloco <b>${sub.bloco}</b> &nbsp;·&nbsp; Camada <b>${sub.camada}</b> (n = ${sub.n}) &nbsp;·&nbsp; ${sub.numOrbitais} orbital${sub.numOrbitais>1?'is':''}
      </span>
      <span class="raio-status-badge ${statusClass}" aria-label="Estado de preenchimento: ${sub.statusLabel}">${sub.statusLabel}</span>
    </div>`;
  })() : '';
  const barraHtml = rPm ? `
    <div class="raio-barra-wrap tecnico-avancado">
      <span class="raio-barra-titulo">Escala relativa — referência: Fr = ${RAIO_MAX_PM} pm</span>
      <div class="raio-barra-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Raio relativo a Fr: ${pct}%">
        <div class="raio-barra-fill" style="width:${pct}%;--atom-color:${atomCor};--atom-color-glow:${atomGlow}"></div>
      </div>
      <div class="raio-barra-legenda"><span>0 pm</span><span>${rPm} pm (${pct}%)</span><span>${RAIO_MAX_PM} pm (Fr)</span></div>
    </div>` : '';
  const toggleHtml=`
    <div class="raio-header">
      <span class="raio-tend-titulo">${ICO.raio} Raio Atômico — ${rPm||'—'} pm</span>
      <div class="raio-view-toggle" role="group" aria-label="Modo de visualização">
        <button class="raio-vbtn ativo" id="rbtn-dados-${Z}" aria-pressed="true"
                onclick="raioVista('dados','${Z}',this)">Dados</button>
        <button class="raio-vbtn" id="rbtn-grade-${Z}" aria-pressed="false"
                onclick="raioVista('grade','${Z}',this)">Grade</button>
        <button class="raio-vbtn" id="rbtn-bohr-${Z}" aria-pressed="false"
                onclick="raioVista('bohr','${Z}',this)">Bohr</button>
        <button class="raio-vbtn" id="rbtn-lewis-${Z}" aria-pressed="false"
                onclick="raioVista('lewis','${Z}',this)">Lewis</button>
        <button class="raio-vbtn" id="rbtn-nuvem-${Z}" aria-pressed="false"
                onclick="raioVista('nuvem','${Z}',this)">Nuvem</button>
      </div>
    </div>`;
  const painelDadosHtml=`
    <div id="raio-painel-dados-${Z}">
      <div class="raio-visual">${circuloHtml}<div class="raio-info-col">${valorHtml}</div></div>
      ${subHtml}
      ${barraHtml}
    </div>`;
  const elJSON = JSON.stringify({numero:el.numero,simbolo:el.simbolo||'',nome:el.nome||'',grupo:el.grupo,periodo:el.periodo||0,cat:el.cat||''});
  const painelGradeHtml=`
    <div id="raio-painel-grade-${Z}" style="display:none"
         data-lazy="grade" data-z="${Z}"
         data-cor="${atomCor.replace(/"/g,'&quot;')}"
         data-glow="${atomGlow.replace(/"/g,'&quot;')}"
         data-el='${elJSON.replace(/'/g,'&#39;')}'>
    </div>`;
  const painelBohrHtml=`
    <div id="raio-painel-bohr-${Z}" style="display:none"
         data-lazy="bohr" data-z="${Z}"
         data-cor="${atomCor.replace(/"/g,'&quot;')}"
         data-glow="${atomGlow.replace(/"/g,'&quot;')}"
         data-el='${elJSON.replace(/'/g,'&#39;')}'>
    </div>`;
  const painelLewisHtml=`
    <div id="raio-painel-lewis-${Z}" style="display:none"
         data-lazy="lewis" data-z="${Z}"
         data-cor="${atomCor.replace(/"/g,'&quot;')}"
         data-glow="${atomGlow.replace(/"/g,'&quot;')}"
         data-el='${elJSON.replace(/'/g,'&#39;')}'>
    </div>`;
  const _nuvemOrbs = (()=>{
    const dist2 = distribuirEletrons(Z); const cam2 = porCamada(dist2);
    const nc2 = Object.keys(cam2).length; const orbs = [];
    for(let n2=1; n2<=nc2; n2++){
      const subs2 = cam2[n2]||[];
      subs2.forEach(({sub:s2, e:e2})=>{
        const t2 = s2[s2.length-1];
        const vm = {s:'--orb-s', p:'--orb-p', d:'--orb-d', f:'--orb-f'};
        orbs.push({sub:s2, e:e2, tipo:t2, n:parseInt(s2[0]), cor:rgbToHex(resolverCorCSS(vm[t2]||'--orb-s'))});
      });
    }
    return orbs;
  })();
  const painelNuvemHtml=`
    <div id="raio-painel-nuvem-${Z}" style="display:none"
         data-lazy="nuvem" data-z="${Z}"
         data-cor="${atomCor.replace(/"/g,'&quot;')}"
         data-glow="${atomGlow.replace(/"/g,'&quot;')}"
         data-orbitais='${JSON.stringify(_nuvemOrbs).replace(/'/g,'&#39;')}'
         data-el='${elJSON.replace(/'/g,'&#39;')}'>
    </div>`;
  return `<div class="raio-wrap" style="--atom-color:${atomCor};--atom-color-glow:${atomGlow}">
    ${toggleHtml}
    ${painelDadosHtml}
    ${painelGradeHtml}
    ${painelBohrHtml}
    ${painelLewisHtml}
    ${painelNuvemHtml}
  </div>`;
}

