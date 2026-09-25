import { useRef } from 'react';
import { ERAS } from '@/data/eras';
import { CHRONOTOPES } from '@/theme/chronotopes';
import { WORLD_WIDTH } from '@/engine/timeScale';
import styles from './Minimap.module.css';

const MINIMAP_WIDTH = 280;

interface Props {
  viewport: { x: number; y: number; k: number; width: number; height: number };
  onJump: (worldX: number) => void;
}

export function Minimap({ viewport, onJump }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const visX0 = -viewport.x / viewport.k;
  const visX1 = (-viewport.x + viewport.width) / viewport.k;
  const indicatorLeft = (visX0 / WORLD_WIDTH) * MINIMAP_WIDTH;
  const indicatorWidth = Math.max(3, ((visX1 - visX0) / WORLD_WIDTH) * MINIMAP_WIDTH);

  function handleClick(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    onJump(ratio * WORLD_WIDTH);
  }

  return (
    <div className={styles.wrap}>
      <div
        ref={ref}
        className={styles.track}
        style={{ width: MINIMAP_WIDTH }}
        onClick={handleClick}
        role="slider"
        aria-label="Minimapa — clique para navegar no tempo"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((visX0 / WORLD_WIDTH) * 100)}
        tabIndex={0}
      >
        {ERAS.map((era) => {
          const theme = CHRONOTOPES[era.themeId];
          const totalStart = ERAS[0].startYear;
          const totalEnd = ERAS[ERAS.length - 1].endYear;
          const span = totalEnd - totalStart;
          const left = ((era.startYear - totalStart) / span) * MINIMAP_WIDTH;
          const width = ((era.endYear - era.startYear) / span) * MINIMAP_WIDTH;
          return (
            <div
              key={era.id}
              className={styles.segment}
              style={{ left, width: Math.max(1, width), background: theme.accent }}
              title={era.name}
            />
          );
        })}
        <div className={styles.indicator} style={{ left: indicatorLeft, width: indicatorWidth }} />
      </div>
    </div>
  );
}
