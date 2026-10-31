# Estrutura de Lewis no QuímiX — como foi construída e como reutilizar

Este documento descreve o modelo de Lewis do SIQC (Química do Carbono, 3º ano) e serve de guia para o **SIRO — Reações Orgânicas**, que vai usar o mesmo modelo para as setas curvas dos mecanismos.

Arquivos envolvidos, todos em `terceiroano/carbono/`:

| Arquivo | Papel |
|---|---|
| `js/core/grafo-molecular.js` | a molécula como grafo; valência efetiva com carga e radical |
| `js/core/lewis.js` | **o modelo**: contabilidade de elétrons, arranjo 2D, as duas setas |
| `js/render/representacoes.js` | o desenho da representação eletrônica de Lewis |
| `docs/estrutura-de-lewis.md` | este documento |

O modelo (`lewis.js`) não desenha nem lê o DOM. O desenho só lê o resultado do modelo. Essa separação é o que permite ao SIRO usar o modelo com outro desenho — com setas por cima, por exemplo.

---

## 1. A ideia central: Lewis é contabilidade, não desenho

Uma estrutura de Lewis responde a uma pergunta só: **onde estão os elétrons de valência de cada átomo?** Eles estão em dois lugares:

- em **pares ligantes**, compartilhados com um vizinho (cada ligação simples é um par; a dupla, dois; a tripla, três);
- em **pares não ligantes** (pares isolados), que são só do átomo.

O modelo guarda essa contabilidade átomo por átomo. Carga formal, octeto e pares isolados saem dela por conta.

## 2. As grandezas de cada átomo

| Símbolo | Nome no código | O que é |
|---|---|---|
| V | `valencia` | elétrons de valência do elemento (tabela na seção 3) |
| B | `ligantes` | pares ligantes em que o átomo participa = soma das ordens das ligações + H implícitos |
| N | `naoLigantes` | elétrons não ligantes (só dele) |
| q | `cargaFormal` | carga formal |
| r | `desemparelhados` | elétrons desemparelhados (radical); quase sempre 0 |

A relação que amarra tudo é a **definição de carga formal**:

```
q = V − N − B          ⇔          N = V − B − q
```

Daí saem:

- **pares isolados** = (N − r) / 2
- **elétrons em volta do átomo** = 2B + N — cada par ligante conta inteiro para os dois átomos da ligação
- **regra**: 8 (octeto) para todos, 2 (dueto) para o H

Um átomo com 2B + N menor que a regra tem octeto **incompleto** (carbocátion: 6). O modelo não esconde isso: marca como problema, porque é exatamente o que torna a espécie reativa.

## 3. Elétrons de valência

| H | C | N | O | S | P | F | Cl | Br | I |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 4 | 5 | 6 | 6 | 5 | 7 | 7 | 7 | 7 |

## 4. Valência efetiva: quantos H um átomo carrega

O H é implícito no grafo: cada átomo "completa" a própria valência com H. Com carga ou radical, a valência muda, e com ela a quantidade de H. A regra está em `Grafo.prototype.valenciaEfetiva`:

```
C e H ................ padrão − |carga| − radical
N, O, S, halogênios .. padrão + carga − radical
```

| Espécie | Átomo | Valência efetiva | H implícitos |
|---|---|---|---|
| metano CH₄ | C, q = 0 | 4 | 4 |
| carbocátion CH₃⁺ | C, q = +1 | 3 | 3 |
| carbânion CH₃⁻ | C, q = −1 | 3 | 3 |
| radical metila CH₃• | C, r = 1 | 3 | 3 |
| amônio NH₄⁺ | N, q = +1 | 4 | 4 |
| oxônio H₃O⁺ | O, q = +1 | 3 | 3 |
| hidróxido OH⁻ | O, q = −1 | 1 | 1 |
| cloreto Cl⁻ | Cl, q = −1 | 0 | 0 |

Até esta versão, o campo `carga` existia no átomo mas era multiplicado por zero na valência — o editor só monta moléculas neutras. Com carga 0 e sem radical, o resultado é a valência de sempre, então nada mudou para o editor.

## 5. Exemplos resolvidos

Valores conferidos pelo teste do modelo (seção 11).

| Molécula | Átomo | V | B | N | pares | q | em volta |
|---|---|---|---|---|---|---|---|
| metano | C | 4 | 4 | 0 | 0 | 0 | 8 |
| eteno | C | 4 | 4 | 0 | 0 | 0 | 8 |
| metanol | O | 6 | 2 | 4 | 2 | 0 | 8 |
| clorometano | Cl | 7 | 1 | 6 | 3 | 0 | 8 |
| metanal | O | 6 | 2 | 4 | 2 | 0 | 8 |
| acetonitrila | N | 5 | 3 | 2 | 1 | 0 | 8 |
| metilamina | N | 5 | 3 | 2 | 1 | 0 | 8 |
| carbocátion CH₃⁺ | C | 4 | 3 | 0 | 0 | +1 | **6** |
| carbânion CH₃⁻ | C | 4 | 3 | 2 | 1 | −1 | 8 |
| radical CH₃• | C | 4 | 3 | 1 | 0 (+1 elétron só) | 0 | 7 |
| metóxido CH₃O⁻ | O | 6 | 1 | 6 | 3 | −1 | 8 |
| oxônio H₃O⁺ | O | 6 | 3 | 2 | 1 | +1 | 8 |
| cloreto Cl⁻ | Cl | 7 | 0 | 8 | 4 | −1 | 8 |

Exemplo de molécula inteira — **etanol**, C₂H₅OH: V total = 2 × 4 + 6 + 6 × 1 = **20** elétrons. São 8 pares ligantes (C–C, C–O, O–H e 5 C–H) = 16 elétrons, mais 2 pares isolados no O = 4 elétrons. Total 20.

## 6. Qual é a fonte de verdade

O modelo funciona em dois modos, e o SIRO precisa saber qual usar.

**Modo padrão — a carga manda.** A carga fica no átomo (`a.carga`, 0 se ausente) e N é calculado: `N = V − B − q`. É o modo do editor do SIQC.

**Modo explícito — os elétrons mandam.** Se o átomo tiver `a.naoLigantes` definido, N vem dali e a carga é calculada: `q = V − N − B`. Serve para o SIRO conferir um estado em que alguém moveu elétrons "à mão".

A recomendação para o SIRO é **não** usar o modo explícito no dia a dia: use as duas setas da seção 9, que atualizam a carga e mantêm tudo no modo padrão. O modo explícito existe para depuração e para testes.

## 7. A conferência — o que ela pega e o que não pega

`analisar()` confere que a soma dos V (contando cada H) menos a carga total é igual aos elétrons contados (2 × pares ligantes + soma dos N).

**Essa conferência é uma identidade nos dois modos.** No modo explícito, se alguém puser N = 6 no O do metanol, o modelo não vê "elétrons criados": calcula carga −2 para o O, e a soma fecha. A carga absorve a diferença.

O que realmente denuncia elétrons criados ou destruídos é **a carga total do sistema mudar**. Uma seta só move elétrons; nunca muda a carga total. Por isso:

```js
var antes = Q3.Lewis.analisar(g).cargaTotal;
// ... uma seta ...
var depois = Q3.Lewis.analisar(g, { cargaEsperada: antes });
// depois.problemas traz { tipo: 'carga', ... } se a carga total mudou
```

A primeira versão do comentário do modelo prometia que a soma pegaria o erro. O teste mostrou que não pega, e a verificação foi trocada pela de carga total. O caso ficou no teste para não voltar.

## 8. Como se desenha

### 8.1 Os bastões e os pares

Na representação eletrônica, **cada bastão carrega exatamente um par de elétrons**, desenhado sobre ele:

- ligação simples → um bastão com um par;
- dupla → dois bastões paralelos, um par em cada;
- tripla → três bastões, um par em cada.

A vista continua "eletrônica" — os elétrons aparecem —, e a conectividade fica visível. O aluno vê que **cada traço da fórmula estrutural é um par de elétrons**, que é a notação das setas no SIRO. O bastão é fino e o par vai por cima, com um recorte na cor do fundo: os elétrons são o assunto.

A primeira versão desenhava só os pontos, sem bastão; a conectividade entre os carbonos se perdia, especialmente em moléculas maiores.

### 8.2 Onde ficam os H, os pares isolados e a carga

`Q3.Lewis.arranjo2D(g, analise, T)` devolve, para cada átomo, as **direções** (ângulos, com y para baixo) de cada item em volta dele. A ordem de ocupação dos vãos entre as ligações é:

1. **H implícitos** — com o mesmo algoritmo da estrutural completa, para os H ficarem no mesmo lugar nas duas representações;
2. **pares isolados** — nos vãos que sobraram;
3. **elétron desemparelhado**;
4. **sinal da carga formal** — no maior vão restante.

O algoritmo de vão (`Q3.Lewis.distribuir`) põe cada item onde ficaria **mais espaço** depois de colocado: o vão que maximiza `tamanho / (itens + 2)`. Consequências que batem com os livros:

- CH₃ na ponta: três H a 90° entre si, formando um tridente;
- CH₂ no meio da cadeia (vizinhos a 120°): os dois H vão juntos para o vão de 240°, para **fora** do ângulo, e não um dentro e outro fora;
- OH: o H oposto ao C, e os dois pares isolados um de cada lado;
- halogênio: os três pares a 90° entre si.

### 8.3 A linha de contagem

Na vista de Lewis, uma linha acima da dica mostra a contagem — "20 elétrons de valência · 8 pares ligantes · 2 pares isolados · todos os octetos completos" — ou o primeiro problema encontrado. Contar elétrons é o que essa representação ensina.

## 9. Roteiro para o SIRO: as duas setas

Toda seta curva de um mecanismo polar do Ensino Médio é uma destas duas, ou uma seguida da outra. As duas estão implementadas e testadas em `lewis.js`.

### Seta 1 — um par isolado vira ligação: `formarComPar(g, doador, aceptor)`

```
doador:  N − 2, B + 1  ⇒  carga + 1
aceptor: N igual, B + 1 ⇒  carga − 1
```

Exemplo, **protonação do metanol**: CH₃OH + H⁺ → CH₃OH₂⁺

```js
var h = g.addAtomo('H'); g.atomos[h].carga = 1;     // o próton, explícito
Q3.Lewis.formarComPar(g, idDoO, h);
// O: carga +1, 3 ligações, 1 par isolado  ·  H: neutro
// o H original do OH continua lá (1 H implícito no O)
```

### Seta 2 — uma ligação se quebra e o par fica com um átomo: `quebrarPara(g, a, b, fica)`

```
fica:  N + 2, B − 1  ⇒  carga − 1
outro: N igual, B − 1 ⇒  carga + 1
```

Exemplo, **heterólise do cloreto de terc-butila**: (CH₃)₃C–Cl → (CH₃)₃C⁺ + Cl⁻

```js
Q3.Lewis.quebrarPara(g, idDoC, idDoCl, idDoCl);
// C: carga +1, 6 elétrons (octeto incompleto)  ·  Cl: carga −1, 4 pares
```

### As duas em sequência — a ligação π ataca um eletrófilo

A seta que sai de uma dupla C=C e vai até o H⁺ (primeira etapa da adição de HX a um alceno) é a seta 2 seguida da seta 1:

```js
Q3.Lewis.quebrarPara(g, c1, c2, c2);   // o par π fica com C2
Q3.Lewis.formarComPar(g, c2, h);       // e C2 o usa para ligar o H⁺
// C1 vira carbocátion (+1, 6 elétrons); C2 fica neutro, com 3 H
```

### Por que a ordem das atualizações importa

A carga define a valência efetiva no grafo. O O neutro do metanol só aceita 2 ligações; se a ligação nova fosse criada antes de a carga virar +1, o grafo a recusaria. Por isso as duas funções **gravam a carga nova antes** de mexer na ligação — e, para desfazer, restauram a carga antes de religar.

### O que as setas recusam

Ambas devolvem `null`, **sem alterar nada**, quando a seta é impossível:

- o doador não tem par isolado (o C do metano não doa);
- o aceptor passaria do octeto (um C saturado não aceita par);
- a mudança alteraria a quantidade de H implícitos de algum átomo — sinal de que a seta não corresponde a um passo químico válido.

No SIRO, uma seta recusada é o momento de explicar ao aluno **por que** ela não acontece.

### O que o SIRO deve conferir a cada passo

1. a seta foi aceita (não devolveu `null`);
2. `analisar(g, { cargaEsperada })` não traz problema do tipo `'carga'`;
3. os problemas do tipo `'incompleto'` que sobrarem são os esperados (carbocátions intermediários).

## 10. O que o modelo não faz

- **Ressonância**: desenha uma estrutura de Kekulé (o benzeno com três duplas alternadas). Não há híbrido de ressonância.
- **Octeto expandido** (S e P com mais de 8): não modelado.
- **Escolha de carga pela conectividade**: a carga vem do estado, nunca é deduzida. Se um N tem 4 ligações, é porque alguém gravou carga +1 nele.
- **Setas de radical** (meia-seta, um elétron): o modelo aceita radicais (`a.radical`), mas as primitivas de seta cobrem só o movimento de pares.

## 11. Testes

`teste-lewis.js` (fora do projeto entregue) confere, com 34 verificações:

- as oito moléculas neutras da seção 5 e a contagem do etanol;
- os seis íons e o radical;
- o modo explícito e a conferência de carga total;
- as duas setas, cada uma com a conservação de carga;
- as setas impossíveis recusadas sem alterar o grafo;
- a sequência π → H⁺ do eteno.

Qualquer mudança em `lewis.js` ou na valência efetiva do grafo deve passar por esse teste antes de ir para o SIQC ou para o SIRO.
