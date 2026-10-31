/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (estado mutável — módulo Estequiometria)
   ARQUIVO: estado-reacao.js
   ───────────────────────────────────────────────────────────────
   A reação ativa, as quantidades de cada substância, o estado da
   "energia de ativação" (carregar/soltar para reagir), os átomos e
   ligações do canvas (Maps compartilhados por todo o módulo) e as
   constantes físicas da simulação (raio de atração/captura,
   velocidade de carga/decaimento da energia).
   Depende de: nada.
   Usado por: praticamente todos os módulos do lado Estequiometria.
═══════════════════════════════════════════════════════════════ */

'use strict';

let currentReactionKey = "water";

/* ── ESTADO VAZIO NO CARREGAMENTO ──
   O SIE abria com a reacao da agua ja montada no canvas, o que fazia
   "tem reacao escolhida" ser sempre verdadeiro — o realce da area
   central nunca poderia significar nada.

   Por que uma flag em vez de currentReactionKey = null: existem seis
   pontos que fazem REACTIONS[currentReactionKey].algo SEM checar se
   veio undefined. Zerar a chave transformaria cada um deles num
   TypeError. Mantendo a chave apontando para um objeto valido e
   controlando o estado por esta flag, nenhum desses pontos muda de
   comportamento e o canvas continua vazio ate a primeira escolha. */
let reacaoEscolhida = false;

let currentQuantities = {};

/* ---------------------------------------------------------------
   4. ESTADO GERAL DA SIMULAÇÃO
   --------------------------------------------------------------- */
const EA_NECESSARIA = 100;

const CARGA_POR_SEGUNDO = 42;

const DECAIMENTO_POR_SEGUNDO = 70;

const RAIO_ATRACAO_MULT = 2.6;

const RAIO_CAPTURA_MULT = 1.25;

let state = "IDLE"; // IDLE -> CHARGING -> ACTIVATED -> VALIDATED

let charge = 0;

let tempoCongelado = null; // timestamp fixo usado só pelo osciloscópio de energia pós-validação (a animação dos elétrons nos átomos continua sempre ativa)

let chargingHeld = false;

const atoms = new Map();

const bonds = new Map();

let atomIdSeq = 0;

let bondIdSeq = 0;

let flyingElectrons = [];

