/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/relatorio-siro.js (SIRO · adaptador do relatório)
   ═══════════════════════════════════════════════════════════════

   O QUE FAZ
   Liga o SIRO ao relatório compartilhado da raiz (relatorio-core.js).
   Duas tarefas:
     A) REGISTRAR o que o aluno faz (tentativas, setas, passos,
        recusas, consulta à literatura, resultado).
     B) MOSTRAR isso no relatório (as seções do SIRO).

   COMO REGISTRA SEM MEXER NOS OUTROS ARQUIVOS
   Em vez de editar modulo-mecanismo.js, este arquivo "envolve" alguns
   métodos da classe: guarda o original, chama-o e, DEPOIS, anota o que
   aconteceu. Por isso este arquivo carrega depois de modulo-mecanismo.js
   e modulo-combustao.js. Se um dia ele for removido do index.html, o
   simulador continua igual — só deixa de gerar relatório.

   REGRAS
     - NUNCA quebrar o simulador: todo registro fica dentro de try/catch
       e o resultado do método original é sempre devolvido intacto.
     - O relatório só guarda o que o aluno FEZ. Escolher uma reação na
       lista, sozinho, não cria tentativa; a primeira seta, o aplicar, a
       consulta à literatura (etc.) é que abrem a tentativa.
     - TENTATIVA = um recomeço do experimento: reação escolhida, ou
       "Recomeçar", ou mudança de catalisador/ar (que reiniciam a cena).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (!window.QRel || typeof ModuloMecanismo === 'undefined') return;

  var SIM = 'SIRO';
  var BASE = {
    origem: 'livre',
    proposta: {
      titulo: 'Mecanismos de reações orgânicas com setas de elétrons',
      objetivo: 'Prever, com setas de elétrons, como cada reação acontece e comparar o seu caminho com o mecanismo da literatura.',
      pergunta: 'Para cada reação: quais ligações se rompem e quais se formam, em que ordem, e qual é o produto?'
    }
  };

  /* ═══ A) REGISTRAR ═══════════════════════════════════════════ */
  function reg(tipo, dados) { return QRel.registrar(SIM, tipo, dados, BASE); }

  /* o número da tentativa em curso, lido do próprio relatório (sobrevive a recarregar a página) */
  function nTent() {
    var r = QRel.ativo(SIM, BASE, false), n = 0;
    if (r) r.registros.forEach(function (x) { if (x.tipo === 'tentativa') n = x.n; });
    return n;
  }
  function condicoes(self) {
    var c = {};
    if (self.reacao && self.reacao.catalisadores && Q3.Mecanismo.CATALISADORES[self.cat]) c.catalisador = Q3.Mecanismo.CATALISADORES[self.cat].nome;
    if (self.cfg && self.cfg.pref === 'cb') { c.ar = self.ar === 'pouco' ? 'pouco ar (incompleta)' : 'ar suficiente (completa)'; }
    return c;
  }
  /* abre a tentativa na PRIMEIRA ação do aluno desde o último recomeço */
  function garantir(self) {
    if (self.__relAberta) return self.__relTent;
    self.__relAberta = true;
    var n = nTent() + 1; self.__relTent = n;       // o nº fica na instância: cada módulo sabe qual é a SUA tentativa
    reg('tentativa', {
      n: n, modulo: self.cfg.nome, moduloId: self.cfg.pref, reacaoId: self.reacao ? self.reacao.id : null,
      reacao: self.reacao ? self.reacao.nome : '—', condicoes: condicoes(self)
    });
    return n;
  }
  /* guarda sem exceção: relatório nunca derruba o simulador */
  function seguro(fn) { try { fn(); } catch (e) { /* silêncio de propósito */ } }

  function resultadoDe(self, S, extra) {
    var pr = self._produto(S);
    var d = {
      tent: self.__relTent, produto: pr.nome || null, formula: pr.formula || null,
      classificacao: pr.classe && pr.classe.tipo ? pr.classe.tipo : null,   // (não pode se chamar "tipo": é o nome do tipo do registro)
      literatura: pr.literatura || null,
      igualLiteratura: typeof pr.igualLiteratura === 'boolean' ? pr.igualLiteratura : null,
      lateral: !!pr.lateral
    };
    if (extra) Object.keys(extra).forEach(function (k) { d[k] = extra[k]; });
    return d;
  }

  /* ── envolver um método de uma classe ── */
  function envolver(Classe, nome, depois) {
    var original = Classe.prototype[nome];
    if (typeof original !== 'function') return;
    Classe.prototype[nome] = function () {
      var args = arguments, pre = null;
      try { pre = depois.antes ? depois.antes.call(this, args) : null; } catch (e) { pre = null; }
      var r = original.apply(this, args);
      try { if (depois.apos) depois.apos.call(this, r, args, pre); } catch (e) { /* ok */ }
      return r;
    };
  }

  /* ativar(): o módulo carrega a 1ª reação sozinho — isso NÃO é uma escolha do aluno */
  envolver(ModuloMecanismo, 'ativar', {
    antes: function () { this.__auto = true; },
    apos: function () { this.__auto = false; }
  });

  /* carregar(): nova reação → a tentativa só abre na 1ª ação. Hidrogenação (sem setas) já mostra o produto: é o experimento inteiro. */
  function aoCarregar(r) {
    if (!r) return;
    this.__relAberta = false;
    if (!this.__auto && this.estado === 'semSetas' && this.mod && this.mod.produto) {
      garantir(this);
      reg('resultado', resultadoDe(this, this.mod.produto, { semSetas: true }));
    }
  }
  envolver(ModuloMecanismo, 'carregar', { apos: aoCarregar });
  if (typeof ModuloCombustao !== 'undefined') envolver(ModuloCombustao, 'carregar', { apos: aoCarregar });

  /* seta desenhada (por arrasto ou por toque) */
  envolver(ModuloMecanismo, '_acrescentar', {
    antes: function () { return this.setas.length; },
    apos: function (r, args, antes) {
      if (!r || this.setas.length <= antes) return;
      var n = garantir(this), s = this.setas[this.setas.length - 1];
      reg('seta', { tent: n, desc: this._descSeta(s), farpa: s.n === 1 });
    }
  });

  /* aplicar as setas: passo aceito OU recusado pela química (com o motivo) */
  envolver(ModuloMecanismo, 'aplicar', {
    antes: function () {
      var self = this, podia = this.estado === 'lab' && !this.lit && !this.anim && this.setas.length > 0;
      var usadas = podia ? this.setas.map(function (s) { return self._descSeta(s); }) : [];
      this.__relSetas = usadas;
      return { podia: podia, usadas: usadas };
    },
    apos: function (ok, args, pre) {
      if (!pre || !pre.podia) return;
      if (!ok && this.msg) { reg('recusa', { tent: garantir(this), setas: pre.usadas, motivo: this.msg }); }
    }
  });

  /* o passo só vale quando a animação termina (é aí que o motor grava o histórico) */
  envolver(ModuloMecanismo, '_animar', {
    antes: function (args) {
      var o = args[0], self = this;
      if (!o || o.uma || typeof o.aoFim !== 'function') return null;
      var fim = o.aoFim, usadas = this.__relSetas || [];
      o.aoFim = function () {
        fim.call(this);
        seguro(function () {
          var topo = self.hist[self.hist.length - 1], desc = topo && topo.desc; if (!desc) return;
          var n = garantir(self);
          reg('passo', { tent: n, n: self.hist.length - 1, setas: usadas, resumo: (desc.itens || []).slice(), estavel: !!desc.estavel });
          if (desc.estavel) reg('resultado', resultadoDe(self, topo.S));
        });
      };
      return null;
    }
  });

  /* as ações do painel: literatura, catalisador, desfazer, limpar, voltar, recomeçar */
  envolver(ModuloMecanismo, 'acao', {
    apos: function (r, args) {
      if (!r) return;
      var nome = String(args[0] || ''), pre = this.cfg.pref + '-', a = nome.indexOf(pre) === 0 ? nome.slice(pre.length) : '';
      if (a === 'literatura') { reg('literatura', { tent: garantir(this), evento: 'aberta' }); }
      else if (a === 'lit-proximo' && this.lit && this.lit.fim) { reg('literatura', { tent: this.__relTent, evento: 'concluida' }); }
      else if (a === 'desfazer' && this.__relAberta) { reg('seta-desfeita', { tent: this.__relTent }); }
      else if (a === 'limpar' && this.__relAberta) { reg('setas-limpas', { tent: this.__relTent }); }
      else if (a === 'voltar' && this.__relAberta) { reg('voltar', { tent: this.__relTent }); }
      else if (a === 'recomecar') { this.__relAberta = false; }
      else if (a.indexOf('cat:') === 0) { this.__relAberta = false; }         // a cena reinicia com o novo catalisador
    }
  });
  if (typeof ModuloCombustao !== 'undefined') {
    envolver(ModuloCombustao, 'acao', {
      apos: function (r, args) {
        if (!r) return;
        var nome = String(args[0] || ''), pre = this.cfg.pref + '-';
        if (nome.indexOf(pre + 'ar:') === 0) this.__relAberta = false;           // o ar reinicia a cena
        else if (nome === pre + 'faisca') reg('faisca', { tent: garantir(this) });
      }
    });
  }

  /* ═══ B) MOSTRAR ═════════════════════════════════════════════ */

  /* junta os registros soltos em "tentativas" — pelo número que cada registro carrega (tent),
     não pela ordem: o aluno pode alternar entre módulos e voltar à tentativa anterior */
  function agrupar(registros) {
    var tents = [], por = {};
    registros.forEach(function (r) {
      if (r.tipo === 'tentativa') {
        var nova = { n: r.n, t: r.t, modulo: r.modulo, reacao: r.reacao, condicoes: r.condicoes || {}, setas: 0, farpas: 0, desfeitas: 0, recusas: [], passos: [],
                     literaturaAbertaAntes: null, literatura: 0, resultado: null, faisca: false, voltas: 0 };
        por[r.n] = nova; tents.push(nova); return;
      }
      var atual = por[r.tent]; if (!atual) return;
      if (r.tipo === 'seta') { atual.setas += 1; if (r.farpa) atual.farpas += 1; }
      else if (r.tipo === 'seta-desfeita' || r.tipo === 'setas-limpas') atual.desfeitas += 1;
      else if (r.tipo === 'recusa') atual.recusas.push(r);
      else if (r.tipo === 'passo') atual.passos.push(r);
      else if (r.tipo === 'voltar') atual.voltas += 1;
      else if (r.tipo === 'faisca') atual.faisca = true;
      else if (r.tipo === 'literatura') {
        atual.literatura += 1;
        if (atual.literaturaAbertaAntes === null) atual.literaturaAbertaAntes = !atual.resultado;   // consultou ANTES de concluir?
      }
      else if (r.tipo === 'resultado') atual.resultado = r;
    });
    return tents;
  }

  function condTxt(c, esc) { var p = []; if (c.catalisador) p.push(c.catalisador); if (c.ar) p.push(c.ar); return p.length ? esc(p.join(' · ')) : '—'; }
  function textoLit(t, esc) {
    var r = t.resultado, consulta;
    if (!t.literatura) consulta = 'não consultou';
    else consulta = t.literaturaAbertaAntes ? 'consultou antes de concluir' : 'consultou depois de concluir';
    var cmp = '';
    if (r) cmp = r.igualLiteratura === true ? '<span class="qrel-ok">igual à literatura</span>'
      : r.igualLiteratura === false ? '<span class="qrel-alerta">diferente da literatura' + (r.literatura ? ' (' + esc(r.literatura) + ')' : '') + '</span>' : '';
    return (cmp ? cmp + '<br>' : '') + esc(consulta);
  }

  function secaoTabela(tents, esc) {
    if (!tents.length) return '<p class="qrel-vazio">Nenhuma tentativa registrada ainda. Desenhe setas, aplique-as ou consulte a literatura para começar.</p>';
    var fim = tents.filter(function (t) { return t.resultado; }), iguais = fim.filter(function (t) { return t.resultado.igualLiteratura === true; });
    var sint = '<p>' + tents.length + ' tentativa(s); ' + fim.length + ' chegou(aram) a um produto estável'
      + (fim.length ? ', e ' + iguais.length + ' coincide(m) com a literatura' : '') + '.</p>';
    var linhas = tents.map(function (t) {
      var r = t.resultado, prod = r ? esc((r.produto || '—') + (r.formula ? ' · ' + r.formula : '')) + (r.classificacao ? '<br><span class="qrel-chip">' + esc(r.classificacao) + '</span>' : '') : '<span class="qrel-vazio">sem conclusão</span>';
      return '<tr><td>' + t.n + '</td><td>' + esc(t.modulo) + '</td><td>' + esc(t.reacao) + '</td><td>' + condTxt(t.condicoes, esc) + '</td>'
        + '<td>' + t.setas + (t.farpas ? ' (' + t.farpas + ' farpa' + (t.farpas > 1 ? 's' : '') + ')' : '') + '</td><td>' + t.recusas.length + '</td><td>' + t.passos.length + '</td><td>' + prod + '</td><td>' + textoLit(t, esc) + '</td></tr>';
    }).join('');
    return sint + '<div class="qrel-tabela-rolagem"><table class="qrel-tab"><thead><tr><th>Nº</th><th>Módulo</th><th>Reação</th><th>Condições</th><th>Setas</th><th>Recusas</th><th>Passos</th><th>Produto</th><th>Literatura</th></tr></thead><tbody>' + linhas + '</tbody></table></div>';
  }

  function secaoDetalhe(tents, esc) {
    if (!tents.length) return '<p class="qrel-vazio">Sem passos para mostrar.</p>';
    return tents.map(function (t) {
      var h = '<h4>Tentativa ' + t.n + ' — ' + esc(t.reacao) + '</h4>';
      if (t.faisca) h += '<p>Faísca acesa.</p>';
      if (t.passos.length) {
        h += '<ol class="qrel-lista">' + t.passos.map(function (p) {
          return '<li><strong>Setas:</strong> ' + (p.setas && p.setas.length ? esc(p.setas.join('; ')) : '—') + '<br><strong>O que aconteceu:</strong> ' + esc((p.resumo || []).join('; ') || '—') + (p.estavel ? ' <span class="qrel-chip">estado estável</span>' : '') + '</li>';
        }).join('') + '</ol>';
      } else h += '<p class="qrel-vazio">Nenhum passo foi aplicado nesta tentativa.</p>';
      if (t.recusas.length) {
        h += '<p><strong>O simulador recusou:</strong></p><ul class="qrel-lista">' + t.recusas.map(function (x) {
          return '<li>' + esc((x.setas || []).join('; ')) + ' — ' + esc(x.motivo) + '</li>';
        }).join('') + '</ul>';
      }
      if (t.desfeitas || t.voltas) h += '<p>Correções: ' + t.desfeitas + ' seta(s) desfeita(s) ou limpa(s); ' + t.voltas + ' passo(s) desfeito(s).</p>';
      return h;
    }).join('');
  }

  QRel.adaptador(SIM, {
    base: BASE,
    secoes: function (rel, ctx) {
      var tents = agrupar(rel.registros), esc = ctx.esc;
      return [
        { titulo: 'Tentativas e resultados', html: secaoTabela(tents, esc) },
        { titulo: 'Registro passo a passo', html: secaoDetalhe(tents, esc) }
      ];
    }
  });

  /* o botão do cabeçalho */
  function ligarBotao() {
    var b = document.getElementById('btn-relatorio'); if (!b) return;
    b.addEventListener('click', function () { QRel.abrir(SIM); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligarBotao); else ligarBotao();

  /* para os testes e para depuração */
  window.RelatorioSIRO = { agrupar: agrupar };
}());
