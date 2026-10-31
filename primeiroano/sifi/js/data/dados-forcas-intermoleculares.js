/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: dados-forcas-intermoleculares.js
   ORIGEM:  a geometria (atoms/bonds) das moléculas já usadas no SILQ
            (H₂O, CO₂, N₂, O₂, HF, HCl, NH₃, CH₄, F₂, Cl₂) foi copiada
            de moleculas-prontas.js — mesmas coordenadas. As moléculas
            que o SILQ não tinha pronta (HBr, HI, SO₂, H₂S, CH₃Cl,
            CH₃OH, HCOOH, PH₃, Br₂, He, Ne, Ar) são geometrias novas,
            desenhadas seguindo o mesmo estilo (ângulos aproximados
            via seno/cosseno para moléculas angulares/piramidais).
   ───────────────────────────────────────────────────────────────
   34 moléculas para o Módulo 1, cobrindo as 3 forças intermoleculares
   com vários exemplos em cada uma — o suficiente para comparações
   reais (não só "identificar uma força", mas "comparar a FORÇA da
   força" olhando o ponto de ebulição):

     • 6  fazem Ligação de Hidrogênio  (H₂O, NH₃, HF, CH₃OH, HCOOH, H₂O₂)
     • 10 fazem Dipolo-Dipolo          (HCl, HBr, HI, SO₂, H₂S, CH₃Cl,
                                         O₃, HCN, CH₃CHO, N₂O)
     • 18 fazem só Forças de London    (CH₄, CO₂, F₂, Cl₂, Br₂, N₂, O₂,
                                         He, Ne, Ar, Kr, Xe, PH₃, CCl₄,
                                         SiH₄, BF₃, SF₆, CS₂)

   Todo ponto de ebulição e massa molar foi conferido em fontes
   confiáveis (Wikipedia/PubChem/NIST) — ver ARQUITETURA-SIFI.md
   → "Fontes dos dados" para a lista completa.

   Cada molécula tem `boilingPoint` (ponto de ebulição, °C, 1 atm),
   `meltingPoint` (ponto de fusão, °C, 1 atm) e `molarMass` (g/mol) —
   dados reais, usados no Módulo 2 (Termostato Molecular) pra decidir
   quando cada partícula é sólida, líquida ou gasosa.

   DOIS CASOS ESPECIAIS marcados com `sublima: true` (CO₂ e SF₆): a 1
   atm, essas duas substâncias NÃO têm fase líquida estável — vão
   direto de sólido pra gás (é por isso que "gelo-seco", CO₂ sólido,
   nunca "derrete", só "fuma"). O `meltingPoint` delas existe só de
   referência (o valor real, só alcançável em pressões bem mais altas
   que 1 atm); o motor de física do Módulo 2 pula a fase líquida
   inteira pra essas duas.

   UM CASO ainda mais especial: o Hélio tem `meltingPoint: null` — é a
   ÚNICA substância que nunca solidifica a 1 atm, nem perto do zero
   absoluto (precisa de ~25 atm). Isso vem de suas forças de London
   ultra-fracas combinadas com um efeito quântico. No simulador, isso
   significa que o Hélio nunca vira sólido, não importa o quão fria a
   temperatura fique.

   COMO CLASSIFICAMOS A FORÇA DOMINANTE — regra usada em toda molécula
   deste arquivo, sem exceção (nem PH₃, que "parece" a NH₃ mas não é):
     1. A molécula tem alguma ligação com ΔEN ≥ 0,4 (mesmo limiar já
        usado no SILQ, ver dados-ligacoes.js)? Se não, é APOLAR →
        Forças de London, ponto final (é o caso do PH₃: ΔEN(P,H) =
        2,20−2,19 = 0,01 — praticamente zero, então P-H é uma ligação
        NÃO POLAR, mesmo o P sendo "vizinho" do N na tabela).
     2. É polar E tem H ligado direto a F, O ou N (regra "FON")?
        → Ligação de Hidrogênio.
     3. É polar mas o H não está ligado a F/O/N (ou a molécula não
        tem H nenhum, caso do SO₂)? → Dipolo-Dipolo.

   poloPositivo / poloNegativo: índices (no array `atoms`) de onde
   fica o δ+ e o δ− da molécula. Moléculas apolares (incluindo as
   monoatômicas He/Ne/Ar, que não têm nem ligação) não têm polo
   permanente → arrays vazios.

   Depende de: nada (é dado puro).
   Usado por: js/ui/menu-moleculas.js, js/ui/sandbox.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* Catálogo dos 3 tipos de força — label, cor e descrição curta
   exibidos no painel "força detectada" do Módulo 1. As cores usam
   a MESMA paleta de acento do tema (var(--accent) etc.) definida
   em css/sifi-styles.css — nenhuma cor nova foi inventada aqui.

   O "icon" de cada força é um SVG (texto), não emoji — mesma decisão
   de js/ui/icones.js (ver aquele arquivo para a explicação completa).
   Aqui o SVG fica escrito por extenso, em vez de vir de SIFI.ICONS,
   porque esta é a CAMADA DE DADOS: carrega antes do namespace.js e
   não pode depender de nada (ver cabeçalho do arquivo). */
const FORCE_TYPES = {
  'hydrogen-bond': {
    label: 'Ligação de Hidrogênio',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5c3 4 6 7.6 6 11a6 6 0 1 1-12 0c0-3.4 3-7 6-11Z"/></svg>',
    color: '#60a5fa',
    desc: 'A força intermolecular mais forte entre as três. Ocorre quando o H de uma molécula (ligado a F, O ou N) se aproxima do par de elétrons de F, O ou N de outra molécula vizinha.',
  },
  'dipole-dipole': {
    label: 'Dipolo-Dipolo',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v7a5 5 0 0 0 10 0V4"/><line x1="7" y1="4" x2="10.2" y2="4"/><line x1="13.8" y1="4" x2="17" y2="4"/><line x1="7" y1="8" x2="10.2" y2="8"/><line x1="13.8" y1="8" x2="17" y2="8"/></svg>',
    color: '#a78bfa',
    desc: 'Ocorre entre moléculas polares. O polo δ+ de uma molécula é atraído pelo polo δ− da molécula vizinha.',
  },
  'london': {
    label: 'Dipolo Induzido (Forças de London)',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',
    color: '#34d399',
    desc: 'A força mais fraca das três. Mesmo em moléculas apolares, o movimento dos elétrons cria dipolos instantâneos que induzem um dipolo na molécula vizinha.',
  },
};

const INTERMOL_MOLECULES = [

  /* ═══════════════ LIGAÇÃO DE HIDROGÊNIO (5) ═══════════════ */
  {
    key: 'H2O', formula: 'H₂O', name: 'Água',
    atoms: [
      { el: 'O', x: 0, y: 0 },
      { el: 'H', x: -Math.sin(52.25 * Math.PI / 180) * 0.8, y: -Math.cos(52.25 * Math.PI / 180) * 0.8 },
      { el: 'H', x: Math.sin(52.25 * Math.PI / 180) * 0.8, y: -Math.cos(52.25 * Math.PI / 180) * 0.8 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }],
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [1, 2], poloNegativo: [0],
    boilingPoint: 100, meltingPoint: 0, molarMass: 18.02, density: 1.00, polaridade: 9.0,
  },
  {
    key: 'NH3', formula: 'NH₃', name: 'Amônia',
    atoms: [
      { el: 'N', x: 0, y: 0 },
      { el: 'H', x: -Math.sin(53.9 * Math.PI / 180) * 0.85, y: Math.cos(53.9 * Math.PI / 180) * 0.85 },
      { el: 'H', x: Math.sin(53.9 * Math.PI / 180) * 0.85, y: Math.cos(53.9 * Math.PI / 180) * 0.85 },
      { el: 'H', x: 0, y: -0.85 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [1, 2, 3], poloNegativo: [0],
    boilingPoint: -33.3, meltingPoint: -77.7, molarMass: 17.03,
  },
  {
    key: 'HF', formula: 'HF', name: 'Fluoreto de Hidrogênio',
    atoms: [{ el: 'H', x: -0.45, y: 0 }, { el: 'F', x: 0.45, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 1 }],
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [0], poloNegativo: [1],
    boilingPoint: 19.5, meltingPoint: -83.6, molarMass: 20.01,
  },
  {
    key: 'CH3OH', formula: 'CH₃OH', name: 'Metanol',
    // C-O-H (o H da hidroxila faz ligação de hidrogênio) + 3 H no carbono
    atoms: [
      { el: 'C', x: -0.9, y: 0 },
      { el: 'O', x: 0.3, y: 0 },
      { el: 'H', x: 0.9, y: 0.75 },
      { el: 'H', x: -1.75, y: 0 },
      { el: 'H', x: -1.25, y: 0.85 },
      { el: 'H', x: -1.25, y: -0.85 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 }, { a: 0, b: 5, order: 1 },
    ],
    // Só o H da hidroxila (índice 2) é polo — os H ligados ao C (ΔEN 0,35) não são.
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [2], poloNegativo: [1],
    boilingPoint: 64.7, meltingPoint: -97.6, molarMass: 32.04, density: 0.791, polaridade: 5.1,
  },
  {
    key: 'HCOOH', formula: 'HCOOH', name: 'Ácido Fórmico',
    // H-C(=O)-O-H — o clássico exemplo de ácido carboxílico que dimeriza
    // por DUAS ligações de hidrogênio ao mesmo tempo.
    atoms: [
      { el: 'C', x: 0, y: 0 },
      { el: 'O', x: 0.85, y: 0.6 },
      { el: 'O', x: -0.3, y: -0.95 },
      { el: 'H', x: -1.2, y: -1.1 },
      { el: 'H', x: -0.85, y: 0.55 },
    ],
    bonds: [
      { a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 1 },
      { a: 2, b: 3, order: 1 }, { a: 0, b: 4, order: 1 },
    ],
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [3], poloNegativo: [1],
    // density e polaridade confirmados (Wikipedia "List of boiling and
    // freezing information of solvents"); a polaridade de 6,4 é uma
    // ESTIMATIVA (o ácido fórmico não está na tabela original de Snyder)
    // baseada na posição dele bem perto da água em cartas de polaridade
    // de solventes de laboratório.
    boilingPoint: 100.8, meltingPoint: 8.4, molarMass: 46.03, density: 1.22, polaridade: 6.4,
  },
  {
    key: 'H2O2', formula: 'H₂O₂', name: 'Peróxido de Hidrogênio',
    atoms: [
      { el: 'O', x: -0.55, y: 0 }, { el: 'O', x: 0.55, y: 0 },
      { el: 'H', x: -1.1, y: -0.55 }, { el: 'H', x: 1.1, y: -0.55 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 1, b: 3, order: 1 }],
    // Ferve a 150,2°C — bem mais alto que a água (100°C)! Cada molécula
    // de H₂O₂ pode fazer até 4 ligações de hidrogênio (contra 2 da água).
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [2, 3], poloNegativo: [0, 1],
    // polaridade 9,5 é uma ESTIMATIVA (H₂O₂ não está na tabela de
    // Snyder — não é um solvente de laboratório comum): estrutura muito
    // parecida com a água, mas com capacidade de ligação de hidrogênio
    // ainda maior (até 4 por molécula, contra 2 da água), então deve
    // ficar um pouco ACIMA da água na escala.
    boilingPoint: 150.2, meltingPoint: -0.4, molarMass: 34.01, density: 1.45, polaridade: 9.5,
  },

  /* ═══════════════════ DIPOLO-DIPOLO (6) ═══════════════════ */
  {
    key: 'HCl', formula: 'HCl', name: 'Ácido Clorídrico',
    atoms: [{ el: 'H', x: -0.55, y: 0 }, { el: 'Cl', x: 0.55, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 1 }],
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [1],
    boilingPoint: -85.1, meltingPoint: -114.2, molarMass: 36.46,
  },
  {
    key: 'HBr', formula: 'HBr', name: 'Ácido Bromídrico',
    atoms: [{ el: 'H', x: -0.6, y: 0 }, { el: 'Br', x: 0.6, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 1 }],
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [1],
    boilingPoint: -66.4, meltingPoint: -86.9, molarMass: 80.91,
  },
  {
    key: 'HI', formula: 'HI', name: 'Ácido Iodídrico',
    atoms: [{ el: 'H', x: -0.65, y: 0 }, { el: 'I', x: 0.65, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 1 }],
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [1],
    boilingPoint: -35.4, meltingPoint: -50.8, molarMass: 127.91,
  },
  {
    key: 'SO2', formula: 'SO₂', name: 'Dióxido de Enxofre',
    atoms: [
      { el: 'S', x: 0, y: 0 },
      { el: 'O', x: -Math.sin(59.75 * Math.PI / 180) * 0.95, y: -Math.cos(59.75 * Math.PI / 180) * 0.95 },
      { el: 'O', x: Math.sin(59.75 * Math.PI / 180) * 0.95, y: -Math.cos(59.75 * Math.PI / 180) * 0.95 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 2 }],
    // Angular (não linear!): os dipolos das duas ligações S=O NÃO se
    // cancelam — diferente do CO₂, que é linear e por isso é apolar.
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [1, 2],
    boilingPoint: -10, meltingPoint: -72.7, molarMass: 64.07,
  },
  {
    key: 'H2S', formula: 'H₂S', name: 'Sulfeto de Hidrogênio',
    // Mesma forma do H₂O (angular), mas o S NÃO está na regra "FON" —
    // ótimo contraste: parece água, mas não faz ligação de hidrogênio.
    atoms: [
      { el: 'S', x: 0, y: 0 },
      { el: 'H', x: -Math.sin(46 * Math.PI / 180) * 0.95, y: -Math.cos(46 * Math.PI / 180) * 0.95 },
      { el: 'H', x: Math.sin(46 * Math.PI / 180) * 0.95, y: -Math.cos(46 * Math.PI / 180) * 0.95 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }],
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [1, 2], poloNegativo: [0],
    boilingPoint: -60.3, meltingPoint: -85.5, molarMass: 34.08,
  },
  {
    key: 'CH3Cl', formula: 'CH₃Cl', name: 'Clorometano',
    atoms: [
      { el: 'C', x: 0, y: 0 },
      { el: 'Cl', x: 0, y: -1.1 },
      { el: 'H', x: 0.94, y: 0.35 },
      { el: 'H', x: -0.94, y: 0.35 },
      { el: 'H', x: 0, y: 0.9 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 }],
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [1],
    boilingPoint: -24.2, meltingPoint: -97.4, molarMass: 50.49,
  },
  {
    key: 'O3', formula: 'O₃', name: 'Ozônio',
    atoms: [
      { el: 'O', x: 0, y: 0 },
      { el: 'O', x: -Math.sin(58.4 * Math.PI / 180) * 0.85, y: Math.cos(58.4 * Math.PI / 180) * 0.85 },
      { el: 'O', x: Math.sin(58.4 * Math.PI / 180) * 0.85, y: Math.cos(58.4 * Math.PI / 180) * 0.85 },
    ],
    // Híbrido de ressonância: as duas ligações O-O têm, na média, ordem
    // 1,5 — aqui representadas como uma dupla e uma simples (like SILQ).
    // O oxigênio central fica com carga formal positiva na estrutura de
    // ressonância dominante — por isso é o polo δ+ aqui, ao contrário
    // do SO₂/H₂O onde o átomo central é o δ−.
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 1 }],
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [1, 2],
    boilingPoint: -112, meltingPoint: -192.2, molarMass: 48.00,
  },
  {
    key: 'HCN', formula: 'HCN', name: 'Ácido Cianídrico',
    atoms: [{ el: 'H', x: -0.8, y: 0 }, { el: 'C', x: 0, y: 0 }, { el: 'N', x: 0.9, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 3 }],
    // O H está ligado ao C, não ao N — por isso NÃO faz ligação de
    // hidrogênio (a regra é o H estar ligado DIRETO a F/O/N), mesmo
    // sendo uma molécula bem polar (o N puxa a nuvem eletrônica do
    // C≡N, deixando o H na ponta δ+).
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [2],
    boilingPoint: 26, meltingPoint: -13.3, molarMass: 27.03,
  },
  {
    key: 'CH3CHO', formula: 'CH₃CHO', name: 'Acetaldeído',
    atoms: [
      { el: 'C', x: -0.7, y: 0 }, { el: 'C', x: 0.55, y: 0 }, { el: 'O', x: 1.4, y: 0 },
      { el: 'H', x: -1.25, y: -0.7 }, { el: 'H', x: -1.25, y: 0.7 },
      { el: 'H', x: -0.7, y: -0.9 }, { el: 'H', x: 0.55, y: -0.9 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 2 }, { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 }, { a: 0, b: 5, order: 1 }, { a: 1, b: 6, order: 1 },
    ],
    // A carbonila C=O é polar, mas não tem H ligado ao O (é uma cetona/
    // aldeído, não um álcool) — então não faz ligação de hidrogênio
    // consigo mesma, só dipolo-dipolo.
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [1], poloNegativo: [2],
    boilingPoint: 20.2, meltingPoint: -123.4, molarMass: 44.05,
  },
  {
    key: 'N2O', formula: 'N₂O', name: 'Óxido Nitroso',
    atoms: [{ el: 'N', x: -0.65, y: 0 }, { el: 'N', x: 0, y: 0 }, { el: 'O', x: 0.65, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 2 }],
    // Linear, mas ASSIMÉTRICA (N-N-O, extremidades diferentes) — ao
    // contrário do CO₂ (O-C-O, simétrico), os dipolos NÃO se cancelam.
    // Comparar os dois lado a lado é o ponto principal aqui.
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [2],
    boilingPoint: -88.5, meltingPoint: -90.8, molarMass: 44.01,
  },

  /* ═════════════ FORÇAS DE LONDON — APOLARES (11) ═════════════ */
  {
    key: 'CH4', formula: 'CH₄', name: 'Metano',
    atoms: [
      { el: 'C', x: 0, y: 0 }, { el: 'H', x: 0, y: -1.0 }, { el: 'H', x: 0.94, y: 0.33 },
      { el: 'H', x: -0.94, y: 0.33 }, { el: 'H', x: 0, y: 0.85 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 }],
    // ΔEN(C,H) = 0,35 — abaixo do limiar de 0,4 — e geometria simétrica.
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -161.5, meltingPoint: -182.5, molarMass: 16.04,
  },
  {
    key: 'CO2', formula: 'CO₂', name: 'Dióxido de Carbono',
    atoms: [{ el: 'O', x: -1.05, y: 0 }, { el: 'C', x: 0, y: 0 }, { el: 'O', x: 1.05, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 2 }],
    // Linear e simétrica: os dois dipolos C=O se cancelam.
    // CASO ESPECIAL: a 1 atm, o CO₂ SUBLIMA — vai direto de sólido pra
    // gás, sem passar por líquido estável (é por isso que "gelo-seco"
    // nunca derrete, só "fuma"). O ponto de fusão marcado (-56,6°C) só
    // existe ACIMA de ~5,1 atm; a -78,5°C (o "boilingPoint" já
    // cadastrado) é onde a sublimação acontece de verdade a 1 atm.
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -78.5, meltingPoint: -56.6, sublima: true, molarMass: 44.01,
  },
  {
    key: 'F2', formula: 'F₂', name: 'Flúor',
    atoms: [{ el: 'F', x: -0.55, y: 0 }, { el: 'F', x: 0.55, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 1 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -188.1, meltingPoint: -219.6, molarMass: 38.00,
  },
  {
    key: 'Cl2', formula: 'Cl₂', name: 'Cloro',
    atoms: [{ el: 'Cl', x: -0.75, y: 0 }, { el: 'Cl', x: 0.75, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 1 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -34.0, meltingPoint: -101.5, molarMass: 70.90,
  },
  {
    key: 'Br2', formula: 'Br₂', name: 'Bromo',
    atoms: [{ el: 'Br', x: -0.85, y: 0 }, { el: 'Br', x: 0.85, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 1 }],
    // Contra-exemplo clássico: apolar, só London, e AINDA ASSIM ferve
    // mais alto (58,8°C) que o metanol (64,7°C fica perto!) e muito
    // mais alto que o HCl — porque é uma molécula bem mais pesada.
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    // polaridade 0,3 é uma ESTIMATIVA (Br₂ não está na tabela de
    // Snyder, que cobre solventes, não halogênios líquidos) — apolar
    // por simetria, deve ficar bem perto de zero, junto com os outros
    // apolares desta lista.
    boilingPoint: 58.8, meltingPoint: -7.2, molarMass: 159.81, density: 3.10, polaridade: 0.3,
  },
  {
    key: 'N2', formula: 'N₂', name: 'Nitrogênio',
    atoms: [{ el: 'N', x: -0.6, y: 0 }, { el: 'N', x: 0.6, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 3 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -195.8, meltingPoint: -210.0, molarMass: 28.01,
  },
  {
    key: 'O2', formula: 'O₂', name: 'Oxigênio',
    atoms: [{ el: 'O', x: -0.6, y: 0 }, { el: 'O', x: 0.6, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 2 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -183.0, meltingPoint: -218.8, molarMass: 32.00,
  },
  {
    key: 'He', formula: 'He', name: 'Hélio',
    // Monoatômico: um único átomo, sem ligação nenhuma — o exemplo
    // mais extremo de força de London (a mais fraca de todas).
    // CASO ESPECIAL, o mais famoso da físico-química: o Hélio é a
    // ÚNICA substância que NUNCA solidifica a 1 atm, nem chegando
    // perto do zero absoluto (precisa de ~25 atm de pressão pra
    // virar sólido) — um efeito quântico das suas forças de London
    // ultra-fracas. `meltingPoint: null` sinaliza pro motor de física
    // (fisica-termostato.js) que este composto nunca vira sólido no
    // simulador — sempre líquido ou gás, não importa o quão frio.
    atoms: [{ el: 'He', x: 0, y: 0 }],
    bonds: [],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -268.9, meltingPoint: null, molarMass: 4.00,
  },
  {
    key: 'Ne', formula: 'Ne', name: 'Neônio',
    atoms: [{ el: 'Ne', x: 0, y: 0 }],
    bonds: [],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -246.1, meltingPoint: -248.6, molarMass: 20.18,
  },
  {
    key: 'Ar', formula: 'Ar', name: 'Argônio',
    atoms: [{ el: 'Ar', x: 0, y: 0 }],
    bonds: [],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -185.8, meltingPoint: -189.3, molarMass: 39.95,
  },
  {
    key: 'PH3', formula: 'PH₃', name: 'Fosfina',
    // "Parece" a amônia (mesma forma piramidal) mas NÃO é: ΔEN(P,H) =
    // |2,20−2,19| = 0,01 — praticamente zero. A ligação P-H é apolar
    // pela mesma regra (ΔEN < 0,4) que já classifica o CH₄ como apolar.
    // Ótimo par para comparar lado a lado com a NH₃ no canvas.
    atoms: [
      { el: 'P', x: 0, y: 0 },
      { el: 'H', x: -Math.sin(46.75 * Math.PI / 180) * 0.95, y: Math.cos(46.75 * Math.PI / 180) * 0.95 },
      { el: 'H', x: Math.sin(46.75 * Math.PI / 180) * 0.95, y: Math.cos(46.75 * Math.PI / 180) * 0.95 },
      { el: 'H', x: 0, y: -0.95 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -87.7, meltingPoint: -133.5, molarMass: 34.00,
  },
  {
    key: 'CCl4', formula: 'CCl₄', name: 'Tetracloreto de Carbono',
    // As ligações C-Cl são bem polares (ΔEN 0,61) — mas a geometria
    // tetraédrica e simétrica cancela os 4 dipolos. Comparar com o
    // CH₃Cl (mesmo tipo de ligação, mas SEM simetria → é polar).
    atoms: [
      { el: 'C', x: 0, y: 0 }, { el: 'Cl', x: 0, y: -1.1 }, { el: 'Cl', x: 1.04, y: 0.37 },
      { el: 'Cl', x: -1.04, y: 0.37 }, { el: 'Cl', x: 0, y: 0.9 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: 76.7, meltingPoint: -22.9, molarMass: 153.81, density: 1.594, polaridade: 1.6,
  },
  {
    key: 'SiH4', formula: 'SiH₄', name: 'Silano',
    // Mesma forma do CH₄. ΔEN(Si,H) = |1,90−2,20| = 0,30 < 0,4 → apolar.
    atoms: [
      { el: 'Si', x: 0, y: 0 }, { el: 'H', x: 0, y: -1.0 }, { el: 'H', x: 0.94, y: 0.33 },
      { el: 'H', x: -0.94, y: 0.33 }, { el: 'H', x: 0, y: 0.85 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -112, meltingPoint: -185, molarMass: 32.12,
  },
  {
    key: 'BF3', formula: 'BF₃', name: 'Trifluoreto de Boro',
    // O exemplo mais radical de "ligação super polar, molécula apolar":
    // ΔEN(B,F) = 1,94 — a maior diferença de eletronegatividade desta
    // biblioteca inteira — mas a simetria trigonal planar (120°) faz
    // os 3 dipolos se cancelarem exatamente. Resultado: apolar.
    atoms: [
      { el: 'B', x: 0, y: 0 }, { el: 'F', x: 0, y: -1.0 },
      { el: 'F', x: 0.866, y: 0.5 }, { el: 'F', x: -0.866, y: 0.5 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -100.3, meltingPoint: -126.8, molarMass: 67.82,
  },
  {
    key: 'SF6', formula: 'SF₆', name: 'Hexafluoreto de Enxofre',
    // Octaédrico e simétrico → apolar, apesar das ligações S-F muito
    // polares. É a maior/mais pesada molécula apolar desta biblioteca
    // (146 g/mol) — por isso ferve mais alto (−68°C) que o HCl (−85°C),
    // que é polar! Tamanho pode pesar mais que o TIPO de força.
    atoms: [
      { el: 'S', x: 0, y: 0 }, { el: 'F', x: 0, y: -1.1 }, { el: 'F', x: 0, y: 1.1 },
      { el: 'F', x: -1.1, y: 0 }, { el: 'F', x: 1.1, y: 0 },
      { el: 'F', x: -0.78, y: -0.78 }, { el: 'F', x: 0.78, y: 0.78 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 }, { a: 0, b: 5, order: 1 }, { a: 0, b: 6, order: 1 },
    ],
    // CASO ESPECIAL, igual ao CO₂: a 1 atm o SF₆ também SUBLIMA — vai
    // direto de sólido pra gás (por isso é usado como "efeito especial"
    // de fumaça em experimentos de física, parecido com gelo-seco).
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -68.3, meltingPoint: -50.8, sublima: true, molarMass: 146.06,
  },
  {
    key: 'CS2', formula: 'CS₂', name: 'Dissulfeto de Carbono',
    // Linear e simétrico, igual ao CO₂ — mas o enxofre é um átomo bem
    // maior e mais polarizável que o oxigênio. Resultado: mesma
    // geometria e mesma força (London), mas ferve a 46°C — bem mais
    // alto que os −78,5°C do CO₂.
    atoms: [{ el: 'S', x: -1.1, y: 0 }, { el: 'C', x: 0, y: 0 }, { el: 'S', x: 1.1, y: 0 }],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 2 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    // polaridade 0,3 é uma ESTIMATIVA (CS₂ não está na tabela original
    // de Snyder) — apolar por simetria, como o CCl₄ e o hexano.
    boilingPoint: 46.3, meltingPoint: -111.6, molarMass: 76.14, density: 1.29, polaridade: 0.3,
  },
  {
    key: 'Kr', formula: 'Kr', name: 'Criptônio',
    atoms: [{ el: 'Kr', x: 0, y: 0 }],
    bonds: [],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -153.4, meltingPoint: -157.4, molarMass: 83.80,
  },
  {
    key: 'Xe', formula: 'Xe', name: 'Xenônio',
    // Fecha a série dos gases nobres monoatômicos (He, Ne, Ar, Kr, Xe):
    // quanto maior o átomo, mais fraco... não, mais FORTE o London
    // (mais elétrons, mais polarizável) — por isso o ponto de ebulição
    // sobe nessa ordem, mesmo todos sendo apolares.
    atoms: [{ el: 'Xe', x: 0, y: 0 }],
    bonds: [],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: -108.1, meltingPoint: -111.8, molarMass: 131.29,
  },

  /* ═══════════════════════════════════════════════════════════════
     A PARTIR DAQUI: substâncias adicionadas para o MÓDULO 3
     (Laboratório de Solubilidade) — "Água", "CH3OH" e todas as
     outras acima continuam disponíveis pra ele também (ele reusa
     a mesma lista); estas 5 são as que faltavam: os reagentes
     específicos pedidos na especificação (Álcool Etílico, Iodo
     sólido, Sal de cozinha, e um "Óleo" simplificado), mais o
     Hexano, necessário pro "Desafio do Iodo" (dissolve em apolar,
     não em água). Ganham um campo NOVO, `density` (g/mL, a 20°C) —
     é o dado central do Módulo 3, decide quem flutua sobre quem
     quando duas substâncias não se misturam.
     ═══════════════════════════════════════════════════════════════ */
  {
    key: 'C2H5OH', formula: 'C₂H₅OH', name: 'Álcool Etílico',
    // CH3-CH2-OH — mesma ideia do metanol (hidroxila faz ligação de
    // hidrogênio), só com mais um carbono na cadeia. É por isso que
    // etanol se mistura em água em qualquer proporção (a hidroxila
    // "conversa" com a água por ligação de hidrogênio, apesar da
    // caudinha apolar CH₃-CH₂- não fazer isso sozinha).
    atoms: [
      { el: 'C', x: -1.8, y: -0.3 },
      { el: 'C', x: -0.8, y: 0.3 },
      { el: 'O', x: 0.3, y: -0.2 },
      { el: 'H', x: 1.0, y: 0.4 },
      { el: 'H', x: -2.6, y: 0.3 },
      { el: 'H', x: -2.6, y: -0.7 },
      { el: 'H', x: -1.6, y: -1.2 },
      { el: 'H', x: -0.9, y: 1.25 },
      { el: 'H', x: -0.3, y: 0.9 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }, { a: 2, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 }, { a: 0, b: 5, order: 1 }, { a: 0, b: 6, order: 1 },
      { a: 1, b: 7, order: 1 }, { a: 1, b: 8, order: 1 },
    ],
    // Só o H da hidroxila (índice 3) é polo — mesma lógica do metanol.
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [3], poloNegativo: [2],
    boilingPoint: 78.37, meltingPoint: -114.1, molarMass: 46.07, density: 0.789, polaridade: 4.3,
  },
  {
    key: 'C6H14', formula: 'C₆H₁₄', name: 'Hexano',
    // Cadeia de 6 carbonos, toda apolar (só C-H e C-C, ΔEN quase
    // zero) — o solvente clássico "gosta de gordura" dos laboratórios
    // (dissolve substâncias apolares, não dissolve em água). Os
    // hidrogênios do MEIO da cadeia foram omitidos de propósito (só
    // os das pontas aparecem) — o que importa aqui é a FORMA alongada
    // e apolar, não desenhar cada um dos 14 hidrogênios reais.
    atoms: [
      { el: 'C', x: -2.5, y: 0.3 },
      { el: 'C', x: -1.8, y: -0.3 },
      { el: 'C', x: -1.1, y: 0.3 },
      { el: 'C', x: -0.4, y: -0.3 },
      { el: 'C', x: 0.3, y: 0.3 },
      { el: 'C', x: 1.0, y: -0.3 },
      { el: 'H', x: -3.2, y: 0.7 }, { el: 'H', x: -3.0, y: -0.3 },
      { el: 'H', x: 1.7, y: 0.1 }, { el: 'H', x: 1.3, y: -1.0 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }, { a: 2, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 }, { a: 4, b: 5, order: 1 },
      { a: 0, b: 6, order: 1 }, { a: 0, b: 7, order: 1 },
      { a: 5, b: 8, order: 1 }, { a: 5, b: 9, order: 1 },
    ],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: 68.9, meltingPoint: -95, molarMass: 86.18, density: 0.66, polaridade: 0.1,
  },
  {
    key: 'I2', formula: 'I₂', name: 'Iodo',
    // Diatômica e simétrica, igual ao Cl₂/Br₂/F₂ — sem polo nenhum,
    // só London. A diferença: é SÓLIDA à temperatura ambiente (funde
    // só a 113,7°C), é por isso que a especificação pede "iodo
    // sólido" — um cristal de verdade pra tentar dissolver.
    atoms: [
      { el: 'I', x: -0.7, y: 0 },
      { el: 'I', x: 0.7, y: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    boilingPoint: 184.3, meltingPoint: 113.7, molarMass: 253.81, density: 4.94, polaridade: 0,
  },
  {
    key: 'NaCl', formula: 'NaCl', name: 'Sal de Cozinha',
    // CASO ESPECIAL — `ionico: true`. Sal não é uma molécula COVALENTE
    // como todo o resto desta lista: é uma rede cristalina de íons
    // Na⁺ e Cl⁻ se atraindo eletricamente. Aqui, os dois "átomos"
    // representam simplificadamente UM par iônico (a unidade repetida
    // do cristal), não uma ligação covalente de verdade — não tem
    // par de elétrons compartilhado. Ao dissolver em água, o motor de
    // física do Módulo 3 trata isso de um jeito diferente de todo o
    // resto: os dois íons se SEPARAM (cada um vira uma partícula
    // independente, cercada por moléculas de água — hidratação), em
    // vez de continuarem grudados como uma molécula covalente faria.
    // `apenasModulo3: true` — não aparece na Biblioteca (Módulo 1) nem
    // no Termostato (Módulo 2): os dois modelam explicitamente forças
    // INTERMOLECULARES entre moléculas COVALENTES; ligação iônica é
    // um paradigma diferente, fora do escopo deles (colocar o sal no
    // sandbox do Módulo 1, por exemplo, faria a física tratar "Na-Cl"
    // como se fosse uma molécula London comum, o que é conceitualmente
    // errado — não é assim que um cristal iônico se comporta).
    atoms: [
      { el: 'Na', x: -0.8, y: 0 },
      { el: 'Cl', x: 0.8, y: 0 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }],
    // `polaridade: 10` — ACIMA até da água. Compostos iônicos ficam de
    // fora da escala de Snyder (ela mede solventes MOLECULARES); um
    // valor alto de propósito captura que a atração íon-dipolo com um
    // solvente polar é ainda mais forte que a atração dipolo-dipolo
    // entre duas moléculas polares comuns — é por isso que sal dissolve
    // tão bem em água quanto (ou melhor que) qualquer álcool dissolve.
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [], ionico: true,
    boilingPoint: 1413, meltingPoint: 800.7, molarMass: 58.44, density: 2.17, polaridade: 10, apenasModulo3: true,
  },
  {
    key: 'Oleo', formula: '(C₁₇H₃₃COO)₃C₃H₅', name: 'Óleo de Soja',
    // SIMPLIFICAÇÃO DELIBERADA — um óleo de verdade é um triglicerídeo
    // (3 cadeias de ácido graxo compridas presas a um glicerol), grande
    // e complexo demais pra desenhar átomo por átomo com clareza numa
    // ficha pequena. Aqui ele é representado só como UMA cadeia
    // hidrocarbônica longa e apolar (mais longa que o hexano) — o que
    // importa pra lição deste módulo é justamente isso: uma molécula
    // GRANDE, toda apolar, sem nenhum grupo que faça ligação de
    // hidrogênio com a água. A fórmula mostrada é a de um triglicerídeo
    // típico (ácido oleico ×3 + glicerol), só de referência.
    atoms: [
      { el: 'C', x: -3.2, y: 0.3 }, { el: 'C', x: -2.5, y: -0.3 },
      { el: 'C', x: -1.8, y: 0.3 }, { el: 'C', x: -1.1, y: -0.3 },
      { el: 'C', x: -0.4, y: 0.3 }, { el: 'C', x: 0.3, y: -0.3 },
      { el: 'C', x: 1.0, y: 0.3 }, { el: 'C', x: 1.7, y: -0.3 },
      { el: 'H', x: -3.9, y: 0.7 }, { el: 'H', x: -3.7, y: -0.3 },
      { el: 'H', x: 2.4, y: 0.1 }, { el: 'H', x: 2.0, y: -1.0 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }, { a: 2, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 }, { a: 4, b: 5, order: 1 }, { a: 5, b: 6, order: 1 },
      { a: 6, b: 7, order: 1 },
      { a: 0, b: 8, order: 1 }, { a: 0, b: 9, order: 1 },
      { a: 7, b: 10, order: 1 }, { a: 7, b: 11, order: 1 },
    ],
    polar: false, dominantForce: 'london', poloPositivo: [], poloNegativo: [],
    // Óleo de verdade é uma MISTURA (sem ponto de fusão/ebulição
    // único e nítido) — por isso não tem boilingPoint/meltingPoint
    // aqui. `apenasModulo3: true` — pelo mesmo motivo, não aparece no
    // Termostato (Módulo 2), que PRECISA desses dois valores reais
    // pra decidir quando a substância muda de estado; sem eles, o
    // Termostato não teria como funcionar direito com este composto.
    molarMass: 885, density: 0.917, polaridade: 0.2, apenasModulo3: true,
  },

  /* ═══════════════════ MAIS 5 SUBSTÂNCIAS NOVAS PARA O MÓDULO 3 ═══════════════════
     Expandindo a prateleira além dos 6 reagentes originais da
     especificação — todas com `polaridade` (índice de Snyder) e
     `density` reais, pesquisados na literatura (ver seção 7.1/7.7 do
     ARQUITETURA-SIFI.md pra a lista completa de fontes). */
  {
    key: 'C3H6O', formula: 'C₃H₆O', name: 'Acetona',
    // (CH₃)₂C=O — o solvente polar mais versátil de laboratório: tem
    // uma carbonila bem polar (aceita ligação de hidrogênio de quem
    // tiver H disponível, mesmo sem ter H pra DOAR ela mesma), o que
    // explica por que se mistura tanto com água quanto com muitos
    // solventes apolares — um "meio-termo" que a regra simples de
    // "polar vs apolar" não capturava bem (é um dos motivos de ter
    // trocado pra um índice de polaridade contínuo).
    atoms: [
      { el: 'C', x: 0, y: 0.3 },
      { el: 'O', x: 0, y: 1.5 },
      { el: 'C', x: -1.1, y: -0.35 },
      { el: 'C', x: 1.1, y: -0.35 },
      { el: 'H', x: -1.8, y: 0.15 },
      { el: 'H', x: -1.3, y: -1.15 },
      { el: 'H', x: 1.8, y: 0.15 },
      { el: 'H', x: 1.3, y: -1.15 },
    ],
    bonds: [
      { a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 },
      { a: 2, b: 4, order: 1 }, { a: 2, b: 5, order: 1 },
      { a: 3, b: 6, order: 1 }, { a: 3, b: 7, order: 1 },
    ],
    // Carbono da carbonila (índice 0) fica δ+, oxigênio (índice 1) δ−
    // — sem H na carbonila, então não é ligação de hidrogênio (regra
    // FON), só dipolo-dipolo, mesma classificação do acetaldeído.
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [1],
    boilingPoint: 56.2, meltingPoint: -94.8, molarMass: 58.08, density: 0.79, polaridade: 5.1,
  },
  {
    key: 'CH3COOH', formula: 'CH₃COOH', name: 'Ácido Acético',
    // O ácido do vinagre — CH₃-COOH. Mesma família do ácido fórmico
    // (também dimeriza por duas ligações de hidrogênio ao mesmo
    // tempo), só com uma metila a mais na cadeia.
    atoms: [
      { el: 'C', x: -1.3, y: 0.2 },
      { el: 'C', x: -0.2, y: -0.3 },
      { el: 'O', x: -0.4, y: -1.4 },
      { el: 'O', x: 0.9, y: 0.1 },
      { el: 'H', x: 1.6, y: -0.5 },
      { el: 'H', x: -1.9, y: 0.9 },
      { el: 'H', x: -2.0, y: -0.4 },
      { el: 'H', x: -0.7, y: 1.0 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 2 }, { a: 1, b: 3, order: 1 },
      { a: 3, b: 4, order: 1 },
      { a: 0, b: 5, order: 1 }, { a: 0, b: 6, order: 1 }, { a: 0, b: 7, order: 1 },
    ],
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [4], poloNegativo: [2],
    // polaridade 6,2 é uma ESTIMATIVA (ácido acético não está na tabela
    // original de Snyder) — posicionada perto do ácido fórmico e dos
    // álcoois em cartas de polaridade de solventes de laboratório.
    boilingPoint: 117.9, meltingPoint: 16.6, molarMass: 60.05, density: 1.049, polaridade: 6.2,
  },
  {
    key: 'C3H8O3', formula: 'C₃H₈O₃', name: 'Glicerina',
    // HOCH₂-CHOH-CH₂OH — TRÊS hidroxilas na mesma molécula (contra
    // uma só do etanol/metanol). É por isso que ferve a 290°C (quase
    // 4× mais alto que o etanol!) e é tão viscosa: cada molécula pode
    // fazer ligação de hidrogênio com várias vizinhas ao mesmo tempo,
    // não só uma. Simplificação: 2 dos 5 hidrogênios ligados a carbono
    // foram omitidos (mesmo espírito do hexano) — o que importa aqui
    // são as 3 hidroxilas, bem visíveis.
    atoms: [
      { el: 'C', x: -1.6, y: -0.2 },
      { el: 'C', x: -0.5, y: 0.4 },
      { el: 'C', x: 0.6, y: -0.2 },
      { el: 'O', x: -2.5, y: 0.4 },
      { el: 'H', x: -3.2, y: -0.1 },
      { el: 'O', x: -0.5, y: 1.5 },
      { el: 'H', x: 0.3, y: 2.0 },
      { el: 'O', x: 1.5, y: 0.4 },
      { el: 'H', x: 2.2, y: -0.1 },
      { el: 'H', x: -1.9, y: -1.2 },
      { el: 'H', x: 0.9, y: -1.2 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 }, { a: 3, b: 4, order: 1 },
      { a: 1, b: 5, order: 1 }, { a: 5, b: 6, order: 1 },
      { a: 2, b: 7, order: 1 }, { a: 7, b: 8, order: 1 },
      { a: 0, b: 9, order: 1 }, { a: 2, b: 10, order: 1 },
    ],
    // As TRÊS hidroxilas viram 3 pares de polos — visualmente mostra
    // por que a glicerina forma tantas ligações de hidrogênio de vez.
    polar: true, dominantForce: 'hydrogen-bond', poloPositivo: [4, 6, 8], poloNegativo: [3, 5, 7],
    boilingPoint: 290, meltingPoint: 17.9, molarMass: 92.09, density: 1.261, polaridade: 7.5,
  },
  {
    key: 'CHCl3', formula: 'CHCl₃', name: 'Clorofórmio',
    // 1 hidrogênio e 3 cloros no mesmo carbono — os 3 dipolos C-Cl não
    // se cancelam (sobra o H "desemparelhado"), então é polar. MAS,
    // sem H ligado a um O/N/F, não faz ligação de hidrogênio — só
    // dipolo-dipolo, apesar de ΔEN alto. Nota histórica: é um caso
    // real onde a regra simples de polaridade não conta a história
    // toda — apesar de "polar" (índice 4,1), clorofórmio se comporta
    // de um jeito bem mais parecido com um solvente apolar na prática
    // (quase não se mistura com água) — um limite conhecido do modelo
    // simplificado deste simulador, registrado aqui de propósito.
    atoms: [
      { el: 'C', x: 0, y: 0.2 },
      { el: 'H', x: 0, y: -1.0 },
      { el: 'Cl', x: -1.1, y: 0.7 },
      { el: 'Cl', x: 1.1, y: 0.7 },
      { el: 'Cl', x: 0, y: 1.5 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 },
    ],
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [0], poloNegativo: [2, 3, 4],
    boilingPoint: 61.2, meltingPoint: -63.5, molarMass: 119.38, density: 1.489, polaridade: 4.1,
  },
  {
    key: 'C4H10O', formula: 'C₄H₁₀O', name: 'Éter Etílico',
    // CH₃-CH₂-O-CH₂-CH₃ — o clássico solvente orgânico "fracamente
    // polar" (índice 2,8, bem abaixo do álcool que o originou). O
    // oxigênio não tem H pra doar ligação de hidrogênio (só pode
    // ACEITAR), por isso dissolve tanto substâncias um pouco polares
    // quanto bem apolares — outro bom exemplo de "meio-termo" na
    // escala contínua de polaridade.
    atoms: [
      { el: 'C', x: -2.3, y: -0.3 },
      { el: 'C', x: -1.2, y: 0.3 },
      { el: 'O', x: 0, y: -0.2 },
      { el: 'C', x: 1.2, y: 0.3 },
      { el: 'C', x: 2.3, y: -0.3 },
      { el: 'H', x: -3.0, y: 0.2 },
      { el: 'H', x: -2.6, y: -1.1 },
      { el: 'H', x: 3.0, y: 0.2 },
      { el: 'H', x: 2.6, y: -1.1 },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }, { a: 2, b: 3, order: 1 }, { a: 3, b: 4, order: 1 },
      { a: 0, b: 5, order: 1 }, { a: 0, b: 6, order: 1 },
      { a: 4, b: 7, order: 1 }, { a: 4, b: 8, order: 1 },
    ],
    polar: true, dominantForce: 'dipole-dipole', poloPositivo: [1, 3], poloNegativo: [2],
    boilingPoint: 34.5, meltingPoint: -116.3, molarMass: 74.12, density: 0.713, polaridade: 2.8,
  },
];
