import styles from './viz.module.css';

export function PythagoreanViz({ a, b }: { a: number; b: number }) {
  const scale = 9;
  const A = a * scale;
  const B = b * scale;
  const c = Math.sqrt(a * a + b * b);

  const originX = 70;
  const originY = 210;
  // Triângulo: reto na origem, cateto a na horizontal, cateto b na vertical.
  const P0 = { x: originX, y: originY }; // ângulo reto
  const P1 = { x: originX + A, y: originY }; // fim do cateto a
  const P2 = { x: originX, y: originY - B }; // fim do cateto b

  return (
    <svg className={styles.stage} viewBox="0 0 320 260" role="img" aria-label={`Triângulo retângulo com catetos ${a} e ${b}`}>
      {/* quadrado sobre o cateto a */}
      <rect
        x={P0.x}
        y={P0.y}
        width={A}
        height={A}
        transform={`translate(0, ${A})`}
        fill="color-mix(in srgb, var(--atlas-accent) 14%, transparent)"
        stroke="var(--atlas-accent)"
        strokeWidth={1.2}
      />
      {/* quadrado sobre o cateto b */}
      <rect
        x={P0.x - B}
        y={P0.y - B}
        width={B}
        height={B}
        fill="color-mix(in srgb, var(--atlas-accent-alt) 16%, transparent)"
        stroke="var(--atlas-accent-alt)"
        strokeWidth={1.2}
      />
      {/* quadrado sobre a hipotenusa (aproximado, rotacionado) */}
      <HypotenuseSquare p1={P1} p2={P2} />

      <polygon
        points={`${P0.x},${P0.y} ${P1.x},${P1.y} ${P2.x},${P2.y}`}
        fill="var(--atlas-surface)"
        stroke="var(--atlas-ink)"
        strokeWidth={1.6}
      />

      <text x={(P0.x + P1.x) / 2} y={P0.y + 16} className={styles.svgLabel} textAnchor="middle">a = {a}</text>
      <text x={P0.x - 12} y={(P0.y + P2.y) / 2} className={styles.svgLabel} textAnchor="end">b = {b}</text>
      <text x={(P1.x + P2.x) / 2 + 10} y={(P1.y + P2.y) / 2 - 6} className={styles.svgLabelStrong} textAnchor="middle">
        c ≈ {c.toFixed(2)}
      </text>
    </svg>
  );
}

function HypotenuseSquare({ p1, p2 }: { p1: { x: number; y: number }; p2: { x: number; y: number } }) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // vetor perpendicular (apontando para fora do triângulo, ou seja, para a direita/baixo)
  const nx = dy;
  const ny = -dx;
  const p3 = { x: p2.x + nx, y: p2.y + ny };
  const p4 = { x: p1.x + nx, y: p1.y + ny };

  return (
    <polygon
      points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`}
      fill="color-mix(in srgb, var(--atlas-ink) 10%, transparent)"
      stroke="var(--atlas-ink-dim)"
      strokeWidth={1.2}
    />
  );
}
