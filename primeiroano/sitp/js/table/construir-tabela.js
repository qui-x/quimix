/* ═══════════════════════════════════════════════════════════════
   CAMADA: TABELA (orquestração)
   ARQUIVO: construir-tabela.js
   ───────────────────────────────────────────────────────────────
   Monta a grade completa da tabela periódica: células vazias
   (espaçadores), rótulos de grupo/período, as linhas de lantanídeos/
   actinídeos com seus botões de expandir, e renderizar() — a função
   que efetivamente desenha tudo isso no HTML a partir dos dados de
   dadossitp.js.
   Depende de: table/criar-celula.js, ui/series-f.js,
               dadossitp.js (elementosBase, lantanideos, actinideos).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── ESTRUTURA ARIA DA GRADE ──────────────────────────────────────────
   role="grid" so admite role="row" (ou rowgroup) como filho direto. Antes
   os 90 cards do corpo, os 25 rotulos, as celulas de legenda e o
   separador eram todos filhos DIRETOS do #periodic-table[role=grid]:
   os role="gridcell" ficavam sem linha, e o leitor de tela nao tinha como
   anunciar "linha 3, coluna 14".

   As duas series ja faziam certo (criarLinha usa role="row"), e e por
   isso que a tecnica esta provada aqui: o wrapper leva display:contents,
   entao os filhos continuam participando do CSS grid do pai e o layout
   nao muda em nada.

   linhaGrade() cria esse wrapper. Uso: uma linha por periodo, uma para os
   rotulos de grupo, e uma para cada bloco de legenda. */
/* Celula ARIA para envolver um controle que precisa manter o proprio
   papel. Um <button> nao pode ser filho direto de role="row" — mas PODE
   estar dentro de um role="gridcell". E o padrao "celula de grade com
   widget". display:contents mantem o controle no CSS grid do pai. */
function celulaGrade(filho){
  const c = document.createElement('div');
  c.className = 'grid-cell-wrap';
  c.setAttribute('role','gridcell');
  c.appendChild(filho);
  return c;
}

function linhaGrade(classe){
  const w = document.createElement('div');
  w.className = 'grid-row-wrap' + (classe ? ' ' + classe : '');
  w.setAttribute('role','row');
  return w;
}

function criarRotulos(c){
  // linha 1: cabecalhos de coluna (os numeros de grupo)
  const linhaGrupos = linhaGrade();
  for(let g=1;g<=18;g++){
    const d=document.createElement('div');d.className='family-label';
    d.style.cssText=`grid-column:${g+1};grid-row:1;`;d.textContent=g;
    d.setAttribute('role','columnheader');
    d.setAttribute('aria-label',`Grupo ${g}`);
    linhaGrupos.appendChild(d);
  }
  c.appendChild(linhaGrupos);
  /* Os rotulos de periodo NAO entram aqui: cada um pertence a linha do
     seu proprio periodo, como role="rowheader". Sao criados em
     criarLinhasPeriodo(), junto dos cards daquele periodo. */
}

/* Uma linha ARIA por periodo, com o rotulo do periodo como rowheader e os
   cards daquele periodo como gridcell. */
function criarLinhasPeriodo(c){
  for(let p=1;p<=7;p++){
    const linha = linhaGrade('linha-periodo');
    linha.setAttribute('aria-label', `Período ${p}`);
    const rh=document.createElement('div');rh.className='period-label';
    rh.style.cssText=`grid-column:1;grid-row:${p+1};`;rh.textContent=p;
    rh.setAttribute('role','rowheader');
    rh.setAttribute('aria-label',`Período ${p}`);
    linha.appendChild(rh);
    elementosBase.filter(el=>el.periodo===p).forEach(el=>{
      const d=criarEl(el);
      d.style.gridColumn=el.grupo+1; d.style.gridRow=el.periodo+1;
      linha.appendChild(d);
    });
    // os botoes das series ficam na linha do periodo 6 e 7, onde aparecem
    if(p===6) linha.appendChild(celulaGrade(criarBotaoSerie('lantanideos')));
    if(p===7) linha.appendChild(celulaGrade(criarBotaoSerie('actinideos')));
    c.appendChild(linha);
  }
}

function criarBotaoSerie(serie){
  const cfgs={
    lantanideos:{numero:'57-71',simbolo:'La-Lu',nome:'Lant.',grupo:3,periodo:6,cat:'Lantanídeo',obtencao:'Série dos lantanídeos (Z=57–71).',curiosidade:'15 elementos (terras raras) usados em ímãs, lasers e fibra óptica.'},
    actinideos: {numero:'89-103',simbolo:'Ac-Lr',nome:'Actin.',grupo:3,periodo:7,cat:'Actinídeo',obtencao:'Série dos actinídeos (Z=89–103).',curiosidade:'15 elementos, maioria radioativa; incluem urânio e plutônio.'}
  };
  const cfg=cfgs[serie];const cc=getCatColorHex(cfg.cat)||'#888';
  const div=document.createElement('div');
  div.className='element serie-toggle';
  div.dataset.cat=cfg.cat;div.dataset.z=cfg.numero;div.dataset.grupo=cfg.grupo;div.dataset.periodo=cfg.periodo;
  div.setAttribute('role','button');div.setAttribute('tabindex','0');div.setAttribute('aria-expanded','false');
  div.setAttribute('aria-label',`${serie==='lantanideos'?'Lantanídeos':'Actinídeos'} — elementos ${cfg.numero}. Clique simples para expandir ou recolher. Clique duplo para abrir os detalhes.`);
  div.style.cssText=`grid-column:${cfg.grupo+1};grid-row:${cfg.periodo+1};--cat-color:${cc}`;
  div.innerHTML=
    `<div class="el-number" aria-hidden="true" style="font-size:calc(0.4rem * var(--font-scale))">${cfg.numero}</div>`+
    `<div class="el-symbol" aria-hidden="true" style="color:${cc};font-size:calc(0.52vw * var(--font-scale));line-height:1.1">${cfg.simbolo}</div>`+
    `<div class="el-name"   aria-hidden="true">${cfg.nome}</div>`+
    `<span class="toggle-arrow" aria-hidden="true" style="color:${cc}">&#9660;</span>`;
  let timerClique = null;
  const ESPERA_MS = 300;
  const handler = () => {
    if (timerClique) {
      clearTimeout(timerClique);
      timerClique = null;
      elementoAtivo = null;
      abrirModal({...cfg, numero: cfg.numero, grupo: cfg.grupo}, div);
      anunciar(`Detalhes da série ${serie === 'lantanideos' ? 'Lantanídeos' : 'Actinídeos'} abertos.`);
    } else {
      timerClique = setTimeout(() => {
        timerClique = null;
        const novoEstado = !estadoSeries[serie];
        estadoSeries[serie] = novoEstado;
        div.classList.toggle('aberta', novoEstado);
        div.setAttribute('aria-expanded', String(novoEstado));
        document.getElementById(`linha-${serie}`)?.classList.toggle('recolhida', !novoEstado);
        anunciar(novoEstado
          ? 'Série expandida. Clique duplo para abrir os detalhes.'
          : 'Série recolhida.');
      }, ESPERA_MS);
    }
  };
  div.addEventListener('click', handler);
  div.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    navegarTabela(e, div);
  });
  botoesToggle[serie] = div;
  return div;
}

function criarLinha(serie,els,row){
  const w=document.createElement('div');w.id=`linha-${serie}`;w.className='linha-serie recolhida';w.setAttribute('role','row');
  els.forEach(el=>{const d=criarEl(el);d.style.gridColumn=el.grupo+1;d.style.gridRow=row;w.appendChild(d);});
  return w;
}

function renderizar(){
  const c=document.getElementById('periodic-table');
  criarRotulos(c);
  criarLegendaGridCell(c);
  criarLegendaLamberCell(c);
  criarLegendaDemoCell(c);
  criarLinhasPeriodo(c);
  const sep=document.createElement('div');sep.className='serie-separator';sep.style.gridRow='9';sep.setAttribute('aria-hidden','true');
  const linhaSep=linhaGrade();linhaSep.setAttribute('aria-hidden','true');linhaSep.appendChild(celulaGrade(sep));c.appendChild(linhaSep);
  c.appendChild(criarLinha('lantanideos',lantanideos,10));
  c.appendChild(criarLinha('actinideos',actinideos,11));
  criarLegendaBar();
}

