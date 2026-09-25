import { ERAS } from '@/data/eras';
import { CHRONOTOPES } from '@/theme/chronotopes';
import { yearToX, formatYear } from '@/engine/timeScale';
import { RIBBON_HEIGHT } from '@/engine/layout';
import styles from './EraRibbon.module.css';

export function EraRibbon({ k }: { k: number }) {
  const invK = Math.min(2.2, Math.max(0.6, 1 / k));

  return (
    <div className={styles.ribbon} style={{ height: RIBBON_HEIGHT }}>
      {ERAS.map((era) => {
        const x0 = yearToX(era.startYear);
        const x1 = yearToX(era.endYear);
        const theme = CHRONOTOPES[era.themeId];
        return (
          <div
            key={era.id}
            className={styles.band}
            style={{
              left: x0,
              width: Math.max(2, x1 - x0),
              background: `linear-gradient(180deg, color-mix(in srgb, ${theme.accent} 22%, transparent), transparent)`,
              borderLeft: `1px solid color-mix(in srgb, ${theme.accent} 45%, transparent)`,
            }}
          >
            <div className={styles.labelAnchor}>
              <div className={styles.label} style={{ transform: `scaleX(${invK})` }}>
                <span className={styles.labelName}>{era.name}</span>
                <span className={styles.labelYears}>
                  {formatYear(era.startYear)} – {formatYear(era.endYear)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
