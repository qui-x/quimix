/* ═══════════════════════════════════════════════════════════════
   CAMADA: LIGAÇÕES (módulo Estequiometria)
   ARQUIVO: formar-ligacao.js
   ───────────────────────────────────────────────────────────────
   O núcleo da formação de ligações: decide se dois átomos PODEM se
   ligar, calcula a carga resultante (para ligação iônica) e a
   posição de equilíbrio do par, e dispara o efeito visual de
   "elétron voando" até o novo local.
   Depende de: core/estado-reacao.js, atoms/atomos-ligacoes-crud.js.
   Usado por: interaction/arrastar.js, bonds/ruptura-avancada.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   11. FORMAÇÃO DE LIGAÇÕES (simples ou de ordem maior) + ELÉTRONS
   IMPORTANTE: permite arrastar o MESMO par de átomos novamente para
   aumentar a ordem da ligação (dupla/tripla) — necessário para montar
   corretamente O2/N2 reformados e o CO2 (duas ligações duplas C=O).
   --------------------------------------------------------------- */
function formarNovaLigacao(a, b) {
  const ehIonica = (a.tipo === "ionico" && b.tipo === "covalente") || (a.tipo === "covalente" && b.tipo === "ionico");
  const doador = ehIonica ? (a.tipo === "ionico" ? a : b) : null;
  const receptor = ehIonica ? (a.tipo === "ionico" ? b : a) : null;

  const existente = encontrarLigacaoEntre(a, b);
  let novaOrdem;

  if (existente) {
    existente.order += 1;
    existente.restLength *= 0.92; // ligações de ordem maior são mais curtas (aproximação didática)
    existente.constraint.length = existente.restLength;
    existente.constraint.stiffness = Math.min(0.85, existente.constraint.stiffness + 0.15);
    novaOrdem = existente.order;
    const pos = calcularPosicaoParLigacao(existente, existente.order - 1);
    if (ehIonica) {
      spawnFlight(doador.body.position.x, doador.body.position.y, pos.cx, pos.cy);
    } else {
      spawnFlight(a.body.position.x, a.body.position.y, pos.cx + pos.px * 3, pos.cy + pos.py * 3);
      spawnFlight(b.body.position.x, b.body.position.y, pos.cx - pos.px * 3, pos.cy - pos.py * 3);
    }
  } else {
    const distIdeal = (a.radiusPx + b.radiusPx) * RAIO_CAPTURA_MULT * 0.8;
    const dx = b.body.position.x - a.body.position.x, dy = b.body.position.y - a.body.position.y;
    const len = Math.hypot(dx, dy) || 1;
    Matter.Body.setPosition(b.body, {
      x: a.body.position.x + (dx / len) * distIdeal,
      y: a.body.position.y + (dy / len) * distIdeal,
    });
    Matter.Body.setVelocity(b.body, { x: 0, y: 0 });

    const nova = criarLigacao(a, b, 1, distIdeal, ehIonica ? { ionica: true, doador: doador.id, receptor: receptor.id } : null);
    novaOrdem = 1;
    const pos = calcularPosicaoParLigacao(nova, 0);
    if (ehIonica) {
      spawnFlight(doador.body.position.x, doador.body.position.y, pos.cx, pos.cy);
    } else {
      spawnFlight(a.body.position.x, a.body.position.y, pos.cx + pos.px * 3, pos.cy + pos.py * 3);
      spawnFlight(b.body.position.x, b.body.position.y, pos.cx - pos.px * 3, pos.cy - pos.py * 3);
    }
  }

  setStatus(mensagemPosLigacao(a, b, novaOrdem, ehIonica, doador, receptor), "info");
  verificarConclusao();
}

// Feedback didático: deixa explícito quando um átomo ainda tem elétrons
// livres após a ligação — é exatamente o caso do CO2 (cada C=O precisa
// de uma ligação DUPLA: arraste o mesmo par de novo para reforçá-la).
// Para ligação iônica, o texto deixa claro que houve TRANSFERÊNCIA
// completa (cátion/ânion), não compartilhamento.
function mensagemPosLigacao(a, b, novaOrdem, ehIonica, doador, receptor) {
  let msg;
  if (ehIonica) {
    msg = `${doador.elemento} transferiu 1 elétron para ${receptor.elemento}: ${doador.elemento}${formatarCarga(cargaAtual(doador))} + ${receptor.elemento}${formatarCarga(cargaAtual(receptor))} (ligação iônica).`;
  } else {
    const ordemTexto = { 1: "simples", 2: "dupla", 3: "tripla" }[novaOrdem] || `ordem ${novaOrdem}`;
    msg = `Ligação ${a.elemento}–${b.elemento} formada (${ordemTexto}).`;
  }
  const ra = slotsLivres(a), rb = slotsLivres(b);
  if (ra > 0 || rb > 0) {
    const partes = [];
    if (ra > 0) partes.push(`${a.elemento} ainda tem ${ra} elétron(s) ${a.tipo === "ionico" ? "doável(is)" : "livre(s)"}`);
    if (rb > 0) partes.push(`${b.elemento} ainda tem ${rb} elétron(s) ${b.tipo === "ionico" ? "doável(is)" : "livre(s)"}`);
    msg += ` ${partes.join(" e ")} — arraste o MESMO átomo de novo sobre o parceiro para reforçar, ou conecte a outro átomo livre.`;
  }
  return msg;
}

// Carga atual de um átomo iônico: cátion = elétrons já doados (positivo);
// ânion = elétrons já recebidos (negativo). Derivado das ligações reais.
function cargaAtual(atomo) {
  if (atomo.tipo === "ionico") {
    return [...atomo.bondIds].reduce((s, bid) => s + (bonds.get(bid).ionica ? bonds.get(bid).order : 0), 0);
  }
  const recebidos = [...atomo.bondIds].reduce((s, bid) => {
    const l = bonds.get(bid);
    return s + (l.ionica && l.receptor === atomo.id ? l.order : 0);
  }, 0);
  return -recebidos;
}

function formatarCarga(carga) {
  if (!carga) return "";
  const sinal = carga > 0 ? "+" : "−";
  const mag = Math.abs(carga);
  return mag > 1 ? `${mag}${sinal}` : sinal;
}

// Posição geométrica do par de elétrons nº `pairIndex` de uma ligação,
// junto com o vetor perpendicular usado para separar os 2 pontinhos.
// Em ligação iônica, o par fica todo do lado do RECEPTOR (como mais um
// par isolado seu) — não há "compartilhamento" no meio da ligação.
function calcularPosicaoParLigacao(ligacao, pairIndex) {
  const a = atoms.get(ligacao.atomA), b = atoms.get(ligacao.atomB);
  if (ligacao.ionica) {
    const receptor = atoms.get(ligacao.receptor);
    const doador = atoms.get(ligacao.doador);
    const dx = doador.body.position.x - receptor.body.position.x;
    const dy = doador.body.position.y - receptor.body.position.y;
    const anguloBase = Math.atan2(dy, dx) + (pairIndex - (ligacao.order - 1) / 2) * 0.6;
    const raioOrbita = receptor.radiusPx + 9;
    const cx = receptor.body.position.x + Math.cos(anguloBase) * raioOrbita;
    const cy = receptor.body.position.y + Math.sin(anguloBase) * raioOrbita;
    const px = -Math.sin(anguloBase), py = Math.cos(anguloBase);
    return { cx, cy, px, py };
  }
  const ax = a.body.position.x, ay = a.body.position.y, bx = b.body.position.x, by = b.body.position.y;
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const mx = (ax + bx) / 2, my = (ay + by) / 2;
  const espacamento = 9;
  const deslocamento = (pairIndex - (ligacao.order - 1) / 2) * espacamento;
  return { cx: mx + ux * deslocamento, cy: my + uy * deslocamento, px, py };
}

function spawnFlight(x0, y0, x1, y1) {
  flyingElectrons.push({ x0, y0, x1, y1, start: performance.now(), duration: 380 });
}

