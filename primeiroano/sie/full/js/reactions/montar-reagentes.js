/* ═══════════════════════════════════════════════════════════════
   CAMADA: ESTEQUIOMETRIA
   ARQUIVO: montar-reagentes.js
   ───────────────────────────────────────────────────────────────
   Monta no canvas as quantidades atuais de cada reagente da reação
   escolhida — é o que acontece toda vez que o aluno ajusta um
   coeficiente ou escolhe uma nova reação.
   Depende de: core/estado-reacao.js, molecules/instanciar.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Mesma escala reduzida que o módulo Mols usa (ver MOLS_ESCALA) — a
// Estequiometria tinha o mesmo problema: com quantidades aleatórias
// (ver gerarQuantidadesAleatorias) alguns reagentes podem chegar a
// 8-12 unidades, e átomos grandes como K (85px de raio em escala 1)
// lotavam o canvas rapidinho. Mesmo valor 0,5 do Mols, pela mesma
// razão — consistência entre os dois módulos, não um ajuste
// específico daqui.
const ESTEQ_ESCALA = 0.5;

function montarReagentes(specs) {
  limparCena();
  state = "IDLE";
  charge = 0;
  tempoCongelado = null;
  energyBtn.classList.remove("is-charging");
  atualizarRotuloBotaoEnergia();

  const area = areaDeJogo();
  const formulas = [];
  specs.forEach((spec) => { for (let i = 0; i < spec.qty; i++) formulas.push(spec.formula); });
  const posicoes = gerarPosicoesSemSobreposicao(formulas, area, ESTEQ_ESCALA);
  formulas.forEach((formula, idx) => instanciarMolecula(formula, posicoes[idx], ESTEQ_ESCALA));

  // Trava os átomos na posição de spawn (corpos estáticos): antes da
  // energia de ativação ser fornecida, nada deve sair do lugar — só os
  // elétrons (desenho decorativo, não-físico) continuam girando. Sem
  // isso, pequenos impulsos residuais de colisão entre moléculas vizinhas
  // (inevitáveis ao posicionar muitas de uma vez) faziam tudo derivar
  // lentamente da posição inicial.
  atoms.forEach((a) => Matter.Body.setStatic(a.body, true));

  const r = REACTIONS[currentReactionKey];
  // O <h2> que mostrava o nome da reação saiu da tela; a informação
  // continua chegando a quem usa leitor de tela por aqui.
  anunciar(`Reagentes de "${r.label}" montados no canvas.`);

  if (r.modo === "metalico") {
    // ligação metálica: sem octeto, sem reagente/produto — os átomos já
    // nascem livres e o "mar de elétrons" começa a vagar imediatamente.
    // (não passa pela ruptura por energia, então libera do estático aqui)
    state = "ACTIVATED";
    atoms.forEach((a) => Matter.Body.setStatic(a.body, false));
    energyBtn.disabled = true;
    document.getElementById("validateBtn").disabled = true;
    inicializarEletronsMetalicos();
    setStatus("Ligação metálica: arraste os átomos para aproximá-los e observe o mar de elétrons deslocalizados (amarelo) — não há octeto nem fórmula fixa aqui.", "info");
  } else {
    energyBtn.disabled = false;
    document.getElementById("validateBtn").disabled = true;
    setStatus('Reagentes prontos. Segure "Fornecer Energia de Ativação" para iniciar a reação.', "info");
  }
}

function montarReagentesAtual() {
  const r = REACTIONS[currentReactionKey];
  const specs = r.reagents.map((rg) => ({ formula: rg.formula, qty: currentQuantities[rg.formula] }));
  montarReagentes(specs);
}

