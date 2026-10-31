/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/classificador-cadeias.js
   ───────────────────────────────────────────────────────────────
   MÓDULO 3 — CLASSIFICAÇÃO DE CADEIAS.

   O desafio que ficava no Módulo 1 pedia um palpite em quatro botões.
   Aqui, toda classificação AFIRMATIVA pede a evidência na estrutura:
     insaturada ....... tocar na dupla ou tripla ENTRE CARBONOS
     fechada .......... traçar o anel com o dedo, átomo por átomo
     ramificada ....... tocar no átomo de onde sai o ramo
     heterogênea ...... tocar no heteroátomo ENTRE carbonos
     aromática ........ tocar dentro do anel aromático
     heterocíclica .... tocar no heteroátomo DO ANEL
     condensados ...... tocar num carbono dos dois anéis
   As pegadinhas dos livros aparecem sozinhas: tocar no C=O para provar
   "insaturada", ou no OH da ponta para provar "heterogênea", dá a
   explicação de por que eles não contam.

   A RODADA
     1. carbonos: o aluno escolhe um pincel (primário, secundário…) e
        PINTA arrastando sobre os carbonos; confere; corrige.
     2. cadeia: um critério por vez, na ordem dos livros.
     3. fim: o resumo, e a próxima estrutura.

   Tudo o que o módulo diz sai de Q3.Classificacao.analisar — a mesma
   regra do Módulo 1. Não há resposta guardada por molécula.

   Depende de: core (grafo, geometria, smiles, classificacao-cadeias,
   gerador-estruturas), data (banco-cadeias), render (desenho-molecula).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* cor com transparência (#rrggbb → rgba) — o módulo não depende das funções do Módulo 2 */
function clsRgba(hex, a) {
  var h = String(hex).replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
  var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

/* índice de cada classe nas cores de Q3.Desenho.paleta().classes */
var CLS_INDICE = { 'nulário': 0, 'primário': 1, 'secundário': 2, 'terciário': 3, 'quaternário': 4 };

/* a pergunta de cada critério */
var CLS_PERGUNTA = {
  cadeia: 'Quanto ao fechamento, a cadeia é…',
  ramificacao: 'Quanto à disposição, a cadeia é…',
  saturacao: 'Quanto à saturação, a cadeia é…',
  natureza: 'Quanto à natureza (heteroátomo), a cadeia é…',
  aromaticidade: 'O anel é aromático?',
  heterociclo: 'O anel tem heteroátomo?',
  nucleos: 'Quantos núcleos aromáticos?',
  tipoPolinuclear: 'Os núcleos aromáticos estão…'
};

/* respostas afirmativas que pedem a evidência: o que tocar, e onde está */
var CLS_EVIDENCIA = {
  'cadeia:fechada': { tipo: 'anel', pedido: 'Prove: trace o anel — arraste pelos átomos dele até voltar ao primeiro.' },
  'cadeia:mista': { tipo: 'atomo', alvo: function (a) { return a.parteAberta; }, pedido: 'Prove: toque num átomo da parte aberta da cadeia.' },
  'ramificacao:ramificada': { tipo: 'atomo', alvo: function (a) { return a.pontosRamificacao; }, pedido: 'Prove: toque no átomo de onde sai a ramificação.' },
  'saturacao:insaturada': { tipo: 'ligacao', pedido: 'Prove: toque na ligação dupla ou tripla entre carbonos.' },
  'natureza:heterogênea': { tipo: 'atomo', alvo: function (a) { return a.heteroatomos; }, pedido: 'Prove: toque no heteroátomo que está entre dois carbonos.' },
  'aromaticidade:aromática': { tipo: 'anelArom', pedido: 'Prove: toque dentro do anel aromático.' },
  'heterociclo:heterocíclica': { tipo: 'atomo', alvo: function (a) { return a.heteroNoAnel; }, pedido: 'Prove: toque no heteroátomo que faz parte do anel.' },
  'tipoPolinuclear:condensados': { tipo: 'atomo', alvo: clsFusao, pedido: 'Prove: toque num carbono que pertence aos dois anéis.' }
};

/* átomos compartilhados por dois anéis aromáticos */
function clsFusao(a) {
  var arom = a.aneis.filter(function (r) { return r.aromatico; }), cont = {};
  arom.forEach(function (r) { r.atomos.forEach(function (id) { cont[id] = (cont[id] || 0) + 1; }); });
  return Object.keys(cont).filter(function (id) { return cont[id] >= 2; });
}

/* estruturas sorteadas de nível 4: um núcleo aromático + 1 ou 2 grupos */
var CLS_NUCLEOS = ['C1=CC=CC=C1', 'C1=CC=CC=C1', 'C1=CC=C2C=CC=CC2=C1', 'C1=CC=NC=C1', 'C1=COC=C1', 'C1=CSC=C1', 'C1=CNC=C1'];
var CLS_GRUPOS = ['C', 'CC', 'CCC', 'C(C)C', 'O', 'N', 'Cl', 'Br', 'C=C', 'C(=O)O', 'OC', 'C#C', 'CO', 'C(=O)C', 'OCC'];

class ClassificadorCadeias {
  constructor(D) {
    this.D = D;
    this.ativo = false;
    this.t = 0;
    this.fonte = 'real';            // 'real': banco de moléculas · 'sorteada': gerador
    this.nivel = 1;                 // 1 abertas · 2 heteroátomos · 3 anéis · 4 aromáticas
    this.vista = 'estrutural';      // 'estrutural' (CH₃, CH₂…) · 'bastao' (só os vértices)
    this.pincel = 'primário';
    this.foco = null;               // átomo com o foco do teclado
    this._recentes = [];
    this._gesto = null;
    this._engolirClique = false;
    this._tela = {};
    this.nova(true);
    this._ligarPonteiro();
  }

  /* a troca de módulo LIMPA o que sai: uma estrutura nova, sem pintura nem respostas */
  reiniciar() { this.foco = null; this._gesto = null; this.nova(true); }

  ativar() { this.ativo = true; this._sincronizarPainel(); var cv = document.getElementById('sim-canvas'); if (cv) cv.style.touchAction = 'none'; }
  desativar() { this.ativo = false; }
  atualizar(dt) { this.t += dt; }

  /* ══ 1. ESCOLHER A ESTRUTURA ═══════════════════════════════════ */

  definirFonte(v) { if (v !== this.fonte) { this.fonte = v; this.nova(); } return {}; }
  definirNivel(v) { v = +v; if (v !== this.nivel) { this.nivel = v; this.nova(); } return {}; }
  definirVista(v) { this.vista = v === 'bastao' ? 'bastao' : 'estrutural'; this._sincronizarPainel(); return {}; }
  definirPincel(v) { if (CLS_INDICE[v] !== undefined) this.pincel = v; this._sincronizarPainel(); return {}; }

  /* uma molécula específica do banco (testes; e, no futuro, a escolha do professor) */
  carregar(id) {
    var m = Q3.BANCO_CADEIAS.filter(function (x) { return x.id === id; })[0];
    if (!m) return false;
    this.nivel = m.nivel; this.fonte = 'real';
    return this.nova(false, { id: m.id, nome: m.nome, contexto: m.contexto, g: Q3.deSmiles(m.smiles) });
  }

  nova(silencioso, escolhida) {
    var m = escolhida || (this.fonte === 'real' ? this._doBanco() : this._sorteada());
    var g = m.g, a = Q3.Classificacao.analisar(g);
    this.q = {
      id: m.id, nome: m.nome, contexto: m.contexto, g: g, a: a,
      pos: this._horizontal(Q3.Geometria.layout(g)),
      formula: g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); }),
      carbonos: g.pesados().filter(function (id) { return g.atomos[id].el === 'C'; }),
      etapa: 'carbonos', pintura: {}, conferencia: null,
      criterios: Q3.Classificacao.criterios(a), i: 0, respostas: {},
      evidencia: null, feedback: null, tracado: [], mao: null
    };
    this.foco = null;
    // o pincel "nulário" só existe quando há carbono sem vizinho carbono
    if (this.pincel === 'nulário' && !this._temNulario()) this.pincel = 'primário';
    this._sincronizarPainel();
    if (!silencioso) {
      playTone(660, .06, .04);
      announce(this.q.nome + ', ' + this.q.carbonos.length + ' carbonos. Primeiro, pinte cada carbono com a sua classe.');
    }
    return true;
  }

  /* Os livros desenham a cadeia principal na horizontal: gira o desenho
     para o eixo principal dos átomos (a direção de maior espalhamento)
     ficar deitado. Determinístico, como o layout. */
  _horizontal(pos) {
    var ids = Object.keys(pos), n = ids.length || 1, mx = 0, my = 0;
    ids.forEach(function (id) { mx += pos[id].x / n; my += pos[id].y / n; });
    var sxx = 0, syy = 0, sxy = 0;
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), sn = Math.sin(-th), out = {};
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; out[id] = { x: dx * c - dy * sn, y: dx * sn + dy * c }; });
    return out;
  }

  _doBanco() {
    var nivel = this.nivel, rec = this._recentes;
    var lista = Q3.BANCO_CADEIAS.filter(function (m) { return m.nivel === nivel; });
    var livres = lista.filter(function (m) { return rec.indexOf(m.id) < 0; });
    var m = (livres.length ? livres : lista)[Math.floor(Math.random() * (livres.length || lista.length))];
    rec.push(m.id); if (rec.length > Math.max(2, lista.length - 2)) rec.shift();
    return { id: m.id, nome: m.nome, contexto: m.contexto, g: Q3.deSmiles(m.smiles) };
  }

  /* Sorteada por nível: o gerador do núcleo, filtrado pelo que o nível
     pede; no nível 4, um núcleo aromático com um ou dois grupos. */
  _sorteada() {
    var nivel = this.nivel, g = null;
    for (var k = 0; k < 400 && !g; k++) {
      var c = nivel === 4 ? this._aromaticaSorteada() : Q3.gerarEstrutura();
      if (!c) continue;
      var a = Q3.Classificacao.analisar(c), soC = c.pesados().every(function (id) { return c.atomos[id].el === 'C'; });
      var cabe = nivel === 1 ? (a.cadeia === 'aberta' && soC) :
                 nivel === 2 ? (a.cadeia === 'aberta' && !soC) :
                 nivel === 3 ? (a.cadeia === 'fechada' && a.aromaticidade === 'alicíclica') : a.aromaticidade === 'aromática';
      if (cabe) g = c;
    }
    if (!g) return this._doBanco();       // nunca deixa o aluno sem estrutura
    return { id: null, nome: 'Estrutura sorteada', contexto: 'Sem nome para ajudar: classifique pela estrutura.', g: g };
  }

  _aromaticaSorteada() {
    var nucleo = CLS_NUCLEOS[Math.floor(Math.random() * CLS_NUCLEOS.length)];
    // posições de átomo de carbono no texto (depois do símbolo e dos dígitos de anel)
    var pontos = [];
    for (var i = 0; i < nucleo.length; i++) {
      if (nucleo[i] !== 'C') continue;
      var j = i + 1; while (j < nucleo.length && /[0-9]/.test(nucleo[j])) j++;
      pontos.push(j);
    }
    var n = 1 + Math.floor(Math.random() * 2), escolhidos = [];
    while (escolhidos.length < n && escolhidos.length < pontos.length) {
      var p = pontos[Math.floor(Math.random() * pontos.length)];
      if (escolhidos.indexOf(p) < 0) escolhidos.push(p);
    }
    escolhidos.sort(function (x, y) { return y - x; });      // de trás para frente: os índices não andam
    var s = nucleo;
    escolhidos.forEach(function (p) { s = s.slice(0, p) + '(' + CLS_GRUPOS[Math.floor(Math.random() * CLS_GRUPOS.length)] + ')' + s.slice(p); });
    try { return Q3.deSmiles(s); } catch (e) { return null; }   // carbono sem H livre (fusão): tenta de novo
  }

  _temNulario() { var a = this.q && this.q.a; return !!a && Object.keys(a.classes).some(function (id) { return a.classes[id] === 'nulário'; }); }

  /* ══ 2. PINTAR OS CARBONOS ═════════════════════════════════════ */

  _pintar(id) {
    var q = this.q;
    if (q.etapa !== 'carbonos' || q.g.atomos[id].el !== 'C') return false;
    if (q.pintura[id] === this.pincel) return false;
    q.pintura[id] = this.pincel;
    if (q.conferencia) delete q.conferencia[id];        // repintado: o erro marcado some
    playTone(520 + CLS_INDICE[this.pincel] * 90, .035, .025);
    return true;
  }

  /* PREVER → REVELAR (princípio do projeto: sem pistas, nova tentativa
     guiada ou celebração). A pintura é a previsão; revelar mostra todas as
     classes e marca onde a previsão diferiu. */
  conferirCarbonos() {
    var q = this.q;
    if (q.etapa !== 'carbonos') return false;
    var diferentes = q.carbonos.filter(function (id) { return q.pintura[id] && q.pintura[id] !== q.a.classes[id]; });
    q.carbonos.forEach(function (id) { q.pintura[id] = q.a.classes[id]; });
    q.conferencia = null;
    if (diferentes.length) { q.conferencia = {}; diferentes.forEach(function (id) { q.conferencia[id] = false; }); }
    this._iniciarCadeia('Classes reveladas: cada carbono é primário, secundário, terciário ou quaternário conforme o número de carbonos ligados a ele — a dupla e a tripla contam como um vizinho, e O, N ou Cl não contam.' +
      (diferentes.length ? ' Os carbonos marcados eram outra classe na previsão.' : ''));
    return true;
  }


  revelarCarbonos() { return this.conferirCarbonos(); }


  _iniciarCadeia(texto) {
    var q = this.q;
    q.etapa = 'cadeia'; q.i = 0;
    this._retorno('ok', texto + ' ' + CLS_PERGUNTA[q.criterios[0].chave]);
    this._sincronizarPainel();
  }

  /* ══ 3. A CADEIA, UM CRITÉRIO POR VEZ ══════════════════════════ */

  get criterio() { var q = this.q; return q.etapa === 'cadeia' ? q.criterios[q.i] : null; }

  responder(op) {
    var q = this.q, c = this.criterio;
    if (!c) return false;
    q.respostas[c.chave] = { escolhida: op };
    q.evidencia = null; q.tracado = [];
    // opção AFIRMATIVA: pede onde está a evidência — sempre, esteja a previsão certa ou não
    // (pedir só quando certa entregaria a resposta)
    var ev = CLS_EVIDENCIA[c.chave + ':' + op];
    if (ev) {
      q.evidencia = { chave: c.chave, op: op, tipo: ev.tipo, alvo: op === c.resposta && ev.alvo ? ev.alvo(q.a) : [], pedido: ev.pedido.replace(/^Prove: /, 'Aponte: ') };
      playTone(660, .05, .03);
      this._retorno('info', 'Previsão: ' + op + '. ' + q.evidencia.pedido + ' Se não souber onde, revele sem apontar.');
      this._sincronizarPainel();
      return true;
    }
    this._revelarCriterio(null);
    return true;
  }


  /* o aluno apontou um átomo, uma ligação ou um anel: confere a evidência */
  _apontar(alvo) {
    var q = this.q, ev = q.evidencia, a = q.a, g = q.g;
    if (!ev) return false;
    var el = function (id) { return g.atomos[id].el; };
    var certo = false, texto = '', realce = null;
    if (ev.tipo === 'ligacao') {
      if (alvo.atomo) {
        // no teclado, o foco está num átomo: vale a dupla ou tripla C–C dele
        var dele = a.insaturacoes.filter(function (l) { return l.a === alvo.atomo || l.b === alvo.atomo; });
        if (dele.length) { certo = true; realce = { ligacoes: dele }; }
        else texto = 'Esse átomo não tem dupla nem tripla com outro carbono. Toque na ligação — o traço duplo ou triplo.';
      } else {
        var l = alvo.ligacao, eh = function (x) { return (x.a === l.a && x.b === l.b) || (x.a === l.b && x.b === l.a); };
        if (a.insaturacoes.some(eh)) { certo = true; realce = { ligacoes: [l] }; }
        else if (a.naoContam.some(eh)) { texto = 'Essa ' + (l.ordem === 3 ? 'tripla' : 'dupla') + ' liga ' + el(l.a) + ' e ' + el(l.b) + ': não é ENTRE CARBONOS, então não conta para a saturação da cadeia. Procure outra.'; realce = { ligacoes: [l] }; }
        else { texto = 'Essa ligação é simples. Procure a dupla ou a tripla entre carbonos.'; realce = { ligacoes: [l] }; }
      }
    } else if (ev.tipo === 'anel' || ev.tipo === 'anelArom') {
      var aneis = alvo.anel !== undefined ? [a.aneis[alvo.anel]] : a.aneis.filter(function (r) { return alvo.atomo && r.atomos.indexOf(alvo.atomo) >= 0; });
      if (ev.tipo === 'anel') {
        certo = !!alvo.fechou || aneis.length > 0;
        realce = certo ? { anel: alvo.caminho || aneis[0].atomos } : null;
        if (!certo) texto = alvo.caminho ? 'O caminho não voltou ao átomo de partida: um anel se fecha sobre si mesmo.' : 'Esse átomo não está em nenhum anel.';
      } else {
        var arom = aneis.filter(function (r) { return r.aromatico; });
        if (arom.length) { certo = true; realce = { anel: arom[0].atomos }; }
        else if (aneis.length) { texto = 'Esse anel não é aromático: ' + this._porqueNaoAromatico(aneis[0]); realce = { anel: aneis[0].atomos }; }
        else texto = 'Toque dentro de um anel.';
      }
    } else {                                  // tipo 'atomo'
      var id = alvo.atomo;
      if (!id) texto = 'Toque num átomo.';
      else if (ev.alvo.indexOf(id) >= 0) { certo = true; realce = { atomos: [id] }; }
      else { texto = this._explicarAtomoErrado(ev.chave, id); realce = { atomos: [id] }; }
    }
    // a previsão está feita: revela, explicando o que foi apontado quando não era a evidência
    this._revelarCriterio(certo ? null : { texto: texto || 'não era a evidência.' });
    return true;
  }


  _avancar(texto, realce) {
    var q = this.q;
    q.conferencia = null;
    q.i++;
    if (q.i < q.criterios.length) {
      this._retorno('info', texto + '  →  ' + CLS_PERGUNTA[q.criterios[q.i].chave], realce);
      this._sincronizarPainel();
      return;
    }
    /* FIM: sem contagem, placar ou celebração — a classificação completa */
    q.etapa = 'fim';
    playTone(660, .08, .04);
    this._retorno('info', texto + '  ·  Cadeia ' + this._resumo() + '. Toque em Nova estrutura para seguir.', realce);
    this._sincronizarPainel();
  }

  /* a revelação de um critério: a resposta calculada, a evidência real
     destacada e, se a previsão diferiu, a química que explica a diferença */
  _revelarCriterio(apontado) {
    var q = this.q, c = this.criterio, op = (q.respostas[c.chave] || {}).escolhida, certa = c.resposta;
    q.evidencia = null; q.tracado = [];
    var just = this._explicarAcerto(c.chave, certa), texto = just.texto, realce = just.realce;
    if (op && op !== certa) {
      var e = this._explicarErro(c.chave, op, certa);
      texto += ' Na previsão: ' + op + ' — ' + e.texto;
      realce = e.realce || realce;
    } else if (apontado && apontado.texto) texto += ' No que você apontou: ' + apontado.texto;
    playTone(660, .06, .03);
    this._avancar(texto, realce);
  }


  _resumo() {
    var q = this.q;
    return q.criterios.map(function (c) { return c.chave === 'tipoPolinuclear' ? 'de núcleos ' + c.resposta : c.resposta; }).join(', ');
  }

  /* ── as explicações: todas saem da análise do núcleo ─────────── */

  _explicarAcerto(chave, op) {
    var a = this.q.a, g = this.q.g, el = function (id) { return g.atomos[id].el; };
    switch (chave) {
      case 'cadeia':
        if (op === 'aberta') return { texto: 'Aberta: não há anel — a cadeia tem pontas livres.' };
        if (op === 'mista') return { texto: 'Mista: um anel e uma parte aberta.', realce: { atomos: a.parteAberta } };
        return { texto: 'Fechada: os átomos do anel formam um ciclo.', realce: { anel: a.aneis[0].atomos } };
      case 'ramificacao':
        if (op === 'ramificada') return { texto: 'Ramificada: deste átomo sai um caminho a mais.', realce: { atomos: a.pontosRamificacao } };
        if (a.pendentes.length && a.cadeia === 'aberta') return { texto: 'Normal: ' + this._lista(a.pendentes) + ' na ponta é grupo, não ramo — a cadeia só tem duas pontas.', realce: { atomos: a.pendentes } };
        if (clsFusao(a).length) return { texto: 'Normal: os carbonos de fusão pertencem aos dois anéis, não são ramificação.', realce: { atomos: clsFusao(a) } };
        return { texto: 'Normal: nenhum átomo abre um caminho a mais.' };
      case 'saturacao':
        if (op === 'insaturada') return { texto: 'Insaturada: há ligação múltipla entre carbonos.', realce: { ligacoes: a.insaturacoes } };
        if (a.naoContam.length) return { texto: 'Saturada: a ligação ' + (a.naoContam[0].ordem === 3 ? 'tripla ' : 'dupla ') + el(a.naoContam[0].a) + '–' + el(a.naoContam[0].b) + ' não conta — não é entre carbonos.', realce: { ligacoes: a.naoContam } };
        return { texto: 'Saturada: entre carbonos, só ligações simples.' };
      case 'natureza':
        if (op === 'heterogênea') return { texto: 'Heterogênea: há heteroátomo entre dois carbonos.', realce: { atomos: a.heteroatomos } };
        if (a.pendentes.length) return { texto: 'Homogênea: ' + this._lista(a.pendentes) + ' está na ponta, ligado a um carbono só — é grupo, não parte da cadeia.', realce: { atomos: a.pendentes } };
        return { texto: 'Homogênea: só carbonos na cadeia.' };
      case 'aromaticidade':
        if (op === 'aromática') {
          var ar = a.aneis.filter(function (r) { return r.aromatico; })[0], n = ar.eletronsPi;
          return { texto: 'Aromática: ' + n + ' elétrons π = 4·' + ((n - 2) / 4) + ' + 2, a regra de Hückel.', realce: { anel: ar.atomos } };
        }
        return { texto: 'Não aromática (alicíclica): ' + this._porqueNaoAromatico(a.aneis[0]), realce: { anel: a.aneis[0].atomos } };
      case 'heterociclo':
        if (op === 'heterocíclica') return { texto: 'Heterocíclica: há heteroátomo no próprio anel.', realce: { atomos: a.heteroNoAnel } };
        if (a.heteroatomos.length) return { texto: 'Homocíclica: o anel só tem carbonos — o ' + this._lista(a.heteroatomos) + ' está fora dele.', realce: { atomos: a.heteroatomos } };
        return { texto: 'Homocíclica: o anel só tem carbonos.' };
      case 'nucleos':
        return op === 'mononuclear' ? { texto: 'Mononuclear: um só anel aromático.' } : { texto: 'Polinuclear: mais de um anel aromático.' };
      case 'tipoPolinuclear':
        return op === 'condensados' ? { texto: 'Condensados: os anéis compartilham átomos.', realce: { atomos: clsFusao(a) } } : { texto: 'Isolados: os anéis não compartilham átomos — uma ligação os une.' };
    }
    return { texto: 'Certo.' };
  }

  _explicarErro(chave, op, certa) {
    var a = this.q.a, g = this.q.g, el = function (id) { return g.atomos[id].el; };
    switch (chave) {
      case 'cadeia':
        if (certa === 'aberta') return { texto: 'Não há anel: a cadeia tem pontas livres, nenhum caminho volta ao começo.' };
        if (certa === 'mista') return { texto: 'Há um anel E uma parte aberta (destacada): pela convenção escolhida, isso é mista.', realce: { atomos: a.parteAberta } };
        return { texto: 'Há um anel: siga os átomos destacados e você volta ao começo.', realce: { anel: a.aneis[0].atomos } };
      case 'ramificacao':
        if (certa === 'ramificada') return { texto: 'Deste átomo saem três ou mais caminhos na cadeia: é uma ramificação.', realce: { atomos: a.pontosRamificacao } };
        if (a.pendentes.length) return { texto: this._lista(a.pendentes) + ' na ponta é um grupo, não um ramo da cadeia.', realce: { atomos: a.pendentes } };
        if (clsFusao(a).length) return { texto: 'Os carbonos de fusão têm três vizinhos, mas todos no anel: não é ramificação.', realce: { atomos: clsFusao(a) } };
        return { texto: 'Nenhum átomo da cadeia tem três ou mais vizinhos na cadeia.' };
      case 'saturacao':
        if (certa === 'insaturada') return { texto: 'Há ligação ' + (a.insaturacoes[0].ordem === 3 ? 'tripla' : 'dupla') + ' entre carbonos (destacada).', realce: { ligacoes: a.insaturacoes } };
        if (a.naoContam.length) return { texto: 'A dupla ' + el(a.naoContam[0].a) + '=' + el(a.naoContam[0].b) + ' não conta: não é entre dois carbonos.', realce: { ligacoes: a.naoContam } };
        return { texto: 'Entre carbonos, todas as ligações são simples.' };
      case 'natureza':
        if (certa === 'heterogênea') return { texto: 'O ' + this._lista(a.heteroatomos) + ' destacado está ENTRE dois carbonos: faz parte da cadeia.', realce: { atomos: a.heteroatomos } };
        if (a.pendentes.length) return { texto: 'O ' + this._lista(a.pendentes) + ' está na ponta, ligado a um carbono só: é grupo, não parte da cadeia.', realce: { atomos: a.pendentes } };
        return { texto: 'Só há carbonos na cadeia.' };
      case 'aromaticidade':
        if (certa === 'aromática') { var ar = a.aneis.filter(function (r) { return r.aromatico; })[0]; return { texto: 'Esse anel tem ' + ar.eletronsPi + ' elétrons π, e ' + ar.eletronsPi + ' = 4n + 2 (regra de Hückel): é aromático.', realce: { anel: ar.atomos } }; }
        return { texto: this._porqueNaoAromatico(a.aneis[0]), realce: { anel: a.aneis[0].atomos } };
      case 'heterociclo':
        if (certa === 'heterocíclica') return { texto: 'O anel tem ' + this._lista(a.heteroNoAnel) + ' (destacado).', realce: { atomos: a.heteroNoAnel } };
        if (a.heteroatomos.length) return { texto: 'O ' + this._lista(a.heteroatomos) + ' está fora do anel: o anel só tem carbonos.', realce: { atomos: a.heteroatomos } };
        return { texto: 'O anel só tem carbonos.' };
      case 'nucleos':
        return certa === 'polinuclear' ? { texto: 'Há mais de um anel aromático.', realce: { atomos: [].concat.apply([], a.aneis.filter(function (r) { return r.aromatico; }).map(function (r) { return r.atomos; })) } } : { texto: 'Só há um anel aromático.' };
      case 'tipoPolinuclear':
        return certa === 'condensados' ? { texto: 'Estes carbonos pertencem aos dois anéis: os núcleos são condensados.', realce: { atomos: clsFusao(a) } } : { texto: 'Os anéis não compartilham nenhum átomo: estão isolados, unidos por uma ligação.' };
    }
    return { texto: 'Não é isso.' };
  }

  _explicarAtomoErrado(chave, id) {
    var q = this.q, a = q.a, g = q.g, el = g.atomos[id].el;
    var vizC = g.vizinhos(id).filter(function (v) { return g.atomos[v.id].el === 'C'; }).length;
    var pendente = a.pendentes.indexOf(id) >= 0;
    if (chave === 'natureza' || chave === 'heterociclo') {
      if (el === 'C') return 'Esse é um carbono. Procure um átomo diferente de carbono' + (chave === 'heterociclo' ? ' dentro do anel.' : ' entre dois carbonos.');
      if (pendente) return 'Esse ' + el + ' está na ponta, ligado a um carbono só: é grupo, não parte da cadeia. Essa é a pegadinha clássica.';
      return 'Esse ' + el + ' está fora do anel.';
    }
    if (chave === 'ramificacao') {
      if (pendente) return 'Esse ' + el + ' é um grupo na ponta, não um ramo da cadeia.';
      if (a.cadeia === 'fechada') return 'Em anel, a ramificação é a cadeia lateral: toque no átomo do anel de onde ela sai.';
      return 'Esse átomo tem ' + vizC + (vizC === 1 ? ' vizinho' : ' vizinhos') + ' na cadeia: ' + (vizC <= 1 ? 'é uma ponta.' : 'é um elo do meio.') + ' A ramificação sai de um átomo com três ou mais.';
    }
    if (chave === 'tipoPolinuclear') return 'Esse carbono pertence a um anel só.';
    if (chave === 'cadeia') return 'Esse átomo faz parte do anel. Toque num átomo da parte aberta.';
    return 'Não é esse.';
  }

  _porqueNaoAromatico(r) {
    if (r.eletronsPi === null) return 'o anel tem átomo sem ligação dupla no ciclo (como um CH₂), e a nuvem π não é contínua.';
    return 'o anel tem ' + r.eletronsPi + ' elétrons π, e ' + r.eletronsPi + ' não é 4n + 2 (regra de Hückel).';
  }

  _lista(ids) {
    var g = this.q.g, D = Q3.Desenho, vistos = [];
    ids.forEach(function (id) { var r = D.rotulo(g, id); if (vistos.indexOf(r) < 0) vistos.push(r); });
    return vistos.join(', ');
  }

  _retorno(tipo, texto, realce) {
    this.q.feedback = { tipo: tipo, texto: texto, realce: realce || null, t0: this.t };
    announce(texto);
    this._sincronizarPainel();
  }

  /* ══ ENTRADA: ponteiro (pintar, traçar, apontar) e teclado ═══════ */

  _ligarPonteiro() {
    var cv = document.getElementById('sim-canvas'), self = this;
    if (!cv) return;
    var local = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left - (cv.cenaX || 0), y: e.clientY - r.top }; }   // na cena (a área livre do card flutuante);
    cv.addEventListener('pointerdown', function (e) {
      if (!self.ativo) return;
      var p = local(e), q = self.q, at = self._atomoEm(p.x, p.y);
      self._gesto = { id: e.pointerId, x0: p.x, y0: p.y, moveu: false, tipo: null, atomo: at };
      if (q.etapa === 'carbonos' && at && q.g.atomos[at].el === 'C') {
        self._gesto.tipo = 'pintar'; self._gesto.antes = q.pintura[at];
        self._pintar(at);
      } else if (q.evidencia && q.evidencia.tipo === 'anel' && at && self._emAnel(at)) {
        self._gesto.tipo = 'tracar'; q.tracado = [at]; q.mao = p;
      }
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* segue */ }
    });
    cv.addEventListener('pointermove', function (e) {
      var gs = self._gesto;
      if (!self.ativo) return;
      var p = local(e);
      if (!gs || e.pointerId !== gs.id) {           // sem gesto: o cursor mostra o que dá para fazer
        var sobre = self._atomoEm(p.x, p.y) || (self.q.evidencia && self.q.evidencia.tipo === 'ligacao' && self._ligacaoEm(p.x, p.y));
        cv.style.cursor = sobre ? 'pointer' : '';
        return;
      }
      if (Math.hypot(p.x - gs.x0, p.y - gs.y0) > 5) gs.moveu = true;
      var q = self.q, at = self._atomoEm(p.x, p.y);
      if (gs.tipo === 'pintar' && at && q.g.atomos[at].el === 'C') self._pintar(at);
      if (gs.tipo === 'tracar') {
        q.mao = p;
        var tr = q.tracado, ult = tr[tr.length - 1];
        if (at && at !== ult && q.g.ligacao(ult, at)) {
          if (tr.length >= 2 && at === tr[tr.length - 2]) tr.pop();              // voltou atrás: desfaz
          else if (at === tr[0] && tr.length >= 3) { gs.fechou = true; }        // voltou ao começo: fechou
          else if (tr.indexOf(at) < 0) { tr.push(at); playTone(560 + tr.length * 40, .03, .02); }
        }
      }
    });
    var fim = function (e) {
      var gs = self._gesto; if (!gs || e.pointerId !== gs.id) return;
      self._gesto = null;
      var q = self.q;
      try { cv.releasePointerCapture(e.pointerId); } catch (err) { /* já solto */ }
      self._engolirClique = true;
      if (gs.tipo === 'pintar') {
        // um toque (sem arrastar) num carbono já pintado com o mesmo pincel: despinta
        if (!gs.moveu && gs.antes === self.pincel) { delete q.pintura[gs.atomo]; playTone(360, .03, .02); }
        var faltam = q.carbonos.filter(function (id) { return !q.pintura[id]; }).length;
        announce(faltam ? 'Faltam ' + faltam + ' carbonos.' : 'Todos os carbonos pintados. Confira.');
        self._sincronizarPainel();
        return;
      }
      if (gs.tipo === 'tracar') {
        var caminho = q.tracado.slice(); q.tracado = []; q.mao = null;
        if (gs.moveu) self._apontar({ caminho: caminho, fechou: !!gs.fechou && caminho.length >= 3 });
        else self._retorno('info', 'Arraste: passe pelos átomos do anel até voltar ao primeiro.');
        return;
      }
      // toque simples: apontar evidência
      if (!q.evidencia || gs.moveu) return;
      var p = { x: gs.x0, y: gs.y0 }, ev = q.evidencia;
      if (ev.tipo === 'ligacao') {
        var l = self._ligacaoEm(p.x, p.y);
        if (l) self._apontar({ ligacao: l });
        else if (gs.atomo) self._apontar({ atomo: gs.atomo });
      } else if (ev.tipo === 'anelArom') {
        var r = self._anelEm(p.x, p.y);
        if (r !== null) self._apontar({ anel: r }); else if (gs.atomo) self._apontar({ atomo: gs.atomo }); else self._apontar({});
      } else if (ev.tipo === 'atomo') {
        self._apontar({ atomo: gs.atomo });
      }
    };
    cv.addEventListener('pointerup', fim);
    cv.addEventListener('pointercancel', function (e) { if (self._gesto && e.pointerId === self._gesto.id) { self._gesto = null; self.q.tracado = []; } });
  }

  tocar() { if (this._engolirClique) { this._engolirClique = false; return true; } return false; }

  /* setas: o foco anda para o átomo mais próximo naquela direção */
  navegar(dx, dy) {
    var q = this.q, T = this._tela, ids = Object.keys(T);
    if (!ids.length) return false;
    if (!this.foco || !T[this.foco]) {
      this.foco = ids.slice().sort(function (a, b) { return T[a].x - T[b].x; })[0];
    } else {
      var o = T[this.foco], melhor = null, custo = Infinity;
      ids.forEach(function (id) {
        if (id === this.foco) return;
        var vx = T[id].x - o.x, vy = T[id].y - o.y, d = Math.hypot(vx, vy), al = (vx * dx + vy * dy) / (d || 1);
        if (al < 0.35) return;
        var cst = d * (2 - al);
        if (cst < custo) { custo = cst; melhor = id; }
      }, this);
      if (melhor) this.foco = melhor;
    }
    var g = q.g, id = this.foco, el = g.atomos[id].el;
    var vizC = g.vizinhos(id).filter(function (v) { return g.atomos[v.id].el === 'C'; }).length;
    announce(Q3.Desenho.rotulo(g, id) + ', ligado a ' + vizC + (vizC === 1 ? ' carbono' : ' carbonos') +
      (q.pintura[id] ? ', pintado de ' + q.pintura[id] : '') + '. Enter ' + (q.etapa === 'carbonos' && el === 'C' ? 'pinta com o pincel ' + this.pincel : q.evidencia ? 'aponta como evidência' : 'não faz nada agora') + '.');
    return true;
  }

  /* Enter no canvas: pinta o átomo em foco, ou o aponta como evidência */
  acaoFoco() {
    var q = this.q, id = this.foco;
    if (!id) { announce('Use as setas para escolher um átomo.'); return false; }
    if (q.etapa === 'carbonos' && q.g.atomos[id].el === 'C') {
      if (q.pintura[id] === this.pincel) delete q.pintura[id]; else this._pintar(id);
      this._sincronizarPainel();
      announce(q.pintura[id] ? 'Pintado de ' + q.pintura[id] + '.' : 'Classe removida.');
      return true;
    }
    if (q.evidencia) return this._apontar({ atomo: id });
    return false;
  }

  acao(nome) {
    if (nome === 'cls-nova') return this.nova();
    if (nome === 'cls-conferir') return this.conferirCarbonos();
    if (nome === 'cls-revelar') return this.q.evidencia ? (this._revelarCriterio(null), true) : this.revelarCarbonos();
    if (nome === 'cls-acao') return this.acaoFoco();
    return false;
  }

  /* ── o que está sob o ponteiro ── */
  _atomoEm(x, y) {
    var T = this._tela, melhor = null, dm = Infinity, raio = Math.max(18, (this._fonte || 14) * 1.3);
    Object.keys(T).forEach(function (id) { var d = Math.hypot(T[id].x - x, T[id].y - y); if (d < raio && d < dm) { dm = d; melhor = id; } });
    return melhor;
  }
  _ligacaoEm(x, y) {
    var T = this._tela, melhor = null, dm = 11;
    this.q.g.ligacoes.forEach(function (l) {
      var a = T[l.a], b = T[l.b]; if (!a || !b) return;
      var vx = b.x - a.x, vy = b.y - a.y, L2 = vx * vx + vy * vy, k = ((x - a.x) * vx + (y - a.y) * vy) / (L2 || 1);
      if (k < 0.18 || k > 0.82) return;                          // perto das pontas é o átomo, não a ligação
      var d = Math.hypot(a.x + k * vx - x, a.y + k * vy - y);
      if (d < dm) { dm = d; melhor = l; }
    });
    return melhor;
  }
  _anelEm(x, y) {
    var T = this._tela, achado = null, menor = Infinity;
    this.q.a.aneis.forEach(function (r, i) {
      var dentro = false, pts = r.atomos.map(function (id) { return T[id]; });
      for (var j = 0, k = pts.length - 1; j < pts.length; k = j++) {
        if ((pts[j].y > y) !== (pts[k].y > y) && x < (pts[k].x - pts[j].x) * (y - pts[j].y) / (pts[k].y - pts[j].y) + pts[j].x) dentro = !dentro;
      }
      if (dentro && r.atomos.length < menor) { menor = r.atomos.length; achado = i; }
    });
    return achado;
  }
  _emAnel(id) { return this.q.a.aneis.some(function (r) { return r.atomos.indexOf(id) >= 0; }); }

  /* ══ DESENHO ════════════════════════════════════════════════════ */

  desenhar(ctx, W, H) {
    var q = this.q, g = q.g, P = Q3.Desenho.paleta(), D = Q3.Desenho, self = this;
    var claro = P.claro, aviso = claro ? '#8a4b00' : '#ffb454';
    // área útil: abaixo do cabeçalho (nome e pedido) e acima do retorno
    this._cabBaixo = H < 300;   // cena muito baixa (celular pequeno deitado): o cabeçalho se aperta, para sobrar estrutura
    var cab = this._desenharCabecalho(ctx, W, P, aviso, true);   // o cabeçalho pode quebrar em linhas (tela estreita)
    var topo = Math.max(150, cab + 22), reserva = 118, folga = 60, esq = 28, dir = W - 28;   // reserva: o retorno mais alto (4 linhas)
    /* CENA BAIXA (celular deitado): com as folgas de sempre, a altura da estrutura dava NEGATIVA — a molécula
       saía espelhada e minúscula. Aqui ela começa logo abaixo do cabeçalho (com folga para os selos de classe).
       Numa faixa larga, o retorno não disputa a altura: mora numa coluna à esquerda, embaixo do cabeçalho, e a
       estrutura fica à direita dele (longe da coluna dos botões de zoom). Numa faixa estreita, se não sobrar
       altura, a estrutura fica com ela e o retorno passa por cima do pé. */
    this._retLado = null;
    if (H < 430) {
      topo = cab + 18; folga = this._cabBaixo ? 22 : 30;
      if (W >= 560) {
        reserva = 22; dir = W - 64; folga = this._cabBaixo ? 30 : 40;   // os selos de classe descem abaixo do átomo de baixo
        if (q.feedback) { this._retLado = { x: 24, y: cab + 8, w: Math.round(W * (this._cabBaixo ? 0.5 : 0.42)) }; esq = this._retLado.x + this._retLado.w + 16; }
      } else {
        reserva = 118;
        if (H - reserva - topo - folga < 50) reserva = 24;
      }
    }
    var base = H - reserva;
    var ids = Object.keys(q.pos), xs = ids.map(function (id) { return q.pos[id].x; }), ys = ids.map(function (id) { return q.pos[id].y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs), minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var s = Math.min(96, (dir - esq - 110) / Math.max(1, maxX - minX), Math.max(14, base - topo - folga) / Math.max(1, maxY - minY));
    var cx = (esq + dir) / 2 - (minX + maxX) / 2 * s, cy = (topo + base) / 2 - (minY + maxY) / 2 * s;
    var T = {}; ids.forEach(function (id) { T[id] = { x: cx + q.pos[id].x * s, y: cy + q.pos[id].y * s }; });
    this._tela = T;
    var fonte = this._fonte = Math.max(12, Math.min(17, s * 0.3));
    var rotulo = function (id) { return self.vista === 'bastao' && g.atomos[id].el === 'C' ? '' : D.rotulo(g, id); };
    var margem = {}; ids.forEach(function (id) { var r = rotulo(id); margem[id] = r ? D.medirRotulo(ctx, r, fonte) : { mx: 0, my: 0 }; });
    var centroAnel = function (l) {
      var r = q.a.aneis.filter(function (x) { return x.atomos.indexOf(l.a) >= 0 && x.atomos.indexOf(l.b) >= 0; })[0];
      if (!r) return null;
      var sx = 0, sy = 0; r.atomos.forEach(function (id) { sx += T[id].x; sy += T[id].y; });
      return { x: sx / r.atomos.length, y: sy / r.atomos.length };
    };
    ctx.save();
    // realce do retorno (por baixo de tudo)
    var fb = q.feedback, rl = fb && fb.realce, corRl = fb ? (fb.tipo === 'ok' ? P.ok : fb.tipo === 'erro' ? aviso : P.acento) : P.acento;
    if (rl) {
      ctx.globalAlpha = 0.85;
      if (rl.anel) {
        ctx.beginPath(); rl.anel.forEach(function (id, k) { var p = T[id]; if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.closePath();
        ctx.fillStyle = clsRgba(corRl, 0.16); ctx.fill(); ctx.strokeStyle = corRl; ctx.lineWidth = 9; ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 0.85;
      }
      (rl.ligacoes || []).forEach(function (l) { var a = T[l.a], b = T[l.b]; ctx.strokeStyle = clsRgba(corRl, 0.45); ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      (rl.atomos || []).forEach(function (id) { var p = T[id]; ctx.strokeStyle = corRl; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(margem[id].mx, 12) + 9, 0, Math.PI * 2); ctx.stroke(); });
      ctx.globalAlpha = 1;
    }
    // o anel sendo traçado
    if (q.tracado.length) {
      ctx.strokeStyle = clsRgba(P.acento, 0.7); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); q.tracado.forEach(function (id, k) { var p = T[id]; if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      if (q.mao) ctx.lineTo(q.mao.x, q.mao.y);
      ctx.stroke();
    }
    // ligações
    g.ligacoes.forEach(function (l) {
      D.ligacao(ctx, T[l.a], T[l.b], l.ordem, margem[l.a], margem[l.b], { cor: P.texto, largura: 2.4, interno: centroAnel(l) });
    });
    // átomos, com o aro da classe pintada
    ids.forEach(function (id) {
      var el = g.atomos[id].el, p = T[id], pint = q.pintura[id], conf = q.conferencia && q.conferencia[id];
      var corAro = pint ? P.classes[CLS_INDICE[pint]] : null;
      var r = rotulo(id);
      if (r) D.atomo(ctx, p, r, fonte, P, { corTexto: P.elementos[el] || P.texto, aro: corAro });
      else if (pint) { ctx.fillStyle = corAro; ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill(); }
      if (pint) {
        /* o selo vai no meio da MAIOR abertura entre as ligações. "Oposto à
           soma dos vizinhos" falhava no carbono quaternário: os quatro se
           equilibram, a soma dá quase zero e o selo caía numa ligação. */
        var angs = g.vizinhos(id).map(function (v) { return Math.atan2(T[v.id].y - p.y, T[v.id].x - p.x); }).sort(function (x, y) { return x - y; });
        var dirA = -Math.PI / 2;
        if (angs.length === 1) dirA = angs[0] + Math.PI;
        else if (angs.length > 1) {
          var maior = -1;
          angs.forEach(function (an, k) {
            var prox = k + 1 < angs.length ? angs[k + 1] : angs[0] + 2 * Math.PI, vao = prox - an;
            if (vao > maior) { maior = vao; dirA = an + vao / 2; }
          });
        }
        D.seloClasse(ctx, p, CLS_INDICE[pint], corAro, Math.cos(dirA), Math.sin(dirA), Math.max(margem[id].mx, 10) + 14);
      }
      if (q.conferencia && conf === false) {
        ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = aviso; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(margem[id].mx, 12) + 7, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      if (self.foco === id) D.foco(ctx, p, Math.max(margem[id].mx, 12) + 12, P.acento);
    });
    ctx.restore();
    this._desenharCabecalho(ctx, W, P, aviso);
    this._desenharRetorno(ctx, W, H, P, aviso);
  }

  /* o cabeçalho: o nome, o contexto e o pedido da etapa. Numa tela estreita a fonte encolhe e o contexto
     e o pedido quebram em linhas — nada sai pela borda. `soMedir`: só mede (a área da estrutura começa
     abaixo dele) e devolve a altura em que ele termina. */
  _desenharCabecalho(ctx, W, P, aviso, soMedir) {
    var q = this.q, self = this, D = Q3.Desenho, larg = W - 24 - 16;
    var largNome = q.etapa !== 'carbonos' ? larg - q.criterios.length * 18 - 16 : larg;   // os pontos do progresso moram à direita do nome
    ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    // abaixo do selo de modo ativo, que o app desenha no topo, ao centro
    var yN = this._cabBaixo ? 62 : 70, yC = this._cabBaixo ? 80 : 90, vao = this._cabBaixo ? 24 : 30;
    ctx.fillStyle = P.texto; D.textoQueCabe(ctx, q.nome, 24, yN, largNome, { peso: '700', tam: 16, min: 13, linhas: 1, medir: soMedir });
    ctx.fillStyle = P.suave; var r2 = D.textoQueCabe(ctx, q.contexto + '  ·  ' + q.formula, 24, yC, larg, { tam: 12.5, min: 10.5, linhas: 2, medir: soMedir });
    // o pedido da etapa
    var pedido = q.etapa === 'carbonos' ? 'Preveja a classe de cada carbono pintando-o — ou revele direto.' :
                 q.etapa === 'fim' ? 'Classificação completa.' :
                 q.evidencia ? q.evidencia.pedido : CLS_PERGUNTA[this.criterio.chave];
    var yp = yC + (r2.linhas - 1) * r2.tam * 1.28 + vao;
    ctx.fillStyle = q.evidencia ? P.acento : P.texto;
    var r3 = D.textoQueCabe(ctx, pedido, 24, yp, larg, { peso: '600', tam: 14, min: 11.5, linhas: 3, medir: soMedir });
    if (soMedir) { ctx.restore(); return yp + (r3.linhas - 1) * r3.tam * 1.28 + 6; }
    // o progresso dos critérios: um ponto por critério
    if (q.etapa !== 'carbonos') {
      var n = q.criterios.length, x0 = W - 24 - n * 18;
      q.criterios.forEach(function (c, k) {
        // só mostra ONDE o aluno está: feito, atual ou por fazer — sem cor de acerto
        var feito = q.etapa === 'fim' || k < q.i, cor = feito ? clsRgba(P.texto, 0.75) : clsRgba(P.suave, 0.4);
        ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x0 + k * 18 + 6, yN - 4, 6, 0, Math.PI * 2); ctx.fill();
        if (k === q.i && q.etapa === 'cadeia') { ctx.strokeStyle = P.texto; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x0 + k * 18 + 6, yN - 4, 9, 0, Math.PI * 2); ctx.stroke(); }
      });
    }
    ctx.restore();
  }

  _desenharRetorno(ctx, W, H, P, aviso) {
    var fb = this.q.feedback;
    if (!fb) return;
    var cor = fb.tipo === 'ok' ? P.ok : fb.tipo === 'erro' ? aviso : P.acento;
    // ao lado (celular deitado): na coluna da esquerda, embaixo do cabeçalho, com letra um pouco menor e mais linhas
    var lado = this._retLado, tam = lado ? 12.5 : 13.5, entre = lado ? 17 : 19;
    var larg = lado ? lado.w : Math.min(W - 48, 680), x0 = lado ? lado.x : (W - larg) / 2;
    ctx.save(); ctx.font = '500 ' + tam + 'px system-ui, sans-serif';
    var palavras = fb.texto.split(' '), linhas = [], atual = '';
    palavras.forEach(function (p) { var t = atual ? atual + ' ' + p : p; if (ctx.measureText(t).width > larg - 36) { linhas.push(atual); atual = p; } else atual = t; });
    if (atual) linhas.push(atual);
    var maxL = lado ? Math.max(2, Math.floor((H - 8 - lado.y - 18) / entre)) : 4;
    if (linhas.length > maxL) { linhas = linhas.slice(0, maxL); linhas[maxL - 1] = linhas[maxL - 1].replace(/\s*\S*$/, '') + ' …'; }
    var h = 18 + linhas.length * entre, y0 = lado ? lado.y : H - 24 - h;
    ctx.fillStyle = clsRgba(P.painel, 0.94); ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x0, y0, larg, h, 10); else ctx.rect(x0, y0, larg, h);
    ctx.fill();
    ctx.fillStyle = cor; ctx.fillRect(x0, y0 + 6, 4, h - 12);
    ctx.fillStyle = P.texto; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    linhas.forEach(function (l, k) { ctx.fillText(l, x0 + 18, y0 + 24 + k * entre); });
    ctx.restore();
  }

  /* ══ PAINEL ════════════════════════════════════════════════════ */

  _sincronizarPainel() {
    var q = this.q, self = this;
    var mostrar = function (id, sim) { var el = document.getElementById(id); if (el) el.hidden = !sim; };
    var marcar = function (grupo, valor) {
      document.querySelectorAll('[data-group="' + grupo + '"] .seg-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === String(valor))); });
    };
    marcar('cls-fonte', this.fonte); marcar('cls-nivel', this.nivel); marcar('cls-vista', this.vista); marcar('cls-pincel', this.pincel);
    var cores = Q3.Desenho.paleta().classes;
    document.querySelectorAll('[data-group="cls-pincel"] .seg-btn').forEach(function (b) {
      var ponto = b.querySelector('.cls-ponto'); if (ponto) ponto.style.background = cores[CLS_INDICE[b.dataset.value]];
    });
    var nul = document.querySelector('[data-group="cls-pincel"] [data-value="nulário"]');
    if (nul) nul.hidden = !this._temNulario();
    mostrar('cls-grupo-carbonos', q.etapa === 'carbonos');
    mostrar('cls-grupo-cadeia', q.etapa === 'cadeia');
    mostrar('cls-grupo-fim', q.etapa === 'fim');
    mostrar('cls-revelar-evidencia', q.etapa === 'cadeia' && !!q.evidencia);
    var dica = document.getElementById('cls-etapa-dica');
    if (dica) dica.textContent = q.etapa === 'carbonos' ? 'Etapa 1 de 2 · classes dos carbonos' :
      q.etapa === 'cadeia' ? 'Etapa 2 de 2 · critério ' + (q.i + 1) + ' de ' + q.criterios.length + (q.evidencia ? ' · evidência: toque na estrutura' : '') :
      'Cadeia ' + this._resumo() + '.';
    var c = this.criterio, perg = document.getElementById('cls-pergunta'), ops = document.getElementById('cls-opcoes');
    if (c && perg && ops) {
      perg.textContent = CLS_PERGUNTA[c.chave];
      var chave = c.chave + '|' + c.opcoes.join(',');
      if (ops.dataset.chave !== chave) {
        ops.dataset.chave = chave;
        ops.innerHTML = '';
        c.opcoes.forEach(function (o) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'seg-btn'; b.dataset.value = o; b.textContent = o;
          b.setAttribute('aria-pressed', 'false');
          ops.appendChild(b);
        });
      }
      var r = q.respostas[c.chave];
      ops.querySelectorAll('.seg-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(!!(r && r.escolhida === b.dataset.value && q.evidencia))); });
    }
    /* Os botões das opções são criados aqui, mas o CLIQUE não: o app
       trata por delegação todo .seg-btn de um .seg com data-group
       (cls-resposta → setParam → responder) e atualiza os resultados.
       Um ouvinte próprio aqui responderia duas vezes a cada toque. */
  }

  /* ══ RESULTADOS E SOBREPOSIÇÃO ═════════════════════════════════ */

  resultados() {
    var q = this.q;
    var linhas = [
      { l: 'Estrutura', v: q.nome },
      { l: 'Fórmula molecular', v: q.formula },
      { l: 'Etapa', v: q.etapa === 'carbonos' ? 'classes dos carbonos' : q.etapa === 'cadeia' ? 'critério ' + (q.i + 1) + ' de ' + q.criterios.length : 'completa' }
    ];
    if (q.etapa === 'fim') linhas.push({ l: 'Classificação', v: this._resumo() });
    return linhas;
  }

  overlay() { return 'Classificação · ' + this.q.nome; }
}
