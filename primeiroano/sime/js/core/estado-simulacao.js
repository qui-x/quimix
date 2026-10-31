/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO (estado mutável em tempo de execução)
   ARQUIVO: estado-simulacao.js
   ───────────────────────────────────────────────────────────────
   Diferente dos arquivos em js/data/ (que são catálogos fixos),
   este arquivo guarda os DOIS objetos que mudam a cada interação
   do usuário:
     • estado      → temperatura, pressão, volume, substância ativa
                      e o estado físico atual da amostra.
     • TRANSICOES  → ponto de fusão/ebulição EFETIVOS (já recalculados
                      pela física de Clausius-Clapeyron em função de
                      P e V). Começa com os valores da água (0/100°C)
                      e é atualizado por core/fisica.js sempre que
                      uma substância é selecionada ou um controle
                      muda.
   Depende de: data/limites.js (valores padrão iniciais).
   Usado por: praticamente todos os módulos de ui/ e o orquestrador.
═══════════════════════════════════════════════════════════════ */

'use strict';

var estado = {
  temperatura:      LIMITES.temperatura.padrao,
  volume:           LIMITES.volume.padrao,
  pressao:          LIMITES.pressaoRef,
  estadoFisico:     '',
  fenomeno:         null,
  substancia:       null,
  /* Módulo físico ativo na sidebar esquerda ('gasoso'|'liquido'|'solido'
     ou null se nenhum estiver ativado). Filtra a lista de substâncias
     do painel direito — ver ui/painel-modulos.js. */
  modulo:           null,
  _tempAnterior:    25,
  _pressaoAnterior: 1.0,
  _volumeAnterior:  60,
  _fenTimer:        null,
};

/* ─── TRANSIÇÕES (dinâmico — atualizado ao selecionar substância) ─── */
var TRANSICOES = { fusao: 0, ebulicao: 100 };
