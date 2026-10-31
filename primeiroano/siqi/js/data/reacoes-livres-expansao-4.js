/* ═══════════════════════════════════════════════════════════════
   CAMADA: DADOS
   ARQUIVO: reacoes-livres-expansao-4.js
   ───────────────────────────────────────────────────────────────
   Esvaziado — bug real, achado numa verificação exaustiva contra os
   100 compostos: este arquivo (apesar do nome "reações") continha na
   verdade os mesmos 42 compostos do bloco "EXPANSÃO 4 — 47 novos
   compostos" que também foram portados pra
   js/data/catalogo-compostos.js (ver comentário lá). No arquivo
   monolítico original, esse bloco de compostos ficava fisicamente
   intercalado no meio de seções de reações — a separação automática
   por arquivo, feita na modularização, associou esse bloco a este
   arquivo por proximidade física, não por conteúdo real (confirmado:
   zero ocorrências de `REACOES_LIVRES[` aqui, e uma de
   `CATALOGO_SIQI.push`). Resultado: cada um desses 42 compostos
   aparecia DUAS VEZES no catálogo (uma vez daqui, outra de
   catalogo-compostos.js) — CATALOGO_SIQI.length virava 147 em vez de
   100, causando resultados de busca duplicados na Biblioteca e
   comportamento imprevisível nos módulos que dependem de fórmulas
   únicas (Construtor, visualização 2D/3D da Estrutura Molecular).
   Removido daqui; os 42 compostos continuam intactos (uma única vez)
   em catalogo-compostos.js.
   Depende de: nada (arquivo intencionalmente vazio).
═══════════════════════════════════════════════════════════════ */

'use strict';
