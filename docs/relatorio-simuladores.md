# Relatório dos simuladores (QRel)

Documento de referência do relatório que **cresce sozinho** enquanto o aluno usa um simulador.
Inspirado no relatório do SIAB (Ácido-Base), mas com um **envelope comum** para todos os simuladores.

- Núcleo compartilhado: `relatorio-core.js` + `relatorio-core.css` (na raiz, como o `a11y.js`).
- Um **adaptador** por simulador. Piloto: SIRO → `terceiroano/reacoes/js/simulation/relatorio-siro.js`.

## Decisões tomadas (piloto)

| Tema | Decisão |
|---|---|
| Onde fica | Só no navegador do aluno (`localStorage`, chave `quimix_relatorios_v1`). Nada vai a servidor. |
| Como leva o trabalho | Arquivo `.json` (baixar/abrir) ou impressão (preenchido ou em branco, para escrever à mão). |
| Falha de armazenamento | Guarda na memória e **avisa** o aluno. Nunca perde em silêncio. |
| Relatório em uso | Um por simulador **por aba** (`sessionStorage`). Sobrevive a recarregar a página. |
| Vazio | Relatório sem nenhum registro, texto ou identificação é descartado ao fechar. |
| Segurança | Todo texto passa por `QRel.esc()`. Arquivo importado é validado, limitado e nunca sobrescreve um relatório existente. |

Fica para depois: envio ao backend do Quimix (exige novas ações no Apps Script e cuidado com LGPD, pois o relatório tem nome e turma de alunos possivelmente menores).

## O envelope (igual para todos)

```json
{
  "schema": 1, "id": "rel_…", "simulador": "SIRO",
  "criado": "ISO", "atualizado": "ISO", "origem": "livre",
  "proposta":      { "titulo": "", "objetivo": "", "pergunta": "" },
  "identificacao": { "nome": "", "turma": "", "data": "", "professor": "", "grupo": "" },
  "registros": [ { "t": "ISO", "tipo": "seta", "...": "dados do simulador" } ],
  "autoral": { "observacoes": "", "analise": "", "interpretacao": "", "resposta": "", "conclusao": "" }
}
```

Regras dos `registros`: cada um tem `t` (hora) e `tipo`. **Os nomes `t` e `tipo` são reservados** (qualquer dado com esses nomes é descartado; por isso a classificação da reação se chama `classificacao`). Teto de 3000 registros por relatório.

## Como um simulador novo entra (3 passos)

1. **Carregar** em `index.html`: `relatorio-core.css`, `relatorio-core.js` (depois do `a11y.js`) e o adaptador; e colocar no cabeçalho o botão `<button class="header-relatorio" id="btn-relatorio">…</button>`.
2. **Registrar**: no adaptador, chamar `QRel.registrar('SIGLA', 'tipo', {dados})` quando o aluno *fizer* algo. Sempre dentro de `try/catch`: o relatório **nunca** pode quebrar o simulador.
3. **Mostrar**: `QRel.adaptador('SIGLA', { base: {proposta:{…}}, secoes: function (rel, ctx) { return [{ titulo, html }]; } })`. Use `ctx.esc()` em todo texto.

Regra de ouro: o relatório guarda o que o aluno **fez**, não o que ele apenas viu na tela.

## Adaptador do SIRO

Não edita `modulo-mecanismo.js`: "envolve" os métodos da classe (`carregar`, `_acrescentar`, `aplicar`, `_animar`, `acao`) e anota o resultado.

| Tipo de registro | Quando |
|---|---|
| `tentativa` | 1ª ação do aluno depois de escolher a reação / recomeçar / mudar catalisador ou ar. Guarda módulo, reação e condições. |
| `seta` | seta desenhada (arrasto ou toque), com descrição e se é farpa |
| `recusa` | a química recusou o passo, com o **motivo** (ex.: "C ficaria com mais de 8 elétrons") |
| `passo` | passo aplicado (após a animação): setas usadas, o que aconteceu, se ficou estável |
| `resultado` | produto, fórmula, `classificacao`, nome na literatura, `igualLiteratura` |
| `literatura` | `aberta` / `concluida` (permite saber se consultou **antes** de concluir) |
| `seta-desfeita`, `setas-limpas`, `voltar`, `faisca` | correções e a faísca da combustão |

Cada registro de uma tentativa leva `tent` (o número). O relatório agrupa por esse número, então alternar entre módulos não mistura as tentativas. Seções mostradas: *Tentativas e resultados* (tabela) e *Registro passo a passo*.

## Verificado (navegador real, Chromium)

Reação completa por arrasto e por toque; só ativar o módulo não registra nada; alternar módulos; recusa da química; literatura antes/depois; hidrogenação (sem setas); combustão (ar e faísca); recarregar a página; exportar, importar, arquivo inválido e arquivo malicioso (nenhum script executa); impressão em PDF; celular (390 px). Regressão: as 62 reações do SIRO continuam rodando.

**Não verificado:** impressão real pelo diálogo do navegador (testei o PDF por emulação de mídia de impressão), leitor de tela, toque em aparelho físico.
