/* ═══════════════════════════════════════════════════════════════
   CAMADA: SIMULAÇÃO
   ARQUIVO: js/simulation/bancada-optica.js (SIIS · Módulo 3 — Isomeria Óptica)
   ───────────────────────────────────────────────────────────────
   QUALQUER molécula (digitada, desenhada ou da biblioteca), sem limite de
   tamanho: se não couber em tamanho de leitura, a cena mostra um RECORTE
   (o entorno dos carbonos quirais) e o painel avisa.
   A cena: a molécula (sólida) e a sua IMAGEM NO ESPELHO (reflexão real das
   coordenadas, semitransparente), lado a lado com o plano do espelho, ou
   sobrepostas. Um dedo / botão esquerdo: gira SÓ o espelho. Dois dedos /
   botão direito: gira a cena. Pinça / roda: zoom. Setas: giram o espelho.
   Prever → revelar: é quiral? quantos carbonos quirais? quantos
   estereoisômeros? O veredito vem da CONFIGURAÇÃO (optica.js); o encaixe
   geométrico é o experimento (a conformação não muda a molécula).
   Referencial da cena: x para a direita, y para cima, z para o observador.
   O motor 3D do SIQC devolve z para LONGE do observador: inverte-se o z
   (conferido contra o R/S do motor do Módulo 2).
   ═══════════════════════════════════════════════════════════════ */
'use strict';

var OP_CORES = { H: '#E6ECF2', C: '#46505E', O: '#D84A4A', N: '#3C6FD8', F: '#5DB85A', Cl: '#3D9F4A', Br: '#9A4430', I: '#7444A8', S: '#D9B636', P: '#E08A2E' };

class BancadaOptica {
  constructor(D) { this.D = D; this.editor = new EditorCadeias(D); this.ativo = false; this.reiniciar(true); }

  reiniciar(inicio) {
    this.t = 0; this.fonte = 'estudo'; this.mol = null;
    this.Rc = R3.mul(R3.rx(0.22), R3.ry(-0.3)); this.Rm = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    this.zoom = 1; this.sep = 1; this.sepAlvo = 1; this.anim = null; this.vel = { x: 0, y: 0 };
    this.prev = { quiral: null, centros: null, total: null }; this.revelado = false; this.ajuste = null;
    this.recorte = false; this.verTudo = false; this._ptr = {}; this._girou = false;
    if (!inicio) { this.editor.reiniciar(); this.editor.desativar(); }
    this._sync();
  }
  ativar() {
    this.ativo = true; this._ligar(); this._ligarBusca();
    if (!this.mol) this.carregarBiblioteca('latico', 0);
    if (this.fonte === 'desenhar') this.editor.ativar();
    this._mostrarFonte(); this._sync();
  }
  desativar() { this.ativo = false; this.editor.desativar(); this._mostrarFonte(); }
  overlay() { return this.fonte === 'desenhar' ? 'Óptica · desenho' : 'Óptica'; }
  mudarVista() { return false; }

  /* ══ CARREGAR UMA MOLÉCULA ═════════════════════════════════════ */
  carregarBiblioteca(id, k) {
    var lib = (Q3.BibliotecaOptica || []).filter(function (x) { return x.id === id; })[0]; if (!lib) return false;
    var g = Q3.deSmiles(lib.smiles);
    this._carregar(g, null, lib.nome, null, lib, k || 0);
    return true;
  }
  _carregar(g, pos, nome, cunhas, lib, k) {
    var E = Q3.Estereo; pos = pos || Q3.Geometria.layout(g);
    var und = E.unidades(g), cs = und.filter(function (u) { return u.estereogenica && u.tipo === 'centro'; }), cu = {};
    cs.forEach(function (u) { cu[u.c] = (cunhas && cunhas[u.c]) || { viz: E.escolherCunha(g, u.c), z: 1 }; });
    var rn = Q3.Nomenclatura.nomear(g); if (!rn.ok) rn = Q3.NomenclaturaCompleta.nomear(g, { amplo: true });
    this.mol = { g: g, pos: pos, cunhas: cu, und: und, centros: cs, nome: nome || (rn.ok ? rn.nome : null), lib: lib || null, numeracao: rn.ok ? rn.numeracao : null };
    if (lib) this._aplicarConfig(lib.formas[k].config);
    this._recalcular();
    this.Rm = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; this.Tm = [0, 0, 0]; this.torcao = null; this.sep = this.sepAlvo = 1; this.zoom = 1; this.verTudo = false; this.anim = null;
    this.prev = { quiral: null, centros: null, total: null }; this.revelado = false; this.ajuste = null;
    announce('Estudando ' + (this.mol.nome || 'a molécula') + ', com a imagem no espelho ao lado. Um dedo gira o espelho; dois dedos giram a cena.');
    this._sync();
  }
  _descDe(c) { var m = this.mol, d = Q3.Estereo.descritores(m.g, m.pos, m.cunhas, m.und).filter(function (x) { return x.tipo === 'centro' && x.u.c === c; })[0]; return d ? d.d : null; }
  _aplicarConfig(txt) {           // 'R', 'RR', 'RS'… na ordem dos carbonos quirais do motor
    var self = this; this.mol.centros.forEach(function (u, i) { var alvo = txt[i] || txt[txt.length - 1]; if (self._descDe(u.c) !== alvo) self.mol.cunhas[u.c].z *= -1; });
  }
  /* a análise (optica.js) e a molécula 3D com a configuração imposta pelas cunhas */
  _recalcular() {
    var m = this.mol, g = m.g;
    m.an = Q3.Optica.analisar(g, m.pos, m.cunhas);
    g.ligacoes.forEach(function (l) { delete l.estereo; });
    Object.keys(m.cunhas).forEach(function (c) { var cu = m.cunhas[c], l = g.ligacao(c, cu.viz); if (l) l.estereo = { de: c, tipo: cu.z > 0 ? 'frente' : 'tras' }; });
    var m3 = Q3.Geometria3D.embutir(g, m.pos, { tensao: false }), at = m3.atomos, idx = {};
    at.forEach(function (a, i) { idx[a.id] = i; });
    var soma = 0, nl = 0; m3.ligacoes.forEach(function (l) { var a = at[idx[l.a]], b = at[idx[l.b]]; soma += Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z); nl++; });
    var b = nl ? soma / nl : 1, cx = 0, cy = 0, cz = 0; at.forEach(function (a) { cx += a.x; cy += a.y; cz += a.z; }); cx /= at.length; cy /= at.length; cz /= at.length;
    m.P = at.map(function (a) { return [(a.x - cx) / b, (a.y - cy) / b, -(a.z - cz) / b]; });      // z invertido: para o observador
    m.Q = m.P.map(function (p) { return [-p[0], p[1], p[2]]; });                                       // o espelho: reflexão real
    m.el = at.map(function (a) { return a.el; }); m.ids = at.map(function (a) { return a.id; });
    m.lig = m3.ligacoes.map(function (l) { return [idx[l.a], idx[l.b], l.ordem]; });
    m.raio = Math.max.apply(null, m.P.map(function (p) { return Math.hypot(p[0], p[1], p[2]); })) + 0.45;
    var cs = m.centros.map(function (u) { return idx[u.c]; }), roi = [0, 0, 0];
    cs.forEach(function (i) { roi[0] += m.P[i][0] / cs.length; roi[1] += m.P[i][1] / cs.length; roi[2] += m.P[i][2] / cs.length; });
    m.roi = roi; m.iCentros = cs;
  }

  /* ══ OS GESTOS ════════════════════════════════════════════════ */
  _giro(dx, dy) { var k = 0.0165; return R3.mul(R3.rx(dy * k), R3.ry(dx * k)); }
  _girarEspelho(dx, dy) { if (this.torcao || (this.Tm && (this.Tm[0] || this.Tm[1] || this.Tm[2]))) { this.torcao = null; this.Tm = [0, 0, 0]; } var Rt = [[this.Rc[0][0], this.Rc[1][0], this.Rc[2][0]], [this.Rc[0][1], this.Rc[1][1], this.Rc[2][1]], [this.Rc[0][2], this.Rc[1][2], this.Rc[2][2]]]; this.Rm = R3.orto(R3.mul(Rt, R3.mul(this._giro(dx, dy), R3.mul(this.Rc, this.Rm)))); this.ajuste = null; }
  _girarCena(dx, dy) { this.Rc = R3.orto(R3.mul(this._giro(dx, dy), this.Rc)); }
  _ligar() {
    if (this._ligado) return; this._ligado = true;
    var self = this, cv = document.getElementById('sim-canvas'); if (!cv) return;
    var ponto = function (ev) { var r = cv.getBoundingClientRect(); return { x: ev.clientX - r.left - (cv.cenaX || 0), y: ev.clientY - r.top }; }   // na cena (a área livre do card flutuante);
    var ok = function () { return self.ativo && self.fonte === 'estudo' && self.mol; };
    cv.addEventListener('contextmenu', function (ev) { if (ok()) ev.preventDefault(); });
    cv.addEventListener('pointerdown', function (ev) {
      if (!ok()) return; var p = ponto(ev);
      self._ptr[ev.pointerId] = { x: p.x, y: p.y, x0: p.x, y0: p.y, t: performance.now(), botao: ev.button };
      self.anim = null; self.vel = { x: 0, y: 0 }; self._girou = false;
      try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
    });
    cv.addEventListener('pointermove', function (ev) {
      var q = self._ptr[ev.pointerId]; if (!q || !ok()) return;
      var p = ponto(ev), dx = p.x - q.x, dy = p.y - q.y, ids = Object.keys(self._ptr), agora = performance.now(), dtm = Math.max(1, agora - q.t);
      if (Math.abs(p.x - q.x0) + Math.abs(p.y - q.y0) > 3) self._girou = true;
      if (ids.length >= 2) {                                    // dois dedos: a pinça dá o zoom; o deslocamento gira a cena
        var o = self._ptr[ids[0] === String(ev.pointerId) ? ids[1] : ids[0]], d0 = Math.hypot(q.x - o.x, q.y - o.y), d1 = Math.hypot(p.x - o.x, p.y - o.y);
        if (d0 > 10) self.zoom = Math.max(0.2, Math.min(8, self.zoom * d1 / d0));
        self._girarCena(dx / 2, dy / 2);
      } else if (q.botao === 2) self._girarCena(dx, dy);
      else { self._girarEspelho(dx, dy); self.vel = { x: 0.55 * self.vel.x + 0.45 * (dx / dtm * 16), y: 0.55 * self.vel.y + 0.45 * (dy / dtm * 16) }; }
      q.x = p.x; q.y = p.y; q.t = agora;
    });
    var fim = function (ev) { var q = self._ptr[ev.pointerId]; delete self._ptr[ev.pointerId]; if (q && performance.now() - q.t > 90) self.vel = { x: 0, y: 0 }; if (Object.keys(self._ptr).length) self.vel = { x: 0, y: 0 }; };
    cv.addEventListener('pointerup', fim); cv.addEventListener('pointercancel', fim);
    cv.addEventListener('wheel', function (ev) { if (!ok()) return; ev.preventDefault(); self.zoom = Math.max(0.2, Math.min(8, self.zoom * Math.exp(-ev.deltaY * 0.0015))); }, { passive: false });
  }
  tocar(x, y) { if (this.fonte === 'desenhar') return this.editor.tocar(x, y); if (this._girou) { this._girou = false; return true; } return false; }
  navegar(dx, dy) { if (this.fonte === 'desenhar') return this.editor.navegar(dx, dy); if (!this.mol) return false; this._girarEspelho(dx * 10 / 0.0165 * Math.PI / 180, dy * 10 / 0.0165 * Math.PI / 180); announce('Espelho girado.'); return true; }

  atualizar(dt) {
    this.t += dt; if (this.fonte === 'desenhar') { this.editor.atualizar(dt); return; }
    this.sep += (this.sepAlvo - this.sep) * Math.min(1, dt * 6);
    if (this.anim) {
      this.anim.t = Math.min(1, this.anim.t + dt / 0.8); var tt = this.anim.t, e = tt < 0.5 ? 2 * tt * tt : 1 - Math.pow(-2 * tt + 2, 2) / 2;
      this.Rm = R3.mat(R3.slerp(this.anim.q0, this.anim.q1, e));
      var T0 = this.anim.T0, T1 = this.anim.T1; this.Tm = [T0[0] + (T1[0] - T0[0]) * e, T0[1] + (T1[1] - T0[1]) * e, T0[2] + (T1[2] - T0[2]) * e];
      if (this.torcao) this.torcao.t = e;
      if (this.anim.t >= 1) { this.anim = null; this._sync(); }
    } else if (!Object.keys(this._ptr).length && Math.abs(this.vel.x) + Math.abs(this.vel.y) > 0.05) {
      this._girarEspelho(this.vel.x * dt * 60, this.vel.y * dt * 60); var f = Math.exp(-dt * 5); this.vel.x *= f; this.vel.y *= f;
    }
  }

  /* ══ O MELHOR ENCAIXE: a rotação do espelho mais próxima da original ══
     Horn (quatérnio de máximo autovalor) + correspondência por elemento
     refeita a cada passo (átomos equivalentes podem trocar de lugar),
     partindo de várias orientações. Marca os átomos que não encaixam. */
  _kabsch(A, B) {                 // a rotação que leva A (pontos) a B
    var S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    A.forEach(function (a, i) { var b = B[i]; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) S[r][c] += a[r] * b[c]; });
    var xx = S[0][0], xy = S[0][1], xz = S[0][2], yx = S[1][0], yy = S[1][1], yz = S[1][2], zx = S[2][0], zy = S[2][1], zz = S[2][2];
    var N = [[xx + yy + zz, yz - zy, zx - xz, xy - yx], [yz - zy, xx - yy - zz, xy + yx, zx + xz], [zx - xz, xy + yx, -xx + yy - zz, yz + zy], [xy - yx, zx + xz, yz + zy, -xx - yy + zz]];
    var desl = 0; N.forEach(function (l) { l.forEach(function (v) { desl += Math.abs(v); }); });
    var q = [1, 0.1, 0.1, 0.1];
    for (var it = 0; it < 80; it++) { var nq = [0, 0, 0, 0]; for (var r2 = 0; r2 < 4; r2++) { nq[r2] = desl * q[r2]; for (var c2 = 0; c2 < 4; c2++) nq[r2] += N[r2][c2] * q[c2]; } var m = Math.hypot(nq[0], nq[1], nq[2], nq[3]) || 1; q = nq.map(function (v) { return v / m; }); }
    return R3.mat(q);
  }
  _casar(A, B, el) {              // a correspondência por elemento (gulosa pela menor distância)
    var pares = [], par = new Array(A.length).fill(-1), usado = {};
    A.forEach(function (a, i) { B.forEach(function (b, j) { if (el[i] === el[j]) pares.push([Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), i, j]); }); });
    pares.sort(function (x, y) { return x[0] - y[0]; });
    pares.forEach(function (p) { if (par[p[1]] < 0 && !usado[p[2]]) { par[p[1]] = p[2]; usado[p[2]] = 1; } });
    return par;
  }
  /* AS SIMETRIAS DA MOLÉCULA (automorfismos do grafo dos átomos pesados): as trocas de átomos que preservam
     tudo — elemento, H, ligações. No meso tartárico: a identidade e C2↔C3. Busca com retrocesso, podada
     por classes de equivalência (refinamento à Morgan); teto para moléculas muito simétricas. */
  _automorfismos(limite) {
    var g = this.mol.g, ids = g.pesados(), n = ids.length, idx = {};
    ids.forEach(function (id, i) { idx[id] = i; });
    var el = ids.map(function (id) { return g.atomos[id].el; }), hh = ids.map(function (id) { return g.hidrogenios(id); });
    var viz = ids.map(function (id) { return g.vizinhos(id).filter(function (v) { return idx[v.id] !== undefined; }).map(function (v) { return [idx[v.id], g.ligacao(id, v.id).ordem]; }); });
    var cls = ids.map(function (id, i) { return el[i] + '|' + hh[i] + '|' + viz[i].length; });
    for (var it = 0; it < n; it++) {
      var novo = cls.map(function (c, i) { return c + '(' + viz[i].map(function (v) { return cls[v[0]] + '/' + v[1]; }).sort().join(',') + ')'; });
      var mapa = {}, k = 0, comp = novo.map(function (x) { if (!(x in mapa)) mapa[x] = 'k' + (k++); return mapa[x]; });
      var antes = Object.keys(cls.reduce(function (o, c) { o[c] = 1; return o; }, {})).length;
      cls = comp; if (k === antes) break;
    }
    var ordem = [], vis = {}; for (var s0 = 0; s0 < n; s0++) { if (vis[s0]) continue; vis[s0] = 1; var fila = [s0]; while (fila.length) { var x = fila.shift(); ordem.push(x); viz[x].forEach(function (v) { if (!vis[v[0]]) { vis[v[0]] = 1; fila.push(v[0]); } }); } }
    var img = new Array(n).fill(-1), usado = {}, out = [];
    var ok = function (i, j) {
      if (cls[i] !== cls[j] || usado[j]) return false;
      return viz[i].every(function (v) { return img[v[0]] < 0 || viz[j].some(function (w) { return w[0] === img[v[0]] && w[1] === v[1]; }); });
    };
    var bt = function (k2) {
      if (out.length >= limite) return; if (k2 === n) { out.push(img.slice()); return; }
      var i = ordem[k2]; for (var j = 0; j < n; j++) if (ok(i, j)) { img[i] = j; usado[j] = 1; bt(k2 + 1); img[i] = -1; usado[j] = 0; }
    };
    bt(0);
    return { lista: out, ids: ids };
  }
  /* o encaixe exato com uma correspondência dada (pares de índices 3D): rotação de Horn + translação */
  _encaixeCom(Qx, pares) {
    var m = this.mol, mA = [0, 0, 0], mB = [0, 0, 0], n = pares.length;
    pares.forEach(function (p) { for (var k = 0; k < 3; k++) { mA[k] += Qx[p[0]][k] / n; mB[k] += m.P[p[1]][k] / n; } });
    var A = pares.map(function (p) { return [Qx[p[0]][0] - mA[0], Qx[p[0]][1] - mA[1], Qx[p[0]][2] - mA[2]]; }), B = pares.map(function (p) { return [m.P[p[1]][0] - mB[0], m.P[p[1]][1] - mB[1], m.P[p[1]][2] - mB[2]]; });
    var R = this._kabsch(A, B), e = 0;
    A.forEach(function (a, i) { var q = R3.ap(R, a); e += (q[0] - B[i][0]) * (q[0] - B[i][0]) + (q[1] - B[i][1]) * (q[1] - B[i][1]) + (q[2] - B[i][2]) * (q[2] - B[i][2]); });
    var rA = R3.ap(R, mA);
    return { R: R, T: [mB[0] - rA[0], mB[1] - rA[1], mB[2] - rA[2]], erro: Math.sqrt(e / n) };
  }

  /* o lado de uma ligação a–b: tudo o que se alcança a partir de b sem passar por a (índices da molécula 3D) */
  _lado(a, b) {
    var m = this.mol, viz = {}, vis = {}; m.lig.forEach(function (l) { (viz[l[0]] = viz[l[0]] || []).push(l[1]); (viz[l[1]] = viz[l[1]] || []).push(l[0]); });
    vis[a] = 1; vis[b] = 1; var fila = [b], out = [b];
    while (fila.length) { var x = fila.shift(); (viz[x] || []).forEach(function (y) { if (!vis[y]) { vis[y] = 1; fila.push(y); out.push(y); } }); }
    return out;
  }
  _torcer(Q, a, b, lado, ang) {   // gira o lado de b em torno do eixo a→b
    var A = Q[a], B = Q[b], k = R3.un([B[0] - A[0], B[1] - A[1], B[2] - A[2]]), c = Math.cos(ang), sn = Math.sin(ang), out = Q.map(function (q) { return q.slice(); });
    lado.forEach(function (i) {
      var v = [Q[i][0] - A[0], Q[i][1] - A[1], Q[i][2] - A[2]], kv = R3.cruz(k, v), kd = k[0] * v[0] + k[1] * v[1] + k[2] * v[2];
      out[i] = [A[0] + v[0] * c + kv[0] * sn + k[0] * kd * (1 - c), A[1] + v[1] * c + kv[1] * sn + k[1] * kd * (1 - c), A[2] + v[2] * c + kv[2] * sn + k[2] * kd * (1 - c)];
    });
    return out;
  }
  /* o ajuste rígido (ICP: correspondência por elemento refeita a cada passo + rotação ótima de Horn) */
  _ajusteRigido(Qall, usar, R0s, iters) {
    var m = this.mol, self = this, ap = R3.ap, melhor = null;
    var Q = usar.map(function (i) { return Qall[i]; }), P = usar.map(function (i) { return m.P[i]; }), elU = usar.map(function (i) { return m.el[i]; });
    R0s.forEach(function (R0) {
      var R = R0, par;
      for (var it = 0; it < iters; it++) {
        var A = Q.map(function (q) { return ap(R, q); }); par = self._casar(A, P, elU);
        var As = [], Bs = []; par.forEach(function (j2, k) { if (j2 >= 0) { As.push(Q[k]); Bs.push(P[j2]); } });
        R = self._kabsch(As, Bs);
      }
      var A2 = Q.map(function (q) { return ap(R, q); }), erro = 0; par = self._casar(A2, P, elU);
      par.forEach(function (j2, k) { var d = j2 >= 0 ? Math.hypot(A2[k][0] - P[j2][0], A2[k][1] - P[j2][1], A2[k][2] - P[j2][2]) : 9; erro += d * d; });
      erro = Math.sqrt(erro / Q.length);
      if (!melhor || erro < melhor.erro) melhor = { R: R, erro: erro };
    });
    return melhor;
  }
  _fora(Qall, R, T, idx) {         // os átomos (de idx) que não caem sobre um átomo igual da original
    var m = this.mol, ap = R3.ap, ruins = {};
    idx.forEach(function (i) {
      var q = ap(R, Qall[i]); q = [q[0] + T[0], q[1] + T[1], q[2] + T[2]]; var d = Infinity;
      m.P.forEach(function (p, j2) { if (m.el[j2] === m.el[i]) d = Math.min(d, Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])); });
      if (d > 0.45) ruins[i] = 1;
    });
    return ruins;
  }
  melhorEncaixe() {
    var m = this.mol; if (!m) return false;
    var self = this, ap = R3.ap, el = m.el, pesados = [], viz = {};
    el.forEach(function (e, i) { if (e !== 'H') pesados.push(i); });
    m.lig.forEach(function (l) { (viz[l[0]] = viz[l[0]] || []).push(l[1]); (viz[l[1]] = viz[l[1]] || []).push(l[0]); });
    var res;
    if (m.an.quiral && m.iCentros.length) {
      /* QUIRAL: a demonstração dos livros — dois ligantes do carbono quiral coincidem; os outros dois ficam TROCADOS */
      var c = m.iCentros[0], raiz = viz[c] || [], melhor = null;
      for (var a1 = 0; a1 < raiz.length; a1++) for (var a2 = a1 + 1; a2 < raiz.length; a2++) {
        var i1 = raiz[a1], i2 = raiz[a2], sub = function (X, i) { return [X[i][0] - X[c][0], X[i][1] - X[c][1], X[i][2] - X[c][2]]; };
        var R = this._kabsch([sub(m.Q, i1), sub(m.Q, i2)], [sub(m.P, i1), sub(m.P, i2)]);
        var rc = ap(R, m.Q[c]), T = [m.P[c][0] - rc[0], m.P[c][1] - rc[1], m.P[c][2] - rc[2]], erro = 0;
        pesados.forEach(function (i) { var q = ap(R, m.Q[i]), d = Infinity; q = [q[0] + T[0], q[1] + T[1], q[2] + T[2]]; m.P.forEach(function (p, j2) { if (el[j2] === el[i]) d = Math.min(d, Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])); }); erro += d * d; });
        erro = Math.sqrt(erro / pesados.length) + (el[i1] === 'H' || el[i2] === 'H' ? 0.3 : 0);   // preferir deixar o H entre os trocados
        if (!melhor || erro < melhor.erro) melhor = { R: R, T: T, erro: erro, trocados: raiz.filter(function (x) { return x !== i1 && x !== i2; }) };
      }
      var ruinsQ = {}; melhor.trocados.forEach(function (i) { ruinsQ[i] = 1; });
      m.iCentros.slice(1).forEach(function (c2) { var r2 = self._fora(m.Q, melhor.R, melhor.T, viz[c2] || []); for (var k in r2) ruinsQ[k] = 1; });
      res = { R: melhor.R, T: melhor.T, ruins: ruinsQ, torcao: null };
    } else {
      /* AQUIRAL (com ou sem carbonos quirais — o meso): a imagem no espelho é a mesma molécula, talvez com os
         papéis de átomos equivalentes trocados (no meso, C2↔C3) e noutra conformação. As correspondências vêm
         das SIMETRIAS da molécula; primeiro o encaixe rígido, depois o giro de UMA ligação simples (de 5 em 5°). */
      var au = this._automorfismos(120), hid = au.ids.map(function (id) { return m.ids.indexOf(id); });
      var Hde = {}; m.lig.forEach(function (l) { if (el[l[0]] === 'H') (Hde[l[1]] = Hde[l[1]] || []).push(l[0]); if (el[l[1]] === 'H') (Hde[l[0]] = Hde[l[0]] || []).push(l[1]); });
      var juizK = [];                                             // os átomos que contam (índices dos pesados)
      if (m.iCentros.length) m.iCentros.forEach(function (c3) { var k = hid.indexOf(c3); juizK.push(k); (viz[c3] || []).forEach(function (v) { var kv = hid.indexOf(v); if (kv >= 0) juizK.push(kv); }); });
      else juizK = hid.map(function (x, k) { return k; });
      juizK = juizK.filter(function (x, k) { return juizK.indexOf(x) === k; });
      var paresDe = function (pi) {
        var pr = juizK.map(function (k) { return [hid[k], hid[pi[k]]]; });
        m.iCentros.forEach(function (c3) { var k = hid.indexOf(c3), hq = Hde[c3] || [], hp = Hde[hid[pi[k]]] || []; if (hq.length === 1 && hp.length === 1) pr.push([hq[0], hp[0]]); });
        return pr;
      };
      var melhorA = null, tenta = function (Qx, tor) { au.lista.forEach(function (pi) { var r = self._encaixeCom(Qx, paresDe(pi)); if (!melhorA || r.erro < melhorA.erro) melhorA = { R: r.R, T: r.T, erro: r.erro, pi: pi, torcao: tor }; }); };
      tenta(m.Q, null);
      if (melhorA.erro > 0.2) {
        var aneis = {}; Q3.Geometria.aneisMinimos(m.g).forEach(function (r) { r.forEach(function (id) { aneis[m.ids.indexOf(id)] = 1; }); });
        var giraveis = m.lig.filter(function (l) { return l[2] === 1 && el[l[0]] !== 'H' && el[l[1]] !== 'H' && !(aneis[l[0]] && aneis[l[1]]) && (viz[l[0]] || []).filter(function (x) { return el[x] !== 'H'; }).length > 1 && (viz[l[1]] || []).filter(function (x) { return el[x] !== 'H'; }).length > 1; });
        giraveis.forEach(function (l) {
          if (melhorA.erro <= 0.2) return; var lado = self._lado(l[0], l[1]);
          for (var g2 = 1; g2 < 72; g2++) { var ang = g2 * Math.PI / 36; tenta(self._torcer(m.Q, l[0], l[1], lado, ang), { a: l[0], b: l[1], lado: lado, ang: ang, t: 0 }); }
        });
      }
      var QF = melhorA.torcao ? this._torcer(m.Q, melhorA.torcao.a, melhorA.torcao.b, melhorA.torcao.lado, melhorA.torcao.ang) : m.Q, ruinsA = {};
      juizK.forEach(function (k) { var i3 = hid[k], q = ap(melhorA.R, QF[i3]), p = m.P[hid[melhorA.pi[k]]]; if (Math.hypot(q[0] + melhorA.T[0] - p[0], q[1] + melhorA.T[1] - p[1], q[2] + melhorA.T[2] - p[2]) > 0.45) ruinsA[i3] = 1; });
      res = { R: melhorA.R, T: melhorA.T, ruins: ruinsA, torcao: melhorA.erro <= 0.2 ? melhorA.torcao : null };
      if (!res.torcao && melhorA.torcao && Object.keys(ruinsA).length) res.torcao = null;
    }
    this.anim = { q0: R3.quat(this.Rm), q1: R3.quat(res.R), t: 0, T0: this.Tm || [0, 0, 0], T1: res.T };
    this.torcao = res.torcao; this.sepAlvo = 0; this.vel = { x: 0, y: 0 };
    var nr = Object.keys(res.ruins).length;
    this.ajuste = { ruins: res.ruins, encaixa: nr === 0, torcao: res.torcao ? [m.ids[res.torcao.a], m.ids[res.torcao.b]] : null };
    announce(nr === 0 ? (res.torcao ? 'Encaixe depois de girar uma ligação simples (conformação): as duas se sobrepõem.' : 'Encaixe: as duas se sobrepõem.') : 'Melhor encaixe possível: ' + nr + ' ligantes ficam trocados, marcados na cena.');
    this._sync(); return true;
  }

  /* ══ A CENA ════════════════════════════════════════════════════ */
  desenhar(ctx, W, H) {
    if (this.fonte === 'desenhar') { this.editor.desenhar(ctx, W, H); return; }
    var m = this.mol; if (!m) return;
    var P = Q3.Desenho.paleta(), lado = this.sep, ap = R3.ap, self = this;
    var fitLado = Math.min(W * 0.46 / (2 * m.raio), H * 0.84 / (2 * m.raio)), fitSobre = Math.min(W * 0.9 / (2 * m.raio), H * 0.84 / (2 * m.raio));
    var fit = fitLado * lado + fitSobre * (1 - lado), minimo = W < 520 ? 22 : 28;
    var recAntes = this.recorte;
    this.recorte = fit < minimo && !this.verTudo;                  // não cabe em tamanho de leitura: o RECORTE
    if (recAntes !== this.recorte || this._fitVisto === undefined) { this._fitVisto = true; this._sync(); }   // o aviso no painel acompanha, na hora
    var esc = (this.recorte ? minimo : Math.min(fit, 110)) * this.zoom;
    var roi = this.recorte ? m.roi : [0, 0, 0], roiE = [-roi[0], roi[1], roi[2]];
    var cxO = W / 2 - lado * W * 0.25, cxE = W / 2 + lado * W * 0.25, cy = H / 2;
    // o plano do espelho (lado a lado)
    if (lado > 0.05) {
      var g0 = ctx.createLinearGradient(W / 2 - 14, 0, W / 2 + 14, 0);
      g0.addColorStop(0, biRgba(P.acento, 0)); g0.addColorStop(0.5, biRgba(P.acento, 0.22 * lado)); g0.addColorStop(1, biRgba(P.acento, 0));
      ctx.fillStyle = g0; ctx.fillRect(W / 2 - 14, H * 0.06, 28, H * 0.88);
    }
    // os itens das duas moléculas, juntos, do fundo para a frente
    var itens = [], sc = [];
    var Qv = this.torcao ? this._torcer(m.Q, this.torcao.a, this.torcao.b, this.torcao.lado, this.torcao.ang * this.torcao.t) : m.Q, Tm = this.Tm || [0, 0, 0], sepT = 1 - lado;
    [[m.P, roi, [[1, 0, 0], [0, 1, 0], [0, 0, 1]], cxO, 0, [0, 0, 0]], [Qv, roiE, this.Rm, cxE, 1, [Tm[0] * sepT, Tm[1] * sepT, Tm[2] * sepT]]].forEach(function (x) {
      var pts = x[0].map(function (p) { var r = ap(x[2], [p[0] - x[1][0], p[1] - x[1][1], p[2] - x[1][2]]), v = ap(self.Rc, [r[0] + x[5][0], r[1] + x[5][1], r[2] + x[5][2]]); return { x: x[3] + v[0] * esc, y: cy - v[1] * esc, z: v[2] }; });
      sc[x[4]] = pts;
      pts.forEach(function (q, i) { itens.push({ t: 'a', z: q.z, i: i, m: x[4], p: q }); });
      m.lig.forEach(function (l) { itens.push({ t: 'l', z: (pts[l[0]].z + pts[l[1]].z) / 2 - 0.05, l: l, m: x[4], pts: pts }); });
    });
    itens.sort(function (a, b) { return a.z - b.z; });
    var raioDe = function (el) { return (el === 'H' ? 0.17 : 0.27) * esc; };
    itens.forEach(function (it) {
      ctx.save(); ctx.globalAlpha = it.m ? 0.55 : 1;
      if (it.t === 'l') {
        var a = it.pts[it.l[0]], b = it.pts[it.l[1]], ord = it.l[2], dx = b.x - a.x, dy = b.y - a.y, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n, w = Math.max(1.5, esc * 0.07);
        for (var k = 0; k < ord; k++) {
          var off = (k - (ord - 1) / 2) * w * 1.6;
          [[a, m.el[it.l[0]], 0, 0.5], [b, m.el[it.l[1]], 0.5, 1]].forEach(function (s) {
            ctx.strokeStyle = OP_CORES[s[1]] || P.texto; ctx.lineWidth = w; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(a.x + dx * s[2] + nx * off, a.y + dy * s[2] + ny * off); ctx.lineTo(a.x + dx * s[3] + nx * off, a.y + dy * s[3] + ny * off); ctx.stroke();
          });
        }
      } else {
        var el = m.el[it.i], r = raioDe(el) * (1 + 0.08 * it.p.z), cor = OP_CORES[el] || '#9AA4B0';
        var gr = ctx.createRadialGradient(it.p.x - r * 0.35, it.p.y - r * 0.35, r * 0.1, it.p.x, it.p.y, r);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.25, cor); gr.addColorStop(1, cor);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(it.p.x, it.p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
        if (it.m === 1 && self.ajuste && !self.anim && self.ajuste.ruins[it.i]) {     // não encaixa: marcado
          ctx.globalAlpha = 1; ctx.lineWidth = 3; ctx.strokeStyle = '#E0393E'; ctx.beginPath(); ctx.arc(it.p.x, it.p.y, r + 5, 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();
    });
    // revelado: os carbonos quirais, numerados e com R/S, nas duas
    if (this.revelado) {
      m.iCentros.forEach(function (i, k) {
        var d = m.an.desc.filter(function (x) { return x.tipo === 'centro' && x.u.c === m.ids[i]; })[0], dE = d ? (d.d === 'R' ? 'S' : 'R') : '';
        [[sc[0][i], d ? d.d : ''], [sc[1][i], dE]].forEach(function (s, j) {
          var p = s[0]; if (!p) return; ctx.save(); ctx.strokeStyle = P.acento; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p.x, p.y, raioDe('C') + 7, 0, Math.PI * 2); ctx.stroke();
          ctx.font = '700 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          var txt = (m.iCentros.length > 1 ? (k + 1) + ' · ' : '') + s[1], w = ctx.measureText(txt).width + 10;
          ctx.fillStyle = biRgba(P.fundo, 0.92); ctx.fillRect(p.x + raioDe('C') + 6, p.y - 20, w, 18); ctx.fillStyle = P.texto; ctx.fillText(txt, p.x + raioDe('C') + 6 + w / 2, p.y - 11); ctx.restore();
        });
      });
    }
    // o recorte: um degradê nas bordas onde a molécula continua
    if (this.recorte) {
      var fora = { e: false, d: false, c: false, b: false };
      sc.forEach(function (pts) { pts.forEach(function (q) { if (q.x < 0) fora.e = true; if (q.x > W) fora.d = true; if (q.y < 0) fora.c = true; if (q.y > H) fora.b = true; }); });
      var borda = function (x0, y0, x1, y1, rx, ry, rw, rh) { var gg = ctx.createLinearGradient(x0, y0, x1, y1); gg.addColorStop(0, biRgba(P.fundo, 0.9)); gg.addColorStop(1, biRgba(P.fundo, 0)); ctx.fillStyle = gg; ctx.fillRect(rx, ry, rw, rh); };
      if (fora.e) borda(0, 0, 46, 0, 0, 0, 46, H); if (fora.d) borda(W, 0, W - 46, 0, W - 46, 0, 46, H);
      if (fora.c) borda(0, 0, 0, 46, 0, 0, W, 46); if (fora.b) borda(0, H, 0, H - 46, 0, H - 46, W, 46);
    }
  }

  /* ══ AS AÇÕES ═══════════════════════════════════════════════════ */
  acao(nome) {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    if (nome.indexOf('op-lib:') === 0) return this.carregarBiblioteca(nome.slice(7), 0);
    if (nome === 'op-estudar') {
      var txt = val('op-estrutural').trim(); if (!txt) { announce('Digite a fórmula estrutural.'); return false; }
      try { var g = Q3.deFormulaCondensada(txt); this._carregar(g, null, null, null, null, 0); this._erro = ''; }
      catch (e) { this._erro = e.message; announce(e.message); this._sync(); return false; }
      return true;
    }
    if (nome === 'op-desenhar') { this.fonte = 'desenhar'; this.editor.ativar(); this._mostrarFonte(); announce('Desenhe no editor (as cunhas definem a configuração) e leve o desenho para o estudo.'); return true; }
    if (nome === 'op-voltar') { this.fonte = 'estudo'; this.editor.desativar(); this._mostrarFonte(); return true; }
    if (nome === 'op-levar') {
      var ge = this.editor.g; if (!ge || !ge.pesados().length) { announce('O editor está vazio.'); return false; }
      var g2 = ge.clonar ? ge.clonar() : ge, pos = {}, cu = {}, pe = this.editor.pos || {};
      g2.pesados().forEach(function (id) { if (pe[id]) pos[id] = { x: pe[id].x, y: pe[id].y }; });
      if (Object.keys(pos).length !== g2.pesados().length) pos = null;
      g2.ligacoes.forEach(function (l) { if (l.estereo && l.estereo.tipo !== 'plano') { var de = l.estereo.de, viz = de === l.a ? l.b : l.a; cu[de] = { viz: viz, z: l.estereo.tipo === 'frente' ? 1 : -1 }; } });
      this.fonte = 'estudo'; this.editor.desativar(); this._mostrarFonte();
      this._carregar(g2, pos, null, cu, null, 0); return true;
    }
    if (!this.mol) return false;
    if (nome === 'op-sobrepor') { this.sepAlvo = this.sepAlvo > 0.5 ? 0 : 1; this._sync(); return true; }
    if (nome === 'op-encaixe' || nome === 'op-acao') { if (!this.revelado) { announce('Primeiro preveja e revele; antes disso, gire o espelho você mesmo.'); return false; } return this.melhorEncaixe(); }
    if (nome === 'op-restaurar') { this.anim = { q0: R3.quat(this.Rm), q1: R3.quat([[1, 0, 0], [0, 1, 0], [0, 0, 1]]), t: 0, T0: this.Tm || [0, 0, 0], T1: [0, 0, 0] }; this.torcao = null; this.sepAlvo = 1; this.ajuste = null; this.zoom = 1; this._sync(); return true; }
    if (nome === 'op-tudo') { this.verTudo = !this.verTudo; this.zoom = 1; this._sync(); return true; }
    if ((nome.indexOf('op-cfg:') === 0 || nome === 'op-enantiomero') && !this.revelado) return false;
    if (nome.indexOf('op-cfg:') === 0) {           // op-cfg:índice:R|S
      var p2 = nome.split(':'), u = this.mol.centros[+p2[1]]; if (!u) return false;
      if (this._descDe(u.c) !== p2[2]) { this.mol.cunhas[u.c].z *= -1; this._mudouConfig(); }
      return true;
    }
    if (nome === 'op-enantiomero') { var self = this; this.mol.centros.forEach(function (u) { self.mol.cunhas[u.c].z *= -1; }); this._mudouConfig(); announce('Agora é o enantiômero: todos os carbonos quirais invertidos.'); return true; }
    if (nome.indexOf('op-prev:') === 0) {          // op-prev:campo:valor
      var q = nome.split(':'), cpo = q[1], pv = this.prev;
      if (cpo === 'quiral') pv.quiral = q[2] === '1';
      else { var atual = pv[cpo] == null ? (cpo === 'total' ? 1 : 0) : pv[cpo]; pv[cpo] = Math.max(cpo === 'total' ? 1 : 0, atual + (+q[2])); }
      this._sync(); return true;
    }
    if (nome === 'op-revelar') { var pv2 = this.prev; if (pv2.quiral == null || pv2.centros == null || pv2.total == null) { announce('Complete a previsão antes de revelar.'); return false; } this.revelado = true; this._sync(); announce(Q3.Optica.veredito(this.mol.an).texto); return true; }
    if (nome === 'op-prever') { this.revelado = false; this.prev = { quiral: null, centros: null, total: null }; this._sync(); return true; }
    return false;
  }
  _mudouConfig() { this._recalcular(); this.ajuste = null; this.torcao = null; this.Tm = [0, 0, 0]; this.anim = null; this.sepAlvo = 1; this._sync(); announce(Q3.Optica.veredito(this.mol.an).texto); }   // revelado: o novo veredito na hora

  /* ══ OS PAINÉIS ═════════════════════════════════════════════════ */
  _mostrarFonte() {
    var d = this.fonte === 'desenhar', at = this.ativo, vis = function (id, v) { var el = document.getElementById(id); if (el) el.hidden = !v; };
    if (!at) return;
    vis('panel-construcao', d); vis('panel-representacao', d);
    vis('op-grupo-desenho', d); vis('op-grupo-estudo', !d);
  }
  _sync() {
    if (typeof document === 'undefined' || !this.ativo) return;
    var m = this.mol, self = this, set = function (id, h) { var el = document.getElementById(id); if (el) el.innerHTML = h; };
    var btn = function (acao, txt, extra, dis) { return '<button type="button" class="action-btn' + (extra || '') + '" data-action="' + acao + '"' + (dis ? ' disabled' : '') + '>' + txt + '</button>'; };
    var esc = function (acao, txt, on) { return '<button type="button" class="bg-opcao' + (on ? ' is-on' : '') + '" aria-pressed="' + (on ? 'true' : 'false') + '" data-action="' + acao + '">' + txt + '</button>'; };
    this._montarLista();
    set('op-erro', this._erro ? this._erro : '');
    if (!m) return;
    set('op-atual', (m.nome || 'molécula sem nome') + ' · ' + m.g.pesados().length + ' átomos além do H');
    // prever → revelar
    var pv = this.prev, an = m.an, h = '';
    var stepper = function (cpo, val) { return '<div class="op-stepper">' + btn('op-prev:' + cpo + ':-1', '−') + '<span class="op-valor" aria-live="polite">' + (val == null ? '—' : val) + '</span>' + btn('op-prev:' + cpo + ':1', '+') + '</div>'; };
    if (!this.revelado) {
      h += '<p class="ctrl-label">Quiral?</p><div class="bg-grupo">' + esc('op-prev:quiral:1', 'Sim', pv.quiral === true) + esc('op-prev:quiral:0', 'Não', pv.quiral === false) + '</div>';
      h += '<p class="ctrl-label">Carbonos quirais</p>' + stepper('centros', pv.centros);
      h += '<p class="ctrl-label">Estereoisômeros</p>' + stepper('total', pv.total);
      h += '<div class="action-row">' + btn('op-revelar', 'Revelar', ' is-primario', pv.quiral == null || pv.centros == null || pv.total == null) + '</div>';
    } else {
      var v = Q3.Optica.veredito(an), ok = function (b) { return b ? '<span class="bg-igual">igual</span>' : '<span class="bg-dif">diferente</span>'; };
      h += '<ul class="bg-conferencia"><li>Quiral? ' + (pv.quiral ? 'sim' : 'não') + ' → <strong>' + (an.quiral ? 'sim' : 'não') + '</strong> ' + ok(pv.quiral === an.quiral) + '</li>';
      h += '<li>Carbonos quirais: ' + pv.centros + ' → <strong>' + an.nCentros + '</strong> ' + ok(pv.centros === an.nCentros) + '</li>';
      h += '<li>Estereoisômeros: ' + pv.total + ' → <strong>' + (an.exato ? an.total : 'até ' + an.maximo) + '</strong> ' + ok(an.exato ? pv.total === an.total : pv.total === an.maximo) + '</li></ul>';
      h += '<p class="bi-tags"><span class="bi-pill">' + v.tipo + '</span>' + (an.n ? '<span class="bi-pill">máximo 2' + sup(an.n) + ' = ' + an.maximo + '</span>' : '') + (an.exato && an.total < an.maximo ? '<span class="bi-pill">meso conta 1 vez</span>' : '') + '</p>';
      if (m.lib) h += this._sinais();
      h += '<div class="action-row">' + btn('op-prever', 'Prever de novo') + '</div>';
    }
    set('op-prever', h);
    // o espelho
    var e = '<div class="action-row">' + btn('op-encaixe', 'Melhor encaixe possível', ' is-primario', !this.revelado) + '</div>';
    e += '<div class="action-row">' + btn('op-sobrepor', this.sepAlvo > 0.5 ? 'Sobrepor as duas' : 'Separar as duas') + btn('op-restaurar', 'Restaurar') + '</div>';
    if (this.ajuste && !this.anim) e += '<p class="bg-ao-vivo"><strong>' + (this.ajuste.encaixa ? 'Sobrepõem' + (this.ajuste.torcao ? ' (girando uma ligação simples)' : '') + ': mesma molécula' : an.quiral ? 'Não sobrepõem: enantiômeros' : 'Só conformação difere: aquiral') + '</strong></p>';
    if (this.recorte || this.verTudo) e += '<p class="op-aviso">' + (this.recorte ? '<strong>Recorte:</strong> o entorno dos carbonos quirais.' : 'Molécula inteira.') + '</p><div class="action-row">' + btn('op-tudo', this.verTudo ? 'Voltar ao recorte' : 'Ver tudo') + '</div>';
    set('op-espelho', e);
    // a configuração
    var c = '';
    if (!this.revelado) c = '<p class="hint-text">Depois de revelar.</p>';
    else if (!m.centros.length) c = '<p class="hint-text">Nenhum carbono quiral.</p>';
    else {
      m.centros.forEach(function (u, i) {
        var d = self._descDe(u.c), loc = m.numeracao && m.numeracao[u.c] ? 'C' + m.numeracao[u.c] : 'carbono ' + (i + 1);
        c += '<p class="ctrl-label">' + loc + '</p><div class="bg-grupo">' + esc('op-cfg:' + i + ':R', 'R', d === 'R') + esc('op-cfg:' + i + ':S', 'S', d === 'S') + '</div>';
      });
      c += '<div class="action-row">' + btn('op-enantiomero', 'Formar o enantiômero (todos invertidos)') + '</div>';
    }
    set('op-config', c);
  }
  /* ══ A BIBLIOTECA: uma LISTA COM BUSCA (cresce sem mudar o código) ══
     A lista mostra SÓ o nome e a busca procura só no nome, na categoria e nos sinônimos (sem maiúsculas
     nem acentos; com várias palavras, todas): nada pode antecipar a previsão. Teclado: ↓ na busca vai à lista;
     ↑ ↓ Home End percorrem; Enter carrega; Esc volta à busca. */
  _normal(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim(); }
  _indice(x) {
    if (!x._indice) x._indice = this._normal([x.nome, x.categoria].concat(x.sinonimos || []).join(' '));   // as notas das formas só depois de revelar
    return x._indice;
  }
  /* a etiqueta do item: a fórmula molecular (com índices), como no SIME */
  _formulaDe(x) {
    if (x._formula == null) { try { var f = Q3.deSmiles(x.smiles).formulaMolecular(); x._formula = String(f).replace(/\d/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[+d]; }); } catch (e) { x._formula = ''; } }
    return x._formula;
  }
  _montarLista() {
    var ul = document.getElementById('op-lista'); if (!ul) return;
    var self = this, busca = document.getElementById('op-busca'), q = this._normal(busca ? busca.value : ''), termos = q ? q.split(' ') : [];
    var todos = (Q3.BibliotecaOptica || []).slice().sort(function (a, b) { return self._normal(a.nome) < self._normal(b.nome) ? -1 : 1; });
    var achados = todos.filter(function (x) { var ix = self._indice(x); return termos.every(function (t) { return ix.indexOf(t) >= 0; }); });
    var atual = this.mol && this.mol.lib ? this.mol.lib.id : null, chave = q + '|' + atual;
    if (ul.dataset.chave === chave && ul.children.length) return;    // nada mudou: não refaz (mantém o foco)
    ul.dataset.chave = chave;
    var foco = document.activeElement && ul.contains(document.activeElement) ? document.activeElement.dataset.action : null;   // o teclado não perde a posição
    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    ul.innerHTML = achados.map(function (x) {
      var on = x.id === atual;
      return '<li role="none"><button type="button" class="op-item' + (on ? ' is-on' : '') + '" role="option" aria-selected="' + on + '" data-action="op-lib:' + x.id + '">' +
             '<span class="op-item-tag" aria-hidden="true">' + self._formulaDe(x) + '</span><span class="op-item-nome">' + esc(x.nome) + '</span>' + (x.categoria ? '<span class="op-item-pill">' + esc(x.categoria) + '</span>' : '') + '</button></li>';
    }).join('');
    if (foco) { var vf = ul.querySelector('[data-action="' + foco + '"]'); if (vf) vf.focus(); }
    var cont = document.getElementById('op-contagem');
    if (cont) cont.textContent = !achados.length ? 'Nenhum composto com "' + (busca ? busca.value.trim() : '') + '".' : (q ? achados.length + ' de ' + todos.length + ' compostos' : todos.length + ' compostos');
  }
  _ligarBusca() {
    var busca = document.getElementById('op-busca'), ul = document.getElementById('op-lista'), self = this;
    if (!busca || !ul || busca.dataset.ligada) return; busca.dataset.ligada = '1';
    busca.addEventListener('input', function () { self._montarLista(); });
    busca.addEventListener('keydown', function (ev) { if (ev.key === 'ArrowDown') { var f = ul.querySelector('.op-item'); if (f) { ev.preventDefault(); f.focus(); } } });
    ul.addEventListener('keydown', function (ev) {
      var itens = [].slice.call(ul.querySelectorAll('.op-item')), i = itens.indexOf(document.activeElement); if (i < 0) return;
      var alvo = ev.key === 'ArrowDown' ? itens[Math.min(itens.length - 1, i + 1)] : ev.key === 'ArrowUp' ? (i ? itens[i - 1] : busca) : ev.key === 'Home' ? itens[0] : ev.key === 'End' ? itens[itens.length - 1] : ev.key === 'Escape' ? busca : null;
      if (alvo) { ev.preventDefault(); alvo.focus(); }
    });
  }
  _sinais() {                      // o polarímetro: o sinal de cada forma (da biblioteca)
    var m = this.mol, self = this, atual = m.centros.map(function (u) { return self._descDe(u.c); }).join('');
    var linhas = m.lib.formas.map(function (f) {
      var mesma = f.config === atual || (f.config.length > 1 && f.config.split('').sort().join('') === atual.split('').sort().join('') && f.sinal === '0');
      var s = f.sinal === '+' ? '(+) dextrogira' : f.sinal === '−' ? '(−) levogira' : f.sinal === '0' ? 'inativa' : 'sinal medido no polarímetro';
      return '<li' + (mesma ? ' class="op-atual"' : '') + '>(' + f.config.split('').join(',') + '): ' + s + '</li>';
    }).join('');
    return '<p class="ctrl-label">No polarímetro</p><ul class="op-sinais">' + linhas + '</ul>';
  }
  resultados() {
    var m = this.mol, out = [];
    if (!m) return [{ l: 'Molécula', v: '—' }];
    out.push({ l: 'Molécula', v: m.nome || 'sem nome' });
    out.push({ l: 'Átomos (sem H)', v: String(m.g.pesados().length) });
    if (this.ajuste) out.push({ l: 'Encaixe', v: this.ajuste.encaixa ? 'sobrepõe' : 'não sobrepõe' });
    if (this.revelado) { out.push({ l: 'Carbonos quirais', v: String(m.an.nCentros) }); out.push({ l: 'Veredito', v: Q3.Optica.veredito(m.an).tipo }); }
    if (this.recorte) out.push({ l: 'Cena', v: 'recorte' });
    return out;
  }
}
function sup(n) { return String(n).split('').map(function (d) { return '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d]; }).join(''); }
