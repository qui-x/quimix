/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (geometria molecular VSEPR)
   ARQUIVO: vsepr.js
   ───────────────────────────────────────────────────────────────
   Teoria VSEPR (Valence Shell Electron Pair Repulsion) quantitativa:
   o ângulo de ligação previsto não é só o valor "ideal" da geometria
   eletrônica — é corrigido por pares solitários (Gillespie-Nyholm),
   eletronegatividade do átomo central e dos ligantes (regra de
   Bent), período do átomo central e ordem de ligação. Fontes:
   Gillespie & Nyholm (1957), Bent (1961), LibreTexts, NIST.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, data/pares-isolados.js,
               data/eletronegatividade.js, data/periodos.js.
   Usado por: js/render/wedge-linhas.js, js/init/controles-fisica.js
              (snap literatura), js/init/visualizacao-3d-reset.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     6. VSEPR — GEOMETRIA MOLECULAR SEGUNDO A LITERATURA
     =====================================================================
     Teoria VSEPR (Valence Shell Electron Pair Repulsion):
     os pares de elétrons (ligantes + solitários) ao redor de um átomo
     central se repelem e assumem a geometria que maximiza a separação.

     Ângulos de referência (graus) por geometria:
       linear          2 grupos → 180°
       angular (bent)  2 ligantes + 1 par sol. (como H₂O, SO₂) → 104,5°
       angular         2 ligantes + 2 pares sol. (como H₂S, OF₂) → 92-104°
       trigonal planar 3 grupos → 120°
       piramidal trig. 3 lig. + 1 par sol. (como NH₃, PCl₃) → 107°
       tetraédrico     4 grupos → 109,5°
       trigonal bip.   5 grupos → 90°/120°
       octaédrico      6 grupos → 90°

     O motor aplica:
       (A) Força de mola radial entre átomos ligados → comprimento correto
       (B) Força angular entre todos os pares de ligantes de um mesmo
           átomo central → empurra para o ângulo VSEPR alvo
       (C) Repulsão de núcleo entre átomos não ligados
       (D) VdW fraco além do alcance de repulsão
     =================================================================== */

  /* --- Tabela VSEPR: quantos pares solitários tem cada elemento ---
     lonePairs = elétrons não ligantes / 2, considerando o número de
     ligações já formadas. Aqui usamos o valor máximo para o estado livre
     (sem ligações), ajustado dinamicamente na função getVSEPR.         */
  /* LONE_PAIRS_FREE: movido para dadossilq.js (carregado antes deste arquivo) */

  /* Retorna o ângulo alvo (rad) entre dois ligantes de um átomo central,
     baseado na geometria VSEPR real descrita na literatura.
     nBonds = número de ligações covalentes do átomo central
     nLone  = número de pares solitários                              */
  /* ===================================================================
     VSEPR QUANTITATIVO — ângulo de ligação baseado em:
     ───────────────────────────────────────────────────────────────────
     1. ÂNGULO IDEAL (geometria eletrônica):
        Determinado pelo número total de domínios (nBonds + nLone):
          2 → 180°, 3 → 120°, 4 → 109,5°, 5 → 120°/90°, 6 → 90°

     2. COMPRESSÃO POR PARES SOLITÁRIOS (VSEPR Gillespie-Nyholm):
        Cada par solitário comprime o ângulo bp–bp porque ocupa mais
        espaço que um par ligante (lp–lp > lp–bp > bp–bp).
        Compressão experimental: ~2,5° por par solitário no grupo 4,
        maior no grupo 3 (ressonância), menor no grupo 5+.

     3. CORREÇÃO POR ELETRONEGATIVIDADE DO ÁTOMO CENTRAL (Regra de Bent):
        Central mais eletronegativo → pares ligantes têm mais p-character
        → ângulo menor. Central menos eletronegativo → mais s-character
        nos ligantes → ângulo maior.
        Ex: H₂O (O, EN=3,44): 104,5°  vs  H₂S (S, EN=2,58): 92,1°
            NH₃ (N, EN=3,04): 107,8°  vs  PH₃ (P, EN=2,19): 93,5°

     4. CORREÇÃO POR ELETRONEGATIVIDADE DOS LIGANTES (Bent's rule):
        Ligantes mais eletronegativos atraem mais densidade eletrônica,
        aumentando o p-character do orbital ligante → reduz ângulo.
        Ex: NF₃ (F, EN=3,98): 102,2°  vs  NI₃ (I, EN=2,66): ~112°

     5. CORREÇÃO POR PERÍODO DO ÁTOMO CENTRAL:
        Elementos do período 3+ (P, S, Cl…) têm orbitais mais difusos,
        pares solitários menos localizados → compressão menor que 2°/lp.
        Ex: PH₃ 93,5° (P, período 3) vs NH₃ 107,8° (N, período 2)

     6. CORREÇÃO POR ORDEM DE LIGAÇÃO:
        Ligações duplas/triplas são "fatter" (maior repulsão bp–bp),
        aumentam o ângulo entre si: ex SO₂ (duplas) = 119,5° > 104,5°.
     ===================================================================
     Fontes: Gillespie & Nyholm (1957), Bent (1961), LibreTexts, NIST
     =================================================================== */

  /* Tabela de eletronegatividade de Pauling por elemento */
  /* EN_PAULING: movido para dadossilq.js (carregado antes deste arquivo) */

  /* Períodos dos elementos (1–7) */
  /* PERIOD_OF: movido para dadossilq.js (carregado antes deste arquivo) */

  /**
   * Retorna o ângulo de ligação em radianos para o átomo central dado,
   * considerando os efeitos quantitativos acima.
   *
   * @param {string}   centralSym  - símbolo do elemento central (ex: 'O')
   * @param {string[]} ligandSyms  - símbolos dos ligantes (ex: ['H','H'])
   * @param {number}   nBonds      - número de ligações covalentes do central
   * @param {number}   nLone       - número de pares solitários do central
   * @param {number}   avgBondOrder- ordem média das ligações (1=simples, 2=dupla)
   */
  SILQ.vsepAngleForElement = function vsepAngleForElement(centralSym, ligandSyms, nBonds, nLone, avgBondOrder = 1) {
    const total = nBonds + nLone;
    // Ângulo ideal da geometria eletrônica (VSEPR base)
    let idealDeg;
    if      (total <= 2) idealDeg = 180;
    else if (total === 3) idealDeg = 120;
    else if (total === 4) idealDeg = 109.5;
    else if (total === 5) idealDeg = 120;
    else                  idealDeg = 90;
    if (nBonds < 2) return (idealDeg * Math.PI) / 180;

    const enCen     = EN_PAULING[centralSym] || 2.5;
    const periodCen = PERIOD_OF[centralSym]  || 2;

    /* ── Compressão por pares solitários ─────────────────────────────
       Período 2 (N,O,F): pares em 2s/2p localizados → VSEPR clássico.
       Período 3+ (P,S,As…): pares solitários usam orbitais quase puros-p.
       O ângulo entre orbitais-p puros é 90°. A fração α = quanto o
       ângulo se aproxima de 90° é calibrada por (total, período, nLone):
         AX₂E₁ (total=3, sp2 p3): SO₂ tipo, lp moderado → α=0.13
         AX₃E₁ (total=4, sp3 p3): PH₃, PCl₃ → α≈0.88
         AX₂E₂ (total=4, sp3 p3): H₂S, H₂Se → α≈0.60
         AX₃E₁ (total=4, sp3 p4+): AsH₃ → α≈0.91
    ────────────────────────────────────────────────────────────────── */
    let lonePairCompression;
    if (periodCen <= 2) {
      // Período 2: VSEPR clássico
      if (total === 3 && nLone >= 1) {
        lonePairCompression = nLone * 15.5; // sp2 angular: 120→104.5°
      } else {
        lonePairCompression = nLone * 2.5;  // ~2.5°/lp
      }
    } else {
      // Período 3+: modelo de convergência para 90° (orbitais-p puros)
      // α_table[total][nLone][period3/4+]
      /* Alpha = fração de convergência para 90° (orbital-p puro).
         Calibrado por: período do central + EN média dos ligantes.
         Ligantes pesados (Cl,Br,I) têm efeito moderador (ligação mais
         longa → menos pressão sobre os pares solitários).
         Ligantes leves (H) deixam os pares solitários mais comprimidos.
         nLone=0 → sem compressão (sem pares solitários).              */
      if (nLone === 0) {
        lonePairCompression = 0;
      } else {
        // EN média dos ligantes (H=2.20 é o mais leve/menos eletroneg.)
        const avgLigENForAlpha = ligandSyms.length > 0
          ? ligandSyms.reduce((s, sym) => s + (EN_PAULING[sym] || 2.5), 0) / ligandSyms.length
          : 2.20;
        // Ligantes mais pesados/eletroneg. reduzem alpha (menos compressão dos pares)
        const ligFactor = Math.max(0.5, 1.0 - (avgLigENForAlpha - 2.20) * 0.18);
        // Alpha base por (total, nLone, período)
        const alphaBase = {
          3: { 1: [0.13, 0.15], 2: [0.30, 0.35] },
          4: { 1: [0.88, 0.91], 2: [0.62, 0.70] },
          5: { 1: [0.32, 0.38], 2: [0.58, 0.65] },
        };
        const pi = periodCen <= 3 ? 0 : 1;
        const alphaArr = (alphaBase[total] || {})[nLone] || [0.45, 0.55];
        const alpha = Math.min(0.95, alphaArr[pi] * ligFactor);
        const target = idealDeg * (1 - alpha) + 90 * alpha;
        lonePairCompression = idealDeg - target;
      }
    }

    /* Correção pela EN do átomo central (Bent's rule).
       Período 2: (EN-2.5) × 1.8 graus. Período 3+: efeito menor. */
    const enFactor  = periodCen <= 2 ? 1.8 : 0.7;
    const enCenCorr = (enCen - 2.5) * enFactor;

    /* Correção pela EN dos ligantes (Bent's rule). */
    const avgLigEN = ligandSyms.length > 0
      ? ligandSyms.reduce((s, sym) => s + (EN_PAULING[sym] || 2.5), 0) / ligandSyms.length
      : 2.20;
    const ligEnCorr = (avgLigEN - 2.20) * 1.2;

    /* Correção por ordem de ligação — duplas/triplas expandem o ângulo. */
    const boCorr = Math.max(0, avgBondOrder - 1) * 4.0;

    let finalDeg = idealDeg - lonePairCompression - enCenCorr - ligEnCorr + boCorr;
    const MIN_DEG = total >= 4 ? 85 : total === 3 ? 90 : 100;
    const MAX_DEG = idealDeg + 6;
    finalDeg = Math.max(MIN_DEG, Math.min(MAX_DEG, finalDeg));
    return (finalDeg * Math.PI) / 180;
  };

  /* Mantém a assinatura original de vsepAngle para compatibilidade com
     código existente que não tem acesso aos símbolos dos ligantes      */
  SILQ.vsepAngle = function vsepAngle(nBonds, nLone) {
    const total = nBonds + nLone;
    const TABLE = {
      2: { 0: 180 },
      3: { 0: 120, 1: 104.5 },
      4: { 0: 109.5, 1: 107.0, 2: 104.5 },
      5: { 0: 120 },
      6: { 0: 90  },
    };
    const row = TABLE[total];
    if (!row) return Math.PI;
    const deg = row[nLone] ?? row[0];
    return (deg * Math.PI) / 180;
  };

  /* Retorna geometria como string para o painel informativo */
  SILQ.vsepName = function vsepName(nBonds, nLone, angleDeg) {
    const t = nBonds + nLone;
    const a = angleDeg !== undefined ? angleDeg.toFixed(1) : '?';
    const NAMES = {
      '2,0': `Linear (180°)`,
      '3,0': `Trigonal Planar (120°)`,
      '3,1': `Angular (${a}°)`,
      '4,0': `Tetraédrico (${a}°)`,
      '4,1': `Piramidal Trigonal (${a}°)`,
      '4,2': `Angular (${a}°)`,
      '5,0': `Trigonal Bipiramidal (120°/90°)`,
      '6,0': `Octaédrico (90°)`,
    };
    return NAMES[`${t},${nLone}`] || `${t} grupos (${a}°)`;
  };

  /* Para cada átomo central, retorna { nBonds, nLone, angle, name } */
  SILQ.getVSEPR = function getVSEPR(centralAtom) {
    const sym = centralAtom.element;
    const myBonds = SILQ.bonds.filter(b =>
      b.type === 'covalent' && (b.a === centralAtom.id || b.b === centralAtom.id)
    );
    const nBonds = myBonds.length;
    if (nBonds < 2) return null;

    const el    = ELEMENTS[sym];
    const used  = SILQ.bondOrderSum(centralAtom.id);
    const nLone = Math.max(0, Math.floor(((el.valence || 4) - used) / 2));

    /* Coleta símbolos dos ligantes para aplicar Bent's rule */
    const ligandSyms = myBonds.map(b => {
      const lid = b.a === centralAtom.id ? b.b : b.a;
      const lat = SILQ.canvasAtoms.find(at => at.id === lid);
      return lat ? lat.element : 'H';
    });

    /* Ordem média das ligações (duplas/triplas aumentam o ângulo) */
    const avgBondOrder = myBonds.reduce((s, b) => s + (b.order || 1), 0) / myBonds.length;

    /* Usa o banco específico se a molécula for conhecida */
    const molKey = SILQ.getMoleculeKey();
    const dbEntry = (typeof MOLECULE_GEOMETRY_DB !== 'undefined') ? MOLECULE_GEOMETRY_DB[molKey] : null;
    let angle, name;
    if (dbEntry) {
      angle = (dbEntry.angle * Math.PI) / 180;
      name  = `${dbEntry.geometry} (${dbEntry.angle}°)`;
    } else {
      angle = SILQ.vsepAngleForElement(sym, ligandSyms, nBonds, nLone, avgBondOrder);
      const angleDeg = angle * 180 / Math.PI;
      name  = SILQ.vsepName(nBonds, nLone, angleDeg);
    }

    return { nBonds, nLone, angle, name, bonds: myBonds };
  };
});


