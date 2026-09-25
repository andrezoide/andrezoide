import { useMemo, useRef, useState } from 'react';
import { buildPlotScale } from '@/engine/plotScale';
import { TeX } from '@/components/math/TeX';
import styles from './FunctionGrapher.module.css';

const W = 320;
const H = 240;
const PAD = 26;
const X_MIN = -8;
const X_MAX = 8;

export function FunctionGrapher({ initial }: { initial: { a: number; b: number; c: number } }) {
  const [a, setA] = useState(initial.a);
  const [b, setB] = useState(initial.b);
  const [c, setC] = useState(initial.c);
  const [x0, setX0] = useState(2);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const f = (x: number) => a * x * x + b * x + c;

  const { path, xScale, yScale, yMin, yMax } = useMemo(
    () => buildPlotScale(f, { width: W, height: H, pad: PAD, xMin: X_MIN, xMax: X_MAX }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [a, b, c],
  );

  const slope = 2 * a * x0 + b;
  const py = f(x0);

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const x = X_MIN + ((svgX - PAD) / (W - PAD * 2)) * (X_MAX - X_MIN);
    setX0(Math.max(X_MIN + 0.5, Math.min(X_MAX - 0.5, x)));
  }

  const x0Visible = X_MIN <= 0 && 0 <= X_MAX;
  const y0Visible = yMin <= 0 && 0 <= yMax;
  const t1 = { x: x0 - 2.5, y: py + slope * -2.5 };
  const t2 = { x: x0 + 2.5, y: py + slope * 2.5 };

  return (
    <div className={styles.wrap}>
      <div className={styles.sliders}>
        <Slider label="a" value={a} onChange={setA} min={-3} max={3} step={0.1} />
        <Slider label="b" value={b} onChange={setB} min={-8} max={8} step={0.5} />
        <Slider label="c" value={c} onChange={setC} min={-8} max={8} step={0.5} />
      </div>

      <TeX math={`f(x) = ${a.toFixed(1)}x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b).toFixed(1)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c).toFixed(1)}`} display />

      <svg
        ref={svgRef}
        className={styles.stage}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Gráfico interativo de função quadrática com ponto de tangência arrastável"
        onPointerDown={(e) => { setDragging(true); handlePointer(e); }}
        onPointerMove={(e) => dragging && handlePointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        {y0Visible && <line x1={PAD} y1={yScale(0)} x2={W - PAD} y2={yScale(0)} stroke="var(--atlas-border)" />}
        {x0Visible && <line x1={xScale(0)} y1={PAD} x2={xScale(0)} y2={H - PAD} stroke="var(--atlas-border)" />}
        <path d={path} fill="none" stroke="var(--atlas-accent)" strokeWidth={2.2} />
        <line x1={xScale(t1.x)} y1={yScale(t1.y)} x2={xScale(t2.x)} y2={yScale(t2.y)} stroke="var(--atlas-accent-alt)" strokeWidth={1.6} strokeDasharray="5 3" />
        <circle cx={xScale(x0)} cy={yScale(py)} r={7} fill="var(--atlas-accent-alt)" stroke="var(--atlas-bg)" strokeWidth={2} className={styles.handle} />
      </svg>

      <p className={styles.readout}>
        No ponto x = {x0.toFixed(2)}: f(x) = {py.toFixed(2)}, inclinação da tangente f'(x) = {slope.toFixed(2)}
      </p>
      <p className={styles.hint}>arraste o ponto laranja ao longo da curva</p>
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number }) {
  return (
    <label className={styles.slider}>
      <span>{label} = {value.toFixed(1)}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
