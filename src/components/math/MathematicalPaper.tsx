import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TeX } from './TeX';
import { useAtlasStore } from '@/store/atlasStore';
import styles from './MathematicalPaper.module.css';

export interface PaperStep {
  latex: string;
  narration?: string;
}

interface Props {
  title?: string;
  steps: PaperStep[];
  /** Se true, começa oculto atrás de um botão "ver solução" (usado após um "tente você mesmo"). */
  startCollapsed?: boolean;
}

/**
 * "Mathematical Paper": uma folha virtual onde uma resolução aparece sendo
 * construída passo a passo, com controles de navegação, autoplay e KaTeX.
 */
export function MathematicalPaper({ title, steps, startCollapsed = false }: Props) {
  const reducedMotion = useAtlasStore((s) => s.reducedMotion);
  const [revealed, setRevealed] = useState(!startCollapsed);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (playing && !reducedMotion) {
      intervalRef.current = window.setInterval(() => {
        setStep((s) => {
          if (s >= steps.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 1800);
    }
    return () => window.clearInterval(intervalRef.current);
  }, [playing, steps.length, reducedMotion]);

  if (!revealed) {
    return (
      <div className={styles.gate}>
        <button type="button" className={styles.gateButton} onClick={() => setRevealed(true)}>
          ✓ Ver solução
        </button>
      </div>
    );
  }

  const visibleSteps = steps.slice(0, step + 1);

  return (
    <div className={styles.paper}>
      {title && <h4 className={styles.title}>{title}</h4>}

      <div className={styles.sheet}>
        <AnimatePresence initial={false}>
          {visibleSteps.map((s, i) => (
            <motion.div
              key={i}
              className={styles.stepRow}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <TeX math={s.latex} display className={styles.tex} />
              {s.narration && i === step && (
                <motion.p
                  className={styles.narration}
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {s.narration}
                </motion.p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={() => { setPlaying(false); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0} aria-label="Passo anterior">
          ← anterior
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={step >= steps.length - 1}
          aria-label={playing ? 'Pausar' : 'Reproduzir automaticamente'}
        >
          {playing ? '⏸ pausar' : '▶ reproduzir'}
        </button>
        <button
          type="button"
          onClick={() => { setPlaying(false); setStep((s) => Math.min(steps.length - 1, s + 1)); }}
          disabled={step >= steps.length - 1}
          aria-label="Próximo passo"
        >
          próximo →
        </button>
        <span className={styles.progress}>{step + 1} / {steps.length}</span>
      </div>
    </div>
  );
}
