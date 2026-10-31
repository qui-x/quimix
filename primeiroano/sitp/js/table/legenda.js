/* ═══════════════════════════════════════════════════════════════
   CAMADA: TABELA
   ARQUIVO: legenda.js
   ───────────────────────────────────────────────────────────────
   Monta a barra de legenda abaixo da tabela: uma célula por
   categoria química (clicável, filtra), a célula do modo lamber, e
   a célula de demonstração de leitura do card (usada no guia).
   Depende de: dadossitp.js (CAT_COLOR_*, LAMBER_*).
═══════════════════════════════════════════════════════════════ */

'use strict';

function criarLegendaBar(){
}

function criarLegendaGridCell(container){
  /* Os tres blocos de legenda ficam numa unica linha ARIA. Eles ocupam
     celulas VAZIAS da grade da tabela — sao um recurso de layout —, e sem
     o wrapper seriam filhos invalidos de role="grid". Cada bloco e um
     gridcell que contem botoes, que e um padrao previsto: celula de grade
     com widgets dentro. */
  const linhaLegenda = linhaGrade();
  const catCell = document.createElement('div');
  catCell.className = 'legend-grid-cats';
  catCell.setAttribute('role','gridcell');   // filho de role=row
  catCell.setAttribute('aria-label','Filtros por categoria');
  const lcLbl = document.createElement('div');
  lcLbl.className='legend-section-label'; lcLbl.id='lblCats'; lcLbl.textContent='Categorias';
  catCell.appendChild(lcLbl);
  const gridCat = document.createElement('div');
  gridCat.className='legend-cats';
  gridCat.setAttribute('role','group'); gridCat.setAttribute('aria-labelledby','lblCats');
  Object.entries(CAT_COLOR).forEach(([cat])=>{
    const btn=document.createElement('button'); btn.className='legend-item'; btn.dataset.cat=cat;
    btn.setAttribute('aria-pressed','false'); btn.setAttribute('aria-label',`Filtrar por categoria: ${cat}`);
    btn.innerHTML=`<div class="legend-dot" aria-hidden="true" style="background:${getCatColorHex(cat)}"></div><span>${cat}</span>`;
    btn.addEventListener('click',()=>aplicarFiltroCat(cat)); gridCat.appendChild(btn);
  });
  catCell.appendChild(gridCat);
  linhaLegenda.appendChild(catCell);
  const stCell = document.createElement('div');
  stCell.className='legend-grid-states';
  stCell.setAttribute('role','gridcell');   // filho de role=row
  stCell.setAttribute('aria-label','Filtros por estado físico');
  const leLbl = document.createElement('div');
  // texto montado por rotuloEstadoLegenda(): era uma string fixa com
  // "25 °C" que continuava mentindo depois de mexer no controle de
  // temperatura, enquanto os icones ao lado ja mostravam outra coisa
  leLbl.className='legend-section-label'; leLbl.id='lblStates';
  leLbl.textContent=rotuloEstadoLegenda();
  stCell.appendChild(leLbl);
  const gridEst = document.createElement('div');
  gridEst.className='legend-states';
  gridEst.setAttribute('role','group'); gridEst.setAttribute('aria-labelledby','lblStates');
  // o icone vem de ESTADO_DOT, o mesmo que os cards usam — assim o
  // filtro e o canto do card nunca mostram desenhos diferentes
  [{k:'S',label:'Sólido'},{k:'L',label:'Líquido'},
   {k:'G',label:'Gasoso'},{k:'?',label:'Desconhecido'}]
    .forEach(({k,label})=>{
      const btn=document.createElement('button'); btn.className='legend-item'; btn.dataset.est=k;
      btn.setAttribute('aria-pressed','false'); btn.setAttribute('aria-label',`Filtrar: ${label}`);
      btn.innerHTML=`<span class="legend-est-ico" data-est="${k}" aria-hidden="true">${ESTADO_DOT[k]}</span><span>${label}</span>`;
      btn.addEventListener('click',()=>aplicarFiltroEstado(k)); gridEst.appendChild(btn);
    });
  stCell.appendChild(gridEst);
  linhaLegenda.appendChild(stCell);

  /* ── CELULA "PROPRIEDADES" ──────────────────────────────────────────
     Ocupa a faixa livre da linha 2 (período 1) à direita das outras duas
     legendas: colunas 14 a 18. É o único espaço vazio que resta depois
     de os filtros passarem a ocupar as colunas 4 a 13.

     NÃO É FILTRO, e o formato diz isso: rótulo "Propriedades" em vez de
     "Filtrar por", e botões com borda em vez do fundo preenchido dos
     chips de filtro. A distinção importa: filtro ATENUA elementos e é
     exclusivo com os outros filtros; propriedade TROCA o que todos os
     cards mostram e convive com qualquer filtro.
     ------------------------------------------------------------------ */
  const prCell = document.createElement('div');
  prCell.className = 'legend-grid-props';
  prCell.id = 'legendGridProps';
  prCell.setAttribute('role','gridcell');   // filho de role=row
  prCell.setAttribute('aria-label','Propriedades para mostrar no card');
  const prLbl = document.createElement('div');
  prLbl.className = 'legend-section-label'; prLbl.id = 'lblProps';
  /* Duas formas do rotulo: a celula tem so 2 grupos de largura, e em
     janela estreita "PROPRIEDADES" nao cabe — antes era cortado pelo
     overflow, aparecendo como "PROPRIEDADE". Quem escolhe qual mostrar e
     uma media query; as duas ficam no DOM. */
  prLbl.innerHTML = '<span class="lp-nome-longo">Propriedades</span>'
                  + '<span class="lp-nome-curto" aria-hidden="true">Propr.</span>';
  prCell.appendChild(prLbl);
  const gridPr = document.createElement('div');
  gridPr.className = 'legend-props'; gridPr.id = 'legendPropsBotoes';
  gridPr.setAttribute('role','group'); gridPr.setAttribute('aria-labelledby','lblProps');
  prCell.appendChild(gridPr);
  linhaLegenda.appendChild(prCell);
  container.appendChild(linhaLegenda);
}

function criarLegendaLamberCell(container){
  const wrap = document.createElement('div');
  wrap.className = 'legend-grid-lamber';
  wrap.id = 'legendGridLamber';
  wrap.setAttribute('role','gridcell');   // filho de role=row
  wrap.setAttribute('aria-label','Filtros secretos: Posso lamber isso?');
  wrap.hidden = true;
  const lbl = document.createElement('div');
  lbl.className='legend-section-label';
  lbl.textContent='🍬 Posso lamber isso?';
  wrap.appendChild(lbl);
  const grid = document.createElement('div');
  grid.className='legend-lamber-grid';
  LAMBER_ORDEM.forEach(cat=>{
    const btn=document.createElement('button');
    btn.className='legend-item'; btn.dataset.lamber=cat;
    btn.setAttribute('aria-pressed','false');
    btn.setAttribute('aria-label',`Filtrar: ${LAMBER_LABEL[cat]}`);
    btn.innerHTML=`<div class="legend-dot" aria-hidden="true" style="background:${LAMBER_HEX[cat]}"></div><span>${LAMBER_EMOJI[cat]} ${LAMBER_LABEL[cat]}</span>`;
    btn.addEventListener('click',()=>aplicarFiltroLamber(cat));
    grid.appendChild(btn);
  });
  wrap.appendChild(grid);
  const linhaLamber = linhaGrade();
  linhaLamber.appendChild(wrap);
  container.appendChild(linhaLamber);
}

function criarLegendaDemoCell(container){
  // filho de role=row: gridcell. O conteudo e ilustrativo, nao interativo
  // alem do botao "Como ler".
  const cell = document.createElement('button');
  cell.className = 'legend-demo-cell';
  cell.setAttribute('type','button');
  cell.setAttribute('aria-haspopup','dialog');
  cell.setAttribute('aria-label','Abrir guia de leitura do card de elemento');
  cell.setAttribute('title','Como ler um card — clique para abrir o guia');
  cell.innerHTML = `
    <div class="legend-demo-body" aria-hidden="true">
      <div class="demo-card">
        <div class="d-num">79</div>
        <div class="d-sym" style="color:var(--c-transition)">Au</div>
        <div class="d-name">Ouro</div>
        <div class="d-mass">196,97 u</div>
        <div class="d-dot">${ESTADO_DOT.S}</div>
      </div>
    </div>
    <div class="legend-demo-footer" aria-hidden="true">
      <span class="legend-demo-footer-text">${ICO.livro} Como ler ${ICO.seta}</span>
    </div>`;
  cell.addEventListener('click', abrirGuia);
  cell.addEventListener('keydown', e => {
    if(e.key==='Enter'||e.key===' '){ e.preventDefault(); abrirGuia(); }
  });
  const linhaDemo = linhaGrade();
  linhaDemo.appendChild(celulaGrade(cell));
  container.appendChild(linhaDemo);
}

