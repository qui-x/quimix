/** Formata número no padrão pt-BR com sinal − tipográfico. */
SIRAD.fmt = function fmt(v, casas = 1) {
  const s = Number(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas
  });
  return s.replace('-', '−');
};
SIRAD._SOBRESCRITO = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹'
};
SIRAD.fmtCientifico = function fmtCientifico(v, casas = 2) {
  if (!isFinite(v) || v === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(v)));
  const mant = v / Math.pow(10, exp);
  const expStr = String(exp).split('').map(c => SIRAD._SOBRESCRITO[c] || c).join('');
  return `${SIRAD.fmt(mant, casas)} × 10${expStr}`;
};
SIRAD.clamp = (v, a, b) => Math.min(b, Math.max(a, v));