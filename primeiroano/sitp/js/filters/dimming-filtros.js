/* ═══════════════════════════════════════════════════════════════
   CAMADA: FILTROS
   ARQUIVO: dimming-filtros.js
   ───────────────────────────────────────────────────────────────
   Os três filtros da tabela (por categoria, por estado físico, pelo
   "nível de perigo" do modo lamber) e o esmaecimento visual dos
   elementos que não correspondem ao filtro ativo.
   Depende de: modal/estado-modal.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function elementoBateFiltro(Z,cat){
  // estado CALCULADO, não ESTADO[Z]: senão o filtro continuaria filtrando
  // pelo estado a 25 °C depois de mexer no controle de temperatura
  const est = estadoNaTemperatura(Z, tempAtual);
  return (!filtroCategoria||cat===filtroCategoria)&&(!filtroEstado||est===filtroEstado)&&(!filtroLamber||(LAMBER[Z]||null)===filtroLamber);
}

function aplicarDim(){
  document.querySelectorAll('.element[data-cat]').forEach(e=>{
    const Z=parseInt(e.dataset.z)||0;
    const ok=elementoBateFiltro(Z,e.dataset.cat);
    e.classList.toggle('dim',!ok);
    e.setAttribute('aria-hidden',String(!ok));
    /* VIOLACAO CORRIGIDA: o card atenuado recebia aria-hidden="true" mas
       continuava focavel. Elemento focavel e invisivel para a tecnologia
       assistiva e uma parada de foco fantasma — o leitor chega nele e nao
       tem o que anunciar. A ARIA proibe a combinacao.
       Quem cuida do tabindex agora e tabindexMovel(), chamado no fim
       desta funcao: com tabindex movel so UM card fica na ordem de
       tabulacao, e ele nunca pode ser um card atenuado. */
    if(modoLamber){
      const st=e.querySelector('.lamber-sticker');
      if(st) st.style.display = ok ? '' : 'none';
    }
  });
  if(filtroEstado||filtroCategoria||filtroLamber){
    const laOk=lantanideos.some(el=>elementoBateFiltro(el.numero,el.cat));
    const acOk=actinideos.some(el=>elementoBateFiltro(el.numero,el.cat));
    laOk?(!estadoSeries.lantanideos&&abrirSerie('lantanideos')):(estadoSeries.lantanideos&&fecharSerie('lantanideos'));
    acOk?(!estadoSeries.actinideos&&abrirSerie('actinideos')):(estadoSeries.actinideos&&fecharSerie('actinideos'));
    setTimeout(()=>{
      document.querySelectorAll('.element[data-cat]').forEach(e=>{
        const Z=parseInt(e.dataset.z)||0;
        const ok=elementoBateFiltro(Z,e.dataset.cat);
        e.classList.toggle('dim',!ok);
        if(modoLamber){
          const st=e.querySelector('.lamber-sticker');
          if(st) st.style.display = ok ? '' : 'none';
        }
      });
    },220);
  }else{fecharSerie('lantanideos');fecharSerie('actinideos');}
  /* Se o foco estava num card que acabou de ser atenuado, ele ficaria
     preso num elemento agora aria-hidden. Devolve ao container da grade. */
  tabindexMovel();
  const foc = document.activeElement;
  if(foc && foc.classList && foc.classList.contains('dim')){
    // o foco estava num card que acabou de ser atenuado: leva para o
    // card que virou o ponto de entrada, nao para o container
    if(_cardAtual) _cardAtual.focus();
    else document.getElementById('periodic-table').focus();
  }
}

function hexToRgba(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}

function setItemAtivo(btn,cor){btn.style.setProperty('--item-color',cor);btn.style.setProperty('--item-bg',hexToRgba(cor,0.18));btn.classList.add('ativo');btn.setAttribute('aria-pressed','true');}

function clearItemAtivo(btn){btn.style.removeProperty('--item-color');btn.style.removeProperty('--item-bg');btn.classList.remove('ativo');btn.setAttribute('aria-pressed','false');}

function aplicarFiltroCat(cat){
  filtroCategoria=filtroCategoria===cat?null:cat;
  document.querySelectorAll('.legend-item[data-cat]').forEach(b=>b.dataset.cat===filtroCategoria?setItemAtivo(b,getCatColorHex(b.dataset.cat)||'#00e5ff'):clearItemAtivo(b));
  aplicarDim();anunciar(filtroCategoria?`Filtro: ${filtroCategoria}`:'Filtro de categoria removido');
}

function aplicarFiltroEstado(est){
  filtroEstado=filtroEstado===est?null:est;
  document.querySelectorAll('.legend-item[data-est]').forEach(b=>b.dataset.est===filtroEstado?setItemAtivo(b,getEstadoHex(b.dataset.est)||'#00e5ff'):clearItemAtivo(b));
  aplicarDim();anunciar(filtroEstado?`Filtro: ${ESTADO_LABEL[filtroEstado]}`:'Filtro de estado removido');
}

function aplicarFiltroLamber(cat){
  filtroLamber=filtroLamber===cat?null:cat;
  document.querySelectorAll('.legend-item[data-lamber]').forEach(b=>b.dataset.lamber===filtroLamber?setItemAtivo(b,LAMBER_HEX[b.dataset.lamber]):clearItemAtivo(b));
  aplicarDim();anunciar(filtroLamber?`Filtro secreto: ${LAMBER_LABEL[filtroLamber]}`:'Filtro secreto removido');
}

