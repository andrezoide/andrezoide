import { laneY } from '@/engine/layout';
import styles from './LaneLabels.module.css';

interface Props {
  labels: string[];
  viewport: { x: number; y: number; k: number; width: number; height: number };
}

export function LaneLabels({ labels, viewport }: Props) {
  return (
    <div className={styles.wrap} aria-hidden="true">
      {labels.map((label, i) => {
        const top = viewport.y + laneY(i);
        if (top < -20 || top > viewport.height + 20) return null;
        return (
          <div key={label} className={styles.label} style={{ top }}>
            {label}
          </div>
        );
      })}
    </div>
  );
}
