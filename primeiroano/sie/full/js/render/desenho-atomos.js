/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO (módulo Estequiometria)
   ARQUIVO: desenho-atomos.js
   ───────────────────────────────────────────────────────────────
   Tudo o que é desenhado no canvas a cada quadro: a cor da ligação
   conforme seu caráter (iônica/covalente), os elétrons ao redor de
   cada átomo (livres e de ligação, orbitando), a própria ligação
   (linha/traço conforme o tipo), o átomo em si (círculo, símbolo,
   anel de carga) e os "elétrons voando" durante a formação/quebra de
   ligação.
   Depende de: core/estado-reacao.js, core/canvas-setup.js.
   Usado por: render/loop-principal.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   16. RENDERIZAÇÃO 2D — átomos, ligações e elétrons
   --------------------------------------------------------------- */
function corLigacaoAtual(l) {
  if (l.ionica) return "rgba(255, 107, 203, 0.8)"; // eletrostática — cor própria, distinta do par compartilhado
  const integ = l.integrity ?? 1;
  const t = Math.max(0, Math.min(1, 1 - integ));
  const [r, g, b] = lerpColorRgb([240, 207, 76], [255, 71, 87], t);
  return `rgb(${r},${g},${b})`;
}

function desenharPontoEletron(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 2.1, 0, Math.PI * 2);
  ctx.fillStyle = "#ffe066";
  ctx.fill();
}

// posições (ângulos) dos pares isolados + elétrons livres em volta do átomo
function calcularPontosOrbita(atomo, agora) {
  const livres = slotsLivres(atomo);
  const totalGrupos = atomo.lonePairs + Math.max(0, livres);
  if (totalGrupos <= 0) return [];
  const baseAngle = atomo.phase + agora * 0.0003;
  const passo = (Math.PI * 2) / totalGrupos;
  const pontos = [];
  let idx = 0;
  for (let i = 0; i < atomo.lonePairs; i++) { pontos.push({ ang: baseAngle + passo * idx, tipo: "par" }); idx++; }
  for (let i = 0; i < Math.max(0, livres); i++) { pontos.push({ ang: baseAngle + passo * idx, tipo: "livre" }); idx++; }
  return pontos;
}

function dibujarLigacao(l) {
  const a = atoms.get(l.atomA), b = atoms.get(l.atomB);
  if (!a || !b) return;
  ctx.beginPath();
  if (l.ionica) ctx.setLineDash([5, 4]);
  ctx.moveTo(a.body.position.x, a.body.position.y);
  ctx.lineTo(b.body.position.x, b.body.position.y);
  ctx.strokeStyle = corLigacaoAtual(l);
  ctx.lineWidth = l.ionica ? 1.6 : 3 + l.order * 1.4;
  ctx.lineCap = "round";
  ctx.stroke();
  if (l.ionica) ctx.setLineDash([]);
}

function dibujarAtomo(a) {
  const def = ELEMENTS[a.elemento];
  const p = a.body.position;

  ctx.beginPath();
  ctx.arc(p.x, p.y, a.radiusPx, 0, Math.PI * 2);
  ctx.fillStyle = def.colorCss;
  ctx.fill();

  if (a === candidatoAtual) {
    ctx.beginPath(); ctx.arc(p.x, p.y, a.radiusPx + 4, 0, Math.PI * 2);
    ctx.strokeStyle = "#2ecc9a"; ctx.lineWidth = 2.5; ctx.stroke();
  } else if (state === "ACTIVATED" && slotsLivres(a) > 0 && !atomoEhExcessoElementarValido(a)) {
    ctx.beginPath(); ctx.arc(p.x, p.y, a.radiusPx + 3, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,140,66,0.55)"; ctx.lineWidth = 1.5; ctx.stroke();
  } else if (moduloAtivo === "mols" && a.molsFormula !== undefined && molsSubstancias[a.molsFormula]) {
    // Anel de status da investigação: tracejado âmbar = ainda não
    // descoberto/contado; verde sólido = contado, com o número da
    // ocorrência ao lado (mesma cor --accent-green usada no anel de
    // "candidato a ligação" acima, para não introduzir uma terceira cor
    // de destaque no canvas). O registro é por SUBSTÂNCIA — o mesmo
    // símbolo em duas substâncias diferentes (ex.: H em H₂ e H em HCl)
    // tem contagens independentes.
    const registro = molsSubstancias[a.molsFormula].contagem[a.elemento];
    const contada = registro.contadosIdx.has(a.molsIndice);
    ctx.beginPath();
    ctx.arc(p.x, p.y, a.radiusPx + 4, 0, Math.PI * 2);
    ctx.strokeStyle = contada ? "#2ecc9a" : "#ff8c42";
    ctx.lineWidth = contada ? 2.5 : 2;
    if (!contada) ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (contada) {
      const numero = [...registro.contadosIdx].indexOf(a.molsIndice) + 1;
      // Escala com o átomo (átomos do Mols são menores — MOLS_ESCALA),
      // com piso mínimo pra continuar legível mesmo no H, o menor de todos.
      const raioBadge = Math.max(6, Math.min(8, a.radiusPx * 0.55));
      const fonteBadge = Math.max(8, Math.min(10, a.radiusPx * 0.62));
      const bx = p.x + a.radiusPx * 0.72, by = p.y - a.radiusPx * 0.72;
      ctx.beginPath(); ctx.arc(bx, by, raioBadge, 0, Math.PI * 2);
      ctx.fillStyle = "#2ecc9a"; ctx.fill();
      ctx.fillStyle = "#06170b";
      ctx.font = `700 ${fonteBadge}px 'Consolas', 'Monaco', monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(String(numero), bx, by + 0.5);
    }
  }

  ctx.fillStyle = def.textColor;
  ctx.font = `700 ${Math.max(10, a.radiusPx * 0.85)}px 'Consolas', 'Monaco', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(a.elemento, p.x, p.y + 1);

  if (a.tipo === "ionico" || (a.tipo === "covalente" && cargaAtual(a) !== 0)) {
    const carga = cargaAtual(a);
    if (carga !== 0) {
      const rotulo = formatarCarga(carga);
      ctx.font = `700 ${Math.max(9, a.radiusPx * 0.5)}px 'Consolas', 'Monaco', monospace`;
      ctx.fillStyle = carga > 0 ? "#ff8c42" : "#ff6bcb";
      ctx.textAlign = "left";
      ctx.fillText(rotulo, p.x + a.radiusPx * 0.55, p.y - a.radiusPx * 0.55);
    }
  }
}

function dibujarElectronesLivres(a, agora) {
  const raioOrbita = a.radiusPx + 9;
  calcularPontosOrbita(a, agora).forEach((pt) => {
    const cx = a.body.position.x + Math.cos(pt.ang) * raioOrbita;
    const cy = a.body.position.y + Math.sin(pt.ang) * raioOrbita;
    if (pt.tipo === "par") {
      const perpX = -Math.sin(pt.ang), perpY = Math.cos(pt.ang);
      desenharPontoEletron(cx + perpX * 2.6, cy + perpY * 2.6);
      desenharPontoEletron(cx - perpX * 2.6, cy - perpY * 2.6);
    } else {
      desenharPontoEletron(cx, cy);
    }
  });
}

function dibujarElectronesLigacao(l) {
  for (let p = 0; p < l.order; p++) {
    const pos = calcularPosicaoParLigacao(l, p);
    desenharPontoEletron(pos.cx + pos.px * 3, pos.cy + pos.py * 3);
    desenharPontoEletron(pos.cx - pos.px * 3, pos.cy - pos.py * 3);
  }
}

function dibujarFlights(agora) {
  flyingElectrons = flyingElectrons.filter((f) => agora - f.start < f.duration);
  flyingElectrons.forEach((f) => {
    const t = Math.min(1, (agora - f.start) / f.duration);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    desenharPontoEletron(f.x0 + (f.x1 - f.x0) * ease, f.y0 + (f.y1 - f.y0) * ease);
  });
}

