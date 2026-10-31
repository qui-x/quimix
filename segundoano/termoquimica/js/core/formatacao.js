/** Formata número no padrão pt-BR com sinal − tipográfico. */
SITQ.fmt = function fmt(v, casas = 1) {
  const s = Number(v).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas
  });
  return s.replace('-', '−');
};
SITQ.clamp = (v, a, b) => Math.min(b, Math.max(a, v));