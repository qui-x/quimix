/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: experimentos.js
   ───────────────────────────────────────────────────────────────
   Os desafios socráticos do módulo Nomenclatura: para cada composto
   prioritário, uma pergunta-guia e dicas progressivas que ajudam o
   aluno a deduzir o nome IUPAC antes de revelar a resposta.
   Depende de: nada. Usado por: js/nomenclatura/desafio.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   EXPERIMENTOS DIDÁTICOS — 4 famílias de reações
═══════════════════════════════════════════════════════════════ */
var EXPERIMENTOS_SIQI = [

  /* ────────────────────────────────────────────────────────────
     EXP 1 — SÍNTESE / ADIÇÃO
     CaO(s) + H₂O(l) → Ca(OH)₂(s)
     Mecanismo: O²⁻ captura 2H⁺ da água → 2OH⁻ → liga com Ca²⁺
  ──────────────────────────────────────────────────────────── */
  {
    id: 1,
    icon: 'flame',
    familia: 'Síntese / Adição',
    titulo: 'CaO + H₂O',
    descricao: 'Cal viva + água',
    reagentes: ['CaO', 'H₂O'],
    condicao: '',
    produtos_visuais: ['Ca(OH)₂'],
    coefR: { 'CaO': 1, 'H₂O': 1 },
    coefP: [1],

    /* 8 candidatos: 1 correto + 7 distratores plausíveis */
    candidatos: [
      'Ca(OH)₂',  /* ✓ CORRETO */
      'CaCO₃',    /* distrator: contém Ca mas exige CO₂ */
      'CaO',      /* distrator: reagente, não produto */
      'CO₂',      /* distrator: gás de outra reação */
      'H₂',       /* distrator: gás de deslocamento */
      'HCl',      /* distrator: ácido não relacionado */
      'Ca(NO₃)₂', /* distrator: sal com NO₃ */
      'Na₂O',     /* distrator: outro óxido básico */
    ],

    gabarito: {
      produtos: [
        'ca(oh)2','hidroxido de calcio','hidróxido de cálcio',
        'cal hidratada','cal apagada','cal extinta',
      ],
      equacaoBalanceada: 'CaO(s) + H₂O(l) → Ca(OH)₂(s)',
    },

    hints: [
      'O²⁻ (do CaO) é uma base fortíssima — captura H⁺ da água. O que se forma quando O²⁻ reage com H₂O?',
      'O²⁻ + H₂O → 2 OH⁻. O Ca²⁺ que ficou livre combina com esses OH⁻. Qual é a fórmula?',
      'Ca²⁺ + 2 OH⁻ → Ca(OH)₂. Verifique os coeficientes: 1 CaO + 1 H₂O → 1 Ca(OH)₂ ✓',
    ],
    explicacao: 'O²⁻ + H₂O → 2OH⁻  ·  Ca²⁺ + 2OH⁻ → Ca(OH)₂(s)  ·  ΔH = −63,7 kJ/mol',
    proxExp: 2,
  },

  /* ────────────────────────────────────────────────────────────
     EXP 2 — DECOMPOSIÇÃO / ANÁLISE
     CaCO₃(s) →(Δ 900°C)→ CaO(s) + CO₂(g)
     Mecanismo: energia térmica fragmenta CO₃²⁻ → CO₂ + O²⁻
  ──────────────────────────────────────────────────────────── */
  {
    id: 2,
    icon: 'thermometer',
    familia: 'Decomposição / Análise',
    titulo: 'CaCO₃ →(Δ)→ ?',
    descricao: 'Calcinação do calcário',
    reagentes: ['CaCO₃'],
    condicao: 'Δ 900°C',
    produtos_visuais: ['CaO', 'CO₂'],
    coefR: { 'CaCO₃': 1 },
    coefP: [1, 1],

    candidatos: [
      'CaO',       /* ✓ CORRETO */
      'CO₂',       /* ✓ CORRETO */
      'Ca(OH)₂',   /* distrator: hidratado, não é produto da calcinação */
      'CaCl₂',     /* distrator: sal de Cl, não há Cl na reação */
      'O₂',        /* distrator: gás mas não é o produto */
      'H₂O',       /* distrator: outra reação de CaO */
      'Ca(NO₃)₂',  /* distrator: sal com N */
      'CO',        /* distrator: monóxido em vez de dióxido */
    ],

    gabarito: {
      produtos: [
        'cao','co2','oxido de calcio','óxido de cálcio',
        'dioxido de carbono','dióxido de carbono',
      ],
      equacaoBalanceada: 'CaCO₃(s) →(Δ)→ CaO(s) + CO₂(g)',
    },

    hints: [
      'CO₃²⁻ se fragmenta com calor intenso. O carbono sai como gás levando oxigênio. Que gás de carbono é formado?',
      'CO₂ sai como gás (por isso o sólido perde massa). O Ca²⁺ fica com o O²⁻ restante. O que Ca²⁺ + O²⁻ forma?',
      'CaCO₃ tem 1 Ca, 1 C, 3 O. Verifique: CaO(1O) + CO₂(2O) = 3O ✓. Balanceado com coef. 1:1:1.',
    ],
    explicacao: 'CO₃²⁻ →(Δ)→ CO₂↑ + O²⁻  ·  Ca²⁺ + O²⁻ → CaO  ·  Calcinação industrial do calcário',
    proxExp: 3,
  },

  /* ────────────────────────────────────────────────────────────
     EXP 3 — SIMPLES TROCA / DESLOCAMENTO
     Zn(s) + 2 HCl(aq) → ZnCl₂(aq) + H₂(g)
     Mecanismo: Zn > H na fila → Zn→Zn²⁺+2e⁻ / 2H⁺+2e⁻→H₂
  ──────────────────────────────────────────────────────────── */
  {
    id: 3,
    icon: 'bolt',
    familia: 'Simples Troca / Deslocamento',
    titulo: 'Zn + HCl',
    descricao: 'Metal em ácido — cuidado com o gás!',
    reagentes: ['Zn', 'HCl'],
    condicao: '',
    produtos_visuais: ['ZnCl₂', 'H₂'],
    coefR: { 'Zn': 1, 'HCl': 2 },
    coefP: [1, 1],

    candidatos: [
      'ZnCl₂',  /* ✓ CORRETO */
      'H₂',     /* ✓ CORRETO */
      'ZnO',    /* distrator: óxido, sem Cl */
      'ZnSO₄',  /* distrator: sulfato, sem Cl */
      'NaCl',   /* distrator: sal de Na, não de Zn */
      'H₂O',    /* distrator: água — não é produto aqui */
      'FeCl₂',  /* distrator: sal de Fe, não de Zn */
      'HCl',    /* distrator: reagente, não produto */
    ],

    gabarito: {
      produtos: [
        'zncl2','h2','cloreto de zinco','hidrogênio',
        'gas hidrogenio','gás hidrogênio',
      ],
      equacaoBalanceada: 'Zn(s) + 2 HCl(aq) → ZnCl₂(aq) + H₂(g)',
    },

    hints: [
      'Zn é mais reativo que H. Zn perde 2 elétrons (Zn → Zn²⁺). Quantos H⁺ recebem esses 2 elétrons?',
      '2 H⁺ + 2e⁻ → H₂↑ (gás que explode). Zn²⁺ fica na solução com Cl⁻. Qual é o sal formado?',
      'Coef HCl = 2 (para 2H⁺ e 2Cl⁻). Confira: Zn=1✓ Cl=2✓ H=2✓.',
    ],
    explicacao: 'Zn→Zn²⁺+2e⁻ (oxidação)  ·  2H⁺+2e⁻→H₂↑ (redução)  ·  Zn desloca H — oxirredução',
    proxExp: 4,
  },

  /* ────────────────────────────────────────────────────────────
     EXP 4 — DUPLA TROCA / NEUTRALIZAÇÃO
     HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)
     Mecanismo: H⁺ + OH⁻ → H₂O (força motriz 497 kJ/mol)
               Na⁺ e Cl⁻ são íons espectadores
  ──────────────────────────────────────────────────────────── */
  {
    id: 4,
    icon: 'flask',
    familia: 'Dupla Troca / Neutralização',
    titulo: 'HCl + NaOH',
    descricao: 'Titulação ácido-base com fenolftaleína',
    reagentes: ['HCl', 'NaOH'],
    condicao: '',
    produtos_visuais: ['NaCl', 'H₂O'],
    coefR: { 'HCl': 1, 'NaOH': 1 },
    coefP: [1, 1],

    candidatos: [
      'NaCl',    /* ✓ CORRETO */
      'H₂O',    /* ✓ CORRETO */
      'Na₂SO₄', /* distrator: sulfato, sem Cl */
      'Na₂CO₃', /* distrator: carbonato — outra reação */
      'NaHCO₃', /* distrator: bicarbonato */
      'HNO₃',   /* distrator: ácido — reagente, não produto */
      'Ca(OH)₂',/* distrator: outra base */
      'CO₂',    /* distrator: gás de outra reação */
    ],

    gabarito: {
      produtos: [
        'nacl','h2o','cloreto de sodio','agua','água',
        'cloreto de sódio',
      ],
      equacaoBalanceada: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)',
    },

    hints: [
      'Na solução há 4 íons: H⁺, Cl⁻, Na⁺, OH⁻. H⁺ + OH⁻ → H₂O (força motriz). O que sobra?',
      'Na⁺ e Cl⁻ são íons espectadores — ficam em solução. Juntos formam qual sal?',
      'HCl : NaOH = 1:1. Coef. todos 1. Confira: Na=1✓ Cl=1✓ H=2✓ O=1✓.',
    ],
    explicacao: 'H⁺+OH⁻→H₂O (497kJ/mol)  ·  Na⁺+Cl⁻→NaCl(aq) (espectadores)  ·  pH=7 no ponto de equivalência',
    proxExp: null,
  },
];

