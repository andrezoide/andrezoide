/**
 * Avaliação numérica ao vivo para cada fórmula interativa. Como cada fórmula
 * tem semântica própria, mantemos um cálculo dedicado por id — simples e
 * explícito, sem tentar um "avaliador de expressões" genérico que a
 * aplicação não precisa.
 */

export interface FormulaResult {
  latex: string;
  note?: string;
}

export function evaluateFormula(id: string, v: Record<string, number>): FormulaResult {
  switch (id) {
    case 'f-pythagorean': {
      const c = Math.sqrt(v.a ** 2 + v.b ** 2);
      return { latex: `c = \\sqrt{${fmt(v.a)}^2 + ${fmt(v.b)}^2} = ${fmt(c)}` };
    }
    case 'f-circle-area': {
      const a = Math.PI * v.r ** 2;
      return { latex: `A = \\pi \\times ${fmt(v.r)}^2 \\approx ${fmt(a)}` };
    }
    case 'f-quadratic-formula': {
      const { a, b, c } = v;
      if (a === 0) return { latex: '\\text{a não pode ser } 0' };
      const disc = b ** 2 - 4 * a * c;
      if (disc < 0) {
        const re = -b / (2 * a);
        const im = Math.sqrt(-disc) / (2 * a);
        return { latex: `x = ${fmt(re)} \\pm ${fmt(im)}i`, note: 'discriminante negativo: raízes complexas' };
      }
      const sq = Math.sqrt(disc);
      const x1 = (-b + sq) / (2 * a);
      const x2 = (-b - sq) / (2 * a);
      return { latex: `x = ${fmt(x1)} \\quad \\text{ou} \\quad x = ${fmt(x2)}` };
    }
    case 'f-arithmetic-series': {
      const s = (v.n * (v.a1 + v.an)) / 2;
      return { latex: `S_{${fmt(v.n)}} = \\frac{${fmt(v.n)}(${fmt(v.a1)} + ${fmt(v.an)})}{2} = ${fmt(s)}` };
    }
    case 'f-law-of-cosines': {
      const C = (v.C * Math.PI) / 180;
      const c = Math.sqrt(v.a ** 2 + v.b ** 2 - 2 * v.a * v.b * Math.cos(C));
      return { latex: `c = ${fmt(c)}` };
    }
    case 'f-fibonacci-recurrence': {
      let a = 1, b = 1;
      const n = Math.round(v.n);
      if (n <= 2) return { latex: `F_{${n}} = 1` };
      for (let i = 3; i <= n; i++) {
        [a, b] = [b, a + b];
      }
      return { latex: `F_{${n}} = ${fmt(b)}` };
    }
    case 'f-binomial-theorem': {
      const n = Math.round(v.n);
      const coeffs: number[] = [];
      let c = 1;
      for (let k = 0; k <= n; k++) {
        coeffs.push(c);
        c = (c * (n - k)) / (k + 1);
      }
      return { latex: `(x+y)^{${n}}: \\;\\; ${coeffs.map((k) => fmt(k)).join(',\\; ')}` };
    }
    case 'f-derivative-definition': {
      // f(x) = x^2 como exemplo didático padrão
      const slope = 2 * v.x0;
      return { latex: `f'(${fmt(v.x0)}) = 2 \\times ${fmt(v.x0)} = ${fmt(slope)}`, note: 'usando f(x) = x²' };
    }
    case 'f-fundamental-theorem-calculus': {
      // f(x) = x como exemplo didático padrão, F(x) = x²/2
      const area = (v.b ** 2 - v.a ** 2) / 2;
      return { latex: `\\int_{${fmt(v.a)}}^{${fmt(v.b)}} x\\,dx = ${fmt(area)}` };
    }
    case 'f-euler-identity': {
      const re = Math.cos(v.theta);
      const im = Math.sin(v.theta);
      return { latex: `e^{i \\times ${fmt(v.theta)}} = ${fmt(re)} ${im >= 0 ? '+' : '-'} ${fmt(Math.abs(im))}i` };
    }
    case 'f-classical-probability': {
      const p = v.possiveis === 0 ? 0 : v.favoraveis / v.possiveis;
      return { latex: `P = \\frac{${fmt(v.favoraveis)}}{${fmt(v.possiveis)}} = ${fmt(p)}` };
    }
    case 'f-rsa': {
      const c = modPow(v.m, v.e, v.n);
      return { latex: `c \\equiv ${fmt(v.m)}^{${fmt(v.e)}} \\bmod ${fmt(v.n)} = ${fmt(c)}` };
    }
    case 'f-euler-graph-formula': {
      const f = 2 - v.V + v.E;
      return { latex: `F = 2 - ${fmt(v.V)} + ${fmt(v.E)} = ${fmt(f)}` };
    }
    default:
      return { latex: '' };
  }
}

function modPow(base: number, exp: number, mod: number): number {
  let result = 1;
  let b = base % mod;
  let e = Math.round(exp);
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % mod;
    e = Math.floor(e / 2);
    b = (b * b) % mod;
  }
  return result;
}

function fmt(n: number): string {
  if (!isFinite(n)) return '\\infty';
  const rounded = Math.round(n * 1000) / 1000;
  return rounded.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}
