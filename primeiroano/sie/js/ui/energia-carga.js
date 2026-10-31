/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE (módulo Estequiometria)
   ARQUIVO: energia-carga.js
   ───────────────────────────────────────────────────────────────
   O botão de "energia de ativação": segurar carrega uma barra de
   energia (necessária para formar ligações), soltar libera. Inclui
   o ruído pseudo-Perlin usado para dar uma vibração térmica mais
   orgânica aos átomos enquanto a energia carrega.
   Depende de: core/estado-reacao.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   9. ENERGIA DE ATIVAÇÃO — vibração, ruptura e estado ativado
   --------------------------------------------------------------- */
const energyBtn = document.getElementById("energyBtn");

const waveformCanvas = document.getElementById("waveform");

const wfCtx = waveformCanvas.getContext("2d");

function iniciarCarga() {
  if (!reacaoEscolhida) {
    setStatus("Escolha uma reação antes de fornecer energia de ativação.", "error");
    return;
  }
  if (state !== "IDLE") return;
  chargingHeld = true;
  state = "CHARGING";
  energyBtn.classList.add("is-charging");
  setStatus("Fornecendo energia de ativação (Eₐ) — as ligações vibram à medida que os reagentes se aproximam do complexo ativado...", "warning");
}

function soltarCarga() {
  chargingHeld = false;
  energyBtn.classList.remove("is-charging");
}

energyBtn.addEventListener("pointerdown", iniciarCarga);

addEventListener("pointerup", soltarCarga);

energyBtn.addEventListener("pointerleave", () => { if (chargingHeld) soltarCarga(); });

function ruidoPseudoPerlin(t, seed) {
  return ((Math.sin(t * 3.1 + seed * 7.0) + Math.sin(t * 5.3 + seed * 2.0) * 0.5) / 1.5) * (Math.random() * 0.4 + 0.8);
}

// Vibração: nudges diretos de posição (não força) — evita qualquer
// dependência de calibração massa/força do motor físico. O "esticar/
// encolher" real da ligação vem da mudança de constraint.length, que o
// próprio solver do Matter já resolve proporcionalmente.
function aplicarVibracao(intensidade) {
  const t = performance.now() * 0.006;
  atoms.forEach((a) => {
    const amp = 1.4 * intensidade * intensidade;
    Matter.Body.translate(a.body, {
      x: Math.sin(t + a.phase) * amp * 0.35,
      y: Math.cos(t * 1.3 + a.phase) * amp * 0.35,
    });
  });
  bonds.forEach((ligacao) => {
    const jitter = ruidoPseudoPerlin(t, ligacao.id.length + ligacao.order) * 9 * intensidade;
    ligacao.constraint.length = ligacao.restLength + jitter;
    ligacao.integrity = 1 - 0.85 * intensidade;
  });
}

// Rótulo do botão segue os 3 estágios nomeados na literatura de cinética
// química (diagrama de energia da reação): reagentes fornecem energia de
// ativação (Eₐ) → formam o complexo ativado (pico do diagrama) → este se
// decompõe nos produtos formados (estado final).
function atualizarRotuloBotaoEnergia() {
  const icone = energyBtn.querySelector(".btn-icon");
  const rotulo = energyBtn.querySelector(".btn-label");
  let texto, iconeSvg;
  if (state === "VALIDATED") { texto = "Produtos Formados"; iconeSvg = "check"; }
  else if (state === "ACTIVATED") { texto = "Complexo Ativado"; iconeSvg = "atom"; }
  else { texto = "Fornecer Energia de Ativação"; iconeSvg = "bolt"; }
  if (icone) icone.innerHTML = `<svg class="icon" aria-hidden="true"><use href="#ic-${iconeSvg}"/></svg>`;
  if (rotulo) rotulo.textContent = " " + texto;
}

