/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/hibridizacao-orbitais.js
   ───────────────────────────────────────────────────────────────
   SIQC · MÓDULO 2 — HIBRIDIZAÇÃO

   Um carbono só, em destaque, com seus orbitais de valência como
   NUVENS de probabilidade (gradiente, borda difusa). O visual é
   propositalmente outro que o do resto do projeto — traço duro de
   ligação, bolinha de átomo —: é outro modelo explicativo, e o aluno
   precisa perceber a troca.

   O QUE O ALUNO FAZ
     1. Escolhe a hibridização: sp³, sp² ou sp.
     2. Escolhe QUAIS orbitais p entram na mistura, tocando na nuvem ou
        no botão do painel. Quantas escolhas: 0 na sp³ (os três p entram
        obrigatoriamente, não há o que escolher), 2 na sp², 1 na sp.
        Passou do limite, o mais antigo sai — piscando, para se ver.
     3. Desliza a mistura de 0% a 100%. As nuvens escolhidas mudam de
        FORMA (halteres simétricos → um lobo grande e um pequeno) e de
        POSIÇÃO (do eixo original até o ângulo final). As que não
        entraram ficam PARADAS o tempo todo: é delas que sai a ligação π.
     4. Gira a câmera arrastando (ou com as setas) para conferir de
        qualquer lado que o ângulo é mesmo 109,5°, 120° ou 180°.
   Mudar o tipo ou a seleção volta a mistura para 0%.

   O QUE ISTO NÃO É
   A interpolação é um recurso didático, não a solução da equação de
   Schrödinger: mostra de onde cada híbrido vem e para onde vai. Os
   pontos finais — direções, ângulos, número de híbridos e de p puros —
   são os da literatura.

   ONDE MORA CADA COISA
   O canvas tem SÓ O DESENHO: nuvens, eixos, núcleos, os selos σ e π e
   o arco do ângulo. Tudo o que é informação vai para o painel
   Resultados, em HTML:
     · o próximo passo (proximoPasso);
     · o diagrama de energia dos elétrons de valência, num canvas
       próprio no painel (#hib-diagrama) — é nele que se arrasta o
       elétron do 2s para o 2p;
     · os números: sobreposição σ e π, distância, energia do giro e o
       balanço da promoção (resultados);
     · a curva da energia ao girar a ligação (graficoResultado, no
       #result-chart que a app desenha).
   Os rótulos que ficam no desenho desviam uns dos outros, da pílula
   do modo e da coluna de zoom (ui/moldura-cena.js).

   Depende de: camera-orbital.js (OrbitCamera), desenho-molecula.js
               (paleta), anuncios.js (announce, playTone), formatacao.js,
               moldura-cena.js (Q3.Moldura).
═══════════════════════════════════════════════════════════════ */

'use strict';

var ORB_EIXO = { px: [1, 0, 0], py: [0, 1, 0], pz: [0, 0, 1] };
var ORB_P = ['px', 'py', 'pz'];
var ORB_ESCOLHAS = { sp3: 0, sp2: 2, sp: 1 };   // escolhas do aluno
var ORB_MISTURAM = { sp3: 3, sp2: 2, sp: 1 };   // p que entram na mistura
var ORB_FALA = { s: 's', px: 'p x', py: 'p y', pz: 'p z' };
var ORB_TEXTO = { s: 's', px: 'pₓ', py: 'p_y', pz: 'p_z' };

// vetores
function oAdd(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
function oMul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
function oDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function oNorm(a) { var m = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / m, a[1] / m, a[2] / m]; }
function oCross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function oLerp(a, b, k) { return a + (b - a) * k; }
function oSlerp(u, v, k) {
  var d = Math.max(-1, Math.min(1, oDot(u, v))), w = Math.acos(d);
  if (w < 1e-6) return u;
  var s = Math.sin(w);
  return oNorm(oAdd(oMul(u, Math.sin((1 - k) * w) / s), oMul(v, Math.sin(k * w) / s)));
}
function oSuave(t) { return t * t * (3 - 2 * t); }

/* Direções dos híbridos, na literatura: sp linear no eixo do p
   escolhido; sp² trigonal no plano dos dois p escolhidos (o terceiro,
   perpendicular, é o da ligação π); sp³ tetraédrico. */
function orbDirecoes(tipo, sel) {
  if (tipo === 'sp') { var a = ORB_EIXO[sel[0]]; return [a, oMul(a, -1)]; }
  if (tipo === 'sp2') {
    var ord = sel.slice().sort(), e1 = ORB_EIXO[ord[0]], e2 = ORB_EIXO[ord[1]];
    return [90, 210, 330].map(function (g) {
      var r = g * Math.PI / 180;
      return oAdd(oMul(e1, Math.cos(r)), oMul(e2, Math.sin(r)));
    });
  }
  var q = Math.sqrt(8 / 9), y = -1 / 3, h = Math.sqrt(3) / 2;
  return [[0, 1, 0], [q, y, 0], [-q / 2, y, q * h], [-q / 2, y, -q * h]];
}

/* Quem vira qual híbrido: cada p escolhido vai para a direção mais
   alinhada com o próprio eixo (anda o mínimo), e o s fica com a que
   sobrar. É o que faz a animação mostrar "de onde vem" cada híbrido. */
function orbAtribuir(tipo, sel) {
  var dirs = orbDirecoes(tipo, sel), livres = dirs.map(function (_, i) { return i; }), mapa = {};
  sel.slice().sort().forEach(function (p) {
    var melhor = livres[0], alin = -1;
    livres.forEach(function (i) {
      var a = Math.abs(oDot(ORB_EIXO[p], dirs[i]));
      if (a > alin + 1e-9) { alin = a; melhor = i; }
    });
    mapa[p] = dirs[melhor];
    livres.splice(livres.indexOf(melhor), 1);
  });
  mapa.s = dirs[livres[0]];
  return mapa;
}

var ORB_CORES = {
  escuro: { s: '#f5b942', px: '#ff7a95', py: '#5fd38d', pz: '#6aa8ff', hib: '#3ee0c4' },
  claro:  { s: '#9a6408', px: '#b3134a', py: '#17753a', pz: '#1c4fd1', hib: '#0b6b5f' }
};
function orbRgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
function orbMisturaCor(a, b, k) {
  var x = orbRgb(a), y = orbRgb(b);
  return '#' + x.map(function (v, i) { return Math.round(oLerp(v, y[i], k)).toString(16).padStart(2, '0'); }).join('');
}
function orbRgba(h, a) { var c = orbRgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

class HibridizacaoOrbitais {
  constructor(D) {
    this.D = D;
    this.cam = new OrbitCamera();
    this.cam.definirPadrao(-0.62, 0.36);
    this.ativo = false;
    this.t = 0;
    this.mistura = 0;
    this.piscar = null;
    this._marco = 0;
    this._lobos = [];
    this._engolirClique = false;
    /* POR QUE HIBRIDIZAR: o módulo começa no ESTADO FUNDAMENTAL (2s² 2p²);
       a mistura só libera depois da promoção de um elétron do 2s para o 2p
       vazio (core/orbitais-modelo.js). */
    this.etapa = 'fundamental';
    this._animPromo = null;          // elétron voando do 2s para o 2p_z
    this._arrasto = null;            // elétron sendo arrastado no diagrama (coordenadas do canvas do painel)
    this._diag = null;               // geometria do diagrama de energia, para o toque (no canvas do painel)
    /* FORMAR LIGAÇÕES: com a mistura completa, um parceiro (H ou C) se
       aproxima pelo eixo do híbrido mirado. aprox: 0 longe → 1 na
       distância de ligação; giro: graus em torno da ligação; hs: híbridos
       já ligados a um H (a ligação com H fica, e dá para mirar outro). */
    this.lig = this._ligVazia(null);
    this._marcosLig = {};
    this._pega = null;               // o parceiro na mão do aluno
    this.definirTipo('sp3', true);
    /* navegação 3D compartilhada com o Módulo 1 (navegacao-3d.js) */
    var eu = this;
    this.nav = new Navegacao3D({
      canvas: document.getElementById('sim-canvas'), camera: this.cam,
      ativo: function () { return eu.ativo; },
      escala: function () { return eu._esc || 200; },
      centroTela: function (w, h) { var m = eu._moldura(w, h); return { x: m.cx, y: m.cy }; },
      fraseAjustar: 'Orbitais inteiros na tela.',
      cede: function (x, y) { return eu._parceiroAgarravel(x, y); }   // arrastar o parceiro não gira a câmera
    });
    this._ligarArrasto();
    this._ligarDiagramaLateral();
  }

  /* A MOLDURA da cena: o retângulo do desenho (abaixo da pílula, à esquerda da coluna de zoom), o centro
     e a escala (px por unidade). As nuvens e os eixos vão até ~1,8 unidade do centro. */
  _moldura(W, H) {
    var r = Q3.Moldura.livre(W, H, true);
    var esc = Math.max(10, (Math.min(r.w, r.h) / 2 - 10) / 1.8);
    return { x: r.x, y: r.y, w: r.w, h: r.h, cx: r.x + r.w / 2, cy: r.y + r.h / 2, esc: esc };
  }

  /* Volta ao estado inicial — chamado quando o aluno troca de módulo (a
     troca LIMPA o módulo que sai). Não recria a câmera nem os ouvintes do
     canvas: só repõe o estado, como no construtor. */
  reiniciar() {
    this.t = 0; this.mistura = 0; this.piscar = null; this._marco = 0; this._lobos = [];
    this._engolirClique = false;
    this.etapa = 'fundamental'; this._animPromo = null; this._arrasto = null; this._diag = null;
    this.lig = this._ligVazia(null); this._marcosLig = {}; this._pega = null;
    this.definirTipo('sp3', true);
    var c = this.cam;
    c.definirPadrao(c.padrao.yaw, c.padrao.pitch); c.alvo = [0, 0, 0]; c.zoom = 1; c._anim = null;
  }

  ativar() {
    this.ativo = true; this._sincronizarPainel();
    var cv = document.getElementById('sim-canvas'); if (cv) cv.style.touchAction = 'none';
    var caixa = document.getElementById('hib-diagrama-box'); if (caixa) caixa.hidden = false;   // o diagrama de energia, no painel Resultados
  }
  desativar() {
    this.ativo = false; this._arrasto = null;
    var caixa = document.getElementById('hib-diagrama-box'); if (caixa) caixa.hidden = true;
  }

  /* ── estado ────────────────────────────────────────────────── */

  get hib() { var t = this.tipo; return this.D.HIBRIDIZACOES.find(function (h) { return h.id === t; }); }
  _valida() { return this.sel.length === ORB_MISTURAM[this.tipo]; }
  _podeMisturar() { return this._valida() && this.etapa === 'promovido'; }
  _misturaCompleta() { return this._podeMisturar() && this.mistura >= 0.999; }

  definirTipo(id, silencioso) {
    this.tipo = id;
    this.sel = id === 'sp3' ? ORB_P.slice() : [];
    this._zerarMistura();
    if (!silencioso) {
      var n = ORB_ESCOLHAS[id], h = this.hib;
      announce('Hibridização ' + h.nome + '. ' + (n
        ? 'Escolha ' + n + ' orbita' + (n > 1 ? 'is' : 'l') + ' p para misturar com o s.'
        : 'Os três orbitais p entram na mistura: não há o que escolher. Deslize a mistura.'));
    }
  }

  alternarP(p) {
    if (this.tipo === 'sp3') { announce('Na sp³ os três orbitais p entram na mistura: não há o que escolher.'); return false; }
    /* UM anúncio por toque, montado em partes. Com dois announce() em
       sequência, o segundo sobrescreve o primeiro na região ao vivo: ao
       estourar o limite, "p x saiu da mistura" era apagado na hora por
       "Seleção válida", e o leitor de tela perdia justamente qual saiu. */
    var partes = [];
    var i = this.sel.indexOf(p);
    if (i >= 0) this.sel.splice(i, 1);
    else {
      this.sel.push(p);
      var lim = ORB_MISTURAM[this.tipo];
      if (this.sel.length > lim) {
        var saiu = this.sel.shift();       // o mais antigo sai, piscando
        this.piscar = { id: saiu, ate: this.t + 0.7 };
        playTone(300, .08, .04);
        partes.push(ORB_FALA[saiu] + ' saiu da mistura: a ' + this.hib.nome + ' usa só ' + lim + ' orbita' + (lim > 1 ? 'is' : 'l') + ' p.');
      }
    }
    this._zerarMistura();
    if (this._valida()) {
      playTone(760, .07, .045);
      var puros = ORB_P.filter(function (x) { return this.sel.indexOf(x) < 0; }, this);
      partes.push('Seleção válida: s com ' + this.sel.map(function (x) { return ORB_FALA[x]; }).join(' e ') + '.' +
        (puros.length ? ' ' + puros.map(function (x) { return ORB_FALA[x]; }).join(' e ') + ' fica' + (puros.length > 1 ? 'm' : '') + ' de fora.' : '') +
        ' Agora deslize a mistura.');
    } else {
      var falta = ORB_MISTURAM[this.tipo] - this.sel.length;
      partes.push(ORB_FALA[p] + (i >= 0 ? ' desmarcado.' : ' escolhido.') + (falta > 0 ? ' Falta' + (falta > 1 ? 'm ' : ' ') + falta + '.' : ''));
    }
    announce(partes.join(' '));
    return true;
  }

  definirMistura(v) {
    if (!this._podeMisturar()) {
      this.mistura = 0; this._sincronizarPainel();
      if (this._valida() && this.etapa === 'fundamental') return { say: 'Antes de misturar, promova um elétron do 2s para o 2p vazio: no estado fundamental só há dois elétrons desemparelhados.' };
      return {};
    }
    var completaAntes = this._misturaCompleta();
    this.mistura = Math.max(0, Math.min(1, v));
    if (this.mistura < 0.999 && this.lig.parceiro) this._soltar(true);   // ligação só entre híbridos prontos
    // o painel de ligações acorda (ou dorme) quando a mistura completa (ou deixa de completar)
    if (completaAntes !== this._misturaCompleta()) this._sincronizarPainel();
    // marcos de acessibilidade: 0%, 50% e 100%, anunciados uma vez cada
    var pct = Math.round(this.mistura * 100), marco = pct >= 100 ? 100 : pct >= 50 ? 50 : 0;
    if (marco !== this._marco) {
      this._marco = marco;
      var h = this.hib, n = ORB_MISTURAM[this.tipo] + 1, puros = 3 - ORB_MISTURAM[this.tipo];
      var fala = {
        0: 'Mistura em 0%: o s e os p separados, cada um no seu formato.',
        50: 'Mistura em 50%: as nuvens escolhidas já giram e ficam desiguais.',
        100: 'Mistura completa: ' + n + ' orbitais ' + h.nome + ' idênticos, a ' + fmt(h.angulo, 1).replace('.', ',') + ' graus entre si, geometria ' + h.geometria + '.' +
             (puros ? ' ' + (puros > 1 ? 'Os ' + puros + ' orbitais p puros formam ligações pi.' : 'O orbital p puro forma a ligação pi.') : '')
      };
      announce(fala[marco]);
      if (marco === 100) playTone(980, .1, .05);
    }
    return {};
  }

  _zerarMistura() {
    this.mistura = 0; this._marco = 0;
    this._soltar(true);
    this._sincronizarPainel();
  }

  cameraInicial() { this.nav.recentrar(); }

  /* O painel espelha o estado: botões dos p, dica e o deslizante. */
  _sincronizarPainel() {
    var self = this;
    ORB_P.forEach(function (p) {
      var b = document.querySelector('[data-action="hib-p-' + p + '"]');
      if (!b) return;
      b.setAttribute('aria-pressed', String(self.sel.indexOf(p) >= 0));
      b.disabled = self.tipo === 'sp3';
    });
    var r = document.getElementById('hib-mistura'), o = document.getElementById('out-hib-mistura');
    if (r) { r.disabled = !this._podeMisturar(); r.value = String(Math.round(this.mistura * 100)); }
    // elétrons
    var de = document.getElementById('hib-eletrons-dica');
    if (de) de.textContent = this.etapa === 'fundamental' ? 'Fundamental: 2s² 2p² · 2 desemparelhados' : 'Promovido: 2s¹ 2p³ · 4 desemparelhados';
    var bp = document.querySelector('[data-action="hib-promover"]'); if (bp) bp.disabled = this.etapa === 'promovido';
    var bf = document.querySelector('[data-action="hib-fundamental"]'); if (bf) bf.disabled = this.etapa === 'fundamental';
    // ligações
    var pronto = this._misturaCompleta(), L = this.lig, G = this._parceiroGeom();
    document.querySelectorAll('[data-group="parceiro"] .seg-btn').forEach(function (b) { b.disabled = !pronto; b.setAttribute('aria-pressed', String(!!L.parceiro && L.parceiro === b.dataset.value)); });
    var ra = document.getElementById('lig-aprox'), oa = document.getElementById('out-lig-aprox');
    if (ra) { ra.disabled = !(pronto && L.parceiro && L.alvo); ra.value = String(Math.round(this.aproxLig * 100)); }
    if (oa) { var ang = L.parceiro === 'H' ? Q3.Orbitais.COMPRIMENTO_CH : Q3.Orbitais.COMPRIMENTO_CC[this.tipo];
      oa.textContent = !G ? 'longe' : L.ligada ? 'ligado' : fmt(G.d * ang / G.dLig, 2).replace('.', ',') + ' Å'; }
    var rg = document.getElementById('lig-giro'), og = document.getElementById('out-lig-giro');
    if (rg) { rg.disabled = !(pronto && L.parceiro === 'C' && L.alvo); rg.value = String(Math.round(this.giroLig)); }
    if (og) og.textContent = Math.round(this.giroLig) + '°';
    var bs = document.querySelector('[data-action="hib-soltar"]'); if (bs) bs.disabled = !(L.parceiro && (L.alvo || L.hs.length));
    var dl = document.getElementById('lig-dica');
    // só o estado: a mistura, as σ com H e, com a C–C formada, se o giro é livre (o como fazer está no tour)
    if (dl) dl.textContent = !pronto ? 'Mistura incompleta.'
      : (L.hs.length ? L.hs.length + ' σ C–H' : '') + (L.parceiro === 'C' && L.ligada ? (L.hs.length ? ' · ' : '') + (this.tipo === 'sp2' ? 'C=C: giro travado pela π' : this.tipo === 'sp' ? 'C≡C: giro livre' : 'C–C: giro livre') : '');
    if (o) o.textContent = Math.round(this.mistura * 100) + ' %';
    var d = document.getElementById('hib-p-dica');
    if (d) {
      var n = ORB_ESCOLHAS[this.tipo];
      d.textContent = !n ? 'sp³: os três p entram.'
        : 'Orbitais p: ' + this.sel.length + ' de ' + n + (this._valida() && this.etapa === 'fundamental' ? ' · falta promover' : '');
    }
  }

  navegar(dx, dy) {
    if (!this.ativo) return false;
    this.nav.girarTeclado(dx, dy);
    return true;
  }

  /* ── toque nas nuvens ──────────────────────────────────────── */

  tocar(x, y) {
    if (!this.ativo) return false;
    if (this.nav.consumirClique()) return false;          // foi arraste, pinça ou toque duplo
    if (this._engolirClique) { this._engolirClique = false; return false; }   // foi arrasto do parceiro
    // (o diagrama de energia mora no painel Resultados: o toque nele é tratado lá, em _ligarDiagramaLateral)
    if (this._misturaCompleta() && this.lig.parceiro) {
      var alvoMira = null;
      this._lobos.forEach(function (L) {
        if (!L.entra || !L.grande) return;
        var dx = x - L.x, dy = y - L.y, c = Math.cos(-L.ang), s2 = Math.sin(-L.ang), u = dx * c - dy * s2, v = dx * s2 + dy * c;
        var q = (u * u) / (L.A * L.A) + (v * v) / (L.B * L.B);
        if (q <= 1 && (!alvoMira || q < alvoMira.q)) alvoMira = { q: q, orb: L.orb };
      });
      if (alvoMira) return this.mirar(alvoMira.orb);
      return false;
    }
    /* Qual nuvem o aluno quis tocar: a de MIOLO mais perto do dedo, medido
       em unidades da própria elipse (0 no centro, 1 na borda). A primeira
       versão escolhia a nuvem mais próxima da câmera — e numa vista 3/4 o
       lobo do p_z passa na frente do centro do pₓ: o toque no pₓ escolhia
       o p_z. Com nuvens translúcidas, "a da frente" não é o alvo que se
       vê; o miolo é. A profundidade fica só para desempate. */
    var melhor = null;
    this._lobos.forEach(function (L) {
      var dx = x - L.x, dy = y - L.y, c = Math.cos(-L.ang), s = Math.sin(-L.ang);
      var u = dx * c - dy * s, v = dx * s + dy * c;
      var q = (u * u) / (L.A * L.A) + (v * v) / (L.B * L.B);
      if (q > 1) return;
      if (!melhor || q < melhor.q - 1e-6 || (Math.abs(q - melhor.q) <= 1e-6 && L.depth < melhor.L.depth)) melhor = { q: q, L: L };
    });
    if (!melhor) return false;
    if (melhor.L.orb === 's') { announce('O orbital s entra em toda mistura: ele não se escolhe.'); return false; }
    return this.alternarP(melhor.L.orb);
  }

  atualizar(dt) {
    this.t += dt; if (this.piscar && this.t > this.piscar.ate) this.piscar = null;
    this._fisica(Math.min(dt, 1 / 20));
  }

  /* ── A LIGAÇÃO RESPONDE À MÃO (core/orbitais-modelo.js: passoGiro,
     passoDistancia). A cada quadro: a distância no poço de Morse, e — com
     um carbono — o giro com o torque da ligação. Depois, os eventos. ── */
  _fisica(dt) {
    var L = this.lig, O = Q3.Orbitais;
    if (!L.parceiro || !L.alvo || !this._misturaCompleta()) return;
    var dl = this._distancias(), mao = L.segura ? L.mao : null, reduz = document.body.classList.contains('reduce-motion');
    /* O controle deslizante segura RÍGIDO, na posição exata: num controle
       não há "sentir a resistência", e o número tem de bater com o que se
       vê. A mola — o parceiro ficando para trás da mão — é do ponteiro. */
    if (L.segura === 'controle' && mao) {
      L.r = mao.r; L.vr = 0;
      if (L.parceiro === 'C') { L.th = mao.th; L.w = 0; }
      this._eventosLig(dl, dt);
      if (!this._ultimaSync || this.t - this._ultimaSync > 0.12) { this._ultimaSync = this.t; this._sincronizarControlesLig(); }
      return;
    }
    var d = { r: L.r, v: L.vr };
    O.passoDistancia(d, dt, dl.lig, dl.De, mao ? mao.r : null);
    L.r = Math.min(d.r, dl.longe + 1.2); L.vr = d.v;
    if (L.parceiro === 'C') {
      // antes da σ não há ligação para resistir ao giro: gira como a tripla (sem torque)
      var g = { th: L.th, w: L.w };
      O.passoGiro(g, L.ligada ? this.tipo : 'sp', dt, mao ? mao.th : null);
      L.th = g.th; L.w = g.w;
    }
    // movimento reduzido: solto, vai direto ao repouso (sem balanço)
    if (reduz && !L.segura) {
      if (L.r < dl.lig + O.FIS.alcance) { L.r = L.ligada || L.r < dl.lig + 0.6 ? dl.lig : L.r; L.vr = 0; }
      if (L.parceiro === 'C') { if (this.tipo === 'sp2' && L.ligada) L.th = Math.round(L.th / Math.PI) * Math.PI; L.w = 0; }
    }
    this._eventosLig(dl, dt);
    if (!this._ultimaSync || this.t - this._ultimaSync > 0.12) { this._ultimaSync = this.t; this._sincronizarControlesLig(); }
  }

  _eventosLig(dl, dt) {
    var L = this.lig, O = Q3.Orbitais, m = this._marcosLig, nome = this.hib.nome;
    // σ: forma quando o parceiro assenta no poço
    if (!L.ligada && L.r < dl.lig + 0.25 && Math.abs(L.vr) < 0.8) {
      L.ligada = true; playTone(980, .1, .05);
      // a câmera se aproxima da ligação recém-formada: recompensa e visão melhor da σ e da π
      if (L.parceiro === 'C' && this.cam) {
        /* o par ligado vai até ~2,35 unidades do meio da ligação (os híbridos de fora de cada carbono):
           o zoom é o que faz o par INTEIRO caber na moldura — antes era 0,95 fixo, e numa cena estreita as
           nuvens do parceiro passavam por baixo da coluna de zoom e saíam pela borda */
        var aE = oNorm(orbAtribuir(this.tipo, this.sel)[L.alvo]), Mo = this._moldura(this._W || 900, this._H || 700);
        var zLig = Math.max(0.4, Math.min(0.95, (Math.min(Mo.w, Mo.h) / 2 - 8) / (2.35 * Mo.esc)));
        this.cam.animarPara({ alvo: oMul(aE, dl.lig / 2), zoom: zLig }, 700);
        this._enquadrar = true;   // terminada a aproximação, confere o enquadramento de verdade (ver desenhar)
      }
      if (L.parceiro === 'C') {
        var pis = 3 - ORB_MISTURAM[this.tipo];
        announce('Ligação sigma ' + nome + '–' + nome + ' formada, a ' + fmt(O.COMPRIMENTO_CC[this.tipo], 2).replace('.', ',') + ' ångström.' +
          (pis ? ' Os p puros ficaram lado a lado: ' + (pis > 1 ? 'duas ligações pi' : 'uma ligação pi') + ' também. Arraste o carbono de lado para girar.' : ' Sem p puros, não há pi: arraste de lado e veja a simples girar quase livre.'));
      }
    }
    // H: assentou de vez → fica ligado, e dá para mirar outro híbrido
    if (L.parceiro === 'H' && L.ligada) {
      // assentar é medido em TEMPO (0,25 s), não em quadros: num computador lento, 12 quadros demoravam demais
      L.assentou = Math.abs(L.vr) < 0.3 && Math.abs(L.r - dl.lig) < 0.08 ? L.assentou + (dt || 0) : 0;
      if (L.assentou > 0.25 && L.segura !== 'ponteiro') {
        L.hs.push(L.alvo);
        var n = L.hs.length, tot = ORB_MISTURAM[this.tipo] + 1;
        announce('Ligação sigma ' + nome + '–1s formada: ' + n + ' de ' + tot + ' híbridos ligados a hidrogênio.' + (n < tot ? ' Toque noutro híbrido para mirar o próximo.' : ' Todos os híbridos estão ligados.'));
        L.alvo = null; L.ligada = false; L.segura = null; L.r = dl.longe; this._marcosLig = {};
        this._sincronizarPainel();
        return;
      }
    }
    // σ rompida: puxado além do poço
    if (L.ligada && L.r > dl.lig + 2.2) {
      L.ligada = false; playTone(240, .16, .06);
      announce('A ligação sigma se rompeu: foi preciso vencer cerca de ' + dl.De + ' quilojoules por mol. Traga o ' + (L.parceiro === 'H' ? 'hidrogênio' : 'carbono') + ' de volta para religar.');
    }
    // π: rompe ao cruzar 90° e se refaz perto de 0° ou 180°
    if (L.parceiro === 'C' && L.ligada && this.tipo === 'sp2') {
      var c = Math.abs(Math.cos(L.th));
      if (c < 0.12 && !m.piRompida) { m.piRompida = true; playTone(300, .12, .05); announce('A 90 graus os p ficam perpendiculares: a ligação pi se rompe. Custa cerca de 270 quilojoules por mol — por isso a dupla não gira, e existem os isômeros cis e trans.'); }
      else if (c > 0.95 && m.piRompida) { m.piRompida = false; playTone(880, .08, .04); announce('Os p voltaram a se alinhar: a ligação pi se refez.'); }
      // tensão ao torcer: um toque a cada 60 kJ/mol subidos, com tom crescente
      if (L.segura) {
        var faixa = Math.floor(O.energiaGiro('sp2', L.th) / 60);
        if (m.faixa !== undefined && faixa > m.faixa) playTone(420 + faixa * 90, .04, .03);
        m.faixa = faixa;
      }
    }
    // giro livre: a simples e a tripla, soltas com impulso
    if (L.parceiro === 'C' && L.ligada && this.tipo !== 'sp2' && !L.segura && Math.abs(L.w) > 3 && !m.girouLivre) {
      m.girouLivre = true;
      announce(this.tipo === 'sp' ? 'A tripla gira sem resistência nenhuma: as duas pi formam um cilindro em volta da ligação.' : 'A simples gira quase livre: só a sigma, que não depende do giro. A cada eclipse dos hidrogênios, um degrau pequeno, de 12 quilojoules por mol.');
    }
  }

  /* Os controles acompanham a física (sem refazer o painel inteiro). */
  _sincronizarControlesLig() {
    var L = this.lig, G = this._parceiroGeom();
    var ra = document.getElementById('lig-aprox'), oa = document.getElementById('out-lig-aprox');
    var rg = document.getElementById('lig-giro'), og = document.getElementById('out-lig-giro');
    if (ra && L.segura !== 'controle') ra.value = String(Math.round(this.aproxLig * 100));
    if (oa) { var ang = L.parceiro === 'H' ? Q3.Orbitais.COMPRIMENTO_CH : Q3.Orbitais.COMPRIMENTO_CC[this.tipo];
      oa.textContent = !G ? 'longe' : L.ligada ? 'ligado' : fmt(G.d * ang / G.dLig, 2).replace('.', ',') + ' Å'; }
    if (rg && L.segura !== 'controle') rg.value = String(Math.round(this.giroLig));
    if (og) og.textContent = Math.round(this.giroLig) + '°';
  }

  /* ── desenho ───────────────────────────────────────────────── */

  _lobosDe(orb, e) {
    // dois lobos por orbital: {dir, c: distância do centro, a: meio-eixo ao longo, b: meio-eixo ao redor, alfa}
    var mapa = this._valida() ? orbAtribuir(this.tipo, this.sel) : null;
    var entra = orb === 's' || this.sel.indexOf(orb) >= 0;
    var k = entra && mapa ? e : 0;
    var alvo = mapa ? mapa[orb] : null;
    if (orb === 's') {
      var D = alvo || [0, 1, 0];
      return [
        { dir: D, c: oLerp(0, 0.90, k), a: oLerp(0.58, 0.80, k), b: oLerp(0.58, 0.43, k), alfa: 1 },
        { dir: oMul(D, -1), c: oLerp(0, 0.24, k), a: oLerp(0.58, 0.22, k), b: oLerp(0.58, 0.18, k), alfa: k }
      ];
    }
    var A = ORB_EIXO[orb];
    if (alvo && oDot(A, alvo) < 0) A = oMul(A, -1);
    var dir = alvo && k ? oSlerp(A, alvo, k) : A;
    return [
      { dir: dir, c: oLerp(0.62, 0.90, k), a: oLerp(0.52, 0.80, k), b: oLerp(0.33, 0.43, k), alfa: 1 },
      { dir: oMul(dir, -1), c: oLerp(0.62, 0.24, k), a: oLerp(0.52, 0.22, k), b: oLerp(0.33, 0.18, k), alfa: 1 }
    ];
  }

  desenhar(ctx, W, H) {
    var P = Q3.Desenho.paleta(), claro = P.claro, cores = ORB_CORES[claro ? 'claro' : 'escuro'];
    /* SÓ O DESENHO: o diagrama de energia, os medidores, a curva e a dica moram no painel Resultados.
       A cena ganha a área livre inteira, menos a pílula do modo e a coluna de zoom (Q3.Moldura). */
    var M = this._moldura(W, H), cx = M.cx, cy = M.cy, esc = M.esc;
    this._esc = esc; this._W = W; this._H = H;                        // px por unidade, para o pan andar junto com o dedo
    this.cam.passo();                       // transição em curso (ajustar, recentrar)
    this.nav.sincronizar();
    var cam = this.cam, e = oSuave(this.mistura), self = this;
    this._cx = cx; this._cy = cy;
    var proj = function (v) { return cam.project(v[0], v[1], v[2], cx, cy, esc); };
    var rotulos = [], obst = [Q3.Moldura.pilula(W), Q3.Moldura.zoom(W, H)].filter(Boolean);   // os rótulos do desenho desviam disto
    var centro = proj([0, 0, 0]);
    var paraFora = function (x, y) { return { ux: x - centro.sx, uy: y - centro.sy }; };

    // eixos de referência: é contra eles que se lê o "ângulo original" (as letras entram na fila de rótulos)
    ctx.save();
    ctx.setLineDash([4, 6]); ctx.lineWidth = 1.2; ctx.strokeStyle = P.suave; ctx.globalAlpha = 0.55;
    [['x', [1, 0, 0]], ['y', [0, 1, 0]], ['z', [0, 0, 1]]].forEach(function (ax) {
      var a = proj(oMul(ax[1], -1.55)), b = proj(oMul(ax[1], 1.55));
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
      var r = proj(oMul(ax[1], 1.72)), f = paraFora(r.sx, r.sy);
      rotulos.push({ txt: ax[0], x: r.sx, y: r.sy, ux: f.ux, uy: f.uy, w: 10, h: 15, fonte: '600 13px system-ui, sans-serif', cor: P.suave, prio: 2 });
    });
    ctx.restore();

    // monta todos os lobos com profundidade, para desenhar de trás para a frente
    var itens = [];
    ['s'].concat(ORB_P).forEach(function (orb) {
      var entra = orb === 's' || self.sel.indexOf(orb) >= 0;
      var cor = entra && self._valida() ? orbMisturaCor(cores[orb], cores.hib, e) : cores[orb];
      self._lobosDe(orb, e).forEach(function (L, j) {
        if (L.alfa <= 0.01) return;
        var centro = oMul(L.dir, L.c), p = proj(centro), r = cam.girar(L.dir[0], L.dir[1], L.dir[2]);
        // o tamanho da nuvem acompanha o zoom, como a posição (que já o recebe em project)
        var f = Math.min(1, Math.hypot(r[0], r[1])), kk = esc * cam.zoom * p.persp;
        var Aeixo = Math.sqrt(Math.pow(L.a * f, 2) + Math.pow(L.b * Math.sqrt(Math.max(0, 1 - f * f)), 2)) * kk;
        itens.push({ orb: orb, grande: j === 0, x: p.sx, y: p.sy, A: Math.max(2, Aeixo), B: Math.max(2, L.b * kk),
          ang: f > 1e-3 ? Math.atan2(-r[1], r[0]) : 0, depth: p.depth, cor: cor, alfa: L.alfa,
          entra: entra, ponta: proj(oMul(L.dir, L.c + L.a + 0.16)) });
      });
    });
    /* ── ELÉTRONS nos lobos do carbono e a LIGAÇÃO em curso ───────────
       Cada nuvem mostra quantos elétrons tem (pontos). Antes da mistura,
       a ocupação da etapa (2s² 2pₓ¹ 2p_y¹ 2p_z⁰ ou 2s¹ 2p³); misturada,
       um por orbital. Um híbrido que se liga cede o seu elétron para a
       nuvem σ (que fica com o par); os p puros, para a nuvem π. */
    var G = this._parceiroGeom(), L = this.lig, O = Q3.Orbitais, oc = O.ocupacao(this.etapa);
    var misturado = this._podeMisturar() && e >= 0.5;
    var corH = claro ? '#475569' : '#cbd5e1';
    // π só depois da σ
    var canalDe = function (orb) { if (!G || !L.ligada) return 0; for (var q = 0; q < G.ps.length; q++) if (G.ps[q].orb === orb) return G.pi.pis[q] || 0; return 0; };
    itens.forEach(function (it) {
      var n = misturado ? 1 : oc[it.orb];
      if (L.hs.indexOf(it.orb) >= 0) { it.alfa *= 0.18; n = 0; }
      if (G && L.alvo === it.orb && it.grande) { it.alfa *= (1 - 0.75 * G.S); if (G.S >= 0.5) n = 0; }
      var canal = canalDe(it.orb);
      if (canal > 0 && !it.entra) { it.alfa *= (1 - 0.6 * canal); if (canal >= 0.5) n = 0; }
      it.eletrons = it.grande ? n : 0;
    });
    var mais = [];
    if (G) {
      if (L.parceiro === 'H') {
        mais.push(self._item(G.pos, G.a, 0.62, 0.62, esc, { cor: corH, alfa: 1 - 0.75 * G.S, eletrons: G.S >= 0.5 ? 0 : 1, esfera: true }));
        var pH = proj(G.pos); mais.push({ nucleo: true, rotulo: 'H', depth: pH.depth - 0.001, x: pH.sx, y: pH.sy });
      } else {
        G.hibridos.forEach(function (v) {
          var encara = oDot(v, G.a) < -0.99, alfa = encara ? 1 - 0.75 * G.S : 1;
          mais.push(self._item(oAdd(G.pos, oMul(v, 0.9)), v, 0.8, 0.43, esc, { cor: cores.hib, alfa: alfa, eletrons: encara && G.S >= 0.5 ? 0 : 1 }));
          mais.push(self._item(oAdd(G.pos, oMul(v, -0.24)), v, 0.22, 0.18, esc, { cor: cores.hib, alfa: alfa, eletrons: 0 }));
        });
        G.ps.forEach(function (pp, i) {
          var canal = L.ligada ? G.pi.pis[i] || 0 : 0;
          [1, -1].forEach(function (sg, j) {
            var v = oMul(pp.dele, sg);
            mais.push(self._item(oAdd(G.pos, oMul(v, 0.62)), v, 0.52, 0.33, esc, { cor: cores[pp.orb], alfa: 1 - 0.6 * canal, eletrons: j === 0 && canal < 0.5 ? 1 : 0 }));
          });
        });
        var pC = proj(G.pos); mais.push({ nucleo: true, rotulo: 'C', depth: pC.depth - 0.001, x: pC.sx, y: pC.sy });
      }
      // σ: frontal, no eixo entre os núcleos
      if (G.S > 0.02) mais.push(self._item(oMul(G.a, G.d / 2), G.a, G.d / 2 + 0.42, 0.44, esc,
        { cor: orbMisturaCor(cores.hib, L.parceiro === 'H' ? corH : cores.hib, 0.35), alfa: G.S, eletrons: G.S >= 0.5 ? 2 : 0, sigma: true }));
      /* π como FITA QUE SE TORCE: em sete segmentos ao longo da ligação, a
         direção gira do p de um carbono ao p do outro. Paralelos, a fita é
         reta e forte; torcida, retorce e fica transparente — e rasga a 90°.
         Na tripla, um TUBO em volta do eixo, que não muda com o giro. */
      if (L.ligada && G.pi.cilindro && G.ps.length === 2 && G.pi.total > 0.04) {
        var canalC = G.pi.total / 2, meioC = oMul(G.a, G.d / 2);
        for (var q = 0; q < 8; q++) {
          var fi = q * Math.PI / 4, dirC = oAdd(oMul(G.ps[0].meu, Math.cos(fi)), oMul(G.ps[1].meu, Math.sin(fi)));
          mais.push(self._item(oAdd(meioC, oMul(dirC, 0.6)), G.a, G.d / 2 + 0.25, 0.24, esc,
            { cor: cores[q % 2 ? G.ps[1].orb : G.ps[0].orb], alfa: 0.5 * canalC, eletrons: q % 2 === 0 && canalC >= 0.5 ? 1 : 0, pi: true, rotuloPi: q === 0 }));
        }
      } else if (L.ligada) G.ps.forEach(function (pp, i) {
        var canal = G.pi.pis[i] || 0; if (canal < 0.02) return;
        var dele = oDot(pp.meu, pp.dele) < 0 ? oMul(pp.dele, -1) : pp.dele, n = 7, compSeg = G.d * 0.72 / n;
        for (var k = 0; k < n; k++) {
          var tt = 0.14 + 0.72 * (k + 0.5) / n, dk = oNorm(oSlerp(pp.meu, dele, tt)), centroSeg = oMul(G.a, G.d * tt);
          [1, -1].forEach(function (sg, j) {
            mais.push(self._item(oAdd(centroSeg, oMul(dk, 0.62 * sg)), G.a, compSeg * 0.62 + 0.07, 0.3, esc,
              // o par π ocupa as DUAS metades juntas: um ponto no meio de cada uma
              { cor: cores[pp.orb], alfa: 0.85 * canal, eletrons: k === 3 && canal >= 0.5 ? 1 : 0, pi: true, rotuloPi: k === 3 && j === 0 }));
          });
        }
      });
      var pc0 = proj([0, 0, 0]), pp0 = proj(G.pos);
      self._eixoTela = { cx: pc0.sx, cy: pc0.sy, px: pp0.sx, py: pp0.sy };
      // alcance de "pegar": o núcleo do parceiro e arredores — maior, cobria lobos do próprio carbono
      self._parceiroTela = { x: pp0.sx, y: pp0.sy, raio: Math.max(30, 0.45 * esc * cam.zoom * pp0.persp) };
    } else { this._parceiroTela = null; this._eixoTela = null; }
    // H já ligados: a nuvem σ fica, com o par
    if (this._misturaCompleta() && L.hs.length) {
      var mapaH = orbAtribuir(this.tipo, this.sel);
      L.hs.forEach(function (orb) {
        var v = oNorm(mapaH[orb]), pH2 = proj(oMul(v, 1.34));
        mais.push(self._item(oMul(v, 0.67), v, 1.07, 0.42, esc, { cor: orbMisturaCor(cores.hib, corH, 0.35), alfa: 1, eletrons: 2, sigma: true }));
        mais.push({ nucleo: true, rotulo: 'H', depth: pH2.depth - 0.001, x: pH2.sx, y: pH2.sy });
      });
    }
    mais.forEach(function (it) { it.extra = true; it.entra = true; itens.push(it); });

    var nucleo = proj([0, 0, 0]);
    itens.push({ nucleo: true, depth: nucleo.depth, x: nucleo.sx, y: nucleo.sy });
    itens.sort(function (a, b) { return b.depth - a.depth; });
    this._lobos = itens.filter(function (i) { return !i.nucleo && !i.extra; });

    /* ENQUADRAR O PAR LIGADO. O zoom da aproximação é uma estimativa; a forma na tela depende do ângulo de
       visão (e da perspectiva). Com a câmera parada, mede-se a caixa das nuvens de verdade: se alguma passa da
       moldura, o zoom recua o necessário. Uma vez por ligação formada e a cada mudança de tamanho da cena
       (girar o celular, abrir um card). Só recua — aproximar continua sendo escolha do aluno. */
    if (G && L.ligada && !cam.animando && (this._enquadrar || this._enqTam !== W + 'x' + H)) {
      this._enquadrar = false; this._enqTam = W + 'x' + H;
      var extX = 1, extY = 1;
      itens.forEach(function (it) {
        if (it.nucleo || !it.alfa || it.alfa < 0.05) return;
        var c = Math.cos(it.ang), s = Math.sin(it.ang), a2 = it.A, b2 = it.B;   // a nuvem inteira, até a ponta esmaecida
        extX = Math.max(extX, Math.abs(it.x - cx) + Math.sqrt(a2 * a2 * c * c + b2 * b2 * s * s));
        extY = Math.max(extY, Math.abs(it.y - cy) + Math.sqrt(a2 * a2 * s * s + b2 * b2 * c * c));
      });
      var fit = Math.min((M.w / 2 - 4) / extX, (M.h / 2 - 4) / extY);
      if (fit < 0.97) cam.animarPara({ zoom: Math.max(OrbitCamera.ZOOM_MIN, cam.zoom * fit) }, 350);
    }

    // pisca 4 vezes por segundo; com movimento reduzido, fica aceso sem piscar
    var pisca = !!this.piscar && (document.body.classList.contains('reduce-motion') || Math.floor(this.t * 8) % 2 === 0);
    var nucleosPorCima = [];
    itens.forEach(function (it) {
      if (it.nucleo && !it.depoisDasNuvens) { it.depoisDasNuvens = true; nucleosPorCima.push(it); return; }
      if (it.nucleo) {
        var rn = it.rotulo === 'H' ? 7 : 9;
        ctx.beginPath(); ctx.arc(it.x, it.y, rn, 0, Math.PI * 2);
        ctx.fillStyle = P.painel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.texto; ctx.stroke();
        ctx.fillStyle = P.texto; ctx.font = '700 ' + (it.rotulo === 'H' ? 10 : 11) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(it.rotulo || 'C', it.x, it.y + 0.5);
        return;
      }
      // a nuvem: gradiente radial numa elipse — borda difusa, sem contorno
      ctx.save();
      ctx.translate(it.x, it.y); ctx.rotate(it.ang); ctx.scale(it.A, it.B);
      var g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1), base = claro ? 0.92 : 0.82;
      g.addColorStop(0, orbRgba(it.cor, base * it.alfa));
      g.addColorStop(0.55, orbRgba(it.cor, base * 0.5 * it.alfa));
      g.addColorStop(1, orbRgba(it.cor, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // os elétrons da nuvem: um ponto cada, lado a lado (o s antes da mistura: ao lado do núcleo)
      if (it.eletrons) {
        ctx.save();
        ctx.fillStyle = claro ? '#0b1220' : '#ffffff';
        if (it.orb === 's' && !it.extra && e < 0.5) {
          for (var q2 = 0; q2 < it.eletrons; q2++) { ctx.beginPath(); ctx.arc(it.x + (q2 ? 15 : -15), it.y - 13, 3, 0, Math.PI * 2); ctx.fill(); }
        } else {
          ctx.translate(it.x, it.y); ctx.rotate(it.ang);
          var sep = Math.max(3.5, Math.min(it.B * 0.35, 6));
          for (var q3 = 0; q3 < it.eletrons; q3++) { ctx.beginPath(); ctx.arc(0, it.eletrons === 1 ? 0 : (q3 ? sep : -sep), 3, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.restore();
      }
      // contorno: tracejado nos p que ficaram de fora (os da ligação π),
      // e piscando no que acabou de sair da seleção
      var contorno = null;
      if (it.extra) contorno = null;
      else if (self.piscar && self.piscar.id === it.orb && pisca) contorno = { cor: P.texto, tra: [] };
      else if (self.etapa === 'fundamental' && it.orb === 'pz') contorno = { cor: P.suave, tra: [3, 4] };   // o 2p vazio
      else if (!it.entra && self.tipo !== 'sp3' && self._valida()) contorno = { cor: it.cor, tra: [5, 4] };
      else if (it.entra && it.orb !== 's' && self.tipo !== 'sp3' && !self._valida()) contorno = { cor: it.cor, tra: [] };
      if (contorno) {
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.ang);
        ctx.setLineDash(contorno.tra); ctx.lineWidth = 2; ctx.strokeStyle = contorno.cor;
        ctx.beginPath(); ctx.ellipse(0, 0, it.A, it.B, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    });

    // os núcleos por cima das nuvens: numa ligação, os dois precisam ficar à vista
    nucleosPorCima.forEach(function (it) {
      var rn = it.rotulo === 'H' ? 7 : 9;
      obst.push({ x0: it.x - rn - 1, y0: it.y - rn - 1, x1: it.x + rn + 1, y1: it.y + rn + 1 });
      ctx.beginPath(); ctx.arc(it.x, it.y, rn, 0, Math.PI * 2);
      ctx.fillStyle = P.painel; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = P.texto; ctx.stroke();
      ctx.fillStyle = P.texto; ctx.font = '700 ' + (it.rotulo === 'H' ? 10 : 11) + 'px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(it.rotulo || 'C', it.x, it.y + 0.5);
    });
    ctx.textBaseline = 'alphabetic';

    // o parceiro na mão: anel cheio; ao alcance: anel tracejado, convidando a pegar
    if (this._parceiroTela && G) {
      var pt2 = this._parceiroTela, corA = claro ? '#b45309' : '#fbbf24';
      ctx.save(); ctx.lineWidth = this._pega ? 2.5 : 1.5; ctx.strokeStyle = orbRgba(corA, this._pega ? 0.95 : 0.55);
      ctx.setLineDash(this._pega ? [] : [5, 5]); ctx.beginPath(); ctx.arc(pt2.x, pt2.y, 22, 0, Math.PI * 2); ctx.stroke();
      // seta curva: depois da σ, torça (só com carbono, e fora da mão)
      if (L.parceiro === 'C' && L.ligada && !this._pega && this._eixoTela) {
        var et2 = this._eixoTela, ang0 = Math.atan2(et2.py - et2.cy, et2.px - et2.cx) + Math.PI / 2;
        ctx.setLineDash([]); ctx.lineWidth = 2; ctx.strokeStyle = orbRgba(corA, 0.8);
        ctx.beginPath(); ctx.arc(pt2.x, pt2.y, 36, ang0 - 0.7, ang0 + 0.7); ctx.stroke();
        [ang0 - 0.7, ang0 + 0.7].forEach(function (aa, jj) {
          var ex2 = pt2.x + Math.cos(aa) * 36, ey2 = pt2.y + Math.sin(aa) * 36, tg = aa + (jj ? 1 : -1) * Math.PI / 2;
          ctx.beginPath(); ctx.moveTo(ex2, ey2); ctx.lineTo(ex2 - Math.cos(tg - 0.5) * 8, ey2 - Math.sin(tg - 0.5) * 8);
          ctx.moveTo(ex2, ey2); ctx.lineTo(ex2 - Math.cos(tg + 0.5) * 8, ey2 - Math.sin(tg + 0.5) * 8); ctx.stroke();
        });
      }
      ctx.restore();
    }

    /* rótulos σ e π sobre as nuvens de LIGAÇÃO, por cima de tudo: na dupla
       há muita nuvem perto dos núcleos, e o aluno precisa saber qual é qual */
    itens.forEach(function (it) {
      if (!(it.sigma || it.pi) || it.alfa < 0.45 || !it.eletrons || (it.pi && !it.rotuloPi)) return;
      /* ao longo do EIXO da nuvem, sobre ela e longe dos pontos dos elétrons
         (que ficam no centro): de lado, o σ caía sobre a metade da π */
      var ux = Math.cos(it.ang), uy = Math.sin(it.ang);
      ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      var w2 = ctx.measureText(it.pi ? 'π' : 'σ').width + 10;
      // numa cena pequena o selo caía sobre um núcleo: tenta outros pontos do eixo da nuvem, dos dois lados
      var tx = it.x - ux * it.A * 0.5, ty = it.y - uy * it.A * 0.5;
      // (e, se o eixo inteiro estiver tomado, para os lados da nuvem)
      var lado = it.B + 12;
      [[-0.5, 0], [0.5, 0], [-0.75, 0], [0.75, 0], [-0.3, 0], [0.3, 0], [0, 1], [0, -1]].some(function (k) {
        var x = it.x + ux * it.A * k[0] - uy * lado * k[1], y = it.y + uy * it.A * k[0] + ux * lado * k[1];
        var cx2 = { x0: x - w2 / 2, y0: y - 10, x1: x + w2 / 2, y1: y + 10 };
        if (obst.some(function (o) { return Q3.Moldura.cruza(cx2, o, 1); })) return false;
        tx = x; ty = y; return true;
      });
      ctx.fillStyle = orbRgba(P.painel, 0.85); ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(tx - w2 / 2, ty - 10, w2, 20, 5); else ctx.rect(tx - w2 / 2, ty - 10, w2, 20);
      ctx.fill();
      ctx.fillStyle = P.texto; ctx.fillText(it.pi ? 'π' : 'σ', tx, ty + 0.5);
      obst.push({ x0: tx - w2 / 2, y0: ty - 10, x1: tx + w2 / 2, y1: ty + 10 });
    });
    ctx.textBaseline = 'alphabetic';

    /* rótulos na ponta do lobo grande de cada orbital — até a ligação se formar. Com a σ formada, quem
       explica o desenho são os selos σ e π; os nomes dos lobos encavalavam com eles e com os eixos. */
    var comLigacao = !!(G && L.ligada);
    if (!comLigacao) this._lobos.filter(function (Lb) { return Lb.grande; }).forEach(function (Lb) {
      var nome = Lb.entra && self._valida() && e >= 0.5 ? self.hib.nome : (Lb.orb === 's' ? 's' : 'p');
      var sub = nome === 'p' ? Lb.orb.slice(1) : '';
      if (!Lb.entra && self._valida() && self.tipo !== 'sp3') nome = 'p';
      var cor = Lb.entra && self._valida() ? orbMisturaCor(cores[Lb.orb], cores.hib, e) : cores[Lb.orb];
      /* O s é uma esfera centrada até a mistura avançar: o rótulo fica
         colado ao núcleo, abaixo dele. Posto na direção do híbrido que o s
         vai virar, ele caía atrás de um lobo p e sumia. */
      var pt = Lb.ponta, f = paraFora(pt.sx, pt.sy);
      if (Lb.orb === 's' && nome === 's') { pt = { sx: nucleo.sx, sy: nucleo.sy + Math.max(20, Lb.B) + 12 }; f = { ux: 0, uy: 1 }; }
      var pi = !Lb.entra && self._valida() && self.tipo !== 'sp3';   // o p que fica de fora: dele sai a π
      ctx.font = '700 14px system-ui, sans-serif';
      var largura = ctx.measureText(nome).width + (sub ? 9 : 0);
      rotulos.push({ txt: nome, sub: sub, pi: pi, x: pt.sx, y: pt.sy + (pi ? 7 : 0), ux: f.ux, uy: f.uy, w: largura + 2, h: pi ? 30 : 17, cor: cor, prio: 1 });
    });

    // arco do ângulo entre dois híbridos, quando a mistura se completa
    if (this._valida() && e > 0.97 && !(G && G.S > 0.3)) {        // com a ligação formada, o arco do átomo isolado só polui
      var dirs = orbDirecoes(this.tipo, this.sel);
      var d0 = dirs[0], d1 = dirs[1], pontos = [], perp = null;
      if (oDot(d0, d1) < -0.999) perp = oNorm(oCross(d0, Math.abs(d0[1]) < 0.9 ? [0, 1, 0] : [0, 0, 1]));
      for (var i = 0; i <= 24; i++) {
        var k = i / 24;
        var v = perp ? oAdd(oMul(d0, Math.cos(Math.PI * k)), oMul(perp, Math.sin(Math.PI * k))) : oSlerp(d0, d1, k);
        pontos.push(proj(oMul(v, 0.46)));
      }
      ctx.save(); ctx.strokeStyle = P.texto; ctx.lineWidth = 2; ctx.setLineDash([2, 3]);
      ctx.beginPath(); pontos.forEach(function (q, j) { j ? ctx.lineTo(q.sx, q.sy) : ctx.moveTo(q.sx, q.sy); }); ctx.stroke();
      ctx.restore();
      var meio = pontos[12];
      var rot = fmt(this.hib.angulo, 1).replace('.', ',') + '°';
      ctx.font = '700 13px system-ui, sans-serif';
      var w = ctx.measureText(rot).width + 12;
      ctx.fillStyle = P.painel; ctx.fillRect(meio.sx - w / 2, meio.sy - 11, w, 22);
      ctx.fillStyle = P.texto; ctx.fillText(rot, meio.sx, meio.sy + 0.5);
      obst.push({ x0: meio.sx - w / 2, y0: meio.sy - 11, x1: meio.sx + w / 2, y1: meio.sy + 11 });
    }

    /* os rótulos do desenho, por último e por cima: primeiro os dos orbitais, depois as letras dos eixos;
       cada um desvia dos núcleos, dos selos σ/π, do ângulo, da pílula, do zoom e dos já postos */
    rotulos.sort(function (a, b) { return a.prio - b.prio; });
    var lugares = Q3.Moldura.posicionar(rotulos, obst, W, H);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    rotulos.forEach(function (r, i) {
      var q = lugares[i], y = r.pi ? q.y - 7 : q.y;
      ctx.fillStyle = r.cor;
      ctx.font = r.fonte || '700 14px system-ui, sans-serif';
      if (r.sub) {
        ctx.fillText(r.txt, q.x - 4, y);
        ctx.font = '700 10px system-ui, sans-serif'; ctx.fillText(r.sub, q.x + 5, y + 5);
      } else ctx.fillText(r.txt, q.x, y);
      if (r.pi) { ctx.font = '600 11px system-ui, sans-serif'; ctx.fillText('π', q.x, y + 15); }
    });
    ctx.textBaseline = 'alphabetic';

    // o diagrama de energia mora no painel Resultados: desenhado lá, a cada quadro, se o painel estiver à vista
    this._desenharPainelDiagrama();
  }

  /* Uma nuvem qualquer do espaço: elipse ao longo de dir, centrada em centro. */
  _item(centro, dir, a, b, esc, extra) {
    var cam = this.cam, p = cam.project(centro[0], centro[1], centro[2], this._cx, this._cy, esc), r = cam.girar(dir[0], dir[1], dir[2]);
    var f = Math.min(1, Math.hypot(r[0], r[1])), kk = esc * cam.zoom * p.persp;
    var Aeixo = Math.sqrt(Math.pow(a * f, 2) + Math.pow(b * Math.sqrt(Math.max(0, 1 - f * f)), 2)) * kk;
    var it = { x: p.sx, y: p.sy, A: Math.max(2, Aeixo), B: Math.max(2, b * kk), ang: f > 1e-3 ? Math.atan2(-r[1], r[0]) : 0, depth: p.depth };
    for (var k in extra) it[k] = extra[k];
    return it;
  }

  /* ── DIAGRAMA DE ENERGIA: as caixinhas dos orbitais de valência ───
     Mora no painel Resultados, num canvas próprio (#hib-diagrama), e não
     mais num canto da cena. Colunas fixas (2s, 2pₓ, 2p_y, 2p_z); só a
     ALTURA muda: na mistura, o s e os p que entram convergem para o nível
     do híbrido, e os p de fora ficam onde estão. Setas de spin nas caixas.
     No estado fundamental, o elétron de baixo do par do 2s se arrasta até
     o 2p vazio (ou um toque no 2s promove). O balanço da promoção está nas
     linhas dos Resultados. */
  _desenharPainelDiagrama() {
    var cv = this._cvDiag || (this._cvDiag = document.getElementById('hib-diagrama'));
    if (!cv || !this.ativo) return;
    var w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;                                  // painel fechado (trilho recolhido, gaveta fechada): nada a desenhar
    var dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    var P = Q3.Desenho.paleta();
    this._desenharDiagrama(ctx, w, h, P, ORB_CORES[P.claro ? 'claro' : 'escuro'], oSuave(this.mistura));
    // o leitor de tela lê o estado do diagrama (o canvas é role="img")
    var rotulo = this.etapa === 'fundamental'
      ? 'Diagrama de energia, estado fundamental 2s² 2p²: o 2s com um par e o 2p z vazio. Arraste o elétron de baixo do 2s para o 2p vazio, ou toque no 2s.'
      : this._podeMisturar() && this.mistura >= 0.5 ? 'Diagrama de energia: orbitais ' + this.hib.nome + ' no mesmo nível, um elétron em cada.'
      : 'Diagrama de energia, promovido 2s¹ 2p³: um elétron em cada orbital.';
    if (cv.getAttribute('aria-label') !== rotulo) cv.setAttribute('aria-label', rotulo);
  }
  _desenharDiagrama(ctx, w, h, P, cores, e) {
    var O = Q3.Orbitais, self = this;
    var cw = 30, ch = 24, passo = Math.max(40, Math.min(64, (w - 70 - cw) / 3));
    var grupo = 3 * passo + cw, xc = Math.max(46, (w - grupo) / 2 + 14);
    var k = this._podeMisturar() ? e : 0, niv = O.niveis(this.tipo, this.sel, k);
    var yDe = function (E) { return h - 40 - E * (h - 40 - 36); };
    ctx.save();
    // eixo de energia
    var ex = 18; ctx.strokeStyle = P.suave; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(ex, yDe(0) + 16); ctx.lineTo(ex, yDe(1) - 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ex - 4, yDe(1) - 8); ctx.lineTo(ex, yDe(1) - 15); ctx.lineTo(ex + 4, yDe(1) - 8); ctx.stroke();
    ctx.fillStyle = P.suave; ctx.font = 'italic 600 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('E', ex, yDe(1) - 20);
    // caixas
    var oc = O.ocupacao(this.etapa), misturado = this._podeMisturar() && e >= 0.5, caixas = {};
    ['s', 'px', 'py', 'pz'].forEach(function (orb, i) {
      var x = xc + i * passo, y = yDe(niv[orb]) - ch / 2, entra = orb === 's' || self.sel.indexOf(orb) >= 0;
      caixas[orb] = { x: x, y: y, w: cw, h: ch };
      var cor = entra && self._podeMisturar() ? orbMisturaCor(cores[orb], cores.hib, e) : cores[orb];
      ctx.fillStyle = orbRgba(cor, 0.16); ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = cor; ctx.lineWidth = 1.6; ctx.setLineDash(self.etapa === 'fundamental' && orb === 'pz' ? [3, 3] : []); ctx.strokeRect(x, y, cw, ch); ctx.setLineDash([]);
      var nome = misturado && entra ? self.hib.nome : (orb === 's' ? '2s' : '2p');
      ctx.fillStyle = cor; ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(nome, x + cw / 2, y + ch + 13);
      if (nome === '2p') { ctx.font = '700 8px system-ui, sans-serif'; ctx.fillText(orb.slice(1), x + cw / 2 + 9, y + ch + 16); }
      // setas de spin
      var n = misturado ? 1 : oc[orb];
      if (self._arrasto && orb === 's') n = 1;                         // o de baixo está na mão do aluno
      if (self._animPromo && self.t - self._animPromo.t0 < self._animPromo.dur && orb === 'pz') n = 0;
      ctx.fillStyle = P.texto; ctx.font = '700 15px system-ui, sans-serif'; ctx.textBaseline = 'middle';
      if (n === 2) { ctx.fillText('↑', x + cw / 2 - 5, y + ch / 2); ctx.fillText('↓', x + cw / 2 + 5, y + ch / 2); }
      else if (n === 1) ctx.fillText('↑', x + cw / 2, y + ch / 2);
      ctx.textBaseline = 'alphabetic';
    });
    // o elétron em trânsito: na mão do aluno, ou voando do 2s ao 2p_z
    var voo = null;
    if (this._arrasto) voo = { x: this._arrasto.x, y: this._arrasto.y };
    else if (this._animPromo && this.t - this._animPromo.t0 < this._animPromo.dur) {
      var tt = oSuave((this.t - this._animPromo.t0) / this._animPromo.dur), a0 = caixas.s, a1 = caixas.pz;
      voo = { x: oLerp(a0.x + cw / 2, a1.x + cw / 2, tt), y: oLerp(a0.y + ch / 2, a1.y + ch / 2, tt) - Math.sin(tt * Math.PI) * 26 };
    }
    if (voo) { ctx.fillStyle = cores.hib; ctx.font = '700 17px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('↑', voo.x, voo.y); ctx.textBaseline = 'alphabetic'; }
    ctx.restore();
    this._diag = { caixas: caixas };
  }

  /* O toque e o arrasto no diagrama do painel: o elétron de baixo do 2s vai até o 2p vazio. Um toque no
     2s (ou no 2p vazio) também promove; Enter ou Espaço com o diagrama em foco, idem. O botão Promover
     elétron, no painel Orbitais do Carbono, continua sendo o caminho sem arrastar. */
  _ligarDiagramaLateral() {
    var cv = document.getElementById('hib-diagrama'), self = this;
    if (!cv) return;
    var local = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    var naCaixa = function (q, orb, folga) { var c = self._diag && self._diag.caixas[orb]; return !!c && q.x >= c.x - folga && q.x <= c.x + c.w + folga && q.y >= c.y - folga && q.y <= c.y + c.h + folga; };
    cv.addEventListener('pointerdown', function (e) {
      if (!self.ativo || self.etapa !== 'fundamental') return;
      var q = local(e);
      if (naCaixa(q, 's', 10)) {
        self._arrasto = { x: q.x, y: q.y, moveu: false, id: e.pointerId };
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* segue */ }
        e.preventDefault();
      } else if (naCaixa(q, 'pz', 10)) self.promover();
    });
    cv.addEventListener('pointermove', function (e) {
      var a = self._arrasto, q = local(e);
      if (a && e.pointerId === a.id) { if (Math.hypot(q.x - a.x, q.y - a.y) > 4) a.moveu = true; a.x = q.x; a.y = q.y; return; }
      if (self.ativo && !e.buttons) cv.style.cursor = self.etapa === 'fundamental' && (naCaixa(q, 's', 10) || naCaixa(q, 'pz', 10)) ? 'grab' : '';
    });
    var fim = function (e) {
      var a = self._arrasto; if (!a || e.pointerId !== a.id) return;
      self._arrasto = null;
      try { cv.releasePointerCapture(e.pointerId); } catch (err) { /* já solto */ }
      if (e.type === 'pointercancel') return;
      if (!a.moveu) { self.promover(); return; }          // toque no 2s: promove
      if (naCaixa(local(e), 'pz', 14)) self.promover();
      else announce('O elétron voltou para o 2s. Solte-o na caixa vazia do 2p.');
    };
    cv.addEventListener('pointerup', fim);
    cv.addEventListener('pointercancel', fim);
    cv.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && self.ativo && self.etapa === 'fundamental') { e.preventDefault(); self.promover(); }
    });
  }

  /* ── CURVA DA ENERGIA AO GIRAR a ligação C–C, no painel Resultados (#result-chart, que a app redesenha
     a cada atualização dos Resultados). O ponto sobe a colina enquanto o aluno torce. Dupla: sen²θ,
     270 kJ/mol a 90°. Simples: três degraus de 12. Tripla: reta — o cilindro. Fora da C–C formada,
     devolve false e a app esconde o gráfico. */
  graficoResultado(ctx, w, h) {
    var L = this.lig, G = this._parceiroGeom();
    if (!this.ativo || !G || L.parceiro !== 'C' || !L.ligada) return false;
    var P = Q3.Desenho.paleta(), O = Q3.Orbitais, tipo = this.tipo, cores = ORB_CORES[P.claro ? 'claro' : 'escuro'];
    var emax = tipo === 'sp2' ? O.BARREIRA.sp2 : tipo === 'sp3' ? O.BARREIRA.sp3 : 1, cor = tipo === 'sp2' ? cores.pz : cores.hib;
    var x0 = 36, x1 = w - 14, y0 = 32, y1 = h - 24, gw = x1 - x0, gh = y1 - y0;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.fillStyle = P.texto; ctx.font = '600 11.5px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('Energia ao girar a ligação', 10, 18);
    ctx.fillStyle = P.suave; ctx.font = '500 10px system-ui, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText('kJ/mol', x1, 18);
    if (tipo !== 'sp') ctx.fillText(String(emax), x0 - 6, y0 + 4);
    ctx.fillText('0', x0 - 6, y1 + 3);
    ctx.strokeStyle = orbRgba(P.suave, 0.45); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
    if (tipo !== 'sp') { ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.stroke(); ctx.setLineDash([]); }
    ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.beginPath();
    for (var i = 0; i <= 90; i++) {
      var g = i * 2, en = tipo === 'sp' ? 0 : O.energiaGiro(tipo, g * Math.PI / 180) / emax;
      var x = x0 + gw * g / 180, y = y1 - en * gh;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.stroke();
    var ga = this.giroLig, ea = tipo === 'sp' ? 0 : O.energiaGiro(tipo, ga * Math.PI / 180) / emax;
    ctx.fillStyle = P.claro ? '#b45309' : '#fbbf24'; ctx.beginPath(); ctx.arc(x0 + gw * ga / 180, y1 - ea * gh, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.suave; ctx.textAlign = 'center'; ctx.font = '500 10px system-ui, sans-serif';
    [0, 90, 180].forEach(function (g2) { ctx.fillText(g2 + '°', x0 + gw * g2 / 180, y1 + 15); });
    ctx.restore();
    return true;
  }

  /* O PRÓXIMO PASSO, no alto do painel Resultados (antes era a dica escrita no pé da cena). */
  proximoPasso() {
    var n = ORB_ESCOLHAS[this.tipo], L = this.lig;
    if (this.etapa === 'fundamental') return 'Arraste o elétron do 2s para o 2p vazio no diagrama abaixo, ou toque em Promover elétron.';
    if (this._misturaCompleta() && L.parceiro) {
      if (!L.alvo) return L.hs.length ? 'Toque noutro híbrido, na cena, para ligar mais um H.' : 'Toque num híbrido, na cena, para mirar a ligação.';
      if (!L.ligada) return 'Arraste o ' + (L.parceiro === 'H' ? 'hidrogênio' : 'carbono') + ' até o carbono. Solto perto, ele é capturado.';
      if (L.parceiro === 'C') return this.tipo === 'sp2' ? 'Arraste o carbono de lado para torcer. Solte e veja a π puxar de volta.' : 'Dê um peteleco de lado: ' + (this.tipo === 'sp' ? 'a tripla gira sem resistência.' : 'a simples gira quase livre.');
      return 'Puxe para esticar a ligação. Solte e ela vibra de volta.';
    }
    if (this._misturaCompleta()) return 'Mistura completa. Escolha um parceiro no painel Ligações σ e π.';
    if (!this._valida()) return 'Toque em ' + (n - this.sel.length) + ' orbita' + (n - this.sel.length > 1 ? 'is' : 'l') + ' p, na cena, para misturar com o s.';
    if (this.mistura < 0.01) return 'Deslize a mistura no painel Orbitais do Carbono.';
    if (this.mistura < 0.999) return 'Mistura em ' + Math.round(this.mistura * 100) + '%. Continue deslizando.';
    return 'Gire a câmera e confira o ângulo de qualquer lado.';
  }

  /* ── elétrons: promoção ─────────────────────────────────────── */

  promover() {
    if (this.etapa === 'promovido') { announce('O elétron já foi promovido: 2s¹ 2p³.'); return false; }
    this.etapa = 'promovido';
    this._animPromo = { t0: this.t, dur: 0.6 };
    playTone(760, .09, .05);
    var b = Q3.Orbitais.balancoPromocao();
    announce('Elétron promovido do 2s para o 2p z: 2s¹ 2p³, quatro elétrons desemparelhados. A promoção custa cerca de ' + b.custo +
      ' quilojoules por mol; as duas ligações C–H a mais que ela permite devolvem cerca de ' + b.ganho + '. Mas o s e os p ainda são diferentes: agora misture.');
    this._sincronizarPainel();
    return true;
  }

  estadoFundamental() {
    this.etapa = 'fundamental'; this._animPromo = null;
    this._zerarMistura();
    announce('Estado fundamental: 2s² 2p². O 2s tem um par e só dois 2p têm um elétron cada: o carbono faria duas ligações, a 90°. O metano tem quatro.');
    return true;
  }

  /* o parceiro está sob o ponteiro? (núcleo e arredores, na tela) */
  _parceiroAgarravel(x, y) {
    var t = this._parceiroTela;
    return !!(this.ativo && t && this.lig.alvo && Math.hypot(x - t.x, y - t.y) <= t.raio);
  }

  _ligarArrasto() {
    var cv = document.getElementById('sim-canvas'), self = this;
    if (!cv) return;
    var local = function (e) { var r = cv.getBoundingClientRect(); return { x: e.clientX - r.left - (cv.cenaX || 0), y: e.clientY - r.top }; }   // na cena (a área livre do card flutuante);
    cv.addEventListener('pointerdown', function (e) {
      var q = local(e);
      /* PEGAR O PARCEIRO. O gesto se decompõe no eixo da ligação COMO
         APARECE NA TELA: ao longo dele, aproxima ou afasta; de lado, torce
         (≈ 55 px por radiano). A física segue a mão, com a resistência da
         ligação: na dupla, o parceiro fica para trás da mão. */
      if (self._parceiroAgarravel(q.x, q.y)) {
        var L = self.lig, et = self._eixoTela;
        var comp = et ? Math.hypot(et.px - et.cx, et.py - et.cy) : 0;
        self._pega = { id: e.pointerId, x0: q.x, y0: q.y, r0: L.r, th0: L.th, moveu: false,
          u: comp > 24 ? [(et.px - et.cx) / comp, (et.py - et.cy) / comp] : [1, 0],
          pxU: comp > 24 ? comp / Math.max(0.5, L.r) : (self._esc || 200) * self.cam.zoom, tAnt: self.t, thAnt: L.th, wEst: 0 };
        L.segura = 'ponteiro'; L.mao = { r: L.r, th: L.th };
        cv.style.cursor = 'grabbing';
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* segue */ }
      }
    });
    cv.addEventListener('pointermove', function (e) {
      var q = local(e), pg = self._pega;
      if (pg && e.pointerId === pg.id) {
        var dx = q.x - pg.x0, dy = q.y - pg.y0;
        if (Math.hypot(dx, dy) > 4) pg.moveu = true;
        var ao = dx * pg.u[0] + dy * pg.u[1], lado = -dx * pg.u[1] + dy * pg.u[0];
        var th = pg.th0 + (self.lig.parceiro === 'C' ? lado / 55 : 0);
        self.lig.mao = { r: pg.r0 + ao / pg.pxU, th: th };
        var dtp = Math.max(1e-3, self.t - pg.tAnt);
        pg.wEst = pg.wEst * 0.6 + 0.4 * (th - pg.thAnt) / dtp; pg.tAnt = self.t; pg.thAnt = th;
        return;
      }
      // sem arrasto: a mão aberta sobre o que se pode pegar
      if (self.ativo && !e.buttons) cv.style.cursor = self._parceiroAgarravel(q.x, q.y) ? 'grab' : '';
    });
    var soltarParceiro = function (e) {
      var pg = self._pega; if (!pg || e.pointerId !== pg.id) return false;
      self._pega = null; self.lig.segura = null;
      if (pg.moveu) {
        self._engolirClique = true;
        // o impulso do gesto vira velocidade angular: é o peteleco da simples
        if (self.lig.parceiro === 'C') self.lig.w = Math.max(-12, Math.min(12, pg.wEst));
      }
      cv.style.cursor = 'grab';
      try { cv.releasePointerCapture(e.pointerId); } catch (err) { /* já solto */ }
      return true;
    };
    cv.addEventListener('pointerup', soltarParceiro);
    cv.addEventListener('pointercancel', soltarParceiro);
  }

  /* ── ligações σ e π ────────────────────────────────────────── */

  definirParceiro(v) {
    if (!this._misturaCompleta()) {
      this.lig.parceiro = null; this._sincronizarPainel();
      return { say: 'Complete a mistura antes de ligar: a ligação se forma com os híbridos prontos.' };
    }
    this.lig = { parceiro: v, alvo: null, aprox: 0, giro: 0, hs: [] }; this._marcosLig = {};
    this._sincronizarPainel();
    return { say: (v === 'H' ? 'Parceiro: hidrogênio, com o seu orbital 1s.' : 'Parceiro: outro carbono ' + this.hib.nome + ', com os seus híbridos' + (this.tipo === 'sp3' ? '.' : ' e ' + (this.tipo === 'sp2' ? 'o seu p puro.' : 'os seus dois p puros.'))) +
      ' Toque num híbrido para mirar a ligação.' };
  }

  mirar(orb) {
    if (this.lig.hs.indexOf(orb) >= 0) { announce('Esse híbrido já está ligado a um hidrogênio. Mire outro.'); return false; }
    // um H que já chegou (σ formada) fica ligado ao mirar o próximo — o aluno rápido não o perde
    if (this.lig.parceiro === 'H' && this.lig.alvo && this.lig.ligada) {
      var ja = this.lig.alvo;
      this.lig.hs.push(ja); this.lig.alvo = null; this.lig.ligada = false; this.lig.segura = null;
      if (ja === orb) {                                   // tocou no mesmo híbrido: só confirma
        var n = this.lig.hs.length, tot = ORB_MISTURAM[this.tipo] + 1;
        announce('Ligação sigma ' + this.hib.nome + '–1s confirmada: ' + n + ' de ' + tot + ' híbridos ligados a hidrogênio.');
        this._sincronizarPainel();
        return true;
      }
    }
    if (this.lig.parceiro === 'C' && this.lig.alvo && this.lig.r < this._distancias().longe - 0.1) { announce('O carbono parceiro já está a caminho. Solte-o para mirar outro híbrido.'); return false; }
    var dl = this._distancias();
    this.lig.alvo = orb; this.lig.r = dl.longe; this.lig.vr = 0; this.lig.th = 0; this.lig.w = 0;
    this.lig.segura = null; this.lig.ligada = false; this.lig.assentou = 0; this._marcosLig = {};
    var g = this._parceiroGeom();
    if (g) {
      /* Enquadra os DOIS átomos pelo tamanho real da tela: o parceiro nasce
         a 4,6 unidades, e com zoom fixo ele caía fora da imagem (e o que
         não se vê não se pega). Centro no meio do caminho; zoom para caber. */
      var Mo = this._moldura(this._W || 900, this._H || 700), M = Math.min(Mo.w, Mo.h), escT = Mo.esc;
      var zoomFit = Math.max(0.3, Math.min(0.8, (M / 2 - 34) / ((g.dLonge / 2 + 1.35) * escT)));
      var destino = { alvo: oMul(g.a, g.dLonge / 2), zoom: zoomFit };
      /* Com p puros (dupla, tripla), olhar PERPENDICULAR à ligação e ao eixo
         dos p: a σ aparece de lado e as duas metades da π, em cima e
         embaixo. De viés, a π era vista de ponta, sobreposta à σ. A direção
         de visão é a × p; a câmera olha ao longo do terceiro eixo dela. */
      if (g.ps.length) {
        var nv = oNorm(oCross(g.a, g.ps[0].meu));
        destino.pitch = Math.max(-1.4, Math.min(1.4, Math.asin(Math.max(-1, Math.min(1, nv[1])))));
        destino.yaw = Math.atan2(-nv[0], nv[2]);
      }
      this.cam.animarPara(destino, 600);
    }
    playTone(640, .05, .04);
    announce('Mirando um híbrido ' + this.hib.nome + '. Arraste o ' + (this.lig.parceiro === 'H' ? 'hidrogênio' : 'carbono') + ' na tela até o carbono — ou deslize Aproximar.');
    this._sincronizarPainel();
    return true;
  }

  /* Os controles deslizantes são uma MÃO que segura: o parceiro vai até
     a posição pedida pela física (não salta), e fica ali enquanto o
     controle segurar. O arrasto na tela solta essa mão. */
  definirAproximacao(v) {
    var L = this.lig;
    if (!L.parceiro || !L.alvo) { this._sincronizarPainel(); return { say: L.parceiro ? 'Toque num híbrido para mirar antes de aproximar.' : 'Escolha um parceiro primeiro.' }; }
    var dl = this._distancias();
    L.segura = 'controle'; L.mao = { r: dl.longe - Math.max(0, Math.min(1, v)) * (dl.longe - dl.lig), th: L.mao && L.segura === 'controle' ? L.mao.th : L.th };
    return {};
  }


  definirGiro(graus) {
    var L = this.lig;
    if (L.parceiro !== 'C' || !L.alvo) { this._sincronizarPainel(); return {}; }
    L.segura = 'controle'; L.mao = { r: L.mao && L.segura === 'controle' ? L.mao.r : L.r, th: Math.max(0, Math.min(180, +graus)) * Math.PI / 180 };
    return {};
  }


  soltar() { var tinha = !!this.lig.parceiro; this._soltar(false); if (tinha) announce('Parceiro solto: o carbono está sozinho de novo.'); return tinha; }
  _soltar(silencioso) {
    var tinha = !!(this.lig.parceiro && (this.lig.alvo || this.lig.hs.length));
    this.lig = this._ligVazia(silencioso ? null : this.lig.parceiro);
    this._marcosLig = {}; this._pega = null;
    if (tinha && this.cam) this.cam.animarPara({ alvo: [0, 0, 0], zoom: 1 }, 450);
    if (!silencioso) this._sincronizarPainel();
  }
  /* Estado físico do parceiro: r e vr ao longo do eixo; th e w em torno
     dele. segura: quem segura ('ponteiro', 'controle' ou ninguém); mao:
     a posição que a mão pede. ligada: a σ se formou (o parceiro assentou
     no poço). hs: híbridos já ligados a um H. */
  _ligVazia(parceiro) { return { parceiro: parceiro, alvo: null, r: 4.6, vr: 0, th: 0, w: 0, segura: null, mao: null, ligada: false, assentou: 0, hs: [] }; }
  _distancias() {
    var O = Q3.Orbitais, ehH = this.lig.parceiro === 'H';
    return { lig: ehH ? 1.34 : 1.9 * O.COMPRIMENTO_CC[this.tipo] / 1.54, longe: 4.6, De: ehH ? O.FIS.De.H : O.FIS.De.C };
  }
  get aproxLig() { var dl = this._distancias(); return Math.max(0, Math.min(1, (dl.longe - this.lig.r) / (dl.longe - dl.lig))); }
  get giroLig() { var g = ((this.lig.th * 180 / Math.PI) % 180 + 180) % 180; return g; }


  /* Geometria do parceiro mirado: eixo, distância, sobreposições, e as
     direções dos orbitais dele (refletidas no plano perpendicular ao
     eixo e giradas θ em torno dele; na sp³, alternado em θ = 0). */
  _parceiroGeom() {
    var L = this.lig;
    if (!L.parceiro || !L.alvo || !this._misturaCompleta()) return null;
    var O = Q3.Orbitais, mapa = orbAtribuir(this.tipo, this.sel), a = oNorm(mapa[L.alvo]);
    var dl = this._distancias(), dLig = dl.lig, dLonge = dl.longe;
    var d = L.r, S = O.sobreposicaoSigma(d, dLig, dLonge);
    var th = L.th, out = { a: a, d: d, dLig: dLig, dLonge: dLonge, S: S, th: th, pos: oMul(a, d), hibridos: [], ps: [], pi: { pis: [], total: 0 } };
    if (L.parceiro === 'C') {
      var giroTotal = th + (this.tipo === 'sp3' ? Math.PI / 3 : 0);
      var rot = function (v) { var k = a, co = Math.cos(giroTotal), si = Math.sin(giroTotal); return oAdd(oAdd(oMul(v, co), oMul(oCross(k, v), si)), oMul(k, oDot(k, v) * (1 - co))); };
      orbDirecoes(this.tipo, this.sel).forEach(function (v) { out.hibridos.push(rot(oAdd(v, oMul(a, -2 * oDot(v, a))))); });
      var self = this;
      ORB_P.filter(function (p) { return self.sel.indexOf(p) < 0; }).forEach(function (p) { out.ps.push({ orb: p, meu: ORB_EIXO[p], dele: rot(ORB_EIXO[p]) }); });
      out.pi = O.sobreposicaoPi(this.tipo, d, dLig, dLonge, th);
    }
    return out;
  }

  /* ── resultados: só o que decorre das escolhas ─────────────── */

  resultados() {
    var h = this.hib, sel = this.sel.slice().sort(), valida = this._valida();
    var puros = ORB_P.filter(function (p) { return sel.indexOf(p) < 0; });
    var nomes = function (l) { return l.map(function (p) { return ORB_TEXTO[p]; }).join(' + '); };
    var n = ORB_MISTURAM[this.tipo] + 1;
    var O = Q3.Orbitais, G = this._parceiroGeom(), L = this.lig;
    /* com um parceiro mirado, os números da LIGAÇÃO vêm primeiro (eram os medidores do canto da cena):
       é para eles que o aluno olha enquanto aproxima e torce */
    var linhas = [];
    if (G) {
      var compr = L.parceiro === 'H' ? O.COMPRIMENTO_CH : O.COMPRIMENTO_CC[this.tipo];
      linhas.push({ l: 'Sobreposição σ', v: Math.round(G.S * 100) + '%' });
      if (L.parceiro === 'C' && G.ps.length) linhas.push({ l: 'Sobreposição π', v: Math.round(G.pi.total / G.ps.length * 100) + '%' + (G.pi.cilindro ? ' (cilindro)' : '') });
      linhas.push({ l: 'Distância ' + (L.parceiro === 'H' ? 'C–H' : 'C–C'), v: fmt(G.d * compr / G.dLig, 2).replace('.', ',') + ' Å' + (G.S >= 0.999 ? ' · de ligação' : '') });
      if (L.parceiro === 'C') {
        var giro = Math.round(this.giroLig);
        linhas.push({ l: 'Energia para girar', v: Math.round(O.energiaGiro(this.tipo, G.th)) + ' kJ/mol a ' + giro + '°' });
        if (L.ligada) linhas.push(this.tipo === 'sp2'
          ? { l: 'Ligação π', v: Math.abs(giro - 90) < 6 ? 'rompida' : 'resiste ao giro', cls: Math.abs(giro - 90) < 6 ? 'val-warn' : '' }
          : { l: 'Giro', v: this.tipo === 'sp' ? 'livre: a π é um cilindro' : 'quase livre' });
      }
    }
    if (L.hs.length) linhas.push({ l: 'Ligações σ com H', v: L.hs.length + ' de ' + n });
    linhas.push(
      { l: 'Configuração de valência', v: this._misturaCompleta() ? (n + ' × ' + h.nome + (n < 4 ? ' + ' + (4 - n) + ' p' : '') + ', 1 elétron cada') : O.configuracao(this.etapa) },
      { l: 'Elétrons desemparelhados', v: String(O.desemparelhados(this.etapa)), cls: this.etapa === 'fundamental' ? 'val-warn' : '' }
    );
    // o balanço da promoção (antes escrito no pé do diagrama, na cena)
    if (this.etapa === 'promovido') {
      linhas.push({ l: 'Custo da promoção', v: '+' + O.CUSTO_PROMOCAO + ' kJ/mol' });
      linhas.push({ l: '2 ligações C–H a mais', v: '−' + (2 * O.LIGACAO_CH) + ' kJ/mol', cls: 'val-ok' });
    }
    return linhas.concat([
      { l: 'Orbitais que se misturam', v: valida ? 's + ' + nomes(sel) : 'escolha ' + (ORB_MISTURAM[this.tipo] - sel.length) + ' p', cls: valida ? '' : 'val-warn' },
      { l: 'Híbridos formados', v: n + ' orbitais ' + h.nome },
      { l: 'Orbitais p puros', v: valida ? (puros.length ? nomes(puros) : 'nenhum') : '—' },
      { l: 'Ligações pi possíveis', v: String(3 - ORB_MISTURAM[this.tipo]), cls: 3 - ORB_MISTURAM[this.tipo] ? 'val-alt' : '' },
      { l: 'Ângulo entre híbridos', v: fmt(h.angulo, 1) + '°' },
      { l: 'Geometria', v: h.geometria },
      { l: 'Caráter s de cada híbrido', v: Math.round(100 / n) + '%' },
      { l: 'Exemplo', v: h.exemplo }
    ]);
  }

  overlay() {
    if (this.etapa === 'fundamental') return 'Hibridização ' + this.hib.nome + ' · estado fundamental';
    if (this.lig.parceiro && (this.lig.alvo || this.lig.hs.length)) return this.hib.nome + ' · ligando com ' + (this.lig.parceiro === 'H' ? 'H' : 'C');
    return 'Hibridização ' + this.hib.nome + ' · mistura ' + Math.round(this.mistura * 100) + '%';
  }
}
