/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO — INTEGRAÇÃO COM O SILQ
   ARQUIVO: silq-integracao.js
   ───────────────────────────────────────────────────────────────
   A "Estrutura Molecular" da Ficha de cada composto passa a ser
   desenhada pelo MOTOR 3D DO SILQ (Simulador Interativo de Ligações
   Químicas) — mesma integração entre simuladores da plataforma, em
   vez de um desenho próprio e paralelo. Este arquivo é a PONTE:

     1. Constrói {atoms, bonds} no formato que o motor do SILQ espera
        (window.SILQ_VIEW3D_STATE.canvasAtoms/bonds) a partir da
        fórmula e função química de um composto do SIQI — reaproveita
        a MESMA lógica de identificação de conectividade (parser de
        fórmula, identificação de cátion/ânion, classificação
        diatômico/angular/oxiácido/iônico/complexo hidratado) já
        auditada e testada contra os 100 compostos do catálogo em
        js/render/lewis.js — só a SAÍDA muda: em vez de desenhar SVG
        2D à mão, emite átomos/ligações pro motor 3D do SILQ desenhar.
     2. Expõe window.SILQ_VIEW3D_STATE, vsepAngle, bondOrderSum e
        getMoleculeKey() — a mesma "superfície pública" que
        js/render/view3d-silq.js (o motor, importado do SILQ sem
        alteração de lógica) espera encontrar.
     3. Quando o banco de geometria da literatura do SILQ
        (geometrias-moleculares-silq.js) já tem a fórmula exata do
        composto, o motor 3D usa o ÂNGULO REAL da literatura; senão,
        cai no cálculo VSEPR quantitativo do próprio SILQ.

   Depende de: js/data/elementos-silq.js, js/data/geometrias-
               moleculares-silq.js, js/render/view3d-silq.js (carrega
               DEPOIS deste arquivo — ver ordem em indexsiqi.html).
   Usado por: js/nomenclatura/desafio.js (a cada troca de composto).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Estado local: os átomos/ligações do composto ATUALMENTE exibido.
   O motor 3D do SILQ lê isso via getters em SILQ_VIEW3D_STATE, a
   cada frame do próprio loop de desenho dele — trocar o conteúdo
   destes 2 arrays já é suficiente pra trocar de molécula, sem
   precisar reiniciar nada. ── */
var _silqAtoms = [];
var _silqBonds = [];
var _silqIdSeq = 0;
function _silqProximoId(){ return 'siqi_atom_' + (_silqIdSeq++); }

/* ════════════════════════════════════════════════════════════════
   1. PARSER DE FÓRMULA E IDENTIFICAÇÃO DE ÍONS
      (mesma lógica de js/render/lewis.js — ver auditoria dos 100
      compostos lá. Duplicada aqui, em vez de importada, pra este
      arquivo continuar sendo uma ponte autocontida: se um dia o
      desenho 2D (lewis.js) for removido, a integração 3D com o SILQ
      continua funcionando sozinha.) ─────────────────────────────── */
function silqParseFormula(formulaId){
  var tokens=[], i=0;
  function lerNumero(){ var n=''; while(i<formulaId.length && formulaId[i]>='0' && formulaId[i]<='9'){ n+=formulaId[i]; i++; } return n?parseInt(n,10):1; }
  var pilha=[tokens];
  while(i<formulaId.length){
    var ch=formulaId[i];
    if(ch==='('){ pilha.push([]); i++; }
    else if(ch===')'){ i++; var g=pilha.pop(); var m=lerNumero(); var a=pilha[pilha.length-1];
      g.forEach(function(t){ a.push({simbolo:t.simbolo, qtd:t.qtd*m}); }); }
    else if(ch>='A' && ch<='Z'){ var s=ch; i++; while(i<formulaId.length && formulaId[i]>='a' && formulaId[i]<='z'){ s+=formulaId[i]; i++; }
      var q=lerNumero(); pilha[pilha.length-1].push({simbolo:s, qtd:q}); }
    else{ i++; }
  }
  return tokens;
}

var SILQ_ANIONS = [
  { frag:'HCO3', nome:'bicarbonato', carga:-1 },
  { frag:'ClO4', nome:'perclorato', carga:-1 },
  { frag:'ClO3', nome:'clorato', carga:-1 },
  { frag:'ClO',  nome:'hipoclorito', carga:-1 },
  { frag:'Cr2O7',nome:'dicromato', carga:-2 },
  { frag:'CrO4', nome:'cromato', carga:-2 },
  { frag:'MnO4', nome:'permanganato', carga:-1 },
  { frag:'PO4',  nome:'fosfato', carga:-3 },
  { frag:'NO3',  nome:'nitrato', carga:-1 },
  { frag:'NO2',  nome:'nitrito', carga:-1 },
  { frag:'SO4',  nome:'sulfato', carga:-2 },
  { frag:'SO3',  nome:'sulfito', carga:-2 },
  { frag:'CO3',  nome:'carbonato', carga:-2 },
  { frag:'N3',   nome:'azida', carga:-1 },
  { frag:'OH',   nome:'hidroxila', carga:-1 },
  { frag:'Cl',   nome:'cloreto', carga:-1 },
  { frag:'Br',   nome:'brometo', carga:-1 },
  { frag:'F',    nome:'fluoreto', carga:-1 },
  { frag:'I',    nome:'iodeto', carga:-1 },
  { frag:'S',    nome:'sulfeto', carga:-2 },
  { frag:'O',    nome:'óxido', carga:-2 },
];
var SILQ_CATIONS_POLIATOMICOS = { NH4:{ nome:'amônio', carga:1 } };

function silqIdentificarIons(formulaId){
  for(var i=0; i<SILQ_ANIONS.length; i++){
    var a=SILQ_ANIONS[i];
    var m = formulaId.match(new RegExp(a.frag+'\\)?\\d*$'));
    if(!m) continue;
    var antes = formulaId.slice(0, formulaId.length - m[0].length).replace(/\($/, '');
    if(!antes) continue;
    var anionQtd = (function(){ var mm=formulaId.match(new RegExp(a.frag+'\\)?(\\d*)$')); return mm && mm[1] ? parseInt(mm[1],10) : 1; })();
    var cation = SILQ_CATIONS_POLIATOMICOS[antes]
      ? { simbolo:antes, qtd:1, poliatomico:true, carga:SILQ_CATIONS_POLIATOMICOS[antes].carga }
      : silqParseFormula(antes)[0];
    if(!cation) continue;
    if(cation.carga === undefined) cation.carga = -(a.carga * anionQtd) / cation.qtd;
    return { cation:cation, anion:{ simbolo:a.frag, nome:a.nome, carga:a.carga, qtd:anionQtd } };
  }
  return null;
}

/* ════════════════════════════════════════════════════════════════
   2. CONSTRUTORES DE {atoms, bonds} POR CATEGORIA ESTRUTURAL
      Cada um recebe os dados já extraídos da fórmula e devolve
      {atoms:[{id,element}], bonds:[{a,b,order,type}]} — o formato
      que window.SILQ_VIEW3D_STATE expõe pro motor 3D do SILQ.
════════════════════════════════════════════════════════════════ */
function silqNovoAtomo(atoms, elemento){
  var a = { id:_silqProximoId(), element:elemento, x:0, y:0, charge:0 };
  atoms.push(a);
  return a;
}

/* Constrói o cluster central+O de um ÂNION POLIATÔMICO (sulfato,
   nitrato, carbonato, fosfato, cromato, dicromato, clorato,
   perclorato, hipoclorito, permanganato, sulfito, bicarbonato),
   devolvendo o átomo central. Dois cuidados que a versão anterior
   não tinha (achados testando em Chromium real):

   1. ÁTOMO CENTRAL CERTO: pra "HCO3" (bicarbonato), o H vem primeiro
      na string — usar fragTokens[0] cegamente dava H como "central"
      do cluster, o que é quimicamente sem sentido (o H fica pendurado
      no O, não é ele que se liga aos outros O). Bicarbonato ganha
      tratamento especial, igual à hidroxila.
   2. DISTRIBUIÇÃO DE LIGAÇÃO DUPLA: usar só ligação simples pra TODOS
      os O fazia o motor VSEPR do SILQ calcular pares isolados que não
      existem de verdade (nitrato/sulfato/fosfato/cromato têm 0 pares
      isolados no átomo central — por ressonância ou octeto expandido),
      e o ângulo saía errado (nitrato mostrava 107° em vez de 120°
      trigonal planar). Corrigido calculando quantas ligações duplas
      são necessárias pra zerar os pares isolados (mesma lógica de
      "quantos elétrons de valência sobram", só que aplicada ao
      cluster do ânion, não à molécula inteira). */
function silqMontarClusterAnion(atoms, bonds, fragSimbolo){
  if(fragSimbolo === 'OH'){
    var oAt = silqNovoAtomo(atoms, 'O');
    var hAt = silqNovoAtomo(atoms, 'H');
    bonds.push({ a:oAt.id, b:hAt.id, order:1, type:'covalent' });
    return oAt;
  }
  if(fragSimbolo === 'HCO3'){
    var cCentral = silqNovoAtomo(atoms, 'C');
    var oComH = silqNovoAtomo(atoms, 'O');
    var hBic = silqNovoAtomo(atoms, 'H');
    bonds.push({ a:cCentral.id, b:oComH.id, order:1, type:'covalent' });
    bonds.push({ a:oComH.id, b:hBic.id, order:1, type:'covalent' });
    var o2 = silqNovoAtomo(atoms, 'O'), o3 = silqNovoAtomo(atoms, 'O');
    bonds.push({ a:cCentral.id, b:o2.id, order:2, type:'covalent' }); // C: valência 4, usado=1+2+1=4 → 0 pares
    bonds.push({ a:cCentral.id, b:o3.id, order:1, type:'covalent' });
    return cCentral;
  }

  var fragTokens = silqParseFormula(fragSimbolo);
  var central = silqNovoAtomo(atoms, fragTokens[0].simbolo);
  var outros = fragTokens.slice(1);
  var totalO = outros.reduce(function(s,t){ return s + (t.simbolo==='O' ? t.qtd : 0); }, 0);

  var valCentral = (typeof ELEMENTS !== 'undefined' && ELEMENTS[fragTokens[0].simbolo])
    ? ELEMENTS[fragTokens[0].simbolo].valence : 4;
  // quantas ligações precisam virar dupla (em vez de simples) pra
  // zerar os pares isolados calculados pelo motor: floor((V-usado)/2)=0
  // <=> usado >= V-1. Começando com `totalO` ligações simples
  // (usado=totalO), faltam (V-1-totalO) unidades — cada upgrade
  // simples→dupla soma +1.
  var faltam = Math.max(0, (valCentral - 1) - totalO);
  var idx = 0;
  outros.forEach(function(tok){
    for(var n=0;n<tok.qtd;n++){
      var oAt = silqNovoAtomo(atoms, tok.simbolo);
      var ordem = (tok.simbolo === 'O' && idx < faltam) ? 2 : 1;
      bonds.push({ a:central.id, b:oAt.id, order:ordem, type:'covalent' });
      idx++;
    }
  });
  return central;
}

/* Cátion + ânion — cobre a maioria dos sais/bases/óxidos iônicos.
   Ânions poliatômicos (sulfato, carbonato, nitrato...) viram um
   pequeno cluster central+O covalente, ligado ionicamente ao(s)
   cátion(s); hidroxila vira O–H covalente. */
function silqConstruirIonico(ions){
  var atoms = [], bonds = [];
  var cations = [];
  for(var i=0;i<ions.cation.qtd;i++){
    if(ions.cation.poliatomico){
      // cátion poliatômico (hoje só NH4⁺): decompõe em átomos reais
      // (N central + 4 H covalentes) em vez de um pseudo-átomo "NH4"
      // — bug real, achado testando NH4Cl (átomo inexistente "NH4").
      var fragCat = silqParseFormula(ions.cation.simbolo);
      var centralCat = silqNovoAtomo(atoms, fragCat[0].simbolo);
      fragCat.slice(1).forEach(function(tok){
        for(var m=0;m<tok.qtd;m++){
          var subAt = silqNovoAtomo(atoms, tok.simbolo);
          bonds.push({ a:centralCat.id, b:subAt.id, order:1, type:'covalent' });
        }
      });
      cations.push(centralCat);
    } else {
      cations.push(silqNovoAtomo(atoms, ions.cation.simbolo));
    }
  }

  var anionCentralAtoms = [];
  for(var k=0;k<ions.anion.qtd;k++){
    if(ions.anion.simbolo.length <= 2 && !/\d/.test(ions.anion.simbolo) && ions.anion.simbolo !== 'OH'){
      // ânion monoatômico (Cl⁻, F⁻, O²⁻...)
      anionCentralAtoms.push(silqNovoAtomo(atoms, ions.anion.simbolo));
    } else {
      anionCentralAtoms.push(silqMontarClusterAnion(atoms, bonds, ions.anion.simbolo));
    }
  }

  // liga cátion(s) ao(s) ânion(s) — ionicamente, um-para-um até esgotar
  for(var p=0;p<Math.max(cations.length, anionCentralAtoms.length);p++){
    var cat = cations[p % cations.length];
    var an  = anionCentralAtoms[p % anionCentralAtoms.length];
    bonds.push({ a:cat.id, b:an.id, order:1, type:'ionic' });
  }
  return { atoms:atoms, bonds:bonds };
}

/* Complexo hidratado (sal_colorido com [M(H₂O)₆] real na ficha):
   metal central + 6 ligantes H₂O (cada um O ligado ao metal, e 2 H
   ligados a esse O), mais o ânion à parte, ionicamente. */
function silqConstruirHidratado(ions){
  var atoms = [], bonds = [];
  var metal = silqNovoAtomo(atoms, ions.cation.simbolo);
  for(var i=0;i<6;i++){
    var o = silqNovoAtomo(atoms, 'O');
    bonds.push({ a:metal.id, b:o.id, order:1, type:'covalent' });
    var h1 = silqNovoAtomo(atoms, 'H');
    var h2 = silqNovoAtomo(atoms, 'H');
    bonds.push({ a:o.id, b:h1.id, order:1, type:'covalent' });
    bonds.push({ a:o.id, b:h2.id, order:1, type:'covalent' });
  }
  var anCentral = silqMontarClusterAnion(atoms, bonds, ions.anion.simbolo);
  bonds.push({ a:metal.id, b:anCentral.id, order:1, type:'ionic' });
  return { atoms:atoms, bonds:bonds };
}

/* Ácido diatômico (H–X) e ácido angular tipo H₂S (X central + 2 H). */
function silqConstruirAcidoSimples(simCentral, nH){
  var atoms = [], bonds = [];
  var central = silqNovoAtomo(atoms, simCentral);
  for(var i=0;i<nH;i++){
    var h = silqNovoAtomo(atoms, 'H');
    bonds.push({ a:central.id, b:h.id, order:1, type:'covalent' });
  }
  return { atoms:atoms, bonds:bonds };
}

/* Ácido oxigenado / óxido covalente: átomo central + nO (parte deles
   com H pendurado, formando O–H — mesma regra do desenho 2D já
   auditado: os primeiros `nH` oxigênios viram O–H simples; o
   restante vira central=O dupla). */
function silqConstruirCentralComOxigenios(simCentral, nO, nH){
  var atoms = [], bonds = [];
  var central = silqNovoAtomo(atoms, simCentral);
  var comH = Math.min(nH, nO);
  for(var i=0;i<nO;i++){
    var o = silqNovoAtomo(atoms, 'O');
    var ordem = i < comH ? 1 : 2;
    bonds.push({ a:central.id, b:o.id, order:ordem, type:'covalent' });
    if(i < comH){
      var h = silqNovoAtomo(atoms, 'H');
      bonds.push({ a:o.id, b:h.id, order:1, type:'covalent' });
    }
  }
  return { atoms:atoms, bonds:bonds };
}

function silqConstruirLinearSimetrico(){
  var atoms=[], bonds=[];
  var o1 = silqNovoAtomo(atoms,'O'), c = silqNovoAtomo(atoms,'C'), o2 = silqNovoAtomo(atoms,'O');
  bonds.push({a:o1.id,b:c.id,order:2,type:'covalent'});
  bonds.push({a:c.id,b:o2.id,order:2,type:'covalent'});
  return { atoms:atoms, bonds:bonds };
}

function silqConstruirPiramidalAX3(simCentral, simSub){
  var atoms=[], bonds=[];
  var central = silqNovoAtomo(atoms, simCentral);
  for(var i=0;i<3;i++){
    var s = silqNovoAtomo(atoms, simSub);
    bonds.push({ a:central.id, b:s.id, order:1, type:'covalent' });
  }
  return { atoms:atoms, bonds:bonds };
}

function silqConstruirMetal(simbolo){
  var atoms=[], bonds=[];
  for(var i=0;i<4;i++) silqNovoAtomo(atoms, simbolo);
  // ligações metálicas entre vizinhos, só pra dar noção de retículo
  for(var k=0;k<atoms.length-1;k++) bonds.push({ a:atoms[k].id, b:atoms[k+1].id, order:1, type:'metallic' });
  return { atoms:atoms, bonds:bonds };
}

function silqConstruirPeroxidoCovalente(){
  var atoms=[], bonds=[];
  var h1=silqNovoAtomo(atoms,'H'), o1=silqNovoAtomo(atoms,'O'), o2=silqNovoAtomo(atoms,'O'), h2=silqNovoAtomo(atoms,'H');
  bonds.push({a:h1.id,b:o1.id,order:1,type:'covalent'});
  bonds.push({a:o1.id,b:o2.id,order:1,type:'covalent'});
  bonds.push({a:o2.id,b:h2.id,order:1,type:'covalent'});
  return { atoms:atoms, bonds:bonds };
}

function silqConstruirAzida(ions){
  var atoms=[], bonds=[];
  var n1=silqNovoAtomo(atoms,'N'), n2=silqNovoAtomo(atoms,'N'), n3=silqNovoAtomo(atoms,'N');
  bonds.push({a:n1.id,b:n2.id,order:2,type:'covalent'});
  bonds.push({a:n2.id,b:n3.id,order:2,type:'covalent'});
  var cat = silqNovoAtomo(atoms, ions.cation.simbolo);
  bonds.push({a:cat.id,b:n2.id,order:1,type:'ionic'});
  return { atoms:atoms, bonds:bonds };
}

/* ════════════════════════════════════════════════════════════════
   3. DESPACHANTE — mesma árvore de decisão de js/render/lewis.js,
      agora emitindo {atoms,bonds} em vez de desenhar SVG.
════════════════════════════════════════════════════════════════ */
function silqConstruirMolecula(formula, c){
  var tokens = silqParseFormula(formula);
  var achar = function(sim){ return tokens.find(function(t){ return t.simbolo===sim; }); };

  if(c.funcao === 'elem') return silqConstruirMetal(formula.replace(/\d/g,''));

  if(c.funcao === 'acido'){
    if(formula === 'H2O2') return silqConstruirPeroxidoCovalente();
    var hTok = achar('H'), oTok = achar('O');
    var central = tokens.find(function(t){ return t.simbolo!=='H' && t.simbolo!=='O'; });
    if(!oTok){
      if(hTok && central) return silqConstruirAcidoSimples(central.simbolo, hTok.qtd);
    } else if(central){
      return silqConstruirCentralComOxigenios(central.simbolo, oTok.qtd, hTok?hTok.qtd:0);
    }
  }

  if(c.funcao === 'base'){
    if(formula === 'NH3') return silqConstruirPiramidalAX3('N','H');
    var ionsBase = silqIdentificarIons(formula);
    if(ionsBase) return silqConstruirIonico(ionsBase);
  }

  if(c.funcao === 'sal'){
    if(formula === 'NaN3'){ var ionsAz = silqIdentificarIons(formula); if(ionsAz) return silqConstruirAzida(ionsAz); }
    var ionsSal = silqIdentificarIons(formula);
    if(ionsSal){
      var mencionaHidratacao = /H2O|H₂O|hidrat/i.test((c.geometria||'') + ' ' + (c.ligacao||''));
      if(c.lewis === 'sal_colorido' && mencionaHidratacao) return silqConstruirHidratado(ionsSal);
      return silqConstruirIonico(ionsSal);
    }
  }

  if(c.funcao === 'oxido'){
    if(formula === 'CO2') return silqConstruirLinearSimetrico();
    var ehCovalente = /Covalente/i.test(c.ligacao||'') && !/caráter iônico|iônico-covalente|misto|com caráter covalente/i.test(c.ligacao||'');
    var oTokOx = achar('O');
    var centralOx = tokens.find(function(t){ return t.simbolo!=='O'; });
    if(ehCovalente && centralOx && oTokOx) return silqConstruirCentralComOxigenios(centralOx.simbolo, oTokOx.qtd, 0);
    var ionsOx = silqIdentificarIons(formula);
    if(ionsOx) return silqConstruirIonico(ionsOx);
  }

  // fallback: central + O se houver, senão um único átomo
  var oTokFB = achar('O');
  var centralFB = tokens.find(function(t){ return t.simbolo!=='O' && t.simbolo!=='H'; });
  if(oTokFB && centralFB) return silqConstruirCentralComOxigenios(centralFB.simbolo, oTokFB.qtd, 0);
  var atoms=[]; silqNovoAtomo(atoms, tokens[0] ? tokens[0].simbolo : 'C');
  return { atoms:atoms, bonds:[] };
}

/* ════════════════════════════════════════════════════════════════
   4. FUNÇÕES QUE O MOTOR 3D DO SILQ ESPERA ENCONTRAR
      (mesma lógica de js/core/vsepr.js e fisica-quimica-utils.js do
      SILQ, adaptada pra ler _silqAtoms/_silqBonds em vez de
      SILQ.canvasAtoms/SILQ.bonds — o motor 3D não sabe a diferença,
      só chama estas 3 funções pelo nome via SILQ_VIEW3D_STATE.) ──
════════════════════════════════════════════════════════════════ */
function silqBondOrderSum(id){
  return _silqBonds.filter(function(b){ return b.type==='covalent' && (b.a===id || b.b===id); })
    .reduce(function(s,b){ return s+b.order; }, 0);
}

function silqVsepAngle(nBonds, nLone){
  var total = nBonds + nLone;
  var TABLE = { 2:{0:180}, 3:{0:120,1:104.5}, 4:{0:109.5,1:107.0,2:104.5}, 5:{0:120}, 6:{0:90} };
  var row = TABLE[total];
  if(!row) return Math.PI;
  var deg = (row[nLone] !== undefined) ? row[nLone] : row[0];
  return (deg * Math.PI) / 180;
}

function silqGetMoleculeKey(){
  var counts = {};
  _silqAtoms.forEach(function(a){ counts[a.element] = (counts[a.element]||0) + 1; });
  var order = ['C','H'].concat(Object.keys(counts).filter(function(k){ return k!=='C' && k!=='H'; }).sort());
  return order.filter(function(k){ return counts[k]; }).map(function(k){ return counts[k]>1 ? k+counts[k] : k; }).join('');
}

/* ════════════════════════════════════════════════════════════════
   5. PONTE PÚBLICA — window.SILQ_VIEW3D_STATE, no mesmo formato que
      js/render/view3d-silq.js (motor importado do SILQ) já sabe ler.
════════════════════════════════════════════════════════════════ */
window.SILQ_VIEW3D_STATE = {
  get canvasAtoms(){ return _silqAtoms; },
  get bonds(){ return _silqBonds; },
  get wedgeDirection(){ return 'auto'; },
  ELEMENTS: (typeof ELEMENTS !== 'undefined') ? ELEMENTS : {},
  MOLECULE_GEOMETRY_DB: (typeof MOLECULE_GEOMETRY_DB !== 'undefined') ? MOLECULE_GEOMETRY_DB : {},
  getMoleculeKey: silqGetMoleculeKey,
  vsepAngle: silqVsepAngle,
  bondOrderSum: silqBondOrderSum,
  get stereoNote(){ return null; },
};

/* Garante que window.SILQ_VIEW3D aponta pra um canvas VIVO, dentro do
   #viewer3d ATUAL do DOM — reconstrói do zero se necessário.

   Por quê isso existe: a Ficha do composto no SIQI é reconstruída via
   painelInfo.innerHTML = "..." toda vez que o usuário alterna entre o
   desafio bloqueado (Nomenclatura) e a ficha completa (ver
   js/nomenclatura/desafio.js) — isso DESTRÓI o <canvas> que
   view3d-silq.js criou (uma vez só, no carregamento da página) dentro
   de #viewer3d, e a variável window.SILQ_VIEW3D fica com uma
   referência "fantasma": aponta pra um canvas que não está mais
   visível na página (detached), mas o código não lança nenhum erro —
   só desenha silenciosamente em um lugar que ninguém vê. Resultado:
   a caixa "Estrutura Molecular" ficava em branco em MUITOS compostos
   — bug real relatado pelo usuário, confirmado numa verificação
   exaustiva contra os 100 compostos (não era timing, como o fix
   anterior tratava — era o canvas sendo destruído de verdade).

   view3d-silq.js só roda seu init() (que cria o canvas) UMA vez, no
   carregamento da página — não tem como ele mesmo perceber que foi
   destruído depois. Esta função resolve isso: checa se o canvas atual
   ainda está conectado ao DOM (`isConnected`) e, se não estiver,
   recria um canvas novo dentro do #viewer3d atual e uma instância
   nova de SilqView3D (exposta globalmente por view3d-silq.js
   especificamente pra isso), com seu próprio loop de desenho. */
function silqGarantirCanvas3D(){
  var jaConectado = window.SILQ_VIEW3D && window.SILQ_VIEW3D.canvas && window.SILQ_VIEW3D.canvas.isConnected;
  if(jaConectado) return true;

  var viewer = document.getElementById('viewer3d');
  if(!viewer || typeof window.SilqView3D !== 'function') return false;

  // limpa qualquer canvas velho/desconectado que ainda esteja dentro
  // (não deveria haver, já que o innerHTML que apaga o #viewer3d
  // também apaga seus filhos, mas por segurança)
  while(viewer.firstChild) viewer.removeChild(viewer.firstChild);

  var canvas = document.createElement('canvas');
  canvas.id = 'silq-canvas-3d';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Visualização 3D da molécula — arraste para rotacionar, scroll para zoom');
  viewer.appendChild(canvas);

  var view3d = new window.SilqView3D(canvas);
  window.SILQ_VIEW3D = view3d;
  window.SILQ_VIEW3D.toggleAngles = function(on){
    view3d.showAngles = (typeof on==='boolean') ? on : !view3d.showAngles;
  };
  (function loop(){
    // se ESTE canvas específico também for destruído no futuro, o
    // proprio loop se encerra sozinho (evita acumular loops fantasma
    // rodando pra sempre a cada troca de composto)
    if(!canvas.isConnected) return;
    view3d.draw();
    requestAnimationFrame(loop);
  })();
  return true;
}

/* Chamada por js/nomenclatura/desafio.js a cada troca de composto —
   substitui o conteúdo de _silqAtoms/_silqBonds; o motor 3D (que já
   está rodando seu próprio requestAnimationFrame desde o carregamento
   da página) lê essa mudança automaticamente no frame seguinte, sem
   precisar reiniciar nada. */
function atualizarEstruturaSILQ3D(formula, composto){
  /* Normaliza subscrito unicode → dígito normal antes de parsear —
     mesmo bug (e mesmo fix) já encontrado em js/render/lewis.js:
     `composto.formula` usa "H₂SO₄" (subscrito, pra exibição), mas o
     parser de fórmula só reconhece dígitos ASCII normais. Sem isso,
     TODO átomo virava quantidade 1 (H₂SO₄ virava H1S1O1 em vez de
     H2S1O4) — achado testando contagens reais contra os 100
     compostos. */
  var SUB_PARA_NORMAL = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };
  var formulaNormalizada = String(formula).replace(/[₀-₉]/g, function(ch){ return SUB_PARA_NORMAL[ch] || ch; });

  var resultado;
  try {
    resultado = silqConstruirMolecula(formulaNormalizada, composto);
  } catch(err){
    var atomosFallback = [];
    silqNovoAtomo(atomosFallback, (composto.formulaId||'C').charAt(0));
    resultado = { atoms:atomosFallback, bonds:[] };
  }
  _silqAtoms = resultado.atoms;
  _silqBonds = resultado.bonds;

  /* Garante que o canvas ainda está vivo no DOM ANTES de tentar
     ativar/redimensionar — ver comentário completo em
     silqGarantirCanvas3D() acima. Sem isso, window.SILQ_VIEW3D podia
     apontar pra um canvas destruído (fantasma) e setActive/_resize
     rodavam "com sucesso" sem lançar erro nenhum, mas desenhando em
     um lugar que ninguém via — a caixa ficava em branco. */
  silqGarantirCanvas3D();

  if(window.SILQ_VIEW3D && typeof window.SILQ_VIEW3D.setActive === 'function'){
    window.SILQ_VIEW3D.setActive(true);
    /* Segunda camada de proteção contra o bug relatado pelo usuário
       (canvas 0×0 quando o layout do container ainda não tinha
       "assentado" no instante do setActive/_resize — ver comentário
       em desafio.js). O setTimeout(50) que envolve a chamada desta
       função já resolve a maioria dos casos, mas navegadores/máquinas
       mais lentos podem precisar de mais um instante — aqui, se o
       canvas real ainda estiver com 0 de largura/altura logo depois
       do setActive, força mais uma medição/redimensionamento. Barato
       (só um requestAnimationFrame) e nunca prejudica o caso comum
       (quando já teria funcionado de primeira, o `if` nem entra). */
    requestAnimationFrame(function(){
      var cv = document.getElementById('silq-canvas-3d');
      if(cv && (cv.width === 0 || cv.height === 0) && typeof window.SILQ_VIEW3D._resize === 'function'){
        window.SILQ_VIEW3D._resize();
      }
    });
  }
}
window.atualizarEstruturaSILQ3D = atualizarEstruturaSILQ3D;
