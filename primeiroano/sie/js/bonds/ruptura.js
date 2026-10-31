/* ═══════════════════════════════════════════════════════════════
   CAMADA: LIGAÇÕES (módulo Estequiometria)
   ARQUIVO: ruptura.js
   ───────────────────────────────────────────────────────────────
   Rompe ligações — em massa (romperLigacoes) ou uma de cada vez com
   efeito visual de "elétron voando" (romperLigacaoComFlight).
   Depende de: core/estado-reacao.js, atoms/atomos-ligacoes-crud.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

function romperLigacoes() {
  state = "ACTIVATED";
  energyBtn.classList.remove("is-charging");
  energyBtn.disabled = true;
  atualizarRotuloBotaoEnergia();

  // só agora os átomos deixam de ser estáticos — a reação está
  // de fato começando, então passam a poder se mover/ser arrastados.
  atoms.forEach((a) => Matter.Body.setStatic(a.body, false));

  [...bonds.keys()].forEach((id) => romperLigacaoComFlight(id));

  atoms.forEach((a) => {
    Matter.Body.setVelocity(a.body, {
      x: a.body.velocity.x + (Math.random() - 0.5) * 5,
      y: a.body.velocity.y + (Math.random() - 0.5) * 5,
    });
  });

  document.getElementById("validateBtn").disabled = false;
  setStatus("Complexo ativado! Arraste os átomos livres para formar os produtos.", "warning");
}

// Remove uma ligação do mundo físico e anima seus elétrons compartilhados
// voando de volta para os átomos de origem (usado tanto na ruptura geral
// por energia de ativação quanto na ruptura manual por estiramento).
function romperLigacaoComFlight(bondId) {
  const ligacao = bonds.get(bondId);
  if (!ligacao) return;
  const a = atoms.get(ligacao.atomA), b = atoms.get(ligacao.atomB);
  for (let p = 0; p < ligacao.order; p++) {
    const pos = calcularPosicaoParLigacao(ligacao, p);
    if (ligacao.ionica) {
      const doador = atoms.get(ligacao.doador);
      spawnFlight(pos.cx, pos.cy, doador.body.position.x, doador.body.position.y);
    } else {
      spawnFlight(pos.cx + pos.px * 3, pos.cy + pos.py * 3, a.body.position.x, a.body.position.y);
      spawnFlight(pos.cx - pos.px * 3, pos.cy - pos.py * 3, b.body.position.x, b.body.position.y);
    }
  }
  removerLigacao(bondId);
}

