/* ═══════════════════════════════════════════════════════════════
   CAMADA: NÚCLEO
   ARQUIVO: js/core/orbitais-modelo.js
   ───────────────────────────────────────────────────────────────
   O MODELO DO MÓDULO 2 — elétrons, energia e sobreposição.
   Funções puras (sem desenho), para o módulo e para os testes.

   1. POR QUE HIBRIDIZAR (elétrons e energia)
      Estado fundamental do carbono: 1s² 2s² 2p². Na camada de valência,
      o 2s tem um par e só DOIS 2p têm um elétron cada (regra de Hund) —
      o carbono faria duas ligações, a 90°. O metano tem quatro, iguais,
      a 109,5°. Promovendo um elétron do 2s para o 2p vazio (2s¹ 2p³),
      ficam quatro desemparelhados — mas ainda diferentes (um s e três p).
      A mistura os torna iguais.
      Energias em unidades relativas: 2s = 0, 2p = 1. O híbrido fica na
      média ponderada — sp³ em 3/4, sp² em 2/3, sp em 1/2 —, e durante a
      mistura os níveis do s e dos p que entram convergem para lá.
      Custo da promoção ≈ 400 kJ/mol; cada ligação C–H devolve ≈ 413
      kJ/mol, e a promoção permite DUAS a mais: compensa (valores típicos
      de livro-texto; a promoção "pura" é uma etapa do raciocínio, não um
      processo que se mede isolado).

   2. FORMAR LIGAÇÕES (sobreposição σ e π)
      σ: frontal, no eixo entre os núcleos — cresce com a aproximação e
      não depende do giro em torno do eixo.
      π: lateral, entre p paralelos — proporcional a |cos θ|, com θ o
      giro de um carbono em torno da ligação: máxima com os p paralelos,
      ZERO a 90° (a π se rompe). Na tripla, os dois π são perpendiculares
      entre si: o que um perde ao girar, o outro ganha — a densidade π é
      um cilindro, e girar não rompe nada.
      Energia para girar em torno da ligação: dupla ≈ 270 kJ/mol × sen²θ
      (a energia da π perdida); simples ≈ 12 kJ/mol no eclipsado (etano,
      barreira de torção); tripla: nenhuma.
═══════════════════════════════════════════════════════════════ */

(function (raiz) {
  'use strict';
  var Q3 = raiz.Q3 = raiz.Q3 || {};
  var O = Q3.Orbitais = {};

  O.P = ['px', 'py', 'pz'];
  O.MISTURAM = { sp3: 3, sp2: 2, sp: 1 };          // quantos p entram em cada hibridização
  O.CUSTO_PROMOCAO = 400;                            // kJ/mol, aproximado
  O.LIGACAO_CH = 413;                                // kJ/mol, energia média de C–H
  O.BARREIRA = { sp3: 12, sp2: 270, sp: 0 };         // kJ/mol para girar em torno da ligação C–C
  O.COMPRIMENTO_CC = { sp3: 1.54, sp2: 1.34, sp: 1.20 };   // Å
  O.COMPRIMENTO_CH = 1.09;                           // Å

  /* Elétrons em cada orbital de valência, antes da mistura.
     fundamental: 2s² 2pₓ¹ 2p_y¹ 2p_z⁰ · promovido: 2s¹ 2pₓ¹ 2p_y¹ 2p_z¹ */
  O.ocupacao = function (etapa) {
    return etapa === 'fundamental' ? { s: 2, px: 1, py: 1, pz: 0 } : { s: 1, px: 1, py: 1, pz: 1 };
  };
  O.desemparelhados = function (etapa) {
    var oc = O.ocupacao(etapa);
    return ['s'].concat(O.P).filter(function (o) { return oc[o] === 1; }).length;
  };
  O.configuracao = function (etapa) {
    return etapa === 'fundamental' ? '2s² 2p²' : '2s¹ 2p³';
  };

  /* Nível de energia do híbrido: a média ponderada de um s e n p. */
  O.nivelHibrido = function (tipo) { var n = O.MISTURAM[tipo]; return n / (1 + n); };

  /* Nível de cada orbital durante a mistura k (0 a 1): o s e os p que
     entram convergem para o nível do híbrido; os p de fora ficam em 1. */
  O.niveis = function (tipo, sel, k) {
    var eh = O.nivelHibrido(tipo), out = { s: k * eh };
    O.P.forEach(function (p) { out[p] = sel.indexOf(p) >= 0 ? 1 - k * (1 - eh) : 1; });
    return out;
  };

  /* Balanço da promoção, em kJ/mol: custa ~400, e as duas ligações C–H a
     mais que ela permite devolvem 2 × 413. */
  O.balancoPromocao = function () {
    return { custo: O.CUSTO_PROMOCAO, ganho: 2 * O.LIGACAO_CH, saldo: 2 * O.LIGACAO_CH - O.CUSTO_PROMOCAO };
  };

  /* Quanto os orbitais se sobrepõem em função da distância d entre os
     núcleos: 0 longe (d ≥ dLonge), 1 na distância de ligação (d ≤ dLig),
     com uma rampa suave no meio. */
  O.fatorDistancia = function (d, dLig, dLonge) {
    var t = Math.max(0, Math.min(1, (dLonge - d) / (dLonge - dLig)));
    return t * t * (3 - 2 * t);
  };
  O.sobreposicaoSigma = function (d, dLig, dLonge) { return O.fatorDistancia(d, dLig, dLonge); };

  /* Sobreposição π entre dois carbonos da mesma hibridização, girados θ
     (radianos) um em relação ao outro em torno da ligação. Devolve cada
     π e o total. sp²: uma π, |cos θ|. sp: duas π — cada par de p
     paralelos perde |cos θ|, mas o p girado passa a se alinhar com o
     outro par: a sobreposição total não muda. */
  O.sobreposicaoPi = function (tipo, d, dLig, dLonge, th) {
    var f = O.fatorDistancia(d, dLig, dLonge), c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th));
    if (tipo === 'sp2') return { pis: [f * c], total: f * c };
    if (tipo === 'sp') return { pis: [f * Math.hypot(c, s), f * Math.hypot(c, s)], total: 2 * f, cilindro: true };
    return { pis: [], total: 0 };
  };

  /* Energia (kJ/mol) para girar um carbono θ em torno da ligação C–C. */
  O.energiaGiro = function (tipo, th) {
    if (tipo === 'sp2') return O.BARREIRA.sp2 * Math.pow(Math.sin(th), 2);
    if (tipo === 'sp3') return O.BARREIRA.sp3 * (1 - Math.cos(3 * th)) / 2;   // 0 alternado, 12 eclipsado (60°)
    return 0;
  };

  /* ═══ FÍSICA DO ARRASTO — a ligação responde à mão ═════════════════
     GIRO em torno da ligação (θ, ω): o torque da ligação é −dE/dθ.
       dupla:   E = 270·sen²θ  → −270·sen 2θ: uma MOLA que devolve ao plano,
                e que além de 90° empurra para 180° (a π se refaz do outro lado);
       simples: E = 12·(1 − cos 3θ)/2 → −18·sen 3θ: quase livre, com um
                "degrau" a cada eclipse;
       tripla:  nenhum torque — a π é um cilindro.
     A mão puxa θ com uma mola forte (kMao); o amortecimento é alto na dupla
     (assenta com um pequeno balanço) e baixo na simples e na tripla (um
     peteleco faz girar livre, parando aos poucos).
     DISTÂNCIA ao longo da ligação (r, v): poço de Morse,
       E = De·(1 − e^(−a(r − r0)))², com De ≈ 350 kJ/mol (C–C) e 413 (C–H):
     solto perto, o parceiro é CAPTURADO e vibra até assentar; puxado além
     do poço, a σ se rompe.
     Unidades do módulo (r em unidades do desenho, θ em radianos, t em s);
     constantes afinadas para a sensação ficar natural na tela. */
  O.FIS = { I: 20, kMao: 900, amortMao: 9, amortGiro: { sp2: 5, sp3: 0.7, sp: 0.6 },
            massa: 6, kMaoR: 1200, amortR: 11, a: 2.2, De: { C: 350, H: 413 }, alcance: 3.0 };

  O.torqueLigacao = function (tipo, th) {
    if (tipo === 'sp2') return -O.BARREIRA.sp2 * Math.sin(2 * th);
    if (tipo === 'sp3') return -O.BARREIRA.sp3 * 1.5 * Math.sin(3 * th);
    return 0;
  };
  /* Um passo do giro. s = { th, w }; mao = ângulo que a mão segura, ou null. */
  O.passoGiro = function (s, tipo, dt, mao) {
    var F = O.FIS, n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (var i = 0; i < n; i++) {
      var segura = !(mao === null || mao === undefined);
      var tau = O.torqueLigacao(tipo, s.th) + (segura ? F.kMao * (mao - s.th) : 0);
      /* quem segura AMORTECE: sem isto, na tripla (atrito mínimo) a mola da
         mão ficava oscilando em volta da posição pedida */
      s.w += (tau / F.I - (F.amortGiro[tipo] + (segura ? F.amortMao : 0)) * s.w) * h;
      s.th += s.w * h;
    }
    return s;
  };
  /* Força da ligação ao longo do eixo (poço de Morse); nenhuma além do alcance. */
  O.forcaLigacao = function (r, r0, De) {
    var a = O.FIS.a, x = r - r0;
    if (x > O.FIS.alcance) return 0;
    var e = Math.exp(-a * x);
    return -2 * De * a * (1 - e) * e;
  };
  /* Um passo da distância. s = { r, v }; mao = distância que a mão segura, ou null. */
  O.passoDistancia = function (s, dt, r0, De, mao) {
    var F = O.FIS, n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (var i = 0; i < n; i++) {
      var f = O.forcaLigacao(s.r, r0, De) + (mao === null || mao === undefined ? 0 : F.kMaoR * (mao - s.r));
      s.v += (f / F.massa - F.amortR * s.v) * h;
      s.r = Math.max(r0 * 0.72, s.r + s.v * h);
    }
    return s;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = O;
})(typeof window !== 'undefined' ? window : globalThis);
