import { useState } from 'react';
import { TeX } from './TeX';
import { MathematicalPaper } from './MathematicalPaper';
import type { TryItYourself as TryItYourselfData } from '@/types/content';
import styles from './TryItYourself.module.css';

export function TryItYourself({ data }: { data: TryItYourselfData }) {
  const [hintsShown, setHintsShown] = useState(0);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.badge}>Tente você mesmo</span>
        <p className={styles.prompt}>{data.prompt}</p>
      </div>

      {data.givens.length > 0 && (
        <div className={styles.givens}>
          {data.givens.map((g, i) => (
            <TeX key={i} math={g} className={styles.given} />
          ))}
        </div>
      )}

      {data.hints.length > 0 && (
        <div className={styles.hints}>
          {data.hints.slice(0, hintsShown).map((h, i) => (
            <p key={i} className={styles.hint}>
              💡 {h}
            </p>
          ))}
          {hintsShown < data.hints.length && (
            <button type="button" className={styles.hintButton} onClick={() => setHintsShown((n) => n + 1)}>
              💡 {hintsShown === 0 ? 'Pedir uma dica' : 'Mais uma dica'}
            </button>
          )}
        </div>
      )}

      <MathematicalPaper steps={data.solutionStepsLatex.map((latex) => ({ latex }))} startCollapsed />
    </div>
  );
}
