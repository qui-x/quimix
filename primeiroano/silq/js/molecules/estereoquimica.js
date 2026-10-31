/* ═══════════════════════════════════════════════════════════════
   CAMADA: MOLÉCULAS
   ARQUIVO: estereoquimica.js
   ───────────────────────────────────────────────────────────────
   Conecta o banco de geometrias moleculares (data/geometrias-
   moleculares.js) à ponte window.SILQ_VIEW3D_STATE usada pelo
   visualizador 3D, e gera a nota estereoquímica educacional (E/Z,
   quiral, etc.) exibida no painel de análise.
   getMoleculeKey() foi MOVIDA para js/init/visualizacao-3d-reset.js
   — ver o comentário "CORREÇÃO DE ORDEM" lá, e a seção sobre
   function hoisting no README.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, data/geometrias-moleculares.js,
               js/init/visualizacao-3d-reset.js (getMoleculeKey).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     26-A. ALINHAMENTO GEOMÉTRICO EXATO — VSEPR / LITERATURA QUÍMICA
     ===================================================================
     Em vez de depender da convergência lenta do motor de física,
     este módulo calcula as posições EXATAS dos ligantes com base nos
     ângulos canônicos da literatura (NIST, IUPAC 2024, CRC Handbook).

     Estratégia:
       1. Banco de ângulos específicos por molécula (lookup de fórmula)
       2. Fallback para tabela VSEPR geral quando a molécula não está no banco
       3. Posicionamento geométrico direto: dado um átomo central e seus
          ligantes, coloca cada ligante no ângulo correto em torno do centro,
          respeitando o comprimento de ligação ideal.
       4. Para moléculas com mais de um centro (ex: C₂H₄, C₂H₆), trata
          cada centro independentemente e costura as posições.

     BANCO DE GEOMETRIAS ESPECÍFICAS (ângulos em graus, da literatura):
     Formato: 'fórmula_canônica' → { geometry, angle, note }
     =================================================================== */

  /* ===================================================================
     26-A. BANCO DE ÂNGULOS EXATOS + CHAVE DE FÓRMULA
     Usado pelo physicsTick (forças angulares) e pelo painel de presets.
     =================================================================== */

  /* Normaliza a fórmula Hill atual para lookup no banco.
     Exemplo: canvasAtoms=[O,H,H] → 'H2O' */
  /* getMoleculeKey foi movida para js/init/visualizacao-3d-reset.js —
     ver o comentário "CORREÇÃO DE ORDEM" lá. Resumo: no original,
     "function getMoleculeKey(){}" tinha hoisting e podia ser
     referenciada por window.SILQ_VIEW3D_STATE mesmo aparecendo depois
     no texto; virando atribuição, isso deixa de valer, então a
     declaração precisou ser deslocada para antes de seu uso. */

  /* MOLECULE_GEOMETRY_DB: movido para dadossilq.js (carregado antes deste arquivo) */

  /* Conecta o banco ao estado compartilhado com view3dsilq.js */
  if (window.SILQ_VIEW3D_STATE) {
    window.SILQ_VIEW3D_STATE.MOLECULE_GEOMETRY_DB = MOLECULE_GEOMETRY_DB;
  }

  /* ── Gera nota estereoquímica educacional baseada no banco ──
     Exibida no painel de análise e anunciada pelo Snap Literatura. */
  SILQ.getStereochemistryNote = function getStereochemistryNote(molKey) {
    const db = MOLECULE_GEOMETRY_DB[molKey];
    if (!db) return null;
    const hyb = db.hybridization || '';
    const geo = db.geometry || '';
    const stereo = db.stereo || 'none';

    const ICO = (n) => `<svg class="icon" aria-hidden="true"><use href="#ic-${n}"/></svg>`;
    const STEREO_NOTES = {
      'none':          null,
      'linear':        `${ICO('angle')} Hibridização <strong>sp</strong> — geometria linear (180°). Nenhum isômero estereoquímico possível.`,
      'tetrahedral':   `${ICO('angle')} Hibridização <strong>sp³</strong> — geometria tetraédrica (109,5°). Se os 4 substituintes forem <em>diferentes</em>, o carbono é um <strong>centro quiral</strong> e a molécula pode existir como enantiômeros <strong>R</strong> ou <strong>S</strong> (CIP). Representação: cunha sólida (▶ para frente) e tracejada (╌╌ para trás).`,
      'EZ':            `${ICO('angle')} Hibridização <strong>sp²</strong> — ligação dupla C=C planar (120°). Rotação impedida: gera <strong>isomeria E/Z</strong> (cis/trans). Z = substituintes de maior prioridade CIP no mesmo lado; E = lados opostos.`,
      'pyramidal':     `${ICO('angle')} Hibridização <strong>sp³</strong> — geometria piramidal. O par solitário ocupa um vértice do tetraedro, comprimindo o ângulo. Em N: inversão rápida (racemização). Em P, As: inversão lenta → centros quirais estáveis possíveis.`,
      'squareplanar':  `${ICO('angle')} Geometria <strong>quadrado planar</strong> (dsp²). Isomeria <strong>cis/trans</strong> possível: substituintes iguais em posições adjacentes (cis, 90°) ou opostas (trans, 180°). Clássico em complexos de Pt²⁺.`,
      'seesaw':        `${ICO('scale')} Geometria <strong>gangorra (seesaw)</strong> — par solitário em posição equatorial da bipiramidal trigonal. Ângulos axial–equatorial (~173°) e equatorial–equatorial (~101,6°) diferentes.`,
      'tshaped':       `Geometria <strong>T-shaped</strong> — dois pares solitários em posições axiais da bipiramidal trigonal. Ângulos F–X–F: axial ~175°, equatorial ~87,5°.`,
      'ionic':         db.ionicCrystal ? `${ICO('bolt')} Composto iônico — estrutura de rede ${db.ionicCrystal === 'NaCl-rock-salt' ? 'Rock Salt (NaCl): cada íon coordenado por 6 do tipo oposto (CN=6:6), octaédrico' : db.ionicCrystal === 'fluorite' ? 'Fluorita (CaF₂): Ca²⁺ em CN=8 cúbico; F⁻ em CN=4 tetraédrico' : db.ionicCrystal}. Sem quiralidade molecular — simetria da rede.` : null,
    };
    return STEREO_NOTES[stereo] || null;
  };

  /* Expõe para uso no painel de análise */
  window.SILQ_STEREO_NOTE = SILQ.getStereochemistryNote;

  /* ── Botão cunha (wedge) ── */
  document.getElementById('btn-wedge-toggle')?.addEventListener('click', () => {
    SILQ.wedgeMode = !SILQ.wedgeMode;
    const btn = document.getElementById('btn-wedge-toggle');
    if (btn) {
      btn.classList.toggle('active-a11y', SILQ.wedgeMode);
      btn.setAttribute('aria-pressed', SILQ.wedgeMode ? 'true' : 'false');
      btn.setAttribute('aria-label', SILQ.wedgeMode
        ? 'Desativar notação de cunha'
        : 'Ativar notação de cunha — mostra estereoquímica com ligações no plano, saindo e entrando');
    }
    SILQ.updateBondLines();
    SILQ.announce(SILQ.wedgeMode
      ? 'Notação de cunha ativada. Cunha sólida = vem para frente; tracejada = vai para trás; linha = no plano.'
      : 'Notação de cunha desativada.');
  });

  /* ── Botão mostrar ângulos ── */
  document.getElementById('btn-show-angles')?.addEventListener('click', () => {
    SILQ.showAngles = !SILQ.showAngles;
    const btn = document.getElementById('btn-show-angles');
    const legend = document.getElementById('angle-legend');
    if (btn) {
      btn.classList.toggle('active-a11y', SILQ.showAngles);
      btn.setAttribute('aria-pressed', SILQ.showAngles ? 'true' : 'false');
    }
    if (legend) legend.style.display = SILQ.showAngles ? 'flex' : 'none';

    /* Sincroniza com o renderizador 3D */
    if (window.SILQ_VIEW3D) window.SILQ_VIEW3D.showAngles = SILQ.showAngles;

    SILQ.updateBondLines(); // chama drawAngleLabels internamente
    SILQ.announce(SILQ.showAngles
      ? 'Ângulos de ligação visíveis no canvas 2D e 3D, com comparação à literatura.'
      : 'Ângulos de ligação ocultados no canvas 2D e 3D.');
  });
});


