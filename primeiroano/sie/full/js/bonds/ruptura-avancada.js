/* ═══════════════════════════════════════════════════════════════
   CAMADA: LIGAÇÕES (módulo Estequiometria)
   ARQUIVO: ruptura-avancada.js
   ───────────────────────────────────────────────────────────────
   Rompe ligações automaticamente quando esticadas além do limite
   físico (arrastar um átomo com força), e encontra o átomo
   compatível mais próximo de um ponto (usado ao soltar um átomo
   arrastado, para decidir se forma ligação).
   Depende de: core/estado-reacao.js, bonds/logica-ligacoes.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Permite desfazer uma montagem errada: se o átomo arrastado for puxado
// além do limiar de distância da(s) sua(s) ligação(ões) atual(is), a
// ligação se rompe (com a mesma animação de elétrons voltando para o
// átomo de origem), liberando-o para ser reorganizado em outra parte.
function romperLigacoesPorEstiramento(atomo) {
  const idsParaRomper = [];
  atomo.bondIds.forEach((bid) => {
    const ligacao = bonds.get(bid);
    const a = atoms.get(ligacao.atomA), b = atoms.get(ligacao.atomB);
    const dist = Math.hypot(a.body.position.x - b.body.position.x, a.body.position.y - b.body.position.y);
    if (dist > ligacao.restLength * LIMIAR_RUPTURA_MANUAL) idsParaRomper.push(bid);
  });
  if (idsParaRomper.length === 0) return;
  idsParaRomper.forEach((bid) => romperLigacaoComFlight(bid));
  setStatus("Ligação desfeita — reorganize os átomos para corrigir a montagem.", "warning");
}

function encontrarCandidatoProximo(origem) {
  let melhor = null, menorDist = Infinity;
  atoms.forEach((alvo) => {
    if (alvo.id === origem.id) return;
    if (slotsLivres(origem) <= 0 || slotsLivres(alvo) <= 0) return;
    const dist = Math.hypot(alvo.body.position.x - origem.body.position.x, alvo.body.position.y - origem.body.position.y);
    const raioAtracao = (origem.radiusPx + alvo.radiusPx) * RAIO_ATRACAO_MULT;
    if (dist <= raioAtracao && dist < menorDist) { menorDist = dist; melhor = alvo; }
  });
  return melhor;
}

