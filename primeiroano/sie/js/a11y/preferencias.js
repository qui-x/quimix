/* ═══════════════════════════════════════════════════════════════
   CAMADA: ACESSIBILIDADE
   ARQUIVO: preferencias.js
   ───────────────────────────────────────────────────────────────
   Receptor de preferências de acessibilidade (tema, contraste,
   daltonismo, leitura simples, redução de movimento, espaçamento e
   escala de fonte) vindas da URL ou por postMessage da Central de
   Simuladores. Mesmo padrão usado nos outros simuladores da família.
   Depende de: nada (roda assim que a página carrega).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ====================================================================
   SIMULADOR DE ESTEQUIOMETRIA — script.js (versão 100% 2D)
   Renderização: Canvas 2D puro (sem WebGL/Three.js).
   Física: Matter.js (motor de corpos rígidos 2D), ligações modeladas
   como constraints elásticos (lei de Hooke) com comprimento ajustável
   em tempo real — permite a vibração/ruptura sem depender de força
   bruta, evitando problemas de calibração entre massa/força.
   Elétrons: cada átomo carrega pares isolados (fixos) e elétrons de
   valência livres (desenhados como pontos amarelos órbitando o núcleo).
   Ao formar/romper uma ligação, os elétrons voam visivelmente entre o
   átomo e o ponto médio da ligação (par compartilhado).
   ==================================================================== */

/* ════════════════════════════════════════════════════════════════
   ACESSIBILIDADE — CONTRATO DO LABORATÓRIO VIRTUAL
   ─────────────────────────────────────────────────────────────────
   Recebe os parâmetros de URL enviados pelo hub ao abrir o simulador:
     ?theme=dark|light          → data-theme no <html>
     &contrast=true|false       → data-contrast="on" no <html>
     &fontscale=0.75..1.5       → --font-scale no <html>
     &spacing=true|false        → data-spacing="on" no <html>
     &motion=true|false         → data-motion="on" no <html>
     &reading=on|off            → data-reading="on" no <html>
     &colorblind=none|protanopia|deuteranopia|tritanopia|acromatopsia
                                → #colorblindOverlay (backdrop-filter)
   Também escuta postMessage do hub para atualizações em tempo real
   sem recarregar a página (quando o usuário muda a preferência após
   abrir o simulador via iframe ou navegação com histórico).
   NÃO há controles próprios aqui — a escolha é sempre feita no hub.
   ════════════════════════════════════════════════════════════════ */
(function iniciarA11y() {
  const html = document.documentElement;
  const COLORBLIND_OK = ["protanopia", "deuteranopia", "tritanopia", "acromatopsia"];

  function aplicar(params) {
    /* tema */
    const theme = params.get("theme");
    if (theme === "light" || theme === "dark") html.setAttribute("data-theme", theme);

    /* alto contraste */
    const contrast = params.get("contrast");
    html.setAttribute("data-contrast", contrast === "true" ? "on" : "off");

    /* escala de fonte */
    const fs = parseFloat(params.get("fontscale"));
    if (!isNaN(fs) && fs >= 0.75 && fs <= 1.5) {
      html.style.setProperty("--font-scale", fs);
    }

    /* espaçamento de letras */
    const spacing = params.get("spacing");
    html.setAttribute("data-spacing", spacing === "true" ? "on" : "off");

    /* reduzir animações */
    const motion = params.get("motion");
    html.setAttribute("data-motion", motion === "true" ? "on" : "off");

    /* leitura simples */
    const reading = params.get("reading");
    html.setAttribute("data-reading", reading === "on" ? "on" : "off");

    /* daltonismo — overlay fixo com backdrop-filter (não body.style.filter,
       que quebraria elementos position:fixed/absolute do simulador) */
    const cb = params.get("colorblind");
    const overlay = document.getElementById("colorblindOverlay");
    if (overlay) {
      const val = (cb && COLORBLIND_OK.includes(cb)) ? "url(#f-" + cb + ")" : "none";
      overlay.style.backdropFilter = val;
      overlay.style.webkitBackdropFilter = val;
    }
  }

  /* --- aplica na abertura via URL --- */
  const url = new URLSearchParams(location.search);
  if ([...url.keys()].length > 0) aplicar(url);

  /* --- escuta atualizações em tempo real do hub via postMessage --- */
  window.addEventListener("message", (e) => {
    if (!e.data || e.data.source !== "central-simuladores" || e.data.type !== "a11y-update") return;
    const p = e.data.payload || {};
    const map = new URLSearchParams({
      theme:      p.theme      ?? "",
      contrast:   String(p.contrast ?? false),
      fontscale:  String(p.fontScale ?? 1),
      spacing:    String(p.spacing   ?? false),
      motion:     String(p.motion    ?? false),
      reading:    p.reading    ?? "off",
      colorblind: p.colorblind ?? "none",
    });
    aplicar(map);
  });
})();

