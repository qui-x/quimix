/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (regras científicas de ligação química)
   ARQUIVO: validacao-ligacoes.js
   ───────────────────────────────────────────────────────────────
   O sistema de validação de ligações, baseado em pesquisa científica
   (regras de eletronegatividade, categorias metal/ametal, gases
   nobres): decide se dois átomos PODEM formar ligação metálica,
   iônica ou covalente, por que não podem quando não podem
   (mensagens explicativas), e a função central determineBondType()
   que decide qual tipo de ligação se forma entre dois átomos.

   NOTA: o conteúdo abaixo roda dentro de
   `document.addEventListener('DOMContentLoaded', () => {...})` — o
   mesmo padrão do arquivo original (que envolvia TUDO num único
   callback gigante). Ver README para a explicação completa da
   técnica de namespace compartilhado (window.SILQ) e por que a
   ordem de alguns arquivos importa de verdade.
   Depende de: core/estado.js, core/fisica-quimica-utils.js,
               data/eletronegatividade.js, data/dados-ligacoes.js.
   Usado por: js/bonds/logica-ligacoes.js e outros pontos que formam
              ligações.
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ===================================================================
     6. SISTEMA DE VALIDAÇÃO DE LIGAÇÕES — baseado em pesquisa científica
     ===================================================================
     Regras derivadas de:
     • IUPAC Compendium of Chemical Terminology (Gold Book)
     • Chemistry LibreTexts — Metallic/Covalent/Ionic bonding
     • Pauling electronegativity continuum (ionic character formula)
     • Fractory.com — Metalloids bond behavior
     • LibreTexts — Noble gas compounds (Kr, Xe, Rn only)
     • LibreTexts — Hydrogen ionic hydrides (Group 1 & 2 only)

     ESTRUTURA DA VALIDAÇÃO:
     Para cada tipo de ligação existem três funções:
       canBondX(symA, symB)  → boolean: pode formar ligação X?
       whyCannotBondX(...)   → string:  razão legível
       bondXWarning(...)     → exibe aviso no painel + anuncia

     determineBondType() usa essas funções para decidir o tipo
     correto E bloquear combinações inválidas antes de criar bonds.
     =================================================================== */

  /* ────────────────────────────────────────────────────────────────────
     LIGAÇÃO METÁLICA
     Regra:  apenas metal + metal (mesmo elemento ou metais distintos).
     Exceção: Gálio (Ga) e Mercúrio (Hg) têm ligações metálicas mas
              também formam ligações covalentes M-M — permitimos ambos.
     Não-metal, semimetal e gás nobre: NUNCA metálica.
     ──────────────────────────────────────────────────────────────────── */
  SILQ.METALLIC_CAPABLE = new Set([
    // Metais alcalinos
    'Li','Na','K','Rb','Cs','Fr',
    // Metais alcalino-terrosos
    'Be','Mg','Ca','Sr','Ba','Ra',
    // Metais de transição
    'Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn',
    'Y','Zr','Nb','Mo','Tc','Ru','Rh','Pd','Ag','Cd',
    'Hf','Ta','W','Re','Os','Ir','Pt','Au','Hg',
    'Rf','Db','Sg','Bh','Hs','Mt','Ds','Rg','Cn',
    // Metais pós-transição
    'Al','Ga','In','Sn','Tl','Pb','Bi','Nh','Fl','Mc','Lv',
    // Lantanídeos
    'La','Ce','Pr','Nd','Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu',
    // Actinídeos
    'Ac','Th','Pa','U','Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr',
  ]);

  SILQ.canFormMetallicBond = function canFormMetallicBond(symA, symB) {
    return SILQ.METALLIC_CAPABLE.has(symA) && SILQ.METALLIC_CAPABLE.has(symB);
  };

  SILQ.whyCannotMetallic = function whyCannotMetallic(symA, symB) {
    const notA = !SILQ.METALLIC_CAPABLE.has(symA);
    const notB = !SILQ.METALLIC_CAPABLE.has(symB);
    const el   = ELEMENTS;
    if (notA && notB) return `${symA} e ${symB} não são metais — ligação metálica requer dois metais.`;
    if (notA) return `${symA} (${el[symA]?.category||'?'}) não é metal — ligação metálica requer dois metais.`;
    return         `${symB} (${el[symB]?.category||'?'}) não é metal — ligação metálica requer dois metais.`;
  };

  /* ────────────────────────────────────────────────────────────────────
     LIGAÇÃO IÔNICA
     Regra base: metal + ametal com ΔEN > 1,7 (Pauling).
     Exceções/extensões:
       • H + metal alcalino (Li,Na,K,Rb,Cs) → hidreto iônico (H⁻)
       • H + metal alcalino-terroso (Mg,Ca,Sr,Ba) → hidreto iônico
       • Metal + metal: NUNCA iônica
       • Dois ametais: NUNCA iônica
       • Semimetal + HA (alta EN): possível caráter iônico, mas
         representado como covalente na zona de transição ΔEN>1,7
       • Gases nobres He, Ne, Ar: NUNCA iônica
       • Kr, Xe, Rn: apenas covalente com F e O (não iônica)
     ──────────────────────────────────────────────────────────────────── */
  SILQ.IONIC_DONOR_CATS    = new Set(['alkali-metal','alkaline-earth','transition',
                                        'post-transition','lanthanide','actinide']);

  SILQ.IONIC_ACCEPTOR_CATS = new Set(['nonmetal']);

  // Gases nobres que nunca formam ligações iônicas
  SILQ.NOBLE_NO_IONIC      = new Set(['He','Ne','Ar','Kr','Xe','Rn','Og']);

  // Metais que formam hidretos iônicos com H
  SILQ.IONIC_HYDRIDE_METALS = new Set(['Li','Na','K','Rb','Cs','Fr',
                                         'Mg','Ca','Sr','Ba','Ra']);

  SILQ.canFormIonicBondType = function canFormIonicBondType(symA, symB) {
    const elA = ELEMENTS[symA], elB = ELEMENTS[symB];
    if (!elA || !elB) return false;
    const catA = elA.category, catB = elB.category;

    // Gases nobres leves: nunca iônica
    if (SILQ.NOBLE_NO_IONIC.has(symA) || SILQ.NOBLE_NO_IONIC.has(symB)) return false;

    // Metal + metal: nunca iônica (é metálica)
    if (SILQ.isMetal(catA) && SILQ.isMetal(catB)) return false;

    // H + metal alcalino ou alcalino-terroso = hidreto iônico (exceção da literatura)
    if (symA === 'H' && SILQ.IONIC_HYDRIDE_METALS.has(symB)) return true;
    if (symB === 'H' && SILQ.IONIC_HYDRIDE_METALS.has(symA)) return true;

    // H geral (não é doador nem receptor clássico de íon): bloqueia iônica
    // exceto o caso acima de hidreto com metais eletropositivos
    if (symA === 'H' || symB === 'H') return false;

    // Dois ametais: nunca iônica
    if (SILQ.isNonmetal(catA) && SILQ.isNonmetal(catB)) return false;

    // Semimetal + ametal: covalente (às vezes polar), nunca iônica clássica
    if (SILQ.isMetalloid(catA) || SILQ.isMetalloid(catB)) return false;

    // Metal + ametal: iônica se ΔEN > 1,7
    const dEN = Math.abs((elA.en||1.0) - (elB.en||1.0));
    if (SILQ.IONIC_DONOR_CATS.has(catA) && SILQ.IONIC_ACCEPTOR_CATS.has(catB)) return dEN > 1.7;
    if (SILQ.IONIC_DONOR_CATS.has(catB) && SILQ.IONIC_ACCEPTOR_CATS.has(catA)) return dEN > 1.7;

    return false;
  };

  SILQ.whyCannotIonic = function whyCannotIonic(symA, symB) {
    const elA = ELEMENTS[symA], elB = ELEMENTS[symB];
    const catA = elA?.category || '?', catB = elB?.category || '?';

    if (SILQ.NOBLE_NO_IONIC.has(symA)) return `${symA} é gás nobre e não forma ligações iônicas.`;
    if (SILQ.NOBLE_NO_IONIC.has(symB)) return `${symB} é gás nobre e não forma ligações iônicas.`;
    if (SILQ.isMetal(catA) && SILQ.isMetal(catB)) return `${symA} e ${symB} são ambos metais — formam ligação metálica, não iônica.`;
    if (SILQ.isNonmetal(catA) && SILQ.isNonmetal(catB)) return `${symA} e ${symB} são ambos ametais — formam ligação covalente, não iônica.`;
    if (SILQ.isMetalloid(catA)) return `${symA} é semimetal — forma ligações covalentes, não iônicas clássicas.`;
    if (SILQ.isMetalloid(catB)) return `${symB} é semimetal — forma ligações covalentes, não iônicas clássicas.`;

    const dEN = Math.abs((elA?.en||1.0) - (elB?.en||1.0));
    if (dEN <= 1.7) return `ΔEN = ${dEN.toFixed(2)} ≤ 1,7 — caráter predominantemente covalente (regra de Pauling).`;

    return `${symA}–${symB}: combinação não suporta ligação iônica segundo as regras de valência.`;
  };

  /* ────────────────────────────────────────────────────────────────────
     LIGAÇÃO COVALENTE
     Regra: qualquer par que compartilhe elétrons.
     Possível em:
       • Ametal + ametal (sempre)
       • Semimetal + ametal (sempre covalente)
       • Semimetal + semimetal (covalente)
       • Metal + ametal com ΔEN ≤ 1,7 (zona de transição, polar)
       • H + qualquer não-gás-nobre (quase sempre covalente)
       • Kr + F, Kr + O (covalente — KrF₂, exceção)
       • Xe + F, Xe + O (covalente — XeF₂, XeF₄, XeO₃)
       • Rn + F (covalente — RnF₂)
       • He, Ne, Ar: NUNCA covalente (octeto completo, sem d disponível)
     ──────────────────────────────────────────────────────────────────── */
  // Gases nobres pesados que podem formar compostos covalentes com F e O
  SILQ.NOBLE_COVALENT_OK   = new Set(['Kr','Xe','Rn']);

  SILQ.NOBLE_COVALENT_PAIR = new Set(['F','O']); // pares permitidos com Xe/Kr/Rn

  SILQ.NOBLE_NEVER         = new Set(['He','Ne','Ar','Og']); // nunca ligações

  SILQ.canFormCovalentBond = function canFormCovalentBond(symA, symB) {
    const elA = ELEMENTS[symA], elB = ELEMENTS[symB];
    if (!elA || !elB) return false;

    // Gases nobres leves: NUNCA qualquer ligação
    if (SILQ.NOBLE_NEVER.has(symA) || SILQ.NOBLE_NEVER.has(symB)) return false;

    // Gases nobres pesados: apenas com F e O
    if (SILQ.NOBLE_COVALENT_OK.has(symA)) return SILQ.NOBLE_COVALENT_PAIR.has(symB);
    if (SILQ.NOBLE_COVALENT_OK.has(symB)) return SILQ.NOBLE_COVALENT_PAIR.has(symA);

    // Dois metais: sem ligação covalente (é metálica)
    if (SILQ.isMetal(elA.category) && SILQ.isMetal(elB.category)) return false;

    // Octeto: H aceita apenas 1 ligação; gases nobres zero
    if (symA === 'H' && SILQ.covalentCap('H') - SILQ.bondOrderSum('__check__') <= 0) return false;

    return true; // default: covalente
  };

  SILQ.whyCannotCovalent = function whyCannotCovalent(symA, symB) {
    if (SILQ.NOBLE_NEVER.has(symA)) return `${symA} é gás nobre inerte (camada de valência completa) — não forma ligações.`;
    if (SILQ.NOBLE_NEVER.has(symB)) return `${symB} é gás nobre inerte (camada de valência completa) — não forma ligações.`;
    if (SILQ.NOBLE_COVALENT_OK.has(symA) && !SILQ.NOBLE_COVALENT_PAIR.has(symB))
      return `${symA} só forma compostos covalentes com F ou O (ex: ${symA}F₂, ${symA}O₃).`;
    if (SILQ.NOBLE_COVALENT_OK.has(symB) && !SILQ.NOBLE_COVALENT_PAIR.has(symA))
      return `${symB} só forma compostos covalentes com F ou O (ex: ${symB}F₂, ${symB}O₃).`;
    if (SILQ.isMetal(ELEMENTS[symA]?.category) && SILQ.isMetal(ELEMENTS[symB]?.category))
      return `${symA} e ${symB} são ambos metais — formam ligação metálica, não covalente.`;
    return `${symA}–${symB}: combinação não suporta ligação covalente.`;
  };

  /* ────────────────────────────────────────────────────────────────────
     VALIDAÇÃO PRINCIPAL — verifica se a combinação é possível no modo ativo
     Retorna { allowed: bool, reason: string, suggestedType: string|null }
     ──────────────────────────────────────────────────────────────────── */
  SILQ.validateBondCombination = function validateBondCombination(symA, symB, requestedType) {
    const elA = ELEMENTS[symA], elB = ELEMENTS[symB];
    if (!elA || !elB) return { allowed: false, reason: 'Elemento desconhecido.', suggestedType: null };

    // Gases nobres leves: bloqueio total
    if (SILQ.NOBLE_NEVER.has(symA)) return { allowed: false,
      reason: `${symA} é gás nobre inerte (He/Ne/Ar) e não forma nenhum tipo de ligação química.`,
      suggestedType: null };
    if (SILQ.NOBLE_NEVER.has(symB)) return { allowed: false,
      reason: `${symB} é gás nobre inerte (He/Ne/Ar) e não forma nenhum tipo de ligação química.`,
      suggestedType: null };

    const type = requestedType;

    if (type === 'metallic') {
      if (!SILQ.canFormMetallicBond(symA, symB)) return {
        allowed: false,
        reason: SILQ.whyCannotMetallic(symA, symB),
        suggestedType: SILQ.canFormCovalentBond(symA, symB) ? 'covalent' :
                       SILQ.canFormIonicBondType(symA, symB) ? 'ionic' : null,
      };
    }
    if (type === 'ionic') {
      if (!SILQ.canFormIonicBondType(symA, symB)) return {
        allowed: false,
        reason: SILQ.whyCannotIonic(symA, symB),
        suggestedType: SILQ.canFormCovalentBond(symA, symB) ? 'covalent' :
                       SILQ.canFormMetallicBond(symA, symB) ? 'metallic' : null,
      };
    }
    if (type === 'covalent') {
      if (!SILQ.canFormCovalentBond(symA, symB)) return {
        allowed: false,
        reason: SILQ.whyCannotCovalent(symA, symB),
        suggestedType: SILQ.canFormMetallicBond(symA, symB) ? 'metallic' :
                       SILQ.canFormIonicBondType(symA, symB) ? 'ionic' : null,
      };
    }

    return { allowed: true, reason: '', suggestedType: null };
  };

  /* Exibe aviso de validação no painel de análise */
  SILQ.showBondValidationWarning = function showBondValidationWarning(result, symA, symB) {
    const warn = document.getElementById('bond-order-warning');
    if (!warn) return;
    let msg = `<svg class="icon" aria-hidden="true"><use href="#ic-warning"/></svg> ${symA}–${symB}: ${result.reason}`;
    if (result.suggestedType) {
      const names = { covalent:'Covalente', ionic:'Iônica', metallic:'Metálica' };
      msg += ` Sugestão: tente Ligação ${names[result.suggestedType]}.`;
    }
    warn.innerHTML = msg;
    warn.style.display = 'block';
    clearTimeout(warn._t);
    warn._t = setTimeout(() => { warn.style.display = 'none'; }, 5000);
    SILQ.announce(msg, 'assertive');
  };

  /* ===================================================================
     BANCO DE DADOS DE LIGAÇÕES
     =================================================================== */
  /* BOND_DATA: movido para dadossilq.js (carregado antes deste arquivo) */

  /* ===================================================================
     DETERMINAÇÃO DO TIPO DE LIGAÇÃO
     Integra o sistema de validação científica:
       1. Se activeBondFilter está ativo → valida se a combinação é
          possível para aquele tipo; bloqueia e avisa se não for.
       2. Sem filtro → usa as regras científicas para determinar
          automaticamente o tipo correto.
     =================================================================== */
  SILQ.determineBondType = function determineBondType(eA, eB) {
    const a = ELEMENTS[eA], b = ELEMENTS[eB];
    if (!a || !b) return null;

    const enA = a.en || 1.0, enB = b.en || 1.0;
    const dEN = Math.abs(enA - enB);

    /* ── Modo com filtro ativo ─────────────────────────────────────── */
    if (SILQ.activeBondFilter) {
      const result = SILQ.validateBondCombination(eA, eB, SILQ.activeBondFilter);
      if (!result.allowed) {
        SILQ.showBondValidationWarning(result, eA, eB);
        return null; // bloqueia a ligação
      }
      // Filtro ativo e combinação válida: força o tipo solicitado
      if (SILQ.activeBondFilter === 'metallic') {
        return { type:'metallic', subtype:'metallic', polarNote:null };
      }
      if (SILQ.activeBondFilter === 'ionic') {
        return { type:'ionic', subtype:'ionic', polarNote:null };
      }
      if (SILQ.activeBondFilter === 'covalent') {
        if (dEN >= 0.4) return { type:'covalent', subtype:'covalent_polar',    polarNote:null };
        return              { type:'covalent', subtype:'covalent_nonpolar', polarNote:null };
      }
    }

    /* ── Modo automático — aplica regras científicas ──────────────── */

    // Gases nobres He, Ne, Ar, Og: bloqueio total
    if (SILQ.NOBLE_NEVER.has(eA) || SILQ.NOBLE_NEVER.has(eB)) {
      const inert = SILQ.NOBLE_NEVER.has(eA) ? eA : eB;
      SILQ.showBondValidationWarning({
        allowed: false,
        reason: `${inert} é gás nobre inerte e não forma ligações químicas.`,
        suggestedType: null,
      }, eA, eB);
      return null;
    }

    // Kr, Xe, Rn: apenas com F ou O
    if (SILQ.NOBLE_COVALENT_OK.has(eA) || SILQ.NOBLE_COVALENT_OK.has(eB)) {
      const noble = SILQ.NOBLE_COVALENT_OK.has(eA) ? eA : eB;
      const other = noble === eA ? eB : eA;
      if (!SILQ.NOBLE_COVALENT_PAIR.has(other)) {
        SILQ.showBondValidationWarning({
          allowed: false,
          reason: `${noble} (gás nobre pesado) só forma compostos com F ou O. Ex: ${noble}F₂, ${noble}O₃.`,
          suggestedType: null,
        }, eA, eB);
        return null;
      }
      // Ligação covalente com F ou O
      return { type:'covalent', subtype: dEN >= 0.4 ? 'covalent_polar' : 'covalent_nonpolar', polarNote:null };
    }

    // Dois metais → metálica
    if (SILQ.isMetal(a.category) && SILQ.isMetal(b.category)) {
      return { type:'metallic', subtype:'metallic', polarNote:null };
    }

    // H + metal alcalino/alcalino-terroso → hidreto iônico
    if ((eA === 'H' && SILQ.IONIC_HYDRIDE_METALS.has(eB)) ||
        (eB === 'H' && SILQ.IONIC_HYDRIDE_METALS.has(eA))) {
      // Só forma hidreto iônico se ΔEN > 1,7
      if (dEN > 1.7) return { type:'ionic', subtype:'ionic', polarNote:null };
    }

    // H com outros: sempre covalente
    if (eA === 'H' || eB === 'H') {
      if (dEN >= 0.4) return { type:'covalent', subtype:'covalent_polar', polarNote:null };
      return { type:'covalent', subtype:'covalent_nonpolar', polarNote:null };
    }

    // Semimetal: sempre covalente (nunca iônica clássica, nunca metálica com ametal)
    if (SILQ.isMetalloid(a.category) || SILQ.isMetalloid(b.category)) {
      if (dEN >= 1.2 && dEN <= 1.7) return {
        type:'covalent', subtype:'covalent_transition',
        polarNote:`<svg class="icon" aria-hidden="true"><use href="#ic-warning"/></svg> <em>Zona de transição</em> ΔEN=${dEN.toFixed(2)}: ligação com <strong>caráter iônico parcial</strong> (IUPAC).`
      };
      if (dEN >= 0.4) return { type:'covalent', subtype:'covalent_polar', polarNote:null };
      return              { type:'covalent', subtype:'covalent_nonpolar', polarNote:null };
    }

    // Metal + ametal: decide pelo ΔEN (Pauling)
    if (SILQ.isMetal(a.category) !== SILQ.isMetal(b.category)) {
      if (dEN > 1.7) return { type:'ionic', subtype:'ionic', polarNote:null };
      if (dEN >= 1.2) return {
        type:'covalent', subtype:'covalent_transition',
        polarNote:`<svg class="icon" aria-hidden="true"><use href="#ic-warning"/></svg> <em>Zona de transição</em> ΔEN=${dEN.toFixed(2)} (1,2–1,7): ligação com <strong>caráter iônico parcial</strong>. A distinção iônica/covalente é uma simplificação didática (IUPAC).`
      };
      if (dEN >= 0.4) return { type:'covalent', subtype:'covalent_polar', polarNote:null };
      return              { type:'covalent', subtype:'covalent_nonpolar', polarNote:null };
    }

    // Dois ametais: covalente
    if (dEN >= 1.2 && dEN <= 1.7) return {
      type:'covalent', subtype:'covalent_transition',
      polarNote:`<svg class="icon" aria-hidden="true"><use href="#ic-warning"/></svg> <em>Zona de transição</em> ΔEN=${dEN.toFixed(2)}: caráter iônico parcial (IUPAC).`
    };
    if (dEN >= 0.4) return { type:'covalent', subtype:'covalent_polar',    polarNote:null };
    return              { type:'covalent', subtype:'covalent_nonpolar', polarNote:null };
  };
});


