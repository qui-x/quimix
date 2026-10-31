/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/grupos-funcionais.js
   ───────────────────────────────────────────────────────────────
   MOTOR DE DETECÇÃO DE GRUPOS FUNCIONAIS (SIFO).

   Segue a especificação: o motor é SEMPRE GERAL — varre a molécula e
   lista TODOS os grupos presentes, cada ocorrência com os seus átomos
   (para o realce), nunca só o primeiro.

   CATÁLOGO DE FUNDO: 14 classes, na ordem de prioridade da
   especificação (a mesma sequência de antiguidade da IUPAC para o
   escopo do Ensino Médio): a de maior prioridade vira o SUFIXO do
   nome; as outras viram prefixo. Haleto orgânico e éter são SEMPRE
   prefixo.

   COMO OS GRUPOS SE SEPARAM (a parte delicada)
   Os grupos se sobrepõem: o ácido carboxílico tem C=O e O–H, mas não
   é "cetona + álcool"; o anidrido acético tem duas vezes C(=O)–O, mas
   não é "dois ésteres". Por isso:
     1. Cada carbono com C=O é classificado pela vizinhança INTEIRA,
        nesta ordem: O–H → ácido; O–C(=O) → anidrido; O–C → éster;
        halogênio → haleto de ácido; N → amida; senão H → aldeído;
        senão (dois carbonos) → cetona.
     2. Os átomos usados por um grupo carbonílico ficam MARCADOS e não
        são contados de novo (o O–H do ácido não vira álcool; o N da
        amida não vira amina).
     3. Só então os grupos de um heteroátomo só: O–H (álcool ou fenol,
        conforme o carbono seja de anel aromático), C–O–C (éter), N
        (amina), C–X (haleto orgânico).
   A aromaticidade (para separar fenol de álcool) vem da regra de
   Hückel, em classificacao-cadeias.js.

   FORA DO CATÁLOGO. O editor permite montar grupos que a
   especificação não cobre (enol, imina, tiol, sulfeto, sulfóxido…).
   O motor os aponta em `fora`, com o nome, para o aluno não ficar sem
   resposta — mas eles não entram na prioridade.

   Uso: var r = Q3.Funcoes.detectar(g)
        r.grupos      → [{ id, nome, prioridade, atomos, centro, tipo }]
        r.principal   → o grupo de maior prioridade (o do sufixo)
        r.contagem    → { id: número de ocorrências }
        r.fora        → grupos fora do catálogo

   Depende de: grafo-molecular.js, classificacao-cadeias.js.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var F = Q3.Funcoes = {};

  /* As 14 classes, na ordem de prioridade da especificação.
     sufixo/prefixo: como a classe aparece no nome (o Módulo 2 e o 4 usam). */
  F.CATALOGO = [
    { id: 'acido',        nome: 'Ácido carboxílico', grupo: '–COOH',   sufixo: 'ácido …-oico',     prefixo: 'carboxi' },
    { id: 'anidrido',     nome: 'Anidrido',          grupo: '–CO–O–CO–', sufixo: 'anidrido …-oico', prefixo: null },
    { id: 'ester',        nome: 'Éster',             grupo: '–COO–',   sufixo: '…-oato de …-ila',  prefixo: 'alcoxicarbonil' },
    { id: 'haletoAcila',  nome: 'Haleto de ácido',   grupo: '–COX',    sufixo: 'haleto de …-oíla', prefixo: 'halocarbonil' },
    { id: 'amida',        nome: 'Amida',             grupo: '–CONH₂',  sufixo: '…-amida',          prefixo: 'carbamoil' },
    { id: 'nitrila',      nome: 'Nitrila',           grupo: '–C≡N',    sufixo: '…-nitrila',        prefixo: 'ciano' },
    { id: 'aldeido',      nome: 'Aldeído',           grupo: '–CHO',    sufixo: '…-al',             prefixo: 'oxo' },
    { id: 'cetona',       nome: 'Cetona',            grupo: '–CO–',    sufixo: '…-ona',            prefixo: 'oxo' },
    { id: 'alcool',       nome: 'Álcool',            grupo: '–OH',     sufixo: '…-ol',             prefixo: 'hidroxi' },
    { id: 'fenol',        nome: 'Fenol',             grupo: 'Ar–OH',   sufixo: '…-ol',             prefixo: 'hidroxi' },
    { id: 'amina',        nome: 'Amina',             grupo: '–NH₂',    sufixo: '…-amina',          prefixo: 'amino' },
    { id: 'haleto',       nome: 'Haleto orgânico',   grupo: '–X',      sufixo: null,               prefixo: 'fluoro · cloro · bromo · iodo' },
    { id: 'eter',         nome: 'Éter',              grupo: '–O–',     sufixo: null,               prefixo: 'alcoxi' },
    { id: 'hidrocarboneto', nome: 'Hidrocarboneto',  grupo: 'C e H',   sufixo: '…-ano · -eno · -ino', prefixo: null }
  ];
  F.CATALOGO.forEach(function (c, i) { c.prioridade = i + 1; });
  F.POR_ID = {};
  F.CATALOGO.forEach(function (c) { F.POR_ID[c.id] = c; });

  var HALOGENIOS = { F: 1, Cl: 1, Br: 1, I: 1 };

  F.detectar = function (g) {
    var el = function (id) { return g.atomos[id].el; };
    var viz = function (id) { return g.vizinhos(id); };
    var H = function (id) { return g.hidrogenios(id); };
    var ordem = function (a, b) { var l = g.ligacao(a, b); return l ? l.ordem : 0; };
    var pesados = g.pesados(), usado = {}, grupos = [], fora = [];
    var add = function (id, atomos, centro, tipo) {
      var c = F.POR_ID[id];
      grupos.push({ id: id, nome: c.nome, prioridade: c.prioridade, atomos: atomos, centro: centro, tipo: tipo || null });
      atomos.forEach(function (a) { usado[a] = id; });
    };
    // O da carbonila (=O) de um carbono, se houver
    var oxoDe = function (c) { var v = viz(c).filter(function (x) { return x.ordem === 2 && el(x.id) === 'O'; })[0]; return v ? v.id : null; };
    var ehAcila = function (c) { return el(c) === 'C' && !!oxoDe(c); };

    // anéis aromáticos (Hückel), para separar fenol de álcool
    var aromatico = {};
    if (Q3.Classificacao) Q3.Classificacao.analisar(g).aneis.forEach(function (r) { if (r.aromatico) r.atomos.forEach(function (id) { aromatico[id] = true; }); });

    /* ── 1. carbonos com C=O: a vizinhança inteira decide ─────────── */
    var carbonilas = pesados.filter(ehAcila);
    // anidridos primeiro: o O entre duas acilas pertence aos dois lados
    carbonilas.forEach(function (c) {
      if (usado[c]) return;
      viz(c).forEach(function (v) {
        if (usado[c] || v.ordem !== 1 || el(v.id) !== 'O') return;
        var outra = viz(v.id).filter(function (w) { return w.id !== c && ehAcila(w.id); })[0];
        if (outra && !usado[outra.id]) add('anidrido', [c, oxoDe(c), v.id, outra.id, oxoDe(outra.id)], v.id);
      });
    });
    carbonilas.forEach(function (c) {
      if (usado[c]) return;
      var oxo = oxoDe(c), resto = viz(c).filter(function (v) { return v.id !== oxo; });
      /* TODOS os heteroátomos presos ao carbono carbonílico pertencem ao
         grupo dele: sem isso, o segundo N da ureia (H₂N–CO–NH₂) sobrava
         livre e virava "amina". */
      var heteroDoC = resto.filter(function (v) { return el(v.id) !== 'C'; }).map(function (v) { return v.id; });
      var addC = function (id, atomos, tipo) {
        heteroDoC.forEach(function (h) { if (atomos.indexOf(h) < 0) atomos.push(h); });
        add(id, atomos, c, tipo);
      };
      var oSimples = resto.filter(function (v) { return v.ordem === 1 && el(v.id) === 'O'; })[0];
      var hal = resto.filter(function (v) { return HALOGENIOS[el(v.id)]; })[0];
      var nit = resto.filter(function (v) { return el(v.id) === 'N'; })[0];
      if (oSimples && H(oSimples.id) >= 1) { addC('acido', [c, oxo, oSimples.id]); return; }
      if (oSimples) {
        // o carbono do lado alcoxi entra no realce; a marca de "usado" só bloqueia
        // heteroátomos e carbonos de nitrila, então ele segue livre para o que tiver
        var alquil = viz(oSimples.id).filter(function (w) { return w.id !== c; })[0];
        addC('ester', [c, oxo, oSimples.id].concat(alquil ? [alquil.id] : []));
        return;
      }
      if (hal) { addC('haletoAcila', [c, oxo, hal.id]); return; }
      if (nit) {
        var cN = viz(nit.id).filter(function (w) { return w.id !== c && el(w.id) === 'C'; }).length;
        addC('amida', [c, oxo, nit.id], cN === 0 ? 'primária' : cN === 1 ? 'secundária' : 'terciária');
        return;
      }
      if (H(c) >= 1) { addC('aldeido', [c, oxo]); return; }
      addC('cetona', [c, oxo]);
    });

    /* ── 2. nitrilas: C≡N ──────────────────────────────────────── */
    pesados.forEach(function (c) {
      if (el(c) !== 'C' || usado[c]) return;
      var n = viz(c).filter(function (v) { return v.ordem === 3 && el(v.id) === 'N'; })[0];
      if (n) add('nitrila', [c, n.id], c);
    });

    /* ── 3. grupos de um heteroátomo só ───────────────────────────── */
    pesados.forEach(function (x) {
      if (usado[x]) return;
      var e = el(x), vs = viz(x), cs = vs.filter(function (v) { return el(v.id) === 'C'; });
      if (e === 'O') {
        // O com dupla que sobrou é de S=O ou P=O: quem o relata é o átomo central
        if (vs.some(function (v) { return v.ordem === 2; })) return;
        if (H(x) >= 1 && cs.length === 1) {
          var c = cs[0].id;
          if (aromatico[c]) { add('fenol', [c, x], x); return; }
          if (viz(c).some(function (v) { return v.ordem === 2 && el(v.id) === 'C'; })) {
            fora.push({ nome: 'enol (OH em carbono de dupla — tautomeriza para aldeído ou cetona)', atomos: [c, x] });
            usado[x] = 'fora'; return;
          }
          var nc = viz(c).filter(function (v) { return el(v.id) === 'C'; }).length;
          add('alcool', [c, x], x, nc <= 1 ? 'primário' : nc === 2 ? 'secundário' : 'terciário');
          return;
        }
        if (cs.length === 2) { add('eter', [cs[0].id, x, cs[1].id], x); return; }
        return;
      }
      if (e === 'N') {
        // N em anel aromático (piridina, pirrol): amina heterocíclica — não é imina
        if (aromatico[x]) { add('amina', [x].concat(cs.map(function (v) { return v.id; })), x, 'heterocíclica aromática'); return; }
        if (vs.some(function (v) { return v.ordem >= 2; })) {
          fora.push({ nome: 'imina (C=N)', atomos: [x] }); usado[x] = 'fora'; return;
        }
        if (cs.length >= 1) add('amina', [x].concat(cs.map(function (v) { return v.id; })), x, cs.length === 1 ? 'primária' : cs.length === 2 ? 'secundária' : 'terciária');
        return;
      }
      if (HALOGENIOS[e] && cs.length === 1) { add('haleto', [cs[0].id, x], x); return; }
      if (e === 'P') { fora.push({ nome: 'composto de fósforo', atomos: [x] }); usado[x] = 'fora'; return; }
      if (e === 'S') {
        var nome = vs.some(function (v) { return v.ordem === 2; }) ? 'sulfóxido ou sulfona (S=O)' : H(x) >= 1 ? 'tiol (–SH)' : 'sulfeto (C–S–C)';
        fora.push({ nome: nome, atomos: [x] }); usado[x] = 'fora';
      }
    });

    // os grupos de um átomo reaproveitam carbonos: o marcador "usado" dos carbonos não os bloqueia
    var soCH = pesados.every(function (id) { return el(id) === 'C'; });
    if (soCH) add('hidrocarboneto', pesados.slice(), pesados[0]);

    grupos.sort(function (a, b) { return a.prioridade - b.prioridade; });
    var contagem = {};
    grupos.forEach(function (x) { contagem[x.id] = (contagem[x.id] || 0) + 1; });
    return { grupos: grupos, principal: grupos[0] || null, contagem: contagem, fora: fora };
  };

  /* as classes presentes, sem repetição, na ordem de prioridade: "amida, fenol" */
  F.classes = function (r) {
    var vistos = [];
    r.grupos.forEach(function (x) { if (vistos.indexOf(x.id) < 0) vistos.push(x.id); });
    return vistos;
  };

})(typeof window !== 'undefined' ? window : globalThis);
