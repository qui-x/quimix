/* ═══════════════════════════════════════════════════════════════
   CAMADA: RENDERIZAÇÃO (orquestração)
   ARQUIVO: loop-principal.js
   ───────────────────────────────────────────────────────────────
   draw() desenha um quadro completo (delega para
   render/desenho-atomos.js) e animate() é o loop principal
   (requestAnimationFrame) que atualiza a física do Matter.js e chama
   draw() a cada quadro.
   Depende de: core/motor-fisico.js, render/desenho-atomos.js.
   Usado por: js/ui/menu-mobile.js (dispara requestAnimationFrame(animate)
              na inicialização).
═══════════════════════════════════════════════════════════════ */

'use strict';

function draw() {
  // Os elétrons (desenho puramente decorativo, baseado em performance.now())
  // continuam girando mesmo após a validação — quem fica fisicamente
  // imóvel são os átomos (corpos estáticos via congelarCena()), não o
  // desenho dos elétrons.
  const agora = performance.now();
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  bonds.forEach((l) => dibujarLigacao(l));
  atoms.forEach((a) => dibujarAtomo(a));
  atoms.forEach((a) => dibujarElectronesLivres(a, agora));
  bonds.forEach((l) => dibujarElectronesLigacao(l));
  dibujarFlights(agora);
  dibujarEletronsMetalicos();
  desenharOsciloscopio();
}

/* ---------------------------------------------------------------
   17. LOOP PRINCIPAL (física + render)
   --------------------------------------------------------------- */
let last = performance.now();

function animate(now) {
  const dt = Math.min(now - last, 50); // ms
  last = now;

  if (state === "CHARGING") {
    if (chargingHeld) {
      charge = Math.min(EA_NECESSARIA, charge + CARGA_POR_SEGUNDO * (dt / 1000));
      aplicarVibracao(charge / EA_NECESSARIA);
      if (charge >= EA_NECESSARIA) romperLigacoes();
    } else {
      charge = Math.max(0, charge - DECAIMENTO_POR_SEGUNDO * (dt / 1000));
      aplicarVibracao(charge / EA_NECESSARIA);
      if (charge === 0) {
        state = "IDLE";
        bonds.forEach((l) => { l.integrity = 1; });
        setStatus('Energia de ativação dissipada — os reagentes voltaram ao estado de repouso. Segure "Fornecer Energia de Ativação" novamente para retomar.', "info");
      }
    }
  }

  if (state === "ACTIVATED") {
    aplicarMagnetismoAmbiente();
    aplicarMagnetismoMetalico();
    atualizarEletronsMetalicos();
  }
  if (state !== "VALIDATED") manterDentroDosLimites();

  Matter.Engine.update(engine, dt);
  draw();
  requestAnimationFrame(animate);
}

