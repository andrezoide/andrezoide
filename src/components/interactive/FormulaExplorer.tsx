import { useState } from 'react';
import type { Formula } from '@/types/content';
import { TeX } from '@/components/math/TeX';
import { evaluateFormula } from '@/engine/formulaMath';
import { CircleAreaViz } from './viz/CircleAreaViz';
import { PythagoreanViz } from './viz/PythagoreanViz';
import { QuadraticGraphViz } from './viz/QuadraticGraphViz';
import styles from './FormulaExplorer.module.css';

export function FormulaExplorer({ formula }: { formula: Formula }) {
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const v of formula.variables) init[v.symbol] = v.defaultValue ?? 0;
    return init;
  });

  const result = evaluateFormula(formula.id, values);

  return (
    <div className={styles.wrap}>
      <div className={styles.formulaHead}>
        <TeX math={formula.latex} display className={styles.mainFormula} />
      </div>

      <div className={styles.controls}>
        {formula.variables.map((v) => (
          <label key={v.symbol} className={styles.control}>
            <div className={styles.controlLabel}>
              <TeX math={v.symbol} />
              <span>{v.name}</span>
              <span className={styles.controlValue}>{values[v.symbol]}</span>
            </div>
            <input
              type="range"
              min={v.min ?? 0}
              max={v.max ?? 10}
              step={v.step ?? 1}
              value={values[v.symbol]}
              onChange={(e) => setValues((prev) => ({ ...prev, [v.symbol]: Number(e.target.value) }))}
            />
            <span className={styles.controlDesc}>{v.description}</span>
          </label>
        ))}
      </div>

      <div className={styles.resultRow}>
        <span className={styles.resultLabel}>resultado</span>
        <TeX math={result.latex} className={styles.resultTex} />
        {result.note && <span className={styles.resultNote}>{result.note}</span>}
      </div>

      {formula.visualization === 'circle-area' && <CircleAreaViz r={values.r ?? 1} />}
      {formula.visualization === 'pythagorean' && <PythagoreanViz a={values.a ?? 1} b={values.b ?? 1} />}
      {formula.visualization === 'quadratic-graph' && (
        <QuadraticGraphViz
          a={formula.id === 'f-derivative-definition' ? 1 : (values.a ?? 1)}
          b={formula.id === 'f-derivative-definition' ? 0 : (values.b ?? 0)}
          c={formula.id === 'f-derivative-definition' ? 0 : (values.c ?? 0)}
          highlightX={formula.id === 'f-derivative-definition' ? values.x0 : undefined}
        />
      )}
    </div>
  );
}
