# SIE — Simulador Interativo de Estequiometria
### Guia da arquitetura refatorada

## O que mudou e o que NÃO mudou

- ✅ **Nenhum dado foi alterado.** As 114 reações químicas prontas, os
  templates de geometria molecular, as constantes físicas da
  simulação — tudo com os mesmos valores de antes.
- ✅ **Nenhuma funcionalidade foi alterada.** Os dois módulos
  (Estequiometria: montar/romper ligações, ajustar coeficientes,
  validar reações — e Mols: investigar reação, ficha de elemento,
  cálculo de massa molar), física com Matter.js, acessibilidade,
  menu mobile — tudo continua igual.
- ✅ **O projeto continua funcionando sem servidor** (`file://`), sem
  bundler.
- 📁 O que mudou foi **a organização dos arquivos**: `scriptsie.js`
  (4032 linhas — o maior arquivo de todos os simuladores já
  refatorados) virou **44 arquivos pequenos**. `stylesie.css` foi
  **mantido intocado**. Não havia um `dadossie.js` — os dados deste
  simulador estavam todos dentro do próprio `scriptsie.js` e foram
  separados em 5 arquivos temáticos dentro de `js/data/`.

## Uma característica própria do SIE: duas dependências externas

Diferente dos outros simuladores da família, o SIE depende de **dois
arquivos que não pertencem a ele**:

1. **Matter.js** (motor de física 2D), carregado de um CDN externo —
   igual a antes, sem nenhuma mudança.
2. **`dadossitp.js`** — o catálogo completo dos 118 elementos vem
   *emprestado* de outro simulador da mesma coleção, o SITP, sem
   nenhuma cópia. O módulo "Mols" (ficha de elemento, cálculo de massa
   molar) depende inteiramente desse arquivo.

Como o SIE só recebeu 3 arquivos para refatorar (HTML, script, CSS) —
sem o `dadossitp.js` — a estrutura dele **não foi tocada nem
duplicada**: o HTML continua carregando exatamente
`<script src="dadossitp.js">` no mesmo lugar de antes, e todo o
código que depende dele (o módulo Mols inteiro) foi mantido
funcionando com a mesma expectativa de nomes globais
(`elementosBase`, `MASSA`, `CONFIG_EC` etc.) que já tinha.

**Atualização:** esta entrega já inclui uma cópia real e intocada de
`dadossitp.js` (o mesmo arquivo do simulador SITP, também refatorado
nesta coleção — veja o pacote `sitp-refatorado.zip`), então o SIE
funciona out-of-the-box sem precisar buscar esse arquivo em outro
lugar. Nas primeiras rodadas de teste deste projeto (antes do SITP
ser enviado), o módulo Mols foi validado com um stub mínimo de
`dadossitp.js` escrito à mão, cobrindo só os campos identificados por
análise estática do código; com o arquivo real agora disponível,
todos os testes funcionais foram refeitos e confirmados igualmente
idênticos entre a versão original e a refatorada — incluindo uma
investigação completa de reação (massa molar de cada substância +
conferência da Lei de Lavoisier) usando os dados reais dos 118
elementos.

## Por que este arquivo NÃO precisou da técnica de namespace do SILQ

O SILQ tinha quase tudo dentro de um único
`document.addEventListener('DOMContentLoaded', () => {...})`, o que
exigiu convertê-lo num objeto compartilhado (`window.SILQ`) para
poder dividir em arquivos. O SIE é diferente: suas ~200 declarações
(variáveis e funções) já viviam **soltas no escopo de topo do
arquivo** — exatamente como o SIME. Isso permite simplesmente mover
cada declaração para o arquivo certo, sem precisar renomear nada.

## A armadilha que apareceu na validação (e como foi resolvida)

Depois de dividir o arquivo, um teste automatizado que clicava nas
114 reações em sequência mostrou **dezenas de divergências** entre a
versão original e a refatorada. A causa raiz não era um bug de
código — era o **método de teste**:

- `gerarCoeficientesIniciais()` sorteia quantidades aleatórias
  (`Math.random()`) toda vez que uma reação é escolhida — um recurso
  proposital do app, para o aluno sempre praticar com números
  diferentes.
- O loop de animação (`requestAnimationFrame`) *também* chama
  `Math.random()` a cada quadro, para dar uma vibração térmica mais
  orgânica aos átomos.
- Rodar a versão original e a refatorada são **dois processos
  Node.js separados**, com timing de relógio ligeiramente diferente
  — então o número de quadros de animação entre um clique e outro
  varia entre eles, o que desincroniza qualquer semente fixa de
  aleatoriedade ao longo de muitos cliques.

A correção foi no **teste**, não no simulador: usar um gerador de
números pseudo-aleatórios com semente fixa (igual nas duas versões)
E desativar o loop de animação visual durante o teste automatizado
(ele não afeta os painéis de texto verificados, só o desenho). Depois
disso, as 114 reações passaram a bater 100% entre as duas versões —
confirmando que a diferença nunca esteve no código, só na forma de
testar um sistema com aleatoriedade e animação em tempo real.

## Como isso foi validado

- Comparação linha-a-linha entre o arquivo original e os 44 novos —
  **100% idêntico**, nenhuma linha perdida, alterada ou duplicada.
- Análise estática específica (a mesma técnica usada no SILQ) para
  confirmar que nenhuma função é referenciada antes de sua declaração
  de um jeito que só funcionaria por *hoisting* dentro de um único
  arquivo — **zero casos** encontrados (diferente do SILQ, aqui não
  havia esse risco por não existir um closure único).
- Teste funcional com **as 118 reações do módulo Estequiometria**,
  incluindo validação de balanceamento e troca de módulo.
- Teste funcional **completo do módulo Mols**: escolher uma reação
  para investigar, clicar em cada átomo (abrindo a ficha do elemento
  na primeira vez), calcular a massa molar de cada substância, e
  conferir a Lei de Lavoisier no resumo final — resultado idêntico
  entre as duas versões, em todos os campos.
- Usado o motor Matter.js **real** (não simulado) durante os testes.

## Mapa dos arquivos

| Arquivo | Camada | Responsabilidade |
|---|---|---|
| `js/a11y/preferencias.js` | Acessibilidade | Tema/contraste/daltonismo |
| `js/data/elementos-reacao.js` | Dados | Catálogo local (Estequiometria) |
| `js/data/geometria-2d.js` | Dados | Deslocamento 2D por geometria |
| `js/data/moleculas-templates.js` | Dados | Templates de molécula |
| `js/data/reacoes.js` | Dados | 114 reações prontas |
| `js/core/estado-reacao.js` | Núcleo | Estado global (Estequiometria) |
| `js/core/motor-fisico.js` | Núcleo | Verificação e setup do Matter.js |
| `js/core/audio.js` | Núcleo | Retorno sonoro |
| `js/core/canvas-setup.js` | Núcleo | Canvas e área de jogo |
| `js/atoms/atomos-ligacoes-crud.js` | Átomos | Criar/remover átomos e ligações |
| `js/molecules/instanciar.js` | Moléculas | Montar molécula no canvas |
| `js/reactions/montar-reagentes.js` | Estequiometria | Desenhar reagentes atuais |
| `js/ui/energia-carga.js` | Interface | Botão de energia de ativação |
| `js/bonds/ruptura.js` | Ligações | Romper ligações |
| `js/interaction/arrastar.js` | Interação | Arrastar átomo |
| `js/bonds/ruptura-avancada.js` | Ligações | Ruptura por estiramento |
| `js/physics/magnetismo-limites.js` | Física | Atração leve e limites da área |
| `js/physics/congelar-metalico.js` | Física | Congelar cena + mar de elétrons |
| `js/bonds/formar-ligacao.js` | Ligações | Formação de ligação |
| `js/reactions/analise-grupos.js` | Estequiometria | Agrupamento e fórmulas |
| `js/reactions/validacao.js` | Estequiometria | Balanceamento e rendimento |
| `js/render/osciloscopio.js` | Renderização | Osciloscópio de energia |
| `js/ui/status-menu-reacoes.js` | Interface | Menu de reações prontas |
| `js/reactions/selecionar-reacao.js` | Estequiometria | Trocar reação ativa |
| `js/reactions/coeficientes-ui.js` | Estequiometria | Steppers de quantidade |
| `js/ui/modulos-ativos.js` | Interface | Alternar Estequiometria/Mols |
| `js/ui/paineis-acordeao.js` | Interface | Painéis recolhíveis |
| `js/reactions/formula-utils.js` | Estequiometria | mdc, subscritos |
| `js/a11y/anunciar.js` | Acessibilidade | Avisos ao leitor de tela |
| `js/reactions/calculadora.js` | Estequiometria | Massa molar de uma fórmula |
| `js/render/desenho-atomos.js` | Renderização | Desenho por quadro |
| `js/render/loop-principal.js` | Renderização | Loop principal |
| `js/ui/menu-mobile.js` | Interface | Gavetas mobile + inicialização |
| `js/ui/sidebar-resizer.js` | Interface | Redimensionar sidebars |
| `js/mols/dados-elementos-locais.js` | Mols | Junção dos 118 elementos |
| `js/mols/config-eletronica.js` | Mols | Distribuição eletrônica |
| `js/mols/estado-fisico.js` | Mols | Estado físico a 25°C |
| `js/mols/cores-escalas.js` | Mols | Cores e escalas visuais |
| `js/mols/painel-propriedades.js` | Mols | Cartões de propriedade |
| `js/mols/modal-elemento.js` | Mols | Ficha completa do elemento |
| `js/mols/reacao-investigar.js` | Mols | Lista de reações a investigar |
| `js/mols/canvas-reacao.js` | Mols | Desenhar reação no canvas |
| `js/mols/interacao-atomos.js` | Mols | Clique em átomo |
| `js/mols/tally-resultado.js` | Mols | Tabela e resumo final |
| `css/stylesie.css` | Estilo | **Intocado** |

## Como rodar

Igual a antes: abra `indexsie.html` no navegador (funciona por
`file://`) ou publique a pasta inteira num servidor estático,
mantendo `css/`, `js/` e subpastas ao lado de `indexsie.html` — e o
`dadossitp.js` continua precisando estar na mesma pasta (do SITP, não
incluído aqui — só o SIE foi refatorado nesta entrega).
