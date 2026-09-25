import { useMemo } from 'react';
import styles from './viz.module.css';

const W = 300;
const H = 220;
const PAD = 22;
const X_MIN = -8;
const X_MAX = 8;

function f(a: number, b: number, c: number, x: number) {
  return a * x * x + b * x + c;
}

export function QuadraticGraphViz({
  a,
  b,
  c,
  highlightX,
}: {
  a: number;
  b: number;
  c: number;
  highlightX?: number;
}) {
  const { path, xScale, yScale, yMin, yMax } = useMemo(() => {
    const samples = 60;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i <= samples; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / samples;
      pts.push({ x, y: f(a, b, c, x) });
    }
    let yMin = Math.min(...pts.map((p) => p.y));
    let yMax = Math.max(...pts.map((p) => p.y));
    if (yMin === yMax) {
      yMin -= 1;
      yMax += 1;
    }
    const yPad = (yMax - yMin) * 0.12;
    yMin -= yPad;
    yMax += yPad;

    const xScale = (x: number) => PAD + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - PAD * 2);
    const yScale = (y: number) => H - PAD - ((y - yMin) / (yMax - yMin)) * (H - PAD * 2);

    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x).toFixed(1)} ${yScale(p.y).toFixed(1)}`).join(' ');
    return { path, xScale, yScale, yMin, yMax };
  }, [a, b, c]);

  const x0Visible = X_MIN <= 0 && 0 <= X_MAX;
  const y0Visible = yMin <= 0 && 0 <= yMax;

  const tangent = highlightX !== undefined
    ? (() => {
        const slope = 2 * a * highlightX + b;
        const py = f(a, b, c, highlightX);
        const x1 = highlightX - 3;
        const x2 = highlightX + 3;
        return {
          x1: xScale(x1), y1: yScale(py + slope * (x1 - highlightX)),
          x2: xScale(x2), y2: yScale(py + slope * (x2 - highlightX)),
          px: xScale(highlightX), py: yScale(py),
          slope,
        };
      })()
    : null;

  return (
    <svg className={styles.stage} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico da função quadrática">
      {y0Visible && <line x1={PAD} y1={yScale(0)} x2={W - PAD} y2={yScale(0)} stroke="var(--atlas-border)" strokeWidth={1} />}
      {x0Visible && <line x1={xScale(0)} y1={PAD} x2={xScale(0)} y2={H - PAD} stroke="var(--atlas-border)" strokeWidth={1} />}
      <path d={path} fill="none" stroke="var(--atlas-accent)" strokeWidth={2.2} />
      {tangent && (
        <>
          <line x1={tangent.x1} y1={tangent.y1} x2={tangent.x2} y2={tangent.y2} stroke="var(--atlas-accent-alt)" strokeWidth={1.6} strokeDasharray="5 3" />
          <circle cx={tangent.px} cy={tangent.py} r={4} fill="var(--atlas-accent-alt)" />
          <text x={tangent.px + 8} y={tangent.py - 8} className={styles.svgLabelStrong}>
            inclinação ≈ {tangent.slope.toFixed(2)}
          </text>
        </>
      )}
    </svg>
  );
}
