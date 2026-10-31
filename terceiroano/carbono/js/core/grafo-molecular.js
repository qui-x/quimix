/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO COMPARTILHADO DO 3º ANO
   ARQUIVO: comum/js/core/grafo-molecular.js
   ───────────────────────────────────────────────────────────────
   O GRAFO MOLECULAR ORGÂNICO — estrutura de dado e regras.

   POR QUE ESTE ARQUIVO EXISTE, E POR QUE É COMPARTILHADO
   A especificação do 3º ano manda reaproveitar o editor do SIQC em
   seis lugares diferentes:
     SIFO M2  "herda o editor de grafo do SIQC"
     SIRO     "reaproveita o grafo do SIQC como dado"
     SIIS M1  "cada slot, um editor completo herdado do SIQC" (×6)
     SIPT M1  "banco infinito, reaproveitando o SIQC"
     SIPT M2  craqueamento = quebrar ligação e redistribuir
     SIQB M1  cadeia de monômeros
   Escrito dentro do SIQC, viraria seis cópias divergentes — o mesmo
   problema que já custou caro no projeto. Mora em comum/ para que
   uma correção de valência valha para os oito de uma vez.

   O QUE ELE É
   Só o DADO e as REGRAS: átomos, ligações, valência, anéis,
   classificação, fórmula, forma canônica. Zero DOM, zero canvas,
   zero física. Quem desenha é outra camada (render/), quem arrasta é
   outra (ui/). Isso é o que permite testá-lo fora do navegador e
   reaproveitá-lo tanto num editor visual quanto num gerador de
   candidatas que roda em segundo plano.

   O QUE ELE NÃO É
   Não é motor de física. A spec é explícita no SIQC M1:
   "posicionamento geométrico direto pela tabela de ângulos por
   hibridização (não física contínua) — determinístico, sempre fiel à
   literatura". Coordenadas são responsabilidade do layout, não deste
   arquivo; aqui `pos` é só carona para quem desenha.

   Depende de: nada.
   Usado por: SIQC, SIFO, SIRO, SIIS, SIPT, SIQB.
═══════════════════════════════════════════════════════════════ */

'use strict';

(function (raiz) {

  var Q3 = raiz.Q3 = raiz.Q3 || {};

  /* ── Tabela de valência ────────────────────────────────────────
     Valência do estado fundamental usada no Ensino Médio. Enxofre e
     fósforo entram com a valência mais comum em orgânica (tiol,
     fosfato) — expandir aqui, e não espalhar exceção pelo código. */
  var VALENCIA = {
    C: 4, Si: 4, N: 3, O: 2, S: 2, P: 3,
    F: 1, Cl: 1, Br: 1, I: 1, H: 1,
    Na: 1, K: 1, Mg: 2
  };
  /* VALÊNCIAS MÚLTIPLAS: S e P passam do octeto (3º período). Um S faz
     2 ligações no tiol e no tioéter, 4 no sulfóxido (DMSO), 6 na sulfona
     e no ácido sulfônico; um P faz 3 na fosfina e 5 no fosfato. Regra
     das notações químicas (a do SMILES): o átomo assume a MENOR valência
     permitida que comporta as ligações que já tem, e os H completam o
     resto — CH₃SH tem um H no S, CH₃SO₃H nenhum. */
  var VALENCIAS = { S: [2, 4, 6], P: [3, 5] };
  /* metais dos compostos orgânicos do Ensino Médio: Na e K nos sais
     orgânicos (sabões: R–COONa), Mg nos compostos de Grignard (R–MgX) */
  var METAIS = { Na: 1, K: 1, Mg: 1 };

  /* Halogênios travam em ligação simples: não há F=C no escopo do
     Ensino Médio. A spec pede esse filtro explicitamente no ciclo de
     ordem de ligação do SIQC M1. */
  var SO_SIMPLES = { F: 1, Cl: 1, Br: 1, I: 1, H: 1, Na: 1, K: 1, Mg: 1 };

  var TETO_PESADOS = 20; // "Teto: 20 átomos pesados" (SIQC M1)

  Q3.VALENCIA = VALENCIA;
  Q3.TETO_PESADOS = TETO_PESADOS;

  /* ═══════════════════════════════════════════════════════════
     CLASSE Grafo
     ═══════════════════════════════════════════════════════════ */

  function Grafo() {
    this.atomos = {};   // id → { id, el, pos:{x,y}, carga }
    this.ligacoes = []; // { a, b, ordem }
    this._seq = 0;
  }
  Q3.Grafo = Grafo;

  /* ── construção ────────────────────────────────────────────── */

  Grafo.prototype.addAtomo = function (el, pos) {
    if (!VALENCIA[el]) throw new Error('elemento fora da tabela: ' + el);
    if (el !== 'H' && this.pesados().length >= TETO_PESADOS) return null;
    var id = 'a' + (++this._seq);
    this.atomos[id] = { id: id, el: el, pos: pos || { x: 0, y: 0 }, carga: 0 };
    return id;
  };

  Grafo.prototype.removeAtomo = function (id) {
    if (!this.atomos[id]) return false;
    delete this.atomos[id];
    this.ligacoes = this.ligacoes.filter(function (l) {
      return l.a !== id && l.b !== id;
    });
    return true;
  };

  Grafo.prototype.ligacao = function (a, b) {
    for (var i = 0; i < this.ligacoes.length; i++) {
      var l = this.ligacoes[i];
      if ((l.a === a && l.b === b) || (l.a === b && l.b === a)) return l;
    }
    return null;
  };

  /* Cria a ligação SÓ se as duas pontas tiverem valência livre — é o
     que faz o editor recusar o slot em vez de aceitar e ficar errado. */
  Grafo.prototype.addLigacao = function (a, b, ordem) {
    ordem = ordem || 1;
    if (a === b || !this.atomos[a] || !this.atomos[b]) return false;
    if (this.ligacao(a, b)) return false;
    if (!this.podeOrdem(a, b, ordem)) return false;
    this.ligacoes.push({ a: a, b: b, ordem: ordem });
    return true;
  };

  Grafo.prototype.removeLigacao = function (a, b) {
    var antes = this.ligacoes.length;
    this.ligacoes = this.ligacoes.filter(function (l) {
      return !((l.a === a && l.b === b) || (l.a === b && l.b === a));
    });
    return this.ligacoes.length < antes;
  };

  /* ── valência ──────────────────────────────────────────────── */

  Grafo.prototype.vizinhos = function (id) {
    var out = [];
    for (var i = 0; i < this.ligacoes.length; i++) {
      var l = this.ligacoes[i];
      if (l.a === id) out.push({ id: l.b, ordem: l.ordem });
      else if (l.b === id) out.push({ id: l.a, ordem: l.ordem });
    }
    return out;
  };

  Grafo.prototype.ordemTotal = function (id) {
    return this.vizinhos(id).reduce(function (s, v) { return s + v.ordem; }, 0);
  };

  /* Valência livre: quantas ligações ainda cabem. É o número que o
     editor usa para decidir se desenha um slot de encaixe. */
  /* VALÊNCIA EFETIVA — quantas ligações o átomo faz, com a carga formal
     e o elétron desemparelhado (radical) levados em conta:
       C e H ............ padrão − |carga| − radical
                          (C⁺ e C⁻ fazem 3: o carbocátion tem 6 elétrons, o
                          carbânion tem 3 ligações e um par isolado)
       N, O, S, halogênio  padrão + carga − radical
                          (N⁺ faz 4 — amônio; O⁺ faz 3 — oxônio; O⁻ faz 1 —
                          alcóxido; Cl⁻ não faz nenhuma — cloreto)
     Até aqui a carga existia no átomo mas era multiplicada por zero: o
     editor só monta moléculas neutras. O simulador de reações cria íons
     (carbocátion, alcóxido, oxônio) e radicais, e o H implícito de cada
     um sai daqui. Com carga 0 e sem radical, é a valência de sempre. */
  Grafo.prototype.valenciaEfetiva = function (id) {
    var at = this.atomos[id];
    if (!at) return 0;
    var q = at.carga || 0, r = at.radical || 0, v = VALENCIA[at.el], alt = VALENCIAS[at.el];
    if (alt && !q && !r) {
      // S e P: a menor valência permitida que comporta as ligações atuais
      var ord = this.ordemTotal(id);
      for (var i = 0; i < alt.length; i++) if (alt[i] >= ord) return alt[i];
      return alt[alt.length - 1];
    }
    var ef = (at.el === 'C' || at.el === 'Si' || at.el === 'H') ? v - Math.abs(q) - r
           : METAIS[at.el] ? v - q - r                     // Na⁺ e Mg²⁺ não fazem ligação
           : v + q - r;
    return Math.max(0, ef);
  };

  /* Valência ainda livre na valência ATUAL — é o que vira H implícito. */
  Grafo.prototype.valenciaLivre = function (id) {
    if (!this.atomos[id]) return 0;
    return this.valenciaEfetiva(id) - this.ordemTotal(id);
  };

  /* CAPACIDADE: quantas ligações o átomo ainda ACEITA. Para quase todos é
     a valência livre; para S e P é contra a valência MÁXIMA — um tioéter
     (CH₃–S–CH₃) tem 0 H, mas o S dele ainda aceita um =O e vira o DMSO.
     É por esta conta que o editor oferece o encaixe e deixa uma ligação
     subir de ordem; os H seguem a valência atual. */
  Grafo.prototype.capacidade = function (id) {
    var at = this.atomos[id];
    if (!at) return 0;
    var alt = VALENCIAS[at.el];
    if (alt && !(at.carga || 0) && !(at.radical || 0)) return alt[alt.length - 1] - this.ordemTotal(id);
    return this.valenciaLivre(id);
  };
  Q3.VALENCIAS = VALENCIAS;
  Q3.METAIS = METAIS;

  /* Hidrogênios implícitos — "H sempre implícito, nunca colocado
     manualmente" (SIQC M1). Só conta para átomos pesados; um H
     explícito no grafo já ocupa valência e não é recontado. */
  Grafo.prototype.hidrogenios = function (id) {
    var at = this.atomos[id];
    if (!at || at.el === 'H') return 0;
    return Math.max(0, this.valenciaLivre(id));
  };

  Grafo.prototype.podeOrdem = function (a, b, ordem) {
    var ea = this.atomos[a] && this.atomos[a].el;
    var eb = this.atomos[b] && this.atomos[b].el;
    if (!ea || !eb) return false;
    if (ordem > 1 && (SO_SIMPLES[ea] || SO_SIMPLES[eb])) return false;
    if (ordem < 1 || ordem > 3) return false;
    var atual = this.ligacao(a, b);
    var jaUsada = atual ? atual.ordem : 0;
    return this.capacidade(a) + jaUsada >= ordem &&
           this.capacidade(b) + jaUsada >= ordem;
  };

  /* Ciclo simples→dupla→tripla→simples, pulando o que a valência ou
     o par de elementos não permite. Devolve a nova ordem, ou null se
     nenhuma alternativa couber (aí o editor não faz nada, em vez de
     entrar num estado inválido). */
  Grafo.prototype.ciclarOrdem = function (a, b) {
    var l = this.ligacao(a, b);
    if (!l) return null;
    for (var i = 1; i <= 3; i++) {
      var nova = ((l.ordem - 1 + i) % 3) + 1;
      /* Se a única opção viável é a ordem ATUAL, não houve ciclo —
         devolve null para o editor não piscar um feedback de mudança
         que não aconteceu. É o caso de C–Cl: dupla e tripla são
         barradas pelo halogênio, e só a simples sobra. */
      if (nova === l.ordem) continue;
      if (this.podeOrdem(a, b, nova)) {
        l.ordem = nova;
        if (nova > 1) delete l.estereo;       // dupla e tripla ficam no plano: a cunha escolhida sai
        return nova;
      }
    }
    return null;
  };

  /* ── topologia ─────────────────────────────────────────────── */

  Grafo.prototype.pesados = function () {
    var self = this;
    return Object.keys(this.atomos).filter(function (id) {
      return self.atomos[id].el !== 'H';
    });
  };

  Grafo.prototype.componentes = function () {
    var vistos = {}, comps = [], self = this;
    Object.keys(this.atomos).forEach(function (id) {
      if (vistos[id]) return;
      var pilha = [id], c = [];
      vistos[id] = true;
      while (pilha.length) {
        var n = pilha.pop();
        c.push(n);
        self.vizinhos(n).forEach(function (v) {
          if (!vistos[v.id]) { vistos[v.id] = true; pilha.push(v.id); }
        });
      }
      comps.push(c);
    });
    return comps;
  };

  /* Número de anéis independentes (número ciclomático): para um grafo
     conexo, ligações − átomos + 1. Basta para "aberta x fechada"; a
     lista de anéis em si vem de `aneis()`. */
  Grafo.prototype.numAneis = function () {
    return this.ligacoes.length - Object.keys(this.atomos).length +
           this.componentes().length;
  };

  /* Anéis como conjunto de ciclos fundamentais: cada aresta fora da
     árvore geradora fecha exatamente um ciclo. Suficiente no teto de
     20 átomos; não tenta ser SSSR completo. */
  Grafo.prototype.aneis = function () {
    var pai = {}, vistos = {}, extras = [], self = this;
    Object.keys(this.atomos).forEach(function (raizId) {
      if (vistos[raizId]) return;
      vistos[raizId] = true; pai[raizId] = null;
      var fila = [raizId];
      var naArvore = {};
      while (fila.length) {
        var n = fila.shift();
        self.vizinhos(n).forEach(function (v) {
          var chave = [n, v.id].sort().join('|');
          if (!vistos[v.id]) {
            vistos[v.id] = true; pai[v.id] = n; naArvore[chave] = true;
            fila.push(v.id);
          } else if (!naArvore[chave]) {
            naArvore[chave] = true;
            extras.push([n, v.id]);
          }
        });
      }
    });
    return extras.map(function (par) {
      var caminho = function (x) { var c = []; while (x) { c.push(x); x = pai[x]; } return c; };
      var ca = caminho(par[0]), cb = caminho(par[1]);
      var setB = {}; cb.forEach(function (x, i) { setB[x] = i; });
      for (var i = 0; i < ca.length; i++) {
        if (setB[ca[i]] !== undefined) {
          return ca.slice(0, i + 1).concat(cb.slice(0, setB[ca[i]]).reverse());
        }
      }
      return ca;
    });
  };

  /* ── classificação (SIQC M1) ───────────────────────────────────
     "calculada ao vivo por propriedades de grafo — nunca consultada
     em banco, válida em qualquer estrutura dentro do teto". */

  Grafo.prototype.classificar = function () {
    var self = this;
    var pesados = this.pesados();
    var el = function (id) { return self.atomos[id].el; };
    var vizC = function (id) {
      return self.vizinhos(id).filter(function (v) { return el(v.id) === 'C'; }).length;
    };
    /* ESQUELETO da cadeia = os carbonos + os heteroátomos que estão ENTRE
       carbonos. O O de um álcool na ponta, o Cl de um haleto, o =O de uma
       cetona não fazem parte da cadeia: são grupos pendurados nela. Os
       quatro critérios dos livros se referem ao esqueleto. */
    var ehEsqueleto = function (id) { return el(id) === 'C' || vizC(id) >= 2; };
    var emAnel = {};
    this.aneis().forEach(function (r) { r.forEach(function (id) { emAnel[id] = true; }); });
    var temAnel = Object.keys(emAnel).length > 0;

    // saturação: dupla ou tripla ENTRE CARBONOS. C=O não conta — a
    // propanona tem cadeia saturada.
    var insaturada = this.ligacoes.some(function (l) {
      return l.ordem > 1 && el(l.a) === 'C' && el(l.b) === 'C';
    });
    // natureza: heteroátomo ENTRE carbonos. O OH na ponta não conta.
    var heterogenea = pesados.some(function (id) { return el(id) !== 'C' && vizC(id) >= 2; });
    // ramificação: cadeia com mais de duas extremidades. Em cadeia aberta,
    // um átomo do esqueleto ligado a 3+ outros do esqueleto. Em anel, uma
    // cadeia lateral saindo do anel. Os carbonos de fusão do naftaleno têm
    // três vizinhos, todos no anel: não é ramificação.
    var ramificada = pesados.some(function (id) {
      if (!ehEsqueleto(id)) return false;
      var viz = self.vizinhos(id).filter(function (v) { return ehEsqueleto(v.id); });
      if (!emAnel[id]) return viz.length >= 3;
      return viz.some(function (v) { return !emAnel[v.id]; });
    });
    return {
      cadeia:      temAnel ? 'fechada' : 'aberta',
      saturacao:   insaturada ? 'insaturada' : 'saturada',
      natureza:    heterogenea ? 'heterogênea' : 'homogênea',
      ramificacao: ramificada ? 'ramificada' : 'normal'
    };
  };

  var CLASSE = ['nulário', 'primário', 'secundário', 'terciário', 'quaternário'];

  Grafo.prototype.classeCarbono = function (id) {
    var at = this.atomos[id], self = this;
    if (!at || at.el !== 'C') return null;
    var n = this.vizinhos(id).filter(function (v) {
      return self.atomos[v.id].el === 'C';
    }).length;
    return CLASSE[Math.min(n, 4)];
  };

  /* ── fórmula molecular, notação de Hill ────────────────────── */

  Grafo.prototype.formulaMolecular = function () {
    var cont = {}, self = this;
    Object.keys(this.atomos).forEach(function (id) {
      var el = self.atomos[id].el;
      cont[el] = (cont[el] || 0) + 1;
      if (el !== 'H') cont.H = (cont.H || 0) + self.hidrogenios(id);
    });
    var out = '';
    var escreve = function (el) {
      if (!cont[el]) return;
      out += el + (cont[el] > 1 ? cont[el] : '');
      delete cont[el];
    };
    escreve('C'); escreve('H');
    Object.keys(cont).sort().forEach(escreve);
    return out;
  };

  Grafo.prototype.massaFormula = function () {
    var M = { C: 12.011, H: 1.008, O: 15.999, N: 14.007, S: 32.06,
              P: 30.974, F: 18.998, Cl: 35.45, Br: 79.904, I: 126.904,
              Si: 28.085, Na: 22.990, K: 39.098, Mg: 24.305 };
    var t = 0, self = this;
    Object.keys(this.atomos).forEach(function (id) {
      var el = self.atomos[id].el;
      t += M[el] || 0;
      if (el !== 'H') t += M.H * self.hidrogenios(id);
    });
    return Math.round(t * 1000) / 1000;
  };

  /* ── forma canônica ────────────────────────────────────────────
     "mesmo grafo, forma canônica idêntica, apesar de desenho
     diferente" (SIIS M1). É o que permite o veredito de 3 vias sem
     depender de como o aluno desenhou.

     Método: refinamento iterativo de invariantes no espírito do
     algoritmo de Morgan (elemento, grau, soma de ordens, H, carga),
     depois uma DFS canônica a partir de cada átomo de menor
     invariante, ordenando vizinhos pela própria assinatura recursiva.
     Fica a menor string. Com teto de 20 átomos, sobra folga. */

  Grafo.prototype._invariantes = function () {
    var self = this, inv = {};
    var ids = Object.keys(this.atomos);
    ids.forEach(function (id) {
      var a = self.atomos[id];
      inv[id] = [a.el, self.vizinhos(id).length, self.ordemTotal(id),
                 self.hidrogenios(id), a.carga || 0, a.radical || 0].join(':');
    });
    for (var passo = 0; passo < ids.length; passo++) {
      var novo = {}, mudou = false;
      ids.forEach(function (id) {
        var viz = self.vizinhos(id)
          .map(function (v) { return v.ordem + inv[v.id]; }).sort().join(',');
        novo[id] = inv[id] + '{' + viz + '}';
      });
      // recomprime para rótulos curtos, senão a string explode
      var unicos = {}, ordenados = Object.keys(novo)
        .map(function (id) { return novo[id]; }).sort();
      ordenados.forEach(function (v, i) { if (!(v in unicos)) unicos[v] = i; });
      ids.forEach(function (id) {
        var r = String(unicos[novo[id]]);
        if (r !== inv[id]) mudou = true;
        inv[id] = r;
      });
      if (!mudou) break;
    }
    return inv;
  };

  Grafo.prototype.canonico = function () {
    var ids = Object.keys(this.atomos);
    if (!ids.length) return '';
    var self = this, inv = this._invariantes();
    var menor = null;

    var dfs = function (id, veioDe, visitados, ordemChegada) {
      visitados[id] = true;
      var a = self.atomos[id];
      var rot = a.el + (self.hidrogenios(id) ? 'H' + self.hidrogenios(id) : '') +
                (a.carga ? (a.carga > 0 ? '+' : '-') + Math.abs(a.carga) : '');
      var ramos = [], fechamentos = [];
      self.vizinhos(id)
        .filter(function (v) { return v.id !== veioDe; })
        .sort(function (x, y) {
          if (inv[x.id] !== inv[y.id]) return inv[x.id] < inv[y.id] ? -1 : 1;
          return x.ordem - y.ordem;
        })
        .forEach(function (v) {
          if (visitados[v.id]) {
            // aresta de fechamento de anel: registra o alvo pelo
            // índice de chegada, para o mesmo anel dar a mesma marca
            fechamentos.push(v.ordem + '@' + ordemChegada[v.id]);
          } else {
            ordemChegada[v.id] = Object.keys(ordemChegada).length;
            ramos.push(v.ordem + dfs(v.id, id, visitados, ordemChegada));
          }
        });
      fechamentos.sort();
      ramos.sort();
      return rot + (fechamentos.length ? '<' + fechamentos.join(',') + '>' : '') +
             (ramos.length ? '(' + ramos.join(')(') + ')' : '');
    };

    var minInv = ids.map(function (i) { return inv[i]; }).sort()[0];
    ids.filter(function (i) { return inv[i] === minInv; }).forEach(function (raizId) {
      var oc = {}; oc[raizId] = 0;
      var s = dfs(raizId, null, {}, oc);
      if (menor === null || s < menor) menor = s;
    });
    return menor;
  };

  /* ── veredito de 3 vias (SIIS M1) ──────────────────────────── */

  Grafo.prototype.compararCom = function (outro) {
    var fa = this.formulaMolecular(), fb = outro.formulaMolecular();
    if (fa !== fb) {
      return { veredito: 'formulas-diferentes', formulaA: fa, formulaB: fb };
    }
    if (this.canonico() === outro.canonico()) {
      return { veredito: 'mesma-molecula', formula: fa };
    }
    return { veredito: 'isomeros', formula: fa, subtipo: this._subtipoIsomeria(outro) };
  };

  /* Subtipo de isomeria constitucional. Ordem de teste importa:
     função antes de cadeia, senão um álcool x éter cairia em
     "cadeia" só porque o esqueleto difere. */
  Grafo.prototype._subtipoIsomeria = function (outro) {
    var ga = this.gruposFuncionais(), gb = outro.gruposFuncionais();
    var chave = function (g) { return g.map(function (x) { return x.tipo; }).sort().join(','); };
    if (chave(ga) !== chave(gb)) return 'função';

    var esq = function (g) {
      return g.classificar().ramificacao + '|' + g.pesados().length;
    };
    if (esq(this) !== esq(outro)) return 'cadeia';

    // heteroátomo entre carbonos em posição diferente → metameria
    if (this.classificar().natureza === 'heterogênea') return 'metameria';
    return 'posição';
  };

  /* ── grupos funcionais ─────────────────────────────────────────
     Motor "sempre geral": varre e lista TODOS os grupos presentes,
     nunca para no primeiro (SIFO M1). A ordem do catálogo segue a
     prioridade IUPAC da spec — quem precisa do sufixo pega o
     primeiro da lista devolvida. */

  var GRUPOS = [
    { tipo: 'ácido carboxílico', prio: 1 },
    { tipo: 'éster',            prio: 3 },
    { tipo: 'amida',            prio: 5 },
    { tipo: 'nitrila',          prio: 6 },
    { tipo: 'aldeído',          prio: 7 },
    { tipo: 'cetona',           prio: 8 },
    { tipo: 'álcool',           prio: 9 },
    { tipo: 'amina',            prio: 11 },
    { tipo: 'haleto orgânico',  prio: 12 },
    { tipo: 'éter',             prio: 13 }
  ];
  var PRIO = {}; GRUPOS.forEach(function (g) { PRIO[g.tipo] = g.prio; });
  Q3.PRIORIDADE_FUNCOES = PRIO;

  Grafo.prototype.gruposFuncionais = function () {
    var self = this, achados = [];
    var el = function (id) { return self.atomos[id].el; };
    var vizPesados = function (id) {
      return self.vizinhos(id).filter(function (v) { return el(v.id) !== 'H'; });
    };

    /* PASSO 1 — marcar as carbonilas ANTES de qualquer outra coisa.
       Sem isso, o O de um éster também parece éter (dois carbonos
       pendurados nele) e o N de uma amida também parece amina. Os
       dois eram falso-positivo real: acetato de metila saía como
       "éster,éter". A carbonila é quem manda no heteroátomo vizinho. */
    var carbonila = {};
    this.pesados().forEach(function (id) {
      if (el(id) !== 'C') return;
      if (vizPesados(id).some(function (v) { return el(v.id) === 'O' && v.ordem === 2; })) {
        carbonila[id] = true;
      }
    });
    var presoACarbonila = function (hetId) {
      return vizPesados(hetId).some(function (v) { return carbonila[v.id]; });
    };

    /* PASSO 2 — funções centradas na carbonila. Cada carbonila gera
       exatamente UMA função; o que está pendurado nela decide qual. */
    Object.keys(carbonila).forEach(function (id) {
      var viz = vizPesados(id);
      var oSimples = viz.filter(function (v) { return el(v.id) === 'O' && v.ordem === 1; });
      var nViz = viz.filter(function (v) { return el(v.id) === 'N'; });
      var cViz = viz.filter(function (v) { return el(v.id) === 'C'; });
      var oh = oSimples.filter(function (v) { return self.hidrogenios(v.id) === 1; });
      var oR = oSimples.filter(function (v) { return self.hidrogenios(v.id) === 0; });
      if (oh.length)        achados.push({ tipo: 'ácido carboxílico', carbono: id, hetero: oh[0].id });
      else if (oR.length)   achados.push({ tipo: 'éster',  carbono: id, hetero: oR[0].id });
      else if (nViz.length) achados.push({ tipo: 'amida',  carbono: id, hetero: nViz[0].id });
      else if (cViz.length >= 2) achados.push({ tipo: 'cetona',  carbono: id });
      else                  achados.push({ tipo: 'aldeído', carbono: id });
    });

    /* PASSO 3 — funções centradas no heteroátomo. Percorre os
       HETEROÁTOMOS, não os carbonos: um éter é UM grupo com dois
       carbonos vizinhos, e varrer por carbono o contava duas vezes
       (era o "éter,éter" do éter metílico). */
    this.pesados().forEach(function (hid) {
      var e = el(hid);
      if (e === 'C') return;
      if (presoACarbonila(hid)) return; // já contabilizado no passo 2
      var cViz = vizPesados(hid).filter(function (v) { return el(v.id) === 'C'; });
      if (!cViz.length) return;

      if (e === 'O') {
        if (self.hidrogenios(hid) === 1) {
          achados.push({ tipo: 'álcool', carbono: cViz[0].id, hetero: hid });
        } else if (cViz.length >= 2) {
          achados.push({ tipo: 'éter', carbono: cViz[0].id, hetero: hid });
        }
      } else if (e === 'N') {
        var tripla = self.vizinhos(hid).some(function (v) { return v.ordem === 3; });
        if (tripla) achados.push({ tipo: 'nitrila', carbono: cViz[0].id, hetero: hid });
        else achados.push({ tipo: 'amina', carbono: cViz[0].id, hetero: hid });
      } else if (SO_SIMPLES[e]) {
        achados.push({ tipo: 'haleto orgânico', carbono: cViz[0].id, hetero: hid });
      }
    });

    /* Dedup pelo CENTRO da função: o heteroátomo quando existe, o
       carbono quando a função é da carbonila pura (cetona/aldeído). */
    var vistos = {};
    return achados.filter(function (g) {
      var k = g.tipo + '#' + (g.hetero || g.carbono);
      if (vistos[k]) return false;
      vistos[k] = true; return true;
    }).sort(function (a, b) { return PRIO[a.tipo] - PRIO[b.tipo]; });
  };

  /* ── cadeia principal (SIFO M2) ────────────────────────────────
     "caminho mais longo pelo carbono do grupo funcional". Sem grupo
     funcional, o caminho mais longo entre carbonos. */

  Grafo.prototype.cadeiaPrincipal = function () {
    var self = this;
    var carbonos = this.pesados().filter(function (id) { return self.atomos[id].el === 'C'; });
    if (!carbonos.length) return [];
    var grupos = this.gruposFuncionais();
    var obrigatorio = grupos.length ? grupos[0].carbono : null;

    var maisLongo = [];
    var anda = function (id, caminho, visitados) {
      caminho.push(id); visitados[id] = true;
      var seguiu = false;
      self.vizinhos(id).forEach(function (v) {
        if (self.atomos[v.id].el !== 'C' || visitados[v.id]) return;
        seguiu = true;
        anda(v.id, caminho.slice(), Object.assign({}, visitados));
      });
      if (!seguiu) {
        var vale = obrigatorio === null || caminho.indexOf(obrigatorio) >= 0;
        if (vale && caminho.length > maisLongo.length) maisLongo = caminho;
      }
    };
    carbonos.forEach(function (id) { anda(id, [], {}); });

    /* Numeração: menor localizador para o grupo funcional; sem grupo,
       para a primeira ramificação. */
    if (obrigatorio !== null) {
      var iFrente = maisLongo.indexOf(obrigatorio);
      var iTras = maisLongo.length - 1 - iFrente;
      if (iTras < iFrente) maisLongo = maisLongo.slice().reverse();
    }
    return maisLongo;
  };

  /* ── fórmula condensada em linha ───────────────────────────────
     CH₃(CH₂)₂CH₃, CH₃CH(CH₃)CH₃, CH₃COOH — a escrita de uma linha só.
     Dígitos saem em ASCII; quem exibe converte para subscrito (todo
     número numa fórmula condensada é subscrito, inclusive o de (CH₂)₂).
     Convenções dos livros que ela segue:
       · a espinha escrita é o caminho mais longo do ESQUELETO (carbonos
         e heteroátomos entre carbonos); OH, Cl, =O são grupos pendurados
       · ramo entre parênteses, e ramos iguais agrupados: C(CH₃)₂
       · carbonila e halogênio em linha, sem parênteses: CH₃COCH₃,
         CH₃CHClCH₃, CCl₄
       · o grupo da ponta sai em linha: CH₃CH₂OH, CH₃COOH
       · dupla e tripla aparecem (=, ≡); a simples não
       · três ou mais CH₂ seguidos... e já DOIS viram (CH₂)ₙ: CH₃(CH₂)₂CH₃
     Cadeia fechada não se escreve em linha: devolve null. */
  Grafo.prototype.formulaCondensada = function () {
    if (this.numAneis() > 0) return null;
    var self = this, ids = this.pesados();
    if (!ids.length) return '';
    var el = function (id) { return self.atomos[id].el; };
    var vizC = function (id) { return self.vizinhos(id).filter(function (v) { return el(v.id) === 'C'; }).length; };
    var esqueleto = function (id) { return el(id) === 'C' || vizC(id) >= 2; };
    var rot = function (id) { var h = self.hidrogenios(id); return el(id) + (h ? 'H' + (h > 1 ? h : '') : ''); };
    var SIMB = { 1: '', 2: '=', 3: '≡' };
    var hal = { F: 1, Cl: 1, Br: 1, I: 1 };

    /* caminho mais longo entre dois átomos do esqueleto (árvore: BFS) */
    var esq = ids.filter(esqueleto);
    if (!esq.length) esq = ids.slice();
    var caminho = function (a, b) {
      var ant = {}; ant[a] = null; var f = [a];
      while (f.length) { var x = f.shift(); self.vizinhos(x).forEach(function (v) { if (!(v.id in ant) && esqueleto(v.id)) { ant[v.id] = x; f.push(v.id); } }); }
      if (!(b in ant)) return null;
      var c = []; for (var y = b; y !== null; y = ant[y]) c.unshift(y); return c;
    };
    var espinha = [esq[0]];
    esq.forEach(function (a) { esq.forEach(function (b) {
      if (a >= b) return;
      var c = caminho(a, b);
      if (c && (c.length > espinha.length || (c.length === espinha.length && c.join() < espinha.join()))) espinha = c;
    }); });
    // começa pela ponta que é carbono com menos ramos (escrita da esquerda)
    var ramos = function (id, fora) { return self.vizinhos(id).filter(function (v) { return fora.indexOf(v.id) < 0; }); };
    if (espinha.length > 1) {
      var ra = ramos(espinha[0], [espinha[1]]).length, rb = ramos(espinha[espinha.length - 1], [espinha[espinha.length - 2]]).length;
      if (el(espinha[0]) !== 'C' && el(espinha[espinha.length - 1]) === 'C' || (el(espinha[0]) === el(espinha[espinha.length - 1]) && rb < ra)) espinha.reverse();
    }

    /* escreve um ramo a partir do átomo de ligação, para fora */
    var escreverRamo = function (id, de) {
      var filhos = self.vizinhos(id).filter(function (v) { return v.id !== de; });
      if (!filhos.length) return rot(id);
      var partes = filhos.map(function (v) { return { t: escreverRamo(v.id, id), o: v.ordem, v: v.id }; });
      // todos iguais e simples: C(CH₃)₂ em vez de CH(CH₃)CH₃
      if (partes.length > 1 && partes.every(function (x) { return x.t === partes[0].t && x.o === 1; })) {
        return rot(id) + '(' + partes[0].t + ')' + partes.length;
      }
      // o maior segue em linha; os outros viram parênteses
      partes.sort(function (x, y) { return y.t.length - x.t.length; });
      var cont = partes.shift();
      return rot(id) + agrupar(partes.map(formatar)) + SIMB[cont.o] + cont.t;
    };
    var formatar = function (x) {
      var so = self.vizinhos(x.v).length === 1;
      if (x.o === 2 && el(x.v) === 'O' && so) return { t: 'O', emLinha: true };      // carbonila
      if (hal[el(x.v)] && so) return { t: el(x.v), emLinha: true };                   // halogênio
      return { t: (x.o > 1 ? SIMB[x.o] : '') + x.t, emLinha: false };
    };
    var agrupar = function (lista) {
      var out = '', i = 0;
      // em linha primeiro (CO, CCl), depois os parênteses
      lista.sort(function (a, b) { return (b.emLinha ? 1 : 0) - (a.emLinha ? 1 : 0); });
      while (i < lista.length) {
        var j = i; while (j + 1 < lista.length && lista[j + 1].t === lista[i].t && lista[j + 1].emLinha === lista[i].emLinha) j++;
        var n = j - i + 1, it = lista[i];
        out += it.emLinha ? it.t + (n > 1 ? n : '') : '(' + it.t + ')' + (n > 1 ? n : '');
        i = j + 1;
      }
      return out;
    };

    var pedacos = [];
    espinha.forEach(function (id, k) {
      var fora = [];
      if (k > 0) fora.push(espinha[k - 1]);
      if (k < espinha.length - 1) fora.push(espinha[k + 1]);
      var laterais = ramos(id, fora).map(function (v) { return { t: escreverRamo(v.id, id), o: v.ordem, v: v.id }; });
      var cauda = '';
      // na ponta final, o grupo que sobra sai em linha (CH₃CH₂OH, CH₃COOH)
      if (k === espinha.length - 1) {
        var fmt = laterais.map(formatar), naoLinha = fmt.filter(function (x) { return !x.emLinha; });
        if (naoLinha.length === 1) {
          var idx = fmt.indexOf(naoLinha[0]);
          cauda = naoLinha[0].t; fmt.splice(idx, 1);
          pedacos.push({ id: id, t: rot(id) + agrupar(fmt) + cauda, liso: false });
          return;
        }
        pedacos.push({ id: id, t: rot(id) + agrupar(fmt), liso: !fmt.length });
        return;
      }
      var f = laterais.map(formatar);
      pedacos.push({ id: id, t: rot(id) + agrupar(f), liso: !f.length });
    });
    // junta com o símbolo da ligação, e agrupa CH₂ seguidos: CH₃(CH₂)₂CH₃
    var out = '', k2 = 0;
    while (k2 < pedacos.length) {
      var p = pedacos[k2], j2 = k2;
      var simbAntes = k2 ? SIMB[self.ligacao(pedacos[k2 - 1].id, p.id).ordem] : '';
      if (p.liso && p.t === 'CH2') {
        while (j2 + 1 < pedacos.length && pedacos[j2 + 1].liso && pedacos[j2 + 1].t === 'CH2' &&
               self.ligacao(pedacos[j2].id, pedacos[j2 + 1].id).ordem === 1) j2++;
      }
      var n2 = j2 - k2 + 1;
      var apos = j2 + 1 < pedacos.length ? self.ligacao(pedacos[j2].id, pedacos[j2 + 1].id).ordem : 1;
      out += simbAntes + (n2 >= 2 && simbAntes === '' && apos === 1 ? '(CH2)' + n2 : pedacos.slice(k2, j2 + 1).map(function (x) { return x.t; }).join(''));
      k2 = j2 + 1;
    }
    return out;
  };

  /* ── utilidades ────────────────────────────────────────────── */

  Grafo.prototype.clonar = function () {
    var g = new Grafo();
    var self = this;
    Object.keys(this.atomos).forEach(function (id) {
      var a = self.atomos[id];
      g.atomos[id] = { id: id, el: a.el, pos: { x: a.pos.x, y: a.pos.y }, carga: a.carga, radical: a.radical || 0 };
    });
    g.ligacoes = this.ligacoes.map(function (l) {
      var c = { a: l.a, b: l.b, ordem: l.ordem };
      /* ESTEREOQUÍMICA ESCOLHIDA pelo aluno (editor, ferramenta Cunha):
         { de: átomo da ponta estreita, tipo: 'frente' | 'tras' | 'plano' }.
         Sem ela, a estereoquímica é a automática da geometria 3D. Copiar
         aqui é o que faz a escolha sobreviver ao Desfazer. */
      if (l.estereo) c.estereo = { de: l.estereo.de, tipo: l.estereo.tipo };
      return c;
    });
    g._seq = this._seq;
    return g;
  };

  /* Quebra uma ligação e devolve os dois fragmentos como grafos
     independentes — é o craqueamento do SIPT M2, e também o que o
     SIRO usa para comparar o grafo antes/depois. */
  Grafo.prototype.quebrarEm = function (a, b) {
    if (!this.ligacao(a, b)) return null;
    var g = this.clonar();
    g.removeLigacao(a, b);
    var comps = g.componentes();
    if (comps.length < 2) return null; // era ligação de anel: não parte
    return comps.map(function (ids) {
      var f = new Grafo();
      ids.forEach(function (id) {
        f.atomos[id] = g.atomos[id];
      });
      f.ligacoes = g.ligacoes.filter(function (l) {
        return ids.indexOf(l.a) >= 0 && ids.indexOf(l.b) >= 0;
      });
      f._seq = g._seq;
      return f;
    });
  };

  /* ═══════════════════════════════════════════════════════════
     PARSER DE FÓRMULA ESTRUTURAL
     "traço liga a cadeia principal; parênteses (podendo aninhar)
     delimitam ramos, exatamente como na notação real (C(CH3)3)"
     — SIFO M2, reaproveitado pelo SIIS M1 ("mesma gramática").
     Aceita: CH3-CH2-OH · C(CH3)3 · CH3-CH=CH-CH3 · CH3-C#N
     ═══════════════════════════════════════════════════════════ */

  Q3.deFormulaEstrutural = function (texto) {
    var g = new Grafo();
    var s = String(texto).replace(/\s+/g, '');
    var i = 0;

    var erro = function (msg) {
      var e = new Error(msg + ' (posição ' + i + ')');
      e.posicao = i; throw e;
    };

    /* Lê um símbolo de elemento: duas letras primeiro (Cl antes de C),
       senão uma. Sem isso, "Cl" viraria carbono seguido de lítio. */
    var leElemento = function () {
      var dois = s.substr(i, 2);
      if (VALENCIA[dois] && /^[A-Z][a-z]$/.test(dois)) { i += 2; return dois; }
      var um = s.substr(i, 1);
      if (VALENCIA[um] && /^[A-Z]$/.test(um)) { i += 1; return um; }
      return null;
    };
    var leNumero = function () {
      var m = /^\d+/.exec(s.slice(i));
      if (!m) return null;
      i += m[0].length; return parseInt(m[0], 10);
    };

    /* Lê uma sequência encadeada e devolve {primeiro, ultimo}. */
    var leSequencia = function (ancora, ordemEntrada) {
      var anterior = ancora, ordem = ordemEntrada || 1, primeiro = null;
      while (i < s.length) {
        var c = s[i];
        if (c === ')') break;
        if (c === '-') { i++; ordem = 1; continue; }
        if (c === '=') { i++; ordem = 2; continue; }
        if (c === '#') { i++; ordem = 3; continue; }
        if (c === '(') {
          if (anterior === null) erro('ramo sem átomo ao qual se ligar');
          i++;
          var marca = i;
          var fim = leSequencia(anterior, 1);
          if (s[i] !== ')') erro('parêntese não fechado');
          i++;
          var rep = leNumero();
          // (CH3)3 → repete o MESMO ramo n vezes no mesmo átomo
          for (var r = 1; r < (rep || 1); r++) {
            var salvo = i; i = marca;
            leSequencia(anterior, 1);
            i = salvo;
          }
          ordem = 1;
          continue;
        }
        var el = leElemento();
        if (!el) erro('símbolo não reconhecido: "' + s[i] + '"');
        var qtdH = 0;
        if (s[i] === 'H') { i++; qtdH = leNumero() || 1; }
        var mult = (el !== 'H' && /^\d/.test(s.slice(i)) && !qtdH) ? leNumero() : null;

        var novo = g.addAtomo(el);
        if (novo === null) erro('teto de ' + TETO_PESADOS + ' átomos pesados excedido');
        if (primeiro === null) primeiro = novo;
        if (anterior !== null) {
          if (!g.addLigacao(anterior, novo, ordem)) {
            erro('valência não permite ligação de ordem ' + ordem);
          }
        }
        // Hs escritos viram implícitos: o grafo já os conta pela
        // valência livre, então só validamos a coerência
        if (qtdH && g.valenciaLivre(novo) < qtdH) erro('H demais em ' + el);
        for (var m = 1; m < (mult || 1); m++) {
          var extra = g.addAtomo(el);
          if (extra === null) erro('teto de átomos excedido');
          g.addLigacao(anterior, extra, 1);
        }
        anterior = novo; ordem = 1;
      }
      return { primeiro: primeiro, ultimo: anterior };
    };

    leSequencia(null, 1);
    if (i < s.length) erro('sobrou texto não interpretado');
    if (!Object.keys(g.atomos).length) erro('fórmula vazia');
    return g;
  };

  /* Atalho de conveniência: constrói uma cadeia linear de carbonos. */
  Q3.cadeiaLinear = function (n) {
    var g = new Grafo(), ant = null;
    for (var k = 0; k < n; k++) {
      var id = g.addAtomo('C');
      if (ant) g.addLigacao(ant, id, 1);
      ant = id;
    }
    return g;
  };

})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).Q3;
}
