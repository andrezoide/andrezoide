import { memo } from 'react';
import type { AtlasNode } from '@/types/atlas';
import { LOD, type LodLevel } from '@/types/atlas';
import type { LensMode } from '@/store/atlasStore';
import { yearToX, formatYear } from '@/engine/timeScale';
import { laneFor, laneY } from '@/engine/layout';
import { useAtlasStore } from '@/store/atlasStore';
import styles from './NodeCard.module.css';

const KIND_ICON: Record<string, string> = {
  period: '◧',
  civilization: '◉',
  concept: '✦',
  person: '☉',
  formula: 'ƒ',
  problem: '?',
  document: '▤',
};

interface Props {
  node: AtlasNode;
  lod: LodLevel;
  lens: LensMode;
  k: number;
  onOpen: () => void;
}

function NodeCardImpl({ node, lod, lens, k, onOpen }: Props) {
  const visited = useAtlasStore((s) => s.visitedIds.has(node.id));
  const lane = laneFor(node, lens);
  const x = yearToX(node.year);
  const y = laneY(lane);
  const compact = lod <= LOD.PERIOD || node.kind === 'civilization' || node.kind === 'period';
  // Contra-escala: o texto mantém tamanho constante na tela, independente do zoom do mundo.
  const invK = Math.min(2.4, Math.max(0.55, 1 / k));

  return (
    <div className={styles.anchor} style={{ left: x, top: y }}>
      <button
        type="button"
        className={`${styles.card} ${compact ? styles.compact : ''} ${visited ? styles.visited : ''} ${styles[`kind-${node.kind}`] ?? ''}`}
        style={{ transform: `scaleX(${invK})`, ...(node.color ? { ['--node-color' as string]: node.color } : {}) }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onOpen}
        title={node.title}
      >
        <span className={styles.icon} aria-hidden="true">{KIND_ICON[node.kind] ?? '•'}</span>
        <span className={styles.title}>{node.title}</span>
        {!compact && <span className={styles.year}>{formatYear(node.year)}</span>}
      </button>
    </div>
  );
}

export const NodeCard = memo(NodeCardImpl);
