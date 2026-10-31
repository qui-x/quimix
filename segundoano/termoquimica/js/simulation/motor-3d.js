SITQ.FOV = 5.2;
// distância focal em "Å visuais"
SITQ.rot3 = function rot3(p, rx, ry) {
  // Ry (eixo vertical) e depois Rx (eixo horizontal)
  const cy = Math.cos(ry),
    sy = Math.sin(ry);
  const cx = Math.cos(rx),
    sx = Math.sin(rx);
  const x1 = p.x * cy + p.z * sy;
  const z1 = -p.x * sy + p.z * cy;
  const y2 = p.y * cx - z1 * sx;
  const z2 = p.y * sx + z1 * cx;
  return {
    x: x1,
    y: y2,
    z: z2
  };
};
SITQ.proj3 = function proj3(p, cx, cy, ppa) {
  const persp = SITQ.FOV / (SITQ.FOV - p.z); // z cresce PARA a câmera
  return {
    x: cx + p.x * ppa * persp,
    y: cy - p.y * ppa * persp,
    s: persp,
    z: p.z
  };
};
/**
 * Desenha uma molécula em projeção 3D no ponto (cx,cy).
 * ppa = pixels por Å; rx/ry = rotação; labels = letras dos elementos.
 */
SITQ.drawMolecule = function drawMolecule(ctx, mol, cx, cy, ppa, rx, ry, labels) {
  const pts = mol.atoms.map(a => SITQ.proj3(SITQ.rot3(a, rx, ry), cx, cy, ppa));
  const bondCol = SITQ.cssVar('--text-secondary', '#7a9ab8');

  // Itens (ligações + átomos) ordenados por profundidade média
  const items = [];
  mol.bonds.forEach(([i, j, ordem]) => items.push({
    z: (pts[i].z + pts[j].z) / 2,
    tipo: 'b',
    i,
    j,
    ordem
  }));
  mol.atoms.forEach((a, i) => items.push({
    z: pts[i].z,
    tipo: 'a',
    i
  }));
  items.sort((m, n) => m.z - n.z); // mais fundo primeiro

  for (const it of items) {
    if (it.tipo === 'b') {
      const A = pts[it.i],
        B = pts[it.j];
      const dx = B.x - A.x,
        dy = B.y - A.y;
      const len = Math.hypot(dx, dy) || 1;
      // recua as pontas para dentro dos átomos
      const rA = ATOMO_3D[mol.atoms[it.i].el].r * ppa * A.s * 0.8;
      const rB = ATOMO_3D[mol.atoms[it.j].el].r * ppa * B.s * 0.8;
      const ax = A.x + dx / len * rA,
        ay = A.y + dy / len * rA;
      const bx = B.x - dx / len * rB,
        by = B.y - dy / len * rB;
      const nx = -dy / len,
        ny = dx / len; // normal p/ ligações múltiplas
      const offs = it.ordem === 1 ? [0] : it.ordem === 2 ? [-2.6, 2.6] : [-3.6, 0, 3.6];
      ctx.strokeStyle = bondCol;
      ctx.lineWidth = Math.max(1.6, 2.6 * (A.s + B.s) / 2);
      ctx.lineCap = 'round';
      offs.forEach(o => {
        ctx.beginPath();
        ctx.moveTo(ax + nx * o, ay + ny * o);
        ctx.lineTo(bx + nx * o, by + ny * o);
        ctx.stroke();
      });
    } else {
      const P = pts[it.i];
      const el = mol.atoms[it.i].el;
      const st = ATOMO_3D[el];
      const r = st.r * ppa * P.s;
      const g = ctx.createRadialGradient(P.x - r * .35, P.y - r * .35, r * .15, P.x, P.y, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(.25, st.cor);
      g.addColorStop(1, st.cor);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(P.x, P.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (labels) {
        ctx.fillStyle = SITQ.getContrastColor(st.cor);
        ctx.font = `700 ${Math.max(8, r * 0.95)}px Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(el, P.x, P.y + 0.5);
      }
    }
  }
};