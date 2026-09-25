import type { NotationStage } from '@/types/content';
import { TeX } from '@/components/math/TeX';
import styles from './NotationEvolutionView.module.css';

export function NotationEvolutionView({ stages }: { stages: NotationStage[] }) {
  return (
    <div className={styles.row}>
      {stages.map((stage, i) => (
        <div key={i} className={styles.stage}>
          {i > 0 && <span className={styles.arrow} aria-hidden="true">→</span>}
          <div className={styles.card}>
            <span className={styles.label}>{stage.label}</span>
            <TeX math={stage.display} className={styles.display} />
            {stage.note && <p className={styles.note}>{stage.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
