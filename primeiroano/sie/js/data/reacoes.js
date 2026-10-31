/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: reacoes.js
   ───────────────────────────────────────────────────────────────
   O catálogo de 114 reações químicas prontas: fórmula dos reagentes
   e produtos, coeficientes estequiométricos balanceados, caráter da
   ligação (ΔEN), tipo (covalente/iônica/metálica). Fonte de dados
   compartilhada pelos módulos Estequiometria E Mols (o painel
   "Investigar Reação" do Mols usa o mesmo catálogo).
   Depende de: nada.
   Usado por: js/ui/status-menu-reacoes.js, js/reactions/*,
              js/mols/reacao-investigar.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   3. CATÁLOGO DE REAÇÕES (menu lateral) — equações balanceadas
   2H2+O2->2H2O | N2+3H2->2NH3 | H2+Cl2->2HCl | CH4+2O2->CO2+2H2O
   C+O2->CO2 | H2+F2->2HF | H2+S->H2S | C+2Cl2->CCl4 | 2H2O->2H2+O2
   --------------------------------------------------------------- */
const REACTIONS = {
  water: {
    label: "Síntese da água", equation: "2 H₂ + O₂ → 2 H₂O", deltaEN: 1.24, caraterLigacao: "covalente polar",
    reagents: [{ formula: "H2", label: "H₂", defaultQty: 5 }, { formula: "O2", label: "O₂", defaultQty: 2 }],
    coeffs: { H2: 2, O2: 1, H2O: 2 },
  },
  ammonia: {
    label: "Síntese da amônia (Haber-Bosch)", equation: "N₂ + 3 H₂ → 2 NH₃", deltaEN: 0.84, caraterLigacao: "covalente polar",
    reagents: [{ formula: "N2", label: "N₂", defaultQty: 2 }, { formula: "H2", label: "H₂", defaultQty: 7 }],
    coeffs: { N2: 1, H2: 3, NH3: 2 },
  },
  hcl: {
    label: "Formação do ácido clorídrico", equation: "H₂ + Cl₂ → 2 HCl", deltaEN: 0.96, caraterLigacao: "covalente polar",
    reagents: [{ formula: "H2", label: "H₂", defaultQty: 4 }, { formula: "Cl2", label: "Cl₂", defaultQty: 3 }],
    coeffs: { H2: 1, Cl2: 1, HCl: 2 },
  },
  hf: {
    label: "Síntese do fluoreto de hidrogênio", equation: "H₂ + F₂ → 2 HF", deltaEN: 1.78, caraterLigacao: "covalente polar",
    reagents: [{ formula: "H2", label: "H₂", defaultQty: 4 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { H2: 1, F2: 1, HF: 2 },
  },
  h2s: {
    label: "Síntese do gás sulfídrico", equation: "H₂ + S → H₂S", deltaEN: 0.38, caraterLigacao: "covalente polar",
    reagents: [{ formula: "H2", label: "H₂", defaultQty: 5 }, { formula: "S", label: "S", defaultQty: 3 }],
    coeffs: { H2: 1, S: 1, H2S: 1 },
  },
  methane: {
    label: "Combustão do metano", equation: "CH₄ + 2 O₂ → CO₂ + 2 H₂O", deltaEN: 0.89, caraterLigacao: "covalente polar",
    reagents: [{ formula: "CH4", label: "CH₄", defaultQty: 3 }, { formula: "O2", label: "O₂", defaultQty: 5 }],
    coeffs: { CH4: 1, O2: 2, CO2: 1, H2O: 2 },
  },
  carbon: {
    label: "Combustão do carbono", equation: "C + O₂ → CO₂", deltaEN: 0.89, caraterLigacao: "covalente polar",
    reagents: [{ formula: "C", label: "C", defaultQty: 4 }, { formula: "O2", label: "O₂", defaultQty: 3 }],
    coeffs: { C: 1, O2: 1, CO2: 1 },
  },
  ccl4: {
    label: "Síntese do tetracloreto de carbono", equation: "C + 2 Cl₂ → CCl₄", deltaEN: 0.61, caraterLigacao: "covalente polar",
    reagents: [{ formula: "C", label: "C", defaultQty: 3 }, { formula: "Cl2", label: "Cl₂", defaultQty: 5 }],
    coeffs: { C: 1, Cl2: 2, CCl4: 1 },
  },
  electrolysis: {
    label: "Decomposição da água (eletrólise)", equation: "2 H₂O → 2 H₂ + O₂",
    reagents: [{ formula: "H2O", label: "H₂O", defaultQty: 6 }],
    coeffs: { H2O: 2, H2: 2, O2: 1 },
  },

  // ---- LIGAÇÃO IÔNICA (transferência completa de elétrons: metal -> ametal) ----
  nacl: {
    label: "Formação do cloreto de sódio", equation: "2 Na + Cl₂ → 2 NaCl", tipoLigacao: "ionico", deltaEN: 2.23, caraterLigacao: "iônica",
    reagents: [{ formula: "Na", label: "Na", defaultQty: 5 }, { formula: "Cl2", label: "Cl₂", defaultQty: 2 }],
    coeffs: { Na: 2, Cl2: 1, NaCl: 2 },
  },
  kcl: {
    label: "Formação do cloreto de potássio", equation: "2 K + Cl₂ → 2 KCl", tipoLigacao: "ionico", deltaEN: 2.34, caraterLigacao: "iônica",
    reagents: [{ formula: "K", label: "K", defaultQty: 5 }, { formula: "Cl2", label: "Cl₂", defaultQty: 2 }],
    coeffs: { K: 2, Cl2: 1, KCl: 2 },
  },
  mgcl2: {
    label: "Formação do cloreto de magnésio", equation: "Mg + Cl₂ → MgCl₂", tipoLigacao: "ionico", deltaEN: 1.85, caraterLigacao: "iônica",
    reagents: [{ formula: "Mg", label: "Mg", defaultQty: 4 }, { formula: "Cl2", label: "Cl₂", defaultQty: 3 }],
    coeffs: { Mg: 1, Cl2: 1, MgCl2: 1 },
  },
  mgo: {
    label: "Formação do óxido de magnésio", equation: "2 Mg + O₂ → 2 MgO", tipoLigacao: "ionico", deltaEN: 2.13, caraterLigacao: "iônica",
    reagents: [{ formula: "Mg", label: "Mg", defaultQty: 5 }, { formula: "O2", label: "O₂", defaultQty: 2 }],
    coeffs: { Mg: 2, O2: 1, MgO: 2 },
  },
  cacl2: {
    label: "Formação do cloreto de cálcio", equation: "Ca + Cl₂ → CaCl₂", tipoLigacao: "ionico", deltaEN: 2.16, caraterLigacao: "iônica",
    reagents: [{ formula: "Ca", label: "Ca", defaultQty: 4 }, { formula: "Cl2", label: "Cl₂", defaultQty: 3 }],
    coeffs: { Ca: 1, Cl2: 1, CaCl2: 1 },
  },
  al2o3: {
    label: "Formação do óxido de alumínio", equation: "4 Al + 3 O₂ → 2 Al₂O₃", tipoLigacao: "ionico", deltaEN: 1.83, caraterLigacao: "iônica",
    reagents: [{ formula: "Al", label: "Al", defaultQty: 5 }, { formula: "O2", label: "O₂", defaultQty: 4 }],
    coeffs: { Al: 4, O2: 3, Al2O3: 2 },
  },

  // ---- "DO DIA A DIA" — exemplos clássicos de ligação iônica que
  // aparecem fora da sala de aula (ferrugem, zinco de pilhas/galvanização,
  // sal de cozinha e sal iodado) ----
  ferrugem: {
    label: "Ferrugem (óxido de ferro III)", equation: "4 Fe + 3 O₂ → 2 Fe₂O₃", tipoLigacao: "ionico", deltaEN: 1.61, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Fe", label: "Fe", defaultQty: 5 }, { formula: "O2", label: "O₂", defaultQty: 4 }],
    coeffs: { Fe: 4, O2: 3, Fe2O3: 2 },
  },
  fecl3: {
    label: "Cloreto de ferro III", equation: "2 Fe + 3 Cl₂ → 2 FeCl₃", tipoLigacao: "ionico", deltaEN: 1.33, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Fe", label: "Fe", defaultQty: 5 }, { formula: "Cl2", label: "Cl₂", defaultQty: 4 }],
    coeffs: { Fe: 2, Cl2: 3, FeCl3: 2 },
  },
  zno: {
    label: "Óxido de zinco", equation: "2 Zn + O₂ → 2 ZnO", tipoLigacao: "ionico", deltaEN: 1.79, caraterLigacao: "iônica",
    reagents: [{ formula: "Zn", label: "Zn", defaultQty: 5 }, { formula: "O2", label: "O₂", defaultQty: 2 }],
    coeffs: { Zn: 2, O2: 1, ZnO: 2 },
  },
  zncl2: {
    label: "Cloreto de zinco", equation: "Zn + Cl₂ → ZnCl₂", tipoLigacao: "ionico", deltaEN: 1.51, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Zn", label: "Zn", defaultQty: 4 }, { formula: "Cl2", label: "Cl₂", defaultQty: 3 }],
    coeffs: { Zn: 1, Cl2: 1, ZnCl2: 1 },
  },
  nabr: {
    label: "Brometo de sódio", equation: "2 Na + Br₂ → 2 NaBr", tipoLigacao: "ionico", deltaEN: 2.03, caraterLigacao: "iônica",
    reagents: [{ formula: "Na", label: "Na", defaultQty: 5 }, { formula: "Br2", label: "Br₂", defaultQty: 2 }],
    coeffs: { Na: 2, Br2: 1, NaBr: 2 },
  },
  ki: {
    label: "Iodeto de potássio (sal iodado)", equation: "2 K + I₂ → 2 KI", tipoLigacao: "ionico", deltaEN: 1.84, caraterLigacao: "iônica",
    reagents: [{ formula: "K", label: "K", defaultQty: 5 }, { formula: "I2", label: "I₂", defaultQty: 2 }],
    coeffs: { K: 2, I2: 1, KI: 2 },
  },

  // ---- LIGAÇÃO METÁLICA (mar de elétrons — sem fórmula/estequiometria fixa) ----
  metalCu: {
    label: "Ligação Metálica: Cobre puro", equation: "Cu (s) — retículo metálico", modo: "metalico",
    reagents: [{ formula: "Cu", label: "Cu", defaultQty: 9 }],
  },
  ligaBronze: {
    label: "Liga Metálica: Cobre + Estanho (bronze)", equation: "Cu + Sn — liga metálica", modo: "metalico",
    reagents: [{ formula: "Cu", label: "Cu", defaultQty: 6 }, { formula: "Sn", label: "Sn", defaultQty: 4 }],
  },

  // ==================================================================
  // BLOCO GERADO: +77 reações (covalentes, iônicas e ligas metálicas)
  // cobrindo combinações comuns do dia a dia entre os elementos
  // simulados. Fórmulas e coeficientes calculados pela mesma regra de
  // valência cruzada usada no gerador da Tabela Periódica (mdc + razão
  // d_puro), garantindo consistência com o motor de validação.
  // ==================================================================
  cov_SiH: {
    label: "Formação do tetraidreto de silício", equation: "Si + 2 H₂ → SiH₄", tipoLigacao: "covalente", caraterLigacao: "covalente (semimetal)",
    reagents: [{ formula: "Si", label: "Si", defaultQty: 2 }, { formula: "H2", label: "H₂", defaultQty: 5 }],
    coeffs: { "Si": 1, "H2": 2, "SiH4": 1 },
  },
  cov_PH: {
    label: "Formação do triidreto de fósforo", equation: "2 P + 3 H₂ → 2 PH₃", tipoLigacao: "covalente", deltaEN: 0.01, caraterLigacao: "covalente polar",
    reagents: [{ formula: "P", label: "P", defaultQty: 4 }, { formula: "H2", label: "H₂", defaultQty: 7 }],
    coeffs: { "P": 2, "H2": 3, "PH3": 2 },
  },
  cov_HBr: {
    label: "Formação do brometo de hidrogênio", equation: "H₂ + Br₂ → 2 HBr", tipoLigacao: "covalente", deltaEN: 0.76, caraterLigacao: "covalente polar",
    reagents: [{ formula: "H2", label: "H₂", defaultQty: 2 }, { formula: "Br2", label: "Br₂", defaultQty: 3 }],
    coeffs: { "H2": 1, "Br2": 1, "HBr": 2 },
  },
  cov_HI: {
    label: "Formação do iodeto de hidrogênio", equation: "H₂ + I₂ → 2 HI", tipoLigacao: "covalente", deltaEN: 0.46, caraterLigacao: "covalente polar",
    reagents: [{ formula: "H2", label: "H₂", defaultQty: 2 }, { formula: "I2", label: "I₂", defaultQty: 3 }],
    coeffs: { "H2": 1, "I2": 1, "HI": 2 },
  },
  cov_CF: {
    label: "Formação do tetrafluoreto de carbono", equation: "C + 2 F₂ → CF₄", tipoLigacao: "covalente", deltaEN: 1.43, caraterLigacao: "covalente polar",
    reagents: [{ formula: "C", label: "C", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 5 }],
    coeffs: { "C": 1, "F2": 2, "CF4": 1 },
  },
  cov_SiC: {
    label: "Formação do carbeto de silício", equation: "Si + C → SiC", tipoLigacao: "covalente", caraterLigacao: "covalente (semimetal)",
    reagents: [{ formula: "Si", label: "Si", defaultQty: 2 }, { formula: "C", label: "C", defaultQty: 3 }],
    coeffs: { "Si": 1, "C": 1, "SiC": 1 },
  },
  cov_CS: {
    label: "Formação do disulfeto de carbono", equation: "C + 2 S → CS₂", tipoLigacao: "covalente", deltaEN: 0.03, caraterLigacao: "covalente polar",
    reagents: [{ formula: "C", label: "C", defaultQty: 2 }, { formula: "S", label: "S", defaultQty: 5 }],
    coeffs: { "C": 1, "S": 2, "CS2": 1 },
  },
  cov_CBr: {
    label: "Formação do tetrabrometo de carbono", equation: "C + 2 Br₂ → CBr₄", tipoLigacao: "covalente", deltaEN: 0.41, caraterLigacao: "covalente polar",
    reagents: [{ formula: "C", label: "C", defaultQty: 2 }, { formula: "Br2", label: "Br₂", defaultQty: 5 }],
    coeffs: { "C": 1, "Br2": 2, "CBr4": 1 },
  },
  cov_NF: {
    label: "Formação do trifluoreto de nitrogênio", equation: "N₂ + 3 F₂ → 2 NF₃", tipoLigacao: "covalente", deltaEN: 0.94, caraterLigacao: "covalente polar",
    reagents: [{ formula: "N2", label: "N₂", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 7 }],
    coeffs: { "N2": 1, "F2": 3, "NF3": 2 },
  },
  cov_SiN: {
    label: "Formação do tetranitreto de trisilício", equation: "3 Si + 2 N₂ → Si₃N₄", tipoLigacao: "covalente", caraterLigacao: "covalente (semimetal)",
    reagents: [{ formula: "Si", label: "Si", defaultQty: 6 }, { formula: "N2", label: "N₂", defaultQty: 5 }],
    coeffs: { "Si": 3, "N2": 2, "Si3N4": 1 },
  },
  cov_NCl: {
    label: "Formação do tricloreto de nitrogênio", equation: "N₂ + 3 Cl₂ → 2 NCl₃", tipoLigacao: "covalente", deltaEN: 0.12, caraterLigacao: "covalente polar",
    reagents: [{ formula: "N2", label: "N₂", defaultQty: 2 }, { formula: "Cl2", label: "Cl₂", defaultQty: 7 }],
    coeffs: { "N2": 1, "Cl2": 3, "NCl3": 2 },
  },
  cov_PO: {
    label: "Formação do trióxido de difósforo", equation: "4 P + 3 O₂ → 2 P₂O₃", tipoLigacao: "covalente", deltaEN: 1.25, caraterLigacao: "covalente polar",
    reagents: [{ formula: "P", label: "P", defaultQty: 8 }, { formula: "O2", label: "O₂", defaultQty: 7 }],
    coeffs: { "P": 4, "O2": 3, "P2O3": 2 },
  },
  cov_SiF: {
    label: "Formação do tetrafluoreto de silício", equation: "Si + 2 F₂ → SiF₄", tipoLigacao: "covalente", caraterLigacao: "covalente (semimetal)",
    reagents: [{ formula: "Si", label: "Si", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 5 }],
    coeffs: { "Si": 1, "F2": 2, "SiF4": 1 },
  },
  cov_PF: {
    label: "Formação do trifluoreto de fósforo", equation: "2 P + 3 F₂ → 2 PF₃", tipoLigacao: "covalente", deltaEN: 1.79, caraterLigacao: "covalente polar",
    reagents: [{ formula: "P", label: "P", defaultQty: 4 }, { formula: "F2", label: "F₂", defaultQty: 7 }],
    coeffs: { "P": 2, "F2": 3, "PF3": 2 },
  },
  cov_ClF: {
    label: "Formação do fluoreto de cloro", equation: "Cl₂ + F₂ → 2 ClF", tipoLigacao: "covalente", deltaEN: 0.82, caraterLigacao: "covalente polar",
    reagents: [{ formula: "Cl2", label: "Cl₂", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "Cl2": 1, "F2": 1, "ClF": 2 },
  },
  cov_BrF: {
    label: "Formação do fluoreto de bromo", equation: "Br₂ + F₂ → 2 BrF", tipoLigacao: "covalente", deltaEN: 1.02, caraterLigacao: "covalente polar",
    reagents: [{ formula: "Br2", label: "Br₂", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "Br2": 1, "F2": 1, "BrF": 2 },
  },
  cov_IF: {
    label: "Formação do fluoreto de iodo", equation: "I₂ + F₂ → 2 IF", tipoLigacao: "covalente", deltaEN: 1.32, caraterLigacao: "covalente polar",
    reagents: [{ formula: "I2", label: "I₂", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "I2": 1, "F2": 1, "IF": 2 },
  },
  cov_SiS: {
    label: "Formação do disulfeto de silício", equation: "Si + 2 S → SiS₂", tipoLigacao: "covalente", caraterLigacao: "covalente (semimetal)",
    reagents: [{ formula: "Si", label: "Si", defaultQty: 2 }, { formula: "S", label: "S", defaultQty: 5 }],
    coeffs: { "Si": 1, "S": 2, "SiS2": 1 },
  },
  cov_SiCl: {
    label: "Formação do tetracloreto de silício", equation: "Si + 2 Cl₂ → SiCl₄", tipoLigacao: "covalente", caraterLigacao: "covalente (semimetal)",
    reagents: [{ formula: "Si", label: "Si", defaultQty: 2 }, { formula: "Cl2", label: "Cl₂", defaultQty: 5 }],
    coeffs: { "Si": 1, "Cl2": 2, "SiCl4": 1 },
  },
  cov_SiBr: {
    label: "Formação do tetrabrometo de silício", equation: "Si + 2 Br₂ → SiBr₄", tipoLigacao: "covalente", caraterLigacao: "covalente (semimetal)",
    reagents: [{ formula: "Si", label: "Si", defaultQty: 2 }, { formula: "Br2", label: "Br₂", defaultQty: 5 }],
    coeffs: { "Si": 1, "Br2": 2, "SiBr4": 1 },
  },
  cov_SiI: {
    label: "Formação do tetraiodeto de silício", equation: "Si + 2 I₂ → SiI₄", tipoLigacao: "covalente", caraterLigacao: "covalente (semimetal)",
    reagents: [{ formula: "Si", label: "Si", defaultQty: 2 }, { formula: "I2", label: "I₂", defaultQty: 5 }],
    coeffs: { "Si": 1, "I2": 2, "SiI4": 1 },
  },
  cov_PS: {
    label: "Formação do trisulfeto de difósforo", equation: "2 P + 3 S → P₂S₃", tipoLigacao: "covalente", deltaEN: 0.39, caraterLigacao: "covalente polar",
    reagents: [{ formula: "P", label: "P", defaultQty: 4 }, { formula: "S", label: "S", defaultQty: 7 }],
    coeffs: { "P": 2, "S": 3, "P2S3": 1 },
  },
  cov_PCl: {
    label: "Formação do tricloreto de fósforo", equation: "2 P + 3 Cl₂ → 2 PCl₃", tipoLigacao: "covalente", deltaEN: 0.97, caraterLigacao: "covalente polar",
    reagents: [{ formula: "P", label: "P", defaultQty: 4 }, { formula: "Cl2", label: "Cl₂", defaultQty: 7 }],
    coeffs: { "P": 2, "Cl2": 3, "PCl3": 2 },
  },
  cov_PBr: {
    label: "Formação do tribrometo de fósforo", equation: "2 P + 3 Br₂ → 2 PBr₃", tipoLigacao: "covalente", deltaEN: 0.77, caraterLigacao: "covalente polar",
    reagents: [{ formula: "P", label: "P", defaultQty: 4 }, { formula: "Br2", label: "Br₂", defaultQty: 7 }],
    coeffs: { "P": 2, "Br2": 3, "PBr3": 2 },
  },
  cov_PI: {
    label: "Formação do triiodeto de fósforo", equation: "2 P + 3 I₂ → 2 PI₃", tipoLigacao: "covalente", deltaEN: 0.47, caraterLigacao: "covalente polar",
    reagents: [{ formula: "P", label: "P", defaultQty: 4 }, { formula: "I2", label: "I₂", defaultQty: 7 }],
    coeffs: { "P": 2, "I2": 3, "PI3": 2 },
  },
  cov_SCl: {
    label: "Formação do dicloreto de enxofre", equation: "S + Cl₂ → SCl₂", tipoLigacao: "covalente", deltaEN: 0.58, caraterLigacao: "covalente polar",
    reagents: [{ formula: "S", label: "S", defaultQty: 2 }, { formula: "Cl2", label: "Cl₂", defaultQty: 3 }],
    coeffs: { "S": 1, "Cl2": 1, "SCl2": 1 },
  },
  cov_SBr: {
    label: "Formação do dibrometo de enxofre", equation: "S + Br₂ → SBr₂", tipoLigacao: "covalente", deltaEN: 0.38, caraterLigacao: "covalente polar",
    reagents: [{ formula: "S", label: "S", defaultQty: 2 }, { formula: "Br2", label: "Br₂", defaultQty: 3 }],
    coeffs: { "S": 1, "Br2": 1, "SBr2": 1 },
  },
  cov_BrCl: {
    label: "Formação do cloreto de bromo", equation: "Br₂ + Cl₂ → 2 BrCl", tipoLigacao: "covalente", deltaEN: 0.20, caraterLigacao: "covalente polar",
    reagents: [{ formula: "Br2", label: "Br₂", defaultQty: 2 }, { formula: "Cl2", label: "Cl₂", defaultQty: 3 }],
    coeffs: { "Br2": 1, "Cl2": 1, "BrCl": 2 },
  },
  cov_ClI: {
    label: "Formação do iodeto de cloro", equation: "Cl₂ + I₂ → 2 ICl", tipoLigacao: "covalente", deltaEN: 0.50, caraterLigacao: "covalente polar",
    reagents: [{ formula: "Cl2", label: "Cl₂", defaultQty: 2 }, { formula: "I2", label: "I₂", defaultQty: 3 }],
    coeffs: { "Cl2": 1, "I2": 1, "ICl": 2 },
  },
  cov_BrI: {
    label: "Formação do iodeto de bromo", equation: "Br₂ + I₂ → 2 IBr", tipoLigacao: "covalente", deltaEN: 0.30, caraterLigacao: "covalente polar",
    reagents: [{ formula: "Br2", label: "Br₂", defaultQty: 2 }, { formula: "I2", label: "I₂", defaultQty: 3 }],
    coeffs: { "Br2": 1, "I2": 1, "IBr": 2 },
  },
  ion_LiF: {
    label: "Formação do fluoreto de lítio", equation: "2 Li + F₂ → 2 LiF", tipoLigacao: "ionico", deltaEN: 3.00, caraterLigacao: "iônica",
    reagents: [{ formula: "Li", label: "Li", defaultQty: 4 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "Li": 2, "F2": 1, "LiF": 2 },
  },
  ion_LiCl: {
    label: "Formação do cloreto de lítio", equation: "2 Li + Cl₂ → 2 LiCl", tipoLigacao: "ionico", deltaEN: 2.18, caraterLigacao: "iônica",
    reagents: [{ formula: "Li", label: "Li", defaultQty: 4 }, { formula: "Cl2", label: "Cl₂", defaultQty: 3 }],
    coeffs: { "Li": 2, "Cl2": 1, "LiCl": 2 },
  },
  ion_LiBr: {
    label: "Formação do brometo de lítio", equation: "2 Li + Br₂ → 2 LiBr", tipoLigacao: "ionico", deltaEN: 1.98, caraterLigacao: "iônica",
    reagents: [{ formula: "Li", label: "Li", defaultQty: 4 }, { formula: "Br2", label: "Br₂", defaultQty: 3 }],
    coeffs: { "Li": 2, "Br2": 1, "LiBr": 2 },
  },
  ion_LiI: {
    label: "Formação do iodeto de lítio", equation: "2 Li + I₂ → 2 LiI", tipoLigacao: "ionico", deltaEN: 1.68, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Li", label: "Li", defaultQty: 4 }, { formula: "I2", label: "I₂", defaultQty: 3 }],
    coeffs: { "Li": 2, "I2": 1, "LiI": 2 },
  },
  ion_LiO: {
    label: "Formação do óxido de dilítio", equation: "4 Li + O₂ → 2 Li₂O", tipoLigacao: "ionico", deltaEN: 2.46, caraterLigacao: "iônica",
    reagents: [{ formula: "Li", label: "Li", defaultQty: 8 }, { formula: "O2", label: "O₂", defaultQty: 3 }],
    coeffs: { "Li": 4, "O2": 1, "Li2O": 2 },
  },
  ion_LiS: {
    label: "Formação do sulfeto de dilítio", equation: "2 Li + S → Li₂S", tipoLigacao: "ionico", deltaEN: 1.60, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Li", label: "Li", defaultQty: 4 }, { formula: "S", label: "S", defaultQty: 3 }],
    coeffs: { "Li": 2, "S": 1, "Li2S": 1 },
  },
  ion_LiN: {
    label: "Formação do nitreto de trilítio", equation: "6 Li + N₂ → 2 Li₃N", tipoLigacao: "ionico", deltaEN: 2.06, caraterLigacao: "iônica",
    reagents: [{ formula: "Li", label: "Li", defaultQty: 12 }, { formula: "N2", label: "N₂", defaultQty: 3 }],
    coeffs: { "Li": 6, "N2": 1, "Li3N": 2 },
  },
  ion_NaF: {
    label: "Formação do fluoreto de sódio", equation: "2 Na + F₂ → 2 NaF", tipoLigacao: "ionico", deltaEN: 3.05, caraterLigacao: "iônica",
    reagents: [{ formula: "Na", label: "Na", defaultQty: 4 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "Na": 2, "F2": 1, "NaF": 2 },
  },
  ion_NaI: {
    label: "Formação do iodeto de sódio", equation: "2 Na + I₂ → 2 NaI", tipoLigacao: "ionico", deltaEN: 1.73, caraterLigacao: "iônica",
    reagents: [{ formula: "Na", label: "Na", defaultQty: 4 }, { formula: "I2", label: "I₂", defaultQty: 3 }],
    coeffs: { "Na": 2, "I2": 1, "NaI": 2 },
  },
  ion_NaO: {
    label: "Formação do óxido de disódio", equation: "4 Na + O₂ → 2 Na₂O", tipoLigacao: "ionico", deltaEN: 2.51, caraterLigacao: "iônica",
    reagents: [{ formula: "Na", label: "Na", defaultQty: 8 }, { formula: "O2", label: "O₂", defaultQty: 3 }],
    coeffs: { "Na": 4, "O2": 1, "Na2O": 2 },
  },
  ion_NaS: {
    label: "Formação do sulfeto de disódio", equation: "2 Na + S → Na₂S", tipoLigacao: "ionico", deltaEN: 1.65, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Na", label: "Na", defaultQty: 4 }, { formula: "S", label: "S", defaultQty: 3 }],
    coeffs: { "Na": 2, "S": 1, "Na2S": 1 },
  },
  ion_NaN: {
    label: "Formação do nitreto de trisódio", equation: "6 Na + N₂ → 2 Na₃N", tipoLigacao: "ionico", deltaEN: 2.11, caraterLigacao: "iônica",
    reagents: [{ formula: "Na", label: "Na", defaultQty: 12 }, { formula: "N2", label: "N₂", defaultQty: 3 }],
    coeffs: { "Na": 6, "N2": 1, "Na3N": 2 },
  },
  ion_KF: {
    label: "Formação do fluoreto de potássio", equation: "2 K + F₂ → 2 KF", tipoLigacao: "ionico", deltaEN: 3.16, caraterLigacao: "iônica",
    reagents: [{ formula: "K", label: "K", defaultQty: 4 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "K": 2, "F2": 1, "KF": 2 },
  },
  ion_KBr: {
    label: "Formação do brometo de potássio", equation: "2 K + Br₂ → 2 KBr", tipoLigacao: "ionico", deltaEN: 2.14, caraterLigacao: "iônica",
    reagents: [{ formula: "K", label: "K", defaultQty: 4 }, { formula: "Br2", label: "Br₂", defaultQty: 3 }],
    coeffs: { "K": 2, "Br2": 1, "KBr": 2 },
  },
  ion_KO: {
    label: "Formação do óxido de dipotássio", equation: "4 K + O₂ → 2 K₂O", tipoLigacao: "ionico", deltaEN: 2.62, caraterLigacao: "iônica",
    reagents: [{ formula: "K", label: "K", defaultQty: 8 }, { formula: "O2", label: "O₂", defaultQty: 3 }],
    coeffs: { "K": 4, "O2": 1, "K2O": 2 },
  },
  ion_KS: {
    label: "Formação do sulfeto de dipotássio", equation: "2 K + S → K₂S", tipoLigacao: "ionico", deltaEN: 1.76, caraterLigacao: "iônica",
    reagents: [{ formula: "K", label: "K", defaultQty: 4 }, { formula: "S", label: "S", defaultQty: 3 }],
    coeffs: { "K": 2, "S": 1, "K2S": 1 },
  },
  ion_KN: {
    label: "Formação do nitreto de tripotássio", equation: "6 K + N₂ → 2 K₃N", tipoLigacao: "ionico", deltaEN: 2.22, caraterLigacao: "iônica",
    reagents: [{ formula: "K", label: "K", defaultQty: 12 }, { formula: "N2", label: "N₂", defaultQty: 3 }],
    coeffs: { "K": 6, "N2": 1, "K3N": 2 },
  },
  ion_MgF: {
    label: "Formação do difluoreto de magnésio", equation: "Mg + F₂ → MgF₂", tipoLigacao: "ionico", deltaEN: 2.67, caraterLigacao: "iônica",
    reagents: [{ formula: "Mg", label: "Mg", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "Mg": 1, "F2": 1, "MgF2": 1 },
  },
  ion_MgBr: {
    label: "Formação do dibrometo de magnésio", equation: "Mg + Br₂ → MgBr₂", tipoLigacao: "ionico", deltaEN: 1.65, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Mg", label: "Mg", defaultQty: 2 }, { formula: "Br2", label: "Br₂", defaultQty: 3 }],
    coeffs: { "Mg": 1, "Br2": 1, "MgBr2": 1 },
  },
  ion_MgI: {
    label: "Formação do diiodeto de magnésio", equation: "Mg + I₂ → MgI₂", tipoLigacao: "ionico", deltaEN: 1.35, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Mg", label: "Mg", defaultQty: 2 }, { formula: "I2", label: "I₂", defaultQty: 3 }],
    coeffs: { "Mg": 1, "I2": 1, "MgI2": 1 },
  },
  ion_MgS: {
    label: "Formação do sulfeto de magnésio", equation: "Mg + S → MgS", tipoLigacao: "ionico", deltaEN: 1.27, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Mg", label: "Mg", defaultQty: 2 }, { formula: "S", label: "S", defaultQty: 3 }],
    coeffs: { "Mg": 1, "S": 1, "MgS": 1 },
  },
  ion_MgN: {
    label: "Formação do dinitreto de trimagnésio", equation: "3 Mg + N₂ → Mg₃N₂", tipoLigacao: "ionico", deltaEN: 1.73, caraterLigacao: "iônica",
    reagents: [{ formula: "Mg", label: "Mg", defaultQty: 6 }, { formula: "N2", label: "N₂", defaultQty: 3 }],
    coeffs: { "Mg": 3, "N2": 1, "Mg3N2": 1 },
  },
  ion_CaF: {
    label: "Formação do difluoreto de cálcio", equation: "Ca + F₂ → CaF₂", tipoLigacao: "ionico", deltaEN: 2.98, caraterLigacao: "iônica",
    reagents: [{ formula: "Ca", label: "Ca", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "Ca": 1, "F2": 1, "CaF2": 1 },
  },
  ion_CaBr: {
    label: "Formação do dibrometo de cálcio", equation: "Ca + Br₂ → CaBr₂", tipoLigacao: "ionico", deltaEN: 1.96, caraterLigacao: "iônica",
    reagents: [{ formula: "Ca", label: "Ca", defaultQty: 2 }, { formula: "Br2", label: "Br₂", defaultQty: 3 }],
    coeffs: { "Ca": 1, "Br2": 1, "CaBr2": 1 },
  },
  ion_CaI: {
    label: "Formação do diiodeto de cálcio", equation: "Ca + I₂ → CaI₂", tipoLigacao: "ionico", deltaEN: 1.66, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Ca", label: "Ca", defaultQty: 2 }, { formula: "I2", label: "I₂", defaultQty: 3 }],
    coeffs: { "Ca": 1, "I2": 1, "CaI2": 1 },
  },
  ion_CaO: {
    label: "Formação do óxido de cálcio", equation: "2 Ca + O₂ → 2 CaO", tipoLigacao: "ionico", deltaEN: 2.44, caraterLigacao: "iônica",
    reagents: [{ formula: "Ca", label: "Ca", defaultQty: 4 }, { formula: "O2", label: "O₂", defaultQty: 3 }],
    coeffs: { "Ca": 2, "O2": 1, "CaO": 2 },
  },
  ion_CaS: {
    label: "Formação do sulfeto de cálcio", equation: "Ca + S → CaS", tipoLigacao: "ionico", deltaEN: 1.58, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Ca", label: "Ca", defaultQty: 2 }, { formula: "S", label: "S", defaultQty: 3 }],
    coeffs: { "Ca": 1, "S": 1, "CaS": 1 },
  },
  ion_CaN: {
    label: "Formação do dinitreto de tricálcio", equation: "3 Ca + N₂ → Ca₃N₂", tipoLigacao: "ionico", deltaEN: 2.04, caraterLigacao: "iônica",
    reagents: [{ formula: "Ca", label: "Ca", defaultQty: 6 }, { formula: "N2", label: "N₂", defaultQty: 3 }],
    coeffs: { "Ca": 3, "N2": 1, "Ca3N2": 1 },
  },
  ion_AlF: {
    label: "Formação do trifluoreto de alumínio", equation: "2 Al + 3 F₂ → 2 AlF₃", tipoLigacao: "ionico", deltaEN: 2.37, caraterLigacao: "iônica",
    reagents: [{ formula: "Al", label: "Al", defaultQty: 4 }, { formula: "F2", label: "F₂", defaultQty: 7 }],
    coeffs: { "Al": 2, "F2": 3, "AlF3": 2 },
  },
  ion_AlCl: {
    label: "Formação do tricloreto de alumínio", equation: "2 Al + 3 Cl₂ → 2 AlCl₃", tipoLigacao: "ionico", deltaEN: 1.55, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Al", label: "Al", defaultQty: 4 }, { formula: "Cl2", label: "Cl₂", defaultQty: 7 }],
    coeffs: { "Al": 2, "Cl2": 3, "AlCl3": 2 },
  },
  ion_AlBr: {
    label: "Formação do tribrometo de alumínio", equation: "2 Al + 3 Br₂ → 2 AlBr₃", tipoLigacao: "ionico", deltaEN: 1.35, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Al", label: "Al", defaultQty: 4 }, { formula: "Br2", label: "Br₂", defaultQty: 7 }],
    coeffs: { "Al": 2, "Br2": 3, "AlBr3": 2 },
  },
  ion_AlI: {
    label: "Formação do triiodeto de alumínio", equation: "2 Al + 3 I₂ → 2 AlI₃", tipoLigacao: "ionico", deltaEN: 1.05, caraterLigacao: "iônica (regra geral metal+ametal — ΔEN abaixo do critério estrito de Pauling)",
    reagents: [{ formula: "Al", label: "Al", defaultQty: 4 }, { formula: "I2", label: "I₂", defaultQty: 7 }],
    coeffs: { "Al": 2, "I2": 3, "AlI3": 2 },
  },
  ion_AlS: {
    label: "Formação do trisulfeto de dialumínio", equation: "2 Al + 3 S → Al₂S₃", tipoLigacao: "ionico", deltaEN: 0.97, caraterLigacao: "iônica (regra geral metal+ametal — ΔEN abaixo do critério estrito de Pauling)",
    reagents: [{ formula: "Al", label: "Al", defaultQty: 4 }, { formula: "S", label: "S", defaultQty: 7 }],
    coeffs: { "Al": 2, "S": 3, "Al2S3": 1 },
  },
  ion_AlN: {
    label: "Formação do nitreto de alumínio", equation: "2 Al + N₂ → 2 AlN", tipoLigacao: "ionico", deltaEN: 1.43, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Al", label: "Al", defaultQty: 4 }, { formula: "N2", label: "N₂", defaultQty: 3 }],
    coeffs: { "Al": 2, "N2": 1, "AlN": 2 },
  },
  ion_ZnF: {
    label: "Formação do difluoreto de zinco", equation: "Zn + F₂ → ZnF₂", tipoLigacao: "ionico", deltaEN: 2.33, caraterLigacao: "iônica",
    reagents: [{ formula: "Zn", label: "Zn", defaultQty: 2 }, { formula: "F2", label: "F₂", defaultQty: 3 }],
    coeffs: { "Zn": 1, "F2": 1, "ZnF2": 1 },
  },
  ion_ZnBr: {
    label: "Formação do dibrometo de zinco", equation: "Zn + Br₂ → ZnBr₂", tipoLigacao: "ionico", deltaEN: 1.31, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Zn", label: "Zn", defaultQty: 2 }, { formula: "Br2", label: "Br₂", defaultQty: 3 }],
    coeffs: { "Zn": 1, "Br2": 1, "ZnBr2": 1 },
  },
  ion_ZnI: {
    label: "Formação do diiodeto de zinco", equation: "Zn + I₂ → ZnI₂", tipoLigacao: "ionico", deltaEN: 1.01, caraterLigacao: "iônica (regra geral metal+ametal — ΔEN abaixo do critério estrito de Pauling)",
    reagents: [{ formula: "Zn", label: "Zn", defaultQty: 2 }, { formula: "I2", label: "I₂", defaultQty: 3 }],
    coeffs: { "Zn": 1, "I2": 1, "ZnI2": 1 },
  },
  ion_ZnS: {
    label: "Formação do sulfeto de zinco", equation: "Zn + S → ZnS", tipoLigacao: "ionico", deltaEN: 0.93, caraterLigacao: "iônica (regra geral metal+ametal — ΔEN abaixo do critério estrito de Pauling)",
    reagents: [{ formula: "Zn", label: "Zn", defaultQty: 2 }, { formula: "S", label: "S", defaultQty: 3 }],
    coeffs: { "Zn": 1, "S": 1, "ZnS": 1 },
  },
  ion_ZnN: {
    label: "Formação do dinitreto de trizinco", equation: "3 Zn + N₂ → Zn₃N₂", tipoLigacao: "ionico", deltaEN: 1.39, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Zn", label: "Zn", defaultQty: 6 }, { formula: "N2", label: "N₂", defaultQty: 3 }],
    coeffs: { "Zn": 3, "N2": 1, "Zn3N2": 1 },
  },
  ion_FeF: {
    label: "Formação do trifluoreto de ferro III", equation: "2 Fe + 3 F₂ → 2 FeF₃", tipoLigacao: "ionico", deltaEN: 2.15, caraterLigacao: "iônica",
    reagents: [{ formula: "Fe", label: "Fe", defaultQty: 4 }, { formula: "F2", label: "F₂", defaultQty: 7 }],
    coeffs: { "Fe": 2, "F2": 3, "FeF3": 2 },
  },
  ion_FeBr: {
    label: "Formação do tribrometo de ferro III", equation: "2 Fe + 3 Br₂ → 2 FeBr₃", tipoLigacao: "ionico", deltaEN: 1.13, caraterLigacao: "iônica (regra geral metal+ametal — ΔEN abaixo do critério estrito de Pauling)",
    reagents: [{ formula: "Fe", label: "Fe", defaultQty: 4 }, { formula: "Br2", label: "Br₂", defaultQty: 7 }],
    coeffs: { "Fe": 2, "Br2": 3, "FeBr3": 2 },
  },
  ion_FeI: {
    label: "Formação do triiodeto de ferro III", equation: "2 Fe + 3 I₂ → 2 FeI₃", tipoLigacao: "ionico", deltaEN: 0.83, caraterLigacao: "iônica (regra geral metal+ametal — ΔEN abaixo do critério estrito de Pauling)",
    reagents: [{ formula: "Fe", label: "Fe", defaultQty: 4 }, { formula: "I2", label: "I₂", defaultQty: 7 }],
    coeffs: { "Fe": 2, "I2": 3, "FeI3": 2 },
  },
  ion_FeS: {
    label: "Formação do trisulfeto de diferro III", equation: "2 Fe + 3 S → Fe₂S₃", tipoLigacao: "ionico", deltaEN: 0.75, caraterLigacao: "iônica (regra geral metal+ametal — ΔEN abaixo do critério estrito de Pauling)",
    reagents: [{ formula: "Fe", label: "Fe", defaultQty: 4 }, { formula: "S", label: "S", defaultQty: 7 }],
    coeffs: { "Fe": 2, "S": 3, "Fe2S3": 1 },
  },
  ion_FeN: {
    label: "Formação do nitreto de ferro III", equation: "2 Fe + N₂ → 2 FeN", tipoLigacao: "ionico", deltaEN: 1.21, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [{ formula: "Fe", label: "Fe", defaultQty: 4 }, { formula: "N2", label: "N₂", defaultQty: 3 }],
    coeffs: { "Fe": 2, "N2": 1, "FeN": 2 },
  },
  ligaOuroCobre: {
    label: "Liga Metálica: Ouro + Cobre (joalheria)", equation: "Au + Cu — liga metálica", modo: "metalico",
    reagents: [{ formula: "Au", label: "Au", defaultQty: 7 }, { formula: "Cu", label: "Cu", defaultQty: 5 }],
  },
  ligaPrataEsterlina: {
    label: "Liga Metálica: Prata + Cobre (prata de lei)", equation: "Ag + Cu — liga metálica", modo: "metalico",
    reagents: [{ formula: "Ag", label: "Ag", defaultQty: 8 }, { formula: "Cu", label: "Cu", defaultQty: 3 }],
  },
  ligaEletro: {
    label: "Liga Metálica: Ouro + Prata (electrum)", equation: "Au + Ag — liga metálica", modo: "metalico",
    reagents: [{ formula: "Au", label: "Au", defaultQty: 6 }, { formula: "Ag", label: "Ag", defaultQty: 6 }],
  },

  // ==================================================================
  // REAÇÕES COM 3 A 6 REAGENTES — o motor já é genérico sobre o nº de
  // reagentes (nenhuma parte do código pressupõe exatamente 2), então
  // estas entradas só precisaram de pesquisa/balanceamento, sem mudança
  // de engine. Dois grupos:
  // (a) carbonatos/silicatos — síntese teórica a partir dos elementos;
  //     o C/Si forma 1 ligação dupla + 2 simples (como na estrutura real
  //     do íon carbonato/silicato) e o metal doa 1 e⁻ para cada O que
  //     ficou com valência aberta — combina covalente + iônica na MESMA
  //     molécula, o que o motor já suporta nativamente.
  // (b) halogenações múltiplas / combustão de misturas — vários
  //     reagentes simples reagindo em paralelo (cada ligação isolada é
  //     simples; a complexidade vem da quantidade de peças, não da
  //     dificuldade de cada ligação).
  // ==================================================================
  calcita: {
    label: "Carbonato de cálcio (calcário)", equation: "2 Ca + 2 C + 3 O₂ → 2 CaCO₃", tipoLigacao: "ionico", deltaEN: 1.55, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [
      { formula: "Ca", label: "Ca", defaultQty: 2 },
      { formula: "C", label: "C", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 3 },
    ],
    coeffs: { Ca: 2, C: 2, O2: 3, CaCO3: 2 },
  },
  carbonatoSodio: {
    label: "Carbonato de sódio (barrilha)", equation: "4 Na + 2 C + 3 O₂ → 2 Na₂CO₃", tipoLigacao: "ionico", deltaEN: 1.62, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [
      { formula: "Na", label: "Na", defaultQty: 4 },
      { formula: "C", label: "C", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 3 },
    ],
    coeffs: { Na: 4, C: 2, O2: 3, Na2CO3: 2 },
  },
  carbonatoMagnesio: {
    label: "Carbonato de magnésio", equation: "2 Mg + 2 C + 3 O₂ → 2 MgCO₃", tipoLigacao: "ionico", deltaEN: 1.24, caraterLigacao: "iônica (zona de transição — caráter parcialmente covalente)",
    reagents: [
      { formula: "Mg", label: "Mg", defaultQty: 2 },
      { formula: "C", label: "C", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 3 },
    ],
    coeffs: { Mg: 2, C: 2, O2: 3, MgCO3: 2 },
  },
  carbonatoPotassio: {
    label: "Carbonato de potássio (potassa)", equation: "4 K + 2 C + 3 O₂ → 2 K₂CO₃", tipoLigacao: "ionico", deltaEN: 1.73, caraterLigacao: "iônica",
    reagents: [
      { formula: "K", label: "K", defaultQty: 4 },
      { formula: "C", label: "C", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 3 },
    ],
    coeffs: { K: 4, C: 2, O2: 3, K2CO3: 2 },
  },
  silicatoCalcio: {
    label: "Silicato de cálcio (cimento)", equation: "2 Ca + 2 Si + 3 O₂ → 2 CaSiO₃", tipoLigacao: "ionico", deltaEN: 2.44, caraterLigacao: "iônica",
    reagents: [
      { formula: "Ca", label: "Ca", defaultQty: 2 },
      { formula: "Si", label: "Si", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 3 },
    ],
    coeffs: { Ca: 2, Si: 2, O2: 3, CaSiO3: 2 },
  },
  silicatoMagnesio: {
    label: "Silicato de magnésio (piroxênio)", equation: "2 Mg + 2 Si + 3 O₂ → 2 MgSiO₃", tipoLigacao: "ionico", deltaEN: 2.13, caraterLigacao: "iônica",
    reagents: [
      { formula: "Mg", label: "Mg", defaultQty: 2 },
      { formula: "Si", label: "Si", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 3 },
    ],
    coeffs: { Mg: 2, Si: 2, O2: 3, MgSiO3: 2 },
  },
  silicatoSodio: {
    label: "Silicato de sódio (vidro solúvel)", equation: "4 Na + 2 Si + 3 O₂ → 2 Na₂SiO₃", tipoLigacao: "ionico", deltaEN: 2.51, caraterLigacao: "iônica",
    reagents: [
      { formula: "Na", label: "Na", defaultQty: 4 },
      { formula: "Si", label: "Si", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 3 },
    ],
    coeffs: { Na: 4, Si: 2, O2: 3, Na2SiO3: 2 },
  },
  halogenacaoMg: {
    label: "Halogenação mista do magnésio", equation: "2 Mg + Cl₂ + Br₂ → MgCl₂ + MgBr₂", tipoLigacao: "ionico", deltaEN: 1.85, caraterLigacao: "iônica",
    reagents: [
      { formula: "Mg", label: "Mg", defaultQty: 2 },
      { formula: "Cl2", label: "Cl₂", defaultQty: 1 },
      { formula: "Br2", label: "Br₂", defaultQty: 1 },
    ],
    coeffs: { Mg: 2, Cl2: 1, Br2: 1, MgCl2: 1, MgBr2: 1 },
  },
  halogenacaoNa: {
    label: "Halogenação múltipla do sódio", equation: "6 Na + F₂ + Cl₂ + Br₂ → 2 NaF + 2 NaCl + 2 NaBr", tipoLigacao: "ionico", deltaEN: 3.05, caraterLigacao: "iônica",
    reagents: [
      { formula: "Na", label: "Na", defaultQty: 6 },
      { formula: "F2", label: "F₂", defaultQty: 1 },
      { formula: "Cl2", label: "Cl₂", defaultQty: 1 },
      { formula: "Br2", label: "Br₂", defaultQty: 1 },
    ],
    coeffs: { Na: 6, F2: 1, Cl2: 1, Br2: 1, NaF: 2, NaCl: 2, NaBr: 2 },
  },
  halogenacaoK: {
    label: "Halogenação completa do potássio", equation: "8 K + F₂ + Cl₂ + Br₂ + I₂ → 2 KF + 2 KCl + 2 KBr + 2 KI", tipoLigacao: "ionico", deltaEN: 3.16, caraterLigacao: "iônica",
    reagents: [
      { formula: "K", label: "K", defaultQty: 8 },
      { formula: "F2", label: "F₂", defaultQty: 1 },
      { formula: "Cl2", label: "Cl₂", defaultQty: 1 },
      { formula: "Br2", label: "Br₂", defaultQty: 1 },
      { formula: "I2", label: "I₂", defaultQty: 1 },
    ],
    coeffs: { K: 8, F2: 1, Cl2: 1, Br2: 1, I2: 1, KF: 2, KCl: 2, KBr: 2, KI: 2 },
  },
  reatividadeTotalK: {
    label: "Reatividade total do potássio", equation: "12 K + F₂ + Cl₂ + Br₂ + I₂ + O₂ → 2 KF + 2 KCl + 2 KBr + 2 KI + 2 K₂O", tipoLigacao: "ionico", deltaEN: 3.16, caraterLigacao: "iônica",
    reagents: [
      { formula: "K", label: "K", defaultQty: 12 },
      { formula: "F2", label: "F₂", defaultQty: 1 },
      { formula: "Cl2", label: "Cl₂", defaultQty: 1 },
      { formula: "Br2", label: "Br₂", defaultQty: 1 },
      { formula: "I2", label: "I₂", defaultQty: 1 },
      { formula: "O2", label: "O₂", defaultQty: 1 },
    ],
    coeffs: { K: 12, F2: 1, Cl2: 1, Br2: 1, I2: 1, O2: 1, KF: 2, KCl: 2, KBr: 2, KI: 2, K2O: 2 },
  },
  combustaoMista3: {
    label: "Combustão de mistura combustível (H₂+CH₄+C)", equation: "2 H₂ + 2 CH₄ + 2 C + 7 O₂ → 4 CO₂ + 6 H₂O", deltaEN: 0.00, caraterLigacao: "covalente apolar",
    reagents: [
      { formula: "H2", label: "H₂", defaultQty: 2 },
      { formula: "CH4", label: "CH₄", defaultQty: 2 },
      { formula: "C", label: "C", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 7 },
    ],
    coeffs: { H2: 2, CH4: 2, C: 2, O2: 7, CO2: 4, H2O: 6 },
  },
  combustaoMista4: {
    label: "Combustão com impureza de silício", equation: "2 H₂ + 2 CH₄ + 2 C + 2 Si + 9 O₂ → 4 CO₂ + 6 H₂O + 2 SiO₂", deltaEN: 0.00, caraterLigacao: "covalente apolar",
    reagents: [
      { formula: "H2", label: "H₂", defaultQty: 2 },
      { formula: "CH4", label: "CH₄", defaultQty: 2 },
      { formula: "C", label: "C", defaultQty: 2 },
      { formula: "Si", label: "Si", defaultQty: 2 },
      { formula: "O2", label: "O₂", defaultQty: 9 },
    ],
    coeffs: { H2: 2, CH4: 2, C: 2, Si: 2, O2: 9, CO2: 4, H2O: 6, SiO2: 2 },
  },
  combustaoCarvaoMineral: {
    label: "Combustão do carvão mineral (mistura complexa)", equation: "2 H₂ + 2 CH₄ + 2 C + 2 Si + 4 P + 12 O₂ → 4 CO₂ + 6 H₂O + 2 SiO₂ + 2 P₂O₃", deltaEN: 0.00, caraterLigacao: "covalente apolar",
    reagents: [
      { formula: "H2", label: "H₂", defaultQty: 2 },
      { formula: "CH4", label: "CH₄", defaultQty: 2 },
      { formula: "C", label: "C", defaultQty: 2 },
      { formula: "Si", label: "Si", defaultQty: 2 },
      { formula: "P", label: "P", defaultQty: 4 },
      { formula: "O2", label: "O₂", defaultQty: 12 },
    ],
    coeffs: { H2: 2, CH4: 2, C: 2, Si: 2, P: 4, O2: 12, CO2: 4, H2O: 6, SiO2: 2, P2O3: 2 },
  },
};

