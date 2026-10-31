/* ═══════════════════════════════════════════════════════════════
   CAMADA: FÍSICA (módulo Estequiometria)
   ARQUIVO: congelar-metalico.js
   ───────────────────────────────────────────────────────────────
   "Congela" a cena (para o osciloscópio de energia pós-validação) e
   toda a física do "mar de elétrons" da ligação metálica: elétrons
   deslocalizados se movendo livremente entre os cátions metálicos.
   Depende de: core/estado-reacao.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

// Ao validar com sucesso, a montagem deve parecer DEFINITIVA — sem
// nenhum resquício de vibração/oscilação do solver físico nem da
// rotação decorativa dos elétrons. Em vez de só "parar de aplicar
// forças" (o que ainda deixa um pouco de inércia/jitter residual do
// solver de constraints), congela os corpos como estáticos e fixa o
// timestamp usado pela órbita dos elétrons — visual 100% imóvel.
function congelarCena() {
  atoms.forEach((a) => {
    Matter.Body.setVelocity(a.body, { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(a.body, 0);
    Matter.Body.setStatic(a.body, true);
  });
  tempoCongelado = performance.now();
}

// Ligação metálica: átomos do mesmo retículo se atraem entre si (sem
// relação com valência/octeto — é o que diferencia o "mar de elétrons"
// da ligação covalente/iônica) para formar um aglomerado compacto.
function aplicarMagnetismoMetalico() {
  const metalicos = [...atoms.values()].filter((a) => a.tipo === "metalico" && !a.isDragging);
  for (let i = 0; i < metalicos.length; i++) {
    for (let j = i + 1; j < metalicos.length; j++) {
      const a = metalicos[i], b = metalicos[j];
      const dist = Math.hypot(b.body.position.x - a.body.position.x, b.body.position.y - a.body.position.y);
      const raioAtracao = (a.radiusPx + b.radiusPx) * 3.2;
      if (dist > raioAtracao || dist < 1) continue;
      const nudge = 0.12 * (1 - dist / raioAtracao);
      const ux = (b.body.position.x - a.body.position.x) / dist, uy = (b.body.position.y - a.body.position.y) / dist;
      Matter.Body.translate(a.body, { x: ux * nudge, y: uy * nudge });
      Matter.Body.translate(b.body, { x: -ux * nudge, y: -uy * nudge });
    }
  }
}

// "Mar de elétrons": pontos amarelos deslocalizados que vagam livremente
// por toda a região ocupada pelos átomos metálicos — não pertencem a
// nenhum átomo específico (ao contrário dos elétrons de valência
// covalentes/iônicos), refletindo a condutividade/maleabilidade do metal.
let metallicElectrons = [];

function inicializarEletronsMetalicos() {
  const n = Math.max(8, atoms.size * 2);
  metallicElectrons = Array.from({ length: n }, () => ({
    x: 0, y: 0, vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6, posicionado: false,
  }));
}

function atualizarEletronsMetalicos() {
  if (metallicElectrons.length === 0 || atoms.size === 0) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  atoms.forEach((a) => {
    minX = Math.min(minX, a.body.position.x); maxX = Math.max(maxX, a.body.position.x);
    minY = Math.min(minY, a.body.position.y); maxY = Math.max(maxY, a.body.position.y);
  });
  const margem = 26;
  minX -= margem; maxX += margem; minY -= margem; maxY += margem;

  metallicElectrons.forEach((e) => {
    if (!e.posicionado) {
      e.x = minX + Math.random() * (maxX - minX);
      e.y = minY + Math.random() * (maxY - minY);
      e.posicionado = true;
    }
    e.vx = Math.max(-2, Math.min(2, e.vx + (Math.random() - 0.5) * 0.3));
    e.vy = Math.max(-2, Math.min(2, e.vy + (Math.random() - 0.5) * 0.3));
    e.x += e.vx; e.y += e.vy;
    if (e.x < minX) { e.x = minX; e.vx *= -1; }
    if (e.x > maxX) { e.x = maxX; e.vx *= -1; }
    if (e.y < minY) { e.y = minY; e.vy *= -1; }
    if (e.y > maxY) { e.y = maxY; e.vy *= -1; }
  });
}

function dibujarEletronsMetalicos() {
  metallicElectrons.forEach((e) => { if (e.posicionado) desenharPontoEletron(e.x, e.y); });
}

