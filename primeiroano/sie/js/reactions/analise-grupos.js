/* ═══════════════════════════════════════════════════════════════
   CAMADA: ESTEQUIOMETRIA (análise)
   ARQUIVO: analise-grupos.js
   ───────────────────────────────────────────────────────────────
   Agrupa os átomos/ligações formados no canvas em "grupos
   moleculares" (o que está fisicamente conectado), identifica
   moléculas incompletas, calcula a fórmula resultante de cada grupo
   e verifica se a montagem do aluno já corresponde a uma substância
   válida da reação.
   Depende de: core/estado-reacao.js, bonds/logica-ligacoes.js.
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ---------------------------------------------------------------
   12. VALIDAÇÃO (Lavoisier + octeto/duteto) E HUD DINÂMICO
   --------------------------------------------------------------- */
function atomoEhExcessoElementarValido(a) {
  return a.bondIds.size === 0 && ELEMENTOS_MONOATOMICOS.has(a.elemento);
}

function listarIncompletos() {
  return [...atoms.values()].filter((a) => slotsLivres(a) > 0 && !atomoEhExcessoElementarValido(a));
}

function calcularGrupos() {
  const visitado = new Set();
  const grupos = [];
  atoms.forEach((atomo) => {
    if (visitado.has(atomo.id)) return;
    const pilha = [atomo.id];
    const grupo = [];
    while (pilha.length) {
      const id = pilha.pop();
      if (visitado.has(id)) continue;
      visitado.add(id);
      const at = atoms.get(id);
      grupo.push(at);
      at.bondIds.forEach((bid) => {
        const lig = bonds.get(bid);
        const outro = lig.atomA === id ? lig.atomB : lig.atomA;
        if (!visitado.has(outro)) pilha.push(outro);
      });
    }
    grupos.push(grupo);
  });
  return grupos;
}

// Gera a string de fórmula (ex.: "CO2", "H2O") a partir de uma contagem de
// átomos por elemento — usada tanto para grupos reais na cena (abaixo)
// quanto para o produto de uma equação gerada pela tabela periódica.
function formulaDeContagem(contagem) {
  let formula = "";
  ELEMENT_ORDER.forEach((el) => { if (contagem[el]) formula += el + (contagem[el] > 1 ? contagem[el] : ""); });
  return formula || "?";
}

// Analisa um grupo conectado (BFS de ligações reais) e o expressa como
// MÚLTIPLOS de uma unidade de fórmula mínima, reduzindo pelo MDC dos
// átomos de cada elemento. Isso é ESSENCIAL para ligação iônica: ao
// contrário da covalente (onde o octeto trava cada átomo em exatamente
// 1 molécula discreta), uma rede iônica pode legitimamente conectar
// várias "unidades de fórmula" num só bloco (ex.: 4 Al + 6 O ligados
// entre si = quimicamente 2× Al2O3, não uma fórmula "Al4O6" errada).
// Sem essa redução, montagens corretas eram rejeitadas sempre que o
// multiplicador da equação (ξ) exigia mais de 1 unidade do composto.
function analisarGrupo(grupo) {
  const contagem = {};
  grupo.forEach((a) => { contagem[a.elemento] = (contagem[a.elemento] || 0) + 1; });

  // A redução só faz sentido (e só é necessária) para compostos com 2+
  // elementos distintos — ligações covalentes homonucleares (H2, O2...)
  // já são auto-limitadas pelo octeto/duteto e NUNCA devem ser reduzidas
  // (o MDC de um único valor é ele mesmo, o que reduziria "H2" para "H"
  // incorretamente).
  const elementosDistintos = Object.keys(contagem);
  let g = 1;
  if (elementosDistintos.length >= 2) {
    const valores = Object.values(contagem);
    g = valores.reduce((acc, v) => mdc(acc, v));
    if (!g || g < 1) g = 1;
  }

  const reduzido = {};
  Object.entries(contagem).forEach(([el, n]) => { reduzido[el] = n / g; });
  const formula = formulaDeContagem(reduzido);
  const massaUnidade = Object.entries(reduzido).reduce((soma, [el, n]) => soma + ELEMENTS[el].molar * n, 0);
  return { formula, multiplicidade: g, massaUnidade };
}

// A funcao atualizarEquacaoGlobal foi REMOVIDA junto com o #globalEquation.
// Ela era a quarta copia da mesma equacao na tela. A equacao agora existe
// uma unica vez, no #eqBuilder, e e editavel.

function verificarConclusao() {
  if (listarIncompletos().length === 0 && state === "ACTIVATED") {
    setStatus('Todos os átomos saturados! Clique em "Validar Montagem" para concluir.', "info");
  }
}

