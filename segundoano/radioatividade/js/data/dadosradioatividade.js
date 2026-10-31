/* ================================================================
   SIRAD — dadosradioatividade.js | dados fixos de Radioatividade
   ================================================================
   FONTES: meias-vidas — CRC Handbook (97ª ed.) e IAEA Live Chart of
   Nuclides. Propriedades das emissões α, β e γ e poder de penetração
   — Chang, Química Geral; Usberco & Salvador. Fissão do U-235 com
   emissão média de 2–3 nêutrons por evento — literatura didática.
   ================================================================ */
'use strict';

window.SIM_DATA = {
  ACRO: 'SIRAD',
  TITLE: 'Simulador Interativo de Radioatividade',

  /* ── As três emissões naturais ── */
  EMISSOES: [
    { id: 'alfa', nome: 'Alfa (α)', simb: '₂⁴α', cor: '#f4522d',
      natureza: 'núcleo de hélio (2 p + 2 n)', carga: '+2', massa: '4 u',
      penetra: 'baixa', barrada: 'folha de papel / pele',
      efeito: 'o núcleo perde 2 prótons e 4 de massa (1ª Lei de Soddy)' },
    { id: 'beta', nome: 'Beta (β⁻)', simb: '₋₁⁰β', cor: '#38bdf8',
      natureza: 'elétron emitido pelo núcleo', carga: '−1', massa: '≈ 0',
      penetra: 'média', barrada: 'lâmina de alumínio (mm)',
      efeito: 'um nêutron vira próton: Z sobe 1, massa não muda (2ª Lei de Soddy)' },
    { id: 'gama', nome: 'Gama (γ)', simb: '₀⁰γ', cor: '#4ade80',
      natureza: 'onda eletromagnética', carga: '0', massa: '0',
      penetra: 'altíssima', barrada: 'só ATENUADA por chumbo/concreto espessos',
      efeito: 'não altera Z nem A — apenas libera o excesso de energia do núcleo' },
  ],

  /* ── Isótopos do modo Meia-vida ──
     CORRECAO ESTRUTURAL. Antes a meia-vida existia SO como texto
     (meia: '5.730 anos'), sem valor numerico nenhum. Consequencia: o
     simulador contava o tempo em multiplos de t½ e todos os isotopos se
     comportavam de forma identica na tela — trocar Tc-99m por U-238 mudava
     a cor e o rotulo, e nao mudava nada na fisica. Isso inviabilizava a
     constante de desintegracao, a atividade e a datacao.

     Agora cada isotopo traz:
       t12   valor numerico na unidade natural do isotopo
       un    unidade desse valor ('h', 'd', 'a')
       t12s  a MESMA meia-vida convertida para SEGUNDOS — e este campo que
             as contas usam, para que 6,01 h e 4,47 Ga convivam na mesma
             formula sem gambiarra de escala
       A     numero de massa, usado na atividade (A = lambda*N)
       Z     numero atomico, para o balanceador de Soddy
       emissao  tipo de emissao dominante

     FONTES: IAEA Live Chart of Nuclides e CRC Handbook (97a ed.).
     Segundos por unidade: h = 3600 · d = 86.400 · a (ano juliano) = 31.557.600. */
  ISOTOPOS: [
    { id: 'tc99m', nome: 'Tecnécio-99m', simb: '⁹⁹ᵐTc', meia: '6,01 horas', cor: '#38bdf8',
      t12: 6.01, un: 'h', t12s: 2.164e4, A: 99, Z: 43, emissao: 'gama',
      uso: 'traçador em exames de cintilografia (medicina nuclear)' },
    { id: 'i131', nome: 'Iodo-131', simb: '¹³¹I', meia: '8,02 dias', cor: '#a78bfa',
      t12: 8.02, un: 'd', t12s: 6.929e5, A: 131, Z: 53, emissao: 'beta',
      uso: 'diagnóstico e tratamento de tireoide' },
    { id: 'co60', nome: 'Cobalto-60', simb: '⁶⁰Co', meia: '5,27 anos', cor: '#fbbf24',
      t12: 5.27, un: 'a', t12s: 1.663e8, A: 60, Z: 27, emissao: 'beta',
      uso: 'radioterapia e esterilização de materiais' },
    { id: 'cs137', nome: 'Césio-137', simb: '¹³⁷Cs', meia: '30,17 anos', cor: '#f87171',
      t12: 30.17, un: 'a', t12s: 9.521e8, A: 137, Z: 55, emissao: 'beta',
      uso: 'fontes industriais — protagonista do acidente de Goiânia (1987)' },
    { id: 'c14', nome: 'Carbono-14', simb: '¹⁴C', meia: '5.730 anos', cor: '#4ade80',
      t12: 5730, un: 'a', t12s: 1.808e11, A: 14, Z: 6, emissao: 'beta',
      uso: 'datação de fósseis e artefatos arqueológicos' },
    { id: 'u238', nome: 'Urânio-238', simb: '²³⁸U', meia: '4,47 bilhões de anos', cor: '#94a3b8',
      t12: 4.468e9, un: 'a', t12s: 1.410e17, A: 238, Z: 92, emissao: 'alfa',
      uso: 'datação geológica — idade da própria Terra' },
  ],

  /* ── Constantes para atividade e datação ── */
  NA: 6.022e23,          // constante de Avogadro (mol⁻¹)
  SEG: { h: 3600, d: 86400, a: 31557600 },   // segundos por unidade
  UN_NOME: { h: 'horas', d: 'dias', a: 'anos' },
  BQ_CI: 3.7e10,         // 1 curie = 3,7·10¹⁰ Bq (definição)

  /* Atividade específica do ¹⁴C num organismo vivo, usada na datação:
     razão ¹⁴C/¹²C ≈ 1,3·10⁻¹² no carbono em troca com a atmosfera
     (Libby; IAEA). É o "100 %" de referência de qualquer amostra. */
  C14_VIVO: 1.3e-12,

  /* ── Fissão em cadeia (modo 3) ── */
  FISSAO: { alvo: 'U-235', neutronsPorFissao: 3, eq: '²³⁵U + n → ⁹²Kr + ¹⁴¹Ba + 3 n + energia' },

  MODES: [
    {
      id: 'emissoes', sigla: 'α β γ', nome: 'Emissões Radioativas', sub: 'Penetração e desvio',
      hint: 'Emita os três tipos de radiação contra barreiras de papel, alumínio e chumbo, ou entre placas eletrizadas, e compare os comportamentos.',
      info: 'A radiação alfa é um núcleo de hélio: pesada, com carga +2, é barrada por uma folha de papel. A beta é um elétron veloz, barrado por alumínio. A gama é onda eletromagnética sem carga nem massa — a mais penetrante, só atenuada por chumbo. Num campo elétrico, α desvia para a placa negativa, β (muito leve) desvia bastante para a positiva e γ segue reto.',
      formula: 'α = ₂⁴He²⁺ · β⁻ = ₋₁⁰e · γ = fóton',
      formulaNote: 'Leis de Soddy: emitir α → Z−2 e A−4; emitir β → Z+1 e A constante; γ não muda o elemento.',
      hintCanvas: 'Enter/Espaço emite um novo pulso de radiação',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 12h.01" /><path d="M14 15.4641a4 4 0 0 1-4 0L7.52786 19.74597 A 1 1 0 0 0 7.99303 21.16211 10 10 0 0 0 16.00697 21.16211 1 1 0 0 0 16.47214 19.74597z" /><path d="M16 12a4 4 0 0 0-2-3.464l2.472-4.282a1 1 0 0 1 1.46-.305 10 10 0 0 1 4.006 6.94A1 1 0 0 1 21 12z" /><path d="M8 12a4 4 0 0 1 2-3.464L7.528 4.254a1 1 0 0 0-1.46-.305 10 10 0 0 0-4.006 6.94A1 1 0 0 0 3 12z" /></svg>',
      def: 'Alfa é pesada e barrada por papel; beta é mais penetrante, barrada por alumínio; gama é a mais penetrante de todas.',
      fatos: [
        { l: 'Alfa',  v: 'núcleo de He²⁺' },
        { l: 'Beta',  v: 'elétron (β⁻)' },
        { l: 'Gama',  v: 'fóton, sem carga' },
        { l: 'Regra', v: 'Leis de Soddy' },
      ],
      canvasInteracao: 'Emita os três tipos de radiação contra barreiras de papel, alumínio e chumbo, ou entre placas eletrizadas.',
      recomendados: ['Alfa (α)', 'Beta (β⁻)', 'Gama (γ)'],
      overlay: 'Emissões α, β, γ', panels: ['panel-emis'], primary: 'emitir',
    },
    {
      id: 'meiavida', sigla: 't½', nome: 'Meia-vida', sub: 'Decaimento exponencial',
      hint: 'Escolha um isótopo real, avance o tempo em meias-vidas e acompanhe a amostra decair átomo a átomo sobre a curva exponencial.',
      info: 'Meia-vida é o tempo para METADE dos núcleos de uma amostra decair — uma propriedade fixa de cada isótopo, que não depende de temperatura, pressão ou massa. Após n meias-vidas resta N₀/2ⁿ. É impossível prever qual átomo decai, mas a estatística do conjunto é exata: essa é a base da datação por carbono-14.',
      formula: 'N = N₀ · (1/2)^(t/t½)',
      formulaNote: 'Após 1 t½ resta 50 %; após 2, 25 %; após 3, 12,5 %… A atividade cai na mesma proporção.',
      hintCanvas: 'Enter/Espaço sorteia quais átomos decaem',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 22h14" /><path d="M5 2h14" /><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" /><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" /></svg>',
      def: 'Meia-vida é o tempo pra metade dos núcleos decair — fixa pra cada isótopo, não depende de temperatura ou pressão.',
      fatos: [
        { l: 'Fórmula',    v: 'N=N₀·(1/2)^(t/t½)' },
        { l: 'Após 1 t½',  v: '50% resta' },
        { l: 'Após 3 t½',  v: '12,5% resta' },
        { l: 'Isótopos',   v: '6 disponíveis' },
      ],
      canvasInteracao: 'Escolha um isótopo real, avance o tempo em meias-vidas e veja a amostra decair átomo a átomo.',
      recomendados: ['Carbono-14', 'Cobalto-60', 'Urânio-238'],
      overlay: 'Meia-vida', panels: ['panel-meia'], primary: 'mv-sortear',
    },
    {
      id: 'cadeia', sigla: 'n → 3n', nome: 'Fissão em Cadeia', sub: 'U-235 e barras de controle',
      hint: 'Dispare um nêutron contra núcleos de urânio-235 e regule as barras de controle para manter a reação subcrítica, crítica ou supercrítica.',
      info: 'Ao capturar um nêutron, o U-235 se parte em dois núcleos menores e libera cerca de 3 novos nêutrons e muita energia. Se cada fissão provocar em média mais de uma nova fissão (k > 1), a reação cresce em cadeia — é a bomba. Num reator, as barras de controle absorvem nêutrons para segurar k ≈ 1: reação crítica e estável.',
      formula: '²³⁵U + n → fragmentos + 3 n + energia',
      formulaNote: 'k = nêutrons úteis por fissão: k < 1 subcrítica (apaga) · k = 1 crítica (reator) · k > 1 supercrítica (explosiva).',
      hintCanvas: 'Enter/Espaço dispara um nêutron',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></svg>',
      def: 'Se cada fissão gerar mais de uma nova fissão (k>1) a reação cresce em cadeia; as barras de controle mantêm k≈1 no reator.',
      fatos: [
        { l: 'Reação',  v: '²³⁵U+n→fragmentos+3n' },
        { l: 'k < 1',   v: 'subcrítica (apaga)' },
        { l: 'k = 1',   v: 'crítica (reator)' },
        { l: 'k > 1',   v: 'supercrítica (explosiva)' },
      ],
      canvasInteracao: 'Dispare um nêutron contra núcleos de U-235 e regule as barras de controle para manter a reação sob controle.',
      overlay: 'Fissão em cadeia', panels: ['panel-cadeia'], primary: 'disparar',
    },
    {
      id: 'soddy', sigla: 'Z, A', nome: 'Equações Nucleares', sub: 'Leis de Soddy na prática',
      hint: 'Complete a equação nuclear ajustando o número atômico e o número de massa do produto, e confira a conservação.',
      info: 'Numa equação nuclear duas coisas se conservam sempre: a soma dos números de MASSA (A, os de cima) e a soma dos números ATÔMICOS (Z, os de baixo). São as Leis de Soddy, e delas sai tudo. Emissão alfa: o núcleo perde 2 prótons e 4 de massa, então Z cai 2 e A cai 4 — o elemento anda duas casas para trás na tabela. Emissão beta menos: um nêutron se converte em próton e o elétron é expulso, então Z SOBE 1 e A não muda — o elemento anda uma casa para frente, e repare que a massa fica igual porque próton e nêutron pesam praticamente o mesmo. Emissão gama: nem Z nem A mudam, o núcleo apenas se livra de energia em excesso. Existe também o beta mais, ou pósitron, em que um próton vira nêutron e Z CAI 1, e a captura de elétron, com o mesmo efeito sobre Z. O jeito de não errar é sempre o mesmo: escreva as duas somas e resolva por diferença.',
      formula: 'ΣA (esquerda) = ΣA (direita)   ·   ΣZ (esquerda) = ΣZ (direita)',
      formulaNote: 'α: Z−2, A−4 · β⁻: Z+1, A igual · β⁺: Z−1, A igual · γ: nada muda · captura de elétron: Z−1, A igual. Massas e números atômicos conferidos contra a IAEA Live Chart of Nuclides.',
      hintCanvas: 'Setas ← → ajustam Z; ↑ ↓ ajustam A; Enter/Espaço confere',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>',
      def: 'Numa equação nuclear a soma dos números de massa e a soma dos números atômicos se conservam — só isso já resolve o exercício.',
      fatos: [
        { l: 'Alfa (α)',  v: 'Z − 2 · A − 4' },
        { l: 'Beta (β⁻)', v: 'Z + 1 · A igual' },
        { l: 'Beta (β⁺)', v: 'Z − 1 · A igual' },
        { l: 'Gama (γ)',  v: 'Z e A inalterados' },
      ],
      canvasInteracao: 'Ajuste Z e A do produto até as duas somas fecharem dos dois lados; o simulador confere e diz qual conservação falhou.',
      recomendados: ['²³⁸U → α', '¹⁴C → β⁻', '²²⁶Ra → α'],
      overlay: 'Equações nucleares', panels: ['panel-soddy'], primary: 'sod-conferir',
    },
    {
      id: 'datacao', sigla: 'C-14', nome: 'Datação Radioativa', sub: 'Que idade tem a amostra?',
      hint: 'Meça quanto do isótopo ainda resta numa amostra e descubra a idade dela — o exercício clássico do carbono-14.',
      info: 'Enquanto um ser vivo respira e se alimenta, a proporção de carbono-14 no seu carbono fica igual à da atmosfera, porque ele repõe o que decai. Quando morre, a reposição para e o ¹⁴C só decai. Medir a fração que restou é, portanto, medir quanto tempo passou. A conta sai da lei do decaimento: N/N₀ = (1/2) elevado a t/t½, e isolando o tempo temos t = t½ · log₂(N₀/N). Restou metade? Uma meia-vida, 5.730 anos. Restou um quarto? Duas, 11.460 anos. O método tem limite: abaixo de cerca de 1% restante o sinal se confunde com o ruído, o que dá um teto prático perto de 50 mil anos — por isso fósseis de dinossauro NÃO são datados por carbono-14, e sim por pares de meia-vida longa como urânio-chumbo ou potássio-argônio. Troque o isótopo no painel e veja a faixa útil de cada método mudar junto.',
      formula: 't = t½ · log₂(N₀/N)   ·   N/N₀ = (½)^(t/t½)',
      formulaNote: 'Equivalente: t = (t½/ln2)·ln(N₀/N). A faixa útil de cada método vai de cerca de 0,1 a 10 meias-vidas: acima disso resta pouco demais para medir, abaixo a diferença é menor que o erro. Meias-vidas: IAEA. Razão ¹⁴C/¹²C num organismo vivo ≈ 1,3·10⁻¹².',
      hintCanvas: 'Setas ← → mudam a fração restante; Enter/Espaço anuncia a idade',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" /></svg>',
      def: 'A fração de isótopo que restou numa amostra é um relógio: t = t½ · log₂(N₀/N).',
      fatos: [
        { l: 'Restou 50 %',  v: '1 meia-vida' },
        { l: 'Restou 25 %',  v: '2 meias-vidas' },
        { l: 'C-14 t½',      v: '5.730 anos' },
        { l: 'Teto do C-14', v: '≈ 50 mil anos' },
      ],
      canvasInteracao: 'Mova a fração restante e leia a idade calculada; a barra mostra se o resultado está dentro da faixa confiável do método.',
      recomendados: ['Carbono-14', 'Urânio-238', 'Potássio-40'],
      overlay: 'Datação radioativa', panels: ['panel-datacao'], primary: 'dat-status',
    },
    {
      id: 'serie', sigla: 'U → Pb', nome: 'Série Radioativa', sub: 'Do urânio-238 ao chumbo-206',
      hint: 'Percorra passo a passo a série de decaimento do urânio-238 e veja o caminho em ziguezague no gráfico de nêutrons contra prótons.',
      info: 'Um núcleo muito instável raramente chega ao repouso numa tacada: ele decai em série, passando por vários núcleos intermediários, até alcançar um isótopo estável. A série do urânio-238 tem 14 etapas e termina no chumbo-206, que é estável. No gráfico de nêutrons contra prótons o caminho fica visualmente característico: cada alfa dá um passo diagonal para baixo e para a esquerda, tirando 2 prótons e 2 nêutrons; cada beta menos dá um passo diagonal curto para cima e para a direita, convertendo um nêutron em próton. O resultado é um ziguezague descendente rumo à faixa de estabilidade. Duas etapas merecem atenção. O rádio-226, que Marie Curie isolou, aparece no meio do caminho. E o radônio-222, um GÁS nobre radioativo, é a razão de existirem normas de ventilação em porões e minas: como é gás, ele escapa da rocha e pode ser inalado. Note também que a série tem etapas de segundos ao lado de etapas de bilhões de anos — quem determina o ritmo do conjunto é sempre a etapa mais lenta, a do próprio U-238.',
      formula: '²³⁸U → (8 α + 6 β⁻) → ²⁰⁶Pb',
      formulaNote: 'Balanço geral: A cai de 238 para 206, ou seja 32 = 8 × 4, logo 8 emissões alfa. Z cairia 16 pelos alfas (8 × 2), mas cai só 10 (de 92 para 82), então 6 betas devolveram 6 unidades de Z. Meias-vidas e modos de decaimento: IAEA Live Chart of Nuclides.',
      hintCanvas: 'Setas ← → avançam e recuam na série; Enter/Espaço avança um passo',
      icon: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 1 1 0 10h-2" /><line x1="8" x2="16" y1="12" y2="12" /></svg>',
      def: 'Núcleos muito instáveis decaem em série, num ziguezague de alfas e betas, até chegar a um isótopo estável.',
      fatos: [
        { l: 'Início',       v: '²³⁸U (4,47 Ga)' },
        { l: 'Fim',          v: '²⁰⁶Pb (estável)' },
        { l: 'Etapas',       v: '8 α + 6 β⁻' },
        { l: 'Etapa notável', v: '²²²Rn é um gás' },
      ],
      canvasInteracao: 'Avance etapa por etapa e acompanhe o ziguezague no gráfico N × Z, com a meia-vida e o modo de decaimento de cada núcleo.',
      recomendados: ['²²⁶Ra (Marie Curie)', '²²²Rn (gás)', '²⁰⁶Pb (estável)'],
      overlay: 'Série do urânio-238', panels: ['panel-serie'], primary: 'ser-avancar',
    },
  ],

  /* ══════════════════════════════════════════════════════════════
     MODO 4 — EQUAÇÕES NUCLEARES (Leis de Soddy)
     Antes as duas leis existiam apenas como frase no campo `efeito` das
     emissoes. Agora sao exercicio: o aluno ajusta Z e A do produto e o
     simulador confere as duas conservacoes separadamente, dizendo QUAL
     das duas falhou — que e a informacao util para corrigir o erro.
     `dz`/`da` sao o que a particula emitida CARREGA embora.
     FONTES: IAEA Live Chart of Nuclides.
  ══════════════════════════════════════════════════════════════ */
  PARTICULAS: [
    { id: 'alfa',  rot: 'α  (₂⁴He)',  dz: 2,  da: 4, cor: '#f4522d',
      efeito: 'Z − 2 e A − 4', nota: 'o núcleo perde um núcleo de hélio inteiro' },
    { id: 'beta',  rot: 'β⁻ (₋₁⁰e)',  dz: -1, da: 0, cor: '#38bdf8',
      efeito: 'Z + 1 e A igual', nota: 'um nêutron vira próton e o elétron é expulso' },
    { id: 'pos',   rot: 'β⁺ (₊₁⁰e)',  dz: 1,  da: 0, cor: '#a78bfa',
      efeito: 'Z − 1 e A igual', nota: 'um próton vira nêutron; usado no exame PET' },
    { id: 'gama',  rot: 'γ  (₀⁰γ)',   dz: 0,  da: 0, cor: '#4ade80',
      efeito: 'Z e A inalterados', nota: 'só sai energia; costuma acompanhar α e β' },
  ],
  DESAFIOS_SODDY: [
    { id: 'u238a', pai: { s: 'U',  Z: 92, A: 238 }, part: 'alfa',
      filho: { s: 'Th', Z: 90, A: 234 },
      ctx: 'Primeira etapa da série do urânio, a que dita o ritmo de todas as outras.' },
    { id: 'ra226', pai: { s: 'Ra', Z: 88, A: 226 }, part: 'alfa',
      filho: { s: 'Rn', Z: 86, A: 222 },
      ctx: 'O rádio de Marie Curie virando radônio — um gás nobre radioativo.' },
    { id: 'c14',   pai: { s: 'C',  Z: 6,  A: 14 },  part: 'beta',
      filho: { s: 'N',  Z: 7,  A: 14 },
      ctx: 'O decaimento que sustenta a datação arqueológica. Repare: A não muda.' },
    { id: 'i131',  pai: { s: 'I',  Z: 53, A: 131 }, part: 'beta',
      filho: { s: 'Xe', Z: 54, A: 131 },
      ctx: 'Iodo usado em tratamento de tireoide.' },
    { id: 'co60',  pai: { s: 'Co', Z: 27, A: 60 },  part: 'beta',
      filho: { s: 'Ni', Z: 28, A: 60 },
      ctx: 'A fonte de radioterapia mais conhecida.' },
    { id: 'f18',   pai: { s: 'F',  Z: 9,  A: 18 },  part: 'pos',
      filho: { s: 'O',  Z: 8,  A: 18 },
      ctx: 'Pósitron: é este decaimento que o exame PET detecta. Aqui Z DIMINUI.' },
    { id: 'tc99m', pai: { s: 'Tc', Z: 43, A: 99 },  part: 'gama',
      filho: { s: 'Tc', Z: 43, A: 99 },
      ctx: 'Transição gama: o núcleo só perde energia. Z e A ficam iguais — inclusive o elemento.' },
    { id: 'th234', pai: { s: 'Th', Z: 90, A: 234 }, part: 'beta',
      filho: { s: 'Pa', Z: 91, A: 234 },
      ctx: 'Segunda etapa da série do urânio, agora por emissão beta.' },
  ],

  /* ══════════════════════════════════════════════════════════════
     MODO 5 — DATAÇÃO RADIOATIVA
     `t12a` em ANOS. `faixa` e a janela util do metodo em anos, como
     citada na literatura de geocronologia; `alvo` e o que se data com ela.
  ══════════════════════════════════════════════════════════════ */
  METODOS_DATACAO: [
    { id: 'c14', nome: 'Carbono-14', par: '¹⁴C → ¹⁴N', t12a: 5730, cor: '#4ade80',
      faixa: [300, 50000], alvo: 'ossos, madeira, tecido, carvão — material que foi vivo',
      nota: 'Só serve para o que teve vida e trocou carbono com a atmosfera. Acima de ~50 mil anos resta ¹⁴C de menos para medir, e é por isso que fóssil de dinossauro não se data com carbono-14.' },
    { id: 'k40', nome: 'Potássio-40', par: '⁴⁰K → ⁴⁰Ar', t12a: 1.25e9, cor: '#fbbf24',
      faixa: [1e5, 4.5e9], alvo: 'rochas vulcânicas e cinzas',
      nota: 'O método que datou as camadas onde apareceram os fósseis de hominídeos na África.' },
    { id: 'u238', nome: 'Urânio-238', par: '²³⁸U → ²⁰⁶Pb', t12a: 4.468e9, cor: '#94a3b8',
      faixa: [1e6, 4.6e10], alvo: 'zircões e meteoritos — as rochas mais antigas',
      nota: 'Foi assim que se chegou à idade da Terra: 4,54 bilhões de anos.' },
    { id: 'rb87', nome: 'Rubídio-87', par: '⁸⁷Rb → ⁸⁷Sr', t12a: 4.88e10, cor: '#f472b6',
      faixa: [1e7, 4.6e10], alvo: 'rochas muito antigas do escudo continental',
      nota: 'Meia-vida maior que a idade do Universo: só uma fração minúscula decaiu até hoje.' },
  ],

  /* ══════════════════════════════════════════════════════════════
     MODO 6 — SÉRIE RADIOATIVA DO URÂNIO-238
     As 14 etapas ate o chumbo-206. `N` (numero de neutrons) e calculado
     como A − Z na hora de desenhar, e e o eixo vertical do grafico.
     FONTES: IAEA Live Chart of Nuclides.
  ══════════════════════════════════════════════════════════════ */
  SERIE_U238: [
    { s: 'U',  Z: 92, A: 238, meia: '4,47 bilhões de anos', emite: 'alfa',
      nota: 'A etapa mais lenta da série — e por isso ela é que determina o ritmo do conjunto todo.' },
    { s: 'Th', Z: 90, A: 234, meia: '24,1 dias',   emite: 'beta', nota: '' },
    { s: 'Pa', Z: 91, A: 234, meia: '6,7 horas',   emite: 'beta', nota: '' },
    { s: 'U',  Z: 92, A: 234, meia: '245 mil anos', emite: 'alfa',
      nota: 'Voltamos ao urânio, mas com 4 unidades de massa a menos que o inicial.' },
    { s: 'Th', Z: 90, A: 230, meia: '75,4 mil anos', emite: 'alfa', nota: '' },
    { s: 'Ra', Z: 88, A: 226, meia: '1.600 anos',  emite: 'alfa',
      nota: 'O rádio isolado por Marie Curie, a partir de toneladas de pechblenda.' },
    { s: 'Rn', Z: 86, A: 222, meia: '3,82 dias',   emite: 'alfa',
      nota: 'GÁS nobre radioativo. Por ser gás, escapa da rocha e pode ser inalado — daí as normas de ventilação em porões e minas.' },
    { s: 'Po', Z: 84, A: 218, meia: '3,10 minutos', emite: 'alfa', nota: '' },
    { s: 'Pb', Z: 82, A: 214, meia: '26,8 minutos', emite: 'beta',
      nota: 'Chumbo — mas ainda não o estável: falta perder mais massa.' },
    { s: 'Bi', Z: 83, A: 214, meia: '19,9 minutos', emite: 'beta', nota: '' },
    { s: 'Po', Z: 84, A: 214, meia: '164 microssegundos', emite: 'alfa',
      nota: 'A etapa mais rápida da série: menos de um milésimo de segundo.' },
    { s: 'Pb', Z: 82, A: 210, meia: '22,2 anos',   emite: 'beta', nota: '' },
    { s: 'Bi', Z: 83, A: 210, meia: '5,01 dias',   emite: 'beta', nota: '' },
    { s: 'Po', Z: 84, A: 210, meia: '138 dias',    emite: 'alfa', nota: '' },
    { s: 'Pb', Z: 82, A: 206, meia: 'estável',     emite: null,
      nota: 'Fim da linha: 82 prótons e 124 nêutrons formam um núcleo estável. A série para aqui.' },
  ],

  CURIOSIDADES: [
    'Becquerel descobriu a radioatividade em 1896 por acaso, com sais de urânio velando chapas fotográficas na gaveta.',
    'Marie Curie ganhou dois prêmios Nobel (Física e Química); seus cadernos de anotações continuam radioativos até hoje.',
    'A datação por carbono-14 só funciona até uns 50 mil anos: depois disso resta ¹⁴C de menos para medir.',
    'O acidente de Goiânia (1987) começou com uma cápsula de césio-137 aberta num ferro-velho — o pó azul brilhante encantou e contaminou.',
    'Bananas são levemente radioativas por causa do potássio-40 — existe até a "dose equivalente de banana" para comparar exposições.',
    'Angra 1 e 2 usam a fissão do urânio para ferver água: no fim, uma usina nuclear é uma gigantesca máquina a vapor.',
    'A radiação gama esteriliza seringas, alimentos e até obras de arte sem aquecer nem molhar nada.',
    'Fóssil de dinossauro NÃO se data por carbono-14: com 66 milhões de anos, não sobrou nem um átomo de ¹⁴C. Usa-se urânio-chumbo nas rochas ao redor.',
    'A idade da Terra (4,54 bilhões de anos) foi medida por urânio-chumbo em meteoritos, não em rochas terrestres — a crosta é reciclada demais.',
    'O radônio-222 da série do urânio é um gás: ele sobe do solo e se acumula em porões, sendo a segunda maior causa de câncer de pulmão em vários países.',
    'Numa série radioativa, quem manda no ritmo é sempre a etapa mais LENTA. Na do U-238 há um passo de 164 microssegundos ao lado de um de 4,47 bilhões de anos.',
    'Na emissão beta o número de massa não muda porque próton e nêutron têm massas quase iguais — o elétron que sai pesa 1.836 vezes menos que qualquer um deles.',
    'O exame PET detecta pósitrons (β⁺): o flúor-18 decai virando oxigênio, e aí Z DIMINUI em vez de aumentar.',
  ],
};
