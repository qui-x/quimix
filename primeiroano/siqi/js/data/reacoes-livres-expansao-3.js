/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: reacoes-livres-expansao-3.js
   ───────────────────────────────────────────────────────────────
   Mais reações do Laboratório, adicionadas ao banco REACOES_LIVRES
   nesta expansão do catálogo (ver reacoes-livres-base.js para a
   explicação completa da técnica de mesclagem via IIFE).
   Depende de: js/data/reacoes-livres-base.js (REACOES_LIVRES já
               precisa existir).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   EXPANSÃO 3 — Novas reações livres
   Baseadas em: questões ENEM 2015-2025, vestibulares FUVEST/UNICAMP/
   MACKENZIE/UFMG, Manual da Química, Toda Matéria e IUPAC 2005
═══════════════════════════════════════════════════════════════ */
(function(){
  var r3 = {

  /* ══ H₂SO₄ — 3 novas reações (processo industrial, oxidante, baterias) ══ */
  'H2SO4': [
    {
      id:'h2so4_zn', icon:'bolt', familia:'Deslocamento / Oxirredução',
      titulo:'Zn + H₂SO₄ → ZnSO₄ + H₂',
      reagentes:['Zn','H₂SO₄'], condicao:'diluído', coefR:{'Zn':1,'H₂SO₄':1}, coefP:[1,1],
      produtos_visuais:['ZnSO₄','H₂'],
      candidatos:['ZnSO₄','H₂','ZnO','ZnCl₂','ZnCO₃','H₂O','Na₂SO₄','FeSO₄'],
      gabarito:{ produtos:['znso4','sulfato de zinco','h2','hidrogenio'],
        equacaoBalanceada:'Zn(s) + H₂SO₄(aq) → ZnSO₄(aq) + H₂(g)' },
      hints:['Zn está acima do H na série de reatividade. Zn→Zn²⁺+2e⁻ / 2H⁺+2e⁻→H₂↑','ZnSO₄ fica em solução; H₂ sobe como gás. Coeficiente: 1:1:1:1'],
      explicacao:'Zn+H₂SO₄→ZnSO₄+H₂  ·  Metal ativo desloca H⁺. Usado para produzir H₂ em laboratório e galvanizar aço'
    },
    {
      id:'h2so4_cu_conc', icon:'thermometer', familia:'Oxidação / Ácido Concentrado',
      titulo:'Cu + 2 H₂SO₄(conc) → CuSO₄ + SO₂ + 2 H₂O',
      reagentes:['Cu','H₂SO₄'], condicao:'conc./Δ', coefR:{'Cu':1,'H₂SO₄':2}, coefP:[1,1,2],
      produtos_visuais:['CuSO₄','SO₂','H₂O'],
      candidatos:['CuSO₄','SO₂','H₂O','CuO','H₂','Na₂SO₄','Cu₂O','SO₃'],
      gabarito:{ produtos:['cuso4','sulfato de cobre','so2','dioxido de enxofre','h2o','agua'],
        equacaoBalanceada:'Cu(s) + 2 H₂SO₄(conc)(aq) →(Δ)→ CuSO₄(aq) + SO₂(g) + 2 H₂O(l)' },
      hints:['H₂SO₄ concentrado é oxidante forte: reage com Cu (inativo com H₂SO₄ diluído). S⁺⁶→S⁺⁴ (SO₂)','Azul do CuSO₄ + SO₂ fumegante. Cu não reage com ácido diluído, mas reage com concentrado quente'],
      explicacao:'Cu+2H₂SO₄(conc)→CuSO₄+SO₂+2H₂O  ·  H₂SO₄ conc. age como oxidante (≠ diluído que libera H₂). Exemplo clássico de oxirredução'
    },
    {
      id:'h2so4_so3', icon:'factory', familia:'Síntese Industrial (Processo de Contato)',
      titulo:'SO₃ + H₂O → H₂SO₄',
      reagentes:['SO₃','H₂O'], condicao:'', coefR:{'SO₃':1,'H₂O':1}, coefP:[1],
      produtos_visuais:['H₂SO₄'],
      candidatos:['H₂SO₄','H₂SO₃','H₂S₂O₇','H₂SO₄','SO₂','HCl','H₃PO₄','H₂O'],
      gabarito:{ produtos:['h2so4','acido sulfurico'],
        equacaoBalanceada:'SO₃(g) + H₂O(l) → H₂SO₄(l)' },
      hints:['Óxido ácido + água → ácido. SO₃ é o anidrido do H₂SO₄. Última etapa do processo de contato','Industrialmente SO₃ é absorvido em H₂SO₄ 97% (oleum) e depois diluído. Gera ~250 Mt/ano de H₂SO₄'],
      explicacao:'SO₃+H₂O→H₂SO₄  ·  Etapa final do processo de contato (S→SO₂→SO₃→H₂SO₄). H₂SO₄ é o produto químico mais produzido no mundo'
    },
  ],

  /* ══ HCl — 3 novas reações (precipitação, amadurecimento industrial) ══ */
  'HCl': [
    {
      id:'hcl_agno3_precip', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'HCl + AgNO₃ → AgCl↓ + HNO₃',
      reagentes:['HCl','AgNO₃'], condicao:'', coefR:{'HCl':1,'AgNO₃':1}, coefP:[1,1],
      produtos_visuais:['AgCl','HNO₃'],
      candidatos:['AgCl','HNO₃','AgBr','AgI','NaCl','AgNO₂','HCl','NaNO₃'],
      gabarito:{ produtos:['agcl','cloreto de prata','hno3','acido nitrico'],
        equacaoBalanceada:'HCl(aq) + AgNO₃(aq) → AgCl(s)↓ + HNO₃(aq)' },
      hints:['Ag⁺ + Cl⁻ → AgCl↓ branco (insolúvel). Teste clássico para detectar Cl⁻. HNO₃ permanece em solução','AgCl é fotossensível: escurece ao sol (Ag metálica). Base da fotografia analógica'],
      explicacao:'HCl+AgNO₃→AgCl↓+HNO₃  ·  AgCl precipitado branco — teste qualitativo para halogênio cloreto. Fundamento da fotografia em prata'
    },
    {
      id:'hcl_fe', icon:'bolt', familia:'Deslocamento / Oxirredução',
      titulo:'Fe + 2 HCl → FeCl₂ + H₂',
      reagentes:['Fe','HCl'], condicao:'', coefR:{'Fe':1,'HCl':2}, coefP:[1,1],
      produtos_visuais:['FeCl₂','H₂'],
      candidatos:['FeCl₂','H₂','FeCl₃','FeO','Fe₂O₃','H₂O','NaCl','FeSO₄'],
      gabarito:{ produtos:['fecl2','cloreto de ferro','h2','hidrogenio'],
        equacaoBalanceada:'Fe(s) + 2 HCl(aq) → FeCl₂(aq) + H₂(g)' },
      hints:['Fe está acima de H na série. Fe→Fe²⁺+2e⁻. 2H⁺+2e⁻→H₂. Com HCl, o Fe forma cloreto de Fe(II)','Fe + HCl diluído → Fe²⁺ (não Fe³⁺). Com HNO₃ ou H₂SO₄ concentrado, pode dar Fe³⁺'],
      explicacao:'Fe+2HCl→FeCl₂+H₂  ·  Metal ativo + ácido diluído → sal de Fe(II) + H₂. Diferente do Cl₂ que forma FeCl₃'
    },
    {
      id:'hcl_al', icon:'bolt', familia:'Deslocamento / Oxirredução',
      titulo:'2 Al + 6 HCl → 2 AlCl₃ + 3 H₂',
      reagentes:['Al','HCl'], condicao:'', coefR:{'Al':2,'HCl':6}, coefP:[2,3],
      produtos_visuais:['AlCl₃','H₂'],
      candidatos:['AlCl₃','H₂','Al₂O₃','Al(OH)₃','FeCl₂','ZnCl₂','NaCl','AlF₃'],
      gabarito:{ produtos:['alcl3','cloreto de aluminio','h2','hidrogenio'],
        equacaoBalanceada:'2 Al(s) + 6 HCl(aq) → 2 AlCl₃(aq) + 3 H₂(g)' },
      hints:['Al é muito reativo (acima de H na série). 2Al→2Al³⁺+6e⁻. 6H⁺+6e⁻→3H₂','O Al natural é protegido por Al₂O₃ passivante. HCl dissolve essa camada e expõe o metal'],
      explicacao:'2Al+6HCl→2AlCl₃+3H₂  ·  Al dissolve em HCl (ácido) mas NÃO em HNO₃ concentrado (passivação). Exemplo de metal anfótero com ácido'
    },
  ],

  /* ══ NaOH — 3 novas reações ══ */
  'NaOH': [
    {
      id:'naoh_al_anfotero', icon:'bolt', familia:'Deslocamento (Anfótero)',
      titulo:'2 Al + 2 NaOH + 2 H₂O → 2 NaAlO₂ + 3 H₂',
      reagentes:['Al','NaOH','H₂O'], condicao:'', coefR:{'Al':2,'NaOH':2,'H₂O':2}, coefP:[2,3],
      produtos_visuais:['NaAlO₂','H₂'],
      candidatos:['NaAlO₂','H₂','Al(OH)₃','Al₂O₃','AlCl₃','Na₂O','NaCl','AlF₃'],
      gabarito:{ produtos:['naalO2','aluminato de sodio','h2','hidrogenio'],
        equacaoBalanceada:'2 Al(s) + 2 NaOH(aq) + 2 H₂O(l) → 2 NaAlO₂(aq) + 3 H₂(g)' },
      hints:['Al é anfótero: reage com ácido E com base! Al + NaOH forma aluminato (NaAlO₂) + H₂','Al³⁺ + 4OH⁻ → [Al(OH)₄]⁻ → AlO₂⁻ + 2H₂O. Isso explica por que Al não se usa em tubulações com NaOH'],
      explicacao:'2Al+2NaOH+2H₂O→2NaAlO₂+3H₂  ·  Al anfótero reage com base forte — tema recorrente no ENEM. Explica efervescência ao colocar Al em NaOH'
    },
    {
      id:'naoh_co2_carbonato', icon:'leaf', familia:'Síntese / Absorção de CO₂',
      titulo:'CO₂ + 2 NaOH → Na₂CO₃ + H₂O',
      reagentes:['CO₂','NaOH'], condicao:'excesso NaOH', coefR:{'CO₂':1,'NaOH':2}, coefP:[1,1],
      produtos_visuais:['Na₂CO₃','H₂O'],
      candidatos:['Na₂CO₃','H₂O','NaHCO₃','Na₂O','NaCl','NaOH','CO₂','Na₂SO₄'],
      gabarito:{ produtos:['na2co3','carbonato de sodio','h2o','agua'],
        equacaoBalanceada:'CO₂(g) + 2 NaOH(aq) → Na₂CO₃(aq) + H₂O(l)' },
      hints:['Óxido ácido + base forte → sal + água. Com excesso de NaOH → Na₂CO₃. Com 1:1 → NaHCO₃','CO₂+NaOH(excesso)→Na₂CO₃. CO₂+NaOH(1:1)→NaHCO₃. Razão molar define o produto!'],
      explicacao:'CO₂+2NaOH→Na₂CO₃+H₂O  ·  Reação de absorção industrial de CO₂. Scrubbers de NaOH capturam CO₂ de gases de combustão'
    },
    {
      id:'naoh_fecl3_precip', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'FeCl₃ + 3 NaOH → Fe(OH)₃↓ + 3 NaCl',
      reagentes:['FeCl₃','NaOH'], condicao:'', coefR:{'FeCl₃':1,'NaOH':3}, coefP:[1,3],
      produtos_visuais:['Fe(OH)₃','NaCl'],
      candidatos:['Fe(OH)₃','NaCl','Fe(OH)₂','FeO','Fe₂O₃','NaOH','FeSO₄','Na₂SO₄'],
      gabarito:{ produtos:['fe(oh)3','hidroxido de ferro','nacl','cloreto de sodio'],
        equacaoBalanceada:'FeCl₃(aq) + 3 NaOH(aq) → Fe(OH)₃(s)↓ + 3 NaCl(aq)' },
      hints:['Fe³⁺+3OH⁻→Fe(OH)₃↓ castanho avermelhado. Na⁺+Cl⁻ ficam em solução','Fe(OH)₃ é insolúvel (Kps=2,8×10⁻³⁹). Precipitado castanho-alaranjado — parece ferrugem. Teste de Fe³⁺'],
      explicacao:'FeCl₃+3NaOH→Fe(OH)₃↓+3NaCl  ·  Precipitado castanho-alaranjado. Teste qualitativo para Fe³⁺ em solução. Fundamento do tratamento de água com coagulação'
    },
  ],

  /* ══ NH₃ — 3 novas reações (Haber-Bosch, fertilizantes) ══ */
  'NH3': [
    {
      id:'nh3_haber', icon:'factory', familia:'Síntese Industrial (Haber-Bosch)',
      titulo:'N₂ + 3 H₂ → 2 NH₃',
      reagentes:['N₂','H₂'], condicao:'Fe/400°C/200atm', coefR:{'N₂':1,'H₂':3}, coefP:[2],
      produtos_visuais:['NH₃'],
      candidatos:['NH₃','N₂H₄','NO','NO₂','NH₄Cl','HNO₃','N₂O','NH₄NO₃'],
      gabarito:{ produtos:['nh3','amonia'],
        equacaoBalanceada:'N₂(g) + 3 H₂(g) ⇌(Fe,400°C,200atm) 2 NH₃(g)' },
      hints:['Síntese de Haber-Bosch: N₂ (ar) + H₂ (gás natural) → NH₃. Catalisador: Fe + K₂O','Equilíbrio reversível (⇌). Alta pressão e temperatura moderada favorecem NH₃. ~80% do nitrogênio dos fertilizantes vem desta reação'],
      explicacao:'N₂+3H₂⇌2NH₃  ·  Processo Haber-Bosch (1909). Responsável por alimentar ~50% da humanidade via fertilizantes nitrogenados. Nobel de Química 1918 (Haber)'
    },
    {
      id:'nh3_oxidacao_ostwald', icon:'factory', familia:'Oxidação Catalítica',
      titulo:'4 NH₃ + 5 O₂ → 4 NO + 6 H₂O',
      reagentes:['NH₃','O₂'], condicao:'Pt/830°C', coefR:{'NH₃':4,'O₂':5}, coefP:[4,6],
      produtos_visuais:['NO','H₂O'],
      candidatos:['NO','H₂O','NO₂','N₂','N₂O','HNO₃','N₂O₃','NH₄NO₃'],
      gabarito:{ produtos:['no','monoxido de nitrogenio','h2o','agua'],
        equacaoBalanceada:'4 NH₃(g) + 5 O₂(g) →(Pt,830°C)→ 4 NO(g) + 6 H₂O(g)' },
      hints:['Processo Ostwald — 1ª etapa da produção de HNO₃. NH₃ é oxidada a NO com catalisador de platina','4NH₃+5O₂→4NO+6H₂O (Ostwald). Depois: 2NO+O₂→2NO₂. Depois: 3NO₂+H₂O→2HNO₃+NO'],
      explicacao:'4NH₃+5O₂→4NO+6H₂O  ·  1ª etapa do processo Ostwald para produção de HNO₃ industrial. NH₃→NO→NO₂→HNO₃. Toda a indústria de explosivos depende desta reação'
    },
    {
      id:'nh3_h2so4_sal', icon:'flask', familia:'Neutralização',
      titulo:'2 NH₃ + H₂SO₄ → (NH₄)₂SO₄',
      reagentes:['NH₃','H₂SO₄'], condicao:'', coefR:{'NH₃':2,'H₂SO₄':1}, coefP:[1],
      produtos_visuais:['(NH₄)₂SO₄'],
      candidatos:['(NH₄)₂SO₄','NH₄Cl','NH₄NO₃','Na₂SO₄','(NH₄)₂CO₃','NH₄HSO₄','NaCl','H₂O'],
      gabarito:{ produtos:['(nh4)2so4','sulfato de amonio'],
        equacaoBalanceada:'2 NH₃(aq) + H₂SO₄(aq) → (NH₄)₂SO₄(aq)' },
      hints:['NH₃ atua como base: NH₃+H⁺→NH₄⁺. H₂SO₄ dibásico precisa de 2 NH₃. Produto: sal de amônio','(NH₄)₂SO₄ é fertilizante nitrogenado muito usado. Fornece N e S ao solo'],
      explicacao:'2NH₃+H₂SO₄→(NH₄)₂SO₄  ·  Sulfato de amônio — fertilizante nitrogenado mundial (produção >10 Mt/ano). Fornece N assimilável pelas plantas'
    },
  ],

  /* ══ HNO₃ — 2 novas reações (metais, oxidante) ══ */
  'HNO3': [
    {
      id:'hno3_fe_diluido', icon:'bolt', familia:'Oxidação / Ácido Diluído',
      titulo:'4 Fe + 10 HNO₃(diluído) → 4 Fe(NO₃)₂ + NH₄NO₃ + 3 H₂O',
      reagentes:['Fe','HNO₃'], condicao:'muito diluído', coefR:{'Fe':4,'HNO₃':10}, coefP:[4,1,3],
      produtos_visuais:['Fe(NO₃)₂','NH₄NO₃','H₂O'],
      candidatos:['Fe(NO₃)₂','NH₄NO₃','H₂O','Fe(NO₃)₃','NO','NO₂','FeCl₃','Fe₂O₃'],
      gabarito:{ produtos:['fe(no3)2','nitrato de ferro','nh4no3','nitrato de amonio','h2o','agua'],
        equacaoBalanceada:'4 Fe(s) + 10 HNO₃(muito diluído) → 4 Fe(NO₃)₂(aq) + NH₄NO₃(aq) + 3 H₂O(l)' },
      hints:['HNO₃ muito diluído é oxidante fraco: N⁺⁵→N⁻³ (NH₄⁺). Fe→Fe²⁺','Com HNO₃ diluído: NO. Com HNO₃ muito diluído: NH₄⁺. Com HNO₃ concentrado: NO₂. Grau de oxidação varia com concentração'],
      explicacao:'Fe+HNO₃(muito dil.)→Fe(NO₃)₂+NH₄NO₃+H₂O  ·  Diferença crucial: concentração do ácido determina o produto da redução do N (NO₂/NO/NH₄⁺)'
    },
    {
      id:'hno3_cu_diluido', icon:'bolt', familia:'Oxidação / Ácido Diluído',
      titulo:'3 Cu + 8 HNO₃(diluído) → 3 Cu(NO₃)₂ + 2 NO + 4 H₂O',
      reagentes:['Cu','HNO₃'], condicao:'diluído', coefR:{'Cu':3,'HNO₃':8}, coefP:[3,2,4],
      produtos_visuais:['Cu(NO₃)₂','NO','H₂O'],
      candidatos:['Cu(NO₃)₂','NO','H₂O','NO₂','CuO','Cu₂O','CuSO₄','N₂O'],
      gabarito:{ produtos:['cu(no3)2','nitrato de cobre','no','monoxido de nitrogenio','h2o','agua'],
        equacaoBalanceada:'3 Cu(s) + 8 HNO₃(diluído)(aq) → 3 Cu(NO₃)₂(aq) + 2 NO(g) + 4 H₂O(l)' },
      hints:['Cu não reage com H₂SO₄ diluído, mas reage com HNO₃ (oxidante). Diluído → NO. Concentrado → NO₂','3Cu→3Cu²⁺+6e⁻. 2NO₃⁻+8H⁺+6e⁻→2NO+4H₂O. Balancear por oxirredução!'],
      explicacao:'3Cu+8HNO₃(dil.)→3Cu(NO₃)₂+2NO+4H₂O  ·  HNO₃ diluído produz NO (incolor→marrom ao oxidar a NO₂ no ar). Clássica questão de vestibular sobre metais e HNO₃'
    },
  ],

  /* ══ H₂CO₃ — nova reação ══ */
  'H2CO3': [
    {
      id:'h2co3_nahco3_decomp', icon:'thermometer', familia:'Decomposição / Cotidiano',
      titulo:'2 NaHCO₃ → Na₂CO₃ + H₂O + CO₂',
      reagentes:['NaHCO₃'], condicao:'Δ', coefR:{'NaHCO₃':2}, coefP:[1,1,1],
      produtos_visuais:['Na₂CO₃','H₂O','CO₂'],
      candidatos:['Na₂CO₃','H₂O','CO₂','NaCl','NaOH','NaNO₃','Na₂O','NaHSO₄'],
      gabarito:{ produtos:['na2co3','carbonato de sodio','h2o','agua','co2','dioxido de carbono'],
        equacaoBalanceada:'2 NaHCO₃(s) →(Δ)→ Na₂CO₃(s) + H₂O(g) + CO₂(g)' },
      hints:['NaHCO₃ (bicarbonato) decompõe ao aquecer. Dois NaHCO₃ formam um Na₂CO₃ + CO₂ + H₂O','É essa reação que faz o bolo crescer no forno! Fermento = NaHCO₃. CO₂ faz a massa expandir'],
      explicacao:'2NaHCO₃→Na₂CO₃+H₂O+CO₂  ·  Reação do fermento químico (bicarbonato de sódio). CO₂ gerado no forno faz o bolo crescer. Também ocorre em pastilhas antiácido aquecidas'
    },
  ],

  /* ══ CaO — 2 novas reações ══ */
  'CaO': [
    {
      id:'cao_co2_sindrome', icon:'flame', familia:'Síntese / Indústria',
      titulo:'CaO + CO₂ → CaCO₃',
      reagentes:['CaO','CO₂'], condicao:'', coefR:{'CaO':1,'CO₂':1}, coefP:[1],
      produtos_visuais:['CaCO₃'],
      candidatos:['CaCO₃','CaSO₄','CaO','Ca(OH)₂','Ca(HCO₃)₂','CaCl₂','CO₂','MgCO₃'],
      gabarito:{ produtos:['caco3','carbonato de calcio'],
        equacaoBalanceada:'CaO(s) + CO₂(g) → CaCO₃(s)' },
      hints:['Óxido básico + óxido ácido → sal. CaO + CO₂ → CaCO₃. Reação inversa da calcinação','Esta é a reação oposta ao Exp 2 (decomposição do calcário). Ocorre naturalmente na formação de estalactites'],
      explicacao:'CaO+CO₂→CaCO₃  ·  Formação do calcário a partir da cal viva. Reação inversa da calcinação. Ocorre em furnas kársticas na formação de estalactites e estalagmites'
    },
    {
      id:'cao_so3_anidro', icon:'factory', familia:'Síntese / Neutralização Anidra',
      titulo:'CaO + SO₃ → CaSO₄',
      reagentes:['CaO','SO₃'], condicao:'', coefR:{'CaO':1,'SO₃':1}, coefP:[1],
      produtos_visuais:['CaSO₄'],
      candidatos:['CaSO₄','CaSO₃','CaO','CaCO₃','CaCl₂','Ca(OH)₂','Na₂SO₄','CaO'],
      gabarito:{ produtos:['caso4','sulfato de calcio'],
        equacaoBalanceada:'CaO(s) + SO₃(g) → CaSO₄(s)' },
      hints:['Óxido básico + óxido ácido → sal. CaO + SO₃ → CaSO₄ (gesso anidro)','Essa reação ocorre em termelétricas com dessulfurização: SO₂+½O₂→SO₃, depois CaO captura SO₃'],
      explicacao:'CaO+SO₃→CaSO₄  ·  Dessulfurização de gases industriais. Termelétricas usam calcário (→CaO) para capturar SO₃ e evitar chuva ácida. Produto: gesso (CaSO₄)'
    },
  ],

  /* ══ CO₂ — 2 novas reações ══ */
  'CO2': [
    {
      id:'co2_ca_oh2_excesso', icon:'precipitate', familia:'Dupla Troca (excesso CO₂)',
      titulo:'CaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂',
      reagentes:['CaCO₃','CO₂','H₂O'], condicao:'CO₂ excesso', coefR:{'CaCO₃':1,'CO₂':1,'H₂O':1}, coefP:[1],
      produtos_visuais:['Ca(HCO₃)₂'],
      candidatos:['Ca(HCO₃)₂','CaSO₄','CaCl₂','Ca(OH)₂','CaCO₃','CaO','CO₂','NaHCO₃'],
      gabarito:{ produtos:['ca(hco3)2','bicarbonato de calcio'],
        equacaoBalanceada:'CaCO₃(s) + CO₂(g) + H₂O(l) → Ca(HCO₃)₂(aq)' },
      hints:['Com excesso de CO₂ o CaCO₃ (insolúvel) dissolve formando Ca(HCO₃)₂ (solúvel)','Esta é a razão da dureza temporária da água. Aquecimento reverte: Ca(HCO₃)₂→CaCO₃+CO₂+H₂O (incrustrações)'],
      explicacao:'CaCO₃+CO₂+H₂O→Ca(HCO₃)₂  ·  Dissolução do calcário com CO₂ excesso. Causa a dureza temporária da água. Forma grutas kársticas; ao aquecer, CaCO₃ deposita e entupe canos'
    },
    {
      id:'co2_na2o_basico', icon:'flame', familia:'Síntese',
      titulo:'CO₂ + Na₂O → Na₂CO₃',
      reagentes:['CO₂','Na₂O'], condicao:'', coefR:{'CO₂':1,'Na₂O':1}, coefP:[1],
      produtos_visuais:['Na₂CO₃'],
      candidatos:['Na₂CO₃','NaOH','NaHCO₃','Na₂SO₄','NaCl','Na₂O','CO₂','NaNO₃'],
      gabarito:{ produtos:['na2co3','carbonato de sodio'],
        equacaoBalanceada:'CO₂(g) + Na₂O(s) → Na₂CO₃(s)' },
      hints:['Óxido ácido + óxido básico → sal. CO₂ (anidrido carbônico) + Na₂O → Na₂CO₃','Regra geral: óxido ácido + óxido básico → sal (sem água). Produto: carbonato de sódio (soda ash)'],
      explicacao:'CO₂+Na₂O→Na₂CO₃  ·  Óxido ácido + óxido básico → sal (sem água). Exemplo pedagógico da reação entre óxidos. Na₂CO₃ industrial é feito pelo processo Solvay (não esta via)'
    },
  ],

  /* ══ CaCO₃ — nova reação (calcário e chuva ácida) ══ */
  'CaCO3': [
    {
      id:'caco3_hno3_chuva', icon:'cloud', familia:'Dupla Troca / Chuva Ácida',
      titulo:'CaCO₃ + 2 HNO₃ → Ca(NO₃)₂ + H₂O + CO₂',
      reagentes:['CaCO₃','HNO₃'], condicao:'', coefR:{'CaCO₃':1,'HNO₃':2}, coefP:[1,1,1],
      produtos_visuais:['Ca(NO₃)₂','H₂O','CO₂'],
      candidatos:['Ca(NO₃)₂','H₂O','CO₂','CaCl₂','CaSO₄','CaO','NaNO₃','Ca(HCO₃)₂'],
      gabarito:{ produtos:['ca(no3)2','nitrato de calcio','h2o','agua','co2','dioxido de carbono'],
        equacaoBalanceada:'CaCO₃(s) + 2 HNO₃(aq) → Ca(NO₃)₂(aq) + H₂O(l) + CO₂(g)' },
      hints:['Carbonato + ácido → sal + água + CO₂ (gás). CaCO₃ + HNO₃ → sal solúvel + efervescência','Chuva ácida contém HNO₃. Ao atingir monumentos de calcário (CaCO₃), corrói formando Ca(NO₃)₂ solúvel'],
      explicacao:'CaCO₃+2HNO₃→Ca(NO₃)₂+H₂O+CO₂  ·  Degradação de estátuas de mármore pela chuva ácida. CO₂ efervescente é evidência da reação. Ca(NO₃)₂ solúvel é lavado pela chuva'
    },
  ],

  /* ══ Fe₂O₃ — nova reação (termita) ══ */
  'Fe2O3': [
    {
      id:'fe2o3_al_termita', icon:'bolt', familia:'Deslocamento / Termita',
      titulo:'Fe₂O₃ + 2 Al → Al₂O₃ + 2 Fe',
      reagentes:['Fe₂O₃','Al'], condicao:'Mg/>2500°C', coefR:{'Fe₂O₃':1,'Al':2}, coefP:[1,2],
      produtos_visuais:['Al₂O₃','Fe'],
      candidatos:['Al₂O₃','Fe','FeO','AlCl₃','Fe₂O₃','Al₂O₃','FeCl₃','Al(OH)₃'],
      gabarito:{ produtos:['al2o3','oxido de aluminio','fe','ferro'],
        equacaoBalanceada:'Fe₂O₃(s) + 2 Al(s) →(Δ>2500°C)→ Al₂O₃(s) + 2 Fe(l)' },
      hints:['Termita: Al reduz Fe₂O₃ porque Al é mais reativo. ΔH = −851 kJ/mol — temperatura >3000°C!','Al é mais eletropositivo que Fe: Al→Al³⁺ e Fe³⁺→Fe. Reação altamente exotérmica — usada em solda de trilhos'],
      explicacao:'Fe₂O₃+2Al→Al₂O₃+2Fe  ·  Reação de termita — libera ~3000°C, derretendo o ferro. Usada para soldar trilhos de trem in situ. Impossível apagar com água (H₂O→H₂+O com Al em chamas)'
    },
  ],

  /* ══ KMnO₄ — 2 novas reações ══ */
  'KMnO4': [
    {
      id:'kmno4_fe2_acido', icon:'precipitate', familia:'Oxirredução / Titulação',
      titulo:'MnO₄⁻ + 5 Fe²⁺ + 8 H⁺ → Mn²⁺ + 5 Fe³⁺ + 4 H₂O',
      reagentes:['KMnO₄','FeSO₄','H₂SO₄'], condicao:'ácido', coefR:{'KMnO₄':2,'FeSO₄':10,'H₂SO₄':8}, coefP:[2,10,8],
      produtos_visuais:['MnSO₄','Fe₂(SO₄)₃','K₂SO₄','H₂O'],
      candidatos:['MnSO₄','Fe₂(SO₄)₃','K₂SO₄','H₂O','MnO₂','FeCl₃','MnO','FeSO₄'],
      gabarito:{ produtos:['mnso4','sulfato de manganes','fe2(so4)3','sulfato de ferro','k2so4','sulfato de potassio','h2o','agua'],
        equacaoBalanceada:'2 KMnO₄(aq) + 10 FeSO₄(aq) + 8 H₂SO₄(aq) → 2 MnSO₄(aq) + 5 Fe₂(SO₄)₃(aq) + K₂SO₄(aq) + 8 H₂O(l)' },
      hints:['KMnO₄ roxo + FeSO₄ → incolor (Mn²⁺) + amarelo (Fe³⁺). Roxo desaparece = ponto final da titulação','Mn⁺⁷ (MnO₄⁻) → Mn²⁺: ganho de 5e⁻. Fe²⁺→Fe³⁺: perde 1e⁻. Relação 1:5 (KMnO₄:FeSO₄)'],
      explicacao:'KMnO₄+FeSO₄+H₂SO₄→MnSO₄+Fe₂(SO₄)₃  ·  Titulação permanganométrica — padrão de dosagem de Fe²⁺ em sangue/medicamentos. Ponto final: permanência da cor rosa'
    },
    {
      id:'kmno4_decomp', icon:'thermometer', familia:'Decomposição Térmica',
      titulo:'2 KMnO₄ → K₂MnO₄ + MnO₂ + O₂',
      reagentes:['KMnO₄'], condicao:'Δ ~240°C', coefR:{'KMnO₄':2}, coefP:[1,1,1],
      produtos_visuais:['K₂MnO₄','MnO₂','O₂'],
      candidatos:['K₂MnO₄','MnO₂','O₂','KOH','KCl','MnO','K₂O','Mn₂O₃'],
      gabarito:{ produtos:['k2mno4','manganato de potassio','mno2','dioxido de manganes','o2','oxigenio'],
        equacaoBalanceada:'2 KMnO₄(s) →(Δ ~240°C)→ K₂MnO₄(s) + MnO₂(s) + O₂(g)' },
      hints:['KMnO₄ decompõe ao aquecer liberando O₂. Mn⁺⁷→Mn⁺⁶ (K₂MnO₄) e Mn⁺⁴ (MnO₂)','Experimento clássico de produção de O₂ em laboratório. K₂MnO₄ (verde) + MnO₂ (preto) no resíduo'],
      explicacao:'2KMnO₄→K₂MnO₄+MnO₂+O₂  ·  Método histórico de produção de O₂ (Scheele, 1774). Facilmente realizado em laboratório escolar. Mn⁷⁺ se reduz a Mn⁶⁺ e Mn⁴⁺ simultaneamente (desproporcionamento)'
    },
  ],

  /* ══ NaHCO₃ — nova reação (efervescente) ══ */
  'NaHCO3': [
    {
      id:'nahco3_hcl_efervescente', icon:'pill', familia:'Dupla Troca / Cotidiano',
      titulo:'NaHCO₃ + HCl → NaCl + H₂O + CO₂',
      reagentes:['NaHCO₃','HCl'], condicao:'', coefR:{'NaHCO₃':1,'HCl':1}, coefP:[1,1,1],
      produtos_visuais:['NaCl','H₂O','CO₂'],
      candidatos:['NaCl','H₂O','CO₂','Na₂CO₃','NaOH','NaNO₃','NaHSO₄','Na₂SO₄'],
      gabarito:{ produtos:['nacl','cloreto de sodio','h2o','agua','co2','dioxido de carbono'],
        equacaoBalanceada:'NaHCO₃(aq) + HCl(aq) → NaCl(aq) + H₂O(l) + CO₂(g)' },
      hints:['Bicarbonato antiácido neutraliza HCl gástrico. Efervescência = CO₂. NaCl fica em solução','Medicamento tipo Sal de Fruta = NaHCO₃ + ácido (tartárico/cítrico). Reage com HCl do estômago (pH<2)'],
      explicacao:'NaHCO₃+HCl→NaCl+H₂O+CO₂  ·  Reação do antiácido de bicarbonato. Neutraliza a acidez gástrica. CO₂ causa o arrotar. Pastilhas efervescentes usam esse princípio'
    },
  ],

  /* ══ FeSO₄ — nova reação ══ */
  'FeSO4': [
    {
      id:'feso4_naoh_precipita', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'FeSO₄ + 2 NaOH → Fe(OH)₂↓ + Na₂SO₄',
      reagentes:['FeSO₄','NaOH'], condicao:'', coefR:{'FeSO₄':1,'NaOH':2}, coefP:[1,1],
      produtos_visuais:['Fe(OH)₂','Na₂SO₄'],
      candidatos:['Fe(OH)₂','Na₂SO₄','Fe(OH)₃','FeCl₂','FeO','NaCl','Fe₂O₃','NaOH'],
      gabarito:{ produtos:['fe(oh)2','hidroxido de ferro','na2so4','sulfato de sodio'],
        equacaoBalanceada:'FeSO₄(aq) + 2 NaOH(aq) → Fe(OH)₂(s)↓ + Na₂SO₄(aq)' },
      hints:['Fe²⁺+2OH⁻→Fe(OH)₂↓ verde. Na₂SO₄ em solução. Fe(OH)₂ oxida rapidamente a Fe(OH)₃ castanho','Diferença de cor: Fe(OH)₂ verde ≠ Fe(OH)₃ castanho-ferrugem. Fácil distinguir na prática'],
      explicacao:'FeSO₄+2NaOH→Fe(OH)₂↓+Na₂SO₄  ·  Precipitado verde de Fe(OH)₂ que escurece rapidamente ao ar. Teste de Fe²⁺. Tratamento de efluentes industriais com Fe²⁺'
    },
  ],

  /* ══ ZnSO₄ — nova reação ══ */
  'ZnSO4': [
    {
      id:'znso4_naoh_zincato', icon:'precipitate', familia:'Dupla Troca / Anfótero',
      titulo:'ZnSO₄ + 2 NaOH → Zn(OH)₂↓ + Na₂SO₄',
      reagentes:['ZnSO₄','NaOH'], condicao:'', coefR:{'ZnSO₄':1,'NaOH':2}, coefP:[1,1],
      produtos_visuais:['Zn(OH)₂','Na₂SO₄'],
      candidatos:['Zn(OH)₂','Na₂SO₄','ZnO','Na₂ZnO₂','NaCl','ZnCO₃','NaOH','Na₂SO₃'],
      gabarito:{ produtos:['zn(oh)2','hidroxido de zinco','na2so4','sulfato de sodio'],
        equacaoBalanceada:'ZnSO₄(aq) + 2 NaOH(aq) → Zn(OH)₂(s)↓ + Na₂SO₄(aq)' },
      hints:['Zn²⁺+2OH⁻→Zn(OH)₂↓ branco. Com excesso de NaOH: Zn(OH)₂+2NaOH→Na₂ZnO₂+2H₂O (anfótero!)','Zn(OH)₂ dissolve em ácido (como base) E em base forte (como ácido). Comportamento anfótero'],
      explicacao:'ZnSO₄+2NaOH→Zn(OH)₂↓+Na₂SO₄  ·  Precipitado branco gelatinoso. Com excesso de NaOH dissolve (Zn anfótero → Na₂ZnO₂). Demonstração da anfoteria do zinco'
    },
  ],

  /* ══ AlCl₃ — nova reação ══ */
  'AlCl3': [
    {
      id:'alcl3_naoh_excesso', icon:'precipitate', familia:'Dupla Troca / Anfótero (excesso)',
      titulo:'AlCl₃ + 4 NaOH(excesso) → NaAlO₂ + 3 NaCl + 2 H₂O',
      reagentes:['AlCl₃','NaOH'], condicao:'excesso NaOH', coefR:{'AlCl₃':1,'NaOH':4}, coefP:[1,3,2],
      produtos_visuais:['NaAlO₂','NaCl','H₂O'],
      candidatos:['NaAlO₂','NaCl','H₂O','Al(OH)₃','AlF₃','Na₂SO₄','Al₂O₃','NaHCO₃'],
      gabarito:{ produtos:['naalO2','aluminato de sodio','nacl','cloreto de sodio','h2o','agua'],
        equacaoBalanceada:'AlCl₃(aq) + 4 NaOH(excesso)(aq) → NaAlO₂(aq) + 3 NaCl(aq) + 2 H₂O(l)' },
      hints:['Com NaOH em excesso, Al(OH)₃ anfótero dissolve: Al(OH)₃+NaOH→NaAlO₂+2H₂O','AlCl₃+3NaOH→Al(OH)₃↓+3NaCl (quantidade estequiométrica). Com excesso NaOH → Al(OH)₃ dissolve → NaAlO₂'],
      explicacao:'AlCl₃+4NaOH(exc.)→NaAlO₂+3NaCl+2H₂O  ·  Al anfótero dissolve em excesso de base. Na₂ZnO₂ e NaAlO₂ são os zincato/aluminato de sódio — tema clássico de anfoteria no ENEM'
    },
  ],

  /* ══ BaSO₄ — nova reação (insolúvel, diagnóstico) ══ */
  'BaSO4': [
    {
      id:'baso4_precip_diag', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2 NaCl',
      reagentes:['BaCl₂','Na₂SO₄'], condicao:'', coefR:{'BaCl₂':1,'Na₂SO₄':1}, coefP:[1,2],
      produtos_visuais:['BaSO₄','NaCl'],
      candidatos:['BaSO₄','NaCl','BaCO₃','BaO','Na₂SO₃','NaNO₃','BaCl₂','Na₂CO₃'],
      gabarito:{ produtos:['baso4','sulfato de bario','nacl','cloreto de sodio'],
        equacaoBalanceada:'BaCl₂(aq) + Na₂SO₄(aq) → BaSO₄(s)↓ + 2 NaCl(aq)' },
      hints:['Ba²⁺+SO₄²⁻→BaSO₄↓ branco (insolúvel em HCl). Teste para SO₄²⁻. NaCl permanece em solução','BaSO₄ é o contraste de raio-X do trato gastrointestinal (papa baritada). Inofensivo pois não absorve por ser Kps=1,1×10⁻¹⁰'],
      explicacao:'BaCl₂+Na₂SO₄→BaSO₄↓+2NaCl  ·  BaSO₄ insolúvel em ácidos — teste confirmatório de SO₄²⁻. Medicalmente: a papa baritada usa BaSO₄ como contraste em raio-X do intestino'
    },
  ],

  /* ══ KNO₃ — nova reação (pólvora negra) ══ */
  'KNO3': [
    {
      id:'kno3_polvoranegra', icon:'explosion', familia:'Decomposição / Oxidação',
      titulo:'2 KNO₃ + S + 3 C → K₂S + N₂ + 3 CO₂',
      reagentes:['KNO₃','S','C'], condicao:'Δ (ignição)', coefR:{'KNO₃':2,'S':1,'C':3}, coefP:[1,1,3],
      produtos_visuais:['K₂S','N₂','CO₂'],
      candidatos:['K₂S','N₂','CO₂','KCl','SO₂','CO','K₂O','NO₂'],
      gabarito:{ produtos:['k2s','sulfeto de potassio','n2','nitrogenio','co2','dioxido de carbono'],
        equacaoBalanceada:'2 KNO₃(s) + S(s) + 3 C(s) →(ignição)→ K₂S(s) + N₂(g) + 3 CO₂(g)' },
      hints:['Pólvora negra = KNO₃ (75%) + carvão C (15%) + enxofre S (10%). KNO₃ é o oxidante','NO₃⁻ libera O₂ para queimar C e S. Gases N₂ e CO₂ expansão rápida = explosão. Inventada na China ~850 d.C.'],
      explicacao:'2KNO₃+S+3C→K₂S+N₂+3CO₂  ·  Reação da pólvora negra (saltpetre). KNO₃ fornece O₂, C e S reagem. Explosão = expansão súbita de N₂+CO₂. Usada há 1200 anos em fogos de artifício e armas'
    },
  ],

  /* ══ H₂O₂ — reações (novo composto) ══ */
  'H2O2': [
    {
      id:'h2o2_decomp_mno2', icon:'flask', familia:'Decomposição Catalítica',
      titulo:'2 H₂O₂ → 2 H₂O + O₂',
      reagentes:['H₂O₂'], condicao:'MnO₂ (catalisador)', coefR:{'H₂O₂':2}, coefP:[2,1],
      produtos_visuais:['H₂O','O₂'],
      candidatos:['H₂O','O₂','H₂','HO₂','H₂O₂','OH','O₃','H₂SO₄'],
      gabarito:{ produtos:['h2o','agua','o2','oxigenio'],
        equacaoBalanceada:'2 H₂O₂(aq) →(MnO₂)→ 2 H₂O(l) + O₂(g)' },
      hints:['H₂O₂ é instável: O-O peroxídico rompe fácil. MnO₂ catalisa sem ser consumido','Enzima catalase (fígado/sangue) faz a mesma reação em 10⁷ vezes/s! Efervescência de H₂O₂ no ferimento = O₂ + H₂O'],
      explicacao:'2H₂O₂→2H₂O+O₂  ·  Decomposição catalisada por MnO₂ ou enzima catalase. Elefante de pasta de dente usa H₂O₂ concentrado. A efervescência ao desinfetar ferida é esta reação na catalase sanguínea'
    },
    {
      id:'h2o2_ki_redox', icon:'precipitate', familia:'Oxirredução',
      titulo:'H₂O₂ + 2 KI → 2 KOH + I₂',
      reagentes:['H₂O₂','KI'], condicao:'', coefR:{'H₂O₂':1,'KI':2}, coefP:[2,1],
      produtos_visuais:['KOH','I₂'],
      candidatos:['KOH','I₂','KCl','H₂O','KIO₃','NaI','K₂O','HI'],
      gabarito:{ produtos:['koh','hidroxido de potassio','i2','iodo'],
        equacaoBalanceada:'H₂O₂(aq) + 2 KI(aq) → 2 KOH(aq) + I₂(s)' },
      hints:['H₂O₂ oxida I⁻→I₂ (marrom escuro). OH⁻ vem da redução do H₂O₂. O₂ oxidante e redutor ao mesmo tempo','KI é o catalisador da decomposição espetacular do H₂O₂ (elefante de pasta de dente). I₂ formado é o responsável pela cor'],
      explicacao:'H₂O₂+2KI→2KOH+I₂  ·  H₂O₂ oxida o iodeto a I₂ (marrom-escuro). Reação de referência para demostrar poder oxidante do H₂O₂. Mesma reação que ocorre no "elefante de pasta de dente"'
    },
    {
      id:'h2o2_h2o2_disproportionate', icon:'flask', familia:'Desproporcionamento',
      titulo:'2 H₂O₂ → 2 H₂O + O₂ (espontânea)',
      reagentes:['H₂O₂'], condicao:'luz / Δ / metais', coefR:{'H₂O₂':2}, coefP:[2,1],
      produtos_visuais:['H₂O','O₂'],
      candidatos:['H₂O','O₂','H₂','H₂SO₄','HO₂','O₃','H₂O₂','OH'],
      gabarito:{ produtos:['h2o','agua','o2','oxigenio'],
        equacaoBalanceada:'2 H₂O₂(l) →(luz/Δ)→ 2 H₂O(l) + O₂(g)' },
      hints:['O H₂O₂ pode agir como oxidante (O reduz de -1 a -2) E como redutor (O oxida de -1 a 0) ao mesmo tempo','Desproporcionamento: um reagente é oxidado e reduzido simultaneamente. Por isso H₂O₂ farmacêutico é guardado em frasco escuro'],
      explicacao:'2H₂O₂→2H₂O+O₂  ·  Desproporcionamento: O(-1) → O(-2) e O(0) simultaneamente. Por isso H₂O₂ se decompõe na luz. Armazenado em frascos âmbar para retardar decomposição'
    },
  ],

  /* ══ Na₂SO₄ — reações (novo composto) ══ */
  'Na2SO4': [
    {
      id:'na2so4_bacl2_precip', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'Na₂SO₄ + BaCl₂ → BaSO₄↓ + 2 NaCl',
      reagentes:['Na₂SO₄','BaCl₂'], condicao:'', coefR:{'Na₂SO₄':1,'BaCl₂':1}, coefP:[1,2],
      produtos_visuais:['BaSO₄','NaCl'],
      candidatos:['BaSO₄','NaCl','BaCO₃','BaO','NaNO₃','NaOH','Ba(OH)₂','Na₂CO₃'],
      gabarito:{ produtos:['baso4','sulfato de bario','nacl','cloreto de sodio'],
        equacaoBalanceada:'Na₂SO₄(aq) + BaCl₂(aq) → BaSO₄(s)↓ + 2 NaCl(aq)' },
      hints:['SO₄²⁻ + Ba²⁺ → BaSO₄↓ branco (Kps = 1,1×10⁻¹⁰). Teste confirmatório para sulfato','BaSO₄ precipita mesmo em meio ácido — diferencia SO₄²⁻ de CO₃²⁻ e SO₃²⁻ que dissolvem em HCl'],
      explicacao:'Na₂SO₄+BaCl₂→BaSO₄↓+2NaCl  ·  Precipitação de BaSO₄ — teste qualitativo de SO₄²⁻. Insolúvel em HCl (diferencia de carbonatos). Base do método gravimétrico de análise de sulfato'
    },
    {
      id:'na2so4_h2so4_formacao', icon:'flask', familia:'Neutralização',
      titulo:'2 NaOH + H₂SO₄ → Na₂SO₄ + 2 H₂O',
      reagentes:['NaOH','H₂SO₄'], condicao:'', coefR:{'NaOH':2,'H₂SO₄':1}, coefP:[1,2],
      produtos_visuais:['Na₂SO₄','H₂O'],
      candidatos:['Na₂SO₄','H₂O','NaHSO₄','NaCl','Na₂CO₃','NaOH','Na₂SO₃','NaNO₃'],
      gabarito:{ produtos:['na2so4','sulfato de sodio','h2o','agua'],
        equacaoBalanceada:'2 NaOH(aq) + H₂SO₄(aq) → Na₂SO₄(aq) + 2 H₂O(l)' },
      hints:['H₂SO₄ dibásico: 2 H⁺. Precisa de 2 NaOH para neutralização total. Produto: sal normal Na₂SO₄','Com 1 NaOH: NaHSO₄ (sal ácido). Com 2 NaOH: Na₂SO₄ (sal normal). Razão molar define o produto'],
      explicacao:'2NaOH+H₂SO₄→Na₂SO₄+2H₂O  ·  Neutralização total do H₂SO₄ dibásico. Sal de Glauber (Na₂SO₄·10H₂O) — indústria de papel. Controlar proporção: 1:1 → sal ácido; 2:1 → sal neutro'
    },
    {
      id:'na2so4_reducao_papel', icon:'factory', familia:'Redução Industrial',
      titulo:'Na₂SO₄ + 2 C → Na₂S + 2 CO₂',
      reagentes:['Na₂SO₄','C'], condicao:'Δ ~900°C', coefR:{'Na₂SO₄':1,'C':2}, coefP:[1,2],
      produtos_visuais:['Na₂S','CO₂'],
      candidatos:['Na₂S','CO₂','Na₂SO₃','NaCl','Na₂O','CO','SO₂','Na₂CO₃'],
      gabarito:{ produtos:['na2s','sulfeto de sodio','co2','dioxido de carbono'],
        equacaoBalanceada:'Na₂SO₄(s) + 2 C(s) →(Δ 900°C)→ Na₂S(l) + 2 CO₂(g)' },
      hints:['Processo Kraft de papel: Na₂SO₄ é reduzido a Na₂S pelo carvão na fornalha de recuperação','Na₂S + NaOH formam o licor branco que digere a celulose. A polpa kraft produz 90% do papel mundial'],
      explicacao:'Na₂SO₄+2C→Na₂S+2CO₂  ·  Etapa central do processo kraft (papel). Na₂SO₄ é reduzido a Na₂S no forno de recuperação. Na₂S+NaOH=licor branco que dissolve lignina e libera fibras de celulose'
    },
  ],

  /* ══ MgSO₄ — reações (novo composto) ══ */
  'MgSO4': [
    {
      id:'mgso4_naoh_precip', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'MgSO₄ + 2 NaOH → Mg(OH)₂↓ + Na₂SO₄',
      reagentes:['MgSO₄','NaOH'], condicao:'', coefR:{'MgSO₄':1,'NaOH':2}, coefP:[1,1],
      produtos_visuais:['Mg(OH)₂','Na₂SO₄'],
      candidatos:['Mg(OH)₂','Na₂SO₄','MgO','MgCO₃','NaCl','MgCl₂','NaHCO₃','Na₂CO₃'],
      gabarito:{ produtos:['mg(oh)2','hidroxido de magnesio','na2so4','sulfato de sodio'],
        equacaoBalanceada:'MgSO₄(aq) + 2 NaOH(aq) → Mg(OH)₂(s)↓ + Na₂SO₄(aq)' },
      hints:['Mg²⁺+2OH⁻→Mg(OH)₂↓ branco gelatinoso. Na₂SO₄ em solução','Mg(OH)₂ = leite de magnésia (antiácido). Formado industrialmente pela reação de MgCl₂ da água do mar com Ca(OH)₂'],
      explicacao:'MgSO₄+2NaOH→Mg(OH)₂↓+Na₂SO₄  ·  Mg(OH)₂ = leite de magnésia (antiácido não sistêmico). Insolúvel em água — neutraliza ácido gástrico sem ser absorvido. Produção industrial: MgCl₂ da água do mar + Ca(OH)₂'
    },
    {
      id:'mgso4_h2so4_formacao', icon:'flask', familia:'Síntese',
      titulo:'MgO + H₂SO₄ → MgSO₄ + H₂O',
      reagentes:['MgO','H₂SO₄'], condicao:'', coefR:{'MgO':1,'H₂SO₄':1}, coefP:[1,1],
      produtos_visuais:['MgSO₄','H₂O'],
      candidatos:['MgSO₄','H₂O','MgCl₂','Mg(OH)₂','MgO','Na₂SO₄','MgCO₃','MgSO₃'],
      gabarito:{ produtos:['mgso4','sulfato de magnesio','h2o','agua'],
        equacaoBalanceada:'MgO(s) + H₂SO₄(aq) → MgSO₄(aq) + H₂O(l)' },
      hints:['Óxido básico + ácido → sal + água. MgO + H₂SO₄ → MgSO₄ + H₂O. Regra geral','Sal de Epsom (MgSO₄·7H₂O) formado pela evaporação da solução. 7 moléculas de água de cristalização'],
      explicacao:'MgO+H₂SO₄→MgSO₄+H₂O  ·  Síntese do sal de Epsom. Reação modelo de óxido básico com ácido. MgSO₄·7H₂O (heptaidrato) = sal de banho terapêutico. Cristaliza com 7 H₂O ao resfriamento'
    },
  ],

  /* ══ CaCl₂ — reações (novo composto) ══ */
  'CaCl2': [
    {
      id:'cacl2_na2co3_precip', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2 NaCl',
      reagentes:['CaCl₂','Na₂CO₃'], condicao:'', coefR:{'CaCl₂':1,'Na₂CO₃':1}, coefP:[1,2],
      produtos_visuais:['CaCO₃','NaCl'],
      candidatos:['CaCO₃','NaCl','CaSO₄','Ca(OH)₂','NaHCO₃','Na₂SO₄','CaCl₂','Na₂O'],
      gabarito:{ produtos:['caco3','carbonato de calcio','nacl','cloreto de sodio'],
        equacaoBalanceada:'CaCl₂(aq) + Na₂CO₃(aq) → CaCO₃(s)↓ + 2 NaCl(aq)' },
      hints:['Ca²⁺+CO₃²⁻→CaCO₃↓ branco (calcário). NaCl em solução. Precipitação por dupla troca','Esta reação é a base do processo Solvay: CaCl₂ (resíduo) + Na₂CO₃ → NaCl (reutilizado) + CaCO₃'],
      explicacao:'CaCl₂+Na₂CO₃→CaCO₃↓+2NaCl  ·  Precipitação clássica de carbonato. Base do processo industrial Solvay para produção de Na₂CO₃. CaCO₃ precipita, NaCl permanece em solução para reutilização'
    },
    {
      id:'cacl2_caoh2_formacao', icon:'flask', familia:'Neutralização',
      titulo:'Ca(OH)₂ + 2 HCl → CaCl₂ + 2 H₂O',
      reagentes:['Ca(OH)₂','HCl'], condicao:'', coefR:{'Ca(OH)₂':1,'HCl':2}, coefP:[1,2],
      produtos_visuais:['CaCl₂','H₂O'],
      candidatos:['CaCl₂','H₂O','CaSO₄','Ca(NO₃)₂','CaCO₃','NaCl','Ca(OH)₂','CaO'],
      gabarito:{ produtos:['cacl2','cloreto de calcio','h2o','agua'],
        equacaoBalanceada:'Ca(OH)₂(aq) + 2 HCl(aq) → CaCl₂(aq) + 2 H₂O(l)' },
      hints:['Ca(OH)₂ dibásico: 2 OH⁻. Precisa 2 HCl. Ca²⁺+2Cl⁻→CaCl₂. Neutralização completa','CaCl₂ dissolve com ΔH negativo (exotérmico). Usado em bolsas de calor descartáveis (compressas quentes)'],
      explicacao:'Ca(OH)₂+2HCl→CaCl₂+2H₂O  ·  Neutralização da cal hidratada com HCl. CaCl₂ é utilíssimo: descongelante de estradas (mais eficaz que NaCl), dessecante industrial e conservante alimentar'
    },
  ],

  /* ══ Cu(OH)₂ — reações (novo composto) ══ */
  'Cu(OH)2': [
    {
      id:'cuoh2_decomp', icon:'thermometer', familia:'Decomposição Térmica',
      titulo:'Cu(OH)₂ → CuO + H₂O',
      reagentes:['Cu(OH)₂'], condicao:'Δ ~80°C', coefR:{'Cu(OH)₂':1}, coefP:[1,1],
      produtos_visuais:['CuO','H₂O'],
      candidatos:['CuO','H₂O','Cu₂O','Cu','CuSO₄','CuCl₂','CuCO₃','Cu(OH)Cl'],
      gabarito:{ produtos:['cuo','oxido de cobre','h2o','agua'],
        equacaoBalanceada:'Cu(OH)₂(s) →(Δ ~80°C)→ CuO(s) + H₂O(g)' },
      hints:['Hidróxido insolúvel ao aquecer → óxido + água. Cu(OH)₂ azul → CuO preto','Regra geral: base insolúvel → óxido + água. Cu(OH)₂ (azul) → CuO (preto). Mudança de cor visível'],
      explicacao:'Cu(OH)₂→CuO+H₂O  ·  Decomposição de base insolúvel em óxido. Regra geral da química inorgânica: Me(OH)n → MeO(n/2) + nH₂O. Azul→preto ao aquecer. CuO usado em pigmentos e catalisadores'
    },
    {
      id:'cuoh2_nacl_formacao', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'CuSO₄ + 2 NaOH → Cu(OH)₂↓ + Na₂SO₄',
      reagentes:['CuSO₄','NaOH'], condicao:'', coefR:{'CuSO₄':1,'NaOH':2}, coefP:[1,1],
      produtos_visuais:['Cu(OH)₂','Na₂SO₄'],
      candidatos:['Cu(OH)₂','Na₂SO₄','CuO','CuCl₂','NaCl','CuCO₃','Na₂CO₃','CuSO₃'],
      gabarito:{ produtos:['cu(oh)2','hidroxido de cobre','na2so4','sulfato de sodio'],
        equacaoBalanceada:'CuSO₄(aq) + 2 NaOH(aq) → Cu(OH)₂(s)↓ + Na₂SO₄(aq)' },
      hints:['Cu²⁺+2OH⁻→Cu(OH)₂↓ azul. Na₂SO₄ em solução. Precipitado azul característico','Calda bordalesa = Cu(OH)₂+Ca(OH)₂. Solução de Fehling = Cu(OH)₂+NaOH+tartarato (detecta açúcar redutor)'],
      explicacao:'CuSO₄+2NaOH→Cu(OH)₂↓+Na₂SO₄  ·  Precipitado azul de Cu(OH)₂. Base da Solução de Fehling (análise de glicose). Reage com açúcar redutor: Cu(OH)₂→Cu₂O vermelho tijolo (Fehling positivo)'
    },
    {
      id:'cuoh2_hcl_dissolucao', icon:'flask', familia:'Reação Ácido-Base',
      titulo:'Cu(OH)₂ + 2 HCl → CuCl₂ + 2 H₂O',
      reagentes:['Cu(OH)₂','HCl'], condicao:'', coefR:{'Cu(OH)₂':1,'HCl':2}, coefP:[1,2],
      produtos_visuais:['CuCl₂','H₂O'],
      candidatos:['CuCl₂','H₂O','CuSO₄','CuO','Cu','NaCl','CuCO₃','CuBr₂'],
      gabarito:{ produtos:['cucl2','cloreto de cobre','h2o','agua'],
        equacaoBalanceada:'Cu(OH)₂(s) + 2 HCl(aq) → CuCl₂(aq) + 2 H₂O(l)' },
      hints:['Base insolúvel + ácido → sal + água. Cu(OH)₂ dissolve no HCl formando solução verde de CuCl₂','Regra geral: Me(OH)n + nHX → MeXn + nH₂O. Cu(OH)₂ azul dissolve em HCl → CuCl₂ verde'],
      explicacao:'Cu(OH)₂+2HCl→CuCl₂+2H₂O  ·  Dissolução de base insolúvel em ácido. CuCl₂ é verde-azulado em solução. Usado em preservação de madeira e catalisador orgânico (reação de Wacker)'
    },
  ],

  /* ══ Fe(OH)₂ — reações (novo composto) ══ */
  'Fe(OH)2': [
    {
      id:'feoh2_oxidacao', icon:'leaf', familia:'Oxidação pelo O₂',
      titulo:'4 Fe(OH)₂ + O₂ + 2 H₂O → 4 Fe(OH)₃',
      reagentes:['Fe(OH)₂','O₂','H₂O'], condicao:'ar', coefR:{'Fe(OH)₂':4,'O₂':1,'H₂O':2}, coefP:[4],
      produtos_visuais:['Fe(OH)₃'],
      candidatos:['Fe(OH)₃','FeO','Fe₂O₃','FeSO₄','FeCl₃','Fe(OH)₂','FeOOH','Fe₃O₄'],
      gabarito:{ produtos:['fe(oh)3','hidroxido de ferro'],
        equacaoBalanceada:'4 Fe(OH)₂(s) + O₂(g) + 2 H₂O(l) → 4 Fe(OH)₃(s)' },
      hints:['Fe(OH)₂ verde oxida rapidamente ao ar: Fe²⁺→Fe³⁺. Precipitado verde→castanho','Esse é o mecanismo da ferrugem úmida! Fe(OH)₂ (verde) + O₂+H₂O → Fe(OH)₃ (castanho/ferrugem)'],
      explicacao:'4Fe(OH)₂+O₂+2H₂O→4Fe(OH)₃  ·  Oxidação do hidróxido de Fe(II) a Fe(III). É o mecanismo da ferrugem úmida. Fe(OH)₃ desidrata: 2Fe(OH)₃→Fe₂O₃·3H₂O (ferrugem). O verde→castanho é observável em segundos'
    },
    {
      id:'feoh2_h2so4_dissolve', icon:'flask', familia:'Reação Ácido-Base',
      titulo:'Fe(OH)₂ + H₂SO₄ → FeSO₄ + 2 H₂O',
      reagentes:['Fe(OH)₂','H₂SO₄'], condicao:'', coefR:{'Fe(OH)₂':1,'H₂SO₄':1}, coefP:[1,2],
      produtos_visuais:['FeSO₄','H₂O'],
      candidatos:['FeSO₄','H₂O','Fe₂(SO₄)₃','FeCl₂','FeO','Na₂SO₄','Fe(OH)₃','FeSO₃'],
      gabarito:{ produtos:['feso4','sulfato de ferro','h2o','agua'],
        equacaoBalanceada:'Fe(OH)₂(s) + H₂SO₄(aq) → FeSO₄(aq) + 2 H₂O(l)' },
      hints:['Base insolúvel + ácido → sal + água. Fe(OH)₂ dissolve em H₂SO₄ formando FeSO₄','FeSO₄ em solução = Fe²⁺ (verde pálido). Suplemento de ferro em medicamentos como FeSO₄·7H₂O (sulfato ferroso)'],
      explicacao:'Fe(OH)₂+H₂SO₄→FeSO₄+2H₂O  ·  Dissolução de hidróxido em ácido. FeSO₄·7H₂O (sulfato ferroso heptaidrato) = suplemento de ferro para anemia ferropriva. Comprimido de Fe²⁺ do SUS usa este sal'
    },
  ],

  /* ══ K₂CO₃ — reações (novo composto) ══ */
  'K2CO3': [
    {
      id:'k2co3_hcl_neutraliz', icon:'flask', familia:'Neutralização',
      titulo:'K₂CO₃ + 2 HCl → 2 KCl + H₂O + CO₂',
      reagentes:['K₂CO₃','HCl'], condicao:'', coefR:{'K₂CO₃':1,'HCl':2}, coefP:[2,1,1],
      produtos_visuais:['KCl','H₂O','CO₂'],
      candidatos:['KCl','H₂O','CO₂','K₂SO₄','KNO₃','KHCO₃','K₂O','KOH'],
      gabarito:{ produtos:['kcl','cloreto de potassio','h2o','agua','co2','dioxido de carbono'],
        equacaoBalanceada:'K₂CO₃(aq) + 2 HCl(aq) → 2 KCl(aq) + H₂O(l) + CO₂(g)' },
      hints:['Carbonato + ácido forte → sal + água + CO₂↑. Efervescência visível','K₂CO₃ + 2HCl → 2KCl + H₂O + CO₂. Mesma lógica de Na₂CO₃. CO₃²⁻ + 2H⁺ → H₂O + CO₂'],
      explicacao:'K₂CO₃+2HCl→2KCl+H₂O+CO₂  ·  Carbonato reage com ácido forte liberando CO₂. KCl é o cloreto de potássio (substituto do NaCl para hipertensos). CO₂ efervescente é a evidência visual'
    },
    {
      id:'k2co3_co2_bicarbonato', icon:'leaf', familia:'Síntese',
      titulo:'K₂CO₃ + CO₂ + H₂O → 2 KHCO₃',
      reagentes:['K₂CO₃','CO₂','H₂O'], condicao:'', coefR:{'K₂CO₃':1,'CO₂':1,'H₂O':1}, coefP:[2],
      produtos_visuais:['KHCO₃'],
      candidatos:['KHCO₃','KCl','KOH','K₂SO₄','K₂O','KNO₃','KNO₂','K₂CO₃'],
      gabarito:{ produtos:['khco3','bicarbonato de potassio'],
        equacaoBalanceada:'K₂CO₃(aq) + CO₂(g) + H₂O(l) → 2 KHCO₃(aq)' },
      hints:['K₂CO₃ (carbonato) absorve CO₂ formando KHCO₃ (bicarbonato). Análogo ao Na₂CO₃+CO₂+H₂O→2NaHCO₃','KHCO₃ = fermento de bolo sem sódio! Alternativa para dietas com restrição de Na⁺'],
      explicacao:'K₂CO₃+CO₂+H₂O→2KHCO₃  ·  Carbonatação de carbonato. KHCO₃ é bicarbonato de potássio — fermento de panificação alternativo ao NaHCO₃ para dietas com restrição de sódio'
    },
    {
      id:'k2co3_caco3_vidro', icon:'factory', familia:'Síntese Industrial (Vidro)',
      titulo:'K₂CO₃ + SiO₂ → K₂SiO₃ + CO₂',
      reagentes:['K₂CO₃','SiO₂'], condicao:'Δ ~1400°C', coefR:{'K₂CO₃':1,'SiO₂':1}, coefP:[1,1],
      produtos_visuais:['K₂SiO₃','CO₂'],
      candidatos:['K₂SiO₃','CO₂','KCl','K₂SO₄','SiO₂','K₂O','Na₂SiO₃','CO'],
      gabarito:{ produtos:['k2sio3','silicato de potassio','co2','dioxido de carbono'],
        equacaoBalanceada:'K₂CO₃(s) + SiO₂(s) →(Δ ~1400°C)→ K₂SiO₃(l) + CO₂(g)' },
      hints:['Processo de produção do cristal de potássio: potassa + areia (SiO₂) → silicato de K','K₂CO₃+SiO₂→K₂SiO₃+CO₂. Vidro de Bohemia (cristal) usa K₂CO₃. Análogo: Na₂CO₃+SiO₂→Na₂SiO₃ (vidro comum)'],
      explicacao:'K₂CO₃+SiO₂→K₂SiO₃+CO₂  ·  Fundição do cristal de potássio (vidro Bohemia). K₂SiO₃ = silicato de potássio, índice de refração maior que o sódico → cristal mais brilhante. Produção mundial: 5 Mt vidro/ano'
    },
  ],

  /* ══ Pb(NO₃)₂ — reações (novo composto) ══ */
  'Pb(NO3)2': [
    {
      id:'pbno32_ki_precipitado', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'Pb(NO₃)₂ + 2 KI → PbI₂↓ + 2 KNO₃',
      reagentes:['Pb(NO₃)₂','KI'], condicao:'', coefR:{'Pb(NO₃)₂':1,'KI':2}, coefP:[1,2],
      produtos_visuais:['PbI₂','KNO₃'],
      candidatos:['PbI₂','KNO₃','PbCl₂','PbSO₄','KCl','KOH','PbO','NaNO₃'],
      gabarito:{ produtos:['pbi2','iodeto de chumbo','kno3','nitrato de potassio'],
        equacaoBalanceada:'Pb(NO₃)₂(aq) + 2 KI(aq) → PbI₂(s)↓ + 2 KNO₃(aq)' },
      hints:['Pb²⁺+2I⁻→PbI₂↓ amarelo canário (espetacular!). KNO₃ solúvel fica em solução','PbI₂ precipitado amarelo brilhante = "chuva dourada". Cristaliza quando a solução esfria após fervura'],
      explicacao:'Pb(NO₃)₂+2KI→PbI₂↓+2KNO₃  ·  PbI₂ amarelo canário — experimento "chuva dourada". Em solução quente dissolve; ao resfriar, cristais amarelos precipitam lentamente como flocos dourados. Demonstração clássica'
    },
    {
      id:'pbno32_na2so4_precipita', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'Pb(NO₃)₂ + Na₂SO₄ → PbSO₄↓ + 2 NaNO₃',
      reagentes:['Pb(NO₃)₂','Na₂SO₄'], condicao:'', coefR:{'Pb(NO₃)₂':1,'Na₂SO₄':1}, coefP:[1,2],
      produtos_visuais:['PbSO₄','NaNO₃'],
      candidatos:['PbSO₄','NaNO₃','PbCl₂','PbI₂','Na₂CO₃','NaCl','PbO','NaOH'],
      gabarito:{ produtos:['pbso4','sulfato de chumbo','nano3','nitrato de sodio'],
        equacaoBalanceada:'Pb(NO₃)₂(aq) + Na₂SO₄(aq) → PbSO₄(s)↓ + 2 NaNO₃(aq)' },
      hints:['Pb²⁺+SO₄²⁻→PbSO₄↓ branco. NaNO₃ em solução. Outro precipitado de Pb²⁺','PbSO₄ branco — diferencia de PbI₂ (amarelo) e PbCrO₄ (amarelo ouro). Teste de Pb²⁺ em análise qualitativa'],
      explicacao:'Pb(NO₃)₂+Na₂SO₄→PbSO₄↓+2NaNO₃  ·  PbSO₄ precipitado branco. Usado em análise qualitativa para identificar Pb²⁺. Baterias de chumbo-ácido geram PbSO₄ durante a descarga: Pb+PbO₂+2H₂SO₄→2PbSO₄+2H₂O'
    },
    {
      id:'pbno32_decomp_termica', icon:'thermometer', familia:'Decomposição Térmica',
      titulo:'2 Pb(NO₃)₂ → 2 PbO + 4 NO₂ + O₂',
      reagentes:['Pb(NO₃)₂'], condicao:'Δ ~470°C', coefR:{'Pb(NO₃)₂':2}, coefP:[2,4,1],
      produtos_visuais:['PbO','NO₂','O₂'],
      candidatos:['PbO','NO₂','O₂','Pb(NO₃)₂','NO','PbO₂','N₂','Pb'],
      gabarito:{ produtos:['pbo','oxido de chumbo','no2','dioxido de nitrogenio','o2','oxigenio'],
        equacaoBalanceada:'2 Pb(NO₃)₂(s) →(Δ ~470°C)→ 2 PbO(s) + 4 NO₂(g) + O₂(g)' },
      hints:['Nitrato de metal pesado decompõe em óxido+NO₂+O₂. NO₂ marrom alaranjado tóxico','Regra: nitratos de metais pesados (Pb, Cu, Ag) → óxido + NO₂ + O₂. Nitratos de metais leves (K, Na) → nitrito + O₂'],
      explicacao:'2Pb(NO₃)₂→2PbO+4NO₂+O₂  ·  Decomposição com produção de NO₂ alaranjado tóxico. Regra mnemônica: metais pesados (Pb,Cu) → MO+NO₂+O₂; metais ativos (Na,K) → MNO₂+O₂. Sólido branco→pó amarelo PbO'
    },
  ],

  /* ══ NaN₃ — reações (novo composto) ══ */
  'NaN3': [
    {
      id:'nan3_airbag_decomp', icon:'explosion', familia:'Decomposição / Airbag',
      titulo:'2 NaN₃ → 2 Na + 3 N₂',
      reagentes:['NaN₃'], condicao:'faísca elétrica', coefR:{'NaN₃':2}, coefP:[2,3],
      produtos_visuais:['Na','N₂'],
      candidatos:['Na','N₂','NH₃','NO','Na₂O','NaCl','N₂O','Na₂N'],
      gabarito:{ produtos:['na','sodio','n2','nitrogenio'],
        equacaoBalanceada:'2 NaN₃(s) →(faísca)→ 2 Na(s) + 3 N₂(g)' },
      hints:['NaN₃ decompõe em <30ms por faísca elétrica. Na metálico + N₂ gasoso (pressuriza o airbag)','Na metálico formado reage com KNO₃ e SiO₂ (também no airbag): 10Na+2KNO₃→K₂O+5Na₂O+N₂ (neutralização do Na)'],
      explicacao:'2NaN₃→2Na+3N₂  ·  Princípio do airbag: 130g de NaN₃ geram 67L de N₂ em 30ms. O Na metálico formado é perigoso mas reage com KNO₃ e SiO₂ presentes no cartucho, gerando silicato inofensivo'
    },
    {
      id:'nan3_h2o_hidroxido', icon:'precipitate', familia:'Hidrólise',
      titulo:'NaN₃ + H₂O → NaOH + HN₃',
      reagentes:['NaN₃','H₂O'], condicao:'(parcial)', coefR:{'NaN₃':1,'H₂O':1}, coefP:[1,1],
      produtos_visuais:['NaOH','HN₃'],
      candidatos:['NaOH','HN₃','NH₃','N₂H₄','NaCl','Na₂O','H₂','N₂'],
      gabarito:{ produtos:['naoh','hidroxido de sodio','hn3','acido hidrazoico'],
        equacaoBalanceada:'NaN₃(aq) + H₂O(l) ⇌ NaOH(aq) + HN₃(aq)' },
      hints:['N₃⁻ + H₂O ⇌ HN₃ + OH⁻ (hidrólise básica). HN₃ = ácido hidrazoico (fraco, Kb=1,9×10⁻⁹)','Soluções aquosas de NaN₃ são levemente alcalinas por hidrólise parcial do N₃⁻'],
      explicacao:'NaN₃+H₂O⇌NaOH+HN₃  ·  Hidrólise básica parcial da azida. HN₃ é o ácido hidrazoico (extremamente tóxico em vapor). Por isso NaN₃ é manuseado em meio aquoso com cautela máxima em laboratório'
    },
    {
      id:'nan3_nacl_formacao', icon:'factory', familia:'Síntese Industrial',
      titulo:'NaNH₂ + N₂O → NaN₃ + H₂O',
      reagentes:['NaNH₂','N₂O'], condicao:'Δ 190°C', coefR:{'NaNH₂':1,'N₂O':1}, coefP:[1,1],
      produtos_visuais:['NaN₃','H₂O'],
      candidatos:['NaN₃','H₂O','Na₂N','NH₃','NaCl','NaOH','N₂','Na'],
      gabarito:{ produtos:['nan3','azida de sodio','h2o','agua'],
        equacaoBalanceada:'NaNH₂(s) + N₂O(g) →(190°C)→ NaN₃(s) + H₂O(g)' },
      hints:['Processo industrial Wislicenus: amida de sódio + óxido nitroso → NaN₃. Reação em duas etapas','NaNH₂+N₂O→NaN₃+H₂O. Método alternativo: N₂H₄+HNO₂→HN₃+2H₂O, depois HN₃+NaOH→NaN₃+H₂O'],
      explicacao:'NaNH₂+N₂O→NaN₃+H₂O  ·  Síntese industrial de NaN₃ (processo Wislicenus). Produção mundial: ~250 t/ano apenas para airbags. Regulamentado rigorosamente por ser precursor de explosivos e altamente tóxico'
    },
  ],

  /* ══ MgCl₂ — reações (novo composto) ══ */
  'MgCl2': [
    {
      id:'mgcl2_naoh_precipita', icon:'precipitate', familia:'Dupla Troca / Precipitação',
      titulo:'MgCl₂ + 2 NaOH → Mg(OH)₂↓ + 2 NaCl',
      reagentes:['MgCl₂','NaOH'], condicao:'', coefR:{'MgCl₂':1,'NaOH':2}, coefP:[1,2],
      produtos_visuais:['Mg(OH)₂','NaCl'],
      candidatos:['Mg(OH)₂','NaCl','MgO','MgCO₃','MgSO₄','Na₂SO₄','NaHCO₃','Na₂CO₃'],
      gabarito:{ produtos:['mg(oh)2','hidroxido de magnesio','nacl','cloreto de sodio'],
        equacaoBalanceada:'MgCl₂(aq) + 2 NaOH(aq) → Mg(OH)₂(s)↓ + 2 NaCl(aq)' },
      hints:['Mg²⁺+2OH⁻→Mg(OH)₂↓ branco gelatinoso. NaCl em solução','Leite de magnésia = suspensão de Mg(OH)₂. Extração industrial: MgCl₂ (da água do mar) + Ca(OH)₂ → Mg(OH)₂↓ + CaCl₂'],
      explicacao:'MgCl₂+2NaOH→Mg(OH)₂↓+2NaCl  ·  Produção do leite de magnésia. Industrialmente: MgCl₂ (bittern da salina) + Ca(OH)₂. Mg(OH)₂ filtra-se e calcina: Mg(OH)₂→MgO (magnésia). Base da produção de Mg metálico'
    },
    {
      id:'mgcl2_mg_eletrolitico', icon:'factory', familia:'Eletrólise Industrial',
      titulo:'MgCl₂ →(eletrólise)→ Mg + Cl₂',
      reagentes:['MgCl₂'], condicao:'eletrólise fundido', coefR:{'MgCl₂':1}, coefP:[1,1],
      produtos_visuais:['Mg','Cl₂'],
      candidatos:['Mg','Cl₂','MgO','MgH₂','HCl','Mg(OH)₂','Na','NaCl'],
      gabarito:{ produtos:['mg','magnesio','cl2','cloro'],
        equacaoBalanceada:'MgCl₂(l) →(eletrólise)→ Mg(l) + Cl₂(g)' },
      hints:['Processo Dow: eletrólise de MgCl₂ fundido. Cátodo (−): Mg²⁺+2e⁻→Mg. Ânodo (+): 2Cl⁻→Cl₂+2e⁻','Mg metálico é o 3º metal mais usado (depois de Al e Fe). 90% vem da eletrólise de MgCl₂ da água do mar'],
      explicacao:'MgCl₂→Mg+Cl₂  ·  Processo Dow — eletrólise do MgCl₂ fundido (660°C). Cl₂ vendido para PVC e HCl. Mg usado em ligas aeronáuticas, estruturas de carros e baterias Mg-íon de nova geração'
    },
    {
      id:'mgcl2_mg_formacao', icon:'flask', familia:'Síntese',
      titulo:'Mg + 2 HCl → MgCl₂ + H₂',
      reagentes:['Mg','HCl'], condicao:'', coefR:{'Mg':1,'HCl':2}, coefP:[1,1],
      produtos_visuais:['MgCl₂','H₂'],
      candidatos:['MgCl₂','H₂','MgO','Mg(OH)₂','MgSO₄','MgCO₃','NaCl','H₂O'],
      gabarito:{ produtos:['mgcl2','cloreto de magnesio','h2','hidrogenio'],
        equacaoBalanceada:'Mg(s) + 2 HCl(aq) → MgCl₂(aq) + H₂(g)' },
      hints:['Mg é muito reativo (acima de Zn e Fe na série). Mg→Mg²⁺+2e⁻. 2H⁺+2e⁻→H₂','Reação vigorosa com chama se acende em HCl. Mg é tão reativo que queima até em CO₂: 2Mg+CO₂→2MgO+C'],
      explicacao:'Mg+2HCl→MgCl₂+H₂  ·  Mg ativo reage com HCl com efervescência intensa. Mg queima em CO₂ (diferente de Fe, Zn, Al). Ligas Mg (duralumin) são as mais leves estruturalmente (1,74 g/cm³)'
    },
  ],

  }; // fim r3

  Object.keys(r3).forEach(function(k){
    if(!REACOES_LIVRES[k]) REACOES_LIVRES[k] = [];
    r3[k].forEach(function(rxn){ REACOES_LIVRES[k].push(rxn); });
  });
})();

