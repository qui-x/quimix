/* ================================================================
   SIQA — dadosambiental.js | dados fixos de Química Ambiental
   ================================================================
   FONTES DOS DADOS (conferir/atualizar sempre nestas referências):
   - Potenciais de aquecimento global (GWP-100): IPCC, Sexto Relatório
     de Avaliação (AR6), Grupo de Trabalho I, Capítulo 7, material
     suplementar (tabela de métricas de emissão). O metano tem GWP
     diferente para origem fóssil e biogênica — os dois estão aqui.
   - Concentrações atmosféricas globais: NOAA Global Monitoring
     Laboratory (gml.noaa.gov/ccgg/trends) — ATUALIZE estes números
     a cada ano letivo, eles sobem continuamente.
   - Chuva ácida: US EPA, "What is Acid Rain?" (epa.gov/acidrain) —
     a chuva limpa já é levemente ácida (pH ≈ 5,6) por causa do CO₂
     dissolvido; fala-se em chuva ácida abaixo de pH 5,0.
   - Camada de ozônio, Unidade Dobson e definição de "buraco":
     NASA Ozone Watch (ozonewatch.gsfc.nasa.gov) — coluna típica de
     ~300 DU; considera-se buraco de ozônio a região com menos de
     220 DU. Ciclo catalítico do cloro: Molina & Rowland (1974),
     Nobel de Química de 1995.
   - Protocolo de Montreal (1987): tratado que eliminou a produção
     de CFCs; entrou em vigor em 1989.

   MODELOS DIDÁTICOS DESTE MÓDULO (declarados abertamente)
   1) O pH da chuva é calculado somando a acidez do CO₂ dissolvido
      (pH 5,6) com a acidez de um ácido forte formado a partir de
      SO₂/NOₓ. A escala de emissão (0 a 100) é relativa, não é uma
      medida real de tonelada emitida.
   2) A coluna de ozônio em DU cai linearmente com o índice de CFC.
      Serve para mostrar a tendência, não para prever valores reais.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIQA',
  TITLE: 'Simulador Interativo de Química Ambiental',

  /* ── Gases de efeito estufa ── */
  GASES_ESTUFA: [
    {
      id: 'co2', nome: 'Dióxido de carbono', formula: 'CO₂', dot: '#94a3b8',
      conc: '≈ 420 ppm', gwp: 1, vida: 'séculos (parte permanece por milênios)',
      fontes: 'queima de combustíveis fósseis, desmatamento, cimento',
      nota: 'é o gás de referência: todos os outros GWP são medidos em relação a ele',
    },
    {
      id: 'ch4', nome: 'Metano', formula: 'CH₄', dot: '#fbbf24',
      conc: '≈ 1 930 ppb', gwp: 27, vida: 'cerca de 12 anos',
      fontes: 'pecuária, aterros sanitários, arrozais, vazamentos de gás',
      nota: 'GWP-100 de 27 para metano biogênico e cerca de 30 para o de origem fóssil (IPCC AR6)',
    },
    {
      id: 'n2o', nome: 'Óxido nitroso', formula: 'N₂O', dot: '#a78bfa',
      conc: '≈ 337 ppb', gwp: 273, vida: 'cerca de 110 anos',
      fontes: 'fertilizantes nitrogenados, esgoto, queima de biomassa',
      nota: 'além do efeito estufa, também participa da destruição do ozônio estratosférico',
    },
    {
      id: 'cfc12', nome: 'CFC-12', formula: 'CCl₂F₂', dot: '#f87171',
      conc: '≈ 0,5 ppb (em queda)', gwp: 10200, vida: 'cerca de 100 anos',
      fontes: 'antigos refrigeradores e aerossóis — proibido pelo Protocolo de Montreal',
      nota: 'é ao mesmo tempo um gás de efeito estufa potentíssimo e um destruidor de ozônio',
    },
  ],

  /* ── Chuva ácida ── */
  CHUVA: {
    phLimpa: 5.6,          // chuva não poluída, em equilíbrio com o CO₂ do ar
    phLimiteAcida: 5.0,    // referência usual para chamar de "chuva ácida"
    reacoes: [
      { eq: 'CO₂(g) + H₂O(l) ⇌ H₂CO₃(aq)', tag: 'acidez natural da chuva limpa (pH ≈ 5,6)' },
      { eq: 'SO₂(g) + H₂O(l) → H₂SO₃(aq)', tag: 'ácido sulfuroso' },
      { eq: '2 SO₂(g) + O₂(g) → 2 SO₃(g)', tag: 'oxidação na atmosfera' },
      { eq: 'SO₃(g) + H₂O(l) → H₂SO₄(aq)', tag: 'ácido sulfúrico, um ácido forte' },
      { eq: '3 NO₂(g) + H₂O(l) → 2 HNO₃(aq) + NO(g)', tag: 'ácido nítrico, um ácido forte' },
    ],
    efeitos: [
      'corrói mármore e calcário (CaCO₃) em monumentos e fachadas',
      'acidifica lagos e rios, prejudicando peixes e anfíbios',
      'lixivia nutrientes do solo e libera alumínio tóxico para as raízes',
    ],
  },

  /* ── Camada de ozônio ── */
  OZONIO: {
    duNormal: 300,         // coluna típica, em Unidades Dobson
    duBuraco: 220,         // abaixo disso a NASA considera "buraco de ozônio"
    reacoes: [
      { eq: 'O₂ + UV → 2 O•', tag: 'fotólise do oxigênio (UV de alta energia)' },
      { eq: 'O• + O₂ → O₃', tag: 'formação do ozônio' },
      { eq: 'O₃ + UV → O₂ + O•', tag: 'o ozônio absorve o UV-B e se refaz: ciclo natural' },
      { eq: 'CCl₂F₂ + UV → CClF₂• + Cl•', tag: 'o CFC libera cloro na estratosfera' },
      { eq: 'Cl• + O₃ → ClO• + O₂', tag: 'o cloro destrói o ozônio' },
      { eq: 'ClO• + O• → Cl• + O₂', tag: 'o cloro é regenerado — é catalisador, não se gasta' },
    ],
    nota: 'Um único átomo de cloro pode destruir da ordem de cem mil moléculas de ozônio antes de ser removido da estratosfera.',
    tratado: 'Protocolo de Montreal (1987, em vigor desde 1989)',
  },

  MODES: [
    {
      id: 'estufa', sigla: 'GEE', nome: 'Efeito Estufa', sub: 'Gases e o GWP',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      hint: 'Escolha um gás e compare a concentração na atmosfera com o potencial de aquecimento global (GWP-100).',
      info: 'O efeito estufa é natural e necessário: sem ele a Terra seria cerca de 33 °C mais fria. O problema é a intensificação causada pelo aumento dos gases que absorvem radiação infravermelha. Cada gás tem um potencial de aquecimento global (GWP) diferente, medido em relação ao CO₂ ao longo de 100 anos. Concentração e GWP são coisas distintas: o CO₂ tem GWP 1 mas está em concentração milhares de vezes maior; o CFC-12 tem GWP de mais de dez mil, mas está em concentração baixíssima e caindo.',
      formula: 'contribuição ≈ concentração × GWP',
      formulaNote: 'GWP-100 do IPCC AR6. As concentrações precisam ser atualizadas anualmente pelo NOAA GML.',
      hintCanvas: 'Enter/Espaço passa para o próximo gás',
      def: 'GWP é quantas vezes um gás aquece mais que o CO₂ ao longo de 100 anos — não é a mesma coisa que estar em maior quantidade.',
      fatos: [
        { l: 'CO₂',  v: 'GWP 1 · ≈ 420 ppm' },
        { l: 'CH₄',  v: 'GWP 27 · ≈ 1 930 ppb' },
        { l: 'N₂O',  v: 'GWP 273' },
        { l: 'CFC-12', v: 'GWP ≈ 10 200' },
      ],
      canvasInteracao: 'A camada de gases fica mais espessa conforme o GWP do gás escolhido, e mais radiação infravermelha volta ao solo. A barra no solo é o GWP, em escala logarítmica; o nome do gás e os dados ficam em Resultados.',
      recomendados: ['Dióxido de carbono', 'Metano', 'CFC-12'],
      overlay: 'Efeito estufa', panels: ['panel-estufa'], primary: 'gee-next',
    },
    {
      id: 'chuva', sigla: 'pH', nome: 'Chuva Ácida', sub: 'SO₂, NOₓ e o pH',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="16" y1="14" x2="16" y2="21"/><line x1="8" y1="14" x2="8" y2="21"/><line x1="12" y1="16" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>',
      hint: 'Aumente o índice de emissão de SO₂ e NOₓ e acompanhe o pH da chuva descendo na escala.',
      info: 'A chuva limpa já é levemente ácida, com pH em torno de 5,6, porque o CO₂ do ar se dissolve formando ácido carbônico, que é fraco. A chuva ácida aparece quando SO₂ (de combustíveis com enxofre) e NOₓ (de motores e termelétricas) se transformam na atmosfera em ácido sulfúrico e ácido nítrico — dois ácidos fortes, que ionizam quase por completo e derrubam o pH bem abaixo de 5. Costuma-se chamar de chuva ácida a partir de pH 5,0.',
      formula: 'pH = −log([H⁺] do CO₂ + [H⁺] dos ácidos fortes)',
      formulaNote: 'O índice de emissão é relativo (0 a 100), não é tonelada emitida — o objetivo é ver a tendência do pH.',
      hintCanvas: 'Enter/Espaço anuncia o pH atual',
      def: 'SO₂ e NOₓ viram ácidos fortes na atmosfera e derrubam o pH da chuva de 5,6 para bem menos de 5.',
      fatos: [
        { l: 'Chuva limpa', v: 'pH ≈ 5,6 (CO₂)' },
        { l: 'Chuva ácida', v: 'pH < 5,0' },
        { l: 'Do SO₂',      v: 'H₂SO₄ — ácido forte' },
        { l: 'Do NO₂',      v: 'HNO₃ — ácido forte' },
      ],
      canvasInteracao: 'A escala de pH mostra o valor atual (vermelho) e o da chuva limpa (cinza, tracejado). As reações em curso e o que cada cor significa ficam em Resultados.',
      overlay: 'Chuva ácida', panels: ['panel-chuva'], primary: 'chuva-status',
    },
    {
      id: 'ozonio', sigla: 'O₃', nome: 'Camada de Ozônio', sub: 'CFCs e o ciclo do cloro',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      hint: 'Aumente o índice de CFC na estratosfera e veja a coluna de ozônio cair em Unidades Dobson.',
      info: 'Na estratosfera existe um ciclo natural em que o ozônio se forma e se desfaz absorvendo radiação ultravioleta — é isso que protege a superfície do UV-B. Os CFCs sobem intactos até lá, são quebrados pelo UV e liberam cloro atômico. O cloro destrói o ozônio e é regenerado no fim do ciclo: por ser catalisador, um só átomo destrói da ordem de cem mil moléculas de ozônio. A coluna de ozônio é medida em Unidades Dobson, sendo cerca de 300 DU o valor típico e abaixo de 220 DU o que se chama de buraco na camada.',
      formula: 'Cl• + O₃ → ClO• + O₂   ·   ClO• + O• → Cl• + O₂',
      formulaNote: 'Somando as duas etapas o cloro reaparece intacto: é catálise, não consumo.',
      hintCanvas: 'Enter/Espaço anuncia a coluna de ozônio atual',
      def: 'O cloro liberado dos CFCs destrói ozônio e se regenera — atua como catalisador da própria destruição.',
      fatos: [
        { l: 'Coluna típica', v: '≈ 300 DU' },
        { l: 'Buraco',        v: '< 220 DU' },
        { l: 'Um Cl destrói', v: '~100 mil O₃' },
        { l: 'Tratado',       v: 'Montreal, 1987' },
      ],
      canvasInteracao: 'A faixa de ozônio fica mais fina e mais raios UV atravessam até a superfície. O contorno tracejado é a espessura típica (300 DU) e a linha vermelha, o limite do buraco (220 DU). O ciclo do cloro fica em Resultados.',
      overlay: 'Camada de ozônio', panels: ['panel-ozonio'], primary: 'oz-status',
    },
  ],

  CURIOSIDADES: [
    'Sem efeito estufa natural a temperatura média da Terra seria cerca de 33 graus mais baixa: o problema é a intensificação, não o efeito em si.',
    'O metano fica pouco tempo na atmosfera, cerca de 12 anos, mas aquece dezenas de vezes mais que o CO₂ nesse período.',
    'O Protocolo de Montreal, de 1987, é considerado o acordo ambiental mais bem-sucedido da história: a camada de ozônio está em recuperação.',
    'Molina e Rowland levaram o Nobel de Química de 1995 justamente por explicar como os CFCs destroem o ozônio.',
    'Ozônio na estratosfera protege; ozônio ao nível do solo é poluente e irrita as vias respiratórias.',
    'A chuva limpa não tem pH 7: o CO₂ dissolvido já a deixa em torno de 5,6.',
    'Monumentos de mármore se corroem com chuva ácida porque o carbonato de cálcio reage com ácidos formando gás carbônico.',
  ],
};
