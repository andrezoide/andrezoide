import { useNavigate } from 'react-router-dom';
import { CIVILIZATIONS } from '@/data/civilizations';
import { yearToX, formatYear } from '@/engine/timeScale';
import { laneFor, laneY } from '@/engine/layout';
import { routeFor } from '@/data';
import type { AtlasNode } from '@/types/atlas';
import styles from './CivilizationBands.module.css';

/**
 * No modo "civilização", cada civilização ganha sua própria raia e é
 * desenhada como uma faixa contínua cobrindo todo o intervalo em que esteve
 * ativa — em vez de um único ponto, que esconderia sua presença em
 * qualquer época fora do seu ano inicial.
 */
export function CivilizationBands({ k }: { k: number }) {
  const navigate = useNavigate();
  const invK = Math.min(2, Math.max(0.6, 1 / k));

  return (
    <>
      {CIVILIZATIONS.map((civ) => {
        const pseudoNode: Pick<AtlasNode, 'civilizationId' | 'kind'> = { civilizationId: civ.id, kind: 'civilization' };
        const lane = laneFor(pseudoNode as AtlasNode, 'civilization');
        const x0 = yearToX(civ.activeStart);
        const x1 = yearToX(civ.activeEnd);
        const top = laneY(lane) - 20;

        return (
          <button
            type="button"
            key={civ.id}
            className={styles.band}
            style={{ left: x0, width: Math.max(3, x1 - x0), top, height: 40 }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => navigate(routeFor('civilization', civ.id))}
            title={civ.name}
          >
            <span className={styles.labelAnchor}>
              <span className={styles.label} style={{ transform: `scaleX(${invK})` }}>
                {civ.name}
                <span className={styles.years}>
                  {formatYear(civ.activeStart)} – {formatYear(civ.activeEnd)}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </>
  );
}
