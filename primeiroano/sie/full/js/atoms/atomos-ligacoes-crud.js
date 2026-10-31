/* ═══════════════════════════════════════════════════════════════
   CAMADA: ÁTOMOS (módulo Estequiometria)
   ARQUIVO: atomos-ligacoes-crud.js
   ───────────────────────────────────────────────────────────────
   Criação e remoção de átomos como corpos rígidos do Matter.js
   (criarAtomo), criação/remoção/busca de ligações (criarLigacao,
   removerLigacao, encontrarLigacaoEntre), quantos "slots" de ligação
   um átomo ainda tem livres (valência), e a limpeza completa da cena.
   Depende de: core/estado-reacao.js, core/motor-fisico.js,
               data/elementos-reacao.js.
   Usado por: praticamente todos os módulos de física/ligação.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   7. FÁBRICA DE ÁTOMOS E LIGAÇÕES
   --------------------------------------------------------------- */
// escala: multiplicador opcional do raio (default 1 = tamanho normal,
// o que a Estequiometria sempre usou). O módulo Mols passa um valor
// menor pra caber mais substâncias na tela sem ficar ilegível — ver
// MOLS_ESCALA mais abaixo.
function criarAtomo(elemento, pos, escala = 1) {
  const id = "a" + (atomIdSeq++);
  const def = ELEMENTS[elemento];
  const radiusPx = def.radius * PX_POR_ANGSTROM * escala;

  const body = Matter.Bodies.circle(pos.x, pos.y, radiusPx, {
    restitution: 0, // sem ricochete em colisões — átomos se tocam e simplesmente param/escorregam
    friction: 0.02,
    frictionAir: 0.06,
    inertia: Infinity, // trava a rotação — círculos não precisam girar e isso simplifica o desenho dos elétrons
  });
  Matter.Composite.add(engine.world, body);

  const atomo = {
    id, elemento, body, radiusPx,
    tipo: def.tipo,
    valenceMax: def.valence,
    lonePairs: def.lonePairs,
    bondIds: new Set(),
    phase: Math.random() * Math.PI * 2,
    isDragging: false,
  };
  atoms.set(id, atomo);
  return atomo;
}

function criarLigacao(atomoA, atomoB, order, comprimentoIdeal, opcoes) {
  opcoes = opcoes || {};
  const id = "b" + (bondIdSeq++);
  const constraint = Matter.Constraint.create({
    bodyA: atomoA.body,
    bodyB: atomoB.body,
    length: comprimentoIdeal,
    stiffness: Math.min(0.85, 0.3 + order * 0.18),
    damping: 0.2,
  });
  Matter.Composite.add(engine.world, constraint);

  const ligacao = {
    id, atomA: atomoA.id, atomB: atomoB.id, order, constraint, restLength: comprimentoIdeal, integrity: 1,
    ionica: !!opcoes.ionica,
    doador: opcoes.doador || null,   // id do átomo que cede o(s) elétron(s) — só em ligação iônica
    receptor: opcoes.receptor || null,
  };
  bonds.set(id, ligacao);
  atomoA.bondIds.add(id);
  atomoB.bondIds.add(id);
  return ligacao;
}

function removerLigacao(id) {
  const ligacao = bonds.get(id);
  if (!ligacao) return;
  Matter.Composite.remove(engine.world, ligacao.constraint);
  const a = atoms.get(ligacao.atomA);
  const b = atoms.get(ligacao.atomB);
  if (a) a.bondIds.delete(id);
  if (b) b.bondIds.delete(id);
  bonds.delete(id);
}

function encontrarLigacaoEntre(a, b) {
  for (const id of a.bondIds) if (b.bondIds.has(id)) return bonds.get(id);
  return null;
}

// Nº de elétrons de valência ainda livres (não comprometidos em nenhuma
// ligação) — calculado a partir das ligações reais, nunca armazenado à
// parte, eliminando qualquer risco de desincronização desse contador.
function slotsLivres(atomo) {
  const usados = [...atomo.bondIds].reduce((soma, bid) => soma + bonds.get(bid).order, 0);
  return atomo.valenceMax - usados;
}

/* ---------------------------------------------------------------
   8. MONTAGEM DE MOLÉCULAS A PARTIR DOS GABARITOS
   --------------------------------------------------------------- */
function limparCena() {
  [...bonds.keys()].forEach((id) => removerLigacao(id));
  atoms.forEach((a) => Matter.Composite.remove(engine.world, a.body));
  atoms.clear();
  atomIdSeq = 0;
  bondIdSeq = 0;
  flyingElectrons = [];
  metallicElectrons = [];
}

