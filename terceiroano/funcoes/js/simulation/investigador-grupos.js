/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/investigador-grupos.js
   ───────────────────────────────────────────────────────────────
   MÓDULO 1 — GRUPOS FUNCIONAIS (SIFO).

   O aluno abre um composto real da biblioteca, escolhe o PINCEL de
   uma função (álcool, éster, amida…) e PINTA, arrastando, os átomos
   de cada grupo que encontrar. Mesma mecânica do desafio de
   classificação do SIQC.

   PREVER → REVELAR (princípio do projeto: nada de pistas, pontuação,
   nova tentativa guiada ou celebração)
     · pintar é a PREVISÃO, opcional;
     · revelar mostra TODOS os grupos, calculados pelo motor;
     · onde a pintura diferiu, os átomos ficam marcados e a explicação
       diz o que o átomo É — é aí que moram as pegadinhas: o O do éster
       pintado como éter, o OH do ácido como álcool, o N da amida como
       amina.
   Depois de revelar, tocar num grupo põe a ficha dele no painel Resultados.

   CONSTRUÇÃO LIVRE (caminho secundário). Na fonte "Construir", o
   módulo entrega o canvas ao EDITOR DO SIQC (herdado: paleta,
   ferramentas, representações) e, a cada mudança, o motor redetecta os
   grupos, que ACENDEM com a cor e a sigla da função. Limite de
   GF_LIMITE grupos ao mesmo tempo: ao atingi-lo, os elementos da paleta
   (menos o carbono) ficam OPACOS, sem sumir — o toque explica o limite.

   SEM MEDIÇÃO DE DESEMPENHO. Nenhuma contagem de acertos, placar ou
   sequência: o simulador não avalia quanto o aluno sabe — explica.

   ONDE CADA COISA APARECE
     cena (canvas) .... só a estrutura: os átomos, os aros da pintura,
                        as siglas das funções e os destaques
     Resultados ....... o retorno (retorno), o próximo passo
                        (proximoPasso) e a ficha: o composto, onde ele
                        aparece, a fórmula, os grupos e o grupo tocado
                        (resultados)
   Antes, o nome, o contexto com a fórmula e o pedido da etapa eram
   escritos no alto da cena, e a estrutura começava abaixo deles; numa
   cena baixa, a sigla do átomo de cima encostava no pedido. No
   computador, o card Investigar abre com os Resultados logo abaixo
   (data-rail-junto, em index.html).

   Tudo o que o módulo diz sai de Q3.Funcoes.detectar (núcleo).
═══════════════════════════════════════════════════════════════ */

'use strict';

/* as 13 funções que o aluno pinta (o hidrocarboneto é "nenhum grupo") */
var GF_PINCEIS = Q3.Funcoes.CATALOGO.filter(function (c) { return c.id !== 'hidrocarboneto'; });

/* rótulo curto do selo de cada função (a cor nunca é o único sinal) */
var GF_SIGLA = { acido: 'COOH', anidrido: '(CO)₂O', ester: 'COO', haletoAcila: 'COX', amida: 'CON', nitrila: 'C≡N',
                 aldeido: 'CHO', cetona: 'C=O', alcool: 'OH', fenol: 'ArOH', amina: 'N', haleto: 'X', eter: 'O' };

/* cores por tema: claras sobre o fundo escuro, escuras sobre o claro */
var GF_CORES = {
  escuro: { acido: '#ff8a80', anidrido: '#ffab91', ester: '#ffcc80', haletoAcila: '#e6ee9c', amida: '#ce93d8', nitrila: '#b39ddb',
            aldeido: '#80deea', cetona: '#81d4fa', alcool: '#a5d6a7', fenol: '#c5e1a5', amina: '#f48fb1', haleto: '#fff59d', eter: '#90caf9' },
  claro:  { acido: '#b3261e', anidrido: '#9a3a12', ester: '#7a4a00', haletoAcila: '#556000', amida: '#7b1fa2', nitrila: '#5e35b1',
            aldeido: '#00695c', cetona: '#01579b', alcool: '#2e7d32', fenol: '#33691e', amina: '#ad1457', haleto: '#5f5200', eter: '#1565c0' }
};

/* construção livre: quantos grupos podem acender ao mesmo tempo (a
   especificação previa 3; o professor pediu mais — a glicose de cadeia
   aberta tem 6: cinco OH e um CHO) */
var GF_LIMITE = 6;

function gfRgba(hex, a) {
  var h = String(hex).replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; });
  var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

class InvestigadorGrupos {
  constructor(D) {
    this.D = D;
    this.ativo = false;
    this.t = 0;
    this.pincel = 'alcool';
    this.categoria = 'todas';
    this.busca = '';
    this.foco = null;
    this._gesto = null;
    this._engolirClique = false;
    this._tela = {};
    this.fonte = 'biblioteca';               // 'biblioteca' · 'construir'
    this.editor = new EditorCadeias(D);      // construção livre: o editor do SIQC
    this.livre = null; this._versaoLivre = -1; this.travado = false;
    this.abrir('paracetamol', true);
    this._ligarPonteiro();
  }

  ativar() {
    this.ativo = true;
    var cv = document.getElementById('sim-canvas'); if (cv) cv.style.touchAction = 'none';
    this._montarPainel();
    if (this.fonte === 'construir') this.editor.ativar();
    this._mostrarFonte();
    this._sincronizarPainel();
  }
  desativar() { this.ativo = false; this.editor.desativar(); this._mostrarFonte(); }

  /* a troca de módulo LIMPA o que sai: biblioteca, composto inicial,
     sem pintura, busca e categoria zeradas, editor vazio */
  reiniciar() {
    this.editor.reiniciar(); this.editor.desativar();
    this.fonte = 'biblioteca'; this.livre = null; this._versaoLivre = -1; this.travado = false;
    this.categoria = 'todas'; this.busca = ''; this.pincel = 'alcool'; this.foco = null; this._gesto = null;
    var campo = document.getElementById('gf-busca'); if (campo) campo.value = '';
    this.abrir('paracetamol', true);
    this._filtrarLista(); this._mostrarFonte(); this._sincronizarLivre();
  }
  atualizar(dt) { this.t += dt; if (this.fonte === 'construir') this.editor.atualizar(dt); }

  /* ══ BIBLIOTECA × CONSTRUÇÃO LIVRE ═════════════════════════════ */

  definirFonte(v) {
    var nova = v === 'construir' ? 'construir' : 'biblioteca';
    if (nova === this.fonte) return {};
    this.fonte = nova;
    if (nova === 'construir') { this.editor.ativar(); this._versaoLivre = -1; this._atualizarLivre(); }
    else this.editor.desativar();
    this._mostrarFonte();
    this._sincronizarPainel();
    announce(nova === 'construir' ? 'Construção livre: monte a molécula no painel Construção; os grupos funcionais acendem conforme se formam.' : 'Biblioteca: escolha um composto real e pinte os grupos.');
    return {};
  }

  /* cada fonte mostra os seus controles; os painéis do editor só na construção */
  _mostrarFonte() {
    var c = this.fonte === 'construir', at = this.ativo;
    var vis = function (id, sim) { var el = document.getElementById(id); if (el) el.hidden = !sim; };
    vis('panel-construcao', at && c); vis('panel-representacao', at && c);
    vis('gf-grupo-biblioteca', !c); vis('gf-grupo-pintura', !c); vis('gf-grupo-livre', c);
    var f = this.fonte;
    document.querySelectorAll('[data-group="gf-fonte"] .seg-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === f)); });
    // gancho de CSS: a ordem dos cards na gaveta do celular segue a fonte (stylefuncoes.css)
    if (at) document.body.dataset.fonte = f; else delete document.body.dataset.fonte;
  }

  /* controles do editor: o elemento passa pela trava de grupos */
  paramEditor(k, v) {
    if (k === 'elemento' && this.travado && v !== 'C') {
      this._sincronizarLivre();
      var msg = 'Limite de ' + GF_LIMITE + ' grupos funcionais ao mesmo tempo. Apague um grupo para poder usar outro elemento.';
      announce(msg);
      return { say: msg };
    }
    var r = this.editor.param(k, v);
    this._sincronizarLivre();
    return r;
  }
  acaoEditor(nome) { var r = this.editor.acao(nome); this._atualizarLivre(); return r; }

  /* redetecta os grupos da molécula do editor quando ela muda */
  _atualizarLivre() {
    var ed = this.editor;
    if (ed.versao === this._versaoLivre) return;
    this._versaoLivre = ed.versao;
    this.livre = ed.g.pesados().length ? Q3.Funcoes.detectar(ed.g) : null;
    var travado = this._contarLivre() >= GF_LIMITE;
    if (travado !== this.travado) {
      this.travado = travado;
      announce(travado ? 'Limite de ' + GF_LIMITE + ' grupos: os outros elementos ficam opacos. Apague um grupo para criar outro.' : 'Abaixo do limite: todos os elementos voltam.');
    }
    // travou com um heteroátomo no pincel do editor: volta ao carbono
    if (travado && ed.elemento !== 'C') ed.param('elemento', 'C');
    this._sincronizarLivre();
  }
  _contarLivre() {
    var r = this.livre; if (!r) return 0;
    return r.grupos.filter(function (x) { return x.id !== 'hidrocarboneto'; }).length + r.fora.length;
  }
  _sincronizarLivre() {
    var r = this.livre, trav = this.travado, el = this.editor.elemento;
    document.querySelectorAll('[data-group="elemento"] .seg-btn').forEach(function (b) {
      var opaco = trav && b.dataset.value !== 'C';
      b.classList.toggle('gf-opaco', opaco);
      if (opaco) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled');
      b.setAttribute('aria-pressed', String(b.dataset.value === el));
    });
    var lista = document.getElementById('gf-livre-lista'), lim = document.getElementById('gf-livre-limite');
    if (lista) {
      if (!r) lista.textContent = 'Nenhum.';
      else {
        var cont = {}, ordem = [];
        r.grupos.forEach(function (x) { if (!cont[x.id]) { cont[x.id] = 0; ordem.push(x); } cont[x.id]++; });
        var txt = ordem.map(function (x) { return (cont[x.id] > 1 ? cont[x.id] + '× ' : '') + x.nome.toLowerCase(); }).join(', ');
        if (r.fora.length) txt += (txt ? '; ' : '') + 'fora do catálogo: ' + r.fora.map(function (f) { return f.nome; }).join(', ');
        lista.textContent = txt || 'nenhum';
      }
    }
    if (lim) lim.textContent = trav ? 'Limite de ' + GF_LIMITE + ' grupos atingido.' : '';
  }

  _cores() { return GF_CORES[Q3.Desenho.paleta().claro ? 'claro' : 'escuro']; }

  /* ══ A BIBLIOTECA ══════════════════════════════════════════════ */

  definirCategoria(v) { this.categoria = v; this._filtrarLista(); return {}; }
  definirPincel(v) { if (GF_SIGLA[v]) this.pincel = v; this._sincronizarPainel(); return {}; }

  abrir(id, silencioso) {
    var m = Q3.BIBLIOTECA_FUNCOES.filter(function (x) { return x.id === id; })[0];
    if (!m) return false;
    var g = Q3.deSmiles(m.smiles), r = Q3.Funcoes.detectar(g);
    this.q = {
      id: m.id, nome: m.nome, contexto: m.contexto, g: g, r: r,
      pos: this._horizontal(Q3.Geometria.layout(g)),
      formula: g.formulaMolecular().replace(/\d+/g, function (d) { return Q3.Desenho.subscrito(d); }),
      grupos: r.grupos.filter(function (x) { return x.id !== 'hidrocarboneto'; }),
      etapa: 'procurar', pintura: {}, conferencia: null, feedback: null
    };
    this.foco = null;
    this._sincronizarPainel();
    if (!silencioso) {
      playTone(660, .06, .04);
      this._retorno('info', '', null, this.q.nome + '.');
    }
    return {};
  }

  /* o desenho deitado, como nos livros (eixo principal na horizontal) */
  _horizontal(pos) {
    var ids = Object.keys(pos), n = ids.length || 1, mx = 0, my = 0;
    ids.forEach(function (id) { mx += pos[id].x / n; my += pos[id].y / n; });
    var sxx = 0, syy = 0, sxy = 0;
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; });
    var th = 0.5 * Math.atan2(2 * sxy, sxx - syy), c = Math.cos(-th), s = Math.sin(-th), out = {};
    ids.forEach(function (id) { var dx = pos[id].x - mx, dy = pos[id].y - my; out[id] = { x: dx * c - dy * s, y: dx * s + dy * c }; });
    return out;
  }

  /* ══ PINTAR ════════════════════════════════════════════════════ */

  _pintar(id) {
    var q = this.q;
    if (q.etapa !== 'procurar' || q.pintura[id] === this.pincel) return false;
    q.pintura[id] = this.pincel;
    if (q.conferencia) delete q.conferencia[id];
    playTone(560, .03, .02);
    return true;
  }

  /* os grupos da função `id` a que o átomo pertence */
  _gruposDoAtomo(atomo) { return this.q.grupos.filter(function (x) { return x.atomos.indexOf(atomo) >= 0; }); }
  _heteros(gr) { var g = this.q.g; return gr.atomos.filter(function (a) { return g.atomos[a].el !== 'C'; }); }

  /* PREVER → REVELAR (princípio do projeto: nada de pistas, nova
     tentativa guiada ou celebração). Pintar é a previsão, opcional.
     Revelar mostra TODOS os grupos, calculados; onde a pintura diferiu,
     os átomos ficam marcados e a explicação diz o que o átomo É. */
  revelar(previuNenhum) {
    var q = this.q, self = this, g = q.g;
    if (q.etapa !== 'procurar') return false;
    var previsao = previuNenhum ? {} : q.pintura;
    var diferentes = Object.keys(previsao).filter(function (a) { return !self._gruposDoAtomo(a).some(function (gr) { return gr.id === previsao[a]; }); });
    var alvo = diferentes.filter(function (a) { return g.atomos[a].el !== 'C'; })[0] || diferentes[0];
    var explicacao = alvo ? this._explicar(alvo, previsao[alvo]) : '';
    // a resposta calculada: cada grupo pintado inteiro
    q.pintura = {};
    q.grupos.forEach(function (gr) { gr.atomos.forEach(function (a) { if (!q.pintura[a]) q.pintura[a] = gr.id; }); });
    q.conferencia = null;
    if (diferentes.length) { q.conferencia = {}; diferentes.forEach(function (a) { q.conferencia[a] = false; }); }
    q.etapa = 'fim';
    playTone(660, .08, .04);
    var texto;
    if (!q.grupos.length) texto = 'Hidrocarboneto: nenhum grupo funcional.';
    else {
      var p = q.r.principal, classes = Q3.Funcoes.classes(q.r).filter(function (c) { return c !== 'hidrocarboneto'; });
      texto = 'Grupos: ' + this._listaGrupos() + (classes.length > 1 ? ' · principal (sufixo): ' + p.nome.toLowerCase() : '') + '.';
    }
    if (previuNenhum && q.grupos.length) texto += ' Previsão: nenhum.';
    if (explicacao) texto += ' Átomo marcado: ' + explicacao;
    this._retorno('info', texto, alvo ? { atomos: [alvo] } : null);
    return true;
  }

  limpar() { var q = this.q; if (q.etapa !== 'procurar') return false; q.pintura = {}; q.conferencia = null; this._retorno('info', 'Pintura apagada.'); return true; }

  _listaGrupos() {
    var q = this.q, cont = {}, ordem = [];
    q.grupos.forEach(function (gr) { if (!cont[gr.id]) { cont[gr.id] = 0; ordem.push(gr); } cont[gr.id]++; });
    return ordem.map(function (gr) { var n = cont[gr.id]; return (n > 1 ? n + '× ' : '') + gr.nome.toLowerCase() + (gr.tipo && n === 1 ? ' (' + gr.tipo + ')' : ''); }).join(', ');
  }

  /* a explicação da diferença entre o que o aluno pintou e o que o átomo é */
  _explicar(atomo, pintada) {                                       // o que o átomo É, no lugar do que foi pintado
    var reais = this._gruposDoAtomo(atomo), nomeP = Q3.Funcoes.POR_ID[pintada].nome.toLowerCase();
    if (!reais.length) return 'sem grupo funcional.';
    return 'é ' + reais[0].nome.toLowerCase() + ', não ' + nomeP + '.';
  }

  /* a ficha de um grupo (depois de revelados) */
  /* a ficha de um grupo (depois de revelados) vai para o painel RESULTADOS
     (pedido do professor): o grupo fica destacado na estrutura, e a faixa
     de baixo não recebe mais o texto. O leitor de tela recebe a ficha. */
  _ficha(atomo) {
    var q = this.q, reais = this._gruposDoAtomo(atomo);
    var realce = reais.length ? { atomos: reais[0].atomos } : { atomos: [atomo] };
    q.feedback = { tipo: q.feedback ? q.feedback.tipo : 'info', texto: q.feedback ? q.feedback.texto : '', realce: realce };
    if (!reais.length) { q.ficha = { nenhum: true }; announce('Esse átomo não faz parte de nenhum grupo funcional.'); this._mostrarResultados(); return; }
    var gr = reais[0], c = Q3.Funcoes.POR_ID[gr.id];
    q.ficha = { nome: c.nome + (gr.tipo ? ' ' + gr.tipo : ''), padrao: c.grupo, prioridade: c.prioridade + ' de 14',
                noNome: c.sufixo ? 'sufixo ' + c.sufixo : 'sempre prefixo ' + c.prefixo };
    announce(q.ficha.nome + ' — grupo ' + c.grupo + '. Prioridade ' + c.prioridade + ' de 14 no nome' +
      (c.sufixo ? ' (como sufixo: ' + c.sufixo + ')' : ' (sempre prefixo: ' + c.prefixo + ')') + '.');
    this._mostrarResultados();
  }

  /* põe o Resultados à vista: com a barra recolhida, abre o card dele pelo
     trilho (se já não estiver aberto); com a barra fixada, abre o corpo do
     painel e rola até ele. No celular, não abre nada sozinho. */
  _mostrarResultados() {
    if (typeof ehCelular === 'function' ? ehCelular() : window.innerWidth <= 900) return;   // a regra do celular mora em init/app.js
    var hdr = document.getElementById('hdr-result'); if (!hdr) return;
    var painel = hdr.closest('.panel'), barra = painel.closest('.sidebar');
    if (barra && barra.classList.contains('is-collapsed')) {
      if (barra.classList.contains('is-floating') && painel.classList.contains('is-solo')) return;
      var bt = Array.prototype.find.call(document.querySelectorAll('.rail-btn'), function (b) { return b._painel === painel; });
      if (bt) bt.click();
      return;
    }
    if (hdr.getAttribute('aria-expanded') === 'false') hdr.click();
    if (painel.scrollIntoView) painel.scrollIntoView({ block: 'nearest' });
  }

  /* o retorno mora no alto dos Resultados (retorno()); antes ficava no painel Investigar, longe do próximo passo */
  _retorno(tipo, texto, realce, falado) {
    this.q.feedback = { tipo: tipo, texto: texto, realce: realce || null };
    announce(falado || texto);
    this._sincronizarPainel();
  }

  /* ══ ENTRADA: ponteiro e teclado ═══════════════════════════════ */

  _ligarPonteiro() {
    var cv = document.getElementById('sim-canvas'), self = this;
    if (!cv) return;
    var local = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left - (cv.cenaX || 0), y: e.clientY - r.top }; }   // na cena (a área livre do card flutuante);
    cv.addEventListener('pointerdown', function (e) {
      if (!self.ativo || self.fonte !== 'biblioteca') return;
      var p = local(e), at = self._atomoEm(p.x, p.y);
      self._gesto = { id: e.pointerId, x0: p.x, y0: p.y, moveu: false, atomo: at, antes: at ? self.q.pintura[at] : null };
      if (self.q.etapa === 'procurar' && at) self._pintar(at);
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* segue */ }
    });
    cv.addEventListener('pointermove', function (e) {
      if (!self.ativo || self.fonte !== 'biblioteca') return;
      var p = local(e), gs = self._gesto;
      if (!gs || e.pointerId !== gs.id) { cv.style.cursor = self._atomoEm(p.x, p.y) ? 'pointer' : ''; return; }
      if (Math.hypot(p.x - gs.x0, p.y - gs.y0) > 5) gs.moveu = true;
      var at = self._atomoEm(p.x, p.y);
      if (self.q.etapa === 'procurar' && at) self._pintar(at);
    });
    var fim = function (e) {
      var gs = self._gesto; if (!gs || e.pointerId !== gs.id) return;
      self._gesto = null; self._engolirClique = true;
      try { cv.releasePointerCapture(e.pointerId); } catch (err) { /* já solto */ }
      var q = self.q;
      if (q.etapa === 'fim') { if (gs.atomo && !gs.moveu) self._ficha(gs.atomo); return; }
      // um toque (sem arrastar) num átomo já pintado com o mesmo pincel: despinta
      if (gs.atomo && !gs.moveu && gs.antes === self.pincel) { delete q.pintura[gs.atomo]; playTone(360, .03, .02); }
      self._sincronizarPainel();
    };
    cv.addEventListener('pointerup', fim);
    cv.addEventListener('pointercancel', function (e) { if (self._gesto && e.pointerId === self._gesto.id) self._gesto = null; });
  }

  tocar(x, y) {
    if (this.fonte === 'construir') { var r = this.editor.tocar(x, y); this._atualizarLivre(); return r; }
    if (this._engolirClique) { this._engolirClique = false; return true; } return false;
  }

  navegar(dx, dy) {
    if (this.fonte === 'construir') return this.editor.navegar(dx, dy);
    var T = this._tela, ids = Object.keys(T), q = this.q;
    if (!ids.length) return false;
    if (!this.foco || !T[this.foco]) this.foco = ids.slice().sort(function (a, b) { return T[a].x - T[b].x; })[0];
    else {
      var o = T[this.foco], melhor = null, custo = Infinity, atual = this.foco;
      ids.forEach(function (id) {
        if (id === atual) return;
        var vx = T[id].x - o.x, vy = T[id].y - o.y, d = Math.hypot(vx, vy), al = (vx * dx + vy * dy) / (d || 1);
        if (al < 0.35) return;
        var c = d * (2 - al); if (c < custo) { custo = c; melhor = id; }
      });
      if (melhor) this.foco = melhor;
    }
    var g = q.g, id = this.foco;
    announce(Q3.Desenho.rotulo(g, id) + (q.pintura[id] ? ', pintado como ' + Q3.Funcoes.POR_ID[q.pintura[id]].nome.toLowerCase() : '') +
      '. Enter ' + (q.etapa === 'procurar' ? 'pinta com o pincel ' + Q3.Funcoes.POR_ID[this.pincel].nome.toLowerCase() : 'mostra a ficha do grupo') + '.');
    return true;
  }

  acaoFoco() {
    if (this.fonte === 'construir') return this.acaoEditor('cad-ativar');
    var q = this.q, id = this.foco;
    if (!id) { announce('Use as setas para escolher um átomo.'); return false; }
    if (q.etapa === 'fim') { this._ficha(id); return true; }
    if (q.pintura[id] === this.pincel) { delete q.pintura[id]; announce('Pintura removida.'); }
    else { this._pintar(id); announce('Pintado como ' + Q3.Funcoes.POR_ID[this.pincel].nome.toLowerCase() + '.'); }
    this._sincronizarPainel();
    return true;
  }

  acao(nome) {
    if (nome === 'gf-conferir' || nome === 'gf-revelar') return this.revelar(false);
    if (nome === 'gf-nenhum') return this.revelar(true);
    if (nome === 'gf-limpar') return this.limpar();
    if (nome === 'gf-acao') return this.acaoFoco();
    if (nome === 'gf-sortear') {
      var lista = this._visiveis(); if (!lista.length) return false;
      return this.abrir(lista[Math.floor(Math.random() * lista.length)].id);
    }
    return false;
  }

  _atomoEm(x, y) {
    var T = this._tela, melhor = null, dm = Infinity, raio = Math.max(18, (this._fonte || 14) * 1.3);
    Object.keys(T).forEach(function (id) { var d = Math.hypot(T[id].x - x, T[id].y - y); if (d < raio && d < dm) { dm = d; melhor = id; } });
    return melhor;
  }

  /* ══ DESENHO ═══════════════════════════════════════════════════ */

  desenhar(ctx, W, H) {
    if (this.fonte === 'construir') { this.editor.desenhar(ctx, W, H); this._atualizarLivre(); this._desenharGruposLivre(ctx); return; }
    var q = this.q, g = q.g, P = Q3.Desenho.paleta(), D = Q3.Desenho, cores = this._cores();
    var aviso = P.claro ? '#8a4b00' : '#ffb454';
    // A CENA É SÓ A ESTRUTURA: o nome, o contexto e o pedido moram nos Resultados (e o nome, na pílula do modo)
    var E = this._enquadrar(ctx, W, H), ids = Object.keys(q.pos);
    var T = {}; ids.forEach(function (id) { T[id] = { x: E.cx + q.pos[id].x * E.s, y: E.cy + q.pos[id].y * E.s }; });
    this._tela = T;
    var fonte = this._fonte = E.fonte, margem = E.margem;
    var aneis = Q3.Geometria.aneisMinimos(g);
    var centroAnel = function (l) {
      var r = aneis.filter(function (x) { return x.indexOf(l.a) >= 0 && x.indexOf(l.b) >= 0; })[0];
      if (!r) return null;
      var sx = 0, sy = 0; r.forEach(function (id) { sx += T[id].x; sy += T[id].y; });
      return { x: sx / r.length, y: sy / r.length };
    };
    ctx.save();
    // realce do retorno, por baixo de tudo
    var fb = q.feedback, rl = fb && fb.realce, corRl = fb ? (fb.tipo === 'ok' ? P.ok : fb.tipo === 'erro' ? aviso : P.acento) : P.acento;
    (rl && rl.atomos || []).forEach(function (id) { var p = T[id]; ctx.strokeStyle = corRl; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(margem[id].mx, 12) + 9, 0, Math.PI * 2); ctx.stroke(); });
    // ligações: dentro de um grupo pintado, um traço largo e translúcido da cor da função por baixo
    g.ligacoes.forEach(function (l) {
      var fa = q.pintura[l.a], fbb = q.pintura[l.b];
      if (fa && fa === fbb) { ctx.strokeStyle = gfRgba(cores[fa], 0.28); ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(T[l.a].x, T[l.a].y); ctx.lineTo(T[l.b].x, T[l.b].y); ctx.stroke(); }
    });
    g.ligacoes.forEach(function (l) { D.ligacao(ctx, T[l.a], T[l.b], l.ordem, margem[l.a], margem[l.b], { cor: P.texto, largura: 2.4, interno: centroAnel(l) }); });
    var self = this;
    ids.forEach(function (id) {
      var el = g.atomos[id].el, p = T[id], pint = q.pintura[id];
      D.atomo(ctx, p, D.rotulo(g, id), fonte, P, { corTexto: P.elementos[el] || P.texto, aro: pint ? cores[pint] : null });
      // selo com a sigla da função nos heteroátomos pintados (a cor nunca é o único sinal)
      if (pint && el !== 'C') {
        var angs = g.vizinhos(id).map(function (v) { return Math.atan2(T[v.id].y - p.y, T[v.id].x - p.x); }).sort(function (a, b) { return a - b; });
        var dirA = -Math.PI / 2;
        if (angs.length === 1) dirA = angs[0] + Math.PI;
        else if (angs.length > 1) { var maior = -1; angs.forEach(function (an, k) { var prox = k + 1 < angs.length ? angs[k + 1] : angs[0] + 2 * Math.PI, vao = prox - an; if (vao > maior) { maior = vao; dirA = an + vao / 2; } }); }
        var d0 = Math.max(margem[id].mx, 10) + 18, sx = p.x + Math.cos(dirA) * d0, sy = p.y + Math.sin(dirA) * d0;
        ctx.font = '700 ' + E.sigla + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = cores[pint]; ctx.fillText(GF_SIGLA[pint], sx, sy);
      }
      if (q.conferencia && q.conferencia[id] === false) {
        ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = aviso; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(margem[id].mx, 12) + 7, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      if (self.foco === id) D.foco(ctx, p, Math.max(margem[id].mx, 12) + 12, P.acento);
    });
    ctx.restore();
  }

  /* O ENQUADRAMENTO da estrutura: a maior escala em que cabem, na área livre da cena (abaixo da pílula do
     modo, Q3.Moldura), os átomos e o que se desenha em volta de cada um — o rótulo, os aros da pintura, do
     destaque e do foco e, nos heteroátomos, a sigla da função (a máx(mx, 10) + 18 px do centro, no maior vão).
     O lugar das siglas fica reservado desde o começo: pintar e revelar não mudam o tamanho do desenho. Antes,
     a estrutura começava abaixo do cabeçalho escrito na cena e as siglas não entravam na conta. A conta só é
     refeita quando mudam o tamanho da cena ou o composto. */
  _enquadrar(ctx, W, H) {
    var q = this.q, chave = W + 'x' + H;
    if (this._enq && this._enq.q === q && this._enq.chave === chave) return this._enq;
    var g = q.g, D = Q3.Desenho, ids = Object.keys(q.pos);
    var M = Q3.Moldura ? Q3.Moldura.livre(W, H, false) : { x: 18, y: 52, w: Math.max(40, W - 36), h: Math.max(40, H - 66) };
    // a letra acompanha a escala: de 12 a 17 px e, numa tela grande como a do projetor, até 20 px (como no SIQC M3)
    var fonteDe = function (s) { return Math.max(12, Math.min(s > 96 ? 17 + (s - 96) * 0.09 : 17, s * 0.3)); };
    var siglaDe = function (f) { return Math.max(11, Math.round(f * 0.68)); };
    var medir = function (s) {
      var f = fonteDe(s), sg = siglaDe(f), m = {}, ext = {};
      ctx.save();
      ctx.font = '700 ' + sg + 'px system-ui, sans-serif';
      var meiaSigla = ctx.measureText('(CO)₂O').width / 2;            // a sigla mais larga
      ids.forEach(function (id) {
        m[id] = D.medirRotulo(ctx, D.rotulo(g, id), f);
        ext[id] = g.atomos[id].el !== 'C' ? Math.max(m[id].mx, 10) + 18 + Math.max(meiaSigla, sg) + 4   // a sigla, para qualquer lado
                                          : Math.max(m[id].mx, 12) + 14;                                  // os aros (o do foco vai a +12)
      });
      ctx.restore();
      return { fonte: f, sigla: sg, m: m, ext: ext };
    };
    // num eixo, quanto o desenho avança para cada lado do centro da estrutura, na escala s
    var lados = function (s, eixo, me) {
      var mais = -Infinity, menos = -Infinity;
      ids.forEach(function (id) { var v = q.pos[id][eixo] * s; mais = Math.max(mais, v + me.ext[id]); menos = Math.max(menos, me.ext[id] - v); });
      return { mais: mais, menos: menos };
    };
    // a escala cresce até caber (busca binária: o tamanho do desenho só aumenta com a escala)
    var sMax = Math.max(92, Math.min(128, Math.min(M.w, M.h) / 6.5)), lo = 4, hi = sMax;
    for (var k = 0; k < 26; k++) {
      var s = (lo + hi) / 2, me = medir(s), lx = lados(s, 'x', me), ly = lados(s, 'y', me);
      if (lx.mais + lx.menos <= M.w && ly.mais + ly.menos <= M.h) lo = s; else hi = s;
    }
    var mf = medir(lo), fx = lados(lo, 'x', mf), fy = lados(lo, 'y', mf);
    this._enq = {
      q: q, chave: chave, s: lo, fonte: mf.fonte, sigla: mf.sigla, margem: mf.m,
      // o centro fica no meio da folga que sobra em cada eixo
      cx: M.x + (fx.menos + M.w - fx.mais) / 2,
      cy: M.y + (fy.menos + M.h - fy.mais) / 2
    };
    return this._enq;
  }

  /* os grupos da molécula em construção ACENDEM: um aro da cor da
     função em cada átomo do grupo e a sigla junto ao centro dele. Só na
     vista condensada — a única que edita, e cujas posições o editor
     expõe (nas outras, a lista no painel continua valendo). */
  _desenharGruposLivre(ctx) {
    var ed = this.editor, r = this.livre;
    if (!r || ed.vista !== 'condensada') return;
    var cores = this._cores();
    ctx.save();
    r.grupos.forEach(function (gr) {
      if (gr.id === 'hidrocarboneto') return;
      var cor = cores[gr.id];
      gr.atomos.forEach(function (id) {
        var v = ed.vis[id]; if (!v) return;
        var p = ed._tela(v);
        ctx.fillStyle = gfRgba(cor, 0.16); ctx.strokeStyle = cor; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, 21, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      var vc = ed.vis[gr.centro]; if (!vc) return;
      var pc = ed._tela(vc);
      ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = cor; ctx.fillText(GF_SIGLA[gr.id], pc.x, pc.y - 32);
    });
    ctx.restore();
  }


  /* ══ PAINEL ════════════════════════════════════════════════════ */

  /* monta, uma vez, os pincéis e a lista da biblioteca (os cliques
     são tratados pelo app, por delegação: data-group → setParam) */
  _montarPainel() {
    var pin = document.getElementById('gf-pinceis'), lista = document.getElementById('gf-lista'), self = this;
    if (pin && !pin.children.length) {
      GF_PINCEIS.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'seg-btn'; b.dataset.value = c.id; b.setAttribute('aria-pressed', 'false');
        b.innerHTML = '<span class="gf-ponto" aria-hidden="true"></span>' + c.nome;
        pin.appendChild(b);
      });
    }
    if (lista && !lista.children.length) {
      Q3.BIBLIOTECA_FUNCOES.forEach(function (m) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'seg-btn gf-item'; b.dataset.value = m.id; b.dataset.categoria = m.categoria;
        b.dataset.busca = (m.nome + ' ' + m.contexto + ' ' + (Q3.CATEGORIAS_FUNCOES.filter(function (c) { return c.id === m.categoria; })[0] || {}).nome).toLowerCase();
        b.setAttribute('aria-pressed', 'false');
        b.innerHTML = '<span class="gf-item-nome">' + m.nome + '</span><span class="gf-item-ctx">' + m.contexto + '</span>';
        lista.appendChild(b);
      });
    }
    var busca = document.getElementById('gf-busca');
    if (busca && !this._buscaLigada) {
      this._buscaLigada = true;
      busca.addEventListener('input', function () { self.busca = busca.value.trim().toLowerCase(); self._filtrarLista(); });
    }
    this._filtrarLista();
  }

  _visiveis() {
    var cat = this.categoria, termo = this.busca;
    return Q3.BIBLIOTECA_FUNCOES.filter(function (m) {
      var b = (m.nome + ' ' + m.contexto).toLowerCase();
      return (cat === 'todas' || m.categoria === cat) && (!termo || b.indexOf(termo) >= 0 || (document.querySelector('.gf-item[data-value="' + m.id + '"]') || { dataset: { busca: '' } }).dataset.busca.indexOf(termo) >= 0);
    });
  }

  _filtrarLista() {
    var cat = this.categoria, termo = this.busca, n = 0;
    document.querySelectorAll('.gf-item').forEach(function (b) {
      var mostra = (cat === 'todas' || b.dataset.categoria === cat) && (!termo || b.dataset.busca.indexOf(termo) >= 0);
      b.hidden = !mostra; if (mostra) n++;
    });
    var cont = document.getElementById('gf-contagem');
    if (cont) cont.textContent = n + (n === 1 ? ' composto' : ' compostos');
    document.querySelectorAll('[data-group="gf-categoria"] .seg-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === cat)); });
  }

  _sincronizarPainel() {
    var q = this.q, cores = this._cores(), pincel = this.pincel;
    document.querySelectorAll('[data-group="gf-pincel"] .seg-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.value === pincel));
      var pt = b.querySelector('.gf-ponto'); if (pt) pt.style.background = cores[b.dataset.value];
    });
    var id = q.id;
    document.querySelectorAll('.gf-item').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.value === id)); });
    var dica = document.getElementById('gf-dica'); if (dica) dica.textContent = '';   // o painel mostra os controles e o resultado, sem roteiro
    document.querySelectorAll('[data-action="gf-conferir"], [data-action="gf-nenhum"], [data-action="gf-limpar"]').forEach(function (b) { b.disabled = q.etapa !== 'procurar'; });
  }

  /* ══ RESULTADOS E SOBREPOSIÇÃO ═════════════════════════════════ */

  resultados() {
    if (this.fonte === 'construir') {
      this._atualizarLivre();
      var lin = this.editor.resultados().slice(), n = this._contarLivre();
      lin.push({ l: 'Grupos funcionais', v: (document.getElementById('gf-livre-lista') || {}).textContent || '—' });
      lin.push({ l: 'Limite', v: n + ' de ' + GF_LIMITE + ' grupos ao mesmo tempo' });
      return lin;
    }
    var q = this.q;
    // o que antes era o cabeçalho escrito no alto da cena: o nome, onde o composto aparece e a fórmula
    var linhas = [
      { l: 'Composto', v: q.nome },
      { l: 'Onde aparece', v: q.contexto, cls: 'val-texto' },
      { l: 'Fórmula molecular', v: q.formula },
      { l: 'Etapa', v: q.etapa === 'procurar' ? 'antes de revelar' : 'grupos revelados' }
    ];
    if (q.etapa === 'fim') {
      linhas.push({ l: 'Grupos', v: q.grupos.length ? this._listaGrupos() : 'nenhum — hidrocarboneto' });
      if (q.grupos.length > 1) linhas.push({ l: 'Maior prioridade', v: q.r.principal.nome });
      // a ficha do grupo tocado
      if (q.ficha && q.ficha.nenhum) linhas.push({ l: 'Átomo tocado', v: 'fora de qualquer grupo' });
      else if (q.ficha) {
        linhas.push({ l: 'Grupo tocado', v: q.ficha.nome });
        linhas.push({ l: 'Padrão', v: q.ficha.padrao });
        linhas.push({ l: 'Prioridade', v: q.ficha.prioridade });
        linhas.push({ l: 'No nome', v: q.ficha.noNome });
      }
    }
    return linhas;
  }

  /* a explicação do último passo (o que a revelação mostrou, o átomo marcado), no alto dos Resultados */
  retorno() {
    if (this.fonte === 'construir') return null;
    var fb = this.q.feedback;
    return fb && fb.texto ? { tipo: fb.tipo, texto: fb.texto } : null;
  }

  /* o que fazer agora: antes era o pedido escrito no alto da cena; na construção livre, a dica do editor */
  proximoPasso() {
    if (!this.ativo) return '';
    if (this.fonte === 'construir') return this.editor.proximoPasso();
    var q = this.q;
    if (q.etapa === 'fim') return 'Toque num grupo na estrutura: a ficha dele aparece aqui. Para outro composto, escolha na Biblioteca.';
    if (!Object.keys(q.pintura).length) return 'Preveja os grupos: escolha o pincel de uma função em Investigar e pinte os átomos de cada grupo, tocando ou arrastando. Se preferir, revele direto.';
    return 'Pinte os outros grupos que encontrar e toque em Revelar os grupos. Tocar de novo com o mesmo pincel despinta.';
  }

  /* a pílula do modo: o composto e a etapa (a app já põe o nome do módulo antes) */
  overlay() {
    if (this.fonte === 'construir') return 'construção livre';
    return this.q.nome + ' · ' + (this.q.etapa === 'fim' ? 'grupos revelados' : 'preveja os grupos');
  }
}
