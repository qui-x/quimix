/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: menu-mobile.js
   ───────────────────────────────────────────────────────────────
   As duas gavetas laterais em telas estreitas (☰ reações prontas,
   🎛 análise estequiométrica), atalhos de teclado (Escape fecha
   gavetas, Alt+número alterna módulo) — e a INICIALIZAÇÃO do
   simulador: primeira renderização do menu de reações, das
   quantidades, da pílula de status, e o disparo do
   requestAnimationFrame(animate) que começa a simulação.
   ⚠ Este é o arquivo mais próximo de um "main.js" que o módulo
   Estequiometria tem — deve carregar por último dentre os arquivos
   desse módulo (antes só do redimensionador de sidebars).
   Depende de: praticamente tudo do módulo Estequiometria.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   18. RESPONSIVIDADE — sidebars como gavetas em telas pequenas
   Em telas largas as sidebars ficam sempre visíveis (como já eram). Em
   telas estreitas (mobile/tablet retrato) elas viram gavetas escondidas
   por padrão, abertas pelos botões do cabeçalho ou fechadas tocando no
   overlay/Esc — sem isso, não haveria espaço de tela para o canvas.
   --------------------------------------------------------------- */
/* Mesmo contrato dos outros 19 simuladores: os pares botao+painel vem de
   ids padronizados, o estado aberto e a classe .mobile-open no PROPRIO
   painel (nao mais uma classe no <body>), e o backdrop usa o atributo
   [hidden]. O .filter() no fim deixa a funcao tolerante: se algum id nao
   existir, aquele par simplesmente nao entra, sem quebrar a pagina. */
const mobileBackdrop = document.getElementById("mobile-backdrop");

const gavetasMobile = [
  { btn: document.getElementById("mobile-info-btn"), el: document.getElementById("sidebar-left") },
  { btn: document.getElementById("mobile-menu-btn"), el: document.getElementById("sidebar-right") },
].filter((g) => g.btn && g.el);

function fecharSidebarsMobile() {
  gavetasMobile.forEach((g) => {
    g.el.classList.remove("mobile-open");
    g.btn.setAttribute("aria-expanded", "false");
  });
  if (mobileBackdrop) mobileBackdrop.hidden = true;
}

function abrirSidebarMobile(g) {
  fecharSidebarsMobile();
  g.el.classList.add("mobile-open");
  g.btn.setAttribute("aria-expanded", "true");
  if (mobileBackdrop) mobileBackdrop.hidden = false;
}

gavetasMobile.forEach((g) => {
  g.btn.addEventListener("click", () => {
    g.el.classList.contains("mobile-open") ? fecharSidebarsMobile() : abrirSidebarMobile(g);
  });
});

if (mobileBackdrop) mobileBackdrop.addEventListener("click", fecharSidebarsMobile);

addEventListener("keydown", (e) => { if (e.key === "Escape") fecharSidebarsMobile(); });

// Atalhos de teclado — mesmo padrão do SIMA (Alt+1 a Alt+5 pros
// modelos). O SIE só tem 2 módulos, então só Alt+1/Alt+2.
addEventListener("keydown", (e) => {
  if (!e.altKey) return;
  const modulos = ["estequiometria", "mols"];
  const indice = { "1": 0, "2": 1 }[e.key];
  if (indice === undefined) return;
  e.preventDefault();
  document.querySelector(`.mode-activate-btn[data-modulo="${modulos[indice]}"]`)?.click();
});

// Ao escolher uma reação ou tocar no canvas em mobile, fecha a gaveta
// automaticamente — o usuário já fez sua escolha, a tela deve voltar
// para a simulação em si.
document.getElementById("reactionMenu").addEventListener("click", () => {
  if (innerWidth <= BREAKPOINT_MOBILE) fecharSidebarsMobile();
});

canvas.addEventListener("pointerdown", () => {
  if (innerWidth <= BREAKPOINT_MOBILE) fecharSidebarsMobile();
}, { passive: true });

/* ---------------------------------------------------------------
   19. INICIALIZAÇÃO
   --------------------------------------------------------------- */
/* Antes: selecionarReacao("water") — montava a agua no canvas sem o
   aluno ter pedido. Agora so o menu e renderizado; o canvas espera. */
renderizarMenuReacoes();

renderizarQuantidades(); // mostra o placeholder "Escolha uma reação…" já na carga, em vez do <!-- comentário --> cru

setStatus('Escolha uma reação em "Reações Prontas" para montar os reagentes no canvas.');

atualizarModeIndicator(); // estado inicial: nenhum módulo ativo, pílula escondida

requestAnimationFrame(animate);

