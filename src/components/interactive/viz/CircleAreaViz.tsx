import styles from './viz.module.css';

export function CircleAreaViz({ r }: { r: number }) {
  const scale = 8;
  const cx = 110;
  const cy = 110;
  const radius = Math.max(4, r * scale * 0.55);

  return (
    <svg className={styles.stage} viewBox="0 0 220 220" role="img" aria-label={`Círculo de raio ${r}`}>
      <line x1={cx} y1={cy} x2={cx + radius} y2={cy} stroke="var(--atlas-accent-alt)" strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={cx + radius / 2} y={cy - 6} className={styles.svgLabel} textAnchor="middle">r</text>
      <circle cx={cx} cy={cy} r={radius} fill="color-mix(in srgb, var(--atlas-accent) 18%, transparent)" stroke="var(--atlas-accent)" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={2} fill="var(--atlas-ink)" />
    </svg>
  );
}
