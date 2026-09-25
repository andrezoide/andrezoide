import { useRef, useState } from 'react';
import { TeX } from '@/components/math/TeX';
import styles from './UnitCircle.module.css';

const SIZE = 280;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = 100;

export function UnitCircle() {
  const [angle, setAngle] = useState(Math.PI / 4);
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * SIZE - CX;
    const y = ((e.clientY - rect.top) / rect.height) * SIZE - CY;
    setAngle(Math.atan2(-y, x));
  }

  const px = CX + R * Math.cos(angle);
  const py = CY - R * Math.sin(angle);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const degrees = ((angle * 180) / Math.PI + 360) % 360;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        className={styles.stage}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label="Círculo unitário interativo — arraste o ponto para mudar o ângulo"
        onPointerDown={(e) => { setDragging(true); handlePointer(e); }}
        onPointerMove={(e) => dragging && handlePointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <line x1={0} y1={CY} x2={SIZE} y2={CY} stroke="var(--atlas-border)" />
        <line x1={CX} y1={0} x2={CX} y2={SIZE} stroke="var(--atlas-border)" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--atlas-border)" strokeWidth={1.5} />

        {/* projeções */}
        <line x1={px} y1={py} x2={px} y2={CY} stroke="var(--atlas-accent-alt)" strokeWidth={1.6} strokeDasharray="4 3" />
        <line x1={px} y1={py} x2={CX} y2={py} stroke="var(--atlas-accent)" strokeWidth={1.6} strokeDasharray="4 3" />

        <line x1={CX} y1={CY} x2={px} y2={py} stroke="var(--atlas-ink)" strokeWidth={2} />
        <circle cx={px} cy={py} r={7} fill="var(--atlas-accent-alt)" stroke="var(--atlas-bg)" strokeWidth={2} className={styles.handle} />

        <text x={px + 10} y={CY - 6} className={styles.label}>cos θ = {cos.toFixed(2)}</text>
        <text x={CX + 8} y={py - 8} className={styles.label}>sen θ = {sin.toFixed(2)}</text>
      </svg>

      <div className={styles.readout}>
        <span>θ = {degrees.toFixed(0)}°</span>
        <TeX math={`\\sin\\theta = ${sin.toFixed(2)}, \\; \\cos\\theta = ${cos.toFixed(2)}`} />
      </div>
      <p className={styles.hint}>arraste o ponto ao redor do círculo</p>
    </div>
  );
}
