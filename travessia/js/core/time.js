// Tempo histórico: datas, escala deformada ("warp") e réguas.
//
// O eixo não é linear. Milhares de anos de ocupação humana antes de 1500
// precisam de espaço visível sem esmagar os últimos cinco séculos. Cada
// segmento tem um fator de compressão; dentro dele a escala é linear, e a
// interface sinaliza a mudança de escala na régua.

export const SEGMENTS = [
  { a: -50000, b: -12000, f: 1 / 400, label: 'tempo profundo' },
  { a: -12000, b: 1000, f: 1 / 80, label: 'milênios' },
  { a: 1000, b: 1500, f: 1 / 6, label: 'séculos' },
  { a: 1500, b: 2031, f: 1, label: '' },
];

// posição virtual (u) acumulada no início de cada segmento
let acc = 0;
for (const s of SEGMENTS) { s.u0 = acc; acc += (s.b - s.a) * s.f; s.u1 = acc; }
export const U_MIN = 0;
export const U_MAX = acc;
export const YEAR_MIN = SEGMENTS[0].a;
export const YEAR_MAX = SEGMENTS[SEGMENTS.length - 1].b;

export function yearToU(y) {
  if (y <= YEAR_MIN) return 0;
  for (const s of SEGMENTS) if (y <= s.b) return s.u0 + (y - s.a) * s.f;
  return U_MAX;
}

export function uToYear(u) {
  if (u <= 0) return YEAR_MIN;
  for (const s of SEGMENTS) if (u <= s.u1) return s.a + (u - s.u0) / s.f;
  return YEAR_MAX;
}

export function segmentAtYear(y) {
  for (const s of SEGMENTS) if (y <= s.b) return s;
  return SEGMENTS[SEGMENTS.length - 1];
}

// ---------------------------------------------------------------- datas

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysIn = (y, m) => [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];

/**
 * "1822-09-07" | "1822-09" | "1822" | "-9500" → { y, m?, d?, precision, t }
 * t é o ano decimal (o ponto no eixo). Datas com precisão de ano ficam no
 * meio do ano; de mês, no meio do mês.
 */
export function parseDate(str) {
  if (str == null) return null;
  const m = /^(-?\d+)(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(String(str).trim());
  if (!m) throw new Error(`Data inválida: ${str}`);
  const y = +m[1];
  if (m[3]) {
    const mo = +m[2] - 1, d = +m[3];
    return { y, m: mo, d, precision: 'day', t: y + (mo + (d - 0.5) / daysIn(y, mo)) / 12 };
  }
  if (m[2]) {
    const mo = +m[2] - 1;
    return { y, m: mo, precision: 'month', t: y + (mo + 0.5) / 12 };
  }
  return { y, precision: 'year', t: y + 0.5 };
}

export function yearLabel(y, { short = false } = {}) {
  y = Math.round(y);
  if (y < 0) {
    const n = -y;
    if (n >= 10000 && n % 1000 === 0 && short) return `${n / 1000} mil a.C.`;
    return `${fmtInt(n)} a.C.`;
  }
  return String(y);
}

export const fmtInt = (n) => n >= 10000 ? n.toLocaleString('pt-BR') : String(n);

export function formatDate(p, { long = false } = {}) {
  if (!p) return '';
  if (p.precision === 'day') return long ? `${p.d} de ${MONTHS_LONG[p.m]} de ${yearLabel(p.y)}` : `${p.d} ${MONTHS[p.m]} ${yearLabel(p.y)}`;
  if (p.precision === 'month') return long ? `${MONTHS_LONG[p.m]} de ${yearLabel(p.y)}` : `${MONTHS[p.m]} ${yearLabel(p.y)}`;
  return yearLabel(p.y);
}

export function formatRange(s, e, circa) {
  const c = circa ? 'c. ' : '';
  if (!e) return c + formatDate(s);
  if (s.y === e.y && s.precision !== 'year') return c + `${formatDate(s)} – ${formatDate(e)}`;
  if (s.y < 0 && e.y < 0) return `${c}${fmtInt(-s.y)}–${fmtInt(-e.y)} a.C.`;
  return `${c}${yearLabel(s.y)}–${yearLabel(e.y)}`;
}

// ------------------------------------------------------------- réguas

// Níveis de escala, do mais amplo ao mais fino. `min` é pixels por ano.
export const SCALE_LEVELS = [
  { id: 'milenios', label: 'Milênios', min: 0 },
  { id: 'seculos', label: 'Séculos', min: 0.45 },
  { id: 'decadas', label: 'Décadas', min: 5 },
  { id: 'anos', label: 'Anos', min: 45 },
  { id: 'meses', label: 'Meses', min: 900 },
  { id: 'dias', label: 'Dias', min: 22000 },
];
// pixels por ano "típicos" ao escolher um nível pelos botões de escala
export const SCALE_TARGETS = { milenios: 0.12, seculos: 1.6, decadas: 16, anos: 140, meses: 2600, dias: 40000 };

export function scaleLevel(pxPerYear) {
  let lvl = SCALE_LEVELS[0];
  for (const l of SCALE_LEVELS) if (pxPerYear >= l.min) lvl = l;
  return lvl;
}

const YEAR_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

/**
 * Gera ticks para o intervalo [y0, y1] com ppy pixels por ano.
 * Retorna [{ t, rank, label }]; rank 2 = marco forte, 1 = rótulo, 0 = menor.
 */
export function ticksFor(y0, y1, ppy) {
  const out = [];
  if (ppy * 1 >= 110) {
    // abaixo do ano: meses e dias
    const dayPx = ppy / 365.25;
    const monthPx = ppy / 12;
    const ya = Math.floor(y0), yb = Math.ceil(y1);
    if (yb - ya > 400) return out; // proteção
    for (let y = ya; y <= yb; y++) {
      for (let mo = 0; mo < 12; mo++) {
        const tm = y + mo / 12;
        if (tm > y1) break;
        if (dayPx >= 7) {
          const nd = daysIn(y, mo);
          for (let d = 1; d <= nd; d++) {
            const t = y + (mo + (d - 1) / nd) / 12;
            if (t < y0 || t > y1) continue;
            const lab = dayPx >= 40 || d === 1 || (dayPx >= 16 && (d % 5 === 0)) || (dayPx >= 9 && d === 15);
            out.push({
              t, rank: d === 1 ? (mo === 0 ? 3 : 2) : lab ? 1 : 0,
              label: d === 1 ? (mo === 0 ? `${y}` : `${MONTHS[mo]} ${y}`) : lab ? String(d) : '',
            });
          }
        } else if (tm >= y0) {
          const lab = monthPx >= 34 || mo % 3 === 0;
          out.push({ t: tm, rank: mo === 0 ? 3 : lab ? 1 : 0, label: mo === 0 ? `${y}` : lab ? MONTHS[mo] : '' });
        }
      }
    }
    return out;
  }
  // anos e acima
  let major = YEAR_STEPS[YEAR_STEPS.length - 1];
  for (const s of YEAR_STEPS) if (s * ppy >= 74) { major = s; break; }
  let minor = major;
  for (let i = YEAR_STEPS.length - 1; i >= 0; i--) {
    const s = YEAR_STEPS[i];
    if (s < major && major % s === 0 && s * ppy >= 9) minor = s;
  }
  const strong = major * (String(major)[0] === '2' ? 5 : String(major)[0] === '5' ? 2 : 10);
  const start = Math.ceil(y0 / minor) * minor;
  for (let y = start; y <= y1; y += minor) {
    const isMajor = y % major === 0;
    out.push({
      t: y, rank: y % strong === 0 ? 3 : isMajor ? 1 : 0,
      label: isMajor ? yearLabel(y, { short: major >= 1000 }) : '',
    });
  }
  return out;
}

export function monthName(m, long) { return (long ? MONTHS_LONG : MONTHS)[m]; }
