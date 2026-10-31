/* ═══════════════════════════════════════════════════════════════
   CAMADA: ORQUESTRAÇÃO
   ARQUIVO: orquestrador.js
   ───────────────────────────────────────────────────────────────
   atualizarSimulador() é o "maestro" chamado sempre que temperatura,
   pressão ou volume mudam: recalcula a física (transições efetivas),
   detecta se houve mudança de estado/fenômeno, anuncia a mudança ao
   leitor de tela e, por fim, chama — nesta ordem — todas as funções
   de renderização (temperatura, cilindro, manômetro, medidas).
   Depende de: core/fisica.js, core/estado-simulacao.js,
               a11y/acessibilidade.js (announce),
               todos os ui/render-*.js.
   Usado por: ui/eventos.js, ui/painel-substancias.js, main.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════
   ORQUESTRADOR PRINCIPAL
═══════════════════════════════════════════════════════ */
function atualizarSimulador(tempAnterior, pressaoMudou, volumeMudou) {
  var estadoAnterior = estado.estadoFisico || determinarEstado(estado.temperatura);
  if (tempAnterior !== undefined) estado._tempAnterior = tempAnterior;
  calcularTransicoesEfetivas();
  var estadoNovo = determinarEstado(estado.temperatura);
  var houveMudanca = estadoNovo !== estadoAnterior && estadoAnterior !== '';
  if (houveMudanca) {
    var subindo = tempAnterior !== undefined
      ? estado.temperatura >= tempAnterior
      : pressaoMudou
        ? estado.pressao < (estado._pressaoAnterior || estado.pressao)
        : estado.volume > (estado._volumeAnterior || estado.volume);
    var fen = detectarFenomeno(estadoAnterior, estadoNovo, subindo);
    if (fen && fen !== estado.fenomeno) {
      estado.fenomeno = fen;
      atualizarFenomeno(fen);
      var fenNomes = {
        FUSAO:'Fusão', SOLIDIFICACAO:'Solidificação',
        VAPORIZACAO:'Vaporização', CONDENSACAO:'Condensação',
        SUBLIMACAO:'Sublimação', RESSUBLIMACAO:'Deposição'
      };
      announce((fenNomes[fen]||fen) + ' detectada: ' +
        (estado.substancia ? estado.substancia.nome : '') + '.', 'polite');
    }
  }
  estado._pressaoAnterior = estado.pressao;
  estado._volumeAnterior  = estado.volume;
  atualizarDisplayTemperatura();
  atualizarTermometro();
  atualizarChapa();
  atualizarEmbolo();
  atualizarMateriaVisual();
  atualizarCursorTermico();
  atualizarManometro();
  atualizarMedidas();
  atualizarInfoPressaoEfetiva();
}
