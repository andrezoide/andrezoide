import { useRef, useState } from 'react';
import styles from './GeometryTriangle.module.css';

const W = 320;
const H = 260;
const A = { x: 60, y: 220 };
const B = { x: 260, y: 220 };

function dist(p: { x: number; y: number }, q: { x: number; y: number }) {
  return Math.hypot(p.x - q.x, p.y - q.y);
}

function angleAt(p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) {
  const v1 = { x: q.x - p.x, y: q.y - p.y };
  const v2 = { x: r.x - p.x, y: r.y - p.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const cos = dot / (dist(p, q) * dist(p, r));
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}

const SCALE = 20; // px por unidade

export function GeometryTriangle() {
  const [C, setC] = useState({ x: 150, y: 70 });
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  function handlePointer(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    setC({ x: Math.max(10, Math.min(W - 10, x)), y: Math.max(10, Math.min(A.y - 20, y)) });
  }

  const ab = dist(A, B) / SCALE;
  const bc = dist(B, C) / SCALE;
  const ca = dist(C, A) / SCALE;
  const angleA = angleAt(A, B, C);
  const angleB = angleAt(B, A, C);
  const angleC = 180 - angleA - angleB;
  const area = Math.abs((A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) / 2) / (SCALE * SCALE);
  const perimeter = ab + bc + ca;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        className={styles.stage}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Triângulo interativo — arraste o vértice superior"
        onPointerDown={(e) => { setDragging(true); handlePointer(e); }}
        onPointerMove={(e) => dragging && handlePointer(e)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
        <polygon
          points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
          fill="color-mix(in srgb, var(--atlas-accent) 16%, transparent)"
          stroke="var(--atlas-accent)"
          strokeWidth={2}
        />
        <text x={A.x - 10} y={A.y + 18} className={styles.vertexLabel}>A</text>
        <text x={B.x + 6} y={B.y + 18} className={styles.vertexLabel}>B</text>
        <text x={C.x} y={C.y - 12} className={styles.vertexLabel} textAnchor="middle">C</text>
        <circle cx={C.x} cy={C.y} r={8} fill="var(--atlas-accent-alt)" stroke="var(--atlas-bg)" strokeWidth={2} className={styles.handle} />
      </svg>

      <div className={styles.stats}>
        <Stat label="Lado AB" value={ab.toFixed(2)} />
        <Stat label="Lado BC" value={bc.toFixed(2)} />
        <Stat label="Lado CA" value={ca.toFixed(2)} />
        <Stat label="Ângulo A" value={`${angleA.toFixed(1)}°`} />
        <Stat label="Ângulo B" value={`${angleB.toFixed(1)}°`} />
        <Stat label="Ângulo C" value={`${angleC.toFixed(1)}°`} />
        <Stat label="Área" value={area.toFixed(2)} />
        <Stat label="Perímetro" value={perimeter.toFixed(2)} />
      </div>
      <p className={styles.hint}>arraste o vértice C para transformar o triângulo</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
    </div>
  );
}
