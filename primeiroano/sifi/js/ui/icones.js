/* ═══════════════════════════════════════════════════════════════
   CAMADA: INTERFACE
   ARQUIVO: icones.js
   ORIGEM:  NOVO arquivo do SIFI. O SILQ usa emoji (🧲⚡🔗) como ícone
            nos painéis; aqui trocamos por SVG de linha (o MESMO
            estilo do ícone do cabeçalho e do chevron do accordion,
            que já eram SVG no SILQ) para o simulador ter uma cara
            mais "desenhada à mão"/profissional, e não depender da
            fonte de emoji do sistema operacional de cada usuário
            (que muda o desenho entre Windows/Mac/Android/iOS —
            um problema real de emoji que o SVG não tem).
   ───────────────────────────────────────────────────────────────
   SIFI.ICONS — objeto com o SVG (como texto) de cada ícone reusado
   em mais de um lugar da tela (ex.: o ícone do Módulo 1 aparece no
   cabeçalho do painel E no indicador flutuante do canvas).
   Definidos aqui uma única vez para não duplicar o desenho.

   SIFI.aplicarIcones() — procura todo elemento com o atributo
   `data-icon="nome"` no HTML e injeta o SVG correspondente dentro
   dele. Assim o HTML fica declarativo (`data-icon="lixeira"`) sem
   precisar escrever o SVG inteiro dentro do index-sifi.html.

   Ícones que MUDAM em tempo de execução (o ícone do indicador de
   módulo ativo, que troca conforme o módulo) não usam data-icon —
   são preenchidos diretamente via `.innerHTML = SIFI.ICONS.xxx`
   onde são trocados (ver js/init/ativacao-modulos.js).
   Depende de: js/core/namespace.js.
   Usado por: js/init/inicializacao-sifi.js (chama aplicarIcones),
              js/init/ativacao-modulos.js (indicador de módulo).
═══════════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* Todo ícone é <svg> só com viewBox (sem width/height fixo) — quem
     define o tamanho é o CSS (.panel-icon svg, .btn-icon svg...),
     e a cor sempre é `currentColor`, então o ícone herda a cor do
     texto ao redor automaticamente (funciona em tema claro, escuro,
     alto contraste, e nas cores por força/módulo, sem precisar de
     uma versão do desenho por cor). */
  SIFI.ICONS = {
    // Menu hambúrguer (gaveta esquerda no mobile)
    hamburguer: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/>
    </svg>`,

    // Gráfico de barras — "controles" / "Força Detectada" (gaveta direita no mobile)
    controles: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="5" y1="20" x2="5" y2="12"/><line x1="12" y1="20" x2="12" y2="7"/><line x1="19" y1="20" x2="19" y2="15"/>
    </svg>`,

    // Módulo 1 — duas partículas se atraindo (mesmo desenho do logo do cabeçalho)
    modulo1: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
      <circle cx="6.5" cy="12" r="3.3" stroke-width="1.4" fill="currentColor" fill-opacity="0.15"/>
      <circle cx="17.5" cy="12" r="3.3" stroke-width="1.4" fill="currentColor" fill-opacity="0.15"/>
      <line x1="9.8" y1="12" x2="14.2" y2="12" stroke-width="1.4" stroke-dasharray="1.6 1.6"/>
    </svg>`,

    // Módulo 2 — termômetro
    modulo2: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 14.5V5.5a2 2 0 1 0-4 0v9a3.5 3.5 0 1 0 4 0Z"/>
      <line x1="9.6" y1="7.5" x2="11.4" y2="7.5"/><line x1="9.6" y1="10" x2="11.4" y2="10"/><line x1="9.6" y1="12.5" x2="11.4" y2="12.5"/>
    </svg>`,

    // Módulo 3 — erlenmeyer (tubo de ensaio de laboratório)
    modulo3: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M9.5 3h5"/>
      <path d="M10.2 3v6.3L5.7 18a2 2 0 0 0 1.8 2.9h9c1.5 0 2.5-1.6 1.8-2.9L13.8 9.3V3"/>
      <path d="M7.7 14.8h8.6"/>
    </svg>`,

    // Fechar / desativar (×)
    fechar: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
    </svg>`,

    // Biblioteca — livro
    biblioteca: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z"/>
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z"/>
    </svg>`,

    // Átomo — órbitas eletrônicas (usado no cabeçalho "Interação Atual")
    atomo: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/>
      <ellipse cx="12" cy="12" rx="9" ry="3.6"/>
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/>
      <ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>
    </svg>`,

    // Lixeira — "Limpar canvas"
    lixeira: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="4.5" y1="7" x2="19.5" y2="7"/>
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7"/>
      <path d="M6.5 7 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7"/>
      <line x1="10" y1="11" x2="10" y2="16.5"/><line x1="14" y1="11" x2="14" y2="16.5"/>
    </svg>`,
  };

  /* Injeta os ícones em todo elemento com data-icon="nome" — chamado
     uma vez na inicialização (inicializacao-sifi.js). Recebe "root"
     opcional para permitir aplicar só dentro de um pedaço específico
     do DOM, se algum dia for preciso (ex.: um painel montado depois). */
  SIFI.aplicarIcones = function aplicarIcones(root) {
    (root || document).querySelectorAll('[data-icon]').forEach(el => {
      const nome = el.dataset.icon;
      if (SIFI.ICONS[nome]) el.innerHTML = SIFI.ICONS[nome];
    });
  };
});
