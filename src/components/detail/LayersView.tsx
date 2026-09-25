import { useState } from 'react';
import type { LayeredExplanation } from '@/types/content';
import { TeX } from '@/components/math/TeX';
import styles from './LayersView.module.css';

type LayerKey = 'intuition' | 'example' | 'formulaLatex' | 'derivation' | 'formal';

const LAYER_META: { key: LayerKey; label: string; hint: string }[] = [
  { key: 'intuition', label: 'Intuição', hint: 'camada 1' },
  { key: 'example', label: 'Exemplo', hint: 'camada 2' },
  { key: 'formulaLatex', label: 'Fórmula', hint: 'camada 3' },
  { key: 'derivation', label: 'Derivação', hint: 'camada 4' },
  { key: 'formal', label: 'Formal', hint: 'camada 5' },
];

export function LayersView({ layers }: { layers: LayeredExplanation }) {
  const available = LAYER_META.filter((l) => Boolean(layers[l.key]));
  const [active, setActive] = useState<LayerKey>(available[0]?.key ?? 'intuition');
  const current = layers[active];

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist" aria-label="Camadas de explicação">
        {available.map((l) => (
          <button
            key={l.key}
            type="button"
            role="tab"
            aria-selected={active === l.key}
            className={active === l.key ? styles.tabActive : styles.tab}
            onClick={() => setActive(l.key)}
          >
            <span className={styles.tabLabel}>{l.label}</span>
            <span className={styles.tabHint}>{l.hint}</span>
          </button>
        ))}
      </div>

      <div className={styles.panel} role="tabpanel">
        {active === 'formulaLatex' && current ? (
          <TeX math={current} display className={styles.tex} />
        ) : (
          <p className={styles.text}>{current}</p>
        )}
      </div>
    </div>
  );
}
